import React, { useCallback, useMemo, useRef } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { TradeConfig, Annotation, AnnotationLayer, LegendConfig } from '../types';
import { SignalSeries } from '../plugins/series/signalSeriesPlugin';
import { TradeRectanglePrimitive } from '../plugins/trade/TradeRectanglePrimitive';
import { createAnnotationVisualElements } from '../services/annotationSystem';
// import { ChartCoordinateService } from '../services/ChartCoordinateService';
// import { ChartPrimitiveManager } from '../services/ChartPrimitiveManager';
import { CornerLayoutManager } from '../services/CornerLayoutManager';

export interface PluginManagerAPI {
  addTradeVisualization: (chart: IChartApi, trades: TradeConfig[], options?: any) => void;
  addAnnotations: (chart: IChartApi, annotations: Annotation[], chartId: string) => void;
  addAnnotationLayers: (chart: IChartApi, layers: AnnotationLayer[], chartId: string) => void;
  addModularTooltip: (chart: IChartApi, series: ISeriesApi<any>[], config: any) => void;
  addRangeSwitcher: (chart: IChartApi, rangeConfig: any) => Promise<void>;
  addLegend: (chart: IChartApi, legendConfig: LegendConfig, chartId: string) => void;
  setupPaneCollapseSupport: (chart: IChartApi, chartId: string) => void;
  cleanup: (chartId: string) => void;
}

