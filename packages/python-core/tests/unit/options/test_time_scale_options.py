"""Unit tests for TimeScaleOptions class.

This module tests the TimeScaleOptions class functionality including
construction, validation, and serialization.
"""

from lightweight_charts_core.charts.options.time_scale_options import TimeScaleOptions


class TestTimeScaleOptions:
    """Test cases for TimeScaleOptions."""

    def test_default_construction(self):
        """Test TimeScaleOptions construction with default values."""
        options = TimeScaleOptions()

        assert options.visible is True
        assert options.time_visible is True
        assert options.seconds_visible is False
        assert options.right_offset == 0
        assert options.left_offset == 0
        assert options.bar_spacing == 6
        assert options.min_bar_spacing == 0.001
        assert options.border_visible is True
        assert options.border_color == "rgba(197, 203, 206, 0.8)"
        assert options.fix_left_edge is False
        assert options.fix_right_edge is False
        assert options.lock_visible_time_range_on_resize is False
        assert options.right_bar_stays_on_scroll is False
        assert options.shift_visible_range_on_new_bar is False
        assert options.allow_shift_visible_range_on_whitespace_access is False
        assert options.tick_mark_formatter is None

    def test_construction_with_parameters(self):
        """Test TimeScaleOptions construction with custom parameters."""
        options = TimeScaleOptions(
            visible=False,
            time_visible=False,
            seconds_visible=True,
            right_offset=5,
            left_offset=3,
            bar_spacing=10,
            min_bar_spacing=0.5,
            border_visible=False,
            border_color="#FF0000",
            fix_left_edge=True,
            fix_right_edge=True,
            lock_visible_time_range_on_resize=True,
            right_bar_stays_on_scroll=True,
            shift_visible_range_on_new_bar=True,
            allow_shift_visible_range_on_whitespace_access=True,
        )

        assert options.visible is False
        assert options.time_visible is False
        assert options.seconds_visible is True
        assert options.right_offset == 5
        assert options.left_offset == 3
        assert options.bar_spacing == 10
        assert options.min_bar_spacing == 0.5
        assert options.border_visible is False
        assert options.border_color == "#FF0000"
        assert options.fix_left_edge is True
        assert options.fix_right_edge is True
        assert options.lock_visible_time_range_on_resize is True
        assert options.right_bar_stays_on_scroll is True
        assert options.shift_visible_range_on_new_bar is True
        assert options.allow_shift_visible_range_on_whitespace_access is True

    def test_asdict_method(self):
        """Test the asdict method returns correct structure."""
        options = TimeScaleOptions(
            visible=False,
            time_visible=False,
            seconds_visible=True,
            right_offset=5,
            left_offset=3,
            bar_spacing=10,
            min_bar_spacing=0.5,
            border_visible=False,
            border_color="#FF0000",
        )

        result = options.asdict()

        assert result["visible"] is False
        assert result["timeVisible"] is False
        assert result["secondsVisible"] is True
        assert result["rightOffset"] == 5
        assert result["leftOffset"] == 3
        assert result["barSpacing"] == 10
        assert result["minBarSpacing"] == 0.5
        assert result["borderVisible"] is False
        assert result["borderColor"] == "#FF0000"

    def test_method_chaining(self):
        """Test method chaining functionality."""
        options = TimeScaleOptions()

        result = (
            options.set_visible(False)
            .set_time_visible(False)
            .set_seconds_visible(True)
            .set_right_offset(5)
            .set_left_offset(3)
            .set_bar_spacing(10)
            .set_min_bar_spacing(0.5)
            .set_border_visible(False)
            .set_border_color("#FF0000")
        )

        assert result is options
        assert options.visible is False
        assert options.time_visible is False
        assert options.seconds_visible is True
        assert options.right_offset == 5
        assert options.left_offset == 3
        assert options.bar_spacing == 10
        assert options.min_bar_spacing == 0.5
        assert options.border_visible is False
        assert options.border_color == "#FF0000"

    def test_validation_border_color(self):
        """Test validation of border_color parameter."""
        # Valid color
        options = TimeScaleOptions(border_color="#FF0000")
        assert options.border_color == "#FF0000"

        # Valid rgba color
        options = TimeScaleOptions(border_color="rgba(255, 0, 0, 0.5)")
        assert options.border_color == "rgba(255, 0, 0, 0.5)"

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Zero values
        options = TimeScaleOptions(
            right_offset=0,
            left_offset=0,
            bar_spacing=0,
            min_bar_spacing=0.0,
        )
        assert options.right_offset == 0
        assert options.left_offset == 0
        assert options.bar_spacing == 0
        assert options.min_bar_spacing == 0.0

        # Negative values
        options = TimeScaleOptions(right_offset=-5, left_offset=-3, bar_spacing=-10)
        assert options.right_offset == -5
        assert options.left_offset == -3
        assert options.bar_spacing == -10

    def test_serialization_consistency(self):
        """Test that serialization is consistent across multiple calls."""
        options = TimeScaleOptions(
            visible=False,
            time_visible=False,
            right_offset=5,
            bar_spacing=10,
            border_color="#FF0000",
        )

        result1 = options.asdict()
        result2 = options.asdict()

        assert result1 == result2

    def test_copy_method(self):
        """Test the copy method creates a new instance with same values."""
        original = TimeScaleOptions(
            visible=False,
            time_visible=False,
            right_offset=5,
            bar_spacing=10,
            border_color="#FF0000",
        )

        # Since TimeScaleOptions doesn't have a copy method, we'll test that
        # we can create a new instance with the same values
        copied = TimeScaleOptions(
            visible=original.visible,
            time_visible=original.time_visible,
            seconds_visible=original.seconds_visible,
            right_offset=original.right_offset,
            left_offset=original.left_offset,
            bar_spacing=original.bar_spacing,
            min_bar_spacing=original.min_bar_spacing,
            fix_left_edge=original.fix_left_edge,
            fix_right_edge=original.fix_right_edge,
            lock_visible_time_range_on_resize=original.lock_visible_time_range_on_resize,
            right_bar_stays_on_scroll=original.right_bar_stays_on_scroll,
            border_visible=original.border_visible,
            border_color=original.border_color,
        )

        assert copied is not original
        assert copied.visible == original.visible
        assert copied.time_visible == original.time_visible
        assert copied.seconds_visible == original.seconds_visible
        assert copied.right_offset == original.right_offset
        assert copied.left_offset == original.left_offset
        assert copied.bar_spacing == original.bar_spacing
        assert copied.min_bar_spacing == original.min_bar_spacing
        assert copied.fix_left_edge == original.fix_left_edge
        assert copied.fix_right_edge == original.fix_right_edge
        assert (
            copied.lock_visible_time_range_on_resize == original.lock_visible_time_range_on_resize
        )
        assert copied.right_bar_stays_on_scroll == original.right_bar_stays_on_scroll
        assert copied.border_visible == original.border_visible
        assert copied.border_color == original.border_color
