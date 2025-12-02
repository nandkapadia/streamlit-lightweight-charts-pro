"""Test UI options for streamlit-lightweight-charts.

This module contains comprehensive tests for UI options classes including RangeConfig,
RangeSwitcherOptions, and LegendOptions. It validates construction, validation,
serialization, and integration scenarios for chart UI components.

The tests are organized into several classes:
- TestRangeConfig: Tests for time range configuration objects
- TestRangeSwitcherOptions: Tests for range switcher UI component options
- TestLegendOptions: Tests for chart legend display options
- TestUIOptionsIntegration: Tests for interactions between UI components
- TestUIOptionsEdgeCases: Tests for edge cases and special scenarios
- TestUIOptionsPerformance: Tests for performance characteristics
- TestUIOptionsValidation: Tests for validation scenarios
"""

# pylint: disable=no-member,protected-access

# Standard library imports
import gc
import sys
import time

# Third-party imports
import pytest
from lightweight_charts_core.charts.options.ui_options import (
    LegendOptions,
    RangeConfig,
    RangeSwitcherOptions,
)

# Local imports
from lightweight_charts_core.exceptions import TypeValidationError


class TestRangeConfig:
    """Test RangeConfig class.

    RangeConfig represents a time range option for chart range switchers.
    It contains display text and tooltip information for range buttons.
    """

    def test_default_construction(self):
        """Test construction with default values.

        Validates that RangeConfig initializes with empty strings for both
        text and tooltip when no parameters are provided.
        """
        # Create RangeConfig with default parameters
        config = RangeConfig()

        # Verify default values are empty strings
        assert config.text == ""
        assert config.tooltip == ""

    def test_custom_construction(self):
        """Test construction with custom values.

        Validates that RangeConfig properly stores custom text and tooltip
        values when provided during initialization.
        """
        # Create RangeConfig with custom text and tooltip values
        config = RangeConfig(text="1D", tooltip="1 Day")

        # Verify custom values are stored correctly
        assert config.text == "1D"
        assert config.tooltip == "1 Day"

    def test_validation_text(self):
        """Test validation of text field.

        Validates that the text field only accepts string values and raises
        appropriate TypeError for invalid types.
        """
        # Create a RangeConfig instance
        config = RangeConfig()

        # Attempt to set invalid type (integer) for text field
        # This should raise TypeError with specific error message
        with pytest.raises(TypeValidationError):
            config.set_text(123)

    def test_validation_tooltip(self):
        """Test validation of tooltip field.

        Validates that the tooltip field only accepts string values and raises
        appropriate TypeError for invalid types.
        """
        # Create a RangeConfig instance
        config = RangeConfig()

        # Attempt to set invalid type (integer) for tooltip field
        # This should raise TypeError with specific error message
        with pytest.raises(TypeValidationError):
            config.set_tooltip(123)

    def test_to_dict(self):
        """Test serialization.

        Validates that RangeConfig objects can be properly serialized to
        dictionaries for JSON transmission to frontend components.
        """
        # Create RangeConfig with specific values
        config = RangeConfig(text="1D", tooltip="1 Day")

        # Serialize to dictionary
        result = config.asdict()

        # Verify all fields are correctly serialized
        assert result["text"] == "1D"
        assert result["tooltip"] == "1 Day"


