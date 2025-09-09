"""
Tests for the chainable module.

This module tests the chainable decorators and validation functionality
for enabling method chaining on properties and fields.
"""

from dataclasses import dataclass
from typing import List
from unittest.mock import Mock, patch

import pytest

from streamlit_lightweight_charts_pro.data.marker import MarkerBase
from streamlit_lightweight_charts_pro.utils.chainable import (
    _is_list_of_markers,
    _validate_list_of_markers,
    chainable_field,
    chainable_property,
)


class TestMarkerValidation:
    """Test marker validation functions."""

    def test_is_list_of_markers_with_list(self):
        """Test _is_list_of_markers with List[MarkerBase]."""

        result = _is_list_of_markers(List[MarkerBase])
        assert result is True

    def test_is_list_of_markers_with_other_list(self):
        """Test _is_list_of_markers with List[str]."""

        result = _is_list_of_markers(List[str])
        assert result is False

    def test_is_list_of_markers_with_non_list(self):
        """Test _is_list_of_markers with non-list type."""
        result = _is_list_of_markers(str)
        assert result is False

    def test_is_list_of_markers_with_marker_subclass(self):
        """Test _is_list_of_markers with List[MarkerSubclass]."""

        class MarkerSubclass(MarkerBase):
            pass

        result = _is_list_of_markers(List[MarkerSubclass])
        assert result is True

    def test_validate_list_of_markers_valid(self):
        """Test _validate_list_of_markers with valid list."""
        marker1 = MarkerBase(time=123, position="aboveBar")
        marker2 = MarkerBase(time=456, position="belowBar")
        markers = [marker1, marker2]

        result = _validate_list_of_markers(markers, "test_attr")
        assert result is True

    def test_validate_list_of_markers_not_list(self):
        """Test _validate_list_of_markers with non-list value."""
        with pytest.raises(TypeError, match="test_attr must be a list"):
            _validate_list_of_markers("not a list", "test_attr")

    def test_validate_list_of_markers_invalid_item(self):
        """Test _validate_list_of_markers with invalid item."""
        marker1 = MarkerBase(time=123, position="aboveBar")
        invalid_item = "not a marker"
        markers = [marker1, invalid_item]

        with pytest.raises(
            TypeError, match="All items in test_attr must be instances of MarkerBase"
        ):
            _validate_list_of_markers(markers, "test_attr")

    def test_validate_list_of_markers_with_marker_like_objects(self):
        """Test _validate_list_of_markers with objects that have marker-like attributes."""
        with patch("streamlit_lightweight_charts_pro.data.marker.MarkerBase", new=None):
            # Mock objects with marker-like attributes
            marker1 = Mock()
            marker1.time = 123
            marker1.position = "aboveBar"

            marker2 = Mock()
            marker2.time = 456
            marker2.position = "belowBar"

            markers = [marker1, marker2]

            result = _validate_list_of_markers(markers, "test_attr")
            assert result is True

    def test_validate_list_of_markers_with_invalid_marker_like_objects(self):
        """Test _validate_list_of_markers with objects missing marker attributes."""
        with patch("streamlit_lightweight_charts_pro.data.marker.MarkerBase", new=None):
            # Object missing marker attributes
            class InvalidMarker:
                def __init__(self):
                    self.time = 123
                    # Missing position attribute

            invalid_marker = InvalidMarker()
            markers = [invalid_marker]

            with pytest.raises(TypeError, match="All items in test_attr must be valid markers"):
                _validate_list_of_markers(markers, "test_attr")


