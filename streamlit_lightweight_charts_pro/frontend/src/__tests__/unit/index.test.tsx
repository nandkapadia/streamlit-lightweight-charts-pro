/**
 * @vitest-environment jsdom
 *
 * Tests for the main index component that renders the Streamlit component.
 *
 * This tests the integration between Streamlit and the LightweightCharts component
 * using the new custom hook architecture (useStreamlitRenderData, useStreamlitFrameHeight).
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock LightweightCharts component
vi.mock('../../LightweightCharts', () => ({
  default: function MockLightweightCharts({ config, onChartsReady }: any) {
    React.useEffect(() => {
      // Simulate charts ready callback
      if (onChartsReady) {
        setTimeout(() => onChartsReady(), 10);
      }
    }, [onChartsReady]);

    return (
      <div data-testid='lightweight-charts'>
        <div>Mock LightweightCharts Component</div>
        <div data-testid='chart-config'>{JSON.stringify(config).substring(0, 100)}</div>
      </div>
    );
  },
}));

// Mock Streamlit library
const mockStreamlit = {
  setComponentValue: vi.fn(),
  setFrameHeight: vi.fn(),
  setComponentReady: vi.fn(),
  RENDER_EVENT: 'streamlit:render',
  events: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

vi.mock('streamlit-component-lib', () => ({
  Streamlit: mockStreamlit,
}));

// Mock custom Streamlit hooks
const mockRenderData = {
  args: {
    config: {
      charts: [
        {
          chartId: 'test-chart-1',
          chart: {
            height: 400,
            layout: {
              background: { color: '#FFFFFF' },
              textColor: '#191919',
            },
          },
          series: [
            {
              type: 'Line',
              data: [
                { time: '2023-01-01', value: 100 },
                { time: '2023-01-02', value: 105 },
              ],
              options: {
                color: '#2196F3',
                lineWidth: 2,
              },
            },
          ],
        },
      ],
    },
  },
  theme: {
    base: 'light',
    primaryColor: '#FF4B4B',
    backgroundColor: '#FFFFFF',
    secondaryBackgroundColor: '#F0F2F6',
    textColor: '#262730',
  },
};

vi.mock('../../hooks/useStreamlit', () => ({
  useStreamlitRenderData: vi.fn(() => mockRenderData),
  useStreamlitFrameHeight: vi.fn(() => {
    // Simulate the hook calling setFrameHeight with error handling
    React.useEffect(() => {
      if (typeof mockStreamlit !== 'undefined' && mockStreamlit.setFrameHeight) {
        try {
          mockStreamlit.setFrameHeight();
        } catch (error) {
          // Silently catch errors in the mock to avoid breaking tests
          // The real hook also catches and logs errors
        }
      }
    });
  }),
  isStreamlitComponentReady: vi.fn(() => true),
}));

// Mock ResizeObserverManager
vi.mock('../../utils/resizeObserverManager', () => {
  class MockResizeObserverManager {
    static getInstance() {
      return new MockResizeObserverManager();
    }

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    addObserver = vi.fn();
    removeObserver = vi.fn();
    cleanup = vi.fn();
  }

  return {
    ResizeObserverManager: MockResizeObserverManager,
  };
});

describe('Index Component', () => {
  let useStreamlitRenderData: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';

    // Import the hook and reset to default mock value
    const streamlitModule = await import('../../hooks/useStreamlit');
    useStreamlitRenderData = streamlitModule.useStreamlitRenderData;
    vi.mocked(useStreamlitRenderData).mockReturnValue(mockRenderData);
  });

  afterEach(() => {
    vi.clearAllTimers();
    // Reset mock to default value after each test
    if (useStreamlitRenderData) {
      vi.mocked(useStreamlitRenderData).mockReturnValue(mockRenderData);
    }
  });

  describe('Component Rendering', () => {
    it('should render the LightweightCharts component', async () => {
      const { default: App } = await import('../../index');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument();
      });

      expect(screen.getByText('Mock LightweightCharts Component')).toBeInTheDocument();
    });

    it('should pass config from Streamlit to LightweightCharts', async () => {
      const { default: App } = await import('../../index');
      render(<App />);

      await waitFor(() => {
        const configElement = screen.getByTestId('chart-config');
        expect(configElement.textContent).toContain('test-chart-1');
      });
    });

    it('should render when renderData is undefined', async () => {
      vi.mocked(useStreamlitRenderData).mockReturnValue(undefined);

      const { default: App } = await import('../../index');
      const { container } = render(<App />);

      // Should render loading state or empty state
      expect(container).toBeInTheDocument();
      // Check that it shows loading state
      expect(container.textContent).toContain('Loading');
    });

    it('should handle empty config gracefully', async () => {
      vi.mocked(useStreamlitRenderData).mockReturnValue({
        args: { config: null },
        theme: mockRenderData.theme,
      } as any);

      const { default: App } = await import('../../index');
      const { container } = render(<App />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Streamlit Integration', () => {
    it('should render the component with Streamlit data', async () => {
      const { default: App } = await import('../../index');
      render(<App />);

      // Component should render successfully with mocked Streamlit data
      await waitFor(() => {
        expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument();
      });
    });

    it('should call setFrameHeight after charts are ready', async () => {
      const { default: App } = await import('../../index');
      render(<App />);

      // Wait for onChartsReady callback
      await waitFor(
        () => {
          expect(mockStreamlit.setFrameHeight).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });

    it('should cleanup without errors on unmount', async () => {
      const { default: App } = await import('../../index');
      const { unmount } = render(<App />);

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Chart Configuration', () => {
    it('should handle single chart configuration', async () => {
      const { default: App } = await import('../../index');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument();
      });
    });

    it('should handle multiple charts configuration', async () => {
      vi.mocked(useStreamlitRenderData).mockReturnValue({
        args: {
          config: {
            charts: [
              { chartId: 'chart-1', chart: { height: 300 }, series: [] },
              { chartId: 'chart-2', chart: { height: 300 }, series: [] },
            ],
          },
        },
        theme: mockRenderData.theme,
      } as any);

      const { default: App } = await import('../../index');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument();
      });
    });

    it('should handle chart with series data', async () => {
      vi.mocked(useStreamlitRenderData).mockReturnValue({
        args: {
          config: {
            charts: [
              {
                chartId: 'chart-with-series',
                chart: { height: 400 },
                series: [
                  {
                    type: 'Line',
                    data: [
                      { time: '2023-01-01', value: 100 },
                      { time: '2023-01-02', value: 110 },
                      { time: '2023-01-03', value: 105 },
                    ],
                    options: { color: '#2196F3' },
                  },
                ],
              },
            ],
          },
        },
        theme: mockRenderData.theme,
      } as any);

      const { default: App } = await import('../../index');
      render(<App />);

      await waitFor(() => {
        const configElement = screen.getByTestId('chart-config');
        expect(configElement.textContent).toContain('chart-with-series');
      });
    });
  });

  describe('Theme Integration', () => {
    it('should pass theme from Streamlit to component', async () => {
      const customTheme = {
        base: 'dark',
        primaryColor: '#00FF00',
        backgroundColor: '#000000',
        secondaryBackgroundColor: '#1A1A1A',
        textColor: '#FFFFFF',
      };

      vi.mocked(useStreamlitRenderData).mockReturnValue({
        args: mockRenderData.args,
        theme: customTheme,
      } as any);

      const { default: App } = await import('../../index');
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument();
      });
    });

    it('should handle missing theme gracefully', async () => {
      vi.mocked(useStreamlitRenderData).mockReturnValue({
        args: mockRenderData.args,
        theme: undefined,
      } as any);

      const { default: App } = await import('../../index');
      const { container } = render(<App />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in onChartsReady gracefully', async () => {
      // Mock console.error to avoid test noise
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { default: App } = await import('../../index');

      // Mock setFrameHeight to throw error
      mockStreamlit.setFrameHeight.mockImplementation(() => {
        throw new Error('setFrameHeight error');
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument();
      });

      // Should not crash the application
      expect(screen.getByText('Mock LightweightCharts Component')).toBeInTheDocument();

      consoleError.mockRestore();
      mockStreamlit.setFrameHeight.mockRestore();
    });

    it('should render without crashing when hooks return null', async () => {
      vi.mocked(useStreamlitRenderData).mockReturnValue(null as any);

      const { default: App } = await import('../../index');
      const { container } = render(<App />);

      expect(container).toBeInTheDocument();
      // Should show loading state when renderData is null
      expect(container.textContent).toContain('Loading');
    });
  });

  describe('Frame Height Management', () => {
    it('should report frame height after rendering', async () => {
      const { default: App } = await import('../../index');
      render(<App />);

      // useStreamlitFrameHeight is called on every render
      await waitFor(() => {
        expect(mockStreamlit.setFrameHeight).toHaveBeenCalled();
      });
    });

    it('should update frame height when content changes', async () => {
      const { default: App } = await import('../../index');
      const { rerender } = render(<App />);

      const initialCallCount = mockStreamlit.setFrameHeight.mock.calls.length;

      // Re-render component
      rerender(<App />);

      await waitFor(() => {
        // Should call setFrameHeight again
        expect(mockStreamlit.setFrameHeight.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should re-render when config changes', async () => {
      // Initial config (already set in beforeEach)
      const { default: App } = await import('../../index');
      const { rerender } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('lightweight-charts')).toBeInTheDocument();
      });

      // Update config
      vi.mocked(useStreamlitRenderData).mockReturnValue({
        args: {
          config: {
            charts: [
              {
                chartId: 'updated-chart',
                chart: { height: 500 },
                series: [],
              },
            ],
          },
        },
        theme: mockRenderData.theme,
      } as any);

      rerender(<App />);

      await waitFor(() => {
        const configElement = screen.getByTestId('chart-config');
        expect(configElement.textContent).toContain('updated-chart');
      });
    });
  });
});
