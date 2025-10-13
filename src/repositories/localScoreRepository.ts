import type {
  GameId,
  GameRecord,
  GameSnapshot,
  GameUpdate,
  NewGameInput,
  Pair,
  Player,
} from '../types';
import { mockGames, mockPairs, mockPlayers } from '../data/mockData';
import { createId } from '../lib/id';
import type { ScoreRepository } from './scoreRepository';

const STORAGE_KEY = 'burako-games';

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

const readGames = (): GameRecord[] => {
  const storage = getStorage();
  if (!storage) {
    return mockGames.map(cloneGame);
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    storage.setItem(STORAGE_KEY, JSON.stringify(mockGames));
    return mockGames.map(cloneGame);
  }
  try {
    const parsed = JSON.parse(raw) as GameRecord[];
    return parsed.map(cloneGame);
  } catch {
    storage.setItem(STORAGE_KEY, JSON.stringify(mockGames));
    return mockGames.map(cloneGame);
  }
};

const writeGames = (games: GameRecord[]): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(games));
};

export class LocalScoreRepository implements ScoreRepository {
  async listPlayers(): Promise<Player[]> {
    return mockPlayers.map((player) => ({ ...player }));
  }

  async listPairs(): Promise<Pair[]> {
    return mockPairs.map((pair) => ({ ...pair, players: [...pair.players] }));
  }

  async listGames(): Promise<GameRecord[]> {
    return readGames();
  }

  async addGame(input: NewGameInput): Promise<GameRecord> {
    const games = readGames();
    const nowIso = new Date().toISOString();
    const gameId: GameId = createId('game');

    const baseRecord: GameRecord = {
      id: gameId,
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

    const nextGames = [...games, baseRecord];
    writeGames(nextGames);
    return cloneGame(baseRecord);
  }

  async updateGame(id: GameId, update: GameUpdate): Promise<GameRecord> {
    const games = readGames();
    const index = games.findIndex((game) => game.id === id);
    if (index === -1) {
      throw new Error('Game not found');
    }

    const current = games[index];
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

    games[index] = current;
    writeGames(games);
    return cloneGame(current);
  }

  async undoLastChange(id: GameId): Promise<GameRecord> {
    const games = readGames();
    const index = games.findIndex((game) => game.id === id);
    if (index === -1) {
      throw new Error('Game not found');
    }

    const current = games[index];
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

    games[index] = current;
    writeGames(games);
    return cloneGame(current);
  }

  async deleteGame(id: GameId): Promise<void> {
    const games = readGames();
    const index = games.findIndex((game) => game.id === id);
    if (index === -1) {
      throw new Error('Game not found');
    }
    games.splice(index, 1);
    writeGames(games);
  }
}
