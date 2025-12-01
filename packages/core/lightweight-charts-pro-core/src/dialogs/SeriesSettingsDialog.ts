/**
 * @fileoverview Series Settings Dialog (Pure TypeScript)
 *
 * The main dialog for editing series settings with:
 * - Tabbed interface for multiple series
 * - Common settings (visible, lastValueVisible, etc.)
 * - Series-specific settings rendered dynamically
 * - Sub-dialogs for color picker and line editor
 * - Optimistic updates with live preview
 *
 * @example
 * ```typescript
 * const dialog = new SeriesSettingsDialog({
 *   seriesList: [
 *     { id: 'ohlc', type: 'Candlestick', title: 'OHLC' },
 *     { id: 'volume', type: 'Histogram', title: 'Volume' },
 *   ],
 *   seriesConfigs: {
 *     'ohlc': { visible: true, upColor: '#26a69a' },
 *     'volume': { visible: true, color: '#2196F3' },
 *   },
 *   seriesSettings: {
 *     'Candlestick': { upColor: 'color', downColor: 'color' },
 *     'Histogram': { color: 'color' },
 *   },
 *   onConfigChange: (seriesId, config) => applySeries(seriesId, config),
 * });
 *
 * dialog.open();
 * ```
 */

import { BaseDialog, DialogSize } from './base/BaseDialog';
import { DialogState } from './base/DialogState';
import { TabManager, Tab } from './TabManager';
import { FormStateManager, SeriesFormConfig } from './FormStateManager';
import { SeriesSettingsRenderer, SeriesSettings, SettingType } from './SeriesSettingsRenderer';
import { ColorPickerDialog } from './ColorPickerDialog';
import { LineEditorDialog, LineConfig } from './LineEditorDialog';

/**
 * Series information for tab display
 */
export interface SeriesInfo {
  /** Unique series identifier */
  id: string;
  /** Series type (e.g., 'Candlestick', 'Line', 'Band') */
  type: string;
  /** Display title for the tab */
  title?: string;
}

/**
 * Series settings configuration
 */
export interface SeriesSettingsDialogConfig {
  /** List of series in the pane */
  seriesList: SeriesInfo[];
  /** Current configurations for each series */
  seriesConfigs: Record<string, SeriesFormConfig>;
  /** Settings definitions by series type */
  seriesSettings: Record<string, SeriesSettings>;
  /** Callback when configuration changes */
  onConfigChange?: (seriesId: string, config: SeriesFormConfig) => void;
  /** Callback when dialog closes */
  onClose?: () => void;
  /** Theme */
  theme?: 'light' | 'dark';
}

/**
 * Dialog internal state
 */
interface SeriesSettingsDialogState {
  activeSeriesId: string;
  colorPickerOpen: boolean;
  colorPickerProperty: string | null;
  lineEditorOpen: boolean;
  lineEditorProperty: string | null;
}

/**
 * Common settings shown for all series types
 */
const COMMON_SETTINGS: Array<{ property: string; label: string; type: SettingType }> = [
  { property: 'visible', label: 'Visible', type: 'boolean' },
  { property: 'lastValueVisible', label: 'Last Value Visible', type: 'boolean' },
  { property: 'priceLineVisible', label: 'Price Line Visible', type: 'boolean' },
];

/**
 * Series Settings Dialog - Pure TypeScript Implementation
 *
 * Main dialog for editing series configurations.
 */
export class SeriesSettingsDialog extends BaseDialog {
  private _state: DialogState<SeriesSettingsDialogState>;
  private _seriesList: SeriesInfo[];
  private _seriesSettings: Record<string, SeriesSettings>;
  private _tabManager: TabManager | null = null;
  private _formStateManager: FormStateManager;
  private _settingsRenderer: SeriesSettingsRenderer | null = null;
  private _colorPickerDialog: ColorPickerDialog | null = null;
  private _lineEditorDialog: LineEditorDialog | null = null;
  private _contentContainer: HTMLDivElement | null = null;
  private _closeCallback?: () => void;
  private _titleElement: HTMLElement | null = null;

