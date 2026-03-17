import React from 'react';
import { RadioField, RadioFieldProps } from '../../atoms';
import { Stack } from '../../layout';
import './RadioGroup.css';

export type RadioGroupOption = Omit<RadioFieldProps, 'onChange' | 'checked' | 'name'> & {
  value: string;
};

export type RadioGroupProps = {
  className?: string;
  name: string;
  options: RadioGroupOption[];
  value?: string;
  onChange?: (value: string) => void;
  direction?: 'vertical' | 'horizontal';
  gap?: '050' | '100' | '200' | '300' | '400';
  hasTitle?: boolean;
  isRequired?: boolean;
  title?: string;
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  className = '',
  name,
  options,
  value,
  onChange,
  direction = 'horizontal',
  gap = '400',
  hasTitle = true,
  isRequired = false,
  title = 'Title',
}) => {
  const handleChange = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  return (
    <div className={`radio-group ${className}`} data-node-id="3191:2121">
      {hasTitle && (
        <div className="radio-group__label-row" data-name="label" data-node-id="3196:6527">
          {isRequired && (
            <p className="radio-group__required" data-node-id="3196:6528">
              *
            </p>
          )}
          <p className="radio-group__title" data-node-id="3196:6529">
            {title}
          </p>
        </div>
      )}
      <Stack
        className="radio-group__options"
        direction={direction === 'vertical' ? 'column' : 'row'}
        gap={gap}
        align="start"
      >
        {options.map((option) => (
          <RadioField
            key={option.value}
            {...option}
            name={name}
            checked={value === option.value}
            onChange={handleChange}
          />
        ))}
      </Stack>
    </div>
  );
};
