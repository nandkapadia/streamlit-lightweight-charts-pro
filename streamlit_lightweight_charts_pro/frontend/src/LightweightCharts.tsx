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
 * - Automatic resizing via the library's autoSize option
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
} from "react";
import {
  createChart,
  IChartApi,
  IPaneApi,
  createSeriesMarkers,
  UTCTimestamp,
  MouseEventParams as LWCMouseEventParams,
  Time,
} from "lightweight-charts";
import {
  ComponentConfig,
  ChartConfig,
  SeriesConfig,
  Annotation,
  AnnotationLayer,
  LegendConfig,
  SyncConfig,
  PaneHeightOptions,
  RangeSwitcherConfig,
} from "./types";
import {
  ExtendedSeriesApi,
  ExtendedChartApi,
  SeriesDataPoint,
  AnnotationLayers,
  Destroyable,
} from "./types/ChartInterfaces";
// Import from core package
import {
  logger,
  createAnnotationVisualElements,
  SignalSeries,
  TradeRectanglePrimitive,
  ChartReadyDetector,
  ChartCoordinateService,
  CornerLayoutManager,
  TooltipPlugin,
  cleanLineStyleOptions,
  getCachedDOMElement,
  createOptimizedStylesAdvanced,
} from "@nandkapadia/lightweight-charts-pro-core";
// Streamlit-specific services
import { ChartPrimitiveManager } from "./services/ChartPrimitiveManager";
import { createSeriesWithConfig } from "./series/UnifiedSeriesFactory";
import { normalizedPaneId, paneSeriesId } from "./utils/seriesIds";
import {
  applyChartOptionDefaults,
  pinnedContainerSize,
  resolveLegacySizing,
} from "./utils/chartOptionDefaults";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { react19Monitor } from "./utils/react19PerformanceMonitor";
import { dialogConfigToApiOptions } from "./series/UnifiedPropertyMapper";

/**
 * Take this series' queued trade rectangles off the chart.
 *
 * UnifiedSeriesFactory already created the rectangle data and any trade
 * markers. Claiming them here keeps a second visualization pass from drawing
 * the same trades again.
 */
const claimPendingTradeRectangles = (
  chart: IChartApi,
  series: ExtendedSeriesApi,
): Array<Record<string, unknown>> => {
  const extendedChart = chart as ExtendedChartApi;
  const pending = extendedChart._pendingTradeRectangles;
  if (!pending || pending.length === 0) {
    return [];
  }

  const claimed: Array<Record<string, unknown>> = [];
  const remaining: typeof pending = [];
  pending.forEach((entry) => {
    if ("rectangles" in entry && entry.series === series) {
      entry.rectangles.forEach((rectangle) => {
        claimed.push(rectangle as unknown as Record<string, unknown>);
      });
    } else {
      remaining.push(entry);
    }
  });
  extendedChart._pendingTradeRectangles = remaining;
  return claimed;
};

/** Attach trade rectangles that the series factory already created. */
const attachTradeRectangles = (
  series: ExtendedSeriesApi,
  rectangles: Array<Record<string, unknown>>,
): void => {
  rectangles.forEach((rectangleData) => {
    try {
      series.attachPrimitive(
        new TradeRectanglePrimitive(
          rectangleData as unknown as ConstructorParameters<
            typeof TradeRectanglePrimitive
          >[0],
        ) as Parameters<ExtendedSeriesApi["attachPrimitive"]>[0],
      );
    } catch (error) {
      logger.error(
        "Error attaching trade visualization primitive",
        "TradeViz",
        error,
      );
    }
  });
};

// Global type declarations for window extensions
// Global Window interface declarations moved to types/ChartInterfaces.ts to avoid conflicts

/**
 * Plugins for one chart are always stored as an array.
 * Older builds stored a single TooltipPlugin object; wrap that too.
 */
function chartPluginList(stored: unknown): Destroyable[] {
  if (Array.isArray(stored)) {
    return stored as Destroyable[];
  }
  if (
    stored &&
    typeof stored === "object" &&
    typeof (stored as Destroyable).destroy === "function"
  ) {
    return [stored as Destroyable];
  }
  return [];
}

function rememberChartPlugin(chartId: string, plugin: Destroyable): void {
  if (!window.chartPlugins) {
    window.chartPlugins = new Map();
  }
  const plugins = chartPluginList(window.chartPlugins.get(chartId));
  plugins.push(plugin);
  window.chartPlugins.set(chartId, plugins);
}

