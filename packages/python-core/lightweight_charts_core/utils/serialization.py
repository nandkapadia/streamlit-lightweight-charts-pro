"""Serialization utilities for lightweight-charts-core.

This module provides base classes and utilities for consistent serialization
of Python data structures to frontend-compatible JavaScript dictionary formats.
"""

from __future__ import annotations

import math
from dataclasses import fields
from enum import Enum
from typing import Any

from lightweight_charts_core.utils.case_converter import CaseConverter

snake_to_camel = CaseConverter.snake_to_camel


class SerializationConfig:
    """Configuration for serialization behavior.

    Attributes:
        skip_none: If True, fields with None values are omitted.
        skip_empty_strings: If True, fields with empty string values are omitted.
        skip_empty_dicts: If True, fields with empty dictionary values are omitted.
        convert_nan_to_zero: If True, NaN float values are converted to 0.0.
        convert_enums: If True, Enum instances are converted to their values.
        flatten_options_fields: If True, fields ending in '_options' are flattened.
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
        self.skip_none = skip_none
        self.skip_empty_strings = skip_empty_strings
        self.skip_empty_dicts = skip_empty_dicts
        self.convert_nan_to_zero = convert_nan_to_zero
        self.convert_enums = convert_enums
        self.flatten_options_fields = flatten_options_fields


DEFAULT_CONFIG = SerializationConfig()


class SerializableMixin:
    """Mixin class that provides standardized serialization capabilities."""

    def _serialize_to_dict(
        self,
        config: SerializationConfig = DEFAULT_CONFIG,
        override_fields: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Serialize the object to a dictionary with camelCase keys.

        Args:
            config: Configuration instance controlling serialization behavior.
            override_fields: Dictionary of field overrides.

        Returns:
            Serialized data with camelCase keys.
        """
        result: dict[str, Any] = {}
        override_fields = override_fields or {}

        for field in fields(self):  # type: ignore[arg-type]
            field_name = field.name
            value = override_fields.get(field_name, getattr(self, field_name))

            if not self._should_include_value(value, config):
                continue

            processed_value = self._process_value_for_serialization(value, config)
            processed_field = self._process_field_name_for_serialization(field_name, config)

            if (
                config.flatten_options_fields
                and field_name.endswith("_options")
                and isinstance(processed_value, dict)
                and field_name == "background_options"
            ):
                result.update(processed_value)
            else:
                result[processed_field] = processed_value

        return result

    def _should_include_value(self, value: Any, config: SerializationConfig) -> bool:
        """Determine if a value should be included in serialized output."""
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
        """Process a value during serialization with type-specific conversions."""
        if isinstance(value, float) and math.isnan(value) and config.convert_nan_to_zero:
            return 0.0

        if hasattr(value, "item"):
            value = value.item()

        if config.convert_enums and isinstance(value, Enum):
            value = value.value

        if hasattr(value, "asdict") and callable(value.asdict):
            value = value.asdict()
        elif isinstance(value, list):
            return self._serialize_list_recursively(value, config)
        elif isinstance(value, dict):
            return self._serialize_dict_recursively(value, config)

        return value

    def _serialize_list_recursively(
        self,
        items: list[Any],
        config: SerializationConfig,
    ) -> list[Any]:
        """Serialize a list recursively."""
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
        """Serialize a dictionary recursively with key conversion."""
        result = {}

        for key, value in data.items():
            processed_key = snake_to_camel(key) if isinstance(key, str) else str(key)
            processed_value = self._process_value_for_serialization(value, config)
            result[processed_key] = processed_value

        return result

    def _process_field_name_for_serialization(
        self,
        field_name: str,
        _config: SerializationConfig,
    ) -> str:
        """Process field name for serialization with special handling."""
        from lightweight_charts_core.type_definitions.enums import ColumnNames

        if field_name == "time":
            return ColumnNames.TIME.value
        elif field_name == "value":
            return ColumnNames.VALUE.value
        else:
            return snake_to_camel(field_name)


class SimpleSerializableMixin(SerializableMixin):
    """Simplified mixin for basic classes with default asdict() implementation."""

    def asdict(self) -> dict[str, Any]:
        """Serialize to dictionary with basic camelCase conversion."""
        return self._serialize_to_dict()


def create_serializable_mixin(
    config_override: SerializationConfig | None = None,
) -> type:
    """Factory function to create a configurable SerializableMixin.

    Args:
        config_override: Custom serialization configuration.

    Returns:
        A custom SerializableMixin class with the specified configuration.
    """
    config = config_override or DEFAULT_CONFIG

    class ConfigurableSerializableMixin(SerializableMixin):
        """Configurable serialization mixin with custom config."""

        def _get_serialization_config(self) -> SerializationConfig:
            """Get the serialization configuration for this mixin."""
            return config

        def asdict(self) -> dict[str, Any]:
            """Serialize to dictionary using the custom configuration."""
            return self._serialize_to_dict(self._get_serialization_config())

    return ConfigurableSerializableMixin


__all__ = [
    "DEFAULT_CONFIG",
    "SerializableMixin",
    "SerializationConfig",
    "SimpleSerializableMixin",
    "create_serializable_mixin",
    "snake_to_camel",
]
