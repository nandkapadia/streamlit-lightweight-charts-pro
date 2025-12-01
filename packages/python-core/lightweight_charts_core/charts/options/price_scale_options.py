"""Price scale option classes for streamlit-lightweight-charts.

This module provides comprehensive configuration options for price scales in financial
charts. Price scales control how price values are displayed, formatted, and positioned
on the chart, including both left and right price scales as well as overlay scales.

Key Features:
    - Price scale visibility and behavior configuration
    - Auto-scaling and manual scale control options
    - Visual appearance customization (colors, borders, text)
    - Tick marks and label positioning options
    - Scale margins and minimum width settings
    - Price scale identification and management

Example:
    ```python
    from lightweight_charts_core.charts.options import PriceScaleOptions
    from lightweight_charts_core.type_definitions.enums import PriceScaleMode

    # Create price scale options
    price_scale = PriceScaleOptions(
        visible=True,
        auto_scale=True,
        mode=PriceScaleMode.NORMAL,
        border_color="#e0e0e0",
        text_color="#333333",
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT

"""

# Standard Imports
from dataclasses import dataclass, field

# Local Imports
from lightweight_charts_core.charts.options.base_options import Options
from lightweight_charts_core.type_definitions.enums import PriceScaleMode
from lightweight_charts_core.utils import chainable_field


@dataclass
@chainable_field("top", (int, float))
@chainable_field("bottom", (int, float))
class PriceScaleMargins(Options):
    """Configuration for price scale margins in financial charts.

    This class defines the margin settings for price scales, controlling the
    spacing between the chart content and the price scale boundaries. Margins
    are specified as percentages of the visible price range.

    Attributes:
        top (float): Top margin as a percentage of the visible price range.
            Defaults to 0.1 (10%). Higher values create more space above the chart.
        bottom (float): Bottom margin as a percentage of the visible price range.
            Defaults to 0.1 (10%). Higher values create more space below the chart.

    Example:
        ```python
        from lightweight_charts_core.charts.options import PriceScaleMargins

        # Create margins with custom spacing
        margins = PriceScaleMargins(top=0.05, bottom=0.05)  # 5% margins

        # Use with price scale options
        price_scale = PriceScaleOptions(scale_margins=margins)
        ```

    """

    top: float = 0.1  # Top margin as percentage of visible price range
    bottom: float = 0.1  # Bottom margin as percentage of visible price range


@dataclass
@chainable_field("visible", bool)
@chainable_field("auto_scale", bool)
@chainable_field("mode", PriceScaleMode)
@chainable_field("invert_scale", bool)
@chainable_field("border_visible", bool)
@chainable_field("border_color", str, validator="color")
@chainable_field("text_color", str, validator="color")
@chainable_field("ticks_visible", bool)
@chainable_field("ensure_edge_tick_marks_visible", bool)
@chainable_field("align_labels", bool)
@chainable_field("entire_text_only", bool)
@chainable_field("minimum_width", int)
@chainable_field("scale_margins", PriceScaleMargins)
class PriceScaleOptions(Options):
    """Comprehensive configuration options for price scales in financial charts.

    This class provides extensive configuration options for price scales, controlling
    how price values are displayed, formatted, and positioned on the chart. It supports
    both left and right price scales as well as overlay scales with full customization
    of appearance, behavior, and interaction.

    Attributes:
        visible (bool): Whether the price scale is visible. Defaults to True.
        auto_scale (bool): Whether to automatically scale the price range based on data.
            Defaults to True. Set to False for manual scale control.
        mode (PriceScaleMode): Price scale mode (NORMAL, LOGARITHMIC, PERCENTAGE).
            Defaults to PriceScaleMode.NORMAL for linear scaling.
        invert_scale (bool): Whether to invert the price scale (high to low).
            Defaults to False for normal orientation.
        border_visible (bool): Whether to show the price scale border. Defaults to True.
        border_color (str): Color of the price scale border. Defaults to light gray.
            Must be valid color format (hex or rgba).
        text_color (str): Color of price scale text and labels. Defaults to dark gray.
            Must be valid color format (hex or rgba).
        ticks_visible (bool): Whether to show tick marks on the price scale.
            Defaults to True.
        ensure_edge_tick_marks_visible (bool): Whether to ensure edge tick marks
            are always visible. Defaults to False.
        align_labels (bool): Whether to align price labels. Defaults to True.
        entire_text_only (bool): Whether to show only complete text labels.
            Defaults to False.
        minimum_width (int): Minimum width of the price scale in pixels.
            Defaults to 72 pixels.
        scale_margins (PriceScaleMargins): Margin configuration for the price scale.
            Defaults to 10% margins on top and bottom.

    Example:
        ```python
        from lightweight_charts_core.charts.options import PriceScaleOptions
        from lightweight_charts_core.type_definitions.enums import PriceScaleMode

        # Create left price scale with custom styling
        left_scale = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            mode=PriceScaleMode.NORMAL,
            border_color="#e0e0e0",
            text_color="#333333",
            minimum_width=100,
        )

        # Create right price scale for overlay series
        right_scale = PriceScaleOptions(visible=True, auto_scale=False)
        ```

    See Also:
        PriceScaleMargins: Configuration class for price scale margins.
        PriceScaleMode: Enum for different price scale modes.

    """

    # Core visibility and behavior settings
    visible: bool = True  # Whether the price scale is visible
    auto_scale: bool = True  # Whether to automatically scale based on data
    mode: PriceScaleMode = PriceScaleMode.NORMAL  # Price scale mode (linear/log/percentage)
    invert_scale: bool = False  # Whether to invert the scale orientation

    # Visual appearance configuration
    border_visible: bool = True  # Whether to show the price scale border
    border_color: str = "rgba(197, 203, 206, 0.8)"  # Border color with transparency
    text_color: str = "#131722"  # Text color (TradingView dark gray)

    # Tick marks and label configuration
    ticks_visible: bool = True  # Whether to show tick marks
    ensure_edge_tick_marks_visible: bool = False  # Force edge tick marks to be visible
    align_labels: bool = True  # Whether to align price labels
    entire_text_only: bool = False  # Whether to show only complete text labels

    # Size and positioning settings
    minimum_width: int = 72  # Minimum width in pixels
    scale_margins: PriceScaleMargins = field(
        default_factory=PriceScaleMargins,
    )  # Margin configuration
