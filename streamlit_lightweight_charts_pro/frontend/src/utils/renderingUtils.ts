/**
 * @fileoverview Unified rendering utilities for series implementations
 *
 * This module consolidates coordinate conversion, canvas rendering, and validation
 * utilities that were previously spread across canvasUtils.ts and coordinateUtils.ts.
 *
 * Key Features:
 * - Coordinate conversion (time/price to canvas coordinates)
 * - Canvas rendering helpers (fill paths, gradients, scaling)
 * - Point validation and filtering
 * - Visible range calculation for optimization
 */

import { ISeriesApi, Time, Coordinate } from 'lightweight-charts';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Common renderer data structure for coordinate-based rendering
 */
export interface RendererDataPoint {
  x: number;
  [key: string]: number; // For upperY, lowerY, middleY, etc.
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
 * Configuration for coordinate conversion
 */
export interface CoordinateConversionConfig {
  timeField: string;
  coordinateFields: string[];
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
 * Convert series data to renderer coordinates
 *
 * @param data - Array of data points with time and value properties
 * @param timeScale - Chart time scale for time-to-coordinate conversion
 * @param seriesMap - Map of field names to series APIs for price-to-coordinate conversion
 * @param config - Configuration specifying which fields to convert
 * @returns Array of renderer data points with x and y coordinates
 */
export function convertToRendererCoordinates<T extends Record<string, any>>(
  data: T[],
  timeScale: any,
  seriesMap: Record<string, ISeriesApi<any>>,
  config: CoordinateConversionConfig
): RendererDataPoint[] {
  return data.map(item => {
    const result: RendererDataPoint = {
      x: timeScale.timeToCoordinate(item[config.timeField]) ?? -100,
    };

    config.coordinateFields.forEach(field => {
      const series = seriesMap[field];
      if (series && item[field] !== undefined) {
        result[`${field}Y`] = series.priceToCoordinate(item[field]) ?? -100;
      }
    });

    return result;
  });
}

/**
 * Specialized coordinate conversion for two-line series (Ribbon, Gradient Ribbon)
 *
 * @param data - Array of data with time, upper, and lower values
 * @param timeScale - Chart time scale
 * @param upperSeries - Upper line series API
 * @param lowerSeries - Lower line series API
 * @returns Array of coordinate points with x, upperY, lowerY
 */
export function convertTwoLineCoordinates<T extends { time: Time; upper: number; lower: number }>(
  data: T[],
  timeScale: any,
  upperSeries: ISeriesApi<any>,
  lowerSeries: ISeriesApi<any>
): Array<
  { x: Coordinate | number; upperY: Coordinate | number; lowerY: Coordinate | number } & Partial<T>
> {
  // Safety check: ensure series are available
  if (!upperSeries || !lowerSeries || !timeScale) {
    return [];
  }

  return data.map(item => ({
    x: timeScale.timeToCoordinate(item.time) ?? -100,
    upperY: upperSeries.priceToCoordinate(item.upper) ?? -100,
    lowerY: lowerSeries.priceToCoordinate(item.lower) ?? -100,
    ...item, // Include original data for additional properties (like fillColor)
  }));
}

/**
 * Specialized coordinate conversion for three-line series (Band Series)
 *
 * @param data - Array of data with time, upper, middle, and lower values
 * @param timeScale - Chart time scale
 * @param upperSeries - Upper line series API
 * @param middleSeries - Middle line series API
 * @param lowerSeries - Lower line series API
 * @returns Array of coordinate points with x, upperY, middleY, lowerY
 */
export function convertThreeLineCoordinates<
  T extends { time: Time; upper: number; middle: number; lower: number },
>(
  data: T[],
  timeScale: any,
  upperSeries: ISeriesApi<any>,
  middleSeries: ISeriesApi<any>,
  lowerSeries: ISeriesApi<any>
): Array<{
  x: Coordinate | number;
  upperY: Coordinate | number;
  middleY: Coordinate | number;
  lowerY: Coordinate | number;
}> {
  // Safety check: ensure series are available
  if (!upperSeries || !middleSeries || !lowerSeries || !timeScale) {
    return [];
  }

  return data.map(item => ({
    x: timeScale.timeToCoordinate(item.time) ?? -100,
    upperY: upperSeries.priceToCoordinate(item.upper) ?? -100,
    middleY: middleSeries.priceToCoordinate(item.middle) ?? -100,
    lowerY: lowerSeries.priceToCoordinate(item.lower) ?? -100,
  }));
}

/**
 * Batch coordinate conversion with error handling
 *
 * @param items - Array of data items
 * @param timeScale - Chart time scale
 * @param seriesMap - Map of field names to series APIs
 * @param coordinateFields - Fields to convert
 * @returns Array of renderer data points (null for failed conversions)
 */
export function batchConvertCoordinates<T extends Record<string, any>>(
  items: T[],
  timeScale: any,
  seriesMap: Record<string, ISeriesApi<any>>,
  coordinateFields: string[]
): Array<RendererDataPoint | null> {
  return items.map((item, _index) => {
    try {
      const x = timeScale.timeToCoordinate(item.time);
      if (!isValidCoordinate(x)) {
        return null;
      }

      const result: RendererDataPoint = { x };

      for (const field of coordinateFields) {
        const series = seriesMap[field];
        if (series && item[field] !== undefined) {
          const coord = series.priceToCoordinate(item[field]) ?? -100;
          if (isValidCoordinate(coord)) {
            result[`${field}Y`] = coord;
          }
        }
      }

      return result;
    } catch {
      return null;
    }
  });
}

// ============================================================================
// Coordinate Validation Functions
// ============================================================================

/**
 * Check if a coordinate is valid for rendering
 *
 * @param coord - Coordinate value to validate
 * @returns True if coordinate is valid for rendering
 */
export function isValidCoordinate(coord: number | Coordinate | null | undefined): boolean {
  return coord !== null && coord !== undefined && coord > -100;
}

/**
 * Check if a render point has valid coordinates
 *
 * @param point - Point to validate
 * @returns True if both x and y are valid
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
 *
 * @param points - Array of points to filter
 * @returns Array of valid points only
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
 * Filter valid coordinate points for rendering
 *
 * @param points - Array of renderer data points
 * @returns Array of valid coordinate points
 */
export function filterValidCoordinates<T extends RendererDataPoint>(points: T[]): T[] {
  return points.filter(
    point =>
      isValidCoordinate(point.x) &&
      Object.keys(point).some(key => key !== 'x' && isValidCoordinate(point[key]))
  );
}

// ============================================================================
// Visible Range Calculation
// ============================================================================

/**
 * Calculate visible range for efficient rendering
 * Works with any point type that has an x coordinate
 *
 * @param points - Array of points to analyze
 * @returns Visible range or null if no valid points
 */
export function calculateVisibleRange<T extends { x: number | Coordinate | null }>(
  points: T[]
): VisibleRange | null {
  if (points.length === 0) return null;

  let from = 0;
  let to = points.length;

  // Find first valid point
  for (let i = 0; i < points.length; i++) {
    if (points[i] && points[i].x !== null && isValidCoordinate(points[i].x as number)) {
      from = i;
      break;
    }
  }

  // Find last valid point
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i] && points[i].x !== null && isValidCoordinate(points[i].x as number)) {
      to = i + 1;
      break;
    }
  }

  return { from, to };
}

