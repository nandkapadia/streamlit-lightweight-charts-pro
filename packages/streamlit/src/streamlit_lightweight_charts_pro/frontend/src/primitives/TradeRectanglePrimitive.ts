/**
 * @fileoverview Trade Rectangle Primitive for visualizing trades on charts
 *
 * This module provides a custom primitive for TradingView's Lightweight Charts that
 * renders rectangular overlays representing trade entry/exit periods. It includes
 * interactive tooltip support via the TooltipManager system and uses the template
 * engine for customizable tooltip content.
 *
 * Key Features:
 * - Draws filled rectangles spanning trade duration (entry to exit time)
 * - Interactive hit testing for tooltip display on hover
 * - Template-based tooltip content with trade data placeholders
 * - Automatic coordinate conversion and validation
 * - Event-driven updates on chart pan/zoom
 * - Proper cleanup to prevent memory leaks
 *
 * Architecture:
 * - TradeRectanglePrimitive: Main primitive implementing ISeriesPrimitive
 * - TradeRectangleView: View layer handling coordinate conversion
 * - TradeRectangleRenderer: Rendering layer drawing to canvas
 * - TooltipManager: Decoupled tooltip coordination system
 *
 * @see {@link https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesPrimitive}
 * @see {@link TooltipManager} for tooltip system architecture
 */

// Third Party Imports
import {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  IChartApi,
  ISeriesApi,
  Coordinate,
  UTCTimestamp,
  PrimitiveHoveredItem,
} from 'lightweight-charts';

// Local Imports
import { ChartCoordinateService } from '../services/ChartCoordinateService';
import { logger } from '../utils/logger';
import { TooltipManager } from '../plugins/chart/TooltipManager';
import { TradeTemplateProcessor, TradeTemplateData } from '../services/TradeTemplateProcessor';

/**
 * Trade rectangle data structure
 *
 * Represents a single trade visualization as a rectangular overlay on the chart.
 * The rectangle spans from entry time/price to exit time/price.
 *
 * @interface TradeRectangleData
 * @property {UTCTimestamp} time1 - Entry time (UNIX timestamp in seconds)
 * @property {UTCTimestamp} time2 - Exit time (UNIX timestamp in seconds)
 * @property {number} price1 - Entry price
 * @property {number} price2 - Exit price
 * @property {string} fillColor - Fill color (hex or rgba)
 * @property {string} borderColor - Border color (hex or rgba)
 * @property {number} borderWidth - Border width in pixels
 * @property {number} opacity - Fill opacity (0.0 to 1.0)
 * @property {number} [quantity] - Optional trade quantity
 * @property {string} [notes] - Optional trade notes
 * @property {string} [tradeId] - Optional unique trade identifier
 * @property {boolean} [isProfitable] - Optional profitability flag
 */
interface TradeRectangleData {
  time1: UTCTimestamp;
  time2: UTCTimestamp;
  price1: number;
  price2: number;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  quantity?: number;
  notes?: string;
  tradeId?: string;
  isProfitable?: boolean;
  // Allow any additional custom data for template access
  [key: string]: any;
}

/**
 * Options for customizing trade rectangle tooltips
 *
 * Configures tooltip behavior and appearance for trade rectangles.
 * Integrates with the TooltipManager system for coordinated tooltip display.
 *
 * @interface TradeRectangleTooltipOptions
 * @property {number} [priority] - Tooltip priority (higher values take precedence when
 *   multiple elements are under the crosshair). Default: 10
 * @property {string} [customStyle] - Custom CSS styles to append to base tooltip styles.
 *   Use inline CSS format (e.g., "background: red; color: white;")
 * @property {boolean} [enabled] - Whether tooltips are enabled for this trade rectangle.
 *   Default: true
 * @property {string} [tooltipTemplate] - Custom HTML template for tooltip content.
 *   Supports placeholders like $$entry_price$$, $$exit_price$$, $$pnl$$, etc.
 *   If not provided, uses default tooltip format.
 *
 * @example
 * ```typescript
 * const options: TradeRectangleTooltipOptions = {
 *   priority: 15,
 *   enabled: true,
 *   tooltipTemplate: '<div>Trade: $$trade_type$$<br/>P&L: $$pnl$$</div>',
 *   customStyle: 'font-size: 12px; padding: 8px;'
 * };
 * ```
 */
export interface TradeRectangleTooltipOptions {
  /** Tooltip priority (higher = takes precedence) */
  priority?: number;
  /** Custom tooltip style CSS */
  customStyle?: string;
  /** Enable/disable tooltip */
  enabled?: boolean;
  /** Custom HTML template for tooltip content */
  tooltipTemplate?: string;
}

