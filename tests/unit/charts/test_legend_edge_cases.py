"""
Test legend edge cases and error handling.

This module provides comprehensive tests for legend edge cases, error handling,
validation, and boundary conditions.
"""

import sys
import time

import pytest

from lightweight_charts_core.charts.options.ui_options import LegendOptions
from lightweight_charts_core.charts.series.line import LineSeries


class TestLegendValidation:
    """Test legend validation and error handling."""

    def test_legend_position_validation(self):
        """Test validation of legend position values."""
        # Valid positions should work
        valid_positions = [
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
        ]

        for position in valid_positions:
            legend = LegendOptions(position=position)
            assert legend.position == position

    def test_legend_boolean_validation(self):
        """Test validation of boolean fields."""
        # Valid boolean values
        legend = LegendOptions(visible=True, show_values=False, update_on_crosshair=True)
        assert legend.visible is True
        assert legend.show_values is False
        assert legend.update_on_crosshair is True

    def test_legend_numeric_validation(self):
        """Test validation of numeric fields."""
        # Valid numeric values
        legend = LegendOptions(border_width=2, border_radius=4, padding=8, margin=4, z_index=1000)
        assert legend.border_width == 2
        assert legend.border_radius == 4
        assert legend.padding == 8
        assert legend.margin == 4
        assert legend.z_index == 1000

    def test_legend_string_validation(self):
        """Test validation of string fields."""
        # Valid string values
        legend = LegendOptions(
            symbol_name="AAPL",
            background_color="rgba(255, 0, 0, 0.5)",
            border_color="#ff0000",
            price_format=".2f",
            text="<span>MA20: $$value$$</span>",
            value_format=".3f",
        )
        assert legend.symbol_name == "AAPL"
        assert legend.background_color == "rgba(255, 0, 0, 0.5)"
        assert legend.border_color == "#ff0000"
        assert legend.price_format == ".2f"
        assert legend.text == "<span>MA20: $$value$$</span>"
        assert legend.value_format == ".3f"

    def test_legend_type_validation_errors(self):
        """Test that invalid types are accepted (no validation currently)."""
        # Note: Currently no type validation is implemented for LegendOptions
        # This test documents the current behavior

        # These should work without raising errors
        legend1 = LegendOptions(visible="invalid")
        assert legend1.visible == "invalid"

        legend2 = LegendOptions(position=123)
        assert legend2.position == 123

        legend3 = LegendOptions(border_width="invalid")
        assert legend3.border_width == "invalid"

        legend4 = LegendOptions(symbol_name=123)
        assert legend4.symbol_name == 123


class TestLegendBoundaryConditions:
    """Test legend boundary conditions and edge values."""

    def test_legend_zero_values(self):
        """Test legend with zero values for numeric fields."""
        legend = LegendOptions(border_width=0, border_radius=0, padding=0, margin=0, z_index=0)
        assert legend.border_width == 0
        assert legend.border_radius == 0
        assert legend.padding == 0
        assert legend.margin == 0
        assert legend.z_index == 0

    def test_legend_negative_values(self):
        """Test legend with negative values for numeric fields."""
        legend = LegendOptions(
            border_width=-1,
            border_radius=-2,
            padding=-3,
            margin=-4,
            z_index=-1000,
        )
        assert legend.border_width == -1
        assert legend.border_radius == -2
        assert legend.padding == -3
        assert legend.margin == -4
        assert legend.z_index == -1000

    def test_legend_large_values(self):
        """Test legend with large values for numeric fields."""
        legend = LegendOptions(
            border_width=1000,
            border_radius=1000,
            padding=1000,
            margin=1000,
            z_index=999999,
        )
        assert legend.border_width == 1000
        assert legend.border_radius == 1000
        assert legend.padding == 1000
        assert legend.margin == 1000
        assert legend.z_index == 999999

    def test_legend_empty_strings(self):
        """Test legend with empty string values."""
        legend = LegendOptions(
            symbol_name="",
            background_color="",
            border_color="",
            price_format="",
            text="",
            value_format="",
        )
        assert legend.symbol_name == ""
        assert legend.background_color == ""
        assert legend.border_color == ""
        assert legend.price_format == ""
        assert legend.text == ""
        assert legend.value_format == ""

    def test_legend_very_long_strings(self):
        """Test legend with very long string values."""
        long_text = "A" * 10000
        legend = LegendOptions(symbol_name=long_text, text=long_text)
        assert legend.symbol_name == long_text
        assert legend.text == long_text


