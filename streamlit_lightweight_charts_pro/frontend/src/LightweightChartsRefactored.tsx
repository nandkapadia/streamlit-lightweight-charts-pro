import React, { useEffect, useCallback, useMemo, useTransition, useDeferredValue } from 'react';
import { IChartApi } from 'lightweight-charts';
import { ComponentConfig } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChartContainer } from './components/ChartContainer';
import { ChartManagerProvider, useChartManagerContext } from './managers/ChartManager';
import { SeriesManagerProvider, useSeriesManagerContext } from './managers/SeriesManager';
import { PluginManagerProvider, usePluginManagerContext } from './managers/PluginManager';
import { ConfigManagerProvider, useConfigManagerContext } from './managers/ConfigManager';

import './styles/paneCollapse.css';

interface LightweightChartsProps {
  config: ComponentConfig;
  height?: number | null;
  width?: number | null;
  onChartsReady?: () => void;
}

// Main chart rendering component
const LightweightChartsCore: React.FC<LightweightChartsProps> = React.memo(
  ({ config, height = 400, width = null, onChartsReady }) => {
    // React 18 concurrent features
    const [isPending, startTransition] = useTransition();
    const deferredConfig = useDeferredValue(config);

    // Get manager contexts
    const chartManager = useChartManagerContext();
    const seriesManager = useSeriesManagerContext();
    const pluginManager = usePluginManagerContext();
    const configManager = useConfigManagerContext();

    // Process chart configurations
    const processedChartConfigs = useMemo(() => {
      return configManager.processChartConfigs(deferredConfig, width, height);
    }, [configManager, deferredConfig, width, height]);

    // Handle chart ready callback
    const handleChartReady = useCallback(
      (chart: IChartApi, chartId: string) => {
        const chartConfig = processedChartConfigs.find(config => config.chartId === chartId);
        if (!chartConfig) {
          console.error(`Chart config not found for ${chartId}`);
          return;
        }

        try {
          // Register chart with chart manager
          chartManager.registerChart(chartId, chart, chartConfig);

          // Create series for this chart
          const series = seriesManager.createSeriesForChart(chart, chartConfig, chartId);
          console.log(`Created ${series.length} series for chart ${chartId}`);

          // Setup plugins
          if (chartConfig.trades && chartConfig.trades.length > 0) {
            pluginManager.addTradeVisualization(chart, chartConfig.trades);
          }

          if (chartConfig.annotations && chartConfig.annotations.length > 0) {
            pluginManager.addAnnotations(chart, chartConfig.annotations, chartId);
          }

          if (chartConfig.annotationLayers && chartConfig.annotationLayers.length > 0) {
            pluginManager.addAnnotationLayers(chart, chartConfig.annotationLayers, chartId);
          }

          // Setup additional features based on available config
          const config = chartConfig as any;

          if (config.legend && config.legend.visible) {
            pluginManager.addLegend(chart, config.legend, chartId);
          }

          if (config.tooltip) {
            pluginManager.addModularTooltip(chart, series, config.tooltip);
          }

          if (config.rangeSwitcher) {
            pluginManager.addRangeSwitcher(chart, config.rangeSwitcher).catch(console.error);
          }

          if (config.paneCollapse) {
            pluginManager.setupPaneCollapseSupport(chart, chartId);
          }

          console.log(`Chart ${chartId} setup completed successfully`);
        } catch (error) {
          console.error(`Failed to setup chart ${chartId}:`, error);
        }
      },
      [processedChartConfigs, chartManager, seriesManager, pluginManager]
    );

    // Handle chart error
    const handleChartError = useCallback((error: Error, chartId: string) => {
      console.error(`Chart error for ${chartId}:`, error);
    }, []);

    // Initialize global registries when config changes
    useEffect(() => {
      if (deferredConfig && deferredConfig.charts && deferredConfig.charts.length > 0) {
        startTransition(() => {
          chartManager.initializeGlobalRegistries();
        });
      }
    }, [deferredConfig, chartManager, startTransition]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        chartManager.cleanup();
      };
    }, [chartManager]);

    // Render chart containers
    const chartContainers = useMemo(() => {
      if (!processedChartConfigs || processedChartConfigs.length === 0) {
        return [];
      }

      return processedChartConfigs.map(chartConfig => (
        <ChartContainer
          key={chartConfig.chartId}
          chartConfig={chartConfig}
          chartId={chartConfig.chartId}
          containerId={chartConfig.containerId}
          width={width}
          height={height}
          onChartReady={handleChartReady}
          onChartError={handleChartError}
        />
      ));
    }, [processedChartConfigs, width, height, handleChartReady, handleChartError]);

    // Check if we have valid configuration
    if (!config || !config.charts || config.charts.length === 0) {
      return <div>No charts configured</div>;
    }

    return (
      <ErrorBoundary
        resetKeys={[config?.charts?.length, JSON.stringify(config)]}
        resetOnPropsChange={false}
        isolate={true}
        onError={(error, errorInfo) => {
          console.error('Chart rendering error:', error, errorInfo);
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            opacity: isPending ? 0.7 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {chartContainers}
        </div>
      </ErrorBoundary>
    );
  }
);

LightweightChartsCore.displayName = 'LightweightChartsCore';

// Main component with all providers
const LightweightCharts: React.FC<LightweightChartsProps> = props => {
  return (
    <ConfigManagerProvider>
      <ChartManagerProvider onChartsReady={props.onChartsReady}>
        <SeriesManagerProvider>
          <PluginManagerProvider>
            <LightweightChartsCore {...props} />
          </PluginManagerProvider>
        </SeriesManagerProvider>
      </ChartManagerProvider>
    </ConfigManagerProvider>
  );
};

export default LightweightCharts;
