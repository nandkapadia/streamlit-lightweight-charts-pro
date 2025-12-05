"""Custom exception classes for the Streamlit Lightweight Charts Pro library.

This module defines custom exception classes specific to the Streamlit wrapper
while also re-exporting core exceptions from the lightweight_charts_pro package.
The exception hierarchy provides clear, specific error messages for various
validation and configuration issues that may occur during chart creation.

Exception Hierarchy:
    ValidationError (base)
    ├── TypeValidationError
    │   ├── DataItemsTypeError
    │   ├── AnnotationItemsTypeError (Streamlit-specific)
    │   ├── SeriesItemsTypeError (Streamlit-specific)
    │   ├── PriceScaleIdTypeError (Streamlit-specific)
    │   ├── PriceScaleOptionsTypeError (Streamlit-specific)
    │   ├── InstanceTypeError (Streamlit-specific)
    │   ├── TypeMismatchError (Streamlit-specific)
    │   └── TrendDirectionIntegerError (Streamlit-specific)
    ├── ValueValidationError
    │   ├── ColorValidationError
    │   ├── TimeValidationError
    │   ├── RangeValidationError
    │   └── ExitTimeAfterEntryTimeError (Streamlit-specific)
    ├── RequiredFieldError
    ├── DataFrameValidationError
    └── BaseValueFormatError (Streamlit-specific)
    ConfigurationError (base)
    ├── ComponentNotAvailableError (Streamlit-specific)
    ├── NpmNotFoundError (Streamlit-specific)
    └── CliNotFoundError (Streamlit-specific)

Usage Example:
    ```python
    from streamlit_lightweight_charts_pro.exceptions import (
        ComponentNotAvailableError,
        ValidationError,
    )

    try:
        # Component creation logic
        if not component_available:
            raise ComponentNotAvailableError()
    except ComponentNotAvailableError as e:
        st.error(str(e))
    ```

For more information, see the lightweight_charts_pro.exceptions module.
"""

# Standard Imports
# (None in this module)

# Third Party Imports
# Re-export core exceptions from the lightweight_charts_pro package
# These exceptions handle common validation and configuration errors
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

# Local Imports
# (None - this is a standalone exceptions module)

# =============================================================================
# Streamlit-Specific Exception Classes
# =============================================================================


class ComponentNotAvailableError(ConfigurationError):
    """Raised when the Streamlit component function is not available.

    This exception occurs when the component fails to initialize properly,
    typically due to missing frontend assets or incorrect installation.
    It extends ConfigurationError to indicate a setup/configuration issue.

    Attributes:
        message (str): A descriptive error message with troubleshooting guidance.

    Example:
        ```python
        if not component_func:
            raise ComponentNotAvailableError()
        ```
    """

    def __init__(self):
        """Initialize ComponentNotAvailableError with a descriptive message.

        Args:
            None

        Raises:
            None
        """
        # Call parent class constructor with helpful error message
        # This provides guidance on troubleshooting the component initialization issue
        super().__init__(
            "Component function not available. "
            "Please check if the component is properly initialized."
        )


class AnnotationItemsTypeError(TypeValidationError):
    """Raised when annotation items are not of the correct Annotation type.

    This exception is thrown when attempting to add annotations to a chart
    but the provided items are not instances of the Annotation class. All
    annotation items must be valid Annotation objects.

    Example:
        ```python
        # This will raise AnnotationItemsTypeError
        chart.add_annotations(["not", "annotations"])

        # Correct usage
        chart.add_annotations([create_text_annotation(...)])
        ```
    """

    def __init__(self):
        """Initialize AnnotationItemsTypeError with standard type error message.

        Args:
            None

        Raises:
            None
        """
        # Call parent with field name and expected type
        # This provides clear feedback about what type was expected
        super().__init__("All items", "Annotation instances")


class SeriesItemsTypeError(TypeValidationError):
    """Raised when series items are not of the correct Series type.

    This exception occurs when trying to add series to a chart but the
    provided items are not valid Series instances. All series must inherit
    from the base Series class (e.g., LineSeries, CandlestickSeries).

    Example:
        ```python
        # This will raise SeriesItemsTypeError
        chart.add_series([{"data": data}])

        # Correct usage
        chart.add_series([LineSeries(data)])
        ```
    """

    def __init__(self):
        """Initialize SeriesItemsTypeError with standard type error message.

        Args:
            None

        Raises:
            None
        """
        # Call parent with field name and expected type
        # Series items must be instances of Series subclasses
        super().__init__("All items", "Series instances")


