/**
 * @fileoverview Pure TypeScript base class for all button types
 *
 * Provides common functionality for button rendering, state management,
 * event handling, and styling using native DOM manipulation.
 *
 * All button types should extend this class and implement:
 * - getIconSVG(): Return SVG string for the button icon
 * - handleClick(): Handle button click action
 *
 * This is a pure TypeScript implementation with zero React dependencies.
 */

import {
  BaseButtonConfig,
  ButtonState,
  ButtonStyling,
  DEFAULT_BUTTON_STYLING,
} from './ButtonConfig';

/**
 * Abstract base class for all buttons (Pure TypeScript)
 *
 * Provides:
 * - DOM element creation and management
 * - State management (hover, pressed, custom)
 * - Event handling with debouncing
 * - Dynamic styling based on state
 * - Visibility and enabled state management
 * - Tooltip support
 *
 * Subclasses must implement:
 * - getIconSVG(): Return the button icon SVG as a string
 * - handleClick(): Handle button click action
 *
 * @abstract
 */
export abstract class BaseButton {
  protected config: BaseButtonConfig;
  protected styling: Required<ButtonStyling>;
  protected element: HTMLDivElement;
  protected state: ButtonState;
  protected lastClickTime: number = 0;

  // Bound event handler references for cleanup
  private boundHandlers: {
    click: (e: MouseEvent) => void;
    mouseenter: () => void;
    mouseleave: () => void;
    mousedown: () => void;
    mouseup: () => void;
  };

  constructor(config: BaseButtonConfig) {
    this.config = {
      visible: true,
      enabled: true,
      debounceDelay: 300,
      ...config,
    };

    this.styling = {
      ...DEFAULT_BUTTON_STYLING,
      ...config.styling,
    };

    this.state = {
      isHovered: false,
      isPressed: false,
      customState: {},
    };

    // Create bound handlers once for proper cleanup
    this.boundHandlers = {
      click: this.handleClickDebounced.bind(this),
      mouseenter: this.handleMouseEnter.bind(this),
      mouseleave: this.handleMouseLeave.bind(this),
      mousedown: this.handleMouseDown.bind(this),
      mouseup: this.handleMouseUp.bind(this),
    };

    // Create DOM element
    this.element = this.createElement();
    this.attachEventListeners();
    this.updateStyles();
  }

  /**
   * Get the icon/content to display in the button as SVG string
   * @abstract
   */
  protected abstract getIconSVG(state: ButtonState): string;

  /**
   * Handle button click event
   * @abstract
   */
  public abstract handleClick(): void;

  /**
   * Create the button DOM element
   */
  protected createElement(): HTMLDivElement {
    const div = document.createElement('div');
    div.className = `button ${this.config.id}`;
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', this.config.tooltip);

    // Set initial content (icon)
    this.updateIconContent(div);

    return div;
  }

  /**
   * Update icon content in the element
   */
  protected updateIconContent(element: HTMLDivElement = this.element): void {
    const iconSVG = this.getIconSVG(this.state);
    element.innerHTML = iconSVG;
  }

  /**
   * Attach event listeners to the button element
   */
  protected attachEventListeners(): void {
    this.element.addEventListener('click', this.boundHandlers.click);
    this.element.addEventListener('mouseenter', this.boundHandlers.mouseenter);
    this.element.addEventListener('mouseleave', this.boundHandlers.mouseleave);
    this.element.addEventListener('mousedown', this.boundHandlers.mousedown);
    this.element.addEventListener('mouseup', this.boundHandlers.mouseup);
  }

  /**
   * Remove event listeners from the button element
   */
  protected removeEventListeners(): void {
    this.element.removeEventListener('click', this.boundHandlers.click);
    this.element.removeEventListener('mouseenter', this.boundHandlers.mouseenter);
    this.element.removeEventListener('mouseleave', this.boundHandlers.mouseleave);
    this.element.removeEventListener('mousedown', this.boundHandlers.mousedown);
    this.element.removeEventListener('mouseup', this.boundHandlers.mouseup);
  }

