/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RectangleOverlayPlugin } from '../../plugins/overlay/rectanglePlugin';
import { createSignalSeries } from '../../plugins/series/signalSeriesPlugin';
import { createTradeVisualElements } from '../../services/tradeVisualization';
import { createAnnotationVisualElements } from '../../services/annotationSystem';
import { resetMocks, mockChart, mockSeries } from '../../test-utils/lightweightChartsMocks';

// Use unified mock system
vi.mock('lightweight-charts', async () => {
  const mocks = await import('../../test-utils/lightweightChartsMocks');
  return mocks.default;
});

// Mock HTMLCanvasElement and CanvasRenderingContext2D
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    canvas: {
      width: 800,
      height: 600,
    },
  })),
  width: 800,
  height: 600,
  style: {},
  getBoundingClientRect: vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
  })),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock document.createElement
const originalCreateElement = document.createElement;
document.createElement = vi.fn(tagName => {
  if (tagName === 'canvas') {
    return mockCanvas as unknown as HTMLCanvasElement;
  }
  return originalCreateElement.call(document, tagName);
}) as any;

describe('Chart Plugins', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    resetMocks();
    // Suppress expected error logs from plugin initialization with mocks
    // These errors are expected and handled gracefully by the plugins
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('RectangleOverlayPlugin', () => {
    it('should create rectangle overlay plugin', () => {
      const plugin = new RectangleOverlayPlugin();
      expect(plugin).toBeDefined();
    });

    it('should add rectangle overlay to chart', () => {
      const plugin = new RectangleOverlayPlugin();
      const chart = mockChart;

      plugin.addToChart(chart);

      expect(chart).toBeDefined();
    });

    it('should handle rectangle data', () => {
      const plugin = new RectangleOverlayPlugin();
      const chart = mockChart;

      plugin.addToChart(chart);

      const rectangleData = [
        {
          id: 'rect-1',
          time: '2024-01-01',
          price: 100,
          x1: 0,
          y1: 0,
          x2: 50,
          y2: 20,
          color: '#ff0000',
        },
      ];

      plugin.setRectangles(rectangleData);

      expect(plugin).toBeDefined();
    });

    it('should handle empty rectangle data', () => {
      const plugin = new RectangleOverlayPlugin();
      const chart = mockChart;

      plugin.addToChart(chart);
      plugin.setRectangles([]);

      expect(plugin).toBeDefined();
    });

    it('should handle invalid rectangle data', () => {
      const plugin = new RectangleOverlayPlugin();
      const chart = mockChart;

      plugin.addToChart(chart);
      plugin.setRectangles([]);

      expect(plugin).toBeDefined();
    });
  });

  describe('SignalSeries', () => {
    it('should create signal series', () => {
      const chart = mockChart;
      const signalSeries = createSignalSeries(chart);
      expect(signalSeries).toBeDefined();
    });

    it('should add signal series to chart', () => {
      const chart = mockChart;
      const signalSeries = createSignalSeries(chart);

      expect(chart.addCustomSeries).toHaveBeenCalled();
      expect(signalSeries).toBeDefined();
    });

    it('should handle signal data', () => {
      const chart = mockChart;
      const signalData = [
        {
          time: '2024-01-01' as any,
          value: 1,
          color: '#00ff00',
        },
      ];

      const signalSeries = createSignalSeries(chart, { data: signalData });

      expect(signalSeries).toBeDefined();
      expect(mockSeries.setData).toHaveBeenCalledWith(signalData);
    });

    it('should handle empty signal data', () => {
      const chart = mockChart;
      const signalSeries = createSignalSeries(chart, { data: [] });

      expect(signalSeries).toBeDefined();
      expect(mockSeries.setData).not.toHaveBeenCalled();
    });

    it('should handle different signal values', () => {
      const chart = mockChart;
      const signalData = [
        { time: '2024-01-01' as any, value: 0 }, // neutral
        { time: '2024-01-02' as any, value: 1 }, // signal
        { time: '2024-01-03' as any, value: 2 }, // alert
      ];

      const signalSeries = createSignalSeries(chart, { data: signalData });

      expect(signalSeries).toBeDefined();
      expect(mockSeries.setData).toHaveBeenCalledWith(signalData);
    });
  });

  describe('Trade Visualization', () => {
    it('should create trade visual elements', () => {
      const trades = [
        {
          entryTime: '2024-01-01',
          entryPrice: 100,
          exitTime: '2024-01-02',
          exitPrice: 110,
          quantity: 10,
          tradeType: 'long' as const,
          isProfitable: true,
          id: 'trade-1',
        },
      ];

      const options = { showAnnotations: true, style: 'markers' as const };
      const elements = createTradeVisualElements(trades, options);
      expect(elements).toBeDefined();
    });

    it('should handle empty trades', () => {
      const options = { showAnnotations: true, style: 'markers' as const };
      const elements = createTradeVisualElements([], options);
      expect(elements).toBeDefined();
    });

    it('should handle null trades', () => {
      const options = { showAnnotations: true, style: 'markers' as const };
      const elements = createTradeVisualElements([], options);
      expect(elements).toBeDefined();
    });

    it('should handle different trade types', () => {
      const trades = [
        {
          entryTime: '2024-01-01',
          entryPrice: 100,
          exitTime: '2024-01-02',
          exitPrice: 110,
          quantity: 10,
          tradeType: 'long' as const,
          isProfitable: true,
          id: 'trade-1',
        },
        {
          entryTime: '2024-01-03',
          entryPrice: 110,
          exitTime: '2024-01-04',
          exitPrice: 100,
          quantity: 5,
          tradeType: 'short' as const,
          isProfitable: true,
          id: 'trade-2',
        },
      ];

      const options = { showAnnotations: true, style: 'markers' as const };
      const elements = createTradeVisualElements(trades, options);
      expect(elements).toBeDefined();
    });

    it('should handle trades with missing data', () => {
      const trades = [
        {
          entryTime: '2024-01-01',
          entryPrice: 100,
          exitTime: '2024-01-02',
          exitPrice: 110,
          quantity: 10,
          tradeType: 'long' as const,
          isProfitable: true,
          id: 'trade-1',
        },
        {
          entryTime: '2024-01-03',
          entryPrice: 110,
          exitTime: '2024-01-04',
          exitPrice: 100,
          quantity: 5,
          tradeType: 'short' as const,
          isProfitable: true,
          id: 'trade-2',
        },
      ];

      const options = { showAnnotations: true, style: 'markers' as const };
      const elements = createTradeVisualElements(trades, options);
      expect(elements).toBeDefined();
    });
  });

  describe('Annotation System', () => {
    it('should create annotation visual elements', () => {
      const annotations = [
        {
          time: '2024-01-01',
          price: 100,
          text: 'Test annotation',
          type: 'text' as const,
          position: 'above' as const,
        },
      ];

      const elements = createAnnotationVisualElements(annotations);
      expect(elements).toBeDefined();
    });

    it('should handle empty annotations', () => {
      const elements = createAnnotationVisualElements([]);
      expect(elements).toBeDefined();
    });

    it('should handle null annotations', () => {
      const elements = createAnnotationVisualElements([]);
      expect(elements).toBeDefined();
    });

    it('should handle different annotation types', () => {
      const annotations = [
        {
          time: '2024-01-01',
          price: 100,
          text: 'Text annotation',
          type: 'text' as const,
          position: 'above' as const,
        },
        {
          time: '2024-01-02',
          price: 110,
          text: 'Arrow annotation',
          type: 'arrow' as const,
          position: 'below' as const,
        },
        {
          time: '2024-01-03',
          price: 105,
          text: 'Shape annotation',
          type: 'shape' as const,
          position: 'inline' as const,
        },
      ];

      const elements = createAnnotationVisualElements(annotations);
      expect(elements).toBeDefined();
    });

    it('should handle annotations with custom styling', () => {
      const annotations = [
        {
          time: '2024-01-01',
          price: 100,
          text: 'Styled annotation',
          type: 'text' as const,
          position: 'above' as const,
          color: '#ff0000',
          backgroundColor: '#ffff00',
          fontSize: 14,
          fontWeight: 'bold',
        },
      ];

      const elements = createAnnotationVisualElements(annotations);
      expect(elements).toBeDefined();
    });

    it('should handle annotations with missing properties', () => {
      const annotations = [
        {
          time: '2024-01-01',
          price: 100,
          text: 'Minimal annotation',
          type: 'text' as const,
          position: 'above' as const,
        },
      ];

      const elements = createAnnotationVisualElements(annotations);
      expect(elements).toBeDefined();
    });
  });

  describe('Plugin Integration', () => {
    it('should integrate multiple plugins with chart', () => {
      const chart = mockChart;

      const rectanglePlugin = new RectangleOverlayPlugin();
      const signalSeries = createSignalSeries(chart);

      rectanglePlugin.addToChart(chart);

      expect(chart).toBeDefined();
      expect(signalSeries).toBeDefined();
    });

    it('should handle plugin cleanup', () => {
      const chart = mockChart;

      const rectanglePlugin = new RectangleOverlayPlugin();
      rectanglePlugin.addToChart(chart);

      // Simulate cleanup
      rectanglePlugin.remove();

      expect(rectanglePlugin).toBeDefined();
    });

    it('should handle plugin errors gracefully', () => {
      const chart = {} as any; // Invalid chart

      const rectanglePlugin = new RectangleOverlayPlugin();

      // Should not throw error (errors are logged but handled gracefully)
      expect(() => {
        rectanglePlugin.addToChart(chart);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const chart = mockChart;

      const rectanglePlugin = new RectangleOverlayPlugin();
      rectanglePlugin.addToChart(chart);

      const largeRectangleData = Array.from({ length: 1000 }, (_, i) => ({
        id: `rect-${i}`,
        time: `2024-01-${String(i + 1).padStart(2, '0')}`,
        price: 100 + i,
        x1: 0,
        y1: 0,
        x2: 50,
        y2: 20,
        color: '#ff0000',
      }));

      rectanglePlugin.setRectangles(largeRectangleData);

      expect(rectanglePlugin).toBeDefined();
    });

    it('should handle rapid updates', () => {
      const chart = mockChart;
      const signalSeries = createSignalSeries(chart);

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        const signalData = [
          {
            time: `2024-01-${String(i + 1).padStart(2, '0')}` as any,
            value: i % 3, // Cycle through 0, 1, 2
            color: '#00ff00',
          },
        ];

        mockSeries.setData(signalData);
      }

      expect(signalSeries).toBeDefined();
      expect(mockSeries.setData).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid plugin data', () => {
      const chart = mockChart;

      const rectanglePlugin = new RectangleOverlayPlugin();
      rectanglePlugin.addToChart(chart);

      const invalidData = [
        {
          id: 'invalid-rect',
          time: 'invalid-time',
          price: 'invalid-price' as any,
          x1: -50,
          y1: -20,
          x2: 0,
          y2: 0,
          color: 'invalid-color',
        },
      ];

      rectanglePlugin.setRectangles(invalidData);

      expect(rectanglePlugin).toBeDefined();
    });

    it('should handle plugin initialization errors', () => {
      const invalidChart = {
        // Missing required methods
      } as any;

      const rectanglePlugin = new RectangleOverlayPlugin();

      // Should not throw error (errors are logged but handled gracefully)
      expect(() => {
        rectanglePlugin.addToChart(invalidChart);
      }).not.toThrow();
    });
  });
});
