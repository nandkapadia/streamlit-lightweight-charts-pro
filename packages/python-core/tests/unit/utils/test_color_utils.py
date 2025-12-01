"""Unit tests for color utility functions.

Tests color manipulation utilities including:
- Hex to RGBA conversion
- Opacity addition
- Color validation
- Edge cases and error handling
"""

import pytest
from lightweight_charts_core.utils.color_utils import (
    add_opacity,
    hex_to_rgba,
    is_hex_color,
)


class TestAddOpacity:
    """Tests for add_opacity function."""

    def test_hex_to_rgba_default_opacity(self):
        """Test converting hex to rgba with default opacity."""
        result = add_opacity("#4CAF50")
        assert result == "rgba(76, 175, 80, 0.3)"

    def test_hex_to_rgba_custom_opacity(self):
        """Test converting hex to rgba with custom opacity."""
        result = add_opacity("#FF0000", 0.5)
        assert result == "rgba(255, 0, 0, 0.5)"

    def test_hex_to_rgba_zero_opacity(self):
        """Test converting hex to rgba with zero opacity (fully transparent)."""
        result = add_opacity("#00FF00", 0.0)
        assert result == "rgba(0, 255, 0, 0.0)"

    def test_hex_to_rgba_full_opacity(self):
        """Test converting hex to rgba with full opacity."""
        result = add_opacity("#0000FF", 1.0)
        assert result == "rgba(0, 0, 255, 1.0)"

    def test_hex_white_color(self):
        """Test converting white color."""
        result = add_opacity("#FFFFFF", 0.5)
        assert result == "rgba(255, 255, 255, 0.5)"

    def test_hex_black_color(self):
        """Test converting black color."""
        result = add_opacity("#000000", 0.5)
        assert result == "rgba(0, 0, 0, 0.5)"

    def test_hex_lowercase(self):
        """Test hex color with lowercase letters."""
        result = add_opacity("#abc123", 0.4)
        assert result == "rgba(171, 193, 35, 0.4)"

    def test_hex_uppercase(self):
        """Test hex color with uppercase letters."""
        result = add_opacity("#ABC123", 0.4)
        assert result == "rgba(171, 193, 35, 0.4)"

    def test_rgba_input_unchanged(self):
        """Test that rgba input is returned unchanged."""
        rgba_color = "rgba(255, 0, 0, 0.5)"
        result = add_opacity(rgba_color, 0.3)
        assert result == rgba_color

    def test_rgb_input_unchanged(self):
        """Test that rgb input is returned unchanged."""
        rgb_color = "rgb(255, 0, 0)"
        result = add_opacity(rgb_color, 0.3)
        assert result == rgb_color

    def test_named_color_unchanged(self):
        """Test that named color is returned unchanged."""
        named_color = "red"
        result = add_opacity(named_color, 0.3)
        assert result == named_color

    def test_invalid_hex_too_short(self):
        """Test error when hex color is too short."""
        with pytest.raises(ValueError, match="Invalid hex color format"):
            add_opacity("#FFF", 0.3)

    def test_invalid_hex_too_long(self):
        """Test error when hex color is too long."""
        with pytest.raises(ValueError, match="Invalid hex color format"):
            add_opacity("#FFFFFF00", 0.3)

    def test_invalid_hex_characters(self):
        """Test error when hex color contains invalid characters."""
        with pytest.raises(ValueError, match="Invalid hex color"):
            add_opacity("#GGGGGG", 0.3)

    def test_invalid_hex_no_hash(self):
        """Test that color without # is returned unchanged."""
        result = add_opacity("4CAF50", 0.3)
        assert result == "4CAF50"


class TestHexToRgba:
    """Tests for hex_to_rgba function."""

    def test_hex_to_rgba_with_alpha(self):
        """Test converting hex to rgba with alpha value."""
        result = hex_to_rgba("#4CAF50", 0.5)
        assert result == "rgba(76, 175, 80, 0.5)"

    def test_hex_to_rgb_without_alpha(self):
        """Test converting hex to rgb without alpha value."""
        result = hex_to_rgba("#4CAF50")
        assert result == "rgb(76, 175, 80)"

    def test_hex_to_rgb_none_alpha(self):
        """Test converting hex to rgb with None alpha."""
        result = hex_to_rgba("#FF0000", None)
        assert result == "rgb(255, 0, 0)"

    def test_hex_to_rgba_zero_alpha(self):
        """Test converting hex to rgba with zero alpha."""
        result = hex_to_rgba("#00FF00", 0.0)
        assert result == "rgba(0, 255, 0, 0.0)"

    def test_hex_to_rgba_full_alpha(self):
        """Test converting hex to rgba with full alpha."""
        result = hex_to_rgba("#0000FF", 1.0)
        assert result == "rgba(0, 0, 255, 1.0)"

    def test_non_hex_input_with_none_alpha(self):
        """Test that non-hex input is returned unchanged when alpha is None."""
        rgba_color = "rgba(255, 0, 0, 0.5)"
        result = hex_to_rgba(rgba_color, None)
        assert result == rgba_color

    def test_non_hex_input_with_alpha(self):
        """Test that non-hex input is returned unchanged when alpha is provided."""
        rgba_color = "rgba(255, 0, 0, 0.5)"
        result = hex_to_rgba(rgba_color, 0.3)
        assert result == rgba_color

    def test_invalid_hex_format_with_none_alpha(self):
        """Test error for invalid hex format when alpha is None."""
        with pytest.raises(ValueError, match="Invalid hex color format"):
            hex_to_rgba("#FFF", None)

    def test_invalid_hex_format_with_alpha(self):
        """Test error for invalid hex format when alpha is provided."""
        with pytest.raises(ValueError, match="Invalid hex color format"):
            hex_to_rgba("#FFF", 0.5)

    def test_all_combinations(self):
        """Test various color combinations."""
        test_cases = [
            ("#000000", None, "rgb(0, 0, 0)"),
            ("#FFFFFF", None, "rgb(255, 255, 255)"),
            ("#FF0000", 0.5, "rgba(255, 0, 0, 0.5)"),
            ("#00FF00", 0.8, "rgba(0, 255, 0, 0.8)"),
            ("#0000FF", 0.2, "rgba(0, 0, 255, 0.2)"),
        ]

        for hex_color, alpha, expected in test_cases:
            result = hex_to_rgba(hex_color, alpha)
            assert result == expected


