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

from __future__ import annotations

import math
from dataclasses import fields
from enum import Enum
from typing import Any

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
        result = {}
        override_fields = override_fields or {}

        for field in fields(self):
            field_name = field.name

            # Use override value if provided, otherwise get actual value
            value = override_fields.get(field_name, getattr(self, field_name))

            # Apply config-based filtering
            if not self._should_include_value(value, config):
                continue

            # Convert field and value
            processed_value = self._process_value_for_serialization(value, config)
            processed_field = self._process_field_name_for_serialization(field_name, config)

            # Handle special flattening rules
            if (
                config.flatten_options_fields
                and field_name.endswith("_options")
                and isinstance(processed_value, dict)
                and field_name == "background_options"  # Only flatten specific fields
            ):
                # Merge flattened fields into result instead of nesting
                result.update(processed_value)
            else:
                # Add normal or nested field
                result[processed_field] = processed_value

        return result

    def _should_include_value(self, value: Any, config: SerializationConfig) -> bool:
        """Determine if a value should be included in serialized output.

        Args:
            value: The value to check.
            config: Serialization configuration.

        Returns:
            bool: True if the value should be included, False otherwise.
        """
        if value is None and config.skip_none:
            return False

        if value == "" and config.skip_empty_strings:
            return False

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
        # Handle NaN floats
        if isinstance(value, float) and math.isnan(value) and config.convert_nan_to_zero:
            return 0.0

        # Convert NumPy scalar types to Python native types
        if hasattr(value, "item"):  # NumPy scalar types
            value = value.item()

        # Convert enums to their values
        if config.convert_enums and isinstance(value, Enum):
            value = value.value

        # Handle nested serializable objects
        if hasattr(value, "asdict") and callable(value.asdict):
            value = value.asdict()

        # Handle serializable lists recursively
        elif isinstance(value, list):
            return self._serialize_list_recursively(value, config)

        # Handle nested dictionaries recursively
        elif isinstance(value, dict):
            return self._serialize_dict_recursively(value, config)

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
        processed_items = []
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
        result = {}
        for key, value in data.items():
            # Convert key to camelCase if it's a string
            processed_key = snake_to_camel(str(key)) if isinstance(key, str) else key
            processed_value = self._process_value_for_serialization(value, config)
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
        # Special handling for known column names (avoid import at module level)
        if field_name == "time":
            try:
                from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames
            except ImportError:
                return snake_to_camel(field_name)
            else:
                return ColumnNames.TIME.value
        elif field_name == "value":
            try:
                from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames
            except ImportError:
                return snake_to_camel(field_name)
            else:
                return ColumnNames.VALUE.value
        else:
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


def create_serializable_mixin(config_override: SerializationConfig = None) -> type:
    """Factory function to create a configurable SerializableMixin.

    Args:
        config_override: Optional SerializationConfig to override defaults.

    Returns:
        type: A custom SerializableMixin class with the specified configuration.
    """
    config = config_override or DEFAULT_CONFIG

    class ConfigurableSerializableMixin(SerializableMixin):
        def _get_serialization_config(self) -> SerializationConfig:
            return config

        def asdict(self) -> dict[str, Any]:
            return self._serialize_to_dict(self._get_serialization_config())

    return ConfigurableSerializableMixin
