import { BasePanePrimitive, BasePrimitiveConfig, PrimitivePriority } from './BasePanePrimitive'
import {
  ButtonColors,
  ButtonDimensions,
  ButtonEffects,
  ButtonSpacing
} from './PrimitiveDefaults'
import { PrimitiveStylingUtils, BaseStyleConfig } from './PrimitiveStylingUtils'

/**
 * Button types for different behaviors
 */
export type ButtonType = 'collapse' | 'toggle' | 'action' | 'custom'

/**
 * Button states
 */
export interface ButtonState {
  /**
   * Whether button is pressed/active
   */
  pressed?: boolean

  /**
   * Whether button is disabled
   */
  disabled?: boolean

  /**
   * Custom state data
   */
  customData?: any
}

/**
 * Configuration for ButtonPrimitive
 */
export interface ButtonPrimitiveConfig extends BasePrimitiveConfig {
  /**
   * Button type
   */
  buttonType: ButtonType

  /**
   * Button text or HTML content
   */
  content: string

  /**
   * Initial button state
   */
  initialState?: ButtonState

  /**
   * Whether this is a pane-specific button (vs chart-level)
   */
  isPanePrimitive?: boolean

  /**
   * Pane ID for pane-specific buttons
   */
  paneId?: number

  /**
   * Click handler
   */
  onClick?: (state: ButtonState, primitive: ButtonPrimitive) => void

  /**
   * State change handler
   */
  onStateChange?: (newState: ButtonState, oldState: ButtonState, primitive: ButtonPrimitive) => void

  /**
   * Button styling
   */
  style?: BasePrimitiveConfig['style'] & {
    /**
     * Button-specific styling
     */
    button?: {
      width?: number
      height?: number
      backgroundColor?: string
      color?: string
      hoverBackgroundColor?: string
      hoverColor?: string
      pressedBackgroundColor?: string
      pressedColor?: string
      disabledBackgroundColor?: string
      disabledColor?: string
      border?: string
      borderRadius?: number
      fontSize?: number
      fontWeight?: string | number
      cursor?: string
      transition?: string
      boxShadow?: string
      hoverBoxShadow?: string
      pressedBoxShadow?: string
    }

    /**
     * Icon styling (if using icons)
     */
    icon?: {
      size?: number
      color?: string
      hoverColor?: string
      pressedColor?: string
      disabledColor?: string
    }
  }
}

/**
 * ButtonPrimitive - A lightweight-charts pane primitive for interactive buttons
 *
 * This primitive provides:
 * - Interactive buttons with state management
 * - Collapse/expand functionality for panes
 * - Toggle buttons for features
 * - Action buttons for custom operations
 * - Full styling control and state feedback
 * - Pane-specific or chart-level positioning
 *
 * Example usage:
 * ```typescript
 * // Collapse button for a pane
 * const collapseButton = new ButtonPrimitive('collapse-btn', {
 *   corner: 'top-right',
 *   priority: PrimitivePriority.MINIMIZE_BUTTON,
 *   buttonType: 'collapse',
 *   content: '−',
 *   isPanePrimitive: true,
 *   paneId: 1,
 *   onClick: (state, primitive) => {
 *     // Toggle pane visibility
 *     const newState = { pressed: !state.pressed }
 *     primitive.setState(newState)
 *     // Handle pane collapse logic
 *   }
 * })
 *
 * // Toggle button for a feature
 * const toggleButton = new ButtonPrimitive('toggle-btn', {
 *   corner: 'top-left',
 *   buttonType: 'toggle',
 *   content: '📊',
 *   onClick: (state, primitive) => {
 *     primitive.setState({ pressed: !state.pressed })
 *   }
 * })
 * ```
 */
export class ButtonPrimitive extends BasePanePrimitive<ButtonPrimitiveConfig> {

  private currentState: ButtonState = {}
  private buttonElement: HTMLElement | null = null

