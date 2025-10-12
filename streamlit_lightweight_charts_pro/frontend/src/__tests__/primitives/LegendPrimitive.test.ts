/**
 * @vitest-environment jsdom
 * Tests for LegendPrimitive
 *
 * Coverage:
 * - Construction with defaults
 * - Template processing
 * - Content rendering
 * - Styling (colors, opacity, borders, typography)
 * - Color opacity adjustments
 * - Crosshair event handling
 * - Public API (updateText, updateValueFormat, getCurrentContent, forceUpdate)
 * - Factory function
 * - Default configurations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Explicitly unmock the module we're testing
vi.unmock('../../primitives/LegendPrimitive');

// Mock BasePanePrimitive
vi.mock('../../primitives/BasePanePrimitive', () => ({
  BasePanePrimitive: class MockBasePanePrimitive {
    protected id: string;
    protected config: any;
    protected series: any = null;
    protected chart: any = null;
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
    protected onCrosshairMove(_event: any): void {}
    protected onContainerCreated(_container: HTMLElement): void {}
    protected getProcessedContent(): string {
      return this.config.text || '';
    }
    protected processTemplate(): void {}
    protected updateTemplateContext(_context: any): void {
      this.processTemplate();
    }
    protected updateConfig(updates: any): void {
      this.config = { ...this.config, ...updates };
      if (this.mounted) {
        this.processTemplate();
        this.renderContent();
      }
    }
  },
  BasePrimitiveConfig: class {},
  PrimitivePriority: {
    LEGEND: 50,
  },
}));

// Mock PrimitiveDefaults
vi.mock('../../primitives/PrimitiveDefaults', () => ({
  LegendColors: {
    DEFAULT_BACKGROUND: 'rgba(0, 0, 0, 0.8)',
    DEFAULT_COLOR: '#FFFFFF',
    DEFAULT_OPACITY: 0.8,
    VOLUME_BACKGROUND: 'rgba(0, 0, 0, 0.6)',
    BAND_BACKGROUND: 'rgba(0, 0, 0, 0.7)',
  },
  LegendDimensions: {
    FONT_SIZE: 12,
    DEFAULT_PADDING: 8,
    OHLC_PADDING: 10,
    BAND_PADDING: 8,
    BORDER_RADIUS: 4,
    MAX_WIDTH: 400,
    OHLC_FONT_SIZE: 11,
    BAND_FONT_SIZE: 11,
  },
  FormatDefaults: {
    VALUE_FORMAT: '.2f',
    TIME_FORMAT: 'YYYY-MM-DD',
    VOLUME_FORMAT: '.0f',
    BAND_FORMAT: '.2f',
  },
  ContainerDefaults: {
    FONT_FAMILY: 'Arial, sans-serif',
    TEXT_ALIGN: 'left',
    FONT_WEIGHT: 'normal',
  },
  CommonValues: {
    DEFAULT_CURSOR: 'default',
    NONE: 'none',
    NOWRAP: 'nowrap',
    HIDDEN: 'hidden',
    ELLIPSIS: 'ellipsis',
  },
}));

// Mock PrimitiveStylingUtils
vi.mock('../../primitives/PrimitiveStylingUtils', () => ({
  PrimitiveStylingUtils: {
    applyTypography: vi.fn(),
    applyBorder: vi.fn(),
    applyBaseStyles: vi.fn(),
  },
  BaseStyleConfig: class {},
  TypographyConfig: class {},
  BorderConfig: class {},
}));

// Import AFTER mocks
import {
  LegendPrimitive,
  createLegendPrimitive,
  DefaultLegendConfigs,
} from '../../primitives/LegendPrimitive';

describe('LegendPrimitive - Construction', () => {
  it('should create primitive with required config', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test Legend',
    });

    expect(legend).toBeDefined();
    expect((legend as any).config.text).toBe('Test Legend');
  });

  it('should apply default priority', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect((legend as any).config.priority).toBe(50); // PrimitivePriority.LEGEND
  });

  it('should apply default visibility', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect((legend as any).config.visible).toBe(true);
  });

  it('should apply default isPanePrimitive', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect((legend as any).config.isPanePrimitive).toBe(true);
  });

  it('should apply default paneId', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect((legend as any).config.paneId).toBe(0);
  });

  it('should apply custom paneId when provided', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
      paneId: 1,
    });

    expect((legend as any).config.paneId).toBe(1);
  });

  it('should apply default value format', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect((legend as any).config.valueFormat).toBe('.2f');
  });

  it('should apply default styling', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect((legend as any).config.style.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
    expect((legend as any).config.style.color).toBe('#FFFFFF');
    expect((legend as any).config.style.fontSize).toBe(12);
  });

  it('should merge custom styling with defaults', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
      style: {
        backgroundColor: 'blue',
      },
    });

    expect((legend as any).config.style.backgroundColor).toBe('blue');
    expect((legend as any).config.style.color).toBe('#FFFFFF'); // Default
  });
});

describe('LegendPrimitive - Template Processing', () => {
  it('should return template text', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: '$$value$$',
    });

    expect((legend as any).getTemplate()).toBe('$$value$$');
  });

  it('should return default template if text is empty', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: '',
    });

    expect((legend as any).getTemplate()).toBe('$$value$$');
  });
});

describe('LegendPrimitive - Rendering', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should create legend content element', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    (legend as any).containerElement = container;
    (legend as any).renderContent();

    const legendElement = container.querySelector('.legend-content');
    expect(legendElement).toBeDefined();
  });

  it('should set aria attributes for accessibility', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    (legend as any).containerElement = container;
    (legend as any).renderContent();

    const legendElement = container.querySelector('.legend-content');
    expect(legendElement?.getAttribute('role')).toBe('img');
    expect(legendElement?.getAttribute('aria-label')).toBe('Chart legend');
  });

  it('should update existing legend element', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    (legend as any).containerElement = container;
    (legend as any).renderContent();

    const firstElement = container.querySelector('.legend-content');

    (legend as any).renderContent();

    const secondElement = container.querySelector('.legend-content');
    expect(firstElement).toBe(secondElement); // Same element reused
  });

  it('should return early if no container', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect(() => (legend as any).renderContent()).not.toThrow();
  });
});

describe('LegendPrimitive - Color Opacity Adjustment', () => {
  let legend: LegendPrimitive;

  beforeEach(() => {
    legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });
  });

  it('should adjust rgba color opacity', () => {
    const result = (legend as any).adjustColorOpacity('rgba(255, 0, 0, 0.5)', 0.8);
    expect(result).toBe('rgba(255, 0, 0, 0.8)');
  });

  it('should convert rgb to rgba with opacity', () => {
    const result = (legend as any).adjustColorOpacity('rgb(255, 0, 0)', 0.5);
    expect(result).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('should convert hex to rgba with opacity', () => {
    const result = (legend as any).adjustColorOpacity('#FF0000', 0.7);
    expect(result).toBe('rgba(255, 0, 0, 0.7)');
  });

  it('should handle 6-digit hex colors', () => {
    const result = (legend as any).adjustColorOpacity('#0088FF', 0.5);
    expect(result).toBe('rgba(0, 136, 255, 0.5)');
  });

  it('should return original color for unsupported formats', () => {
    const result = (legend as any).adjustColorOpacity('blue', 0.5);
    expect(result).toBe('blue');
  });

  it('should handle rgba with spaces', () => {
    const result = (legend as any).adjustColorOpacity('rgba( 255 , 128 , 0 , 0.3 )', 0.9);
    expect(result).toBe('rgba(255, 128, 0, 0.9)');
  });
});

describe('LegendPrimitive - Styling', () => {
  it('should return correct container class name', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect((legend as any).getContainerClassName()).toBe('legend-primitive');
  });

  it('should return configured pane ID', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
      isPanePrimitive: true,
      paneId: 2,
    });

    expect((legend as any).getPaneId()).toBe(2);
  });

  it('should return default pane ID when not pane-specific', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
      isPanePrimitive: false,
    });

    expect((legend as any).getPaneId()).toBe(0);
  });

  it('should return default pane ID when paneId is undefined', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
      isPanePrimitive: true,
    });

    expect((legend as any).getPaneId()).toBe(0);
  });
});

describe('LegendPrimitive - Crosshair Events', () => {
  let legend: LegendPrimitive;
  let mockSeries: any;

  beforeEach(() => {
    legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: '$$value$$',
    });

    mockSeries = {};
    (legend as any).series = mockSeries;
  });

  it('should update legend from crosshair with series data', () => {
    const updateSpy = vi.spyOn(legend as any, 'updateTemplateContext');

    const event = {
      time: 1000,
      point: { x: 100, y: 200 },
      seriesData: new Map([[mockSeries, { value: 42 }]]),
    };

    (legend as any).updateLegendFromCrosshair(event);

    expect(updateSpy).toHaveBeenCalledWith({
      seriesData: { value: 42 },
      formatting: {
        valueFormat: '.2f',
        timeFormat: 'YYYY-MM-DD',
      },
    });
  });

  it('should clear legend when no time', () => {
    const updateSpy = vi.spyOn(legend as any, 'updateTemplateContext');

    const event = {
      time: null,
      point: null,
      seriesData: new Map(),
    };

    (legend as any).updateLegendFromCrosshair(event);

    expect(updateSpy).toHaveBeenCalledWith({
      seriesData: undefined,
      formatting: {
        valueFormat: '.2f',
      },
    });
  });

  it('should clear legend when no series', () => {
    (legend as any).series = null;

    const updateSpy = vi.spyOn(legend as any, 'updateTemplateContext');

    const event = {
      time: 1000,
      point: { x: 100, y: 200 },
      seriesData: new Map([[{}, { value: 42 }]]),
    };

    (legend as any).updateLegendFromCrosshair(event);

    expect(updateSpy).toHaveBeenCalledWith({
      seriesData: undefined,
      formatting: {
        valueFormat: '.2f',
      },
    });
  });

  it('should clear legend when seriesData is empty', () => {
    const updateSpy = vi.spyOn(legend as any, 'updateTemplateContext');

    const event = {
      time: 1000,
      point: { x: 100, y: 200 },
      seriesData: new Map(),
    };

    (legend as any).updateLegendFromCrosshair(event);

    expect(updateSpy).toHaveBeenCalledWith({
      seriesData: undefined,
      formatting: {
        valueFormat: '.2f',
      },
    });
  });

  it('should not update if series data does not match', () => {
    const updateSpy = vi.spyOn(legend as any, 'updateTemplateContext');

    const otherSeries = {};
    const event = {
      time: 1000,
      point: { x: 100, y: 200 },
      seriesData: new Map([[otherSeries, { value: 42 }]]),
    };

    (legend as any).updateLegendFromCrosshair(event);

    expect(updateSpy).toHaveBeenCalledTimes(0);
  });
});

describe('LegendPrimitive - Public API', () => {
  let legend: LegendPrimitive;

  beforeEach(() => {
    legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Original Text',
    });
  });

  describe('updateText', () => {
    it('should update text config', () => {
      legend.updateText('New Text');

      expect((legend as any).config.text).toBe('New Text');
    });
  });

  describe('updateValueFormat', () => {
    it('should update value format config', () => {
      legend.updateValueFormat('.4f');

      expect((legend as any).config.valueFormat).toBe('.4f');
    });
  });

  describe('getCurrentContent', () => {
    it('should return current processed content', () => {
      const content = legend.getCurrentContent();

      expect(content).toBe('Original Text');
    });
  });

  describe('forceUpdate', () => {
    it('should trigger processTemplate and renderContent when mounted', () => {
      (legend as any).mounted = true;
      const processSpy = vi.spyOn(legend as any, 'processTemplate');
      const renderSpy = vi.spyOn(legend as any, 'renderContent');

      legend.forceUpdate();

      expect(processSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should not update when not mounted', () => {
      (legend as any).mounted = false;
      const processSpy = vi.spyOn(legend as any, 'processTemplate');
      const renderSpy = vi.spyOn(legend as any, 'renderContent');

      legend.forceUpdate();

      expect(processSpy).not.toHaveBeenCalled();
      expect(renderSpy).not.toHaveBeenCalled();
    });
  });
});

describe('Factory Function - createLegendPrimitive', () => {
  it('should create legend primitive', () => {
    const legend = createLegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });

    expect(legend).toBeInstanceOf(LegendPrimitive);
    expect((legend as any).config.text).toBe('Test');
  });

  it('should apply provided config', () => {
    const legend = createLegendPrimitive('test-legend', {
      corner: 'top-right',
      text: '$$value$$',
      valueFormat: '.0f',
    });

    expect((legend as any).config.corner).toBe('top-right');
    expect((legend as any).config.valueFormat).toBe('.0f');
  });
});

describe('Default Configurations', () => {
  it('should provide simple config', () => {
    expect(DefaultLegendConfigs.simple.text).toBe('$$value$$');
    expect(DefaultLegendConfigs.simple.valueFormat).toBe('.2f');
  });

  it('should provide OHLC config', () => {
    expect(DefaultLegendConfigs.ohlc.text).toBe('O: $$open$$ H: $$high$$ L: $$low$$ C: $$close$$');
    expect(DefaultLegendConfigs.ohlc.valueFormat).toBe('.2f');
  });

  it('should provide volume config', () => {
    expect(DefaultLegendConfigs.volume.text).toBe('Vol: $$volume$$');
    expect(DefaultLegendConfigs.volume.valueFormat).toBe('.0f');
  });

  it('should provide band config', () => {
    expect(DefaultLegendConfigs.band.text).toBe('U: $$upper$$ M: $$middle$$ L: $$lower$$');
    expect(DefaultLegendConfigs.band.valueFormat).toBe('.2f');
  });

  it('should have consistent styling in configs', () => {
    expect(DefaultLegendConfigs.simple.style.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
    expect(DefaultLegendConfigs.ohlc.style.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
    expect(DefaultLegendConfigs.volume.style.backgroundColor).toBe('rgba(0, 0, 0, 0.6)');
    expect(DefaultLegendConfigs.band.style.backgroundColor).toBe('rgba(0, 0, 0, 0.7)');
  });
});

describe('LegendPrimitive - Edge Cases', () => {
  it('should handle undefined text in constructor', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: undefined as any,
    });

    expect((legend as any).getTemplate()).toBe('$$value$$');
  });

  it('should handle special characters in text', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: '<b>Bold</b> & "Quoted"',
    });

    expect((legend as any).getTemplate()).toBe('<b>Bold</b> & "Quoted"');
  });

  it('should handle complex nested styling', () => {
    const legend = new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
      style: {
        backgroundColor: '#FF0000',
        backgroundOpacity: 0.5,
        border: {
          width: 2,
          color: '#000000',
          style: 'solid',
        },
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
      },
    });

    expect((legend as any).config.style.backgroundOpacity).toBe(0.5);
    expect((legend as any).config.style.border.width).toBe(2);
    expect((legend as any).config.style.textShadow).toBe('1px 1px 2px rgba(0, 0, 0, 0.5)');
  });

  // Helper function kept for potential future use
  // @ts-expect-error - Helper function intentionally unused for future use
  function _legend(): any {
    return new LegendPrimitive('test-legend', {
      corner: 'top-left',
      text: 'Test',
    });
  }
});
