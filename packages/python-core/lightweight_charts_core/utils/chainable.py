"""Chainable decorators for enabling fluent API design in financial chart configuration.

This module provides powerful decorators that automatically create setter methods
for properties and dataclass fields, enabling both direct assignment and method
chaining styles with comprehensive type validation and error handling.

The module implements the fluent API design pattern used throughout the library,
allowing for intuitive and readable method chaining when building charts and
configuring options. This creates a more developer-friendly experience while
maintaining type safety and validation.

Key Features:
    - Automatic type validation with customizable validators
    - Support for both property assignment and method chaining
    - Built-in validators for common chart types (colors, precision, etc.)
    - Special handling for complex types (marker lists, nested objects)
    - Optional None value support for flexible configuration
    - Top-level property configuration for serialization control
    - Comprehensive error handling with descriptive messages
    - Support for Union types and generic type checking

Example Usage:
    ```python
    from lightweight_charts_core.utils import chainable_property, chainable_field
    from dataclasses import dataclass


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
    config.color = "#ff0000"  # Direct property assignment
    config.set_width(600).set_color("#00ff00")  # Method chaining
    ```

Built-in Validators:
    - "color": Validates hex color codes and rgba values
    - "price_format_type": Validates price format types
    - "precision": Validates precision values for price formatting
    - "min_move": Validates minimum move values for price scales

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from collections.abc import Callable
from typing import Any, get_args, get_origin

# Local Imports
from ..exceptions import (
    ColorValidationError,
    InstanceTypeError,
    TypeMismatchError,
    TypeValidationError,
    ValueValidationError,
)
from .data_utils import (
    is_valid_color,
    validate_min_move,
    validate_precision,
    validate_price_format_type,
)


def _is_list_of_markers(value_type) -> bool:
    """Check if the type is List[MarkerBase] or similar.

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
                from lightweight_charts_core.data.marker import MarkerBase

                return issubclass(arg_type, MarkerBase) if hasattr(arg_type, "__mro__") else False
            except ImportError:
                # If we can't import MarkerBase, check the name
                return hasattr(arg_type, "__name__") and "Marker" in arg_type.__name__
    return False


