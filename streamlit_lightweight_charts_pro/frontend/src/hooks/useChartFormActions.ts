/**
 * React 19 useActionState hook implementation for chart form management
 * Provides robust form state handling with built-in loading and error states
 */

import { useActionState, useCallback, useMemo } from 'react';
import { react19Monitor } from '../utils/react19PerformanceMonitor';
import { logger } from '../utils/logger';

export interface ChartFormState {
  data?: any;
  error?: string;
  isLoading: boolean;
  lastAction?: string;
  validationErrors?: Record<string, string>;
}

export interface ChartConfigFormData {
  title?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  gridVisible?: boolean;
  crosshairEnabled?: boolean;
  timeScale?: {
    visible?: boolean;
    timeVisible?: boolean;
    secondsVisible?: boolean;
  };
  priceScale?: {
    visible?: boolean;
    position?: 'left' | 'right';
    autoScale?: boolean;
  };
}

/**
 * Chart configuration form action
 */
async function chartConfigAction(
  prevState: ChartFormState,
  formData: FormData
): Promise<ChartFormState> {
  const transitionId = react19Monitor.startTransition('ChartConfigForm', 'sync');

  try {
    // Extract form data
    const rawData: Record<string, any> = {};
    const validationErrors: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      rawData[key] = value;
    }

    // Validation logic
    if (rawData.title && rawData.title.length > 100) {
      validationErrors.title = 'Title must be less than 100 characters';
    }

    if (rawData.width && (isNaN(Number(rawData.width)) || Number(rawData.width) < 100)) {
      validationErrors.width = 'Width must be a number greater than 100';
    }

    if (rawData.height && (isNaN(Number(rawData.height)) || Number(rawData.height) < 100)) {
      validationErrors.height = 'Height must be a number greater than 100';
    }

    if (Object.keys(validationErrors).length > 0) {
      react19Monitor.endTransition(transitionId);
      return {
        ...prevState,
        error: 'Validation failed',
        validationErrors,
        isLoading: false,
        lastAction: 'validation_failed',
      };
    }

    // Simulate server processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Process the configuration
    const config: ChartConfigFormData = {
      title: rawData.title || '',
      width: rawData.width ? Number(rawData.width) : undefined,
      height: rawData.height ? Number(rawData.height) : undefined,
      backgroundColor: rawData.backgroundColor || '#ffffff',
      gridVisible: rawData.gridVisible === 'true',
      crosshairEnabled: rawData.crosshairEnabled === 'true',
      timeScale: {
        visible: rawData.timeScaleVisible === 'true',
        timeVisible: rawData.timeVisible === 'true',
        secondsVisible: rawData.secondsVisible === 'true',
      },
      priceScale: {
        visible: rawData.priceScaleVisible === 'true',
        position: (rawData.priceScalePosition as 'left' | 'right') || 'right',
        autoScale: rawData.autoScale === 'true',
      },
    };

    react19Monitor.endTransition(transitionId);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Chart configuration saved', 'useChartFormActions');
    }

    return {
      data: config,
      error: undefined,
      validationErrors: undefined,
      isLoading: false,
      lastAction: 'config_updated',
    };
  } catch (error) {
    react19Monitor.endTransition(transitionId);

    return {
      ...prevState,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      isLoading: false,
      lastAction: 'error',
    };
  }
}

/**
 * Chart data import form action
 */
async function chartDataImportAction(
  prevState: ChartFormState,
  formData: FormData
): Promise<ChartFormState> {
  const transitionId = react19Monitor.startTransition('ChartDataImport', 'chart');

  try {
    const file = formData.get('dataFile') as File;
    const dataType = formData.get('dataType') as string;
    const validationErrors: Record<string, string> = {};

    // Validate file
    if (!file || file.size === 0) {
      validationErrors.dataFile = 'Please select a valid file';
    } else if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      validationErrors.dataFile = 'File size must be less than 10MB';
    }

    // Validate data type
    if (!dataType || !['csv', 'json', 'excel'].includes(dataType)) {
      validationErrors.dataType = 'Please select a valid data type';
    }

    if (Object.keys(validationErrors).length > 0) {
      react19Monitor.endTransition(transitionId);
      return {
        ...prevState,
        error: 'Validation failed',
        validationErrors,
        isLoading: false,
        lastAction: 'validation_failed',
      };
    }

    // Process file (simulate)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock processed data
    const processedData = {
      fileName: file.name,
      fileSize: file.size,
      dataType,
      recordCount: Math.floor(Math.random() * 1000) + 100,
      columns: ['time', 'open', 'high', 'low', 'close', 'volume'],
      preview: Array.from({ length: 5 }, (_, i) => ({
        time: Date.now() - (5 - i) * 24 * 60 * 60 * 1000,
        open: 100 + Math.random() * 10,
        high: 105 + Math.random() * 10,
        low: 95 + Math.random() * 10,
        close: 100 + Math.random() * 10,
        volume: Math.floor(Math.random() * 1000000),
      })),
    };

    react19Monitor.endTransition(transitionId);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Chart configuration saved', 'useChartFormActions');
    }

    return {
      data: processedData,
      error: undefined,
      validationErrors: undefined,
      isLoading: false,
      lastAction: 'data_imported',
    };
  } catch (error) {
    react19Monitor.endTransition(transitionId);

    return {
      ...prevState,
      error: error instanceof Error ? error.message : 'Import failed',
      isLoading: false,
      lastAction: 'error',
    };
  }
}

