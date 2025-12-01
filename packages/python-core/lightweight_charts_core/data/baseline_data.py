"""Baseline data for streamlit-lightweight-charts.

This module provides the BaselineData class for creating baseline chart data points
that support both top and bottom area styling with individual color controls.
"""

from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.utils import validated_field


@dataclass
@validated_field("top_fill_color1", str, validator="color", allow_none=True)
@validated_field("top_fill_color2", str, validator="color", allow_none=True)
@validated_field("top_line_color", str, validator="color", allow_none=True)
@validated_field("bottom_fill_color1", str, validator="color", allow_none=True)
@validated_field("bottom_fill_color2", str, validator="color", allow_none=True)
@validated_field("bottom_line_color", str, validator="color", allow_none=True)
class BaselineData(SingleValueData):
    """Data class for a baseline chart point.

    Inherits from SingleValueData and adds optional color properties for baseline series.
    Baseline series display data with both top and bottom areas, each with their own
    styling options.

    Attributes:
        time (int): UNIX timestamp in seconds.
        value (float): Data value. NaN is converted to 0.0.
        top_fill_color1 (Optional[str]): Optional top area top fill color (hex or rgba).
        top_fill_color2 (Optional[str]): Optional top area bottom fill color (hex or rgba).
        top_line_color (Optional[str]): Optional top area line color (hex or rgba).
        bottom_fill_color1 (Optional[str]): Optional bottom area top fill color (hex or rgba).
        bottom_fill_color2 (Optional[str]): Optional bottom area bottom fill color
            (hex or rgba).
        bottom_line_color (Optional[str]): Optional bottom area line color (hex or rgba).

    See also: SingleValueData

    Note:
         - All color properties should be valid hex (e.g., #2196F3) or rgba strings
           (e.g., rgba(33,150,243,1)).
        - If color properties are not provided, colors from series options will be used.
         - Baseline series display data with both positive and negative areas relative
           to a baseline value.

    """

    REQUIRED_COLUMNS: ClassVar[set] = set()
    OPTIONAL_COLUMNS: ClassVar[set] = {
        "top_fill_color1",
        "top_fill_color2",
        "top_line_color",
        "bottom_fill_color1",
        "bottom_fill_color2",
        "bottom_line_color",
    }

    top_fill_color1: str | None = None
    top_fill_color2: str | None = None
    top_line_color: str | None = None
    bottom_fill_color1: str | None = None
    bottom_fill_color2: str | None = None
    bottom_line_color: str | None = None
