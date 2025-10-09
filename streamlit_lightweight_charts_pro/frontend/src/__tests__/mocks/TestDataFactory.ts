/**
 * @fileoverview Centralized test data factory system following DRY principles
 *
 * This module provides a unified interface for generating all types of test data
 * used across the test suite, ensuring consistency and maintainability.
 */

import {
  ChartOptions,
  SeriesType,
  LineData,
  CandlestickData,
  HistogramData,
  AreaData,
  BaselineData,
  Time,
} from 'lightweight-charts';
import { ChartConfig } from '../../types';
import { SeriesType as AppSeriesType } from '../../types/SeriesTypes';

// Define missing types for testing
export interface SeriesConfiguration {
  type: AppSeriesType;
  name: string;
  options: Record<string, unknown>;
}

export interface SeriesInfo {
  id: string;
  type: AppSeriesType;
  name: string;
  visible: boolean;
  options: Record<string, unknown>;
  priceScaleId?: string;
}

// Base test data configuration interface
export interface TestDataConfig {
  seed?: number;
  count?: number;
  startTime?: number;
  timeInterval?: number;
  basePrice?: number;
  volatility?: number;
  trend?: 'up' | 'down' | 'sideways';
  includeGaps?: boolean;
  customBehavior?: Record<string, unknown>;
}

// Time series data generation utilities
export class TimeSeriesGenerator {
  private static seededRandom(seed: number): () => number {
    let state = seed;
    return function () {
      const x = Math.sin(state++) * 10000;
      return x - Math.floor(x);
    };
  }

  /**
   * Generate realistic timestamps with configurable intervals
   */
  static generateTimestamps(config: TestDataConfig = {}): number[] {
    const {
      count = 100,
      startTime = Date.now() - count * 24 * 60 * 60 * 1000, // Start 'count' days ago
      timeInterval = 24 * 60 * 60 * 1000, // 1 day default
      includeGaps = false,
    } = config;

    const timestamps: number[] = [];
    let currentTime = startTime;

    for (let i = 0; i < count; i++) {
      timestamps.push(currentTime);

      // Add gaps randomly if enabled
      if (includeGaps && Math.random() < 0.05) {
        currentTime += timeInterval * (2 + Math.floor(Math.random() * 3)); // Skip 2-4 intervals
      } else {
        currentTime += timeInterval;
      }
    }

    return timestamps;
  }

  /**
   * Generate realistic price movements with volatility and trends
   */
  static generatePriceData(config: TestDataConfig = {}): number[] {
    const {
      count = 100,
      basePrice = 100,
      volatility = 0.02,
      trend = 'sideways',
      seed = 12345,
    } = config;

    const random = this.seededRandom(seed);
    const prices: number[] = [];
    let currentPrice = basePrice;

    const trendMultiplier = trend === 'up' ? 0.0005 : trend === 'down' ? -0.0005 : 0;

    for (let i = 0; i < count; i++) {
      // Add trend
      currentPrice += currentPrice * trendMultiplier;

      // Add volatility
      const change = (random() - 0.5) * 2 * volatility;
      currentPrice *= 1 + change;

      // Ensure price stays positive
      currentPrice = Math.max(currentPrice, 0.01);

      prices.push(currentPrice);
    }

    return prices;
  }

  /**
   * Generate OHLC data for candlestick charts
   */
  static generateOHLCData(
    basePrice: number,
    volatility: number = 0.01,
    seed: number = 12345
  ): { open: number; high: number; low: number; close: number } {
    const random = this.seededRandom(seed + Math.floor(Math.random() * 1000));

    const open = basePrice;
    const change = (random() - 0.5) * 2 * volatility;
    const close = Math.max(open * (1 + change), 0.01);

    const high = Math.max(open, close) * (1 + random() * volatility);
    const low = Math.min(open, close) * (1 - random() * volatility);

    return { open, high, low, close };
  }
}

/**
 * Centralized Test Data Factory
 *
 * Provides consistent test data generation with configurable behavior,
 * realistic data patterns, and performance optimization capabilities.
 */
export class TestDataFactory {
  private static defaultConfig: TestDataConfig = {
    seed: 12345,
    count: 100,
    timeInterval: 24 * 60 * 60 * 1000, // 1 day
    basePrice: 100,
    volatility: 0.02,
    trend: 'sideways',
    includeGaps: false,
    customBehavior: {},
  };

