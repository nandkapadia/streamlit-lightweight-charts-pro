"""Serialization utilities for Streamlit Lightweight Charts Pro.

This module provides base classes and utilities for consistent serialization
of Python data structures to frontend-compatible JavaScript dictionary formats.
It centralizes the logic for handling naming conventions, nested object
serialization, and type-specific transformations required for chart rendering.

The serialization system bridges the gap between Python's snake_case naming
and JavaScript's camelCase conventions, while also handling type conversions
that ensure data is JSON-serializable and frontend-compatible.

Key Features:
    - Automatic snake_case to camelCase key conversion
    - Recursive serialization of nested objects and collections
    - Enum value extraction for JavaScript compatibility
    - NaN to zero conversion for JSON compatibility
    - NumPy type conversion to Python native types
    - Configurable filtering of None/empty values
    - Special field flattening for complex options
    - Support for custom field name mappings

Architecture:
    The module provides a mixin-based approach to serialization:

    SerializableMixin:
        The base mixin that provides full serialization capabilities.
        Classes inherit this and implement their own asdict() method.

    SimpleSerializableMixin:
        A simplified version with a default asdict() implementation
        for classes that don't need customization.

    SerializationConfig:
        Configuration class that controls serialization behavior,
        allowing different classes to have different serialization rules.

Example:
    Basic serialization with default config::

        from dataclasses import dataclass
        from lightweight_charts_core.utils.serialization import SerializableMixin


        @dataclass
        class ChartOptions(SerializableMixin):
            title_text: str
            is_visible: bool = True
            background_color: str = "#FFFFFF"

            def asdict(self) -> Dict[str, Any]:
                return dict(self._serialize_to_dict())


        options = ChartOptions(title_text="My Chart", is_visible=True)
        result = options.asdict()
        # Returns: {"titleText": "My Chart", "isVisible": True,
        #           "backgroundColor": "#FFFFFF"}

    Custom serialization config::

        from lightweight_charts_core.utils.serialization import (
            SerializationConfig,
            create_serializable_mixin,
        )

        # Create custom config that keeps None values
        custom_config = SerializationConfig(skip_none=False, convert_nan_to_zero=True)

        # Create a custom mixin with this config
        CustomMixin = create_serializable_mixin(custom_config)


        @dataclass
        class MyData(CustomMixin):
            value: Optional[int] = None


        data = MyData()
        result = data.asdict()
        # Returns: {"value": None}  # None is kept due to custom config

    Nested object serialization::

        @dataclass
        class NestedOptions(SerializableMixin):
            line_width: int = 2

            def asdict(self) -> Dict[str, Any]:
                return dict(self._serialize_to_dict())


        @dataclass
        class ChartConfig(SerializableMixin):
            title: str
            nested_options: NestedOptions

            def asdict(self) -> Dict[str, Any]:
                return dict(self._serialize_to_dict())


        config = ChartConfig(title="Chart", nested_options=NestedOptions(line_width=3))
        result = config.asdict()
        # Returns: {"title": "Chart", "nestedOptions": {"lineWidth": 3}}

Note:
    This module was created to consolidate serialization logic previously
    scattered across:
        - lightweight_charts_core/data/data.py
        - lightweight_charts_core/charts/options/base_options.py
        - Other classes with custom asdict() implementations

    By centralizing this logic, we ensure consistent serialization behavior
    across the entire codebase.

"""

# Standard Imports
from __future__ import annotations

import math
from dataclasses import fields
from enum import Enum
from typing import Any

# Local Imports
from lightweight_charts_core.utils.case_converter import CaseConverter

# For backward compatibility with code that imports snake_to_camel from here
# This maintains the existing import path while delegating to CaseConverter
snake_to_camel = CaseConverter.snake_to_camel


"""Maximum recursion depth for serialization to prevent stack overflow."""
MAX_SERIALIZATION_DEPTH = 50


