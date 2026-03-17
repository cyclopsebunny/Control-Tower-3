import React from 'react';
import './Grid.css';

export type GridProps = {
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: '050' | '100' | '200' | '300' | '400';
  children: React.ReactNode;
};

export const Grid: React.FC<GridProps> = ({
  className = '',
  columns = 12,
  gap = '200',
  children,
}) => {
  const columnsClass = `grid--columns-${columns}`;
  const gapClass = `grid--gap-${gap}`;

  return (
    <div className={`grid ${columnsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

export type GridItemProps = {
  className?: string;
  span?: number;
  children: React.ReactNode;
};

export const GridItem: React.FC<GridItemProps> = ({
  className = '',
  span = 1,
  children,
}) => {
  return (
    <div className={`grid-item grid-item--span-${span} ${className}`} style={{ gridColumn: `span ${span}` }}>
      {children}
    </div>
  );
};
