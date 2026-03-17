import React from 'react';
import './RadioField.css';

export type RadioFieldProps = {
  className?: string;
  checked?: boolean;
  description?: string;
  hasDescription?: boolean;
  label?: string;
  state?: 'Default' | 'Disabled';
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export const RadioField: React.FC<RadioFieldProps> = ({
  className = '',
  checked = false,
  description = 'Description',
  hasDescription = false,
  label = 'Label',
  state = 'Default',
  name,
  value,
  onChange,
}) => {
  const isDisabled = state === 'Disabled';

  const handleChange = () => {
    if (!isDisabled && onChange && value) {
      onChange(value);
    }
  };

  return (
    <div className={`radio-field ${className}`} data-node-id="9762:1413">
      <div className="radio-field__row" data-name="Checkbox and Label" data-node-id="9762:1414">
        <input
          type="radio"
          className="radio-field__input"
          name={name}
          value={value}
          checked={checked}
          disabled={isDisabled}
          onChange={handleChange}
          id={value ? `radio-${value}` : undefined}
        />
        <label
          className={`radio-field__label-wrapper ${isDisabled ? 'radio-field__label-wrapper--disabled' : ''}`}
          htmlFor={value ? `radio-${value}` : undefined}
        >
          <div className="radio-field__radio" data-name="Radio" data-node-id="565:14976">
            {checked && (
              <svg
                className="radio-field__icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="8" cy="8" r="3" fill="currentColor" />
              </svg>
            )}
            {!checked && (
              <svg
                className="radio-field__icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            )}
          </div>
          <p className="radio-field__label-text" data-node-id="280:13742">
            {label}
          </p>
        </label>
      </div>
      {hasDescription && (
        <div className="radio-field__description-row" data-name="Description Row" data-node-id="9762:1417">
          <div className="radio-field__spacer" data-name="Space" data-node-id="709:11417" />
          <p className="radio-field__description" data-node-id="280:13823">
            {description}
          </p>
        </div>
      )}
    </div>
  );
};
