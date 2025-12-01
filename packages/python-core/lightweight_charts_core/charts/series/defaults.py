"""Default configurations for series line options.

This module provides default line option configurations used across multiple series types.
Using centralized defaults ensures consistency and makes it easier to maintain
the visual style across the charting library.

These defaults follow a color-coded semantic scheme:
- Green (#4CAF50): Upper lines, uptrends, positive movement
- Blue (#2196F3): Middle lines, neutral reference
- Red (#F44336): Lower lines, downtrends, negative movement
- Gray (#666666): Base lines, hidden reference lines

Google-style docstrings are used throughout.
"""

from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.type_definitions.enums import LineStyle

# Default color constants for semantic meaning
COLOR_UPPER_GREEN = "#4CAF50"  # Material Design Green 500
COLOR_MIDDLE_BLUE = "#2196F3"  # Material Design Blue 500
COLOR_LOWER_RED = "#F44336"  # Material Design Red 500
COLOR_BASE_GRAY = "#666666"  # Neutral gray

# Default line widths
LINE_WIDTH_STANDARD = 2
LINE_WIDTH_THIN = 1


def create_upper_line() -> LineOptions:
    """Create default line options for upper lines.

    Used for:
    - Band series upper line
    - Ribbon series upper line
    - Trend fill uptrend line

    Returns:
        LineOptions configured with green color, standard width, solid style.

    """
    return LineOptions(
        color=COLOR_UPPER_GREEN, line_width=LINE_WIDTH_STANDARD, line_style=LineStyle.SOLID
    )


def create_middle_line() -> LineOptions:
    """Create default line options for middle lines.

    Used for:
    - Band series middle line

    Returns:
        LineOptions configured with blue color, standard width, solid style.

    """
    return LineOptions(
        color=COLOR_MIDDLE_BLUE, line_width=LINE_WIDTH_STANDARD, line_style=LineStyle.SOLID
    )


def create_lower_line() -> LineOptions:
    """Create default line options for lower lines.

    Used for:
    - Band series lower line
    - Ribbon series lower line
    - Trend fill downtrend line

    Returns:
        LineOptions configured with red color, standard width, solid style.

    """
    return LineOptions(
        color=COLOR_LOWER_RED, line_width=LINE_WIDTH_STANDARD, line_style=LineStyle.SOLID
    )


def create_base_line() -> LineOptions:
    """Create default line options for hidden base/reference lines.

    Used for:
    - Trend fill base line (reference line for fill area)

    Returns:
        LineOptions configured with gray color, thin width, dotted style, hidden.

    """
    return LineOptions(
        color=COLOR_BASE_GRAY,
        line_width=LINE_WIDTH_THIN,
        line_style=LineStyle.DOTTED,
        line_visible=False,
    )


def create_uptrend_line() -> LineOptions:
    """Create default line options for uptrend lines.

    Alias for create_upper_line() with more descriptive name for trend-based series.

    Returns:
        LineOptions configured for uptrend visualization (green, solid).

    """
    return create_upper_line()


def create_downtrend_line() -> LineOptions:
    """Create default line options for downtrend lines.

    Alias for create_lower_line() with more descriptive name for trend-based series.

    Returns:
        LineOptions configured for downtrend visualization (red, solid).

    """
    return create_lower_line()
