/**
 * @fileoverview Chart Ready Detection Utilities
 *
 * Utility class for detecting when charts are fully initialized and ready for use.
 * Provides multiple fallback methods with exponential backoff retry logic.
 *
 * This module provides:
 * - Chart dimension validation
 * - Primitive attachment readiness checks
 * - Series data validation
 * - Coordinate system verification
 *
 * Features:
 * - Multiple detection methods with fallbacks
 * - Exponential backoff retry logic
 * - Integration with ChartCoordinateService
 * - Comprehensive readiness validation
 * - Error handling and timeout management
 *
 * @example
 * ```typescript
 * import { ChartReadyDetector } from './chartReadyDetection';
 *
 * // Wait for chart to be ready
 * const isReady = await ChartReadyDetector.waitForChartReady(
 *   chart,
 *   container,
 *   { minWidth: 400, minHeight: 300 }
 * );
 *
 * // Wait for primitives attachment readiness
 * const canAttach = await ChartReadyDetector.waitForChartReadyForPrimitives(
 *   chart,
 *   series,
 *   'chart-1'
 * );
 * ```
 */

import { IChartApi, ISeriesApi, UTCTimestamp, Logical } from 'lightweight-charts';
import { ChartCoordinateService } from '../services/ChartCoordinateService';

/**
 * Utility class for detecting when charts are ready with multiple fallback methods.
 *
 * Enhanced with comprehensive readiness checks using existing coordinate services
 * for consistent validation across the application.
 */
export class ChartReadyDetector {
  /**
   * Wait for chart to be fully ready with proper dimensions (legacy method)
   */
  static async waitForChartReady(
    chart: IChartApi,
    container: HTMLElement,
    options: {
      minWidth?: number;
      minHeight?: number;
      maxAttempts?: number;
      baseDelay?: number;
    } = {}
  ): Promise<boolean> {
    const { minWidth = 100, minHeight = 100, maxAttempts = 15, baseDelay = 200 } = options;

    return new Promise(resolve => {
      const checkReady = (attempts = 0) => {
        try {
          if (chart && container) {
            // Method 1: Try chart API first
            try {
              const chartElement = chart.chartElement();
              if (chartElement) {
                const chartRect = chartElement.getBoundingClientRect();
                if (chartRect.width >= minWidth && chartRect.height >= minHeight) {
                  resolve(true);
                  return;
                }
              }
            } catch {
              // Chart API method failed, trying DOM fallback
            }

            // Method 2: DOM fallback
            try {
              const containerRect = container.getBoundingClientRect();
              if (containerRect.width >= minWidth && containerRect.height >= minHeight) {
                resolve(true);
                return;
              }
            } catch {
              // DOM method failed
            }
          }

          if (attempts < maxAttempts) {
            const delay = baseDelay * Math.pow(1.5, attempts);
            setTimeout(() => checkReady(attempts + 1), delay);
          } else {
            resolve(false);
          }
        } catch {
          if (attempts < maxAttempts) {
            const delay = baseDelay * Math.pow(1.5, attempts);
            setTimeout(() => checkReady(attempts + 1), delay);
          } else {
            resolve(false);
          }
        }
      };

      checkReady();
    });
  }

  /**
   * Comprehensive chart readiness check for primitives attachment
   * Uses existing coordinate services for consistency and performance
   */
  static async waitForChartReadyForPrimitives(
    chart: IChartApi,
    series: ISeriesApi<any>,
    options: {
      testTime?: UTCTimestamp;
      testPrice?: number;
      maxAttempts?: number;
      baseDelay?: number;
      requireData?: boolean;
    } = {}
  ): Promise<boolean> {
    const { testTime, testPrice, maxAttempts = 30, baseDelay = 150, requireData = true } = options;

    const coordinateService = ChartCoordinateService.getInstance();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Step 1: Use existing coordinate service to validate chart dimensions
        const chartElement = chart.chartElement();
        if (!chartElement) {
          throw new Error('Chart element not found');
        }

        const validatedDimensions = await coordinateService.getValidatedChartDimensions(
          chart,
          chartElement,
          {
            minWidth: 200,
            minHeight: 200,
            maxAttempts: 1, // We handle retries at this level
            baseDelay: 0,
          }
        );

        if (!validatedDimensions) {
          throw new Error('Chart dimensions validation failed');
        }

        // Step 2: Validate time scale has visible range (data is loaded)
        const timeScale = chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        const logicalRange = timeScale.getVisibleLogicalRange();

        if (!visibleRange || !logicalRange) {
          throw new Error(
            `Missing ranges - visible: ${!!visibleRange}, logical: ${!!logicalRange}`
          );
        }

        // Step 3: Check series data availability (if required)
        if (requireData) {
          const seriesData = series.data();
          if (!seriesData || seriesData.length === 0) {
            throw new Error('No series data');
          }
        }

        // Step 4: Test coordinate conversion using ACTUAL chart data timestamps
        let timeForTest = testTime;
        let priceForTest = testPrice;

        // CRITICAL: Use actual series data timestamps, not calculated ranges
        if (timeForTest === undefined || priceForTest === undefined) {
          try {
            const seriesData = series.data();
            if (seriesData && seriesData.length > 0) {
              // Use middle data point for realistic testing
              const midIndex = Math.floor(seriesData.length / 2);
              const midPoint = seriesData[midIndex];

              if (timeForTest === undefined) {
                timeForTest =
                  (midPoint?.time as UTCTimestamp) ||
                  ((((visibleRange.from as number) + (visibleRange.to as number)) /
                    2) as UTCTimestamp);
              }

              if (priceForTest === undefined) {
                priceForTest =
                  midPoint?.value || midPoint?.close || midPoint?.high || midPoint?.low || 100;
              }
            } else {
              // Fallback to visible range calculation
              timeForTest = (((visibleRange.from as number) + (visibleRange.to as number)) /
                2) as UTCTimestamp;
              priceForTest = 100;
            }
          } catch {
            timeForTest = (((visibleRange.from as number) + (visibleRange.to as number)) /
              2) as UTCTimestamp;
            priceForTest = 100;
          }
        }

        const logicalForTest = (logicalRange.from + logicalRange.to) / 2;

        const testX = timeScale.timeToCoordinate(timeForTest as UTCTimestamp);
        const testLogicalX = timeScale.logicalToCoordinate(logicalForTest as Logical);
        const testY = priceForTest !== undefined ? series.priceToCoordinate(priceForTest) : null;

        if (
          testX === null ||
          testLogicalX === null ||
          testY === null ||
          !isFinite(testX) ||
          !isFinite(testLogicalX) ||
          !isFinite(testY)
        ) {
          throw new Error(
            `Coordinate conversion failed - X: ${testX}, LogicalX: ${testLogicalX}, Y: ${testY}`
          );
        }

        // All checks passed - chart is ready for primitives
        return true;
      } catch {
        // Log attempt for debugging with more details
      }

