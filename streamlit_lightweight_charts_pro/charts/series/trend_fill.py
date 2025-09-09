"""
Trend fill series for streamlit-lightweight-charts.

This module provides the TrendFillSeries class for creating trend-based fill charts
that display fills between trend lines and base lines, similar to
Supertrend indicators with dynamic trend-colored backgrounds.

The series now properly handles trend lines based on trend direction:
- Uptrend (+1): Shows trend line above price, base line for reference
- Downtrend (-1): Shows trend line below price, base line for reference
"""

import logging
from typing import List, Optional, Union

import pandas as pd

from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.data.trend_fill import TrendFillData
from streamlit_lightweight_charts_pro.type_definitions.enums import ChartType
from streamlit_lightweight_charts_pro.utils import chainable_property

logger = logging.getLogger(__name__)


@chainable_property("trend_line", LineOptions, allow_none=True)
@chainable_property("base_line", LineOptions, allow_none=True)
@chainable_property("uptrend_fill_color", str, validator="color")
@chainable_property("downtrend_fill_color", str, validator="color")
@chainable_property("fill_visible", bool)
class TrendFillSeries(Series):
    DATA_CLASS = TrendFillData
    """
    Trend fill series for lightweight charts.
    
    This class represents a trend fill series that displays fills between
    trend lines and base lines. It's commonly used for technical
    indicators like Supertrend, where the fill area changes color based on
    trend direction.

    The series now properly handles trend lines:
    - Uptrend (+1): Shows trend line above price, base line for reference
    - Downtrend (-1): Shows trend line below price, base line for reference
    
    Attributes:
        trend_line: Line options for the trend line
        base_line: Line options for the base line
        uptrend_fill_color: Color for uptrend fills (green)
        downtrend_fill_color: Color for downtrend fills (red)
        fill_visible: Whether fills are visible
    """

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
        """
        Initialize TrendFillSeries.

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

        # Initialize line options for trend line and base line
        self._trend_line = LineOptions(
            color="#2196F3", line_width=2, line_style="solid"
        )  # Blue for trend line
        self._base_line = LineOptions(
            color="#666666", line_width=1, line_style="dotted", line_visible=False
        )
        self._fill_visible = True

    @property
    def chart_type(self) -> ChartType:
        """Return the chart type for this series."""
        return ChartType.TREND_FILL
