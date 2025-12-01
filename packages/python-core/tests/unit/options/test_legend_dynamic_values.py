"""Test the new dynamic legend value options."""

import pytest
from lightweight_charts_core.charts.options.ui_options import LegendOptions


class TestLegendOptionsNewFeatures:
    """Test the new dynamic legend value features."""

    def test_default_dynamic_values(self):
        """Test that default values for dynamic features are correct."""
        options = LegendOptions()
        assert options.show_values is True
        assert options.value_format == ".2f"
        assert options.update_on_crosshair is True

    def test_custom_dynamic_values(self):
        """Test setting custom dynamic value options."""
        options = LegendOptions(show_values=False, value_format=".4f", update_on_crosshair=False)
        assert options.show_values is False
        assert options.value_format == ".4f"
        assert options.update_on_crosshair is False

    def test_chainable_dynamic_methods(self):
        """Test that new fields support chainable methods."""
        options = (
            LegendOptions()
            .set_show_values(True)
            .set_value_format(".3f")
            .set_update_on_crosshair(False)
        )

        assert options.show_values is True
        assert options.value_format == ".3f"
        assert options.update_on_crosshair is False

    def test_to_dict_includes_new_fields(self):
        """Test that serialization includes new fields."""
        options = LegendOptions(show_values=False, value_format=".1f", update_on_crosshair=False)

        result = options.asdict()
        assert "showValues" in result
        assert "valueFormat" in result
        assert "updateOnCrosshair" in result
        assert result["showValues"] is False
        assert result["valueFormat"] == ".1f"
        assert result["updateOnCrosshair"] is False

    def test_combination_with_existing_options(self):
        """Test that new options work with existing ones."""
        options = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(255, 0, 0, 0.5)",
            show_values=True,
            value_format=".3f",
            update_on_crosshair=True,
            text="Custom: {title} = {value}",
        )

        assert options.visible is True
        assert options.position == "top-left"
        assert options.background_color == "rgba(255, 0, 0, 0.5)"
        assert options.show_values is True
        assert options.value_format == ".3f"
        assert options.update_on_crosshair is True
        assert "Custom:" in options.text

    def test_value_format_validation(self):
        """Test value format validation."""
        # These should work
        valid_formats = [".2f", ".0f", ".4f", ".10f"]
        for fmt in valid_formats:
            options = LegendOptions(value_format=fmt)
            assert options.value_format == fmt

    def test_chainable_method_return_type(self):
        """Test that chainable methods return the correct type."""
        options = LegendOptions()
        result = options.set_show_values(False)
        assert isinstance(result, LegendOptions)
        assert result.show_values is False

    def test_repr_includes_new_fields(self):
        """Test that string representation includes new fields."""
        options = LegendOptions(show_values=False, value_format=".4f", update_on_crosshair=False)

        repr_str = repr(options)
        assert "show_values=False" in repr_str
        assert "value_format='.4f'" in repr_str
        assert "update_on_crosshair=False" in repr_str

    def test_equality_with_new_fields(self):
        """Test equality comparison includes new fields."""
        options1 = LegendOptions(show_values=True, value_format=".2f")
        options2 = LegendOptions(show_values=True, value_format=".2f")
        options3 = LegendOptions(show_values=False, value_format=".2f")
        options4 = LegendOptions(show_values=True, value_format=".3f")

        assert options1 == options2
        assert options1 != options3
        assert options1 != options4

    def test_copy_preserves_new_fields(self):
        """Test that copying preserves new fields."""
        options = LegendOptions(show_values=False, value_format=".5f", update_on_crosshair=False)

        # Test dict conversion and back (similar to copy)
        data = options.asdict()
        assert data["showValues"] is False
        assert data["valueFormat"] == ".5f"
        assert data["updateOnCrosshair"] is False


class TestLegendOptionsDocumentation:
    """Test that documentation reflects new features."""

    def test_docstring_mentions_dynamic_values(self):
        """Test that class docstring mentions dynamic value features."""
        docstring = LegendOptions.__doc__
        assert "Dynamic Value Display" in docstring
        assert "show_values" in docstring
        assert "value_format" in docstring
        assert "update_on_crosshair" in docstring

    def test_docstring_has_examples(self):
        """Test that docstring includes examples of new features."""
        docstring = LegendOptions.__doc__
        assert "LegendOptions(show_values=True" in docstring


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
