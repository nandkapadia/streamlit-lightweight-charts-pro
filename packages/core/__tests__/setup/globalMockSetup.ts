/**
 * @fileoverview Global Mock Setup - Automatically loaded by Vitest
 *
 * This file configures all global mocks that should be available to every test.
 * It's automatically loaded by setupTests.ts and ensures consistent mocking across all tests.
 */

import { vi } from 'vitest';
import React from 'react';

// ============================================================================
// CRITICAL: Mock window.matchMedia FIRST - Required by fancy-canvas
// ============================================================================
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
import {
  mockPrimitiveEventManager,
  mockCornerLayoutManager,
  mockCoordinateValidation,
  mockPositioningConfig,
  mockUniversalSpacing,
  mockDefaultRangeConfigs,
  mockPrimitivePriority,
  createMockLegendPrimitive,
  createMockRangeSwitcherPrimitive,
  setupGlobalMocks,
} from '../mocks/GlobalMockFactory';

// ============================================================================
// GLOBAL VI MOCKS - Applied to all tests automatically
// ============================================================================

// Mock the lightweight-charts library to prevent real chart initialization
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    remove: vi.fn(),
    resize: vi.fn(),
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
      scrollToPosition: vi.fn(),
    })),
    priceScale: vi.fn(() => ({
      applyOptions: vi.fn(),
    })),
    applyOptions: vi.fn(),
    addAreaSeries: vi.fn(() => ({
      setData: vi.fn(),
      update: vi.fn(),
      applyOptions: vi.fn(),
      options: vi.fn(() => ({})),
    })),
    addLineSeries: vi.fn(() => ({
      setData: vi.fn(),
      update: vi.fn(),
      applyOptions: vi.fn(),
      options: vi.fn(() => ({})),
    })),
    addCandlestickSeries: vi.fn(() => ({
      setData: vi.fn(),
      update: vi.fn(),
      applyOptions: vi.fn(),
      options: vi.fn(() => ({})),
    })),
    addBarSeries: vi.fn(() => ({
      setData: vi.fn(),
      update: vi.fn(),
      applyOptions: vi.fn(),
      options: vi.fn(() => ({})),
    })),
    addHistogramSeries: vi.fn(() => ({
      setData: vi.fn(),
      update: vi.fn(),
      applyOptions: vi.fn(),
      options: vi.fn(() => ({})),
    })),
    addBaselineSeries: vi.fn(() => ({
      setData: vi.fn(),
      update: vi.fn(),
      applyOptions: vi.fn(),
      options: vi.fn(() => ({})),
    })),
    panes: vi.fn(() => []),
    chartElement: vi.fn(() => document.createElement('div')),
  })),
  LineStyle: {
    Solid: 0,
    Dotted: 1,
    Dashed: 2,
    LargeDashed: 3,
    SparseDotted: 4,
  },
  CrosshairMode: {
    Normal: 0,
    Magnet: 1,
  },
  PriceScaleMode: {
    Normal: 0,
    Logarithmic: 1,
    Percentage: 2,
    IndexedTo100: 3,
  },
}));

// Mock LightweightCharts component - return proper React component
vi.mock('../../LightweightCharts', () => ({
  default: vi.fn().mockImplementation(props => {
    // Use existing React import at top of file
    const { config } = props;

    // Handle empty config case
    if (!config || !config.charts || config.charts.length === 0) {
      return React.createElement(
        'div',
        {
          'data-testid': 'lightweight-charts',
          className: 'lightweight-charts-wrapper',
          style: { width: '100%', height: '100%' },
        },
        React.createElement('div', { className: 'error-message' }, 'No charts configured')
      );
    }

    // Create chart containers for each chart in config
    const chartElements = config.charts.map((chart: any, index: number) => {
      return React.createElement('div', {
        key: chart.chartId || `chart-${index}`,
        id: `chart-container-${chart.chartId || index}`,
        'data-testid': 'chart-container',
        className: 'chart-container',
        style: { width: chart.chart?.width || 800, height: chart.chart?.height || 400 },
      });
    });

    return React.createElement(
      'div',
      {
        'data-testid': 'lightweight-charts',
        className: 'lightweight-charts-wrapper',
        style: { width: '100%', height: '100%' },
      },
      ...chartElements
    );
  }),
}));

// Mock coordinate validation utilities
vi.mock('../../utils/coordinateValidation', () => mockCoordinateValidation);

// Mock positioning configuration
vi.mock('../../config/positioningConfig', () => mockPositioningConfig);

