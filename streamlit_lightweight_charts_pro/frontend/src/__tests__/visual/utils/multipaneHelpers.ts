/**
 * Multi-Pane Helper Utilities for Visual Tests
 *
 * Provides utilities for creating and managing multi-pane chart configurations
 * in visual regression tests.
 *
 * Note: LightweightCharts v5 handles panes automatically when you add series
 * with a pane option. The first series (pane: 0) is in the main pane, and
 * additional series with pane: 1, 2, etc. create new panes automatically.
 *
 * @module visual/utils/multipaneHelpers
 */

import {
  IChartApi,
  ISeriesApi,
  SeriesOptionsMap,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  BarSeries,
  BaselineSeries,
} from 'lightweight-charts';

/**
 * Configuration for a pane in a multi-pane chart
 */
export interface PaneConfig {
  /**
   * Pane index (0 = first/main pane, 1 = second pane, etc.)
   */
  paneId: number;

  /**
   * Optional height for this pane (in pixels or percentage)
   * If not specified, panes will have equal heights
   */
  height?: number;

  /**
   * Series to add to this pane
   */
  series?: SeriesConfig[];
}

/**
 * Configuration for a series within a pane
 */
export interface SeriesConfig {
  /**
   * Series type ('Candlestick', 'Line', 'Area', 'Histogram', 'Bar', 'Baseline', etc.)
   */
  type: keyof SeriesOptionsMap;

  /**
   * Data for the series
   */
  data: any[];

  /**
   * Options for the series
   */
  options?: Partial<SeriesOptionsMap[keyof SeriesOptionsMap]>;
}

/**
 * Result from creating a multi-pane chart
 */
export interface MultiPaneChartResult {
  /**
   * The chart instance
   */
  chart: IChartApi;

  /**
   * Series organized by pane ID
   */
  seriesByPane: Map<number, ISeriesApi<keyof SeriesOptionsMap>[]>;

  /**
   * All series in a flat array
   */
  allSeries: ISeriesApi<keyof SeriesOptionsMap>[];
}

/**
 * Helper to add a series to a specific pane
 *
 * This function adds a series to the chart with the correct pane option.
 * LightweightCharts v5 automatically creates panes as needed.
 *
 * @param chart - Chart instance
 * @param paneId - Pane index (0, 1, 2, etc.)
 * @param seriesType - Type of series to create
 * @param data - Data for the series
 * @param options - Additional series options
 * @returns The created series instance
 *
 * @example
 * ```typescript
 * // Add a candlestick series to pane 0 (main pane)
 * const priceSeries = addSeriesToPane(chart, 0, 'Candlestick', priceData);
 *
 * // Add a histogram series to pane 1 (volume pane)
 * const volumeSeries = addSeriesToPane(chart, 1, 'Histogram', volumeData, {
 *   color: '#26a69a'
 * });
 * ```
 */
export function addSeriesToPane<T extends keyof SeriesOptionsMap>(
  chart: IChartApi,
  paneId: number,
  seriesType: T,
  data: any[],
  options?: Partial<SeriesOptionsMap[T]>
): ISeriesApi<T> {
  // In LightweightCharts v5, series are added using chart.addSeries(SeriesDefinition, options, paneIndex)
  // The paneIndex parameter specifies which pane to add the series to

  let series: ISeriesApi<T>;

  switch (seriesType) {
    case 'Candlestick':
      series = chart.addSeries(CandlestickSeries, options as any, paneId) as ISeriesApi<T>;
      break;
    case 'Line':
      series = chart.addSeries(LineSeries, options as any, paneId) as ISeriesApi<T>;
      break;
    case 'Area':
      series = chart.addSeries(AreaSeries, options as any, paneId) as ISeriesApi<T>;
      break;
    case 'Histogram':
      series = chart.addSeries(HistogramSeries, options as any, paneId) as ISeriesApi<T>;
      break;
    case 'Bar':
      series = chart.addSeries(BarSeries, options as any, paneId) as ISeriesApi<T>;
      break;
    case 'Baseline':
      series = chart.addSeries(BaselineSeries, options as any, paneId) as ISeriesApi<T>;
      break;
    default:
      throw new Error(`Unsupported series type: ${seriesType}`);
  }

  // Set data
  if (data && data.length > 0) {
    series.setData(data);
  }

  return series;
}

/**
 * Create a multi-pane chart with configured series
 *
 * This is a convenience function that creates multiple panes and series
 * in a single call. It handles pane creation automatically by adding series
 * with the appropriate pane option.
 *
 * Note: LightweightCharts v5 creates panes automatically when you add series
 * with a pane option. You don't need to explicitly create panes. However,
 * panes created this way default to height 0 and need to be resized.
 *
 * @param chart - Chart instance (already created via renderChart)
 * @param panes - Array of pane configurations
 * @returns Object containing chart, series by pane, and all series
 *
 * @example
 * ```typescript
 * const result = await renderChart(chart => {
 *   setupMultiPaneChart(chart, [
 *     {
 *       paneId: 0,
 *       height: 300,
 *       series: [{
 *         type: 'Candlestick',
 *         data: generateCandlestickData(30),
 *         options: { upColor: '#26a69a', downColor: '#ef5350' }
 *       }]
 *     },
 *     {
 *       paneId: 1,
 *       height: 100,
 *       series: [{
 *         type: 'Histogram',
 *         data: generateHistogramData(30),
 *         options: { color: '#26a69a' }
 *       }]
 *     }
 *   ]);
 * });
 * ```
 */