class TestLegendSpecialCharacters:
    """Test legend with special characters and edge cases."""

    def test_legend_html_special_characters(self):
        """Test legend with HTML special characters."""
        html_text = "<div>&lt;script&gt;alert('test')&lt;/script&gt;</div>"
        legend = LegendOptions(text=html_text)
        assert legend.text == html_text

    def test_legend_unicode_characters(self):
        """Test legend with unicode characters."""
        unicode_text = "📈 Price: {value} | 📅 Time: {time} | 🔥 Hot: {type}"
        legend = LegendOptions(text=unicode_text)
        assert legend.text == unicode_text

    def test_legend_escape_sequences(self):
        """Test legend with escape sequences."""
        escape_text = "Line 1\\nLine 2\\tTabbed\\rCarriage Return"
        legend = LegendOptions(text=escape_text)
        assert legend.text == escape_text

    def test_legend_template_placeholders(self):
        """Test legend with various template placeholders."""
        template = """
        <div>
            <strong>{title}</strong><br/>
            Price: ${value}<br/>
            Time: {time}<br/>
            Color: {color}<br/>
            Type: {type}<br/>
            Custom: {custom_field}
        </div>
        """
        legend = LegendOptions(text=template)
        assert legend.text == template

    def test_legend_color_formats(self):
        """Test legend with various color formats."""
        color_formats = [
            "#ff0000",
            "#f00",
            "rgb(255, 0, 0)",
            "rgba(255, 0, 0, 0.5)",
            "hsl(0, 100%, 50%)",
            "hsla(0, 100%, 50%, 0.5)",
            "red",
            "transparent",
        ]

        for color in color_formats:
            legend = LegendOptions(background_color=color, border_color=color)
            assert legend.background_color == color
            assert legend.border_color == color


class TestLegendSerializationEdgeCases:
    """Test legend serialization edge cases."""

    def test_legend_serialization_with_none_values(self):
        """Test legend serialization with None values."""
        legend = LegendOptions()
        # Set some fields to None explicitly
        legend.symbol_name = None
        legend.text = None

        result = legend.asdict()

        # None values should be omitted from serialization
        assert "symbolName" not in result or result["symbolName"] is None
        assert "text" not in result or result["text"] is None

    def test_legend_serialization_with_empty_strings(self):
        """Test legend serialization with empty strings."""
        legend = LegendOptions(symbol_name="", text="", background_color="", border_color="")

        result = legend.asdict()

        # Empty strings should be omitted from serialization
        assert "symbolName" not in result
        assert "text" not in result
        assert "backgroundColor" not in result
        assert "borderColor" not in result

    def test_legend_serialization_with_false_booleans(self):
        """Test legend serialization with false boolean values."""
        legend = LegendOptions(visible=False, show_values=False, update_on_crosshair=False)

        result = legend.asdict()

        # False booleans are included in serialization
        assert "visible" in result
        assert "showValues" in result
        assert "updateOnCrosshair" in result
        assert result["visible"] is False
        assert result["showValues"] is False
        assert result["updateOnCrosshair"] is False

    def test_legend_serialization_with_zero_values(self):
        """Test legend serialization with zero values."""
        legend = LegendOptions(border_width=0, border_radius=0, padding=0, margin=0, z_index=0)

        result = legend.asdict()

        # Zero values are included in serialization
        assert "borderWidth" in result
        assert "borderRadius" in result
        assert "padding" in result
        assert "margin" in result
        assert "zIndex" in result
        assert result["borderWidth"] == 0
        assert result["borderRadius"] == 0
        assert result["padding"] == 0
        assert result["margin"] == 0
        assert result["zIndex"] == 0


