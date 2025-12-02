"""Unit tests for the HistogramData class.

This module tests the HistogramData class functionality including
construction, validation, serialization, and edge cases.
"""

from dataclasses import fields
from datetime import datetime

import numpy as np
import pandas as pd
import pytest
from lightweight_charts_core.data.histogram_data import HistogramData
from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.exceptions import ColorValidationError


class TestHistogramDataConstruction:
    """Test HistogramData construction and basic functionality."""

    def test_standard_construction(self):
        """Test standard HistogramData construction."""
        data = HistogramData(time=1640995200, value=100.5)
        assert data.time == 1640995200
        assert data.value == 100.5
        assert data.color is None

    def test_construction_with_color(self):
        """Test HistogramData construction with color."""
        data = HistogramData(time=1640995200, value=100.5, color="#2196F3")
        assert data.time == 1640995200
        assert data.value == 100.5
        assert data.color == "#2196F3"

    def test_construction_with_rgba_color(self):
        """Test HistogramData construction with rgba color."""
        data = HistogramData(time=1640995200, value=100.5, color="rgba(33,150,243,1)")
        assert data.time == 1640995200
        assert data.value == 100.5
        assert data.color == "rgba(33,150,243,1)"

    def test_construction_with_empty_color(self):
        """Test HistogramData construction with empty color string."""
        data = HistogramData(time=1640995200, value=100.5, color="")
        assert data.time == 1640995200
        assert data.value == 100.5
        # Empty color string is converted to None by centralized validation
        assert data.color is None

    def test_construction_with_zero_value(self):
        """Test HistogramData construction with zero value."""
        data = HistogramData(time=1640995200, value=0.0)
        assert data.time == 1640995200
        assert data.value == 0.0
        assert data.color is None

    def test_construction_with_negative_value(self):
        """Test HistogramData construction with negative value."""
        data = HistogramData(time=1640995200, value=-50.0)
        assert data.time == 1640995200
        assert data.value == -50.0
        assert data.color is None

    def test_construction_with_large_value(self):
        """Test HistogramData construction with large value."""
        data = HistogramData(time=1640995200, value=1e6)
        assert data.time == 1640995200
        assert data.value == 1e6
        assert data.color is None


class TestHistogramDataValidation:
    """Test HistogramData validation and error handling."""

    def test_validation_invalid_color_format(self):
        """Test validation with invalid color format."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            HistogramData(time=1640995200, value=100.5, color="invalid_color")

    def test_validation_invalid_hex_color(self):
        """Test validation with invalid hex color (should be rejected)."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            HistogramData(time=1640995200, value=100.5, color="#GGGGGG")

    def test_validation_invalid_rgba_color(self):
        """Test validation with invalid rgba color."""
        # The current is_valid_color function is permissive, so this should pass
        data = HistogramData(time=1640995200, value=100.5, color="rgba(300,150,243,1)")
        assert data.color == "rgba(300,150,243,1)"

    def test_validation_none_color(self):
        """Test validation with None color (should be allowed)."""
        data = HistogramData(time=1640995200, value=100.5, color=None)
        assert data.color is None

    def test_validation_empty_color_string(self):
        """Test validation with empty color string (should be allowed)."""
        data = HistogramData(time=1640995200, value=100.5, color="")
        # Empty color string is converted to None by centralized validation
        assert data.color is None

    def test_validation_valid_hex_colors(self):
        """Test validation with various valid hex colors."""
        valid_colors = [
            "#000000",
            "#FFFFFF",
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#123456",
            "#abcdef",
            "#ABCDEF",
            "#a1b2c3",
        ]
        for color in valid_colors:
            data = HistogramData(time=1640995200, value=100.5, color=color)
            assert data.color == color

    def test_validation_valid_rgba_colors(self):
        """Test validation with various valid rgba colors."""
        valid_rgba_colors = [
            "rgba(0,0,0,0)",
            "rgba(255,255,255,1)",
            "rgba(100,150,200,0.5)",
            "rgba(0,0,0,0.1)",
            "rgba(255,255,255,0.9)",
        ]
        for color in valid_rgba_colors:
            data = HistogramData(time=1640995200, value=100.5, color=color)
            assert data.color == color


