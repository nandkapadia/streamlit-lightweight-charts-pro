/**
 * @fileoverview Button Panel Primitive for pane controls.
 *
 * This primitive provides TradingView-style pane controls including collapse functionality and series configuration.
 * It follows the same pattern as RangeSwitcherPrimitive, extending BasePanePrimitive for consistent positioning.
 *
 * Key features:
 * - TradingView-style pane collapse/expand functionality
 * - Series configuration dialog with real-time option changes
 * - Automatic positioning via BasePanePrimitive/CornerLayoutManager
 * - React-based UI components with proper lifecycle management
 * - Support for configurable corner positioning
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BasePanePrimitive, BasePrimitiveConfig, PrimitivePriority } from './BasePanePrimitive';
import { ButtonDimensions } from './PrimitiveDefaults';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { SeriesType, SeriesConfiguration } from '../types/SeriesTypes';
import { StreamlitSeriesConfigService } from '../services/StreamlitSeriesConfigService';
import { SeriesSettingsDialog, SeriesInfo as DialogSeriesInfo } from '../forms/SeriesSettingsDialog';
import { logger } from '../utils/logger';
import { createSingleton } from '../utils/SingletonBase';

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
  showGearButton?: boolean;
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
 * Pane state management
 */
interface PaneState {
  isCollapsed: boolean;
  originalHeight: number;
  collapsedHeight: number;
  dialogElement?: HTMLElement;
  dialogRoot?: ReturnType<typeof createRoot>;
  originalStretchFactor?: number;
  seriesConfigs: Map<string, SeriesConfiguration>;
}

/**
 * Series information for configuration dialog
 */
interface SeriesInfo {
  id: string;
  displayName: string;
  type: SeriesType;
  config: SeriesConfiguration;
  title?: string;
}

/**
 * Button Panel Primitive using BasePanePrimitive pattern
 */
export class ButtonPanelPrimitive extends BasePanePrimitive<ButtonPanelPrimitiveConfig> {
  private paneState: PaneState;
  private _streamlitService: StreamlitSeriesConfigService | null = null;

  constructor(id: string, config: ButtonPanelPrimitiveConfig) {
    super(id, {
      visible: config.visible !== false,
      ...config,
      corner: config.corner || 'top-right',
      priority: config.priority || PrimitivePriority.MINIMIZE_BUTTON,
    });

    // Initialize pane state
    this.paneState = {
      isCollapsed: false,
      originalHeight: 0,
      collapsedHeight: 45,
      seriesConfigs: new Map(),
    };
  }

  /**
   * Lazy getter for streamlit service
   */
  private get streamlitService(): StreamlitSeriesConfigService {
    if (!this._streamlitService) {
      this._streamlitService = createSingleton(StreamlitSeriesConfigService);
    }
    if (!this._streamlitService) {
      throw new Error('Failed to initialize StreamlitSeriesConfigService');
    }
    return this._streamlitService;
  }

  // ===== BasePanePrimitive Abstract Methods =====

  protected renderContent(): void {
    if (!this.containerElement) return;


    // Clear existing content
    this.containerElement.innerHTML = '';

    // Create container for buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-panel-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '4px';
    buttonContainer.style.alignItems = 'center';

    // Create collapse button if enabled
    if (this.config.showCollapseButton !== false) {
      const collapseButton = this.createCollapseButton();
      buttonContainer.appendChild(collapseButton);
    }

    // Create gear button if enabled
    if (this.config.showGearButton !== false) {
      const gearButton = this.createGearButton();
      buttonContainer.appendChild(gearButton);
    }

    this.containerElement.appendChild(buttonContainer);

    // Trigger layout recalculation after content is rendered
    setTimeout(() => {
      if (this.layoutManager) {
        this.layoutManager.recalculateAllLayouts();
      }
    }, 0);
  }

  protected getContainerClassName(): string {
    return `button-panel-primitive-${this.config.paneId}`;
  }

  protected getTemplate(): string {
    // Button panel doesn't use template rendering, it uses React components
    return '';
  }

  // ===== Button Creation Methods =====

  private createCollapseButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'collapse-button';
    button.innerHTML = this.getCollapseSVG();
    button.style.cssText = this.getButtonStyles();
    button.setAttribute('aria-label', this.paneState.isCollapsed ? 'Expand pane' : 'Collapse pane');

