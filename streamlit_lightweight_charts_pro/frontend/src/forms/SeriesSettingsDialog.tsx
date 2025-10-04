/**
 * @fileoverview TradingView-style Series Settings Dialog with React 19 Form Actions
 *
 * This component provides a comprehensive series configuration dialog with:
 * - Tabbed interface (one tab per series in pane)
 * - Common settings (visible, markers, last_value_visible, price_line)
 * - Series-specific settings (e.g., Ribbon: upper_line, lower_line, fill)
 * - Live preview with debounced updates
 * - Streamlit backend integration for persistence
 * - React 19 Form Actions with optimistic updates
 */

import React, { useState, useCallback, useTransition, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Streamlit } from 'streamlit-component-lib';
import { logger } from '../utils/logger';
import { LineEditorDialog } from './LineEditorDialog';
import { ColorPickerDialog } from './ColorPickerDialog';
import { useSeriesSettingsAPI } from '../hooks/useSeriesSettingsAPI';
import { toCss } from '../utils/colorUtils';
import { debounce } from '../utils/performance';
import '../styles/seriesConfigDialog.css';

/**
 * Series configuration interface matching LightweightCharts API
 */
export interface SeriesConfig {
  // Common settings (matching LightweightCharts SeriesOptionsCommon)
  visible?: boolean;
  title?: string;
  lastValueVisible?: boolean;
  priceLineVisible?: boolean;
  priceLineColor?: string;
  priceLineWidth?: number;
  priceLineStyle?: number; // LineStyle enum values

  // Line series settings (matching LineSeriesOptions)
  color?: string;
  lineStyle?: number; // LineStyle enum values
  lineWidth?: number;

  // Legacy/backward compatibility (for existing dialog code)
  markers?: boolean;
  last_value_visible?: boolean; // Will be mapped to lastValueVisible
  price_line?: boolean; // Will be mapped to priceLineVisible
  line_style?: 'solid' | 'dashed' | 'dotted'; // Will be mapped to lineStyle
  line_width?: number; // Will be mapped to lineWidth

  // Ribbon-specific settings (for ribbon series)
  upper_line?: {
    color?: string;
    line_style?: 'solid' | 'dashed' | 'dotted';
    line_width?: number;
  };
  lower_line?: {
    color?: string;
    line_style?: 'solid' | 'dashed' | 'dotted';
    line_width?: number;
  };
  fill?: boolean;
  fill_color?: string;
  fill_opacity?: number;
}

/**
 * Series information
 */