/**
 * Trade Rectangle Renderer - Canvas rendering layer for trade rectangles
 *
 * Implements IPrimitivePaneRenderer to handle the actual canvas drawing of
 * trade rectangles. This class is responsible for rendering filled rectangles
 * with borders using the HTML5 Canvas API in bitmap coordinate space.
 *
 * Architecture:
 * - Receives pre-calculated screen coordinates from TradeRectangleView
 * - Renders using useBitmapCoordinateSpace for pixel-perfect drawing
 * - Handles pixel ratio conversion for high-DPI displays
 * - Applies fill colors, borders, and opacity
 *
 * @class TradeRectangleRenderer
 * @implements {IPrimitivePaneRenderer}
 *
 * @remarks
 * This renderer only handles drawing - it does NOT:
 * - Calculate coordinates (done by TradeRectangleView)
 * - Handle hit testing (done by TradeRectanglePrimitive)
 * - Manage tooltips (done by TooltipManager)
 * - Render text labels (done by tooltip system)
 */
class TradeRectangleRenderer implements IPrimitivePaneRenderer {
  /** X coordinate of first corner (entry or exit) */
  private _x1: Coordinate;
  /** Y coordinate of first corner (entry or exit) */
  private _y1: Coordinate;
  /** X coordinate of second corner (entry or exit) */
  private _x2: Coordinate;
  /** Y coordinate of second corner (entry or exit) */
  private _y2: Coordinate;
  /** Rectangle fill color (hex or rgba) */
  private _fillColor: string;
  /** Rectangle border color (hex or rgba) */
  private _borderColor: string;
  /** Border width in pixels */
  private _borderWidth: number;
  /** Fill opacity (0.0 to 1.0) */
  private _opacity: number;

  /**
   * Creates a new TradeRectangleRenderer
   *
   * @param {Coordinate} x1 - X coordinate of first corner
   * @param {Coordinate} y1 - Y coordinate of first corner
   * @param {Coordinate} x2 - X coordinate of second corner
   * @param {Coordinate} y2 - Y coordinate of second corner
   * @param {string} fillColor - Fill color (hex or rgba format)
   * @param {string} borderColor - Border color (hex or rgba format)
   * @param {number} borderWidth - Border width in pixels
   * @param {number} opacity - Fill opacity from 0.0 (transparent) to 1.0 (opaque)
   */
  constructor(
    x1: Coordinate,
    y1: Coordinate,
    x2: Coordinate,
    y2: Coordinate,
    fillColor: string,
    borderColor: string,
    borderWidth: number,
    opacity: number
  ) {
    this._x1 = x1;
    this._y1 = y1;
    this._x2 = x2;
    this._y2 = y2;
    this._fillColor = fillColor;
    this._borderColor = borderColor;
    this._borderWidth = borderWidth;
    this._opacity = opacity;
  }

  /**
   * Draw method (not used for rectangles)
   *
   * Required by IPrimitivePaneRenderer interface but not used.
   * Rectangles are drawn in drawBackground() to appear behind other elements.
   *
   * @param {any} _target - Rendering target (unused)
   */
  draw(_target: any) {
    // We use drawBackground for rectangles
  }

  /**
   * Draw the trade rectangle on the canvas background layer
   *
   * Renders the rectangle using bitmap coordinate space for pixel-perfect drawing.
   * Applies fill color with opacity and border with specified width.
   *
   * Drawing process:
   * 1. Validate coordinates are not null/undefined
   * 2. Convert to bitmap coordinates with pixel ratio
   * 3. Calculate rectangle bounds (left, top, width, height)
   * 4. Draw filled rectangle with opacity
   * 5. Draw border if border width > 0
   *
   * @param {any} target - Rendering target with useBitmapCoordinateSpace method
   *
   * @remarks
   * - Uses drawBackground to render behind other chart elements
   * - Text labels are NOT rendered here (handled by tooltip system)
   * - Returns early if coordinates are invalid or rectangle is too small
   */
  drawBackground(target: any) {
    // Step 1: Early return if coordinates are invalid
    // Coordinates can be null if conversion failed or undefined if not yet calculated
    if (
      this._x1 === null ||
      this._y1 === null ||
      this._x2 === null ||
      this._y2 === null ||
      this._x1 === undefined ||
      this._y1 === undefined ||
      this._x2 === undefined ||
      this._y2 === undefined
    ) {
      return;
    }

    // Step 2: Use bitmap coordinate space for pixel-perfect rendering
    // This ensures sharp rendering on high-DPI (Retina) displays
    target.useBitmapCoordinateSpace((scope: any) => {
      // Get 2D rendering context from the bitmap scope
      const ctx = scope.context;

      // Step 3: Convert logical coordinates to bitmap coordinates
      // Multiply by pixel ratio to handle high-DPI displays correctly
      const x1 = this._x1 * scope.horizontalPixelRatio;
      const y1 = this._y1 * scope.verticalPixelRatio;
      const x2 = this._x2 * scope.horizontalPixelRatio;
      const y2 = this._y2 * scope.verticalPixelRatio;

      // Step 4: Calculate rectangle bounds
      // Use Math.min/max to handle any corner being top-left or bottom-right
      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);

      // Step 5: Skip rendering if rectangle is too small (< 1 pixel)
      // Prevents rendering artifacts and improves performance
      if (width < 1 || height < 1) {
        return;
      }

      try {
        // Step 6: Draw filled rectangle with opacity
        // Set global alpha for transparency effect
        ctx.globalAlpha = this._opacity;
        ctx.fillStyle = this._fillColor;
        ctx.fillRect(left, top, width, height);

        // Step 7: Draw border if border width is specified
        // Border is drawn with full opacity for clear visibility
        if (this._borderWidth > 0) {
          ctx.globalAlpha = 1.0; // Full opacity for border
          ctx.strokeStyle = this._borderColor;
          // Scale border width by pixel ratio for consistent appearance
          ctx.lineWidth = this._borderWidth * scope.horizontalPixelRatio;
          ctx.strokeRect(left, top, width, height);
        }

        // Note: Text labels are rendered via tooltip system, not on canvas
        // This prevents overlapping text issues and allows for rich HTML formatting
      } finally {
        // Step 8: Reset global alpha to prevent affecting other drawings
        ctx.globalAlpha = 1.0;
      }
    });
  }
}

