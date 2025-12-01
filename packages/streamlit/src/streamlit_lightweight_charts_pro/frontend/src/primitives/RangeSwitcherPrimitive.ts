/**
 * @fileoverview Range Switcher Primitive
 *
 * Interactive time range switching buttons for chart navigation. Provides
 * predefined and custom time ranges with automatic chart updates.
 *
 * This primitive is responsible for:
 * - Rendering clickable time range buttons
 * - Switching visible time ranges (1D, 1W, 1M, etc.)
 * - Highlighting active range
 * - Custom range configuration
 * - Corner positioning with automatic stacking
 * - React portal rendering
 *
 * Architecture:
 * - Extends BasePanePrimitive for core functionality
 * - React portal for DOM management
 * - Integration with CornerLayoutManager
 * - Predefined range configurations
 * - Support for custom ranges
 *
 * Predefined Ranges:
 * - Trading: 1D, 1W, 1M, 3M, 6M, 1Y, All
 * - Crypto: 1H, 4H, 1D, 1W, 1M, All
 * - Long-term: 1M, 3M, 6M, 1Y, 2Y, 5Y, All
 *
 * @example
 * ```typescript
 * const switcher = new RangeSwitcherPrimitive('switcher-1', {
 *   corner: 'top-right',
 *   ranges: [
 *     { text: '1D', range: TimeRange.ONE_DAY },
 *     { text: '1W', range: TimeRange.ONE_WEEK },
 *     { text: 'All', range: null }
 *   ]
 * });
 *
 * pane.attachPrimitive(switcher);
 * ```
 */

import { BasePanePrimitive, BasePrimitiveConfig, PrimitivePriority } from './BasePanePrimitive';
import { Time } from 'lightweight-charts';
import {
  TimeRangeSeconds,
  DefaultRangeSwitcherConfig,
  ButtonColors,
  ButtonDimensions,
  ButtonEffects,
  ButtonSpacing,
  CommonValues,
} from './PrimitiveDefaults';
import { PrimitiveStylingUtils, BaseStyleConfig } from './PrimitiveStylingUtils';

/**
 * Predefined time range values for easy configuration
 */

export enum TimeRange {
  FIVE_MINUTES = 'FIVE_MINUTES',
  FIFTEEN_MINUTES = 'FIFTEEN_MINUTES',
  THIRTY_MINUTES = 'THIRTY_MINUTES',
  ONE_HOUR = 'ONE_HOUR',
  FOUR_HOURS = 'FOUR_HOURS',
  ONE_DAY = 'ONE_DAY',
  ONE_WEEK = 'ONE_WEEK',
  TWO_WEEKS = 'TWO_WEEKS',
  ONE_MONTH = 'ONE_MONTH',
  THREE_MONTHS = 'THREE_MONTHS',
  SIX_MONTHS = 'SIX_MONTHS',
  ONE_YEAR = 'ONE_YEAR',
  TWO_YEARS = 'TWO_YEARS',
  FIVE_YEARS = 'FIVE_YEARS',
  ALL = 'ALL',
}

/**
 * Range configuration for time switching
 * Supports both enum values and custom seconds for flexibility
 */
export interface RangeConfig {
  /**
   * Display text for the range
   */
  text: string;

  /**
   * Time range - can be enum value or custom seconds
   * Use TimeRange enum for predefined ranges, or number for custom seconds
   * Use null or TimeRange.ALL for "All" range
   */
  range: TimeRange | number | null;

  /**
   * @deprecated Use 'range' instead. This is kept for backwards compatibility.
   */
  seconds?: number | null;
}

/**
 * Get the range value from a RangeConfig, supporting both new and legacy formats
 */
export function getRangeValue(rangeConfig: RangeConfig): TimeRange | number | null {
  // Support new 'range' property first
  if (rangeConfig.range !== undefined) {
    return rangeConfig.range;
  }
  // Fall back to legacy 'seconds' property for backwards compatibility
  return rangeConfig.seconds || null;
}

/**
 * Check if a range represents "All" (show all data)
 */
export function isAllRange(rangeConfig: RangeConfig): boolean {
  const range = getRangeValue(rangeConfig);
  return range === null || range === TimeRange.ALL;
}

/**
 * Convert TimeRange enum or value to seconds
 */
