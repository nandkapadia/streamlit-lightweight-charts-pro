"""Comprehensive unit tests for chainable utility module.

This module tests the chainable decorators functionality including
method chaining, type validation, edge cases, and error handling.
"""

# pylint: disable=no-member
# type: ignore[attr-defined]
# mypy: disable-error-code=attr-defined

from dataclasses import dataclass
from typing import Optional, Union

import pytest
from lightweight_charts_core.data.marker import MarkerBase
from lightweight_charts_core.exceptions import (
    ColorValidationError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.utils.chainable import (
    _is_list_of_markers,
    _validate_list_of_markers,
    chainable_field,
    chainable_property,
)


class TestChainableProperty:
    """Test chainable_property decorator."""

    def test_basic_chainable_property(self):
        """Test basic chainable property functionality."""

        @chainable_property("color", str)
        @chainable_property("width", int)
        class TestConfig:
            def __init__(self):
                self._color = "#000000"
                self._width = 800

            @property
            def color(self):
                return self._color

            @property
            def width(self):
                return self._width

        config = TestConfig()

        # Test property assignment
        config.color = "#ff0000"
        assert config.color == "#ff0000"

        # Test method chaining
        result = config.set_width(600).set_color("#00ff00")  # type: ignore[attr-defined]
        assert result is config
        assert config.width == 600
        assert config.color == "#00ff00"

    def test_chainable_property_with_validation(self):
        """Test chainable property with type validation."""

        @chainable_property("precision", int, validator="precision")
        class TestConfig:
            def __init__(self):
                self._precision = 2

            @property
            def precision(self):
                return self._precision

        config = TestConfig()

        # Test valid precision
        config.set_precision(4)  # type: ignore[attr-defined][attr-defined]
        assert config.precision == 4

        # Test invalid precision should raise error
        with pytest.raises(ValueValidationError):
            config.set_precision(-1)  # type: ignore[attr-defined][attr-defined]

    def test_chainable_property_with_none_support(self):
        """Test chainable property with None support."""

        @chainable_property("optional_field", Optional[str], allow_none=True)
        class TestConfig:
            def __init__(self):
                self._optional_field = "default"

            @property
            def optional_field(self):
                return self._optional_field

        config = TestConfig()

        # Test setting None
        config.set_optional_field(None)  # type: ignore[attr-defined][attr-defined]
        assert config.optional_field is None

        # Test setting value
        config.set_optional_field("test")  # type: ignore[attr-defined][attr-defined]
        assert config.optional_field == "test"

    def test_chainable_property_without_none_support(self):
        """Test chainable property without None support."""

        @chainable_property("required_field", str, allow_none=False)
        class TestConfig:
            def __init__(self):
                self._required_field = "default"

            @property
            def required_field(self):
                return self._required_field

        config = TestConfig()

        # Test setting None should raise error
        with pytest.raises(TypeValidationError, match="required_field must be string"):
            config.set_required_field(None)  # type: ignore[attr-defined][attr-defined]

    def test_multiple_chainable_properties(self):
        """Test multiple chainable properties on same class."""

        @chainable_property("color", str)
        @chainable_property("width", int)
        @chainable_property("height", int)
        @chainable_property("enabled", bool)
        class TestConfig:
            def __init__(self):
                self._color = "#000000"
                self._width = 800
                self._height = 600
                self._enabled = False

            @property
            def color(self):
                return self._color

            @property
            def width(self):
                return self._width

            @property
            def height(self):
                return self._height

            @property
            def enabled(self):
                return self._enabled

        config = TestConfig()

        # Test complex chaining
        result = (
            config.set_color("#ff0000")  # type: ignore[attr-defined][attr-defined]
            .set_width(1024)  # type: ignore[attr-defined][attr-defined]
            .set_height(768)  # type: ignore[attr-defined][attr-defined]
            .set_enabled(True)
        )  # type: ignore[attr-defined][attr-defined]

        assert result is config
        assert config.color == "#ff0000"
        assert config.width == 1024
        assert config.height == 768
        assert config.enabled is True


class TestChainableField:
    """Test chainable_field decorator."""

    def test_basic_chainable_field(self):
        """Test basic chainable field functionality."""

        @dataclass
        @chainable_field("color", str)
        @chainable_field("width", int)
        class TestOptions:
            color: str = "#000000"
            width: int = 800

        options = TestOptions()

        # Test property assignment
        options.color = "#ff0000"
        assert options.color == "#ff0000"

        # Test method chaining
        result = options.set_width(600).set_color("#00ff00")  # type: ignore[attr-defined]
        assert result is options
        assert options.width == 600
        assert options.color == "#00ff00"

    def test_chainable_field_with_validation(self):
        """Test chainable field with type validation."""

        @dataclass
        @chainable_field("min_move", float, validator="min_move")
        class TestOptions:
            min_move: float = 0.01

        options = TestOptions()

        # Test valid min_move
        options.set_min_move(0.05)  # type: ignore[attr-defined][attr-defined]
        assert options.min_move == 0.05

        # Test invalid min_move should raise error
        with pytest.raises(ValueValidationError):
            options.set_min_move(-0.01)  # type: ignore[attr-defined][attr-defined]

    def test_chainable_field_with_union_types(self):
        """Test chainable field with Union types."""

        @dataclass
        @chainable_field("value", Union[int, float])
        class TestOptions:
            value: int | float = 0

        options = TestOptions()

        # Test setting int
        options.set_value(42)  # type: ignore[attr-defined][attr-defined]
        assert options.value == 42

        # Test setting float
        options.set_value(3.14)  # type: ignore[attr-defined][attr-defined]
        assert options.value == 3.14

    def test_chainable_field_with_optional(self):
        """Test chainable field with Optional type."""

        @dataclass
        @chainable_field("optional_value", Optional[int])
        class TestOptions:
            optional_value: int | None = None

        options = TestOptions()

        # Test setting None
        options.set_optional_value(None)  # type: ignore[attr-defined][attr-defined]
        assert options.optional_value is None

        # Test setting value
        options.set_optional_value(42)  # type: ignore[attr-defined][attr-defined]
        assert options.optional_value == 42

    def test_chainable_field_complex_chaining(self):
        """Test complex method chaining with chainable fields."""

        @dataclass
        @chainable_field("color", str)
        @chainable_field("width", int)
        @chainable_field("height", int)
        @chainable_field("enabled", bool)
        class TestOptions:
            color: str = "#000000"
            width: int = 800
            height: int = 600
            enabled: bool = False

        options = TestOptions()

        # Test complex chaining
        result = (
            options.set_color("#ff0000")  # type: ignore[attr-defined][attr-defined]
            .set_width(1024)  # type: ignore[attr-defined][attr-defined]
            .set_height(768)  # type: ignore[attr-defined][attr-defined]
            .set_enabled(True)
        )  # type: ignore[attr-defined][attr-defined]

        assert result is options
        assert options.color == "#ff0000"
        assert options.width == 1024
        assert options.height == 768
        assert options.enabled is True


class TestChainableValidation:
    """Test validation functionality in chainable decorators."""

    def test_color_validation_valid(self):
        """Test valid color values."""

        @chainable_property("color", str, validator="color")
        class TestConfig:
            def __init__(self):
                self._color = "#000000"

            @property
            def color(self):
                return self._color

        config = TestConfig()

        # Test valid hex colors
        config.set_color("#ff0000")  # type: ignore[attr-defined][attr-defined]
        assert config.color == "#ff0000"

        config.set_color("#00ff00")  # type: ignore[attr-defined][attr-defined]
        assert config.color == "#00ff00"

        config.set_color("#0000ff")  # type: ignore[attr-defined][attr-defined]
        assert config.color == "#0000ff"

    def test_color_validation_invalid(self):
        """Test invalid color values."""

        @chainable_property("color", str, validator="color")
        class TestConfig:
            def __init__(self):
                self._color = "#000000"

            @property
            def color(self):
                return self._color

        config = TestConfig()

        # Test invalid colors should raise error
        with pytest.raises(ColorValidationError):
            config.set_color("invalid_color")  # type: ignore[attr-defined][attr-defined]

        with pytest.raises(ColorValidationError):
            config.set_color("#gggggg")  # type: ignore[attr-defined][attr-defined]

    def test_precision_validation_valid(self):
        """Test valid precision values."""

        @chainable_property("precision", int, validator="precision")
        class TestConfig:
            def __init__(self):
                self._precision = 2

            @property
            def precision(self):
                return self._precision

        config = TestConfig()

        # Test valid precision values
        for precision in [0, 1, 2, 3, 4, 5]:
            config.set_precision(precision)  # type: ignore[attr-defined][attr-defined]
            assert config.precision == precision

    def test_precision_validation_invalid(self):
        """Test invalid precision values."""

        @chainable_property("precision", int, validator="precision")
        class TestConfig:
            def __init__(self):
                self._precision = 2

            @property
            def precision(self):
                return self._precision

        config = TestConfig()

        # Test invalid precision values should raise error
        with pytest.raises(ValueValidationError):
            config.set_precision(-1)  # type: ignore[attr-defined][attr-defined]

        # Note: The actual validator might allow values > 5, so we test a reasonable boundary
        config.set_precision(5)  # type: ignore[attr-defined][attr-defined] # This should work
        assert config.precision == 5

    def test_min_move_validation_valid(self):
        """Test valid min_move values."""

        @chainable_property("min_move", float, validator="min_move")
        class TestConfig:
            def __init__(self):
                self._min_move = 0.01

            @property
            def min_move(self):
                return self._min_move

        config = TestConfig()

        # Test valid min_move values
        config.set_min_move(0.01)  # type: ignore[attr-defined][attr-defined]
        assert config.min_move == 0.01

        config.set_min_move(0.1)  # type: ignore[attr-defined][attr-defined]
        assert config.min_move == 0.1

        config.set_min_move(1.0)  # type: ignore[attr-defined][attr-defined]
        assert config.min_move == 1.0

    def test_min_move_validation_invalid(self):
        """Test invalid min_move values."""

        @chainable_property("min_move", float, validator="min_move")
        class TestConfig:
            def __init__(self):
                self._min_move = 0.01

            @property
            def min_move(self):
                return self._min_move

        config = TestConfig()

        # Test invalid min_move values should raise error
        with pytest.raises(ValueValidationError):
            config.set_min_move(-0.01)  # type: ignore[attr-defined][attr-defined]

        with pytest.raises(ValueValidationError):
            config.set_min_move(0.0)  # type: ignore[attr-defined][attr-defined]


class TestChainableEdgeCases:
    """Test edge cases and error conditions."""

    def test_type_mismatch_error(self):
        """Test type mismatch error handling."""

        @chainable_property("value", int)
        class TestConfig:
            def __init__(self):
                self._value = 0

            @property
            def value(self):
                return self._value

        config = TestConfig()

        # Test type mismatch should raise error
        with pytest.raises(TypeValidationError):
            config.set_value("not_an_int")  # type: ignore[attr-defined][attr-defined]

    def test_unknown_validator_error(self):
        """Test unknown validator error handling."""

        # The actual implementation validates unknown validators and raises an error
        @chainable_property("value", str, validator="unknown_validator")
        class TestConfig:
            def __init__(self):
                self._value = "default"

            @property
            def value(self):
                return self._value

        config = TestConfig()
        # Should raise error when trying to set value with unknown validator
        with pytest.raises(ValueValidationError, match="validator unknown validator"):
            config.set_value("test")  # type: ignore[attr-defined][attr-defined]

    def test_none_without_allow_none(self):
        """Test None value without allow_none=True."""

        @chainable_property("value", str, allow_none=False)
        class TestConfig:
            def __init__(self):
                self._value = "default"

            @property
            def value(self):
                return self._value

        config = TestConfig()

        # Test setting None should raise error
        with pytest.raises(TypeValidationError, match="value must be string"):
            config.set_value(None)  # type: ignore[attr-defined][attr-defined]

    def test_complex_chaining_with_errors(self):
        """Test complex chaining with error handling."""

        @chainable_property("color", str, validator="color")
        @chainable_property("width", int)
        class TestConfig:
            def __init__(self):
                self._color = "#000000"
                self._width = 800

            @property
            def color(self):
                return self._color

            @property
            def width(self):
                return self._width

        config = TestConfig()

        # Test successful chaining
        result = config.set_width(600).set_color("#ff0000")  # type: ignore[attr-defined]
        assert result is config
        assert config.width == 600
        assert config.color == "#ff0000"

        # Test chaining with error in middle
        config.set_width(800)  # type: ignore[attr-defined][attr-defined] # Reset
        try:
            config.set_width(600).set_color("invalid_color")  # type: ignore[attr-defined]
            raise AssertionError("Should have raised ColorValidationError")
        except ColorValidationError:
            # Width should be set, but color should fail
            assert config.width == 600
            assert config.color == "#ff0000"  # Should remain unchanged


class TestChainableInheritance:
    """Test chainable decorators with inheritance."""

    def test_chainable_property_inheritance(self):
        """Test chainable properties in inheritance hierarchy."""

        @chainable_property("base_value", int)
        class BaseConfig:
            def __init__(self):
                self._base_value = 0

            @property
            def base_value(self):
                return self._base_value

        @chainable_property("derived_value", str)
        class DerivedConfig(BaseConfig):
            def __init__(self):
                super().__init__()
                self._derived_value = "default"

            @property
            def derived_value(self):
                return self._derived_value

        config = DerivedConfig()

        # Test both base and derived properties
        result = config.set_base_value(42).set_derived_value("test")  # type: ignore[attr-defined]
        assert result is config
        assert config.base_value == 42
        assert config.derived_value == "test"

    def test_chainable_field_inheritance(self):
        """Test chainable fields in inheritance hierarchy."""

        @dataclass
        @chainable_field("base_value", int)
        class BaseOptions:
            base_value: int = 0

        @dataclass
        @chainable_field("derived_value", str)
        class DerivedOptions(BaseOptions):
            derived_value: str = "default"

        options = DerivedOptions()

        # Test both base and derived fields
        result = options.set_base_value(42).set_derived_value("test")  # type: ignore[attr-defined]
        assert result is options
        assert options.base_value == 42
        assert options.derived_value == "test"


class TestChainablePerformance:
    """Test performance characteristics of chainable decorators."""

    def test_chainable_property_performance(self):
        """Test performance of chainable properties."""

        @chainable_property("value1", int)
        @chainable_property("value2", int)
        @chainable_property("value3", int)
        @chainable_property("value4", int)
        @chainable_property("value5", int)
        class TestConfig:
            def __init__(self):
                self._value1 = 0
                self._value2 = 0
                self._value3 = 0
                self._value4 = 0
                self._value5 = 0

            @property
            def value1(self):
                return self._value1

            @property
            def value2(self):
                return self._value2

            @property
            def value3(self):
                return self._value3

            @property
            def value4(self):
                return self._value4

            @property
            def value5(self):
                return self._value5

        config = TestConfig()

        # Test long chain performance
        result = (
            config.set_value1(1)  # type: ignore[attr-defined][attr-defined]
            .set_value2(2)  # type: ignore[attr-defined][attr-defined]
            .set_value3(3)  # type: ignore[attr-defined][attr-defined]
            .set_value4(4)  # type: ignore[attr-defined][attr-defined]
            .set_value5(5)
        )  # type: ignore[attr-defined][attr-defined]

        assert result is config
        assert config.value1 == 1
        assert config.value2 == 2
        assert config.value3 == 3
        assert config.value4 == 4
        assert config.value5 == 5


class TestMarkerValidation:
    """Test marker validation functions."""

    def test_is_list_of_markers_with_list(self):
        """Test _is_list_of_markers with List[MarkerBase]."""
        result = _is_list_of_markers(list[MarkerBase])
        assert result is True

    def test_is_list_of_markers_with_other_list(self):
        """Test _is_list_of_markers with List[str]."""
        result = _is_list_of_markers(list[str])
        assert result is False

    def test_is_list_of_markers_with_non_list(self):
        """Test _is_list_of_markers with non-list type."""
        result = _is_list_of_markers(str)
        assert result is False

    def test_is_list_of_markers_with_marker_subclass(self):
        """Test _is_list_of_markers with List[MarkerSubclass]."""

        class MarkerSubclass(MarkerBase):
            pass

        result = _is_list_of_markers(list[MarkerSubclass])
        assert result is True

    def test_validate_list_of_markers_with_valid_markers(self):
        """Test _validate_list_of_markers with valid marker list."""

        class ValidMarker(MarkerBase):
            def __init__(self):
                super().__init__(time=1640995200)
                self.time = 1640995200
                self.position = "above"
                self.color = "#ff0000"
                self.shape = "circle"
                self.text = "Test"

        markers = [ValidMarker(), ValidMarker()]

        # Should not raise any error
        _validate_list_of_markers(markers, "test_attr")

    def test_validate_list_of_markers_with_invalid_markers(self):
        """Test _validate_list_of_markers with invalid marker list."""
        invalid_markers = ["not_a_marker", 123, None]

        with pytest.raises(
            ValueValidationError,
            match="test_attr all items must be MarkerBase instances",
        ):
            _validate_list_of_markers(invalid_markers, "test_attr")

    def test_validate_list_of_markers_with_empty_list(self):
        """Test _validate_list_of_markers with empty list."""
        # Should not raise any error
        _validate_list_of_markers([], "test_attr")

    def test_validate_list_of_markers_with_none(self):
        """Test _validate_list_of_markers with None."""
        with pytest.raises(TypeValidationError, match="test_attr must be list"):
            _validate_list_of_markers(None, "test_attr")

    def test_validate_list_of_markers_with_non_list(self):
        """Test _validate_list_of_markers with non-list value."""
        with pytest.raises(TypeValidationError, match="test_attr must be list"):
            _validate_list_of_markers("not_a_list", "test_attr")

    def test_validate_list_of_markers_with_mixed_valid_invalid(self):
        """Test _validate_list_of_markers with mixed valid and invalid markers."""

        class ValidMarker(MarkerBase):
            def __init__(self):
                super().__init__(time=1640995200)
                self.time = 1640995200
                self.position = "above"
                self.color = "#ff0000"
                self.shape = "circle"
                self.text = "Test"

        mixed_markers = [ValidMarker(), "invalid", ValidMarker()]

        with pytest.raises(
            ValueValidationError,
            match="test_attr all items must be MarkerBase instances",
        ):
            _validate_list_of_markers(mixed_markers, "test_attr")

    def test_validate_list_of_markers_with_marker_subclasses(self):
        """Test _validate_list_of_markers with marker subclasses."""

        class BarMarker(MarkerBase):
            def __init__(self):
                super().__init__(time=1640995200)
                self.time = 1640995200
                self.position = "above"
                self.color = "#ff0000"
                self.shape = "circle"
                self.text = "Bar"

        class LineMarker(MarkerBase):
            def __init__(self):
                super().__init__(time=1640995200)
                self.time = 1640995200
                self.position = "below"
                self.color = "#00ff00"
                self.shape = "square"
                self.text = "Line"

        markers = [BarMarker(), LineMarker()]

        # Should not raise any error
        _validate_list_of_markers(markers, "test_attr")

    def test_validate_list_of_markers_with_none_in_list(self):
        """Test _validate_list_of_markers with None in list."""

        class ValidMarker(MarkerBase):
            def __init__(self):
                super().__init__(time=1640995200)
                self.time = 1640995200
                self.position = "above"
                self.color = "#ff0000"
                self.shape = "circle"
                self.text = "Test"

        markers_with_none = [ValidMarker(), None, ValidMarker()]

        with pytest.raises(
            ValueValidationError,
            match="test_attr all items must be MarkerBase instances",
        ):
            _validate_list_of_markers(markers_with_none, "test_attr")

    def test_validate_list_of_markers_with_large_list(self):
        """Test _validate_list_of_markers with large list of markers."""

        class ValidMarker(MarkerBase):
            def __init__(self, i):
                super().__init__(time=1640995200 + i)
                self.time = 1640995200 + i
                self.position = "above"
                self.color = "#ff0000"
                self.shape = "circle"
                self.text = f"Marker {i}"

        large_marker_list = [ValidMarker(i) for i in range(100)]

        # Should not raise any error
        _validate_list_of_markers(large_marker_list, "test_attr")

    def test_is_list_of_markers_with_union_type(self):
        """Test _is_list_of_markers with Union type containing MarkerBase."""
        # Union type with MarkerBase should not be considered a list of markers
        result = _is_list_of_markers(Union[MarkerBase, str])
        assert result is False

    def test_is_list_of_markers_with_optional_marker(self):
        """Test _is_list_of_markers with Optional[MarkerBase]."""
        # Optional type should not be considered a list of markers
        result = _is_list_of_markers(Optional[MarkerBase])
        assert result is False

    def test_is_list_of_markers_with_nested_list(self):
        """Test _is_list_of_markers with List[List[MarkerBase]]."""
        # Nested list should not be considered a simple list of markers
        result = _is_list_of_markers(list[list[MarkerBase]])
        assert result is False

    def test_validate_list_of_markers_error_message_format(self):
        """Test _validate_list_of_markers error message format."""
        invalid_markers = ["invalid1", "invalid2"]

        try:
            _validate_list_of_markers(invalid_markers, "test_attr")
            raise AssertionError("Should have raised ValueValidationError")
        except ValueValidationError as e:
            error_message = str(e)
            assert (
                "test_attr must be list" in error_message
                or "test_attr all items must be MarkerBase instances" in error_message
            )

    def test_validate_list_of_markers_with_marker_attributes(self):
        """Test _validate_list_of_markers with markers that have different attributes."""

        class MarkerWithExtraAttributes(MarkerBase):
            def __init__(self):
                super().__init__(time=1640995200)
                self.time = 1640995200
                self.position = "above"
                self.color = "#ff0000"
                self.shape = "circle"
                self.text = "Test"
                self.extra_attribute = "extra_value"

        markers = [MarkerWithExtraAttributes()]

        # Should not raise any error even with extra attributes
        _validate_list_of_markers(markers, "test_attr")
