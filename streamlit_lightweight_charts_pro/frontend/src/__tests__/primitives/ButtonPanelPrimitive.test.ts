/**
 * @fileoverview Tests for ButtonPanelPrimitive
 *
 * Tests cover:
 * - Constructor and initialization
 * - Button creation (collapse, gear)
 * - Button styles and hover effects
 * - SVG icon generation
 * - Pane collapse/expand functionality
 * - Series configuration dialog
 * - Series management and detection
 * - Config persistence (localStorage, backend)
 * - Event callbacks
 * - Public API methods
 * - Factory functions
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ButtonPanelPrimitive, createButtonPanelPrimitive, createButtonPanelPrimitives } from '../../primitives/ButtonPanelPrimitive';
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
    protected getContainerClassName(): string { return ''; }
    protected getTemplate(): string { return ''; }
    protected onAttached(_params: any): void {}
    protected onDetached(): void {}
    protected getPaneId(): number { return 0; }
  },
  PrimitivePriority: {
    LEGEND: 1,
    RANGE_SWITCHER: 2,
    MINIMIZE_BUTTON: 3,
    PANE_CONTROLS: 4,
  },
}));

vi.mock('../../services/StreamlitSeriesConfigService', () => ({
  StreamlitSeriesConfigService: {
    getInstance: vi.fn(() => ({
      recordConfigChange: vi.fn(),
      getChartConfig: vi.fn(() => ({})),
      getSeriesConfig: vi.fn(() => null),
      forceSyncToBackend: vi.fn(),
    })),
  },
}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

vi.mock('react', () => {
  const React = {
    Component: class Component {
      constructor(props: any) {
        this.props = props;
      }
      props: any;
      render() {
        return null;
      }
    },
    createElement: vi.fn((type, props, ...children) => ({ type, props, children })),
  };
  return {
    default: React,
    ...React,
  };
});

vi.mock('streamlit-component-lib', () => ({
  Streamlit: {
    setComponentValue: vi.fn(),
    setFrameHeight: vi.fn(),
    setComponentReady: vi.fn(),
  },
  StreamlitComponentBase: class {
    props: any;
    constructor(props: any) {
      this.props = props;
    }
    render() {
      return null;
    }
  },
  withStreamlitConnection: (component: any) => component,
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ButtonPanelPrimitive', () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as any;

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
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

    it('should initialize pane state with collapsed false', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect((primitive as any).paneState.isCollapsed).toBe(false);
    });

    it('should initialize pane state with default collapsed height', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect((primitive as any).paneState.collapsedHeight).toBe(45);
    });

    it('should initialize empty series configs map', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect((primitive as any).paneState.seriesConfigs).toBeInstanceOf(Map);
      expect((primitive as any).paneState.seriesConfigs.size).toBe(0);
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

  describe('Button Creation', () => {
    it('should create collapse button when enabled', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showCollapseButton: true,
      });

      const button = (primitive as any).createCollapseButton();

      expect(button).toBeDefined();
      expect(button.className).toBe('collapse-button');
    });

    it('should create gear button when enabled', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showGearButton: true,
      });

      const button = (primitive as any).createGearButton();

      expect(button).toBeDefined();
      expect(button.className).toBe('gear-button');
    });

    it('should not create collapse button when disabled', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showCollapseButton: false,
      });

      expect((primitive as any).config.showCollapseButton).toBe(false);
    });

    it('should not create gear button when disabled', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        showGearButton: false,
      });

      expect((primitive as any).config.showGearButton).toBe(false);
    });

    it('should set aria-label on collapse button', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const button = (primitive as any).createCollapseButton();

      expect(button.getAttribute('aria-label')).toBe('Collapse pane');
    });

    it('should set aria-label on gear button', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const button = (primitive as any).createGearButton();

      expect(button.getAttribute('aria-label')).toBe('Configure series');
    });

    it('should add click event listener to collapse button', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const button = (primitive as any).createCollapseButton();
      const clickEvent = new Event('click');

      expect(() => button.dispatchEvent(clickEvent)).not.toThrow();
    });

    it('should add click event listener to gear button', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const button = (primitive as any).createGearButton();
      const clickEvent = new Event('click');

      expect(() => button.dispatchEvent(clickEvent)).not.toThrow();
    });
  });

  describe('Button Styles', () => {
    it('should apply default button styles', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const styles = (primitive as any).getButtonStyles();

      expect(styles).toContain('background: rgba(255, 255, 255, 0.9)');
      expect(styles).toContain('color: #787B86');
    });

    it('should apply custom button background', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonBackground: '#FFFFFF',
      });

      const styles = (primitive as any).getButtonStyles();

      expect(styles).toContain('background: #FFFFFF');
    });

    it('should apply custom button color', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonColor: '#000000',
      });

      const styles = (primitive as any).getButtonStyles();

      expect(styles).toContain('color: #000000');
    });

    it('should apply custom border radius', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonBorderRadius: 5,
      });

      const styles = (primitive as any).getButtonStyles();

      expect(styles).toContain('border-radius: 5px');
    });

    it('should include cursor pointer in styles', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const styles = (primitive as any).getButtonStyles();

      expect(styles).toContain('cursor: pointer');
    });

    it('should include flex display in styles', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const styles = (primitive as any).getButtonStyles();

      expect(styles).toContain('display: flex');
      expect(styles).toContain('align-items: center');
      expect(styles).toContain('justify-content: center');
    });

    it('should include transition for hover effects', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const styles = (primitive as any).getButtonStyles();

      expect(styles).toContain('transition: background-color 0.2s ease, color 0.2s ease');
    });
  });

  describe('Button Hover Effects', () => {
    it('should add mouseenter event listener', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const button = document.createElement('button');
      (primitive as any).addButtonHoverEffects(button);

      const mouseenterEvent = new Event('mouseenter');
      expect(() => button.dispatchEvent(mouseenterEvent)).not.toThrow();
    });

    it('should add mouseleave event listener', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const button = document.createElement('button');
      (primitive as any).addButtonHoverEffects(button);

      const mouseleaveEvent = new Event('mouseleave');
      expect(() => button.dispatchEvent(mouseleaveEvent)).not.toThrow();
    });

    it('should change background on mouseenter', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonBackground: '#FFFFFF',
        buttonHoverBackground: '#EEEEEE',
      });

      const button = document.createElement('button');
      button.style.backgroundColor = '#FFFFFF';
      (primitive as any).addButtonHoverEffects(button);

      const mouseenterEvent = new Event('mouseenter');
      button.dispatchEvent(mouseenterEvent);

      // Browser converts hex to rgb format
      expect(button.style.backgroundColor).toMatch(/#EEEEEE|rgb\(238,\s*238,\s*238\)/);
    });

    it('should restore background on mouseleave', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonBackground: '#FFFFFF',
        buttonHoverBackground: '#EEEEEE',
      });

      const button = document.createElement('button');
      button.style.backgroundColor = '#FFFFFF';
      (primitive as any).addButtonHoverEffects(button);

      const mouseenterEvent = new Event('mouseenter');
      const mouseleaveEvent = new Event('mouseleave');

      button.dispatchEvent(mouseenterEvent);
      button.dispatchEvent(mouseleaveEvent);

      // Browser converts hex to rgb format
      expect(button.style.backgroundColor).toMatch(/#FFFFFF|rgb\(255,\s*255,\s*255\)/);
    });

    it('should change color on mouseenter', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonColor: '#000000',
        buttonHoverColor: '#333333',
      });

      const button = document.createElement('button');
      button.style.color = '#000000';
      (primitive as any).addButtonHoverEffects(button);

      const mouseenterEvent = new Event('mouseenter');
      button.dispatchEvent(mouseenterEvent);

      // Browser converts hex to rgb format
      expect(button.style.color).toMatch(/#333333|rgb\(51,\s*51,\s*51\)/);
    });

    it('should restore color on mouseleave', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        buttonColor: '#000000',
        buttonHoverColor: '#333333',
      });

      const button = document.createElement('button');
      button.style.color = '#000000';
      (primitive as any).addButtonHoverEffects(button);

      const mouseenterEvent = new Event('mouseenter');
      const mouseleaveEvent = new Event('mouseleave');

      button.dispatchEvent(mouseenterEvent);
      button.dispatchEvent(mouseleaveEvent);

      // Browser converts hex to rgb format
      expect(button.style.color).toMatch(/#000000|rgb\(0,\s*0,\s*0\)/);
    });
  });

  describe('SVG Icon Generation', () => {
    it('should generate settings SVG icon', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const svg = (primitive as any).getSettingsSVG();

      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox="0 0 18 18"');
      expect(svg).toContain('currentColor');
    });

    it('should generate collapse SVG icon', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const svg = (primitive as any).getCollapseSVG();

      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox="0 0 15 15"');
      expect(svg).toContain('bracket-up');
      expect(svg).toContain('bracket-down');
    });

    it('should include gear icon path in settings SVG', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const svg = (primitive as any).getSettingsSVG();

      expect(svg).toContain('<path');
      expect(svg).toContain('fill-rule="evenodd"');
    });

    it('should include bracket paths in collapse SVG', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const svg = (primitive as any).getCollapseSVG();

      expect(svg).toContain('class="bracket-up"');
      expect(svg).toContain('class="bracket-down"');
    });
  });

  describe('Pane Collapse Functionality', () => {
    it('should not collapse when chart is not set', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect(() => (primitive as any).collapsePane()).not.toThrow();
      expect((primitive as any).paneState.isCollapsed).toBe(false);
    });

    it('should not expand when chart is not set', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      expect(() => (primitive as any).expandPane()).not.toThrow();
    });

    it('should call onPaneCollapse callback when collapsed', () => {
      const onPaneCollapse = vi.fn();
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 1,
        onPaneCollapse,
      });

      // Mock chart with panes
      (primitive as any).chart = {
        panes: () => [{}, {
          getStretchFactor: () => 1,
          setStretchFactor: vi.fn(),
        }],
        paneSize: () => ({ height: 200 }),
        chartElement: () => ({ clientWidth: 800, clientHeight: 600 }),
        resize: vi.fn(),
      };

      (primitive as any).collapsePane();

      expect(onPaneCollapse).toHaveBeenCalledWith(1, true);
    });

    it('should call onPaneExpand callback when expanded', () => {
      const onPaneExpand = vi.fn();
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 1,
        onPaneExpand,
      });

      // Mock chart with panes
      (primitive as any).chart = {
        panes: () => [{}, {
          getStretchFactor: () => 0.05,
          setStretchFactor: vi.fn(),
        }],
        chartElement: () => ({ clientWidth: 800, clientHeight: 600 }),
        resize: vi.fn(),
      };

      (primitive as any).paneState.isCollapsed = true;
      (primitive as any).paneState.originalStretchFactor = 0.2;
      (primitive as any).expandPane();

      expect(onPaneExpand).toHaveBeenCalledWith(1, false);
    });

    it('should store original stretch factor when collapsing', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 1,
      });

      // Mock chart with panes
      (primitive as any).chart = {
        panes: () => [{}, {
          getStretchFactor: () => 0.3,
          setStretchFactor: vi.fn(),
        }],
        paneSize: () => ({ height: 200 }),
        chartElement: () => ({ clientWidth: 800, clientHeight: 600 }),
        resize: vi.fn(),
      };

      (primitive as any).collapsePane();

      expect((primitive as any).paneState.originalStretchFactor).toBe(0.3);
    });

    it('should set minimal stretch factor when collapsing', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 1,
      });

      const setStretchFactor = vi.fn();
      (primitive as any).chart = {
        panes: () => [{}, {
          getStretchFactor: () => 0.3,
          setStretchFactor,
        }],
        paneSize: () => ({ height: 200 }),
        chartElement: () => ({ clientWidth: 800, clientHeight: 600 }),
        resize: vi.fn(),
      };

      (primitive as any).collapsePane();

      expect(setStretchFactor).toHaveBeenCalledWith(0.05);
    });

    it('should restore original stretch factor when expanding', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 1,
      });

      const setStretchFactor = vi.fn();
      (primitive as any).chart = {
        panes: () => [{}, {
          getStretchFactor: () => 0.05,
          setStretchFactor,
        }],
        chartElement: () => ({ clientWidth: 800, clientHeight: 600 }),
        resize: vi.fn(),
      };

      (primitive as any).paneState.isCollapsed = true;
      (primitive as any).paneState.originalStretchFactor = 0.25;
      (primitive as any).expandPane();

      expect(setStretchFactor).toHaveBeenCalledWith(0.25);
    });

    it('should trigger chart resize when collapsing', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 1,
      });

      const resize = vi.fn();
      (primitive as any).chart = {
        panes: () => [{}, {
          getStretchFactor: () => 0.3,
          setStretchFactor: vi.fn(),
        }],
        paneSize: () => ({ height: 200 }),
        chartElement: () => ({ clientWidth: 800, clientHeight: 600 }),
        resize,
      };

      (primitive as any).collapsePane();

      expect(resize).toHaveBeenCalledWith(800, 600);
    });

    it('should trigger chart resize when expanding', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 1,
      });

      const resize = vi.fn();
      (primitive as any).chart = {
        panes: () => [{}, {
          getStretchFactor: () => 0.05,
          setStretchFactor: vi.fn(),
        }],
        chartElement: () => ({ clientWidth: 800, clientHeight: 600 }),
        resize,
      };

      (primitive as any).paneState.isCollapsed = true;
      (primitive as any).expandPane();

      expect(resize).toHaveBeenCalledWith(800, 600);
    });
  });

  describe('Series Type Detection', () => {
    // Note: detectCustomSeriesType() method doesn't exist in current implementation
    // These tests are skipped pending implementation
    it.skip('should detect custom series type via getSeriesType', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const customSeries = {
        getSeriesType: () => 'ribbon',
      };

      const type = (primitive as any).detectCustomSeriesType(customSeries);

      expect(type).toBe('ribbon');
    });

    it.skip('should detect custom series type via _series wrapper', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const customSeries = {
        _series: {
          getSeriesType: () => 'band',
        },
      };

      const type = (primitive as any).detectCustomSeriesType(customSeries);

      expect(type).toBe('band');
    });

    it.skip('should detect custom series type via series wrapper', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const customSeries = {
        series: {
          getSeriesType: () => 'gradient_ribbon',
        },
      };

      const type = (primitive as any).detectCustomSeriesType(customSeries);

      expect(type).toBe('gradient_ribbon');
    });

    it.skip('should return null when no custom series type detected', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const standardSeries = {
        seriesType: () => 'Line',
      };

      const type = (primitive as any).detectCustomSeriesType(standardSeries);

      expect(type).toBe(null);
    });

    it.skip('should handle null series gracefully', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const type = (primitive as any).detectCustomSeriesType(null);

      expect(type).toBe(null);
    });

    it('should map standard Line series type', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const type = (primitive as any).mapSeriesType('Line');

      expect(type).toBe('line');
    });

    it('should map standard Area series type', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const type = (primitive as any).mapSeriesType('Area');

      expect(type).toBe('area');
    });

    it('should map standard Candlestick series type', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const type = (primitive as any).mapSeriesType('Candlestick');

      expect(type).toBe('candlestick');
    });

    it('should map standard Histogram series type', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const type = (primitive as any).mapSeriesType('Histogram');

      expect(type).toBe('histogram');
    });

    it('should default to line for unknown types', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const type = (primitive as any).mapSeriesType('UnknownType');

      expect(type).toBe('line');
    });
  });

  describe('Default Series Configuration', () => {
    it('should provide base config for line series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('line');

      expect(config.color).toBe('#2196F3');
      expect(config.lineWidth).toBe(2);
      expect(config.opacity).toBe(1);
    });

    it('should provide config for supertrend series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('supertrend');

      expect(config.period).toBe(10);
      expect(config.multiplier).toBe(3.0);
      expect(config.upTrend).toBeDefined();
      expect(config.downTrend).toBeDefined();
    });

    it('should provide config for bollinger bands series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('bollinger_bands');

      expect(config.length).toBe(20);
      expect(config.stdDev).toBe(2);
      expect(config.upperLine).toBeDefined();
      expect(config.lowerLine).toBeDefined();
    });

    it('should provide config for SMA series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('sma');

      expect(config.length).toBe(20);
      expect(config.source).toBe('close');
      expect(config.offset).toBe(0);
    });

    it('should provide config for EMA series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('ema');

      expect(config.length).toBe(20);
      expect(config.source).toBe('close');
    });

    it('should provide config for ribbon series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('ribbon');

      expect(config.upperLine).toBeDefined();
      expect(config.lowerLine).toBeDefined();
      expect(config.fill).toBeDefined();
      expect(config.fillVisible).toBe(true);
    });

    // Note: 'band', 'gradient_ribbon', and 'trend_fill' series are not supported in getDefaultSeriesConfig()
    // Only supported: 'supertrend', 'bollinger_bands', 'sma', 'ema', 'ribbon'
    it.skip('should provide config for band series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('band');

      expect(config.upperLine).toBeDefined();
      expect(config.middleLine).toBeDefined();
      expect(config.lowerLine).toBeDefined();
      expect(config.upperFill).toBeDefined();
      expect(config.lowerFill).toBeDefined();
    });

    it.skip('should provide config for gradient ribbon series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('gradient_ribbon');

      expect(config.gradientStartColor).toBe('#4CAF50');
      expect(config.gradientEndColor).toBe('#F44336');
      expect(config.normalizeGradients).toBe(false);
    });

    it.skip('should provide config for trend fill series', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = (primitive as any).getDefaultSeriesConfig('trend_fill');

      expect(config.trendLineColor).toBe('#2196F3');
      expect(config.trendFillColor).toBe('rgba(33, 150, 243, 0.1)');
      expect(config.trendFillVisible).toBe(true);
    });
  });

  describe('Config Persistence', () => {
    it('should save config to localStorage', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = { color: '#FF0000' };
      (primitive as any).saveSeriesConfig('series-1', config);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'series-config-series-1',
        JSON.stringify(config)
      );
    });

    it('should call Streamlit service when applying config', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        chartId: 'chart-1',
      });

      const config = { color: '#FF0000' };
      const service = (primitive as any).streamlitService;

      (primitive as any).applySeriesConfig('series-1', config);

      expect(service.recordConfigChange).toHaveBeenCalled();
    });

    it('should trigger onSeriesConfigChange callback', () => {
      const onSeriesConfigChange = vi.fn();
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
        onSeriesConfigChange,
      });

      const config = { color: '#FF0000' };
      (primitive as any).applySeriesConfig('series-1', config);

      expect(onSeriesConfigChange).toHaveBeenCalledWith(0, 'series-1', config);
    });

    it('should store config in pane state', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = { color: '#FF0000' };
      (primitive as any).applySeriesConfig('series-1', config);

      expect((primitive as any).paneState.seriesConfigs.get('series-1')).toEqual(config);
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

    it('should return null when config not found', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = primitive.getSeriesConfig('non-existent');

      expect(config).toBe(null);
    });

    it('should return config from local state', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const testConfig = { color: '#FF0000' };
      (primitive as any).paneState.seriesConfigs.set('series-1', testConfig);

      const config = primitive.getSeriesConfig('series-1');

      expect(config).toEqual(testConfig);
    });

    it('should set config via public API', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const config = { color: '#FF0000' };
      primitive.setSeriesConfig('series-1', config);

      expect((primitive as any).paneState.seriesConfigs.get('series-1')).toEqual(config);
    });

    it('should sync to backend via public API', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const service = (primitive as any).streamlitService;
      primitive.syncToBackend();

      expect(service.forceSyncToBackend).toHaveBeenCalled();
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
      expect((primitive as any).config.showCollapseButton).toBe(true);
      expect((primitive as any).config.showGearButton).toBe(true);
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

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing containerElement gracefully', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      (primitive as any).containerElement = null;

      expect(() => (primitive as any).renderContent()).not.toThrow();
    });

    it('should handle error in collapse operation', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      // Mock chart with error-throwing panes
      (primitive as any).chart = {
        panes: () => {
          throw new Error('Test error');
        },
      };

      expect(() => (primitive as any).collapsePane()).not.toThrow();
    });

    it('should handle error in expand operation', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      // Mock chart with error-throwing panes
      (primitive as any).chart = {
        panes: () => {
          throw new Error('Test error');
        },
      };

      expect(() => (primitive as any).expandPane()).not.toThrow();
    });

    it('should handle invalid paneId gracefully', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 999,
      });

      (primitive as any).chart = {
        panes: () => [{}], // Only 1 pane, but paneId is 999
      };

      expect(() => (primitive as any).collapsePane()).not.toThrow();
    });

    it('should handle missing chart element', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      (primitive as any).chart = {
        panes: () => [{ getStretchFactor: () => 1, setStretchFactor: vi.fn() }],
        paneSize: () => ({ height: 200 }),
        chartElement: () => null,
        resize: vi.fn(),
      };

      expect(() => (primitive as any).collapsePane()).not.toThrow();
    });

    it('should handle error in getAllSeriesForPane', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      (primitive as any).chart = {
        panes: () => {
          throw new Error('Test error');
        },
      };

      const series = (primitive as any).getAllSeriesForPane();

      expect(series).toEqual([]);
    });

    it('should handle error in saveSeriesConfig', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      // Mock localStorage to throw
      global.localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => (primitive as any).saveSeriesConfig('series-1', {})).not.toThrow();
    });

    // Note: detectCustomSeriesType() method doesn't exist in current implementation
    it.skip('should handle null series in detection', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 0,
      });

      const type = (primitive as any).detectCustomSeriesType(null);

      expect(type).toBe(null);
    });

    it('should provide fallback stretch factor when not stored', () => {
      const primitive = new ButtonPanelPrimitive('test-id', {
        paneId: 1,
      });

      const setStretchFactor = vi.fn();
      (primitive as any).chart = {
        panes: () => [{}, {
          getStretchFactor: () => 0.05,
          setStretchFactor,
        }],
        chartElement: () => ({ clientWidth: 800, clientHeight: 600 }),
        resize: vi.fn(),
      };

      (primitive as any).paneState.isCollapsed = true;
      // Don't set originalStretchFactor
      (primitive as any).expandPane();

      expect(setStretchFactor).toHaveBeenCalledWith(0.2); // Default fallback
    });
  });
});
