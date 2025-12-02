"""Tests for price scale options classes.

This module contains comprehensive tests for price scale-related option classes:
- PriceScaleOptions
- PriceScaleMargins
"""

import pytest
from lightweight_charts_core.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from lightweight_charts_core.exceptions import TypeValidationError
from lightweight_charts_core.type_definitions.enums import PriceScaleMode


class TestPriceScaleMargins:
    """Test PriceScaleMargins class."""

    def test_default_construction(self):
        """Test construction with default values."""
        margins = PriceScaleMargins()

        assert margins.top == 0.1
        assert margins.bottom == 0.1

    def test_custom_construction(self):
        """Test construction with custom values."""
        margins = PriceScaleMargins(top=0.2, bottom=0.3)

        assert margins.top == 0.2
        assert margins.bottom == 0.3

    def test_validation_top(self):
        """Test validation of top field."""
        options = PriceScaleMargins()

        with pytest.raises(TypeValidationError):
            options.set_top("invalid")

    def test_validation_bottom(self):
        """Test validation of bottom field."""
        options = PriceScaleMargins()

        with pytest.raises(TypeValidationError):
            options.set_bottom("invalid")

    def test_to_dict(self):
        """Test serialization."""
        margins = PriceScaleMargins(top=0.2, bottom=0.3)
        result = margins.asdict()

        assert result["top"] == 0.2
        assert result["bottom"] == 0.3

    def test_to_dict_with_defaults(self):
        """Test serialization with default values."""
        margins = PriceScaleMargins()
        result = margins.asdict()

        assert result["top"] == 0.1
        assert result["bottom"] == 0.1


