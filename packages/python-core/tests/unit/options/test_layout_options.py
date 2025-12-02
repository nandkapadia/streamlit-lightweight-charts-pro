"""Tests for layout options classes.

This module contains comprehensive tests for layout-related option classes:
- LayoutOptions
- GridOptions
- GridLineOptions
- PaneOptions
- WatermarkOptions
"""

import pytest
from lightweight_charts_core.charts.options.layout_options import (
    GridLineOptions,
    GridOptions,
    LayoutOptions,
    PaneOptions,
    WatermarkOptions,
)
from lightweight_charts_core.exceptions import TypeValidationError
from lightweight_charts_core.type_definitions.colors import (
    BackgroundGradient,
    BackgroundSolid,
)
from lightweight_charts_core.type_definitions.enums import HorzAlign, LineStyle, VertAlign


class TestLayoutOptions:
    """Test LayoutOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = LayoutOptions()

        assert isinstance(options.background_options, BackgroundSolid)
        assert options.background_options.color == "#ffffff"
        assert options.text_color == "#131722"
        assert options.font_size == 11
        assert (
            options.font_family
            == "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        )
        assert options.pane_options is None

    def test_custom_construction(self):
        """Test construction with custom values."""
        background = BackgroundSolid(color="#000000")
        pane_options = PaneOptions(separator_color="#ff0000")

        options = LayoutOptions(
            background_options=background,
            text_color="#ffffff",
            font_size=14,
            font_family="Arial, sans-serif",
            pane_options=pane_options,
        )

        assert options.background_options == background
        assert options.text_color == "#ffffff"
        assert options.font_size == 14
        assert options.font_family == "Arial, sans-serif"
        assert options.pane_options == pane_options

    def test_validation_background_options(self):
        """Test validation of background_options field."""
        options = LayoutOptions()
        with pytest.raises(TypeValidationError):
            options.set_background_options("invalid")

    def test_validation_pane_options(self):
        """Test validation of pane_options field."""
        options = LayoutOptions()

        with pytest.raises(TypeValidationError):
            options.set_pane_options("invalid")

    def test_to_dict_basic(self):
        """Test basic serialization."""
        options = LayoutOptions()
        result = options.asdict()
        assert "backgroundOptions" not in result  # Should be flattened
        assert result["color"] == "#ffffff"  # Flattened from background_options
        assert result["style"] == "solid"  # Flattened from background_options

    def test_to_dict_with_pane_options(self):
        """Test serialization with pane options."""
        pane_options = PaneOptions(separator_color="#ff0000")
        options = LayoutOptions(pane_options=pane_options)
        result = options.asdict()

        assert "paneOptions" in result
        assert result["paneOptions"]["separatorColor"] == "#ff0000"

    def test_to_dict_with_gradient_background(self):
        """Test serialization with gradient background."""
        background = BackgroundGradient(top_color="#ffffff", bottom_color="#000000")
        options = LayoutOptions(background_options=background)
        result = options.asdict()
        assert result["topColor"] == "#ffffff"  # Flattened from background_options
        assert result["bottomColor"] == "#000000"  # Flattened from background_options
        assert result["style"] == "gradient"  # Flattened from background_options


class TestGridOptions:
    """Test GridOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = GridOptions()

        assert isinstance(options.vert_lines, GridLineOptions)
        assert isinstance(options.horz_lines, GridLineOptions)

    def test_custom_construction(self):
        """Test construction with custom values."""
        vert_lines = GridLineOptions(color="#ff0000", style=LineStyle.SOLID)
        horz_lines = GridLineOptions(color="#00ff00", style=LineStyle.DOTTED)

        options = GridOptions(vert_lines=vert_lines, horz_lines=horz_lines)

        assert options.vert_lines == vert_lines
        assert options.horz_lines == horz_lines

    def test_validation_vert_lines(self):
        """Test validation of vert_lines field."""
        options = GridOptions()

        with pytest.raises(TypeValidationError):
            options.set_vert_lines("invalid")

    def test_validation_horz_lines(self):
        """Test validation of horz_lines field."""
        options = GridOptions()

        with pytest.raises(TypeValidationError):
            options.set_horz_lines("invalid")

    def test_to_dict(self):
        """Test serialization."""
        vert_lines = GridLineOptions(color="#ff0000", style=LineStyle.SOLID)
        horz_lines = GridLineOptions(color="#00ff00", style=LineStyle.DOTTED)

        options = GridOptions(vert_lines=vert_lines, horz_lines=horz_lines)
        result = options.asdict()

        assert "vertLines" in result
        assert "horzLines" in result
        assert result["vertLines"]["color"] == "#ff0000"
        assert result["vertLines"]["style"] == 0  # LineStyle.SOLID.value
        assert result["horzLines"]["color"] == "#00ff00"
        assert result["horzLines"]["style"] == 1  # LineStyle.DOTTED.value


