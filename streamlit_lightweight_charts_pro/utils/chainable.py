"""
Chainable decorators for enabling method chaining on properties and fields.

This module provides decorators that automatically create setter methods
for properties and dataclass fields, allowing both direct assignment and
method chaining styles with optional type validation.

The module provides two main decorators:
    - chainable_property: Creates both property setters and chaining methods
    - chainable_field: Creates setter methods for dataclass fields

These decorators enable the fluent API design pattern used throughout the library,
allowing for intuitive method chaining when building charts and configuring options.

Features:
    - Automatic type validation with customizable validators
    - Support for both property assignment and method chaining
    - Built-in validators for common types (colors, precision, etc.)
    - Special handling for marker lists and complex types
    - Optional None value support
    - Top-level property configuration for serialization

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.utils import chainable_property, chainable_field

    # Using chainable_property for class properties
    @chainable_property("color", str, validator="color")
    @chainable_property("width", int)
    class ChartConfig:
        def __init__(self):
            self._color = "#000000"
            self._width = 800

    # Using chainable_field for dataclass fields
    @dataclass
    @chainable_field("color", str)
    @chainable_field("width", int)
    class Options:
        color: str = "#000000"
        width: int = 800

    # Usage examples
    config = ChartConfig()
    config.color = "#ff0000"  # Property assignment
    config.set_width(600).set_color("#00ff00")  # Method chaining
    ```

Built-in Validators:
    - "color": Validates hex color codes and rgba values
    - "price_format_type": Validates price format types
    - "precision": Validates precision values
    - "min_move": Validates minimum move values

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

from typing import Any, Callable, Optional, Type, Union, get_args, get_origin

from .data_utils import (
    is_valid_color,
    validate_min_move,
    validate_precision,
    validate_price_format_type,
)


def _is_list_of_markers(value_type) -> bool:
    """
    Check if the type is List[MarkerBase] or similar.

    This function examines the type annotation to determine if it represents
    a list of marker objects. It handles both direct MarkerBase types and
    subclasses, with fallback logic for cases where MarkerBase cannot be imported.

    Args:
        value_type: The type to check, typically from type annotations.

    Returns:
        bool: True if the type represents a list of markers, False otherwise.

    Note:
        This function uses lazy loading to avoid circular import issues
        with the marker module.
    """
    if get_origin(value_type) is list:
        args = get_args(value_type)
        if args:
            arg_type = args[0]
            # Check if it's MarkerBase or a subclass
            try:
                # Lazy load MarkerBase to avoid circular imports
                # pylint: disable=import-outside-toplevel
                from streamlit_lightweight_charts_pro.data.marker import MarkerBase

                return issubclass(arg_type, MarkerBase) if hasattr(arg_type, "__mro__") else False
            except ImportError:
                # If we can't import MarkerBase, check the name
                return hasattr(arg_type, "__name__") and "Marker" in arg_type.__name__
    return False


def _validate_list_of_markers(value, attr_name: str) -> bool:
    """
    Validate that a value is a list of markers.

    This function performs runtime validation to ensure that a value is a list
    containing valid marker objects. It checks both the list structure and
    the marker properties of each item.

    Args:
        value: The value to validate.
        attr_name: The name of the attribute being validated, used in error messages.

    Returns:
        bool: True if the value is a valid list of markers.

    Raises:
        TypeError: If the value is not a list or contains invalid marker objects.

    Note:
        This function uses lazy loading to avoid circular import issues
        with the marker module.
    """
    if not isinstance(value, list):
        raise TypeError(f"{attr_name} must be a list")

    try:
        # Lazy load MarkerBase to avoid circular imports
        # pylint: disable=import-outside-toplevel
        from streamlit_lightweight_charts_pro.data.marker import MarkerBase

        if MarkerBase is not None:
            for item in value:
                if not isinstance(item, MarkerBase):
                    raise TypeError(f"All items in {attr_name} must be instances of MarkerBase")
        else:
            # If MarkerBase is None (e.g., when patched), check for marker-like attributes
            for item in value:
                if not hasattr(item, "time") or not hasattr(item, "position"):
                    raise TypeError(f"All items in {attr_name} must be valid markers")
    except ImportError as exc:
        # If we can't import MarkerBase, just check that all items have marker-like attributes
        for item in value:
            if not hasattr(item, "time") or not hasattr(item, "position"):
                raise TypeError(f"All items in {attr_name} must be valid markers") from exc
    return True


def chainable_property(
    attr_name: str,
    value_type: Optional[Union[Type, tuple]] = None,
    validator: Optional[Union[Callable[[Any], Any], str]] = None,
    allow_none: bool = False,
    top_level: bool = False,
):
    """
    Decorator that creates both a property setter and a chaining method with optional validation.

    This decorator enables two usage patterns for the same attribute:
    1. Property assignment: `obj.attr = value`
    2. Method chaining: `obj.set_attr(value).other_method()`

    The decorator automatically creates both the property setter and a chaining
    method, applying the same validation logic to both. This provides flexibility
    in how developers interact with the API while maintaining consistency.

    Args:
        attr_name: The name of the attribute to manage. This will be used to create
            both the property name and the setter method name (e.g., "color" creates
            both a "color" property and a "set_color" method).
        value_type: Optional type or tuple of types for validation. If provided,
            the value will be checked against this type before assignment.
            Common types: str, int, float, bool, or custom classes.
        validator: Optional validation function or string identifier. If callable,
            it should take a value and return the validated/transformed value.
            If string, uses built-in validators: "color", "price_format_type",
            "precision", "min_move".
        allow_none: Whether to allow None values. If True, None values bypass
            type validation but still go through custom validators.
        top_level: Whether this property should be output at the top level in
            asdict() instead of in the options dictionary. Useful for properties
            that should be serialized separately from the main options.

    Returns:
        Decorator function that modifies the class to add both property and method.

    Raises:
        TypeError: If the value doesn't match the specified type.
        ValueError: If the value fails custom validation.
        AttributeError: If the attribute name conflicts with existing attributes.

    Example:
        ```python
        @chainable_property("color", str, validator="color")
        @chainable_property("width", int)
        @chainable_property("line_options", LineOptions, allow_none=True)
        @chainable_property("base_value", validator=validate_base_value)
        @chainable_property("price_scale_id", top_level=True)
        class MySeries(Series):
            def __init__(self):
                self._color = "#000000"
                self._width = 800
                self._line_options = None
                self._base_value = 0
                self._price_scale_id = "right"

        # Usage examples
        series = MySeries()

        # Property assignment
        series.color = "#ff0000"
        series.width = 600

        # Method chaining
        series.set_color("#00ff00").set_width(800)

        # With validation
        series.set_color("invalid")  # Raises ValueError
        series.set_width("not_a_number")  # Raises TypeError
        ```

    Note:
        The decorator creates both a property setter and a method, so the class
        must have the corresponding private attribute (e.g., `_color` for `color`).
        The property getter is not created automatically - you may need to add
        it manually if needed.
    """

    def decorator(cls):
        # Create the setter method name
        setter_name = f"set_{attr_name}"

        # Create the chaining setter method with validation
        def setter_method(self, value):
            # Handle None values
            if value is None and allow_none:
                setattr(self, f"_{attr_name}", None)
                return self

            # Apply type validation if specified
            if value_type is not None:
                if value_type == bool:
                    # For boolean properties, only accept actual boolean values
                    if not isinstance(value, bool):
                        raise TypeError(f"{attr_name} must be a boolean")
                elif not isinstance(value, value_type):
                    # Create user-friendly error message
                    if value_type == str:
                        raise TypeError(f"{attr_name} must be a string")
                    elif value_type == int:
                        raise TypeError(f"{attr_name} must be an integer")
                    elif value_type == float:
                        raise TypeError(f"{attr_name} must be a number")
                    elif value_type == bool:
                        raise TypeError(f"{attr_name} must be a boolean")
                    elif hasattr(value_type, "__name__"):
                        # For complex types, use a more user-friendly message
                        if allow_none:
                            raise TypeError(
                                f"{attr_name} must be an instance of {value_type.__name__} or None"
                            )
                        else:
                            raise TypeError(
                                f"{attr_name} must be an instance of {value_type.__name__}"
                            )
                    elif isinstance(value_type, tuple):
                        # For tuple types like (int, float), create a user-friendly message
                        type_names = [
                            t.__name__ if hasattr(t, "__name__") else str(t) for t in value_type
                        ]
                        if len(type_names) == 2 and "int" in type_names and "float" in type_names:
                            raise TypeError(f"{attr_name} must be a number")
                        else:
                            raise TypeError(f"{attr_name} must be one of {', '.join(type_names)}")
                    else:
                        raise TypeError(
                            f"{attr_name} must be of type {value_type}, got {type(value)}"
                        )

            # Apply custom validation if specified
            if validator is not None:
                if isinstance(validator, str):
                    # Built-in validators
                    if validator == "color":
                        if not is_valid_color(value):
                            raise ValueError(
                                f"Invalid color format for {attr_name}: {value!r}. "
                                "Must be hex or rgba."
                            )
                    elif validator == "price_format_type":
                        value = validate_price_format_type(value)
                    elif validator == "precision":
                        value = validate_precision(value)
                    elif validator == "min_move":
                        value = validate_min_move(value)
                    else:
                        raise ValueError(f"Unknown built-in validator: {validator}")
                else:
                    # Custom validator function
                    value = validator(value)

            setattr(self, f"_{attr_name}", value)
            return self

        # Create the property getter
        def property_getter(self):
            return getattr(self, f"_{attr_name}")

        # Create the property setter
        def property_setter(self, value):
            # Handle None values
            if value is None and allow_none:
                setattr(self, f"_{attr_name}", None)
                return

            # Apply type validation if specified
            if value_type is not None:
                if value_type == bool:
                    # For boolean properties, only accept actual boolean values
                    if not isinstance(value, bool):
                        raise TypeError(f"{attr_name} must be a boolean")
                elif _is_list_of_markers(value_type):
                    # Special handling for List[MarkerBase] and similar types
                    _validate_list_of_markers(value, attr_name)
                elif not isinstance(value, value_type):
                    # Create user-friendly error message
                    if value_type == str:
                        raise TypeError(f"{attr_name} must be a string")
                    elif value_type == int:
                        raise TypeError(f"{attr_name} must be an integer")
                    elif value_type == float:
                        raise TypeError(f"{attr_name} must be a number")
                    elif value_type == bool:
                        raise TypeError(f"{attr_name} must be a boolean")
                    elif hasattr(value_type, "__name__"):
                        # For complex types, use a more user-friendly message
                        if allow_none:
                            raise TypeError(
                                f"{attr_name} must be an instance of {value_type.__name__} or None"
                            )
                        else:
                            raise TypeError(
                                f"{attr_name} must be an instance of {value_type.__name__}"
                            )
                    elif isinstance(value_type, tuple):
                        # For tuple types like (int, float), create a user-friendly message
                        type_names = [
                            t.__name__ if hasattr(t, "__name__") else str(t) for t in value_type
                        ]
                        if len(type_names) == 2 and "int" in type_names and "float" in type_names:
                            raise TypeError(f"{attr_name} must be a number")
                        else:
                            raise TypeError(f"{attr_name} must be one of {', '.join(type_names)}")
                    else:
                        raise TypeError(
                            f"{attr_name} must be of type {value_type}, got {type(value)}"
                        )

            # Apply custom validation if specified
            if validator is not None:
                if isinstance(validator, str):
                    # Built-in validators
                    if validator == "color":
                        if not is_valid_color(value):
                            raise ValueError(
                                f"Invalid color format for {attr_name}: {value!r}. "
                                "Must be hex or rgba."
                            )
                    elif validator == "price_format_type":
                        value = validate_price_format_type(value)
                    elif validator == "precision":
                        value = validate_precision(value)
                    elif validator == "min_move":
                        value = validate_min_move(value)
                    else:
                        raise ValueError(f"Unknown built-in validator: {validator}")
                else:
                    # Custom validator function
                    value = validator(value)

            setattr(self, f"_{attr_name}", value)

        # Create the property
        prop = property(property_getter, property_setter)

        # Add the property and method to the class
        setattr(cls, attr_name, prop)
        setattr(cls, setter_name, setter_method)

        # Store metadata about serialization
        if not hasattr(cls, "_chainable_properties"):
            # pylint: disable=protected-access
            cls._chainable_properties = {}

        # pylint: disable=protected-access
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
):
    """
    Decorator that creates a setter method for dataclass fields with optional validation.

    This decorator enables method chaining for dataclass fields by creating a setter
    method that applies validation and returns the instance for chaining. Unlike
    chainable_property, this only creates the method and doesn't override direct
    assignment behavior.

    The created method follows the naming convention `set_{field_name}` and applies
    the same validation logic as chainable_property, but only when the method is
    explicitly called.

    Args:
        field_name: The name of the dataclass field to create a setter for.
            The method will be named `set_{field_name}`.
        value_type: Optional type or tuple of types for validation. If provided,
            the value will be checked against this type before assignment.
            Common types: str, int, float, bool, or custom classes.
        validator: Optional validation function or string identifier. If callable,
            it should take a value and return the validated/transformed value.
            If string, uses built-in validators: "color", "price_format_type",
            "precision", "min_move".

    Returns:
        Decorator function that modifies the class to add a setter method.

    Raises:
        TypeError: If the value doesn't match the specified type.
        ValueError: If the value fails custom validation.
        AttributeError: If the field name conflicts with existing attributes.

    Example:
        ```python
        from dataclasses import dataclass
        from streamlit_lightweight_charts_pro.utils import chainable_field

        @dataclass
        @chainable_field("color", str, validator="color")
        @chainable_field("width", int)
        @chainable_field("line_options", LineOptions)
        class MyOptions:
            color: str = "#000000"
            width: int = 800
            line_options: Optional[LineOptions] = None

        # Usage examples
        options = MyOptions()

        # Method chaining (with validation)
        options.set_color("#ff0000").set_width(600)

        # Direct assignment (no validation)
        options.color = "invalid_color"  # No validation applied
        options.set_color("invalid_color")  # Raises ValueError
        ```

    Note:
        Direct assignment to dataclass fields bypasses validation. Use the
        generated setter methods when validation is required.
    """

    def decorator(cls):
        # Create the setter method name
        setter_name = f"set_{field_name}"

        # Create the chaining setter method with validation
        def setter_method(self, value):
            # Apply validation and set the value
            validated_value = _validate_value(field_name, value, value_type, validator)
            setattr(self, field_name, validated_value)
            return self

        # Add the method to the class
        setattr(cls, setter_name, setter_method)

        return cls

    return decorator


def _validate_value(field_name: str, value, value_type=None, validator=None):
    """
    Helper function to validate a value according to type and custom validators.

    This function applies both type checking and custom validation to a value
    before it is assigned to a field or property. It supports built-in validators
    for common types and custom validation functions.

    Args:
        field_name: The name of the field being validated, used in error messages.
        value: The value to validate.
        value_type: Optional type or tuple of types to check against.
        validator: Optional validation function or string identifier for built-in
            validators: "color", "price_format_type", "precision", "min_move".

    Returns:
        The validated value, which may be transformed by custom validators.

    Raises:
        TypeError: If the value doesn't match the specified type.
        ValueError: If the value fails custom validation.

    Note:
        Boolean values have special handling - only actual boolean values are
        accepted, not truthy/falsy values. This prevents accidental type coercion.
    """
    # Apply type validation if specified
    if value_type is not None:
        if value_type == bool:
            # For boolean fields, only accept actual boolean values
            if not isinstance(value, bool):
                raise TypeError(f"{field_name} must be a boolean")
        elif _is_list_of_markers(value_type):
            # Special handling for List[MarkerBase] and similar types
            _validate_list_of_markers(value, field_name)
        elif not isinstance(value, value_type):
            raise TypeError(f"{field_name} must be of type {value_type}, got {type(value)}")

    # Apply custom validation if specified
    if validator is not None:
        if isinstance(validator, str):
            # Built-in validators
            if validator == "color":
                if not is_valid_color(value):
                    raise ValueError(
                        f"Invalid color format for {field_name}: {value!r}. Must be hex or rgba."
                    )
            elif validator == "price_format_type":
                value = validate_price_format_type(value)
            elif validator == "precision":
                value = validate_precision(value)
            elif validator == "min_move":
                value = validate_min_move(value)
            else:
                raise ValueError(f"Unknown built-in validator: {validator}")
        else:
            # Custom validator function
            value = validator(value)
    return value
