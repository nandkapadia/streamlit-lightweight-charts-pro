/**
 * @fileoverview TradingView-style Series Settings Dialog with React 19 Form Actions
 *
 * This component provides a comprehensive series configuration dialog with:
 * - Tabbed interface (one tab per series in pane)
 * - Common settings (visible, markers, lastValueVisible, priceLineVisible)
 * - Series-specific settings (e.g., Ribbon: upperLine, lowerLine, fill)
 * - Live preview with debounced updates
 * - Streamlit backend integration for persistence
 * - React 19 Form Actions with optimistic updates
 */

import React, { useState, useCallback, useTransition, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { logger } from '../utils/logger';
import { LineEditorDialog } from './LineEditorDialog';
import { ColorPickerDialog } from './ColorPickerDialog';
// import { useSeriesSettingsAPI } from '../hooks/useSeriesSettingsAPI'; // Temporarily disabled to prevent rerenders
import { SeriesSettingsRenderer } from '../components/SeriesSettingsRenderer';
import { getSeriesSettings } from '../config/seriesSettingsRegistry';
import {
  apiOptionsToDialogConfig,
  dialogConfigToApiOptions,
} from '../series/UnifiedPropertyMapper';
import { toCss, extractColorAndOpacity } from '../utils/colorUtils';
import '../styles/seriesConfigDialog.css';

/**
 * Series configuration interface matching LightweightCharts API
 */
export interface SeriesConfig {
  // Common settings (matching LightweightCharts SeriesOptionsCommon)
  visible?: boolean;
  title?: string;
  displayName?: string; // User-friendly name for UI elements
  lastValueVisible?: boolean;
  priceLineVisible?: boolean;
  priceLineColor?: string;
  priceLineWidth?: number;
  priceLineStyle?: number; // LineStyle enum values
  axisLabelVisible?: boolean; // Show/hide axis label

  // Line series settings (matching LineSeriesOptions)
  color?: string;
  lineStyle?: number | 'solid' | 'dashed' | 'dotted'; // Support both number and string
  lineWidth?: number;

  // Ribbon-specific settings (for ribbon series)
  upperLine?: {
    color?: string;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    lineWidth?: number;
  };
  lowerLine?: {
    color?: string;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    lineWidth?: number;
  };
  fill?: boolean;
  fillColor?: string;
  fillOpacity?: number;
}

/**
 * Series information
 */
export interface SeriesInfo {
  id: string;
  displayName: string;
  type:
    | 'line'
    | 'ribbon'
    | 'area'
    | 'candlestick'
    | 'bar'
    | 'histogram'
    | 'supertrend'
    | 'bollinger_bands'
    | 'sma'
    | 'ema'
    | 'signal';
}

/**
 * Line configuration for editing
 */
export interface LineConfig {
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  width: number;
}

/**
 * Props for SeriesSettingsDialog
 */
export interface SeriesSettingsDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Close dialog callback */
  onClose: () => void;
  /** Pane ID containing the series */
  paneId: string;
  /** List of series in this pane */
  seriesList: SeriesInfo[];
  /** Current series configurations */
  seriesConfigs: Record<string, SeriesConfig>;
  /** Configuration change callback */
  onConfigChange: (seriesId: string, config: Partial<SeriesConfig>) => void;
  /** Settings change event callback */
  onSettingsChanged?: (callback: () => void) => void;
}

/**
 * TradingView-style Series Settings Dialog with React 19 features
 */
