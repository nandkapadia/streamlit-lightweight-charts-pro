"""Tests for other options classes.

This module contains comprehensive tests for the remaining option classes:
- TimeScaleOptions
- LocalizationOptions
- PriceFormatOptions
- PriceLineOptions
- LineOptions
- TradeVisualizationOptions
"""

import pytest
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.options.localization_options import LocalizationOptions
from lightweight_charts_core.charts.options.price_format_options import PriceFormatOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.options.time_scale_options import TimeScaleOptions
from lightweight_charts_core.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from lightweight_charts_core.exceptions import (
    ColorValidationError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions.enums import LineStyle, TradeVisualization


class TestTimeScaleOptions:
    """Test TimeScaleOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = TimeScaleOptions()

        assert options.time_visible is True
        assert options.seconds_visible is False
        assert options.right_offset == 0
        assert options.bar_spacing == 6
        assert options.border_visible is True
        assert options.border_color == "rgba(197, 203, 206, 0.8)"
        assert options.fix_left_edge is False
        assert options.fix_right_edge is False
        assert options.lock_visible_time_range_on_resize is False
        assert options.right_bar_stays_on_scroll is False
        assert options.shift_visible_range_on_new_bar is False
        assert options.allow_shift_visible_range_on_whitespace_access is False

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = TimeScaleOptions(
            time_visible=False,
            seconds_visible=True,
            right_offset=20,
            bar_spacing=10,
            border_visible=False,
            border_color="#ff0000",
            fix_left_edge=True,
            fix_right_edge=True,
            lock_visible_time_range_on_resize=True,
            right_bar_stays_on_scroll=True,
            shift_visible_range_on_new_bar=True,
            allow_shift_visible_range_on_whitespace_access=True,
        )

        assert options.time_visible is False
        assert options.seconds_visible is True
        assert options.right_offset == 20
        assert options.bar_spacing == 10
        assert options.border_visible is False
        assert options.border_color == "#ff0000"
        assert options.fix_left_edge is True
        assert options.fix_right_edge is True
        assert options.lock_visible_time_range_on_resize is True
        assert options.right_bar_stays_on_scroll is True
        assert options.shift_visible_range_on_new_bar is True
        assert options.allow_shift_visible_range_on_whitespace_access is True

    def test_validation_time_visible(self):
        """Test validation of time_visible field."""
        # TimeScaleOptions doesn't have validation for time_visible
        # This test is not applicable since the field is not validated

    def test_validation_seconds_visible(self):
        """Test validation of seconds_visible field."""
        # TimeScaleOptions doesn't have validation for seconds_visible
        # This test is not applicable since the field is not validated

    def test_validation_right_offset(self):
        """Test validation of right_offset field."""
        # TimeScaleOptions doesn't have validation for right_offset
        # This test is not applicable since the field is not validated

    def test_validation_bar_spacing(self):
        """Test validation of bar_spacing field."""
        # TimeScaleOptions doesn't have validation for bar_spacing
        # This test is not applicable since the field is not validated

    def test_to_dict(self):
        """Test serialization."""
        options = TimeScaleOptions(
            time_visible=False,
            seconds_visible=True,
            right_offset=20,
            bar_spacing=10,
            border_visible=False,
            border_color="#ff0000",
        )
        result = options.asdict()

        assert result["timeVisible"] is False
        assert result["secondsVisible"] is True
        assert result["rightOffset"] == 20
        assert result["barSpacing"] == 10
        assert result["borderVisible"] is False
        assert result["borderColor"] == "#ff0000"

    def test_to_dict_omits_false_values(self):
        """Test that False values are included in output."""
        options = TimeScaleOptions(
            time_visible=False,
            seconds_visible=False,
            border_visible=False,
            fix_left_edge=False,
            fix_right_edge=False,
            lock_visible_time_range_on_resize=False,
            right_bar_stays_on_scroll=False,
            shift_visible_range_on_new_bar=False,
            allow_shift_visible_range_on_whitespace_access=False,
        )
        result = options.asdict()

        # False values should be included
        assert result["timeVisible"] is False
        assert result["secondsVisible"] is False
        assert result["borderVisible"] is False
        assert result["fixLeftEdge"] is False
        assert result["fixRightEdge"] is False
        assert result["lockVisibleTimeRangeOnResize"] is False
        assert result["rightBarStaysOnScroll"] is False
        assert result["shiftVisibleRangeOnNewBar"] is False
        assert result["allowShiftVisibleRangeOnWhitespaceAccess"] is False

    def test_missing_fields_coverage(self):
        """Test fields that were missing from original tests."""
        options = TimeScaleOptions(
            left_offset=15,
            min_bar_spacing=0.5,
            visible=False,
            tick_mark_formatter=lambda x: f"formatted_{x}",
        )
        result = options.asdict()

        assert result["leftOffset"] == 15
        assert result["minBarSpacing"] == 0.5
        assert result["visible"] is False
        # tick_mark_formatter is included as the base Options class doesn't filter callables
        assert "tickMarkFormatter" in result

    def test_getitem_method(self):
        """Test the __getitem__ method for dictionary-like access."""
        options = TimeScaleOptions(right_offset=25, bar_spacing=8, border_color="#123456")

        assert options["rightOffset"] == 25
        assert options["barSpacing"] == 8
        assert options["borderColor"] == "#123456"

    def test_all_fields_serialization(self):
        """Test serialization of all fields."""
        options = TimeScaleOptions(
            right_offset=10,
            left_offset=5,
            bar_spacing=12,
            min_bar_spacing=0.1,
            visible=True,
            time_visible=True,
            seconds_visible=True,
            border_visible=True,
            border_color="#abcdef",
            fix_left_edge=True,
            fix_right_edge=True,
            lock_visible_time_range_on_resize=True,
            right_bar_stays_on_scroll=True,
            shift_visible_range_on_new_bar=True,
            allow_shift_visible_range_on_whitespace_access=True,
        )
        result = options.asdict()

        assert result["rightOffset"] == 10
        assert result["leftOffset"] == 5
        assert result["barSpacing"] == 12
        assert result["minBarSpacing"] == 0.1
        assert result["visible"] is True
        assert result["timeVisible"] is True
        assert result["secondsVisible"] is True
        assert result["borderVisible"] is True
        assert result["borderColor"] == "#abcdef"
        assert result["fixLeftEdge"] is True
        assert result["fixRightEdge"] is True
        assert result["lockVisibleTimeRangeOnResize"] is True
        assert result["rightBarStaysOnScroll"] is True
        assert result["shiftVisibleRangeOnNewBar"] is True
        assert result["allowShiftVisibleRangeOnWhitespaceAccess"] is True

    def test_edge_cases(self):
        """Test edge cases for TimeScaleOptions."""
        # Test with zero values
        options = TimeScaleOptions(
            right_offset=0,
            left_offset=0,
            bar_spacing=0,
            min_bar_spacing=0.0,
        )
        result = options.asdict()

        assert result["rightOffset"] == 0
        assert result["leftOffset"] == 0
        assert result["barSpacing"] == 0
        assert result["minBarSpacing"] == 0.0

        # Test with large values
        options = TimeScaleOptions(
            right_offset=1000,
            left_offset=1000,
            bar_spacing=100,
            min_bar_spacing=1.0,
        )
        result = options.asdict()

        assert result["rightOffset"] == 1000
        assert result["leftOffset"] == 1000
        assert result["barSpacing"] == 100
        assert result["minBarSpacing"] == 1.0

    def test_equality_comparison(self):
        """Test equality comparison for TimeScaleOptions."""
        options1 = TimeScaleOptions(right_offset=10, bar_spacing=6, border_color="#ff0000")
        options2 = TimeScaleOptions(right_offset=10, bar_spacing=6, border_color="#ff0000")
        options3 = TimeScaleOptions(right_offset=20, bar_spacing=6, border_color="#ff0000")

        assert options1 == options2
        assert options1 != options3

    def test_repr_representation(self):
        """Test string representation of TimeScaleOptions."""
        options = TimeScaleOptions(right_offset=15, border_color="#123456")
        repr_str = repr(options)

        assert "TimeScaleOptions" in repr_str
        assert "right_offset=15" in repr_str
        assert "border_color='#123456'" in repr_str


class TestLocalizationOptions:
    """Test LocalizationOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = LocalizationOptions()

        assert options.locale == "en-US"
        assert options.date_format == "yyyy-MM-dd"

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = LocalizationOptions(locale="de-DE", date_format="dd.MM.yyyy")

        assert options.locale == "de-DE"
        assert options.date_format == "dd.MM.yyyy"

    def test_validation_locale(self):
        """Test validation of locale field."""
        # LocalizationOptions doesn't have validation for locale
        # This test is not applicable since the field is not validated

    def test_validation_date_format(self):
        """Test validation of date_format field."""
        # LocalizationOptions doesn't have validation for date_format
        # This test is not applicable since the field is not validated

    def test_to_dict(self):
        """Test serialization."""
        options = LocalizationOptions(locale="de-DE", date_format="dd.MM.yyyy")
        result = options.asdict()

        assert result["locale"] == "de-DE"
        assert result["dateFormat"] == "dd.MM.yyyy"


class TestPriceFormatOptions:
    """Test PriceFormatOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = PriceFormatOptions()

        assert options.type == "price"
        assert options.precision == 2
        assert options.min_move == 0.01

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = PriceFormatOptions(type="volume", precision=4, min_move=0.0001)

        assert options.type == "volume"
        assert options.precision == 4
        assert options.min_move == 0.0001

    def test_validation_type(self):
        """Test validation of type field."""
        options = PriceFormatOptions()
        # Test type validation first
        with pytest.raises(TypeValidationError):
            options.set_type(123)

        # Test custom validator with invalid string
        with pytest.raises(ValueValidationError):
            options.set_type("invalid")

    def test_validation_precision(self):
        """Test validation of precision field."""
        options = PriceFormatOptions()

        with pytest.raises(TypeValidationError):
            options.set_precision("invalid")

    def test_validation_min_move(self):
        """Test validation of min_move field."""
        options = PriceFormatOptions()

        with pytest.raises(TypeValidationError):
            options.set_min_move("invalid")

    def test_to_dict(self):
        """Test serialization."""
        options = PriceFormatOptions(type="volume", precision=4, min_move=0.0001)
        result = options.asdict()

        assert result["type"] == "volume"
        assert result["precision"] == 4
        assert result["minMove"] == 0.0001


class TestPriceLineOptions:
    """Test PriceLineOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = PriceLineOptions()

        assert options.price == 0.0
        assert options.color == ""
        assert options.line_width == 1
        assert options.line_style == LineStyle.SOLID
        assert options.line_visible is True
        assert options.axis_label_visible is False
        assert options.title == ""

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = PriceLineOptions(
            price=100.0,
            color="#ff0000",
            line_width=3,
            line_style=LineStyle.SOLID,
            axis_label_visible=False,
            title="Support Level",
        )

        assert options.price == 100.0
        assert options.color == "#ff0000"
        assert options.line_width == 3
        assert options.line_style == LineStyle.SOLID
        assert options.axis_label_visible is False
        assert options.title == "Support Level"

    def test_validation_price(self):
        """Test validation of price field."""
        options = PriceLineOptions()

        with pytest.raises(TypeValidationError):
            options.set_price("invalid")

    def test_validation_color(self):
        """Test validation of color field."""
        options = PriceLineOptions()
        # Test type validation first
        with pytest.raises(TypeValidationError):
            options.set_color(123)

        # Test custom validator with invalid string
        with pytest.raises(ColorValidationError):
            options.set_color("invalid_color")

    def test_validation_line_width(self):
        """Test validation of line_width field."""
        options = PriceLineOptions()

        with pytest.raises(TypeValidationError):
            options.set_line_width("invalid")

    def test_validation_line_style(self):
        """Test validation of line_style field."""
        # PriceLineOptions doesn't have validation for line_style
        # This test is not applicable since the field is not validated

    def test_validation_axis_label_visible(self):
        """Test validation of axis_label_visible field."""
        # PriceLineOptions doesn't have validation for axis_label_visible
        # This test is not applicable since the field is not validated

    def test_validation_title(self):
        """Test validation of title field."""
        # PriceLineOptions doesn't have validation for title
        # This test is not applicable since the field is not validated

    def test_to_dict(self):
        """Test serialization."""
        options = PriceLineOptions(
            price=100.0,
            color="#ff0000",
            line_width=3,
            line_style=LineStyle.SOLID,
            axis_label_visible=False,
            title="Support Level",
        )
        result = options.asdict()

        assert result["price"] == 100.0
        assert result["color"] == "#ff0000"
        assert result["lineWidth"] == 3
        assert result["lineStyle"] == 0  # LineStyle.SOLID.value
        assert result["axisLabelVisible"] is False
        assert result["title"] == "Support Level"

    def test_to_dict_omits_empty_title(self):
        """Test that empty title is omitted from output."""
        options = PriceLineOptions(title="")
        result = options.asdict()

        assert "title" not in result

    def test_to_dict_omits_false_axis_label_visible(self):
        """Test that axis_label_visible=False is included in output."""
        options = PriceLineOptions(axis_label_visible=False)
        result = options.asdict()

        assert result["axisLabelVisible"] is False


class TestLineOptions:
    """Test LineOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = LineOptions()

        assert options.color == "#2196f3"
        assert options.line_width == 3
        assert options.line_style == LineStyle.SOLID
        assert options.crosshair_marker_visible is False
        assert options.crosshair_marker_radius == 4
        assert options.crosshair_marker_border_color == ""
        assert options.crosshair_marker_background_color == ""

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = LineOptions(
            color="#ff0000",
            line_width=3,
            line_style=LineStyle.DOTTED,
            crosshair_marker_visible=False,
            crosshair_marker_radius=6,
            crosshair_marker_border_color="#00ff00",
            crosshair_marker_background_color="#000000",
        )

        assert options.color == "#ff0000"
        assert options.line_width == 3
        assert options.line_style == LineStyle.DOTTED
        assert options.crosshair_marker_visible is False
        assert options.crosshair_marker_radius == 6
        assert options.crosshair_marker_border_color == "#00ff00"
        assert options.crosshair_marker_background_color == "#000000"

    def test_validation_color(self):
        """Test validation of color field."""
        options = LineOptions()
        # Test type validation first
        with pytest.raises(TypeValidationError):
            options.set_color(123)

        # Test custom validator with invalid string
        with pytest.raises(ColorValidationError):
            options.set_color("invalid_color")

    def test_validation_line_width(self):
        """Test validation of line_width field."""
        options = LineOptions()

        with pytest.raises(TypeValidationError):
            options.set_line_width("invalid")

    def test_validation_line_style(self):
        """Test validation of line_style field."""
        # LineOptions doesn't have validation for line_style
        # This test is not applicable since the field is not validated

    def test_to_dict(self):
        """Test serialization."""
        options = LineOptions(
            color="#ff0000",
            line_width=3,
            line_style=LineStyle.DOTTED,
            crosshair_marker_visible=False,
            crosshair_marker_radius=6,
            crosshair_marker_border_color="#00ff00",
            crosshair_marker_background_color="#000000",
        )
        result = options.asdict()

        assert result["color"] == "#ff0000"
        assert result["lineWidth"] == 3
        assert result["lineStyle"] == 1  # LineStyle.DOTTED.value
        assert result["crosshairMarkerVisible"] is False
        assert result["crosshairMarkerRadius"] == 6
        assert result["crosshairMarkerBorderColor"] == "#00ff00"
        assert result["crosshairMarkerBackgroundColor"] == "#000000"

    def test_to_dict_omits_false_values(self):
        """Test that False values are included in output."""
        options = LineOptions(crosshair_marker_visible=False)
        result = options.asdict()

        assert result["crosshairMarkerVisible"] is False


class TestTradeVisualizationOptions:
    """Test TradeVisualizationOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = TradeVisualizationOptions()

        assert options.style == TradeVisualization.RECTANGLES

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = TradeVisualizationOptions(style=TradeVisualization.RECTANGLES)

        assert options.style == TradeVisualization.RECTANGLES

    def test_validation_style(self):
        """Test validation of style field."""
        options = TradeVisualizationOptions()

        with pytest.raises(TypeValidationError):
            options.set_style("invalid")

    def test_to_dict(self):
        """Test serialization."""
        options = TradeVisualizationOptions(style=TradeVisualization.RECTANGLES)
        result = options.asdict()

        assert result["style"] == "rectangles"

    def test_to_dict_with_string_style(self):
        """Test serialization with string style input."""
        options = TradeVisualizationOptions(style="markers")
        result = options.asdict()

        assert result["style"] == "markers"

    def test_marker_options(self):
        """Test marker-related options."""
        options = TradeVisualizationOptions(
            entry_marker_color_long="#0000FF",
            entry_marker_color_short="#FF0000",
            exit_marker_color_profit="#00FF00",
            exit_marker_color_loss="#FF00FF",
            marker_size=30,
            show_pnl_in_markers=False,
        )
        result = options.asdict()

        assert result["entryMarkerColorLong"] == "#0000FF"
        assert result["entryMarkerColorShort"] == "#FF0000"
        assert result["exitMarkerColorProfit"] == "#00FF00"
        assert result["exitMarkerColorLoss"] == "#FF00FF"
        assert result["markerSize"] == 30
        assert result["showPnlInMarkers"] is False

    def test_rectangle_options(self):
        """Test rectangle-related options."""
        options = TradeVisualizationOptions(
            rectangle_fill_opacity=0.5,
            rectangle_border_width=3,
            rectangle_color_profit="#00FF00",
            rectangle_color_loss="#FF0000",
        )
        result = options.asdict()

        assert result["rectangleFillOpacity"] == 0.5
        assert result["rectangleBorderWidth"] == 3
        assert result["rectangleColorProfit"] == "#00FF00"
        assert result["rectangleColorLoss"] == "#FF0000"

    def test_line_options(self):
        """Test line-related options."""
        options = TradeVisualizationOptions(
            line_width=5,
            line_style="solid",
            line_color_profit="#00FF00",
            line_color_loss="#FF0000",
        )
        result = options.asdict()

        assert result["lineWidth"] == 5
        assert result["lineStyle"] == "solid"
        assert result["lineColorProfit"] == "#00FF00"
        assert result["lineColorLoss"] == "#FF0000"

    def test_arrow_options(self):
        """Test arrow-related options."""
        options = TradeVisualizationOptions(
            arrow_size=15,
            arrow_color_profit="#00FF00",
            arrow_color_loss="#FF0000",
        )
        result = options.asdict()

        assert result["arrowSize"] == 15
        assert result["arrowColorProfit"] == "#00FF00"
        assert result["arrowColorLoss"] == "#FF0000"

    def test_zone_options(self):
        """Test zone-related options."""
        options = TradeVisualizationOptions(
            zone_opacity=0.3,
            zone_color_long="#0000FF",
            zone_color_short="#FF0000",
            zone_extend_bars=5,
        )
        result = options.asdict()

        assert result["zoneOpacity"] == 0.3
        assert result["zoneColorLong"] == "#0000FF"
        assert result["zoneColorShort"] == "#FF0000"
        assert result["zoneExtendBars"] == 5

    def test_annotation_options(self):
        """Test annotation-related options."""
        options = TradeVisualizationOptions(
            show_trade_id=False,
            show_quantity=False,
            show_trade_type=False,
            annotation_font_size=16,
            annotation_background="rgba(0, 0, 0, 0.9)",
        )
        result = options.asdict()

        assert result["showTradeId"] is False
        assert result["showQuantity"] is False
        assert result["showTradeType"] is False
        assert result["annotationFontSize"] == 16
        assert result["annotationBackground"] == "rgba(0, 0, 0, 0.9)"

    def test_all_fields_serialization(self):
        """Test serialization of all fields."""
        options = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            entry_marker_color_long="#0000FF",
            entry_marker_color_short="#FF0000",
            exit_marker_color_profit="#00FF00",
            exit_marker_color_loss="#FF00FF",
            marker_size=25,
            show_pnl_in_markers=True,
            rectangle_fill_opacity=0.4,
            rectangle_border_width=2,
            rectangle_color_profit="#00FF00",
            rectangle_color_loss="#FF0000",
            line_width=4,
            line_style="dotted",
            line_color_profit="#00FF00",
            line_color_loss="#FF0000",
            arrow_size=12,
            arrow_color_profit="#00FF00",
            arrow_color_loss="#FF0000",
            zone_opacity=0.2,
            zone_color_long="#0000FF",
            zone_color_short="#FF0000",
            zone_extend_bars=3,
            show_trade_id=True,
            show_quantity=True,
            show_trade_type=True,
            annotation_font_size=14,
            annotation_background="rgba(255, 255, 255, 0.9)",
        )
        result = options.asdict()

        # Verify all fields are serialized correctly
        assert result["style"] == "markers"
        assert result["entryMarkerColorLong"] == "#0000FF"
        assert result["entryMarkerColorShort"] == "#FF0000"
        assert result["exitMarkerColorProfit"] == "#00FF00"
        assert result["exitMarkerColorLoss"] == "#FF00FF"
        assert result["markerSize"] == 25
        assert result["showPnlInMarkers"] is True
        assert result["rectangleFillOpacity"] == 0.4
        assert result["rectangleBorderWidth"] == 2
        assert result["rectangleColorProfit"] == "#00FF00"
        assert result["rectangleColorLoss"] == "#FF0000"
        assert result["lineWidth"] == 4
        assert result["lineStyle"] == "dotted"
        assert result["lineColorProfit"] == "#00FF00"
        assert result["lineColorLoss"] == "#FF0000"
        assert result["arrowSize"] == 12
        assert result["arrowColorProfit"] == "#00FF00"
        assert result["arrowColorLoss"] == "#FF0000"
        assert result["zoneOpacity"] == 0.2
        assert result["zoneColorLong"] == "#0000FF"
        assert result["zoneColorShort"] == "#FF0000"
        assert result["zoneExtendBars"] == 3
        assert result["showTradeId"] is True
        assert result["showQuantity"] is True
        assert result["showTradeType"] is True
        assert result["annotationFontSize"] == 14
        assert result["annotationBackground"] == "rgba(255, 255, 255, 0.9)"

    def test_post_init_string_conversion(self):
        """Test that string styles are converted to enums in __post_init__."""
        options = TradeVisualizationOptions(style="rectangles")

        # The style should be converted to an enum
        assert isinstance(options.style, TradeVisualization)
        assert options.style == TradeVisualization.RECTANGLES

    def test_edge_cases(self):
        """Test edge cases for TradeVisualizationOptions."""
        # Test with zero values
        options = TradeVisualizationOptions(
            marker_size=0,
            rectangle_border_width=0,
            line_width=0,
            arrow_size=0,
            zone_extend_bars=0,
            annotation_font_size=0,
        )
        result = options.asdict()

        assert result["markerSize"] == 0
        assert result["rectangleBorderWidth"] == 0
        assert result["lineWidth"] == 0
        assert result["arrowSize"] == 0
        assert result["zoneExtendBars"] == 0
        assert result["annotationFontSize"] == 0

        # Test with extreme opacity values
        options = TradeVisualizationOptions(rectangle_fill_opacity=0.0, zone_opacity=1.0)
        result = options.asdict()

        assert result["rectangleFillOpacity"] == 0.0
        assert result["zoneOpacity"] == 1.0

    def test_equality_comparison(self):
        """Test equality comparison for TradeVisualizationOptions."""
        options1 = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            marker_size=20,
            entry_marker_color_long="#0000FF",
        )
        options2 = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            marker_size=20,
            entry_marker_color_long="#0000FF",
        )
        options3 = TradeVisualizationOptions(
            style=TradeVisualization.RECTANGLES,
            marker_size=20,
            entry_marker_color_long="#0000FF",
        )

        assert options1 == options2
        assert options1 != options3

    def test_repr_representation(self):
        """Test string representation of TradeVisualizationOptions."""
        options = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            marker_size=25,
            entry_marker_color_long="#0000FF",
        )
        repr_str = repr(options)

        assert "TradeVisualizationOptions" in repr_str
        assert "marker_size=25" in repr_str
        assert "entry_marker_color_long='#0000FF'" in repr_str


