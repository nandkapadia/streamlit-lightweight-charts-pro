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
    } else {
      options[propName] = propDesc.default;
    }
  }

  return options as Partial<T>;
}

/**
 * Helper to convert dialog config to API options using descriptor
 */
export function dialogConfigToApiOptions<T = unknown>(
  descriptor: UnifiedSeriesDescriptor<T>,
  dialogConfig: Record<string, unknown>
): Partial<T> {
  const apiOptions: Record<string, unknown> = {};

  // Common properties (always flat)
  if (dialogConfig.visible !== undefined) apiOptions.visible = dialogConfig.visible;
  if (dialogConfig.lastValueVisible !== undefined)
    apiOptions.lastValueVisible = dialogConfig.lastValueVisible;
  if (dialogConfig.priceLineVisible !== undefined)
    apiOptions.priceLineVisible = dialogConfig.priceLineVisible;

  // Title vs DisplayName:
  // - title: Passed to TradingView API, displayed on chart axis/legend
  // - displayName: NOT passed to TradingView API, only used for UI elements (dialog tabs, tooltips)
  // Both are stored in dialogConfig, but only title goes to the chart API
  if (dialogConfig.title !== undefined) apiOptions.title = dialogConfig.title;
  if (dialogConfig.displayName !== undefined) apiOptions.displayName = dialogConfig.displayName;

  // Property-descriptor-driven mapping
  for (const [propName, propDesc] of Object.entries(descriptor.properties)) {
    if (dialogConfig[propName] === undefined) continue;

    if (propDesc.type === 'line' && propDesc.apiMapping) {
      // Flatten line config
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
      // Direct copy for flat properties
      apiOptions[propName] = dialogConfig[propName];
    }
  }

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
      // Unflatten line properties
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
