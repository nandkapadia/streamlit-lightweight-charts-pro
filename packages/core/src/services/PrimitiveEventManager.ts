/**
 * @fileoverview Primitive Event Manager
 *
 * Centralized event coordination system for chart primitives. Provides
 * typed event subscriptions, crosshair tracking, and series data updates
 * for all primitives.
 *
 * This service is responsible for:
 * - Subscribing to chart events (crosshair, resize, time scale changes)
 * - Broadcasting events to registered primitives
 * - Maintaining event listener registry
 * - Providing typed event interfaces
 * - Managing event lifecycle and cleanup
 *
 * Architecture:
 * - Keyed singleton pattern (one instance per chart)
 * - Type-safe event system with interfaces
 * - Event aggregation and broadcasting
 * - Automatic cleanup on destroy
 * - Integration with Lightweight Charts events
 *
 * Supported Events:
 * - **crosshairMove**: Crosshair position and series data
 * - **dataUpdate**: Series data changes
 * - **resize**: Chart dimension changes
 * - **visibilityChange**: Primitive show/hide
 * - **configChange**: Primitive configuration updates
 * - **timeScaleChange**: Visible time range changes
 * - **click**: Chart click interactions
 *
 * @example
 * ```typescript
 * const manager = PrimitiveEventManager.getInstance('chart-1');
 * manager.initialize(chartApi);
 *
 * // Subscribe to crosshair events
 * const unsubscribe = manager.on('crosshairMove', (data) => {
 *   console.log('Crosshair at:', data.time, data.point);
 * });
 *
 * // Cleanup
 * unsubscribe();
 * PrimitiveEventManager.cleanup('chart-1');
 * ```
 */

import { IChartApi, ISeriesApi } from 'lightweight-charts';

/**
 * Event types for primitive interactions
 *
 * @interface PrimitiveEventTypes
 */
export interface PrimitiveEventTypes {
  /**
   * Crosshair position changed
   */
  crosshairMove: {
    time: any;
    point: { x: number; y: number } | null;
    seriesData: Map<ISeriesApi<any>, any>;
  };

  /**
   * Chart data updated
   */
  dataUpdate: {
    series: ISeriesApi<any>;
    data: any[];
  };

  /**
   * Chart resize event
   */
  resize: {
    width: number;
    height: number;
  };

  /**
   * Primitive visibility changed
   */
  visibilityChange: {
    primitiveId: string;
    visible: boolean;
  };

  /**
   * Primitive configuration changed
   */
  configChange: {
    primitiveId: string;
    config: any;
  };

  /**
   * Chart time scale visible range changed
   */
  timeScaleChange: {
    from: any;
    to: any;
  };

  /**
   * Chart click event
   */
  click: {
    time: any;
    point: { x: number; y: number };
    seriesData: Map<ISeriesApi<any>, any>;
  };

  /**
   * Chart hover event
   */
  hover: {
    time: any;
    point: { x: number; y: number };
    seriesData: Map<ISeriesApi<any>, any>;
  };

  /**
   * Custom primitive events
   */
  custom: {
    eventType: string;
    data: any;
  };
}

/**
 * Event listener type
 */
export type PrimitiveEventListener<K extends keyof PrimitiveEventTypes> = (
  event: PrimitiveEventTypes[K]
) => void;

/**
 * Event subscription interface
 */
export interface EventSubscription {
  unsubscribe(): void;
}

/**
 * PrimitiveEventManager - Centralized event management for primitives
 *
 * Provides unified event handling for chart interactions and primitive lifecycle.
 * Integrates with lightweight-charts event system and provides abstracted events
 * for primitive implementations.
 *
 * Following DRY principles - single source of truth for event management
 */
export class PrimitiveEventManager {
  private static instances: Map<string, PrimitiveEventManager> = new Map();

  private chart: IChartApi | null = null;
  private chartId: string;
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();
  private chartEventCleanup: Array<() => void> = [];
  private _isDestroyed: boolean = false;

  // Crosshair tracking
  private lastCrosshairPosition: { time: any; point: { x: number; y: number } | null } | null =
    null;

  private constructor(chartId: string) {
    this.chartId = chartId;
  }

  /**
   * Get or create event manager for a chart
   */
  public static getInstance(chartId: string): PrimitiveEventManager {
    if (!PrimitiveEventManager.instances.has(chartId)) {
      PrimitiveEventManager.instances.set(chartId, new PrimitiveEventManager(chartId));
    }
    const instance = PrimitiveEventManager.instances.get(chartId);
    if (!instance) {
      throw new Error(`PrimitiveEventManager instance not found for chartId: ${chartId}`);
    }
    return instance;
  }