// ============================================================================
// Canvas Setup and Context Management
// ============================================================================

/**
 * Sets up canvas context with proper scaling and optional z-index handling
 *
 * @param target - Canvas target from lightweight-charts
 * @param zIndex - Optional z-index for layering
 * @returns Setup function that provides scaled context
 */
export function setupCanvasContext(
  target: any,
  zIndex?: number
): (callback: (ctx: CanvasRenderingContext2D) => void) => void {
  return (callback: (ctx: CanvasRenderingContext2D) => void) => {
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context;
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

      // Apply z-index if provided
      if (typeof zIndex === 'number') {
        ctx.globalCompositeOperation = 'source-over';
      }

      callback(ctx);
    });
  };
}

/**
 * Execute rendering callback with properly scaled canvas context
 * This is the DRY helper for useBitmapCoordinateSpace pattern
 *
 * @param target - Canvas target from lightweight-charts
 * @param callback - Rendering function that receives scaled context
 *
 * @example
 * // Instead of:
 * target.useBitmapCoordinateSpace((scope: any) => {
 *   const ctx = scope.context;
 *   ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);
 *   // ... rendering code
 * });
 *
 * // Use:
 * renderWithScaledCanvas(target, (ctx) => {
 *   // ... rendering code
 * });
 */
export function renderWithScaledCanvas(
  target: any,
  callback: (ctx: CanvasRenderingContext2D, scope: any) => void
): void {
  target.useBitmapCoordinateSpace((scope: any) => {
    const ctx = scope.context;
    if (!ctx) return;

    ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);
    callback(ctx, scope);
  });
}

