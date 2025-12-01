"""Data classes and utilities for Streamlit Lightweight Charts Pro.

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
    from lightweight_charts_core.data import Data
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

from abc import ABC
from dataclasses import dataclass
from typing import Any, ClassVar

from lightweight_charts_core.type_definitions import ColumnNames
from lightweight_charts_core.utils.data_utils import normalize_time
from lightweight_charts_core.utils.serialization import SerializableMixin

# The following disables are for custom class property pattern, which pylint does not recognize.
# pylint: disable=no-self-argument, no-member, invalid-name
# Note: 'classproperty' intentionally uses snake_case for compatibility with Python conventions.


class classproperty(property):  # noqa: N801
    """Descriptor to create class-level properties.

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
        """Get the class property value.

        Args:
            obj: The instance (unused for class properties).
            cls: The class object.

        Returns:
            The computed class property value.

        """
        return self.fget(cls)


@dataclass
class Data(SerializableMixin, ABC):
    """Abstract base class for chart data points.

    All chart data classes should inherit from Data. This class provides the foundation
    for all data structures in the library, handling time normalization, serialization,
    and column management for DataFrame operations.

    Time normalization happens during serialization (asdict()) rather than at construction,
    allowing users to modify time values after creating data objects. This provides
    flexibility while ensuring all serialized data uses consistent UTC timestamps.

    Attributes:
        time (Union[pd.Timestamp, datetime, str, int, float]): Time value in various
            formats. Converted to UTC timestamp during serialization.

    Class Attributes:
        REQUIRED_COLUMNS (set): Set of required column names for DataFrame conversion.
        OPTIONAL_COLUMNS (set): Set of optional column names for DataFrame conversion.

    See Also:
        LineData: Single value data points for line charts.
        OhlcData: OHLC data points for candlestick charts.
        OhlcvData: OHLCV data points with volume information.

    Example:
        ```python
        from dataclasses import dataclass
        from lightweight_charts_core.data import Data


        @dataclass
        class MyData(Data):
            value: float


        # Create data point
        data = MyData(time="2024-01-01T00:00:00", value=100.0)

        # Can modify time after construction
        data.time = "2024-01-02T00:00:00"

        # Serialize for frontend (time normalized here)
        serialized = data.asdict()  # {'time': <normalized_timestamp>, 'value': 100.0}
        ```

    Note:
        - All imports must be at the top of the file unless justified.
        - Use specific exceptions and lazy string formatting for logging.
        - Time values are normalized to UTC timestamps during serialization.
        - NaN values are converted to 0.0 for frontend compatibility.

    """

    REQUIRED_COLUMNS: ClassVar[set] = {"time"}  # Required columns for DataFrame conversion
    OPTIONAL_COLUMNS: ClassVar[set] = set()  # Optional columns for DataFrame conversion

    time: Any  # Accept any time format, normalize in asdict()

    @classproperty
    def required_columns(self):  # pylint: disable=no-self-argument
        """Return the union of all REQUIRED_COLUMNS from the class and its parents.

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
        for base in self.__mro__:  # pylint: disable=no-member
            if hasattr(base, "REQUIRED_COLUMNS"):
                required |= base.REQUIRED_COLUMNS
        return required

    @classproperty
    def optional_columns(self):  # pylint: disable=no-self-argument
        """Return the union of all OPTIONAL_COLUMNS from the class and its parents.

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
        for base in self.__mro__:  # pylint: disable=no-member
            if hasattr(base, "OPTIONAL_COLUMNS"):
                optional |= base.OPTIONAL_COLUMNS
        return optional

    def __post_init__(self):
        """Post-initialization processing.

        This method is automatically called after the dataclass is initialized.
        Time normalization is intentionally NOT done here to allow users to
        modify time values after construction. Normalization happens during
        serialization in asdict().

        Subclasses can override this method to add validation or processing.
        """
        # Time normalization happens in asdict() to allow post-construction modification
        # Subclasses may override this for additional processing

    def asdict(self) -> dict[str, Any]:
        """Serialize the data class to a dict with camelCase keys for frontend.

        Converts the data point to a dictionary format suitable for frontend
        communication. This method handles various data type conversions and
        ensures proper formatting for JavaScript consumption.

        Time normalization happens here (not in __post_init__) to allow users
        to modify time values after construction and have changes reflected
        in serialization.

        The method performs the following transformations:
        - Normalizes time values to UNIX timestamps (fresh conversion each call)
        - Converts field names from snake_case to camelCase
        - Converts NaN values to 0.0 for frontend compatibility
        - Converts NumPy scalar types to Python native types
        - Extracts enum values using their .value property
        - Skips None values and empty strings

        Returns:
            Dict[str, Any]: Serialized data with camelCase keys ready for
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

            # Can modify time after construction
            data.time = "2024-01-02T00:00:00"
            result2 = data.asdict()
            # Returns: {'time': 1704153600, 'value': 100.0, 'color': 'blue'}
            ```

        Note:
            - Time is normalized fresh each call (no caching)
            - NaN values are converted to 0.0
            - NumPy scalar types are converted to Python native types
            - Enum values are extracted using their .value property
            - Time column uses standardized ColumnNames.TIME.value

        """
        # Normalize time during serialization (not cached in __post_init__)
        normalized_time = normalize_time(self.time)

        # Use the inherited serialization from SerializableMixin
        result = dict(self._serialize_to_dict())

        # Override the time field with normalized value
        result[ColumnNames.TIME.value] = normalized_time

        return result