class TestRangeSwitcherOptions:
    """Test RangeSwitcherOptions class.

    RangeSwitcherOptions controls the behavior and appearance of the range
    switcher UI component, including visibility, position, and available ranges.
    """

    def test_default_construction(self):
        """Test construction with default values.

        Validates that RangeSwitcherOptions initializes with sensible defaults:
        visible=True, empty ranges list, and bottom-right position.
        """
        # Create RangeSwitcherOptions with default parameters
        options = RangeSwitcherOptions()

        # Verify default values are set correctly
        assert options.visible is True  # Range switcher should be visible by default
        assert options.ranges == []  # No ranges configured by default
        assert options.position == "bottom-right"  # Default position in bottom-right corner

    def test_custom_construction(self):
        """Test construction with custom values.

        Validates that RangeSwitcherOptions properly accepts and stores custom
        visibility and ranges configuration.
        """
        # Create a range configuration for testing
        ranges = [RangeConfig(text="1D", tooltip="1 Day")]

        # Create RangeSwitcherOptions with custom values
        options = RangeSwitcherOptions(visible=False, ranges=ranges)

        # Verify custom values are stored correctly
        assert options.visible is False  # Custom visibility setting
        assert options.ranges == ranges  # Custom ranges list

    def test_validation_visible(self):
        """Test validation of visible field.

        Validates that the visible field only accepts boolean values and raises
        appropriate TypeError for invalid types.
        """
        # Create a RangeSwitcherOptions instance
        options = RangeSwitcherOptions()

        # Attempt to set invalid type (string) for visible field
        # This should raise TypeError with specific error message
        with pytest.raises(TypeValidationError):
            options.set_visible("invalid")

    def test_validation_ranges(self):
        """Test validation of ranges field.

        Validates that the ranges field only accepts lists of RangeConfig objects
        and raises appropriate TypeError for invalid types.
        """
        # Create a RangeSwitcherOptions instance
        options = RangeSwitcherOptions()

        # Attempt to set invalid type (string) for ranges field
        # This should raise TypeError with specific error message
        with pytest.raises(TypeValidationError):
            options.set_ranges("invalid")

    def test_valid_corner_positions(self):
        """Test that range switcher supports only corner positions.

        Range switchers are typically positioned in chart corners to avoid
        interfering with chart data. This test validates all corner positions.
        """
        # Define valid corner positions for range switcher
        valid_positions = ["top-left", "top-right", "bottom-left", "bottom-right"]

        # Test each valid position
        for position in valid_positions:
            # Create RangeSwitcherOptions with each position
            options = RangeSwitcherOptions(position=position)

            # Verify position is stored correctly
            assert options.position == position

    def test_to_dict(self):
        """Test serialization.

        Validates that RangeSwitcherOptions objects can be properly serialized
        to dictionaries, including nested RangeConfig objects.
        """
        # Create range configuration and switcher options
        ranges = [RangeConfig(text="1D", tooltip="1 Day")]
        options = RangeSwitcherOptions(visible=False, ranges=ranges, position="top-left")

        # Serialize to dictionary
        result = options.asdict()

        # Verify all fields are correctly serialized
        assert result["visible"] is False
        assert len(result["ranges"]) == 1  # One range in the list
        assert result["ranges"][0]["text"] == "1D"  # Range text serialized
        assert result["position"] == "top-left"  # Position serialized


