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
    from streamlit_lightweight_charts_pro.data import CandlestickData

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
from typing import ClassVar, Optional

# Third Party Imports
# (None in this module)
# Local Imports
from streamlit_lightweight_charts_pro.data.ohlc_data import OhlcData
from streamlit_lightweight_charts_pro.exceptions import ColorValidationError
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
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
        from streamlit_lightweight_charts_pro.data import CandlestickData

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

    See also:
        OhlcData: Base class providing OHLC validation and serialization.
        BarData: Similar data class for bar charts.
    """

    # Define required columns for DataFrame conversion - none additional beyond
    # what's inherited from OhlcData ("time", "open", "high", "low", "close")
    REQUIRED_COLUMNS: ClassVar[set] = set()

    # Define optional columns for DataFrame conversion - color fields are optional
    OPTIONAL_COLUMNS: ClassVar[set] = {"color", "border_color", "wick_color"}

    # Optional color field for the candlestick body
    color: Optional[str] = None
    # Optional color field for the candlestick border
    border_color: Optional[str] = None
    # Optional color field for the candlestick wick
    wick_color: Optional[str] = None

    def __post_init__(self):
        """Post-initialization processing to validate OHLC data and color formats.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Calls the parent class __post_init__ to validate OHLC data and time
        2. Validates all color format fields if colors are provided

        The method ensures that all OHLC data points have valid relationships
        and that any provided colors follow valid hex or rgba format standards
        for frontend compatibility.

        Raises:
            ColorValidationError: If any color format is invalid.
            ValueValidationError: If high < low (invalid OHLC relationship).
            NonNegativeValueError: If any OHLC value is negative.
            RequiredFieldError: If any required OHLC field is None or missing.
        """
        # Call parent's __post_init__ to validate OHLC data and time normalization
        super().__post_init__()

        # Validate all color properties if provided - iterate through all color fields
        color_properties = ["color", "border_color", "wick_color"]

        for prop_name in color_properties:
            color_value = getattr(self, prop_name)
            # Check if color is provided and not empty, then validate format
            if color_value is not None and color_value != "" and not is_valid_color(color_value):
                raise ColorValidationError(prop_name, color_value)
