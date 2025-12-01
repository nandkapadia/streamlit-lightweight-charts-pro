/**
 * @fileoverview Mock data for testing Vue 3 chart components.
 */

import type { DataPoint, SeriesConfig, ChartOptions } from '../../src/types';

/**
 * Generate sample line data.
 */
export function generateLineData(count: number, startTime: number = 1234567890): DataPoint[] {
  return Array(count).fill(null).map((_, i) => ({
    time: startTime + i * 86400,
    value: 100 + Math.sin(i / 10) * 20 + Math.random() * 5,
  }));
}

/**
 * Generate sample candlestick data.
 */
export function generateCandlestickData(count: number, startTime: number = 1234567890): DataPoint[] {
  let lastClose = 100;

  return Array(count).fill(null).map((_, i) => {
    const change = (Math.random() - 0.5) * 5;
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    lastClose = close;

    return {
      time: startTime + i * 86400,
      open,
      high,
      low,
      close,
    };
  });
}

/**
 * Generate sample histogram data.
 */
export function generateHistogramData(count: number, startTime: number = 1234567890): DataPoint[] {
  return Array(count).fill(null).map((_, i) => ({
    time: startTime + i * 86400,
    value: Math.random() * 10000000,
    color: Math.random() > 0.5 ? '#26a69a' : '#ef5350',
  }));
}

/**
 * Generate sample area data.
 */
export function generateAreaData(count: number, startTime: number = 1234567890): DataPoint[] {
  return generateLineData(count, startTime);
}

/**
 * Sample series configurations for testing.
 */
export const sampleSeriesConfigs: SeriesConfig[] = [
  {
    seriesId: 'price',
    seriesType: 'candlestick',
    data: generateCandlestickData(100),
    options: {
      upColor: '#26a69a',
      downColor: '#ef5350',
    },
  },
  {
    seriesId: 'volume',
    seriesType: 'histogram',
    paneId: 1,
    data: generateHistogramData(100),
    options: {
      priceScaleId: 'volume',
    },
  },
  {
    seriesId: 'sma20',
    seriesType: 'line',
    data: generateLineData(100),
    options: {
      color: '#2962FF',
      lineWidth: 2,
    },
  },
];

/**
 * Sample chart options for testing.
 */
export const sampleChartOptions: ChartOptions = {
  height: 400,
  layout: {
    backgroundColor: '#1e1e1e',
    textColor: '#d4d4d4',
  },
  grid: {
    vertLines: { color: '#333' },
    horzLines: { color: '#333' },
  },
  crosshair: {
    mode: 1,
    vertLine: {
      color: '#758696',
      width: 1,
      style: 2,
    },
    horzLine: {
      color: '#758696',
      width: 1,
      style: 2,
    },
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
  },
};

/**
 * Sample lazy loading configuration.
 */
export const sampleLazyLoadingConfig = {
  enabled: true,
  chunkSize: 500,
  hasMoreBefore: true,
  hasMoreAfter: false,
  chunkInfo: {
    startIndex: 500,
    endIndex: 1000,
    startTime: 1234567890,
    endTime: 1234567890 + 500 * 86400,
    count: 500,
  },
};

/**
 * Large dataset for testing chunking behavior.
 */
export function generateLargeDataset(count: number = 2000): DataPoint[] {
  return generateCandlestickData(count);
}
