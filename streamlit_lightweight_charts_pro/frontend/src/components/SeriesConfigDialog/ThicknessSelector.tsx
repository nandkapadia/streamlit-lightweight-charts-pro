/**
 * @fileoverview Line thickness selector component for series styling.
 *
 * This component provides a button-based interface for selecting line thickness
 * values from 1px to 5px. Each option displays a visual preview of the line
 * thickness to help users make informed selections. Features hover states and
 * selection highlighting. Used in series configuration dialogs for controlling
 * line width properties.
 */

import React from 'react';

interface ThicknessSelectorProps {
  value: number;
  onChange: (_thickness: number) => void;
}

export const ThicknessSelector: React.FC<ThicknessSelectorProps> = ({ value, onChange }) => {
  const thicknessOptions = [
    { value: 1, display: '1px' },
    { value: 2, display: '2px' },
    { value: 3, display: '3px' },
    { value: 4, display: '4px' },
    { value: 5, display: '5px' },
  ];

  return (
    <div className='thickness-selector'>
      {thicknessOptions.map(option => (
        <button
          key={option.value}
          className={`thickness-option ${value === option.value ? 'selected' : ''}`}
          onClick={() => onChange(option.value)}
        >
          <div className='thickness-preview'>
            <div
              className='thickness-line'
              style={{
                height: `${option.value}px`,
                backgroundColor: '#333',
              }}
            />
          </div>
        </button>
      ))}
    </div>
  );
};
