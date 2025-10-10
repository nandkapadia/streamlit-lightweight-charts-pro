/**
 * @fileoverview Button configuration types and interfaces
 *
 * Provides type-safe configuration for all button types in the button panel system.
 */

import React from 'react';

/**
 * Base configuration for all buttons
 */
export interface BaseButtonConfig {
  /** Unique identifier for the button */
  id: string;

  /** Tooltip text to display on hover */
  tooltip: string;

  /** Whether the button is visible */
  visible?: boolean;

  /** Whether the button is enabled (clickable) */
  enabled?: boolean;

  /** Visual configuration */
  styling?: ButtonStyling;

  /** Debounce delay for click events in milliseconds */
  debounceDelay?: number;
}

/**
 * Visual styling configuration for buttons
 */
export interface ButtonStyling {
  /** Button size in pixels */
  size?: number;

  /** Default button color */
  color?: string;

  /** Button background color */
  background?: string;

  /** Border radius in pixels */
  borderRadius?: number;

  /** Hover color */
  hoverColor?: string;

  /** Hover background color */
  hoverBackground?: string;

  /** Border style */
  border?: string;

  /** Box shadow on hover */
  hoverBoxShadow?: string;
}

/**
 * Button state for tracking interaction
 */
export interface ButtonState {
  /** Whether button is currently hovered */
  isHovered: boolean;

  /** Whether button is currently pressed */
  isPressed: boolean;

  /** Custom state specific to button type */
  customState?: Record<string, any>;
}

/**
 * Button event handlers
 */
export interface ButtonEventHandlers {
  /** Click event handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;

  /** Mouse enter handler */
  onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;

  /** Mouse leave handler */
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;

  /** Mouse down handler */
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;

  /** Mouse up handler */
  onMouseUp?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Default button styling values
 */
export const DEFAULT_BUTTON_STYLING: Required<ButtonStyling> = {
  size: 16,
  color: '#787B86',
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: 3,
  hoverColor: '#131722',
  hoverBackground: 'rgba(255, 255, 255, 1)',
  border: 'none',
  hoverBoxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};