// ============================================================================
// Canvas Path Drawing Functions
// ============================================================================

/**
 * Creates a fill path between upper and lower line points
 *
 * @param ctx - Canvas rendering context
 * @param upperPoints - Array of upper line points
 * @param lowerPoints - Array of lower line points
 * @param fillStyle - Fill style (color, gradient, etc.)
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

  // Start with upper line
  const firstUpper = validUpperPoints[0];
  if (firstUpper.x !== null && firstUpper.y !== null) {
    ctx.moveTo(firstUpper.x, firstUpper.y);
  }

  // Draw upper line
  for (let i = 1; i < validUpperPoints.length; i++) {
    const point = validUpperPoints[i];
    if (point.x !== null && point.y !== null) {
      ctx.lineTo(point.x, point.y);
    }
  }

  // Draw lower line backwards to create closed path
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

/**
 * Creates a gradient fill between points with individual colors
 *
 * @param ctx - Canvas rendering context
 * @param upperPoints - Array of upper line points
 * @param lowerPoints - Array of lower line points
 * @param coloredPoints - Array of points with individual colors
 */
export function createGradientFillPath(
  ctx: CanvasRenderingContext2D,
  upperPoints: RenderPoint[],
  lowerPoints: RenderPoint[],
  coloredPoints: ColoredRenderPoint[]
): void {
  const validUpperPoints = filterValidRenderPoints(upperPoints);
  const validLowerPoints = filterValidRenderPoints(lowerPoints);
  const validColoredPoints = coloredPoints.filter(p => p.x !== null && p.y !== null && p.color);

  if (
    validUpperPoints.length === 0 ||
    validLowerPoints.length === 0 ||
    validColoredPoints.length === 0
  )
    return;

  ctx.beginPath();

  // Create the path for gradient fill
  const firstUpper = validUpperPoints[0];
  if (firstUpper.x !== null && firstUpper.y !== null) {
    ctx.moveTo(firstUpper.x, firstUpper.y);
  }

  // Draw upper line
  for (let i = 1; i < validUpperPoints.length; i++) {
    const point = validUpperPoints[i];
    if (point.x !== null && point.y !== null) {
      ctx.lineTo(point.x, point.y);
    }
  }

  // Draw lower line backwards
  for (let i = validLowerPoints.length - 1; i >= 0; i--) {
    const point = validLowerPoints[i];
    if (point.x !== null && point.y !== null) {
      ctx.lineTo(point.x, point.y);
    }
  }

  ctx.closePath();

  // Create linear gradient
  const firstPoint = validColoredPoints[0];
  const lastPoint = validColoredPoints[validColoredPoints.length - 1];

  const gradient = ctx.createLinearGradient(firstPoint.x || 0, 0, lastPoint.x || 0, 0);

  // Add color stops based on data points
  for (let i = 0; i < validColoredPoints.length; i++) {
    const point = validColoredPoints[i];
    const position = i / (validColoredPoints.length - 1);
    if (point.color) {
      gradient.addColorStop(position, point.color);
    }
  }

  ctx.fillStyle = gradient;
  ctx.fill();
}