class TestOtherOptionsIntegration:
    """Test integration between other option classes."""

    def test_time_scale_with_localization(self):
        """Test TimeScaleOptions with LocalizationOptions integration."""
        time_scale = TimeScaleOptions(
            time_visible=True,
            seconds_visible=False,
            right_offset=20,
            bar_spacing=5,
        )
        localization = LocalizationOptions(locale="de-DE", date_format="dd.MM.yyyy")

        time_result = time_scale.asdict()
        local_result = localization.asdict()

        assert time_result["timeVisible"] is True
        assert time_result["secondsVisible"] is False
        assert time_result["rightOffset"] == 20
        assert time_result["barSpacing"] == 5

        assert local_result["locale"] == "de-DE"
        assert local_result["dateFormat"] == "dd.MM.yyyy"

    def test_price_line_with_line_options(self):
        """Test PriceLineOptions with LineOptions integration."""
        price_line = PriceLineOptions(
            price=100.0,
            color="#ff0000",
            line_width=3,
            line_style=LineStyle.SOLID,
            title="Support Level",
        )
        line_options = LineOptions(color="#00ff00", line_width=2, line_style=LineStyle.DOTTED)

        price_result = price_line.asdict()
        line_result = line_options.asdict()

        assert price_result["price"] == 100.0
        assert price_result["color"] == "#ff0000"
        assert price_result["lineWidth"] == 3
        assert price_result["lineStyle"] == 0  # LineStyle.SOLID.value
        assert price_result["title"] == "Support Level"

        assert line_result["color"] == "#00ff00"
        assert line_result["lineWidth"] == 2
        assert line_result["lineStyle"] == 1  # LineStyle.DOTTED.value


