"""Color utility functions for chart styling.

This module provides comprehensive utilities for color manipulation and
validation used throughout the streamlit-lightweight-charts-pro package.
It handles conversions between color formats, opacity adjustments, and
validation of color strings.

The module supports:
    - Hex color to RGBA conversion
    - Opacity/alpha channel manipulation
    - Color format validation
    - Automatic format detection

Key Features:
    - Handles hex colors (#RRGGBB format)
    - Preserves non-hex colors (rgba, rgb, named colors)
    - Validates hex color format before conversion
    - Provides both functional and convenience APIs

Example:
    Convert hex colors to rgba with opacity::

        from lightweight_charts_core.utils.color_utils import add_opacity

        # Add 30% opacity to green color
        rgba_color = add_opacity("#4CAF50", 0.3)
        print(rgba_color)  # "rgba(76, 175, 80, 0.3)"

    Validate hex colors::

        from lightweight_charts_core.utils.color_utils import is_hex_color

        is_valid = is_hex_color("#FF0000")  # True
        is_valid = is_hex_color("red")  # False

Note:
    This module only handles standard hex format (#RRGGBB - 6 digits).
    Short hex format (#RGB - 3 digits) is not currently supported.

"""

# Standard Imports


def add_opacity(color: str, opacity: float = 0.3) -> str:
    """Convert hex color to rgba format with specified opacity.

    Takes a hex color string (e.g., "#4CAF50") and converts it to
    rgba format with the specified opacity level. This is useful for
    creating semi-transparent colors for overlays, backgrounds, or
    layered visualizations.

    If the input is already in rgba/rgb format or any non-hex format
    (like named colors), it is returned unchanged to avoid double
    conversion.

    Args:
        color (str): Hex color string starting with '#' (e.g., "#4CAF50").
            Must be in format #RRGGBB (7 characters total).
            If the color doesn't start with '#', it's returned as-is.
        opacity (float, optional): Opacity level between 0.0 (fully
            transparent) and 1.0 (fully opaque). Defaults to 0.3 (30%
            opacity).

    Returns:
        str: RGBA color string in format "rgba(r, g, b, opacity)" if
            input is hex, otherwise returns the original color string
            unchanged.

    Raises:
        ValueError: If hex color format is invalid (not exactly 7
            characters or contains non-hexadecimal digits).

    Example:
        >>> add_opacity("#4CAF50", 0.3)
        'rgba(76, 175, 80, 0.3)'

        >>> add_opacity("#FF0000", 0.5)
        'rgba(255, 0, 0, 0.5)'

        >>> add_opacity("rgba(255, 0, 0, 0.5)", 0.3)
        'rgba(255, 0, 0, 0.5)'

    Note:
        The function does not validate the opacity value range.
        Values outside 0.0-1.0 will be accepted but may produce
        unexpected results in the browser.

    """
    # Check if color starts with '#' to identify hex format
    # If not hex, it could be rgba, rgb, or named color - return unchanged
    if not color.startswith("#"):
        return color

    # Validate hex color format: must be exactly 7 characters (#RRGGBB)
    # This ensures we have the full 6-digit hex color format
    if len(color) != 7:
        raise ValueError(
            f"Invalid hex color format: {color}. "
            f"Expected format: #RRGGBB (7 characters including #)"
        )

    try:
        # Extract red component from characters 1-2 (after #)
        # Convert from hexadecimal (base 16) to decimal (base 10)
        r = int(color[1:3], 16)

        # Extract green component from characters 3-4
        g = int(color[3:5], 16)

        # Extract blue component from characters 5-6
        b = int(color[5:7], 16)

    except ValueError as e:
        # int() raises ValueError if the string contains non-hex characters
        # Re-raise with more descriptive error message
        raise ValueError(
            f"Invalid hex color: {color}. Must contain valid hexadecimal digits (0-9, A-F)."
        ) from e
    else:
        # All conversions successful, return formatted rgba string
        # Format: rgba(red, green, blue, opacity)
        return f"rgba({r}, {g}, {b}, {opacity})"


