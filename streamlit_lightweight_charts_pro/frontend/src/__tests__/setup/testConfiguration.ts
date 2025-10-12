/**
 * @fileoverview Centralized test configuration system for unified mock and test data management
 *
 * This module provides a comprehensive configuration system that manages all aspects
 * of test execution including mock behavior, test data generation, environment setup,
 * and performance monitoring across the entire test suite.
 */

import { vi, afterAll } from 'vitest';
import { MockFactory, MockConfig, MockPresets, setupGlobalMocks } from '../mocks/MockFactory';

import {
  TestDataFactory,
  TestDataConfig,
  TestDataPresets,
  setupTestDataDefaults,
} from '../mocks/TestDataFactory';

// Test environment configuration
export interface TestEnvironmentConfig {
  // Mock configuration
  mockConfig: MockConfig;

  // Test data configuration
  testDataConfig: TestDataConfig;

  // Performance monitoring
  enablePerformanceMonitoring: boolean;
  performanceThresholds: {
    chartCreation: number;
    seriesAddition: number;
    dataUpdate: number;
    resize: number;
    cleanup: number;
  };

  // Memory management
  enableMemoryTracking: boolean;
  memoryLeakThreshold: number;
  autoCleanup: boolean;

  // Logging and debugging
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug';
  enableConsoleOutput: boolean;
  suppressWarnings: string[]; // Array of warning patterns to suppress

  // Test execution
  timeout: number;
  retries: number;
  parallel: boolean;

  // Error handling
  failFast: boolean;
  collectCoverage: boolean;

  // Custom behavior
  customBehavior: Record<string, unknown>;
}

// Pre-configured test environment presets
export const TestEnvironmentPresets = {
  /**
   * Unit testing preset - Fast, isolated tests
   */
  unit: (): TestEnvironmentConfig => ({
    mockConfig: MockPresets.unit(),
    testDataConfig: TestDataPresets.unit(),
    enablePerformanceMonitoring: false,
    performanceThresholds: {
      chartCreation: 100,
      seriesAddition: 50,
      dataUpdate: 25,
      resize: 16,
      cleanup: 50,
    },
    enableMemoryTracking: false,
    memoryLeakThreshold: 1024 * 1024, // 1MB
    autoCleanup: true,
    logLevel: 'error',
    enableConsoleOutput: false,
    suppressWarnings: ['ReactDOMTestUtils.act', 'useLayoutEffect', 'React.createFactory'],
    timeout: 5000,
    retries: 0,
    parallel: true,
    failFast: false,
    collectCoverage: true,
    customBehavior: {},
  }),

  /**
   * Integration testing preset - More realistic behavior
   */
  integration: (): TestEnvironmentConfig => ({
    mockConfig: MockPresets.integration(),
    testDataConfig: TestDataPresets.integration(),
    enablePerformanceMonitoring: true,
    performanceThresholds: {
      chartCreation: 500,
      seriesAddition: 100,
      dataUpdate: 50,
      resize: 32,
      cleanup: 100,
    },
    enableMemoryTracking: true,
    memoryLeakThreshold: 5 * 1024 * 1024, // 5MB
    autoCleanup: true,
    logLevel: 'warn',
    enableConsoleOutput: false,
    suppressWarnings: ['ReactDOMTestUtils.act'],
    timeout: 15000,
    retries: 1,
    parallel: true,
    failFast: false,
    collectCoverage: true,
    customBehavior: {
      includeNetworkDelay: true,
      simulateUserInteraction: true,
    },
  }),

  /**
   * Performance testing preset - Optimized for performance measurement
   */
  performance: (): TestEnvironmentConfig => ({
    mockConfig: MockPresets.performance(),
    testDataConfig: TestDataPresets.performance(),
    enablePerformanceMonitoring: true,
    performanceThresholds: {
      chartCreation: 1000,
      seriesAddition: 200,
      dataUpdate: 100,
      resize: 16,
      cleanup: 200,
    },
    enableMemoryTracking: true,
    memoryLeakThreshold: 10 * 1024 * 1024, // 10MB
    autoCleanup: true,
    logLevel: 'info',
    enableConsoleOutput: true,
    suppressWarnings: [],
    timeout: 30000,
    retries: 2,
    parallel: false, // Sequential for accurate timing
    failFast: false,
    collectCoverage: false,
    customBehavior: {
      includeMemoryAPI: true,
      enableDetailedTiming: true,
    },
  }),

  /**
   * Stress testing preset - High load scenarios
   */
  stress: (): TestEnvironmentConfig => ({
    mockConfig: MockPresets.errorTesting(),
    testDataConfig: TestDataPresets.stress(),
    enablePerformanceMonitoring: true,
    performanceThresholds: {
      chartCreation: 2000,
      seriesAddition: 500,
      dataUpdate: 200,
      resize: 50,
      cleanup: 500,
    },
    enableMemoryTracking: true,
    memoryLeakThreshold: 50 * 1024 * 1024, // 50MB
    autoCleanup: true,
    logLevel: 'debug',
    enableConsoleOutput: true,
    suppressWarnings: [],
    timeout: 60000,
    retries: 3,
    parallel: false,
    failFast: true,
    collectCoverage: false,
    customBehavior: {
      includeMemoryAPI: true,
      simulateMemoryPressure: true,
      enableStressMetrics: true,
    },
  }),

  /**
   * Memory leak detection preset - Focused on memory management
   */
  memoryLeak: (): TestEnvironmentConfig => ({
    mockConfig: MockPresets.memoryLeakDetection(),
    testDataConfig: TestDataPresets.performance(),
    enablePerformanceMonitoring: false,
    performanceThresholds: {
      chartCreation: 5000,
      seriesAddition: 1000,
      dataUpdate: 500,
      resize: 100,
      cleanup: 1000,
    },
    enableMemoryTracking: true,
    memoryLeakThreshold: 100 * 1024 * 1024, // 100MB
    autoCleanup: false, // Manually managed for leak detection
    logLevel: 'debug',
    enableConsoleOutput: true,
    suppressWarnings: [],
    timeout: 120000,
    retries: 0,
    parallel: false,
    failFast: true,
    collectCoverage: false,
    customBehavior: {
      includeMemoryAPI: true,
      enableWeakRefTracking: true,
      trackObjectLifecycle: true,
    },
  }),

  /**
   * Development preset - Debugging friendly
   */
  development: (): TestEnvironmentConfig => ({
    mockConfig: MockPresets.unit(),
    testDataConfig: TestDataPresets.unit(),
    enablePerformanceMonitoring: false,
    performanceThresholds: {
      chartCreation: 10000,
      seriesAddition: 5000,
      dataUpdate: 2000,
      resize: 1000,
      cleanup: 5000,
    },
    enableMemoryTracking: false,
    memoryLeakThreshold: 1024 * 1024 * 1024, // 1GB
    autoCleanup: true,
    logLevel: 'debug',
    enableConsoleOutput: true,
    suppressWarnings: [],
    timeout: 30000,
    retries: 0,
    parallel: false,
    failFast: false,
    collectCoverage: false,
    customBehavior: {
      enableDetailedLogging: true,
      includeStackTraces: true,
    },
  }),
};

