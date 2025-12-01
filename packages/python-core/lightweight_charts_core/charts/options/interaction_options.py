"""Interaction options configuration for streamlit-lightweight-charts.

This module provides interaction-related option classes for configuring
crosshair behavior, kinetic scrolling, and tracking modes.
"""

from dataclasses import dataclass, field

from lightweight_charts_core.charts.options.base_options import Options
from lightweight_charts_core.type_definitions.enums import CrosshairMode, LineStyle
from lightweight_charts_core.utils import chainable_field


@dataclass
@chainable_field("color", str, validator="color")
@chainable_field("width", int)
@chainable_field("style", LineStyle)
@chainable_field("visible", bool)
@chainable_field("label_visible", bool)
class CrosshairLineOptions(Options):
    """Crosshair line configuration."""

    color: str = "#758696"
    width: int = 1
    style: LineStyle = LineStyle.SOLID
    visible: bool = True
    label_visible: bool = True


@dataclass
@chainable_field("group_id", int)
@chainable_field("suppress_series_animations", bool)
class CrosshairSyncOptions(Options):
    """Crosshair synchronization configuration."""

    group_id: int = 1
    suppress_series_animations: bool = True


@dataclass
@chainable_field("mode", CrosshairMode)
@chainable_field("vert_line", CrosshairLineOptions)
@chainable_field("horz_line", CrosshairLineOptions)
class CrosshairOptions(Options):
    """Crosshair configuration for chart."""

    mode: CrosshairMode = CrosshairMode.NORMAL
    vert_line: CrosshairLineOptions = field(default_factory=CrosshairLineOptions)
    horz_line: CrosshairLineOptions = field(default_factory=CrosshairLineOptions)


@dataclass
@chainable_field("touch", bool)
@chainable_field("mouse", bool)
class KineticScrollOptions(Options):
    """Kinetic scroll configuration for chart."""

    touch: bool = True
    mouse: bool = False


@dataclass
@chainable_field("exit_on_escape", bool)
class TrackingModeOptions(Options):
    """Tracking mode configuration for chart."""

    exit_on_escape: bool = True
