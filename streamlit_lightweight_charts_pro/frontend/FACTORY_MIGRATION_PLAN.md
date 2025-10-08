# Series Factory Migration Plan

## Executive Summary

The old `seriesFactory.ts` (669 lines) cannot be directly replaced with `UnifiedSeriesFactory.ts` due to different APIs and additional responsibilities. This document outlines a safe, incremental migration strategy.

## Current State Analysis

### Old SeriesFactory API
```typescript
function createSeries(
  chart: IChartApi,
  seriesConfig: SeriesConfig,  // Full config object
  context: SeriesFactoryContext,
  chartId?: string,
  seriesIndex?: number
): ISeriesApi<any> | null
```

**Responsibilities**:
1. ✅ Create series from config
2. ✅ Handle markers
3. ✅ Handle price lines
4. ✅ Handle trade visualizations
5. ✅ Handle legends
6. ✅ Handle price scales
7. ✅ Store series metadata (paneId, legendConfig, seriesId)

### New UnifiedSeriesFactory API
```typescript
function createSeries(
  chart: any,
  seriesType: string,  // Just type string
  data: any[],
  userOptions: Partial<SeriesOptionsCommon>
): ISeriesApi<any>
```

**Responsibilities**:
1. ✅ Create series from type and options
2. ❌ Does NOT handle markers
3. ❌ Does NOT handle price lines
4. ❌ Does NOT handle trades
5. ❌ Does NOT handle legends
6. ❌ Does NOT handle price scales
7. ❌ Does NOT store metadata

## Migration Strategy

### Option 1: Adapter Pattern (RECOMMENDED)

Create an adapter that wraps UnifiedSeriesFactory and adds the missing functionality.

**File**: `src/utils/seriesFactoryAdapter.ts`

```typescript
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { SeriesConfig } from '../types';
import { createSeries as createUnifiedSeries } from '../series/UnifiedSeriesFactory';
import { createSeriesMarkers } from 'lightweight-charts';
import { cleanLineStyleOptions } from './lineStyle';
import { ExtendedSeriesApi } from '../types/ChartInterfaces';

/**
 * Adapter: Converts SeriesConfig to UnifiedSeriesFactory format
 * and adds all the extra functionality (markers, trades, legends, etc.)
 */
export function createSeries(
  chart: IChartApi,
  seriesConfig: SeriesConfig,
  context: SeriesFactoryContext = {},
  chartId?: string,
  seriesIndex?: number
): ISeriesApi<any> | null {
  try {
    const { type, data, options = {}, priceScale } = seriesConfig;

    // Step 1: Create series using UnifiedSeriesFactory
    const series = createUnifiedSeries(chart, type, data, options);

    // Step 2: Add price scale if provided
    if (priceScale) {
      series.priceScale().applyOptions(cleanLineStyleOptions(priceScale));
    }

    // Step 3: Add price lines if provided
    if (seriesConfig.priceLines && Array.isArray(seriesConfig.priceLines)) {
      seriesConfig.priceLines.forEach((priceLine: any) => {
        try {
          series.createPriceLine(priceLine);
        } catch {
          // Failed to create price line
        }
      });
    }

    // Step 4: Add markers if provided
    if (seriesConfig.markers && Array.isArray(seriesConfig.markers)) {
      try {
        const snappedMarkers = applyTimestampSnapping(seriesConfig.markers, data);
        createSeriesMarkers(series, snappedMarkers);
      } catch {
        // Error handling
      }
    }

    // Step 5: Store metadata
    const finalPaneId = seriesConfig.paneId !== undefined ? seriesConfig.paneId : 0;
    (series as ExtendedSeriesApi).paneId = finalPaneId;

    // Step 6: Handle legend
    if (seriesConfig.legend && seriesConfig.legend.visible) {
      const seriesId = `${chartId || 'default'}-series-${seriesIndex || 0}`;
      (series as ExtendedSeriesApi).legendConfig = seriesConfig.legend;
      (series as ExtendedSeriesApi).seriesId = seriesId;

      // Add legend to PaneLegendManager
      try {
        const legendManager = chartId
          ? window.paneLegendManagers?.[chartId]?.[finalPaneId]
          : undefined;
        if (legendManager && typeof (legendManager as any).addSeriesLegend === 'function') {
          (legendManager as any).addSeriesLegend(seriesId, seriesConfig);
        }
      } catch {
        // Error adding legend
      }
    }

    // Step 7: Handle trade visualizations
    if (
      seriesConfig.trades &&
      seriesConfig.tradeVisualizationOptions &&
      seriesConfig.trades.length > 0
    ) {
      // ... existing trade visualization code
    }

    return series;
  } catch (error) {
    logger.error('Series creation failed', 'SeriesFactory', error);
    return null;
  }
}

// Helper function for timestamp snapping
function applyTimestampSnapping(markers: any[], chartData?: any[]): any[] {
  // ... existing implementation
}
```

