/**
 * @fileoverview Unified Series Descriptor - Core Type System
 *
 * Single source of truth for series configuration that:
 * - Leverages existing LightweightCharts types
 * - Serves series factory, property mapper, and dialog rendering
 * - Eliminates code duplication across the codebase
 */

import { ISeriesApi, LineStyle, LineWidth, SeriesOptionsMap } from 'lightweight-charts';

/**
 * Property types for dialog rendering
 */
export type PropertyType =
  | 'boolean'
  | 'number'
  | 'color'
  | 'line' // Nested line editor (color, lineWidth, lineStyle)
  | 'lineStyle' // LineStyle dropdown
  | 'lineWidth'; // LineWidth input

/**
 * Line configuration for nested line editor
 */
export interface LineConfig {
  color: string;
  lineWidth: LineWidth;
  lineStyle: LineStyle;
}

/**
 * Property descriptor defining how a property behaves
 */
export interface PropertyDescriptor {
  /** Property type for UI rendering */
  type: PropertyType;

  /** Display label in dialog */
  label: string;

  /** Default value */
  default: unknown;

  /** API property names when flattened (for 'line' type) */
  apiMapping?: {
    /** Color property name in API (e.g., 'color', 'lineColor', 'upperLineColor') */
    colorKey?: string;
    /** Width property name in API (e.g., 'lineWidth', 'upperLineWidth') */
    widthKey?: string;
    /** Style property name in API (e.g., 'lineStyle', 'upperLineStyle') */
    styleKey?: string;
  };

  /** Optional validation function */
  validate?: (value: unknown) => boolean;

  /** Optional property description for tooltips */
  description?: string;

  /** Group name for organizing properties in UI */
  group?: string;

  /** Hide this property from the dialog UI (but still include in API) */
  hidden?: boolean;
}

/**
 * Series creator function type
 */
export type SeriesCreator<T = unknown> = (
  chart: unknown,
  data: unknown[],
  options: Partial<T>,
  paneId?: number
) => ISeriesApi<keyof SeriesOptionsMap>;

/**
 * Unified Series Descriptor - Single source of truth for a series type
 * T represents the full series options (style + common options)
 */
export interface UnifiedSeriesDescriptor<T = unknown> {
  /** Series type identifier (e.g., 'Line', 'Area', 'Band') */
  type: string;

  /** Display name for UI */
  displayName: string;

  /** Property descriptors mapped by property name */
  properties: Record<string, PropertyDescriptor>;

  /** Default options using LightweightCharts types */
  defaultOptions: Partial<T>;

  /** Series creator function */
  create: SeriesCreator<T>;

  /** Whether this is a custom series (not built into LightweightCharts) */
  isCustom: boolean;

  /** Category for organizing series (e.g., 'Basic', 'Custom', 'Indicators') */
  category?: string;

  /** Optional series description */
  description?: string;
}

/**
 * Registry of all series descriptors
 */
export type SeriesDescriptorRegistry = Map<string, UnifiedSeriesDescriptor>;

/**
 * Helper to create property descriptors for common patterns
 */
export const PropertyDescriptors = {
  /**
   * Create a line property descriptor with proper API mapping
   */
  line(
    label: string,
    defaultColor: string,
    defaultWidth: LineWidth,
    defaultStyle: LineStyle,
    apiMapping: { colorKey: string; widthKey: string; styleKey: string }
  ): PropertyDescriptor {
    return {
      type: 'line',
      label,
      default: {
        color: defaultColor,
        lineWidth: defaultWidth,
        lineStyle: defaultStyle,
      },
      apiMapping,
    };
  },

  /**
   * Create a color property descriptor
   */
  color(label: string, defaultValue: string, group?: string): PropertyDescriptor {
    return {
      type: 'color',
      label,
      default: defaultValue,
      group,
    };
  },

  /**
   * Create a boolean property descriptor
   */
  boolean(label: string, defaultValue: boolean, group?: string): PropertyDescriptor {
    return {
      type: 'boolean',
      label,
      default: defaultValue,
      group,
    };
  },

  /**
   * Create a number property descriptor
   */
  number(
    label: string,
    defaultValue: number,
    group?: string,
    hidden?: boolean
  ): PropertyDescriptor {
    return {
      type: 'number',
      label,
      default: defaultValue,
      group,
      hidden,
    };
  },

  /**
   * Create a lineStyle property descriptor
   */
  lineStyle(label: string, defaultValue: LineStyle, group?: string): PropertyDescriptor {
    return {
      type: 'lineStyle',
      label,
      default: defaultValue,
      group,
    };
  },

  /**
   * Create a lineWidth property descriptor
   */
  lineWidth(label: string, defaultValue: LineWidth, group?: string): PropertyDescriptor {
    return {
      type: 'lineWidth',
      label,
      default: defaultValue,
      group,
    };
  },
};

