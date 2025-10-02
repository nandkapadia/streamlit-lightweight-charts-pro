/**
 * @fileoverview Series configuration management service with schema definitions.
 *
 * This module provides dynamic configuration schema generation for different
 * series types, persistent storage interfaces, and form field definitions
 * for building configuration dialogs and persistent series settings.
 */

import { SeriesConfiguration, SeriesType } from '../types/SeriesTypes';
import { logger } from '../utils/logger';

/**
 * Configuration field definition for dynamic form generation
 */
export interface ConfigField {
  id: string;
  label: string;
  type: 'color' | 'number' | 'range' | 'checkbox' | 'select' | 'opacity';
  category: 'inputs' | 'style' | 'visibility';
  defaultValue: any;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  group?: string;
  icon?: string;
}

/**
 * Series configuration schema that defines available fields for each series type
 */
export interface SeriesConfigSchema {
  seriesType: SeriesType;
  displayName: string;
  fields: ConfigField[];
}

/**
 * Persistent storage interface for series configurations
 */
export interface ConfigStorage {
  get: (_key: string) => SeriesConfiguration | null;
  set: (_key: string, _config: SeriesConfiguration) => void;
  remove: (_key: string) => void;
  clear: () => void;
}

/**
 * Event handler for configuration changes
 */
export type ConfigChangeHandler = (
  _seriesId: string,
  _seriesType: SeriesType,
  _config: SeriesConfiguration
) => void;

/**
 * SeriesConfigurationService - Centralized service for managing series configurations
 *
 * This service provides:
 * - Dynamic configuration schema registration for different series types
 * - Persistent storage of user configurations
 * - Event-driven configuration updates
 * - Plugin-like architecture for series-specific settings
 * - Validation and default value management
 *
 * Example usage:
 * ```typescript
 * const configService = new SeriesConfigurationService()
 *
 * // Register a series configuration schema
 * configService.registerSeriesSchema(supertrendSchema)
 *
 * // Get configuration for a series
 * const config = configService.getSeriesConfig('series-1', 'supertrend')
 *
 * // Update configuration
 * configService.updateSeriesConfig('series-1', 'supertrend', { period: 14 })
 * ```
 */
export class SeriesConfigurationService {
  private schemas: Map<SeriesType, SeriesConfigSchema> = new Map();
  private configurations: Map<string, SeriesConfiguration> = new Map();
  private changeHandlers: ConfigChangeHandler[] = [];
  private storage: ConfigStorage;

  constructor(storage?: ConfigStorage) {
    this.storage = storage || new LocalStorageAdapter();
    this.initializeDefaultSchemas();
    this.loadPersistedConfigurations();
  }

  /**
   * Register a configuration schema for a series type
   */
  public registerSeriesSchema(schema: SeriesConfigSchema): void {
    this.schemas.set(schema.seriesType, schema);
  }

  /**
   * Get configuration schema for a series type
   */
  public getSeriesSchema(seriesType: SeriesType): SeriesConfigSchema | null {
    return this.schemas.get(seriesType) || null;
  }

  /**
   * Get all registered schemas
   */
  public getAllSchemas(): SeriesConfigSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Get configuration for a specific series
   */
  public getSeriesConfig(seriesId: string, seriesType: SeriesType): SeriesConfiguration {
    const key = this.getConfigKey(seriesId, seriesType);
    let config = this.configurations.get(key);

    if (!config) {
      // Create default configuration based on schema
      config = this.createDefaultConfiguration(seriesType);
      this.configurations.set(key, config);
    }

    return { ...config }; // Return copy to prevent external mutations
  }

