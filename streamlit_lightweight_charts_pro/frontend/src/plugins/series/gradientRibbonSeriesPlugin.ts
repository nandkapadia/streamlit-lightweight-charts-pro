import {
  ISeriesPrimitive,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  IChartApi,
  ISeriesApi,
  LineSeries,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import { ExtendedChartApi } from '../../types/ChartInterfaces';
import { asLineWidth } from '../../utils/lightweightChartsUtils';

export interface GradientRibbonData {
  time: string | number;
  upper: number;
  lower: number;
  fillColor?: string;
}

export interface GradientRibbonOptions {
  upperLine: {
    color: string;
    lineWidth: number;
    lineStyle: number;
    visible: boolean;
  };
  lowerLine: {
    color: string;
    lineWidth: number;
    lineStyle: number;
    visible: boolean;
  };
  fill: string;
  fillVisible: boolean;
  gradientStartColor: string;
  gradientEndColor: string;
  normalizeGradients: boolean;
  priceScaleId: string;
  visible: boolean;
  zIndex: number;
}

interface GradientRibbonRenderData {
  x: number | null;
  upperY: number | null;
  lowerY: number | null;
  fillColor: string;
}

interface GradientRibbonViewData {
  items: GradientRibbonRenderData[];
  visibleRange: { from: number; to: number } | null;
  options: GradientRibbonOptions;
  data: {
    chartWidth: number;
    barWidth: number;
    timeScale: any;
    priceScale: any;
  };
}

function interpolateColor(startColor: string, endColor: string, factor: number): string {
  // Clamp factor to 0-1 range
  factor = Math.max(0, Math.min(1, factor));

  // Parse hex colors
  const parseHex = (hex: string) => {
    const clean = hex.replace('#', '');
    return {
      r: parseInt(clean.substr(0, 2), 16),
      g: parseInt(clean.substr(2, 2), 16),
      b: parseInt(clean.substr(4, 2), 16),
    };
  };

  try {
    const start = parseHex(startColor);
    const end = parseHex(endColor);

    const r = Math.round(start.r + (end.r - start.r) * factor);
    const g = Math.round(start.g + (end.g - start.g) * factor);
    const b = Math.round(start.b + (end.b - start.b) * factor);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return startColor;
  }
}

function parseTime(time: string | number): UTCTimestamp {
  try {
    if (typeof time === 'number') {
      if (time > 1000000000000) {
        return Math.floor(time / 1000) as UTCTimestamp;
      }
      return Math.floor(time) as UTCTimestamp;
    }

    if (typeof time === 'string') {
      const timestamp = parseInt(time, 10);
      if (!isNaN(timestamp)) {
        if (timestamp > 1000000000000) {
          return Math.floor(timestamp / 1000) as UTCTimestamp;
        }
        return Math.floor(timestamp) as UTCTimestamp;
      }

      const date = new Date(time);
      if (isNaN(date.getTime())) {
        return 0 as UTCTimestamp;
      }
      return Math.floor(date.getTime() / 1000) as UTCTimestamp;
    }

    return 0 as UTCTimestamp;
  } catch {
    return 0 as UTCTimestamp;
  }
}

class GradientRibbonPrimitivePaneRenderer implements IPrimitivePaneRenderer {
  _viewData: GradientRibbonViewData;
  constructor(data: GradientRibbonViewData) {
    this._viewData = data;
  }
  draw(target: any) {
    if (!this._viewData.options.upperLine.visible && !this._viewData.options.lowerLine.visible)
      return;

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context;
      if (!ctx) return;

      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);
      this._drawExtendedLines(ctx, scope);
    });
  }
  drawBackground(target: any) {
    if (!this._viewData.options.fillVisible) return;

    target.useBitmapCoordinateSpace((scope: any) => {
      const ctx = scope.context;
      if (!ctx) {
        return;
      }

      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);
      this._drawGradientFills(ctx, scope);
    });
  }

  private _drawGradientFills(ctx: CanvasRenderingContext2D, _scope: any): void {
    const { items, visibleRange } = this._viewData;

    if (items.length === 0 || visibleRange === null || visibleRange.to <= visibleRange.from) {
      return;
    }

    // First draw a smooth gradient path between data points
    this._drawSmoothGradientPath(ctx, items, visibleRange);
  }

  private _drawSmoothGradientPath(
    ctx: CanvasRenderingContext2D,
    items: GradientRibbonRenderData[],
    visibleRange: { from: number; to: number }
  ): void {
    const validItems = [];
    const searchStart = Math.max(0, visibleRange.from - 1);
    const searchEnd = Math.min(items.length, visibleRange.to + 1);

    for (let i = searchStart; i < searchEnd; i++) {
      const item = items[i];
      if (this._isValidCoordinates(item)) {
        validItems.push(item);
      }
    }

    if (validItems.length < 1) {
      return;
    }

    const barWidth = this._viewData.data.barWidth || 6;
    const halfBarWidth = barWidth / 2;

    if (validItems.length >= 2) {
      ctx.beginPath();

      const firstItem = validItems[0];
      const lastItem = validItems[validItems.length - 1];

      const fillStartX = firstItem.x! - halfBarWidth - 50;
      const fillEndX = lastItem.x! + halfBarWidth + 50;

      ctx.moveTo(fillStartX, firstItem.upperY!);

      for (let i = 0; i < validItems.length; i++) {
        ctx.lineTo(validItems[i].x!, validItems[i].upperY!);
      }

      ctx.lineTo(fillEndX, lastItem.upperY!);
      ctx.lineTo(fillEndX, lastItem.lowerY!);

      for (let i = validItems.length - 1; i >= 0; i--) {
        ctx.lineTo(validItems[i].x!, validItems[i].lowerY!);
      }

      ctx.lineTo(fillStartX, firstItem.lowerY!);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(fillStartX, 0, fillEndX, 0);
      const sortedItems = [...validItems].sort((a, b) => a.x! - b.x!);

      for (let i = 0; i < sortedItems.length; i++) {
        const item = sortedItems[i];
        const position = (item.x! - fillStartX) / (fillEndX - fillStartX);
        const clampedPosition = Math.max(0, Math.min(1, position));
        gradient.addColorStop(clampedPosition, item.fillColor);
      }

      if (sortedItems.length > 0) {
        gradient.addColorStop(0, sortedItems[0].fillColor);
        gradient.addColorStop(1, sortedItems[sortedItems.length - 1].fillColor);
      }

      ctx.fillStyle = gradient;
      ctx.fill();
    } else if (validItems.length === 1) {
      const item = validItems[0];
      const singleStartX = item.x! - halfBarWidth - 50;
      ctx.fillStyle = item.fillColor;
      ctx.fillRect(
        singleStartX,
        Math.min(item.upperY!, item.lowerY!),
        barWidth + 100,
        Math.abs(item.upperY! - item.lowerY!)
      );
    }
  }

  private _drawExtendedLines(ctx: CanvasRenderingContext2D, _scope: any): void {
    const { items, visibleRange, options } = this._viewData;

    if (items.length === 0 || visibleRange === null || visibleRange.to <= visibleRange.from) {
      return;
    }

    const validItems = [];
    const searchStart = Math.max(0, visibleRange.from - 1);
    const searchEnd = Math.min(items.length, visibleRange.to + 1);

    for (let i = searchStart; i < searchEnd; i++) {
      const item = items[i];
      if (this._isValidCoordinates(item)) {
        validItems.push(item);
      }
    }

    if (validItems.length === 0) return;

    const barWidth = this._viewData.data.barWidth || 6;
    const halfBarWidth = barWidth / 2;

    const firstItem = validItems[0];
    const lastItem = validItems[validItems.length - 1];

    const lineStartX = firstItem.x! - halfBarWidth - 50;
    const lineEndX = lastItem.x! + halfBarWidth + 50;

    if (options.upperLine.visible) {
      ctx.beginPath();
      ctx.moveTo(lineStartX, firstItem.upperY!);

      for (const item of validItems) {
        ctx.lineTo(item.x!, item.upperY!);
      }

      ctx.lineTo(lineEndX, lastItem.upperY!);
      ctx.strokeStyle = options.upperLine.color;
      ctx.lineWidth = options.upperLine.lineWidth;
      ctx.stroke();
    }

    if (options.lowerLine.visible) {
      ctx.beginPath();
      ctx.moveTo(lineStartX, firstItem.lowerY!);

      for (const item of validItems) {
        ctx.lineTo(item.x!, item.lowerY!);
      }

      ctx.lineTo(lineEndX, lastItem.lowerY!);
      ctx.strokeStyle = options.lowerLine.color;
      ctx.lineWidth = options.lowerLine.lineWidth;
      ctx.stroke();
    }
  }

  private _isValidCoordinates(item: GradientRibbonRenderData): boolean {
    return item.x !== null && item.upperY !== null && item.lowerY !== null;
  }
}

