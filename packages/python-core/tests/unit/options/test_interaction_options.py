"""Tests for interaction options classes.

This module contains comprehensive tests for interaction-related option classes:
- CrosshairOptions
- CrosshairLineOptions
- CrosshairSyncOptions
- KineticScrollOptions
- TrackingModeOptions
"""

import pytest
from lightweight_charts_core.charts.options.interaction_options import (
    CrosshairLineOptions,
    CrosshairOptions,
    CrosshairSyncOptions,
    KineticScrollOptions,
    TrackingModeOptions,
)
from lightweight_charts_core.exceptions import TypeValidationError
from lightweight_charts_core.type_definitions.enums import CrosshairMode, LineStyle


class TestCrosshairOptions:
    """Test CrosshairOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = CrosshairOptions()

        assert options.mode == CrosshairMode.NORMAL
        assert isinstance(options.vert_line, CrosshairLineOptions)
        assert isinstance(options.horz_line, CrosshairLineOptions)

    def test_custom_construction(self):
        """Test construction with custom values."""
        vert_line = CrosshairLineOptions(color="#ff0000", width=2)
        horz_line = CrosshairLineOptions(color="#00ff00", width=3)

        options = CrosshairOptions(
            mode=CrosshairMode.MAGNET,
            vert_line=vert_line,
            horz_line=horz_line,
        )

        assert options.mode == CrosshairMode.MAGNET
        assert options.vert_line == vert_line
        assert options.horz_line == horz_line

    def test_validation_mode(self):
        """Test validation of mode field."""
        options = CrosshairOptions()
        with pytest.raises(TypeValidationError):
            options.set_mode("invalid")

    def test_validation_vert_line(self):
        """Test validation of vert_line field."""
        options = CrosshairOptions()
        with pytest.raises(TypeValidationError):
            options.set_vert_line("invalid")

    def test_validation_horz_line(self):
        """Test validation of horz_line field."""
        options = CrosshairOptions()
        with pytest.raises(TypeValidationError):
            options.set_horz_line("invalid")

    def test_to_dict(self):
        """Test serialization."""
        vert_line = CrosshairLineOptions(color="#ff0000", width=2)
        horz_line = CrosshairLineOptions(color="#00ff00", width=3)

        options = CrosshairOptions(
            mode=CrosshairMode.MAGNET,
            vert_line=vert_line,
            horz_line=horz_line,
        )
        result = options.asdict()

        assert result["mode"] == 1  # CrosshairMode.MAGNET.value
        assert "vertLine" in result
        assert "horzLine" in result
        assert result["vertLine"]["color"] == "#ff0000"
        assert result["vertLine"]["width"] == 2
        assert result["horzLine"]["color"] == "#00ff00"
        assert result["horzLine"]["width"] == 3


class TestCrosshairLineOptions:
    """Test CrosshairLineOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = CrosshairLineOptions()
        assert options.color == "#758696"
        assert options.width == 1
        assert options.style == LineStyle.SOLID
        assert options.visible is True
        assert options.label_visible is True

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = CrosshairLineOptions(
            color="#ff0000",
            width=3,
            style=LineStyle.DOTTED,
            visible=False,
            label_visible=False,
        )

        assert options.color == "#ff0000"
        assert options.width == 3
        assert options.style == LineStyle.DOTTED
        assert options.visible is False
        assert options.label_visible is False

    def test_validation_color(self):
        """Test validation of color field."""
        options = CrosshairLineOptions()
        with pytest.raises(TypeValidationError):
            options.set_color(123)

    def test_validation_width(self):
        """Test validation of width field."""
        options = CrosshairLineOptions()
        with pytest.raises(TypeValidationError):
            options.set_width("invalid")

    def test_validation_style(self):
        """Test validation of style field."""
        options = CrosshairLineOptions()
        with pytest.raises(TypeValidationError):
            options.set_style("invalid")

    def test_validation_visible(self):
        """Test validation of visible field."""
        options = CrosshairLineOptions()
        with pytest.raises(TypeValidationError):
            options.set_visible("invalid")

    def test_validation_label_visible(self):
        """Test validation of label_visible field."""
        options = CrosshairLineOptions()
        with pytest.raises(TypeValidationError):
            options.set_label_visible("invalid")

    def test_to_dict(self):
        """Test serialization."""
        options = CrosshairLineOptions(
            color="#ff0000",
            width=3,
            style=LineStyle.DOTTED,
            visible=False,
            label_visible=False,
        )
        result = options.asdict()

        assert result["color"] == "#ff0000"
        assert result["width"] == 3
        assert result["style"] == 1  # LineStyle.DOTTED.value
        assert result["visible"] is False
        assert result["labelVisible"] is False

    def test_to_dict_omits_false_visible(self):
        """Test that visible=False is included in output."""
        options = CrosshairLineOptions(visible=False)
        result = options.asdict()
        assert result["visible"] is False

    def test_to_dict_omits_false_label_visible(self):
        """Test that label_visible=False is included in output."""
        options = CrosshairLineOptions(label_visible=False)
        result = options.asdict()
        assert result["labelVisible"] is False


