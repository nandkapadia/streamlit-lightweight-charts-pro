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
 * Range configuration for time switching
 */
export interface RangeConfig {
  /**
   * Display text for the range
   */
  text: string

  /**
   * Range in seconds (null for "All" range)
   */
  seconds: number | null

  /**
   * Whether this is the active range
   */
  active?: boolean
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
   * Initial active range index
   */
  activeRangeIndex?: number

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
      activeBackgroundColor?: string
      activeColor?: string
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
 *     console.log('Range changed to:', range.text)
 *   }
 * })
 *
 * // Add to chart (chart-level, not pane-specific)
 * chart.attachPrimitive(rangeSwitcher)
 * ```
 */
export class RangeSwitcherPrimitive extends BasePanePrimitive<RangeSwitcherPrimitiveConfig> {

  private activeRangeIndex: number = 0
  private buttonElements: HTMLElement[] = []
  private buttonEventCleanupFunctions: (() => void)[] = []

  constructor(id: string, config: RangeSwitcherPrimitiveConfig) {
    // Set default priority and configuration for range switchers
    const configWithDefaults: RangeSwitcherPrimitiveConfig = {
      priority: PrimitivePriority.RANGE_SWITCHER,
      visible: true,
      activeRangeIndex: 0,
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
          activeBackgroundColor: ButtonColors.PRESSED_BACKGROUND,
          activeColor: ButtonColors.PRESSED_COLOR,
          border: ButtonEffects.DEFAULT_BORDER,
          borderRadius: ButtonDimensions.BORDER_RADIUS,
          padding: '6px 12px',
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
    this.activeRangeIndex = configWithDefaults.activeRangeIndex || 0
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

    // Update active state
    this.updateActiveButton()
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
        if (index !== this.activeRangeIndex) {
          this.applyButtonStyling(button, false, true)
        }
      },
      mouseLeave: () => {
        if (index !== this.activeRangeIndex) {
          this.applyButtonStyling(button, false, false)
        }
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
      // Prepare base styles
      const baseStyles: BaseStyleConfig = {
        border: buttonConfig.border || CommonValues.NONE,
        borderRadius: buttonConfig.borderRadius || 0,
        padding: buttonConfig.padding || ButtonSpacing.BUTTON_PADDING,
        margin: buttonConfig.margin || ButtonSpacing.BUTTON_MARGIN,
        fontSize: buttonConfig.fontSize || 12,
        fontWeight: buttonConfig.fontWeight || CommonValues.FONT_WEIGHT_MEDIUM,
        backgroundColor: buttonConfig.backgroundColor || ButtonColors.DEFAULT_BACKGROUND,
        color: buttonConfig.color || ButtonColors.DEFAULT_COLOR,
        cursor: CommonValues.POINTER,
        transition: ButtonEffects.DEFAULT_TRANSITION
      }

      // Prepare state-specific styles
      const stateStyles: BaseStyleConfig = {}

      if (isActive) {
        stateStyles.backgroundColor = buttonConfig.activeBackgroundColor || ButtonColors.PRESSED_BACKGROUND
        stateStyles.color = buttonConfig.activeColor || ButtonColors.PRESSED_COLOR
      } else if (isHover) {
        stateStyles.backgroundColor = buttonConfig.hoverBackgroundColor || ButtonColors.HOVER_BACKGROUND
        stateStyles.color = buttonConfig.hoverColor || ButtonColors.HOVER_COLOR
      }

      // Determine state for styling utils
      const state = isActive ? 'active' : isHover ? 'hover' : 'default'

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
    if (index === this.activeRangeIndex) return

    // Update active range
    this.setActiveRange(index)

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
   * Set active range
   */
  public setActiveRange(index: number): void {
    if (index < 0 || index >= this.config.ranges.length) return

    this.activeRangeIndex = index
    this.updateActiveButton()
  }

  /**
   * Update active button styling
   */
  private updateActiveButton(): void {
    this.buttonElements.forEach((button, index) => {
      const isActive = index === this.activeRangeIndex
      this.applyButtonStyling(button, isActive)
    })
  }

  /**
   * Apply range to chart time scale
   */
  private applyRangeToChart(range: RangeConfig): void {
    if (!this.chart) return

    try {
      const timeScale = this.chart.timeScale()

      if (range.seconds === null) {
        // "All" range - fit content
        timeScale.fitContent()
      } else {
        // Specific time range
        const now = Date.now() / 1000 // Current time in seconds
        const fromTime = now - range.seconds

        timeScale.setVisibleRange({
          from: fromTime as Time,
          to: now as Time
        })
      }
    } catch (error) {
      console.warn('Failed to apply range to chart:', error)
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

    // Adjust active range if needed
    if (this.activeRangeIndex >= this.config.ranges.length) {
      this.activeRangeIndex = Math.max(0, this.config.ranges.length - 1)
    }

    if (this.mounted) {
      this.renderContent()
    }
  }

  /**
   * Update ranges
   */
  public updateRanges(ranges: RangeConfig[]): void {
    this.config.ranges = ranges
    this.activeRangeIndex = Math.min(this.activeRangeIndex, ranges.length - 1)

    if (this.mounted) {
      this.renderContent()
    }
  }

  /**
   * Get current active range
   */
  public getActiveRange(): RangeConfig | null {
    if (this.activeRangeIndex >= 0 && this.activeRangeIndex < this.config.ranges.length) {
      return this.config.ranges[this.activeRangeIndex]
    }
    return null
  }

  /**
   * Get active range index
   */
  public getActiveRangeIndex(): number {
    return this.activeRangeIndex
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
 * Default range configurations
 */
export const DefaultRangeConfigs = {
  /**
   * Standard trading ranges
   */
  trading: [
    { text: '1D', seconds: TimeRangeSeconds.ONE_DAY },
    { text: '7D', seconds: TimeRangeSeconds.ONE_WEEK },
    { text: '1M', seconds: TimeRangeSeconds.ONE_MONTH },
    { text: '3M', seconds: TimeRangeSeconds.THREE_MONTHS },
    { text: '1Y', seconds: TimeRangeSeconds.ONE_YEAR },
    { text: 'All', seconds: null }
  ],

  /**
   * Short-term trading ranges
   */
  shortTerm: [
    { text: '5M', seconds: TimeRangeSeconds.FIVE_MINUTES },
    { text: '15M', seconds: TimeRangeSeconds.FIFTEEN_MINUTES },
    { text: '1H', seconds: TimeRangeSeconds.ONE_HOUR },
    { text: '4H', seconds: TimeRangeSeconds.FOUR_HOURS },
    { text: '1D', seconds: TimeRangeSeconds.ONE_DAY },
    { text: 'All', seconds: null }
  ],

  /**
   * Long-term investment ranges
   */
  longTerm: [
    { text: '1M', seconds: TimeRangeSeconds.ONE_MONTH },
    { text: '3M', seconds: TimeRangeSeconds.THREE_MONTHS },
    { text: '6M', seconds: TimeRangeSeconds.SIX_MONTHS },
    { text: '1Y', seconds: TimeRangeSeconds.ONE_YEAR },
    { text: '5Y', seconds: TimeRangeSeconds.FIVE_YEARS },
    { text: 'All', seconds: null }
  ],

  /**
   * Custom minimal ranges
   */
  minimal: [
    { text: '1D', seconds: TimeRangeSeconds.ONE_DAY },
    { text: '1W', seconds: TimeRangeSeconds.ONE_WEEK },
    { text: '1M', seconds: TimeRangeSeconds.ONE_MONTH },
    { text: 'All', seconds: null }
  ]
} as const