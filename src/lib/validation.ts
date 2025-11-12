import type { Group, Player, Pair, GameRecord } from '../types';

/**
 * Validation utilities to ensure data from Firebase matches expected types.
 * Prevents runtime errors from malformed or missing data.
 */

export class ValidationError extends Error {
  public readonly data?: unknown;
  
  constructor(message: string, data?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.data = data;
  }
}

/**
 * Validate that a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validate that a value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validate Group data from Firebase
 */
export function validateGroup(data: unknown): Group {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Group data must be an object', data);
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.id)) {
    throw new ValidationError('Group must have a valid id', data);
  }

  if (!isNonEmptyString(obj.name)) {
    throw new ValidationError('Group must have a valid name', data);
  }

  if (!isNonEmptyString(obj.createdAt)) {
    throw new ValidationError('Group must have a valid createdAt', data);
  }

  return {
    id: obj.id,
    name: obj.name,
    createdAt: obj.createdAt,
  };
}

/**
 * Validate Player data from Firebase
 */
export function validatePlayer(data: unknown): Player {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Player data must be an object', data);
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.id)) {
    throw new ValidationError('Player must have a valid id', data);
  }

  if (!isNonEmptyString(obj.name)) {
    throw new ValidationError('Player must have a valid name', data);
  }

  return {
    id: obj.id,
    name: obj.name,
  };
}

/**
 * Validate Pair data from Firebase
 */
export function validatePair(data: unknown): Pair {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Pair data must be an object', data);
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.id)) {
    throw new ValidationError('Pair must have a valid id', data);
  }

  if (!isNonEmptyString(obj.groupId)) {
    throw new ValidationError('Pair must have a valid groupId', data);
  }

  if (!isArray(obj.players) || obj.players.length !== 2) {
    throw new ValidationError('Pair must have exactly 2 players', data);
  }

  if (!obj.players.every((p) => isNonEmptyString(p))) {
    throw new ValidationError('Pair players must be valid strings', data);
  }

  return {
    id: obj.id,
    groupId: obj.groupId,
    players: obj.players as [string, string],
  };
}

/**
 * Validate GameRecord data from Firebase
 */
export function validateGameRecord(data: unknown): GameRecord {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('GameRecord data must be an object', data);
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.id)) {
    throw new ValidationError('GameRecord must have a valid id', data);
  }

  if (!isNonEmptyString(obj.groupId)) {
    throw new ValidationError('GameRecord must have a valid groupId', data);
  }

  if (!isNonEmptyString(obj.playedAt)) {
    throw new ValidationError('GameRecord must have a valid playedAt', data);
  }

  if (!isArray(obj.teams)) {
    throw new ValidationError('GameRecord must have teams array', data);
  }

  if (!isArray(obj.scores)) {
    throw new ValidationError('GameRecord must have scores array', data);
  }

  if (!isArray(obj.auditTrail)) {
    throw new ValidationError('GameRecord must have auditTrail array', data);
  }

  // Basic validation - full validation would check nested structures
  return {
    id: obj.id,
    groupId: obj.groupId,
    playedAt: obj.playedAt,
    teams: obj.teams as GameRecord['teams'],
    scores: obj.scores as GameRecord['scores'],
    notes: typeof obj.notes === 'string' ? obj.notes : undefined,
    auditTrail: obj.auditTrail as GameRecord['auditTrail'],
    startingPairId: typeof obj.startingPairId === 'string' ? obj.startingPairId : undefined,
  };
}

/**
 * Validate an array of items using a validator function
 */
export function validateArray<T>(
  data: unknown[],
  validator: (item: unknown) => T,
  context: string
): T[] {
  const results: T[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  data.forEach((item, index) => {
    try {
      results.push(validator(item));
    } catch (error) {
      errors.push({ index, error: error as Error });
      console.error(`Validation error in ${context}[${index}]:`, error);
    }
  });

  // Log summary if there were errors
  if (errors.length > 0) {
    console.warn(
      `${context}: ${errors.length} of ${data.length} items failed validation and were skipped`
    );
  }

  return results;
}
