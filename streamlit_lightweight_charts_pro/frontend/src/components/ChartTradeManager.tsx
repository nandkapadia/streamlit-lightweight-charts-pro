/**
 * Chart trade visualization manager component
 * Extracted from LightweightCharts.tsx for better separation of concerns
 * Handles trade visualization, markers, and overlays
 */

import React, { useCallback, useEffect } from 'react';
import { IChartApi, createSeriesMarkers, Time } from 'lightweight-charts';
import { TradeConfig, TradeVisualizationOptions } from '../types';
import { ExtendedSeriesApi } from '../types/ChartInterfaces';
import { TradeRectanglePrimitive } from '../plugins/trade/TradeRectanglePrimitive';

interface ChartTradeManagerProps {
  chart: IChartApi | null;
  chartId: string;
  trades?: TradeConfig[];
  tradeVisualizationOptions?: TradeVisualizationOptions;
  seriesRefs: Map<string, ExtendedSeriesApi>;
  onError?: (_error: Error, _context: string) => void;
}

/**
 * Manages trade visualization on charts
 */
export const ChartTradeManager: React.FC<ChartTradeManagerProps> = ({
  chart,
  chartId: _chartId,
  trades = [],
  tradeVisualizationOptions,
  seriesRefs,
  onError,
}) => {
  /**
   * Convert time value to Unix timestamp in seconds
   */
  const convertToTimestamp = useCallback((time: string | number): number => {
    if (typeof time === 'number') {
      return time > 1000000000000 ? Math.floor(time / 1000) : time;
    } else {
      return Math.floor(new Date(time).getTime() / 1000);
    }
  }, []);

  /**
   * Add trade visualization to chart
   */
  const addTradeVisualization = useCallback(
    (tradeConfigs: TradeConfig[], visualOptions: TradeVisualizationOptions = { style: 'markers' }) => {
      if (!chart || !tradeConfigs || tradeConfigs.length === 0) return;

      try {
        const {
          style = 'markers',
          entryMarkerColorLong = '#4CAF50',
          entryMarkerColorShort = '#f44336',
          exitMarkerColorProfit = '#2196F3',
          exitMarkerColorLoss = '#FF9800',
          markerSize = 12,
          showPnlInMarkers = true,
          rectangleFillOpacity = 0.1,
          rectangleBorderWidth = 2,
          rectangleColorProfit = '#4CAF50',
          rectangleColorLoss = '#f44336',
          rectangleShowText = true,
          rectangleTextPosition = 'inside',
          rectangleTextFontSize = 12,
          rectangleTextColor = '#FFFFFF',
          rectangleTextBackground = 'rgba(0,0,0,0.7)',
        } = visualOptions;

        // Group trades by series
        const tradesBySeries = new Map<string, TradeConfig[]>();

        tradeConfigs.forEach(trade => {
          const seriesKey = trade.series_id || 'default';
          if (!tradesBySeries.has(seriesKey)) {
            tradesBySeries.set(seriesKey, []);
          }
          tradesBySeries.get(seriesKey)!.push(trade);
        });

        // Process each series
        tradesBySeries.forEach((seriesTrades, seriesKey) => {
          const series = seriesRefs.get(seriesKey) || Array.from(seriesRefs.values())[0];
          if (!series) return;

          if (style === 'markers' || style === 'both') {
            // Create entry and exit markers
            const markers = seriesTrades.flatMap(trade => {
              const entryColor = (trade.side || trade.tradeType) === 'long'
                ? entryMarkerColorLong
                : entryMarkerColorShort;

              const isProfitable = trade.pnl ? trade.pnl > 0 :
                (trade.exitPrice > trade.entryPrice) === ((trade.side || trade.tradeType) === 'long');

              const exitColor = isProfitable ? exitMarkerColorProfit : exitMarkerColorLoss;

              const entryMarker = {
                time: convertToTimestamp(trade.entryTime) as Time,
                position: (trade.side || trade.tradeType) === 'long' ? 'belowBar' : 'aboveBar',
                color: entryColor,
                shape: (trade.side || trade.tradeType) === 'long' ? 'arrowUp' : 'arrowDown',
                text: `${(trade.side || trade.tradeType).toUpperCase()} ${trade.quantity || ''}`,
                size: markerSize,
              };

              const exitMarker = {
                time: convertToTimestamp(trade.exitTime) as Time,
                position: (trade.side || trade.tradeType) === 'long' ? 'aboveBar' : 'belowBar',
                color: exitColor,
                shape: isProfitable ? 'circle' : 'square',
                text: showPnlInMarkers && trade.pnl ?
                  `${isProfitable ? '+' : ''}${trade.pnl.toFixed(2)}` : '',
                size: markerSize,
              };

              return [entryMarker, exitMarker];
            });

            if (markers.length > 0) {
              createSeriesMarkers(series, markers as any);
            }
          }

          if (style === 'rectangles' || style === 'both') {
            // Create trade rectangles
            seriesTrades.forEach(trade => {
              try {
                const isProfitable = trade.pnl ? trade.pnl > 0 :
                  (trade.exitPrice > trade.entryPrice) === ((trade.side || trade.tradeType) === 'long');

                const rectangleConfig = {
                  startTime: convertToTimestamp(trade.entryTime),
                  endTime: convertToTimestamp(trade.exitTime),
                  startPrice: trade.entryPrice,
                  endPrice: trade.exitPrice,
                  fillColor: isProfitable ? rectangleColorProfit : rectangleColorLoss,
                  borderColor: isProfitable ? rectangleColorProfit : rectangleColorLoss,
                  fillOpacity: rectangleFillOpacity,
                  borderWidth: rectangleBorderWidth,
                  showText: rectangleShowText,
                  text: `${(trade.side || trade.tradeType).toUpperCase()} ${trade.quantity || ''}`,
                  textPosition: rectangleTextPosition,
                  textFontSize: rectangleTextFontSize,
                  textColor: rectangleTextColor,
                  textBackground: rectangleTextBackground,
                };

                const rectangle = new TradeRectanglePrimitive(rectangleConfig as any);
                (chart as any).addPrimitive(rectangle, series);
              } catch (error) {
                onError?.(error as Error, `tradeRectangle-${trade.id || 'unknown'}`);
              }
            });
          }
        });
      } catch (error) {
        onError?.(error as Error, 'addTradeVisualization');
      }
    },
    [chart, seriesRefs, onError, convertToTimestamp]
  );

  // Setup trade visualization when trades change
  useEffect(() => {
    if (trades && trades.length > 0 && tradeVisualizationOptions) {
      addTradeVisualization(trades, tradeVisualizationOptions);
    }
  }, [trades, tradeVisualizationOptions, addTradeVisualization]);

  // This component doesn't render anything - it only manages trades
  return null;
};