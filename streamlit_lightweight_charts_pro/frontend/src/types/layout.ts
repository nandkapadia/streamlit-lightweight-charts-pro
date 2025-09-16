/**
 * Layout and positioning types for the chart widget management system
 */

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface Dimensions {
  width: number
  height: number
}

export interface AxisDimensions {
  priceScale: {
    left: {
      width: number // Left Y-axis width
      height: number
    }
    right: {
      width: number // Right Y-axis width
      height: number
    }
  }
  timeScale: {
    width: number
    height: number // X-axis height (bottom)
  }
}

export interface ChartLayoutDimensions {
  container: Dimensions
  axis: AxisDimensions
}

export interface Position {
  top?: number
  right?: number
  bottom?: number
  left?: number
  zIndex: number
}

export interface WidgetDimensions {
  width: number
  height: number
}

export interface IPositionableWidget {
  id: string
  corner: Corner
  priority: number
  visible: boolean
  getDimensions(): WidgetDimensions
  updatePosition(position: Position): void
}

export interface LayoutConfig {
  edgePadding: number // Distance from chart edges
  widgetGap: number   // Gap between stacked widgets
  baseZIndex: number  // Starting z-index for widgets
}

export interface CornerLayoutState {
  widgets: IPositionableWidget[]
  totalHeight: number
  totalWidth: number
}

export interface LayoutManagerEvents {
  onLayoutChanged: (corner: Corner, widgets: IPositionableWidget[]) => void
  onOverflow: (corner: Corner, overflowingWidgets: IPositionableWidget[]) => void
}