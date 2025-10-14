"""Serialization utilities for Streamlit Lightweight Charts Pro.

This module provides base classes and utilities for consistent serialization
of data structures to frontend-compatible dictionary formats. It centralizes
the logic for handling camelCase conversion, nested object serialization,
and type-specific transformations.

The serialization system is designed to:
    - Convert Python objects to JavaScript-compatible dictionaries
    - Handle snake_case to camelCase key conversion
    - Process nested objects and enums
    - Provide consistent behavior across all serializable classes
    - Support special field flattening and nested serialization

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.utils.serialization import SerializableMixin
    from dataclasses import dataclass


    @dataclass
    class MyDataClass(SerializableMixin):
        title: str
        is_visible: bool = True

        def asdict(self) -> Dict[str, Any]:
            return dict(self._serialize_to_dict())
    ```

Refactoring Info:
    This utility was created to consolidate serialization logic from:
    - streamlit_lightweight_charts_pro/data/data.py
    - streamlit_lightweight_charts_pro/charts/options/base_options.py
    - And other classes with custom asdict() implementations
"""

# Standard Imports
from __future__ import annotations

import math
from dataclasses import fields
from enum import Enum
from typing import Any

# Local Imports
from streamlit_lightweight_charts_pro.utils.data_utils import snake_to_camel


