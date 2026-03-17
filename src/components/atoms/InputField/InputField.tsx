import React from 'react';
import './InputField.css';

export type InputFieldProps = {
  className?: string;
  description?: string;
  error?: string;
  hasDescription?: boolean;
  hasError?: boolean;
  hasLabel?: boolean;
  isRequired?: boolean;
  label?: string;
  outlined?: boolean;
  state?: 'Disabled' | 'Enabled' | 'Error' | 'Focused';
  value?: string;
  valueType?: 'Default' | 'Placeholder';
  placeholder?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export const InputField: React.FC<InputFieldProps> = ({
  className = '',
  description = 'Description',
  error = 'Error',
  hasDescription = false,
  hasError = false,
  hasLabel = true,
  isRequired = false,
  label = 'Label',
  outlined = true,
  state = 'Enabled',
  value = '',
  valueType = 'Default',
  placeholder = 'Placeholder',
  onChange,
  onFocus,
  onBlur,
}) => {
  const isDisabled = state === 'Disabled';
  const isError = state === 'Error' || hasError;
  const isFocused = state === 'Focused';
  const displayValue = valueType === 'Placeholder' && !value ? '' : value;
  const displayPlaceholder = valueType === 'Placeholder' && !value ? placeholder : '';

  return (
    <div className={`input-field ${className}`} data-node-id="587:17058">
      {hasLabel && (
        <div className="input-field__label-row" data-name="label" data-node-id="3154:5607">
          {isRequired && (
            <p className="input-field__required" data-node-id="3154:5608">
              *
            </p>
          )}
          <p className="input-field__label" data-node-id="3154:5609">
            {label}
          </p>
        </div>
      )}
      {hasDescription && (
        <p className="input-field__description" data-node-id="611:27554">
          {description}
        </p>
      )}
      <div
        className={`input-field__input-wrapper ${outlined ? 'input-field__input-wrapper--outlined' : 'input-field__input-wrapper--filled'} ${isError ? 'input-field__input-wrapper--error' : ''} ${isFocused ? 'input-field__input-wrapper--focused' : ''} ${isDisabled ? 'input-field__input-wrapper--disabled' : ''}`}
        data-name="Input"
        data-node-id="587:17060"
      >
        <input
          type="text"
          className="input-field__input"
          value={displayValue}
          placeholder={displayPlaceholder}
          disabled={isDisabled}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          data-node-id="587:17061"
        />
      </div>
      {hasError && isError && (
        <p className="input-field__error" data-node-id="587:17063">
          {error}
        </p>
      )}
    </div>
  );
};
