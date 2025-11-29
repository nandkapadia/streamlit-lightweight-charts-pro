/**
 * TooltipManager - Singleton coordinator for tooltip display across all plugins
 *
 * Design Philosophy:
 * - Acts as mediator between tooltip requesters (primitives/plugins) and renderer
 * - Manages priority/conflicts (highest priority wins)
 * - Emits lifecycle events for monitoring
 * - Completely decoupled from specific plugin implementations
 *
 * Plugins/Primitives provide:
 * - Pre-rendered HTML content
 * - Complete CSS styling
 * - Hit detection logic
 *
 * Manager handles:
 * - Request coordination
 * - Priority resolution
 * - Lifecycle management
 *
 * @example
 * ```typescript
 * // Plugin/Primitive subscribes to crosshair events
 * chart.subscribeCrosshairMove(param => {
 *   if (this.hitTest(param.point.x, param.point.y)) {
 *     TooltipManager.getInstance().requestTooltip({
 *       source: this.getId(),
 *       priority: 10,
 *       content: this.createTooltipContent(),
 *       style: this.createTooltipStyle(),
 *       position: param.point,
 *     });
 *   } else {
 *     TooltipManager.getInstance().hideTooltip(this.getId());
 *   }
 * });
 * ```
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { TooltipPlugin } from './tooltipPlugin';

/**
 * Tooltip request event data
 */
export interface TooltipRequestEvent {
  /** Source identifier (primitive ID, plugin name, etc.) */
  source: string;

  /** Priority (higher = takes precedence) */
  priority: number;

  /** Pre-rendered HTML content (plugin creates this) */
  content: string;

  /** Complete inline styles (plugin defines) */
  style: string | Partial<CSSStyleDeclaration>;

  /** Mouse position */
  position: { x: number; y: number };

  /** Optional: Custom CSS classes */
  cssClasses?: string[];
}

/**
 * Tooltip shown event (for subscribers to react)
 */
export interface TooltipShownEvent {
  source: string;
  timestamp: number;
}

/**
 * Tooltip hidden event
 */
export interface TooltipHiddenEvent {
  source: string;
  timestamp: number;
}

/**
 * Singleton TooltipManager - Central coordinator for all tooltip display
 *
 * Acts as a mediator between tooltip requesters (primitives/plugins) and the
 * rendering system (TooltipPlugin). Manages priority conflicts, coordinates
 * multiple simultaneous requests, and emits lifecycle events.
 *
 * Architecture:
 * - Singleton pattern ensures single global coordinator
 * - Event-driven communication (extends EventEmitter)
 * - Priority-based conflict resolution (highest wins)
 * - RAF-based updates for optimal performance
 * - Completely decoupled from specific implementations
 *
 * Event Lifecycle:
 * 1. Primitive/plugin requests tooltip via requestTooltip()
 * 2. Manager stores request in activeRequests map
 * 3. Manager schedules RAF to process requests
 * 4. processRequests() selects highest priority request
 * 5. Delegates rendering to TooltipPlugin
 * 6. Emits 'tooltip:shown' or 'tooltip:hidden' events
 *
 * @export
 * @class TooltipManager
 * @extends {EventEmitter}
 *
 * @example
 * ```typescript
 * // Get singleton instance
 * const manager = TooltipManager.getInstance();
 *
 * // Subscribe to lifecycle events
 * manager.on('tooltip:shown', (event: TooltipShownEvent) => {
 *   console.log(`Tooltip shown from: ${event.source}`);
 * });
 *
 * // Request tooltip from a primitive
 * manager.requestTooltip({
 *   source: 'my-primitive',
 *   priority: 10,
 *   content: '<div>My tooltip</div>',
 *   style: 'background: black; color: white;',
 *   position: { x: 100, y: 200 }
 * });
 *
 * // Hide tooltip
 * manager.hideTooltip('my-primitive');
 * ```
 */
export class TooltipManager {
  /** Singleton instance (lazy initialized) */
  private static instance: TooltipManager | null = null;

  /** Event emitter for pub-sub pattern (tooltip:shown, tooltip:hidden) */
  private eventEmitter: EventEmitter;

  /** Active tooltip requests keyed by source identifier */
  private activeRequests: Map<string, TooltipRequestEvent> = new Map();

  /** Currently displayed tooltip (null if hidden) */
  private currentTooltip: TooltipRequestEvent | null = null;

  /** Reference to tooltip renderer plugin */
  private renderer: TooltipPlugin | null = null;

  /** RAF ID for batched request processing (null if no RAF pending) */
  private rafId: number | null = null;

  /**
   * Private constructor (Singleton pattern)
   *
   * Initializes event emitter with increased max listeners to support
   * many concurrent primitives/plugins.
   *
   * @private
   */
  private constructor() {
    this.eventEmitter = new EventEmitter();
    // Increase max listeners to handle 50+ concurrent primitives
    // Default is 10, which would trigger warnings with many trade rectangles
    this.eventEmitter.setMaxListeners(50);
  }

