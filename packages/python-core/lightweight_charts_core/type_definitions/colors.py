"""Color-related classes for Streamlit Lightweight Charts Pro.

This module provides comprehensive background classes for chart backgrounds with
proper validation and type safety. It includes classes for solid colors and gradient
backgrounds, with extensive color format validation supporting hex, RGB/RGBA, and
named colors commonly used in financial chart visualization.

The module provides:
    - BackgroundSolid: For solid color backgrounds with validation
    - BackgroundGradient: For gradient backgrounds with color transitions
    - Background: Union type for both background types
    - Color validation utilities with comprehensive format support
    - Background style enumeration for different rendering modes

These classes ensure type safety, proper color formatting, and validation for chart
backgrounds, with automatic validation during initialization and comprehensive
error handling for invalid color formats.

Key Features:
    - Comprehensive color format validation (hex, RGB, RGBA, named colors)
    - Type-safe background configuration with validation
    - Gradient support with top and bottom color specification
    - Automatic color format normalization and validation
    - Clear error messages for invalid color formats
    - Support for transparency and alpha channels

Example Usage:
    ```python
    from lightweight_charts_core.type_definitions.colors import (
        BackgroundSolid,
        BackgroundGradient,
        Background,
    )

    # Solid background with validation
    solid_bg = BackgroundSolid(color="#ffffff")

    # Gradient background with color transitions
    gradient_bg = BackgroundGradient(top_color="#ffffff", bottom_color="#f0f0f0")

    # Using with charts
    chart = Chart().set_background(solid_bg)
    ```

Supported Color Formats:
    - Hex: "#FF0000", "#F00" (3 or 6 digit hex codes)
    - RGB: "rgb(255, 0, 0)" (with or without spaces)
    - RGBA: "rgba(255, 0, 0, 0.5)" (with alpha channel support)
    - Named colors: "red", "blue", "white", "transparent", etc.

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from abc import ABC
from dataclasses import dataclass
from typing import Union

from lightweight_charts_core.exceptions import ColorValidationError
from lightweight_charts_core.type_definitions.enums import BackgroundStyle

# Local Imports
from lightweight_charts_core.types.options import Options
from lightweight_charts_core.utils.data_utils import is_valid_color


@dataclass
class BackgroundSolid(Options, ABC):
    """Solid background color configuration.

    This class represents a solid color background for charts. It provides
    type safety and validation for color values, ensuring that only valid
    color formats are accepted.

    The class inherits from Options and ABC to provide consistent interface
    with other chart options and enable proper serialization.

    Attributes:
        color: The color string in any valid CSS format. Defaults to white.
        style: The background style, always set to SOLID for this class.

    Example:
        ```python
        # Create a solid white background
        bg = BackgroundSolid(color="#ffffff")

        # Create a solid red background
        bg = BackgroundSolid(color="red")

        # Use with chart
        chart = Chart().set_background(bg)
        ```

    Raises:
        ValueError: If the color format is invalid.

    Note:
        The color attribute is validated during initialization using
        the is_valid_color function.

    """

    color: str = "#ffffff"
    style: BackgroundStyle = BackgroundStyle.SOLID

    def __post_init__(self):
        """Post-initialization validation.

        Validates the color format after the dataclass is initialized.
        Raises a ValueError if the color is not in a valid format.

        Raises:
            ValueError: If the color format is invalid.

        """
        # Validate the color format using the comprehensive validation function
        # This ensures that only valid CSS color formats are accepted
        # The validation supports hex, RGB, RGBA, and named colors
        if not is_valid_color(self.color):
            # Raise a specific validation error with the field name and invalid value
            # This provides clear feedback about what went wrong during initialization
            raise ColorValidationError("color", self.color)


@dataclass
class BackgroundGradient(Options, ABC):
    """Gradient background configuration.

    This class represents a gradient background for charts, transitioning
    from a top color to a bottom color. It provides type safety and
    validation for both color values.

    The class inherits from Options and ABC to provide consistent interface
    with other chart options and enable proper serialization.

    Attributes:
        top_color: The top color string in any valid CSS format. Defaults to white.
        bottom_color: The bottom color string in any valid CSS format. Defaults to black.
        style: The background style, always set to VERTICAL_GRADIENT for this class.

    Example:
        ```python
        # Create a white to black gradient
        bg = BackgroundGradient(top_color="#ffffff", bottom_color="#000000")

        # Create a blue to red gradient
        bg = BackgroundGradient(top_color="blue", bottom_color="red")

        # Use with chart
        chart = Chart().set_background(bg)
        ```

    Raises:
        ValueError: If either color format is invalid.

    Note:
        Both top_color and bottom_color are validated during initialization
        using the _is_valid_color function.

    """

    top_color: str = "#ffffff"
    bottom_color: str = "#000000"
    style: BackgroundStyle = BackgroundStyle.VERTICAL_GRADIENT

    def __post_init__(self):
        """Post-initialization validation.

        Validates both color formats after the dataclass is initialized.
        Raises a ValueError if either color is not in a valid format.

        Raises:
            ValueError: If either color format is invalid.

        """
        # Validate the top color format using the comprehensive validation function
        # This ensures that the top color is in a valid CSS format
        # The validation supports hex, RGB, RGBA, and named colors
        if not is_valid_color(self.top_color):
            # Raise a specific validation error with the field name and invalid value
            # This provides clear feedback about what went wrong with the top color
            raise ColorValidationError("top_color", self.top_color)

        # Validate the bottom color format using the comprehensive validation function
        # This ensures that the bottom color is in a valid CSS format
        # The validation supports hex, RGB, RGBA, and named colors
        if not is_valid_color(self.bottom_color):
            # Raise a specific validation error with the field name and invalid value
            # This provides clear feedback about what went wrong with the bottom color
            raise ColorValidationError("bottom_color", self.bottom_color)


# Union type for all background types
Background = Union[BackgroundSolid, BackgroundGradient]
