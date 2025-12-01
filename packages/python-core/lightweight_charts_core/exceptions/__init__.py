"""Custom exceptions for streamlit-lightweight-charts-pro.

This module provides a hierarchical structure of custom exceptions for
precise error handling across the streamlit-lightweight-charts-pro package.
The exceptions are organized into categories for validation, configuration,
type checking, and data handling errors.

The exception hierarchy:
    - ValidationError: Base for all validation-related errors
        - TypeValidationError: Type mismatch errors
        - ValueValidationError: Value constraint errors
        - RangeValidationError: Out-of-range errors
        - RequiredFieldError: Missing required fields
        - DuplicateError: Duplicate value errors
        - ColorValidationError: Invalid color formats
        - DataFrameValidationError: DataFrame validation errors
        - TimeValidationError: Time validation errors
    - ConfigurationError: Base for configuration errors
        - ComponentNotAvailableError: Component initialization errors
        - NpmNotFoundError: NPM not found errors
        - CliNotFoundError: CLI not found errors

Example:
    Catching validation errors::

        from lightweight_charts_core.exceptions import ValidationError, ValueValidationError

        try:
            # Some validation logic
            if value < 0:
                raise ValueValidationError.positive_value("price", value)
        except ValidationError as e:
            print(f"Validation failed: {e}")

"""

# Standard Imports
from typing import Any


class ValidationError(Exception):
    """Base exception for all validation errors.

    This is the root exception class for all validation-related errors
    in the package. It should be caught when you want to handle any type
    of validation failure.

    Args:
        message (str): Descriptive error message explaining the validation
            failure.

    Example:
        >>> raise ValidationError("Invalid input provided")

    """

    def __init__(self, message: str):
        """Initialize ValidationError with a message.

        Args:
            message (str): Error message describing the validation failure.

        """
        # Call parent Exception class constructor with the message
        super().__init__(message)


class ConfigurationError(Exception):
    """Base exception for configuration-related errors.

    This exception is raised when there are issues with system configuration,
    environment setup, or package initialization.

    Args:
        message (str): Descriptive error message explaining the
            configuration issue.

    Example:
        >>> raise ConfigurationError("Invalid configuration detected")

    """

    def __init__(self, message: str):
        """Initialize ConfigurationError with a message.

        Args:
            message (str): Error message describing the configuration issue.

        """
        # Call parent Exception class constructor with the message
        super().__init__(message)


class TypeValidationError(ValidationError):
    """Raised when type validation fails.

    This exception is used when a value is of an incorrect type.
    It provides formatted error messages that clearly indicate what
    type was expected versus what was received.

    Args:
        field_name (str): Name of the field that failed validation.
        expected_type (str): Description of the expected type.
        actual_type (Optional[str]): Description of the actual type
            received. If None, only expected type is shown.

    Example:
        >>> raise TypeValidationError("price", "float", "str")
        # Error: price must be float, got str

    """

    def __init__(
        self,
        field_name: str,
        expected_type: str,
        actual_type: str | None = None,
    ):
        """Initialize TypeValidationError.

        Args:
            field_name (str): Name of the field being validated.
            expected_type (str): Expected type description.
            actual_type (Optional[str]): Actual type received, if known.

        """
        # Build error message based on whether actual type is provided
        if actual_type:
            # Include both expected and actual types in message
            message = f"{field_name} must be {expected_type}, got {actual_type}"
        else:
            # Only show expected type
            message = f"{field_name} must be {expected_type}"

        # Call parent ValidationError with formatted message
        super().__init__(message)


