import type { GameRecord, LeaderboardEntry, PlayerId } from '../types';

export interface PlayerAggregate {
  playerId: PlayerId;
  totalPoints: number;
  gamesPlayed: number;
  lastPlayedAt?: string;
}

export const emptyAggregate = (): PlayerAggregate => ({
  playerId: '',
  totalPoints: 0,
  gamesPlayed: 0,
});

export function calculateLeaderboard(records: GameRecord[]): LeaderboardEntry[] {
  const aggregates = new Map<PlayerId, PlayerAggregate>();

  for (const record of records) {
    for (const score of record.scores) {
      const existing = aggregates.get(score.playerId) ?? {
        playerId: score.playerId,
        totalPoints: 0,
        gamesPlayed: 0,
        lastPlayedAt: undefined,
      };

      existing.totalPoints += score.points;
      existing.gamesPlayed += 1;
      existing.lastPlayedAt = record.playedAt;
      aggregates.set(score.playerId, existing);
    }
  }

  return Array.from(aggregates.values()).map((aggregate) => ({
    playerId: aggregate.playerId,
    totalPoints: aggregate.totalPoints,
    gamesPlayed: aggregate.gamesPlayed,
    averagePoints:
      aggregate.gamesPlayed === 0
        ? 0
        : Number((aggregate.totalPoints / aggregate.gamesPlayed).toFixed(2)),
    lastPlayedAt: aggregate.lastPlayedAt,
  }));
}
