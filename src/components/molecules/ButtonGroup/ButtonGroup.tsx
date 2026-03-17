import React from 'react';
import { Button, ButtonProps } from '../../atoms';
import './ButtonGroup.css';

export type ButtonGroupProps = {
  className?: string;
  align?: 'Start' | 'End' | 'Center' | 'Justify' | 'Stack';
  buttons: Array<Omit<ButtonProps, 'onClick'> & { onClick?: () => void }>;
  onButtonClick?: (index: number) => void;
};

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  className = '',
  align = 'Start',
  buttons,
  onButtonClick,
}) => {
  const alignClass = `button-group--align-${align.toLowerCase()}`;

  const handleButtonClick = (index: number, buttonOnClick?: () => void) => {
    if (buttonOnClick) {
      buttonOnClick();
    }
    if (onButtonClick) {
      onButtonClick(index);
    }
  };

  return (
    <div className={`button-group ${alignClass} ${className}`} data-node-id="2072:9432">
      {buttons.map((button, index) => (
        <Button
          key={index}
          {...button}
          onClick={() => handleButtonClick(index, button.onClick)}
          className={`button-group__button ${button.className || ''}`}
        />
      ))}
    </div>
  );
};