// Mock universal spacing constants
vi.mock('../../primitives/PrimitiveDefaults', () => ({
  UniversalSpacing: mockUniversalSpacing,
  ButtonDimensions: { DEFAULT_WIDTH: 24, DEFAULT_HEIGHT: 24, FONT_SIZE: 12 },
  ButtonSpacing: { PADDING: 4, MARGIN: 2 },
  ButtonColors: { DEFAULT_COLOR: '#333', HOVER_COLOR: '#555' },
  ButtonEffects: {
    DEFAULT_BORDER: '1px solid rgba(255, 255, 255, 0.2)',
    DEFAULT_TRANSITION: 'all 0.2s ease',
    HOVER_BOX_SHADOW: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  LegendDimensions: { MIN_WIDTH: 100, DEFAULT_HEIGHT: 20 },
  LayoutSpacing: { EDGE_PADDING: 6, WIDGET_GAP: 6, BASE_Z_INDEX: 1000 },
  TimeRangeSeconds: { ONE_DAY: 86400, ONE_WEEK: 604800 },
}));

// Mock primitive event manager
vi.mock('../../services/PrimitiveEventManager', () => mockPrimitiveEventManager);

// Mock corner layout manager
vi.mock('../../services/CornerLayoutManager', () => mockCornerLayoutManager);

// Mock legend primitive
vi.mock('../../primitives/LegendPrimitive', () => ({
  LegendPrimitive: vi
    .fn()
    .mockImplementation((id, config) => createMockLegendPrimitive(id, config)),
}));

// Mock range switcher primitive
vi.mock('../../primitives/RangeSwitcherPrimitive', () => ({
  RangeSwitcherPrimitive: vi
    .fn()
    .mockImplementation((id, config) => createMockRangeSwitcherPrimitive(id, config)),
  DefaultRangeConfigs: mockDefaultRangeConfigs,
}));

// Note: ButtonPanelPrimitive is not mocked globally since it's tested directly
// and used by production code. Tests that need it mocked should mock it locally.

// Mock primitive priority constants
vi.mock('../../primitives/BasePanePrimitive', () => ({
  BasePanePrimitive: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    destroy: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    attachToPane: vi.fn(),
    detachFromPane: vi.fn(),
  })),
  PrimitivePriority: mockPrimitivePriority,
  PrimitiveType: { LEGEND: 'legend', RANGE_SWITCHER: 'range-switcher' },
}));

// Mock logger (suppress console logs in tests)
vi.mock('../../utils/logger', () => ({
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  },
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    chartError: vi.fn(),
    primitiveError: vi.fn(),
    performanceWarn: vi.fn(),
    renderDebug: vi.fn(),
  },
  chartLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  primitiveLog: {
    debug: vi.fn(),
    error: vi.fn(),
  },
  perfLog: {
    warn: vi.fn(),
    debug: vi.fn(),
  },
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================================================
// GLOBAL SETUP - Run automatically for all tests
// ============================================================================

// Set up global browser API mocks
setupGlobalMocks();

// Ensure console methods are properly mocked to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Mock console.error but allow test-specific errors through
  console.error = vi.fn((message, ...args) => {
    // Allow through specific test error patterns
    if (
      typeof message === 'string' &&
      (message.includes('Chart primitive manager operation failed') ||
        message.includes('Chart coordinate service operation failed') ||
        message.includes('DOM error') ||
        message.includes('Detach error'))
    ) {
      // These are intentional test errors - let them through silently
      return;
    }
    // For other errors, call the original to help with debugging
    originalConsoleError(message, ...args);
  });

  // Mock console.warn similarly
  console.warn = vi.fn((message, ...args) => {
    if (typeof message === 'string' && message.includes('Warning: ReactDOMTestUtils.act')) {
      return; // Suppress React testing warnings
    }
    originalConsoleWarn(message, ...args);
  });
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

/**
 * Global test utilities available in all tests
 */
declare global {
  var testUtils: {
    waitForChart: (timeout?: number) => Promise<void>;
    waitForLayout: (timeout?: number) => Promise<void>;
    mockConsoleError: typeof vi.fn;
    mockConsoleWarn: typeof vi.fn;
  };
}

globalThis.testUtils = {
  /**
   * Wait for chart operations to complete
   */
  waitForChart: (timeout = 1000) => {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  },

  /**
   * Wait for layout operations to complete
   */
  waitForLayout: (timeout = 100) => {
    return new Promise(resolve => {
      // Use requestAnimationFrame to wait for next layout cycle
      requestAnimationFrame(() => {
        setTimeout(resolve, timeout);
      });
    });
  },

  mockConsoleError: console.error as any,
  mockConsoleWarn: console.warn as any,
};