      // Wait before next attempt with exponential backoff
      if (attempt < maxAttempts - 1) {
        const delay = baseDelay * Math.pow(1.2, attempt) + Math.random() * 50;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All attempts failed

    return false;
  }

  /**
   * Quick synchronous check if chart is ready for primitives
   * Uses existing coordinate service for consistency
   */
  static isChartReadyForPrimitivesSync(
    chart: IChartApi,
    series: ISeriesApi<any>,
    options: {
      testTime?: UTCTimestamp;
      testPrice?: number;
      requireData?: boolean;
    } = {}
  ): boolean {
    const { testTime, testPrice, requireData = true } = options;
    const coordinateService = ChartCoordinateService.getInstance();

    try {
      // Step 1: Use existing coordinate service to check dimensions
      const chartElement = chart.chartElement();
      if (!chartElement) return false;

      // Use the coordinate service's dimension validation
      const testDimensions = {
        container: {
          width: chartElement.getBoundingClientRect().width,
          height: chartElement.getBoundingClientRect().height,
        },
      };

      if (!coordinateService.areChartDimensionsObjectValid(testDimensions, 200, 200)) {
        return false;
      }

      // Step 2: Check visible time range (data loaded)
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      const logicalRange = timeScale.getVisibleLogicalRange();
      if (!visibleRange || !logicalRange) return false;

      // Step 3: Check series data (if required)
      if (requireData) {
        const seriesData = series.data();
        if (!seriesData || seriesData.length === 0) return false;
      }

      // Step 4: Test coordinate conversion (if test coordinates provided)
      if (testTime !== undefined && testPrice !== undefined) {
        const testX = timeScale.timeToCoordinate(testTime);
        const testY = series.priceToCoordinate(testPrice);

        if (testX === null || testY === null || isNaN(testX) || isNaN(testY)) return false;

        // Check bounds using validated dimensions
        const chartRect = chartElement.getBoundingClientRect();
        if (testX < 0 || testY < 0 || testX > chartRect.width || testY > chartRect.height)
          return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if chart is ready synchronously (for immediate checks)
   */
  static isChartReadySync(
    chart: IChartApi | null,
    container: HTMLElement | null,
    minWidth: number = 100,
    minHeight: number = 100
  ): boolean {
    try {
      if (!chart || !container) return false;

      // Try chart API first
      try {
        const chartElement = chart.chartElement();
        if (chartElement) {
          const chartRect = chartElement.getBoundingClientRect();
          if (chartRect.width >= minWidth && chartRect.height >= minHeight) {
            return true;
          }
        }
      } catch {
        // API method failed, continue to DOM
      }

      // Try DOM fallback
      try {
        const containerRect = container.getBoundingClientRect();
        return containerRect.width >= minWidth && containerRect.height >= minHeight;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Wait for specific chart element to be ready
   */
  static async waitForElementReady(
    selector: string,
    container: HTMLElement,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
    } = {}
  ): Promise<Element | null> {
    const { maxAttempts = 10, baseDelay = 100 } = options;

    return new Promise(resolve => {
      const checkElement = (attempts = 0) => {
        try {
          const element = container.querySelector(selector);
          if (element) {
            resolve(element);
            return;
          }

          if (attempts < maxAttempts) {
            const delay = baseDelay * Math.pow(1.5, attempts);
            setTimeout(() => checkElement(attempts + 1), delay);
          } else {
            resolve(null);
          }
        } catch {
          if (attempts < maxAttempts) {
            const delay = baseDelay * Math.pow(1.5, attempts);
            setTimeout(() => checkElement(attempts + 1), delay);
          } else {
            resolve(null);
          }
        }
      };

      checkElement();
    });
  }
}
