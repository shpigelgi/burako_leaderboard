import { useMemo, useState } from 'react';
import {
  calculateGameLeaderboard,
  calculateLeaderboard,
  calculatePairLeaderboard,
} from '../../lib/scoreUtils';
import { useScoreStore } from '../../store/useScoreStore';
import { SkeletonTableRow } from '../../components/Skeleton';

type LeaderboardType = 'players' | 'pairs' | 'games';

const leaderboardOptions: Array<{ value: LeaderboardType; label: string }> = [
  { value: 'players', label: 'Player leaderboard' },
  { value: 'pairs', label: 'Pair leaderboard' },
  { value: 'games', label: 'Game leaderboard' },
];

export function LeaderboardPage() {
  const players = useScoreStore((state) => state.players);
  const games = useScoreStore((state) => state.games);
  const pairs = useScoreStore((state) => state.pairs);
  const loading = useScoreStore((state) => state.loading);

  const [selected, setSelected] = useState<LeaderboardType>('players');

  const leaderboard = useMemo(() => calculateLeaderboard(games), [games]);
  const pairLeaderboard = useMemo(() => calculatePairLeaderboard(games), [games]);
  const gameLeaderboard = useMemo(() => calculateGameLeaderboard(games), [games]);
  const playerLookup = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const pairLookup = useMemo(() => new Map(pairs.map((pair) => [pair.id, pair])), [pairs]);

  if (games.length === 0) {
    return <div className="panel">No games recorded yet.</div>;
  }

  const pairLabel = (pairId: string) => {
    const pair = pairLookup.get(pairId);
    if (!pair) {
      return 'Unknown';
    }
    
    return pair.players
      .map((playerId) => {
        const player = playerLookup.get(playerId);
        return player?.name ?? 'Unknown';
      })
      .join(' & ');
  };

  // Check if any pairs are missing
  const hasMissingPairs = useMemo(() => {
    return pairLeaderboard.some(entry => !pairLookup.get(entry.pairId));
  }, [pairLeaderboard, pairLookup]);

  const renderPlayers = () => {
    if (loading) {
      return (
        <>
          <h2 className="section-title">Top Players</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Total Points</th>
                <th>Games</th>
                <th>Average</th>
                <th>Last Played</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRow columns={5} />
              <SkeletonTableRow columns={5} />
              <SkeletonTableRow columns={5} />
            </tbody>
          </table>
        </>
      );
    }
    
    if (leaderboard.length === 0) {
      return <div className="status-card">No player stats available.</div>;
    }
    return (
      <>
        <h2 className="section-title">Top Players</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Total Points</th>
              <th>Games</th>
              <th>Average</th>
              <th>Last Played</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.playerId}>
                <td data-label="Player">{playerLookup.get(entry.playerId)?.name || 'Unknown'}</td>
                <td data-label="Total Points">{entry.totalPoints}</td>
                <td data-label="Games">{entry.gamesPlayed}</td>
                <td data-label="Average">{entry.averagePoints}</td>
                <td data-label="Last Played">
                  {entry.lastPlayedAt ? new Date(entry.lastPlayedAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  const renderPairs = () => {
    if (pairLeaderboard.length === 0) {
      return <div className="status-card">No pair stats available.</div>;
    }
    return (
      <>
        <h2 className="section-title">Top Pairs</h2>
        {hasMissingPairs && (
          <div className="status-card error">
            ⚠️ Warning: Some pairs could not be found. Pair data may be incomplete.
          </div>
        )}
        <table className="table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Total Points</th>
              <th>Games</th>
              <th>Average</th>
              <th>Last Played</th>
            </tr>
          </thead>
          <tbody>
            {pairLeaderboard.map((entry) => (
              <tr key={entry.pairId}>
                <td data-label="Pair">{pairLabel(entry.pairId)}</td>
                <td data-label="Total Points">{entry.totalPoints}</td>
                <td data-label="Games">{entry.gamesPlayed}</td>
                <td data-label="Average">{entry.averagePoints}</td>
                <td data-label="Last Played">
                  {entry.lastPlayedAt ? new Date(entry.lastPlayedAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  const renderGames = () => {
    if (gameLeaderboard.length === 0) {
      return <div className="status-card">No game stats available.</div>;
    }
    return (
      <>
        <h2 className="section-title">Best Wins</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Game #</th>
              <th>Played</th>
              <th>Winner</th>
              <th>Winning Points</th>
              <th>Loser</th>
              <th>Losing Points</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {gameLeaderboard.map((entry) => (
              <tr key={entry.gameId}>
                <td data-label="Game #">{entry.gameNumber}</td>
                <td data-label="Played">{new Date(entry.playedAt).toLocaleString()}</td>
                <td data-label="Winner">{pairLabel(entry.winningPairId)}</td>
                <td data-label="Winning Points">{entry.winningPoints}</td>
                <td data-label="Loser">{pairLabel(entry.losingPairId)}</td>
                <td data-label="Losing Points">{entry.losingPoints}</td>
                <td data-label="Margin">{entry.margin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  const renderContent = () => {
    if (selected === 'players') {
      return renderPlayers();
    }
    if (selected === 'pairs') {
      return renderPairs();
    }
    return renderGames();
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Leaderboard</h1>
        <label className="field">
          <span className="field-label">View</span>
          <select
            className="field-control"
            value={selected}
            onChange={(event) => setSelected(event.target.value as LeaderboardType)}
          >
            {leaderboardOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>
      {renderContent()}
    </section>
  );
}
