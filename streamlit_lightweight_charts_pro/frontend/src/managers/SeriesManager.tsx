import React, { useCallback, useMemo } from 'react';
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
  // Create all series for a chart
  const createSeriesForChart = useCallback(
    (chart: IChartApi, chartConfig: ChartConfig, chartId: string): ISeriesApi<any>[] => {
      const createdSeries: ISeriesApi<any>[] = [];

      try {
        if (!chartConfig.series || chartConfig.series.length === 0) {
          console.warn(`No series configured for chart ${chartId}`);
          return createdSeries;
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
            console.error(`Failed to create series ${seriesIndex} for chart ${chartId}:`, error);
          }
        });
      } catch (error) {
        console.error(`Failed to create series for chart ${chartId}:`, error);
      }

      return createdSeries;
    },
    []
  );

  // Update series data
  const updateSeriesData = useCallback((series: ISeriesApi<any>, seriesConfig: SeriesConfig) => {
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
      console.error('Failed to update series data:', error);
    }
  }, []);

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
      } catch (error) {
        console.error('Failed to add markers to series:', error);
      }
    },
    []
  );

  // Remove markers from series
  const removeMarkersFromSeries = useCallback((series: ISeriesApi<any>) => {
    try {
      (series as any).setMarkers([]);
      console.log('Markers removed from series');
    } catch (error) {
      console.error('Failed to remove markers from series:', error);
    }
  }, []);

  // Get series data
  const getSeriesData = useCallback((series: ISeriesApi<any>): SeriesDataPoint[] => {
    try {
      // Note: LightweightCharts doesn't provide a direct way to get data
      // This would need to be tracked separately if needed
      const extendedSeries = series as any;
      return extendedSeries.seriesConfig?.data || [];
    } catch (error) {
      console.error('Failed to get series data:', error);
      return [];
    }
  }, []);

  // Validate series data format
  const validateSeriesData = useCallback((data: any[], seriesType: string): boolean => {
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

export const SeriesManagerProvider: React.FC<SeriesManagerProviderProps> = ({ children }) => {
  const seriesManager = useSeriesManager();

  return (
    <SeriesManagerContext.Provider value={seriesManager}>{children}</SeriesManagerContext.Provider>
  );
};

export const useSeriesManagerContext = (): SeriesManagerAPI => {
  const context = React.useContext(SeriesManagerContext);
  if (!context) {
    throw new Error('useSeriesManagerContext must be used within a SeriesManagerProvider');
  }
  return context;
};
