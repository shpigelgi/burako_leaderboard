export type PlayerId = string;

export type PairId = string;

export type GameId = string;

export type ScoringMode = 'manual' | 'summary' | 'cards';

export interface Player {
  id: PlayerId;
  name: string;
}

export interface Pair {
  id: PairId;
  players: [PlayerId, PlayerId];
}

export interface CanastaDetails {
  cleanCanastas: number;
  dirtyCanastas: number;
}

export interface CardCountBreakdown {
  jokers: number;
  twos: number;
  aces: number;
  threeToSeven: number;
  eightToKing: number;
}

export interface ScoreComponentBreakdown {
  cardPoints: number;
  canastaPoints: number;
  winnerBonus: number;
  muertoBonus: number;
  minusPoints: number;
}

export interface ManualScoringDetail {
  mode: 'manual';
  enteredTotal: number;
  breakdown: string;
  components: ScoreComponentBreakdown;
}

export interface SummaryScoringDetail {
  mode: 'summary';
  cardPoints: number;
  cleanCanastas: number;
  dirtyCanastas: number;
  minusPoints: number;
  tookMuerto: boolean;
  winner: boolean;
  calculatedTotal: number;
  breakdown: string;
  components: ScoreComponentBreakdown;
}

export interface CardsScoringDetail {
  mode: 'cards';
  cardCounts: CardCountBreakdown;
  cleanCanastas: number;
  dirtyCanastas: number;
  minusPoints: number;
  tookMuerto: boolean;
  winner: boolean;
  calculatedTotal: number;
  breakdown: string;
  components: ScoreComponentBreakdown;
}

export type TeamScoringDetail = ManualScoringDetail | SummaryScoringDetail | CardsScoringDetail;

export interface TeamResult {
  pairId: PairId;
  totalPoints: number;
  canasta: CanastaDetails;
  scoring: TeamScoringDetail;
}

export interface GameScore {
  playerId: PlayerId;
  points: number;
}

export type AuditEventType = 'create' | 'update' | 'undo';

export interface AuditEntry {
  id: string;
  gameId: GameId;
  timestamp: string;
  summary: string;
  type: AuditEventType;
  snapshot: GameSnapshot;
}

export interface GameSnapshot {
  teams: TeamResult[];
  scores: GameScore[];
  notes?: string;
  playedAt?: string;
  startingPairId?: PairId;
}

export interface GameRecord {
  id: GameId;
  playedAt: string;
  teams: TeamResult[];
  scores: GameScore[];
  notes?: string;
  auditTrail: AuditEntry[];
  startingPairId?: PairId;
}

export interface NewGameInput {
  playedAt?: string;
  teams: TeamResult[];
  scores: GameScore[];
  notes?: string;
  startingPairId?: PairId;
}

export interface GameUpdate {
  teams?: TeamResult[];
  scores?: GameScore[];
  notes?: string;
  playedAt?: string;
  startingPairId?: PairId;
}

export interface LeaderboardEntry {
  playerId: PlayerId;
  totalPoints: number;
  gamesPlayed: number;
  averagePoints: number;
  lastPlayedAt?: string;
}

export interface PairLeaderboardEntry {
  pairId: PairId;
  totalPoints: number;
  gamesPlayed: number;
  averagePoints: number;
  lastPlayedAt?: string;
}

export interface GameLeaderboardEntry {
  gameId: GameId;
  playedAt: string;
  gameNumber: number;
  winningPairId: PairId;
  winningPoints: number;
  losingPairId: PairId;
  losingPoints: number;
  margin: number;
}
