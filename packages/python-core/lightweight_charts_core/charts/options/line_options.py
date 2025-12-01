"""Line options configuration for streamlit-lightweight-charts.

This module provides line styling option classes for configuring
the appearance of line series on charts. It includes comprehensive
styling options for line visualization including colors, styles,
markers, and animation effects.

Key Features:
    - Line color, style, and width customization
    - Point marker configuration for data points
    - Crosshair marker styling for interaction
    - Animation effects for price updates
    - Line type options (simple, curved, stepped)
    - Visibility controls for different line elements

Example:
    ```python
    from lightweight_charts_core.charts.options import LineOptions
    from lightweight_charts_core.type_definitions.enums import LineStyle, LineType

    # Create line options with custom styling
    line_opts = LineOptions(
        color="#2196F3", line_style=LineStyle.SOLID, line_width=2, point_markers_visible=True
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT

"""

# Standard Imports
from dataclasses import dataclass

# Local Imports
from lightweight_charts_core.charts.options.base_options import Options
from lightweight_charts_core.exceptions import ColorValidationError
from lightweight_charts_core.type_definitions.enums import (
    LastPriceAnimationMode,
    LineStyle,
    LineType,
)
from lightweight_charts_core.utils import chainable_field
from lightweight_charts_core.utils.data_utils import is_valid_color


@dataclass
@chainable_field("color", str, validator="color")
@chainable_field("line_style", LineStyle)
@chainable_field("line_width", int)
@chainable_field("line_type", LineType)
@chainable_field("line_visible", bool)
@chainable_field("point_markers_visible", bool)
@chainable_field("point_markers_radius", int)
@chainable_field("crosshair_marker_visible", bool)
@chainable_field("crosshair_marker_radius", int)
@chainable_field("crosshair_marker_border_color", str, validator="color")
@chainable_field("crosshair_marker_background_color", str, validator="color")
@chainable_field("crosshair_marker_border_width", int)
@chainable_field("last_price_animation", LastPriceAnimationMode)
class LineOptions(Options):
    """Comprehensive styling options for line series in financial chart visualization.

    This class encapsulates all the styling options that control how a line series
    appears on a chart. It mirrors TradingView's LineStyleOptions interface and
    provides extensive customization capabilities for line visualization.

    The LineOptions class supports various line styles, marker configurations,
    animation effects, and visual customization options to create professional-looking
    line charts for financial data visualization.

    Attributes:
        color (str): Line color in hex or rgba format. Defaults to "#2196f3" (blue).
            Must be a valid color format for proper rendering.
        line_style (LineStyle): Line style for the series line. Options include SOLID,
            DOTTED, DASHED, LARGE_DASHED, SPARSE_DOTTED. Defaults to LineStyle.SOLID.
        line_width (int): Line width in pixels. Defaults to 3. Higher values create
            thicker lines for better visibility.
        line_type (LineType): Line type for connecting data points. Options include
            SIMPLE, CURVED, STEPPED. Defaults to LineType.SIMPLE for straight connections.
        line_visible (bool): Whether to show the series line. Defaults to True.
            Set to False to show only markers.
        point_markers_visible (bool): Whether to show circle markers on each data point.
            Defaults to False. Useful for highlighting individual data points.
        point_markers_radius (Optional[int]): Radius of point markers in pixels.
            Defaults to None (uses default radius). Only used when point_markers_visible is True.
        crosshair_marker_visible (bool): Whether to show the crosshair marker during
            mouse interactions. Defaults to False. Provides visual feedback during hovering.
        crosshair_marker_radius (int): Radius of crosshair marker in pixels.
            Defaults to 4. Controls the size of the interaction marker.
        crosshair_marker_border_color (str): Border color for crosshair marker.
            Defaults to empty string (uses default color). Must be valid color format.
        crosshair_marker_background_color (str): Background color for crosshair marker.
            Defaults to empty string (uses default color). Must be valid color format.
        crosshair_marker_border_width (int): Border width for crosshair marker in pixels.
            Defaults to 2. Controls the thickness of the marker border.
        last_price_animation (LastPriceAnimationMode): Animation mode for last price updates.
            Options include DISABLED, CONTINUOUS, ON_DATA_UPDATE. Defaults to DISABLED.

    Raises:
        ColorValidationError: If color values are not in valid hex or rgba format.

    Example:
        ```python
        from lightweight_charts_core.charts.options import LineOptions
        from lightweight_charts_core.type_definitions.enums import (
            LineStyle,
            LineType,
            LastPriceAnimationMode,
        )

        # Create line options with custom styling
        line_opts = LineOptions(
            color="#FF5722",
            line_style=LineStyle.SOLID,
            line_width=2,
            line_type=LineType.CURVED,
            point_markers_visible=True,
            crosshair_marker_visible=True,
            last_price_animation=LastPriceAnimationMode.CONTINUOUS,
        )

        # Use with line series
        series = LineSeries(data=data, line_options=line_opts)
        ```

    See Also:
        TradingView LineStyleOptions: https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineStyleOptions

    """

    color: str = "#2196f3"
    line_style: LineStyle = LineStyle.SOLID
    line_width: int = 3
    line_type: LineType = LineType.SIMPLE
    line_visible: bool = True
    point_markers_visible: bool = False
    point_markers_radius: int | None = None
    crosshair_marker_visible: bool = False
    crosshair_marker_radius: int = 4
    crosshair_marker_border_color: str = ""
    crosshair_marker_background_color: str = ""
    crosshair_marker_border_width: int = 2
    last_price_animation: LastPriceAnimationMode = LastPriceAnimationMode.DISABLED

    @staticmethod
    def _validate_color_static(color: str, property_name: str) -> str:
        """Static version of color validator for decorator use.

        Validates that the provided color string is in a valid format (hex or rgba)
        and raises an appropriate error if validation fails. This method is used
        by the chainable_field decorator for color validation.

        Args:
            color (str): Color string to validate in hex or rgba format.
            property_name (str): Name of the property being validated for error messages.

        Returns:
            str: The validated color string if valid.

        Raises:
            ColorValidationError: If the color format is invalid.

        Example:
            ```python
            # Valid colors
            valid_color = LineOptions._validate_color_static("#FF0000", "color")
            valid_rgba = LineOptions._validate_color_static("rgba(255,0,0,0.5)", "color")

            # Invalid color (will raise ColorValidationError)
            try:
                invalid_color = LineOptions._validate_color_static("invalid", "color")
            except ColorValidationError as e:
                print(f"Invalid color: {e}")
            ```

        """
        # Validate color format using utility function
        if not is_valid_color(color):
            raise ColorValidationError(property_name, color)
        return color
