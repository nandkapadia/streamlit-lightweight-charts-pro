/**
 * @fileoverview Button Panel Primitive for pane controls (Framework-Agnostic)
 *
 * This primitive provides TradingView-style pane controls including collapse functionality and series configuration.
 * It follows the same pattern as RangeSwitcherPrimitive, extending BasePanePrimitive for consistent positioning.
 *
 * Key features:
 * - TradingView-style pane collapse/expand functionality
 * - Series configuration dialog with real-time option changes
 * - Automatic positioning via BasePanePrimitive/CornerLayoutManager
 * - Pure DOM button components (zero React dependencies)
 * - Support for configurable corner positioning
 * - Framework-agnostic backend sync via BackendSyncAdapter
 */

import { BasePanePrimitive, PrimitivePriority, type BasePrimitiveConfig } from './BasePanePrimitive';
import { ButtonDimensions } from './PrimitiveDefaults';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { PaneCollapseManager } from '../services/PaneCollapseManager';
import { SeriesDialogManager } from '../services/SeriesDialogManager';
import { BackendSyncAdapter } from '../services/BackendSyncAdapter';
import { type SeriesConfiguration } from '../types/SeriesTypes';
import { logger } from '../utils/logger';
import { ButtonRegistry } from '../components/buttons/base/ButtonRegistry';
import { CollapseButton } from '../components/buttons/types/CollapseButton';
import { SeriesSettingsButton } from '../components/buttons/types/SeriesSettingsButton';
import { type ButtonStyling } from '../components/buttons/base/ButtonConfig';
import { BaseButton } from '../components/buttons/base/BaseButton';

/**
 * Configuration interface for ButtonPanelPrimitive
 */
export interface ButtonPanelPrimitiveConfig extends BasePrimitiveConfig {
  /** Whether this is a pane-specific primitive (vs chart-level) */
  isPanePrimitive?: boolean;
  /** Pane ID this button panel belongs to */
  paneId: number;
  /** Chart ID for backend synchronization */
  chartId?: string;
  /** Backend sync adapter for configuration persistence */
  backendAdapter: BackendSyncAdapter;
  /** Button configuration options */
  buttonSize?: number;
  buttonColor?: string;
  buttonHoverColor?: string;
  buttonBackground?: string;
  buttonHoverBackground?: string;
  buttonBorderRadius?: number;
  showTooltip?: boolean;
  tooltipText?: {
    collapse?: string;
    expand?: string;
  };
  showCollapseButton?: boolean;
  showSeriesSettingsButton?: boolean;
  /** Callback fired when pane is collapsed */
  onPaneCollapse?: (paneId: number, isCollapsed: boolean) => void;
  /** Callback fired when pane is expanded */
  onPaneExpand?: (paneId: number, isCollapsed: boolean) => void;
  /** Callback fired when series config changes */
  onSeriesConfigChange?: (
    paneId: number,
    seriesId: string,
    config: Record<string, unknown>
  ) => void;
}

/**
 * Button Panel Primitive - TradingView-style pane controls (Framework-Agnostic)
 *
 * Provides collapse/expand functionality and series configuration dialogs
 * using pure DOM buttons integrated with the chart's rendering pipeline.
 *
 * This is a framework-agnostic implementation with zero React dependencies.
 */
export class ButtonPanelPrimitive extends BasePanePrimitive<ButtonPanelPrimitiveConfig> {
  private collapseManager: PaneCollapseManager | null = null;
  private dialogManager: SeriesDialogManager | null = null;
  private buttonRegistry: ButtonRegistry | null = null;
  private buttonContainer: HTMLDivElement | null = null;
  private isInitialized = false;

  constructor(id: string, config: ButtonPanelPrimitiveConfig) {
    super(id, {
      visible: config.visible !== false,
      ...config,
      corner: config.corner || 'top-right',
      priority: config.priority || PrimitivePriority.MINIMIZE_BUTTON,
    });
  }