  /**
   * Update configuration for a specific series
   */
  public updateSeriesConfig(
    seriesId: string,
    seriesType: SeriesType,
    updates: Partial<SeriesConfiguration>
  ): void {
    const key = this.getConfigKey(seriesId, seriesType);
    const currentConfig = this.getSeriesConfig(seriesId, seriesType);
    const newConfig = { ...currentConfig, ...updates };

    // Validate configuration
    const validatedConfig = this.validateConfiguration(seriesType, newConfig);

    // Update in memory
    this.configurations.set(key, validatedConfig);

    // Persist to storage
    this.storage.set(key, validatedConfig);

    // Notify handlers
    this.notifyConfigChange(seriesId, seriesType, validatedConfig);
  }

  /**
   * Reset configuration to defaults
   */
  public resetSeriesConfig(seriesId: string, seriesType: SeriesType): void {
    const defaultConfig = this.createDefaultConfiguration(seriesType);
    this.updateSeriesConfig(seriesId, seriesType, defaultConfig);
  }

  /**
   * Remove configuration for a series
   */
  public removeSeriesConfig(seriesId: string, seriesType: SeriesType): void {
    const key = this.getConfigKey(seriesId, seriesType);
    this.configurations.delete(key);
    this.storage.remove(key);
  }

  /**
   * Subscribe to configuration changes
   */
  public onConfigChange(handler: ConfigChangeHandler): () => void {
    this.changeHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.changeHandlers.indexOf(handler);
      if (index > -1) {
        this.changeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get configuration fields for a specific category
   */
  public getConfigFields(
    seriesType: SeriesType,
    category: 'inputs' | 'style' | 'visibility'
  ): ConfigField[] {
    const schema = this.getSeriesSchema(seriesType);
    if (!schema) return [];

    return schema.fields.filter(field => field.category === category);
  }

  /**
   * Create configuration dialog manager
   */
  public createDialogManager(): SeriesConfigDialogManager {
    return new SeriesConfigDialogManager(this);
  }

  /**
   * Export all configurations
   */
  public exportConfigurations(): Record<string, SeriesConfiguration> {
    const exported: Record<string, SeriesConfiguration> = {};
    this.configurations.forEach((config, key) => {
      exported[key] = { ...config };
    });
    return exported;
  }

  /**
   * Import configurations
   */
  public importConfigurations(configurations: Record<string, SeriesConfiguration>): void {
    Object.entries(configurations).forEach(([key, config]) => {
      this.configurations.set(key, config);
      this.storage.set(key, config);
    });
  }

  /**
   * Create default configuration based on schema
   */
  private createDefaultConfiguration(seriesType: SeriesType): SeriesConfiguration {
    const schema = this.getSeriesSchema(seriesType);
    if (!schema) {
      return this.getBaseDefaultConfiguration();
    }

    const config: SeriesConfiguration = {};
    schema.fields.forEach(field => {
      this.setNestedValue(config, field.id, field.defaultValue);
    });

    return config;
  }

  /**
   * Validate configuration against schema
   */
  private validateConfiguration(
    seriesType: SeriesType,
    config: SeriesConfiguration
  ): SeriesConfiguration {
    const schema = this.getSeriesSchema(seriesType);
    if (!schema) return config;

    const validatedConfig = { ...config };

    schema.fields.forEach(field => {
      const value = this.getNestedValue(validatedConfig, field.id);
      if (value !== undefined) {
        const validatedValue = this.validateFieldValue(field, value);
        this.setNestedValue(validatedConfig, field.id, validatedValue);
      }
    });

    return validatedConfig;
  }

  /**
   * Validate individual field value
   */
  private validateFieldValue(field: ConfigField, value: any): any {
    switch (field.type) {
      case 'number':
      case 'range': {
        const numValue = Number(value);
        if (field.min !== undefined && numValue < field.min) return field.min;
        if (field.max !== undefined && numValue > field.max) return field.max;
        return numValue;
      }

      case 'checkbox':
        return Boolean(value);

      case 'select':
        if (field.options && !field.options.some(opt => opt.value === value)) {
          return field.defaultValue;
        }
        return value;

      case 'color':
        // Basic color validation
        if (typeof value === 'string' && value.match(/^#[0-9A-Fa-f]{6}$/)) {
          return value;
        }
        return field.defaultValue;

      case 'opacity': {
        const opacityValue = Number(value);
        return Math.max(0, Math.min(100, opacityValue));
      }

      default:
        return value;
    }
  }

  /**
   * Initialize default schemas for common series types
   */
  private initializeDefaultSchemas(): void {
    // Supertrend schema
    this.registerSeriesSchema({
      seriesType: 'supertrend',
      displayName: 'Supertrend',
      fields: [
        // Inputs
        {
          id: 'period',
          label: 'Period',
          type: 'number',
          category: 'inputs',
          defaultValue: 10,
          min: 1,
          max: 100,
        },
        {
          id: 'multiplier',
          label: 'Multiplier',
          type: 'number',
          category: 'inputs',
          defaultValue: 3,
          min: 0.1,
          max: 10,
          step: 0.1,
        },
        // Style
        {
          id: 'upTrend.visible',
          label: 'Up Trend',
          type: 'checkbox',
          category: 'style',
          defaultValue: true,
          group: 'upTrend',
          icon: '📈',
        },
        {
          id: 'upTrend.color',
          label: 'Up Trend Color',
          type: 'color',
          category: 'style',
          defaultValue: '#4CAF50',
          group: 'upTrend',
        },
        {
          id: 'downTrend.visible',
          label: 'Down Trend',
          type: 'checkbox',
          category: 'style',
          defaultValue: true,
          group: 'downTrend',
          icon: '📉',
        },
        {
          id: 'downTrend.color',
          label: 'Down Trend Color',
          type: 'color',
          category: 'style',
          defaultValue: '#F44336',
          group: 'downTrend',
        },
        // Visibility
        {
          id: 'labelsOnPriceScale',
          label: 'Labels on price scale',
          type: 'checkbox',
          category: 'visibility',
          defaultValue: true,
        },
        {
          id: 'valuesInStatusLine',
          label: 'Values in status line',
          type: 'checkbox',
          category: 'visibility',
          defaultValue: true,
        },
      ],
    });

    // Bollinger Bands schema
    this.registerSeriesSchema({
      seriesType: 'bollinger_bands',
      displayName: 'Bollinger Bands',
      fields: [
        // Inputs
        {
          id: 'length',
          label: 'Length',
          type: 'number',
          category: 'inputs',
          defaultValue: 20,
          min: 1,
          max: 100,
        },
        {
          id: 'stdDev',
          label: 'StdDev',
          type: 'number',
          category: 'inputs',
          defaultValue: 2,
          min: 0.1,
          max: 5,
          step: 0.1,
        },
        // Style
        {
          id: 'upperLine.visible',
          label: 'Upper Line',
          type: 'checkbox',
          category: 'style',
          defaultValue: true,
          group: 'upperLine',
        },
        {
          id: 'upperLine.color',
          label: 'Upper Line Color',
          type: 'color',
          category: 'style',
          defaultValue: '#2196F3',
          group: 'upperLine',
        },
        {
          id: 'lowerLine.visible',
          label: 'Lower Line',
          type: 'checkbox',
          category: 'style',
          defaultValue: true,
          group: 'lowerLine',
        },
        {
          id: 'lowerLine.color',
          label: 'Lower Line Color',
          type: 'color',
          category: 'style',
          defaultValue: '#2196F3',
          group: 'lowerLine',
        },
        {
          id: 'fill.visible',
          label: 'Fill',
          type: 'checkbox',
          category: 'style',
          defaultValue: true,
          group: 'fill',
        },
        {
          id: 'fill.color',
          label: 'Fill Color',
          type: 'color',
          category: 'style',
          defaultValue: '#2196F3',
          group: 'fill',
        },
        {
          id: 'fill.opacity',
          label: 'Fill Opacity',
          type: 'opacity',
          category: 'style',
          defaultValue: 10,
          group: 'fill',
        },
      ],
    });
  }

  /**
   * Load persisted configurations from storage
   */
  private loadPersistedConfigurations(): void {
    // This would typically scan storage for saved configurations
    // For now, we'll leave this as a placeholder
  }

  /**
   * Get base default configuration for all series types
   */
  private getBaseDefaultConfiguration(): SeriesConfiguration {
    return {
      color: '#2196F3',
      opacity: 100,
      lineWidth: 1,
      lastPriceVisible: true,
      priceLineVisible: true,
      labelsOnPriceScale: true,
      valuesInStatusLine: true,
    };
  }

  /**
   * Generate storage key for a series configuration
   */
  private getConfigKey(seriesId: string, seriesType: SeriesType): string {
    return `series_config_${seriesId}_${seriesType}`;
  }

  /**
   * Notify all change handlers
   */
  private notifyConfigChange(
    seriesId: string,
    seriesType: SeriesType,
    config: SeriesConfiguration
  ): void {
    this.changeHandlers.forEach(handler => {
      try {
        handler(seriesId, seriesType, config);
      } catch (error) {
        logger.error('Series configuration handler failed', 'SeriesConfigurationService', error);
      }
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) {
      return;
    }
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

/**
 * LocalStorage adapter for configuration persistence
 */
class LocalStorageAdapter implements ConfigStorage {
  private prefix = 'series_config_';

  get(key: string): SeriesConfiguration | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set(key: string, config: SeriesConfiguration): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(config));
    } catch (error) {
      logger.error('Series configuration operation failed', 'SeriesConfigurationService', error);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      logger.error('Series configuration operation failed', 'SeriesConfigurationService', error);
    }
  }

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.error('Series configuration operation failed', 'SeriesConfigurationService', error);
    }
  }
}

/**
 * Dialog manager for series configuration
 */
export class SeriesConfigDialogManager {
  private configService: SeriesConfigurationService;
  private currentDialog: HTMLElement | null = null;