/**
 * Standard series properties that should be included in all series descriptors.
 * These correspond to SeriesOptionsCommon from lightweight-charts and are sent
 * as top-level properties from Python (marked with @chainable_property top_level=True).
 *
 * Including these in descriptors ensures:
 * 1. Properties are passed through when updating via dialog
 * 2. They have proper defaults
 * 3. Documentation is consistent
 *
 * Properties marked with hidden: true are not shown in the UI but are still
 * processed during property mapping to ensure consistency between JSON and Dialog paths.
 */
export const STANDARD_SERIES_PROPERTIES: Record<string, PropertyDescriptor> = {
  // Common properties (hardcoded in SeriesSettingsDialog, hidden from SeriesSettingsRenderer)
  // These are rendered in the "Common Settings" section of the dialog
  visible: {
    ...PropertyDescriptors.boolean('Visible', true, 'General'),
    hidden: true, // Rendered in "Common Settings" section
  },
  lastValueVisible: {
    ...PropertyDescriptors.boolean('Show Last Value', true, 'General'),
    hidden: true, // Rendered in "Common Settings" section
  },
  priceLineVisible: {
    ...PropertyDescriptors.boolean('Show Price Line', true, 'General'),
    hidden: true, // Rendered in "Common Settings" section
  },
  title: {
    type: 'color', // Using color type as string input (will be improved in future)
    label: 'Title',
    default: undefined,
    group: 'General',
    description: 'Technical name shown on chart axis/legend',
    hidden: true, // Not shown in UI, only used internally
  },

  // Hidden properties (not shown in UI but passed through for consistency)
  // These ensure dialog updates don't lose properties set via JSON from Python
  zIndex: {
    type: 'number',
    label: 'Z-Index',
    default: 0,
    group: 'General',
    hidden: true,
    description: 'Rendering order (higher values render on top)',
  },
  priceLineSource: {
    type: 'number',
    label: 'Price Line Source',
    default: 0,
    group: 'General',
    hidden: true,
    description: 'Source for price line data',
  },
  priceLineWidth: {
    type: 'number',
    label: 'Price Line Width',
    default: 1,
    group: 'General',
    hidden: true,
    description: 'Width of the price line in pixels',
  },
  priceLineColor: {
    type: 'color',
    label: 'Price Line Color',
    default: '',
    group: 'General',
    hidden: true,
    description: 'Color of the price line',
  },
  priceLineStyle: {
    type: 'lineStyle',
    label: 'Price Line Style',
    default: 2, // LineStyle.Dashed
    group: 'General',
    hidden: true,
    description: 'Style of the price line',
  },
};

/**
 * Helper to extract default options from property descriptors
 */
export function extractDefaultOptions<T = unknown>(
  descriptor: UnifiedSeriesDescriptor<T>
): Partial<T> {
  const options: Record<string, unknown> = { ...descriptor.defaultOptions };

  for (const [propName, propDesc] of Object.entries(descriptor.properties)) {
    if (propDesc.type === 'line' && propDesc.apiMapping) {
      // Flatten line properties
      const lineDefault = propDesc.default as LineConfig;
      if (propDesc.apiMapping.colorKey) {
        options[propDesc.apiMapping.colorKey] = lineDefault.color;
      }
      if (propDesc.apiMapping.widthKey) {
        options[propDesc.apiMapping.widthKey] = lineDefault.lineWidth;
      }
      if (propDesc.apiMapping.styleKey) {
        options[propDesc.apiMapping.styleKey] = lineDefault.lineStyle;
      }
    } else if (propDesc.default !== undefined) {
      // Only add to options if default is not undefined
      options[propName] = propDesc.default;
    }
  }

  return options as Partial<T>;
}

/**
 * Helper to convert dialog config to API options using descriptor
 *
 * This function processes ALL properties including:
 * - Standard series properties (visible, title, zIndex, etc.) from STANDARD_SERIES_PROPERTIES
 * - Series-specific properties defined in each descriptor
 * - Hidden properties (marked with hidden: true) are still passed through
 *
 * This ensures consistency between:
 * 1. JSON path (Python → createSeriesWithConfig → series creation)
 * 2. Dialog path (UI changes → dialogConfigToApiOptions → series.applyOptions)
 */
