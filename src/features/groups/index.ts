/**
 * Groups Feature
 * 
 * Handles group management including:
 * - Creating groups with 4 players
 * - Editing group names
 * - Deleting groups
 * - Switching between groups
 * - Auto-generating group names
 */

export { GroupsPage } from './GroupsPage';
export { useGroupManagement } from './useGroupManagement';
export { generateGroupName, isGroupNameDuplicate } from './groupNameGenerator';