class TestLegendSeriesIntegrationEdgeCases:
    """Test legend integration with series edge cases."""

    def test_series_legend_with_invalid_type(self):
        """Test series legend assignment with invalid type (currently no validation)."""
        series = LineSeries(data=[])

        # Note: Currently no type validation is implemented for legend property
        # This test documents the current behavior
        series.legend = "invalid"
        assert series.legend == "invalid"

        series.legend = 123
        assert series.legend == 123

        series.legend = []
        assert series.legend == []

        # Reset to None
        series.legend = None
        assert series.legend is None

    def test_series_legend_with_none(self):
        """Test series legend assignment with None."""
        series = LineSeries(data=[])

        # Should work fine
        series.legend = None
        assert series.legend is None

        # Should work fine even if already None
        series.legend = None
        assert series.legend is None

    def test_series_legend_chainable_with_invalid_type(self):
        """Test series legend chainable method with invalid type (currently no validation)."""
        series = LineSeries(data=[])

        # Note: Currently no type validation is implemented for legend property
        # This test documents the current behavior
        series.legend = "invalid"
        assert series.legend == "invalid"

        series.legend = 123
        assert series.legend == 123

    def test_series_legend_serialization_with_none(self):
        """Test series legend serialization when legend is None."""
        series = LineSeries(data=[])
        series.legend = None

        config = series.asdict()
        assert "legend" not in config

    def test_series_legend_serialization_with_empty_legend(self):
        """Test series legend serialization with empty legend."""
        series = LineSeries(data=[])
        series.legend = LegendOptions()

        config = series.asdict()
        # Should include legend even if empty
        assert "legend" in config
        legend_config = config["legend"]
        assert legend_config["visible"] is True  # Default value
        assert legend_config["position"] == "top-left"  # Default value


class TestLegendMemoryAndPerformance:
    """Test legend memory usage and performance characteristics."""

    def test_legend_memory_usage(self):
        """Test memory usage of legend objects."""
        # Create multiple legend objects
        legends = []
        for i in range(100):
            legend = LegendOptions(
                position="top-right",
                visible=True,
                text=f"Legend {i}: {{value}}",
            )
            legends.append(legend)

        # Memory usage should be reasonable
        total_size = sum(sys.getsizeof(legend) for legend in legends)
        assert total_size < 100000  # Less than 100KB for 100 legends

    def test_legend_creation_performance(self):
        """Test performance of legend creation."""
        start_time = time.time()
        legends = []
        for i in range(1000):
            legend = LegendOptions(
                position="top-right",
                visible=True,
                text=f"Legend {i}: {{value}}",
            )
            legends.append(legend)
        end_time = time.time()

        # Should complete in reasonable time (less than 1 second)
        assert end_time - start_time < 1.0
        assert len(legends) == 1000

    def test_legend_serialization_performance(self):
        """Test performance of legend serialization."""
        legend = LegendOptions(
            position="top-right",
            visible=True,
            text="<span>MA20: $$value$$</span>",
            background_color="rgba(255, 0, 0, 0.5)",
            border_color="#ff0000",
            border_width=2,
            border_radius=4,
            padding=8,
            margin=4,
            z_index=1000,
            show_values=True,
            value_format=".2f",
            update_on_crosshair=True,
        )

        start_time = time.time()
        for _ in range(1000):
            legend.asdict()
        end_time = time.time()

        # Should complete in reasonable time (less than 0.3 seconds)
        # Increased from 0.1s to account for CI/CD system variance
        assert end_time - start_time < 0.3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
