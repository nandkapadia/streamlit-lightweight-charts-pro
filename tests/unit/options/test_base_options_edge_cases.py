"""
Tests for base_options module edge cases and low-coverage scenarios.

This module tests edge cases and scenarios that are not covered by the main
options tests to improve overall coverage of the base_options module.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional

from streamlit_lightweight_charts_pro.charts.options.base_options import Options


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
class TestOptions(Options):
    """Test options class for testing."""

    background_color: str = "#ffffff"
    text_color: str = "#000000"
    is_visible: bool = True
    nested_options: Optional[NestedOptions] = None
    options_list: Optional[List[NestedOptions]] = None
    options_dict: Optional[Dict[str, NestedOptions]] = None
    enum_value: Optional[TestEnum] = None
    enum_like_value: Optional[TestEnumLike] = None
    background_options: Optional[NestedOptions] = None
    other_options: Optional[NestedOptions] = None


class TestOptionsUpdateEdgeCases:
    """Test edge cases in the update method."""

    def test_update_with_none_values(self):
        """Test update method with None values."""
        options = TestOptions()

        # None values should be skipped
        result = options.update({"background_color": None, "text_color": "#ff0000"})

        assert result is options
        assert options.background_color == "#ffffff"  # Should remain unchanged
        assert options.text_color == "#ff0000"  # Should be updated

    def test_update_with_invalid_field(self):
        """Test update method with invalid field names."""
        options = TestOptions()

        # Invalid field should be ignored (not raise error)
        result = options.update({"invalid_field": "value", "background_color": "#ff0000"})

        assert result is options
        assert options.background_color == "#ff0000"  # Valid field should be updated

    def test_update_with_camelcase_keys(self):
        """Test update method with camelCase keys."""
        options = TestOptions()

        result = options.update({"backgroundColor": "#ff0000", "textColor": "#00ff00"})

        assert result is options
        assert options.background_color == "#ff0000"
        assert options.text_color == "#00ff00"

    def test_update_with_nested_options_dict(self):
        """Test update method with nested options as dictionary."""
        options = TestOptions()

        result = options.update({"nestedOptions": {"color": "#00ff00", "width": 5}})

        assert result is options
        assert options.nested_options is not None
        assert options.nested_options.color == "#00ff00"
        assert options.nested_options.width == 5

    def test_update_with_nested_options_existing(self):
        """Test update method with existing nested options."""
        options = TestOptions()
        options.nested_options = NestedOptions(color="#ff0000", width=2)

        result = options.update({"nestedOptions": {"color": "#00ff00"}})

        assert result is options
        assert options.nested_options.color == "#00ff00"
        assert options.nested_options.width == 2  # Should preserve existing value

    def test_update_with_nested_options_none(self):
        """Test update method with nested options set to None."""
        options = TestOptions()
        options.nested_options = NestedOptions(color="#ff0000", width=2)

        result = options.update({"nestedOptions": None})

        assert result is options
        # The update method skips None values, so nested_options should remain unchanged
        assert options.nested_options is not None
        assert options.nested_options.color == "#ff0000"
        assert options.nested_options.width == 2

    def test_update_with_dict_type_nested_options(self):
        """Test update method with Dict[str, Options] type."""
        options = TestOptions()

        result = options.update(
            {
                "optionsDict": {
                    "line": {"color": "#ff0000", "width": 2},
                    "area": {"color": "#00ff00", "width": 3},
                }
            }
        )

        assert result is options
        assert options.options_dict is not None
        assert "line" in options.options_dict
        assert "area" in options.options_dict
        # The current implementation stores raw dictionaries, not NestedOptions objects
        assert options.options_dict["line"]["color"] == "#ff0000"
        assert options.options_dict["area"]["color"] == "#00ff00"


class TestOptionsCamelToSnake:
    """Test camelCase to snake_case conversion."""

    def test_camel_to_snake_various_cases(self):
        """Test _camel_to_snake with various camelCase inputs."""
        options = TestOptions()

        # Test various camelCase conversions
        assert options._camel_to_snake("camelCase") == "camel_case"
        assert options._camel_to_snake("simple") == "simple"
        assert options._camel_to_snake("multipleWords") == "multiple_words"
        assert options._camel_to_snake("ABC") == "a_b_c"
        assert options._camel_to_snake("") == ""
        assert options._camel_to_snake("backgroundColor") == "background_color"
        assert options._camel_to_snake("textColor") == "text_color"


class TestOptionsProcessDictRecursively:
    """Test _process_dict_recursively method."""

    def test_process_dict_recursively_with_options(self):
        """Test _process_dict_recursively with Options object."""
        options = TestOptions()
        nested_options = NestedOptions(color="#ff0000", width=2)

        result = options._process_dict_recursively(nested_options)

        assert isinstance(result, dict)
        assert result["color"] == "#ff0000"
        assert result["width"] == 2

    def test_process_dict_recursively_with_dict(self):
        """Test _process_dict_recursively with dictionary."""
        options = TestOptions()
        data = {"nested_options": NestedOptions(color="#ff0000", width=2), "simple_value": "test"}

        result = options._process_dict_recursively(data)

        assert isinstance(result, dict)
        assert "nestedOptions" in result  # Should convert to camelCase
        assert result["nestedOptions"]["color"] == "#ff0000"
        assert result["simpleValue"] == "test"  # Should convert to camelCase

    def test_process_dict_recursively_with_list(self):
        """Test _process_dict_recursively with list."""
        options = TestOptions()
        data = [NestedOptions(color="#ff0000", width=2), NestedOptions(color="#00ff00", width=3)]

        result = options._process_dict_recursively(data)

        assert isinstance(result, list)
        assert len(result) == 2
        assert result[0]["color"] == "#ff0000"
        assert result[1]["color"] == "#00ff00"

    def test_process_dict_recursively_with_nested_structures(self):
        """Test _process_dict_recursively with complex nested structures."""
        options = TestOptions()
        data = {
            "level1": {
                "level2": {"options": NestedOptions(color="#ff0000", width=2), "simple": "value"}
            },
            "list_data": [{"item": NestedOptions(color="#00ff00", width=3)}, "simple_item"],
        }

        result = options._process_dict_recursively(data)

        assert isinstance(result, dict)
        assert result["level1"]["level2"]["options"]["color"] == "#ff0000"
        assert result["level1"]["level2"]["simple"] == "value"
        assert result["listData"][0]["item"]["color"] == "#00ff00"
        assert result["listData"][1] == "simple_item"

    def test_process_dict_recursively_with_primitive_types(self):
        """Test _process_dict_recursively with primitive types."""
        options = TestOptions()

        # Test various primitive types
        assert options._process_dict_recursively("string") == "string"
        assert options._process_dict_recursively(123) == 123
        assert options._process_dict_recursively(True) is True
        assert options._process_dict_recursively(None) is None


class TestOptionsAnalyzeTypeForOptions:
    """Test _analyze_type_for_options method."""

    def test_analyze_type_for_options_direct_options(self):
        """Test _analyze_type_for_options with direct Options type."""
        options = TestOptions()

        contains_options, options_class, is_dict_type = options._analyze_type_for_options(
            NestedOptions
        )

        assert contains_options is True
        assert options_class == NestedOptions
        assert is_dict_type is False

    def test_analyze_type_for_options_dict_of_options(self):
        """Test _analyze_type_for_options with Dict[str, Options]."""
        from typing import Dict

        options = TestOptions()

        dict_type = Dict[str, NestedOptions]
        contains_options, options_class, is_dict_type = options._analyze_type_for_options(dict_type)

        assert contains_options is True
        assert options_class == NestedOptions
        assert is_dict_type is True

    def test_analyze_type_for_options_list_of_options(self):
        """Test _analyze_type_for_options with List[Options]."""
        from typing import List

        options = TestOptions()

        list_type = List[NestedOptions]
        contains_options, options_class, is_dict_type = options._analyze_type_for_options(list_type)

        assert contains_options is True
        assert options_class == NestedOptions
        assert is_dict_type is False

    def test_analyze_type_for_options_optional_options(self):
        """Test _analyze_type_for_options with Optional[Options]."""
        from typing import Optional

        options = TestOptions()

        optional_type = Optional[NestedOptions]
        contains_options, options_class, is_dict_type = options._analyze_type_for_options(
            optional_type
        )

        assert contains_options is True
        assert options_class == NestedOptions
        assert is_dict_type is False

    def test_analyze_type_for_options_optional_dict_options(self):
        """Test _analyze_type_for_options with Optional[Dict[str, Options]]."""
        from typing import Dict, Optional

        options = TestOptions()

        optional_dict_type = Optional[Dict[str, NestedOptions]]
        contains_options, options_class, is_dict_type = options._analyze_type_for_options(
            optional_dict_type
        )

        assert contains_options is True
        assert options_class == NestedOptions
        assert is_dict_type is True

    def test_analyze_type_for_options_primitive_types(self):
        """Test _analyze_type_for_options with primitive types."""
        options = TestOptions()

        # Test primitive types
        for primitive_type in [str, int, bool, float]:
            contains_options, options_class, is_dict_type = options._analyze_type_for_options(
                primitive_type
            )
            assert contains_options is False
            assert options_class is None
            assert is_dict_type is False

    def test_analyze_type_for_options_none_type(self):
        """Test _analyze_type_for_options with None type."""
        options = TestOptions()

        contains_options, options_class, is_dict_type = options._analyze_type_for_options(
            type(None)
        )
        assert contains_options is False
        assert options_class is None
        assert is_dict_type is False

    def test_analyze_type_for_options_complex_union(self):
        """Test _analyze_type_for_options with complex Union types."""
        from typing import Union

        options = TestOptions()

        # Union with Options and primitive
        union_type = Union[str, NestedOptions]
        contains_options, options_class, is_dict_type = options._analyze_type_for_options(
            union_type
        )

        assert contains_options is True
        assert options_class == NestedOptions
        assert is_dict_type is False

        # Union with Dict and primitive
        from typing import Dict

        union_dict_type = Union[str, Dict[str, NestedOptions]]
        contains_options, options_class, is_dict_type = options._analyze_type_for_options(
            union_dict_type
        )

        assert contains_options is True
        assert options_class == NestedOptions
        assert is_dict_type is True


class TestOptionsAsdictEdgeCases:
    """Test edge cases in the asdict method."""

    def test_asdict_with_none_values(self):
        """Test asdict with None values."""
        options = TestOptions()
        options.background_color = None
        options.text_color = ""
        options.nested_options = None

        result = options.asdict()

        # None values and empty strings should be omitted
        assert "backgroundColor" not in result
        assert "textColor" not in result
        assert "nestedOptions" not in result
        assert "isVisible" in result  # Should be included

    def test_asdict_with_empty_dict(self):
        """Test asdict with empty dictionary."""
        options = TestOptions()
        options.nested_options = NestedOptions()
        options.nested_options.color = ""
        options.nested_options.width = 0

        result = options.asdict()

        # Empty string should be omitted from nested options
        assert "nestedOptions" in result
        assert "color" not in result["nestedOptions"]
        assert "width" in result["nestedOptions"]

    def test_asdict_with_enum_values(self):
        """Test asdict with enum values."""
        options = TestOptions()
        options.enum_value = TestEnum.VALUE1

        result = options.asdict()

        assert result["enumValue"] == "value1"  # Should convert to enum value

    def test_asdict_with_enum_like_values(self):
        """Test asdict with enum-like values."""
        options = TestOptions()
        options.enum_like_value = TestEnumLike("test_value")

        result = options.asdict()

        # The current implementation doesn't detect this specific enum-like pattern
        # So it should return the object as-is
        assert result["enumLikeValue"] == options.enum_like_value

    def test_asdict_with_list_of_options(self):
        """Test asdict with list of Options objects."""
        options = TestOptions()
        options.options_list = [
            NestedOptions(color="#ff0000", width=2),
            NestedOptions(color="#00ff00", width=3),
        ]

        result = options.asdict()

        assert "optionsList" in result
        assert len(result["optionsList"]) == 2
        assert result["optionsList"][0]["color"] == "#ff0000"
        assert result["optionsList"][1]["color"] == "#00ff00"

    def test_asdict_with_dict_of_options(self):
        """Test asdict with dictionary of Options objects."""
        options = TestOptions()
        options.options_dict = {
            "line": NestedOptions(color="#ff0000", width=2),
            "area": NestedOptions(color="#00ff00", width=3),
        }

        result = options.asdict()

        assert "optionsDict" in result
        assert result["optionsDict"]["line"]["color"] == "#ff0000"
        assert result["optionsDict"]["area"]["color"] == "#00ff00"

    def test_asdict_with_background_options_flattening(self):
        """Test asdict with background_options flattening."""
        options = TestOptions()
        options.background_options = NestedOptions(color="#ff0000", width=2)

        result = options.asdict()

        # background_options should be flattened into parent
        assert "backgroundOptions" not in result
        assert result["color"] == "#ff0000"
        assert result["width"] == 2

    def test_asdict_with_other_options_no_flattening(self):
        """Test asdict with other _options fields (no flattening)."""
        options = TestOptions()
        options.other_options = NestedOptions(color="#ff0000", width=2)

        result = options.asdict()

        # other_options should not be flattened
        assert "otherOptions" in result
        assert result["otherOptions"]["color"] == "#ff0000"
        assert result["otherOptions"]["width"] == 2

    def test_asdict_with_mixed_data_types(self):
        """Test asdict with mixed data types."""
        options = TestOptions()
        options.background_color = "#ffffff"
        options.text_color = "#000000"
        options.is_visible = True
        options.nested_options = NestedOptions(color="#ff0000", width=2)
        options.enum_value = TestEnum.VALUE1

        result = options.asdict()

        # All values should be properly converted
        assert result["backgroundColor"] == "#ffffff"
        assert result["textColor"] == "#000000"
        assert result["isVisible"] is True
        assert result["nestedOptions"]["color"] == "#ff0000"
        assert result["enumValue"] == "value1"

    def test_asdict_with_complex_nested_structures(self):
        """Test asdict with complex nested structures."""
        options = TestOptions()
        options.options_dict = {
            "line": NestedOptions(color="#ff0000", width=2),
            "area": NestedOptions(color="#00ff00", width=3),
        }
        options.options_list = [NestedOptions(color="#0000ff", width=4)]

        result = options.asdict()

        # Complex structures should be properly serialized
        assert "optionsDict" in result
        assert "optionsList" in result
        assert result["optionsDict"]["line"]["color"] == "#ff0000"
        assert result["optionsList"][0]["color"] == "#0000ff"


class TestOptionsIntegration:
    """Test integration scenarios for Options."""

    def test_options_inheritance_and_methods(self):
        """Test that Options inheritance works correctly."""
        # Test that TestOptions inherits from Options
        assert issubclass(TestOptions, Options)

        # Test that instances have required methods
        options = TestOptions()
        assert hasattr(options, "update")
        assert hasattr(options, "asdict")
        assert hasattr(options, "_camel_to_snake")
        assert hasattr(options, "_process_dict_recursively")
        assert hasattr(options, "_analyze_type_for_options")

    def test_options_method_chaining(self):
        """Test method chaining with Options."""
        options = TestOptions()

        result = (
            options.update({"backgroundColor": "#ff0000"})
            .update({"textColor": "#00ff00"})
            .update({"isVisible": False})
        )

        assert result is options
        assert options.background_color == "#ff0000"
        assert options.text_color == "#00ff00"
        assert options.is_visible is False

    def test_options_complex_update_scenario(self):
        """Test complex update scenario with nested objects."""
        options = TestOptions()

        # Update with complex nested structure
        result = options.update(
            {
                "backgroundColor": "#ffffff",
                "nestedOptions": {"color": "#ff0000", "width": 5},
                "optionsDict": {
                    "line": {"color": "#00ff00", "width": 2},
                    "area": {"color": "#0000ff", "width": 3},
                },
            }
        )

        assert result is options
        assert options.background_color == "#ffffff"
        assert options.nested_options.color == "#ff0000"
        assert options.nested_options.width == 5
        # The current implementation stores raw dictionaries, not NestedOptions objects
        assert options.options_dict["line"]["color"] == "#00ff00"
        assert options.options_dict["area"]["color"] == "#0000ff"
