"""Comprehensive tests for chainable decorators across all Options classes."""

import pytest
from lightweight_charts_core.charts.options import (
    CrosshairOptions,
    LayoutOptions,
    LegendOptions,
    LineOptions,
    LocalizationOptions,
    PriceFormatOptions,
    PriceLineOptions,
    PriceScaleOptions,
    RangeConfig,
    RangeSwitcherOptions,
    TimeScaleOptions,
    TradeVisualizationOptions,
)
from lightweight_charts_core.exceptions import (
    ColorValidationError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions.enums import (
    CrosshairMode,
    LineStyle,
    LineType,
    PriceScaleMode,
    TradeVisualization,
)


class TestChainableDecorators:
    """Test suite for chainable decorators across all Options classes."""

    def test_line_options_chainable(self):
        """Test LineOptions chainable properties."""
        opts = LineOptions()

        result = (
            opts.set_color("#ff0000")
            .set_line_width(5)
            .set_line_style(LineStyle.DASHED)
            .set_line_type(LineType.CURVED)
            .set_line_visible(False)
        )

        assert result is opts
        assert opts.color == "#ff0000"
        assert opts.line_width == 5
        assert opts.line_style == LineStyle.DASHED
        assert opts.line_type == LineType.CURVED
        assert opts.line_visible is False

    def test_price_line_options_chainable(self):
        """Test PriceLineOptions chainable properties."""
        opts = PriceLineOptions()

        result = (
            opts.set_price(100.5)
            .set_color("#00ff00")
            .set_line_width(3)
            .set_line_style(LineStyle.SOLID)
            .set_line_visible(True)
        )

        assert result is opts
        assert opts.price == 100.5
        assert opts.color == "#00ff00"
        assert opts.line_width == 3
        assert opts.line_style == LineStyle.SOLID
        assert opts.line_visible is True

    def test_price_format_options_chainable(self):
        """Test PriceFormatOptions chainable properties."""
        opts = PriceFormatOptions()

        result = opts.set_type("volume").set_precision(4).set_min_move(0.001)

        assert result is opts
        assert opts.type == "volume"
        assert opts.precision == 4
        assert opts.min_move == 0.001

    def test_layout_options_chainable(self):
        """Test LayoutOptions chainable properties."""
        opts = LayoutOptions()

        result = (
            opts.set_text_color("#333333")
            .set_font_size(14)
            .set_font_family("Arial")
            .set_attribution_logo(True)
        )

        assert result is opts
        assert opts.text_color == "#333333"
        assert opts.font_size == 14
        assert opts.font_family == "Arial"
        assert opts.attribution_logo is True

    def test_price_scale_options_chainable(self):
        """Test PriceScaleOptions chainable properties."""
        opts = PriceScaleOptions()

        result = (
            opts.set_visible(True)
            .set_auto_scale(False)
            .set_mode(PriceScaleMode.LOGARITHMIC)
            .set_border_color("#cccccc")
            .set_text_color("#000000")
        )

        assert result is opts
        assert opts.visible is True
        assert opts.auto_scale is False
        assert opts.mode == PriceScaleMode.LOGARITHMIC
        assert opts.border_color == "#cccccc"
        assert opts.text_color == "#000000"

    def test_crosshair_options_chainable(self):
        """Test CrosshairOptions chainable properties."""
        opts = CrosshairOptions()

        result = (
            opts.set_mode(CrosshairMode.MAGNET)
            .set_vert_line(opts.vert_line.set_color("#ff0000"))
            .set_horz_line(opts.horz_line.set_color("#00ff00"))
        )

        assert result is opts
        assert opts.mode == CrosshairMode.MAGNET
        assert opts.vert_line.color == "#ff0000"
        assert opts.horz_line.color == "#00ff00"

    def test_trade_visualization_options_chainable(self):
        """Test TradeVisualizationOptions chainable properties."""
        opts = TradeVisualizationOptions()

        result = (
            opts.set_style(TradeVisualization.MARKERS)
            .set_entry_marker_color_long("#2196F3")
            .set_exit_marker_color_profit("#4CAF50")
            .set_marker_size(25)
            .set_show_pnl_in_markers(False)
        )

        assert result is opts
        assert opts.style == TradeVisualization.MARKERS
        assert opts.entry_marker_color_long == "#2196F3"
        assert opts.exit_marker_color_profit == "#4CAF50"
        assert opts.marker_size == 25
        assert opts.show_pnl_in_markers is False

    def test_time_scale_options_chainable(self):
        """Test TimeScaleOptions chainable properties."""
        opts = TimeScaleOptions()

        result = (
            opts.set_right_offset(10)
            .set_left_offset(5)
            .set_bar_spacing(8)
            .set_visible(True)
            .set_border_color("#cccccc")
        )

        assert result is opts
        assert opts.right_offset == 10
        assert opts.left_offset == 5
        assert opts.bar_spacing == 8
        assert opts.visible is True
        assert opts.border_color == "#cccccc"

    def test_localization_options_chainable(self):
        """Test LocalizationOptions chainable properties."""
        opts = LocalizationOptions()

        result = opts.set_locale("en-GB").set_date_format("dd/MM/yyyy")

        assert result is opts
        assert opts.locale == "en-GB"
        assert opts.date_format == "dd/MM/yyyy"

    def test_ui_options_chainable(self):
        """Test UI Options chainable properties."""
        # Test RangeConfig
        range_config = RangeConfig()
        result = range_config.set_text("1D").set_tooltip("1 Day")
        assert result is range_config
        assert range_config.text == "1D"
        assert range_config.tooltip == "1 Day"

        # Test RangeSwitcherOptions
        switcher = RangeSwitcherOptions()
        result = switcher.set_visible(True).set_ranges([range_config])
        assert result is switcher
        assert switcher.visible is True
        assert len(switcher.ranges) == 1

        # Test LegendOptions
        legend = LegendOptions()
        result = legend.set_visible(False).set_position("bottom")
        assert result is legend
        assert legend.visible is False
        assert legend.position == "bottom"


class TestTypeValidation:
    """Test type validation in chainable decorators."""

    def test_string_type_validation(self):
        """Test string type validation."""
        opts = LineOptions()

        # Valid
        opts.set_color("#ff0000")

        # Invalid
        with pytest.raises(TypeValidationError):
            opts.set_color(123)

    def test_integer_type_validation(self):
        """Test integer type validation."""
        opts = LineOptions()

        # Valid
        opts.set_line_width(5)

        # Invalid
        with pytest.raises(TypeValidationError):
            opts.set_line_width("invalid")

    def test_boolean_type_validation(self):
        """Test boolean type validation."""
        opts = LineOptions()

        # Valid
        opts.set_line_visible(False)

        # Invalid
        with pytest.raises(TypeValidationError):
            opts.set_line_visible("invalid")

    def test_enum_type_validation(self):
        """Test enum type validation."""
        opts = LineOptions()

        # Valid
        opts.set_line_style(LineStyle.DASHED)

        # Invalid
        with pytest.raises(TypeValidationError):
            opts.set_line_style("invalid")

    def test_float_type_validation(self):
        """Test float type validation."""
        opts = PriceLineOptions()

        # Valid
        opts.set_price(100.5)

        # Invalid
        with pytest.raises(TypeValidationError):
            opts.set_price("invalid")

    def test_multiple_type_validation(self):
        """Test multiple type validation (int or float)."""
        opts = PriceLineOptions()

        # Valid - int
        opts.set_price(100)

        # Valid - float
        opts.set_price(100.5)

        # Invalid
        with pytest.raises(TypeValidationError):
            opts.set_price("invalid")


class TestColorValidation:
    """Test color validation in chainable decorators."""

    def test_valid_colors(self):
        """Test valid color formats."""
        opts = LineOptions()

        # Hex colors
        opts.set_color("#ff0000")
        opts.set_color("#00ff00")
        opts.set_color("#0000ff")
        opts.set_color("#123456")
        opts.set_color("#abcdef")

        # RGBA colors
        opts.set_color("rgba(255,0,0,1)")
        opts.set_color("rgba(0,255,0,0.5)")
        opts.set_color("rgba(0,0,255,0.1)")

    def test_invalid_colors(self):
        """Test invalid color formats."""
        opts = LineOptions()

        # Invalid formats
        with pytest.raises(ColorValidationError):
            opts.set_color("notacolor")

        with pytest.raises(ColorValidationError):
            opts.set_color("hsl(0,100%,50%)")

        # Test hex validation
        with pytest.raises(ColorValidationError):
            opts.set_color("#gggggg")

        with pytest.raises(ColorValidationError):
            opts.set_color("#12")  # Too short

        with pytest.raises(ColorValidationError):
            opts.set_color("#123456789")  # Too long

    def test_color_validation_across_classes(self):
        """Test color validation across different Options classes."""
        # LineOptions
        line_opts = LineOptions()
        line_opts.set_color("#ff0000")
        with pytest.raises(ColorValidationError):
            line_opts.set_color("invalid")

        # PriceLineOptions
        price_opts = PriceLineOptions()
        price_opts.set_color("#00ff00")
        with pytest.raises(ColorValidationError):
            price_opts.set_color("invalid")

        # LayoutOptions
        layout_opts = LayoutOptions()
        layout_opts.set_text_color("#0000ff")
        with pytest.raises(ColorValidationError):
            layout_opts.set_text_color("invalid")


class TestCustomValidators:
    """Test custom validators in chainable decorators."""

    def test_price_format_type_validator(self):
        """Test PriceFormatOptions type validator."""
        opts = PriceFormatOptions()

        # Valid types
        opts.set_type("price")
        opts.set_type("volume")
        opts.set_type("percent")
        opts.set_type("custom")

        # Invalid type
        with pytest.raises(ValueValidationError):
            opts.set_type("invalid")

    def test_price_format_precision_validator(self):
        """Test PriceFormatOptions precision validator."""
        opts = PriceFormatOptions()

        # Valid precision
        opts.set_precision(0)
        opts.set_precision(2)
        opts.set_precision(10)

        # Invalid precision
        with pytest.raises(ValueValidationError):
            opts.set_precision(-1)

        with pytest.raises(TypeValidationError):
            opts.set_precision("invalid")

    def test_price_format_min_move_validator(self):
        """Test PriceFormatOptions min_move validator."""
        opts = PriceFormatOptions()

        # Valid min_move
        opts.set_min_move(0.001)
        opts.set_min_move(1.0)
        opts.set_min_move(100)

        # Invalid min_move
        with pytest.raises(ValueValidationError):
            opts.set_min_move(0)

        with pytest.raises(ValueValidationError):
            opts.set_min_move(-1)

        with pytest.raises(TypeValidationError):
            opts.set_min_move("invalid")


class TestUpdateMethod:
    """Test the update method with chainable decorators."""

    def test_update_with_snake_case(self):
        """Test update method with snake_case keys."""
        opts = LineOptions()

        opts.update(
            {
                "color": "#ff0000",
                "line_width": 5,
                "line_visible": False,
                "line_style": LineStyle.DASHED,
            },
        )

        assert opts.color == "#ff0000"
        assert opts.line_width == 5
        assert opts.line_visible is False
        assert opts.line_style == LineStyle.DASHED

    def test_update_with_camel_case(self):
        """Test update method with camelCase keys."""
        opts = LineOptions()

        opts.update(
            {
                "lineStyle": LineStyle.DASHED,
                "lineWidth": 5,
                "lineVisible": False,
                "pointMarkersVisible": True,
            },
        )

        assert opts.line_style == LineStyle.DASHED
        assert opts.line_width == 5
        assert opts.line_visible is False
        assert opts.point_markers_visible is True

    def test_update_with_mixed_case(self):
        """Test update method with mixed snake_case and camelCase keys."""
        opts = LineOptions()

        opts.update(
            {
                "color": "#ff0000",  # snake_case
                "lineStyle": LineStyle.DASHED,  # camelCase
                "line_width": 5,  # snake_case
                "lineVisible": False,  # camelCase
            },
        )

        assert opts.color == "#ff0000"
        assert opts.line_style == LineStyle.DASHED
        assert opts.line_width == 5
        assert opts.line_visible is False


class TestStaticValidators:
    """Test static validator methods."""

    def test_static_color_validator(self):
        """Test static color validator methods."""
        # Test across different classes that have static color validation methods
        classes_with_static_color_validators = [
            LineOptions,
            PriceLineOptions,
            LayoutOptions,
        ]

        for cls in classes_with_static_color_validators:
            # Valid colors
            assert cls._validate_color_static("#123456", "test") == "#123456"
            assert cls._validate_color_static("rgba(1,2,3,0.5)", "test") == "rgba(1,2,3,0.5)"
            assert cls._validate_color_static("rgb(255,0,0)", "test") == "rgb(255,0,0)"

            # Invalid colors - different classes raise different exceptions
            if cls in [LineOptions, PriceLineOptions]:
                with pytest.raises(ColorValidationError):
                    cls._validate_color_static("notacolor", "test")
            else:
                with pytest.raises(ValueValidationError):
                    cls._validate_color_static("notacolor", "test")

    def test_builtin_color_validator(self):
        """Test built-in color validator via chainable_field."""
        # Test classes that use validator="color" in chainable_field
        classes_with_builtin_color_validators = [
            PriceScaleOptions,
            TradeVisualizationOptions,
            TimeScaleOptions,
        ]

        for cls in classes_with_builtin_color_validators:
            # Test that the setter methods validate colors properly
            instance = cls()

            # Valid colors should work
            if hasattr(instance, "set_border_color"):
                instance.set_border_color("#123456")
                assert instance.border_color == "#123456"

                instance.set_border_color("rgba(1,2,3,0.5)")
                assert instance.border_color == "rgba(1,2,3,0.5)"

            # Invalid colors should raise ColorValidationError
            if hasattr(instance, "set_border_color"):
                with pytest.raises(ColorValidationError):
                    instance.set_border_color("notacolor")

            # Test other color fields if they exist
            if hasattr(instance, "set_text_color"):
                instance.set_text_color("#abcdef")
                assert instance.text_color == "#abcdef"

            if hasattr(instance, "set_color"):
                instance.set_color("#fedcba")
                assert instance.color == "#fedcba"

    def test_static_custom_validators(self):
        """Test static custom validator methods."""
        # PriceFormatOptions validators
        assert PriceFormatOptions._validate_type_static("price") == "price"
        assert PriceFormatOptions._validate_type_static("volume") == "volume"

        with pytest.raises(ValueValidationError):
            PriceFormatOptions._validate_type_static("invalid")

        assert PriceFormatOptions._validate_precision_static(5) == 5
        with pytest.raises(ValueValidationError):
            PriceFormatOptions._validate_precision_static(-1)

        assert PriceFormatOptions._validate_min_move_static(0.001) == 0.001
        with pytest.raises(ValueValidationError):
            PriceFormatOptions._validate_min_move_static(0)