  /**
   * Get singleton instance (lazy initialization)
   *
   * Returns the global TooltipManager instance, creating it if it doesn't exist.
   * Thread-safe singleton pattern ensures only one manager exists globally.
   *
   * @static
   * @returns {TooltipManager} The singleton instance
   *
   * @example
   * ```typescript
   * const manager = TooltipManager.getInstance();
   * manager.requestTooltip({...});
   * ```
   */
  static getInstance(): TooltipManager {
    // Lazy initialization - create instance on first access
    if (!TooltipManager.instance) {
      TooltipManager.instance = new TooltipManager();
    }
    return TooltipManager.instance;
  }

  /**
   * Register tooltip renderer plugin
   *
   * Connects the rendering system (TooltipPlugin) to this manager.
   * Must be called before any tooltip requests will be displayed.
   *
   * @param {TooltipPlugin} renderer - TooltipPlugin instance to handle rendering
   *
   * @remarks
   * - Should be called once during chart initialization
   * - Logs registration for debugging
   * - Replaces any previously registered renderer
   */
  registerRenderer(renderer: TooltipPlugin): void {
    this.renderer = renderer;
    logger.info('TooltipRenderer registered', 'TooltipManager');
  }

  /**
   * Unregister tooltip renderer (cleanup)
   *
   * Removes the renderer reference during cleanup. Should be called
   * when the chart/component is being destroyed.
   *
   * @remarks
   * - Prevents memory leaks by clearing renderer reference
   * - Logs unregistration for debugging
   * - Safe to call even if no renderer is registered
   */
  unregisterRenderer(): void {
    if (this.renderer) {
      logger.info('TooltipRenderer unregistered', 'TooltipManager');
      this.renderer = null;
    }
  }

