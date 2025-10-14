/**
 * @fileoverview Unified test utilities for DRY-compliant testing
 *
 * Provides common test patterns, assertions, and utilities to eliminate
 * code duplication across test files.
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';

/**
 * Test configuration interface
 */
export interface TestConfig {
  /** Test timeout in milliseconds */
  timeout?: number;
  /** Whether to enable console output */
  enableConsole?: boolean;
  /** Whether to suppress warnings */
  suppressWarnings?: boolean;
  /** Custom setup function */
  setup?: () => void | Promise<void>;
  /** Custom teardown function */
  teardown?: () => void | Promise<void>;
}

/**
 * Base test class with common patterns
 */
export abstract class BaseTest {
  protected config: TestConfig;
  protected mocks: Map<string, any> = new Map();

  constructor(config: TestConfig = {}) {
    this.config = {
      timeout: 5000,
      enableConsole: false,
      suppressWarnings: true,
      ...config,
    };
  }

  /**
   * Setup test environment
   */
  async setup(): Promise<void> {
    // Suppress console output if disabled
    if (!this.config.enableConsole) {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
    }

    // Suppress warnings if configured
    if (this.config.suppressWarnings) {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    }

    // Run custom setup
    if (this.config.setup) {
      await this.config.setup();
    }
  }

  /**
   * Teardown test environment
   */
  async teardown(): Promise<void> {
    // Clear all mocks
    vi.clearAllMocks();
    this.mocks.clear();

    // Run custom teardown
    if (this.config.teardown) {
      await this.config.teardown();
    }
  }

  /**
   * Create a mock and store it
   */
  protected createMock<T>(name: string, implementation?: T): T {
    // @ts-expect-error - Type mismatch between vi.fn and T is expected for mock creation
    const mock = vi.fn(implementation) as T;
    this.mocks.set(name, mock);
    return mock;
  }

  /**
   * Get a stored mock
   */
  protected getMock<T>(name: string): T {
    return this.mocks.get(name) as T;
  }

  /**
   * Assert mock was called
   */
  protected expectMockCalled(name: string, times?: number): void {
    const mock = this.getMock(name);
    if (times !== undefined) {
      expect(mock).toHaveBeenCalledTimes(times);
    } else {
      expect(mock).toHaveBeenCalled();
    }
  }
}

/**
 * Component test utilities
 */
export class ComponentTestUtilities {
  /**
   * Render component with common options
   */
  static renderComponent(component: ReactElement, options?: RenderOptions) {
    const defaultOptions: RenderOptions = {
      // Add common render options here
    };

    return render(component, { ...defaultOptions, ...options });
  }

  /**
   * Create test wrapper with providers
   */
  static createTestWrapper(providers: ReactElement[] = []) {
    return ({ children }: { children: ReactElement }) => {
      return providers.reduce(
        (acc, provider) => React.cloneElement(provider, { children: acc } as any),
        children
      );
    };
  }

