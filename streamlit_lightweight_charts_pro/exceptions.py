"""Custom exceptions for streamlit-lightweight-charts-pro.

This module provides a comprehensive set of custom exceptions for the library,
organized in a hierarchical structure that makes error handling more specific
and informative.
"""

from typing import Any


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

    def __init__(self, field_name: str, expected_type: str):
        super().__init__(f"{field_name} must be {expected_type}")


class ValueValidationError(ValidationError):
    """Raised when value validation fails."""

    def __init__(self, field_name: str, message: str):
        super().__init__(f"{field_name} {message}")


class RequiredFieldError(ValidationError):
    """Raised when a required field is missing."""

    def __init__(self, message: str):
        super().__init__(message)


class DuplicateError(ValidationError):
    """Raised when duplicate values are detected."""

    def __init__(self, field_name: str, value: Any):
        super().__init__(f"Duplicate {field_name}: {value}")


class PriceScaleIdStringError(TypeValidationError):
    """Raised when price scale ID is not a string."""

    def __init__(self, field_name: str, expected_type: str):
        super().__init__(field_name, expected_type)


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
            f"must be a string, got {actual_type.__name__}",
        )


class PriceScaleOptionsTypeError(TypeValidationError):
    """Raised when price scale options are invalid."""

    def __init__(self, scale_name: str, actual_type: type):
        super().__init__(
            scale_name,
            f"must be a PriceScaleOptions object, got {actual_type.__name__}",
        )


class ColorValidationError(ValidationError):
    """Raised when color format is invalid."""

    def __init__(self, property_name: str, color_value: str):
        super().__init__(
            f"Invalid color format for {property_name}: {color_value!r}. Must be hex or rgba.",
        )


class DataFrameValidationError(ValidationError):
    """Raised when DataFrame validation fails."""

    def __init__(self, message: str):
        super().__init__(message)


class TimeValidationError(ValidationError):
    """Raised when time validation fails."""

    def __init__(self, time_value: str | None = None):
        if time_value is not None:
            super().__init__(f"Invalid time string: {time_value!r}")
        else:
            super().__init__("Invalid time format")


class UnsupportedTimeTypeError(TypeValidationError):
    """Raised when time type is unsupported."""

    def __init__(self, time_type: type):
        super().__init__("time", f"unsupported type {time_type.__name__}")


class MinMovePositiveError(ValueValidationError):
    """Raised when min_move is not positive."""

    def __init__(self, min_move: float | int):
        super().__init__("min_move", f"must be a positive number, got {min_move}")


class PaneIdNonNegativeError(ValueValidationError):
    """Raised when pane_id is negative."""

    def __init__(self):
        super().__init__("pane_id", "must be non-negative")


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


class DataFrameMissingColumnError(ValidationError):
    """Raised when DataFrame is missing required column."""

    def __init__(self, column: str):
        super().__init__(f"DataFrame is missing required column: {column}")


class MissingRequiredColumnsError(ValidationError):
    """Raised when required columns are missing from DataFrame."""

    def __init__(self, missing_columns: list[str], required: list[str], mapping: dict[str, str]):
        message = (
            f"Missing required columns in column_mapping: {missing_columns}\n"
            f"Required columns: {required}\n"
            f"Column mapping: {mapping}"
        )
        super().__init__(message)


class TimeColumnNotFoundError(ValidationError):
    """Raised when time column is not found in DataFrame."""

    def __init__(self, time_col: str):
        super().__init__(
            f"Time column '{time_col}' not found in DataFrame columns and no "
            "DatetimeIndex available in the index",
        )


class InvalidDataFormatError(ValidationError):
    """Raised when data format is invalid."""

    def __init__(self, data_type: type):
        super().__init__(
            "data must be a list of SingleValueData objects, DataFrame, or Series, "
            f"got {data_type}",
        )


class DataItemsTypeError(TypeValidationError):
    """Raised when data items are not correct type."""

    def __init__(self):
        super().__init__("All items in data list", "instances of Data or its subclasses")


class PositiveValueError(ValueValidationError):
    """Raised when value must be positive."""

    def __init__(self, field_name: str, value: float | int):
        super().__init__(field_name, f"must be positive, got {value}")


class InvalidTypeValueError(ValueValidationError):
    """Raised when type value is invalid."""

    def __init__(self, type_value: str):
        super().__init__(
            "type",
            f"must be one of 'price', 'volume', 'percent', 'custom', got {type_value!r}",
        )


class NonNegativeValueError(ValueValidationError):
    """Raised when value must be non-negative."""

    def __init__(self, field_name: str):
        super().__init__(field_name, "must be non-negative")


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
        super().__init__(attr_name, f"must be of type {value_type}, got {actual_type.__name__}")


class PrecisionNonNegativeError(ValueValidationError):
    """Raised when precision is not non-negative."""

    def __init__(self, field_name: str, message: str):
        super().__init__(field_name, message)


class TrendDirectionIntegerError(TypeValidationError):
    """Raised when trend direction is not an integer."""

    def __init__(self, field_name: str, expected_type: str, actual_type: str):
        super().__init__(field_name, f"must be {expected_type}, got {actual_type}")


class AnnotationTextRequiredError(ValueValidationError):
    """Raised when annotation text is required."""

    def __init__(self):
        super().__init__("text", "is required for annotations")


class BorderWidthNonNegativeError(ValueValidationError):
    """Raised when border width must be non-negative."""

    def __init__(self, field_name: str):
        super().__init__(field_name, "must be non-negative")


class FontSizePositiveError(ValueValidationError):
    """Raised when font size must be positive."""

    def __init__(self, field_name: str):
        super().__init__(field_name, "must be positive")


class LayerNameRequiredError(ValueValidationError):
    """Raised when layer name is required."""

    def __init__(self):
        super().__init__("layer", "name is required")


class OpacityRangeError(ValueValidationError):
    """Raised when opacity is out of range."""

    def __init__(self, field_name: str, value: float):
        super().__init__(field_name, f"must be between 0.0 and 1.0, got {value}")


class PriceMustBeNumberError(TypeValidationError):
    """Raised when price must be a number."""

    def __init__(self, field_name: str):
        super().__init__(field_name, "a number")


class BaseValueFormatError(ValidationError):
    """Raised when base value format is invalid."""

    def __init__(self):
        super().__init__("Base value must be a dict with 'type' and 'price' keys")


class NotFoundError(ValidationError):
    """Raised when a requested resource is not found."""

    def __init__(self, resource_type: str, identifier: str):
        super().__init__(f"{resource_type} with identifier '{identifier}' not found")
