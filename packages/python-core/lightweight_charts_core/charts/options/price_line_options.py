"""Price line options configuration for streamlit-lightweight-charts.

This module provides price line option classes for configuring
horizontal price lines on charts.
"""

from dataclasses import dataclass

from lightweight_charts_core.charts.options.base_options import Options
from lightweight_charts_core.exceptions import ColorValidationError
from lightweight_charts_core.type_definitions.enums import LineStyle
from lightweight_charts_core.utils import chainable_field
from lightweight_charts_core.utils.data_utils import is_valid_color


@dataclass
@chainable_field("id", str)
@chainable_field("price", (int, float))
@chainable_field("color", str, validator="color")
@chainable_field("line_width", int)
@chainable_field("line_style", LineStyle)
@chainable_field("line_visible", bool)
@chainable_field("axis_label_visible", bool)
@chainable_field("title", str)
@chainable_field("axis_label_color", str, validator="color")
@chainable_field("axis_label_text_color", str, validator="color")
class PriceLineOptions(Options):
    """Encapsulates style and configuration options for a price line.

    Matching TradingView's PriceLineOptions.

    See: https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceLineOptions

    Attributes:
        id (Optional[str]): Optional ID of the price line.
        price (float): Price line's value.
        color (str): Price line's color (hex or rgba).
        line_width (int): Price line's width in pixels.
        line_style (LineStyle): Price line's style.
        line_visible (bool): Whether the line is displayed.
        axis_label_visible (bool): Whether the price value is shown on the price scale.
        title (str): Title for the price line on the chart pane.
        axis_label_color (Optional[str]): Background color for the axis label.
        axis_label_text_color (Optional[str]): Text color for the axis label.

    """

    id: str | None = None
    price: float = 0.0
    color: str = ""
    line_width: int = 1
    line_style: LineStyle = LineStyle.SOLID
    line_visible: bool = True
    axis_label_visible: bool = False
    title: str = ""
    axis_label_color: str | None = None
    axis_label_text_color: str | None = None

    @staticmethod
    def _validate_color_static(color: str, property_name: str) -> str:
        """Static version of color validator for decorator use."""
        if color and not is_valid_color(color):
            raise ColorValidationError(property_name, color)
        return color
