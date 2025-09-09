"""
OHLC data classes for streamlit-lightweight-charts.

This module provides data classes for OHLC (Open, High, Low, Close) data points
used in candlestick and bar charts.
"""

import math
from dataclasses import dataclass

from streamlit_lightweight_charts_pro.data.ohlc_data import OhlcData


@dataclass
class OhlcvData(OhlcData):
    """
    Data point for candlestick charts with volume.

    This class represents an OHLCV (Open, High, Low, Close, Volume) data point,
    commonly used in financial charts for candlestick representations with volume.

    Attributes:
        time: Time for this data point as UNIX timestamp.
        open: Opening price for the period.
        high: Highest price during the period.
        low: Lowest price during the period.
        close: Closing price for the period.
        volume: Trading volume for the period.
    """

    REQUIRED_COLUMNS = {"volume"}
    OPTIONAL_COLUMNS = set()

    volume: float

    def __post_init__(self):
        """Normalize time and validate OHLCV data."""
        # Normalize time
        super().__post_init__()  # Call parent's __post_init__

        if self.volume < 0:
            raise ValueError("volume must be non-negative")
        # Handle NaN values
        for field_name in ["volume"]:
            value = getattr(self, field_name)
            if isinstance(value, float) and math.isnan(value):
                setattr(self, field_name, 0.0)
            elif value is None:
                raise ValueError(f"{field_name} must not be None")
