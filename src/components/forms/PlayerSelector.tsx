import type { Player } from '../../types';

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayerIds: string[];
  onTogglePlayer: (playerId: string) => void;
  disabled?: boolean;
}

/**
 * PlayerSelector component for selecting players via checkboxes.
 * Used in group creation and management forms.
 */
export function PlayerSelector({
  players,
  selectedPlayerIds,
  onTogglePlayer,
  disabled = false,
}: PlayerSelectorProps) {
  return (
    <div className="field">
      <label className="field-label">Select Players (exactly 4 required)</label>
      <div className="player-selection">
        {players.map((player) => (
          <label key={player.id} className="player-checkbox">
            <input
              type="checkbox"
              checked={selectedPlayerIds.includes(player.id)}
              onChange={() => onTogglePlayer(player.id)}
              disabled={disabled}
              aria-label={`Select ${player.name}`}
            />
            <span>{player.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
