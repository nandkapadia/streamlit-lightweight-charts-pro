"""Bar data class for lightweight-charts-core.

This module provides the BarData class for bar chart data.
"""

from dataclasses import dataclass
from typing import ClassVar, Optional

from lightweight_charts_core.data.ohlc_data import OhlcData
from lightweight_charts_core.utils.chainable import validated_field


@dataclass
@validated_field("color", str, validator="color", allow_none=True)
class BarData(OhlcData):
    """Data class for bar chart data points with optional color styling.

    Attributes:
        time: UNIX timestamp in seconds.
        open: Opening price for the time period.
        high: Highest price during the time period.
        low: Lowest price during the time period.
        close: Closing price for the time period.
        color: Optional color for the bar.
    """

    REQUIRED_COLUMNS: ClassVar[set] = set()
    OPTIONAL_COLUMNS: ClassVar[set] = {"color"}

    color: Optional[str] = None
