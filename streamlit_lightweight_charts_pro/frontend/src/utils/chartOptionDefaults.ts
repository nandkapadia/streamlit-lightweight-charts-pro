/**
 * @fileoverview Frontend defaults applied to the options passed to `createChart`.
 */

import type { ChartConfig } from '../types';

export type LegacySizingFlags = Pick<ChartConfig, 'autoSize' | 'autoWidth' | 'autoHeight'>;

/**
 * Resolve autoSize / autoWidth / autoHeight from either top-level chartConfig or
 * nested chartConfig.chart (Python serializes them under `chart`).
 */
export function resolveLegacySizing(config: ChartConfig | LegacySizingFlags): LegacySizingFlags {
  const nested = (config as ChartConfig).chart ?? {};
  return {
    autoSize: (config as ChartConfig).autoSize ?? nested.autoSize,
    autoWidth: (config as ChartConfig).autoWidth ?? nested.autoWidth,
    autoHeight: (config as ChartConfig).autoHeight ?? nested.autoHeight,
  };
}

/**
 * Returns a copy of `chartOptions` with this component's defaults filled in.
 *
 * - `crosshair.doNotSnapToHiddenSeriesIndices` defaults to `true`, because users can hide
 *   series from the settings dialog and the crosshair should not stop on their bars.
 * - The legacy top-level `autoSize` / `autoWidth` / `autoHeight` flags turn on the
 *   library's own `autoSize`, which tracks the container with a `ResizeObserver`.
 *
 * @param chartOptions - Options destined for `createChart`; not mutated.
 * @param legacySizing - Top-level sizing flags from the chart config.
 * @returns The options with defaults applied.
 */
export function applyChartOptionDefaults(
  chartOptions: Record<string, unknown>,
  legacySizing: LegacySizingFlags
): Record<string, unknown> {
  const crosshair = (chartOptions.crosshair ?? {}) as Record<string, unknown>;
  const result: Record<string, unknown> = {
    ...chartOptions,
    crosshair: {
      ...crosshair,
      doNotSnapToHiddenSeriesIndices: crosshair.doNotSnapToHiddenSeriesIndices ?? true,
    },
  };

  if (legacySizing.autoSize || legacySizing.autoWidth || legacySizing.autoHeight) {
    result.autoSize = true;
  }

  return result;
}

/**
 * CSS sizes that keep a legacy single-axis flag (`autoWidth` or `autoHeight`) single-axis.
 *
 * The library's `autoSize` follows both container dimensions, so the dimension that
 * should stay fixed is pinned on the container instead.
 *
 * @param legacySizing - Top-level sizing flags from the chart config.
 * @param configured - The configured chart width and height in pixels, if any.
 * @returns Container `width` and/or `height` overrides; empty when nothing needs pinning.
 */
export function pinnedContainerSize(
  legacySizing: LegacySizingFlags,
  configured: { width?: number | null; height?: number | null }
): { width?: string; height?: string } {
  const size: { width?: string; height?: string } = {};
  if (legacySizing.autoSize || legacySizing.autoWidth === legacySizing.autoHeight) {
    return size;
  }

  if (legacySizing.autoWidth && configured.height) {
    size.height = `${configured.height}px`;
  }
  if (legacySizing.autoHeight && configured.width) {
    size.width = `${configured.width}px`;
  }
  return size;
}
