/**
 * @fileoverview TradingView-style Color Picker Dialog (Pure TypeScript)
 *
 * A framework-agnostic color picker dialog with:
 * - TradingView-style color palette (8 rows x 10 columns)
 * - Opacity/transparency slider
 * - Custom color picker with HSL area and hue slider
 * - Hex input for precise color selection
 *
 * @example
 * ```typescript
 * const picker = new ColorPickerDialog({
 *   color: '#ff0000',
 *   opacity: 100,
 *   onSave: (color, opacity) => console.log(color, opacity),
 *   onCancel: () => console.log('Cancelled'),
 * });
 *
 * picker.open();
 * ```
 */

import { BaseDialog, DialogSize } from './base/BaseDialog';
import { DialogState } from './base/DialogState';

/**
 * Color picker configuration
 */
export interface ColorPickerDialogConfig {
  /** Initial color (hex format) */
  color?: string;
  /** Initial opacity (0-100) */
  opacity?: number;
  /** Save callback */
  onSave?: (color: string, opacity: number) => void;
  /** Cancel callback */
  onCancel?: () => void;
  /** Theme */
  theme?: 'light' | 'dark';
}

/**
 * Color picker internal state
 */
interface ColorPickerState {
  selectedColor: string;
  selectedOpacity: number;
  customColor: string;
  showCustomPicker: boolean;
  customHue: number;
  customSaturation: number;
  customLightness: number;
}

/**
 * TradingView-style color palette (8 rows x 10 columns)
 */
const COLOR_PALETTE = [
  // Row 1: Grays and blacks
  ['#FFFFFF', '#E5E5E5', '#CCCCCC', '#B3B3B3', '#999999', '#808080', '#666666', '#4D4D4D', '#333333', '#000000'],
  // Row 2: Primary colors
  ['#FF4444', '#FF8800', '#FFDD00', '#44DD44', '#44AAAA', '#4499FF', '#4444FF', '#8844FF', '#CC44FF', '#FF4499'],
  // Row 3: Light tints
  ['#FFD4D4', '#FFE4C4', '#FFFACD', '#D4F4D4', '#D4E4E4', '#D4D4FF', '#E4D4FF', '#F4D4FF', '#FFD4F4', '#FFD4E4'],
  // Row 4: Medium tints
  ['#FFAAAA', '#FFCC99', '#FFF299', '#AAFFAA', '#AACCCC', '#AAAAFF', '#CCAAFF', '#FFAAFF', '#FFAACC', '#FFAAAA'],
  // Row 5: Vibrant colors
  ['#FF6666', '#FFAA44', '#FFEE44', '#66FF66', '#66CCCC', '#6666FF', '#AA66FF', '#FF66FF', '#FF66AA', '#FF6666'],
  // Row 6: Saturated colors
  ['#FF3333', '#FF9922', '#FFCC22', '#33FF33', '#33AAAA', '#3333FF', '#9933FF', '#FF33FF', '#FF3399', '#FF3333'],
  // Row 7: Dark colors
  ['#CC0000', '#CC6600', '#CC9900', '#00CC00', '#006666', '#0000CC', '#6600CC', '#CC00CC', '#CC0066', '#CC0000'],
  // Row 8: Very dark colors
  ['#990000', '#993300', '#996600', '#009900', '#003333', '#000099', '#330099', '#990099', '#990033', '#990000'],
];

/**
 * Color Picker Dialog - Pure TypeScript Implementation
 *
 * Provides comprehensive color selection capabilities matching
 * the TradingView style color picker.
 */
export class ColorPickerDialog extends BaseDialog {
  private _state: DialogState<ColorPickerState>;
  private _saveCallback?: (color: string, opacity: number) => void;
  private _cancelCallback?: () => void;

  // Element references for updates
  private _colorGridContainer: HTMLDivElement | null = null;
  private _customPickerPanel: HTMLDivElement | null = null;
  private _colorAreaIndicator: HTMLDivElement | null = null;
  private _opacityGradient: HTMLDivElement | null = null;
  private _opacityValueInput: HTMLInputElement | null = null;

