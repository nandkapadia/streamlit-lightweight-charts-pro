"""Unit tests for the AreaData class.

This module tests the AreaData class functionality including
construction, validation, serialization, and inheritance.
"""

from datetime import datetime

import pandas as pd
import pytest
from lightweight_charts_core.data.area_data import AreaData
from lightweight_charts_core.exceptions import (
    ColorValidationError,
    RequiredFieldError,
    TimeValidationError,
)


class TestAreaDataConstruction:
    """Test cases for AreaData construction."""

    def test_standard_construction(self):
        """Test standard AreaData construction."""
        data = AreaData(time=1640995200, value=100)

        assert data.time == 1640995200
        assert data.value == 100
        assert data.line_color is None
        assert data.top_color is None
        assert data.bottom_color is None

    def test_construction_with_colors(self):
        """Test AreaData construction with all color properties."""
        data = AreaData(
            time=1640995200,
            value=100,
            line_color="#ff0000",
            top_color="#00ff00",
            bottom_color="#0000ff",
        )

        assert data.time == 1640995200
        assert data.value == 100
        assert data.line_color == "#ff0000"
        assert data.top_color == "#00ff00"
        assert data.bottom_color == "#0000ff"

    def test_construction_with_partial_colors(self):
        """Test AreaData construction with some color properties."""
        data = AreaData(time=1640995200, value=100, line_color="#ff0000", top_color="#00ff00")

        assert data.time == 1640995200
        assert data.value == 100
        assert data.line_color == "#ff0000"
        assert data.top_color == "#00ff00"
        assert data.bottom_color is None

    def test_construction_with_time_string(self):
        """Test AreaData construction with time string."""
        data = AreaData(time="2022-01-01", value=100)

        # Time is stored as-is
        assert data.time == "2022-01-01"
        # Time is normalized in asdict()
        result = data.asdict()
        assert result["time"] == 1640995200

    def test_construction_with_datetime(self):
        """Test AreaData construction with datetime."""
        dt = datetime(2022, 1, 1)
        data = AreaData(time=dt, value=100)

        # Time is stored as-is (datetime object)
        assert data.time == dt
        # Time is normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        # The actual timestamp depends on timezone, so we'll check it's a reasonable value
        assert result["time"] > 1640970000  # Should be around 2022-01-01
        assert result["time"] < 1641020000  # Should be around 2022-01-01 (accounting for timezone)

    def test_construction_with_pandas_timestamp(self):
        """Test AreaData construction with pandas Timestamp."""
        ts = pd.Timestamp("2022-01-01")
        data = AreaData(time=ts, value=100)

        # Time is stored as-is (pandas Timestamp)
        assert data.time == ts
        # Time is normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200  # UTC conversion


class TestAreaDataValidation:
    """Test cases for AreaData validation."""

    def test_valid_hex_colors(self):
        """Test AreaData construction with valid hex colors."""
        valid_colors = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"]

        for color in valid_colors:
            data = AreaData(
                time=1640995200,
                value=100,
                line_color=color,
                top_color=color,
                bottom_color=color,
            )
            assert data.line_color == color
            assert data.top_color == color
            assert data.bottom_color == color

    def test_valid_rgba_colors(self):
        """Test AreaData construction with valid rgba colors."""
        valid_colors = ["rgba(255, 0, 0, 1)", "rgba(0, 255, 0, 0.5)", "rgba(0, 0, 255, 0.8)"]

        for color in valid_colors:
            data = AreaData(
                time=1640995200,
                value=100,
                line_color=color,
                top_color=color,
                bottom_color=color,
            )
            assert data.line_color == color
            assert data.top_color == color
            assert data.bottom_color == color

    def test_invalid_line_color(self):
        """Test AreaData construction with invalid line color."""
        with pytest.raises(ColorValidationError, match="Invalid color format for line_color"):
            AreaData(time=1640995200, value=100, line_color="invalid_color")

    def test_invalid_top_color(self):
        """Test AreaData construction with invalid top color."""
        with pytest.raises(ColorValidationError, match="Invalid color format for top_color"):
            AreaData(time=1640995200, value=100, top_color="invalid_color")

    def test_invalid_bottom_color(self):
        """Test AreaData construction with invalid bottom color."""
        with pytest.raises(ColorValidationError, match="Invalid color format for bottom_color"):
            AreaData(time=1640995200, value=100, bottom_color="invalid_color")

    def test_none_value(self):
        """Test AreaData construction with None value."""
        with pytest.raises(RequiredFieldError):
            AreaData(time=1640995200, value=None)

    def test_invalid_time(self):
        """Test AreaData construction with invalid time."""
        # Invalid time won't raise error until asdict() is called
        data = AreaData(time="invalid_time", value=100)
        # Error happens during serialization
        with pytest.raises((TimeValidationError, ValueError)):
            data.asdict()


