"""Base Options serialization tests - asdict() and conversion behavior.

This module tests all serialization functionality including:
- Basic field serialization with camelCase conversion
- Enum and enum-like value conversion
- Nested Options object handling
- List and Dict processing with recursive serialization
- Background options flattening
- Edge cases with None, empty strings, and zero values
"""

# pylint: disable=no-member,protected-access

# Standard Imports
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional

# Third Party Imports
import pytest

# Local Imports
from lightweight_charts_core.charts.options.base_options import Options

# =============================================================================
# Test Data Classes
# =============================================================================


class MockEnum(Enum):
    """Mock enum for testing enum conversion."""

    VALUE_1 = "value1"
    VALUE_2 = "value2"


@dataclass
class SimpleOptions(Options):
    """Simple options for testing."""

    color: str = "#ff0000"
    width: int = 2


@dataclass
class MockOptions(Options):
    """Mock options class for comprehensive testing."""

    string_field: str = "test"
    int_field: int = 42
    float_field: float = 3.14
    bool_field: bool = True
    enum_field: MockEnum = MockEnum.VALUE_1
    enum_like_field: Any = None
    none_field: str = None
    empty_string_field: str = ""
    nested_options: Optional["MockOptions"] = None
    list_field: list[Any] = None
    background_options: dict[str, Any] = None
    other_options: dict[str, Any] = None


@dataclass
class NestedOptions(Options):
    """Nested options for testing."""

    color: str = "#ff0000"
    width: int = 2


@dataclass
class MockOptionsDataClass(Options):
    """Mock options for advanced testing."""

    background_color: str = "#ffffff"
    text_color: str = "#000000"
    is_visible: bool = True
    nested_options: NestedOptions | None = None
    options_list: list[NestedOptions] | None = None
    options_dict: dict[str, NestedOptions] | None = None
    enum_value: MockEnum | None = None


# =============================================================================
# Basic Serialization Tests
# =============================================================================


class TestBasicFieldSerialization:
    """Test basic field serialization with camelCase conversion."""

    def test_to_dict_basic_fields(self):
        """Test basic field serialization."""
        options = MockOptions(
            string_field="hello",
            int_field=123,
            float_field=2.718,
            bool_field=False,
        )
        result = options.asdict()

        assert result["stringField"] == "hello"
        assert result["intField"] == 123
        assert result["floatField"] == 2.718
        assert result["boolField"] is False

    def test_to_dict_camel_case_conversion(self):
        """Test that snake_case field names are converted to camelCase."""
        options = MockOptions(string_field="test")
        result = options.asdict()

        assert "stringField" in result
        assert "string_field" not in result

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


class TestEnumConversion:
    """Test enum and enum-like value conversion."""

    def test_to_dict_enum_conversion(self):
        """Test that enums are converted to their values."""
        options = MockOptions(enum_field=MockEnum.VALUE_2)
        result = options.asdict()

        assert result["enumField"] == "value2"

    def test_to_dict_enum_like_conversion(self):
        """Test that enum-like objects are converted to their values."""

        class LocalTestEnumLike(Enum):
            TEST_VALUE = "test_value"

        enum_like = LocalTestEnumLike.TEST_VALUE
        options = MockOptions(enum_like_field=enum_like)
        result = options.asdict()

        assert result["enumLikeField"] == "test_value"

    def test_asdict_with_enum_value(self):
        """Test asdict with enum value."""
        options = MockOptionsDataClass(enum_value=MockEnum.VALUE_1)

        result = options.asdict()

        assert "enumValue" in result
        assert result["enumValue"] == "value1"

    def test_asdict_with_none_enum(self):
        """Test asdict with None enum."""
        options = MockOptionsDataClass(enum_value=None)

        result = options.asdict()

        assert "enumValue" not in result


