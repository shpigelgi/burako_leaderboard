import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createId } from '../lib/id';
import { DEFAULT_GROUP_ID } from '../data/mockData';
import type {
  AuditEntry,
  GameId,
  GameRecord,
  GameScore,
  GameSnapshot,
  GameUpdate,
  Group,
  GroupId,
  NewGameInput,
  Pair,
  Player,
  TeamResult,
} from '../types';
import type { ScoreRepository } from './scoreRepository';

const groupsCollection = collection(db, 'groups');
const playersCollection = collection(db, 'players');

const toNullable = (value: unknown) => (value === undefined ? null : value);

const toIsoString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
};

const ensureArray = <T>(value: unknown, fallback: T[]): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

const auditEntryFromData = (entry: DocumentData): AuditEntry => ({
  id: entry.id,
  gameId: entry.gameId,
  timestamp: toIsoString(entry.timestamp),
  summary: entry.summary,
  type: entry.type,
  snapshot: {
    teams: ensureArray(entry.snapshot?.teams, []),
    scores: ensureArray(entry.snapshot?.scores, []),
    notes: entry.snapshot?.notes ?? undefined,
  },
});

const gameRecordFromDoc = (docData: DocumentData, id: string, groupId: GroupId): GameRecord => ({
  id,
  groupId,
  playedAt: toIsoString(docData.playedAt),
  teams: ensureArray<TeamResult>(docData.teams, []),
  scores: ensureArray<GameScore>(docData.scores, []),
  notes: docData.notes ?? undefined,
  auditTrail: ensureArray<DocumentData>(docData.auditTrail, []).map(auditEntryFromData),
});

const buildSnapshot = (
  teams: TeamResult[],
  scores: GameScore[],
  notes: string | undefined,
  playedAt: string | undefined,
): GameSnapshot => {
  const snapshot: GameSnapshot = {
    teams: teams.map((team) => ({ ...team, canasta: { ...team.canasta } })),
    scores: scores.map((score) => ({ ...score })),
  };
  if (notes !== undefined && notes !== null) {
    snapshot.notes = notes;
  }
  if (playedAt) {
    snapshot.playedAt = playedAt;
  }
  return snapshot;
};

