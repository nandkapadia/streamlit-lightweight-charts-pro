"""Trend fill series for streamlit-lightweight-charts.

This module provides the TrendFillSeries class for creating trend-based fill charts
that display fills between trend lines and base lines, similar to
Supertrend indicators with dynamic trend-colored backgrounds.

The series now properly handles separate trend lines based on trend direction:
- Uptrend (+1): Uses uptrend_line options for trend line above price
- Downtrend (-1): Uses downtrend_line options for trend line below price
"""

# Standard Imports
import logging
from typing import List, Optional, Union

# Third Party Imports
import pandas as pd

# Local Imports
from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.data.trend_fill import TrendFillData
from streamlit_lightweight_charts_pro.type_definitions.enums import ChartType, LineStyle
from streamlit_lightweight_charts_pro.utils import chainable_property

logger = logging.getLogger(__name__)


@chainable_property("uptrend_line", LineOptions, allow_none=True)
@chainable_property("downtrend_line", LineOptions, allow_none=True)
@chainable_property("base_line", LineOptions, allow_none=True)
@chainable_property("uptrend_fill_color", str, validator="color")
@chainable_property("downtrend_fill_color", str, validator="color")
@chainable_property("fill_visible", bool)
class TrendFillSeries(Series):
    """Trend fill series for lightweight charts.

    This class represents a trend fill series that displays fills between
    trend lines and base lines. It's commonly used for technical
    indicators like Supertrend, where the fill area changes color based on
    trend direction.

    The series properly handles separate trend lines based on trend direction:
    - Uptrend (+1): Uses uptrend_line options for trend line above price
    - Downtrend (-1): Uses downtrend_line options for trend line below price

    Attributes:
        uptrend_line (LineOptions): Line options for the uptrend line.
        downtrend_line (LineOptions): Line options for the downtrend line.
        base_line (LineOptions): Line options for the base line.
        uptrend_fill_color (str): Color for uptrend fills (default: green).
        downtrend_fill_color (str): Color for downtrend fills (default: red).
        fill_visible (bool): Whether fills are visible.

    Example:
        ```python
        from streamlit_lightweight_charts_pro import TrendFillSeries
        from streamlit_lightweight_charts_pro.data import TrendFillData

        # Create trend fill data
        data = [
            TrendFillData(time="2024-01-01", trend=1.0, base=100.0, trend_value=105.0),
            TrendFillData(time="2024-01-02", trend=-1.0, base=102.0, trend_value=98.0),
        ]

        # Create series with custom colors
        series = TrendFillSeries(data).set_uptrend_fill_color("#00FF00").set_downtrend_fill_color("#FF0000")
        ```
    """

    DATA_CLASS = TrendFillData

    def __init__(
        self,
        data: Union[List[TrendFillData], pd.DataFrame, pd.Series],
        column_mapping: Optional[dict] = None,
        visible: bool = True,
        price_scale_id: str = "",
        pane_id: Optional[int] = 0,
        uptrend_fill_color: str = "#4CAF50",
        downtrend_fill_color: str = "#F44336",
    ):
        """Initialize TrendFillSeries.

        Args:
            data: List of data points or DataFrame
            column_mapping: Column mapping for DataFrame conversion
            visible: Whether the series is visible
            price_scale_id: ID of the price scale
            pane_id: The pane index this series belongs to
            uptrend_fill_color: Color for uptrend fills (green)
            downtrend_fill_color: Color for downtrend fills (red)
        """
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Convert colors to rgba with default opacity
        def _add_opacity(color: str, opacity: float = 0.3) -> str:
            if not color.startswith("#"):
                return color
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            return f"rgba({r}, {g}, {b}, {opacity})"

        self._uptrend_fill_color = _add_opacity(uptrend_fill_color)
        self._downtrend_fill_color = _add_opacity(downtrend_fill_color)

        # Initialize line options for uptrend line, downtrend line, and base line
        self._uptrend_line = LineOptions(
            color="#4CAF50",  # Green for uptrend
            line_width=2,
            line_style=LineStyle.SOLID,
        )
        self._downtrend_line = LineOptions(
            color="#F44336",  # Red for downtrend
            line_width=2,
            line_style=LineStyle.SOLID,
        )
        self._base_line = LineOptions(
            color="#666666",
            line_width=1,
            line_style=LineStyle.DOTTED,
            line_visible=False,
        )
        self._fill_visible = True

    @property
    def chart_type(self) -> ChartType:
        """Return the chart type for this series."""
        return ChartType.TREND_FILL
