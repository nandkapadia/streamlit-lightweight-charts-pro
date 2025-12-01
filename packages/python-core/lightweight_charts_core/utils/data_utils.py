"""Data utilities for Streamlit Lightweight Charts Pro.

This module provides comprehensive utility functions for data processing and
manipulation used throughout the library. It includes functions for time
normalization, data validation, format conversion, and other common data
operations essential for financial chart rendering.

The module provides utilities for:
    - Time conversion and normalization (UNIX timestamps)
    - Color validation and format checking
    - String format conversion (snake_case to camelCase)
    - Data validation for chart configuration options
    - Precision and minimum move validation for price formatting
    - Type checking and conversion utilities

These utilities ensure data consistency, proper formatting, and type safety
across all components of the charting library, providing a robust foundation
for financial data visualization.

Key Features:
    - Robust time handling with multiple input format support
    - Comprehensive color validation for hex and rgba formats
    - Efficient string conversion utilities for frontend compatibility
    - Type-safe validation with descriptive error messages
    - NumPy type handling for scientific computing integration
    - Pandas integration for DataFrame and Series processing

Example:
    Time normalization::

        from lightweight_charts_core.utils.data_utils import normalize_time

        # Convert various time formats to UNIX timestamp
        timestamp = normalize_time("2024-01-01T00:00:00")
        print(timestamp)  # 1704067200

    Color validation::

        from lightweight_charts_core.utils.data_utils import is_valid_color

        # Validate different color formats
        is_valid = is_valid_color("#FF0000")  # True (hex)
        is_valid = is_valid_color("red")  # True (named)
        is_valid = is_valid_color("invalid")  # False

    Format conversion for frontend::

        from lightweight_charts_core.utils.data_utils import snake_to_camel

        # Convert Python naming to JavaScript naming
        camel = snake_to_camel("price_scale_id")
        print(camel)  # "priceScaleId"

Note:
    All time functions return UNIX timestamps in seconds (not milliseconds)
    for consistency with Python's datetime module and pandas.

"""

# Standard Imports
import re
from datetime import datetime, timezone
from typing import Any

# Third Party Imports
import pandas as pd

# Local Imports
from lightweight_charts_core.exceptions import (
    TimeValidationError,
    UnsupportedTimeTypeError,
    ValueValidationError,
)
from lightweight_charts_core.utils.case_converter import CaseConverter