  /**
   * Create a new SeriesSettingsDialog
   *
   * @param config - Dialog configuration
   */
  constructor(config: SeriesSettingsDialogConfig) {
    super({ theme: config.theme });

    this._seriesList = config.seriesList;
    this._seriesSettings = config.seriesSettings;
    this._closeCallback = config.onClose;

    const initialActiveId = config.seriesList.length > 0 ? config.seriesList[0].id : '';

    this._state = new DialogState<SeriesSettingsDialogState>({
      activeSeriesId: initialActiveId,
      colorPickerOpen: false,
      colorPickerProperty: null,
      lineEditorOpen: false,
      lineEditorProperty: null,
    });

    // Initialize form state manager
    this._formStateManager = new FormStateManager({
      initialConfigs: config.seriesConfigs,
      onConfigChange: config.onConfigChange,
      debounceMs: 300,
    });

    // Subscribe to state changes
    this._state.subscribe(() => this._updateContent());

    // Subscribe to form state changes
    this._formStateManager.subscribe(() => this._updateContent());
  }

  // ============================================================================
  // BaseDialog Implementation
  // ============================================================================

  protected getDialogTitle(): string {
    return 'Series Settings';
  }

  protected onOpen(): void {
    super.onOpen();
    // Get reference to title element for updating pending indicator
    if (this.element) {
      this._titleElement = this.element.querySelector(`.${this._cls('dialog-title')}`);
      this._updateDialogTitle();
    }
  }

  protected getDialogWidth(): DialogSize {
    return '320px';
  }

  protected showFooter(): boolean {
    return false; // We use live preview, no save/cancel needed
  }

  protected createDialogContent(): HTMLDivElement {
    const content = document.createElement('div');

    // Create tabs if multiple series
    if (this._seriesList.length > 1) {
      const tabs = this._createTabs();
      content.appendChild(tabs);
    }

    // Content container (updates when tab changes)
    this._contentContainer = document.createElement('div');
    this._contentContainer.style.padding = '8px 12px';
    this._updateContentContainer();
    content.appendChild(this._contentContainer);

    return content;
  }

