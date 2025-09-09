"""Price scale option classes for streamlit-lightweight-charts."""

from dataclasses import dataclass, field

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.type_definitions.enums import PriceScaleMode
from streamlit_lightweight_charts_pro.utils import chainable_field


@dataclass
@chainable_field("top", (int, float))
@chainable_field("bottom", (int, float))
class PriceScaleMargins(Options):
    """Price scale margins configuration."""

    top: float = 0.1
    bottom: float = 0.1


@dataclass
@chainable_field("visible", bool)
@chainable_field("auto_scale", bool)
@chainable_field("mode", PriceScaleMode)
@chainable_field("invert_scale", bool)
@chainable_field("border_visible", bool)
@chainable_field("border_color", str, validator="color")
@chainable_field("text_color", str, validator="color")
@chainable_field("ticks_visible", bool)
@chainable_field("ensure_edge_tick_marks_visible", bool)
@chainable_field("align_labels", bool)
@chainable_field("entire_text_only", bool)
@chainable_field("minimum_width", int)
@chainable_field("scale_margins", PriceScaleMargins)
@chainable_field("price_scale_id", str)
class PriceScaleOptions(Options):
    """Price scale configuration for lightweight-charts v5.x."""

    # Core visibility and behavior
    visible: bool = True
    auto_scale: bool = True
    mode: PriceScaleMode = PriceScaleMode.NORMAL
    invert_scale: bool = False

    # Visual appearance
    border_visible: bool = True
    border_color: str = "rgba(197, 203, 206, 0.8)"
    text_color: str = "#131722"  # TradingView dark gray text

    # Tick and label configuration
    ticks_visible: bool = True
    ensure_edge_tick_marks_visible: bool = False
    align_labels: bool = True
    entire_text_only: bool = False

    # Size and positioning
    minimum_width: int = 72
    scale_margins: PriceScaleMargins = field(default_factory=PriceScaleMargins)

    # Identification
    price_scale_id: str = ""
