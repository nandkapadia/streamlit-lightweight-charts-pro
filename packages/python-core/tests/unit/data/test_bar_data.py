"""Unit tests for the BarData class.

This module tests the BarData class functionality including
construction, validation, serialization, and edge cases.
"""

import json
from datetime import datetime

import numpy as np
import pandas as pd
import pytest
from lightweight_charts_core.charts.series.bar_series import BarSeries
from lightweight_charts_core.data.bar_data import BarData
from lightweight_charts_core.data.ohlc_data import OhlcData
from lightweight_charts_core.exceptions import ColorValidationError, ValueValidationError


class TestBarDataConstruction:
    """Test BarData construction and initialization."""

    def test_standard_construction(self):
        """Test standard BarData construction."""
        data = BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0)

        assert data.time == 1640995200
        assert data.open == 100.0
        assert data.high == 110.0
        assert data.low == 95.0
        assert data.close == 105.0
        assert data.color is None

    def test_construction_with_color(self):
        """Test BarData construction with color."""
        data = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#FF0000",
        )

        assert data.time == 1640995200
        assert data.open == 100.0
        assert data.high == 110.0
        assert data.low == 95.0
        assert data.close == 105.0
        assert data.color == "#FF0000"

    def test_construction_with_rgba_color(self):
        """Test BarData construction with rgba color."""
        data = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="rgba(255, 0, 0, 0.5)",
        )

        assert data.color == "rgba(255, 0, 0, 0.5)"

    def test_construction_with_string_time(self):
        """Test BarData construction with string time."""
        data = BarData(time="2022-01-01", open=100.0, high=110.0, low=95.0, close=105.0)

        # Time is stored as-is
        assert data.time == "2022-01-01"
        # Time is normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200

    def test_construction_with_datetime_time(self):
        """Test BarData construction with datetime time."""
        dt = datetime(2022, 1, 1)
        data = BarData(time=dt, open=100.0, high=110.0, low=95.0, close=105.0)

        # Time is stored as-is (datetime object)
        assert data.time == dt
        # Time is normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        # The actual timestamp depends on timezone, so we'll check it's a reasonable value
        assert result["time"] > 1640970000  # Should be around 2022-01-01
        assert result["time"] < 1641020000  # Should be around 2022-01-01 (accounting for timezone)

    def test_construction_with_pandas_timestamp(self):
        """Test BarData construction with pandas timestamp."""
        ts = pd.Timestamp("2022-01-01")
        data = BarData(time=ts, open=100.0, high=110.0, low=95.0, close=105.0)

        # Time is stored as-is (pandas Timestamp)
        assert data.time == ts
        # Time is normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200

    def test_construction_with_float_values(self):
        """Test BarData construction with float values."""
        data = BarData(time=1640995200, open=100.5, high=110.75, low=95.25, close=105.125)

        assert data.open == 100.5
        assert data.high == 110.75
        assert data.low == 95.25
        assert data.close == 105.125

    def test_construction_with_int_values(self):
        """Test BarData construction with int values."""
        data = BarData(time=1640995200, open=100, high=110, low=95, close=105)

        # Values should be converted to float
        assert data.open == 100.0
        assert data.high == 110.0
        assert data.low == 95.0
        assert data.close == 105.0


