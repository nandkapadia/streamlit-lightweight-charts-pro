"""Utilities for Streamlit Lightweight Charts Pro.

This module re-exports utilities from lightweight_charts_core and provides
additional Streamlit-specific utilities like profiling.
"""

# Import all utilities from core
from lightweight_charts_core.utils import (
    DEFAULT_CONFIG,
    CaseConverter,
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

# Also re-export profiler from core
from lightweight_charts_core.utils.profiler import Profiler, profile_method

__all__ = [
    "DEFAULT_CONFIG",
    # From core
    "CaseConverter",
    # Streamlit-specific
    "Profiler",
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
    "profile_method",
    "snake_to_camel",
    "validated_field",
]
