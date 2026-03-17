import React from 'react';
import './Container.css';

export type ContainerProps = {
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

export const Container: React.FC<ContainerProps> = ({
  className = '',
  maxWidth = 'full',
  padding = 'md',
  children,
}) => {
  const maxWidthClass = `container--max-width-${maxWidth}`;
  const paddingClass = `container--padding-${padding}`;

  return (
    <div className={`container ${maxWidthClass} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};
