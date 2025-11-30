"""Color utilities for lightweight-charts-core.

This module provides utility functions for color manipulation.
"""

import re
from typing import Tuple


def hex_to_rgba(hex_color: str, opacity: float = 1.0) -> str:
    """Convert hex color to rgba format.

    Args:
        hex_color: Hex color string (e.g., "#FF0000" or "#F00").
        opacity: Opacity value between 0 and 1.

    Returns:
        RGBA color string.
    """
    hex_color = hex_color.lstrip("#")

    if len(hex_color) == 3:
        hex_color = "".join(c * 2 for c in hex_color)

    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)

    return f"rgba({r}, {g}, {b}, {opacity})"


def add_opacity(color: str, opacity: float) -> str:
    """Add opacity to a color string.

    Args:
        color: Color string (hex or rgba format).
        opacity: Opacity value between 0 and 1.

    Returns:
        RGBA color string with the specified opacity.
    """
    if color.startswith("#"):
        return hex_to_rgba(color, opacity)

    rgba_match = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)", color)
    if rgba_match:
        r, g, b = rgba_match.groups()
        return f"rgba({r}, {g}, {b}, {opacity})"

    return color


def is_hex_color(color: str) -> bool:
    """Check if a string is a valid hex color.

    Args:
        color: String to check.

    Returns:
        True if valid hex color, False otherwise.
    """
    if not isinstance(color, str):
        return False

    pattern = r"^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$"
    return bool(re.match(pattern, color))


def parse_rgba(color: str) -> Tuple[int, int, int, float]:
    """Parse RGBA color string into components.

    Args:
        color: RGBA color string.

    Returns:
        Tuple of (r, g, b, a) values.

    Raises:
        ValueError: If the color string is not valid RGBA format.
    """
    match = re.match(r"rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)", color)
    if not match:
        raise ValueError(f"Invalid RGBA color format: {color}")

    r = int(match.group(1))
    g = int(match.group(2))
    b = int(match.group(3))
    a = float(match.group(4)) if match.group(4) else 1.0

    return (r, g, b, a)


__all__ = [
    "add_opacity",
    "hex_to_rgba",
    "is_hex_color",
    "parse_rgba",
]
