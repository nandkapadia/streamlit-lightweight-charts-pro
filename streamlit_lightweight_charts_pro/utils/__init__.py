"""Utilities for Streamlit Lightweight Charts Pro.

This module re-exports utilities from lightweight_charts_core and provides
additional Streamlit-specific utilities like profiling.
"""

# Import all utilities from core
from lightweight_charts_core.utils import (
    CaseConverter,
    DEFAULT_CONFIG,
    SerializableMixin,
    SerializationConfig,
    SimpleSerializableMixin,
    add_opacity,
    camel_to_snake,
    chainable_field,
    chainable_property,
    hex_to_rgba,
    is_hex_color,
    is_valid_color,
    normalize_time,
    snake_to_camel,
    validated_field,
)

# Streamlit-specific utilities
from .profiler import Profiler, profile_method

__all__ = [
    # From core
    "CaseConverter",
    "DEFAULT_CONFIG",
    "SerializableMixin",
    "SerializationConfig",
    "SimpleSerializableMixin",
    "add_opacity",
    "camel_to_snake",
    "chainable_field",
    "chainable_property",
    "hex_to_rgba",
    "is_hex_color",
    "is_valid_color",
    "normalize_time",
    "snake_to_camel",
    "validated_field",
    # Streamlit-specific
    "Profiler",
    "profile_method",
]
