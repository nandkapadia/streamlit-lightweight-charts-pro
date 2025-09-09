"""
Unit tests for colors module.

This module tests the color validation and background classes in the colors module.
"""

import pytest

from streamlit_lightweight_charts_pro.type_definitions.colors import (
    Background,
    BackgroundGradient,
    BackgroundSolid,
    _is_valid_color,
)
from streamlit_lightweight_charts_pro.type_definitions.enums import BackgroundStyle


class TestIsValidColor:
    """Test the _is_valid_color function."""

    def test_valid_hex_colors_3_digits(self):
        """Test valid 3-digit hex colors."""
        valid_colors = ["#fff", "#000", "#abc", "#DEF", "#123", "#456", "#789"]
        for color in valid_colors:
            assert _is_valid_color(color) is True

    def test_valid_hex_colors_6_digits(self):
        """Test valid 6-digit hex colors."""
        valid_colors = ["#ffffff", "#000000", "#abcdef", "#ABCDEF", "#123456", "#789abc"]
        for color in valid_colors:
            assert _is_valid_color(color) is True

    def test_invalid_hex_colors(self):
        """Test invalid hex colors."""
        invalid_colors = ["#ff", "#ffff", "#fffffff", "#ggg", "#123g", "#", "#abcde"]
        for color in invalid_colors:
            assert _is_valid_color(color) is False

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
            assert _is_valid_color(color) is True

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
            assert _is_valid_color(color) is True

    def test_invalid_rgba_colors(self):
        """Test invalid RGBA colors."""
        invalid_colors = [
            "rgba(255, 255)",  # Too few components
            "rgba(255, 255, 255, 1, 1)",  # Too many components
            "rgba(abc, def, ghi, 1)",  # Non-numeric values
        ]
        for color in invalid_colors:
            assert _is_valid_color(color) is False

    def test_rgba_alpha_values(self):
        """Test RGBA alpha values (regex accepts any decimal)."""
        valid_colors = [
            "rgba(255, 255, 255, 1.5)",  # Alpha > 1 - accepted by regex
            "rgba(255, 255, 255, 2.0)",  # Alpha > 1 - accepted by regex
            "rgba(255, 255, 255, 0.5)",  # Normal alpha - accepted
        ]
        for color in valid_colors:
            assert _is_valid_color(color) is True

    def test_rgba_negative_alpha_values(self):
        """Test RGBA negative alpha values (permissive validator accepts them)."""
        valid_colors = [
            "rgba(255, 255, 255, -0.1)",  # Negative alpha - accepted by permissive validator
            "rgba(255, 255, 255, -0.5)",  # Negative alpha - accepted by permissive validator
            "rgba(255, 255, 255, -1.0)",  # Negative alpha - accepted by permissive validator
        ]
        for color in valid_colors:
            assert _is_valid_color(color) is True

    def test_rgba_without_alpha_is_valid(self):
        """Test that rgba without alpha is valid (treated as rgb)."""
        valid_colors = [
            "rgba(255, 255, 255)",  # Missing alpha - valid as rgb
            "rgba(0, 0, 0)",  # Missing alpha - valid as rgb
        ]
        for color in valid_colors:
            assert _is_valid_color(color) is True

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
            # Test case insensitivity
            "BLACK",
            "White",
            "Red",
            "GREEN",
            "Blue",
        ]
        for color in valid_colors:
            assert _is_valid_color(color) is True

    def test_invalid_named_colors(self):
        """Test invalid named colors."""
        invalid_colors = ["invalid", "notacolor", "random", "test", "color123"]
        for color in invalid_colors:
            assert _is_valid_color(color) is False

    def test_invalid_input_types(self):
        """Test invalid input types."""
        invalid_inputs = [None, 123, 0.5, True, False, [], {}, ()]
        for invalid_input in invalid_inputs:
            assert _is_valid_color(invalid_input) is False

    def test_empty_string(self):
        """Test empty string input."""
        assert _is_valid_color("") is False

    def test_whitespace_string(self):
        """Test whitespace string input."""
        assert _is_valid_color("   ") is False


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
        """Test that invalid color raises ValueError."""
        with pytest.raises(ValueError, match="Invalid color format"):
            BackgroundSolid(color="invalid_color")

    def test_empty_color_raises_value_error(self):
        """Test that empty color raises ValueError."""
        with pytest.raises(ValueError, match="Invalid color format"):
            BackgroundSolid(color="")

    def test_none_color_raises_value_error(self):
        """Test that None color raises ValueError."""
        with pytest.raises(ValueError, match="Invalid color format"):
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

    def test_style_can_be_changed(self):
        """Test that style can be changed after initialization."""
        background = BackgroundSolid()
        assert background.style == BackgroundStyle.SOLID
        # Style can be changed since dataclass fields are not frozen
        background.style = BackgroundStyle.VERTICAL_GRADIENT
        assert background.style == BackgroundStyle.VERTICAL_GRADIENT


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
            top_color="rgba(255, 0, 0, 0.5)", bottom_color="rgba(0, 255, 0, 0.8)"
        )
        assert background.top_color == "rgba(255, 0, 0, 0.5)"
        assert background.bottom_color == "rgba(0, 255, 0, 0.8)"

    def test_valid_named_colors(self):
        """Test with valid named colors."""
        background = BackgroundGradient(top_color="red", bottom_color="blue")
        assert background.top_color == "red"
        assert background.bottom_color == "blue"

    def test_invalid_top_color_raises_value_error(self):
        """Test that invalid top color raises ValueError."""
        with pytest.raises(ValueError, match="Invalid top_color format"):
            BackgroundGradient(top_color="invalid_color")

    def test_invalid_bottom_color_raises_value_error(self):
        """Test that invalid bottom color raises ValueError."""
        with pytest.raises(ValueError, match="Invalid bottom_color format"):
            BackgroundGradient(bottom_color="invalid_color")

    def test_both_invalid_colors_raises_value_error(self):
        """Test that both invalid colors raises ValueError."""
        with pytest.raises(ValueError, match="Invalid top_color format"):
            BackgroundGradient(top_color="invalid_top", bottom_color="invalid_bottom")

    def test_empty_colors_raise_value_error(self):
        """Test that empty colors raise ValueError."""
        with pytest.raises(ValueError, match="Invalid top_color format"):
            BackgroundGradient(top_color="")

        with pytest.raises(ValueError, match="Invalid bottom_color format"):
            BackgroundGradient(bottom_color="")

    def test_none_colors_raise_value_error(self):
        """Test that None colors raise ValueError."""
        with pytest.raises(ValueError, match="Invalid top_color format"):
            BackgroundGradient(top_color=None)

        with pytest.raises(ValueError, match="Invalid bottom_color format"):
            BackgroundGradient(bottom_color=None)

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

    def test_style_can_be_changed(self):
        """Test that style can be changed after initialization."""
        background = BackgroundGradient()
        assert background.style == BackgroundStyle.VERTICAL_GRADIENT
        # Style can be changed since dataclass fields are not frozen
        background.style = BackgroundStyle.SOLID
        assert background.style == BackgroundStyle.SOLID


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


