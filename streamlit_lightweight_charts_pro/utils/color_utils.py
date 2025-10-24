"""Color utility functions for chart styling.

This module provides utilities for color manipulation, including:
- Converting hex colors to rgba format
- Adding opacity to colors
- Color validation

Google-style docstrings are used throughout.
"""

from typing import Optional


def add_opacity(color: str, opacity: float = 0.3) -> str:
    """Convert hex color to rgba format with specified opacity.

    Takes a hex color string (e.g., "#4CAF50") and converts it to
    rgba format with the specified opacity level.

    If the input is already in rgba/rgb format or any non-hex format,
    it is returned unchanged.

    Args:
        color: Hex color string starting with '#' (e.g., "#4CAF50").
               If the color doesn't start with '#', it's returned as-is.
        opacity: Opacity level between 0.0 (fully transparent) and 1.0 (fully opaque).
                Defaults to 0.3 (30% opacity).

    Returns:
        RGBA color string in format "rgba(r, g, b, opacity)" if input is hex,
        otherwise returns the original color string unchanged.

    Examples:
        >>> add_opacity("#4CAF50", 0.3)
        'rgba(76, 175, 80, 0.3)'

        >>> add_opacity("#FF0000", 0.5)
        'rgba(255, 0, 0, 0.5)'

        >>> add_opacity("rgba(255, 0, 0, 0.5)", 0.3)
        'rgba(255, 0, 0, 0.5)'  # Already rgba, returned unchanged

    Raises:
        ValueError: If hex color format is invalid (not 6 hex digits after #).
    """
    # If not a hex color, return as-is (could be rgba, rgb, or named color)
    if not color.startswith("#"):
        return color

    # Validate hex color format
    if len(color) != 7:
        raise ValueError(
            f"Invalid hex color format: {color}. "
            f"Expected format: #RRGGBB (7 characters including #)"
        )

    try:
        # Extract RGB components
        r = int(color[1:3], 16)
        g = int(color[3:5], 16)
        b = int(color[5:7], 16)
    except ValueError as e:
        raise ValueError(
            f"Invalid hex color: {color}. Must contain valid hexadecimal digits."
        ) from e
    else:
        return f"rgba({r}, {g}, {b}, {opacity})"


def hex_to_rgba(hex_color: str, alpha: Optional[float] = None) -> str:
    """Convert hex color to rgba format.

    Alias for add_opacity() with more intuitive name.

    Args:
        hex_color: Hex color string (e.g., "#4CAF50").
        alpha: Alpha/opacity value (0.0-1.0). If None, returns "rgb(r, g, b)".

    Returns:
        RGBA or RGB color string.

    Examples:
        >>> hex_to_rgba("#4CAF50", 0.5)
        'rgba(76, 175, 80, 0.5)'

        >>> hex_to_rgba("#4CAF50")
        'rgb(76, 175, 80)'
    """
    if alpha is None:
        if not hex_color.startswith("#"):
            return hex_color

        if len(hex_color) != 7:
            raise ValueError(f"Invalid hex color format: {hex_color}")

        r = int(hex_color[1:3], 16)
        g = int(hex_color[3:5], 16)
        b = int(hex_color[5:7], 16)

        return f"rgb({r}, {g}, {b})"

    return add_opacity(hex_color, alpha)


def is_hex_color(color: str) -> bool:
    """Check if a string is a valid hex color.

    Args:
        color: Color string to check.

    Returns:
        True if the string is a valid hex color (#RRGGBB format), False otherwise.

    Examples:
        >>> is_hex_color("#4CAF50")
        True

        >>> is_hex_color("rgba(76, 175, 80, 0.3)")
        False

        >>> is_hex_color("#FFF")
        False  # Must be 6 digits
    """
    if not isinstance(color, str):
        return False

    if not color.startswith("#"):
        return False

    if len(color) != 7:
        return False

    try:
        int(color[1:], 16)
    except ValueError:
        return False
    else:
        return True
