"""Data utilities for Streamlit Lightweight Charts Pro.

This module provides comprehensive utility functions for data processing and manipulation
used throughout the library. It includes functions for time normalization, data validation,
format conversion, and other common data operations essential for financial chart rendering.

The module provides utilities for:
    - Time conversion and normalization (UNIX timestamps)
    - Color validation and format checking
    - String format conversion (snake_case to camelCase)
    - Data validation for chart configuration options
    - Precision and minimum move validation for price formatting
    - Type checking and conversion utilities

These utilities ensure data consistency, proper formatting, and type safety across all
components of the charting library, providing a robust foundation for financial data
visualization.

Key Features:
    - Robust time handling with multiple input format support
    - Comprehensive color validation for hex and rgba formats
    - Efficient string conversion utilities for frontend compatibility
    - Type-safe validation with descriptive error messages
    - NumPy type handling for scientific computing integration
    - Pandas integration for DataFrame and Series processing

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.utils.data_utils import (
        normalize_time,
        is_valid_color,
        snake_to_camel,
        validate_precision,
    )

    # Time normalization
    timestamp = normalize_time("2024-01-01T00:00:00")  # Returns UNIX timestamp

    # Color validation
    is_valid = is_valid_color("#FF0000")  # Returns True

    # Format conversion for frontend
    camel_case = snake_to_camel("price_scale_id")  # Returns "priceScaleId"

    # Precision validation
    validate_precision(2)  # Validates precision value
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
import re
from datetime import datetime
from typing import Any

# Third Party Imports
import pandas as pd

# Local Imports
from streamlit_lightweight_charts_pro.exceptions import (
    TimeValidationError,
    UnsupportedTimeTypeError,
    ValueValidationError,
)


def normalize_time(time_value: Any) -> int:
    """Convert time input to int UNIX seconds for consistent chart data handling.

    This function handles various time input formats and converts them to
    UNIX timestamps (seconds since epoch). It supports multiple input types
    including integers, floats, strings, datetime objects, and pandas Timestamps,
    providing a unified interface for time data processing across the library.

    The function is designed to be robust and handle edge cases such as
    numpy types and various string formats that pandas can parse, ensuring
    compatibility with different data sources and formats commonly used
    in financial applications.

    Args:
        time_value (Any): Time value to convert. Supported types:
            - int/float: Already in UNIX seconds (returned as-is)
            - str: Date/time string (parsed by pandas.to_datetime())
            - datetime: Python datetime object (converted to timestamp)
            - pd.Timestamp: Pandas timestamp object (converted to timestamp)
            - numpy types: Automatically converted to Python types first

    Returns:
        int: UNIX timestamp in seconds since epoch, suitable for chart rendering.

    Raises:
        ValueError: If the input string cannot be parsed as a valid date/time.
        TypeError: If the input type is not supported or cannot be converted.
        TimeValidationError: If the converted time value is invalid.

    Example:
        ```python
        from datetime import datetime
        import pandas as pd

        # Various input formats
        normalize_time(1640995200)  # Returns: 1640995200
        normalize_time("2024-01-01T00:00:00")  # Returns: 1704067200
        normalize_time(datetime(2024, 1, 1))  # Returns: 1704067200
        normalize_time(pd.Timestamp("2024-01-01"))  # Returns: 1704067200
        ```

    Note:
        String inputs are parsed using pandas.to_datetime(), which supports
        a wide variety of date/time formats including ISO format, common
        date formats, and relative dates. This ensures maximum compatibility
        with different data sources.
    """
    # Handle numpy types by converting to Python native types first
    # This prevents issues with numpy-specific type checking and conversion
    if hasattr(time_value, "item"):
        time_value = time_value.item()
    elif hasattr(time_value, "dtype"):
        # Handle numpy arrays and other numpy objects
        try:
            time_value = time_value.item()
        except (ValueError, TypeError):
            # If item() fails, try to convert to int/float
            time_value = int(time_value) if hasattr(time_value, "__int__") else float(time_value)

    if isinstance(time_value, int):
        return time_value
    if isinstance(time_value, float):
        return int(time_value)
    if isinstance(time_value, str):
        # Try to parse and normalize the string
        try:
            dt = pd.to_datetime(time_value)
            return int(dt.timestamp())
        except (ValueError, TypeError) as exc:
            raise TimeValidationError(time_value) from exc
    if isinstance(time_value, datetime):
        return int(time_value.timestamp())
    if isinstance(time_value, pd.Timestamp):
        return int(time_value.timestamp())
    # Handle datetime.date objects
    if hasattr(time_value, "date") and hasattr(time_value, "timetuple"):
        dt = datetime.combine(time_value, datetime.min.time())
        return int(dt.timestamp())
    raise UnsupportedTimeTypeError(type(time_value))


def to_utc_timestamp(time_value: Any) -> int:
    """Convert time input to int UNIX seconds.

    This is an alias for normalize_time for backward compatibility.
    It provides the same functionality as normalize_time().

    Args:
        time_value: Supported types are int, float, str, datetime, pd.Timestamp

    Returns:
        int: UNIX timestamp in seconds

    See Also:
        normalize_time: The main function that performs the conversion.
    """
    return normalize_time(time_value)


def from_utc_timestamp(timestamp: int) -> str:
    """Convert UNIX timestamp to ISO format string.

    This function converts a UNIX timestamp (seconds since epoch) to an
    ISO format datetime string. The output is in UTC timezone.

    Args:
        timestamp: UNIX timestamp in seconds since epoch.

    Returns:
        str: ISO format datetime string in UTC timezone.

    Example:
        ```python
        from_utc_timestamp(1640995200)  # "2022-01-01T00:00:00"
        from_utc_timestamp(1704067200)  # "2024-01-01T00:00:00"
        ```

    Note:
        The function uses datetime.utcfromtimestamp() to ensure the output
        is always in UTC timezone, regardless of the system's local timezone.
    """
    return datetime.utcfromtimestamp(timestamp).isoformat()


def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case string to camelCase.

    This function converts strings from snake_case format (e.g., "price_scale_id")
    to camelCase format (e.g., "priceScaleId"). It's commonly used for
    converting Python property names to JavaScript property names.

    Args:
        snake_str: String in snake_case format (e.g., "price_scale_id").

    Returns:
        str: String in camelCase format (e.g., "priceScaleId").

    Example:
        ```python
        snake_to_camel("price_scale_id")  # "priceScaleId"
        snake_to_camel("line_color")  # "lineColor"
        snake_to_camel("background_color")  # "backgroundColor"
        snake_to_camel("single_word")  # "singleWord"
        ```

    Note:
        The function assumes the input string is in valid snake_case format.
        If the input contains no underscores, it returns the string as-is.
    """
    components = snake_str.split("_")
    return components[0] + "".join(word.capitalize() for word in components[1:])


