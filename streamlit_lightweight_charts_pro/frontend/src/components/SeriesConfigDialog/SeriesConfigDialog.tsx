/**
 * @fileoverview Alternative series configuration dialog implementation.
 *
 * This module provides an alternative implementation of the series configuration
 * dialog with a tabbed interface (Inputs, Style, Visibility). Features modular
 * sub-components for different configuration aspects, support for series-specific
 * inputs and styling options, and integration with ColorPicker, OpacitySlider,
 * ThicknessSelector, and LineStyleSelector components. Includes specialized
 * handling for SuperTrend and Bollinger Bands series types.
 */

import React, { useState, useEffect } from 'react';
import { SeriesConfiguration, SeriesType } from '../../types/SeriesTypes';
import { ColorPicker } from './ColorPicker';
import { OpacitySlider } from './OpacitySlider';
import { LineStyleSelector } from './LineStyleSelector';
import { ThicknessSelector } from './ThicknessSelector';
import './SeriesConfigDialog.css';

interface SeriesConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  seriesConfig: SeriesConfiguration;
  seriesType: SeriesType;
  onConfigChange: (_config: SeriesConfiguration) => void;
}

export const SeriesConfigDialog: React.FC<SeriesConfigDialogProps> = ({
  isOpen,
  onClose,
  seriesConfig,
  seriesType,
  onConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<'inputs' | 'style' | 'visibility'>('style');
  const [localConfig, setLocalConfig] = useState<SeriesConfiguration>(seriesConfig);

  useEffect(() => {
    setLocalConfig(seriesConfig);
  }, [seriesConfig]);

  const handleConfigUpdate = (updates: Partial<SeriesConfiguration>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  if (!isOpen) return null;

  return (
    <div className='series-config-overlay'>
      <div className='series-config-dialog'>
        <div className='series-config-header'>
          <h3>{getSeriesDisplayName(seriesType)}</h3>
          <button className='close-button' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='series-config-tabs'>
          <button
            className={`tab ${activeTab === 'inputs' ? 'active' : ''}`}
            onClick={() => setActiveTab('inputs')}
          >
            Inputs
          </button>
          <button
            className={`tab ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            Style
          </button>
          <button
            className={`tab ${activeTab === 'visibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('visibility')}
          >
            Visibility
          </button>
        </div>

        <div className='series-config-content'>
          {activeTab === 'inputs' && (
            <InputsPanel
              config={localConfig}
              seriesType={seriesType}
              onChange={handleConfigUpdate}
            />
          )}

          {activeTab === 'style' && (
            <StylePanel
              config={localConfig}
              seriesType={seriesType}
              onChange={handleConfigUpdate}
            />
          )}

          {activeTab === 'visibility' && (
            <VisibilityPanel
              config={localConfig}
              seriesType={seriesType}
              onChange={handleConfigUpdate}
            />
          )}
        </div>

        <div className='series-config-footer'>
          <button className='defaults-button'>Defaults</button>
          <div className='action-buttons'>
            <button className='cancel-button' onClick={onClose}>
              Cancel
            </button>
            <button className='ok-button' onClick={onClose}>
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StylePanel: React.FC<{
  config: SeriesConfiguration;
  seriesType: SeriesType;
  onChange: (_updates: Partial<SeriesConfiguration>) => void;
}> = ({ config, seriesType, onChange }) => {
  return (
    <div className='style-panel'>
      {/* Common style properties */}
      <div className='style-group'>
        <div className='style-row'>
          <label>Color</label>
          <ColorPicker color={config.color || '#2196F3'} onChange={color => onChange({ color })} />
          <OpacitySlider
            value={config.opacity || 100}
            onChange={opacity => onChange({ opacity })}
          />
        </div>
      </div>

      <div className='style-group'>
        <div className='style-row'>
          <label>Thickness</label>
          <ThicknessSelector
            value={config.lineWidth || 1}
            onChange={lineWidth => onChange({ lineWidth })}
          />
        </div>
      </div>

      <div className='style-group'>
        <div className='style-row'>
          <label>Line style</label>
          <LineStyleSelector
            value={config.lineStyle || 'solid'}
            onChange={lineStyle =>
              onChange({ lineStyle: lineStyle as 'solid' | 'dashed' | 'dotted' })
            }
          />
        </div>
      </div>

      {/* Series-specific style properties */}
      {renderSeriesSpecificStyle(seriesType, config, onChange)}
    </div>
  );
};

const VisibilityPanel: React.FC<{
  config: SeriesConfiguration;
  seriesType: SeriesType;
  onChange: (_updates: Partial<SeriesConfiguration>) => void;
}> = ({ config, seriesType, onChange }) => {
  return (
    <div className='visibility-panel'>
      <div className='visibility-group'>
        <h4>OUTPUT VALUES</h4>

        <div className='checkbox-row'>
          <input
            type='checkbox'
            id='precision'
            checked={config.precision || false}
            onChange={e => onChange({ precision: e.target.checked })}
          />
          <label htmlFor='precision'>Precision</label>
          <select
            value={config.precisionValue || 'default'}
            onChange={e => onChange({ precisionValue: e.target.value })}
          >
            <option value='default'>Default</option>
            <option value='0'>0</option>
            <option value='1'>1</option>
            <option value='2'>2</option>
            <option value='3'>3</option>
            <option value='4'>4</option>
          </select>
        </div>

        <div className='checkbox-row'>
          <input
            type='checkbox'
            id='labelsOnPriceScale'
            checked={config.labelsOnPriceScale !== false}
            onChange={e => onChange({ labelsOnPriceScale: e.target.checked })}
          />
          <label htmlFor='labelsOnPriceScale'>Labels on price scale</label>
        </div>

        <div className='checkbox-row'>
          <input
            type='checkbox'
            id='valuesInStatusLine'
            checked={config.valuesInStatusLine !== false}
            onChange={e => onChange({ valuesInStatusLine: e.target.checked })}
          />
          <label htmlFor='valuesInStatusLine'>Values in status line</label>
        </div>
      </div>

      {/* Series-specific visibility options */}
      {renderSeriesSpecificVisibility(seriesType, config, onChange)}
    </div>
  );
};

const InputsPanel: React.FC<{
  config: SeriesConfiguration;
  seriesType: SeriesType;
  onChange: (_updates: Partial<SeriesConfiguration>) => void;
}> = ({ config, seriesType, onChange }) => {
  return (
    <div className='inputs-panel'>{renderSeriesSpecificInputs(seriesType, config, onChange)}</div>
  );
};

// Helper functions for series-specific rendering
const renderSeriesSpecificStyle = (
  seriesType: SeriesType,
  config: SeriesConfiguration,
  onChange: (_updates: Partial<SeriesConfiguration>) => void
) => {
  switch (seriesType) {
    case 'supertrend':
      return (
        <>
          <div className='style-group'>
            <div className='style-row'>
              <div className='checkbox-with-style'>
                <input
                  type='checkbox'
                  id='upTrend'
                  checked={config.upTrend?.visible !== false}
                  onChange={e =>
                    onChange({
                      upTrend: { ...config.upTrend, visible: e.target.checked },
                    })
                  }
                />
                <label htmlFor='upTrend'>Up Trend</label>
                <ColorPicker
                  color={config.upTrend?.color || '#4CAF50'}
                  onChange={color =>
                    onChange({
                      upTrend: { ...config.upTrend, color },
                    })
                  }
                />
                <div className='style-icon'>📈</div>
              </div>
            </div>
          </div>

          <div className='style-group'>
            <div className='style-row'>
              <div className='checkbox-with-style'>
                <input
                  type='checkbox'
                  id='downTrend'
                  checked={config.downTrend?.visible !== false}
                  onChange={e =>
                    onChange({
                      downTrend: { ...config.downTrend, visible: e.target.checked },
                    })
                  }
                />
                <label htmlFor='downTrend'>Down Trend</label>
                <ColorPicker
                  color={config.downTrend?.color || '#F44336'}
                  onChange={color =>
                    onChange({
                      downTrend: { ...config.downTrend, color },
                    })
                  }
                />
                <div className='style-icon'>📉</div>
              </div>
            </div>
          </div>
        </>
      );

    case 'bollinger_bands':
      return (
        <>
          <div className='style-group'>
            <div className='style-row'>
              <div className='checkbox-with-style'>
                <input
                  type='checkbox'
                  id='upperLine'
                  checked={config.upperLine?.visible !== false}
                  onChange={e =>
                    onChange({
                      upperLine: { ...config.upperLine, visible: e.target.checked },
                    })
                  }
                />
                <label htmlFor='upperLine'>Upper Line</label>
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
          </div>

          <div className='style-group'>
            <div className='style-row'>
              <div className='checkbox-with-style'>
                <input
                  type='checkbox'
                  id='lowerLine'
                  checked={config.lowerLine?.visible !== false}
                  onChange={e =>
                    onChange({
                      lowerLine: { ...config.lowerLine, visible: e.target.checked },
                    })
                  }
                />
                <label htmlFor='lowerLine'>Lower Line</label>
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
          </div>

          <div className='style-group'>
            <div className='style-row'>
              <div className='checkbox-with-style'>
                <input
                  type='checkbox'
                  id='fill'
                  checked={config.fill?.visible !== false}
                  onChange={e =>
                    onChange({
                      fill: { ...config.fill, visible: e.target.checked },
                    })
                  }
                />
                <label htmlFor='fill'>Fill</label>
                <ColorPicker
                  color={config.fill?.color || '#2196F3'}
                  onChange={color =>
                    onChange({
                      fill: { ...config.fill, color },
                    })
                  }
                />
                <OpacitySlider
                  value={config.fill?.opacity || 10}
                  onChange={opacity =>
                    onChange({
                      fill: { ...config.fill, opacity },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </>
      );

    default:
      return null;
  }
};

const renderSeriesSpecificVisibility = (
  seriesType: SeriesType,
  config: SeriesConfiguration,
  onChange: (_updates: Partial<SeriesConfiguration>) => void
) => {
  // Common visibility options for all series types
  return (
    <div className='visibility-group'>
      <div className='checkbox-row'>
        <input
          type='checkbox'
          id='lastPriceVisible'
          checked={config.lastPriceVisible !== false}
          onChange={e => onChange({ lastPriceVisible: e.target.checked })}
        />
        <label htmlFor='lastPriceVisible'>Show last price</label>
      </div>

      <div className='checkbox-row'>
        <input
          type='checkbox'
          id='priceLineVisible'
          checked={config.priceLineVisible !== false}
          onChange={e => onChange({ priceLineVisible: e.target.checked })}
        />
        <label htmlFor='priceLineVisible'>Price line</label>
      </div>
    </div>
  );
};

const renderSeriesSpecificInputs = (
  seriesType: SeriesType,
  config: SeriesConfiguration,
  onChange: (_updates: Partial<SeriesConfiguration>) => void
) => {
  switch (seriesType) {
    case 'supertrend':
      return (
        <div className='inputs-group'>
          <div className='input-row'>
            <label htmlFor='period'>Period</label>
            <input
              type='number'
              id='period'
              value={config.period || 10}
              onChange={e => onChange({ period: parseInt(e.target.value) })}
              min='1'
              max='100'
            />
          </div>

          <div className='input-row'>
            <label htmlFor='multiplier'>Multiplier</label>
            <input
              type='number'
              id='multiplier'
              value={config.multiplier || 3}
              onChange={e => onChange({ multiplier: parseFloat(e.target.value) })}
              min='0.1'
              max='10'
              step='0.1'
            />
          </div>
        </div>
      );

    case 'bollinger_bands':
      return (
        <div className='inputs-group'>
          <div className='input-row'>
            <label htmlFor='length'>Length</label>
            <input
              type='number'
              id='length'
              value={config.length || 20}
              onChange={e => onChange({ length: parseInt(e.target.value) })}
              min='1'
              max='100'
            />
          </div>

          <div className='input-row'>
            <label htmlFor='stdDev'>StdDev</label>
            <input
              type='number'
              id='stdDev'
              value={config.stdDev || 2}
              onChange={e => onChange({ stdDev: parseFloat(e.target.value) })}
              min='0.1'
              max='5'
              step='0.1'
            />
          </div>
        </div>
      );

    default:
      return (
        <div className='inputs-group'>
          <p>No configurable inputs for this series type.</p>
        </div>
      );
  }
};

const getSeriesDisplayName = (seriesType: SeriesType): string => {
  const displayNames: Record<SeriesType, string> = {
    line: 'Line',
    area: 'Area',
    candlestick: 'Candlestick',
    bar: 'Bar',
    histogram: 'Histogram',
    supertrend: 'Supertrend',
    bollinger_bands: 'Bollinger Bands',
    sma: 'Simple Moving Average',
    ema: 'Exponential Moving Average',
  };
  return displayNames[seriesType] || seriesType;
};
