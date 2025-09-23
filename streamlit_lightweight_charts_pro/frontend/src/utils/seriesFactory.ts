import { MutableRefObject } from 'react';
import {
  IChartApi,
  ISeriesApi,
  AreaSeries,
  LineSeries,
  BarSeries,
  CandlestickSeries,
  HistogramSeries,
  BaselineSeries,
  createSeriesMarkers,
} from 'lightweight-charts';
import { SeriesConfig } from '../types';
import { ExtendedSeriesApi, ExtendedChartApi } from '../types/ChartInterfaces';
import { createBandSeries, BandData } from '../plugins/series/bandSeriesPlugin';
import {
  SignalSeries,
  createSignalSeriesPlugin,
  SignalData,
} from '../plugins/series/signalSeriesPlugin';
import { RibbonSeries, RibbonData } from '../plugins/series/ribbonSeriesPlugin';
import {
  createGradientRibbonSeries,
  GradientRibbonData,
} from '../plugins/series/gradientRibbonSeriesPlugin';
import { cleanLineStyleOptions } from './lineStyle';
import { createTradeVisualElements } from '../services/tradeVisualization';

interface SeriesFactoryContext {
  signalPluginRefs?: MutableRefObject<{ [key: string]: SignalSeries }>;
}

export function createSeries(
  chart: IChartApi,
  seriesConfig: SeriesConfig,
  context: SeriesFactoryContext = {},
  chartId?: string,
  seriesIndex?: number
): ISeriesApi<any> | null {
  const { signalPluginRefs } = context;

  // Validate inputs - throw errors for invalid inputs
  if (!chart) {
    throw new Error('Chart is required');
  }

  if (!seriesConfig) {
    throw new Error('Series configuration is required');
  }

  if (!seriesConfig.type) {
    throw new Error('Series type is required');
  }

  // Check if chart has addSeries method
  if (typeof chart.addSeries !== 'function') {
    throw new Error('Chart does not have addSeries method');
  }

  const {
    type,
    data,
    options = {},
    priceScale,
    lastValueVisible: topLevelLastValueVisible,
    lastPriceAnimation,
    priceLineVisible: topLevelPriceLineVisible,
    priceLineSource: topLevelPriceLineSource,
    priceLineWidth: topLevelPriceLineWidth,
    priceLineColor: topLevelPriceLineColor,
    priceLineStyle: topLevelPriceLineStyle,
    priceScaleId: topLevelPriceScaleId,
  } = seriesConfig;

  const lastValueVisible =
    topLevelLastValueVisible !== undefined ? topLevelLastValueVisible : options.lastValueVisible;
  const priceLineVisible =
    topLevelPriceLineVisible !== undefined ? topLevelPriceLineVisible : options.priceLineVisible;
  const priceLineSource =
    topLevelPriceLineSource !== undefined ? topLevelPriceLineSource : options.priceLineSource;
  const priceLineWidth =
    topLevelPriceLineWidth !== undefined ? topLevelPriceLineWidth : options.priceLineWidth;
  const priceLineColor =
    topLevelPriceLineColor !== undefined ? topLevelPriceLineColor : options.priceLineColor;
  const priceLineStyle =
    topLevelPriceLineStyle !== undefined ? topLevelPriceLineStyle : options.priceLineStyle;
  const priceScaleId =
    topLevelPriceScaleId !== undefined ? topLevelPriceScaleId : options.priceScaleId;

  // Extract paneId from seriesConfig and ensure it has a default value
  const finalPaneId: number = seriesConfig.paneId !== undefined ? seriesConfig.paneId : 0;

  let series: ISeriesApi<any>;
  const normalizedType = type?.toLowerCase();
  const { priceFormat, ...otherOptions } = options;
  const cleanedOptions = cleanLineStyleOptions(otherOptions);

  // No Z-index needed - using Z-order system for primitives

  switch (normalizedType) {
    case 'area': {
      const areaOptions: any = {
        ...cleanedOptions,
        lineColor: cleanedOptions.color || '#2196F3',
        topColor: cleanedOptions.topColor || 'rgba(33, 150, 243, 0.4)',
        bottomColor: cleanedOptions.bottomColor || 'rgba(33, 150, 243, 0.0)',
        lineWidth: cleanedOptions.lineWidth || 2,
        relativeGradient: cleanedOptions.relativeGradient || false,
        invertFilledArea: cleanedOptions.invertFilledArea || false,
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        lastPriceAnimation: lastPriceAnimation !== undefined ? lastPriceAnimation : 0,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2,
      };
      if (priceFormat) {
        areaOptions.priceFormat = priceFormat;
      }
      series = chart.addSeries(AreaSeries, areaOptions, finalPaneId);
      try {
        if (lastValueVisible === false) {
          series.applyOptions({ lastValueVisible: false });
        }
      } catch {
        // ignore
      }
      break;
    }
    case 'band': {
      try {
        const bandSeriesOptions: any = {
          upperLine: cleanedOptions.upperLine || {
            color: '#4CAF50',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true,
          },
          middleLine: cleanedOptions.middleLine || {
            color: '#2196F3',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true,
          },
          lowerLine: cleanedOptions.lowerLine || {
            color: '#F44336',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true,
          },
          upperFillColor: cleanedOptions.upperFillColor || 'rgba(76, 175, 80, 0.1)',
          lowerFillColor: cleanedOptions.lowerFillColor || 'rgba(244, 67, 54, 0.1)',
          upperFill: cleanedOptions.upperFill !== undefined ? cleanedOptions.upperFill : true,
          lowerFill: cleanedOptions.lowerFill !== undefined ? cleanedOptions.lowerFill : true,
          priceScaleId: priceScaleId || 'right',
          visible: cleanedOptions.visible !== false,
          lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
          priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
          priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
          priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
          priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
          priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2,
        };
        const bandSeries = createBandSeries(chart, bandSeriesOptions);
        if (data && data.length > 0) {
          bandSeries.setData(data as BandData[]);
        }
        return {
          setData: (newData: any[]) => {
            try {
              bandSeries.setData(newData as BandData[]);
            } catch (error) {
              console.error('Failed to set band series data:', error);
            }
          },
          update: (newData: any) => {
            try {
              bandSeries.update(newData as BandData);
            } catch (error) {
              console.error('Failed to update band series:', error);
            }
          },
          applyOptions: (options: any) => {
            try {
              bandSeries.setOptions(cleanLineStyleOptions(options));
            } catch (error) {
              console.error('Failed to apply band series options:', error);
            }
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right');
            } catch {
              return null;
            }
          },
          remove: () => {
            try {
              bandSeries.remove();
            } catch (error) {
              console.error('Failed to remove band series:', error);
            }
          },
        } as unknown as ISeriesApi<any>;
      } catch {
        return null;
      }
    }
    case 'ribbon': {
      try {
        const ribbonSeriesOptions: any = {
          upperLine: cleanedOptions.upperLine || {
            color: '#4CAF50',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true,
          },
          lowerLine: cleanedOptions.lowerLine || {
            color: '#F44336',
            lineStyle: 0,
            lineWidth: 2,
            lineVisible: true,
          },
          fill: cleanedOptions.fill || 'rgba(76, 175, 80, 0.1)',
          fillVisible: cleanedOptions.fillVisible !== false,
          priceScaleId: priceScaleId || 'right',
          visible: cleanedOptions.visible !== false,
          lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
          priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
          priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
          priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
          priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
          priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2,
        };

        const ribbonSeries = new RibbonSeries(chart, ribbonSeriesOptions);
        if (data && data.length > 0) {
          ribbonSeries.setData(data as RibbonData[]);
        }

        return {
          setData: (newData: any[]) => {
            try {
              ribbonSeries.setData(newData);
            } catch (error) {
              console.error('Failed to set ribbon series data:', error);
            }
          },
          update: (newData: any) => {
            try {
              // For ribbon, update the entire dataset
              ribbonSeries.setData([newData]);
            } catch (error) {
              console.error('Failed to update ribbon series:', error);
            }
          },
          applyOptions: (options: any) => {
            try {
              ribbonSeries.setOptions(cleanLineStyleOptions(options));
            } catch (error) {
              console.error('Failed to apply ribbon series options:', error);
            }
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right');
            } catch {
              return null;
            }
          },
          remove: () => {
            try {
              // For primitives, we need to detach from the series
              // The series will handle cleanup when removed
              ribbonSeries.remove();
            } catch (error) {
              console.error('Failed to remove ribbon series:', error);
            }
          },
        } as unknown as ISeriesApi<any>;
      } catch (error) {
        return null;
      }
    }
    case 'gradient_ribbon': {
      try {
        // Map backend property names to frontend expected names
        const mapLineOptions = (lineOpts: any, defaultColor: string = '#4CAF50') => {
          if (!lineOpts)
            return {
              color: defaultColor,
              lineStyle: 0,
              lineWidth: 2,
              visible: true,
            };
          return {
            color: lineOpts.color || defaultColor,
            lineStyle:
              lineOpts.lineStyle !== undefined ? lineOpts.lineStyle : lineOpts.lineType || 0,
            lineWidth: lineOpts.lineWidth || 2,
            visible:
              lineOpts.visible !== undefined ? lineOpts.visible : lineOpts.lineVisible !== false,
          };
        };

        const gradientRibbonSeriesOptions: any = {
          upperLine: mapLineOptions(cleanedOptions.upperLine, '#4CAF50'),
          lowerLine: mapLineOptions(cleanedOptions.lowerLine, '#F44336'),
          fill: cleanedOptions.fill || 'rgba(76, 175, 80, 0.3)',
          fillVisible: cleanedOptions.fillVisible !== false,
          gradientStartColor: cleanedOptions.gradientStartColor || '#4CAF50',
          gradientEndColor: cleanedOptions.gradientEndColor || '#F44336',
          normalizeGradients: cleanedOptions.normalizeGradients || false,
          priceScaleId: priceScaleId || 'right',
          visible: cleanedOptions.visible !== false,
          zIndex: cleanedOptions.zIndex || 100,
        };

        const gradientRibbonSeries = createGradientRibbonSeries(chart, gradientRibbonSeriesOptions);
        if (data && data.length > 0) {
          gradientRibbonSeries.setData(data as GradientRibbonData[]);
        }

        return {
          setData: (newData: any[]) => {
            try {
              gradientRibbonSeries.setData(newData as GradientRibbonData[]);
            } catch (error) {
              console.error('Failed to set gradient ribbon series data:', error);
            }
          },
          update: (newData: any) => {
            try {
              gradientRibbonSeries.updateData([newData]);
            } catch (error) {
              console.error('Failed to update gradient ribbon series:', error);
            }
          },
          applyOptions: (options: any) => {
            try {
              gradientRibbonSeries.applyOptions(cleanLineStyleOptions(options));
            } catch (error) {
              console.error('Failed to apply gradient ribbon series options:', error);
            }
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right');
            } catch {
              return null;
            }
          },
          remove: () => {
            try {
              gradientRibbonSeries.destroy();
            } catch (error) {
              console.error('Failed to remove gradient ribbon series:', error);
            }
          },
        } as unknown as ISeriesApi<any>;
      } catch (error) {
        return null;
      }
    }
    case 'signal': {
      try {
        const signalSeries = createSignalSeriesPlugin(chart, {
          type: 'signal',
          data: (data || []) as SignalData[],
          options: {
            neutralColor: cleanedOptions.neutralColor || '#f0f0f0',
            signalColor: cleanedOptions.signalColor || '#ff0000',
            alertColor: cleanedOptions.alertColor,
            visible: cleanedOptions.visible !== false,
          },
          paneId: finalPaneId,
        });
        if (signalPluginRefs && chartId !== undefined && seriesIndex !== undefined) {
          signalPluginRefs.current[`${chartId}-${seriesIndex}`] = signalSeries;
        }
        return {
          setData: (newData: any[]) => {
            try {
              signalSeries.updateData(newData);
            } catch (error) {
              console.error('Failed to set signal series data:', error);
            }
          },
          update: (newData: any) => {
            try {
              signalSeries.updateData([newData]);
            } catch (error) {
              console.error('Failed to update signal series:', error);
            }
          },
          applyOptions: (options: any) => {
            try {
              signalSeries.updateOptions({
                neutralColor: options.neutralColor || '#f0f0f0',
                signalColor: options.signalColor || '#ff0000',
                alertColor: options.alertColor,
                visible: options.visible !== false,
              });
            } catch (error) {
              console.error('Failed to apply signal series options:', error);
            }
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right');
            } catch {
              return null;
            }
          },
          remove: () => {
            try {
              signalSeries.destroy();
              if (signalPluginRefs && chartId !== undefined && seriesIndex !== undefined) {
                delete signalPluginRefs.current[`${chartId}-${seriesIndex}`];
              }
            } catch (error) {
              console.error('Failed to remove signal series:', error);
            }
          },
        } as unknown as ISeriesApi<any>;
      } catch {
        return null;
      }
    }
    case 'trend_fill': {
      try {
        // Create the trend fill series directly (following band series pattern)
        const trendFillOptions = {
          uptrendFillColor: cleanedOptions.uptrendFillColor || 'rgba(76, 175, 80, 0.3)',
          downtrendFillColor: cleanedOptions.downtrendFillColor || 'rgba(244, 67, 54, 0.3)',
          trendLine: {
            color: cleanedOptions.trendLine?.color || '#4CAF50',
            lineWidth: cleanedOptions.trendLine?.lineWidth || 2,
            lineStyle: cleanedOptions.trendLine?.lineStyle || 0,
            visible: cleanedOptions.trendLine?.visible !== false,
          },
          baseLine: {
            color: cleanedOptions.baseLine?.color || '#666666',
            lineWidth: cleanedOptions.baseLine?.lineWidth || 1,
            lineStyle: cleanedOptions.baseLine?.lineStyle || 1,
            visible: cleanedOptions.baseLine?.visible !== false,
          },
          visible: cleanedOptions.visible !== false,
          priceScaleId: cleanedOptions.priceScaleId || 'right',
        };

        // Create the primitive series directly (no dummy series needed)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { TrendFillSeries } = require('../plugins/series/trendFillSeriesPlugin');
        const trendFillSeries = new TrendFillSeries(chart, trendFillOptions, 0);

        // Set the data
        trendFillSeries.setData(data || []);

        return {
          setData: (newData: any[]) => {
            try {
              trendFillSeries.setData(newData);
            } catch (error) {
              // Error setting trend fill data - fail silently
            }
          },
          update: (newData: any) => {
            try {
              trendFillSeries.updateData([newData]);
            } catch (error) {
              // Error updating trend fill data - fail silently
            }
          },
          applyOptions: (options: any) => {
            try {
              trendFillSeries.applyOptions(options);
            } catch (error) {
              // Error applying trend fill options - fail silently
            }
          },
          priceScale: () => {
            try {
              return chart.priceScale(priceScaleId || 'right');
            } catch {
              return null;
            }
          },
          remove: () => {
            try {
              trendFillSeries.destroy();
            } catch (error) {
              // Error removing trend fill series - fail silently
            }
          },
        } as unknown as ISeriesApi<any>;
      } catch (error) {
        return null;
      }
    }
    case 'baseline': {
      const baselineOptions: any = {
        ...cleanedOptions,
        baseValue: cleanedOptions.baseValue || { price: 0 },
        topLineColor: cleanedOptions.topLineColor || 'rgba(76, 175, 80, 0.4)',
        topFillColor1: cleanedOptions.topFillColor1 || 'rgba(76, 175, 80, 0.0)',
        topFillColor2: cleanedOptions.topFillColor2 || 'rgba(76, 175, 80, 0.4)',
        bottomLineColor: cleanedOptions.bottomLineColor || 'rgba(255, 82, 82, 0.4)',
        bottomFillColor1: cleanedOptions.bottomFillColor1 || 'rgba(255, 82, 82, 0.4)',
        bottomFillColor2: cleanedOptions.bottomFillColor2 || 'rgba(255, 82, 82, 0.0)',
        lineWidth: cleanedOptions.lineWidth || 2,
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2,
      };
      if (priceFormat) {
        baselineOptions.priceFormat = priceFormat;
      }
      series = chart.addSeries(BaselineSeries, baselineOptions, finalPaneId);
      break;
    }
    case 'histogram': {
      // Check if data contains individual colors - FIXED VERSION
      const hasIndividualColors =
        seriesConfig.data && seriesConfig.data.some((point: any) => point.color);

      const histogramOptions: any = {
        ...cleanedOptions,
        priceFormat: priceFormat || {
          type: 'volume',
        },
        priceScaleId: priceScaleId || '',
        scaleMargins: cleanedOptions.scaleMargins || {
          top: 0.75,
          bottom: 0,
        },
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        // Only set static color if no individual colors are present in data
        color: hasIndividualColors ? undefined : cleanedOptions.color || '#2196F3',
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2,
      };
      if (priceFormat) {
        histogramOptions.priceFormat = priceFormat;
      }
      series = chart.addSeries(HistogramSeries, histogramOptions, finalPaneId);
      break;
    }
    case 'line': {
      // Process lineOptions if provided
      const lineSpecificOptions = seriesConfig.lineOptions || {};

      const lineOptions: any = {
        ...cleanedOptions,
        // Apply line-specific options from lineOptions object
        lineStyle:
          lineSpecificOptions.lineStyle !== undefined
            ? lineSpecificOptions.lineStyle
            : cleanedOptions.lineStyle,
        lineType:
          lineSpecificOptions.lineType !== undefined
            ? lineSpecificOptions.lineType
            : cleanedOptions.lineType,
        lineVisible:
          lineSpecificOptions.lineVisible !== undefined
            ? lineSpecificOptions.lineVisible
            : cleanedOptions.lineVisible,
        pointMarkersVisible:
          lineSpecificOptions.pointMarkersVisible !== undefined
            ? lineSpecificOptions.pointMarkersVisible
            : cleanedOptions.pointMarkersVisible,
        pointMarkersRadius:
          lineSpecificOptions.pointMarkersRadius !== undefined
            ? lineSpecificOptions.pointMarkersRadius
            : cleanedOptions.crosshairMarkerRadius,
        crosshairMarkerVisible:
          lineSpecificOptions.crosshairMarkerVisible !== undefined
            ? lineSpecificOptions.crosshairMarkerVisible
            : cleanedOptions.crosshairMarkerVisible,
        crosshairMarkerRadius:
          lineSpecificOptions.crosshairMarkerRadius !== undefined
            ? lineSpecificOptions.crosshairMarkerRadius
            : cleanedOptions.crosshairMarkerRadius,
        crosshairMarkerBorderColor:
          lineSpecificOptions.crosshairMarkerBorderColor !== undefined
            ? lineSpecificOptions.crosshairMarkerBorderColor
            : cleanedOptions.crosshairMarkerBorderColor,
        crosshairMarkerBackgroundColor:
          lineSpecificOptions.crosshairMarkerBackgroundColor !== undefined
            ? lineSpecificOptions.crosshairMarkerBackgroundColor
            : cleanedOptions.crosshairMarkerBackgroundColor,
        crosshairMarkerBorderWidth:
          lineSpecificOptions.crosshairMarkerBorderWidth !== undefined
            ? lineSpecificOptions.crosshairMarkerBorderWidth
            : cleanedOptions.crosshairMarkerBorderWidth,
        lastPriceAnimation:
          lineSpecificOptions.lastPriceAnimation !== undefined
            ? lineSpecificOptions.lastPriceAnimation
            : lastPriceAnimation,
        // Default values
        color: cleanedOptions.color || '#2196F3', // Restore original default color
        lineWidth: cleanedOptions.lineWidth || 2,
        crossHairMarkerVisible:
          lineSpecificOptions.crosshairMarkerVisible !== undefined
            ? lineSpecificOptions.crosshairMarkerVisible
            : cleanedOptions.crossHairMarkerVisible !== undefined
              ? cleanedOptions.crossHairMarkerVisible
              : true,
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2,
      };
      if (priceFormat) {
        lineOptions.priceFormat = priceFormat;
      }
      series = chart.addSeries(LineSeries, lineOptions, finalPaneId);

      // Apply lastValueVisible: false after series creation if needed
      try {
        if (lastValueVisible === false) {
          series.applyOptions({ lastValueVisible: false });
        }
      } catch {
        // ignore
      }
      break;
    }
    case 'bar': {
      const barOptions: any = {
        ...cleanedOptions,
        upColor: cleanedOptions.upColor || '#4CAF50',
        downColor: cleanedOptions.downColor || '#F44336',
        openVisible: cleanedOptions.openVisible || false,
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2,
      };
      if (priceFormat) {
        barOptions.priceFormat = priceFormat;
      }
      series = chart.addSeries(BarSeries, barOptions, finalPaneId);
      break;
    }
    case 'candlestick': {
      const candlestickOptions: any = {
        ...cleanedOptions,
        upColor: cleanedOptions.upColor || '#4CAF50',
        downColor: cleanedOptions.downColor || '#F44336',
        borderVisible: cleanedOptions.borderVisible !== false,
        wickUpColor: cleanedOptions.wickUpColor || '#4CAF50',
        wickDownColor: cleanedOptions.wickDownColor || '#F44336',
        priceScaleId: priceScaleId || '',
        lastValueVisible: lastValueVisible !== undefined ? lastValueVisible : true,
        priceLineVisible: priceLineVisible !== undefined ? priceLineVisible : true,
        priceLineSource: priceLineSource !== undefined ? priceLineSource : 'lastBar',
        priceLineWidth: priceLineWidth !== undefined ? priceLineWidth : 1,
        priceLineColor: priceLineColor !== undefined ? priceLineColor : '',
        priceLineStyle: priceLineStyle !== undefined ? priceLineStyle : 2,
      };
      if (priceFormat) {
        candlestickOptions.priceFormat = priceFormat;
      }
      series = chart.addSeries(CandlestickSeries, candlestickOptions, finalPaneId);
      break;
    }
    default:
      throw new Error(`Invalid series type: ${type}`);
  }

  if (priceScale) {
    series.priceScale().applyOptions(cleanLineStyleOptions(priceScale));
  }

  if (data && data.length > 0) {
    series.setData(data);
  }

  if (seriesConfig.priceLines && Array.isArray(seriesConfig.priceLines)) {
    seriesConfig.priceLines.forEach((priceLine: any, _index: number) => {
      try {
        series.createPriceLine(priceLine);
      } catch (error) {
        // Failed to create price line
      }
    });
  }

  if (seriesConfig.markers && Array.isArray(seriesConfig.markers)) {
    try {
      // Apply timestamp snapping to all markers (like trade visualization)
      const snappedMarkers = applyTimestampSnapping(seriesConfig.markers, data);
      createSeriesMarkers(series, snappedMarkers);
    } catch (error) {
      // Error handling
    }
  }

  // Store paneId as a property on the series object for legend functionality
  (series as ExtendedSeriesApi).paneId = finalPaneId;

  // Handle series legend if configured - add directly to the correct PaneLegendManager
  if (seriesConfig.legend && seriesConfig.legend.visible) {
    const seriesId = `${chartId || 'default'}-series-${seriesIndex || 0}`;

    // Store legend config on the series for reference
    (series as ExtendedSeriesApi).legendConfig = seriesConfig.legend;
    (series as ExtendedSeriesApi).seriesId = seriesId;

    // Add legend directly to the correct PaneLegendManager
    try {
      const legendManager = chartId
        ? window.paneLegendManagers?.[chartId]?.[finalPaneId]
        : undefined;
      if (legendManager && typeof (legendManager as any).addSeriesLegend === 'function') {
        (legendManager as any).addSeriesLegend(seriesId, seriesConfig);
      }
    } catch (error) {
      // Error adding legend
    }
  }

  // Add trade visualization if configured for this series
  if (
    seriesConfig.trades &&
    seriesConfig.tradeVisualizationOptions &&
    seriesConfig.trades.length > 0
  ) {
    try {
      // Create trade visual elements (markers, rectangles, annotations)
      const tradeOptions = seriesConfig.tradeVisualizationOptions;
      const visualElements = createTradeVisualElements(seriesConfig.trades, tradeOptions, data);

      // Add trade markers to the series
      if (visualElements.markers && visualElements.markers.length > 0) {
        createSeriesMarkers(series, visualElements.markers);
      }

      // Store rectangle data for later processing by the chart component
      if (visualElements.rectangles && visualElements.rectangles.length > 0) {
        // Store the rectangle data in the chart for later processing
        if (!(chart as ExtendedChartApi)._pendingTradeRectangles) {
          (chart as ExtendedChartApi)._pendingTradeRectangles = [];
        }
        (chart as ExtendedChartApi)._pendingTradeRectangles!.push({
          rectangles: visualElements.rectangles,
          series: series,
          chartId: chartId ?? '',
        });
      }
    } catch (error) {
      // Error processing trades
    }
  }

  return series;
}

