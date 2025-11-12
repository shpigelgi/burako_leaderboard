import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoreStore } from '../store/useScoreStore';
import { useToast } from '../hooks/useToast';
import { generateGroupName, isGroupNameDuplicate } from '../utils/groupNameGenerator';

// Generate all possible pairs from 4 players
function generatePairs(playerIds: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      pairs.push([playerIds[i], playerIds[j]]);
    }
  }
  return pairs;
}

export function GroupsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const groups = useScoreStore((state) => state.groups);
  const activeGroupId = useScoreStore((state) => state.activeGroupId);
  const allPlayers = useScoreStore((state) => state.allPlayers);
  const createGroup = useScoreStore((state) => state.createGroup);
  const updateGroup = useScoreStore((state) => state.updateGroup);
  const deleteGroup = useScoreStore((state) => state.deleteGroup);
  const switchGroup = useScoreStore((state) => state.switchGroup);
  const loadAllPlayers = useScoreStore((state) => state.loadAllPlayers);
  const createPlayer = useScoreStore((state) => state.createPlayer);
  const addPlayerToGroup = useScoreStore((state) => state.addPlayerToGroup);
  const createPair = useScoreStore((state) => state.createPair);
  const loading = useScoreStore((state) => state.loading);

  const [newGroupName, setNewGroupName] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  useEffect(() => {
    void loadAllPlayers();
  }, [loadAllPlayers]);

  const handleAddNewPlayer = async () => {
    if (!newPlayerName.trim()) {
      toast.error('Please enter a player name');
      return;
    }
    try {
      const player = await createPlayer(newPlayerName.trim());
      const newSelection = [...selectedPlayerIds, player.id];
      setSelectedPlayerIds(newSelection);
      
      // Auto-generate group name (always 4 players)
      const groupName = generateGroupName(newSelection, allPlayers, player.name);
      setNewGroupName(groupName);
      
      setNewPlayerName('');
      toast.success('Player created successfully!');
    } catch (error) {
      toast.error('Failed to create player', error);
    }
  };

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const newSelection = prev.includes(playerId) 
        ? prev.filter((id) => id !== playerId) 
        : [...prev, playerId];
      
      // Auto-generate group name from selected players (always 4)
      const groupName = generateGroupName(newSelection, allPlayers);
      setNewGroupName(groupName);
      
      return newSelection;
    });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
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
      
      // Add selected players to the group
      for (const playerId of selectedPlayerIds) {
        await addPlayerToGroup(playerId);
      }
      
      // Generate all possible pairs (6 pairs from 4 players)
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
  };

  const handleSwitchGroup = async (groupId: string) => {
    try {
      await switchGroup(groupId);
      const group = groups.find((g) => g.id === groupId);
      toast.success(`Switched to "${group?.name}"`);
      navigate('/leaderboard');
    } catch (error) {
      toast.error('Failed to switch group', error);
    }
  };

  const handleStartEdit = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditGroupName(currentName);
    setDeleteConfirm(null);
  };

  const handleSaveEdit = async (groupId: string) => {
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
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditGroupName('');
  };

  const handleDeleteGroup = async (groupId: string) => {
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
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Manage Groups</h1>
      </header>

      <div className="panel-section">
        <h2 className="section-title">Create New Group</h2>
        <form onSubmit={handleCreateGroup} className="form">
          <div className="field">
            <label className="field-label" htmlFor="group-name">
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              className="field-control"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g., Friday Night Crew"
              disabled={isCreating}
            />
          </div>

          <div className="field">
            <label className="field-label">Select Players (exactly 4 required)</label>
            <div className="player-selection">
              {allPlayers.map((player) => (
                <label key={player.id} className="player-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.includes(player.id)}
                    onChange={() => handleTogglePlayer(player.id)}
                    disabled={isCreating}
                  />
                  <span>{player.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="new-player-name">
              Or Create New Player
            </label>
            <div className="input-group">
              <input
                id="new-player-name"
                type="text"
                className="field-control"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name"
                disabled={isCreating}
              />
              <button
                type="button"
                className="button button-secondary"
                onClick={handleAddNewPlayer}
                disabled={isCreating || !newPlayerName.trim()}
              >
                Add Player
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="button"
              disabled={isCreating || !newGroupName.trim() || selectedPlayerIds.length !== 4}
            >
              {isCreating ? 'Creating...' : `Create Group with ${selectedPlayerIds.length}/4 Players`}
            </button>
          </div>
        </form>
      </div>

      <div className="panel-section">
        <h2 className="section-title">Your Groups</h2>
        {groups.length === 0 ? (
          <div className="status-card">
            No groups yet. Create your first group above to get started!
          </div>
        ) : (
          <div className="groups-list">
            {groups.map((group) => {
              const isEditing = editingGroupId === group.id;
              
              return (
                <div
                  key={group.id}
                  className={`group-card ${group.id === activeGroupId ? 'active' : ''}`}
                >
                  <div className="group-info">
                    {isEditing ? (
                      <div className="group-edit-form">
                        <input
                          type="text"
                          className="field-control"
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          autoFocus
                        />
                        <div className="group-edit-actions">
                          <button
                            className="button button-small"
                            onClick={() => handleSaveEdit(group.id)}
                          >
                            Save
                          </button>
                          <button
                            className="button button-secondary button-small"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h3 className="group-name">{group.name}</h3>
                    )}
                  <p className="group-meta">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                    {group.id === activeGroupId && <span className="active-badge"> • Active</span>}
                  </p>
                </div>
                <div className="group-actions">
                  {!isEditing && (
                    <>
                      {group.id !== activeGroupId && (
                        <button
                          className="button button-secondary"
                          onClick={() => handleSwitchGroup(group.id)}
                          disabled={loading}
                        >
                          Switch to This Group
                        </button>
                      )}
                      <button
                        className="button button-secondary"
                        onClick={() => handleStartEdit(group.id, group.name)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="button button-danger"
                        onClick={() => handleDeleteGroup(group.id)}
                        disabled={loading}
                      >
                        {deleteConfirm === group.id ? 'Confirm Delete?' : 'Delete'}
                      </button>
                      {deleteConfirm === group.id && (
                        <button
                          className="button button-secondary"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
