/**
 * @fileoverview Primitive Defaults - Configuration Constants
 *
 * Single source of truth for all primitive configuration constants, default
 * values, and styling configurations. Ensures consistency across all
 * primitive components.
 *
 * This file provides:
 * - Time range constants (seconds for various periods)
 * - Layout spacing and positioning constants
 * - Button dimensions and styling
 * - Color schemes and themes
 * - Typography defaults
 * - Legend configuration defaults
 * - Range switcher presets
 *
 * Architecture:
 * - Const objects with 'as const' for type safety
 * - Organized by category (buttons, legends, colors, etc.)
 * - Readonly values prevent accidental mutations
 * - Used by all primitive components
 *
 * DRY Principles:
 * - Single source of truth for all defaults
 * - No magic numbers scattered in code
 * - Easy to update globally
 * - Type-safe with TypeScript inference
 *
 * @example
 * ```typescript
 * import { ButtonColors, UniversalSpacing } from './PrimitiveDefaults';
 *
 * const buttonStyle = {
 *   background: ButtonColors.DEFAULT_BACKGROUND,
 *   padding: UniversalSpacing.EDGE_PADDING
 * };
 * ```
 */

// ===== Range Configuration Constants =====

/**
 * Time range constants in seconds
 */
export const TimeRangeSeconds = {
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
} as const;

// ===== Common Layout Constants =====

/**
 * Universal padding and spacing constants
 */
export const UniversalSpacing = {
  EDGE_PADDING: 6, // Universal padding for widget edges and container spacing
  WIDGET_GAP: 6, // Gap between stacked widgets
  WIDGET_HORIZONTAL_GAP: 6, // Gap between horizontally stacked widgets
  DEFAULT_PADDING: 6, // Default padding inside widgets
  BASE_Z_INDEX: 1000,
} as const;

// ===== Button Styling Constants =====

/**
 * Default button dimensions
 */
export const ButtonDimensions = {
  DEFAULT_WIDTH: 24,
  DEFAULT_HEIGHT: 24,
  PANE_ACTION_WIDTH: 18,
  PANE_ACTION_HEIGHT: 18,
  MIN_WIDTH_RANGE: 40,
  BORDER_RADIUS: 4,
  PANE_ACTION_BORDER_RADIUS: 3,
  FONT_SIZE: 14,
  RANGE_FONT_SIZE: 12,
} as const;

/**
 * Button spacing constants
 */
export const ButtonSpacing = {
  CONTAINER_PADDING: UniversalSpacing.EDGE_PADDING,
  CONTAINER_GAP: 2, // Reduced from 4 for more compact layout
  RANGE_CONTAINER_GAP: 2, // Reduced from 4 for tighter spacing
  BUTTON_PADDING: '4px 12px', // Standard button padding (not affected by 6px widget margin rule)
  RANGE_BUTTON_PADDING: '3px 8px', // More compact padding for range buttons
  PANE_ACTION_PADDING: '0',
  BUTTON_MARGIN: '0',
  RANGE_BUTTON_MARGIN: '0 1px', // Reduced margin between buttons
} as const;

/**
 * Button color constants
 */
export const ButtonColors = {
  DEFAULT_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  DEFAULT_COLOR: '#666',
  HOVER_BACKGROUND: 'rgba(255, 255, 255, 0.2)',
  HOVER_COLOR: '#333',
  PRESSED_BACKGROUND: '#007AFF',
  PRESSED_COLOR: 'white',
  DISABLED_BACKGROUND: 'rgba(128, 128, 128, 0.1)',
  DISABLED_COLOR: '#999',
  PANE_ACTION_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  PANE_ACTION_COLOR: '#6b7280',
  PANE_ACTION_HOVER_BACKGROUND: 'rgba(255, 255, 255, 1)',
  PANE_ACTION_PRESSED_BACKGROUND: 'rgba(229, 231, 235, 1)',
  PANE_ACTION_BORDER: '#d1d5db',
  ACTION_BACKGROUND: '#007AFF',
  ACTION_HOVER_BACKGROUND: '#0056CC',
} as const;

/**
 * Button border and shadow constants
 */
export const ButtonEffects = {
  DEFAULT_BORDER: '1px solid rgba(255, 255, 255, 0.2)',
  RANGE_BORDER: '1px solid rgba(0, 0, 0, 0.1)', // Subtle border for range buttons
  DEFAULT_TRANSITION: 'all 0.2s ease',
  HOVER_BOX_SHADOW: '0 2px 4px rgba(0, 0, 0, 0.1)',
  RANGE_HOVER_BOX_SHADOW: '0 1px 3px rgba(0, 0, 0, 0.12)', // Subtle shadow for range buttons
  PRESSED_BOX_SHADOW: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
  FOCUS_OUTLINE: '2px solid #007AFF',
} as const;

