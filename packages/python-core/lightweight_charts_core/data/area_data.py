"""Area data class for lightweight-charts-core.

This module provides the AreaData class for area chart data.
"""

from dataclasses import dataclass
from typing import ClassVar, Optional

from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.utils.chainable import validated_field


@dataclass
@validated_field("line_color", str, validator="color", allow_none=True)
@validated_field("top_color", str, validator="color", allow_none=True)
@validated_field("bottom_color", str, validator="color", allow_none=True)
class AreaData(SingleValueData):
    """Data class for area chart data points with optional color styling.

    Attributes:
        time: UNIX timestamp in seconds.
        value: The numeric value for this data point.
        line_color: Optional color for the area line.
        top_color: Optional color for the top of the area fill.
        bottom_color: Optional color for the bottom of the area fill.
    """

    REQUIRED_COLUMNS: ClassVar[set] = set()
    OPTIONAL_COLUMNS: ClassVar[set] = {"line_color", "top_color", "bottom_color"}

    line_color: Optional[str] = None
    top_color: Optional[str] = None
    bottom_color: Optional[str] = None