class GradientRibbonPrimitivePaneView implements IPrimitivePaneView {
  _renderer: GradientRibbonPrimitivePaneRenderer;
  _data: GradientRibbonViewData;
  _source: GradientRibbonSeries;

  constructor(source: GradientRibbonSeries) {
    this._source = source;
    this._data = {
      items: [],
      visibleRange: null,
      options: source._options,
      data: {
        chartWidth: 800,
        barWidth: 6,
        timeScale: null,
        priceScale: null,
      },
    };
    this._renderer = new GradientRibbonPrimitivePaneRenderer(this._data);
  }

  update(chart: IChartApi, _series: ISeriesApi<'Line'>) {
    const timeScale = chart.timeScale();
    const upperLineSeries = this._source._upperLineSeries;
    const lowerLineSeries = this._source._lowerLineSeries;

    if (!timeScale || !upperLineSeries || !lowerLineSeries) {
      return;
    }

    const chartElement = (chart as ExtendedChartApi).chartElement?.();
    this._data.data.timeScale = timeScale;
    this._data.data.priceScale = upperLineSeries;
    this._data.data.chartWidth = chartElement?.clientWidth || 800;

    try {
      let barSpacing = 6; // default

      if (timeScale && typeof timeScale.options === 'function') {
        const options = timeScale.options();
        barSpacing = options.barSpacing || 6;
      } else {
        // Fallback to chart model approach
        const chartModel = (chart as ExtendedChartApi)._model;
        if (chartModel && chartModel.timeScale) {
          const chartTimeScale = chartModel.timeScale;
          if (typeof (chartTimeScale as any).options === 'function') {
            const options = (chartTimeScale as any).options();
            barSpacing = options.barSpacing || 6;
          } else if (typeof chartTimeScale.barSpacing === 'function') {
            barSpacing = chartTimeScale.barSpacing() || 6;
          }
        }
      }

      this._data.data.barWidth = Math.max(6, barSpacing);
    } catch (error) {
      this._data.data.barWidth = 10; // fallback
    }

    const items = this._source.getProcessedData();
    const convertedItems = this._batchConvertCoordinates(
      items,
      timeScale,
      upperLineSeries,
      lowerLineSeries
    );

    this._data.items = convertedItems;
    this._data.visibleRange = this._calculateVisibleRange(convertedItems);
  }

