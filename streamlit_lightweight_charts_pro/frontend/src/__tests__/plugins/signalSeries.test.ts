/**
 * @fileoverview Comprehensive tests for SignalSeries plugin
 *
 * Tests signal series with background band functionality,
 * covering default values, boolean logic patterns, and signal processing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SignalSeries,
  createSignalSeriesPlugin,
  SignalData,
  SignalSeriesConfig
} from '../../plugins/series/signalSeriesPlugin';

// Mock lightweight-charts
const mockChart = {
  addSeries: vi.fn(),
  timeScale: vi.fn(() => ({
    timeToCoordinate: vi.fn((time) => 100 + Math.random() * 300),
    options: vi.fn(() => ({ barSpacing: 6 })),
  })),
  priceScale: vi.fn(() => ({
    priceToCoordinate: vi.fn((price) => 100 + Math.random() * 300),
  })),
  removeSeries: vi.fn(),
  chartElement: vi.fn(() => ({
    clientWidth: 800,
    clientHeight: 400,
  })),
};

const mockSeries = {
  setData: vi.fn(),
  update: vi.fn(),
  applyOptions: vi.fn(),
  attachPrimitive: vi.fn(),
  priceToCoordinate: vi.fn((price) => 100 + Math.random() * 300),
  options: vi.fn(() => ({
    crosshairMarkerVisible: false,
    lineWidth: 3,
    lineVisible: false,
  })),
};

vi.mock('lightweight-charts', () => ({
  LineSeries: {},
}));

vi.mock('../../utils/lightweightChartsUtils', () => ({
  asLineWidth: vi.fn((width) => width),
}));

describe('SignalSeries Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChart.addSeries.mockReturnValue(mockSeries);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Default Values Consistency', () => {
    it('should use correct default visibility', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const options = signal.getOptions();

      expect(options.visible).toBe(true);
    });

    it('should create dummy series with correct defaults', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      new SignalSeries(mockChart as any, config);

      // Should create one dummy series
      expect(mockChart.addSeries).toHaveBeenCalledTimes(1);

      // Check dummy series options
      const seriesOptions = mockChart.addSeries.mock.calls[0][1];
      expect(seriesOptions.color).toBe('transparent');
      expect(seriesOptions.lineWidth).toBe(3); // Python default
      expect(seriesOptions.visible).toBe(false); // Dummy series should be hidden
      expect(seriesOptions.crosshairMarkerVisible).toBe(false);
      expect(seriesOptions.lineVisible).toBe(false);
    });

    it('should handle pane ID correctly', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
        paneId: 1,
      };

      new SignalSeries(mockChart as any, config);

      // Should pass pane ID to addSeries
      expect(mockChart.addSeries).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        1
      );
    });
  });

  describe('Series Creation and Management', () => {
    it('should create dummy series for signal background', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      expect(mockChart.addSeries).toHaveBeenCalledTimes(1);
      expect(mockSeries.attachPrimitive).toHaveBeenCalledWith(signal);
    });

    it('should provide access to chart', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      expect(signal.getChart()).toBe(mockChart);
    });

    it('should provide access to background bands', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [
          { time: '2023-01-01', value: 1, color: '#FF0000' },
          { time: '2023-01-02', value: 0, color: '#00FF00' },
        ],
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#00FF00',
          alertColor: '#0000FF'
        },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const bands = signal.getBackgroundBands();

      expect(bands).toHaveLength(2);
    });
  });

  describe('Signal Data Processing', () => {
    it('should process signal data correctly', () => {
      const testData: SignalData[] = [
        { time: '2023-01-01', value: 1, color: '#FF0000' },
        { time: '2023-01-02', value: 0, color: '#00FF00' },
        { time: '2023-01-03', value: -1, color: '#0000FF' },
      ];

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: testData,
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#00FF00',
          alertColor: '#0000FF'
        },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const bands = signal.getBackgroundBands();

      expect(bands).toHaveLength(3);
      expect(bands[0].color).toBe('#FF0000');
      expect(bands[1].color).toBe('#00FF00');
      expect(bands[2].color).toBe('#0000FF');
    });

    it('should handle boolean signal values', () => {
      const testData: SignalData[] = [
        { time: '2023-01-01', value: 1 }, // Will be converted to boolean true
        { time: '2023-01-02', value: 0 }, // Will be converted to boolean false
      ];

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: testData,
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#808080',
        },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const bands = signal.getBackgroundBands();

      expect(bands).toHaveLength(2);
      expect(bands[0].color).toBe('#FF0000'); // signal color for positive
      expect(bands[1].color).toBe('#808080'); // neutral color for zero
    });

    it('should use individual colors when provided', () => {
      const testData: SignalData[] = [
        { time: '2023-01-01', value: 1, color: '#CUSTOM1' },
        { time: '2023-01-02', value: 0, color: '#CUSTOM2' },
      ];

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: testData,
        options: {
          visible: true,
          signalColor: '#DEFAULT',
        },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const bands = signal.getBackgroundBands();

      expect(bands[0].color).toBe('#CUSTOM1'); // Should use individual color
      expect(bands[1].color).toBe('#CUSTOM2'); // Should use individual color
    });

    it('should filter out transparent colors', () => {
      const testData: SignalData[] = [
        { time: '2023-01-01', value: 1, color: 'transparent' },
        { time: '2023-01-02', value: 1, color: 'rgba(255, 0, 0, 0)' },
        { time: '2023-01-03', value: 1, color: '#FF000000' },
        { time: '2023-01-04', value: 1, color: '#FF0000' }, // Visible
      ];

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: testData,
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#00FF00',
          alertColor: '#0000FF'
        },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const bands = signal.getBackgroundBands();

      // Should only have 1 band (the visible one)
      expect(bands).toHaveLength(1);
      expect(bands[0].color).toBe('#FF0000');
    });

    it('should handle color fallback correctly', () => {
      const testData: SignalData[] = [
        { time: '2023-01-01', value: 1 }, // No individual color
        { time: '2023-01-02', value: 0 }, // No individual color
        { time: '2023-01-03', value: -1 }, // No individual color
      ];

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: testData,
        options: {
          visible: true,
          signalColor: '#00FF00',
          neutralColor: '#808080',
          alertColor: '#FF0000',
        },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const bands = signal.getBackgroundBands();

      expect(bands).toHaveLength(3);
      expect(bands[0].color).toBe('#00FF00'); // signalColor for positive
      expect(bands[1].color).toBe('#808080'); // neutralColor for zero
      expect(bands[2].color).toBe('#FF0000'); // alertColor for negative
    });
  });

  describe('Data Management', () => {
    it('should set signals correctly', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#00FF00',
          alertColor: '#0000FF'
        },
      };

      const signal = new SignalSeries(mockChart as any, config);

      const testData: SignalData[] = [
        { time: '2023-01-01', value: 1, color: '#FF0000' },
        { time: '2023-01-02', value: 0, color: '#00FF00' },
      ];

      signal.setSignals(testData);
      const bands = signal.getBackgroundBands();

      expect(bands).toHaveLength(2);
    });

    it('should update data correctly', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [{ time: '2023-01-01', value: 1 }],
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#00FF00',
          alertColor: '#0000FF'
        },
      };

      const signal = new SignalSeries(mockChart as any, config);

      const newData: SignalData[] = [
        { time: '2023-01-01', value: 1 },
        { time: '2023-01-02', value: 0 },
      ];

      signal.updateData(newData);
      const bands = signal.getBackgroundBands();

      expect(bands).toHaveLength(2);
    });

    it('should update single data point correctly', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [{ time: '2023-01-01', value: 1 }],
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#00FF00',
          alertColor: '#0000FF'
        },
      };

      const signal = new SignalSeries(mockChart as any, config);

      // Update existing point
      signal.update({ time: '2023-01-01', value: 0 });
      let bands = signal.getBackgroundBands();
      expect(bands).toHaveLength(1);

      // Add new point
      signal.update({ time: '2023-01-02', value: 1 });
      bands = signal.getBackgroundBands();
      expect(bands).toHaveLength(2);
    });
  });

  describe('Options Management', () => {
    it('should update visibility correctly', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      signal.setVisible(false);

      const options = signal.getOptions();
      expect(options.visible).toBe(false);
    });

    it('should apply options correctly', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      signal.applyOptions({
        signalColor: '#FF0000',
        neutralColor: '#808080',
        alertColor: '#0000FF',
        visible: false,
      });

      const options = signal.getOptions();
      expect(options.signalColor).toBe('#FF0000');
      expect(options.neutralColor).toBe('#808080');
      expect(options.alertColor).toBe('#0000FF');
      expect(options.visible).toBe(false);
    });

    it('should update options and reprocess data', () => {
      const testData: SignalData[] = [
        { time: '2023-01-01', value: 1 },
      ];

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: testData,
        options: {
          visible: true,
          signalColor: '#FF0000',
        },
      };

      const signal = new SignalSeries(mockChart as any, config);

      let bands = signal.getBackgroundBands();
      expect(bands[0].color).toBe('#FF0000');

      // Update signal color
      signal.updateOptions({
        signalColor: '#00FF00',
        visible: true,
      });

      bands = signal.getBackgroundBands();
      expect(bands[0].color).toBe('#00FF00');
    });
  });

  describe('Canvas Rendering Integration', () => {
    it('should have proper pane views for background rendering', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const paneViews = signal.paneViews();

      expect(paneViews).toHaveLength(1);
      expect(paneViews[0]).toBeDefined();
    });

    it('should update all views when data changes', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const spy = vi.spyOn(signal, 'updateAllViews');

      signal.setData([{ time: '2023-01-01', value: 1 }]);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove dummy series on cleanup', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      signal.destroy();

      expect(mockChart.removeSeries).toHaveBeenCalledTimes(1);
    });

    it('should remove series via remove method', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      signal.remove();

      expect(mockChart.removeSeries).toHaveBeenCalledTimes(1);
    });
  });

  describe('Factory Functions', () => {
    it('should create signal series via factory function', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [{ time: '2023-01-01', value: 1 }],
        options: {
          visible: true,
          signalColor: '#FF0000',
        },
      };

      const signal = createSignalSeriesPlugin(mockChart as any, config);

      expect(signal).toBeInstanceOf(SignalSeries);
      expect(signal.getOptions().signalColor).toBe('#FF0000');
    });
  });

  describe('Compatibility Methods', () => {
    it('should provide ISeriesApi compatible methods', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      // Test priceScale method
      expect(signal.priceScale()).toBeDefined();

      // Test setData method
      expect(() => {
        signal.setData([{ time: '2023-01-01', value: 1 }]);
      }).not.toThrow();
    });

    it('should handle addToChart method for test compatibility', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      expect(() => {
        signal.addToChart(mockChart as any);
      }).not.toThrow();
    });
  });

  describe('Performance with Signal Processing', () => {
    it('should handle large signal datasets efficiently', () => {
      const largeData: SignalData[] = Array.from({ length: 5000 }, (_, i) => ({
        time: `2023-01-${(i % 30) + 1}`,
        value: Math.random() > 0.5 ? 1 : 0,
        color: Math.random() > 0.5 ? '#FF0000' : '#00FF00',
      }));

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: largeData,
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#00FF00',
          alertColor: '#0000FF'
        },
      };

      const start = performance.now();
      const signal = new SignalSeries(mockChart as any, config);
      const duration = performance.now() - start;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);
      expect(signal.getBackgroundBands().length).toBeLessThanOrEqual(5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid signal data gracefully', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      expect(() => {
        signal.setSignals([]);
      }).not.toThrow();

      expect(() => {
        signal.updateData([]);
      }).not.toThrow();
    });

    it('should handle malformed signal data', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [],
        options: { visible: true },
      };

      const signal = new SignalSeries(mockChart as any, config);

      expect(() => {
        signal.setSignals([
          { time: '2023-01-01', value: NaN } as any,
        ]);
      }).not.toThrow();
    });

    it('should handle missing options gracefully', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [{ time: '2023-01-01', value: 1 }],
        options: { visible: true },
      };

      expect(() => {
        new SignalSeries(mockChart as any, config);
      }).not.toThrow();
    });
  });

  describe('Time Parsing', () => {
    it('should parse string timestamps correctly', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [{ time: '2023-01-01', value: 1 }],
        options: { visible: true },
      };

      expect(() => {
        new SignalSeries(mockChart as any, config);
      }).not.toThrow();
    });

    it('should parse numeric timestamps correctly', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [{ time: 1672531200, value: 1 }], // Unix timestamp
        options: { visible: true },
      };

      expect(() => {
        new SignalSeries(mockChart as any, config);
      }).not.toThrow();
    });

    it('should handle millisecond timestamps', () => {
      const config: SignalSeriesConfig = {
        type: 'signal',
        data: [{ time: 1672531200000, value: 1 }], // Millisecond timestamp
        options: { visible: true },
      };

      expect(() => {
        new SignalSeries(mockChart as any, config);
      }).not.toThrow();
    });
  });

  describe('Color Transparency Detection', () => {
    it('should detect transparent colors correctly', () => {
      const transparentData: SignalData[] = [
        { time: '2023-01-01', value: 1, color: 'transparent' },
        { time: '2023-01-02', value: 1, color: 'rgba(255, 0, 0, 0)' },
        { time: '2023-01-03', value: 1, color: '#FF000000' },
        { time: '2023-01-04', value: 1, color: '#F000' }, // 4-digit hex with alpha 0
      ];

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: transparentData,
        options: {
          visible: true,
          signalColor: 'transparent', // Make series-level colors transparent too
          neutralColor: 'rgba(0, 0, 0, 0)',
          alertColor: '#FF000000'
        },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const bands = signal.getBackgroundBands();

      // All should be filtered out due to transparency
      expect(bands).toHaveLength(0);
    });

    it('should keep opaque colors', () => {
      const opaqueData: SignalData[] = [
        { time: '2023-01-01', value: 1, color: '#FF0000' },
        { time: '2023-01-02', value: 1, color: 'rgba(255, 0, 0, 1)' },
        { time: '2023-01-03', value: 1, color: 'rgba(255, 0, 0, 0.5)' },
      ];

      const config: SignalSeriesConfig = {
        type: 'signal',
        data: opaqueData,
        options: {
          visible: true,
          signalColor: '#FF0000',
          neutralColor: '#00FF00',
          alertColor: '#0000FF'
        },
      };

      const signal = new SignalSeries(mockChart as any, config);
      const bands = signal.getBackgroundBands();

      // All should be kept as they have opacity
      expect(bands).toHaveLength(3);
    });
  });
});