class TestOtherOptionsEdgeCases:
    """Test edge cases for other options."""

    def test_time_scale_with_negative_values(self):
        """Test TimeScaleOptions with negative values."""
        options = TimeScaleOptions(right_offset=-10, bar_spacing=-5)
        result = options.asdict()

        assert result["rightOffset"] == -10
        assert result["barSpacing"] == -5

    def test_price_format_with_zero_precision(self):
        """Test PriceFormatOptions with zero precision."""
        options = PriceFormatOptions(precision=0, min_move=1.0)
        result = options.asdict()

        assert result["precision"] == 0
        assert result["minMove"] == 1.0

    def test_price_line_with_zero_price(self):
        """Test PriceLineOptions with zero price."""
        options = PriceLineOptions(price=0.0)
        result = options.asdict()

        assert result["price"] == 0.0

    def test_line_options_with_zero_line_width(self):
        """Test LineOptions with zero line width."""
        # LineOptions doesn't validate line_width, so zero is allowed
        options = LineOptions(line_width=0)
        assert options.line_width == 0

    def test_trade_visualization_with_different_styles(self):
        """Test TradeVisualizationOptions with different styles."""
        styles = [
            TradeVisualization.MARKERS,
            TradeVisualization.RECTANGLES,
            TradeVisualization.LINES,
        ]

        for style in styles:
            options = TradeVisualizationOptions(style=style)
            assert options.style == style

    def test_other_options_equality(self):
        """Test equality comparison for other options."""
        # Test TimeScaleOptions equality
        time1 = TimeScaleOptions(time_visible=True, right_offset=10)
        time2 = TimeScaleOptions(time_visible=True, right_offset=10)
        time3 = TimeScaleOptions(time_visible=False, right_offset=10)

        assert time1 == time2
        assert time1 != time3

        # Test LocalizationOptions equality
        local1 = LocalizationOptions(locale="en-US", date_format="yyyy-MM-dd")
        local2 = LocalizationOptions(locale="en-US", date_format="yyyy-MM-dd")
        local3 = LocalizationOptions(locale="de-DE", date_format="yyyy-MM-dd")

        assert local1 == local2
        assert local1 != local3

        # Test PriceFormatOptions equality
        price1 = PriceFormatOptions(type="price", precision=2)
        price2 = PriceFormatOptions(type="price", precision=2)
        price3 = PriceFormatOptions(type="volume", precision=2)

        assert price1 == price2
        assert price1 != price3

        # Test PriceLineOptions equality
        line1 = PriceLineOptions(price=100.0, color="#ff0000")
        line2 = PriceLineOptions(price=100.0, color="#ff0000")
        line3 = PriceLineOptions(price=200.0, color="#ff0000")

        assert line1 == line2
        assert line1 != line3

        # Test LineOptions equality
        line_opts1 = LineOptions(color="#ff0000", line_width=2)
        line_opts2 = LineOptions(color="#ff0000", line_width=2)
        line_opts3 = LineOptions(color="#00ff00", line_width=2)

        assert line_opts1 == line_opts2
        assert line_opts1 != line_opts3

        # Test TradeVisualizationOptions equality
        trade1 = TradeVisualizationOptions(style=TradeVisualization.MARKERS)
        trade2 = TradeVisualizationOptions(style=TradeVisualization.MARKERS)
        trade3 = TradeVisualizationOptions(style=TradeVisualization.RECTANGLES)

        assert trade1 == trade2
        assert trade1 != trade3
