/**
 * @fileoverview TradingView-style series configuration dialog.
 *
 * This module provides a comprehensive series configuration dialog with
 * multi-series support, tabbed interface, and TradingView-style UI for
 * configuring series appearance, colors, line styles, and visibility.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SeriesType, SeriesConfiguration } from '../types/SeriesTypes';

/**
 * Information about a series for configuration purposes.
 */
export interface SeriesInfo {
  /** Unique identifier for the series */
  id: string;
  /** Type of series (Line, Candlestick, etc.) */
  type: SeriesType;
  /** Current configuration for the series */
  config: SeriesConfiguration;
  /** Display name for the series. If not provided, defaults to "Series XXX" */
  title?: string;
}

/**
 * Props for the multi-series configuration dialog.
 */
interface SeriesConfigDialogProps {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Callback fired when dialog should be closed */
  onClose: () => void;
  /** Array of all series in the pane to configure */
  seriesList: SeriesInfo[];
  /** Callback fired when series configuration changes */
  onConfigChange: (_seriesId: string, _config: SeriesConfiguration) => void;
}

/**
 * Legacy interface for backward compatibility with single-series dialogs.
 * @deprecated Use SeriesConfigDialogProps with seriesList instead
 */
interface LegacySeriesConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  seriesConfig: SeriesConfiguration;
  seriesType: SeriesType;
  seriesId: string;
  onConfigChange: (_config: SeriesConfiguration) => void;
}

/**
 * TradingView-style series configuration dialog.
 *
 * Provides a comprehensive interface for configuring series appearance and
 * behavior with support for multiple series through a tabbed interface.
 * Features include color pickers, opacity sliders, line style selectors,
 * and series-specific configuration options.
 *
 * The dialog supports both new multi-series mode and legacy single-series
 * mode for backward compatibility.
 *
 * @param props - Dialog configuration and event handlers
 * @returns The rendered configuration dialog
 *
 * @example
 * ```tsx
 * // Multi-series usage
 * <SeriesConfigDialog
 *   isOpen={true}
 *   onClose={() => setDialogOpen(false)}
 *   seriesList={[
 *     { id: 'series-1', type: 'Line', config: lineConfig },
 *     { id: 'series-2', type: 'Candlestick', config: candleConfig }
 *   ]}
 *   onConfigChange={(seriesId, config) => {
 *     console.log('Config changed for:', seriesId, config)
 *   }}
 * />
 *
 * // Legacy single-series usage (deprecated)
 * <SeriesConfigDialog
 *   isOpen={true}
 *   onClose={() => setDialogOpen(false)}
 *   seriesConfig={config}
 *   seriesType="Line"
 *   seriesId="main-series"
 *   onConfigChange={(config) => updateConfig(config)}
 * />
 * ```
 */
export const SeriesConfigDialog: React.FC<
  SeriesConfigDialogProps | LegacySeriesConfigDialogProps