class PriceScaleIdTypeError(TypeValidationError):
    """Raised when a price scale ID is not a string.

    Price scale IDs must be string values to properly identify and reference
    different price scales in multi-series charts. This exception is raised
    when a non-string value is provided as a price scale identifier.

    Attributes:
        scale_name (str): The name of the scale that has the invalid ID.
        actual_type (type): The actual type that was provided.

    Example:
        ```python
        # This will raise PriceScaleIdTypeError
        series.price_scale_id = 123

        # Correct usage
        series.price_scale_id = "right"
        ```
    """

    def __init__(self, scale_name: str, actual_type: type):
        """Initialize PriceScaleIdTypeError with scale name and actual type.

        Args:
            scale_name (str): The name of the price scale with the invalid ID.
            actual_type (type): The type that was incorrectly provided instead
                of a string.

        Raises:
            None
        """
        # Format error message with scale name and type information
        # This helps developers identify which scale has the type issue
        super().__init__(
            f"{scale_name}.price_scale_id",
            "must be a string",
            actual_type.__name__,
        )


class PriceScaleOptionsTypeError(TypeValidationError):
    """Raised when price scale options are not a PriceScaleOptions object.

    Price scale configuration must be provided as a PriceScaleOptions instance.
    This exception is raised when an invalid type is provided for price scale
    options, such as a dict or other object type.

    Attributes:
        scale_name (str): The name of the scale with invalid options.
        actual_type (type): The actual type that was provided.

    Example:
        ```python
        # This will raise PriceScaleOptionsTypeError
        series.price_scale_options = {"mode": 0}

        # Correct usage
        series.price_scale_options = PriceScaleOptions(mode=PriceScaleMode.NORMAL)
        ```
    """

    def __init__(self, scale_name: str, actual_type: type):
        """Initialize PriceScaleOptionsTypeError with scale name and type info.

        Args:
            scale_name (str): The name of the price scale with invalid options.
            actual_type (type): The type that was incorrectly provided instead
                of PriceScaleOptions.

        Raises:
            None
        """
        # Provide clear message about expected PriceScaleOptions type
        # Include both the scale name and actual type for debugging
        super().__init__(
            scale_name,
            "must be a PriceScaleOptions object",
            actual_type.__name__,
        )


class ExitTimeAfterEntryTimeError(ValueValidationError):
    """Raised when a trade's exit time is not after its entry time.

    In trade visualization, the exit time must chronologically follow the
    entry time. This exception is raised when this constraint is violated,
    which would result in an invalid or confusing trade representation.

    Example:
        ```python
        # This will raise ExitTimeAfterEntryTimeError
        trade = TradeData(
            entry_time="2024-01-02",
            exit_time="2024-01-01",  # Before entry!
            ...
        )

        # Correct usage
        trade = TradeData(
            entry_time="2024-01-01",
            exit_time="2024-01-02",
            ...
        )
        ```
    """

    def __init__(self):
        """Initialize ExitTimeAfterEntryTimeError with a descriptive message.

        Args:
            None

        Raises:
            None
        """
        # Call parent with field name and constraint description
        # This ensures trade data represents valid chronological order
        super().__init__("Exit time", "must be after entry time")


class InstanceTypeError(TypeValidationError):
    """Raised when a value must be an instance of a specific type.

    This is a general-purpose type validation exception for checking that
    values are instances of expected classes. Optionally allows None values
    when allow_none is True.

    Attributes:
        attr_name (str): Name of the attribute being validated.
        value_type (type): The expected type for the value.
        allow_none (bool): Whether None is an acceptable value.

    Example:
        ```python
        if not isinstance(value, ChartOptions):
            raise InstanceTypeError("options", ChartOptions, allow_none=True)
        ```
    """

    def __init__(self, attr_name: str, value_type: type, allow_none: bool = False):
        """Initialize InstanceTypeError with attribute name and expected type.

        Args:
            attr_name (str): The name of the attribute being validated.
            value_type (type): The type that the value should be an instance of.
            allow_none (bool, optional): If True, None is also an acceptable
                value. Defaults to False.

        Raises:
            None
        """
        # Build error message based on whether None is allowed
        # This provides clear guidance on acceptable types
        if allow_none:
            message = f"an instance of {value_type.__name__} or None"
        else:
            message = f"an instance of {value_type.__name__}"

        # Pass formatted message to parent TypeValidationError
        super().__init__(attr_name, message)


