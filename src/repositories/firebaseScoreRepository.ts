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
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createId } from '../lib/id';
import { mockPairs, mockPlayers } from '../data/mockData';
import type {
  AuditEntry,
  GameId,
  GameRecord,
  GameScore,
  GameSnapshot,
  GameUpdate,
  NewGameInput,
  Pair,
  Player,
  TeamResult,
} from '../types';
import type { ScoreRepository } from './scoreRepository';

const playersCollection = collection(db, 'players');
const pairsCollection = collection(db, 'pairs');
const gamesCollection = collection(db, 'games');

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

const gameRecordFromDoc = (docData: DocumentData, id: string): GameRecord => ({
  id,
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
  private seeded = false;

  private async ensureSeedData() {
    if (this.seeded) {
      return;
    }
    this.seeded = true;

    const [playerSnapshot, pairSnapshot] = await Promise.all([
      getDocs(query(playersCollection)),
      getDocs(query(pairsCollection)),
    ]);

    if (playerSnapshot.empty) {
      await Promise.all(
        mockPlayers.map((player) => setDoc(doc(playersCollection, player.id), player, { merge: true })),
      );
    }

    if (pairSnapshot.empty) {
      await Promise.all(
        mockPairs.map((pair) => setDoc(doc(pairsCollection, pair.id), pair, { merge: true })),
      );
    }
  }

  async listPlayers(): Promise<Player[]> {
    await this.ensureSeedData();
    const snapshot = await getDocs(query(playersCollection));
    return snapshot.docs.map((docSnapshot) => docSnapshot.data() as Player);
  }

  async listPairs(): Promise<Pair[]> {
    await this.ensureSeedData();
    const snapshot = await getDocs(query(pairsCollection));
    return snapshot.docs.map((docSnapshot) => docSnapshot.data() as Pair);
  }

  async listGames(): Promise<GameRecord[]> {
    const snapshot = await getDocs(query(gamesCollection));
    return snapshot.docs.map((docSnapshot) => gameRecordFromDoc(docSnapshot.data(), docSnapshot.id));
  }

  async addGame(input: NewGameInput): Promise<GameRecord> {
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
    return gameRecordFromDoc(createdDoc.data() ?? {}, gameId);
  }

  async updateGame(id: GameId, update: GameUpdate): Promise<GameRecord> {
    const gameDoc = doc(gamesCollection, id);

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
    return gameRecordFromDoc(updatedDoc.data(), updatedDoc.id);
  }

  async undoLastChange(id: GameId): Promise<GameRecord> {
    const gameDoc = doc(gamesCollection, id);

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
    return gameRecordFromDoc(updatedDoc.data(), updatedDoc.id);
  }

  async deleteGame(id: GameId): Promise<void> {
    await deleteDoc(doc(gamesCollection, id));
  }
}

export const subscribeToGames = (
  onChange: (records: GameRecord[]) => void,
  onError: (error: Error) => void,
) =>
  onSnapshot(
    gamesCollection,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) =>
        gameRecordFromDoc(docSnapshot.data(), docSnapshot.id),
      );
      onChange(records);
    },
    (error) => onError(error as Error),
  );
