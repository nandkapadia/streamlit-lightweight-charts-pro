/**
 * @fileoverview Layout and Positioning Types
 *
 * Type definitions for the chart widget management system.
 * Provides interfaces for positioning, dimensions, and layout management.
 *
 * This module provides:
 * - Corner positioning types
 * - Dimension interfaces
 * - Widget positioning interfaces
 * - Layout configuration types
 *
 * Features:
 * - Flexible corner-based positioning
 * - Axis-aware dimension tracking
 * - Widget stacking and priority
 * - Layout event handling
 *
 * @example
 * ```typescript
 * import { Corner, Position, IPositionableWidget } from './layout';
 *
 * const corner: Corner = 'top-right';
 * const position: Position = {
 *   top: 10,
 *   right: 10,
 *   zIndex: 100
 * };
 * ```
 */

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface Dimensions {
  width: number;
  height: number;
}

export interface AxisDimensions {
  priceScale: {
    left: {
      width: number; // Left Y-axis width
      height: number;
    };
    right: {
      width: number; // Right Y-axis width
      height: number;
    };
  };
  timeScale: {
    width: number;
    height: number; // X-axis height (bottom)
  };
}

export interface ChartLayoutDimensions {
  container: Dimensions;
  axis: AxisDimensions;
}

export interface Position {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex: number;
}

export interface WidgetDimensions {
  width: number;
  height: number;
}

export interface IPositionableWidget {
  id: string;
  corner: Corner;
  priority: number;
  visible: boolean;
  getDimensions(): WidgetDimensions;
  updatePosition(_position: Position): void;
}

export interface LayoutConfig {
  edgePadding: number; // Distance from chart edges
  widgetGap: number; // Gap between stacked widgets
  baseZIndex: number; // Starting z-index for widgets
}

export interface CornerLayoutState {
  widgets: IPositionableWidget[];
  totalHeight: number;
  totalWidth: number;
}

export interface LayoutManagerEvents {
  onLayoutChanged: (_corner: Corner, _widgets: IPositionableWidget[]) => void;
  onOverflow: (_corner: Corner, _overflowingWidgets: IPositionableWidget[]) => void;
}
