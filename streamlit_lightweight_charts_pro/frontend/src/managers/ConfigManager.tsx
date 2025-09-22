import React, { useCallback, useMemo } from 'react';
import { ComponentConfig, ChartConfig } from '../types';
import { cleanLineStyleOptions } from '../utils/lineStyle';

export interface ProcessedChartConfig extends ChartConfig {
  chartId: string;
  containerId: string;
  chartOptions: any;
}

export interface ConfigManagerAPI {
  processChartConfigs: (config: ComponentConfig, width?: number | null, height?: number | null) => ProcessedChartConfig[];
  validateConfig: (config: ComponentConfig) => { isValid: boolean; errors: string[] };
  mergeConfigDefaults: (config: ComponentConfig) => ComponentConfig;
  extractChartOptions: (chartConfig: ChartConfig, width?: number | null, height?: number | null) => any;
}

const DEFAULT_CHART_CONFIG: any = {
  chart: {
    width: 800,
    height: 400,
    layout: {
      textColor: '#000',
      background: {
        type: 'solid',
        color: '#ffffff',
      },
    },
    grid: {
      vertLines: {
        color: 'rgba(197, 203, 206, 0.5)',
      },
      horzLines: {
        color: 'rgba(197, 203, 206, 0.5)',
      },
    },
    crosshair: {
      mode: 0,
    },
    rightPriceScale: {
      borderColor: 'rgba(197, 203, 206, 0.8)',
    },
    timeScale: {
      borderColor: 'rgba(197, 203, 206, 0.8)',
    },
  },
  series: [],
};

export const useConfigManager = (): ConfigManagerAPI => {

  // Validate configuration
  const validateConfig = useCallback((config: ComponentConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config) {
      errors.push('Configuration is required');
      return { isValid: false, errors };
    }

    if (!config.charts || !Array.isArray(config.charts)) {
      errors.push('Charts array is required');
      return { isValid: false, errors };
    }

    if (config.charts.length === 0) {
      errors.push('At least one chart configuration is required');
    }

    // Validate each chart config
    config.charts.forEach((chartConfig, index) => {
      if (!chartConfig) {
        errors.push(`Chart ${index}: Configuration is required`);
        return;
      }

      if (!chartConfig.series || !Array.isArray(chartConfig.series)) {
        errors.push(`Chart ${index}: Series array is required`);
      } else if (chartConfig.series.length === 0) {
        errors.push(`Chart ${index}: At least one series is required`);
      }

      // Validate series configurations
      chartConfig.series?.forEach((series, seriesIndex) => {
        if (!series) {
          errors.push(`Chart ${index}, Series ${seriesIndex}: Configuration is required`);
          return;
        }

        if (!series.type) {
          errors.push(`Chart ${index}, Series ${seriesIndex}: Series type is required`);
        }

        if (!series.data || !Array.isArray(series.data)) {
          errors.push(`Chart ${index}, Series ${seriesIndex}: Data array is required`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  // Merge default configuration
  const mergeConfigDefaults = useCallback((config: ComponentConfig): ComponentConfig => {
    if (!config || !config.charts) {
      return config;
    }

    const mergedConfig = { ...config };
    mergedConfig.charts = config.charts.map(chartConfig => {
      const merged = { ...DEFAULT_CHART_CONFIG, ...chartConfig };

      // Deep merge chart options
      if (chartConfig.chart && DEFAULT_CHART_CONFIG.chart) {
        merged.chart = {
          ...DEFAULT_CHART_CONFIG.chart,
          ...chartConfig.chart,
          layout: {
            ...DEFAULT_CHART_CONFIG.chart.layout,
            ...chartConfig.chart.layout,
          },
          grid: {
            ...DEFAULT_CHART_CONFIG.chart.grid,
            ...chartConfig.chart.grid,
          },
          crosshair: {
            ...DEFAULT_CHART_CONFIG.chart.crosshair,
            ...chartConfig.chart.crosshair,
          },
          rightPriceScale: {
            ...DEFAULT_CHART_CONFIG.chart.rightPriceScale,
            ...chartConfig.chart.rightPriceScale,
          },
          timeScale: {
            ...DEFAULT_CHART_CONFIG.chart.timeScale,
            ...chartConfig.chart.timeScale,
          },
        };
      }

      return merged;
    });

    return mergedConfig;
  }, []);

  // Extract chart options
  const extractChartOptions = useCallback((chartConfig: ChartConfig, width?: number | null, height?: number | null) => {
    const chartOptions = {
      width: typeof chartConfig.chart?.width === 'number'
        ? chartConfig.chart.width
        : width || undefined,
      height: typeof chartConfig.chart?.height === 'number'
        ? chartConfig.chart.height
        : chartConfig.chart?.height || height || undefined,
      ...chartConfig.chart,
    };

    return cleanLineStyleOptions(chartOptions);
  }, []);

  // Process chart configurations
  const processChartConfigs = useCallback((
    config: ComponentConfig,
    width?: number | null,
    height?: number | null
  ): ProcessedChartConfig[] => {
    if (!config || !config.charts || config.charts.length === 0) {
      return [];
    }

    // Validate configuration first
    const validation = validateConfig(config);
    if (!validation.isValid) {
      console.error('Configuration validation failed:', validation.errors);
      return [];
    }

    // Merge with defaults
    const configWithDefaults = mergeConfigDefaults(config);

    // Process each chart configuration
    return configWithDefaults.charts.map((chartConfig: ChartConfig, chartIndex: number) => {
      const chartId = chartConfig.chartId || `chart-${chartIndex}`;
      const containerId = `chart-container-${chartId}`;

      // Extract and clean chart options
      const chartOptions = extractChartOptions(chartConfig, width, height);

      const processedConfig: ProcessedChartConfig = {
        ...chartConfig,
        chartId,
        containerId,
        chartOptions,
      };

      return processedConfig;
    });
  }, [validateConfig, mergeConfigDefaults, extractChartOptions]);

  // Memoized API object
  const api = useMemo<ConfigManagerAPI>(() => ({
    processChartConfigs,
    validateConfig,
    mergeConfigDefaults,
    extractChartOptions,
  }), [
    processChartConfigs,
    validateConfig,
    mergeConfigDefaults,
    extractChartOptions,
  ]);

  return api;
};

// Config Manager Provider Component
interface ConfigManagerProviderProps {
  children: React.ReactNode;
}

const ConfigManagerContext = React.createContext<ConfigManagerAPI | null>(null);

export const ConfigManagerProvider: React.FC<ConfigManagerProviderProps> = ({ children }) => {
  const configManager = useConfigManager();

  return (
    <ConfigManagerContext.Provider value={configManager}>
      {children}
    </ConfigManagerContext.Provider>
  );
};

export const useConfigManagerContext = (): ConfigManagerAPI => {
  const context = React.useContext(ConfigManagerContext);
  if (!context) {
    throw new Error('useConfigManagerContext must be used within a ConfigManagerProvider');
  }
  return context;
};