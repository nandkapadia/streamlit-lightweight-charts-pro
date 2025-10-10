/**
 * @fileoverview Global Mock Factory - Single source of truth for all test mocks
 *
 * This factory provides consistent, reusable mocks for all components and services
 * used across the entire test suite. All tests should import mocks from here.
 */

import { vi } from 'vitest';
import React from 'react';
import type {
  IChartApi,
  IPaneApi,
  ITimeScaleApi,
  IPriceScaleApi,
  ISeriesApi,
} from 'lightweight-charts';

// ============================================================================
// CORE CHART API MOCKS
// ============================================================================

export const createMockTimeScale = (): ITimeScaleApi<any> =>
  ({
    height: vi.fn(() => 35),
    width: vi.fn(() => 800),
    timeToCoordinate: vi.fn(() => 100),
    coordinateToTime: vi.fn(() => 1234567890),
    logicalToCoordinate: vi.fn(() => 100),
    coordinateToLogical: vi.fn(() => 100),
    setVisibleRange: vi.fn(),
    getVisibleRange: vi.fn(() => ({ from: 0, to: 100 })),
    setVisibleLogicalRange: vi.fn(),
    getVisibleLogicalRange: vi.fn(() => ({ from: 0, to: 100 })),
    resetTimeScale: vi.fn(),
    fitContent: vi.fn(),
    subscribeVisibleTimeRangeChange: vi.fn(() => vi.fn()),
    subscribeVisibleLogicalRangeChange: vi.fn(() => vi.fn()),
    subscribeSizeChange: vi.fn(() => vi.fn()),
  }) as any;

export const createMockPriceScale = (side: 'left' | 'right' = 'left'): IPriceScaleApi =>
  ({
    width: vi.fn(() => (side === 'left' ? 70 : 0)),
    priceToCoordinate: vi.fn(() => 100),
    coordinateToPrice: vi.fn(() => 100.5),
    setAutoScale: vi.fn(),
    isAutoScale: vi.fn(() => true),
    applyOptions: vi.fn(),
    options: vi.fn(() => ({})),
  }) as any;

export const createMockSeries = (): ISeriesApi<any> =>
  ({
    attachPrimitive: vi.fn(),
    detachPrimitive: vi.fn(),
    priceToCoordinate: vi.fn(() => 100),
    coordinateToPrice: vi.fn(() => 100.5),
    setData: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    applyOptions: vi.fn(),
    options: vi.fn(() => ({})),
    priceScale: vi.fn(() => createMockPriceScale()),
    setMarkers: vi.fn(),
    markers: vi.fn(() => []),
    dataByIndex: vi.fn(),
    barsInLogicalRange: vi.fn(() => ({ from: null, to: null, barsBefore: 0, barsAfter: 0 })),
    subscribeDataChanged: vi.fn(() => vi.fn()),
  }) as any;

export const createMockPane = (): IPaneApi<any> =>
  ({
    attachPrimitive: vi.fn(),
    detachPrimitive: vi.fn(),
    height: vi.fn(() => 300),
    width: vi.fn(() => 800),
  }) as any;

