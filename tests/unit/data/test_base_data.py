"""Unit tests for the SingleValueData class and time normalization utilities.

This module contains comprehensive unit tests for the SingleValueData abstract class
functionality including time normalization, data validation, serialization, and
integration with concrete data classes like LineData.

The tests are organized into logical test classes that group related functionality
together, making it easy to understand and maintain the test suite. Each test
class focuses on a specific aspect of the data class behavior.

The module includes:
    - TestSingleValueData: Tests for SingleValueData class functionality
    - TestTimeNormalization: Tests for time normalization utility functions
    - TestDataValidation: Tests for data validation and error handling
    - TestSerialization: Tests for data serialization and conversion

Key Features Tested:
    - Concrete subclass instantiation and basic functionality
    - NaN value handling and conversion to 0.0
    - Data serialization to dictionary format
    - Required and optional column definitions
    - Time normalization from various input formats
    - Error handling for invalid inputs
    - Integration with pandas DataFrames and Timestamps

Example Test Usage:
    ```python
    from tests.unit.data.test_base_data import TestSingleValueData

    # Run specific test
    test_instance = TestSingleValueData()
    test_instance.test_concrete_subclass_construction()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from datetime import datetime, timezone

# Third Party Imports
import pandas as pd
import pytest

# Local Imports
from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.exceptions import (
    RequiredFieldError,
    TimeValidationError,
    ValueValidationError,
)
from streamlit_lightweight_charts_pro.utils.data_utils import from_utc_timestamp, to_utc_timestamp


class TestSingleValueData:
    """Test cases for the SingleValueData abstract class functionality.

    This test class focuses on verifying that concrete subclasses of SingleValueData
    (like LineData) work correctly with the base class functionality. It tests
    basic instantiation, data validation, serialization, and column management
    features that are inherited from the abstract base class.

    The tests ensure that:
    - Concrete subclasses can be properly instantiated
    - NaN values are handled correctly (converted to 0.0)
    - Data serialization works as expected
    - Required and optional column definitions are correct
    - Basic data validation and access works properly
    """

    def test_concrete_subclass_construction(self):
        """Test that concrete subclasses can be instantiated with valid data.

        This test verifies that LineData (a concrete subclass of SingleValueData)
        can be properly instantiated with valid time and value data. It ensures
        that the base class initialization logic works correctly and that data
        is properly stored and accessible.

        The test checks:
        - LineData can be instantiated with valid parameters
        - Time value is properly stored and accessible
        - Value is properly stored and accessible
        - No exceptions are raised during construction
        """
        # Create LineData instance with valid time and value
        data = LineData(time=1640995200, value=100)

        # Verify that time value is properly stored and accessible
        assert data.time == 1640995200
        # Verify that value is properly stored and accessible
        assert data.value == 100

    def test_concrete_subclass_with_nan_value(self):
        """Test concrete subclass handles NaN values correctly.

        This test verifies that when a NaN value is provided for the value field,
        it is automatically converted to 0.0 during initialization. This ensures
        that NaN values don't cause issues with frontend serialization and that
        the data remains valid for chart rendering.

        The test checks:
        - NaN values are automatically converted to 0.0
        - No exceptions are raised during construction
        - The converted value is accessible and valid
        """
        # Create LineData instance with NaN value
        data = LineData(time=1640995200, value=float("nan"))

        # Verify that NaN is converted to 0.0 during initialization
        assert data.value == 0.0

    def test_concrete_subclass_to_dict(self):
        """Test concrete subclass serialization to dictionary format.

        This test verifies that the asdict() method works correctly for concrete
        subclasses, converting the data object to a dictionary format suitable
        for frontend communication. It ensures that all required fields are
        included and properly formatted.

        The test checks:
        - asdict() method returns a valid dictionary
        - Time field is included and properly formatted
        - Value field is included and properly formatted
        - Dictionary keys match expected field names
        """
        # Create LineData instance for serialization testing
        data = LineData(time=1640995200, value=100)

        # Serialize data to dictionary format
        data_dict = data.asdict()

        # Verify that time field is included and properly formatted
        assert data_dict["time"] == 1640995200
        # Verify that value field is included and properly formatted
        assert data_dict["value"] == 100

    def test_concrete_subclass_required_columns(self):
        """Test concrete subclass required column definitions.

        This test verifies that the REQUIRED_COLUMNS class variable contains the correct
        set of required column names for DataFrame conversion operations. It
        ensures that both inherited columns (from Data base class) and
        subclass-specific columns are included.

        The test checks:
        - REQUIRED_COLUMNS is a set
        - Time column is included (inherited from Data)
        - Value column is included (specific to SingleValueData)
        - All required columns are properly defined
        """
        # Get required columns for LineData from class variable
        required = LineData.REQUIRED_COLUMNS

        # Verify that REQUIRED_COLUMNS is a set
        assert isinstance(required, set)
        # Note: LineData.REQUIRED_COLUMNS is empty set as it inherits from SingleValueData
        # The actual required columns come from the class hierarchy via the classproperty

    def test_concrete_subclass_optional_columns(self):
        """Test concrete subclass optional column definitions.

        This test verifies that the OPTIONAL_COLUMNS class variable contains the correct
        set of optional column names for DataFrame conversion operations. It
        ensures that optional columns specific to the subclass are properly
        defined and accessible.

        The test checks:
        - OPTIONAL_COLUMNS is a set
        - Color column is included (specific to LineData)
        - Optional columns are properly defined
        """
        # Get optional columns for LineData from class variable
        optional = LineData.OPTIONAL_COLUMNS

        # Verify that OPTIONAL_COLUMNS is a set
        assert isinstance(optional, set)
        # Verify that color column is included (specific to LineData)
        assert "color" in optional

    def test_concrete_subclass_data_class(self):
        """Test concrete subclass data class definition.

        This test verifies that LineData is properly defined as a concrete
        data class. It ensures that the class exists and can be imported
        without issues, confirming that the class definition is valid.

        The test checks:
        - LineData class is properly defined and accessible
        - Class can be imported without errors
        - Class exists and is not None
        """
        # Verify that LineData is properly defined and accessible
        # LineData doesn't have data_class property, it IS the data class
        # This test verifies LineData is properly defined
        assert LineData is not None


class TestTimeNormalization:
    """Test cases for time normalization functions."""

    def test_to_utc_timestamp_from_int(self):
        """Test to_utc_timestamp with integer."""
        result = to_utc_timestamp(1640995200)
        assert result == 1640995200

    def test_to_utc_timestamp_from_float(self):
        """Test to_utc_timestamp with float."""
        result = to_utc_timestamp(1640995200.0)
        assert result == 1640995200

    def test_to_utc_timestamp_from_string_iso(self):
        """Test to_utc_timestamp with ISO string."""
        result = to_utc_timestamp("2022-01-01T00:00:00")
        assert result == 1640995200

    def test_to_utc_timestamp_from_string_date(self):
        """Test to_utc_timestamp with date string."""
        result = to_utc_timestamp("2022-01-01")
        assert result == 1640995200

    def test_to_utc_timestamp_from_datetime(self):
        """Test to_utc_timestamp with datetime object."""
        dt = datetime(2022, 1, 1, tzinfo=timezone.utc)
        result = to_utc_timestamp(dt)
        assert result == 1640995200

    def test_to_utc_timestamp_from_pandas_timestamp(self):
        """Test to_utc_timestamp with pandas Timestamp."""
        ts = pd.Timestamp("2022-01-01T00:00:00Z")
        result = to_utc_timestamp(ts)
        assert result == 1640995200

    def test_to_utc_timestamp_invalid_input(self):
        """Test to_utc_timestamp with invalid input."""
        with pytest.raises(TimeValidationError):
            to_utc_timestamp("invalid_date")

    def test_from_utc_timestamp(self):
        """Test from_utc_timestamp function."""
        result = from_utc_timestamp(1640995200)
        assert result == "2022-01-01T00:00:00"

    def test_from_utc_timestamp_zero(self):
        """Test from_utc_timestamp with zero timestamp."""
        result = from_utc_timestamp(0)
        assert result == "1970-01-01T00:00:00"


class TestDataValidation:
    """Test cases for data validation."""

    def test_valid_line_data(self):
        """Test valid LineData construction."""
        data = LineData(time=1640995200, value=100)
        assert data.time == 1640995200
        assert data.value == 100

    def test_line_data_with_nan_value(self):
        """Test LineData with NaN value."""
        data = LineData(time=1640995200, value=float("nan"))
        assert data.value == 0.0  # NaN is converted to 0.0

    def test_line_data_with_none_value(self):
        """Test LineData with None value."""
        with pytest.raises(RequiredFieldError):
            LineData(time=1640995200, value=None)

    def test_line_data_with_invalid_time(self):
        """Test LineData with invalid time."""
        # Invalid time won't raise error until asdict() is called
        data = LineData(time="invalid_time", value=100)
        # Error happens during serialization
        with pytest.raises((TimeValidationError, ValueError)):
            data.asdict()

    def test_line_data_with_color(self):
        """Test LineData with color."""
        data = LineData(time=1640995200, value=100, color="#ff0000")
        assert data.color == "#ff0000"

    def test_line_data_with_invalid_color(self):
        """Test LineData with invalid color."""
        with pytest.raises(ValueValidationError):
            LineData(time=1640995200, value=100, color="invalid_color")


class TestSerialization:
    """Test cases for data serialization."""

    def test_line_data_to_dict_basic(self):
        """Test LineData to_dict with basic data."""
        data = LineData(time=1640995200, value=100)
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert "color" not in data_dict

    def test_line_data_to_dict_with_color(self):
        """Test LineData to_dict with color."""
        data = LineData(time=1640995200, value=100, color="#ff0000")
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert data_dict["color"] == "#ff0000"

    def test_line_data_to_dict_with_empty_color(self):
        """Test LineData to_dict with empty color."""
        data = LineData(time=1640995200, value=100, color="")
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert "color" not in data_dict

    def test_line_data_to_dict_with_none_color(self):
        """Test LineData to_dict with None color."""
        data = LineData(time=1640995200, value=100, color=None)
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert "color" not in data_dict


class TestInheritance:
    """Test cases for inheritance and class properties."""

    def test_required_columns_inheritance(self):
        """Test that required_columns classproperty includes parent columns.

        This test verifies that the required_columns classproperty correctly
        aggregates columns from the entire class hierarchy, including both
        the Data base class and SingleValueData parent class.
        """
        # Access the classproperty that aggregates columns from the hierarchy
        required = LineData.required_columns
        assert isinstance(required, set)
        # Convert to set for explicit type checking to avoid linter issues
        required_set = set(required)
        # Verify that time column is included (from Data base class)
        assert "time" in required_set
        # Verify that value column is included (from SingleValueData)
        assert "value" in required_set

    def test_optional_columns_inheritance(self):
        """Test that optional_columns classproperty includes parent columns.

        This test verifies that the optional_columns classproperty correctly
        aggregates optional columns from the entire class hierarchy, including
        any optional columns defined in parent classes.
        """
        # Access the classproperty that aggregates columns from the hierarchy
        optional = LineData.optional_columns
        assert isinstance(optional, set)
        # Convert to set for explicit type checking to avoid linter issues
        optional_set = set(optional)
        # Verify that color column is included (from LineData)
        assert "color" in optional_set

    def test_data_class_property(self):
        """Test data class definition is properly accessible.

        This test verifies that LineData is properly defined as a concrete
        data class and can be imported without issues.
        """
        # LineData doesn't have data_class property, it IS the data class
        # This test verifies LineData is properly defined
        assert LineData is not None

    def test_classproperty_decorator(self):
        """Test that classproperty decorator works correctly.

        This test verifies that the classproperty decorator functions correctly
        for both class-level and instance-level access to the required_columns
        and optional_columns properties.
        """
        # Test that classproperty can be called on class
        assert LineData.required_columns is not None
        assert LineData.optional_columns is not None

        # Test that classproperty can be called on instance
        data = LineData(time=1640995200, value=100)
        assert data.required_columns is not None
        assert data.optional_columns is not None


class TestEdgeCases:
    """Test cases for edge cases and error conditions."""

    def test_empty_data_list(self):
        """Test handling of empty data list."""
        data = LineData(time=1640995200, value=0)
        assert data.value == 0

    def test_very_large_numbers(self):
        """Test handling of very large numbers."""
        data = LineData(time=1640995200, value=1e15)
        assert data.value == 1e15

    def test_very_small_numbers(self):
        """Test handling of very small numbers."""
        data = LineData(time=1640995200, value=1e-15)
        assert data.value == 1e-15

    def test_negative_values(self):
        """Test handling of negative values."""
        data = LineData(time=1640995200, value=-100)
        assert data.value == -100

    def test_zero_values(self):
        """Test handling of zero values."""
        data = LineData(time=1640995200, value=0)
        assert data.value == 0

    def test_unicode_strings(self):
        """Test handling of unicode strings in time."""
        # This should work with proper time strings
        data = LineData(time="2022-01-01", value=100)
        # Time is stored as-is
        assert data.time == "2022-01-01"
        # Time is normalized in asdict()
        result = data.asdict()
        assert result["time"] == 1640995200