/**
 * Global test configuration manager
 */
export class TestConfigurationManager {
  private static currentConfig: TestEnvironmentConfig = TestEnvironmentPresets.unit();
  private static isSetup = false;

  /**
   * Configure the global test environment
   */
  static configure(preset: keyof typeof TestEnvironmentPresets | TestEnvironmentConfig): void {
    if (typeof preset === 'string') {
      this.currentConfig = TestEnvironmentPresets[preset]();
    } else {
      this.currentConfig = preset;
    }

    this.applyConfiguration();
  }

  /**
   * Get current configuration
   */
  static getConfig(): TestEnvironmentConfig {
    return { ...this.currentConfig };
  }

  /**
   * Update specific configuration values
   */
  static updateConfig(updates: Partial<TestEnvironmentConfig>): void {
    this.currentConfig = {
      ...this.currentConfig,
      ...updates,
      mockConfig: { ...this.currentConfig.mockConfig, ...updates.mockConfig },
      testDataConfig: { ...this.currentConfig.testDataConfig, ...updates.testDataConfig },
      performanceThresholds: {
        ...this.currentConfig.performanceThresholds,
        ...updates.performanceThresholds,
      },
      customBehavior: { ...this.currentConfig.customBehavior, ...updates.customBehavior },
    };

    this.applyConfiguration();
  }

  /**
   * Apply configuration to all systems
   */
  private static applyConfiguration(): void {
    // Configure MockFactory
    MockFactory.configure(this.currentConfig.mockConfig);
    setupGlobalMocks(this.currentConfig.mockConfig);

    // Configure TestDataFactory
    TestDataFactory.configure(this.currentConfig.testDataConfig);
    setupTestDataDefaults(this.currentConfig.testDataConfig);

    // Configure console output
    this.configureConsoleOutput();

    // Configure Vitest timeouts
    this.configureTestTimeouts();

    // Configure performance monitoring
    this.configurePerformanceMonitoring();

    this.isSetup = true;
  }

  /**
   * Configure console output based on settings
   */
  private static configureConsoleOutput(): void {
    if (!this.currentConfig.enableConsoleOutput) {
      // Suppress console output except errors
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalInfo = console.info;

      console.log = vi.fn();
      console.warn = vi.fn();
      console.info = vi.fn();

      // Restore console methods after tests
      afterAll(() => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.info = originalInfo;
      });
    }

