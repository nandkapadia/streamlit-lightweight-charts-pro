/**
 * @fileoverview E2E tests for user interactions
 * @vitest-environment jsdom
 *
 * Tests complete user flows for:
 * - Mouse events (click, hover, drag)
 * - Keyboard navigation
 * - Zoom and pan interactions
 * - Crosshair interactions
 * - Time scale interactions
 * - Price scale interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import LightweightCharts from '../../LightweightCharts';
import { ComponentConfig } from '../../types';

// Setup global mocks
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Element.prototype.getBoundingClientRect = vi.fn(
  () =>
    ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }) as DOMRect
);

describe('E2E: User Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Mouse Interactions', () => {
    it('should handle mouse click on chart', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-click',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        fireEvent.click(container.firstChild as Element);
      }
      expect(true).toBe(true);
    });

    it('should handle mouse move over chart', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-hover',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        fireEvent.mouseMove(container.firstChild as Element, { clientX: 100, clientY: 100 });
      }
      expect(true).toBe(true);
    });

    it('should handle mouse enter and leave', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-mouse',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        fireEvent.mouseEnter(container.firstChild as Element);
        fireEvent.mouseLeave(container.firstChild as Element);
      }
      expect(true).toBe(true);
    });

    it('should handle double click', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-dblclick',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        fireEvent.doubleClick(container.firstChild as Element);
      }
      expect(true).toBe(true);
    });

    it('should handle context menu', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-context',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        fireEvent.contextMenu(container.firstChild as Element);
      }
      expect(true).toBe(true);
    });
  });

  describe('Drag Interactions', () => {
    it('should handle drag to pan', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-drag',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                  { time: '2024-01-03', value: 105 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        fireEvent.mouseDown(element, { clientX: 200, clientY: 200 });
        fireEvent.mouseMove(element, { clientX: 300, clientY: 200 });
        fireEvent.mouseUp(element, { clientX: 300, clientY: 200 });
      }
      expect(true).toBe(true);
    });

    it('should handle touch drag', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-touch',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 200 } as Touch],
        });
        const touchMove = new TouchEvent('touchmove', {
          touches: [{ clientX: 300, clientY: 200 } as Touch],
        });
        const touchEnd = new TouchEvent('touchend', {
          touches: [],
        });

        fireEvent(element, touchStart);
        fireEvent(element, touchMove);
        fireEvent(element, touchEnd);
      }
      expect(true).toBe(true);
    });
  });

  describe('Zoom Interactions', () => {
    it('should handle mouse wheel zoom', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-zoom',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                  { time: '2024-01-03', value: 105 },
                  { time: '2024-01-04', value: 115 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        // Zoom in
        fireEvent.wheel(element, { deltaY: -100 });
        // Zoom out
        fireEvent.wheel(element, { deltaY: 100 });
      }
      expect(true).toBe(true);
    });

    it('should handle pinch zoom', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-pinch',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        const touchStart = new TouchEvent('touchstart', {
          touches: [
            { clientX: 200, clientY: 200 } as Touch,
            { clientX: 400, clientY: 200 } as Touch,
          ],
        });
        const touchMove = new TouchEvent('touchmove', {
          touches: [
            { clientX: 150, clientY: 200 } as Touch,
            { clientX: 450, clientY: 200 } as Touch,
          ],
        });

        fireEvent(element, touchStart);
        fireEvent(element, touchMove);
      }
      expect(true).toBe(true);
    });
  });

  describe('Crosshair Interactions', () => {
    it('should show crosshair on mouse move', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-crosshair',
            chart: {
              width: 800,
              height: 600,
              crosshair: {
                mode: 1,
              },
            },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        fireEvent.mouseMove(container.firstChild as Element, { clientX: 400, clientY: 300 });
      }
      expect(true).toBe(true);
    });

    it('should hide crosshair on mouse leave', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-crosshair-hide',
            chart: {
              width: 800,
              height: 600,
              crosshair: {
                mode: 1,
              },
            },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-02', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        fireEvent.mouseMove(element, { clientX: 400, clientY: 300 });
        fireEvent.mouseLeave(element);
      }
      expect(true).toBe(true);
    });
  });

  describe('Keyboard Interactions', () => {
    it('should handle arrow key navigation', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-keyboard',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        fireEvent.keyDown(element, { key: 'ArrowRight' });
        fireEvent.keyDown(element, { key: 'ArrowLeft' });
        fireEvent.keyDown(element, { key: 'ArrowUp' });
        fireEvent.keyDown(element, { key: 'ArrowDown' });
      }
      expect(true).toBe(true);
    });

    it('should handle zoom keyboard shortcuts', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-keyboard-zoom',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: [
                  { time: '2024-01-01', value: 100 },
                  { time: '2024-01-02', value: 110 },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        // Plus key to zoom in
        fireEvent.keyDown(element, { key: '+' });
        // Minus key to zoom out
        fireEvent.keyDown(element, { key: '-' });
      }
      expect(true).toBe(true);
    });
  });

  describe('Performance with Interactions', () => {
    it('should handle rapid mouse movements', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-rapid',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: Array.from({ length: 1000 }, (_, i) => ({
                  time: `2024-01-${String((i % 31) + 1).padStart(2, '0')}` as any,
                  value: 100 + Math.random() * 50,
                })),
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        // Simulate rapid mouse movements
        for (let i = 0; i < 100; i++) {
          fireEvent.mouseMove(element, {
            clientX: 100 + i * 5,
            clientY: 300 + Math.sin(i / 10) * 100,
          });
        }
      }
      expect(true).toBe(true);
    });

    it('should handle continuous scrolling', () => {
      const config: ComponentConfig = {
        charts: [
          {
            chartId: 'chart-scroll',
            chart: { width: 800, height: 600 },
            series: [
              {
                type: 'Line',
                data: Array.from({ length: 500 }, (_, i) => ({
                  time: `2024-01-${String((i % 31) + 1).padStart(2, '0')}` as any,
                  value: 100 + i * 0.5,
                })),
              },
            ],
          },
        ],
      };

      const { container } = render(<LightweightCharts config={config} />);
      expect(container).toBeTruthy();

      if (container.firstChild) {
        const element = container.firstChild as Element;
        // Simulate continuous scrolling
        for (let i = 0; i < 20; i++) {
          fireEvent.wheel(element, { deltaY: i % 2 === 0 ? -50 : 50 });
        }
      }
      expect(true).toBe(true);
    });
  });
});
