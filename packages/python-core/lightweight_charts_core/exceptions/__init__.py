"""Custom exceptions for lightweight-charts-core.

This module provides a hierarchical structure of custom exceptions for
precise error handling across the lightweight-charts-core package.
"""

from typing import Any, Optional


class ValidationError(Exception):
    """Base exception for all validation errors."""

    def __init__(self, message: str):
        super().__init__(message)


class ConfigurationError(Exception):
    """Base exception for configuration-related errors."""

    def __init__(self, message: str):
        super().__init__(message)


class TypeValidationError(ValidationError):
    """Raised when type validation fails."""

    def __init__(
        self,
        field_name: str,
        expected_type: str,
        actual_type: Optional[str] = None,
    ):
        if actual_type:
            message = f"{field_name} must be {expected_type}, got {actual_type}"
        else:
            message = f"{field_name} must be {expected_type}"
        super().__init__(message)


class ValueValidationError(ValidationError):
    """Raised when value validation fails."""

    def __init__(self, field_name: str, message: str):
        super().__init__(f"{field_name} {message}")

    @classmethod
    def positive_value(cls, field_name: str, value: float | int) -> "ValueValidationError":
        """Create error for non-positive value."""
        return cls(field_name, f"must be positive, got {value}")

    @classmethod
    def non_negative_value(
        cls,
        field_name: str,
        value: float | int | None = None,
    ) -> "ValueValidationError":
        """Create error for negative value."""
        if value is not None:
            return cls(field_name, f"must be >= 0, got {value}")
        return cls(field_name, "must be non-negative")

    @classmethod
    def in_range(
        cls,
        field_name: str,
        min_val: float,
        max_val: float,
        value: float | int,
    ) -> "ValueValidationError":
        """Create error for out-of-range value."""
        return cls(field_name, f"must be between {min_val} and {max_val}, got {value}")

    @classmethod
    def required_field(cls, field_name: str) -> "ValueValidationError":
        """Create error for missing required field."""
        return cls(field_name, "is required")


class RangeValidationError(ValueValidationError):
    """Raised when value is outside valid range."""

    def __init__(
        self,
        field_name: str,
        value: float | int,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
    ):
        if min_value is not None and max_value is not None:
            message = f"must be between {min_value} and {max_value}, got {value}"
        elif min_value is not None:
            message = f"must be >= {min_value}, got {value}"
        elif max_value is not None:
            message = f"must be <= {max_value}, got {value}"
        else:
            message = f"invalid value: {value}"
        super().__init__(field_name, message)


class RequiredFieldError(ValidationError):
    """Raised when a required field is missing."""

    def __init__(self, field_name: str):
        super().__init__(f"{field_name} is required")


class DuplicateError(ValidationError):
    """Raised when duplicate values are detected."""

    def __init__(self, field_name: str, value: Any):
        super().__init__(f"Duplicate {field_name}: {value}")


class ColorValidationError(ValidationError):
    """Raised when color format is invalid."""

    def __init__(self, property_name: str, color_value: str):
        super().__init__(
            f"Invalid color format for {property_name}: {color_value!r}. Must be hex or rgba."
        )


class DataFrameValidationError(ValidationError):
    """Raised when DataFrame validation fails."""

    @classmethod
    def missing_column(cls, column: str) -> "DataFrameValidationError":
        """Create error for missing DataFrame column."""
        return cls(f"DataFrame is missing required column: {column}")

    @classmethod
    def invalid_data_type(cls, data_type: type) -> "DataFrameValidationError":
        """Create error for invalid data type."""
        return cls(
            f"data must be a list of SingleValueData objects, DataFrame, or Series, got {data_type}"
        )


class TimeValidationError(ValidationError):
    """Raised when time validation fails."""

    def __init__(self, message: str):
        super().__init__(f"Time validation failed: {message}")

    @classmethod
    def invalid_time_string(cls, time_value: str) -> "TimeValidationError":
        """Create error for invalid time string."""
        return cls(f"Invalid time string: {time_value!r}")

    @classmethod
    def unsupported_type(cls, time_type: type) -> "TimeValidationError":
        """Create error for unsupported time type."""
        return cls(f"Unsupported time type {time_type.__name__}")


class UnsupportedTimeTypeError(TypeValidationError):
    """Raised when time type is unsupported."""

    def __init__(self, time_type: type):
        super().__init__("time", "unsupported type", time_type.__name__)


class InvalidMarkerPositionError(ValidationError):
    """Raised when marker position is invalid."""

    def __init__(self, position: str, marker_type: str):
        super().__init__(f"Invalid position '{position}' for marker type {marker_type}")


class ColumnMappingRequiredError(RequiredFieldError):
    """Raised when column mapping is required but not provided."""

    def __init__(self):
        super().__init__("column_mapping is required when providing DataFrame or Series data")


class DataItemsTypeError(TypeValidationError):
    """Raised when data items are not correct type."""

    def __init__(self):
        super().__init__(
            "All items in data list",
            "instances of Data or its subclasses",
        )


class NotFoundError(ValidationError):
    """Raised when a requested resource is not found."""

    def __init__(self, resource_type: str, identifier: str):
        super().__init__(f"{resource_type} with identifier '{identifier}' not found")


__all__ = [
    "ColorValidationError",
    "ColumnMappingRequiredError",
    "ConfigurationError",
    "DataFrameValidationError",
    "DataItemsTypeError",
    "DuplicateError",
    "InvalidMarkerPositionError",
    "NotFoundError",
    "RangeValidationError",
    "RequiredFieldError",
    "TimeValidationError",
    "TypeValidationError",
    "UnsupportedTimeTypeError",
    "ValidationError",
    "ValueValidationError",
]
