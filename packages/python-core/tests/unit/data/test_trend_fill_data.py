"""Unit tests for TrendFillData module.

This module tests the TrendFillData class functionality including
data validation, property methods, and edge cases.
"""

import pytest
from lightweight_charts_core.data.trend_fill import TrendFillData
from lightweight_charts_core.exceptions import (
    TrendDirectionIntegerError,
    TypeValidationError,
    ValueValidationError,
)


class TestTrendFillDataInitialization:
    """Test TrendFillData initialization."""

    def test_default_initialization(self):
        """Test default initialization values."""
        data = TrendFillData(time=1640995200)

        assert data.time == 1640995200
        assert data.base_line == 0
        assert data.trend_line == 0
        assert data.trend_direction == 0
        assert data.uptrend_fill_color is None
        assert data.downtrend_fill_color is None

    def test_custom_initialization(self):
        """Test initialization with custom values."""
        data = TrendFillData(
            time=1640995200,
            base_line=100.0,
            trend_line=105.0,
            trend_direction=1,
            uptrend_fill_color="#00ff00",
            downtrend_fill_color="#ff0000",
        )

        assert data.time == 1640995200
        assert data.base_line == 100.0
        assert data.trend_line == 105.0
        assert data.trend_direction == 1
        assert data.uptrend_fill_color == "#00ff00"
        assert data.downtrend_fill_color == "#ff0000"

    def test_partial_initialization(self):
        """Test initialization with partial values."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_direction=-1)

        assert data.time == 1640995200
        assert data.base_line == 100.0
        assert data.trend_line == 0  # Default value
        assert data.trend_direction == -1
        assert data.uptrend_fill_color is None
        assert data.downtrend_fill_color is None


class TestTrendFillDataValidation:
    """Test TrendFillData validation."""

    def test_trend_direction_valid_values(self):
        """Test valid trend direction values."""
        for direction in [-1, 0, 1]:
            data = TrendFillData(time=1640995200, trend_direction=direction)
            assert data.trend_direction == direction

    def test_trend_direction_invalid_type(self):
        """Test invalid trend direction type."""
        with pytest.raises(TrendDirectionIntegerError):
            TrendFillData(time=1640995200, trend_direction="invalid")

    def test_trend_direction_invalid_values(self):
        """Test invalid trend direction values."""
        invalid_directions = [-2, 2, 10, -10]
        for direction in invalid_directions:
            with pytest.raises(ValueValidationError):
                TrendFillData(time=1640995200, trend_direction=direction)

    def test_uptrend_fill_color_invalid_type(self):
        """Test invalid uptrend fill color type."""
        with pytest.raises(TypeValidationError):
            TrendFillData(time=1640995200, uptrend_fill_color=123)

    def test_downtrend_fill_color_invalid_type(self):
        """Test invalid downtrend fill color type."""
        with pytest.raises(TypeValidationError):
            TrendFillData(time=1640995200, downtrend_fill_color=456)

    def test_nan_handling_trend_line(self):
        """Test handling of NaN values in trend_line."""
        data = TrendFillData(time=1640995200, trend_line=float("nan"))
        assert data.trend_line is None

    def test_nan_handling_base_line(self):
        """Test handling of NaN values in base_line."""
        data = TrendFillData(time=1640995200, base_line=float("nan"))
        assert data.base_line is None


class TestTrendFillDataProperties:
    """Test TrendFillData property methods."""

    def test_is_uptrend(self):
        """Test is_uptrend property."""
        uptrend_data = TrendFillData(time=1640995200, trend_direction=1)
        assert uptrend_data.is_uptrend is True

        non_uptrend_data = TrendFillData(time=1640995200, trend_direction=-1)
        assert non_uptrend_data.is_uptrend is False

        neutral_data = TrendFillData(time=1640995200, trend_direction=0)
        assert neutral_data.is_uptrend is False

    def test_is_downtrend(self):
        """Test is_downtrend property."""
        downtrend_data = TrendFillData(time=1640995200, trend_direction=-1)
        assert downtrend_data.is_downtrend is True

        non_downtrend_data = TrendFillData(time=1640995200, trend_direction=1)
        assert non_downtrend_data.is_downtrend is False

        neutral_data = TrendFillData(time=1640995200, trend_direction=0)
        assert neutral_data.is_downtrend is False

    def test_is_neutral(self):
        """Test is_neutral property."""
        neutral_data = TrendFillData(time=1640995200, trend_direction=0)
        assert neutral_data.is_neutral is True

        non_neutral_data = TrendFillData(time=1640995200, trend_direction=1)
        assert non_neutral_data.is_neutral is False

        non_neutral_data = TrendFillData(time=1640995200, trend_direction=-1)
        assert non_neutral_data.is_neutral is False


class TestTrendFillDataValidFillData:
    """Test has_valid_fill_data property."""

    def test_valid_fill_data_uptrend(self):
        """Test valid fill data for uptrend."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=105.0, trend_direction=1)
        assert data.has_valid_fill_data is True

    def test_valid_fill_data_downtrend(self):
        """Test valid fill data for downtrend."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=95.0, trend_direction=-1)
        assert data.has_valid_fill_data is True

    def test_invalid_fill_data_neutral(self):
        """Test invalid fill data for neutral trend."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=105.0, trend_direction=0)
        assert data.has_valid_fill_data is False

    def test_invalid_fill_data_no_base_line(self):
        """Test invalid fill data with no base line."""
        data = TrendFillData(time=1640995200, base_line=None, trend_line=105.0, trend_direction=1)
        assert data.has_valid_fill_data is False

    def test_invalid_fill_data_no_trend_line(self):
        """Test invalid fill data with no trend line."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=None, trend_direction=1)
        assert data.has_valid_fill_data is False


class TestTrendFillDataValidUptrendFill:
    """Test has_valid_uptrend_fill property."""

    def test_valid_uptrend_fill(self):
        """Test valid uptrend fill data."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=105.0, trend_direction=1)
        assert data.has_valid_uptrend_fill is True

    def test_invalid_uptrend_fill_wrong_direction(self):
        """Test invalid uptrend fill with wrong direction."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=95.0, trend_direction=-1)
        assert data.has_valid_uptrend_fill is False

    def test_invalid_uptrend_fill_no_base_line(self):
        """Test invalid uptrend fill with no base line."""
        data = TrendFillData(time=1640995200, base_line=None, trend_line=105.0, trend_direction=1)
        assert data.has_valid_uptrend_fill is False

    def test_invalid_uptrend_fill_no_trend_line(self):
        """Test invalid uptrend fill with no trend line."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=None, trend_direction=1)
        assert data.has_valid_uptrend_fill is False


