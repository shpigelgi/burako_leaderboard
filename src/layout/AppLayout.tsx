import { useEffect } from 'react';
import { NavLink, Outlet, type NavLinkProps } from 'react-router-dom';
import { useScoreStore } from '../store/useScoreStore';

export function AppLayout() {
  const init = useScoreStore((state) => state.init);
  const initialized = useScoreStore((state) => state.initialized);
  const loading = useScoreStore((state) => state.loading);
  const error = useScoreStore((state) => state.error);

  const navClassName: NavLinkProps['className'] = ({ isActive }) =>
    isActive ? 'active' : undefined;

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">Burako Scores</div>
        <nav className="app-nav">
          <NavLink to="/leaderboard" className={navClassName}>
            Leaderboard
          </NavLink>
          <NavLink to="/history" className={navClassName}>
            History
          </NavLink>
          <NavLink to="/info" className={navClassName}>
            Info
          </NavLink>
          <NavLink to="/add" className={navClassName}>
            Add Game
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        {loading && !initialized ? <div className="status-card">Loading games…</div> : <Outlet />}
      </main>
      {error ? <div className="status-banner">{error}</div> : null}
    </div>
  );
}
