"""
Data classes and utilities for Streamlit Lightweight Charts Pro.

This module provides the base data class and utility functions for time format conversion
used throughout the library for representing financial data points. The Data class serves
as the foundation for all chart data structures, providing standardized serialization
and time normalization capabilities.

The module includes:
    - Data: Abstract base class for all chart data points
    - classproperty: Descriptor for creating class-level properties
    - Column management utilities for DataFrame conversion
    - Time normalization and serialization utilities

Key Features:
    - Automatic time normalization to UNIX timestamps
    - CamelCase serialization for frontend communication
    - NaN handling and NumPy type conversion
    - Column management for DataFrame operations
    - Enum value extraction for serialization

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.data import Data
    from dataclasses import dataclass

    @dataclass
    class MyData(Data):
        value: float

    # Create data point with automatic time normalization
    data = MyData(time="2024-01-01T00:00:00", value=100.0)

    # Serialize to frontend format
    serialized = data.asdict()  # {'time': 1704067200, 'value': 100.0}
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

import math
from abc import ABC
from dataclasses import dataclass, fields
from enum import Enum
from typing import Dict

from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames
from streamlit_lightweight_charts_pro.utils.data_utils import normalize_time, snake_to_camel

logger = get_logger(__name__)

# The following disables are for custom class property pattern, which pylint does not recognize.
# pylint: disable=no-self-argument, no-member, invalid-name
# Note: 'classproperty' intentionally uses snake_case for compatibility with Python conventions.


class classproperty(property):
    """
    Descriptor to create class-level properties.

    This class provides a way to define properties that work at the class level
    rather than the instance level. It's used for accessing class attributes
    that may be computed or inherited from parent classes.

    This pattern is correct, but pylint may not recognize it and will warn about missing 'self'.

    Example:
        ```python
        class MyClass:
            @classproperty
            def required_columns(cls):
                return {"time", "value"}

        # Usage
        columns = MyClass.required_columns
        ```
    """

    def __get__(self, obj, cls):
        """
        Get the class property value.

        Args:
            obj: The instance (unused for class properties).
            cls: The class object.

        Returns:
            The computed class property value.
        """
        return self.fget(cls)


@dataclass
class Data(ABC):
    """
    Abstract base class for chart data points.

    All chart data classes should inherit from Data. This class provides the foundation
    for all data structures in the library, handling time normalization, serialization,
    and column management for DataFrame operations.

    The class automatically normalizes time values to UNIX timestamps and provides
    standardized serialization to camelCase dictionaries for frontend communication.
    It also manages required and optional columns for DataFrame conversion operations.

    Attributes:
        time (int): UNIX timestamp in seconds representing the data point time.
            This value is automatically normalized during initialization.

    Class Attributes:
        REQUIRED_COLUMNS (set): Set of required column names for DataFrame conversion.
        OPTIONAL_COLUMNS (set): Set of optional column names for DataFrame conversion.

    See also:
        LineData: Single value data points for line charts.
        OhlcData: OHLC data points for candlestick charts.
        OhlcvData: OHLCV data points with volume information.

    Example:
        ```python
        from dataclasses import dataclass
        from streamlit_lightweight_charts_pro.data import Data

        @dataclass
        class MyData(Data):
            value: float

        # Create data point
        data = MyData(time="2024-01-01T00:00:00", value=100.0)

        # Serialize for frontend
        serialized = data.asdict()
        ```

    Note:
        - All imports must be at the top of the file unless justified.
        - Use specific exceptions and lazy string formatting for logging.
        - Time values are automatically normalized to seconds.
        - NaN values are converted to 0.0 for frontend compatibility.
    """

    REQUIRED_COLUMNS = {"time"}  # Required columns for DataFrame conversion
    OPTIONAL_COLUMNS = set()  # Optional columns for DataFrame conversion

    time: int

    @classproperty
    def required_columns(cls):  # pylint: disable=no-self-argument
        """
        Return the union of all REQUIRED_COLUMNS from the class and its parents.

        This method traverses the class hierarchy to collect all required columns
        defined in REQUIRED_COLUMNS class attributes. It ensures that all required
        columns from parent classes are included in the result.

        Returns:
            set: All required columns from the class hierarchy.

        Example:
            ```python
            class ParentData(Data):
                REQUIRED_COLUMNS = {"time", "value"}

            class ChildData(ParentData):
                REQUIRED_COLUMNS = {"time", "volume"}

            # Returns {"time", "value", "volume"}
            columns = ChildData.required_columns
            ```
        """
        required = set()
        for base in cls.__mro__:  # pylint: disable=no-member
            if hasattr(base, "REQUIRED_COLUMNS"):
                required |= getattr(base, "REQUIRED_COLUMNS")
        return required

    @classproperty
    def optional_columns(cls):  # pylint: disable=no-self-argument
        """
        Return the union of all OPTIONAL_COLUMNS from the class and its parents.

        This method traverses the class hierarchy to collect all optional columns
        defined in OPTIONAL_COLUMNS class attributes. It ensures that all optional
        columns from parent classes are included in the result.

        Returns:
            set: All optional columns from the class hierarchy.

        Example:
            ```python
            class ParentData(Data):
                OPTIONAL_COLUMNS = {"color"}

            class ChildData(ParentData):
                OPTIONAL_COLUMNS = {"size"}

            # Returns {"color", "size"}
            columns = ChildData.optional_columns
            ```
        """
        optional = set()
        for base in cls.__mro__:  # pylint: disable=no-member
            if hasattr(base, "OPTIONAL_COLUMNS"):
                optional |= getattr(base, "OPTIONAL_COLUMNS")
        return optional

    def __post_init__(self):
        """
        Post-initialization processing to normalize time values.

        This method is automatically called after the dataclass is initialized.
        It normalizes the time value to ensure consistent format across all
        data points in the library.

        The normalization process converts various time formats (strings,
        datetime objects, etc.) to UNIX timestamps in seconds.
        """
        # Normalize time to ensure consistent format
        self.time = normalize_time(self.time)

    def asdict(self) -> Dict[str, object]:
        """
        Serialize the data class to a dict with camelCase keys for frontend.

        Converts the data point to a dictionary format suitable for frontend
        communication. This method handles various data type conversions and
        ensures proper formatting for JavaScript consumption.

        The method performs the following transformations:
        - Converts field names from snake_case to camelCase
        - Normalizes time values to UNIX timestamps
        - Converts NaN values to 0.0 for frontend compatibility
        - Converts NumPy scalar types to Python native types
        - Extracts enum values using their .value property
        - Skips None values and empty strings

        Returns:
            Dict[str, object]: Serialized data with camelCase keys ready for
                frontend consumption.

        Example:
            ```python
            @dataclass
            class MyData(Data):
                value: float
                color: str = "red"

            data = MyData(time="2024-01-01T00:00:00", value=100.0, color="blue")
            result = data.asdict()
            # Returns: {'time': 1704067200, 'value': 100.0, 'color': 'blue'}
            ```

        Note:
            - NaN values are converted to 0.0
            - NumPy scalar types are converted to Python native types
            - Enum values are extracted using their .value property
            - Time column uses standardized ColumnNames.TIME.value
        """
        result = {}
        for f in fields(self):
            name = f.name
            value = getattr(self, name)
            # Skip None values and empty strings
            if value is None or value == "":
                continue
            # Handle NaN for floats
            if isinstance(value, float) and math.isnan(value):
                value = 0.0
            # Convert NumPy types to Python native types for JSON serialization
            if hasattr(value, "item"):  # NumPy scalar types
                value = value.item()
            # Convert enums to their values
            if isinstance(value, Enum):
                value = value.value
            # Use enum value for known columns
            if name == "time":
                key = ColumnNames.TIME.value
            elif name == "value":
                key = ColumnNames.VALUE.value
            else:
                key = snake_to_camel(name)
            result[key] = value
        return result
