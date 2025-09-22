/**
 * Chart synchronization manager component
 * Extracted from LightweightCharts.tsx for better separation of concerns
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { IChartApi } from 'lightweight-charts';
import { SyncConfig } from '../types';
import { ExtendedChartApi } from '../types/ChartInterfaces';

interface ChartSyncManagerProps {
  chart: IChartApi | null;
  chartId: string;
  syncConfig?: SyncConfig;
  onSyncEvent?: (_eventType: string, _data: any) => void;
}

/**
 * Manages chart synchronization across multiple chart instances
 */
export const ChartSyncManager: React.FC<ChartSyncManagerProps> = ({
  chart,
  chartId,
  syncConfig,
  onSyncEvent,
}) => {
  const syncStateRef = useRef({
    isExternalSync: false,
    isExternalTimeRangeSync: false,
    lastSyncTimestamp: 0,
    lastTimeRangeSyncTimestamp: 0,
  });

  /**
   * Setup crosshair synchronization
   */
  const setupCrosshairSync = useCallback((): (() => void) | undefined => {
    if (!chart || !syncConfig?.crosshair) return undefined;

    const SYNC_DEBOUNCE_MS = 50;

    // Add storage listener for incoming sync events
    if (!(chart as ExtendedChartApi)._storageListenerAdded) {
      const handleStorageSync = (event: StorageEvent) => {
        if (event.key === 'chart-crosshair-sync' && event.newValue) {
          try {
            const syncData = JSON.parse(event.newValue);
            if (syncData.chartId !== chartId) {
              const now = Date.now();
              if (now - syncStateRef.current.lastSyncTimestamp < SYNC_DEBOUNCE_MS) {
                return;
              }
              syncStateRef.current.lastSyncTimestamp = now;

              if (syncData.param) {
                (chart as ExtendedChartApi)._isExternalSync = true;
                chart.timeScale().scrollToPosition(syncData.param.point?.x || 0, false);
                setTimeout(() => {
                  (chart as ExtendedChartApi)._isExternalSync = false;
                }, 50);
              }
            }
          } catch (error) {
            // Ignore invalid sync data
          }
        }
      };

      window.addEventListener('storage', handleStorageSync);
      (chart as ExtendedChartApi)._storageListenerAdded = true;
    }

    // Subscribe to crosshair move events
    const handleCrosshairMove = (param: any) => {
      if ((chart as ExtendedChartApi)._isExternalSync) {
        return;
      }

      // Broadcast sync event
      const syncData = {
        chartId,
        param,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem('chart-crosshair-sync', JSON.stringify(syncData));
        onSyncEvent?.('crosshairMove', syncData);
      } catch (error) {
        // Ignore localStorage errors
      }
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
    };
  }, [chart, chartId, syncConfig?.crosshair, onSyncEvent]);

  /**
   * Setup time range synchronization
   */
  const setupTimeRangeSync = useCallback((): (() => void) | undefined => {
    if (!chart || !syncConfig?.timeRange) return undefined;

    const TIME_RANGE_SYNC_DEBOUNCE_MS = 100;

    // Add storage listener for time range sync
    if (!(chart as ExtendedChartApi)._timeRangeStorageListenerAdded) {
      const handleTimeRangeSync = (event: StorageEvent) => {
        if (event.key === 'chart-timerange-sync' && event.newValue) {
          try {
            const syncData = JSON.parse(event.newValue);
            if (syncData.chartId !== chartId) {
              const now = Date.now();
              if (
                now - syncStateRef.current.lastTimeRangeSyncTimestamp <
                TIME_RANGE_SYNC_DEBOUNCE_MS
              ) {
                return;
              }
              syncStateRef.current.lastTimeRangeSyncTimestamp = now;

              if (syncData.timeRange) {
                (chart as ExtendedChartApi)._isExternalTimeRangeSync = true;
                chart.timeScale().setVisibleRange(syncData.timeRange);
                setTimeout(() => {
                  (chart as ExtendedChartApi)._isExternalTimeRangeSync = false;
                }, 100);
              }
            }
          } catch (error) {
            // Ignore invalid sync data
          }
        }
      };

      window.addEventListener('storage', handleTimeRangeSync);
      (chart as ExtendedChartApi)._timeRangeStorageListenerAdded = true;
    }

    // Subscribe to visible time range change
    const handleTimeRangeChange = () => {
      if ((chart as ExtendedChartApi)._isExternalTimeRangeSync) {
        return;
      }

      try {
        const visibleRange = chart.timeScale().getVisibleRange();
        const syncData = {
          chartId,
          timeRange: visibleRange,
          timestamp: Date.now(),
        };

        localStorage.setItem('chart-timerange-sync', JSON.stringify(syncData));
        onSyncEvent?.('timeRangeChange', syncData);
      } catch (error) {
        // Ignore localStorage errors
      }
    };

    chart.timeScale().subscribeVisibleTimeRangeChange(handleTimeRangeChange);

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleTimeRangeChange);
    };
  }, [chart, chartId, syncConfig?.timeRange, onSyncEvent]);

  /**
   * Setup click synchronization
   */
  const setupClickSync = useCallback((): (() => void) | undefined => {
    if (!chart || !syncConfig?.click) return undefined;

    const handleClick = () => {
      const syncData = {
        chartId,
        event: 'click',
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem('chart-click-sync', JSON.stringify(syncData));
        onSyncEvent?.('click', syncData);
      } catch (error) {
        // Ignore localStorage errors
      }
    };

    chart.subscribeClick(handleClick);

    return () => {
      chart.unsubscribeClick(handleClick);
    };
  }, [chart, chartId, syncConfig?.click, onSyncEvent]);

  // Setup all synchronization types
  useEffect(() => {
    if (!chart || !syncConfig) return undefined;

    const cleanupFunctions: (() => void)[] = [];

    if (syncConfig.crosshair) {
      const cleanup = setupCrosshairSync();
      if (cleanup) cleanupFunctions.push(cleanup);
    }

    if (syncConfig.timeRange) {
      const cleanup = setupTimeRangeSync();
      if (cleanup) cleanupFunctions.push(cleanup);
    }

    if (syncConfig.click) {
      const cleanup = setupClickSync();
      if (cleanup) cleanupFunctions.push(cleanup);
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [chart, syncConfig, setupCrosshairSync, setupTimeRangeSync, setupClickSync]);

  // This component doesn't render anything - it only manages synchronization
  return null;
};
