import type {
  GameId,
  GameRecord,
  GameSnapshot,
  GameUpdate,
  Group,
  GroupId,
  NewGameInput,
  Pair,
  Player,
} from '../types';
import { DEFAULT_GROUP_ID, mockGames, mockPairs, mockPlayers } from '../data/mockData';
import { createId } from '../lib/id';
import type { ScoreRepository } from './scoreRepository';

const GROUPS_KEY = 'burako-groups';
const PLAYERS_KEY = 'burako-players';
const STORAGE_PREFIX = 'burako-group-';

const getStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }
  return window.localStorage;
};

const cloneGame = (game: GameRecord): GameRecord => ({
  ...game,
  teams: game.teams.map((team) => ({
    ...team,
    canasta: { ...team.canasta },
  })),
  scores: game.scores.map((score) => ({ ...score })),
  auditTrail: game.auditTrail.map((entry) => ({
    ...entry,
    snapshot: {
      teams: entry.snapshot.teams.map((team) => ({
        ...team,
        canasta: { ...team.canasta },
      })),
      scores: entry.snapshot.scores.map((score) => ({ ...score })),
      notes: entry.snapshot.notes,
    },
  })),
});

const createSnapshot = (game: GameRecord): GameSnapshot => ({
  teams: game.teams.map((team) => ({
    ...team,
    canasta: { ...team.canasta },
  })),
  scores: game.scores.map((score) => ({ ...score })),
  notes: game.notes,
  playedAt: game.playedAt,
});

interface GroupData {
  members: string[];
  pairs: Pair[];
  games: GameRecord[];
}

const readGroups = (): Group[] => {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  const raw = storage.getItem(GROUPS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as Group[];
  } catch {
    return [];
  }
};

const writeGroups = (groups: Group[]): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(GROUPS_KEY, JSON.stringify(groups));
};

const readGroupData = (groupId: GroupId): GroupData => {
  const storage = getStorage();
  if (!storage) {
    return { members: [], pairs: [], games: [] };
  }
  const key = `${STORAGE_PREFIX}${groupId}`;
  const raw = storage.getItem(key);
  if (!raw) {
    return { members: [], pairs: [], games: [] };
  }
  try {
    return JSON.parse(raw) as GroupData;
  } catch {
    return { members: [], pairs: [], games: [] };
  }
};

const writeGroupData = (groupId: GroupId, data: GroupData): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  const key = `${STORAGE_PREFIX}${groupId}`;
  storage.setItem(key, JSON.stringify(data));
};

const readAllPlayers = (): Player[] => {
  const storage = getStorage();
  if (!storage) {
    return mockPlayers.map((p) => ({ ...p }));
  }
  const raw = storage.getItem(PLAYERS_KEY);
  if (!raw) {
    storage.setItem(PLAYERS_KEY, JSON.stringify(mockPlayers));
    return mockPlayers.map((p) => ({ ...p }));
  }
  try {
    return JSON.parse(raw) as Player[];
  } catch {
    storage.setItem(PLAYERS_KEY, JSON.stringify(mockPlayers));
    return mockPlayers.map((p) => ({ ...p }));
  }
};

const writeAllPlayers = (players: Player[]): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(PLAYERS_KEY, JSON.stringify(players));
};

export class LocalScoreRepository implements ScoreRepository {
  // Group management
  async listGroups(): Promise<Group[]> {
    return readGroups();
  }

  async createGroup(name: string): Promise<Group> {
    const groups = readGroups();
    const group: Group = {
      id: createId('group'),
      name,
      createdAt: new Date().toISOString(),
    };
    groups.push(group);
    writeGroups(groups);
    
    // Initialize empty group data
    writeGroupData(group.id, { members: [], pairs: [], games: [] });
    
    return group;
  }

  async updateGroup(groupId: GroupId, name: string): Promise<Group> {
    const groups = readGroups();
    const index = groups.findIndex((g) => g.id === groupId);
    
    if (index === -1) {
      throw new Error('Group not found');
    }
    
    groups[index].name = name;
    writeGroups(groups);
    return groups[index];
  }

  async deleteGroup(groupId: GroupId): Promise<void> {
    const groups = readGroups();
    const filtered = groups.filter((g) => g.id !== groupId);
    writeGroups(filtered);
    
    // Delete group data
    const storage = getStorage();
    if (storage) {
      storage.removeItem(`${STORAGE_PREFIX}${groupId}`);
    }
  }

  // Player management (global)
  async listAllPlayers(): Promise<Player[]> {
    return readAllPlayers();
  }

  async createPlayer(name: string): Promise<Player> {
    const players = readAllPlayers();
    const player: Player = {
      id: createId('player'),
      name,
    };
    players.push(player);
    writeAllPlayers(players);
    return player;
  }

  async updatePlayer(playerId: string, name: string): Promise<Player> {
    const players = readAllPlayers();
    const index = players.findIndex((p) => p.id === playerId);
    if (index === -1) {
      throw new Error('Player not found');
    }
    players[index].name = name;
    writeAllPlayers(players);
    return players[index];
  }

  async deletePlayer(playerId: string): Promise<void> {
    const players = readAllPlayers();
    const filtered = players.filter((p) => p.id !== playerId);
    writeAllPlayers(filtered);
  }

  // Group membership
  async listGroupMembers(groupId: GroupId): Promise<Player[]> {
    const data = readGroupData(groupId);
    const allPlayers = readAllPlayers();
    return allPlayers.filter((p) => data.members.includes(p.id));
  }

