"""OHLC data classes for Streamlit Lightweight Charts Pro.

This module provides data classes for OHLC (Open, High, Low, Close) data points
used in candlestick and bar charts. The OhlcData class extends the base Data class
with OHLC-specific validation and serialization capabilities.

The module includes:
    - OhlcData: Data class for OHLC data points
    - OHLC relationship validation (high >= low, all values >= 0)
    - NaN handling and value normalization
    - Time normalization and serialization utilities

Key Features:
    - Automatic time normalization to UNIX timestamps
    - OHLC relationship validation (high must be >= low)
    - Non-negative value validation for all price fields
    - NaN value handling (converts NaN to 0.0)
    - Required field validation for all OHLC parameters
    - CamelCase serialization for frontend communication

Example Usage:
    ```python
    from lightweight_charts_core.data import OhlcData

    # Create OHLC data point
    data = OhlcData(time="2024-01-01T00:00:00", open=100.0, high=105.0, low=98.0, close=102.0)

    # Serialize to frontend format
    serialized = data.asdict()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
import math
from dataclasses import dataclass
from typing import ClassVar

# Third Party Imports
# (None in this module)
# Local Imports
from lightweight_charts_core.data.data import Data
from lightweight_charts_core.exceptions import (
    RequiredFieldError,
    ValueValidationError,
)


@dataclass
class OhlcData(Data):
    """Data class for OHLC (Open, High, Low, Close) data points in financial charts.

    This class represents an OHLC data point commonly used in candlestick and bar charts
    for displaying financial market data. It extends the base Data class with OHLC-specific
    validation and serialization capabilities.

    The class automatically validates OHLC relationships (high >= low), ensures all values
    are non-negative, and handles NaN values for frontend compatibility.

    Attributes:
        time (int): UNIX timestamp in seconds representing the data point time.
            This value is automatically normalized during initialization.
        open (float): Opening price for the time period. Must be non-negative.
        high (float): Highest price during the time period. Must be >= low and non-negative.
        low (float): Lowest price during the time period. Must be <= high and non-negative.
        close (float): Closing price for the time period. Must be non-negative.

    Class Attributes:
        REQUIRED_COLUMNS (set): Set containing "open", "high", "low", and "close"
            as required columns for DataFrame conversion operations.
        OPTIONAL_COLUMNS (set): Empty set indicating no optional columns
            are available for this data type.

    Example:
        ```python
        from lightweight_charts_core.data import OhlcData

        # Create OHLC data point
        data = OhlcData(time="2024-01-01T00:00:00", open=100.0, high=105.0, low=98.0, close=102.0)

        # Serialize for frontend
        serialized = data.asdict()
        ```

    Raises:
        ValueValidationError: If high < low (invalid OHLC relationship).
        NonNegativeValueError: If any OHLC value is negative.
        RequiredFieldError: If any required OHLC field is None or missing.

    See Also:
        Data: Base class providing time normalization and serialization.
        OhlcvData: OHLC data with additional volume information.
        CandlestickData: Specialized OHLC data for candlestick charts.

    """

    # Define required columns for DataFrame conversion - all OHLC fields are required
    # beyond the base "time" column inherited from Data class
    REQUIRED_COLUMNS: ClassVar[set] = {"open", "high", "low", "close"}

    # Define optional columns for DataFrame conversion - none for this data type
    OPTIONAL_COLUMNS: ClassVar[set] = set()

    # Opening price for the time period
    open: float
    # Highest price reached during the time period
    high: float
    # Lowest price reached during the time period
    low: float
    # Closing price for the time period
    close: float

    def __post_init__(self):
        """Post-initialization processing to validate OHLC data and normalize values.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Calls the parent class __post_init__ to normalize the time value
        2. Validates OHLC relationships (high must be >= low)
        3. Validates that all values are non-negative
        4. Handles NaN values by converting them to 0.0
        5. Validates that all required fields are present and not None

        The method ensures that all OHLC data points have valid relationships
        and non-NaN values that can be safely serialized and transmitted to the frontend.

        Raises:
            ValueValidationError: If high < low (invalid OHLC relationship).
            NonNegativeValueError: If any OHLC value is negative.
            RequiredFieldError: If any required OHLC field is None or missing.

        """
        # Call parent's __post_init__ to normalize the time value to UNIX timestamp
        super().__post_init__()

        # Validate that all OHLC values are non-negative (prices cannot be negative)
        if self.open < 0 or self.high < 0 or self.low < 0 or self.close < 0:
            raise ValueValidationError.non_negative_value("all OHLC values")

        # Validate OHLC relationships - high must be greater than or equal to low
        if self.high < self.low:
            raise ValueValidationError("high", "must be greater than or equal to low")

        # Validate open is within high-low range
        if self.open > self.high:
            raise ValueValidationError("open", "must be less than or equal to high")
        if self.open < self.low:
            raise ValueValidationError("open", "must be greater than or equal to low")

        # Validate close is within high-low range
        if self.close > self.high:
            raise ValueValidationError("close", "must be less than or equal to high")
        if self.close < self.low:
            raise ValueValidationError("close", "must be greater than or equal to low")

        # Handle NaN values in all OHLC fields - convert to 0.0 for frontend compatibility
        for field_name in ["open", "high", "low", "close"]:
            value = getattr(self, field_name)
            # Check if the value is a float and is NaN
            if isinstance(value, float) and math.isnan(value):
                setattr(self, field_name, 0.0)
            # Validate that the field is not None - all OHLC fields are required
            elif value is None:
                raise RequiredFieldError(field_name)
