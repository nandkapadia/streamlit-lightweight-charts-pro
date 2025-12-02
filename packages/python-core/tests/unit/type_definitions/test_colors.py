"""Unit tests for colors module.

This module tests the color validation and background classes in the colors module.
"""

import pytest
from lightweight_charts_core.exceptions import ColorValidationError
from lightweight_charts_core.type_definitions.colors import (
    Background,
    BackgroundGradient,
    BackgroundSolid,
)
from lightweight_charts_core.type_definitions.enums import BackgroundStyle
from lightweight_charts_core.utils.data_utils import is_valid_color


class TestIsValidColor:
    """Test the is_valid_color function."""

    def test_valid_hex_colors_3_digits(self):
        """Test valid 3-digit hex colors."""
        valid_colors = ["#fff", "#000", "#abc", "#DEF", "#123", "#456", "#789"]
        for color in valid_colors:
            assert is_valid_color(color) is True

    def test_valid_hex_colors_6_digits(self):
        """Test valid 6-digit hex colors."""
        valid_colors = ["#ffffff", "#000000", "#abcdef", "#ABCDEF", "#123456", "#789abc"]
        for color in valid_colors:
            assert is_valid_color(color) is True

    def test_valid_hex_colors_4_digits(self):
        """Test valid 4-digit hex colors with alpha channel (#RGBA)."""
        valid_colors = ["#ffff", "#0000", "#abcd", "#ABCD", "#1234", "#5678", "#f00a"]
        for color in valid_colors:
            assert is_valid_color(color) is True

    def test_valid_hex_colors_8_digits(self):
        """Test valid 8-digit hex colors with alpha channel (#RRGGBBAA)."""
        valid_colors = [
            "#ffffff00",
            "#00000000",
            "#abcdef80",
            "#ABCDEF80",
            "#12345678",
            "#00ff0033",
        ]
        for color in valid_colors:
            assert is_valid_color(color) is True

    def test_invalid_hex_colors(self):
        """Test invalid hex colors."""
        invalid_colors = ["#ff", "#fffffff", "#ggg", "#123g", "#", "#abcde"]
        for color in invalid_colors:
            assert is_valid_color(color) is False

    def test_valid_rgb_colors(self):
        """Test valid RGB colors."""
        valid_colors = [
            "rgb(255, 255, 255)",
            "rgb(0, 0, 0)",
            "rgb(123, 456, 789)",
            "rgb(255,255,255)",
            "rgb(0,0,0)",
        ]
        for color in valid_colors:
            assert is_valid_color(color) is True

    def test_valid_rgba_colors(self):
        """Test valid RGBA colors."""
        valid_colors = [
            "rgba(255, 255, 255, 1)",
            "rgba(0, 0, 0, 0)",
            "rgba(123, 456, 789, 0.5)",
            "rgba(255,255,255,1)",
            "rgba(0,0,0,0.5)",
            "rgba(255, 255, 255, 0.123)",
        ]
        for color in valid_colors:
            assert is_valid_color(color) is True

    def test_invalid_rgba_colors(self):
        """Test invalid RGBA colors."""
        invalid_colors = [
            "rgba(255, 255)",  # Too few components
            "rgba(255, 255, 255, 1, 1)",  # Too many components
            "rgba(abc, def, ghi, 1)",  # Non-numeric values
        ]
        for color in invalid_colors:
            assert is_valid_color(color) is False

    def test_valid_named_colors(self):
        """Test valid named colors."""
        valid_colors = [
            "black",
            "white",
            "red",
            "green",
            "blue",
            "yellow",
            "cyan",
            "magenta",
            "gray",
            "grey",
            "orange",
            "purple",
            "brown",
            "pink",
            "lime",
            "navy",
            "teal",
            "silver",
            "gold",
            "maroon",
            "olive",
            "aqua",
            "fuchsia",
            "BLACK",
            "White",
            "Red",
            "GREEN",
            "Blue",
        ]
        for color in valid_colors:
            assert is_valid_color(color) is True

    def test_invalid_named_colors(self):
        """Test invalid named colors."""
        invalid_colors = ["invalid", "notacolor", "random", "test", "color123"]
        for color in invalid_colors:
            assert is_valid_color(color) is False

    def test_invalid_input_types(self):
        """Test invalid input types."""
        invalid_inputs = [None, 123, 0.5, True, False, [], {}, ()]
        for invalid_input in invalid_inputs:
            assert is_valid_color(invalid_input) is False

    def test_empty_string(self):
        """Test empty string input."""
        assert is_valid_color("") is False

    def test_whitespace_string(self):
        """Test whitespace string input."""
        assert is_valid_color("   ") is False


