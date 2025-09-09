"""
Tests for CandlestickData class.

This module contains comprehensive tests for the CandlestickData class,
which represents candlestick chart data points with optional color styling.
"""

from datetime import datetime

import numpy as np
import pandas as pd
import pytest

from streamlit_lightweight_charts_pro.data.candlestick_data import CandlestickData
from streamlit_lightweight_charts_pro.data.ohlc_data import OhlcData


class TestCandlestickDataConstruction:
    """Test CandlestickData construction."""

    def test_standard_construction(self):
        """Test standard construction with all required fields."""
        data = CandlestickData(time=1640995200, open=100.0, high=105.0, low=98.0, close=103.0)

        assert data.time == 1640995200
        assert data.open == 100.0
        assert data.high == 105.0
        assert data.low == 98.0
        assert data.close == 103.0
        assert data.color is None
        assert data.border_color is None
        assert data.wick_color is None

    def test_construction_with_colors(self):
        """Test construction with optional color fields."""
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            color="#FF0000",
            border_color="#00FF00",
            wick_color="#0000FF",
        )

        assert data.color == "#FF0000"
        assert data.border_color == "#00FF00"
        assert data.wick_color == "#0000FF"

    def test_construction_with_rgba_colors(self):
        """Test construction with rgba color values."""
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            color="rgba(255, 0, 0, 0.5)",
            border_color="rgba(0, 255, 0, 1.0)",
            wick_color="rgba(0, 0, 255, 0.8)",
        )

        assert data.color == "rgba(255, 0, 0, 0.5)"
        assert data.border_color == "rgba(0, 255, 0, 1.0)"
        assert data.wick_color == "rgba(0, 0, 255, 0.8)"

    def test_construction_with_string_time(self):
        """Test construction with string time that gets converted."""
        data = CandlestickData(time="2022-01-01", open=100.0, high=105.0, low=98.0, close=103.0)

        assert isinstance(data.time, int)
        assert data.time > 0

    def test_construction_with_datetime_time(self):
        """Test construction with datetime time that gets converted."""
        dt = datetime(2022, 1, 1)
        data = CandlestickData(time=dt, open=100.0, high=105.0, low=98.0, close=103.0)

        assert isinstance(data.time, int)
        assert data.time > 0

    def test_construction_with_pandas_timestamp(self):
        """Test construction with pandas timestamp."""
        ts = pd.Timestamp("2022-01-01")
        data = CandlestickData(time=ts, open=100.0, high=105.0, low=98.0, close=103.0)

        assert isinstance(data.time, int)
        assert data.time > 0


class TestCandlestickDataValidation:
    """Test CandlestickData validation."""

    def test_validation_ohlc_relationship(self):
        """Test that high >= low validation is enforced."""
        with pytest.raises(ValueError, match="high must be greater than or equal to low"):
            CandlestickData(
                time=1640995200, open=100.0, high=95.0, low=98.0, close=103.0  # High < Low
            )

    def test_validation_non_negative_values(self):
        """Test that all OHLC values must be non-negative."""
        with pytest.raises(ValueError, match="all OHLC values must be non-negative"):
            CandlestickData(
                time=1640995200, open=-100.0, high=105.0, low=98.0, close=103.0  # Negative value
            )

    def test_validation_none_values(self):
        """Test that None values are not allowed."""
        with pytest.raises(
            TypeError, match="'<' not supported between instances of 'NoneType' and 'int'"
        ):
            CandlestickData(time=1640995200, open=None, high=105.0, low=98.0, close=103.0)

    def test_validation_invalid_hex_color(self):
        """Test validation of invalid hex color."""
        with pytest.raises(
            ValueError, match="Invalid color format for color: 'invalid_hex'. Must be hex or rgba."
        ):
            CandlestickData(
                time=1640995200, open=100.0, high=105.0, low=98.0, close=103.0, color="invalid_hex"
            )

    def test_validation_invalid_rgba_color(self):
        """Test validation of invalid rgba color."""
        with pytest.raises(
            ValueError,
            match="Invalid color format for border_color: 'invalid_rgba'. Must be hex or rgba.",
        ):
            CandlestickData(
                time=1640995200,
                open=100.0,
                high=105.0,
                low=98.0,
                close=103.0,
                border_color="invalid_rgba",
            )

    def test_validation_empty_color_strings(self):
        """Test that empty color strings are allowed."""
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            color="",
            border_color="",
            wick_color="",
        )

        assert data.color == ""
        assert data.border_color == ""
        assert data.wick_color == ""


class TestCandlestickDataSerialization:
    """Test CandlestickData serialization."""

    def test_to_dict_basic(self):
        """Test basic to_dict serialization."""
        data = CandlestickData(time=1640995200, open=100.0, high=105.0, low=98.0, close=103.0)

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["open"] == 100.0
        assert result["high"] == 105.0
        assert result["low"] == 98.0
        assert result["close"] == 103.0
        assert "color" not in result
        assert "border_color" not in result
        assert "wick_color" not in result

    def test_to_dict_with_colors(self):
        """Test to_dict with color fields."""
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            color="#FF0000",
            border_color="#00FF00",
            wick_color="#0000FF",
        )

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["open"] == 100.0
        assert result["high"] == 105.0
        assert result["low"] == 98.0
        assert result["close"] == 103.0
        assert result["color"] == "#FF0000"
        assert result["borderColor"] == "#00FF00"
        assert result["wickColor"] == "#0000FF"

    def test_to_dict_with_empty_colors(self):
        """Test to_dict with empty color strings."""
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            color="",
            border_color="",
            wick_color="",
        )

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["open"] == 100.0
        assert result["high"] == 105.0
        assert result["low"] == 98.0
        assert result["close"] == 103.0
        assert "color" not in result
        assert "border_color" not in result
        assert "wick_color" not in result

    def test_to_dict_with_nan_values(self):
        """Test to_dict with NaN values converted to 0.0."""
        data = CandlestickData(
            time=1640995200, open=float("nan"), high=105.0, low=98.0, close=103.0
        )

        result = data.asdict()

        assert result["open"] == 0.0
        assert result["high"] == 105.0
        assert result["low"] == 98.0
        assert result["close"] == 103.0


