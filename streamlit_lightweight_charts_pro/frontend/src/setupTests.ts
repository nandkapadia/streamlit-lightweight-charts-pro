/**
 * @fileoverview Global Test Setup
 *
 * Global test configuration file automatically loaded by Vitest before running tests.
 * Provides comprehensive test environment setup with mocks, polyfills, and utilities.
 *
 * This module provides:
 * - Testing library configuration
 * - DOM polyfills for Node.js environment
 * - Global mocks (ResizeObserver, IntersectionObserver, RAF)
 * - Canvas and rendering context mocks
 * - Enhanced DOM element creation
 * - Automatic cleanup between tests
 *
 * Features:
 * - React 18/19 compatibility setup
 * - Proper DOM mocking for testing
 * - Memory leak prevention
 * - Aggressive cleanup after each test
 * - Error suppression for expected warnings
 *
 * @example
 * ```typescript
 * // This file is automatically loaded - no import needed
 * // All tests have access to configured mocks and utilities
 *
 * describe('MyComponent', () => {
 *   it('renders correctly', () => {
 *     // DOM, Canvas, ResizeObserver all mocked
 *   });
 * });
 * ```
 */

import '@testing-library/jest-dom';
import { configure, cleanup } from '@testing-library/react';
import { vi } from 'vitest';

// Import global mock setup - this configures all shared mocks
import './__tests__/setup/globalMockSetup';

// Add polyfills for Node.js environment
if (typeof TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  global.TextDecoder = require('util').TextDecoder;
}

// Configure React Testing Library for compatibility with React 18
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 10000,
});

// Set React 18 environment flag
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// Set up React 18 test environment
Object.defineProperty(global, 'document', {
  value: document,
  writable: true,
});

// Ensure React 18 createRoot has access to proper DOM
if (typeof global.document === 'undefined') {
  global.document = document;
}

// Document cleanup after each test with aggressive memory cleanup
afterEach(() => {
  // Cleanup React Testing Library components
  cleanup();

  if (document.body) {
    document.body.innerHTML = '';
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Clear any lingering timers
  vi.clearAllTimers();

  // Clear all mocks to free memory
  vi.clearAllMocks();
});

// Mock performance API globally
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn((): any[] => []),
  },
  writable: true,
});

// Mock ResizeObserver globally
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver globally
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn(callback => {
  setTimeout(callback, 0);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock DOM methods with proper color defaults for lightweight-charts
Object.defineProperty(window, 'getComputedStyle', {
  value: (_element: Element) => ({
    getPropertyValue: (prop: string) => {
      // Return default values for common CSS properties used by lightweight-charts
      if (prop === 'background-color' || prop === 'backgroundColor') {
        return 'rgba(255, 255, 255, 1)';
      }
      if (prop === 'color' || prop === 'textColor') {
        return 'rgba(0, 0, 0, 1)';
      }
      if (prop === 'font-family' || prop === 'fontFamily') {
        return 'Arial, sans-serif';
      }
      if (prop === 'font-size' || prop === 'fontSize') {
        return '12px';
      }
      return '';
    },
  }),
  configurable: true,
  writable: true,
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

// Mock HTMLCanvasElement and CanvasRenderingContext2D
const mockCanvas = {
  getContext: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    canvas: {
      width: 800,
      height: 600,
    },
  })),
  width: 800,
  height: 600,
  style: {},
  getBoundingClientRect: vi.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
  })),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Enhanced DOM element creation
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as any;
  }

  // Create proper DOM element with enhanced mocking
  const element = originalCreateElement.call(document, tagName);

  // Enhance common methods for testing
  if (!element.getBoundingClientRect.toString().includes('native code')) {
    element.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })) as any;
  }

  // Mock appendChild to handle non-Node parameters safely
  const originalAppendChild = element.appendChild;
  element.appendChild = vi.fn((child: any) => {
    try {
      if (child && typeof child === 'object' && (child.nodeType || child instanceof Node)) {
        return originalAppendChild.call(element, child);
      }
      // Create a proper node if the child is not a valid node
      if (typeof child === 'string') {
        const textNode = document.createTextNode(child);
        return originalAppendChild.call(element, textNode);
      }
      // Return a mock node for other invalid parameters
      return child || element;
    } catch {
      // If appendChild fails, just return the element
      return child || element;
    }
  }) as any;

  return element;
});

// Ensure document and document.body are properly initialized for React Testing Library
beforeEach(() => {
  // Ensure document.body exists and is connected to the document
  if (!document.body) {
    document.body = originalCreateElement.call(document, 'body');
    document.documentElement.appendChild(document.body);
  }

  // Reset document.body to ensure clean state
  document.body.innerHTML = '';

  // Create a container div for React Testing Library - check if createElement works
  if (typeof document.createElement === 'function') {
    try {
      const container = document.createElement('div');
      if (container && typeof container.setAttribute === 'function') {
        container.setAttribute('id', 'react-test-container');
        document.body.appendChild(container);
      }
    } catch {
      // Fallback: don't create container if createElement fails
      console.warn('A warning occurred');
    }
  }

  // Ensure document.body has proper dimensions for layout calculations
  Object.defineProperty(document.body, 'offsetHeight', {
    configurable: true,
    value: 600,
  });

  Object.defineProperty(document.body, 'offsetWidth', {
    configurable: true,
    value: 800,
  });

  // Ensure document.body is properly connected to the DOM
  if (!document.body.isConnected) {
    document.documentElement.appendChild(document.body);
  }

  // Make sure document and documentElement are properly defined
  if (!document.documentElement) {
    const html = document.createElement('html');
    document.appendChild(html);
    html.appendChild(document.body);
  }
});

// Mock additional DOM properties and methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-object-url'),
});

// Mock window.URL.revokeObjectURL
Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock CSS.supports
Object.defineProperty(window, 'CSS', {
  value: {
    supports: vi.fn(() => true),
  },
});

// Mock document.execCommand
if (!document.execCommand) {
  Object.defineProperty(document, 'execCommand', {
    value: vi.fn(() => true),
  });
}

// Override global appendChild to handle testing library issues
const originalAppendChild = Element.prototype.appendChild;
Element.prototype.appendChild = function <T extends Node>(child: T): T {
  try {
    if (child && typeof child === 'object' && (child.nodeType || child instanceof Node)) {
      return originalAppendChild.call(this, child) as T;
    }
    // Create a proper node if the child is not a valid node
    if (typeof child === 'string') {
      const textNode = document.createTextNode(child);
      return originalAppendChild.call(this, textNode) as T;
    }
    // For invalid parameters, create a mock element and return it
    const mockElement = document.createElement('div');
    return originalAppendChild.call(this, mockElement) as T;
  } catch {
    // If all else fails, create and return a mock element
    const mockElement = document.createElement('div');
    try {
      return originalAppendChild.call(this, mockElement) as T;
    } catch {
      return mockElement as unknown as T;
    }
  }
};

// Global test error handler to suppress expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOMTestUtils.act')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