def is_valid_color(color: str) -> bool:
    """Check if a color string is valid.

    This function validates color strings in various formats commonly used
    in web development and chart styling. It supports hex colors, RGB/RGBA
    colors, and named colors.

    Args:
        color: Color string to validate. Supported formats:
            - Hex colors: "#FF0000", "#F00", "#FF0000AA"
            - RGB colors: "rgb(255, 0, 0)"
            - RGBA colors: "rgba(255, 0, 0, 1)"
            - Named colors: "red", "blue", "white", etc.

    Returns:
        bool: True if color is valid, False otherwise.

    Example:
        ```python
        is_valid_color("#FF0000")  # True
        is_valid_color("#F00")  # True
        is_valid_color("rgb(255, 0, 0)")  # True
        is_valid_color("rgba(255, 0, 0, 1)")  # True
        is_valid_color("red")  # True
        is_valid_color("")  # False (empty string is invalid)
        is_valid_color("invalid")  # False
        is_valid_color("#GG0000")  # False
        ```

    Note:
        The function is permissive with whitespace in RGB/RGBA formats
        and accepts both 3-digit and 6-digit hex codes. Named colors
        are case-insensitive.
    """
    # Validate input: must be a string
    if not isinstance(color, str):
        return False

    # Reject empty strings as invalid colors
    if color == "":
        return False

    # Check hex color pattern: matches #RRGGBB (6 hex digits) or #RGB (3 hex digits)
    # Also supports #RRGGBBAA format for alpha channel
    hex_pattern = r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$"
    if re.match(hex_pattern, color):
        return True

    # Check RGB/RGBA pattern: matches rgb(r,g,b) or rgba(r,g,b,a) format
    # Allows optional spaces around commas and parentheses
    # Alpha channel is optional and can be decimal or integer values
    rgba_pattern = r"^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$"
    if re.match(rgba_pattern, color):
        return True

    # Check named colors: basic set of commonly used color names
    # These are case-insensitive and include standard web colors
    named_colors = {
        "black",
        "white",
        "red",
        "green",
        "blue",
        "yellow",
        "cyan",
        "magenta",
        "gray",
        "grey",
        "orange",
        "purple",
        "brown",
        "pink",
        "lime",
        "navy",
        "teal",
        "silver",
        "gold",
        "maroon",
        "olive",
        "aqua",
        "fuchsia",
        "transparent",
    }

    # Return True if the color (converted to lowercase) is in the named colors set
    # This makes the named color check case-insensitive for user convenience
    return color.lower() in named_colors


