import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoreStore } from '../store/useScoreStore';

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
  const groups = useScoreStore((state) => state.groups);
  const activeGroupId = useScoreStore((state) => state.activeGroupId);
  const allPlayers = useScoreStore((state) => state.allPlayers);
  const createGroup = useScoreStore((state) => state.createGroup);
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

  useEffect(() => {
    void loadAllPlayers();
  }, [loadAllPlayers]);

  const handleAddNewPlayer = async () => {
    if (!newPlayerName.trim()) {
      return;
    }
    try {
      const player = await createPlayer(newPlayerName.trim());
      setSelectedPlayerIds([...selectedPlayerIds, player.id]);
      setNewPlayerName('');
    } catch (error) {
      console.error('Failed to create player:', error);
    }
  };

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId],
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      return;
    }
    if (selectedPlayerIds.length !== 4) {
      alert('Please select exactly 4 players for the group');
      return;
    }
    setIsCreating(true);
    try {
      const group = await createGroup(newGroupName.trim());
      
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
      navigate('/leaderboard');
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchGroup = async (groupId: string) => {
    await switchGroup(groupId);
    navigate('/leaderboard');
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (deleteConfirm !== groupId) {
      setDeleteConfirm(groupId);
      return;
    }
    try {
      await deleteGroup(groupId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete group:', error);
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
            {groups.map((group) => (
              <div
                key={group.id}
                className={`group-card ${group.id === activeGroupId ? 'active' : ''}`}
              >
                <div className="group-info">
                  <h3 className="group-name">{group.name}</h3>
                  <p className="group-meta">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                    {group.id === activeGroupId && <span className="active-badge"> • Active</span>}
                  </p>
                </div>
                <div className="group-actions">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
