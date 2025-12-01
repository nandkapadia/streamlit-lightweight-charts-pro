/**
 * @vitest-environment jsdom
 * Tests for PrimitiveDefaults
 *
 * Centralized configuration constants for all primitive components
 */

import { describe, it, expect, vi } from 'vitest';

// Unmock the module under test
vi.unmock('../../primitives/PrimitiveDefaults');

import {
  TimeRangeSeconds,
  UniversalSpacing,
  ButtonDimensions,
  ButtonSpacing,
  ButtonColors,
  ButtonEffects,
  LegendDimensions,
  LayoutSpacing,
  LegendColors,
  RangeSwitcherLayout,
  FormatDefaults,
  ContainerDefaults,
  CommonValues,
  AnimationTiming,
  DefaultButtonConfig,
  DefaultLegendConfig,
  DefaultRangeSwitcherConfig,
  DefaultContainerConfig,
} from '../../primitives/PrimitiveDefaults';

describe('PrimitiveDefaults - TimeRangeSeconds', () => {
  it('should have all time range constants in seconds', () => {
    expect(TimeRangeSeconds.FIVE_MINUTES).toBe(300);
    expect(TimeRangeSeconds.FIFTEEN_MINUTES).toBe(900);
    expect(TimeRangeSeconds.ONE_HOUR).toBe(3600);
    expect(TimeRangeSeconds.FOUR_HOURS).toBe(14400);
    expect(TimeRangeSeconds.ONE_DAY).toBe(86400);
    expect(TimeRangeSeconds.ONE_WEEK).toBe(604800);
    expect(TimeRangeSeconds.ONE_MONTH).toBe(2592000);
    expect(TimeRangeSeconds.THREE_MONTHS).toBe(7776000);
    expect(TimeRangeSeconds.SIX_MONTHS).toBe(15552000);
    expect(TimeRangeSeconds.ONE_YEAR).toBe(31536000);
    expect(TimeRangeSeconds.FIVE_YEARS).toBe(157680000);
  });
});

describe('PrimitiveDefaults - UniversalSpacing', () => {
  it('should have universal spacing constants', () => {
    expect(UniversalSpacing.EDGE_PADDING).toBe(6);
    expect(UniversalSpacing.WIDGET_GAP).toBe(6);
    expect(UniversalSpacing.WIDGET_HORIZONTAL_GAP).toBe(6);
    expect(UniversalSpacing.DEFAULT_PADDING).toBe(6);
    expect(UniversalSpacing.BASE_Z_INDEX).toBe(1000);
  });
});

describe('PrimitiveDefaults - ButtonDimensions', () => {
  it('should have button dimension constants', () => {
    expect(ButtonDimensions.DEFAULT_WIDTH).toBe(24);
    expect(ButtonDimensions.DEFAULT_HEIGHT).toBe(24);
    expect(ButtonDimensions.PANE_ACTION_WIDTH).toBe(18);
    expect(ButtonDimensions.PANE_ACTION_HEIGHT).toBe(18);
    expect(ButtonDimensions.MIN_WIDTH_RANGE).toBe(40);
    expect(ButtonDimensions.BORDER_RADIUS).toBe(4);
    expect(ButtonDimensions.PANE_ACTION_BORDER_RADIUS).toBe(3);
    expect(ButtonDimensions.FONT_SIZE).toBe(14);
    expect(ButtonDimensions.RANGE_FONT_SIZE).toBe(12);
  });
});

describe('PrimitiveDefaults - ButtonSpacing', () => {
  it('should have button spacing constants', () => {
    expect(ButtonSpacing.CONTAINER_PADDING).toBe(6);
    expect(ButtonSpacing.CONTAINER_GAP).toBe(2);
    expect(ButtonSpacing.RANGE_CONTAINER_GAP).toBe(2);
    expect(ButtonSpacing.BUTTON_PADDING).toBe('4px 12px');
    expect(ButtonSpacing.RANGE_BUTTON_PADDING).toBe('3px 8px');
    expect(ButtonSpacing.PANE_ACTION_PADDING).toBe('0');
    expect(ButtonSpacing.BUTTON_MARGIN).toBe('0');
    expect(ButtonSpacing.RANGE_BUTTON_MARGIN).toBe('0 1px');
  });
});