    // Add hover effects
    this.addButtonHoverEffects(button);

    button.addEventListener('click', () => {
      this.togglePaneCollapse();
      button.innerHTML = this.getCollapseSVG();
      button.setAttribute('aria-label', this.paneState.isCollapsed ? 'Expand pane' : 'Collapse pane');
    });

    return button;
  }

  private createGearButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'gear-button';
    button.innerHTML = this.getSettingsSVG();
    button.style.cssText = this.getButtonStyles();
    button.setAttribute('aria-label', 'Configure series');

    // Add hover effects
    this.addButtonHoverEffects(button);

    button.addEventListener('click', () => {
      this.openSeriesConfigDialog();
    });

    return button;
  }

  private getButtonStyles(): string {
    return `
      background: ${this.config.buttonBackground || 'rgba(255, 255, 255, 0.9)'};
      color: ${this.config.buttonColor || '#787B86'};
      border: none;
      border-radius: ${this.config.buttonBorderRadius || ButtonDimensions.PANE_ACTION_BORDER_RADIUS}px;
      width: ${ButtonDimensions.PANE_ACTION_WIDTH}px;
      height: ${ButtonDimensions.PANE_ACTION_HEIGHT}px;
      font-size: ${ButtonDimensions.FONT_SIZE}px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      padding: 0;
      margin: 0;
      font-weight: bold;
      transition: background-color 0.2s ease, color 0.2s ease;
    `;
  }

  private addButtonHoverEffects(button: HTMLElement): void {
    const originalBackground = this.config.buttonBackground || 'rgba(255, 255, 255, 0.9)';
    const hoverBackground = this.config.buttonHoverBackground || 'rgba(0, 0, 0, 0.1)';
    const originalColor = this.config.buttonColor || '#787B86';
    const hoverColor = this.config.buttonHoverColor || '#131722';

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = hoverBackground;
      button.style.color = hoverColor;
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = originalBackground;
      button.style.color = originalColor;
    });
  }

  private updateCollapseButton(): void {
    if (!this.containerElement) return;

    const collapseButton = this.containerElement.querySelector('.collapse-button') as HTMLElement;
    if (collapseButton) {
      collapseButton.innerHTML = this.getCollapseSVG();
      collapseButton.setAttribute('aria-label', this.paneState.isCollapsed ? 'Expand pane' : 'Collapse pane');
    }
  }

  // ===== SVG Icon Methods =====

  private getSettingsSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
      <path fill="currentColor" fill-rule="evenodd" d="m3.1 9 2.28-5h7.24l2.28 5-2.28 5H5.38L3.1 9Zm1.63-6h8.54L16 9l-2.73 6H4.73L2 9l2.73-6Zm5.77 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm1 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"></path>
    </svg>`;
  }

  private getCollapseSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="15" height="15" fill="none">
      <path stroke="currentColor" d="M11 2 7.5 5 4 2" class="bracket-up"></path>
      <path stroke="currentColor" d="M4 13l3.5-3 3.5 3" class="bracket-down"></path>
    </svg>`;
  }

  // ===== Lifecycle Hooks =====

  protected onAttached(_params: {
    chart: IChartApi;
    series: ISeriesApi<any>;
    requestUpdate: () => void;
  }): void {
    // Restore configurations from backend
    this.restoreConfigurationsFromBackend();
  }

  // ===== Override BasePanePrimitive methods for pane-specific behavior =====

  /**
   * Override pane ID for pane-specific button panels (follows LegendPrimitive pattern)
   * This is the key to proper positioning - conditional logic based on isPanePrimitive flag
   */
  protected getPaneId(): number {
    // Follow legend pattern: paneId > 0 determines if it's a pane primitive
    const result = this.config.paneId !== undefined && this.config.paneId > 0
      ? this.config.paneId
      : 0;

    return result;
  }


  protected onDetached(): void {
    // Cleanup dialog (still used for series configuration)
    if (this.paneState.dialogElement && this.paneState.dialogElement.parentNode) {
      this.paneState.dialogElement.parentNode.removeChild(this.paneState.dialogElement);
    }
    if (this.paneState.dialogRoot) {
      this.paneState.dialogRoot.unmount();
    }
  }


  // ===== Pane Collapse Functionality =====

  private togglePaneCollapse(): void {
    if (!this.chart) return;

    try {
      if (this.paneState.isCollapsed) {
        this.expandPane();
      } else {
        this.collapsePane();
      }
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  private collapsePane(): void {
    if (!this.chart || this.paneState.isCollapsed) return;

    try {
      const panes = this.chart.panes();
      if (this.config.paneId >= panes.length) return;

      const pane = panes[this.config.paneId];
      const currentStretchFactor = pane.getStretchFactor();
      const paneSize = this.chart.paneSize(this.config.paneId);

      this.paneState.originalStretchFactor = currentStretchFactor;
      if (paneSize) {
        this.paneState.originalHeight = paneSize.height;
      }

      const minimalStretchFactor = 0.05;
      pane.setStretchFactor(minimalStretchFactor);
      this.paneState.isCollapsed = true;

      const chartElement = this.chart.chartElement();
      if (chartElement) {
        this.chart.resize(chartElement.clientWidth, chartElement.clientHeight);
      }

      // Update button panel
      this.updateCollapseButton();

      if (this.config.onPaneCollapse) {
        this.config.onPaneCollapse(this.config.paneId, true);
      }
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  private expandPane(): void {
    if (!this.chart || !this.paneState.isCollapsed) return;

    try {
      const panes = this.chart.panes();
      if (this.config.paneId >= panes.length) return;

      const pane = panes[this.config.paneId];
      const originalStretchFactor = this.paneState.originalStretchFactor || 0.2;

      pane.setStretchFactor(originalStretchFactor);
      this.paneState.isCollapsed = false;

      const chartElement = this.chart.chartElement();
      if (chartElement) {
        this.chart.resize(chartElement.clientWidth, chartElement.clientHeight);
      }

      // Update button panel
      this.updateCollapseButton();

      if (this.config.onPaneExpand) {
        this.config.onPaneExpand(this.config.paneId, false);
      }
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  // ===== Series Configuration Dialog =====

  private openSeriesConfigDialog(): void {
    if (!this.chart) return;

    try {
      // Get ALL series for this pane
      const allSeries = this.getAllSeriesForPane();

      // Create dialog container if it doesn't exist
      if (!this.paneState.dialogElement) {
        const dialogContainer = document.createElement('div');
        dialogContainer.className = `series-config-dialog-container-${this.config.paneId}`;
        dialogContainer.style.position = 'fixed';
        dialogContainer.style.top = '0';
        dialogContainer.style.left = '0';
        dialogContainer.style.width = '100vw';
        dialogContainer.style.height = '100vh';
        dialogContainer.style.zIndex = '10000';
        dialogContainer.style.pointerEvents = 'auto';

        document.body.appendChild(dialogContainer);
        this.paneState.dialogElement = dialogContainer;
        this.paneState.dialogRoot = createRoot(dialogContainer);
      }

      // Create series configurations from allSeries
      const seriesConfigs: Record<string, any> = {};
      allSeries.forEach(series => {
        seriesConfigs[series.id] = series.config || {};
      });

      // Render the dialog with all series
      if (this.paneState.dialogRoot) {
        this.paneState.dialogRoot.render(
          React.createElement(SeriesSettingsDialog, {
            isOpen: true,
            onClose: () => this.closeSeriesConfigDialog(),
            paneId: this.config.paneId.toString(),
            seriesList: allSeries.map(series => ({
              id: series.id,
              displayName: series.displayName,
              type: series.type
            } as DialogSeriesInfo)),
            seriesConfigs: seriesConfigs,
            onConfigChange: (seriesId: string, newConfig: any) => {
              this.applySeriesConfig(seriesId, newConfig);
            },
          })
        );
      }
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  private closeSeriesConfigDialog(): void {
    if (!this.paneState.dialogRoot) return;

    try {
      // Render empty dialog (closed state)
      this.paneState.dialogRoot.render(
        React.createElement(SeriesSettingsDialog, {
          isOpen: false,
          onClose: () => {},
          paneId: this.config.paneId.toString(),
          seriesList: [],
          seriesConfigs: {},
          onConfigChange: () => {},
        })
      );
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  // ===== Series Management =====

  private mapSeriesType(apiSeriesType: string): SeriesType {
    // Map LightweightCharts API series types to our SeriesType enum
    switch (apiSeriesType) {
      case 'Line':
        return 'line';
      case 'Area':
        return 'area';
      case 'Histogram':
        return 'histogram';
      case 'Candlestick':
        return 'candlestick';
      case 'Bar':
        return 'bar';
      case 'Baseline':
        return 'baseline';
      case 'Ribbon':
        return 'ribbon';
      default:
        return 'line'; // default fallback
    }
  }

  private getAllSeriesForPane(): SeriesInfo[] {
    const seriesList: SeriesInfo[] = [];

    if (!this.chart) {
      return seriesList;
    }

    try {
      // Get all panes from the chart
      const panes = this.chart.panes();

      if (this.config.paneId >= 0 && this.config.paneId < panes.length) {
        const targetPane = panes[this.config.paneId];

        try {
          // Try to get actual series from the pane
          const actualSeries = targetPane.getSeries();

          if (actualSeries && actualSeries.length > 0) {
            // Group ribbon series together and process individual series
            const ribbonGroups = new Map<string, any[]>();
            const regularSeries: any[] = [];

            // First pass: identify and group ribbon series
            actualSeries.forEach((series: any, index: number) => {
              try {
                const options = series.options();
                const title = options?.title || '';


                if (title.startsWith('__RIBBON_UPPER__') || title.startsWith('__RIBBON_LOWER__')) {
                  // Extract the ribbon name after the prefix
                  const ribbonName = title.startsWith('__RIBBON_UPPER__')
                    ? title.replace('__RIBBON_UPPER__', '')
                    : title.replace('__RIBBON_LOWER__', '');

                  if (!ribbonGroups.has(ribbonName)) {
                    ribbonGroups.set(ribbonName, []);
                  }
                  ribbonGroups.get(ribbonName)?.push({ series, index, type: title.startsWith('__RIBBON_UPPER__') ? 'upper' : 'lower' });

                } else {
                  regularSeries.push({ series, index });
                }
              } catch (error) {
                logger.warn('Error checking ribbon series name', 'ButtonPanelPrimitive', error);
                regularSeries.push({ series, index });
              }
            });

            // Add grouped ribbon series
            ribbonGroups.forEach((ribbonSeries, ribbonName) => {
              const seriesId = `pane-${this.config.paneId}-ribbon-${ribbonName}`;
              const displayName = ribbonName || 'Ribbon';

              // Get existing config or create default for ribbon
              let seriesConfig = this.paneState.seriesConfigs.get(seriesId);
              if (!seriesConfig) {
                seriesConfig = this.getDefaultSeriesConfig('ribbon');
                this.paneState.seriesConfigs.set(seriesId, seriesConfig);
              }

              seriesList.push({
                id: seriesId,
                displayName,
                type: 'ribbon' as SeriesType,
                config: seriesConfig,
              });

            });

            // Add regular series
            regularSeries.forEach(({ series, index }) => {
              const seriesId = `pane-${this.config.paneId}-series-${index}`;

              // Try to determine series type from the series object
              let seriesType: SeriesType = 'line'; // default
              if (series.seriesType) {
                seriesType = this.mapSeriesType(series.seriesType());
              }

              // Get display name from series options
              let displayName = `Series ${index + 1}`;
              try {
                const options = series.options();

                // Get title from series options (now properly passed from seriesFactory)
                if (options?.title) {
                  displayName = options.title;
                }
              } catch (error) {
                logger.warn('Error getting series title', 'ButtonPanelPrimitive', error);
              }

              // Get existing config or create default
              let seriesConfig = this.paneState.seriesConfigs.get(seriesId);
              if (!seriesConfig) {
                seriesConfig = this.getDefaultSeriesConfig(seriesType);
                this.paneState.seriesConfigs.set(seriesId, seriesConfig);
              }

              seriesList.push({
                id: seriesId,
                displayName,
                type: seriesType,
                config: seriesConfig,
              });
            });
          } else {
            // No series found in this pane - this is expected for empty panes
            logger.debug('No series found in pane', 'ButtonPanelPrimitive', { paneId: this.config.paneId });
          }
        } catch (error) {
          // If we can't get actual series, log the error and return empty list
          logger.error('Failed to get series from pane', 'ButtonPanelPrimitive', error);
        }
      }
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }

    return seriesList;
  }


  private applySeriesConfig(seriesId: string, config: SeriesConfiguration): void {
    try {
      // Store the configuration locally
      this.paneState.seriesConfigs.set(seriesId, config);

      // Apply configuration changes to actual chart series objects
      this.applyConfigToChartSeries(seriesId, config);

      // Save to localStorage for immediate persistence
      this.saveSeriesConfig(seriesId, config);

      // Send to Streamlit backend for cross-session persistence
      const seriesType = this.inferSeriesType();
      this.streamlitService.recordConfigChange(
        this.config.paneId,
        seriesId,
        seriesType,
        config,
        this.config.chartId
      );

      // Notify external listeners if available
      if (this.config.onSeriesConfigChange) {
        this.config.onSeriesConfigChange(
          this.config.paneId,
          seriesId,
          config as Record<string, unknown>
        );
      }
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  private applyConfigToChartSeries(seriesId: string, config: SeriesConfiguration): void {
    if (!this.chart) {
      return;
    }

    try {

      // For demo purposes, we'll implement a basic mapping
      // In a production system, this would use a proper series registry
      const seriesOptions: any = {};

      // Map configuration options to LightweightCharts API options

      if (config.visible !== undefined) {
        seriesOptions.visible = config.visible;
      }
      if (config.color !== undefined) {
        seriesOptions.color = config.color;
      }
      if (config.title !== undefined) {
        seriesOptions.title = config.title;
      }
      if (config.lineWidth !== undefined) {
        seriesOptions.lineWidth = config.lineWidth;
      }
      if (config.lineStyle !== undefined) {
        seriesOptions.lineStyle = config.lineStyle;
      }
      if (config.lastValueVisible !== undefined) {
        seriesOptions.lastValueVisible = config.lastValueVisible;
      }
      if (config.priceLineVisible !== undefined) {
        seriesOptions.priceLineVisible = config.priceLineVisible;
      }


      // Try to find and update the series
      const panes = this.chart.panes();
      if (this.config.paneId >= 0 && this.config.paneId < panes.length && Object.keys(seriesOptions).length > 0) {

        // CRITICAL FIX: Try to find the actual series objects and apply options
        try {
          const targetPane = panes[this.config.paneId];
          const paneseries = targetPane.getSeries();

          if (paneseries.length > 0) {
            // Check if this is a ribbon series
            const ribbonMatch = seriesId.match(/ribbon-(.+)$/);

            if (ribbonMatch) {
              // This is a ribbon series - apply options to both upper and lower series
              const ribbonName = ribbonMatch[1];

              paneseries.forEach((series: any, _idx: number) => {
                try {
                  const options = series.options();
                  const title = options?.title || '';

                  if (title === `__RIBBON_UPPER__${ribbonName}` || title === `__RIBBON_LOWER__${ribbonName}`) {
                    if (series && typeof series.applyOptions === 'function') {
                      try {
                        series.applyOptions(seriesOptions);
                      } catch (error) {
                        logger.warn('Error applying ribbon series options', 'ButtonPanelPrimitive', error);
                      }
                    }
                  }
                } catch (error) {
                  logger.debug('Error getting ribbon series title', 'ButtonPanelPrimitive', error);
                }
              });
            } else {
              // Regular series - parse the series index from the seriesId
              const seriesIndexMatch = seriesId.match(/series-(\d+)$/);
              let targetSeriesIndex = -1;

              if (seriesIndexMatch) {
                targetSeriesIndex = parseInt(seriesIndexMatch[1], 10);
              }

              // Apply options to the specific series or all series if index not found
              paneseries.forEach((series: any, idx: number) => {
                if (targetSeriesIndex === -1 || idx === targetSeriesIndex) {
                  if (series && typeof series.applyOptions === 'function') {
                    try {
                      series.applyOptions(seriesOptions);
                    } catch (error) {
                      logger.warn('Error applying series options', 'ButtonPanelPrimitive', error);
                    }
                  }
                }
              });
            }
          }
        } catch (error) {
          logger.debug('Error finding series objects', 'ButtonPanelPrimitive', error);
        }
      }
    } catch (error) {
      logger.error('Error applying config to chart series', 'ButtonPanelPrimitive', error);
    }
  }

  private saveSeriesConfig(seriesId: string, config: SeriesConfiguration): void {
    try {
      const storageKey = `series-config-${seriesId}`;
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  private inferSeriesType(): SeriesType {
    // This is a simplified implementation
    return 'line'; // Default to line series
  }

  private getDefaultSeriesConfig(seriesType: SeriesType): SeriesConfiguration {
    const baseConfig: SeriesConfiguration = {
      color: '#2196F3',
      opacity: 1,
      lineWidth: 2,
      lineStyle: 0, // solid
      lastPriceVisible: true,
      priceLineVisible: true,
      labelsOnPriceScale: true,
      valuesInStatusLine: true,
      precision: false,
      precisionValue: 'auto',
    };

    switch (seriesType) {
      case 'supertrend':
        return {
          ...baseConfig,
          period: 10,
          multiplier: 3.0,
          upTrend: { color: '#00C851', opacity: 1 },
          downTrend: { color: '#FF4444', opacity: 1 },
        };
      case 'bollinger_bands':
        return {
          ...baseConfig,
          length: 20,
          stdDev: 2,
          upperLine: { color: '#2196F3', opacity: 1 },
          lowerLine: { color: '#2196F3', opacity: 1 },
          fill: { color: '#2196F3', opacity: 0.1 },
        };
      case 'sma':
      case 'ema':
        return {
          ...baseConfig,
          length: 20,
          source: 'close',
          offset: 0,
        };
      case 'ribbon':
        return {
          ...baseConfig,
          color: '#4CAF50', // Upper line color
          upperLine: { color: '#4CAF50', opacity: 1 },
          lowerLine: { color: '#F44336', opacity: 1 },
          fill: { color: '#4CAF50', opacity: 0.1 },
          fillVisible: true,
        };
      default:
        return baseConfig;
    }
  }

  private restoreConfigurationsFromBackend(): void {
    try {
      const chartConfig = this.streamlitService.getChartConfig(this.config.chartId);
      if (chartConfig && chartConfig[this.config.paneId]) {
        const paneConfig = chartConfig[this.config.paneId];

        // Restore all series configurations for this pane
        Object.entries(paneConfig).forEach(([seriesId, seriesData]) => {
          this.paneState.seriesConfigs.set(seriesId, seriesData.config);
        });
      }
    } catch (error) {
      logger.error('Button panel operation failed', 'ButtonPanelPrimitive', error);
    }
  }

  // ===== Public API =====

  public getSeriesConfig(seriesId: string): SeriesConfiguration | null {
    // First try to get from Streamlit service
    const backendConfig = this.streamlitService.getSeriesConfig(
      this.config.paneId,
      seriesId,
      this.config.chartId
    );
    if (backendConfig) return backendConfig;

    // Fallback to local state
    return this.paneState.seriesConfigs.get(seriesId) || null;
  }

  public setSeriesConfig(seriesId: string, config: SeriesConfiguration): void {
    this.applySeriesConfig(seriesId, config);
  }

  public syncToBackend(): void {
    this.streamlitService.forceSyncToBackend();
  }
}

// ===== Factory Functions =====

export function createButtonPanelPrimitive(
  paneId: number,
  config: Partial<ButtonPanelPrimitiveConfig> = {},
  chartId?: string
): ButtonPanelPrimitive {
  const id = `button-panel-pane-${paneId}-${chartId || 'default'}`;

  const fullConfig: ButtonPanelPrimitiveConfig = {
    corner: 'top-right',
    priority: PrimitivePriority.MINIMIZE_BUTTON,
    isPanePrimitive: paneId > 0, // Follow legend pattern: paneId > 0 determines pane primitive
    paneId,
    chartId,
    buttonSize: 16,
    buttonColor: '#787B86',
    buttonHoverColor: '#131722',
    buttonBackground: 'rgba(255, 255, 255, 0.9)',
    buttonHoverBackground: 'rgba(255, 255, 255, 1)',
    buttonBorderRadius: 3,
    showTooltip: true,
    showCollapseButton: true,
    showGearButton: true,
    tooltipText: {
      collapse: 'Collapse pane',
      expand: 'Expand pane',
    },
    ...config,
  };

  return new ButtonPanelPrimitive(id, fullConfig);
}

export function createButtonPanelPrimitives(
  paneIds: number[],
  config: Partial<ButtonPanelPrimitiveConfig> = {},
  chartId?: string
): ButtonPanelPrimitive[] {
  return paneIds.map(paneId =>
    createButtonPanelPrimitive(paneId, config, chartId)
  );
}