export function setupMultiPaneChart(
  chart: IChartApi,
  panes: PaneConfig[]
): MultiPaneChartResult {
  const seriesByPane = new Map<number, ISeriesApi<keyof SeriesOptionsMap>[]>();
  const allSeries: ISeriesApi<keyof SeriesOptionsMap>[] = [];

  // Sort panes by paneId to ensure correct order
  const sortedPanes = [...panes].sort((a, b) => a.paneId - b.paneId);

  // Add series for each pane
  for (const pane of sortedPanes) {
    const paneSeries: ISeriesApi<keyof SeriesOptionsMap>[] = [];

    if (pane.series && pane.series.length > 0) {
      for (const seriesConfig of pane.series) {
        const series = addSeriesToPane(
          chart,
          pane.paneId,
          seriesConfig.type,
          seriesConfig.data,
          seriesConfig.options
        );

        paneSeries.push(series);
        allSeries.push(series);
      }
    }

    seriesByPane.set(pane.paneId, paneSeries);
  }

  // Set pane heights after all panes are created
  // If no explicit heights are provided, distribute equally
  const chartPanes = chart.panes();
  const totalPanes = sortedPanes.length;

  console.log('[setupMultiPaneChart] Total panes:', totalPanes);
  console.log('[setupMultiPaneChart] Chart panes count:', chartPanes.length);

  if (totalPanes > 1) {
    // Check if any pane has an explicit height
    const hasExplicitHeights = sortedPanes.some(p => p.height !== undefined);

    console.log('[setupMultiPaneChart] Has explicit heights:', hasExplicitHeights);

    if (hasExplicitHeights) {
      // Set explicit heights where provided
      for (const paneConfig of sortedPanes) {
        if (paneConfig.height !== undefined) {
          const paneApi = chartPanes[paneConfig.paneId];
          if (paneApi) {
            console.log(`[setupMultiPaneChart] Setting pane ${paneConfig.paneId} height to ${paneConfig.height}`);
            paneApi.setHeight(paneConfig.height);
          }
        }
      }
    } else {
      // Equal distribution - divide available space equally
      // LightweightCharts uses stretch factors for equal distribution
      // For now, let's use setHeight to ensure visibility

      // Get total chart height and time axis height
      const chartSize = chart.paneSize(0);
      console.log('[setupMultiPaneChart] Chart size:', chartSize);
      const chartHeight = chartSize.height;

      // Distribute height equally among panes
      // Reserve some space for the time axis (~28px)
      const timeAxisHeight = 28;
      const availableHeight = chartHeight - timeAxisHeight;
      const paneHeight = Math.floor(availableHeight / totalPanes);

      console.log('[setupMultiPaneChart] Chart height:', chartHeight);
      console.log('[setupMultiPaneChart] Available height:', availableHeight);
      console.log('[setupMultiPaneChart] Pane height:', paneHeight);

      for (let i = 0; i < chartPanes.length; i++) {
        console.log(`[setupMultiPaneChart] Setting pane ${i} height to ${paneHeight}`);
        chartPanes[i].setHeight(paneHeight);
        console.log(`[setupMultiPaneChart] Pane ${i} height after set:`, chartPanes[i].getHeight());
      }

      // Try to force layout update with resize
      chart.resize(chartSize.width, chartHeight, true);
      console.log('[setupMultiPaneChart] After resize():');
      for (let i = 0; i < chartPanes.length; i++) {
        console.log(`[setupMultiPaneChart] Pane ${i} height after resize:`, chartPanes[i].getHeight());
      }

      // Also try fitContent
      chart.timeScale().fitContent();
      console.log('[setupMultiPaneChart] After fitContent():');
      for (let i = 0; i < chartPanes.length; i++) {
        console.log(`[setupMultiPaneChart] Pane ${i} height after fitContent:`, chartPanes[i].getHeight());
      }
    }
  }

  return {
    chart,
    seriesByPane,
    allSeries,
  };
}

/**
 * Get the first series in a specific pane
 *
 * Convenience function to quickly access a pane's primary series.
 *
 * @param result - Result from setupMultiPaneChart
 * @param paneId - Pane ID to get series from
 * @returns First series in the pane, or undefined if pane is empty
 */
export function getSeriesForPane(
  result: MultiPaneChartResult,
  paneId: number
): ISeriesApi<keyof SeriesOptionsMap> | undefined {
  const paneSeries = result.seriesByPane.get(paneId);
  return paneSeries && paneSeries.length > 0 ? paneSeries[0] : undefined;
}

/**
 * Get all series in a specific pane
 *
 * @param result - Result from setupMultiPaneChart
 * @param paneId - Pane ID to get series from
 * @returns Array of series in the pane (empty array if pane doesn't exist)
 */
export function getAllSeriesForPane(
  result: MultiPaneChartResult,
  paneId: number
): ISeriesApi<keyof SeriesOptionsMap>[] {
  return result.seriesByPane.get(paneId) || [];
}