/**
 * Trade Rectangle View - Coordinate conversion layer
 *
 * Implements IPrimitivePaneView to handle coordinate conversion from
 * chart data space (time/price) to screen space (pixels). This class
 * acts as the bridge between trade data and visual rendering.
 *
 * Responsibilities:
 * - Convert trade times to X coordinates (timeToCoordinate)
 * - Convert trade prices to Y coordinates (priceToCoordinate)
 * - Validate coordinate conversion results
 * - Update coordinates when chart is panned/zoomed
 * - Create renderer with converted coordinates
 *
 * @class TradeRectangleView
 * @implements {IPrimitivePaneView}
 *
 * @remarks
 * This view layer separates coordinate math from rendering logic,
 * following the official TradingView primitive pattern.
 */
class TradeRectangleView implements IPrimitivePaneView {
  /** Reference to parent primitive for accessing chart and data */
  private _source: TradeRectanglePrimitive;
  /** Cached X coordinate of first corner (screen pixels) */
  private _x1: Coordinate = 0 as Coordinate;
  /** Cached Y coordinate of first corner (screen pixels) */
  private _y1: Coordinate = 0 as Coordinate;
  /** Cached X coordinate of second corner (screen pixels) */
  private _x2: Coordinate = 0 as Coordinate;
  /** Cached Y coordinate of second corner (screen pixels) */
  private _y2: Coordinate = 0 as Coordinate;

  /**
   * Creates a new TradeRectangleView
   *
   * @param {TradeRectanglePrimitive} source - Parent primitive containing trade data
   */
  constructor(source: TradeRectanglePrimitive) {
    this._source = source;
  }

  /**
   * Update coordinates by converting trade data to screen coordinates
   *
   * Called by Lightweight Charts when the view needs to be updated (pan, zoom,
   * resize, etc.). Converts trade times and prices to screen coordinates using
   * the chart's time scale and price scale.
   *
   * Conversion process:
   * 1. Get trade data, chart API, and series API from source
   * 2. Convert entry/exit times to X coordinates
   * 3. Convert entry/exit prices to Y coordinates
   * 4. Validate all conversions succeeded
   * 5. Cache coordinates for renderer
   *
   * @remarks
   * - Returns silently if conversion fails (coordinates will be null)
   * - Validates coordinates are finite numbers
   * - Uses direct coordinate conversion (not ChartCoordinateService)
   */
  update() {
    // Step 1: Get required data and API references from parent primitive
    const data = this._source.data();
    const chart = this._source.chart();
    const series = this._source.series();

    // Step 2: Validate all required objects are available
    // Return early if chart isn't ready or data is missing
    if (!chart || !series || !data) {
      return;
    }

    try {
      // Step 3: Get time scale for X coordinate conversion
      // Time scale converts timestamps to horizontal pixel positions
      const timeScale = chart.timeScale();

      // Step 4: Convert trade times to X coordinates (horizontal position)
      // timeToCoordinate returns null if time is outside visible range
      const x1 = timeScale.timeToCoordinate(data.time1);
      const x2 = timeScale.timeToCoordinate(data.time2);

      // Step 5: Convert trade prices to Y coordinates (vertical position)
      // priceToCoordinate returns null if price is outside visible range
      const y1 = series.priceToCoordinate(data.price1);
      const y2 = series.priceToCoordinate(data.price2);

      // Step 6: Validate coordinate conversion succeeded
      // Conversion can fail if times/prices are outside the visible chart range
      if (x1 === null || x2 === null || y1 === null || y2 === null) {
        return;
      }

      // Step 7: Validate coordinates are finite numbers
      // Prevents rendering with NaN or Infinity values
      if (!isFinite(x1) || !isFinite(x2) || !isFinite(y1) || !isFinite(y2)) {
        return;
      }

      // Step 8: Cache converted coordinates for renderer
      // Direct assignment proven to work correctly for trade rectangles
      this._x1 = x1;
      this._y1 = y1;
      this._x2 = x2;
      this._y2 = y2;
    } catch {
      // Silently handle conversion errors
      // Prevents crashes from invalid data or chart state
      return;
    }
  }