  constructor(configService: SeriesConfigurationService) {
    this.configService = configService;
  }

  /**
   * Open configuration dialog for a series
   */
  public openDialog(seriesId: string, seriesType: SeriesType, anchor: HTMLElement): void {
    this.closeDialog(); // Close any existing dialog

    this.currentDialog = this.createDialog(seriesId, seriesType);
    this.positionDialog(this.currentDialog, anchor);
    document.body.appendChild(this.currentDialog);

    // Add global click handler to close dialog when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 0);
  }

  /**
   * Close configuration dialog
   */
  public closeDialog(): void {
    if (this.currentDialog) {
      document.removeEventListener('click', this.handleOutsideClick);
      this.currentDialog.remove();
      this.currentDialog = null;
    }
  }

  /**
   * Create configuration dialog element
   */
  private createDialog(seriesId: string, seriesType: SeriesType): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = 'series-config-dialog-service';
    dialog.innerHTML = this.generateDialogHTML(seriesId, seriesType);

    // Apply styling
    this.applyDialogStyling(dialog);

    // Attach event listeners
    this.attachDialogEventListeners(dialog, seriesId, seriesType);

    return dialog;
  }

  /**
   * Generate HTML content for dialog
   */
  private generateDialogHTML(seriesId: string, seriesType: SeriesType): string {
    const schema = this.configService.getSeriesSchema(seriesType);
    if (!schema) return '<div>No configuration available</div>';

    const config = this.configService.getSeriesConfig(seriesId, seriesType);

    return `
      <div class="dialog-header">
        <h3>${schema.displayName}</h3>
        <button class="close-button">×</button>
      </div>
      <div class="dialog-tabs">
        <button class="tab-button active" data-tab="style">Style</button>
        <button class="tab-button" data-tab="inputs">Inputs</button>
        <button class="tab-button" data-tab="visibility">Visibility</button>
      </div>
      <div class="dialog-content">
        ${this.generateTabContent('style', schema, config)}
        ${this.generateTabContent('inputs', schema, config)}
        ${this.generateTabContent('visibility', schema, config)}
      </div>
      <div class="dialog-footer">
        <button class="defaults-button">Defaults</button>
        <div class="action-buttons">
          <button class="cancel-button">Cancel</button>
          <button class="ok-button">Ok</button>
        </div>
      </div>
    `;
  }

