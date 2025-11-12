import { useEffect } from 'react';
import { useScoreStore } from '../../store/useScoreStore';
import { useGroupManagement } from './useGroupManagement';
import { GroupForm } from '../../components/forms/GroupForm';

export function GroupsPage() {
  const activeGroupId = useScoreStore((state) => state.activeGroupId);
  const loadAllPlayers = useScoreStore((state) => state.loadAllPlayers);
  const loading = useScoreStore((state) => state.loading);

  // Use custom hook for all group management logic
  const {
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
    handleAddPlayer,
    handleTogglePlayer,
    handleCreateGroup,
    handleSwitchGroup,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteGroup,
    handleCancelDelete,
  } = useGroupManagement();

  useEffect(() => {
    void loadAllPlayers();
  }, [loadAllPlayers]);

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Manage Groups</h1>
      </header>

      <div className="panel-section">
        <h2 className="section-title">Create New Group</h2>
        <GroupForm
          groupName={newGroupName}
          onGroupNameChange={setNewGroupName}
          selectedPlayerIds={selectedPlayerIds}
          onTogglePlayer={handleTogglePlayer}
          allPlayers={allPlayers}
          onAddPlayer={handleAddPlayer}
          onSubmit={handleCreateGroup}
          isSubmitting={isCreating}
          submitButtonText={`Create Group with ${selectedPlayerIds.length}/4 Players`}
        />
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
                          onClick={handleCancelDelete}
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
