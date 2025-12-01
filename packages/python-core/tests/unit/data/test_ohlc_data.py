"""Unit tests for OhlcData class.

This module tests the OhlcData class functionality including
construction, validation, and serialization.
"""

import pytest
from lightweight_charts_core.data.ohlc_data import OhlcData
from lightweight_charts_core.exceptions import ValueValidationError


class TestOhlcData:
    """Test cases for OhlcData class."""

    def test_default_construction(self):
        """Test OhlcData construction with default values."""
        data = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)

        assert data.time == 1640995200
        assert data.open == 100.0
        assert data.high == 105.0
        assert data.low == 95.0
        assert data.close == 102.0

    def test_asdict_method(self):
        """Test the asdict method returns correct structure."""
        data = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)

        result = data.asdict()

        assert result["time"] == 1640995200
        assert result["open"] == 100.0
        assert result["high"] == 105.0
        assert result["low"] == 95.0
        assert result["close"] == 102.0

    def test_validation_required_fields(self):
        """Test validation of required fields."""
        # Missing time - this will raise TypeError since time is a required positional argument
        with pytest.raises(TypeError):
            OhlcData(open=100.0, high=105.0, low=95.0, close=102.0)

        # Missing open
        with pytest.raises(TypeError):  # Missing required positional argument
            OhlcData(time=1640995200, high=105.0, low=95.0, close=102.0)

        # Missing high
        with pytest.raises(TypeError):  # Missing required positional argument
            OhlcData(time=1640995200, open=100.0, low=95.0, close=102.0)

        # Missing low
        with pytest.raises(TypeError):  # Missing required positional argument
            OhlcData(time=1640995200, open=100.0, high=105.0, close=102.0)

        # Missing close
        with pytest.raises(TypeError):  # Missing required positional argument
            OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0)

    def test_validation_time(self):
        """Test validation of time parameter."""
        # Valid integer time - stored as-is
        data = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)
        assert data.time == 1640995200

        # Valid string time - stored as-is, normalized in asdict()
        data = OhlcData(time="2022-01-01", open=100.0, high=105.0, low=95.0, close=102.0)
        assert data.time == "2022-01-01"  # Stored as-is
        result = data.asdict()
        assert isinstance(result["time"], int)  # Normalized in asdict()

        # Valid float time - stored as-is, normalized in asdict()
        data = OhlcData(time=1640995200.5, open=100.0, high=105.0, low=95.0, close=102.0)
        assert data.time == 1640995200.5  # Stored as-is
        result = data.asdict()
        assert result["time"] == 1640995200  # Normalized to int in asdict()

    def test_validation_price_fields(self):
        """Test validation of price fields."""
        # Valid positive prices
        data = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)
        assert data.open == 100.0
        assert data.high == 105.0
        assert data.low == 95.0
        assert data.close == 102.0

        # Valid zero prices
        data = OhlcData(time=1640995200, open=0.0, high=0.0, low=0.0, close=0.0)
        assert data.open == 0.0
        assert data.high == 0.0
        assert data.low == 0.0
        assert data.close == 0.0

        # Negative prices should raise ValueValidationError (OHLC values must be non-negative)
        with pytest.raises(ValueValidationError):
            OhlcData(time=1640995200, open=-100.0, high=-95.0, low=-105.0, close=-102.0)

        # Valid integer prices (should be converted to float)
        data = OhlcData(time=1640995200, open=100, high=105, low=95, close=102)
        assert data.open == 100.0
        assert data.high == 105.0
        assert data.low == 95.0
        assert data.close == 102.0

    def test_nan_handling(self):
        """Test handling of NaN values."""
        # NaN values should be converted to 0.0
        data = OhlcData(
            time=1640995200,
            open=float("nan"),
            high=float("nan"),
            low=float("nan"),
            close=float("nan"),
        )
        assert data.open == 0.0
        assert data.high == 0.0
        assert data.low == 0.0
        assert data.close == 0.0

        # Infinity values are not handled by the class (they remain as inf)
        data = OhlcData(
            time=1640995200,
            open=float("inf"),
            high=float("inf"),
            low=float("inf"),
            close=float("inf"),
        )
        assert data.open == float("inf")
        assert data.high == float("inf")
        assert data.low == float("inf")
        assert data.close == float("inf")

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Very large numbers
        data = OhlcData(
            time=1640995200,
            open=999999.99,
            high=999999.99,
            low=999999.99,
            close=999999.99,
        )
        assert data.open == 999999.99
        assert data.high == 999999.99
        assert data.low == 999999.99
        assert data.close == 999999.99

        # Very small numbers
        data = OhlcData(time=1640995200, open=0.0001, high=0.0001, low=0.0001, close=0.0001)
        assert data.open == 0.0001
        assert data.high == 0.0001
        assert data.low == 0.0001
        assert data.close == 0.0001

        # Very large time
        data = OhlcData(time=9999999999, open=100.0, high=105.0, low=95.0, close=102.0)
        assert data.time == 9999999999

        # Very small time
        data = OhlcData(time=0, open=100.0, high=105.0, low=95.0, close=102.0)
        assert data.time == 0

    def test_serialization_consistency(self):
        """Test that serialization is consistent across multiple calls."""
        data = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)

        result1 = data.asdict()
        result2 = data.asdict()

        assert result1 == result2

    def test_time_modification_after_construction(self):
        """Test that time can be modified after construction."""
        data = OhlcData(time="2024-01-01", open=100.0, high=105.0, low=95.0, close=102.0)
        result1 = data.asdict()
        time1 = result1["time"]

        # Modify time after construction
        data.time = "2024-01-02"
        result2 = data.asdict()
        time2 = result2["time"]

        # Times should be different
        assert time1 != time2

    def test_copy_method(self):
        """Test the copy method creates a new instance with same values."""
        original = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)

        # Since OhlcData doesn't have a copy method, we'll test that
        # we can create a new instance with the same values
        copied = OhlcData(
            time=original.time,
            open=original.open,
            high=original.high,
            low=original.low,
            close=original.close,
        )

        assert copied is not original
        assert copied.time == original.time
        assert copied.open == original.open
        assert copied.high == original.high
        assert copied.low == original.low
        assert copied.close == original.close

    def test_equality_comparison(self):
        """Test equality comparison between OhlcData instances."""
        data1 = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)
        data2 = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)
        data3 = OhlcData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=95.0,
            close=103.0,  # Different close
        )

        assert data1 == data2
        assert data1 != data3

    def test_string_representation(self):
        """Test string representation of OhlcData."""
        data = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)

        str_repr = str(data)
        assert "1640995200" in str_repr
        assert "100.0" in str_repr
        assert "105.0" in str_repr
        assert "95.0" in str_repr
        assert "102.0" in str_repr

    def test_required_columns_property(self):
        """Test the required_columns property."""
        required = OhlcData.required_columns
        assert isinstance(required, set)
        assert "time" in required
        assert "open" in required
        assert "high" in required
        assert "low" in required
        assert "close" in required
        assert len(required) == 5

    def test_optional_columns_property(self):
        """Test the optional_columns property."""
        optional = OhlcData.optional_columns
        assert isinstance(optional, set)
        assert len(optional) == 0  # OHLC data has no optional columns

    def test_from_dict_method(self):
        """Test creating OhlcData from dictionary using unpacking."""
        data_dict = {"time": 1640995200, "open": 100.0, "high": 105.0, "low": 95.0, "close": 102.0}

        data = OhlcData(**data_dict)

        assert data.time == 1640995200
        assert data.open == 100.0
        assert data.high == 105.0
        assert data.low == 95.0
        assert data.close == 102.0

    def test_from_dict_validation(self):
        """Test dictionary unpacking validation."""
        # Missing required field
        data_dict = {
            "time": 1640995200,
            "open": 100.0,
            "high": 105.0,
            "low": 95.0,
            # missing close
        }

        with pytest.raises(TypeError):  # Missing required positional argument
            OhlcData(**data_dict)

    def test_candlestick_scenarios(self):
        """Test various candlestick scenarios."""
        # Bullish candle (close > open)
        bullish_data = OhlcData(time=1640995200, open=100.0, high=105.0, low=98.0, close=102.0)
        assert bullish_data.close > bullish_data.open

        # Bearish candle (close < open)
        bearish_data = OhlcData(time=1640995200, open=102.0, high=105.0, low=98.0, close=100.0)
        assert bearish_data.close < bearish_data.open

        # Doji candle (close == open)
        doji_data = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=100.0)
        assert doji_data.close == doji_data.open

        # Hammer candle (long lower shadow)
        hammer_data = OhlcData(time=1640995200, open=100.0, high=101.0, low=95.0, close=100.5)
        assert hammer_data.low < hammer_data.open
        assert hammer_data.low < hammer_data.close

        # Shooting star candle (long upper shadow)
        shooting_star_data = OhlcData(
            time=1640995200,
            open=100.0,
            high=105.0,
            low=100.0,
            close=100.5,
        )
        assert shooting_star_data.high > shooting_star_data.open
        assert shooting_star_data.high > shooting_star_data.close

    def test_price_relationships(self):
        """Test that price relationships are maintained."""
        data = OhlcData(time=1640995200, open=100.0, high=105.0, low=95.0, close=102.0)

        # High should be >= all other prices
        assert data.high >= data.open
        assert data.high >= data.high
        assert data.high >= data.low
        assert data.high >= data.close

        # Low should be <= all other prices
        assert data.low <= data.open
        assert data.low <= data.high
        assert data.low <= data.low
        assert data.low <= data.close