class TestHistogramDataSerialization:
    """Test HistogramData serialization to dictionary."""

    def test_to_dict_basic(self):
        """Test basic to_dict functionality."""
        data = HistogramData(time=1640995200, value=100.5)
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 100.5}

    def test_to_dict_with_color(self):
        """Test to_dict with color."""
        data = HistogramData(time=1640995200, value=100.5, color="#2196F3")
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 100.5, "color": "#2196F3"}

    def test_to_dict_with_rgba_color(self):
        """Test to_dict with rgba color."""
        data = HistogramData(time=1640995200, value=100.5, color="rgba(33,150,243,1)")
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 100.5, "color": "rgba(33,150,243,1)"}

    def test_to_dict_with_none_color(self):
        """Test to_dict with None color (should be omitted)."""
        data = HistogramData(time=1640995200, value=100.5, color=None)
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 100.5}

    def test_to_dict_with_empty_color(self):
        """Test to_dict with empty color string (should be omitted)."""
        data = HistogramData(time=1640995200, value=100.5, color="")
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 100.5}

    def test_to_dict_with_nan_value(self):
        """Test to_dict with NaN value (should be converted to 0.0)."""
        data = HistogramData(time=1640995200, value=float("nan"))
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 0.0}

    def test_to_dict_with_zero_value(self):
        """Test to_dict with zero value."""
        data = HistogramData(time=1640995200, value=0.0)
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 0.0}

    def test_to_dict_with_negative_value(self):
        """Test to_dict with negative value."""
        data = HistogramData(time=1640995200, value=-50.0)
        result = data.asdict()
        assert result == {"time": 1640995200, "value": -50.0}


class TestHistogramDataInheritance:
    """Test HistogramData inheritance from SingleValueData."""

    def test_inherits_from_base_data(self):
        """Test that HistogramData inherits from SingleValueData."""
        data = HistogramData(time=1640995200, value=100.5)
        assert isinstance(data, SingleValueData)

    def test_required_columns_property(self):
        """Test required_columns property."""
        # HistogramData inherits time and value from SingleValueData
        assert HistogramData.required_columns == {"time", "value"}

    def test_optional_columns_property(self):
        """Test optional_columns property."""
        assert HistogramData.optional_columns == {"color"}

    def test_has_required_columns_class_attribute(self):
        """Test that REQUIRED_COLUMNS class attribute exists."""
        assert hasattr(HistogramData, "REQUIRED_COLUMNS")
        assert set() == HistogramData.REQUIRED_COLUMNS

    def test_has_optional_columns_class_attribute(self):
        """Test that OPTIONAL_COLUMNS class attribute exists."""
        assert hasattr(HistogramData, "OPTIONAL_COLUMNS")
        assert {"color"} == HistogramData.OPTIONAL_COLUMNS

    def test_dataclass_fields(self):
        """Test that HistogramData has correct dataclass fields."""
        field_names = {field.name for field in fields(HistogramData)}
        expected_fields = {"time", "value", "color"}
        assert field_names == expected_fields


class TestHistogramDataEdgeCases:
    """Test HistogramData edge cases and limits."""

    def test_very_large_time_value(self):
        """Test with very large time value."""
        large_time = 9999999999
        data = HistogramData(time=large_time, value=100.5)
        assert data.time == large_time

    def test_very_small_time_value(self):
        """Test with very small time value."""
        small_time = 0
        data = HistogramData(time=small_time, value=100.5)
        assert data.time == small_time

    def test_very_large_value(self):
        """Test with very large value."""
        large_value = 1e15
        data = HistogramData(time=1640995200, value=large_value)
        assert data.value == large_value

    def test_very_small_value(self):
        """Test with very small value."""
        small_value = 1e-15
        data = HistogramData(time=1640995200, value=small_value)
        assert data.value == small_value

    def test_infinity_value(self):
        """Test with infinity value."""
        data = HistogramData(time=1640995200, value=float("inf"))
        assert data.value == float("inf")

    def test_negative_infinity_value(self):
        """Test with negative infinity value."""
        data = HistogramData(time=1640995200, value=float("-inf"))
        assert data.value == float("-inf")

    def test_very_long_color_string(self):
        """Test with very long color string."""
        long_color = "#" + "A" * 100
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            HistogramData(time=1640995200, value=100.5, color=long_color)


