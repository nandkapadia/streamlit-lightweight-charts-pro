/**
 * @fileoverview Opacity slider component for adjusting transparency values.
 *
 * This component provides a range slider for adjusting opacity values from
 * 0-100%. Features a custom styled slider with gradient background that
 * visually represents the opacity change, and displays the current percentage
 * value. Used in series configuration dialogs for controlling fill and line
 * transparency levels.
 */

import React from 'react';

interface OpacitySliderProps {
  value: number; // 0-100
  onChange: (_value: number) => void;
}

export const OpacitySlider: React.FC<OpacitySliderProps> = ({ value, onChange }) => {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(event.target.value));
  };

  return (
    <div className='opacity-slider'>
      <input
        type='range'
        min='0'
        max='100'
        value={value}
        onChange={handleSliderChange}
        className='slider opacity-range'
        style={{
          background: `linear-gradient(to right,
            transparent 0%,
            rgba(76, 175, 80, 0.3) ${value}%,
            rgba(76, 175, 80, 1) 100%)`,
        }}
      />
      <span className='opacity-value'>{value}%</span>
    </div>
  );
};