class TypeMismatchError(TypeValidationError):
    """Raised when there is a type mismatch between expected and actual types.

    This exception is used for strict type checking where the actual type
    does not match the expected type. Unlike InstanceTypeError, this checks
    for exact type matches rather than instance relationships.

    Attributes:
        attr_name (str): Name of the attribute with mismatched type.
        value_type (type): The expected type.
        actual_type (type): The actual type that was provided.

    Example:
        ```python
        if type(value) != int:
            raise TypeMismatchError("count", int, type(value))
        ```
    """

    def __init__(self, attr_name: str, value_type: type, actual_type: type):
        """Initialize TypeMismatchError with expected and actual type info.

        Args:
            attr_name (str): The name of the attribute being validated.
            value_type (type): The type that was expected.
            actual_type (type): The actual type that was provided.

        Raises:
            None
        """
        # Format message showing both expected and actual types
        # This helps developers quickly identify the type mismatch
        super().__init__(
            attr_name,
            f"must be of type {value_type.__name__}",
            actual_type.__name__,
        )


class TrendDirectionIntegerError(TypeValidationError):
    """Raised when a trend direction value is not an integer.

    Trend direction indicators must be integer values (typically -1, 0, or 1)
    to represent bearish, neutral, or bullish trends. This exception is raised
    when a non-integer value is provided for trend direction.

    Attributes:
        field_name (str): Name of the field containing the invalid trend value.
        expected_type (str): Description of the expected type.
        actual_type (str): The actual type that was provided.

    Example:
        ```python
        # This will raise TrendDirectionIntegerError
        data.trend_direction = "up"

        # Correct usage
        data.trend_direction = 1  # Bullish
        ```
    """

    def __init__(self, field_name: str, expected_type: str, actual_type: str):
        """Initialize TrendDirectionIntegerError with field and type details.

        Args:
            field_name (str): The name of the field being validated.
            expected_type (str): A description of the expected type (e.g., "an integer").
            actual_type (str): The name or description of the actual type provided.

        Raises:
            None
        """
        # Construct error message with field name and type expectations
        # Provides clear feedback for trend direction type validation
        super().__init__(field_name, f"must be {expected_type}", actual_type)


class BaseValueFormatError(ValidationError):
    """Raised when a baseline chart base value has invalid format.

    Baseline charts require a base value dict with specific 'type' and 'price'
    keys. This exception is raised when the base value doesn't match this
    required format.

    Example:
        ```python
        # This will raise BaseValueFormatError
        base_value = {"price": 100}  # Missing 'type' key

        # Correct usage
        base_value = {"type": 0, "price": 100}
        ```
    """

    def __init__(self):
        """Initialize BaseValueFormatError with format requirements message.

        Args:
            None

        Raises:
            None
        """
        # Specify the exact format required for base values
        # This helps developers understand the expected structure
        super().__init__("Base value must be a dict with 'type' and 'price' keys")


class NpmNotFoundError(ConfigurationError):
    """Raised when NPM is not found in the system PATH.

    Building the frontend assets requires Node.js and NPM to be installed.
    This exception is raised when attempting to build frontend assets but
    NPM cannot be found in the system PATH.

    Example:
        ```python
        import shutil

        if not shutil.which("npm"):
            raise NpmNotFoundError()
        ```
    """

    def __init__(self):
        """Initialize NpmNotFoundError with installation guidance.

        Args:
            None

        Raises:
            None
        """
        # Provide helpful message with installation instructions
        # This guides users to install the required Node.js/NPM dependency
        message = (
            "NPM not found in system PATH. "
            "Please install Node.js and NPM to build frontend assets."
        )
        super().__init__(message)


class CliNotFoundError(ConfigurationError):
    """Raised when the CLI command is not found in the system PATH.

    This exception occurs when attempting to run CLI commands but the
    streamlit-lightweight-charts-pro CLI is not available in the system PATH.
    This typically indicates an installation issue.

    Example:
        ```python
        import shutil

        if not shutil.which("streamlit-lightweight-charts-pro"):
            raise CliNotFoundError()
        ```
    """

    def __init__(self):
        """Initialize CliNotFoundError with installation check guidance.

        Args:
            None

        Raises:
            None
        """
        # Provide message directing user to verify installation
        # This helps diagnose and resolve CLI availability issues
        message = "CLI not found in system PATH. Please ensure the package is properly installed."
        super().__init__(message)


# Export all exception classes for external use
# Organized alphabetically for easy reference and maintenance
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
