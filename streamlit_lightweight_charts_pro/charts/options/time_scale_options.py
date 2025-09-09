"""Scale option classes for streamlit-lightweight-charts."""

from dataclasses import dataclass
from typing import Callable, Optional

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.utils import chainable_field


@dataclass
@chainable_field("right_offset", int)
@chainable_field("left_offset", int)
@chainable_field("bar_spacing", int)
@chainable_field("min_bar_spacing", float)
@chainable_field("visible", bool)
@chainable_field("time_visible", bool)
@chainable_field("seconds_visible", bool)
@chainable_field("border_visible", bool)
@chainable_field("border_color", str, validator="color")
@chainable_field("fix_left_edge", bool)
@chainable_field("fix_right_edge", bool)
@chainable_field("lock_visible_time_range_on_resize", bool)
@chainable_field("right_bar_stays_on_scroll", bool)
@chainable_field("shift_visible_range_on_new_bar", bool)
@chainable_field("allow_shift_visible_range_on_whitespace_access", bool)
@chainable_field("tick_mark_formatter", Callable)
@chainable_field("fit_content_on_load", bool)
@chainable_field("handle_double_click", bool)
@chainable_field("handle_scale", bool)
@chainable_field("handle_scroll", bool)
class TimeScaleOptions(Options):
    """Time scale configuration."""

    right_offset: int = 0
    left_offset: int = 0
    bar_spacing: int = 6
    min_bar_spacing: float = 0.001
    visible: bool = True
    time_visible: bool = True
    seconds_visible: bool = False
    border_visible: bool = True
    border_color: str = "rgba(197, 203, 206, 0.8)"
    fix_left_edge: bool = False
    fix_right_edge: bool = False
    lock_visible_time_range_on_resize: bool = False
    right_bar_stays_on_scroll: bool = False
    shift_visible_range_on_new_bar: bool = False
    allow_shift_visible_range_on_whitespace_access: bool = False
    tick_mark_formatter: Optional[Callable] = None
    fit_content_on_load: bool = True
    handle_double_click: bool = True
    handle_scale: bool = True
    handle_scroll: bool = True

    def __getitem__(self, key):
        return self.asdict()[key]