  protected onClose(): void {
    // Flush any pending changes
    this._formStateManager.flush();

    if (this._closeCallback) {
      this._closeCallback();
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Update series list and configurations
   *
   * @param seriesList - New series list
   * @param seriesConfigs - New configurations
   */
  public updateSeries(
    seriesList: SeriesInfo[],
    seriesConfigs: Record<string, SeriesFormConfig>
  ): void {
    this._seriesList = seriesList;

    // Update form state manager
    Object.entries(seriesConfigs).forEach(([id, config]) => {
      this._formStateManager.addSeries(id, config);
    });

    // Update tabs with smart title generation
    if (this._tabManager) {
      const tabs = this._seriesList.map((s, index) => ({
        id: s.id,
        title: this._generateTabTitle(s, index),
      }));
      this._tabManager.setTabs(tabs);
    }

    // Ensure active series is valid
    const activeId = this._state.getProperty('activeSeriesId');
    if (!seriesList.some((s) => s.id === activeId) && seriesList.length > 0) {
      this._state.set({ activeSeriesId: seriesList[0].id });
    }
  }

  /**
   * Get the form state manager
   */
  public getFormStateManager(): FormStateManager {
    return this._formStateManager;
  }

  public destroy(): void {
    this._formStateManager.destroy();
    this._colorPickerDialog?.destroy();
    this._lineEditorDialog?.destroy();
    this._tabManager?.destroy();
    this._settingsRenderer?.destroy();
    super.destroy();
  }

  // ============================================================================
  // Private: Create UI Elements
  // ============================================================================

  /**
   * Create the tab interface
   */
  private _createTabs(): HTMLDivElement {
    const tabs: Tab[] = this._seriesList.map((series, index) => ({
      id: series.id,
      title: this._generateTabTitle(series, index),
    }));

    this._tabManager = new TabManager({
      tabs,
      activeTabId: this._state.getProperty('activeSeriesId'),
      onTabChange: (tabId) => {
        this._state.set({ activeSeriesId: tabId });
      },
    });

    return this._tabManager.getElement();
  }

  /**
   * Generate tab title with smart prioritization
   *
   * Priority:
   * 1. series.title (displayName from SeriesInfo)
   * 2. seriesConfigs[id].displayName
   * 3. seriesConfigs[id].title
   * 4. Fallback: "TypeName Series N" format
   */
  private _generateTabTitle(series: SeriesInfo, index: number): string {
    // Priority 1: series.title
    if (series.title) {
      return series.title;
    }

    // Priority 2 & 3: Check config for displayName or title
    const config = this._formStateManager.getConfig(series.id);
    if (config.displayName && typeof config.displayName === 'string') {
      return config.displayName;
    }
    if (config.title && typeof config.title === 'string') {
      return config.title;
    }

    // Priority 4: Fallback format "TypeName Series N"
    const seriesNumber = index + 1;
    return `${series.type} Series ${seriesNumber}`;
  }

  /**
   * Update the content container
   */
  private _updateContentContainer(): void {
    if (!this._contentContainer) return;

    // Clear existing content
    this._contentContainer.innerHTML = '';

    const activeId = this._state.getProperty('activeSeriesId');
    const activeSeries = this._seriesList.find((s) => s.id === activeId);

    if (!activeSeries) return;

    const config = this._formStateManager.getConfig(activeId);

    // Common settings section (pass series type for filtering)
    const commonSection = this._createCommonSettings(activeId, config, activeSeries.type);
    this._contentContainer.appendChild(commonSection);

    // Divider
    const divider = document.createElement('div');
    divider.style.height = '1px';
    divider.style.backgroundColor = '#e0e3e7';
    divider.style.margin = '8px 0';
    this._contentContainer.appendChild(divider);

    // Series-specific settings
    const seriesSettings = this._seriesSettings[activeSeries.type] || {};
    if (Object.keys(seriesSettings).length > 0) {
      const specificSection = this._createSeriesSpecificSettings(activeId, config, seriesSettings);
      this._contentContainer.appendChild(specificSection);
    }
  }

  /**
   * Create common settings section
   *
   * @param seriesId - Series ID
   * @param config - Series configuration
   * @param seriesType - Series type (used to filter settings)
   */
  private _createCommonSettings(seriesId: string, config: SeriesFormConfig, seriesType: string): HTMLDivElement {
    const section = document.createElement('div');

    COMMON_SETTINGS.forEach(({ property, label, type }) => {
      // Hide lastValueVisible and priceLineVisible for signal series
      if (seriesType === 'signal' && (property === 'lastValueVisible' || property === 'priceLineVisible')) {
        return;
      }

      if (type === 'boolean') {
        const row = document.createElement('div');
        row.className = this._cls('form-row');

        const labelEl = document.createElement('label');
        labelEl.className = this._cls('form-label');
        labelEl.htmlFor = property;
        labelEl.textContent = label;
        row.appendChild(labelEl);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = property;
        checkbox.className = this._cls('checkbox');
        checkbox.checked = config[property] !== false;

        this._eventManager.addEventListener(checkbox, 'change', () => {
          this._formStateManager.updateConfig(seriesId, { [property]: checkbox.checked });
        });

        row.appendChild(checkbox);
        section.appendChild(row);
      }
    });

    return section;
  }

  /**
   * Create series-specific settings section
   */
  private _createSeriesSpecificSettings(
    seriesId: string,
    config: SeriesFormConfig,
    settings: SeriesSettings
  ): HTMLDivElement {
    // Clean up previous renderer
    if (this._settingsRenderer) {
      this._settingsRenderer.destroy();
    }

    this._settingsRenderer = new SeriesSettingsRenderer({
      settings,
      config,
      callbacks: {
        onConfigChange: (updates) => {
          this._formStateManager.updateConfig(seriesId, updates);
        },
        onOpenLineEditor: (lineType) => {
          this._openLineEditor(seriesId, lineType, config);
        },
        onOpenColorPicker: (colorType) => {
          this._openColorPicker(seriesId, colorType, config);
        },
      },
    });

    return this._settingsRenderer.getElement();
  }

  // ============================================================================
  // Private: Sub-Dialogs
  // ============================================================================

  /**
   * Open the color picker dialog
   */
  private _openColorPicker(seriesId: string, colorType: string, config: SeriesFormConfig): void {
    const currentColor = (config[colorType] as string) || '#2196F3';

    // Parse color and opacity
    let color = currentColor;
    let opacity = 100;

    // Handle rgba format
    const rgbaMatch = currentColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
      color = `#${r}${g}${b}`;
      opacity = rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 100) : 100;
    }

    // Create or reuse color picker dialog
    if (!this._colorPickerDialog) {
      this._colorPickerDialog = new ColorPickerDialog({
        color,
        opacity,
        theme: this._config.theme,
        onSave: (newColor, newOpacity) => {
          const property = this._state.getProperty('colorPickerProperty');
          if (property) {
            // Convert to rgba if opacity < 100
            const finalColor = newOpacity < 100
              ? this._hexToRgba(newColor, newOpacity)
              : newColor;

            this._formStateManager.updateConfig(seriesId, { [property]: finalColor });
          }
          this._state.set({ colorPickerOpen: false, colorPickerProperty: null });
        },
        onCancel: () => {
          this._state.set({ colorPickerOpen: false, colorPickerProperty: null });
        },
      });
    } else {
      this._colorPickerDialog.setColor(color, opacity);
    }

    this._state.set({ colorPickerOpen: true, colorPickerProperty: colorType });
    this._colorPickerDialog.open();
  }