export class FirebaseScoreRepository implements ScoreRepository {
  // Group management
  async listGroups(): Promise<Group[]> {
    const snapshot = await getDocs(query(groupsCollection));
    return snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    } as Group));
  }

  async createGroup(name: string): Promise<Group> {
    const groupDoc = doc(groupsCollection);
    const group: Group = {
      id: groupDoc.id,
      name,
      createdAt: new Date().toISOString(),
    };
    await setDoc(groupDoc, group);
    return group;
  }

  async deleteGroup(groupId: GroupId): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete group document
    batch.delete(doc(groupsCollection, groupId));
    
    // Delete all subcollections (members, pairs, games)
    const membersSnapshot = await getDocs(collection(db, `groups/${groupId}/members`));
    membersSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    const pairsSnapshot = await getDocs(collection(db, `groups/${groupId}/pairs`));
    pairsSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    const gamesSnapshot = await getDocs(collection(db, `groups/${groupId}/games`));
    gamesSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
  }

  // Player management (global)
  async listAllPlayers(): Promise<Player[]> {
    const snapshot = await getDocs(query(playersCollection));
    return snapshot.docs.map((docSnapshot) => docSnapshot.data() as Player);
  }

  async createPlayer(name: string): Promise<Player> {
    const playerDoc = doc(playersCollection);
    const player: Player = {
      id: playerDoc.id,
      name,
    };
    await setDoc(playerDoc, player);
    return player;
  }

  async updatePlayer(playerId: string, name: string): Promise<Player> {
    const playerDoc = doc(playersCollection, playerId);
    const player: Player = {
      id: playerId,
      name,
    };
    await setDoc(playerDoc, player);
    return player;
  }

  async deletePlayer(playerId: string): Promise<void> {
    await deleteDoc(doc(playersCollection, playerId));
  }

  // Group membership
  async listGroupMembers(groupId: GroupId): Promise<Player[]> {
    const membersCollection = collection(db, `groups/${groupId}/members`);
    const snapshot = await getDocs(query(membersCollection));
    const playerIds = snapshot.docs.map((docSnapshot) => docSnapshot.id);
    
    if (playerIds.length === 0) {
      return [];
    }
    
    // Fetch player details
    const players: Player[] = [];
    for (const playerId of playerIds) {
      const playerDoc = await getDoc(doc(playersCollection, playerId));
      if (playerDoc.exists()) {
        players.push(playerDoc.data() as Player);
      }
    }
    return players;
  }

  async addPlayerToGroup(groupId: GroupId, playerId: string): Promise<void> {
    const memberDoc = doc(db, `groups/${groupId}/members/${playerId}`);
    await setDoc(memberDoc, {
      joinedAt: new Date().toISOString(),
    });
  }

  async removePlayerFromGroup(groupId: GroupId, playerId: string): Promise<void> {
    const memberDoc = doc(db, `groups/${groupId}/members/${playerId}`);
    await deleteDoc(memberDoc);
  }

  // Pairs (group-scoped)
  async listPairs(groupId: GroupId): Promise<Pair[]> {
    const pairsCollection = collection(db, `groups/${groupId}/pairs`);
    const snapshot = await getDocs(query(pairsCollection));
    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        groupId,
        players: data.players as [string, string],
      };
    });
  }

  async createPair(groupId: GroupId, players: [string, string]): Promise<Pair> {
    const pairsCollection = collection(db, `groups/${groupId}/pairs`);
    const pairDoc = doc(pairsCollection);
    const pair: Pair = {
      id: pairDoc.id,
      groupId,
      players,
    };
    await setDoc(pairDoc, { players });
    return pair;
  }

  // Games (group-scoped)
  async listGames(groupId: GroupId): Promise<GameRecord[]> {
    const gamesCollection = collection(db, `groups/${groupId}/games`);
    const snapshot = await getDocs(query(gamesCollection));
    return snapshot.docs.map((docSnapshot) =>
      gameRecordFromDoc(docSnapshot.data(), docSnapshot.id, groupId),
    );
  }

  async addGame(groupId: GroupId, input: NewGameInput): Promise<GameRecord> {
    const gamesCollection = collection(db, `groups/${groupId}/games`);
    const gameDoc = doc(gamesCollection);
    const gameId = gameDoc.id;
    const playedAt = input.playedAt ?? new Date().toISOString();
    const notes = input.notes ?? undefined;

    const auditEntry: AuditEntry = {
      id: createId('audit'),
      gameId,
      timestamp: new Date().toISOString(),
      summary: 'Game recorded',
      type: 'create',
      snapshot: buildSnapshot(input.teams, input.scores, notes, playedAt),
    };

    await setDoc(gameDoc, {
      playedAt,
      teams: input.teams,
      scores: input.scores,
      notes: toNullable(notes),
      auditTrail: [auditEntry],
    });

    const createdDoc = await getDoc(gameDoc);
    return gameRecordFromDoc(createdDoc.data() ?? {}, gameId, groupId);
  }

  async updateGame(groupId: GroupId, id: GameId, update: GameUpdate): Promise<GameRecord> {
    const gameDoc = doc(db, `groups/${groupId}/games/${id}`);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(gameDoc);
      if (!snapshot.exists()) {
        throw new Error('Game not found');
      }
      const data = snapshot.data();
      const currentTeams: TeamResult[] = ensureArray(data.teams, []);
      const currentScores: GameScore[] = ensureArray(data.scores, []);
      const currentNotes: string | undefined = data.notes ?? undefined;
      const currentPlayedAt: string | undefined = data.playedAt ? toIsoString(data.playedAt) : undefined;

      const nextTeams = update.teams ?? currentTeams;
      const nextScores = update.scores ?? currentScores;
      const nextNotes = update.notes !== undefined ? update.notes : currentNotes;
      const nextPlayedAt = update.playedAt ?? currentPlayedAt;

      const auditEntry: AuditEntry = {
        id: createId('audit'),
        gameId: id,
        timestamp: new Date().toISOString(),
        summary: 'Game updated',
        type: 'update',
        snapshot: buildSnapshot(currentTeams, currentScores, currentNotes, currentPlayedAt),
      };

      transaction.update(gameDoc, {
        teams: nextTeams,
        scores: nextScores,
        notes: toNullable(nextNotes),
        playedAt: nextPlayedAt,
        auditTrail: [...ensureArray<DocumentData>(data.auditTrail, []), auditEntry],
      });
    });

    const updatedDoc = await getDoc(gameDoc);
    if (!updatedDoc.exists()) {
      throw new Error('Game not found');
    }
    return gameRecordFromDoc(updatedDoc.data(), updatedDoc.id, groupId);
  }

  async undoLastChange(groupId: GroupId, id: GameId): Promise<GameRecord> {
    const gameDoc = doc(db, `groups/${groupId}/games/${id}`);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(gameDoc);
      if (!snapshot.exists()) {
        throw new Error('Game not found');
      }
      const data = snapshot.data();
      const auditTrail = ensureArray<DocumentData>(data.auditTrail, []);
      if (auditTrail.length <= 1) {
        throw new Error('Nothing to undo');
      }

      const lastEntry = auditTrail[auditTrail.length - 1];
      const restoredSnapshot = buildSnapshot(
        ensureArray<TeamResult>(lastEntry.snapshot?.teams, ensureArray(data.teams, [])),
        ensureArray<GameScore>(lastEntry.snapshot?.scores, ensureArray(data.scores, [])),
        lastEntry.snapshot?.notes ?? data.notes ?? undefined,
        lastEntry.snapshot?.playedAt ?? (data.playedAt ? toIsoString(data.playedAt) : undefined),
      );

      const auditEntry: AuditEntry = {
        id: createId('audit'),
        gameId: id,
        timestamp: new Date().toISOString(),
        summary: 'Undo applied',
        type: 'undo',
        snapshot: buildSnapshot(
          ensureArray<TeamResult>(data.teams, []),
          ensureArray<GameScore>(data.scores, []),
          data.notes ?? undefined,
          data.playedAt ? toIsoString(data.playedAt) : undefined,
        ),
      };

      transaction.update(gameDoc, {
        teams: restoredSnapshot.teams,
        scores: restoredSnapshot.scores,
        notes: toNullable(restoredSnapshot.notes),
        playedAt: restoredSnapshot.playedAt ?? (data.playedAt ? toIsoString(data.playedAt) : undefined),
        auditTrail: [...auditTrail.slice(0, -1), auditEntry],
      });
    });

    const updatedDoc = await getDoc(gameDoc);
    if (!updatedDoc.exists()) {
      throw new Error('Game not found');
    }
    return gameRecordFromDoc(updatedDoc.data(), updatedDoc.id, groupId);
  }

  async deleteGame(groupId: GroupId, id: GameId): Promise<void> {
    await deleteDoc(doc(db, `groups/${groupId}/games/${id}`));
  }

  // Legacy methods for migration
  async legacyListPlayers(): Promise<Player[]> {
    const snapshot = await getDocs(query(playersCollection));
    return snapshot.docs.map((docSnapshot) => docSnapshot.data() as Player);
  }

  async legacyListPairs(): Promise<Pair[]> {
    const pairsCollection = collection(db, 'pairs');
    const snapshot = await getDocs(query(pairsCollection));
    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        groupId: DEFAULT_GROUP_ID,
        players: data.players as [string, string],
      };
    });
  }

  async legacyListGames(): Promise<GameRecord[]> {
    const gamesCollection = collection(db, 'games');
    const snapshot = await getDocs(query(gamesCollection));
    return snapshot.docs.map((docSnapshot) =>
      gameRecordFromDoc(docSnapshot.data(), docSnapshot.id, DEFAULT_GROUP_ID),
    );
  }
}

export const subscribeToGames = (
  groupId: GroupId,
  onChange: (records: GameRecord[]) => void,
  onError: (error: Error) => void,
) => {
  const gamesCollection = collection(db, `groups/${groupId}/games`);
  return onSnapshot(
    gamesCollection,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) =>
        gameRecordFromDoc(docSnapshot.data(), docSnapshot.id, groupId),
      );
      onChange(records);
    },
    (error) => onError(error as Error),
  );
};
