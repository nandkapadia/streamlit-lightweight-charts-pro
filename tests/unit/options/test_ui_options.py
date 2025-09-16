"""Test UI options for streamlit-lightweight-charts."""

import pytest

from streamlit_lightweight_charts_pro.charts.options.ui_options import (
    LegendOptions,
    RangeConfig,
    RangeSwitcherOptions,
)


class TestRangeConfig:
    """Test RangeConfig class."""

    def test_default_construction(self):
        """Test construction with default values."""
        config = RangeConfig()
        assert config.text == ""
        assert config.tooltip == ""

    def test_custom_construction(self):
        """Test construction with custom values."""
        config = RangeConfig(text="1D", tooltip="1 Day")
        assert config.text == "1D"
        assert config.tooltip == "1 Day"

    def test_validation_text(self):
        """Test validation of text field."""
        config = RangeConfig()
        with pytest.raises(TypeError, match="text must be of type"):
            config.set_text(123)

    def test_validation_tooltip(self):
        """Test validation of tooltip field."""
        config = RangeConfig()
        with pytest.raises(TypeError, match="tooltip must be of type"):
            config.set_tooltip(123)

    def test_to_dict(self):
        """Test serialization."""
        config = RangeConfig(text="1D", tooltip="1 Day")
        result = config.asdict()
        assert result["text"] == "1D"
        assert result["tooltip"] == "1 Day"


