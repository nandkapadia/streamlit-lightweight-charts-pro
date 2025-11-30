"""Line data class for lightweight-charts-core.

This module provides the LineData class for line chart data with optional color.
"""

from dataclasses import dataclass
from typing import ClassVar, Optional

from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.utils.chainable import validated_field


@dataclass
@validated_field("color", str, validator="color", allow_none=True)
class LineData(SingleValueData):
    """Data class for line chart data points with optional color styling.

    Attributes:
        time: UNIX timestamp in seconds.
        value: The numeric value for this data point.
        color: Optional color for this data point in hex or rgba format.
    """

    REQUIRED_COLUMNS: ClassVar[set] = set()
    OPTIONAL_COLUMNS: ClassVar[set] = {"color"}

    color: Optional[str] = None
