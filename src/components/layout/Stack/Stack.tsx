import React from 'react';
import './Stack.css';

export type StackProps = {
  className?: string;
  direction?: 'row' | 'column';
  gap?: '050' | '100' | '200' | '300' | '400';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  children: React.ReactNode;
};

export const Stack: React.FC<StackProps> = ({
  className = '',
  direction = 'column',
  gap = '100',
  align = 'start',
  justify = 'start',
  children,
}) => {
  const gapClass = `stack--gap-${gap}`;
  const alignClass = `stack--align-${align}`;
  const justifyClass = `stack--justify-${justify}`;
  const directionClass = `stack--direction-${direction}`;

  return (
    <div className={`stack ${directionClass} ${gapClass} ${alignClass} ${justifyClass} ${className}`}>
      {children}
    </div>
  );
};