  private _batchConvertCoordinates(
    items: GradientRibbonData[],
    timeScale: any,
    upperSeries: ISeriesApi<'Line'>,
    lowerSeries: ISeriesApi<'Line'>
  ): GradientRibbonRenderData[] {
    return items.map(item => {
      const time = parseTime(item.time);
      const x = timeScale.timeToCoordinate(time);
      const upperY = upperSeries.priceToCoordinate(item.upper);
      const lowerY = lowerSeries.priceToCoordinate(item.lower);

      return {
        x,
        upperY,
        lowerY,
        fillColor: item.fillColor || this._data.options.fill,
      };
    });
  }

  private _calculateVisibleRange(
    items: GradientRibbonRenderData[]
  ): { from: number; to: number } | null {
    if (items.length === 0) return null;

    let from = 0;
    let to = items.length;

    // Find visible range based on x coordinates
    for (let i = 0; i < items.length; i++) {
      if (items[i].x !== null && items[i].x! >= 0) {
        from = i;
        break;
      }
    }

    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].x !== null) {
        to = i + 1;
        break;
      }
    }

    return { from, to };
  }

  renderer() {
    return this._renderer;
  }
}

export class GradientRibbonSeries implements ISeriesPrimitive<Time> {
  private _chart: IChartApi;
  public _options: GradientRibbonOptions;
  private _data: GradientRibbonData[] = [];
  private _paneViews: GradientRibbonPrimitivePaneView[];
  public _upperLineSeries: ISeriesApi<'Line'> | null = null;
  public _lowerLineSeries: ISeriesApi<'Line'> | null = null;
  private _source: any;

