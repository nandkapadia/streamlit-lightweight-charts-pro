"""Unit tests for the BaselineData class.

This module tests the BaselineData class functionality including
construction, validation, serialization, and edge cases.
"""

from dataclasses import fields
from datetime import datetime

import numpy as np
import pandas as pd
import pytest
from lightweight_charts_core.data.baseline_data import BaselineData
from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.exceptions import ColorValidationError


class TestBaselineDataConstruction:
    """Test BaselineData construction and basic functionality."""

    def test_standard_construction(self):
        """Test standard BaselineData construction."""
        data = BaselineData(time=1640995200, value=100.5)
        assert data.time == 1640995200
        assert data.value == 100.5
        assert data.top_fill_color1 is None
        assert data.top_fill_color2 is None
        assert data.top_line_color is None
        assert data.bottom_fill_color1 is None
        assert data.bottom_fill_color2 is None
        assert data.bottom_line_color is None

    def test_construction_with_top_colors(self):
        """Test BaselineData construction with top area colors."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1="#FF0000",
            top_fill_color2="#00FF00",
            top_line_color="#0000FF",
        )
        assert data.time == 1640995200
        assert data.value == 100.5
        assert data.top_fill_color1 == "#FF0000"
        assert data.top_fill_color2 == "#00FF00"
        assert data.top_line_color == "#0000FF"
        assert data.bottom_fill_color1 is None
        assert data.bottom_fill_color2 is None
        assert data.bottom_line_color is None

    def test_construction_with_bottom_colors(self):
        """Test BaselineData construction with bottom area colors."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            bottom_fill_color1="rgba(255,0,0,0.5)",
            bottom_fill_color2="rgba(0,255,0,0.5)",
            bottom_line_color="rgba(0,0,255,0.5)",
        )
        assert data.time == 1640995200
        assert data.value == 100.5
        assert data.top_fill_color1 is None
        assert data.top_fill_color2 is None
        assert data.top_line_color is None
        assert data.bottom_fill_color1 == "rgba(255,0,0,0.5)"
        assert data.bottom_fill_color2 == "rgba(0,255,0,0.5)"
        assert data.bottom_line_color == "rgba(0,0,255,0.5)"

    def test_construction_with_all_colors(self):
        """Test BaselineData construction with all color properties."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1="#FF0000",
            top_fill_color2="#00FF00",
            top_line_color="#0000FF",
            bottom_fill_color1="rgba(255,0,0,0.5)",
            bottom_fill_color2="rgba(0,255,0,0.5)",
            bottom_line_color="rgba(0,0,255,0.5)",
        )
        assert data.time == 1640995200
        assert data.value == 100.5
        assert data.top_fill_color1 == "#FF0000"
        assert data.top_fill_color2 == "#00FF00"
        assert data.top_line_color == "#0000FF"
        assert data.bottom_fill_color1 == "rgba(255,0,0,0.5)"
        assert data.bottom_fill_color2 == "rgba(0,255,0,0.5)"
        assert data.bottom_line_color == "rgba(0,0,255,0.5)"

    def test_construction_with_empty_colors(self):
        """Test BaselineData construction with empty color strings."""
        data = BaselineData(time=1640995200, value=100.5, top_fill_color1="", bottom_fill_color1="")
        assert data.time == 1640995200
        assert data.value == 100.5
        # Empty color strings are converted to None by centralized validation
        assert data.top_fill_color1 is None
        assert data.bottom_fill_color1 is None

    def test_construction_with_zero_value(self):
        """Test BaselineData construction with zero value."""
        data = BaselineData(time=1640995200, value=0.0)
        assert data.time == 1640995200
        assert data.value == 0.0

    def test_construction_with_negative_value(self):
        """Test BaselineData construction with negative value."""
        data = BaselineData(time=1640995200, value=-50.0)
        assert data.time == 1640995200
        assert data.value == -50.0

    def test_construction_with_large_value(self):
        """Test BaselineData construction with large value."""
        data = BaselineData(time=1640995200, value=1e6)
        assert data.time == 1640995200
        assert data.value == 1e6

    def test_construction_with_nan_value(self):
        """Test BaselineData construction with NaN value (should be converted to 0.0)."""
        data = BaselineData(time=1640995200, value=float("nan"))
        assert data.time == 1640995200
        assert data.value == 0.0

    def test_construction_with_infinity_value(self):
        """Test BaselineData construction with infinity value."""
        data = BaselineData(time=1640995200, value=float("inf"))
        assert data.time == 1640995200
        assert data.value == float("inf")

    def test_construction_with_negative_infinity_value(self):
        """Test BaselineData construction with negative infinity value."""
        data = BaselineData(time=1640995200, value=float("-inf"))
        assert data.time == 1640995200
        assert data.value == float("-inf")


class TestBaselineDataValidation:
    """Test BaselineData validation and error handling."""

    def test_validation_invalid_top_fill_color1(self):
        """Test validation with invalid top_fill_color1."""
        with pytest.raises(ColorValidationError, match="Invalid color format for top_fill_color1"):
            BaselineData(time=1640995200, value=100.5, top_fill_color1="invalid_color")

    def test_validation_invalid_top_fill_color2(self):
        """Test validation with invalid top_fill_color2."""
        with pytest.raises(ColorValidationError, match="Invalid color format for top_fill_color2"):
            BaselineData(time=1640995200, value=100.5, top_fill_color2="invalid_color")

    def test_validation_invalid_top_line_color(self):
        """Test validation with invalid top_line_color."""
        with pytest.raises(ColorValidationError, match="Invalid color format for top_line_color"):
            BaselineData(time=1640995200, value=100.5, top_line_color="invalid_color")

    def test_validation_invalid_bottom_fill_color1(self):
        """Test validation with invalid bottom_fill_color1."""
        with pytest.raises(
            ColorValidationError,
            match="Invalid color format for bottom_fill_color1",
        ):
            BaselineData(time=1640995200, value=100.5, bottom_fill_color1="invalid_color")

    def test_validation_invalid_bottom_fill_color2(self):
        """Test validation with invalid bottom_fill_color2."""
        with pytest.raises(
            ColorValidationError,
            match="Invalid color format for bottom_fill_color2",
        ):
            BaselineData(time=1640995200, value=100.5, bottom_fill_color2="invalid_color")

    def test_validation_invalid_bottom_line_color(self):
        """Test validation with invalid bottom_line_color."""
        with pytest.raises(
            ColorValidationError,
            match="Invalid color format for bottom_line_color",
        ):
            BaselineData(time=1640995200, value=100.5, bottom_line_color="invalid_color")

    def test_validation_none_colors(self):
        """Test validation with None colors (should be allowed)."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1=None,
            top_fill_color2=None,
            top_line_color=None,
            bottom_fill_color1=None,
            bottom_fill_color2=None,
            bottom_line_color=None,
        )
        assert data.top_fill_color1 is None
        assert data.top_fill_color2 is None
        assert data.top_line_color is None
        assert data.bottom_fill_color1 is None
        assert data.bottom_fill_color2 is None
        assert data.bottom_line_color is None

    def test_validation_empty_color_strings(self):
        """Test validation with empty color strings (should be allowed)."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1="",
            top_fill_color2="",
            top_line_color="",
            bottom_fill_color1="",
            bottom_fill_color2="",
            bottom_line_color="",
        )
        # Empty color strings are converted to None by centralized validation
        assert data.top_fill_color1 is None
        assert data.top_fill_color2 is None
        assert data.top_line_color is None
        assert data.bottom_fill_color1 is None
        assert data.bottom_fill_color2 is None
        assert data.bottom_line_color is None

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
            data = BaselineData(time=1640995200, value=100.5, top_fill_color1=color)
            assert data.top_fill_color1 == color

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
            data = BaselineData(time=1640995200, value=100.5, bottom_fill_color1=color)
            assert data.bottom_fill_color1 == color

    def test_validation_ohlc_relationship(self):
        """Test that high >= low validation is not applied (BaselineData doesn't have OHLC)."""
        # BaselineData should not have OHLC validation since it only has 'value'
        data = BaselineData(time=1640995200, value=100.5)
        assert data.value == 100.5

    def test_validation_non_negative_values(self):
        """Test that non-negative validation is not applied to BaselineData values."""
        # BaselineData values can be negative
        data = BaselineData(time=1640995200, value=-100.5)
        assert data.value == -100.5


class TestBaselineDataSerialization:
    """Test BaselineData serialization to dictionary."""

    def test_to_dict_basic(self):
        """Test basic to_dict functionality."""
        data = BaselineData(time=1640995200, value=100.5)
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 100.5}

    def test_to_dict_with_top_colors(self):
        """Test to_dict with top area colors."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1="#FF0000",
            top_fill_color2="#00FF00",
            top_line_color="#0000FF",
        )
        result = data.asdict()
        expected = {
            "time": 1640995200,
            "value": 100.5,
            "topFillColor1": "#FF0000",
            "topFillColor2": "#00FF00",
            "topLineColor": "#0000FF",
        }
        assert result == expected

    def test_to_dict_with_bottom_colors(self):
        """Test to_dict with bottom area colors."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            bottom_fill_color1="rgba(255,0,0,0.5)",
            bottom_fill_color2="rgba(0,255,0,0.5)",
            bottom_line_color="rgba(0,0,255,0.5)",
        )
        result = data.asdict()
        expected = {
            "time": 1640995200,
            "value": 100.5,
            "bottomFillColor1": "rgba(255,0,0,0.5)",
            "bottomFillColor2": "rgba(0,255,0,0.5)",
            "bottomLineColor": "rgba(0,0,255,0.5)",
        }
        assert result == expected

    def test_to_dict_with_all_colors(self):
        """Test to_dict with all color properties."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1="#FF0000",
            top_fill_color2="#00FF00",
            top_line_color="#0000FF",
            bottom_fill_color1="rgba(255,0,0,0.5)",
            bottom_fill_color2="rgba(0,255,0,0.5)",
            bottom_line_color="rgba(0,0,255,0.5)",
        )
        result = data.asdict()
        expected = {
            "time": 1640995200,
            "value": 100.5,
            "topFillColor1": "#FF0000",
            "topFillColor2": "#00FF00",
            "topLineColor": "#0000FF",
            "bottomFillColor1": "rgba(255,0,0,0.5)",
            "bottomFillColor2": "rgba(0,255,0,0.5)",
            "bottomLineColor": "rgba(0,0,255,0.5)",
        }
        assert result == expected

    def test_to_dict_with_none_colors(self):
        """Test to_dict with None colors (should be omitted)."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1=None,
            bottom_fill_color1=None,
        )
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 100.5}

    def test_to_dict_with_empty_colors(self):
        """Test to_dict with empty color strings (should be omitted)."""
        data = BaselineData(time=1640995200, value=100.5, top_fill_color1="", bottom_fill_color1="")
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 100.5}

    def test_to_dict_with_nan_value(self):
        """Test to_dict with NaN value (should be converted to 0.0)."""
        data = BaselineData(time=1640995200, value=float("nan"))
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 0.0}

    def test_to_dict_with_zero_value(self):
        """Test to_dict with zero value."""
        data = BaselineData(time=1640995200, value=0.0)
        result = data.asdict()
        assert result == {"time": 1640995200, "value": 0.0}

    def test_to_dict_with_negative_value(self):
        """Test to_dict with negative value."""
        data = BaselineData(time=1640995200, value=-50.0)
        result = data.asdict()
        assert result == {"time": 1640995200, "value": -50.0}

    def test_to_dict_with_infinity_value(self):
        """Test to_dict with infinity value."""
        data = BaselineData(time=1640995200, value=float("inf"))
        result = data.asdict()
        assert result == {"time": 1640995200, "value": float("inf")}

    def test_to_dict_with_negative_infinity_value(self):
        """Test to_dict with negative infinity value."""
        data = BaselineData(time=1640995200, value=float("-inf"))
        result = data.asdict()
        assert result == {"time": 1640995200, "value": float("-inf")}