export const createMockChart = (
  options: {
    paneCount?: number;
    chartWidth?: number;
    chartHeight?: number;
    hasTimeScale?: boolean;
    hasPriceScale?: boolean;
  } = {}
): IChartApi => {
  const {
    paneCount = 1,
    chartWidth = 800,
    chartHeight = 600,
    hasTimeScale = true,
    hasPriceScale = true,
  } = options;

  // Create mock panes
  const mockPanes = Array.from({ length: paneCount }, () => createMockPane());

  // Create mock chart element
  const mockChartElement = {
    id: 'test-chart',
    clientWidth: chartWidth,
    clientHeight: chartHeight,
    offsetWidth: chartWidth,
    offsetHeight: chartHeight,
    getBoundingClientRect: vi.fn(() => ({
      width: chartWidth,
      height: chartHeight,
      top: 0,
      left: 0,
      right: chartWidth,
      bottom: chartHeight,
      x: 0,
      y: 0,
    })),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    style: {},
  };

  return {
    panes: vi.fn(() => mockPanes),
    timeScale: hasTimeScale
      ? vi.fn(() => createMockTimeScale())
      : vi.fn(() => {
          throw new Error('TimeScale not available');
        }),
    priceScale: hasPriceScale
      ? vi.fn(side => createMockPriceScale(side))
      : vi.fn(() => {
          throw new Error('PriceScale not available');
        }),
    chartElement: vi.fn(() => mockChartElement),
    paneSize: vi.fn((paneId: number) => {
      if (paneId < paneCount) {
        return { width: chartWidth, height: Math.floor(chartHeight / paneCount) };
      }
      return null; // No more panes
    }),
    addAreaSeries: vi.fn(() => createMockSeries()),
    addLineSeries: vi.fn(() => createMockSeries()),
    addCandlestickSeries: vi.fn(() => createMockSeries()),
    addBarSeries: vi.fn(() => createMockSeries()),
    addHistogramSeries: vi.fn(() => createMockSeries()),
    addBaselineSeries: vi.fn(() => createMockSeries()),
    removeSeries: vi.fn(),
    subscribeClick: vi.fn(() => vi.fn()),
    subscribeCrosshairMove: vi.fn(() => vi.fn()),
    subscribeDblClick: vi.fn(() => vi.fn()),
    unsubscribeClick: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    unsubscribeDblClick: vi.fn(),
    resize: vi.fn(),
    remove: vi.fn(),
    applyOptions: vi.fn(),
    options: vi.fn(() => ({})),
  } as any;
};

// ============================================================================
// DOM ELEMENT MOCKS
// ============================================================================

export const createMockContainer = (
  options: {
    width?: number;
    height?: number;
    id?: string;
  } = {}
): HTMLElement => {
  const { width = 800, height = 600, id = 'test-container' } = options;

  return {
    id,
    offsetWidth: width,
    offsetHeight: height,
    clientWidth: width,
    clientHeight: height,
    scrollWidth: width,
    scrollHeight: height,
    offsetTop: 0,
    offsetLeft: 0,
    getBoundingClientRect: vi.fn(() => ({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
    })),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    style: {},
    className: '',
    setAttribute: vi.fn(),
    getAttribute: vi.fn(() => null),
    removeAttribute: vi.fn(),
  } as any;
};

// ============================================================================
// COMPONENT MOCKS
// ============================================================================

export const mockLightweightChartsComponent = {
  default: vi.fn().mockImplementation((props: any) => {
    // Import React dynamically to avoid module loading issues
    // Use existing React import at top of file

    // Return proper React element instead of DOM element
    return React.createElement(
      'div',
      {
        'data-testid': 'lightweight-charts',
        className: 'lightweight-charts-wrapper',
        style: { width: '100%', height: '100%' },
        // Add additional props for testing
        'data-chart-ready': props.seriesData ? 'true' : 'false',
      },
      [
        // Add series container if seriesData exists
        props.seriesData
          ? React.createElement('div', {
              key: 'series',
              'data-testid': 'chart-series',
              'data-series-count': Array.isArray(props.seriesData) ? props.seriesData.length : 1,
            })
          : null,
        // Add legend container if legend config exists
        props.legendConfig
          ? React.createElement('div', {
              key: 'legend',
              'data-testid': 'chart-legend',
            })
          : null,
        // Add range switcher if config exists
        props.rangeSwitcherConfig
          ? React.createElement('div', {
              key: 'range-switcher',
              'data-testid': 'range-switcher',
            })
          : null,
      ].filter(Boolean)
    );
  }),
};

// ============================================================================
// PRIMITIVE MOCKS
// ============================================================================

export const createMockLegendPrimitive = (id: string, config: any) => ({
  id,
  config,
  destroy: vi.fn(),
  update: vi.fn(),
  attached: vi.fn(() => true),
  detached: vi.fn(() => false),
  requestUpdate: vi.fn(),
  updateAllViews: vi.fn(),
});

export const createMockRangeSwitcherPrimitive = (id: string, config: any) => ({
  id,
  config,
  destroy: vi.fn(),
  update: vi.fn(),
  attached: vi.fn(() => true),
  detached: vi.fn(() => false),
  requestUpdate: vi.fn(),
  updateAllViews: vi.fn(),
});

