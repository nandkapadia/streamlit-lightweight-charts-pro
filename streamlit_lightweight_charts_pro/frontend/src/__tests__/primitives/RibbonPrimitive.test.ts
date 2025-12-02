/**
 * @vitest-environment jsdom
 * Tests for RibbonPrimitive
 *
 * This primitive renders filled areas between upper and lower lines
 * with z-order control for background rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the module under test
vi.unmock('../../primitives/RibbonPrimitive');

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
  drawFillArea: vi.fn(),
}));

// Import after mocks
import {
  RibbonPrimitive,
  RibbonPrimitiveData,
  RibbonPrimitiveOptions,
} from '../../primitives/RibbonPrimitive';

describe('RibbonPrimitive - Construction', () => {
  let mockChart: any;
  let defaultOptions: RibbonPrimitiveOptions;

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
      fillColor: 'rgba(100, 100, 200, 0.3)',
      fillVisible: true,
    };
  });

  it('should create primitive with default options', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    expect(primitive).toBeDefined();
    expect(primitive.getOptions()).toBeDefined();
  });

  it('should initialize pane and axis views', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const paneViews = primitive.paneViews();
    const axisViews = primitive.priceAxisViews();

    expect(paneViews.length).toBeGreaterThan(0);
    expect(axisViews.length).toBe(2); // Upper and lower axis views
  });

  it('should store chart reference', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    expect(primitive.getChart()).toBe(mockChart);
  });
});

describe('RibbonPrimitive - Data Processing', () => {
  let mockChart: any;
  let defaultOptions: RibbonPrimitiveOptions;
  let primitive: RibbonPrimitive;

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
      fillColor: 'rgba(100, 100, 200, 0.3)',
      fillVisible: true,
    };

    primitive = new RibbonPrimitive(mockChart, defaultOptions);
  });

  it('should process valid data correctly', () => {
    const data: RibbonPrimitiveData[] = [
      { time: 1000, upper: 100, lower: 90 },
      { time: 2000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(2);
    expect(processed[0].upper).toBe(100);
    expect(processed[0].lower).toBe(90);
  });

  it('should filter out null values', () => {
    const data: RibbonPrimitiveData[] = [
      { time: 1000, upper: null, lower: 90 },
      { time: 2000, upper: 110, lower: null },
      { time: 3000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(3000);
  });

  it('should filter out undefined values', () => {
    const data: RibbonPrimitiveData[] = [
      { time: 1000, upper: undefined, lower: 90 },
      { time: 2000, upper: 110, lower: undefined },
      { time: 3000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(3000);
  });

  it('should filter out NaN values', () => {
    const data: RibbonPrimitiveData[] = [
      { time: 1000, upper: NaN, lower: 90 },
      { time: 2000, upper: 110, lower: NaN },
      { time: 3000, upper: 110, lower: 95 },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(3000);
  });

  it('should require both upper and lower to be valid', () => {
    const data: RibbonPrimitiveData[] = [
      { time: 1000, upper: 110 }, // missing lower
      { time: 2000, lower: 90 }, // missing upper
      { time: 3000, upper: 110, lower: 95 }, // both valid
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].time).toBe(3000);
  });
});

describe('RibbonPrimitive - Options Management', () => {
  let mockChart: any;
  let defaultOptions: RibbonPrimitiveOptions;
  let primitive: RibbonPrimitive;

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
      fillColor: 'rgba(100, 100, 200, 0.3)',
      fillVisible: true,
    };

    primitive = new RibbonPrimitive(mockChart, defaultOptions);
  });

  it('should update line colors', () => {
    // @ts-expect-error - updateOptions not implemented yet
    primitive.updateOptions({
      upperLineColor: '#FFFF00',
      lowerLineColor: '#FF00FF',
    });

    const options = primitive.getOptions();
    expect(options.upperLineColor).toBe('#FFFF00');
    expect(options.lowerLineColor).toBe('#FF00FF');
  });

  it('should update line visibility', () => {
    // @ts-expect-error - updateOptions not implemented yet
    primitive.updateOptions({
      upperLineVisible: false,
      lowerLineVisible: false,
    });

    const options = primitive.getOptions();
    expect(options.upperLineVisible).toBe(false);
    expect(options.lowerLineVisible).toBe(false);
  });

  it('should update fill visibility', () => {
    // @ts-expect-error - updateOptions not implemented yet
    primitive.updateOptions({ fillVisible: false });
    expect(primitive.getOptions().fillVisible).toBe(false);
  });

  it('should update fill color', () => {
    // @ts-expect-error - updateOptions not implemented yet
    primitive.updateOptions({ fillColor: 'rgba(200, 200, 200, 0.5)' });
    expect(primitive.getOptions().fillColor).toBe('rgba(200, 200, 200, 0.5)');
  });
});

describe('RibbonPrimitive - Axis Views', () => {
  let mockChart: any;
  let defaultOptions: RibbonPrimitiveOptions;
  let primitive: RibbonPrimitive;
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
      fillColor: 'rgba(100, 100, 200, 0.3)',
      fillVisible: true,
    };

    primitive = new RibbonPrimitive(mockChart, defaultOptions);
    // @ts-expect-error - attachToSeries not implemented yet
    primitive.attachToSeries(mockSeries);
  });

  it('should have two price axis views', () => {
    const axisViews = primitive.priceAxisViews();
    expect(axisViews).toHaveLength(2);
  });

  it('should provide upper line axis view', () => {
    const data: RibbonPrimitiveData[] = [
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
    const data: RibbonPrimitiveData[] = [
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

describe('RibbonPrimitive - Edge Cases', () => {
  let mockChart: any;
  let defaultOptions: RibbonPrimitiveOptions;

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
      fillColor: 'rgba(100, 100, 200, 0.3)',
      fillVisible: true,
    };
  });

  it('should handle empty data array', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    primitive.setData([]);

    expect(primitive.getProcessedData()).toHaveLength(0);
  });

  it('should handle data with all invalid values', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      { time: 1000, upper: null, lower: null },
      { time: 2000, upper: undefined, lower: undefined },
      { time: 3000, upper: NaN, lower: NaN },
    ];

    primitive.setData(data);
    expect(primitive.getProcessedData()).toHaveLength(0);
  });

  it('should handle upper less than lower (crossing lines)', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      { time: 1000, upper: 90, lower: 100 }, // Inverted
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].upper).toBe(90);
    expect(processed[0].lower).toBe(100);
  });

  it('should handle upper equal to lower (zero ribbon width)', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [{ time: 1000, upper: 100, lower: 100 }];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(1);
    expect(processed[0].upper).toBe(100);
    expect(processed[0].lower).toBe(100);
  });
});

describe('RibbonPrimitive - Per-Point Color Overrides', () => {
  let mockChart: any;
  let defaultOptions: RibbonPrimitiveOptions;

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
      lowerLineColor: '#0000FF',
      lowerLineWidth: 2,
      lowerLineStyle: 0,
      lowerLineVisible: true,
      fillColor: 'rgba(128, 128, 128, 0.3)',
      fillVisible: true,
    };
  });

  it('should accept data with per-point color overrides', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
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
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      { time: 1000, upper: 110, lower: 90 }, // No overrides
      {
        time: 2000,
        upper: 115,
        lower: 95,
        upperLineColor: '#FF00FF',
      },
      { time: 3000, upper: 120, lower: 100 }, // No overrides
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed).toHaveLength(3);
    expect(processed[0].upperLineColor).toBeUndefined();
    expect(processed[1].upperLineColor).toBe('#FF00FF');
    expect(processed[2].upperLineColor).toBeUndefined();
  });

  it('should handle complete per-point color overrides', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        lower: 90,
        upperLineColor: '#AA0000',
        lowerLineColor: '#0000AA',
        fill: 'rgba(170, 0, 0, 0.4)',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#AA0000');
    expect(processed[0].lowerLineColor).toBe('#0000AA');
    expect(processed[0].fill).toBe('rgba(170, 0, 0, 0.4)');
  });

  it('should handle partial per-point color overrides', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        lower: 90,
        upperLineColor: '#FFFF00', // Only upper line color
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#FFFF00');
    expect(processed[0].lowerLineColor).toBeUndefined();
    expect(processed[0].fill).toBeUndefined();
  });

  it('should handle only fill color overrides', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        lower: 90,
        fill: 'rgba(255, 255, 0, 0.5)',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].fill).toBe('rgba(255, 255, 0, 0.5)');
    expect(processed[0].upperLineColor).toBeUndefined();
    expect(processed[0].lowerLineColor).toBeUndefined();
  });

  it('should handle only line color overrides', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        lower: 90,
        upperLineColor: '#FFFF00',
        lowerLineColor: '#00FFFF',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#FFFF00');
    expect(processed[0].lowerLineColor).toBe('#00FFFF');
    expect(processed[0].fill).toBeUndefined();
  });

  it('should preserve per-point colors through data updates', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data1: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        lower: 90,
        upperLineColor: '#FF0000',
      },
    ];
    const data2: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
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

  it('should handle upper and lower line with different colors', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        lower: 90,
        upperLineColor: '#FF0000',
        lowerLineColor: '#0000FF',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#FF0000');
    expect(processed[0].lowerLineColor).toBe('#0000FF');
  });

  it('should handle all color properties together', () => {
    const primitive = new RibbonPrimitive(mockChart, defaultOptions);
    const data: RibbonPrimitiveData[] = [
      {
        time: 1000,
        upper: 110,
        lower: 90,
        upperLineColor: '#AA0000',
        lowerLineColor: '#0000AA',
        fill: 'rgba(170, 170, 0, 0.4)',
      },
      {
        time: 2000,
        upper: 115,
        lower: 95,
        upperLineColor: '#00AA00',
        lowerLineColor: '#AA00AA',
        fill: 'rgba(0, 170, 170, 0.4)',
      },
    ];

    primitive.setData(data);
    const processed = primitive.getProcessedData();

    expect(processed[0].upperLineColor).toBe('#AA0000');
    expect(processed[0].lowerLineColor).toBe('#0000AA');
    expect(processed[0].fill).toBe('rgba(170, 170, 0, 0.4)');
    expect(processed[1].upperLineColor).toBe('#00AA00');
    expect(processed[1].lowerLineColor).toBe('#AA00AA');
    expect(processed[1].fill).toBe('rgba(0, 170, 170, 0.4)');
  });
});