  /**
   * Initialize managers when chart is attached
   */
  private initializeManagers(): void {
    logger.info(
      `initializeManagers called - chart: ${!!this.chart}, paneId: ${this.config.paneId}`,
      'ButtonPanelPrimitive'
    );

    if (!this.chart) {
      logger.warn('initializeManagers aborted - chart is null', 'ButtonPanelPrimitive');
      return;
    }

    // Initialize collapse manager
    if (!this.collapseManager) {
      this.collapseManager = PaneCollapseManager.getInstance(this.chart, this.config.chartId);
      // Pass callbacks to initializePane to support per-pane callbacks (fixes singleton issue)
      this.collapseManager.initializePane(this.config.paneId, {
        onPaneCollapse: this.config.onPaneCollapse,
        onPaneExpand: this.config.onPaneExpand,
      });
      logger.info('CollapseManager initialized', 'ButtonPanelPrimitive');
    }

    // Initialize dialog manager
    if (!this.dialogManager) {
      this.dialogManager = SeriesDialogManager.getInstance(
        this.chart,
        this.config.backendAdapter,
        this.config.chartId,
        {
          chartId: this.config.chartId,
          onSeriesConfigChange: this.config.onSeriesConfigChange,
        }
      );
      this.dialogManager.initializePane(this.config.paneId);
      logger.info('DialogManager initialized', 'ButtonPanelPrimitive');
    }
  }

  // ===== BasePanePrimitive Abstract Methods =====

  protected renderContent(): void {
    if (!this.containerElement) return;

    // Prevent infinite re-initialization
    if (this.isInitialized) return;

    this.isInitialized = true;

    // Clear existing content
    this.containerElement.innerHTML = '';

    // Create container for buttons
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'button-panel-container';
    this.buttonContainer.style.display = 'flex';
    this.buttonContainer.style.gap = '4px';
    this.buttonContainer.style.alignItems = 'center';

    this.containerElement.appendChild(this.buttonContainer);

    // Initialize button registry and buttons
    this.initializeButtons();
  }

  protected getContainerClassName(): string {
    return `button-panel-primitive-${this.config.paneId}`;
  }

  protected getTemplate(): string {
    // Button panel uses DOM-based button components
    return '';
  }

  // ===== Button Initialization and Management =====

  /**
   * Initialize button registry and create button instances
   */
  private initializeButtons(): void {
    logger.info(
      `initializeButtons called - container: ${!!this.buttonContainer}, collapseManager: ${!!this.collapseManager}, dialogManager: ${!!this.dialogManager}`,
      'ButtonPanelPrimitive'
    );
    logger.info(
      `Config: showCollapseButton=${this.config.showCollapseButton}, showSeriesSettingsButton=${this.config.showSeriesSettingsButton}`,
      'ButtonPanelPrimitive'
    );

    if (!this.buttonContainer) {
      logger.warn('initializeButtons aborted - buttonContainer is null', 'ButtonPanelPrimitive');
      return;
    }

    // Create new button registry
    this.buttonRegistry = new ButtonRegistry();
    logger.info('ButtonRegistry created', 'ButtonPanelPrimitive');

    // Get button styling configuration
    const styling = this.getButtonStyling();

    // Create collapse button if enabled
    logger.info(
      `Checking collapse button - showCollapseButton !== false: ${this.config.showCollapseButton !== false}`,
      'ButtonPanelPrimitive'
    );
    if (this.config.showCollapseButton !== false) {
      const collapseButton = new CollapseButton({
        id: `collapse-${this.config.paneId}`,
        tooltip: this.config.tooltipText?.collapse || 'Collapse pane',
        isCollapsed: this.collapseManager?.isCollapsed(this.config.paneId) || false,
        onCollapseClick: () => this.togglePaneCollapse(),
        expandTooltip: this.config.tooltipText?.expand || 'Expand pane',
        collapseTooltip: this.config.tooltipText?.collapse || 'Collapse pane',
        styling,
        visible: true,
        enabled: true,
        debounceDelay: 300,
      });

      this.buttonRegistry.register(collapseButton, 10);
      logger.info('CollapseButton registered', 'ButtonPanelPrimitive');
    }

    // Create series settings button if enabled
    logger.info(
      `Checking series settings button - showSeriesSettingsButton !== false: ${this.config.showSeriesSettingsButton !== false}`,
      'ButtonPanelPrimitive'
    );
    if (this.config.showSeriesSettingsButton !== false) {
      try {
        logger.info('Creating SeriesSettingsButton...', 'ButtonPanelPrimitive');
        const settingsButton = new SeriesSettingsButton({
          id: `series-settings-${this.config.paneId}`,
          tooltip: 'Series Settings',
          onSeriesSettingsClick: () => void this.openSeriesConfigDialog(),
          styling,
          visible: true,
          enabled: true,
          debounceDelay: 300,
        });

        logger.info('SeriesSettingsButton created, registering...', 'ButtonPanelPrimitive');
        this.buttonRegistry.register(settingsButton, 20);
        logger.info('SeriesSettingsButton registered', 'ButtonPanelPrimitive');
      } catch (error) {
        logger.error('Failed to create SeriesSettingsButton', 'ButtonPanelPrimitive', error);
      }
    }

    // Render buttons using pure DOM
    logger.info(
      `About to renderButtons - registry count: ${this.buttonRegistry.getButtonCount()}`,
      'ButtonPanelPrimitive'
    );
    this.renderButtons();
  }

