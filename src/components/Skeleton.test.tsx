import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTableRow } from './Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="50px" />);
    const skeleton = container.querySelector('.skeleton') as HTMLElement;
    expect(skeleton?.style.width).toBe('200px');
    expect(skeleton?.style.height).toBe('50px');
  });

  it('applies custom border radius', () => {
    const { container } = render(<Skeleton borderRadius="10px" />);
    const skeleton = container.querySelector('.skeleton') as HTMLElement;
    expect(skeleton?.style.borderRadius).toBe('10px');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toHaveClass('skeleton');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('SkeletonCard', () => {
  it('renders a skeleton card', () => {
    const { container } = render(<SkeletonCard />);
    const card = container.querySelector('.skeleton-card');
    expect(card).toBeInTheDocument();
  });

  it('contains multiple skeleton elements', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(1);
  });
});

describe('SkeletonList', () => {
  it('renders default number of items', () => {
    const { container } = render(<SkeletonList />);
    const items = container.querySelectorAll('.skeleton-list-item');
    expect(items).toHaveLength(3);
  });

  it('renders custom number of items', () => {
    const { container } = render(<SkeletonList count={5} />);
    const items = container.querySelectorAll('.skeleton-list-item');
    expect(items).toHaveLength(5);
  });
});

describe('SkeletonTableRow', () => {
  it('renders a table row', () => {
    const { container } = render(
      <table>
        <tbody>
          <SkeletonTableRow />
        </tbody>
      </table>
    );
    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();
  });

  it('renders default number of columns', () => {
    const { container } = render(
      <table>
        <tbody>
          <SkeletonTableRow />
        </tbody>
      </table>
    );
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(4);
  });

  it('renders custom number of columns', () => {
    const { container } = render(
      <table>
        <tbody>
          <SkeletonTableRow columns={6} />
        </tbody>
      </table>
    );
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(6);
  });
});
