import {
  CARD_POINT_VALUES,
  CLEAN_CANASTA_POINTS,
  DIRTY_CANASTA_POINTS,
  MUERTO_BONUS_POINTS,
  WINNER_BONUS_POINTS,
} from '../lib/scoring';

export function InfoPage() {
  return (
    <section className="panel info-panel">
      <header className="panel-header">
        <h1>How Burako Scores Works</h1>
        <p>Reference guide for the scoring rules, using the app, and the core features.</p>
      </header>

      <article className="info-section">
        <h2>Points System</h2>
        <p>The calculator follows the standard Burako scoring rules used by your group:</p>
        <ul className="info-list">
          <li>
            <strong>Clean canasta:</strong> +{CLEAN_CANASTA_POINTS} points each.
          </li>
          <li>
            <strong>Dirty canasta:</strong> +{DIRTY_CANASTA_POINTS} points each.
          </li>
          <li>
            <strong>Going out first:</strong> +{WINNER_BONUS_POINTS} point bonus for the winning team.
          </li>
          <li>
            <strong>Muerto penalty:</strong>{' '}
            {MUERTO_BONUS_POINTS}/player if the team does not pick up the muerto. When a team takes the
            muerto, the penalty is waived.
          </li>
          <li>
            <strong>Minus points:</strong> Enter any remaining card values at the end of the round; they are
            subtracted from the team total.
          </li>
        </ul>
        <details className="info-details">
          <summary>Card point reference</summary>
          <table className="info-table">
            <thead>
              <tr>
                <th>Card</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Jokers</td>
                <td>{CARD_POINT_VALUES.jokers}</td>
              </tr>
              <tr>
                <td>Twos</td>
                <td>{CARD_POINT_VALUES.twos}</td>
              </tr>
              <tr>
                <td>Aces</td>
                <td>{CARD_POINT_VALUES.aces}</td>
              </tr>
              <tr>
                <td>3–7</td>
                <td>{CARD_POINT_VALUES.threeToSeven}</td>
              </tr>
              <tr>
                <td>8–King</td>
                <td>{CARD_POINT_VALUES.eightToKing}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </article>

      <article className="info-section">
        <h2>Recording a Game</h2>
        <ol className="info-steps">
          <li>Open the Add Game page and choose the matchup.</li>
          <li>Select a scoring mode (manual, summary inputs, or card breakdown).</li>
          <li>Fill the relevant canasta counts, card totals, minus points, winner, and muerto toggles.</li>
          <li>Add optional notes for extra context.</li>
          <li>Save the game to update the history and leaderboard instantly.</li>
        </ol>
        <p>
          The app divides team totals across players automatically, so you no longer need to enter
          individual scores.
        </p>
      </article>

      <article className="info-section">
        <h2>Key Features</h2>
        <ul className="info-list">
          <li>
            <strong>Smart scoring:</strong> Supports manual, summary, and full card-count inputs with automatic
            breakdowns and validation.
          </li>
          <li>
            <strong>Instant history:</strong> Every saved game appears in the history feed with a detailed audit
            trail.
          </li>
          <li>
            <strong>Live leaderboard:</strong> Player totals and averages update after each game so standings stay
            accurate.
          </li>
          <li>
            <strong>Notes archive:</strong> Keep track of highlights or house rules per game for future reference.
          </li>
          <li>
            <strong>Device-friendly:</strong> Works great on tablets at the table and supports install-as-app via PWA.
          </li>
        </ul>
      </article>
    </section>
  );
}
