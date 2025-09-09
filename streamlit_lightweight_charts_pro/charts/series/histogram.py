"""
Histogram series for streamlit-lightweight-charts.

This module provides the HistogramSeries class for creating histogram charts that display
volume or other single-value data as bars. Histogram series are commonly used for volume overlays
and technical indicators.

The HistogramSeries class supports various styling options including bar color, base value,
and animation effects. It also supports markers and price line configurations.

Example:
    from streamlit_lightweight_charts_pro.charts.series import HistogramSeries
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create histogram data
    data = [
        SingleValueData("2024-01-01", 1000),
        SingleValueData("2024-01-02", 1200)
    ]

    # Create histogram series with styling
    series = HistogramSeries(data=data)
    series.color = "#2196F3"
    series.base = 0
"""

from typing import List, Optional, Sequence, Union

import numpy as np
import pandas as pd

from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.data import Data
from streamlit_lightweight_charts_pro.data.histogram_data import HistogramData
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.type_definitions import ChartType
from streamlit_lightweight_charts_pro.utils import chainable_property


@chainable_property("color", str, validator="color")
@chainable_property("base", (int, float))
class HistogramSeries(Series):
    """
    Histogram series for lightweight charts.

    This class represents a histogram series that displays data as bars.
    It's commonly used for volume overlays, technical indicators, and other
    bar-based visualizations.

    The HistogramSeries supports various styling options including bar color,
    base value, and animation effects.

    Attributes:
        color: Color of the bars (set via property).
        base: Base value for the bars (set via property).
        price_lines: List of PriceLineOptions for price lines (set after construction)
        price_format: PriceFormatOptions for price formatting (set after construction)
        markers: List of markers to display on this series (set after construction)
    """

    DATA_CLASS = HistogramData

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series."""
        return ChartType.HISTOGRAM

    @classmethod
    def create_volume_series(
        cls,
        data: Union[Sequence[OhlcvData], pd.DataFrame],
        column_mapping: dict,
        up_color: str = "rgba(38,166,154,0.5)",
        down_color: str = "rgba(239,83,80,0.5)",
        **kwargs,
    ) -> "HistogramSeries":
        """
        Create a histogram series for volume data with colors based on price movement.

        This factory method processes OHLCV data and creates a HistogramSeries
        with volume bars colored based on whether the candle is bullish (close >= open)
        or bearish (close < open).

        Args:
            data: OHLCV data as DataFrame or sequence of OhlcvData objects
            column_mapping: Mapping of required fields to column names
            up_color: Color for bullish candles (close >= open)
            down_color: Color for bearish candles (close < open)
            **kwargs: Additional arguments for HistogramSeries

        Returns:
            HistogramSeries: Configured histogram series for volume visualization
        """
        if isinstance(data, pd.DataFrame):
            # Use vectorized operations for color assignment
            df = data.copy()

            # Get open and close columns
            open_col = column_mapping.get("open", "open")
            close_col = column_mapping.get("close", "close")

            # Vectorized color assignment based on price movement
            colors = np.where(df[close_col] >= df[open_col], up_color, down_color)

            # Add color column to DataFrame
            df["color"] = colors

            # Update column mapping to include color
            volume_col = column_mapping.get("volume", "volume")
            updated_mapping = column_mapping.copy()
            updated_mapping["color"] = "color"
            # Map volume to value for HistogramSeries
            updated_mapping["value"] = volume_col
            # Use from_dataframe factory method
            return cls.from_dataframe(df, column_mapping=updated_mapping, **kwargs)
        else:
            # For sequence of OhlcvData objects, process each item
            if data is None:
                # Return empty series for None data
                return cls(data=[])

            processed_data = []
            for item in data:
                if isinstance(item, dict):
                    # Determine color based on price movement
                    color = up_color if item.get("close", 0) >= item.get("open", 0) else down_color
                    processed_item = item.copy()
                    processed_item["color"] = color
                    processed_data.append(processed_item)
                else:
                    # For OhlcvData objects, convert to dict and add color
                    item_dict = item.asdict() if hasattr(item, "asdict") else item.__dict__
                    color = (
                        up_color
                        if item_dict.get("close", 0) >= item_dict.get("open", 0)
                        else down_color
                    )
                    item_dict["color"] = color
                    processed_data.append(item_dict)

            # Convert to DataFrame and use from_dataframe factory method
            df = pd.DataFrame(processed_data)
            updated_mapping = column_mapping.copy()
            updated_mapping["color"] = "color"
            # Map volume to value for HistogramSeries
            volume_col = column_mapping.get("volume", "volume")
            updated_mapping["value"] = volume_col

            volume_series = cls.from_dataframe(df, column_mapping=updated_mapping, **kwargs)
            volume_series.last_value_visible = False

            return volume_series

    def __init__(
        self,
        data: Union[List[Data], pd.DataFrame, pd.Series],
        column_mapping: Optional[dict] = None,
        visible: bool = True,
        price_scale_id: str = "right",
        pane_id: Optional[int] = 0,
    ):
        """
        Initialize a histogram series with data and configuration.

        Args:
            data: Series data as a list of data objects, pandas DataFrame, or pandas Series.
            column_mapping: Optional column mapping for DataFrame/Series input.
            visible: Whether the series is visible. Defaults to True.
            price_scale_id: ID of the price scale to attach to. Defaults to "right".
            pane_id: The pane index this series belongs to. Defaults to 0.

        Raises:
            ValueError: If data is not a valid type (list of Data, DataFrame, or Series).
            ValueError: If DataFrame/Series is provided without column_mapping.

        Example:
            ```python
            # Basic series with list of data objects
            series = HistogramSeries(data=histogram_data)

            # Series with DataFrame
            series = HistogramSeries(
                data=df,
                column_mapping={'time': 'datetime', 'value': 'volume'}
            )

            # Series with Series
            series = HistogramSeries(
                data=series_data,
                column_mapping={'time': 'index', 'value': 'values'}
            )
            ```
        """
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Initialize histogram-specific properties with default values
        self._color = "#26a69a"
        self._base = 0
