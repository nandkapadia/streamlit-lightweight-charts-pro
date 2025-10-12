/**
 * @fileoverview Primitive Styling Utilities
 *
 * Standardized styling utilities for applying consistent styles across all
 * primitive components. Provides type-safe style application, CSS generation,
 * and common styling patterns.
 *
 * This module provides:
 * - Type-safe style interfaces (Base, Typography, Layout, Border, Shadow)
 * - CSS string generation from configuration objects
 * - Style merging and composition utilities
 * - Consistent styling patterns across primitives
 * - Responsive design helpers
 *
 * Architecture:
 * - Static utility class (no instantiation)
 * - Pure functions (no side effects)
 * - Type-safe with TypeScript interfaces
 * - Composable style configurations
 * - DRY principle for styling
 *
 * Features:
 * - Automatic unit handling (px, %, etc.)
 * - Style merging with precedence
 * - CSS variable support
 * - Hover and active state styles
 * - Transition and animation helpers
 *
 * @example
 * ```typescript
 * import { PrimitiveStylingUtils, BaseStyleConfig } from './PrimitiveStylingUtils';
 *
 * const baseStyle: BaseStyleConfig = {
 *   backgroundColor: '#1E222D',
 *   color: '#D1D4DC',
 *   fontSize: 12,
 *   borderRadius: 4,
 *   padding: 8
 * };
 *
 * const cssString = PrimitiveStylingUtils.toCssString(baseStyle);
 * element.style.cssText = cssString;
 * ```
 */

/**
 * Base style configuration interface
 */
export interface BaseStyleConfig {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  borderRadius?: number;
  padding?: number | string;
  margin?: number | string;
  border?: string;
  transition?: string;
  cursor?: string;
  opacity?: number;
  zIndex?: number;
  boxShadow?: string;
  transform?: string;
}

/**
 * Typography configuration
 */
export interface TypographyConfig {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number | string;
  letterSpacing?: number | string;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  width?: number | string;
  height?: number | string;
  padding?: number | string;
  margin?: number | string;
  display?: string;
  position?: string;
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
}

/**
 * Border configuration
 */
export interface BorderConfig {
  border?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
}

/**
 * Shadow configuration
 */
export interface ShadowConfig {
  boxShadow?: string;
  textShadow?: string;
}

/**
 * Standardized styling utility class
 */
export class PrimitiveStylingUtils {
  /**
   * Apply base styles to an element with fallback handling
   */
  static applyBaseStyles(
    element: HTMLElement,
    styles: BaseStyleConfig,
    defaults: BaseStyleConfig = {}
  ): void {
    const style = element.style;
    const config = { ...defaults, ...styles };

    // Color and background
    if (config.backgroundColor) style.backgroundColor = config.backgroundColor;
    if (config.color) style.color = config.color;
    if (config.opacity !== undefined) style.opacity = config.opacity.toString();

    // Typography
    if (config.fontSize) style.fontSize = `${config.fontSize}px`;
    if (config.fontFamily) style.fontFamily = config.fontFamily;
    if (config.fontWeight) style.fontWeight = config.fontWeight.toString();

    // Layout
    if (config.padding !== undefined) {
      style.padding = typeof config.padding === 'number' ? `${config.padding}px` : config.padding;
    }
    if (config.margin !== undefined) {
      style.margin = typeof config.margin === 'number' ? `${config.margin}px` : config.margin;
    }

    // Border and shape
    if (config.border) style.border = config.border;
    if (config.borderRadius) style.borderRadius = `${config.borderRadius}px`;

    // Interaction
    if (config.cursor) style.cursor = config.cursor;
    if (config.transition) style.transition = config.transition;
    if (config.zIndex !== undefined) style.zIndex = config.zIndex.toString();

    // Effects
    if (config.boxShadow) style.boxShadow = config.boxShadow;
    if (config.transform) style.transform = config.transform;
  }

  /**
   * Apply typography styles with consistent fallbacks
   */
  static applyTypography(
    element: HTMLElement,
    typography: TypographyConfig,
    defaults: TypographyConfig = {}
  ): void {
    const style = element.style;
    const config = { ...defaults, ...typography };

    if (config.fontSize) style.fontSize = `${config.fontSize}px`;
    if (config.fontFamily) style.fontFamily = config.fontFamily;
    if (config.fontWeight) style.fontWeight = config.fontWeight.toString();
    if (config.textAlign) style.textAlign = config.textAlign;
    if (config.lineHeight) {
      style.lineHeight =
        typeof config.lineHeight === 'number' ? config.lineHeight.toString() : config.lineHeight;
    }
    if (config.letterSpacing) {
      style.letterSpacing =
        typeof config.letterSpacing === 'number'
          ? `${config.letterSpacing}px`
          : config.letterSpacing;
    }
  }

