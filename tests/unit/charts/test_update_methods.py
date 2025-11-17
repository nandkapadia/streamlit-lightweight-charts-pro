"""
Tests for update methods in Options and Series base classes.

This module tests the dictionary-based update functionality for both
Options and Series classes, including nested object handling.
"""

# pylint: disable=no-member,protected-access

from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.type_definitions.enums import LineStyle


class TestOptionsUpdateMethod:
    """Test cases for Options.update() method."""

    def test_simple_property_updates(self):
        """Test updating simple properties."""
        options = LineOptions()

        # Update simple properties
        result = options.update(
            {"color": "#ff0000", "line_width": 3, "line_style": LineStyle.DASHED},
        )

        assert result is options  # Method chaining
        assert options.color == "#ff0000"
        assert options.line_width == 3
        assert options.line_style == LineStyle.DASHED

    def test_camel_case_key_support(self):
        """Test that camelCase keys are converted to snake_case."""
        options = LineOptions()

        result = options.update({"lineWidth": 5, "lineStyle": LineStyle.DOTTED})

        assert result is options
        assert options.line_width == 5
        assert options.line_style == LineStyle.DOTTED

    def test_none_values_ignored(self):
        """Test that None values are ignored for method chaining."""
        options = LineOptions(color="#ff0000", line_width=2)
        original_color = options.color
        original_width = options.line_width

        result = options.update({"color": None, "line_width": None, "line_style": LineStyle.DASHED})

        assert result is options
        assert options.color == original_color  # Unchanged
        assert options.line_width == original_width  # Unchanged
        assert options.line_style == LineStyle.DASHED  # Changed

    def test_invalid_field_ignored(self):
        """Test that invalid fields are ignored instead of raising ValueError."""
        options = LineOptions()

        # Invalid fields should be ignored, not raise errors
        result = options.update({"invalid_field": "value"})

        assert result is options  # Method chaining still works
        # The options object should remain unchanged
        assert options.color == "#2196f3"  # Default value

    def test_mixed_valid_invalid_fields(self):
        """Test handling of mixed valid and invalid fields."""
        options = LineOptions()

        # Mixed valid and invalid fields - valid fields should be updated, invalid ones ignored
        result = options.update({"color": "#ff0000", "invalid_field": "value"})

        assert result is options  # Method chaining still works
        assert options.color == "#ff0000"  # Valid field was updated
        # Invalid field was ignored, other fields remain unchanged
        assert options.line_width == 3  # Default value

    def test_method_chaining(self):
        """Test method chaining with update."""
        options = LineOptions()

        result = (
            options.update({"color": "#ff0000"})
            .update({"line_width": 3})
            .update({"line_style": LineStyle.DASHED})
        )

        assert result is options
        assert options.color == "#ff0000"
        assert options.line_width == 3
        assert options.line_style == LineStyle.DASHED