export interface SeriesInfo {
  id: string;
  displayName: string;
  type: 'line' | 'ribbon' | 'area' | 'candlestick' | 'bar' | 'histogram' | 'supertrend' | 'bollinger_bands' | 'sma' | 'ema';
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
  paneId,
  seriesList,
  seriesConfigs,
  onConfigChange,
  onSettingsChanged: _onSettingsChanged,
}) => {
  // State management
  const [activeSeriesId, setActiveSeriesId] = useState<string>(seriesList[0]?.id || '');
  const [lineEditorOpen, setLineEditorOpen] = useState<{
    isOpen: boolean;
    lineType?: 'upper_line' | 'lower_line' | 'main_line';
    config?: LineConfig;
  }>({ isOpen: false });
  const [colorPickerOpen, setColorPickerOpen] = useState<{
    isOpen: boolean;
    colorType?: 'fill_color' | 'line_color';
    currentColor?: string;
    currentOpacity?: number;
  }>({ isOpen: false });

  // Optimistic configs for instant UI feedback
  const [optimisticConfigs, setOptimisticConfigs] = useState<Record<string, Partial<SeriesConfig>>>(seriesConfigs);

  // React 19 hooks for form handling and optimistic updates
  const [isPending, startTransition] = useTransition();

  // Sync optimistic configs when props change
  useEffect(() => {
    setOptimisticConfigs(seriesConfigs);
  }, [seriesConfigs]);

  // API hooks for backend communication
  const { updateSeriesSettings } = useSeriesSettingsAPI();

  // Helper function to generate tab titles with fallback logic
  const getTabTitle = useCallback((series: SeriesInfo, index: number): string => {
    // If the series has a title (from series.title), use it
    const seriesTitle = (series as any).title;
    if (seriesTitle && seriesTitle.trim()) {
      return seriesTitle.trim();
    }

    // Otherwise, fall back to "Series Type + Number" format
    const typeDisplayName = series.type.charAt(0).toUpperCase() + series.type.slice(1);
    const seriesNumber = index + 1;
    return `${typeDisplayName} Series ${seriesNumber}`;
  }, []);

  // Debounced config update to avoid excessive API calls
  const debouncedConfigUpdate = useMemo(
    () => debounce((seriesId: string, config: Partial<SeriesConfig>) => {
      startTransition(() => {
        void updateSeriesSettings(paneId, seriesId, config);
        onConfigChange(seriesId, config);
      });
    }, 100),
    [paneId, updateSeriesSettings, onConfigChange]
  );

  // Focus restoration function to return focus to chart after dialog closes
  const restoreFocusToChart = useCallback(() => {
    // Small delay to allow dialog to close before attempting focus
    setTimeout(() => {
      try {
        // CRITICAL FIX 1: Remove any lingering overlay elements that might block interactions
        const overlaySelectors = [
          '.series-config-overlay',
          '[class*="overlay"]',
          '[style*="position: fixed"]',
          '[style*="z-index: 10000"]'
        ];

        overlaySelectors.forEach(selector => {
          const overlays = document.querySelectorAll(selector);
          overlays.forEach(overlay => {
            const element = overlay as HTMLElement;
            // Only remove if it looks like a dialog overlay (has high z-index and covers full screen)
            const style = window.getComputedStyle(element);
            if (
              (style.position === 'fixed' && style.zIndex === '10000') ||
              element.classList.contains('series-config-overlay')
            ) {
              element.remove();
            }
          });
        });

        // CRITICAL FIX 2: Reset body-level changes
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
        document.body.classList.remove('modal-open', 'series-dialog-open');

        // Try to find the chart container by various selectors
        let chartElement: HTMLElement | null = null;
        let canvasElement: HTMLCanvasElement | null = null;

        // 1. Try to find chart container by ID pattern
        const containers = document.querySelectorAll('[id^="chart-container-"]');
        if (containers.length > 0) {
          chartElement = containers[0] as HTMLElement;
        }

        // 2. Fallback: try to find by class
        if (!chartElement) {
          chartElement = document.querySelector('.chart-container') as HTMLElement;
        }

        // 3. Fallback: try to find canvas element (LightweightCharts renders to canvas)
        if (!chartElement) {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            canvasElement = canvas as HTMLCanvasElement;
            chartElement = canvas.parentElement || canvas;
          }
        } else {
          // Get canvas from chart element
          const canvas = chartElement.querySelector('canvas');
          if (canvas) canvasElement = canvas as HTMLCanvasElement;
        }

        // 4. Focus the chart element if found and re-enable interactions
        if (chartElement) {
          // CRITICAL FIX 3: Clear pointer-events blocks on chart and all ancestors
          const elementsToUnblock = [chartElement];
          let current = chartElement.parentElement;
          while (current && current !== document.body) {
            elementsToUnblock.push(current);
            current = current.parentElement;
          }

          elementsToUnblock.forEach(element => {
            element.style.pointerEvents = '';
            element.style.zIndex = '';
            element.style.opacity = '';
          });

          // Make element focusable if it's not already
          if (!chartElement.hasAttribute('tabindex')) {
            chartElement.setAttribute('tabindex', '-1');
          }

          // Focus the chart element
          chartElement.focus();

          // CRITICAL FIX 4: Enhanced canvas interaction restoration
          if (canvasElement) {
            canvasElement.style.pointerEvents = '';
            canvasElement.focus();

            // Trigger comprehensive mouse events to fully reactivate chart
            setTimeout(() => {
              if (!canvasElement) return;
              const rect = canvasElement.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;

              const eventSequence = [
                'mouseenter', 'mouseover', 'pointermove', 'mousemove',
                'mousedown', 'mouseup', 'click'
              ];

              eventSequence.forEach((eventType, index) => {
                setTimeout(() => {
                  const event = new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: centerX,
                    clientY: centerY,
                    buttons: eventType === 'mousedown' || eventType === 'mouseup' ? 1 : 0
                  });
                  canvasElement?.dispatchEvent(event);
                }, index * 15); // Stagger events
              });
            }, 100);
          }

          // CRITICAL FIX 5: Remove any pointer-events: none styles globally
          const blockedElements = document.querySelectorAll('[style*="pointer-events: none"]');
          blockedElements.forEach(element => {
            const htmlElement = element as HTMLElement;
            if (htmlElement.style.pointerEvents === 'none') {
              htmlElement.style.pointerEvents = '';
            }
          });

          if (process.env.NODE_ENV === 'development') {
            logger.debug('Chart interactions restored successfully', 'SeriesSettings', {
              chartElement,
              canvasElement,
              unblockedElements: elementsToUnblock.length
            });
          }
        } else {
          logger.warn('Chart or canvas element not found during interaction restore', 'SeriesSettings');
        }

        // CRITICAL FIX 6: Force interaction reset with custom event
        setTimeout(() => {
          const restoreEvent = new CustomEvent('chart-interactions-restore', {
            bubbles: true,
            detail: { paneId, timestamp: Date.now() }
          });
          document.dispatchEvent(restoreEvent);
        }, 200);

      } catch (error) {
        logger.error('Failed to restore chart interactions after dialog close', 'SeriesSettings', error);
      }
    }, 150); // Increased delay to ensure complete dialog cleanup
  }, [paneId]);

  // Cleanup effect to prevent lingering modal states and overlays
  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      try {

        // Remove any lingering overlay elements
        const overlays = document.querySelectorAll('.series-config-overlay');
        overlays.forEach(overlay => overlay.remove());

        // Reset body-level changes
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
        document.body.classList.remove('modal-open', 'series-dialog-open');

        // Dispatch cleanup event
        const cleanupEvent = new CustomEvent('modal-cleanup', {
          bubbles: true,
          detail: { component: 'SeriesSettingsDialog', paneId }
        });
        document.dispatchEvent(cleanupEvent);

      } catch (error) {
        logger.error('Failed to dispatch cleanup event on component unmount', 'SeriesSettings', error);
      }
    };
  }, [paneId]);

  // Handle configuration changes
  const handleConfigChange = useCallback((seriesId: string, configPatch: Partial<SeriesConfig>) => {

    // Immediately update optimistic state for instant UI feedback
    setOptimisticConfigs(prev => ({
      ...prev,
      [seriesId]: { ...prev[seriesId], ...configPatch }
    }));

    // CRITICAL FIX: Update BOTH frontend and backend for immediate + persistent changes

    // 1. IMMEDIATE FRONTEND UPDATE: Apply to chart series object for instant visual changes
    if (onConfigChange) {
      onConfigChange(seriesId, configPatch);
    }

    // 2. PERSISTENT BACKEND UPDATE: Send to Streamlit for persistence across reruns
    try {
      // Try multiple ways to access Streamlit object (same approach as other parts of codebase)
      let streamlit = null;

      // Method 1: Check global window object
      if (typeof window !== 'undefined' && (window as any).Streamlit) {
        streamlit = (window as any).Streamlit;
      }

      // Method 2: Check globalThis
      if (!streamlit && typeof globalThis !== 'undefined' && (globalThis as any).Streamlit) {
        streamlit = (globalThis as any).Streamlit;
      }

      // Method 3: Check if Streamlit is directly accessible (as in index.tsx)
      if (!streamlit) {
        streamlit = Streamlit;
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug('Streamlit connection debug info', 'SeriesSettings', {
          windowStreamlit: !!(typeof window !== 'undefined' && (window as any).Streamlit),
          globalStreamlit: !!(typeof globalThis !== 'undefined' && (globalThis as any).Streamlit),
          directStreamlit: !!Streamlit,
          foundStreamlit: !!streamlit,
          hasSetComponentValue: !!(streamlit && streamlit.setComponentValue)
        });
      }

      if (streamlit && streamlit.setComponentValue) {
        const updatePayload = {
          type: 'config_change',
          paneId: paneId,
          seriesId: seriesId,
          configPatch: configPatch,
          timestamp: Date.now()
        };


        // Send to Streamlit backend for persistence (triggers rerun)
        streamlit.setComponentValue(updatePayload);

      } else {
        logger.warn('Streamlit not accessible for component value update', 'SeriesSettings', {
          window: typeof window,
          globalThis: typeof globalThis,
          Streamlit: typeof Streamlit
        });
      }
    } catch (error) {
      logger.error('Failed to send component value to Streamlit', 'SeriesSettings', error);
    }

    // Optional: Still try the API update for persistence (but Streamlit component value is primary)
    try {
      debouncedConfigUpdate(seriesId, configPatch);
    } catch (error) {
      logger.error('Failed to update series config via API', 'SeriesSettings', error);
    }
  }, [debouncedConfigUpdate, setOptimisticConfigs, onConfigChange, paneId]);

  // Get current series info and config
  const activeSeriesInfo = seriesList.find(s => s.id === activeSeriesId);
  const activeSeriesConfig = useMemo(() =>
    optimisticConfigs[activeSeriesId] || {},
    [optimisticConfigs, activeSeriesId]
  );

  // Debug logging for series type detection
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Series selection debug info', 'SeriesSettings', {
      activeSeriesId,
      activeSeriesInfo,
      type: activeSeriesInfo?.type,
      allSeries: seriesList.map(s => ({ id: s.id, type: s.type, displayName: s.displayName }))
    });
  }

  // Enhanced close handler that includes focus restoration
  const handleCloseWithFocusRestore = useCallback(() => {
    onClose();
    restoreFocusToChart();
  }, [onClose, restoreFocusToChart]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (lineEditorOpen.isOpen) {
        setLineEditorOpen({ isOpen: false });
      } else if (colorPickerOpen.isOpen) {
        setColorPickerOpen({ isOpen: false });
      } else {
        handleCloseWithFocusRestore();
      }
    }
  }, [lineEditorOpen.isOpen, colorPickerOpen.isOpen, handleCloseWithFocusRestore]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !lineEditorOpen.isOpen && !colorPickerOpen.isOpen) {
      handleCloseWithFocusRestore();
    }
  }, [lineEditorOpen.isOpen, colorPickerOpen.isOpen, handleCloseWithFocusRestore]);

  // Line editor handlers
  const openLineEditor = useCallback((lineType: 'upper_line' | 'lower_line' | 'main_line') => {
    let lineConfig: any = {};

    if (lineType === 'main_line') {
      lineConfig = {
        color: activeSeriesConfig.color,
        line_style: activeSeriesConfig.line_style,
        line_width: activeSeriesConfig.line_width,
      };
    } else {
      lineConfig = (activeSeriesConfig as any)[lineType] || {};
    }

    setLineEditorOpen({
      isOpen: true,
      lineType,
      config: {
        color: lineConfig.color || '#2196F3',
        style: lineConfig.line_style || 'solid',
        width: lineConfig.line_width || 1,
      }
    });
  }, [activeSeriesConfig]);

  const handleLineEditorSave = useCallback((config: LineConfig) => {
    if (lineEditorOpen.lineType) {
      if (lineEditorOpen.lineType === 'main_line') {
        // For main line, update direct properties
        handleConfigChange(activeSeriesId, {
          color: config.color,
          line_style: config.style,
          line_width: config.width,
        });
      } else {
        // For upper/lower lines, update nested properties
        handleConfigChange(activeSeriesId, {
          [lineEditorOpen.lineType]: {
            color: config.color,
            line_style: config.style,
            line_width: config.width,
          }
        });
      }
    }
    setLineEditorOpen({ isOpen: false });
  }, [activeSeriesId, lineEditorOpen.lineType, handleConfigChange]);

  // Color picker handlers
  const openColorPicker = useCallback((colorType: 'fill_color' | 'line_color') => {
    const currentColor = colorType === 'fill_color'
      ? activeSeriesConfig.fill_color || '#2196F3'
      : activeSeriesConfig.color || '#2196F3';
    const currentOpacity = colorType === 'fill_color'
      ? activeSeriesConfig.fill_opacity || 20
      : 100;

    setColorPickerOpen({
      isOpen: true,
      colorType,
      currentColor,
      currentOpacity,
    });
  }, [activeSeriesConfig]);

  const handleColorPickerSave = useCallback((color: string, opacity: number) => {
    if (colorPickerOpen.colorType === 'fill_color') {
      handleConfigChange(activeSeriesId, {
        fill_color: color,
        fill_opacity: opacity,
      });
    } else if (colorPickerOpen.colorType === 'line_color') {
      handleConfigChange(activeSeriesId, {
        color: color,
      });
    }
    setColorPickerOpen({ isOpen: false });
  }, [activeSeriesId, colorPickerOpen.colorType, handleConfigChange]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="series-config-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`series-settings-${activeSeriesInfo?.displayName || ''}`}
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
        className="series-config-dialog"
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
        {/* Header */}
        <div
          className="series-config-header"
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
            id={`series-settings-${activeSeriesInfo?.displayName || ''}`}
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
            }}
          >
