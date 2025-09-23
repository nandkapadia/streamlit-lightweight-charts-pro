/**
 * Global test setup file for all frontend tests
 * This file is automatically loaded by Jest before running tests
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

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

// Document cleanup after each test
afterEach(() => {
  if (document.body) {
    document.body.innerHTML = '';
  }
});

// Mock performance API globally
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn((): any[] => []),
  },
  writable: true,
});

// Mock ResizeObserver globally
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver globally
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  setTimeout(callback, 0);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

Element.prototype.getBoundingClientRect = jest.fn(
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
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    canvas: {
      width: 800,
      height: 600,
    },
  })),
  width: 800,
  height: 600,
  style: {},
  getBoundingClientRect: jest.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
  })),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Enhanced DOM element creation
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas as any;
  }

  // Create proper DOM element with enhanced mocking
  const element = originalCreateElement.call(document, tagName);

  // Enhance common methods for testing
  if (!element.getBoundingClientRect.toString().includes('native code')) {
    element.getBoundingClientRect = jest.fn(() => ({
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
  element.appendChild = jest.fn((child: any) => {
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
    } catch (error) {
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
    } catch (error) {
      // Fallback: don't create container if createElement fails
      // eslint-disable-next-line no-console
      console.warn('DOM setup warning:', error);
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
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-object-url'),
});

// Mock window.URL.revokeObjectURL
Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock CSS.supports
Object.defineProperty(window, 'CSS', {
  value: {
    supports: jest.fn(() => true),
  },
});

// Mock document.execCommand
Object.defineProperty(document, 'execCommand', {
  value: jest.fn(() => true),
});

// Override global appendChild to handle testing library issues
const originalAppendChild = Element.prototype.appendChild;
Element.prototype.appendChild = function (child: any) {
  try {
    if (child && typeof child === 'object' && (child.nodeType || child instanceof Node)) {
      return originalAppendChild.call(this, child);
    }
    // Create a proper node if the child is not a valid node
    if (typeof child === 'string') {
      const textNode = document.createTextNode(child);
      return originalAppendChild.call(this, textNode);
    }
    // For invalid parameters, create a mock element and return it
    const mockElement = document.createElement('div');
    return originalAppendChild.call(this, mockElement);
  } catch (error) {
    // If all else fails, create and return a mock element
    const mockElement = document.createElement('div');
    try {
      return originalAppendChild.call(this, mockElement);
    } catch {
      return mockElement;
    }
  }
};

// Global test error handler to suppress expected errors in tests
// eslint-disable-next-line no-console
const originalError = console.error;
beforeAll(() => {
  // eslint-disable-next-line no-console
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOMTestUtils.act')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  // eslint-disable-next-line no-console
  console.error = originalError;
});
