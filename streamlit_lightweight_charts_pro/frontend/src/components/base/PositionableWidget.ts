import React from 'react'
import { IPositionableWidget, Corner, Position, WidgetDimensions } from '../../types/layout'
import { CornerLayoutManager } from '../../services/CornerLayoutManager'

/**
 * Base class for positionable widgets that integrates with CornerLayoutManager
 */
export abstract class PositionableWidget implements IPositionableWidget {
  public readonly id: string
  public readonly corner: Corner
  public readonly priority: number
  public visible: boolean = true

  protected currentPosition: Position | null = null
  protected layoutManager: CornerLayoutManager

  constructor(id: string, corner: Corner, priority: number, layoutManager: CornerLayoutManager) {
    this.id = id
    this.corner = corner
    this.priority = priority
    this.layoutManager = layoutManager
  }

  /**
   * Register this widget with the layout manager
   */
  public register(): void {
    this.layoutManager.registerWidget(this)

    // Use the same timing pattern as legacy implementation
    // Schedule additional registration attempts to handle timing issues
    setTimeout(() => {
      this.layoutManager.registerWidget(this)
    }, 100)

    setTimeout(() => {
      this.layoutManager.registerWidget(this)
    }, 300)
  }

  /**
   * Unregister this widget from the layout manager
   */
  public unregister(): void {
    this.layoutManager.unregisterWidget(this.id)
  }

  /**
   * Update widget visibility
   */
  public setVisible(visible: boolean): void {
    if (this.visible !== visible) {
      this.visible = visible
      this.layoutManager.updateWidgetVisibility(this.id, visible)
    }
  }

  /**
   * Get current calculated position
   */
  public getPosition(): Position | null {
    return this.currentPosition
  }

  /**
   * Called by layout manager to update position
   */
  public updatePosition(position: Position): void {
    this.currentPosition = position
    this.onPositionUpdate(position)
  }

  /**
   * Convert position to React CSS properties
   */
  protected positionToCSS(position: Position): React.CSSProperties {
    const style: React.CSSProperties = {
      position: 'absolute',
      zIndex: position.zIndex
    }

    if (position.top !== undefined) style.top = `${position.top}px`
    if (position.right !== undefined) style.right = `${position.right}px`
    if (position.bottom !== undefined) style.bottom = `${position.bottom}px`
    if (position.left !== undefined) style.left = `${position.left}px`

    return style
  }

  // Abstract methods to be implemented by subclasses

  /**
   * Get the current dimensions of this widget
   */
  public abstract getDimensions(): WidgetDimensions

  /**
   * Called when position is updated by layout manager
   */
  protected abstract onPositionUpdate(position: Position): void
}

/**
 * Hook for React components to use positionable widgets
 */
export function usePositionableWidget<T extends PositionableWidget>(
  widgetFactory: () => T,
  dependencies: React.DependencyList = []
): T {
  const widget = React.useMemo(widgetFactory, dependencies)

  React.useEffect(() => {
    widget.register()
    return () => widget.unregister()
  }, [widget])

  return widget
}

/**
 * Default priority levels for common widgets
 */
export const WidgetPriority = {
  RANGE_SWITCHER: 1,     // Highest priority - navigation aid
  MINIMIZE_BUTTON: 2,    // High priority - always visible after range switcher
  LEGEND: 3,             // Medium priority - important for data understanding
  CUSTOM: 10,            // Default for custom widgets
  DEBUG: 999             // Lowest priority - debug/development widgets
} as const

/**
 * Widget type identifiers
 */
export const WidgetType = {
  MINIMIZE_BUTTON: 'minimize-button',
  LEGEND: 'legend',
  RANGE_SWITCHER: 'range-switcher',
  CUSTOM: 'custom'
} as const