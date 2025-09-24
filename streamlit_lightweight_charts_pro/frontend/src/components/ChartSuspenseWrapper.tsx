/**
 * Enhanced Suspense wrapper for chart components with React 19 optimizations
 * Provides better loading states and error boundaries for lazy-loaded components
 */

import React, { Suspense, useMemo, useTransition } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ChartSuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadingTime?: number;
  showProgressIndicator?: boolean;
  onLoadingStart?: () => void;
  onLoadingComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Loading skeleton component optimized for chart components
 */
const ChartLoadingSkeleton: React.FC<{ showProgress?: boolean }> = React.memo(
  ({ showProgress = false }) => (
    <div
      style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        position: 'relative',
      }}
    >
      {/* Chart area skeleton */}
      <div
        style={{
          width: '90%',
          height: '70%',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated loading bars */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '5%',
            right: '5%',
            height: '60%',
            background: `linear-gradient(
              90deg,
              #dee2e6 25%,
              #f8f9fa 50%,
              #dee2e6 75%
            )`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: '2px',
          }}
        />

        {/* Y-axis labels skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '-40px',
              top: `${15 + i * 15}%`,
              width: '30px',
              height: '12px',
              backgroundColor: '#dee2e6',
              borderRadius: '2px',
            }}
          />
        ))}

        {/* X-axis labels skeleton */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '-25px',
              left: `${10 + i * 15}%`,
              width: '40px',
              height: '12px',
              backgroundColor: '#dee2e6',
              borderRadius: '2px',
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <div
        style={{
          marginTop: '20px',
          fontSize: '14px',
          color: '#6c757d',
          fontWeight: '500',
        }}
      >
        {showProgress ? 'Loading chart components...' : 'Preparing chart...'}
      </div>

      {/* Progress indicator */}
      {showProgress && (
        <div
          style={{
            marginTop: '10px',
            width: '60%',
            height: '4px',
            backgroundColor: '#e9ecef',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '30%',
              height: '100%',
              backgroundColor: '#007bff',
              borderRadius: '2px',
              animation: 'progress 2s infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
);

/**
 * Enhanced Suspense wrapper with React 19 optimizations
 */
export const ChartSuspenseWrapper: React.FC<ChartSuspenseWrapperProps> = React.memo(({
  children,
  fallback,
  minLoadingTime = 200,
  showProgressIndicator = false,
  onLoadingStart,
  onLoadingComplete,
  onError,
}) => {
  const [isPendingTransition, startTransition] = useTransition();

  // Memoize the fallback component to prevent unnecessary re-renders
  const memoizedFallback = useMemo(() => {
    if (fallback) return fallback;
    return <ChartLoadingSkeleton showProgress={showProgressIndicator} />;
  }, [fallback, showProgressIndicator]);

  // Enhanced loading state management with minimum loading time
  const LoadingBoundary: React.FC<{ children: React.ReactNode }> = React.memo(
    ({ children }) => {
      React.useEffect(() => {
        onLoadingStart?.();

        // Ensure minimum loading time for better UX
        const timer = setTimeout(() => {
          startTransition(() => {
            onLoadingComplete?.();
          });
        }, minLoadingTime);

        return () => clearTimeout(timer);
      }, []);

      return <>{children}</>;
    }
  );

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('Chart Suspense Error:', error);
        onError?.(error);
      }}
      fallback={
        <div
          style={{
            width: '100%',
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff5f5',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            color: '#d63031',
            fontSize: '14px',
          }}
        >
          Failed to load chart component. Please try refreshing the page.
        </div>
      }
    >
      <Suspense fallback={memoizedFallback}>
        <LoadingBoundary>
          {isPendingTransition ? memoizedFallback : children}
        </LoadingBoundary>
      </Suspense>
    </ErrorBoundary>
  );
});

ChartSuspenseWrapper.displayName = 'ChartSuspenseWrapper';

/**
 * Hook for managing lazy component loading with enhanced UX
 */
export const useChartSuspense = () => {
  const [isPending, startTransition] = useTransition();
  const [loadingComponents, setLoadingComponents] = React.useState<Set<string>>(new Set());

  const loadComponent = React.useCallback((componentName: string, loadFn: () => Promise<any>) => {
    startTransition(async () => {
      setLoadingComponents(prev => new Set(prev).add(componentName));

      try {
        await loadFn();
      } finally {
        setLoadingComponents(prev => {
          const newSet = new Set(prev);
          newSet.delete(componentName);
          return newSet;
        });
      }
    });
  }, [startTransition]);

  return {
    isPending,
    loadingComponents: Array.from(loadingComponents),
    loadComponent,
    isLoading: loadingComponents.size > 0,
  };
};

/**
 * HOC for wrapping components with enhanced Suspense
 */
export function withChartSuspense<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ChartSuspenseWrapperProps, 'children'>
) {
  const WrappedComponent: React.FC<P> = (props) => (
    <ChartSuspenseWrapper {...options}>
      <Component {...props} />
    </ChartSuspenseWrapper>
  );

  WrappedComponent.displayName = `withChartSuspense(${Component.displayName || Component.name})`;

  return React.memo(WrappedComponent);
}
