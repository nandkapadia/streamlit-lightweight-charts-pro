/**
 * @fileoverview Centralized mock factory system following DRY principles
 *
 * This module provides a unified interface for creating all types of mocks
 * used across the test suite, ensuring consistency and maintainability.
 */

import { vi, type MockedFunction } from 'vitest';
import {
  IChartApi,
  ISeriesApi,
  ChartOptions,
  SeriesType,
  SeriesOptionsMap,
} from 'lightweight-charts';

// Base mock configuration interface
export interface MockConfig {
  withPerformanceDelay?: boolean;
  shouldThrowErrors?: boolean;
  enableMemoryTracking?: boolean;
  customBehavior?: Record<string, unknown>;
}

// Memory tracking for leak detection
const mockReferences = new WeakSet();

export function trackMockObject<T extends object>(obj: T): T {
  mockReferences.add(obj);
  return obj;
}

/**
 * Centralized Mock Factory
 *
 * Provides consistent mock creation with configurable behavior,
 * performance simulation, and memory tracking capabilities.
 */
export class MockFactory {
  private static defaultConfig: MockConfig = {
    withPerformanceDelay: false,
    shouldThrowErrors: false,
    enableMemoryTracking: true,
    customBehavior: {},
  };

  /**
   * Configure default behavior for all mocks
   */
  static configure(config: Partial<MockConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Reset all mocks to their initial state
   */
  static resetAll(): void {
    vi.clearAllMocks();
  }

  /**
   * Create a mock series API with configurable behavior
   */
  static createSeries(config: MockConfig = {}): ISeriesApi<keyof SeriesOptionsMap> {
    const finalConfig = { ...this.defaultConfig, ...config };

    const series = {
      // Data management
      setData: vi.fn().mockImplementation(data => {
        if (finalConfig.withPerformanceDelay) {
          const start = performance.now();
          while (performance.now() - start < 1) {
            /* simulate work */
          }
        }
        if (finalConfig.shouldThrowErrors && Math.random() < 0.1) {
          throw new Error('Mock series setData error');
        }
      }),

      update: vi.fn().mockImplementation(data => {
        if (finalConfig.withPerformanceDelay) {
          const start = performance.now();
          while (performance.now() - start < 0.5) {
            /* simulate work */
          }
        }
      }),

      // Configuration
      applyOptions: vi.fn(),
      options: vi.fn(() => ({})),

      // Coordinate conversion
      coordinateToPrice: vi.fn((coordinate: number) => coordinate * 0.01),
      priceToCoordinate: vi.fn((price: number) => price * 100),

      // Data access
      dataByIndex: vi.fn((index: number) => ({
        time: Date.now() + index * 86400000,
        value: 100 + Math.random() * 20,
      })),

      // Markers and primitives
      setMarkers: vi.fn(),
      markers: vi.fn(() => []),
      attachPrimitive: vi.fn(),
      detachPrimitive: vi.fn(),

      // Lifecycle
      destroy: vi.fn(),

      // Chart reference (circular dependency handled later)
      chart: vi.fn(() => null),
    } as unknown as ISeriesApi<keyof SeriesOptionsMap>;

    return finalConfig.enableMemoryTracking ? trackMockObject(series) : series;
  }

  /**
   * Create a mock chart API with full functionality
   */
  static createChart(config: MockConfig = {}): IChartApi {
    const finalConfig = { ...this.defaultConfig, ...config };
    let seriesCounter = 0;
    const chartSeries: ISeriesApi<keyof SeriesOptionsMap>[] = [];

    const chart = {
      // Series management
      addSeries: vi.fn().mockImplementation((seriesType: SeriesType, options = {}) => {
        if (finalConfig.withPerformanceDelay) {
          const start = performance.now();
          while (performance.now() - start < 2) {
            /* simulate series creation */
          }
        }

        if (finalConfig.shouldThrowErrors && seriesCounter > 10) {
          throw new Error('Too many series');
        }

        const series = this.createSeries(finalConfig);
        chartSeries.push(series);
        seriesCounter++;
        return series;
      }),

      removeSeries: vi.fn().mockImplementation((series: ISeriesApi<keyof SeriesOptionsMap>) => {
        const index = chartSeries.indexOf(series);
        if (index > -1) {
          chartSeries.splice(index, 1);
          seriesCounter--;
        }
      }),

      // Chart lifecycle
      remove: vi.fn().mockImplementation(() => {
        if (finalConfig.withPerformanceDelay) {
          const start = performance.now();
          while (performance.now() - start < 5) {
            /* simulate cleanup */
          }
        }
        chartSeries.length = 0;
        seriesCounter = 0;
      }),

      // Layout and rendering
      resize: vi.fn().mockImplementation((width: number, height: number) => {
        if (finalConfig.withPerformanceDelay) {
          const start = performance.now();
          while (performance.now() - start < 3) {
            /* simulate resize */
          }
        }
        if (finalConfig.shouldThrowErrors && (width < 0 || height < 0)) {
          throw new Error('Invalid dimensions');
        }
      }),

      applyOptions: vi.fn(),
      options: vi.fn(() => ({ width: 800, height: 600 })),

      // Scales
      timeScale: vi.fn(() => ({
        fitContent: vi.fn(),
        scrollToPosition: vi.fn(),
        scrollToRealTime: vi.fn(),
        getVisibleRange: vi.fn(() => ({ from: 0, to: 100 })),
        setVisibleRange: vi.fn(),
        getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 100 })),
        setVisibleLogicalRange: vi.fn(),
        coordinateToTime: vi.fn((coordinate: number) => Date.now() + coordinate * 1000),
        timeToCoordinate: vi.fn((time: number) => (time - Date.now()) / 1000),
        width: vi.fn(() => 800),
        height: vi.fn(() => 600),
        subscribeVisibleTimeRangeChange: vi.fn(),
        unsubscribeVisibleTimeRangeChange: vi.fn(),
        subscribeVisibleLogicalRangeChange: vi.fn(),
        unsubscribeVisibleLogicalRangeChange: vi.fn(),
        subscribeSizeChange: vi.fn(),
        unsubscribeSizeChange: vi.fn(),
      })),

