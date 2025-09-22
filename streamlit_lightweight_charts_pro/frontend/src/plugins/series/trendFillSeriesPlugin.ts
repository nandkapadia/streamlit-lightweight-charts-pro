/**
 * Trend Fill Series Plugin for Lightweight Charts
 *
 * This plugin renders trend lines with fill areas between trend line and base line,
 * creating a visual representation of trend direction and strength.
 *
 * Features:
 * - Dynamic baseline filling (similar to BaseLineSeries but with variable baseline)
 * - Band filling between trend line and base line
 * - Dynamic color changes based on trend direction
 * - Base line support for reference
 * - Optimized rendering using BaseLineSeries patterns
 */

import {
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  Time,
  UTCTimestamp,
  LineSeries,
} from 'lightweight-charts';

// Data structure for trend fill series (matching Python snake_case fields)
export interface TrendFillData {
  time: number | string;
  // Support both snake_case (Python) and camelCase (JavaScript) field names
  base_line?: number | null;
  trend_line?: number | null;
  trend_direction?: number | null;
  baseLine?: number | null; // camelCase fallback
  trendLine?: number | null; // camelCase fallback
  trendDirection?: number | null; // camelCase fallback
}

// Options for trend fill series
export interface TrendFillOptions {
  zIndex?: number;
  uptrendFillColor: string;
  downtrendFillColor: string;
  trendLine: {
    color: string;
    lineWidth: 1 | 2 | 3 | 4;
    lineStyle: 0 | 1 | 2;
    visible: boolean;
  };
  baseLine: {
    color: string;
    lineWidth: 1 | 2 | 3 | 4;
    lineStyle: 0 | 1 | 2;
    visible: boolean;
  };
  visible: boolean;
  priceScaleId?: string; // Added for price scale ID
}

// Internal data structures for rendering (following BaseLineSeries pattern)
interface TrendFillItem {
  time: UTCTimestamp;
  baseLine: number;
  trendLine: number;
  trendDirection: number;
  fillColor: string;
  lineColor: string;
  lineWidth: number;
  lineStyle: number;
}

// Pre-converted coordinates for rendering (like BaseLineSeries)
interface TrendFillRenderData {
  x: number | null;
  baseLineY: number | null;
  trendLineY: number | null;
  fillColor: string;
  lineColor: string;
  lineWidth: number;
  lineStyle: number;
  trendDirection: number;
}

// Renderer data interface (following BaseLineSeries pattern)
interface TrendFillRendererData {
  items: TrendFillRenderData[];
  timeScale: any;
  priceScale: any;
  chartWidth: number;
  // BaseLineSeries-style data
  lineWidth: number;
  lineStyle: number;
  visibleRange: { from: number; to: number } | null;
  barWidth: number;
}

// View data interface
interface TrendFillViewData {
  data: TrendFillRendererData;
  options: TrendFillOptions;
}

/**
 * Parse time value to timestamp
 * Handles both string dates and numeric timestamps
 */
function parseTime(time: string | number): UTCTimestamp {
  try {
    // If it's already a number (Unix timestamp), convert to seconds if needed
    if (typeof time === 'number') {
      // If timestamp is in milliseconds, convert to seconds
      if (time > 1000000000000) {
        return Math.floor(time / 1000) as UTCTimestamp;
      }
      return Math.floor(time) as UTCTimestamp;
    }

    // If it's a string, try to parse as date
    if (typeof time === 'string') {
      // First try to parse as Unix timestamp string
      const timestamp = parseInt(time, 10);
      if (!isNaN(timestamp)) {
        // It's a numeric string (Unix timestamp)
        if (timestamp > 1000000000000) {
          return Math.floor(timestamp / 1000) as UTCTimestamp;
        }
        return Math.floor(timestamp) as UTCTimestamp;
      }

      // Try to parse as date string
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        return 0 as UTCTimestamp;
      }
      return Math.floor(date.getTime() / 1000) as UTCTimestamp;
    }

    return 0 as UTCTimestamp;
  } catch (error) {
    return 0 as UTCTimestamp;
  }
}

