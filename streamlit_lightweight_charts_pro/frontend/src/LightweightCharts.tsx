/**
 * @fileoverview LightweightCharts Main Component
 *
 * Primary React component for rendering TradingView Lightweight Charts in Streamlit.
 * Provides comprehensive chart management, series configuration, and interactive features.
 *
 * Architecture:
 * - React 19 concurrent features (useTransition, useDeferredValue)
 * - Unified series factory for all chart types
 * - Centralized service management (coordinates, primitives, layout)
 * - Error boundary integration for graceful degradation
 *
 * This component provides:
 * - Multi-pane chart rendering
 * - Multiple series types (line, candlestick, area, bar, histogram, baseline)
 * - Custom series (band, ribbon, signal, trend fill, gradient ribbon)
 * - Trade visualization with rectangles and markers
 * - Annotations (text, arrows, shapes)
 * - Legends with dynamic values
 * - Range switchers for time navigation
 * - Chart synchronization across multiple charts
 * - Series settings dialog with live preview
 * - Pane collapse/expand functionality
 *
 * Features:
 * - React 19 optimizations (transitions, deferred values)
 * - Automatic resize handling with ResizeObserver
 * - Performance monitoring (optional)
 * - Memory leak prevention with comprehensive cleanup
 * - Error handling with fallback UI
 * - Backend state synchronization
 *
 * @example
 * ```tsx
 * import LightweightCharts from './LightweightCharts';
 *
 * <LightweightCharts
 *   config={{
 *     charts: [{
 *       id: 'chart-1',
 *       chart: { height: 400 },
 *       series: [{
 *         type: 'line',
 *         data: [{ time: '2024-01-01', value: 100 }]
 *       }]
 *     }]
 *   }}
 *   height={400}
 *   width={800}
 *   onChartsReady={() => console.log('Charts ready')}
 * />
 * ```
 */

import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useTransition,
  useDeferredValue,
} from 'react';
import { logger } from './utils/logger';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  createSeriesMarkers,
  UTCTimestamp,
} from 'lightweight-charts';
import {
  ComponentConfig,
  ChartConfig,
  SeriesConfig,
  TradeConfig,
  TradeVisualizationOptions,
  Annotation,
  AnnotationLayer,
  LegendConfig,
  SyncConfig,
  PaneHeightOptions,
} from './types';
import { ExtendedSeriesApi, ExtendedChartApi, SeriesDataPoint } from './types/ChartInterfaces';
import { createAnnotationVisualElements } from './services/annotationSystem';
import { SignalSeries } from './plugins/series/signalSeriesPlugin';
import { TradeRectanglePrimitive } from './primitives/TradeRectanglePrimitive';
import { createTradeVisualElements } from './services/tradeVisualization';
import { ChartReadyDetector } from './utils/chartReadyDetection';
import { ChartCoordinateService } from './services/ChartCoordinateService';
import { ChartPrimitiveManager } from './services/ChartPrimitiveManager';
import { CornerLayoutManager } from './services/CornerLayoutManager';
import { TooltipPlugin } from './plugins/chart/tooltipPlugin';

import { cleanLineStyleOptions } from './utils/lineStyle';
import { createSeriesWithConfig } from './series/UnifiedSeriesFactory';
import { getCachedDOMElement, createOptimizedStylesAdvanced } from './utils/performance';
import { ErrorBoundary } from './components/ErrorBoundary';
import { react19Monitor } from './utils/react19PerformanceMonitor';
import { dialogConfigToApiOptions } from './series/UnifiedPropertyMapper';

/**
 * Finds the nearest available time in chart data to a target timestamp.
 *
 * Used for synchronizing annotations and trades with actual data points,
 * ensuring visual elements align with existing chart data.
 *
 * @param targetTime - Target timestamp in seconds
 * @param chartData - Array of chart data points with time property
 * @returns Nearest timestamp in seconds, or null if no valid data
 *
 * @example
 * ```typescript
 * const nearestTime = findNearestTime(1704067200, chartData);
 * if (nearestTime) {
 *   marker.time = nearestTime;
 * }
 * ```
 */
const findNearestTime = (targetTime: number, chartData: any[]): number | null => {
  if (!chartData || chartData.length === 0) {
    return null;
  }

  let nearestTime: number | null = null;
  let minDiff = Infinity;

  for (const item of chartData) {
    if (!item.time) continue;

    let itemTime: number | null = null;

    if (typeof item.time === 'number') {
      itemTime = item.time > 1000000000000 ? Math.floor(item.time / 1000) : item.time;
    } else if (typeof item.time === 'string') {
      const parsed = new Date(item.time).getTime();
      if (!isNaN(parsed)) {
        itemTime = Math.floor(parsed / 1000);
      }
    }

    if (itemTime === null) continue;

    const diff = Math.abs(itemTime - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      nearestTime = itemTime;
    }
  }

  return nearestTime;
};

// Global type declarations for window extensions
// Global Window interface declarations moved to types/ChartInterfaces.ts to avoid conflicts

/**
 * Retries an async operation with exponential backoff.
 *
 * Implements exponential backoff with jitter to avoid thundering herd problems.
 * Used for primitive attachment and other operations that may fail transiently.
 *
 * @param operation - Async operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @param baseDelay - Base delay in milliseconds (default: 100ms)
 * @returns Result of successful operation
 * @throws Last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => attachPrimitive(chart, primitive),
 *   5,
 *   100
 * );
 * ```
 */
const retryWithBackoff = async (
  operation: () => Promise<any>,
  maxRetries: number = 5,
  baseDelay: number = 100
): Promise<any> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) {
        throw lastError || new Error('Unknown error occurred');
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Unknown error occurred');
};

/**
 * Props for LightweightCharts component.
 *
 * Defines the configuration interface for rendering charts with full control
 * over appearance, data, and interactive features.
 */
interface LightweightChartsProps {
  /** Complete configuration for all charts, series, and features */
  config: ComponentConfig;

  /** Chart height in pixels (null for auto-sizing) */
  height?: number | null;

  /** Chart width in pixels (null for auto-sizing) */
  width?: number | null;

  /** Callback fired when all charts are initialized and ready */
  onChartsReady?: () => void;

  /** Enable React 19 performance monitoring (logs transition times, etc.) */
  enableReact19Monitoring?: boolean;

  /**
   * Series configuration change from SeriesSettingsDialog.
   * Triggers live updates when user modifies series settings.
   */
  configChange?: {
    /** Pane identifier (e.g., 'pane-0') */
    paneId: string;
    /** Series identifier (e.g., 'pane-0-series-0') */
    seriesId: string;
    /** Partial configuration to apply */
    configPatch: any;
    /** Timestamp to prevent duplicate processing */
    timestamp: number;
  } | null;
}

/**
 * LightweightCharts React Component
 *
 * Main chart rendering component with React 19 optimizations.
 * Manages chart lifecycle, series configuration, and user interactions.
 *
 * Performance Features:
 * - React.memo for preventing unnecessary re-renders
 * - useTransition for non-blocking UI updates
 * - useDeferredValue for smooth config updates
 * - Optimized resize handling with debouncing
 * - Lazy primitive attachment for performance
 *
 * Memory Management:
 * - Comprehensive cleanup on unmount
 * - ResizeObserver disconnect
 * - Chart instance removal
 * - Service cleanup (coordinates, primitives, layout)
 *
 * @param props - Component configuration and callbacks
 * @returns Rendered chart components with error boundaries
 */
