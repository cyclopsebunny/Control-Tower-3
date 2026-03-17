import React from 'react';
import './Tab.css';

export type TabProps = {
  className?: string;
  active?: boolean;
  label?: string;
  state?: 'Default' | 'Hover';
  onClick?: () => void;
  disabled?: boolean;
  'aria-selected'?: boolean;
  'aria-controls'?: string;
  id?: string;
};

export const Tab: React.FC<TabProps> = ({
  className = '',
  active = false,
  label = 'Label',
  state = 'Default',
  onClick,
  disabled = false,
  'aria-selected': ariaSelected,
  'aria-controls': ariaControls,
  id,
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const stateClass = `tab--state-${state.toLowerCase()}`;
  const activeClass = active ? 'tab--active' : '';

  return (
    <button
      type="button"
      role="tab"
      id={id}
      className={`tab ${activeClass} ${stateClass} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      aria-selected={ariaSelected !== undefined ? ariaSelected : active}
      aria-controls={ariaControls}
      data-node-id={active ? '3729:12961' : '3729:12962'}
    >
      <span className="tab__label" data-node-id={active ? '3729:12960' : '3729:12957'}>
        {label}
      </span>
    </button>
  );
};
