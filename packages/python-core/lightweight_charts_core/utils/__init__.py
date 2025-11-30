"""Utilities for lightweight-charts-core.

This module provides utility functions and decorators that enhance the functionality
of the charting library.
"""

from lightweight_charts_core.utils.case_converter import (
    CaseConverter,
    camel_to_snake,
    snake_to_camel,
)
from lightweight_charts_core.utils.chainable import (
    chainable_field,
    chainable_property,
    validated_field,
)
from lightweight_charts_core.utils.color_utils import (
    add_opacity,
    hex_to_rgba,
    is_hex_color,
)
from lightweight_charts_core.utils.data_utils import (
    from_utc_timestamp,
    is_valid_color,
    normalize_time,
    to_utc_timestamp,
    validate_min_move,
    validate_precision,
    validate_price_format_type,
)
from lightweight_charts_core.utils.serialization import (
    DEFAULT_CONFIG,
    SerializableMixin,
    SerializationConfig,
    SimpleSerializableMixin,
)

__all__ = [
    "CaseConverter",
    "DEFAULT_CONFIG",
    "SerializableMixin",
    "SerializationConfig",
    "SimpleSerializableMixin",
    "add_opacity",
    "camel_to_snake",
    "chainable_field",
    "chainable_property",
    "from_utc_timestamp",
    "hex_to_rgba",
    "is_hex_color",
    "is_valid_color",
    "normalize_time",
    "snake_to_camel",
    "to_utc_timestamp",
    "validate_min_move",
    "validate_precision",
    "validate_price_format_type",
    "validated_field",
]