**Benefits**:
- ✅ Maintains backward compatibility
- ✅ Uses UnifiedSeriesFactory internally
- ✅ Incremental migration (can be done in stages)
- ✅ Low risk - old functionality preserved
- ✅ Easy rollback if issues arise

**Implementation Steps**:
1. Create `seriesFactoryAdapter.ts` (2-4 hours)
2. Update `LightweightCharts.tsx` to import from adapter (15 min)
3. Test thoroughly (2-3 hours)
4. Deprecate old `seriesFactory.ts` (mark as deprecated)
5. Remove old factory in next major version

### Option 2: Gradual Refactoring (LOWER PRIORITY)

Refactor the old `seriesFactory.ts` to use UnifiedSeriesFactory internally for just the series creation part.

**Changes to `seriesFactory.ts`**:
```typescript
import { createSeries as createUnifiedSeries } from '../series/UnifiedSeriesFactory';

// In createSeries function, replace the massive switch statement:
export function createSeries(
  chart: IChartApi,
  seriesConfig: SeriesConfig,
  context: SeriesFactoryContext = {},
  chartId?: string,
  seriesIndex?: number
): ISeriesApi<any> | null {
  const { type, data, options = {}, priceScale } = seriesConfig;

  // NEW: Use UnifiedSeriesFactory for series creation
  let series: ISeriesApi<any>;
  try {
    series = createUnifiedSeries(chart, type, data, options);
  } catch (error) {
    logger.error('Series creation failed', 'SeriesFactory', error);
    return null;
  }

  // Keep all existing logic for markers, trades, legends, etc.
  if (priceScale) {
    series.priceScale().applyOptions(cleanLineStyleOptions(priceScale));
  }

  // ... rest of the existing code

  return series;
}
```

**Benefits**:
- ✅ Simpler migration (just replace switch statement)
- ✅ Maintains exact same API
- ✅ Very low risk

**Drawbacks**:
- ❌ Still have one monolithic file
- ❌ Doesn't fully leverage new architecture

## Recommendation

**Use Option 1 (Adapter Pattern)** for these reasons:

1. **Clean separation**: Series creation logic separated from auxiliary logic
2. **Testability**: Can test UnifiedSeriesFactory independently
3. **Future-proof**: Can eventually move auxiliary logic to separate services
4. **Type safety**: Adapter can have proper TypeScript types
5. **Documentation**: Clear migration path for future developers

## Implementation Timeline

### Phase 1: Create Adapter (Week 1)
- [ ] Create `seriesFactoryAdapter.ts`
- [ ] Implement all auxiliary logic (markers, trades, legends)
- [ ] Add comprehensive error handling
- [ ] Write unit tests

### Phase 2: Integration (Week 2)
- [ ] Update `LightweightCharts.tsx` to use adapter
- [ ] Run full regression testing
- [ ] Fix any discovered issues
- [ ] Update documentation

### Phase 3: Cleanup (Week 3)
- [ ] Mark old `seriesFactory.ts` as deprecated
- [ ] Add deprecation warnings
- [ ] Plan removal for v2.0.0
- [ ] Update CHANGELOG.md

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking changes in LightweightCharts.tsx | Low | High | Keep old factory as fallback for 1 release |
| Markers not working correctly | Medium | High | Extensive manual testing of all marker types |
| Trade visualizations broken | Medium | High | Test suite for trade visualization |
| Legend not appearing | Low | Medium | Manual testing of legend functionality |
| Custom series incompatibility | Low | High | Test all custom series types |

## Testing Checklist

Before removing old factory, verify:

- [ ] All built-in series types work (Line, Area, Bar, Candlestick, Histogram, Baseline)
- [ ] All custom series types work (Band, Ribbon, GradientRibbon, Signal)
- [ ] Markers appear correctly
- [ ] Price lines work
- [ ] Trade visualizations render
- [ ] Legends appear in correct panes
- [ ] Price scales work correctly
- [ ] Series config dialog works
- [ ] Backend sync works
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console

## Conclusion

The adapter pattern provides a safe, incremental migration path that maintains backward compatibility while leveraging the new unified architecture. Estimated effort: 1-2 weeks for complete migration.