// ============================================================================
// Line Style Enums and Types
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

// ============================================================================
// Line Drawing Utilities
// ============================================================================

/**
 * Apply line dash pattern based on line style
 *
 * @param ctx - Canvas rendering context
 * @param lineStyle - Line style enum value
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
 *
 * @param ctx - Canvas rendering context
 * @param config - Line style configuration
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

/**
 * Draw a continuous line through multiple points with optional styling
 *
 * @param ctx - Canvas rendering context
 * @param points - Array of points to draw through
 * @param config - Line style configuration
 * @param options - Additional drawing options
 */
export function drawContinuousLine(
  ctx: CanvasRenderingContext2D,
  points: RenderPoint[],
  config: LineStyleConfig,
  options?: {
    extendStart?: number;
    extendEnd?: number;
    skipInvalid?: boolean;
  }
): void {
  const validPoints = options?.skipInvalid ? filterValidRenderPoints(points) : points;
  if (validPoints.length === 0) return;

  ctx.save();
  applyLineStyle(ctx, config);

  ctx.beginPath();

  const firstPoint = validPoints[0];
  const lastPoint = validPoints[validPoints.length - 1];

  // Calculate start position with optional extension
  const startX = options?.extendStart
    ? (firstPoint.x as number) - options.extendStart
    : (firstPoint.x as number);

  ctx.moveTo(startX, firstPoint.y as number);

  // Draw through all points
  for (let i = 0; i < validPoints.length; i++) {
    const point = validPoints[i];
    if (point.x !== null && point.y !== null) {
      ctx.lineTo(point.x, point.y);
    }
  }

  // Extend end if requested
  if (options?.extendEnd && lastPoint.x !== null && lastPoint.y !== null) {
    ctx.lineTo((lastPoint.x as number) + options.extendEnd, lastPoint.y);
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draw multiple line segments with different styles
 * Useful for drawing trend lines with color changes
 *
 * @param ctx - Canvas rendering context
 * @param segments - Array of segments with points and styles
 */
export function drawSegmentedLine<T extends RenderPoint>(
  ctx: CanvasRenderingContext2D,
  segments: Array<{
    points: T[];
    style: LineStyleConfig;
  }>
): void {
  for (const segment of segments) {
    if (segment.points.length > 0) {
      drawContinuousLine(ctx, segment.points, segment.style, { skipInvalid: true });
    }
  }
}

// ============================================================================
// Enhanced Fill Area Utilities
// ============================================================================

/**
 * Fill area configuration
 */
export interface FillAreaConfig {
  fillStyle: string | CanvasGradient;
  opacity?: number;
  edgeExtension?: {
    start: number;
    end: number;
  };
}

/**
 * Fill area between two lines with edge extension support
 * Enhanced version of createFillPath with more options
 *
 * @param ctx - Canvas rendering context
 * @param upperPoints - Upper boundary points
 * @param lowerPoints - Lower boundary points
 * @param config - Fill configuration
 */
export function fillBetweenLines(
  ctx: CanvasRenderingContext2D,
  upperPoints: RenderPoint[],
  lowerPoints: RenderPoint[],
  config: FillAreaConfig
): void {
  const validUpperPoints = filterValidRenderPoints(upperPoints);
  const validLowerPoints = filterValidRenderPoints(lowerPoints);

  if (validUpperPoints.length === 0 || validLowerPoints.length === 0) return;

  ctx.save();

  if (config.opacity !== undefined) {
    ctx.globalAlpha = config.opacity;
  }

  ctx.beginPath();

  const firstUpper = validUpperPoints[0];
  const lastUpper = validUpperPoints[validUpperPoints.length - 1];

  // Start position with optional extension
  const startX = config.edgeExtension?.start
    ? (firstUpper.x as number) - config.edgeExtension.start
    : (firstUpper.x as number);

  const endX = config.edgeExtension?.end
    ? (lastUpper.x as number) + config.edgeExtension.end
    : (lastUpper.x as number);

  // Start at extended upper left
  ctx.moveTo(startX, firstUpper.y as number);

  // Draw upper line
  for (const point of validUpperPoints) {
    if (point.x !== null && point.y !== null) {
      ctx.lineTo(point.x, point.y);
    }
  }

  // Extend upper right
  if (config.edgeExtension?.end) {
    ctx.lineTo(endX, lastUpper.y as number);
  }

  // Draw lower line backwards
  for (let i = validLowerPoints.length - 1; i >= 0; i--) {
    const point = validLowerPoints[i];
    if (point.x !== null && point.y !== null) {
      ctx.lineTo(point.x, point.y);
    }
  }

  // Extend lower left
  if (config.edgeExtension?.start) {
    const firstLower = validLowerPoints[0];
    ctx.lineTo(startX, firstLower.y as number);
  }

  ctx.closePath();
  ctx.fillStyle = config.fillStyle;
  ctx.fill();

  ctx.restore();
}

/**
 * Fill trapezoidal segments for trend fill series
 * Each segment is a trapezoid between two consecutive points
 *
 * @param ctx - Canvas rendering context
 * @param segments - Array of trapezoidal segments
 */
export function fillTrapezoidalSegments(
  ctx: CanvasRenderingContext2D,
  segments: Array<{
    x1: number;
    y1Upper: number;
    y1Lower: number;
    x2: number;
    y2Upper: number;
    y2Lower: number;
    fillStyle: string;
  }>
): void {
  for (const seg of segments) {
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1Upper);
    ctx.lineTo(seg.x2, seg.y2Upper);
    ctx.lineTo(seg.x2, seg.y2Lower);
    ctx.lineTo(seg.x1, seg.y1Lower);
    ctx.closePath();
    ctx.fillStyle = seg.fillStyle;
    ctx.fill();
  }
}

// ============================================================================
// Gradient Creation Utilities
// ============================================================================

/**
 * Gradient stop definition
 */
export interface GradientStop {
  position: number; // 0-1
  color: string;
}

/**
 * Create horizontal linear gradient from colored points
 * Handles position calculation and clamping automatically
 *
 * @param ctx - Canvas rendering context
 * @param startX - Start x coordinate
 * @param endX - End x coordinate
 * @param coloredPoints - Points with colors
 * @returns Canvas gradient
 */
export function createHorizontalGradient(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  coloredPoints: ColoredRenderPoint[]
): CanvasGradient {
  const gradient = ctx.createLinearGradient(startX, 0, endX, 0);

  // Filter points with valid coordinates and colors
  const validPoints = coloredPoints
    .filter(p => p.x !== null && p.color)
    .sort((a, b) => (a.x as number) - (b.x as number));

  if (validPoints.length === 0) {
    // Fallback to simple gradient
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

/**
 * Create vertical linear gradient with color stops
 *
 * @param ctx - Canvas rendering context
 * @param startY - Start y coordinate
 * @param endY - End y coordinate
 * @param stops - Gradient color stops
 * @returns Canvas gradient
 */
export function createVerticalGradient(
  ctx: CanvasRenderingContext2D,
  startY: number,
  endY: number,
  stops: GradientStop[]
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, startY, 0, endY);

  for (const stop of stops) {
    gradient.addColorStop(stop.position, stop.color);
  }

  return gradient;
}

// ============================================================================
// Canvas State Management
// ============================================================================

/**
 * Canvas state configuration
 */
export interface CanvasState {
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
  globalAlpha?: number;
  globalCompositeOperation?: GlobalCompositeOperation;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  lineDash?: number[];
}

/**
 * Execute callback with saved and restored canvas state
 * Prevents state leakage between rendering operations
 *
 * @param ctx - Canvas rendering context
 * @param callback - Function to execute with saved state
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

/**
 * Apply canvas state properties
 *
 * @param ctx - Canvas rendering context
 * @param state - State properties to apply
 */
export function applyCanvasState(ctx: CanvasRenderingContext2D, state: CanvasState): void {
  if (state.fillStyle) ctx.fillStyle = state.fillStyle;
  if (state.strokeStyle) ctx.strokeStyle = state.strokeStyle;
  if (state.lineWidth !== undefined) ctx.lineWidth = state.lineWidth;
  if (state.globalAlpha !== undefined) ctx.globalAlpha = state.globalAlpha;
  if (state.globalCompositeOperation) ctx.globalCompositeOperation = state.globalCompositeOperation;
  if (state.lineCap) ctx.lineCap = state.lineCap;
  if (state.lineJoin) ctx.lineJoin = state.lineJoin;
  if (state.lineDash) ctx.setLineDash(state.lineDash);
}

// ============================================================================
// Shape Drawing Utilities
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
 *
 * @param ctx - Canvas rendering context
 * @param config - Rectangle configuration
 */
export function drawRectangle(ctx: CanvasRenderingContext2D, config: RectangleConfig): void {
  ctx.save();

  // Draw fill
  if (config.fillColor) {
    ctx.fillStyle = config.fillColor;
    if (config.fillOpacity !== undefined) {
      ctx.globalAlpha = config.fillOpacity;
    }
    ctx.fillRect(config.x, config.y, config.width, config.height);
    ctx.globalAlpha = 1.0;
  }

  // Draw stroke
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
 *
 * @param ctx - Canvas rendering context
 * @param x1 - Start x coordinate
 * @param x2 - End x coordinate
 * @param y1 - Top y coordinate
 * @param y2 - Bottom y coordinate
 * @param fillStyle - Fill style
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
// Enhanced Coordinate Validation
// ============================================================================

/**
 * Coordinate bounds for validation
 */
export interface CoordinateBounds {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  tolerance?: number;
}

/**
 * Validate coordinate with bounds checking
 *
 * @param coord - Coordinate to validate
 * @param bounds - Optional bounds constraints
 * @returns True if coordinate is valid
 */
export function isValidCoordinateWithBounds(
  coord: number | Coordinate | null | undefined,
  bounds?: CoordinateBounds
): boolean {
  if (!isValidCoordinate(coord)) return false;

  const value = coord as number;
  const tolerance = bounds?.tolerance ?? 0;

  if (bounds?.minX !== undefined && value < bounds.minX - tolerance) return false;
  if (bounds?.maxX !== undefined && value > bounds.maxX + tolerance) return false;
  if (bounds?.minY !== undefined && value < bounds.minY - tolerance) return false;
  if (bounds?.maxY !== undefined && value > bounds.maxY + tolerance) return false;

  return true;
}

/**
 * Filter points by bounds
 *
 * @param points - Points to filter
 * @param bounds - Bounds constraints
 * @returns Filtered points within bounds
 */
export function filterPointsByBounds<T extends RenderPoint>(
  points: T[],
  bounds: CoordinateBounds
): T[] {
  return points.filter(
    point =>
      isValidCoordinateWithBounds(point.x, bounds) && isValidCoordinateWithBounds(point.y, bounds)
  );
}

// ============================================================================
// Edge Extension Utilities
// ============================================================================

/**
 * Edge extension configuration
 */
export interface EdgeExtensionConfig {
  barWidth: number;
  extensionPixels?: number;
}

/**
 * Calculate extended x-range for fills/lines
 * Accounts for bar width and custom extension
 *
 * @param firstPoint - First data point
 * @param lastPoint - Last data point
 * @param config - Extension configuration
 * @returns Extended start and end x coordinates
 */
export function calculateExtendedRange(
  firstPoint: RenderPoint,
  lastPoint: RenderPoint,
  config: EdgeExtensionConfig
): { startX: number; endX: number } {
  const halfBarWidth = config.barWidth / 2;
  const extension = config.extensionPixels ?? 50;

  return {
    startX: (firstPoint.x as number) - halfBarWidth - extension,
    endX: (lastPoint.x as number) + halfBarWidth + extension,
  };
}

// ============================================================================
// Re-export commonly used types
// ============================================================================

// RendererDataPoint is now defined above in the Type Definitions section