class TestColorValidationEdgeCases:
    """Test edge cases for color validation."""

    def test_hex_colors_with_spaces(self):
        """Test hex colors with spaces (should be invalid)."""
        invalid_colors = [" #fff", "#fff ", " #fff "]
        for color in invalid_colors:
            assert _is_valid_color(color) is False

    def test_rgb_colors_with_extra_spaces(self):
        """Test RGB colors with extra spaces."""
        valid_colors = ["rgb(  255  ,  255  ,  255  )", "rgb(0,0,0)", "rgb( 0 , 0 , 0 )"]
        for color in valid_colors:
            assert _is_valid_color(color) is True

    def test_rgba_colors_with_extra_spaces(self):
        """Test RGBA colors with extra spaces."""
        valid_colors = [
            "rgba(  255  ,  255  ,  255  ,  1  )",
            "rgba(0,0,0,0)",
            "rgba( 0 , 0 , 0 , 0.5 )",
        ]
        for color in valid_colors:
            assert _is_valid_color(color) is True

    def test_mixed_case_hex_colors(self):
        """Test mixed case hex colors."""
        valid_colors = ["#FfF", "#aBc", "#DEF", "#123AbC"]
        for color in valid_colors:
            assert _is_valid_color(color) is True

    def test_named_colors_with_spaces(self):
        """Test named colors with spaces (should be invalid)."""
        invalid_colors = [" red", "red ", " red "]
        for color in invalid_colors:
            assert _is_valid_color(color) is False

    def test_special_characters_in_colors(self):
        """Test colors with special characters."""
        invalid_colors = ["#fff!", "rgb(255,255,255)!", "red!", "color@123"]
        for color in invalid_colors:
            assert _is_valid_color(color) is False