  /**
   * Wait for async operations
   */
  static async waitForAsync(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Advance timers and wait
   */
  static async advanceTimersAndWait(ms: number = 100): Promise<void> {
    vi.advanceTimersByTime(ms);
    await this.waitForAsync(10);
  }
}

/**
 * Mock utilities
 */
export class MockUtilities {
  /**
   * Create mock chart API
   */
  static createMockChart() {
    return {
      addSeries: vi.fn(),
      removeSeries: vi.fn(),
      timeScale: vi.fn(() => ({
        timeToCoordinate: vi.fn(),
        coordinateToTime: vi.fn(),
        getVisibleRange: vi.fn(),
        setVisibleRange: vi.fn(),
        options: vi.fn(() => ({})),
      })),
      priceScale: vi.fn(() => ({
        priceToCoordinate: vi.fn(),
        coordinateToPrice: vi.fn(),
        getVisibleRange: vi.fn(),
        setVisibleRange: vi.fn(),
        options: vi.fn(() => ({})),
      })),
      chartElement: vi.fn(() => ({
        clientWidth: 800,
        clientHeight: 600,
      })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      remove: vi.fn(),
    };
  }

  /**
   * Create mock series API
   */
  static createMockSeries() {
    return {
      setData: vi.fn(),
      updateData: vi.fn(),
      data: vi.fn(() => []),
      priceToCoordinate: vi.fn(),
      coordinateToPrice: vi.fn(),
      attachPrimitive: vi.fn(),
      detachPrimitive: vi.fn(),
      options: vi.fn(() => ({})),
      applyOptions: vi.fn(),
      remove: vi.fn(),
    };
  }

  /**
   * Create mock render data
   */
  static createMockRenderData(overrides: any = {}) {
    return {
      args: {
        config: {
          charts: [
            {
              chart: {
                height: 400,
                width: 800,
              },
              series: [],
            },
          ],
        },
        height: 400,
        width: 800,
        ...overrides,
      },
      theme: {
        base: 'light',
        primaryColor: '#ff0000',
        backgroundColor: '#ffffff',
        secondaryBackgroundColor: '#f0f2f6',
        textColor: '#262730',
      },
      disabled: false,
      ...overrides,
    };
  }

  /**
   * Create mock Streamlit
   */
  static createMockStreamlit() {
    return {
      setComponentValue: vi.fn(),
      setFrameHeight: vi.fn(),
      RENDER_EVENT: 'streamlit:render',
      SET_COMPONENT_VALUE_EVENT: 'streamlit:setComponentValue',
      SET_FRAME_HEIGHT_EVENT: 'streamlit:setFrameHeight',
    };
  }
}

/**
 * Assertion utilities
 */
export class AssertionUtilities {
  /**
   * Assert chart was created with correct options
   */
  static expectChartCreated(mockChart: any, expectedOptions: any) {
    expect(mockChart.addSeries).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining(expectedOptions)
    );
  }

  /**
   * Assert series was created with correct data
   */
  static expectSeriesCreated(mockSeries: any, expectedData: any[]) {
    expect(mockSeries.setData).toHaveBeenCalledWith(expectedData);
  }

  /**
   * Assert component rendered without errors
   */
  static expectComponentRendered(container: HTMLElement) {
    expect(container).toBeInTheDocument();
    expect(container.children.length).toBeGreaterThan(0);
  }

  /**
   * Assert error was handled gracefully
   */
  static expectErrorHandled(consoleSpy: any, expectedMessage?: string) {
    if (expectedMessage) {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(expectedMessage));
    } else {
      expect(consoleSpy).toHaveBeenCalled();
    }
  }
}

/**
 * Test decorators for common patterns
 */
export const TestDecorators = {
  /**
   * Decorator for async tests
   */
  async: (timeout: number = 5000) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: any[]) {
        return Promise.race([
          originalMethod.apply(this, args),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), timeout)),
        ]);
      };
    };
  },

  /**
   * Decorator for setup/teardown
   */
  withSetup: (setup: () => void | Promise<void>, teardown?: () => void | Promise<void>) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: any[]) {
        await setup();
        try {
          return await originalMethod.apply(this, args);
        } finally {
          if (teardown) {
            await teardown();
          }
        }
      };
    };
  },
};

/**
 * Common test patterns
 */
export const TestPatterns = {
  /**
   * Setup/teardown pattern
   */
  setupTeardown: (setup: () => void | Promise<void>, teardown?: () => void | Promise<void>) => {
    beforeEach(async () => {
      await setup();
    });

    if (teardown) {
      afterEach(async () => {
        await teardown();
      });
    }
  },

  /**
   * Mock cleanup pattern
   */
  mockCleanup: () => {
    afterEach(() => {
      vi.clearAllMocks();
    });
  },

  /**
   * Timer cleanup pattern
   */
  timerCleanup: () => {
    afterEach(() => {
      vi.useRealTimers();
    });
  },
};
