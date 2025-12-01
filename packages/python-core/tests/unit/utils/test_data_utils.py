"""Unit tests for data utilities module.

Tests data processing utilities including:
- Time normalization and conversion
- Color validation
- String format conversion
- Price format validation
- Precision and minimum move validation
"""

from datetime import datetime

import pandas as pd
import pytest
from lightweight_charts_core.exceptions import (
    TimeValidationError,
    UnsupportedTimeTypeError,
    ValueValidationError,
)
from lightweight_charts_core.utils.data_utils import (
    from_utc_timestamp,
    is_valid_color,
    normalize_time,
    snake_to_camel,
    to_utc_timestamp,
    validate_min_move,
    validate_precision,
    validate_price_format_type,
)


class TestNormalizeTime:
    """Tests for normalize_time function."""

    def test_int_input(self):
        """Test with integer input."""
        result = normalize_time(1640995200)
        assert result == 1640995200
        assert isinstance(result, int)

    def test_float_input(self):
        """Test with float input."""
        result = normalize_time(1640995200.5)
        assert result == 1640995200
        assert isinstance(result, int)

    def test_string_input_iso_format(self):
        """Test with ISO format string."""
        result = normalize_time("2024-01-01T00:00:00")
        assert isinstance(result, int)
        assert result > 0

    def test_string_input_date_only(self):
        """Test with date-only string."""
        result = normalize_time("2024-01-01")
        assert isinstance(result, int)
        assert result > 0

    def test_datetime_input(self):
        """Test with datetime object."""
        dt = datetime(2024, 1, 1, 0, 0, 0)
        result = normalize_time(dt)
        assert isinstance(result, int)
        assert result > 0

    def test_pandas_timestamp_input(self):
        """Test with pandas Timestamp."""
        ts = pd.Timestamp("2024-01-01")
        result = normalize_time(ts)
        assert isinstance(result, int)
        assert result > 0

    def test_invalid_string(self):
        """Test with invalid string."""
        with pytest.raises(TimeValidationError):
            normalize_time("invalid-date")

    def test_unsupported_type(self):
        """Test with unsupported type."""
        with pytest.raises(UnsupportedTimeTypeError):
            normalize_time([1, 2, 3])

    def test_none_input(self):
        """Test with None input."""
        with pytest.raises(UnsupportedTimeTypeError):
            normalize_time(None)

    def test_numpy_int(self):
        """Test with numpy integer."""
        try:
            import numpy as np

            np_int = np.int64(1640995200)
            result = normalize_time(np_int)
            assert result == 1640995200
        except ImportError:
            pytest.skip("NumPy not available")

    def test_numpy_float(self):
        """Test with numpy float."""
        try:
            import numpy as np

            np_float = np.float64(1640995200.5)
            result = normalize_time(np_float)
            assert result == 1640995200
        except ImportError:
            pytest.skip("NumPy not available")


class TestToUtcTimestamp:
    """Tests for to_utc_timestamp function."""

    def test_alias_functionality(self):
        """Test that to_utc_timestamp is an alias for normalize_time."""
        input_value = 1640995200
        result1 = normalize_time(input_value)
        result2 = to_utc_timestamp(input_value)
        assert result1 == result2

    def test_various_inputs(self):
        """Test with various input types."""
        inputs = [
            1640995200,
            1640995200.0,
            "2024-01-01",
            datetime(2024, 1, 1),
            pd.Timestamp("2024-01-01"),
        ]

        for inp in inputs:
            result = to_utc_timestamp(inp)
            assert isinstance(result, int)
            assert result > 0


class TestFromUtcTimestamp:
    """Tests for from_utc_timestamp function."""

    def test_valid_timestamp(self):
        """Test with valid timestamp."""
        result = from_utc_timestamp(1640995200)
        assert isinstance(result, str)
        assert "2022" in result

    def test_zero_timestamp(self):
        """Test with epoch timestamp."""
        result = from_utc_timestamp(0)
        assert isinstance(result, str)
        assert "1970" in result

    def test_recent_timestamp(self):
        """Test with recent timestamp."""
        result = from_utc_timestamp(1704067200)  # 2024-01-01
        assert isinstance(result, str)
        assert "2024" in result

    def test_iso_format(self):
        """Test that output is in ISO format."""
        result = from_utc_timestamp(1640995200)
        assert "T" in result  # ISO format includes T separator
        assert ":" in result  # ISO format includes time


