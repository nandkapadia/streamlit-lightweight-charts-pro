/**
 * @fileoverview Series Settings Renderer (Pure TypeScript)
 *
 * Renders series-specific settings based on property-to-type mapping.
 * Automatically generates labels from property names and renders appropriate controls.
 *
 * @example
 * ```typescript
 * const renderer = new SeriesSettingsRenderer({
 *   settings: { upperLine: 'line', fillColor: 'color', visible: 'boolean' },
 *   config: { upperLine: { color: '#ff0000', width: 2, style: 'solid' } },
 *   onConfigChange: (updates) => console.log(updates),
 *   onOpenLineEditor: (type) => lineEditorDialog.open(),
 *   onOpenColorPicker: (type) => colorPickerDialog.open(),
 * });
 *
 * container.appendChild(renderer.getElement());
 * ```
 */

import { EventManager } from './base/EventManager';
import { StyleManager } from './styles/StyleManager';

/**
 * Setting type identifier
 */
export type SettingType = 'line' | 'color' | 'boolean' | 'number' | 'lineStyle';

/**
 * Settings map (property name → type)
 */
export type SeriesSettings = Record<string, SettingType>;

/**
 * Generic series configuration
 */
export type SeriesConfig = Record<string, unknown>;

/**
 * Line configuration within series config
 */
export interface LineConfigValue {
  color?: string;
  lineWidth?: number;
  lineStyle?: number | string;
}

/**
 * Renderer callbacks
 */
export interface SeriesSettingsRendererCallbacks {
  /** Called when any config property changes */
  onConfigChange: (updates: Partial<SeriesConfig>) => void;
  /** Called when user clicks a line editor control */
  onOpenLineEditor: (lineType: string) => void;
  /** Called when user clicks a color picker control */
  onOpenColorPicker: (colorType: string) => void;
}

/**
 * Renderer configuration
 */
export interface SeriesSettingsRendererConfig {
  /** Property-to-type mapping */
  settings: SeriesSettings;
  /** Current series configuration */
  config: SeriesConfig;
  /** Callbacks for user interactions */
  callbacks: SeriesSettingsRendererCallbacks;
}

/**
 * Line style numeric to string mapping
 */
const LINE_STYLE_LABELS: Record<number, string> = {
  0: 'solid',
  1: 'dotted',
  2: 'dashed',
  3: 'large dashed',
  4: 'sparse dotted',
};

/**
 * Line style options for dropdown
 */
const LINE_STYLE_OPTIONS = [
  { value: 0, label: 'Solid' },
  { value: 1, label: 'Dotted' },
  { value: 2, label: 'Dashed' },
  { value: 3, label: 'Large Dashed' },
  { value: 4, label: 'Sparse Dotted' },
];

/**
 * Convert camelCase property name to display label
 * Example: "upperFillColor" → "Upper Fill Color"
 */