function destroyChartPlugins(chartId: string): void {
  if (!window.chartPlugins) {
    return;
  }
  chartPluginList(window.chartPlugins.get(chartId)).forEach((plugin) => {
    try {
      if (plugin && typeof plugin.destroy === "function") {
        plugin.destroy();
      }
    } catch (error) {
      logger.warn("Plugin already destroyed", "Cleanup", error);
    }
  });
  window.chartPlugins.delete(chartId);
}

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
    configPatch: Record<string, unknown>;
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
    const [isPending, _startTransition] = useTransition();
    const deferredConfig = useDeferredValue(config);

    // React 19 Performance Monitoring
    const transitionIdRef = useRef<string | null>(null);

    useEffect(() => {
      if (enableReact19Monitoring && !transitionIdRef.current) {
        transitionIdRef.current = react19Monitor.startTransition(
          "LightweightCharts",
          "chart",
        );
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
    const seriesRefs = useRef<{ [key: string]: ExtendedSeriesApi[] }>({});
    const signalPluginRefs = useRef<{ [key: string]: SignalSeries }>({});
    const chartConfigs = useRef<{ [key: string]: ChartConfig }>({});
    const isInitializedRef = useRef<boolean>(false);
    const isDisposingRef = useRef<boolean>(false);
    const chartContainersRef = useRef<{ [key: string]: HTMLElement }>({});

    // Store function references to avoid dependency issues
    const functionRefs = useRef<{
      addAnnotations:
        | ((
            chart: IChartApi,
            annotations: Annotation[] | AnnotationLayers,
          ) => void)
        | null;
      addModularTooltip:
        | ((
            chart: IChartApi,
            container: HTMLElement,
            seriesList: ExtendedSeriesApi[],
            chartConfig: ChartConfig,
          ) => void)
        | null;
      addAnnotationLayers:
        | ((
            chart: IChartApi,
            layers: AnnotationLayer[] | AnnotationLayers,
          ) => void)
        | null;
      addRangeSwitcher:
        | ((
            chart: IChartApi,
            rangeConfig: RangeSwitcherConfig,
          ) => Promise<void>)
        | null;
      addLegend:
        | ((
            chart: IChartApi,
            legendsConfig: {
              [legendKey: string]: { paneId: number; config: LegendConfig };
            },
            seriesList: ExtendedSeriesApi[],
          ) => Promise<void>)
        | null;
      updateLegendPositions:
        | ((
            chart: IChartApi,
            legendsConfig: { [paneId: string]: LegendConfig },
          ) => Promise<void>)
        | null;
      setupChartSynchronization:
        | ((
            chart: IChartApi,
            chartId: string,
            syncConfig: SyncConfig,
            chartGroupId?: number,
          ) => void)
        | null;
      setupFitContent:
        | ((chart: IChartApi, chartConfig: ChartConfig) => void)
        | null;
      setupPaneCollapseSupport:
        | ((chart: IChartApi, chartId: string) => void)
        | null;
      cleanupCharts: (() => void) | null;
    }>({
      addAnnotations: null,
      addModularTooltip: null,
      addAnnotationLayers: null,
      addRangeSwitcher: null,
      addLegend: null,
      updateLegendPositions: null,
      setupChartSynchronization: null,
      setupFitContent: null,
      setupPaneCollapseSupport: null,
      cleanupCharts: null,
    });

    const setupChartSynchronization = useCallback(
      (
        chart: IChartApi,
        chartId: string,
        syncConfig: SyncConfig,
        chartGroupId: number = 0,
      ) => {
        // Store chart reference for synchronization
        if (!chartRefs.current[chartId]) {
          chartRefs.current[chartId] = chart;
        }

        // Helper function to get crosshair data point from series data
        const getCrosshairDataPoint = (
          series: ExtendedSeriesApi,
          param: LWCMouseEventParams,
        ) => {
          if (!param.time) {
            return null;
          }
          const dataPoint = param.seriesData.get(series);
          return dataPoint || null;
        };

        // Helper function to sync crosshair between charts (TradingView's official approach)
        const syncCrosshair = (
          targetChart: IChartApi,
          targetSeries: ExtendedSeriesApi,
          dataPoint: SeriesDataPoint | null,
        ) => {
          if (
            dataPoint &&
            "value" in dataPoint &&
            dataPoint.value !== undefined
          ) {
            targetChart.setCrosshairPosition(
              dataPoint.value,
              dataPoint.time,
              targetSeries,
            );
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
              if (e.key === "chart_sync_data" && e.newValue) {
                try {
                  const syncData = JSON.parse(e.newValue);
                  if (
                    syncData.chartId !== chartId &&
                    syncData.groupId === chartGroupId &&
                    syncData.type === "crosshair"
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
                        chart.setCrosshairPosition(
                          syncData.value,
                          syncData.time,
                          targetSeries,
                        );
                        // Clear flag after a short delay
                        setTimeout(() => {
                          (chart as ExtendedChartApi)._isExternalSync = false;
                        }, 100);
                      }
                    }
                  }
                } catch (error) {
                  logger.error(
                    "Error handling storage change for crosshair sync",
                    "ChartSync",
                    error,
                  );
                }
              }
            };

            window.addEventListener("storage", handleStorageChange);
            (chart as ExtendedChartApi)._storageListenerAdded = true;
            // Store handler reference for cleanup
            (chart as ExtendedChartApi)._storageHandler = handleStorageChange;
          }

          chart.subscribeCrosshairMove((param) => {
            // Skip if this is an external sync to prevent feedback loops
            if ((chart as ExtendedChartApi)._isExternalSync) {
              return;
            }

            // Get all series from the current chart using stored references
            const currentSeries = seriesRefs.current[chartId] || [];

            // Method 1: Same-component synchronization (direct object references)
            Object.entries(window.chartApiMap || {}).forEach(
              ([id, otherChart]) => {
                if (id !== chartId && otherChart) {
                  try {
                    // Get the other chart's group ID from global registry
                    const otherChartGroupId = window.chartGroupMap?.[id] || 0;

                    // Only sync charts in the same group
                    if (otherChartGroupId === chartGroupId && param.time) {
                      const otherSeries = window.seriesRefsMap?.[id] || [];

                      // Sync using TradingView's approach - sync first series to first series
                      if (currentSeries.length > 0 && otherSeries.length > 0) {
                        const dataPoint = getCrosshairDataPoint(
                          currentSeries[0],
                          param,
                        );

                        // Set flag to prevent this update from triggering a sync back
                        (otherChart as ExtendedChartApi)._isExternalSync = true;

                        // Clear any existing timeout to prevent premature flag clearing
                        if (
                          (otherChart as ExtendedChartApi)._externalSyncTimeout
                        ) {
                          clearTimeout(
                            (otherChart as ExtendedChartApi)
                              ._externalSyncTimeout,
                          );
                        }

                        syncCrosshair(
                          otherChart as IChartApi,
                          otherSeries[0],
                          dataPoint,
                        );

                        // Clear flag after a short delay, storing timeout ID
                        (otherChart as ExtendedChartApi)._externalSyncTimeout =
                          setTimeout(() => {
                            (otherChart as ExtendedChartApi)._isExternalSync =
                              false;
                            (
                              otherChart as ExtendedChartApi
                            )._externalSyncTimeout = undefined;
                          }, 100);
                      }
                    }
                  } catch (error) {
                    logger.warn(
                      "Error syncing crosshair to other chart",
                      "ChartSync",
                      error,
                    );
                  }
                }
              },
            );

            // Method 2: Cross-component synchronization using localStorage
            if (param.time && currentSeries.length > 0) {
              const dataPoint = getCrosshairDataPoint(currentSeries[0], param);
              const syncData = {
                time: param.time,
                value:
                  dataPoint && "value" in dataPoint ? dataPoint.value : null,
                chartId: chartId,
                groupId: chartGroupId,
                timestamp: Date.now(),
                type: "crosshair",
              };

              // Store in localStorage for cross-component communication
              try {
                localStorage.setItem(
                  "chart_sync_data",
                  JSON.stringify(syncData),
                );
              } catch (error) {
                logger.warn(
                  "Failed to store crosshair sync data in localStorage",
                  "ChartSync",
                  error,
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
                if (e.key === "chart_time_range_sync" && e.newValue) {
                  try {
                    const syncData = JSON.parse(e.newValue);
                    if (
                      syncData.chartId !== chartId &&
                      syncData.groupId === chartGroupId &&
                      syncData.type === "timeRange"
                    ) {
                      // Debounce to prevent feedback loops
                      const now = Date.now();
                      if (
                        now - lastTimeRangeSyncTimestamp <
                        TIME_RANGE_SYNC_DEBOUNCE_MS
                      ) {
                        return;
                      }
                      lastTimeRangeSyncTimestamp = now;

                      // Apply time range sync from other component
                      if (syncData.timeRange) {
                        const currentTimeScale = chart.timeScale();
                        if (currentTimeScale) {
                          // Set flag to prevent this update from triggering localStorage storage
                          (chart as ExtendedChartApi)._isExternalTimeRangeSync =
                            true;
                          currentTimeScale.setVisibleLogicalRange(
                            syncData.timeRange,
                          );
                          // Clear flag after a short delay
                          setTimeout(() => {
                            (
                              chart as ExtendedChartApi
                            )._isExternalTimeRangeSync = false;
                          }, 150);
                        }
                      }
                    }
                  } catch (error) {
                    logger.error(
                      "Error handling storage change for time range sync",
                      "ChartSync",
                      error,
                    );
                  }
                }
              };

              window.addEventListener("storage", handleTimeRangeStorageChange);
              (chart as ExtendedChartApi)._timeRangeStorageListenerAdded = true;
              // Store handler reference for cleanup
              (chart as ExtendedChartApi)._timeRangeStorageHandler =
                handleTimeRangeStorageChange;
            }

            // Throttle timeScale range changes to prevent X-axis lag during pan/zoom
            let lastTimeRangeSync = 0;
            const timeRangeSyncThrottle = 16; // ~60fps max for smooth performance
            timeScale.subscribeVisibleLogicalRangeChange((timeRange) => {
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
              Object.entries(window.chartApiMap || {}).forEach(
                ([id, otherChart]) => {
                  if (id !== chartId && otherChart) {
                    try {
                      // Get the other chart's group ID from global registry
                      const otherChartGroupId = window.chartGroupMap?.[id] || 0;

                      // Only sync charts in the same group
                      if (otherChartGroupId === chartGroupId) {
                        const otherTimeScale = otherChart.timeScale();
                        if (otherTimeScale && timeRange) {
                          // Set flag to prevent this update from triggering a sync back
                          (
                            otherChart as ExtendedChartApi
                          )._isExternalTimeRangeSync = true;

                          // Clear any existing timeout to prevent premature flag clearing
                          if (
                            (otherChart as ExtendedChartApi)
                              ._externalTimeRangeSyncTimeout
                          ) {
                            clearTimeout(
                              (otherChart as ExtendedChartApi)
                                ._externalTimeRangeSyncTimeout,
                            );
                          }

                          otherTimeScale.setVisibleLogicalRange(timeRange);

                          // Clear flag after a short delay, storing timeout ID
                          (
                            otherChart as ExtendedChartApi
                          )._externalTimeRangeSyncTimeout = setTimeout(() => {
                            (
                              otherChart as ExtendedChartApi
                            )._isExternalTimeRangeSync = false;
                            (
                              otherChart as ExtendedChartApi
                            )._externalTimeRangeSyncTimeout = undefined;
                          }, 150);
                        }
                      }
                    } catch (error) {
                      logger.warn(
                        "Error syncing time range to other chart",
                        "ChartSync",
                        error,
                      );
                    }
                  }
                },
              );

              // Method 2: Cross-component synchronization using localStorage
              if (timeRange) {
                const syncData = {
                  timeRange: timeRange,
                  chartId: chartId,
                  groupId: chartGroupId,
                  timestamp: Date.now(),
                  type: "timeRange",
                };

                // Store in localStorage for cross-component communication
                try {
                  localStorage.setItem(
                    "chart_time_range_sync",
                    JSON.stringify(syncData),
                  );
                } catch (error) {
                  logger.warn(
                    "Failed to store time range sync data in localStorage",
                    "ChartSync",
                    error,
                  );
                }
              }
            });
          }
        }
      },
      [],
    );

    /**
     * Wrap each pane in its own individual container for proper collapse functionality
     */
    const setupPaneCollapseSupport = useCallback(
      (chart: IChartApi, chartId: string) => {
        try {
          // Initialize pane wrapper registry for collapse plugin to use
          window.paneWrappers = window.paneWrappers || {};
          window.paneWrappers[chartId] = {};

          // Store chart reference for pane collapse to work with stretch factors
          window.chartInstances = window.chartInstances || {};
          window.chartInstances[chartId] = chart;
        } catch (error) {
          logger.error(
            "Failed to store chart instance",
            "LightweightCharts",
            error,
          );
        }

        // Crosshair subscription for legend value updates is now handled
        // in the main chart creation flow to ensure it works for all charts
      },
      [],
    );

    const setupFitContent = useCallback(
      (chart: IChartApi, chartConfig: ChartConfig) => {
        // Safety check for chart.timeScale() method
        if (!chart || typeof chart.timeScale !== "function") {
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
          // Wait for chart to be ready before calling fitContent
          ChartReadyDetector.waitForChartReady(chart, chart.chartElement(), {
            minWidth: 200,
            minHeight: 100,
            maxAttempts: 50,
            baseDelay: 100,
          })
            .then((isReady) => {
              if (isReady) {
                try {
                  const chartElement = chart.chartElement();
                  const userInteracted = (
                    chartElement as HTMLElement & {
                      _userHasInteracted?: boolean;
                    }
                  )._userHasInteracted;

                  if (chartElement && !userInteracted) {
                    timeScale.fitContent();
                  }
                } catch (error) {
                  logger.error(
                    "fitContent on load failed",
                    "FitContent",
                    error,
                  );
                }
              }
            })
            .catch((error) => {
              logger.error("Chart readiness check failed", "FitContent", error);
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
                logger.warn(
                  "fitContent on double-click failed",
                  "FitContent",
                  error,
                );
              }
              lastClickTime = 0; // Reset to prevent triple-click
            } else {
              lastClickTime = currentTime;
            }
          });
        }
      },
      [],
    );

    // Performance optimization: Enhanced cleanup function with better memory management
    const cleanupCharts = useCallback(() => {
      // Cleanup charts

      // Set disposing flag to prevent async operations during cleanup
      // (isInitializedRef tracks whether we've rendered before)
      if (isInitializedRef.current) {
        isDisposingRef.current = true;
      }

      // Clean up signal series plugins
      // Note: SignalSeries instances don't need explicit cleanup as they are
      // managed by the chart's series lifecycle
      signalPluginRefs.current = {};

      // Legend cleanup is now handled automatically by pane primitives

      // Only touch charts this component owns. window.* maps are shared by
      // every chart in the iframe, so a single cleanup must not clear them.
      const ownedChartIds = new Set<string>([
        ...Object.keys(chartRefs.current),
        ...Object.keys(chartConfigs.current),
      ]);

      // Clean up pane button panel widgets (new widget-based approach)
      if (window.paneButtonPanelWidgets) {
        ownedChartIds.forEach((ownedChartId) => {
          const widgets = window.paneButtonPanelWidgets?.[ownedChartId];
          if (Array.isArray(widgets)) {
            widgets.forEach((widget) => {
              const destroyable = widget as Destroyable;
              try {
                if (destroyable && typeof destroyable.destroy === "function") {
                  destroyable.destroy();
                }
              } catch (error) {
                logger.warn(
                  "Error destroying button panel widget",
                  "Cleanup",
                  error,
                );
              }
            });
          }
          if (window.paneButtonPanelWidgets) {
            delete window.paneButtonPanelWidgets[ownedChartId];
          }
        });
      }

      // Destroy TooltipPlugin and other plugins for these charts only.
      ownedChartIds.forEach((ownedChartId) => {
        destroyChartPlugins(ownedChartId);
      });

      // Clean up widget managers
      if (window.chartApiMap) {
        ownedChartIds.forEach((ownedChartId) => {
          try {
            ChartPrimitiveManager.cleanup(ownedChartId);
          } catch (error) {
            logger.warn("Widget manager already cleaned up", "Cleanup", error);
          }
          if (window.chartApiMap) {
            delete window.chartApiMap[ownedChartId];
          }
        });
      }

      // Unregister charts from coordinate service
      const coordinateService = ChartCoordinateService.getInstance();
      Object.keys(chartRefs.current).forEach((chartId) => {
        coordinateService.unregisterChart(chartId);
      });

      // Clean up CornerLayoutManager instances to remove phantom widgets
      Object.keys(chartRefs.current).forEach((chartId) => {
        try {
          CornerLayoutManager.cleanup(chartId);
        } catch (error) {
          logger.warn(
            "CornerLayoutManager already cleaned up",
            "Cleanup",
            error,
          );
        }
      });

      // Clear any pending timeouts and remove storage listeners from chart sync operations
      Object.values(chartRefs.current).forEach((chart) => {
        try {
          const extendedChart = chart as ExtendedChartApi;
          // Clear crosshair sync timeout
          if (extendedChart._externalSyncTimeout) {
            clearTimeout(extendedChart._externalSyncTimeout);
            extendedChart._externalSyncTimeout = undefined;
          }
          // Clear time range sync timeout
          if (extendedChart._externalTimeRangeSyncTimeout) {
            clearTimeout(extendedChart._externalTimeRangeSyncTimeout);
            extendedChart._externalTimeRangeSyncTimeout = undefined;
          }
          // Remove crosshair storage event listener
          if (extendedChart._storageHandler) {
            window.removeEventListener(
              "storage",
              extendedChart._storageHandler,
            );
            extendedChart._storageHandler = undefined;
            extendedChart._storageListenerAdded = false;
          }
          // Remove time range storage event listener
          if (extendedChart._timeRangeStorageHandler) {
            window.removeEventListener(
              "storage",
              extendedChart._timeRangeStorageHandler,
            );
            extendedChart._timeRangeStorageHandler = undefined;
            extendedChart._timeRangeStorageListenerAdded = false;
          }
        } catch (error) {
          logger.warn(
            "Error clearing chart timeouts and listeners",
            "Cleanup",
            error,
          );
        }
      });

      // Remove all charts with better error handling
      Object.values(chartRefs.current).forEach((chart) => {
        try {
          // Check if chart is still valid before removing
          if (chart && typeof chart.remove === "function") {
            chart.remove();
          }
        } catch (error) {
          logger.warn("Chart already removed or disposed", "Cleanup", error);
        }
      });

      // Clear references
      chartRefs.current = {};
      seriesRefs.current = {};
      signalPluginRefs.current = {};
      chartConfigs.current = {};
      chartContainersRef.current = {};

      // Reset initialization flag
      isInitializedRef.current = false;

      // CRITICAL: Reset disposing flag after cleanup completes
      // This allows subsequent reinitializations to proceed
      isDisposingRef.current = false;
    }, []);

    const addAnnotations = useCallback(
      (_chart: IChartApi, annotations: Annotation[] | AnnotationLayers) => {
        // Handle annotation manager structure from Python side
        let annotationsArray: Annotation[] = [];

        if (annotations && typeof annotations === "object") {
          // Check if this is an annotation manager structure (has layers)
          if ("layers" in annotations && annotations.layers) {
            // Extract annotations from all visible layers
            try {
              const layersArray = Object.values(
                annotations.layers,
              ) as unknown[];
              if (Array.isArray(layersArray)) {
                layersArray.forEach((layer: unknown) => {
                  const annotationLayer = layer as AnnotationLayer;
                  if (
                    annotationLayer &&
                    annotationLayer.visible !== false &&
                    annotationLayer.annotations &&
                    Array.isArray(annotationLayer.annotations)
                  ) {
                    annotationsArray.push(...annotationLayer.annotations);
                  }
                });
              }
            } catch (error) {
              logger.warn(
                "Error processing annotation layers",
                "Annotations",
                error,
              );
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
          if (typeof annotationsArray.forEach !== "function") {
            logger.info(
              "Annotations array does not have forEach method",
              "Annotations",
            );
            return;
          }
        } catch (error) {
          logger.warn("Error checking annotations array", "Annotations", error);
          return;
        }

        // Filter out invalid annotations
        const validAnnotations = annotationsArray.filter(
          (annotation) =>
            annotation && typeof annotation === "object" && annotation.time,
        );

        if (validAnnotations.length === 0) {
          return;
        }

        // Additional safety check before calling createAnnotationVisualElements
        if (
          !Array.isArray(validAnnotations) ||
          typeof validAnnotations.forEach !== "function"
        ) {
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
            visualElements.shapes.forEach((shape) => {
              try {
                const firstSeries = seriesList[0] as ExtendedSeriesApi;
                if (firstSeries.addShape) {
                  firstSeries.addShape(shape);
                } else if (firstSeries.setShapes) {
                  firstSeries.setShapes([shape]);
                }
              } catch (error) {
                logger.error(
                  "Error adding annotation shape",
                  "Annotations",
                  error,
                );
              }
            });
          }
        }
      },
      [],
    );

    const addAnnotationLayers = useCallback(
      (chart: IChartApi, layers: AnnotationLayer[] | AnnotationLayers) => {
        // Handle annotation manager structure from Python side
        let layersArray: AnnotationLayer[] = [];

        if (layers && typeof layers === "object") {
          // Check if this is an annotation manager structure (has layers)
          if ("layers" in layers && layers.layers) {
            // Convert layers object to array
            try {
              const layersValues = Object.values(layers.layers);
              if (Array.isArray(layersValues)) {
                layersArray = layersValues as unknown as AnnotationLayer[];
              }
            } catch (error) {
              logger.warn(
                "Error processing annotation layers object",
                "Annotations",
                error,
              );
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

        layersArray.forEach((layer) => {
          try {
            if (!layer || typeof layer !== "object") {
              return;
            }

            if (layer.visible !== false && layer.annotations) {
              functionRefs.current.addAnnotations?.(chart, layer.annotations);
            }
          } catch (error) {
            logger.warn(
              "Error processing annotation layer",
              "Annotations",
              error,
            );
          }
        });
      },
      [],
    );

    /**
     * Initialize tooltip renderer for chart
     * Note: Plugins/primitives will use TooltipManager to request tooltip display
     */
    const addModularTooltip = useCallback(
      (
        _chart: IChartApi,
        container: HTMLElement,
        _seriesList: ExtendedSeriesApi[],
        chartConfig: ChartConfig,
      ) => {
        try {
          // Create tooltip renderer (just the DOM renderer)
          // Primitives and plugins will use TooltipManager to request tooltips
          const chartId = chartConfig.chartId || `chart-${Date.now()}`;
          const tooltipPlugin = new TooltipPlugin(container, chartId);

          // Always store an array so cleanup can destroy TooltipPlugin
          // alongside range switchers and other plugins.
          rememberChartPlugin(chartId, tooltipPlugin);

          logger.info("TooltipPlugin initialized", "LightweightCharts");
        } catch (error) {
          logger.error(
            "Error initializing tooltip plugin",
            "LightweightCharts",
            error,
          );
        }
      },
      [],
    );

    const addRangeSwitcher = useCallback(
      async (chart: IChartApi, rangeConfig: RangeSwitcherConfig) => {
        try {
          const chartElement = chart.chartElement();
          if (!chartElement) return;

          const chartId = chartElement.id || `chart-${Date.now()}`;
          const primitiveManager = ChartPrimitiveManager.getInstance(
            chart,
            chartId,
          );

          // Add range switcher using new primitive manager
          const rangeSwitcherWidget =
            primitiveManager.addRangeSwitcher(rangeConfig);

          rememberChartPlugin(chartId, rangeSwitcherWidget as Destroyable);
        } catch (error) {
          logger.error(
            "Failed to store chart instance",
            "LightweightCharts",
            error,
          );
        }
      },
      [],
    );

    // Function to update legend positions when pane heights change - now handled by plugins
    const updateLegendPositions = useCallback(
      async (
        chart: IChartApi,
        legendsConfig: { [paneId: string]: LegendConfig },
      ) => {
        // Check if component is being disposed
        if (isDisposingRef.current) {
          return;
        }

        // Check if chart is valid and legends config exists
        if (
          !chart ||
          !legendsConfig ||
          Object.keys(legendsConfig).length === 0
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
      },
      [],
    );

    const addLegend = useCallback(
      async (
        chart: IChartApi,
        legendsConfig: {
          [legendKey: string]: { paneId: number; config: LegendConfig };
        },
        seriesList: ExtendedSeriesApi[],
      ) => {
        try {
          // Use new ChartPrimitiveManager system for creating legends
          const chartId = chart.chartElement()?.id || `chart-${Date.now()}`;
          const primitiveManager = ChartPrimitiveManager.getInstance(
            chart,
            chartId,
          );

          // Create legends for each series (allowing multiple legends per pane)
          for (const [, legendData] of Object.entries(legendsConfig)) {
            const { paneId, config: legendConfig } = legendData;
            if (legendConfig.visible) {
              try {
                primitiveManager.addLegend(legendConfig, false, paneId);
              } catch (legendError) {
                logger.error("Legend creation failed", "Legend", legendError);
              }
            } else {
              // No legend configuration provided
            }
          }

          return;
        } catch (error) {
          logger.error("Trade visualization error", "LightweightCharts", error);
        }
      },
      [],
    );

    // Performance optimization: Memoized chart configuration processing
    const processedChartConfigs = useMemo(() => {
      if (
        !deferredConfig ||
        !deferredConfig.charts ||
        deferredConfig.charts.length === 0
      )
        return [];

      return deferredConfig.charts.map(
        (chartConfig: ChartConfig, chartIndex: number) => {
          const chartId = chartConfig.chartId || `chart-${chartIndex}`;

          // Chart configuration processed

          const nestedChart = chartConfig.chart ?? {};
          const sizing = resolveLegacySizing(chartConfig);
          return {
            ...chartConfig,
            chartId,
            containerId: `chart-container-${chartId}`,
            chartOptions: applyChartOptionDefaults(
              cleanLineStyleOptions({
                // Spread nested options first so autoSize/autoHeight can clear
                // Python's default height: 400 afterwards.
                ...nestedChart,
                width:
                  sizing.autoSize || sizing.autoWidth
                    ? undefined
                    : nestedChart.width || width || undefined,
                height:
                  sizing.autoSize || sizing.autoHeight
                    ? undefined
                    : nestedChart.height || height || undefined,
              }),
              sizing,
            ),
          };
        },
      );
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
          processedChartConfigs.forEach((chartConfig) => {
            try {
              CornerLayoutManager.cleanup(chartConfig.chartId);
            } catch (error) {
              logger.warn(
                "Layout manager already cleaned up",
                "Cleanup",
                error,
              );
            }
          });
        }

        // Check if we have charts to initialize
        if (!processedChartConfigs || processedChartConfigs.length === 0) {
          return;
        }

        // Only clean up existing charts if this is not the initial render
        if (!isInitialRender) {
          functionRefs.current.cleanupCharts?.();
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
          const containerId =
            chartConfig.containerId || `chart-container-${chartId}`;

          // Find or create container
          let container = document.getElementById(containerId);
          if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            container.style.width = "100%";
            container.style.height = "100%";

            // Find the main chart container - try multiple selectors with caching
            let mainContainer = getCachedDOMElement(
              '[data-testid="stHorizontalBlock"]',
            );
            if (!mainContainer) {
              mainContainer = getCachedDOMElement(".stHorizontalBlock");
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement(
                '[data-testid="stVerticalBlock"]',
              );
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement(".stVerticalBlock");
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement('[data-testid="stBlock"]');
            }
            if (!mainContainer) {
              mainContainer = getCachedDOMElement(".stBlock");
            }
            if (!mainContainer) {
              mainContainer = document.body;
            }

            if (mainContainer) {
              mainContainer.appendChild(container);

              // Ensure container has proper dimensions
              container.style.width = "100%";
              // Use specific height from chart config if available, otherwise use 100%
              const containerHeight = chartConfig.chart?.height
                ? `${chartConfig.chart.height}px`
                : "100%";
              container.style.height = containerHeight;
              container.style.minHeight = "300px";
              container.style.minWidth = "200px";
              container.style.display = "block";
              container.style.position = "relative";
              container.style.overflow = "hidden";

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
              logger.error(
                "Container is not valid or not connected",
                "ChartInit",
              );
              return;
            }

            // Use pre-processed chart options
            const chartOptions =
              chartConfig.chartOptions || chartConfig.chart || {};

            let chart: IChartApi;
            try {
              chart = createChart(container, chartOptions as any);
            } catch (error) {
              logger.error("Failed to create chart", "ChartInit", error);
              return;
            }

            // Check if chart was created successfully
            if (!chart) {
              logger.error("Chart is null after creation", "ChartInit");
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
              chartElement.addEventListener("mousedown", markUserInteraction);
              chartElement.addEventListener("wheel", markUserInteraction);
              chartElement.addEventListener("touchstart", markUserInteraction);
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

            // With autoSize the library tracks the container itself and ignores resize()
            if (!chart.autoSizeActive()) {
              const containerRect = container.getBoundingClientRect();
              const chartWidth =
                (chartOptions && chartOptions.width) ||
                width ||
                containerRect.width;
              // Prioritize height from chart options (JSON config)
              const chartHeight =
                (chartOptions && chartOptions.height) ||
                height ||
                containerRect.height;

              // Ensure minimum dimensions
              const finalWidth = Math.max(Number(chartWidth) || 400, 200);
              const finalHeight = Math.max(Number(chartHeight) || 400, 200);

              chart.resize(finalWidth, finalHeight);
            }

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
            let existingPanes: IPaneApi<Time>[] = [];

            // Safety check for chart.panes() method
            if (chart && typeof chart.panes === "function") {
              try {
                existingPanes = chart.panes();
              } catch (error) {
                logger.warn(
                  "chart.panes() failed, using empty array",
                  "ChartInit",
                  error,
                );
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
                  if (chart && typeof chart.addPane === "function") {
                    try {
                      newPane = chart.addPane();
                    } catch (error) {
                      logger.error(
                        "chart.addPane() failed",
                        "ChartInit",
                        error,
                      );
                      newPane = null;
                    }
                  }

                  if (newPane) {
                    paneMap.set(paneId, newPane);
                    // Update existingPanes after adding new pane
                    if (chart && typeof chart.panes === "function") {
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
                const rightScale = chart.priceScale("right");
                if (rightScale) {
                  rightScale.applyOptions(
                    cleanLineStyleOptions(
                      chartConfig.chart.rightPriceScale as Record<
                        string,
                        unknown
                      >,
                    ),
                  );
                }
              } catch (error) {
                logger.error(
                  "Failed to configure right price scale",
                  "ChartInit",
                  error,
                );
              }
            }

            if (chartConfig.chart?.leftPriceScale) {
              try {
                const leftScale = chart.priceScale("left");
                if (leftScale) {
                  leftScale.applyOptions(
                    cleanLineStyleOptions(
                      chartConfig.chart.leftPriceScale as Record<
                        string,
                        unknown
                      >,
                    ),
                  );
                }
              } catch (error) {
                logger.error(
                  "Failed to configure left price scale",
                  "ChartInit",
                  error,
                );
              }
            }

            // Note: Overlay price scales are configured after series creation (see lines 2026-2050)
            // This ensures the price scale exists before we try to configure it

            // Create series for this chart
            const seriesList: ExtendedSeriesApi[] = [];

            if (chartConfig.series && Array.isArray(chartConfig.series)) {
              const paneSeriesCounts = new Map<number, number>();
              chartConfig.series.forEach(
                (seriesConfig: SeriesConfig, seriesIndex: number) => {
                  try {
                    if (!seriesConfig || typeof seriesConfig !== "object") {
                      logger.warn(
                        `Series ${seriesIndex} is invalid, skipping`,
                        "ChartInit",
                      );
                      return;
                    }
                    const seriesPaneId = seriesConfig.paneId ?? 0;
                    const perPaneIndex =
                      paneSeriesCounts.get(seriesPaneId) ?? 0;
                    paneSeriesCounts.set(seriesPaneId, perPaneIndex + 1);

                    // Pass trade data to the first series (candlestick series) for marker creation
                    if (
                      seriesIndex === 0 &&
                      chartConfig.trades &&
                      chartConfig.trades.length > 0 &&
                      chartConfig.tradeVisualizationOptions
                    ) {
                      seriesConfig.trades = chartConfig.trades;
                      seriesConfig.tradeVisualizationOptions =
                        chartConfig.tradeVisualizationOptions;
                    }

                    // Create series using new UnifiedSeriesFactory
                    const series = createSeriesWithConfig(chart, {
                      ...seriesConfig,
                      chartId,
                      paneId: seriesPaneId,
                      seriesId: paneSeriesId(seriesPaneId, perPaneIndex),
                    });
                    if (series) {
                      seriesList.push(series);

                      // Apply overlay price scale configuration if this series uses one
                      // Note: priceScaleId is inside options object after API restructuring
                      const priceScaleId = seriesConfig.options?.priceScaleId;
                      if (
                        priceScaleId &&
                        priceScaleId !== "right" &&
                        priceScaleId !== "left" &&
                        chartConfig.chart?.overlayPriceScales?.[priceScaleId]
                      ) {
                        const scaleConfig =
                          chartConfig.chart.overlayPriceScales[priceScaleId];
                        try {
                          const priceScale = series.priceScale();
                          if (priceScale) {
                            priceScale.applyOptions(
                              cleanLineStyleOptions(
                                scaleConfig as Record<string, unknown>,
                              ),
                            );
                          }
                        } catch (error) {
                          logger.error(
                            `Failed to apply overlay price scale configuration for '${priceScaleId}'`,
                            "LightweightCharts",
                            error,
                          );
                        }
                      }

                      // Series legends are now handled directly in seriesFactory.ts

                      // The series factory already created trade markers, merged
                      // with any user markers, and queued rectangles. Attach
                      // those rectangles only. A second marker pass would
                      // replace the user markers.
                      const tradeRectangles =
                        seriesConfig.trades &&
                        seriesConfig.tradeVisualizationOptions
                          ? claimPendingTradeRectangles(chart, series)
                          : [];

                      if (tradeRectangles.length > 0) {
                        try {
                          setTimeout(() => {
                            void (async () => {
                              try {
                                await ChartReadyDetector.waitForChartReadyForPrimitives(
                                  chart,
                                  series,
                                  {
                                    maxAttempts: 100,
                                    baseDelay: 100,
                                    requireData: true,
                                  },
                                );
                              } catch (error) {
                                logger.error(
                                  "Error waiting for chart before trade rectangles",
                                  "LightweightCharts",
                                  error,
                                );
                              }
                              attachTradeRectangles(series, tradeRectangles);
                            })();
                          }, 50);
                        } catch (error) {
                          logger.error(
                            "Error setting up trade visualization",
                            "LightweightCharts",
                            error,
                          );
                        }
                      }

                      // Add series-level annotations
                      if (seriesConfig.annotations) {
                        functionRefs.current.addAnnotations?.(
                          chart,
                          seriesConfig.annotations,
                        );
                      }
                    } else {
                      logger.error(
                        "Failed to create series - createSeriesWithConfig returned null",
                        "LightweightCharts",
                      );
                    }
                  } catch (error) {
                    logger.error(
                      "Error creating series",
                      "LightweightCharts",
                      error,
                    );
                  }
                },
              );
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
              let allPanes: IPaneApi<Time>[] = [];
              if (chart && typeof chart.panes === "function") {
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
                      logger.error(
                        "Failed to set stretch factor for pane",
                        "ChartInit",
                        error,
                      );
                    }
                  } else {
                    logger.info(
                      `Skipping pane ${paneId} - out of range or no factor`,
                      "ChartInit",
                    );
                  }
                },
              );
            }

            // Add modular tooltip system
            functionRefs.current.addModularTooltip?.(
              chart,
              container,
              seriesList,
              chartConfig,
            );

            // Store chart config for trade visualization when chart is ready
            chartConfigs.current[chartId] = chartConfig;

            // Add chart-level annotations
            if (chartConfig.annotations) {
              functionRefs.current.addAnnotations?.(
                chart,
                chartConfig.annotations,
              );
            }

            // Add annotation layers
            if (chartConfig.annotationLayers) {
              functionRefs.current.addAnnotationLayers?.(
                chart,
                chartConfig.annotationLayers,
              );
            }

            // Add price lines
            if (chartConfig.priceLines && seriesList.length > 0) {
              chartConfig.priceLines.forEach(
                (priceLine: Record<string, unknown>) => {
                  seriesList[0].createPriceLine(
                    priceLine as unknown as Parameters<
                      (typeof seriesList)[0]["createPriceLine"]
                    >[0],
                  );
                },
              );
            }

            // Add range switcher if configured
            if (
              chartConfig.chart?.rangeSwitcher &&
              chartConfig.chart.rangeSwitcher.visible
            ) {
              const rangeSwitcherConfig = chartConfig.chart.rangeSwitcher;
              // Wait for chart to be ready before adding range switcher
              void ChartReadyDetector.waitForChartReady(
                chart,
                chart.chartElement(),
                {
                  minWidth: 200,
                  minHeight: 100,
                },
              )
                .then(async (isReady) => {
                  if (isReady) {
                    await functionRefs.current.addRangeSwitcher?.(
                      chart,
                      rangeSwitcherConfig,
                    );
                  }
                })
                .catch((error) => {
                  logger.error(
                    "Failed to add range switcher",
                    "LightweightCharts",
                    error,
                  );
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
              .then((isReady) => {
                if (
                  isReady &&
                  chart &&
                  !isDisposingRef.current &&
                  chartRefs.current[chartId]
                ) {
                  try {
                    // Create legends for each series after chart is ready
                    const currentChartId =
                      chart.chartElement()?.id || `chart-${Date.now()}`;
                    const primitiveManager = ChartPrimitiveManager.getInstance(
                      chart,
                      currentChartId,
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
                            series,
                          );
                        } catch {
                          logger.error(
                            "An error occurred",
                            "LightweightCharts",
                          );
                        }
                      }
                    });

                    // Initial fitContent is now handled by handleDataLoaded function with proper tracking
                  } catch {
                    // Error during chart initialization
                  }
                }
              })
              .catch(() => {
                // Chart readiness detection failed, skip legend setup
              });
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
              if (
                config.syncConfig.groups &&
                config.syncConfig.groups[chartGroupId]
              ) {
                syncConfig = config.syncConfig.groups[chartGroupId];
              }

              functionRefs.current.setupChartSynchronization?.(
                chart,
                chartId,
                syncConfig,
                chartGroupId,
              );
            }

            // Setup fitContent functionality
            functionRefs.current.setupFitContent?.(chart, chartConfig);

            // Create individual pane containers and add collapse functionality (synchronous like working version)
            const paneCollapseConfig = chartConfig.paneCollapse || {
              enabled: true,
            };

            // Enable the series settings button by default
            if (paneCollapseConfig.showSeriesSettingsButton === undefined) {
              paneCollapseConfig.showSeriesSettingsButton = true;
            }

            // Debug logging
            if (paneCollapseConfig.enabled !== false) {
              try {
                // Get all panes and wrap each in its own collapsible container
                let allPanes: IPaneApi<Time>[] = [];
                if (chart && typeof chart.panes === "function") {
                  try {
                    allPanes = chart.panes();
                  } catch (error) {
                    // chart.panes() failed, use empty array
                    logger.error("Failed to get panes", "ButtonPanel", error);
                    allPanes = [];
                  }
                } else {
                  logger.error(
                    "Chart or chart.panes() is not available",
                    "ButtonPanel",
                  );
                }

                // Always set up crosshair subscription for legend value updates
                // This is needed for $$value$$ placeholders regardless of pane count
                chart.subscribeCrosshairMove((param) => {
                  try {
                    const primitiveManager = ChartPrimitiveManager.getInstance(
                      chart,
                      chartId,
                    );

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
                        seriesData: param.seriesData as Map<
                          ExtendedSeriesApi,
                          SeriesDataPoint
                        >,
                      });
                    }
                  } catch {
                    logger.error("An error occurred", "LightweightCharts");
                  }
                });

                // Show button panels when there are multiple panes (for collapse) or when series settings button is enabled
                if (
                  allPanes.length > 1 ||
                  paneCollapseConfig.showSeriesSettingsButton
                ) {
                  // Set up pane collapse support using ChartPrimitiveManager
                  try {
                    const primitiveManager = ChartPrimitiveManager.getInstance(
                      chart,
                      chartId,
                    ); // Create button panels (gear + collapse buttons) for each pane using primitive manager
                    for (const [paneId, _pane] of allPanes.entries()) {
                      // Configure button panel based on pane count
                      const buttonConfig = {
                        ...paneCollapseConfig,
                        showCollapseButton: false, // TODO: Hidden until collapse functionality is fully implemented
                        showSeriesSettingsButton:
                          paneCollapseConfig.showSeriesSettingsButton, // Always respect series settings button setting
                      }; // Add button panel using primitive manager
                      const buttonPanelWidget = primitiveManager.addButtonPanel(
                        paneId,
                        buttonConfig,
                      ); // Store widget reference for cleanup
                      if (!window.paneButtonPanelWidgets) {
                        window.paneButtonPanelWidgets = {};
                      }
                      if (!window.paneButtonPanelWidgets[chartId]) {
                        window.paneButtonPanelWidgets[chartId] = [];
                      }
                      window.paneButtonPanelWidgets[chartId].push(
                        buttonPanelWidget,
                      );
                    }
                  } catch (error) {
                    logger.error(
                      "Button panel creation failed at step",
                      "ButtonPanel",
                      error,
                    );
                    logger.error(
                      "Error details: " +
                        (error instanceof Error
                          ? error.message
                          : String(error)),
                      "ButtonPanel",
                    );
                    logger.error(
                      "Error stack: " +
                        (error instanceof Error ? error.stack : String(error)),
                      "ButtonPanel",
                    );
                  }
                }
              } catch (error) {
                logger.error(
                  "Pane collapse setup failed",
                  "ButtonPanel",
                  error,
                );
              }
            }

            // Initial fitContent is now handled by handleDataLoaded function with proper tracking
            // to prevent multiple calls. This redundant delayed fitContent has been removed.
          } catch {
            logger.error("An error occurred", "LightweightCharts");
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
      [processedChartConfigs, config?.syncConfig, width, height, onChartsReady],
    );

    // Update function references to avoid dependency issues
    useEffect(() => {
      functionRefs.current = {
        addAnnotations,
        addModularTooltip,
        addAnnotationLayers,
        addRangeSwitcher,
        addLegend,
        updateLegendPositions,
        setupChartSynchronization,
        setupFitContent,
        setupPaneCollapseSupport,
        cleanupCharts,
      };
    }, [
      addAnnotations,
      addModularTooltip,
      addAnnotationLayers,
      addRangeSwitcher,
      addLegend,
      updateLegendPositions,
      setupChartSynchronization,
      setupFitContent,
      setupPaneCollapseSupport,
      cleanupCharts,
    ]);

    // Python-side change detection: Simply trust the forceReinit flag
    // Python handles ALL change detection - frontend just obeys the flag
    useEffect(() => {
      if (
        deferredConfig &&
        deferredConfig.charts &&
        deferredConfig.charts.length > 0
      ) {
        const forceReinit = (deferredConfig as any).forceReinit === true;
        const isFirstRender = !isInitializedRef.current;

        if (isFirstRender) {
          initializeCharts(true);
        } else if (forceReinit) {
          cleanupCharts();
          isInitializedRef.current = false;
          initializeCharts(true);
        }
      }
    }, [deferredConfig, initializeCharts, cleanupCharts]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        cleanupCharts();
      };
    }, [cleanupCharts]);

    // React 18: Use deferredConfig for rendering optimizations
    const chartContainers = useMemo(() => {
      if (
        !deferredConfig ||
        !deferredConfig.charts ||
        deferredConfig.charts.length === 0
      ) {
        return [];
      }

      return deferredConfig.charts.map((chartConfig, index) => {
        const chartId = chartConfig.chartId || `chart-${index}`;
        const containerId = `chart-container-${chartId}`;

        // Determine container styling based on auto-sizing options
        const sizing = resolveLegacySizing(chartConfig);
        const shouldAutoSize = !!(
          sizing.autoSize ||
          sizing.autoWidth ||
          sizing.autoHeight
        );
        const chartOptions = chartConfig.chart || {};

        // Use optimized style creation with memoization
        const styles = createOptimizedStylesAdvanced(
          width,
          height,
          shouldAutoSize,
          chartOptions,
        );
        const pinnedSize = pinnedContainerSize(sizing, {
          width: chartOptions.width || width,
          height: chartOptions.height || height,
        });
        const containerStyle = {
          ...styles.container,
          ...pinnedSize,
          minWidth:
            chartOptions.minWidth ||
            chartConfig.minWidth ||
            (shouldAutoSize ? 200 : undefined),
          minHeight:
            chartOptions.minHeight ||
            chartConfig.minHeight ||
            (shouldAutoSize ? 200 : undefined),
          maxWidth: chartOptions.maxWidth || chartConfig.maxWidth,
          maxHeight: chartOptions.maxHeight || chartConfig.maxHeight,
        };

        const chartContainerStyle = { ...styles.chartContainer, ...pinnedSize };

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
          // Y in pane-X-series-Y is the index within that pane.
          const chartSeries = seriesRefs.current[chartId] || [];
          const paneCounters = new Map<string, number>();
          const targetPane = normalizedPaneId(paneId);

          chartSeries.forEach((series) => {
            const tagged = series as ExtendedSeriesApi;
            const seriesPane = normalizedPaneId(tagged.paneId);
            if (seriesPane !== targetPane) {
              return;
            }
            const perPaneIndex = paneCounters.get(seriesPane) ?? 0;
            paneCounters.set(seriesPane, perPaneIndex + 1);
            const expectedSeriesId = paneSeriesId(seriesPane, perPaneIndex);

            if (seriesId === expectedSeriesId || tagged.seriesId === seriesId) {
              // Apply the configuration changes to the series
              // Get series type from configPatch (added by plugin)
              const seriesType = (configPatch as any)._seriesType || "line";

              // Remove _seriesType from patch before conversion (internal metadata)
              const { _seriesType, ...cleanConfigPatch } = configPatch as any;

              // Use property mapper to convert dialog config to API options
              const apiConfig = dialogConfigToApiOptions(
                seriesType,
                cleanConfigPatch,
              );

              // Apply the options to the series
              if (Object.keys(apiConfig).length > 0) {
                series.applyOptions(apiConfig);
              }
            }
          });
        } catch (error) {
          logger.error("Error applying config change", "SeriesConfig", error);
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
          logger.error(
            "Chart rendering error: " + String(errorInfo),
            "ErrorBoundary",
            error,
          );
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            opacity: isPending ? 0.7 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          {chartContainers}
        </div>
      </ErrorBoundary>
    );

    return chartContent;
  },
);

export default LightweightCharts;