class TestPriceScaleOptions:
    """Test PriceScaleOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = PriceScaleOptions()

        assert options.visible is True
        assert options.auto_scale is True
        assert isinstance(options.scale_margins, PriceScaleMargins)
        assert options.border_visible is True
        assert options.border_color == "rgba(197, 203, 206, 0.8)"
        assert options.entire_text_only is False
        assert options.mode == PriceScaleMode.NORMAL

    def test_custom_construction(self):
        """Test construction with custom values."""
        scale_margins = PriceScaleMargins(top=0.2, bottom=0.3)

        options = PriceScaleOptions(
            visible=False,
            auto_scale=False,
            scale_margins=scale_margins,
            border_visible=False,
            border_color="#ff0000",
            entire_text_only=True,
            mode=PriceScaleMode.LOGARITHMIC,
        )

        assert options.visible is False
        assert options.auto_scale is False
        assert options.scale_margins == scale_margins
        assert options.border_visible is False
        assert options.border_color == "#ff0000"
        assert options.entire_text_only is True
        assert options.mode == PriceScaleMode.LOGARITHMIC

    def test_validation_visible(self):
        """Test validation of visible field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_visible("invalid")

    def test_validation_auto_scale(self):
        """Test validation of auto_scale field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_auto_scale("invalid")

    def test_validation_mode(self):
        """Test validation of mode field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_mode("invalid")

    def test_validation_invert_scale(self):
        """Test validation of invert_scale field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_invert_scale("invalid")

    def test_validation_border_visible(self):
        """Test validation of border_visible field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_border_visible("invalid")

    def test_validation_border_color(self):
        """Test validation of border_color field."""
        options = PriceScaleOptions()
        with pytest.raises(TypeValidationError):
            options.set_border_color(123)

    def test_validation_text_color(self):
        """Test validation of text_color field."""
        options = PriceScaleOptions()
        with pytest.raises(TypeValidationError):
            options.set_text_color(123)

    def test_validation_ticks_visible(self):
        """Test validation of ticks_visible field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_ticks_visible("invalid")

    def test_validation_ensure_edge_tick_marks_visible(self):
        """Test validation of ensure_edge_tick_marks_visible field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_ensure_edge_tick_marks_visible("invalid")

    def test_validation_align_labels(self):
        """Test validation of align_labels field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_align_labels("invalid")

    def test_validation_entire_text_only(self):
        """Test validation of entire_text_only field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_entire_text_only("invalid")

    def test_validation_minimum_width(self):
        """Test validation of minimum_width field."""
        options = PriceScaleOptions()

        with pytest.raises(TypeValidationError):
            options.set_minimum_width("invalid")

    def test_validation_scale_margins(self):
        """Test validation of scale_margins field."""
        options = PriceScaleOptions()
        with pytest.raises(TypeValidationError):
            options.set_scale_margins("invalid")

    def test_to_dict_basic(self):
        """Test basic serialization."""
        options = PriceScaleOptions()
        result = options.asdict()

        assert result["visible"] is True
        assert result["autoScale"] is True
        assert result["borderVisible"] is True
        assert result["borderColor"] == "rgba(197, 203, 206, 0.8)"
        assert result["entireTextOnly"] is False
        assert result["mode"] == 0  # PriceScaleMode.NORMAL.value

    def test_to_dict_with_scale_margins(self):
        """Test serialization with scale margins."""
        scale_margins = PriceScaleMargins(top=0.2, bottom=0.3)
        options = PriceScaleOptions(scale_margins=scale_margins)
        result = options.asdict()

        assert "scaleMargins" in result
        assert result["scaleMargins"]["top"] == 0.2
        assert result["scaleMargins"]["bottom"] == 0.3

    def test_to_dict_without_scale_margins(self):
        """Test serialization without scale margins."""
        options = PriceScaleOptions(scale_margins=None)
        result = options.asdict()

        assert "scaleMargins" not in result

    def test_to_dict_omits_false_visible(self):
        """Test that visible=False is included in output."""
        options = PriceScaleOptions(visible=False)
        result = options.asdict()

        assert result["visible"] is False

    def test_to_dict_omits_false_auto_scale(self):
        """Test that auto_scale=False is included in output."""
        options = PriceScaleOptions(auto_scale=False)
        result = options.asdict()

        assert result["autoScale"] is False

    def test_to_dict_omits_false_border_visible(self):
        """Test that border_visible=False is included in output."""
        options = PriceScaleOptions(border_visible=False)
        result = options.asdict()

        assert result["borderVisible"] is False

    def test_to_dict_omits_false_entire_text_only(self):
        """Test that entire_text_only=False is included in output."""
        options = PriceScaleOptions(entire_text_only=False)
        result = options.asdict()

        assert result["entireTextOnly"] is False

    def test_to_dict_with_all_fields(self):
        """Test serialization with all fields set."""
        scale_margins = PriceScaleMargins(top=0.15, bottom=0.25)
        options = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            mode=PriceScaleMode.LOGARITHMIC,
            invert_scale=True,
            border_visible=True,
            border_color="#333333",
            text_color="#ffffff",
            ticks_visible=True,
            ensure_edge_tick_marks_visible=True,
            align_labels=True,
            entire_text_only=True,
            minimum_width=100,
            scale_margins=scale_margins,
        )
        result = options.asdict()

        assert result["visible"] is True
        assert result["autoScale"] is True
        assert result["mode"] == 1  # PriceScaleMode.LOGARITHMIC.value
        assert result["invertScale"] is True
        assert result["borderVisible"] is True
        assert result["borderColor"] == "#333333"
        assert result["textColor"] == "#ffffff"
        assert result["ticksVisible"] is True
        assert result["ensureEdgeTickMarksVisible"] is True
        assert result["alignLabels"] is True
        assert result["entireTextOnly"] is True
        assert result["minimumWidth"] == 100
        assert result["scaleMargins"]["top"] == 0.15
        assert result["scaleMargins"]["bottom"] == 0.25