  /**
   * Clean up event manager for a chart
   */
  public static cleanup(chartId: string): void {
    const instance = PrimitiveEventManager.instances.get(chartId);
    if (instance) {
      instance.destroy();
      PrimitiveEventManager.instances.delete(chartId);
    }
  }

  /**
   * Initialize with chart API
   */
  public initialize(chart: IChartApi): void {
    if (this._isDestroyed) {
      throw new Error('Cannot initialize destroyed PrimitiveEventManager');
    }

    this.chart = chart;
    this.setupChartEventListeners();
  }

  /**
   * Subscribe to primitive event
   */
  public subscribe<K extends keyof PrimitiveEventTypes>(
    eventType: K,
    listener: PrimitiveEventListener<K>
  ): EventSubscription {
    if (this._isDestroyed) {
      throw new Error('Cannot subscribe to destroyed PrimitiveEventManager');
    }

    const eventKey = eventType as string;
    if (!this.eventListeners.has(eventKey)) {
      this.eventListeners.set(eventKey, new Set());
    }

    const listeners = this.eventListeners.get(eventKey);
    if (listeners) {
      listeners.add(listener);
    }

    return {
      unsubscribe: () => {
        const listeners = this.eventListeners.get(eventKey);
        if (listeners) {
          listeners.delete(listener);
          if (listeners.size === 0) {
            this.eventListeners.delete(eventKey);
          }
        }
      },
    };
  }

