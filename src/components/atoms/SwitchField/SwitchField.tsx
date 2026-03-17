import React from 'react';
import './SwitchField.css';

export type SwitchFieldProps = {
  className?: string;
  description?: string;
  hasDescription?: boolean;
  hasLabel?: boolean;
  label?: string;
  state?: 'Disabled' | 'Default';
  valueType?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export const SwitchField: React.FC<SwitchFieldProps> = ({
  className = '',
  description = 'Description',
  hasDescription = true,
  hasLabel = true,
  label = 'Label',
  state = 'Default',
  valueType = true,
  checked = false,
  onChange,
}) => {
  const isChecked = valueType || checked;
  const isDisabled = state === 'Disabled';

  const handleChange = () => {
    if (!isDisabled && onChange) {
      onChange(!isChecked);
    }
  };

  return (
    <div className={`switch-field ${className}`} data-node-id="9762:1903">
      <div className="switch-field__row" data-name="Checkbox and Label" data-node-id="9762:1904">
        {hasLabel && (
          <p className="switch-field__label" data-node-id="280:13860">
            {label}
          </p>
        )}
        <div
          className={`switch-field__switch ${isChecked ? 'switch-field__switch--checked' : ''} ${isDisabled ? 'switch-field__switch--disabled' : ''}`}
          data-name="Switch"
          data-node-id="565:15572"
          onClick={handleChange}
          role="switch"
          aria-checked={isChecked}
          aria-disabled={isDisabled}
        >
          <div className="switch-field__thumb" />
        </div>
      </div>
      {hasDescription && (
        <p className="switch-field__description" data-node-id="280:13948">
          {description}
        </p>
      )}
    </div>
  );
};
