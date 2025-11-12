import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AppLayout } from './layout/AppLayout.tsx';
import { AddGamePage } from './pages/AddGamePage.tsx';
import { InfoPage } from './pages/InfoPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';
import { GroupsPage } from './pages/GroupsPage.tsx';
import { PlayersPage } from './pages/PlayersPage.tsx';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/leaderboard" replace />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/add" element={<AddGamePage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="*" element={<Navigate to="/leaderboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