class TestPriceScaleOptionsIntegration:
    """Test integration between price scale option classes."""

    def test_price_scale_options_with_custom_margins(self):
        """Test PriceScaleOptions with custom scale margins."""
        scale_margins = PriceScaleMargins(top=0.15, bottom=0.25)

        options = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            scale_margins=scale_margins,
            border_visible=True,
            border_color="#333333",
            entire_text_only=True,
            mode=PriceScaleMode.LOGARITHMIC,
        )
        result = options.asdict()

        assert result["visible"] is True
        assert result["autoScale"] is True
        assert result["scaleMargins"]["top"] == 0.15
        assert result["scaleMargins"]["bottom"] == 0.25
        assert result["borderVisible"] is True
        assert result["borderColor"] == "#333333"
        assert result["entireTextOnly"] is True
        assert result["mode"] == 1  # PriceScaleMode.LOGARITHMIC.value

    def test_price_scale_options_without_margins(self):
        """Test PriceScaleOptions without scale margins."""
        options = PriceScaleOptions(
            visible=True,
            auto_scale=False,
            scale_margins=None,
            border_visible=False,
            border_color="#ff0000",
            entire_text_only=False,
            mode=PriceScaleMode.NORMAL,
        )
        result = options.asdict()

        assert result["visible"] is True
        assert result["autoScale"] is False
        assert "scaleMargins" not in result
        assert result["borderVisible"] is False
        assert result["borderColor"] == "#ff0000"
        assert result["entireTextOnly"] is False
        assert result["mode"] == 0  # PriceScaleMode.NORMAL.value