  /**
   * Handle click with debouncing
   */
  protected handleClickDebounced(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    if (!this.isEnabled()) {
      return;
    }

    const now = Date.now();
    const debounceDelay = this.config.debounceDelay || 300;

    if (now - this.lastClickTime < debounceDelay) {
      return; // Ignore click if too soon
    }

    this.lastClickTime = now;
    this.handleClick();
  }

  /**
   * Handle mouse enter event
   */
  protected handleMouseEnter(): void {
    if (this.isEnabled()) {
      this.setState({ isHovered: true });
    }
  }

  /**
   * Handle mouse leave event
   */
  protected handleMouseLeave(): void {
    this.setState({ isHovered: false, isPressed: false });
  }

  /**
   * Handle mouse down event
   */
  protected handleMouseDown(): void {
    if (this.isEnabled()) {
      this.setState({ isPressed: true });
    }
  }

  /**
   * Handle mouse up event
   */
  protected handleMouseUp(): void {
    this.setState({ isPressed: false });
  }

  /**
   * Update button state and trigger re-render
   */
  protected setState(updates: Partial<ButtonState>): void {
    this.state = { ...this.state, ...updates };
    this.updateStyles();
    this.updateIconContent(); // Update icon if it depends on state
  }

  /**
   * Update button styles based on current state
   */
  protected updateStyles(): void {
    const { isHovered, isPressed } = this.state;

    // Apply styles directly to DOM element
    const style = this.element.style;
    style.width = `${this.styling.size}px`;
    style.height = `${this.styling.size}px`;
    style.background = isHovered ? this.styling.hoverBackground : this.styling.background;
    style.border = this.styling.border;
    style.borderRadius = `${this.styling.borderRadius}px`;
    style.cursor = this.isEnabled() ? 'pointer' : 'not-allowed';
    style.display = this.isVisible() ? 'flex' : 'none';
    style.alignItems = 'center';
    style.justifyContent = 'center';
    style.color = isHovered ? this.styling.hoverColor : this.styling.color;
    style.transition = 'all 0.1s ease';
    style.userSelect = 'none';
    style.boxShadow = isHovered ? this.styling.hoverBoxShadow : 'none';
    style.transform = isPressed ? 'scale(0.9)' : 'scale(1)';
    style.opacity = this.isEnabled() ? '1' : '0.5';
    style.pointerEvents = this.isEnabled() ? 'auto' : 'none';

    // Update tooltip
    this.element.setAttribute('title', this.getTooltip(this.state));
    this.element.setAttribute('aria-label', this.getTooltip(this.state));

    // Update tabIndex
    this.element.setAttribute('tabIndex', this.isEnabled() ? '0' : '-1');
  }

  /**
   * Get tooltip text (can be overridden for dynamic tooltips)
   */
  public getTooltip(_state: ButtonState): string {
    return this.config.tooltip;
  }

  /**
   * Check if button should be visible
   */
  public isVisible(): boolean {
    return this.config.visible !== false;
  }

  /**
   * Check if button should be enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  /**
   * Get button ID
   */
  public getId(): string {
    return this.config.id;
  }

  /**
   * Get debounce delay
   */
  public getDebounceDelay(): number {
    return this.config.debounceDelay || 300;
  }

  /**
   * Update button configuration
   */
  public updateConfig(updates: Partial<BaseButtonConfig>): void {
    this.config = { ...this.config, ...updates };

    if (updates.styling) {
      this.styling = {
        ...this.styling,
        ...updates.styling,
      };
    }

    // Re-render with new config
    this.updateStyles();
    this.updateIconContent();
  }

  /**
   * Get the DOM element for this button
   *
   * This is the primary API for using buttons. Callers should append
   * this element to the DOM where they want the button to appear.
   *
   * @returns The button's HTMLDivElement
   */
  public getElement(): HTMLDivElement {
    return this.element;
  }

  /**
   * Destroy the button and clean up resources
   *
   * Removes event listeners and clears references to allow garbage collection.
   * The button should not be used after calling destroy().
   */
  public destroy(): void {
    this.removeEventListeners();
    this.element.remove();
  }
}
