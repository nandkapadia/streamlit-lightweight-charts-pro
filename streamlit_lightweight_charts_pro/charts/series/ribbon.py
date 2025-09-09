"""
Ribbon series for streamlit-lightweight-charts.

This module provides the RibbonSeries class for creating ribbon charts
that display upper and lower bands with fill areas between them.
"""

from typing import List, Optional, Union

import pandas as pd

from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.data.ribbon import RibbonData
from streamlit_lightweight_charts_pro.type_definitions import ChartType
from streamlit_lightweight_charts_pro.utils import chainable_property


@chainable_property("upper_line", LineOptions, allow_none=True)
@chainable_property("lower_line", LineOptions, allow_none=True)
@chainable_property("fill", str, validator="color")
@chainable_property("fill_visible", bool)
class RibbonSeries(Series):
    """
    Ribbon series for lightweight charts.

    This class represents a ribbon series that displays upper and lower bands
    with a fill area between them. It's commonly used for technical indicators
    like Bollinger Bands without the middle line, or other envelope indicators.

    The RibbonSeries supports various styling options including separate line
    styling for each band via LineOptions, fill colors, and gradient effects.

    Attributes:
        upper_line: LineOptions instance for upper band styling.
        lower_line: LineOptions instance for lower band styling.
        fill: Fill color for the area between upper and lower bands.
        fill_visible: Whether to display the fill area.
        price_lines: List of PriceLineOptions for price lines (set after construction)
        price_format: PriceFormatOptions for price formatting (set after construction)
        markers: List of markers to display on this series (set after construction)
    """

    DATA_CLASS = RibbonData

    def __init__(
        self,
        data: Union[List[RibbonData], pd.DataFrame, pd.Series],
        column_mapping: Optional[dict] = None,
        visible: bool = True,
        price_scale_id: str = "",
        pane_id: Optional[int] = 0,
    ):
        """
        Initialize RibbonSeries.

        Args:
            data: List of data points or DataFrame
            column_mapping: Column mapping for DataFrame conversion
            visible: Whether the series is visible
            price_scale_id: ID of the price scale
            pane_id: The pane index this series belongs to
        """
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Initialize line options with default values
        self._upper_line = LineOptions(color="#4CAF50", line_width=2, line_style="solid")
        self._lower_line = LineOptions(color="#F44336", line_width=2, line_style="solid")

        # Initialize fill color
        self._fill = "rgba(76, 175, 80, 0.1)"

        # Initialize fill visibility (default to True)
        self._fill_visible = True

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series."""
        return ChartType.RIBBON
