/**
 * @fileoverview Series Settings button for opening series configuration dialog
 *
 * Provides access to series configuration for the pane.
 * Opens the SeriesSettingsDialog when clicked.
 */

import React from 'react';
import { BaseButton } from '../base/BaseButton';
import { BaseButtonConfig, ButtonState } from '../base/ButtonConfig';

/**
 * Configuration for SeriesSettingsButton
 */
export interface SeriesSettingsButtonConfig extends BaseButtonConfig {
  /** Callback when series settings button is clicked */
  onSeriesSettingsClick: () => void;

  /** Custom settings icon (optional override) */
  customIcon?: React.ReactNode;
}

/**
 * Series Settings button for opening series configuration
 *
 * Features:
 * - TradingView-style settings icon
 * - Opens series configuration dialog
 * - Supports custom icons
 * - Debounced click handling
 *
 * @example
 * ```typescript
 * const settingsButton = new SeriesSettingsButton({
 *   id: 'settings-button',
 *   tooltip: 'Series Settings',
 *   onSeriesSettingsClick: () => openSeriesDialog(),
 * });
 * ```
 */
export class SeriesSettingsButton extends BaseButton {
  private settingsConfig: SeriesSettingsButtonConfig;

  constructor(config: SeriesSettingsButtonConfig) {
    super({
      ...config,
      tooltip: config.tooltip || 'Series Settings',
    });

    this.settingsConfig = config;
  }

  /**
   * Get the settings icon SVG
   */
  public getIcon(_state: ButtonState): React.ReactNode {
    // Allow custom icon override
    if (this.settingsConfig.customIcon) {
      return this.settingsConfig.customIcon;
    }

    // Default TradingView-style settings icon
    return (
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18' width='16' height='16'>
        <path
          fill='currentColor'
          fillRule='evenodd'
          d='m3.1 9 2.28-5h7.24l2.28 5-2.28 5H5.38L3.1 9Zm1.63-6h8.54L16 9l-2.73 6H4.73L2 9l2.73-6Zm5.77 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm1 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z'
        ></path>
      </svg>
    );
  }

  /**
   * Handle series settings button click
   */
  public handleClick(): void {
    if (this.settingsConfig.onSeriesSettingsClick) {
      this.settingsConfig.onSeriesSettingsClick();
    }
  }

  /**
   * Get tooltip text
   */
  public getTooltip(_state: ButtonState): string {
    return this.config.tooltip;
  }

  /**
   * Update series settings-specific configuration
   */
  public updateSeriesSettingsConfig(updates: Partial<SeriesSettingsButtonConfig>): void {
    this.settingsConfig = { ...this.settingsConfig, ...updates };
    this.updateConfig(updates);
  }
}

/**
 * Factory function to create a SeriesSettingsButton
 */
export function createSeriesSettingsButton(
  config: SeriesSettingsButtonConfig
): SeriesSettingsButton {
  return new SeriesSettingsButton(config);
}
