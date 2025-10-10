/**
 * @fileoverview Gear button for opening series settings dialog
 *
 * Provides access to series configuration for the pane.
 * Opens the SeriesSettingsDialog when clicked.
 */

import React from 'react';
import { BaseButton } from '../base/BaseButton';
import { BaseButtonConfig, ButtonState } from '../base/ButtonConfig';

/**
 * Configuration for GearButton
 */
export interface GearButtonConfig extends BaseButtonConfig {
  /** Callback when gear button is clicked */
  onGearClick: () => void;

  /** Custom gear icon (optional override) */
  customIcon?: React.ReactNode;
}

/**
 * Gear button for series settings
 *
 * Features:
 * - TradingView-style settings icon
 * - Opens series configuration dialog
 * - Supports custom icons
 * - Debounced click handling
 *
 * @example
 * ```typescript
 * const gearButton = new GearButton({
 *   id: 'gear-button',
 *   tooltip: 'Series Settings',
 *   onGearClick: () => openSeriesDialog(),
 * });
 * ```
 */
export class GearButton extends BaseButton {
  private gearConfig: GearButtonConfig;

  constructor(config: GearButtonConfig) {
    super({
      ...config,
      tooltip: config.tooltip || 'Series Settings',
    });

    this.gearConfig = config;
  }

  /**
   * Get the gear icon SVG
   */
  public getIcon(_state: ButtonState): React.ReactNode {
    // Allow custom icon override
    if (this.gearConfig.customIcon) {
      return this.gearConfig.customIcon;
    }

    // Default TradingView-style gear icon
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
   * Handle gear button click
   */
  public handleClick(): void {
    if (this.gearConfig.onGearClick) {
      this.gearConfig.onGearClick();
    }
  }

  /**
   * Get tooltip text
   */
  public getTooltip(_state: ButtonState): string {
    return this.config.tooltip;
  }

  /**
   * Update gear-specific configuration
   */
  public updateGearConfig(updates: Partial<GearButtonConfig>): void {
    this.gearConfig = { ...this.gearConfig, ...updates };
    this.updateConfig(updates);
  }
}

/**
 * Factory function to create a GearButton
 */
export function createGearButton(config: GearButtonConfig): GearButton {
  return new GearButton(config);
}