describe('PrimitiveDefaults - ButtonColors', () => {
  it('should have button color constants', () => {
    expect(ButtonColors.DEFAULT_BACKGROUND).toBe('rgba(255, 255, 255, 0.1)');
    expect(ButtonColors.DEFAULT_COLOR).toBe('#666');
    expect(ButtonColors.HOVER_BACKGROUND).toBe('rgba(255, 255, 255, 0.2)');
    expect(ButtonColors.HOVER_COLOR).toBe('#333');
    expect(ButtonColors.PRESSED_BACKGROUND).toBe('#007AFF');
    expect(ButtonColors.PRESSED_COLOR).toBe('white');
    expect(ButtonColors.DISABLED_BACKGROUND).toBe('rgba(128, 128, 128, 0.1)');
    expect(ButtonColors.DISABLED_COLOR).toBe('#999');
    expect(ButtonColors.PANE_ACTION_BACKGROUND).toBe('rgba(255, 255, 255, 0.1)');
    expect(ButtonColors.PANE_ACTION_COLOR).toBe('#6b7280');
    expect(ButtonColors.ACTION_BACKGROUND).toBe('#007AFF');
    expect(ButtonColors.ACTION_HOVER_BACKGROUND).toBe('#0056CC');
  });
});

describe('PrimitiveDefaults - ButtonEffects', () => {
  it('should have button effect constants', () => {
    expect(ButtonEffects.DEFAULT_BORDER).toBe('1px solid rgba(255, 255, 255, 0.2)');
    expect(ButtonEffects.RANGE_BORDER).toBe('1px solid rgba(0, 0, 0, 0.1)');
    expect(ButtonEffects.DEFAULT_TRANSITION).toBe('all 0.2s ease');
    expect(ButtonEffects.HOVER_BOX_SHADOW).toBe('0 2px 4px rgba(0, 0, 0, 0.1)');
    expect(ButtonEffects.PRESSED_BOX_SHADOW).toBe('inset 0 2px 4px rgba(0, 0, 0, 0.1)');
    expect(ButtonEffects.FOCUS_OUTLINE).toBe('2px solid #007AFF');
  });
});

describe('PrimitiveDefaults - LegendDimensions', () => {
  it('should have legend dimension constants', () => {
    expect(LegendDimensions.DEFAULT_PADDING).toBe(6);
    expect(LegendDimensions.OHLC_PADDING).toBe(6);
    expect(LegendDimensions.BAND_PADDING).toBe(6);
    expect(LegendDimensions.BORDER_RADIUS).toBe(4);
    expect(LegendDimensions.MAX_WIDTH).toBe(200);
    expect(LegendDimensions.FONT_SIZE).toBe(12);
    expect(LegendDimensions.OHLC_FONT_SIZE).toBe(11);
    expect(LegendDimensions.BAND_FONT_SIZE).toBe(11);
  });
});

describe('PrimitiveDefaults - LayoutSpacing', () => {
  it('should have layout spacing constants', () => {
    expect(LayoutSpacing.EDGE_PADDING).toBe(6);
    expect(LayoutSpacing.WIDGET_GAP).toBe(6);
    expect(LayoutSpacing.BASE_Z_INDEX).toBe(1000);
  });
});

describe('PrimitiveDefaults - LegendColors', () => {
  it('should have legend color constants', () => {
    expect(LegendColors.DEFAULT_BACKGROUND).toBe('rgba(0, 0, 0, 0.8)');
    expect(LegendColors.DEFAULT_COLOR).toBe('white');
    expect(LegendColors.VOLUME_BACKGROUND).toBe('rgba(100, 100, 100, 0.8)');
    expect(LegendColors.BAND_BACKGROUND).toBe('rgba(0, 50, 100, 0.8)');
    expect(LegendColors.DEFAULT_OPACITY).toBe(0.8);
  });
});

describe('PrimitiveDefaults - RangeSwitcherLayout', () => {
  it('should have range switcher layout constants', () => {
    expect(RangeSwitcherLayout.CONTAINER_PADDING).toBe(0);
    expect(RangeSwitcherLayout.CONTAINER_GAP).toBe(2);
    expect(RangeSwitcherLayout.FLEX_DIRECTION).toBe('row');
    expect(RangeSwitcherLayout.ALIGN_ITEMS).toBe('center');
    expect(RangeSwitcherLayout.JUSTIFY_CONTENT).toBe('flex-end');
  });
});

