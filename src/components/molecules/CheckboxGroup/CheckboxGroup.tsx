import React from 'react';
import { CheckboxField, CheckboxFieldProps } from '../../atoms';
import { Stack } from '../../layout';
import './CheckboxGroup.css';

export type CheckboxGroupOption = Omit<CheckboxFieldProps, 'onChange'> & {
  value: string;
};

export type CheckboxGroupProps = {
  className?: string;
  options: CheckboxGroupOption[];
  values?: string[];
  onChange?: (values: string[]) => void;
  direction?: 'row' | 'column';
  gap?: '050' | '100' | '200' | '300' | '400';
};

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  className = '',
  options,
  values = [],
  onChange,
  direction = 'column',
  gap = '100',
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (onChange) {
      if (checked) {
        onChange([...values, value]);
      } else {
        onChange(values.filter((v) => v !== value));
      }
    }
  };

  return (
    <Stack
      className={`checkbox-group ${className}`}
      direction={direction}
      gap={gap}
    >
      {options.map((option) => (
        <CheckboxField
          key={option.value}
          {...option}
          valueType={values.includes(option.value) ? 'Checked' : 'Unchecked'}
          onChange={(checked) => handleChange(option.value, checked)}
        />
      ))}
    </Stack>
  );
};