// Optimized Trend Fill Pane Renderer (following BaseLineSeries pattern)
class TrendFillPrimitivePaneRenderer implements IPrimitivePaneRenderer {
  _viewData: TrendFillViewData;

  constructor(data: TrendFillViewData) {
    this._viewData = data;
  }

  draw() {}

  drawBackground(target: any) {
    // Batch all rendering operations (following band series pattern)
    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context;
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

      // Save context state once
      ctx.save();

      // Draw all elements efficiently - fills in background, lines in foreground
      this._drawTrendFills(ctx, scope);
      this._drawTrendLines(ctx, scope); // Re-enabled with proper color handling

      // Restore context state once
      ctx.restore();
    });
  }

  private _drawTrendFills(ctx: CanvasRenderingContext2D, scope: any): void {
    const { items, visibleRange } = this._viewData.data;

    if (items.length === 0 || visibleRange === null) {
      return;
    }

    // Group consecutive items by trend direction and fill color to draw continuous fills
    this._drawContinuousFills(
      ctx,
      items,
      visibleRange,
      scope.horizontalPixelRatio,
      scope.verticalPixelRatio
    );
  }

  private _drawTrendLines(ctx: CanvasRenderingContext2D, scope: any): void {
    const { items, visibleRange, lineWidth, lineStyle } = this._viewData.data;

    if (items.length === 0 || visibleRange === null) return;

    // Set line style once (like BaseLineSeries)
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    this._setLineStyle(ctx, lineStyle);

    // Group consecutive items by trend direction to draw continuous lines
    this._drawContinuousTrendLines(
      ctx,
      items,
      visibleRange,
      scope.horizontalPixelRatio,
      scope.verticalPixelRatio
    );
  }

  private _drawContinuousFills(
    ctx: CanvasRenderingContext2D,
    items: TrendFillRenderData[],
    visibleRange: { from: number; to: number },
    hRatio: number,
    vRatio: number
  ): void {
    if (visibleRange.to <= visibleRange.from) {
      return;
    }

    // Draw individual fills between consecutive points only
    for (let i = visibleRange.from; i < visibleRange.to - 1; i++) {
      const currentItem = items[i];
      const nextItem = items[i + 1];

      // Skip if either point has invalid coordinates
      if (!this._isValidCoordinates(currentItem) || !this._isValidCoordinates(nextItem)) {
        continue;
      }

      // Only draw fill if both points have the same trend direction and fill color
      if (
        currentItem.trendDirection === nextItem.trendDirection &&
        currentItem.fillColor === nextItem.fillColor &&
        currentItem.trendDirection !== 0
      ) {
        // Check if points are reasonably close (no huge gaps)
        const xDistance = Math.abs(nextItem.x! - currentItem.x!);
        const maxGap = 100; // Maximum pixel gap to consider "consecutive"

        if (xDistance <= maxGap) {
          this._drawFillBetweenTwoPoints(ctx, currentItem, nextItem, hRatio, vRatio);
        }
      }
    }
  }

  private _drawFillBetweenTwoPoints(
    ctx: CanvasRenderingContext2D,
    point1: TrendFillRenderData,
    point2: TrendFillRenderData,
    _hRatio: number,
    _vRatio: number
  ): void {
    ctx.fillStyle = point1.fillColor;

    // Create a trapezoid fill between the two points
    ctx.beginPath();

    // Start from point1's baseline
    ctx.moveTo(point1.x!, point1.baseLineY!);

    // Go to point2's baseline
    ctx.lineTo(point2.x!, point2.baseLineY!);

    // Go to point2's trend line
    ctx.lineTo(point2.x!, point2.trendLineY!);

    // Go to point1's trend line
    ctx.lineTo(point1.x!, point1.trendLineY!);

    // Close back to point1's baseline
    ctx.closePath();
    ctx.fill();
  }

  private _drawContinuousTrendLines(
    ctx: CanvasRenderingContext2D,
    items: TrendFillRenderData[],
    visibleRange: { from: number; to: number },
    hRatio: number,
    vRatio: number
  ): void {
    if (visibleRange.to <= visibleRange.from) return;

    // Group consecutive points by trend direction and color
    let currentGroup: TrendFillRenderData[] = [];
    let currentTrendDirection: number | null = null;
    let currentColor: string | null = null;

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const item = items[i];
      if (!this._isValidCoordinates(item)) continue;

      const itemColor = item.lineColor;
      const itemTrendDirection = item.trendDirection;

      // Start new group if trend direction or color changes
      if (currentTrendDirection !== itemTrendDirection || currentColor !== itemColor) {
        // Draw the current group before starting new one
        if (currentGroup.length > 0) {
          this._drawLineGroup(ctx, currentGroup, hRatio, vRatio, currentColor!);
        }

        // Start new group
        currentGroup = [item];
        currentTrendDirection = itemTrendDirection;
        currentColor = itemColor;
      } else {
        // Add to current group
        currentGroup.push(item);
      }
    }

    // Draw the final group
    if (currentGroup.length > 0 && currentColor) {
      this._drawLineGroup(ctx, currentGroup, hRatio, vRatio, currentColor);
    }
  }

  private _drawLineGroup(
    ctx: CanvasRenderingContext2D,
    group: TrendFillRenderData[],
    _hRatio: number,
    _vRatio: number,
    color: string
  ): void {
    if (group.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = group[0].lineWidth || 2;
    this._setLineStyle(ctx, group[0].lineStyle || 0);

    if (group.length === 1) {
      // Single point - draw a small circle
      const item = group[0];
      const trendLineY = item.trendLineY!;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(item.x!, trendLineY, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Multiple points - draw continuous line
      ctx.beginPath();
      const firstItem = group[0];
      ctx.moveTo(firstItem.x!, firstItem.trendLineY!);

      for (let i = 1; i < group.length; i++) {
        const item = group[i];
        ctx.lineTo(item.x!, item.trendLineY!);
      }

      ctx.stroke();
    }
  }

  private _setLineStyle(ctx: CanvasRenderingContext2D, lineStyle: number): void {
    switch (lineStyle) {
      case 0:
        ctx.setLineDash([]); // Solid
        break;
      case 1:
        ctx.setLineDash([5, 5]); // Dotted
        break;
      case 2:
        ctx.setLineDash([10, 5]); // Dashed
        break;
      default:
        ctx.setLineDash([]);
    }
  }

  private _isValidCoordinates(item: TrendFillRenderData): boolean {
    // Strict coordinate validation (like BaseLineSeries)
    if (item.x === null || item.baseLineY === null || item.trendLineY === null) {
      return false;
    }

    // Check bounds with tolerance
    const chartWidth = this._viewData.data.chartWidth || 800;
    const tolerance = 100;

    if (item.x < -tolerance || item.x > chartWidth + tolerance) {
      return false;
    }

    // Check for extreme Y values
    if (Math.abs(item.baseLineY) > 10000 || Math.abs(item.trendLineY) > 10000) {
      return false;
    }

    return true;
  }
}

// Optimized Trend Fill Pane View (following BaseLineSeries pattern)
class TrendFillPrimitivePaneView implements IPrimitivePaneView {
  _source: TrendFillSeries;
  _data: TrendFillViewData;

  constructor(source: TrendFillSeries) {
    this._source = source;
    this._data = {
      data: {
        items: [],
        timeScale: null,
        priceScale: null,
        chartWidth: 0,
        lineWidth: 1,
        lineStyle: 0,
        visibleRange: null,
        barWidth: 1,
      },
      options: this._source.getOptions(),
    };
  }

  update() {
    const chart = this._source.getChart();
    const timeScale = chart.timeScale();
    const chartElement = chart.chartElement();

    if (!timeScale || !chartElement) {
      return;
    }

    // Get the price scales using the real line series (following band series pattern)
    const baseLineSeries = this._source.getBaseLineSeries();
    const trendLineSeries = this._source.getTrendLineSeries();
    if (!baseLineSeries || !trendLineSeries) {
      return;
    }

    // Update view data with the real line series which have the correct price scale
    this._data.data.timeScale = timeScale;
    this._data.data.priceScale = baseLineSeries;

    // Get chart dimensions
    this._data.data.chartWidth = chartElement?.clientWidth || 800;

    // Get bar spacing (like BaseLineSeries)
    try {
      // Try to get bar spacing from chart model
      const extendedChart = chart as import('../../types/ChartInterfaces').ExtendedChartApi;
      if (extendedChart._model?.timeScale?.barSpacing) {
        this._data.data.barWidth = extendedChart._model.timeScale.barSpacing();
      } else {
        this._data.data.barWidth = 1; // Default fallback
      }
    } catch (error) {
      this._data.data.barWidth = 1; // Default fallback
    }

    // Batch coordinate conversion (like BaseLineSeries)
    const items = this._source.getProcessedData();
    const convertedItems = this._batchConvertCoordinates(
      items,
      timeScale,
      baseLineSeries,
      trendLineSeries
    );

    // Set visible range (like BaseLineSeries)
    this._data.data.visibleRange = this._calculateVisibleRange(convertedItems);

    // Update renderer data efficiently
    this._data.data.items = convertedItems;
    this._data.data.lineWidth = this._source.getOptions().trendLine.lineWidth;
    this._data.data.lineStyle = this._source.getOptions().trendLine.lineStyle;
  }

  // Batch coordinate conversion (following band series pattern)
  private _batchConvertCoordinates(
    items: TrendFillItem[],
    timeScale: any,
    baseLineSeries: any,
    trendLineSeries: any
  ): TrendFillRenderData[] {
    if (!timeScale || !baseLineSeries || !trendLineSeries) {
      return [];
    }

    return items
      .map((item, _index) => {
        try {
          // Convert coordinates using the real line series (following band series pattern)
          const x = timeScale.timeToCoordinate(item.time);

          // Use the real line series for coordinate conversion (following band series approach)
          const baseLineY = baseLineSeries.priceToCoordinate(item.baseLine);
          const trendLineY = trendLineSeries.priceToCoordinate(item.trendLine);

          // Validate coordinates
          if (x === null || baseLineY === null || trendLineY === null) {
            return null;
          }

          return {
            x,
            baseLineY,
            trendLineY,
            fillColor: item.fillColor,
            lineColor: item.lineColor,
            lineWidth: item.lineWidth,
            lineStyle: item.lineStyle,
            trendDirection: item.trendDirection,
          };
        } catch (error) {
          return null;
        }
      })
      .filter(item => item !== null) as TrendFillRenderData[];
  }

  // Calculate visible range (like BaseLineSeries)
  private _calculateVisibleRange(
    items: TrendFillRenderData[]
  ): { from: number; to: number } | null {
    if (items.length === 0) return null;

    // Simple visible range calculation
    // In a real implementation, this would consider chart viewport
    return { from: 0, to: items.length };
  }

  renderer() {
    return new TrendFillPrimitivePaneRenderer(this._data);
  }

  // Z-index support: Return the Z-index for proper layering
  zIndex(): number {
    const zIndex = this._source.getOptions().zIndex;
    // Validate Z-index is a positive number
    if (typeof zIndex === 'number' && zIndex >= 0) {
      return zIndex;
    }
    // Return default Z-index for trend fill series
    return 100;
  }
}

// Trend Fill Series Class (following BandSeries pattern)
export class TrendFillSeries implements ISeriesPrimitive<Time> {
  private chart: IChartApi;
  private baseLineSeries: ISeriesApi<'Line'>;
  private trendLineSeries: ISeriesApi<'Line'>;
  private options: TrendFillOptions;
  private data: TrendFillData[] = [];
  private _paneViews: TrendFillPrimitivePaneView[];

  // Processed data for rendering
  private trendFillItems: TrendFillItem[] = [];

  constructor(
    chart: IChartApi,
    options: TrendFillOptions = {
      uptrendFillColor: 'rgba(76, 175, 80, 0.3)', // Green with transparency for uptrend fill
      downtrendFillColor: 'rgba(244, 67, 54, 0.3)', // Red with transparency for downtrend fill
      trendLine: {
        color: '#4CAF50', // Default green (will be overridden by trend direction)
        lineWidth: 2,
        lineStyle: 0,
        visible: true,
      },
      baseLine: {
        color: '#666666',
        lineWidth: 1,
        lineStyle: 1,
        visible: false,
      },
      visible: true,
      priceScaleId: 'right', // Default priceScaleId
    },
    _paneId: number = 0
  ) {
    this.chart = chart;
    this.options = { ...options };
    this._paneViews = [new TrendFillPrimitivePaneView(this)];

    // Create the two line series (following band series pattern) - make them transparent for coordinate conversion only
    this.baseLineSeries = chart.addSeries(LineSeries, {
      color: 'rgba(0,0,0,0)', // Fully transparent
      lineStyle: 0,
      lineWidth: 1,
      visible: true, // Must be visible for primitive to render and coordinate conversion
      priceScaleId: this.options.priceScaleId,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    this.trendLineSeries = chart.addSeries(LineSeries, {
      color: 'rgba(0,0,0,0)', // Fully transparent
      lineStyle: 0,
      lineWidth: 1,
      visible: true, // Must be visible for coordinate conversion
      priceScaleId: this.options.priceScaleId,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // Attach the primitive to the base line series for rendering
    this.baseLineSeries.attachPrimitive(this);
  }

  public setDummySeries(_series: any): void {
    // No longer needed - we have real line series
  }

  public setData(data: TrendFillData[]): void {
    this.data = data;
    this.processData();

    // Extract baseline and trendline data for the real line series
    if (this.data.length > 0) {
      const baseLineData = this.data
        .map(item => ({
          time: parseTime(item.time),
          value: (item.base_line ?? item.baseLine) || 0,
        }))
        .filter(item => item.time > 0);

      const trendLineData = this.data
        .map(item => ({
          time: parseTime(item.time),
          value: (item.trend_line ?? item.trendLine) || 0,
        }))
        .filter(item => item.time > 0 && item.value !== 0);

      // Set data for the real line series
      if (baseLineData.length > 0) {
        this.baseLineSeries.setData(baseLineData);
      }
      if (trendLineData.length > 0) {
        this.trendLineSeries.setData(trendLineData);
      }
    }

    this.updateAllViews();
  }

  public updateData(data: TrendFillData[]): void {
    this.setData(data);
  }

  private processData(): void {
    this.trendFillItems = [];

    if (!this.data || this.data.length === 0) {
      return;
    }

    // Sort data by time
    const sortedData = [...this.data].sort((a, b) => {
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeA - timeB;
    });

    // Count trend directions in raw data
    const trendDirectionCounts: { [key: string]: number } = { '-1': 0, '0': 0, '1': 0, null: 0, undefined: 0 };
    sortedData.forEach((item, _i) => {
      const trendDirection = item.trend_direction ?? item.trendDirection;
      const key =
        trendDirection === null
          ? 'null'
          : trendDirection === undefined
            ? 'undefined'
            : String(trendDirection);
      trendDirectionCounts[key] = (trendDirectionCounts[key] || 0) + 1;
    });

    // Process each data point
    for (let i = 0; i < sortedData.length; i++) {
      const item = sortedData[i];
      const time = parseTime(item.time);
      // Handle both camelCase and snake_case field names for backwards compatibility
      const baseLine = item.base_line ?? item.baseLine;
      const trendLine = item.trend_line ?? item.trendLine;
      const trendDirection = item.trend_direction ?? item.trendDirection;

      if (
        baseLine === null ||
        baseLine === undefined ||
        trendDirection === null ||
        trendDirection === undefined
      ) {
        continue;
      }

      // Skip neutral trends (they don't have trend lines to draw)
      if (trendDirection === 0 || trendLine === null || trendLine === undefined) {
        continue;
      }

      // Determine colors and styles based on trend direction
      const isUptrend = trendDirection > 0;

      // Use different colors for uptrend and downtrend
      const fillColor = isUptrend ? this.options.uptrendFillColor : this.options.downtrendFillColor;

      // Use different line colors for uptrend (green) and downtrend (red) - matching the image
      const lineColor = isUptrend
        ? this._getSolidColorFromFill(this.options.uptrendFillColor) // Green line for uptrend
        : this._getSolidColorFromFill(this.options.downtrendFillColor); // Red line for downtrend

      const lineWidth = this.options.trendLine.lineWidth;
      const lineStyle = this.options.trendLine.lineStyle;

      // Create trend fill item (like BaseLineSeries data structure)
      this.trendFillItems.push({
        time,
        baseLine,
        trendLine,
        trendDirection,
        fillColor,
        lineColor,
        lineWidth,
        lineStyle,
      });
    }
  }

  public applyOptions(options: Partial<TrendFillOptions>): void {
    this.options = { ...this.options, ...options };
    this.processData();
    this.updateAllViews();
  }

  private _getSolidColorFromFill(fillColor: string): string {
    // Convert fill colors (which may have transparency) to solid line colors
    if (fillColor.includes('rgba')) {
      // Convert rgba to solid color by setting alpha to 1
      return fillColor.replace(/,\s*[0-9.]+\s*\)/, ', 1)');
    } else if (fillColor.includes('rgb')) {
      // Already solid rgb
      return fillColor;
    } else if (fillColor.startsWith('#')) {
      // Hex color - already solid
      return fillColor;
    } else {
      // Named color or other format - return as is
      return fillColor;
    }
  }

  public setVisible(visible: boolean): void {
    this.options.visible = visible;
    this.processData();
    this.updateAllViews();
  }

  public destroy(): void {
    try {
      this.chart.removeSeries(this.baseLineSeries);
      this.chart.removeSeries(this.trendLineSeries);
    } catch (error) {
      // Ignore errors during cleanup
    }
  }

  // Getter methods
  getOptions(): TrendFillOptions {
    return this.options;
  }

  getChart(): IChartApi {
    return this.chart;
  }

  getProcessedData(): TrendFillItem[] {
    return this.trendFillItems;
  }

  getBaseLineSeries(): ISeriesApi<'Line'> {
    return this.baseLineSeries;
  }

  getTrendLineSeries(): ISeriesApi<'Line'> {
    return this.trendLineSeries;
  }

  // ISeriesPrimitive implementation
  attached(_param: SeriesAttachedParameter<Time>): void {
    // Primitive is attached to the series
  }

  detached(): void {
    // Primitive is detached from the series
  }

  updateAllViews(): void {
    this._paneViews.forEach(pv => pv.update());
  }

  paneViews(): IPrimitivePaneView[] {
    return this._paneViews;
  }
}

// Custom Series View for compatibility with series factory
class TrendFillSeriesView {
  private _data: TrendFillData[] = [];
  private _options: TrendFillOptions;
  private _trendFillSeries: TrendFillSeries | null = null;

  constructor(data: TrendFillData[], options: TrendFillOptions) {
    this._data = data;
    this._options = options;
  }

  processData() {
    return this._data;
  }

  setData(newData: TrendFillData[]) {
    this._data = newData;
    if (this._trendFillSeries) {
      this._trendFillSeries.setData(newData);
    }
  }

  getData() {
    return this._data;
  }

  getOptions() {
    return this._options;
  }

  // This method will be called by addCustomSeries
  createSeries(chart: IChartApi, paneId?: number) {
    this._trendFillSeries = new TrendFillSeries(chart, this._options, paneId || 0);
    this._trendFillSeries.setData(this._data);
    return this._trendFillSeries;
  }
}

// Factory function to create trend fill series (matching the series factory call pattern)
export function createTrendFillSeriesPlugin(
  data: TrendFillData[],
  options: TrendFillOptions
): TrendFillSeriesView {
  return new TrendFillSeriesView(data, options);
}
