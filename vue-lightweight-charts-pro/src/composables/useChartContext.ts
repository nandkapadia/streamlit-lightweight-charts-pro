/**
 * @fileoverview Chart context for providing chart instance to child components
 */

import { inject, provide, type InjectionKey, type Ref, type ShallowRef } from 'vue';
import type { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import type { ChartContext, AllSeriesType, SeriesOptionsMapping } from '../types';

/**
 * Injection key for chart context
 */
export const ChartContextKey: InjectionKey<ChartContext> = Symbol('ChartContext');

/**
 * Provide chart context to child components
 *
 * @param chart - The chart API instance
 *
 * @example
 * ```vue
 * <script setup>
 * import { useChart, provideChartContext } from 'vue-lightweight-charts-pro'
 *
 * const { containerRef, chart } = useChart()
 * provideChartContext(chart)
 * </script>
 * ```
 */
export function provideChartContext(chart: Ref<IChartApi | null> | ShallowRef<IChartApi | null>) {
  const context: ChartContext = {
    get chart() {
      return chart.value;
    },
    addSeries: <T extends AllSeriesType>(_type: T, _options?: SeriesOptionsMapping[T]) => {
      // This is a simplified version - actual implementation would use useSeries
      if (!chart.value) return null;
      // Type-specific series creation would go here
      return null;
    },
    removeSeries: (series: ISeriesApi<SeriesType>) => {
      if (chart.value) {
        chart.value.removeSeries(series);
      }
    },
  };

  provide(ChartContextKey, context);

  return context;
}

/**
 * Inject chart context in child components
 *
 * @returns The chart context or undefined if not provided
 *
 * @example
 * ```vue
 * <script setup>
 * import { useChartContext } from 'vue-lightweight-charts-pro'
 *
 * const context = useChartContext()
 * if (context?.chart) {
 *   // Access chart instance
 * }
 * </script>
 * ```
 */
export function useChartContext(): ChartContext | undefined {
  return inject(ChartContextKey);
}