class TestBaselineDataInheritance:
    """Test BaselineData inheritance from SingleValueData."""

    def test_inherits_from_base_data(self):
        """Test that BaselineData inherits from SingleValueData."""
        data = BaselineData(time=1640995200, value=100.5)
        assert isinstance(data, SingleValueData)

    def test_required_columns_property(self):
        """Test required_columns property."""
        # BaselineData inherits time and value from SingleValueData
        assert BaselineData.required_columns == {"time", "value"}

    def test_optional_columns_property(self):
        """Test optional_columns property."""
        expected_optional = {
            "top_fill_color1",
            "top_fill_color2",
            "top_line_color",
            "bottom_fill_color1",
            "bottom_fill_color2",
            "bottom_line_color",
        }
        assert BaselineData.optional_columns == expected_optional

    def test_has_required_columns_class_attribute(self):
        """Test that REQUIRED_COLUMNS class attribute exists."""
        assert hasattr(BaselineData, "REQUIRED_COLUMNS")
        assert set() == BaselineData.REQUIRED_COLUMNS

    def test_has_optional_columns_class_attribute(self):
        """Test that OPTIONAL_COLUMNS class attribute exists."""
        assert hasattr(BaselineData, "OPTIONAL_COLUMNS")
        expected_optional = {
            "top_fill_color1",
            "top_fill_color2",
            "top_line_color",
            "bottom_fill_color1",
            "bottom_fill_color2",
            "bottom_line_color",
        }
        assert expected_optional == BaselineData.OPTIONAL_COLUMNS

    def test_dataclass_fields(self):
        """Test that BaselineData has correct dataclass fields."""
        field_names = {field.name for field in fields(BaselineData)}
        expected_fields = {
            "time",
            "value",
            "top_fill_color1",
            "top_fill_color2",
            "top_line_color",
            "bottom_fill_color1",
            "bottom_fill_color2",
            "bottom_line_color",
        }
        assert field_names == expected_fields

    def test_post_init_called(self):
        """Test that __post_init__ is called and performs validation."""
        # This should not raise an error due to validation
        data = BaselineData(time=1640995200, value=100.5)
        assert data.time == 1640995200
        assert data.value == 100.5


