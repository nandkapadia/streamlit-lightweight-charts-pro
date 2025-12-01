"""Candlestick series for Streamlit Lightweight Charts Pro.

This module provides the CandlestickSeries class for creating candlestick charts that display
OHLC or OHLCV data. Candlestick series are commonly used for price charts and technical
analysis in financial visualization, providing a comprehensive view of price action.

The CandlestickSeries class supports extensive styling options for up/down colors, wicks,
borders, and animation effects. It also supports markers, price line configurations,
trade visualizations, and various customization options through chainable properties.

The module includes:
    - CandlestickSeries: Main class for creating candlestick chart series
    - Color validation and styling options
    - DataFrame support with column mapping
    - Method chaining for fluent API usage

Key Features:
    - Support for CandlestickData and OHLC data types
    - Comprehensive color customization (up/down, border, wick colors)
    - Visibility controls for wicks and borders
    - DataFrame integration with automatic column mapping
    - Marker and price line support
    - Method chaining for fluent configuration
    - Color format validation

Example:
    ```python
    from lightweight_charts_core.charts.series import CandlestickSeries
    from lightweight_charts_core.data import CandlestickData

    # Create candlestick data
    data = [
        CandlestickData("2024-01-01", 100, 105, 98, 103),
        CandlestickData("2024-01-02", 103, 108, 102, 106),
    ]

    # Create candlestick series with styling
    series = (
        CandlestickSeries(data=data)
        .set_up_color("#4CAF50")
        .set_down_color("#F44336")
        .set_border_visible(True)
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT

"""

# Standard Imports

# Third Party Imports
import pandas as pd

# Local Imports
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.data.candlestick_data import CandlestickData
from lightweight_charts_core.exceptions import ColorValidationError
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.utils import chainable_property
from lightweight_charts_core.utils.data_utils import is_valid_color


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
    """Candlestick series for creating OHLC candlestick charts in financial visualization.

    This class represents a candlestick series that displays OHLC (Open, High, Low, Close)
    data as candlestick bars. It's commonly used for price charts, technical analysis,
    and comprehensive price action visualization in financial applications.

    The CandlestickSeries extends the base Series class with candlestick-specific
    functionality and supports extensive styling options through chainable properties.
    It provides comprehensive color customization for bullish/bearish candles,
    wicks, borders, and other visual elements.

    Attributes:
        data (Union[List[CandlestickData], pd.DataFrame, pd.Series]): Data points for
            the candlestick series. Can be a list of CandlestickData objects,
            a pandas DataFrame, or a pandas Series.
        up_color (str): Color for bullish (up) candlesticks. Defaults to "#26a69a" (teal).
        down_color (str): Color for bearish (down) candlesticks. Defaults to "#ef5350" (red).
        wick_visible (bool): Whether wicks are visible. Defaults to True.
        border_visible (bool): Whether borders are visible. Defaults to False.
        border_color (str): General border color. Defaults to "#378658" (green).
        border_up_color (str): Border color for bullish candles. Defaults to "#26a69a".
        border_down_color (str): Border color for bearish candles. Defaults to "#ef5350".
        wick_color (str): General wick color. Defaults to "#737375" (gray).
        wick_up_color (str): Wick color for bullish candles. Defaults to "#26a69a".
        wick_down_color (str): Wick color for bearish candles. Defaults to "#ef5350".
        column_mapping (Optional[dict]): Optional mapping for DataFrame columns
            to data fields. Used when data is provided as a DataFrame.
        visible (bool): Whether the series is visible on the chart. Defaults to True.
        price_scale_id (str): ID of the price scale this series is attached to.
            Defaults to "right".
        pane_id (Optional[int]): The pane index this series belongs to.
            Defaults to 0.

    Class Attributes:
        DATA_CLASS: The data class type used for this series (CandlestickData).

    Example:
        ```python
        from lightweight_charts_core.charts.series import CandlestickSeries
        from lightweight_charts_core.data import CandlestickData

        # Create candlestick data
        data = [
            CandlestickData("2024-01-01", 100, 105, 98, 103),
            CandlestickData("2024-01-02", 103, 108, 102, 106),
        ]

        # Create candlestick series with styling
        series = (
            CandlestickSeries(data=data)
            .set_up_color("#4CAF50")
            .set_down_color("#F44336")
            .set_border_visible(True)
        )
        ```

    See Also:
        Series: Base class providing common series functionality.
        CandlestickData: Data class for candlestick chart data points.

    """

    # Define the data class type for this series - used for validation and conversion
    DATA_CLASS = CandlestickData

    def __init__(
        self,
        data: list[CandlestickData] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "right",
        pane_id: int | None = 0,
    ):
        """Initialize a CandlestickSeries instance with data and configuration options.

        This constructor initializes a candlestick series with the provided data and
        configuration options. It sets up the base series functionality and
        initializes candlestick-specific styling properties with default values.

        Args:
            data: Data points for the candlestick series. Can be a list of
                CandlestickData objects, a pandas DataFrame, or a pandas Series.
                If DataFrame is provided, column_mapping can be used to specify
                field mappings.
            column_mapping: Optional dictionary mapping DataFrame column names
                to data fields. Used when data is provided as a DataFrame.
                If None, automatic column mapping will be attempted.
            visible: Whether the series should be visible on the chart.
                Defaults to True.
            price_scale_id: ID of the price scale this series is attached to.
                Defaults to "right" for right-side price scale.
            pane_id: The pane index this series belongs to. Defaults to 0
                for the main pane.

        Raises:
            DataItemsTypeError: If data items are not of the expected type.
            DataFrameMissingColumnError: If required columns are missing from DataFrame.
            ColumnMappingRequiredError: If column mapping is required but not provided.

        """
        # Call parent constructor to initialize base series functionality
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Initialize candlestick-specific properties with default values
        # Up color for bullish candles - defaults to teal
        self._up_color = "#26a69a"
        # Down color for bearish candles - defaults to red
        self._down_color = "#ef5350"
        # Wick visibility - defaults to True (wicks visible)
        self._wick_visible = True
        # Border visibility - defaults to False (borders hidden)
        self._border_visible = False
        # General border color - defaults to green
        self._border_color = "#378658"
        # Border color for bullish candles - defaults to teal
        self._border_up_color = "#26a69a"
        # Border color for bearish candles - defaults to red
        self._border_down_color = "#ef5350"
        # General wick color - defaults to gray
        self._wick_color = "#737375"
        # Wick color for bullish candles - defaults to teal
        self._wick_up_color = "#26a69a"
        # Wick color for bearish candles - defaults to red
        self._wick_down_color = "#ef5350"

    def _validate_color(self, color: str, property_name: str) -> str:
        """Validate color format for candlestick styling properties.

        This method validates that the provided color string is in a valid
        format (hex or rgba) for use in candlestick styling. It's used
        internally by the chainable property validators.

        Args:
            color: The color string to validate in hex or rgba format.
            property_name: The name of the property being validated (for error messages).

        Returns:
            str: The validated color string.

        Raises:
            ColorValidationError: If the color format is invalid.

        """
        # Validate color format using utility function
        if not is_valid_color(color):
            raise ColorValidationError(property_name, color)
        return color

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series.

        Returns:
            ChartType: The chart type identifier for candlestick charts.

        """
        return ChartType.CANDLESTICK
