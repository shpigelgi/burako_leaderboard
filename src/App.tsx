import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AppLayout } from './layout/AppLayout.tsx';
import { AddGamePage } from './pages/AddGamePage.tsx';
import { InfoPage } from './pages/InfoPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { LeaderboardPage } from './pages/LeaderboardPage.tsx';
import { GroupsPage } from './pages/GroupsPage.tsx';
import { PlayersPage } from './pages/PlayersPage.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { PageErrorBoundary } from './components/PageErrorBoundary.tsx';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/leaderboard" replace />} />
          <Route 
            path="/leaderboard" 
            element={
              <PageErrorBoundary pageName="Leaderboard">
                <LeaderboardPage />
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/history" 
            element={
              <PageErrorBoundary pageName="History">
                <HistoryPage />
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/info" 
            element={
              <PageErrorBoundary pageName="Info">
                <InfoPage />
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/add" 
            element={
              <PageErrorBoundary pageName="Add Game">
                <AddGamePage />
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <PageErrorBoundary pageName="Groups">
                <GroupsPage />
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/players" 
            element={
              <PageErrorBoundary pageName="Players">
                <PlayersPage />
              </PageErrorBoundary>
            } 
          />
          <Route path="*" element={<Navigate to="/leaderboard" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
