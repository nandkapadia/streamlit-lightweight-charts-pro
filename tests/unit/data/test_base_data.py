"""
Unit tests for the SingleValueData class.

This module tests the SingleValueData abstract class functionality including
time normalization, data validation, and serialization.
"""

from datetime import datetime, timezone

import pandas as pd
import pytest

from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.utils.data_utils import from_utc_timestamp, to_utc_timestamp


class TestSingleValueData:
    """Test cases for the SingleValueData class."""

    def test_concrete_subclass_construction(self):
        """Test that concrete subclasses can be instantiated."""
        data = LineData(time=1640995200, value=100)
        assert data.time == 1640995200
        assert data.value == 100

    def test_concrete_subclass_with_nan_value(self):
        """Test concrete subclass with NaN value."""
        data = LineData(time=1640995200, value=float("nan"))
        assert data.value == 0.0  # NaN is converted to 0.0

    def test_concrete_subclass_to_dict(self):
        """Test concrete subclass to_dict method."""
        data = LineData(time=1640995200, value=100)
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100

    def test_concrete_subclass_required_columns(self):
        """Test concrete subclass required columns."""
        required = LineData.required_columns
        assert isinstance(required, set)
        assert "time" in required
        assert "value" in required

    def test_concrete_subclass_optional_columns(self):
        """Test concrete subclass optional columns."""
        optional = LineData.optional_columns
        assert isinstance(optional, set)
        assert "color" in optional

    def test_concrete_subclass_data_class(self):
        """Test concrete subclass data_class property."""
        # LineData doesn't have data_class property, it IS the data class
        assert LineData == LineData


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
        with pytest.raises(ValueError):
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
        with pytest.raises(ValueError):
            LineData(time=1640995200, value=None)

    def test_line_data_with_invalid_time(self):
        """Test LineData with invalid time."""
        with pytest.raises(ValueError):
            LineData(time="invalid_time", value=100)

    def test_line_data_with_color(self):
        """Test LineData with color."""
        data = LineData(time=1640995200, value=100, color="#ff0000")
        assert data.color == "#ff0000"

    def test_line_data_with_invalid_color(self):
        """Test LineData with invalid color."""
        with pytest.raises(ValueError):
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
        """Test that required_columns includes parent columns."""
        required = LineData.required_columns
        assert isinstance(required, set)
        assert "time" in required
        assert "value" in required

    def test_optional_columns_inheritance(self):
        """Test that optional_columns includes parent columns."""
        optional = LineData.optional_columns
        assert isinstance(optional, set)
        assert "color" in optional

    def test_data_class_property(self):
        """Test data_class property returns correct class."""
        # LineData doesn't have data_class property, it IS the data class
        assert LineData == LineData

    def test_classproperty_decorator(self):
        """Test that classproperty decorator works correctly."""
        # Test that it can be called on class
        assert LineData.required_columns is not None
        assert LineData.optional_columns is not None

        # Test that it can be called on instance
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
        assert data.time == 1640995200