  async addPlayerToGroup(groupId: GroupId, playerId: string): Promise<void> {
    const data = readGroupData(groupId);
    if (!data.members.includes(playerId)) {
      data.members.push(playerId);
      writeGroupData(groupId, data);
    }
  }

  async removePlayerFromGroup(groupId: GroupId, playerId: string): Promise<void> {
    const data = readGroupData(groupId);
    data.members = data.members.filter((id) => id !== playerId);
    writeGroupData(groupId, data);
  }

  // Pairs (group-scoped)
  async listPairs(groupId: GroupId): Promise<Pair[]> {
    const data = readGroupData(groupId);
    return data.pairs.map((pair) => ({ ...pair, players: [...pair.players] }));
  }

  async createPair(groupId: GroupId, players: [string, string]): Promise<Pair> {
    const data = readGroupData(groupId);
    const pair: Pair = {
      id: createId('pair'),
      groupId,
      players,
    };
    data.pairs.push(pair);
    writeGroupData(groupId, data);
    return pair;
  }

  // Games (group-scoped)
  async listGames(groupId: GroupId): Promise<GameRecord[]> {
    const data = readGroupData(groupId);
    return data.games.map(cloneGame);
  }

  async addGame(groupId: GroupId, input: NewGameInput): Promise<GameRecord> {
    const data = readGroupData(groupId);
    const nowIso = new Date().toISOString();
    const gameId: GameId = createId('game');

    const baseRecord: GameRecord = {
      id: gameId,
      groupId,
      playedAt: input.playedAt ?? nowIso,
      teams: input.teams.map((team) => ({
        ...team,
        canasta: { ...team.canasta },
      })),
      scores: input.scores.map((score) => ({ ...score })),
      notes: input.notes,
      auditTrail: [],
    };

    const snapshot = createSnapshot(baseRecord);
    const auditEntry = {
      id: createId('audit'),
      gameId,
      timestamp: nowIso,
      summary: 'Game recorded',
      type: 'create' as const,
      snapshot,
    };

    baseRecord.auditTrail.push(auditEntry);
    data.games.push(baseRecord);
    writeGroupData(groupId, data);
    return cloneGame(baseRecord);
  }

  async updateGame(groupId: GroupId, id: GameId, update: GameUpdate): Promise<GameRecord> {
    const data = readGroupData(groupId);
    const index = data.games.findIndex((game) => game.id === id);
    if (index === -1) {
      throw new Error('Game not found');
    }

    const current = data.games[index];
    const snapshot = createSnapshot(current);

    if (update.teams) {
      current.teams = update.teams.map((team) => ({
        ...team,
        canasta: { ...team.canasta },
      }));
    }

    if (update.scores) {
      current.scores = update.scores.map((score) => ({ ...score }));
    }

    if (update.notes !== undefined) {
      current.notes = update.notes;
    }

    if (update.playedAt) {
      current.playedAt = update.playedAt;
    }

    const nowIso = new Date().toISOString();
    current.auditTrail.push({
      id: createId('audit'),
      gameId: id,
      timestamp: nowIso,
      summary: 'Game updated',
      type: 'update',
      snapshot,
    });

    data.games[index] = current;
    writeGroupData(groupId, data);
    return cloneGame(current);
  }

  async undoLastChange(groupId: GroupId, id: GameId): Promise<GameRecord> {
    const data = readGroupData(groupId);
    const index = data.games.findIndex((game) => game.id === id);
    if (index === -1) {
      throw new Error('Game not found');
    }

    const current = data.games[index];
    if (current.auditTrail.length <= 1) {
      throw new Error('Nothing to undo');
    }

    const lastEntry = current.auditTrail.pop();
    if (!lastEntry) {
      throw new Error('No audit entry');
    }

    const previousSnapshot = lastEntry.snapshot;
    current.teams = previousSnapshot.teams.map((team) => ({
      ...team,
      canasta: { ...team.canasta },
    }));
    current.scores = previousSnapshot.scores.map((score) => ({ ...score }));
    current.notes = previousSnapshot.notes;
    if (previousSnapshot.playedAt) {
      current.playedAt = previousSnapshot.playedAt;
    }

    const nowIso = new Date().toISOString();
    current.auditTrail.push({
      id: createId('audit'),
      gameId: id,
      timestamp: nowIso,
      summary: 'Undo applied',
      type: 'undo',
      snapshot: createSnapshot(current),
    });

    data.games[index] = current;
    writeGroupData(groupId, data);
    return cloneGame(current);
  }

  async deleteGame(groupId: GroupId, id: GameId): Promise<void> {
    const data = readGroupData(groupId);
    const index = data.games.findIndex((game) => game.id === id);
    if (index === -1) {
      throw new Error('Game not found');
    }
    data.games.splice(index, 1);
    writeGroupData(groupId, data);
  }

  // Legacy methods for migration
  async legacyListPlayers(): Promise<Player[]> {
    return readAllPlayers();
  }

  async legacyListPairs(): Promise<Pair[]> {
    return mockPairs.map((pair) => ({ ...pair, players: [...pair.players] }));
  }

  async legacyListGames(): Promise<GameRecord[]> {
    const storage = getStorage();
    if (!storage) {
      return mockGames.map(cloneGame);
    }
    const raw = storage.getItem('burako-games');
    if (!raw) {
      return mockGames.map(cloneGame);
    }
    try {
      const parsed = JSON.parse(raw) as GameRecord[];
      return parsed.map((g) => ({ ...cloneGame(g), groupId: DEFAULT_GROUP_ID }));
    } catch {
      return mockGames.map(cloneGame);
    }
  }
}
