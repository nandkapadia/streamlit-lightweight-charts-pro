/**
 * @fileoverview TradingView-style Color Picker Dialog
 *
 * This dialog provides comprehensive color selection capabilities with:
 * - TradingView-style color palette (8 rows x 10 columns)
 * - Opacity/transparency slider
 * - Custom color picker with hex input
 * - Matches LineEditorDialog styling exactly
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../styles/seriesConfigDialog.css';

/**
 * Props for ColorPickerDialog
 */
export interface ColorPickerDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Current color (hex format) */
  color: string;
  /** Current opacity (0-100) */
  opacity: number;
  /** Save callback */
  onSave: (color: string, opacity: number) => void;
  /** Cancel callback */
  onCancel: () => void;
}

/**
 * Comprehensive color palette matching the TradingView style from LineEditorDialog
 */
const COLOR_PALETTE = [
  // Row 1: Grays and blacks
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
  // Row 2: Primary colors
  [
    '#FF4444',
    '#FF8800',
    '#FFDD00',
    '#44DD44',
    '#44AAAA',
    '#4499FF',
    '#4444FF',
    '#8844FF',
    '#CC44FF',
    '#FF4499',
  ],
  // Row 3: Light tints
  [
    '#FFD4D4',
    '#FFE4C4',
    '#FFFACD',
    '#D4F4D4',
    '#D4E4E4',
    '#D4D4FF',
    '#E4D4FF',
    '#F4D4FF',
    '#FFD4F4',
    '#FFD4E4',
  ],
  // Row 4: Medium tints
  [
    '#FFAAAA',
    '#FFCC99',
    '#FFF299',
    '#AAFFAA',
    '#AACCCC',
    '#AAAAFF',
    '#CCAAFF',
    '#FFAAFF',
    '#FFAACC',
    '#FFAAAA',
  ],
  // Row 5: Vibrant colors
  [
    '#FF6666',
    '#FFAA44',
    '#FFEE44',
    '#66FF66',
    '#66CCCC',
    '#6666FF',
    '#AA66FF',
    '#FF66FF',
    '#FF66AA',
    '#FF6666',
  ],
  // Row 6: Saturated colors
  [
    '#FF3333',
    '#FF9922',
    '#FFCC22',
    '#33FF33',
    '#33AAAA',
    '#3333FF',
    '#9933FF',
    '#FF33FF',
    '#FF3399',
    '#FF3333',
  ],
  // Row 7: Dark colors
  [
    '#CC0000',
    '#CC6600',
    '#CC9900',
    '#00CC00',
    '#006666',
    '#0000CC',
    '#6600CC',
    '#CC00CC',
    '#CC0066',
    '#CC0000',
  ],
  // Row 8: Very dark colors
  [
    '#990000',
    '#993300',
    '#996600',
    '#009900',
    '#003333',
    '#000099',
    '#330099',
    '#990099',
    '#990033',
    '#990000',
  ],
];

/**
 * Color Picker Dialog component
 */
