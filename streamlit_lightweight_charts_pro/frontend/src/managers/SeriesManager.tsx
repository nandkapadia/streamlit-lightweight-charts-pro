import React, { useCallback, useMemo, useTransition } from 'react';
import { IChartApi, ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';
import { SeriesConfig, ChartConfig } from '../types';
import { SeriesDataPoint } from '../types/ChartInterfaces';
import { createSeries } from '../utils/seriesFactory';

export interface SeriesManagerAPI {
  createSeriesForChart: (
    chart: IChartApi,
    chartConfig: ChartConfig,
    chartId: string
  ) => ISeriesApi<any>[];
  updateSeriesData: (series: ISeriesApi<any>, seriesConfig: SeriesConfig) => void;
  addMarkersToSeries: (series: ISeriesApi<any>, markers: SeriesMarker<Time>[]) => void;
  removeMarkersFromSeries: (series: ISeriesApi<any>) => void;
  getSeriesData: (series: ISeriesApi<any>) => SeriesDataPoint[];
  validateSeriesData: (data: any[], seriesType: string) => boolean;
}

export const useSeriesManager = (): SeriesManagerAPI => {
  // React 19 concurrent features for better performance
  const [, startSeriesTransition] = useTransition();

  // Validate series data format (memoized for better performance)
  const validateSeriesData = useMemo(
    () => (data: any[], seriesType: string): boolean => {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    // Check if all data points have required fields
    return data.every(point => {
      if (!point || typeof point !== 'object') {
        return false;
      }

      // All series types require time
      if (!('time' in point)) {
        return false;
      }

      // Check type-specific requirements
      switch (seriesType.toLowerCase()) {
        case 'line':
        case 'area':
          return 'value' in point;

        case 'bar':
        case 'candlestick':
          return 'open' in point && 'high' in point && 'low' in point && 'close' in point;

        case 'histogram':
          return 'value' in point;

        case 'baseline':
          return 'value' in point;

        default:
          // For custom series types, just check for value
          return 'value' in point;
      }
    });
    },
    []
  );

  // Add markers to series
  const addMarkersToSeries = useCallback(
    (series: ISeriesApi<any>, markers: SeriesMarker<Time>[]) => {
      try {
        if (!markers || !Array.isArray(markers) || markers.length === 0) {
          return;
        }

        // Validate markers format
        const validMarkers = markers.filter(marker => {
          return marker && typeof marker === 'object' && 'time' in marker && 'position' in marker;
        });

        if (validMarkers.length === 0) {
          console.warn('No valid markers to add');
          return;
        }

        (series as any).setMarkers(validMarkers);
        console.log(`Added ${validMarkers.length} markers to series`);
      } catch {
        console.error('An error occurred');
      }
    },
    []
  );

  // Create all series for a chart with React 19 optimizations
  const createSeriesForChart = useCallback(
    (chart: IChartApi, chartConfig: ChartConfig, chartId: string): ISeriesApi<any>[] => {
      const createdSeries: ISeriesApi<any>[] = [];

      // Use transition for non-urgent series creation
      startSeriesTransition(() => {
        try {
          if (!chartConfig.series || chartConfig.series.length === 0) {
            console.warn(`No series configured for chart ${chartId}`);
            return;
          }

          chartConfig.series.forEach((seriesConfig: SeriesConfig, seriesIndex: number) => {
          try {
            // Create series using factory
            const series = createSeries(chart, seriesConfig);

            if (!series) {
              console.error(`Failed to create series ${seriesIndex} for chart ${chartId}`);
              return;
            }

            // Set series data if available
            if (
              seriesConfig.data &&
              Array.isArray(seriesConfig.data) &&
              seriesConfig.data.length > 0
            ) {
              if (validateSeriesData(seriesConfig.data, seriesConfig.type)) {
                series.setData(seriesConfig.data);
              } else {
                console.warn(`Invalid data for series ${seriesIndex} in chart ${chartId}`);
              }
            }

            // Add markers if configured
            if (
              seriesConfig.markers &&
              Array.isArray(seriesConfig.markers) &&
              seriesConfig.markers.length > 0
            ) {
              addMarkersToSeries(series, seriesConfig.markers);
            }

            // Store extended series information
            const extendedSeries = series as any;
            extendedSeries.seriesConfig = seriesConfig;
            extendedSeries.seriesIndex = seriesIndex;
            extendedSeries.chartId = chartId;

            createdSeries.push(series);
            console.log(`Series ${seriesIndex} created successfully for chart ${chartId}`);
          } catch (error) {
            console.error(error);
          }
        });
        } catch (error) {
          console.error(error);
        }
      });

      return createdSeries;
    },
    [addMarkersToSeries, validateSeriesData, startSeriesTransition]
  );

  // Update series data
  const updateSeriesData = useCallback(
    (series: ISeriesApi<any>, seriesConfig: SeriesConfig) => {
      try {
        if (!seriesConfig.data || !Array.isArray(seriesConfig.data)) {
          console.warn('No valid data provided for series update');
          return;
        }

        if (!validateSeriesData(seriesConfig.data, seriesConfig.type)) {
          console.error('Invalid data format for series update');
          return;
        }

        series.setData(seriesConfig.data);
        console.log('Series data updated successfully');
      } catch (error) {
        console.error(error);
      }
    },
    [validateSeriesData]
  );

  // Remove markers from series
  const removeMarkersFromSeries = useCallback((series: ISeriesApi<any>) => {
    try {
      (series as any).setMarkers([]);
      console.log('Markers removed from series');
    } catch {
      console.error('An error occurred');
    }
  }, []);

  // Get series data
  const getSeriesData = useCallback((series: ISeriesApi<any>): SeriesDataPoint[] => {
    try {
      // Note: LightweightCharts doesn't provide a direct way to get data
      // This would need to be tracked separately if needed
      const extendedSeries = series as any;
      return extendedSeries.seriesConfig?.data || [];
    } catch {
      console.error('An error occurred');
      return [];
    }
  }, []);

  // Memoized API object
  const api = useMemo<SeriesManagerAPI>(
    () => ({
      createSeriesForChart,
      updateSeriesData,
      addMarkersToSeries,
      removeMarkersFromSeries,
      getSeriesData,
      validateSeriesData,
    }),
    [
      createSeriesForChart,
      updateSeriesData,
      addMarkersToSeries,
      removeMarkersFromSeries,
      getSeriesData,
      validateSeriesData,
    ]
  );

  return api;
};

// Series Manager Provider Component
interface SeriesManagerProviderProps {
  children: React.ReactNode;
}

const SeriesManagerContext = React.createContext<SeriesManagerAPI | null>(null);

export const SeriesManagerProvider: React.FC<SeriesManagerProviderProps> = React.memo(({ children }) => {
  const seriesManager = useSeriesManager();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => seriesManager, [seriesManager]);

  return (
    <SeriesManagerContext.Provider value={contextValue}>{children}</SeriesManagerContext.Provider>
  );
});

export const useSeriesManagerContext = (): SeriesManagerAPI => {
  const context = React.useContext(SeriesManagerContext);
  if (!context) {
    throw new Error('useSeriesManagerContext must be used within a SeriesManagerProvider');
  }
  return context;
};
