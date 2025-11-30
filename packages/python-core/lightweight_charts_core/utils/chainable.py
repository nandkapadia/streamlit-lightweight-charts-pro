"""Chainable decorators for enabling fluent API design.

This module provides decorators that automatically create setter methods
for properties and dataclass fields, enabling method chaining with validation.
"""

from typing import Any, Callable, Optional, Type, Union, get_args, get_origin

from lightweight_charts_core.exceptions import (
    ColorValidationError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.utils.data_utils import (
    is_valid_color,
    validate_min_move,
    validate_precision,
    validate_price_format_type,
)


def _validate_value(field_name: str, value, value_type=None, validator=None):
    """Helper function to validate a value according to type and custom validators."""
    if value_type is not None:
        if value_type is bool:
            if not isinstance(value, bool):
                raise TypeValidationError("field", "boolean")
        elif not isinstance(value, value_type):
            raise TypeValidationError("value", "invalid type")

    if validator is not None:
        if isinstance(validator, str):
            if validator == "color":
                if value == "":
                    value = None
                elif not is_valid_color(value):
                    raise ColorValidationError(field_name, value)
            elif validator == "price_format_type":
                value = validate_price_format_type(value)
            elif validator == "precision":
                value = validate_precision(value)
            elif validator == "min_move":
                value = validate_min_move(value)
            else:
                raise ValueValidationError("validator", "unknown validator")
        else:
            value = validator(value)

    return value


def chainable_property(
    attr_name: str,
    value_type: Optional[Union[Type, tuple]] = None,
    validator: Optional[Union[Callable[[Any], Any], str]] = None,
    allow_none: bool = False,
    top_level: bool = False,
):
    """Decorator that creates both a property setter and a chaining method."""

    def decorator(cls):
        setter_name = f"set_{attr_name}"

        def setter_method(self, value):
            if value is None and allow_none:
                setattr(self, f"_{attr_name}", None)
                return self

            validated_value = _validate_value(attr_name, value, value_type, validator)
            setattr(self, f"_{attr_name}", validated_value)
            return self

        def property_getter(self):
            return getattr(self, f"_{attr_name}")

        def property_setter(self, value):
            if value is None and allow_none:
                setattr(self, f"_{attr_name}", None)
                return

            validated_value = _validate_value(attr_name, value, value_type, validator)
            setattr(self, f"_{attr_name}", validated_value)

        prop = property(property_getter, property_setter)
        setattr(cls, attr_name, prop)
        setattr(cls, setter_name, setter_method)

        if not hasattr(cls, "_chainable_properties"):
            cls._chainable_properties = {}

        cls._chainable_properties[attr_name] = {
            "allow_none": allow_none,
            "value_type": value_type,
            "top_level": top_level,
        }

        return cls

    return decorator


def chainable_field(
    field_name: str,
    value_type: Optional[Union[Type, tuple]] = None,
    validator: Optional[Union[Callable[[Any], Any], str]] = None,
    allow_none: bool = False,
):
    """Decorator that creates a setter method for dataclass fields."""

    def decorator(cls):
        setter_name = f"set_{field_name}"

        def setter_method(self, value):
            if value is None and allow_none:
                setattr(self, field_name, None)
                return self

            validated_value = _validate_value(field_name, value, value_type, validator)
            setattr(self, field_name, validated_value)
            return self

        setattr(cls, setter_name, setter_method)
        return cls

    return decorator


def validated_field(
    field_name: str,
    value_type: Optional[Union[Type, tuple]] = None,
    validator: Optional[Union[Callable[[Any], Any], str]] = None,
    allow_none: bool = False,
):
    """Decorator that validates dataclass fields on initialization."""

    def decorator(cls):
        cls = chainable_field(field_name, value_type, validator, allow_none)(cls)
        original_post_init = getattr(cls, "__post_init__", None)

        def new_post_init(self):
            if original_post_init is not None:
                original_post_init(self)

            value = getattr(self, field_name)

            if value is None and allow_none:
                return

            try:
                validated_value = _validate_value(field_name, value, value_type, validator)
                setattr(self, field_name, validated_value)
            except (TypeError, ValueError) as e:
                raise type(e)(
                    f"Validation error during initialization of '{field_name}': {e}"
                ) from e

        cls.__post_init__ = new_post_init

        if not hasattr(cls, "_validated_fields"):
            cls._validated_fields = []
        cls._validated_fields.append(field_name)

        return cls

    return decorator


__all__ = [
    "chainable_field",
    "chainable_property",
    "validated_field",
]
