import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoreStore } from '../../store/useScoreStore';
import { useToast } from '../../hooks/useToast';
import { generateGroupName, isGroupNameDuplicate } from './groupNameGenerator';

/**
 * Custom hook for managing group creation and editing.
 * Encapsulates all group-related business logic and state.
 * 
 * @returns Group management functions and state
 */
export function useGroupManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Store selectors
  const groups = useScoreStore((state) => state.groups);
  const allPlayers = useScoreStore((state) => state.allPlayers);
  const createGroup = useScoreStore((state) => state.createGroup);
  const updateGroup = useScoreStore((state) => state.updateGroup);
  const deleteGroup = useScoreStore((state) => state.deleteGroup);
  const switchGroup = useScoreStore((state) => state.switchGroup);
  const createPlayer = useScoreStore((state) => state.createPlayer);
  const addPlayerToGroup = useScoreStore((state) => state.addPlayerToGroup);
  const createPair = useScoreStore((state) => state.createPair);

  // Local state
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /**
   * Generate all possible pairs from 4 players
   */
  const generatePairs = useCallback((playerIds: string[]): Array<[string, string]> => {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        pairs.push([playerIds[i], playerIds[j]]);
      }
    }
    return pairs;
  }, []);

  /**
   * Handle adding a new player and auto-selecting them
   */
  const handleAddPlayer = useCallback(async (playerName: string) => {
    try {
      const player = await createPlayer(playerName);
      const newSelection = [...selectedPlayerIds, player.id];
      setSelectedPlayerIds(newSelection);
      
      // Auto-generate group name
      const groupName = generateGroupName(newSelection, allPlayers, player.name);
      setNewGroupName(groupName);
      
      toast.success('Player created successfully!');
    } catch (error) {
      toast.error('Failed to create player', error);
      throw error;
    }
  }, [selectedPlayerIds, allPlayers, createPlayer, toast]);

  /**
   * Handle toggling player selection
   */
  const handleTogglePlayer = useCallback((playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const newSelection = prev.includes(playerId) 
        ? prev.filter((id) => id !== playerId) 
        : [...prev, playerId];
      
      // Auto-generate group name
      const groupName = generateGroupName(newSelection, allPlayers);
      setNewGroupName(groupName);
      
      return newSelection;
    });
  }, [allPlayers]);

  /**
   * Handle creating a new group
   */
  const handleCreateGroup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGroupName.trim()) {
      return;
    }
    
    if (selectedPlayerIds.length !== 4) {
      toast.error('Please select exactly 4 players for the group');
      return;
    }
    
    // Check for duplicate group names
    const groupName = newGroupName.trim();
    if (isGroupNameDuplicate(groupName, groups)) {
      toast.error(`A group named "${groupName}" already exists`);
      return;
    }
    
    setIsCreating(true);
    try {
      const group = await createGroup(groupName);
      
      // Switch to the new group first
      await switchGroup(group.id);
      
      // Add players to group (uses active group from store)
      for (const playerId of selectedPlayerIds) {
        await addPlayerToGroup(playerId);
      }
      
      // Generate all possible pairs (6 pairs from 4 players, uses active group)
      const allPairs = generatePairs(selectedPlayerIds);
      for (const pairPlayers of allPairs) {
        await createPair(pairPlayers);
      }
      
      setNewGroupName('');
      setSelectedPlayerIds([]);
      toast.success(`Group "${groupName}" created successfully!`);
      navigate('/leaderboard');
    } catch (error) {
      toast.error('Failed to create group', error);
    } finally {
      setIsCreating(false);
    }
  }, [
    newGroupName,
    selectedPlayerIds,
    groups,
    createGroup,
    switchGroup,
    addPlayerToGroup,
    createPair,
    generatePairs,
    toast,
    navigate,
  ]);

  /**
   * Handle switching to a different group
   */
  const handleSwitchGroup = useCallback(async (groupId: string) => {
    try {
      await switchGroup(groupId);
      const group = groups.find((g) => g.id === groupId);
      toast.success(`Switched to "${group?.name}"`);
      navigate('/leaderboard');
    } catch (error) {
      toast.error('Failed to switch group', error);
    }
  }, [switchGroup, groups, toast, navigate]);

  /**
   * Start editing a group name
   */
  const handleStartEdit = useCallback((groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditGroupName(currentName);
    setDeleteConfirm(null);
  }, []);

  /**
   * Save edited group name
   */
  const handleSaveEdit = useCallback(async (groupId: string) => {
    if (!editGroupName.trim()) {
      return;
    }
    
    // Check for duplicate names (excluding current group)
    const groupName = editGroupName.trim();
    if (isGroupNameDuplicate(groupName, groups, groupId)) {
      toast.error(`A group named "${groupName}" already exists`);
      return;
    }
    
    try {
      await updateGroup(groupId, groupName);
      setEditingGroupId(null);
      setEditGroupName('');
      toast.success('Group name updated!');
    } catch (error) {
      toast.error('Failed to update group', error);
    }
  }, [editGroupName, groups, updateGroup, toast]);

  /**
   * Cancel editing
   */
  const handleCancelEdit = useCallback(() => {
    setEditingGroupId(null);
    setEditGroupName('');
  }, []);

  /**
   * Handle deleting a group
   */
  const handleDeleteGroup = useCallback(async (groupId: string) => {
    if (deleteConfirm !== groupId) {
      setDeleteConfirm(groupId);
      return;
    }
    
    try {
      await deleteGroup(groupId);
      setDeleteConfirm(null);
      toast.success('Group deleted');
    } catch (error) {
      toast.error('Failed to delete group', error);
    }
  }, [deleteConfirm, deleteGroup, toast]);

  /**
   * Cancel delete confirmation
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  return {
    // State
    groups,
    allPlayers,
    newGroupName,
    setNewGroupName,
    selectedPlayerIds,
    isCreating,
    editingGroupId,
    editGroupName,
    setEditGroupName,
    deleteConfirm,
    
    // Actions
    handleAddPlayer,
    handleTogglePlayer,
    handleCreateGroup,
    handleSwitchGroup,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteGroup,
    handleCancelDelete,
  };
}
