"""
Line series for streamlit-lightweight-charts.

This module provides the LineSeries class for creating line charts that display
continuous data points connected by lines. Line series are commonly used for
price charts, indicators, and trend analysis.

The LineSeries class supports various styling options including line color,
width, style, and animation effects. It also supports markers and price
line configurations.

Example:
    from streamlit_lightweight_charts_pro.charts.series import LineSeries
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create line data
    data = [
        SingleValueData("2024-01-01", 100),
        SingleValueData("2024-01-02", 105),
        SingleValueData("2024-01-03", 102)
    ]

    # Create line series with styling
    series = LineSeries(
        data=data,
        color="#2196F3",
        line_width=2,
        line_style=LineStyle.SOLID
    )
"""

from typing import List, Optional, Union

import pandas as pd

from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.type_definitions import (
    ChartType,
)
from streamlit_lightweight_charts_pro.utils import chainable_property


@chainable_property("line_options", LineOptions, allow_none=True)
class LineSeries(Series):
    DATA_CLASS = LineData
    """
    Line series for lightweight charts.

    This class represents a line series that displays continuous data points
    connected by lines. It's commonly used for price charts, technical
    indicators, and trend analysis.

    The LineSeries supports various styling options via the LineOptions class.
    All style options must be set via the line_options argument.

    Attributes:
        line_options: LineOptions instance for all line style options (required).
        price_lines: List of PriceLineOptions for price lines (set after construction)
        price_format: PriceFormatOptions for price formatting (set after construction)
        markers: List of markers to display on this series (set after construction)
    """

    @property
    def chart_type(self) -> ChartType:
        return ChartType.LINE

    def __init__(
        self,
        data: Union[List[LineData], pd.DataFrame, pd.Series],
        column_mapping: Optional[dict] = None,
        visible: bool = True,
        price_scale_id: str = "right",
        pane_id: Optional[int] = 0,
    ):
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )
        # Initialize line_options with default value
        self._line_options = LineOptions()
