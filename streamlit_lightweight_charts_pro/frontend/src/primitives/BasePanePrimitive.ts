/**
 * @fileoverview Base Pane Primitive
 *
 * Abstract base class for all pane primitives (legends, range switchers, buttons).
 * Provides comprehensive foundation including layout management, event handling,
 * template processing, and React integration.
 *
 * This base class provides:
 * - **Layout Management**: Automatic corner positioning and stacking
 * - **Event System**: Integration with PrimitiveEventManager
 * - **Template Processing**: Built-in TemplateEngine access
 * - **Coordinate Service**: Centralized coordinate calculations
 * - **React Integration**: Support for React portal rendering
 * - **Lifecycle Management**: Proper attach/detach with cleanup
 *
 * Architecture:
 * - Abstract class (must be extended)
 * - Implements IPanePrimitive and IPositionableWidget
 * - Lazy service initialization (avoids loading order issues)
 * - Template method pattern for customization
 * - Comprehensive cleanup to prevent memory leaks
 *
 * DRY Principles:
 * - Single source of truth for primitive behavior
 * - Shared layout management across all primitives
 * - Unified event handling
 * - Consistent template processing
 *
 * @example
 * ```typescript
 * class MyPrimitive extends BasePanePrimitive {
 *   protected createPrimitiveElement(): HTMLElement {
 *     const el = document.createElement('div');
 *     el.textContent = 'My Primitive';
 *     return el;
 *   }
 *
 *   updateView(): void {
 *     // Custom update logic
 *   }
 * }
 * ```
 */

import { IChartApi, ISeriesApi, IPanePrimitive, Time } from 'lightweight-charts';
import { CornerLayoutManager } from '../services/CornerLayoutManager';
import { ChartCoordinateService } from '../services/ChartCoordinateService';
import { TemplateEngine, TemplateResult } from '../services/TemplateEngine';
import { TemplateContext } from '../types/ChartInterfaces';
import { PrimitiveEventManager, EventSubscription } from '../services/PrimitiveEventManager';
import { Corner, Position, IPositionableWidget, WidgetDimensions } from '../types/layout';
import { createSingleton } from '../utils/SingletonBase';

/**
 * Base configuration for all pane primitives
 */
export interface BasePrimitiveConfig {
  /**
   * Position in chart corner
   */
  corner?: Corner;

  /**
   * Priority for stacking order (lower = higher priority)
   */
  priority?: number;

  /**
   * Whether the primitive is visible
   */
  visible?: boolean;

  /**
   * Styling configuration
   */
  style?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    borderRadius?: number;
    padding?: number;
    margin?: number;
    zIndex?: number;
  };
}

/**
 * Interface for template data used in primitives
 */
export interface TemplateData {
  [key: string]: any;
}

/**
 * Abstract base class for all pane primitives
 *
 * This class provides:
 * - Layout Management System - built-in positioning and stacking
 * - React Integration Layer - hybrid primitives that can render React components
 * - Event System Integration - built-in event handling
 * - Template processing system for dynamic content
 *
 * Following DRY principles with single source of truth architecture
 */
