import type {
  CardCountBreakdown,
  CardsScoringDetail,
  ManualScoringDetail,
  ScoreComponentBreakdown,
  SummaryScoringDetail,
} from '../types';

export const CARD_POINT_VALUES = {
  jokers: 50,
  twos: 20,
  aces: 15,
  threeToSeven: 5,
  eightToKing: 10,
} as const;

export const CLEAN_CANASTA_POINTS = 200;
export const DIRTY_CANASTA_POINTS = 100;
export const WINNER_BONUS_POINTS = 100;
export const MUERTO_BONUS_POINTS = -100;

export interface ManualScoreInput {
  total: number;
}

export interface SummaryScoreInput {
  cardPoints: number;
  cleanCanastas: number;
  dirtyCanastas: number;
  minusPoints: number;
  tookMuerto: boolean;
  winner: boolean;
}

export interface CardsScoreInput {
  cardCounts: CardCountBreakdown;
  cleanCanastas: number;
  dirtyCanastas: number;
  minusPoints: number;
  tookMuerto: boolean;
  winner: boolean;
}

export interface ScoreComputation {
  total: number;
  breakdown: string;
  components: ScoreComponentBreakdown;
}

const calculateCanastaPoints = (cleanCanastas: number, dirtyCanastas: number): number =>
  cleanCanastas * CLEAN_CANASTA_POINTS + dirtyCanastas * DIRTY_CANASTA_POINTS;

const calculateBonusComponents = (winner: boolean, tookMuerto: boolean) => ({
  winnerBonus: winner ? WINNER_BONUS_POINTS : 0,
  muertoBonus: tookMuerto ? 0 : MUERTO_BONUS_POINTS,
});

const formatBreakdown = (components: ScoreComponentBreakdown): string => {
  const parts: string[] = [];
  if (components.cardPoints) {
    parts.push(`Cards ${components.cardPoints}`);
  }
  if (components.canastaPoints) {
    parts.push(`Canastas ${components.canastaPoints}`);
  }
  if (components.winnerBonus) {
    const sign = components.winnerBonus > 0 ? '+' : '';
    parts.push(`Winner ${sign}${components.winnerBonus}`);
  }
  if (components.muertoBonus) {
    const sign = components.muertoBonus > 0 ? '+' : '';
    parts.push(`Muerto ${sign}${components.muertoBonus}`);
  }
  if (components.minusPoints) {
    parts.push(`Minus -${components.minusPoints}`);
  }
  return parts.join(' · ');
};

export const calculateManualScore = ({ total }: ManualScoreInput): ScoreComputation => ({
  total,
  breakdown: `Final total ${total}`,
  components: {
    cardPoints: 0,
    canastaPoints: 0,
    winnerBonus: 0,
    muertoBonus: 0,
    minusPoints: 0,
  },
});

export const calculateSummaryScore = (input: SummaryScoreInput): ScoreComputation => {
  const canastaPoints = calculateCanastaPoints(input.cleanCanastas, input.dirtyCanastas);
  const { winnerBonus, muertoBonus } = calculateBonusComponents(input.winner, input.tookMuerto);
  const hasCanasta = input.cleanCanastas + input.dirtyCanastas > 0;

  const adjustedCardPoints = hasCanasta ? input.cardPoints : -input.cardPoints;
  const adjustedWinnerBonus = hasCanasta ? winnerBonus : winnerBonus ? -winnerBonus : 0;

  const components: ScoreComponentBreakdown = {
    cardPoints: adjustedCardPoints,
    canastaPoints,
    winnerBonus: adjustedWinnerBonus,
    muertoBonus,
    minusPoints: input.minusPoints,
  };

  const total =
    adjustedCardPoints +
    canastaPoints +
    adjustedWinnerBonus +
    muertoBonus -
    input.minusPoints;

  return {
    total,
    components,
    breakdown: formatBreakdown(components),
  };
};

export const calculateCardPoints = (cardCounts: CardCountBreakdown): number =>
  cardCounts.jokers * CARD_POINT_VALUES.jokers +
  cardCounts.twos * CARD_POINT_VALUES.twos +
  cardCounts.aces * CARD_POINT_VALUES.aces +
  cardCounts.threeToSeven * CARD_POINT_VALUES.threeToSeven +
  cardCounts.eightToKing * CARD_POINT_VALUES.eightToKing;

export const calculateCardsScore = (input: CardsScoreInput): ScoreComputation => {
  const cardPoints = calculateCardPoints(input.cardCounts);
  return calculateSummaryScore({
    cardPoints,
    cleanCanastas: input.cleanCanastas,
    dirtyCanastas: input.dirtyCanastas,
    minusPoints: input.minusPoints,
    tookMuerto: input.tookMuerto,
    winner: input.winner,
  });
};

export const buildManualScoringDetail = (input: ManualScoreInput) => {
  const result = calculateManualScore(input);
  const detail: ManualScoringDetail = {
    mode: 'manual',
    enteredTotal: input.total,
    breakdown: result.breakdown,
    components: result.components,
  };
  return { total: result.total, detail } as const;
};

export const buildSummaryScoringDetail = (input: SummaryScoreInput) => {
  const result = calculateSummaryScore(input);
  const detail: SummaryScoringDetail = {
    ...input,
    mode: 'summary',
    calculatedTotal: result.total,
    breakdown: result.breakdown,
    components: result.components,
  };
  return { total: result.total, detail } as const;
};

export const buildCardsScoringDetail = (input: CardsScoreInput) => {
  const result = calculateCardsScore(input);
  const detail: CardsScoringDetail = {
    ...input,
    mode: 'cards',
    cardCounts: { ...input.cardCounts },
    calculatedTotal: result.total,
    breakdown: result.breakdown,
    components: result.components,
  };
  return { total: result.total, detail } as const;
};