export function getSecondsFromRange(range: TimeRange | number | null): number | null {
  if (range === null || range === TimeRange.ALL) {
    return null;
  }

  if (typeof range === 'number') {
    return range;
  }

  // Map enum values to seconds using the existing TimeRangeSeconds constants
  switch (range) {
    case TimeRange.FIVE_MINUTES:
      return TimeRangeSeconds.FIVE_MINUTES;
    case TimeRange.FIFTEEN_MINUTES:
      return TimeRangeSeconds.FIFTEEN_MINUTES;
    case TimeRange.THIRTY_MINUTES:
      return 1800; // 30 minutes
    case TimeRange.ONE_HOUR:
      return TimeRangeSeconds.ONE_HOUR;
    case TimeRange.FOUR_HOURS:
      return TimeRangeSeconds.FOUR_HOURS;
    case TimeRange.ONE_DAY:
      return TimeRangeSeconds.ONE_DAY;
    case TimeRange.ONE_WEEK:
      return TimeRangeSeconds.ONE_WEEK;
    case TimeRange.TWO_WEEKS:
      return TimeRangeSeconds.ONE_WEEK * 2;
    case TimeRange.ONE_MONTH:
      return TimeRangeSeconds.ONE_MONTH;
    case TimeRange.THREE_MONTHS:
      return TimeRangeSeconds.THREE_MONTHS;
    case TimeRange.SIX_MONTHS:
      return TimeRangeSeconds.SIX_MONTHS;
    case TimeRange.ONE_YEAR:
      return TimeRangeSeconds.ONE_YEAR;
    case TimeRange.TWO_YEARS:
      return TimeRangeSeconds.ONE_YEAR * 2;
    case TimeRange.FIVE_YEARS:
      return TimeRangeSeconds.FIVE_YEARS;
    default:
      return null;
  }
}

/**
 * Configuration for RangeSwitcherPrimitive
 */
export interface RangeSwitcherPrimitiveConfig extends BasePrimitiveConfig {
  /**
   * Available time ranges
   */
  ranges: RangeConfig[];

  /**
   * Callback when range changes
   */
  onRangeChange?: (_range: RangeConfig, _index: number) => void;

  /**
   * Range switcher styling
   */
  style?: BasePrimitiveConfig['style'] & {
    /**
     * Button styling
     */
    button?: {
      backgroundColor?: string;
      color?: string;
      hoverBackgroundColor?: string;
      hoverColor?: string;
      border?: string;
      borderRadius?: number;
      padding?: string;
      margin?: string;
      fontSize?: number;
      fontWeight?: string | number;
      minWidth?: number;
    };

    /**
     * Container styling
     */
    container?: {
      display?: 'flex' | 'block';
      flexDirection?: 'row' | 'column';
      gap?: number;
      alignItems?: string;
      justifyContent?: string;
    };
  };
}

/**
 * RangeSwitcherPrimitive - A lightweight-charts pane primitive for time range switching
 *
 * This primitive provides:
 * - Interactive time range buttons (1D, 7D, 1M, 3M, 1Y, All)
 * - Chart-level positioning (typically top-right corner)
 * - Automatic chart time scale updates
 * - Configurable styling and ranges
 * - Event integration for range changes
 *
 * Example usage:
 * ```typescript
 * const rangeSwitcher = new RangeSwitcherPrimitive('range-switcher', {
 *   corner: 'top-right',
 *   priority: PrimitivePriority.RANGE_SWITCHER,
 *   ranges: [
 *     { text: '1D', seconds: 86400 },
 *     { text: '7D', seconds: 604800 },
 *     { text: '1M', seconds: 2592000 },
 *     { text: 'All', seconds: null }
 *   ],
 *   onRangeChange: (range) => {
 *     // Range changed to: range.text
 *   }
 * })
 *
 * // Add to chart (chart-level, not pane-specific)
 * chart.attachPrimitive(rangeSwitcher)
 * ```
 */
export class RangeSwitcherPrimitive extends BasePanePrimitive<RangeSwitcherPrimitiveConfig> {
  private buttonElements: HTMLElement[] = [];
  private buttonEventCleanupFunctions: (() => void)[] = [];
  private dataTimespan: number | null = null; // Cached data timespan in seconds
  private initialVisibilitySetupComplete: boolean = false; // Track if initial setup is done
  private dataChangeIntervalId: NodeJS.Timeout | null = null; // Store interval ID for cleanup

