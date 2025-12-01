/**
 * @fileoverview TradingView-style Line Editor Dialog (Pure TypeScript)
 *
 * A framework-agnostic line editor dialog with:
 * - Full color palette grid (8 rows x 10 columns)
 * - Opacity slider with percentage display
 * - Line thickness options with visual previews
 * - Line style options (solid, dashed, dotted)
 *
 * @example
 * ```typescript
 * const editor = new LineEditorDialog({
 *   config: { color: '#ff0000', width: 2, style: 'solid', opacity: 100 },
 *   onSave: (config) => console.log(config),
 *   onCancel: () => console.log('Cancelled'),
 * });
 *
 * editor.open();
 * ```
 */

import { BaseDialog, DialogSize } from './base/BaseDialog';
import { DialogState } from './base/DialogState';

/**
 * Line configuration interface
 */
export interface LineConfig {
  /** Line color (hex format) */
  color: string;
  /** Line style */
  style: 'solid' | 'dashed' | 'dotted';
  /** Line width in pixels */
  width: number;
  /** Opacity (0-100) */
  opacity?: number;
}

/**
 * Line editor dialog configuration
 */
export interface LineEditorDialogConfig {
  /** Initial line configuration */
  config?: Partial<LineConfig>;
  /** Save callback */
  onSave?: (config: LineConfig) => void;
  /** Cancel callback */
  onCancel?: () => void;
  /** Theme */
  theme?: 'light' | 'dark';
}

/**
 * Line editor internal state
 */
interface LineEditorState {
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  width: number;
  opacity: number;
  showCustomPicker: boolean;
  customColor: string;
  customHue: number;
  customSaturation: number;
  customLightness: number;
}

/**
 * TradingView-style color palette (8 rows x 10 columns)
 */
const COLOR_PALETTE = [
  ['#FFFFFF', '#E5E5E5', '#CCCCCC', '#B3B3B3', '#999999', '#808080', '#666666', '#4D4D4D', '#333333', '#000000'],
  ['#FF4444', '#FF8800', '#FFDD00', '#44DD44', '#44AAAA', '#4499FF', '#4444FF', '#8844FF', '#CC44FF', '#FF4499'],
  ['#FFD4D4', '#FFE4C4', '#FFFACD', '#D4F4D4', '#D4E4E4', '#D4D4FF', '#E4D4FF', '#F4D4FF', '#FFD4F4', '#FFD4E4'],
  ['#FFAAAA', '#FFCC99', '#FFF299', '#AAFFAA', '#AACCCC', '#AAAAFF', '#CCAAFF', '#FFAAFF', '#FFAACC', '#FFAAAA'],
  ['#FF6666', '#FFAA44', '#FFEE44', '#66FF66', '#66CCCC', '#6666FF', '#AA66FF', '#FF66FF', '#FF66AA', '#FF6666'],
  ['#FF3333', '#FF9922', '#FFCC22', '#33FF33', '#33AAAA', '#3333FF', '#9933FF', '#FF33FF', '#FF3399', '#FF3333'],
  ['#CC0000', '#CC6600', '#CC9900', '#00CC00', '#006666', '#0000CC', '#6600CC', '#CC00CC', '#CC0066', '#CC0000'],
  ['#990000', '#993300', '#996600', '#009900', '#003333', '#000099', '#330099', '#990099', '#990033', '#990000'],
];

/**
 * Thickness options
 */
