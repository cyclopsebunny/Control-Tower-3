import React from 'react';
import './IconButton.css';

export type IconButtonProps = {
  className?: string;
  icon?: React.ReactNode;
  variant?: 'Primary' | 'Neutral' | 'Subtle';
  size?: 'Medium' | 'Small';
  state?: 'Default' | 'Hover' | 'Disabled';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  'aria-label'?: string;
};

export const IconButton: React.FC<IconButtonProps> = ({
  className = '',
  icon,
  variant = 'Primary',
  size = 'Medium',
  state = 'Default',
  onClick,
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
}) => {
  const isDisabled = disabled || state === 'Disabled';

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  const variantClass = `icon-button--variant-${variant.toLowerCase()}`;
  const sizeClass = `icon-button--size-${size.toLowerCase()}`;
  const stateClass = `icon-button--state-${state.toLowerCase()}`;

  return (
    <button
      type={type}
      className={`icon-button ${variantClass} ${sizeClass} ${stateClass} ${className}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      data-node-id="11:11509"
    >
      {icon || (
        <svg
          width={size === 'Medium' ? 24 : 20}
          height={size === 'Medium' ? 24 : 20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
};
