import type { Player } from '../../types';
import { PlayerSelector } from './PlayerSelector';
import { NewPlayerForm } from './NewPlayerForm';

interface GroupFormProps {
  groupName: string;
  onGroupNameChange: (name: string) => void;
  selectedPlayerIds: string[];
  onTogglePlayer: (playerId: string) => void;
  allPlayers: Player[];
  onAddPlayer: (name: string) => Promise<void>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

/**
 * GroupForm component for creating or editing groups.
 * Combines group name input, player selection, and new player creation.
 */
export function GroupForm({
  groupName,
  onGroupNameChange,
  selectedPlayerIds,
  onTogglePlayer,
  allPlayers,
  onAddPlayer,
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Create Group',
}: GroupFormProps) {
  return (
    <form onSubmit={onSubmit} className="form">
      <div className="field">
        <label className="field-label" htmlFor="group-name">
          Group Name
        </label>
        <input
          id="group-name"
          type="text"
          className="field-control"
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          placeholder="e.g., Friday Night Crew"
          disabled={isSubmitting}
          required
          aria-label="Group name"
        />
      </div>

      <PlayerSelector
        players={allPlayers}
        selectedPlayerIds={selectedPlayerIds}
        onTogglePlayer={onTogglePlayer}
        disabled={isSubmitting}
      />

      <NewPlayerForm onAddPlayer={onAddPlayer} disabled={isSubmitting} />

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting || selectedPlayerIds.length !== 4}>
          {isSubmitting ? 'Creating...' : submitButtonText}
        </button>
      </div>
    </form>
  );
}