def _validate_list_of_markers(value, attr_name: str) -> bool:
    """Validate that a value is a list of markers.

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
        raise TypeValidationError(attr_name, "list")

    try:
        # Lazy load MarkerBase to avoid circular imports
        # pylint: disable=import-outside-toplevel
        from lightweight_charts_core.data.marker import MarkerBase

        if MarkerBase is not None:
            for item in value:
                if not isinstance(item, MarkerBase):
                    raise ValueValidationError(attr_name, "all items must be MarkerBase instances")
        else:
            # If MarkerBase is None (e.g., when patched), check for marker-like attributes
            for item in value:
                if not hasattr(item, "time") or not hasattr(item, "position"):
                    raise ValueValidationError(attr_name, "all items must be valid markers")
    except ImportError as exc:
        # If we can't import MarkerBase, just check that all items have marker-like attributes
        for item in value:
            if not hasattr(item, "time") or not hasattr(item, "position"):
                raise ValueValidationError(attr_name, "all items must be valid markers") from exc
    return True


def chainable_property(
    attr_name: str,
    value_type: type | tuple | None = None,
    validator: Callable[[Any], Any] | str | None = None,
    allow_none: bool = False,
    top_level: bool = False,
):
    """Decorator that creates both a property setter and a chaining method with optional validation.

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
        """Inner decorator function that modifies the class.

        Args:
            cls: The class to be decorated.

        Returns:
            The modified class with added property and setter method.

        """
        # Step 1: Create the setter method name following convention set_{field}
        setter_name = f"set_{attr_name}"

        def setter_method(self, value):
            """Chainable setter method with validation.

            Args:
                self: The instance being modified.
                value: The new value to set.

            Returns:
                Self for method chaining.

            """
            # Step 1: Handle None values early if they're allowed
            # This bypasses all validation when None is explicitly permitted
            if value is None and allow_none:
                setattr(self, f"_{attr_name}", None)
                return self

            # Step 2: Apply type validation if specified
            # Checks that the value matches the expected type before assignment
            if value_type is not None:
                if value_type is bool:
                    # Case 1: Boolean type - strict validation (no truthy/falsy coercion)
                    # Only accept actual True/False, not 1/0 or other truthy values
                    if not isinstance(value, bool):
                        raise TypeValidationError(attr_name, "boolean")
                elif not isinstance(value, value_type):
                    # Case 2: Type mismatch - create user-friendly error messages
                    # Provide specific error messages for common types
                    if value_type is str:
                        raise TypeValidationError(attr_name, "string")
                    if value_type is int:
                        raise TypeValidationError(attr_name, "integer")
                    if value_type is float:
                        raise TypeValidationError(attr_name, "number")
                    if value_type is bool:
                        raise TypeValidationError(attr_name, "boolean")
                    if hasattr(value_type, "__name__"):
                        # Case 3: Complex types (classes, custom types)
                        # Indicate whether None is allowed in the error message
                        if allow_none:
                            raise InstanceTypeError(attr_name, value_type, allow_none=True)
                        raise InstanceTypeError(attr_name, value_type)
                    if isinstance(value_type, tuple):
                        # Case 4: Union types like (int, float)
                        # Create friendly error message from type names
                        type_names = [
                            t.__name__ if hasattr(t, "__name__") else str(t) for t in value_type
                        ]
                        # Special handling for numeric union types
                        if len(type_names) == 2 and "int" in type_names and "float" in type_names:
                            raise TypeValidationError(attr_name, "number")
                        raise TypeMismatchError(attr_name, value_type, type(value))

            # Step 3: Apply custom validation if specified
            # Custom validators can transform values or perform additional checks
            if validator is not None:
                if isinstance(validator, str):
                    # Case 1: Built-in validators (string identifiers)
                    # These are predefined validators for common chart properties
                    if validator == "color":
                        # Color validator: Accepts hex codes and rgba values
                        # Empty string is treated as "no color" (converted to None)
                        if value == "":
                            value = None
                        elif not is_valid_color(value):
                            raise ColorValidationError(attr_name, value)
                    elif validator == "price_format_type":
                        # Price format type validator
                        value = validate_price_format_type(value)
                    elif validator == "precision":
                        # Precision validator (for decimal places)
                        value = validate_precision(value)
                    elif validator == "min_move":
                        # Minimum move validator (for price scales)
                        value = validate_min_move(value)
                    else:
                        # Unknown validator string
                        raise ValueValidationError("validator", "unknown validator")
                else:
                    # Case 2: Custom validator function
                    # Allows users to provide their own validation/transformation logic
                    value = validator(value)

            # Step 4: Set the validated value on the private attribute
            # Uses the private attribute convention (_attr_name)
            setattr(self, f"_{attr_name}", value)

            # Step 5: Return self to enable method chaining
            return self

        def property_getter(self):
            """Property getter for accessing the attribute value.

            Args:
                self: The instance.

            Returns:
                The current value of the attribute.

            """
            return getattr(self, f"_{attr_name}")

        def property_setter(self, value):
            """Property setter for direct assignment with validation.

            Args:
                self: The instance being modified.
                value: The new value to set.

            """
            # Step 1: Handle None values early if they're allowed
            # This bypasses all validation when None is explicitly permitted
            if value is None and allow_none:
                setattr(self, f"_{attr_name}", None)
                return

            # Step 2: Apply type validation if specified
            # Checks that the value matches the expected type before assignment
            if value_type is not None:
                if value_type is bool:
                    # For boolean properties, only accept actual boolean values
                    if not isinstance(value, bool):
                        raise TypeValidationError(attr_name, "boolean")
                elif _is_list_of_markers(value_type):
                    # Case 2a: Special handling for List[MarkerBase] and similar types
                    # Markers require special validation due to their complex structure
                    _validate_list_of_markers(value, attr_name)
                elif not isinstance(value, value_type):
                    # Case 2b: Type mismatch - create user-friendly error messages
                    # Provide specific error messages for common types
                    if value_type is str:
                        raise TypeValidationError(attr_name, "string")
                    if value_type is int:
                        raise TypeValidationError(attr_name, "integer")
                    if value_type is float:
                        raise TypeValidationError(attr_name, "number")
                    if value_type is bool:
                        raise TypeValidationError(attr_name, "boolean")
                    if hasattr(value_type, "__name__"):
                        # For complex types, use a more user-friendly message
                        if allow_none:
                            raise InstanceTypeError(attr_name, value_type, allow_none=True)
                        raise InstanceTypeError(attr_name, value_type)
                    if isinstance(value_type, tuple):
                        # For tuple types like (int, float), create a user-friendly message
                        type_names = [
                            t.__name__ if hasattr(t, "__name__") else str(t) for t in value_type
                        ]
                        if len(type_names) == 2 and "int" in type_names and "float" in type_names:
                            raise TypeValidationError(attr_name, "number")
                        raise TypeMismatchError(attr_name, value_type, type(value))

            # Apply custom validation if specified
            if validator is not None:
                if isinstance(validator, str):
                    # Built-in validators
                    if validator == "color":
                        # Treat empty strings as valid (meaning "no color")
                        if value == "":
                            # Convert empty string to None for consistent handling
                            value = None
                        elif not is_valid_color(value):
                            raise ColorValidationError(attr_name, value)
                    elif validator == "price_format_type":
                        value = validate_price_format_type(value)
                    elif validator == "precision":
                        value = validate_precision(value)
                    elif validator == "min_move":
                        value = validate_min_move(value)
                    else:
                        raise ValueValidationError("validator", "unknown validator")
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
    value_type: type | tuple | None = None,
    validator: Callable[[Any], Any] | str | None = None,
    allow_none: bool = False,
):
    """Decorator that creates a setter method for dataclass fields with optional validation.

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
        allow_none: Whether to allow None values. If True, None values bypass
            type validation but still go through custom validators.

    Returns:
        Decorator function that modifies the class to add a setter method.

    Raises:
        TypeError: If the value doesn't match the specified type.
        ValueError: If the value fails custom validation.
        AttributeError: If the field name conflicts with existing attributes.

    Example:
        ```python
        from dataclasses import dataclass
        from lightweight_charts_core.utils import chainable_field


        @dataclass
        @chainable_field("color", str, validator="color")
        @chainable_field("width", int)
        @chainable_field("line_options", LineOptions, allow_none=True)
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

        # With None values when allow_none=True
        options.set_line_options(None)  # Valid due to allow_none=True
        ```

    Note:
        Direct assignment to dataclass fields bypasses validation. Use the
        generated setter methods when validation is required.

    """

    def decorator(cls):
        """Inner decorator function that modifies the dataclass.

        Args:
            cls: The dataclass to be decorated.

        Returns:
            The modified class with added setter method.

        """
        # Step 1: Create the setter method name following convention set_{field}
        setter_name = f"set_{field_name}"

        def setter_method(self, value):
            """Chainable setter method with validation for dataclass fields.

            Args:
                self: The dataclass instance being modified.
                value: The new value to set.

            Returns:
                Self for method chaining.

            """
            # Step 1: Handle None values early if they're allowed
            # This bypasses all validation when None is explicitly permitted
            if value is None and allow_none:
                setattr(self, field_name, None)
                return self

            # Step 2: Apply validation and transformation
            validated_value = _validate_value(field_name, value, value_type, validator)

            # Step 3: Set the validated value directly on the dataclass field
            setattr(self, field_name, validated_value)

            # Step 4: Return self to enable method chaining
            return self

        # Step 2: Add the generated setter method to the class
        setattr(cls, setter_name, setter_method)

        # Step 3: Return the modified class
        return cls

    return decorator