      priceScale: vi.fn((priceScaleId = 'right') => ({
        applyOptions: vi.fn(),
        options: vi.fn(() => ({ visible: true })),
        width: vi.fn(() => 60),
        coordinateToPrice: vi.fn((coordinate: number) => coordinate * 0.01),
        priceToCoordinate: vi.fn((price: number) => price * 100),
        formatPrice: vi.fn((price: number) => price.toFixed(2)),
      })),

      // Events
      subscribeCrosshairMove: vi.fn(),
      unsubscribeCrosshairMove: vi.fn(),
      subscribeClick: vi.fn(),
      unsubscribeClick: vi.fn(),
      subscribeDblClick: vi.fn(),
      unsubscribeDblClick: vi.fn(),

      // Primitives and plugins
      attachPrimitive: vi.fn(),
      detachPrimitive: vi.fn(),

      // Chart panes
      panes: vi.fn(() => []),
      createPane: vi.fn(),

      // Internal state for testing
      _seriesCount: () => seriesCounter,
      _getSeries: () => [...chartSeries],
    } as unknown as IChartApi;

    // Link series back to chart
    chartSeries.forEach(series => {
      if ('chart' in series && typeof series.chart === 'function') {
        (series.chart as MockedFunction<any>).mockImplementation(() => chart);
      }
    });

    return finalConfig.enableMemoryTracking ? trackMockObject(chart) : chart;
  }

  /**
   * Create lightweight-charts module mock
   */
  static createLightweightChartsModule(config: MockConfig = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };

    return {
      createChart: vi.fn().mockImplementation((container: HTMLElement, options: ChartOptions) => {
        if (finalConfig.shouldThrowErrors && !container) {
          throw new Error('Container is required');
        }
        return this.createChart(finalConfig);
      }),

      // Enums and constants
      LineStyle: {
        Solid: 0,
        Dotted: 1,
        Dashed: 2,
        LargeDashed: 3,
        SparseDotted: 4,
      },

      LineType: {
        Simple: 0,
        WithSteps: 1,
      },

      CrosshairMode: {
        Normal: 0,
        Magnet: 1,
        Hidden: 2,
      },

      PriceScaleMode: {
        Normal: 0,
        Logarithmic: 1,
        Percentage: 2,
        IndexedTo100: 3,
      },

      PriceLineSource: {
        LastBar: 0,
        LastVisible: 1,
      },

      // Color utilities
      ColorType: {
        Solid: 'solid',
        VerticalGradient: 'gradient',
      },

      // Version info
      version: vi.fn(() => '4.1.0'),
    };
  }

  /**
   * Create ResizeObserver mock
   */
  static createResizeObserver(config: MockConfig = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };
    const instances: MockResizeObserver[] = [];

    class MockResizeObserver {
      private callback: ResizeObserverCallback;
      private observedElements = new Set<Element>();

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        instances.push(this);
        if (finalConfig.enableMemoryTracking) {
          trackMockObject(this);
        }
      }

      observe = vi.fn().mockImplementation((element: Element) => {
        if (finalConfig.shouldThrowErrors && !element) {
          throw new Error('Element is required');
        }
        this.observedElements.add(element);

        // Simulate resize event
        if (finalConfig.withPerformanceDelay) {
          setTimeout(() => {
            this.triggerResize(element);
          }, 10);
        }
      });

      unobserve = vi.fn().mockImplementation((element: Element) => {
        this.observedElements.delete(element);
      });

      disconnect = vi.fn().mockImplementation(() => {
        this.observedElements.clear();
        const index = instances.indexOf(this);
        if (index > -1) {
          instances.splice(index, 1);
        }
      });

      // Test utilities
      triggerResize = (element: Element) => {
        const entry = {
          target: element,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            right: 800,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => ({
              width: 800,
              height: 600,
              top: 0,
              left: 0,
              right: 800,
              bottom: 600,
              x: 0,
              y: 0,
            }),
          },
          borderBoxSize: [{ blockSize: 600, inlineSize: 800 }],
          contentBoxSize: [{ blockSize: 600, inlineSize: 800 }],
          devicePixelContentBoxSize: [{ blockSize: 1200, inlineSize: 1600 }],
        } as ResizeObserverEntry;

        this.callback([entry], this as any);
      };

      // Static utilities
      static getActiveInstances = () => instances.length;
      static triggerAllResizes = () => {
        instances.forEach(instance => {
          instance.observedElements.forEach(element => {
            instance.triggerResize(element);
          });
        });
      };
      static cleanup = () => {
        instances.length = 0;
      };
    }

    return MockResizeObserver;
  }

  /**
   * Create DOM element mocks
   */
  static createDOMElement(tagName: string, config: MockConfig = {}): HTMLElement {
    const finalConfig = { ...this.defaultConfig, ...config };

    const element = {
      tagName: tagName.toUpperCase(),
      nodeType: 1,
      nodeName: tagName.toUpperCase(),

      // Dimensions
      clientWidth: 800,
      clientHeight: 600,
      offsetWidth: 800,
      offsetHeight: 600,
      scrollWidth: 800,
      scrollHeight: 600,

      // Positioning
      offsetTop: 0,
      offsetLeft: 0,
      scrollTop: 0,
      scrollLeft: 0,

      // Styling
      style: {} as CSSStyleDeclaration,

      getBoundingClientRect: vi.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })),

      // DOM manipulation
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      insertBefore: vi.fn(),
      replaceChild: vi.fn(),

      // Event handling
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),

      // Queries
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      getElementById: vi.fn(),
      getElementsByClassName: vi.fn(() => []),
      getElementsByTagName: vi.fn(() => []),

      // Canvas specific (if canvas)
      ...(tagName === 'canvas' && {
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
      }),
    } as unknown as HTMLElement;

    return finalConfig.enableMemoryTracking ? trackMockObject(element) : element;
  }

  /**
   * Create performance API mock
   */
  static createPerformanceAPI(config: MockConfig = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };
    let currentTime = 0;

    return {
      now: vi.fn(() => {
        currentTime += finalConfig.withPerformanceDelay ? Math.random() * 16 : 0.1;
        return currentTime;
      }),

      mark: vi.fn((name: string) => {
        if (finalConfig.shouldThrowErrors && !name) {
          throw new Error('Mark name is required');
        }
      }),

      measure: vi.fn((name: string, startMark?: string, endMark?: string) => {
        if (finalConfig.shouldThrowErrors && !name) {
          throw new Error('Measure name is required');
        }
      }),

      getEntriesByType: vi.fn((type: string) => []),
      getEntriesByName: vi.fn((name: string) => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),

      // Navigation timing
      timing: {
        navigationStart: Date.now() - 5000,
        loadEventEnd: Date.now() - 1000,
      },

      // Memory API (experimental)
      memory: finalConfig.customBehavior?.includeMemoryAPI
        ? {
            usedJSHeapSize: 50 * 1024 * 1024, // 50MB
            totalJSHeapSize: 100 * 1024 * 1024, // 100MB
            jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
          }
        : undefined,
    };
  }
}