/**
 * Chart export form action
 */
async function chartExportAction(
  prevState: ChartFormState,
  formData: FormData
): Promise<ChartFormState> {
  const transitionId = react19Monitor.startTransition('ChartExport', 'chart');

  try {
    const format = formData.get('format') as string;
    const quality = formData.get('quality') as string;
    const includeData = formData.get('includeData') === 'true';
    const chartId = formData.get('chartId') as string;

    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 800));

    const exportResult = {
      format,
      quality,
      includeData,
      chartId,
      fileSize: `${Math.floor(Math.random() * 500) + 100}KB`,
      downloadUrl: `/exports/chart-${chartId}-${Date.now()}.${format}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    react19Monitor.endTransition(transitionId);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Chart configuration saved', 'useChartFormActions');
    }

    return {
      data: exportResult,
      error: undefined,
      validationErrors: undefined,
      isLoading: false,
      lastAction: 'export_completed',
    };
  } catch (error) {
    react19Monitor.endTransition(transitionId);

    return {
      ...prevState,
      error: error instanceof Error ? error.message : 'Export failed',
      isLoading: false,
      lastAction: 'error',
    };
  }
}

/**
 * Hook for chart configuration form management
 */
export function useChartConfigForm(initialData?: ChartConfigFormData) {
  const initialState: ChartFormState = {
    data: initialData,
    isLoading: false,
  };

  const [state, submitAction, isPending] = useActionState(chartConfigAction, initialState);

  const isSubmitting = isPending || state.isLoading;

  const hasError = Boolean(state.error);
  const hasValidationErrors = Boolean(state.validationErrors);

  const formHelpers = useMemo(
    () => ({
      getFieldError: (fieldName: string) => state.validationErrors?.[fieldName],
      hasFieldError: (fieldName: string) => Boolean(state.validationErrors?.[fieldName]),
      isFieldValid: (fieldName: string) => !state.validationErrors?.[fieldName],
      resetForm: () => {
        // This would typically reset form state
      },
    }),
    [state.validationErrors]
  );

  return {
    state,
    submitAction,
    isSubmitting,
    hasError,
    hasValidationErrors,
    ...formHelpers,
  };
}

/**
 * Hook for chart data import form
 */
export function useChartDataImportForm() {
  const initialState: ChartFormState = {
    isLoading: false,
  };

  const [state, submitAction, isPending] = useActionState(chartDataImportAction, initialState);

  const progress = useMemo(() => {
    if (state.lastAction === 'data_imported' && state.data) {
      return {
        completed: true,
        recordCount: state.data.recordCount,
        fileName: state.data.fileName,
        preview: state.data.preview,
      };
    }
    return { completed: false };
  }, [state.lastAction, state.data]);

  return {
    state,
    submitAction,
    isPending,
    progress,
    isCompleted: progress.completed,
  };
}

/**
 * Hook for chart export form
 */
export function useChartExportForm() {
  const initialState: ChartFormState = {
    isLoading: false,
  };

  const [state, submitAction, isPending] = useActionState(chartExportAction, initialState);

  const exportStatus = useMemo(() => {
    if (state.lastAction === 'export_completed' && state.data) {
      return {
        ready: true,
        downloadUrl: state.data.downloadUrl,
        fileSize: state.data.fileSize,
        format: state.data.format,
        expiresAt: state.data.expiresAt,
      };
    }
    return { ready: false };
  }, [state.lastAction, state.data]);

  const downloadFile = useCallback(() => {
    if (exportStatus.ready && exportStatus.downloadUrl) {
      // In a real app, this would trigger the download
      window.open(exportStatus.downloadUrl, '_blank');
    }
  }, [exportStatus]);

  return {
    state,
    submitAction,
    isPending,
    exportStatus,
    downloadFile,
    isReady: exportStatus.ready,
  };
}

/**
 * Combined hook for all chart form actions
 */
export function useChartFormActions() {
  const configForm = useChartConfigForm();
  const importForm = useChartDataImportForm();
  const exportForm = useChartExportForm();

  return {
    config: configForm,
    import: importForm,
    export: exportForm,
  };
}