  constructor(id: string, config: ButtonPrimitiveConfig) {
    // Set default priority and configuration for buttons
    const configWithDefaults: ButtonPrimitiveConfig = {
      priority: config.buttonType === 'collapse' ? PrimitivePriority.MINIMIZE_BUTTON : PrimitivePriority.CUSTOM,
      visible: true,
      isPanePrimitive: config.buttonType === 'collapse',
      paneId: 0,
      initialState: { pressed: false, disabled: false },
      style: {
        backgroundColor: 'transparent',
        padding: ButtonSpacing.CONTAINER_PADDING,
        button: {
          width: ButtonDimensions.DEFAULT_WIDTH,
          height: ButtonDimensions.DEFAULT_HEIGHT,
          backgroundColor: ButtonColors.DEFAULT_BACKGROUND,
          color: ButtonColors.DEFAULT_COLOR,
          hoverBackgroundColor: ButtonColors.HOVER_BACKGROUND,
          hoverColor: ButtonColors.HOVER_COLOR,
          pressedBackgroundColor: ButtonColors.PRESSED_BACKGROUND,
          pressedColor: ButtonColors.PRESSED_COLOR,
          disabledBackgroundColor: ButtonColors.DISABLED_BACKGROUND,
          disabledColor: ButtonColors.DISABLED_COLOR,
          border: ButtonEffects.DEFAULT_BORDER,
          borderRadius: ButtonDimensions.BORDER_RADIUS,
          fontSize: ButtonDimensions.FONT_SIZE,
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: ButtonEffects.DEFAULT_TRANSITION,
          boxShadow: 'none',
          hoverBoxShadow: ButtonEffects.HOVER_BOX_SHADOW,
          pressedBoxShadow: ButtonEffects.PRESSED_BOX_SHADOW
        },
        ...config.style
      },
      ...config
    }

    super(id, configWithDefaults)
    this.currentState = { ...configWithDefaults.initialState }
  }

  // ===== BasePanePrimitive Implementation =====

  /**
   * Get the template string (not used for interactive elements)
   */
  protected getTemplate(): string {
    return '' // Button is fully interactive, no template needed
  }

  /**
   * Render the button element
   */
  protected renderContent(): void {
    if (!this.containerElement) return

    // Clear existing content
    this.containerElement.innerHTML = ''

    // Create button element
    this.buttonElement = document.createElement('button')
    this.buttonElement.className = 'primitive-button'
    this.buttonElement.innerHTML = this.config.content
    this.buttonElement.setAttribute('aria-label', this.getAriaLabel())

    // Apply styling
    this.updateButtonStyling()

    // Update content based on state (for collapse buttons)
    this.updateContentBasedOnState()

    // Update CSS classes based on state (for collapse buttons)
    this.updateCSSClassesBasedOnState()

    // Add event handlers
    this.setupButtonEventHandlers()

    this.containerElement.appendChild(this.buttonElement)
  }

  /**
   * Get aria label for accessibility
   */
  private getAriaLabel(): string {
    switch (this.config.buttonType) {
      case 'collapse':
        return this.currentState.pressed ? 'Expand pane' : 'Collapse pane'
      case 'toggle':
        return this.currentState.pressed ? 'Disable feature' : 'Enable feature'
      case 'action':
        return 'Execute action'
      default:
        return 'Button'
    }
  }

  /**
   * Setup button event handlers
   */
  private setupButtonEventHandlers(): void {
    if (!this.buttonElement) return

    this.attachClickHandlers()
    this.attachMouseInteractionHandlers()
    this.attachKeyboardHandlers()
    this.attachFocusHandlers()
  }