class TestAreaDataSerialization:
    """Test cases for AreaData serialization."""

    def test_to_dict_basic(self):
        """Test AreaData to_dict with basic data."""
        data = AreaData(time=1640995200, value=100)
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert "lineColor" not in data_dict
        assert "top_color" not in data_dict
        assert "bottomColor" not in data_dict

    def test_to_dict_with_all_colors(self):
        """Test AreaData to_dict with all color properties."""
        data = AreaData(
            time=1640995200,
            value=100,
            line_color="#ff0000",
            top_color="#00ff00",
            bottom_color="#0000ff",
        )
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert data_dict["lineColor"] == "#ff0000"
        assert data_dict["topColor"] == "#00ff00"
        assert data_dict["bottomColor"] == "#0000ff"

    def test_to_dict_with_partial_colors(self):
        """Test AreaData to_dict with some color properties."""
        data = AreaData(time=1640995200, value=100, line_color="#ff0000", top_color="#00ff00")
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert data_dict["lineColor"] == "#ff0000"
        assert data_dict["topColor"] == "#00ff00"
        assert "bottomColor" not in data_dict

    def test_to_dict_with_empty_colors(self):
        """Test AreaData to_dict with empty color strings."""
        # Empty color strings are converted to None by centralized validation
        data = AreaData(time=1640995200, value=100, line_color="", top_color="", bottom_color="")
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert "lineColor" not in data_dict
        assert "top_color" not in data_dict
        assert "bottomColor" not in data_dict

    def test_to_dict_with_whitespace_colors(self):
        """Test AreaData to_dict with whitespace-only color strings."""
        # Whitespace-only strings are stripped to empty, then converted
        # to None by centralized validation
        data = AreaData(
            time=1640995200,
            value=100,
            line_color="   ",
            top_color="   ",
            bottom_color="   ",
        )
        data_dict = data.asdict()

        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100
        assert "lineColor" not in data_dict
        assert "top_color" not in data_dict
        assert "bottomColor" not in data_dict


class TestAreaDataInheritance:
    """Test cases for AreaData inheritance and class properties."""

    def test_required_columns(self):
        """Test AreaData required columns."""
        required = AreaData.required_columns
        assert isinstance(required, set)
        assert "time" in required
        assert "value" in required

    def test_optional_columns(self):
        """Test AreaData optional columns."""
        optional = AreaData.optional_columns
        assert isinstance(optional, set)
        # Convert to set if it's not already one (defensive programming)
        optional_set = set(optional) if not isinstance(optional, set) else optional
        assert "line_color" in optional_set
        assert "top_color" in optional_set
        assert "bottom_color" in optional_set

    def test_inheritance_from_base_data(self):
        """Test that AreaData properly inherits from SingleValueData."""
        data = AreaData(time=1640995200, value=100)

        # Test that it has SingleValueData methods
        assert hasattr(data, "asdict")
        assert hasattr(data, "time")
        assert hasattr(data, "value")

        # Test that it has AreaData-specific properties
        assert hasattr(data, "line_color")
        assert hasattr(data, "top_color")
        assert hasattr(data, "bottom_color")


class TestAreaDataEdgeCases:
    """Test cases for AreaData edge cases."""

    def test_very_large_numbers(self):
        """Test AreaData with very large numbers."""
        data = AreaData(time=1640995200, value=1e15)
        assert data.value == 1e15

    def test_very_small_numbers(self):
        """Test AreaData with very small numbers."""
        data = AreaData(time=1640995200, value=1e-15)
        assert data.value == 1e-15

    def test_negative_values(self):
        """Test AreaData with negative values."""
        data = AreaData(time=1640995200, value=-100)
        assert data.value == -100

    def test_zero_values(self):
        """Test AreaData with zero values."""
        data = AreaData(time=1640995200, value=0)
        assert data.value == 0

    def test_nan_value(self):
        """Test AreaData with NaN value."""
        data = AreaData(time=1640995200, value=float("nan"))
        assert data.value == 0.0  # NaN is converted to 0.0

    def test_mixed_color_formats(self):
        """Test AreaData with mixed color formats."""
        data = AreaData(
            time=1640995200,
            value=100,
            line_color="#ff0000",
            top_color="rgba(0, 255, 0, 0.5)",
            bottom_color="#0000ff",
        )

        assert data.line_color == "#ff0000"
        assert data.top_color == "rgba(0, 255, 0, 0.5)"
        assert data.bottom_color == "#0000ff"

    def test_unicode_strings(self):
        """Test AreaData with unicode strings in time."""
        data = AreaData(time="2022-01-01", value=100)
        # Time stored as-is
        assert data.time == "2022-01-01"
        # Normalized in asdict()
        result = data.asdict()
        assert result["time"] == 1640995200

    def test_time_modification_after_construction(self):
        """Test that time can be modified after construction."""
        data = AreaData(time="2024-01-01", value=100)
        result1 = data.asdict()
        time1 = result1["time"]

        # Modify time after construction
        data.time = "2024-01-02"
        result2 = data.asdict()
        time2 = result2["time"]

        # Times should be different
        assert time1 != time2


class TestAreaDataComparison:
    """Test cases for AreaData comparison."""

    def test_area_data_equality(self):
        """Test AreaData equality."""
        data1 = AreaData(
            time=1640995200,
            value=100,
            line_color="#ff0000",
            top_color="#00ff00",
            bottom_color="#0000ff",
        )

        data2 = AreaData(
            time=1640995200,
            value=100,
            line_color="#ff0000",
            top_color="#00ff00",
            bottom_color="#0000ff",
        )

        assert data1.time == data2.time
        assert data1.value == data2.value
        assert data1.line_color == data2.line_color
        assert data1.top_color == data2.top_color
        assert data1.bottom_color == data2.bottom_color

    def test_area_data_inequality(self):
        """Test AreaData inequality."""
        data1 = AreaData(time=1640995200, value=100, line_color="#ff0000")

        data2 = AreaData(time=1641081600, value=100, line_color="#ff0000")  # Different time

        assert data1.time != data2.time
