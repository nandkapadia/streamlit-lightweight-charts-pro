/**
 * @fileoverview Legend Primitive
 *
 * Dynamic legend primitive for displaying series values with crosshair tracking.
 * Provides template-based legends with automatic value updates and rich styling.
 *
 * This primitive is responsible for:
 * - Rendering legends with template placeholders
 * - Tracking crosshair position for value updates
 * - Supporting both chart-level and pane-specific legends
 * - Automatic value formatting with precision
 * - Corner positioning with automatic stacking
 * - React portal rendering for DOM management
 *
 * Architecture:
 * - Extends BasePanePrimitive for core functionality
 * - Uses TemplateEngine for placeholder replacement
 * - Integrates with CornerLayoutManager for positioning
 * - React portal for efficient DOM updates
 * - Event-driven crosshair tracking
 *
 * Template Placeholders:
 * - $$title$$, $$value$$, $$open$$, $$high$$, $$low$$, $$close$$
 * - $$volume$$, $$time$$
 * - $$upper$$, $$middle$$, $$lower$$ (for bands)
 * - Custom placeholders from customData
 *
 * @example
 * ```typescript
 * const legend = new LegendPrimitive('legend-1', {
 *   corner: 'top-left',
 *   text: '<div>$$title$$: $$close$$ ($$time$$)</div>',
 *   isPanePrimitive: false
 * });
 *
 * pane.attachPrimitive(legend);
 * ```
 */

import { BasePanePrimitive, BasePrimitiveConfig, PrimitivePriority } from './BasePanePrimitive';
import {
  LegendColors,
  LegendDimensions,
  FormatDefaults,
  ContainerDefaults,
  CommonValues,
} from './PrimitiveDefaults';
import {
  PrimitiveStylingUtils,
  BaseStyleConfig,
  TypographyConfig,
  BorderConfig,
} from './PrimitiveStylingUtils';

/**
 * Configuration for LegendPrimitive
 */
export interface LegendPrimitiveConfig extends BasePrimitiveConfig {
  /**
   * Legend text template (supports placeholders like $$value$$, $$open$$, etc.)
   */
  text: string;

  /**
   * Value formatting configuration
   */
  valueFormat?: string;

  /**
   * Whether this is a pane-specific primitive (vs chart-level)
   */
  isPanePrimitive?: boolean;

  /**
   * Pane ID for pane-specific legends
   */
  paneId?: number;

  /**
   * Legend styling
   */
  style?: BasePrimitiveConfig['style'] & {
    /**
     * Text alignment
     */
    textAlign?: 'left' | 'center' | 'right';

    /**
     * Font weight
     */
    fontWeight?: 'normal' | 'bold' | 'lighter' | number;

    /**
     * Text shadow
     */
    textShadow?: string;

    /**
     * Background opacity
     */
    backgroundOpacity?: number;

    /**
     * Border configuration
     */
    border?: {
      width?: number;
      color?: string;
      style?: 'solid' | 'dashed' | 'dotted';
    };
  };
}

/**
 * LegendPrimitive - A lightweight-charts pane primitive for displaying legends
 *
 * This primitive provides:
 * - Smart template processing with $$value$$, $$open$$, $$close$$, etc. placeholders
 * - Automatic crosshair value updates
 * - Corner-based positioning with layout management
 * - Pane-specific or chart-level positioning
 * - Configurable styling and formatting
 *
 * Example usage:
 * ```typescript
 * const legend = new LegendPrimitive('my-legend', {
 *   corner: 'top-left',
 *   priority: PrimitivePriority.LEGEND,
 *   text: 'Price: $$value$$',
 *   valueFormat: '.2f',
 *   style: {
 *     backgroundColor: 'rgba(0, 0, 0, 0.8)',
 *     color: 'white',
 *     padding: 8
 *   }
 * })
 *
 * // Add to pane
 * pane.attachPrimitive(legend)
 * ```
 */
export class LegendPrimitive extends BasePanePrimitive<LegendPrimitiveConfig> {
  constructor(id: string, config: LegendPrimitiveConfig) {
    // Set default priority for legends
    const configWithDefaults: LegendPrimitiveConfig = {
      ...config,
      priority: config.priority ?? PrimitivePriority.LEGEND,
      visible: config.visible ?? true,
      isPanePrimitive: config.isPanePrimitive ?? true,
      paneId: config.paneId !== undefined ? config.paneId : 0, // Use provided paneId or default to 0
      valueFormat: config.valueFormat ?? FormatDefaults.VALUE_FORMAT,
      style: {
        backgroundColor: LegendColors.DEFAULT_BACKGROUND,
        color: LegendColors.DEFAULT_COLOR,
        fontSize: LegendDimensions.FONT_SIZE,
        fontFamily: ContainerDefaults.FONT_FAMILY,
        padding: LegendDimensions.DEFAULT_PADDING,
        borderRadius: LegendDimensions.BORDER_RADIUS,
        textAlign: ContainerDefaults.TEXT_ALIGN,
        fontWeight: ContainerDefaults.FONT_WEIGHT,
        backgroundOpacity: LegendColors.DEFAULT_OPACITY,
        ...config.style,
      },
    };

    super(id, configWithDefaults);
  }

