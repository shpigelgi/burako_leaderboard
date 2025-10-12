import type { CanastaDetails } from '../types';

interface CanastaScoreInput {
  canasta: CanastaDetails;
}

interface CanastaScoreResult {
  total: number;
  breakdown: string;
}

export function useCanastaScoring() {
  const calculate = (_input: CanastaScoreInput): CanastaScoreResult => ({
    total: 0,
    breakdown: 'TODO: implement canasta scoring',
  });

  return { calculate };
}
