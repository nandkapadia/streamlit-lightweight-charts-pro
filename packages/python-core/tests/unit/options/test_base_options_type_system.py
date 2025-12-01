"""Base Options type system tests - Type analysis and conversion utilities.

This module tests type-related functionality including:
- _analyze_type_for_options() with various type annotations
- _camel_to_snake() conversion utility
- Direct Options types, Dict[str, Options], List[Options]
- Optional/Union type handling
- Malformed and edge case types
"""

# pylint: disable=no-member,protected-access

# Standard Imports
from dataclasses import dataclass
from types import SimpleNamespace

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
class OptionsWithList(Options):
    """Options with List[Options] field."""

    name: str = "test"
    options_list: list[SimpleOptions] | None = None


@dataclass
class OptionsWithStringDict(Options):
    """Options with Dict[str, str] field."""

    name: str = "test"
    string_dict: dict[str, str] | None = None


@dataclass
class EdgeCaseOptions(Options):
    """Options for testing edge cases."""

    name: str = "test"
    color: str = "#ff0000"


# =============================================================================
# Type Analysis Tests
# =============================================================================


class TestAnalyzeTypeForOptions:
    """Test _analyze_type_for_options() method."""

    def test_analyze_direct_options_type(self):
        """Test _analyze_type_for_options() with direct Options type."""
        options = SimpleOptions()

        # Test with direct Options type
        contains_options, options_class, is_dict = options._analyze_type_for_options(SimpleOptions)

        assert contains_options is True
        assert options_class == SimpleOptions
        assert is_dict is False

    def test_analyze_non_generic_type(self):
        """Test _analyze_type_for_options() with non-generic type."""
        options = SimpleOptions()

        # Test with simple type (no __origin__)
        contains_options, options_class, is_dict = options._analyze_type_for_options(str)

        assert contains_options is False
        assert options_class is None
        assert is_dict is False


class TestAnalyzeDictTypes:
    """Test _analyze_type_for_options() with Dict types."""

    def test_analyze_dict_with_options_value_type(self):
        """Test _analyze_type_for_options() with Dict[str, Options]."""
        options = OptionsWithDict()

        # Get the type annotation for options_dict field
        from dataclasses import fields as dataclass_fields

        field_type = None
        for field in dataclass_fields(options):
            if field.name == "options_dict":
                field_type = field.type
                break

        assert field_type is not None

        # Analyze the Dict[str, SimpleOptions] type
        contains_options, options_class, is_dict = options._analyze_type_for_options(field_type)

        assert contains_options is True
        assert options_class == SimpleOptions
        assert is_dict is True

    def test_analyze_dict_without_options_value_type(self):
        """Test _analyze_type_for_options() with Dict[str, str]."""
        options = OptionsWithStringDict()

        # Get the type annotation for string_dict field
        from dataclasses import fields as dataclass_fields

        field_type = None
        for field in dataclass_fields(options):
            if field.name == "string_dict":
                field_type = field.type
                break

        assert field_type is not None

        # Analyze the Dict[str, str] type (non-Options value type)
        contains_options, options_class, is_dict = options._analyze_type_for_options(field_type)

        assert contains_options is False
        assert options_class is None
        assert is_dict is False

    def test_analyze_dict_with_single_type_arg_via_mock(self):
        """Test Dict with only one type argument."""
        options = EdgeCaseOptions()

        # Create a mock type that looks like Dict[str] (single type arg)
        mock_dict_type = SimpleNamespace()
        mock_dict_type.__origin__ = dict
        mock_dict_type.__args__ = (str,)  # Only one type arg

        # Analyze this malformed dict type
        contains_options, options_class, is_dict = options._analyze_type_for_options(mock_dict_type)

        # Should return False, None, False for malformed Dict
        assert contains_options is False
        assert options_class is None
        assert is_dict is False

    def test_analyze_dict_with_empty_args(self):
        """Test Dict with empty args."""
        options = EdgeCaseOptions()

        # Create a mock dict type with empty args
        mock_dict_type = SimpleNamespace()
        mock_dict_type.__origin__ = dict
        mock_dict_type.__args__ = ()  # Empty args

        # Analyze this dict type with no args
        contains_options, options_class, is_dict = options._analyze_type_for_options(mock_dict_type)

        assert contains_options is False
        assert options_class is None
        assert is_dict is False


