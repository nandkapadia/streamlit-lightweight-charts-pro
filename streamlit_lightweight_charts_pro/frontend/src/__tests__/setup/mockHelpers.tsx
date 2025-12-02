/**
 * Shared mock helpers and utilities for tests
 */

import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ComponentConfig } from '../../types';

/**
 * Create a mock Streamlit render data object
 */
export const createMockRenderData = (overrides: any = {}) => ({
  args: {
    config: {
      charts: [
        {
          chartId: 'test-chart',
          chart: {
            height: 400,
            autoSize: true,
            layout: {
              color: '#ffffff',
              textColor: '#000000',
            },
          },
          series: [],
          annotations: {
            layers: {},
          },
        },
      ],
      sync: {
        enabled: false,
        crosshair: false,
        timeRange: false,
      },
    },
    height: 400,
    width: null,
    ...overrides.args,
  },
  disabled: false,
  height: 400,
  width: 800,
  theme: {
    base: 'light',
    primaryColor: '#ff4b4b',
    backgroundColor: '#ffffff',
    secondaryBackgroundColor: '#f0f2f6',
    textColor: '#262730',
  },
  ...overrides,
});

/**
 * Create a mock chart configuration
 */
export const createMockChartConfig = (
  overrides: Partial<ComponentConfig> = {}
): ComponentConfig => ({
  charts: [
    {
      chartId: 'test-chart',
      chart: {
        height: 400,
        layout: {
          backgroundColor: '#ffffff',
          textColor: '#000000',
        },
      },
      series: [],
      annotations: [],
    },
  ],
  sync: {
    enabled: false,
    crosshair: false,
    timeRange: false,
  },
  ...overrides,
});

/**
 * Mock Streamlit component library
 */
export const createStreamlitMocks = () => ({
  Streamlit: {
    setComponentValue: vi.fn(),
    setFrameHeight: vi.fn(),
    setComponentReady: vi.fn(),
    RENDER_EVENT: 'streamlit:render',
    SET_FRAME_HEIGHT_EVENT: 'streamlit:setFrameHeight',
  },
  useRenderData: vi.fn(() => createMockRenderData()),
  StreamlitProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
});

/**
 * Mock LightweightCharts component for testing
 */
export const createMockLightweightCharts = () => {
  return function MockLightweightCharts({ config, height, width, onChartsReady }: any) {
    const { useEffect } = React;
    useEffect(() => {
      if (onChartsReady) {
        onChartsReady();
      }
    }, [onChartsReady]);

    return (
      <div className='chart-container' data-testid='lightweight-charts'>
        <div>Mock Chart Component</div>
        <div>Config: {JSON.stringify(config).substring(0, 50)}...</div>
        <div>Height: {height}</div>
        <div>Width: {width === null ? 'null' : width === undefined ? 'undefined' : width}</div>
        {onChartsReady && (
          <button onClick={onChartsReady} data-testid='charts-ready-btn'>
            Charts Ready
          </button>
        )}
      </div>
    );
  };
};

/**
 * Common test data generators
 */
export const testData = {
  candlestickData: [
    { time: '2023-01-01', open: 100, high: 110, low: 95, close: 105 },
    { time: '2023-01-02', open: 105, high: 115, low: 100, close: 110 },
    { time: '2023-01-03', open: 110, high: 120, low: 105, close: 115 },
  ],

  lineData: [
    { time: '2023-01-01', value: 100 },
    { time: '2023-01-02', value: 105 },
    { time: '2023-01-03', value: 110 },
  ],

  areaData: [
    { time: '2023-01-01', value: 100 },
    { time: '2023-01-02', value: 105 },
    { time: '2023-01-03', value: 110 },
  ],

  histogramData: [
    { time: '2023-01-01', value: 1000, color: '#26a69a' },
    { time: '2023-01-02', value: 1500, color: '#ef5350' },
    { time: '2023-01-03', value: 1200, color: '#26a69a' },
  ],
};

/**
 * Utility to wait for async operations in tests
 */
export const waitForAsync = (ms: number = 0): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Utility to advance timers and wait for async operations
 */
export const advanceTimersAndWait = async (ms: number = 1500): Promise<void> => {
  vi.advanceTimersByTime(ms);
  await waitForAsync(10);
};

/**
 * Custom render function that ensures proper container setup for React 18
 */
export const renderWithContainer = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'container'>
) => {
  // Create a proper container div
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'test-container');

  // Ensure it's attached to the document body
  if (document.body) {
    document.body.appendChild(container);
  }

  return rtlRender(ui, { container, ...options });
};
