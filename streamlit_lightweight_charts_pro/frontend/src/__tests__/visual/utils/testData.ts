/**
 * Test Data Generators for Visual Tests
 *
 * Provides consistent, reproducible test data for chart visual regression tests.
 * All data generators use deterministic values to ensure consistent snapshots.
 *
 * @module visual/utils/testData
 */

import type {
  LineData,
  AreaData,
  HistogramData,
  BarData,
  CandlestickData,
  BaselineData,
  Time,
} from 'lightweight-charts';

/**
 * Generates simple line/area series data
 *
 * @param count - Number of data points
 * @param startValue - Starting value
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of line data points
 */
export function generateLineData(
  count: number = 50,
  startValue: number = 100,
  startDate: string = '2024-01-01'
): LineData[] {
  const data: LineData[] = [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    // Simple sinusoidal pattern with trend
    const value = startValue + i * 0.5 + Math.sin(i / 5) * 10;

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      value: Number(value.toFixed(2)),
    });
  }

  return data;
}

/**
 * Generates area series data (same as line data)
 *
 * @param count - Number of data points
 * @param startValue - Starting value
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of area data points
 */
export function generateAreaData(
  count: number = 50,
  startValue: number = 100,
  startDate: string = '2024-01-01'
): AreaData[] {
  return generateLineData(count, startValue, startDate);
}

/**
 * Generates histogram data with varying values
 *
 * @param count - Number of data points
 * @param startValue - Starting value
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of histogram data points
 */
export function generateHistogramData(
  count: number = 50,
  startValue: number = 0,
  startDate: string = '2024-01-01'
): HistogramData[] {
  const data: HistogramData[] = [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    // Oscillating values around zero
    const value = startValue + Math.sin(i / 3) * 20;
    const color = value >= 0 ? '#26A69A' : '#EF5350';

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      value: Number(value.toFixed(2)),
      color,
    });
  }

  return data;
}

/**
 * Generates bar (OHLC) data
 *
 * @param count - Number of data points
 * @param startValue - Starting value
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of bar data points
 */
export function generateBarData(
  count: number = 50,
  startValue: number = 100,
  startDate: string = '2024-01-01'
): BarData[] {
  const data: BarData[] = [];
  const date = new Date(startDate);
  let currentValue = startValue;

  for (let i = 0; i < count; i++) {
    const change = Math.sin(i / 5) * 5 + (i % 3 === 0 ? 2 : -1);
    const open = currentValue;
    const close = currentValue + change;
    const high = Math.max(open, close) + Math.abs(change) * 0.3;
    const low = Math.min(open, close) - Math.abs(change) * 0.2;

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    currentValue = close;
  }

  return data;
}

/**
 * Generates candlestick data with realistic price movements
 *
 * @param count - Number of data points
 * @param startValue - Starting value
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of candlestick data points
 */
export function generateCandlestickData(
  count: number = 50,
  startValue: number = 100,
  startDate: string = '2024-01-01'
): CandlestickData[] {
  return generateBarData(count, startValue, startDate);
}

/**
 * Generates baseline series data
 *
 * @param count - Number of data points
 * @param baselineValue - Baseline value
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of baseline data points
 */
export function generateBaselineData(
  count: number = 50,
  baselineValue: number = 100,
  startDate: string = '2024-01-01'
): BaselineData[] {
  const data: BaselineData[] = [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    // Oscillate around baseline
    const value = baselineValue + Math.sin(i / 4) * 15 + (i - count / 2) * 0.3;

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      value: Number(value.toFixed(2)),
    });
  }

  return data;
}

/**
 * Generates band series data (upper and lower bounds)
 *
 * @param count - Number of data points
 * @param middleValue - Middle value
 * @param bandWidth - Width of the band
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array with upper and lower data points
 */
export function generateBandData(
  count: number = 50,
  middleValue: number = 100,
  bandWidth: number = 10,
  startDate: string = '2024-01-01'
): { upper: LineData[]; lower: LineData[] } {
  const upper: LineData[] = [];
  const lower: LineData[] = [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const trend = i * 0.3;
    const upperValue = middleValue + trend + bandWidth + Math.sin(i / 6) * 3;
    const lowerValue = middleValue + trend - bandWidth + Math.sin(i / 6) * 3;

    const time = formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time;

    upper.push({
      time,
      value: Number(upperValue.toFixed(2)),
    });

    lower.push({
      time,
      value: Number(lowerValue.toFixed(2)),
    });
  }

  return { upper, lower };
}

/**
 * Generates ribbon series data (multiple lines for gradient effect)
 *
 * @param count - Number of data points
 * @param lineCount - Number of lines in ribbon
 * @param startValue - Starting value
 * @param spread - Spread between lines
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of line data arrays
 */
export function generateRibbonData(
  count: number = 50,
  lineCount: number = 5,
  startValue: number = 100,
  spread: number = 5,
  startDate: string = '2024-01-01'
): LineData[][] {
  const lines: LineData[][] = Array.from({ length: lineCount }, () => []);
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const time = formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time;
    const baseValue = startValue + i * 0.4 + Math.sin(i / 5) * 8;

    for (let j = 0; j < lineCount; j++) {
      const offset = (j - lineCount / 2) * spread;
      lines[j].push({
        time,
        value: Number((baseValue + offset).toFixed(2)),
      });
    }
  }

  return lines;
}

