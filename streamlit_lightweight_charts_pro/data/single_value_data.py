"""
Base data classes and utilities for streamlit-lightweight-charts.

This module provides the base data class and utility functions for time format conversion
used throughout the library for representing financial data points.
"""

import math
from dataclasses import dataclass

from streamlit_lightweight_charts_pro.data.data import Data
from streamlit_lightweight_charts_pro.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class SingleValueData(Data):
    """
    Abstract base class for chart data points.

    All chart data classes should inherit from SingleValueData. Handles time normalization and
    serialization to camelCase dict for frontend.

    Attributes:
        time (int): UNIX timestamp in seconds.
        value (float): Data value. NaN is converted to 0.0.

    See also: LineData, OhlcData

    Note:
        - All imports must be at the top of the file unless justified.
        - Use specific exceptions and lazy string formatting for logging.
    """

    REQUIRED_COLUMNS = {"value"}  # Required columns for DataFrame conversion
    OPTIONAL_COLUMNS = set()  # Optional columns for DataFrame conversion

    value: float

    def __post_init__(self):
        # Normalize time
        super().__post_init__()  # Call parent's __post_init__
        # Handle NaN in value
        if isinstance(self.value, float) and math.isnan(self.value):
            self.value = 0.0
        elif self.value is None:
            raise ValueError("value must not be None")