class TestCrosshairSyncOptions:
    """Test CrosshairSyncOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = CrosshairSyncOptions()

        assert options.group_id == 1
        assert options.suppress_series_animations is True

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = CrosshairSyncOptions(group_id=42, suppress_series_animations=False)

        assert options.group_id == 42
        assert options.suppress_series_animations is False

    def test_validation_group_id(self):
        """Test validation of group_id field."""
        options = CrosshairSyncOptions()
        with pytest.raises(TypeValidationError):
            options.set_group_id("invalid")

    def test_validation_suppress_series_animations(self):
        """Test validation of suppress_series_animations field."""
        options = CrosshairSyncOptions()
        with pytest.raises(TypeValidationError):
            options.set_suppress_series_animations("invalid")

    def test_to_dict(self):
        """Test serialization."""
        options = CrosshairSyncOptions(group_id=42, suppress_series_animations=False)
        result = options.asdict()

        assert result["groupId"] == 42
        assert result["suppressSeriesAnimations"] is False


class TestKineticScrollOptions:
    """Test KineticScrollOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = KineticScrollOptions()

        assert options.touch is True
        assert options.mouse is False

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = KineticScrollOptions(touch=False, mouse=True)

        assert options.touch is False
        assert options.mouse is True

    def test_validation_touch(self):
        """Test validation of touch field."""
        options = KineticScrollOptions()
        with pytest.raises(TypeValidationError):
            options.set_touch("invalid")

    def test_validation_mouse(self):
        """Test validation of mouse field."""
        options = KineticScrollOptions()
        with pytest.raises(TypeValidationError):
            options.set_mouse("invalid")

    def test_to_dict(self):
        """Test serialization."""
        options = KineticScrollOptions(touch=False, mouse=True)
        result = options.asdict()

        assert result["touch"] is False
        assert result["mouse"] is True