def _validate_value(field_name: str, value, value_type=None, validator=None):
    """Helper function to validate a value according to type and custom validators.

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
    # Step 1: Apply type validation if specified
    # Checks that the value matches the expected type before assignment
    if value_type is not None:
        if value_type is bool:
            # Case 1: Boolean type - strict validation (no truthy/falsy coercion)
            # Only accept actual True/False, not 1/0 or other truthy values
            if not isinstance(value, bool):
                raise TypeValidationError("field", "boolean")
        elif _is_list_of_markers(value_type):
            # Case 2: Special handling for List[MarkerBase] and similar types
            # Markers require special validation due to their complex structure
            _validate_list_of_markers(value, field_name)
        elif not isinstance(value, value_type):
            # Case 3: Type mismatch - raise generic type error
            raise TypeValidationError("value", "invalid type")

    # Step 2: Apply custom validation if specified
    # Custom validators can transform values or perform additional checks
    if validator is not None:
        if isinstance(validator, str):
            # Case 1: Built-in validators (string identifiers)
            # These are predefined validators for common chart properties
            if validator == "color":
                # Color validator: Accepts hex codes and rgba values
                # Empty string is treated as "no color" (converted to None)
                if value == "":
                    value = None
                elif not is_valid_color(value):
                    raise ColorValidationError(field_name, value)
            elif validator == "price_format_type":
                # Price format type validator
                value = validate_price_format_type(value)
            elif validator == "precision":
                # Precision validator (for decimal places)
                value = validate_precision(value)
            elif validator == "min_move":
                # Minimum move validator (for price scales)
                value = validate_min_move(value)
            else:
                # Unknown validator string
                raise ValueValidationError("validator", "unknown validator")
        else:
            # Case 2: Custom validator function
            # Allows users to provide their own validation/transformation logic
            value = validator(value)

    # Return the validated (and possibly transformed) value
    return value


def validated_field(
    field_name: str,
    value_type: type | tuple | None = None,
    validator: Callable[[Any], Any] | str | None = None,
    allow_none: bool = False,
):
    """Decorator that validates dataclass fields on initialization and provides setter methods.

    This decorator extends chainable_field by adding validation during __post_init__.
    It ensures that field values are validated both when constructed and when using
    setter methods, providing consistent validation across the entire lifecycle.

    The decorator creates both a setter method (like chainable_field) and hooks into
    the dataclass __post_init__ to validate the field value after initialization.

    Args:
        field_name: The name of the dataclass field to validate.
            The method will be named `set_{field_name}`.
        value_type: Optional type or tuple of types for validation. If provided,
            the value will be checked against this type.
            Common types: str, int, float, bool, or custom classes.
        validator: Optional validation function or string identifier. If callable,
            it should take a value and return the validated/transformed value.
            If string, uses built-in validators: "color", "price_format_type",
            "precision", "min_move".
        allow_none: Whether to allow None values. If True, None values bypass
            type validation but still go through custom validators.

    Returns:
        Decorator function that modifies the class to add validation and setter.

    Raises:
        TypeError: If the value doesn't match the specified type.
        ValueError: If the value fails custom validation.

    Example:
        ```python
        from dataclasses import dataclass
        from lightweight_charts_core.utils import validated_field


        @dataclass
        @validated_field("color", str, validator="color", allow_none=True)
        @validated_field("width", int)
        class MyData:
            color: Optional[str] = None
            width: int = 100


        # Valid usage
        data = MyData(color="#ff0000", width=200)  # Validated on init
        data.set_color("#00ff00")  # Validated on setter

        # Invalid usage - validation catches errors
        data = MyData(color="invalid_color")  # Raises ColorValidationError
        data = MyData(width="not_a_number")  # Raises TypeValidationError
        ```

    Note:
        This decorator should be applied BEFORE the @dataclass decorator in the
        decorator stack. It works by wrapping the __post_init__ method to add
        validation logic after dataclass initialization.

    """

    def decorator(cls):
        """Inner decorator function that modifies the dataclass.

        Args:
            cls: The dataclass to be decorated.

        Returns:
            The modified class with validation and setter method.

        """
        # Step 1: First apply chainable_field to get the setter method
        cls = chainable_field(field_name, value_type, validator, allow_none)(cls)

        # Step 2: Store the original __post_init__ if it exists
        original_post_init = getattr(cls, "__post_init__", None)

        # Step 3: Create new __post_init__ that adds validation
        def new_post_init(self):
            """Enhanced __post_init__ that validates fields after initialization.

            This method runs after the dataclass __init__ completes, validating
            the field value and applying any necessary transformations.

            Args:
                self: The dataclass instance being initialized.

            """
            # First, call the original __post_init__ if it exists
            if original_post_init is not None:
                original_post_init(self)

            # Get the current field value
            value = getattr(self, field_name)

            # Skip validation if None and allow_none is True
            if value is None and allow_none:
                return

            # Apply validation using the same logic as the setter
            try:
                validated_value = _validate_value(field_name, value, value_type, validator)
                # Set the validated (and possibly transformed) value back
                setattr(self, field_name, validated_value)
            except (TypeError, ValueError) as e:
                # Re-raise with more context about initialization
                raise type(e)(
                    f"Validation error during initialization of '{field_name}': {e}"
                ) from e

        # Step 4: Replace the __post_init__ method
        cls.__post_init__ = new_post_init

        # Step 5: Track which fields have validation for debugging
        if not hasattr(cls, "_validated_fields"):
            cls._validated_fields = []
        cls._validated_fields.append(field_name)

        return cls

    return decorator
