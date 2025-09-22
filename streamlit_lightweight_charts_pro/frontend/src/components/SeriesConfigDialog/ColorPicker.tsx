/**
 * @fileoverview Color picker component for series configuration.
 *
 * This component provides a comprehensive color selection interface with a
 * clickable color swatch that opens a dropdown palette. Features include
 * predefined color grids organized by grayscale and color variations,
 * click-outside handling for dropdown closure, and controlled color state.
 * Used within series configuration dialogs for selecting line and fill colors.
 */

import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (_color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedColor(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorPalette = [
    // Grayscale
    [
      '#FFFFFF',
      '#E5E5E5',
      '#CCCCCC',
      '#B3B3B3',
      '#999999',
      '#808080',
      '#666666',
      '#4D4D4D',
      '#333333',
      '#000000',
    ],
    // Primary colors
    [
      '#FF5252',
      '#FF9800',
      '#FFEB3B',
      '#4CAF50',
      '#00BCD4',
      '#2196F3',
      '#3F51B5',
      '#9C27B0',
      '#E91E63',
      '#F44336',
    ],
    // Light variations
    [
      '#FFCDD2',
      '#FFE0B2',
      '#FFF9C4',
      '#C8E6C9',
      '#B2EBF2',
      '#BBDEFB',
      '#C5CAE9',
      '#E1BEE7',
      '#F8BBD9',
      '#FFCDD2',
    ],
    // Medium variations
    [
      '#EF9A9A',
      '#FFCC02',
      '#FFF176',
      '#A5D6A7',
      '#4DD0E1',
      '#90CAF9',
      '#9FA8DA',
      '#CE93D8',
      '#F06292',
      '#EF5350',
    ],
    // Darker variations
    [
      '#E57373',
      '#FFB74D',
      '#FFF59D',
      '#81C784',
      '#26C6DA',
      '#64B5F6',
      '#7986CB',
      '#BA68C8',
      '#E91E63',
      '#EF5350',
    ],
    [
      '#F44336',
      '#FF9800',
      '#FFEB3B',
      '#4CAF50',
      '#00BCD4',
      '#2196F3',
      '#3F51B5',
      '#9C27B0',
      '#E91E63',
      '#F44336',
    ],
    [
      '#D32F2F',
      '#F57C00',
      '#FBC02D',
      '#388E3C',
      '#0097A7',
      '#1976D2',
      '#303F9F',
      '#7B1FA2',
      '#C2185B',
      '#D32F2F',
    ],
    [
      '#B71C1C',
      '#E65100',
      '#F57F17',
      '#2E7D32',
      '#006064',
      '#0D47A1',
      '#1A237E',
      '#4A148C',
      '#AD1457',
      '#B71C1C',
    ],
  ];

  const handleColorSelect = (newColor: string) => {
    setSelectedColor(newColor);
    onChange(newColor);
    setIsOpen(false);
  };

  return (
    <div className='color-picker' ref={dropdownRef}>
      <div
        className='color-swatch'
        style={{ backgroundColor: selectedColor }}
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <div className='color-palette-dropdown'>
          <div className='color-palette'>
            {colorPalette.map((row, rowIndex) => (
              <div key={rowIndex} className='color-row'>
                {row.map(paletteColor => (
                  <div
                    key={paletteColor}
                    className={`palette-color ${selectedColor === paletteColor ? 'selected' : ''}`}
                    style={{ backgroundColor: paletteColor }}
                    onClick={() => handleColorSelect(paletteColor)}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className='custom-color-section'>
            <button className='add-color-button'>+</button>
          </div>
        </div>
      )}
    </div>
  );
};
