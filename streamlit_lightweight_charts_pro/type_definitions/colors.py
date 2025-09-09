"""
Color-related classes for Streamlit Lightweight Charts Pro.

This module provides Background classes for chart backgrounds with proper validation.
It includes classes for solid colors and gradient backgrounds, with comprehensive
color format validation supporting hex, RGB/RGBA, and named colors.

The module provides:
    - BackgroundSolid: For solid color backgrounds
    - BackgroundGradient: For gradient backgrounds
    - Background: Union type for both background types
    - Color validation utilities

These classes ensure type safety and proper color formatting for chart backgrounds,
with automatic validation during initialization.

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.type_definitions.colors import (
        BackgroundSolid, BackgroundGradient, Background
    )

    # Solid background
    solid_bg = BackgroundSolid(color="#ffffff")

    # Gradient background
    gradient_bg = BackgroundGradient(
        top_color="#ffffff",
        bottom_color="#f0f0f0"
    )

    # Using with charts
    chart = Chart().set_background(solid_bg)
    ```

Supported Color Formats:
    - Hex: "#FF0000", "#F00"
    - RGB: "rgb(255, 0, 0)"
    - RGBA: "rgba(255, 0, 0, 1)"
    - Named colors: "red", "blue", "white", etc.

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

import re
from abc import ABC
from dataclasses import dataclass
from typing import Union

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.type_definitions.enums import BackgroundStyle


def _is_valid_color(color: str) -> bool:
    """
    Validate if a color string is in a valid format.

    This function validates color strings against multiple formats commonly
    used in web development and chart styling. It supports hex colors,
    RGB/RGBA colors, and a set of common named colors.

    Args:
        color: Color string to validate. Supported formats:
            - Hex: "#FF0000", "#F00"
            - RGB: "rgb(255, 0, 0)"
            - RGBA: "rgba(255, 0, 0, 1)"
            - Named: "red", "blue", "white", etc.

    Returns:
        bool: True if the color format is valid, False otherwise.

    Example:
        ```python
        _is_valid_color("#FF0000")  # True
        _is_valid_color("rgb(255, 0, 0)")  # True
        _is_valid_color("red")  # True
        _is_valid_color("invalid")  # False
        ```

    Note:
        The function is permissive with whitespace in RGB/RGBA formats
        and accepts both 3-digit and 6-digit hex codes. Named colors
        are case-insensitive.
    """
    if not color or not isinstance(color, str):
        return False

    # Hex color pattern
    hex_pattern = r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
    if re.match(hex_pattern, color):
        return True

    # RGB/RGBA pattern - allow negative numbers for alpha
    rgba_pattern = r"^rgba?\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+\s*(?:,\s*-?[\d.]+\s*)?\)$"
    if re.match(rgba_pattern, color):
        return True

    # Named colors (basic support)
    named_colors = {
        "black",
        "white",
        "red",
        "green",
        "blue",
        "yellow",
        "cyan",
        "magenta",
        "gray",
        "grey",
        "orange",
        "purple",
        "brown",
        "pink",
        "lime",
        "navy",
        "teal",
        "silver",
        "gold",
        "maroon",
        "olive",
        "aqua",
        "fuchsia",
    }
    if color.lower() in named_colors:
        return True

    return False


@dataclass
class BackgroundSolid(Options, ABC):
    """
    Solid background color configuration.

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
        the _is_valid_color function.
    """

    color: str = "#ffffff"
    style: BackgroundStyle = BackgroundStyle.SOLID

    def __post_init__(self):
        """
        Post-initialization validation.

        Validates the color format after the dataclass is initialized.
        Raises a ValueError if the color is not in a valid format.

        Raises:
            ValueError: If the color format is invalid.
        """
        if not _is_valid_color(self.color):
            raise ValueError(
                f"Invalid color format: {self.color!r}. Must be hex, rgba, or named color."
            )


@dataclass
class BackgroundGradient(Options, ABC):
    """
    Gradient background configuration.

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
        bg = BackgroundGradient(
            top_color="#ffffff",
            bottom_color="#000000"
        )

        # Create a blue to red gradient
        bg = BackgroundGradient(
            top_color="blue",
            bottom_color="red"
        )

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
        """
        Post-initialization validation.

        Validates both color formats after the dataclass is initialized.
        Raises a ValueError if either color is not in a valid format.

        Raises:
            ValueError: If either color format is invalid.
        """
        if not _is_valid_color(self.top_color):
            raise ValueError(
                f"Invalid top_color format: {self.top_color!r}. Must be hex, rgba, or named color."
            )
        if not _is_valid_color(self.bottom_color):
            raise ValueError(
                f"Invalid bottom_color format: {self.bottom_color!r}. "
                "Must be hex, rgba, or named color."
            )


# Union type for all background types
Background = Union[BackgroundSolid, BackgroundGradient]
