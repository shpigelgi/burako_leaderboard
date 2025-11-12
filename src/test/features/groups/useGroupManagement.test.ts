import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroupManagement } from '../../../features/groups/useGroupManagement';
import { useScoreStore } from '../../../store/useScoreStore';
import { useToast } from '../../../hooks/useToast';

// Mock dependencies
vi.mock('../../../store/useScoreStore');
vi.mock('../../../hooks/useToast');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('useGroupManagement', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  };

  const mockGroups = [
    { id: 'g1', name: 'Group 1', createdAt: '2025-01-01' },
    { id: 'g2', name: 'Group 2', createdAt: '2025-01-02' },
  ];

  const mockPlayers = [
    { id: 'p1', name: 'Player 1' },
    { id: 'p2', name: 'Player 2' },
    { id: 'p3', name: 'Player 3' },
    { id: 'p4', name: 'Player 4' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue(mockToast);
    vi.mocked(useScoreStore).mockReturnValue({
      groups: mockGroups,
      allPlayers: mockPlayers,
      createGroup: vi.fn().mockResolvedValue({ id: 'new-group', name: 'New Group' }),
      updateGroup: vi.fn().mockResolvedValue(undefined),
      deleteGroup: vi.fn().mockResolvedValue(undefined),
      switchGroup: vi.fn().mockResolvedValue(undefined),
      createPlayer: vi.fn().mockResolvedValue({ id: 'new-player', name: 'New Player' }),
      addPlayerToGroup: vi.fn().mockResolvedValue(undefined),
      createPair: vi.fn().mockResolvedValue({ id: 'new-pair', players: ['p1', 'p2'] }),
    } as any);
  });

  describe('State Management', () => {
    it('initializes with empty state', () => {
      const { result } = renderHook(() => useGroupManagement());
      
      expect(result.current.newGroupName).toBe('');
      expect(result.current.selectedPlayerIds).toEqual([]);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.editingGroupId).toBeNull();
      expect(result.current.deleteConfirm).toBeNull();
    });

    it('provides groups and players from store', () => {
      const { result } = renderHook(() => useGroupManagement());
      
      expect(result.current.groups).toEqual(mockGroups);
      expect(result.current.allPlayers).toEqual(mockPlayers);
    });
  });

  describe('Player Selection', () => {
    it('toggles player selection', () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.handleTogglePlayer('p1');
      });
      
      expect(result.current.selectedPlayerIds).toContain('p1');
      
      act(() => {
        result.current.handleTogglePlayer('p1');
      });
      
      expect(result.current.selectedPlayerIds).not.toContain('p1');
    });

    it('auto-generates group name when players are selected', () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.handleTogglePlayer('p1');
        result.current.handleTogglePlayer('p2');
      });
      
      expect(result.current.newGroupName).toBe('Player 1 & Player 2');
    });

    it('formats group name with ampersand for 4 players', () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.handleTogglePlayer('p1');
        result.current.handleTogglePlayer('p2');
        result.current.handleTogglePlayer('p3');
        result.current.handleTogglePlayer('p4');
      });
      
      expect(result.current.newGroupName).toBe('Player 1, Player 2, Player 3 & Player 4');
    });
  });

  describe('Group Creation', () => {
    it('validates 4 players are selected', async () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.setNewGroupName('Test Group');
      });
      
      await act(async () => {
        await result.current.handleCreateGroup({ preventDefault: vi.fn() } as any);
      });
      
      expect(mockToast.error).toHaveBeenCalledWith('Please select exactly 4 players for the group');
    });

    it('checks for duplicate group names', async () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.setNewGroupName('Group 1'); // Duplicate
        result.current.handleTogglePlayer('p1');
        result.current.handleTogglePlayer('p2');
        result.current.handleTogglePlayer('p3');
        result.current.handleTogglePlayer('p4');
      });
      
      await act(async () => {
        await result.current.handleCreateGroup({ preventDefault: vi.fn() } as any);
      });
      
      expect(mockToast.error).toHaveBeenCalledWith('A group named "Group 1" already exists');
    });
  });

  describe('Group Editing', () => {
    it('starts editing a group', () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.handleStartEdit('g1', 'Group 1');
      });
      
      expect(result.current.editingGroupId).toBe('g1');
      expect(result.current.editGroupName).toBe('Group 1');
    });

    it('cancels editing', () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.handleStartEdit('g1', 'Group 1');
        result.current.handleCancelEdit();
      });
      
      expect(result.current.editingGroupId).toBeNull();
      expect(result.current.editGroupName).toBe('');
    });

    it('validates duplicate names when editing', async () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.handleStartEdit('g1', 'Group 1');
        result.current.setEditGroupName('Group 2'); // Duplicate with another group
      });
      
      await act(async () => {
        await result.current.handleSaveEdit('g1');
      });
      
      expect(mockToast.error).toHaveBeenCalledWith('A group named "Group 2" already exists');
    });
  });

  describe('Group Deletion', () => {
    it('requires confirmation before deleting', async () => {
      const { result } = renderHook(() => useGroupManagement());
      
      await act(async () => {
        await result.current.handleDeleteGroup('g1');
      });
      
      expect(result.current.deleteConfirm).toBe('g1');
      expect(useScoreStore().deleteGroup).not.toHaveBeenCalled();
    });

    it('deletes group after confirmation', async () => {
      const { result } = renderHook(() => useGroupManagement());
      
      await act(async () => {
        await result.current.handleDeleteGroup('g1');
        await result.current.handleDeleteGroup('g1'); // Second call confirms
      });
      
      expect(useScoreStore().deleteGroup).toHaveBeenCalledWith('g1');
      expect(mockToast.success).toHaveBeenCalledWith('Group deleted');
    });

    it('cancels delete confirmation', () => {
      const { result } = renderHook(() => useGroupManagement());
      
      act(() => {
        result.current.handleDeleteGroup('g1');
        result.current.handleCancelDelete();
      });
      
      expect(result.current.deleteConfirm).toBeNull();
    });
  });

  describe('Player Creation', () => {
    it('creates player and adds to selection', async () => {
      const mockCreatePlayer = vi.fn().mockResolvedValue({ id: 'new-player', name: 'New Player' });
      vi.mocked(useScoreStore).mockReturnValue({
        ...useScoreStore(),
        createPlayer: mockCreatePlayer,
      } as any);

      const { result } = renderHook(() => useGroupManagement());
      
      await act(async () => {
        await result.current.handleAddPlayer('New Player');
      });
      
      expect(mockCreatePlayer).toHaveBeenCalledWith('New Player');
      expect(mockToast.success).toHaveBeenCalledWith('Player created successfully!');
    });
  });
});