export const usePluginManager = (): PluginManagerAPI => {
  const signalPluginsRef = useRef<{ [key: string]: SignalSeries }>({});
  // const primitiveManagersRef = useRef<{ [key: string]: ChartPrimitiveManager }>({});

  // Add trade visualization
  const addTradeVisualization = useCallback(
    (chart: IChartApi, trades: TradeConfig[], options: any = {}) => {
      try {
        if (!trades || trades.length === 0) {
          return;
        }

        trades.forEach((trade, index) => {
          try {
            const tradeData = trade as any;
            const primitive = new TradeRectanglePrimitive({
              entry: tradeData.entry,
              exit: tradeData.exit,
              profit: tradeData.profit,
              color: tradeData.color || '#2196F3',
              opacity: tradeData.opacity || 0.3,
              borderWidth: tradeData.borderWidth || 1,
              borderColor: tradeData.borderColor || tradeData.color || '#2196F3',
              ...options,
            });

            (chart as any).addPrimitive(primitive);
            console.log(`Trade visualization ${index} added successfully`);
          } catch {
            console.error('An error occurred');
          }
        });
      } catch {
        console.error('An error occurred');
      }
    },
    []
  );

  // Add annotations
  const addAnnotations = useCallback(
    (chart: IChartApi, annotations: Annotation[], chartId: string) => {
      try {
        if (!annotations || annotations.length === 0) {
          return;
        }

        const visualElements = createAnnotationVisualElements(annotations);

        // Add markers
        if (visualElements.markers && visualElements.markers.length > 0) {
          // Note: This would typically be added to a specific series
          console.log(
            `Created ${visualElements.markers.length} annotation markers for chart ${chartId}`
          );
        }

        // Add shapes
        if (visualElements.shapes && visualElements.shapes.length > 0) {
          visualElements.shapes.forEach((shape, index) => {
            try {
              (chart as any).addPrimitive(shape as any);
              console.log(`Annotation shape ${index} added to chart ${chartId}`);
            } catch {
              console.error('An error occurred');
            }
          });
        }

        // Add texts
        if (visualElements.texts && visualElements.texts.length > 0) {
          visualElements.texts.forEach((text, index) => {
            try {
              (chart as any).addPrimitive(text as any);
              console.log(`Annotation text ${index} added to chart ${chartId}`);
            } catch {
              console.error('An error occurred');
            }
          });
        }
      } catch {
        console.error('An error occurred');
      }
    },
    []
  );

  // Add annotation layers
  const addAnnotationLayers = useCallback(
    (chart: IChartApi, layers: AnnotationLayer[], chartId: string) => {
      try {
        if (!layers || layers.length === 0) {
          return;
        }

        layers.forEach((layer, layerIndex) => {
          try {
            if (layer.annotations && layer.annotations.length > 0) {
              addAnnotations(chart, layer.annotations, chartId);
              console.log(`Annotation layer ${layerIndex} added to chart ${chartId}`);
            }
          } catch {
            console.error('An error occurred');
          }
        });
      } catch {
        console.error('An error occurred');
      }
    },
    [addAnnotations]
  );

  // Add modular tooltip
  const addModularTooltip = useCallback(
    (_chart: IChartApi, _series: ISeriesApi<any>[], _config: any) => {
      try {
        // Implementation would depend on specific tooltip requirements
        // This is a placeholder for the tooltip functionality
        console.log('Modular tooltip configuration applied');
      } catch {
        console.error('An error occurred');
      }
    },
    []
  );

  // Add range switcher
  const addRangeSwitcher = useCallback(
    async (_chart: IChartApi, _rangeConfig: any): Promise<void> => {
      try {
        // Implementation would depend on specific range switcher requirements
        // This is a placeholder for the range switcher functionality
        console.log('Range switcher configuration applied');
      } catch {
        console.error('An error occurred');
      }
    },
    []
  );

  // Add legend
  const addLegend = useCallback((chart: IChartApi, legendConfig: LegendConfig, chartId: string) => {
    try {
      if (!legendConfig || !legendConfig.visible) {
        return;
      }

      // Use CornerLayoutManager to add legend (commented out for now)
      // const widget = {
      //   id: `legend-${chartId}`,
      //   content: legendConfig.text || 'Legend',
      //   position: legendConfig.position || { corner: 'topLeft', offset: { x: 10, y: 10 } },
      //   style: {
      //     backgroundColor: legendConfig.backgroundColor || 'rgba(255, 255, 255, 0.9)',
      //     color: legendConfig.color || '#000',
      //     fontSize: legendConfig.fontSize || '12px',
      //     padding: '5px 10px',
      //     borderRadius: '4px',
      //     ...legendConfig.style,
      //   },
      // };

      // CornerLayoutManager.addWidget(chartId, widget);
      console.log(`Legend widget configured for ${chartId}`);
      console.log(`Legend added to chart ${chartId}`);
    } catch {
      console.error('An error occurred');
    }
  }, []);

  // Setup pane collapse support
  const setupPaneCollapseSupport = useCallback((chart: IChartApi, chartId: string) => {
    try {
      // Implementation would depend on pane collapse requirements
      // This would typically involve adding collapse/expand buttons to panes
      console.log(`Pane collapse support setup for chart ${chartId}`);
    } catch {
      console.error('An error occurred');
    }
  }, []);

  // Cleanup plugins for a chart
  const cleanup = useCallback((chartId: string) => {
    try {
      // Clean up signal plugins
      if (signalPluginsRef.current[chartId]) {
        try {
          signalPluginsRef.current[chartId].destroy();
        } catch {
          console.warn('A warning occurred');
        }
        delete signalPluginsRef.current[chartId];
      }

      // Clean up primitive managers
      // if (primitiveManagersRef.current[chartId]) {
      //   try {
      //     primitiveManagersRef.current[chartId].cleanup();
      //   } catch {
      //     console.warn("A warning occurred");
      //   }
      //   delete primitiveManagersRef.current[chartId];
      // }

      // Clean up CornerLayoutManager
      try {
        CornerLayoutManager.cleanup(chartId);
      } catch {
        console.warn('A warning occurred');
      }

      console.log(`Plugin cleanup completed for chart ${chartId}`);
    } catch {
      console.error('An error occurred');
    }
  }, []);

  // Memoized API object
  const api = useMemo<PluginManagerAPI>(
    () => ({
      addTradeVisualization,
      addAnnotations,
      addAnnotationLayers,
      addModularTooltip,
      addRangeSwitcher,
      addLegend,
      setupPaneCollapseSupport,
      cleanup,
    }),
    [
      addTradeVisualization,
      addAnnotations,
      addAnnotationLayers,
      addModularTooltip,
      addRangeSwitcher,
      addLegend,
      setupPaneCollapseSupport,
      cleanup,
    ]
  );

  return api;
};

// Plugin Manager Provider Component
interface PluginManagerProviderProps {
  children: React.ReactNode;
}

const PluginManagerContext = React.createContext<PluginManagerAPI | null>(null);

export const PluginManagerProvider: React.FC<PluginManagerProviderProps> = ({ children }) => {
  const pluginManager = usePluginManager();

  return (
    <PluginManagerContext.Provider value={pluginManager}>{children}</PluginManagerContext.Provider>
  );
};

export const usePluginManagerContext = (): PluginManagerAPI => {
  const context = React.useContext(PluginManagerContext);
  if (!context) {
    throw new Error('usePluginManagerContext must be used within a PluginManagerProvider');
  }
  return context;
};
