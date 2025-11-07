"""Tests for price scale auto-creation edge cases.

This module tests edge cases related to price scale auto-creation behavior,
particularly focusing on default values and built-in scale handling.
"""

import pytest

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData


class TestPriceScaleEdgeCases:
    """Test suite for price scale auto-creation edge cases."""

    @pytest.fixture
    def sample_data(self):
        """Provide sample data for testing."""
        return [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]

    def test_no_price_scale_id_defaults_to_right(self, sample_data):
        """Test that series without price_scale_id defaults to 'right'.

        Edge Case 1: When price_scale_id is not specified, it should default to 'right'.
        This is a built-in scale, so NO overlay scale should be auto-created.
        """
        series = LineSeries(data=sample_data)

        # Verify default value
        assert series.price_scale_id == "right"

        # Add to chart and verify no overlay scale created
        chart = Chart()
        chart.add_series(series)

        # 'right' is built-in, should NOT create overlay scale
        assert "right" not in chart._price_scale_manager.overlay_price_scales
        assert len(chart._price_scale_manager.overlay_price_scales) == 0

    def test_custom_price_scale_id_auto_creates(self, sample_data):
        """Test that custom price_scale_id triggers auto-creation.

        Edge Case 2: When price_scale_id is set to a custom value (not 'left', 'right', ''),
        it should auto-create a PriceScaleOptions entry in overlay_price_scales.
        """
        chart = Chart()
        series = LineSeries(data=sample_data, price_scale_id="custom")

        chart.add_series(series)

        # Custom scale should be auto-created
        assert "custom" in chart._price_scale_manager.overlay_price_scales

        # Verify smart defaults for separate pane
        scale = chart._price_scale_manager.overlay_price_scales["custom"]
        assert scale.visible is True  # Separate pane should be visible
        assert scale.auto_scale is True
        assert scale.scale_margins.top == 0.1  # Normal margins
        assert scale.scale_margins.bottom == 0.1

    def test_left_price_scale_id_no_auto_creation(self, sample_data):
        """Test that 'left' price_scale_id does NOT trigger auto-creation.

        Edge Case 3: 'left' is a built-in scale ID. It should NOT create an overlay scale.
        """
        chart = Chart()
        series = LineSeries(data=sample_data, price_scale_id="left")

        chart.add_series(series)

        # 'left' is built-in, should NOT create overlay scale
        assert "left" not in chart._price_scale_manager.overlay_price_scales
        assert len(chart._price_scale_manager.overlay_price_scales) == 0

    def test_right_price_scale_id_no_auto_creation(self, sample_data):
        """Test that 'right' price_scale_id does NOT trigger auto-creation.

        Edge Case 4: 'right' is a built-in scale ID. It should NOT create an overlay scale.
        """
        chart = Chart()
        series = LineSeries(data=sample_data, price_scale_id="right")

        chart.add_series(series)

        # 'right' is built-in, should NOT create overlay scale
        assert "right" not in chart._price_scale_manager.overlay_price_scales
        assert len(chart._price_scale_manager.overlay_price_scales) == 0

    def test_empty_string_price_scale_id_no_auto_creation(self, sample_data):
        """Test that empty string price_scale_id does NOT trigger auto-creation.

        Edge Case 5: Empty string ('') is treated as a built-in/default scale.
        It should NOT create an overlay scale.
        """
        chart = Chart()
        series = LineSeries(data=sample_data, price_scale_id="")

        chart.add_series(series)

        # Empty string should NOT create overlay scale
        assert "" not in chart._price_scale_manager.overlay_price_scales
        assert len(chart._price_scale_manager.overlay_price_scales) == 0

    def test_overlay_in_same_pane_auto_creates_with_overlay_defaults(self, sample_data):
        """Test that overlay in same pane gets overlay-specific defaults.

        Edge Case 6: When a series with custom price_scale_id is added to the same pane
        as a series using a built-in scale ('right', 'left', ''), it should auto-create
        with overlay-specific defaults (visible=False, large top margin).
        """
        chart = Chart()

        # First series uses 'right' in pane 0
        series1 = LineSeries(data=sample_data, pane_id=0, price_scale_id="right")
        chart.add_series(series1)

        # Second series uses 'volume' in SAME pane 0
        series2 = LineSeries(data=sample_data, pane_id=0, price_scale_id="volume")
        chart.add_series(series2)

        # 'volume' should be auto-created as overlay
        assert "volume" in chart._price_scale_manager.overlay_price_scales

        scale = chart._price_scale_manager.overlay_price_scales["volume"]
        assert scale.visible is False  # Overlay should be hidden
        assert scale.auto_scale is True
        assert scale.scale_margins.top == 0.8  # Large top margin for overlay
        assert scale.scale_margins.bottom == 0.0

    def test_separate_pane_auto_creates_with_pane_defaults(self, sample_data):
        """Test that series in separate pane gets pane-specific defaults.

        When a series with custom price_scale_id is added to a different pane,
        it should auto-create with separate-pane defaults (visible=True, balanced margins).
        """
        chart = Chart()

        # First series in pane 0
        series1 = LineSeries(data=sample_data, pane_id=0, price_scale_id="right")
        chart.add_series(series1)

        # Second series in DIFFERENT pane 1
        series2 = LineSeries(data=sample_data, pane_id=1, price_scale_id="rsi")
        chart.add_series(series2)

        # 'rsi' should be auto-created for separate pane
        assert "rsi" in chart._price_scale_manager.overlay_price_scales

        scale = chart._price_scale_manager.overlay_price_scales["rsi"]
        assert scale.visible is True  # Separate pane should be visible
        assert scale.auto_scale is True
        assert scale.scale_margins.top == 0.1  # Balanced margins
        assert scale.scale_margins.bottom == 0.1

    def test_built_in_scales_summary(self, sample_data):
        """Comprehensive test verifying all built-in scales don't trigger auto-creation.

        This test documents the complete list of built-in scale IDs that should NOT
        trigger auto-creation of overlay price scales.
        """
        built_in_scales = ["left", "right", ""]

        for scale_id in built_in_scales:
            chart = Chart()
            series = LineSeries(data=sample_data, price_scale_id=scale_id)
            chart.add_series(series)

            # None of the built-in scales should create overlay entries
            assert scale_id not in chart._price_scale_manager.overlay_price_scales
            assert len(chart._price_scale_manager.overlay_price_scales) == 0, (
                f"Built-in scale '{scale_id}' should not create overlay scale"
            )

    def test_custom_scales_summary(self, sample_data):
        """Comprehensive test verifying custom scales DO trigger auto-creation.

        This test documents that any non-built-in scale ID will trigger
        auto-creation of overlay price scales.
        """
        custom_scales = ["volume", "rsi", "macd", "custom", "my_scale", "anything"]

        for scale_id in custom_scales:
            chart = Chart()
            series = LineSeries(data=sample_data, price_scale_id=scale_id)
            chart.add_series(series)

            # All custom scales should be auto-created
            assert scale_id in chart._price_scale_manager.overlay_price_scales, (
                f"Custom scale '{scale_id}' should be auto-created"
            )

            # Verify it has expected properties
            scale = chart._price_scale_manager.overlay_price_scales[scale_id]
            # Note: price_scale_id is the dict key, not an attribute of PriceScaleOptions
            assert scale.auto_scale is True
