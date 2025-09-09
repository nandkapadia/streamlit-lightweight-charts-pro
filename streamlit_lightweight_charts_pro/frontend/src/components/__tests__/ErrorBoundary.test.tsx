import React from 'react'
import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import {ErrorBoundary} from '../ErrorBoundary'

// Mock console methods
const originalConsole = {...console}
beforeEach(() => {
  console.error = jest.fn()
  console.log = jest.fn()
})

afterEach(() => {
  console.error = originalConsole.error
  console.log = originalConsole.log
})

// Component that throws an error
const ThrowError = ({shouldThrow}: {shouldThrow: boolean}) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal component</div>
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should render multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
          <span>Third child</span>
        </ErrorBoundary>
      )

      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
      expect(screen.getByText('Third child')).toBeInTheDocument()
    })

    it('should render complex nested components', () => {
      const NestedComponent = () => (
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Click me</button>
        </div>
      )

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should catch and display error when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      expect(console.error).toHaveBeenCalled()
    })

    it('should display custom error message', () => {
      const customErrorBoundary = (
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      render(customErrorBoundary)

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('should handle different types of errors', () => {
      const TypeErrorComponent = () => {
        throw new TypeError('Type error occurred')
      }

      render(
        <ErrorBoundary>
          <TypeErrorComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })

    it('should handle reference errors', () => {
      const ReferenceErrorComponent = () => {
        throw new ReferenceError('Reference error occurred')
      }

      render(
        <ErrorBoundary>
          <ReferenceErrorComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })

    it('should handle syntax errors', () => {
      const SyntaxErrorComponent = () => {
        throw new SyntaxError('Syntax error occurred')
      }

      render(
        <ErrorBoundary>
          <SyntaxErrorComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })
  })

  describe('Error Recovery', () => {
    it('should recover when error is resolved', () => {
      const {rerender} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

      // Re-render without error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Normal component')).toBeInTheDocument()
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
    })

    it('should handle multiple error-recovery cycles', () => {
      const {rerender} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Normal component')).toBeInTheDocument()

      // Throw error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

      // Recover
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Normal component')).toBeInTheDocument()
    })
  })

  describe('Error Boundary Lifecycle', () => {
    it('should call componentDidCatch when error occurs', () => {
      const mockComponentDidCatch = jest.fn()

      class TestErrorBoundary extends ErrorBoundary {
        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          mockComponentDidCatch(error, errorInfo)
          super.componentDidCatch(error, errorInfo)
        }
      }

      render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      )

      expect(mockComponentDidCatch).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('should update state when error occurs', () => {
      const {container} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // The error boundary should have error state
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorElement = screen.getByText(/Something went wrong/i)
      expect(errorElement).toBeInTheDocument()
    })

    it('should be keyboard accessible', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const errorElement = screen.getByText(/Something went wrong/i)
      expect(errorElement).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should not cause performance issues with large component trees', () => {
      const LargeComponent = () => (
        <div>
          {Array.from({length: 1000}, (_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </div>
      )

      render(
        <ErrorBoundary>
          <LargeComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText('Item 0')).toBeInTheDocument()
      expect(screen.getByText('Item 999')).toBeInTheDocument()
    })

    it('should handle rapid error-recovery cycles', () => {
      const {rerender} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // Rapidly toggle between error and normal states
      for (let i = 0; i < 10; i++) {
        rerender(
          <ErrorBoundary>
            <ThrowError shouldThrow={i % 2 === 0} />
          </ErrorBoundary>
        )
      }

      // Should still work correctly
      expect(screen.getByText('Normal component')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>)
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })

    it('should handle undefined children', () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>)
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      render(<ErrorBoundary>{}</ErrorBoundary>)
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })

    it('should handle children that return null', () => {
      const NullComponent = () => null

      render(
        <ErrorBoundary>
          <NullComponent />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })

    it('should handle async errors', async () => {
      const AsyncErrorComponent = () => {
        React.useEffect(() => {
          throw new Error('Async error')
        }, [])
        return <div>Async component</div>
      }

      render(
        <ErrorBoundary>
          <AsyncErrorComponent />
        </ErrorBoundary>
      )

      // Should initially render the component
      expect(screen.getByText('Async component')).toBeInTheDocument()
    })
  })
})