def normalize_time(time_value: Any) -> int:
    """Convert time input to UNIX seconds for consistent chart handling.

    This function handles various time input formats and converts them to
    UNIX timestamps (seconds since epoch). It supports multiple input types
    including integers, floats, strings, datetime objects, and pandas
    Timestamps, providing a unified interface for time data processing.

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
            - date objects: Converted to midnight on that date

    Returns:
        int: UNIX timestamp in seconds since epoch (January 1, 1970 UTC),
            suitable for chart rendering.

    Raises:
        TimeValidationError: If the input string cannot be parsed as a
            valid date/time.
        UnsupportedTimeTypeError: If the input type is not supported or
            cannot be converted.

    Example:
        Convert various formats::

            >>> from datetime import datetime
            >>> import pandas as pd

            # Integer timestamp (already in correct format)
            >>> normalize_time(1640995200)
            1640995200

            # ISO format string
            >>> normalize_time("2024-01-01T00:00:00")
            1704067200

            # Python datetime
            >>> normalize_time(datetime(2024, 1, 1))
            1704067200

            # Pandas timestamp
            >>> normalize_time(pd.Timestamp("2024-01-01"))
            1704067200

    Note:
        String inputs are parsed using pandas.to_datetime(), which supports
        a wide variety of date/time formats including ISO format, common
        date formats, and relative dates. This ensures maximum compatibility
        with different data sources.

    """
    # Step 1: Handle numpy types by converting to Python native types first
    # NumPy types have different behavior and need special handling
    # Check if object has 'item()' method (common NumPy scalar method)
    if hasattr(time_value, "item"):
        # Extract Python scalar value from NumPy type
        # This converts numpy.int64 -> int, numpy.float64 -> float, etc.
        time_value = time_value.item()

    # Check if object has 'dtype' attribute (indicates NumPy array or similar)
    elif hasattr(time_value, "dtype"):
        # Try to extract scalar value from array-like object
        try:
            # item() works for 0-d arrays and scalar wrappers
            time_value = time_value.item()
        except (ValueError, TypeError):
            # If item() fails, try type-specific conversion
            # Check if object can be converted to int (has __int__ method)
            time_value = int(time_value) if hasattr(time_value, "__int__") else float(time_value)

    # Step 2: Handle already-converted integer timestamps
    # If value is already an int, it's assumed to be a UNIX timestamp
    # Simply return it without any conversion
    if isinstance(time_value, int):
        return time_value

    # Step 3: Handle float timestamps (may have fractional seconds)
    # Convert to int by truncating fractional part
    # This rounds towards zero, so 1.9 becomes 1
    if isinstance(time_value, float):
        return int(time_value)

    # Step 4: Handle string date/time representations
    # Use pandas.to_datetime() for flexible parsing
    if isinstance(time_value, str):
        try:
            # pandas.to_datetime() is very flexible and can parse:
            # - ISO format: "2024-01-01T00:00:00"
            # - Common formats: "2024-01-01", "01/01/2024", "Jan 1, 2024"
            # - Relative dates: "today", "yesterday"
            dt = pd.to_datetime(time_value)

            # Convert pandas Timestamp to UNIX seconds
            # timestamp() returns float, we convert to int
            return int(dt.timestamp())

        except (ValueError, TypeError) as exc:
            # If parsing fails, raise custom exception with the invalid value
            # 'from exc' preserves the original exception for debugging
            raise TimeValidationError(time_value) from exc

    # Step 5: Handle Python datetime objects
    # datetime.timestamp() returns float seconds since epoch
    if isinstance(time_value, datetime):
        # Convert to UNIX timestamp and truncate to integer seconds
        return int(time_value.timestamp())

    # Step 6: Handle pandas Timestamp objects
    # Similar to datetime but pandas-specific type
    if isinstance(time_value, pd.Timestamp):
        # Convert to UNIX timestamp and truncate to integer seconds
        return int(time_value.timestamp())

    # Step 7: Handle datetime.date objects (date without time)
    # date objects don't have timestamp() method, need special handling
    # Check for both 'date' and 'timetuple' methods to identify date objects
    if hasattr(time_value, "date") and hasattr(time_value, "timetuple"):
        # Combine date with minimum time (midnight) to create datetime
        # datetime.min.time() returns time(0, 0, 0) - midnight
        dt = datetime.combine(time_value, datetime.min.time())

        # Convert combined datetime to UNIX timestamp
        return int(dt.timestamp())

    # Step 8: If we reach here, type is not supported
    # Raise exception with the actual type information
    raise UnsupportedTimeTypeError(type(time_value))


def to_utc_timestamp(time_value: Any) -> int:
    """Convert time input to UNIX seconds.

    This is an alias for normalize_time() maintained for backward
    compatibility. It provides exactly the same functionality as
    normalize_time() and delegates all work to that function.

    Args:
        time_value (Any): Time value to convert. Supported types are:
            int, float, str, datetime, pd.Timestamp, numpy types.

    Returns:
        int: UNIX timestamp in seconds since epoch.

    Raises:
        TimeValidationError: If the input cannot be parsed.
        UnsupportedTimeTypeError: If the input type is not supported.

    Example:
        >>> to_utc_timestamp("2024-01-01")
        1704067200

    See Also:
        normalize_time: The main function that performs the conversion.

    Note:
        This function exists for backward compatibility with older code.
        New code should use normalize_time() directly.

    """
    # Simply delegate to normalize_time()
    # This maintains backward compatibility while keeping single source of truth
    return normalize_time(time_value)


