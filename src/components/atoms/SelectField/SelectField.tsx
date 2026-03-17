import React, { useState } from 'react';
import './SelectField.css';

export type SelectFieldOption = {
  value: string;
  label: string;
};

export type SelectFieldProps = {
  className?: string;
  description?: string;
  error?: string;
  expanded?: boolean;
  hasDescription?: boolean;
  hasError?: boolean;
  hasLabel?: boolean;
  hasLeftIcon?: boolean;
  hasValue?: boolean;
  isRequired?: boolean;
  label?: string;
  leftIcon?: React.ReactNode;
  menu?: React.ReactNode;
  outlined?: boolean;
  placeholder?: string;
  state?: 'Enabled' | 'Error' | 'Disabled';
  value?: string;
  options?: SelectFieldOption[];
  onChange?: (value: string) => void;
};

export const SelectField: React.FC<SelectFieldProps> = ({
  className = '',
  description = 'Description',
  error = 'Error',
  expanded: controlledExpanded,
  hasDescription = false,
  hasError = false,
  hasLabel = true,
  hasLeftIcon = false,
  hasValue = true,
  isRequired = false,
  label = 'Label',
  leftIcon,
  menu,
  outlined = true,
  placeholder = 'placeholder',
  state = 'Enabled',
  value = '',
  options = [],
  onChange,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const isDisabled = state === 'Disabled';
  const isError = state === 'Error' || hasError;

  const toggleExpanded = () => {
    if (!isDisabled) {
      setInternalExpanded(!internalExpanded);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setInternalExpanded(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = hasValue && selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`select-field ${className}`} data-node-id="2136:2347">
      {hasLabel && (
        <div className="select-field__label-row" data-name="label" data-node-id="3150:5451">
          {isRequired && (
            <p className="select-field__required" data-node-id="280:14702">
              *
            </p>
          )}
          <p className="select-field__label" data-node-id="3150:5424">
            {label}
          </p>
        </div>
      )}
      {hasDescription && (
        <p className="select-field__description" data-node-id="611:26734">
          {description}
        </p>
      )}
      <div className="select-field__select-wrapper">
        <div
          className={`select-field__select ${outlined ? 'select-field__select--outlined' : 'select-field__select--filled'} ${isError ? 'select-field__select--error' : ''} ${isDisabled ? 'select-field__select--disabled' : ''} ${isExpanded ? 'select-field__select--expanded' : ''}`}
          data-name="Select"
          data-node-id="565:15192"
          onClick={toggleExpanded}
          role="combobox"
          aria-expanded={isExpanded}
          aria-disabled={isDisabled}
        >
          {hasLeftIcon && (leftIcon || (
            <div className="select-field__left-icon" data-name="Star" data-node-id="3121:2070">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          ))}
          <p className={`select-field__value ${!hasValue ? 'select-field__value--placeholder' : ''}`} data-node-id="565:15193">
            {displayValue}
          </p>
          <div className="select-field__chevron" data-name="Chevron down" data-node-id="565:15194">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={isExpanded ? 'select-field__chevron-icon--up' : ''}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {isExpanded && !isDisabled && (
          <div className="select-field__menu">
            {menu || (
              <div className="select-field__options">
                {options.length > 0 ? (
                  options.map((option) => (
                    <div
                      key={option.value}
                      className={`select-field__option ${option.value === value ? 'select-field__option--selected' : ''}`}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.label}
                    </div>
                  ))
                ) : (
                  <div className="select-field__option">No options</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {hasError && isError && (
        <p className="select-field__error" data-node-id="565:15195">
          {error}
        </p>
      )}
    </div>
  );
};
