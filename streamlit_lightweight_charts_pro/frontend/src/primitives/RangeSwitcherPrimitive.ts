import { BasePanePrimitive, BasePrimitiveConfig, PrimitivePriority } from './BasePanePrimitive'
import { Time } from 'lightweight-charts'
import {
  TimeRangeSeconds,
  DefaultRangeSwitcherConfig,
  ButtonColors,
  ButtonDimensions,
  ButtonEffects,
  ButtonSpacing,
  CommonValues
} from './PrimitiveDefaults'
import { PrimitiveStylingUtils, BaseStyleConfig } from './PrimitiveStylingUtils'

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
  ALL = 'ALL'
}

/**
 * Range configuration for time switching
 * Supports both enum values and custom seconds for flexibility
 */
export interface RangeConfig {
  /**
   * Display text for the range
   */
  text: string

  /**
   * Time range - can be enum value or custom seconds
   * Use TimeRange enum for predefined ranges, or number for custom seconds
   * Use null or TimeRange.ALL for "All" range
   */
  range: TimeRange | number | null

  /**
   * @deprecated Use 'range' instead. This is kept for backwards compatibility.
   */
  seconds?: number | null

}

/**
 * Get the range value from a RangeConfig, supporting both new and legacy formats
 */
export function getRangeValue(rangeConfig: RangeConfig): TimeRange | number | null {
  // Support new 'range' property first
  if (rangeConfig.range !== undefined) {
    return rangeConfig.range
  }
  // Fall back to legacy 'seconds' property for backwards compatibility
  return rangeConfig.seconds || null
}

/**
 * Check if a range represents "All" (show all data)
 */
export function isAllRange(rangeConfig: RangeConfig): boolean {
  const range = getRangeValue(rangeConfig)
  return range === null || range === TimeRange.ALL
}

/**
 * Convert TimeRange enum or value to seconds
 */
export function getSecondsFromRange(range: TimeRange | number | null): number | null {
  if (range === null || range === TimeRange.ALL) {
    return null
  }

  if (typeof range === 'number') {
    return range
  }

  // Map enum values to seconds using the existing TimeRangeSeconds constants
  switch (range) {
    case TimeRange.FIVE_MINUTES:
      return TimeRangeSeconds.FIVE_MINUTES
    case TimeRange.FIFTEEN_MINUTES:
      return TimeRangeSeconds.FIFTEEN_MINUTES
    case TimeRange.THIRTY_MINUTES:
      return 1800 // 30 minutes
    case TimeRange.ONE_HOUR:
      return TimeRangeSeconds.ONE_HOUR
    case TimeRange.FOUR_HOURS:
      return TimeRangeSeconds.FOUR_HOURS
    case TimeRange.ONE_DAY:
      return TimeRangeSeconds.ONE_DAY
    case TimeRange.ONE_WEEK:
      return TimeRangeSeconds.ONE_WEEK
    case TimeRange.TWO_WEEKS:
      return TimeRangeSeconds.ONE_WEEK * 2
    case TimeRange.ONE_MONTH:
      return TimeRangeSeconds.ONE_MONTH
    case TimeRange.THREE_MONTHS:
      return TimeRangeSeconds.THREE_MONTHS
    case TimeRange.SIX_MONTHS:
      return TimeRangeSeconds.SIX_MONTHS
    case TimeRange.ONE_YEAR:
      return TimeRangeSeconds.ONE_YEAR
    case TimeRange.TWO_YEARS:
      return TimeRangeSeconds.ONE_YEAR * 2
    case TimeRange.FIVE_YEARS:
      return TimeRangeSeconds.FIVE_YEARS
    default:
      return null
  }
}

/**
 * Configuration for RangeSwitcherPrimitive
 */
export interface RangeSwitcherPrimitiveConfig extends BasePrimitiveConfig {
  /**
   * Available time ranges
   */
  ranges: RangeConfig[]


  /**
   * Callback when range changes
   */
  onRangeChange?: (range: RangeConfig, index: number) => void

