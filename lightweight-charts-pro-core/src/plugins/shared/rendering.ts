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
  Coordinate,
} from 'lightweight-charts';

// ============================================================================
// Line Style Enum
// ============================================================================

/**
 * Line style constants matching lightweight-charts LineStyle enum
 */
export enum LineStyle {
  Solid = 0,
  Dotted = 1,
  Dashed = 2,
  LargeDashed = 3,
  SparseDotted = 4,
}

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
 * Common renderer data structure for coordinate-based rendering
 */
export interface RendererDataPoint {
  x: number;
  [key: string]: number;
}

/**
 * Point interface for canvas rendering
 */
export interface RenderPoint {
  x: Coordinate | number | null;
  y: Coordinate | number | null;
}

/**
 * Extended point with color for gradient rendering
 */
export interface ColoredRenderPoint extends RenderPoint {
  color?: string;
}

/**
 * Visible range for rendering optimization
 */
export interface VisibleRange {
  from: number;
  to: number;
}

// ============================================================================
// Coordinate Conversion Functions
// ============================================================================

/**
 * Convert time to X coordinate
 */
export function timeToCoordinate(time: Time, chart: IChartApi): number | null {
  const timeScale = chart.timeScale();
  return timeScale.timeToCoordinate(time);
}

/**
 * Convert price to Y coordinate
 */
export function priceToCoordinate(price: number, series: ISeriesApi<any>): number | null {
  return series.priceToCoordinate(price);
}

/**
 * Check if coordinates are valid (not null)
 */
export function isValidCoordinate(coord: number | Coordinate | null | undefined): boolean {
  return coord !== null && coord !== undefined && coord > -100;
}

/**
 * Check if a render point has valid coordinates
 */
export function isValidRenderPoint(point: RenderPoint): boolean {
  return (
    point !== null &&
    point.x !== null &&
    point.y !== null &&
    typeof point.x === 'number' &&
    typeof point.y === 'number' &&
    !isNaN(point.x) &&
    !isNaN(point.y)
  );
}

/**
 * Filter valid render points for canvas drawing
 */
export function filterValidRenderPoints<T extends RenderPoint>(points: T[]): T[] {
  return points.filter(
    point =>
      point &&
      point.x !== null &&
      point.y !== null &&
      typeof point.x === 'number' &&
      typeof point.y === 'number' &&
      !isNaN(point.x) &&
      !isNaN(point.y)
  );
}

/**
 * Convert data items to screen coordinates
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

    for (const key of valueKeys) {
      const value = item[key];
      coord[key] = typeof value === 'number' ? priceToCoordinate(value, series) : null;
    }

    return coord;
  });
}

/**
 * Get bar spacing from chart
 */
export function getBarSpacing(chart: IChartApi): number {
  const timeScale = chart.timeScale();
  const options = timeScale.options();
  return options.barSpacing ?? 6;
}

// ============================================================================
// Line Drawing Functions
// ============================================================================

/**
 * Draw a line on canvas with specified style
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
 * Draw a continuous line segment (internal helper)
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
  ctx.moveTo(firstCoord.x!, firstCoord.y!);

  for (let i = startIdx + 1; i <= endIdx; i++) {
    const coord = coordinates[i];
    ctx.lineTo(coord.x!, coord.y!);
  }

  ctx.stroke();
}

/**
 * Draw a multi-line (ribbon/band) on canvas
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

// ============================================================================
// Fill Area Functions
// ============================================================================

/**
 * Draw a filled area between two lines
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

  const rangeCoords = coordinates.slice(start, end);
  const hasNulls = rangeCoords.some(c => c.x == null || c[upperKey] == null || c[lowerKey] == null);

  if (hasNulls) {
    let segmentStart = -1;

    for (let i = start; i < end; i++) {
      const coord = coordinates[i];
      const isValid = coord.x !== null && coord[upperKey] !== null && coord[lowerKey] !== null;

      if (isValid) {
        if (segmentStart === -1) segmentStart = i;
      } else if (segmentStart !== -1) {
        drawFillSegment(ctx, coordinates, segmentStart, i - 1, upperKey, lowerKey);
        segmentStart = -1;
      }
    }

    if (segmentStart !== -1) {
      drawFillSegment(ctx, coordinates, segmentStart, end - 1, upperKey, lowerKey);
    }
  } else {
    drawFillSegment(ctx, coordinates, start, end - 1, upperKey, lowerKey);
  }

  ctx.restore();
}

/**
 * Draw a continuous segment of fill area (internal helper)
 */
function drawFillSegment(
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
  ctx.moveTo(firstCoord.x!, firstCoord[upperKey] as number);

  for (let i = startIdx + 1; i <= endIdx; i++) {
    const coord = coordinates[i];
    ctx.lineTo(coord.x!, coord[upperKey] as number);
  }

  // Draw lower boundary (right to left)
  for (let i = endIdx; i >= startIdx; i--) {
    const coord = coordinates[i];
    ctx.lineTo(coord.x!, coord[lowerKey] as number);
  }

  ctx.closePath();
  ctx.fill();
}

/**
 * Creates a fill path between upper and lower line points
 */
