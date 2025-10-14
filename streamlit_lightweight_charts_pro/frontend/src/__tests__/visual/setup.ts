/**
 * Visual Test Setup
 *
 * Configures the test environment for visual regression testing:
 * - Patches jsdom's HTMLCanvasElement to use node-canvas for real rendering
 * - Sets up necessary browser APIs
 * - Configures consistent rendering environment
 *
 * @module visual/setup
 */

import { Canvas } from 'canvas';

// Map to store node-canvas instances for each HTMLCanvasElement
const canvasMap = new WeakMap<HTMLCanvasElement, Canvas>();

/**
 * Patch HTMLCanvasElement to use node-canvas for actual rendering
 */
function setupCanvasEnvironment() {
  const OriginalHTMLCanvasElement = globalThis.HTMLCanvasElement;

  // Patch getContext to return node-canvas context
  const originalGetContext = OriginalHTMLCanvasElement.prototype.getContext;
  OriginalHTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextType: string,
    options?: any
  ): any {
    if (contextType === '2d') {
      // Get or create node-canvas for this element
      let nodeCanvas = canvasMap.get(this);
      if (!nodeCanvas) {
        nodeCanvas = new Canvas(this.width || 300, this.height || 150);
        canvasMap.set(this, nodeCanvas);
      }

      // Sync dimensions
      if (nodeCanvas.width !== this.width) {
        nodeCanvas.width = this.width;
      }
      if (nodeCanvas.height !== this.height) {
        nodeCanvas.height = this.height;
      }

      return nodeCanvas.getContext('2d', options);
    }

    return originalGetContext.call(this, contextType, options);
  };

  // Patch width setter to sync with node-canvas
  const widthDescriptor = Object.getOwnPropertyDescriptor(
    OriginalHTMLCanvasElement.prototype,
    'width'
  );
  if (widthDescriptor) {
    const originalWidthSetter = widthDescriptor.set;
    Object.defineProperty(OriginalHTMLCanvasElement.prototype, 'width', {
      get: widthDescriptor.get,
      set: function (this: HTMLCanvasElement, value: number) {
        if (originalWidthSetter) {
          originalWidthSetter.call(this, value);
        }
        const nodeCanvas = canvasMap.get(this);
        if (nodeCanvas) {
          nodeCanvas.width = value;
        }
      },
      configurable: true,
    });
  }

  // Patch height setter to sync with node-canvas
  const heightDescriptor = Object.getOwnPropertyDescriptor(
    OriginalHTMLCanvasElement.prototype,
    'height'
  );
  if (heightDescriptor) {
    const originalHeightSetter = heightDescriptor.set;
    Object.defineProperty(OriginalHTMLCanvasElement.prototype, 'height', {
      get: heightDescriptor.get,
      set: function (this: HTMLCanvasElement, value: number) {
        if (originalHeightSetter) {
          originalHeightSetter.call(this, value);
        }
        const nodeCanvas = canvasMap.get(this);
        if (nodeCanvas) {
          nodeCanvas.height = value;
        }
      },
      configurable: true,
    });
  }

  // Add toBuffer method for saving PNGs
  (OriginalHTMLCanvasElement.prototype as any).toBuffer = function (
    this: HTMLCanvasElement,
    mimeType?: string,
    config?: any
  ): Buffer {
    const nodeCanvas = canvasMap.get(this);
    if (!nodeCanvas) {
      throw new Error('Node canvas not initialized');
    }
    // Type assertion needed because toBuffer has multiple overloads
    return nodeCanvas.toBuffer(mimeType as any, config) as unknown as Buffer;
  };

  // Store reference to node-canvas on the element
  Object.defineProperty(OriginalHTMLCanvasElement.prototype, '_nodeCanvas', {
    get: function (this: HTMLCanvasElement) {
      return canvasMap.get(this);
    },
    configurable: true,
  });
}

/**
 * Set up requestAnimationFrame mock for chart rendering
 */
function setupAnimationFrame() {
  let frameId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();

  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = ++frameId;
    callbacks.set(id, callback);
    // Execute immediately for tests
    setTimeout(() => {
      const cb = callbacks.get(id);
      if (cb) {
        cb(performance.now());
        callbacks.delete(id);
      }
    }, 0);
    return id;
  };

  globalThis.cancelAnimationFrame = (id: number): void => {
    callbacks.delete(id);
  };
}

/**
 * Set up device pixel ratio for consistent rendering
 */
function setupDevicePixelRatio() {
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: 1,
  });
}

/**
 * Set up matchMedia mock
 */
function setupMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}

/**
 * Set up ResizeObserver mock
 */
function setupResizeObserver() {
  (globalThis as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * Set up additional browser APIs needed by lightweight-charts
 */
function setupAdditionalAPIs() {
  // Mock performance.now if needed
  if (!performance.now) {
    const startTime = Date.now();
    performance.now = () => Date.now() - startTime;
  }

  // Ensure window.innerWidth and innerHeight are set
  if (!window.innerWidth) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  }

  if (!window.innerHeight) {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  }
}

/**
 * Initialize visual test environment
 */
setupCanvasEnvironment();
setupAnimationFrame();
setupDevicePixelRatio();
setupMatchMedia();
setupResizeObserver();
setupAdditionalAPIs();

console.log('✓ Visual test environment initialized with node-canvas');
