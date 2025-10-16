import type {
  GameLeaderboardEntry,
  GameRecord,
  LeaderboardEntry,
  PairId,
  PairLeaderboardEntry,
  PlayerId,
} from '../types';

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

  return Array.from(aggregates.values())
    .map((aggregate) => ({
      playerId: aggregate.playerId,
      totalPoints: aggregate.totalPoints,
      gamesPlayed: aggregate.gamesPlayed,
      averagePoints:
        aggregate.gamesPlayed === 0
          ? 0
          : Number((aggregate.totalPoints / aggregate.gamesPlayed).toFixed(2)),
      lastPlayedAt: aggregate.lastPlayedAt,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.averagePoints - a.averagePoints);
}

export interface PairAggregate {
  pairId: PairId;
  totalPoints: number;
  gamesPlayed: number;
  lastPlayedAt?: string;
}

export function calculatePairLeaderboard(records: GameRecord[]): PairLeaderboardEntry[] {
  const aggregates = new Map<PairId, PairAggregate>();

  for (const record of records) {
    for (const team of record.teams) {
      const existing = aggregates.get(team.pairId) ?? {
        pairId: team.pairId,
        totalPoints: 0,
        gamesPlayed: 0,
        lastPlayedAt: undefined,
      };

      existing.totalPoints += team.totalPoints;
      existing.gamesPlayed += 1;
      existing.lastPlayedAt = record.playedAt;
      aggregates.set(team.pairId, existing);
    }
  }

  return Array.from(aggregates.values())
    .map((aggregate) => ({
      pairId: aggregate.pairId,
      totalPoints: aggregate.totalPoints,
      gamesPlayed: aggregate.gamesPlayed,
      averagePoints:
        aggregate.gamesPlayed === 0
          ? 0
          : Number((aggregate.totalPoints / aggregate.gamesPlayed).toFixed(2)),
      lastPlayedAt: aggregate.lastPlayedAt,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.averagePoints - a.averagePoints);
}

export function calculateGameLeaderboard(records: GameRecord[]): GameLeaderboardEntry[] {
  return records
    .map((record) => {
      const sortedTeams = [...record.teams].sort((a, b) => b.totalPoints - a.totalPoints);
      const winning = sortedTeams[0];
      const losing = sortedTeams[sortedTeams.length - 1];

      if (!winning || !losing) {
        return undefined;
      }

      const margin = winning.totalPoints - losing.totalPoints;
      if (margin <= 0) {
        return undefined;
      }

      return {
        gameId: record.id,
        playedAt: record.playedAt,
        winningPairId: winning.pairId,
        winningPoints: winning.totalPoints,
        losingPairId: losing.pairId,
        losingPoints: losing.totalPoints,
        margin,
      } satisfies GameLeaderboardEntry;
    })
    .filter((entry): entry is GameLeaderboardEntry => entry !== undefined)
    .sort((a, b) => b.margin - a.margin || b.winningPoints - a.winningPoints);
}
