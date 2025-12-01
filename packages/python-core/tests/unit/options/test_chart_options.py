"""Tests for the ChartOptions class.

This module contains comprehensive tests for the ChartOptions class,
ensuring proper construction, validation, and serialization.
"""

import pytest
from lightweight_charts_core.charts.options.chart_options import ChartOptions
from lightweight_charts_core.charts.options.interaction_options import (
    CrosshairMode,
    CrosshairOptions,
    KineticScrollOptions,
    TrackingModeOptions,
)
from lightweight_charts_core.charts.options.layout_options import (
    GridLineOptions,
    GridOptions,
    LayoutOptions,
)
from lightweight_charts_core.charts.options.localization_options import LocalizationOptions
from lightweight_charts_core.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from lightweight_charts_core.charts.options.time_scale_options import TimeScaleOptions
from lightweight_charts_core.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from lightweight_charts_core.exceptions import (
    PriceScaleOptionsTypeError,
    TypeValidationError,
)
from lightweight_charts_core.type_definitions.colors import BackgroundSolid
from lightweight_charts_core.type_definitions.enums import LineStyle


class TestChartOptionsConstruction:
    """Test ChartOptions construction and basic functionality."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = ChartOptions()

        assert options.width is None
        assert options.height == 400
        assert options.auto_size is True
        assert isinstance(options.layout, LayoutOptions)
        assert options.left_price_scale is None
        assert isinstance(options.right_price_scale, PriceScaleOptions)
        assert isinstance(options.time_scale, TimeScaleOptions)
        assert isinstance(options.crosshair, CrosshairOptions)
        assert isinstance(options.grid, GridOptions)
        assert options.handle_scroll is True
        assert options.handle_scale is True
        assert options.kinetic_scroll is None
        assert options.tracking_mode is None
        assert options.localization is None
        assert options.trade_visualization is None
        assert options.add_default_pane is True

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = ChartOptions(
            width=800,
            height=600,
            auto_size=False,
            handle_scroll=False,
            handle_scale=False,
            add_default_pane=False,
        )

        assert options.width == 800
        assert options.height == 600
        assert options.auto_size is False
        assert options.handle_scroll is False
        assert options.handle_scale is False
        assert options.add_default_pane is False

    def test_left_price_scale_default_visibility(self):
        """Test that left price scale is None by default."""
        options = ChartOptions()
        assert options.left_price_scale is None

    def test_right_price_scale_default_visibility(self):
        """Test that right price scale is visible by default."""
        options = ChartOptions()
        assert options.right_price_scale.visible is True

    def test_overlay_price_scales_initialization(self):
        """Test that overlay_price_scales is initialized as empty dict."""
        options = ChartOptions()
        assert options.overlay_price_scales == {}


class TestChartOptionsValidation:
    """Test ChartOptions validation in __post_init__."""

    def test_valid_width(self):
        """Test valid width values."""
        options = ChartOptions(width=800)
        assert options.width == 800

    def test_none_width(self):
        """Test None width value."""
        options = ChartOptions(width=None)
        assert options.width is None

    def test_valid_height(self):
        """Test valid height values are accepted."""
        options = ChartOptions(height=600)
        assert options.height == 600

    def test_valid_auto_size(self):
        """Test valid auto_size values are accepted."""
        options = ChartOptions(auto_size=False)
        assert options.auto_size is False

    def test_valid_layout(self):
        """Test valid layout values are accepted."""
        layout = LayoutOptions()
        options = ChartOptions(layout=layout)
        assert options.layout == layout

    def test_valid_price_scales(self):
        """Test valid price scale values are accepted."""
        left_scale = PriceScaleOptions()
        right_scale = PriceScaleOptions()
        options = ChartOptions(left_price_scale=left_scale, right_price_scale=right_scale)
        assert options.left_price_scale == left_scale
        assert options.right_price_scale == right_scale

    def test_valid_time_scale(self):
        """Test valid time scale values are accepted."""
        time_scale = TimeScaleOptions()
        options = ChartOptions(time_scale=time_scale)
        assert options.time_scale == time_scale

    def test_valid_crosshair(self):
        """Test valid crosshair values are accepted."""
        crosshair = CrosshairOptions()
        options = ChartOptions(crosshair=crosshair)
        assert options.crosshair == crosshair

    def test_valid_grid(self):
        """Test valid grid values are accepted."""
        grid = GridOptions()
        options = ChartOptions(grid=grid)
        assert options.grid == grid

    def test_valid_handle_options(self):
        """Test valid handle option values are accepted."""
        options = ChartOptions(handle_scroll=False, handle_scale=False)
        assert options.handle_scroll is False
        assert options.handle_scale is False

    def test_valid_kinetic_scroll(self):
        """Test valid kinetic scroll values are accepted."""
        kinetic = KineticScrollOptions()
        options = ChartOptions(kinetic_scroll=kinetic)
        assert options.kinetic_scroll == kinetic

    def test_valid_tracking_mode(self):
        """Test valid tracking mode values are accepted."""
        tracking = TrackingModeOptions()
        options = ChartOptions(tracking_mode=tracking)
        assert options.tracking_mode == tracking

    def test_valid_localization(self):
        """Test valid localization values are accepted."""
        localization = LocalizationOptions()
        options = ChartOptions(localization=localization)
        assert options.localization == localization

    def test_valid_trade_visualization(self):
        """Test valid trade visualization values are accepted."""
        trade_viz = TradeVisualizationOptions()
        options = ChartOptions(trade_visualization=trade_viz)
        assert options.trade_visualization == trade_viz

    def test_none_left_price_scale_default(self):
        """Test that left_price_scale defaults to None."""
        options = ChartOptions()
        assert options.left_price_scale is None

    def test_none_kinetic_scroll_default(self):
        """Test that kinetic_scroll defaults to None."""
        options = ChartOptions()
        assert options.kinetic_scroll is None

    def test_none_tracking_mode_default(self):
        """Test that tracking_mode defaults to None."""
        options = ChartOptions()
        assert options.tracking_mode is None

    def test_none_localization_default(self):
        """Test that localization defaults to None."""
        options = ChartOptions()
        assert options.localization is None

    def test_none_trade_visualization_default(self):
        """Test that trade_visualization defaults to None."""
        options = ChartOptions()
        assert options.trade_visualization is None


class TestChartOptionsSerialization:
    """Test ChartOptions serialization behavior."""

    def test_to_dict_basic_fields(self):
        """Test basic field serialization."""
        options = ChartOptions(
            width=800,
            height=600,
            auto_size=False,
            handle_scroll=False,
            handle_scale=False,
            add_default_pane=False,
        )
        result = options.asdict()

        assert result["width"] == 800
        assert result["height"] == 600
        assert result["autoSize"] is False
        assert result["handleScroll"] is False
        assert result["handleScale"] is False
        assert result["addDefaultPane"] is False

    def test_to_dict_omits_none_width(self):
        """Test that None width is omitted from output."""
        options = ChartOptions(width=None)
        result = options.asdict()

        assert "width" not in result

    def test_to_dict_includes_nested_objects(self):
        """Test that nested option objects are serialized."""
        options = ChartOptions()
        result = options.asdict()

        assert "layout" in result
        assert "rightPriceScale" in result
        assert "timeScale" in result
        assert "crosshair" in result
        assert "grid" in result
        # None fields should be omitted
        assert "leftPriceScale" not in result
        assert "kineticScroll" not in result
        assert "trackingMode" not in result
        assert "localization" not in result

    def test_to_dict_nested_object_serialization(self):
        """Test that nested objects are properly serialized."""
        options = ChartOptions()
        result = options.asdict()

        # Check that nested objects are dictionaries (serialized)
        assert isinstance(result["layout"], dict)
        assert isinstance(result["rightPriceScale"], dict)
        assert isinstance(result["timeScale"], dict)
        assert isinstance(result["crosshair"], dict)
        assert isinstance(result["grid"], dict)
        # None fields should not be present
        assert "leftPriceScale" not in result
        assert "kineticScroll" not in result
        assert "trackingMode" not in result
        assert "localization" not in result
        assert "tradeVisualization" not in result
        assert "overlayPriceScales" not in result

    def test_to_dict_overlay_price_scales(self):
        """Test overlay price scales serialization."""
        overlay_scale = PriceScaleOptions(visible=True, border_color="#ff0000")
        options = ChartOptions(overlay_price_scales={"overlay1": overlay_scale})
        result = options.asdict()

        assert "overlayPriceScales" in result
        assert "overlay1" in result["overlayPriceScales"]
        # The overlay_price_scales should contain dictionaries, not PriceScaleOptions objects
        overlay_dict = result["overlayPriceScales"]["overlay1"]
        assert isinstance(overlay_dict, dict)
        assert overlay_dict["visible"] is True
        assert overlay_dict["borderColor"] == "#ff0000"

    def test_to_dict_empty_overlay_price_scales(self):
        """Test empty overlay price scales are omitted from output."""
        options = ChartOptions(overlay_price_scales={})
        result = options.asdict()

        assert "overlayPriceScales" not in result

    def test_to_dict_complete_structure(self):
        """Test complete serialization structure."""
        options = ChartOptions()
        result = options.asdict()

        # Check all expected top-level keys (None fields should be omitted)
        expected_keys = {
            "height",
            "autoSize",
            "layout",
            "rightPriceScale",
            "timeScale",
            "crosshair",
            "grid",
            "handleScroll",
            "handleScale",
            "addDefaultPane",
        }

        for key in expected_keys:
            assert key in result, f"Missing key: {key}"

        # Check that None fields are omitted
        none_fields = {
            "leftPriceScale",
            "kineticScroll",
            "trackingMode",
            "localization",
            "tradeVisualization",
        }
        for field in none_fields:
            assert field not in result, f"None field '{field}' should not be in result"

        # Check that empty dict fields are omitted
        assert (
            "overlayPriceScales" not in result
        ), "Empty dict field 'overlayPriceScales' should not be in result"

    def test_to_dict_with_explicit_none_fields(self):
        """Test that explicitly set None fields are omitted from output."""
        options = ChartOptions(
            left_price_scale=None,
            kinetic_scroll=None,
            tracking_mode=None,
            localization=None,
            trade_visualization=None,
        )
        result = options.asdict()

        # None fields should be omitted even when explicitly set
        assert "leftPriceScale" not in result
        assert "kineticScroll" not in result
        assert "trackingMode" not in result
        assert "localization" not in result
        assert "tradeVisualization" not in result
        assert "overlayPriceScales" not in result

    def test_to_dict_with_explicit_values(self):
        """Test that explicitly set values are included in output."""
        left_scale = PriceScaleOptions(visible=True)
        kinetic = KineticScrollOptions(touch=True, mouse=False)
        tracking = TrackingModeOptions(exit_on_escape=True)
        local = LocalizationOptions(locale="en-US")
        trade_viz = TradeVisualizationOptions(style="markers")

        options = ChartOptions(
            left_price_scale=left_scale,
            kinetic_scroll=kinetic,
            tracking_mode=tracking,
            localization=local,
            trade_visualization=trade_viz,
        )
        result = options.asdict()

        # Explicitly set fields should be included
        assert "leftPriceScale" in result
        assert "kineticScroll" in result
        assert "trackingMode" in result
        assert "localization" in result
        assert "tradeVisualization" in result

        # Check that they are properly serialized
        assert isinstance(result["leftPriceScale"], dict)
        assert isinstance(result["kineticScroll"], dict)
        assert isinstance(result["trackingMode"], dict)
        assert isinstance(result["localization"], dict)
        assert isinstance(result["tradeVisualization"], dict)


class TestChartOptionsIntegration:
    """Test ChartOptions integration with other components."""

    def test_chart_options_with_custom_layout(self):
        """Test ChartOptions with custom layout options."""
        custom_layout = LayoutOptions(
            background_options=BackgroundSolid(color="#000000"),
            text_color="#ffffff",
            font_size=14,
        )

        options = ChartOptions(layout=custom_layout)
        result = options.asdict()
        # Fix: expect flattened background properties instead of nested backgroundOptions
        assert result["layout"]["color"] == "#000000"  # Flattened from background_options
        assert result["layout"]["textColor"] == "#ffffff"
        assert result["layout"]["fontSize"] == 14

    def test_chart_options_with_custom_price_scales(self):
        """Test ChartOptions with custom price scale options."""
        custom_left_scale = PriceScaleOptions(
            visible=True,
            border_color="#ff0000",
            scale_margins=PriceScaleMargins(top=0.1, bottom=0.1),
        )

        custom_right_scale = PriceScaleOptions(
            visible=True,
            border_color="#00ff00",
            scale_margins=PriceScaleMargins(top=0.2, bottom=0.2),
        )

        options = ChartOptions(
            left_price_scale=custom_left_scale,
            right_price_scale=custom_right_scale,
        )
        result = options.asdict()

        assert result["leftPriceScale"]["visible"] is True
        assert result["leftPriceScale"]["borderColor"] == "#ff0000"
        assert result["leftPriceScale"]["scaleMargins"]["top"] == 0.1

        assert result["rightPriceScale"]["visible"] is True
        assert result["rightPriceScale"]["borderColor"] == "#00ff00"
        assert result["rightPriceScale"]["scaleMargins"]["top"] == 0.2

    def test_chart_options_with_custom_time_scale(self):
        """Test ChartOptions with custom time scale options."""
        custom_time_scale = TimeScaleOptions(
            time_visible=True,
            seconds_visible=False,
            right_offset=20,
            bar_spacing=5,
        )

        options = ChartOptions(time_scale=custom_time_scale)
        result = options.asdict()

        assert result["timeScale"]["timeVisible"] is True
        assert result["timeScale"]["secondsVisible"] is False
        assert result["timeScale"]["rightOffset"] == 20
        assert result["timeScale"]["barSpacing"] == 5

    def test_chart_options_with_custom_crosshair(self):
        """Test ChartOptions with custom crosshair options."""
        custom_crosshair = CrosshairOptions(mode=CrosshairMode.NORMAL)

        options = ChartOptions(crosshair=custom_crosshair)
        result = options.asdict()
        # Fix: expect 0 for CrosshairMode.NORMAL
        assert result["crosshair"]["mode"] == 0  # CrosshairMode.NORMAL.value

    def test_chart_options_with_custom_grid(self):
        """Test ChartOptions with custom grid options."""
        custom_grid = GridOptions(
            vert_lines=GridLineOptions(color="#ff0000", style=LineStyle.SOLID),
            horz_lines=GridLineOptions(color="#00ff00", style=LineStyle.DOTTED),
        )

        options = ChartOptions(grid=custom_grid)
        result = options.asdict()

        assert result["grid"]["vertLines"]["color"] == "#ff0000"
        assert result["grid"]["vertLines"]["style"] == 0  # LineStyle.SOLID.value
        assert result["grid"]["horzLines"]["color"] == "#00ff00"
        assert result["grid"]["horzLines"]["style"] == 1  # LineStyle.DOTTED.value


class TestChartOptionsEdgeCases:
    """Test ChartOptions edge cases and error conditions."""

    def test_chart_options_with_zero_height(self):
        """Test ChartOptions with zero height."""
        options = ChartOptions(height=0)
        result = options.asdict()

        assert result["height"] == 0

    def test_chart_options_with_negative_height(self):
        """Test ChartOptions with negative height."""
        options = ChartOptions(height=-100)
        result = options.asdict()

        assert result["height"] == -100

    def test_chart_options_with_large_values(self):
        """Test ChartOptions with large values."""
        options = ChartOptions(width=9999, height=9999)
        result = options.asdict()

        assert result["width"] == 9999
        assert result["height"] == 9999

    def test_chart_options_equality(self):
        """Test ChartOptions equality comparison."""
        options1 = ChartOptions(width=800, height=600)
        options2 = ChartOptions(width=800, height=600)
        options3 = ChartOptions(width=800, height=400)

        assert options1 == options2
        assert options1 != options3

    def test_chart_options_repr(self):
        """Test ChartOptions string representation."""
        options = ChartOptions(width=800, height=600)
        repr_str = repr(options)

        assert "ChartOptions" in repr_str
        assert "width=800" in repr_str
        assert "height=600" in repr_str


class TestChartOptionsPriceScaleValidation:
    """Test ChartOptions validation for price scale parameters."""

    def test_right_price_scale_boolean_raises_error(self):
        """Test that passing boolean to right_price_scale raises PriceScaleOptionsTypeError."""
        with pytest.raises(PriceScaleOptionsTypeError):
            ChartOptions(right_price_scale=True)

    def test_left_price_scale_boolean_raises_error(self):
        """Test that passing boolean to left_price_scale raises PriceScaleOptionsTypeError."""
        with pytest.raises(PriceScaleOptionsTypeError):
            ChartOptions(left_price_scale=True)

    def test_right_price_scale_string_raises_error(self):
        """Test that passing string to right_price_scale raises TypeError."""
        with pytest.raises(TypeValidationError):
            ChartOptions(right_price_scale="invalid")

    def test_left_price_scale_string_raises_error(self):
        """Test that passing string to left_price_scale raises TypeError."""
        with pytest.raises(TypeValidationError):
            ChartOptions(left_price_scale="invalid")

    def test_right_price_scale_integer_raises_error(self):
        """Test that passing integer to right_price_scale raises TypeError."""
        with pytest.raises(TypeValidationError):
            ChartOptions(right_price_scale=123)

    def test_left_price_scale_integer_raises_error(self):
        """Test that passing integer to left_price_scale raises TypeError."""
        with pytest.raises(TypeValidationError):
            ChartOptions(left_price_scale=123)

    def test_valid_price_scale_options_accepted(self):
        """Test that valid PriceScaleOptions objects are accepted."""
        left_scale = PriceScaleOptions(visible=True)
        right_scale = PriceScaleOptions(visible=False)

        # Should not raise any errors
        options = ChartOptions(left_price_scale=left_scale, right_price_scale=right_scale)

        assert options.left_price_scale == left_scale
        assert options.right_price_scale == right_scale

    def test_none_price_scale_options_accepted(self):
        """Test that None values are accepted for price scale options."""
        # Should not raise any errors
        options = ChartOptions(left_price_scale=None, right_price_scale=None)

        assert options.left_price_scale is None
        assert options.right_price_scale is None