class ValueValidationError(ValidationError):
    """Raised when value validation fails.

    This class provides helper methods for common validation patterns,
    reducing the need for overly specific exception classes. It handles
    validations like positive numbers, ranges, and required fields.

    Args:
        field_name (str): Name of the field that failed validation.
        message (str): Description of why validation failed.

    Example:
        >>> error = ValueValidationError.positive_value("price", -10)
        >>> raise error
        # Error: price must be positive, got -10

    """

    def __init__(self, field_name: str, message: str):
        """Initialize ValueValidationError.

        Args:
            field_name (str): Name of the field being validated.
            message (str): Validation failure description.

        """
        # Combine field name and message for full error text
        super().__init__(f"{field_name} {message}")

    @classmethod
    def positive_value(cls, field_name: str, value: float | int) -> "ValueValidationError":
        """Create error for non-positive value.

        Helper method for validating that a value is positive (> 0).

        Args:
            field_name (str): Name of the field being validated.
            value (float | int): The invalid value that was provided.

        Returns:
            ValueValidationError: Configured error instance.

        Example:
            >>> error = ValueValidationError.positive_value("price", -5)
            >>> raise error

        """
        # Create instance with positive value message
        return cls(field_name, f"must be positive, got {value}")

    @classmethod
    def non_negative_value(
        cls,
        field_name: str,
        value: float | int | None = None,
    ) -> "ValueValidationError":
        """Create error for negative value.

        Helper method for validating that a value is non-negative (>= 0).

        Args:
            field_name (str): Name of the field being validated.
            value (float | int | None): The invalid value that was provided.
                If None, only shows constraint without value.

        Returns:
            ValueValidationError: Configured error instance.

        Example:
            >>> error = ValueValidationError.non_negative_value("count", -1)
            >>> raise error

        """
        # Build message based on whether value is provided
        if value is not None:
            # Include the invalid value in message
            return cls(field_name, f"must be >= 0, got {value}")
        # Generic message without specific value
        return cls(field_name, "must be non-negative")

    @classmethod
    def in_range(
        cls,
        field_name: str,
        min_val: float,
        max_val: float,
        value: float | int,
    ) -> "ValueValidationError":
        """Create error for out-of-range value.

        Helper method for validating that a value falls within a
        specified range [min_val, max_val].

        Args:
            field_name (str): Name of the field being validated.
            min_val (float): Minimum acceptable value (inclusive).
            max_val (float): Maximum acceptable value (inclusive).
            value (float | int): The invalid value that was provided.

        Returns:
            ValueValidationError: Configured error instance.

        Example:
            >>> error = ValueValidationError.in_range("percentage", 0, 100, 150)
            >>> raise error

        """
        # Create instance with range validation message
        return cls(field_name, f"must be between {min_val} and {max_val}, got {value}")

    @classmethod
    def required_field(cls, field_name: str) -> "ValueValidationError":
        """Create error for missing required field.

        Helper method for validating that a required field is present.

        Args:
            field_name (str): Name of the required field.

        Returns:
            ValueValidationError: Configured error instance.

        Example:
            >>> error = ValueValidationError.required_field("title")
            >>> raise error

        """
        # Create instance with required field message
        return cls(field_name, "is required")


class RangeValidationError(ValueValidationError):
    """Raised when value is outside valid range.

    This exception is used for numeric range validation, supporting
    minimum-only, maximum-only, or bounded ranges.

    Args:
        field_name (str): Name of the field being validated.
        value (float | int): The value that failed validation.
        min_value (Optional[float]): Minimum acceptable value, if any.
        max_value (Optional[float]): Maximum acceptable value, if any.

    Example:
        >>> raise RangeValidationError("opacity", 1.5, 0.0, 1.0)
        # Error: opacity must be between 0.0 and 1.0, got 1.5

    """

    def __init__(
        self,
        field_name: str,
        value: float | int,
        min_value: float | None = None,
        max_value: float | None = None,
    ):
        """Initialize RangeValidationError.

        Args:
            field_name (str): Name of the field being validated.
            value (float | int): Invalid value provided.
            min_value (Optional[float]): Minimum bound, if applicable.
            max_value (Optional[float]): Maximum bound, if applicable.

        """
        # Build appropriate message based on which bounds are specified
        if min_value is not None and max_value is not None:
            # Both bounds specified - full range message
            message = f"must be between {min_value} and {max_value}, got {value}"
        elif min_value is not None:
            # Only minimum bound specified
            message = f"must be >= {min_value}, got {value}"
        elif max_value is not None:
            # Only maximum bound specified
            message = f"must be <= {max_value}, got {value}"
        else:
            # No bounds specified - generic invalid value message
            message = f"invalid value: {value}"

        # Call parent ValueValidationError with formatted message
        super().__init__(field_name, message)


