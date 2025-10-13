import { useMemo } from 'react';
import { calculateLeaderboard, calculatePairLeaderboard } from '../lib/scoreUtils';
import { useScoreStore } from '../store/useScoreStore';

export function LeaderboardPage() {
  const players = useScoreStore((state) => state.players);
  const games = useScoreStore((state) => state.games);
  const pairs = useScoreStore((state) => state.pairs);

  const leaderboard = useMemo(() => calculateLeaderboard(games), [games]);
  const pairLeaderboard = useMemo(() => calculatePairLeaderboard(games), [games]);
  const playerLookup = useMemo(
    () => new Map(players.map((player) => [player.id, player.name])),
    [players],
  );
  const pairLookup = useMemo(() => new Map(pairs.map((pair) => [pair.id, pair])), [pairs]);

  if (leaderboard.length === 0) {
    return <div className="panel">No games recorded yet.</div>;
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h1>Leaderboard</h1>
      </header>
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
              <td data-label="Player">{playerLookup.get(entry.playerId) ?? entry.playerId}</td>
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
      {pairLeaderboard.length > 0 ? (
        <>
          <h2 className="section-title">Top Pairs</h2>
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
              {pairLeaderboard.map((entry) => {
                const pair = pairLookup.get(entry.pairId);
                const label = pair
                  ? pair.players
                      .map((playerId) => playerLookup.get(playerId) ?? playerId)
                      .join(' & ')
                  : entry.pairId;
                return (
                  <tr key={entry.pairId}>
                    <td data-label="Pair">{label}</td>
                    <td data-label="Total Points">{entry.totalPoints}</td>
                    <td data-label="Games">{entry.gamesPlayed}</td>
                    <td data-label="Average">{entry.averagePoints}</td>
                    <td data-label="Last Played">
                      {entry.lastPlayedAt ? new Date(entry.lastPlayedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}