  constructor(id: string, config: RangeSwitcherPrimitiveConfig) {
    // Set default priority and configuration for range switchers
    const configWithDefaults: RangeSwitcherPrimitiveConfig = {
      ...config,
      priority: config.priority ?? PrimitivePriority.RANGE_SWITCHER,
      visible: config.visible ?? true,
      style: {
        backgroundColor: 'transparent',
        padding: DefaultRangeSwitcherConfig.layout.CONTAINER_PADDING,
        container: {
          display: 'flex',
          flexDirection: DefaultRangeSwitcherConfig.layout.FLEX_DIRECTION,
          gap: DefaultRangeSwitcherConfig.layout.CONTAINER_GAP,
          alignItems: DefaultRangeSwitcherConfig.layout.ALIGN_ITEMS,
          justifyContent: DefaultRangeSwitcherConfig.layout.JUSTIFY_CONTENT,
        },
        button: {
          backgroundColor: ButtonColors.DEFAULT_BACKGROUND,
          color: ButtonColors.DEFAULT_COLOR,
          hoverBackgroundColor: ButtonColors.HOVER_BACKGROUND,
          hoverColor: ButtonColors.HOVER_COLOR,
          border: ButtonEffects.DEFAULT_BORDER,
          borderRadius: ButtonDimensions.BORDER_RADIUS,
          padding: ButtonSpacing.RANGE_BUTTON_PADDING,
          margin: '0 2px',
          fontSize: ButtonDimensions.RANGE_FONT_SIZE,
          fontWeight: 500,
          minWidth: ButtonDimensions.MIN_WIDTH_RANGE,
        },
        ...config.style,
      },
    };

    super(id, configWithDefaults);
  }

  // ===== BasePanePrimitive Implementation =====

  /**
   * Get the template string (not used for interactive elements)
   */
  protected getTemplate(): string {
    return ''; // Range switcher is fully interactive, no template needed
  }

  /**
   * Render the range switcher buttons
   */
  protected renderContent(): void {
    if (!this.containerElement) return;

    // If buttons are already rendered, don't recreate them
    if (this.buttonElements.length > 0) {
      return;
    }

    // Clean up existing event listeners
    this.cleanupButtonEventListeners();

    // Clear existing content
    this.containerElement.innerHTML = '';
    this.buttonElements = [];

    // Create container for buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'range-switcher-container';
    this.applyContainerStyling(buttonContainer);

    // Create buttons for each range (filtering is now done server-side)
    this.config.ranges.forEach((range, index) => {
      const button = this.createRangeButton(range, index);
      buttonContainer.appendChild(button);
      this.buttonElements.push(button);
    });

    this.containerElement.appendChild(buttonContainer);
  }

  /**
   * Create a single range button
   */
  private createRangeButton(range: RangeConfig, index: number): HTMLElement {
    const button = this.createButtonElement(range, index);
    this.applyButtonStyling(button, false);
    this.attachButtonEventHandlers(button, index);
    return button;
  }

  /**
   * Create the basic button element with attributes
   */
  private createButtonElement(range: RangeConfig, index: number): HTMLElement {
    const button = document.createElement('button');
    button.className = 'range-button';
    button.textContent = range.text;
    button.setAttribute('data-range-index', index.toString());
    button.setAttribute('aria-label', `Switch to ${range.text} time range`);

    // Add data attributes for debugging and testing
    const rangeValue = getRangeValue(range);
    const seconds = getSecondsFromRange(rangeValue);
    if (seconds !== null) {
      button.setAttribute('data-range-seconds', seconds.toString());
    }

    return button;
  }

  /**
   * Attach event handlers to range button
   */
  private attachButtonEventHandlers(button: HTMLElement, index: number): void {
    const eventHandlers = this.createButtonEventHandlers(button, index);

    // Add event listeners
    button.addEventListener('click', eventHandlers.click);
    button.addEventListener('mouseenter', eventHandlers.mouseEnter);
    button.addEventListener('mouseleave', eventHandlers.mouseLeave);

    // Store cleanup function
    const cleanup = () => {
      button.removeEventListener('click', eventHandlers.click);
      button.removeEventListener('mouseenter', eventHandlers.mouseEnter);
      button.removeEventListener('mouseleave', eventHandlers.mouseLeave);
    };
    this.buttonEventCleanupFunctions.push(cleanup);
  }