export abstract class BasePanePrimitive<TConfig extends BasePrimitiveConfig = BasePrimitiveConfig>
  implements IPanePrimitive<Time>, IPositionableWidget
{
  // IPanePrimitive implementation
  public readonly id: string;

  // IPositionableWidget implementation
  public readonly corner: Corner;
  public readonly priority: number;
  public visible: boolean = true;

  // Core services
  protected config: TConfig;
  protected chart: IChartApi | null = null;
  protected series: ISeriesApi<any> | null = null;
  protected requestUpdate: (() => void) | null = null;
  protected layoutManager: CornerLayoutManager | null = null;
  private _coordinateService: ChartCoordinateService | null = null;
  private _templateEngine: TemplateEngine | null = null;
  protected eventManager: PrimitiveEventManager | null = null;

  /**
   * Lazy getter for coordinate service - avoids module loading order issues
   */
  protected get coordinateService(): ChartCoordinateService {
    if (!this._coordinateService) {
      this._coordinateService = createSingleton(ChartCoordinateService);
    }
    if (!this._coordinateService) {
      throw new Error('Failed to initialize ChartCoordinateService');
    }
    return this._coordinateService;
  }

  /**
   * Lazy getter for template engine - avoids module loading order issues
   */
  protected get templateEngine(): TemplateEngine {
    if (!this._templateEngine) {
      this._templateEngine = createSingleton(TemplateEngine);
    }
    if (!this._templateEngine) {
      throw new Error('Failed to initialize TemplateEngine');
    }
    return this._templateEngine;
  }

  // Layout state
  protected currentPosition: Position | null = null;
  protected containerElement: HTMLElement | null = null;
  protected mounted: boolean = false;

  // Event handling
  protected eventSubscriptions: EventSubscription[] = [];

  // Template processing
  protected templateData: TemplateData = {};
  protected templateContext: TemplateContext = {};
  protected lastTemplateResult: TemplateResult | null = null;

  constructor(id: string, config: TConfig) {
    this.id = id;
    this.config = { ...config };
    this.corner = config.corner ?? 'top-left';
    this.priority = config.priority ?? 50;
    this.visible = config.visible !== false;
    // Services are now lazy-loaded via getters to avoid module loading order issues
  }

  // ===== IPanePrimitive Interface =====

  /**
   * Called when primitive is attached to a pane
   */
  public attached(params: {
    chart: IChartApi;
    series: ISeriesApi<any>;
    requestUpdate: () => void;
  }): void {
    this.chart = params.chart;
    this.series = params.series;
    this.requestUpdate = params.requestUpdate;

    // Initialize layout management
    this.initializeLayoutManagement();

    // Initialize event management
    this.initializeEventManagement();

    // Setup default event subscriptions
    this.setupDefaultEventSubscriptions();

    // Call lifecycle hook
    this.onAttached(params);

    // Mark as mounted
    this.mounted = true;

    // Register with layout manager for positioning
    if (this.layoutManager) {
      this.layoutManager.registerWidget(this);
    }

    // Trigger initial render
    this.updateAllViews();
  }

  /**
   * Called when primitive is detached from a pane
   */
  public detached(): void {
    // Unregister from layout manager
    if (this.layoutManager) {
      this.layoutManager.unregisterWidget(this.id);
    }

    // Cleanup event subscriptions
    this.cleanupEventSubscriptions();

    // Cleanup container
    this.destroyContainer();

    // Call lifecycle hook
    this.onDetached();

    // Clear references
    this.chart = null;
    this.series = null;
    this.layoutManager = null;
    this.eventManager = null;
    this.mounted = false;
  }

  private lastPaneCoords: { x: number; y: number; width: number; height: number } | null = null;

  /**
   * IPanePrimitive interface - integrates with chart's rendering pipeline
   *
   * The draw() method is called automatically by the chart on every render cycle,
   * allowing smooth position updates without manual DOM manipulation.
   */
  public paneViews(): any[] {
    return [
      {
        renderer: () => ({
          draw: () => {
            if (!this.chart || !this.mounted) return;

            const paneId = this.getPaneId();
            const newCoords = this.coordinateService.getPaneCoordinates(this.chart, paneId);

            if (!newCoords) return;

            if (this.hasCoordinatesChanged(newCoords)) {
              this.lastPaneCoords = {
                x: newCoords.x,
                y: newCoords.y,
                width: newCoords.width,
                height: newCoords.height,
              };

              if (this.layoutManager) {
                this.layoutManager.updateChartDimensionsFromElement();
              }
            }
          },
        }),
      },
    ];
  }

  /**
   * Check if pane coordinates changed (ignoring sub-pixel jitter)
   */
  private hasCoordinatesChanged(newCoords: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): boolean {
    if (!this.lastPaneCoords) return true;

    return (
      Math.abs(this.lastPaneCoords.x - newCoords.x) > 1 ||
      Math.abs(this.lastPaneCoords.y - newCoords.y) > 1 ||
      Math.abs(this.lastPaneCoords.width - newCoords.width) > 1 ||
      Math.abs(this.lastPaneCoords.height - newCoords.height) > 1
    );
  }

  /**
   * Main primitive update method - handles rendering
   */
  public updateAllViews(): void {
    if (!this.mounted || !this.visible) {
      return;
    }

    // Process template data
    this.processTemplate();

    // Ensure container exists
    this.ensureContainer();

    // Update content
    this.renderContent();

    // Call lifecycle hook
    this.onUpdate();
  }

  // ===== IPositionableWidget Interface =====

  /**
   * Get current dimensions of the primitive's container
   */
  public getDimensions(): WidgetDimensions {
    if (!this.containerElement) {
      return { width: 0, height: 0 };
    }

    // Get actual dimensions
    let width = this.containerElement.offsetWidth || 0;
    let height = this.containerElement.offsetHeight || 0;

    // Fallback for cases where element hasn't been rendered yet
    if ((width === 0 || height === 0) && this.containerElement) {
      // Force measurement by temporarily making element visible
      const originalDisplay = this.containerElement.style.display;
      const originalVisibility = this.containerElement.style.visibility;
      const originalPosition = this.containerElement.style.position;

      this.containerElement.style.display = 'block';
      this.containerElement.style.visibility = 'hidden';
      this.containerElement.style.position = 'absolute';

      width = this.containerElement.offsetWidth || width;
      height = this.containerElement.offsetHeight || height;

      // Restore original styles
      this.containerElement.style.display = originalDisplay;
      this.containerElement.style.visibility = originalVisibility;
      this.containerElement.style.position = originalPosition;

      // If still zero, provide reasonable defaults based on content
      if (width === 0) {
        const textLength = this.containerElement.textContent?.length || 50;
        width = Math.max(100, textLength * 8); // Approximate character width
      }
      if (height === 0) {
        height = 24; // Default height for one line of text with padding
      }
    }

    return { width, height };
  }

  /**
   * Called by layout manager to update position
   * Now properly integrates with lightweight-charts coordinate updates
   */
  public updatePosition(position: Position): void {
    this.currentPosition = position;

    if (this.containerElement) {
      // Apply position immediately for instant response
      this.applyPositionToContainer(position);
    }

    // Call lifecycle hook
    this.onPositionUpdate(position);
  }

  // ===== Layout Management System =====

  /**
   * Initialize layout management integration
   */
  private initializeLayoutManagement(): void {
    if (!this.chart) return;

    // Get chart-level layout manager (for chart-level widgets like range switcher)
    // or pane-specific layout manager (for pane-level widgets like legends)
    const paneId = this.getPaneId();
    const chartId = this.getChartId();

    this.layoutManager = CornerLayoutManager.getInstance(chartId, paneId);
    this.layoutManager.setChartApi(this.chart);

    // Setup coordinate service integration
    this.coordinateService.setupLayoutManagerIntegration(this.chart, this.layoutManager);
  }

  /**
   * Get the pane ID for this primitive
   * Defaults to 0 (main pane) - can be overridden by subclasses if needed
   */
  protected getPaneId(): number {
    return 0;
  }

  /**
   * Get the chart ID for this primitive
   */
  protected getChartId(): string {
    return this.chart?.chartElement()?.id || 'default';
  }

  // ===== Container Management =====

  /**
   * Ensure container element exists
   */
  private ensureContainer(): void {
    if (this.containerElement) {
      return;
    }

    if (!this.chart) {
      return;
    }

    const chartElement = this.chart.chartElement();
    if (!chartElement) {
      return;
    }

    // Create container
    this.containerElement = document.createElement('div');
    this.containerElement.id = `${this.id}-container`;
    this.containerElement.className = `primitive-container ${this.getContainerClassName()}`;

    // Apply base styling
    this.applyBaseContainerStyling();

    // Apply position if available
    if (this.currentPosition) {
      this.applyPositionToContainer(this.currentPosition);
    }

    // Attach to chart
    chartElement.appendChild(this.containerElement);

    // Call lifecycle hook
    this.onContainerCreated(this.containerElement);
  }

  /**
   * Apply position to container using CSS (no chart re-render)
   */
  private applyPositionToContainer(position: Position): void {
    if (!this.containerElement) return;

    const style = this.containerElement.style;
    style.position = 'absolute';
    style.top = '';
    style.right = '';
    style.bottom = '';
    style.left = '';

    if (position.top !== undefined) style.top = `${position.top}px`;
    if (position.right !== undefined) style.right = `${position.right}px`;
    if (position.bottom !== undefined) style.bottom = `${position.bottom}px`;
    if (position.left !== undefined) style.left = `${position.left}px`;
    if (position.zIndex !== undefined) style.zIndex = position.zIndex.toString();
  }

  /**
   * Apply base container styling
   */
  private applyBaseContainerStyling(): void {
    if (!this.containerElement) return;

    const style = this.containerElement.style;
    style.position = 'absolute';
    style.pointerEvents = 'auto';
    style.userSelect = 'none';

    // Apply config styling
    if (this.config.style) {
      const configStyle = this.config.style;
      const isLegend = this.id.includes('legend');

      // For legends, don't apply background to container - let content handle it
      if (configStyle.backgroundColor && !isLegend) {
        style.backgroundColor = configStyle.backgroundColor;
      }
      if (configStyle.color && !isLegend) style.color = configStyle.color;
      if (configStyle.fontSize) style.fontSize = `${configStyle.fontSize}px`;
      if (configStyle.fontFamily) style.fontFamily = configStyle.fontFamily;
      if (configStyle.borderRadius && !isLegend)
        style.borderRadius = `${configStyle.borderRadius}px`;
      if (configStyle.padding && !isLegend) style.padding = `${configStyle.padding}px`;

      // For legends, force margin to 0 since spacing is handled by layout manager
      if (isLegend) {
        style.margin = '0';
      } else if (configStyle.margin) {
        style.margin = `${configStyle.margin}px`;
      }
      if (configStyle.zIndex) style.zIndex = configStyle.zIndex.toString();

      // Ensure container is transparent for legends
      if (isLegend) {
        style.backgroundColor = 'transparent';
        style.color = 'inherit';
      }
    }
  }

  /**
   * Destroy container element
   */
  private destroyContainer(): void {
    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
    }
    this.containerElement = null;
  }

  // ===== Template Processing System =====

  /**
   * Set template data for processing
   */
  public setTemplateData(data: TemplateData): void {
    this.templateData = { ...this.templateData, ...data };

    if (this.mounted) {
      this.processTemplate();
      this.renderContent();
    }
  }

  /**
   * Update template context for processing
   */
  public updateTemplateContext(context: Partial<TemplateContext>): void {
    this.templateContext = { ...this.templateContext, ...context };

    if (this.mounted) {
      this.processTemplate();
      this.renderContent();
    }
  }

  /**
   * Process template with current data using TemplateEngine
   */
  protected processTemplate(): void {
    const template = this.getTemplate();
    const context: TemplateContext = {
      ...this.templateContext,
      customData: this.templateData,
    };

    this.lastTemplateResult = this.templateEngine.processTemplate(template, context);

    // Check for errors but fail silently in production
    if (this.lastTemplateResult.hasErrors) {
      // Template processing errors - could implement proper error reporting if needed
    }
  }

  /**
   * Get processed template content
   */
  protected getProcessedContent(): string {
    return this.lastTemplateResult?.content || this.getTemplate();
  }

  /**
   * Get template processing result for debugging
   */
  public getTemplateResult(): TemplateResult | null {
    return this.lastTemplateResult;
  }

  // ===== Event System Integration =====

  /**
   * Initialize event management
   */
  private initializeEventManagement(): void {
    if (!this.chart) return;

    const chartId = this.getChartId();
    this.eventManager = PrimitiveEventManager.getInstance(chartId);
    this.eventManager.initialize(this.chart);
  }

  /**
   * Setup default event subscriptions
   */
  private setupDefaultEventSubscriptions(): void {
    if (!this.eventManager) return;

    const crosshairSub = this.eventManager.subscribe('crosshairMove', event => {
      this.handleCrosshairMove(event);
    });
    this.eventSubscriptions.push(crosshairSub);

    this.setupCustomEventSubscriptions();
  }

  /**
   * Cleanup event subscriptions
   */
  private cleanupEventSubscriptions(): void {
    this.eventSubscriptions.forEach(sub => sub.unsubscribe());
    this.eventSubscriptions = [];
  }

  /**
   * Handle crosshair move events
   */
  protected handleCrosshairMove(event: {
    time: any;
    point: { x: number; y: number } | null;
    seriesData: Map<any, any>;
  }): void {
    // Update template context with series data
    if (event.seriesData.size > 0 && this.series) {
      const seriesValue = event.seriesData.get(this.series);
      if (seriesValue) {
        this.updateTemplateContext({
          seriesData: seriesValue,
          formatting: this.config.style
            ? {
                valueFormat: '.2f', // Default format, can be overridden
                timeFormat: 'YYYY-MM-DD HH:mm:ss',
              }
            : undefined,
        });
      }
    }

    // Call subclass hook
    this.onCrosshairMove(event);
  }

  /**
   * Handle chart resize events
   */
  protected handleChartResize(event: { width: number; height: number }): void {
    this.onChartResize(event);
  }

  /**
   * Get event manager instance
   */
  public getEventManager(): PrimitiveEventManager | null {
    return this.eventManager;
  }

  // ===== Visibility Management =====

  /**
   * Set primitive visibility
   */
  public setVisible(visible: boolean): void {
    if (this.visible !== visible) {
      this.visible = visible;

      // Update container visibility
      if (this.containerElement) {
        this.containerElement.style.display = visible ? 'block' : 'none';
      }

      // Update layout manager
      if (this.layoutManager) {
        this.layoutManager.updateWidgetVisibility(this.id, visible);
      }

      // Call lifecycle hook
      this.onVisibilityChanged(visible);
    }
  }

  /**
   * Toggle primitive visibility
   */
  public toggle(): void {
    this.setVisible(!this.visible);
  }

  // ===== Configuration Management =====

  /**
   * Update primitive configuration
   */
  public updateConfig(newConfig: Partial<TConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Re-apply styling if container exists
    if (this.containerElement) {
      this.applyBaseContainerStyling();
    }

    // Trigger update
    if (this.mounted) {
      this.updateAllViews();
    }

    // Call lifecycle hook
    this.onConfigUpdate(newConfig);
  }

  /**
   * Get current configuration
   */
  public getConfig(): TConfig {
    return { ...this.config };
  }

  // ===== Abstract Methods (to be implemented by subclasses) =====

  /**
   * Get the template string for this primitive
   */
  protected abstract getTemplate(): string;

  /**
   * Render content to the container
   */
  protected abstract renderContent(): void;

  /**
   * Get CSS class name for the container
   */
  protected abstract getContainerClassName(): string;

  // ===== Lifecycle Hooks (optional overrides) =====

  /**
   * Called when primitive is attached to chart
   */
  protected onAttached(_params: {
    chart: IChartApi;
    series: ISeriesApi<any>;
    requestUpdate: () => void;
  }): void {
    // Override in subclasses
  }

  /**
   * Called when primitive is detached from chart
   */
  protected onDetached(): void {
    // Override in subclasses
  }

  /**
   * Called during each update cycle
   */
  protected onUpdate(): void {
    // Override in subclasses
  }

  /**
   * Called when position is updated by layout manager
   */
  protected onPositionUpdate(_position: Position): void {
    // Override in subclasses
  }

  /**
   * Called when container element is created
   */
  protected onContainerCreated(_container: HTMLElement): void {
    // Override in subclasses
  }

  /**
   * Called when visibility changes
   */
  protected onVisibilityChanged(_visible: boolean): void {
    // Override in subclasses
  }

  /**
   * Called when configuration is updated
   */
  protected onConfigUpdate(_newConfig: Partial<TConfig>): void {
    // Override in subclasses
  }

  /**
   * Called when crosshair moves over the chart
   */
  protected onCrosshairMove(_event: {
    time: any;
    point: { x: number; y: number } | null;
    seriesData: Map<any, any>;
  }): void {
    // Override in subclasses
  }

  /**
   * Called when chart is resized
   */
  protected onChartResize(_event: { width: number; height: number }): void {
    // Override in subclasses
  }

  /**
   * Setup custom event subscriptions - override in subclasses
   */
  protected setupCustomEventSubscriptions(): void {
    // Override in subclasses to add custom event subscriptions
  }

  // ===== Utility Methods =====

  /**
   * Get current position
   */
  public getPosition(): Position | null {
    return this.currentPosition;
  }

  /**
   * Get container element
   */
  public getContainer(): HTMLElement | null {
    return this.containerElement;
  }

  /**
   * Check if primitive is mounted
   */
  public isMounted(): boolean {
    return this.mounted;
  }

  /**
   * Get chart API reference
   */
  public getChart(): IChartApi | null {
    return this.chart;
  }

  /**
   * Get series API reference
   */
  public getSeries(): ISeriesApi<any> | null {
    return this.series;
  }
}

/**
 * Priority levels for common primitives
 */
export const PrimitivePriority = {
  RANGE_SWITCHER: 1, // Highest priority - navigation aid
  MINIMIZE_BUTTON: 2, // High priority - always visible after range switcher
  LEGEND: 3, // Medium priority - important for data understanding
  CUSTOM: 10, // Default for custom primitives
  DEBUG: 999, // Lowest priority - debug/development primitives
} as const;

/**
 * Primitive type identifiers
 */
export const PrimitiveType = {
  LEGEND: 'legend',
  RANGE_SWITCHER: 'range-switcher',
  BUTTON: 'button',
  CUSTOM: 'custom',
} as const;
