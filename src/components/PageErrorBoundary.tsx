import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  pageName: string;
}

/**
 * Page-level error boundary with a custom fallback for individual pages.
 * Prevents one page's error from crashing the entire app.
 */
export function PageErrorBoundary({ children, pageName }: Props) {
  const fallback = (
    <div className="panel">
      <div className="error-message">
        <h2>⚠️ Error Loading {pageName}</h2>
        <p>
          We encountered an error while loading this page. 
          Please try refreshing or navigate to another page.
        </p>
        <div className="form-actions">
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="secondary"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
