"""
Area series for streamlit-lightweight-charts.

This module provides the AreaSeries class for creating area charts that display
continuous data points with filled areas under the line. Area series are commonly
used for price charts, indicators, and trend analysis.

The AreaSeries class supports various styling options including area color,
line color, width, style, and animation effects. It also supports markers and price
line configurations.

Example:
    from streamlit_lightweight_charts_pro.charts.series import AreaSeries
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create area data
    data = [
        SingleValueData("2024-01-01", 100),
        SingleValueData("2024-01-02", 105),
        SingleValueData("2024-01-03", 102)
    ]

    # Create area series with styling
    series = AreaSeries(
        data=data,
        top_color="rgba(33, 150, 243, 0.4)",
        bottom_color="rgba(33, 150, 243, 0.0)",
        line_color="#2196F3",
        line_width=2
    )
"""

from typing import List, Optional, Union

import pandas as pd

from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.data.area_data import AreaData
from streamlit_lightweight_charts_pro.type_definitions import (
    ChartType,
)
from streamlit_lightweight_charts_pro.utils import chainable_property


@chainable_property("line_options", LineOptions, allow_none=True)
@chainable_property("top_color", str, validator="color")
@chainable_property("bottom_color", str, validator="color")
@chainable_property("relative_gradient", bool)
@chainable_property("invert_filled_area", bool)
class AreaSeries(Series):
    """
    Area series for lightweight charts.

    This class represents an area series that displays continuous data points
    with filled areas under the line. It's commonly used for price charts,
    technical indicators, and trend analysis.

    The AreaSeries supports various styling options including area colors,
    line styling via LineOptions, and gradient effects.

    Attributes:
        line_options: LineOptions instance for line styling (optional).
        top_color: Color of the top part of the area.
        bottom_color: Color of the bottom part of the area.
        relative_gradient: Whether gradient is relative to base value.
        invert_filled_area: Whether to invert the filled area.
        price_lines: List of PriceLineOptions for price lines (set after construction)
        price_format: PriceFormatOptions for price formatting (set after construction)
        markers: List of markers to display on this series (set after construction)
    """

    DATA_CLASS = AreaData

    def __init__(
        self,
        data: Union[List[AreaData], pd.DataFrame, pd.Series],
        column_mapping: Optional[dict] = None,
        visible: bool = True,
        price_scale_id: str = "",
        pane_id: Optional[int] = 0,
    ):
        """
        Initialize AreaSeries.

        Args:
            data: List of data points or DataFrame
            column_mapping: Column mapping for DataFrame conversion
            visible: Whether the series is visible
            price_scale_id: ID of the price scale
            pane_id: The pane index this series belongs to

            top_color: Color of the top part of the area
            bottom_color: Color of the bottom part of the area
            relative_gradient: Gradient is relative to base value
            invert_filled_area: Invert filled area
        """
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Initialize properties
        self._line_options = LineOptions()
        self._top_color = "#2196F3"
        self._bottom_color = "rgba(33, 150, 243, 0.0)"
        self._relative_gradient = False
        self._invert_filled_area = False

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series."""
        return ChartType.AREA
