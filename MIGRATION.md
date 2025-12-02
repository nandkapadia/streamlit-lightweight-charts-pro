# Migration Guide: Streamlit Lightweight Charts Pro v0.2.0

## Breaking Changes

### Options Module Removed

In version 0.2.0, we've eliminated code duplication by removing the proxy `options` module from the Streamlit package. All options classes now live in the core package: `lightweight_charts_core`.

## How to Update Your Code

### Old Import Pattern (v0.1.x)
```python
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.ui_options import LegendOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
```

### New Import Pattern (v0.2.0+)
```python
from lightweight_charts_core.charts.options import ChartOptions
from lightweight_charts_core.charts.options.ui_options import LegendOptions
from lightweight_charts_core.charts.options.price_scale_options import PriceScaleOptions
```

## Quick Find & Replace

You can use these sed commands to update your codebase:

```bash
# Update package-level imports
find . -name "*.py" -type f -exec sed -i '' \
  's/from streamlit_lightweight_charts_pro\.charts\.options import/from lightweight_charts_core.charts.options import/g' {} +

# Update submodule imports
find . -name "*.py" -type f -exec sed -i '' \
  's/from streamlit_lightweight_charts_pro\.charts\.options\./from lightweight_charts_core.charts.options./g' {} +
```

## Available Options Modules

All of these are now imported from `lightweight_charts_core.charts.options`:

- `base_options` - Base options classes
- `chart_options` - Main chart configuration (ChartOptions)
- `interaction_options` - Mouse/touch interaction settings
- `layout_options` - Layout and pane height configuration
- `line_options` - Line styling options
- `localization_options` - Localization settings
- `price_format_options` - Price formatting
- `price_line_options` - Price line configuration
- `price_scale_options` - Price scale settings
- `sync_options` - Multi-chart synchronization
- `time_scale_options` - Time scale configuration
- `trade_visualization_options` - Trade markers and visualization
- `ui_options` - UI elements (Legend, RangeSwitcher)

## Why This Change?

This change:
1. **Eliminates duplication**: No more maintaining two copies of options classes
2. **Single source of truth**: All options come from the core package
3. **Better architecture**: Clear separation between framework-agnostic core and Streamlit integration
4. **Easier maintenance**: Bug fixes and features added to core automatically benefit Streamlit

## Still Need Help?

The main package re-exports commonly used classes:

```python
from streamlit_lightweight_charts_pro import (
    ChartOptions,
    LayoutOptions,
    LegendOptions,
    PaneHeightOptions,
    TradeVisualizationOptions,
)
```

For specialized options, import directly from `lightweight_charts_core.charts.options`.