  /**
   * Configure default behavior for all test data generation
   */
  static configure(config: Partial<TestDataConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Generate line series data
   */
  static createLineData(config: TestDataConfig = {}): LineData[] {
    const finalConfig = { ...this.defaultConfig, ...config };
    const timestamps = TimeSeriesGenerator.generateTimestamps(finalConfig);
    const prices = TimeSeriesGenerator.generatePriceData(finalConfig);

    return timestamps.map((time, index) => ({
      time: Math.floor(time / 1000) as Time, // LightweightCharts expects seconds
      value: prices[index],
    }));
  }

  /**
   * Generate candlestick series data
   */
  static createCandlestickData(config: TestDataConfig = {}): CandlestickData[] {
    const finalConfig = { ...this.defaultConfig, ...config };
    const timestamps = TimeSeriesGenerator.generateTimestamps(finalConfig);
    const prices = TimeSeriesGenerator.generatePriceData(finalConfig);

    return timestamps.map((time, index) => {
      const basePrice = prices[index];
      const ohlc = TimeSeriesGenerator.generateOHLCData(
        basePrice,
        finalConfig.volatility,
        finalConfig.seed! + index
      );

      return {
        time: Math.floor(time / 1000) as Time,
        open: ohlc.open,
        high: ohlc.high,
        low: ohlc.low,
        close: ohlc.close,
      };
    });
  }

  /**
   * Generate histogram series data
   */
  static createHistogramData(config: TestDataConfig = {}): HistogramData[] {
    const finalConfig = { ...this.defaultConfig, ...config };
    const timestamps = TimeSeriesGenerator.generateTimestamps(finalConfig);
    const prices = TimeSeriesGenerator.generatePriceData(finalConfig);

    return timestamps.map((time, index) => ({
      time: Math.floor(time / 1000) as Time,
      value: prices[index],
      color: prices[index] > finalConfig.basePrice! ? '#4CAF50' : '#F44336',
    }));
  }

  /**
   * Generate area series data
   */
  static createAreaData(config: TestDataConfig = {}): AreaData<Time>[] {
    const finalConfig = { ...this.defaultConfig, ...config };
    const timestamps = TimeSeriesGenerator.generateTimestamps(finalConfig);
    const prices = TimeSeriesGenerator.generatePriceData(finalConfig);

    return timestamps.map((time, index) => ({
      time: Math.floor(time / 1000) as Time,
      value: prices[index],
    }));
  }

  /**
   * Generate baseline series data
   */
  static createBaselineData(config: TestDataConfig = {}): BaselineData<Time>[] {
    const finalConfig = { ...this.defaultConfig, ...config };
    const timestamps = TimeSeriesGenerator.generateTimestamps(finalConfig);
    const prices = TimeSeriesGenerator.generatePriceData(finalConfig);

    return timestamps.map((time, index) => ({
      time: Math.floor(time / 1000) as Time,
      value: prices[index],
    }));
  }

  /**
   * Generate bar series data (alias for histogram data)
   */
  static createBarData(config: TestDataConfig = {}): HistogramData[] {
    return this.createHistogramData(config);
  }

  /**
   * Generate chart options for testing
   */
  static createChartOptions(config: Partial<ChartOptions> = {}): ChartOptions {
    // @ts-expect-error - Complex ChartOptions type compatibility
    return {
      width: 800,
      height: 600,
      layout: {
        background: { color: '#ffffff' } as any, // Use any to bypass strict color type checking
        textColor: '#333',
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        panes: {
          enableResize: true,
          separatorColor: '#E0E0E0',
          separatorHoverColor: '#BDBDBD',
        } as any,
        attributionLogo: false,
        colorSpace: 'srgb',
        colorParsers: {} as any,
      },
      grid: {
        vertLines: { color: '#f0f0f0', style: 0, visible: true },
        horzLines: { color: '#f0f0f0', style: 0, visible: true },
      },
      crosshair: {
        mode: 0, // Normal
        vertLine: {
          color: '#758696',
          width: 1,
          style: 0,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: '#ffffff',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 0,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: '#ffffff',
        },
      },
      rightPriceScale: {
        autoScale: true,
        mode: 0,
        invertScale: false,
        alignLabels: true,
        scaleMargins: { top: 0.1, bottom: 0.1 },
        borderVisible: true,
        borderColor: '#cccccc',
        visible: true,
        entireTextOnly: false,
        ticksVisible: true,
        minimumWidth: 50,
        ensureEdgeTickMarksVisible: false,
      },
      timeScale: {
        rightOffset: 0,
        barSpacing: 6,
        minBarSpacing: 0.5,
        maxBarSpacing: 50,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        rightBarStaysOnScroll: false,
        borderVisible: true,
        borderColor: '#cccccc',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
        shiftVisibleRangeOnNewBar: true,
        allowShiftVisibleRangeOnWhitespaceReplacement: false,
        ticksVisible: true,
        uniformDistribution: false,
        minimumHeight: 50,
        allowBoldLabels: true,
        ignoreWhitespaceIndices: false,
      },
      ...config,
    };
  }

  /**
   * Generate ChartConfig for app-specific testing
   */
  static createChartConfig(config: Partial<ChartConfig> = {}): ChartConfig {
    return {
      chart: {
        width: 800,
        height: 600,
        layout: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
        grid: {
          vertLines: { color: '#f0f0f0', style: 0, visible: true },
          horzLines: { color: '#f0f0f0', style: 0, visible: true },
        },
        crosshair: {
          mode: 0,
        },
        rightPriceScale: {
          borderColor: '#cccccc',
          autoScale: true,
        },
        timeScale: {
          rightOffset: 5,
        },
      },
      series: [],
      autoSize: true,
      ...config,
    };
  }

  /**
   * Generate SeriesConfiguration for testing
   */
  static createSeriesConfiguration(
    seriesType: AppSeriesType = 'line',
    config: Partial<SeriesConfiguration> = {}
  ): SeriesConfiguration {
    const baseConfigs = {
      line: {
        type: 'line' as AppSeriesType,
        name: 'Test Line Series',
        options: {
          color: '#2196F3',
          lineWidth: 2,
          lineType: 0, // Simple
          lineStyle: 0, // Solid
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 3,
        },
      },
      area: {
        type: 'area' as AppSeriesType,
        name: 'Test Area Series',
        options: {
          topColor: 'rgba(33, 150, 243, 0.56)',
          bottomColor: 'rgba(33, 150, 243, 0.04)',
          lineColor: '#2196F3',
          lineWidth: 2,
          lineType: 0,
          lineStyle: 0,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 3,
        },
      },
      candlestick: {
        type: 'candlestick' as AppSeriesType,
        name: 'Test Candlestick Series',
        options: {
          upColor: '#4CAF50',
          downColor: '#F44336',
          borderUpColor: '#4CAF50',
          borderDownColor: '#F44336',
          wickUpColor: '#4CAF50',
          wickDownColor: '#F44336',
        },
      },
      histogram: {
        type: 'histogram' as AppSeriesType,
        name: 'Test Histogram Series',
        options: {
          color: '#2196F3',
          base: 0,
        },
      },
      baseline: {
        type: 'baseline' as AppSeriesType,
        name: 'Test Baseline Series',
        options: {
          baseValue: { type: 'price', price: 100 },
          topLineColor: '#4CAF50',
          bottomLineColor: '#F44336',
          topFillColor1: 'rgba(76, 175, 80, 0.28)',
          topFillColor2: 'rgba(76, 175, 80, 0.05)',
          bottomFillColor1: 'rgba(244, 67, 54, 0.28)',
          bottomFillColor2: 'rgba(244, 67, 54, 0.05)',
        },
      },
      bar: {
        type: 'histogram' as AppSeriesType, // Bar is essentially histogram in lightweight-charts
        name: 'Test Bar Series',
        options: {
          color: '#FF9800',
          base: 0,
        },
      },
      supertrend: {
        type: 'line' as AppSeriesType, // Supertrend is typically rendered as line
        name: 'Test Supertrend Series',
        options: {
          color: '#9C27B0',
          lineWidth: 2,
          lineType: 0,
          lineStyle: 0,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 3,
        },
      },
      bollinger_bands: {
        type: 'line' as AppSeriesType, // Bollinger bands are typically rendered as lines
        name: 'Test Bollinger Bands Series',
        options: {
          color: '#FF5722',
          lineWidth: 1,
          lineType: 0,
          lineStyle: 2, // Dashed style for bands
          crosshairMarkerVisible: false,
          crosshairMarkerRadius: 0,
        },
      },
      sma: {
        type: 'line' as AppSeriesType, // SMA is a line indicator
        name: 'Test SMA Series',
        options: {
          color: '#795548',
          lineWidth: 1,
          lineType: 0,
          lineStyle: 0,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 2,
        },
      },
      ema: {
        type: 'line' as AppSeriesType, // EMA is a line indicator
        name: 'Test EMA Series',
        options: {
          color: '#607D8B',
          lineWidth: 1,
          lineType: 0,
          lineStyle: 1, // Dotted style to distinguish from SMA
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 2,
        },
      },
      ribbon: {
        type: 'line' as AppSeriesType, // Ribbon is typically rendered as line
        name: 'Test Ribbon Series',
        options: {
          color: '#E91E63',
          lineWidth: 3,
          lineType: 0,
          lineStyle: 0,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 3,
        },
      },
      signal: {
        type: 'line' as AppSeriesType, // Signal is a custom series type
        name: 'Test Signal Series',
        options: {
          color: '#3F51B5',
          lineWidth: 1,
          lineType: 0,
          lineStyle: 0,
          crosshairMarkerVisible: false,
          crosshairMarkerRadius: 0,
        },
      },
      trend_fill: {
        type: 'area' as AppSeriesType, // Trend fill is typically rendered as area
        name: 'Test Trend Fill Series',
        options: {
          topColor: 'rgba(76, 175, 80, 0.4)',
          bottomColor: 'rgba(244, 67, 54, 0.4)',
          lineColor: '#4CAF50',
          lineWidth: 1,
          lineType: 0,
          lineStyle: 0,
          crosshairMarkerVisible: false,
          crosshairMarkerRadius: 0,
        },
      },
      gradient_ribbon: {
        type: 'line' as AppSeriesType, // Gradient ribbon is a custom series type
        name: 'Test Gradient Ribbon Series',
        options: {
          color: '#00BCD4',
          lineWidth: 2,
          lineType: 0,
          lineStyle: 0,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 3,
        },
      },
      band: {
        type: 'line' as AppSeriesType, // Band is a custom series type
        name: 'Test Band Series',
        options: {
          color: '#9C27B0',
          lineWidth: 1,
          lineType: 0,
          lineStyle: 0,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 2,
        },
      },
    };

    const baseConfig = baseConfigs[seriesType] || baseConfigs.line;

    return {
      ...baseConfig,
      ...config,
      options: {
        ...baseConfig.options,
        ...(config.options || {}),
      },
    } as SeriesConfiguration;
  }

  /**
   * Generate SeriesInfo for testing
   */
  static createSeriesInfo(
    seriesType: AppSeriesType = 'line',
    config: Partial<SeriesInfo> = {}
  ): SeriesInfo {
    return {
      id: `test-series-${Math.random().toString(36).substr(2, 9)}`,
      type: seriesType,
      name: `Test ${seriesType.charAt(0).toUpperCase() + seriesType.slice(1)} Series`,
      visible: true,
      options: {},
      priceScaleId: 'right',
      ...config,
    };
  }

  /**
   * Generate test data for specific series types
   */
  static createSeriesData(seriesType: SeriesType, config: TestDataConfig = {}): unknown[] {
    switch (seriesType) {
      case 'Line':
        return this.createLineData(config);
      case 'Area':
        return this.createAreaData(config);
      case 'Candlestick':
        return this.createCandlestickData(config);
      case 'Histogram':
        return this.createHistogramData(config);
      case 'Baseline':
        return this.createBaselineData(config);
      default:
        return this.createLineData(config);
    }
  }

  /**
   * Generate performance test datasets
   */
  static createPerformanceTestData(
    config: {
      seriesType?: SeriesType;
      dataPointCount?: number;
      seriesCount?: number;
    } = {}
  ): { seriesData: unknown[][]; chartOptions: ChartOptions } {
    const { seriesType = 'Line', dataPointCount = 1000, seriesCount = 5 } = config;

    const seriesData: unknown[][] = [];

    for (let i = 0; i < seriesCount; i++) {
      const data = this.createSeriesData(seriesType, {
        count: dataPointCount,
        seed: 12345 + i,
        basePrice: 100 + i * 10,
        volatility: 0.01 + i * 0.005,
      });
      seriesData.push(data);
    }

    return {
      seriesData,
      chartOptions: this.createChartOptions({
        width: 1200,
        height: 800,
      }),
    };
  }

  /**
   * Generate memory leak test scenarios
   */
  static createMemoryLeakTestData(
    config: {
      chartCount?: number;
      seriesPerChart?: number;
      dataPointsPerSeries?: number;
    } = {}
  ) {
    const { chartCount = 10, seriesPerChart = 3, dataPointsPerSeries = 500 } = config;

    const testScenarios = [];

    for (let chartIndex = 0; chartIndex < chartCount; chartIndex++) {
      const chartData = {
        chartId: `memory-test-chart-${chartIndex}`,
        options: this.createChartOptions({
          width: 400 + chartIndex * 50,
          height: 300 + chartIndex * 30,
        }),
        series: [] as Array<{
          type: SeriesType;
          data: unknown[];
          configuration: SeriesConfiguration;
        }>,
      };

      for (let seriesIndex = 0; seriesIndex < seriesPerChart; seriesIndex++) {
        const seriesTypes: SeriesType[] = ['Line', 'Area', 'Candlestick', 'Histogram', 'Baseline'];
        const seriesType = seriesTypes[seriesIndex % seriesTypes.length];

        chartData.series.push({
          type: seriesType,
          data: this.createSeriesData(seriesType, {
            count: dataPointsPerSeries,
            seed: chartIndex * 1000 + seriesIndex,
            basePrice: 100 + seriesIndex * 20,
          }),
          configuration: this.createSeriesConfiguration(seriesType.toLowerCase() as AppSeriesType, {
            name: `Series ${seriesIndex + 1}`,
          }),
        });
      }

      testScenarios.push(chartData);
    }

    return testScenarios;
  }

  /**
   * Generate error scenario test data
   */
  static createErrorScenarioData() {
    return {
      // Invalid data formats
      invalidLineData: [
        { time: 'invalid', value: 100 },
        { time: 1234567890, value: 'invalid' },
        { time: null, value: null },
      ],

      // Empty datasets
      emptyData: [],

      // Extreme values
      extremeValueData: this.createLineData({
        count: 10,
        basePrice: Number.MAX_SAFE_INTEGER / 1000,
        volatility: 0.5,
      }),

      // Negative time values
      negativeTimeData: [
        { time: -1000000, value: 100 },
        { time: -999999, value: 101 },
      ],

      // Duplicate time values
      duplicateTimeData: [
        { time: 1234567890, value: 100 },
        { time: 1234567890, value: 101 }, // Duplicate time
        { time: 1234567891, value: 102 },
      ],

      // Missing required properties
      incompleteData: [
        { time: 1234567890 }, // Missing value
        { value: 100 }, // Missing time
        {}, // Missing both
      ],
    };
  }
}

/**
 * Pre-configured test data presets for common scenarios
 */
export const TestDataPresets = {
  // Small dataset for unit tests
  unit: (): TestDataConfig => ({
    count: 10,
    timeInterval: 60 * 1000, // 1 minute
    basePrice: 100,
    volatility: 0.01,
    trend: 'sideways',
    includeGaps: false,
  }),

  // Medium dataset for integration tests
  integration: (): TestDataConfig => ({
    count: 100,
    timeInterval: 60 * 60 * 1000, // 1 hour
    basePrice: 150,
    volatility: 0.02,
    trend: 'up',
    includeGaps: false,
  }),

  // Large dataset for performance tests
  performance: (): TestDataConfig => ({
    count: 1000,
    timeInterval: 24 * 60 * 60 * 1000, // 1 day
    basePrice: 200,
    volatility: 0.03,
    trend: 'sideways',
    includeGaps: true,
  }),

  // Extreme dataset for stress tests
  stress: (): TestDataConfig => ({
    count: 10000,
    timeInterval: 1000, // 1 second
    basePrice: 50,
    volatility: 0.05,
    trend: 'down',
    includeGaps: true,
  }),

  // Volatile market data
  volatile: (): TestDataConfig => ({
    count: 500,
    timeInterval: 5 * 60 * 1000, // 5 minutes
    basePrice: 100,
    volatility: 0.1,
    trend: 'sideways',
    includeGaps: false,
  }),

  // Bull market data
  bullMarket: (): TestDataConfig => ({
    count: 200,
    timeInterval: 24 * 60 * 60 * 1000, // 1 day
    basePrice: 100,
    volatility: 0.015,
    trend: 'up',
    includeGaps: false,
  }),

  // Bear market data
  bearMarket: (): TestDataConfig => ({
    count: 200,
    timeInterval: 24 * 60 * 60 * 1000, // 1 day
    basePrice: 200,
    volatility: 0.025,
    trend: 'down',
    includeGaps: false,
  }),
};

/**
 * Global test data setup utility
 */
export function setupTestDataDefaults(preset: TestDataConfig = TestDataPresets.unit()) {
  TestDataFactory.configure(preset);
}
