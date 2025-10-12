/**
 * @vitest-environment jsdom
 * Tests for GradientRibbonPrimitive
 *
 * This primitive renders gradient-filled areas between upper and lower lines
 * with z-order control for background rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the module under test
vi.unmock('../../primitives/GradientRibbonPrimitive');

// Mock BaseSeriesPrimitive
vi.mock('../../primitives/BaseSeriesPrimitive', () => ({
  BaseSeriesPrimitive: class {
    protected _options: any;
    protected _chart: any;
    protected _processedData: any[] = [];
    protected _paneViews: any[] = [];
    protected _priceAxisViews: any[] = [];
    protected _attachedSeries: any = null;

    constructor(chart: any, options: any) {
      this._chart = chart;
      this._options = options;
      this._initializeViews();
    }

    protected _initializeViews(): void {
      // Override in subclass
    }

    protected _addPaneView(view: any): void {
      this._paneViews.push(view);
    }

    protected _addPriceAxisView(view: any): void {
      this._priceAxisViews.push(view);
    }

    protected _processData(rawData: any[]): any[] {
      return rawData;
    }

    protected _getDefaultZOrder(): string {
      return 'normal';
    }

    getChart(): any {
      return this._chart;
    }

    getOptions(): any {
      return this._options;
    }

    getProcessedData(): any[] {
      return this._processedData;
    }

    getAttachedSeries(): any {
      return this._attachedSeries;
    }

    setData(data: any[]): void {
      this._processedData = this._processData(data);
    }

    updateOptions(options: any): void {
      this._options = { ...this._options, ...options };
    }

    attachToSeries(series: any): void {
      this._attachedSeries = series;
    }

    paneViews(): any[] {
      return this._paneViews;
    }

    priceAxisViews(): any[] {
      return this._priceAxisViews;
    }
  },
  BaseProcessedData: class {},
  BaseSeriesPrimitiveOptions: class {},
  BaseSeriesPrimitivePaneView: class {
    protected _source: any;
    constructor(source: any) {
      this._source = source;
    }
    renderer(): any {
      return null;
    }
  },
  BaseSeriesPrimitiveAxisView: class {
    protected _source: any;
    constructor(source: any) {
      this._source = source;
    }
    protected _getLastVisibleItem(): any {
      const data = this._source.getProcessedData();
      return data.length > 0 ? data[data.length - 1] : null;
    }
    coordinate(): number {
      return 0;
    }
    text(): string {
      return '';
    }
    textColor(): string {
      return '#FFFFFF';
    }
    backColor(): string {
      return '#000000';
    }
  },
}));

// Mock color utils
vi.mock('../../utils/colorUtils', () => ({
  getSolidColorFromFill: vi.fn((color: string) => color),
}));

// Mock common rendering
vi.mock('../../plugins/series/base/commonRendering', () => ({
  convertToCoordinates: vi.fn((data: any[], chart: any, series: any, keys: string[]) => {
    return data.map((item: any) => ({
      x: item.time * 10,
      upper: item.upper * 2,
      lower: item.lower * 2,
    }));
  }),
  drawMultiLine: vi.fn(),
}));

// Import after mocks
import {
  GradientRibbonPrimitive,
  GradientRibbonPrimitiveData,
  GradientRibbonPrimitiveOptions,
} from '../../primitives/GradientRibbonPrimitive';

describe('GradientRibbonPrimitive - Construction', () => {
  let mockChart: any;
  let defaultOptions: GradientRibbonPrimitiveOptions;

  beforeEach(() => {
    mockChart = {
      timeScale: vi.fn(() => ({
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 100 })),
      })),
    };

    defaultOptions = {
      upperLineColor: '#FF0000',
      upperLineWidth: 2,
      upperLineStyle: 0,
      upperLineVisible: true,
      lowerLineColor: '#00FF00',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      fillVisible: true,
      gradientStartColor: '#FF0000',
      gradientEndColor: '#0000FF',
      normalizeGradients: false,
    };
  });

  it('should create primitive with default options', () => {
    const primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
    expect(primitive).toBeDefined();
    expect(primitive.getOptions()).toBeDefined();
  });

  it('should initialize pane and axis views', () => {
    const primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
    const paneViews = primitive.paneViews();
    const axisViews = primitive.priceAxisViews();

    expect(paneViews.length).toBeGreaterThan(0);
    expect(axisViews.length).toBe(2); // Upper and lower axis views
  });

  it('should store chart reference', () => {
    const primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
    expect(primitive.getChart()).toBe(mockChart);
  });
});

describe('GradientRibbonPrimitive - Data Processing', () => {
  let mockChart: any;
  let defaultOptions: GradientRibbonPrimitiveOptions;
  let primitive: GradientRibbonPrimitive;

  beforeEach(() => {
    mockChart = {
      timeScale: vi.fn(() => ({
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 100 })),
      })),
    };

    defaultOptions = {
      upperLineColor: '#FF0000',
      upperLineWidth: 2,
      upperLineStyle: 0,
      upperLineVisible: true,
      lowerLineColor: '#00FF00',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      fillVisible: true,
      gradientStartColor: '#FF0000',
      gradientEndColor: '#0000FF',
      normalizeGradients: false,
    };

    primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
  });

  it('should process valid data correctly', () => {
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: 100, lower: 90 },
      { time: 2000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(2);
    expect(processed[0].upper).toBe(100);
    expect(processed[0].lower).toBe(90);
  });

  it('should filter out null upper values', () => {
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: null, lower: 90 },
      { time: 2000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(2000);
  });

  it('should filter out null lower values', () => {
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: 100, lower: null },
      { time: 2000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(2000);
  });

  it('should filter out undefined values', () => {
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: undefined, lower: 90 },
      { time: 2000, upper: 110, lower: undefined },
      { time: 3000, upper: 120, lower: 100 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(3000);
  });

  it('should filter out NaN values', () => {
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: NaN, lower: 90 },
      { time: 2000, upper: 110, lower: NaN },
      { time: 3000, upper: 120, lower: 100 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(3000);
  });

  it('should calculate gradient factor when not provided', () => {
    const data: GradientRibbonPrimitiveData[] = [{ time: 1000, upper: 100, lower: 90 }];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].gradientFactor).toBeDefined();
    expect(processed[0].gradientFactor).toBeGreaterThanOrEqual(0);
    expect(processed[0].gradientFactor).toBeLessThanOrEqual(1);
  });

  it('should use per-point fill override when provided', () => {
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: 100, lower: 90, fill: 'rgba(255, 0, 0, 0.5)' },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].fillOverride).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('should calculate gradient colors when normalizeGradients is true', () => {
    const optionsWithNormalize = {
      ...defaultOptions,
      normalizeGradients: true,
    };

    const primitiveWithNormalize = new GradientRibbonPrimitive(mockChart, optionsWithNormalize);

    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: 100, lower: 90 }, // spread: 10
      { time: 2000, upper: 120, lower: 100 }, // spread: 20 (max)
      { time: 3000, upper: 105, lower: 100 }, // spread: 5
    ];

    primitiveWithNormalize.setData(data);
    const processed = primitiveWithNormalize.getProcessedData();

    // All items should have gradient factors calculated
    expect(processed[0].gradientFactor).toBeDefined();
    expect(processed[1].gradientFactor).toBeDefined();
    expect(processed[2].gradientFactor).toBeDefined();

    // Gradient factors should be between 0 and 1
    expect(processed[0].gradientFactor).toBeGreaterThanOrEqual(0);
    expect(processed[0].gradientFactor).toBeLessThanOrEqual(1);

    // Item with max spread should have highest gradient factor
    expect(processed[1].gradientFactor).toBeGreaterThan(processed[0].gradientFactor);
    expect(processed[1].gradientFactor).toBeGreaterThan(processed[2].gradientFactor);
  });
});

describe('GradientRibbonPrimitive - Options Management', () => {
  let mockChart: any;
  let defaultOptions: GradientRibbonPrimitiveOptions;
  let primitive: GradientRibbonPrimitive;

  beforeEach(() => {
    mockChart = {
      timeScale: vi.fn(() => ({
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 100 })),
      })),
    };

    defaultOptions = {
      upperLineColor: '#FF0000',
      upperLineWidth: 2,
      upperLineStyle: 0,
      upperLineVisible: true,
      lowerLineColor: '#00FF00',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      fillVisible: true,
      gradientStartColor: '#FF0000',
      gradientEndColor: '#0000FF',
      normalizeGradients: false,
    };

    primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
  });

  it('should update upper line color', () => {
    // @ts-expect-error - updateOptions not implemented yet
    primitive.updateOptions({ upperLineColor: '#FFFF00' });
    expect(primitive.getOptions().upperLineColor).toBe('#FFFF00');
  });

  it('should update lower line visibility', () => {
    // @ts-expect-error - updateOptions not implemented yet
    primitive.updateOptions({ lowerLineVisible: false });
    expect(primitive.getOptions().lowerLineVisible).toBe(false);
  });

  it('should update fill visibility', () => {
    // @ts-expect-error - updateOptions not implemented yet
    primitive.updateOptions({ fillVisible: false });
    expect(primitive.getOptions().fillVisible).toBe(false);
  });

  it('should update gradient normalization', () => {
    // @ts-expect-error - updateOptions not implemented yet
    primitive.updateOptions({ normalizeGradients: true });
    expect(primitive.getOptions().normalizeGradients).toBe(true);
  });
});

describe('GradientRibbonPrimitive - Axis Views', () => {
  let mockChart: any;
  let defaultOptions: GradientRibbonPrimitiveOptions;
  let primitive: GradientRibbonPrimitive;
  let mockSeries: any;

  beforeEach(() => {
    mockChart = {
      timeScale: vi.fn(() => ({
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 100 })),
      })),
    };

    mockSeries = {
      priceToCoordinate: vi.fn((price: number) => price * 2),
    };

    defaultOptions = {
      upperLineColor: '#FF0000',
      upperLineWidth: 2,
      upperLineStyle: 0,
      upperLineVisible: true,
      lowerLineColor: '#00FF00',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      fillVisible: true,
      gradientStartColor: '#FF0000',
      gradientEndColor: '#0000FF',
      normalizeGradients: false,
    };

    primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
    // @ts-expect-error - attachToSeries not implemented yet
    primitive.attachToSeries(mockSeries);
  });

  it('should have two price axis views', () => {
    const axisViews = primitive.priceAxisViews();
    expect(axisViews).toHaveLength(2);
  });

  it('should provide upper line axis view', () => {
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: 100, lower: 90 },
      { time: 2000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const axisViews = primitive.priceAxisViews();
    const upperView = axisViews[0];

    expect(upperView.text()).toBe('110.00');
    expect(upperView.textColor()).toBe('#FFFFFF');
  });

  it('should provide lower line axis view', () => {
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: 100, lower: 90 },
      { time: 2000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const axisViews = primitive.priceAxisViews();
    const lowerView = axisViews[1];

    expect(lowerView.text()).toBe('95.00');
    expect(lowerView.textColor()).toBe('#FFFFFF');
  });

  it('should handle empty data in axis views', () => {
    primitive.setData([]);
    const axisViews = primitive.priceAxisViews();

    expect(axisViews[0].text()).toBe('');
    expect(axisViews[1].text()).toBe('');
  });
});

describe('GradientRibbonPrimitive - Edge Cases', () => {
  let mockChart: any;
  let defaultOptions: GradientRibbonPrimitiveOptions;

  beforeEach(() => {
    mockChart = {
      timeScale: vi.fn(() => ({
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 100 })),
      })),
    };

    defaultOptions = {
      upperLineColor: '#FF0000',
      upperLineWidth: 2,
      upperLineStyle: 0,
      upperLineVisible: true,
      lowerLineColor: '#00FF00',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      fillVisible: true,
      gradientStartColor: '#FF0000',
      gradientEndColor: '#0000FF',
      normalizeGradients: false,
    };
  });

  it('should handle empty data array', () => {
    const primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
    primitive.setData([]);

    expect(primitive.getProcessedData()).toHaveLength(0);
  });

  it('should handle data with all invalid values', () => {
    const primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: null, lower: null },
      { time: 2000, upper: undefined, lower: undefined },
      { time: 3000, upper: NaN, lower: NaN },
    ];

    primitive.setData(data);
    expect(primitive.getProcessedData()).toHaveLength(0);
  });

  it('should handle upper less than lower (crossing lines)', () => {
    const primitive = new GradientRibbonPrimitive(mockChart, defaultOptions);
    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: 90, lower: 100 }, // Inverted
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].upper).toBe(90);
    expect(processed[0].lower).toBe(100);
  });

  it('should handle zero spread (upper equals lower)', () => {
    const primitive = new GradientRibbonPrimitive(mockChart, {
      ...defaultOptions,
      normalizeGradients: true,
    });

    const data: GradientRibbonPrimitiveData[] = [
      { time: 1000, upper: 100, lower: 100 }, // Zero spread
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].gradientFactor).toBeDefined();
    expect(processed[0].gradientFactor).toBeGreaterThanOrEqual(0);
  });
});
