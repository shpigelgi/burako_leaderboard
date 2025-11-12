import { useEffect, useMemo, useState } from 'react';
import { useScoreStore } from '../store/useScoreStore';
import { calculateLeaderboard } from '../lib/scoreUtils';
import type { Player } from '../types';

export function PlayersPage() {
  const allPlayers = useScoreStore((state) => state.allPlayers);
  const games = useScoreStore((state) => state.games);
  const loadAllPlayers = useScoreStore((state) => state.loadAllPlayers);
  const createPlayer = useScoreStore((state) => state.createPlayer);
  const updatePlayer = useScoreStore((state) => state.updatePlayer);
  const deletePlayer = useScoreStore((state) => state.deletePlayer);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    void loadAllPlayers();
  }, [loadAllPlayers]);

  const leaderboard = useMemo(() => calculateLeaderboard(games), [games]);
  const playerStatsMap = useMemo(() => {
    const map = new Map();
    leaderboard.forEach((entry) => {
      map.set(entry.playerId, entry);
    });
    return map;
  }, [leaderboard]);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      await createPlayer(newPlayerName.trim());
      setNewPlayerName('');
    } catch (error) {
      console.error('Failed to create player:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditName(player.name);
    setExpandedPlayerId(null);
  };

  const handleSaveEdit = async (playerId: string) => {
    if (!editName.trim()) {
      return;
    }
    try {
      await updatePlayer(playerId, editName.trim());
      setEditingPlayerId(null);
      setEditName('');
    } catch (error) {
      console.error('Failed to update player:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditName('');
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (deleteConfirm !== playerId) {
      setDeleteConfirm(playerId);
      return;
    }
    try {
      await deletePlayer(playerId);
      setDeleteConfirm(null);
      setExpandedPlayerId(null);
    } catch (error) {
      console.error('Failed to delete player:', error);
    }
  };

  const toggleExpand = (playerId: string) => {
    setExpandedPlayerId(expandedPlayerId === playerId ? null : playerId);
    setDeleteConfirm(null);
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Manage Players</h1>
      </header>

      <div className="panel-section">
        <h2 className="section-title">Add New Player</h2>
        <form onSubmit={handleCreatePlayer} className="form">
          <div className="field">
            <label className="field-label" htmlFor="player-name">
              Player Name
            </label>
            <input
              id="player-name"
              type="text"
              className="field-control"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="e.g., John Smith"
              disabled={isCreating}
              autoFocus
            />
          </div>
          <button type="submit" className="button" disabled={isCreating || !newPlayerName.trim()}>
            {isCreating ? 'Adding...' : 'Add Player'}
          </button>
        </form>
      </div>

      <div className="panel-section">
        <h2 className="section-title">All Players ({allPlayers.length})</h2>
        {allPlayers.length === 0 ? (
          <div className="status-card">
            No players yet. Add your first player above to get started!
          </div>
        ) : (
          <div className="players-grid">
            {allPlayers.map((player) => {
              const stats = playerStatsMap.get(player.id);
              const isExpanded = expandedPlayerId === player.id;
              const isEditing = editingPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  className={`player-card-enhanced ${isExpanded ? 'expanded' : ''}`}
                >
                  <div className="player-card-header" onClick={() => !isEditing && toggleExpand(player.id)}>
                    <div className="player-avatar">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    {isEditing ? (
                      <div className="player-edit-form" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className="field-control"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                        <div className="player-edit-actions">
                          <button
                            className="button button-small"
                            onClick={() => handleSaveEdit(player.id)}
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
                      <div className="player-name">{player.name}</div>
                    )}
                    {!isEditing && (
                      <div className="expand-icon">{isExpanded ? '▼' : '▶'}</div>
                    )}
                  </div>

                  {isExpanded && !isEditing && (
                    <div className="player-card-details">
                      {stats ? (
                        <>
                          <div className="player-stat">
                            <span className="stat-label">Total Points:</span>
                            <span className="stat-value">{stats.totalPoints}</span>
                          </div>
                          <div className="player-stat">
                            <span className="stat-label">Games Played:</span>
                            <span className="stat-value">{stats.gamesPlayed}</span>
                          </div>
                          <div className="player-stat">
                            <span className="stat-label">Average:</span>
                            <span className="stat-value">{stats.averagePoints}</span>
                          </div>
                          {stats.lastPlayedAt && (
                            <div className="player-stat">
                              <span className="stat-label">Last Played:</span>
                              <span className="stat-value">
                                {new Date(stats.lastPlayedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="player-stat">
                          <span className="stat-label">No games played yet</span>
                        </div>
                      )}
                      <div className="player-card-actions">
                        <button
                          className="button button-secondary button-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(player);
                          }}
                        >
                          Edit Name
                        </button>
                        <button
                          className="button button-danger button-small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlayer(player.id);
                          }}
                        >
                          {deleteConfirm === player.id ? 'Confirm Delete?' : 'Delete'}
                        </button>
                        {deleteConfirm === player.id && (
                          <button
                            className="button button-secondary button-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(null);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