  /**
   * Request to show a tooltip
   *
   * @param request - Tooltip request with source, priority, content, style, position
   *
   * Multiple plugins can request tooltips simultaneously. The manager will:
   * 1. Store all active requests
   * 2. Select highest priority request
   * 3. Delegate rendering to TooltipPlugin
   *
   * Uses requestAnimationFrame for efficient, browser-synchronized updates.
   * This ensures tooltip updates are batched with the browser's render cycle
   * for optimal performance (typically 60fps).
   */
  requestTooltip(request: TooltipRequestEvent): void {
    // Step 1: Validate required fields
    // Ensures request has minimum data needed for display
    if (!request.source || !request.content) {
      logger.warn('Invalid tooltip request: missing source or content', 'TooltipManager');
      return;
    }

    // Step 2: Store or update request from this source
    // Replaces any previous request from the same source
    this.activeRequests.set(request.source, request);

    // Step 3: Schedule request processing using requestAnimationFrame
    // RAF batches updates with browser's render cycle for optimal performance
    // Only schedule if no RAF is already pending (prevents redundant scheduling)
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        // Process all requests and select highest priority
        this.processRequests();
        // Clear RAF ID to allow future scheduling
        this.rafId = null;
      });
    }
    // If RAF is already scheduled, it will see the updated activeRequests map
  }

  /**
   * Hide tooltip from a specific source
   *
   * Removes the tooltip request from the specified source. If that source's
   * tooltip is currently displayed, schedules a reprocessing to either show
   * the next highest priority tooltip or hide the tooltip entirely.
   *
   * @param {string} source - Source identifier to hide tooltip from
   *
   * @remarks
   * - Uses RAF for smooth, synchronized hiding
   * - Only schedules RAF when actually needed (not if RAF already pending)
   * - Intelligently determines when to schedule based on tooltip state
   */
  hideTooltip(source: string): void {
    // Step 1: Remove request from this source and track if it was active
    const wasActive = this.activeRequests.has(source);
    this.activeRequests.delete(source);

    // Step 2: Determine if we need to schedule RAF for reprocessing
    // Case A: This source's tooltip is currently displayed
    if (this.currentTooltip?.source === source && this.rafId === null) {
      // Schedule RAF to either show next priority tooltip or hide
      this.rafId = requestAnimationFrame(() => {
        this.processRequests();
        this.rafId = null;
      });
    }
    // Case B: All requests cleared and no RAF pending
    else if (wasActive && this.activeRequests.size === 0 && this.rafId === null) {
      // Schedule RAF to hide tooltip immediately
      this.rafId = requestAnimationFrame(() => {
        this.processRequests();
        this.rafId = null;
      });
    }
    // Case C: RAF already scheduled - it will see the updated state
    // No need to schedule another RAF
  }

  /**
   * Process all active requests and show highest priority tooltip
   *
   * Called via requestAnimationFrame to batch tooltip updates. Selects the
   * highest priority request from all active requests and delegates rendering
   * to the TooltipPlugin. If no requests are active, hides the tooltip.
   *
   * Priority resolution:
   * - Higher numeric priority wins
   * - If priorities are equal, lexicographic source order decides (for consistency)
   *
   * @private
   *
   * @remarks
   * - Only updates display if highest priority differs from current tooltip
   * - Prevents unnecessary DOM updates when tooltip doesn't change
   */
  private processRequests(): void {
    // Step 1: Clear RAF ID (processing is starting)
    this.rafId = null;

    // Step 2: Check if any requests are active
    if (this.activeRequests.size === 0) {
      // No requests - hide tooltip
      this.hideCurrentTooltip();
      return;
    }

    // Step 3: Find highest priority request
    let highestPriority: TooltipRequestEvent | null = null;

    for (const [, request] of this.activeRequests) {
      if (!highestPriority || request.priority > highestPriority.priority) {
        // New highest priority found
        highestPriority = request;
      } else if (
        request.priority === highestPriority.priority &&
        request.source < highestPriority.source
      ) {
        // Same priority - use lexicographic order for deterministic behavior
        highestPriority = request;
      }
    }

    // Step 4: Update display if highest priority differs from current
    // Prevents unnecessary DOM updates
    if (highestPriority && highestPriority.source !== this.currentTooltip?.source) {
      this.showTooltip(highestPriority);
    }
  }

  /**
   * Show tooltip via renderer
   *
   * Delegates tooltip rendering to the TooltipPlugin and emits lifecycle events.
   * Updates currentTooltip tracking and handles rendering errors gracefully.
   *
   * @private
   * @param {TooltipRequestEvent} request - Tooltip request with content, style, position
   *
   * @remarks
   * - Emits 'tooltip:shown' event for monitoring
   * - Logs and catches rendering errors
   * - Updates currentTooltip before calling renderer
   */
  private showTooltip(request: TooltipRequestEvent): void {
    // Validate renderer is registered
    if (!this.renderer) {
      logger.warn('No tooltip renderer registered', 'TooltipManager');
      return;
    }

    // Update current tooltip tracking
    this.currentTooltip = request;

    try {
      // Delegate rendering to TooltipPlugin
      // Plugin receives pre-rendered content and styling
      this.renderer.show(request.content, request.style, request.position, request.cssClasses);

      // Emit lifecycle event for external monitoring
      this.eventEmitter.emit('tooltip:shown', {
        source: request.source,
        timestamp: Date.now(),
      } as TooltipShownEvent);
    } catch (error) {
      // Log but don't throw - prevents tooltip errors from breaking chart
      logger.error('Failed to show tooltip', 'TooltipManager', error);
    }
  }

  /**
   * Hide current tooltip
   *
   * Hides the currently displayed tooltip via the renderer and emits a
   * lifecycle event. Handles errors gracefully and clears tooltip tracking.
   *
   * @private
   *
   * @remarks
   * - Emits 'tooltip:hidden' event with source and timestamp
   * - Logs and catches hiding errors
   * - Safe to call even if no tooltip is currently shown
   * - Clears currentTooltip reference
   */
  private hideCurrentTooltip(): void {
    // Attempt to hide via renderer if available
    if (this.renderer) {
      try {
        this.renderer.hide();
      } catch (error) {
        // Log but don't throw
        logger.error('Failed to hide tooltip', 'TooltipManager', error);
      }
    }

    // Emit lifecycle event if a tooltip was displayed
    if (this.currentTooltip) {
      this.eventEmitter.emit('tooltip:hidden', {
        source: this.currentTooltip.source,
        timestamp: Date.now(),
      } as TooltipHiddenEvent);
    }

    // Clear current tooltip reference
    this.currentTooltip = null;
  }

  /**
   * Subscribe to tooltip lifecycle events
   *
   * @param event - Event name ('tooltip:shown' | 'tooltip:hidden')
   * @param callback - Callback function
   */
  on(event: 'tooltip:shown' | 'tooltip:hidden', callback: (data: any) => void): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from events
   *
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  off(event: 'tooltip:shown' | 'tooltip:hidden', callback: (data: any) => void): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Clear all active requests (e.g., on chart reset)
   */
  clearAll(): void {
    this.activeRequests.clear();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.hideCurrentTooltip();
  }

  /**
   * Get current tooltip source (for debugging)
   */
  getCurrentSource(): string | null {
    return this.currentTooltip?.source || null;
  }

  /**
   * Get all active sources (for debugging)
   */
  getActiveSources(): string[] {
    return Array.from(this.activeRequests.keys());
  }

  /**
   * Get active request count (for debugging)
   */
  getActiveCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Check if a specific source has an active request
   */
  hasActiveRequest(source: string): boolean {
    return this.activeRequests.has(source);
  }

  /**
   * Cleanup and reset manager (for testing)
   */
  destroy(): void {
    this.clearAll();
    this.unregisterRenderer();
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Reset singleton instance (for testing only)
   * @internal
   */
  static resetInstance(): void {
    if (TooltipManager.instance) {
      TooltipManager.instance.destroy();
      TooltipManager.instance = null;
    }
  }
}