  /**
   * Emit event to subscribers
   */
  public emit<K extends keyof PrimitiveEventTypes>(
    eventType: K,
    event: PrimitiveEventTypes[K]
  ): void {
    if (this._isDestroyed) {
      return;
    }

    const eventKey = eventType as string;
    const listeners = this.eventListeners.get(eventKey);

    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch {
          // Error in primitive event listener - fail silently
        }
      });
    }
  }

  /**
   * Setup chart event listeners
   */
  private setupChartEventListeners(): void {
    if (!this.chart) return;

    // Crosshair move events with throttling to prevent performance issues during pan/zoom
    let lastCrosshairUpdate = 0;
    const crosshairThrottleDelay = 16; // ~60fps max update rate
    const crosshairMoveHandler = (param: any) => {
      const now = Date.now();
      if (now - lastCrosshairUpdate >= crosshairThrottleDelay) {
        lastCrosshairUpdate = now;
        this.handleCrosshairMove(param);
      }
    };
    this.chart.subscribeCrosshairMove(crosshairMoveHandler);
    this.chartEventCleanup.push(() => {
      if (this.chart) {
        this.chart.unsubscribeCrosshairMove(crosshairMoveHandler);
      }
    });

    // Chart click events
    const clickHandler = (param: any) => {
      this.handleChartClick(param);
    };
    this.chart.subscribeClick(clickHandler);
    this.chartEventCleanup.push(() => {
      if (this.chart) {
        this.chart.unsubscribeClick(clickHandler);
      }
    });

    // Time scale visible range changes with throttling to prevent X-axis lag
    let lastTimeScaleUpdate = 0;
    const timeScaleThrottleDelay = 16; // ~60fps max update rate
    const timeScaleHandler = () => {
      const now = Date.now();
      if (now - lastTimeScaleUpdate >= timeScaleThrottleDelay) {
        lastTimeScaleUpdate = now;
        this.handleTimeScaleChange();
      }
    };
    this.chart.timeScale().subscribeVisibleTimeRangeChange(timeScaleHandler);
    this.chartEventCleanup.push(() => {
      if (this.chart) {
        const timeScale = this.chart.timeScale();
        if (timeScale) {
          timeScale.unsubscribeVisibleTimeRangeChange(timeScaleHandler);
        }
      }
    });

    // Chart resize events
    this.setupResizeObserver();
  }

  /**
   * Handle crosshair move events
   */
  private handleCrosshairMove(param: any): void {
    const time = param.time;
    const point = param.point;

    // Collect series data
    const seriesData = new Map<ISeriesApi<any>, any>();
    if (param.seriesData) {
      param.seriesData.forEach((data: any, series: ISeriesApi<any>) => {
        seriesData.set(series, data);
      });
    }

    // Update last position
    this.lastCrosshairPosition = { time, point };

    // Emit crosshair move event
    this.emit('crosshairMove', {
      time,
      point,
      seriesData,
    });

    // Emit hover event if point is valid
    if (point && time) {
      this.emit('hover', {
        time,
        point,
        seriesData,
      });
    }
  }

  /**
   * Handle chart click events
   */
  private handleChartClick(param: any): void {
    const time = param.time;
    const point = param.point;

    if (!point || !time) return;

    // Collect series data at click point
    const seriesData = new Map<ISeriesApi<any>, any>();
    if (param.seriesData) {
      param.seriesData.forEach((data: any, series: ISeriesApi<any>) => {
        seriesData.set(series, data);
      });
    }

    this.emit('click', {
      time,
      point,
      seriesData,
    });
  }

  /**
   * Handle time scale changes
   */
  private handleTimeScaleChange(): void {
    if (!this.chart) return;

    const visibleRange = this.chart.timeScale().getVisibleRange();
    if (visibleRange) {
      this.emit('timeScaleChange', {
        from: visibleRange.from,
        to: visibleRange.to,
      });
    }
  }

  /**
   * Setup resize observer for chart container
   */
  private setupResizeObserver(): void {
    if (!this.chart) return;

    const chartElement = this.chart.chartElement();
    if (!chartElement || !window.ResizeObserver) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.emit('resize', { width, height });
      }
    });

    resizeObserver.observe(chartElement);
    this.chartEventCleanup.push(() => resizeObserver.disconnect());
  }

  /**
   * Emit primitive visibility change event
   */
  public emitVisibilityChange(primitiveId: string, visible: boolean): void {
    this.emit('visibilityChange', { primitiveId, visible });
  }

  /**
   * Emit primitive configuration change event
   */
  public emitConfigChange(primitiveId: string, config: any): void {
    this.emit('configChange', { primitiveId, config });
  }

  /**
   * Emit custom primitive event
   */
  public emitCustomEvent(eventType: string, data: any): void {
    this.emit('custom', { eventType, data });
  }

  /**
   * Get current crosshair position
   */
  public getCurrentCrosshairPosition(): {
    time: any;
    point: { x: number; y: number } | null;
  } | null {
    return this.lastCrosshairPosition;
  }

  /**
   * Get chart API reference
   */
  public getChart(): IChartApi | null {
    return this.chart;
  }

  /**
   * Get chart ID
   */
  public getChartId(): string {
    return this.chartId;
  }

  /**
   * Check if event manager is destroyed
   */
  public isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Get event listener count for debugging
   */
  public getEventListenerCount(): { [eventType: string]: number } {
    const counts: { [eventType: string]: number } = {};
    this.eventListeners.forEach((listeners, eventType) => {
      counts[eventType] = listeners.size;
    });
    return counts;
  }

  /**
   * Destroy event manager
   */
  public destroy(): void {
    if (this._isDestroyed) return;

    // Clean up chart event listeners
    this.chartEventCleanup.forEach(cleanup => {
      try {
        cleanup();
      } catch {
        // Error cleaning up chart event listener - fail silently
      }
    });
    this.chartEventCleanup = [];

    // Clear all event listeners
    this.eventListeners.clear();

    // Clear references
    this.chart = null;
    this.lastCrosshairPosition = null;

    // Mark as destroyed
    this._isDestroyed = true;
  }
}

/**
 * Event manager integration mixin for primitives
 */
export interface EventManagerIntegration {
  /**
   * Get event manager for this primitive
   */
  getEventManager(): PrimitiveEventManager | null;

  /**
   * Subscribe to chart events
   */
  subscribeToEvents(): void;

  /**
   * Unsubscribe from chart events
   */
  unsubscribeFromEvents(): void;
}

/**
 * Helper function to create event manager integration
 */
export function createEventManagerIntegration(
  chartId: string,
  chart?: IChartApi
): EventManagerIntegration {
  let eventManager: PrimitiveEventManager | null = null;
  let subscriptions: EventSubscription[] = [];

  return {
    getEventManager(): PrimitiveEventManager | null {
      if (!eventManager) {
        eventManager = PrimitiveEventManager.getInstance(chartId);
        if (chart) {
          eventManager.initialize(chart);
        }
      }
      return eventManager;
    },

    subscribeToEvents(): void {
      // Override in implementation to add specific event subscriptions
    },

    unsubscribeFromEvents(): void {
      subscriptions.forEach(sub => sub.unsubscribe());
      subscriptions = [];
    },
  };
}