class TestSeriesUpdateMethod:
    """Test cases for Series.update() method."""

    def test_simple_property_updates(self):
        """Test updating simple series properties."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)

        result = series.update({"visible": False, "price_scale_id": "left", "pane_id": 1})

        assert result is series  # Method chaining
        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1

    def test_nested_options_updates(self):
        """Test updating nested Options objects."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)

        result = series.update(
            {"line_options": {"color": "#ff0000", "line_width": 3, "line_style": LineStyle.DASHED}},
        )

        assert result is series
        assert series.line_options.color == "#ff0000"
        assert series.line_options.line_width == 3
        assert series.line_options.line_style == LineStyle.DASHED

    def test_camel_case_key_support(self):
        """Test that camelCase keys are converted to snake_case."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)

        result = series.update({"priceScaleId": "right", "paneId": 2})

        assert result is series
        assert series.price_scale_id == "right"
        assert series.pane_id == 2

    def test_none_values_ignored(self):
        """Test that None values are ignored for method chaining."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data, visible=True, price_scale_id="right")
        original_visible = series._visible
        original_scale_id = series.price_scale_id

        result = series.update({"visible": None, "price_scale_id": None, "pane_id": 1})

        assert result is series
        assert series._visible == original_visible  # Unchanged
        assert series.price_scale_id == original_scale_id  # Unchanged
        assert series.pane_id == 1  # Changed

    def test_invalid_attribute_ignored(self):
        """Test that invalid attributes are ignored instead of raising ValueError."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)

        # Invalid attributes should be ignored, not raise errors
        result = series.update({"invalid_attr": "value"})

        assert result is series  # Method chaining still works
        # The series object should remain unchanged
        assert series._visible is True  # Default value

    def test_method_chaining(self):
        """Test method chaining with update."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)

        result = (
            series.update({"visible": False})
            .update({"price_scale_id": "left"})
            .update({"pane_id": 1})
        )

        assert result is series
        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1

    def test_complex_nested_updates(self):
        """Test complex nested updates with multiple levels."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)

        result = series.update(
            {
                "visible": False,
                "price_scale_id": "left",
                "line_options": {
                    "color": "#ff0000",
                    "line_width": 3,
                    "line_style": LineStyle.DASHED,
                },
            },
        )

        assert result is series
        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.line_options.color == "#ff0000"
        assert series.line_options.line_width == 3
        assert series.line_options.line_style == LineStyle.DASHED


class TestUpdateMethodIntegration:
    """Integration tests for update methods."""

    def test_options_serialization_after_update(self):
        """Test that updated options serialize correctly."""
        options = LineOptions()
        options.update({"color": "#ff0000", "line_width": 3, "line_style": LineStyle.DASHED})

        result = options.asdict()

        assert result["color"] == "#ff0000"
        assert result["lineWidth"] == 3
        assert result["lineStyle"] == LineStyle.DASHED.value

    def test_series_serialization_after_update(self):
        """Test that updated series serialize correctly."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)
        series.update(
            {
                "visible": False,
                "price_scale_id": "left",
                "line_options": {"color": "#ff0000", "line_width": 3},
            },
        )

        result = series.asdict()

        # Series options are now in the options object
        assert result["options"]["visible"] is False
        assert result["options"]["priceScaleId"] == "left"
        assert result["options"]["lineOptions"]["color"] == "#ff0000"
        assert result["options"]["lineOptions"]["lineWidth"] == 3

    def test_update_preserves_existing_values(self):
        """Test that update doesn't overwrite unspecified values."""
        options = LineOptions(color="#ff0000", line_width=2, line_style=LineStyle.SOLID)

        # Only update line_width
        options.update({"line_width": 5})

        assert options.color == "#ff0000"  # Preserved
        assert options.line_width == 5  # Updated
        assert options.line_style == LineStyle.SOLID  # Preserved

    def test_update_with_empty_dict(self):
        """Test that update with empty dict doesn't change anything."""
        options = LineOptions(color="#ff0000", line_width=2)
        original_color = options.color
        original_width = options.line_width

        result = options.update({})

        assert result is options
        assert options.color == original_color
        assert options.line_width == original_width


class TestUpdateMethodEdgeCases:
    """Edge cases for update methods."""

    def test_update_with_enum_values(self):
        """Test updating with enum values."""
        options = LineOptions()

        options.update({"line_style": LineStyle.DASHED, "line_type": "curved"})  # String enum value

        assert options.line_style == LineStyle.DASHED
        # Note: line_type might not exist in LineOptions, this is just for testing

    def test_update_with_complex_types(self):
        """Test updating with complex types."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)

        # Test with list (should be handled gracefully)
        series.update({"pane_id": [1, 2, 3]})  # This should work or raise appropriate error

        # Test with dict for non-options attribute
        series.update(
            {"pane_id": {"nested": "value"}},
        )  # This should work or raise appropriate error

    def test_update_with_special_characters(self):
        """Test updating with special characters in keys."""
        options = LineOptions()

        # Test with keys that have special characters (should be handled gracefully)
        # These should be ignored instead of raising errors
        result = options.update({"invalid-key": "value"})
        assert result is options  # Method chaining still works

        result = options.update({"invalid.key": "value"})
        assert result is options  # Method chaining still works

    def test_update_with_unicode(self):
        """Test updating with unicode characters."""
        options = LineOptions()

        # Test with unicode in values
        options.update({"color": "🔴"})  # Unicode emoji

        assert options.color == "🔴"
