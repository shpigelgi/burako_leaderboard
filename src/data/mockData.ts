import type {
  GameRecord,
  ManualScoringDetail,
  Pair,
  Player,
  ScoreComponentBreakdown,
} from '../types';

const zeroComponents = (): ScoreComponentBreakdown => ({
  cardPoints: 0,
  canastaPoints: 0,
  winnerBonus: 0,
  muertoBonus: 0,
  minusPoints: 0,
});

const manualScoringDetail = (total: number): ManualScoringDetail => ({
  mode: 'manual',
  enteredTotal: total,
  breakdown: `Manual entry ${total}`,
  components: zeroComponents(),
});

export const mockPlayers: Player[] = [
  { id: 'player-1', name: 'Maayan' },
  { id: 'player-2', name: 'Nevo' },
  { id: 'player-3', name: 'Assaf' },
  { id: 'player-4', name: 'Gilad' },
];

export const DEFAULT_GROUP_ID = 'group-default';

export const mockPairs: Pair[] = [
  { id: 'pair-1', groupId: DEFAULT_GROUP_ID, players: ['player-1', 'player-2'] },
  { id: 'pair-2', groupId: DEFAULT_GROUP_ID, players: ['player-1', 'player-3'] },
  { id: 'pair-3', groupId: DEFAULT_GROUP_ID, players: ['player-1', 'player-4'] },
  { id: 'pair-4', groupId: DEFAULT_GROUP_ID, players: ['player-2', 'player-3'] },
  { id: 'pair-5', groupId: DEFAULT_GROUP_ID, players: ['player-2', 'player-4'] },
  { id: 'pair-6', groupId: DEFAULT_GROUP_ID, players: ['player-3', 'player-4'] },
];

const initialGames: GameRecord[] = [
  {
    id: 'game-1',
    groupId: DEFAULT_GROUP_ID,
    playedAt: '2025-01-03T18:45:00.000Z',
    teams: [
      {
        pairId: 'pair-1',
        totalPoints: 180,
        canasta: { cleanCanastas: 2, dirtyCanastas: 1 },
        scoring: manualScoringDetail(180),
      },
      {
        pairId: 'pair-6',
        totalPoints: 120,
        canasta: { cleanCanastas: 1, dirtyCanastas: 0 },
        scoring: manualScoringDetail(120),
      },
    ],
    scores: [
      { playerId: 'player-1', points: 95 },
      { playerId: 'player-2', points: 85 },
      { playerId: 'player-3', points: 60 },
      { playerId: 'player-4', points: 60 },
    ],
    notes: 'Season opener at Clara\'s place.',
    auditTrail: [
      {
        id: 'audit-1',
        gameId: 'game-1',
        timestamp: '2025-01-03T18:45:00.000Z',
        summary: 'Game recorded',
        type: 'create',
        snapshot: {
          teams: [
            {
              pairId: 'pair-1',
              totalPoints: 180,
              canasta: { cleanCanastas: 2, dirtyCanastas: 1 },
              scoring: manualScoringDetail(180),
            },
            {
              pairId: 'pair-6',
              totalPoints: 120,
              canasta: { cleanCanastas: 1, dirtyCanastas: 0 },
              scoring: manualScoringDetail(120),
            },
          ],
          scores: [
            { playerId: 'player-1', points: 95 },
            { playerId: 'player-2', points: 85 },
            { playerId: 'player-3', points: 60 },
            { playerId: 'player-4', points: 60 },
          ],
          notes: 'Season opener at Clara\'s place.',
        },
      },
    ],
  },
  {
    id: 'game-2',
    groupId: DEFAULT_GROUP_ID,
    playedAt: '2025-01-10T19:30:00.000Z',
    teams: [
      {
        pairId: 'pair-3',
        totalPoints: 150,
        canasta: { cleanCanastas: 1, dirtyCanastas: 2 },
        scoring: manualScoringDetail(150),
      },
      {
        pairId: 'pair-4',
        totalPoints: 210,
        canasta: { cleanCanastas: 3, dirtyCanastas: 0 },
        scoring: manualScoringDetail(210),
      },
    ],
    scores: [
      { playerId: 'player-1', points: 70 },
      { playerId: 'player-4', points: 80 },
      { playerId: 'player-2', points: 110 },
      { playerId: 'player-3', points: 100 },
    ],
    notes: 'Ben and Clara pulled ahead with three clean canastas.',
    auditTrail: [
      {
        id: 'audit-2',
        gameId: 'game-2',
        timestamp: '2025-01-10T19:30:00.000Z',
        summary: 'Game recorded',
        type: 'create',
        snapshot: {
          teams: [
            {
              pairId: 'pair-3',
              totalPoints: 150,
              canasta: { cleanCanastas: 1, dirtyCanastas: 2 },
              scoring: manualScoringDetail(150),
            },
            {
              pairId: 'pair-4',
              totalPoints: 210,
              canasta: { cleanCanastas: 3, dirtyCanastas: 0 },
              scoring: manualScoringDetail(210),
            },
          ],
          scores: [
            { playerId: 'player-1', points: 70 },
            { playerId: 'player-4', points: 80 },
            { playerId: 'player-2', points: 110 },
            { playerId: 'player-3', points: 100 },
          ],
          notes: 'Ben and Clara pulled ahead with three clean canastas.',
        },
      },
    ],
  },
];

export const mockGames = initialGames;