class TestBaselineDataEdgeCases:
    """Test BaselineData edge cases and limits."""

    def test_very_large_time_value(self):
        """Test with very large time value."""
        large_time = 9999999999
        data = BaselineData(time=large_time, value=100.5)
        assert data.time == large_time

    def test_very_small_time_value(self):
        """Test with very small time value."""
        small_time = 0
        data = BaselineData(time=small_time, value=100.5)
        assert data.time == small_time

    def test_very_large_value(self):
        """Test with very large value."""
        large_value = 1e15
        data = BaselineData(time=1640995200, value=large_value)
        assert data.value == large_value

    def test_very_small_value(self):
        """Test with very small value."""
        small_value = 1e-15
        data = BaselineData(time=1640995200, value=small_value)
        assert data.value == small_value

    def test_infinity_value(self):
        """Test with infinity value."""
        data = BaselineData(time=1640995200, value=float("inf"))
        assert data.value == float("inf")

    def test_negative_infinity_value(self):
        """Test with negative infinity value."""
        data = BaselineData(time=1640995200, value=float("-inf"))
        assert data.value == float("-inf")

    def test_very_long_color_string(self):
        """Test with very long color string."""
        long_color = "#" + "A" * 100
        with pytest.raises(ColorValidationError, match="Invalid color format for top_fill_color1"):
            BaselineData(time=1640995200, value=100.5, top_fill_color1=long_color)

    def test_mixed_case_hex_colors(self):
        """Test with mixed case hex colors."""
        data = BaselineData(time=1640995200, value=100.5, top_fill_color1="#aBcDeF")
        assert data.top_fill_color1 == "#aBcDeF"

    def test_rgba_with_spaces(self):
        """Test rgba color with spaces (should be accepted by permissive validator)."""
        data = BaselineData(time=1640995200, value=100.5, bottom_fill_color1="rgba( 33,150,243,1)")
        assert data.bottom_fill_color1 == "rgba( 33,150,243,1)"

    def test_rgba_with_invalid_alpha(self):
        """Test rgba color with invalid alpha value (should be accepted by permissive validator)."""
        data = BaselineData(time=1640995200, value=100.5, bottom_fill_color1="rgba(33,150,243,2)")
        assert data.bottom_fill_color1 == "rgba(33,150,243,2)"

    def test_rgba_with_negative_alpha(self):
        """Test rgba color with negative alpha value (should be rejected)."""
        with pytest.raises(
            ColorValidationError,
            match="Invalid color format for bottom_fill_color1",
        ):
            BaselineData(
                time=1640995200,
                value=100.5,
                bottom_fill_color1="rgba(33,150,243,-0.1)",
            )

    def test_color_serialization_consistency(self):
        """Test that color serialization is consistent."""
        colors = ["#2196F3", "rgba(33,150,243,1)", "#FF0000"]
        for color in colors:
            data = BaselineData(time=1640995200, value=100.5, top_fill_color1=color)
            result = data.asdict()
            assert result["topFillColor1"] == color

    def test_all_color_properties_serialization(self):
        """Test that all color properties are serialized correctly."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1="#FF0000",
            top_fill_color2="#00FF00",
            top_line_color="#0000FF",
            bottom_fill_color1="rgba(255,0,0,0.5)",
            bottom_fill_color2="rgba(0,255,0,0.5)",
            bottom_line_color="rgba(0,0,255,0.5)",
        )
        result = data.asdict()

        # Check that all color properties are present and correctly named
        assert "topFillColor1" in result
        assert "topFillColor2" in result
        assert "topLineColor" in result
        assert "bottomFillColor1" in result
        assert "bottomFillColor2" in result
        assert "bottomLineColor" in result

        # Check values
        assert result["topFillColor1"] == "#FF0000"
        assert result["topFillColor2"] == "#00FF00"
        assert result["topLineColor"] == "#0000FF"
        assert result["bottomFillColor1"] == "rgba(255,0,0,0.5)"
        assert result["bottomFillColor2"] == "rgba(0,255,0,0.5)"
        assert result["bottomLineColor"] == "rgba(0,0,255,0.5)"

    def test_color_omission_in_serialization(self):
        """Test that None and empty color values are omitted from serialization."""
        # Note: Empty strings are converted to None by centralized validation
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1=None,
            top_fill_color2="",
            bottom_fill_color1=None,
            bottom_fill_color2="",
        )
        result = data.asdict()

        # Only time and value should be present
        assert result == {"time": 1640995200, "value": 100.5}
        assert "topFillColor1" not in result
        assert "topFillColor2" not in result
        assert "bottomFillColor1" not in result
        assert "bottomFillColor2" not in result


class TestBaselineDataTimeHandling:
    """Test BaselineData time handling and normalization."""

    def test_time_normalization_string_date(self):
        """Test time normalization with string date."""
        data = BaselineData(time="2022-01-01", value=100.5)
        # Time stored as-is
        assert data.time == "2022-01-01"
        # Normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] > 0

    def test_time_normalization_datetime_object(self):
        """Test time normalization with datetime object."""
        dt = datetime(2022, 1, 1, 12, 0, 0)
        data = BaselineData(time=dt, value=100.5)
        # Time stored as-is (datetime)
        assert data.time == dt
        # Normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] > 0

    def test_time_normalization_pandas_timestamp(self):
        """Test time normalization with pandas timestamp."""
        ts = pd.Timestamp("2022-01-01 12:00:00")
        data = BaselineData(time=ts, value=100.5)
        # Time stored as-is (pandas Timestamp)
        assert data.time == ts
        # Normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] > 0

    def test_time_normalization_float_timestamp(self):
        """Test time normalization with float timestamp."""
        data = BaselineData(time=1640995200.5, value=100.5)
        # Time stored as-is (float)
        assert data.time == 1640995200.5
        # Normalized to int in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200

    def test_time_normalization_numpy_int64(self):
        """Test time normalization with numpy int64."""
        data = BaselineData(time=np.int64(1640995200), value=100.5)
        # Time stored as-is (numpy int64)
        assert isinstance(data.time, np.int64)
        # Normalized to int in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200

    def test_time_normalization_numpy_float64(self):
        """Test time normalization with numpy float64."""
        data = BaselineData(time=np.float64(1640995200.5), value=100.5)
        # Time stored as-is (numpy float64)
        assert isinstance(data.time, np.float64)
        # Normalized to int in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200

    def test_time_modification_after_construction(self):
        """Test that time can be modified after construction."""
        data = BaselineData(time="2024-01-01", value=100.5)
        result1 = data.asdict()
        time1 = result1["time"]

        # Modify time after construction
        data.time = "2024-01-02"
        result2 = data.asdict()
        time2 = result2["time"]

        # Times should be different
        assert time1 != time2


class TestBaselineDataColorHandling:
    """Test BaselineData color handling and validation."""

    def test_color_case_sensitivity(self):
        """Test color case sensitivity."""
        # Hex colors should be case-insensitive in validation
        data1 = BaselineData(time=1640995200, value=100.5, top_fill_color1="#2196F3")
        data2 = BaselineData(time=1640995200, value=100.5, top_fill_color1="#2196f3")
        assert data1.top_fill_color1 == "#2196F3"
        assert data2.top_fill_color1 == "#2196f3"

    def test_color_with_spaces(self):
        """Test color with spaces (should be invalid)."""
        with pytest.raises(ColorValidationError, match="Invalid color format for top_fill_color1"):
            BaselineData(time=1640995200, value=100.5, top_fill_color1="# 2196F3")

    def test_color_without_hash(self):
        """Test color without hash (should be invalid)."""
        with pytest.raises(ColorValidationError, match="Invalid color format for top_fill_color1"):
            BaselineData(time=1640995200, value=100.5, top_fill_color1="2196F3")

    def test_rgba_with_spaces(self):
        """Test rgba color with spaces (should be accepted by permissive validator)."""
        data = BaselineData(time=1640995200, value=100.5, bottom_fill_color1="rgba( 33,150,243,1)")
        assert data.bottom_fill_color1 == "rgba( 33,150,243,1)"

    def test_rgba_with_invalid_alpha(self):
        """Test rgba color with invalid alpha value (should be accepted by permissive validator)."""
        data = BaselineData(time=1640995200, value=100.5, bottom_fill_color1="rgba(33,150,243,2)")
        assert data.bottom_fill_color1 == "rgba(33,150,243,2)"

    def test_rgba_with_negative_alpha(self):
        """Test rgba color with negative alpha value (should be rejected)."""
        with pytest.raises(
            ColorValidationError,
            match="Invalid color format for bottom_fill_color1",
        ):
            BaselineData(
                time=1640995200,
                value=100.5,
                bottom_fill_color1="rgba(33,150,243,-0.1)",
            )

    def test_color_serialization_consistency(self):
        """Test that color serialization is consistent."""
        colors = ["#2196F3", "rgba(33,150,243,1)", "#FF0000"]
        for color in colors:
            data = BaselineData(time=1640995200, value=100.5, top_fill_color1=color)
            result = data.asdict()
            assert result["topFillColor1"] == color

    def test_all_color_properties_serialization(self):
        """Test that all color properties are serialized correctly."""
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1="#FF0000",
            top_fill_color2="#00FF00",
            top_line_color="#0000FF",
            bottom_fill_color1="rgba(255,0,0,0.5)",
            bottom_fill_color2="rgba(0,255,0,0.5)",
            bottom_line_color="rgba(0,0,255,0.5)",
        )
        result = data.asdict()

        # Check that all color properties are present and correctly named
        assert "topFillColor1" in result
        assert "topFillColor2" in result
        assert "topLineColor" in result
        assert "bottomFillColor1" in result
        assert "bottomFillColor2" in result
        assert "bottomLineColor" in result

        # Check values
        assert result["topFillColor1"] == "#FF0000"
        assert result["topFillColor2"] == "#00FF00"
        assert result["topLineColor"] == "#0000FF"
        assert result["bottomFillColor1"] == "rgba(255,0,0,0.5)"
        assert result["bottomFillColor2"] == "rgba(0,255,0,0.5)"
        assert result["bottomLineColor"] == "rgba(0,0,255,0.5)"

    def test_color_omission_in_serialization(self):
        """Test that None and empty color values are omitted from serialization."""
        # Note: Empty strings are converted to None by centralized validation
        data = BaselineData(
            time=1640995200,
            value=100.5,
            top_fill_color1=None,
            top_fill_color2="",
            bottom_fill_color1=None,
            bottom_fill_color2="",
        )
        result = data.asdict()

        # Only time and value should be present
        assert result == {"time": 1640995200, "value": 100.5}
        assert "topFillColor1" not in result
        assert "topFillColor2" not in result
        assert "bottomFillColor1" not in result
        assert "bottomFillColor2" not in result