class TestChainableProperty:
    """Test chainable_property decorator."""

    def test_chainable_property_basic(self):
        """Test basic chainable property functionality."""

        @chainable_property("color", str)
        class TestClass:
            def __init__(self):
                self._color = None

        obj = TestClass()

        # Test property getter
        assert obj.color is None

        # Test property setter
        obj.color = "red"
        assert obj.color == "red"

        # Test chaining method
        result = obj.set_color("blue")
        assert result is obj
        assert obj.color == "blue"

    def test_chainable_property_with_type_validation(self):
        """Test chainable property with type validation."""

        @chainable_property("width", int)
        class TestClass:
            def __init__(self):
                self._width = None

        obj = TestClass()

        # Test valid type
        obj.width = 10
        assert obj.width == 10

        # Test invalid type
        with pytest.raises(TypeError, match="width must be an integer"):
            obj.width = "invalid"

        # Test chaining with valid type
        result = obj.set_width(20)
        assert result is obj
        assert obj.width == 20

        # Test chaining with invalid type
        with pytest.raises(TypeError, match="width must be an integer"):
            obj.set_width("invalid")

    def test_chainable_property_with_boolean_validation(self):
        """Test chainable property with strict boolean validation."""

        @chainable_property("enabled", bool)
        class TestClass:
            def __init__(self):
                self._enabled = False

        obj = TestClass()

        # Test valid boolean values
        obj.enabled = True
        assert obj.enabled is True

        obj.enabled = False
        assert obj.enabled is False

        # Test invalid values should raise TypeError
        with pytest.raises(TypeError, match="enabled must be a boolean"):
            obj.enabled = 1

        with pytest.raises(TypeError, match="enabled must be a boolean"):
            obj.enabled = "true"

        with pytest.raises(TypeError, match="enabled must be a boolean"):
            obj.enabled = 0

        with pytest.raises(TypeError, match="enabled must be a boolean"):
            obj.enabled = ""

    def test_chainable_property_with_allow_none(self):
        """Test chainable property with allow_none=True."""

        @chainable_property("value", str, allow_none=True)
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        # Test None value
        obj.value = None
        assert obj.value is None

        # Test string value
        obj.value = "test"
        assert obj.value == "test"

        # Test chaining with None
        result = obj.set_value(None)
        assert result is obj
        assert obj.value is None

    def test_chainable_property_without_allow_none(self):
        """Test chainable property without allow_none (default False)."""

        @chainable_property("value", str)
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        # Test None value should raise error
        with pytest.raises(TypeError, match="value must be a string"):
            obj.value = None

    def test_chainable_property_with_custom_validator(self):
        """Test chainable property with custom validator function."""

        def validate_positive(value):
            if value <= 0:
                raise ValueError("Value must be positive")
            return value

        @chainable_property("count", int, validator=validate_positive)
        class TestClass:
            def __init__(self):
                self._count = 0

        obj = TestClass()

        # Test valid value
        obj.count = 5
        assert obj.count == 5

        # Test invalid value
        with pytest.raises(ValueError, match="Value must be positive"):
            obj.count = -1

        # Test chaining with valid value
        result = obj.set_count(10)
        assert result is obj
        assert obj.count == 10

    def test_chainable_property_with_builtin_validator_color(self):
        """Test chainable property with built-in color validator."""

        @chainable_property("color", str, validator="color")
        class TestClass:
            def __init__(self):
                self._color = None

        obj = TestClass()

        # Test valid hex color
        obj.color = "#FF0000"
        assert obj.color == "#FF0000"

        # Test valid rgba color
        obj.color = "rgba(255, 0, 0, 0.5)"
        assert obj.color == "rgba(255, 0, 0, 0.5)"

        # Test invalid color
        with pytest.raises(ValueError, match="Invalid color format"):
            obj.color = "invalid_color"

    def test_chainable_property_with_builtin_validator_price_format_type(self):
        """Test chainable property with built-in price_format_type validator."""

        @chainable_property("format", str, validator="price_format_type")
        class TestClass:
            def __init__(self):
                self._format = None

        obj = TestClass()

        # Test valid format
        obj.format = "price"
        assert obj.format == "price"

        # Test invalid format
        with pytest.raises(ValueError):
            obj.format = "invalid_format"

    def test_chainable_property_with_builtin_validator_precision(self):
        """Test chainable property with built-in precision validator."""

        @chainable_property("precision", int, validator="precision")
        class TestClass:
            def __init__(self):
                self._precision = None

        obj = TestClass()

        # Test valid precision
        obj.precision = 2
        assert obj.precision == 2

        # Test invalid precision
        with pytest.raises(ValueError):
            obj.precision = -1

    def test_chainable_property_with_builtin_validator_min_move(self):
        """Test chainable property with built-in min_move validator."""

        @chainable_property("min_move", float, validator="min_move")
        class TestClass:
            def __init__(self):
                self._min_move = None

        obj = TestClass()

        # Test valid min_move
        obj.min_move = 0.01
        assert obj.min_move == 0.01

        # Test invalid min_move
        with pytest.raises(ValueError):
            obj.min_move = -0.01

    def test_chainable_property_with_unknown_builtin_validator(self):
        """Test chainable property with unknown built-in validator."""

        @chainable_property("value", str, validator="unknown_validator")
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        with pytest.raises(ValueError, match="Unknown built-in validator"):
            obj.value = "test"

    def test_chainable_property_with_tuple_type(self):
        """Test chainable property with tuple type validation."""

        @chainable_property("value", (int, float))
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        # Test valid int
        obj.value = 10
        assert obj.value == 10

        # Test valid float
        obj.value = 10.5
        assert obj.value == 10.5

        # Test invalid type
        with pytest.raises(TypeError, match="value must be a number"):
            obj.value = "invalid"

    def test_chainable_property_with_complex_type(self):
        """Test chainable property with complex type validation."""

        class CustomType:
            pass

        @chainable_property("value", CustomType)
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        # Test valid type
        custom_obj = CustomType()
        obj.value = custom_obj
        assert obj.value == custom_obj

        # Test invalid type
        with pytest.raises(TypeError, match="value must be an instance of CustomType"):
            obj.value = "invalid"

    def test_chainable_property_with_complex_type_allow_none(self):
        """Test chainable property with complex type and allow_none."""

        class CustomType:
            pass

        @chainable_property("value", CustomType, allow_none=True)
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        # Test None value
        obj.value = None
        assert obj.value is None

        # Test valid type
        custom_obj = CustomType()
        obj.value = custom_obj
        assert obj.value == custom_obj

        # Test invalid type
        with pytest.raises(TypeError, match="value must be an instance of CustomType or None"):
            obj.value = "invalid"

    def test_chainable_property_with_list_of_markers(self):
        """Test chainable property with List[MarkerBase] type."""

        @chainable_property("markers", List[MarkerBase])
        class TestClass:
            def __init__(self):
                self._markers = None

        obj = TestClass()

        # Test valid markers
        marker1 = Mock(spec=MarkerBase)
        marker2 = Mock(spec=MarkerBase)
        markers = [marker1, marker2]

        obj.markers = markers
        assert obj.markers == markers

        # Test invalid markers
        with pytest.raises(TypeError, match="markers must be a list"):
            obj.markers = "not a list"

        with pytest.raises(TypeError, match="All items in markers must be instances of MarkerBase"):
            obj.markers = [marker1, "invalid"]

    def test_chainable_property_metadata_storage(self):
        """Test that chainable property metadata is stored correctly."""

        @chainable_property("value1", str, allow_none=True, top_level=True)
        @chainable_property("value2", int, top_level=False)
        class TestClass:
            def __init__(self):
                self._value1 = None
                self._value2 = None

        TestClass()

        # Check that metadata is stored
        assert hasattr(TestClass, "_chainable_properties")
        assert "value1" in TestClass._chainable_properties
        assert "value2" in TestClass._chainable_properties

        # Check metadata values
        assert TestClass._chainable_properties["value1"]["allow_none"] is True
        assert TestClass._chainable_properties["value1"]["top_level"] is True
        assert TestClass._chainable_properties["value1"]["value_type"] == str

        assert TestClass._chainable_properties["value2"]["allow_none"] is False
        assert TestClass._chainable_properties["value2"]["top_level"] is False
        assert TestClass._chainable_properties["value2"]["value_type"] == int


