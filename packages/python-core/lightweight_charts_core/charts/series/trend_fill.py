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

# Third Party Imports
import pandas as pd

# Local Imports
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.charts.series.defaults import (
    create_base_line,
    create_downtrend_line,
    create_uptrend_line,
)
from lightweight_charts_core.data.trend_fill import TrendFillData
from lightweight_charts_core.type_definitions.enums import ChartType
from lightweight_charts_core.utils import add_opacity, chainable_property

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
        from lightweight_charts_core import TrendFillSeries
        from lightweight_charts_core.data import TrendFillData

        # Create trend fill data
        data = [
            TrendFillData(time="2024-01-01", trend=1.0, base=100.0, trend_value=105.0),
            TrendFillData(time="2024-01-02", trend=-1.0, base=102.0, trend_value=98.0),
        ]

        # Create series with custom colors
        series = TrendFillSeries(data) \
            .set_uptrend_fill_color("#00FF00") \
            .set_downtrend_fill_color("#FF0000")
        ```

    """

    DATA_CLASS = TrendFillData

    def __init__(
        self,
        data: list[TrendFillData] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "",
        pane_id: int | None = 0,
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
        self._uptrend_fill_color = add_opacity(uptrend_fill_color)
        self._downtrend_fill_color = add_opacity(downtrend_fill_color)

        # Initialize line options for uptrend line, downtrend line, and base line
        self._uptrend_line = create_uptrend_line()
        self._downtrend_line = create_downtrend_line()
        self._base_line = create_base_line()
        self._fill_visible = True

    @property
    def chart_type(self) -> ChartType:
        """Return the chart type for this series."""
        return ChartType.TREND_FILL