  /**
   * Range switcher styling
   */
  style?: BasePrimitiveConfig['style'] & {
    /**
     * Button styling
     */
    button?: {
      backgroundColor?: string
      color?: string
      hoverBackgroundColor?: string
      hoverColor?: string
      border?: string
      borderRadius?: number
      padding?: string
      margin?: string
      fontSize?: number
      fontWeight?: string | number
      minWidth?: number
    }

    /**
     * Container styling
     */
    container?: {
      display?: 'flex' | 'block'
      flexDirection?: 'row' | 'column'
      gap?: number
      alignItems?: string
      justifyContent?: string
    }
  }
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

  private buttonElements: HTMLElement[] = []
  private buttonEventCleanupFunctions: (() => void)[] = []

  constructor(id: string, config: RangeSwitcherPrimitiveConfig) {
    // Set default priority and configuration for range switchers
    const configWithDefaults: RangeSwitcherPrimitiveConfig = {
      priority: PrimitivePriority.RANGE_SWITCHER,
      visible: true,
      style: {
        backgroundColor: 'transparent',
        padding: DefaultRangeSwitcherConfig.layout.CONTAINER_PADDING,
        container: {
          display: 'flex',
          flexDirection: DefaultRangeSwitcherConfig.layout.FLEX_DIRECTION,
          gap: DefaultRangeSwitcherConfig.layout.CONTAINER_GAP,
          alignItems: DefaultRangeSwitcherConfig.layout.ALIGN_ITEMS,
          justifyContent: DefaultRangeSwitcherConfig.layout.JUSTIFY_CONTENT
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
          minWidth: ButtonDimensions.MIN_WIDTH_RANGE
        },
        ...config.style
      },
      ...config
    }

    super(id, configWithDefaults)
  }

  // ===== BasePanePrimitive Implementation =====

  /**
   * Get the template string (not used for interactive elements)
   */
  protected getTemplate(): string {
    return '' // Range switcher is fully interactive, no template needed
  }

  /**
   * Render the range switcher buttons
   */
  protected renderContent(): void {
    if (!this.containerElement) return

    // Clean up existing event listeners
    this.cleanupButtonEventListeners()

    // Clear existing content
    this.containerElement.innerHTML = ''
    this.buttonElements = []

    // Create container for buttons
    const buttonContainer = document.createElement('div')
    buttonContainer.className = 'range-switcher-container'
    this.applyContainerStyling(buttonContainer)

    // Create buttons for each range
    this.config.ranges.forEach((range, index) => {
      const button = this.createRangeButton(range, index)
      buttonContainer.appendChild(button)
      this.buttonElements.push(button)
    })

    this.containerElement.appendChild(buttonContainer)

    // Trigger layout recalculation after content is rendered to ensure proper positioning
    // Use setTimeout to allow DOM to update dimensions first
    setTimeout(() => {
      if (this.layoutManager) {
        this.layoutManager.recalculateAllLayouts()
      }
    }, 0)
  }

  /**
   * Create a single range button
   */
  private createRangeButton(range: RangeConfig, index: number): HTMLElement {
    const button = this.createButtonElement(range, index)
    this.applyButtonStyling(button, false)
    this.attachButtonEventHandlers(button, index)
    return button
  }

  /**
   * Create the basic button element with attributes
   */
  private createButtonElement(range: RangeConfig, index: number): HTMLElement {
    const button = document.createElement('button')
    button.className = 'range-button'
    button.textContent = range.text
    button.setAttribute('data-range-index', index.toString())
    button.setAttribute('aria-label', `Switch to ${range.text} time range`)
    return button
  }

  /**
   * Attach event handlers to range button
   */
  private attachButtonEventHandlers(button: HTMLElement, index: number): void {
    const eventHandlers = this.createButtonEventHandlers(button, index)

    // Add event listeners
    button.addEventListener('click', eventHandlers.click)
    button.addEventListener('mouseenter', eventHandlers.mouseEnter)
    button.addEventListener('mouseleave', eventHandlers.mouseLeave)

    // Store cleanup function
    const cleanup = () => {
      button.removeEventListener('click', eventHandlers.click)
      button.removeEventListener('mouseenter', eventHandlers.mouseEnter)
      button.removeEventListener('mouseleave', eventHandlers.mouseLeave)
    }
    this.buttonEventCleanupFunctions.push(cleanup)
  }

