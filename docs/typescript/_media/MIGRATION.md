# Migration Guide: Streamlit Lightweight Charts Pro

This guide covers migration between major versions of the package.

---

## v0.2.x → v0.3.0

### Core Package Renamed

Version 0.3.0 renames the core dependency from `lightweight-charts-core` to `lightweight-charts-pro`.

### What Changed

- **Package name**: `lightweight-charts-core` → `lightweight-charts-pro`
- **Import statements**: All imports from the core package need updating
- **Dependency**: pyproject.toml and requirements.txt need updating

### How to Update Your Code

If you directly imported from the core package:

**Old imports (v0.2.x)**:
```python
from lightweight_charts_core import BaseChart
from lightweight_charts_core.charts.options import ChartOptions
```

**New imports (v0.3.0+)**:
```python
from lightweight_charts_pro import BaseChart
from lightweight_charts_pro.charts.options import ChartOptions
```

### Quick Find & Replace

```bash
# Update all imports from lightweight_charts_core to lightweight_charts_pro
find . -name "*.py" -type f -exec sed -i '' \
  's/from lightweight_charts_core/from lightweight_charts_pro/g' {} +

find . -name "*.py" -type f -exec sed -i '' \
  's/import lightweight_charts_core/import lightweight_charts_pro/g' {} +
```

### Update Dependencies

**requirements.txt**:
```diff
- lightweight-charts-core>=0.2.0
+ lightweight-charts-pro>=0.3.0
```

**pyproject.toml**:
```diff
dependencies = [
    "streamlit>=1.0",
-   "lightweight-charts-core>=0.2.0",
+   "lightweight-charts-pro>=0.3.0",
]
```

### Reinstall

```bash
pip uninstall lightweight-charts-core
pip install --upgrade streamlit-lightweight-charts-pro
```

---

## v0.1.x → v0.2.0

### Options Module Removed

Version 0.2.0 eliminated code duplication by removing the proxy `options` module from the Streamlit package. All options classes now live in the core package: `lightweight_charts_pro`.

### How to Update Your Code

**Old Import Pattern (v0.1.x)**:
```python
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.ui_options import LegendOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
```

**New Import Pattern (v0.2.0+)**:
```python
from lightweight_charts_pro.charts.options import ChartOptions
from lightweight_charts_pro.charts.options.ui_options import LegendOptions
from lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
```

### Quick Find & Replace

```bash
# Update package-level imports
find . -name "*.py" -type f -exec sed -i '' \
  's/from streamlit_lightweight_charts_pro\.charts\.options import/from lightweight_charts_pro.charts.options import/g' {} +

# Update submodule imports
find . -name "*.py" -type f -exec sed -i '' \
  's/from streamlit_lightweight_charts_pro\.charts\.options\./from lightweight_charts_pro.charts.options./g' {} +
```

### Available Options Modules

All of these are now imported from `lightweight_charts_pro.charts.options`:

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

### Why This Change?

This change:
1. **Eliminates duplication**: No more maintaining two copies of options classes
2. **Single source of truth**: All options come from the core package
3. **Better architecture**: Clear separation between framework-agnostic core and Streamlit integration
4. **Easier maintenance**: Bug fixes and features added to core automatically benefit Streamlit

---

## Convenience Imports

The main package re-exports commonly used classes for convenience:

```python
from streamlit_lightweight_charts_pro import (
    ChartOptions,
    LayoutOptions,
    LegendOptions,
    PaneHeightOptions,
    TradeVisualizationOptions,
)
```

For specialized options, import directly from `lightweight_charts_pro.charts.options`.