/**
 * Apply timestamp snapping to markers to ensure they align with chart data.
 * This function implements the same logic as the trade visualization system
 * but applies it to all markers, not just trade markers.
 *
 * @param markers Array of markers to snap
 * @param chartData Chart data for timestamp reference
 * @returns Array of markers with snapped timestamps
 */
function applyTimestampSnapping(markers: any[], chartData?: any[]): any[] {
  if (!chartData || chartData.length === 0) {
    return markers;
  }

  // Extract available timestamps from chart data
  const availableTimes = chartData
    .map(item => {
      if (typeof item.time === 'number') {
        return item.time;
      } else if (typeof item.time === 'string') {
        return Math.floor(new Date(item.time).getTime() / 1000);
      }
      return null;
    })
    .filter(time => time !== null);

  if (availableTimes.length === 0) {
    return markers;
  }

  // Apply timestamp snapping to each marker
  const snappedMarkers = markers.map((marker, _index) => {
    if (marker.time && typeof marker.time === 'number') {
      // Find nearest available timestamp
      const nearestTime = availableTimes.reduce((nearest, current) => {
        const currentDiff = Math.abs(current - marker.time);
        const nearestDiff = Math.abs(nearest - marker.time);
        return currentDiff < nearestDiff ? current : nearest;
      });

      // Return marker with snapped timestamp
      return {
        ...marker,
        time: nearestTime,
      };
    } else {
      return marker;
    }
  });

  return snappedMarkers;
}
