"""Base Options update() method tests - Key handling and nested updates.

This module tests the update() method functionality including:
- CamelCase and snake_case key conversion
- Field lookup fallback logic
- Nested Options creation and updates
- Dict[str, Options] handling
- Invalid field handling
- None value skipping
"""

# Standard Imports
from dataclasses import dataclass

# Third Party Imports
import pytest

# Local Imports
from lightweight_charts_core.charts.options.base_options import Options

# =============================================================================
# Test Data Classes
# =============================================================================


@dataclass
class SimpleOptions(Options):
    """Simple options for testing."""

    color: str = "#ff0000"
    width: int = 2


@dataclass
class NestedOptions(Options):
    """Options with nested Options field."""

    name: str = "test"
    simple_options: SimpleOptions | None = None


@dataclass
class OptionsWithDict(Options):
    """Options with Dict[str, Options] field."""

    name: str = "test"
    options_dict: dict[str, SimpleOptions] | None = None


@dataclass
class EdgeCaseOptions(Options):
    """Options for testing edge cases."""

    name: str = "test"
    color: str = "#ff0000"


# =============================================================================
# Update Method Core Tests
# =============================================================================


class TestUpdateBasicFunctionality:
    """Test basic update() method functionality."""

    def test_update_simple_fields(self):
        """Test updating simple fields."""
        options = SimpleOptions()

        result = options.update({"color": "#00ff00", "width": 5})

        assert result is options  # Method chaining
        assert options.color == "#00ff00"
        assert options.width == 5

    def test_update_with_camel_case_keys(self):
        """Test update with camelCase keys."""
        options = EdgeCaseOptions()

        options.update({"backgroundColor": "test"})  # Will convert to background_color

        # Should handle camelCase conversion

    def test_update_with_snake_case_key_directly(self):
        """Test update() with snake_case key."""
        options = NestedOptions()

        # Update with snake_case key that matches field name directly
        options.update({"simple_options": {"color": "#00ff00"}})

        assert options.simple_options is not None
        assert options.simple_options.color == "#00ff00"

    def test_update_with_none_values_skipped(self):
        """Test that None values are skipped in update."""
        options = SimpleOptions(color="#ff0000", width=2)

        # Update with None values - should be skipped
        options.update({"color": None, "width": None})

        # Values should remain unchanged
        assert options.color == "#ff0000"
        assert options.width == 2


class TestUpdateKeyLookup:
    """Test update() key lookup and conversion logic."""

    def test_update_with_exact_field_name_match(self):
        """Test that exact field name match works."""

        @dataclass
        class TestOptions(Options):
            """Options with snake_case field."""

            my_field_name: str = "original"

        options = TestOptions()

        # Update with exact field name
        options.update({"my_field_name": "updated"})

        assert options.my_field_name == "updated"

    def test_update_with_unusual_field_name_triggers_fallback(self):
        """Test camelCase conversion fails but original key matches."""

        @dataclass
        class TestOptions(Options):
            """Options with unusual field name."""

            ALLCAPS: str = "original"

        options = TestOptions()

        # Update with exact field name (ALLCAPS)
        options.update({"ALLCAPS": "updated"})

        assert options.ALLCAPS == "updated"

    def test_update_with_both_camel_and_snake_keys(self):
        """Test update with mix of camelCase and snake_case keys."""
        options = EdgeCaseOptions()

        # Update with both styles
        options.update({"name": "direct_snake", "color": "#00ff00"})

        assert options.name == "direct_snake"
        assert options.color == "#00ff00"


class TestUpdateInvalidFields:
    """Test update() with invalid fields."""

    def test_update_with_invalid_field_after_camel_conversion(self):
        """Test update() with field that doesn't exist after conversion."""
        options = SimpleOptions()

        # Keys that don't exist - should be silently ignored
        options.update({"nonExistentField": "value", "another_invalid": "value"})

        # Original values should be unchanged
        assert options.color == "#ff0000"
        assert options.width == 2

    def test_update_with_mixed_valid_invalid_keys(self):
        """Test update with mix of valid and invalid keys."""
        options = SimpleOptions()

        # Mix of valid and invalid keys
        options.update(
            {
                "color": "#00ff00",
                "invalid_key": "ignored",
                "width": 5,
                "another_invalid": 123,
            }
        )

        # Valid updates should be applied
        assert options.color == "#00ff00"
        assert options.width == 5


class TestUpdateNonDataclassAttributes:
    """Test update() with attributes that aren't dataclass fields."""

    def test_update_with_key_existing_as_attribute_not_field(self):
        """Test key exists as attribute but not in dataclass fields."""
        options = EdgeCaseOptions()

        # Add a non-dataclass attribute
        options.custom_attr = "custom_value"

        # Try to update it
        options.update({"customAttr": "new_value"})

        # Should NOT be updated (not a dataclass field)
        assert options.custom_attr == "custom_value"

    def test_update_with_property_attribute(self):
        """Test attribute exists as property but not as field."""

        @dataclass
        class OptionsWithProperty(Options):
            """Options with a property."""

            _value: str = "test"

            @property
            def computed_value(self):
                """Computed property."""
                return f"computed_{self._value}"

        options = OptionsWithProperty()

        # Try to update the property (should be ignored)
        options.update({"computed_value": "new_value"})

        # Property should remain unchanged
        assert options.computed_value == "computed_test"

    def test_update_with_method_attribute(self):
        """Test attribute is a method, not a field."""

        @dataclass
        class OptionsWithMethod(Options):
            """Options with a method."""

            name: str = "test"

            def my_method(self):
                """A method."""
                return "method_result"

        options = OptionsWithMethod()

        # Try to update the method (should be ignored)
        options.update({"my_method": "not_a_method"})

        # Method should remain unchanged
        assert callable(options.my_method)
        assert options.my_method() == "method_result"


class TestUpdateNestedOptions:
    """Test update() with nested Options objects."""

    def test_update_with_nested_options_creation(self):
        """Test update() with nested Options when current value is None."""
        options = NestedOptions()
        assert options.simple_options is None

        # Update with nested dict - should create SimpleOptions instance
        options.update({"simple_options": {"color": "#00ff00", "width": 3}})

        assert options.simple_options is not None
        assert options.simple_options.color == "#00ff00"
        assert options.simple_options.width == 3

    def test_update_with_nested_options_existing(self):
        """Test update() with nested Options when current value exists."""
        options = NestedOptions(simple_options=SimpleOptions(color="#ff0000", width=2))

        # Update existing nested options
        options.update({"simple_options": {"color": "#0000ff"}})

        assert options.simple_options is not None
        assert options.simple_options.color == "#0000ff"
        # Width should remain unchanged
        assert options.simple_options.width == 2

    def test_update_with_dict_of_options(self):
        """Test update() with Dict[str, Options]."""
        options = OptionsWithDict()

        # Update with dict containing Options-like dicts
        options.update(
            {
                "options_dict": {
                    "first": {"color": "#ff0000", "width": 1},
                    "second": {"color": "#00ff00", "width": 2},
                }
            }
        )

        assert options.options_dict is not None
        assert "first" in options.options_dict
        assert "second" in options.options_dict

    def test_update_complex_nested_structure(self):
        """Test update with complex nested structure."""
        options = OptionsWithDict()

        options.update(
            {
                "name": "updated",
                "options_dict": {
                    "first": {"color": "#ff0000", "width": 1},
                    "second": {"color": "#00ff00", "width": 2},
                },
            }
        )

        assert options.name == "updated"
        assert options.options_dict is not None
        assert len(options.options_dict) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