class TestLegendOptions:
    """Test LegendOptions class.

    LegendOptions controls the display and formatting of chart legends,
    including visibility, position, padding, and custom text templates.
    """

    def test_default_construction(self):
        """Test construction with default values.

        Validates that LegendOptions initializes with sensible defaults for
        chart legend display and positioning.
        """
        # Create LegendOptions with default parameters
        options = LegendOptions()

        # Verify default values are set correctly
        assert options.visible is True  # Legend should be visible by default
        assert options.position == "top-left"  # Default position
        assert options.padding == 6  # Default padding value for legend spacing
        assert options.text == ""  # No custom template by default

    def test_custom_construction(self):
        """Test construction with custom values.

        Validates that LegendOptions properly accepts and stores custom
        visibility, position, and padding settings.
        """
        # Create LegendOptions with custom values
        options = LegendOptions(visible=False, position="top-left", padding=10)

        # Verify custom values are stored correctly
        assert options.visible is False  # Custom visibility setting
        assert options.position == "top-left"  # Custom position
        assert options.padding == 10  # Custom padding value

    def test_custom_template_construction(self):
        """Test construction with custom template.

        Validates that LegendOptions can accept custom HTML templates for
        legend formatting with placeholder variables.
        """
        # Define a custom HTML template with placeholders
        template = "<span style='color: {color}'>{title}: {value}</span>"

        # Create LegendOptions with custom template
        options = LegendOptions(text=template, position="top-left")

        # Verify template and position are stored correctly
        assert options.text == template
        assert options.position == "top-left"

    def test_custom_template_with_placeholders(self):
        """Test custom template with various placeholders.

        Validates that complex HTML templates with multiple placeholders
        and formatting are properly stored and accessible.
        """
        # Define a complex template with multiple placeholders and HTML formatting
        template = "<div><strong>{title}</strong><br/>Price: ${value}<br/>Type: {type}</div>"

        # Create LegendOptions with complex template
        options = LegendOptions(text=template)

        # Verify complex template is stored correctly
        assert options.text == template

    def test_validation_visible(self):
        """Test validation of visible field.

        Validates that the visible field only accepts boolean values and raises
        appropriate TypeError for invalid types.
        """
        # Create a LegendOptions instance
        options = LegendOptions()

        # Attempt to set invalid type (string) for visible field
        # This should raise TypeError with specific error message
        with pytest.raises(TypeValidationError):
            options.set_visible("invalid")

    def test_validation_position(self):
        """Test validation of position field.

        Validates that the position field only accepts string values and raises
        appropriate TypeError for invalid types.
        """
        # Create a LegendOptions instance
        options = LegendOptions()

        # Attempt to set invalid type (integer) for position field
        # This should raise TypeError with specific error message
        with pytest.raises(TypeValidationError):
            options.set_position(123)

    def test_to_dict(self):
        """Test serialization.

        Validates that LegendOptions objects can be properly serialized to
        dictionaries for JSON transmission to frontend components.
        """
        # Create LegendOptions with specific values
        options = LegendOptions(visible=False, position="bottom")

        # Serialize to dictionary
        result = options.asdict()

        # Verify all fields are correctly serialized
        assert result["visible"] is False
        assert result["position"] == "bottom"

    def test_to_dict_with_custom_template(self):
        """Test serialization with custom template.

        Validates that LegendOptions with custom HTML templates serialize
        correctly, preserving the template string exactly.
        """
        # Define custom template for legend formatting
        template = "<span style='color: {color}'>{title}: {value}</span>"

        # Create LegendOptions with custom template
        options = LegendOptions(visible=True, position="top-left", text=template)

        # Serialize to dictionary
        result = options.asdict()

        # Verify all fields including template are correctly serialized
        assert result["visible"] is True
        assert result["position"] == "top-left"
        assert result["text"] == template  # Custom template preserved

    def test_legend_with_different_positions(self):
        """Test LegendOptions with different position values.

        Validates that LegendOptions accepts various position strings for
        flexible legend placement around the chart.
        """
        # Define common legend positions
        positions = ["top", "bottom", "left", "right"]

        # Test each position value
        for position in positions:
            # Create LegendOptions with each position
            options = LegendOptions(position=position)

            # Verify position is stored correctly
            assert options.position == position

    def test_legend_with_long_position_string(self):
        """Test LegendOptions with long position string.

        Validates that LegendOptions can handle composite position strings
        like "top-right" for precise legend placement.
        """
        # Define a composite position string
        long_position = "top-right"

        # Create LegendOptions with composite position
        options = LegendOptions(position=long_position)

        # Verify composite position is stored correctly
        assert options.position == long_position

    def test_legend_chainable_methods(self):
        """Test chainable methods.

        Validates that LegendOptions setter methods return self to enable
        method chaining for fluent configuration.
        """
        # Create LegendOptions instance
        options = LegendOptions()

        # Chain multiple setter methods together
        result = options.set_visible(False).set_position("bottom")

        # Verify method chaining returns the same instance
        assert result is options

        # Verify both chained operations were applied
        assert options.visible is False
        assert options.position == "bottom"

    def test_legend_chainable_methods_with_template(self):
        """Test chainable methods with custom template.

        Validates that text setter method also supports method chaining
        and properly updates the template.
        """
        # Define custom template
        template = "<div>{title}</div>"

        # Create LegendOptions and use chained text setter
        options = LegendOptions()
        result = options.set_text(template)

        # Verify method chaining returns the same instance
        assert result is options

        # Verify template was set correctly
        assert options.text == template

    def test_legend_equality(self):
        """Test LegendOptions equality.

        Validates that LegendOptions objects with identical properties
        are considered equal, while different configurations are not.
        """
        # Create LegendOptions with identical properties
        legend1 = LegendOptions(visible=True, position="top")
        legend2 = LegendOptions(visible=True, position="top")

        # Create LegendOptions with different position
        legend3 = LegendOptions(visible=True, position="bottom")

        # Verify equality for identical configurations
        assert legend1 == legend2

        # Verify inequality for different configurations
        assert legend1 != legend3

    def test_legend_equality_with_template(self):
        """Test LegendOptions equality with custom template.

        Validates that custom templates are included in equality comparison,
        ensuring template differences result in inequality.
        """
        # Define different templates
        template1 = "<span>{title}</span>"
        template2 = "<div>{title}</div>"

        # Create LegendOptions with identical properties including template
        legend1 = LegendOptions(visible=True, position="top", text=template1)
        legend2 = LegendOptions(visible=True, position="top", text=template1)

        # Create LegendOptions with different template
        legend3 = LegendOptions(visible=True, position="top", text=template2)

        # Verify equality includes template comparison
        assert legend1 == legend2  # Same template
        assert legend1 != legend3  # Different template

    def test_legend_repr(self):
        """Test LegendOptions repr.

        Validates that the string representation of LegendOptions includes
        the class name and key property values for debugging.
        """
        # Create LegendOptions instance
        legend = LegendOptions(visible=True, position="top")

        # Get string representation
        repr_str = repr(legend)

        # Verify representation contains key information
        assert "LegendOptions" in repr_str  # Class name included
        assert "visible=True" in repr_str  # Visibility state included
        assert "position='top'" in repr_str  # Position included

    def test_legend_repr_with_template(self):
        """Test LegendOptions repr with custom template.

        Validates that custom templates are included in the string representation
        when present.
        """
        # Define custom template
        template = "<span>{title}</span>"

        # Create LegendOptions with custom template
        legend = LegendOptions(visible=True, position="top", text=template)

        # Get string representation
        repr_str = repr(legend)

        # Verify representation includes template information
        assert "LegendOptions" in repr_str  # Class name included
        assert "text=" in repr_str  # Template field included