    // Handle warning suppression
    if (this.currentConfig.suppressWarnings.length > 0) {
      const originalError = console.error;

      console.error = (...args: unknown[]) => {
        const message = args[0]?.toString() || '';

        for (const pattern of this.currentConfig.suppressWarnings) {
          if (message.includes(pattern)) {
            return; // Suppress this warning
          }
        }

        originalError.call(console, ...args);
      };

      afterAll(() => {
        console.error = originalError;
      });
    }
  }

  /**
   * Configure test timeouts
   */
  private static configureTestTimeouts(): void {
    vi.setConfig({
      testTimeout: this.currentConfig.timeout,
    });
  }

  /**
   * Configure performance monitoring
   */
  private static configurePerformanceMonitoring(): void {
    if (this.currentConfig.enablePerformanceMonitoring) {
      // Setup global performance tracking
      const performanceMetrics = new Map<string, number[]>();

      global.trackPerformance = (operation: string, duration: number) => {
        if (!performanceMetrics.has(operation)) {
          performanceMetrics.set(operation, []);
        }
        performanceMetrics.get(operation)!.push(duration);
      };

      global.getPerformanceMetrics = (operation?: string) => {
        if (operation) {
          return performanceMetrics.get(operation) || [];
        }
        return Object.fromEntries(performanceMetrics.entries());
      };

      global.clearPerformanceMetrics = () => {
        performanceMetrics.clear();
      };

      global.performanceThresholds = this.currentConfig.performanceThresholds;
    }
  }

  /**
   * Setup memory tracking if enabled
   */
  static setupMemoryTracking(): WeakSet<object> | null {
    if (!this.currentConfig.enableMemoryTracking) {
      return null;
    }

    const trackedObjects = new WeakSet<object>();

    global.trackObject = <T extends object>(obj: T): T => {
      trackedObjects.add(obj);
      return obj;
    };

    return trackedObjects;
  }

  /**
   * Cleanup test environment
   */
  static cleanup(): void {
    if (this.currentConfig.autoCleanup) {
      // Reset MockFactory
      MockFactory.resetAll();

      // Clear performance metrics
      if (global.clearPerformanceMetrics) {
        global.clearPerformanceMetrics();
      }

      // Force garbage collection if available
      if (global.gc && this.currentConfig.enableMemoryTracking) {
        global.gc();
      }
    }
  }

  /**
   * Check if configuration is applied
   */
  static isConfigured(): boolean {
    return this.isSetup;
  }

  /**
   * Reset to default configuration
   */
  static reset(): void {
    this.currentConfig = TestEnvironmentPresets.unit();
    this.isSetup = false;
  }

  /**
   * Get test environment info for debugging
   */
  static getEnvironmentInfo(): Record<string, unknown> {
    return {
      preset: this.detectCurrentPreset(),
      config: this.currentConfig,
      isSetup: this.isSetup,
      nodeEnv: process.env.NODE_ENV,
      testEnvironment: process.env.TEST_ENVIRONMENT,
      memory: process.memoryUsage(),
    };
  }

  /**
   * Detect which preset is currently being used
   */
  private static detectCurrentPreset(): string {
    for (const [name, preset] of Object.entries(TestEnvironmentPresets)) {
      const presetConfig = preset();
      if (JSON.stringify(presetConfig) === JSON.stringify(this.currentConfig)) {
        return name;
      }
    }
    return 'custom';
  }
}

// Global type declarations for performance tracking
declare global {
  var trackPerformance: (operation: string, duration: number) => void;
  var getPerformanceMetrics: (operation?: string) => number[] | Record<string, number[]>;
  var clearPerformanceMetrics: () => void;
  var performanceThresholds: TestEnvironmentConfig['performanceThresholds'];
  var trackObject: <T extends object>(obj: T) => T;
  // @ts-expect-error - Global gc function type conflicts
  var gc: any;
}

/**
 * Utility functions for test setup
 */

/**
 * Setup test suite with specific configuration
 */
export function setupTestSuite(preset: keyof typeof TestEnvironmentPresets = 'unit'): void {
  TestConfigurationManager.configure(preset);
}

/**
 * Create custom test configuration
 */
export function createTestConfig(
  base: keyof typeof TestEnvironmentPresets,
  overrides: Partial<TestEnvironmentConfig>
): TestEnvironmentConfig {
  const baseConfig = TestEnvironmentPresets[base]();
  return {
    ...baseConfig,
    ...overrides,
    mockConfig: { ...baseConfig.mockConfig, ...overrides.mockConfig },
    testDataConfig: { ...baseConfig.testDataConfig, ...overrides.testDataConfig },
    performanceThresholds: {
      ...baseConfig.performanceThresholds,
      ...overrides.performanceThresholds,
    },
    customBehavior: { ...baseConfig.customBehavior, ...overrides.customBehavior },
  };
}

/**
 * Performance testing utilities
 */
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;

  if (global.trackPerformance) {
    global.trackPerformance(operation, duration);
  }

  return { result, duration };
}

/**
 * Memory usage utilities
 */
export function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

export function forceGarbageCollection(): void {
  if (global.gc) {
    global.gc();
  }
}

// Export everything for easy importing
export { MockFactory, MockPresets, TestDataFactory, TestDataPresets };
export type { MockConfig, TestDataConfig };