  /**
   * Create event handler functions for range button
   */
  private createButtonEventHandlers(button: HTMLElement, index: number): {
    click: (e: Event) => void;
    mouseEnter: () => void;
    mouseLeave: () => void;
  } {
    return {
      click: (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        this.handleRangeClick(index)
      },
      mouseEnter: () => {
        this.applyButtonStyling(button, false, true)
      },
      mouseLeave: () => {
        this.applyButtonStyling(button, false, false)
      }
    }
  }

  /**
   * Clean up button event listeners
   */
  private cleanupButtonEventListeners(): void {
    this.buttonEventCleanupFunctions.forEach(cleanup => cleanup())
    this.buttonEventCleanupFunctions = []
  }

  /**
   * Apply container styling
   */
  private applyContainerStyling(container: HTMLElement): void {
    const style = container.style
    const containerConfig = this.config.style?.container

    if (containerConfig) {
      if (containerConfig.display) style.display = containerConfig.display
      if (containerConfig.flexDirection) style.flexDirection = containerConfig.flexDirection
      if (containerConfig.gap) style.gap = `${containerConfig.gap}px`
      if (containerConfig.alignItems) style.alignItems = containerConfig.alignItems
      if (containerConfig.justifyContent) style.justifyContent = containerConfig.justifyContent
    }

    // Ensure interactive elements can receive events
    style.pointerEvents = 'auto'
  }

  /**
   * Apply button styling using standardized utilities
   */
  private applyButtonStyling(button: HTMLElement, isActive: boolean, isHover: boolean = false): void {
    const buttonConfig = this.config.style?.button

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
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' // Subtle shadow for depth
      }

      // Prepare state-specific styles
      const stateStyles: BaseStyleConfig = {}

      if (isHover) {
        stateStyles.backgroundColor = buttonConfig.hoverBackgroundColor || 'rgba(255, 255, 255, 1)'
        stateStyles.color = buttonConfig.hoverColor || '#333'
        stateStyles.boxShadow = ButtonEffects.RANGE_HOVER_BOX_SHADOW
        stateStyles.transform = 'translateY(-1px)' // Subtle lift effect
      }

      // Determine state for styling utils
      const state = isHover ? 'hover' : 'default'

      // Apply styles using standardized utilities
      PrimitiveStylingUtils.applyInteractionState(button, baseStyles, stateStyles, state)