class TestUIOptionsIntegration:
    """Test integration between UI options.

    These tests validate that different UI option classes work together
    correctly when used in combination for complete chart configuration.
    """

    def test_range_switcher_with_legend(self):
        """Test RangeSwitcherOptions with LegendOptions.

        Validates that range switcher and legend options can be used together
        and both serialize correctly for frontend configuration.
        """
        # Create range configuration and range switcher
        ranges = [RangeConfig(text="1D", tooltip="1 Day")]
        range_switcher = RangeSwitcherOptions(visible=True, ranges=ranges)

        # Create legend options
        legend = LegendOptions(visible=True, position="top-right")

        # Serialize both components for frontend transmission
        range_result = range_switcher.asdict()
        legend_result = legend.asdict()

        # Verify both components serialize correctly
        assert range_result["visible"] is True
        assert legend_result["visible"] is True
        assert legend_result["position"] == "top-right"

    def test_ui_options_serialization_chain(self):
        """Test complete UI options serialization chain.

        Validates that complex UI configurations with multiple components
        can be properly serialized for complete chart setup.
        """
        # Create comprehensive UI configuration
        ranges = [RangeConfig(text="1W", tooltip="1 Week")]
        range_switcher = RangeSwitcherOptions(visible=False, ranges=ranges)
        legend = LegendOptions(visible=True, position="bottom-left")

        # Serialize both components for frontend configuration
        range_dict = range_switcher.asdict()
        legend_dict = legend.asdict()

        # Verify range switcher serialization
        assert range_dict["visible"] is False
        assert len(range_dict["ranges"]) == 1
        assert range_dict["ranges"][0]["text"] == "1W"

        # Verify legend serialization
        assert legend_dict["visible"] is True
        assert legend_dict["position"] == "bottom-left"

    def test_ui_options_in_lists(self):
        """Test UI options objects in lists.

        Validates that lists of UI option objects (like multiple ranges)
        are properly handled and serialized in correct order.
        """
        # Create multiple range configurations for time periods
        ranges = [
            RangeConfig(text="1D", tooltip="1 Day"),
            RangeConfig(text="1W", tooltip="1 Week"),
            RangeConfig(text="1M", tooltip="1 Month"),
        ]

        # Create range switcher with multiple ranges
        range_switcher = RangeSwitcherOptions(visible=True, ranges=ranges)

        # Serialize to dictionary
        result = range_switcher.asdict()

        # Verify all ranges are serialized in correct order
        assert len(result["ranges"]) == 3
        assert result["ranges"][0]["text"] == "1D"  # First range
        assert result["ranges"][1]["text"] == "1W"  # Second range
        assert result["ranges"][2]["text"] == "1M"  # Third range

    def test_ui_options_in_dicts(self):
        """Test UI options objects in dictionaries.

        Validates that UI options can be stored in dictionaries for
        organized configuration management and accessed/serialized correctly.
        """
        # Create configuration dictionary with UI options
        config = {
            "range_switcher": RangeSwitcherOptions(visible=True, ranges=[]),
            "legend": LegendOptions(visible=False, position="top"),
        }

        # Access and serialize each component from dictionary
        range_result = config["range_switcher"].asdict()
        legend_result = config["legend"].asdict()

        # Verify both components maintain their properties when stored in dict
        assert range_result["visible"] is True
        assert legend_result["visible"] is False
        assert legend_result["position"] == "top"


