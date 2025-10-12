import { useMemo } from 'react';
import { calculateLeaderboard } from '../lib/scoreUtils';
import { useScoreStore } from '../store/useScoreStore';

export function LeaderboardPage() {
  const players = useScoreStore((state) => state.players);
  const games = useScoreStore((state) => state.games);

  const leaderboard = useMemo(() => calculateLeaderboard(games), [games]);
  const playerLookup = useMemo(
    () => new Map(players.map((player) => [player.id, player.name])),
    [players],
  );

  if (leaderboard.length === 0) {
    return <div className="panel">No games recorded yet.</div>;
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Leaderboard</h1>
      </header>
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
              <td>{playerLookup.get(entry.playerId)}</td>
              <td>{entry.totalPoints}</td>
              <td>{entry.gamesPlayed}</td>
              <td>{entry.averagePoints}</td>
              <td>
                {entry.lastPlayedAt
                  ? new Date(entry.lastPlayedAt).toLocaleString()
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