class TestTrackingModeOptions:
    """Test TrackingModeOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = TrackingModeOptions()

        assert options.exit_on_escape is True

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = TrackingModeOptions(exit_on_escape=False)

        assert options.exit_on_escape is False

    def test_validation_exit_on_escape(self):
        """Test validation of exit_on_escape field."""
        options = TrackingModeOptions()
        with pytest.raises(TypeValidationError):
            options.set_exit_on_escape("invalid")

    def test_to_dict(self):
        """Test serialization."""
        options = TrackingModeOptions(exit_on_escape=False)
        result = options.asdict()

        assert result["exitOnEscape"] is False


class TestInteractionOptionsIntegration:
    """Test integration between interaction option classes."""

    def test_crosshair_options_with_custom_lines(self):
        """Test CrosshairOptions with custom line configurations."""
        vert_line = CrosshairLineOptions(
            color="#ff0000",
            width=2,
            style=LineStyle.DASHED,
            visible=True,
            label_visible=True,
        )

        horz_line = CrosshairLineOptions(
            color="#00ff00",
            width=3,
            style=LineStyle.DOTTED,
            visible=True,
            label_visible=False,
        )

        options = CrosshairOptions(
            mode=CrosshairMode.MAGNET,
            vert_line=vert_line,
            horz_line=horz_line,
        )
        result = options.asdict()

        assert result["mode"] == 1  # CrosshairMode.MAGNET.value
        assert result["vertLine"]["color"] == "#ff0000"
        assert result["vertLine"]["width"] == 2
        assert result["vertLine"]["style"] == 2  # LineStyle.DASHED.value
        assert result["vertLine"]["labelVisible"] is True

        assert result["horzLine"]["color"] == "#00ff00"
        assert result["horzLine"]["width"] == 3
        assert result["horzLine"]["style"] == 1  # LineStyle.DOTTED.value
        assert result["horzLine"]["labelVisible"] is False  # False values are now included

    def test_kinetic_scroll_with_tracking_mode(self):
        """Test KineticScrollOptions with TrackingModeOptions integration."""
        kinetic_scroll = KineticScrollOptions(touch=True, mouse=True)
        tracking_mode = TrackingModeOptions(exit_on_escape=True)

        kinetic_result = kinetic_scroll.asdict()
        tracking_result = tracking_mode.asdict()

        assert kinetic_result["touch"] is True
        assert kinetic_result["mouse"] is True
        assert tracking_result["exitOnEscape"] is True

    def test_crosshair_sync_with_multiple_charts(self):
        """Test CrosshairSyncOptions for multiple chart synchronization."""
        sync_options = CrosshairSyncOptions(group_id=123, suppress_series_animations=True)
        result = sync_options.asdict()

        assert result["groupId"] == 123
        assert result["suppressSeriesAnimations"] is True


class TestInteractionOptionsEdgeCases:
    """Test edge cases for interaction options."""

    def test_crosshair_line_options_with_zero_width(self):
        """Test CrosshairLineOptions with zero width."""
        options = CrosshairLineOptions(width=0)
        result = options.asdict()

        assert result["width"] == 0

    def test_crosshair_line_options_with_large_width(self):
        """Test CrosshairLineOptions with large width."""
        options = CrosshairLineOptions(width=999)
        result = options.asdict()

        assert result["width"] == 999

    def test_crosshair_sync_options_with_zero_group_id(self):
        """Test CrosshairSyncOptions with zero group_id."""
        options = CrosshairSyncOptions(group_id=0)
        result = options.asdict()

        assert result["groupId"] == 0

    def test_crosshair_sync_options_with_negative_group_id(self):
        """Test CrosshairSyncOptions with negative group_id."""
        options = CrosshairSyncOptions(group_id=-1)
        result = options.asdict()

        assert result["groupId"] == -1

    def test_crosshair_options_equality(self):
        """Test equality comparison for crosshair options."""
        vert_line = CrosshairLineOptions(color="#ff0000")
        horz_line = CrosshairLineOptions(color="#00ff00")

        options1 = CrosshairOptions(
            mode=CrosshairMode.NORMAL,
            vert_line=vert_line,
            horz_line=horz_line,
        )
        options2 = CrosshairOptions(
            mode=CrosshairMode.NORMAL,
            vert_line=vert_line,
            horz_line=horz_line,
        )
        options3 = CrosshairOptions(
            mode=CrosshairMode.MAGNET,
            vert_line=vert_line,
            horz_line=horz_line,
        )

        assert options1 == options2
        assert options1 != options3

    def test_crosshair_line_options_equality(self):
        """Test equality comparison for crosshair line options."""
        options1 = CrosshairLineOptions(color="#ff0000", width=2)
        options2 = CrosshairLineOptions(color="#ff0000", width=2)
        options3 = CrosshairLineOptions(color="#ff0000", width=3)

        assert options1 == options2
        assert options1 != options3

    def test_kinetic_scroll_options_equality(self):
        """Test equality comparison for kinetic scroll options."""
        options1 = KineticScrollOptions(touch=True, mouse=False)
        options2 = KineticScrollOptions(touch=True, mouse=False)
        options3 = KineticScrollOptions(touch=False, mouse=False)

        assert options1 == options2
        assert options1 != options3

    def test_tracking_mode_options_equality(self):
        """Test equality comparison for tracking mode options."""
        options1 = TrackingModeOptions(exit_on_escape=True)
        options2 = TrackingModeOptions(exit_on_escape=True)
        options3 = TrackingModeOptions(exit_on_escape=False)

        assert options1 == options2
        assert options1 != options3

    def test_crosshair_sync_options_equality(self):
        """Test equality comparison for crosshair sync options."""
        options1 = CrosshairSyncOptions(group_id=1, suppress_series_animations=True)
        options2 = CrosshairSyncOptions(group_id=1, suppress_series_animations=True)
        options3 = CrosshairSyncOptions(group_id=2, suppress_series_animations=True)

        assert options1 == options2
        assert options1 != options3
