import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import { AppLayout } from './layout/AppLayout.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { PageErrorBoundary } from './components/PageErrorBoundary.tsx';

// Lazy load feature pages for code splitting
const GroupsPage = lazy(() => import('./features/groups').then(m => ({ default: m.GroupsPage })));
const PlayersPage = lazy(() => import('./features/players').then(m => ({ default: m.PlayersPage })));
const AddGamePage = lazy(() => import('./features/games').then(m => ({ default: m.AddGamePage })));
const HistoryPage = lazy(() => import('./features/games').then(m => ({ default: m.HistoryPage })));
const LeaderboardPage = lazy(() => import('./features/leaderboard').then(m => ({ default: m.LeaderboardPage })));
const InfoPage = lazy(() => import('./pages/InfoPage.tsx').then(m => ({ default: m.InfoPage })));

function App() {
  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/leaderboard" replace />} />
          <Route 
            path="/leaderboard" 
            element={
              <PageErrorBoundary pageName="Leaderboard">
                <Suspense fallback={<div className="status-card">Loading...</div>}>
                  <LeaderboardPage />
                </Suspense>
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/history" 
            element={
              <PageErrorBoundary pageName="History">
                <Suspense fallback={<div className="status-card">Loading...</div>}>
                  <HistoryPage />
                </Suspense>
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/info" 
            element={
              <PageErrorBoundary pageName="Info">
                <Suspense fallback={<div className="status-card">Loading...</div>}>
                  <InfoPage />
                </Suspense>
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/add" 
            element={
              <PageErrorBoundary pageName="Add Game">
                <Suspense fallback={<div className="status-card">Loading...</div>}>
                  <AddGamePage />
                </Suspense>
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <PageErrorBoundary pageName="Groups">
                <Suspense fallback={<div className="status-card">Loading...</div>}>
                  <GroupsPage />
                </Suspense>
              </PageErrorBoundary>
            } 
          />
          <Route 
            path="/players" 
            element={
              <PageErrorBoundary pageName="Players">
                <Suspense fallback={<div className="status-card">Loading...</div>}>
                  <PlayersPage />
                </Suspense>
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
