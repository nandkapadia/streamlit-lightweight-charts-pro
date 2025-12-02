"""Band series for streamlit-lightweight-charts.

This module provides the BandSeries class for creating band charts (e.g., Bollinger Bands)
that display upper, middle, and lower bands. Band series are commonly used for technical
indicators and volatility analysis.

The BandSeries class supports various styling options for each band, fill colors, and
animation effects. It also supports markers and price line configurations.

Example:
    from lightweight_charts_core.charts.series import BandSeries
    from lightweight_charts_core.data import BandData

    # Create band data
    data = [
        BandData("2024-01-01", upper=110, middle=105, lower=100),
        BandData("2024-01-02", upper=112, middle=107, lower=102)
    ]

    # Create band series with styling
    series = BandSeries(data=data)
    series.upper_line.color = "#4CAF50"
    series.lower_line.color = "#F44336"
    series.upper_fill_color = "rgba(76, 175, 80, 0.1)"
    series.lower_fill_color = "rgba(244, 67, 54, 0.1)"

"""

import pandas as pd
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.charts.series.defaults import (
    create_lower_line,
    create_middle_line,
    create_upper_line,
)
from lightweight_charts_core.constants import (
    BAND_LOWER_FILL_COLOR,
    BAND_UPPER_FILL_COLOR,
)
from lightweight_charts_core.data.band import BandData
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.utils import chainable_property


@chainable_property("upper_line", LineOptions, allow_none=True)
@chainable_property("middle_line", LineOptions, allow_none=True)
@chainable_property("lower_line", LineOptions, allow_none=True)
@chainable_property("upper_fill_color", str, validator="color")
@chainable_property("lower_fill_color", str, validator="color")
@chainable_property("upper_fill", bool)
@chainable_property("lower_fill", bool)
class BandSeries(Series):
    """Band series for lightweight charts (e.g., Bollinger Bands).

    This class represents a band series that displays upper, middle, and lower bands.
    It's commonly used for technical indicators like Bollinger Bands, Keltner Channels,
    and other envelope indicators.

    The BandSeries supports various styling options including separate line styling
    for each band via LineOptions, fill colors, and gradient effects.

    Attributes:
        upper_line: LineOptions instance for upper band styling.
        middle_line: LineOptions instance for middle band styling.
        lower_line: LineOptions instance for lower band styling.
        upper_fill_color: Fill color for upper band area.
        lower_fill_color: Fill color for lower band area.
        upper_fill: Whether to display the upper fill area.
        lower_fill: Whether to display the lower fill area.
        price_lines: List of PriceLineOptions for price lines (set after construction)
        price_format: PriceFormatOptions for price formatting (set after construction)
        markers: List of markers to display on this series (set after construction)

    """

    DATA_CLASS = BandData

    def __init__(
        self,
        data: list[BandData] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "",
        pane_id: int | None = 0,
    ):
        """Initialize BandSeries.

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
        self._middle_line = create_middle_line()
        self._lower_line = create_lower_line()

        # Initialize fill colors
        self._upper_fill_color = BAND_UPPER_FILL_COLOR
        self._lower_fill_color = BAND_LOWER_FILL_COLOR

        # Initialize fill visibility (default to True)
        self._upper_fill = True
        self._lower_fill = True

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series."""
        return ChartType.BAND
