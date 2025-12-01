"""Tests for TradeVisualizationOptions.

This module contains comprehensive tests for the TradeVisualizationOptions class,
covering construction, validation, serialization, edge cases, and integration scenarios.
"""

import time

import pytest
from lightweight_charts_core.charts.options import ChartOptions
from lightweight_charts_core.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from lightweight_charts_core.type_definitions.enums import TradeVisualization


class TestTradeVisualizationOptionsConstruction:
    """Test TradeVisualizationOptions construction and initialization."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = TradeVisualizationOptions()

        assert options.style == TradeVisualization.RECTANGLES
        assert options.entry_marker_color_long == "#2196F3"
        assert options.entry_marker_color_short == "#FF9800"
        assert options.exit_marker_color_profit == "#4CAF50"
        assert options.exit_marker_color_loss == "#F44336"
        assert options.marker_size == 5
        assert options.show_pnl_in_markers is False
        assert options.rectangle_fill_opacity == 0.1
        assert options.rectangle_border_width == 1
        assert options.rectangle_color_profit == "#4CAF50"
        assert options.rectangle_color_loss == "#F44336"
        assert options.line_width == 2
        assert options.line_style == "dashed"
        assert options.line_color_profit == "#4CAF50"
        assert options.line_color_loss == "#F44336"
        assert options.arrow_size == 10
        assert options.arrow_color_profit == "#4CAF50"
        assert options.arrow_color_loss == "#F44336"
        assert options.zone_opacity == 0.1
        assert options.zone_color_long == "#2196F3"
        assert options.zone_color_short == "#FF9800"
        assert options.zone_extend_bars == 2
        assert options.show_trade_id is False
        assert options.show_quantity is True
        assert options.show_trade_type is True
        assert options.annotation_font_size == 12
        assert options.annotation_background == "rgba(255, 255, 255, 0.8)"

    def test_custom_construction_with_enum_style(self):
        """Test construction with custom enum style."""
        options = TradeVisualizationOptions(style=TradeVisualization.MARKERS)

        assert options.style == TradeVisualization.MARKERS

    def test_custom_construction_with_string_style(self):
        """Test construction with custom string style."""
        options = TradeVisualizationOptions(style="rectangles")

        assert options.style == TradeVisualization.RECTANGLES

    def test_custom_construction_with_all_parameters(self):
        """Test construction with all custom parameters."""
        options = TradeVisualizationOptions(
            style=TradeVisualization.LINES,
            entry_marker_color_long="#0000FF",
            entry_marker_color_short="#FF0000",
            exit_marker_color_profit="#00FF00",
            exit_marker_color_loss="#FF00FF",
            marker_size=30,
            show_pnl_in_markers=False,
            rectangle_fill_opacity=0.5,
            rectangle_border_width=3,
            rectangle_color_profit="#00FF00",
            rectangle_color_loss="#FF0000",
            line_width=5,
            line_style="solid",
            line_color_profit="#00FF00",
            line_color_loss="#FF0000",
            arrow_size=15,
            arrow_color_profit="#00FF00",
            arrow_color_loss="#FF0000",
            zone_opacity=0.3,
            zone_color_long="#0000FF",
            zone_color_short="#FF0000",
            zone_extend_bars=5,
            show_trade_id=False,
            show_quantity=False,
            show_trade_type=False,
            annotation_font_size=16,
            annotation_background="rgba(0, 0, 0, 0.9)",
        )

        assert options.style == TradeVisualization.LINES
        assert options.entry_marker_color_long == "#0000FF"
        assert options.entry_marker_color_short == "#FF0000"
        assert options.exit_marker_color_profit == "#00FF00"
        assert options.exit_marker_color_loss == "#FF00FF"
        assert options.marker_size == 30
        assert options.show_pnl_in_markers is False
        assert options.rectangle_fill_opacity == 0.5
        assert options.rectangle_border_width == 3
        assert options.rectangle_color_profit == "#00FF00"
        assert options.rectangle_color_loss == "#FF0000"
        assert options.line_width == 5
        assert options.line_style == "solid"
        assert options.line_color_profit == "#00FF00"
        assert options.line_color_loss == "#FF0000"
        assert options.arrow_size == 15
        assert options.arrow_color_profit == "#00FF00"
        assert options.arrow_color_loss == "#FF0000"
        assert options.zone_opacity == 0.3
        assert options.zone_color_long == "#0000FF"
        assert options.zone_color_short == "#FF0000"
        assert options.zone_extend_bars == 5
        assert options.show_trade_id is False
        assert options.show_quantity is False
        assert options.show_trade_type is False
        assert options.annotation_font_size == 16
        assert options.annotation_background == "rgba(0, 0, 0, 0.9)"


class TestTradeVisualizationOptionsValidation:
    """Test TradeVisualizationOptions validation."""

    def test_validation_invalid_style_string(self):
        """Test validation of invalid style string."""
        with pytest.raises(ValueError, match="'invalid' is not a valid TradeVisualization"):
            TradeVisualizationOptions(style="invalid")

    def test_validation_invalid_style_type(self):
        """Test validation of invalid style type."""
        with pytest.raises(ValueError, match="'invalid' is not a valid TradeVisualization"):
            TradeVisualizationOptions(style="invalid")

    def test_validation_style_case_insensitive(self):
        """Test that style validation is case insensitive."""
        options = TradeVisualizationOptions(style="MARKERS")
        assert options.style == TradeVisualization.MARKERS

        options = TradeVisualizationOptions(style="markers")
        assert options.style == TradeVisualization.MARKERS

        options = TradeVisualizationOptions(style="Markers")
        assert options.style == TradeVisualization.MARKERS


class TestTradeVisualizationOptionsSerialization:
    """Test TradeVisualizationOptions serialization to dictionary."""

    def test_to_dict_default_values(self):
        """Test serialization with default values."""
        options = TradeVisualizationOptions()
        result = options.asdict()

        assert result["style"] == "rectangles"
        assert result["entryMarkerColorLong"] == "#2196F3"
        assert result["entryMarkerColorShort"] == "#FF9800"
        assert result["exitMarkerColorProfit"] == "#4CAF50"
        assert result["exitMarkerColorLoss"] == "#F44336"
        assert result["markerSize"] == 5
        assert result["showPnlInMarkers"] is False
        assert result["rectangleFillOpacity"] == 0.1
        assert result["rectangleBorderWidth"] == 1
        assert result["rectangleColorProfit"] == "#4CAF50"
        assert result["rectangleColorLoss"] == "#F44336"
        assert result["lineWidth"] == 2
        assert result["lineStyle"] == "dashed"
        assert result["lineColorProfit"] == "#4CAF50"
        assert result["lineColorLoss"] == "#F44336"
        assert result["arrowSize"] == 10
        assert result["arrowColorProfit"] == "#4CAF50"
        assert result["arrowColorLoss"] == "#F44336"
        assert result["zoneOpacity"] == 0.1
        assert result["zoneColorLong"] == "#2196F3"
        assert result["zoneColorShort"] == "#FF9800"
        assert result["zoneExtendBars"] == 2
        assert result["showTradeId"] is False
        assert result["showQuantity"] is True
        assert result["showTradeType"] is True
        assert result["annotationFontSize"] == 12
        assert result["annotationBackground"] == "rgba(255, 255, 255, 0.8)"

    def test_to_dict_custom_values(self):
        """Test serialization with custom values."""
        options = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            entry_marker_color_long="#0000FF",
            entry_marker_color_short="#FF0000",
            exit_marker_color_profit="#00FF00",
            exit_marker_color_loss="#FF00FF",
            marker_size=30,
            show_pnl_in_markers=False,
            rectangle_fill_opacity=0.5,
            rectangle_border_width=3,
            rectangle_color_profit="#00FF00",
            rectangle_color_loss="#FF0000",
            line_width=5,
            line_style="solid",
            line_color_profit="#00FF00",
            line_color_loss="#FF0000",
            arrow_size=15,
            arrow_color_profit="#00FF00",
            arrow_color_loss="#FF0000",
            zone_opacity=0.3,
            zone_color_long="#0000FF",
            zone_color_short="#FF0000",
            zone_extend_bars=5,
            show_trade_id=False,
            show_quantity=False,
            show_trade_type=False,
            annotation_font_size=16,
            annotation_background="rgba(0, 0, 0, 0.9)",
        )
        result = options.asdict()

        assert result["style"] == "markers"
        assert result["entryMarkerColorLong"] == "#0000FF"
        assert result["entryMarkerColorShort"] == "#FF0000"
        assert result["exitMarkerColorProfit"] == "#00FF00"
        assert result["exitMarkerColorLoss"] == "#FF00FF"
        assert result["markerSize"] == 30
        assert result["showPnlInMarkers"] is False
        assert result["rectangleFillOpacity"] == 0.5
        assert result["rectangleBorderWidth"] == 3
        assert result["rectangleColorProfit"] == "#00FF00"
        assert result["rectangleColorLoss"] == "#FF0000"
        assert result["lineWidth"] == 5
        assert result["lineStyle"] == "solid"
        assert result["lineColorProfit"] == "#00FF00"
        assert result["lineColorLoss"] == "#FF0000"
        assert result["arrowSize"] == 15
        assert result["arrowColorProfit"] == "#00FF00"
        assert result["arrowColorLoss"] == "#FF0000"
        assert result["zoneOpacity"] == 0.3
        assert result["zoneColorLong"] == "#0000FF"
        assert result["zoneColorShort"] == "#FF0000"
        assert result["zoneExtendBars"] == 5
        assert result["showTradeId"] is False
        assert result["showQuantity"] is False
        assert result["showTradeType"] is False
        assert result["annotationFontSize"] == 16
        assert result["annotationBackground"] == "rgba(0, 0, 0, 0.9)"

    def test_to_dict_all_visualization_styles(self):
        """Test serialization for all visualization styles."""
        styles = [
            TradeVisualization.MARKERS,
            TradeVisualization.RECTANGLES,
            TradeVisualization.BOTH,
            TradeVisualization.LINES,
            TradeVisualization.ARROWS,
            TradeVisualization.ZONES,
        ]

        for style in styles:
            options = TradeVisualizationOptions(style=style)
            result = options.asdict()
            assert result["style"] == style.value

    def test_to_dict_string_style_conversion(self):
        """Test that string styles are properly converted in serialization."""
        options = TradeVisualizationOptions(style="markers")
        result = options.asdict()
        assert result["style"] == "markers"

        options = TradeVisualizationOptions(style="RECTANGLES")
        result = options.asdict()
        assert result["style"] == "rectangles"


class TestTradeVisualizationOptionsMarkerOptions:
    """Test TradeVisualizationOptions marker-specific options."""

    def test_marker_colors(self):
        """Test marker color options."""
        options = TradeVisualizationOptions(
            entry_marker_color_long="#0000FF",
            entry_marker_color_short="#FF0000",
            exit_marker_color_profit="#00FF00",
            exit_marker_color_loss="#FF00FF",
        )
        result = options.asdict()

        assert result["entryMarkerColorLong"] == "#0000FF"
        assert result["entryMarkerColorShort"] == "#FF0000"
        assert result["exitMarkerColorProfit"] == "#00FF00"
        assert result["exitMarkerColorLoss"] == "#FF00FF"

    def test_marker_size(self):
        """Test marker size option."""
        options = TradeVisualizationOptions(marker_size=25)
        result = options.asdict()

        assert result["markerSize"] == 25

    def test_show_pnl_in_markers(self):
        """Test show P&L in markers option."""
        options = TradeVisualizationOptions(show_pnl_in_markers=False)
        result = options.asdict()

        assert result["showPnlInMarkers"] is False

    def test_marker_options_combined(self):
        """Test all marker options together."""
        options = TradeVisualizationOptions(
            entry_marker_color_long="#0000FF",
            entry_marker_color_short="#FF0000",
            exit_marker_color_profit="#00FF00",
            exit_marker_color_loss="#FF00FF",
            marker_size=30,
            show_pnl_in_markers=True,
        )
        result = options.asdict()

        assert result["entryMarkerColorLong"] == "#0000FF"
        assert result["entryMarkerColorShort"] == "#FF0000"
        assert result["exitMarkerColorProfit"] == "#00FF00"
        assert result["exitMarkerColorLoss"] == "#FF00FF"
        assert result["markerSize"] == 30
        assert result["showPnlInMarkers"] is True


class TestTradeVisualizationOptionsRectangleOptions:
    """Test TradeVisualizationOptions rectangle-specific options."""

    def test_rectangle_fill_opacity(self):
        """Test rectangle fill opacity option."""
        options = TradeVisualizationOptions(rectangle_fill_opacity=0.5)
        result = options.asdict()

        assert result["rectangleFillOpacity"] == 0.5

    def test_rectangle_border_width(self):
        """Test rectangle border width option."""
        options = TradeVisualizationOptions(rectangle_border_width=3)
        result = options.asdict()

        assert result["rectangleBorderWidth"] == 3

    def test_rectangle_colors(self):
        """Test rectangle color options."""
        options = TradeVisualizationOptions(
            rectangle_color_profit="#00FF00",
            rectangle_color_loss="#FF0000",
        )
        result = options.asdict()

        assert result["rectangleColorProfit"] == "#00FF00"
        assert result["rectangleColorLoss"] == "#FF0000"

    def test_rectangle_options_combined(self):
        """Test all rectangle options together."""
        options = TradeVisualizationOptions(
            rectangle_fill_opacity=0.4,
            rectangle_border_width=2,
            rectangle_color_profit="#00FF00",
            rectangle_color_loss="#FF0000",
        )
        result = options.asdict()

        assert result["rectangleFillOpacity"] == 0.4
        assert result["rectangleBorderWidth"] == 2
        assert result["rectangleColorProfit"] == "#00FF00"
        assert result["rectangleColorLoss"] == "#FF0000"


class TestTradeVisualizationOptionsLineOptions:
    """Test TradeVisualizationOptions line-specific options."""

    def test_line_width(self):
        """Test line width option."""
        options = TradeVisualizationOptions(line_width=5)
        result = options.asdict()

        assert result["lineWidth"] == 5

    def test_line_style(self):
        """Test line style option."""
        options = TradeVisualizationOptions(line_style="solid")
        result = options.asdict()

        assert result["lineStyle"] == "solid"

    def test_line_colors(self):
        """Test line color options."""
        options = TradeVisualizationOptions(line_color_profit="#00FF00", line_color_loss="#FF0000")
        result = options.asdict()

        assert result["lineColorProfit"] == "#00FF00"
        assert result["lineColorLoss"] == "#FF0000"

    def test_line_options_combined(self):
        """Test all line options together."""
        options = TradeVisualizationOptions(
            line_width=4,
            line_style="dotted",
            line_color_profit="#00FF00",
            line_color_loss="#FF0000",
        )
        result = options.asdict()

        assert result["lineWidth"] == 4
        assert result["lineStyle"] == "dotted"
        assert result["lineColorProfit"] == "#00FF00"
        assert result["lineColorLoss"] == "#FF0000"


class TestTradeVisualizationOptionsArrowOptions:
    """Test TradeVisualizationOptions arrow-specific options."""

    def test_arrow_size(self):
        """Test arrow size option."""
        options = TradeVisualizationOptions(arrow_size=15)
        result = options.asdict()

        assert result["arrowSize"] == 15

    def test_arrow_colors(self):
        """Test arrow color options."""
        options = TradeVisualizationOptions(
            arrow_color_profit="#00FF00",
            arrow_color_loss="#FF0000",
        )
        result = options.asdict()

        assert result["arrowColorProfit"] == "#00FF00"
        assert result["arrowColorLoss"] == "#FF0000"

    def test_arrow_options_combined(self):
        """Test all arrow options together."""
        options = TradeVisualizationOptions(
            arrow_size=12,
            arrow_color_profit="#00FF00",
            arrow_color_loss="#FF0000",
        )
        result = options.asdict()

        assert result["arrowSize"] == 12
        assert result["arrowColorProfit"] == "#00FF00"
        assert result["arrowColorLoss"] == "#FF0000"


class TestTradeVisualizationOptionsZoneOptions:
    """Test TradeVisualizationOptions zone-specific options."""

    def test_zone_opacity(self):
        """Test zone opacity option."""
        options = TradeVisualizationOptions(zone_opacity=0.3)
        result = options.asdict()

        assert result["zoneOpacity"] == 0.3

    def test_zone_colors(self):
        """Test zone color options."""
        options = TradeVisualizationOptions(zone_color_long="#0000FF", zone_color_short="#FF0000")
        result = options.asdict()

        assert result["zoneColorLong"] == "#0000FF"
        assert result["zoneColorShort"] == "#FF0000"

    def test_zone_extend_bars(self):
        """Test zone extend bars option."""
        options = TradeVisualizationOptions(zone_extend_bars=5)
        result = options.asdict()

        assert result["zoneExtendBars"] == 5

    def test_zone_options_combined(self):
        """Test all zone options together."""
        options = TradeVisualizationOptions(
            zone_opacity=0.2,
            zone_color_long="#0000FF",
            zone_color_short="#FF0000",
            zone_extend_bars=3,
        )
        result = options.asdict()

        assert result["zoneOpacity"] == 0.2
        assert result["zoneColorLong"] == "#0000FF"
        assert result["zoneColorShort"] == "#FF0000"
        assert result["zoneExtendBars"] == 3


class TestTradeVisualizationOptionsAnnotationOptions:
    """Test TradeVisualizationOptions annotation-specific options."""

    def test_show_trade_id(self):
        """Test show trade ID option."""
        options = TradeVisualizationOptions(show_trade_id=False)
        result = options.asdict()

        assert result["showTradeId"] is False

    def test_show_quantity(self):
        """Test show quantity option."""
        options = TradeVisualizationOptions(show_quantity=False)
        result = options.asdict()

        assert result["showQuantity"] is False

    def test_show_trade_type(self):
        """Test show trade type option."""
        options = TradeVisualizationOptions(show_trade_type=False)
        result = options.asdict()

        assert result["showTradeType"] is False

    def test_annotation_font_size(self):
        """Test annotation font size option."""
        options = TradeVisualizationOptions(annotation_font_size=16)
        result = options.asdict()

        assert result["annotationFontSize"] == 16

    def test_annotation_background(self):
        """Test annotation background option."""
        options = TradeVisualizationOptions(annotation_background="rgba(0, 0, 0, 0.9)")
        result = options.asdict()

        assert result["annotationBackground"] == "rgba(0, 0, 0, 0.9)"

    def test_annotation_options_combined(self):
        """Test all annotation options together."""
        options = TradeVisualizationOptions(
            show_trade_id=False,
            show_quantity=False,
            show_trade_type=False,
            annotation_font_size=14,
            annotation_background="rgba(255, 255, 255, 0.9)",
        )
        result = options.asdict()

        assert result["showTradeId"] is False
        assert result["showQuantity"] is False
        assert result["showTradeType"] is False
        assert result["annotationFontSize"] == 14
        assert result["annotationBackground"] == "rgba(255, 255, 255, 0.9)"


class TestTradeVisualizationOptionsEdgeCases:
    """Test TradeVisualizationOptions edge cases and boundary conditions."""

    def test_zero_values(self):
        """Test with zero values for numeric fields."""
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

    def test_extreme_opacity_values(self):
        """Test with extreme opacity values."""
        options = TradeVisualizationOptions(rectangle_fill_opacity=0.0, zone_opacity=1.0)
        result = options.asdict()

        assert result["rectangleFillOpacity"] == 0.0
        assert result["zoneOpacity"] == 1.0

    def test_large_numeric_values(self):
        """Test with large numeric values."""
        options = TradeVisualizationOptions(
            marker_size=100,
            rectangle_border_width=10,
            line_width=20,
            arrow_size=50,
            zone_extend_bars=100,
            annotation_font_size=50,
        )
        result = options.asdict()

        assert result["markerSize"] == 100
        assert result["rectangleBorderWidth"] == 10
        assert result["lineWidth"] == 20
        assert result["arrowSize"] == 50
        assert result["zoneExtendBars"] == 100
        assert result["annotationFontSize"] == 50

    def test_special_color_formats(self):
        """Test with special color formats."""
        options = TradeVisualizationOptions(
            entry_marker_color_long="rgb(255, 0, 0)",
            entry_marker_color_short="rgba(0, 255, 0, 0.5)",
            exit_marker_color_profit="hsl(120, 100%, 50%)",
            exit_marker_color_loss="transparent",
        )
        result = options.asdict()

        assert result["entryMarkerColorLong"] == "rgb(255, 0, 0)"
        assert result["entryMarkerColorShort"] == "rgba(0, 255, 0, 0.5)"
        assert result["exitMarkerColorProfit"] == "hsl(120, 100%, 50%)"
        assert result["exitMarkerColorLoss"] == "transparent"

    def test_empty_string_values(self):
        """Test with empty string values."""
        options = TradeVisualizationOptions(
            entry_marker_color_long="",
            line_style="",
            annotation_background="",
        )
        result = options.asdict()

        # Empty strings should be omitted from the result
        assert "entryMarkerColorLong" not in result
        assert "lineStyle" not in result
        assert "annotationBackground" not in result


class TestTradeVisualizationOptionsEquality:
    """Test TradeVisualizationOptions equality comparison."""

    def test_equality_same_values(self):
        """Test equality with same values."""
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

        assert options1 == options2
        # TradeVisualizationOptions is not hashable, so we can't test hash equality

    def test_inequality_different_values(self):
        """Test inequality with different values."""
        options1 = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            marker_size=20,
            entry_marker_color_long="#0000FF",
        )
        options2 = TradeVisualizationOptions(
            style=TradeVisualization.RECTANGLES,
            marker_size=20,
            entry_marker_color_long="#0000FF",
        )
        options3 = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            marker_size=25,
            entry_marker_color_long="#0000FF",
        )

        assert options1 != options2
        assert options1 != options3
        assert options2 != options3

    def test_equality_with_string_style(self):
        """Test equality when one uses string style and other uses enum."""
        options1 = TradeVisualizationOptions(style=TradeVisualization.MARKERS)
        options2 = TradeVisualizationOptions(style="markers")

        assert options1 == options2
        # TradeVisualizationOptions is not hashable, so we can't test hash equality


class TestTradeVisualizationOptionsRepresentation:
    """Test TradeVisualizationOptions string representation."""

    def test_repr_representation(self):
        """Test string representation."""
        options = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            marker_size=25,
            entry_marker_color_long="#0000FF",
        )
        repr_str = repr(options)

        assert "TradeVisualizationOptions" in repr_str
        assert "marker_size=25" in repr_str
        assert "entry_marker_color_long='#0000FF'" in repr_str

    def test_str_representation(self):
        """Test string representation."""
        options = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            marker_size=25,
            entry_marker_color_long="#0000FF",
        )
        str_str = str(options)

        assert "TradeVisualizationOptions" in str_str
        assert "marker_size=25" in str_str
        assert "entry_marker_color_long='#0000FF'" in str_str


class TestTradeVisualizationOptionsIntegration:
    """Test TradeVisualizationOptions integration scenarios."""

    def test_integration_with_chart_options(self):
        """Test integration with ChartOptions."""
        trade_viz_options = TradeVisualizationOptions(
            style=TradeVisualization.BOTH,
            marker_size=20,
            show_pnl_in_markers=True,
        )

        chart_options = ChartOptions(height=500, trade_visualization=trade_viz_options)

        assert chart_options.trade_visualization == trade_viz_options
        assert chart_options.trade_visualization.style == TradeVisualization.BOTH
        assert chart_options.trade_visualization.marker_size == 20
        assert chart_options.trade_visualization.show_pnl_in_markers is True

    def test_integration_serialization_through_chart_options(self):
        """Test serialization when used within ChartOptions."""
        trade_viz_options = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            marker_size=25,
            entry_marker_color_long="#0000FF",
        )

        chart_options = ChartOptions(height=500, trade_visualization=trade_viz_options)

        result = chart_options.asdict()

        assert "tradeVisualization" in result
        assert result["tradeVisualization"]["style"] == "markers"
        assert result["tradeVisualization"]["markerSize"] == 25
        assert result["tradeVisualization"]["entryMarkerColorLong"] == "#0000FF"

    def test_all_visualization_styles_integration(self):
        """Test all visualization styles work correctly in integration."""
        styles = [
            TradeVisualization.MARKERS,
            TradeVisualization.RECTANGLES,
            TradeVisualization.BOTH,
            TradeVisualization.LINES,
            TradeVisualization.ARROWS,
            TradeVisualization.ZONES,
        ]

        for style in styles:
            trade_viz_options = TradeVisualizationOptions(style=style)
            chart_options = ChartOptions(trade_visualization=trade_viz_options)
            result = chart_options.asdict()

            assert result["tradeVisualization"]["style"] == style.value


class TestTradeVisualizationOptionsPerformance:
    """Test TradeVisualizationOptions performance characteristics."""

    def test_construction_performance(self):
        """Test construction performance."""
        start_time = time.time()
        for _ in range(1000):
            TradeVisualizationOptions()
        end_time = time.time()

        # Should complete in reasonable time (less than 1 second)
        assert end_time - start_time < 1.0

    def test_serialization_performance(self):
        """Test serialization performance."""
        options = TradeVisualizationOptions()
        start_time = time.time()
        for _ in range(1000):
            options.asdict()
        end_time = time.time()

        # Should complete in reasonable time (less than 1 second)
        assert end_time - start_time < 1.0

    def test_equality_comparison_performance(self):
        """Test equality comparison performance."""
        options1 = TradeVisualizationOptions(style=TradeVisualization.MARKERS)
        options2 = TradeVisualizationOptions(style=TradeVisualization.MARKERS)
        options3 = TradeVisualizationOptions(style=TradeVisualization.RECTANGLES)

        start_time = time.time()
        for _ in range(1000):
            _ = options1 == options2
            _ = options1 == options3
        end_time = time.time()

        # Should complete in reasonable time (less than 1 second)
        assert end_time - start_time < 1.0


class TestTradeVisualizationOptionsComprehensive:
    """Comprehensive tests for TradeVisualizationOptions."""

    def test_comprehensive_configuration(self):
        """Test a comprehensive configuration with all options."""
        options = TradeVisualizationOptions(
            style=TradeVisualization.BOTH,
            # Marker options
            entry_marker_color_long="#2196F3",
            entry_marker_color_short="#FF9800",
            exit_marker_color_profit="#4CAF50",
            exit_marker_color_loss="#F44336",
            marker_size=24,
            show_pnl_in_markers=True,
            # Rectangle options
            rectangle_fill_opacity=0.15,
            rectangle_border_width=2,
            rectangle_color_profit="#4CAF50",
            rectangle_color_loss="#F44336",
            # Line options
            line_width=3,
            line_style="dashed",
            line_color_profit="#4CAF50",
            line_color_loss="#F44336",
            # Arrow options
            arrow_size=12,
            arrow_color_profit="#4CAF50",
            arrow_color_loss="#F44336",
            # Zone options
            zone_opacity=0.1,
            zone_color_long="#2196F3",
            zone_color_short="#FF9800",
            zone_extend_bars=3,
            # Annotation options
            show_trade_id=True,
            show_quantity=True,
            show_trade_type=True,
            annotation_font_size=14,
            annotation_background="rgba(255, 255, 255, 0.9)",
        )

        result = options.asdict()

        # Verify all fields are present and correct
        assert result["style"] == "both"
        assert result["entryMarkerColorLong"] == "#2196F3"
        assert result["entryMarkerColorShort"] == "#FF9800"
        assert result["exitMarkerColorProfit"] == "#4CAF50"
        assert result["exitMarkerColorLoss"] == "#F44336"
        assert result["markerSize"] == 24
        assert result["showPnlInMarkers"] is True
        assert result["rectangleFillOpacity"] == 0.15
        assert result["rectangleBorderWidth"] == 2
        assert result["rectangleColorProfit"] == "#4CAF50"
        assert result["rectangleColorLoss"] == "#F44336"
        assert result["lineWidth"] == 3
        assert result["lineStyle"] == "dashed"
        assert result["lineColorProfit"] == "#4CAF50"
        assert result["lineColorLoss"] == "#F44336"
        assert result["arrowSize"] == 12
        assert result["arrowColorProfit"] == "#4CAF50"
        assert result["arrowColorLoss"] == "#F44336"
        assert result["zoneOpacity"] == 0.1
        assert result["zoneColorLong"] == "#2196F3"
        assert result["zoneColorShort"] == "#FF9800"
        assert result["zoneExtendBars"] == 3
        assert result["showTradeId"] is True
        assert result["showQuantity"] is True
        assert result["showTradeType"] is True
        assert result["annotationFontSize"] == 14
        assert result["annotationBackground"] == "rgba(255, 255, 255, 0.9)"

    def test_style_specific_configurations(self):
        """Test configurations optimized for each visualization style."""
        style_configs = {
            TradeVisualization.MARKERS: {
                "marker_size": 25,
                "show_pnl_in_markers": True,
                "entry_marker_color_long": "#2196F3",
                "entry_marker_color_short": "#FF9800",
            },
            TradeVisualization.RECTANGLES: {
                "rectangle_fill_opacity": 0.2,
                "rectangle_border_width": 2,
                "rectangle_color_profit": "#4CAF50",
                "rectangle_color_loss": "#F44336",
            },
            TradeVisualization.LINES: {
                "line_width": 3,
                "line_style": "dashed",
                "line_color_profit": "#4CAF50",
                "line_color_loss": "#F44336",
            },
            TradeVisualization.ARROWS: {
                "arrow_size": 15,
                "arrow_color_profit": "#4CAF50",
                "arrow_color_loss": "#F44336",
            },
            TradeVisualization.ZONES: {
                "zone_opacity": 0.15,
                "zone_color_long": "#2196F3",
                "zone_color_short": "#FF9800",
                "zone_extend_bars": 2,
            },
        }

        for style, config in style_configs.items():
            options = TradeVisualizationOptions(style=style, **config)
            result = options.asdict()

            assert result["style"] == style.value
            for key, value in config.items():
                # Convert snake_case to camelCase for dictionary keys
                camel_key = "".join(
                    word.capitalize() if i > 0 else word for i, word in enumerate(key.split("_"))
                )
                assert result[camel_key] == value
