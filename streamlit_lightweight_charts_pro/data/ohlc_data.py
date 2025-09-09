"""
OHLC data classes for streamlit-lightweight-charts.

This module provides data classes for OHLC (Open, High, Low, Close) data points
used in candlestick and bar charts.
"""

import math
from dataclasses import dataclass

from streamlit_lightweight_charts_pro.data.data import Data


@dataclass
class OhlcData(Data):
    """
    Data point for candlestick and bar charts.

    This class represents an OHLC (Open, High, Low, Close) data point,
    commonly used in financial charts for candlestick and bar representations.

    Attributes:
        time: Time for this data point as UNIX timestamp.
        open: Opening price for the period.
        high: Highest price during the period.
        low: Lowest price during the period.
        close: Closing price for the period.
    """

    REQUIRED_COLUMNS = {"open", "high", "low", "close"}
    OPTIONAL_COLUMNS = set()

    open: float
    high: float
    low: float
    close: float

    def __post_init__(self):
        # Normalize time
        super().__post_init__()  # Call parent's __post_init__

        # Validate OHLC relationships
        if self.high < self.low:
            raise ValueError("high must be greater than or equal to low")
        if self.open < 0 or self.high < 0 or self.low < 0 or self.close < 0:
            raise ValueError("all OHLC values must be non-negative")

        # Handle NaN values
        for field_name in ["open", "high", "low", "close"]:
            value = getattr(self, field_name)
            if isinstance(value, float) and math.isnan(value):
                setattr(self, field_name, 0.0)
            elif value is None:
                raise ValueError(f"{field_name} must not be None")
