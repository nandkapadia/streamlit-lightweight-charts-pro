import React, { useRef, useCallback, useMemo } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { ChartConfig } from '../types';
import { ExtendedChartApi } from '../types/ChartInterfaces';
import { SignalSeries } from '../plugins/series/signalSeriesPlugin';
import { CornerLayoutManager } from '../services/CornerLayoutManager';

interface ChartManagerState {
  charts: { [key: string]: IChartApi };
  series: { [key: string]: ISeriesApi<any>[] };
  signalPlugins: { [key: string]: SignalSeries };
  configs: { [key: string]: ChartConfig };
  containers: { [key: string]: HTMLElement };
}

interface ChartManagerProps {
  onChartsReady?: () => void;
  onChartError?: (error: Error, chartId: string) => void;
}

export interface ChartManagerAPI {
  getChart: (chartId: string) => IChartApi | undefined;
  getSeries: (chartId: string) => ISeriesApi<any>[] | undefined;
  getSignalPlugin: (chartId: string) => SignalSeries | undefined;
  registerChart: (chartId: string, chart: IChartApi, config: ChartConfig) => void;
  unregisterChart: (chartId: string) => void;
  cleanup: () => void;
  initializeGlobalRegistries: () => void;
}

export const useChartManager = ({
  onChartsReady,
  onChartError,
}: ChartManagerProps = {}): ChartManagerAPI => {
  const stateRef = useRef<ChartManagerState>({
    charts: {},
    series: {},
    signalPlugins: {},
    configs: {},
    containers: {},
  });

  const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const isInitializedRef = useRef<boolean>(false);
  const isDisposingRef = useRef<boolean>(false);

  // Initialize global registries for cross-component synchronization
  const initializeGlobalRegistries = useCallback(() => {
    if (!window.chartApiMap) {
      window.chartApiMap = {};
    }
    if (!window.chartGroupMap) {
      window.chartGroupMap = {};
    }
    // Additional registries can be added as needed
    (window as any).priceScaleRegistries = (window as any).priceScaleRegistries || {};
    (window as any).timeScaleRegistry = (window as any).timeScaleRegistry || {};
  }, []);

  // Register a new chart
  const registerChart = useCallback(
    (chartId: string, chart: IChartApi, config: ChartConfig) => {
      try {
        const state = stateRef.current;

        // Store chart reference
        state.charts[chartId] = chart;
        state.configs[chartId] = config;
        state.series[chartId] = [];

        // Register in global registries
        window.chartApiMap = window.chartApiMap || {};
        window.chartApiMap[chartId] = chart as ExtendedChartApi;

        // Initialize CornerLayoutManager for this chart
        try {
          // CornerLayoutManager initialization would be handled separately
          console.log(`CornerLayoutManager ready for ${chartId}`);
        } catch (error) {
          console.warn(`Failed to initialize CornerLayoutManager for ${chartId}:`, error);
        }

        console.log(`Chart ${chartId} registered successfully`);
      } catch (error) {
        console.error(`Failed to register chart ${chartId}:`, error);
        if (onChartError) {
          onChartError(error as Error, chartId);
        }
      }
    },
    [onChartError]
  );

  // Unregister a chart
  const unregisterChart = useCallback((chartId: string) => {
    try {
      const state = stateRef.current;

      // Clean up signal plugin
      if (state.signalPlugins[chartId]) {
        try {
          state.signalPlugins[chartId].destroy();
        } catch (error) {
          console.warn(`Failed to destroy signal plugin for ${chartId}:`, error);
        }
        delete state.signalPlugins[chartId];
      }

      // Clean up chart
      if (state.charts[chartId]) {
        try {
          state.charts[chartId].remove();
        } catch (error) {
          console.warn(`Failed to remove chart ${chartId}:`, error);
        }
        delete state.charts[chartId];
      }

      // Clean up CornerLayoutManager
      try {
        CornerLayoutManager.cleanup(chartId);
      } catch (error) {
        console.warn(`Failed to cleanup CornerLayoutManager for ${chartId}:`, error);
      }

      // Clean up from global registries
      if (window.chartApiMap) {
        delete window.chartApiMap[chartId];
      }

      // Clean up other references
      delete state.series[chartId];
      delete state.configs[chartId];
      delete state.containers[chartId];

      console.log(`Chart ${chartId} unregistered successfully`);
    } catch (error) {
      console.error(`Failed to unregister chart ${chartId}:`, error);
    }
  }, []);

  // Get chart by ID
  const getChart = useCallback((chartId: string): IChartApi | undefined => {
    return stateRef.current.charts[chartId];
  }, []);

  // Get series by chart ID
  const getSeries = useCallback((chartId: string): ISeriesApi<any>[] | undefined => {
    return stateRef.current.series[chartId];
  }, []);

  // Get signal plugin by chart ID
  const getSignalPlugin = useCallback((chartId: string): SignalSeries | undefined => {
    return stateRef.current.signalPlugins[chartId];
  }, []);

  // Complete cleanup
  const cleanup = useCallback(() => {
    const state = stateRef.current;

    // Set disposing flag
    isDisposingRef.current = true;

    // Clear all debounce timers
    Object.values(debounceTimersRef.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    debounceTimersRef.current = {};

    // Clean up all charts
    Object.keys(state.charts).forEach(chartId => {
      unregisterChart(chartId);
    });

    // Clear global registries
    if (window.chartApiMap) {
      window.chartApiMap = {};
    }
    if (window.chartGroupMap) {
      window.chartGroupMap = {};
    }

    // Reset state
    stateRef.current = {
      charts: {},
      series: {},
      signalPlugins: {},
      configs: {},
      containers: {},
    };

    isInitializedRef.current = false;
    isDisposingRef.current = false;

    console.log('ChartManager cleanup completed');
  }, [unregisterChart]);

  // Memoized API object
  const api = useMemo<ChartManagerAPI>(
    () => ({
      getChart,
      getSeries,
      getSignalPlugin,
      registerChart,
      unregisterChart,
      cleanup,
      initializeGlobalRegistries,
    }),
    [
      getChart,
      getSeries,
      getSignalPlugin,
      registerChart,
      unregisterChart,
      cleanup,
      initializeGlobalRegistries,
    ]
  );

  return api;
};

// Chart Manager Provider Component
interface ChartManagerProviderProps {
  children: React.ReactNode;
  onChartsReady?: () => void;
  onChartError?: (error: Error, chartId: string) => void;
}

const ChartManagerContext = React.createContext<ChartManagerAPI | null>(null);

export const ChartManagerProvider: React.FC<ChartManagerProviderProps> = ({
  children,
  onChartsReady,
  onChartError,
}) => {
  const chartManager = useChartManager({ onChartsReady, onChartError });

  return (
    <ChartManagerContext.Provider value={chartManager}>{children}</ChartManagerContext.Provider>
  );
};

export const useChartManagerContext = (): ChartManagerAPI => {
  const context = React.useContext(ChartManagerContext);
  if (!context) {
    throw new Error('useChartManagerContext must be used within a ChartManagerProvider');
  }
  return context;
};