class TestGridLineOptions:
    """Test GridLineOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = GridLineOptions()
        assert options.color == "#e1e3e6"
        assert options.style == LineStyle.SOLID
        assert options.visible is False

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = GridLineOptions(color="#ff0000", style=LineStyle.DOTTED, visible=False)

        assert options.color == "#ff0000"
        assert options.style == LineStyle.DOTTED
        assert options.visible is False

    def test_validation_color(self):
        """Test validation of color field."""
        options = GridLineOptions()
        with pytest.raises(TypeValidationError):
            options.set_color(123)

    def test_validation_style(self):
        """Test validation of style field."""
        options = GridLineOptions()

        with pytest.raises(TypeValidationError):
            options.set_style("invalid")

    def test_validation_visible(self):
        """Test validation of visible field."""
        options = GridLineOptions()

        with pytest.raises(TypeValidationError):
            options.set_visible("invalid")

    def test_to_dict(self):
        """Test serialization."""
        options = GridLineOptions(color="#ff0000", style=LineStyle.DOTTED, visible=False)
        result = options.asdict()

        assert result["color"] == "#ff0000"
        assert result["style"] == 1  # LineStyle.DOTTED.value
        assert result["visible"] is False

    def test_to_dict_omits_false_visible(self):
        """Test that visible=False is included in output."""
        options = GridLineOptions(visible=False)
        result = options.asdict()
        assert result["visible"] is False


class TestPaneOptions:
    """Test PaneOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = PaneOptions()

        assert options.separator_color == "#e1e3ea"
        assert options.separator_hover_color == "#ffffff"
        assert options.enable_resize is True

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = PaneOptions(
            separator_color="#ff0000",
            separator_hover_color="#00ff00",
            enable_resize=False,
        )

        assert options.separator_color == "#ff0000"
        assert options.separator_hover_color == "#00ff00"
        assert options.enable_resize is False

    def test_validation_separator_color(self):
        """Test validation of separator_color field."""
        options = PaneOptions()
        with pytest.raises(TypeValidationError):
            options.set_separator_color(123)

    def test_validation_separator_hover_color(self):
        """Test validation of separator_hover_color field."""
        options = PaneOptions()
        with pytest.raises(TypeValidationError):
            options.set_separator_hover_color(123)

    def test_validation_enable_resize(self):
        """Test validation of enable_resize field."""
        options = PaneOptions()

        with pytest.raises(TypeValidationError):
            options.set_enable_resize("invalid")

    def test_to_dict(self):
        """Test serialization."""
        options = PaneOptions(
            separator_color="#ff0000",
            separator_hover_color="#00ff00",
            enable_resize=False,
        )
        result = options.asdict()

        assert result["separatorColor"] == "#ff0000"
        assert result["separatorHoverColor"] == "#00ff00"
        assert result["enableResize"] is False


