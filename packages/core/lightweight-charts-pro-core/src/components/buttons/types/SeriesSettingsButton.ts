/**
 * @fileoverview Series Settings button for opening series configuration dialog (Pure TypeScript)
 *
 * Provides access to series configuration for the pane.
 * Opens the SeriesSettingsDialog when clicked.
 *
 * This is a pure TypeScript implementation with zero React dependencies.
 */

import { BaseButton } from '../base/BaseButton';
import { BaseButtonConfig, ButtonState } from '../base/ButtonConfig';

/**
 * Configuration for SeriesSettingsButton
 */
export interface SeriesSettingsButtonConfig extends BaseButtonConfig {
  /** Callback when series settings button is clicked */
  onSeriesSettingsClick: () => void;

  /** Custom settings icon SVG (optional override) */
  customIcon?: string;
}

/**
 * Series Settings button for opening series configuration (Pure TypeScript)
 *
 * Features:
 * - TradingView-style settings icon
 * - Opens series configuration dialog
 * - Supports custom icons
 * - Debounced click handling
 * - Zero React dependencies
 *
 * @example
 * ```typescript
 * const settingsButton = new SeriesSettingsButton({
 *   id: 'settings-button',
 *   tooltip: 'Series Settings',
 *   onSeriesSettingsClick: () => openSeriesDialog(),
 * });
 *
 * // Append to DOM
 * container.appendChild(settingsButton.getElement());
 *
 * // Cleanup
 * settingsButton.destroy();
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
  protected getIconSVG(_state: ButtonState): string {
    // Allow custom icon override
    // IMPORTANT: settingsConfig might be undefined during super() constructor call
    if (this.settingsConfig?.customIcon) {
      return this.settingsConfig.customIcon;
    }

    // Default TradingView-style settings icon
    // IMPORTANT: pointer-events="none" to allow clicks to pass through to button element
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="16" height="16" style="pointer-events: none;">
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="m3.1 9 2.28-5h7.24l2.28 5-2.28 5H5.38L3.1 9Zm1.63-6h8.54L16 9l-2.73 6H4.73L2 9l2.73-6Zm5.77 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm1 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
        style="pointer-events: none;"
      ></path>
    </svg>`;
  }

  /**
   * Handle series settings button click
   */
  public handleClick(): void {
    if (this.settingsConfig?.onSeriesSettingsClick) {
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