describe('PrimitiveDefaults - FormatDefaults', () => {
  it('should have format constants', () => {
    expect(FormatDefaults.VALUE_FORMAT).toBe('.2f');
    expect(FormatDefaults.VOLUME_FORMAT).toBe('.0f');
    expect(FormatDefaults.BAND_FORMAT).toBe('.3f');
    expect(FormatDefaults.TIME_FORMAT).toBe('YYYY-MM-DD HH:mm:ss');
  });
});

describe('PrimitiveDefaults - ContainerDefaults', () => {
  it('should have container default constants', () => {
    expect(ContainerDefaults.BACKGROUND).toBe('transparent');
    expect(ContainerDefaults.FONT_FAMILY).toBe('Arial, sans-serif');
    expect(ContainerDefaults.FONT_WEIGHT).toBe('normal');
    expect(ContainerDefaults.TEXT_ALIGN).toBe('left');
    expect(ContainerDefaults.USER_SELECT).toBe('none');
    expect(ContainerDefaults.POINTER_EVENTS).toBe('auto');
    expect(ContainerDefaults.POSITION).toBe('absolute');
  });
});

describe('PrimitiveDefaults - CommonValues', () => {
  it('should have common CSS value constants', () => {
    expect(CommonValues.NONE).toBe('none');
    expect(CommonValues.AUTO).toBe('auto');
    expect(CommonValues.POINTER).toBe('pointer');
    expect(CommonValues.DEFAULT_CURSOR).toBe('default');
    expect(CommonValues.ZERO).toBe('0');
    expect(CommonValues.FONT_WEIGHT_MEDIUM).toBe('500');
    expect(CommonValues.FONT_WEIGHT_NORMAL).toBe('normal');
    expect(CommonValues.FONT_WEIGHT_BOLD).toBe('bold');
    expect(CommonValues.NOWRAP).toBe('nowrap');
    expect(CommonValues.HIDDEN).toBe('hidden');
    expect(CommonValues.ELLIPSIS).toBe('ellipsis');
  });
});

describe('PrimitiveDefaults - AnimationTiming', () => {
  it('should have animation timing constants', () => {
    expect(AnimationTiming.DEFAULT_TRANSITION).toBe('all 0.2s ease');
    expect(AnimationTiming.FAST_TRANSITION).toBe('all 0.1s ease');
    expect(AnimationTiming.SLOW_TRANSITION).toBe('all 0.3s ease');
  });
});

describe('PrimitiveDefaults - Composite Configurations', () => {
  it('should provide complete button configuration', () => {
    expect(DefaultButtonConfig.dimensions).toBe(ButtonDimensions);
    expect(DefaultButtonConfig.spacing).toBe(ButtonSpacing);
    expect(DefaultButtonConfig.colors).toBe(ButtonColors);
    expect(DefaultButtonConfig.effects).toBe(ButtonEffects);
    expect(DefaultButtonConfig.animation).toBe(AnimationTiming);
  });

  it('should provide complete legend configuration', () => {
    expect(DefaultLegendConfig.dimensions).toBe(LegendDimensions);
    expect(DefaultLegendConfig.colors).toBe(LegendColors);
    expect(DefaultLegendConfig.formats).toBe(FormatDefaults);
    expect(DefaultLegendConfig.animation).toBe(AnimationTiming);
  });

  it('should provide complete range switcher configuration', () => {
    expect(DefaultRangeSwitcherConfig.layout).toBe(RangeSwitcherLayout);
    expect(DefaultRangeSwitcherConfig.button).toBe(DefaultButtonConfig);
    expect(DefaultRangeSwitcherConfig.timeRanges).toBe(TimeRangeSeconds);
    expect(DefaultRangeSwitcherConfig.animation).toBe(AnimationTiming);
  });

  it('should provide complete container configuration', () => {
    expect(DefaultContainerConfig.styling).toBe(ContainerDefaults);
    expect(DefaultContainerConfig.animation).toBe(AnimationTiming);
  });
});