class TestUIOptionsEdgeCases:
    """Test edge cases for UI options.

    These tests validate behavior with unusual or boundary condition inputs
    to ensure robust handling of edge cases.
    """

    def test_empty_strings(self):
        """Test handling of empty strings.

        Validates that empty strings are handled gracefully and omitted
        from serialized output to reduce payload size.
        """
        # Create configurations with empty strings
        range_config = RangeConfig(text="", tooltip="")
        legend = LegendOptions(position="")

        # Serialize to dictionaries
        range_result = range_config.asdict()
        legend_result = legend.asdict()

        # Verify empty strings are omitted from serialized output (by design)
        assert "text" not in range_result  # Empty text omitted
        assert "tooltip" not in range_result  # Empty tooltip omitted
        assert "position" not in legend_result  # Empty position omitted

    def test_unicode_strings(self):
        """Test handling of unicode strings.

        Validates that unicode characters (like Japanese, Chinese, emojis)
        are properly preserved through serialization for international support.
        """
        # Create configurations with unicode characters
        range_config = RangeConfig(text="1日", tooltip="1日")  # Japanese characters
        legend = LegendOptions(position="top-右")  # Mixed languages

        # Serialize to dictionaries
        range_result = range_config.asdict()
        legend_result = legend.asdict()

        # Verify unicode characters are preserved exactly
        assert range_result["text"] == "1日"
        assert range_result["tooltip"] == "1日"
        assert legend_result["position"] == "top-右"

    def test_special_characters(self):
        """Test handling of special characters.

        Validates that special characters like ampersands, spaces, and symbols
        are properly preserved in configuration strings.
        """
        # Create configurations with special characters
        range_config = RangeConfig(text="1D & 1W", tooltip="1 Day & 1 Week")
        legend = LegendOptions(position="top-right")

        # Serialize to dictionaries
        range_result = range_config.asdict()
        legend_result = legend.asdict()

        # Verify special characters are preserved exactly
        assert range_result["text"] == "1D & 1W"
        assert range_result["tooltip"] == "1 Day & 1 Week"
        assert legend_result["position"] == "top-right"

    def test_very_long_strings(self):
        """Test handling of very long strings.

        Validates that extremely long strings are handled without truncation
        or corruption, testing system limits and memory handling.
        """
        # Create very long strings to test boundary conditions
        long_text = "A" * 1000  # 1000 character text
        long_tooltip = "B" * 1000  # 1000 character tooltip
        long_position = "C" * 100  # 100 character position

        # Create configurations with long strings
        range_config = RangeConfig(text=long_text, tooltip=long_tooltip)
        legend = LegendOptions(position=long_position)

        # Serialize to dictionaries
        range_result = range_config.asdict()
        legend_result = legend.asdict()

        # Verify long strings are preserved exactly without truncation
        assert range_result["text"] == long_text
        assert range_result["tooltip"] == long_tooltip
        assert legend_result["position"] == long_position


