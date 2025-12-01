"""UI option classes for streamlit-lightweight-charts."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Literal

from lightweight_charts_core.charts.options.base_options import Options
from lightweight_charts_core.utils import chainable_field


class TimeRange(Enum):
    """Time range constants in seconds for range switcher."""

    FIVE_MINUTES = 300
    FIFTEEN_MINUTES = 900
    ONE_HOUR = 3600
    FOUR_HOURS = 14400
    ONE_DAY = 86400
    ONE_WEEK = 604800
    ONE_MONTH = 2592000
    THREE_MONTHS = 7776000
    SIX_MONTHS = 15552000
    ONE_YEAR = 31536000
    FIVE_YEARS = 157680000
    ALL = None  # Special value for "all data"


@dataclass
@chainable_field("text", str)
@chainable_field("tooltip", str)
@chainable_field("range", TimeRange)
class RangeConfig(Options):
    """Range configuration for range switcher."""

    text: str = ""
    tooltip: str = ""
    range: TimeRange = TimeRange.ONE_DAY

    @property
    def seconds(self) -> int | None:
        """Get the time range in seconds."""
        return self.range.value if self.range else None


@dataclass
@chainable_field("visible", bool)
@chainable_field("ranges", list)
@chainable_field("position", str)
class RangeSwitcherOptions(Options):
    """Range switcher configuration.

    Range switcher supports only corner positions: top-left, top-right,
    bottom-left, bottom-right. Center positions are not supported.

    Range buttons are automatically hidden when they exceed the available
    data timespan, providing a better user experience.
    """

    visible: bool = True
    ranges: list[RangeConfig] = field(default_factory=list)
    position: Literal["top-left", "top-right", "bottom-left", "bottom-right"] = "bottom-right"


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
    """Legend configuration with support for custom HTML templates and dynamic value display.

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
    padding: int = 6
    margin: int = 0  # No margin - spacing handled by layout manager
    z_index: int = 1000
    price_format: str = ".2f"
    text: str = ""
    show_values: bool = True
    value_format: str = ".2f"
    update_on_crosshair: bool = True