const LightweightCharts: React.FC<LightweightChartsProps> = React.memo(
  ({
    config,
    height = 400,
    width = null,
    onChartsReady,
    configChange,
    enableReact19Monitoring = false,
  }) => {
    // React 19 concurrent features with optional performance monitoring
    // useTransition: Marks state updates as transitions for non-blocking UI
    // useDeferredValue: Defers non-urgent config updates to maintain responsiveness
    const [isPending, startTransition] = useTransition();
    const deferredConfig = useDeferredValue(config);

    // React 19 Performance Monitoring
    const transitionIdRef = useRef<string | null>(null);

    useEffect(() => {
      if (enableReact19Monitoring && !transitionIdRef.current) {
        transitionIdRef.current = react19Monitor.startTransition('LightweightCharts', 'chart');
      }
      return () => {
        if (enableReact19Monitoring && transitionIdRef.current) {
          react19Monitor.endTransition(transitionIdRef.current);
          transitionIdRef.current = null;
        }
      };
    }, [enableReact19Monitoring]);

    // Component initialization
    const chartRefs = useRef<{ [key: string]: IChartApi }>({});
    const seriesRefs = useRef<{ [key: string]: ISeriesApi<any>[] }>({});
    const signalPluginRefs = useRef<{ [key: string]: SignalSeries }>({});
    const chartConfigs = useRef<{ [key: string]: ChartConfig }>({});
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const legendResizeObserverRefs = useRef<{ [key: string]: ResizeObserver }>({});
    const isInitializedRef = useRef<boolean>(false);
    const isDisposingRef = useRef<boolean>(false);
    const fitContentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevConfigRef = useRef<ComponentConfig | null>(null);
    const chartContainersRef = useRef<{ [key: string]: HTMLElement }>({});
    const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

    // Store function references to avoid dependency issues
    const functionRefs = useRef<{
      addTradeVisualization: any;
      addAnnotations: any;
      addModularTooltip: any;
      addAnnotationLayers: any;
      addRangeSwitcher: any;
      addLegend: any;
      updateLegendPositions: any;
      setupAutoSizing: any;
      setupChartSynchronization: any;
      setupFitContent: any;
      setupPaneCollapseSupport: any;
      cleanupCharts: any;
    }>({
      addTradeVisualization: null,
      addAnnotations: null,
      addModularTooltip: null,
      addAnnotationLayers: null,
      addRangeSwitcher: null,
      addLegend: null,
      updateLegendPositions: null,
      setupAutoSizing: null,
      setupChartSynchronization: null,
      setupFitContent: null,
      setupPaneCollapseSupport: null,
      cleanupCharts: null,
    });

    // Performance optimization: Memoize container dimensions calculation
    const getContainerDimensions = useCallback((container: HTMLElement) => {
      const rect = container.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
      };
    }, []);

    // Performance optimization: Debounced resize handler
    const debouncedResizeHandler = useCallback(
      (chartId: string, chart: IChartApi, container: HTMLElement, chartConfig: ChartConfig) => {
        // Clear existing timer
        if (debounceTimersRef.current[chartId]) {
          clearTimeout(debounceTimersRef.current[chartId]);
        }

        // Set new timer
        debounceTimersRef.current[chartId] = setTimeout(() => {
          try {
            const dimensions = getContainerDimensions(container);
            const newWidth = chartConfig.autoWidth
              ? dimensions.width
              : chartConfig.chart?.width || width;
            // Prioritize height from chart options (JSON config) over autoHeight
            const newHeight =
              chartConfig.chart?.height ||
              (chartConfig.autoHeight ? dimensions.height : height) ||
              dimensions.height;

            if (newHeight != null && newWidth != null) {
              chart.resize(newWidth, newHeight);
            }
          } catch (error) {
            logger.warn('Chart auto-resize failed', 'LightweightCharts', error);
          }
        }, 100); // 100ms debounce
      },
      [width, height, getContainerDimensions]
    );

    // Function to setup auto-sizing for a chart
    const setupAutoSizing = useCallback(
      (chart: IChartApi, container: HTMLElement, chartConfig: ChartConfig) => {
        // Auto-sizing implementation
        if (chartConfig.autoSize || chartConfig.autoWidth || chartConfig.autoHeight) {
          const chartId = chart.chartElement().id || 'default';

          const resizeObserver =
            typeof ResizeObserver !== 'undefined'
              ? new ResizeObserver(() => {
                  debouncedResizeHandler(chartId, chart, container, chartConfig);
                })
              : null;

          if (resizeObserver && typeof resizeObserver.observe === 'function') {
            resizeObserver.observe(container);
          }
          resizeObserverRef.current = resizeObserver;
        }
      },
      [debouncedResizeHandler]
    );

    const setupChartSynchronization = useCallback(
      (chart: IChartApi, chartId: string, syncConfig: SyncConfig, chartGroupId: number = 0) => {
        // Store chart reference for synchronization
        if (!chartRefs.current[chartId]) {
          chartRefs.current[chartId] = chart;
        }

        // Helper function to get crosshair data point from series data
        const getCrosshairDataPoint = (series: ISeriesApi<any>, param: any) => {
          if (!param.time) {
            return null;
          }
          const dataPoint = param.seriesData.get(series);
          return dataPoint || null;
        };

        // Helper function to sync crosshair between charts (TradingView's official approach)
        const syncCrosshair = (
          targetChart: IChartApi,
          targetSeries: ISeriesApi<any>,
          dataPoint: any
        ) => {
          if (dataPoint) {
            targetChart.setCrosshairPosition(dataPoint.value, dataPoint.time, targetSeries);
            return;
          }
          targetChart.clearCrosshairPosition();
        };

        // Setup crosshair synchronization (TradingView's official approach)
        if (syncConfig.crosshair) {
          // Add localStorage event listener for cross-component sync (only once per chart)
          if (!(chart as ExtendedChartApi)._storageListenerAdded) {
            let lastSyncTimestamp = 0;
            const SYNC_DEBOUNCE_MS = 50; // Prevent rapid-fire sync events

            const handleStorageChange = (e: StorageEvent) => {
              if (e.key === 'chart_sync_data' && e.newValue) {
                try {
                  const syncData = JSON.parse(e.newValue);
                  if (
                    syncData.chartId !== chartId &&
                    syncData.groupId === chartGroupId &&
                    syncData.type === 'crosshair'
                  ) {
                    // Debounce to prevent feedback loops
                    const now = Date.now();
                    if (now - lastSyncTimestamp < SYNC_DEBOUNCE_MS) {
                      return;
                    }
                    lastSyncTimestamp = now;

                    // Apply crosshair sync from other component
                    if (syncData.time && syncData.value) {
                      const targetSeries = seriesRefs.current[chartId]?.[0];
                      if (targetSeries) {
                        // Set flag to prevent this update from triggering localStorage storage
                        (chart as ExtendedChartApi)._isExternalSync = true;
                        chart.setCrosshairPosition(syncData.value, syncData.time, targetSeries);
                        // Clear flag after a short delay
                        setTimeout(() => {
                          (chart as ExtendedChartApi)._isExternalSync = false;
                        }, 100);
                      }
                    }
                  }
                } catch (error) {
                  logger.error(
                    'Error handling storage change for crosshair sync',
                    'ChartSync',
                    error
                  );
                }
              }
            };

            window.addEventListener('storage', handleStorageChange);
            (chart as ExtendedChartApi)._storageListenerAdded = true;
          }

          chart.subscribeCrosshairMove(param => {
            // Skip if this is an external sync to prevent feedback loops
            if ((chart as ExtendedChartApi)._isExternalSync) {
              return;
            }

            // Get all series from the current chart using stored references
            const currentSeries = seriesRefs.current[chartId] || [];

            // Method 1: Same-component synchronization (direct object references)
            Object.entries(window.chartApiMap || {}).forEach(([id, otherChart]) => {
              if (id !== chartId && otherChart) {
                try {
                  // Get the other chart's group ID from global registry
                  const otherChartGroupId = window.chartGroupMap?.[id] || 0;

                  // Only sync charts in the same group
                  if (otherChartGroupId === chartGroupId && param.time) {
                    const otherSeries = window.seriesRefsMap?.[id] || [];

                    // Sync using TradingView's approach - sync first series to first series
                    if (currentSeries.length > 0 && otherSeries.length > 0) {
                      const dataPoint = getCrosshairDataPoint(currentSeries[0], param);
                      syncCrosshair(otherChart as IChartApi, otherSeries[0], dataPoint);
                    }
                  }
                } catch (error) {
                  logger.warn('Error syncing crosshair to other chart', 'ChartSync', error);
                }
              }
            });

            // Method 2: Cross-component synchronization using localStorage
            if (param.time && currentSeries.length > 0) {
              const dataPoint = getCrosshairDataPoint(currentSeries[0], param);
              const syncData = {
                time: param.time,
                value: dataPoint ? dataPoint.value : null,
                chartId: chartId,
                groupId: chartGroupId,
                timestamp: Date.now(),
                type: 'crosshair',
              };

              // Store in localStorage for cross-component communication
              try {
                localStorage.setItem('chart_sync_data', JSON.stringify(syncData));
              } catch (error) {
                logger.warn(
                  'Failed to store crosshair sync data in localStorage',
                  'ChartSync',
                  error
                );
              }
            }
          });
        }

        // Setup time range synchronization (TradingView's official approach)
        if (syncConfig.timeRange) {
          const timeScale = chart.timeScale();
          if (timeScale) {
            // Add localStorage event listener for cross-component time range sync
            // (only once per chart)
            if (!(chart as ExtendedChartApi)._timeRangeStorageListenerAdded) {
              let lastTimeRangeSyncTimestamp = 0;
              const TIME_RANGE_SYNC_DEBOUNCE_MS = 100; // Prevent rapid-fire time range sync events

              const handleTimeRangeStorageChange = (e: StorageEvent) => {
                if (e.key === 'chart_time_range_sync' && e.newValue) {
                  try {
                    const syncData = JSON.parse(e.newValue);
                    if (
                      syncData.chartId !== chartId &&
                      syncData.groupId === chartGroupId &&
                      syncData.type === 'timeRange'
                    ) {
                      // Debounce to prevent feedback loops
                      const now = Date.now();
                      if (now - lastTimeRangeSyncTimestamp < TIME_RANGE_SYNC_DEBOUNCE_MS) {
                        return;
                      }
                      lastTimeRangeSyncTimestamp = now;

                      // Apply time range sync from other component
                      if (syncData.timeRange) {
                        const currentTimeScale = chart.timeScale();
                        if (currentTimeScale) {
                          // Set flag to prevent this update from triggering localStorage storage
                          (chart as ExtendedChartApi)._isExternalTimeRangeSync = true;
                          currentTimeScale.setVisibleLogicalRange(syncData.timeRange);
                          // Clear flag after a short delay
                          setTimeout(() => {
                            (chart as ExtendedChartApi)._isExternalTimeRangeSync = false;
                          }, 150);
                        }
                      }
                    }
                  } catch (error) {
                    logger.error(
                      'Error handling storage change for time range sync',
                      'ChartSync',
                      error
                    );
                  }
                }
              };

              window.addEventListener('storage', handleTimeRangeStorageChange);
              (chart as ExtendedChartApi)._timeRangeStorageListenerAdded = true;
            }

            // Throttle timeScale range changes to prevent X-axis lag during pan/zoom
            let lastTimeRangeSync = 0;
            const timeRangeSyncThrottle = 16; // ~60fps max for smooth performance
            timeScale.subscribeVisibleLogicalRangeChange(timeRange => {
              // Throttle to prevent performance issues during X-axis interactions
              const now = Date.now();
              if (now - lastTimeRangeSync < timeRangeSyncThrottle) {
                return;
              }
              lastTimeRangeSync = now;

              // Skip if this is an external sync to prevent feedback loops
              if ((chart as ExtendedChartApi)._isExternalTimeRangeSync) {
                return;
              }

              // Method 1: Same-component synchronization (direct object references)
              Object.entries(window.chartApiMap || {}).forEach(([id, otherChart]) => {
                if (id !== chartId && otherChart) {
                  try {
                    // Get the other chart's group ID from global registry
                    const otherChartGroupId = window.chartGroupMap?.[id] || 0;

                    // Only sync charts in the same group
                    if (otherChartGroupId === chartGroupId) {
                      const otherTimeScale = otherChart.timeScale();
                      if (otherTimeScale && timeRange) {
                        otherTimeScale.setVisibleLogicalRange(timeRange);
                      }
                    }
                  } catch (error) {
                    logger.warn('Error syncing time range to other chart', 'ChartSync', error);
                  }
                }
              });

              // Method 2: Cross-component synchronization using localStorage
              if (timeRange) {
                const syncData = {
                  timeRange: timeRange,
                  chartId: chartId,
                  groupId: chartGroupId,
                  timestamp: Date.now(),
                  type: 'timeRange',
                };

                // Store in localStorage for cross-component communication
                try {
                  localStorage.setItem('chart_time_range_sync', JSON.stringify(syncData));
                } catch (error) {
                  logger.warn(
                    'Failed to store time range sync data in localStorage',
                    'ChartSync',
                    error
                  );
                }
              }
            });
          }
        }
      },
      []
    );

    /**
     * Wrap each pane in its own individual container for proper collapse functionality
     */
    const setupPaneCollapseSupport = useCallback((chart: IChartApi, chartId: string) => {
      try {
        // Initialize pane wrapper registry for collapse plugin to use
        window.paneWrappers = window.paneWrappers || {};
        window.paneWrappers[chartId] = {};

        // Store chart reference for pane collapse to work with stretch factors
        window.chartInstances = window.chartInstances || {};
        window.chartInstances[chartId] = chart;
      } catch (error) {
        logger.error('Failed to store chart instance', 'LightweightCharts', error);
      }

      // Crosshair subscription for legend value updates is now handled
      // in the main chart creation flow to ensure it works for all charts
    }, []);

    const setupFitContent = useCallback((chart: IChartApi, chartConfig: ChartConfig) => {
      // Safety check for chart.timeScale() method
      if (!chart || typeof chart.timeScale !== 'function') {
        return;
      }

      const timeScale = chart.timeScale();
      if (!timeScale) return;

      // Track last click time for double-click detection
      let lastClickTime = 0;
      const doubleClickThreshold = 300; // milliseconds

      // Check if fitContent on load is enabled
      const shouldFitContentOnLoad =
        chartConfig.chart?.timeScale?.fitContentOnLoad !== false &&
        chartConfig.chart?.fitContentOnLoad !== false;

      if (shouldFitContentOnLoad) {
        // Clear any existing timeout
        if (fitContentTimeoutRef.current) {
          clearTimeout(fitContentTimeoutRef.current);
        }

        // Wait for chart to be ready before calling fitContent
        ChartReadyDetector.waitForChartReady(chart, chart.chartElement(), {
          minWidth: 200,
          minHeight: 100,
          maxAttempts: 50,
          baseDelay: 100,
        })
          .then(isReady => {
            if (isReady) {
              try {
                const chartElement = chart.chartElement();
                const userInteracted = (
                  chartElement as HTMLElement & { _userHasInteracted?: boolean }
                )._userHasInteracted;

                if (chartElement && !userInteracted) {
                  timeScale.fitContent();
                }
              } catch (error) {
                logger.error('fitContent on load failed', 'FitContent', error);
              }
            }
          })
          .catch(error => {
            logger.error('Chart readiness check failed', 'FitContent', error);
          });
      }

      // Setup double-click to fit content
      const shouldHandleDoubleClick =
        chartConfig.chart?.timeScale?.handleDoubleClick !== false &&
        chartConfig.chart?.handleDoubleClick !== false;

      if (shouldHandleDoubleClick) {
        // Subscribe to chart click events
        chart.subscribeClick(() => {
          const currentTime = Date.now();

          // Check if this is a double-click
          if (currentTime - lastClickTime < doubleClickThreshold) {
            try {
              timeScale.fitContent();
            } catch (error) {
              logger.warn('fitContent on double-click failed', 'FitContent', error);
            }
            lastClickTime = 0; // Reset to prevent triple-click
          } else {
            lastClickTime = currentTime;
          }
        });
      }
    }, []);

    // Performance optimization: Enhanced cleanup function with better memory management
    const cleanupCharts = useCallback(() => {
      // Cleanup charts

      // Set disposing flag to prevent async operations
      // But don't set it if this is the initial render
      if (prevConfigRef.current !== null) {
        isDisposingRef.current = true;
      }

      // Clear all debounce timers
      Object.values(debounceTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      debounceTimersRef.current = {};

      // Clear any pending timeouts
      if (fitContentTimeoutRef.current) {
        clearTimeout(fitContentTimeoutRef.current);
        fitContentTimeoutRef.current = null;
      }

      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }

      // Disconnect resize observer
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch (error) {
          logger.warn('ResizeObserver already disconnected', 'Cleanup', error);
        }
        resizeObserverRef.current = null;
      }

      // Clean up signal series plugins
      // Note: SignalSeries instances don't need explicit cleanup as they are
      // managed by the chart's series lifecycle
      signalPluginRefs.current = {};

      // Clean up legend resize observers
      Object.values(legendResizeObserverRefs.current).forEach(resizeObserver => {
        try {
          resizeObserver.disconnect();
        } catch (error) {
          logger.warn('Legend ResizeObserver already disconnected', 'Cleanup', error);
        }
      });

      // Legend cleanup is now handled automatically by pane primitives

      // Clean up pane button panel widgets (new widget-based approach)
      if (window.paneButtonPanelWidgets) {
        Object.entries(window.paneButtonPanelWidgets).forEach(([, widgets]: [string, any]) => {
          if (Array.isArray(widgets)) {
            widgets.forEach((widget: any) => {
              try {
                if (widget && typeof widget.destroy === 'function') {
                  widget.destroy();
                }
              } catch (error) {
                logger.warn('Error destroying button panel widget', 'Cleanup', error);
              }
            });
          }
        });
        window.paneButtonPanelWidgets = {};
      }

      // Clean up chart plugins (including RangeSwitcher)
      if (window.chartPlugins) {
        window.chartPlugins.forEach(plugins => {
          try {
            if (Array.isArray(plugins)) {
              plugins.forEach((plugin: any) => {
                try {
                  if (plugin && typeof plugin.destroy === 'function') {
                    plugin.destroy();
                  }
                } catch (error) {
                  logger.warn('Plugin already destroyed', 'Cleanup', error);
                }
              });
            }
          } catch (error) {
            logger.warn('Plugins already cleaned up', 'Cleanup', error);
          }
        });
        window.chartPlugins.clear();
      }

      // Clean up widget managers
      if (window.chartApiMap) {
        Object.keys(window.chartApiMap).forEach(chartId => {
          try {
            ChartPrimitiveManager.cleanup(chartId);
          } catch (error) {
            logger.warn('Widget manager already cleaned up', 'Cleanup', error);
          }
        });
      }

      // Unregister charts from coordinate service
      const coordinateService = ChartCoordinateService.getInstance();
      Object.keys(chartRefs.current).forEach(chartId => {
        coordinateService.unregisterChart(chartId);
      });

      // Clean up CornerLayoutManager instances to remove phantom widgets
      Object.keys(chartRefs.current).forEach(chartId => {
        try {
          CornerLayoutManager.cleanup(chartId);
        } catch (error) {
          logger.warn('CornerLayoutManager already cleaned up', 'Cleanup', error);
        }
      });

      // Remove all charts with better error handling
      Object.values(chartRefs.current).forEach(chart => {
        try {
          // Check if chart is still valid before removing
          if (chart && typeof chart.remove === 'function') {
            chart.remove();
          }
        } catch (error) {
          logger.warn('Chart already removed or disposed', 'Cleanup', error);
        }
      });

      // Clear references
      chartRefs.current = {};
      seriesRefs.current = {};
      signalPluginRefs.current = {};
      chartConfigs.current = {};
      legendResizeObserverRefs.current = {};
      chartContainersRef.current = {};

      // Reset initialization flag
      isInitializedRef.current = false;
    }, []);

    const addTradeVisualization = useCallback(
      async (
        _chart: IChartApi,
        series: ISeriesApi<any>,
        trades: TradeConfig[],
        options: TradeVisualizationOptions,
        chartData?: any[]
      ) => {
        if (!trades || trades.length === 0) {
          return;
        }

        try {
          // Use the new unified trade visualization system
          const visualElements = createTradeVisualElements(trades, options, chartData);
          const primitives: any[] = [];

          // Convert rectangles to primitives
          if (visualElements.rectangles.length > 0) {
            const rectanglePrimitives = visualElements.rectangles
              .map(rectangleData => new TradeRectanglePrimitive(rectangleData))
              .filter(primitive => primitive !== null);

            primitives.push(...rectanglePrimitives);
          }

          // Attach primitives to the series (official TradingView approach)
          if (primitives.length > 0) {
            primitives.forEach(primitive => {
              try {
                series.attachPrimitive(primitive);
              } catch (error) {
                logger.error('Error attaching trade visualization primitive', 'TradeViz', error);
              }
            });
          }

          // Add entry/exit markers if style includes markers
          if (options.style === 'markers' || options.style === 'both') {
            const markers: any[] = [];

            trades.forEach(trade => {
              // Parse and adjust timestamps using findNearestTime (same logic as rectangles)
              const originalEntryTime =
                typeof trade.entryTime === 'string'
                  ? Math.floor(new Date(trade.entryTime).getTime() / 1000)
                  : trade.entryTime;
              const originalExitTime =
                typeof trade.exitTime === 'string'
                  ? Math.floor(new Date(trade.exitTime).getTime() / 1000)
                  : trade.exitTime;

              // Find nearest available times in chart data
              let adjustedEntryTime = originalEntryTime;
              let adjustedExitTime = originalExitTime;

              if (chartData && chartData.length > 0) {
                const nearestEntryTime = findNearestTime(originalEntryTime as number, chartData);
                const nearestExitTime = findNearestTime(originalExitTime as number, chartData);

                if (nearestEntryTime) adjustedEntryTime = nearestEntryTime;
                if (nearestExitTime) adjustedExitTime = nearestExitTime;
              }

              // Entry marker
              if (adjustedEntryTime && typeof trade.entryPrice === 'number') {
                const isLong = trade.tradeType === 'long';
                const markerText = options.showPnlInMarkers
                  ? `Entry: ${trade.entryPrice}`
                  : trade.notes || trade.text || '';

                markers.push({
                  time: adjustedEntryTime as UTCTimestamp,
                  position: isLong ? 'belowBar' : 'aboveBar',
                  color: isLong
                    ? options.entryMarkerColorLong || '#2196F3'
                    : options.entryMarkerColorShort || '#FF9800',
                  shape: isLong ? 'arrowUp' : 'arrowDown',
                  size: options.markerSize || 5,
                  text: markerText,
                });
              }

              // Exit marker
              if (adjustedExitTime && typeof trade.exitPrice === 'number') {
                const isLong = trade.tradeType === 'long';
                const isProfit = trade.isProfitable || (trade.pnl && trade.pnl >= 0);
                let markerText = '';

                if (options.showPnlInMarkers) {
                  markerText = `Exit: ${trade.exitPrice}`;
                  if (trade.pnl)
                    markerText += ` (${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)})`;
                  else if (trade.pnlPercentage)
                    markerText += ` (${trade.pnlPercentage > 0 ? '+' : ''}${trade.pnlPercentage.toFixed(1)}%)`;
                }

                markers.push({
                  time: adjustedExitTime as UTCTimestamp,
                  position: isLong ? 'aboveBar' : 'belowBar',
                  color: isProfit
                    ? options.exitMarkerColorProfit || '#4CAF50'
                    : options.exitMarkerColorLoss || '#F44336',
                  shape: isLong ? 'arrowDown' : 'arrowUp',
                  size: options.markerSize || 5,
                  text: markerText,
                });
              }
            });

            if (markers.length > 0) {
              try {
                // Use createSeriesMarkers instead of setMarkers for compatibility
                createSeriesMarkers(series, markers);
              } catch {
                logger.error('An error occurred', 'LightweightCharts');
              }
            }
          }

          // Handle other style options
          if (
            options.style === 'lines' ||
            options.style === 'arrows' ||
            options.style === 'zones'
          ) {
            // Style not yet implemented
          }
        } catch (error) {
          logger.error('Trade visualization error', 'LightweightCharts', error);
        }
      },
      []
    );

    // Trade visualization is now handled synchronously in createSeries function
    // No need for addTradeVisualizationWhenReady anymore

    const addAnnotations = useCallback(
      (_chart: IChartApi, annotations: Annotation[] | { layers: any }) => {
        // Handle annotation manager structure from Python side
        let annotationsArray: Annotation[] = [];

        if (annotations && typeof annotations === 'object') {
          // Check if this is an annotation manager structure (has layers)
          if ('layers' in annotations && annotations.layers) {
            // Extract annotations from all visible layers
            try {
              const layersArray = Object.values(annotations.layers);
              if (Array.isArray(layersArray)) {
                layersArray.forEach((layer: any) => {
                  if (
                    layer &&
                    layer.visible !== false &&
                    layer.annotations &&
                    Array.isArray(layer.annotations)
                  ) {
                    annotationsArray.push(...layer.annotations);
                  }
                });
              }
            } catch (error) {
              logger.warn('Error processing annotation layers', 'Annotations', error);
            }
          } else if (Array.isArray(annotations)) {
            // Direct array of annotations
            annotationsArray = annotations;
          }
        }

        // Validate annotations parameter
        if (!annotationsArray || !Array.isArray(annotationsArray)) {
          return;
        }

        // Additional safety check - ensure annotations is actually an array
        try {
          if (typeof annotationsArray.forEach !== 'function') {
            logger.info('Annotations array does not have forEach method', 'Annotations');
            return;
          }
        } catch (error) {
          logger.warn('Error checking annotations array', 'Annotations', error);
          return;
        }

        // Filter out invalid annotations
        const validAnnotations = annotationsArray.filter(
          annotation => annotation && typeof annotation === 'object' && annotation.time
        );

        if (validAnnotations.length === 0) {
          return;
        }

        // Additional safety check before calling createAnnotationVisualElements
        if (!Array.isArray(validAnnotations) || typeof validAnnotations.forEach !== 'function') {
          return;
        }

        const visualElements = createAnnotationVisualElements(validAnnotations);

        // Add markers using the markers plugin
        if (visualElements.markers.length > 0) {
          const seriesList = Object.values(seriesRefs.current).flat();
          if (seriesList.length > 0) {
            createSeriesMarkers(seriesList[0], visualElements.markers);
          }
        }

        // Add shapes using the shapes plugin
        if (visualElements.shapes.length > 0) {
          const seriesList = Object.values(seriesRefs.current).flat();
          if (seriesList.length > 0) {
            visualElements.shapes.forEach(shape => {
              try {
                const firstSeries = seriesList[0] as ExtendedSeriesApi;
                if (firstSeries.addShape) {
                  firstSeries.addShape(shape);
                } else if (firstSeries.setShapes) {
                  firstSeries.setShapes([shape]);
                }
              } catch (error) {
                logger.error('Error adding annotation shape', 'Annotations', error);
              }
            });
          }
        }
      },
      []
    );

    const addAnnotationLayers = useCallback(
      (chart: IChartApi, layers: AnnotationLayer[] | { layers: any }) => {
        // Handle annotation manager structure from Python side
        let layersArray: AnnotationLayer[] = [];

        if (layers && typeof layers === 'object') {
          // Check if this is an annotation manager structure (has layers)
          if ('layers' in layers && layers.layers) {
            // Convert layers object to array
            try {
              const layersValues = Object.values(layers.layers);
              if (Array.isArray(layersValues)) {
                layersArray = layersValues as AnnotationLayer[];
              }
            } catch (error) {
              logger.warn('Error processing annotation layers object', 'Annotations', error);
            }
          } else if (Array.isArray(layers)) {
            // Direct array of layers
            layersArray = layers;
          }
        }

        // Validate layers parameter
        if (!layersArray || !Array.isArray(layersArray)) {
          return;
        }

        layersArray.forEach(layer => {
          try {
            if (!layer || typeof layer !== 'object') {
              return;
            }

            if (layer.visible !== false && layer.annotations) {
              functionRefs.current.addAnnotations(chart, layer.annotations);
            }
          } catch (error) {
            logger.warn('Error processing annotation layer', 'Annotations', error);
          }
        });
      },
      []
    );

    /**
     * Initialize tooltip renderer for chart
     * Note: Plugins/primitives will use TooltipManager to request tooltip display
     */
    const addModularTooltip = useCallback(
      (
        _chart: IChartApi,
        container: HTMLElement,
        _seriesList: ISeriesApi<any>[],
        chartConfig: ChartConfig
      ) => {
        try {
          // Create tooltip renderer (just the DOM renderer)
          // Primitives and plugins will use TooltipManager to request tooltips
          const tooltipPlugin = new TooltipPlugin(
            container,
            chartConfig.chartId || `chart-${Date.now()}`
          );

          // Store plugin reference for cleanup
          if (!window.chartPlugins) {
            window.chartPlugins = new Map();
          }
          window.chartPlugins.set(chartConfig.chartId || `chart-${Date.now()}`, tooltipPlugin);

          logger.info('TooltipPlugin initialized', 'LightweightCharts');
        } catch (error) {
          logger.error('Error initializing tooltip plugin', 'LightweightCharts', error);
        }
      },
      []
    );

    const addRangeSwitcher = useCallback(async (chart: IChartApi, rangeConfig: any) => {
      try {
        const chartElement = chart.chartElement();
        if (!chartElement) return;

        const chartId = chartElement.id || `chart-${Date.now()}`;
        const primitiveManager = ChartPrimitiveManager.getInstance(chart, chartId);

        // Add range switcher using new primitive manager
        const rangeSwitcherWidget = primitiveManager.addRangeSwitcher(rangeConfig);

        // Register cleanup for this plugin
        if (!window.chartPlugins) {
          window.chartPlugins = new Map();
        }

        // Ensure we always get an array, even if the stored value is corrupted
        const storedPlugins = window.chartPlugins.get(chartId);
        const existingPlugins: any[] = Array.isArray(storedPlugins) ? storedPlugins : [];

        existingPlugins.push(rangeSwitcherWidget);
        window.chartPlugins.set(chartId, existingPlugins);
      } catch (error) {
        logger.error('Failed to store chart instance', 'LightweightCharts', error);
      }
    }, []);

    // Function to update legend positions when pane heights change - now handled by plugins
    const updateLegendPositions = useCallback(
      async (chart: IChartApi, legendsConfig: { [paneId: string]: LegendConfig }) => {
        // Check if component is being disposed
        if (isDisposingRef.current) {
          return;
        }

        // Check if chart is valid and legends config exists
        if (!chart || !legendsConfig || Object.keys(legendsConfig).length === 0) {
          return;
        }

        try {
          // Quick check if chart is still valid
          chart.chartElement();
        } catch {
          return;
        }

        // Additional safety check for chart validity
        try {
          chart.timeScale();
        } catch {
          return;
        }

        // Additional check to prevent disposal during async operations
        if (isDisposingRef.current) {
          return;
        }
      },
      []
    );

    // Store legend element references for dynamic updates
    const legendElementsRef = useRef<Map<string, HTMLElement>>(new Map());
    const legendSeriesDataRef = useRef<
      Map<
        string,
        {
          series: ISeriesApi<any>;
          legendConfig: LegendConfig;
          paneId: number;
          seriesName: string;
          seriesIndex: number;
        }[]
      >
    >(new Map());

    const addLegend = useCallback(
      async (
        chart: IChartApi,
        legendsConfig: { [legendKey: string]: { paneId: number; config: LegendConfig } },
        seriesList: ISeriesApi<any>[]
      ) => {
        try {
          // Use new ChartPrimitiveManager system for creating legends
          const chartId = chart.chartElement()?.id || `chart-${Date.now()}`;
          const primitiveManager = ChartPrimitiveManager.getInstance(chart, chartId);

          // Create legends for each series (allowing multiple legends per pane)
          for (const [, legendData] of Object.entries(legendsConfig)) {
            const { paneId, config: legendConfig } = legendData;
            if (legendConfig.visible) {
              try {
                primitiveManager.addLegend(legendConfig, false, paneId);
              } catch (legendError) {
                logger.error('Legend creation failed', 'Legend', legendError);
              }
            } else {
              // No legend configuration provided
            }
          }

          return;
        } catch (error) {
          logger.error('Trade visualization error', 'LightweightCharts', error);
        }

        // OLD SYSTEM BELOW - keeping as fallback but should not be reached

        // Check if component is being disposed
        if (isDisposingRef.current) {
          return;
        }

        // Check if chart is valid and legends config exists
        if (
          !chart ||
          !legendsConfig ||
          Object.keys(legendsConfig).length === 0 ||
          seriesList.length === 0
        ) {
          return;
        }

        try {
          // Quick check if chart is still valid
          chart.chartElement();
        } catch {
          return;
        }

        // Additional safety check for chart validity
        try {
          chart.timeScale();
        } catch {
          return;
        }

        // Additional check to prevent disposal during async operations
        if (isDisposingRef.current) {
          return;
        }

        // ✅ CRITICAL: Wait for chart API to be ready and get pane information

        try {
          await retryWithBackoff(
            async () => {
              // Check if component is being disposed
              if (isDisposingRef.current) {
                throw new Error('Component disposed during retry');
              }

              // Check if chart has panes available via API
              try {
                let panes: any[] = [];
                if (chart && typeof chart.panes === 'function') {
                  try {
                    panes = chart.panes();
                  } catch {
                    // chart.panes() failed, use empty array
                    panes = [];
                  }
                }

                // Verify we have enough panes for the legend config
                const maxPaneId = Math.max(...Object.keys(legendsConfig).map(id => parseInt(id)));
                if (panes.length <= maxPaneId) {
                  throw new Error(
                    `Not enough panes in chart API. Found: ${panes.length}, Need: ${maxPaneId + 1}`
                  );
                }

                return panes;
              } catch (error) {
                throw new Error(`Chart panes not ready: ${error}`);
              }
            },
            10,
            200
          ); // 10 retries with 200ms base delay (exponential backoff)
        } catch (error) {
          if (error instanceof Error && error.message === 'Component disposed during retry') {
            // Component disposed during retry
          } else {
            // Other error types handled by outer catch
          }
          return;
        }

        // Get chart ID for storing legend references
        const chartId = chart.chartElement().id || 'default';
        const legendSeriesData: {
          series: ISeriesApi<any>;
          legendConfig: LegendConfig;
          paneId: number;
          seriesName: string;
          seriesIndex: number;
        }[] = [];

        // Debug: Check for existing legend elements that might be from legacy systems
        const chartElement = chart.chartElement();

        // Check for any elements that might be legends
        const allElements = chartElement.querySelectorAll('*');
        const potentialLegends = Array.from(allElements).filter(el => {
          const text = el.textContent || '';
          return (
            text.includes('Know Sure Thing') ||
            text.includes('KST') ||
            text.includes('Legend') ||
            el.className.includes('legend') ||
            el.id.includes('legend')
          );
        });

        if (potentialLegends.length > 0) {
          // If we find "Know Sure Thing" legend, REMOVE IT from pane 0 and recreate it properly on pane 1
          const kstLegend = potentialLegends.find(el =>
            el.textContent?.includes('Know Sure Thing')
          );
          if (kstLegend) {
            try {
              // Remove the incorrectly positioned legend
              kstLegend.remove();
            } catch {
              logger.error('An error occurred', 'LightweightCharts');
            }
          }
        }

        // Group series by pane
        const seriesByPane = new Map<number, ISeriesApi<any>[]>();
        seriesList.forEach(series => {
          // Try to get paneId from series options or fallback to index-based assignment
          let paneId = 0;

          // Safely get series options
          let seriesOptions: any = {};
          try {
            if (typeof series.options === 'function') {
              seriesOptions = series.options();
            } else if (series.options) {
              seriesOptions = series.options;
            }
          } catch {
            logger.error('An error occurred', 'LightweightCharts');
          }

          // Get the paneId from the series configuration (backend sets this)
          let seriesPaneId: number | undefined = undefined;

          // First check if paneId is at the top level of the series (camelCase from backend)
          const extendedSeries = series as ExtendedSeriesApi;
          if (extendedSeries.paneId !== undefined) {
            seriesPaneId = extendedSeries.paneId;
          }
          // Then check if paneId is in the options
          else if (
            seriesOptions &&
            (seriesOptions as SeriesConfig & { paneId?: number }).paneId !== undefined
          ) {
            seriesPaneId = (seriesOptions as SeriesConfig & { paneId?: number }).paneId;
          }

          if (seriesPaneId !== undefined) {
            // Use the backend-assigned paneId
            paneId = seriesPaneId;
          } else {
            // If no paneId from backend, use default pane 0
            paneId = 0;
          }

          // No special handling - respect backend pane assignments only

          // Store the actual assigned pane ID on the series for later use (e.g., legend assignment)
          (series as ExtendedSeriesApi).assignedPaneId = paneId;

          if (!seriesByPane.has(paneId)) {
            seriesByPane.set(paneId, []);
          }
          const paneSeriesList = seriesByPane.get(paneId);
          if (paneSeriesList) {
            paneSeriesList.push(series);
          }
        });

        // Create legends only for panes that have explicit legend configurations
        Object.keys(legendsConfig).forEach(legendKey => {
          const legendData = legendsConfig[legendKey];
          const { paneId, config: legendConfig } = legendData;

          // Skip if no legend config exists
          if (!legendConfig) {
            return;
          }

          // Only create legend if config is visible
          if (!legendConfig.visible) {
            return;
          }

          // Check if this pane has series (optional validation)
          const paneSeries = seriesByPane.get(paneId) || [];

          // ✅ CORRECT: Use Lightweight Charts Drawing Primitives plugin for proper pane-scoped legends
          // Get pane API to verify it exists
          let paneApi;
          try {
            if (chart && typeof chart.panes === 'function') {
              try {
                const allPanes = chart.panes();
                paneApi = allPanes[paneId];
              } catch {
                // chart.panes() failed, use null
                paneApi = null;
              }
            } else {
              paneApi = null;
            }

            if (!paneApi) {
              return;
            }
          } catch {
            return;
          }

          // Legend items are now handled by the Drawing Primitives plugin
          // Store series data for crosshair updates
          paneSeries.forEach((series, index) => {
            // Find the actual seriesIndex in the original seriesList
            const actualSeriesIndex = seriesList.findIndex(s => s === series);
            legendSeriesData.push({
              series,
              legendConfig,
              paneId,
              seriesName: `Pane ${paneId}`,
              seriesIndex: actualSeriesIndex >= 0 ? actualSeriesIndex : index,
            });
          });

          // Legend items are now handled by the Drawing Primitives plugin
          // No need for manual DOM manipulation

          // Legend items are now handled by the Drawing Primitives plugin
          // No need for manual DOM manipulation
        });

        // Store legend series data for updates
        legendSeriesDataRef.current.set(chartId, legendSeriesData);

        // Setup crosshair event handling for legend updates
        // Debug: Log the legendsConfig to see what we're working with

        // Check if any legend has crosshair updates enabled OR contains $$value$$ placeholders
        // This check is now handled in the ChartPrimitiveManager

        // Legend crosshair updates are now handled in the main chart setup
        // to avoid chicken-and-egg problem with subscription setup
      },
      []
    );

    // Performance optimization: Memoized chart configuration processing
    const processedChartConfigs = useMemo(() => {
      if (!deferredConfig || !deferredConfig.charts || deferredConfig.charts.length === 0)
        return [];

      return deferredConfig.charts.map((chartConfig: ChartConfig, chartIndex: number) => {
        const chartId = chartConfig.chartId || `chart-${chartIndex}`;

        // Chart configuration processed

        return {
          ...chartConfig,
          chartId,
          containerId: `chart-container-${chartId}`,
          chartOptions: cleanLineStyleOptions({
            width: chartConfig.chart?.autoWidth
              ? undefined
              : chartConfig.chart?.width || width || undefined,
            height: chartConfig.chart?.autoHeight
              ? undefined
              : chartConfig.chart?.height || height || undefined,
            ...chartConfig.chart,
          }),
        };
      });
    }, [deferredConfig, width, height]);

    // Initialize charts
    const initializeCharts = useCallback(
      (isInitialRender = false) => {
        // Prevent re-initialization if already initialized and not disposing
        if (isInitializedRef.current && !isDisposingRef.current) {
          return;
        }

        // Additional check to prevent disposal during initialization (but allow initial render)
        if (isDisposingRef.current && !isInitialRender) {
          return;
        }

        // Clean up any existing CornerLayoutManager instances before initialization
        if (processedChartConfigs && processedChartConfigs.length > 0) {
          processedChartConfigs.forEach(chartConfig => {
            try {
              CornerLayoutManager.cleanup(chartConfig.chartId);
            } catch (error) {
              logger.warn('Layout manager already cleaned up', 'Cleanup', error);
            }
          });
        }

        // Check if we have charts to initialize
        if (!processedChartConfigs || processedChartConfigs.length === 0) {
          return;
        }

        // Only clean up existing charts if this is not the initial render
        if (!isInitialRender) {
          functionRefs.current.cleanupCharts();
        }

        if (!processedChartConfigs || processedChartConfigs.length === 0) {
          return;
        }

        // Initialize global registries for cross-component synchronization BEFORE creating charts
        if (!window.chartApiMap) {
          window.chartApiMap = {};
        }
        if (!window.chartGroupMap) {
          window.chartGroupMap = {};
        }
        if (!window.seriesRefsMap) {
          window.seriesRefsMap = {};
        }

        processedChartConfigs.forEach((chartConfig: ChartConfig) => {
          const chartId = chartConfig.chartId ?? `chart-${Date.now()}`;
          const containerId = chartConfig.containerId || `chart-container-${chartId}`;

          // Find or create container
          let container = document.getElementById(containerId);
          if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.style.width = '100%';
            container.style.height = '100%';

            // Find the main chart container - try multiple selectors with caching
            let mainContainer = getCachedDOMElement('[data-testid="stHorizontalBlock"]');
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('.stHorizontalBlock');
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('[data-testid="stVerticalBlock"]');
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('.stVerticalBlock');
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('[data-testid="stBlock"]');
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('.stBlock');
            }
            if (!mainContainer) {
              mainContainer = document.body;
            }

            if (mainContainer) {
              mainContainer.appendChild(container);

              // Ensure container has proper dimensions
              container.style.width = '100%';
              // Use specific height from chart config if available, otherwise use 100%
              const containerHeight = chartConfig.chart?.height
                ? `${chartConfig.chart.height}px`
                : '100%';
              container.style.height = containerHeight;
              container.style.minHeight = '300px';
              container.style.minWidth = '200px';
              container.style.display = 'block';
              container.style.position = 'relative';
              container.style.overflow = 'hidden';

              // Store container reference for performance
              chartContainersRef.current[chartId] = container;
            } else {
              return;
            }
          } else {
            chartContainersRef.current[chartId] = container;
          }

          // Create chart in container
          try {
            // Check if container is still valid
            if (!container || !container.isConnected) {
              logger.error('Container is not valid or not connected', 'ChartInit');
              return;
            }

            // Use pre-processed chart options
            const chartOptions = chartConfig.chartOptions || chartConfig.chart || {};

            let chart: IChartApi;
            try {
              chart = createChart(container, chartOptions as any);
            } catch (error) {
              logger.error('Failed to create chart', 'ChartInit', error);
              return;
            }

            // Check if chart was created successfully
            if (!chart) {
              logger.error('Chart is null after creation', 'ChartInit');
              return;
            }

            // Set the chart element's ID so we can retrieve it later
            const chartElement = chart.chartElement();
            if (chartElement) {
              chartElement.id = chartId;

              // Add user interaction detection to prevent conflicts with automatic operations
              const markUserInteraction = () => {
                (
                  chartElement as HTMLElement & { _userHasInteracted?: boolean }
                )._userHasInteracted = true;
              };

              // Listen for user interactions that could conflict with automatic timeScale operations
              chartElement.addEventListener('mousedown', markUserInteraction);
              chartElement.addEventListener('wheel', markUserInteraction);
              chartElement.addEventListener('touchstart', markUserInteraction);
            }

            chartRefs.current[chartId] = chart;

            // Register chart with coordinate service for consistency across services
            const coordinateService = ChartCoordinateService.getInstance();
            coordinateService.registerChart(chartId, chart);

            // Store chart API reference for legend positioning
            if (!window.chartApiMap) {
              window.chartApiMap = {};
            }
            window.chartApiMap[chartId] = chart;

            // Add resize observer to reposition legends when container resizes
            const resizeObserver =
              typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(entries => {
                    for (const entry of entries) {
                      if (entry.target === container) {
                        // Trigger legend repositioning for all panes
                        setTimeout(() => {
                          const legendElements = legendElementsRef.current;
                          if (legendElements) {
                            // Legend repositioning is now handled by direct DOM manipulation
                          }
                        }, 100); // Small delay to ensure resize is complete
                      }
                    }
                  })
                : null;

            // Start observing the container for size changes
            if (resizeObserver && typeof resizeObserver.observe === 'function') {
              resizeObserver.observe(container);
            }

            // Store the observer reference for cleanup
            if (!window.chartResizeObservers) {
              window.chartResizeObservers = {};
            }
            if (resizeObserver) {
              window.chartResizeObservers[chartId] = resizeObserver;
            }

            // Calculate chart dimensions once
            const containerRect = container.getBoundingClientRect();
            const chartWidth = chartConfig.autoWidth
              ? containerRect.width
              : (chartOptions && chartOptions.width) || width || containerRect.width;
            // Prioritize height from chart options (JSON config) over autoHeight
            const chartHeight =
              (chartOptions && chartOptions.height) ||
              (chartConfig.autoHeight ? containerRect.height : height) ||
              containerRect.height;

            // Ensure minimum dimensions
            const finalWidth = Math.max(Number(chartWidth) || 400, 200);
            const finalHeight = Math.max(Number(chartHeight) || 400, 200);

            // Resize chart once with calculated dimensions
            chart.resize(finalWidth, finalHeight);

            // Apply layout.panes options if present
            if (chartOptions.layout && (chartOptions as any).layout?.panes) {
              chart.applyOptions({
                layout: {
                  panes: (chartOptions as any).layout.panes,
                },
              });
            }

            // Create panes if needed for multi-pane charts
            const paneMap = new Map<number, any>();
            let existingPanes: any[] = [];

            // Safety check for chart.panes() method
            if (chart && typeof chart.panes === 'function') {
              try {
                existingPanes = chart.panes();
              } catch (error) {
                logger.warn('chart.panes() failed, using empty array', 'ChartInit', error);
                existingPanes = [];
              }
            }

            // Ensure we have enough panes for the series
            chartConfig.series.forEach((seriesConfig: SeriesConfig) => {
              const paneId = seriesConfig.paneId || 0;
              if (!paneMap.has(paneId)) {
                if (paneId < existingPanes.length) {
                  paneMap.set(paneId, existingPanes[paneId]);
                } else {
                  // Create new pane if it doesn't exist
                  let newPane = null;
                  if (chart && typeof chart.addPane === 'function') {
                    try {
                      newPane = chart.addPane();
                    } catch (error) {
                      logger.error('chart.addPane() failed', 'ChartInit', error);
                      newPane = null;
                    }
                  }

                  if (newPane) {
                    paneMap.set(paneId, newPane);
                    // Update existingPanes after adding new pane
                    if (chart && typeof chart.panes === 'function') {
                      try {
                        existingPanes = chart.panes();
                      } catch {
                        // chart.panes() failed, keep existing array
                      }
                    }
                  }
                }
              }
            });

            // Note: Pane heights will be applied AFTER series creation to ensure all panes exist

            // CRITICAL FIX: Apply right and left price scale configurations
            // These scales need to be configured after chart creation to apply any
            // modifications made by the backend (e.g., scale margins for price+volume charts)
            if (chartConfig.chart?.rightPriceScale) {
              try {
                const rightScale = chart.priceScale('right');
                if (rightScale) {
                  rightScale.applyOptions(
                    cleanLineStyleOptions(
                      chartConfig.chart.rightPriceScale as Record<string, unknown>
                    )
                  );
                }
              } catch (error) {
                logger.error('Failed to configure right price scale', 'ChartInit', error);
              }
            }

            if (chartConfig.chart?.leftPriceScale) {
              try {
                const leftScale = chart.priceScale('left');
                if (leftScale) {
                  leftScale.applyOptions(
                    cleanLineStyleOptions(
                      chartConfig.chart.leftPriceScale as Record<string, unknown>
                    )
                  );
                }
              } catch (error) {
                logger.error('Failed to configure left price scale', 'ChartInit', error);
              }
            }

            // Configure overlay price scales (volume, indicators, etc.) if they exist
            if (chartConfig.chart?.overlayPriceScales) {
              Object.entries(chartConfig.chart.overlayPriceScales).forEach(
                ([scaleId, scaleConfig]) => {
                  try {
                    // Create overlay price scale - use the scaleId directly
                    const overlayScale = chart.priceScale(scaleId);
                    if (overlayScale) {
                      overlayScale.applyOptions(
                        cleanLineStyleOptions(scaleConfig as Record<string, unknown>)
                      );
                    } else {
                      logger.info(
                        `Overlay scale ${scaleId} not found, will be created when series uses it`,
                        'ChartInit'
                      );
                    }
                  } catch (error) {
                    logger.error('Failed to configure overlay price scale', 'ChartInit', error);
                  }
                }
              );
            }

            // Create series for this chart
            const seriesList: ISeriesApi<any>[] = [];

            if (chartConfig.series && Array.isArray(chartConfig.series)) {
              chartConfig.series.forEach((seriesConfig: SeriesConfig, seriesIndex: number) => {
                try {
                  if (!seriesConfig || typeof seriesConfig !== 'object') {
                    logger.warn(`Series ${seriesIndex} is invalid, skipping`, 'ChartInit');
                    return;
                  }

                  // Pass trade data to the first series (candlestick series) for marker creation
                  if (
                    seriesIndex === 0 &&
                    chartConfig.trades &&
                    chartConfig.trades.length > 0 &&
                    chartConfig.tradeVisualizationOptions
                  ) {
                    seriesConfig.trades = chartConfig.trades;
                    seriesConfig.tradeVisualizationOptions = chartConfig.tradeVisualizationOptions;
                  }

                  // Create series using new UnifiedSeriesFactory
                  const series = createSeriesWithConfig(chart, {
                    ...seriesConfig,
                    chartId,
                    seriesId: `${chartId || 'default'}-series-${seriesIndex}`,
                  });
                  if (series) {
                    seriesList.push(series);

                    // Apply overlay price scale configuration if this series uses one
                    if (
                      seriesConfig.priceScaleId &&
                      seriesConfig.priceScaleId !== 'right' &&
                      seriesConfig.priceScaleId !== 'left' &&
                      chartConfig.chart?.overlayPriceScales?.[seriesConfig.priceScaleId]
                    ) {
                      const scaleConfig =
                        chartConfig.chart.overlayPriceScales[seriesConfig.priceScaleId];
                      try {
                        const priceScale = series.priceScale();
                        if (priceScale) {
                          priceScale.applyOptions(
                            cleanLineStyleOptions(scaleConfig as Record<string, unknown>)
                          );
                        }
                      } catch (error) {
                        logger.error(
                          'Failed to apply price scale configuration for series',
                          'LightweightCharts',
                          error
                        );
                      }
                    }

                    // Series legends are now handled directly in seriesFactory.ts

                    // Handle trade visualization for this series

                    if (seriesConfig.trades && seriesConfig.tradeVisualizationOptions) {
                      // CRITICAL: Wait for chart to be ready before attaching primitives

                      try {
                        // Don't block - use setTimeout to wait for chart readiness asynchronously
                        setTimeout(() => {
                          (async () => {
                            try {
                              // Wait for chart's coordinate system to be fully initialized
                              const isReady =
                                await ChartReadyDetector.waitForChartReadyForPrimitives(
                                  chart,
                                  series,
                                  {
                                    maxAttempts: 100,
                                    baseDelay: 100,
                                    requireData: true,
                                  }
                                );

                              if (
                                isReady &&
                                seriesConfig.trades &&
                                seriesConfig.tradeVisualizationOptions
                              ) {
                                await addTradeVisualization(
                                  chart,
                                  series,
                                  seriesConfig.trades,
                                  seriesConfig.tradeVisualizationOptions,
                                  seriesConfig.data
                                );
                              } else {
                                // Try to attach primitives anyway - sometimes coordinates work even if tests fail

                                try {
                                  if (
                                    seriesConfig.trades &&
                                    seriesConfig.tradeVisualizationOptions
                                  ) {
                                    await addTradeVisualization(
                                      chart,
                                      series,
                                      seriesConfig.trades,
                                      seriesConfig.tradeVisualizationOptions,
                                      seriesConfig.data
                                    );
                                  }
                                } catch (attachError) {
                                  logger.error('Plugin attachment failed', 'Plugin', attachError);
                                }
                              }
                            } catch (error) {
                              logger.error(
                                'Error in chart readiness or trade visualization',
                                'LightweightCharts',
                                error
                              );
                            }
                          })().catch((error: Error) =>
                            logger.error('Async operation failed', 'LightweightCharts', error)
                          );
                        }, 50); // Small delay to let chart initialization complete
                      } catch (error) {
                        logger.error(
                          'Error setting up trade visualization',
                          'LightweightCharts',
                          error
                        );
                      }
                    } else {
                      // No trade visualization options provided
                    }

                    // Add series-level annotations
                    if (seriesConfig.annotations) {
                      functionRefs.current.addAnnotations(chart, seriesConfig.annotations);
                    }
                  } else {
                    logger.error(
                      'Failed to create series - createSeriesWithConfig returned null',
                      'LightweightCharts'
                    );
                  }
                } catch (error) {
                  logger.error('Error creating series', 'LightweightCharts', error);
                }
              });
            } else {
              // No valid series configuration found
            }

            seriesRefs.current[chartId] = seriesList;
            // Update global series registry for cross-component synchronization
            if (window.seriesRefsMap) {
              window.seriesRefsMap[chartId] = seriesList;
            }

            // Apply pane heights configuration AFTER series creation to ensure all panes exist
            if (chartConfig.chart?.layout?.paneHeights) {
              // Get all panes after series creation
              let allPanes: any[] = [];
              if (chart && typeof chart.panes === 'function') {
                try {
                  allPanes = chart.panes();
                } catch {
                  // chart.panes() failed, use empty array
                  allPanes = [];
                }
              }

              Object.entries(chartConfig.chart.layout.paneHeights).forEach(
                ([paneIdStr, heightOptions]) => {
                  const paneId = parseInt(paneIdStr);
                  const options = heightOptions as PaneHeightOptions;

                  if (paneId < allPanes.length && options.factor) {
                    try {
                      allPanes[paneId].setStretchFactor(options.factor);
                    } catch (error) {
                      logger.error('Failed to set stretch factor for pane', 'ChartInit', error);
                    }
                  } else {
                    logger.info(`Skipping pane ${paneId} - out of range or no factor`, 'ChartInit');
                  }
                }
              );
            }

            // Add modular tooltip system
            functionRefs.current.addModularTooltip(chart, container, seriesList, chartConfig);

            // Store chart config for trade visualization when chart is ready
            chartConfigs.current[chartId] = chartConfig;

            // Add chart-level annotations
            if (chartConfig.annotations) {
              functionRefs.current.addAnnotations(chart, chartConfig.annotations);
            }

            // Add annotation layers
            if (chartConfig.annotationLayers) {
              functionRefs.current.addAnnotationLayers(chart, chartConfig.annotationLayers);
            }

            // Add price lines
            if (chartConfig.priceLines && seriesList.length > 0) {
              chartConfig.priceLines.forEach((priceLine: any) => {
                seriesList[0].createPriceLine(priceLine);
              });
            }

            // Add range switcher if configured
            if (chartConfig.chart?.rangeSwitcher && chartConfig.chart.rangeSwitcher.visible) {
              // Wait for chart to be ready before adding range switcher
              ChartReadyDetector.waitForChartReady(chart, chart.chartElement(), {
                minWidth: 200,
                minHeight: 100,
              })
                .then(isReady => {
                  if (isReady) {
                    functionRefs.current.addRangeSwitcher(chart, chartConfig.chart.rangeSwitcher);
                  }
                })
                .catch(error => {
                  logger.error('Failed to add legend', 'LightweightCharts', error);
                });
            }

            // Legends will be created after chart readiness check

            // Wait for chart readiness before setting up legends and initialization
            ChartReadyDetector.waitForChartReady(chart, chart.chartElement(), {
              minWidth: 200,
              minHeight: 100,
              maxAttempts: 10,
              baseDelay: 100,
            })
              .then(isReady => {
                if (isReady && chart && !isDisposingRef.current && chartRefs.current[chartId]) {
                  try {
                    // Create legends for each series after chart is ready
                    const currentChartId = chart.chartElement()?.id || `chart-${Date.now()}`;
                    const primitiveManager = ChartPrimitiveManager.getInstance(
                      chart,
                      currentChartId
                    );

                    seriesList.forEach((series, index) => {
                      const seriesConfig = chartConfig.series[index];

                      if (seriesConfig?.legend && seriesConfig.legend.visible) {
                        const paneId = seriesConfig.paneId || 0;

                        // Create legend after chart is ready - ensures proper positioning
                        // Pass series reference for crosshair value updates
                        try {
                          primitiveManager.addLegend(
                            seriesConfig.legend,
                            paneId > 0,
                            paneId,
                            series
                          );
                        } catch {
                          logger.error('An error occurred', 'LightweightCharts');
                        }
                      }
                    });

                    // Initial fitContent is now handled by handleDataLoaded function with proper tracking

                    // Observe the chart element for size changes
                    if (resizeObserver && typeof resizeObserver.observe === 'function') {
                      const chartElement = chart.chartElement();
                      if (chartElement) {
                        resizeObserver.observe(chartElement);
                      }
                    }

                    // Store the resize observer for cleanup
                    if (resizeObserver) {
                      legendResizeObserverRefs.current[chartId] = resizeObserver;
                    }
                  } catch {
                    // Error during chart initialization
                  }
                }
              })
              .catch(() => {
                // Chart readiness detection failed, skip legend setup
              });

            // Setup auto-sizing for the chart
            functionRefs.current.setupAutoSizing(chart, container, chartConfig);

            // Setup chart synchronization if enabled (throttling already applied)
            if (config.syncConfig && config.syncConfig.enabled) {
              const chartGroupId = chartConfig.chartGroupId || 0;

              // Initialize global registries if they don't exist (shared across ALL component instances)
              if (!window.chartGroupMap) {
                window.chartGroupMap = {};
              }
              if (!window.seriesRefsMap) {
                window.seriesRefsMap = {};
              }

              // Register chart in global registry for cross-component synchronization
              window.chartGroupMap[chartId] = chartGroupId;

              // Get group-specific sync config or use default
              let syncConfig = config.syncConfig;
              if (config.syncConfig.groups && config.syncConfig.groups[chartGroupId]) {
                syncConfig = config.syncConfig.groups[chartGroupId];
              }

              functionRefs.current.setupChartSynchronization(
                chart,
                chartId,
                syncConfig,
                chartGroupId
              );
            }

            // Setup fitContent functionality
            functionRefs.current.setupFitContent(chart, chartConfig);

            // Create individual pane containers and add collapse functionality (synchronous like working version)
            const paneCollapseConfig = chartConfig.paneCollapse || { enabled: true };

            // Enable the series settings button by default
            if (paneCollapseConfig.showSeriesSettingsButton === undefined) {
              paneCollapseConfig.showSeriesSettingsButton = true;
            }

            // Debug logging
            if (paneCollapseConfig.enabled !== false) {
              try {
                // Get all panes and wrap each in its own collapsible container
                let allPanes: any[] = [];
                if (chart && typeof chart.panes === 'function') {
                  try {
                    allPanes = chart.panes();
                  } catch (error) {
                    // chart.panes() failed, use empty array
                    logger.error('Failed to get panes', 'ButtonPanel', error);
                    allPanes = [];
                  }
                } else {
                  logger.error('Chart or chart.panes() is not available', 'ButtonPanel');
                }

                // Always set up crosshair subscription for legend value updates
                // This is needed for $$value$$ placeholders regardless of pane count
                chart.subscribeCrosshairMove(param => {
                  try {
                    const primitiveManager = ChartPrimitiveManager.getInstance(chart, chartId);

                    if (!param.time || !param.point) {
                      // Crosshair left the chart - clear all legend values
                      primitiveManager.updateLegendValues({
                        time: null,
                        point: null,
                        seriesData: new Map(),
                      });
                    } else {
                      // Crosshair is on the chart - update legend values with crosshair data
                      primitiveManager.updateLegendValues({
                        time: param.time as UTCTimestamp,
                        point: param.point,
                        seriesData: param.seriesData as Map<ExtendedSeriesApi, SeriesDataPoint>,
                      });
                    }
                  } catch {
                    logger.error('An error occurred', 'LightweightCharts');
                  }
                });

                // Show button panels when there are multiple panes (for collapse) or when series settings button is enabled
                if (allPanes.length > 1 || paneCollapseConfig.showSeriesSettingsButton) {
                  // Set up pane collapse support using ChartPrimitiveManager
                  try {
                    const primitiveManager = ChartPrimitiveManager.getInstance(chart, chartId); // Create button panels (gear + collapse buttons) for each pane using primitive manager
                    for (const [paneId, _pane] of allPanes.entries()) {
                      // Configure button panel based on pane count
                      const buttonConfig = {
                        ...paneCollapseConfig,
                        showCollapseButton: false, // TODO: Hidden until collapse functionality is fully implemented
                        showSeriesSettingsButton: paneCollapseConfig.showSeriesSettingsButton, // Always respect series settings button setting
                      }; // Add button panel using primitive manager
                      const buttonPanelWidget = primitiveManager.addButtonPanel(
                        paneId,
                        buttonConfig
                      ); // Store widget reference for cleanup
                      if (!window.paneButtonPanelWidgets) {
                        window.paneButtonPanelWidgets = {};
                      }
                      if (!window.paneButtonPanelWidgets[chartId]) {
                        window.paneButtonPanelWidgets[chartId] = [];
                      }
                      window.paneButtonPanelWidgets[chartId].push(buttonPanelWidget);
                    }
                  } catch (error) {
                    logger.error('Button panel creation failed at step', 'ButtonPanel', error);
                    logger.error(
                      'Error details: ' + (error instanceof Error ? error.message : String(error)),
                      'ButtonPanel'
                    );
                    logger.error(
                      'Error stack: ' + (error instanceof Error ? error.stack : String(error)),
                      'ButtonPanel'
                    );
                  }
                }
              } catch (error) {
                logger.error('Pane collapse setup failed', 'ButtonPanel', error);
              }
            }

            // Initial fitContent is now handled by handleDataLoaded function with proper tracking
            // to prevent multiple calls. This redundant delayed fitContent has been removed.
          } catch {
            logger.error('An error occurred', 'LightweightCharts');
          }
        });

        isInitializedRef.current = true;

        // Small delay to ensure charts are rendered before any cleanup
        setTimeout(() => {
          // Notify parent component that charts are ready
          if (onChartsReady) {
            onChartsReady();
          }
        }, 50);
      },
      [
        processedChartConfigs,
        config?.syncConfig,
        width,
        height,
        onChartsReady,
        addTradeVisualization,
      ]
    );

    // Update function references to avoid dependency issues
    useEffect(() => {
      functionRefs.current = {
        addTradeVisualization,
        // addTradeVisualizationWhenReady,  // Removed - no longer needed
        addAnnotations,
        addModularTooltip,
        addAnnotationLayers,
        addRangeSwitcher,
        addLegend,
        updateLegendPositions,
        setupAutoSizing,
        setupChartSynchronization,
        setupFitContent,
        setupPaneCollapseSupport,
        cleanupCharts,
      };
    }, [
      addTradeVisualization,
      addAnnotations,
      addModularTooltip,
      addAnnotationLayers,
      addRangeSwitcher,
      addLegend,
      updateLegendPositions,
      setupAutoSizing,
      setupChartSynchronization,
      setupFitContent,
      setupPaneCollapseSupport,
      cleanupCharts,
    ]);

    // React 18: Use deferredConfig for non-urgent updates
    useEffect(() => {
      if (deferredConfig && deferredConfig.charts && deferredConfig.charts.length > 0) {
        // Wrap heavy chart operations in startTransition for better UX
        startTransition(() => {
          initializeCharts(true);
        });
      }
    }, [deferredConfig, initializeCharts, startTransition]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        cleanupCharts();
      };
    }, [cleanupCharts]);

    // React 18: Use deferredConfig for rendering optimizations
    const chartContainers = useMemo(() => {
      if (!deferredConfig || !deferredConfig.charts || deferredConfig.charts.length === 0) {
        return [];
      }

      return deferredConfig.charts.map((chartConfig, index) => {
        const chartId = chartConfig.chartId || `chart-${index}`;
        const containerId = `chart-container-${chartId}`;

        // Determine container styling based on auto-sizing options
        const shouldAutoSize =
          chartConfig.autoSize || chartConfig.autoWidth || chartConfig.autoHeight;
        const chartOptions = chartConfig.chart || {};

        // Use optimized style creation with memoization
        const styles = createOptimizedStylesAdvanced(width, height, !!shouldAutoSize, chartOptions);
        const containerStyle = {
          ...styles.container,
          minWidth:
            chartOptions.minWidth || chartConfig.minWidth || (shouldAutoSize ? 200 : undefined),
          minHeight:
            chartOptions.minHeight || chartConfig.minHeight || (shouldAutoSize ? 200 : undefined),
          maxWidth: chartOptions.maxWidth || chartConfig.maxWidth,
          maxHeight: chartOptions.maxHeight || chartConfig.maxHeight,
        };

        const chartContainerStyle = styles.chartContainer;

        return (
          <div key={chartId} style={containerStyle}>
            <div id={containerId} style={chartContainerStyle} />
          </div>
        );
      });
    }, [deferredConfig, width, height]);

    // Handle config changes from series settings dialog
    useEffect(() => {
      if (!configChange) return;
      const { paneId, seriesId, configPatch } = configChange;

      // Find the appropriate chart and series to update
      Object.entries(chartRefs.current).forEach(([chartId, chart]) => {
        if (!chart) return;

        try {
          // Get chart series and find the matching one
          const chartSeries = seriesRefs.current[chartId] || [];

          chartSeries.forEach((series, index) => {
            // Check if this is the target series
            // The seriesId format is typically "pane-X-series-Y"
            const expectedSeriesId = `pane-${paneId}-series-${index}`;

            if (seriesId === expectedSeriesId) {
              // Apply the configuration changes to the series
              // Get series type from configPatch (added by plugin)
              const seriesType = (configPatch as any)._seriesType || 'line';

              // Remove _seriesType from patch before conversion (internal metadata)
              const { _seriesType, ...cleanConfigPatch } = configPatch as any;

              // Use property mapper to convert dialog config to API options
              const apiConfig = dialogConfigToApiOptions(seriesType, cleanConfigPatch);

              // Apply the options to the series
              if (Object.keys(apiConfig).length > 0) {
                series.applyOptions(apiConfig);

                // CRITICAL FIX: Ensure chart rerenders after config change
                // Use requestAnimationFrame to batch DOM updates and prevent render breaks
                requestAnimationFrame(() => {
                  try {
                    // Trigger a gentle chart update by accessing time scale
                    // This forces the chart to acknowledge the series changes
                    const timeScale = chart.timeScale();
                    if (timeScale) {
                      // Simply accessing the visible range triggers internal recalculation
                      timeScale.getVisibleRange();
                    }
                  } catch {
                    // Non-critical - chart may still update on next render cycle
                    logger.warn(
                      'Chart update after config change failed (non-critical)',
                      'SeriesConfig'
                    );
                  }
                });
              }
            }
          });
        } catch (error) {
          logger.error('Error applying config change', 'SeriesConfig', error);
        }
      });
    }, [configChange]);

    if (!config || !config.charts || config.charts.length === 0) {
      return <div>No charts configured</div>;
    }

    // Core chart content
    const chartContent = (
      <ErrorBoundary
        resetKeys={[config?.charts?.length, JSON.stringify(config)]}
        resetOnPropsChange={false}
        isolate={true}
        onError={(error, errorInfo) => {
          logger.error('Chart rendering error: ' + String(errorInfo), 'ErrorBoundary', error);
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            opacity: isPending ? 0.7 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {chartContainers}
        </div>
      </ErrorBoundary>
    );

    return chartContent;
  }
);

export default LightweightCharts;