def validate_price_format_type(type_value: str) -> str:
    """Validate price format type.

    This function validates price format type strings used in chart configuration.
    It ensures that only valid format types are used for price display options.

    Args:
        type_value: Type string to validate. Must be one of the valid types.

    Returns:
        str: Validated type string (same as input if valid).

    Raises:
        ValueError: If type is not one of the valid price format types.

    Example:
        ```python
        validate_price_format_type("price")  # "price"
        validate_price_format_type("volume")  # "volume"
        validate_price_format_type("percent")  # "percent"
        validate_price_format_type("custom")  # "custom"
        validate_price_format_type("invalid")  # ValueError
        ```

    Note:
        Valid types are: "price", "volume", "percent", "custom".
        The function is case-sensitive.
    """
    valid_types = {"price", "volume", "percent", "custom"}
    if type_value not in valid_types:
        raise ValueValidationError(
            "type",
            f"must be one of {valid_types}, got {type_value!r}",
        )
    return type_value


def validate_precision(precision: int) -> int:
    """Validate precision value.

    This function validates precision values used for number formatting
    in charts. Precision determines the number of decimal places shown
    for price and volume values.

    Args:
        precision: Precision value to validate. Must be a non-negative integer.

    Returns:
        int: Validated precision value (same as input if valid).

    Raises:
        ValueError: If precision is not a non-negative integer.

    Example:
        ```python
        validate_precision(0)  # 0
        validate_precision(2)  # 2
        validate_precision(5)  # 5
        validate_precision(-1)  # ValueError
        validate_precision(2.5)  # ValueError
        ```

    Note:
        Precision values typically range from 0 to 8, but the function
        accepts any non-negative integer. Very large values may cause
        display issues in the frontend.
    """
    if not isinstance(precision, int) or precision < 0:
        raise ValueValidationError(
            "precision",
            f"must be a non-negative integer, got {precision}",
        )
    return precision


def validate_min_move(min_move: float) -> float:
    """Validate minimum move value.

    This function validates minimum move values used in chart configuration.
    Minimum move determines the smallest price change that will trigger
    a visual update in the chart.

    Args:
        min_move: Minimum move value to validate. Must be a positive number.

    Returns:
        float: Validated minimum move value (converted to float if needed).

    Raises:
        ValueError: If min_move is not a positive number.

    Example:
        ```python
        validate_min_move(0.001)  # 0.001
        validate_min_move(1.0)  # 1.0
        validate_min_move(100)  # 100.0
        validate_min_move(0)  # ValueError
        validate_min_move(-0.1)  # ValueError
        ```

    Note:
        Minimum move values are typically very small positive numbers
        (e.g., 0.001 for stocks, 0.0001 for forex). The function accepts
        both integers and floats, converting them to float for consistency.
    """
    if not isinstance(min_move, (int, float)) or min_move <= 0:
        raise ValueValidationError.positive_value("min_move", min_move)
    return float(min_move)
