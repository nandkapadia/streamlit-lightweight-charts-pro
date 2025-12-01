/**
 * @vitest-environment jsdom
 * Tests for BandPrimitive
 *
 * This primitive renders filled areas between three lines (upper, middle, lower)
 * with z-order control for background rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the module under test
vi.unmock('../../primitives/BandPrimitive');

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
  // Factory function for creating axis view classes (added for refactoring)
  createPrimitiveAxisView: (field: string, colorField: string) => {
    return class {
      protected _source: any;
      private _field: string;
      private _colorField: string;

      constructor(source: any) {
        this._source = source;
        this._field = field;
        this._colorField = colorField;
      }

      protected _getLastVisibleItem(): any {
        const data = this._source.getProcessedData();
        return data.length > 0 ? data[data.length - 1] : null;
      }

      coordinate(): number {
        const lastItem = this._getLastVisibleItem();
        if (!lastItem) return 0;
        const fieldValue = lastItem[this._field];
        if (fieldValue === null || fieldValue === undefined) return 0;
        // Mock coordinate calculation
        return fieldValue * 2;
      }

      text(): string {
        const lastItem = this._getLastVisibleItem();
        if (!lastItem) return '';
        const fieldValue = lastItem[this._field];
        if (fieldValue === null || fieldValue === undefined) return '';
        return fieldValue.toFixed(2);
      }

      textColor(): string {
        return '#FFFFFF';
      }

      backColor(): string {
        const options = this._source.getOptions();
        return options[this._colorField] || '#000000';
      }
    };
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
      middle: item.middle * 2,
      lower: item.lower * 2,
    }));
  }),
  drawMultiLine: vi.fn(),
  drawFillArea: vi.fn(),
}));

// Import after mocks
import {
  BandPrimitive,
  BandPrimitiveData,
  BandPrimitiveOptions,
} from '../../src/primitives/BandPrimitive';

describe('BandPrimitive - Construction', () => {
  let mockChart: any;
  let defaultOptions: BandPrimitiveOptions;

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
      middleLineColor: '#00FF00',
      middleLineWidth: 2,
      middleLineStyle: 0,
      middleLineVisible: true,
      lowerLineColor: '#0000FF',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      upperFillColor: 'rgba(255, 0, 0, 0.3)',
      upperFill: true,
      lowerFillColor: 'rgba(0, 0, 255, 0.3)',
      lowerFill: true,
    };
  });

  it('should create primitive with default options', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    expect(primitive).toBeDefined();
    expect(primitive.getOptions()).toBeDefined();
  });

  it('should initialize pane and axis views', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const paneViews = primitive.paneViews();
    const axisViews = primitive.priceAxisViews();

    expect(paneViews.length).toBeGreaterThan(0);
    expect(axisViews.length).toBe(3); // Upper, middle, and lower axis views
  });

  it('should store chart reference', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    expect(primitive.getChart()).toBe(mockChart);
  });
});

describe('BandPrimitive - Data Processing', () => {
  let mockChart: any;
  let defaultOptions: BandPrimitiveOptions;
  let primitive: BandPrimitive;

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
      middleLineColor: '#00FF00',
      middleLineWidth: 2,
      middleLineStyle: 0,
      middleLineVisible: true,
      lowerLineColor: '#0000FF',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      upperFillColor: 'rgba(255, 0, 0, 0.3)',
      upperFill: true,
      lowerFillColor: 'rgba(0, 0, 255, 0.3)',
      lowerFill: true,
    };

    primitive = new BandPrimitive(mockChart, defaultOptions);
  });

  it('should process valid data correctly', () => {
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: 110, middle: 100, lower: 90 },
      { time: 2000, upper: 115, middle: 105, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(2);
    expect(processed[0].upper).toBe(110);
    expect(processed[0].middle).toBe(100);
    expect(processed[0].lower).toBe(90);
  });

  it('should filter out null values', () => {
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: null, middle: 100, lower: 90 },
      { time: 2000, upper: 110, middle: null, lower: 90 },
      { time: 3000, upper: 110, middle: 100, lower: null },
      { time: 4000, upper: 115, middle: 105, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(4000);
  });

  it('should filter out undefined values', () => {
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: undefined, middle: 100, lower: 90 },
      { time: 2000, upper: 110, middle: undefined, lower: 90 },
      { time: 3000, upper: 110, middle: 100, lower: undefined },
      { time: 4000, upper: 115, middle: 105, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(4000);
  });

  it('should filter out NaN values', () => {
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: NaN, middle: 100, lower: 90 },
      { time: 2000, upper: 110, middle: NaN, lower: 90 },
      { time: 3000, upper: 110, middle: 100, lower: NaN },
      { time: 4000, upper: 115, middle: 105, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(4000);
  });

  it('should require all three values to be valid', () => {
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: 110, middle: 100 }, // missing lower
      { time: 2000, upper: 110, lower: 90 }, // missing middle
      { time: 3000, middle: 100, lower: 90 }, // missing upper
      { time: 4000, upper: 115, middle: 105, lower: 95 }, // all valid
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(4000);
  });
});

describe('BandPrimitive - Options Management', () => {
  let mockChart: any;
  let defaultOptions: BandPrimitiveOptions;
  let primitive: BandPrimitive;

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
      middleLineColor: '#00FF00',
      middleLineWidth: 2,
      middleLineStyle: 0,
      middleLineVisible: true,
      lowerLineColor: '#0000FF',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      upperFillColor: 'rgba(255, 0, 0, 0.3)',
      upperFill: true,
      lowerFillColor: 'rgba(0, 0, 255, 0.3)',
      lowerFill: true,
    };

    primitive = new BandPrimitive(mockChart, defaultOptions);
  });

  it('should update line colors', () => {
    primitive.applyOptions({
      upperLineColor: '#FFFF00',
      middleLineColor: '#FF00FF',
      lowerLineColor: '#00FFFF',
    });

    const options = primitive.getOptions();
    expect(options.upperLineColor).toBe('#FFFF00');
    expect(options.middleLineColor).toBe('#FF00FF');
    expect(options.lowerLineColor).toBe('#00FFFF');
  });

  it('should update line visibility', () => {
    primitive.applyOptions({
      upperLineVisible: false,
      middleLineVisible: false,
      lowerLineVisible: false,
    });

    const options = primitive.getOptions();
    expect(options.upperLineVisible).toBe(false);
    expect(options.middleLineVisible).toBe(false);
    expect(options.lowerLineVisible).toBe(false);
  });

  it('should update fill visibility', () => {
    primitive.applyOptions({
      upperFill: false,
      lowerFill: false,
    });

    const options = primitive.getOptions();
    expect(options.upperFill).toBe(false);
    expect(options.lowerFill).toBe(false);
  });

  it('should update fill colors', () => {
    primitive.applyOptions({
      upperFillColor: 'rgba(100, 100, 100, 0.5)',
      lowerFillColor: 'rgba(200, 200, 200, 0.5)',
    });

    const options = primitive.getOptions();
    expect(options.upperFillColor).toBe('rgba(100, 100, 100, 0.5)');
    expect(options.lowerFillColor).toBe('rgba(200, 200, 200, 0.5)');
  });
});

describe('BandPrimitive - Axis Views', () => {
  let mockChart: any;
  let defaultOptions: BandPrimitiveOptions;
  let primitive: BandPrimitive;
  let mockSeries: any;

  beforeEach(() => {
    mockChart = {
      timeScale: vi.fn(() => ({
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 100 })),
        getVisibleRange: vi.fn(() => ({ from: 1000, to: 2000 })),
      })),
    };

    mockSeries = {
      priceToCoordinate: vi.fn((price: number) => price * 2),
      data: vi.fn(() => []),
    };

    defaultOptions = {
      upperLineColor: '#FF0000',
      upperLineWidth: 2,
      upperLineStyle: 0,
      upperLineVisible: true,
      middleLineColor: '#00FF00',
      middleLineWidth: 2,
      middleLineStyle: 0,
      middleLineVisible: true,
      lowerLineColor: '#0000FF',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      upperFillColor: 'rgba(255, 0, 0, 0.3)',
      upperFill: true,
      lowerFillColor: 'rgba(0, 0, 255, 0.3)',
      lowerFill: true,
    };

    primitive = new BandPrimitive(mockChart, defaultOptions);
    // Simulate attachment via series.attachPrimitive() which calls attached()
    primitive.attached({ series: mockSeries, requestUpdate: vi.fn() });
  });

  it('should have three price axis views', () => {
    const axisViews = primitive.priceAxisViews();
    expect(axisViews).toHaveLength(3);
  });

  it('should provide upper line axis view', () => {
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: 110, middle: 100, lower: 90 },
      { time: 2000, upper: 115, middle: 105, lower: 95 },
    ];

    primitive.setData(data);
    const axisViews = primitive.priceAxisViews();
    const upperView = axisViews[0];

    expect(upperView.text()).toBe('115.00');
    expect(upperView.textColor()).toBe('#FFFFFF');
  });

  it('should provide middle line axis view', () => {
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: 110, middle: 100, lower: 90 },
      { time: 2000, upper: 115, middle: 105, lower: 95 },
    ];

    primitive.setData(data);
    const axisViews = primitive.priceAxisViews();
    const middleView = axisViews[1];

    expect(middleView.text()).toBe('105.00');
    expect(middleView.textColor()).toBe('#FFFFFF');
  });

  it('should provide lower line axis view', () => {
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: 110, middle: 100, lower: 90 },
      { time: 2000, upper: 115, middle: 105, lower: 95 },
    ];

    primitive.setData(data);
    const axisViews = primitive.priceAxisViews();
    const lowerView = axisViews[2];

    expect(lowerView.text()).toBe('95.00');
    expect(lowerView.textColor()).toBe('#FFFFFF');
  });

  it('should handle empty data in axis views', () => {
    primitive.setData([]);
    const axisViews = primitive.priceAxisViews();

    expect(axisViews[0].text()).toBe('');
    expect(axisViews[1].text()).toBe('');
    expect(axisViews[2].text()).toBe('');
  });
});

describe('BandPrimitive - Edge Cases', () => {
  let mockChart: any;
  let defaultOptions: BandPrimitiveOptions;

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
      middleLineColor: '#00FF00',
      middleLineWidth: 2,
      middleLineStyle: 0,
      middleLineVisible: true,
      lowerLineColor: '#0000FF',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      upperFillColor: 'rgba(255, 0, 0, 0.3)',
      upperFill: true,
      lowerFillColor: 'rgba(0, 0, 255, 0.3)',
      lowerFill: true,
    };
  });

  it('should handle empty data array', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    primitive.setData([]);

    expect(primitive.getProcessedData()).toHaveLength(0);
  });

  it('should handle data with all invalid values', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: null, middle: null, lower: null },
      { time: 2000, upper: undefined, middle: undefined, lower: undefined },
      { time: 3000, upper: NaN, middle: NaN, lower: NaN },
    ];

    primitive.setData(data);
    expect(primitive.getProcessedData()).toHaveLength(0);
  });

  it('should handle crossing bands (middle not between upper and lower)', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: 90, middle: 100, lower: 110 }, // Inverted order
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].upper).toBe(90);
    expect(processed[0].middle).toBe(100);
    expect(processed[0].lower).toBe(110);
  });

  it('should handle all three lines equal (zero band width)', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [{ time: 1000, upper: 100, middle: 100, lower: 100 }];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].upper).toBe(100);
    expect(processed[0].middle).toBe(100);
    expect(processed[0].lower).toBe(100);
  });
});

describe('BandPrimitive - Per-Point Color Overrides', () => {
  let mockChart: any;
  let defaultOptions: BandPrimitiveOptions;

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
      middleLineColor: '#00FF00',
      middleLineWidth: 2,
      middleLineStyle: 0,
      middleLineVisible: true,
      lowerLineColor: '#0000FF',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      upperFillColor: 'rgba(255, 0, 0, 0.3)',
      upperFill: true,
      lowerFillColor: 'rgba(0, 0, 255, 0.3)',
      lowerFill: true,
    };
  });

  it('should accept data with per-point color overrides', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperLineColor: '#FFFF00',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].upperLineColor).toBe('#FFFF00');
  });

  it('should handle mixed data (some with color overrides, some without)', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      { time: 1000, upper: 110, middle: 100, lower: 90 }, // No overrides
      {
        time: 2000,
        upper: 115,
        middle: 105,
        lower: 95,
        upperLineColor: '#FF00FF',
      },
      { time: 3000, upper: 120, middle: 110, lower: 100 }, // No overrides
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(3);
    expect(processed[0].upperLineColor).toBeUndefined();
    expect(processed[1].upperLineColor).toBe('#FF00FF');
    expect(processed[2].upperLineColor).toBeUndefined();
  });

  it('should handle complete per-point color overrides', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperLineColor: '#AA0000',
        middleLineColor: '#00AA00',
        lowerLineColor: '#0000AA',
        upperFillColor: 'rgba(170, 0, 0, 0.4)',
        lowerFillColor: 'rgba(0, 0, 170, 0.4)',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#AA0000');
    expect(processed[0].middleLineColor).toBe('#00AA00');
    expect(processed[0].lowerLineColor).toBe('#0000AA');
    expect(processed[0].upperFillColor).toBe('rgba(170, 0, 0, 0.4)');
    expect(processed[0].lowerFillColor).toBe('rgba(0, 0, 170, 0.4)');
  });

  it('should handle partial per-point color overrides', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperLineColor: '#FFFF00', // Only upper line color
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#FFFF00');
    expect(processed[0].middleLineColor).toBeUndefined();
    expect(processed[0].lowerLineColor).toBeUndefined();
    expect(processed[0].upperFillColor).toBeUndefined();
    expect(processed[0].lowerFillColor).toBeUndefined();
  });

  it('should handle only fill color overrides', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperFillColor: 'rgba(255, 255, 0, 0.5)',
        lowerFillColor: 'rgba(0, 255, 255, 0.5)',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperFillColor).toBe('rgba(255, 255, 0, 0.5)');
    expect(processed[0].lowerFillColor).toBe('rgba(0, 255, 255, 0.5)');
    expect(processed[0].upperLineColor).toBeUndefined();
    expect(processed[0].middleLineColor).toBeUndefined();
    expect(processed[0].lowerLineColor).toBeUndefined();
  });

  it('should handle only line color overrides', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperLineColor: '#FFFF00',
        lowerLineColor: '#00FFFF',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#FFFF00');
    expect(processed[0].lowerLineColor).toBe('#00FFFF');
    expect(processed[0].upperFillColor).toBeUndefined();
    expect(processed[0].lowerFillColor).toBeUndefined();
  });

  it('should preserve per-point colors through data updates', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data1: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperLineColor: '#FF0000',
      },
    ];
    const data2: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperLineColor: '#00FF00',
      },
    ];

    primitive.setData(data1);
    let processed = primitive.getProcessedData();
    expect(processed[0].upperLineColor).toBe('#FF0000');

    primitive.setData(data2);
    processed = primitive.getProcessedData();
    expect(processed[0].upperLineColor).toBe('#00FF00');
  });

  it('should handle all three lines with different colors', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperLineColor: '#FF0000',
        middleLineColor: '#00FF00',
        lowerLineColor: '#0000FF',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#FF0000');
    expect(processed[0].middleLineColor).toBe('#00FF00');
    expect(processed[0].lowerLineColor).toBe('#0000FF');
  });

  it('should handle all color properties together', () => {
    const primitive = new BandPrimitive(mockChart, defaultOptions);
    const data: BandPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        middle: 100,
        lower: 90,
        upperLineColor: '#AA0000',
        middleLineColor: '#00AA00',
        lowerLineColor: '#0000AA',
        upperFillColor: 'rgba(170, 170, 0, 0.4)',
        lowerFillColor: 'rgba(0, 170, 170, 0.4)',
      },
      {
        time: 2000,
        upper: 115,
        middle: 105,
        lower: 95,
        upperLineColor: '#BB0000',
        middleLineColor: '#00BB00',
        lowerLineColor: '#0000BB',
        upperFillColor: 'rgba(187, 187, 0, 0.4)',
        lowerFillColor: 'rgba(0, 187, 187, 0.4)',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#AA0000');
    expect(processed[0].middleLineColor).toBe('#00AA00');
    expect(processed[0].lowerLineColor).toBe('#0000AA');
    expect(processed[0].upperFillColor).toBe('rgba(170, 170, 0, 0.4)');
    expect(processed[0].lowerFillColor).toBe('rgba(0, 170, 170, 0.4)');
    expect(processed[1].upperLineColor).toBe('#BB0000');
    expect(processed[1].middleLineColor).toBe('#00BB00');
    expect(processed[1].lowerLineColor).toBe('#0000BB');
    expect(processed[1].upperFillColor).toBe('rgba(187, 187, 0, 0.4)');
    expect(processed[1].lowerFillColor).toBe('rgba(0, 187, 187, 0.4)');
  });
});
