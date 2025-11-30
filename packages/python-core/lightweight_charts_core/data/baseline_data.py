"""Baseline data class for lightweight-charts-core.

This module provides the BaselineData class for baseline chart data.
"""

from dataclasses import dataclass
from typing import ClassVar, Optional

from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.utils.chainable import validated_field


@dataclass
@validated_field("top_fill_color1", str, validator="color", allow_none=True)
@validated_field("top_fill_color2", str, validator="color", allow_none=True)
@validated_field("top_line_color", str, validator="color", allow_none=True)
@validated_field("bottom_fill_color1", str, validator="color", allow_none=True)
@validated_field("bottom_fill_color2", str, validator="color", allow_none=True)
@validated_field("bottom_line_color", str, validator="color", allow_none=True)
class BaselineData(SingleValueData):
    """Data class for baseline chart data points with optional color styling.

    Attributes:
        time: UNIX timestamp in seconds.
        value: The numeric value for this data point.
        top_fill_color1: Optional color for the top fill gradient start.
        top_fill_color2: Optional color for the top fill gradient end.
        top_line_color: Optional color for the top line.
        bottom_fill_color1: Optional color for the bottom fill gradient start.
        bottom_fill_color2: Optional color for the bottom fill gradient end.
        bottom_line_color: Optional color for the bottom line.
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

    top_fill_color1: Optional[str] = None
    top_fill_color2: Optional[str] = None
    top_line_color: Optional[str] = None
    bottom_fill_color1: Optional[str] = None
    bottom_fill_color2: Optional[str] = None
    bottom_line_color: Optional[str] = None
