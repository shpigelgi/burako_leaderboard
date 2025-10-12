import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AppLayout } from './layout/AppLayout.tsx';
import { AddGamePage } from './pages/AddGamePage.tsx';
import { InfoPage } from './pages/InfoPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/leaderboard" replace />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/add" element={<AddGamePage />} />
        <Route path="*" element={<Navigate to="/leaderboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
