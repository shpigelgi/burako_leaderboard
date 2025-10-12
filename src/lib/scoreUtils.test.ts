import { describe, expect, it } from 'vitest';
import type { GameRecord } from '../types';
import { calculateLeaderboard } from './scoreUtils';

describe('calculateLeaderboard', () => {
  const baseGame = {
    id: 'game-1',
    playedAt: '2025-01-01T00:00:00.000Z',
    teams: [],
    scores: [],
    notes: undefined,
    auditTrail: [],
  } satisfies GameRecord;

  it('returns empty array when no games provided', () => {
    expect(calculateLeaderboard([])).toEqual([]);
  });

  it('aggregates points per player and computes averages', () => {
    const games: GameRecord[] = [
      {
        ...baseGame,
        id: 'game-1',
        playedAt: '2025-01-01T00:00:00.000Z',
        scores: [
          { playerId: 'player-1', points: 120 },
          { playerId: 'player-2', points: 80 },
        ],
      },
      {
        ...baseGame,
        id: 'game-2',
        playedAt: '2025-01-05T00:00:00.000Z',
        scores: [
          { playerId: 'player-1', points: 60 },
          { playerId: 'player-3', points: 140 },
        ],
      },
    ];

    const leaderboard = calculateLeaderboard(games);

    expect(leaderboard).toContainEqual({
      playerId: 'player-1',
      totalPoints: 180,
      gamesPlayed: 2,
      averagePoints: 90,
      lastPlayedAt: '2025-01-05T00:00:00.000Z',
    });
    expect(leaderboard).toContainEqual({
      playerId: 'player-2',
      totalPoints: 80,
      gamesPlayed: 1,
      averagePoints: 80,
      lastPlayedAt: '2025-01-01T00:00:00.000Z',
    });
    expect(leaderboard).toContainEqual({
      playerId: 'player-3',
      totalPoints: 140,
      gamesPlayed: 1,
      averagePoints: 140,
      lastPlayedAt: '2025-01-05T00:00:00.000Z',
    });
  });

  it('rounds averages to two decimals', () => {
    const games: GameRecord[] = [
      {
        ...baseGame,
        id: 'game-1',
        playedAt: '2025-01-01T00:00:00.000Z',
        scores: [{ playerId: 'player-1', points: 33 }],
      },
      {
        ...baseGame,
        id: 'game-2',
        playedAt: '2025-01-02T00:00:00.000Z',
        scores: [{ playerId: 'player-1', points: 34 }],
      },
    ];

    const [entry] = calculateLeaderboard(games);
    expect(entry.averagePoints).toBe(33.5);
  });
});
