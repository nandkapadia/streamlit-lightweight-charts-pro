/**
 * @fileoverview Delete button for removing series (example custom button)
 *
 * This is an example of how to create a custom button extending BaseButton.
 * Demonstrates the extensibility of the button architecture.
 */

import React from 'react';
import { BaseButton } from '../base/BaseButton';
import { BaseButtonConfig, ButtonState } from '../base/ButtonConfig';

/**
 * Configuration for DeleteButton
 */
export interface DeleteButtonConfig extends BaseButtonConfig {
  /** Callback when delete button is clicked */
  onDeleteClick: () => void;

  /** Custom delete icon (optional override) */
  customIcon?: React.ReactNode;

  /** Whether to show confirmation before delete */
  requireConfirmation?: boolean;
}

/**
 * Delete button for removing series
 *
 * Features:
 * - TradingView-style delete icon
 * - Optional confirmation before delete
 * - Supports custom icons
 * - Debounced click handling
 *
 * @example
 * ```typescript
 * const deleteButton = new DeleteButton({
 *   id: 'delete-button',
 *   tooltip: 'Delete series',
 *   onDeleteClick: () => removeSeries(),
 *   requireConfirmation: true,
 * });
 * ```
 */
export class DeleteButton extends BaseButton {
  private deleteConfig: DeleteButtonConfig;

  constructor(config: DeleteButtonConfig) {
    super({
      ...config,
      tooltip: config.tooltip || 'Delete series',
    });

    this.deleteConfig = config;
  }

  /**
   * Get the delete icon SVG
   */
  public getIcon(_state: ButtonState): React.ReactNode {
    // Allow custom icon override
    if (this.deleteConfig.customIcon) {
      return this.deleteConfig.customIcon;
    }

    // Default trash/delete icon
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='16' height='16'>
        <path
          fill='currentColor'
          d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'
        />
      </svg>
    );
  }

  /**
   * Handle delete button click
   */
  public handleClick(): void {
    if (this.deleteConfig.requireConfirmation) {
      // Show confirmation dialog
      const confirmed = window.confirm('Are you sure you want to delete this series?');
      if (!confirmed) {
        return;
      }
    }

    if (this.deleteConfig.onDeleteClick) {
      this.deleteConfig.onDeleteClick();
    }
  }

  /**
   * Get tooltip text
   */
  public getTooltip(_state: ButtonState): string {
    return this.config.tooltip;
  }

  /**
   * Update delete-specific configuration
   */
  public updateDeleteConfig(updates: Partial<DeleteButtonConfig>): void {
    this.deleteConfig = { ...this.deleteConfig, ...updates };
    this.updateConfig(updates);
  }
}

/**
 * Factory function to create a DeleteButton
 */
export function createDeleteButton(config: DeleteButtonConfig): DeleteButton {
  return new DeleteButton(config);
}
