"""Candlestick data classes for Streamlit Lightweight Charts Pro.

This module provides data classes for candlestick chart data points with optional
color styling capabilities. The CandlestickData class extends OhlcData with
color validation and serialization features for candlestick visualization.

The module includes:
    - CandlestickData: Data class for candlestick chart data points with color styling
    - Color validation for candlestick body, border, and wick colors
    - OHLC relationship validation and value normalization
    - Time normalization and serialization utilities

Key Features:
    - Automatic time normalization to UNIX timestamps
    - OHLC relationship validation (high >= low, all values >= 0)
    - Optional color fields with validation (body, border, wick colors)
    - NaN value handling (converts NaN to 0.0)
    - CamelCase serialization for frontend communication
    - Color format validation (hex and rgba)

Example Usage:
    ```python
    from lightweight_charts_core.data import CandlestickData

    # Create candlestick data point with colors
    data = CandlestickData(
        time="2024-01-01T00:00:00",
        open=100.0,
        high=105.0,
        low=98.0,
        close=102.0,
        color="#4CAF50",  # Green body for bullish candle
        border_color="#2E7D32",
        wick_color="#1B5E20",
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from dataclasses import dataclass
from typing import ClassVar

# Third Party Imports
# (None in this module)
# Local Imports
from lightweight_charts_core.data.ohlc_data import OhlcData
from lightweight_charts_core.utils import validated_field


@dataclass
@validated_field("color", str, validator="color", allow_none=True)
@validated_field("border_color", str, validator="color", allow_none=True)
@validated_field("wick_color", str, validator="color", allow_none=True)
class CandlestickData(OhlcData):
    """Data class for candlestick chart data points with optional color styling.

    This class extends OhlcData to add optional color fields for candlestick
    styling. It provides validation for color formats and maintains all the
    functionality of the parent class while adding color-specific features
    for candlestick visualization.

    The class automatically handles time normalization, OHLC validation, and
    color format validation for frontend compatibility.

    Attributes:
        time (int): UNIX timestamp in seconds representing the data point time.
            This value is automatically normalized during initialization.
        open (float): Opening price for the time period. Must be non-negative.
        high (float): Highest price during the time period. Must be >= low and non-negative.
        low (float): Lowest price during the time period. Must be <= high and non-negative.
        close (float): Closing price for the time period. Must be non-negative.
        color (Optional[str]): Color for the candlestick body in hex or rgba format.
            If not provided, the color field is not serialized.
        border_color (Optional[str]): Border color for the candlestick in hex or rgba format.
            If not provided, the border_color field is not serialized.
        wick_color (Optional[str]): Wick color for the candlestick in hex or rgba format.
            If not provided, the wick_color field is not serialized.

    Class Attributes:
        REQUIRED_COLUMNS (set): Empty set as all required columns are inherited
            from OhlcData ("time", "open", "high", "low", "close").
        OPTIONAL_COLUMNS (set): Set containing color-related optional columns
            for DataFrame conversion operations.

    Example:
        ```python
        from lightweight_charts_core.data import CandlestickData

        # Create candlestick data point with colors
        data = CandlestickData(
            time="2024-01-01T00:00:00",
            open=100.0,
            high=105.0,
            low=98.0,
            close=102.0,
            color="#4CAF50",  # Green body for bullish candle
            border_color="#2E7D32",
            wick_color="#1B5E20",
        )
        ```

    Raises:
        ColorValidationError: If any color format is invalid (not hex or rgba).
        ValueValidationError: If high < low (invalid OHLC relationship).
        NonNegativeValueError: If any OHLC value is negative.
        RequiredFieldError: If any required OHLC field is None or missing.

    See Also:
        OhlcData: Base class providing OHLC validation and serialization.
        BarData: Similar data class for bar charts.

    """

    # Define required columns for DataFrame conversion - none additional beyond
    # what's inherited from OhlcData ("time", "open", "high", "low", "close")
    REQUIRED_COLUMNS: ClassVar[set] = set()

    # Define optional columns for DataFrame conversion - color fields are optional
    OPTIONAL_COLUMNS: ClassVar[set] = {"color", "border_color", "wick_color"}

    # Optional color field for the candlestick body
    color: str | None = None
    # Optional color field for the candlestick border
    border_color: str | None = None
    # Optional color field for the candlestick wick
    wick_color: str | None = None