class TestChainableField:
    """Test chainable_field decorator."""

    def test_chainable_field_basic(self):
        """Test basic chainable field functionality."""

        @dataclass
        @chainable_field("color", str)
        class TestClass:
            color: str = None

        obj = TestClass()

        # Test direct assignment
        obj.color = "red"
        assert obj.color == "red"

        # Test chaining method
        result = obj.set_color("blue")
        assert result is obj
        assert obj.color == "blue"

    def test_chainable_field_with_type_validation(self):
        """Test chainable field with type validation."""

        @dataclass
        @chainable_field("width", int)
        class TestClass:
            width: int = None

        obj = TestClass()

        # Test valid type using setter method
        obj.set_width(10)
        assert obj.width == 10

        # Test invalid type using setter method
        with pytest.raises(
            TypeError, match="width must be of type <class 'int'>, got <class 'str'>"
        ):
            obj.set_width("invalid")

        # Test chaining with valid type
        result = obj.set_width(20)
        assert result is obj
        assert obj.width == 20

        # Test chaining with invalid type
        with pytest.raises(
            TypeError, match="width must be of type <class 'int'>, got <class 'str'>"
        ):
            obj.set_width("invalid")

    def test_chainable_field_with_custom_validator(self):
        """Test chainable field with custom validator function."""

        def validate_positive(value):
            if value <= 0:
                raise ValueError("Value must be positive")
            return value

        @dataclass
        @chainable_field("count", int, validator=validate_positive)
        class TestClass:
            count: int = 0

        obj = TestClass()

        # Test valid value using setter method
        obj.set_count(5)
        assert obj.count == 5

        # Test invalid value using setter method
        with pytest.raises(ValueError, match="Value must be positive"):
            obj.set_count(-1)

        # Test chaining with valid value
        result = obj.set_count(10)
        assert result is obj
        assert obj.count == 10

    def test_chainable_field_with_builtin_validator_color(self):
        """Test chainable field with built-in color validator."""

        @dataclass
        @chainable_field("color", str, validator="color")
        class TestClass:
            color: str = None

        obj = TestClass()

        # Test valid hex color using setter method
        obj.set_color("#FF0000")
        assert obj.color == "#FF0000"

        # Test valid rgba color using setter method
        obj.set_color("rgba(255, 0, 0, 0.5)")
        assert obj.color == "rgba(255, 0, 0, 0.5)"

        # Test invalid color using setter method
        with pytest.raises(ValueError, match="Invalid color format"):
            obj.set_color("invalid_color")

    def test_chainable_field_with_list_of_markers(self):
        """Test chainable field with List[MarkerBase] type."""

        @dataclass
        @chainable_field("markers", List[MarkerBase])
        class TestClass:
            markers: List[MarkerBase] = None

        obj = TestClass()

        # Test valid markers using setter method
        marker1 = Mock(spec=MarkerBase)
        marker2 = Mock(spec=MarkerBase)
        markers = [marker1, marker2]

        obj.set_markers(markers)
        assert obj.markers == markers

        # Test invalid markers using setter method
        with pytest.raises(TypeError, match="markers must be a list"):
            obj.set_markers("not a list")

        with pytest.raises(TypeError, match="All items in markers must be instances of MarkerBase"):
            obj.set_markers([marker1, "invalid"])

    def test_chainable_field_multiple_fields(self):
        """Test chainable field with multiple fields."""

        @dataclass
        @chainable_field("color", str)
        @chainable_field("width", int)
        @chainable_field("enabled", bool)
        class TestClass:
            color: str = None
            width: int = None
            enabled: bool = False

        obj = TestClass()

        # Test all fields
        obj.color = "red"
        obj.width = 10
        obj.enabled = True

        assert obj.color == "red"
        assert obj.width == 10
        assert obj.enabled is True

        # Test chaining
        result = obj.set_color("blue").set_width(20).set_enabled(False)
        assert result is obj
        assert obj.color == "blue"
        assert obj.width == 20
        assert obj.enabled is False