  /**
   * Create event handler functions for range button
   */
  private createButtonEventHandlers(
    button: HTMLElement,
    index: number
  ): {
    click: (_e: Event) => void;
    mouseEnter: () => void;
    mouseLeave: () => void;
  } {
    return {
      click: (_e: Event) => {
        _e.preventDefault();
        _e.stopPropagation();
        this.handleRangeClick(index);
      },
      mouseEnter: () => {
        this.applyButtonStyling(button, false, true);
      },
      mouseLeave: () => {
        this.applyButtonStyling(button, false, false);
      },
    };
  }

  /**
   * Clean up button event listeners
   */
  private cleanupButtonEventListeners(): void {
    this.buttonEventCleanupFunctions.forEach(cleanup => cleanup());
    this.buttonEventCleanupFunctions = [];
  }

  /**
   * Apply container styling
   */
  private applyContainerStyling(container: HTMLElement): void {
    const style = container.style;
    const containerConfig = this.config.style?.container;

    if (containerConfig) {
      if (containerConfig.display) style.display = containerConfig.display;
      if (containerConfig.flexDirection) style.flexDirection = containerConfig.flexDirection;
      if (containerConfig.gap) style.gap = `${containerConfig.gap}px`;
      if (containerConfig.alignItems) style.alignItems = containerConfig.alignItems;
      if (containerConfig.justifyContent) style.justifyContent = containerConfig.justifyContent;
    }

    // Ensure interactive elements can receive events
    style.pointerEvents = 'auto';
  }

  /**
   * Apply button styling using standardized utilities
   */
  private applyButtonStyling(
    button: HTMLElement,
    isActive: boolean,
    isHover: boolean = false
  ): void {
    const buttonConfig = this.config.style?.button;

    if (buttonConfig) {
      // Prepare base styles with compact, professional appearance
      const baseStyles: BaseStyleConfig = {
        border: buttonConfig.border || ButtonEffects.RANGE_BORDER,
        borderRadius: buttonConfig.borderRadius || 4, // Rounded corners for modern look
        padding: buttonConfig.padding || ButtonSpacing.RANGE_BUTTON_PADDING,
        margin: buttonConfig.margin || ButtonSpacing.RANGE_BUTTON_MARGIN,
        fontSize: buttonConfig.fontSize || 11, // Slightly smaller font for compactness
        fontWeight: buttonConfig.fontWeight || CommonValues.FONT_WEIGHT_MEDIUM,
        backgroundColor: buttonConfig.backgroundColor || 'rgba(255, 255, 255, 0.9)',
        color: buttonConfig.color || '#666',
        cursor: CommonValues.POINTER,
        transition: ButtonEffects.DEFAULT_TRANSITION,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', // Subtle shadow for depth
      };

      // Prepare state-specific styles
      const stateStyles: BaseStyleConfig = {};

      if (isHover) {
        stateStyles.backgroundColor = buttonConfig.hoverBackgroundColor || 'rgba(255, 255, 255, 1)';
        stateStyles.color = buttonConfig.hoverColor || '#333';
        stateStyles.boxShadow = ButtonEffects.RANGE_HOVER_BOX_SHADOW;
        stateStyles.transform = 'translateY(-1px)'; // Subtle lift effect
      }

      // Determine state for styling utils
      const state = isHover ? 'hover' : 'default';

      // Apply styles using standardized utilities
      PrimitiveStylingUtils.applyInteractionState(button, baseStyles, stateStyles, state);

      // Set minimum width if specified
      if (buttonConfig.minWidth) {
        button.style.minWidth = `${buttonConfig.minWidth}px`;
      }
    }
  }

  /**
   * Handle range button click
   */
  private handleRangeClick(index: number): void {
    // Apply range to chart
    this.applyRangeToChart(this.config.ranges[index]);

    // Emit range change event
    if (this.config.onRangeChange) {
      this.config.onRangeChange(this.config.ranges[index], index);
    }

    // Emit custom event through event manager
    if (this.eventManager) {
      this.eventManager.emitCustomEvent('rangeChange', {
        range: this.config.ranges[index],
        index: index,
      });
    }
  }

