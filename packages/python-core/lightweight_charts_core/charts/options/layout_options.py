"""Layout options configuration for streamlit-lightweight-charts.

This module provides layout-related option classes for configuring
chart appearance, grid settings, panes, and watermarks.
"""

from dataclasses import dataclass, field

from lightweight_charts_core.charts.options.base_options import Options
from lightweight_charts_core.exceptions import ValueValidationError
from lightweight_charts_core.type_definitions.colors import (
    BackgroundGradient,
    BackgroundSolid,
)
from lightweight_charts_core.type_definitions.enums import HorzAlign, LineStyle, VertAlign
from lightweight_charts_core.utils import chainable_field
from lightweight_charts_core.utils.data_utils import is_valid_color


@dataclass
@chainable_field("color", str, validator="color")
@chainable_field("style", LineStyle)
@chainable_field("visible", bool)
class GridLineOptions(Options):
    """Grid line configuration."""

    color: str = "#e1e3e6"
    style: LineStyle = LineStyle.SOLID
    visible: bool = False


@dataclass
@chainable_field("vert_lines", GridLineOptions)
@chainable_field("horz_lines", GridLineOptions)
class GridOptions(Options):
    """Grid configuration for chart."""

    vert_lines: GridLineOptions = field(default_factory=lambda: GridLineOptions(visible=False))
    horz_lines: GridLineOptions = field(default_factory=lambda: GridLineOptions(visible=True))


@dataclass
@chainable_field("separator_color", str, validator="color")
@chainable_field("separator_hover_color", str, validator="color")
@chainable_field("enable_resize", bool)
class PaneOptions(Options):
    """Pane configuration for chart."""

    separator_color: str = "#e1e3ea"
    separator_hover_color: str = "#ffffff"
    enable_resize: bool = True


@dataclass
@chainable_field("factor", float)
class PaneHeightOptions(Options):
    """Pane height configuration for chart."""

    factor: float = 1.0

    def __post_init__(self):
        """Validate factor value."""
        if self.factor <= 0:
            raise ValueValidationError.positive_value("Pane height factor", self.factor)


@dataclass
@chainable_field("background_options", (BackgroundSolid, BackgroundGradient))
@chainable_field("text_color", str, validator="color")
@chainable_field("font_size", int)
@chainable_field("font_family", str)
@chainable_field("pane_options", PaneOptions)
@chainable_field("pane_heights", dict[int, PaneHeightOptions])
@chainable_field("attribution_logo", bool)
class LayoutOptions(Options):
    """Layout configuration for chart."""

    background_options: BackgroundSolid = field(
        default_factory=lambda: BackgroundSolid(color="#ffffff"),
    )
    text_color: str = "#131722"
    font_size: int = 11
    font_family: str = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    pane_options: PaneOptions | None = None
    pane_heights: dict[int, PaneHeightOptions] | None = None
    attribution_logo: bool = False

    @staticmethod
    def _validate_color_static(color: str, property_name: str) -> str:
        """Validate color format."""
        if not is_valid_color(color):
            raise ValueValidationError(property_name, "Invalid color format")
        return color


@dataclass
@chainable_field("visible", bool)
@chainable_field("text", str)
@chainable_field("font_size", int)
@chainable_field("horz_align", HorzAlign)
@chainable_field("vert_align", VertAlign)
@chainable_field("color", str, validator="color")
class WatermarkOptions(Options):
    """Watermark configuration."""

    visible: bool = True
    text: str = ""
    font_size: int = 96
    horz_align: HorzAlign = HorzAlign.CENTER
    vert_align: VertAlign = VertAlign.CENTER
    color: str = "rgba(255, 255, 255, 0.1)"
