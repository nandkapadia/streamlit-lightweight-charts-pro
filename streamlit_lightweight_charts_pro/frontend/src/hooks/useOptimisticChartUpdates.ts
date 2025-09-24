/**
 * React 19 useOptimistic hook implementation for instant chart updates
 * Provides immediate UI feedback while server operations are pending
 */

import { useOptimistic, useTransition, useCallback, useMemo } from 'react';
import { SeriesDataPoint } from '../types/ChartInterfaces';
import { react19Monitor } from '../utils/react19PerformanceMonitor';

export interface OptimisticChartState {
  data: SeriesDataPoint[];
  isLoading: boolean;
  pendingOperations: string[];
  lastUpdate: number;
  error?: string;
}

export interface ChartUpdateAction {
  type: 'ADD_POINT' | 'UPDATE_POINT' | 'DELETE_POINT' | 'BULK_UPDATE' | 'CLEAR';
  payload: any;
  operationId: string;
  chartId: string;
}

/**
 * Optimistic chart data hook with instant UI updates
 */
export function useOptimisticChartUpdates(
  initialData: SeriesDataPoint[],
  chartId: string
) {
  const [isPending, startTransition] = useTransition();

  // React 19 useOptimistic for instant UI feedback
  const [optimisticState, addOptimisticUpdate] = useOptimistic<
    OptimisticChartState,
    ChartUpdateAction
  >(
    {
      data: initialData,
      isLoading: false,
      pendingOperations: [],
      lastUpdate: Date.now(),
    },
    (currentState, action) => {
      const transitionId = react19Monitor.startTransition(
        `OptimisticUpdate-${action.type}`,
        'chart'
      );

      try {
        switch (action.type) {
          case 'ADD_POINT': {
            const newPoint = action.payload as SeriesDataPoint;
            const updatedData = [...currentState.data, newPoint].sort((a, b) =>
              (a.time as number) - (b.time as number)
            );

            react19Monitor.endTransition(transitionId);
            return {
              ...currentState,
              data: updatedData,
              pendingOperations: [...currentState.pendingOperations, action.operationId],
              lastUpdate: Date.now(),
            };
          }

          case 'UPDATE_POINT': {
            const { index, newData } = action.payload;
            const updatedData = [...currentState.data];
            if (index >= 0 && index < updatedData.length) {
              updatedData[index] = { ...updatedData[index], ...newData };
            }

            react19Monitor.endTransition(transitionId);
            return {
              ...currentState,
              data: updatedData,
              pendingOperations: [...currentState.pendingOperations, action.operationId],
              lastUpdate: Date.now(),
            };
          }

          case 'DELETE_POINT': {
            const indexToDelete = action.payload as number;
            const updatedData = currentState.data.filter((_, i) => i !== indexToDelete);

            react19Monitor.endTransition(transitionId);
            return {
              ...currentState,
              data: updatedData,
              pendingOperations: [...currentState.pendingOperations, action.operationId],
              lastUpdate: Date.now(),
            };
          }

          case 'BULK_UPDATE': {
            const newData = action.payload as SeriesDataPoint[];
            const sortedData = [...newData].sort((a, b) =>
              (a.time as number) - (b.time as number)
            );

            react19Monitor.endTransition(transitionId);
            return {
              ...currentState,
              data: sortedData,
              pendingOperations: [...currentState.pendingOperations, action.operationId],
              lastUpdate: Date.now(),
            };
          }

          case 'CLEAR': {
            react19Monitor.endTransition(transitionId);
            return {
              ...currentState,
              data: [],
              pendingOperations: [...currentState.pendingOperations, action.operationId],
              lastUpdate: Date.now(),
            };
          }

          default:
            react19Monitor.endTransition(transitionId);
            return currentState;
        }
      } catch (error) {
        react19Monitor.endTransition(transitionId);
        console.error('Optimistic update failed:', error);
        return {
          ...currentState,
          error: error instanceof Error ? error.message : 'Update failed',
        };
      }
    }
  );

  // Add a data point with optimistic update
  const addDataPoint = useCallback(async (
    newPoint: SeriesDataPoint,
    serverAction?: (point: SeriesDataPoint) => Promise<void>
  ) => {
    const operationId = `add-${Date.now()}-${Math.random()}`;

    // Immediate optimistic update
    addOptimisticUpdate({
      type: 'ADD_POINT',
      payload: newPoint,
      operationId,
      chartId,
    });

    // Server operation in transition
    if (serverAction) {
      startTransition(async () => {
        try {
          await serverAction(newPoint);

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Server confirmed add operation: ${operationId}`);
          }
        } catch (error) {
          console.error('Server add failed:', error);
          // Could implement revert logic here
        }
      });
    }
  }, [addOptimisticUpdate, chartId, startTransition]);

  // Update existing data point
  const updateDataPoint = useCallback(async (
    index: number,
    newData: Partial<SeriesDataPoint>,
    serverAction?: (index: number, data: Partial<SeriesDataPoint>) => Promise<void>
  ) => {
    const operationId = `update-${Date.now()}-${Math.random()}`;

    addOptimisticUpdate({
      type: 'UPDATE_POINT',
      payload: { index, newData },
      operationId,
      chartId,
    });

    if (serverAction) {
      startTransition(async () => {
        try {
          await serverAction(index, newData);

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Server confirmed update operation: ${operationId}`);
          }
        } catch (error) {
          console.error('Server update failed:', error);
        }
      });
    }
  }, [addOptimisticUpdate, chartId, startTransition]);

  // Delete a data point
  const deleteDataPoint = useCallback(async (
    index: number,
    serverAction?: (index: number) => Promise<void>
  ) => {
    const operationId = `delete-${Date.now()}-${Math.random()}`;

    addOptimisticUpdate({
      type: 'DELETE_POINT',
      payload: index,
      operationId,
      chartId,
    });

    if (serverAction) {
      startTransition(async () => {
        try {
          await serverAction(index);

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Server confirmed delete operation: ${operationId}`);
          }
        } catch (error) {
          console.error('Server delete failed:', error);
        }
      });
    }
  }, [addOptimisticUpdate, chartId, startTransition]);

  // Bulk update all data
  const bulkUpdateData = useCallback(async (
    newData: SeriesDataPoint[],
    serverAction?: (data: SeriesDataPoint[]) => Promise<void>
  ) => {
    const operationId = `bulk-${Date.now()}-${Math.random()}`;

    addOptimisticUpdate({
      type: 'BULK_UPDATE',
      payload: newData,
      operationId,
      chartId,
    });

    if (serverAction) {
      startTransition(async () => {
        try {
          await serverAction(newData);

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Server confirmed bulk update: ${operationId}`);
          }
        } catch (error) {
          console.error('Server bulk update failed:', error);
        }
      });
    }
  }, [addOptimisticUpdate, chartId, startTransition]);

  // Clear all data
  const clearData = useCallback(async (
    serverAction?: () => Promise<void>
  ) => {
    const operationId = `clear-${Date.now()}-${Math.random()}`;

    addOptimisticUpdate({
      type: 'CLEAR',
      payload: null,
      operationId,
      chartId,
    });

    if (serverAction) {
      startTransition(async () => {
        try {
          await serverAction();

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Server confirmed clear operation: ${operationId}`);
          }
        } catch (error) {
          console.error('Server clear failed:', error);
        }
      });
    }
  }, [addOptimisticUpdate, chartId, startTransition]);

  // Computed values
  const computedValues = useMemo(() => {
    const data = optimisticState.data;
    return {
      totalPoints: data.length,
      latestPoint: data[data.length - 1],
      dateRange: data.length > 0 ? {
        start: data[0].time,
        end: data[data.length - 1].time,
      } : null,
      hasUpdates: optimisticState.pendingOperations.length > 0,
      isOptimistic: optimisticState.pendingOperations.length > 0 || isPending,
    };
  }, [optimisticState.data, optimisticState.pendingOperations.length, isPending]);

  return {
    // State
    data: optimisticState.data,
    isLoading: optimisticState.isLoading || isPending,
    pendingOperations: optimisticState.pendingOperations,
    lastUpdate: optimisticState.lastUpdate,
    error: optimisticState.error,

    // Actions
    addDataPoint,
    updateDataPoint,
    deleteDataPoint,
    bulkUpdateData,
    clearData,

    // Computed
    ...computedValues,
  };
}

/**
 * useOptimistic for chart configuration updates
 */
export function useOptimisticChartConfig<T extends Record<string, any>>(
  initialConfig: T,
  _chartId: string
) {
  const [isPending, startTransition] = useTransition();

  const [optimisticConfig, updateOptimisticConfig] = useOptimistic<
    { config: T; pendingUpdates: string[] },
    { key: keyof T; value: any; operationId: string }
  >(
    { config: initialConfig, pendingUpdates: [] },
    (currentState, action) => ({
      config: {
        ...currentState.config,
        [action.key]: action.value,
      },
      pendingUpdates: [...currentState.pendingUpdates, action.operationId],
    })
  );

  const updateConfig = useCallback(async <K extends keyof T>(
    key: K,
    value: T[K],
    serverAction?: (key: K, value: T[K]) => Promise<void>
  ) => {
    const operationId = `config-${String(key)}-${Date.now()}`;

    // Immediate optimistic update
    updateOptimisticConfig({
      key,
      value,
      operationId,
    });

    // Server update
    if (serverAction) {
      startTransition(async () => {
        try {
          await serverAction(key, value);

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Config update confirmed: ${String(key)} = ${value}`);
          }
        } catch (error) {
          console.error(`Config update failed for ${String(key)}:`, error);
        }
      });
    }
  }, [updateOptimisticConfig, startTransition]);

  return {
    config: optimisticConfig.config,
    updateConfig,
    isPending,
    hasPendingUpdates: optimisticConfig.pendingUpdates.length > 0,
  };
}