export const ColorPickerDialog: React.FC<ColorPickerDialogProps> = ({
  isOpen,
  color,
  opacity,
  onSave,
  onCancel,
}) => {
  // Local state for editing
  const [selectedColor, setSelectedColor] = useState(color);
  const [selectedOpacity, setSelectedOpacity] = useState(opacity);
  const [customColor, setCustomColor] = useState(color);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customHue, setCustomHue] = useState(0);
  const [customSaturation, setCustomSaturation] = useState(100);
  const [customLightness, setCustomLightness] = useState(50);

  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);

  // Update local state when props change
  useEffect(() => {
    setSelectedColor(color);
    setCustomColor(color);
  }, [color]);

  useEffect(() => {
    setSelectedOpacity(opacity);
  }, [opacity]);

  // Handle save
  const handleSave = useCallback(() => {
    onSave(selectedColor, selectedOpacity);
  }, [selectedColor, selectedOpacity, onSave]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSave();
      }
    },
    [onCancel, handleSave]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  // Handle color selection
  const handleColorSelect = useCallback((newColor: string) => {
    setSelectedColor(newColor);
  }, []);

  // Convert HSL to Hex
  const hslToHex = useCallback((h: number, s: number, l: number) => {
    const hDecimal = l / 100;
    const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }, []);

  // Handle custom color area click
  const handleCustomColorAreaClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const saturation = Math.round((x / rect.width) * 100);
      const lightness = Math.round(100 - (y / rect.height) * 100);
      setCustomSaturation(saturation);
      setCustomLightness(lightness);
      const newColor = hslToHex(customHue, saturation, lightness);
      setCustomColor(newColor);
    },
    [customHue, hslToHex]
  );

  // Handle hue slider change
  const handleHueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hue = parseInt(e.target.value, 10);
      setCustomHue(hue);
      const newColor = hslToHex(hue, customSaturation, customLightness);
      setCustomColor(newColor);
    },
    [customSaturation, customLightness, hslToHex]
  );

  // Handle custom color selection
  const handleCustomColorSelect = useCallback(() => {
    setSelectedColor(customColor);
    setShowCustomPicker(false);
  }, [customColor]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className='line-editor-overlay'
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '8px',
      }}
    >
      <div
        className='line-editor-dialog'
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        tabIndex={-1}
        role='dialog'
        aria-modal='true'
        aria-labelledby='color-picker-title'
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          width: '240px',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px 6px 6px 6px',
            borderBottom: '1px solid #e0e3e7',
          }}
        >
          <h3
            id='color-picker-title'
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '500',
              color: '#131722',
              lineHeight: '20px',
            }}
          >
            Color Palette
          </h3>
        </div>

        {/* Color Palette */}
        <div
          style={{
            padding: '6px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 15px)',
              gap: '1px',
              marginBottom: '6px',
              width: '100%',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            {COLOR_PALETTE.map((row, rowIndex) =>
              row.map((color, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    width: '15px',
                    height: '15px',
                    backgroundColor: color,
                    border:
                      selectedColor.toUpperCase() === color.toUpperCase()
                        ? '2px solid #2962ff'
                        : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))
            )}
          </div>

          {/* Add custom color button */}
          <button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            style={{
              width: '100%',
              height: '24px',
              border: '1px dashed #d1d4dc',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#787b86',
              fontSize: '12px',
              marginBottom: '6px',
              margin: '0 auto 6px auto',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
            title='Add custom color'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              style={{ marginRight: '4px' }}
            >
              <path
                d='M8 3V13M3 8H13'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
              />
            </svg>
            Custom color
          </button>

          {/* Custom Color Picker */}
          {showCustomPicker && (
            <div
              style={{
                marginBottom: '6px',
                border: '1px solid #e0e3e7',
                borderRadius: '8px',
                padding: '8px',
                backgroundColor: '#ffffff',
              }}
            >
              {/* Color Area */}
              <div
                onClick={handleCustomColorAreaClick}
                style={{
                  width: '100%',
                  height: '120px',
                  background: `linear-gradient(to top, #000000 0%, transparent 100%), linear-gradient(to right, #ffffff 0%, hsl(${customHue}, 100%, 50%) 100%)`,
                  borderRadius: '4px',
                  cursor: 'crosshair',
                  marginBottom: '8px',
                  position: 'relative',
                }}
              >
                {/* Selection indicator */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${customSaturation}%`,
                    top: `${100 - customLightness}%`,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Hue Slider */}
              <div style={{ marginBottom: '8px' }}>
                <input
                  type='range'
                  min='0'
                  max='360'
                  value={customHue}
                  onChange={handleHueChange}
                  style={{
                    width: '100%',
                    height: '8px',
                    background:
                      'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                    borderRadius: '4px',
                    appearance: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Color Preview and Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: customColor,
                    border: '1px solid #e0e3e7',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                />
                <input
                  type='text'
                  value={customColor}
                  onChange={e => setCustomColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    border: '1px solid #e0e3e7',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
                  }}
                />
                <button
                  onClick={handleCustomColorSelect}
                  style={{
                    padding: '4px 8px',
                    border: '1px solid #2962ff',
                    borderRadius: '4px',
                    backgroundColor: '#2962ff',
                    color: '#ffffff',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Opacity Section */}
        <div
          style={{
            padding: '0 6px 6px 6px',
            borderBottom: '1px solid #e0e3e7',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '400',
              color: '#787b86',
              marginBottom: '4px',
            }}
          >
            Opacity
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              boxSizing: 'border-box',
              paddingLeft: '2px',
              paddingRight: '2px',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: 1,
                height: '20px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #e0e3e7',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(90deg, transparent 0%, ${selectedColor} 100%)`,
                }}
              />
              <input
                type='range'
                min='0'
                max='100'
                value={selectedOpacity}
                onChange={e => setSelectedOpacity(parseInt(e.target.value, 10))}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: 0,
                  appearance: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
            </div>
            <input
              type='text'
              value={`${selectedOpacity}%`}
              onChange={e => {
                const value = e.target.value.replace('%', '');
                const opacity = Math.min(100, Math.max(0, parseInt(value, 10) || 0));
                setSelectedOpacity(opacity);
              }}
              style={{
                fontSize: '12px',
                color: '#131722',
                fontWeight: '400',
                width: '40px',
                flexShrink: 0,
                textAlign: 'right',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '6px',
            padding: '8px 6px',
            borderTop: '1px solid #e0e3e7',
            backgroundColor: '#f8f9fa',
          }}
        >
          <button
            style={{
              padding: '6px 12px',
              border: '1px solid #e0e3e7',
              borderRadius: '4px',
              backgroundColor: '#ffffff',
              color: '#131722',
              fontSize: '13px',
              fontWeight: '400',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
            onClick={onCancel}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            Cancel
          </button>
          <button
            style={{
              padding: '6px 12px',
              border: '1px solid #2962ff',
              borderRadius: '4px',
              backgroundColor: '#2962ff',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
            onClick={handleSave}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#1e53e5';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#2962ff';
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