  /**
   * Attach click event handlers
   */
  private attachClickHandlers(): void {
    if (!this.buttonElement) return

    this.buttonElement.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.handleClick()
    })
  }

  /**
   * Attach mouse interaction handlers (hover, press)
   */
  private attachMouseInteractionHandlers(): void {
    if (!this.buttonElement) return

    // Hover handlers
    this.buttonElement.addEventListener('mouseenter', () => {
      this.updateButtonStyling(true, false)
    })

    this.buttonElement.addEventListener('mouseleave', () => {
      this.updateButtonStyling(false, false)
    })

    // Mouse down/up for pressed effect
    this.buttonElement.addEventListener('mousedown', () => {
      this.updateButtonStyling(false, true)
    })

    this.buttonElement.addEventListener('mouseup', () => {
      this.updateButtonStyling(false, false)
    })
  }

  /**
   * Attach keyboard interaction handlers
   */
  private attachKeyboardHandlers(): void {
    if (!this.buttonElement) return

    this.buttonElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.handleClick()
      }
    })
  }

  /**
   * Attach focus/blur handlers for accessibility
   */
  private attachFocusHandlers(): void {
    if (!this.buttonElement) return

    this.buttonElement.addEventListener('focus', () => {
      this.buttonElement!.style.outline = ButtonEffects.FOCUS_OUTLINE
    })

    this.buttonElement.addEventListener('blur', () => {
      this.buttonElement!.style.outline = 'none'
    })
  }

  /**
   * Handle button click
   */
  private handleClick(): void {
    if (this.currentState.disabled) return

    // For toggle and collapse buttons, automatically toggle pressed state
    if (this.config.buttonType === 'toggle' || this.config.buttonType === 'collapse') {
      this.setState({ pressed: !this.currentState.pressed })
    }

    // Call onClick handler
    if (this.config.onClick) {
      this.config.onClick(this.currentState, this)
    }

    // Emit custom event
    if (this.eventManager) {
      this.eventManager.emitCustomEvent('buttonClick', {
        buttonId: this.id,
        buttonType: this.config.buttonType,
        state: this.currentState
      })
    }
  }

  /**
   * Update button styling based on state
   */
  private updateButtonStyling(isHover: boolean = false, isMouseDown: boolean = false): void {
    if (!this.buttonElement) return

    const buttonConfig = this.config.style?.button
    if (!buttonConfig) return

    this.applyBaseButtonStyling(buttonConfig)
    this.applyButtonStateStyles(buttonConfig, isHover, isMouseDown)
  }

  /**
   * Apply base button styling (dimensions, layout, transitions)
   */
  private applyBaseButtonStyling(buttonConfig: NonNullable<ButtonPrimitiveConfig['style']>['button']): void {
    if (!this.buttonElement || !buttonConfig) return

    // Create standardized style configuration
    const baseStyles: BaseStyleConfig = {
      fontSize: buttonConfig.fontSize || ButtonDimensions.FONT_SIZE,
      fontWeight: buttonConfig.fontWeight || 'bold',
      border: buttonConfig.border || 'none',
      borderRadius: buttonConfig.borderRadius || ButtonDimensions.BORDER_RADIUS,
      transition: buttonConfig.transition || ButtonEffects.DEFAULT_TRANSITION
    }

    // Apply standardized base styles
    PrimitiveStylingUtils.applyBaseStyles(this.buttonElement, baseStyles)

    // Apply layout using standardized utilities
    PrimitiveStylingUtils.applyLayout(this.buttonElement, {
      width: buttonConfig.width || ButtonDimensions.DEFAULT_WIDTH,
      height: buttonConfig.height || ButtonDimensions.DEFAULT_HEIGHT
    })

    // Create flex container with standardized utilities
    PrimitiveStylingUtils.createFlexContainer(this.buttonElement, 'row', 'center', 'center')

    // Apply specific padding for collapse buttons (pane action buttons need zero padding)
    if (this.config.buttonType === 'collapse') {
      this.buttonElement.style.padding = ButtonSpacing.PANE_ACTION_PADDING
    }
  }

  /**
   * Apply state-specific button styling (colors, shadows, cursor)
   */
  private applyButtonStateStyles(
    buttonConfig: NonNullable<ButtonPrimitiveConfig['style']>['button'],
    isHover: boolean,
    isMouseDown: boolean
  ): void {
    if (!this.buttonElement || !buttonConfig) return

    const style = this.buttonElement.style

    if (this.currentState.disabled) {
      this.applyDisabledButtonStyle(style, buttonConfig)
    } else if (this.currentState.pressed || isMouseDown) {
      this.applyPressedButtonStyle(style, buttonConfig)
    } else if (isHover) {
      this.applyHoverButtonStyle(style, buttonConfig)
    } else {
      this.applyDefaultButtonStyle(style, buttonConfig)
    }
  }

  /**
   * Apply disabled button styling
   */
  private applyDisabledButtonStyle(
    style: CSSStyleDeclaration,
    buttonConfig: NonNullable<ButtonPrimitiveConfig['style']>['button']
  ): void {
    if (!buttonConfig || !this.buttonElement) return

    const baseStyles: BaseStyleConfig = {
      backgroundColor: buttonConfig.backgroundColor || ButtonColors.DEFAULT_BACKGROUND,
      color: buttonConfig.color || ButtonColors.DEFAULT_COLOR
    }

    const disabledStyles: BaseStyleConfig = {
      backgroundColor: buttonConfig.disabledBackgroundColor || ButtonColors.DISABLED_BACKGROUND,
      color: buttonConfig.disabledColor || ButtonColors.DISABLED_COLOR,
      boxShadow: 'none'
    }

    PrimitiveStylingUtils.applyInteractionState(this.buttonElement, baseStyles, disabledStyles, 'disabled')
  }

  /**
   * Apply pressed/active button styling
   */
  private applyPressedButtonStyle(
    style: CSSStyleDeclaration,
    buttonConfig: NonNullable<ButtonPrimitiveConfig['style']>['button']
  ): void {
    if (!buttonConfig || !this.buttonElement) return

    const baseStyles: BaseStyleConfig = {
      backgroundColor: buttonConfig.backgroundColor || ButtonColors.DEFAULT_BACKGROUND,
      color: buttonConfig.color || ButtonColors.DEFAULT_COLOR,
      cursor: buttonConfig.cursor || 'pointer'
    }

    const pressedStyles: BaseStyleConfig = {
      backgroundColor: buttonConfig.pressedBackgroundColor || ButtonColors.PRESSED_BACKGROUND,
      color: buttonConfig.pressedColor || ButtonColors.PRESSED_COLOR
    }

    PrimitiveStylingUtils.applyInteractionState(this.buttonElement, baseStyles, pressedStyles, 'active')
    PrimitiveStylingUtils.applyShadow(this.buttonElement, {
      boxShadow: buttonConfig.pressedBoxShadow || ButtonEffects.PRESSED_BOX_SHADOW
    })
  }

  /**
   * Apply hover button styling
   */
  private applyHoverButtonStyle(
    style: CSSStyleDeclaration,
    buttonConfig: NonNullable<ButtonPrimitiveConfig['style']>['button']
  ): void {
    if (!buttonConfig || !this.buttonElement) return

    const baseStyles: BaseStyleConfig = {
      backgroundColor: buttonConfig.backgroundColor || ButtonColors.DEFAULT_BACKGROUND,
      color: buttonConfig.color || ButtonColors.DEFAULT_COLOR,
      cursor: buttonConfig.cursor || 'pointer'
    }

    const hoverStyles: BaseStyleConfig = {
      backgroundColor: buttonConfig.hoverBackgroundColor || ButtonColors.HOVER_BACKGROUND,
      color: buttonConfig.hoverColor || ButtonColors.HOVER_COLOR
    }

    PrimitiveStylingUtils.applyInteractionState(this.buttonElement, baseStyles, hoverStyles, 'hover')
    PrimitiveStylingUtils.applyShadow(this.buttonElement, {
      boxShadow: buttonConfig.hoverBoxShadow || ButtonEffects.HOVER_BOX_SHADOW
    })
  }

  /**
   * Apply default button styling
   */
  private applyDefaultButtonStyle(
    style: CSSStyleDeclaration,
    buttonConfig: NonNullable<ButtonPrimitiveConfig['style']>['button']
  ): void {
    if (!buttonConfig || !this.buttonElement) return

    const baseStyles: BaseStyleConfig = {
      backgroundColor: buttonConfig.backgroundColor || ButtonColors.DEFAULT_BACKGROUND,
      color: buttonConfig.color || ButtonColors.DEFAULT_COLOR,
      cursor: buttonConfig.cursor || 'pointer'
    }

    PrimitiveStylingUtils.applyInteractionState(this.buttonElement, baseStyles, {}, 'default')
    PrimitiveStylingUtils.applyShadow(this.buttonElement, {
      boxShadow: buttonConfig.boxShadow || 'none'
    })
  }

  /**
   * Get CSS class name for the container
   */
  protected getContainerClassName(): string {
    return `button-primitive button-${this.config.buttonType}`
  }

  /**
   * Override pane ID for pane-specific buttons
   */
  protected getPaneId(): number {
    if (this.config.isPanePrimitive && this.config.paneId !== undefined) {
      return this.config.paneId
    }
    return 0 // Default to chart-level
  }

  // ===== Lifecycle Hooks =====

  /**
   * Called when container is created
   */
  protected onContainerCreated(container: HTMLElement): void {
    // Ensure container allows pointer events for button
    container.style.pointerEvents = 'auto'
  }

  // ===== Public API =====

  /**
   * Set button state
   */
  public setState(newState: Partial<ButtonState>): void {
    const oldState = { ...this.currentState }
    this.currentState = { ...this.currentState, ...newState }

    // Update styling
    this.updateButtonStyling()

    // Update content based on state (for collapse buttons)
    this.updateContentBasedOnState()

    // Update CSS classes based on state (for collapse buttons)
    this.updateCSSClassesBasedOnState()

    // Update aria label
    if (this.buttonElement) {
      this.buttonElement.setAttribute('aria-label', this.getAriaLabel())
    }

    // Call state change handler
    if (this.config.onStateChange) {
      this.config.onStateChange(this.currentState, oldState, this)
    }

    // Emit state change event
    if (this.eventManager) {
      this.eventManager.emitCustomEvent('buttonStateChange', {
        buttonId: this.id,
        buttonType: this.config.buttonType,
        newState: this.currentState,
        oldState: oldState
      })
    }
  }

  /**
   * Get current button state
   */
  public getState(): ButtonState {
    return { ...this.currentState }
  }

  /**
   * Set button content
   */
  public setContent(content: string): void {
    this.config.content = content
    if (this.buttonElement) {
      this.buttonElement.innerHTML = content
    }
  }

  /**
   * Update button content based on state (for collapse buttons)
   */
  private updateContentBasedOnState(): void {
    if (this.config.buttonType === 'collapse' && this.buttonElement) {
      // SVG for uncollapsed state (showing both brackets)
      const uncollapseIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="15" height="15" fill="none"><path stroke="currentColor" d="m4 5 3.5-3L11 5" class="bracket-up"></path><path stroke="currentColor" d="M11 10l-3.5 3L4 10" class="bracket-down"></path></svg>'

      // SVG for collapsed state (showing single bracket pointing down)
      const collapseIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="15" height="15" fill="none"><path stroke="currentColor" d="M11 10l-3.5 3L4 10" class="bracket-down"></path></svg>'

      // Update content based on pressed state
      this.buttonElement.innerHTML = this.currentState.pressed ? collapseIcon : uncollapseIcon
    }
  }

  /**
   * Update CSS classes based on button state (for collapse buttons)
   */
  private updateCSSClassesBasedOnState(): void {
    if (this.config.buttonType === 'collapse' && this.buttonElement) {
      // Add or remove 'collapsed' class based on pressed state
      if (this.currentState.pressed) {
        this.buttonElement.classList.add('collapsed')
      } else {
        this.buttonElement.classList.remove('collapsed')
      }
    }
  }

  /**
   * Enable/disable button
   */
  public setEnabled(enabled: boolean): void {
    this.setState({ disabled: !enabled })
  }

  /**
   * Check if button is pressed
   */
  public isPressed(): boolean {
    return this.currentState.pressed || false
  }

  /**
   * Check if button is disabled
   */
  public isDisabled(): boolean {
    return this.currentState.disabled || false
  }

  /**
   * Programmatically trigger click
   */
  public click(): void {
    this.handleClick()
  }

  /**
   * Set pressed state (for toggle/collapse buttons)
   */
  public setPressed(pressed: boolean): void {
    this.setState({ pressed })
  }
}

