import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScoreStore } from '../store/useScoreStore';

export function GroupsPage() {
  const navigate = useNavigate();
  const groups = useScoreStore((state) => state.groups);
  const activeGroupId = useScoreStore((state) => state.activeGroupId);
  const createGroup = useScoreStore((state) => state.createGroup);
  const deleteGroup = useScoreStore((state) => state.deleteGroup);
  const switchGroup = useScoreStore((state) => state.switchGroup);
  const loading = useScoreStore((state) => state.loading);

  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      const group = await createGroup(newGroupName.trim());
      setNewGroupName('');
      await switchGroup(group.id);
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
          <button type="submit" className="button" disabled={isCreating || !newGroupName.trim()}>
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
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
