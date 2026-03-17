import React from 'react';
import './SliderField.css';

export type SliderFieldProps = {
  className?: string;
  description?: string;
  hasDescription?: boolean;
  hasLabel?: boolean;
  label?: string;
  state?: 'Default' | 'Disabled';
  min?: number;
  max?: number;
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
};

export const SliderField: React.FC<SliderFieldProps> = ({
  className = '',
  description = 'Description',
  hasDescription = true,
  hasLabel = true,
  label = 'Label',
  value = [0, 100],
}) => {
  const [startValue, endValue] = value;

  return (
    <div className={`slider-field ${className}`} data-node-id="151:9617">
      {hasLabel && (
        <div className="slider-field__label-row" data-name="Label" data-node-id="48:3202">
          <p className="slider-field__label" data-node-id="280:14082">
            {label}
          </p>
          <div className="slider-field__output" data-name="Slider Output" data-node-id="589:17702">
            <p className="slider-field__output-text" data-node-id="589:17703">
              $
            </p>
            <p className="slider-field__output-text" data-node-id="589:17704">
              {startValue}-{endValue}
            </p>
          </div>
        </div>
      )}
      <div className="slider-field__slider-wrapper" data-name="Slider" data-node-id="565:15435">
        <div className="slider-field__track" data-name="Block" data-node-id="565:15436">
          <div className="slider-field__knob slider-field__knob--start" data-name="Knob Start" data-node-id="565:15437" />
          <div className="slider-field__range" data-name="Slider" data-node-id="565:15438" />
          <div className="slider-field__knob slider-field__knob--end" data-name="Knob End" data-node-id="565:15439" />
        </div>
      </div>
      {hasDescription && (
        <p className="slider-field__description" data-node-id="280:14156">
          {description}
        </p>
      )}
    </div>
  );
};
