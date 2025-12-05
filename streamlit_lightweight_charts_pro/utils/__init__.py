"""Utility functions and classes for Streamlit Lightweight Charts Pro.

This module provides a collection of utility functions and classes that support
chart creation, data manipulation, serialization, and performance profiling in
the Streamlit Lightweight Charts Pro library.

The module primarily re-exports utilities from the lightweight_charts_pro core
package, ensuring a consistent interface across both the core library and the
Streamlit wrapper.

Available Utilities:
    Color Utilities:
        - add_opacity: Add alpha channel to hex colors
        - hex_to_rgba: Convert hex colors to RGBA tuples
        - is_hex_color: Validate hex color format
        - is_valid_color: Validate any color format

    String Conversion:
        - camel_to_snake: Convert camelCase to snake_case
        - snake_to_camel: Convert snake_case to camelCase
        - CaseConverter: Class for case conversion operations

    Serialization:
        - SerializableMixin: Base class for serializable objects
        - SimpleSerializableMixin: Simplified serialization mixin
        - SerializationConfig: Configuration for serialization behavior
        - DEFAULT_CONFIG: Default serialization configuration

    Field Decorators:
        - chainable_field: Create chainable setter methods
        - chainable_property: Create chainable properties
        - validated_field: Add validation to fields

    Time Utilities:
        - normalize_time: Normalize various time formats

    Performance Profiling:
        - Profiler: Performance profiling class
        - profile_method: Decorator for method profiling

Example:
    Using color utilities::

        from streamlit_lightweight_charts_pro.utils import add_opacity, hex_to_rgba

        # Add transparency to a color
        transparent_red = add_opacity("#FF0000", 0.5)  # Returns "#FF000080"

        # Convert hex to RGBA
        rgba = hex_to_rgba("#FF0000")  # Returns (255, 0, 0, 255)

    Using case conversion::

        from streamlit_lightweight_charts_pro.utils import snake_to_camel

        # Convert API field names
        camel_name = snake_to_camel("price_scale_id")  # Returns "priceScaleId"

    Using profiling::

        from streamlit_lightweight_charts_pro.utils import profile_method

        class MyChart:
            @profile_method
            def render(self):
                # Method execution time will be logged
                pass

Note:
    All utilities in this module are imported from the lightweight_charts_pro
    core package. This ensures consistent behavior and maintains a single
    source of truth for utility implementations.

For detailed documentation on each utility, refer to the lightweight_charts_pro
package documentation.
"""

# Standard Imports
# (None in this module)

# Third Party Imports
# Import all utilities from the core lightweight_charts_pro package
# These utilities provide common functionality needed throughout the library
from lightweight_charts_pro.utils import (
    DEFAULT_CONFIG,  # Default serialization configuration
    CaseConverter,  # Class for converting between naming conventions
    SerializableMixin,  # Base class for objects that can be serialized to JSON
    SerializationConfig,  # Configuration class for serialization behavior
    SimpleSerializableMixin,  # Simplified version of SerializableMixin
    add_opacity,  # Add alpha channel (opacity) to hex color codes
    camel_to_snake,  # Convert camelCase strings to snake_case
    chainable_field,  # Decorator to make field setters chainable
    chainable_property,  # Decorator to make properties chainable
    hex_to_rgba,  # Convert hex color codes to RGBA tuples
    is_hex_color,  # Validate if string is a valid hex color
    is_valid_color,  # Validate if string is any valid color format
    normalize_time,  # Normalize various time formats to consistent representation
    snake_to_camel,  # Convert snake_case strings to camelCase
    validated_field,  # Decorator to add validation to field setters
)

# Import profiling utilities for performance monitoring and optimization
# These are particularly useful during development and debugging
from lightweight_charts_pro.utils.profiler import (
    Profiler,  # Class for profiling code execution time
    profile_method,  # Decorator for automatically profiling method execution
)

# Local Imports
# (None - this module only re-exports utilities from core)

# Export all public utilities
# Organized alphabetically for easy reference
__all__ = [
    # Configuration
    "DEFAULT_CONFIG",
    # Case conversion
    "CaseConverter",
    "camel_to_snake",
    "snake_to_camel",
    # Serialization
    "SerializableMixin",
    "SerializationConfig",
    "SimpleSerializableMixin",
    # Color utilities
    "add_opacity",
    "hex_to_rgba",
    "is_hex_color",
    "is_valid_color",
    # Field decorators
    "chainable_field",
    "chainable_property",
    "validated_field",
    # Time utilities
    "normalize_time",
    # Profiling
    "Profiler",
    "profile_method",
]