  // ===== BasePanePrimitive Implementation =====

  /**
   * Get the template string for this legend
   */
  protected getTemplate(): string {
    return this.config.text || '$$value$$';
  }

  /**
   * Render the legend content to the container
   */
  protected renderContent(): void {
    if (!this.containerElement) return;

    const content = this.getProcessedContent();

    // Create or update legend element
    let legendElement = this.containerElement.querySelector('.legend-content') as HTMLElement;
    if (!legendElement) {
      legendElement = document.createElement('div');
      legendElement.className = 'legend-content';
      legendElement.setAttribute('role', 'img');
      legendElement.setAttribute('aria-label', 'Chart legend');
      this.containerElement.appendChild(legendElement);
    }

    // Update content (use innerHTML to allow HTML markup)
    legendElement.innerHTML = content;

    // Apply styling
    this.applyLegendStyling(legendElement);
  }

  /**
   * Apply legend-specific styling using standardized utilities
   */
  private applyLegendStyling(element: HTMLElement): void {
    const config = this.config.style;

    if (config) {
      // Prepare typography styles
      const typography: TypographyConfig = {
        textAlign: config.textAlign,
        fontWeight: config.fontWeight,
      };

      // Prepare border styles if configured
      const borderStyles: BorderConfig = {};
      if (config.border) {
        borderStyles.borderWidth = config.border.width;
        borderStyles.borderColor = config.border.color;
        borderStyles.borderStyle = config.border.style;
      }

      // Prepare base styles with background and color
      const baseStyles: BaseStyleConfig = {
        cursor: CommonValues.DEFAULT_CURSOR,
      };

      // Handle background with opacity
      if (config.backgroundColor) {
        if (config.backgroundOpacity !== undefined) {
          baseStyles.backgroundColor = this.adjustColorOpacity(
            config.backgroundColor,
            config.backgroundOpacity
          );
        } else {
          baseStyles.backgroundColor = config.backgroundColor;
        }
      }

      // Handle text color
      if (config.color) {
        baseStyles.color = config.color;
      }

      // Apply text shadow if specified
      if (config.textShadow) {
        baseStyles.boxShadow = config.textShadow; // Note: textShadow will be handled by PrimitiveStylingUtils
      }

      // Apply standardized styling
      PrimitiveStylingUtils.applyTypography(element, typography);
      PrimitiveStylingUtils.applyBorder(element, borderStyles);
      PrimitiveStylingUtils.applyBaseStyles(element, baseStyles);

      // Force background and text color with !important to override any external styles
      if (baseStyles.backgroundColor) {
        element.style.setProperty('background-color', baseStyles.backgroundColor, 'important');
      }
      if (baseStyles.color) {
        element.style.setProperty('color', baseStyles.color, 'important');
      }

      // Remove padding since inner content (span) handles its own padding
      element.style.setProperty('padding', '0', 'important');
      // Explicitly remove any margins since spacing is handled by layout manager
      element.style.setProperty('margin', '0', 'important');

      // Apply legend-specific layout constraints
      const style = element.style;
      style.userSelect = CommonValues.NONE;
      style.pointerEvents = CommonValues.NONE;
      style.whiteSpace = CommonValues.NOWRAP;
      style.overflow = CommonValues.HIDDEN;
      style.textOverflow = CommonValues.ELLIPSIS;
      style.maxWidth = `${LegendDimensions.MAX_WIDTH}px`;

      // Ensure no browser defaults add extra spacing
      style.lineHeight = '1';
      style.boxSizing = 'border-box';

      // Apply text shadow directly since it's not handled by baseStyles
      if (config.textShadow) {
        style.textShadow = config.textShadow;
      }
    }
  }