class TestSnakeToCamel:
    """Tests for snake_to_camel function."""

    def test_simple_conversion(self):
        """Test simple snake_case to camelCase."""
        result = snake_to_camel("price_scale_id")
        assert result == "priceScaleId"

    def test_single_word(self):
        """Test with single word (no underscores)."""
        result = snake_to_camel("price")
        assert result == "price"

    def test_multiple_underscores(self):
        """Test with multiple underscores."""
        result = snake_to_camel("background_color_value")
        assert result == "backgroundColorValue"

    def test_empty_string(self):
        """Test with empty string."""
        result = snake_to_camel("")
        assert result == ""

    def test_already_camel(self):
        """Test with already camelCase string."""
        result = snake_to_camel("alreadyCamel")
        assert result == "alreadyCamel"


class TestIsValidColor:
    """Tests for is_valid_color function."""

    def test_valid_hex_6_digit(self):
        """Test valid 6-digit hex color."""
        assert is_valid_color("#FF0000") is True
        assert is_valid_color("#00FF00") is True
        assert is_valid_color("#0000FF") is True

    def test_valid_hex_3_digit(self):
        """Test valid 3-digit hex color."""
        assert is_valid_color("#F00") is True
        assert is_valid_color("#0F0") is True
        assert is_valid_color("#00F") is True

    def test_valid_hex_8_digit_with_alpha(self):
        """Test valid 8-digit hex color with alpha."""
        assert is_valid_color("#FF0000FF") is True
        assert is_valid_color("#00FF0080") is True

    def test_valid_hex_4_digit_with_alpha(self):
        """Test valid 4-digit hex color with alpha."""
        assert is_valid_color("#F00F") is True
        assert is_valid_color("#0F08") is True

    def test_valid_rgb(self):
        """Test valid RGB color."""
        assert is_valid_color("rgb(255, 0, 0)") is True
        assert is_valid_color("rgb(0,255,0)") is True
        assert is_valid_color("rgb( 0 , 0 , 255 )") is True

    def test_valid_rgba(self):
        """Test valid RGBA color."""
        assert is_valid_color("rgba(255, 0, 0, 1)") is True
        assert is_valid_color("rgba(0, 255, 0, 0.5)") is True
        assert is_valid_color("rgba(0,0,255,0.25)") is True

    def test_valid_named_colors(self):
        """Test valid named colors."""
        named_colors = [
            "red",
            "blue",
            "green",
            "white",
            "black",
            "yellow",
            "cyan",
            "magenta",
            "gray",
            "orange",
            "purple",
            "pink",
            "transparent",
        ]
        for color in named_colors:
            assert is_valid_color(color) is True

    def test_named_colors_case_insensitive(self):
        """Test that named colors are case-insensitive."""
        assert is_valid_color("RED") is True
        assert is_valid_color("Blue") is True
        assert is_valid_color("GREEN") is True

    def test_invalid_hex_wrong_length(self):
        """Test invalid hex color with wrong length."""
        assert is_valid_color("#FF") is False  # 2 hex digits (invalid)
        assert is_valid_color("#FF000") is False  # 5 hex digits (invalid)
        assert is_valid_color("#FF00000") is False  # 7 hex digits (invalid)
        assert is_valid_color("#FF0000000") is False  # 9 hex digits (invalid)

    def test_invalid_hex_characters(self):
        """Test invalid hex color with non-hex characters."""
        assert is_valid_color("#GG0000") is False
        assert is_valid_color("#ZZZZZZ") is False

    def test_invalid_hex_no_hash(self):
        """Test hex color without hash symbol."""
        assert is_valid_color("FF0000") is False

    def test_invalid_rgb_format(self):
        """Test invalid RGB format."""
        assert is_valid_color("rgb(255)") is False
        assert is_valid_color("rgb(255, 0)") is False
        assert is_valid_color("rgb(300, 0, 0)") is True  # Still valid pattern

    def test_invalid_named_color(self):
        """Test invalid named color."""
        assert is_valid_color("invalidcolor") is False
        assert is_valid_color("notacolor") is False

    def test_empty_string(self):
        """Test empty string."""
        assert is_valid_color("") is False

    def test_non_string_input(self):
        """Test non-string input."""
        assert is_valid_color(123) is False
        assert is_valid_color(None) is False
        assert is_valid_color([]) is False


