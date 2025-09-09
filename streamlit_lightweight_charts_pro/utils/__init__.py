"""
Utilities for Streamlit Lightweight Charts Pro.

This module provides utility functions and decorators that enhance the functionality
of the charting library. It includes tools for method chaining, data processing,
and other common operations used throughout the package.

The module exports:
    - chainable_property: Decorator for creating chainable properties
    - chainable_field: Decorator for creating chainable fields

These utilities enable the fluent API design pattern used throughout the library,
allowing for intuitive method chaining when building charts and configuring options.

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.utils import chainable_property, chainable_field

    class ChartConfig:
        @chainable_property
        def height(self, value: int):
            self._height = value
            return self

        @chainable_field
        def width(self):
            return self._width
    ```

Note:
    Trade visualization utilities have been moved to frontend plugins to avoid
    circular imports with the options module. The functionality is still available
    but accessed directly from the relevant modules when needed.

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

from .chainable import chainable_field, chainable_property

# Trade visualization utilities have been removed - functionality is handled by frontend plugins
# to avoid circular imports with the options module

__all__ = [
    "chainable_property",
    "chainable_field",
    # Trade visualization functions are available directly from the module
    # when needed, avoiding circular imports
]
