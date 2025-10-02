/**
 * @fileoverview Pane Button Panel Plugin for Lightweight Charts
 *
 * Provides TradingView-style pane controls including collapse functionality and series configuration.
 * Main classes:
 * - PaneButtonPanelPlugin: Main plugin implementing IPanePrimitive and IPositionableWidget
 * - ButtonPanelComponent: React component for rendering gear and collapse buttons
 * - SeriesConfigDialog: React component for series configuration management
 *
 * Key features:
 * - TradingView-style pane collapse/expand functionality with proper stretch factor management
 * - Series configuration dialog with real-time option changes
 * - Integration with CornerLayoutManager for proper widget positioning
 * - Streamlit backend synchronization for cross-session persistence
 * - React-based UI components with proper lifecycle management
 * - Support for multiple pane instances with independent state
 *
 * Integration: Use createPaneButtonPanelPlugin() or createPaneButtonPanelPlugins() to create instances
 */

import { IChartApi, IPanePrimitive, PaneAttachedParameter, Time } from 'lightweight-charts';
import { CornerLayoutManager } from '../../services/CornerLayoutManager';
import { StreamlitSeriesConfigService } from '../../services/StreamlitSeriesConfigService';
import { PaneCollapseConfig } from '../../types';
import { logger } from '../../utils/logger';
import { SeriesType, SeriesConfiguration } from '../../types/SeriesTypes';
import { Corner, Position, IPositionableWidget, WidgetDimensions } from '../../types/layout';
import { PrimitivePriority } from '../../primitives/BasePanePrimitive';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ButtonPanelComponent } from '../../components/ButtonPanelComponent';
import { SeriesSettingsDialog, SeriesInfo as DialogSeriesInfo } from '../../forms/SeriesSettingsDialog';

/**
 * Local SeriesInfo interface with config property for plugin use
 */
interface SeriesInfo {
  id: string;
  displayName?: string;
  type: SeriesType;
  config?: SeriesConfiguration;
  title?: string;
}

/**
 * Pane state management
 */
interface PaneState {
  isCollapsed: boolean;
  originalHeight: number;
  collapsedHeight: number;
  buttonElement: HTMLElement;
  dialogElement?: HTMLElement;
  tooltipElement?: HTMLElement;
  reactRoot?: ReturnType<typeof createRoot>;
  dialogRoot?: ReturnType<typeof createRoot>;
  originalStretchFactor?: number;
  seriesConfigs: Map<string, SeriesConfiguration>;
  currentSeriesId?: string;
  currentSeriesType?: SeriesType;
}

/**
 * Pane Button Panel Plugin using Pane Primitives and Widget System
 */
export class PaneButtonPanelPlugin implements IPanePrimitive<Time>, IPositionableWidget {
  private _paneViews: any[];
  private chartApi: IChartApi | null = null;
  private paneId: number;
  private config: PaneCollapseConfig;
  private paneStates = new Map<number, PaneState>();
  private layoutManager: CornerLayoutManager | null = null;
  private streamlitService: StreamlitSeriesConfigService;
  private chartId?: string;
  private containerElement: HTMLElement | null = null;

  // IPositionableWidget implementation
  public readonly id: string;
  public readonly corner: Corner;
  public readonly priority: number = PrimitivePriority.MINIMIZE_BUTTON;
  public visible: boolean = true;

  constructor(paneId: number, config: PaneCollapseConfig = {}, chartId?: string) {
    this._paneViews = [];
    this.paneId = paneId;
    this.chartId = chartId;
    this.id = `button-panel-pane-${paneId}-${chartId || 'default'}`;
    this.corner = config.corner || 'top-right';

    this.config = {
      enabled: true,
      corner: this.corner,
      buttonSize: 16,
      buttonColor: '#787B86',
      buttonHoverColor: '#131722',
      buttonBackground: 'rgba(255, 255, 255, 0.9)',
      buttonHoverBackground: 'rgba(255, 255, 255, 1)',
      buttonBorderRadius: 3,
      showTooltip: true,
      tooltipText: {
        collapse: 'Collapse pane',
        expand: 'Expand pane',
      },
      ...config,
    };
    this.streamlitService = StreamlitSeriesConfigService.getInstance();
  }

