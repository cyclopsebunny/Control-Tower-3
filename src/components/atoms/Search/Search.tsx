import React from 'react';
import './Search.css';

export type SearchProps = {
  className?: string;
  outlined?: boolean;
  state?: 'Default' | 'Disabled';
  value?: string;
  valueType?: 'Default' | 'Placeholder';
  placeholder?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
};

export const Search: React.FC<SearchProps> = ({
  className = '',
  outlined = true,
  state = 'Default',
  value = '',
  valueType = 'Default',
  placeholder = 'Search...',
  onChange,
  onFocus,
  onBlur,
  onClear,
}) => {
  const isDisabled = state === 'Disabled';
  const displayValue = valueType === 'Placeholder' && !value ? '' : value;
  const displayPlaceholder = valueType === 'Placeholder' && !value ? placeholder : '';

  return (
    <div
      className={`search ${outlined ? 'search--outlined' : 'search--filled'} ${isDisabled ? 'search--disabled' : ''} ${className}`}
      data-node-id="2236:14990"
    >
      <div className="search__icon-wrapper">
        <svg
          className="search__icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 14L10.5 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <input
        type="text"
        className="search__input"
        value={displayValue}
        placeholder={displayPlaceholder}
        disabled={isDisabled}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        data-node-id="2236:14991"
      />
      {value && !isDisabled && (
        <button
          className="search__clear"
          onClick={onClear}
          type="button"
          aria-label="Clear search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