class TestBackgroundSolid:
    """Test the BackgroundSolid class."""

    def test_default_construction(self):
        """Test default construction."""
        background = BackgroundSolid()
        assert background.color == "#ffffff"
        assert background.style == BackgroundStyle.SOLID

    def test_custom_construction(self):
        """Test construction with custom values."""
        background = BackgroundSolid(color="#ff0000")
        assert background.color == "#ff0000"
        assert background.style == BackgroundStyle.SOLID

    def test_valid_hex_color(self):
        """Test with valid hex color."""
        background = BackgroundSolid(color="#123456")
        assert background.color == "#123456"

    def test_valid_rgb_color(self):
        """Test with valid RGB color."""
        background = BackgroundSolid(color="rgb(255, 0, 0)")
        assert background.color == "rgb(255, 0, 0)"

    def test_valid_rgba_color(self):
        """Test with valid RGBA color."""
        background = BackgroundSolid(color="rgba(255, 0, 0, 0.5)")
        assert background.color == "rgba(255, 0, 0, 0.5)"

    def test_valid_named_color(self):
        """Test with valid named color."""
        background = BackgroundSolid(color="red")
        assert background.color == "red"

    def test_invalid_color_raises_value_error(self):
        """Test that invalid color raises ColorValidationError."""
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            BackgroundSolid(color="invalid_color")

    def test_empty_color_raises_value_error(self):
        """Test that empty color raises ColorValidationError."""
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            BackgroundSolid(color="")

    def test_none_color_raises_value_error(self):
        """Test that None color raises ColorValidationError."""
        with pytest.raises(ColorValidationError, match="Invalid color format"):
            BackgroundSolid(color=None)

    def test_to_dict_method(self):
        """Test to_dict method."""
        background = BackgroundSolid(color="#ff0000")
        result = background.asdict()
        expected = {"color": "#ff0000", "style": "solid"}
        assert result == expected

    def test_to_dict_with_default_values(self):
        """Test to_dict method with default values."""
        background = BackgroundSolid()
        result = background.asdict()
        expected = {"color": "#ffffff", "style": "solid"}
        assert result == expected


