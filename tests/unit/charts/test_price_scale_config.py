"""Tests for PriceScaleConfig builder utilities.

This module tests the PriceScaleConfig factory methods for creating
common price scale configurations.
"""

import pytest

from streamlit_lightweight_charts_pro.charts.utils import PriceScaleConfig
from streamlit_lightweight_charts_pro.type_definitions.enums import PriceScaleMode


class TestPriceScaleConfig:
    """Test suite for PriceScaleConfig builder methods."""

    def test_for_overlay(self):
        """Test for_overlay creates correct configuration."""
        config = PriceScaleConfig.for_overlay("volume")

        assert config.price_scale_id == "volume"
        assert config.visible is False  # Hidden for overlays
        assert config.auto_scale is True
        assert config.mode == PriceScaleMode.NORMAL
        assert config.scale_margins.top == 0.8  # Large top margin
        assert config.scale_margins.bottom == 0.0

    def test_for_overlay_with_custom_margins(self):
        """Test for_overlay with custom margins."""
        config = PriceScaleConfig.for_overlay("volume", top_margin=0.9, bottom_margin=0.1)

        assert config.scale_margins.top == 0.9
        assert config.scale_margins.bottom == 0.1

    def test_for_overlay_with_kwargs_override(self):
        """Test that kwargs can override defaults in for_overlay."""
        config = PriceScaleConfig.for_overlay("volume", visible=True, auto_scale=False)

        assert config.visible is True  # Overridden
        assert config.auto_scale is False  # Overridden
        assert config.price_scale_id == "volume"

    def test_for_separate_pane(self):
        """Test for_separate_pane creates correct configuration."""
        config = PriceScaleConfig.for_separate_pane("rsi")

        assert config.price_scale_id == "rsi"
        assert config.visible is True  # Visible for separate panes
        assert config.auto_scale is True
        assert config.mode == PriceScaleMode.NORMAL
        assert config.scale_margins.top == 0.1  # Balanced margins
        assert config.scale_margins.bottom == 0.1

    def test_for_separate_pane_with_custom_margins(self):
        """Test for_separate_pane with custom margins."""
        config = PriceScaleConfig.for_separate_pane("macd", top_margin=0.15, bottom_margin=0.15)

        assert config.scale_margins.top == 0.15
        assert config.scale_margins.bottom == 0.15

    def test_for_volume_as_overlay(self):
        """Test for_volume as overlay configuration."""
        config = PriceScaleConfig.for_volume(as_overlay=True)

        assert config.price_scale_id == "volume"
        assert config.visible is False  # Hidden for overlay
        assert config.auto_scale is True
        assert config.scale_margins.top == 0.8
        assert config.scale_margins.bottom == 0.0

    def test_for_volume_as_separate_pane(self):
        """Test for_volume as separate pane configuration."""
        config = PriceScaleConfig.for_volume(as_overlay=False)

        assert config.price_scale_id == "volume"
        assert config.visible is True  # Visible for separate pane
        assert config.auto_scale is True
        assert config.scale_margins.top == 0.1
        assert config.scale_margins.bottom == 0.1

    def test_for_volume_custom_scale_id(self):
        """Test for_volume with custom scale ID."""
        config = PriceScaleConfig.for_volume(scale_id="vol_custom", as_overlay=True)

        assert config.price_scale_id == "vol_custom"

    def test_for_indicator_with_bounds(self):
        """Test for_indicator with min/max values (e.g., RSI 0-100)."""
        config = PriceScaleConfig.for_indicator("rsi", min_value=0, max_value=100)

        assert config.price_scale_id == "rsi"
        assert config.visible is True
        # Note: min/max values are accepted but not stored in PriceScaleOptions
        assert config.auto_scale is True
        assert config.mode == PriceScaleMode.NORMAL

    def test_for_indicator_without_bounds(self):
        """Test for_indicator without bounds (auto-scaling)."""
        config = PriceScaleConfig.for_indicator("macd")

        assert config.price_scale_id == "macd"
        assert config.visible is True
        assert config.auto_scale is True  # Enabled when no bounds
        assert config.mode == PriceScaleMode.NORMAL

    def test_for_indicator_with_only_min(self):
        """Test for_indicator with only minimum value."""
        config = PriceScaleConfig.for_indicator("stoch", min_value=0)

        # Note: min/max values are accepted but not stored in PriceScaleOptions
        assert config.price_scale_id == "stoch"
        assert config.auto_scale is True

    def test_for_indicator_with_only_max(self):
        """Test for_indicator with only maximum value."""
        config = PriceScaleConfig.for_indicator("custom", max_value=100)

        # Note: min/max values are accepted but not stored in PriceScaleOptions
        assert config.price_scale_id == "custom"
        assert config.auto_scale is True

    def test_for_percentage(self):
        """Test for_percentage creates percentage mode configuration."""
        config = PriceScaleConfig.for_percentage("pct_change")

        assert config.price_scale_id == "pct_change"
        assert config.visible is True
        assert config.auto_scale is True
        assert config.mode == PriceScaleMode.PERCENTAGE  # Percentage mode
        assert config.scale_margins.top == 0.1
        assert config.scale_margins.bottom == 0.1

    def test_for_logarithmic(self):
        """Test for_logarithmic creates logarithmic mode configuration."""
        config = PriceScaleConfig.for_logarithmic("price_log")

        assert config.price_scale_id == "price_log"
        assert config.visible is True
        assert config.auto_scale is True
        assert config.mode == PriceScaleMode.LOGARITHMIC  # Logarithmic mode
        assert config.scale_margins.top == 0.1
        assert config.scale_margins.bottom == 0.1

    def test_for_logarithmic_with_kwargs(self):
        """Test for_logarithmic with additional kwargs."""
        config = PriceScaleConfig.for_logarithmic("price_log", auto_scale=False)

        assert config.mode == PriceScaleMode.LOGARITHMIC
        assert config.auto_scale is False  # Overridden

    def test_kwargs_override_all_methods(self):
        """Test that kwargs can override defaults in all methods."""
        # Test with for_separate_pane
        config1 = PriceScaleConfig.for_separate_pane("test", mode=PriceScaleMode.PERCENTAGE)
        assert config1.mode == PriceScaleMode.PERCENTAGE

        # Test with for_indicator
        config2 = PriceScaleConfig.for_indicator("test2", visible=False)
        assert config2.visible is False

        # Test with for_percentage
        config3 = PriceScaleConfig.for_percentage("test3", auto_scale=False)
        assert config3.auto_scale is False

    def test_common_use_cases(self):
        """Test common real-world use cases."""
        # RSI (0-100) - min/max accepted but not stored
        rsi = PriceScaleConfig.for_indicator("rsi", min_value=0, max_value=100)
        assert rsi.price_scale_id == "rsi"
        assert rsi.auto_scale is True

        # Stochastic (0-100) - min/max accepted but not stored
        stoch = PriceScaleConfig.for_indicator("stoch", min_value=0, max_value=100)
        assert stoch.price_scale_id == "stoch"
        assert stoch.auto_scale is True

        # MACD (unbounded)
        macd = PriceScaleConfig.for_indicator("macd")
        assert macd.auto_scale is True

        # Volume overlay
        vol_overlay = PriceScaleConfig.for_volume(as_overlay=True)
        assert vol_overlay.visible is False
        assert vol_overlay.scale_margins.top == 0.8

        # Volume separate pane
        vol_pane = PriceScaleConfig.for_volume(as_overlay=False)
        assert vol_pane.visible is True
        assert vol_pane.scale_margins.top == 0.1
