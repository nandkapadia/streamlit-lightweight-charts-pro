"""UI option classes for streamlit-lightweight-charts."""

from dataclasses import dataclass, field
from typing import List

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.utils import chainable_field


@dataclass
@chainable_field("text", str)
@chainable_field("tooltip", str)
class RangeConfig(Options):
    """Range configuration for range switcher."""

    text: str = ""
    tooltip: str = ""


@dataclass
@chainable_field("visible", bool)
@chainable_field("ranges", list)
class RangeSwitcherOptions(Options):
    """Range switcher configuration."""

    visible: bool = True
    ranges: List[RangeConfig] = field(default_factory=list)


@dataclass
@chainable_field("visible", bool)
@chainable_field("position", str)
@chainable_field("symbol_name", str)
@chainable_field("background_color", str)
@chainable_field("border_color", str)
@chainable_field("border_width", int)
@chainable_field("border_radius", int)
@chainable_field("padding", int)
@chainable_field("margin", int)
@chainable_field("z_index", int)
@chainable_field("price_format", str)
@chainable_field("text", str)
@chainable_field("show_values", bool)
@chainable_field("value_format", str)
@chainable_field("update_on_crosshair", bool)
class LegendOptions(Options):
    """
    Legend configuration with support for custom HTML templates and dynamic value display.

    The text supports a single placeholder that will be replaced by the frontend:
    - $$value$$: Current value of the series at crosshair position

    Note: Title and color should be handled directly in your HTML template using
    the series title and color from your series configuration. This avoids
    conflicts with Python's f-string syntax and other templating systems.

    Dynamic Value Display:
    When show_values=True, the legend will automatically display current values
    at the crosshair position without needing to specify a custom template.

    Example templates:
    - "<span style='color: #2196f3'>MA20: $$value$$</span>"
    - "<div><strong>Price</strong><br/>Value: $$value$$</div>"
    - "<span class='legend-item'>RSI: $$value$$</span>"

    Example with dynamic values:
    LegendOptions(show_values=True, value_format=".2f", update_on_crosshair=True)
    """

    visible: bool = True
    position: str = "top-left"
    symbol_name: str = ""
    background_color: str = "rgba(255, 255, 255, 0.9)"
    border_color: str = "#e1e3e6"
    border_width: int = 1
    border_radius: int = 4
    padding: int = 4
    margin: int = 4
    z_index: int = 1000
    price_format: str = ".2f"
    text: str = ""
    show_values: bool = True
    value_format: str = ".2f"
    update_on_crosshair: bool = True