  /**
   * Required IPanePrimitive interface methods
   */
  paneViews(): any[] {
    if (this._paneViews.length === 0) {
      this._paneViews = [
        {
          renderer: () => ({
            draw: (_ctx: CanvasRenderingContext2D) => {
              // Empty draw method - layout updates are handled by resize events
              // not on every frame to avoid performance issues during pan/zoom
            },
          }),
        },
      ];
    }
    return this._paneViews;
  }

  /**
   * Initialize the plugin with chart
   */
  attached(param: PaneAttachedParameter<Time>): void {
    this.chartApi = param.chart;

    // Initialize layout manager
    this.layoutManager = CornerLayoutManager.getInstance(this.chartId, this.paneId);
    this.layoutManager.setChartApi(this.chartApi);

    this.setupPaneButtonPanel();
    this.restoreConfigurationsFromBackend();

    // Register with layout manager for proper positioning
    if (this.layoutManager) {
      this.layoutManager.registerWidget(this);

      // Force initial positioning after a short delay to ensure the layout manager has processed
      setTimeout(() => {
        if (this.layoutManager && this.containerElement) {
          const position = this.layoutManager.getWidgetPosition(this.id);
          if (position) {
            this.updatePosition(position);
          } else {
            // Fallback positioning if layout manager fails
            this.applyFallbackPositioning();
          }
        }
      }, 100);
    } else {
      // Fallback positioning if no layout manager
      this.applyFallbackPositioning();
    }
  }

  /**
   * IPositionableWidget interface implementation
   */
  getDimensions(): WidgetDimensions {
    if (!this.containerElement) {
      // Default dimensions for button panel (gear + collapse button + gap)
      return { width: 40, height: 20 };
    }

    const width = this.containerElement.offsetWidth || 40;
    const height = this.containerElement.offsetHeight || 20;
    return { width, height };
  }

  updatePosition(position: Position): void {
    if (this.containerElement) {
      const style = this.containerElement.style;
      style.position = 'absolute';
      if (position.top !== undefined) style.top = `${position.top}px`;
      if (position.left !== undefined) style.left = `${position.left}px`;
      if (position.right !== undefined) style.right = `${position.right}px`;
      if (position.bottom !== undefined) style.bottom = `${position.bottom}px`;
      if (position.zIndex !== undefined) style.zIndex = position.zIndex.toString();

      // Remove any conflicting positioning from custom logic
      if (position.left !== undefined) style.right = 'auto';
      if (position.right !== undefined) style.left = 'auto';
      if (position.top !== undefined) style.bottom = 'auto';
      if (position.bottom !== undefined) style.top = 'auto';
    }
  }

  /**
   * Apply fallback positioning when layout manager is unavailable or fails
   */
  private applyFallbackPositioning(): void {
    if (!this.containerElement || !this.chartApi) return;


    const style = this.containerElement.style;
    style.position = 'absolute';
    style.zIndex = '1000';

    // Position based on corner preference
    switch (this.corner) {
      case 'top-right':
        style.top = '5px';
        style.right = '5px';
        style.left = 'auto';
        style.bottom = 'auto';
        break;
      case 'top-left':
        style.top = '5px';
        style.left = '5px';
        style.right = 'auto';
        style.bottom = 'auto';
        break;
      case 'bottom-right':
        style.bottom = '5px';
        style.right = '5px';
        style.left = 'auto';
        style.top = 'auto';
        break;
      case 'bottom-left':
        style.bottom = '5px';
        style.left = '5px';
        style.right = 'auto';
        style.top = 'auto';
        break;
    }
  }

  /**
   * Cleanup resources
   */
  detached(): void {
    // Unregister from layout manager
    if (this.layoutManager) {
      this.layoutManager.unregisterWidget(this.id);
    }

    // Remove all button elements
    this.paneStates.forEach(state => {
      if (state.buttonElement && state.buttonElement.parentNode) {
        state.buttonElement.parentNode.removeChild(state.buttonElement);
      }
      if (state.dialogElement && state.dialogElement.parentNode) {
        state.dialogElement.parentNode.removeChild(state.dialogElement);
      }
      if (state.tooltipElement && state.tooltipElement.parentNode) {
        state.tooltipElement.parentNode.removeChild(state.tooltipElement);
      }
      if (state.reactRoot) {
        state.reactRoot.unmount();
      }
      if (state.dialogRoot) {
        state.dialogRoot.unmount();
      }
    });

    // Cleanup container element
    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
    }