class SerializationConfig:
    """Configuration for serialization behavior.

    This class controls how objects are serialized to dictionaries for
    frontend consumption. It provides fine-grained control over which
    values are included, how they're transformed, and how special fields
    are handled.

    The configuration allows different classes to have different
    serialization rules without duplicating code. For example, some
    classes may want to keep None values while others skip them.

    Attributes:
        skip_none (bool): If True, fields with None values are omitted
            from serialized output. Reduces payload size for optional fields.
        skip_empty_strings (bool): If True, fields with empty string values
            ("") are omitted. Useful for preventing empty labels in charts.
        skip_empty_dicts (bool): If True, fields with empty dictionary values
            ({}) are omitted. Prevents unnecessary nested empty objects.
        convert_nan_to_zero (bool): If True, NaN float values are converted
            to 0.0. Required for JSON compatibility as JSON doesn't support NaN.
        convert_enums (bool): If True, Enum instances are converted to their
            underlying values. JavaScript doesn't understand Python enums.
        flatten_options_fields (bool): If True, fields ending in '_options'
            like 'background_options' have their contents merged into the
            parent dictionary instead of being nested.

    Example:
        Create custom config for strict serialization::

            >>> config = SerializationConfig(
            ...     skip_none=False,  # Keep None values
            ...     skip_empty_strings=False,  # Keep empty strings
            ...     convert_nan_to_zero=False  # Keep NaN as-is
            ... )

        Create config for minimal payload::

            >>> config = SerializationConfig(
            ...     skip_none=True,
            ...     skip_empty_strings=True,
            ...     skip_empty_dicts=True
            ... )

    Note:
        The DEFAULT_CONFIG instance uses sensible defaults for most use
        cases: skip None/empty values, convert NaN to zero, convert enums.

    """

    def __init__(
        self,
        skip_none: bool = True,
        skip_empty_strings: bool = True,
        skip_empty_dicts: bool = True,
        convert_nan_to_zero: bool = True,
        convert_enums: bool = True,
        flatten_options_fields: bool = True,
    ):
        """Initialize serialization configuration.

        Args:
            skip_none (bool, optional): Whether to skip None values in
                serialization. Defaults to True. When True, optional fields
                set to None are omitted from output.
            skip_empty_strings (bool, optional): Whether to skip empty string
                values. Defaults to True. When True, fields with "" values
                are omitted.
            skip_empty_dicts (bool, optional): Whether to skip empty dictionary
                values. Defaults to True. When True, fields with {} values
                are omitted.
            convert_nan_to_zero (bool, optional): Whether to convert NaN float
                values to 0.0. Defaults to True. Required for JSON compatibility
                since JSON spec doesn't support NaN.
            convert_enums (bool, optional): Whether to convert Enum objects to
                their values. Defaults to True. JavaScript can't understand
                Python enum types directly.
            flatten_options_fields (bool, optional): Whether to flatten fields
                ending in '_options'. Defaults to True. When True, fields like
                'background_options' have their dict contents merged into parent
                instead of being nested.

        Example:
            Default configuration::

                >>> config = SerializationConfig()
                >>> config.skip_none
                True

            Custom configuration::

                >>> config = SerializationConfig(
                ...     skip_none=False,
                ...     convert_nan_to_zero=False
                ... )
                >>> config.skip_none
                False

        """
        # Store skip_none setting for filtering None values
        self.skip_none = skip_none

        # Store skip_empty_strings setting for filtering empty strings
        self.skip_empty_strings = skip_empty_strings

        # Store skip_empty_dicts setting for filtering empty dictionaries
        self.skip_empty_dicts = skip_empty_dicts

        # Store NaN conversion setting for JSON compatibility
        self.convert_nan_to_zero = convert_nan_to_zero

        # Store enum conversion setting for JavaScript compatibility
        self.convert_enums = convert_enums

        # Store field flattening setting for special options handling
        self.flatten_options_fields = flatten_options_fields


# Default configuration instance used throughout the application
# Provides sensible defaults that work for most use cases
DEFAULT_CONFIG = SerializationConfig()


