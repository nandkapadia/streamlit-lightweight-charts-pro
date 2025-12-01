"""Unit tests for SingleValueData class.

This module tests the SingleValueData class functionality including
construction, validation, and serialization.
"""

import pytest
from lightweight_charts_core.data.single_value_data import SingleValueData


class TestSingleValueData:
    """Test cases for SingleValueData class."""

    def test_default_construction(self):
        """Test SingleValueData construction with default values."""
        data = SingleValueData(time=1640995200, value=100.0)

        assert data.time == 1640995200
        assert data.value == 100.0

    def test_construction_with_color(self):
        """Test SingleValueData construction without color (color not supported)."""
        # SingleValueData doesn't support color parameter
        data = SingleValueData(time=1640995200, value=100.0)

        assert data.time == 1640995200
        assert data.value == 100.0

    def test_asdict_method(self):
        """Test the asdict method returns correct structure."""
        data = SingleValueData(time=1640995200, value=100.0)

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["value"] == 100.0

    def test_asdict_without_color(self):
        """Test asdict method when color is not provided."""
        data = SingleValueData(time=1640995200, value=100.0)

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["value"] == 100.0
        assert "color" not in result

    def test_validation_required_fields(self):
        """Test validation of required fields."""
        # Missing time
        with pytest.raises(TypeError):  # Missing required positional argument
            SingleValueData(value=100.0)

        # Missing value
        with pytest.raises(TypeError):  # Missing required positional argument
            SingleValueData(time=1640995200)

    def test_validation_time(self):
        """Test validation of time parameter."""
        # Valid integer time - stored as-is
        data = SingleValueData(time=1640995200, value=100.0)
        assert data.time == 1640995200

        # Valid string time - stored as-is, normalized in asdict()
        data = SingleValueData(time="2022-01-01", value=100.0)
        assert data.time == "2022-01-01"  # Stored as-is
        result = data.asdict()
        assert isinstance(result["time"], int)  # Normalized in asdict()

        # Valid float time - stored as-is, normalized in asdict()
        data = SingleValueData(time=1640995200.5, value=100.0)
        assert data.time == 1640995200.5  # Stored as-is
        result = data.asdict()
        assert result["time"] == 1640995200  # Normalized to int in asdict()

    def test_validation_value(self):
        """Test validation of value parameter."""
        # Valid positive value
        data = SingleValueData(time=1640995200, value=100.0)
        assert data.value == 100.0

        # Valid zero value
        data = SingleValueData(time=1640995200, value=0.0)
        assert data.value == 0.0

        # Valid negative value
        data = SingleValueData(time=1640995200, value=-100.0)
        assert data.value == -100.0

        # Valid integer value
        data = SingleValueData(time=1640995200, value=100)
        assert data.value == 100.0  # Should be converted to float

    def test_validation_color(self):
        """Test validation of color parameter."""
        # SingleValueData doesn't support color parameter
        # This test verifies that color is not a valid parameter
        with pytest.raises(TypeError):  # Unexpected keyword argument
            SingleValueData(time=1640995200, value=100.0, color="#FF0000")

    def test_nan_handling(self):
        """Test handling of NaN values."""
        # NaN value should be converted to 0.0
        data = SingleValueData(time=1640995200, value=float("nan"))
        assert data.value == 0.0

        # Infinity values are not handled by the class (they remain as inf)
        data = SingleValueData(time=1640995200, value=float("inf"))
        assert data.value == float("inf")

        # Negative infinity values are not handled by the class (they remain as -inf)
        data = SingleValueData(time=1640995200, value=float("-inf"))
        assert data.value == float("-inf")

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Very large numbers
        data = SingleValueData(time=1640995200, value=999999.99)
        assert data.value == 999999.99

        # Very small numbers
        data = SingleValueData(time=1640995200, value=0.0001)
        assert data.value == 0.0001

        # Very large time - stored as-is
        data = SingleValueData(time=9999999999, value=100.0)
        assert data.time == 9999999999

        # Very small time - stored as-is
        data = SingleValueData(time=0, value=100.0)
        assert data.time == 0

    def test_time_modification_after_construction(self):
        """Test that time can be modified after construction."""
        data = SingleValueData(time="2024-01-01", value=100.0)
        result1 = data.asdict()
        time1 = result1["time"]

        # Modify time after construction
        data.time = "2024-01-02"
        result2 = data.asdict()
        time2 = result2["time"]

        # Times should be different
        assert time1 != time2

    def test_serialization_consistency(self):
        """Test that serialization is consistent across multiple calls."""
        data = SingleValueData(time=1640995200, value=100.0)

        result1 = data.asdict()
        result2 = data.asdict()

        assert result1 == result2

    def test_copy_method(self):
        """Test the copy method creates a new instance with same values."""
        original = SingleValueData(time=1640995200, value=100.0)

        # Since SingleValueData doesn't have a copy method, we'll test that
        # we can create a new instance with the same values
        copied = SingleValueData(time=original.time, value=original.value)

        assert copied is not original
        assert copied.time == original.time
        assert copied.value == original.value

    def test_equality_comparison(self):
        """Test equality comparison between SingleValueData instances."""
        data1 = SingleValueData(time=1640995200, value=100.0)
        data2 = SingleValueData(time=1640995200, value=100.0)
        data3 = SingleValueData(time=1640995200, value=200.0)  # Different value

        assert data1 == data2
        assert data1 != data3

    def test_string_representation(self):
        """Test string representation of SingleValueData."""
        data = SingleValueData(time=1640995200, value=100.0)

        str_repr = str(data)
        assert "1640995200" in str_repr
        assert "100.0" in str_repr

    def test_required_columns_property(self):
        """Test the required_columns property."""
        required = SingleValueData.required_columns
        assert isinstance(required, set)
        assert "time" in required
        assert "value" in required
        assert len(required) == 2

    def test_optional_columns_property(self):
        """Test the optional_columns property."""
        optional = SingleValueData.optional_columns
        assert isinstance(optional, set)
        assert len(optional) == 0  # SingleValueData has no optional columns

    def test_from_dict_method(self):
        """Test creating SingleValueData from dictionary using unpacking."""
        data_dict = {"time": 1640995200, "value": 100.0}

        data = SingleValueData(**data_dict)

        assert data.time == 1640995200
        assert data.value == 100.0

    def test_from_dict_without_optional_fields(self):
        """Test dictionary unpacking without optional fields."""
        data_dict = {"time": 1640995200, "value": 100.0}

        data = SingleValueData(**data_dict)

        assert data.time == 1640995200
        assert data.value == 100.0

    def test_from_dict_validation(self):
        """Test dictionary unpacking validation."""
        # Missing required field
        data_dict = {"time": 1640995200}  # missing value

        with pytest.raises(TypeError):  # Missing required positional argument
            SingleValueData(**data_dict)

    def test_data_scenarios(self):
        """Test various data scenarios."""
        # Price data
        price_data = SingleValueData(time=1640995200, value=100.0)
        assert price_data.time == 1640995200
        assert price_data.value == 100.0

        # Volume data
        volume_data = SingleValueData(time=1640995200, value=1000000)
        assert volume_data.time == 1640995200
        assert volume_data.value == 1000000.0

        # Indicator data
        indicator_data = SingleValueData(time=1640995200, value=0.75)
        assert indicator_data.time == 1640995200
        assert indicator_data.value == 0.75
