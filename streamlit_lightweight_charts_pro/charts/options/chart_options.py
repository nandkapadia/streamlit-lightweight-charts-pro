"""Chart options configuration for streamlit-lightweight-charts.

This module provides the main ChartOptions class for configuring chart display,
behavior, and appearance. ChartOptions serves as the central configuration
container for all chart-related settings including layout, interaction,
localization, and trade visualization features.

Key Features:
    - Comprehensive chart configuration management
    - Layout and sizing options for responsive design
    - Price scale configuration for multi-scale charts
    - Time scale customization for different timeframes
    - Interactive features like crosshair and tracking modes
    - Grid and visual styling options
    - Localization support for international markets
    - Trade visualization and range switching capabilities

Example:
    ```python
    from streamlit_lightweight_charts_pro.charts.options import ChartOptions
    from streamlit_lightweight_charts_pro.charts.options.layout_options import LayoutOptions

    # Create custom chart options
    options = ChartOptions(
        width=800, height=400, auto_size=True, layout=LayoutOptions(text_color="#000000")
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from dataclasses import dataclass, field
from typing import Dict, Optional

# Local Imports
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
from streamlit_lightweight_charts_pro.charts.options.ui_options import RangeSwitcherOptions
from streamlit_lightweight_charts_pro.exceptions import (
    PriceScaleIdTypeError,
    PriceScaleOptionsTypeError,
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
@chainable_field("range_switcher", RangeSwitcherOptions)
class ChartOptions(Options):
    """Configuration options for chart display and behavior in financial visualization.

    This class encapsulates all the configuration options that control how a chart
    is displayed, including its size, layout, grid settings, and various interactive
    features. It provides a comprehensive interface for customizing chart appearance
    and behavior across different chart types and use cases.

    The ChartOptions class serves as the central configuration container that combines
    layout, interaction, localization, and visualization settings into a unified
    configuration object that can be passed to chart instances.

    Attributes:
        width (Optional[int]): Chart width in pixels. If None, uses 100% of container width.
            Defaults to None for automatic sizing.
        height (int): Chart height in pixels. Defaults to 400.
        auto_size (bool): Whether to automatically size the chart to fit its container.
            Defaults to False.
        layout (LayoutOptions): Chart layout configuration including background colors,
            text styling, and visual appearance settings.
        left_price_scale (Optional[PriceScaleOptions]): Left price scale configuration.
            If None, left price scale is disabled.
        right_price_scale (PriceScaleOptions): Right price scale configuration.
            Defaults to standard right price scale settings.
        overlay_price_scales (Dict[str, PriceScaleOptions]): Overlay price scale
            configurations for multiple price scales on the same chart.
        time_scale (TimeScaleOptions): Time scale configuration including axis settings,
            time formatting, and time range controls.
        crosshair (CrosshairOptions): Crosshair configuration for mouse interactions
            and data point highlighting.
        grid (GridOptions): Grid configuration for horizontal and vertical grid lines.
        handle_scroll (bool): Whether to enable scroll interactions for time navigation.
            Defaults to True.
        handle_scale (bool): Whether to enable scale interactions for zooming.
            Defaults to True.
        handle_double_click (bool): Whether to enable double-click interactions.
            Defaults to True.
        fit_content_on_load (bool): Whether to fit content to visible area on initial load.
            Defaults to False.
        kinetic_scroll (Optional[KineticScrollOptions]): Kinetic scroll options for
            momentum-based scrolling behavior.
        tracking_mode (Optional[TrackingModeOptions]): Mouse tracking mode for crosshair
            and tooltips. Controls how the chart responds to mouse movement.
        localization (Optional[LocalizationOptions]): Localization settings for date/time
            formatting and locale-specific display options.
        add_default_pane (bool): Whether to add a default pane to the chart.
            Defaults to True.
        trade_visualization (Optional[TradeVisualizationOptions]): Trade visualization
            configuration options for displaying trade markers and annotations.
        range_switcher (Optional[RangeSwitcherOptions]): Range switcher configuration
            for time range selection buttons and presets.

    Raises:
        TypeError: If any attribute is assigned an invalid type during initialization.
        PriceScaleIdTypeError: If price scale ID is not a string.
        PriceScaleOptionsTypeError: If price scale options are not of correct type.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.charts.options import ChartOptions
        from streamlit_lightweight_charts_pro.charts.options.layout_options import LayoutOptions

        # Create custom chart options
        options = ChartOptions(
            width=800,
            height=600,
            layout=LayoutOptions(background_color="#ffffff"),
            handle_scroll=True,
            handle_scale=True,
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

    # UI options
    range_switcher: Optional[RangeSwitcherOptions] = None

    # Synchronization options

    def __post_init__(self):
        """Validate chart options after initialization."""
        # Validate price scale types first before accessing attributes
        if self.right_price_scale is not None and not isinstance(
            self.right_price_scale, PriceScaleOptions
        ):
            raise PriceScaleOptionsTypeError("right_price_scale", type(self.right_price_scale))

        if self.left_price_scale is not None and not isinstance(
            self.left_price_scale, PriceScaleOptions
        ):
            raise PriceScaleOptionsTypeError("left_price_scale", type(self.left_price_scale))

        # CRITICAL FIX: Ensure default price scales have their IDs set
        # Without this, the empty string price_scale_id gets filtered out during serialization
        # This causes the frontend to fail matching series to their price scales
        if self.right_price_scale is not None and self.right_price_scale.price_scale_id is None:
            # Set the price_scale_id to "right" if it's None
            self.right_price_scale.price_scale_id = "right"

        if self.left_price_scale is not None and self.left_price_scale.price_scale_id is None:
            # Set the price_scale_id to "left" if it's None
            self.left_price_scale.price_scale_id = "left"

        # Validate price scale IDs are strings
        if (
            self.right_price_scale is not None
            and self.right_price_scale.price_scale_id is not None
            and not isinstance(self.right_price_scale.price_scale_id, str)
        ):
            raise PriceScaleIdTypeError(
                "right_price_scale",
                type(self.right_price_scale.price_scale_id),
            )

        if (
            self.left_price_scale is not None
            and self.left_price_scale.price_scale_id is not None
            and not isinstance(self.left_price_scale.price_scale_id, str)
        ):
            raise PriceScaleIdTypeError(
                "left_price_scale",
                type(self.left_price_scale.price_scale_id),
            )