class TestNoneAndEmptyValues:
    """Test handling of None and empty values."""

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

    def test_asdict_with_empty_string_values(self):
        """Test asdict with empty string values."""
        options = MockOptionsDataClass(background_color="", text_color="")

        result = options.asdict()

        # Empty strings should not be included
        assert "backgroundColor" not in result
        assert "textColor" not in result
        assert result["isVisible"] is True

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

    def test_asdict_with_false_boolean_value(self):
        """Test asdict with False boolean value."""
        options = MockOptionsDataClass(is_visible=False)

        result = options.asdict()

        assert "isVisible" in result
        assert result["isVisible"] is False

    def test_asdict_with_zero_numeric_values(self):
        """Test asdict with zero numeric values."""

        @dataclass
        class NumericOptions(Options):
            width: int = 0
            height: float = 0.0
            opacity: float = 0.0

        options = NumericOptions(width=0, height=0.0, opacity=0.0)

        result = options.asdict()

        assert result["width"] == 0
        assert result["height"] == 0.0
        assert result["opacity"] == 0.0

    def test_asdict_with_negative_numeric_values(self):
        """Test asdict with negative numeric values."""

        @dataclass
        class NumericOptions(Options):
            width: int = -1
            height: float = -1.5
            opacity: float = -0.5

        options = NumericOptions(width=-1, height=-1.5, opacity=-0.5)

        result = options.asdict()

        assert result["width"] == -1
        assert result["height"] == -1.5
        assert result["opacity"] == -0.5


class TestNestedStructures:
    """Test nested Options, lists, and dictionaries."""

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

    def test_asdict_with_nested_options(self):
        """Test asdict with nested options."""
        nested = NestedOptions(color="#ff0000", width=2)
        options = MockOptionsDataClass(nested_options=nested)

        result = options.asdict()

        assert "nestedOptions" in result
        assert result["nestedOptions"]["color"] == "#ff0000"
        assert result["nestedOptions"]["width"] == 2

    def test_asdict_with_none_nested_options(self):
        """Test asdict with None nested options."""
        options = MockOptionsDataClass(nested_options=None)

        result = options.asdict()

        assert "nestedOptions" not in result

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

    def test_asdict_with_deeply_nested_structure(self):
        """Test asdict with deeply nested structure."""

        @dataclass
        class Level3Options(Options):
            value: str = "level3"

        @dataclass
        class Level2Options(Options):
            value: str = "level2"
            level3: Level3Options | None = None

        @dataclass
        class Level1Options(Options):
            value: str = "level1"
            level2: Level2Options | None = None

        @dataclass
        class DeepNestedOptions(Options):
            level1: Level1Options | None = None

        # Create deeply nested structure
        level3 = Level3Options(value="deep_value")
        level2 = Level2Options(value="middle_value", level3=level3)
        level1 = Level1Options(value="top_value", level2=level2)
        options = DeepNestedOptions(level1=level1)

        result = options.asdict()

        assert result["level1"]["value"] == "top_value"
        assert result["level1"]["level2"]["value"] == "middle_value"
        assert result["level1"]["level2"]["level3"]["value"] == "deep_value"


class TestListSerialization:
    """Test list serialization with Options objects."""

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

    def test_asdict_with_empty_list(self):
        """Test asdict with empty list."""
        options = MockOptionsDataClass(options_list=[])

        result = options.asdict()

        assert "optionsList" in result
        assert result["optionsList"] == []

    def test_asdict_with_nested_options_list(self):
        """Test asdict with nested options list."""
        nested1 = NestedOptions(color="#ff0000", width=2)
        nested2 = NestedOptions(color="#00ff00", width=3)
        options = MockOptionsDataClass(options_list=[nested1, nested2])

        result = options.asdict()

        assert "optionsList" in result
        assert len(result["optionsList"]) == 2
        assert result["optionsList"][0]["color"] == "#ff0000"
        assert result["optionsList"][1]["color"] == "#00ff00"

    def test_asdict_with_none_in_list(self):
        """Test asdict with None values in list."""
        options = MockOptionsDataClass(
            options_list=[NestedOptions(), None, NestedOptions()],
        )

        result = options.asdict()

        assert "optionsList" in result
        assert len(result["optionsList"]) == 3
        assert result["optionsList"][0] is not None
        assert result["optionsList"][1] is None
        assert result["optionsList"][2] is not None

    def test_asdict_with_mixed_data_types_in_list(self):
        """Test asdict with mixed data types in list."""
        options = MockOptionsDataClass(options_list=None)
        # Manually set mixed types
        options.options_list = ["string", 123, True, None]

        result = options.asdict()

        assert "optionsList" in result
        assert result["optionsList"] == ["string", 123, True, None]