// ============================================================================
// SERVICE MOCKS
// ============================================================================

export const mockPrimitiveEventManager = {
  PrimitiveEventManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    destroy: vi.fn(),
    subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
    emit: vi.fn(),
    cleanup: vi.fn(),
  })),
  getInstance: vi.fn(() => ({
    initialize: vi.fn(),
    destroy: vi.fn(),
    subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
    emit: vi.fn(),
    cleanup: vi.fn(),
  })),
  cleanup: vi.fn(),
};

export const mockCornerLayoutManager = {
  CornerLayoutManager: vi.fn().mockImplementation(() => ({
    addWidget: vi.fn(),
    removeWidget: vi.fn(),
    updateLayout: vi.fn(),
    destroy: vi.fn(),
    getPosition: vi.fn(() => ({ x: 0, y: 0 })),
    setConfig: vi.fn(),
    refreshLayout: vi.fn(),
  })),
  // Static methods
  cleanup: vi.fn(),
  getInstance: vi.fn(() => ({
    addWidget: vi.fn(),
    removeWidget: vi.fn(),
    updateLayout: vi.fn(),
    destroy: vi.fn(),
    getPosition: vi.fn(() => ({ x: 0, y: 0 })),
    setConfig: vi.fn(),
    refreshLayout: vi.fn(),
  })),
};

// ============================================================================
// UTILITY MOCKS
// ============================================================================

export const mockCoordinateValidation = {
  validateChartCoordinates: vi.fn(coords => {
    // Return actual validation based on coordinate structure
    if (!coords || !coords.container) {
      return { isValid: false, errors: ['Missing container'], warnings: [] };
    }
    if (coords.container.width <= 0 || coords.container.height <= 0) {
      return { isValid: false, errors: ['Invalid container dimensions'], warnings: [] };
    }
    return { isValid: true, errors: [], warnings: [] };
  }),
  sanitizeCoordinates: vi.fn(coords => {
    // Return sanitized coordinates that match test expectations
    if (!coords || coords.container?.width <= 0) {
      return {
        container: { width: 800, height: 400, offsetTop: 0, offsetLeft: 0 },
        timeScale: { x: 0, y: 370, width: 800, height: 30 },
        panes: { 0: { width: 800, height: 370, top: 0, left: 0 } },
        priceScales: { right: { x: 740, y: 0, width: 60, height: 370 } },
      };
    }
    return coords;
  }),
  getCoordinateDebugInfo: vi.fn(coords => {
    if (!coords) return 'No coordinates provided';
    const paneCount = Object.keys(coords.panes || {}).length;
    const priceScaleCount = Object.keys(coords.priceScales || {}).length;
    return `Container: ${coords.container?.width || 0}x${coords.container?.height || 0}, TimeScale: ${coords.timeScale?.width || 0}x${coords.timeScale?.height || 0}, Panes: ${paneCount}, PriceScales: ${priceScaleCount}`;
  }),
  createBoundingBox: vi.fn((x, y, width, height) => ({
    x,
    y,
    width,
    height,
    left: x,
    right: x + width,
    top: y,
    bottom: y + height,
  })),
  areCoordinatesStale: vi.fn(() => false),
  logValidationResult: vi.fn(),
  validatePaneCoordinates: vi.fn((pane, id) => {
    if (!pane || pane.width <= 0 || pane.height <= 0) {
      return { isValid: false, errors: [`Pane ${id}: Invalid dimensions`] };
    }
    return { isValid: true, errors: [] };
  }),
  validateScaleDimensions: vi.fn((scale, name) => {
    if (!scale || scale.width <= 0 || scale.height <= 0) {
      return { isValid: false, errors: [`${name}: Invalid dimensions`] };
    }
    return { isValid: true, errors: [] };
  }),
  validateBoundingBox: vi.fn(bbox => {
    if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
      return { isValid: false, errors: ['Invalid bounding box dimensions'] };
    }
    return { isValid: true, errors: [] };
  }),
};

