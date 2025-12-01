"""Base options class for lightweight-charts-core.

This module provides the base Options class for all configuration classes.
"""

from abc import ABC
from dataclasses import dataclass, fields
from typing import Any

from lightweight_charts_core.utils.case_converter import CaseConverter
from lightweight_charts_core.utils.serialization import SerializableMixin


@dataclass
class Options(SerializableMixin, ABC):
    """Abstract base class for all option classes.

    Provides common functionality for option classes including automatic
    camelCase key conversion for frontend serialization.
    """

    def asdict(self) -> dict[str, Any]:
        """Serialize to dictionary with camelCase keys."""
        return self._serialize_to_dict()

    def update(self, config: dict[str, Any]) -> "Options":
        """Update options from dictionary.

        Args:
            config: Dictionary with snake_case or camelCase keys.

        Returns:
            Self for method chaining.

        """
        # Convert camelCase keys to snake_case
        snake_config = CaseConverter.convert_dict_keys(config, to_camel=False)

        for key, value in snake_config.items():
            if hasattr(self, key):
                setattr(self, key, value)

        return self

    @classmethod
    def fromdict(cls, data: dict[str, Any]) -> "Options":
        """Create instance from dictionary.

        Args:
            data: Dictionary with camelCase or snake_case keys.

        Returns:
            New instance with values from dictionary.

        """
        # Convert camelCase keys to snake_case
        snake_data = CaseConverter.convert_dict_keys(data, to_camel=False)

        # Get valid field names
        valid_fields = {f.name for f in fields(cls)}

        # Filter to only valid fields
        filtered_data = {k: v for k, v in snake_data.items() if k in valid_fields}

        return cls(**filtered_data)
