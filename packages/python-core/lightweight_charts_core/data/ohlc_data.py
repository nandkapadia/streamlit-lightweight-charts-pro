"""OHLC data class for lightweight-charts-core.

This module provides the OhlcData class for OHLC (Open, High, Low, Close) data.
"""

import math
from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.data import Data
from lightweight_charts_core.exceptions import RequiredFieldError, ValueValidationError


@dataclass
class OhlcData(Data):
    """Data class for OHLC (Open, High, Low, Close) data points.

    Used for candlestick and bar charts displaying financial market data.

    Attributes:
        time: UNIX timestamp in seconds.
        open: Opening price for the time period.
        high: Highest price during the time period.
        low: Lowest price during the time period.
        close: Closing price for the time period.
    """

    REQUIRED_COLUMNS: ClassVar[set] = {"open", "high", "low", "close"}
    OPTIONAL_COLUMNS: ClassVar[set] = set()

    open: float
    high: float
    low: float
    close: float

    def __post_init__(self):
        """Validate OHLC data relationships and normalize values."""
        super().__post_init__()

        if self.high < self.low:
            raise ValueValidationError("high", "must be greater than or equal to low")

        if self.open < 0 or self.high < 0 or self.low < 0 or self.close < 0:
            raise ValueValidationError.non_negative_value("all OHLC values")

        for field_name in ["open", "high", "low", "close"]:
            value = getattr(self, field_name)
            if isinstance(value, float) and math.isnan(value):
                setattr(self, field_name, 0.0)
            elif value is None:
                raise RequiredFieldError(field_name)