/**
 * Generates TrendFill series data with uptrend/downtrend transitions
 *
 * @param count - Number of data points
 * @param baseValue - Base/reference line value
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of TrendFill data points
 */
export function generateTrendFillData(
  count: number = 50,
  baseValue: number = 100,
  startDate: string = '2024-01-01'
): Array<{ time: Time; baseLine: number; trendLine: number; trendDirection: number }> {
  const data: Array<{ time: Time; baseLine: number; trendLine: number; trendDirection: number }> =
    [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    // Base line with slight trend
    const baseLine = baseValue + i * 0.2;

    // Trend line oscillates above and below base line
    const trendLine = baseLine + Math.sin(i / 6) * 15;

    // Direction: 1 (uptrend) when trendLine > baseLine, -1 (downtrend) otherwise
    const trendDirection = trendLine > baseLine ? 1 : -1;

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      baseLine: Number(baseLine.toFixed(2)),
      trendLine: Number(trendLine.toFixed(2)),
      trendDirection,
    });
  }

  return data;
}

/**
 * Generates Band series data (upper, middle, lower bounds)
 *
 * @param count - Number of data points
 * @param middleValue - Middle line value
 * @param bandWidth - Width of the band
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of Band data points
 */
export function generateBandData2(
  count: number = 50,
  middleValue: number = 100,
  bandWidth: number = 10,
  startDate: string = '2024-01-01'
): Array<{ time: Time; upper: number; middle: number; lower: number }> {
  const data: Array<{ time: Time; upper: number; middle: number; lower: number }> = [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const trend = i * 0.3;
    const oscillation = Math.sin(i / 6) * 3;

    const middle = middleValue + trend + oscillation;
    const upper = middle + bandWidth;
    const lower = middle - bandWidth;

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      upper: Number(upper.toFixed(2)),
      middle: Number(middle.toFixed(2)),
      lower: Number(lower.toFixed(2)),
    });
  }

  return data;
}

/**
 * Generates Ribbon series data (upper and lower bounds)
 *
 * @param count - Number of data points
 * @param startValue - Starting value
 * @param spread - Spread between upper and lower
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of Ribbon data points
 */
export function generateRibbonData2(
  count: number = 50,
  startValue: number = 100,
  spread: number = 10,
  startDate: string = '2024-01-01'
): Array<{ time: Time; upper: number; lower: number }> {
  const data: Array<{ time: Time; upper: number; lower: number }> = [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const trend = startValue + i * 0.4;
    const oscillation = Math.sin(i / 5) * 8;
    const middle = trend + oscillation;

    const upper = middle + spread / 2;
    const lower = middle - spread / 2;

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      upper: Number(upper.toFixed(2)),
      lower: Number(lower.toFixed(2)),
    });
  }

  return data;
}

/**
 * Generates Signal series data with neutral/signal/alert values
 *
 * @param count - Number of data points
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of Signal data points
 */
export function generateSignalData(
  count: number = 50,
  startDate: string = '2024-01-01'
): Array<{ time: Time; value: number }> {
  const data: Array<{ time: Time; value: number }> = [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    // Create pattern: neutral (0), signal (1), alert (-1)
    let value = 0;
    const segment = Math.floor(i / 10) % 3;
    if (segment === 0) {
      value = 0; // Neutral
    } else if (segment === 1) {
      value = 1; // Signal (positive)
    } else {
      value = -1; // Alert (negative)
    }

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      value,
    });
  }

  return data;
}

/**
 * Generates GradientRibbon series data with gradient values
 *
 * @param count - Number of data points
 * @param baseValue - Base value
 * @param startDate - Starting date (YYYY-MM-DD)
 * @returns Array of GradientRibbon data points
 */
export function generateGradientRibbonData(
  count: number = 50,
  baseValue: number = 100,
  startDate: string = '2024-01-01'
): Array<{ time: Time; upper: number; lower: number; gradient?: number }> {
  const data: Array<{ time: Time; upper: number; lower: number; gradient?: number }> = [];
  const date = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const trend = baseValue + i * 0.4;
    const oscillation = Math.sin(i / 5) * 8;
    const middle = trend + oscillation;

    // Varying spread for gradient effect
    const spread = 5 + Math.abs(Math.sin(i / 8)) * 15;
    const upper = middle + spread / 2;
    const lower = middle - spread / 2;

    // Gradient value based on spread magnitude (0-1)
    const gradient = Math.abs(Math.sin(i / 8));

    data.push({
      time: formatDate(new Date(date.getTime() + i * 24 * 60 * 60 * 1000)) as Time,
      upper: Number(upper.toFixed(2)),
      lower: Number(lower.toFixed(2)),
      gradient: Number(gradient.toFixed(2)),
    });
  }

  return data;
}

/**
 * Formats a Date object to YYYY-MM-DD string
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Common color palettes for testing
 */
export const TestColors = {
  // Standard series colors
  BLUE: '#2196F3',
  RED: '#F44336',
  GREEN: '#4CAF50',
  ORANGE: '#FF9800',
  PURPLE: '#9C27B0',

  // Candlestick colors
  UP_COLOR: '#26A69A',
  DOWN_COLOR: '#EF5350',
  UP_WICK: '#26A69A',
  DOWN_WICK: '#EF5350',

  // Gradient colors
  GRADIENT_TOP: 'rgba(33, 150, 243, 0.8)',
  GRADIENT_BOTTOM: 'rgba(33, 150, 243, 0.0)',

  // Background
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY: '#E0E0E0',
} as const;