// ===== Legend Styling Constants =====

/**
 * Legend dimensions and spacing
 */
export const LegendDimensions = {
  DEFAULT_PADDING: UniversalSpacing.DEFAULT_PADDING,
  OHLC_PADDING: UniversalSpacing.DEFAULT_PADDING,
  BAND_PADDING: UniversalSpacing.DEFAULT_PADDING,
  BORDER_RADIUS: 4,
  MAX_WIDTH: 200,
  FONT_SIZE: 12,
  OHLC_FONT_SIZE: 11,
  BAND_FONT_SIZE: 11,
} as const;

/**
 * Layout spacing constants
 */
export const LayoutSpacing = {
  EDGE_PADDING: UniversalSpacing.EDGE_PADDING,
  WIDGET_GAP: UniversalSpacing.WIDGET_GAP,
  BASE_Z_INDEX: UniversalSpacing.BASE_Z_INDEX,
} as const;

/**
 * Legend color constants
 */
export const LegendColors = {
  DEFAULT_BACKGROUND: 'rgba(0, 0, 0, 0.8)',
  DEFAULT_COLOR: 'white',
  VOLUME_BACKGROUND: 'rgba(100, 100, 100, 0.8)',
  BAND_BACKGROUND: 'rgba(0, 50, 100, 0.8)',
  DEFAULT_OPACITY: 0.8,
} as const;

// ===== Range Switcher Configuration =====

/**
 * Range switcher layout constants
 */
export const RangeSwitcherLayout = {
  CONTAINER_PADDING: 0, // No internal padding - edge margin is handled by positioning logic
  CONTAINER_GAP: ButtonSpacing.RANGE_CONTAINER_GAP, // Use the compact gap setting
  FLEX_DIRECTION: 'row' as const,
  ALIGN_ITEMS: 'center',
  JUSTIFY_CONTENT: 'flex-end',
} as const;

// ===== Format Constants =====

/**
 * Default format strings
 */
export const FormatDefaults = {
  VALUE_FORMAT: '.2f',
  VOLUME_FORMAT: '.0f',
  BAND_FORMAT: '.3f',
  TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
} as const;

// ===== Container Styling Constants =====

/**
 * Base container styling
 */
export const ContainerDefaults = {
  BACKGROUND: 'transparent',
  FONT_FAMILY: 'Arial, sans-serif',
  FONT_WEIGHT: 'normal' as const,
  TEXT_ALIGN: 'left' as const,
  USER_SELECT: 'none',
  POINTER_EVENTS: 'auto',
  POSITION: 'absolute',
} as const;

// ===== Common UI Constants =====

/**
 * Common CSS values used across primitives
 */
export const CommonValues = {
  NONE: 'none',
  AUTO: 'auto',
  POINTER: 'pointer',
  DEFAULT_CURSOR: 'default',
  ZERO: '0',
  FONT_WEIGHT_MEDIUM: '500',
  FONT_WEIGHT_NORMAL: 'normal',
  FONT_WEIGHT_BOLD: 'bold',
  NOWRAP: 'nowrap',
  HIDDEN: 'hidden',
  ELLIPSIS: 'ellipsis',
} as const;

// ===== Animation and Transition Constants =====

/**
 * Animation timing constants
 */
export const AnimationTiming = {
  DEFAULT_TRANSITION: 'all 0.2s ease',
  FAST_TRANSITION: 'all 0.1s ease',
  SLOW_TRANSITION: 'all 0.3s ease',
} as const;

// ===== Default Primitive Configurations =====

/**
 * Complete default configuration for buttons
 */
export const DefaultButtonConfig = {
  dimensions: ButtonDimensions,
  spacing: ButtonSpacing,
  colors: ButtonColors,
  effects: ButtonEffects,
  animation: AnimationTiming,
} as const;

/**
 * Complete default configuration for legends
 */
export const DefaultLegendConfig = {
  dimensions: LegendDimensions,
  colors: LegendColors,
  formats: FormatDefaults,
  animation: AnimationTiming,
} as const;

/**
 * Complete default configuration for range switchers
 */
export const DefaultRangeSwitcherConfig = {
  layout: RangeSwitcherLayout,
  button: DefaultButtonConfig,
  timeRanges: TimeRangeSeconds,
  animation: AnimationTiming,
} as const;

/**
 * Base container configuration
 */
export const DefaultContainerConfig = {
  styling: ContainerDefaults,
  animation: AnimationTiming,
} as const;
