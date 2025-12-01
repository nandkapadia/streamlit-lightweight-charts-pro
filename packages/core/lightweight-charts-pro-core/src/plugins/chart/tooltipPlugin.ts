/**
 * TooltipPlugin - Pure DOM renderer for tooltips
 *
 * Design Philosophy:
 * - Pure rendering concern only
 * - Receives pre-rendered content from plugins
 * - Applies styles provided by plugins
 * - Positions using ChartCoordinateService
 * - Does NOT decide what to show (TooltipManager decides)
 * - Does NOT format content (plugins provide HTML)
 * - Does NOT handle hit detection (plugins handle)
 *
 * Responsibilities:
 * - DOM element creation and management
 * - Content injection (innerHTML)
 * - Style application
 * - Position calculation and updates
 * - Show/hide with transitions
 *
 * @example
 * ```typescript
 * // Create tooltip renderer
 * const tooltipPlugin = new TooltipPlugin(container, 'chart-1');
 *
 * // TooltipManager will call these methods:
 * tooltipPlugin.show(
 *   '<div>My tooltip content</div>',
 *   'background: black; color: white;',
 *   { x: 100, y: 200 }
 * );
 * ```
 */

import { ChartCoordinateService } from '../../services/ChartCoordinateService';
import { createSingleton } from '../../utils/SingletonBase';
import { logger } from '../../utils/logger';
import { TooltipManager } from './TooltipManager';

/**
 * TooltipPlugin - Pure DOM rendering layer for tooltips
 *
 * Implements the rendering side of the tooltip system. This class is solely
 * responsible for DOM manipulation (create, position, show, hide) and receives
 * all content and styling from the TooltipManager.
 *
 * Architecture:
 * - Rendering only (no business logic or hit detection)
 * - Managed by TooltipManager (registered on construction)
 * - Uses ChartCoordinateService for intelligent positioning
 * - Supports custom HTML content and CSS styling
 * - Handles smooth transitions (fade in/out)
 *
 * Responsibilities:
 * - Create and manage tooltip DOM element
 * - Inject HTML content provided by plugins
 * - Apply CSS styles provided by plugins
 * - Calculate optimal position (avoid viewport edges)
 * - Show/hide with smooth transitions
 * - Cleanup on destroy
 *
 * @export
 * @class TooltipPlugin
 *
 * @example
 * ```typescript
 * // Create tooltip plugin (auto-registers with TooltipManager)
 * const tooltipPlugin = new TooltipPlugin(chartContainer, 'chart-1');
 *
 * // TooltipManager calls show/hide automatically
 * // Plugins don't call this directly
 * ```
 */
export class TooltipPlugin {
  /** Container element (chart container) for tooltip */
  private container: HTMLElement;
  /** Tooltip DOM element (lazy-created) */
  private tooltipElement: HTMLElement | null = null;
  /** Coordinate service for positioning (lazy-initialized) */
  private _coordinateService: ChartCoordinateService | null = null;

  /**
   * Creates a new TooltipPlugin
   *
   * Initializes the plugin and automatically registers it with the
   * TooltipManager singleton. The tooltip DOM element is created lazily
   * on first show() call.
   *
   * @param {HTMLElement} container - Chart container element
   * @param {string} _chartId - Chart identifier (unused, for future use)
   *
   * @remarks
   * - Auto-registers with TooltipManager
   * - Tooltip element is not created until first use (lazy initialization)
   * - ChartCoordinateService is also lazy-initialized
   */
  constructor(container: HTMLElement, _chartId: string) {
    // Store container reference
    this.container = container;

    // Auto-register with global TooltipManager
    // Manager will call show()/hide() methods
    TooltipManager.getInstance().registerRenderer(this);
  }

  /**
   * Lazy getter for ChartCoordinateService
   *
   * Returns the coordinate service singleton, initializing it on first access.
   * Lazy initialization avoids module loading order issues and improves startup time.
   *
   * @private
   * @returns {ChartCoordinateService} Coordinate service singleton
   * @throws {Error} If coordinate service fails to initialize
   *
   * @remarks
   * - Uses createSingleton utility for lazy initialization
   * - Throws error if initialization fails (should never happen)
   * - Cached after first access
   */
  private get coordinateService(): ChartCoordinateService {
    // Lazy initialization on first access
    if (!this._coordinateService) {
      this._coordinateService = createSingleton(ChartCoordinateService);
    }

    // Validate service was created
    if (!this._coordinateService) {
      throw new Error('Failed to initialize ChartCoordinateService');
    }

    return this._coordinateService;
  }