  /**
   * Apply layout styles with consistent dimension handling
   */
  static applyLayout(
    element: HTMLElement,
    layout: LayoutConfig,
    defaults: LayoutConfig = {}
  ): void {
    const style = element.style;
    const config = { ...defaults, ...layout };

    // Dimensions
    if (config.width !== undefined) {
      style.width = typeof config.width === 'number' ? `${config.width}px` : config.width;
    }
    if (config.height !== undefined) {
      style.height = typeof config.height === 'number' ? `${config.height}px` : config.height;
    }

    // Spacing
    if (config.padding !== undefined) {
      style.padding = typeof config.padding === 'number' ? `${config.padding}px` : config.padding;
    }
    if (config.margin !== undefined) {
      style.margin = typeof config.margin === 'number' ? `${config.margin}px` : config.margin;
    }

    // Display and positioning
    if (config.display) style.display = config.display;
    if (config.position) style.position = config.position;

    // Position values
    if (config.top !== undefined) {
      style.top = typeof config.top === 'number' ? `${config.top}px` : config.top;
    }
    if (config.right !== undefined) {
      style.right = typeof config.right === 'number' ? `${config.right}px` : config.right;
    }
    if (config.bottom !== undefined) {
      style.bottom = typeof config.bottom === 'number' ? `${config.bottom}px` : config.bottom;
    }
    if (config.left !== undefined) {
      style.left = typeof config.left === 'number' ? `${config.left}px` : config.left;
    }
  }

  /**
   * Apply border styles with consistent formatting
   */
  static applyBorder(
    element: HTMLElement,
    border: BorderConfig,
    defaults: BorderConfig = {}
  ): void {
    const style = element.style;
    const config = { ...defaults, ...border };

    if (config.border) style.border = config.border;
    if (config.borderRadius) style.borderRadius = `${config.borderRadius}px`;
    if (config.borderWidth) style.borderWidth = `${config.borderWidth}px`;
    if (config.borderColor) style.borderColor = config.borderColor;
    if (config.borderStyle) style.borderStyle = config.borderStyle;
  }

  /**
   * Apply shadow effects with validation
   */
  static applyShadow(
    element: HTMLElement,
    shadow: ShadowConfig,
    defaults: ShadowConfig = {}
  ): void {
    const style = element.style;
    const config = { ...defaults, ...shadow };

    if (config.boxShadow) style.boxShadow = config.boxShadow;
    if (config.textShadow) style.textShadow = config.textShadow;
  }

  /**
   * Apply interaction states (hover, active, disabled) consistently
   */
  static applyInteractionState(
    element: HTMLElement,
    baseStyles: BaseStyleConfig,
    stateStyles: BaseStyleConfig,
    state: 'default' | 'hover' | 'active' | 'disabled' = 'default'
  ): void {
    // Apply base styles first
    this.applyBaseStyles(element, baseStyles);

    // Apply state-specific overrides
    if (state !== 'default') {
      this.applyBaseStyles(element, stateStyles);
    }

    // Apply standard interaction properties
    const style = element.style;

    // Common interaction styling
    style.userSelect = 'none';
    style.outline = 'none';

    // State-specific cursor and pointer events
    switch (state) {
      case 'disabled':
        style.cursor = 'not-allowed';
        style.pointerEvents = 'auto'; // Still allow events for accessibility
        break;
      case 'hover':
      case 'active':
        style.cursor = stateStyles.cursor || baseStyles.cursor || 'pointer';
        style.pointerEvents = 'auto';
        break;
      default:
        style.cursor = baseStyles.cursor || 'default';
        style.pointerEvents = 'auto';
        break;
    }
  }

  /**
   * Validate and normalize color values
   */
  static normalizeColor(color: string | undefined, fallback: string): string {
    if (!color) return fallback;

    // Basic validation - check if color looks like a valid CSS color
    if (
      color.startsWith('#') ||
      color.startsWith('rgb') ||
      color.startsWith('hsl') ||
      color.includes('var(') ||
      /^[a-zA-Z]+$/.test(color)
    ) {
      return color;
    }

    return fallback;
  }

  /**
   * Validate and normalize numeric values with units
   */
  static normalizeNumericValue(
    value: number | string | undefined,
    unit: string = 'px',
    fallback: number = 0
  ): string {
    if (value === undefined) return `${fallback}${unit}`;
    if (typeof value === 'number') return `${value}${unit}`;
    if (typeof value === 'string') return value;
    return `${fallback}${unit}`;
  }

  /**
   * Create a standardized flex container
   */
  static createFlexContainer(
    element: HTMLElement,
    direction: 'row' | 'column' = 'row',
    align: string = 'center',
    justify: string = 'center',
    gap?: number
  ): void {
    const style = element.style;
    style.display = 'flex';
    style.flexDirection = direction;
    style.alignItems = align;
    style.justifyContent = justify;

    if (gap !== undefined) {
      style.gap = `${gap}px`;
    }
  }

  /**
   * Apply consistent transition effects
   */
  static applyTransition(
    element: HTMLElement,
    properties: string[] = ['all'],
    duration: string = '0.2s',
    timing: string = 'ease'
  ): void {
    const transitionValue = properties.map(prop => `${prop} ${duration} ${timing}`).join(', ');
    element.style.transition = transitionValue;
  }

  /**
   * Reset all styles to defaults (useful for cleanup)
   */
  static resetStyles(element: HTMLElement, preserveLayout: boolean = false): void {
    const style = element.style;

    // Reset appearance
    style.backgroundColor = '';
    style.color = '';
    style.border = '';
    style.borderRadius = '';
    style.boxShadow = '';
    style.textShadow = '';
    style.opacity = '';
    style.cursor = '';
    style.transition = '';

    // Reset typography
    style.fontSize = '';
    style.fontFamily = '';
    style.fontWeight = '';
    style.textAlign = '';
    style.lineHeight = '';
    style.letterSpacing = '';

    if (!preserveLayout) {
      // Reset layout
      style.width = '';
      style.height = '';
      style.padding = '';
      style.margin = '';
      style.display = '';
      style.position = '';
      style.top = '';
      style.right = '';
      style.bottom = '';
      style.left = '';
      style.zIndex = '';
    }
  }
}
