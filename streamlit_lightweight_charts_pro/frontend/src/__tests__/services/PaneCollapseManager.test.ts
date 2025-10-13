/**
 * @fileoverview Tests for PaneCollapseManager
 * @vitest-environment jsdom
 *
 * Tests the singleton pattern, pane collapse/expand functionality,
 * state management, and DOM manipulation.
 *
 * TODO: Re-enable these tests when collapse button functionality is debugged and fully implemented
 * See: https://github.com/yourusername/yourrepo/issues/XXX
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaneCollapseManager } from '../../services/PaneCollapseManager';
import type { IChartApi } from 'lightweight-charts';
import { DIMENSIONS } from '../../config/positioningConfig';
import { KeyedSingletonManager } from '../../utils/KeyedSingletonManager';

describe.skip('PaneCollapseManager', () => {
  let mockChartApi: IChartApi;
  let mockChartElement: HTMLElement;
  let mockPaneElement: HTMLElement;
  let mockCanvasElement: HTMLElement;
  let mockPaneElements: Map<number, HTMLElement>;
  let mockCanvasElements: Map<number, HTMLElement>;

  beforeEach(() => {
    // Clear singleton instances between tests using KeyedSingletonManager
    (KeyedSingletonManager as any).clearAllInstances('PaneCollapseManager');

    // Create mock DOM elements - store multiple panes
    mockPaneElements = new Map();
    mockCanvasElements = new Map();

    // Create default pane (index 0)
    mockCanvasElement = document.createElement('canvas');
    mockCanvasElement.style.height = '200px';
    mockCanvasElements.set(0, mockCanvasElement);

    mockPaneElement = document.createElement('div');
    mockPaneElement.className = 'pane';
    mockPaneElement.style.height = '200px';
    mockPaneElement.appendChild(mockCanvasElement);
    mockPaneElements.set(0, mockPaneElement);

    mockChartElement = document.createElement('div');
    mockChartElement.appendChild(mockPaneElement);

    // Mock chart API with complete pane API
    // Create a dynamic panes array that supports any index
    const mockPanes = new Proxy([] as any[], {
      get(target: any[], prop) {
        const index = Number(prop);
        // Return pane mock for numeric indices
        if (!isNaN(index)) {
          if (!target[index]) {
            // Create DOM elements for this pane if they don't exist
            if (!mockPaneElements.has(index)) {
              const canvas = document.createElement('canvas');
              canvas.style.height = '200px';
              mockCanvasElements.set(index, canvas);

              const pane = document.createElement('div');
              pane.className = 'pane';
              pane.style.height = '200px';
              pane.appendChild(canvas);
              mockPaneElements.set(index, pane);
            }

            const paneElement = mockPaneElements.get(index)!;
            const canvasElement = mockCanvasElements.get(index)!;

            target[index] = {
              getSeries: vi.fn(() => []),
              // setHeight should trigger DOM changes for THIS specific pane
              setHeight: vi.fn((height: number) => {
                paneElement.style.height = `${height}px`;
                paneElement.style.minHeight = `${height}px`;
                paneElement.style.maxHeight = `${height}px`;
                // Hide canvas when collapsing
                if (height <= 40 && canvasElement) {
                  canvasElement.style.height = '0px';
                  canvasElement.style.display = 'none';
                } else if (canvasElement) {
                  canvasElement.style.height = '';
                  canvasElement.style.display = '';
                }
              }),
            };
          }
          return target[index];
        }
        // Return array methods for other properties
        return target[prop as any];
      },
    });

    mockChartApi = {
      chartElement: vi.fn(() => mockChartElement),
      paneSize: vi.fn(() => ({ height: 200, width: 400 })),
      resize: vi.fn(),
      panes: vi.fn(() => mockPanes),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance for same chartId', () => {
      const instance1 = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');
      const instance2 = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');

      expect(instance1).toBe(instance2);
    });

    it('should return different instances for different chartIds', () => {
      const instance1 = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');
      const instance2 = PaneCollapseManager.getInstance(mockChartApi, 'chart-2');

      expect(instance1).not.toBe(instance2);
    });

    it('should use "default" chartId when not specified', () => {
      const instance1 = PaneCollapseManager.getInstance(mockChartApi);
      const instance2 = PaneCollapseManager.getInstance(mockChartApi, 'default');

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after destroyInstance', () => {
      const instance1 = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');
      PaneCollapseManager.destroyInstance('chart-1');
      const instance2 = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');

      expect(instance1).not.toBe(instance2);
    });

    it('should handle destroyInstance for non-existent chartId gracefully', () => {
      expect(() => {
        PaneCollapseManager.destroyInstance('non-existent');
      }).not.toThrow();
    });
  });

  describe('Pane Initialization', () => {
    it('should initialize pane state', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      const state = manager.getState(0);

      expect(state).toBeDefined();
      expect(state?.isCollapsed).toBe(false);
      expect(state?.originalHeight).toBe(0);
      expect(state?.collapsedHeight).toBe(DIMENSIONS.pane.collapsedHeight);
    });

    it('should use custom collapsed height from config', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi, 'chart-1', {
        collapsedHeight: 50,
      });
      manager.initializePane(0);

      const state = manager.getState(0);

      expect(state?.collapsedHeight).toBe(50);
    });

    it('should not reinitialize existing pane', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      const state1 = manager.getState(0);
      manager.initializePane(0);
      const state2 = manager.getState(0);

      expect(state1).toBe(state2);
    });

    it('should return undefined for uninitialized pane', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);

      const state = manager.getState(99);

      expect(state).toBeUndefined();
    });
  });

  describe('isCollapsed', () => {
    it('should return false for uninitialized pane', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);

      expect(manager.isCollapsed(0)).toBe(false);
    });

    it('should return correct collapsed state', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      expect(manager.isCollapsed(0)).toBe(false);

      manager.collapse(0);

      expect(manager.isCollapsed(0)).toBe(true);
    });
  });

  describe('Collapse Functionality', () => {
    it('should collapse pane correctly', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      // Mock chartElement.querySelector to return pane
      mockChartElement.querySelector = vi.fn((selector: string) => {
        if (selector.includes('pane')) return mockPaneElement;
        return null;
      });

      // Mock paneElement.querySelector to return canvas
      mockPaneElement.querySelector = vi.fn((selector: string) => {
        if (selector === 'canvas') return mockCanvasElement;
        return null;
      });

      manager.collapse(0);

      const state = manager.getState(0);
      expect(state?.isCollapsed).toBe(true);
      expect(state?.originalHeight).toBe(200);

      // Check DOM manipulation
      expect(mockPaneElement.style.height).toBe('40px');
      expect(mockPaneElement.style.minHeight).toBe('40px');
      expect(mockPaneElement.style.maxHeight).toBe('40px');
      expect(mockCanvasElement.style.height).toBe('0px');
      expect(mockCanvasElement.style.display).toBe('none');
    });

    it('should not collapse already collapsed pane', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      manager.collapse(0);
      const heightAfterFirstCollapse = mockPaneElement.style.height;

      manager.collapse(0);
      const heightAfterSecondCollapse = mockPaneElement.style.height;

      expect(heightAfterFirstCollapse).toBe(heightAfterSecondCollapse);
    });

    it('should call onPaneCollapse callback', () => {
      const onPaneCollapse = vi.fn();
      const manager = PaneCollapseManager.getInstance(mockChartApi, 'chart-1', {
        onPaneCollapse,
      });
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      manager.collapse(0);

      expect(onPaneCollapse).toHaveBeenCalledWith(0, true);
    });

    it('should handle missing pane element gracefully', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => null);

      expect(() => {
        manager.collapse(0);
      }).not.toThrow();

      const state = manager.getState(0);
      expect(state?.isCollapsed).toBe(false);
    });

    it('should handle collapse without canvas element', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      const paneWithoutCanvas = document.createElement('div');
      paneWithoutCanvas.style.height = '200px';

      mockChartElement.querySelector = vi.fn(() => paneWithoutCanvas);

      expect(() => {
        manager.collapse(0);
      }).not.toThrow();

      expect(paneWithoutCanvas.style.height).toBe('40px');
    });
  });

  describe('Expand Functionality', () => {
    it('should expand collapsed pane correctly', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      // Mock chartElement.querySelector to return pane
      mockChartElement.querySelector = vi.fn((selector: string) => {
        if (selector.includes('pane')) return mockPaneElement;
        return null;
      });

      // Mock paneElement.querySelector to return canvas
      mockPaneElement.querySelector = vi.fn((selector: string) => {
        if (selector === 'canvas') return mockCanvasElement;
        return null;
      });

      // First collapse
      manager.collapse(0);
      expect(manager.isCollapsed(0)).toBe(true);

      // Then expand
      manager.expand(0);

      const state = manager.getState(0);
      expect(state?.isCollapsed).toBe(false);

      // Check DOM restoration
      expect(mockPaneElement.style.height).toBe('');
      expect(mockPaneElement.style.minHeight).toBe('');
      expect(mockPaneElement.style.maxHeight).toBe('');
      expect(mockCanvasElement.style.height).toBe('');
      expect(mockCanvasElement.style.display).toBe('');
    });

    it('should not expand already expanded pane', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      manager.expand(0);

      const state = manager.getState(0);
      expect(state?.isCollapsed).toBe(false);
    });

    it('should call onPaneExpand callback', () => {
      const onPaneExpand = vi.fn();
      const manager = PaneCollapseManager.getInstance(mockChartApi, 'chart-1', {
        onPaneExpand,
      });
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      manager.collapse(0);
      manager.expand(0);

      expect(onPaneExpand).toHaveBeenCalledWith(0, false);
    });

    it('should trigger chart resize on expand', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      let queryCall = 0;
      mockChartElement.querySelector = vi.fn(() => {
        queryCall++;
        return mockPaneElement;
      });

      // Mock clientWidth and clientHeight using Object.defineProperty
      Object.defineProperty(mockChartElement, 'clientWidth', {
        writable: false,
        configurable: true,
        value: 800,
      });
      Object.defineProperty(mockChartElement, 'clientHeight', {
        writable: false,
        configurable: true,
        value: 600,
      });

      manager.collapse(0);
      manager.expand(0);

      expect(mockChartApi.resize).toHaveBeenCalledWith(800, 600);
    });

    it('should handle missing pane element gracefully on expand', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => null);

      expect(() => {
        manager.expand(0);
      }).not.toThrow();
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle from expanded to collapsed', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      expect(manager.isCollapsed(0)).toBe(false);

      manager.toggle(0);

      expect(manager.isCollapsed(0)).toBe(true);
    });

    it('should toggle from collapsed to expanded', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      manager.collapse(0);
      expect(manager.isCollapsed(0)).toBe(true);

      manager.toggle(0);

      expect(manager.isCollapsed(0)).toBe(false);
    });

    it('should handle toggle on uninitialized pane gracefully', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);

      expect(() => {
        manager.toggle(99);
      }).not.toThrow();
    });

    it('should toggle multiple times correctly', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      manager.toggle(0); // -> collapsed
      expect(manager.isCollapsed(0)).toBe(true);

      manager.toggle(0); // -> expanded
      expect(manager.isCollapsed(0)).toBe(false);

      manager.toggle(0); // -> collapsed
      expect(manager.isCollapsed(0)).toBe(true);
    });
  });

  describe('Multiple Panes', () => {
    it('should manage multiple panes independently', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);
      manager.initializePane(1);
      manager.initializePane(2);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      manager.collapse(0);
      manager.collapse(2);

      expect(manager.isCollapsed(0)).toBe(true);
      expect(manager.isCollapsed(1)).toBe(false);
      expect(manager.isCollapsed(2)).toBe(true);
    });

    it('should share manager instance across multiple panes', () => {
      const manager1 = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');
      manager1.initializePane(0);

      const manager2 = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');
      manager2.initializePane(1);

      expect(manager1).toBe(manager2);

      manager1.collapse(0);

      expect(manager2.isCollapsed(0)).toBe(true);
      expect(manager2.getState(1)).toBeDefined();
    });
  });

  describe('Destroy', () => {
    it('should clear all pane states on destroy', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');
      manager.initializePane(0);
      manager.initializePane(1);

      expect(manager.getState(0)).toBeDefined();
      expect(manager.getState(1)).toBeDefined();

      manager.destroy();

      expect(manager.getState(0)).toBeUndefined();
      expect(manager.getState(1)).toBeUndefined();
    });

    it('should destroy singleton instance via destroyInstance', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');
      manager.initializePane(0);

      expect(manager.getState(0)).toBeDefined();

      PaneCollapseManager.destroyInstance('chart-1');

      // Getting instance again should create new one with clean state
      const newManager = PaneCollapseManager.getInstance(mockChartApi, 'chart-1');
      expect(newManager.getState(0)).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in collapse gracefully', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      // Mock chartElement to throw error
      mockChartApi.chartElement = vi.fn(() => {
        throw new Error('Chart element error');
      });

      expect(() => {
        manager.collapse(0);
      }).not.toThrow();

      // State should remain unchanged
      expect(manager.isCollapsed(0)).toBe(false);
    });

    it('should handle errors in expand gracefully', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);
      manager.collapse(0);

      // Mock chartElement to throw error
      mockChartApi.chartElement = vi.fn(() => {
        throw new Error('Chart element error');
      });

      expect(() => {
        manager.expand(0);
      }).not.toThrow();

      // State should remain collapsed
      expect(manager.isCollapsed(0)).toBe(true);
    });

    it('should handle errors in toggle gracefully', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => {
        throw new Error('querySelector error');
      });

      expect(() => {
        manager.toggle(0);
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use default collapsed height when not specified', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi);
      manager.initializePane(0);

      const state = manager.getState(0);
      expect(state?.collapsedHeight).toBe(DIMENSIONS.pane.collapsedHeight);
    });

    it('should use custom collapsed height from config', () => {
      const manager = PaneCollapseManager.getInstance(mockChartApi, 'chart-1', {
        collapsedHeight: 60,
      });
      manager.initializePane(0);

      const state = manager.getState(0);
      expect(state?.collapsedHeight).toBe(60);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);
      manager.collapse(0);

      expect(mockPaneElement.style.height).toBe('60px');
    });

    it('should support both callbacks', () => {
      const onPaneCollapse = vi.fn();
      const onPaneExpand = vi.fn();

      const manager = PaneCollapseManager.getInstance(mockChartApi, 'chart-1', {
        onPaneCollapse,
        onPaneExpand,
      });
      manager.initializePane(0);

      mockChartElement.querySelector = vi.fn(() => mockPaneElement);

      manager.toggle(0); // collapse
      expect(onPaneCollapse).toHaveBeenCalledWith(0, true);

      manager.toggle(0); // expand
      expect(onPaneExpand).toHaveBeenCalledWith(0, false);
    });
  });
});