/**
 * Factory function to create button primitives
 */
export function createButtonPrimitive(
  id: string,
  config: Partial<ButtonPrimitiveConfig> & { buttonType: ButtonType; content: string; corner: any }
): ButtonPrimitive {
  return new ButtonPrimitive(id, config as ButtonPrimitiveConfig)
}

/**
 * Convenience factory functions for common button types
 */
export const ButtonFactories = {
  /**
   * Create a collapse button for pane minimization
   */
  collapse: (id: string, paneId: number, corner: any, onClick?: ButtonPrimitiveConfig['onClick']) =>
    new ButtonPrimitive(id, {
      buttonType: 'collapse',
      content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="15" height="15" fill="none"><path stroke="currentColor" d="m4 5 3.5-3L11 5" class="bracket-up"></path><path stroke="currentColor" d="M11 10l-3.5 3L4 10" class="bracket-down"></path></svg>',
      corner,
      priority: PrimitivePriority.MINIMIZE_BUTTON,
      isPanePrimitive: true,
      paneId,
      onClick,
      style: {
        button: {
          backgroundColor: ButtonColors.PANE_ACTION_BACKGROUND,
          width: ButtonDimensions.PANE_ACTION_WIDTH,
          height: ButtonDimensions.PANE_ACTION_HEIGHT,
          color: ButtonColors.PANE_ACTION_COLOR,
          hoverBackgroundColor: ButtonColors.PANE_ACTION_HOVER_BACKGROUND,
          pressedBackgroundColor: ButtonColors.PANE_ACTION_PRESSED_BACKGROUND,
          border: `1px solid ${ButtonColors.PANE_ACTION_BORDER}`,
          borderRadius: ButtonDimensions.PANE_ACTION_BORDER_RADIUS
        }
      }
    }),

  /**
   * Create a toggle button for feature switching
   */
  toggle: (id: string, content: string, corner: any, onClick?: ButtonPrimitiveConfig['onClick']) =>
    new ButtonPrimitive(id, {
      buttonType: 'toggle',
      content,
      corner,
      priority: PrimitivePriority.CUSTOM,
      onClick
    }),

  /**
   * Create an action button for one-time operations
   */
  action: (id: string, content: string, corner: any, onClick?: ButtonPrimitiveConfig['onClick']) =>
    new ButtonPrimitive(id, {
      buttonType: 'action',
      content,
      corner,
      priority: PrimitivePriority.CUSTOM,
      onClick,
      style: {
        button: {
          backgroundColor: ButtonColors.ACTION_BACKGROUND,
          color: ButtonColors.PRESSED_COLOR,
          hoverBackgroundColor: ButtonColors.ACTION_HOVER_BACKGROUND
        }
      }
    })
} as const