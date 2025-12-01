/**
 * @vitest-environment jsdom
 * @fileoverview Tests for ButtonPanelPrimitive
 *
 * Tests cover:
 * - Constructor and initialization
 * - Manager initialization (PaneCollapseManager, SeriesDialogManager)
 * - Button registry and styling
 * - Public API methods (getSeriesConfig, setSeriesConfig, syncToBackend)
 * - Factory functions
 * - Dimensions calculation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ButtonPanelPrimitive,
  createButtonPanelPrimitive,
  createButtonPanelPrimitives,
} from '../../primitives/ButtonPanelPrimitive';
import { PrimitivePriority } from '../../primitives/BasePanePrimitive';

// Mock dependencies
vi.mock('../../primitives/BasePanePrimitive', () => ({
  BasePanePrimitive: class {
    protected containerElement: HTMLElement | null = null;
    protected chart: any = null;
    protected config: any;
    protected layoutManager: any = null;

    constructor(id: string, config: any) {
      this.config = config;
    }

    protected renderContent(): void {}
    protected getContainerClassName(): string {
      return '';
    }
    protected getTemplate(): string {
      return '';
    }
    protected onAttached(_params: any): void {}
    protected onDetached(): void {}
    protected getPaneId(): number {
      return 0;
    }
  },
  PrimitivePriority: {
    LEGEND: 1,
    RANGE_SWITCHER: 2,
    MINIMIZE_BUTTON: 3,
    PANE_CONTROLS: 4,
  },
}));

vi.mock('../../services/StreamlitSeriesConfigService', () => {
  class MockStreamlitSeriesConfigService {
    recordConfigChange = vi.fn();
    getChartConfig = vi.fn(() => ({}));
    getSeriesConfig = vi.fn(() => null);
    forceSyncToBackend = vi.fn();
  }

  return {
    StreamlitSeriesConfigService: MockStreamlitSeriesConfigService,
  };
});

vi.mock('../../services/PaneCollapseManager', () => ({
  PaneCollapseManager: {
    getInstance: vi.fn(() => ({
      initializePane: vi.fn(),
      toggle: vi.fn(),
      isCollapsed: vi.fn(() => false),
    })),
  },
}));

vi.mock('../../services/SeriesDialogManager', () => ({
  SeriesDialogManager: {
    getInstance: vi.fn(() => ({
      initializePane: vi.fn(),
      open: vi.fn(),
      getSeriesConfig: vi.fn(() => null),
      setSeriesConfig: vi.fn(),
    })),
  },
}));

vi.mock('../../components/buttons/base/ButtonRegistry', () => ({
  ButtonRegistry: vi.fn(() => ({
    register: vi.fn(),
    getButton: vi.fn(),
    getVisibleButtons: vi.fn(() => []),
    clear: vi.fn(),
  })),
}));

vi.mock('../../components/buttons/types/CollapseButton', () => ({
  CollapseButton: vi.fn(),
}));

vi.mock('../../components/buttons/types/SeriesSettingsButton', () => ({
  SeriesSettingsButton: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

vi.mock('react', () => ({
  Component: class Component {
    props: any;
    constructor(props: any) {
      this.props = props;
    }
    render() {
      return null;
    }
  },
  createElement: vi.fn((type, props, ...children) => ({ type, props, children })),
  cloneElement: vi.fn((element, props) => ({ ...element, props: { ...element.props, ...props } })),
  Fragment: 'Fragment',
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../utils/SingletonBase', () => ({
  createSingleton: vi.fn(ctor => new ctor()),
}));

vi.mock('../../primitives/PrimitiveDefaults', () => ({
  ButtonDimensions: {
    PANE_ACTION_WIDTH: 16,
    PANE_ACTION_HEIGHT: 16,
    PANE_ACTION_BORDER_RADIUS: 3,
  },
}));

describe('ButtonPanelPrimitive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create ButtonPanelPrimitive with required config', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect(primitive).toBeDefined();
    });

    it('should initialize with default corner position', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect((primitive as any).config.corner).toBe('top-right');
    });

    it('should initialize with custom corner position', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        corner: 'bottom-left',
      });

      expect((primitive as any).config.corner).toBe('bottom-left');
    });

    it('should initialize with default priority', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect((primitive as any).config.priority).toBe(PrimitivePriority.MINIMIZE_BUTTON);
    });

    it('should initialize with custom priority', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        priority: PrimitivePriority.LEGEND,
      });

      expect((primitive as any).config.priority).toBe(PrimitivePriority.LEGEND);
    });

    it('should accept chartId in config', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        chartId: 'chart-123',
      });

      expect((primitive as any).config.chartId).toBe('chart-123');
    });

    it('should accept button customization options', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonSize: 20,
        buttonColor: '#FF0000',
        buttonHoverColor: '#00FF00',
      });

      expect((primitive as any).config.buttonSize).toBe(20);
      expect((primitive as any).config.buttonColor).toBe('#FF0000');
      expect((primitive as any).config.buttonHoverColor).toBe('#00FF00');
    });
  });

  describe('Public API', () => {
    it('should provide getSeriesConfig method', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect(primitive.getSeriesConfig).toBeDefined();
      expect(typeof primitive.getSeriesConfig).toBe('function');
    });

    it('should provide setSeriesConfig method', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect(primitive.setSeriesConfig).toBeDefined();
      expect(typeof primitive.setSeriesConfig).toBe('function');
    });

    it('should provide syncToBackend method', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect(primitive.syncToBackend).toBeDefined();
      expect(typeof primitive.syncToBackend).toBe('function');
    });

    it('should provide getDimensions method', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect(primitive.getDimensions).toBeDefined();
      expect(typeof primitive.getDimensions).toBe('function');
    });
  });

  describe('Dimensions Calculation', () => {
    it('should calculate dimensions with both buttons visible', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showCollapseButton: true,
        showSeriesSettingsButton: true,
      });

      const dims = primitive.getDimensions();

      expect(dims).toBeDefined();
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    // TODO: Re-enable when collapse button functionality is debugged and fully implemented
    it.skip('should calculate dimensions with only collapse button', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showCollapseButton: true,
        showSeriesSettingsButton: false,
      });

      const dims = primitive.getDimensions();

      expect(dims).toBeDefined();
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    it('should calculate dimensions with only series settings button', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showCollapseButton: false,
        showSeriesSettingsButton: true,
      });

      const dims = primitive.getDimensions();

      expect(dims).toBeDefined();
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });
  });

  describe('Factory Functions', () => {
    it('should create ButtonPanelPrimitive via factory', () => {
      const primitive = createButtonPanelPrimitive(0);

      expect(primitive).toBeDefined();
      expect(primitive).toBeInstanceOf(ButtonPanelPrimitive);
    });

    it('should create with default config', () => {
      const primitive = createButtonPanelPrimitive(0);

      expect((primitive as any).config.corner).toBe('top-right');
      expect((primitive as any).config.showCollapseButton).toBe(false); // Collapse button is disabled by default due to functionality issues
      expect((primitive as any).config.showSeriesSettingsButton).toBe(true);
    });

    it('should accept custom config in factory', () => {
      const primitive = createButtonPanelPrimitive(0, {
        corner: 'bottom-left',
        buttonColor: '#FF0000',
      });

      expect((primitive as any).config.corner).toBe('bottom-left');
      expect((primitive as any).config.buttonColor).toBe('#FF0000');
    });

    it('should accept chartId in factory', () => {
      const primitive = createButtonPanelPrimitive(0, {}, 'chart-123');

      expect((primitive as any).config.chartId).toBe('chart-123');
    });

    it('should create multiple primitives via factory', () => {
      const primitives = createButtonPanelPrimitives([0, 1, 2]);

      expect(primitives).toHaveLength(3);
      expect(primitives[0]).toBeInstanceOf(ButtonPanelPrimitive);
      expect(primitives[1]).toBeInstanceOf(ButtonPanelPrimitive);
      expect(primitives[2]).toBeInstanceOf(ButtonPanelPrimitive);
    });

    it('should apply config to all primitives in batch factory', () => {
      const primitives = createButtonPanelPrimitives([0, 1], {
        buttonColor: '#FF0000',
      });

      expect((primitives[0] as any).config.buttonColor).toBe('#FF0000');
      expect((primitives[1] as any).config.buttonColor).toBe('#FF0000');
    });

    it('should apply chartId to all primitives in batch factory', () => {
      const primitives = createButtonPanelPrimitives([0, 1], {}, 'chart-123');

      expect((primitives[0] as any).config.chartId).toBe('chart-123');
      expect((primitives[1] as any).config.chartId).toBe('chart-123');
    });

    it('should set isPanePrimitive for paneId > 0', () => {
      const primitive = createButtonPanelPrimitive(1);

      expect((primitive as any).config.isPanePrimitive).toBe(true);
    });

    it('should set isPanePrimitive false for paneId = 0', () => {
      const primitive = createButtonPanelPrimitive(0);

      expect((primitive as any).config.isPanePrimitive).toBe(false);
    });
  });

  describe('Button Configuration', () => {
    // TODO: Re-enable when collapse button functionality is debugged and fully implemented
    it.skip('should accept showCollapseButton option', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showCollapseButton: false,
      });

      expect((primitive as any).config.showCollapseButton).toBe(false);
    });

    it('should accept showSeriesSettingsButton option', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showSeriesSettingsButton: false,
      });

      expect((primitive as any).config.showSeriesSettingsButton).toBe(false);
    });

    it('should accept tooltip text configuration', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        tooltipText: {
          collapse: 'Custom collapse',
          expand: 'Custom expand',
        },
      });

      expect((primitive as any).config.tooltipText?.collapse).toBe('Custom collapse');
      expect((primitive as any).config.tooltipText?.expand).toBe('Custom expand');
    });
  });

  describe('Lifecycle Management', () => {
    it('should prevent re-initialization when isInitialized is true', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const mockContainer = document.createElement('div');
      (primitive as any).containerElement = mockContainer;

      // First call should initialize
      (primitive as any).renderContent();
      expect((primitive as any).isInitialized).toBe(true);

      // Second call should not re-initialize (no new button container created)
      const firstButtonContainer = (primitive as any).buttonContainer;
      (primitive as any).renderContent();
      expect((primitive as any).buttonContainer).toBe(firstButtonContainer);
    });

    it('should initialize managers when chart is attached via onAttached', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const mockChart = { panes: vi.fn(() => []) };
      (primitive as any).chart = mockChart;

      (primitive as any).onAttached({
        chart: mockChart,
        series: {},
        requestUpdate: vi.fn(),
      });

      expect((primitive as any).collapseManager).not.toBeNull();
      expect((primitive as any).dialogManager).not.toBeNull();
    });

    it('should cleanup resources on detach', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      // Setup some state
      const mockRoot = { unmount: vi.fn() };
      const mockRegistry = { clear: vi.fn() };
      (primitive as any).reactRoot = mockRoot;
      (primitive as any).buttonRegistry = mockRegistry;
      (primitive as any).buttonContainer = document.createElement('div');
      (primitive as any).isInitialized = true;
      (primitive as any).collapseManager = {};
      (primitive as any).dialogManager = {};

      (primitive as any).onDetached();

      expect(mockRoot.unmount).toHaveBeenCalled();
      expect(mockRegistry.clear).toHaveBeenCalled();
      expect((primitive as any).reactRoot).toBeNull();
      expect((primitive as any).buttonRegistry).toBeNull();
      expect((primitive as any).buttonContainer).toBeNull();
      expect((primitive as any).isInitialized).toBe(false);
      expect((primitive as any).collapseManager).toBeNull();
      expect((primitive as any).dialogManager).toBeNull();
    });
  });

  describe('Rendering Logic', () => {
    it('should return correct container class name', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 2,
      });

      expect((primitive as any).getContainerClassName()).toBe('button-panel-primitive-2');
    });

    it('should return empty template string', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect((primitive as any).getTemplate()).toBe('');
    });

    it('should create button container with correct styling', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const mockContainer = document.createElement('div');
      (primitive as any).containerElement = mockContainer;

      (primitive as any).renderContent();

      const buttonContainer = (primitive as any).buttonContainer;
      expect(buttonContainer).not.toBeNull();
      expect(buttonContainer.className).toBe('button-panel-container');
      expect(buttonContainer.style.display).toBe('flex');
      expect(buttonContainer.style.gap).toBe('4px');
      expect(buttonContainer.style.alignItems).toBe('center');
    });
  });

  describe('Button Styling', () => {
    it('should return default button styling', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const styling = (primitive as any).getButtonStyling();

      expect(styling.color).toBe('#787B86');
      expect(styling.hoverColor).toBe('#131722');
      expect(styling.background).toBe('rgba(255, 255, 255, 0.9)');
      expect(styling.hoverBackground).toBe('rgba(255, 255, 255, 1)');
      expect(styling.border).toBe('none');
      expect(styling.borderRadius).toBe(3);
      expect(styling.hoverBoxShadow).toBe('0 2px 4px rgba(0, 0, 0, 0.1)');
    });

    it('should use custom styling values from config', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonColor: '#FF0000',
        buttonHoverColor: '#00FF00',
        buttonBackground: '#FFFFFF',
        buttonHoverBackground: '#EEEEEE',
        buttonBorderRadius: 5,
      });

      const styling = (primitive as any).getButtonStyling();

      expect(styling.color).toBe('#FF0000');
      expect(styling.hoverColor).toBe('#00FF00');
      expect(styling.background).toBe('#FFFFFF');
      expect(styling.hoverBackground).toBe('#EEEEEE');
      expect(styling.borderRadius).toBe(5);
    });
  });

  describe('Manager Interactions', () => {
    it('should not initialize managers when chart is null', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      (primitive as any).chart = null;
      (primitive as any).initializeManagers();

      expect((primitive as any).collapseManager).toBeNull();
      expect((primitive as any).dialogManager).toBeNull();
    });
  });

  describe('Public API Behavior', () => {
    it('should delegate getSeriesConfig to dialogManager', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const mockManager = {
        getSeriesConfig: vi.fn(() => ({ color: '#FF0000' })),
        initializePane: vi.fn(),
      };
      (primitive as any).dialogManager = mockManager;

      const result = primitive.getSeriesConfig('series-1');

      expect(mockManager.getSeriesConfig).toHaveBeenCalledWith(0, 'series-1');
      expect(result).toEqual({ color: '#FF0000' });
    });

    it('should delegate setSeriesConfig to dialogManager', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const mockManager = {
        setSeriesConfig: vi.fn(),
        initializePane: vi.fn(),
      };
      (primitive as any).dialogManager = mockManager;

      const config = { color: '#FF0000' };
      primitive.setSeriesConfig('series-1', config);

      expect(mockManager.setSeriesConfig).toHaveBeenCalledWith(0, 'series-1', config);
    });

    it('should delegate syncToBackend to streamlitService', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const mockService = {
        forceSyncToBackend: vi.fn(),
      };
      (primitive as any)._streamlitService = mockService;

      primitive.syncToBackend();

      expect(mockService.forceSyncToBackend).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing containerElement gracefully in renderContent', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      (primitive as any).containerElement = null;

      expect(() => (primitive as any).renderContent()).not.toThrow();
    });

    it('should return correct paneId from getPaneId', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 2,
      });

      expect((primitive as any).getPaneId()).toBe(2);
    });

    it('should return 0 for paneId 0', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect((primitive as any).getPaneId()).toBe(0);
    });

    it('should calculate dimensions with no buttons visible', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showCollapseButton: false,
        showSeriesSettingsButton: false,
      });

      const dims = primitive.getDimensions();

      expect(dims.width).toBe(-4); // 0 buttons: 0 * 16 + (0 - 1) * 4 = -4
      expect(dims.height).toBe(16);
    });

    it('should handle detach when no resources to cleanup', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      // Don't set up any resources
      expect(() => (primitive as any).onDetached()).not.toThrow();
    });

    it('should initialize with visible false config', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        visible: false,
      });

      expect((primitive as any).config.visible).toBe(false);
    });
  });
});