  /**
   * Get button styling configuration
   */
  private getButtonStyling(): ButtonStyling {
    return {
      size: ButtonDimensions.PANE_ACTION_WIDTH,
      color: this.config.buttonColor || '#787B86',
      hoverColor: this.config.buttonHoverColor || '#131722',
      background: this.config.buttonBackground || 'rgba(255, 255, 255, 0.9)',
      hoverBackground: this.config.buttonHoverBackground || 'rgba(255, 255, 255, 1)',
      border: 'none',
      borderRadius: this.config.buttonBorderRadius || ButtonDimensions.PANE_ACTION_BORDER_RADIUS,
      hoverBoxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    };
  }

  /**
   * Render buttons to DOM using pure DOM manipulation (no React)
   */
  private renderButtons(): void {
    if (!this.buttonContainer || !this.buttonRegistry) {
      logger.warn(
        `renderButtons aborted - container: ${!!this.buttonContainer}, registry: ${!!this.buttonRegistry}`,
        'ButtonPanelPrimitive'
      );
      return;
    }

    const buttons = this.buttonRegistry.getVisibleButtons();
    logger.info(
      `renderButtons - visible buttons: ${buttons.length}, all buttons: ${this.buttonRegistry.getButtonCount()}`,
      'ButtonPanelPrimitive'
    );

    if (buttons.length === 0) {
      logger.warn('renderButtons - no visible buttons to render', 'ButtonPanelPrimitive');
      return;
    }

    // Clear existing buttons
    this.buttonContainer.innerHTML = '';

    // Append each button's DOM element
    buttons.forEach((button: BaseButton) => {
      const buttonElement = button.getElement();
      logger.info(
        `Appending button ${button.getId()}, element has ${buttonElement.onclick ? 'inline' : 'no'} onclick, has ${(buttonElement as any)._hasEventListeners ? 'event' : 'no'} listeners`,
        'ButtonPanelPrimitive'
      );
      this.buttonContainer!.appendChild(buttonElement);
      logger.info(`Appended button ${button.getId()} to container`, 'ButtonPanelPrimitive');
    });

    logger.info(`renderButtons complete - ${buttons.length} buttons rendered`, 'ButtonPanelPrimitive');
  }

  /**
   * Update collapse button state
   */
  private updateCollapseButton(): void {
    if (!this.buttonRegistry || !this.collapseManager) return;

    const collapseButton = this.buttonRegistry.getButton(`collapse-${this.config.paneId}`) as
      | CollapseButton
      | undefined;

    if (collapseButton) {
      const isCollapsed = this.collapseManager.isCollapsed(this.config.paneId);
      collapseButton.setCollapsedState(isCollapsed);
    }
  }

  // ===== Lifecycle Hooks =====

  protected onAttached(_params: {
    chart: IChartApi;
    series: ISeriesApi<any>;
    requestUpdate: () => void;
  }): void {
    // Initialize managers now that chart is attached (only once)
    if (!this.collapseManager || !this.dialogManager) {
      this.initializeManagers();
    }
  }

  /**
   * Override pane ID for pane-specific button panels
   */
  protected getPaneId(): number {
    return this.config.paneId !== undefined && this.config.paneId > 0 ? this.config.paneId : 0;
  }

  protected onDetached(): void {
    // Destroy all button DOM elements
    if (this.buttonRegistry) {
      const buttons = this.buttonRegistry.getAllButtons();
      buttons.forEach((button: BaseButton) => {
        button.destroy();
      });
      this.buttonRegistry.clear();
      this.buttonRegistry = null;
    }

    // Clear button container reference
    this.buttonContainer = null;

    // Reset initialization flag
    this.isInitialized = false;

    // Managers will handle their own cleanup via singleton lifecycle
    this.collapseManager = null;
    this.dialogManager = null;
  }

  // ===== Pane Collapse Functionality =====

