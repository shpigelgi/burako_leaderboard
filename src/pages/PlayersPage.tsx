import { useEffect, useState } from 'react';
import { useScoreStore } from '../store/useScoreStore';

export function PlayersPage() {
  const allPlayers = useScoreStore((state) => state.allPlayers);
  const loadAllPlayers = useScoreStore((state) => state.loadAllPlayers);
  const createPlayer = useScoreStore((state) => state.createPlayer);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    void loadAllPlayers();
  }, [loadAllPlayers]);

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
            {allPlayers.map((player) => (
              <div key={player.id} className="player-card">
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-name">{player.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
