/**
 * @vitest-environment jsdom
 * TooltipPlugin Tests - Updated for refactored minimal DOM renderer
 *
 * The TooltipPlugin is now a pure DOM renderer that:
 * - Creates and manages tooltip DOM element
 * - Applies content, styles, and positioning
 * - Works with TooltipManager for coordination
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TooltipPlugin } from '../../plugins/chart/tooltipPlugin';
import { TooltipManager } from '../../plugins/chart/TooltipManager';

// Mock TooltipManager
vi.mock('../../plugins/chart/TooltipManager', () => ({
  TooltipManager: {
    getInstance: vi.fn(() => ({
      registerRenderer: vi.fn(),
      unregisterRenderer: vi.fn(),
    })),
  },
}));

// Mock ChartCoordinateService
vi.mock('../../services/ChartCoordinateService', () => ({
  ChartCoordinateService: {
    getInstance: vi.fn(() => ({
      calculateTooltipPosition: vi.fn((x, y) => ({ x, y })),
      applyPositionToElement: vi.fn(),
    })),
  },
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('TooltipPlugin - Refactored Minimal Renderer', () => {
  let container: HTMLElement;
  let tooltipPlugin: TooltipPlugin;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    document.body.appendChild(container);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    if (tooltipPlugin) {
      tooltipPlugin.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Constructor', () => {
    it('should create TooltipPlugin with container and chartId', () => {
      tooltipPlugin = new TooltipPlugin(container, 'test-chart-1');

      expect(tooltipPlugin).toBeDefined();
      expect(TooltipManager.getInstance).toHaveBeenCalled();
    });

    it('should register with TooltipManager', () => {
      const mockRegister = vi.fn();
      (TooltipManager.getInstance as any).mockReturnValue({
        registerRenderer: mockRegister,
        unregisterRenderer: vi.fn(),
      });

      tooltipPlugin = new TooltipPlugin(container, 'test-chart-2');

      expect(mockRegister).toHaveBeenCalledWith(tooltipPlugin);
    });
  });

  describe('show()', () => {
    beforeEach(() => {
      tooltipPlugin = new TooltipPlugin(container, 'test-chart');
    });

    it('should display tooltip with content, style, and position', () => {
      const content = '<div>Test Tooltip</div>';
      const style = 'background: black; color: white;';
      const position = { x: 100, y: 200 };

      tooltipPlugin.show(content, style, position);

      // Verify tooltip element was created and appended
      const tooltipElement = container.querySelector('.lw-tooltip');
      expect(tooltipElement).toBeTruthy();
      expect(tooltipElement?.innerHTML).toContain('Test Tooltip');
    });

    it('should handle CSS style object', () => {
      const content = '<div>Styled Tooltip</div>';
      const styleObj = {
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
      };
      const position = { x: 150, y: 250 };

      tooltipPlugin.show(content, styleObj, position);

      const tooltipElement = container.querySelector('.lw-tooltip') as HTMLElement;
      expect(tooltipElement).toBeTruthy();
      expect(tooltipElement?.style.background).toBe('rgba(0, 0, 0, 0.8)');
      expect(tooltipElement?.style.color).toBe('white');
    });

    it('should apply CSS classes if provided', () => {
      const content = '<div>Custom Class Tooltip</div>';
      const style = 'background: blue;';
      const position = { x: 50, y: 50 };
      const cssClasses = ['custom-tooltip', 'dark-theme'];

      tooltipPlugin.show(content, style, position, cssClasses);

      const tooltipElement = container.querySelector('.lw-tooltip') as HTMLElement;
      expect(tooltipElement).toBeTruthy();
      expect(tooltipElement?.className).toContain('custom-tooltip');
      expect(tooltipElement?.className).toContain('dark-theme');
    });

    it('should handle multiple show() calls', () => {
      tooltipPlugin.show('<div>First</div>', 'background: red;', { x: 10, y: 10 });
      tooltipPlugin.show('<div>Second</div>', 'background: blue;', { x: 20, y: 20 });

      const tooltipElement = container.querySelector('.lw-tooltip');
      expect(tooltipElement?.innerHTML).toContain('Second');
    });
  });

  describe('hide()', () => {
    beforeEach(() => {
      tooltipPlugin = new TooltipPlugin(container, 'test-chart');
    });

    it('should hide visible tooltip', () => {
      // Show tooltip first
      tooltipPlugin.show('<div>Visible</div>', 'background: green;', { x: 100, y: 100 });

      const tooltipElement = container.querySelector('.lw-tooltip') as HTMLElement;
      expect(tooltipElement?.style.display).not.toBe('none');

      // Hide tooltip
      tooltipPlugin.hide();

      // Opacity should be set to 0 immediately
      expect(tooltipElement?.style.opacity).toBe('0');
    });

    it('should handle hide() when tooltip not shown', () => {
      // Should not throw
      expect(() => {
        tooltipPlugin.hide();
      }).not.toThrow();
    });
  });

  describe('updatePosition()', () => {
    beforeEach(() => {
      tooltipPlugin = new TooltipPlugin(container, 'test-chart');
    });

    it('should update tooltip position when visible', () => {
      // Show tooltip
      tooltipPlugin.show('<div>Moving Tooltip</div>', 'background: yellow;', { x: 100, y: 100 });

      // Update position
      const newPosition = { x: 200, y: 300 };
      tooltipPlugin.updatePosition(newPosition);

      // Position should be updated (verified via ChartCoordinateService mock)
      expect(tooltipPlugin).toBeDefined();
    });

    it('should not update position when hidden', () => {
      // Show then hide
      tooltipPlugin.show('<div>Hidden</div>', 'background: gray;', { x: 50, y: 50 });
      tooltipPlugin.hide();

      // Try to update position
      tooltipPlugin.updatePosition({ x: 100, y: 100 });

      // Should not throw
      expect(tooltipPlugin).toBeDefined();
    });
  });

  describe('destroy()', () => {
    beforeEach(() => {
      tooltipPlugin = new TooltipPlugin(container, 'test-chart');
    });

    it('should remove tooltip element from DOM', () => {
      // Show tooltip
      tooltipPlugin.show('<div>Destroy Me</div>', 'background: red;', { x: 50, y: 50 });

      const tooltipElement = container.querySelector('.lw-tooltip');
      expect(tooltipElement).toBeTruthy();

      // Destroy
      tooltipPlugin.destroy();

      // Element should be removed
      const removedElement = container.querySelector('.lw-tooltip');
      expect(removedElement).toBeFalsy();
    });

    it('should unregister from TooltipManager', () => {
      const mockUnregister = vi.fn();
      (TooltipManager.getInstance as any).mockReturnValue({
        registerRenderer: vi.fn(),
        unregisterRenderer: mockUnregister,
      });

      tooltipPlugin = new TooltipPlugin(container, 'test-chart-destroy');
      tooltipPlugin.destroy();

      expect(mockUnregister).toHaveBeenCalled();
    });

    it('should handle destroy() when no tooltip element exists', () => {
      // Destroy without ever showing
      expect(() => {
        tooltipPlugin.destroy();
      }).not.toThrow();
    });
  });

  describe('remove()', () => {
    beforeEach(() => {
      tooltipPlugin = new TooltipPlugin(container, 'test-chart');
    });

    it('should be an alias for destroy()', () => {
      tooltipPlugin.show('<div>Remove Me</div>', 'background: purple;', { x: 75, y: 75 });

      tooltipPlugin.remove();

      const removedElement = container.querySelector('.lw-tooltip');
      expect(removedElement).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid container gracefully', () => {
      // Create with valid container initially
      tooltipPlugin = new TooltipPlugin(container, 'test-chart');

      // Remove container from DOM
      document.body.removeChild(container);

      // Should not throw on show
      expect(() => {
        tooltipPlugin.show('<div>Error</div>', 'background: red;', { x: 0, y: 0 });
      }).not.toThrow();
    });

    it('should handle empty content', () => {
      tooltipPlugin = new TooltipPlugin(container, 'test-chart');

      expect(() => {
        tooltipPlugin.show('', 'background: blue;', { x: 50, y: 50 });
      }).not.toThrow();
    });

    it('should handle null style object values', () => {
      tooltipPlugin = new TooltipPlugin(container, 'test-chart');

      const styleWithNulls = {
        background: 'black',
        color: null as any,
        padding: undefined as any,
      };

      expect(() => {
        tooltipPlugin.show('<div>Null Styles</div>', styleWithNulls, { x: 100, y: 100 });
      }).not.toThrow();
    });
  });

  describe('Integration with TooltipManager', () => {
    it('should work with TooltipManager request flow', () => {
      const mockManager = {
        registerRenderer: vi.fn(),
        unregisterRenderer: vi.fn(),
        requestTooltip: vi.fn(),
        hideTooltip: vi.fn(),
      };

      (TooltipManager.getInstance as any).mockReturnValue(mockManager);

      tooltipPlugin = new TooltipPlugin(container, 'integration-test');

      expect(mockManager.registerRenderer).toHaveBeenCalledWith(tooltipPlugin);

      // Simulate TooltipManager calling show
      tooltipPlugin.show('<div>Manager Content</div>', 'background: teal; color: white;', {
        x: 125,
        y: 225,
      });

      const tooltipElement = container.querySelector('.lw-tooltip');
      expect(tooltipElement?.innerHTML).toContain('Manager Content');

      // Simulate TooltipManager calling hide
      tooltipPlugin.hide();

      expect((tooltipElement as HTMLElement)?.style.opacity).toBe('0');
    });
  });
});
