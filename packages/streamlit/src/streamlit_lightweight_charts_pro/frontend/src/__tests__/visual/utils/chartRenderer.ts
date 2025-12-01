/**
 * Chart Rendering Utilities for Visual Tests
 *
 * Provides utilities to render lightweight-charts to canvas and extract pixel data
 * for visual regression testing.
 *
 * @module visual/utils/chartRenderer
 */

import { createChart, IChartApi, DeepPartial, ChartOptions } from 'lightweight-charts';

/**
 * Default chart dimensions for consistent visual testing
 */
export const DEFAULT_CHART_WIDTH = 800;
export const DEFAULT_CHART_HEIGHT = 400;

/**
 * Chart rendering configuration
 */
export interface ChartRenderConfig {
  width?: number;
  height?: number;
  chartOptions?: DeepPartial<ChartOptions>;
  waitForRender?: number; // milliseconds to wait for rendering
}

/**
 * Result of chart rendering operation
 */
export interface ChartRenderResult {
  chart: IChartApi;
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  imageData: ImageData;
}

/**
 * Creates a container element for chart rendering
 *
 * @param width - Container width in pixels
 * @param height - Container height in pixels
 * @returns HTMLDivElement configured for chart rendering
 */
export function createChartContainer(
  width: number = DEFAULT_CHART_WIDTH,
  height: number = DEFAULT_CHART_HEIGHT
): HTMLDivElement {
  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = 'relative';
  document.body.appendChild(container);
  return container;
}

/**
 * Waits for chart to complete rendering
 *
 * @param chart - Chart instance
 * @param duration - Milliseconds to wait
 * @returns Promise that resolves after waiting
 */
export async function waitForChartRender(chart: IChartApi, duration: number = 100): Promise<void> {
  return new Promise(resolve => {
    // Give the chart time to render
    setTimeout(() => {
      // Force a final layout update
      chart.timeScale().fitContent();
      resolve();
    }, duration);
  });
}

/**
 * Extracts canvas element from chart container
 *
 * @param container - Chart container element
 * @returns Canvas element (may be custom wrapper)
 * @throws Error if canvas not found
 */
export function extractCanvasFromContainer(container: HTMLDivElement): any {
  // Try querySelector first
  let canvas = container.querySelector('canvas');

  // If not found, search children manually for our custom canvas wrapper
  if (!canvas && (container as any).children) {
    for (const child of (container as any).children) {
      if (child._isCanvasElement || child.tagName === 'CANVAS') {
        canvas = child;
        break;
      }
    }
  }

  if (!canvas) {
    console.error('Container:', container);
    console.error('Container children:', (container as any).children);
    throw new Error('Canvas element not found in chart container');
  }

  return canvas;
}

/**
 * Extracts ImageData from canvas
 *
 * @param canvas - Canvas element (may be our custom wrapper)
 * @returns ImageData containing pixel data
 * @throws Error if unable to get context or image data
 */
export function extractImageData(canvas: any): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context from canvas');
  }

  const width = canvas.width;
  const height = canvas.height;

  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    if (!imageData) {
      throw new Error('Failed to extract image data from canvas');
    }
    return imageData;
  } catch (error) {
    console.error('Error extracting image data:', error);
    console.error('Canvas dimensions:', width, 'x', height);
    console.error('Context type:', typeof ctx);
    throw error;
  }
}

/**
 * Renders a chart and returns the canvas image data
 *
 * @param setupFn - Function that configures the chart (adds series, data, etc.)
 * @param config - Rendering configuration
 * @returns ChartRenderResult with chart, canvas, and image data
 *
 * @example
 * ```typescript
 * const result = await renderChart((chart) => {
 *   const series = chart.addLineSeries();
 *   series.setData([
 *     { time: '2024-01-01', value: 100 },
 *     { time: '2024-01-02', value: 110 },
 *   ]);
 * });
 * ```
 */
export async function renderChart(
  setupFn: (chart: IChartApi) => void,
  config: ChartRenderConfig = {}
): Promise<ChartRenderResult> {
  const {
    width = DEFAULT_CHART_WIDTH,
    height = DEFAULT_CHART_HEIGHT,
    chartOptions = {},
    waitForRender: waitDuration = 100,
  } = config;

  // Create container
  const container = createChartContainer(width, height);

  try {
    // Create chart with default options optimized for testing
    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { color: '#FFFFFF' },
        textColor: '#000000',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      ...chartOptions,
    });

    // Run setup function (add series, data, etc.)
    setupFn(chart);

    // Wait for rendering to complete
    await waitForChartRender(chart, waitDuration);

    // Extract canvas and image data
    const canvas = extractCanvasFromContainer(container);
    const imageData = extractImageData(canvas);

    return {
      chart,
      container,
      canvas,
      imageData,
    };
  } catch (error) {
    // Clean up on error
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

/**
 * Cleans up chart rendering resources
 *
 * @param result - ChartRenderResult to clean up
 */
export function cleanupChartRender(result: ChartRenderResult): void {
  if (result.chart) {
    result.chart.remove();
  }
  if (result.container && result.container.parentNode) {
    document.body.removeChild(result.container);
  }
}

/**
 * Gets a specific pixel color from ImageData
 *
 * @param imageData - Image data to read from
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns RGBA color array [r, g, b, a]
 */
export function getPixelColor(
  imageData: ImageData,
  x: number,
  y: number
): [number, number, number, number] {
  const index = (y * imageData.width + x) * 4;
  return [
    imageData.data[index], // R
    imageData.data[index + 1], // G
    imageData.data[index + 2], // B
    imageData.data[index + 3], // A
  ];
}

/**
 * Converts hex color to RGBA array
 *
 * @param hex - Hex color string (e.g., '#FF0000' or '#FF0000FF')
 * @returns RGBA color array [r, g, b, a]
 */
export function hexToRgba(hex: string): [number, number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  const a = cleaned.length === 8 ? parseInt(cleaned.substring(6, 8), 16) : 255;
  return [r, g, b, a];
}

/**
 * Checks if two colors match within tolerance
 *
 * @param color1 - First color [r, g, b, a]
 * @param color2 - Second color [r, g, b, a]
 * @param tolerance - Maximum difference per channel (0-255)
 * @returns True if colors match within tolerance
 */
export function colorsMatch(
  color1: [number, number, number, number],
  color2: [number, number, number, number],
  tolerance: number = 5
): boolean {
  return (
    Math.abs(color1[0] - color2[0]) <= tolerance &&
    Math.abs(color1[1] - color2[1]) <= tolerance &&
    Math.abs(color1[2] - color2[2]) <= tolerance &&
    Math.abs(color1[3] - color2[3]) <= tolerance
  );
}