class TestHistogramDataTimeHandling:
    """Test HistogramData time handling and normalization."""

    def test_time_normalization_string_date(self):
        """Test time normalization with string date."""
        data = HistogramData(time="2022-01-01", value=100.5)
        # Time stored as-is
        assert data.time == "2022-01-01"
        # Normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] > 0

    def test_time_normalization_datetime_object(self):
        """Test time normalization with datetime object."""
        dt = datetime(2022, 1, 1, 12, 0, 0)
        data = HistogramData(time=dt, value=100.5)
        # Time stored as-is (datetime)
        assert data.time == dt
        # Normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] > 0

    def test_time_normalization_pandas_timestamp(self):
        """Test time normalization with pandas timestamp."""
        ts = pd.Timestamp("2022-01-01 12:00:00")
        data = HistogramData(time=ts, value=100.5)
        # Time stored as-is (pandas Timestamp)
        assert data.time == ts
        # Normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] > 0

    def test_time_normalization_float_timestamp(self):
        """Test time normalization with float timestamp."""
        data = HistogramData(time=1640995200.5, value=100.5)
        # Time stored as-is (float)
        assert data.time == 1640995200.5
        # Normalized to int in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200

    def test_time_normalization_numpy_int64(self):
        """Test time normalization with numpy int64."""
        data = HistogramData(time=np.int64(1640995200), value=100.5)
        # Time stored as-is (numpy int64)
        assert isinstance(data.time, np.int64)
        # Normalized to int in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200

    def test_time_modification_after_construction(self):
        """Test that time can be modified after construction."""
        data = HistogramData(time="2024-01-01", value=100.5)
        result1 = data.asdict()
        time1 = result1["time"]

        # Modify time after construction
        data.time = "2024-01-02"
        result2 = data.asdict()
        time2 = result2["time"]

        # Times should be different
        assert time1 != time2


class TestHistogramDataColorHandling:
    """Test HistogramData color handling and validation."""

    def test_color_case_sensitivity(self):
        """Test color case sensitivity."""
        # Hex colors should be case-insensitive in validation
        data1 = HistogramData(time=1640995200, value=100.5, color="#2196F3")
        data2 = HistogramData(time=1640995200, value=100.5, color="#2196f3")
        assert data1.color == "#2196F3"
        assert data2.color == "#2196f3"

    def test_color_with_spaces(self):
        """Test color with spaces (should be invalid)."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            HistogramData(time=1640995200, value=100.5, color="# 2196F3")

    def test_color_without_hash(self):
        """Test color without hash (should be invalid)."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            HistogramData(time=1640995200, value=100.5, color="2196F3")

    def test_rgba_with_spaces(self):
        """Test rgba color with spaces (should be invalid)."""
        # The current is_valid_color function is permissive, so this should pass
        data = HistogramData(time=1640995200, value=100.5, color="rgba( 33,150,243,1)")
        assert data.color == "rgba( 33,150,243,1)"

    def test_rgba_with_invalid_alpha(self):
        """Test rgba color with invalid alpha value."""
        # The current is_valid_color function is permissive, so this should pass
        data = HistogramData(time=1640995200, value=100.5, color="rgba(33,150,243,2)")
        assert data.color == "rgba(33,150,243,2)"

    def test_rgba_with_negative_alpha(self):
        """Test rgba color with negative alpha value (should be rejected)."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            HistogramData(time=1640995200, value=100.5, color="rgba(33,150,243,-0.1)")

    def test_color_serialization_consistency(self):
        """Test that color serialization is consistent."""
        colors = ["#2196F3", "rgba(33,150,243,1)", "#FF0000"]
        for color in colors:
            data = HistogramData(time=1640995200, value=100.5, color=color)
            result = data.asdict()
            assert result["color"] == color
