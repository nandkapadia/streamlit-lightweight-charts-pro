/**
 * @fileoverview Collapse button for pane expand/collapse (Pure TypeScript)
 *
 * Provides pane collapse/expand functionality with dynamic icon
 * that changes based on collapsed state.
 *
 * This is a pure TypeScript implementation with zero React dependencies.
 */

import { BaseButton } from '../base/BaseButton';
import { BaseButtonConfig, ButtonState } from '../base/ButtonConfig';

/**
 * Configuration for CollapseButton
 */
export interface CollapseButtonConfig extends BaseButtonConfig {
  /** Callback when collapse button is clicked */
  onCollapseClick: () => void;

  /** Current collapsed state */
  isCollapsed: boolean;

  /** Custom expand icon SVG (optional override) */
  customExpandIcon?: string;

  /** Custom collapse icon SVG (optional override) */
  customCollapseIcon?: string;

  /** Tooltip text for expand state */
  expandTooltip?: string;

  /** Tooltip text for collapse state */
  collapseTooltip?: string;
}

/**
 * Collapse button for pane management (Pure TypeScript)
 *
 * Features:
 * - Dynamic icon based on collapsed state
 * - TradingView-style chevron icons
 * - State-aware tooltips
 * - Supports custom icons
 * - Debounced click handling
 * - Zero React dependencies
 *
 * @example
 * ```typescript
 * const collapseButton = new CollapseButton({
 *   id: 'collapse-button',
 *   tooltip: 'Collapse pane',
 *   isCollapsed: false,
 *   onCollapseClick: () => togglePaneCollapse(),
 * });
 *
 * // Append to DOM
 * container.appendChild(collapseButton.getElement());
 *
 * // Update state
 * collapseButton.setCollapsedState(true);
 *
 * // Cleanup
 * collapseButton.destroy();
 * ```
 */
export class CollapseButton extends BaseButton {
  private collapseConfig: CollapseButtonConfig;

  constructor(config: CollapseButtonConfig) {
    super({
      ...config,
      tooltip: config.isCollapsed
        ? config.expandTooltip || 'Expand pane'
        : config.collapseTooltip || 'Collapse pane',
    });

    this.collapseConfig = config;
  }

  /**
   * Get the collapse/expand icon SVG based on state
   */
  protected getIconSVG(_state: ButtonState): string {
    // IMPORTANT: collapseConfig might be undefined during super() constructor call
    const isCollapsed = this.collapseConfig?.isCollapsed ?? false;

    // Allow custom icon overrides
    if (isCollapsed && this.collapseConfig?.customExpandIcon) {
      return this.collapseConfig.customExpandIcon;
    }
    if (!isCollapsed && this.collapseConfig?.customCollapseIcon) {
      return this.collapseConfig.customCollapseIcon;
    }

    // Default TradingView-style icons
    if (isCollapsed) {
      // Expand icon (reversed double chevron)
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="16" height="16" fill="none">
        <path stroke="currentColor" d="M4 13l3.5-3 3.5 3" class="bracket-down"></path>
        <path stroke="currentColor" d="M11 2 7.5 5 4 2" class="bracket-up"></path>
      </svg>`;
    } else {
      // Collapse icon (double chevron)
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="16" height="16" fill="none">
        <path stroke="currentColor" d="M11 2 7.5 5 4 2" class="bracket-up"></path>
        <path stroke="currentColor" d="M4 13l3.5-3 3.5 3" class="bracket-down"></path>
      </svg>`;
    }
  }

  /**
   * Handle collapse button click
   */
  public handleClick(): void {
    this.collapseConfig.onCollapseClick();
  }

  /**
   * Get tooltip text based on collapsed state
   */
  public getTooltip(_state: ButtonState): string {
    return this.collapseConfig.isCollapsed
      ? this.collapseConfig.expandTooltip || 'Expand pane'
      : this.collapseConfig.collapseTooltip || 'Collapse pane';
  }

  /**
   * Update collapsed state
   *
   * Call this when the pane's collapsed state changes to update
   * the button's icon and tooltip.
   */
  public setCollapsedState(isCollapsed: boolean): void {
    this.collapseConfig.isCollapsed = isCollapsed;

    // Update tooltip
    this.config.tooltip = isCollapsed
      ? this.collapseConfig.expandTooltip || 'Expand pane'
      : this.collapseConfig.collapseTooltip || 'Collapse pane';

    // Trigger re-render
    this.updateConfig({});
  }

  /**
   * Get current collapsed state
   */
  public getCollapsedState(): boolean {
    return this.collapseConfig.isCollapsed;
  }

  /**
   * Update collapse-specific configuration
   */
  public updateCollapseConfig(updates: Partial<CollapseButtonConfig>): void {
    this.collapseConfig = { ...this.collapseConfig, ...updates };
    this.updateConfig(updates);

    // Update tooltip if collapsed state changed
    if (updates.isCollapsed !== undefined) {
      this.setCollapsedState(updates.isCollapsed);
    }
  }
}

/**
 * Factory function to create a CollapseButton
 */
export function createCollapseButton(config: CollapseButtonConfig): CollapseButton {
  return new CollapseButton(config);
}
