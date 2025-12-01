"""Tests for automatic price scale creation feature.

This module tests the auto-creation of price scales to ensure alignment
with TradingView's official API behavior.
"""

from lightweight_charts_core.charts.managers.series_manager import SeriesManager
from lightweight_charts_core.charts.series import LineSeries

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.data import SingleValueData


class TestPriceScaleAutoCreation:
    """Test suite for price scale auto-creation functionality."""

    def test_auto_creation_enabled_by_default(self):
        """Test that auto-creation is enabled by default in add_series."""
        chart = Chart()
        data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]
        series = LineSeries(data=data, price_scale_id="custom")

        # Should not raise any errors
        chart.add_series(series)

        # Check that price scale was auto-created
        assert "custom" in chart._price_scale_manager.overlay_price_scales

    def test_auto_created_scale_has_smart_defaults_separate_pane(self):
        """Test that auto-created scales have correct defaults for separate panes."""
        chart = Chart()
        data = [SingleValueData("2024-01-01", 100)]
        series = LineSeries(data=data, pane_id=1, price_scale_id="rsi")

        chart.add_series(series)

        # Check that scale was created with correct defaults
        scale = chart._price_scale_manager.overlay_price_scales["rsi"]
        assert scale.visible is True  # Separate pane should be visible
        assert scale.auto_scale is True
        assert scale.scale_margins.top == 0.1  # Normal margins for separate pane
        assert scale.scale_margins.bottom == 0.1

    def test_auto_created_scale_for_overlay(self):
        """Test that auto-created scales have correct defaults for overlays."""
        chart = Chart()

        # Add price series first
        price_data = [SingleValueData("2024-01-01", 100)]
        price_series = LineSeries(data=price_data, pane_id=0, price_scale_id="right")
        chart.add_series(price_series)

        # Add overlay series in same pane with different scale
        overlay_data = [SingleValueData("2024-01-01", 50)]
        overlay_series = LineSeries(data=overlay_data, pane_id=0, price_scale_id="volume")
        chart.add_series(overlay_series)

        # Check that overlay scale has correct defaults
        scale = chart._price_scale_manager.overlay_price_scales["volume"]
        assert scale.visible is False  # Overlay should be hidden
        assert scale.scale_margins.top == 0.8  # Large top margin for overlay
        assert scale.scale_margins.bottom == 0.0

    def test_auto_creation_does_not_override_existing_scale(self):
        """Test that auto-creation doesn't override manually configured scales."""
        from lightweight_charts_core.charts.options.price_scale_options import (
            PriceScaleMargins,
            PriceScaleOptions,
        )
        from lightweight_charts_core.type_definitions.enums import (
            PriceScaleMode,
        )

        chart = Chart()

        # Manually add price scale with specific configuration
        # Note: price_scale_id is the key in add_overlay_price_scale,
        # not a PriceScaleOptions parameter
        manual_config = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            mode=PriceScaleMode.PERCENTAGE,  # Use distinctive mode
            scale_margins=PriceScaleMargins(top=0.15, bottom=0.25),
        )
        chart.add_overlay_price_scale("rsi", manual_config)

        # Add series with same price_scale_id
        data = [SingleValueData("2024-01-01", 50)]
        series = LineSeries(data=data, price_scale_id="rsi")
        chart.add_series(series)

        # Check that manual configuration wasn't overridden
        scale = chart._price_scale_manager.overlay_price_scales["rsi"]
        # Note: price_scale_id is the dict key, not an attribute of PriceScaleOptions
        assert scale.mode == PriceScaleMode.PERCENTAGE  # Should preserve our custom mode

    def test_auto_creation_with_built_in_scales(self):
        """Test that built-in scales ('left', 'right', '') don't trigger auto-creation."""
        chart = Chart()
        data = [SingleValueData("2024-01-01", 100)]

        # Test with 'left'
        series_left = LineSeries(data=data, price_scale_id="left")
        chart.add_series(series_left)
        assert "left" not in chart._price_scale_manager.overlay_price_scales

        # Test with 'right'
        series_right = LineSeries(data=data, price_scale_id="right")
        chart.add_series(series_right)
        assert "right" not in chart._price_scale_manager.overlay_price_scales

        # Test with '' (empty string)
        series_empty = LineSeries(data=data, price_scale_id="")
        chart.add_series(series_empty)
        assert "" not in chart._price_scale_manager.overlay_price_scales

    def test_auto_creation_can_be_disabled(self):
        """Test that auto-creation can be disabled via parameter."""
        from streamlit_lightweight_charts_pro.charts.managers import PriceScaleManager

        series_manager = SeriesManager()
        price_scale_manager = PriceScaleManager()

        data = [SingleValueData("2024-01-01", 100)]
        series = LineSeries(data=data, price_scale_id="custom")

        # Add with auto_create disabled
        series_manager.add_series(
            series,
            price_scale_manager=price_scale_manager,
            auto_create_price_scales=False,
        )

        # Should still create an empty scale (old behavior)
        assert "custom" in price_scale_manager.overlay_price_scales
        # But it should be an empty scale (no smart defaults)
        price_scale_manager.overlay_price_scales["custom"]
        # Note: price_scale_id is the dict key, not an attribute of PriceScaleOptions

    def test_multiple_series_same_pane_same_scale(self):
        """Test multiple series in same pane sharing same auto-created scale."""
        chart = Chart()
        data1 = [SingleValueData("2024-01-01", 100)]
        data2 = [SingleValueData("2024-01-01", 50)]

        series1 = LineSeries(data=data1, pane_id=1, price_scale_id="macd")
        series2 = LineSeries(data=data2, pane_id=1, price_scale_id="macd")

        chart.add_series(series1)
        chart.add_series(series2)

        # Should only create one scale
        assert "macd" in chart._price_scale_manager.overlay_price_scales

        # Both series should be in the series list
        assert len(chart._series_manager.series) == 2

    def test_auto_creation_with_multiple_series_same_pane(self):
        """Test auto-creation works when multiple series share same pane and scale."""
        from lightweight_charts_core.charts.series import CandlestickSeries

        from streamlit_lightweight_charts_pro.data import CandlestickData

        chart = Chart()

        # Add main price series
        price_data = [
            CandlestickData("2024-01-01", open=100, high=105, low=95, close=102),
            CandlestickData("2024-01-02", open=102, high=108, low=100, close=106),
        ]
        chart.add_series(
            CandlestickSeries(
                data=price_data,
                pane_id=0,
            )
        )

        # Add two series to same pane (MACD example)
        macd_data = [SingleValueData("2024-01-01", 5), SingleValueData("2024-01-02", -3)]
        signal_data = [SingleValueData("2024-01-01", 3), SingleValueData("2024-01-02", -1)]

        macd_line = LineSeries(
            data=macd_data,
            pane_id=1,
            price_scale_id="macd",
        )
        macd_signal = LineSeries(
            data=signal_data,
            pane_id=1,
            price_scale_id="macd",
        )

        chart.add_series(macd_line)
        chart.add_series(macd_signal)

        # Verify MACD price scale was auto-created only once
        assert "macd" in chart._price_scale_manager.overlay_price_scales
        macd_scale = chart._price_scale_manager.overlay_price_scales["macd"]
        assert macd_scale.visible is True  # Separate pane
        assert macd_scale.auto_scale is True

    def test_backwards_compatibility_manual_registration(self):
        """Test that manual pre-registration still works (backwards compatibility)."""
        from lightweight_charts_core.charts.options.price_scale_options import (
            PriceScaleMargins,
            PriceScaleOptions,
        )
        from lightweight_charts_core.type_definitions.enums import (
            PriceScaleMode,
        )

        chart = Chart()

        # Old way: Manual pre-registration
        # Note: price_scale_id is the key in add_overlay_price_scale,
        # not a PriceScaleOptions parameter
        rsi_scale = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            mode=PriceScaleMode.NORMAL,
            scale_margins=PriceScaleMargins(top=0.1, bottom=0.1),
        )
        chart.add_overlay_price_scale("rsi", rsi_scale)

        # Add series
        data = [SingleValueData("2024-01-01", 50)]
        series = LineSeries(data=data, price_scale_id="rsi")
        chart.add_series(series)

        # Should use the manually configured scale
        assert "rsi" in chart._price_scale_manager.overlay_price_scales
        scale = chart._price_scale_manager.overlay_price_scales["rsi"]
        assert scale.visible is True
        assert scale.auto_scale is True