class TestPriceScaleOptionsEdgeCases:
    """Test edge cases for price scale options."""

    def test_price_scale_margins_with_zero_values(self):
        """Test PriceScaleMargins with zero values."""
        margins = PriceScaleMargins(top=0.0, bottom=0.0)
        result = margins.asdict()

        assert result["top"] == 0.0
        assert result["bottom"] == 0.0

    def test_price_scale_margins_with_one_values(self):
        """Test PriceScaleMargins with one values."""
        margins = PriceScaleMargins(top=1.0, bottom=1.0)
        result = margins.asdict()

        assert result["top"] == 1.0
        assert result["bottom"] == 1.0

    def test_price_scale_margins_with_negative_values(self):
        """Test PriceScaleMargins with negative values."""
        margins = PriceScaleMargins(top=-0.1, bottom=-0.2)
        result = margins.asdict()

        assert result["top"] == -0.1
        assert result["bottom"] == -0.2

    def test_price_scale_options_with_special_characters_in_color(self):
        """Test PriceScaleOptions with special characters in border color."""
        options = PriceScaleOptions(border_color="rgba(255, 0, 0, 0.5)")
        result = options.asdict()

        assert result["borderColor"] == "rgba(255, 0, 0, 0.5)"

    def test_price_scale_options_with_zero_minimum_width(self):
        """Test PriceScaleOptions with zero minimum_width."""
        options = PriceScaleOptions(minimum_width=0)
        result = options.asdict()

        assert result["minimumWidth"] == 0

    def test_price_scale_options_with_large_minimum_width(self):
        """Test PriceScaleOptions with large minimum_width."""
        options = PriceScaleOptions(minimum_width=10000)
        result = options.asdict()

        assert result["minimumWidth"] == 10000

    def test_price_scale_options_with_negative_minimum_width(self):
        """Test PriceScaleOptions with negative minimum_width."""
        options = PriceScaleOptions(minimum_width=-100)
        result = options.asdict()

        assert result["minimumWidth"] == -100

    def test_price_scale_options_equality(self):
        """Test equality comparison for price scale options."""
        scale_margins = PriceScaleMargins(top=0.2, bottom=0.3)

        options1 = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            scale_margins=scale_margins,
            border_color="#ff0000",
            mode=PriceScaleMode.LOGARITHMIC,
        )
        options2 = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            scale_margins=scale_margins,
            border_color="#ff0000",
            mode=PriceScaleMode.LOGARITHMIC,
        )
        options3 = PriceScaleOptions(
            visible=False,
            auto_scale=True,
            scale_margins=scale_margins,
            border_color="#ff0000",
            mode=PriceScaleMode.LOGARITHMIC,
        )

        assert options1 == options2
        assert options1 != options3

    def test_price_scale_margins_equality(self):
        """Test equality comparison for price scale margins."""
        margins1 = PriceScaleMargins(top=0.2, bottom=0.3)
        margins2 = PriceScaleMargins(top=0.2, bottom=0.3)
        margins3 = PriceScaleMargins(top=0.3, bottom=0.3)

        assert margins1 == margins2
        assert margins1 != margins3

    def test_price_scale_options_repr(self):
        """Test string representation of price scale options."""
        options = PriceScaleOptions(visible=True, border_color="#ff0000")
        repr_str = repr(options)

        assert "PriceScaleOptions" in repr_str
        assert "visible=True" in repr_str
        assert "border_color='#ff0000'" in repr_str

    def test_price_scale_margins_repr(self):
        """Test string representation of price scale margins."""
        margins = PriceScaleMargins(top=0.2, bottom=0.3)
        repr_str = repr(margins)

        assert "PriceScaleMargins" in repr_str
        assert "top=0.2" in repr_str
        assert "bottom=0.3" in repr_str

    def test_price_scale_options_with_all_boolean_fields_false(self):
        """Test PriceScaleOptions with all boolean fields set to False."""
        options = PriceScaleOptions(
            visible=False,
            auto_scale=False,
            invert_scale=False,
            border_visible=False,
            ticks_visible=False,
            ensure_edge_tick_marks_visible=False,
            align_labels=False,
            entire_text_only=False,
        )
        result = options.asdict()

        assert result["visible"] is False
        assert result["autoScale"] is False
        assert result["invertScale"] is False
        assert result["borderVisible"] is False
        assert result["ticksVisible"] is False
        assert result["ensureEdgeTickMarksVisible"] is False
        assert result["alignLabels"] is False
        assert result["entireTextOnly"] is False

    def test_price_scale_options_with_all_boolean_fields_true(self):
        """Test PriceScaleOptions with all boolean fields set to True."""
        options = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            invert_scale=True,
            border_visible=True,
            ticks_visible=True,
            ensure_edge_tick_marks_visible=True,
            align_labels=True,
            entire_text_only=True,
        )
        result = options.asdict()

        assert result["visible"] is True
        assert result["autoScale"] is True
        assert result["invertScale"] is True
        assert result["borderVisible"] is True
        assert result["ticksVisible"] is True
        assert result["ensureEdgeTickMarksVisible"] is True
        assert result["alignLabels"] is True
        assert result["entireTextOnly"] is True

    def test_price_scale_options_with_all_mode_values(self):
        """Test PriceScaleOptions with all PriceScaleMode values."""
        for mode in PriceScaleMode:
            options = PriceScaleOptions(mode=mode)
            result = options.asdict()
            assert result["mode"] == mode.value

    def test_price_scale_options_with_unicode_colors(self):
        """Test PriceScaleOptions with unicode characters in colors."""
        unicode_color = "rgba(255, 0, 0, 0.5) 🎨"
        options = PriceScaleOptions(border_color=unicode_color, text_color=unicode_color)
        result = options.asdict()

        assert result["borderColor"] == unicode_color
        assert result["textColor"] == unicode_color

    def test_price_scale_options_with_very_long_colors(self):
        """Test PriceScaleOptions with very long color strings."""
        long_color = "rgba(" + "255," * 1000 + " 0.5)"
        options = PriceScaleOptions(border_color=long_color, text_color=long_color)
        result = options.asdict()

        assert result["borderColor"] == long_color
        assert result["textColor"] == long_color

    def test_price_scale_options_with_none_scale_margins(self):
        """Test PriceScaleOptions with None scale_margins."""
        options = PriceScaleOptions(scale_margins=None)
        result = options.asdict()

        assert "scaleMargins" not in result

    def test_price_scale_options_with_custom_scale_margins_instance(self):
        """Test PriceScaleOptions with custom PriceScaleMargins instance."""
        custom_margins = PriceScaleMargins(top=0.5, bottom=0.5)
        options = PriceScaleOptions(scale_margins=custom_margins)
        result = options.asdict()

        assert "scaleMargins" in result
        assert result["scaleMargins"]["top"] == 0.5
        assert result["scaleMargins"]["bottom"] == 0.5