  /**
   * Create renderer with current coordinates
   *
   * Called by Lightweight Charts to get the renderer for drawing.
   * Creates a new TradeRectangleRenderer with the current screen coordinates
   * and styling properties from the trade data.
   *
   * @returns {TradeRectangleRenderer} Renderer instance for canvas drawing
   */
  renderer() {
    const data = this._source.data();
    return new TradeRectangleRenderer(
      this._x1,
      this._y1,
      this._x2,
      this._y2,
      data.fillColor,
      data.borderColor,
      data.borderWidth,
      data.opacity
    );
  }
}

/**
 * Trade Rectangle Primitive - Main primitive class for trade visualization
 *
 * Implements ISeriesPrimitive to provide interactive trade rectangle overlays
 * on Lightweight Charts. This class coordinates the view (coordinate conversion),
 * renderer (canvas drawing), and tooltip system (hover interactions).
 *
 * Architecture:
 * - Manages TradeRectangleView for coordinate conversion
 * - Provides hit testing for interactive tooltips
 * - Subscribes to chart events (crosshair, time scale changes)
 * - Integrates with TooltipManager for decoupled tooltip display
 * - Handles proper cleanup to prevent memory leaks
 *
 * Features:
 * - Event-driven coordinate updates on chart pan/zoom
 * - Interactive tooltip display on hover
 * - Template-based tooltip content
 * - Hit test tolerance for easier interaction
 * - Automatic retry logic for coordinate conversion
 * - Proper event listener cleanup
 *
 * @export
 * @class TradeRectanglePrimitive
 * @implements {ISeriesPrimitive}
 *
 * @example
 * ```typescript
 * const rectangleData: TradeRectangleData = {
 *   time1: 1704067200 as UTCTimestamp,
 *   time2: 1704153600 as UTCTimestamp,
 *   price1: 100.0,
 *   price2: 105.0,
 *   fillColor: 'rgba(76, 175, 80, 0.1)',
 *   borderColor: '#4CAF50',
 *   borderWidth: 2,
 *   opacity: 0.2,
 *   isProfitable: true,
 *   tradeId: 'TRADE-001'
 * };
 *
 * const tooltipOptions: TradeRectangleTooltipOptions = {
 *   enabled: true,
 *   priority: 10,
 *   tooltipTemplate: '<div>P&L: $$pnl$$</div>'
 * };
 *
 * const primitive = new TradeRectanglePrimitive(rectangleData, tooltipOptions);
 * series.attachPrimitive(primitive);
 * ```
 */
export class TradeRectanglePrimitive implements ISeriesPrimitive {
  /** Trade rectangle data (entry/exit time/price, colors, etc.) */
  private _data: TradeRectangleData;
  /** Reference to chart API (set when primitive is attached) */
  private _chart: IChartApi | null = null;
  /** Reference to series API (set when primitive is attached) */
  private _series: ISeriesApi<any> | null = null;
  /** View instance handling coordinate conversion */
  private _paneView: TradeRectangleView;
  /** Callback to request view update from Lightweight Charts */
  private _requestUpdate?: () => void;
  /** Time scale change event callback (stored for cleanup) */
  private _timeScaleCallback?: (() => void) | null;
  /** Crosshair move event callback (stored for cleanup) */
  private _crosshairCallback?: ((param: any) => void) | null;
  /** Throttle flag to prevent excessive updates */
  private _updateThrottled: boolean = false;

  /** Unique identifier for this primitive instance */
  private _primitiveId: string;
  /** Tooltip configuration options */
  private _tooltipOptions: TradeRectangleTooltipOptions;