const THICKNESS_OPTIONS = [
  { value: 1, label: 'Thin' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Thick' },
  { value: 4, label: 'Extra Thick' },
];

/**
 * Line style options
 */
const STYLE_OPTIONS: Array<{ value: 'solid' | 'dashed' | 'dotted'; label: string }> = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

/**
 * Line Editor Dialog - Pure TypeScript Implementation
 *
 * Provides comprehensive line editing with color, thickness, style, and opacity.
 */
export class LineEditorDialog extends BaseDialog {
  private _state: DialogState<LineEditorState>;
  private _saveCallback?: (config: LineConfig) => void;
  private _cancelCallback?: () => void;

  // Element references
  private _colorGridContainer: HTMLDivElement | null = null;
  private _customPickerPanel: HTMLDivElement | null = null;
  private _colorAreaIndicator: HTMLDivElement | null = null;
  private _opacityGradient: HTMLDivElement | null = null;
  private _opacityValueInput: HTMLInputElement | null = null;
  private _thicknessContainer: HTMLDivElement | null = null;
  private _styleContainer: HTMLDivElement | null = null;

  /**
   * Create a new LineEditorDialog
   *
   * @param config - Dialog configuration
   */
  constructor(config: LineEditorDialogConfig = {}) {
    super({ theme: config.theme });

    const initialConfig = config.config ?? {};

    this._state = new DialogState<LineEditorState>({
      color: initialConfig.color ?? '#FF4444',
      style: initialConfig.style ?? 'solid',
      width: initialConfig.width ?? 2,
      opacity: initialConfig.opacity ?? 100,
      showCustomPicker: false,
      customColor: initialConfig.color ?? '#FF4444',
      customHue: 0,
      customSaturation: 100,
      customLightness: 50,
    });

    this._saveCallback = config.onSave;
    this._cancelCallback = config.onCancel;

    // Subscribe to state changes
    this._state.subscribe(() => this._updateUI());
  }

  // ============================================================================
  // BaseDialog Implementation
  // ============================================================================

  protected getDialogTitle(): string {
    return 'Line Color';
  }

  protected getDialogWidth(): DialogSize {
    return 'sm'; // 240px
  }

  protected createDialogContent(): HTMLDivElement {
    const content = document.createElement('div');

    // Color palette
    this._colorGridContainer = this._createColorGrid();
    content.appendChild(this._colorGridContainer);

    // Custom color button
    const customBtn = this._createCustomColorButton();
    content.appendChild(customBtn);

    // Custom picker panel (hidden by default)
    this._customPickerPanel = this._createCustomPickerPanel();
    this._customPickerPanel.style.display = 'none';
    content.appendChild(this._customPickerPanel);

    // Opacity section
    const opacitySection = this._createOpacitySection();
    content.appendChild(opacitySection);

    // Thickness section
    const thicknessSection = this._createThicknessSection();
    content.appendChild(thicknessSection);

    // Style section
    const styleSection = this._createStyleSection();
    content.appendChild(styleSection);

    return content;
  }

  protected onSave(): void {
    const state = this._state.get();
    if (this._saveCallback) {
      this._saveCallback({
        color: state.color,
        style: state.style,
        width: state.width,
        opacity: state.opacity,
      });
    }
    this.close();
  }

  protected onCancel(): void {
    if (this._cancelCallback) {
      this._cancelCallback();
    }
    this.close();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Set the line configuration
   *
   * @param config - Line configuration
   */
  public setConfig(config: Partial<LineConfig>): void {
    this._state.set({
      color: config.color ?? this._state.getProperty('color'),
      style: config.style ?? this._state.getProperty('style'),
      width: config.width ?? this._state.getProperty('width'),
      opacity: config.opacity ?? this._state.getProperty('opacity'),
      customColor: config.color ?? this._state.getProperty('color'),
    });
  }

  /**
   * Get the current line configuration
   */
  public getConfig(): LineConfig {
    const state = this._state.get();
    return {
      color: state.color,
      style: state.style,
      width: state.width,
      opacity: state.opacity,
    };
  }

  // ============================================================================
  // Private: Create UI Elements
  // ============================================================================

  /**
   * Create the color palette grid
   */
  private _createColorGrid(): HTMLDivElement {
    const grid = document.createElement('div');
    grid.className = this._cls('color-grid');

    const state = this._state.get();

    COLOR_PALETTE.forEach((row) => {
      row.forEach((color) => {
        const button = document.createElement('button');
        button.className = this._cls('color-btn');
        button.style.backgroundColor = color;
        button.title = color;

        if (state.color.toUpperCase() === color.toUpperCase()) {
          button.classList.add('selected');
        }

        this._eventManager.addEventListener(button, 'click', () => {
          this._handleColorSelect(color);
        });

        grid.appendChild(button);
      });
    });

    return grid;
  }

  /**
   * Create the custom color button
   */
  private _createCustomColorButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = this._cls('custom-picker-btn');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('fill', 'none');
    svg.style.marginRight = '4px';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M8 3V13M3 8H13');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    button.appendChild(svg);
    button.appendChild(document.createTextNode('Custom color'));

    this._eventManager.addEventListener(button, 'click', () => {
      const state = this._state.get();
      this._state.set({ showCustomPicker: !state.showCustomPicker });
    });

    return button;
  }

  /**
   * Create the custom color picker panel
   */
  private _createCustomPickerPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = this._cls('custom-picker-panel');

    const colorArea = this._createColorArea();
    panel.appendChild(colorArea);

    const hueSlider = this._createHueSlider();
    panel.appendChild(hueSlider);

    const previewRow = this._createPreviewRow();
    panel.appendChild(previewRow);

    return panel;
  }

  /**
   * Create the HSL color selection area
   */
  private _createColorArea(): HTMLDivElement {
    const state = this._state.get();

    const area = document.createElement('div');
    area.className = this._cls('color-area');
    area.style.background = `linear-gradient(to top, #000000 0%, transparent 100%), linear-gradient(to right, #ffffff 0%, hsl(${state.customHue}, 100%, 50%) 100%)`;

    this._colorAreaIndicator = document.createElement('div');
    this._colorAreaIndicator.className = this._cls('color-area-indicator');
    this._colorAreaIndicator.style.left = `${state.customSaturation}%`;
    this._colorAreaIndicator.style.top = `${100 - state.customLightness}%`;
    area.appendChild(this._colorAreaIndicator);

    this._eventManager.addEventListener(area, 'click', (e: Event) => {
      this._handleColorAreaClick(e as MouseEvent, area);
    });

    return area;
  }

  /**
   * Create the hue slider
   */
  private _createHueSlider(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.marginBottom = '8px';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '360';
    slider.value = String(this._state.getProperty('customHue'));
    slider.className = this._cls('hue-slider');

    this._eventManager.addEventListener(slider, 'input', () => {
      this._handleHueChange(parseInt(slider.value, 10));
    });

    container.appendChild(slider);
    return container;
  }

  /**
   * Create the color preview and hex input row
   */
  private _createPreviewRow(): HTMLDivElement {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';

    const state = this._state.get();

    const preview = document.createElement('div');
    preview.style.width = '24px';
    preview.style.height = '24px';
    preview.style.backgroundColor = state.customColor;
    preview.style.border = '1px solid #e0e3e7';
    preview.style.borderRadius = '4px';
    preview.style.flexShrink = '0';
    preview.id = 'custom-color-preview';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = state.customColor;
    input.className = this._cls('input');
    input.style.flex = '1';
    input.style.fontFamily = 'monospace';

    this._eventManager.addEventListener(input, 'input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(input.value)) {
        this._state.set({ customColor: input.value });
      }
    });

    const okBtn = document.createElement('button');
    okBtn.className = `${this._cls('btn')} ${this._cls('btn-primary')}`;
    okBtn.style.padding = '4px 8px';
    okBtn.style.fontSize = '11px';
    okBtn.textContent = 'OK';

    this._eventManager.addEventListener(okBtn, 'click', () => {
      this._handleCustomColorSelect();
    });

    row.appendChild(preview);
    row.appendChild(input);
    row.appendChild(okBtn);

    return row;
  }

  /**
   * Create the opacity section
   */
  private _createOpacitySection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = this._cls('opacity-section');

    const state = this._state.get();

    const label = document.createElement('label');
    label.className = this._cls('opacity-label');
    label.textContent = 'Opacity';
    section.appendChild(label);

    const row = document.createElement('div');
    row.className = this._cls('opacity-row');

    const sliderContainer = document.createElement('div');
    sliderContainer.className = this._cls('opacity-slider-container');

    this._opacityGradient = document.createElement('div');
    this._opacityGradient.style.position = 'absolute';
    this._opacityGradient.style.top = '0';
    this._opacityGradient.style.left = '0';
    this._opacityGradient.style.right = '0';
    this._opacityGradient.style.bottom = '0';
    this._opacityGradient.style.background = `linear-gradient(90deg, transparent 0%, ${state.color} 100%)`;
    sliderContainer.appendChild(this._opacityGradient);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = String(state.opacity);
    slider.className = this._cls('opacity-slider');

    this._eventManager.addEventListener(slider, 'input', () => {
      this._handleOpacityChange(parseInt(slider.value, 10));
    });

    sliderContainer.appendChild(slider);
    row.appendChild(sliderContainer);

    this._opacityValueInput = document.createElement('input');
    this._opacityValueInput.type = 'text';
    this._opacityValueInput.value = `${state.opacity}%`;
    this._opacityValueInput.className = this._cls('opacity-value');

    this._eventManager.addEventListener(this._opacityValueInput, 'change', () => {
      const value = this._opacityValueInput!.value.replace('%', '');
      const opacity = Math.min(100, Math.max(0, parseInt(value, 10) || 0));
      this._handleOpacityChange(opacity);
    });

    row.appendChild(this._opacityValueInput);
    section.appendChild(row);

    return section;
  }

  /**
   * Create the thickness section
   */
  private _createThicknessSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = this._cls('section');
    section.style.padding = '6px';
    section.style.borderBottom = '1px solid #e0e3e7';

    const label = document.createElement('label');
    label.className = this._cls('section-label');
    label.textContent = 'Thickness';
    section.appendChild(label);

    this._thicknessContainer = document.createElement('div');
    this._thicknessContainer.className = this._cls('thickness-options');
    this._thicknessContainer.style.display = 'flex';
    this._thicknessContainer.style.gap = '0px';
    this._thicknessContainer.style.padding = '0 2px';

    const state = this._state.get();

    THICKNESS_OPTIONS.forEach((option) => {
      const button = document.createElement('button');
      button.className = this._cls('thickness-btn');
      button.style.flex = '1';
      button.style.height = '28px';
      button.title = option.label;
      button.dataset.value = String(option.value);

      if (state.width === option.value) {
        button.classList.add('selected');
        button.style.border = '2px solid #2962ff';
        button.style.backgroundColor = '#f0f3ff';
      }

      // Line preview
      const line = document.createElement('div');
      line.style.width = '20px';
      line.style.height = `${Math.max(1, option.value)}px`;
      line.style.backgroundColor = this._getColorWithOpacity(state.color, state.opacity);
      line.style.borderRadius = option.value > 2 ? '1px' : '0px';
      button.appendChild(line);

      this._eventManager.addEventListener(button, 'click', () => {
        this._handleThicknessChange(option.value);
      });

      this._thicknessContainer!.appendChild(button);
    });

    section.appendChild(this._thicknessContainer);
    return section;
  }

  /**
   * Create the style section
   */
  private _createStyleSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = this._cls('section');
    section.style.padding = '12px';

    const label = document.createElement('label');
    label.className = this._cls('section-label');
    label.textContent = 'Line style';
    section.appendChild(label);

    this._styleContainer = document.createElement('div');
    this._styleContainer.className = this._cls('line-style-options');
    this._styleContainer.style.display = 'flex';
    this._styleContainer.style.gap = '0px';
    this._styleContainer.style.padding = '0 2px';

    const state = this._state.get();

    STYLE_OPTIONS.forEach((option) => {
      const button = document.createElement('button');
      button.className = this._cls('line-style-btn');
      button.style.flex = '1';
      button.style.height = '28px';
      button.title = option.label;
      button.dataset.value = option.value;

      if (state.style === option.value) {
        button.classList.add('selected');
        button.style.border = '2px solid #2962ff';
        button.style.backgroundColor = '#f0f3ff';
      }

      // Line style preview
      const line = document.createElement('div');
      line.style.width = '24px';
      line.style.height = '0px';
      line.style.borderTop = `2px ${option.value} ${this._getColorWithOpacity(state.color, state.opacity)}`;
      button.appendChild(line);

      this._eventManager.addEventListener(button, 'click', () => {
        this._handleStyleChange(option.value);
      });

      this._styleContainer!.appendChild(button);
    });

    section.appendChild(this._styleContainer);
    return section;
  }

  // ============================================================================
  // Private: Event Handlers
  // ============================================================================

  private _handleColorSelect(color: string): void {
    this._state.set({ color });
  }

  private _handleColorAreaClick(e: MouseEvent, area: HTMLElement): void {
    const rect = area.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const saturation = Math.round((x / rect.width) * 100);
    const lightness = Math.round(100 - (y / rect.height) * 100);

    const hue = this._state.getProperty('customHue');
    const newColor = this._hslToHex(hue, saturation, lightness);

    this._state.set({
      customSaturation: saturation,
      customLightness: lightness,
      customColor: newColor,
    });
  }

  private _handleHueChange(hue: number): void {
    const state = this._state.get();
    const newColor = this._hslToHex(hue, state.customSaturation, state.customLightness);
    this._state.set({ customHue: hue, customColor: newColor });
  }

  private _handleCustomColorSelect(): void {
    const customColor = this._state.getProperty('customColor');
    this._state.set({ color: customColor, showCustomPicker: false });
  }

  private _handleOpacityChange(opacity: number): void {
    this._state.set({ opacity });
  }

  private _handleThicknessChange(width: number): void {
    this._state.set({ width });
  }

  private _handleStyleChange(style: 'solid' | 'dashed' | 'dotted'): void {
    this._state.set({ style });
  }

  // ============================================================================
  // Private: UI Updates
  // ============================================================================

  private _updateUI(): void {
    const state = this._state.get();

    // Update color grid selection
    this._updateColorGridSelection(state.color);

    // Update custom picker visibility
    if (this._customPickerPanel) {
      this._customPickerPanel.style.display = state.showCustomPicker ? 'block' : 'none';
    }

    // Update color area indicator
    if (this._colorAreaIndicator) {
      this._colorAreaIndicator.style.left = `${state.customSaturation}%`;
      this._colorAreaIndicator.style.top = `${100 - state.customLightness}%`;
    }

    // Update color area background
    const colorArea = this._customPickerPanel?.querySelector(`.${this._cls('color-area')}`) as HTMLElement;
    if (colorArea) {
      colorArea.style.background = `linear-gradient(to top, #000000 0%, transparent 100%), linear-gradient(to right, #ffffff 0%, hsl(${state.customHue}, 100%, 50%) 100%)`;
    }

    // Update custom color preview
    const preview = this._customPickerPanel?.querySelector('#custom-color-preview') as HTMLElement;
    if (preview) {
      preview.style.backgroundColor = state.customColor;
    }

    // Update opacity gradient
    if (this._opacityGradient) {
      this._opacityGradient.style.background = `linear-gradient(90deg, transparent 0%, ${state.color} 100%)`;
    }

    // Update opacity value
    if (this._opacityValueInput) {
      this._opacityValueInput.value = `${state.opacity}%`;
    }

    // Update thickness buttons
    this._updateThicknessButtons(state.width, state.color, state.opacity);

    // Update style buttons
    this._updateStyleButtons(state.style, state.color, state.opacity);
  }

  private _updateColorGridSelection(selectedColor: string): void {
    if (!this._colorGridContainer) return;

    const buttons = this._colorGridContainer.querySelectorAll(`.${this._cls('color-btn')}`);
    buttons.forEach((btn) => {
      const button = btn as HTMLElement;
      const btnColor = button.style.backgroundColor;
      const isSelected = this._colorsMatch(btnColor, selectedColor);
      button.classList.toggle('selected', isSelected);
    });
  }

  private _updateThicknessButtons(selectedWidth: number, color: string, opacity: number): void {
    if (!this._thicknessContainer) return;

    const buttons = this._thicknessContainer.querySelectorAll(`.${this._cls('thickness-btn')}`);
    buttons.forEach((btn) => {
      const button = btn as HTMLButtonElement;
      const width = parseInt(button.dataset.value ?? '0', 10);
      const isSelected = width === selectedWidth;

      button.classList.toggle('selected', isSelected);
      button.style.border = isSelected ? '2px solid #2962ff' : '1px solid #e0e3e7';
      button.style.backgroundColor = isSelected ? '#f0f3ff' : '#ffffff';

      // Update line preview color
      const line = button.querySelector('div') as HTMLElement;
      if (line) {
        line.style.backgroundColor = this._getColorWithOpacity(color, opacity);
      }
    });
  }

  private _updateStyleButtons(
    selectedStyle: 'solid' | 'dashed' | 'dotted',
    color: string,
    opacity: number
  ): void {
    if (!this._styleContainer) return;

    const buttons = this._styleContainer.querySelectorAll(`.${this._cls('line-style-btn')}`);
    buttons.forEach((btn) => {
      const button = btn as HTMLButtonElement;
      const style = button.dataset.value as 'solid' | 'dashed' | 'dotted';
      const isSelected = style === selectedStyle;

      button.classList.toggle('selected', isSelected);
      button.style.border = isSelected ? '2px solid #2962ff' : '1px solid #e0e3e7';
      button.style.backgroundColor = isSelected ? '#f0f3ff' : '#ffffff';

      // Update line preview
      const line = button.querySelector('div') as HTMLElement;
      if (line) {
        line.style.borderTop = `2px ${style} ${this._getColorWithOpacity(color, opacity)}`;
      }
    });
  }

  // ============================================================================
  // Private: Color Utilities
  // ============================================================================

  private _hslToHex(h: number, s: number, l: number): string {
    const hDecimal = l / 100;
    const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  private _getColorWithOpacity(color: string, opacity: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  }

  private _colorsMatch(color1: string, color2: string): boolean {
    const normalize = (c: string) => {
      const rgbMatch = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
      }
      return c.toUpperCase();
    };
    return normalize(color1) === normalize(color2);
  }
}

// Re-export for external use
export { COLOR_PALETTE, THICKNESS_OPTIONS, STYLE_OPTIONS };