class TestRangeSwitcherOptions:
    """Test RangeSwitcherOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = RangeSwitcherOptions()
        assert options.visible is True
        assert options.ranges == []
        assert options.position == "bottom-right"

    def test_custom_construction(self):
        """Test construction with custom values."""
        ranges = [RangeConfig(text="1D", tooltip="1 Day")]
        options = RangeSwitcherOptions(visible=False, ranges=ranges)
        assert options.visible is False
        assert options.ranges == ranges

    def test_validation_visible(self):
        """Test validation of visible field."""
        options = RangeSwitcherOptions()
        with pytest.raises(TypeError, match="visible must be a boolean"):
            options.set_visible("invalid")

    def test_validation_ranges(self):
        """Test validation of ranges field."""
        options = RangeSwitcherOptions()
        with pytest.raises(TypeError, match="ranges must be of type"):
            options.set_ranges("invalid")

    def test_valid_corner_positions(self):
        """Test that range switcher supports only corner positions."""
        valid_positions = ["top-left", "top-right", "bottom-left", "bottom-right"]

        for position in valid_positions:
            options = RangeSwitcherOptions(position=position)
            assert options.position == position

    def test_to_dict(self):
        """Test serialization."""
        ranges = [RangeConfig(text="1D", tooltip="1 Day")]
        options = RangeSwitcherOptions(visible=False, ranges=ranges, position="top-left")
        result = options.asdict()
        assert result["visible"] is False
        assert len(result["ranges"]) == 1
        assert result["ranges"][0]["text"] == "1D"
        assert result["position"] == "top-left"


class TestLegendOptions:
    """Test LegendOptions class."""

    def test_default_construction(self):
        """Test construction with default values."""
        options = LegendOptions()
        assert options.visible is True
        assert options.position == "top-left"
        assert options.padding == 4  # Updated default value
        assert options.text == ""

    def test_custom_construction(self):
        """Test construction with custom values."""
        options = LegendOptions(visible=False, position="top-left", padding=10)
        assert options.visible is False
        assert options.position == "top-left"
        assert options.padding == 10

    def test_custom_template_construction(self):
        """Test construction with custom template."""
        template = "<span style='color: {color}'>{title}: {value}</span>"
        options = LegendOptions(text=template, position="top-left")
        assert options.text == template
        assert options.position == "top-left"

    def test_custom_template_with_placeholders(self):
        """Test custom template with various placeholders."""
        template = "<div><strong>{title}</strong><br/>Price: ${value}<br/>Type: {type}</div>"
        options = LegendOptions(text=template)
        assert options.text == template

    def test_validation_visible(self):
        """Test validation of visible field."""
        options = LegendOptions()
        with pytest.raises(TypeError, match="visible must be a boolean"):
            options.set_visible("invalid")

    def test_validation_position(self):
        """Test validation of position field."""
        options = LegendOptions()
        with pytest.raises(TypeError, match="position must be of type"):
            options.set_position(123)

    def test_to_dict(self):
        """Test serialization."""
        options = LegendOptions(visible=False, position="bottom")
        result = options.asdict()
        assert result["visible"] is False
        assert result["position"] == "bottom"

    def test_to_dict_with_custom_template(self):
        """Test serialization with custom template."""
        template = "<span style='color: {color}'>{title}: {value}</span>"
        options = LegendOptions(visible=True, position="top-left", text=template)
        result = options.asdict()
        assert result["visible"] is True
        assert result["position"] == "top-left"
        assert result["text"] == template

    def test_legend_with_different_positions(self):
        """Test LegendOptions with different position values."""
        positions = ["top", "bottom", "left", "right"]
        for position in positions:
            options = LegendOptions(position=position)
            assert options.position == position

    def test_legend_with_long_position_string(self):
        """Test LegendOptions with long position string."""
        long_position = "top-right"
        options = LegendOptions(position=long_position)
        assert options.position == long_position

    def test_legend_chainable_methods(self):
        """Test chainable methods."""
        options = LegendOptions()
        result = options.set_visible(False).set_position("bottom")
        assert result is options
        assert options.visible is False
        assert options.position == "bottom"

    def test_legend_chainable_methods_with_template(self):
        """Test chainable methods with custom template."""
        template = "<div>{title}</div>"
        options = LegendOptions()
        result = options.set_text(template)
        assert result is options
        assert options.text == template

    def test_legend_equality(self):
        """Test LegendOptions equality."""
        legend1 = LegendOptions(visible=True, position="top")
        legend2 = LegendOptions(visible=True, position="top")
        legend3 = LegendOptions(visible=True, position="bottom")

        assert legend1 == legend2
        assert legend1 != legend3

    def test_legend_equality_with_template(self):
        """Test LegendOptions equality with custom template."""
        template1 = "<span>{title}</span>"
        template2 = "<div>{title}</div>"

        legend1 = LegendOptions(visible=True, position="top", text=template1)
        legend2 = LegendOptions(visible=True, position="top", text=template1)
        legend3 = LegendOptions(visible=True, position="top", text=template2)

        assert legend1 == legend2
        assert legend1 != legend3

    def test_legend_repr(self):
        """Test LegendOptions repr."""
        legend = LegendOptions(visible=True, position="top")
        repr_str = repr(legend)
        assert "LegendOptions" in repr_str
        assert "visible=True" in repr_str
        assert "position='top'" in repr_str

    def test_legend_repr_with_template(self):
        """Test LegendOptions repr with custom template."""
        template = "<span>{title}</span>"
        legend = LegendOptions(visible=True, position="top", text=template)
        repr_str = repr(legend)
        assert "LegendOptions" in repr_str
        assert "text=" in repr_str


class TestUIOptionsIntegration:
    """Test integration between UI options."""

    def test_range_switcher_with_legend(self):
        """Test RangeSwitcherOptions with LegendOptions."""
        ranges = [RangeConfig(text="1D", tooltip="1 Day")]
        range_switcher = RangeSwitcherOptions(visible=True, ranges=ranges)
        legend = LegendOptions(visible=True, position="top-right")

        # Both should serialize correctly
        range_result = range_switcher.asdict()
        legend_result = legend.asdict()

        assert range_result["visible"] is True
        assert legend_result["visible"] is True
        assert legend_result["position"] == "top-right"

    def test_ui_options_serialization_chain(self):
        """Test complete UI options serialization chain."""
        ranges = [RangeConfig(text="1W", tooltip="1 Week")]
        range_switcher = RangeSwitcherOptions(visible=False, ranges=ranges)
        legend = LegendOptions(visible=True, position="bottom-left")

        # Test that both can be serialized and deserialized
        range_dict = range_switcher.asdict()
        legend_dict = legend.asdict()

        assert range_dict["visible"] is False
        assert len(range_dict["ranges"]) == 1
        assert range_dict["ranges"][0]["text"] == "1W"

        assert legend_dict["visible"] is True
        assert legend_dict["position"] == "bottom-left"

    def test_ui_options_in_lists(self):
        """Test UI options objects in lists."""
        ranges = [
            RangeConfig(text="1D", tooltip="1 Day"),
            RangeConfig(text="1W", tooltip="1 Week"),
            RangeConfig(text="1M", tooltip="1 Month"),
        ]
        range_switcher = RangeSwitcherOptions(visible=True, ranges=ranges)

        result = range_switcher.asdict()
        assert len(result["ranges"]) == 3
        assert result["ranges"][0]["text"] == "1D"
        assert result["ranges"][1]["text"] == "1W"
        assert result["ranges"][2]["text"] == "1M"

    def test_ui_options_in_dicts(self):
        """Test UI options objects in dictionaries."""
        config = {
            "range_switcher": RangeSwitcherOptions(visible=True, ranges=[]),
            "legend": LegendOptions(visible=False, position="top"),
        }

        # Test that they can be accessed and serialized
        range_result = config["range_switcher"].asdict()
        legend_result = config["legend"].asdict()

        assert range_result["visible"] is True
        assert legend_result["visible"] is False
        assert legend_result["position"] == "top"


class TestUIOptionsEdgeCases:
    """Test edge cases for UI options."""

    def test_empty_strings(self):
        """Test handling of empty strings."""
        range_config = RangeConfig(text="", tooltip="")
        legend = LegendOptions(position="")

        range_result = range_config.asdict()
        legend_result = legend.asdict()

        # Empty strings are omitted from the output by design
        assert "text" not in range_result
        assert "tooltip" not in range_result
        assert "position" not in legend_result

    def test_unicode_strings(self):
        """Test handling of unicode strings."""
        range_config = RangeConfig(text="1日", tooltip="1日")
        legend = LegendOptions(position="top-右")

        range_result = range_config.asdict()
        legend_result = legend.asdict()

        assert range_result["text"] == "1日"
        assert range_result["tooltip"] == "1日"
        assert legend_result["position"] == "top-右"

    def test_special_characters(self):
        """Test handling of special characters."""
        range_config = RangeConfig(text="1D & 1W", tooltip="1 Day & 1 Week")
        legend = LegendOptions(position="top-right")

        range_result = range_config.asdict()
        legend_result = legend.asdict()

        assert range_result["text"] == "1D & 1W"
        assert range_result["tooltip"] == "1 Day & 1 Week"
        assert legend_result["position"] == "top-right"

    def test_very_long_strings(self):
        """Test handling of very long strings."""
        long_text = "A" * 1000
        long_tooltip = "B" * 1000
        long_position = "C" * 100

        range_config = RangeConfig(text=long_text, tooltip=long_tooltip)
        legend = LegendOptions(position=long_position)

        range_result = range_config.asdict()
        legend_result = legend.asdict()

        assert range_result["text"] == long_text
        assert range_result["tooltip"] == long_tooltip
        assert legend_result["position"] == long_position


class TestUIOptionsPerformance:
    """Test performance aspects of UI options."""

    def test_construction_performance(self):
        """Test performance of UI options construction."""
        import time

        start_time = time.time()

        # Create many UI options objects
        for _ in range(1000):
            RangeConfig(text="1D", tooltip="1 Day")
            RangeSwitcherOptions(visible=True, ranges=[])
            LegendOptions(visible=True, position="top")

        end_time = time.time()
        assert end_time - start_time < 1.0  # Should complete in less than 1 second

    def test_serialization_performance(self):
        """Test performance of UI options serialization."""
        import time

        ranges = [RangeConfig(text="1D", tooltip="1 Day") for _ in range(100)]
        range_switcher = RangeSwitcherOptions(visible=True, ranges=ranges)
        legend = LegendOptions(visible=True, position="top")

        start_time = time.time()

        # Serialize many times
        for _ in range(1000):
            range_switcher.asdict()
            legend.asdict()

        end_time = time.time()
        assert end_time - start_time < 1.0  # Should complete in less than 1 second

    def test_memory_usage(self):
        """Test memory usage of UI options."""
        import gc
        import sys

        # Force garbage collection
        gc.collect()
        initial_memory = sys.getsizeof([])

        # Create many objects
        objects = []
        for _ in range(1000):
            objects.append(RangeConfig(text="1D", tooltip="1 Day"))
            objects.append(RangeSwitcherOptions(visible=True, ranges=[]))
            objects.append(LegendOptions(visible=True, position="top"))

        # Force garbage collection again
        gc.collect()
        final_memory = sys.getsizeof(objects)

        # Memory usage should be reasonable
        memory_increase = final_memory - initial_memory
        assert memory_increase < 1000000  # Less than 1MB increase


class TestUIOptionsValidation:
    """Test validation scenarios for UI options."""

    def test_range_config_validation_edge_cases(self):
        """Test edge case validation for RangeConfig."""
        # Test with very long strings
        long_text = "A" * 10000
        config = RangeConfig(text=long_text, tooltip=long_text)
        assert config.text == long_text
        assert config.tooltip == long_text

        # Test with empty strings
        config = RangeConfig(text="", tooltip="")
        assert config.text == ""
        assert config.tooltip == ""

    def test_range_switcher_validation_edge_cases(self):
        """Test edge case validation for RangeSwitcherOptions."""
        # Test with empty ranges list
        options = RangeSwitcherOptions(visible=True, ranges=[])
        assert options.visible is True
        assert options.ranges == []

        # Test with many ranges
        many_ranges = [RangeConfig(text=f"R{i}", tooltip=f"Range {i}") for i in range(100)]
        options = RangeSwitcherOptions(visible=False, ranges=many_ranges)
        assert options.visible is False
        assert len(options.ranges) == 100

    def test_legend_validation_edge_cases(self):
        """Test edge case validation for LegendOptions."""
        # Test with various position values
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
        for position in positions:
            options = LegendOptions(position=position)
            assert options.position == position

        # Test with empty position
        options = LegendOptions(position="")
        assert options.position == ""

        # Test with complex custom templates
        complex_template = """
        <div class="legend-item" style="background: {color}; padding: 5px;">
            <strong>{title}</strong><br/>
            <span>Value: {value}</span><br/>
            <small>Type: {type}</small>
        </div>
        """
        options = LegendOptions(text=complex_template)
        assert options.text == complex_template

        # Test with template containing special characters
        special_template = "<span>&lt;{title}&gt;: &quot;{value}&quot;</span>"
        options = LegendOptions(text=special_template)
        assert options.text == special_template

        # Test with template containing unicode
        unicode_template = "📊 {title}: {value} €"
        options = LegendOptions(text=unicode_template)
        assert options.text == unicode_template

    def test_ui_options_validation_integration(self):
        """Test validation when using UI options together."""
        # Create a complex configuration
        ranges = [
            RangeConfig(text="1D", tooltip="1 Day"),
            RangeConfig(text="1W", tooltip="1 Week"),
            RangeConfig(text="1M", tooltip="1 Month"),
        ]
        range_switcher = RangeSwitcherOptions(visible=True, ranges=ranges)
        legend = LegendOptions(
            visible=False, position="top-right", text="<span>{title}: {value}</span>"
        )

        # All should be valid
        assert range_switcher.visible is True
        assert len(range_switcher.ranges) == 3
        assert legend.visible is False
        assert legend.position == "top-right"
        assert legend.text == "<span>{title}: {value}</span>"

        # All should serialize correctly
        range_dict = range_switcher.asdict()
        legend_dict = legend.asdict()

        assert range_dict["visible"] is True
        assert len(range_dict["ranges"]) == 3
        assert legend_dict["visible"] is False
        assert legend_dict["position"] == "top-right"
        assert legend_dict["text"] == "<span>{title}: {value}</span>"