  /**
   * Creates a new TradeRectanglePrimitive
   *
   * @param {TradeRectangleData} data - Trade rectangle data with time/price bounds
   * @param {TradeRectangleTooltipOptions} [tooltipOptions] - Optional tooltip configuration
   */
  constructor(data: TradeRectangleData, tooltipOptions?: TradeRectangleTooltipOptions) {
    // Store trade data
    this._data = data;

    // Create view instance for coordinate conversion
    this._paneView = new TradeRectangleView(this);

    // Generate unique ID for tooltip system
    this._primitiveId = `trade-rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Merge provided options with defaults
    this._tooltipOptions = {
      priority: 10,
      enabled: true,
      customStyle: '',
      ...tooltipOptions,
    };
  }

  /**
   * Update all views (required by ISeriesPrimitive)
   *
   * Called by Lightweight Charts when the primitive needs to recalculate coordinates.
   * Triggers coordinate conversion in the view layer.
   */
  updateAllViews() {
    this._paneView.update();
  }

  /**
   * Get all pane views (required by ISeriesPrimitive)
   *
   * @returns {TradeRectangleView[]} Array containing the single pane view
   */
  paneViews() {
    return [this._paneView];
  }

  /**
   * Get unique primitive identifier
   *
   * Used by TooltipManager to track tooltip requests from this primitive.
   *
   * @returns {string} Unique primitive ID
   */
  getId(): string {
    return this._primitiveId;
  }

  /**
   * Create tooltip HTML content for this trade rectangle
   *
   * Generates HTML content for the tooltip using either a custom template
   * (if provided) or the default tooltip format. All data comes from the
   * backend - no calculations are performed in the frontend.
   *
   * Template processing:
   * 1. If custom template provided, use TradeTemplateProcessor
   * 2. Otherwise, generate default HTML with trade details
   * 3. Apply profitability colors (green for profit, red for loss)
   *
   * @private
   * @returns {string} HTML string for tooltip content
   *
   * @remarks
   * - Uses backend-provided isProfitable flag (no frontend calculations)
   * - Supports template placeholders like $$entry_price$$, $$pnl$$, etc.
   * - Spreads all trade data for maximum template flexibility
   */
  private createTooltipContent(): string {
    // Case 1: Custom template provided - use template processor
    if (this._tooltipOptions.tooltipTemplate) {
      // Prepare template data from trade rectangle
      // All calculations should be done in backend; frontend just displays
      const templateData: TradeTemplateData = {
        tradeType: this._data.tradeType || 'long',
        entryPrice: this._data.price1,
        exitPrice: this._data.price2,
        pnl: this._data.price2 - this._data.price1, // Simple price difference
        pnlPercentage: ((this._data.price2 - this._data.price1) / this._data.price1) * 100,
        quantity: this._data.quantity,
        notes: this._data.notes,
        tradeId: this._data.tradeId,
        entryTime: this._data.time1,
        exitTime: this._data.time2,
        // Spread all additional data for flexible template access
        ...this._data,
      };

      // Process template with trade data
      const result = TradeTemplateProcessor.processTemplate(
        this._tooltipOptions.tooltipTemplate,
        templateData
      );

      return result.content;
    }

    // Case 2: No custom template - generate default tooltip

    // Calculate display values
    const priceDifference = this._data.price2 - this._data.price1;
    const pnl = priceDifference;
    const pnlPercent = ((pnl / this._data.price1) * 100).toFixed(2);

    // Get profitability from backend data (required field)
    const isProfitable = this._data.isProfitable ?? false;
    const side = isProfitable ? 'PROFIT' : 'LOSS';
    const sideColor = isProfitable ? '#00ff88' : '#ff4444';
    const pnlColor = isProfitable ? '#00ff88' : '#ff4444';

    // Get trade direction (supports multiple property names for backward compatibility)
    const tradeDirection = (this._data.tradeType || this._data.trade_type || 'LONG').toUpperCase();

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="
          color: ${sideColor};
          font-weight: bold;
          font-size: 10px;
          margin-bottom: 3px;
        ">
          ${tradeDirection} - ${side}
        </div>
        <div style="font-size: 10px; line-height: 1.3;">
          <div>Entry: $${this._data.price1.toFixed(2)}</div>
          <div>Exit: $${this._data.price2.toFixed(2)}</div>
          <div style="color: ${pnlColor}; font-weight: bold;">
            P&L: $${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} (${pnlPercent}%)
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create tooltip CSS style
   */
  /**
   * Create tooltip CSS styling
   *
   * Generates inline CSS for the tooltip with a modern dark theme.
   * Merges base styles with any custom styles from tooltip options.
   *
   * @private
   * @returns {string} CSS string for tooltip styling
   */
  private createTooltipStyle(): string {
    // Base styling with modern dark theme
    const baseStyle = `
      background: linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(20, 20, 30, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 10px 12px;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      white-space: nowrap;
      min-width: 180px;
    `;

    // Merge custom styles if provided
    return baseStyle + (this._tooltipOptions.customStyle || '');
  }

  /**
   * Hit test to check if mouse coordinates are inside the trade rectangle
   *
   * Performs precise hit testing by converting trade data coordinates to
   * screen coordinates and checking if the mouse position falls within
   * the rectangle bounds (with tolerance buffer).
   *
   * Process:
   * 1. Convert trade times/prices to screen coordinates
   * 2. Calculate rectangle bounds (left, right, top, bottom)
   * 3. Add 2px tolerance buffer for easier interaction
   * 4. Check if mouse (x, y) is within expanded bounds
   *
   * @param {number} x - Mouse X coordinate (screen pixels)
   * @param {number} y - Mouse Y coordinate (screen pixels)
   * @returns {PrimitiveHoveredItem | null} Hit result or null if not hit
   *
   * @remarks
   * - Returns null if chart/series not available
   * - Returns null if coordinate conversion fails
   * - Uses 2px tolerance buffer for better UX
   * - Silently catches and handles any conversion errors
   */
  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    // Step 1: Validate chart and series are available
    if (!this._chart || !this._series) {
      return null;
    }

    try {
      // Step 2: Convert trade data coordinates to screen coordinates
      const timeScale = this._chart.timeScale();
      const x1 = timeScale.timeToCoordinate(this._data.time1);
      const x2 = timeScale.timeToCoordinate(this._data.time2);
      const y1 = this._series.priceToCoordinate(this._data.price1);
      const y2 = this._series.priceToCoordinate(this._data.price2);

      // Step 3: Validate coordinate conversion succeeded
      if (x1 === null || x2 === null || y1 === null || y2 === null) {
        return null;
      }

      // Step 4: Calculate rectangle bounds using min/max
      // This handles any corner orientation (top-left, bottom-right, etc.)
      const rectLeft = Math.min(x1, x2);
      const rectRight = Math.max(x1, x2);
      const rectTop = Math.min(y1, y2);
      const rectBottom = Math.max(y1, y2);

      // Step 5: Add tolerance buffer for easier mouse interaction
      // 2px buffer makes it easier to hover over thin rectangles
      const tolerance = 2;
      const expandedLeft = rectLeft - tolerance;
      const expandedRight = rectRight + tolerance;
      const expandedTop = rectTop - tolerance;
      const expandedBottom = rectBottom + tolerance;

      // Step 6: Check if mouse coordinates fall within expanded bounds
      if (x >= expandedLeft && x <= expandedRight && y >= expandedTop && y <= expandedBottom) {
        // Hit detected - return hover item
        return {
          externalId: this._data.tradeId || 'trade-rectangle',
          zOrder: 'normal',
        };
      }

      // Step 7: No hit detected
      return null;
    } catch {
      // Silently handle any errors during hit testing
      return null;
    }
  }

  /**
   * Handle crosshair move events for tooltip display
   *
   * Called whenever the crosshair moves on the chart. Performs hit testing
   * to determine if the crosshair is over this trade rectangle and requests/hides
   * the tooltip accordingly via the TooltipManager.
   *
   * Process:
   * 1. Validate tooltip is enabled and crosshair point is valid
   * 2. Perform hit test with current crosshair position
   * 3. If hit, request tooltip with content/style
   * 4. If not hit, hide tooltip
   *
   * @private
   * @param {any} param - Crosshair move event parameter with point property
   *
   * @remarks
   * - Returns early if tooltips are disabled
   * - Validates point coordinates are numbers before hit testing
   * - Uses TooltipManager for decoupled tooltip display
   * - Catches and logs hit test errors to prevent tooltip flickering
   */
  private handleCrosshairMove(param: any): void {
    // Step 1: Check if tooltips are enabled
    if (!this._tooltipOptions.enabled) {
      return;
    }

    // Step 2: Validate crosshair point exists and has valid numeric coordinates
    // param.point may be undefined if crosshair is off the chart
    if (!param.point || typeof param.point.x !== 'number' || typeof param.point.y !== 'number') {
      TooltipManager.getInstance().hideTooltip(this._primitiveId);
      return;
    }

    try {
      // Step 3: Perform hit test with crosshair coordinates
      const isHit = this.hitTest(param.point.x, param.point.y);

      if (isHit) {
        // Step 4a: Hit detected - request tooltip display
        // Generate content and style, then send to TooltipManager
        TooltipManager.getInstance().requestTooltip({
          source: this._primitiveId,
          priority: this._tooltipOptions.priority || 10,
          content: this.createTooltipContent(),
          style: this.createTooltipStyle(),
          position: param.point,
          cssClasses: ['trade-tooltip'],
        });
      } else {
        // Step 4b: No hit - hide tooltip
        TooltipManager.getInstance().hideTooltip(this._primitiveId);
      }
    } catch (error) {
      // Step 5: Handle any errors during hit testing
      // Log for debugging but don't show errors to prevent flickering
      logger.warn('Hit test error in crosshair handler', 'TradeRectanglePrimitive', error);
      TooltipManager.getInstance().hideTooltip(this._primitiveId);
    }
  }

  /**
   * Lifecycle: Primitive attached to series
   *
   * Called by Lightweight Charts when this primitive is attached to a series.
   * Sets up chart/series references and subscribes to chart events for
   * coordinate updates and tooltip interactions.
   *
   * Event subscriptions:
   * - Time scale changes (for coordinate re-calculation on pan/zoom)
   * - Crosshair moves (for tooltip display on hover)
   *
   * @param {{ chart: IChartApi; series: ISeriesApi<any>; requestUpdate: () => void }} params
   *   - chart: Chart API reference
   *   - series: Series API reference
   *   - requestUpdate: Callback to request view update
   *
   * @remarks
   * - Stores callbacks for cleanup in detached()
   * - Triggers initial coordinate calculation
   */
  attached({
    chart,
    series,
    requestUpdate,
  }: {
    chart: IChartApi;
    series: ISeriesApi<any>;
    requestUpdate: () => void;
  }) {
    // Step 1: Store API references
    this._chart = chart;
    this._series = series;
    this._requestUpdate = requestUpdate;

    // Step 2: Register chart with coordinate service for consistency
    // This ensures all coordinate conversions use the same service
    const coordinateService = ChartCoordinateService.getInstance();
    const chartId = chart.chartElement()?.id || 'default';
    coordinateService.registerChart(chartId, chart);

    // Step 3: Subscribe to chart events for automatic coordinate updates
    try {
      // Step 3a: Create time scale change callback
      // This triggers coordinate recalculation when user pans or zooms
      this._timeScaleCallback = () => {
        this._requestUpdate?.();
      };

      // Step 3b: Create crosshair move callback
      // This handles both tooltip display and coordinate updates
      this._crosshairCallback = (param: any) => {
        // Handle tooltip display on hover
        this.handleCrosshairMove(param);

        // Throttle coordinate updates to prevent performance issues
        // Crosshair moves frequently, so we limit updates to 10fps
        if (!this._updateThrottled) {
          this._updateThrottled = true;
          setTimeout(() => {
            this._updateThrottled = false;
            this._requestUpdate?.();
          }, 100); // 100ms = 10fps throttle
        }
      };

      // Step 3c: Subscribe to chart events
      // Store callbacks for cleanup in detached()
      chart.timeScale().subscribeVisibleTimeRangeChange(this._timeScaleCallback);
      chart.subscribeCrosshairMove(this._crosshairCallback);
    } catch (error) {
      logger.error('Failed to attach trade rectangle primitive', 'TradeRectanglePrimitive', error);
    }

    // Step 4: Request initial coordinate calculation
    this._requestUpdate();
  }

  /**
   * Lifecycle: Primitive detached from series
   *
   * Called by Lightweight Charts when this primitive is detached from a series.
   * Performs cleanup to prevent memory leaks:
   * - Hides any active tooltips
   * - Unsubscribes from chart events
   * - Clears API references
   *
   * @remarks
   * - Critical for preventing memory leaks
   * - Errors during cleanup are logged but don't throw
   * - Nulls out all callbacks and references
   */
  detached() {
    // Step 1: Hide any active tooltips
    // This prevents orphaned tooltips from staying visible after primitive is removed
    TooltipManager.getInstance().hideTooltip(this._primitiveId);

    // Step 2: Unsubscribe from time scale events (pan/zoom)
    if (this._chart && this._timeScaleCallback) {
      try {
        this._chart.timeScale().unsubscribeVisibleTimeRangeChange(this._timeScaleCallback);
        this._timeScaleCallback = null;
      } catch (error) {
        // Log error but continue cleanup - don't let one failure stop the rest
        logger.error(
          'Failed to unsubscribe from time scale events',
          'TradeRectanglePrimitive',
          error
        );
      }
    }

    // Step 3: Unsubscribe from crosshair events (hover)
    if (this._chart && this._crosshairCallback) {
      try {
        this._chart.unsubscribeCrosshairMove(this._crosshairCallback);
        this._crosshairCallback = null;
      } catch (error) {
        // Log error but continue cleanup
        logger.error(
          'Failed to unsubscribe from crosshair events',
          'TradeRectanglePrimitive',
          error
        );
      }
    }

    // Step 4: Clear all references to allow garbage collection
    // This prevents memory leaks by breaking any circular references
    this._chart = null;
    this._series = null;
    this._requestUpdate = undefined;
    this._updateThrottled = false;
  }

  /**
   * Get trade rectangle data
   *
   * @returns {TradeRectangleData} The trade data for this rectangle
   */
  data(): TradeRectangleData {
    return this._data;
  }

  /**
   * Get chart API reference
   *
   * @returns {IChartApi | null} Chart API or null if not attached
   */
  chart(): IChartApi | null {
    return this._chart;
  }

  /**
   * Get series API reference
   *
   * @returns {ISeriesApi<any> | null} Series API or null if not attached
   */
  series(): ISeriesApi<any> | null {
    return this._series;
  }

  /**
   * Update trade rectangle data
   *
   * Updates the trade data and requests a view update to reflect the changes.
   * Merges new data with existing data, allowing partial updates.
   *
   * @param {Partial<TradeRectangleData>} newData - Partial trade data to update
   *
   * @example
   * ```typescript
   * // Update only colors to reflect new profitability
   * primitive.updateData({
   *   fillColor: 'rgba(76, 175, 80, 0.1)',
   *   borderColor: '#4CAF50',
   *   isProfitable: true
   * });
   * ```
   */
  updateData(newData: Partial<TradeRectangleData>) {
    // Merge new data with existing data
    this._data = { ...this._data, ...newData };

    // Request view update to recalculate coordinates and redraw
    if (this._requestUpdate) {
      this._requestUpdate();
    }
  }
}

/**
 * Factory function for creating trade rectangle primitives
 *
 * Converts an array of trade data into TradeRectanglePrimitive instances
 * with appropriate styling based on profitability. This is a convenience
 * function for bulk creation of trade rectangles.
 *
 * Process:
 * 1. For each trade, calculate profitability
 * 2. Apply colors based on profit/loss
 * 3. Create TradeRectangleData with all required fields
 * 4. Instantiate TradeRectanglePrimitive with data and tooltip options
 *
 * @export
 * @param {Array<TradeInput>} trades - Array of trade objects with entry/exit data
 * @param {TradeRectangleTooltipOptions} [tooltipOptions] - Optional tooltip configuration
 * @returns {TradeRectanglePrimitive[]} Array of primitives ready to attach to series
 *
 * @example
 * ```typescript
 * const trades = [
 *   {
 *     entryTime: '2024-01-01',
 *     exitTime: '2024-01-02',
 *     entryPrice: 100,
 *     exitPrice: 105,
 *     isProfitable: true
 *   }
 * ];
 *
 * const primitives = createTradeRectanglePrimitives(trades, {
 *   enabled: true,
 *   priority: 10
 * });
 *
 * primitives.forEach(p => series.attachPrimitive(p));
 * ```
 */
export function createTradeRectanglePrimitives(
  trades: Array<{
    entryTime: string | UTCTimestamp;
    exitTime?: string | UTCTimestamp;
    entryPrice: number;
    exitPrice: number;
    fillColor?: string;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
    label?: string;
  }>,
  chartData?: any[],
  tooltipOptions?: TradeRectangleTooltipOptions
): TradeRectanglePrimitive[] {
  const primitives: TradeRectanglePrimitive[] = [];

  trades.forEach(trade => {
    // Parse times
    let time1: UTCTimestamp;
    let time2: UTCTimestamp;

    if (typeof trade.entryTime === 'string') {
      time1 = Math.floor(new Date(trade.entryTime).getTime() / 1000) as UTCTimestamp;
    } else {
      time1 = trade.entryTime;
    }

    if (trade.exitTime) {
      if (typeof trade.exitTime === 'string') {
        time2 = Math.floor(new Date(trade.exitTime).getTime() / 1000) as UTCTimestamp;
      } else {
        time2 = trade.exitTime;
      }
    } else if (chartData && chartData.length > 0) {
      // Use last available time for open trades
      const lastTime = chartData[chartData.length - 1]?.time;
      if (lastTime) {
        time2 =
          typeof lastTime === 'string'
            ? (Math.floor(new Date(lastTime).getTime() / 1000) as UTCTimestamp)
            : lastTime;
      } else {
        return; // Skip if no exit time available
      }
    } else {
      return; // Skip if no exit time available
    }

    const rectangleData: TradeRectangleData = {
      time1,
      time2,
      price1: trade.entryPrice,
      price2: trade.exitPrice,
      fillColor: trade.fillColor || 'rgba(0, 150, 136, 0.2)',
      borderColor: trade.borderColor || 'rgb(0, 150, 136)',
      borderWidth: trade.borderWidth || 1,
      opacity: trade.opacity || 0.2,
      label: trade.label,
    };

    primitives.push(new TradeRectanglePrimitive(rectangleData, tooltipOptions));
  });

  return primitives;
}