def from_utc_timestamp(timestamp: int) -> str:
    """Convert UNIX timestamp to ISO format string.

    This function converts a UNIX timestamp (seconds since epoch) to an
    ISO format datetime string. The output is always in UTC timezone,
    making it suitable for consistent time display across timezones.

    Args:
        timestamp (int): UNIX timestamp in seconds since epoch
            (January 1, 1970 00:00:00 UTC).

    Returns:
        str: ISO format datetime string in UTC timezone.
            Format: "YYYY-MM-DDTHH:MM:SS"

    Example:
        Convert timestamps to readable format::

            >>> from_utc_timestamp(1640995200)
            '2022-01-01T00:00:00'

            >>> from_utc_timestamp(1704067200)
            '2024-01-01T00:00:00'

    Note:
        The function uses datetime.fromtimestamp() with UTC timezone to ensure
        the output is always in UTC timezone, regardless of the system's local
        timezone. This is important for consistent time display in web applications.

    """
    # Convert UNIX timestamp to UTC datetime object
    # Using fromtimestamp() with explicit UTC timezone (recommended approach)
    # This replaces the deprecated utcfromtimestamp() method
    dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)

    # Convert datetime to ISO format string without timezone info
    # isoformat() returns "YYYY-MM-DDTHH:MM:SS+00:00" with timezone
    # We use replace to remove timezone for backward compatibility
    return dt.replace(tzinfo=None).isoformat()


