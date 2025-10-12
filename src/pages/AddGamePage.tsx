import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { useScoreStore } from '../store/useScoreStore';
import type {
  CardCountBreakdown,
  GameScore,
  Pair,
  PairId,
  PlayerId,
  ScoringMode,
  TeamResult,
  TeamScoringDetail,
} from '../types';
import {
  CARD_POINT_VALUES,
  buildCardsScoringDetail,
  buildManualScoringDetail,
  buildSummaryScoringDetail,
} from '../lib/scoring';

interface TeamFormState {
  pairId: PairId | '';
  cleanCanastas: number;
  dirtyCanastas: number;
  scoringMode: ScoringMode;
  manualTotal: number;
  cardPoints: number;
  minusPoints: number;
  tookMuerto: boolean;
  winner: boolean;
  cardCounts: CardCountBreakdown;
}

type NumericTeamField =
  | 'cleanCanastas'
  | 'dirtyCanastas'
  | 'manualTotal'
  | 'cardPoints'
  | 'minusPoints';

type ToggleTeamField = 'tookMuerto' | 'winner';

type CardCountField = keyof CardCountBreakdown;

const cardCountOptions: Array<{ field: CardCountField; label: string }> = [
  { field: 'jokers', label: 'Jokers (50 pts)' },
  { field: 'twos', label: '2s (20 pts)' },
  { field: 'aces', label: 'Aces (15 pts)' },
  { field: 'threeToSeven', label: '3–7 (5 pts)' },
  { field: 'eightToKing', label: '8–K (10 pts)' },
];

const scoringModeOptions: Array<{ value: ScoringMode; label: string; description: string }> = [
  { value: 'manual', label: 'Manual total', description: 'Enter the final score directly.' },
  {
    value: 'summary',
    label: 'Summary inputs',
    description: 'Use card points, canastas, winner, bonus, and minuses.',
  },
  {
    value: 'cards',
    label: 'Card breakdown',
    description: 'Track card counts, canastas, winner, and minus points.',
  },
];

interface MatchupOption {
  id: string;
  pairIds: [PairId, PairId];
  label: string;
}

const createCardCounts = (): CardCountBreakdown => ({
  jokers: 0,
  twos: 0,
  aces: 0,
  threeToSeven: 0,
  eightToKing: 0,
});

const createTeamState = (pairId: PairId | '' = ''): TeamFormState => ({
  pairId,
  cleanCanastas: 0,
  dirtyCanastas: 0,
  scoringMode: 'manual',
  manualTotal: 0,
  cardPoints: 0,
  minusPoints: 0,
  tookMuerto: false,
  winner: false,
  cardCounts: createCardCounts(),
});

const calculateCardPointsFromCounts = (counts: CardCountBreakdown): number =>
  counts.jokers * CARD_POINT_VALUES.jokers +
  counts.twos * CARD_POINT_VALUES.twos +
  counts.aces * CARD_POINT_VALUES.aces +
  counts.threeToSeven * CARD_POINT_VALUES.threeToSeven +
  counts.eightToKing * CARD_POINT_VALUES.eightToKing;

const computeTeamScoring = (team: TeamFormState): { total: number; detail: TeamScoringDetail } => {
  if (team.scoringMode === 'manual') {
    const { total, detail } = buildManualScoringDetail({ total: team.manualTotal });
    return { total, detail };
  }

  if (team.scoringMode === 'summary') {
    const { total, detail } = buildSummaryScoringDetail({
      cardPoints:
        team.cardPoints === 0
          ? calculateCardPointsFromCounts(team.cardCounts)
          : team.cardPoints,
      cleanCanastas: team.cleanCanastas,
      dirtyCanastas: team.dirtyCanastas,
      minusPoints: team.minusPoints,
      tookMuerto: team.tookMuerto,
      winner: team.winner,
    });
    return { total, detail };
  }

  const { total, detail } = buildCardsScoringDetail({
    cardCounts: team.cardCounts,
    cleanCanastas: team.cleanCanastas,
    dirtyCanastas: team.dirtyCanastas,
    minusPoints: team.minusPoints,
    tookMuerto: team.tookMuerto,
    winner: team.winner,
  });
  return { total, detail };
};

