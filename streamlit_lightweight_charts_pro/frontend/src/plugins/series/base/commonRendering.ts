/**
 * @fileoverview Common rendering utilities for custom series
 *
 * Provides reusable drawing functions following TradingView's plugin pattern:
 * - Fill area rendering between two lines
 * - Line rendering with styles
 * - Coordinate conversion and validation
 *
 * These utilities follow DRY principles and ensure consistent rendering
 * across all custom series implementations and primitives.
 */

import {
  Time,
  ISeriesApi,
  IChartApi,
  CustomData,
  CustomSeriesWhitespaceData,
} from 'lightweight-charts';

// ============================================================================
// Coordinate Types
// ============================================================================

/**
 * Coordinate point with optional null values
 */
export interface CoordinatePoint {
  x: number | null;
  y: number | null;
}

/**
 * Multi-value coordinate point (for ribbons, bands, etc.)
 */
export interface MultiCoordinatePoint {
  x: number | null;
  [key: string]: number | null;
}

/**
 * Convert time to X coordinate
 *
 * @param time - Time value to convert
 * @param chart - Chart instance
 * @returns X coordinate or null if conversion fails
 */
export function timeToCoordinate(time: Time, chart: IChartApi): number | null {
  const timeScale = chart.timeScale();
  return timeScale.timeToCoordinate(time);
}

/**
 * Convert price to Y coordinate
 *
 * @param price - Price value to convert
 * @param series - Series instance
 * @returns Y coordinate or null if conversion fails
 */
export function priceToCoordinate(price: number, series: ISeriesApi<any>): number | null {
  return series.priceToCoordinate(price);
}

/**
 * Check if coordinates are valid (not null)
 *
 * @param point - Coordinate point to validate
 * @returns True if all coordinates are non-null
 */
export function isValidCoordinate(point: CoordinatePoint | MultiCoordinatePoint): boolean {
  if (point.x === null) return false;

  // Check all numeric properties
  for (const key in point) {
    const value = (point as Record<string, number | null>)[key];
    if (key !== 'x' && value === null) {
      return false;
    }
  }

  return true;
}

/**
 * Draw a line on canvas with specified style
 *
 * Supports two modes:
 * - Custom Series mode: Pass bars array with visibleRange indices (no nulls expected)
 * - Primitive mode: Pass all coordinates, function handles nulls and gaps
 *
 * @param ctx - Canvas rendering context
 * @param coordinates - Array of coordinate points or bar data
 * @param color - Line color
 * @param lineWidth - Line width in pixels (should be pre-scaled by horizontalPixelRatio)
 * @param lineStyle - Line style (0=Solid, 1=Dotted, 2=Dashed)
 * @param startIndex - Optional start index for visible range
 * @param endIndex - Optional end index for visible range
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  coordinates: CoordinatePoint[] | Array<{ x: number; y: number }>,
  color: string,
  lineWidth: number,
  lineStyle: number = 0,
  startIndex?: number,
  endIndex?: number
): void {
  if (coordinates.length === 0) return;

  const start = startIndex ?? 0;
  const end = endIndex ?? coordinates.length;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Apply line style
  switch (lineStyle) {
    case 1: // Dotted
      ctx.setLineDash([lineWidth, lineWidth * 2]);
      break;
    case 2: // Dashed
      ctx.setLineDash([lineWidth * 4, lineWidth * 2]);
      break;
    default: // Solid
      ctx.setLineDash([]);
  }

  // Check if range has any nulls (Primitive mode) or all valid (Custom Series mode)
  const rangeCoords = coordinates.slice(start, end);
  const hasNulls = rangeCoords.some(c => c.x == null || c.y == null);

  if (hasNulls) {
    // Primitive mode: Detect and draw valid segments
    let segmentStart = -1;

    for (let i = start; i < end; i++) {
      const coord = coordinates[i];
      const isValid = coord.x !== null && coord.y !== null;

      if (isValid) {
        if (segmentStart === -1) segmentStart = i;
      } else if (segmentStart !== -1) {
        drawLineSegment(ctx, coordinates, segmentStart, i - 1);
        segmentStart = -1;
      }
    }

    if (segmentStart !== -1) {
      drawLineSegment(ctx, coordinates, segmentStart, end - 1);
    }
  } else {
    // Custom Series mode: Fast path - draw continuous line
    drawLineSegment(ctx, coordinates, start, end - 1);
  }

  ctx.restore();
}

/**
 * Draw a continuous line segment
 * Internal helper used by drawLine
 */
function drawLineSegment(
  ctx: CanvasRenderingContext2D,
  coordinates: CoordinatePoint[] | Array<{ x: number; y: number }>,
  startIdx: number,
  endIdx: number
): void {
  if (endIdx < startIdx) return;

  const firstCoord = coordinates[startIdx];
  ctx.beginPath();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  ctx.moveTo(firstCoord.x!, firstCoord.y!);

  for (let i = startIdx + 1; i <= endIdx; i++) {
    const coord = coordinates[i];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ctx.lineTo(coord.x!, coord.y!);
  }

  ctx.stroke();
}

/**
 * Draw a multi-line (ribbon/band) on canvas
 *
 * Extracts one Y value from multi-value coordinates and draws it
 * Supports optional range for Custom Series mode
 *
 * @param ctx - Canvas rendering context
 * @param coordinates - Array of multi-value coordinate points or bar data
 * @param lineKey - Key for the line value (e.g., 'upper', 'lower', 'upperY', 'lowerY')
 * @param color - Line color
 * @param lineWidth - Line width in pixels (pre-scaled)
 * @param lineStyle - Line style
 * @param startIndex - Optional start index for visible range
 * @param endIndex - Optional end index for visible range
 */
