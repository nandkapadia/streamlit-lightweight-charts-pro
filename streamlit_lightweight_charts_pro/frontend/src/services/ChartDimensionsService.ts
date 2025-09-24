/**
 * Service for managing chart and pane dimension calculations
 * Extracted from ChartCoordinateService for better separation of concerns
 */

import { IChartApi } from 'lightweight-charts';
import { ContainerDimensions, ScaleDimensions } from '../types/coordinates';
import { DIMENSIONS } from '../config/positioningConfig';

export interface ChartDimensionsOptions {
  minWidth?: number;
  minHeight?: number;
  maxAttempts?: number;
  baseDelay?: number;
}

export interface PaneDimensionsOptions {
  includeMargins?: boolean;
  includeScales?: boolean;
  validateDimensions?: boolean;
}

/**
 * Manages chart and pane dimension calculations
 */
export class ChartDimensionsService {
  private static instance: ChartDimensionsService;
  private paneDimensionsCache = new Map<
    string,
    {
      dimensions: { [paneId: number]: { width: number; height: number } };
      expiresAt: number;
    }
  >();

  static getInstance(): ChartDimensionsService {
    if (!this.instance) {
      this.instance = new ChartDimensionsService();
    }
    return this.instance;
  }

  /**
   * Get chart dimensions from API with validation
   */
  async getChartDimensionsFromAPI(
    chart: IChartApi,
    options: ChartDimensionsOptions = {}
  ): Promise<{ width: number; height: number } | null> {
    const {
      minWidth = DIMENSIONS.chart.minWidth,
      minHeight = DIMENSIONS.chart.minHeight,
      maxAttempts = 5,
      baseDelay = 100,
    } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (!chart || typeof chart.panes !== 'function') {
          throw new Error('Invalid chart API');
        }

        // Get chart dimensions from container element
        const containerElement = chart.chartElement();
        if (!containerElement) {
          throw new Error('Chart container element not available');
        }

        const rect = containerElement.getBoundingClientRect();
        const chartWidth = Math.floor(rect.width);
        const totalHeight = Math.floor(rect.height);

        // Validate dimensions
        if (chartWidth >= minWidth && totalHeight >= minHeight) {
          return { width: chartWidth, height: totalHeight };
        }

        // If dimensions are too small, wait and retry
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
        }
      } catch {
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
        }
      }
    }

    return null;
  }

  /**
   * Get chart dimensions from DOM elements
   */
  getChartDimensionsFromDOM(container: HTMLElement): { width: number; height: number } | null {
    try {
      if (!container || !container.getBoundingClientRect) {
        return null;
      }

      const rect = container.getBoundingClientRect();
      if (!rect || typeof rect.width !== 'number' || typeof rect.height !== 'number') {
        return null;
      }

      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      // Validate minimum dimensions
      if (width < DIMENSIONS.chart.minWidth || height < DIMENSIONS.chart.minHeight) {
        return null;
      }

      return { width, height };
    } catch {
      return null;
    }
  }

  /**
   * Get default chart dimensions as fallback
   */
  getDefaultChartDimensions(): { width: number; height: number } {
    return {
      width: DIMENSIONS.chart.defaultWidth,
      height: DIMENSIONS.chart.defaultHeight,
    };
  }

  /**
   * Get container dimensions with proper validation
   */
  getContainerDimensions(container: HTMLElement): ContainerDimensions {
    const rect = container.getBoundingClientRect();
    return {
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
      offsetTop: Math.floor(rect.top),
      offsetLeft: Math.floor(rect.left),
    };
  }

  /**
   * Get time scale dimensions
   */
  getTimeScaleDimensions(chart: IChartApi): ScaleDimensions {
    const height = this.getTimeScaleHeight(chart);
    const containerElement = chart.chartElement();
    const width = containerElement ? containerElement.clientWidth : DIMENSIONS.chart.defaultWidth;

    return {
      x: 0,
      y: 0,
      width: Math.floor(width),
      height: Math.floor(height),
    };
  }

  /**
   * Get price scale dimensions
   */
  getPriceScaleDimensions(chart: IChartApi, side: 'left' | 'right' = 'left'): ScaleDimensions {
    const width = this.getPriceScaleWidth(chart, side);
    const containerElement = chart.chartElement();
    const height = containerElement
      ? containerElement.clientHeight
      : DIMENSIONS.chart.defaultHeight;

    return {
      x: 0,
      y: 0,
      width: Math.floor(width),
      height: Math.floor(height),
    };
  }

  /**
   * Get time scale height from chart API
   */
  private getTimeScaleHeight(chart: IChartApi): number {
    try {
      if (chart && typeof chart.timeScale === 'function') {
        const timeScale = chart.timeScale();
        if (timeScale && typeof timeScale.height === 'function') {
          return timeScale.height();
        }
      }
    } catch {
      // Fallback to default
    }
    return DIMENSIONS.timeAxis.defaultHeight;
  }

  /**
   * Get price scale width from chart API
   */
  private getPriceScaleWidth(chart: IChartApi, side: 'left' | 'right' = 'left'): number {
    try {
      if (chart && typeof chart.priceScale === 'function') {
        const priceScale = chart.priceScale(side === 'left' ? 'left' : 'right');
        if (priceScale && typeof priceScale.width === 'function') {
          return priceScale.width();
        }
      }
    } catch {
      // Fallback to default
    }
    return DIMENSIONS.priceScale.defaultWidth;
  }

  /**
   * Clear expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.paneDimensionsCache.entries()) {
      if (now >= value.expiresAt) {
        this.paneDimensionsCache.delete(key);
      }
    }
  }
}
