"""
Trade visualization options for streamlit-lightweight-charts.

This module provides the TradeVisualizationOptions class for configuring
how trades are visualized on charts, including markers, rectangles, lines,
arrows, and zones.
"""

from dataclasses import dataclass

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.type_definitions.enums import TradeVisualization
from streamlit_lightweight_charts_pro.utils import chainable_field


@dataclass
@chainable_field("style", TradeVisualization)
@chainable_field("entry_marker_color_long", str, validator="color")
@chainable_field("entry_marker_color_short", str, validator="color")
@chainable_field("exit_marker_color_profit", str, validator="color")
@chainable_field("exit_marker_color_loss", str, validator="color")
@chainable_field("marker_size", int)
@chainable_field("show_pnl_in_markers", bool)
@chainable_field("rectangle_fill_opacity", float)
@chainable_field("rectangle_border_width", int)
@chainable_field("rectangle_color_profit", str, validator="color")
@chainable_field("rectangle_color_loss", str, validator="color")
@chainable_field("rectangle_fill_color_profit", str, validator="color")
@chainable_field("rectangle_border_color_profit", str, validator="color")
@chainable_field("rectangle_border_color_loss", str, validator="color")
@chainable_field("line_width", int)
@chainable_field("line_style", str)
@chainable_field("line_color_profit", str, validator="color")
@chainable_field("line_color_loss", str, validator="color")
@chainable_field("arrow_size", int)
@chainable_field("arrow_color_profit", str, validator="color")
@chainable_field("arrow_color_loss", str, validator="color")
@chainable_field("zone_opacity", float)
@chainable_field("zone_color_long", str, validator="color")
@chainable_field("zone_color_short", str, validator="color")
@chainable_field("zone_extend_bars", int)
@chainable_field("show_trade_id", bool)
@chainable_field("show_quantity", bool)
@chainable_field("show_trade_type", bool)
@chainable_field("annotation_font_size", int)
@chainable_field("annotation_background", str, validator="color")
@chainable_field("rectangle_show_text", bool)
@chainable_field("rectangle_text_position", str)
@chainable_field("rectangle_text_font_size", int)
@chainable_field("rectangle_text_color", str, validator="color")
@chainable_field("rectangle_text_background", str, validator="color")
class TradeVisualizationOptions(Options):
    """
    Options for trade visualization.

    This class provides comprehensive configuration options for how trades
    are displayed on charts, including various visual styles and customization
    options for markers, rectangles, lines, arrows, and zones.

    Attributes:
        style: The visualization style to use (markers, rectangles, both, etc.)
        entry_marker_color_long: Color for long entry markers
        entry_marker_color_short: Color for short entry markers
        exit_marker_color_profit: Color for profitable exit markers
        exit_marker_color_loss: Color for loss exit markers
        marker_size: Size of markers in pixels
        show_pnl_in_markers: Whether to show P&L in marker text
        rectangle_fill_opacity: Opacity for rectangle fill (0.0 to 1.0)
        rectangle_border_width: Width of rectangle borders
        rectangle_color_profit: Color for profitable trade rectangles
        rectangle_color_loss: Color for loss trade rectangles
        rectangle_fill_color_profit: Fill color for profitable trade rectangles
        rectangle_border_color_profit: Border color for profitable trade rectangles
        rectangle_border_color_loss: Border color for loss trade rectangles
        line_width: Width of connecting lines
        line_style: Style of connecting lines (solid, dashed, etc.)
        line_color_profit: Color for profitable trade lines
        line_color_loss: Color for loss trade lines
        arrow_size: Size of arrows in pixels
        arrow_color_profit: Color for profitable trade arrows
        arrow_color_loss: Color for loss trade arrows
        zone_opacity: Opacity for zone fills (0.0 to 1.0)
        zone_color_long: Color for long trade zones
        zone_color_short: Color for short trade zones
        zone_extend_bars: Number of bars to extend zones
        show_trade_id: Whether to show trade ID in annotations
        show_quantity: Whether to show quantity in annotations
        show_trade_type: Whether to show trade type in annotations
        annotation_font_size: Font size for annotations
        annotation_background: Background color for annotations
        rectangle_show_text: Whether to show text on rectangles
        rectangle_text_position: Position of text on rectangles (inside, above, below)
        rectangle_text_font_size: Font size for rectangle text
        rectangle_text_color: Color for rectangle text
        rectangle_text_background: Background color for rectangle text
    """

    style: TradeVisualization = TradeVisualization.RECTANGLES

    # Marker options
    entry_marker_color_long: str = "#2196F3"
    entry_marker_color_short: str = "#FF9800"
    exit_marker_color_profit: str = "#4CAF50"
    exit_marker_color_loss: str = "#F44336"
    marker_size: int = 5
    show_pnl_in_markers: bool = False

    # Rectangle options
    rectangle_fill_opacity: float = 0.1
    rectangle_border_width: int = 1
    rectangle_color_profit: str = "#4CAF50"
    rectangle_color_loss: str = "#F44336"
    rectangle_fill_color_profit: str = "#4CAF50"
    rectangle_border_color_profit: str = "#4CAF50"
    rectangle_border_color_loss: str = "#F44336"

    # Line options
    line_width: int = 2
    line_style: str = "dashed"
    line_color_profit: str = "#4CAF50"
    line_color_loss: str = "#F44336"

    # Arrow options
    arrow_size: int = 10
    arrow_color_profit: str = "#4CAF50"
    arrow_color_loss: str = "#F44336"

    # Zone options
    zone_opacity: float = 0.1
    zone_color_long: str = "#2196F3"
    zone_color_short: str = "#FF9800"
    zone_extend_bars: int = 2  # Extend zone by this many bars

    # Annotation options
    show_trade_id: bool = False
    show_quantity: bool = True
    show_trade_type: bool = True
    annotation_font_size: int = 12
    annotation_background: str = "rgba(255, 255, 255, 0.8)"

    # Rectangle text options
    rectangle_show_text: bool = False
    rectangle_text_position: str = "inside"  # inside, above, below
    rectangle_text_font_size: int = 10
    rectangle_text_color: str = "#FFFFFF"
    rectangle_text_background: str = "rgba(0, 0, 0, 0.7)"

    def __post_init__(self):
        """Post-initialization processing."""
        # Convert style to enum if it's a string
        if isinstance(self.style, str):
            self.style = TradeVisualization(self.style.lower())

        # Validate rectangle text position
        valid_positions = ["inside", "above", "below"]
        if self.rectangle_text_position.lower() not in valid_positions:
            self.rectangle_text_position = "inside"
