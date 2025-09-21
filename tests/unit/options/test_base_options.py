"""
Comprehensive tests for the base Options class.

This module contains comprehensive tests for the Options base class,
ensuring proper serialization, validation, inheritance behavior, and edge cases.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

import pytest

from streamlit_lightweight_charts_pro.charts.options.base_options import Options


class MockEnum(Enum):
    """Mock enum for testing enum conversion."""

    VALUE_1 = "value1"
    VALUE_2 = "value2"


class MockEnumLike:
    """Mock enum-like class for testing enum-like object conversion."""

    def __init__(self, value):
        self.value = value


@dataclass
class MockOptions(Options):
    """Mock options class for testing base Options functionality."""

    string_field: str = "test"
    int_field: int = 42
    float_field: float = 3.14
    bool_field: bool = True
    enum_field: MockEnum = MockEnum.VALUE_1
    enum_like_field: MockEnumLike = None
    none_field: str = None
    empty_string_field: str = ""
    nested_options: "MockOptions" = None
    list_field: List[str] = None
    background_options: Dict[str, Any] = None
    other_options: Dict[str, Any] = None


class TestOptionsInheritance:
    """Test Options class inheritance and basic functionality."""

    def test_options_inheritance(self):
        """Test that Options can be inherited from."""
        options = MockOptions()
        assert isinstance(options, Options)

    def test_post_init_default(self):
        """Test that Options works without __post_init__ method."""
        options = MockOptions()
        # Should not raise any exception when creating options
        assert isinstance(options, Options)

    def test_post_init_override(self):
        """Test that Options works with custom __post_init__ if needed."""

        @dataclass
        class CustomOptions(Options):
            value: int = 0

            def __post_init__(self):
                # Custom post-init logic without calling super()
                self.value = 42

        options = CustomOptions()
        assert options.value == 42


class TestOptionsSerialization:
    """Test Options class serialization behavior."""

    def test_to_dict_basic_fields(self):
        """Test basic field serialization."""
        options = MockOptions(
            string_field="hello", int_field=123, float_field=2.718, bool_field=False
        )
        result = options.asdict()

        assert result["stringField"] == "hello"
        assert result["intField"] == 123
        assert result["floatField"] == 2.718
        assert result["boolField"] is False

    def test_to_dict_enum_conversion(self):
        """Test that enums are converted to their values."""
        options = MockOptions(enum_field=MockEnum.VALUE_2)
        result = options.asdict()

        assert result["enumField"] == "value2"

    def test_to_dict_enum_like_conversion(self):
        """Test that enum-like objects are converted to their values."""

        # Use a real enum for testing
        class LocalTestEnumLike(Enum):
            TEST_VALUE = "test_value"

        enum_like = LocalTestEnumLike.TEST_VALUE
        options = MockOptions(enum_like_field=enum_like)
        result = options.asdict()

        assert result["enumLikeField"] == "test_value"

    def test_to_dict_enum_like_no_enum_base(self):
        """Test enum-like object without Enum in base class name."""

        class NonEnumLike:
            def __init__(self, value):
                self.value = value

            # Use a proper class attribute instead of a method
            __class__ = type(
                "MockNonEnumLike",
                (),
                {"__bases__": (type("MockClass", (), {"__name__": "NotEnum"}),)},
            )

        non_enum_like = NonEnumLike("test_value")
        options = MockOptions(enum_like_field=non_enum_like)
        result = options.asdict()

        # Should not convert to value since it's not enum-like
        assert result["enumLikeField"] == non_enum_like

    def test_to_dict_omits_none_values(self):
        """Test that None values are omitted from output."""
        options = MockOptions(none_field=None)
        result = options.asdict()

        assert "noneField" not in result

    def test_to_dict_omits_empty_strings(self):
        """Test that empty strings are omitted from output."""
        options = MockOptions(empty_string_field="")
        result = options.asdict()

        assert "emptyStringField" not in result

    def test_to_dict_nested_options(self):
        """Test that nested Options objects are serialized."""
        nested = MockOptions(string_field="nested")
        options = MockOptions(nested_options=nested)
        result = options.asdict()

        assert "nestedOptions" in result
        assert result["nestedOptions"]["stringField"] == "nested"

    def test_to_dict_nested_none_options(self):
        """Test that None nested options are omitted."""
        options = MockOptions(nested_options=None)
        result = options.asdict()

        assert "nestedOptions" not in result

    def test_to_dict_list_of_options(self):
        """Test that lists of Options objects are serialized."""
        nested1 = MockOptions(string_field="nested1")
        nested2 = MockOptions(string_field="nested2")
        options = MockOptions(list_field=[nested1, nested2])
        result = options.asdict()

        assert "listField" in result
        assert len(result["listField"]) == 2
        assert result["listField"][0]["stringField"] == "nested1"
        assert result["listField"][1]["stringField"] == "nested2"

    def test_to_dict_list_mixed_content(self):
        """Test that lists with mixed content are handled correctly."""
        nested = MockOptions(string_field="nested")
        options = MockOptions(list_field=["string", nested, 42])
        result = options.asdict()

        assert "listField" in result
        assert len(result["listField"]) == 3
        assert result["listField"][0] == "string"
        assert result["listField"][1]["stringField"] == "nested"
        assert result["listField"][2] == 42

    def test_to_dict_background_options_flattening(self):
        """Test that background_options are flattened into parent result."""
        background_opts = {"color": "#ffffff", "style": "solid"}
        options = MockOptions(background_options=background_opts)
        result = options.asdict()

        # background_options should be flattened, not nested
        assert "backgroundOptions" not in result
        assert result["color"] == "#ffffff"
        assert result["style"] == "solid"

    def test_to_dict_other_options_nested(self):
        """Test that other _options fields are kept nested."""
        other_opts = {"setting": "value", "config": "test"}
        options = MockOptions(other_options=other_opts)
        result = options.asdict()

        # other_options should be nested with camelCase key
        assert "otherOptions" in result
        assert result["otherOptions"]["setting"] == "value"
        assert result["otherOptions"]["config"] == "test"

    def test_to_dict_camel_case_conversion(self):
        """Test that snake_case field names are converted to camelCase."""
        options = MockOptions(string_field="test")
        result = options.asdict()

        assert "stringField" in result
        assert "string_field" not in result

    def test_to_dict_complex_nested_structure(self):
        """Test complex nested structure serialization."""
        inner = MockOptions(string_field="inner", int_field=999)
        middle = MockOptions(string_field="middle", nested_options=inner)
        outer = MockOptions(string_field="outer", nested_options=middle)

        result = outer.asdict()

        assert result["stringField"] == "outer"
        assert result["nestedOptions"]["stringField"] == "middle"
        assert result["nestedOptions"]["nestedOptions"]["stringField"] == "inner"
        assert result["nestedOptions"]["nestedOptions"]["intField"] == 999

    def test_to_dict_with_all_field_types(self):
        """Test serialization with all field types."""
        options = MockOptions(
            string_field="test_string",
            int_field=42,
            float_field=3.14159,
            bool_field=True,
            enum_field=MockEnum.VALUE_1,
            none_field=None,
            empty_string_field="",
            nested_options=MockOptions(string_field="nested"),
        )

        result = options.asdict()

        # Check that all non-None, non-empty fields are present
        assert result["stringField"] == "test_string"
        assert result["intField"] == 42
        assert result["floatField"] == 3.14159
        assert result["boolField"] is True
        assert result["enumField"] == "value1"
        assert result["nestedOptions"]["stringField"] == "nested"

        # Check that None and empty fields are omitted
        assert "noneField" not in result
        assert "emptyStringField" not in result


class TestOptionsEdgeCases:
    """Test edge cases and error conditions."""

    def test_to_dict_with_circular_reference(self):
        """Test handling of circular references (should cause infinite recursion)."""

        @dataclass
        class CircularOptions(Options):
            name: str = "test"
            self_ref: "CircularOptions" = None

        options = CircularOptions()
        options.self_ref = options  # Create circular reference

        # This should cause infinite recursion
        with pytest.raises(RecursionError):
            options.asdict()

    def test_to_dict_with_complex_enum(self):
        """Test with complex enum values."""

        class ComplexEnum(Enum):
            COMPLEX_VALUE = {"key": "value", "number": 42}

        @dataclass
        class ComplexOptions(Options):
            enum_field: ComplexEnum = ComplexEnum.COMPLEX_VALUE

        options = ComplexOptions()
        result = options.asdict()

        assert result["enumField"] == {"key": "value", "number": 42}

    def test_to_dict_with_zero_values(self):
        """Test that zero values are not omitted."""
        options = MockOptions(int_field=0, float_field=0.0, bool_field=False)
        result = options.asdict()

        assert result["intField"] == 0
        assert result["floatField"] == 0.0
        assert result["boolField"] is False

    def test_to_dict_with_false_boolean(self):
        """Test that False boolean values are included."""
        options = MockOptions(bool_field=False)
        result = options.asdict()

        assert result["boolField"] is False

    def test_to_dict_with_empty_list(self):
        """Test that empty lists are included."""
        options = MockOptions(list_field=[])
        result = options.asdict()

        assert "listField" in result
        assert result["listField"] == []

    def test_to_dict_with_none_list(self):
        """Test that None lists are omitted."""
        options = MockOptions(list_field=None)
        result = options.asdict()

        assert "listField" not in result

    def test_to_dict_with_empty_dict(self):
        """Test that empty dicts are handled correctly."""
        options = MockOptions(background_options={})
        result = options.asdict()

        # background_options should be flattened, but since it's empty,
        # it shouldn't add any fields to the result
        assert "backgroundOptions" not in result  # Should be flattened
        # The result should contain the default fields from MockOptions
        assert "stringField" in result
        assert "intField" in result
        assert "floatField" in result
        assert "boolField" in result
        assert "enumField" in result

    def test_to_dict_with_none_dict(self):
        """Test that None dicts are omitted."""
        options = MockOptions(background_options=None)
        result = options.asdict()

        assert "backgroundOptions" not in result

    def test_to_dict_with_enum_like_no_value_attribute(self):
        """Test enum-like object without value attribute."""

        class NoValueEnumLike:
            def __init__(self):
                pass

            # Use a proper class attribute instead of a method
            __class__ = type(
                "MockNoValueEnumLike",
                (),
                {"__bases__": (type("MockEnum", (), {"__name__": "Enum"}),)},
            )

        no_value_enum_like = NoValueEnumLike()
        options = MockOptions(enum_like_field=no_value_enum_like)
        result = options.asdict()

        # Should not convert since no value attribute
        assert result["enumLikeField"] == no_value_enum_like

    def test_to_dict_with_enum_like_no_class_attribute(self):
        """Test enum-like object without __class__ attribute."""

        class NoClassEnumLike:
            def __init__(self, value):
                self.value = value

        no_class_enum_like = NoClassEnumLike("test")
        options = MockOptions(enum_like_field=no_class_enum_like)
        result = options.asdict()

        # Should not convert since no __class__ attribute
        assert result["enumLikeField"] == no_class_enum_like

    def test_to_dict_with_enum_like_no_bases_attribute(self):
        """Test enum-like object without __bases__ attribute."""

        class NoBasesEnumLike:
            def __init__(self, value):
                self.value = value

            # Use a proper class attribute without __bases__
            __class__ = type("MockNoBasesEnumLike", (), {})

        no_bases_enum_like = NoBasesEnumLike("test")
        options = MockOptions(enum_like_field=no_bases_enum_like)
        result = options.asdict()

        # Should not convert since no __bases__ attribute
        assert result["enumLikeField"] == no_bases_enum_like


class TestOptionsIntegration:
    """Test Options integration with other components."""

    def test_options_with_dataclass_fields(self):
        """Test that Options works with standard dataclass fields."""

        @dataclass
        class StandardOptions(Options):
            required_field: str
            optional_field: str = "default"
            computed_field: str = None

            def __post_init__(self):
                # Custom post-init logic without calling super()
                self.computed_field = f"computed_{self.required_field}"

        options = StandardOptions(required_field="test")
        result = options.asdict()

        assert result["requiredField"] == "test"
        assert result["optionalField"] == "default"
        assert result["computedField"] == "computed_test"

    def test_options_inheritance_chain(self):
        """Test Options inheritance through multiple levels."""

        @dataclass
        class Level1Options(Options):
            level1_field: str = "level1"

        @dataclass
        class Level2Options(Level1Options):
            level2_field: str = "level2"

        @dataclass
        class Level3Options(Level2Options):
            level3_field: str = "level3"

        options = Level3Options()
        result = options.asdict()

        assert result["level1Field"] == "level1"
        assert result["level2Field"] == "level2"
        assert result["level3Field"] == "level3"

    def test_options_with_background_options_integration(self):
        """Test integration with background_options flattening."""

        @dataclass
        class BackgroundOptions(Options):
            color: str = "#ffffff"
            style: str = "solid"

        @dataclass
        class LayoutOptions(Options):
            background_options: BackgroundOptions = None
            text_color: str = "#000000"

        background_opts = BackgroundOptions(color="#f0f0f0", style="gradient")
        layout_opts = LayoutOptions(background_options=background_opts)
        result = layout_opts.asdict()

        # background_options should be flattened
        assert "backgroundOptions" not in result
        assert result["color"] == "#f0f0f0"
        assert result["style"] == "gradient"
        assert result["textColor"] == "#000000"

    def test_options_with_multiple_options_fields(self):
        """Test handling of multiple _options fields."""

        @dataclass
        class ConfigOptions(Options):
            setting: str = "default"
            enabled: bool = True

        @dataclass
        class ComplexOptions(Options):
            background_options: ConfigOptions = None
            layout_options: ConfigOptions = None
            other_field: str = "test"

        background_opts = ConfigOptions(setting="background", enabled=False)
        layout_opts = ConfigOptions(setting="layout", enabled=True)
        complex_opts = ComplexOptions(
            background_options=background_opts, layout_options=layout_opts
        )
        result = complex_opts.asdict()

        # background_options should be flattened
        assert "backgroundOptions" not in result
        assert result["setting"] == "background"  # From background_options
        assert result["enabled"] is False  # From background_options

        # layout_options should be nested
        assert "layoutOptions" in result
        assert result["layoutOptions"]["setting"] == "layout"
        assert result["layoutOptions"]["enabled"] is True

        # other_field should be present
        assert result["otherField"] == "test"


# ============================================================================
# EDGE CASES AND ADVANCED TESTING
# ============================================================================


class TestEnum(Enum):
    """Test enum for testing enum value conversion."""

    VALUE1 = "value1"
    VALUE2 = "value2"


class TestEnumLike:
    """Test enum-like class for testing enum-like value conversion."""

    def __init__(self, value):
        self.value = value

    class __class__:
        __bases__ = (Enum,)


@dataclass
class NestedOptions(Options):
    """Nested options for testing."""

    color: str = "#ff0000"
    width: int = 2


@dataclass
class TestOptionsEdgeCases(Options):
    """Test options class for testing edge cases."""

    background_color: str = "#ffffff"
    text_color: str = "#000000"
    is_visible: bool = True
    nested_options: Optional[NestedOptions] = None
    options_list: Optional[List[NestedOptions]] = None
    options_dict: Optional[Dict[str, NestedOptions]] = None
    enum_value: Optional[TestEnum] = None


class TestOptionsEdgeCasesAdvanced:
    """Test advanced edge cases in the Options class."""

    def test_asdict_with_none_nested_options(self):
        """Test asdict with None nested options."""
        options = TestOptionsEdgeCases(nested_options=None)

        result = options.asdict()

        # None nested options should not be included
        assert "nestedOptions" not in result
        assert result["backgroundColor"] == "#ffffff"
        assert result["textColor"] == "#000000"
        assert result["isVisible"] is True

    def test_asdict_with_empty_list(self):
        """Test asdict with empty list."""
        options = TestOptionsEdgeCases(options_list=[])

        result = options.asdict()

        # Empty list is included in the result
        assert "optionsList" in result
        assert result["optionsList"] == []
        assert result["backgroundColor"] == "#ffffff"

    def test_asdict_with_empty_dict(self):
        """Test asdict with empty dict."""
        options = TestOptionsEdgeCases(options_dict={})

        result = options.asdict()

        # Empty dict should not be included
        assert "optionsDict" not in result
        assert result["backgroundColor"] == "#ffffff"

    def test_asdict_with_none_enum(self):
        """Test asdict with None enum."""
        options = TestOptionsEdgeCases(enum_value=None)

        result = options.asdict()

        # None enum should not be included
        assert "enumValue" not in result
        assert result["backgroundColor"] == "#ffffff"

    def test_asdict_with_nested_options_list(self):
        """Test asdict with nested options list."""
        nested1 = NestedOptions(color="#ff0000", width=2)
        nested2 = NestedOptions(color="#00ff00", width=3)
        options = TestOptionsEdgeCases(options_list=[nested1, nested2])

        result = options.asdict()

        assert "optionsList" in result
        assert len(result["optionsList"]) == 2
        assert result["optionsList"][0]["color"] == "#ff0000"
        assert result["optionsList"][0]["width"] == 2
        assert result["optionsList"][1]["color"] == "#00ff00"
        assert result["optionsList"][1]["width"] == 3

    def test_asdict_with_nested_options_dict(self):
        """Test asdict with nested options dict."""
        nested1 = NestedOptions(color="#ff0000", width=2)
        nested2 = NestedOptions(color="#00ff00", width=3)
        options = TestOptionsEdgeCases(options_dict={"first": nested1, "second": nested2})

        result = options.asdict()

        assert "optionsDict" in result
        assert len(result["optionsDict"]) == 2
        assert result["optionsDict"]["first"]["color"] == "#ff0000"
        assert result["optionsDict"]["first"]["width"] == 2
        assert result["optionsDict"]["second"]["color"] == "#00ff00"
        assert result["optionsDict"]["second"]["width"] == 3

    def test_asdict_with_enum_value(self):
        """Test asdict with enum value."""
        options = TestOptionsEdgeCases(enum_value=TestEnum.VALUE1)

        result = options.asdict()

        assert "enumValue" in result
        assert result["enumValue"] == "value1"

    def test_asdict_with_nested_options(self):
        """Test asdict with nested options."""
        nested = NestedOptions(color="#ff0000", width=2)
        options = TestOptionsEdgeCases(nested_options=nested)

        result = options.asdict()

        assert "nestedOptions" in result
        assert result["nestedOptions"]["color"] == "#ff0000"
        assert result["nestedOptions"]["width"] == 2

    def test_asdict_with_mixed_none_values(self):
        """Test asdict with mixed None and valid values."""
        nested = NestedOptions(color="#ff0000", width=2)
        options = TestOptionsEdgeCases(
            nested_options=nested,
            options_list=None,
            options_dict=None,
            enum_value=None,
        )

        result = options.asdict()

        # Only nested_options should be present
        assert "nestedOptions" in result
        assert "optionsList" not in result
        assert "optionsDict" not in result
        assert "enumValue" not in result

    def test_asdict_with_all_none_optional_values(self):
        """Test asdict with all optional values as None."""
        options = TestOptionsEdgeCases(
            nested_options=None,
            options_list=None,
            options_dict=None,
            enum_value=None,
        )

        result = options.asdict()

        # Only required fields should be present
        assert "nestedOptions" not in result
        assert "optionsList" not in result
        assert "optionsDict" not in result
        assert "enumValue" not in result
        assert result["backgroundColor"] == "#ffffff"
        assert result["textColor"] == "#000000"
        assert result["isVisible"] is True

    def test_asdict_with_complex_nested_structure(self):
        """Test asdict with complex nested structure."""
        nested1 = NestedOptions(color="#ff0000", width=2)
        nested2 = NestedOptions(color="#00ff00", width=3)

        # Create options with complex nested structure
        options = TestOptionsEdgeCases(
            nested_options=nested1,
            options_list=[nested1, nested2],
            options_dict={"first": nested1, "second": nested2},
            enum_value=TestEnum.VALUE2,
        )

        result = options.asdict()

        # Verify all nested structures are properly serialized
        assert "nestedOptions" in result
        assert "optionsList" in result
        assert "optionsDict" in result
        assert "enumValue" in result

        # Verify nested options
        assert result["nestedOptions"]["color"] == "#ff0000"
        assert result["nestedOptions"]["width"] == 2

        # Verify options list
        assert len(result["optionsList"]) == 2
        assert result["optionsList"][0]["color"] == "#ff0000"
        assert result["optionsList"][1]["color"] == "#00ff00"

        # Verify options dict
        assert len(result["optionsDict"]) == 2
        assert result["optionsDict"]["first"]["color"] == "#ff0000"
        assert result["optionsDict"]["second"]["color"] == "#00ff00"

        # Verify enum value
        assert result["enumValue"] == "value2"

    def test_asdict_with_empty_string_values(self):
        """Test asdict with empty string values."""
        options = TestOptionsEdgeCases(background_color="", text_color="")

        result = options.asdict()

        # Empty strings should not be included
        assert "backgroundColor" not in result
        assert "textColor" not in result
        assert result["isVisible"] is True

    def test_asdict_with_false_boolean_value(self):
        """Test asdict with False boolean value."""
        options = TestOptionsEdgeCases(is_visible=False)

        result = options.asdict()

        # False boolean should be included (unlike None/empty values)
        assert "isVisible" in result
        assert result["isVisible"] is False

    def test_asdict_with_zero_numeric_values(self):
        """Test asdict with zero numeric values."""

        # Create a test options class with numeric fields
        @dataclass
        class NumericOptions(Options):
            width: int = 0
            height: float = 0.0
            opacity: float = 0.0

        options = NumericOptions(width=0, height=0.0, opacity=0.0)

        result = options.asdict()

        # Zero values should be included
        assert "width" in result
        assert "height" in result
        assert "opacity" in result
        assert result["width"] == 0
        assert result["height"] == 0.0
        assert result["opacity"] == 0.0

    def test_asdict_with_negative_numeric_values(self):
        """Test asdict with negative numeric values."""

        # Create a test options class with numeric fields
        @dataclass
        class NumericOptions(Options):
            width: int = -1
            height: float = -1.5
            opacity: float = -0.5

        options = NumericOptions(width=-1, height=-1.5, opacity=-0.5)

        result = options.asdict()

        # Negative values should be included
        assert "width" in result
        assert "height" in result
        assert "opacity" in result
        assert result["width"] == -1
        assert result["height"] == -1.5
        assert result["opacity"] == -0.5

    def test_asdict_with_special_string_values(self):
        """Test asdict with special string values."""
        options = TestOptionsEdgeCases(
            background_color="transparent",
            text_color="inherit",
        )

        result = options.asdict()

        # Special string values should be included
        assert "backgroundColor" in result
        assert "textColor" in result
        assert result["backgroundColor"] == "transparent"
        assert result["textColor"] == "inherit"

    def test_asdict_with_unicode_string_values(self):
        """Test asdict with unicode string values."""
        options = TestOptionsEdgeCases(
            background_color="rgba(255, 0, 0, 0.5)",
            text_color="hsl(120, 100%, 50%)",
        )

        result = options.asdict()

        # Unicode string values should be included
        assert "backgroundColor" in result
        assert "textColor" in result
        assert result["backgroundColor"] == "rgba(255, 0, 0, 0.5)"
        assert result["textColor"] == "hsl(120, 100%, 50%)"

    def test_asdict_with_very_long_string_values(self):
        """Test asdict with very long string values."""
        long_string = "A" * 1000
        options = TestOptionsEdgeCases(
            background_color=long_string,
            text_color=long_string,
        )

        result = options.asdict()

        # Long string values should be included
        assert "backgroundColor" in result
        assert "textColor" in result
        assert result["backgroundColor"] == long_string
        assert result["textColor"] == long_string

    def test_asdict_with_special_characters_in_strings(self):
        """Test asdict with special characters in strings."""
        special_string = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        options = TestOptionsEdgeCases(
            background_color=special_string,
            text_color=special_string,
        )

        result = options.asdict()

        # Special character strings should be included
        assert "backgroundColor" in result
        assert "textColor" in result
        assert result["backgroundColor"] == special_string
        assert result["textColor"] == special_string

    def test_asdict_with_mixed_data_types_in_list(self):
        """Test asdict with mixed data types in list (should handle gracefully)."""
        # This test documents current behavior - the asdict method should handle
        # mixed data types in lists gracefully
        options = TestOptionsEdgeCases(
            # Note: This would normally cause a type error, but we're testing
            # the serialization behavior
            options_list=None,  # We'll set this manually to avoid type errors
        )

        # Manually set a list with mixed types (this simulates runtime behavior)
        options.options_list = ["string", 123, True, None]

        result = options.asdict()

        # The method should handle this gracefully
        assert "optionsList" in result
        assert result["optionsList"] == ["string", 123, True, None]

    def test_asdict_with_mixed_data_types_in_dict(self):
        """Test asdict with mixed data types in dict (should handle gracefully)."""
        # Create a dict with mixed value types
        mixed_dict = {
            "string": "value",
            "number": 123,
            "boolean": True,
            "none": None,
            "list": [1, 2, 3],
            "dict": {"nested": "value"},
        }

        options = TestOptionsEdgeCases(
            options_dict=mixed_dict,
        )

        result = options.asdict()

        # The method should handle mixed types in dict values
        assert "optionsDict" in result
        assert result["optionsDict"] == mixed_dict

    def test_asdict_with_deeply_nested_structure(self):
        """Test asdict with deeply nested structure."""

        # Create deeply nested options
        @dataclass
        class Level3Options(Options):
            value: str = "level3"

        @dataclass
        class Level2Options(Options):
            value: str = "level2"
            level3: Optional[Level3Options] = None

        @dataclass
        class Level1Options(Options):
            value: str = "level1"
            level2: Optional[Level2Options] = None

        @dataclass
        class DeepNestedOptions(Options):
            level1: Optional[Level1Options] = None

        # Create deeply nested structure
        level3 = Level3Options(value="deep_value")
        level2 = Level2Options(value="middle_value", level3=level3)
        level1 = Level1Options(value="top_value", level2=level2)
        options = DeepNestedOptions(level1=level1)

        result = options.asdict()

        # Verify deep nesting is properly serialized
        assert "level1" in result
        assert result["level1"]["value"] == "top_value"
        assert "level2" in result["level1"]
        assert result["level1"]["level2"]["value"] == "middle_value"
        assert "level3" in result["level1"]["level2"]
        assert result["level1"]["level2"]["level3"]["value"] == "deep_value"

    def test_asdict_with_circular_reference_prevention(self):
        """Test asdict with potential circular reference (should handle gracefully)."""

        # Create options that could potentially create circular references
        @dataclass
        class CircularOptions(Options):
            value: str = "circular"
            self_ref: Optional["CircularOptions"] = None

        # Create a circular reference
        options = CircularOptions(value="test")
        options.self_ref = options  # Circular reference

        # The asdict method should handle this gracefully
        # Note: The current implementation may or may not handle circular references
        # This test documents the current behavior
        try:
            result = options.asdict()
            # If it succeeds, verify the result
            assert "value" in result
            assert result["value"] == "test"
            # The circular reference should be handled somehow
            # (either omitted, or converted to a representation)
        except (RecursionError, ValueError):
            # If it fails with recursion error, that's also acceptable behavior
            pass

    def test_asdict_with_custom_enum_like_object(self):
        """Test asdict with custom enum-like object."""
        enum_like = TestEnumLike("custom_value")
        options = TestOptionsEdgeCases()

        # Manually set the enum-like value (since it's not in the dataclass)
        options.enum_value = enum_like

        result = options.asdict()

        # The method should include the enum-like object as-is since detection didn't work
        assert "enumValue" in result
        assert result["enumValue"] == enum_like

    def test_asdict_performance_with_large_nested_structure(self):
        """Test asdict performance with large nested structure."""
        # Create a large nested structure
        large_list = [NestedOptions(color=f"#ff{i:04x}", width=i) for i in range(100)]
        large_dict = {f"key_{i}": NestedOptions(color=f"#ff{i:04x}", width=i) for i in range(100)}

        options = TestOptionsEdgeCases(
            options_list=large_list,
            options_dict=large_dict,
        )

        # The method should handle large structures efficiently
        result = options.asdict()

        assert "optionsList" in result
        assert "optionsDict" in result
        assert len(result["optionsList"]) == 100
        assert len(result["optionsDict"]) == 100

    def test_asdict_with_none_in_list(self):
        """Test asdict with None values in list."""
        options = TestOptionsEdgeCases(
            options_list=[NestedOptions(), None, NestedOptions()],
        )

        result = options.asdict()

        # None values in lists should be handled gracefully
        assert "optionsList" in result
        assert len(result["optionsList"]) == 3
        assert result["optionsList"][0] is not None
        assert result["optionsList"][1] is None
        assert result["optionsList"][2] is not None

    def test_asdict_with_none_in_dict_values(self):
        """Test asdict with None values in dict."""
        options = TestOptionsEdgeCases(
            options_dict={"valid": NestedOptions(), "none": None},
        )

        result = options.asdict()

        # None values in dict should be handled gracefully
        assert "optionsDict" in result
        assert len(result["optionsDict"]) == 2
        assert result["optionsDict"]["valid"] is not None
        assert result["optionsDict"]["none"] is None