/**
 * Pre-configured mock presets for common scenarios
 */
export const MockPresets = {
  // Fast, reliable mocks for unit tests
  unit: (): MockConfig => ({
    withPerformanceDelay: false,
    shouldThrowErrors: false,
    enableMemoryTracking: false,
  }),

  // Performance testing mocks with realistic delays
  performance: (): MockConfig => ({
    withPerformanceDelay: true,
    shouldThrowErrors: false,
    enableMemoryTracking: true,
  }),

  // Error scenario testing
  errorTesting: (): MockConfig => ({
    withPerformanceDelay: false,
    shouldThrowErrors: true,
    enableMemoryTracking: true,
  }),

  // Memory leak detection
  memoryLeakDetection: (): MockConfig => ({
    withPerformanceDelay: false,
    shouldThrowErrors: false,
    enableMemoryTracking: true,
    customBehavior: {
      includeMemoryAPI: true,
    },
  }),

  // Integration testing with realistic behavior
  integration: (): MockConfig => ({
    withPerformanceDelay: true,
    shouldThrowErrors: false,
    enableMemoryTracking: true,
  }),
};

/**
 * Global mock setup utility
 */
export function setupGlobalMocks(config: MockConfig = MockPresets.unit()) {
  MockFactory.configure(config);

  // Setup global mocks
  vi.stubGlobal('ResizeObserver', MockFactory.createResizeObserver(config));
  vi.stubGlobal('performance', MockFactory.createPerformanceAPI(config));

  // Setup DOM mocks
  const originalCreateElement = document.createElement;
  document.createElement = vi.fn((tagName: string) => {
    if (['canvas', 'div', 'span'].includes(tagName.toLowerCase())) {
      return MockFactory.createDOMElement(tagName, config);
    }
    return originalCreateElement.call(document, tagName);
  });
}