class TestBackgroundGradient:
    """Test the BackgroundGradient class."""

    def test_default_construction(self):
        """Test default construction."""
        background = BackgroundGradient()
        assert background.top_color == "#ffffff"
        assert background.bottom_color == "#000000"
        assert background.style == BackgroundStyle.VERTICAL_GRADIENT

    def test_custom_construction(self):
        """Test construction with custom values."""
        background = BackgroundGradient(top_color="#ff0000", bottom_color="#00ff00")
        assert background.top_color == "#ff0000"
        assert background.bottom_color == "#00ff00"
        assert background.style == BackgroundStyle.VERTICAL_GRADIENT

    def test_valid_hex_colors(self):
        """Test with valid hex colors."""
        background = BackgroundGradient(top_color="#123456", bottom_color="#abcdef")
        assert background.top_color == "#123456"
        assert background.bottom_color == "#abcdef"

    def test_valid_rgb_colors(self):
        """Test with valid RGB colors."""
        background = BackgroundGradient(top_color="rgb(255, 0, 0)", bottom_color="rgb(0, 255, 0)")
        assert background.top_color == "rgb(255, 0, 0)"
        assert background.bottom_color == "rgb(0, 255, 0)"

    def test_valid_rgba_colors(self):
        """Test with valid RGBA colors."""
        background = BackgroundGradient(
            top_color="rgba(255, 0, 0, 0.5)",
            bottom_color="rgba(0, 255, 0, 0.8)",
        )
        assert background.top_color == "rgba(255, 0, 0, 0.5)"
        assert background.bottom_color == "rgba(0, 255, 0, 0.8)"

    def test_valid_named_colors(self):
        """Test with valid named colors."""
        background = BackgroundGradient(top_color="red", bottom_color="blue")
        assert background.top_color == "red"
        assert background.bottom_color == "blue"

    def test_invalid_top_color_raises_value_error(self):
        """Test that invalid top color raises ColorValidationError."""
        with pytest.raises(ColorValidationError, match="Invalid color format for top_color"):
            BackgroundGradient(top_color="invalid_color")

    def test_invalid_bottom_color_raises_value_error(self):
        """Test that invalid bottom color raises ColorValidationError."""
        with pytest.raises(ColorValidationError, match="Invalid color format for bottom_color"):
            BackgroundGradient(bottom_color="invalid_color")

    def test_to_dict_method(self):
        """Test to_dict method."""
        background = BackgroundGradient(top_color="#ff0000", bottom_color="#00ff00")
        result = background.asdict()
        expected = {"topColor": "#ff0000", "bottomColor": "#00ff00", "style": "gradient"}
        assert result == expected

    def test_to_dict_with_default_values(self):
        """Test to_dict method with default values."""
        background = BackgroundGradient()
        result = background.asdict()
        expected = {"topColor": "#ffffff", "bottomColor": "#000000", "style": "gradient"}
        assert result == expected


class TestBackgroundUnion:
    """Test the Background union type."""

    def test_background_solid_is_background(self):
        """Test that BackgroundSolid is a valid Background."""
        background: Background = BackgroundSolid()
        assert isinstance(background, BackgroundSolid)

    def test_background_gradient_is_background(self):
        """Test that BackgroundGradient is a valid Background."""
        background: Background = BackgroundGradient()
        assert isinstance(background, BackgroundGradient)

    def test_background_union_accepts_both_types(self):
        """Test that Background union accepts both types."""
        backgrounds: list[Background] = [
            BackgroundSolid(color="#ff0000"),
            BackgroundGradient(top_color="#ff0000", bottom_color="#00ff00"),
        ]
        assert len(backgrounds) == 2
        assert isinstance(backgrounds[0], BackgroundSolid)
        assert isinstance(backgrounds[1], BackgroundGradient)


class TestBackgroundErrorMessages:
    """Test error messages for background validation."""

    def test_background_solid_error_message_format(self):
        """Test error message format for BackgroundSolid."""
        with pytest.raises(ColorValidationError) as exc_info:
            BackgroundSolid(color="invalid")
        assert "Invalid color format for color: 'invalid'" in str(exc_info.value)
        assert "Must be hex or rgba" in str(exc_info.value)

    def test_background_gradient_top_color_error_message(self):
        """Test error message format for BackgroundGradient top color."""
        with pytest.raises(ColorValidationError) as exc_info:
            BackgroundGradient(top_color="invalid")
        assert "Invalid color format for top_color: 'invalid'" in str(exc_info.value)
        assert "Must be hex or rgba" in str(exc_info.value)

    def test_background_gradient_bottom_color_error_message(self):
        """Test error message format for BackgroundGradient bottom color."""
        with pytest.raises(ColorValidationError) as exc_info:
            BackgroundGradient(bottom_color="invalid")
        assert "Invalid color format for bottom_color: 'invalid'" in str(exc_info.value)
        assert "Must be hex or rgba" in str(exc_info.value)