  /**
   * Adjust color opacity
   */
  private adjustColorOpacity(color: string, opacity: number): string {
    // Simple rgba conversion for common color formats
    if (color.startsWith('rgba(')) {
      return color.replace(/rgba\(([^)]+)\)/, (match, values) => {
        const parts = values.split(',').map((s: string) => s.trim());
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${opacity})`;
      });
    } else if (color.startsWith('rgb(')) {
      return color.replace(/rgb\(([^)]+)\)/, (match, values) => {
        return `rgba(${values}, ${opacity})`;
      });
    } else if (color.startsWith('#')) {
      // Convert hex to rgba
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Fallback: return original color
    return color;
  }

  /**
   * Get CSS class name for the container
   */
  protected getContainerClassName(): string {
    return 'legend-primitive';
  }

  /**
   * Override pane ID for pane-specific legends
   */
  protected getPaneId(): number {
    if (this.config.isPanePrimitive && this.config.paneId !== undefined) {
      return this.config.paneId;
    }
    return 0; // Default to chart-level
  }

  // ===== Lifecycle Hooks =====

  /**
   * Setup custom event subscriptions for legend updates
   */
  protected setupCustomEventSubscriptions(): void {
    if (!this.eventManager) return;

    // Subscribe to crosshair moves for real-time value updates
    const crosshairSub = this.eventManager.subscribe('crosshairMove', event => {
      this.updateLegendFromCrosshair(event);
    });
    this.eventSubscriptions.push(crosshairSub);
  }

  /**
   * Handle crosshair move for legend value updates
   */
  protected onCrosshairMove(event: {
    time: any;
    point: { x: number; y: number } | null;
    seriesData: Map<any, any>;
  }): void {
    this.updateLegendFromCrosshair(event);
  }

  /**
   * Update legend content from crosshair data
   */
  private updateLegendFromCrosshair(event: {
    time: any;
    point: { x: number; y: number } | null;
    seriesData: Map<any, any>;
  }): void {
    if (!event.time || !this.series || event.seriesData.size === 0) {
      // Clear legend when no crosshair data
      this.updateTemplateContext({
        seriesData: undefined,
        formatting: {
          valueFormat: this.config.valueFormat || FormatDefaults.VALUE_FORMAT,
        },
      });
      return;
    }

    // Get series data for this legend's series
    const seriesValue = event.seriesData.get(this.series);
    if (seriesValue) {
      this.updateTemplateContext({
        seriesData: seriesValue,
        formatting: {
          valueFormat: this.config.valueFormat || FormatDefaults.VALUE_FORMAT,
          timeFormat: FormatDefaults.TIME_FORMAT,
        },
      });
    }
  }

  /**
   * Called when container is created
   */
  protected onContainerCreated(_container: HTMLElement): void {
    // Container is ready for use
  }

  // ===== Public API =====

  /**
   * Update legend text template
   */
  public updateText(text: string): void {
    this.updateConfig({ text });
  }

  /**
   * Update value format
   */
  public updateValueFormat(format: string): void {
    this.updateConfig({ valueFormat: format });
  }

  /**
   * Get current legend content
   */
  public getCurrentContent(): string {
    return this.getProcessedContent();
  }

  /**
   * Force update legend content
   */
  public forceUpdate(): void {
    if (this.mounted) {
      this.processTemplate();
      this.renderContent();
    }
  }
}

/**
 * Factory function to create legend primitives
 */
export function createLegendPrimitive(
  id: string,
  config: Partial<LegendPrimitiveConfig> & { text: string; corner: any }
): LegendPrimitive {
  return new LegendPrimitive(id, config as LegendPrimitiveConfig);
}

/**
 * Default legend configurations
 */
export const DefaultLegendConfigs = {
  /**
   * Simple value legend
   */
  simple: {
    text: '$$value$$',
    valueFormat: FormatDefaults.VALUE_FORMAT,
    style: {
      backgroundColor: LegendColors.DEFAULT_BACKGROUND,
      color: LegendColors.DEFAULT_COLOR,
      padding: LegendDimensions.DEFAULT_PADDING,
      borderRadius: LegendDimensions.BORDER_RADIUS,
    },
  },

  /**
   * OHLC candlestick legend
   */
  ohlc: {
    text: 'O: $$open$$ H: $$high$$ L: $$low$$ C: $$close$$',
    valueFormat: FormatDefaults.VALUE_FORMAT,
    style: {
      backgroundColor: LegendColors.DEFAULT_BACKGROUND,
      color: LegendColors.DEFAULT_COLOR,
      padding: LegendDimensions.OHLC_PADDING,
      borderRadius: LegendDimensions.BORDER_RADIUS,
      fontSize: LegendDimensions.OHLC_FONT_SIZE,
    },
  },

  /**
   * Volume legend
   */
  volume: {
    text: 'Vol: $$volume$$',
    valueFormat: FormatDefaults.VOLUME_FORMAT,
    style: {
      backgroundColor: LegendColors.VOLUME_BACKGROUND,
      color: LegendColors.DEFAULT_COLOR,
      padding: LegendDimensions.DEFAULT_PADDING,
      borderRadius: LegendDimensions.BORDER_RADIUS,
    },
  },

  /**
   * Band/ribbon legend
   */
  band: {
    text: 'U: $$upper$$ M: $$middle$$ L: $$lower$$',
    valueFormat: FormatDefaults.BAND_FORMAT,
    style: {
      backgroundColor: LegendColors.BAND_BACKGROUND,
      color: LegendColors.DEFAULT_COLOR,
      padding: LegendDimensions.BAND_PADDING,
      borderRadius: LegendDimensions.BORDER_RADIUS,
      fontSize: LegendDimensions.BAND_FONT_SIZE,
    },
  },
} as const;
