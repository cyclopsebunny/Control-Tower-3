import React from 'react';
import './ButtonDanger.css';

export type ButtonDangerProps = {
  className?: string;
  children?: React.ReactNode;
  label?: string;
  variant?: 'Primary' | 'Subtle';
  size?: 'Medium' | 'Small';
  state?: 'Enabled' | 'Hover' | 'Pressed' | 'Disabled';
  hasIconStart?: boolean;
  hasIconEnd?: boolean;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

export const ButtonDanger: React.FC<ButtonDangerProps> = ({
  className = '',
  children,
  label = 'Button',
  variant = 'Primary',
  size = 'Medium',
  state = 'Enabled',
  hasIconStart = false,
  hasIconEnd = false,
  iconStart,
  iconEnd,
  onClick,
  type = 'button',
  disabled,
}) => {
  const isDisabled = disabled || state === 'Disabled';
  const displayLabel = children || label;

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  const variantClass = `button-danger--variant-${variant.toLowerCase()}`;
  const sizeClass = `button-danger--size-${size.toLowerCase()}`;
  const stateClass = `button-danger--state-${state.toLowerCase()}`;

  return (
    <button
      type={type}
      className={`button-danger ${variantClass} ${sizeClass} ${stateClass} ${className}`}
      onClick={handleClick}
      disabled={isDisabled}
      data-node-id="185:865"
    >
      {hasIconStart && iconStart && (
        <span className="button-danger__icon button-danger__icon--start">{iconStart}</span>
      )}
      {displayLabel && <span className="button-danger__label">{displayLabel}</span>}
      {hasIconEnd && iconEnd && (
        <span className="button-danger__icon button-danger__icon--end">{iconEnd}</span>
      )}
    </button>
  );
};