class TestBarDataValidation:
    """Test BarData validation."""

    def test_validation_high_greater_than_low(self):
        """Test validation that high must be greater than or equal to low."""
        # Valid case: high > low
        data = BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0)
        # Should not raise exception
        assert data.high > data.low

        # Valid case: high == low
        data = BarData(time=1640995200, open=100.0, high=100.0, low=100.0, close=100.0)
        # Should not raise exception
        assert data.high == data.low

        # Invalid case: high < low
        with pytest.raises(ValueValidationError, match="high must be greater than or equal to low"):
            BarData(time=1640995200, open=100.0, high=95.0, low=110.0, close=105.0)

    def test_validation_non_negative_values(self):
        """Test validation that all OHLC values must be non-negative."""
        # Valid case: all positive values
        data = BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0)
        # Should not raise exception
        assert all(val >= 0 for val in [data.open, data.high, data.low, data.close])

        # Valid case: zero values
        data = BarData(time=1640995200, open=0.0, high=0.0, low=0.0, close=0.0)
        # Should not raise exception
        assert all(val >= 0 for val in [data.open, data.high, data.low, data.close])

        # Invalid case: negative open
        with pytest.raises(ValueValidationError, match="all OHLC values must be non-negative"):
            BarData(time=1640995200, open=-100.0, high=110.0, low=95.0, close=105.0)

        # Invalid case: negative high (but high < low, so different error)
        with pytest.raises(ValueValidationError, match="high must be greater than or equal to low"):
            BarData(time=1640995200, open=100.0, high=-110.0, low=95.0, close=105.0)

        # Invalid case: negative low
        with pytest.raises(ValueValidationError, match="all OHLC values must be non-negative"):
            BarData(time=1640995200, open=100.0, high=110.0, low=-95.0, close=105.0)

        # Invalid case: negative close
        with pytest.raises(ValueValidationError, match="all OHLC values must be non-negative"):
            BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=-105.0)

    def test_validation_none_values(self):
        """Test validation that OHLC values cannot be None."""
        # Invalid case: None open
        with pytest.raises(TypeError, match="'<' not supported between instances of"):
            BarData(time=1640995200, open=None, high=110.0, low=95.0, close=105.0)

        # Invalid case: None high
        with pytest.raises(TypeError, match="'<' not supported between instances of"):
            BarData(time=1640995200, open=100.0, high=None, low=95.0, close=105.0)

        # Invalid case: None low
        with pytest.raises(TypeError, match="'<' not supported between instances of"):
            BarData(time=1640995200, open=100.0, high=110.0, low=None, close=105.0)

        # Invalid case: None close
        with pytest.raises(TypeError, match="'<' not supported between instances of"):
            BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=None)

    def test_validation_color_format(self):
        """Test validation of color format."""
        # Valid hex color
        data = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#FF0000",
        )
        assert data.color == "#FF0000"

        # Valid rgba color
        data = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="rgba(255, 0, 0, 0.5)",
        )
        assert data.color == "rgba(255, 0, 0, 0.5)"

        # Invalid color format
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            BarData(
                time=1640995200,
                open=100.0,
                high=110.0,
                low=95.0,
                close=105.0,
                color="invalid_color",
            )

    def test_validation_empty_color(self):
        """Test validation of empty color."""
        # Empty string color should be allowed
        data = BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0, color="")
        # Empty color string is converted to None by centralized validation
        assert data.color is None


class TestBarDataSerialization:
    """Test BarData serialization methods."""

    def test_to_dict_basic(self):
        """Test basic to_dict functionality."""
        data = BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0)

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["open"] == 100.0
        assert result["high"] == 110.0
        assert result["low"] == 95.0
        assert result["close"] == 105.0
        assert "color" not in result  # color is None, so not included

    def test_to_dict_with_color(self):
        """Test to_dict with color."""
        data = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#FF0000",
        )

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["open"] == 100.0
        assert result["high"] == 110.0
        assert result["low"] == 95.0
        assert result["close"] == 105.0
        assert result["color"] == "#FF0000"

    def test_to_dict_with_empty_color(self):
        """Test to_dict with empty color."""
        data = BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0, color="")

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["open"] == 100.0
        assert result["high"] == 110.0
        assert result["low"] == 95.0
        assert result["close"] == 105.0
        assert "color" not in result  # empty string should be omitted

    def test_to_dict_nan_handling(self):
        """Test to_dict with NaN values."""
        data = BarData(time=1640995200, open=float("nan"), high=110.0, low=95.0, close=105.0)

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["open"] == 0.0  # NaN should be converted to 0.0
        assert result["high"] == 110.0
        assert result["low"] == 95.0
        assert result["close"] == 105.0


class TestBarDataInheritance:
    """Test BarData inheritance and class properties."""

    def test_inherits_from_ohlc_data(self):
        """Test that BarData inherits from OhlcData."""
        data = BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0)

        assert isinstance(data, OhlcData)

    def test_required_columns_property(self):
        """Test required_columns property."""
        # BarData inherits required columns from OhlcData
        required = BarData.required_columns
        assert isinstance(required, set)
        assert "time" in required
        assert "open" in required
        assert "high" in required
        assert "low" in required
        assert "close" in required

    def test_optional_columns_property(self):
        """Test optional_columns property."""
        # BarData adds color to optional columns
        optional = BarData.optional_columns
        assert isinstance(optional, set)
        assert "color" in optional


