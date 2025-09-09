"""
Data utilities for Streamlit Lightweight Charts Pro.

This module provides utility functions for data processing and manipulation
used throughout the library. It includes functions for time normalization,
data validation, format conversion, and other common data operations.

The module provides utilities for:
    - Time conversion and normalization (UNIX timestamps)
    - Color validation and format checking
    - String format conversion (snake_case to camelCase)
    - Data validation for chart configuration options
    - Precision and minimum move validation

These utilities ensure data consistency and proper formatting across all
components of the charting library.

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.utils.data_utils import (
        normalize_time, is_valid_color, snake_to_camel
    )

    # Time normalization
    timestamp = normalize_time("2024-01-01T00:00:00")

    # Color validation
    is_valid = is_valid_color("#FF0000")

    # Format conversion
    camel_case = snake_to_camel("price_scale_id")
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

import re
from datetime import datetime
from typing import Any

import pandas as pd


def normalize_time(time_value: Any) -> int:
    """
    Convert time input to int UNIX seconds.

    This function handles various time input formats and converts them to
    UNIX timestamps (seconds since epoch). It supports multiple input types
    including integers, floats, strings, datetime objects, and pandas Timestamps.

    The function is designed to be robust and handle edge cases such as
    numpy types and various string formats that pandas can parse.

    Args:
        time_value: Time value to convert. Supported types:
            - int/float: Already in UNIX seconds
            - str: Date/time string (parsed by pandas)
            - datetime: Python datetime object
            - pd.Timestamp: Pandas timestamp object
            - numpy types: Automatically converted to Python types

    Returns:
        int: UNIX timestamp in seconds since epoch.

    Raises:
        ValueError: If the input string cannot be parsed as a valid date/time.
        TypeError: If the input type is not supported.

    Example:
        ```python
        from datetime import datetime
        import pandas as pd

        # Various input formats
        normalize_time(1640995200)  # 1640995200
        normalize_time("2024-01-01T00:00:00")  # 1704067200
        normalize_time(datetime(2024, 1, 1))  # 1704067200
        normalize_time(pd.Timestamp("2024-01-01"))  # 1704067200
        ```

    Note:
        String inputs are parsed using pandas.to_datetime(), which supports
        a wide variety of date/time formats including ISO format, common
        date formats, and relative dates.
    """
    # Handle numpy types by converting to Python native types
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
            raise ValueError(f"Invalid time string: {time_value!r}") from exc
    if isinstance(time_value, datetime):
        return int(time_value.timestamp())
    if isinstance(time_value, pd.Timestamp):
        return int(time_value.timestamp())
    # Handle datetime.date objects
    if hasattr(time_value, "date") and hasattr(time_value, "timetuple"):
        # This handles datetime.date objects
        from datetime import datetime as dt_class

        dt = dt_class.combine(time_value, dt_class.min.time())
        return int(dt.timestamp())
    raise TypeError(f"Unsupported time type: {type(time_value)}")


def to_utc_timestamp(time_value: Any) -> int:
    """
    Convert time input to int UNIX seconds.

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
    """
    Convert UNIX timestamp to ISO format string.

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
    """
    Convert snake_case string to camelCase.

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
    """
    Check if a color string is valid.

    This function validates color strings in various formats commonly used
    in web development and chart styling. It supports hex colors, RGB/RGBA
    colors, and empty strings (representing "no color").

    Args:
        color: Color string to validate. Supported formats:
            - Hex colors: "#FF0000", "#F00", "#FF0000AA"
            - RGB colors: "rgb(255, 0, 0)"
            - RGBA colors: "rgba(255, 0, 0, 1)"
            - Empty string: "" (represents no color)

    Returns:
        bool: True if color is valid, False otherwise.

    Example:
        ```python
        is_valid_color("#FF0000")  # True
        is_valid_color("#F00")  # True
        is_valid_color("rgb(255, 0, 0)")  # True
        is_valid_color("rgba(255, 0, 0, 1)")  # True
        is_valid_color("")  # True (no color)
        is_valid_color("invalid")  # False
        is_valid_color("#GG0000")  # False
        ```

    Note:
        The function is permissive with whitespace in RGB/RGBA formats
        and accepts both 3-digit and 6-digit hex codes.
    """
    if not isinstance(color, str):
        return False

    # Accept empty strings as valid (meaning "no color")
    if color == "":
        return True

    # Check for hex colors (#RRGGBB, #RGB, #RRGGBBAA)
    if color.startswith("#"):
        hex_pattern = r"^#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{1,5})?$"
        return bool(re.match(hex_pattern, color))

    # Check for rgb/rgba colors
    rgba_pattern = r"^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$"
    return bool(re.match(rgba_pattern, color))


def validate_price_format_type(type_value: str) -> str:
    """
    Validate price format type.

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
        raise ValueError(
            f"Invalid type: {type_value!r}. Must be one of 'price', 'volume', 'percent', 'custom'."
        )
    return type_value


def validate_precision(precision: int) -> int:
    """
    Validate precision value.

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
        raise ValueError(f"precision must be a non-negative integer, got {precision}")
    return precision


def validate_min_move(min_move: float) -> float:
    """
    Validate minimum move value.

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
        raise ValueError(f"min_move must be a positive number, got {min_move}")
    return float(min_move)
