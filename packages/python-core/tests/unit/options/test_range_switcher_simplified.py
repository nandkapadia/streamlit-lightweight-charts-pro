"""Test range switcher functionality with automatic range filtering.

This module contains tests for the RangeSwitcherOptions class which automatically
filters time ranges in the frontend based on available data timespan.

Tests cover:
- RangeSwitcherOptions configuration and serialization
- Range configuration validation
- Integration scenarios

Note: Range filtering is always enabled in the frontend - no configuration needed.
"""

# Standard library imports

# Local imports
from lightweight_charts_core.charts.options.ui_options import (
    LegendOptions,
    RangeConfig,
    RangeSwitcherOptions,
    TimeRange,
)


class TestRangeSwitcherOptions:
    """Test RangeSwitcherOptions with automatic range filtering.

    This class validates the RangeSwitcherOptions configuration which
    automatically filters invalid ranges in the frontend.
    """

    def test_default_construction(self):
        """Test default construction of RangeSwitcherOptions.

        Validates that RangeSwitcherOptions initializes with correct default values.
        Range filtering is always enabled in the frontend.
        """
        # Create RangeSwitcherOptions with default parameters
        options = RangeSwitcherOptions()

        # Verify default values
        assert options.visible is True
        assert options.ranges == []
        assert options.position == "bottom-right"

    def test_custom_construction(self):
        """Test construction with custom values.

        Validates that RangeSwitcherOptions properly accepts custom values.
        Range filtering is automatically enabled in the frontend.
        """
        # Create range configurations for testing
        ranges = [RangeConfig(text="1D", range=TimeRange.ONE_DAY)]

        # Create RangeSwitcherOptions with custom values
        options = RangeSwitcherOptions(visible=False, ranges=ranges, position="top-left")

        # Verify custom values are set correctly
        assert options.visible is False
        assert len(options.ranges) == 1
        assert options.position == "top-left"

    def test_with_range_configurations(self):
        """Test RangeSwitcherOptions with range configurations.

        Validates that RangeSwitcherOptions works correctly with
        a list of range configurations. Frontend will automatically
        filter invalid ranges.
        """
        # Create range configurations for testing
        ranges = [
            RangeConfig(text="1D", range=TimeRange.ONE_DAY),
            RangeConfig(text="1W", range=TimeRange.ONE_WEEK),
            RangeConfig(text="1M", range=TimeRange.ONE_MONTH),
            RangeConfig(text="All", range=TimeRange.ALL),
        ]

        # Create RangeSwitcherOptions with ranges
        options = RangeSwitcherOptions(visible=True, ranges=ranges)

        # Verify all properties are set correctly
        assert options.visible is True
        assert len(options.ranges) == 4

    def test_chainable_methods(self):
        """Test chainable methods for configuration.

        Validates that setter methods support method chaining
        for fluent configuration.
        """
        # Create RangeSwitcherOptions and use chainable methods
        ranges = [RangeConfig(text="1D", range=TimeRange.ONE_DAY)]
        options = RangeSwitcherOptions()
        result = options.set_visible(False).set_ranges(ranges)

        # Verify method chaining returns the same instance
        assert result is options

        # Verify values were set correctly
        assert options.visible is False
        assert len(options.ranges) == 1

    def test_serialization(self):
        """Test serialization of RangeSwitcherOptions.

        Validates that all fields are properly serialized to
        dictionary format for frontend transmission.
        """
        # Create RangeSwitcherOptions with configuration
        ranges = [RangeConfig(text="1D", range=TimeRange.ONE_DAY)]
        options = RangeSwitcherOptions(visible=True, ranges=ranges, position="top-right")

        # Serialize to dictionary
        result = options.asdict()

        # Verify all fields are serialized correctly
        assert result["visible"] is True
        assert len(result["ranges"]) == 1
        assert result["position"] == "top-right"

        # Range filtering is handled automatically in frontend
        # No hideInvalidRanges option needed

    def test_integration_scenario(self):
        """Test integration scenario with complete configuration.

        Validates a realistic configuration with all range switcher options.
        Frontend will automatically handle range filtering.
        """
        # Create realistic trading ranges
        trading_ranges = [
            RangeConfig(text="1D", range=TimeRange.ONE_DAY),
            RangeConfig(text="7D", range=TimeRange.ONE_WEEK),
            RangeConfig(text="1M", range=TimeRange.ONE_MONTH),
            RangeConfig(text="3M", range=TimeRange.THREE_MONTHS),
            RangeConfig(text="1Y", range=TimeRange.ONE_YEAR),
            RangeConfig(text="All", range=TimeRange.ALL),
        ]

        # Create complete range switcher configuration
        options = RangeSwitcherOptions(visible=True, ranges=trading_ranges, position="top-right")

        # Verify complete configuration
        assert options.visible is True
        assert len(options.ranges) == 6
        assert options.position == "top-right"

        # Verify serialization produces correct frontend config
        result = options.asdict()
        expected_keys = ["visible", "ranges", "position"]

        for key in expected_keys:
            assert key in result

        # Verify specific values
        assert result["visible"] is True
        assert len(result["ranges"]) == 6
        assert result["position"] == "top-right"

        # Verify range configurations are properly serialized
        for i, range_config in enumerate(trading_ranges):
            serialized_range = result["ranges"][i]
            assert serialized_range["text"] == range_config.text


class TestRangeSwitcherIntegration:
    """Test integration scenarios for range switcher."""

    def test_with_legend_options(self):
        """Test range switcher in combination with legend options.

        Validates that range switcher and legend options work together
        correctly when automatic filtering is enabled.
        """
        # Create range switcher with automatic filtering
        ranges = [RangeConfig(text="1D", range=TimeRange.ONE_DAY)]
        range_switcher = RangeSwitcherOptions(ranges=ranges)

        # Create legend options
        legend = LegendOptions(visible=True, position="top-left")

        # Verify both components can be configured together
        range_result = range_switcher.asdict()
        legend_result = legend.asdict()

        # Verify range switcher configuration
        assert len(range_result["ranges"]) == 1

        # Verify legend configuration is unaffected
        assert legend_result["visible"] is True
        assert legend_result["position"] == "top-left"

    def test_ui_options_dict(self):
        """Test range switcher in UI options dictionary.

        Validates that range switcher works correctly when used in
        complete UI configurations with automatic filtering.
        """
        # Create comprehensive UI configuration
        ranges = [
            RangeConfig(text="1D", range=TimeRange.ONE_DAY),
            RangeConfig(text="1W", range=TimeRange.ONE_WEEK),
            RangeConfig(text="All", range=TimeRange.ALL),
        ]

        ui_config = {"rangeSwitcher": RangeSwitcherOptions(visible=True, ranges=ranges)}

        # Verify UI configuration structure
        assert "rangeSwitcher" in ui_config
        range_switcher = ui_config["rangeSwitcher"]

        # Verify serialization in UI context
        serialized = range_switcher.asdict()
        assert serialized["visible"] is True
        assert len(serialized["ranges"]) == 3
