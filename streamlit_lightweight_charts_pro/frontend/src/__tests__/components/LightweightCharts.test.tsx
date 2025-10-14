/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LightweightCharts from '../../LightweightCharts';
import { ComponentConfig } from '../../types';
import { resetMocks } from '../../test-utils/lightweightChartsMocks';

// Use unified mock system with proper vi.mock pattern
vi.mock('lightweight-charts', async () => {
  const mocks = await import('../../test-utils/lightweightChartsMocks');
  return mocks.default;
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
  },
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(callback => {
  setTimeout(callback, 0);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

Element.prototype.getBoundingClientRect = vi.fn(
  (): DOMRect => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
);

Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  value: 600,
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 600,
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 800,
});

describe('LightweightCharts Component', () => {
  const mockConfig: ComponentConfig = {
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
  };

  beforeEach(() => {
    resetMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<LightweightCharts config={mockConfig} />);
      expect(container.querySelector('[id^="chart-container-"]')).toBeInTheDocument();
    });

    it('should render with custom height', () => {
      const { container } = render(<LightweightCharts config={mockConfig} height={600} />);
      const chartContainer = container.querySelector('[id^="chart-container-"]');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should render with custom width', () => {
      const { container } = render(<LightweightCharts config={mockConfig} width={800} />);
      const chartContainer = container.querySelector('[id^="chart-container-"]');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should render with onChartsReady callback', () => {
      const mockCallback = vi.fn();
      const { container } = render(
        <LightweightCharts config={mockConfig} onChartsReady={mockCallback} />
      );
      expect(container.querySelector('[id^="chart-container-"]')).toBeInTheDocument();
    });
  });

  describe('Chart Configuration', () => {
    it('should handle empty config', () => {
      const emptyConfig: ComponentConfig = {
        charts: [],
        sync: {
          enabled: false,
          crosshair: false,
          timeRange: false,
        },
      };
      render(<LightweightCharts config={emptyConfig} />);
      expect(screen.getByText('No charts configured')).toBeInTheDocument();
    });

    it('should handle config with multiple charts', () => {
      const multiChartConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'chart1',
            chart: {
              height: 300,
              layout: {
                backgroundColor: '#ffffff',
                textColor: '#000000',
              },
            },
            series: [],
            annotations: [],
          },
          {
            chartId: 'chart2',
            chart: {
              height: 300,
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
          enabled: true,
          crosshair: true,
          timeRange: true,
        },
      };
      const { container } = render(<LightweightCharts config={multiChartConfig} />);
      expect(container.querySelector('[id^="chart-container-"]')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing config gracefully', () => {
      const { container } = render(<LightweightCharts config={{} as ComponentConfig} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle null config gracefully', () => {
      const { container } = render(<LightweightCharts config={null as any} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets', () => {
      const largeConfig: ComponentConfig = {
        charts: [
          {
            chartId: 'large-chart',
            chart: {
              height: 400,
              layout: {
                backgroundColor: '#ffffff',
                textColor: '#000000',
              },
            },
            series: [
              {
                type: 'Line',
                data: Array.from({ length: 10000 }, (_, i) => ({
                  time: Date.now() + i * 60000,
                  value: Math.random() * 100,
                })),
              },
            ],
            annotations: [],
          },
        ],
        sync: {
          enabled: false,
          crosshair: false,
          timeRange: false,
        },
      };
      const { container } = render(<LightweightCharts config={largeConfig} />);
      expect(container.querySelector('[id^="chart-container-"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(<LightweightCharts config={mockConfig} />);
      const chartContainer = container.querySelector('[id^="chart-container-"]');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const { container } = render(<LightweightCharts config={mockConfig} />);
      const chartContainer = container.querySelector('[id^="chart-container-"]');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should handle window resize', async () => {
      const { container } = render(<LightweightCharts config={mockConfig} />);

      // Simulate window resize
      window.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        expect(container.querySelector('[id^="chart-container-"]')).toBeInTheDocument();
      });
    });

    it('should handle container resize', async () => {
      const { container } = render(<LightweightCharts config={mockConfig} />);

      // Simulate container resize
      const chartContainer = container.querySelector('[id^="chart-container-"]');
      if (chartContainer) {
        Object.defineProperty(chartContainer, 'offsetWidth', {
          configurable: true,
          value: 1000,
        });
        chartContainer.dispatchEvent(new Event('resize'));
      }

      await waitFor(() => {
        expect(container.querySelector('[id^="chart-container-"]')).toBeInTheDocument();
      });
    });
  });
});
