import { useEffect } from 'react';
import { NavLink, Outlet, type NavLinkProps } from 'react-router-dom';
import { useScoreStore } from '../store/useScoreStore';

export function AppLayout() {
  const init = useScoreStore((state) => state.init);
  const initialized = useScoreStore((state) => state.initialized);
  const loading = useScoreStore((state) => state.loading);
  const error = useScoreStore((state) => state.error);
  const groups = useScoreStore((state) => state.groups);
  const activeGroupId = useScoreStore((state) => state.activeGroupId);
  const switchGroup = useScoreStore((state) => state.switchGroup);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const navClassName: NavLinkProps['className'] = ({ isActive }) =>
    isActive ? 'active' : undefined;

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="app-shell">
      <header className="app-header" role="banner">
        <div className="app-brand">
          <div>Burako Scores</div>
          {activeGroup && (
            <div className="active-group-name" title="Active Group">
              {activeGroup.name}
            </div>
          )}
        </div>
        <nav className="app-nav" aria-label="Main navigation">
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
          <NavLink to="/players" className={navClassName}>
            Players
          </NavLink>
          <NavLink to="/groups" className={navClassName}>
            Groups
          </NavLink>
        </nav>
        {groups.length > 1 && (
          <div className="group-selector">
            <label htmlFor="group-select" className="sr-only">
              Select active group
            </label>
            <select
              id="group-select"
              value={activeGroupId || ''}
              onChange={(e) => switchGroup(e.target.value)}
              className="field-control"
              aria-label="Select active group"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>
      <main id="main-content" className="app-main" role="main">
        {loading && !initialized ? <div className="status-card">Loading games…</div> : <Outlet />}
      </main>
      {error ? (
        <div className="status-banner" role="alert" aria-live="assertive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