class RequiredFieldError(ValidationError):
    """Raised when a required field is missing.

    This exception indicates that a mandatory field was not provided
    when creating or updating an object.

    Args:
        field_name (str): Name of the required field that is missing.

    Example:
        >>> raise RequiredFieldError("title")
        # Error: title is required

    """

    def __init__(self, field_name: str):
        """Initialize RequiredFieldError.

        Args:
            field_name (str): Name of the missing required field.

        """
        # Format message indicating field is required
        super().__init__(f"{field_name} is required")


class DuplicateError(ValidationError):
    """Raised when duplicate values are detected.

    This exception is used when a unique constraint is violated, such as
    duplicate IDs, names, or other identifiers.

    Args:
        field_name (str): Name of the field where duplicate was detected.
        value (Any): The duplicate value.

    Example:
        >>> raise DuplicateError("series_id", "main")
        # Error: Duplicate series_id: main

    """

    def __init__(self, field_name: str, value: Any):
        """Initialize DuplicateError.

        Args:
            field_name (str): Field name where duplicate was found.
            value (Any): The duplicate value.

        """
        # Format message showing duplicate field and value
        super().__init__(f"Duplicate {field_name}: {value}")


class ComponentNotAvailableError(ConfigurationError):
    """Raised when component function is not available.

    This error occurs when the Streamlit component has not been properly
    initialized or the component build is not available.

    Example:
        >>> raise ComponentNotAvailableError()
        # Error: Component function not available. Please check if the
        # component is properly initialized.

    """

    def __init__(self):
        """Initialize ComponentNotAvailableError with standard message."""
        # Use predefined message for component availability issues
        super().__init__(
            "Component function not available. "
            "Please check if the component is properly initialized."
        )


class AnnotationItemsTypeError(TypeValidationError):
    """Raised when annotation items are not correct type.

    This exception indicates that items in an annotation list are not
    instances of the Annotation class.

    Example:
        >>> raise AnnotationItemsTypeError()
        # Error: All items must be Annotation instances

    """

    def __init__(self):
        """Initialize AnnotationItemsTypeError with standard message."""
        # Use predefined message for annotation type errors
        super().__init__("All items", "Annotation instances")


class SeriesItemsTypeError(TypeValidationError):
    """Raised when series items are not correct type.

    This exception indicates that items in a series list are not
    instances of the Series class.

    Example:
        >>> raise SeriesItemsTypeError()
        # Error: All items must be Series instances

    """

    def __init__(self):
        """Initialize SeriesItemsTypeError with standard message."""
        # Use predefined message for series type errors
        super().__init__("All items", "Series instances")


class PriceScaleIdTypeError(TypeValidationError):
    """Raised when price scale ID is not a string.

    Args:
        scale_name (str): Name of the price scale.
        actual_type (type): The actual type that was provided.

    Example:
        >>> raise PriceScaleIdTypeError("left_scale", int)
        # Error: left_scale.price_scale_id must be a string, got int

    """

    def __init__(self, scale_name: str, actual_type: type):
        """Initialize PriceScaleIdTypeError.

        Args:
            scale_name (str): Name of the price scale configuration.
            actual_type (type): Actual type of the invalid value.

        """
        # Format message with scale name and type information
        super().__init__(
            f"{scale_name}.price_scale_id",
            "must be a string",
            actual_type.__name__,
        )


class PriceScaleOptionsTypeError(TypeValidationError):
    """Raised when price scale options are invalid.

    Args:
        scale_name (str): Name of the price scale.
        actual_type (type): The actual type that was provided.

    Example:
        >>> raise PriceScaleOptionsTypeError("right_scale", dict)
        # Error: right_scale must be a PriceScaleOptions object, got dict

    """

    def __init__(self, scale_name: str, actual_type: type):
        """Initialize PriceScaleOptionsTypeError.

        Args:
            scale_name (str): Name of the price scale configuration.
            actual_type (type): Actual type of the invalid value.

        """
        # Format message indicating PriceScaleOptions is required
        super().__init__(
            scale_name,
            "must be a PriceScaleOptions object",
            actual_type.__name__,
        )