    // Clear references
    this.paneStates.clear();
    this.chartApi = null;
    this.layoutManager = null;
    this.containerElement = null;
  }

  /**
   * Setup pane button panel functionality
   */
  private setupPaneButtonPanel(): void {
    if (!this.chartApi || !this.config.enabled) return;

    // Get chart element
    const chartElement = this.chartApi.chartElement();
    if (!chartElement) return;

    // Delay button creation to allow chart to stabilize
    setTimeout(() => {
      this.createButtonPanel(chartElement, this.paneId);
    }, 200);
  }

  /**
   * Create button panel for a pane
   */
  private createButtonPanel(chartElement: HTMLElement, paneId: number): void {
    if (!this.chartApi || !this.layoutManager) {
      return;
    }

    try {
      // Test if chart is ready by checking if we can get panes
      const panes = this.chartApi.panes();
      if (!panes || panes.length === 0) {
        setTimeout(() => this.createButtonPanel(chartElement, paneId), 300);
        return;
      }
    } catch {
      setTimeout(() => this.createButtonPanel(chartElement, paneId), 300);
      return;
    }

    // Create main container element for the widget
    this.containerElement = document.createElement('div');
    this.containerElement.id = `${this.id}-container`;
    this.containerElement.className = `pane-button-panel-container-${paneId}`;
    this.containerElement.style.pointerEvents = 'auto';
    this.containerElement.style.userSelect = 'none';
    // Remove position styling - let layout manager handle it

    try {
      // Append container to chart element
      chartElement.appendChild(this.containerElement);

      // Create React root and render button panel component
      const reactRoot = createRoot(this.containerElement);
      this.renderButtonPanel(reactRoot, paneId);

      // Store state reference
      if (!this.paneStates.has(paneId)) {
        this.paneStates.set(paneId, {
          isCollapsed: false,
          originalHeight: 0,
          collapsedHeight: 45,
          buttonElement: this.containerElement,
          reactRoot: reactRoot,
          seriesConfigs: new Map(),
        });
      } else {
        const state = this.paneStates.get(paneId);
        if (state) {
          state.buttonElement = this.containerElement;
          state.reactRoot = reactRoot;
        }
      }

      // Initial positioning - apply fallback until layout manager takes over
      setTimeout(() => {
        if (this.layoutManager) {
          const position = this.layoutManager.getWidgetPosition(this.id);
          if (position) {
            this.updatePosition(position);
          } else {
            this.applyFallbackPositioning();
          }
        } else {
          this.applyFallbackPositioning();
        }
      }, 50);
    } catch (error) {
      logger.error('Failed to create button panel', 'PaneButtonPanelPlugin', error);
    }
  }

  /**
   * Render the button panel component
   */
  private renderButtonPanel(reactRoot: ReturnType<typeof createRoot>, paneId: number): void {
    const state = this.paneStates.get(paneId);
    const isCollapsed = state?.isCollapsed || false;

    reactRoot.render(
      React.createElement(ButtonPanelComponent, {
        paneId: paneId,
        isCollapsed: isCollapsed,
        onCollapseClick: () => {
          this.togglePaneCollapse(paneId);
        },
        onGearClick: () => {
          this.openSeriesConfigDialog(paneId);
        },
        showCollapseButton: this.config.showCollapseButton !== false,
        showGearButton: this.config.showGearButton !== false,
        config: this.config,
      })
    );
  }

  /**
   * Open series configuration dialog
   */
  private openSeriesConfigDialog(paneId: number): void {
    const state = this.paneStates.get(paneId);
    if (!state || !this.chartApi) {
      return;
    }

    try {
      // Get ALL series for this pane
      const allSeries = this.getAllSeriesForPane(paneId);

      // Create dialog container if it doesn't exist
      if (!state.dialogElement) {
        const dialogContainer = document.createElement('div');
        dialogContainer.className = `series-config-dialog-container-${paneId}`;
        dialogContainer.style.position = 'fixed';
        dialogContainer.style.top = '0';
        dialogContainer.style.left = '0';
        dialogContainer.style.width = '100vw';
        dialogContainer.style.height = '100vh';
        dialogContainer.style.zIndex = '10000';
        dialogContainer.style.pointerEvents = 'auto';

        document.body.appendChild(dialogContainer);
        state.dialogElement = dialogContainer;
        state.dialogRoot = createRoot(dialogContainer);
      }

      // Create series configurations from allSeries
      const seriesConfigs: Record<string, any> = {};
      allSeries.forEach(series => {
        seriesConfigs[series.id] = series.config || {};
      });

      // Render the dialog with all series
      if (state.dialogRoot) {
        state.dialogRoot.render(
          React.createElement(SeriesSettingsDialog, {
            isOpen: true,
            onClose: () => this.closeSeriesConfigDialog(paneId),
            paneId: paneId.toString(),
            seriesList: allSeries.map(series => ({
              id: series.id,
              displayName: series.displayName || series.title || series.id,
              type: series.type
            } as DialogSeriesInfo)),
            seriesConfigs: seriesConfigs,
            onConfigChange: (seriesId: string, newConfig: any) => {
              this.applySeriesConfig(paneId, seriesId, newConfig);
            },
          })
        );
      } else {
        logger.error('Failed to create dialog root for series config', 'PaneButtonPanelPlugin');
      }
    } catch (error) {
      logger.error('Failed to open series config dialog', 'PaneButtonPanelPlugin', error);
    }
  }

  /**
   * Close series configuration dialog
   */
  private closeSeriesConfigDialog(paneId: number): void {
    const state = this.paneStates.get(paneId);
    if (!state || !state.dialogRoot) return;

    try {
      // Render empty dialog (closed state)
      state.dialogRoot.render(
        React.createElement(SeriesSettingsDialog, {
          isOpen: false,
          onClose: () => {},
          paneId: paneId.toString(),
          seriesList: [],
          seriesConfigs: {},
          onConfigChange: () => {},
        })
      );
    } catch (error) {
      logger.error('Failed to close series config dialog', 'PaneButtonPanelPlugin', error);
    }
  }

  /**
   * Get all series for a specific pane
   */
  private getAllSeriesForPane(paneId: number): SeriesInfo[] {
    const seriesList: SeriesInfo[] = [];
    const state = this.paneStates.get(paneId);

    if (!this.chartApi || !state) {
      return seriesList;
    }

    try {
      // Get all panes from the chart
      const panes = this.chartApi.panes();

      if (paneId >= 0 && paneId < panes.length) {
        // For now, create mock series data since we need to simulate series
        // In a real implementation, this would query actual series from the chart
        const mockSeriesData = this.getMockSeriesForPane(paneId, state);

        mockSeriesData.forEach((mockSeries, index) => {
          const seriesId = `pane-${paneId}-series-${index}`;

          // Get existing config or create default
          let seriesConfig = state.seriesConfigs.get(seriesId);
          if (!seriesConfig) {
            seriesConfig = this.getDefaultSeriesConfig(mockSeries.type);
            state.seriesConfigs.set(seriesId, seriesConfig);
          }

          seriesList.push({
            id: seriesId,
            displayName: mockSeries.title,
            type: mockSeries.type,
            config: seriesConfig,
            title: mockSeries.title,
          });
        });
      }
    } catch (error) {
      logger.error('Failed to get series for pane', 'PaneButtonPanelPlugin', error);
    }

    return seriesList;
  }

  /**
   * Get actual series data for a pane (matching demo_series_settings.py)
   */
  private getMockSeriesForPane(
    paneId: number,
    _state: PaneState
  ): Array<{ type: SeriesType; title?: string }> {
    // Match the exact series from demo_series_settings.py
    if (paneId === 0) {
      // Main chart pane (Pane 0) has line series and ribbon series
      return [
        { type: 'line', title: 'Price Line' },  // LineSeries from demo
        { type: 'ribbon', title: 'Price Ribbon' },  // RibbonSeries from demo
      ];
    } else if (paneId === 1) {
      // Volume pane (Pane 1) has histogram series
      return [
        { type: 'histogram', title: 'Volume' },  // HistogramSeries from demo
      ];
    } else {
      // For any other panes, return empty
      return [];
    }
  }

  /**
   * Apply series configuration changes
   */
  private applySeriesConfig(paneId: number, seriesId: string, config: SeriesConfiguration): void {
    const state = this.paneStates.get(paneId);
    if (!state) return;

    try {
      // Store the configuration locally
      state.seriesConfigs.set(seriesId, config);

      // CRITICAL FIX: Apply configuration changes to actual chart series objects
      this.applyConfigToChartSeries(paneId, seriesId, config);

      // Save to localStorage for immediate persistence
      this.saveSeriesConfig(seriesId, config);

      // Send to Streamlit backend for cross-session persistence
      const seriesType = this.inferSeriesType(paneId);
      this.streamlitService.recordConfigChange(paneId, seriesId, seriesType, config, this.chartId);

      // Notify external listeners if available
      if (this.config.onSeriesConfigChange) {
        this.config.onSeriesConfigChange(paneId, seriesId, config as Record<string, unknown>);
      }
    } catch (error) {
      logger.error('Operation failed', 'PaneButtonPanelPlugin', error);
    }
  }

  /**
   * Apply configuration changes to actual chart series objects
   */
  private applyConfigToChartSeries(paneId: number, seriesId: string, config: SeriesConfiguration): void {
    if (!this.chartApi) {
      return;
    }

    try {

      // For demo purposes, we'll implement a basic mapping
      // In a production system, this would use a proper series registry
      const seriesOptions: any = {};

      // Map configuration options to LightweightCharts API options

      // Core series properties (direct mapping)
      if (config.visible !== undefined) {
        seriesOptions.visible = config.visible;
      }
      if (config.color !== undefined) {
        seriesOptions.color = config.color;
      }
      if (config.title !== undefined) {
        seriesOptions.title = config.title;
      }

      // Line styling properties (direct mapping for new API)
      if (config.lineWidth !== undefined) {
        seriesOptions.lineWidth = config.lineWidth;
      }
      if (config.lineStyle !== undefined) {
        seriesOptions.lineStyle = config.lineStyle;
      }

      // Price line properties (direct mapping for new API)
      if (config.lastValueVisible !== undefined) {
        seriesOptions.lastValueVisible = config.lastValueVisible;
      }
      if (config.priceLineVisible !== undefined) {
        seriesOptions.priceLineVisible = config.priceLineVisible;
      }
      if (config.priceLineColor !== undefined) {
        seriesOptions.priceLineColor = config.priceLineColor;
      }
      if (config.priceLineWidth !== undefined) {
        seriesOptions.priceLineWidth = config.priceLineWidth;
      }
      if (config.priceLineStyle !== undefined) {
        seriesOptions.priceLineStyle = config.priceLineStyle;
      }

      // Legacy naming support (for backward compatibility with existing dialog)
      if ((config as any).last_value_visible !== undefined) {
        seriesOptions.lastValueVisible = (config as any).last_value_visible;
      }
      if ((config as any).price_line !== undefined) {
        seriesOptions.priceLineVisible = (config as any).price_line;
      }
      if ((config as any).line_width !== undefined) {
        seriesOptions.lineWidth = (config as any).line_width;
      }
      if ((config as any).line_style !== undefined) {
        // Convert string style to LineStyle enum value
        const styleMap: Record<string, number> = { 'solid': 0, 'dashed': 1, 'dotted': 2 };
        const lineStyle = (config as any).line_style as string;
        const styleValue = styleMap[lineStyle] ?? 0;
        seriesOptions.lineStyle = styleValue;
      }

      // Handle markers (note: LightweightCharts markers are set via setMarkers, not applyOptions)
      if ((config as any).markers !== undefined) {
        // Markers would be handled separately via setMarkers API
      }


      // Try to find and update the series
      // This is a simplified approach - in production you'd have a proper series registry
      const panes = this.chartApi.panes();
      if (paneId >= 0 && paneId < panes.length && Object.keys(seriesOptions).length > 0) {

        // CRITICAL FIX: Try to find the actual series objects and apply options
        let seriesApplied = false;

        try {
          // Use the proper LightweightCharts API to get series for the target pane
          const panes = this.chartApi.panes();
          if (paneId >= 0 && paneId < panes.length) {
            const targetPane = panes[paneId];

            // Use the official IPanesAPI.getSeries() method
            const paneseries = targetPane.getSeries();

            if (paneseries.length > 0) {
              // Parse the series index from the seriesId (e.g., "pane-0-series-0" -> index 0)
              const seriesIndexMatch = seriesId.match(/series-(\d+)$/);
              let targetSeriesIndex = -1;

              if (seriesIndexMatch) {
                targetSeriesIndex = parseInt(seriesIndexMatch[1], 10);
              } else {
                logger.error('Failed to parse series index from seriesId', 'PaneButtonPanelPlugin');
              }

              // Apply options to the specific series or all series if index not found
              paneseries.forEach((series: any, idx: number) => {
                // Only apply to the target series index, or all if we couldn't parse the index
                if (targetSeriesIndex === -1 || idx === targetSeriesIndex) {
                  if (series && typeof series.applyOptions === 'function') {
                    try {
                      series.applyOptions(seriesOptions);
                      seriesApplied = true;
                    } catch (applyError) {
                      logger.error('Failed to apply options to series', 'PaneButtonPanelPlugin', applyError);
                    }
                  } else {
                    logger.error('Series does not have applyOptions method', 'PaneButtonPanelPlugin');
                  }
                }
              });
            } else {
              logger.error('No series found in target pane', 'PaneButtonPanelPlugin');
            }
          } else {
            logger.error('Target pane index out of bounds', 'PaneButtonPanelPlugin');
          }

          if (!seriesApplied) {
            logger.error('Failed to apply series options to any series', 'PaneButtonPanelPlugin');
          }

        } catch (findError) {
          logger.error('Error finding series in pane', 'PaneButtonPanelPlugin', findError);
        }
      } else if (Object.keys(seriesOptions).length === 0) {
        logger.error('No series options to apply', 'PaneButtonPanelPlugin');
      }
    } catch (error) {
      logger.error('Failed to apply config to chart series', 'PaneButtonPanelPlugin', error);
    }
  }

  /**
   * Save series configuration to localStorage
   */
  private saveSeriesConfig(seriesId: string, config: SeriesConfiguration): void {
    try {
      const storageKey = `series-config-${seriesId}`;
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (error) {
      logger.error('Operation failed', 'PaneButtonPanelPlugin', error);
    }
  }

  /**
   * Infer series type for a pane (simplified logic)
   */
  private inferSeriesType(_paneId: number): SeriesType {
    // This is a simplified implementation
    // In a real scenario, you'd inspect the actual series in the pane
    return 'line'; // Default to line series
  }

  /**
   * Get default series configuration
   */
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
      default:
        return baseConfig;
    }
  }

  // Collapse functionality (existing methods from PaneCollapsePlugin)
  private togglePaneCollapse(paneId: number): void {
    if (!this.chartApi) return;

    const state = this.paneStates.get(paneId);
    if (!state) return;

    try {
      if (state.isCollapsed) {
        this.expandPane(paneId);
      } else {
        this.collapsePane(paneId);
      }
    } catch (error) {
      logger.error('Operation failed', 'PaneButtonPanelPlugin', error);
    }
  }

  private collapsePane(paneId: number): void {
    if (!this.chartApi) return;

    const state = this.paneStates.get(paneId);
    if (!state || state.isCollapsed) return;

    try {
      const panes = this.chartApi.panes();
      if (paneId >= panes.length) return;

      const pane = panes[paneId];
      const currentStretchFactor = pane.getStretchFactor();
      const paneSize = this.chartApi.paneSize(paneId);

      state.originalStretchFactor = currentStretchFactor;
      if (paneSize) {
        state.originalHeight = paneSize.height;
      }

      const minimalStretchFactor = 0.05;
      pane.setStretchFactor(minimalStretchFactor);
      state.isCollapsed = true;

      const chartElement = this.chartApi.chartElement();
      if (chartElement) {
        this.chartApi.resize(chartElement.clientWidth, chartElement.clientHeight);
      }

      // Update button panel
      this.updateButtonPanel(paneId);

      if (this.config.onPaneCollapse) {
        this.config.onPaneCollapse(paneId, true);
      }
    } catch (error) {
      logger.error('Operation failed', 'PaneButtonPanelPlugin', error);
    }
  }

  private expandPane(paneId: number): void {
    if (!this.chartApi) return;

    const state = this.paneStates.get(paneId);
    if (!state || !state.isCollapsed) return;

    try {
      const panes = this.chartApi.panes();
      if (paneId >= panes.length) return;

      const pane = panes[paneId];
      const originalStretchFactor = state.originalStretchFactor || 0.2;

      pane.setStretchFactor(originalStretchFactor);
      state.isCollapsed = false;

      const chartElement = this.chartApi.chartElement();
      if (chartElement) {
        this.chartApi.resize(chartElement.clientWidth, chartElement.clientHeight);
      }

      // Update button panel
      this.updateButtonPanel(paneId);

      if (this.config.onPaneExpand) {
        this.config.onPaneExpand(paneId, false);
      }
    } catch (error) {
      logger.error('Operation failed', 'PaneButtonPanelPlugin', error);
    }
  }

  private updateButtonPanel(paneId: number): void {
    const state = this.paneStates.get(paneId);
    if (!state || !state.reactRoot) return;

    this.renderButtonPanel(state.reactRoot, paneId);
  }

  /**
   * Restore configurations from Streamlit backend
   */
  private restoreConfigurationsFromBackend(): void {
    try {
      const chartConfig = this.streamlitService.getChartConfig(this.chartId);
      if (chartConfig && chartConfig[this.paneId]) {
        const paneConfig = chartConfig[this.paneId];
        const state = this.paneStates.get(this.paneId);

        if (state) {
          // Restore all series configurations for this pane
          Object.entries(paneConfig).forEach(([seriesId, seriesData]) => {
            state.seriesConfigs.set(seriesId, seriesData.config);
          });
        }
      }
    } catch (error) {
      logger.error('Operation failed', 'PaneButtonPanelPlugin', error);
    }
  }

  /**
   * Initialize the service with backend data (called from main component)
   */
  public static initializeFromBackend(backendData?: any): void {
    const service = StreamlitSeriesConfigService.getInstance();
    if (backendData) {
      service.restoreFromBackend(backendData);
    }
  }

  /**
   * Public API methods
   */
  public getSeriesConfig(seriesId: string): SeriesConfiguration | null {
    // First try to get from Streamlit service
    const backendConfig = this.streamlitService.getSeriesConfig(
      this.paneId,
      seriesId,
      this.chartId
    );
    if (backendConfig) return backendConfig;

    // Fallback to local state
    for (const state of this.paneStates.values()) {
      const config = state.seriesConfigs.get(seriesId);
      if (config) return config;
    }
    return null;
  }

  public setSeriesConfig(seriesId: string, config: SeriesConfiguration): void {
    for (const [paneId, state] of this.paneStates.entries()) {
      if (state.seriesConfigs.has(seriesId)) {
        this.applySeriesConfig(paneId, seriesId, config);
        break;
      }
    }
  }


  /**
   * Force sync all configurations to backend
   */
  public syncToBackend(): void {
    this.streamlitService.forceSyncToBackend();
  }

  /**
   * Get service statistics
   */
  public getServiceStats(): any {
    return this.streamlitService.getStats();
  }
}

export function createPaneButtonPanelPlugin(
  paneId: number,
  config?: PaneCollapseConfig,
  chartId?: string
): PaneButtonPanelPlugin {
  return new PaneButtonPanelPlugin(paneId, config, chartId);
}

export function createPaneButtonPanelPlugins(
  paneIds: number[],
  config?: PaneCollapseConfig,
  chartId?: string
): PaneButtonPanelPlugin[] {
  return paneIds.map(paneId => createPaneButtonPanelPlugin(paneId, config, chartId));
}