class TestAnalyzeListTypes:
    """Test _analyze_type_for_options() with List types."""

    def test_analyze_list_with_options_type(self):
        """Test _analyze_type_for_options() with List[Options]."""
        options = OptionsWithList()

        # Get the type annotation for options_list field
        from dataclasses import fields as dataclass_fields

        field_type = None
        for field in dataclass_fields(options):
            if field.name == "options_list":
                field_type = field.type
                break

        assert field_type is not None

        # Analyze the List[SimpleOptions] type
        contains_options, options_class, is_dict = options._analyze_type_for_options(field_type)

        assert contains_options is True
        assert options_class == SimpleOptions
        assert is_dict is False


class TestAnalyzeUnionTypes:
    """Test _analyze_type_for_options() with Union/Optional types."""

    def test_analyze_optional_options_type(self):
        """Test _analyze_type_for_options() with Optional[Options]."""
        options = NestedOptions()

        # Get the type annotation for simple_options field
        from dataclasses import fields as dataclass_fields

        field_type = None
        for field in dataclass_fields(options):
            if field.name == "simple_options":
                field_type = field.type
                break

        assert field_type is not None

        # Analyze the Optional[SimpleOptions] type
        contains_options, options_class, is_dict = options._analyze_type_for_options(field_type)

        assert contains_options is True
        assert options_class == SimpleOptions
        assert is_dict is False

    def test_analyze_optional_dict_with_options(self):
        """Test _analyze_type_for_options() with Optional[Dict[str, Options]]."""
        options = OptionsWithDict()

        # Get the type annotation for options_dict field
        from dataclasses import fields as dataclass_fields

        field_type = None
        for field in dataclass_fields(options):
            if field.name == "options_dict":
                field_type = field.type
                break

        assert field_type is not None

        # Analyze the Optional[Dict[str, SimpleOptions]] type
        contains_options, options_class, is_dict = options._analyze_type_for_options(field_type)

        assert contains_options is True
        assert options_class == SimpleOptions
        assert is_dict is True


# =============================================================================
# CamelCase Conversion Tests
# =============================================================================


class TestCamelToSnakeConversion:
    """Test _camel_to_snake() conversion utility."""

    def test_camel_to_snake_basic_conversion(self):
        """Test basic camelCase to snake_case conversion."""
        options = EdgeCaseOptions()

        result = options._camel_to_snake("backgroundColor")
        assert result == "background_color"

    def test_camel_to_snake_with_consecutive_caps(self):
        """Test camelCase conversion with consecutive capitals."""
        options = EdgeCaseOptions()

        result = options._camel_to_snake("HTTPResponse")
        assert result == "h_t_t_p_response"

    def test_camel_to_snake_with_numbers(self):
        """Test camelCase conversion with numbers."""
        options = EdgeCaseOptions()

        result = options._camel_to_snake("value123Test")
        assert result == "value123_test"

    def test_camel_to_snake_already_snake_case(self):
        """Test camelCase conversion with already snake_case."""
        options = EdgeCaseOptions()

        result = options._camel_to_snake("already_snake_case")
        assert result == "already_snake_case"

    def test_camel_to_snake_single_word(self):
        """Test camelCase conversion with single word."""
        options = EdgeCaseOptions()

        result = options._camel_to_snake("name")
        assert result == "name"

    def test_camel_to_snake_all_caps(self):
        """Test camelCase conversion with all caps."""
        options = EdgeCaseOptions()

        result = options._camel_to_snake("ALLCAPS")
        assert result == "a_l_l_c_a_p_s"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