  /**
   * Apply range to chart time scale
   */
  private applyRangeToChart(range: RangeConfig): void {
    if (!this.chart) return;

    try {
      const timeScale = this.chart.timeScale();

      const rangeValue = getRangeValue(range);
      const seconds = getSecondsFromRange(rangeValue);

      if (seconds === null) {
        // "All" range - fit all content
        timeScale.fitContent();
      } else {
        // Specific time range - use current visible range or current time
        const currentRange = timeScale.getVisibleRange();
        let endTime: number;

        if (currentRange && currentRange.to) {
          // Use the current visible end time as reference
          endTime = currentRange.to as number;
        } else {
          // Fallback to current time
          endTime = Date.now() / 1000;
        }

        const fromTime = endTime - seconds;

        timeScale.setVisibleRange({
          from: fromTime as Time,
          to: endTime as Time,
        });
      }
    } catch {
      // Silently handle chart range application errors
    }
  }

  /**
   * Get the timespan of available data in seconds
   */
  private getDataTimespan(): number | null {
    if (!this.chart) return null;

    // Return cached value if available
    if (this.dataTimespan !== null) {
      return this.dataTimespan;
    }

    try {
      const timeScale = this.chart.timeScale();

      // Store current visible range to restore it later
      const currentRange = timeScale.getVisibleRange();

      // Use fitContent to get the full data range for button visibility decisions
      // This ensures buttons are hidden based on total data availability, not current zoom level
      timeScale.fitContent();
      const fullRange = timeScale.getVisibleRange();

      // Restore the original range immediately to avoid interfering with user view
      if (currentRange) {
        timeScale.setVisibleRange(currentRange);
      }

      if (!fullRange || !fullRange.from || !fullRange.to) return null;

      // Calculate timespan in seconds
      const timespanSeconds = (fullRange.to as number) - (fullRange.from as number);

      // Cache the result for performance
      this.dataTimespan = timespanSeconds;

      return timespanSeconds;
    } catch {
      // Return null if we can't determine data timespan
      return null;
    }
  }

  /**
   * Check if a range is valid for the current data
   */
  private isRangeValidForData(range: RangeConfig): boolean {
    const rangeValue = getRangeValue(range);

    // "All" range is always valid
    if (isAllRange(range)) {
      return true;
    }

    const rangeSeconds = getSecondsFromRange(rangeValue);
    if (rangeSeconds === null) {
      return true; // Unknown ranges are considered valid
    }

    const dataTimespan = this.getDataTimespan();
    if (dataTimespan === null) {
      return true; // If we can't determine data timespan, show all ranges
    }

    // Hide ranges that are significantly larger than available data
    // Add a 10% buffer to account for minor timing differences
    const bufferMultiplier = 1.1;
    return rangeSeconds <= dataTimespan * bufferMultiplier;
  }

  /**
   * Get CSS class name for the container
   */
  protected getContainerClassName(): string {
    return 'range-switcher-primitive';
  }

  /**
   * Override pane ID - range switcher is chart-level (pane 0)
   */
  protected getPaneId(): number {
    return 0; // Always chart-level
  }

  // ===== Lifecycle Hooks =====

  /**
   * Override detached to ensure proper cleanup
   */
  public detached(): void {
    if (this.dataChangeIntervalId) {
      clearInterval(this.dataChangeIntervalId);
      this.dataChangeIntervalId = null;
    }
    this.cleanupButtonEventListeners();
    super.detached();
  }

  /**
   * Setup custom event subscriptions
   */
  protected setupCustomEventSubscriptions(): void {
    if (!this.eventManager) return;

    // Note: timeScale subscription intentionally removed - it was hiding buttons on every zoom

    // Subscribe to data updates to refresh range visibility (but not timeScale changes)
    const dataUpdateSub = this.eventManager.subscribe('dataUpdate', () => {
      this.handleDataUpdate();
    });
    this.eventSubscriptions.push(dataUpdateSub);
  }

  /**
   * Handle data updates that might affect range visibility
   * Only processes during initial setup, not after user interactions
   */
  private handleDataUpdate(): void {
    if (this.mounted && !this.initialVisibilitySetupComplete) {
      this.invalidateDataTimespan();
      // Update button visibility without full re-render
      this.updateRangeButtonVisibility();
    }
  }