Settings
          </div>
          <button
            className="close-button"
            onClick={handleCloseWithFocusRestore}
            aria-label="Close dialog"
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
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Series Tabs */}
        <div
          className="series-config-tabs"
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
              role="tab"
              style={{
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeSeriesId === series.id ? '#131722' : '#787b86',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                borderBottom: activeSeriesId === series.id ? '2px solid #2962ff' : '2px solid transparent',
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
          className="series-config-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            minHeight: 0, // Important for flex scrolling
          }}
        >
          <form
            style={{
              fontSize: '13px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <input type="hidden" name="seriesId" value={activeSeriesId} />

            {/* Common Settings */}
            <div className="settings-section">
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="visible"
                  name="visible"
                  checked={activeSeriesConfig.visible !== false}
                  onChange={(e) => handleConfigChange(activeSeriesId, { visible: e.target.checked })}
                  aria-label="Series visible"
                />
                <label htmlFor="visible">Visible</label>
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="markers"
                  name="markers"
                  checked={activeSeriesConfig.markers === true}
                  onChange={(e) => handleConfigChange(activeSeriesId, { markers: e.target.checked })}
                  aria-label="Show markers"
                />
                <label htmlFor="markers">Markers</label>
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="last_value_visible"
                  name="last_value_visible"
                  checked={activeSeriesConfig.last_value_visible !== false}
                  onChange={(e) => handleConfigChange(activeSeriesId, { last_value_visible: e.target.checked })}
                  aria-label="Show last value"
                />
                <label htmlFor="last_value_visible">Last Value Visible</label>
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="price_line"
                  name="price_line"
                  checked={activeSeriesConfig.price_line !== false}
                  onChange={(e) => handleConfigChange(activeSeriesId, { price_line: e.target.checked })}
                  aria-label="Show price line"
                />
                <label htmlFor="price_line">Price Line</label>
              </div>
            </div>

            {/* Series-Specific Settings */}
            {activeSeriesInfo?.type === 'ribbon' && (
              <div className="settings-section">
                <h4>Ribbon Settings</h4>

                {/* Upper Line */}
                <div
                  className="line-row"
                  onClick={() => openLineEditor('upper_line')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openLineEditor('upper_line');
                    }
                  }}
                  aria-label="Edit upper line settings"
                >
                  <span>Upper Line</span>
                  <div className="line-preview">
                    <div
                      className="line-color-swatch"
                      style={{
                        backgroundColor: activeSeriesConfig.upper_line?.color || '#4CAF50',
                        width: '20px',
                        height: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '2px'
                      }}
                    />
                    <span className="line-style-indicator">
                      {activeSeriesConfig.upper_line?.line_style || 'solid'} • {activeSeriesConfig.upper_line?.line_width || 2}px
                    </span>
                  </div>
                </div>

                {/* Lower Line */}
                <div
                  className="line-row"
                  onClick={() => openLineEditor('lower_line')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openLineEditor('lower_line');
                    }
                  }}
                  aria-label="Edit lower line settings"
                >
                  <span>Lower Line</span>
                  <div className="line-preview">
                    <div
                      className="line-color-swatch"
                      style={{
                        backgroundColor: activeSeriesConfig.lower_line?.color || '#F44336',
                        width: '20px',
                        height: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '2px'
                      }}
                    />
                    <span className="line-style-indicator">
                      {activeSeriesConfig.lower_line?.line_style || 'solid'} • {activeSeriesConfig.lower_line?.line_width || 2}px
                    </span>
                  </div>
                </div>

                {/* Fill Settings */}
                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="fill"
                    name="fill"
                    checked={activeSeriesConfig.fill !== false}
                    onChange={(e) => handleConfigChange(activeSeriesId, { fill: e.target.checked })}
                    aria-label="Show fill area"
                  />
                  <label htmlFor="fill">Fill</label>
                </div>

                {activeSeriesConfig.fill !== false && (
                  <div
                    className="color-row"
                    onClick={() => openColorPicker('fill_color')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openColorPicker('fill_color');
                      }
                    }}
                    aria-label="Edit fill color"
                  >
                    <span>Fill Color</span>
                    <div className="color-preview">
                      <div
                        className="color-swatch"
                        style={{
                          backgroundColor: toCss(
                            activeSeriesConfig.fill_color || '#2196F3',
                            activeSeriesConfig.fill_opacity || 20
                          ),
                          width: '32px',
                          height: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                      <span className="opacity-indicator">
                        {activeSeriesConfig.fill_opacity || 20}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Line Series Settings */}
            {activeSeriesInfo?.type === 'line' && (
              <div className="settings-section">
                <h4>Line Settings</h4>

                <div
                  className="line-row"
                  onClick={() => openLineEditor('main_line')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openLineEditor('main_line');
                    }
                  }}
                  aria-label="Edit line settings"
                >
                  <span>Line</span>
                  <div className="line-preview">
                    <div
                      className="line-color-swatch"
                      style={{
                        backgroundColor: activeSeriesConfig.color || '#2196F3',
                        width: '20px',
                        height: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '2px'
                      }}
                    />
                    <span className="line-style-indicator">
                      {activeSeriesConfig.line_style || 'solid'} • {activeSeriesConfig.line_width || 1}px
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button for form action (hidden) */}
            <button type="submit" style={{ display: 'none' }} disabled={isPending}>
              Apply Settings
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="series-config-footer" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 12px',
          borderTop: '1px solid #e0e3e7',
          backgroundColor: '#ffffff',
          minHeight: '28px'
        }}>
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
                // Reset to defaults
                const defaultConfig: SeriesConfig = {
                  visible: true,
                  markers: false,
                  last_value_visible: true,
                  price_line: true,
                };

                if (activeSeriesInfo?.type === 'ribbon') {
                  Object.assign(defaultConfig, {
                    upper_line: { color: '#4CAF50', line_style: 'solid', line_width: 2 },
                    lower_line: { color: '#F44336', line_style: 'solid', line_width: 2 },
                    fill: true,
                    fill_color: '#2196F3',
                    fill_opacity: 20,
                  });
                } else if (activeSeriesInfo?.type === 'line') {
                  Object.assign(defaultConfig, {
                    color: '#2196F3',
                    line_style: 'solid',
                    line_width: 1,
                  });
                }

                handleConfigChange(activeSeriesId, defaultConfig);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <span>Defaults</span>
              <svg
                style={{
                  marginLeft: '6px',
                  width: '12px',
                  height: '12px',
                  fill: '#787b86'
                }}
                viewBox="0 0 16 16"
              >
                <path d="M4.646 6.646a.5.5 0 0 1 .708 0L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/>
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
              }}
              onClick={handleCloseWithFocusRestore}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
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
              }}
              onClick={handleCloseWithFocusRestore}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e53e5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2962ff';
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