def hex_to_rgba(hex_color: str, alpha: float | None = None) -> str:
    """Convert hex color to rgba or rgb format.

    This function provides a more intuitive API for hex to rgba conversion
    compared to add_opacity(). When alpha is None, it returns rgb format
    instead of rgba, which is useful when opacity is not needed.

    Args:
        hex_color (str): Hex color string (e.g., "#4CAF50"). Must be in
            format #RRGGBB (7 characters total). Non-hex colors are
            returned unchanged.
        alpha (Optional[float]): Alpha/opacity value (0.0-1.0). If None,
            returns "rgb(r, g, b)" format without alpha channel.

    Returns:
        str: RGBA color string "rgba(r, g, b, alpha)" if alpha is
            provided, or RGB color string "rgb(r, g, b)" if alpha is None.
            Non-hex colors are returned unchanged.

    Raises:
        ValueError: If hex color format is invalid.

    Example:
        Convert to rgba with alpha::

            >>> hex_to_rgba("#4CAF50", 0.5)
            'rgba(76, 175, 80, 0.5)'

        Convert to rgb without alpha::

            >>> hex_to_rgba("#4CAF50")
            'rgb(76, 175, 80)'

        Non-hex colors pass through::

            >>> hex_to_rgba("red", 0.5)
            'red'

    Note:
        This is a convenience wrapper around add_opacity() that provides
        more flexibility with the alpha channel.

    """
    # If alpha is None, we want rgb format (no alpha channel)
    if alpha is None:
        # Check if input is hex format
        if not hex_color.startswith("#"):
            # Not hex, return unchanged (could be rgba, rgb, named color)
            return hex_color

        # Validate hex color length
        if len(hex_color) != 7:
            raise ValueError(f"Invalid hex color format: {hex_color}")

        # Convert hex to decimal RGB values
        # Extract and convert red component
        r = int(hex_color[1:3], 16)
        # Extract and convert green component
        g = int(hex_color[3:5], 16)
        # Extract and convert blue component
        b = int(hex_color[5:7], 16)

        # Return RGB format without alpha channel
        return f"rgb({r}, {g}, {b})"

    # If alpha is provided, use add_opacity to get rgba format
    return add_opacity(hex_color, alpha)


def is_hex_color(color: str) -> bool:
    """Check if a string is a valid hex color.

    Validates that a string follows the standard hex color format
    (#RRGGBB - 7 characters total). This is useful for input validation
    before attempting color conversion.

    The function checks:
        - Input is a string type
        - String starts with '#'
        - String is exactly 7 characters long
        - Last 6 characters are valid hexadecimal digits (0-9, A-F)

    Args:
        color (str): Color string to validate.

    Returns:
        bool: True if the string is a valid hex color in #RRGGBB format,
            False otherwise.

    Example:
        Valid hex colors::

            >>> is_hex_color("#4CAF50")
            True

            >>> is_hex_color("#FF0000")
            True

        Invalid formats::

            >>> is_hex_color("rgba(76, 175, 80, 0.3)")
            False

            >>> is_hex_color("#FFF")
            False  # Too short (must be 6 digits)

            >>> is_hex_color("red")
            False  # Named color, not hex

            >>> is_hex_color("#GGGGGG")
            False  # Invalid hex digits

    Note:
        This function only validates the standard 6-digit hex format.
        Short format (#RGB) and 8-digit format with alpha (#RRGGBBAA)
        are not considered valid by this function.

    """
    # First check: ensure input is a string type
    # This prevents errors when trying to call string methods
    if not isinstance(color, str):
        return False

    # Second check: hex colors must start with '#'
    if not color.startswith("#"):
        return False

    # Third check: must be exactly 7 characters (#RRGGBB)
    # This ensures we have the standard hex format
    if len(color) != 7:
        return False

    # Fourth check: validate that characters after '#' are hex digits
    try:
        # Try to convert the 6 characters after '#' to an integer
        # using base 16 (hexadecimal)
        # This will raise ValueError if any character is not 0-9 or A-F
        int(color[1:], 16)
    except ValueError:
        # Not valid hexadecimal digits
        return False
    else:
        # All checks passed - this is a valid hex color
        return True