class ColorValidationError(ValidationError):
    """Raised when color format is invalid.

    This exception is used when a color value doesn't match expected
    formats (hex or rgba).

    Args:
        property_name (str): Name of the property with invalid color.
        color_value (str): The invalid color value.

    Example:
        >>> raise ColorValidationError("backgroundColor", "invalid")
        # Error: Invalid color format for backgroundColor: 'invalid'.
        # Must be hex or rgba.

    """

    def __init__(self, property_name: str, color_value: str):
        """Initialize ColorValidationError.

        Args:
            property_name (str): Property name containing the color.
            color_value (str): The invalid color value.

        """
        # Format message with property name and color value
        super().__init__(
            f"Invalid color format for {property_name}: {color_value!r}. Must be hex or rgba."
        )


class DataFrameValidationError(ValidationError):
    """Raised when DataFrame validation fails.

    This exception provides helper methods for common DataFrame validation
    errors like missing columns or invalid data types.

    Example:
        >>> error = DataFrameValidationError.missing_column("price")
        >>> raise error
        # Error: DataFrame is missing required column: price

    """

    @classmethod
    def missing_column(cls, column: str) -> "DataFrameValidationError":
        """Create error for missing DataFrame column.

        Args:
            column (str): Name of the missing column.

        Returns:
            DataFrameValidationError: Configured error instance.

        Example:
            >>> error = DataFrameValidationError.missing_column("time")
            >>> raise error

        """
        # Create instance with missing column message
        return cls(f"DataFrame is missing required column: {column}")

    @classmethod
    def invalid_data_type(cls, data_type: type) -> "DataFrameValidationError":
        """Create error for invalid data type.

        Args:
            data_type (type): The invalid data type provided.

        Returns:
            DataFrameValidationError: Configured error instance.

        Example:
            >>> error = DataFrameValidationError.invalid_data_type(str)
            >>> raise error

        """
        # Create instance with invalid data type message
        return cls(
            f"data must be a list of SingleValueData objects, DataFrame, or Series, got {data_type}"
        )

    @classmethod
    def missing_columns_mapping(
        cls,
        missing_columns: list[str],
        required: list[str],
        mapping: dict[str, str],
    ) -> "DataFrameValidationError":
        """Create error for missing columns in mapping.

        Args:
            missing_columns (list[str]): List of missing column names.
            required (list[str]): List of required column names.
            mapping (dict[str, str]): The column mapping that was provided.

        Returns:
            DataFrameValidationError: Configured error instance.

        Example:
            >>> error = DataFrameValidationError.missing_columns_mapping(
            ...     ["price"], ["time", "price"], {"time": "timestamp"}
            ... )
            >>> raise error

        """
        # Build detailed message showing what's missing
        message = (
            f"Missing required columns in column_mapping: {missing_columns}\n"
            f"Required columns: {required}\n"
            f"Column mapping: {mapping}"
        )
        # Create instance with detailed mapping error message
        return cls(message)


class TimeValidationError(ValidationError):
    """Raised when time validation fails.

    This exception is used for time-related validation errors such as
    invalid time strings or unsupported time types.

    Args:
        message (str): Description of the time validation failure.

    Example:
        >>> raise TimeValidationError("Invalid timestamp format")
        # Error: Time validation failed: Invalid timestamp format

    """

    def __init__(self, message: str):
        """Initialize TimeValidationError.

        Args:
            message (str): Time validation failure description.

        """
        # Prefix message with "Time validation failed:"
        super().__init__(f"Time validation failed: {message}")

    @classmethod
    def invalid_time_string(cls, time_value: str) -> "TimeValidationError":
        """Create error for invalid time string.

        Args:
            time_value (str): The invalid time string.

        Returns:
            TimeValidationError: Configured error instance.

        Example:
            >>> error = TimeValidationError.invalid_time_string("not-a-date")
            >>> raise error

        """
        # Create instance with invalid time string message
        return cls(f"Invalid time string: {time_value!r}")

    @classmethod
    def unsupported_type(cls, time_type: type) -> "TimeValidationError":
        """Create error for unsupported time type.

        Args:
            time_type (type): The unsupported type.

        Returns:
            TimeValidationError: Configured error instance.

        Example:
            >>> error = TimeValidationError.unsupported_type(list)
            >>> raise error

        """
        # Create instance with unsupported type message
        return cls(f"Unsupported time type {time_type.__name__}")


