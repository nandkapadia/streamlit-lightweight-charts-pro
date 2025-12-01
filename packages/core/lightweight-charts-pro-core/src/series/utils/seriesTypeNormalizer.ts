/**
 * @fileoverview Series Type Normalization Utility
 *
 * Centralizes series type normalization to prevent duplication.
 * Handles lowercase → capitalized mapping for descriptor registry lookup.
 */

/**
 * Normalize series type string to match descriptor registry keys
 *
 * @param seriesType - Raw series type (case-insensitive, may have underscores)
 * @returns Normalized type matching registry keys
 *
 * @example
 * normalizeSeriesType('line') → 'Line'
 * normalizeSeriesType('gradient_ribbon') → 'GradientRibbon'
 * normalizeSeriesType('candlestick') → 'Candlestick'
 */
export function normalizeSeriesType(seriesType: string): string {
  // Convert to lowercase for consistent processing
  const lower = seriesType.toLowerCase();

  // Direct mappings for all known types (handles underscores and case)
  const typeMapping: Record<string, string> = {
    // Built-in series
    line: 'Line',
    area: 'Area',
    histogram: 'Histogram',
    bar: 'Bar',
    candlestick: 'Candlestick',
    baseline: 'Baseline',
    // Custom series
    band: 'Band',
    ribbon: 'Ribbon',
    gradient_ribbon: 'GradientRibbon',
    gradientribbon: 'GradientRibbon',
    signal: 'Signal',
    // Not implemented
    trend_fill: 'TrendFill',
    trendfill: 'TrendFill',
  };

  // Check mapping first
  if (typeMapping[lower]) {
    return typeMapping[lower];
  }

  // Fallback: capitalize first letter for unknown types
  return seriesType.charAt(0).toUpperCase() + seriesType.slice(1);
}
