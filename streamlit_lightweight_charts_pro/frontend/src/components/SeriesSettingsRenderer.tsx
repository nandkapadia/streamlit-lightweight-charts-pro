/**
 * @fileoverview Series Settings Renderer
 *
 * Renders series-specific settings based on simple property-to-type mapping.
 * Automatically generates labels from property names and renders appropriate controls.
 */

import React, { useCallback } from 'react';
import { SeriesSettings, SettingType } from '../config/seriesSettingsRegistry';
import { SeriesConfig } from '../forms/SeriesSettingsDialog';

interface SeriesSettingsRendererProps {
  settings: SeriesSettings;
  seriesConfig: SeriesConfig;
  onConfigChange: (config: Partial<SeriesConfig>) => void;
  onOpenLineEditor: (lineType: string) => void;
  onOpenColorPicker: (colorType: string) => void;
}

/**
 * Convert camelCase property name to display label
 * Example: "upperFillColor" → "Upper Fill Color"
 */
function propertyToLabel(property: string): string {
  return property
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Renders series-specific settings from simple property map
 */
export const SeriesSettingsRenderer: React.FC<SeriesSettingsRendererProps> = ({
  settings,
  seriesConfig,
  onConfigChange,
  onOpenLineEditor,
  onOpenColorPicker,
}) => {
  if (!settings || Object.keys(settings).length === 0) {
    return null;
  }

  return (
    <div className='series-specific-settings'>
      {Object.entries(settings).map(([property, type]) => (
        <SettingControlRenderer
          key={property}
          property={property}
          type={type}
          seriesConfig={seriesConfig}
          onConfigChange={onConfigChange}
          onOpenLineEditor={onOpenLineEditor}
          onOpenColorPicker={onOpenColorPicker}
        />
      ))}
    </div>
  );
};

/**
 * Renders a single setting control based on its type
 */
const SettingControlRenderer: React.FC<{
  property: string;
  type: SettingType;
  seriesConfig: SeriesConfig;
  onConfigChange: (config: Partial<SeriesConfig>) => void;
  onOpenLineEditor: (lineType: string) => void;
  onOpenColorPicker: (colorType: string) => void;
}> = ({ property, type, seriesConfig, onConfigChange, onOpenLineEditor, onOpenColorPicker }) => {
  const label = propertyToLabel(property);

  switch (type) {
    case 'line':
      return (
        <LineEditorControlRenderer
          property={property}
          label={label}
          seriesConfig={seriesConfig}
          onOpenLineEditor={onOpenLineEditor}
        />
      );

    case 'color':
      return (
        <ColorPickerControlRenderer
          property={property}
          label={label}
          seriesConfig={seriesConfig}
          onOpenColorPicker={onOpenColorPicker}
        />
      );

    case 'boolean':
      return (
        <CheckboxControlRenderer
          property={property}
          label={label}
          seriesConfig={seriesConfig}
          onConfigChange={onConfigChange}
        />
      );

    case 'number':
      return (
        <NumberInputControlRenderer
          property={property}
          label={label}
          seriesConfig={seriesConfig}
          onConfigChange={onConfigChange}
        />
      );

    case 'lineStyle':
      return (
        <LineStyleDropdownRenderer
          property={property}
          label={label}
          seriesConfig={seriesConfig}
          onConfigChange={onConfigChange}
        />
      );

    default:
      return null;
  }
};

/**
 * Line Editor Control Renderer
 */
const LineEditorControlRenderer: React.FC<{
  property: string;
  label: string;
  seriesConfig: SeriesConfig;
  onOpenLineEditor: (lineType: string) => void;
}> = ({ property, label, seriesConfig, onOpenLineEditor }) => {
  const lineConfig = (seriesConfig as any)[property] || {};

  // Convert number style to string for display (TradingView LineStyle enum to label)
  const numberToStyleLabel: Record<number, string> = {
    0: 'solid',
    1: 'dotted',
    2: 'dashed',
    3: 'large dashed',
    4: 'sparse dotted',
  };

  const rawStyle = lineConfig.lineStyle ?? seriesConfig.lineStyle ?? 0;
  const styleLabel =
    typeof rawStyle === 'number' ? (numberToStyleLabel[rawStyle] ?? 'solid') : rawStyle;

  return (
    <div
      className='line-row'
      onClick={() => onOpenLineEditor(property)}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenLineEditor(property);
        }
      }}
      aria-label={`Edit ${label}`}
    >
      <span>{label}</span>
      <div className='line-preview'>
        <div
          className='line-color-swatch'
          style={{
            backgroundColor: lineConfig.color || seriesConfig.color || '#2196F3',
            width: '20px',
            height: '12px',
            border: '1px solid #ddd',
            borderRadius: '2px',
          }}
        />
        <span className='line-style-indicator'>
          {styleLabel} • {lineConfig.lineWidth || seriesConfig.lineWidth || 1}px
        </span>
      </div>
    </div>
  );
};