export function createFillPath(
  ctx: CanvasRenderingContext2D,
  upperPoints: RenderPoint[],
  lowerPoints: RenderPoint[],
  fillStyle?: string | CanvasGradient
): void {
  const validUpperPoints = filterValidRenderPoints(upperPoints);
  const validLowerPoints = filterValidRenderPoints(lowerPoints);

  if (validUpperPoints.length === 0 || validLowerPoints.length === 0) return;

  ctx.beginPath();

  const firstUpper = validUpperPoints[0];
  if (firstUpper.x !== null && firstUpper.y !== null) {
    ctx.moveTo(firstUpper.x, firstUpper.y);
  }

  for (let i = 1; i < validUpperPoints.length; i++) {
    const point = validUpperPoints[i];
    if (point.x !== null && point.y !== null) {
      ctx.lineTo(point.x, point.y);
    }
  }

  for (let i = validLowerPoints.length - 1; i >= 0; i--) {
    const point = validLowerPoints[i];
    if (point.x !== null && point.y !== null) {
      ctx.lineTo(point.x, point.y);
    }
  }

  ctx.closePath();

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
}

// ============================================================================
// Gradient Utilities
// ============================================================================

/**
 * Create horizontal linear gradient from colored points
 */
export function createHorizontalGradient(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  coloredPoints: ColoredRenderPoint[]
): CanvasGradient {
  const gradient = ctx.createLinearGradient(startX, 0, endX, 0);

  const validPoints = coloredPoints
    .filter(p => p.x !== null && p.color)
    .sort((a, b) => (a.x as number) - (b.x as number));

  if (validPoints.length === 0) {
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    return gradient;
  }

  for (const point of validPoints) {
    const position = ((point.x as number) - startX) / (endX - startX);
    const clampedPosition = Math.max(0, Math.min(1, position));
    if (point.color) {
      gradient.addColorStop(clampedPosition, point.color);
    }
  }

  return gradient;
}

// ============================================================================
// Line Style Utilities
// ============================================================================

/**
 * Line style configuration
 */
export interface LineStyleConfig {
  color: string;
  lineWidth: number;
  lineStyle?: LineStyle;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
}

/**
 * Apply line dash pattern based on line style
 */
export function applyLineDashPattern(
  ctx: CanvasRenderingContext2D,
  lineStyle: LineStyle = LineStyle.Solid
): void {
  switch (lineStyle) {
    case LineStyle.Solid:
      ctx.setLineDash([]);
      break;
    case LineStyle.Dotted:
      ctx.setLineDash([5, 5]);
      break;
    case LineStyle.Dashed:
      ctx.setLineDash([10, 5]);
      break;
    case LineStyle.LargeDashed:
      ctx.setLineDash([15, 10]);
      break;
    case LineStyle.SparseDotted:
      ctx.setLineDash([2, 8]);
      break;
    default:
      ctx.setLineDash([]);
  }
}

/**
 * Apply complete line style configuration to context
 */
export function applyLineStyle(ctx: CanvasRenderingContext2D, config: LineStyleConfig): void {
  ctx.strokeStyle = config.color;
  ctx.lineWidth = config.lineWidth;

  if (config.lineStyle !== undefined) {
    applyLineDashPattern(ctx, config.lineStyle);
  }

  if (config.lineCap) {
    ctx.lineCap = config.lineCap;
  }

  if (config.lineJoin) {
    ctx.lineJoin = config.lineJoin;
  }
}

// ============================================================================
// Canvas State Management
// ============================================================================

/**
 * Execute callback with saved and restored canvas state
 */
export function withSavedState(
  ctx: CanvasRenderingContext2D,
  callback: (ctx: CanvasRenderingContext2D) => void
): void {
  ctx.save();
  try {
    callback(ctx);
  } finally {
    ctx.restore();
  }
}

// ============================================================================
// Rectangle Drawing
// ============================================================================

/**
 * Rectangle drawing configuration
 */
export interface RectangleConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}

/**
 * Draw rectangle with fill and stroke options
 */
export function drawRectangle(ctx: CanvasRenderingContext2D, config: RectangleConfig): void {
  ctx.save();

  if (config.fillColor) {
    ctx.fillStyle = config.fillColor;
    if (config.fillOpacity !== undefined) {
      ctx.globalAlpha = config.fillOpacity;
    }
    ctx.fillRect(config.x, config.y, config.width, config.height);
    ctx.globalAlpha = 1.0;
  }

  if (config.strokeColor && config.strokeWidth) {
    ctx.strokeStyle = config.strokeColor;
    ctx.lineWidth = config.strokeWidth;
    if (config.strokeOpacity !== undefined) {
      ctx.globalAlpha = config.strokeOpacity;
    }
    ctx.strokeRect(config.x, config.y, config.width, config.height);
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
}

/**
 * Fill vertical band (for signal series)
 */
export function fillVerticalBand(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  fillStyle: string
): void {
  ctx.fillStyle = fillStyle;
  const width = Math.max(1, x2 - x1);
  const height = y2 - y1;
  ctx.fillRect(x1, y1, width, height);
}

// ============================================================================
// Whitespace Detection Utilities
// ============================================================================

/**
 * Whitespace checker for data with multiple value fields
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
