"""Tests for PriceScaleValidator utilities.

This module tests the price scale validation functionality.
"""

import pytest

from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
    PriceScaleOptions,
)
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.charts.validators import (
    PriceScaleValidationError,
    PriceScaleValidator,
)
from streamlit_lightweight_charts_pro.data import SingleValueData


class TestPriceScaleValidator:
    """Test suite for PriceScaleValidator."""

    def test_validate_built_in_scales_always_pass(self):
        """Test that built-in scales ('left', 'right', '') always pass validation."""
        data = [SingleValueData("2024-01-01", 100)]

        # Test 'left'
        series_left = LineSeries(data=data, price_scale_id="left")
        PriceScaleValidator.validate_series_price_scale(series_left, {}, auto_create_enabled=False)

        # Test 'right'
        series_right = LineSeries(data=data, price_scale_id="right")
        PriceScaleValidator.validate_series_price_scale(series_right, {}, auto_create_enabled=False)

        # Test empty string
        series_empty = LineSeries(data=data, price_scale_id="")
        PriceScaleValidator.validate_series_price_scale(series_empty, {}, auto_create_enabled=False)

        # None of these should raise errors

    def test_validate_custom_scale_exists(self):
        """Test validation passes when custom scale exists."""
        data = [SingleValueData("2024-01-01", 100)]
        series = LineSeries(data=data, price_scale_id="rsi")

        available_scales = {
            "rsi": PriceScaleOptions(price_scale_id="rsi"),
        }

        # Should not raise error
        PriceScaleValidator.validate_series_price_scale(
            series,
            available_scales,
            auto_create_enabled=False,
        )

    def test_validate_custom_scale_missing_auto_create_enabled(self):
        """Test validation passes when scale is missing but auto-create is enabled."""
        data = [SingleValueData("2024-01-01", 100)]
        series = LineSeries(data=data, price_scale_id="rsi")

        available_scales = {}

        # Should not raise error when auto_create enabled
        PriceScaleValidator.validate_series_price_scale(
            series,
            available_scales,
            auto_create_enabled=True,
        )

    def test_validate_custom_scale_missing_auto_create_disabled(self):
        """Test validation fails when scale is missing and auto-create is disabled."""
        data = [SingleValueData("2024-01-01", 100)]
        series = LineSeries(data=data, price_scale_id="rsi")

        available_scales = {}

        # Should raise error when auto_create disabled
        with pytest.raises(PriceScaleValidationError) as exc_info:
            PriceScaleValidator.validate_series_price_scale(
                series,
                available_scales,
                auto_create_enabled=False,
            )

        # Check error message is helpful
        error_msg = str(exc_info.value)
        assert "rsi" in error_msg
        assert "Available scales" in error_msg
        assert "auto_create_price_scales=True" in error_msg
        assert "add_overlay_price_scale" in error_msg

    def test_validation_error_lists_available_scales(self):
        """Test that validation error lists all available scales."""
        data = [SingleValueData("2024-01-01", 100)]
        series = LineSeries(data=data, price_scale_id="missing")

        available_scales = {
            "rsi": PriceScaleOptions(price_scale_id="rsi"),
            "macd": PriceScaleOptions(price_scale_id="macd"),
        }

        with pytest.raises(PriceScaleValidationError) as exc_info:
            PriceScaleValidator.validate_series_price_scale(
                series,
                available_scales,
                auto_create_enabled=False,
            )

        error_msg = str(exc_info.value)
        assert "left" in error_msg
        assert "right" in error_msg
        assert "rsi" in error_msg
        assert "macd" in error_msg

    def test_suggest_configuration_for_overlay(self):
        """Test configuration suggestions for overlay series."""
        suggestion = PriceScaleValidator.suggest_configuration(
            series_type="LineSeries",
            pane_id=0,
            is_overlay=True,
        )

        assert "overlay" in suggestion.lower()
        assert "PriceScaleConfig.for_overlay" in suggestion
        assert "auto-creation" in suggestion.lower()

    def test_suggest_configuration_for_separate_pane(self):
        """Test configuration suggestions for separate pane series."""
        suggestion = PriceScaleValidator.suggest_configuration(
            series_type="LineSeries",
            pane_id=1,
            is_overlay=False,
        )

        assert "separate pane" in suggestion.lower()
        assert "add_pane_with_series" in suggestion
        assert "PriceScaleConfig.for_separate_pane" in suggestion
        assert "pane_1" in suggestion

    def test_validate_pane_configuration_single_scale(self):
        """Test pane validation with single custom scale (no warning)."""
        data = [SingleValueData("2024-01-01", 100)]
        series1 = LineSeries(data=data, pane_id=1, price_scale_id="rsi")
        series2 = LineSeries(data=data, pane_id=1, price_scale_id="rsi")

        warning = PriceScaleValidator.validate_pane_configuration(
            pane_id=1,
            existing_series=[series1, series2],
        )

        assert warning is None  # No warning for single scale

    def test_validate_pane_configuration_multiple_scales_warning(self):
        """Test pane validation warns about multiple custom scales."""
        data = [SingleValueData("2024-01-01", 100)]
        series1 = LineSeries(data=data, pane_id=1, price_scale_id="rsi")
        series2 = LineSeries(data=data, pane_id=1, price_scale_id="macd")

        warning = PriceScaleValidator.validate_pane_configuration(
            pane_id=1,
            existing_series=[series1, series2],
        )

        assert warning is not None
        assert "multiple custom price scales" in warning.lower()
        assert "rsi" in warning
        assert "macd" in warning

    def test_validate_pane_configuration_ignores_built_in_scales(self):
        """Test that validation ignores built-in scales."""
        data = [SingleValueData("2024-01-01", 100)]
        series1 = LineSeries(data=data, pane_id=0, price_scale_id="left")
        series2 = LineSeries(data=data, pane_id=0, price_scale_id="right")
        series3 = LineSeries(data=data, pane_id=0, price_scale_id="custom")

        warning = PriceScaleValidator.validate_pane_configuration(
            pane_id=0,
            existing_series=[series1, series2, series3],
        )

        # Should not warn about built-in scales, only custom
        assert warning is None  # Only one custom scale

    def test_validate_pane_configuration_different_panes(self):
        """Test that validation only checks the specific pane."""
        data = [SingleValueData("2024-01-01", 100)]
        series1 = LineSeries(data=data, pane_id=1, price_scale_id="rsi")
        series2 = LineSeries(data=data, pane_id=2, price_scale_id="macd")

        # Check pane 1
        warning1 = PriceScaleValidator.validate_pane_configuration(
            pane_id=1,
            existing_series=[series1, series2],
        )
        assert warning1 is None  # Only one scale in pane 1

        # Check pane 2
        warning2 = PriceScaleValidator.validate_pane_configuration(
            pane_id=2,
            existing_series=[series1, series2],
        )
        assert warning2 is None  # Only one scale in pane 2