  /**
   * Show tooltip with pre-rendered content
   *
   * @param content - HTML content (plugin provides)
   * @param style - CSS styles (plugin provides)
   * @param position - Mouse position
   * @param cssClasses - Optional CSS classes
   */
  show(
    content: string,
    style: string | Partial<CSSStyleDeclaration>,
    position: { x: number; y: number },
    cssClasses?: string[]
  ): void {
    try {
      // Step 1: Ensure tooltip element exists (lazy creation)
      if (!this.tooltipElement) {
        this.ensureTooltipElement();
      }

      // Step 2: Validate element was created successfully
      if (!this.tooltipElement) {
        logger.warn('Failed to create tooltip element', 'TooltipPlugin');
        return;
      }

      // Step 3: Inject HTML content from plugin
      this.tooltipElement.innerHTML = content;

      // Step 4: Apply CSS styles from plugin
      this.applyStyle(this.tooltipElement, style);

      // Step 5: Apply optional CSS classes
      if (cssClasses && cssClasses.length > 0) {
        this.tooltipElement.className = `lw-tooltip ${cssClasses.join(' ')}`;
      } else {
        this.tooltipElement.className = 'lw-tooltip';
      }

      // Step 6: Make visible (but transparent) to measure dimensions
      this.tooltipElement.style.display = 'block';
      this.tooltipElement.style.opacity = '0';

      // Step 7: Force browser layout to get accurate dimensions
      void this.tooltipElement.offsetHeight;

      // Step 8: Calculate and apply optimal position
      this.position(position);

      // Step 9: Fade in with RAF for smooth transition
      requestAnimationFrame(() => {
        if (this.tooltipElement) {
          this.tooltipElement.style.opacity = '1';
        }
      });
    } catch (error) {
      logger.error('Failed to show tooltip', 'TooltipPlugin', error);
    }
  }

  /**
   * Hide tooltip with fade-out transition
   *
   * Sets opacity to 0 for fade-out effect, then hides element after animation
   * completes (150ms delay).
   *
   * @remarks
   * - Fade-out duration: 150ms (matches CSS transition)
   * - Display is set to 'none' after fade completes
   * - Safe to call even if tooltip is already hidden
   */
  hide(): void {
    if (this.tooltipElement) {
      // Start fade-out transition
      this.tooltipElement.style.opacity = '0';

      // Hide element after fade-out completes
      setTimeout(() => {
        if (this.tooltipElement) {
          this.tooltipElement.style.display = 'none';
        }
      }, 150); // Match CSS transition duration
    }
  }

  /**
   * Create minimal tooltip element
   */
  private ensureTooltipElement(): void {
    if (this.tooltipElement) return;

    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'lw-tooltip';

    // MINIMAL default styling - plugins override everything
    this.tooltipElement.style.cssText = `
        position: absolute;
        z-index: 1000;
        pointer-events: none;
        user-select: none;
      opacity: 0;
      transition: opacity 0.15s ease;
        display: none;
    `;

    this.container.appendChild(this.tooltipElement);
  }

  /**
   * Apply styles provided by plugin
   */
  private applyStyle(element: HTMLElement, style: string | Partial<CSSStyleDeclaration>): void {
    try {
      if (typeof style === 'string') {
        // CSS string - append to existing (preserve position, z-index, etc.)
        const existingStyle = element.style.cssText;
        element.style.cssText = existingStyle + ';' + style;
      } else {
        // Style object - apply each property
        Object.entries(style).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            (element.style as any)[key] = value;
          }
        });
      }
    } catch (error) {
      logger.error('Failed to apply tooltip style', 'TooltipPlugin', error);
    }
  }

  /**
   * Position tooltip using ChartCoordinateService
   */
  private position(point: { x: number; y: number }): void {
    if (!this.tooltipElement) return;

    try {
      const containerBounds = this.container.getBoundingClientRect();
      const tooltipWidth = this.tooltipElement.offsetWidth || 200;
      const tooltipHeight = this.tooltipElement.offsetHeight || 100;

      // Use ChartCoordinateService for optimal positioning
      const position = this.coordinateService.calculateTooltipPosition(
        point.x,
        point.y,
        tooltipWidth,
        tooltipHeight,
        {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: containerBounds.width,
          bottom: containerBounds.height,
          width: containerBounds.width,
          height: containerBounds.height,
        },
        'top' // Preferred anchor
      );

      // Apply position using ChartCoordinateService
      this.coordinateService.applyPositionToElement(this.tooltipElement, {
        top: position.y,
        left: position.x,
      });
    } catch (error) {
      logger.error('Failed to position tooltip', 'TooltipPlugin', error);
    }
  }

  /**
   * Update tooltip position (for following cursor)
   */
  updatePosition(position: { x: number; y: number }): void {
    if (this.tooltipElement && this.tooltipElement.style.display !== 'none') {
      this.position(position);
    }
  }

  /**
   * Cleanup and destroy tooltip
   */
  destroy(): void {
    try {
      if (this.tooltipElement && this.tooltipElement.parentNode) {
        this.tooltipElement.parentNode.removeChild(this.tooltipElement);
        this.tooltipElement = null;
      }

      // Unregister from manager
      TooltipManager.getInstance().unregisterRenderer();

      logger.info('TooltipPlugin destroyed', 'TooltipPlugin');
    } catch (error) {
      logger.error('Failed to destroy TooltipPlugin', 'TooltipPlugin', error);
    }
  }

  /**
   * Remove tooltip (alias for destroy)
   */
  remove(): void {
    this.destroy();
  }
}