class SerializationConfig:
    """Configuration for serialization behavior."""

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
            skip_none: Whether to skip None values in serialization.
            skip_empty_strings: Whether to skip empty string values.
            skip_empty_dicts: Whether to skip empty dictionary values.
            convert_nan_to_zero: Whether to convert NaN float values to 0.0.
            convert_enums: Whether to convert Enum objects to their values.
            flatten_options_fields: Whether to flatten fields ending in '_options'.
        """
        self.skip_none = skip_none
        self.skip_empty_strings = skip_empty_strings
        self.skip_empty_dicts = skip_empty_dicts
        self.convert_nan_to_zero = convert_nan_to_zero
        self.convert_enums = convert_enums
        self.flatten_options_fields = flatten_options_fields


DEFAULT_CONFIG = SerializationConfig()


class SerializableMixin:
    """Mixin class that provides standardized serialization capabilities.

    This mixin provides a consistent interface for serializing Python objects
    to frontend-compatible dictionaries. It handles common transformations
    including enum conversion, type normalization, and camelCase key conversion.

    Classes using this mixin should implement `asdict()` by calling
    `_serialize_to_dict()` with optional custom configuration.

    Features:
        - Automatic snake_case to camelCase conversion
        - Enum value extraction
        - NaN to zero conversion for numeric values
        - Recursive serialization of nested objects
        - Configurable filtering of None/empty values
        - Support for special field names (like 'time' -> ColumnNames.TIME)

    Example:
        ```python
        from dataclasses import dataclass
        from streamlit_lightweight_charts_pro.utils.serialization import SerializableMixin


        @dataclass
        class ChartConfig(SerializableMixin):
            title: str = "My Chart"
            is_visible: bool = True

            def asdict(self) -> Dict[str, Any]:
                return self._serialize_to_dict()
        ```
    """

    def _serialize_to_dict(
        self,
        config: SerializationConfig = DEFAULT_CONFIG,
        override_fields: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Serialize the object to a dictionary with camelCase keys.

        This method provides the core serialization logic that handles
        type conversion, key transformation, and field filtering. It's
        designed to be overridden or customized by subclasses with
        specific serialization needs.

        Args:
            config: SerializationConfig instance controlling behavior.
                Defaults to DEFAULT_CONFIG if not provided.
            override_fields: Optional dictionary of field overrides.
                Values in this dict will replace computed values during
                serialization.

        Returns:
            Dict[str, Any]: Serialized data with camelCase keys ready for
                frontend consumption.

        Example:
            ```python
            # Basic serialization
            data = Document(title="Test", value=42, notes="")
            result = data._serialize_to_dict()
            # Returns: {"title": "Test", "value": 42, "notes": ""}

            # Custom config
            config = SerializationConfig(skip_empty_strings=True)
            result = data._serialize_to_dict(config)
            # Returns: {"title": "Test", "value": 42}  # notes skipped

            # With field overrides
            result = data._serialize_to_dict(override_fields={"value": "custom_value"})
            # Returns: {"title": "Test", "value": "custom_value", "notes": ""}
            ```
        """
        # Step 1: Initialize result dictionary and process overrides
        result: dict[str, Any] = {}
        override_fields = override_fields or {}

        # Step 2: Iterate through all dataclass fields
        # Cast self to Any to satisfy mypy - SerializableMixin is always used with dataclasses
        for field in fields(self):  # type: ignore[arg-type]
            field_name = field.name

            # Step 3: Get field value (use override if provided, otherwise get from instance)
            # Overrides allow callers to customize specific field values during serialization
            value = override_fields.get(field_name, getattr(self, field_name))

            # Step 4: Apply config-based filtering (skip None, empty strings, etc.)
            # This removes unwanted values before serialization
            if not self._should_include_value(value, config):
                continue

            # Step 5: Convert field name and value for frontend compatibility
            # Processes both the key (field name) and the value
            processed_value = self._process_value_for_serialization(value, config)
            processed_field = self._process_field_name_for_serialization(field_name, config)

            # Step 6: Handle special flattening rules
            # Some fields (like background_options) should be merged into parent dict
            if (
                config.flatten_options_fields
                and field_name.endswith("_options")
                and isinstance(processed_value, dict)
                and field_name == "background_options"  # Only flatten specific fields
            ):
                # Merge flattened fields into result instead of nesting
                result.update(processed_value)
            else:
                # Add normal or nested field to result
                result[processed_field] = processed_value

        # Step 7: Return the fully processed dictionary
        return result

    def _should_include_value(self, value: Any, config: SerializationConfig) -> bool:
        """Determine if a value should be included in serialized output.

        Args:
            value: The value to check.
            config: Serialization configuration.

        Returns:
            bool: True if the value should be included, False otherwise.
        """
        # Check 1: Skip None values if configured
        # Helps reduce payload size by omitting unset optional fields
        if value is None and config.skip_none:
            return False

        # Check 2: Skip empty strings if configured
        # Prevents sending empty string values to frontend
        if value == "" and config.skip_empty_strings:
            return False

        # Check 3: Skip empty dictionaries if configured
        # Returns True if value is not an empty dict, or if we should keep empty dicts
        return not (value == {} and config.skip_empty_dicts)

    def _process_value_for_serialization(
        self,
        value: Any,
        config: SerializationConfig,
    ) -> Any:
        """Process a value during serialization with type-specific conversions.

        Args:
            value: The value to process.
            config: Serialization configuration.

        Returns:
            Any: The processed value ready for serialization.
        """
        # Step 1: Handle NaN floats - convert to zero for JSON compatibility
        # JavaScript doesn't support NaN in JSON, so we convert to 0.0
        if isinstance(value, float) and math.isnan(value) and config.convert_nan_to_zero:
            return 0.0

        # Step 2: Convert NumPy scalar types to Python native types
        # NumPy types like np.int64 need conversion for JSON serialization
        if hasattr(value, "item"):  # NumPy scalar types have .item() method
            value = value.item()

        # Step 3: Convert enums to their values
        # Enums are serialized as their underlying value (int, string, etc.)
        if config.convert_enums and isinstance(value, Enum):
            value = value.value

        # Step 4: Handle nested serializable objects
        # Objects with asdict() method are serialized recursively
        if hasattr(value, "asdict") and callable(value.asdict):
            value = value.asdict()

        # Step 5: Handle serializable lists recursively
        # Lists may contain nested objects that also need serialization
        elif isinstance(value, list):
            return self._serialize_list_recursively(value, config)

        # Step 6: Handle nested dictionaries recursively
        # Dictionaries need key conversion (snake_case to camelCase)
        elif isinstance(value, dict):
            return self._serialize_dict_recursively(value, config)

        # Step 7: Return the processed value
        return value

    def _serialize_list_recursively(
        self,
        items: list[Any],
        config: SerializationConfig,
    ) -> list[Any]:
        """Serialize a list recursively.

        Args:
            items: List of items to serialize.
            config: Serialization configuration.

        Returns:
            List[Any]: Recursively serialized list.
        """
        # Initialize result list
        processed_items = []

        # Process each item in the list recursively
        # This ensures nested objects are also properly serialized
        for item in items:
            processed_item = self._process_value_for_serialization(item, config)
            processed_items.append(processed_item)

        return processed_items

    def _serialize_dict_recursively(
        self,
        data: dict[str, Any],
        config: SerializationConfig,
    ) -> dict[str, Any]:
        """Serialize a dictionary recursively with key conversion.

        Args:
            data: Dictionary to serialize.
            config: Serialization configuration.

        Returns:
            Dict[str, Any]: Recursively processed dictionary with camelCase keys.
        """
        # Initialize result dictionary
        result = {}

        # Process each key-value pair in the dictionary
        for key, value in data.items():
            # Step 1: Convert key to camelCase for JavaScript compatibility
            # If key is not a string, convert it to string first
            processed_key = snake_to_camel(key) if isinstance(key, str) else str(key)

            # Step 2: Process value recursively
            # Handles nested objects, enums, lists, etc.
            processed_value = self._process_value_for_serialization(value, config)

            # Step 3: Add processed key-value pair to result
            result[processed_key] = processed_value

        return result

    def _process_field_name_for_serialization(
        self,
        field_name: str,
        _config: SerializationConfig,
    ) -> str:
        """Process field name for serialization with special handling for known fields.

        Args:
            field_name: Original field name.
            config: Serialization configuration.

        Returns:
            str: Processed field name.
        """
        # Special handling for known column names to match frontend expectations
        # Import inside function to avoid circular import issues
        if field_name == "time":
            # Case 1: "time" field - use ColumnNames enum for consistency
            try:
                # pylint: disable=import-outside-toplevel
                from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames
            except ImportError:
                # Fallback to standard camelCase if import fails
                return snake_to_camel(field_name)
            else:
                return ColumnNames.TIME.value
        elif field_name == "value":
            # Case 2: "value" field - use ColumnNames enum for consistency
            try:
                # pylint: disable=import-outside-toplevel
                from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames
            except ImportError:
                # Fallback to standard camelCase if import fails
                return snake_to_camel(field_name)
            else:
                return ColumnNames.VALUE.value
        else:
            # Case 3: Regular field - convert snake_case to camelCase
            return snake_to_camel(field_name)