  /**
   * Update range button visibility based on current data
   * Only hides buttons during initial setup, not after user interactions
   */
  private updateRangeButtonVisibility(): void {
    // Only hide buttons during initial setup, not after user interactions
    if (this.initialVisibilitySetupComplete) {
      return;
    }

    // Check each range and update button visibility
    this.config.ranges.forEach((range, index) => {
      const button = this.buttonElements[index];
      if (button) {
        if (this.isRangeValidForData(range)) {
          button.style.display = ''; // Show the button
          button.removeAttribute('data-hidden-reason');
        } else {
          button.style.display = 'none'; // Hide the button
          button.setAttribute('data-hidden-reason', 'exceeds-data-range');
        }
      }
    });
  }

  /**
   * Called when container is created
   */
  protected onContainerCreated(container: HTMLElement): void {
    // Ensure container allows pointer events for buttons
    container.style.pointerEvents = 'auto';

    // Set up mutation observer to detect data changes
    this.setupDataChangeObserver();
  }

  /**
   * Set up observer to detect chart data changes
   */
  private setupDataChangeObserver(): void {
    if (!this.chart) return;

    // Use a timeout to periodically check for data changes during initial setup only
    // This is more reliable than trying to intercept all possible data update events
    const checkDataChanges = () => {
      if (this.mounted && !this.initialVisibilitySetupComplete) {
        const currentTimespan = this.getDataTimespan();
        if (currentTimespan !== this.dataTimespan) {
          this.updateRangeButtonVisibility();
        }
      }
    };

    // Check every 1 second for data changes (only during initial setup)
    this.dataChangeIntervalId = setInterval(checkDataChanges, 1000);
  }

  // ===== Public API =====

  /**
   * Add a new range
   */
  public addRange(range: RangeConfig): void {
    this.config.ranges.push(range);
    if (this.mounted) {
      this.invalidateDataTimespan(); // Clear cache when ranges change
      this.renderContent(); // Full re-render needed for new buttons
    }
  }

  /**
   * Remove a range by index
   */
  public removeRange(index: number): void {
    if (index < 0 || index >= this.config.ranges.length) return;

    this.config.ranges.splice(index, 1);

    if (this.mounted) {
      this.renderContent();
    }
  }

  /**
   * Update ranges
   */
  public updateRanges(ranges: RangeConfig[]): void {
    this.config.ranges = ranges;

    if (this.mounted) {
      this.invalidateDataTimespan(); // Clear cache when ranges change
      this.renderContent(); // Full re-render needed for new button set
    }
  }

  /**
   * Invalidate cached data timespan (call when data changes)
   */
  public invalidateDataTimespan(): void {
    this.dataTimespan = null;
  }

  /**
   * Get the current data timespan in seconds
   */
  public getDataTimespanSeconds(): number | null {
    return this.getDataTimespan();
  }

  /**
   * Force update of range button visibility
   * Useful when called externally after data changes
   */
  public updateButtonVisibility(): void {
    if (this.mounted && !this.initialVisibilitySetupComplete) {
      this.invalidateDataTimespan();
      this.updateRangeButtonVisibility();
    }
  }

  /**
   * Get information about hidden ranges
   */
  public getHiddenRanges(): Array<{ range: RangeConfig; index: number; reason: string }> {
    const hiddenRanges: Array<{ range: RangeConfig; index: number; reason: string }> = [];

    this.config.ranges.forEach((range, index) => {
      if (!this.isRangeValidForData(range)) {
        hiddenRanges.push({
          range,
          index,
          reason: 'exceeds-data-range',
        });
      }
    });

    return hiddenRanges;
  }

  /**
   * Get information about visible ranges
   */
  public getVisibleRangeInfo(): Array<{
    range: RangeConfig;
    index: number;
    dataTimespan: number | null;
  }> {
    const dataTimespan = this.getDataTimespan();

    return this.config.ranges
      .map((range, index) => ({ range, index, dataTimespan }))
      .filter(({ range }) => this.isRangeValidForData(range));
  }

  /**
   * Programmatically trigger range change
   */
  public triggerRangeChange(index: number): void {
    this.handleRangeClick(index);
  }
}

/**
 * Factory function to create range switcher primitives
 */