  /**
   * Create a new ColorPickerDialog
   *
   * @param config - Dialog configuration
   */
  constructor(config: ColorPickerDialogConfig = {}) {
    super({ theme: config.theme });

    this._state = new DialogState<ColorPickerState>({
      selectedColor: config.color ?? '#FF4444',
      selectedOpacity: config.opacity ?? 100,
      customColor: config.color ?? '#FF4444',
      showCustomPicker: false,
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
    return 'Color Palette';
  }

  protected getDialogWidth(): DialogSize {
    return 'sm'; // 240px
  }

  protected createDialogContent(): HTMLDivElement {
    const content = document.createElement('div');

    // Color palette grid
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

    return content;
  }

  protected onSave(): void {
    const state = this._state.get();
    if (this._saveCallback) {
      this._saveCallback(state.selectedColor, state.selectedOpacity);
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
   * Set the current color and opacity
   *
   * @param color - Hex color
   * @param opacity - Opacity (0-100)
   */
  public setColor(color: string, opacity: number): void {
    this._state.set({
      selectedColor: color,
      selectedOpacity: opacity,
      customColor: color,
    });
  }

  /**
   * Get the current selected color
   */
  public getColor(): string {
    return this._state.getProperty('selectedColor');
  }

  /**
   * Get the current opacity
   */
  public getOpacity(): number {
    return this._state.getProperty('selectedOpacity');
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

        if (state.selectedColor.toUpperCase() === color.toUpperCase()) {
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

    // Plus icon
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

    // Color area
    const colorArea = this._createColorArea();
    panel.appendChild(colorArea);

    // Hue slider
    const hueSlider = this._createHueSlider();
    panel.appendChild(hueSlider);

    // Preview and input row
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

    // Selection indicator
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

    // Color preview
    const preview = document.createElement('div');
    preview.style.width = '24px';
    preview.style.height = '24px';
    preview.style.backgroundColor = state.customColor;
    preview.style.border = '1px solid #e0e3e7';
    preview.style.borderRadius = '4px';
    preview.style.flexShrink = '0';
    preview.id = 'custom-color-preview';

    // Hex input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = state.customColor;
    input.className = this._cls('input');
    input.style.flex = '1';
    input.style.fontFamily = 'monospace';

    this._eventManager.addEventListener(input, 'input', () => {
      const value = input.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        this._state.set({ customColor: value });
      }
    });

    // OK button
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

    // Label
    const label = document.createElement('label');
    label.className = this._cls('opacity-label');
    label.textContent = 'Opacity';
    section.appendChild(label);

    // Slider row
    const row = document.createElement('div');
    row.className = this._cls('opacity-row');

    // Slider container with gradient background
    const sliderContainer = document.createElement('div');
    sliderContainer.className = this._cls('opacity-slider-container');

    // Gradient overlay
    this._opacityGradient = document.createElement('div');
    this._opacityGradient.style.position = 'absolute';
    this._opacityGradient.style.top = '0';
    this._opacityGradient.style.left = '0';
    this._opacityGradient.style.right = '0';
    this._opacityGradient.style.bottom = '0';
    this._opacityGradient.style.background = `linear-gradient(90deg, transparent 0%, ${state.selectedColor} 100%)`;
    sliderContainer.appendChild(this._opacityGradient);

    // Slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = String(state.selectedOpacity);
    slider.className = this._cls('opacity-slider');

    this._eventManager.addEventListener(slider, 'input', () => {
      this._handleOpacityChange(parseInt(slider.value, 10));
    });

    sliderContainer.appendChild(slider);
    row.appendChild(sliderContainer);

    // Value display
    this._opacityValueInput = document.createElement('input');
    this._opacityValueInput.type = 'text';
    this._opacityValueInput.value = `${state.selectedOpacity}%`;
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

  // ============================================================================
  // Private: Event Handlers
  // ============================================================================

  /**
   * Handle color selection from palette
   */
  private _handleColorSelect(color: string): void {
    this._state.set({ selectedColor: color });
  }

  /**
   * Handle click on color area
   */
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

  /**
   * Handle hue slider change
   */
  private _handleHueChange(hue: number): void {
    const state = this._state.get();
    const newColor = this._hslToHex(hue, state.customSaturation, state.customLightness);

    this._state.set({
      customHue: hue,
      customColor: newColor,
    });
  }

  /**
   * Handle custom color selection
   */
  private _handleCustomColorSelect(): void {
    const customColor = this._state.getProperty('customColor');
    this._state.set({
      selectedColor: customColor,
      showCustomPicker: false,
    });
  }

  /**
   * Handle opacity change
   */
  private _handleOpacityChange(opacity: number): void {
    this._state.set({ selectedOpacity: opacity });
  }

  // ============================================================================
  // Private: UI Updates
  // ============================================================================

  /**
   * Update UI when state changes
   */
  private _updateUI(): void {
    const state = this._state.get();

    // Update color grid selection
    this._updateColorGridSelection(state.selectedColor);

    // Update custom picker visibility
    if (this._customPickerPanel) {
      this._customPickerPanel.style.display = state.showCustomPicker ? 'block' : 'none';
    }

    // Update color area indicator
    if (this._colorAreaIndicator) {
      this._colorAreaIndicator.style.left = `${state.customSaturation}%`;
      this._colorAreaIndicator.style.top = `${100 - state.customLightness}%`;
    }

    // Update color area background (hue)
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
      this._opacityGradient.style.background = `linear-gradient(90deg, transparent 0%, ${state.selectedColor} 100%)`;
    }

    // Update opacity value display
    if (this._opacityValueInput) {
      this._opacityValueInput.value = `${state.selectedOpacity}%`;
    }
  }

  /**
   * Update color grid selection highlight
   */
  private _updateColorGridSelection(selectedColor: string): void {
    if (!this._colorGridContainer) return;

    const buttons = this._colorGridContainer.querySelectorAll(`.${this._cls('color-btn')}`);
    buttons.forEach((btn) => {
      const button = btn as HTMLElement;
      const btnColor = button.style.backgroundColor;
      // Convert rgb to hex for comparison
      const isSelected = this._colorsMatch(btnColor, selectedColor);
      button.classList.toggle('selected', isSelected);
    });
  }

  // ============================================================================
  // Private: Color Utilities
  // ============================================================================

  /**
   * Convert HSL to Hex
   */
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

  /**
   * Check if two colors match (handles rgb vs hex)
   */
  private _colorsMatch(color1: string, color2: string): boolean {
    const normalize = (c: string) => {
      // If it's rgb format, convert to hex
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

// Re-export color palette for external use
export { COLOR_PALETTE };