export function drawMultiLine(
  ctx: CanvasRenderingContext2D,
  coordinates: MultiCoordinatePoint[] | Array<Record<string, number>>,
  lineKey: string,
  color: string,
  lineWidth: number,
  lineStyle: number = 0,
  startIndex?: number,
  endIndex?: number
): void {
  const lineCoords: CoordinatePoint[] = coordinates.map(coord => ({
    x: coord.x as number | null,
    y: coord[lineKey] as number | null,
  }));

  drawLine(ctx, lineCoords, color, lineWidth, lineStyle, startIndex, endIndex);
}

/**
 * Draw a filled area between two lines
 *
 * Supports two modes:
 * - Custom Series mode: Pass bars array with visibleRange indices (no nulls expected)
 * - Primitive mode: Pass all coordinates, function handles nulls and gaps
 *
 * @param ctx - Canvas rendering context
 * @param coordinates - Array of multi-value coordinate points or bar data
 * @param upperKey - Key for upper boundary (e.g., 'upper', 'upperY')
 * @param lowerKey - Key for lower boundary (e.g., 'lower', 'lowerY')
 * @param fillColor - Fill color (supports rgba)
 * @param startIndex - Optional start index for visible range
 * @param endIndex - Optional end index for visible range
 */
export function drawFillArea(
  ctx: CanvasRenderingContext2D,
  coordinates: MultiCoordinatePoint[] | Array<Record<string, number>>,
  upperKey: string,
  lowerKey: string,
  fillColor: string,
  startIndex?: number,
  endIndex?: number
): void {
  if (coordinates.length === 0) return;

  const start = startIndex ?? 0;
  const end = endIndex ?? coordinates.length;

  if (end - start < 2) return;

  ctx.save();
  ctx.fillStyle = fillColor;

  // Check if range has any nulls (Primitive mode) or all valid (Custom Series mode)
  const rangeCoords = coordinates.slice(start, end);
  const hasNulls = rangeCoords.some(c => c.x == null || c[upperKey] == null || c[lowerKey] == null);

  if (hasNulls) {
    // Primitive mode: Detect and draw valid segments
    let segmentStart = -1;

    for (let i = start; i < end; i++) {
      const coord = coordinates[i];
      const isValid = coord.x !== null && coord[upperKey] !== null && coord[lowerKey] !== null;

      if (isValid) {
        if (segmentStart === -1) segmentStart = i;
      } else if (segmentStart !== -1) {
        drawSegment(ctx, coordinates, segmentStart, i - 1, upperKey, lowerKey);
        segmentStart = -1;
      }
    }

    if (segmentStart !== -1) {
      drawSegment(ctx, coordinates, segmentStart, end - 1, upperKey, lowerKey);
    }
  } else {
    // Custom Series mode: Fast path - draw continuous fill
    drawSegment(ctx, coordinates, start, end - 1, upperKey, lowerKey);
  }

  ctx.restore();
}

/**
 * Draw a continuous segment of fill area
 * Internal helper used by drawFillArea
 */
function drawSegment(
  ctx: CanvasRenderingContext2D,
  coordinates: MultiCoordinatePoint[] | Array<Record<string, number>>,
  startIdx: number,
  endIdx: number,
  upperKey: string,
  lowerKey: string
): void {
  if (endIdx - startIdx < 1) return;

  ctx.beginPath();

  // Draw upper boundary (left to right)
  const firstCoord = coordinates[startIdx];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  ctx.moveTo(firstCoord.x!, firstCoord[upperKey] as number);

  for (let i = startIdx + 1; i <= endIdx; i++) {
    const coord = coordinates[i];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ctx.lineTo(coord.x!, coord[upperKey] as number);
  }

  // Draw lower boundary (right to left)
  for (let i = endIdx; i >= startIdx; i--) {
    const coord = coordinates[i];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ctx.lineTo(coord.x!, coord[lowerKey] as number);
  }

  ctx.closePath();
  ctx.fill();
}

/**
 * Convert data items to screen coordinates
 *
 * @param items - Data items with time and price values
 * @param chart - Chart instance
 * @param series - Series instance
 * @param valueKeys - Keys for price values (e.g., ['upper', 'lower'])
 * @returns Array of multi-coordinate points
 */
export function convertToCoordinates<T extends { time: Time; [key: string]: any }>(
  items: T[],
  chart: IChartApi,
  series: ISeriesApi<any>,
  valueKeys: string[]
): MultiCoordinatePoint[] {
  return items.map(item => {
    const x = timeToCoordinate(item.time, chart);
    const coord: MultiCoordinatePoint = { x };

    // Convert each value to Y coordinate
    for (const key of valueKeys) {
      const value = item[key];
      coord[key] = typeof value === 'number' ? priceToCoordinate(value, series) : null;
    }

    return coord;
  });
}

/**
 * Get bar spacing from chart
 *
 * @param chart - Chart instance
 * @returns Bar spacing in pixels
 */
export function getBarSpacing(chart: IChartApi): number {
  const timeScale = chart.timeScale();
  const options = timeScale.options();
  return options.barSpacing ?? 6;
}

// ============================================================================
// Whitespace Detection Utilities
// ============================================================================

/**
 * Whitespace checker for data with multiple value fields
 * Checks if all specified fields are null/undefined
 */
export function isWhitespaceDataMultiField<HorzScaleItem>(
  data: CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>,
  fields: string[]
): data is CustomSeriesWhitespaceData<HorzScaleItem> {
  return fields.every(field => {
    const value = (data as any)[field];
    return value === null || value === undefined;
  });
}
