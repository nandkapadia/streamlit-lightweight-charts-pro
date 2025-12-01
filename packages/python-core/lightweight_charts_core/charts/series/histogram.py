"""Histogram series for streamlit-lightweight-charts.

This module provides the HistogramSeries class for creating histogram charts that display
volume or other single-value data as bars. Histogram series are commonly used for volume overlays
and technical indicators in financial visualization.

The HistogramSeries class supports various styling options including bar color, base value,
and animation effects. It also supports markers and price line configurations for comprehensive
chart customization.

Key Features:
    - Bar-based visualization for volume and single-value data
    - Customizable bar colors and base values
    - Volume series factory with bullish/bearish color coding
    - DataFrame integration with automatic column mapping
    - Marker and price line support for annotations

Example:
    ```python
    from lightweight_charts_core.charts.series import HistogramSeries
    from lightweight_charts_core.data import HistogramData

    # Create histogram data
    data = [
        HistogramData("2024-01-01", 1000, color="#2196F3"),
        HistogramData("2024-01-02", 1200, color="#2196F3"),
    ]

    # Create histogram series with styling
    series = HistogramSeries(data=data)
    series.set_color("#2196F3").set_base(0)

    # Create volume series with color coding
    volume_series = HistogramSeries.create_volume_series(
        data=ohlcv_data,
        column_mapping={"time": "datetime", "volume": "volume"},
        up_color="rgba(38,166,154,0.5)",
        down_color="rgba(239,83,80,0.5)",
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT

"""

# Standard Imports
from collections.abc import Sequence

# Third Party Imports
import numpy as np
import pandas as pd

# Local Imports
from lightweight_charts_core.charts.series.base import Series

# Local Imports (Constants)
from lightweight_charts_core.constants import (
    HISTOGRAM_DOWN_COLOR_DEFAULT,
    HISTOGRAM_UP_COLOR_DEFAULT,
)
from lightweight_charts_core.data import Data
from lightweight_charts_core.data.histogram_data import HistogramData
from lightweight_charts_core.data.ohlcv_data import OhlcvData
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.utils import chainable_property