export function AddGamePage() {
  const players = useScoreStore((state) => state.players);
  const pairs = useScoreStore((state) => state.pairs);
  const addGame = useScoreStore((state) => state.addGame);
  const loading = useScoreStore((state) => state.loading);

  const [teamA, setTeamA] = useState<TeamFormState>(() => createTeamState());
  const [teamB, setTeamB] = useState<TeamFormState>(() => createTeamState());
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatchupId, setSelectedMatchupId] = useState<string>('');

  const playerLookup = useMemo(
    () => new Map(players.map((player) => [player.id, player.name])),
    [players],
  );

  const pairLookup = useMemo(
    () => new Map(pairs.map((pair) => [pair.id, pair])),
    [pairs],
  );

  const pairLabel = (pair: Pair) =>
    pair.players.map((playerId) => playerLookup.get(playerId) ?? playerId).join(' & ');

  const teamASummary = useMemo(() => computeTeamScoring(teamA), [teamA]);
  const teamBSummary = useMemo(() => computeTeamScoring(teamB), [teamB]);

  const matchups = useMemo(() => {
    const results: MatchupOption[] = [];
    for (let i = 0; i < pairs.length; i += 1) {
      for (let j = i + 1; j < pairs.length; j += 1) {
        const first = pairs[i];
        const second = pairs[j];
        const combined = new Set<PlayerId>([...first.players, ...second.players]);
        const sharePlayers = first.players.some((playerId) => second.players.includes(playerId));
        if (sharePlayers || combined.size !== 4) {
          continue;
        }
        const label = `${pairLabel(first)} vs ${pairLabel(second)}`;
        results.push({
          id: `${first.id}__${second.id}`,
          pairIds: [first.id, second.id],
          label,
        });
      }
    }
    return results;
  }, [pairs, playerLookup]);

  useEffect(() => {
    if (matchups.length === 0) {
      return;
    }
    const hasCurrent = matchups.some((matchup) => matchup.id === selectedMatchupId);
    if (!hasCurrent) {
      const fallback = matchups[0];
      setSelectedMatchupId(fallback.id);
      setTeamA(createTeamState(fallback.pairIds[0]));
      setTeamB(createTeamState(fallback.pairIds[1]));
    }
  }, [matchups, selectedMatchupId]);

  useEffect(() => {
    if (!selectedMatchupId) {
      return;
    }
    const selectedMatchup = matchups.find((matchup) => matchup.id === selectedMatchupId);
    if (!selectedMatchup) {
      return;
    }
    setTeamA((current) =>
      current.pairId === selectedMatchup.pairIds[0]
        ? current
        : createTeamState(selectedMatchup.pairIds[0]),
    );
    setTeamB((current) =>
      current.pairId === selectedMatchup.pairIds[1]
        ? current
        : createTeamState(selectedMatchup.pairIds[1]),
    );
  }, [matchups, selectedMatchupId]);

  const handleMatchupChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMatchupId(event.target.value);
  };

  const updateTeamState = (
    team: 'A' | 'B',
    updater: (current: TeamFormState) => TeamFormState,
  ) => {
    if (team === 'A') {
      setTeamA((current) => updater({ ...current }));
    } else {
      setTeamB((current) => updater({ ...current }));
    }
  };

  const handleNumericTeamChange = (team: 'A' | 'B', field: NumericTeamField) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(event.target.value, 10);
      const safeValue = Number.isNaN(value) ? 0 : value;
      const normalized = field === 'manualTotal' ? safeValue : Math.max(0, safeValue);
      updateTeamState(team, (current) => ({ ...current, [field]: normalized }));
    };

  const handleToggleTeamChange = (team: 'A' | 'B', field: ToggleTeamField) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      updateTeamState(team, (current) => ({ ...current, [field]: checked }));
    };

  const handleCardCountChange = (team: 'A' | 'B', field: CardCountField) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(event.target.value, 10);
      const normalized = Number.isNaN(value) ? 0 : Math.max(0, value);
      updateTeamState(team, (current) => ({
        ...current,
        cardCounts: {
          ...current.cardCounts,
          [field]: normalized,
        },
      }));
    };

  const handleScoringModeChange = (team: 'A' | 'B') => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as ScoringMode;
    updateTeamState(team, (current) => {
      if (value === 'manual') {
        return {
          ...current,
          scoringMode: value,
          manualTotal: 0,
          cardPoints: 0,
          minusPoints: 0,
          tookMuerto: false,
          winner: false,
          cardCounts: createCardCounts(),
        };
      }
      if (value === 'summary') {
        return {
          ...current,
          scoringMode: value,
          cardPoints: 0,
          minusPoints: 0,
          tookMuerto: false,
          winner: false,
          cardCounts: createCardCounts(),
        };
      }
      return {
        ...current,
        scoringMode: value,
        minusPoints: 0,
        tookMuerto: false,
        winner: false,
        cardCounts: createCardCounts(),
      };
    });
  };

  const handleSelectOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const resetForm = () => {
    const selectedMatchup = matchups.find((matchup) => matchup.id === selectedMatchupId);
    setTeamA(createTeamState(selectedMatchup?.pairIds[0] ?? ''));
    setTeamB(createTeamState(selectedMatchup?.pairIds[1] ?? ''));
    setNotes('');
  };

  const derivePlayerScores = (teamResults: TeamResult[]): GameScore[] => {
    const distribution = new Map<PlayerId, number>();
    for (const team of teamResults) {
      const pair = pairLookup.get(team.pairId);
      if (!pair) {
        continue;
      }
      const playersInPair = pair.players.length;
      const baseShare = Math.floor(team.totalPoints / playersInPair);
      let remainder = team.totalPoints % playersInPair;
      for (const playerId of pair.players) {
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) {
          remainder -= 1;
        }
        const current = distribution.get(playerId) ?? 0;
        distribution.set(playerId, current + baseShare + extra);
      }
    }
    return Array.from(distribution.entries()).map(([playerId, points]) => ({ playerId, points }));
  };

  const buildTeamResult = (pairId: PairId, form: TeamFormState): TeamResult | undefined => {
    if (!pairId) {
      return undefined;
    }
    const pair = pairLookup.get(pairId);
    if (!pair) {
      return undefined;
    }
    const { total, detail } = computeTeamScoring(form);
    return {
      pairId,
      totalPoints: total,
      canasta: {
        cleanCanastas: form.cleanCanastas,
        dirtyCanastas: form.dirtyCanastas,
      },
      scoring: detail,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(undefined);
    setSuccessMessage(undefined);

    if (!teamA.pairId || !teamB.pairId) {
      setFormError('Select both teams before submitting.');
      return;
    }

    const pairA = pairLookup.get(teamA.pairId);
    const pairB = pairLookup.get(teamB.pairId);
    if (!pairA || !pairB) {
      setFormError('Selected teams are unavailable.');
      return;
    }

    const overlap = pairA.players.some((playerId) => pairB.players.includes(playerId));
    if (overlap) {
      setFormError('Teams cannot share players. Choose distinct pairings.');
      return;
    }

    const teamResults = [
      buildTeamResult(teamA.pairId, teamA),
      buildTeamResult(teamB.pairId, teamB),
    ];

    if (teamResults.some((team) => team === undefined)) {
      setFormError('Unable to build team results.');
      return;
    }

    const scores = derivePlayerScores(teamResults as TeamResult[]);

    try {
      setSubmitting(true);
      await addGame({
        teams: teamResults as TeamResult[],
        scores,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      setSuccessMessage('Game recorded successfully.');
      resetForm();
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const teamLabel = (pairId: PairId | '') => {
    if (!pairId) {
      return '—';
    }
    const pair = pairLookup.get(pairId);
    return pair ? pairLabel(pair) : '—';
  };

  const renderTeamScoring = (
    key: 'A' | 'B',
    team: TeamFormState,
    summary: ReturnType<typeof computeTeamScoring>,
  ) => {
    const prefix = key === 'A' ? 'teamA' : 'teamB';
    const isManual = team.scoringMode === 'manual';
    const isSummary = team.scoringMode === 'summary';

    return (
      <section className="team-scoring-card">
        <header className="team-scoring-card__header">
          <h2>Team {key}</h2>
          <p className="team-scoring-card__subtitle">{teamLabel(team.pairId)}</p>
        </header>
        <div className="field">
          <span className="field-label">Scoring mode</span>
          <div className="radio-group">
            {scoringModeOptions.map((option) => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name={`scoring-mode-${key}`}
                  value={option.value}
                  checked={team.scoringMode === option.value}
                  onChange={handleScoringModeChange(key)}
                />
                <div className="radio-option__content">
                  <span className="radio-option__label">{option.label}</span>
                  <span className="radio-option__description">{option.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
        {isManual ? (
          <div className="field">
            <label className="field-label" htmlFor={`${prefix}-manual-total`}>
              Manual total
            </label>
            <input
              id={`${prefix}-manual-total`}
              className="field-control"
              type="number"
              min={0}
              value={team.manualTotal === 0 ? '' : team.manualTotal}
              onChange={handleNumericTeamChange(key, 'manualTotal')}
              onFocus={handleSelectOnFocus}
              placeholder="0"
            />
          </div>
        ) : (
          <>
            <div className="field grid">
              <label className="field-label" htmlFor={`${prefix}-clean`}>
                Clean canastas
              </label>
              <input
                id={`${prefix}-clean`}
                className="field-control"
                type="number"
                min={0}
                value={team.cleanCanastas === 0 ? '' : team.cleanCanastas}
                onChange={handleNumericTeamChange(key, 'cleanCanastas')}
                onFocus={handleSelectOnFocus}
                placeholder="0"
              />
              <label className="field-label" htmlFor={`${prefix}-dirty`}>
                Dirty canastas
              </label>
              <input
                id={`${prefix}-dirty`}
                className="field-control"
                type="number"
                min={0}
                value={team.dirtyCanastas === 0 ? '' : team.dirtyCanastas}
                onChange={handleNumericTeamChange(key, 'dirtyCanastas')}
                onFocus={handleSelectOnFocus}
                placeholder="0"
              />
            </div>
            {isSummary ? (
              <div className="field">
                <label className="field-label" htmlFor={`${prefix}-card-points`}>
                  Card points
                </label>
                <input
                  id={`${prefix}-card-points`}
                  className="field-control"
                  type="number"
                  min={0}
                  value={team.cardPoints === 0 ? '' : team.cardPoints}
                  onChange={handleNumericTeamChange(key, 'cardPoints')}
                  onFocus={handleSelectOnFocus}
                  placeholder="0"
                />
              </div>
            ) : (
              <div className="field grid">
                {cardCountOptions.map((option) => (
                  <div key={option.field} className="field">
                    <label className="field-label" htmlFor={`${prefix}-${option.field}`}>
                      {option.label}
                    </label>
                    <input
                      id={`${prefix}-${option.field}`}
                      className="field-control"
                      type="number"
                      min={0}
                      value={team.cardCounts[option.field] === 0 ? '' : team.cardCounts[option.field]}
                      onChange={handleCardCountChange(key, option.field)}
                      onFocus={handleSelectOnFocus}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="field">
              <label className="field-label" htmlFor={`${prefix}-minus`}>
                Minus points
              </label>
              <input
                id={`${prefix}-minus`}
                className="field-control"
                type="number"
                min={0}
                value={team.minusPoints === 0 ? '' : team.minusPoints}
                onChange={handleNumericTeamChange(key, 'minusPoints')}
                onFocus={handleSelectOnFocus}
                placeholder="0"
              />
            </div>
            <div className="field checkbox-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={team.winner}
                  onChange={handleToggleTeamChange(key, 'winner')}
                />
                Winner
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={team.tookMuerto}
                  onChange={handleToggleTeamChange(key, 'tookMuerto')}
                />
                Took muerto
              </label>
            </div>
          </>
        )}
        <div className="team-summary">
          <span className="team-summary__total">{summary.total} pts</span>
          <span className="hint">{summary.detail.breakdown}</span>
        </div>
      </section>
    );
  };

  const isFormReady = players.length === 4 && matchups.length > 0;

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Add Game</h1>
        <p>Capture scores, canasta details, and notes for the latest round.</p>
      </header>
      {!isFormReady ? (
        <div className="status-card">Roster is loading…</div>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit}>
          <fieldset className="field-set">
            <legend>Game Setup</legend>
            <div className="field">
              <label className="field-label" htmlFor="matchup">
                Matchup
              </label>
              <select
                id="matchup"
                className="field-control"
                value={selectedMatchupId}
                onChange={handleMatchupChange}
                required
              >
                <option value="">Select matchup</option>
                {matchups.map((matchup) => (
                  <option key={matchup.id} value={matchup.id}>
                    {matchup.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="matchup-summary">
              <div className="team-chip">
                <span className="team-chip__label">Team A</span>
                <span className="team-chip__value">{teamLabel(teamA.pairId)}</span>
              </div>
              <div className="team-chip">
                <span className="team-chip__label">Team B</span>
                <span className="team-chip__value">{teamLabel(teamB.pairId)}</span>
              </div>
            </div>
            <div className="team-scoring-grid">
              {renderTeamScoring('A', teamA, teamASummary)}
              {renderTeamScoring('B', teamB, teamBSummary)}
            </div>
          </fieldset>

          <div className="field full-width">
            <label className="field-label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className="field-control"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional observations or highlights"
            />
          </div>

          {formError ? <div className="error-message">{formError}</div> : null}
          {successMessage ? <div className="success-message">{successMessage}</div> : null}

          <div className="form-actions">
            <button type="submit" disabled={submitting || loading}>
              {submitting ? 'Saving…' : 'Save Game'}
            </button>
            <button type="button" className="secondary" onClick={resetForm} disabled={submitting}>
              Reset
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
