import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

/**
 * Skeleton loading component for better UX during data fetching.
 * Shows animated placeholder while content is loading.
 */
export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = '4px',
  className = '' 
}: SkeletonProps) {
  const style: CSSProperties = {
    width,
    height,
    borderRadius,
  };

  return <div className={`skeleton ${className}`} style={style} />;
}

/**
 * Skeleton for a card component
 */
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton height="2rem" width="60%" />
      <div style={{ marginTop: '0.5rem' }}>
        <Skeleton height="1rem" width="40%" />
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Skeleton height="2.5rem" width="5rem" borderRadius="8px" />
        <Skeleton height="2.5rem" width="5rem" borderRadius="8px" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a list of items
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton height="3rem" />
        </div>
      ))}
    </>
  );
}

/**
 * Skeleton for a table row
 */
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="skeleton-table-row">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <Skeleton height="1.5rem" />
        </td>
      ))}
    </tr>
  );
}
