"""Custom exceptions for streamlit-lightweight-charts-pro.

This module re-exports core exceptions from lightweight_charts_pro and adds
Streamlit-specific exceptions.
"""

# Re-export core exceptions
from lightweight_charts_pro.exceptions import (
    ColorValidationError,
    ColumnMappingRequiredError,
    ConfigurationError,
    DataFrameValidationError,
    DataItemsTypeError,
    DuplicateError,
    InvalidMarkerPositionError,
    NotFoundError,
    RangeValidationError,
    RequiredFieldError,
    TimeValidationError,
    TypeValidationError,
    UnsupportedTimeTypeError,
    ValidationError,
    ValueValidationError,
)

# Streamlit-specific exceptions


class ComponentNotAvailableError(ConfigurationError):
    """Raised when component function is not available."""

    def __init__(self):
        super().__init__(
            "Component function not available. "
            "Please check if the component is properly initialized."
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
        super().__init__(
            attr_name,
            f"must be of type {value_type.__name__}",
            actual_type.__name__,
        )


class TrendDirectionIntegerError(TypeValidationError):
    """Raised when trend direction is not an integer."""

    def __init__(self, field_name: str, expected_type: str, actual_type: str):
        super().__init__(field_name, f"must be {expected_type}", actual_type)


class BaseValueFormatError(ValidationError):
    """Raised when base value format is invalid."""

    def __init__(self):
        super().__init__("Base value must be a dict with 'type' and 'price' keys")


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


__all__ = [
    # Streamlit-specific exceptions
    "AnnotationItemsTypeError",
    "BaseValueFormatError",
    "CliNotFoundError",
    # Core exceptions (re-exported from lightweight_charts_pro)
    "ColorValidationError",
    "ColumnMappingRequiredError",
    "ComponentNotAvailableError",
    "ConfigurationError",
    "DataFrameValidationError",
    "DataItemsTypeError",
    "DuplicateError",
    "ExitTimeAfterEntryTimeError",
    "InstanceTypeError",
    "InvalidMarkerPositionError",
    "NotFoundError",
    "NpmNotFoundError",
    "PriceScaleIdTypeError",
    "PriceScaleOptionsTypeError",
    "RangeValidationError",
    "RequiredFieldError",
    "SeriesItemsTypeError",
    "TimeValidationError",
    "TrendDirectionIntegerError",
    "TypeMismatchError",
    "TypeValidationError",
    "UnsupportedTimeTypeError",
    "ValidationError",
    "ValueValidationError",
]