export function dialogConfigToApiOptions<T = unknown>(
  descriptor: UnifiedSeriesDescriptor<T>,
  dialogConfig: Record<string, unknown>
): Partial<T> {
  const apiOptions: Record<string, unknown> = {};

  // Property-descriptor-driven mapping
  // This loop processes ALL properties in the descriptor, including:
  // - Standard properties from STANDARD_SERIES_PROPERTIES (visible, title, zIndex, etc.)
  // - Series-specific properties (upperLine, neutralColor, etc.)
  // - Hidden properties are processed but not shown in UI
  for (const [propName, propDesc] of Object.entries(descriptor.properties)) {
    if (dialogConfig[propName] === undefined) continue;

    if (propDesc.type === 'line' && propDesc.apiMapping) {
      // Flatten line config (nested → flat)
      const lineConfig = dialogConfig[propName] as Record<string, unknown>;
      if (lineConfig && typeof lineConfig === 'object') {
        if (lineConfig.color !== undefined && propDesc.apiMapping.colorKey) {
          apiOptions[propDesc.apiMapping.colorKey] = lineConfig.color;
        }
        if (lineConfig.lineWidth !== undefined && propDesc.apiMapping.widthKey) {
          apiOptions[propDesc.apiMapping.widthKey] = lineConfig.lineWidth;
        }
        if (lineConfig.lineStyle !== undefined && propDesc.apiMapping.styleKey) {
          apiOptions[propDesc.apiMapping.styleKey] = lineConfig.lineStyle;
        }
      }
    } else {
      // Direct copy for flat properties (including hidden ones)
      apiOptions[propName] = dialogConfig[propName];
    }
  }

  // DisplayName is special: NOT passed to TradingView API
  // It's only used for UI elements (dialog tabs, tooltips)
  // Title IS passed to the API and shown on chart axis/legend
  if (dialogConfig.displayName !== undefined) apiOptions.displayName = dialogConfig.displayName;

  return apiOptions as Partial<T>;
}

/**
 * Helper to convert API options to dialog config using descriptor
 */
export function apiOptionsToDialogConfig<T = unknown>(
  descriptor: UnifiedSeriesDescriptor<T>,
  apiOptions: Record<string, unknown>
): Record<string, unknown> {
  const dialogConfig: Record<string, unknown> = {};

  // Common properties (always flat)
  if (apiOptions.visible !== undefined) dialogConfig.visible = apiOptions.visible;
  if (apiOptions.lastValueVisible !== undefined)
    dialogConfig.lastValueVisible = apiOptions.lastValueVisible;
  if (apiOptions.priceLineVisible !== undefined)
    dialogConfig.priceLineVisible = apiOptions.priceLineVisible;

  // Title vs DisplayName:
  // - title: Technical name shown on chart axis/legend (e.g., "SMA(20)", "RSI(14)")
  // - displayName: User-friendly name shown in UI dialogs (e.g., "Moving Average", "Momentum")
  // Both are stored separately; getTabTitle() in SeriesSettingsDialog handles priority logic
  if (apiOptions.title !== undefined) dialogConfig.title = apiOptions.title;
  if (apiOptions.displayName !== undefined) dialogConfig.displayName = apiOptions.displayName;

  // Property-descriptor-driven mapping
  for (const [propName, propDesc] of Object.entries(descriptor.properties)) {
    if (propDesc.type === 'line' && propDesc.apiMapping) {
      // Python sends flattened line properties (e.g., uptrendLineColor, uptrendLineWidth, uptrendLineStyle)
      // Unflatten them into nested dialog config (e.g., uptrendLine: {color, lineWidth, lineStyle})
      const lineConfig: Record<string, unknown> = {};
      let hasValue = false;

      if (propDesc.apiMapping.colorKey && apiOptions[propDesc.apiMapping.colorKey] !== undefined) {
        lineConfig.color = apiOptions[propDesc.apiMapping.colorKey];
        hasValue = true;
      }
      if (propDesc.apiMapping.widthKey && apiOptions[propDesc.apiMapping.widthKey] !== undefined) {
        lineConfig.lineWidth = apiOptions[propDesc.apiMapping.widthKey];
        hasValue = true;
      }
      if (propDesc.apiMapping.styleKey && apiOptions[propDesc.apiMapping.styleKey] !== undefined) {
        lineConfig.lineStyle = apiOptions[propDesc.apiMapping.styleKey];
        hasValue = true;
      }

      if (hasValue) {
        dialogConfig[propName] = lineConfig;
      }
    } else if (apiOptions[propName] !== undefined) {
      // Direct copy for flat properties
      dialogConfig[propName] = apiOptions[propName];
    }
  }

  return dialogConfig;
}
