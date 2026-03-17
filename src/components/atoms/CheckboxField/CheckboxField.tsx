import React from 'react';
import './CheckboxField.css';

export type CheckboxFieldProps = {
  className?: string;
  description?: string;
  hasDescription?: boolean;
  label?: string;
  state?: 'Default' | 'Disabled';
  valueType?: 'Unchecked' | 'Checked' | 'Indeterminate';
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  className = '',
  description = 'Description',
  hasDescription = true,
  label = 'Label',
  state = 'Default',
  valueType = 'Checked',
  checked = false,
  onChange,
}) => {
  const isChecked = valueType === 'Checked' || checked;
  const isIndeterminate = valueType === 'Indeterminate';
  const isDisabled = state === 'Disabled';

  const handleClick = () => {
    if (!isDisabled && onChange) {
      onChange(!isChecked);
    }
  };

  return (
    <div className={`checkbox-field ${className}`} data-node-id="9762:1442">
      <div className="checkbox-field__row" data-name="Checkbox and Label" data-node-id="9762:1443">
        <div
          className={`checkbox-field__checkbox ${isChecked ? 'checkbox-field__checkbox--checked' : ''} ${isIndeterminate ? 'checkbox-field__checkbox--indeterminate' : ''} ${isDisabled ? 'checkbox-field__checkbox--disabled' : ''}`}
          data-name="Checkbox"
          data-node-id="565:14466"
          onClick={handleClick}
          role="checkbox"
          aria-checked={isIndeterminate ? 'mixed' : isChecked}
          aria-disabled={isDisabled}
        >
          {(isChecked || isIndeterminate) && (
            <div className="checkbox-field__check" data-name="Check" data-node-id="565:14467">
              <div className="checkbox-field__icon-wrapper" data-name="Icon" data-node-id="I565:14467;3041:21961">
                <svg
                  className="checkbox-field__icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {isIndeterminate ? (
                    <rect x="4" y="7" width="8" height="2" fill="rgba(255, 255, 255, 1)" />
                  ) : (
                    <path
                      d="M13.3333 4L6 11.3333L2.66667 8"
                      stroke="rgba(255, 255, 255, 1)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            </div>
          )}
        </div>
        <p className="checkbox-field__label" data-node-id="280:12941">
          {label}
        </p>
      </div>
      {hasDescription && (
        <div className="checkbox-field__description-row" data-name="Description Row" data-node-id="9762:1446">
          <div className="checkbox-field__spacer" data-name="Space" data-node-id="709:11253" />
          <p className="checkbox-field__description" data-node-id="280:13588">
            {description}
          </p>
        </div>
      )}
    </div>
  );
};
