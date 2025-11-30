/**
 * @fileoverview Streamlit Implementation of BackendSyncAdapter
 *
 * Wraps StreamlitSeriesConfigService to provide the BackendSyncAdapter interface.
 * This allows core services to remain framework-agnostic while supporting
 * Streamlit-specific backend synchronization.
 */

import {
  BackendSyncAdapter,
  SeriesConfiguration,
  SeriesType,
} from 'lightweight-charts-pro-core';
import { StreamlitSeriesConfigService } from './StreamlitSeriesConfigService';

/**
 * Streamlit implementation of BackendSyncAdapter
 *
 * Delegates to StreamlitSeriesConfigService for actual backend communication
 * via Streamlit's setComponentValue API.
 */
export class StreamlitBackendSyncAdapter implements BackendSyncAdapter {
  private service: StreamlitSeriesConfigService;

  constructor(service: StreamlitSeriesConfigService) {
    this.service = service;
  }

  recordConfigChange(
    paneId: number,
    seriesId: string,
    seriesType: SeriesType,
    config: SeriesConfiguration,
    chartId?: string
  ): void {
    this.service.recordConfigChange(paneId, seriesId, seriesType, config, chartId);
  }

  getSeriesConfig(
    paneId: number,
    seriesId: string,
    chartId?: string
  ): SeriesConfiguration | null {
    return this.service.getSeriesConfig(paneId, seriesId, chartId);
  }

  forceSyncToBackend(): void {
    this.service.forceSyncToBackend();
  }

  clearPendingChanges(): void {
    this.service.clearPendingChanges();
  }

  restoreFromBackend(backendData: any): void {
    this.service.restoreFromBackend(backendData);
  }

  /**
   * Get the underlying Streamlit service (for advanced usage)
   */
  getService(): StreamlitSeriesConfigService {
    return this.service;
  }
}
