/**
 * Service for managing pane-specific coordinate calculations
 * Extracted from ChartCoordinateService for better separation of concerns
 */

import { IChartApi } from 'lightweight-charts';
import { PaneCoordinates, BoundingBox, ElementPositionCoordinates } from '../types/coordinates';
import { ChartDimensionsService, PaneDimensionsOptions } from './ChartDimensionsService';
import { createBoundingBox } from '../utils/coordinateValidation';
import { DIMENSIONS, getMargins } from '../config/positioningConfig';

/**
 * Manages pane-specific coordinate calculations and positioning
 */
export class PaneCoordinatesService {
  private static instance: PaneCoordinatesService;
  private dimensionsService: ChartDimensionsService;

  constructor() {
    this.dimensionsService = ChartDimensionsService.getInstance();
  }

  static getInstance(): PaneCoordinatesService {
    if (!this.instance) {
      this.instance = new PaneCoordinatesService();
    }
    return this.instance;
  }

  /**
   * Get comprehensive pane coordinates
   */
  getPaneCoordinates(chart: IChartApi, paneId: number): PaneCoordinates | null {
    try {
      if (!chart || typeof paneId !== 'number' || paneId < 0) {
        return null;
      }

      const panes = chart.panes();
      if (!panes || paneId >= panes.length) {
        return null;
      }

      // Use fallback dimensions since IPaneApi doesn't have getSize()
      const chartContainer = chart.chartElement();
      if (!chartContainer) {
        return null;
      }

      const rect = chartContainer.getBoundingClientRect();
      const paneSize = {
        width: Math.floor(rect.width),
        height: Math.floor(rect.height / panes.length), // Distribute height equally among panes
      };

      // Calculate cumulative top offset from previous panes
      let cumulativeTop = 0;
      for (let i = 0; i < paneId; i++) {
        // Use estimated height since getSize() is not available
        cumulativeTop += paneSize.height;
      }

      // Add time scale height for main pane
      if (paneId === 0) {
        const timeScaleDimensions = this.dimensionsService.getTimeScaleDimensions(chart);
        cumulativeTop += timeScaleDimensions.height;
      }

      // Get chart container for absolute positioning
      const chartElement = chart.chartElement();
      const containerRect = chartElement ? chartElement.getBoundingClientRect() : null;

      const margins = getMargins('pane');
      const contentArea = this.calculateContentArea(chart);

      return {
        paneId,
        x: contentArea?.left || margins.left,
        y: cumulativeTop + (contentArea?.top || margins.top),
        width: paneSize.width,
        height: paneSize.height,
        absoluteX: (containerRect?.left || 0) + (contentArea?.left || margins.left),
        absoluteY: (containerRect?.top || 0) + cumulativeTop + (contentArea?.top || margins.top),
        contentArea: contentArea || {
          top: margins.top,
          left: margins.left,
          width: paneSize.width,
          height: paneSize.height,
        },
        margins,
        isMainPane: paneId === 0,
        isLastPane: this.isLastPane(chart, paneId),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get full pane bounds including all elements
   */
  getFullPaneBounds(chart: IChartApi, paneId: number): BoundingBox | null {
    try {
      if (!chart || typeof paneId !== 'number' || paneId < 0) {
        return null;
      }

      const panes = chart.panes();
      if (!panes || paneId >= panes.length) {
        return null;
      }

      // Use fallback dimensions since IPaneApi doesn't have getSize()
      const chartContainer = chart.chartElement();
      if (!chartContainer) {
        return null;
      }

      const rect = chartContainer.getBoundingClientRect();
      const paneSize = {
        width: Math.floor(rect.width),
        height: Math.floor(rect.height / panes.length), // Distribute height equally among panes
      };

      // Calculate cumulative top offset from previous panes
      let cumulativeTop = 0;
      for (let i = 0; i < paneId; i++) {
        // Use estimated height since getSize() is not available
        cumulativeTop += paneSize.height;
      }

      const priceScaleWidth = this.dimensionsService.getPriceScaleDimensions(chart).width;

      return createBoundingBox(priceScaleWidth, cumulativeTop, paneSize.width, paneSize.height);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get coordinates for all panes in the chart
   */
  getAllPaneCoordinates(chart: IChartApi): PaneCoordinates[] {
    const coordinates: PaneCoordinates[] = [];

    try {
      const panes = chart.panes();
      if (!panes) return coordinates;

      for (let i = 0; i < panes.length; i++) {
        const paneCoords = this.getPaneCoordinates(chart, i);
        if (paneCoords) {
          coordinates.push(paneCoords);
        }
      }
    } catch (error) {
      // Return empty array on error
    }

    return coordinates;
  }

  /**
   * Get pane coordinates from DOM elements as fallback
   */
  getPaneCoordinatesFromDOM(
    container: HTMLElement,
    paneId: number,
    options: PaneDimensionsOptions = {}
  ): PaneCoordinates | null {
    try {
      const { includeMargins = true, validateDimensions = true } = options;

      // Find pane elements in the DOM
      const paneElements = container.querySelectorAll('[data-name="pane"]');
      if (!paneElements || paneId >= paneElements.length) {
        return null;
      }

      const paneElement = paneElements[paneId] as HTMLElement;
      if (!paneElement) {
        return null;
      }

      const rect = paneElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const relativeX = rect.left - containerRect.left;
      const relativeY = rect.top - containerRect.top;

      const margins = includeMargins
        ? getMargins('pane')
        : { top: 0, left: 0, right: 0, bottom: 0 };

      const coordinates: PaneCoordinates = {
        paneId,
        x: Math.floor(relativeX),
        y: Math.floor(relativeY),
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
        absoluteX: Math.floor(rect.left),
        absoluteY: Math.floor(rect.top),
        contentArea: {
          top: Math.floor(relativeY + margins.top),
          left: Math.floor(relativeX + margins.left),
          width: Math.floor(rect.width - margins.left - margins.right),
          height: Math.floor(rect.height - margins.top - margins.bottom),
        },
        margins,
        isMainPane: paneId === 0,
        isLastPane: paneId === paneElements.length - 1,
      };

      // Validate dimensions if requested
      if (validateDimensions) {
        if (
          coordinates.width < DIMENSIONS.pane.minWidth ||
          coordinates.height < DIMENSIONS.pane.minHeight
        ) {
          return null;
        }
      }

      return coordinates;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate element position within a pane
   */
  calculateElementPosition(
    paneCoords: PaneCoordinates,
    elementWidth: number,
    elementHeight: number,
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right',
    offset: { x: number; y: number } = { x: 0, y: 0 }
  ): ElementPositionCoordinates {
    const baseX = paneCoords.contentArea.left;
    const baseY = paneCoords.contentArea.top;
    const contentWidth = paneCoords.contentArea.width;
    const contentHeight = paneCoords.contentArea.height;

    let x: number;
    let y: number;

    switch (corner) {
      case 'top-left':
        x = baseX + offset.x;
        y = baseY + offset.y;
        break;
      case 'top-right':
        x = baseX + contentWidth - elementWidth - offset.x;
        y = baseY + offset.y;
        break;
      case 'bottom-left':
        x = baseX + offset.x;
        y = baseY + contentHeight - elementHeight - offset.y;
        break;
      case 'bottom-right':
        x = baseX + contentWidth - elementWidth - offset.x;
        y = baseY + contentHeight - elementHeight - offset.y;
        break;
      default:
        x = baseX + offset.x;
        y = baseY + offset.y;
    }

    return {
      x: Math.floor(x),
      y: Math.floor(y),
      width: elementWidth,
      height: elementHeight,
      corner,
      offset,
    };
  }

  /**
   * Check if pane size has changed significantly
   */
  hasPaneSizeChanges(
    previousCoords: PaneCoordinates,
    currentCoords: PaneCoordinates,
    threshold: number = 5
  ): boolean {
    const widthDiff = Math.abs(previousCoords.width - currentCoords.width);
    const heightDiff = Math.abs(previousCoords.height - currentCoords.height);

    return widthDiff > threshold || heightDiff > threshold;
  }

  /**
   * Calculate the content area excluding scales and margins
   */
  private calculateContentArea(chart: IChartApi): {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null {
    try {
      const priceScaleWidth = this.dimensionsService.getPriceScaleDimensions(chart).width;
      const timeScaleHeight = this.dimensionsService.getTimeScaleDimensions(chart).height;
      const chartElement = chart.chartElement();

      if (!chartElement) {
        return null;
      }

      const rect = chartElement.getBoundingClientRect();
      const margins = getMargins('pane');

      return {
        top: margins.top,
        left: priceScaleWidth + margins.left,
        width: rect.width - priceScaleWidth - margins.left - margins.right,
        height: rect.height - timeScaleHeight - margins.top - margins.bottom,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if this is the last pane in the chart
   */
  private isLastPane(chart: IChartApi, paneId: number): boolean {
    try {
      const panes = chart.panes();
      return panes ? paneId === panes.length - 1 : true;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get axis dimensions for coordinate calculations
   */
  getAxisDimensions(chart: IChartApi): {
    timeScale: { width: number; height: number };
    priceScale: { width: number; height: number };
  } {
    return {
      timeScale: this.dimensionsService.getTimeScaleDimensions(chart),
      priceScale: this.dimensionsService.getPriceScaleDimensions(chart),
    };
  }
}
