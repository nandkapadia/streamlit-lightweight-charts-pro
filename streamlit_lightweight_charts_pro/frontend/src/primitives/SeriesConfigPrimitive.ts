/**
 * @fileoverview Series configuration primitive for managing chart series settings.
 *
 * Provides a gear icon button and configuration dialog for series-specific settings
 * including inputs (period, multiplier), styling (colors, line width), and visibility
 * options. Features tabbed interface, real-time configuration updates, and series
 * type-specific customization for indicators like Supertrend and Bollinger Bands.
 */

import { BasePanePrimitive, BasePrimitiveConfig, PrimitivePriority } from './BasePanePrimitive';
import { SeriesConfiguration, SeriesType } from '../types/SeriesTypes';
import { PrimitiveStylingUtils } from './PrimitiveStylingUtils';

/**
 * Configuration for SeriesConfigPrimitive
 */
export interface SeriesConfigPrimitiveConfig extends BasePrimitiveConfig {
  /**
   * Series configuration that this primitive manages
   */
  seriesConfig: SeriesConfiguration;

  /**
   * Type of the series being configured
   */
  seriesType: SeriesType;

  /**
   * Callback when configuration changes
   */
  onConfigChange?: (_config: SeriesConfiguration) => void;

  /**
   * Callback when gear button is clicked
   */
  onOpenConfig?: () => void;

  /**
   * Whether the config dialog is currently open
   */
  isConfigOpen?: boolean;
}

/**
 * SeriesConfigPrimitive - A primitive for series configuration management
 *
 * This primitive provides:
 * - Gear icon button for opening configuration dialog
 * - Collapse functionality (inherited from existing system)
 * - State management for series configuration
 * - Event integration for configuration changes
 *
 * Example usage:
 * ```typescript
 * const configPrimitive = new SeriesConfigPrimitive('series-config', {
 *   corner: 'top-right',
 *   priority: PrimitivePriority.SERIES_CONFIG,
 *   seriesConfig: { color: '#2196F3', lineWidth: 2 },
 *   seriesType: 'line',
 *   onConfigChange: (config) => {
 *     // Apply configuration to series
 *   }
 * })
 * ```
 */
export class SeriesConfigPrimitive extends BasePanePrimitive<SeriesConfigPrimitiveConfig> {
  private buttonContainer: HTMLElement | null = null;
  private gearButton: HTMLElement | null = null;
  private collapseButton: HTMLElement | null = null;
  private configDialog: HTMLElement | null = null;
  private currentTab: 'inputs' | 'style' | 'visibility' = 'style';

  constructor(id: string, config: SeriesConfigPrimitiveConfig) {
    // Set default priority and configuration for series config
    const configWithDefaults: SeriesConfigPrimitiveConfig = {
      ...config,
      priority: config.priority ?? PrimitivePriority.CUSTOM,
      visible: config.visible ?? true,
      style: {
        backgroundColor: 'transparent',
        padding: 6,
        ...config.style,
      },
      isConfigOpen: config.isConfigOpen ?? false,
    };

    super(id, configWithDefaults);
  }

  // ===== BasePanePrimitive Implementation =====

  /**
   * Get the template string (not used for interactive elements)
   */
  protected getTemplate(): string {
    return ''; // Series config is fully interactive, no template needed
  }

  /**
   * Render the series configuration UI
   */
  protected renderContent(): void {
    if (!this.containerElement) return;

    // Clear existing content
    this.containerElement.innerHTML = '';

    // Create button panel (gear + collapse)
    this.createButtonPanel();

    // Create configuration dialog if open
    if (this.config.isConfigOpen) {
      this.createConfigDialog();
    }

    // Trigger layout recalculation
    setTimeout(() => {
      if (this.layoutManager) {
        this.layoutManager.recalculateAllLayouts();
      }
    }, 0);
  }