class UnsupportedTimeTypeError(TypeValidationError):
    """Raised when time type is unsupported.

    Args:
        time_type (type): The unsupported time type.

    Example:
        >>> raise UnsupportedTimeTypeError(list)
        # Error: time unsupported type, got list

    """

    def __init__(self, time_type: type):
        """Initialize UnsupportedTimeTypeError.

        Args:
            time_type (type): The unsupported type provided.

        """
        # Use predefined message for unsupported time types
        super().__init__("time", "unsupported type", time_type.__name__)


class InvalidMarkerPositionError(ValidationError):
    """Raised when marker position is invalid.

    Args:
        position (str): The invalid position value.
        marker_type (str): The type of marker.

    Example:
        >>> raise InvalidMarkerPositionError("top", "circle")
        # Error: Invalid position 'top' for marker type circle

    """

    def __init__(self, position: str, marker_type: str):
        """Initialize InvalidMarkerPositionError.

        Args:
            position (str): The invalid position string.
            marker_type (str): Type of marker being configured.

        """
        # Format message with position and marker type
        super().__init__(f"Invalid position '{position}' for marker type {marker_type}")


class ColumnMappingRequiredError(RequiredFieldError):
    """Raised when column mapping is required but not provided.

    This exception is used when DataFrame or Series data is provided
    without the necessary column mapping configuration.

    Example:
        >>> raise ColumnMappingRequiredError()
        # Error: column_mapping is required when providing DataFrame or
        # Series data is required

    """

    def __init__(self):
        """Initialize ColumnMappingRequiredError with standard message."""
        # Use predefined message for missing column mapping
        super().__init__("column_mapping is required when providing DataFrame or Series data")


class DataItemsTypeError(TypeValidationError):
    """Raised when data items are not correct type.

    This exception indicates that items in a data list are not instances
    of Data class or its subclasses.

    Example:
        >>> raise DataItemsTypeError()
        # Error: All items in data list must be instances of Data or its
        # subclasses

    """

    def __init__(self):
        """Initialize DataItemsTypeError with standard message."""
        # Use predefined message for data items type errors
        super().__init__(
            "All items in data list",
            "instances of Data or its subclasses",
        )


class ExitTimeAfterEntryTimeError(ValueValidationError):
    """Raised when exit time must be after entry time.

    This exception is used in trading-related functionality where exit
    time must logically come after entry time.

    Example:
        >>> raise ExitTimeAfterEntryTimeError()
        # Error: Exit time must be after entry time

    """

    def __init__(self):
        """Initialize ExitTimeAfterEntryTimeError with standard message."""
        # Use predefined message for time ordering errors
        super().__init__("Exit time", "must be after entry time")


class InstanceTypeError(TypeValidationError):
    """Raised when value must be an instance of a specific type.

    Args:
        attr_name (str): Name of the attribute being validated.
        value_type (type): The required type.
        allow_none (bool): Whether None is allowed as a valid value.

    Example:
        >>> raise InstanceTypeError("series", Series, allow_none=True)
        # Error: series must be an instance of Series or None

    """

    def __init__(self, attr_name: str, value_type: type, allow_none: bool = False):
        """Initialize InstanceTypeError.

        Args:
            attr_name (str): Attribute name being validated.
            value_type (type): Required type for the value.
            allow_none (bool): Whether None is acceptable.

        """
        # Build message based on whether None is allowed
        if allow_none:
            # Include "or None" in the message
            message = f"an instance of {value_type.__name__} or None"
        else:
            # Only require the specific type
            message = f"an instance of {value_type.__name__}"

        # Call parent TypeValidationError with formatted message
        super().__init__(attr_name, message)


