/**
 * Application-wide constants.
 * Centralizes magic strings to prevent typos and improve maintainability.
 */

// LocalStorage Keys
export const STORAGE_KEYS = {
  // Migration
  MIGRATION_COMPLETED: 'burako_migration_completed',
  PRE_MIGRATION_BACKUP: 'burako_pre_migration_backup',
  PAIR_ID_FIX_APPLIED: 'burako_pair_id_fix_applied',
  
  // Active Group
  ACTIVE_GROUP_ID: 'burako_active_group_id',
  
  // Data Storage (for local repository)
  GROUPS: 'burako-groups',
  PLAYERS: 'burako-players',
  GROUP_DATA_PREFIX: 'burako-group-',
} as const;

// Firebase Collection Names
export const FIREBASE_COLLECTIONS = {
  GROUPS: 'groups',
  PLAYERS: 'players',
  
  // Legacy collections (for migration)
  LEGACY_PAIRS: 'pairs',
  LEGACY_GAMES: 'games',
} as const;

// Firebase Subcollection Names (within groups)
export const FIREBASE_SUBCOLLECTIONS = {
  MEMBERS: 'members',
  PAIRS: 'pairs',
  GAMES: 'games',
} as const;

// ID Prefixes
export const ID_PREFIXES = {
  GROUP: 'group',
  PLAYER: 'player',
  PAIR: 'pair',
  GAME: 'game',
  AUDIT: 'audit',
} as const;

// Validation Limits
export const VALIDATION_LIMITS = {
  GROUP_NAME_MIN: 1,
  GROUP_NAME_MAX: 200,
  PLAYER_NAME_MIN: 1,
  PLAYER_NAME_MAX: 100,
  NOTES_MAX: 1000,
} as const;

// Default Values
export const DEFAULTS = {
  GROUP_NAME: 'Maayan, Nevo, Assaf & Gilad',
  PLAYERS_PER_GROUP: 4,
} as const;
