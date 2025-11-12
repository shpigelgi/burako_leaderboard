import { describe, it, expect } from 'vitest';
import { calculateLeaderboard, calculatePairLeaderboard, calculateGameLeaderboard } from '../../lib/scoreUtils';
import type { GameRecord } from '../../types';

describe('calculateLeaderboard', () => {
  it('returns empty array for no games', () => {
    expect(calculateLeaderboard([])).toEqual([]);
  });

  it('calculates player statistics correctly', () => {
    const games: GameRecord[] = [
      {
        id: 'g1',
        groupId: 'group1',
        playedAt: '2025-01-01T00:00:00Z',
        teams: [],
        scores: [
          { playerId: 'p1', points: 100 },
          { playerId: 'p2', points: 200 },
        ],
        auditTrail: [],
      },
    ];

    const result = calculateLeaderboard(games);
    expect(result).toHaveLength(2);
    expect(result[0].playerId).toBe('p2');
    expect(result[0].totalPoints).toBe(200);
    expect(result[1].playerId).toBe('p1');
    expect(result[1].totalPoints).toBe(100);
  });

  it('aggregates multiple games per player', () => {
    const games: GameRecord[] = [
      {
        id: 'g1',
        groupId: 'group1',
        playedAt: '2025-01-01T00:00:00Z',
        teams: [],
        scores: [{ playerId: 'p1', points: 100 }],
        auditTrail: [],
      },
      {
        id: 'g2',
        groupId: 'group1',
        playedAt: '2025-01-02T00:00:00Z',
        teams: [],
        scores: [{ playerId: 'p1', points: 150 }],
        auditTrail: [],
      },
    ];

    const result = calculateLeaderboard(games);
    expect(result).toHaveLength(1);
    expect(result[0].totalPoints).toBe(250);
    expect(result[0].gamesPlayed).toBe(2);
    expect(result[0].averagePoints).toBe(125);
  });
});

describe('calculatePairLeaderboard', () => {
  it('returns empty array for no games', () => {
    expect(calculatePairLeaderboard([])).toEqual([]);
  });

  it('calculates pair statistics correctly', () => {
    const games: GameRecord[] = [
      {
        id: 'g1',
        groupId: 'group1',
        playedAt: '2025-01-01T00:00:00Z',
        teams: [
          { 
            pairId: 'pair1', 
            totalPoints: 300, 
            canasta: { cleanCanastas: 1, dirtyCanastas: 0 }, 
            scoring: { 
              mode: 'manual' as const, 
              enteredTotal: 300, 
              breakdown: 'Manual entry',
              components: { cardPoints: 0, canastaPoints: 0, winnerBonus: 0, muertoBonus: 0, minusPoints: 0 }
            } 
          },
        ],
        scores: [],
        auditTrail: [],
      },
    ];

    const result = calculatePairLeaderboard(games);
    expect(result).toHaveLength(1);
    expect(result[0].pairId).toBe('pair1');
    expect(result[0].totalPoints).toBe(300);
  });
});

describe('calculateGameLeaderboard', () => {
  it('returns empty array for no games', () => {
    expect(calculateGameLeaderboard([])).toEqual([]);
  });

  it('assigns game numbers chronologically', () => {
    const games: GameRecord[] = [
      {
        id: 'g2',
        groupId: 'group1',
        playedAt: '2025-01-02T00:00:00Z',
        teams: [
          { 
            pairId: 'pair1', 
            totalPoints: 200, 
            canasta: { cleanCanastas: 0, dirtyCanastas: 0 }, 
            scoring: { mode: 'manual' as const, enteredTotal: 200, breakdown: '', components: { cardPoints: 0, canastaPoints: 0, winnerBonus: 0, muertoBonus: 0, minusPoints: 0 } } 
          },
          { 
            pairId: 'pair2', 
            totalPoints: 100, 
            canasta: { cleanCanastas: 0, dirtyCanastas: 0 }, 
            scoring: { mode: 'manual' as const, enteredTotal: 100, breakdown: '', components: { cardPoints: 0, canastaPoints: 0, winnerBonus: 0, muertoBonus: 0, minusPoints: 0 } } 
          },
        ],
        scores: [{ playerId: 'p1', points: 200 }],
        auditTrail: [],
      },
      {
        id: 'g1',
        groupId: 'group1',
        playedAt: '2025-01-01T00:00:00Z',
        teams: [
          { 
            pairId: 'pair1', 
            totalPoints: 150, 
            canasta: { cleanCanastas: 0, dirtyCanastas: 0 }, 
            scoring: { mode: 'manual' as const, enteredTotal: 150, breakdown: '', components: { cardPoints: 0, canastaPoints: 0, winnerBonus: 0, muertoBonus: 0, minusPoints: 0 } } 
          },
          { 
            pairId: 'pair2', 
            totalPoints: 50, 
            canasta: { cleanCanastas: 0, dirtyCanastas: 0 }, 
            scoring: { mode: 'manual' as const, enteredTotal: 50, breakdown: '', components: { cardPoints: 0, canastaPoints: 0, winnerBonus: 0, muertoBonus: 0, minusPoints: 0 } } 
          },
        ],
        scores: [{ playerId: 'p1', points: 100 }],
        auditTrail: [],
      },
    ];

    const result = calculateGameLeaderboard(games);
    expect(result).toHaveLength(2);
    expect(result[0].gameNumber).toBe(1);
    expect(result[0].gameId).toBe('g1');
    expect(result[1].gameNumber).toBe(2);
    expect(result[1].gameId).toBe('g2');
  });
});
