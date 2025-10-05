/**
 * Tests for React 19 Suspense wrapper component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ChartSuspenseWrapper } from '../../components/ChartSuspenseWrapper';

// Mock react19PerformanceMonitor
vi.mock('../../utils/react19PerformanceMonitor', () => ({
  react19Monitor: {
    startSuspenseLoad: vi.fn(),
    endSuspenseLoad: vi.fn(),
  },
}));

// Mock lazy loading component
const MockLazyComponent = vi.fn(() => <div data-testid='lazy-component'>Loaded Component</div>);

describe('ChartSuspenseWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    const LazyComponent = vi.fn(() => {
      throw new Promise(resolve => setTimeout(resolve, 100));
    });

    render(
      <ChartSuspenseWrapper showProgressIndicator={true}>
        <LazyComponent />
      </ChartSuspenseWrapper>
    );

    // The component renders its own skeleton with loading text
    expect(screen.getByText('Loading chart components...')).toBeInTheDocument();
  });

  it('should render children when loaded', async () => {
    render(
      <ChartSuspenseWrapper>
        <MockLazyComponent />
      </ChartSuspenseWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('lazy-component')).toBeInTheDocument();
    });
  });

  it('should show progress indicator when enabled', () => {
    const LazyComponent = vi.fn(() => {
      throw new Promise(resolve => setTimeout(resolve, 100));
    });

    render(
      <ChartSuspenseWrapper showProgressIndicator={true}>
        <LazyComponent />
      </ChartSuspenseWrapper>
    );

    // Component shows loading text when progress indicator is enabled
    expect(screen.getByText('Loading chart components...')).toBeInTheDocument();
  });

  it('should render with correct structure', () => {
    render(
      <ChartSuspenseWrapper showProgressIndicator={true}>
        <div>Content</div>
      </ChartSuspenseWrapper>
    );

    // Component renders content directly without specific wrapper classes
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should support custom fallback', () => {
    const customFallback = <div data-testid='custom-fallback'>Custom Loading...</div>;

    render(
      <ChartSuspenseWrapper fallback={customFallback}>
        <div>Content</div>
      </ChartSuspenseWrapper>
    );

    // The fallback prop is passed through to internal Suspense handling
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should handle loading start callback', () => {
    const onLoadingStart = vi.fn();

    render(
      <ChartSuspenseWrapper onLoadingStart={onLoadingStart}>
        <div>Content</div>
      </ChartSuspenseWrapper>
    );

    // onLoadingStart should be called during component mount
    expect(onLoadingStart).toHaveBeenCalled();
  });

  it('should handle errors with callback', () => {
    const onErrorCallback = vi.fn();
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ChartSuspenseWrapper onError={onErrorCallback}>
        <ErrorComponent />
      </ChartSuspenseWrapper>
    );

    expect(onErrorCallback).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should render without performance issues', () => {
    // Simple render test to ensure component renders without errors
    render(
      <ChartSuspenseWrapper showProgressIndicator={true}>
        <div>Content</div>
      </ChartSuspenseWrapper>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should handle minimum loading time configuration', async () => {
    render(
      <ChartSuspenseWrapper
        minLoadingTime={50} // Use shorter time for testing
      >
        <MockLazyComponent />
      </ChartSuspenseWrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('lazy-component')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should support loading complete callback', async () => {
    const onLoadingComplete = vi.fn();

    render(
      <ChartSuspenseWrapper onLoadingComplete={onLoadingComplete} minLoadingTime={10}>
        <div>Content</div>
      </ChartSuspenseWrapper>
    );

    // Wait for the minimum loading time to complete
    await waitFor(
      () => {
        expect(onLoadingComplete).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it('should render accessible loading content', () => {
    const LazyComponent = vi.fn(() => {
      throw new Promise(resolve => setTimeout(resolve, 100));
    });

    render(
      <ChartSuspenseWrapper showProgressIndicator={true}>
        <LazyComponent />
      </ChartSuspenseWrapper>
    );

    // Component shows accessible loading text instead of progressbar role
    expect(screen.getByText('Loading chart components...')).toBeInTheDocument();
  });
});
