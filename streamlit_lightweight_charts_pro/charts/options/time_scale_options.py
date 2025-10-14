"""Time scale option classes for streamlit-lightweight-charts.

This module provides comprehensive configuration options for time scales in financial
charts. Time scales control how time values are displayed, formatted, and positioned
on the horizontal axis of the chart, including spacing, visibility, and interaction
settings.

Key Features:
    - Time axis spacing and positioning configuration
    - Time visibility and formatting options
    - Border and visual appearance customization
    - Interactive behavior and scrolling controls
    - Bar spacing and offset settings
    - Time range locking and edge fixing options

Example:
    ```python
    from streamlit_lightweight_charts_pro.charts.options import TimeScaleOptions

    # Create time scale options
    time_scale = TimeScaleOptions(
        visible=True, time_visible=True, border_visible=True, bar_spacing=6, right_offset=10
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from dataclasses import dataclass
from typing import Callable, Optional

# Local Imports
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
@chainable_field("tick_mark_formatter", allow_none=True)
@chainable_field("fit_content_on_load", bool)
@chainable_field("handle_double_click", bool)
@chainable_field("handle_scale", bool)
@chainable_field("handle_scroll", bool)
class TimeScaleOptions(Options):
    """Comprehensive configuration options for time scales in financial charts.

    This class provides extensive configuration options for time scales, controlling
    how time values are displayed, formatted, and positioned on the horizontal axis
    of the chart. It includes spacing, visibility, interaction, and formatting
    settings for professional time-based chart visualization.

    Attributes:
        right_offset (int): Right offset in pixels from the chart edge. Defaults to 0.
        left_offset (int): Left offset in pixels from the chart edge. Defaults to 0.
        bar_spacing (int): Spacing between bars in pixels. Defaults to 6.
        min_bar_spacing (float): Minimum spacing between bars in pixels. Defaults to 0.001.
        visible (bool): Whether the time scale is visible. Defaults to True.
        time_visible (bool): Whether to show time labels on the scale. Defaults to True.
        seconds_visible (bool): Whether to show seconds in time labels. Defaults to False.
        border_visible (bool): Whether to show the time scale border. Defaults to True.
        border_color (str): Color of the time scale border. Defaults to light gray.
            Must be valid color format (hex or rgba).
        fix_left_edge (bool): Whether to fix the left edge of the time range. Defaults to False.
        fix_right_edge (bool): Whether to fix the right edge of the time range. Defaults to False.
        lock_visible_time_range_on_resize (bool): Whether to lock the visible time range
            when resizing the chart. Defaults to False.
        right_bar_stays_on_scroll (bool): Whether the rightmost bar stays visible during scroll.
            Defaults to False.
        shift_visible_range_on_new_bar (bool): Whether to shift the visible range when
            a new bar is added. Defaults to False.
        allow_shift_visible_range_on_whitespace_access (bool): Whether to allow shifting
            the visible range when accessing whitespace. Defaults to False.
        tick_mark_formatter (Optional[Callable]): Custom formatter function for tick marks.
            Defaults to None (uses default formatting).
        fit_content_on_load (bool): Whether to fit content to visible area on initial load.
            Defaults to True.
        handle_double_click (bool): Whether to handle double-click interactions.
            Defaults to True.
        handle_scale (bool): Whether to handle scale interactions. Defaults to True.
        handle_scroll (bool): Whether to handle scroll interactions. Defaults to True.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.charts.options import TimeScaleOptions

        # Create time scale with custom spacing and visibility
        time_scale = TimeScaleOptions(
            visible=True,
            time_visible=True,
            seconds_visible=False,
            border_visible=True,
            bar_spacing=8,
            right_offset=20,
            left_offset=10,
        )

        # Create time scale with locked edges
        locked_time_scale = TimeScaleOptions(
            fix_left_edge=True, fix_right_edge=False, lock_visible_time_range_on_resize=True
        )
        ```

    See also:
        Options: Base class providing common option functionality.
    """

    # Offset and spacing configuration
    right_offset: int = 0  # Right offset in pixels from chart edge
    left_offset: int = 0  # Left offset in pixels from chart edge
    bar_spacing: int = 6  # Spacing between bars in pixels
    min_bar_spacing: float = 0.001  # Minimum spacing between bars in pixels

    # Visibility and appearance settings
    visible: bool = True  # Whether the time scale is visible
    time_visible: bool = True  # Whether to show time labels
    seconds_visible: bool = False  # Whether to show seconds in time labels
    border_visible: bool = True  # Whether to show the time scale border
    border_color: str = "rgba(197, 203, 206, 0.8)"  # Border color with transparency

    # Time range and scrolling behavior
    fix_left_edge: bool = False  # Whether to fix the left edge of the time range
    fix_right_edge: bool = False  # Whether to fix the right edge of the time range
    lock_visible_time_range_on_resize: bool = False  # Lock visible range on resize
    right_bar_stays_on_scroll: bool = False  # Keep rightmost bar visible during scroll
    shift_visible_range_on_new_bar: bool = False  # Shift range when new bar is added
    allow_shift_visible_range_on_whitespace_access: bool = False  # Allow shifting on whitespace

    # Formatting and interaction settings
    tick_mark_formatter: Optional[Callable] = None  # Custom formatter for tick marks
    fit_content_on_load: bool = True  # Fit content to visible area on load
    handle_double_click: bool = True  # Handle double-click interactions
    handle_scale: bool = True  # Handle scale interactions
    handle_scroll: bool = True  # Handle scroll interactions

    def __getitem__(self, key):
        """Get option value by key for dictionary-like access.

        Allows accessing option values using dictionary-style syntax, which
        is useful for dynamic configuration and testing.

        Args:
            key (str): The option key to retrieve.

        Returns:
            Any: The value of the specified option key.

        Example:
            ```python
            time_scale = TimeScaleOptions()
            spacing = time_scale["bar_spacing"]  # Returns 6
            visible = time_scale["visible"]  # Returns True
            ```
        """
        return self.asdict()[key]