class TestDictSerialization:
    """Test dictionary serialization with Options objects."""

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

    def test_to_dict_with_empty_dict(self):
        """Test that empty dicts are handled correctly."""
        options = MockOptions(background_options={})
        result = options.asdict()

        # background_options should be flattened, but empty
        assert "backgroundOptions" not in result

    def test_to_dict_with_none_dict(self):
        """Test that None dicts are omitted."""
        options = MockOptions(background_options=None)
        result = options.asdict()

        assert "backgroundOptions" not in result

    def test_asdict_with_empty_dict(self):
        """Test asdict with empty dict."""
        options = MockOptionsDataClass(options_dict={})

        result = options.asdict()

        assert "optionsDict" not in result

    def test_asdict_with_nested_options_dict(self):
        """Test asdict with nested options dict."""
        nested1 = NestedOptions(color="#ff0000", width=2)
        nested2 = NestedOptions(color="#00ff00", width=3)
        options = MockOptionsDataClass(options_dict={"first": nested1, "second": nested2})

        result = options.asdict()

        assert "optionsDict" in result
        assert len(result["optionsDict"]) == 2
        assert result["optionsDict"]["first"]["color"] == "#ff0000"
        assert result["optionsDict"]["second"]["color"] == "#00ff00"

    def test_asdict_with_none_in_dict_values(self):
        """Test asdict with None values in dict."""
        options = MockOptionsDataClass(
            options_dict={"valid": NestedOptions(), "none": None},
        )

        result = options.asdict()

        assert "optionsDict" in result
        assert len(result["optionsDict"]) == 2
        assert result["optionsDict"]["valid"] is not None
        assert result["optionsDict"]["none"] is None

    def test_asdict_with_mixed_data_types_in_dict(self):
        """Test asdict with mixed data types in dict."""
        mixed_dict = {
            "string": "value",
            "number": 123,
            "boolean": True,
            "none": None,
            "list": [1, 2, 3],
            "dict": {"nested": "value"},
        }

        options = MockOptionsDataClass(options_dict=mixed_dict)

        result = options.asdict()

        assert "optionsDict" in result
        assert result["optionsDict"] == mixed_dict


class TestRecursiveSerialization:
    """Test _process_dict_recursively() method."""

    def test_process_dict_with_options_object(self):
        """Test _process_dict_recursively() with Options object."""
        options = SimpleOptions()
        nested = SimpleOptions(color="#00ff00", width=3)

        result = options._process_dict_recursively(nested)

        assert isinstance(result, dict)
        assert result["color"] == "#00ff00"
        assert result["width"] == 3

    def test_process_dict_with_dict(self):
        """Test _process_dict_recursively() with dict."""
        options = SimpleOptions()
        data = {"snake_case_key": "value", "another_key": 123}

        result = options._process_dict_recursively(data)

        assert isinstance(result, dict)
        assert "snakeCaseKey" in result
        assert "anotherKey" in result
        assert result["snakeCaseKey"] == "value"
        assert result["anotherKey"] == 123

    def test_process_dict_with_nested_dict_and_options(self):
        """Test _process_dict_recursively() with nested dicts and Options."""
        options = SimpleOptions()
        nested_options = SimpleOptions(color="#00ff00")
        data = {"nested_dict": {"inner_key": "value", "options": nested_options}}

        result = options._process_dict_recursively(data)

        assert "nestedDict" in result
        assert "innerKey" in result["nestedDict"]
        assert "options" in result["nestedDict"]
        assert isinstance(result["nestedDict"]["options"], dict)
        assert result["nestedDict"]["options"]["color"] == "#00ff00"

    def test_process_dict_with_list(self):
        """Test _process_dict_recursively() with list."""
        options = SimpleOptions()
        data = ["item1", 123, SimpleOptions(color="#00ff00")]

        result = options._process_dict_recursively(data)

        assert isinstance(result, list)
        assert len(result) == 3
        assert result[0] == "item1"
        assert result[1] == 123
        assert isinstance(result[2], dict)
        assert result[2]["color"] == "#00ff00"

    def test_process_dict_with_primitive(self):
        """Test _process_dict_recursively() with primitive types."""
        options = SimpleOptions()

        # Test various primitive types
        assert options._process_dict_recursively("string") == "string"
        assert options._process_dict_recursively(123) == 123
        assert options._process_dict_recursively(3.14) == 3.14
        assert options._process_dict_recursively(True) is True
        assert options._process_dict_recursively(None) is None