> = props => {
  const isLegacy = 'seriesConfig' in props;

  // Convert legacy props to new format
  const seriesList: SeriesInfo[] = useMemo(
    () =>
      isLegacy
        ? [
            {
              id: props.seriesId,
              type: props.seriesType,
              config: props.seriesConfig,
              title: undefined,
            },
          ]
        : props.seriesList,
    [isLegacy, props]
  );

  const onConfigChange = isLegacy
    ? (_seriesId: string, config: SeriesConfiguration) => props.onConfigChange(config)
    : props.onConfigChange;

  const { isOpen, onClose } = props;

  // State for managing multiple series configurations
  const [localConfigs, setLocalConfigs] = useState<Map<string, SeriesConfiguration>>(new Map());
  const [activeTab, setActiveTab] = useState<string>('');

  // Initialize local configs from series list
  useEffect(() => {
    const newConfigs = new Map<string, SeriesConfiguration>();
    seriesList.forEach(series => {
      newConfigs.set(series.id, { ...series.config });
    });
    setLocalConfigs(newConfigs);

    // Set active tab to first series
    if (seriesList.length > 0 && !activeTab) {
      setActiveTab(seriesList[0].id);
    }
  }, [seriesList, activeTab]);

  if (!isOpen) return null;

  // Get current series info
  const currentSeries = seriesList.find(s => s.id === activeTab);
  const currentConfig = localConfigs.get(activeTab) || {};

  const handleConfigUpdate = (updates: Partial<SeriesConfiguration>) => {
    if (!activeTab) return;
    const newConfig = { ...currentConfig, ...updates };
    const newConfigs = new Map(localConfigs);
    newConfigs.set(activeTab, newConfig);
    setLocalConfigs(newConfigs);
  };

  const handleApply = () => {
    // Apply all changed configurations
    localConfigs.forEach((config, seriesId) => {
      onConfigChange(seriesId, config);
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset to original configs
    const resetConfigs = new Map<string, SeriesConfiguration>();
    seriesList.forEach(series => {
      resetConfigs.set(series.id, { ...series.config });
    });
    setLocalConfigs(resetConfigs);
    onClose();
  };

  const handleDefaults = () => {
    if (!currentSeries) return;
    const defaultConfig = getDefaultConfig(currentSeries.type);
    const newConfigs = new Map(localConfigs);
    newConfigs.set(activeTab, defaultConfig);
    setLocalConfigs(newConfigs);
  };

  // Generate tab name for series
  const getSeriesTabName = (series: SeriesInfo, index: number): string => {
    if (series.title && series.title.trim()) {
      return series.title.trim();
    }
    return `Series ${index + 1}`;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div
      className='tv-dialog-backdrop'
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className='tv-dialog'
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#1e222d',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          width: '440px',
          maxHeight: '80vh',
          overflow: 'hidden',
          border: '1px solid #363a45',
          color: '#d1d4dc',
        }}
      >
        {/* Header */}
        <div
          className='tv-dialog-header'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #363a45',
            minHeight: '48px',
          }}
        >
          <div
            className='tv-dialog-title'
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#d1d4dc',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Series Settings
          </div>
          <button
            className='tv-dialog-close'
            onClick={handleCancel}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#868993',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#2a2e39';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18' width='18' height='18'>
              <path stroke='currentColor' strokeWidth='1.2' d='m1.5 1.5 15 15m0-15-15 15'></path>
            </svg>
          </button>
        </div>

        {/* Tabs - One tab per series */}
        <div
          className='tv-dialog-tabs'
          style={{
            display: 'flex',
            borderBottom: '1px solid #363a45',
            backgroundColor: '#1e222d',
            overflowX: 'auto',
          }}
        >
          {seriesList.map((series, index) => (
            <button
              key={series.id}
              className={`tv-dialog-tab ${activeTab === series.id ? 'active' : ''}`}
              onClick={() => setActiveTab(series.id)}
              style={{
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === series.id ? '#d1d4dc' : '#787b86',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                borderBottom:
                  activeTab === series.id ? '2px solid #2962ff' : '2px solid transparent',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                minWidth: 'max-content',
              }}
              onMouseEnter={e => {
                if (activeTab !== series.id) {
                  e.currentTarget.style.color = '#d1d4dc';
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== series.id) {
                  e.currentTarget.style.color = '#787b86';
                }
              }}
            >
              {getSeriesTabName(series, index)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className='tv-dialog-content'
          style={{
            maxHeight: 'calc(80vh - 140px)',
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          {currentSeries && (
            <StylePanel
              config={currentConfig}
              seriesType={currentSeries.type}
              onChange={handleConfigUpdate}
            />
          )}
        </div>

        {/* Footer */}
        <div
          className='tv-dialog-footer'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid #363a45',
            backgroundColor: '#1e222d',
          }}
        >
          <button
            className='tv-button-defaults'
            onClick={handleDefaults}
            style={{
              padding: '6px 12px',
              border: '1px solid #363a45',
              backgroundColor: 'transparent',
              color: '#d1d4dc',
              fontSize: '13px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#2a2e39';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Defaults
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className='tv-button-cancel'
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #363a45',
                backgroundColor: 'transparent',
                color: '#d1d4dc',
                fontSize: '13px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#2a2e39';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              className='tv-button-ok'
              onClick={handleApply}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: '#2962ff',
                color: '#ffffff',
                fontSize: '13px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#1e53e5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#2962ff';
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StylePanel: React.FC<{
  config: SeriesConfiguration;
  seriesType: SeriesType;
  onChange: (_updates: Partial<SeriesConfiguration>) => void;
}> = ({ config, seriesType, onChange }) => {
  return (
    <div
      className='tv-style-panel'
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        fontSize: '13px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Series-specific style options */}
      {renderSeriesSpecificStyles(seriesType, config, onChange)}

      {/* Output Values Section */}
      <div
        style={{
          gridColumn: '1 / -1',
          marginTop: '16px',
          borderTop: '1px solid #363a45',
          paddingTop: '16px',
        }}
      >
        <h4
          style={{
            margin: '0 0 12px 0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#d1d4dc',
          }}
        >
          Output values
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          <div>
            <TVCheckbox
              checked={config.labelsOnPriceScale !== false}
              onChange={checked => onChange({ labelsOnPriceScale: checked })}
              label='Labels on price scale'
            />
          </div>

          <div>
            <TVCheckbox
              checked={config.valuesInStatusLine !== false}
              onChange={checked => onChange({ valuesInStatusLine: checked })}
              label='Values in status line'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// TradingView-style Checkbox Component
const TVCheckbox: React.FC<{
  checked: boolean;
  onChange: (_checked: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        color: '#d1d4dc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '16px',
          height: '16px',
          border: '1px solid #363a45',
          borderRadius: '2px',
          backgroundColor: checked ? '#2962ff' : '#2a2e39',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <input
          type='checkbox'
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{
            position: 'absolute',
            opacity: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            cursor: 'pointer',
          }}
        />
        {checked && (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 11 9'
            width='11'
            height='9'
            fill='none'
          >
            <path stroke='white' strokeWidth='2' d='M0.999878 4L3.99988 7L9.99988 1'></path>
          </svg>
        )}
      </div>
      <span>{label}</span>
    </label>
  );
};

// TradingView-style Color and Line Style Picker
const TVColorLinePicker: React.FC<{
  color: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  onChange: (_color: string) => void;
  onLineStyleChange?: (_style: 'solid' | 'dashed' | 'dotted') => void;
}> = ({
  color: _color,
  lineStyle: _lineStyle,
  onChange: _onChange,
  onLineStyleChange: _onLineStyleChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleColorSelect = (selectedColor: string) => {
    _onChange(selectedColor);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          border: '1px solid #363a45',
          borderRadius: '4px',
          backgroundColor: '#2a2e39',
          cursor: 'pointer',
          color: '#d1d4dc',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#363a45';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#2a2e39';
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: _color,
            borderRadius: '2px',
            border: '1px solid #363a45',
          }}
        />
        <div
          style={{
            width: '30px',
            height: '1px',
            backgroundColor: _color,
          }}
        />
      </button>
      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 1000,
              backgroundColor: '#1e222d',
              border: '1px solid #363a45',
              borderRadius: '4px',
              padding: '8px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              minWidth: '200px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '2px',
                marginBottom: '8px',
              }}
            >
              {[
                '#FF4444',
                '#F23645',
                '#FF8800',
                '#FFAA00',
                '#FFCC00',
                '#FFDD00',
                '#88CC00',
                '#4CAF50',
                '#00CC88',
                '#00CCCC',
                '#0088CC',
                '#2196F3',
                '#2962FF',
                '#4400CC',
                '#8800CC',
                '#CC00CC',
                '#CC0088',
                '#CC0044',
                '#FFFFFF',
                '#868993',
              ].map(paletteColor => (
                <div
                  key={paletteColor}
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: paletteColor,
                    cursor: 'pointer',
                    border: _color === paletteColor ? '2px solid #2962ff' : '1px solid #363a45',
                    borderRadius: '2px',
                  }}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleColorSelect(paletteColor);
                  }}
                />
              ))}
            </div>
            <input
              type='color'
              value={_color}
              onChange={e => {
                e.preventDefault();
                e.stopPropagation();
                handleColorSelect(e.target.value);
              }}
              style={{
                width: '100%',
                height: '24px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

// Color Picker Component
const ColorPicker: React.FC<{
  color: string;
  onChange: (_color: string) => void;
}> = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const colorPalette = [
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
      '#1A1A1A',
    ],
    [
      '#FFE5E5',
      '#FFCCCC',
      '#FFB3B3',
      '#FF9999',
      '#FF8080',
      '#FF6666',
      '#FF4D4D',
      '#FF3333',
      '#FF1A1A',
      '#FF0000',
    ],
    [
      '#FFE5CC',
      '#FFDB99',
      '#FFD166',
      '#FFC733',
      '#FFBD00',
      '#E6A600',
      '#CC9400',
      '#B38200',
      '#997000',
      '#805E00',
    ],
    [
      '#FFFFE5',
      '#FFFFCC',
      '#FFFFB3',
      '#FFFF99',
      '#FFFF80',
      '#FFFF66',
      '#FFFF4D',
      '#FFFF33',
      '#FFFF1A',
      '#FFFF00',
    ],
    [
      '#E5FFE5',
      '#CCFFCC',
      '#B3FFB3',
      '#99FF99',
      '#80FF80',
      '#66FF66',
      '#4DFF4D',
      '#33FF33',
      '#1AFF1A',
      '#00FF00',
    ],
    [
      '#E5FFFF',
      '#CCFFFF',
      '#B3FFFF',
      '#99FFFF',
      '#80FFFF',
      '#66FFFF',
      '#4DFFFF',
      '#33FFFF',
      '#1AFFFF',
      '#00FFFF',
    ],
    [
      '#E5E5FF',
      '#CCCCFF',
      '#B3B3FF',
      '#9999FF',
      '#8080FF',
      '#6666FF',
      '#4D4DFF',
      '#3333FF',
      '#1A1AFF',
      '#0000FF',
    ],
    [
      '#FFE5FF',
      '#FFCCFF',
      '#FFB3FF',
      '#FF99FF',
      '#FF80FF',
      '#FF66FF',
      '#FF4DFF',
      '#FF33FF',
      '#FF1AFF',
      '#FF00FF',
    ],
  ];

  return (
    <div className='color-picker'>
      <div
        className='color-swatch'
        style={{ backgroundColor: color }}
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
                    className={`palette-color ${color === paletteColor ? 'selected' : ''}`}
                    style={{ backgroundColor: paletteColor }}
                    onClick={() => {
                      onChange(paletteColor);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className='custom-color-section'>
            <input
              type='color'
              value={color}
              onChange={e => onChange(e.target.value)}
              style={{ width: '100%', height: '24px', border: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Opacity Slider Component
const OpacitySlider: React.FC<{
  value: number;
  onChange: (_value: number) => void;
}> = ({ value, onChange }) => {
  return (
    <div className='opacity-slider'>
      <input
        type='range'
        className='opacity-range'
        min='0'
        max='1'
        step='0.01'
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <span className='opacity-value'>{Math.round(value * 100)}%</span>
    </div>
  );
};

// Helper Functions

function getDefaultConfig(seriesType: SeriesType): SeriesConfiguration {
  const baseConfig: SeriesConfiguration = {
    color: '#2196F3',
    opacity: 1,
    lineWidth: 2,
    lineStyle: 'solid',
    lastPriceVisible: true,
    priceLineVisible: true,
    labelsOnPriceScale: true,
    valuesInStatusLine: true,
    precision: false,
    precisionValue: 'auto',
  };

  // Add series-specific defaults
  switch (seriesType) {
    case 'supertrend':
      return {
        ...baseConfig,
        period: 10,
        multiplier: 3.0,
        upTrend: { color: '#00C851', opacity: 1 },
        downTrend: { color: '#FF4444', opacity: 1 },
      };
    case 'bollinger_bands':
      return {
        ...baseConfig,
        length: 20,
        stdDev: 2,
        upperLine: { color: '#2196F3', opacity: 1 },
        lowerLine: { color: '#2196F3', opacity: 1 },
        fill: { color: '#2196F3', opacity: 0.1 },
      };
    case 'sma':
    case 'ema':
      return {
        ...baseConfig,
        length: 20,
        source: 'close',
        offset: 0,
      };
    default:
      return baseConfig;
  }
}

function renderSeriesSpecificStyles(
  seriesType: SeriesType,
  config: SeriesConfiguration,
  onChange: (_updates: Partial<SeriesConfiguration>) => void
) {
  switch (seriesType) {
    case 'supertrend':
      return (
        <>
          {/* Up Trend Row */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TVCheckbox
              checked={config.upTrend?.visible !== false}
              onChange={checked =>
                onChange({
                  upTrend: { ...config.upTrend, visible: checked },
                })
              }
              label='Up Trend'
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TVColorLinePicker
              color={config.upTrend?.color || '#4CAF50'}
              onChange={color =>
                onChange({
                  upTrend: { ...config.upTrend, color },
                })
              }
            />
            <div
              style={{
                padding: '4px 8px',
                border: '1px solid #363a45',
                borderRadius: '4px',
                backgroundColor: '#2a2e39',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' fill='none'>
                <path stroke='currentColor' d='M5.5 17v5.5h4v-18h4v12h4v-9h4V21'></path>
              </svg>
            </div>
          </div>

          {/* Down Trend Row */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TVCheckbox
              checked={config.downTrend?.visible !== false}
              onChange={checked =>
                onChange({
                  downTrend: { ...config.downTrend, visible: checked },
                })
              }
              label='Down Trend'
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TVColorLinePicker
              color={config.downTrend?.color || '#F23645'}
              onChange={color =>
                onChange({
                  downTrend: { ...config.downTrend, color },
                })
              }
            />
            <div
              style={{
                padding: '4px 8px',
                border: '1px solid #363a45',
                borderRadius: '4px',
                backgroundColor: '#2a2e39',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' fill='none'>
                <path
                  stroke='currentColor'
                  d='M5.5 16.5l5-5a1.414 1.414 0 0 1 2 0m11-1l-5 5a1.414 1.414 0 0 1-2 0'
                ></path>
                <path
                  fill='currentColor'
                  d='M14 5h1v2h-1zM14 10h1v2h-1zM14 15h1v2h-1zM14 20h1v2h-1z'
                ></path>
              </svg>
            </div>
          </div>

          {/* Body Middle Row */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TVCheckbox checked={false} onChange={_checked => onChange({})} label='Body Middle' />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TVColorLinePicker color='#2962FF' onChange={() => {}} />
            <div
              style={{
                padding: '4px 8px',
                border: '1px solid #363a45',
                borderRadius: '4px',
                backgroundColor: '#363a45',
                opacity: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' fill='none'>
                <path
                  stroke='currentColor'
                  d='M5.5 16.5l4.586-4.586a2 2 0 0 1 2.828 0l3.172 3.172a2 2 0 0 0 2.828 0L23.5 10.5'
                ></path>
              </svg>
            </div>
          </div>

          {/* Uptrend background Row */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TVCheckbox
              checked={config.upTrendBackground?.visible !== false}
              onChange={checked =>
                onChange({
                  upTrendBackground: { ...config.upTrendBackground, visible: checked },
                })
              }
              label='Uptrend background'
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TVColorLinePicker
              color={config.upTrendBackground?.color || 'rgba(76, 175, 80, 0.1)'}
              onChange={color =>
                onChange({
                  upTrendBackground: { ...config.upTrendBackground, color },
                })
              }
            />
          </div>

          {/* Downtrend background Row */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TVCheckbox
              checked={config.downTrendBackground?.visible !== false}
              onChange={checked =>
                onChange({
                  downTrendBackground: { ...config.downTrendBackground, visible: checked },
                })
              }
              label='Downtrend background'
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TVColorLinePicker
              color={config.downTrendBackground?.color || 'rgba(242, 54, 69, 0.1)'}
              onChange={color =>
                onChange({
                  downTrendBackground: { ...config.downTrendBackground, color },
                })
              }
            />
          </div>
        </>
      );

    case 'bollinger_bands':
      return (
        <>
          <div className='style-row'>
            <label>Upper Line</label>
            <div className='checkbox-with-style'>
              <input
                type='checkbox'
                checked={config.upperLine?.visible !== false}
                onChange={e =>
                  onChange({
                    upperLine: { ...config.upperLine, visible: e.target.checked },
                  })
                }
              />
              <ColorPicker
                color={config.upperLine?.color || '#2196F3'}
                onChange={color =>
                  onChange({
                    upperLine: { ...config.upperLine, color },
                  })
                }
              />
            </div>
          </div>
          <div className='style-row'>
            <label>Lower Line</label>
            <div className='checkbox-with-style'>
              <input
                type='checkbox'
                checked={config.lowerLine?.visible !== false}
                onChange={e =>
                  onChange({
                    lowerLine: { ...config.lowerLine, visible: e.target.checked },
                  })
                }
              />
              <ColorPicker
                color={config.lowerLine?.color || '#2196F3'}
                onChange={color =>
                  onChange({
                    lowerLine: { ...config.lowerLine, color },
                  })
                }
              />
            </div>
          </div>
          <div className='style-row'>
            <label>Fill</label>
            <div className='checkbox-with-style'>
              <input
                type='checkbox'
                checked={config.fill?.visible !== false}
                onChange={e =>
                  onChange({
                    fill: { ...config.fill, visible: e.target.checked },
                  })
                }
              />
              <ColorPicker
                color={config.fill?.color || '#2196F3'}
                onChange={color =>
                  onChange({
                    fill: { ...config.fill, color },
                  })
                }
              />
              <OpacitySlider
                value={config.fill?.opacity || 0.1}
                onChange={opacity =>
                  onChange({
                    fill: { ...config.fill, opacity },
                  })
                }
              />
            </div>
          </div>
        </>
      );

    default:
      return null;
  }
}
