"""OHLCV data class for lightweight-charts-core.

This module provides the OhlcvData class for OHLCV data with volume information.
"""

import math
from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.ohlc_data import OhlcData
from lightweight_charts_core.exceptions import RequiredFieldError, ValueValidationError


@dataclass
class OhlcvData(OhlcData):
    """Data class for OHLCV (Open, High, Low, Close, Volume) data points.

    Extends OhlcData with volume information.

    Attributes:
        time: UNIX timestamp in seconds.
        open: Opening price for the time period.
        high: Highest price during the time period.
        low: Lowest price during the time period.
        close: Closing price for the time period.
        volume: Trading volume for the time period.
    """

    REQUIRED_COLUMNS: ClassVar[set] = {"volume"}
    OPTIONAL_COLUMNS: ClassVar[set] = set()

    volume: float = 0.0

    def __post_init__(self):
        """Validate volume data."""
        super().__post_init__()

        if isinstance(self.volume, float) and math.isnan(self.volume):
            self.volume = 0.0
        elif self.volume is None:
            raise RequiredFieldError("volume")
        elif self.volume < 0:
            raise ValueValidationError.non_negative_value("volume", self.volume)