class TestChainableErrorMessages:
    """Test error message generation in chainable decorators."""

    def test_error_message_string_type(self):
        """Test error message for string type."""

        @chainable_property("name", str)
        class TestClass:
            def __init__(self):
                self._name = None

        obj = TestClass()

        with pytest.raises(TypeError, match="name must be a string"):
            obj.name = 123

    def test_error_message_int_type(self):
        """Test error message for int type."""

        @chainable_property("count", int)
        class TestClass:
            def __init__(self):
                self._count = None

        obj = TestClass()

        with pytest.raises(TypeError, match="count must be an integer"):
            obj.count = "invalid"

    def test_error_message_float_type(self):
        """Test error message for float type."""

        @chainable_property("price", float)
        class TestClass:
            def __init__(self):
                self._price = None

        obj = TestClass()

        with pytest.raises(TypeError, match="price must be a number"):
            obj.price = "invalid"

    def test_error_message_bool_type(self):
        """Test error message for bool type."""

        @chainable_property("flag", bool)
        class TestClass:
            def __init__(self):
                self._flag = None

        obj = TestClass()

        with pytest.raises(TypeError, match="flag must be a boolean"):
            obj.flag = "invalid"

    def test_error_message_complex_type(self):
        """Test error message for complex type."""

        class CustomType:
            pass

        @chainable_property("value", CustomType)
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        with pytest.raises(TypeError, match="value must be an instance of CustomType"):
            obj.value = "invalid"

    def test_error_message_complex_type_allow_none(self):
        """Test error message for complex type with allow_none."""

        class CustomType:
            pass

        @chainable_property("value", CustomType, allow_none=True)
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        with pytest.raises(TypeError, match="value must be an instance of CustomType or None"):
            obj.value = "invalid"

    def test_error_message_tuple_type(self):
        """Test error message for tuple type."""

        @chainable_property("value", (int, float))
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        with pytest.raises(TypeError, match="value must be a number"):
            obj.value = "invalid"

    def test_error_message_tuple_type_non_numeric(self):
        """Test error message for tuple type with non-numeric types."""

        @chainable_property("value", (str, int))
        class TestClass:
            def __init__(self):
                self._value = None

        obj = TestClass()

        with pytest.raises(TypeError, match="value must be one of str, int"):
            obj.value = 1.5
