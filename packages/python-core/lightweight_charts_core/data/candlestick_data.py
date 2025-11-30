"""Candlestick data class for lightweight-charts-core.

This module provides the CandlestickData class for candlestick chart data.
"""

from dataclasses import dataclass
from typing import ClassVar, Optional

from lightweight_charts_core.data.ohlc_data import OhlcData
from lightweight_charts_core.utils.chainable import validated_field


@dataclass
@validated_field("color", str, validator="color", allow_none=True)
@validated_field("border_color", str, validator="color", allow_none=True)
@validated_field("wick_color", str, validator="color", allow_none=True)
class CandlestickData(OhlcData):
    """Data class for candlestick chart data points with optional color styling.

    Attributes:
        time: UNIX timestamp in seconds.
        open: Opening price for the time period.
        high: Highest price during the time period.
        low: Lowest price during the time period.
        close: Closing price for the time period.
        color: Optional color for the candlestick body.
        border_color: Optional border color for the candlestick.
        wick_color: Optional wick color for the candlestick.
    """

    REQUIRED_COLUMNS: ClassVar[set] = set()
    OPTIONAL_COLUMNS: ClassVar[set] = {"color", "border_color", "wick_color"}

    color: Optional[str] = None
    border_color: Optional[str] = None
    wick_color: Optional[str] = None
