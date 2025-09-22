/**
 * @fileoverview Line style selector component for series appearance.
 *
 * This component provides a button-based interface for selecting line styles
 * including solid, dashed, and dotted patterns. Each option displays a visual
 * preview of the line style using CSS border properties. Features selection
 * highlighting and hover states. Used in series configuration dialogs for
 * controlling line appearance and styling patterns.
 */

import React from 'react';

interface LineStyleSelectorProps {
  value: string;
  onChange: (_style: string) => void;
}

export const LineStyleSelector: React.FC<LineStyleSelectorProps> = ({ value, onChange }) => {
  const lineStyles = [
    { value: 'solid', name: 'Solid' },
    { value: 'dashed', name: 'Dashed' },
    { value: 'dotted', name: 'Dotted' },
  ];

  return (
    <div className='line-style-selector'>
      {lineStyles.map(style => (
        <button
          key={style.value}
          className={`line-style-option ${value === style.value ? 'selected' : ''}`}
          onClick={() => onChange(style.value)}
        >
          <div className='line-style-preview'>
            <div
              className='line-style-line'
              style={{
                borderTop:
                  style.value === 'solid'
                    ? '2px solid #333'
                    : style.value === 'dashed'
                      ? '2px dashed #333'
                      : '2px dotted #333',
              }}
            />
          </div>
        </button>
      ))}
    </div>
  );
};