class TestBackgroundIntegration:
    """Test integration scenarios for background classes."""

    def test_background_solid_serialization_chain(self):
        """Test complete serialization chain for BackgroundSolid."""
        background = BackgroundSolid(color="#ff0000")
        serialized = background.asdict()
        assert serialized["color"] == "#ff0000"
        assert serialized["style"] == "solid"

    def test_background_gradient_serialization_chain(self):
        """Test complete serialization chain for BackgroundGradient."""
        background = BackgroundGradient(top_color="#ff0000", bottom_color="#00ff00")
        serialized = background.asdict()
        assert serialized["topColor"] == "#ff0000"
        assert serialized["bottomColor"] == "#00ff00"
        assert serialized["style"] == "gradient"

    def test_background_objects_in_lists(self):
        """Test background objects when used in lists."""
        backgrounds = [
            BackgroundSolid(color="#ff0000"),
            BackgroundGradient(top_color="#00ff00", bottom_color="#0000ff"),
        ]
        serialized_list = [bg.asdict() for bg in backgrounds]
        assert len(serialized_list) == 2
        assert serialized_list[0]["style"] == "solid"
        assert serialized_list[1]["style"] == "gradient"

    def test_background_objects_in_dicts(self):
        """Test background objects when used as dictionary values."""
        background_dict = {
            "solid": BackgroundSolid(color="#ff0000"),
            "gradient": BackgroundGradient(top_color="#00ff00", bottom_color="#0000ff"),
        }
        serialized_dict = {key: bg.asdict() for key, bg in background_dict.items()}
        assert serialized_dict["solid"]["style"] == "solid"
        assert serialized_dict["gradient"]["style"] == "gradient"


class TestBackgroundErrorMessages:
    """Test error messages for background validation."""

    def test_background_solid_error_message_format(self):
        """Test error message format for BackgroundSolid."""
        with pytest.raises(ValueError) as exc_info:
            BackgroundSolid(color="invalid")
        assert "Invalid color format: 'invalid'" in str(exc_info.value)
        assert "Must be hex, rgba, or named color" in str(exc_info.value)

    def test_background_gradient_top_color_error_message(self):
        """Test error message format for BackgroundGradient top color."""
        with pytest.raises(ValueError) as exc_info:
            BackgroundGradient(top_color="invalid")
        assert "Invalid top_color format: 'invalid'" in str(exc_info.value)
        assert "Must be hex, rgba, or named color" in str(exc_info.value)

    def test_background_gradient_bottom_color_error_message(self):
        """Test error message format for BackgroundGradient bottom color."""
        with pytest.raises(ValueError) as exc_info:
            BackgroundGradient(bottom_color="invalid")
        assert "Invalid bottom_color format: 'invalid'" in str(exc_info.value)
        assert "Must be hex, rgba, or named color" in str(exc_info.value)

    def test_background_solid_empty_string_error_message(self):
        """Test error message for empty string in BackgroundSolid."""
        with pytest.raises(ValueError) as exc_info:
            BackgroundSolid(color="")
        assert "Invalid color format: ''" in str(exc_info.value)

    def test_background_gradient_empty_string_error_message(self):
        """Test error message for empty string in BackgroundGradient."""
        with pytest.raises(ValueError) as exc_info:
            BackgroundGradient(top_color="")
        assert "Invalid top_color format: ''" in str(exc_info.value)
