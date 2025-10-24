"""Tests for per-point style classes.

This module tests the LineStyle, FillStyle, and PerPointStyles classes
used for per-point style overrides in Band and Ribbon series.
"""

import pytest

from streamlit_lightweight_charts_pro.data.styles import (
    FillStyle,
    LineStyle,
    PerPointStyles,
)
from streamlit_lightweight_charts_pro.exceptions import ValueValidationError


class TestLineStyle:
    """Test LineStyle class."""

    def test_empty_line_style(self):
        """Test creating an empty LineStyle."""
        style = LineStyle()
        assert style.color is None
        assert style.width is None
        assert style.style is None
        assert style.visible is None

    def test_line_style_with_color(self):
        """Test LineStyle with color."""
        style = LineStyle(color="#ff0000")
        assert style.color == "#ff0000"
        assert style.width is None

    def test_line_style_with_all_fields(self):
        """Test LineStyle with all fields."""
        style = LineStyle(color="#ff0000", width=3, style=2, visible=True)
        assert style.color == "#ff0000"
        assert style.width == 3
        assert style.style == 2
        assert style.visible is True

    def test_line_style_valid_hex_color(self):
        """Test LineStyle with valid hex color."""
        style = LineStyle(color="#2196F3")
        assert style.color == "#2196F3"

    def test_line_style_valid_rgba_color(self):
        """Test LineStyle with valid rgba color."""
        style = LineStyle(color="rgba(33, 150, 243, 0.5)")
        assert style.color == "rgba(33, 150, 243, 0.5)"

    def test_line_style_invalid_color(self):
        """Test LineStyle with invalid color raises error."""
        with pytest.raises(ValueValidationError):
            LineStyle(color="invalid-color")

    def test_line_style_asdict_empty(self):
        """Test asdict() on empty LineStyle."""
        style = LineStyle()
        result = style.asdict()
        assert result == {}

    def test_line_style_asdict_partial(self):
        """Test asdict() with some fields."""
        style = LineStyle(color="#ff0000", width=3)
        result = style.asdict()
        assert result == {"color": "#ff0000", "width": 3}
        assert "style" not in result
        assert "visible" not in result

    def test_line_style_asdict_complete(self):
        """Test asdict() with all fields."""
        style = LineStyle(color="#ff0000", width=3, style=2, visible=True)
        result = style.asdict()
        assert result == {"color": "#ff0000", "width": 3, "style": 2, "visible": True}

    def test_line_style_width_values(self):
        """Test LineStyle with valid width values."""
        for width in [1, 2, 3, 4]:
            style = LineStyle(width=width)
            assert style.width == width

    def test_line_style_style_values(self):
        """Test LineStyle with valid style values."""
        for line_style in [0, 1, 2]:
            style = LineStyle(style=line_style)
            assert style.style == line_style


class TestFillStyle:
    """Test FillStyle class."""

    def test_empty_fill_style(self):
        """Test creating an empty FillStyle."""
        style = FillStyle()
        assert style.color is None
        assert style.visible is None

    def test_fill_style_with_color(self):
        """Test FillStyle with color."""
        style = FillStyle(color="rgba(255, 0, 0, 0.2)")
        assert style.color == "rgba(255, 0, 0, 0.2)"
        assert style.visible is None

    def test_fill_style_with_visible(self):
        """Test FillStyle with visible flag."""
        style = FillStyle(visible=True)
        assert style.color is None
        assert style.visible is True

    def test_fill_style_with_all_fields(self):
        """Test FillStyle with all fields."""
        style = FillStyle(color="rgba(255, 0, 0, 0.2)", visible=True)
        assert style.color == "rgba(255, 0, 0, 0.2)"
        assert style.visible is True

    def test_fill_style_valid_hex_color(self):
        """Test FillStyle with valid hex color."""
        style = FillStyle(color="#ff0000")
        assert style.color == "#ff0000"

    def test_fill_style_valid_rgba_color(self):
        """Test FillStyle with valid rgba color."""
        style = FillStyle(color="rgba(255, 0, 0, 0.5)")
        assert style.color == "rgba(255, 0, 0, 0.5)"

    def test_fill_style_invalid_color(self):
        """Test FillStyle with invalid color raises error."""
        with pytest.raises(ValueValidationError):
            FillStyle(color="not-a-color")

    def test_fill_style_asdict_empty(self):
        """Test asdict() on empty FillStyle."""
        style = FillStyle()
        result = style.asdict()
        assert result == {}

    def test_fill_style_asdict_partial(self):
        """Test asdict() with some fields."""
        style = FillStyle(color="rgba(255, 0, 0, 0.2)")
        result = style.asdict()
        assert result == {"color": "rgba(255, 0, 0, 0.2)"}
        assert "visible" not in result

    def test_fill_style_asdict_complete(self):
        """Test asdict() with all fields."""
        style = FillStyle(color="rgba(255, 0, 0, 0.2)", visible=True)
        result = style.asdict()
        assert result == {"color": "rgba(255, 0, 0, 0.2)", "visible": True}


