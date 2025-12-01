"""OHLCV data classes for Streamlit Lightweight Charts Pro.

This module provides data classes for OHLCV (Open, High, Low, Close, Volume) data points
used in candlestick and bar charts with volume information. The OhlcvData class extends
OhlcData with volume validation and serialization capabilities.

The module includes:
    - OhlcvData: Data class for OHLCV data points with volume
    - Volume validation and non-negative value checking
    - OHLC relationship validation and value normalization
    - Time normalization and serialization utilities

Key Features:
    - Automatic time normalization to UNIX timestamps
    - OHLC relationship validation (high >= low, all values >= 0)
    - Volume validation (must be non-negative)
    - NaN value handling (converts NaN to 0.0)
    - Required field validation for all OHLCV parameters
    - CamelCase serialization for frontend communication

Example Usage:
    ```python
    from lightweight_charts_core.data import OhlcvData

    # Create OHLCV data point with volume
    data = OhlcvData(
        time="2024-01-01T00:00:00", open=100.0, high=105.0, low=98.0, close=102.0, volume=1000000
    )

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
from lightweight_charts_core.data.ohlc_data import OhlcData
from lightweight_charts_core.exceptions import RequiredFieldError, ValueValidationError


@dataclass
class OhlcvData(OhlcData):
    """Data class for OHLCV (Open, High, Low, Close, Volume) data points in financial charts.

    This class represents an OHLCV data point commonly used in candlestick and bar charts
    for displaying financial market data with volume information. It extends the OhlcData
    class with volume-specific validation and serialization capabilities.

    The class automatically validates OHLC relationships, ensures all values are non-negative,
    validates volume data, and handles NaN values for frontend compatibility.

    Attributes:
        time (int): UNIX timestamp in seconds representing the data point time.
            This value is automatically normalized during initialization.
        open (float): Opening price for the time period. Must be non-negative.
        high (float): Highest price during the time period. Must be >= low and non-negative.
        low (float): Lowest price during the time period. Must be <= high and non-negative.
        close (float): Closing price for the time period. Must be non-negative.
        volume (float): Trading volume for the time period. Must be non-negative.

    Class Attributes:
        REQUIRED_COLUMNS (set): Set containing "volume" as an additional required column
            beyond what's inherited from OhlcData ("time", "open", "high", "low", "close").
        OPTIONAL_COLUMNS (set): Empty set indicating no optional columns
            are available for this data type.

    Example:
        ```python
        from lightweight_charts_core.data import OhlcvData

        # Create OHLCV data point with volume
        data = OhlcvData(
            time="2024-01-01T00:00:00", open=100.0, high=105.0,
            low=98.0, close=102.0, volume=1000000
        )

        # Serialize for frontend
        serialized = data.asdict()
        ```

    Raises:
        ValueValidationError: If high < low (invalid OHLC relationship) or volume < 0.
        NonNegativeValueError: If any OHLC value is negative.
        RequiredFieldError: If any required OHLCV field is None or missing.

    See Also:
        OhlcData: Base class providing OHLC validation and serialization.
        CandlestickData: OHLC data with color styling capabilities.
        BarData: Similar data class for bar charts.

    """

    # Define required columns for DataFrame conversion - volume is additional requirement
    # beyond what's inherited from OhlcData ("time", "open", "high", "low", "close")
    REQUIRED_COLUMNS: ClassVar[set] = {"volume"}

    # Define optional columns for DataFrame conversion - none for this data type
    OPTIONAL_COLUMNS: ClassVar[set] = set()

    # Trading volume for the time period - must be non-negative
    volume: float

    def __post_init__(self):
        """Post-initialization processing to validate OHLCV data and normalize values.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Calls the parent class __post_init__ to validate OHLC data and time
        2. Validates that volume is non-negative
        3. Handles NaN values in the volume field
        4. Validates that volume is not None

        The method ensures that all OHLCV data points have valid relationships
        and non-NaN values that can be safely serialized and transmitted to the frontend.

        Raises:
            ValueValidationError: If volume < 0 (volume cannot be negative).
            RequiredFieldError: If volume field is None or missing.

        """
        # Call parent's __post_init__ to validate OHLC data and time normalization
        super().__post_init__()

        # Validate that volume is non-negative (volume cannot be negative)
        if self.volume < 0:
            raise ValueValidationError("volume", "must be non-negative")

        # Handle NaN values in volume field - convert to 0.0 for frontend compatibility
        for field_name in ["volume"]:
            value = getattr(self, field_name)
            # Check if the value is a float and is NaN
            if isinstance(value, float) and math.isnan(value):
                setattr(self, field_name, 0.0)
            # Validate that the field is not None - volume is required
            elif value is None:
                raise RequiredFieldError(field_name)
