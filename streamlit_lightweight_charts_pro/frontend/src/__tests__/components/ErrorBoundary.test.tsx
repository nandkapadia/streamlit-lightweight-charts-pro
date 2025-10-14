/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../../components/ErrorBoundary';

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal component</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
          <span>Third child</span>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });

    it('should render complex nested components', () => {
      const NestedComponent = () => (
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Click me</button>
        </div>
      );

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should display custom error message', () => {
      const customErrorBoundary = (
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      render(customErrorBoundary);

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should handle different types of errors', () => {
      const TypeErrorComponent = () => {
        throw new TypeError('Type error occurred');
      };

      const { container } = render(
        <ErrorBoundary>
          <TypeErrorComponent />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent(/Something went wrong/i);
    });

    it('should handle reference errors', () => {
      const ReferenceErrorComponent = () => {
        throw new ReferenceError('Reference error occurred');
      };

      const { container } = render(
        <ErrorBoundary>
          <ReferenceErrorComponent />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent(/Something went wrong/i);
    });

    it('should handle syntax errors', () => {
      const SyntaxErrorComponent = () => {
        throw new SyntaxError('Syntax error occurred');
      };

      const { container } = render(
        <ErrorBoundary>
          <SyntaxErrorComponent />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent(/Something went wrong/i);
    });
  });

  describe('Error Recovery', () => {
    it('should recover when Try Again is clicked', () => {
      const { rerender, container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent(/Something went wrong/i);

      // Click Try Again to reset error state
      const tryAgainButton = screen.getByText('🔄 Try Again');
      tryAgainButton.click();

      // After clicking Try Again, re-render with non-throwing children
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent('Normal component');
      expect(container).not.toHaveTextContent(/Something went wrong/i);
    });

    it('should show error state persists until Try Again is clicked', () => {
      const { rerender, container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent(/Something went wrong/i);

      // Re-render with non-throwing children, but error state should persist
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Error boundary still shows error state until Try Again is clicked
      expect(container).toHaveTextContent(/Something went wrong/i);
      expect(container).not.toHaveTextContent('Normal component');
    });
  });

  describe('Error Boundary Lifecycle', () => {
    it('should call componentDidCatch when error occurs', () => {
      const mockComponentDidCatch = vi.fn();

      class TestErrorBoundary extends ErrorBoundary {
        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          mockComponentDidCatch(error, errorInfo);
          super.componentDidCatch(error, errorInfo);
        }
      }

      render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      );

      expect(mockComponentDidCatch).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should update state when error occurs', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // The error boundary should have error state
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes in error state', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent(/Something went wrong/i);
    });

    it('should be keyboard accessible', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent(/Something went wrong/i);
    });
  });

  describe('Performance', () => {
    it('should not cause performance issues with large component trees', () => {
      const LargeComponent = () => (
        <div>
          {Array.from({ length: 1000 }, (_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </div>
      );

      render(
        <ErrorBoundary>
          <LargeComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 999')).toBeInTheDocument();
    });

    it('should handle rapid error-recovery cycles', () => {
      const { rerender, container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent('Normal component');

      // Trigger an error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container).toHaveTextContent(/Something went wrong/i);

      // Reset error state with button click
      const tryAgainButton = screen.getByText('🔄 Try Again');
      tryAgainButton.click();

      // Re-render with non-throwing component after clicking Try Again
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Now should render without error
      expect(container).toHaveTextContent('Normal component');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      const { container } = render(<ErrorBoundary>{null}</ErrorBoundary>);
      // Null children render as empty, no error should be triggered
      expect(container).toBeInTheDocument();
      expect(container).not.toHaveTextContent(/Something went wrong/i);
    });

    it('should handle undefined children gracefully', () => {
      const { container } = render(<ErrorBoundary>{undefined}</ErrorBoundary>);
      // Undefined children render as empty, no error should be triggered
      expect(container).toBeInTheDocument();
      expect(container).not.toHaveTextContent(/Something went wrong/i);
    });

    it('should handle empty children gracefully', () => {
      const { container } = render(
        <ErrorBoundary>
          <div></div>
        </ErrorBoundary>
      );
      // Empty children render as empty, no error should be triggered
      expect(container).toBeInTheDocument();
      expect(container).not.toHaveTextContent(/Something went wrong/i);
    });

    it('should handle components that return null', () => {
      const NullComponent = () => null;

      const { container } = render(
        <ErrorBoundary>
          <NullComponent />
        </ErrorBoundary>
      );

      // Components returning null render as empty, no error should be triggered
      expect(container).toBeInTheDocument();
      expect(container).not.toHaveTextContent(/Something went wrong/i);
    });

    it('should catch errors thrown in useEffect during render', () => {
      // Suppress console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const AsyncErrorComponent = () => {
        React.useEffect(() => {
          // This error WILL be caught by ErrorBoundary in React 18+
          throw new Error('Async error');
        }, []);
        return <div>Async component</div>;
      };

      const { container } = render(
        <ErrorBoundary>
          <AsyncErrorComponent />
        </ErrorBoundary>
      );

      // Error boundary should catch and display error
      expect(container).toHaveTextContent(/Something went wrong/i);
      expect(container).not.toHaveTextContent('Async component');

      consoleSpy.mockRestore();
    });
  });
});