class TestIsHexColor:
    """Tests for is_hex_color function."""

    def test_valid_hex_colors(self):
        """Test valid hex colors."""
        valid_colors = [
            "#000000",
            "#FFFFFF",
            "#FF0000",
            "#00FF00",
            "#0000FF",
            "#4CAF50",
            "#abc123",
            "#ABC123",
            "#123abc",
        ]

        for color in valid_colors:
            assert is_hex_color(color) is True, f"{color} should be valid"

    def test_invalid_hex_colors(self):
        """Test invalid hex colors."""
        invalid_colors = [
            "#FFF",  # Too short
            "#FFFFFF00",  # Too long
            "#GGGGGG",  # Invalid characters
            "4CAF50",  # Missing #
            "#4CAF5",  # One char short
            "rgba(255, 0, 0, 0.5)",  # RGBA format
            "rgb(255, 0, 0)",  # RGB format
            "red",  # Named color
            "",  # Empty string
            "#",  # Just hash
            "##4CAF50",  # Double hash
        ]

        for color in invalid_colors:
            assert is_hex_color(color) is False, f"{color} should be invalid"

    def test_non_string_input(self):
        """Test that non-string input returns False."""
        assert is_hex_color(123) is False
        assert is_hex_color(None) is False
        assert is_hex_color([]) is False
        assert is_hex_color({}) is False

    def test_case_insensitive(self):
        """Test that hex colors are case-insensitive."""
        assert is_hex_color("#abc123") is True
        assert is_hex_color("#ABC123") is True
        assert is_hex_color("#AbC123") is True

    def test_boundary_cases(self):
        """Test boundary cases."""
        assert is_hex_color("#000000") is True
        assert is_hex_color("000000") is False
        assert is_hex_color("#0000000") is False


class TestColorUtilsIntegration:
    """Integration tests for color utilities."""

    def test_add_opacity_and_is_hex_color_integration(self):
        """Test that add_opacity works correctly with hex colors validated by is_hex_color."""
        hex_color = "#4CAF50"
        assert is_hex_color(hex_color) is True

        rgba_result = add_opacity(hex_color, 0.5)
        assert rgba_result == "rgba(76, 175, 80, 0.5)"
        assert is_hex_color(rgba_result) is False

    def test_hex_to_rgba_and_is_hex_color_integration(self):
        """Test hex_to_rgba with is_hex_color validation."""
        hex_color = "#FF0000"
        assert is_hex_color(hex_color) is True

        rgb_result = hex_to_rgba(hex_color, None)
        assert rgb_result == "rgb(255, 0, 0)"
        assert is_hex_color(rgb_result) is False

        rgba_result = hex_to_rgba(hex_color, 0.7)
        assert rgba_result == "rgba(255, 0, 0, 0.7)"
        assert is_hex_color(rgba_result) is False

    def test_color_conversion_pipeline(self):
        """Test a complete color conversion pipeline."""
        original_color = "#123ABC"

        assert is_hex_color(original_color) is True

        rgb_color = hex_to_rgba(original_color, None)
        assert rgb_color == "rgb(18, 58, 188)"
        assert is_hex_color(rgb_color) is False

        rgba_30 = add_opacity(original_color, 0.3)
        rgba_50 = hex_to_rgba(original_color, 0.5)
        rgba_80 = add_opacity(original_color, 0.8)

        assert rgba_30 == "rgba(18, 58, 188, 0.3)"
        assert rgba_50 == "rgba(18, 58, 188, 0.5)"
        assert rgba_80 == "rgba(18, 58, 188, 0.8)"

        assert is_hex_color(rgba_30) is False
        assert is_hex_color(rgba_50) is False
        assert is_hex_color(rgba_80) is False
