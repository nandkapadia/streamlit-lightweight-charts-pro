/**
 * @vitest-environment jsdom
 * Tests for RangeSwitcherPrimitive
 *
 * Coverage:
 * - TimeRange enum and conversion functions
 * - RangeConfig helpers (getRangeValue, isAllRange, getSecondsFromRange)
 * - Constructor and configuration with defaults
 * - Button creation and DOM manipulation
 * - Button styling (default, hover states)
 * - Event handlers (click, mouseenter, mouseleave)
 * - Range application to chart (specific ranges and "All")
 * - Data timespan calculation and caching
 * - Range visibility logic based on data
 * - Public API (addRange, removeRange, updateRanges, etc.)
 * - Event subscriptions and emissions
 * - Cleanup and lifecycle
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Explicitly unmock the module we're testing
vi.unmock('../../primitives/RangeSwitcherPrimitive');

// Mock BasePanePrimitive BEFORE importing RangeSwitcherPrimitive
vi.mock('../../primitives/BasePanePrimitive', () => ({
  BasePanePrimitive: class MockBasePanePrimitive {
    protected id: string;
    protected config: any;
    protected chart: any;
    protected containerElement: HTMLElement | null = null;
    protected mounted = false;
    protected eventManager: any = null;
    protected layoutManager: any = null;
    protected eventSubscriptions: any[] = [];

    constructor(id: string, config: any) {
      this.id = id;
      this.config = config;
    }

    protected getTemplate(): string {
      return '';
    }
    protected renderContent(): void {}
    protected getContainerClassName(): string {
      return 'mock-container';
    }
    protected getPaneId(): number {
      return 0;
    }
    protected setupCustomEventSubscriptions(): void {}
    protected onContainerCreated(_container: HTMLElement): void {}

    public detached(): void {
      this.mounted = false;
      this.containerElement = null;
    }

    public attached(params: any): void {
      this.chart = params.chart;
      this.mounted = true;
    }
  },
  BasePrimitiveConfig: class {},
  PrimitivePriority: {
    RANGE_SWITCHER: 100,
  },
}));

// Mock PrimitiveDefaults
vi.mock('../../primitives/PrimitiveDefaults', () => ({
  TimeRangeSeconds: {
    FIVE_MINUTES: 300,
    FIFTEEN_MINUTES: 900,
    ONE_HOUR: 3600,
    FOUR_HOURS: 14400,
    ONE_DAY: 86400,
    ONE_WEEK: 604800,
    ONE_MONTH: 2592000,
    THREE_MONTHS: 7776000,
    SIX_MONTHS: 15552000,
    ONE_YEAR: 31536000,
    FIVE_YEARS: 157680000,
  },
  DefaultRangeSwitcherConfig: {
    layout: {
      CONTAINER_PADDING: '8px',
      FLEX_DIRECTION: 'row',
      CONTAINER_GAP: 4,
      ALIGN_ITEMS: 'center',
      JUSTIFY_CONTENT: 'flex-start',
    },
  },
  ButtonColors: {
    DEFAULT_BACKGROUND: 'rgba(255, 255, 255, 0.9)',
    DEFAULT_COLOR: '#666',
    HOVER_BACKGROUND: 'rgba(255, 255, 255, 1)',
    HOVER_COLOR: '#333',
  },
  ButtonDimensions: {
    BORDER_RADIUS: 4,
    RANGE_FONT_SIZE: 11,
    MIN_WIDTH_RANGE: 40,
  },
  ButtonEffects: {
    DEFAULT_BORDER: '1px solid rgba(0, 0, 0, 0.1)',
    RANGE_BORDER: '1px solid rgba(0, 0, 0, 0.1)',
    DEFAULT_TRANSITION: 'all 0.2s ease',
    RANGE_HOVER_BOX_SHADOW: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  ButtonSpacing: {
    RANGE_BUTTON_PADDING: '4px 8px',
    RANGE_BUTTON_MARGIN: '0 2px',
  },
  CommonValues: {
    FONT_WEIGHT_MEDIUM: 500,
    POINTER: 'pointer',
  },
}));

// Mock PrimitiveStylingUtils
vi.mock('../../primitives/PrimitiveStylingUtils', () => ({
  PrimitiveStylingUtils: {
    applyInteractionState: vi.fn((element: HTMLElement, baseStyles: any, stateStyles: any) => {
      Object.assign(element.style, baseStyles, stateStyles);
    }),
  },
  BaseStyleConfig: class {},
}));

// Import AFTER mocks
import {
  RangeSwitcherPrimitive,
  TimeRange,
  RangeConfig,
  getRangeValue,
  isAllRange,
  getSecondsFromRange,
  DefaultRangeConfigs,
  createRangeSwitcherPrimitive,
} from '../../primitives/RangeSwitcherPrimitive';

describe('RangeSwitcherPrimitive - Helper Functions', () => {
  describe('getRangeValue', () => {
    it('should return range property when defined', () => {
      const config: RangeConfig = { text: '1D', range: TimeRange.ONE_DAY };
      expect(getRangeValue(config)).toBe(TimeRange.ONE_DAY);
    });

    it('should return numeric range when defined', () => {
      const config: RangeConfig = { text: 'Custom', range: 12345 };
      expect(getRangeValue(config)).toBe(12345);
    });

    it('should return null for ALL range', () => {
      const config: RangeConfig = { text: 'All', range: TimeRange.ALL };
      expect(getRangeValue(config)).toBe(TimeRange.ALL);
    });

    it('should fall back to seconds property for backwards compatibility', () => {
      const config: RangeConfig = { text: '1D', range: undefined as any, seconds: 86400 };
      expect(getRangeValue(config)).toBe(86400);
    });

    it('should return null when both properties are undefined', () => {
      const config: RangeConfig = { text: 'All', range: undefined as any };
      expect(getRangeValue(config)).toBe(null);
    });
  });

  describe('isAllRange', () => {
    it('should return true for null range', () => {
      const config: RangeConfig = { text: 'All', range: null };
      expect(isAllRange(config)).toBe(true);
    });

    it('should return true for TimeRange.ALL', () => {
      const config: RangeConfig = { text: 'All', range: TimeRange.ALL };
      expect(isAllRange(config)).toBe(true);
    });

    it('should return false for numeric range', () => {
      const config: RangeConfig = { text: '1D', range: 86400 };
      expect(isAllRange(config)).toBe(false);
    });

    it('should return false for TimeRange enum values', () => {
      const config: RangeConfig = { text: '1D', range: TimeRange.ONE_DAY };
      expect(isAllRange(config)).toBe(false);
    });
  });

  describe('getSecondsFromRange', () => {
    it('should return null for null range', () => {
      expect(getSecondsFromRange(null)).toBe(null);
    });

    it('should return null for TimeRange.ALL', () => {
      expect(getSecondsFromRange(TimeRange.ALL)).toBe(null);
    });

    it('should return numeric value directly', () => {
      expect(getSecondsFromRange(12345)).toBe(12345);
    });

    it('should convert FIVE_MINUTES to seconds', () => {
      expect(getSecondsFromRange(TimeRange.FIVE_MINUTES)).toBe(300);
    });

    it('should convert FIFTEEN_MINUTES to seconds', () => {
      expect(getSecondsFromRange(TimeRange.FIFTEEN_MINUTES)).toBe(900);
    });

    it('should convert THIRTY_MINUTES to seconds', () => {
      expect(getSecondsFromRange(TimeRange.THIRTY_MINUTES)).toBe(1800);
    });

    it('should convert ONE_HOUR to seconds', () => {
      expect(getSecondsFromRange(TimeRange.ONE_HOUR)).toBe(3600);
    });

    it('should convert FOUR_HOURS to seconds', () => {
      expect(getSecondsFromRange(TimeRange.FOUR_HOURS)).toBe(14400);
    });

    it('should convert ONE_DAY to seconds', () => {
      expect(getSecondsFromRange(TimeRange.ONE_DAY)).toBe(86400);
    });

    it('should convert ONE_WEEK to seconds', () => {
      expect(getSecondsFromRange(TimeRange.ONE_WEEK)).toBe(604800);
    });

    it('should convert TWO_WEEKS to seconds', () => {
      expect(getSecondsFromRange(TimeRange.TWO_WEEKS)).toBe(604800 * 2);
    });

    it('should convert ONE_MONTH to seconds', () => {
      expect(getSecondsFromRange(TimeRange.ONE_MONTH)).toBe(2592000);
    });

    it('should convert THREE_MONTHS to seconds', () => {
      expect(getSecondsFromRange(TimeRange.THREE_MONTHS)).toBe(7776000);
    });

    it('should convert SIX_MONTHS to seconds', () => {
      expect(getSecondsFromRange(TimeRange.SIX_MONTHS)).toBe(15552000);
    });

    it('should convert ONE_YEAR to seconds', () => {
      expect(getSecondsFromRange(TimeRange.ONE_YEAR)).toBe(31536000);
    });

    it('should convert TWO_YEARS to seconds', () => {
      expect(getSecondsFromRange(TimeRange.TWO_YEARS)).toBe(31536000 * 2);
    });

    it('should convert FIVE_YEARS to seconds', () => {
      expect(getSecondsFromRange(TimeRange.FIVE_YEARS)).toBe(157680000);
    });
  });
});

describe('RangeSwitcherPrimitive - Construction and Configuration', () => {
  // Mock chart kept for potential future use
  // @ts-expect-error - Mock chart intentionally unused for future use
  const _mockChart = {
    timeScale: vi.fn(() => ({
      fitContent: vi.fn(),
      getVisibleRange: vi.fn(() => ({ from: 1000, to: 2000 })),
      setVisibleRange: vi.fn(),
    })),
  };

  it('should create instance with required config', () => {
    const ranges: RangeConfig[] = [
      { text: '1D', range: TimeRange.ONE_DAY },
      { text: 'All', range: TimeRange.ALL },
    ];

    const primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges,
    });

    expect(primitive).toBeDefined();
    expect((primitive as any).config.ranges).toEqual(ranges);
  });

  it('should apply default priority', () => {
    const primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges: [],
    });

    expect((primitive as any).config.priority).toBe(100); // PrimitivePriority.RANGE_SWITCHER
  });

  it('should apply default visibility', () => {
    const primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges: [],
    });

    expect((primitive as any).config.visible).toBe(true);
  });

  it('should merge custom style with defaults', () => {
    const primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges: [],
      style: {
        button: {
          backgroundColor: 'red',
        },
      },
    });

    expect((primitive as any).config.style.button.backgroundColor).toBe('red');
    // Style merging happens at different levels, custom style overrides defaults
    expect((primitive as any).config.style.button).toBeDefined();
  });

  it('should accept onRangeChange callback', () => {
    const callback = vi.fn();
    const primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges: [],
      onRangeChange: callback,
    });

    expect((primitive as any).config.onRangeChange).toBe(callback);
  });
});

describe('RangeSwitcherPrimitive - Button Creation', () => {
  let primitive: RangeSwitcherPrimitive;
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    const ranges: RangeConfig[] = [
      { text: '1D', range: TimeRange.ONE_DAY },
      { text: '1W', range: TimeRange.ONE_WEEK },
      { text: 'All', range: TimeRange.ALL },
    ];

    primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges,
    });

    mockContainer = document.createElement('div');
    (primitive as any).containerElement = mockContainer;
    (primitive as any).mounted = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create buttons for each range', () => {
    (primitive as any).renderContent();

    const buttons = mockContainer.querySelectorAll('button.range-button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toBe('1D');
    expect(buttons[1].textContent).toBe('1W');
    expect(buttons[2].textContent).toBe('All');
  });

  it('should set data-range-index attribute', () => {
    (primitive as any).renderContent();

    const buttons = mockContainer.querySelectorAll('button.range-button');
    expect(buttons[0].getAttribute('data-range-index')).toBe('0');
    expect(buttons[1].getAttribute('data-range-index')).toBe('1');
    expect(buttons[2].getAttribute('data-range-index')).toBe('2');
  });

  it('should set aria-label for accessibility', () => {
    (primitive as any).renderContent();

    const buttons = mockContainer.querySelectorAll('button.range-button');
    expect(buttons[0].getAttribute('aria-label')).toBe('Switch to 1D time range');
    expect(buttons[2].getAttribute('aria-label')).toBe('Switch to All time range');
  });

  it('should set data-range-seconds attribute for non-null ranges', () => {
    (primitive as any).renderContent();

    const buttons = mockContainer.querySelectorAll('button.range-button');
    expect(buttons[0].getAttribute('data-range-seconds')).toBe('86400'); // 1 day
    expect(buttons[1].getAttribute('data-range-seconds')).toBe('604800'); // 1 week
    expect(buttons[2].hasAttribute('data-range-seconds')).toBe(false); // All
  });

  it('should not recreate buttons if already rendered', () => {
    (primitive as any).renderContent();
    const firstButtons = mockContainer.querySelectorAll('button.range-button');

    (primitive as any).renderContent();
    const secondButtons = mockContainer.querySelectorAll('button.range-button');

    expect(firstButtons.length).toBe(secondButtons.length);
    expect((primitive as any).buttonElements.length).toBe(3);
  });

  it('should apply container styling', () => {
    (primitive as any).renderContent();

    const container = mockContainer.querySelector('.range-switcher-container') as HTMLElement;
    expect(container).toBeDefined();
    expect(container.style.pointerEvents).toBe('auto');
  });
});

describe('RangeSwitcherPrimitive - Event Handling', () => {
  let primitive: RangeSwitcherPrimitive;
  let mockContainer: HTMLDivElement;
  let mockChart: any;

  beforeEach(() => {
    mockChart = {
      timeScale: vi.fn(() => ({
        fitContent: vi.fn(),
        getVisibleRange: vi.fn(() => ({ from: 1000, to: 2000 })),
        setVisibleRange: vi.fn(),
      })),
    };

    const ranges: RangeConfig[] = [
      { text: '1D', range: TimeRange.ONE_DAY },
      { text: 'All', range: TimeRange.ALL },
    ];

    primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges,
    });

    mockContainer = document.createElement('div');
    (primitive as any).containerElement = mockContainer;
    (primitive as any).chart = mockChart;
    (primitive as any).mounted = true;
    (primitive as any).renderContent();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle button click', () => {
    const buttons = mockContainer.querySelectorAll('button.range-button');
    const button = buttons[0] as HTMLButtonElement;

    button.click();

    expect(mockChart.timeScale).toHaveBeenCalled();
  });

  it('should call onRangeChange callback on click', () => {
    const callback = vi.fn();
    (primitive as any).config.onRangeChange = callback;

    const buttons = mockContainer.querySelectorAll('button.range-button');
    const button = buttons[0] as HTMLButtonElement;

    button.click();

    expect(callback).toHaveBeenCalledWith({ text: '1D', range: TimeRange.ONE_DAY }, 0);
  });

  it('should emit custom event on range change', () => {
    const mockEventManager = {
      emitCustomEvent: vi.fn(),
      subscribe: vi.fn(),
    };
    (primitive as any).eventManager = mockEventManager;

    const buttons = mockContainer.querySelectorAll('button.range-button');
    const button = buttons[0] as HTMLButtonElement;

    button.click();

    expect(mockEventManager.emitCustomEvent).toHaveBeenCalledWith('rangeChange', {
      range: { text: '1D', range: TimeRange.ONE_DAY },
      index: 0,
    });
  });

  it('should prevent default and stop propagation on click', () => {
    const buttons = mockContainer.querySelectorAll('button.range-button');
    const button = buttons[0] as HTMLButtonElement;

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    button.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should cleanup event listeners on detached', () => {
    const buttons = mockContainer.querySelectorAll('button.range-button');
    expect(buttons.length).toBeGreaterThan(0);

    primitive.detached();

    expect((primitive as any).buttonEventCleanupFunctions.length).toBe(0);
  });
});

describe('RangeSwitcherPrimitive - Range Application', () => {
  let primitive: RangeSwitcherPrimitive;
  let mockChart: any;
  let mockTimeScale: any;

  beforeEach(() => {
    mockTimeScale = {
      fitContent: vi.fn(),
      getVisibleRange: vi.fn(() => ({ from: 1000, to: 2000 })),
      setVisibleRange: vi.fn(),
    };

    mockChart = {
      timeScale: vi.fn(() => mockTimeScale),
    };

    const ranges: RangeConfig[] = [
      { text: '1D', range: TimeRange.ONE_DAY },
      { text: 'All', range: TimeRange.ALL },
    ];

    primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges,
    });

    (primitive as any).chart = mockChart;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should apply specific range to chart', () => {
    const range: RangeConfig = { text: '1D', range: TimeRange.ONE_DAY };
    (primitive as any).applyRangeToChart(range);

    expect(mockChart.timeScale).toHaveBeenCalled();
    expect(mockTimeScale.setVisibleRange).toHaveBeenCalled();
  });

  it('should apply "All" range using fitContent', () => {
    const range: RangeConfig = { text: 'All', range: TimeRange.ALL };
    (primitive as any).applyRangeToChart(range);

    expect(mockChart.timeScale).toHaveBeenCalled();
    expect(mockTimeScale.fitContent).toHaveBeenCalled();
    expect(mockTimeScale.setVisibleRange).not.toHaveBeenCalled();
  });

  it('should apply null range using fitContent', () => {
    const range: RangeConfig = { text: 'All', range: null };
    (primitive as any).applyRangeToChart(range);

    expect(mockTimeScale.fitContent).toHaveBeenCalled();
  });

  it('should calculate range from current end time', () => {
    mockTimeScale.getVisibleRange.mockReturnValue({ from: 1000, to: 2000 });

    const range: RangeConfig = { text: '1D', range: TimeRange.ONE_DAY };
    (primitive as any).applyRangeToChart(range);

    expect(mockTimeScale.setVisibleRange).toHaveBeenCalledWith({
      from: 2000 - 86400,
      to: 2000,
    });
  });

  it('should use current time if no visible range', () => {
    mockTimeScale.getVisibleRange.mockReturnValue(null);
    const now = Date.now() / 1000;

    const range: RangeConfig = { text: '1D', range: TimeRange.ONE_DAY };
    (primitive as any).applyRangeToChart(range);

    expect(mockTimeScale.setVisibleRange).toHaveBeenCalled();
    const call = mockTimeScale.setVisibleRange.mock.calls[0][0];
    expect(call.to).toBeCloseTo(now, -2); // Within 100 seconds
  });

  it('should handle chart errors silently', () => {
    mockChart.timeScale.mockImplementation(() => {
      throw new Error('Chart error');
    });

    const range: RangeConfig = { text: '1D', range: TimeRange.ONE_DAY };
    expect(() => (primitive as any).applyRangeToChart(range)).not.toThrow();
  });
});

describe('RangeSwitcherPrimitive - Data Timespan', () => {
  let primitive: RangeSwitcherPrimitive;
  let mockChart: any;
  let mockTimeScale: any;

  beforeEach(() => {
    mockTimeScale = {
      fitContent: vi.fn(),
      getVisibleRange: vi.fn(),
      setVisibleRange: vi.fn(),
    };

    mockChart = {
      timeScale: vi.fn(() => mockTimeScale),
    };

    primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges: [],
    });

    (primitive as any).chart = mockChart;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call fitContent to calculate data timespan', () => {
    (primitive as any).getDataTimespan();

    expect(mockChart.timeScale).toHaveBeenCalled();
    expect(mockTimeScale.fitContent).toHaveBeenCalled();
  });

  it('should cache data timespan and return cached value', () => {
    // Set a cached value directly
    (primitive as any).dataTimespan = 86400;

    const timespan = (primitive as any).getDataTimespan();

    expect(timespan).toBe(86400);
  });

  it('should return null if chart is unavailable', () => {
    (primitive as any).chart = null;

    const timespan = (primitive as any).getDataTimespan();

    expect(timespan).toBe(null);
  });

  it('should return null if range is invalid', () => {
    mockTimeScale.getVisibleRange.mockReturnValue(null);

    const timespan = (primitive as any).getDataTimespan();

    expect(timespan).toBe(null);
  });

  it('should handle errors and return null', () => {
    mockChart.timeScale.mockImplementation(() => {
      throw new Error('Error');
    });

    const timespan = (primitive as any).getDataTimespan();

    expect(timespan).toBe(null);
  });

  it('should invalidate cached timespan', () => {
    mockTimeScale.getVisibleRange.mockReturnValue({ from: 0, to: 1000 });

    (primitive as any).getDataTimespan(); // Cache it
    primitive.invalidateDataTimespan();

    expect((primitive as any).dataTimespan).toBe(null);
  });
});

describe('RangeSwitcherPrimitive - Range Visibility', () => {
  let primitive: RangeSwitcherPrimitive;

  beforeEach(() => {
    const ranges: RangeConfig[] = [
      { text: '1D', range: TimeRange.ONE_DAY },
      { text: '1W', range: TimeRange.ONE_WEEK },
      { text: '1M', range: TimeRange.ONE_MONTH },
      { text: 'All', range: TimeRange.ALL },
    ];

    primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges,
    });

    // Mock data timespan to 7 days (604800 seconds)
    (primitive as any).getDataTimespan = vi.fn(() => 604800);
  });

  it('should show ranges smaller than data timespan', () => {
    const range: RangeConfig = { text: '1D', range: TimeRange.ONE_DAY };
    expect((primitive as any).isRangeValidForData(range)).toBe(true);
  });

  it('should show ranges equal to data timespan', () => {
    const range: RangeConfig = { text: '1W', range: TimeRange.ONE_WEEK };
    expect((primitive as any).isRangeValidForData(range)).toBe(true);
  });

  it('should hide ranges larger than data timespan', () => {
    const range: RangeConfig = { text: '1M', range: TimeRange.ONE_MONTH };
    expect((primitive as any).isRangeValidForData(range)).toBe(false);
  });

  it('should always show "All" range', () => {
    const range: RangeConfig = { text: 'All', range: TimeRange.ALL };
    expect((primitive as any).isRangeValidForData(range)).toBe(true);
  });

  it('should apply buffer multiplier (10%)', () => {
    // Data timespan is 604800 (7 days)
    // With 10% buffer: 665280 seconds
    const range: RangeConfig = { text: 'Custom', range: 650000 };
    expect((primitive as any).isRangeValidForData(range)).toBe(true);
  });

  it('should show all ranges if data timespan is unavailable', () => {
    (primitive as any).getDataTimespan = vi.fn(() => null);

    const range: RangeConfig = { text: '1Y', range: TimeRange.ONE_YEAR };
    expect((primitive as any).isRangeValidForData(range)).toBe(true);
  });
});

describe('RangeSwitcherPrimitive - Public API', () => {
  let primitive: RangeSwitcherPrimitive;
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    const ranges: RangeConfig[] = [{ text: '1D', range: TimeRange.ONE_DAY }];

    primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges,
    });

    mockContainer = document.createElement('div');
    (primitive as any).containerElement = mockContainer;
    (primitive as any).mounted = true;
  });

  describe('addRange', () => {
    it('should add new range to config', () => {
      const newRange: RangeConfig = { text: '1W', range: TimeRange.ONE_WEEK };
      primitive.addRange(newRange);

      expect((primitive as any).config.ranges.length).toBe(2);
      expect((primitive as any).config.ranges[1]).toEqual(newRange);
    });

    it('should invalidate cached timespan', () => {
      const spy = vi.spyOn(primitive, 'invalidateDataTimespan');
      const newRange: RangeConfig = { text: '1W', range: TimeRange.ONE_WEEK };

      primitive.addRange(newRange);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('removeRange', () => {
    beforeEach(() => {
      primitive.addRange({ text: '1W', range: TimeRange.ONE_WEEK });
      primitive.addRange({ text: '1M', range: TimeRange.ONE_MONTH });
    });

    it('should remove range at index', () => {
      primitive.removeRange(1);

      expect((primitive as any).config.ranges.length).toBe(2);
      expect((primitive as any).config.ranges[1].text).toBe('1M');
    });

    it('should not remove if index is out of bounds', () => {
      const initialLength = (primitive as any).config.ranges.length;
      primitive.removeRange(99);

      expect((primitive as any).config.ranges.length).toBe(initialLength);
    });

    it('should not remove if index is negative', () => {
      const initialLength = (primitive as any).config.ranges.length;
      primitive.removeRange(-1);

      expect((primitive as any).config.ranges.length).toBe(initialLength);
    });
  });

  describe('updateRanges', () => {
    it('should replace all ranges', () => {
      const newRanges: RangeConfig[] = [
        { text: '5M', range: TimeRange.FIVE_MINUTES },
        { text: '15M', range: TimeRange.FIFTEEN_MINUTES },
      ];

      primitive.updateRanges(newRanges);

      expect((primitive as any).config.ranges).toEqual(newRanges);
    });

    it('should invalidate cached timespan', () => {
      const spy = vi.spyOn(primitive, 'invalidateDataTimespan');
      primitive.updateRanges([]);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getDataTimespanSeconds', () => {
    it('should return cached data timespan', () => {
      // Add a mock chart so the method can access it
      const mockChart = { timeScale: vi.fn() };
      (primitive as any).chart = mockChart;

      // Set cached value directly
      (primitive as any).dataTimespan = 86400;

      const result = primitive.getDataTimespanSeconds();

      expect(result).toBe(86400);
    });

    it('should return null if no data timespan is cached', () => {
      (primitive as any).chart = null; // No chart = no timespan

      const result = primitive.getDataTimespanSeconds();

      expect(result).toBe(null);
    });
  });

  describe('getHiddenRanges', () => {
    beforeEach(() => {
      (primitive as any).config.ranges = [
        { text: '1D', range: TimeRange.ONE_DAY },
        { text: '1M', range: TimeRange.ONE_MONTH },
        { text: 'All', range: TimeRange.ALL },
      ];
      (primitive as any).getDataTimespan = vi.fn(() => 86400); // 1 day of data
    });

    it('should return ranges that exceed data timespan', () => {
      const hidden = primitive.getHiddenRanges();

      expect(hidden.length).toBe(1);
      expect(hidden[0].range.text).toBe('1M');
      expect(hidden[0].reason).toBe('exceeds-data-range');
    });

    it('should not include "All" range', () => {
      const hidden = primitive.getHiddenRanges();

      expect(hidden.every(h => h.range.text !== 'All')).toBe(true);
    });
  });

  describe('getVisibleRangeInfo', () => {
    beforeEach(() => {
      (primitive as any).config.ranges = [
        { text: '1D', range: TimeRange.ONE_DAY },
        { text: '1M', range: TimeRange.ONE_MONTH },
        { text: 'All', range: TimeRange.ALL },
      ];
      (primitive as any).getDataTimespan = vi.fn(() => 86400); // 1 day of data
    });

    it('should return visible ranges with info', () => {
      const visible = primitive.getVisibleRangeInfo();

      expect(visible.length).toBe(2); // 1D and All
      expect(visible[0].range.text).toBe('1D');
      expect(visible[1].range.text).toBe('All');
      expect(visible[0].dataTimespan).toBe(86400);
    });
  });

  describe('triggerRangeChange', () => {
    it('should programmatically trigger range change', () => {
      const mockChart = {
        timeScale: vi.fn(() => ({
          fitContent: vi.fn(),
          getVisibleRange: vi.fn(() => ({ from: 1000, to: 2000 })),
          setVisibleRange: vi.fn(),
        })),
      };
      (primitive as any).chart = mockChart;

      const callback = vi.fn();
      (primitive as any).config.onRangeChange = callback;

      primitive.triggerRangeChange(0);

      expect(callback).toHaveBeenCalledWith({ text: '1D', range: TimeRange.ONE_DAY }, 0);
    });
  });
});

describe('RangeSwitcherPrimitive - Factory and Defaults', () => {
  it('should create primitive using factory function', () => {
    const primitive = createRangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges: [...DefaultRangeConfigs.trading],
    });

    expect(primitive).toBeInstanceOf(RangeSwitcherPrimitive);
    expect((primitive as any).config.ranges.length).toBe(6);
  });

  it('should provide trading range configs', () => {
    expect(DefaultRangeConfigs.trading.length).toBe(6);
    expect(DefaultRangeConfigs.trading[0].text).toBe('1D');
    expect(DefaultRangeConfigs.trading[5].text).toBe('All');
  });

  it('should provide short-term range configs', () => {
    expect(DefaultRangeConfigs.shortTerm.length).toBe(7);
    expect(DefaultRangeConfigs.shortTerm[0].text).toBe('5M');
  });

  it('should provide long-term range configs', () => {
    expect(DefaultRangeConfigs.longTerm.length).toBe(7);
    expect(DefaultRangeConfigs.longTerm[0].text).toBe('1M');
  });

  it('should provide minimal range configs', () => {
    expect(DefaultRangeConfigs.minimal.length).toBe(4);
    expect(DefaultRangeConfigs.minimal[0].text).toBe('1D');
  });
});

describe('RangeSwitcherPrimitive - Lifecycle and Cleanup', () => {
  let primitive: RangeSwitcherPrimitive;

  beforeEach(() => {
    primitive = new RangeSwitcherPrimitive('test-switcher', {
      corner: 'top-right',
      ranges: [{ text: '1D', range: TimeRange.ONE_DAY }],
    });
  });

  it('should cleanup interval on detached', () => {
    (primitive as any).dataChangeIntervalId = setInterval(() => {}, 1000);
    // Store interval ID for potential future verification
    // @ts-expect-error - Interval ID intentionally unused for future verification
    const _intervalId = (primitive as any).dataChangeIntervalId;

    primitive.detached();

    expect((primitive as any).dataChangeIntervalId).toBe(null);
  });

  it('should cleanup button event listeners on detached', () => {
    const mockContainer = document.createElement('div');
    (primitive as any).containerElement = mockContainer;
    (primitive as any).mounted = true;
    (primitive as any).renderContent();

    expect((primitive as any).buttonEventCleanupFunctions.length).toBeGreaterThan(0);

    primitive.detached();

    expect((primitive as any).buttonEventCleanupFunctions.length).toBe(0);
  });

  it('should return empty template', () => {
    expect((primitive as any).getTemplate()).toBe('');
  });

  it('should return correct container class name', () => {
    expect((primitive as any).getContainerClassName()).toBe('range-switcher-primitive');
  });

  it('should always use pane 0 (chart-level)', () => {
    expect((primitive as any).getPaneId()).toBe(0);
  });
});
