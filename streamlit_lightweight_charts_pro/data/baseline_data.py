"""
Baseline data for streamlit-lightweight-charts.

This module provides the BaselineData class for creating baseline chart data points
that support both top and bottom area styling with individual color controls.
"""

from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.data.single_value_data import SingleValueData
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
class BaselineData(SingleValueData):
    """
    Data class for a baseline chart point.

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
        - All color properties should be valid hex (e.g., #2196F3) or rgba strings (e.g., rgba(33,150,243,1)).
        - If color properties are not provided, colors from series options will be used.
        - Baseline series display data with both positive and negative areas relative to a baseline value.
    """

    REQUIRED_COLUMNS = set()
    OPTIONAL_COLUMNS = {
        "top_fill_color1",
        "top_fill_color2",
        "top_line_color",
        "bottom_fill_color1",
        "bottom_fill_color2",
        "bottom_line_color",
    }

    top_fill_color1: Optional[str] = None
    top_fill_color2: Optional[str] = None
    top_line_color: Optional[str] = None
    bottom_fill_color1: Optional[str] = None
    bottom_fill_color2: Optional[str] = None
    bottom_line_color: Optional[str] = None

    def __post_init__(self):
        """Validate color properties after initialization."""
        super().__post_init__()

        # Validate all color properties if provided
        color_properties = [
            "top_fill_color1",
            "top_fill_color2",
            "top_line_color",
            "bottom_fill_color1",
            "bottom_fill_color2",
            "bottom_line_color",
        ]

        for prop_name in color_properties:
            color_value = getattr(self, prop_name)
            if color_value is not None and color_value != "":
                if not is_valid_color(color_value):
                    raise ValueError(
                        f"Invalid color format for {prop_name}: {color_value!r}. Must be hex or"
                        " rgba."
                    )