export function createRangeSwitcherPrimitive(
  id: string,
  config: Partial<RangeSwitcherPrimitiveConfig> & { ranges: RangeConfig[]; corner: any }
): RangeSwitcherPrimitive {
  return new RangeSwitcherPrimitive(id, config as RangeSwitcherPrimitiveConfig);
}

/**
 * Default range configurations using the new enum system
 * Easier to use and less error-prone than manual seconds configuration
 */
export const DefaultRangeConfigs = {
  /**
   * Standard trading ranges (using enum)
   */
  trading: [
    { text: '1D', range: TimeRange.ONE_DAY },
    { text: '7D', range: TimeRange.ONE_WEEK },
    { text: '1M', range: TimeRange.ONE_MONTH },
    { text: '3M', range: TimeRange.THREE_MONTHS },
    { text: '1Y', range: TimeRange.ONE_YEAR },
    { text: 'All', range: TimeRange.ALL },
  ],

  /**
   * Short-term trading ranges (using enum)
   */
  shortTerm: [
    { text: '5M', range: TimeRange.FIVE_MINUTES },
    { text: '15M', range: TimeRange.FIFTEEN_MINUTES },
    { text: '30M', range: TimeRange.THIRTY_MINUTES },
    { text: '1H', range: TimeRange.ONE_HOUR },
    { text: '4H', range: TimeRange.FOUR_HOURS },
    { text: '1D', range: TimeRange.ONE_DAY },
    { text: 'All', range: TimeRange.ALL },
  ],

  /**
   * Long-term investment ranges (using enum)
   */
  longTerm: [
    { text: '1M', range: TimeRange.ONE_MONTH },
    { text: '3M', range: TimeRange.THREE_MONTHS },
    { text: '6M', range: TimeRange.SIX_MONTHS },
    { text: '1Y', range: TimeRange.ONE_YEAR },
    { text: '2Y', range: TimeRange.TWO_YEARS },
    { text: '5Y', range: TimeRange.FIVE_YEARS },
    { text: 'All', range: TimeRange.ALL },
  ],

  /**
   * Custom minimal ranges (using enum)
   */
  minimal: [
    { text: '1D', range: TimeRange.ONE_DAY },
    { text: '1W', range: TimeRange.ONE_WEEK },
    { text: '1M', range: TimeRange.ONE_MONTH },
    { text: 'All', range: TimeRange.ALL },
  ],

  /**
   * @deprecated Legacy configurations (kept for backwards compatibility)
   * Use the enum-based configurations above for new implementations
   */
  legacy: {
    trading: [
      { text: '1D', seconds: TimeRangeSeconds.ONE_DAY },
      { text: '7D', seconds: TimeRangeSeconds.ONE_WEEK },
      { text: '1M', seconds: TimeRangeSeconds.ONE_MONTH },
      { text: '3M', seconds: TimeRangeSeconds.THREE_MONTHS },
      { text: '1Y', seconds: TimeRangeSeconds.ONE_YEAR },
      { text: 'All', seconds: null as number | null },
    ],
    shortTerm: [
      { text: '5M', seconds: TimeRangeSeconds.FIVE_MINUTES },
      { text: '15M', seconds: TimeRangeSeconds.FIFTEEN_MINUTES },
      { text: '1H', seconds: TimeRangeSeconds.ONE_HOUR },
      { text: '4H', seconds: TimeRangeSeconds.FOUR_HOURS },
      { text: '1D', seconds: TimeRangeSeconds.ONE_DAY },
      { text: 'All', seconds: null as number | null },
    ],
    longTerm: [
      { text: '1M', seconds: TimeRangeSeconds.ONE_MONTH },
      { text: '3M', seconds: TimeRangeSeconds.THREE_MONTHS },
      { text: '6M', seconds: TimeRangeSeconds.SIX_MONTHS },
      { text: '1Y', seconds: TimeRangeSeconds.ONE_YEAR },
      { text: '5Y', seconds: TimeRangeSeconds.FIVE_YEARS },
      { text: 'All', seconds: null as number | null },
    ],
    minimal: [
      { text: '1D', seconds: TimeRangeSeconds.ONE_DAY },
      { text: '1W', seconds: TimeRangeSeconds.ONE_WEEK },
      { text: '1M', seconds: TimeRangeSeconds.ONE_MONTH },
      { text: 'All', seconds: null as number | null },
    ],
  },
} as const;
