"""Line options configuration for streamlit-lightweight-charts.

This module provides line styling option classes for configuring
the appearance of line series on charts.
"""

from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    LastPriceAnimationMode,
    LineStyle,
    LineType,
)
from streamlit_lightweight_charts_pro.utils import chainable_field
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
@chainable_field("color", str, validator="color")
@chainable_field("line_style", LineStyle)
@chainable_field("line_width", int)
@chainable_field("line_type", LineType)
@chainable_field("line_visible", bool)
@chainable_field("point_markers_visible", bool)
@chainable_field("point_markers_radius", int)
@chainable_field("crosshair_marker_visible", bool)
@chainable_field("crosshair_marker_radius", int)
@chainable_field("crosshair_marker_border_color", str, validator="color")
@chainable_field("crosshair_marker_background_color", str, validator="color")
@chainable_field("crosshair_marker_border_width", int)
@chainable_field("last_price_animation", LastPriceAnimationMode)
class LineOptions(Options):
    """
    Encapsulates style options for a line series, mirroring TradingView's LineStyleOptions.

    See: https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineStyleOptions

    Attributes:
        color (str): Line color. Default: '#2196f3'.
        line_style (LineStyle): Line style. Default: LineStyle.SOLID.
        line_width (int): Line width in pixels. Default: 3.
        line_type (LineType): Line type. Default: LineType.SIMPLE.
        line_visible (bool): Show series line. Default: True.
        point_markers_visible (bool): Show circle markers on each point. Default: False.
        point_markers_radius (Optional[int]): Circle markers radius in pixels. Default: None.
        crosshair_marker_visible (bool): Show the crosshair marker. Default: True.
        crosshair_marker_radius (int): Crosshair marker radius in pixels. Default: 4.
        crosshair_marker_border_color (str): Crosshair marker border color. Default: ''.
        crosshair_marker_background_color (str): Crosshair marker background color. Default: ''.
        crosshair_marker_border_width (int): Crosshair marker border width in pixels. Default: 2.
        last_price_animation (LastPriceAnimationMode): Last price animation mode.
            Default: LastPriceAnimationMode.DISABLED.
    """

    color: str = "#2196f3"
    line_style: LineStyle = LineStyle.SOLID
    line_width: int = 3
    line_type: LineType = LineType.SIMPLE
    line_visible: bool = True
    point_markers_visible: bool = False
    point_markers_radius: Optional[int] = None
    crosshair_marker_visible: bool = False
    crosshair_marker_radius: int = 4
    crosshair_marker_border_color: str = ""
    crosshair_marker_background_color: str = ""
    crosshair_marker_border_width: int = 2
    last_price_animation: LastPriceAnimationMode = LastPriceAnimationMode.DISABLED

    @staticmethod
    def _validate_color_static(color: str, property_name: str) -> str:
        """Static version of color validator for decorator use."""
        if not is_valid_color(color):
            raise ValueError(
                f"Invalid color format for {property_name}: {color!r}. Must be hex or rgba."
            )
        return color
