"""Ribbon series for streamlit-lightweight-charts.

This module provides the RibbonSeries class for creating ribbon charts
that display upper and lower bands with fill areas between them.
"""

import pandas as pd
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.charts.series.defaults import (
    create_lower_line,
    create_upper_line,
)
from lightweight_charts_core.constants import RIBBON_FILL_COLOR
from lightweight_charts_core.data.ribbon import RibbonData
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.utils import chainable_property


@chainable_property("upper_line", LineOptions, allow_none=True)
@chainable_property("lower_line", LineOptions, allow_none=True)
@chainable_property("fill_color", str, validator="color")
@chainable_property("fill_visible", bool)
class RibbonSeries(Series):
    """Ribbon series for lightweight charts.

    This class represents a ribbon series that displays upper and lower bands
    with a fill area between them. It's commonly used for technical indicators
    like Bollinger Bands without the middle line, or other envelope indicators.

    The RibbonSeries supports various styling options including separate line
    styling for each band via LineOptions, fill colors, and gradient effects.

    Attributes:
        upper_line: LineOptions instance for upper band styling.
        lower_line: LineOptions instance for lower band styling.
        fill_color: Fill color for the area between upper and lower bands.
        fill_visible: Whether to display the fill area.
        price_lines: List of PriceLineOptions for price lines (set after construction)
        price_format: PriceFormatOptions for price formatting (set after construction)
        markers: List of markers to display on this series (set after construction)

    """

    DATA_CLASS = RibbonData

    def __init__(
        self,
        data: list[RibbonData] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "",
        pane_id: int | None = 0,
    ):
        """Initialize RibbonSeries.

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
        self._upper_line = create_upper_line()
        self._lower_line = create_lower_line()

        # Initialize fill color
        self._fill_color = RIBBON_FILL_COLOR

        # Initialize fill visibility (default to True)
        self._fill_visible = True

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series."""
        return ChartType.RIBBON