def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case string to camelCase.

    This function converts strings from Python's snake_case naming
    convention (e.g., "price_scale_id") to JavaScript's camelCase
    convention (e.g., "priceScaleId"). This is commonly used when
    converting Python property names to JavaScript property names
    for frontend communication.

    This is a convenience wrapper around CaseConverter.snake_to_camel()
    maintained for backward compatibility and simpler imports.

    Args:
        snake_str (str): String in snake_case format. Example:
            "price_scale_id", "line_color", "background_color"

    Returns:
        str: String in camelCase format. Example:
            "priceScaleId", "lineColor", "backgroundColor"

    Example:
        Convert Python naming to JavaScript naming::

            >>> snake_to_camel("price_scale_id")
            'priceScaleId'

            >>> snake_to_camel("line_color")
            'lineColor'

            >>> snake_to_camel("background_color")
            'backgroundColor'

            >>> snake_to_camel("single_word")
            'singleWord'

    Note:
        The function assumes the input string is in valid snake_case format.
        If the input contains no underscores, it returns the string as-is.
        The function is deterministic - same input always produces same output.

    See Also:
        CaseConverter.snake_to_camel: The main implementation that handles
            the actual conversion logic.

    """
    # Delegate to CaseConverter for actual conversion logic
    # This keeps the conversion logic centralized and maintainable
    return CaseConverter.snake_to_camel(snake_str)


def is_valid_color(color: str) -> bool:
    """Check if a color string is valid.

    This function validates color strings in various formats commonly used
    in web development and chart styling. It supports hex colors with
    various lengths, RGB/RGBA colors, and a comprehensive set of named colors.

    The validation is permissive to accept common variations while still
    catching obvious errors. It's designed for frontend color properties
    where browsers accept multiple formats.

    Args:
        color (str): Color string to validate. Supported formats:
            - Hex colors: "#FF0000" (6-digit), "#F00" (3-digit),
              "#FF0000AA" (8-digit with alpha), "#F00A" (4-digit with alpha)
            - RGB colors: "rgb(255, 0, 0)"
            - RGBA colors: "rgba(255, 0, 0, 1)" or "rgba(255, 0, 0, 0.5)"
            - Named colors: "red", "blue", "white", "transparent", etc.

    Returns:
        bool: True if color is valid in any supported format, False if
            color is invalid or empty.

    Example:
        Validate different color formats::

            # Hex colors (all valid)
            >>> is_valid_color("#FF0000")
            True
            >>> is_valid_color("#F00")
            True
            >>> is_valid_color("#FF0000AA")
            True

            # RGB/RGBA (valid)
            >>> is_valid_color("rgb(255, 0, 0)")
            True
            >>> is_valid_color("rgba(255, 0, 0, 1)")
            True

            # Named colors (valid, case-insensitive)
            >>> is_valid_color("red")
            True
            >>> is_valid_color("RED")
            True

            # Invalid colors
            >>> is_valid_color("")
            False
            >>> is_valid_color("invalid")
            False
            >>> is_valid_color("#GG0000")
            False

    Note:
        - The function is permissive with whitespace in RGB/RGBA formats
        - Accepts both 3-digit (#RGB) and 6-digit (#RRGGBB) hex codes
        - Named colors are case-insensitive for user convenience
        - Empty strings are explicitly rejected as invalid

    """
    # Step 1: Validate input is a string type
    # Non-string inputs (int, None, list, etc.) are invalid
    if not isinstance(color, str):
        return False

    # Step 2: Reject empty strings as invalid colors
    # Empty strings could cause frontend errors
    if color == "":
        return False

    # Step 3: Check for hex color pattern
    # Supports multiple hex formats:
    # - #RGB (3 digits): short form, e.g., #F00 = #FF0000
    # - #RGBA (4 digits): short form with alpha, e.g., #F008
    # - #RRGGBB (6 digits): standard form, e.g., #FF0000
    # - #RRGGBBAA (8 digits): with alpha channel, e.g., #FF000080
    # Pattern breakdown:
    # ^ = start of string
    # # = literal hash character
    # [A-Fa-f0-9] = any hex digit (0-9, A-F, a-f)
    # {3}|{4}|{6}|{8} = exactly 3, 4, 6, or 8 of those digits
    # $ = end of string
    hex_pattern = r"^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$"

    # Use regex to check if color matches hex pattern
    if re.match(hex_pattern, color):
        return True

    # Step 4: Check for RGB/RGBA pattern
    # Supports both rgb(r,g,b) and rgba(r,g,b,a) formats
    # Pattern breakdown:
    # rgba? = "rgb" or "rgba" (? makes 'a' optional)
    # \( \) = literal parentheses
    # \s* = optional whitespace (0 or more spaces)
    # \d+ = one or more digits (for r, g, b values)
    # [\d.]+ = digits or decimal point (for alpha value)
    # (?:...)? = non-capturing optional group (for alpha)
    # Allows flexible spacing: "rgb(255, 0, 0)" or "rgb(255,0,0)"
    rgba_pattern = r"^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$"

    # Use regex to check if color matches RGB/RGBA pattern
    if re.match(rgba_pattern, color):
        return True

    # Step 5: Check against named colors set
    # Define set of common named colors supported by browsers
    # Using a set for O(1) lookup performance
    named_colors = {
        # Basic colors
        "black",
        "white",
        "red",
        "green",
        "blue",
        "yellow",
        "cyan",
        "magenta",
        # Gray variants
        "gray",
        "grey",
        # Extended colors
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
        # Special
        "transparent",
    }

    # Check if color (converted to lowercase) is in the named colors set
    # Using .lower() makes the check case-insensitive
    # This allows "Red", "RED", and "red" to all be valid
    return color.lower() in named_colors


def validate_price_format_type(type_value: str) -> str:
    """Validate price format type string.

    This function validates that a price format type string is one of the
    supported types. Price format types determine how prices are displayed
    in the chart (as currency, percentage, volume, or custom format).

    Args:
        type_value (str): Type string to validate. Must be one of:
            "price", "volume", "percent", "custom"

    Returns:
        str: The validated type string (same as input if valid).
            Returning the input allows for method chaining and confirms
            validation success.

    Raises:
        ValueValidationError: If type_value is not one of the valid types.

    Example:
        Validate format types::

            >>> validate_price_format_type("price")
            'price'

            >>> validate_price_format_type("volume")
            'volume'

            >>> validate_price_format_type("percent")
            'percent'

            >>> validate_price_format_type("custom")
            'custom'

            # Invalid type raises exception
            >>> validate_price_format_type("invalid")
            ValueValidationError: type must be one of {...}, got 'invalid'

    Note:
        The validation is case-sensitive. "Price" and "PRICE" are not valid,
        only "price" (lowercase) is accepted. This ensures consistency with
        the frontend JavaScript code.

    """
    # Define set of valid price format types
    # Using a set for O(1) lookup performance
    # These correspond to formatting modes in the charting library
    valid_types = {"price", "volume", "percent", "custom"}

    # Check if provided type is in the valid set
    if type_value not in valid_types:
        # If invalid, raise descriptive error showing what's valid
        # Using ValueValidationError for consistent error handling
        raise ValueValidationError(
            "type",
            f"must be one of {valid_types}, got {type_value!r}",
        )

    # Return the validated value
    # This allows for method chaining and confirms validation passed
    return type_value


def validate_precision(precision: int) -> int:
    """Validate precision value for number formatting.

    This function validates that a precision value is appropriate for
    number formatting in charts. Precision determines the number of
    decimal places shown for price and volume values.

    Args:
        precision (int): Precision value to validate. Must be:
            - An integer type (not float)
            - Non-negative (>= 0)

    Returns:
        int: The validated precision value (same as input if valid).

    Raises:
        ValueValidationError: If precision is negative or not an integer.

    Example:
        Validate precision values::

            >>> validate_precision(0)
            0

            >>> validate_precision(2)
            2

            >>> validate_precision(5)
            5

            # Invalid: negative
            >>> validate_precision(-1)
            ValueValidationError: precision must be non-negative, got -1

            # Invalid: not an integer
            >>> validate_precision(2.5)
            ValueValidationError: precision must be non-negative integer, got 2.5

    Note:
        While the function accepts any non-negative integer, precision
        values typically range from 0 to 8 in financial charts. Very
        large precision values (> 10) may cause display issues or
        performance problems in the frontend.

    """
    # Check both type and value constraints
    # Must be exactly int type (not bool, which is subclass of int)
    # Must be non-negative (>= 0)
    if not isinstance(precision, int) or precision < 0:
        # Raise descriptive error if validation fails
        # Shows both the constraint and the actual invalid value
        raise ValueValidationError(
            "precision",
            f"must be a non-negative integer, got {precision}",
        )

    # Return validated value
    # This confirms validation passed and allows method chaining
    return precision


def validate_min_move(min_move: float) -> float:
    """Validate minimum move value for price changes.

    This function validates that a minimum move value is appropriate for
    chart configuration. Minimum move determines the smallest price change
    that will trigger a visual update in the chart. It's crucial for
    performance - smaller values mean more frequent updates.

    Args:
        min_move (float): Minimum move value to validate. Must be:
            - A numeric type (int or float)
            - Positive (> 0)

    Returns:
        float: The validated minimum move value, converted to float for
            consistency. Even integer inputs are returned as floats.

    Raises:
        ValueValidationError: If min_move is zero, negative, or not numeric.

    Example:
        Validate minimum move values::

            >>> validate_min_move(0.001)
            0.001

            >>> validate_min_move(1.0)
            1.0

            >>> validate_min_move(100)
            100.0

            # Invalid: zero
            >>> validate_min_move(0)
            ValueValidationError: min_move must be positive, got 0

            # Invalid: negative
            >>> validate_min_move(-0.1)
            ValueValidationError: min_move must be positive, got -0.1

    Note:
        Minimum move values are typically very small positive numbers:
        - Stocks: 0.01 (penny)
        - Forex: 0.0001 (pip)
        - Crypto: varies widely

        The function accepts both int and float, converting to float for
        consistency. This allows flexible input while ensuring type safety.

    """
    # Check type and value constraints
    # Must be int or float (numeric type)
    # Must be strictly positive (> 0), not just non-negative
    if not isinstance(min_move, (int, float)) or min_move <= 0:
        # Use helper method to create appropriate error
        # positive_value() creates a standardized error message
        raise ValueValidationError.positive_value("min_move", min_move)

    # Convert to float for consistency
    # Even if input is int (e.g., 1), return float (1.0)
    # This ensures consistent type in chart configuration
    return float(min_move)