@chainable_property("color", str, validator="color")
@chainable_property("base", (int, float))
class HistogramSeries(Series):
    """Histogram series for creating bar-based charts in financial visualization.

    This class represents a histogram series that displays data as bars.
    It's commonly used for volume overlays, technical indicators, and other
    bar-based visualizations where individual data points are represented
    as vertical bars.

    The HistogramSeries supports various styling options including bar color,
    base value, and animation effects. It also provides a factory method
    for creating volume series with automatic bullish/bearish color coding.

    Attributes:
        data (Union[List[Data], pd.DataFrame, pd.Series]): Data points for
            the histogram series. Can be a list of Data objects, a pandas
            DataFrame, or a pandas Series.
        color (str): Color of the histogram bars. Defaults to "#26a69a" (teal).
            Can be hex or rgba format.
        base (Union[int, float]): Base value for the histogram bars. Defaults to 0.
            This determines the baseline from which bars extend.
        column_mapping (Optional[dict]): Optional mapping for DataFrame columns
            to data fields. Used when data is provided as a DataFrame.
        visible (bool): Whether the series is visible on the chart. Defaults to True.
        price_scale_id (str): ID of the price scale this series is attached to.
            Defaults to "right".
        pane_id (Optional[int]): The pane index this series belongs to.
            Defaults to 0.

    Class Attributes:
        DATA_CLASS: The data class type used for this series (HistogramData).

    Example:
        ```python
        from lightweight_charts_core.charts.series import HistogramSeries
        from lightweight_charts_core.data import HistogramData

        # Create histogram data
        data = [
            HistogramData("2024-01-01", 1000, color="#2196F3"),
            HistogramData("2024-01-02", 1200, color="#2196F3"),
        ]

        # Create histogram series with styling
        series = HistogramSeries(data=data)
        series.set_color("#2196F3").set_base(0)

        # Create volume series with color coding
        volume_series = HistogramSeries.create_volume_series(
            data=ohlcv_data,
            column_mapping={"time": "datetime", "volume": "volume"},
            up_color="rgba(38,166,154,0.5)",
            down_color="rgba(239,83,80,0.5)",
        )
        ```

    See Also:
        Series: Base class providing common series functionality.
        HistogramData: Data class for histogram chart data points.
        create_volume_series: Factory method for volume series with color coding.

    """

    DATA_CLASS = HistogramData

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type identifier for this series.

        Returns the ChartType enum value that identifies this series as a histogram chart.
        This is used by the frontend to determine the appropriate rendering method.

        Returns:
            ChartType: The histogram chart type identifier.

        Example:
            ```python
            series = HistogramSeries(data=data)
            chart_type = series.chart_type  # ChartType.HISTOGRAM
            ```

        """
        return ChartType.HISTOGRAM

    @classmethod
    def create_volume_series(
        cls,
        data: Sequence[OhlcvData] | pd.DataFrame,
        column_mapping: dict,
        up_color: str = HISTOGRAM_UP_COLOR_DEFAULT,
        down_color: str = HISTOGRAM_DOWN_COLOR_DEFAULT,
        **kwargs,
    ) -> "HistogramSeries":
        """Create a histogram series for volume data with colors based on price movement.

        This factory method processes OHLCV data and creates a HistogramSeries
        with volume bars colored based on whether the candle is bullish (close >= open)
        or bearish (close < open). This provides visual context for volume analysis
        by showing whether volume occurred during price increases or decreases.

        Args:
            data (Union[Sequence[OhlcvData], pd.DataFrame]): OHLCV data as DataFrame
                or sequence of OhlcvData objects containing price and volume information.
            column_mapping (dict): Mapping of required fields to column names.
                Must include "open", "close", and "volume" mappings.
            up_color (str, optional): Color for bullish candles (close >= open).
                Defaults to HISTOGRAM_UP_COLOR_DEFAULT (teal with transparency).
            down_color (str, optional): Color for bearish candles (close < open).
                Defaults to HISTOGRAM_DOWN_COLOR_DEFAULT (red with transparency).
            **kwargs: Additional arguments for HistogramSeries constructor.

        Returns:
            HistogramSeries: Configured histogram series for volume visualization
                with color-coded bars based on price movement.

        Raises:
            ValueError: If required columns are missing from the data or column mapping.
            KeyError: If column mapping doesn't include required fields.

        Example:
            ```python
            # Create volume series with default colors
            volume_series = HistogramSeries.create_volume_series(
                data=ohlcv_data,
                column_mapping={
                    "time": "datetime",
                    "open": "open_price",
                    "close": "close_price",
                    "volume": "trading_volume",
                },
            )

            # Create volume series with custom colors
            volume_series = HistogramSeries.create_volume_series(
                data=ohlcv_data,
                column_mapping=column_mapping,
                up_color="#4CAF50",  # Green for bullish
                down_color="#F44336",  # Red for bearish
            )
            ```

        Note:
            The method automatically sets _last_value_visible to False for volume series
            as it's typically used as an overlay rather than a main price series.

        """
        if isinstance(data, pd.DataFrame):
            # Use vectorized operations for efficient color assignment on large datasets
            volume_dataframe = data.copy()

            # Extract column names for open and close prices from mapping
            open_col = column_mapping.get("open", "open")
            close_col = column_mapping.get("close", "close")

            # Use NumPy vectorized operations to assign colors based on price movement
            # Bullish: close >= open (green/up_color), Bearish: close < open (red/down_color)
            colors = np.where(
                volume_dataframe[close_col] >= volume_dataframe[open_col],
                up_color,
                down_color,
            )

            # Add color column to DataFrame for histogram visualization
            volume_dataframe["color"] = colors

            # Update column mapping to include color field and map volume to value
            volume_col = column_mapping.get("volume", "volume")
            updated_mapping = column_mapping.copy()
            updated_mapping["color"] = "color"  # Map color field to DataFrame column
            updated_mapping["value"] = volume_col  # Map volume to value for HistogramSeries

            # Use from_dataframe factory method to create the series
            return cls.from_dataframe(volume_dataframe, column_mapping=updated_mapping, **kwargs)  # type: ignore[return-value]

        # Handle sequence of OhlcvData objects (non-DataFrame input)
        if data is None:
            # Return empty series for None data input
            return cls(data=[])

        # Process each item in the sequence individually
        processed_data = []
        for item in data:
            if isinstance(item, dict):
                # Determine color based on price movement for dictionary input
                color = up_color if item.get("close", 0) >= item.get("open", 0) else down_color
                processed_item = item.copy()
                processed_item["color"] = color  # Add color information
                processed_data.append(processed_item)
            else:
                # For OhlcvData objects, convert to dict and add color
                item_dict = item.asdict() if hasattr(item, "asdict") else item.__dict__
                color = (
                    up_color
                    if item_dict.get("close", 0) >= item_dict.get("open", 0)
                    else down_color
                )
                item_dict["color"] = color  # Add color information
                processed_data.append(item_dict)

        # Convert processed data to DataFrame and use from_dataframe factory method
        processed_dataframe = pd.DataFrame(processed_data)
        updated_mapping = column_mapping.copy()
        updated_mapping["color"] = "color"  # Map color field to DataFrame column

        # Map volume to value for HistogramSeries compatibility
        volume_col = column_mapping.get("volume", "volume")
        updated_mapping["value"] = volume_col

        # Create the volume series using the factory method
        volume_series = cls.from_dataframe(
            processed_dataframe,
            column_mapping=updated_mapping,
            **kwargs,
        )

        # Disable last value visibility for volume series (typically used as overlay)
        volume_series._last_value_visible = False

        return volume_series  # type: ignore[return-value]

    def __init__(
        self,
        data: list[Data] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "right",
        pane_id: int | None = 0,
    ):
        """Initialize HistogramSeries with data and configuration options.

        Creates a new histogram series instance with the provided data and configuration.
        The constructor supports multiple data input types and initializes histogram-specific
        styling properties with sensible defaults.

        Args:
            data (Union[List[Data], pd.DataFrame, pd.Series]): Histogram data as a list
                of Data objects, pandas DataFrame, or pandas Series.
            column_mapping (Optional[dict]): Optional column mapping for DataFrame/Series
                input. Required when providing DataFrame or Series data.
            visible (bool, optional): Whether the series is visible. Defaults to True.
            price_scale_id (str, optional): ID of the price scale to attach to.
                Defaults to "right".
            pane_id (Optional[int], optional): The pane index this series belongs to.
                Defaults to 0.

        Raises:
            ValueError: If data is not a valid type (list of Data, DataFrame, or Series).
            ValueError: If DataFrame/Series is provided without column_mapping.
            ValueError: If all items in data list are not instances of Data or its subclasses.

        Example:
            ```python
            # Basic histogram series with list of data objects
            data = [HistogramData("2024-01-01", 1000)]
            series = HistogramSeries(data=data)

            # Histogram series with DataFrame
            series = HistogramSeries(
                data=dataframe, column_mapping={"time": "datetime", "value": "volume"}
            )

            # Histogram series with Series
            series = HistogramSeries(
                data=series_data, column_mapping={"time": "index", "value": "values"}
            )
            ```

        """
        # Initialize base series functionality
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Initialize histogram-specific properties with default values
        self._color = "#26a69a"  # Default teal color for histogram bars
        self._base = 0  # Default base value (baseline for bars)