  private togglePaneCollapse(): void {
    if (!this.collapseManager) {
      logger.error('Collapse manager not initialized', 'ButtonPanelPrimitive');
      return;
    }

    try {
      this.collapseManager.toggle(this.config.paneId);

      // Update button visual state
      this.updateCollapseButton();
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  // ===== Series Configuration Dialog =====

  private async openSeriesConfigDialog(): Promise<void> {
    logger.info(
      `openSeriesConfigDialog called - paneId: ${this.config.paneId}, dialogManager: ${!!this.dialogManager}`,
      'ButtonPanelPrimitive'
    );

    if (!this.dialogManager) {
      logger.error('Dialog manager not initialized', 'ButtonPanelPrimitive');
      return;
    }

    try {
      logger.info('Calling dialogManager.open()', 'ButtonPanelPrimitive');
      this.dialogManager.open(this.config.paneId);
      logger.info('dialogManager.open() completed', 'ButtonPanelPrimitive');
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  /**
   * Override getDimensions to return fixed button panel dimensions
   */
  public getDimensions(): { width: number; height: number } {
    const buttonWidth = ButtonDimensions.PANE_ACTION_WIDTH;
    const gap = 4;

    let visibleButtonCount = 0;
    if (this.config.showCollapseButton !== false) visibleButtonCount++;
    if (this.config.showSeriesSettingsButton !== false) visibleButtonCount++;

    const width = visibleButtonCount * buttonWidth + (visibleButtonCount - 1) * gap;
    const height = ButtonDimensions.PANE_ACTION_HEIGHT;

    return { width, height };
  }

  // ===== Public API =====

  public getSeriesConfig(seriesId: string): SeriesConfiguration | null {
    return this.dialogManager?.getSeriesConfig(this.config.paneId, seriesId) || null;
  }

  public setSeriesConfig(seriesId: string, config: SeriesConfiguration): void {
    this.dialogManager?.setSeriesConfig(this.config.paneId, seriesId, config);
  }

  public syncToBackend(): void {
    this.config.backendAdapter.forceSyncToBackend();
  }
}

// ===== Factory Functions =====

/**
 * Create a ButtonPanelPrimitive for a pane
 *
 * @param paneId - Pane identifier
 * @param backendAdapter - Backend sync adapter for configuration persistence
 * @param config - Optional configuration overrides
 * @param chartId - Optional chart identifier
 * @returns ButtonPanelPrimitive instance
 */
export function createButtonPanelPrimitive(
  paneId: number,
  backendAdapter: BackendSyncAdapter,
  config: Partial<Omit<ButtonPanelPrimitiveConfig, 'paneId' | 'backendAdapter'>> = {},
  chartId?: string
): ButtonPanelPrimitive {
  const id = `button-panel-pane-${paneId}-${chartId || 'default'}`;

  const fullConfig: ButtonPanelPrimitiveConfig = {
    corner: 'top-right',
    priority: PrimitivePriority.MINIMIZE_BUTTON,
    isPanePrimitive: paneId > 0,
    paneId,
    backendAdapter,
    chartId,
    buttonSize: 16,
    buttonColor: '#787B86',
    buttonHoverColor: '#131722',
    buttonBackground: 'rgba(255, 255, 255, 0.9)',
    buttonHoverBackground: 'rgba(255, 255, 255, 1)',
    buttonBorderRadius: 3,
    showTooltip: true,
    // TODO: Fix collapse functionality - currently not working properly
    // The pane collapse/expand feature needs to be debugged and fixed before re-enabling
    showCollapseButton: false,
    showSeriesSettingsButton: true,
    tooltipText: {
      collapse: 'Collapse pane',
      expand: 'Expand pane',
    },
    ...config,
  };

  return new ButtonPanelPrimitive(id, fullConfig);
}

/**
 * Create multiple ButtonPanelPrimitives for multiple panes
 *
 * @param paneIds - Array of pane identifiers
 * @param backendAdapter - Backend sync adapter for configuration persistence
 * @param config - Optional configuration overrides
 * @param chartId - Optional chart identifier
 * @returns Array of ButtonPanelPrimitive instances
 */
export function createButtonPanelPrimitives(
  paneIds: number[],
  backendAdapter: BackendSyncAdapter,
  config: Partial<Omit<ButtonPanelPrimitiveConfig, 'paneId' | 'backendAdapter'>> = {},
  chartId?: string
): ButtonPanelPrimitive[] {
  return paneIds.map(paneId => createButtonPanelPrimitive(paneId, backendAdapter, config, chartId));
}
