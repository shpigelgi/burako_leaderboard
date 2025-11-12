import type { Player } from '../types';

/**
 * Generates a formatted group name from player names.
 * Format: "Player1, Player2, Player3 & Player4"
 * 
 * @param playerIds - Array of player IDs
 * @param allPlayers - Array of all available players
 * @param newPlayerName - Optional name of a newly created player (not yet in allPlayers)
 * @returns Formatted group name string
 * 
 * @example
 * generateGroupName(['id1', 'id2', 'id3', 'id4'], players)
 * // Returns: "Maayan, Nevo, Assaf & Gilad"
 */
export function generateGroupName(
  playerIds: string[],
  allPlayers: Player[],
  newPlayerName?: string
): string {
  if (playerIds.length === 0) {
    return '';
  }

  // Map player IDs to names
  const names = playerIds
    .map(id => {
      // Check if this is a newly created player
      const player = allPlayers.find(p => p.id === id);
      return player?.name || (newPlayerName || null);
    })
    .filter((name): name is string => Boolean(name));

  // Format with ampersand before last name
  if (names.length >= 2) {
    const allButLast = names.slice(0, -1).join(', ');
    const last = names[names.length - 1];
    return `${allButLast} & ${last}`;
  }

  return names[0] || '';
}

/**
 * Validates if a group name already exists (case-insensitive).
 * 
 * @param name - Group name to check
 * @param existingGroups - Array of existing group objects
 * @param excludeGroupId - Optional group ID to exclude from check (for updates)
 * @returns true if name exists, false otherwise
 */
export function isGroupNameDuplicate(
  name: string,
  existingGroups: Array<{ id: string; name: string }>,
  excludeGroupId?: string
): boolean {
  const normalizedName = name.trim().toLowerCase();
  return existingGroups.some(
    group => 
      group.id !== excludeGroupId && 
      group.name.toLowerCase() === normalizedName
  );
}
