"""Chart options package for Streamlit Lightweight Charts Pro.

This package contains all chart option classes organized by functionality.
These options provide comprehensive customization capabilities for charts,
allowing fine-grained control over appearance, behavior, and interaction.

The package includes:
    - base_options.py: Base Options class for all option classes
    - chart_options.py: Main ChartOptions class
    - layout_options.py: Layout, Grid, Watermark options
    - interaction_options.py: Crosshair, KineticScroll, TrackingMode options
    - time_scale_options.py: TimeScale options
    - price_scale_options.py: PriceScaleOptions options
    - ui_options.py: Legend and RangeSwitcher options
    - localization_options.py: Localization options
    - trade_visualization_options.py: Trade visualization options
    - line_options.py: Line styling options
    - price_format_options.py: Price formatting options
    - price_line_options.py: Price line options

These options enable comprehensive chart customization including:
    - Visual styling (colors, fonts, layouts)
    - Interaction behavior (crosshairs, scrolling, tracking)
    - Scale configuration (time and price scales)
    - UI elements (legends, watermarks, tooltips)
    - Localization and formatting
    - Trade visualization features

Example Usage:
    ```python
    from lightweight_charts_core.charts.options import ChartOptions,
        LayoutOptions,
        GridOptions

    # Create chart options
    options = ChartOptions(
        layout=LayoutOptions(background_color="#ffffff", text_color="#000000"),
        grid=GridOptions(
            vert_lines=GridLineOptions(color="#e1e1e1"), horz_lines=GridLineOptions(color="#e1e1e1")
        ),
    )

    # Apply to chart
    chart = Chart().update_options(options)
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

from lightweight_charts_core.charts.options.base_options import Options
from lightweight_charts_core.charts.options.chart_options import ChartOptions
from lightweight_charts_core.charts.options.interaction_options import (
    CrosshairLineOptions,
    CrosshairOptions,
    CrosshairSyncOptions,
    KineticScrollOptions,
    TrackingModeOptions,
)
from lightweight_charts_core.charts.options.layout_options import (
    GridLineOptions,
    GridOptions,
    LayoutOptions,
    PaneHeightOptions,
    WatermarkOptions,
)
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.options.localization_options import LocalizationOptions
from lightweight_charts_core.charts.options.price_format_options import PriceFormatOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from lightweight_charts_core.charts.options.sync_options import SyncOptions
from lightweight_charts_core.charts.options.time_scale_options import TimeScaleOptions
from lightweight_charts_core.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from lightweight_charts_core.charts.options.ui_options import (
    LegendOptions,
    RangeConfig,
    RangeSwitcherOptions,
)

__all__ = [
    # Main chart options
    "ChartOptions",
    # Interaction options
    "CrosshairLineOptions",
    "CrosshairOptions",
    "CrosshairSyncOptions",
    # Layout options
    "GridLineOptions",
    "GridOptions",
    "KineticScrollOptions",
    "LayoutOptions",
    # UI options
    "LegendOptions",
    # Line options
    "LineOptions",
    # Localization options
    "LocalizationOptions",
    # Base options class
    "Options",
    "PaneHeightOptions",
    "PriceFormatOptions",
    # Price options
    "PriceLineOptions",
    "PriceScaleMargins",
    "PriceScaleOptions",
    "RangeConfig",
    "RangeSwitcherOptions",
    # Sync options
    "SyncOptions",
    # Scale options
    "TimeScaleOptions",
    "TrackingModeOptions",
    # Trade visualization options
    "TradeVisualizationOptions",
    "WatermarkOptions",
    # Signal options
]