class TypeMismatchError(TypeValidationError):
    """Raised when type mismatch occurs.

    Args:
        attr_name (str): Name of the attribute with type mismatch.
        value_type (type): The expected type.
        actual_type (type): The actual type received.

    Example:
        >>> raise TypeMismatchError("count", int, str)
        # Error: count must be of type int, got str

    """

    def __init__(self, attr_name: str, value_type: type, actual_type: type):
        """Initialize TypeMismatchError.

        Args:
            attr_name (str): Attribute name being validated.
            value_type (type): Expected type.
            actual_type (type): Actual type received.

        """
        # Format message with expected and actual type names
        super().__init__(
            attr_name,
            f"must be of type {value_type.__name__}",
            actual_type.__name__,
        )


class TrendDirectionIntegerError(TypeValidationError):
    """Raised when trend direction is not an integer.

    Args:
        field_name (str): Name of the field containing trend direction.
        expected_type (str): Description of expected type.
        actual_type (str): Description of actual type.

    Example:
        >>> raise TrendDirectionIntegerError("direction", "int", "float")
        # Error: direction must be int, got float

    """

    def __init__(self, field_name: str, expected_type: str, actual_type: str):
        """Initialize TrendDirectionIntegerError.

        Args:
            field_name (str): Field name being validated.
            expected_type (str): Expected type description.
            actual_type (str): Actual type description.

        """
        # Format message with type requirement
        super().__init__(field_name, f"must be {expected_type}", actual_type)


class BaseValueFormatError(ValidationError):
    """Raised when base value format is invalid.

    This exception is used when a base value dictionary doesn't contain
    the required 'type' and 'price' keys.

    Example:
        >>> raise BaseValueFormatError()
        # Error: Base value must be a dict with 'type' and 'price' keys

    """

    def __init__(self):
        """Initialize BaseValueFormatError with standard message."""
        # Use predefined message for base value format errors
        super().__init__("Base value must be a dict with 'type' and 'price' keys")


class NotFoundError(ValidationError):
    """Raised when a requested resource is not found.

    Args:
        resource_type (str): Type of resource (e.g., "Series", "Chart").
        identifier (str): Identifier used to search for the resource.

    Example:
        >>> raise NotFoundError("Series", "main-series")
        # Error: Series with identifier 'main-series' not found

    """

    def __init__(self, resource_type: str, identifier: str):
        """Initialize NotFoundError.

        Args:
            resource_type (str): Type of the missing resource.
            identifier (str): Identifier that was searched for.

        """
        # Format message with resource type and identifier
        super().__init__(f"{resource_type} with identifier '{identifier}' not found")


class NpmNotFoundError(ConfigurationError):
    """Raised when NPM is not found in the system PATH.

    This error occurs during frontend build operations when NPM
    (Node Package Manager) is not installed or not accessible.

    Example:
        >>> raise NpmNotFoundError()
        # Error: NPM not found in system PATH. Please install Node.js
        # and NPM to build frontend assets.

    """

    def __init__(self):
        """Initialize NpmNotFoundError with standard message."""
        # Use predefined message for NPM not found errors
        message = (
            "NPM not found in system PATH. Please install Node.js and NPM to build frontend assets."
        )
        super().__init__(message)


class CliNotFoundError(ConfigurationError):
    """Raised when CLI is not found in the system PATH.

    This error occurs when the package CLI tools are not properly
    installed or accessible.

    Example:
        >>> raise CliNotFoundError()
        # Error: CLI not found in system PATH. Please ensure the package
        # is properly installed.

    """

    def __init__(self):
        """Initialize CliNotFoundError with standard message."""
        # Use predefined message for CLI not found errors
        message = "CLI not found in system PATH. Please ensure the package is properly installed."
        super().__init__(message)
