import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { useScoreStore } from "../../store/useScoreStore";
import type { GameId, GameRecord, PairId, PlayerId } from "../../types";

interface EditState {
  teamTotals: Record<PairId, number>;
  notes: string;
  playedAt: string;
}

const toDateTimeLocal = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export function HistoryPage() {
  const games = useScoreStore((state) => state.games);
  const players = useScoreStore((state) => state.players);
  const pairs = useScoreStore((state) => state.pairs);
  const updateGame = useScoreStore((state) => state.updateGame);
  const undoLastChange = useScoreStore((state) => state.undoLastChange);
  const deleteGame = useScoreStore((state) => state.deleteGame);
  const loading = useScoreStore((state) => state.loading);

  const playerLookup = useMemo(
    () => new Map(players.map((player) => [player.id, player.name])),
    [players]
  );
  const pairLookup = useMemo(
    () => new Map(pairs.map((pair) => [pair.id, pair])),
    [pairs]
  );

  const [editingId, setEditingId] = useState<GameId | undefined>();
  const [drafts, setDrafts] = useState<Record<GameId, EditState>>({});
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const startEdit = (game: GameRecord) => {
    setEditingId(game.id);
    setDrafts((current) => ({
      ...current,
      [game.id]: {
        teamTotals: Object.fromEntries(
          game.teams.map((team) => [team.pairId, team.totalPoints])
        ) as Record<PairId, number>,
        notes: game.notes ?? "",
        playedAt: game.playedAt,
      },
    }));
    setErrorMessage(undefined);
  };

  const cancelEdit = () => {
    setEditingId(undefined);
    setErrorMessage(undefined);
  };

  const handleTeamTotalChange =
    (gameId: GameId, pairId: PairId) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(event.target.value, 10);
      setDrafts((current) => {
        const draft = current[gameId];
        if (!draft) {
          return current;
        }
        return {
          ...current,
          [gameId]: {
            ...draft,
            teamTotals: {
              ...draft.teamTotals,
              [pairId]: Number.isNaN(value) ? 0 : value,
            },
          },
        };
      });
    };

  const handleNotesChange =
    (gameId: GameId) => (event: ChangeEvent<HTMLTextAreaElement>) => {
      const notes = event.target.value;
      setDrafts((current) => ({
        ...current,
        [gameId]: {
          ...current[gameId],
          notes,
        },
      }));
    };

  const handlePlayedAtChange =
    (gameId: GameId) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDrafts((current) => {
        const draft = current[gameId];
        if (!draft) {
          return current;
        }
        if (!value) {
          return {
            ...current,
            [gameId]: {
              ...draft,
              playedAt: draft.playedAt,
            },
          };
        }
        const nextDate = new Date(value);
        if (Number.isNaN(nextDate.getTime())) {
          return current;
        }
        return {
          ...current,
          [gameId]: {
            ...draft,
            playedAt: nextDate.toISOString(),
          },
        };
      });
    };

  const applyEdit = async (game: GameRecord) => {
    const draft = drafts[game.id];
    if (!draft) {
      return;
    }

    const updatedTeams = game.teams.map((team) => ({
      ...team,
      totalPoints: draft.teamTotals[team.pairId] ?? team.totalPoints,
    }));

    const playerTotals = new Map<PlayerId, number>();
    for (const team of updatedTeams) {
      const pair = pairLookup.get(team.pairId);
      if (!pair) {
        continue;
      }
      for (const playerId of pair.players) {
        playerTotals.set(playerId, team.totalPoints);
      }
    }

    const updatedScores = game.scores.map((score) => ({
      playerId: score.playerId,
      points: playerTotals.get(score.playerId) ?? score.points,
    }));

    const payload = {
      teams: updatedTeams,
      scores: updatedScores,
      notes: draft.notes.trim() ? draft.notes.trim() : undefined,
    } as const;

    const nextPayload =
      draft.playedAt !== game.playedAt
        ? {
            ...payload,
            playedAt: new Date(draft.playedAt).toISOString(),
          }
        : payload;

    try {
      await updateGame(game.id, nextPayload);
      setEditingId(undefined);
      setErrorMessage(undefined);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleUndo = async (gameId: GameId) => {
    try {
      await undoLastChange(gameId);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleDelete = async (gameId: GameId) => {
    if (!window.confirm("Delete this game permanently?")) {
      return;
    }
    try {
      await deleteGame(gameId);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  if (games.length === 0) {
    return <div className="panel">No games recorded yet.</div>;
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Game History</h1>
        <p>Review every round, adjust scores, or undo the latest change.</p>
      </header>
      {errorMessage ? (
        <div className="error-message">{errorMessage}</div>
      ) : null}
      <div className="history-list">
        {games
          .slice()
          .sort(
            (a, b) =>
              new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
          )
          .map((game) => {
            const isEditing = editingId === game.id;
            const draft = drafts[game.id];
            return (
              <article key={game.id} className="history-card">
                <header className="history-card__header">
                  <div>
                    {isEditing ? (
                      <div className="field">
                        <label
                          className="field-label"
                          htmlFor={`${game.id}-played-at`}
                        >
                          Played at
                        </label>
                        <input
                          id={`${game.id}-played-at`}
                          className="field-control"
                          type="datetime-local"
                          value={
                            draft
                              ? toDateTimeLocal(draft.playedAt)
                              : toDateTimeLocal(game.playedAt)
                          }
                          onChange={handlePlayedAtChange(game.id)}
                        />
                      </div>
                    ) : (
                      <h2>
                        Game on {new Date(game.playedAt).toLocaleString()}
                      </h2>
                    )}
                    <p className="muted">
                      Teams:{" "}
                      {game.teams
                        .map((team) => {
                          const pair = pairLookup.get(team.pairId);
                          if (!pair) {
                            // Fallback for legacy data (should not be needed after pair ID fix migration)
                            const teamScores = game.scores.filter(
                              (score) => score.points === team.totalPoints
                            );
                            if (teamScores.length > 0) {
                              const names = teamScores
                                .map(
                                  (score) =>
                                    playerLookup.get(score.playerId) ??
                                    "Unknown"
                                )
                                .join(" & ");
                              return `${names} (${team.totalPoints} pts)`;
                            }
                            return `Unknown pair (${team.totalPoints} pts)`;
                          }
                          const names = pair.players
                            .map(
                              (playerId) =>
                                playerLookup.get(playerId) ?? "Unknown"
                            )
                            .join(" & ");
                          return `${names} (${team.totalPoints} pts)`;
                        })
                        .join(" vs ")}
                    </p>
                  </div>
                  <div className="history-card__actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => applyEdit(game)}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(game)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleUndo(game.id)}
                          disabled={loading}
                        >
                          Undo
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDelete(game.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </header>
                {isEditing ? (
                  <div className="history-card__body">
                    <div className="scores-grid">
                      {game.teams.map((team) => {
                        const pair = pairLookup.get(team.pairId);
                        const label = pair
                          ? pair.players
                              .map(
                                (playerId) =>
                                  playerLookup.get(playerId) ?? playerId
                              )
                              .join(" & ")
                          : team.pairId;
                        return (
                          <div className="field" key={team.pairId}>
                            <label
                              className="field-label"
                              htmlFor={`${game.id}-${team.pairId}`}
                            >
                              {label}
                            </label>
                            <input
                              id={`${game.id}-${team.pairId}`}
                              className="field-control"
                              type="number"
                              value={
                                draft &&
                                draft.teamTotals[team.pairId] !== undefined
                                  ? draft.teamTotals[team.pairId]
                                  : ""
                              }
                              placeholder={(
                                draft?.teamTotals[team.pairId] ??
                                team.totalPoints
                              ).toString()}
                              onChange={handleTeamTotalChange(
                                game.id,
                                team.pairId
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="field full-width">
                      <label
                        className="field-label"
                        htmlFor={`${game.id}-notes`}
                      >
                        Notes
                      </label>
                      <textarea
                        id={`${game.id}-notes`}
                        className="field-control"
                        rows={3}
                        value={draft?.notes ?? game.notes ?? ""}
                        onChange={handleNotesChange(game.id)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="history-card__body">
                    <ul className="score-list">
                      {game.scores.map((score) => (
                        <li key={score.playerId}>
                          <span>{playerLookup.get(score.playerId)}</span>
                          <span>{score.points} pts</span>
                        </li>
                      ))}
                    </ul>
                    {game.notes ? (
                      <p className="muted">Notes: {game.notes}</p>
                    ) : null}
                    <details className="audit-trail">
                      <summary>Audit trail</summary>
                      <ul>
                        {game.auditTrail.map((entry) => (
                          <li key={entry.id}>
                            <span>
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                            <span>
                              {" "}
                              – {entry.type.toUpperCase()}: {entry.summary}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </article>
            );
          })}
      </div>
    </section>
  );
}