  /**
   * Open the line editor dialog
   */
  private _openLineEditor(seriesId: string, lineType: string, config: SeriesFormConfig): void {
    const lineConfig = (config[lineType] as LineConfig) || {};
    const color = lineConfig.color || (config.color as string) || '#2196F3';
    const width = lineConfig.width || (config.lineWidth as number) || 2;
    const styleRaw = lineConfig.style ?? (config.lineStyle as number) ?? 0;

    // Convert numeric style to string
    const styleMap: Record<number, 'solid' | 'dashed' | 'dotted'> = {
      0: 'solid',
      1: 'dotted',
      2: 'dashed',
    };
    const style = typeof styleRaw === 'number' ? (styleMap[styleRaw] ?? 'solid') : styleRaw as 'solid' | 'dashed' | 'dotted';

    // Create or reuse line editor dialog
    if (!this._lineEditorDialog) {
      this._lineEditorDialog = new LineEditorDialog({
        config: { color, width, style, opacity: lineConfig.opacity ?? 100 },
        theme: this._config.theme,
        onSave: (newConfig) => {
          const property = this._state.getProperty('lineEditorProperty');
          if (property) {
            // Convert string style back to number
            const styleNumMap: Record<string, number> = {
              solid: 0,
              dotted: 1,
              dashed: 2,
            };
            const numStyle = styleNumMap[newConfig.style] ?? 0;

            this._formStateManager.updateConfig(seriesId, {
              [property]: {
                color: newConfig.color,
                lineWidth: newConfig.width,
                lineStyle: numStyle,
                opacity: newConfig.opacity,
              },
            });
          }
          this._state.set({ lineEditorOpen: false, lineEditorProperty: null });
        },
        onCancel: () => {
          this._state.set({ lineEditorOpen: false, lineEditorProperty: null });
        },
      });
    } else {
      this._lineEditorDialog.setConfig({ color, width, style, opacity: lineConfig.opacity ?? 100 });
    }

    this._state.set({ lineEditorOpen: true, lineEditorProperty: lineType });
    this._lineEditorDialog.open();
  }

  // ============================================================================
  // Private: Updates
  // ============================================================================

  /**
   * Update content when state changes
   */
  private _updateContent(): void {
    this._updateContentContainer();
    this._updateDialogTitle();
  }

  /**
   * Update dialog title with pending indicator
   */
  private _updateDialogTitle(): void {
    if (!this._titleElement) return;

    const isPending = this._formStateManager.isAnyPending();
    const baseTitle = this.getDialogTitle();

    // Add hourglass emoji (⏳) when updates are pending
    this._titleElement.textContent = isPending ? `${baseTitle} ⏳` : baseTitle;
  }

  // ============================================================================
  // Private: Utilities
  // ============================================================================

  /**
   * Convert hex color to rgba
   */
  private _hexToRgba(hex: string, opacity: number): string {
    const hexClean = hex.replace('#', '');
    const r = parseInt(hexClean.substr(0, 2), 16);
    const g = parseInt(hexClean.substr(2, 2), 16);
    const b = parseInt(hexClean.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  }
}
