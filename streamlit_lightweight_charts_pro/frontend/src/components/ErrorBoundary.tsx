/**
 * @fileoverview Error Boundary Component
 *
 * React error boundary component that catches JavaScript errors anywhere in the
 * component tree, logs those errors, and displays a fallback UI.
 *
 * This component provides:
 * - Error catching and logging
 * - Fallback UI rendering
 * - Automatic error recovery
 * - Development debugging support
 * - Configurable reset behavior
 *
 * Features:
 * - Catches errors in child components
 * - Logs errors for debugging (development only)
 * - Displays fallback UI when errors occur
 * - Supports automatic reset on prop changes
 * - Configurable reset keys for selective recovery
 *
 * @example
 * ```tsx
 * import { ErrorBoundary } from './ErrorBoundary';
 *
 * <ErrorBoundary
 *   fallback={<div>Something went wrong</div>}
 *   onError={(error, errorInfo) => console.error(error)}
 *   resetKeys={[chartId]}
 * >
 *   <ChartComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (_error: Error, _errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: Date.now().toString(),
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(),
    };
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Auto-reset on resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      if (resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetErrorBoundary();
      }
    }

    // Auto-reset on any prop change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(_error, _errorInfo);
    }

    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      logger.error('ErrorBoundary caught an error', 'ErrorBoundary', _error);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorId: Date.now().toString(),
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            color: '#d63031',
            textAlign: 'center',
            margin: '10px 0',
          }}
        >
          <h3>Chart Error</h3>
          <p>Something went wrong while rendering the chart.</p>
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: '10px',
                fontWeight: '500',
              }}
            >
              🔄 Try Again
            </button>
            {process.env.NODE_ENV === 'development' && (
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#74b9ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                🐛 Log Error
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}