  /**
   * Create the button panel with gear and collapse buttons
   */
  private createButtonPanel(): void {
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'series-config-button-panel';
    this.applyButtonPanelStyling(this.buttonContainer);

    // Create gear button
    this.gearButton = this.createGearButton();
    this.buttonContainer.appendChild(this.gearButton);

    // Create collapse button (reuse existing logic)
    this.collapseButton = this.createCollapseButton();
    this.buttonContainer.appendChild(this.collapseButton);

    if (this.containerElement) {
      this.containerElement.appendChild(this.buttonContainer);
    }
  }

  /**
   * Create gear button for opening configuration
   */
  private createGearButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'gear-button';
    button.innerHTML = '⚙️'; // Gear icon
    button.setAttribute('aria-label', 'Configure series settings');
    button.setAttribute('title', 'Series Settings');

    this.applyButtonStyling(button, 'gear');

    // Add click handler
    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.handleGearClick();
    });

    return button;
  }

  /**
   * Create collapse button (reuse existing functionality)
   */
  private createCollapseButton(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'collapse-button';
    button.innerHTML = '−'; // Collapse icon
    button.setAttribute('aria-label', 'Collapse series');
    button.setAttribute('title', 'Collapse');

    this.applyButtonStyling(button, 'collapse');

    // Add click handler
    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.handleCollapseClick();
    });

    return button;
  }

  /**
   * Apply button panel styling
   */
  private applyButtonPanelStyling(container: HTMLElement): void {
    const style = container.style;
    style.display = 'flex';
    style.flexDirection = 'row';
    style.gap = '4px';
    style.alignItems = 'center';
    style.pointerEvents = 'auto';
  }

  /**
   * Apply styling to individual buttons
   */
  private applyButtonStyling(button: HTMLElement, _type: 'gear' | 'collapse'): void {
    const baseStyles: any = {
      width: '24px',
      height: '24px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#666',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      position: 'absolute',
      zIndex: '1000',
    };

    const hoverStyles: any = {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: '#333',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    };

    // Apply base styles
    PrimitiveStylingUtils.applyInteractionState(button, baseStyles, hoverStyles, 'default');

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      PrimitiveStylingUtils.applyInteractionState(button, baseStyles, hoverStyles, 'hover');
    });

    button.addEventListener('mouseleave', () => {
      PrimitiveStylingUtils.applyInteractionState(button, baseStyles, hoverStyles, 'default');
    });
  }

  /**
   * Handle gear button click
   */
  private handleGearClick(): void {
    // Toggle config dialog
    this.config.isConfigOpen = !this.config.isConfigOpen;

    if (this.config.onOpenConfig) {
      this.config.onOpenConfig();
    }

    // Re-render to show/hide dialog
    this.renderContent();

    // Emit custom event
    if (this.eventManager) {
      this.eventManager.emitCustomEvent('seriesConfigToggle', {
        seriesType: this.config.seriesType,
        isOpen: this.config.isConfigOpen,
      });
    }
  }

  /**
   * Handle collapse button click
   */
  private handleCollapseClick(): void {
    // Emit collapse event
    if (this.eventManager) {
      this.eventManager.emitCustomEvent('seriesCollapse', {
        seriesType: this.config.seriesType,
      });
    }
  }

  /**
   * Create configuration dialog
   */
  private createConfigDialog(): void {
    this.configDialog = document.createElement('div');
    this.configDialog.className = 'series-config-dialog-primitive';
    this.applyDialogStyling(this.configDialog);

    // Create dialog content
    this.createDialogHeader();
    this.createDialogTabs();
    this.createDialogContent();
    this.createDialogFooter();

    // Position dialog relative to button panel
    this.positionDialog();

    if (this.containerElement) {
      this.containerElement.appendChild(this.configDialog);
    }
  }

  /**
   * Create dialog header
   */
  private createDialogHeader(): void {
    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.innerHTML = `
      <h3>${this.getSeriesDisplayName()}</h3>
      <button class="close-dialog-button">×</button>
    `;

    // Add close handler
    const closeButton = header.querySelector('.close-dialog-button') as HTMLElement;
    closeButton.addEventListener('click', () => {
      this.config.isConfigOpen = false;
      this.renderContent();
    });

    if (this.configDialog) {
      this.configDialog.appendChild(header);
    }
  }

  /**
   * Create dialog tabs
   */
  private createDialogTabs(): void {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'dialog-tabs';

    const tabs = ['inputs', 'style', 'visibility'] as const;
    tabs.forEach(tab => {
      const tabButton = document.createElement('button');
      tabButton.className = `tab-button ${this.currentTab === tab ? 'active' : ''}`;
      tabButton.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
      tabButton.addEventListener('click', () => {
        this.currentTab = tab;
        this.renderContent();
      });
      tabsContainer.appendChild(tabButton);
    });

    if (this.configDialog) {
      this.configDialog.appendChild(tabsContainer);
    }
  }

  /**
   * Create dialog content based on current tab
   */
  private createDialogContent(): void {
    const content = document.createElement('div');
    content.className = 'dialog-content';

    switch (this.currentTab) {
      case 'inputs':
        this.renderInputsContent(content);
        break;
      case 'style':
        this.renderStyleContent(content);
        break;
      case 'visibility':
        this.renderVisibilityContent(content);
        break;
    }

    if (this.configDialog) {
      this.configDialog.appendChild(content);
    }
  }

  /**
   * Render inputs content
   */
  private renderInputsContent(container: HTMLElement): void {
    const config = this.config.seriesConfig;

    switch (this.config.seriesType) {
      case 'supertrend':
        container.innerHTML = `
          <div class="input-group">
            <label for="period">Period:</label>
            <input type="number" id="period" value="${config.period || 10}" min="1" max="100">
          </div>
          <div class="input-group">
            <label for="multiplier">Multiplier:</label>
            <input type="number" id="multiplier" value="${config.multiplier || 3}" min="0.1" max="10" step="0.1">
          </div>
        `;
        break;

      case 'bollinger_bands':
        container.innerHTML = `
          <div class="input-group">
            <label for="length">Length:</label>
            <input type="number" id="length" value="${config.length || 20}" min="1" max="100">
          </div>
          <div class="input-group">
            <label for="stdDev">StdDev:</label>
            <input type="number" id="stdDev" value="${config.stdDev || 2}" min="0.1" max="5" step="0.1">
          </div>
        `;
        break;

      default:
        container.innerHTML = '<p>No configurable inputs for this series type.</p>';
    }

    // Add event listeners for input changes
    this.attachInputEventListeners(container);
  }

  /**
   * Render style content
   */
  private renderStyleContent(container: HTMLElement): void {
    const config = this.config.seriesConfig;

    // Common style properties
    let html = `
      <div class="style-group">
        <div class="style-row">
          <label>Color:</label>
          <input type="color" id="color" value="${config.color || '#2196F3'}">
          <input type="range" id="opacity" min="0" max="100" value="${config.opacity || 100}">
          <span>${config.opacity || 100}%</span>
        </div>
      </div>
      <div class="style-group">
        <div class="style-row">
          <label>Line Width:</label>
          <input type="range" id="lineWidth" min="1" max="5" value="${config.lineWidth || 1}">
          <span>${config.lineWidth || 1}px</span>
        </div>
      </div>
    `;

    // Series-specific style properties
    if (this.config.seriesType === 'supertrend') {
      html += `
        <div class="style-group">
          <h4>Up Trend</h4>
          <div class="style-row">
            <input type="checkbox" id="upTrendVisible" ${config.upTrend?.visible !== false ? 'checked' : ''}>
            <label for="upTrendVisible">Visible</label>
            <input type="color" id="upTrendColor" value="${config.upTrend?.color || '#4CAF50'}">
          </div>
        </div>
        <div class="style-group">
          <h4>Down Trend</h4>
          <div class="style-row">
            <input type="checkbox" id="downTrendVisible" ${config.downTrend?.visible !== false ? 'checked' : ''}>
            <label for="downTrendVisible">Visible</label>
            <input type="color" id="downTrendColor" value="${config.downTrend?.color || '#F44336'}">
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Add event listeners for style changes
    this.attachStyleEventListeners(container);
  }

  /**
   * Render visibility content
   */
  private renderVisibilityContent(container: HTMLElement): void {
    const config = this.config.seriesConfig;

    container.innerHTML = `
      <div class="visibility-group">
        <h4>OUTPUT VALUES</h4>
        <div class="checkbox-row">
          <input type="checkbox" id="labelsOnPriceScale" ${config.labelsOnPriceScale !== false ? 'checked' : ''}>
          <label for="labelsOnPriceScale">Labels on price scale</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="valuesInStatusLine" ${config.valuesInStatusLine !== false ? 'checked' : ''}>
          <label for="valuesInStatusLine">Values in status line</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="lastPriceVisible" ${config.lastPriceVisible !== false ? 'checked' : ''}>
          <label for="lastPriceVisible">Show last price</label>
        </div>
        <div class="checkbox-row">
          <input type="checkbox" id="priceLineVisible" ${config.priceLineVisible !== false ? 'checked' : ''}>
          <label for="priceLineVisible">Price line</label>
        </div>
      </div>
    `;

    // Add event listeners for visibility changes
    this.attachVisibilityEventListeners(container);
  }

  /**
   * Create dialog footer
   */
  private createDialogFooter(): void {
    const footer = document.createElement('div');
    footer.className = 'dialog-footer';
    footer.innerHTML = `
      <button class="defaults-button">Defaults</button>
      <div class="action-buttons">
        <button class="cancel-button">Cancel</button>
        <button class="ok-button">Ok</button>
      </div>
    `;

    // Add event listeners
    const defaultsButton = footer.querySelector('.defaults-button') as HTMLElement;
    const cancelButton = footer.querySelector('.cancel-button') as HTMLElement;
    const okButton = footer.querySelector('.ok-button') as HTMLElement;

    defaultsButton.addEventListener('click', () => this.handleDefaults());
    cancelButton.addEventListener('click', () => this.handleCancel());
    okButton.addEventListener('click', () => this.handleOk());

    if (this.configDialog) {
      this.configDialog.appendChild(footer);
    }
  }

  /**
   * Attach event listeners for input changes
   */
  private attachInputEventListeners(container: HTMLElement): void {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.handleConfigChange();
      });
    });
  }

  /**
   * Attach event listeners for style changes
   */
  private attachStyleEventListeners(container: HTMLElement): void {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.handleConfigChange();
      });
    });
  }

  /**
   * Attach event listeners for visibility changes
   */
  private attachVisibilityEventListeners(container: HTMLElement): void {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.handleConfigChange();
      });
    });
  }

  /**
   * Handle configuration changes
   */
  private handleConfigChange(): void {
    if (!this.configDialog) return;

    const newConfig = this.collectConfigFromDialog();
    this.config.seriesConfig = { ...this.config.seriesConfig, ...newConfig };

    if (this.config.onConfigChange) {
      this.config.onConfigChange(this.config.seriesConfig);
    }
  }

  /**
   * Collect configuration from dialog inputs
   */
  private collectConfigFromDialog(): Partial<SeriesConfiguration> {
    if (!this.configDialog) return {};

    const config: Partial<SeriesConfiguration> = {};

    // Collect common properties
    const colorInput = this.configDialog.querySelector('#color') as HTMLInputElement;
    const opacityInput = this.configDialog.querySelector('#opacity') as HTMLInputElement;
    const lineWidthInput = this.configDialog.querySelector('#lineWidth') as HTMLInputElement;

    if (colorInput) config.color = colorInput.value;
    if (opacityInput) config.opacity = parseInt(opacityInput.value);
    if (lineWidthInput) config.lineWidth = parseInt(lineWidthInput.value);

    // Collect series-specific properties
    // ... (implement based on series type)

    return config;
  }

  /**
   * Apply dialog styling
   */
  private applyDialogStyling(dialog: HTMLElement): void {
    const style = dialog.style;
    style.position = 'absolute';
    style.backgroundColor = 'white';
    style.border = '1px solid #ddd';
    style.borderRadius = '8px';
    style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    style.width = '320px';
    style.maxHeight = '480px';
    style.overflowY = 'auto';
    style.zIndex = '10000';
  }

  /**
   * Position dialog relative to button panel
   */
  private positionDialog(): void {
    if (!this.configDialog || !this.buttonContainer) return;

    const buttonRect = this.buttonContainer.getBoundingClientRect();
    const style = this.configDialog.style;

    // Position below and to the right of button panel
    style.top = `${buttonRect.bottom + 8}px`;
    style.left = `${buttonRect.left}px`;
  }

  /**
   * Get display name for series type
   */
  private getSeriesDisplayName(): string {
    const displayNames: Record<string, string> = {
      line: 'Line',
      area: 'Area',
      candlestick: 'Candlestick',
      supertrend: 'Supertrend',
      bollinger_bands: 'Bollinger Bands',
    };
    return displayNames[this.config.seriesType] || this.config.seriesType;
  }

  /**
   * Handle defaults button
   */
  private handleDefaults(): void {
    // Reset to default configuration
    this.config.seriesConfig = this.getDefaultConfiguration();
    this.renderContent();

    if (this.config.onConfigChange) {
      this.config.onConfigChange(this.config.seriesConfig);
    }
  }

  /**
   * Handle cancel button
   */
  private handleCancel(): void {
    this.config.isConfigOpen = false;
    this.renderContent();
  }

  /**
   * Handle ok button
   */
  private handleOk(): void {
    this.config.isConfigOpen = false;
    this.renderContent();
  }

  /**
   * Get default configuration for series type
   */
  private getDefaultConfiguration(): SeriesConfiguration {
    const baseDefaults: SeriesConfiguration = {
      color: '#2196F3',
      opacity: 100,
      lineWidth: 1,
      lastPriceVisible: true,
      priceLineVisible: true,
      labelsOnPriceScale: true,
      valuesInStatusLine: true,
    };

    switch (this.config.seriesType) {
      case 'supertrend':
        return {
          ...baseDefaults,
          period: 10,
          multiplier: 3,
          upTrend: { visible: true, color: '#4CAF50' },
          downTrend: { visible: true, color: '#F44336' },
        };

      case 'bollinger_bands':
        return {
          ...baseDefaults,
          length: 20,
          stdDev: 2,
          upperLine: { visible: true, color: '#2196F3' },
          lowerLine: { visible: true, color: '#2196F3' },
          fill: { visible: true, color: '#2196F3', opacity: 10 },
        };

      default:
        return baseDefaults;
    }
  }

  /**
   * Get CSS class name for the container
   */
  protected getContainerClassName(): string {
    return 'series-config-primitive';
  }

  /**
   * Override detached to ensure proper cleanup
   */
  public detached(): void {
    // Clean up any event listeners
    super.detached();
  }

  // ===== Public API =====

  /**
   * Update series configuration
   */
  public updateConfiguration(config: Partial<SeriesConfiguration>): void {
    this.config.seriesConfig = { ...this.config.seriesConfig, ...config };
    if (this.mounted) {
      this.renderContent();
    }
  }

  /**
   * Open configuration dialog
   */
  public openConfigDialog(): void {
    this.config.isConfigOpen = true;
    if (this.mounted) {
      this.renderContent();
    }
  }

  /**
   * Close configuration dialog
   */
  public closeConfigDialog(): void {
    this.config.isConfigOpen = false;
    if (this.mounted) {
      this.renderContent();
    }
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): SeriesConfiguration {
    return { ...this.config.seriesConfig };
  }
}
