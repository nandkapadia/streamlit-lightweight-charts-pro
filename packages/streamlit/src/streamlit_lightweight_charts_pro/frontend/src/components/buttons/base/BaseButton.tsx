/**
 * @fileoverview Abstract base class for all button types with functional wrapper
 *
 * Provides common functionality for button rendering, state management,
 * event handling, and styling. All button types should extend this class.
 *
 * Uses a functional wrapper component (BaseButtonRenderer) to properly
 * handle React hooks, fixing the previous violation of React's Rules of Hooks.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  BaseButtonConfig,
  ButtonState,
  ButtonStyling,
  DEFAULT_BUTTON_STYLING,
} from './ButtonConfig';

/**
 * Props for the functional button renderer
 */
export interface BaseButtonRendererProps {
  /** The button instance to render */
  button: BaseButton;
}

/**
 * Functional wrapper component that properly uses React hooks
 *
 * This component wraps a BaseButton instance and handles all React state
 * management correctly, following React's Rules of Hooks.
 */
export const BaseButtonRenderer: React.FC<BaseButtonRendererProps> = ({ button }) => {
  const [state, setState] = useState<ButtonState>({
    isHovered: false,
    isPressed: false,
    customState: {},
  });

  const lastClickTime = useRef<number>(0);

  // Debounced click handler
  const handleClickDebounced = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!button.isEnabled()) {
        return;
      }

      const now = Date.now();
      const debounceDelay = button.getDebounceDelay();

      if (now - lastClickTime.current < debounceDelay) {
        return; // Ignore click if too soon
      }

      lastClickTime.current = now;
      button.handleClick();
    },
    [button]
  );

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    if (button.isEnabled()) {
      setState(prev => ({ ...prev, isHovered: true }));
    }
  }, [button]);

  const handleMouseLeave = useCallback(() => {
    setState(prev => ({ ...prev, isHovered: false, isPressed: false }));
  }, []);

  const handleMouseDown = useCallback(() => {
    if (button.isEnabled()) {
      setState(prev => ({ ...prev, isPressed: true }));
    }
  }, [button]);

  const handleMouseUp = useCallback(() => {
    setState(prev => ({ ...prev, isPressed: false }));
  }, []);

  if (!button.isVisible()) {
    return null;
  }

  return (
    <div
      className={`button ${button.getId()}`}
      style={button.getButtonStyle(state)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClickDebounced}
      title={button.getTooltip(state)}
      aria-label={button.getTooltip(state)}
      role='button'
      tabIndex={button.isEnabled() ? 0 : -1}
    >
      {button.getIcon(state)}
    </div>
  );
};

/**
 * Abstract base class for all buttons
 *
 * Provides:
 * - Configuration management
 * - Styling computation
 * - Visibility and enabled state
 * - Icon and tooltip abstractions
 *
 * Subclasses must implement:
 * - getIcon(): Return the button icon/content
 * - handleClick(): Handle button click action
 *
 * @abstract
 */
export abstract class BaseButton {
  protected config: BaseButtonConfig;
  protected styling: Required<ButtonStyling>;

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
  }

  /**
   * Get the icon/content to display in the button
   * @abstract
   */
  public abstract getIcon(state: ButtonState): React.ReactNode;

  /**
   * Handle button click event
   * @abstract
   */
  public abstract handleClick(): void;

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
  }

  /**
   * Get button styles based on current state
   */
  public getButtonStyle(state: ButtonState): React.CSSProperties {
    const { isHovered, isPressed } = state;

    return {
      width: `${this.styling.size}px`,
      height: `${this.styling.size}px`,
      background: isHovered ? this.styling.hoverBackground : this.styling.background,
      border: this.styling.border,
      borderRadius: `${this.styling.borderRadius}px`,
      cursor: this.isEnabled() ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isHovered ? this.styling.hoverColor : this.styling.color,
      transition: 'all 0.1s ease',
      userSelect: 'none',
      boxShadow: isHovered ? this.styling.hoverBoxShadow : 'none',
      transform: isPressed ? 'scale(0.9)' : 'scale(1)',
      opacity: this.isEnabled() ? 1 : 0.5,
      pointerEvents: this.isEnabled() ? 'auto' : 'none',
    };
  }

  /**
   * Render the button using the functional wrapper component
   *
   * Returns a React element that wraps this button instance
   * in the BaseButtonRenderer functional component.
   */
  public render(): React.ReactElement {
    return <BaseButtonRenderer button={this} />;
  }
}
