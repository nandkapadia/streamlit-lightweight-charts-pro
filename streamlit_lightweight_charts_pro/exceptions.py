"""Custom exceptions for streamlit-lightweight-charts-pro.

This module provides a streamlined set of custom exceptions organized in a
hierarchical structure that reduces redundancy while maintaining clarity and
specific error handling.
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

    def __init__(self, field_name: str, expected_type: str, actual_type: Optional[str] = None):
        if actual_type:
            message = f"{field_name} must be {expected_type}, got {actual_type}"
        else:
            message = f"{field_name} must be {expected_type}"
        super().__init__(message)


class ValueValidationError(ValidationError):
    """Raised when value validation fails.

    This class provides helper methods for common validation patterns
    to reduce the need for overly specific exception classes.
    """

    def __init__(self, field_name: str, message: str):
        super().__init__(f"{field_name} {message}")

    @classmethod
    def positive_value(cls, field_name: str, value: float | int) -> "ValueValidationError":
        """Helper for positive value validation."""
        return cls(field_name, f"must be positive, got {value}")

    @classmethod
    def non_negative_value(
        cls,
        field_name: str,
        value: float | int | None = None,
    ) -> "ValueValidationError":
        """Helper for non-negative value validation."""
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
        """Helper for range validation."""
        return cls(field_name, f"must be between {min_val} and {max_val}, got {value}")

    @classmethod
    def required_field(cls, field_name: str) -> "ValueValidationError":
        """Helper for required field validation."""
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


class ComponentNotAvailableError(ConfigurationError):
    """Raised when component function is not available."""

    def __init__(self):
        super().__init__(
            "Component function not available. "
            "Please check if the component is properly initialized.",
        )


class AnnotationItemsTypeError(TypeValidationError):
    """Raised when annotation items are not correct type."""

    def __init__(self):
        super().__init__("All items", "Annotation instances")


class SeriesItemsTypeError(TypeValidationError):
    """Raised when series items are not correct type."""

    def __init__(self):
        super().__init__("All items", "Series instances")


class PriceScaleIdTypeError(TypeValidationError):
    """Raised when price scale ID is not a string."""

    def __init__(self, scale_name: str, actual_type: type):
        super().__init__(
            f"{scale_name}.price_scale_id",
            "must be a string",
            actual_type.__name__,
        )


class PriceScaleOptionsTypeError(TypeValidationError):
    """Raised when price scale options are invalid."""

    def __init__(self, scale_name: str, actual_type: type):
        super().__init__(
            scale_name,
            "must be a PriceScaleOptions object",
            actual_type.__name__,
        )


class ColorValidationError(ValidationError):
    """Raised when color format is invalid."""

    def __init__(self, property_name: str, color_value: str):
        super().__init__(
            f"Invalid color format for {property_name}: {color_value!r}. Must be hex or rgba.",
        )


class DataFrameValidationError(ValidationError):
    """Raised when DataFrame validation fails."""

    @classmethod
    def missing_column(cls, column: str) -> "DataFrameValidationError":
        """Helper for missing column validation."""
        return cls(f"DataFrame is missing required column: {column}")

    @classmethod
    def invalid_data_type(cls, data_type: type) -> "DataFrameValidationError":
        """Helper for invalid data type validation."""
        return cls(
            f"data must be a list of SingleValueData objects, DataFrame, or Series, got {data_type}",
        )

    @classmethod
    def missing_columns_mapping(
        cls,
        missing_columns: list[str],
        required: list[str],
        mapping: dict[str, str],
    ) -> "DataFrameValidationError":
        """Helper for missing columns mapping validation."""
        message = (
            f"Missing required columns in column_mapping: {missing_columns}\n"
            f"Required columns: {required}\n"
            f"Column mapping: {mapping}"
        )
        return cls(message)


class TimeValidationError(ValidationError):
    """Raised when time validation fails."""

    def __init__(self, message: str):
        super().__init__(f"Time validation failed: {message}")

    @classmethod
    def invalid_time_string(cls, time_value: str) -> "TimeValidationError":
        """Helper for invalid time string validation."""
        return cls(f"Invalid time string: {time_value!r}")

    @classmethod
    def unsupported_type(cls, time_type: type) -> "TimeValidationError":
        """Helper for unsupported time type validation."""
        return cls(f"Unsupported time type {time_type.__name__}")


class UnsupportedTimeTypeError(TypeValidationError):
    """Raised when time type is unsupported."""

    def __init__(self, time_type: type):
        super().__init__("time", "unsupported type", time_type.__name__)


class InvalidMarkerPositionError(ValidationError):
    """Raised when marker position is invalid."""

    def __init__(self, position: str, marker_type: str):
        super().__init__(
            f"Invalid position '{position}' for marker type {marker_type}",
        )


class ColumnMappingRequiredError(RequiredFieldError):
    """Raised when column mapping is required but not provided."""

    def __init__(self):
        super().__init__("column_mapping is required when providing DataFrame or Series data")


class DataItemsTypeError(TypeValidationError):
    """Raised when data items are not correct type."""

    def __init__(self):
        super().__init__("All items in data list", "instances of Data or its subclasses")


class ExitTimeAfterEntryTimeError(ValueValidationError):
    """Raised when exit time must be after entry time."""

    def __init__(self):
        super().__init__("Exit time", "must be after entry time")


class InstanceTypeError(TypeValidationError):
    """Raised when value must be an instance of a specific type."""

    def __init__(self, attr_name: str, value_type: type, allow_none: bool = False):
        if allow_none:
            message = f"an instance of {value_type.__name__} or None"
        else:
            message = f"an instance of {value_type.__name__}"
        super().__init__(attr_name, message)


class TypeMismatchError(TypeValidationError):
    """Raised when type mismatch occurs."""

    def __init__(self, attr_name: str, value_type: type, actual_type: type):
        super().__init__(attr_name, f"must be of type {value_type.__name__}", actual_type.__name__)


class TrendDirectionIntegerError(TypeValidationError):
    """Raised when trend direction is not an integer."""

    def __init__(self, field_name: str, expected_type: str, actual_type: str):
        super().__init__(field_name, f"must be {expected_type}", actual_type)


class BaseValueFormatError(ValidationError):
    """Raised when base value format is invalid."""

    def __init__(self):
        super().__init__("Base value must be a dict with 'type' and 'price' keys")


class NotFoundError(ValidationError):
    """Raised when a requested resource is not found."""

    def __init__(self, resource_type: str, identifier: str):
        super().__init__(f"{resource_type} with identifier '{identifier}' not found")


class NpmNotFoundError(ConfigurationError):
    """Raised when NPM is not found in the system PATH."""

    def __init__(self):
        message = (
            "NPM not found in system PATH. Please install Node.js and NPM to build frontend assets."
        )
        super().__init__(message)


class CliNotFoundError(ConfigurationError):
    """Raised when CLI is not found in the system PATH."""

    def __init__(self):
        message = "CLI not found in system PATH. Please ensure the package is properly installed."
        super().__init__(message)
