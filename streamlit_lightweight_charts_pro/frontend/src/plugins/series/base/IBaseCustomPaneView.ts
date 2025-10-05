/**
 * @fileoverview Base interface for custom series pane views
 *
 * Provides a standardized interface extending ICustomSeriesPaneView with
 * a readonly type property for series identification and type safety.
 */

import { Time, CustomData, ICustomSeriesPaneView, CustomSeriesOptions } from 'lightweight-charts';

// ============================================================================
// Base Custom Series Interface
// ============================================================================

/**
 * Base interface extending ICustomSeriesPaneView with a readonly type property
 *
 * This interface provides a standardized way to identify custom series types
 * while maintaining compatibility with the existing ICustomSeriesPaneView interface.
 *
 * @template HorzScaleItem - The horizontal scale item type (usually Time)
 * @template TData - The data type for this series (extends CustomData)
 * @template TOptions - The options type for this series (extends CustomSeriesOptions)
 */
export interface IBaseCustomPaneView<
  HorzScaleItem = Time,
  TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>,
  TOptions extends CustomSeriesOptions = CustomSeriesOptions,
> extends ICustomSeriesPaneView<HorzScaleItem, TData, TOptions> {
  /**
   * Readonly property identifying the type of custom series
   * This should be set to a unique string identifier for each series type
   *
   * @example
   * ```typescript
   * class MyCustomSeries implements IBaseCustomPaneView {
   *   readonly type = 'my-custom-series';
   *   // ... other implementation
   * }
   * ```
   */
  readonly type: string;
}
