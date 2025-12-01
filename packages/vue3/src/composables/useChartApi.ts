/**
 * @fileoverview Vue 3 composable for REST API communication with the chart backend.
 *
 * This composable provides methods to interact with the FastAPI backend
 * for chart data management, including CRUD operations and history fetching.
 */

import { ref, shallowRef, type Ref, type ShallowRef } from 'vue';
import type {
  ChartData,
  CreateChartResponse,
  GetSeriesDataResponse,
  GetHistoryResponse,
  SetSeriesDataRequest,
  SetSeriesDataResponse,
  ApiError,
  HealthCheckResponse,
} from '../types';

/**
 * Type guard to check if a value is a valid ApiError object.
 */
function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.error === 'string' || typeof obj.detail === 'string';
}

/**
 * Extract error message from API error response.
 */
function extractErrorMessage(value: unknown, fallback: string): string {
  if (isApiError(value)) {
    return value.error || value.detail || fallback;
  }
  return fallback;
}

/**
 * Type guard to check if a value is a valid object (not null/array).
 */
function isValidResponseObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * API client state returned by the composable.
 */
export interface UseChartApiState {
  /** Whether a request is in progress */
  isLoading: Ref<boolean>;
  /** Last error message */
  error: Ref<string | null>;
  /** Last response data */
  data: ShallowRef<unknown>;
}

/**
 * API client methods returned by the composable.
 */
export interface UseChartApiMethods {
  /** Check backend health */
  healthCheck: () => Promise<HealthCheckResponse>;
  /** Create a new chart */
  createChart: (chartId: string, options?: Record<string, unknown>) => Promise<CreateChartResponse>;
  /** Get full chart data */
  getChart: (chartId: string) => Promise<ChartData>;
  /** Get series data with smart chunking */
  getSeriesData: (chartId: string, paneId: number, seriesId: string) => Promise<GetSeriesDataResponse>;
  /** Set series data */
  setSeriesData: (
    chartId: string,
    seriesId: string,
    request: SetSeriesDataRequest
  ) => Promise<SetSeriesDataResponse>;
  /** Get historical data chunk */
  getHistory: (
    chartId: string,
    paneId: number,
    seriesId: string,
    beforeTime: number,
    count?: number
  ) => Promise<GetHistoryResponse>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Return type of the useChartApi composable.
 */
export type UseChartApiReturn = UseChartApiState & UseChartApiMethods;

/**
 * Options for the useChartApi composable.
 */
export interface UseChartApiOptions {
  /** Base URL for the API (default: '/api/charts') */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom fetch implementation for testing */
  fetchFn?: typeof fetch;
}

/**
 * Vue 3 composable for interacting with the chart REST API.
 *
 * @param options - Configuration options
 * @returns API state and methods
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useChartApi } from '@lightweight-charts-pro/vue3';
 *
 * const { isLoading, error, getChart, setSeriesData } = useChartApi({
 *   baseUrl: 'http://localhost:8000/api/charts'
 * });
 *
 * // Load chart data
 * const chartData = await getChart('my-chart');
 *
 * // Update series data
 * await setSeriesData('my-chart', 'price', {
 *   seriesType: 'candlestick',
 *   data: [{ time: 1234567890, open: 100, high: 105, low: 98, close: 102 }]
 * });
 * </script>
 * ```
 */
export function useChartApi(options: UseChartApiOptions = {}): UseChartApiReturn {
  const {
    baseUrl = '/api/charts',
    timeout = 30000,
    fetchFn = fetch,
  } = options;

  // Reactive state
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const data = shallowRef<unknown>(null);

  /**
   * Make an HTTP request to the API.
   */
  async function request<T>(
    endpoint: string,
    init?: RequestInit
  ): Promise<T> {
    isLoading.value = true;
    error.value = null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
      const response = await fetchFn(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => ({}));
        const errorMessage = extractErrorMessage(
          errorData,
          `HTTP ${response.status}: ${response.statusText}`
        );
        throw new Error(errorMessage);
      }

      const result: unknown = await response.json();

      // Validate response is an object (basic structure check)
      if (!isValidResponseObject(result)) {
        throw new Error('Invalid API response: expected object');
      }

      // Type assertion after validation
      data.value = result;
      return result as T;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          error.value = 'Request timeout';
        } else {
          error.value = err.message;
        }
      } else {
        error.value = 'Unknown error occurred';
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      isLoading.value = false;
    }
  }

  /**
   * Check backend health status.
   */
  async function healthCheck(): Promise<HealthCheckResponse> {
    // Health endpoint is at root, not under charts
    const healthUrl = baseUrl.replace('/api/charts', '/health');
    return request<HealthCheckResponse>(healthUrl);
  }

  /**
   * Create a new chart.
   */
  async function createChart(
    chartId: string,
    chartOptions?: Record<string, unknown>
  ): Promise<CreateChartResponse> {
    return request<CreateChartResponse>(`/${chartId}`, {
      method: 'POST',
      body: JSON.stringify(chartOptions || {}),
    });
  }

  /**
   * Get full chart data including all series.
   */
  async function getChart(chartId: string): Promise<ChartData> {
    return request<ChartData>(`/${chartId}`);
  }

  /**
   * Get data for a specific series with smart chunking.
   *
   * Returns all data if below threshold (500 points),
   * or initial chunk with pagination metadata for large datasets.
   */
  async function getSeriesData(
    chartId: string,
    paneId: number,
    seriesId: string
  ): Promise<GetSeriesDataResponse> {
    return request<GetSeriesDataResponse>(`/${chartId}/data/${paneId}/${seriesId}`);
  }

  /**
   * Set data for a series.
   */
  async function setSeriesData(
    chartId: string,
    seriesId: string,
    requestData: SetSeriesDataRequest
  ): Promise<SetSeriesDataResponse> {
    return request<SetSeriesDataResponse>(`/${chartId}/data/${seriesId}`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * Get historical data chunk for infinite history loading.
   *
   * This method is called when the user scrolls near the edge
   * of currently loaded data.
   */
  async function getHistory(
    chartId: string,
    paneId: number,
    seriesId: string,
    beforeTime: number,
    count: number = 500
  ): Promise<GetHistoryResponse> {
    const params = new URLSearchParams({
      before_time: beforeTime.toString(),
      count: count.toString(),
    });
    return request<GetHistoryResponse>(
      `/${chartId}/history/${paneId}/${seriesId}?${params}`
    );
  }

  /**
   * Clear the error state.
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    isLoading,
    error,
    data,
    // Methods
    healthCheck,
    createChart,
    getChart,
    getSeriesData,
    setSeriesData,
    getHistory,
    clearError,
  };
}

export default useChartApi;
