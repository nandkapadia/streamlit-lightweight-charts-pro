"""Data utilities for lightweight-charts-core.

This module provides utility functions for data processing and
manipulation including time normalization, color validation, and
format conversion.
"""

import re
from datetime import datetime
from typing import Any

import pandas as pd

from lightweight_charts_core.exceptions import (
    TimeValidationError,
    UnsupportedTimeTypeError,
    ValueValidationError,
)
from lightweight_charts_core.utils.case_converter import CaseConverter


def normalize_time(time_value: Any) -> int:
    """Convert time input to UNIX seconds for consistent chart handling.

    Args:
        time_value: Time value to convert. Supported types:
            int/float, str, datetime, pd.Timestamp, numpy types.

    Returns:
        UNIX timestamp in seconds since epoch.

    Raises:
        TimeValidationError: If the input string cannot be parsed.
        UnsupportedTimeTypeError: If the input type is not supported.
    """
    if hasattr(time_value, "item"):
        time_value = time_value.item()
    elif hasattr(time_value, "dtype"):
        try:
            time_value = time_value.item()
        except (ValueError, TypeError):
            time_value = int(time_value) if hasattr(time_value, "__int__") else float(time_value)

    if isinstance(time_value, int):
        return time_value

    if isinstance(time_value, float):
        return int(time_value)

    if isinstance(time_value, str):
        try:
            dt = pd.to_datetime(time_value)
            return int(dt.timestamp())
        except (ValueError, TypeError) as exc:
            raise TimeValidationError(time_value) from exc

    if isinstance(time_value, datetime):
        return int(time_value.timestamp())

    if isinstance(time_value, pd.Timestamp):
        return int(time_value.timestamp())

    if hasattr(time_value, "date") and hasattr(time_value, "timetuple"):
        dt = datetime.combine(time_value, datetime.min.time())
        return int(dt.timestamp())

    raise UnsupportedTimeTypeError(type(time_value))


def to_utc_timestamp(time_value: Any) -> int:
    """Alias for normalize_time() maintained for backward compatibility."""
    return normalize_time(time_value)


def from_utc_timestamp(timestamp: int) -> str:
    """Convert UNIX timestamp to ISO format string.

    Args:
        timestamp: UNIX timestamp in seconds since epoch.

    Returns:
        ISO format datetime string in UTC timezone.
    """
    dt = datetime.utcfromtimestamp(timestamp)
    return dt.isoformat()


def snake_to_camel(snake_str: str) -> str:
    """Convert snake_case string to camelCase."""
    return CaseConverter.snake_to_camel(snake_str)


def is_valid_color(color: str) -> bool:
    """Check if a color string is valid.

    Args:
        color: Color string to validate. Supported formats:
            hex, RGB, RGBA, or named colors.

    Returns:
        True if color is valid, False otherwise.
    """
    if not isinstance(color, str):
        return False

    if color == "":
        return False

    hex_pattern = r"^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$"
    if re.match(hex_pattern, color):
        return True

    rgba_pattern = r"^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$"
    if re.match(rgba_pattern, color):
        return True

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

    return color.lower() in named_colors


def validate_price_format_type(type_value: str) -> str:
    """Validate price format type string.

    Args:
        type_value: Type string to validate.

    Returns:
        The validated type string.

    Raises:
        ValueValidationError: If type_value is not valid.
    """
    valid_types = {"price", "volume", "percent", "custom"}

    if type_value not in valid_types:
        raise ValueValidationError(
            "type",
            f"must be one of {valid_types}, got {type_value!r}",
        )

    return type_value


def validate_precision(precision: int) -> int:
    """Validate precision value for number formatting.

    Args:
        precision: Precision value to validate.

    Returns:
        The validated precision value.

    Raises:
        ValueValidationError: If precision is invalid.
    """
    if not isinstance(precision, int) or precision < 0:
        raise ValueValidationError(
            "precision",
            f"must be a non-negative integer, got {precision}",
        )

    return precision


def validate_min_move(min_move: float) -> float:
    """Validate minimum move value for price changes.

    Args:
        min_move: Minimum move value to validate.

    Returns:
        The validated minimum move value as float.

    Raises:
        ValueValidationError: If min_move is invalid.
    """
    if not isinstance(min_move, (int, float)) or min_move <= 0:
        raise ValueValidationError.positive_value("min_move", min_move)

    return float(min_move)


__all__ = [
    "from_utc_timestamp",
    "is_valid_color",
    "normalize_time",
    "snake_to_camel",
    "to_utc_timestamp",
    "validate_min_move",
    "validate_precision",
    "validate_price_format_type",
]