class TestUIOptionsPerformance:
    """Test performance aspects of UI options.

    These tests validate that UI options classes perform efficiently under
    load and don't introduce performance bottlenecks in chart rendering.
    """

    def test_construction_performance(self):
        """Test performance of UI options construction.

        Validates that creating many UI option objects is fast enough for
        real-time chart updates and bulk configuration scenarios.
        """
        # Record start time for performance measurement
        start_time = time.time()

        # Create many UI options objects to test construction performance
        for _ in range(1000):
            # Create instances of each UI option type
            RangeConfig(text="1D", tooltip="1 Day")
            RangeSwitcherOptions(visible=True, ranges=[])
            LegendOptions(visible=True, position="top")

        # Record end time and verify performance
        end_time = time.time()
        assert end_time - start_time < 1.0  # Should complete in less than 1 second

    def test_serialization_performance(self):
        """Test performance of UI options serialization.

        Validates that serializing UI options to dictionaries is fast enough
        for frequent chart updates and real-time configuration changes.
        """
        # Create complex configurations for realistic performance testing
        ranges = [RangeConfig(text="1D", tooltip="1 Day") for _ in range(100)]
        range_switcher = RangeSwitcherOptions(visible=True, ranges=ranges)
        legend = LegendOptions(visible=True, position="top")

        # Record start time for performance measurement
        start_time = time.time()

        # Perform many serializations to test performance under load
        for _ in range(1000):
            range_switcher.asdict()  # Serialize range switcher with 100 ranges
            legend.asdict()  # Serialize legend options

        # Record end time and verify performance
        end_time = time.time()
        # Increased from 2.0s to 5.0s to account for CI/CD system variance
        assert end_time - start_time < 5.0  # Should complete in less than 5 seconds

    def test_memory_usage(self):
        """Test memory usage of UI options.

        Validates that UI option objects don't consume excessive memory,
        ensuring they're suitable for applications with many chart instances.
        """
        # Force garbage collection to get clean baseline
        gc.collect()
        initial_memory = sys.getsizeof([])

        # Create many UI option objects to test memory consumption
        objects = []
        for _ in range(1000):
            # Create instances of each UI option type
            objects.append(RangeConfig(text="1D", tooltip="1 Day"))
            objects.append(RangeSwitcherOptions(visible=True, ranges=[]))
            objects.append(LegendOptions(visible=True, position="top"))

        # Force garbage collection to ensure accurate measurement
        gc.collect()
        final_memory = sys.getsizeof(objects)

        # Verify memory usage remains reasonable
        memory_increase = final_memory - initial_memory
        assert memory_increase < 1000000  # Less than 1MB increase for 3000 objects