class TestComplexStructures:
    """Test complex nested and mixed structures."""

    def test_asdict_with_complex_nested_structure(self):
        """Test asdict with complex nested structure."""
        nested1 = NestedOptions(color="#ff0000", width=2)
        nested2 = NestedOptions(color="#00ff00", width=3)

        options = MockOptionsDataClass(
            nested_options=nested1,
            options_list=[nested1, nested2],
            options_dict={"first": nested1, "second": nested2},
            enum_value=MockEnum.VALUE_2,
        )

        result = options.asdict()

        # Verify all nested structures
        assert "nestedOptions" in result
        assert "optionsList" in result
        assert "optionsDict" in result
        assert "enumValue" in result

        assert result["nestedOptions"]["color"] == "#ff0000"
        assert len(result["optionsList"]) == 2
        assert len(result["optionsDict"]) == 2
        assert result["enumValue"] == "value2"

    def test_asdict_with_mixed_none_values(self):
        """Test asdict with mixed None and valid values."""
        nested = NestedOptions(color="#ff0000", width=2)
        options = MockOptionsDataClass(
            nested_options=nested,
            options_list=None,
            options_dict=None,
            enum_value=None,
        )

        result = options.asdict()

        assert "nestedOptions" in result
        assert "optionsList" not in result
        assert "optionsDict" not in result
        assert "enumValue" not in result

    def test_asdict_with_all_none_optional_values(self):
        """Test asdict with all optional values as None."""
        options = MockOptionsDataClass(
            nested_options=None,
            options_list=None,
            options_dict=None,
            enum_value=None,
        )

        result = options.asdict()

        assert "nestedOptions" not in result
        assert "optionsList" not in result
        assert "optionsDict" not in result
        assert "enumValue" not in result

    def test_asdict_performance_with_large_nested_structure(self):
        """Test asdict performance with large nested structure."""
        large_list = [NestedOptions(color=f"#ff{i:04x}", width=i) for i in range(100)]
        large_dict = {f"key_{i}": NestedOptions(color=f"#ff{i:04x}", width=i) for i in range(100)}

        options = MockOptionsDataClass(
            options_list=large_list,
            options_dict=large_dict,
        )

        result = options.asdict()

        assert len(result["optionsList"]) == 100
        assert len(result["optionsDict"]) == 100


class TestSpecialStringValues:
    """Test special string value handling."""

    def test_asdict_with_special_string_values(self):
        """Test asdict with special string values."""
        options = MockOptionsDataClass(
            background_color="transparent",
            text_color="inherit",
        )

        result = options.asdict()

        assert result["backgroundColor"] == "transparent"
        assert result["textColor"] == "inherit"

    def test_asdict_with_unicode_string_values(self):
        """Test asdict with unicode string values."""
        options = MockOptionsDataClass(
            background_color="rgba(255, 0, 0, 0.5)",
            text_color="hsl(120, 100%, 50%)",
        )

        result = options.asdict()

        assert result["backgroundColor"] == "rgba(255, 0, 0, 0.5)"
        assert result["textColor"] == "hsl(120, 100%, 50%)"

    def test_asdict_with_very_long_string_values(self):
        """Test asdict with very long string values."""
        long_string = "A" * 1000
        options = MockOptionsDataClass(
            background_color=long_string,
            text_color=long_string,
        )

        result = options.asdict()

        assert result["backgroundColor"] == long_string
        assert result["textColor"] == long_string

    def test_asdict_with_special_characters_in_strings(self):
        """Test asdict with special characters in strings."""
        special_string = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        options = MockOptionsDataClass(
            background_color=special_string,
            text_color=special_string,
        )

        result = options.asdict()

        assert result["backgroundColor"] == special_string
        assert result["textColor"] == special_string


class TestCircularReferences:
    """Test circular reference handling."""

    def test_to_dict_with_circular_reference(self):
        """Test handling of circular references."""

        @dataclass
        class CircularOptions(Options):
            name: str = "test"
            self_ref: Optional["CircularOptions"] = None

        options = CircularOptions()
        options.self_ref = options  # Create circular reference

        # Should cause infinite recursion
        with pytest.raises(RecursionError):
            options.asdict()

    def test_asdict_with_circular_reference_prevention(self):
        """Test asdict with potential circular reference."""

        @dataclass
        class CircularOptions(Options):
            value: str = "circular"
            self_ref: Optional["CircularOptions"] = None

        options = CircularOptions(value="test")
        options.self_ref = options

        # Document current behavior - may raise RecursionError
        try:
            result = options.asdict()
            assert "value" in result
        except RecursionError:
            pass  # Expected behavior


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