class TestBarDataEdgeCases:
    """Test BarData edge cases."""

    def test_nan_values_handling(self):
        """Test handling of NaN values."""
        data = BarData(
            time=1640995200,
            open=float("nan"),
            high=float("nan"),
            low=float("nan"),
            close=float("nan"),
        )

        # NaN values should be converted to 0.0
        assert data.open == 0.0
        assert data.high == 0.0
        assert data.low == 0.0
        assert data.close == 0.0

    def test_zero_values(self):
        """Test handling of zero values."""
        data = BarData(time=1640995200, open=0.0, high=0.0, low=0.0, close=0.0)

        # Zero values should be valid
        assert data.open == 0.0
        assert data.high == 0.0
        assert data.low == 0.0
        assert data.close == 0.0

    def test_large_numbers(self):
        """Test handling of large numbers."""
        data = BarData(
            time=1640995200,
            open=1000000.0,
            high=1000001.0,
            low=999999.0,
            close=1000000.5,
        )

        assert data.open == 1000000.0
        assert data.high == 1000001.0
        assert data.low == 999999.0
        assert data.close == 1000000.5

    def test_small_decimals(self):
        """Test handling of small decimal numbers."""
        data = BarData(time=1640995200, open=0.000001, high=0.000002, low=0.000000, close=0.0000015)

        assert data.open == 0.000001
        assert data.high == 0.000002
        assert data.low == 0.000000
        assert data.close == 0.0000015

    def test_time_normalization_edge_cases(self):
        """Test time normalization edge cases."""
        # Test with numpy int64 (common in pandas) - stored as-is
        data = BarData(time=np.int64(1640995200), open=100.0, high=110.0, low=95.0, close=105.0)

        assert isinstance(data.time, np.int64)  # Stored as-is
        # Time is normalized in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200

    def test_json_serialization(self):
        """Test JSON serialization."""
        data = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#FF0000",
        )

        result = data.asdict()

        # Should be JSON serializable
        json_str = json.dumps(result)
        assert isinstance(json_str, str)

        # Should be deserializable
        parsed = json.loads(json_str)
        assert parsed == result


class TestBarDataComparison:
    """Test BarData comparison and equality."""

    def test_equality_same_values(self):
        """Test equality with same values."""
        data1 = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#FF0000",
        )

        data2 = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#FF0000",
        )

        assert data1 == data2

    def test_equality_different_colors(self):
        """Test equality with different colors."""
        data1 = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#FF0000",
        )

        data2 = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#00FF00",
        )

        assert data1 != data2

    def test_equality_one_with_color_one_without(self):
        """Test equality with one having color and one without."""
        data1 = BarData(
            time=1640995200,
            open=100.0,
            high=110.0,
            low=95.0,
            close=105.0,
            color="#FF0000",
        )

        data2 = BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0)

        assert data1 != data2


class TestBarDataIntegration:
    """Test BarData integration with other components."""

    def test_with_bar_series(self):
        """Test BarData with BarSeries."""
        data = [
            BarData(time=1640995200, open=100.0, high=110.0, low=95.0, close=105.0),
            BarData(
                time=1641081600,
                open=105.0,
                high=115.0,
                low=100.0,
                close=110.0,
                color="#FF0000",
            ),
        ]

        series = BarSeries(data=data)
        result = series.asdict()

        assert len(result["data"]) == 2
        assert result["data"][0]["time"] == 1640995200
        assert result["data"][0]["open"] == 100.0
        assert "color" not in result["data"][0]  # No color
        assert result["data"][1]["time"] == 1641081600
        assert result["data"][1]["open"] == 105.0
        assert result["data"][1]["color"] == "#FF0000"  # Has color

    def test_with_dataframe_conversion(self):
        """Test BarData with DataFrame conversion."""
        test_dataframe = pd.DataFrame(
            {
                "time": [1640995200, 1641081600],
                "open": [100.0, 105.0],
                "high": [110.0, 115.0],
                "low": [95.0, 100.0],
                "close": [105.0, 110.0],
                "color": ["#FF0000", "#00FF00"],
            },
        )

        series = BarSeries.from_dataframe(
            test_dataframe,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "color": "color",
            },
        )

        assert len(series.data) == 2
        assert all(isinstance(item, BarData) for item in series.data)
        assert series.data[0].color == "#FF0000"
        assert series.data[1].color == "#00FF00"