class TestTrendFillDataValidDowntrendFill:
    """Test has_valid_downtrend_fill property."""

    def test_valid_downtrend_fill(self):
        """Test valid downtrend fill data."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=95.0, trend_direction=-1)
        assert data.has_valid_downtrend_fill is True

    def test_invalid_downtrend_fill_wrong_direction(self):
        """Test invalid downtrend fill with wrong direction."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=105.0, trend_direction=1)
        assert data.has_valid_downtrend_fill is False

    def test_invalid_downtrend_fill_no_base_line(self):
        """Test invalid downtrend fill with no base line."""
        data = TrendFillData(time=1640995200, base_line=None, trend_line=95.0, trend_direction=-1)
        assert data.has_valid_downtrend_fill is False

    def test_invalid_downtrend_fill_no_trend_line(self):
        """Test invalid downtrend fill with no trend line."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=None, trend_direction=-1)
        assert data.has_valid_downtrend_fill is False


class TestTrendFillDataActiveTrendLine:
    """Test active_trend_line property."""

    def test_active_trend_line_uptrend(self):
        """Test active trend line for uptrend."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=105.0, trend_direction=1)
        assert data.active_trend_line == 105.0

    def test_active_trend_line_downtrend(self):
        """Test active trend line for downtrend."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=95.0, trend_direction=-1)
        assert data.active_trend_line == 95.0

    def test_active_trend_line_neutral(self):
        """Test active trend line for neutral trend."""
        data = TrendFillData(time=1640995200, base_line=100.0, trend_line=105.0, trend_direction=0)
        assert data.active_trend_line is None


class TestTrendFillDataActiveFillColor:
    """Test active_fill_color property."""

    def test_active_fill_color_uptrend(self):
        """Test active fill color for uptrend."""
        data = TrendFillData(time=1640995200, trend_direction=1, uptrend_fill_color="#00ff00")
        assert data.active_fill_color == "#00ff00"

    def test_active_fill_color_downtrend(self):
        """Test active fill color for downtrend."""
        data = TrendFillData(time=1640995200, trend_direction=-1, downtrend_fill_color="#ff0000")
        assert data.active_fill_color == "#ff0000"

    def test_active_fill_color_neutral(self):
        """Test active fill color for neutral trend."""
        data = TrendFillData(
            time=1640995200,
            trend_direction=0,
            uptrend_fill_color="#00ff00",
            downtrend_fill_color="#ff0000",
        )
        assert data.active_fill_color is None

    def test_active_fill_color_no_colors(self):
        """Test active fill color when no colors are set."""
        data = TrendFillData(time=1640995200, trend_direction=1)
        assert data.active_fill_color is None


class TestTrendFillDataTrendLineType:
    """Test trend_line_type property."""

    def test_trend_line_type_uptrend(self):
        """Test trend line type for uptrend."""
        data = TrendFillData(time=1640995200, trend_direction=1)
        assert data.trend_line_type == "upper"

    def test_trend_line_type_downtrend(self):
        """Test trend line type for downtrend."""
        data = TrendFillData(time=1640995200, trend_direction=-1)
        assert data.trend_line_type == "lower"

    def test_trend_line_type_neutral(self):
        """Test trend line type for neutral trend."""
        data = TrendFillData(time=1640995200, trend_direction=0)
        assert data.trend_line_type is None


class TestTrendFillDataEdgeCases:
    """Test edge cases and complex scenarios."""

    def test_zero_values(self):
        """Test with zero values."""
        data = TrendFillData(time=1640995200, base_line=0.0, trend_line=0.0, trend_direction=0)

        assert data.base_line == 0.0
        assert data.trend_line == 0.0
        assert data.trend_direction == 0
        assert data.is_neutral is True
        assert data.active_trend_line is None

    def test_negative_values(self):
        """Test with negative values."""
        data = TrendFillData(
            time=1640995200,
            base_line=-100.0,
            trend_line=-95.0,
            trend_direction=-1,
        )

        assert data.base_line == -100.0
        assert data.trend_line == -95.0
        assert data.trend_direction == -1
        assert data.is_downtrend is True
        assert data.active_trend_line == -95.0

    def test_large_values(self):
        """Test with large values."""
        data = TrendFillData(time=1640995200, base_line=1e6, trend_line=1.1e6, trend_direction=1)

        assert data.base_line == 1e6
        assert data.trend_line == 1.1e6
        assert data.trend_direction == 1
        assert data.is_uptrend is True
        assert data.active_trend_line == 1.1e6

    def test_complex_color_scenarios(self):
        """Test complex color scenarios."""
        # Test with both colors set
        data = TrendFillData(
            time=1640995200,
            trend_direction=1,
            uptrend_fill_color="#00ff00",
            downtrend_fill_color="#ff0000",
        )
        assert data.active_fill_color == "#00ff00"

        # Change direction
        data.trend_direction = -1
        assert data.active_fill_color == "#ff0000"

    def test_state_transitions(self):
        """Test state transitions."""
        data = TrendFillData(time=1640995200, trend_direction=0)

        # Start neutral
        assert data.is_neutral is True
        assert data.active_trend_line is None

        # Change to uptrend
        data.trend_direction = 1
        assert data.is_uptrend is True
        assert data.is_neutral is False

        # Change to downtrend
        data.trend_direction = -1
        assert data.is_downtrend is True
        assert data.is_uptrend is False

        # Back to neutral
        data.trend_direction = 0
        assert data.is_neutral is True
        assert data.is_downtrend is False