  constructor(chart: IChartApi, options: GradientRibbonOptions) {
    this._chart = chart;
    this._options = options;
    this._paneViews = [new GradientRibbonPrimitivePaneView(this)];

    // Create hidden line series for coordinate conversion
    this._createLineSeries();
  }

  private _createLineSeries() {
    try {
      this._upperLineSeries = this._chart.addSeries(LineSeries, {
        color: 'transparent', // Make line transparent but keep series visible for price scale
        lineWidth: asLineWidth(0), // Zero width so line is invisible
        lineStyle: this._options.upperLine.lineStyle,
        visible: true, // Keep visible for price scale calculation
        priceScaleId: this._options.priceScaleId || 'right',
      });

      this._lowerLineSeries = this._chart.addSeries(LineSeries, {
        color: 'transparent', // Make line transparent but keep series visible for price scale
        lineWidth: asLineWidth(0), // Zero width so line is invisible
        lineStyle: this._options.lowerLine.lineStyle,
        visible: true, // Keep visible for price scale calculation
        priceScaleId: this._options.priceScaleId || 'right',
      });

      // Attach primitive to upper line series
      this._upperLineSeries.attachPrimitive(this);
    } catch (error) {
      // Error creating line series - fail silently for now
      // Could implement proper error reporting here if needed
    }
  }

  getProcessedData(): GradientRibbonData[] {
    const processed = this._data.map(item => ({
      ...item,
      fillColor: item.fillColor || this._getColorForValue(item.upper, item.lower),
    }));

    return processed;
  }

  private _getColorForValue(upper: number, lower: number): string {
    // Always use gradient colors - the normalizeGradients is a backend setting
    // Calculate gradient factor based on the spread (upper - lower)
    // Wider spreads get more intense colors
    const spread = Math.abs(upper - lower);
    const maxSpread = Math.max(...this._data.map(item => Math.abs(item.upper - item.lower)));
    const factor = maxSpread > 0 ? Math.min(spread / maxSpread, 1) : 0;

    return interpolateColor(
      this._options.gradientStartColor,
      this._options.gradientEndColor,
      factor
    );
  }

  private _createExtendedLineData(
    data: GradientRibbonData[],
    field: 'upper' | 'lower'
  ): Array<{ time: UTCTimestamp; value: number }> {
    // Simply return the original data - the line extension will be handled
    // by using a different approach since time-based extension doesn't align well
    // with pixel-based bar width calculations
    return data.map(item => ({
      time: parseTime(item.time),
      value: item[field],
    }));
  }

  setData(data: GradientRibbonData[]) {
    this._data = data;

    if (this._upperLineSeries && this._lowerLineSeries) {
      // Create extended line data to match fill boundaries
      const extendedUpperData = this._createExtendedLineData(data, 'upper');
      const extendedLowerData = this._createExtendedLineData(data, 'lower');

      this._upperLineSeries.setData(extendedUpperData);
      this._lowerLineSeries.setData(extendedLowerData);

      // Force update all views after setting data
      this.updateAllViews();
    }
  }

  updateData(data: GradientRibbonData[]) {
    this.setData(data);
  }

  applyOptions(options: Partial<GradientRibbonOptions>) {
    this._options = { ...this._options, ...options };

    if (this._upperLineSeries && options.upperLine) {
      this._upperLineSeries.applyOptions({
        ...options.upperLine,
        lineWidth: asLineWidth(options.upperLine.lineWidth || 1),
      });
    }
    if (this._lowerLineSeries && options.lowerLine) {
      this._lowerLineSeries.applyOptions({
        ...options.lowerLine,
        lineWidth: asLineWidth(options.lowerLine.lineWidth || 1),
      });
    }
  }

  destroy() {
    if (this._upperLineSeries) {
      this._chart.removeSeries(this._upperLineSeries);
    }
    if (this._lowerLineSeries) {
      this._chart.removeSeries(this._lowerLineSeries);
    }
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this._paneViews;
  }

  updateAllViews() {
    this._paneViews.forEach(paneView => {
      if (this._upperLineSeries) {
        paneView.update(this._chart, this._upperLineSeries);
      }
    });
  }

  priceAxisViews() {
    return [];
  }

  timeAxisViews() {
    return [];
  }

  hitTest(): null {
    return null;
  }
}

export function createGradientRibbonSeries(
  chart: IChartApi,
  options: GradientRibbonOptions
): GradientRibbonSeries {
  return new GradientRibbonSeries(chart, options);
}
