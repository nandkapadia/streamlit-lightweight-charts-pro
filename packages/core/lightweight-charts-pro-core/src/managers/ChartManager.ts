/**
 * @fileoverview Chart Manager - Framework-agnostic chart lifecycle management
 *
 * Pure TypeScript class that manages the lifecycle and rendering of TradingView charts.
 * No React dependencies - can be used with any framework or vanilla JS.
 *
 * @example
 * ```typescript
 * const manager = new ChartManager({
 *   containerId: 'chart-container',
 *   chartId: 'chart-1',
 *   chartConfig: config,
 *   onChartReady: (chart, id) => console.log('Chart ready:', id),
 *   onError: (error, id) => console.error('Chart error:', error)
 * });
 *
 * // Later cleanup
 * manager.destroy();
 * ```
 */

import { createChart, IChartApi, DeepPartial, ChartOptions } from 'lightweight-charts';
import { logger } from '../utils/logger';

export interface ChartManagerConfig {
  /** ID of the container DOM element */
  containerId: string;
  /** Unique ID for this chart instance */
  chartId: string;
  /** Chart configuration options */
  chartConfig: DeepPartial<ChartOptions>;
  /** Optional width in pixels */
  width?: number | null;
  /** Optional height in pixels */
  height?: number | null;
  /** Callback when chart is ready */
  onChartReady?: (chart: IChartApi, chartId: string) => void;
  /** Callback when error occurs */
  onError?: (error: Error, chartId: string) => void;
}

/**
 * ChartManager - Framework-agnostic chart lifecycle manager
 */
export class ChartManager {
  private chart: IChartApi | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private config: ChartManagerConfig;
  private isInitialized: boolean = false;

  constructor(config: ChartManagerConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    try {
      this.container = document.getElementById(this.config.containerId);
      if (!this.container) {
        throw new Error(`Container element with ID "${this.config.containerId}" not found`);
      }

      const chartOptions = this.createChartOptions();
      this.chart = createChart(this.container, chartOptions);
      this.isInitialized = true;

      this.setupResizeObserver();

      if (this.config.onChartReady) {
        this.config.onChartReady(this.chart, this.config.chartId);
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private createChartOptions(): DeepPartial<ChartOptions> {
    const { chartConfig, width, height } = this.config;
    return {
      width: typeof chartConfig.chart?.width === 'number' ? chartConfig.chart.width : width || undefined,
      height: typeof chartConfig.chart?.height === 'number' ? chartConfig.chart.height : chartConfig.chart?.height || height || undefined,
      ...chartConfig.chart,
    };
  }

  private setupResizeObserver(): void {
    if (!this.container) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });

    this.resizeObserver.observe(this.container);
  }

  private handleResize(): void {
    if (this.chart && this.container) {
      const { clientWidth, clientHeight } = this.container;
      try {
        this.chart.resize(clientWidth, clientHeight);
      } catch (error) {
        logger.error('Failed to resize chart', 'ChartManager', error);
      }
    }
  }

  private handleError(error: Error): void {
    logger.error('Chart error', 'ChartManager', error);
    if (this.config.onError) {
      this.config.onError(error, this.config.chartId);
    }
  }

  public getChart(): IChartApi | null {
    return this.chart;
  }

  public getChartId(): string {
    return this.config.chartId;
  }

  public isReady(): boolean {
    return this.isInitialized && this.chart !== null;
  }

  public updateConfig(updates: Partial<ChartManagerConfig>): void {
    this.config = { ...this.config, ...updates };

    if (this.chart && updates.chartConfig) {
      const chartOptions = this.createChartOptions();
      this.chart.applyOptions(chartOptions);
    }
  }

  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.chart) {
      try {
        this.chart.remove();
      } catch (error) {
        logger.error('Failed to remove chart during cleanup', 'ChartManager', error);
      }
      this.chart = null;
    }

    this.container = null;
    this.isInitialized = false;
  }
}
