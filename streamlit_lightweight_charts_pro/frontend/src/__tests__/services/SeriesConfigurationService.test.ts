/**
 * @fileoverview Tests for Series Configuration Service
 *
 * Tests cover:
 * - Schema registration and retrieval
 * - Configuration management (get, update, reset, remove)
 * - Configuration validation
 * - Change event handling
 * - Import/export functionality
 * - Storage integration
 * - Nested value operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SeriesConfigurationService,
  ConfigStorage,
  ConfigField,
  SeriesConfigSchema,
} from '../../services/SeriesConfigurationService';
import { SeriesConfiguration, SeriesType } from '../../types/SeriesTypes';

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

global.localStorage = mockLocalStorage as any;

describe('SeriesConfigurationService', () => {
  let service: SeriesConfigurationService;
  let mockStorage: ConfigStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();

    // Create mock storage
    mockStorage = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };
  });

  describe('Constructor', () => {
    it('should create service with default storage', () => {
      service = new SeriesConfigurationService();

      expect(service).toBeDefined();
    });

    it('should create service with custom storage', () => {
      service = new SeriesConfigurationService(mockStorage);

      expect(service).toBeDefined();
    });

    it('should initialize default schemas', () => {
      service = new SeriesConfigurationService(mockStorage);

      const supertrendSchema = service.getSeriesSchema('supertrend');
      const bollingerSchema = service.getSeriesSchema('bollinger_bands');

      expect(supertrendSchema).toBeDefined();
      expect(bollingerSchema).toBeDefined();
    });
  });

  describe('Schema Management', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should register custom schema', () => {
      const customSchema: SeriesConfigSchema = {
        seriesType: 'rsi',
        displayName: 'RSI',
        fields: [
          {
            id: 'period',
            label: 'Period',
            type: 'number',
            category: 'inputs',
            defaultValue: 14,
            min: 1,
            max: 100,
          },
        ],
      };

      service.registerSeriesSchema(customSchema);

      const retrieved = service.getSeriesSchema('rsi');
      expect(retrieved).toEqual(customSchema);
    });

    it('should return null for non-existent schema', () => {
      const schema = service.getSeriesSchema('non_existent' as SeriesType);

      expect(schema).toBeNull();
    });

    it('should get all registered schemas', () => {
      const allSchemas = service.getAllSchemas();

      expect(allSchemas).toBeInstanceOf(Array);
      expect(allSchemas.length).toBeGreaterThan(0);
      expect(allSchemas.some(s => s.seriesType === 'supertrend')).toBe(true);
      expect(allSchemas.some(s => s.seriesType === 'bollinger_bands')).toBe(true);
    });

    it('should overwrite schema when registering same type', () => {
      const schema1: SeriesConfigSchema = {
        seriesType: 'custom',
        displayName: 'Custom 1',
        fields: [],
      };

      const schema2: SeriesConfigSchema = {
        seriesType: 'custom',
        displayName: 'Custom 2',
        fields: [],
      };

      service.registerSeriesSchema(schema1);
      service.registerSeriesSchema(schema2);

      const retrieved = service.getSeriesSchema('custom');
      expect(retrieved?.displayName).toBe('Custom 2');
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should get default configuration for new series', () => {
      const config = service.getSeriesConfig('series-1', 'supertrend');

      expect(config).toBeDefined();
      expect(config.period).toBe(10);
      expect(config.multiplier).toBe(3);
    });

    it('should return copy of configuration to prevent mutation', () => {
      const config1 = service.getSeriesConfig('series-1', 'supertrend');
      const config2 = service.getSeriesConfig('series-1', 'supertrend');

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // Same values
    });

    it('should update configuration', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.period).toBe(20);
    });

    it('should persist configuration to storage on update', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });

      expect(mockStorage.set).toHaveBeenCalled();
    });

    it('should reset configuration to defaults', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 50 });
      service.resetSeriesConfig('series-1', 'supertrend');

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.period).toBe(10); // Default value
    });

    it('should remove configuration', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });
      service.removeSeriesConfig('series-1', 'supertrend');

      expect(mockStorage.remove).toHaveBeenCalled();

      // Getting config after removal should return defaults
      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.period).toBe(10);
    });

    it('should handle nested configuration updates', () => {
      service.updateSeriesConfig('series-1', 'supertrend', {
        upTrend: { color: '#00FF00' },
      } as any);

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.upTrend?.color).toBe('#00FF00');
    });

    it('should maintain separate configurations for different series', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 10 });
      service.updateSeriesConfig('series-2', 'supertrend', { period: 20 });

      const config1 = service.getSeriesConfig('series-1', 'supertrend');
      const config2 = service.getSeriesConfig('series-2', 'supertrend');

      expect(config1.period).toBe(10);
      expect(config2.period).toBe(20);
    });

    it('should maintain separate configurations for different series types', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 10 });
      service.updateSeriesConfig('series-1', 'bollinger_bands', { length: 30 });

      const supertrendConfig = service.getSeriesConfig('series-1', 'supertrend');
      const bollingerConfig = service.getSeriesConfig('series-1', 'bollinger_bands');

      expect(supertrendConfig.period).toBe(10);
      expect(bollingerConfig.length).toBe(30);
    });
  });

  describe('Field Validation', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should validate number fields with min/max constraints', () => {
      // Supertrend period has min: 1, max: 100
      service.updateSeriesConfig('series-1', 'supertrend', { period: 200 });

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.period).toBe(100); // Clamped to max
    });

    it('should clamp number below minimum', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: -5 });

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.period).toBe(1); // Clamped to min
    });

    it('should validate boolean fields', () => {
      service.updateSeriesConfig('series-1', 'supertrend', {
        'upTrend.visible': 'not a boolean' as any,
      });

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(typeof config.upTrend?.visible).toBe('boolean');
    });

    it('should validate color format', () => {
      service.updateSeriesConfig('series-1', 'supertrend', {
        'upTrend.color': 'invalid-color',
      });

      const config = service.getSeriesConfig('series-1', 'supertrend');
      // Should fall back to default color
      expect(config.upTrend?.color).toBe('#4CAF50');
    });

    it('should accept valid hex colors', () => {
      service.updateSeriesConfig('series-1', 'supertrend', {
        upTrend: { color: '#FF0000' },
      } as any);

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.upTrend?.color).toBe('#FF0000');
    });

    it('should validate opacity range (0-100)', () => {
      service.updateSeriesConfig('series-1', 'bollinger_bands', {
        fill: { opacity: 150 },
      } as any);

      const config = service.getSeriesConfig('series-1', 'bollinger_bands');
      expect(config.fill?.opacity).toBe(100); // Clamped to max
    });

    it('should clamp opacity below zero', () => {
      service.updateSeriesConfig('series-1', 'bollinger_bands', {
        fill: { opacity: -10 },
      } as any);

      const config = service.getSeriesConfig('series-1', 'bollinger_bands');
      expect(config.fill?.opacity).toBe(0); // Clamped to min
    });
  });

  describe('Change Event Handling', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should notify handlers on configuration change', () => {
      const handler = vi.fn();
      service.onConfigChange(handler);

      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });

      expect(handler).toHaveBeenCalledWith(
        'series-1',
        'supertrend',
        expect.objectContaining({ period: 20 })
      );
    });

    it('should support multiple handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      service.onConfigChange(handler1);
      service.onConfigChange(handler2);

      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should unsubscribe handler', () => {
      const handler = vi.fn();
      const unsubscribe = service.onConfigChange(handler);

      unsubscribe();

      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle handler errors gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();

      service.onConfigChange(errorHandler);
      service.onConfigChange(goodHandler);

      // Should not throw despite error handler
      expect(() => {
        service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });
      }).not.toThrow();

      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
    });

    it('should allow handler to be unsubscribed multiple times safely', () => {
      const handler = vi.fn();
      const unsubscribe = service.onConfigChange(handler);

      unsubscribe();
      unsubscribe(); // Second call should not throw

      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Fields', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should get fields by category', () => {
      const inputFields = service.getConfigFields('supertrend', 'inputs');

      expect(inputFields.length).toBeGreaterThan(0);
      expect(inputFields.every(f => f.category === 'inputs')).toBe(true);
    });

    it('should get style fields', () => {
      const styleFields = service.getConfigFields('supertrend', 'style');

      expect(styleFields.length).toBeGreaterThan(0);
      expect(styleFields.every(f => f.category === 'style')).toBe(true);
    });

    it('should get visibility fields', () => {
      const visibilityFields = service.getConfigFields('supertrend', 'visibility');

      expect(visibilityFields.length).toBeGreaterThan(0);
      expect(visibilityFields.every(f => f.category === 'visibility')).toBe(true);
    });

    it('should return empty array for non-existent series type', () => {
      const fields = service.getConfigFields('non_existent' as SeriesType, 'inputs');

      expect(fields).toEqual([]);
    });
  });

  describe('Import/Export', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should export configurations', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });
      service.updateSeriesConfig('series-2', 'bollinger_bands', { length: 30 });

      const exported = service.exportConfigurations();

      expect(Object.keys(exported).length).toBeGreaterThan(0);
      expect(exported).toHaveProperty('series_config_series-1_supertrend');
      expect(exported).toHaveProperty('series_config_series-2_bollinger_bands');
    });

    it('should export copies of configurations', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });

      const exported = service.exportConfigurations();
      const configKey = 'series_config_series-1_supertrend';

      // Mutate exported config
      if (exported[configKey]) {
        exported[configKey].period = 99;
      }

      // Original should not be affected
      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.period).toBe(20);
    });

    it('should import configurations', () => {
      const configurations: Record<string, SeriesConfiguration> = {
        'series_config_series-1_supertrend': { period: 15, multiplier: 2.5 },
        'series_config_series-2_bollinger_bands': { length: 25, stdDev: 2.5 },
      };

      service.importConfigurations(configurations);

      const config1 = service.getSeriesConfig('series-1', 'supertrend');
      const config2 = service.getSeriesConfig('series-2', 'bollinger_bands');

      expect(config1.period).toBe(15);
      expect(config2.length).toBe(25);
    });

    it('should persist imported configurations to storage', () => {
      const configurations: Record<string, SeriesConfiguration> = {
        'series_config_series-1_supertrend': { period: 15 },
      };

      service.importConfigurations(configurations);

      expect(mockStorage.set).toHaveBeenCalledWith(
        'series_config_series-1_supertrend',
        expect.objectContaining({ period: 15 })
      );
    });

    it('should export and import round-trip successfully', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 25, multiplier: 4 });
      service.updateSeriesConfig('series-2', 'bollinger_bands', { length: 15, stdDev: 1.5 });

      const exported = service.exportConfigurations();

      // Create new service and import
      const newService = new SeriesConfigurationService(mockStorage);
      newService.importConfigurations(exported);

      const config1 = newService.getSeriesConfig('series-1', 'supertrend');
      const config2 = newService.getSeriesConfig('series-2', 'bollinger_bands');

      expect(config1.period).toBe(25);
      expect(config1.multiplier).toBe(4);
      expect(config2.length).toBe(15);
      expect(config2.stdDev).toBe(1.5);
    });
  });

  describe('Dialog Manager', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should create dialog manager', () => {
      const dialogManager = service.createDialogManager();

      expect(dialogManager).toBeDefined();
    });
  });

  describe('Default Schemas', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should have supertrend schema with correct fields', () => {
      const schema = service.getSeriesSchema('supertrend');

      expect(schema).toBeDefined();
      expect(schema?.displayName).toBe('Supertrend');
      expect(schema?.fields).toBeDefined();

      const periodField = schema?.fields.find(f => f.id === 'period');
      expect(periodField).toBeDefined();
      expect(periodField?.type).toBe('number');
      expect(periodField?.defaultValue).toBe(10);
    });

    it('should have bollinger bands schema with correct fields', () => {
      const schema = service.getSeriesSchema('bollinger_bands');

      expect(schema).toBeDefined();
      expect(schema?.displayName).toBe('Bollinger Bands');

      const lengthField = schema?.fields.find(f => f.id === 'length');
      expect(lengthField).toBeDefined();
      expect(lengthField?.type).toBe('number');
      expect(lengthField?.defaultValue).toBe(20);
    });

    it('should create valid default configuration from schema', () => {
      const config = service.getSeriesConfig('series-1', 'supertrend');

      expect(config.period).toBe(10);
      expect(config.multiplier).toBe(3);
      expect(config.upTrend?.visible).toBe(true);
      expect(config.upTrend?.color).toBe('#4CAF50');
      expect(config.downTrend?.visible).toBe(true);
      expect(config.downTrend?.color).toBe('#F44336');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      service = new SeriesConfigurationService(mockStorage);
    });

    it('should handle empty configuration updates', () => {
      service.updateSeriesConfig('series-1', 'supertrend', {});

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config).toBeDefined();
    });

    it('should handle configuration for series without schema', () => {
      const config = service.getSeriesConfig('series-1', 'unknown' as SeriesType);

      expect(config).toBeDefined();
      expect(config.color).toBeDefined(); // Base default config
    });

    it('should handle multiple rapid updates', () => {
      service.updateSeriesConfig('series-1', 'supertrend', { period: 10 });
      service.updateSeriesConfig('series-1', 'supertrend', { period: 20 });
      service.updateSeriesConfig('series-1', 'supertrend', { period: 30 });

      const config = service.getSeriesConfig('series-1', 'supertrend');
      expect(config.period).toBe(30);
    });

    it('should handle very long series IDs', () => {
      const longId = 'series-' + 'x'.repeat(1000);

      service.updateSeriesConfig(longId, 'supertrend', { period: 15 });

      const config = service.getSeriesConfig(longId, 'supertrend');
      expect(config.period).toBe(15);
    });

    it('should handle special characters in series IDs', () => {
      const specialId = 'series-!@#$%^&*()';

      service.updateSeriesConfig(specialId, 'supertrend', { period: 15 });

      const config = service.getSeriesConfig(specialId, 'supertrend');
      expect(config.period).toBe(15);
    });
  });
});
