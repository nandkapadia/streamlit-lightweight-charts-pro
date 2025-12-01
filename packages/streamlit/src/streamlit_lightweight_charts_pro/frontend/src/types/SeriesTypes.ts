/**
 * @fileoverview Series-specific type definitions and configurations.
 *
 * This module provides comprehensive type definitions for different series types,
 * their styling configurations, and behavioral options. Supports both standard
 * lightweight-charts series and custom series implementations.
 */

/**
 * Supported series types for chart rendering.
 *
 * Includes both standard lightweight-charts series and custom extensions
 * for advanced financial and technical analysis indicators.
 */
export type SeriesType =
  | 'line'
  | 'area'
  | 'candlestick'
  | 'bar'
  | 'histogram'
  | 'baseline'
  | 'supertrend'
  | 'bollinger_bands'
  | 'sma'
  | 'ema'
  | 'ribbon'
  | 'gradient_ribbon'
  | 'band'
  | 'signal'
  | 'trend_fill';

/**
 * Base styling configuration for series appearance.
 *
 * Provides common visual properties that apply to most series types
 * including visibility, color, opacity, and line characteristics.
 */
export interface SeriesStyleConfig {
  visible?: boolean;
  color?: string;
  opacity?: number;
}

export interface SeriesConfiguration {
  // Common properties
  visible?: boolean;
  title?: string;
  color?: string;
  opacity?: number;
  lineWidth?: number;
  lineStyle?: number;
  lastPriceVisible?: boolean;
  lastValueVisible?: boolean;
  priceLineVisible?: boolean;
  priceLineColor?: string;
  priceLineWidth?: number;
  priceLineStyle?: number;
  labelsOnPriceScale?: boolean;
  valuesInStatusLine?: boolean;
  precision?: boolean;
  precisionValue?: string;

  // Series-specific properties
  // Supertrend
  period?: number;
  multiplier?: number;
  upTrend?: SeriesStyleConfig;
  downTrend?: SeriesStyleConfig;
  upTrendBackground?: SeriesStyleConfig;
  downTrendBackground?: SeriesStyleConfig;

  // Bollinger Bands
  length?: number;
  stdDev?: number;
  upperLine?: SeriesStyleConfig;
  lowerLine?: SeriesStyleConfig;
  fill?: SeriesStyleConfig;
  fillVisible?: boolean;

  // Moving Averages
  source?: 'close' | 'open' | 'high' | 'low' | 'hl2' | 'hlc3' | 'ohlc4';
  offset?: number;
}
