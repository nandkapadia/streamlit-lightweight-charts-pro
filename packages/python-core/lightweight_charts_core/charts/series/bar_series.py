"""Bar series for streamlit-lightweight-charts.

This module provides the BarSeries class for creating bar charts that display
OHLC data as bars. Bar series are commonly used for price charts and volume overlays.

The BarSeries class supports various styling options including bar color, base value,
and animation effects. It also supports markers and price line configurations.

Example:
    from lightweight_charts_core.charts.series import BarSeries
    from lightweight_charts_core.data import SingleValueData

    # Create bar data
    data = [
        SingleValueData("2024-01-01", 100),
        SingleValueData("2024-01-02", 105)
    ]

    # Create bar series with styling
    series = BarSeries(data=data)
    series.color = "#26a69a"
    series.base = 0

"""

import pandas as pd
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.data import BarData
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.utils import chainable_property


@chainable_property("up_color", str, validator="color")
@chainable_property("down_color", str, validator="color")
@chainable_property("open_visible", bool)
@chainable_property("thin_bars", bool)
class BarSeries(Series):
    """Bar series for lightweight charts.

    This class represents a bar series that displays data as bars.
    It's commonly used for price charts, volume overlays, and other
    bar-based visualizations.

    The BarSeries supports various styling options including bar colors,
    base value, and animation effects.

    Attributes:
        color: Color of the bars (set via property).
        base: Base value for the bars (set via property).
        up_color: Color for up bars (set via property).
        down_color: Color for down bars (set via property).
        open_visible: Whether open values are visible (set via property).
        thin_bars: Whether to use thin bars (set via property).
        price_lines: List of PriceLineOptions for price lines (set after construction)
        price_format: PriceFormatOptions for price formatting (set after construction)
        markers: List of markers to display on this series (set after construction)

    """

    DATA_CLASS = BarData

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series."""
        return ChartType.BAR

    def __init__(
        self,
        data: list[BarData] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "right",
        pane_id: int | None = 0,
    ):
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Initialize properties with default values
        self._up_color = "#26a69a"
        self._down_color = "#ef5350"
        self._open_visible = True
        self._thin_bars = True