/**
 * Color Picker Control Renderer
 */
const ColorPickerControlRenderer: React.FC<{
  property: string;
  label: string;
  seriesConfig: SeriesConfig;
  onOpenColorPicker: (colorType: string) => void;
}> = ({ property, label, seriesConfig, onOpenColorPicker }) => {
  const color = (seriesConfig as any)[property] || '#2196F3';

  return (
    <div
      className='color-row'
      onClick={() => onOpenColorPicker(property)}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenColorPicker(property);
        }
      }}
      aria-label={`Edit ${label}`}
    >
      <span>{label}</span>
      <div className='color-preview'>
        <div
          className='color-swatch'
          style={{
            backgroundColor: color,
            width: '32px',
            height: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  );
};

/**
 * Checkbox Control Renderer
 */
const CheckboxControlRenderer: React.FC<{
  property: string;
  label: string;
  seriesConfig: SeriesConfig;
  onConfigChange: (config: Partial<SeriesConfig>) => void;
}> = ({ property, label, seriesConfig, onConfigChange }) => {
  const checked = (seriesConfig as any)[property] !== false;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onConfigChange({ [property]: e.target.checked } as any);
    },
    [property, onConfigChange]
  );

  return (
    <div className='checkbox-row'>
      <input
        type='checkbox'
        id={property}
        name={property}
        checked={checked}
        onChange={handleChange}
        aria-label={label}
      />
      <label htmlFor={property}>{label}</label>
    </div>
  );
};

/**
 * Number Input Control Renderer
 */
const NumberInputControlRenderer: React.FC<{
  property: string;
  label: string;
  seriesConfig: SeriesConfig;
  onConfigChange: (config: Partial<SeriesConfig>) => void;
}> = ({ property, label, seriesConfig, onConfigChange }) => {
  const value = (seriesConfig as any)[property] ?? 0;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(e.target.value);
      if (!isNaN(numValue)) {
        onConfigChange({ [property]: numValue } as any);
      }
    },
    [property, onConfigChange]
  );

  return (
    <div className='number-row'>
      <label htmlFor={property}>{label}</label>
      <input
        type='number'
        id={property}
        name={property}
        value={value}
        onChange={handleChange}
        step='any'
        aria-label={label}
      />
    </div>
  );
};

/**
 * Line Style Dropdown Renderer
 * Maps between LightweightCharts numeric values and human-readable strings
 */
const LineStyleDropdownRenderer: React.FC<{
  property: string;
  label: string;
  seriesConfig: SeriesConfig;
  onConfigChange: (config: Partial<SeriesConfig>) => void;
}> = ({ property, label, seriesConfig, onConfigChange }) => {
  // Line style mapping: LightweightCharts uses numbers
  const LINE_STYLES = [
    { value: 0, label: 'Solid' },
    { value: 1, label: 'Dotted' },
    { value: 2, label: 'Dashed' },
    { value: 3, label: 'Large Dashed' },
    { value: 4, label: 'Sparse Dotted' },
  ];

  const value = (seriesConfig as any)[property] ?? 0;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const numValue = parseInt(e.target.value, 10);
      onConfigChange({ [property]: numValue } as any);
    },
    [property, onConfigChange]
  );

  return (
    <div
      className='select-row'
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
      }}
    >
      <label htmlFor={property} style={{ fontSize: '13px', color: '#333' }}>
        {label}
      </label>
      <select
        id={property}
        name={property}
        value={value}
        onChange={handleChange}
        aria-label={label}
        style={{
          padding: '4px 8px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          fontSize: '13px',
          backgroundColor: '#fff',
          cursor: 'pointer',
        }}
      >
        {LINE_STYLES.map(style => (
          <option key={style.value} value={style.value}>
            {style.label}
          </option>
        ))}
      </select>
    </div>
  );
};
