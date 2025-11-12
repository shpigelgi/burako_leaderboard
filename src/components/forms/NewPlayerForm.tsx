import { useState } from 'react';

interface NewPlayerFormProps {
  onAddPlayer: (name: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * NewPlayerForm component for creating new players inline.
 * Handles its own input state and validation.
 */
export function NewPlayerForm({ onAddPlayer, disabled = false }: NewPlayerFormProps) {
  const [playerName, setPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isAdding) {
      return;
    }

    setIsAdding(true);
    try {
      await onAddPlayer(playerName.trim());
      setPlayerName('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="field">
      <label className="field-label" htmlFor="new-player-name">
        Or Create New Player
      </label>
      <form onSubmit={handleSubmit} className="input-group">
        <input
          id="new-player-name"
          type="text"
          className="field-control"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Player name"
          disabled={disabled || isAdding}
          aria-label="New player name"
        />
        <button
          type="submit"
          className="secondary"
          disabled={disabled || isAdding || !playerName.trim()}
        >
          {isAdding ? 'Adding...' : 'Add Player'}
        </button>
      </form>
    </div>
  );
}