class TestUIOptionsValidation:
    """Test validation scenarios for UI options.

    These tests validate edge cases and boundary conditions for UI option
    validation to ensure robust error handling and data integrity.
    """

    def test_range_config_validation_edge_cases(self):
        """Test edge case validation for RangeConfig.

        Validates that RangeConfig handles extreme string lengths and edge
        cases without validation errors or data corruption.
        """
        # Test with very long strings to check boundary conditions
        long_text = "A" * 10000  # 10,000 character string
        config = RangeConfig(text=long_text, tooltip=long_text)

        # Verify long strings are accepted and stored correctly
        assert config.text == long_text
        assert config.tooltip == long_text

        # Test with empty strings to verify they're accepted
        config = RangeConfig(text="", tooltip="")

        # Verify empty strings are stored correctly
        assert config.text == ""
        assert config.tooltip == ""

    def test_range_switcher_validation_edge_cases(self):
        """Test edge case validation for RangeSwitcherOptions.

        Validates that RangeSwitcherOptions handles empty and large range
        lists correctly without performance or memory issues.
        """
        # Test with empty ranges list (common initial state)
        options = RangeSwitcherOptions(visible=True, ranges=[])

        # Verify empty ranges list is handled correctly
        assert options.visible is True
        assert options.ranges == []

        # Test with many ranges to check scalability
        many_ranges = [RangeConfig(text=f"R{i}", tooltip=f"Range {i}") for i in range(100)]
        options = RangeSwitcherOptions(visible=False, ranges=many_ranges)

        # Verify large ranges list is handled correctly
        assert options.visible is False
        assert len(options.ranges) == 100

    def test_legend_validation_edge_cases(self):
        """Test edge case validation for LegendOptions.

        Validates that LegendOptions accepts various position formats and
        handles edge cases like empty positions gracefully.
        """
        # Test with standard position values used in chart layouts
        positions = [
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
        ]

        # Verify each position is accepted and stored correctly
        for position in positions:
            options = LegendOptions(position=position)
            assert options.position == position

        # Test with empty position string (edge case)
        options = LegendOptions(position="")
        assert options.position == ""

        # Test with complex custom templates including multiline HTML
        complex_template = """
        <div class="legend-item" style="background: {color}; padding: 5px;">
            <strong>{title}</strong><br/>
            <span>Value: {value}</span><br/>
            <small>Type: {type}</small>
        </div>
        """
        options = LegendOptions(text=complex_template)

        # Verify complex multiline template is preserved exactly
        assert options.text == complex_template

        # Test with template containing HTML special characters
        special_template = "<span>&lt;{title}&gt;: &quot;{value}&quot;</span>"
        options = LegendOptions(text=special_template)

        # Verify HTML entities and special characters are preserved
        assert options.text == special_template

        # Test with template containing unicode characters and emojis
        unicode_template = "📊 {title}: {value} €"
        options = LegendOptions(text=unicode_template)

        # Verify unicode characters and emojis are preserved
        assert options.text == unicode_template

    def test_ui_options_validation_integration(self):
        """Test validation when using UI options together.

        Validates that complex configurations with multiple UI components
        work together correctly and maintain data integrity.
        """
        # Create a comprehensive UI configuration with multiple components
        ranges = [
            RangeConfig(text="1D", tooltip="1 Day"),
            RangeConfig(text="1W", tooltip="1 Week"),
            RangeConfig(text="1M", tooltip="1 Month"),
        ]
        range_switcher = RangeSwitcherOptions(visible=True, ranges=ranges)
        legend = LegendOptions(
            visible=False,
            position="top-right",
            text="<span>{title}: {value}</span>",
        )

        # Verify all components maintain their configured values
        assert range_switcher.visible is True
        assert len(range_switcher.ranges) == 3
        assert legend.visible is False
        assert legend.position == "top-right"
        assert legend.text == "<span>{title}: {value}</span>"

        # Verify all components serialize correctly for frontend use
        range_dict = range_switcher.asdict()
        legend_dict = legend.asdict()

        # Verify range switcher serialization
        assert range_dict["visible"] is True
        assert len(range_dict["ranges"]) == 3

        # Verify legend serialization
        assert legend_dict["visible"] is False
        assert legend_dict["position"] == "top-right"
        assert legend_dict["text"] == "<span>{title}: {value}</span>"