class SimpleSerializableMixin(SerializableMixin):
    """Simplified mixin for basic classes that need basic serialization.

    This variant provides a more straightforward serialization approach
    for simple data classes that don't need complex nested serialization
    or special field handling.
    """

    def asdict(self) -> dict[str, Any]:
        """Serialize to dictionary with basic camelCase conversion.

        Returns:
            Dict[str, Any]: Basic serialized representation.
        """
        return self._serialize_to_dict()


def create_serializable_mixin(
    config_override: SerializationConfig | None = None,
) -> type:
    """Factory function to create a configurable SerializableMixin.

    Args:
        config_override: Optional SerializationConfig to override defaults.

    Returns:
        type: A custom SerializableMixin class with the specified configuration.
    """
    # Use provided config or fall back to default configuration
    config = config_override or DEFAULT_CONFIG

    class ConfigurableSerializableMixin(SerializableMixin):
        """Configurable serialization mixin with custom config.

        This class provides a SerializableMixin variant with custom serialization
        configuration. It's useful when different classes need different
        serialization behaviors (e.g., some skip None, others don't).

        Attributes:
            config: The SerializationConfig instance to use for this mixin.
        """

        def _get_serialization_config(self) -> SerializationConfig:
            """Get the serialization configuration for this mixin.

            Returns:
                SerializationConfig: The configuration instance.
            """
            return config

        def asdict(self) -> dict[str, Any]:
            """Serialize to dictionary using the custom configuration.

            Returns:
                Dict[str, Any]: Serialized representation with custom config applied.
            """
            return self._serialize_to_dict(self._get_serialization_config())

    return ConfigurableSerializableMixin