class TestCandlestickDataInheritance:
    """Test CandlestickData inheritance."""

    def test_inherits_from_ohlc_data(self):
        """Test that CandlestickData inherits from OhlcData."""
        assert issubclass(CandlestickData, OhlcData)

    def test_required_columns_property(self):
        """Test required_columns property."""
        # CandlestickData inherits OHLC columns from OhlcData plus time
        assert CandlestickData.required_columns == {"time", "open", "high", "low", "close"}

    def test_optional_columns_property(self):
        """Test optional_columns property."""
        assert CandlestickData.optional_columns == {"color", "border_color", "wick_color"}

    def test_has_ohlc_validation(self):
        """Test that OHLC validation from parent is enforced."""
        with pytest.raises(ValueError, match="high must be greater than or equal to low"):
            CandlestickData(time=1640995200, open=100.0, high=95.0, low=98.0, close=103.0)


class TestCandlestickDataEdgeCases:
    """Test CandlestickData edge cases."""

    def test_construction_with_nan_value(self):
        """Test construction with NaN value."""
        data = CandlestickData(
            time=1640995200, open=float("nan"), high=105.0, low=98.0, close=103.0
        )

        assert data.open == 0.0

    def test_construction_with_infinity_value(self):
        """Test construction with infinity value."""
        data = CandlestickData(
            time=1640995200, open=float("inf"), high=105.0, low=98.0, close=103.0
        )

        assert data.open == float("inf")

    def test_construction_with_negative_infinity_value(self):
        """Test construction with negative infinity value."""
        with pytest.raises(ValueError, match="all OHLC values must be non-negative"):
            CandlestickData(time=1640995200, open=float("-inf"), high=105.0, low=98.0, close=103.0)

    def test_very_small_values(self):
        """Test construction with very small values."""
        data = CandlestickData(
            time=1640995200, open=0.000001, high=0.000002, low=0.000001, close=0.000001
        )

        assert data.open == 0.000001
        assert data.high == 0.000002
        assert data.low == 0.000001
        assert data.close == 0.000001

    def test_very_large_values(self):
        """Test construction with very large values."""
        data = CandlestickData(
            time=1640995200, open=1000000.0, high=1000001.0, low=999999.0, close=1000000.5
        )

        assert data.open == 1000000.0
        assert data.high == 1000001.0
        assert data.low == 999999.0
        assert data.close == 1000000.5


class TestCandlestickDataTimeHandling:
    """Test CandlestickData time handling."""

    def test_time_normalization_numpy_int64(self):
        """Test time normalization with numpy int64."""
        time_val = np.int64(1640995200)
        data = CandlestickData(time=time_val, open=100.0, high=105.0, low=98.0, close=103.0)

        assert isinstance(data.time, int)
        assert data.time == 1640995200

    def test_time_normalization_numpy_float64(self):
        """Test time normalization with numpy float64."""
        time_val = np.float64(1640995200.0)
        data = CandlestickData(time=time_val, open=100.0, high=105.0, low=98.0, close=103.0)

        assert isinstance(data.time, int)
        assert data.time == 1640995200


class TestCandlestickDataColorHandling:
    """Test CandlestickData color handling."""

    def test_mixed_case_hex_colors(self):
        """Test mixed case hex colors."""
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            color="#FfFfFf",
            border_color="#aAbBcC",
            wick_color="#123456",
        )

        assert data.color == "#FfFfFf"
        assert data.border_color == "#aAbBcC"
        assert data.wick_color == "#123456"

    def test_rgba_with_spaces(self):
        """Test rgba colors with spaces."""
        # Note: is_valid_color is permissive, so this should pass
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            color="rgba(255, 0, 0, 0.5)",
        )
        assert data.color == "rgba(255, 0, 0, 0.5)"

    def test_rgba_with_invalid_alpha(self):
        """Test rgba colors with invalid alpha."""
        # Note: is_valid_color is permissive, so this should pass
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            border_color="rgba(255, 0, 0, 2.0)",
        )
        assert data.border_color == "rgba(255, 0, 0, 2.0)"

    def test_rgba_with_negative_alpha(self):
        """Test rgba colors with negative alpha (should be rejected)."""
        with pytest.raises(ValueError, match="Invalid color format for wick_color"):
            data = CandlestickData(
                time=1640995200,
                open=100.0,
                high=105.0,
                low=98.0,
                close=103.0,
                wick_color="rgba(255, 0, 0, -0.5)",
            )

    def test_color_omission_in_serialization(self):
        """Test that None colors are omitted from serialization."""
        data = CandlestickData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=98.0,
            close=103.0,
            color=None,
            border_color=None,
            wick_color=None,
        )

        result = data.asdict()

        assert "color" not in result
        assert "border_color" not in result
        assert "wick_color" not in result
