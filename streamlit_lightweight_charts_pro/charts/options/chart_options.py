"""
Chart options configuration for streamlit-lightweight-charts.

This module provides the main ChartOptions class for configuring chart display,
behavior, and appearance. ChartOptions serves as the central configuration
container for all chart-related settings including layout, interaction,
localization, and trade visualization features.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.charts.options.interaction_options import (
    CrosshairOptions,
    KineticScrollOptions,
    TrackingModeOptions,
)
from streamlit_lightweight_charts_pro.charts.options.layout_options import (
    GridOptions,
    LayoutOptions,
)
from streamlit_lightweight_charts_pro.charts.options.localization_options import LocalizationOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.charts.options.time_scale_options import TimeScaleOptions
from streamlit_lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from streamlit_lightweight_charts_pro.utils import chainable_field


@dataclass
@chainable_field("width", int)
@chainable_field("height", int)
@chainable_field("auto_size", bool)
@chainable_field("layout", LayoutOptions)
@chainable_field("left_price_scale", PriceScaleOptions)
@chainable_field("right_price_scale", PriceScaleOptions)
@chainable_field("overlay_price_scales", dict)
@chainable_field("time_scale", TimeScaleOptions)
@chainable_field("crosshair", CrosshairOptions)
@chainable_field("grid", GridOptions)
@chainable_field("handle_scroll", bool)
@chainable_field("handle_scale", bool)
@chainable_field("handle_double_click", bool)
@chainable_field("fit_content_on_load", bool)
@chainable_field("kinetic_scroll", KineticScrollOptions)
@chainable_field("tracking_mode", TrackingModeOptions)
@chainable_field("localization", LocalizationOptions)
@chainable_field("add_default_pane", bool)
@chainable_field("trade_visualization", TradeVisualizationOptions)
class ChartOptions(Options):
    """
    Configuration options for chart display and behavior.

    This class encapsulates all the configuration options that control how a chart
    is displayed, including its size, layout, grid settings, and various interactive
    features. It provides a comprehensive interface for customizing chart appearance
    and behavior.

    Attributes:
        width (Optional[int]): Chart width in pixels. If None, uses 100% of container width.
        height (int): Chart height in pixels. Defaults to 400.
        auto_size (bool): Whether to automatically size the chart to fit its container.
        layout (LayoutOptions): Chart layout configuration (background, text colors, etc.).
        left_price_scale (Optional[PriceScaleOptions]): Left price scale configuration.
        right_price_scale (PriceScaleOptions): Right price scale configuration.
        overlay_price_scales (Dict[str, PriceScaleOptions]): Overlay price scale configurations.
        time_scale (TimeScaleOptions): Time scale configuration (axis, time formatting, etc.).
        crosshair (CrosshairOptions): Crosshair configuration for mouse interactions.
        grid (GridOptions): Grid configuration (horizontal and vertical grid lines).
        handle_scroll (bool): Whether to enable scroll interactions.
        handle_scale (bool): Whether to enable scale interactions.
        kinetic_scroll (Optional[KineticScrollOptions]): Kinetic scroll options.
        tracking_mode (Optional[TrackingModeOptions]): Mouse tracking mode for crosshair and
                                                       tooltips.
        localization (Optional[LocalizationOptions]): Localization settings for date/time
                                                      formatting.
        add_default_pane (bool): Whether to add a default pane to the chart.
        trade_visualization (Optional[TradeVisualizationOptions]): Trade visualization
            configuration options.
        sync (Optional[SyncOptions]): Synchronization options for linked charts.

    Raises:
        TypeError: If any attribute is assigned an invalid type during initialization.

    Example:
        ```python
        from streamlit_lightweight_charts_pro import ChartOptions
        from streamlit_lightweight_charts_pro.charts.options.layout_options import LayoutOptions

        # Create custom chart options
        options = ChartOptions(
            width=800,
            height=600,
            layout=LayoutOptions(background_color="#ffffff"),
            handle_scroll=True,
            handle_scale=True
        )
        ```
    """

    # Size and layout options
    width: Optional[int] = None
    height: int = 400
    auto_size: bool = True

    # Layout and appearance
    layout: LayoutOptions = field(default_factory=LayoutOptions)
    left_price_scale: Optional[PriceScaleOptions] = None
    right_price_scale: PriceScaleOptions = field(default_factory=PriceScaleOptions)
    overlay_price_scales: Dict[str, PriceScaleOptions] = field(default_factory=dict)
    time_scale: TimeScaleOptions = field(default_factory=TimeScaleOptions)

    # Interaction options
    crosshair: CrosshairOptions = field(default_factory=CrosshairOptions)
    grid: GridOptions = field(default_factory=GridOptions)
    handle_scroll: bool = True
    handle_scale: bool = True
    handle_double_click: bool = True
    fit_content_on_load: bool = True
    kinetic_scroll: Optional[KineticScrollOptions] = None
    tracking_mode: Optional[TrackingModeOptions] = None

    # Localization and UI
    localization: Optional[LocalizationOptions] = None
    add_default_pane: bool = True

    # Trade visualization options
    trade_visualization: Optional[TradeVisualizationOptions] = None

    # Synchronization options
