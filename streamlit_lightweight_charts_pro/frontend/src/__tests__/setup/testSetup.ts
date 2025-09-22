/**
 * Global test setup file for all frontend tests
 * This file is automatically loaded by Jest before running tests
 */

import '@testing-library/jest-dom';

// Mock performance API globally
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
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

// Mock document.createElement
const originalCreateElement = document.createElement;
document.createElement = jest.fn(tagName => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement.call(document, tagName);
});

// Global test error handler to suppress expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOMTestUtils.act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});