function propertyToLabel(property: string): string {
  return property
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Series Settings Renderer - Pure TypeScript Implementation
 *
 * Renders dynamic form controls based on series property definitions.
 */
export class SeriesSettingsRenderer {
  private _element: HTMLDivElement;
  private _eventManager: EventManager;
  private _settings: SeriesSettings;
  private _config: SeriesConfig;
  private _callbacks: SeriesSettingsRendererCallbacks;
  private _cls = StyleManager.cls;

  /**
   * Create a new SeriesSettingsRenderer
   *
   * @param config - Renderer configuration
   */
  constructor(config: SeriesSettingsRendererConfig) {
    this._settings = config.settings;
    this._config = config.config;
    this._callbacks = config.callbacks;
    this._eventManager = new EventManager();

    // Ensure styles are injected
    StyleManager.inject();

    this._element = this._createForm();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get the rendered element
   */
  public getElement(): HTMLDivElement {
    return this._element;
  }

  /**
   * Update the configuration and re-render
   *
   * @param config - New configuration
   */
  public updateConfig(config: SeriesConfig): void {
    this._config = config;
    this._updateControls();
  }

  /**
   * Update the settings map and re-render
   *
   * @param settings - New settings map
   */
  public updateSettings(settings: SeriesSettings): void {
    this._settings = settings;
    this._rebuildForm();
  }

  /**
   * Destroy the renderer and clean up resources
   */
  public destroy(): void {
    this._eventManager.destroy();
    this._element.remove();
  }

  // ============================================================================
  // Private: Form Creation
  // ============================================================================

  /**
   * Create the form element
   */
  private _createForm(): HTMLDivElement {
    const form = document.createElement('div');
    form.className = 'series-specific-settings';
    form.style.padding = '8px 0';

    if (!this._settings || Object.keys(this._settings).length === 0) {
      return form;
    }

    Object.entries(this._settings).forEach(([property, type]) => {
      const control = this._createControl(property, type);
      if (control) {
        form.appendChild(control);
      }
    });

    return form;
  }

  /**
   * Rebuild the entire form
   */
  private _rebuildForm(): void {
    const parent = this._element.parentNode;
    const newForm = this._createForm();

    if (parent) {
      parent.replaceChild(newForm, this._element);
    }

    this._eventManager.clear();
    this._element = newForm;
  }

  /**
   * Update existing controls with new config values
   */
  private _updateControls(): void {
    // For simplicity, rebuild the form on config change
    // In a production implementation, you might update individual controls
    this._rebuildForm();
  }

  /**
   * Create a control based on type
   */
  private _createControl(property: string, type: SettingType): HTMLElement | null {
    const label = propertyToLabel(property);

    switch (type) {
      case 'line':
        return this._createLineEditorControl(property, label);
      case 'color':
        return this._createColorPickerControl(property, label);
      case 'boolean':
        return this._createCheckboxControl(property, label);
      case 'number':
        return this._createNumberControl(property, label);
      case 'lineStyle':
        return this._createLineStyleControl(property, label);
      default:
        return null;
    }
  }

  // ============================================================================
  // Private: Control Renderers
  // ============================================================================

  /**
   * Create a line editor control
   */
  private _createLineEditorControl(property: string, label: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = this._cls('form-row');
    row.style.cursor = 'pointer';
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-label', `Edit ${label}`);

    // Label
    const labelEl = document.createElement('span');
    labelEl.className = this._cls('form-label');
    labelEl.textContent = label;
    row.appendChild(labelEl);

    // Preview container
    const preview = document.createElement('div');
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.gap = '8px';

    // Get line config
    const lineConfig = (this._config[property] as LineConfigValue) || {};
    const color = lineConfig.color || (this._config.color as string) || '#2196F3';
    const width = lineConfig.lineWidth || (this._config.lineWidth as number) || 1;
    const rawStyle = lineConfig.lineStyle ?? (this._config.lineStyle as number) ?? 0;
    const styleLabel = typeof rawStyle === 'number' ? (LINE_STYLE_LABELS[rawStyle] ?? 'solid') : rawStyle;

    // Color swatch
    const swatch = document.createElement('div');
    swatch.style.width = '20px';
    swatch.style.height = '12px';
    swatch.style.backgroundColor = color;
    swatch.style.border = '1px solid #ddd';
    swatch.style.borderRadius = '2px';
    preview.appendChild(swatch);

    // Style indicator
    const indicator = document.createElement('span');
    indicator.style.fontSize = '12px';
    indicator.style.color = '#787b86';
    indicator.textContent = `${styleLabel} \u2022 ${width}px`;
    preview.appendChild(indicator);

    row.appendChild(preview);

    // Event handlers
    const handleClick = () => this._callbacks.onOpenLineEditor(property);

    this._eventManager.addEventListener(row, 'click', handleClick);
    this._eventManager.addEventListener(row, 'keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        handleClick();
      }
    });

    return row;
  }

  /**
   * Create a color picker control
   */
  private _createColorPickerControl(property: string, label: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = this._cls('form-row');
    row.style.cursor = 'pointer';
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-label', `Edit ${label}`);

    // Label
    const labelEl = document.createElement('span');
    labelEl.className = this._cls('form-label');
    labelEl.textContent = label;
    row.appendChild(labelEl);

    // Color swatch
    const color = (this._config[property] as string) || '#2196F3';
    const swatch = document.createElement('div');
    swatch.style.width = '32px';
    swatch.style.height = '12px';
    swatch.style.backgroundColor = color;
    swatch.style.border = '1px solid #ddd';
    swatch.style.borderRadius = '4px';
    row.appendChild(swatch);

    // Event handlers
    const handleClick = () => this._callbacks.onOpenColorPicker(property);

    this._eventManager.addEventListener(row, 'click', handleClick);
    this._eventManager.addEventListener(row, 'keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        handleClick();
      }
    });

    return row;
  }

  /**
   * Create a checkbox control
   */
  private _createCheckboxControl(property: string, label: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = this._cls('form-row');

    // Label first (to the left)
    const labelEl = document.createElement('label');
    labelEl.className = this._cls('form-label');
    labelEl.htmlFor = property;
    labelEl.textContent = label;
    row.appendChild(labelEl);

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = property;
    checkbox.name = property;
    checkbox.className = this._cls('checkbox');
    checkbox.checked = this._config[property] !== false;
    checkbox.setAttribute('aria-label', label);

    this._eventManager.addEventListener(checkbox, 'change', () => {
      this._callbacks.onConfigChange({ [property]: checkbox.checked });
    });

    row.appendChild(checkbox);

    return row;
  }

  /**
   * Create a number input control
   */
  private _createNumberControl(property: string, label: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = this._cls('form-row');

    // Label
    const labelEl = document.createElement('label');
    labelEl.className = this._cls('form-label');
    labelEl.htmlFor = property;
    labelEl.textContent = label;
    row.appendChild(labelEl);

    // Number input
    const input = document.createElement('input');
    input.type = 'number';
    input.id = property;
    input.name = property;
    input.className = this._cls('input');
    input.value = String(this._config[property] ?? 0);
    input.step = 'any';
    input.setAttribute('aria-label', label);

    this._eventManager.addEventListener(input, 'change', () => {
      const numValue = parseFloat(input.value);
      if (!isNaN(numValue)) {
        this._callbacks.onConfigChange({ [property]: numValue });
      }
    });

    row.appendChild(input);

    return row;
  }

  /**
   * Create a line style dropdown control
   */
  private _createLineStyleControl(property: string, label: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = this._cls('form-row');

    // Label
    const labelEl = document.createElement('label');
    labelEl.className = this._cls('form-label');
    labelEl.htmlFor = property;
    labelEl.textContent = label;
    row.appendChild(labelEl);

    // Select
    const select = document.createElement('select');
    select.id = property;
    select.name = property;
    select.className = this._cls('select');
    select.value = String(this._config[property] ?? 0);
    select.setAttribute('aria-label', label);

    LINE_STYLE_OPTIONS.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = String(option.value);
      opt.textContent = option.label;
      select.appendChild(opt);
    });

    select.value = String(this._config[property] ?? 0);

    this._eventManager.addEventListener(select, 'change', () => {
      const numValue = parseInt(select.value, 10);
      this._callbacks.onConfigChange({ [property]: numValue });
    });

    row.appendChild(select);

    return row;
  }
}

// Re-export types
export { LINE_STYLE_OPTIONS, LINE_STYLE_LABELS, propertyToLabel };
