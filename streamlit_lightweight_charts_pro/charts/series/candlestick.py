"""
Candlestick series for streamlit-lightweight-charts.

This module provides the CandlestickSeries class for creating candlestick charts that display
OHLC or OHLCV data. Candlestick series are commonly used for price charts and technical analysis.

The CandlestickSeries class supports various styling options for up/down colors, wicks, borders,
and animation effects. It also supports markers, price line configurations, and trade
visualizations.

Example:
    from streamlit_lightweight_charts_pro.charts.series import CandlestickSeries
    from streamlit_lightweight_charts_pro.data.ohlc_data import OhlcData

    # Create candlestick data
    data = [
        OhlcData("2024-01-01", 100, 105, 98, 103),
        OhlcData("2024-01-02", 103, 108, 102, 106)
    ]

    # Create candlestick series with styling
    series = CandlestickSeries(data=data)
    series.up_color = "#4CAF50"
    series.down_color = "#F44336"
"""

from typing import List, Optional, Union

import pandas as pd

from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.data.candlestick_data import CandlestickData
from streamlit_lightweight_charts_pro.type_definitions import ChartType
from streamlit_lightweight_charts_pro.utils import chainable_property
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@chainable_property("up_color", str, validator="color")
@chainable_property("down_color", str, validator="color")
@chainable_property("wick_visible", bool)
@chainable_property("border_visible", bool)
@chainable_property("border_color", str, validator="color")
@chainable_property("border_up_color", str, validator="color")
@chainable_property("border_down_color", str, validator="color")
@chainable_property("wick_color", str, validator="color")
@chainable_property("wick_up_color", str, validator="color")
@chainable_property("wick_down_color", str, validator="color")
class CandlestickSeries(Series):
    """Candlestick series for lightweight charts."""

    DATA_CLASS = CandlestickData

    def __init__(
        self,
        data: Union[List[CandlestickData], pd.DataFrame, pd.Series],
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

        # Initialize candlestick-specific properties with default values
        self._up_color = "#26a69a"
        self._down_color = "#ef5350"
        self._wick_visible = True
        self._border_visible = False
        self._border_color = "#378658"
        self._border_up_color = "#26a69a"
        self._border_down_color = "#ef5350"
        self._wick_color = "#737375"
        self._wick_up_color = "#26a69a"
        self._wick_down_color = "#ef5350"

    def _validate_color(self, color: str, property_name: str) -> str:
        """Validate color format."""
        if not is_valid_color(color):
            raise ValueError(
                f"Invalid color format for {property_name}: {color!r}. Must be hex or rgba."
            )
        return color

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series."""
        return ChartType.CANDLESTICK