class TestPerPointStyles:
    """Test PerPointStyles class."""

    def test_empty_per_point_styles(self):
        """Test creating empty PerPointStyles."""
        styles = PerPointStyles()
        assert styles.upper_line is None
        assert styles.middle_line is None
        assert styles.lower_line is None
        assert styles.upper_fill is None
        assert styles.lower_fill is None
        assert styles.fill is None

    def test_per_point_styles_with_upper_line(self):
        """Test PerPointStyles with upper line."""
        styles = PerPointStyles(upper_line=LineStyle(color="#ff0000", width=3))
        assert styles.upper_line is not None
        assert styles.upper_line.color == "#ff0000"
        assert styles.middle_line is None

    def test_per_point_styles_with_fills(self):
        """Test PerPointStyles with fill styles."""
        styles = PerPointStyles(
            upper_fill=FillStyle(color="rgba(255, 0, 0, 0.2)", visible=True),
            lower_fill=FillStyle(color="rgba(0, 0, 255, 0.2)", visible=True),
        )
        assert styles.upper_fill is not None
        assert styles.lower_fill is not None
        assert styles.fill is None

    def test_per_point_styles_band_complete(self):
        """Test PerPointStyles with all Band fields."""
        styles = PerPointStyles(
            upper_line=LineStyle(color="#ff0000", width=3),
            middle_line=LineStyle(color="#00ff00", width=2),
            lower_line=LineStyle(color="#0000ff", width=1),
            upper_fill=FillStyle(color="rgba(255, 0, 0, 0.2)"),
            lower_fill=FillStyle(color="rgba(0, 0, 255, 0.2)"),
        )
        assert styles.upper_line is not None
        assert styles.middle_line is not None
        assert styles.lower_line is not None
        assert styles.upper_fill is not None
        assert styles.lower_fill is not None

    def test_per_point_styles_ribbon_complete(self):
        """Test PerPointStyles with all Ribbon fields."""
        styles = PerPointStyles(
            upper_line=LineStyle(color="#ff0000", width=3),
            lower_line=LineStyle(color="#0000ff", width=2),
            fill=FillStyle(color="rgba(128, 128, 128, 0.3)", visible=True),
        )
        assert styles.upper_line is not None
        assert styles.lower_line is not None
        assert styles.fill is not None
        assert styles.middle_line is None

    def test_per_point_styles_asdict_empty(self):
        """Test asdict() on empty PerPointStyles."""
        styles = PerPointStyles()
        result = styles.asdict()
        assert result == {}

    def test_per_point_styles_asdict_camel_case(self):
        """Test asdict() converts snake_case to camelCase."""
        styles = PerPointStyles(
            upper_line=LineStyle(color="#ff0000"),
            middle_line=LineStyle(width=2),
            lower_line=LineStyle(style=1),
        )
        result = styles.asdict()

        # Check camelCase conversion
        assert "upperLine" in result
        assert "middleLine" in result
        assert "lowerLine" in result

        # Check snake_case is not present
        assert "upper_line" not in result
        assert "middle_line" not in result
        assert "lower_line" not in result

    def test_per_point_styles_asdict_nested(self):
        """Test asdict() properly nests LineStyle and FillStyle."""
        styles = PerPointStyles(
            upper_line=LineStyle(color="#ff0000", width=3),
            upper_fill=FillStyle(color="rgba(255, 0, 0, 0.2)", visible=True),
        )
        result = styles.asdict()

        # Check nested structure
        assert result == {
            "upperLine": {"color": "#ff0000", "width": 3},
            "upperFill": {"color": "rgba(255, 0, 0, 0.2)", "visible": True},
        }

    def test_per_point_styles_asdict_band_complete(self):
        """Test asdict() with all Band fields."""
        styles = PerPointStyles(
            upper_line=LineStyle(color="#ff0000", width=3, style=2),
            middle_line=LineStyle(color="#00ff00", width=2, style=1),
            lower_line=LineStyle(color="#0000ff", width=1, style=0),
            upper_fill=FillStyle(color="rgba(255, 0, 0, 0.2)", visible=True),
            lower_fill=FillStyle(color="rgba(0, 0, 255, 0.2)", visible=True),
        )
        result = styles.asdict()

        assert "upperLine" in result
        assert "middleLine" in result
        assert "lowerLine" in result
        assert "upperFill" in result
        assert "lowerFill" in result
        assert "fill" not in result

    def test_per_point_styles_asdict_ribbon_complete(self):
        """Test asdict() with all Ribbon fields."""
        styles = PerPointStyles(
            upper_line=LineStyle(color="#ff0000", width=3),
            lower_line=LineStyle(color="#0000ff", width=2),
            fill=FillStyle(color="rgba(128, 128, 128, 0.3)", visible=True),
        )
        result = styles.asdict()

        assert "upperLine" in result
        assert "lowerLine" in result
        assert "fill" in result
        assert "middleLine" not in result
        assert "upperFill" not in result
        assert "lowerFill" not in result

    def test_per_point_styles_partial_line_styles(self):
        """Test PerPointStyles with partial LineStyle fields."""
        styles = PerPointStyles(
            upper_line=LineStyle(color="#ff0000"),  # Only color
            lower_line=LineStyle(width=3),  # Only width
        )
        result = styles.asdict()

        assert result["upperLine"] == {"color": "#ff0000"}
        assert result["lowerLine"] == {"width": 3}

    def test_per_point_styles_invisible_line(self):
        """Test PerPointStyles with invisible line."""
        styles = PerPointStyles(upper_line=LineStyle(visible=False))
        result = styles.asdict()

        assert result == {"upperLine": {"visible": False}}

    def test_per_point_styles_invisible_fill(self):
        """Test PerPointStyles with invisible fill."""
        styles = PerPointStyles(fill=FillStyle(visible=False))
        result = styles.asdict()

        assert result == {"fill": {"visible": False}}