class TestValidatePriceFormatType:
    """Tests for validate_price_format_type function."""

    def test_valid_price(self):
        """Test valid 'price' type."""
        result = validate_price_format_type("price")
        assert result == "price"

    def test_valid_volume(self):
        """Test valid 'volume' type."""
        result = validate_price_format_type("volume")
        assert result == "volume"

    def test_valid_percent(self):
        """Test valid 'percent' type."""
        result = validate_price_format_type("percent")
        assert result == "percent"

    def test_valid_custom(self):
        """Test valid 'custom' type."""
        result = validate_price_format_type("custom")
        assert result == "custom"

    def test_invalid_type(self):
        """Test invalid type."""
        with pytest.raises(ValueValidationError):
            validate_price_format_type("invalid")

    def test_case_sensitive(self):
        """Test that validation is case-sensitive."""
        with pytest.raises(ValueValidationError):
            validate_price_format_type("PRICE")

    def test_empty_string(self):
        """Test with empty string."""
        with pytest.raises(ValueValidationError):
            validate_price_format_type("")


class TestValidatePrecision:
    """Tests for validate_precision function."""

    def test_valid_zero(self):
        """Test valid precision of 0."""
        result = validate_precision(0)
        assert result == 0

    def test_valid_positive(self):
        """Test valid positive precision."""
        for precision in [1, 2, 5, 8, 10]:
            result = validate_precision(precision)
            assert result == precision

    def test_invalid_negative(self):
        """Test invalid negative precision."""
        with pytest.raises(ValueValidationError):
            validate_precision(-1)

    def test_invalid_float(self):
        """Test invalid float precision."""
        with pytest.raises(ValueValidationError):
            validate_precision(2.5)

    def test_invalid_string(self):
        """Test invalid string precision."""
        with pytest.raises(ValueValidationError):
            validate_precision("2")

    def test_large_precision(self):
        """Test large precision value."""
        result = validate_precision(100)
        assert result == 100


class TestValidateMinMove:
    """Tests for validate_min_move function."""

    def test_valid_small_value(self):
        """Test valid small minimum move."""
        result = validate_min_move(0.001)
        assert result == 0.001
        assert isinstance(result, float)

    def test_valid_integer(self):
        """Test valid integer minimum move."""
        result = validate_min_move(1)
        assert result == 1.0
        assert isinstance(result, float)

    def test_valid_large_value(self):
        """Test valid large minimum move."""
        result = validate_min_move(100.0)
        assert result == 100.0

    def test_invalid_zero(self):
        """Test invalid zero minimum move."""
        with pytest.raises(ValueValidationError):
            validate_min_move(0)

    def test_invalid_negative(self):
        """Test invalid negative minimum move."""
        with pytest.raises(ValueValidationError):
            validate_min_move(-0.1)

    def test_invalid_string(self):
        """Test invalid string minimum move."""
        with pytest.raises(ValueValidationError):
            validate_min_move("1.0")

    def test_very_small_value(self):
        """Test very small minimum move."""
        result = validate_min_move(0.0001)
        assert result == 0.0001


class TestDataUtilsIntegration:
    """Integration tests for data utilities."""

    def test_time_conversion_round_trip(self):
        """Test converting time back and forth."""
        original_dt = datetime(2024, 1, 1, 12, 30, 45)
        timestamp = normalize_time(original_dt)
        iso_string = from_utc_timestamp(timestamp)

        assert isinstance(timestamp, int)
        assert isinstance(iso_string, str)
        assert "2024" in iso_string

    def test_color_validation_pipeline(self):
        """Test color validation with various formats."""
        colors = [
            "#FF0000",
            "#F00",
            "rgb(255, 0, 0)",
            "rgba(255, 0, 0, 1)",
            "red",
        ]

        for color in colors:
            assert is_valid_color(color) is True

    def test_validation_chain(self):
        """Test chaining multiple validations."""
        # Validate precision
        precision = validate_precision(2)
        assert precision == 2

        # Validate min move
        min_move = validate_min_move(0.01)
        assert min_move == 0.01

        # Validate price format type
        price_type = validate_price_format_type("price")
        assert price_type == "price"

    def test_string_conversion_for_frontend(self):
        """Test string conversion for frontend compatibility."""
        python_keys = [
            "price_scale_id",
            "background_color",
            "line_width",
            "time_scale_options",
        ]

        for key in python_keys:
            camel = snake_to_camel(key)
            assert "_" not in camel or key == camel  # No underscores in camelCase

    def test_time_normalization_consistency(self):
        """Test that different input formats produce consistent results."""
        dt = datetime(2024, 1, 1)
        pd_ts = pd.Timestamp("2024-01-01")
        str_dt = "2024-01-01T00:00:00"

        result1 = normalize_time(dt)
        result2 = normalize_time(pd_ts)
        result3 = normalize_time(str_dt)

        # All should produce similar timestamps (within 1 day due to timezone)
        assert abs(result1 - result2) < 86400
        assert abs(result2 - result3) < 86400