export const SeriesSettingsDialog: React.FC<SeriesSettingsDialogProps> = ({
  isOpen,
  onClose,
  paneId: _paneId,
  seriesList,
  seriesConfigs,
  onConfigChange,
  onSettingsChanged: _onSettingsChanged,
}) => {
  // State management
  const [activeSeriesId, setActiveSeriesId] = useState<string>(seriesList[0]?.id || '');
  const [lineEditorOpen, setLineEditorOpen] = useState<{
    isOpen: boolean;
    lineType?: string;
    config?: LineConfig;
  }>({ isOpen: false });
  const [colorPickerOpen, setColorPickerOpen] = useState<{
    isOpen: boolean;
    colorType?: string;
    currentColor?: string;
    currentOpacity?: number;
  }>({ isOpen: false });

  // Optimistic configs for instant UI feedback
  const [optimisticConfigs, setOptimisticConfigs] =
    useState<Record<string, Partial<SeriesConfig>>>(seriesConfigs);

  // React 19 hooks for form handling and optimistic updates
  const [isPending] = useTransition();

  // API hooks for backend communication (currently disabled to prevent rerenders)
  // const { updateMultipleSettings } = useSeriesSettingsAPI();

  // Initialize configs from props (chart state is source of truth)
  useEffect(() => {
    const flatConfigsFromProps: Record<string, Partial<SeriesConfig>> = {};

    seriesList.forEach(series => {
      if (seriesConfigs[series.id]) {
        flatConfigsFromProps[series.id] = dialogConfigToApiOptions(
          series.type,
          seriesConfigs[series.id]
        );
      }
    });

    setOptimisticConfigs(flatConfigsFromProps);
  }, [seriesConfigs, seriesList]);

  // Helper function to generate tab titles with fallback logic
  const getTabTitle = useCallback(
    (series: SeriesInfo, index: number): string => {
      // Priority 1: Use series.displayName if available (already populated by SeriesDialogManager)
      if (series.displayName && series.displayName.trim()) {
        return series.displayName.trim();
      }

      // Priority 2: Check for displayName in seriesConfigs (user-friendly UI name)
      const seriesDisplayName = seriesConfigs[series.id]?.displayName;
      if (seriesDisplayName && seriesDisplayName.trim()) {
        return seriesDisplayName.trim();
      }

      // Priority 3: Check for title in seriesConfigs (technical name)
      const seriesTitle = seriesConfigs[series.id]?.title;
      if (seriesTitle && seriesTitle.trim()) {
        return seriesTitle.trim();
      }

      // Priority 4: Fall back to "Series Type + Number" format
      const typeDisplayName = series.type.charAt(0).toUpperCase() + series.type.slice(1);
      const seriesNumber = index + 1;
      const fallbackTitle = `${typeDisplayName} Series ${seriesNumber}`;
      return fallbackTitle;
    },
    [seriesConfigs]
  );

  // Store previously focused element for restoration
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle dialog open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      // Store current focus when dialog opens
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Add modal class to body
      document.body.classList.add('modal-open', 'series-dialog-open');

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body state when dialog closes
      document.body.classList.remove('modal-open', 'series-dialog-open');
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';

      // Blur the previously focused element (button) to allow chart interaction
      setTimeout(() => {
        // Unconditionally blur the previously focused button
        if (previousFocusRef.current) {
          try {
            (previousFocusRef.current as HTMLElement).blur();
          } catch (error) {
            logger.info('Could not blur previous element', 'SeriesSettings', error);
          }
        }

        // Also blur any currently active element
        if (
          document.activeElement instanceof HTMLElement &&
          document.activeElement !== document.body
        ) {
          document.activeElement.blur();
        }

        // Final check: ensure body doesn't block pointer events
        document.body.style.pointerEvents = '';
      }, 50);
    }
  }, [isOpen]);

  // Cleanup effect to ensure body state is always reset on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open', 'series-dialog-open');
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, []);

  // Debounced backend sync state (currently disabled to prevent rerenders)
  // const pendingBackendUpdates = useRef<Map<string, Partial<SeriesConfig>>>(new Map());
  // const backendSyncTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Handle configuration changes with immediate UI updates and debounced backend sync
  const handleConfigChange = useCallback(
    async (seriesId: string, configPatch: Partial<SeriesConfig>) => {
      // Get series type for conversion
      const series = seriesList.find(s => s.id === seriesId);
      const seriesType = series?.type;

      // Convert dialog config (nested) to API options (flat) if series type is known
      const flatConfigPatch = seriesType
        ? dialogConfigToApiOptions(seriesType, configPatch)
        : configPatch;

      // RESPONSIVENESS FIX: Direct state update for immediate visual feedback
      setOptimisticConfigs(prev => ({
        ...prev,
        [seriesId]: { ...prev[seriesId], ...flatConfigPatch },
      }));

      // Apply changes to chart immediately (using flat config for series API)
      if (onConfigChange) {
        onConfigChange(seriesId, flatConfigPatch);
      }
    },
    [onConfigChange, seriesList]
  );

  // Get current series info and config
  const activeSeriesInfo = seriesList.find(s => s.id === activeSeriesId);

  // Convert API options (flat) to dialog config (nested) for UI display
  const activeSeriesConfig = useMemo(() => {
    const flatConfig = optimisticConfigs[activeSeriesId] || {};
    if (!activeSeriesInfo?.type) return flatConfig;

    // Convert flat API options to nested dialog config using property mapper
    return apiOptionsToDialogConfig(activeSeriesInfo.type, flatConfig);
  }, [optimisticConfigs, activeSeriesId, activeSeriesInfo?.type]);

  // Get settings for active series type
  const seriesSettings = useMemo(
    () => getSeriesSettings(activeSeriesInfo?.type),
    [activeSeriesInfo?.type]
  );

  // Close handler - just close the dialog, focus restoration handled by useEffect
  const handleCloseWithFocusRestore = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lineEditorOpen.isOpen) {
          setLineEditorOpen({ isOpen: false });
        } else if (colorPickerOpen.isOpen) {
          setColorPickerOpen({ isOpen: false });
        } else {
          handleCloseWithFocusRestore();
        }
      }
    },
    [lineEditorOpen.isOpen, colorPickerOpen.isOpen, handleCloseWithFocusRestore]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !lineEditorOpen.isOpen && !colorPickerOpen.isOpen) {
        handleCloseWithFocusRestore();
      }
    },
    [lineEditorOpen.isOpen, colorPickerOpen.isOpen, handleCloseWithFocusRestore]
  );

  // Line editor handlers
  const openLineEditor = useCallback(
    (lineType: string) => {
      // Read line config from nested property (schema-aware)
      const lineConfig = (activeSeriesConfig as any)[lineType] || {};

      // Convert number style to string (TradingView LineStyle enum to dialog format)
      const numberToStyle: Record<number, 'solid' | 'dotted' | 'dashed'> = {
        0: 'solid',
        1: 'dotted',
        2: 'dashed',
      };

      // If lineStyle is a number, convert it; otherwise use it as-is (or default to 'solid')
      const styleValue =
        typeof lineConfig.lineStyle === 'number'
          ? (numberToStyle[lineConfig.lineStyle] ?? 'solid')
          : lineConfig.lineStyle || 'solid';

      setLineEditorOpen({
        isOpen: true,
        lineType,
        config: {
          color: lineConfig.color || '#2196F3',
          style: styleValue,
          width: lineConfig.lineWidth || 1,
        },
      });
    },
    [activeSeriesConfig]
  );

  const handleLineEditorSave = useCallback(
    async (config: LineConfig) => {
      if (lineEditorOpen.lineType) {
        // Convert string style to number (TradingView LineStyle enum)
        const styleToNumber: Record<string, number> = {
          solid: 0,
          dotted: 1,
          dashed: 2,
        };

        // Always save to nested property (schema-aware)
        await handleConfigChange(activeSeriesId, {
          [lineEditorOpen.lineType]: {
            color: config.color,
            lineStyle: styleToNumber[config.style] ?? 0,
            lineWidth: config.width,
          },
        });
      }
      setLineEditorOpen({ isOpen: false });
    },
    [activeSeriesId, lineEditorOpen.lineType, handleConfigChange]
  );

  // Color picker handlers
  const openColorPicker = useCallback(
    (colorType: string) => {
      // Schema-aware: read color from the property specified in the schema
      const colorValue = (activeSeriesConfig as any)[colorType] || '#2196F3';

      // Extract hex color and opacity from the color value (supports both hex and rgba)
      const { color: currentColor, opacity: currentOpacity } = extractColorAndOpacity(colorValue);

      setColorPickerOpen({
        isOpen: true,
        colorType,
        currentColor,
        currentOpacity,
      });
    },
    [activeSeriesConfig]
  );

  const handleColorPickerSave = useCallback(
    async (color: string, opacity: number) => {
      if (colorPickerOpen.colorType) {
        // Convert color and opacity to rgba format
        const finalColor = toCss(color, opacity);

        // Schema-aware: save to the property specified in the schema
        const configPatch: any = {
          [colorPickerOpen.colorType]: finalColor,
        };

        await handleConfigChange(activeSeriesId, configPatch);
      }
      setColorPickerOpen({ isOpen: false });
    },
    [activeSeriesId, colorPickerOpen.colorType, handleConfigChange]
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className='series-config-overlay'
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role='dialog'
      aria-modal='true'
      aria-labelledby='series-settings-title'
      aria-describedby='series-settings-description'
      tabIndex={-1}
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
        className='series-config-dialog'
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          width: '440px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e0e0e0',
          color: '#333333',
        }}
      >
        {/* Accessibility description */}
        <p id='series-settings-description' className='visually-hidden'>
          Configure series options for this pane. Use Tab to navigate between controls, Escape to
          close.
        </p>

        {/* Header */}
        <div
          className='series-config-header'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '1px solid #e0e0e0',
            minHeight: '36px',
            height: 'auto',
          }}
        >
          <div
            id='series-settings-title'
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#333333',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              padding: '0',
              minHeight: '24px',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'center',
              flex: '1',
              gap: '8px',
            }}
          >
            Settings
            {isPending && (
              <span
                style={{
                  fontSize: '14px',
                  color: '#2196F3',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
                title='Applying changes...'
              >
                ⏳
              </span>
            )}
          </div>
          <button
            className='close-button'
            onClick={handleCloseWithFocusRestore}
            aria-label='Close dialog'
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
              color: '#666666',
              fontSize: '18px',
              transition: 'background-color 0.1s ease, transform 0.1s ease',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }}
            onMouseDown={e => {
              (e.target as HTMLElement).style.transform = 'scale(0.95)';
            }}
            onMouseUp={e => {
              (e.target as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>

        {/* Series Tabs */}
        <div
          className='series-config-tabs'
          style={{
            display: 'flex',
            backgroundColor: '#f8f9fa',
            overflowX: 'auto',
            minHeight: '36px',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          {seriesList.map((series, index) => (
            <button
              key={series.id}
              className={`tab ${activeSeriesId === series.id ? 'active' : ''}`}
              onClick={() => setActiveSeriesId(series.id)}
              aria-selected={activeSeriesId === series.id}
              role='tab'
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeSeriesId === series.id ? '#131722' : '#787b86',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                borderBottom:
                  activeSeriesId === series.id ? '2px solid #2962ff' : '2px solid transparent',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                whiteSpace: 'nowrap',
                minHeight: '36px',
                lineHeight: '1.4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => {
                if (activeSeriesId !== series.id) {
                  (e.target as HTMLElement).style.color = '#131722';
                }
              }}
              onMouseLeave={e => {
                if (activeSeriesId !== series.id) {
                  (e.target as HTMLElement).style.color = '#787b86';
                }
              }}
            >
              {getTabTitle(series, index)}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div
          className='series-config-content'
          style={{
            flex: '1 1 auto',
            overflowY: 'auto', // Only scroll when content exceeds max height
            padding: '16px',
            minHeight: 0, // Allow flex shrinking
          }}
        >
          <form
            style={{
              fontSize: '13px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <input type='hidden' name='seriesId' value={activeSeriesId} />

            {/* Common Settings */}
            <div className='settings-section'>
              <div className='checkbox-row'>
                <input
                  type='checkbox'
                  id='visible'
                  name='visible'
                  checked={activeSeriesConfig.visible !== false}
                  onChange={e => handleConfigChange(activeSeriesId, { visible: e.target.checked })}
                  aria-label='Series visible'
                />
                <label htmlFor='visible'>Visible</label>
              </div>

              {/* Hide last value and price line options for Signal series (not applicable) */}
              {activeSeriesInfo?.type !== 'signal' && (
                <>
                  <div className='checkbox-row'>
                    <input
                      type='checkbox'
                      id='lastValueVisible'
                      name='lastValueVisible'
                      checked={activeSeriesConfig.lastValueVisible !== false}
                      onChange={e =>
                        handleConfigChange(activeSeriesId, { lastValueVisible: e.target.checked })
                      }
                      aria-label='Show last value'
                    />
                    <label htmlFor='lastValueVisible'>Last Value Visible</label>
                  </div>

                  <div className='checkbox-row'>
                    <input
                      type='checkbox'
                      id='priceLineVisible'
                      name='priceLineVisible'
                      checked={activeSeriesConfig.priceLineVisible !== false}
                      onChange={e => {
                        // When hiding price line, also hide axis label for cleaner chart
                        const config = e.target.checked
                          ? { priceLineVisible: true }
                          : { priceLineVisible: false, axisLabelVisible: false };
                        void handleConfigChange(activeSeriesId, config);
                      }}
                      aria-label='Show price line'
                    />
                    <label htmlFor='priceLineVisible'>Price Line</label>
                  </div>
                </>
              )}
            </div>

            {/* Series-Specific Settings - Simple Property-Based Rendering */}
            {seriesSettings && Object.keys(seriesSettings).length > 0 && (
              <SeriesSettingsRenderer
                settings={seriesSettings}
                seriesConfig={activeSeriesConfig}
                onConfigChange={config => handleConfigChange(activeSeriesId, config)}
                onOpenLineEditor={openLineEditor}
                onOpenColorPicker={openColorPicker}
              />
            )}

            {/* Submit button for form action (hidden) */}
            <button type='submit' style={{ display: 'none' }} disabled={isPending}>
              Apply Settings
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          className='series-config-footer'
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 12px',
            borderTop: '1px solid #e0e3e7',
            backgroundColor: '#ffffff',
            minHeight: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                border: '1px solid #e0e3e7',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#131722',
                fontSize: '13px',
                fontWeight: '400',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minHeight: '28px',
              }}
              onClick={() => {
                // Reset to defaults from schema
                // Reset to common defaults only (primitives have their own defaults)
                const defaultConfig: SeriesConfig = {
                  visible: true,
                  lastValueVisible: true,
                  priceLineVisible: true,
                };

                void handleConfigChange(activeSeriesId, defaultConfig);
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <span>Defaults</span>
              <svg
                style={{
                  marginLeft: '6px',
                  width: '12px',
                  height: '12px',
                  fill: '#787b86',
                }}
                viewBox='0 0 16 16'
              >
                <path d='M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z' />
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              style={{
                padding: '6px 16px',
                border: '1px solid #e0e3e7',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#131722',
                fontSize: '13px',
                fontWeight: '400',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minHeight: '28px',
                transition: 'background-color 0.1s ease, transform 0.05s ease',
              }}
              onClick={handleCloseWithFocusRestore}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Cancel
            </button>
            <button
              style={{
                padding: '6px 16px',
                border: '1px solid #2962ff',
                borderRadius: '4px',
                backgroundColor: '#2962ff',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                minHeight: '28px',
                transition: 'background-color 0.1s ease, transform 0.05s ease',
              }}
              onClick={handleCloseWithFocusRestore}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#1e53e5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#2962ff';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>

      {/* Sub-dialogs */}
      {lineEditorOpen.isOpen && lineEditorOpen.config && (
        <LineEditorDialog
          isOpen={true}
          config={lineEditorOpen.config}
          onSave={handleLineEditorSave}
          onCancel={() => setLineEditorOpen({ isOpen: false })}
        />
      )}

      {colorPickerOpen.isOpen && (
        <ColorPickerDialog
          isOpen={true}
          color={colorPickerOpen.currentColor || '#2196F3'}
          opacity={colorPickerOpen.currentOpacity || 20}
          onSave={handleColorPickerSave}
          onCancel={() => setColorPickerOpen({ isOpen: false })}
        />
      )}
    </div>,
    document.body
  );
};