class SerializableMixin:
    """Mixin class that provides standardized serialization capabilities.

    This mixin provides a consistent interface for serializing Python objects
    to frontend-compatible dictionaries. It handles common transformations
    including enum conversion, type normalization, and camelCase key conversion.

    Classes using this mixin should be dataclasses and implement asdict() by
    calling _serialize_to_dict() with optional custom configuration.

    The mixin handles the complete serialization pipeline:
        1. Iterate through all dataclass fields
        2. Apply filtering based on configuration (skip None, empty, etc.)
        3. Convert field names (snake_case to camelCase)
        4. Transform values (enums to values, NaN to zero, etc.)
        5. Recursively serialize nested objects
        6. Handle special field flattening rules

    Features:
        - Automatic snake_case to camelCase conversion
        - Enum value extraction for JavaScript compatibility
        - NaN to zero conversion for JSON compatibility
        - NumPy type conversion to Python native types
        - Recursive serialization of nested objects
        - Configurable filtering of None/empty values
        - Support for special field names (like 'time' -> ColumnNames.TIME)
        - Field override support for custom transformations

    Example:
        Basic usage::

            from dataclasses import dataclass
            from lightweight_charts_core.utils.serialization import SerializableMixin


            @dataclass
            class ChartConfig(SerializableMixin):
                title_text: str = "My Chart"
                is_visible: bool = True

                def asdict(self) -> Dict[str, Any]:
                    return dict(self._serialize_to_dict())


            config = ChartConfig()
            result = config.asdict()
            # Returns: {"titleText": "My Chart", "isVisible": True}

        With custom config::

            @dataclass
            class StrictConfig(SerializableMixin):
                value: Optional[int] = None

                def asdict(self) -> Dict[str, Any]:
                    custom_config = SerializationConfig(skip_none=False)
                    return dict(self._serialize_to_dict(custom_config))


            config = StrictConfig()
            result = config.asdict()
            # Returns: {"value": None}  # None kept due to custom config

    Note:
        This class is designed to work with dataclasses. It uses the
        dataclasses.fields() function to introspect the class structure.
        Non-dataclass usage may result in errors.

    """

    def _serialize_to_dict(
        self,
        config: SerializationConfig = DEFAULT_CONFIG,
        override_fields: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Serialize the object to a dictionary with camelCase keys.

        This method provides the core serialization logic that handles
        type conversion, key transformation, and field filtering. It's
        designed to be called by subclasses' asdict() implementations.

        The serialization process follows these steps:
            1. Initialize result dictionary and process field overrides
            2. Iterate through all dataclass fields
            3. Get field value (from override dict or instance attribute)
            4. Apply filtering based on config (skip None, empty, etc.)
            5. Process value (convert types, serialize nested objects)
            6. Process field name (snake_case to camelCase)
            7. Handle special flattening for '_options' fields
            8. Add processed key-value pair to result

        Args:
            config (SerializationConfig, optional): Configuration instance
                controlling serialization behavior. Defaults to DEFAULT_CONFIG
                which provides sensible defaults for most cases.
            override_fields (dict[str, Any] | None, optional): Dictionary of
                field overrides. Values in this dict replace computed values
                during serialization. Useful for custom transformations on
                specific fields. Defaults to None.

        Returns:
            dict[str, Any]: Serialized data with camelCase keys ready for
                frontend consumption. The dictionary is fully JSON-serializable
                and compatible with JavaScript naming conventions.

        Example:
            Basic serialization::

                >>> @dataclass
                ... class Document(SerializableMixin):
                ...     title: str = "Test"
                ...     page_count: int = 42
                ...     notes: str = ""
                ...
                ...     def asdict(self) -> Dict[str, Any]:
                ...         return dict(self._serialize_to_dict())
                >>> data = Document()
                >>> result = data._serialize_to_dict()
                >>> print(result)
                {"title": "Test", "pageCount": 42}  # notes skipped (empty)

            Custom config::

                >>> config = SerializationConfig(skip_empty_strings=False)
                >>> result = data._serialize_to_dict(config)
                >>> print(result)
                {"title": "Test", "pageCount": 42, "notes": ""}

            With field overrides::

                >>> overrides = {"page_count": 100}
                >>> result = data._serialize_to_dict(
                ...     override_fields=overrides
                ... )
                >>> print(result)
                {"title": "Test", "pageCount": 100}

        Note:
            This method must be called on a dataclass instance. It uses
            dataclasses.fields() to introspect the object structure.

        """
        # Step 1: Initialize result dictionary that will hold serialized data
        result: dict[str, Any] = {}

        # Initialize override_fields to empty dict if not provided
        # This allows us to use .get() without None checks
        override_fields = override_fields or {}

        # Step 2: Iterate through all dataclass fields
        # fields() returns a tuple of Field objects representing each field
        # Cast self to Any to satisfy mypy - SerializableMixin is always
        # used with dataclasses but mypy can't infer this
        for field in fields(self):  # type: ignore[arg-type]
            # Extract the field name (e.g., "title_text", "is_visible")
            field_name = field.name

            # Step 3: Get field value (use override if provided, otherwise
            # get from instance)
            # Overrides allow callers to customize specific field values
            # during serialization without modifying the object
            value = override_fields.get(field_name, getattr(self, field_name))

            # Step 4: Apply config-based filtering
            # Check if this value should be included based on config rules
            # (skip None, skip empty strings, skip empty dicts)
            if not self._should_include_value(value, config):
                # Value should be skipped, move to next field
                continue

            # Step 5: Process value for serialization
            # This handles type conversions:
            # - NaN -> 0.0
            # - Enum -> enum.value
            # - NumPy types -> Python types
            # - Nested objects -> recursive serialization
            processed_value = self._process_value_for_serialization(value, config)

            # Step 6: Process field name for serialization
            # Convert snake_case to camelCase and handle special fields
            # like 'time' and 'value'
            processed_field = self._process_field_name_for_serialization(field_name, config)

            # Step 7: Handle special flattening rules
            # Some fields like 'background_options' should have their
            # contents merged into the parent dict instead of being nested
            if (
                config.flatten_options_fields
                and field_name.endswith("_options")
                and isinstance(processed_value, dict)
                and field_name == "background_options"  # Only flatten specific
            ):
                # Merge flattened fields directly into result dictionary
                # This converts {"background_options": {"color": "red"}}
                # to {"color": "red"} in the output
                result.update(processed_value)
            else:
                # Normal field: add as key-value pair in result
                result[processed_field] = processed_value

        # Step 8: Return the fully processed dictionary
        # This dictionary is ready for JSON serialization and frontend use
        return result

    def _should_include_value(self, value: Any, config: SerializationConfig) -> bool:
        """Determine if a value should be included in serialized output.

        This method applies filtering rules based on the configuration to
        decide whether a field value should be included in the serialized
        dictionary. It helps reduce payload size by omitting unwanted values.

        The checks are performed in order:
            1. Check if value is None and should be skipped
            2. Check if value is empty string and should be skipped
            3. Check if value is empty dict and should be skipped

        Args:
            value (Any): The value to check. Can be any Python type.
            config (SerializationConfig): Serialization configuration that
                controls which values should be filtered out.

        Returns:
            bool: True if the value should be included in the serialized
                output, False if it should be omitted.

        Example:
            Check None values::

                >>> config = SerializationConfig(skip_none=True)
                >>> mixin = SerializableMixin()
                >>> mixin._should_include_value(None, config)
                False
                >>> mixin._should_include_value("text", config)
                True

            Check empty strings::

                >>> config = SerializationConfig(skip_empty_strings=True)
                >>> mixin._should_include_value("", config)
                False
                >>> mixin._should_include_value("hello", config)
                True

            Check empty dicts::

                >>> config = SerializationConfig(skip_empty_dicts=True)
                >>> mixin._should_include_value({}, config)
                False
                >>> mixin._should_include_value({"key": "value"}, config)
                True

        Note:
            This method doesn't check type validity or perform conversions.
            It only determines inclusion based on the filtering rules.

        """
        # Check 1: Skip None values if configured
        # None values typically represent unset optional fields
        # Omitting them reduces payload size without losing information
        if value is None and config.skip_none:
            return False

        # Check 2: Skip empty strings if configured
        # Empty strings can clutter the output and provide no value
        # to the frontend
        if value == "" and config.skip_empty_strings:
            return False

        # Check 3: Skip empty dictionaries if configured
        # Returns True if value is not an empty dict, or if we should
        # keep empty dicts
        # Empty dicts create unnecessary nesting in the output
        return not (value == {} and config.skip_empty_dicts)

    def _process_value_for_serialization(
        self,
        value: Any,
        config: SerializationConfig,
        depth: int = 0,
    ) -> Any:
        """Process a value during serialization with type-specific conversions.

        This method handles all value transformations needed to make Python
        objects compatible with JavaScript/JSON. It processes values
        recursively, handling nested objects, collections, and special types.

        The processing pipeline:
            1. Convert NaN floats to zero for JSON compatibility
            2. Convert NumPy scalar types to Python native types
            3. Extract enum values for JavaScript compatibility
            4. Recursively serialize nested SerializableMixin objects
            5. Recursively process lists
            6. Recursively process dictionaries with key conversion
            7. Return processed value

        Args:
            value (Any): The value to process. Can be any Python type.
            config (SerializationConfig): Configuration controlling the
                conversion behavior.

        Returns:
            Any: The processed value ready for JSON serialization. The value
                will be JSON-compatible and use JavaScript naming conventions.

        Example:
            NaN conversion::

                >>> import math
                >>> config = SerializationConfig(convert_nan_to_zero=True)
                >>> mixin = SerializableMixin()
                >>> mixin._process_value_for_serialization(math.nan, config)
                0.0

            Enum conversion::

                >>> from enum import Enum
                >>> class Color(Enum):
                ...     RED = "red"
                >>> config = SerializationConfig(convert_enums=True)
                >>> mixin._process_value_for_serialization(Color.RED, config)
                'red'

            Nested object serialization::

                >>> @dataclass
                ... class Inner(SerializableMixin):
                ...     value: int = 42
                ...     def asdict(self):
                ...         return {"value": self.value}
                >>> inner = Inner()
                >>> mixin._process_value_for_serialization(inner, config)
                {'value': 42}

        Note:
            This method is recursive and will process deeply nested structures.
            Circular references will cause infinite recursion.

        """
        # Check depth limit to prevent stack overflow from deeply nested data
        if depth > MAX_SERIALIZATION_DEPTH:
            return f"<max depth {MAX_SERIALIZATION_DEPTH} exceeded>"

        # Step 1: Handle NaN floats - convert to zero for JSON compatibility
        # JSON spec doesn't support NaN, Infinity, or -Infinity
        # JavaScript charts typically treat NaN as zero anyway
        if isinstance(value, float) and math.isnan(value) and config.convert_nan_to_zero:
            return 0.0

        # Step 2: Convert NumPy scalar types to Python native types
        # NumPy types like np.int64, np.float32 aren't JSON-serializable
        # The .item() method extracts the Python scalar value
        if hasattr(value, "item"):  # NumPy scalar types have .item() method
            value = value.item()

        # Step 3: Convert enums to their values
        # JavaScript doesn't understand Python enum types
        # Extract the underlying value (string, int, etc.)
        if config.convert_enums and isinstance(value, Enum):
            value = value.value

        # Step 4: Handle nested serializable objects
        # Objects with asdict() method are serialized recursively
        # This enables deep serialization of complex object hierarchies
        if hasattr(value, "asdict") and callable(value.asdict):
            value = value.asdict()

        # Step 5: Handle serializable lists recursively
        # Lists may contain nested objects that also need serialization
        elif isinstance(value, list):
            return self._serialize_list_recursively(value, config, depth + 1)

        # Step 6: Handle nested dictionaries recursively
        # Dictionaries need key conversion (snake_case to camelCase)
        # and recursive value processing
        elif isinstance(value, dict):
            return self._serialize_dict_recursively(value, config, depth + 1)

        # Step 7: Return the processed value
        # At this point, the value has been fully processed and is
        # ready for JSON serialization
        return value

    def _serialize_list_recursively(
        self,
        items: list[Any],
        config: SerializationConfig,
        depth: int = 0,
    ) -> list[Any]:
        """Serialize a list recursively.

        This method processes each item in a list, applying the same
        serialization logic as the parent object. It ensures that nested
        objects, enums, and special types within lists are properly
        converted for frontend consumption.

        Args:
            items (list[Any]): List of items to serialize. Items can be
                any Python type including nested objects, primitives,
                enums, dicts, or other lists.
            config (SerializationConfig): Configuration controlling the
                serialization behavior for each item.

        Returns:
            list[Any]: Recursively serialized list with all items processed
                according to the configuration. The list is ready for JSON
                serialization.

        Example:
            List of primitives::

                >>> mixin = SerializableMixin()
                >>> config = SerializationConfig()
                >>> mixin._serialize_list_recursively([1, 2, 3], config)
                [1, 2, 3]

            List with enums::

                >>> from enum import Enum
                >>> class Status(Enum):
                ...     ACTIVE = "active"
                ...     INACTIVE = "inactive"
                >>> items = [Status.ACTIVE, Status.INACTIVE]
                >>> mixin._serialize_list_recursively(items, config)
                ['active', 'inactive']

            List with nested objects::

                >>> @dataclass
                ... class Point(SerializableMixin):
                ...     x: int
                ...     y: int
                ...     def asdict(self):
                ...         return {"x": self.x, "y": self.y}
                >>> items = [Point(1, 2), Point(3, 4)]
                >>> mixin._serialize_list_recursively(items, config)
                [{'x': 1, 'y': 2}, {'x': 3, 'y': 4}]

        Note:
            This method is recursive and will process deeply nested lists.
            Circular references will cause infinite recursion.

        """
        # Check depth limit
        if depth > MAX_SERIALIZATION_DEPTH:
            return [f"<max depth {MAX_SERIALIZATION_DEPTH} exceeded>"]

        # Initialize result list to hold processed items
        processed_items = []

        # Iterate through each item in the input list
        for item in items:
            # Process each item using the same serialization logic
            # This ensures consistency between top-level and nested values
            # Handles: enums, nested objects, dicts, other lists, etc.
            processed_item = self._process_value_for_serialization(item, config, depth)

            # Add the processed item to result list
            processed_items.append(processed_item)

        # Return the fully processed list
        return processed_items

    def _serialize_dict_recursively(
        self,
        data: dict[str, Any],
        config: SerializationConfig,
        depth: int = 0,
    ) -> dict[str, Any]:
        """Serialize a dictionary recursively with key conversion.

        This method processes dictionaries by converting keys from snake_case
        to camelCase and recursively serializing values. It ensures that
        nested dictionaries follow JavaScript naming conventions.

        Args:
            data (dict[str, Any]): Dictionary to serialize. Keys should be
                strings (typically in snake_case), values can be any type.
            config (SerializationConfig): Configuration controlling the
                serialization behavior for values.

        Returns:
            dict[str, Any]: Recursively processed dictionary with camelCase
                keys and serialized values. Ready for JSON serialization.

        Example:
            Simple dict with snake_case keys::

                >>> mixin = SerializableMixin()
                >>> config = SerializationConfig()
                >>> data = {"first_name": "John", "last_name": "Doe"}
                >>> mixin._serialize_dict_recursively(data, config)
                {'firstName': 'John', 'lastName': 'Doe'}

            Nested dict::

                >>> data = {
                ...     "user_info": {
                ...         "first_name": "John",
                ...         "age_years": 30
                ...     }
                ... }
                >>> mixin._serialize_dict_recursively(data, config)
                {'userInfo': {'firstName': 'John', 'ageYears': 30}}

            Dict with enum values::

                >>> from enum import Enum
                >>> class Status(Enum):
                ...     ACTIVE = "active"
                >>> data = {"user_status": Status.ACTIVE}
                >>> mixin._serialize_dict_recursively(data, config)
                {'userStatus': 'active'}

        Note:
            Non-string keys are converted to strings before camelCase
            conversion. This ensures consistent behavior with JavaScript
            object keys which are always strings.

        """
        # Check depth limit
        if depth > MAX_SERIALIZATION_DEPTH:
            return {"error": f"max depth {MAX_SERIALIZATION_DEPTH} exceeded"}

        # Initialize result dictionary to hold processed key-value pairs
        result = {}

        # Iterate through each key-value pair in the input dictionary
        for key, value in data.items():
            # Step 1: Convert key to camelCase for JavaScript compatibility
            # JavaScript conventionally uses camelCase for object keys
            # If key is not a string, convert it to string first
            # (JavaScript object keys are always strings)
            processed_key = snake_to_camel(key) if isinstance(key, str) else str(key)

            # Step 2: Process value recursively
            # Apply the full serialization pipeline to the value
            # This handles nested objects, enums, lists, dicts, etc.
            processed_value = self._process_value_for_serialization(value, config, depth)

            # Step 3: Add processed key-value pair to result dictionary
            result[processed_key] = processed_value

        # Return the fully processed dictionary
        return result

    def _process_field_name_for_serialization(
        self,
        field_name: str,
        _config: SerializationConfig,
    ) -> str:
        """Process field name for serialization with special handling.

        This method converts field names from Python's snake_case convention
        to JavaScript's camelCase convention. It also handles special field
        names that need to map to specific constants for frontend compatibility.

        Special field handling:
            - 'time' -> Maps to ColumnNames.TIME enum value
            - 'value' -> Maps to ColumnNames.VALUE enum value
            - All other fields -> Standard snake_case to camelCase conversion

        Args:
            field_name (str): Original Python field name in snake_case
                (e.g., "title_text", "is_visible").
            _config (SerializationConfig): Serialization configuration
                (currently unused but kept for interface consistency).

        Returns:
            str: Processed field name in camelCase or special constant value.
                Ready for use as JavaScript object key.

        Example:
            Regular field conversion::

                >>> mixin = SerializableMixin()
                >>> config = SerializationConfig()
                >>> mixin._process_field_name_for_serialization(
                ...     "title_text", config
                ... )
                'titleText'

            Special field handling::

                >>> mixin._process_field_name_for_serialization("time", config)
                'time'  # Maps to ColumnNames.TIME.value

                >>> mixin._process_field_name_for_serialization("value", config)
                'value'  # Maps to ColumnNames.VALUE.value

        Note:
            The function imports ColumnNames dynamically to avoid circular
            import issues. If the import fails, it falls back to standard
            camelCase conversion.

        """
        # Special handling for known column names to match frontend expectations
        # These special cases ensure consistent naming with the JavaScript chart
        # library which expects specific field names for time and value data

        if field_name == "time":
            # Case 1: "time" field - use ColumnNames enum for consistency
            # The "time" field is critical for chart data and must match
            # exactly what the JavaScript library expects
            try:
                # Import inside function to avoid circular import issues
                # The enum module may depend on this serialization module
                # pylint: disable=import-outside-toplevel
                from lightweight_charts_core.type_definitions.enums import (
                    ColumnNames,
                )
            except ImportError:
                # Fallback to standard camelCase if import fails
                # This ensures serialization still works even if enums
                # module isn't available (e.g., during testing)
                return snake_to_camel(field_name)
            else:
                # Return the canonical time field name from enum
                return ColumnNames.TIME.value

        elif field_name == "value":
            # Case 2: "value" field - use ColumnNames enum for consistency
            # The "value" field is used for chart data points and must
            # match the JavaScript library's expectations
            try:
                # Import inside function to avoid circular import issues
                # pylint: disable=import-outside-toplevel
                from lightweight_charts_core.type_definitions.enums import (
                    ColumnNames,
                )
            except ImportError:
                # Fallback to standard camelCase if import fails
                return snake_to_camel(field_name)
            else:
                # Return the canonical value field name from enum
                return ColumnNames.VALUE.value

        else:
            # Case 3: Regular field - convert snake_case to camelCase
            # This is the standard conversion for most fields
            # Examples: title_text -> titleText, is_visible -> isVisible
            return snake_to_camel(field_name)


class SimpleSerializableMixin(SerializableMixin):
    """Simplified mixin for basic classes that need basic serialization.

    This variant provides a more straightforward serialization approach
    for simple data classes that don't need complex nested serialization
    or special field handling. It implements a default asdict() method
    that uses DEFAULT_CONFIG, saving boilerplate code in simple classes.

    Use this when:
        - Your class has simple fields (strings, ints, bools)
        - You don't need custom serialization config
        - You don't need special field transformations
        - Default filtering rules (skip None, empty strings) are acceptable

    Example:
        Simple data class::

            from dataclasses import dataclass
            from lightweight_charts_core.utils.serialization import SimpleSerializableMixin


            @dataclass
            class ChartTitle(SimpleSerializableMixin):
                text: str
                font_size: int = 14
                is_visible: bool = True


            title = ChartTitle(text="My Chart")
            result = title.asdict()
            # Returns: {"text": "My Chart", "fontSize": 14, "isVisible": True}

    Note:
        If you need custom serialization config or field overrides,
        inherit from SerializableMixin instead and implement your own
        asdict() method.

    """

    def asdict(self) -> dict[str, Any]:
        """Serialize to dictionary with basic camelCase conversion.

        This method provides a default implementation that uses the
        DEFAULT_CONFIG for serialization. It's suitable for most simple
        classes that don't need special handling.

        Returns:
            dict[str, Any]: Serialized representation with camelCase keys,
                filtered according to DEFAULT_CONFIG rules (skip None,
                empty strings, empty dicts).

        Example:
            >>> @dataclass
            ... class Point(SimpleSerializableMixin):
            ...     x_coord: int
            ...     y_coord: int
            >>> point = Point(x_coord=10, y_coord=20)
            >>> point.asdict()
            {'xCoord': 10, 'yCoord': 20}

        """
        # Use the base class _serialize_to_dict with DEFAULT_CONFIG
        # This applies standard serialization rules without customization
        return self._serialize_to_dict()


def create_serializable_mixin(
    config_override: SerializationConfig | None = None,
) -> type:
    """Factory function to create a configurable SerializableMixin.

    This factory allows you to create custom mixin classes with specific
    serialization configurations. It's useful when different parts of your
    codebase need different serialization rules.

    Instead of passing config to every asdict() call, you can create a
    custom mixin class that encapsulates the configuration.

    Args:
        config_override (SerializationConfig | None, optional): Custom
            serialization configuration. If None, uses DEFAULT_CONFIG.
            Defaults to None.

    Returns:
        type: A custom SerializableMixin class with the specified
            configuration. This class can be used as a base for dataclasses.

    Example:
        Create mixin that keeps None values::

            from lightweight_charts_core.utils.serialization import (
                SerializationConfig,
                create_serializable_mixin,
            )

            # Create config that keeps None values
            strict_config = SerializationConfig(skip_none=False)

            # Create custom mixin with this config
            StrictMixin = create_serializable_mixin(strict_config)


            # Use the custom mixin
            @dataclass
            class MyData(StrictMixin):
                value: Optional[int] = None


            data = MyData()
            result = data.asdict()
            # Returns: {"value": None}  # None is kept

        Create mixin for minimal payloads::

            # Create config that aggressively filters
            minimal_config = SerializationConfig(
                skip_none=True, skip_empty_strings=True, skip_empty_dicts=True
            )

            MinimalMixin = create_serializable_mixin(minimal_config)


            @dataclass
            class ChartData(MinimalMixin):
                title: str = ""
                value: Optional[int] = None


            data = ChartData()
            result = data.asdict()
            # Returns: {}  # Both fields filtered out

    Note:
        The returned mixin class is a dynamic type created at runtime.
        It inherits from SerializableMixin and overrides the configuration
        behavior.

    """
    # Use provided config or fall back to default configuration
    # This allows None to mean "use defaults" rather than requiring
    # explicit DEFAULT_CONFIG argument
    config = config_override or DEFAULT_CONFIG

    # Define a new mixin class that uses the specified configuration
    class ConfigurableSerializableMixin(SerializableMixin):
        """Configurable serialization mixin with custom config.

        This class provides a SerializableMixin variant with custom
        serialization configuration. It's useful when different classes
        need different serialization behaviors (e.g., some skip None,
        others don't).

        This class is dynamically created by create_serializable_mixin()
        and encapsulates the provided configuration.

        Attributes:
            config: The SerializationConfig instance to use for this mixin.
                This is captured from the factory function's closure.

        """

        def _get_serialization_config(self) -> SerializationConfig:
            """Get the serialization configuration for this mixin.

            Returns:
                SerializationConfig: The configuration instance captured
                    from the factory function.

            """
            # Return the config from the enclosing scope
            # This provides access to the factory function's config parameter
            return config

        def asdict(self) -> dict[str, Any]:
            """Serialize to dictionary using the custom configuration.

            This method overrides the base implementation to use the
            configuration specified when the mixin class was created.

            Returns:
                dict[str, Any]: Serialized representation with custom
                    configuration applied.

            """
            # Use the custom config from _get_serialization_config()
            # This ensures all serialization uses the factory-specified rules
            return self._serialize_to_dict(self._get_serialization_config())

    # Return the dynamically created mixin class
    # Callers can use this as a base class for their dataclasses
    return ConfigurableSerializableMixin