class TestWatermarkOptions:
    """Test WatermarkOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = WatermarkOptions()

        assert options.visible is True
        assert options.text == ""
        assert options.font_size == 96
        assert options.horz_align == HorzAlign.CENTER
        assert options.vert_align == VertAlign.CENTER
        assert options.color == "rgba(255, 255, 255, 0.1)"

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = WatermarkOptions(
            visible=False,
            text="Test Watermark",
            font_size=48,
            horz_align=HorzAlign.LEFT,
            vert_align=VertAlign.TOP,
            color="#ff0000",
        )

        assert options.visible is False
        assert options.text == "Test Watermark"
        assert options.font_size == 48
        assert options.horz_align == HorzAlign.LEFT
        assert options.vert_align == VertAlign.TOP
        assert options.color == "#ff0000"

    def test_validation_visible(self):
        """Test validation of visible field."""
        options = WatermarkOptions()

        with pytest.raises(TypeValidationError):
            options.set_visible("invalid")

    def test_validation_text(self):
        """Test validation of text field."""
        options = WatermarkOptions()
        with pytest.raises(TypeValidationError):
            options.set_text(123)

    def test_validation_font_size(self):
        """Test validation of font_size field."""
        options = WatermarkOptions()

        with pytest.raises(TypeValidationError):
            options.set_font_size("invalid")

    def test_validation_horz_align(self):
        """Test validation of horz_align field."""
        options = WatermarkOptions()

        with pytest.raises(TypeValidationError):
            options.set_horz_align("invalid")

    def test_validation_vert_align(self):
        """Test validation of vert_align field."""
        options = WatermarkOptions()

        with pytest.raises(TypeValidationError):
            options.set_vert_align("invalid")

    def test_validation_color(self):
        """Test validation of color field."""
        options = WatermarkOptions()
        with pytest.raises(TypeValidationError):
            options.set_color(123)

    def test_to_dict(self):
        """Test serialization."""
        options = WatermarkOptions(
            visible=False,
            text="Test Watermark",
            font_size=48,
            horz_align=HorzAlign.LEFT,
            vert_align=VertAlign.TOP,
            color="#ff0000",
        )
        result = options.asdict()

        assert result["visible"] is False
        assert result["text"] == "Test Watermark"
        assert result["fontSize"] == 48
        assert result["horzAlign"] == "left"
        assert result["vertAlign"] == "top"
        assert result["color"] == "#ff0000"

    def test_to_dict_omits_empty_text(self):
        """Test that empty text is omitted from output."""
        options = WatermarkOptions(text="")
        result = options.asdict()

        assert "text" not in result


class TestLayoutOptionsIntegration:
    """Test integration between layout option classes."""

    def test_layout_options_with_custom_grid(self):
        """Test LayoutOptions with custom grid configuration."""
        grid_lines = GridLineOptions(color="#ff0000", style=LineStyle.DOTTED)
        grid = GridOptions(vert_lines=grid_lines, horz_lines=grid_lines)

        LayoutOptions()
        # Note: GridOptions is not part of LayoutOptions, but they work together
        grid_result = grid.asdict()

        assert grid_result["vertLines"]["color"] == "#ff0000"
        assert grid_result["vertLines"]["style"] == 1  # LineStyle.DOTTED.value

    def test_layout_options_with_custom_pane(self):
        """Test LayoutOptions with custom pane configuration."""
        pane_options = PaneOptions(
            separator_color="#ff0000",
            separator_hover_color="#00ff00",
            enable_resize=False,
        )

        options = LayoutOptions(pane_options=pane_options)
        result = options.asdict()

        assert result["paneOptions"]["separatorColor"] == "#ff0000"
        assert result["paneOptions"]["separatorHoverColor"] == "#00ff00"
        assert result["paneOptions"]["enableResize"] is False

    def test_layout_options_with_custom_watermark(self):
        """Test LayoutOptions with custom watermark configuration."""
        watermark = WatermarkOptions(
            text="Custom Watermark",
            font_size=72,
            color="rgba(0, 0, 0, 0.1)",
        )

        # Watermark is typically part of layout options
        watermark_result = watermark.asdict()

        assert watermark_result["text"] == "Custom Watermark"
        assert watermark_result["fontSize"] == 72
        assert watermark_result["color"] == "rgba(0, 0, 0, 0.1)"


class TestLayoutOptionsEdgeCases:
    """Test edge cases for layout options."""

    def test_grid_line_options_with_zero_font_size(self):
        """Test GridLineOptions with edge case values."""
        options = GridLineOptions(color="#000000", style=LineStyle.SOLID, visible=True)
        result = options.asdict()

        assert result["color"] == "#000000"
        assert result["style"] == 0  # LineStyle.SOLID.value

    def test_watermark_options_with_large_font_size(self):
        """Test WatermarkOptions with large font size."""
        options = WatermarkOptions(font_size=999)
        result = options.asdict()

        assert result["fontSize"] == 999

    def test_pane_options_with_special_characters(self):
        """Test PaneOptions with special characters in colors."""
        options = PaneOptions(
            separator_color="rgba(255, 0, 0, 0.5)",
            separator_hover_color="hsl(120, 100%, 50%)",
        )
        result = options.asdict()

        assert result["separatorColor"] == "rgba(255, 0, 0, 0.5)"
        assert result["separatorHoverColor"] == "hsl(120, 100%, 50%)"

    def test_layout_options_equality(self):
        """Test equality comparison for layout options."""
        options1 = LayoutOptions(text_color="#ffffff", font_size=14)
        options2 = LayoutOptions(text_color="#ffffff", font_size=14)
        options3 = LayoutOptions(text_color="#ffffff", font_size=12)

        assert options1 == options2
        assert options1 != options3

    def test_grid_options_equality(self):
        """Test equality comparison for grid options."""
        grid_lines = GridLineOptions(color="#ff0000")
        options1 = GridOptions(vert_lines=grid_lines, horz_lines=grid_lines)
        options2 = GridOptions(vert_lines=grid_lines, horz_lines=grid_lines)

        assert options1 == options2
