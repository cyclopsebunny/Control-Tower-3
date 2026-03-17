import React from 'react';
import './TextareaField.css';

export type TextareaFieldProps = {
  className?: string;
  description?: string;
  error?: string;
  hasDescription?: boolean;
  hasError?: boolean;
  hasLabel?: boolean;
  label?: string;
  state?: 'Default' | 'Error' | 'Disabled';
  value?: string;
  valueType?: 'Default' | 'Placeholder';
  placeholder?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export const TextareaField: React.FC<TextareaFieldProps> = ({
  className = '',
  description = 'Description',
  error = 'Hint',
  hasDescription = false,
  hasError = false,
  hasLabel = true,
  label = 'Label',
  state = 'Default',
  value = '',
  valueType = 'Default',
  placeholder = 'Placeholder',
  onChange,
  onFocus,
  onBlur,
}) => {
  const isDisabled = state === 'Disabled';
  const isError = state === 'Error' || hasError;
  const displayValue = valueType === 'Placeholder' && !value ? '' : value;
  const displayPlaceholder = valueType === 'Placeholder' && !value ? placeholder : '';

  return (
    <div className={`textarea-field ${className}`} data-node-id="589:17838">
      {hasLabel && (
        <p className="textarea-field__label" data-node-id="589:17839">
          {label}
        </p>
      )}
      {hasDescription && (
        <p className="textarea-field__description" data-node-id="611:27410">
          {description}
        </p>
      )}
      <div
        className={`textarea-field__textarea-wrapper ${isError ? 'textarea-field__textarea-wrapper--error' : ''} ${isDisabled ? 'textarea-field__textarea-wrapper--disabled' : ''}`}
        data-name="Textarea"
        data-node-id="589:17840"
      >
        <textarea
          className="textarea-field__textarea"
          value={displayValue}
          placeholder={displayPlaceholder}
          disabled={isDisabled}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          data-node-id="589:17841"
        />
        <div className="textarea-field__drag-handle" data-name="Drag" data-node-id="589:17842">
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 0.5H7M0 3.5H7M0 6.5H7"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      {hasError && isError && (
        <p className="textarea-field__error" data-node-id="589:17843">
          {error}
        </p>
      )}
    </div>
  );
};