export const mockPositioningConfig = {
  DIMENSIONS: {
    legend: {
      defaultWidth: 200,
      defaultHeight: 40,
      minWidth: 100,
      minHeight: 20,
    },
    chart: {
      defaultWidth: 800,
      defaultHeight: 600,
    },
    pane: {
      collapsedHeight: 40,
    },
  },
  TIMING: {
    cacheExpiration: 5000,
    chartReadyDelay: 300,
    backendSyncDebounce: 300,
  },
  CSS_CLASSES: {
    seriesDialogContainer: (paneId: number) => `series-config-dialog-container-${paneId}`,
    paneButtonPanelContainer: (paneId: number) => `pane-button-panel-container-${paneId}`,
  },
  Z_INDEX: {
    legend: 1000,
  },
  getFallback: vi.fn((key: string) => {
    const fallbacks: Record<string, number> = {
      containerWidth: 800,
      containerHeight: 600,
      timeScaleHeight: 35,
      priceScaleWidth: 70,
      paneWidth: 800,
      paneHeight: 600,
    };
    return fallbacks[key] || 0;
  }),
  getMargins: vi.fn(() => ({
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
  })),
};

export const mockUniversalSpacing = {
  EDGE_PADDING: 8,
  WIDGET_GAP: 4,
};

// ============================================================================
// DEFAULT RANGE CONFIGS
// ============================================================================

export const mockDefaultRangeConfigs = {
  trading: [
    { label: '1D', value: 1 },
    { label: '1W', value: 7 },
    { label: '1M', value: 30 },
    { label: '3M', value: 90 },
    { label: '1Y', value: 365 },
  ],
};

// ============================================================================
// MOCK PRIORITY CONSTANTS
// ============================================================================

export const mockPrimitivePriority = {
  LEGEND: 100,
  RANGE_SWITCHER: 200,
  BUTTON_PANEL: 300,
};

// ============================================================================
// GLOBAL SETUP HELPERS
// ============================================================================

/**
 * Setup all global mocks for a test suite
 * Call this in your test's beforeEach or describe block
 */
export const setupGlobalMocks = () => {
  // Mock performance API
  if (typeof global.performance === 'undefined') {
    global.performance = {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn(() => []),
    } as any;
  }

  // Mock ResizeObserver
  if (typeof global.ResizeObserver === 'undefined') {
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Mock IntersectionObserver
  if (typeof global.IntersectionObserver === 'undefined') {
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  }

  // Mock requestAnimationFrame
  if (typeof global.requestAnimationFrame === 'undefined') {
    global.requestAnimationFrame = vi.fn(callback => {
      setTimeout(callback, 0);
      return 1;
    });
  }

  // Mock cancelAnimationFrame
  if (typeof global.cancelAnimationFrame === 'undefined') {
    global.cancelAnimationFrame = vi.fn();
  }

  // Mock getComputedStyle
  if (typeof window !== 'undefined' && !window.getComputedStyle) {
    window.getComputedStyle = vi.fn(
      () =>
        ({
          getPropertyValue: vi.fn(() => ''),
          width: '200px',
          height: '40px',
        }) as any
    );
  }
};

/**
 * Reset all mocks to their initial state
 * Call this in your test's afterEach block
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();
};

/**
 * Create a complete test environment with all necessary mocks
 */
export const createTestEnvironment = (
  options: {
    chartOptions?: Parameters<typeof createMockChart>[0];
    containerOptions?: Parameters<typeof createMockContainer>[0];
  } = {}
) => {
  setupGlobalMocks();

  const chart = createMockChart(options.chartOptions);
  const container = createMockContainer(options.containerOptions);

  return {
    chart,
    container,
    timeScale: createMockTimeScale(),
    priceScale: createMockPriceScale(),
    series: createMockSeries(),
    pane: createMockPane(),
  };
};

// ============================================================================
// EXPORT DEFAULT MOCK CONFIGURATIONS
// ============================================================================

export const defaultMocks = {
  chart: createMockChart(),
  container: createMockContainer(),
  timeScale: createMockTimeScale(),
  priceScale: createMockPriceScale(),
  series: createMockSeries(),
  pane: createMockPane(),
};
