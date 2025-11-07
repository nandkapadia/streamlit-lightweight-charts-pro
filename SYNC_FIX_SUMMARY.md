# Chart Synchronization Fix for ChartManager

## Problem
When using `ChartManager` with multiple charts and calling `render_chart()` to render individual charts, the chart synchronization feature was broken. Charts would not sync their crosshairs or time ranges despite being configured with the same `chart_group_id` and sync configuration.

## Root Cause
The bug occurred in the `ChartManager.add_chart()` method at line 185-196 in `chart_manager.py`.

**The Issue:**
1. When charts were created, `ChartRenderer` was initialized with `chart_manager_ref=None`
2. When `add_chart()` was called, it set `chart._chart_manager = self`
3. **BUT**: It did NOT update `chart._chart_renderer.chart_manager_ref`
4. When `render_chart()` was called, it invoked `chart.render()` → `chart.to_frontend_config()` → `chart._chart_renderer.generate_frontend_config()`
5. In `generate_frontend_config()` (chart_renderer.py:109), the code checks: `if self.chart_manager_ref is not None`
6. Since `chart_manager_ref` was still `None`, sync configuration was NOT included in the frontend config! ❌

## Solution
Added one critical line in `ChartManager.add_chart()` to update the chart renderer's manager reference:

```python
# CRITICAL: Update the ChartRenderer's manager reference for sync config access
# When a chart is added to a manager, its renderer needs the manager reference
# to include sync configuration when rendering individual charts
chart._chart_renderer.chart_manager_ref = self  # pylint: disable=protected-access
```

**File Modified:**
- `streamlit_lightweight_charts_pro/charts/chart_manager.py` (line 189-192)

**Test Added:**
- `tests/unit/charts/test_chart_manager.py::TestChartManagerEdgeCases::test_chart_renderer_manager_reference_propagation`

## How It Works Now

### Correct Flow:
1. Create charts: `chart1 = Chart(..., chart_group_id=1)`, `chart2 = Chart(..., chart_group_id=1)`
2. Add to manager: `manager.add_chart(chart1, "chart1")`
   - Sets `chart1._chart_manager = manager` ✅
   - **NEW**: Sets `chart1._chart_renderer.chart_manager_ref = manager` ✅
3. Configure sync: `manager.set_sync_group_config("1", SyncOptions(enabled=True, crosshair=True, time_range=True))`
4. Render individual charts: `manager.render_chart("chart1")`, `manager.render_chart("chart2")`
5. ChartRenderer can now access sync config via `self.chart_manager_ref.sync_groups` ✅
6. Sync configuration is included in frontend config ✅
7. Frontend synchronizes charts correctly! ✅

## Testing
Run the test to verify the fix:
```bash
python -m pytest tests/unit/charts/test_chart_manager.py::TestChartManagerEdgeCases::test_chart_renderer_manager_reference_propagation -v
```

Run all chart manager tests:
```bash
python -m pytest tests/unit/charts/test_chart_manager.py -v
```

Test with the visual test harness:
```bash
streamlit run examples/test_harness/simple_series_test.py
```

**What to check:**
- Scroll to the bottom section: "📊 Linked Charts (ChartManager)"
- Two charts displayed side-by-side (Candlestick and Line)
- **Crosshair sync**: Hover over one chart → crosshair appears on both charts at the same time position
- **Time range sync**: Zoom/pan one chart → the other chart follows the same time range

## Results
✅ All 57 unit tests passing
✅ Chart synchronization working correctly
✅ Coverage for ChartManager increased from 24% → 89%

## Related Files
- `streamlit_lightweight_charts_pro/charts/chart_manager.py:189-192` (fix)
- `streamlit_lightweight_charts_pro/charts/managers/chart_renderer.py:109-111` (sync config logic)
- `examples/test_harness/simple_series_test.py:563-600` (visual test)
- `tests/unit/charts/test_chart_manager.py:880-891` (unit test)