  /**
   * Generate content for a specific tab
   */
  private generateTabContent(
    category: 'inputs' | 'style' | 'visibility',
    schema: SeriesConfigSchema,
    config: SeriesConfiguration
  ): string {
    const fields = schema.fields.filter(field => field.category === category);
    const isActive = category === 'style' ? 'active' : '';

    let html = `<div class="tab-content ${isActive}" data-tab="${category}">`;

    if (fields.length === 0) {
      html += `<p>No ${category} options available.</p>`;
    } else {
      // Group fields by group property
      const groups = this.groupFields(fields);

      Object.entries(groups).forEach(([groupName, groupFields]) => {
        if (groupName !== 'default') {
          html += `<div class="field-group"><h4>${groupName}</h4>`;
        }

        groupFields.forEach(field => {
          html += this.generateFieldHTML(field, config);
        });

        if (groupName !== 'default') {
          html += '</div>';
        }
      });
    }

    html += '</div>';
    return html;
  }

  /**
   * Group fields by their group property
   */
  private groupFields(fields: ConfigField[]): Record<string, ConfigField[]> {
    const groups: Record<string, ConfigField[]> = { default: [] };

    fields.forEach(field => {
      const groupName = field.group || 'default';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(field);
    });

    return groups;
  }

  /**
   * Generate HTML for a specific field
   */
  private generateFieldHTML(field: ConfigField, config: SeriesConfiguration): string {
    const value = this.getNestedValue(config, field.id) ?? field.defaultValue;

    switch (field.type) {
      case 'checkbox':
        return `
          <div class="field-row">
            <input type="checkbox" id="${field.id}" ${value ? 'checked' : ''}>
            <label for="${field.id}">${field.label}</label>
            ${field.icon ? `<span class="field-icon">${field.icon}</span>` : ''}
          </div>
        `;

      case 'color':
        return `
          <div class="field-row">
            <label for="${field.id}">${field.label}:</label>
            <input type="color" id="${field.id}" value="${value}">
          </div>
        `;

      case 'number':
        return `
          <div class="field-row">
            <label for="${field.id}">${field.label}:</label>
            <input type="number" id="${field.id}" value="${value}"
                   min="${field.min || ''}" max="${field.max || ''}" step="${field.step || ''}">
          </div>
        `;

      case 'range':
        return `
          <div class="field-row">
            <label for="${field.id}">${field.label}:</label>
            <input type="range" id="${field.id}" value="${value}"
                   min="${field.min || 0}" max="${field.max || 100}" step="${field.step || 1}">
            <span class="range-value">${value}</span>
          </div>
        `;

      case 'opacity':
        return `
          <div class="field-row">
            <label for="${field.id}">${field.label}:</label>
            <input type="range" id="${field.id}" value="${value}" min="0" max="100" step="1">
            <span class="range-value">${value}%</span>
          </div>
        `;

      case 'select': {
        const options = field.options || [];
        const optionsHTML = options
          .map(
            opt =>
              `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
          )
          .join('');
        return `
          <div class="field-row">
            <label for="${field.id}">${field.label}:</label>
            <select id="${field.id}">${optionsHTML}</select>
          </div>
        `;
      }

      default:
        return `
          <div class="field-row">
            <label for="${field.id}">${field.label}:</label>
            <input type="text" id="${field.id}" value="${value}">
          </div>
        `;
    }
  }

  /**
   * Attach event listeners to dialog
   */
  private attachDialogEventListeners(
    dialog: HTMLElement,
    seriesId: string,
    seriesType: SeriesType
  ): void {
    // Tab switching
    const tabButtons = dialog.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const tabName = target.dataset.tab;
        if (tabName) {
          this.switchTab(dialog, tabName);
        }
      });
    });

    // Field changes
    const inputs = dialog.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.handleFieldChange(dialog, seriesId, seriesType);
      });
    });

    // Action buttons
    const closeButton = dialog.querySelector('.close-button');
    const cancelButton = dialog.querySelector('.cancel-button');
    const okButton = dialog.querySelector('.ok-button');
    const defaultsButton = dialog.querySelector('.defaults-button');

    closeButton?.addEventListener('click', () => this.closeDialog());
    cancelButton?.addEventListener('click', () => this.closeDialog());
    okButton?.addEventListener('click', () => this.closeDialog());
    defaultsButton?.addEventListener('click', () => {
      this.configService.resetSeriesConfig(seriesId, seriesType);
      this.closeDialog();
      // Reopen with default values
      setTimeout(() => {
        const anchorElement = document.querySelector('.series-config-button') as HTMLElement;
        if (anchorElement) {
          this.openDialog(seriesId, seriesType, anchorElement);
        }
      }, 100);
    });
  }

  /**
   * Switch active tab
   */
  private switchTab(dialog: HTMLElement, tabName: string): void {
    // Update tab buttons
    const tabButtons = dialog.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.toggle('active', (button as HTMLElement).dataset.tab === tabName);
    });

    // Update tab content
    const tabContents = dialog.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.toggle('active', (content as HTMLElement).dataset.tab === tabName);
    });
  }

  /**
   * Handle field value changes
   */
  private handleFieldChange(dialog: HTMLElement, seriesId: string, seriesType: SeriesType): void {
    const updates: Partial<SeriesConfiguration> = {};

    const inputs = dialog.querySelectorAll('input, select');
    inputs.forEach(input => {
      const element = input as HTMLInputElement | HTMLSelectElement;
      const fieldId = element.id;
      let value: any;

      if (element.type === 'checkbox') {
        value = (element as HTMLInputElement).checked;
      } else if (element.type === 'number' || element.type === 'range') {
        value = Number(element.value);
      } else {
        value = element.value;
      }

      this.setNestedValue(updates, fieldId, value);

      // Update range value displays
      if (element.type === 'range') {
        const valueDisplay = dialog.querySelector(`[for="${fieldId}"] + * + .range-value`);
        if (valueDisplay) {
          valueDisplay.textContent = fieldId.includes('opacity') ? `${value}%` : String(value);
        }
      }
    });

    // Update configuration
    this.configService.updateSeriesConfig(seriesId, seriesType, updates);
  }

  /**
   * Apply dialog styling
   */
  private applyDialogStyling(dialog: HTMLElement): void {
    const style = dialog.style;
    style.position = 'fixed';
    style.backgroundColor = 'white';
    style.border = '1px solid #ddd';
    style.borderRadius = '8px';
    style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    style.width = '400px';
    style.maxHeight = '600px';
    style.overflowY = 'auto';
    style.zIndex = '10000';
  }

  /**
   * Position dialog relative to anchor element
   */
  private positionDialog(dialog: HTMLElement, anchor: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    const style = dialog.style;

    // Position below anchor
    style.top = `${rect.bottom + 8}px`;
    style.left = `${rect.left}px`;

    // Adjust if dialog would go off screen
    setTimeout(() => {
      const dialogRect = dialog.getBoundingClientRect();
      if (dialogRect.right > window.innerWidth) {
        style.left = `${window.innerWidth - dialogRect.width - 8}px`;
      }
      if (dialogRect.bottom > window.innerHeight) {
        style.top = `${rect.top - dialogRect.height - 8}px`;
      }
    }, 0);
  }

  /**
   * Handle clicks outside dialog
   */
  private handleOutsideClick = (event: MouseEvent): void => {
    if (this.currentDialog && !this.currentDialog.contains(event.target as Node)) {
      this.closeDialog();
    }
  };

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) {
      return;
    }
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