      // Set minimum width if specified
      if (buttonConfig.minWidth) {
        button.style.minWidth = `${buttonConfig.minWidth}px`
      }
    }
  }

  /**
   * Handle range button click
   */
  private handleRangeClick(index: number): void {

    // Apply range to chart
    this.applyRangeToChart(this.config.ranges[index])

    // Emit range change event
    if (this.config.onRangeChange) {
      this.config.onRangeChange(this.config.ranges[index], index)
    }

    // Emit custom event through event manager
    if (this.eventManager) {
      this.eventManager.emitCustomEvent('rangeChange', {
        range: this.config.ranges[index],
        index: index
      })
    }
  }


  /**
   * Apply range to chart time scale
   */
  private applyRangeToChart(range: RangeConfig): void {
    if (!this.chart) return

    try {
      const timeScale = this.chart.timeScale()

      const rangeValue = getRangeValue(range)
      const seconds = getSecondsFromRange(rangeValue)

      if (seconds === null) {
        // "All" range - fit all content
        timeScale.fitContent()
      } else {
        // Specific time range - use current visible range or current time
        const currentRange = timeScale.getVisibleRange()
        let endTime: number

        if (currentRange && currentRange.to) {
          // Use the current visible end time as reference
          endTime = currentRange.to as number
        } else {
          // Fallback to current time
          endTime = Date.now() / 1000
        }

        const fromTime = endTime - seconds

        timeScale.setVisibleRange({
          from: fromTime as Time,
          to: endTime as Time
        })
      }
    } catch (error) {
      // Silently handle chart range application errors
    }
  }

  /**
   * Get CSS class name for the container
   */
  protected getContainerClassName(): string {
    return 'range-switcher-primitive'
  }

  /**
   * Override pane ID - range switcher is chart-level (pane 0)
   */
  protected getPaneId(): number {
    return 0 // Always chart-level
  }

  // ===== Lifecycle Hooks =====

  /**
   * Override detached to ensure proper cleanup
   */
  public detached(): void {
    this.cleanupButtonEventListeners()
    super.detached()
  }

  /**
   * Setup custom event subscriptions
   */
  protected setupCustomEventSubscriptions(): void {
    if (!this.eventManager) return

    // Subscribe to time scale changes to sync active range
    const timeScaleSub = this.eventManager.subscribe('timeScaleChange', (event) => {
      this.handleTimeScaleChange(event)
    })
    this.eventSubscriptions.push(timeScaleSub)
  }

  /**
   * Handle external time scale changes
   */
  private handleTimeScaleChange(event: { from: any; to: any }): void {
    // Optionally sync active range when time scale changes externally
    // This could be used to highlight which range matches the current view
  }

  /**
   * Called when container is created
   */
  protected onContainerCreated(container: HTMLElement): void {
    // Ensure container allows pointer events for buttons
    container.style.pointerEvents = 'auto'
  }

  // ===== Public API =====

  /**
   * Add a new range
   */
  public addRange(range: RangeConfig): void {
    this.config.ranges.push(range)
    if (this.mounted) {
      this.renderContent()
    }
  }

  /**
   * Remove a range by index
   */
  public removeRange(index: number): void {
    if (index < 0 || index >= this.config.ranges.length) return

    this.config.ranges.splice(index, 1)


    if (this.mounted) {
      this.renderContent()
    }
  }

  /**
   * Update ranges
   */
  public updateRanges(ranges: RangeConfig[]): void {
    this.config.ranges = ranges

    if (this.mounted) {
      this.renderContent()
    }
  }


  /**
   * Programmatically trigger range change
   */
  public triggerRangeChange(index: number): void {
    this.handleRangeClick(index)
  }
}

/**
 * Factory function to create range switcher primitives
 */
export function createRangeSwitcherPrimitive(
  id: string,
  config: Partial<RangeSwitcherPrimitiveConfig> & { ranges: RangeConfig[]; corner: any }
): RangeSwitcherPrimitive {
  return new RangeSwitcherPrimitive(id, config as RangeSwitcherPrimitiveConfig)
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
    { text: 'All', range: TimeRange.ALL }
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
    { text: 'All', range: TimeRange.ALL }
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
    { text: 'All', range: TimeRange.ALL }
  ],

  /**
   * Custom minimal ranges (using enum)
   */
  minimal: [
    { text: '1D', range: TimeRange.ONE_DAY },
    { text: '1W', range: TimeRange.ONE_WEEK },
    { text: '1M', range: TimeRange.ONE_MONTH },
    { text: 'All', range: TimeRange.ALL }
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
      { text: 'All', seconds: null }
    ],
    shortTerm: [
      { text: '5M', seconds: TimeRangeSeconds.FIVE_MINUTES },
      { text: '15M', seconds: TimeRangeSeconds.FIFTEEN_MINUTES },
      { text: '1H', seconds: TimeRangeSeconds.ONE_HOUR },
      { text: '4H', seconds: TimeRangeSeconds.FOUR_HOURS },
      { text: '1D', seconds: TimeRangeSeconds.ONE_DAY },
      { text: 'All', seconds: null }
    ],
    longTerm: [
      { text: '1M', seconds: TimeRangeSeconds.ONE_MONTH },
      { text: '3M', seconds: TimeRangeSeconds.THREE_MONTHS },
      { text: '6M', seconds: TimeRangeSeconds.SIX_MONTHS },
      { text: '1Y', seconds: TimeRangeSeconds.ONE_YEAR },
      { text: '5Y', seconds: TimeRangeSeconds.FIVE_YEARS },
      { text: 'All', seconds: null }
    ],
    minimal: [
      { text: '1D', seconds: TimeRangeSeconds.ONE_DAY },
      { text: '1W', seconds: TimeRangeSeconds.ONE_WEEK },
      { text: '1M', seconds: TimeRangeSeconds.ONE_MONTH },
      { text: 'All', seconds: null }
    ]
  }
} as const