"""Area series for streamlit-lightweight-charts.

This module provides the AreaSeries class for creating area charts that display
continuous data points with filled areas under the line. Area series are commonly
used for price charts, indicators, and trend analysis in financial visualization.

The AreaSeries class supports various styling options including area color,
line color, width, style, and animation effects. It also supports markers and price
line configurations for comprehensive chart customization.

Key Features:
    - Filled area visualization with customizable colors
    - Line styling through LineOptions integration
    - Gradient effects and area inversion options
    - Marker and price line support for annotations
    - DataFrame integration with automatic column mapping

Example:
    ```python
    from lightweight_charts_core.charts.series import AreaSeries
    from lightweight_charts_core.data import AreaData

    # Create area data
    data = [
        AreaData("2024-01-01", 100, line_color="#2196F3"),
        AreaData("2024-01-02", 105, line_color="#2196F3"),
        AreaData("2024-01-03", 102, line_color="#2196F3"),
    ]

    # Create area series with styling
    series = AreaSeries(
        data=data,
        top_color="rgba(33, 150, 243, 0.4)",
        bottom_color="rgba(33, 150, 243, 0.0)",
        relative_gradient=False,
        invert_filled_area=False,
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
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.series.base import Series

# Local Imports (Constants)
from lightweight_charts_core.constants import (
    AREA_BOTTOM_COLOR_DEFAULT,
    COLOR_BLUE_MATERIAL,
)
from lightweight_charts_core.data.area_data import AreaData
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.utils import chainable_property


@chainable_property("line_options", LineOptions, allow_none=True)
@chainable_property("top_color", str, validator="color")
@chainable_property("bottom_color", str, validator="color")
@chainable_property("relative_gradient", bool)
@chainable_property("invert_filled_area", bool)
class AreaSeries(Series):
    """Area series for creating filled area charts in financial visualization.

    This class represents an area series that displays continuous data points
    with filled areas under the line. It's commonly used for price charts,
    technical indicators, and trend analysis where the area under the curve
    provides visual emphasis and context.

    The AreaSeries supports various styling options including area colors,
    line styling via LineOptions, and gradient effects for enhanced
    visual appeal and data interpretation.

    Attributes:
        data (Union[List[AreaData], pd.DataFrame, pd.Series]): Data points for
            the area series. Can be a list of AreaData objects, a pandas
            DataFrame, or a pandas Series.
        line_options (LineOptions): LineOptions instance for line styling.
            Provides comprehensive line customization including color, width,
            style, and animation effects.
        top_color (str): Color of the top part of the area fill. Defaults to
            "#2196F3" (blue). Can be hex or rgba format.
        bottom_color (str): Color of the bottom part of the area fill. Defaults
            to "rgba(33, 150, 243, 0.0)" (transparent blue).
        relative_gradient (bool): Whether gradient is relative to base value.
            Defaults to False for absolute gradient positioning.
        invert_filled_area (bool): Whether to invert the filled area direction.
            Defaults to False for normal area filling.
        column_mapping (Optional[dict]): Optional mapping for DataFrame columns
            to data fields. Used when data is provided as a DataFrame.
        visible (bool): Whether the series is visible on the chart. Defaults to True.
        price_scale_id (str): ID of the price scale this series is attached to.
            Defaults to "".
        pane_id (Optional[int]): The pane index this series belongs to.
            Defaults to 0.

    Class Attributes:
        DATA_CLASS: The data class type used for this series (AreaData).

    Example:
        ```python
        from lightweight_charts_core.charts.series import AreaSeries
        from lightweight_charts_core.data import AreaData

        # Create area data with line colors
        data = [
            AreaData("2024-01-01", 100, line_color="#2196F3"),
            AreaData("2024-01-02", 105, line_color="#2196F3"),
            AreaData("2024-01-03", 102, line_color="#2196F3"),
        ]

        # Create area series with gradient styling
        series = AreaSeries(
            data=data,
            top_color="rgba(33, 150, 243, 0.4)",
            bottom_color="rgba(33, 150, 243, 0.0)",
            relative_gradient=False,
            invert_filled_area=False,
        )

        # Configure line options
        series.line_options.set_color("#2196F3").set_width(2)
        ```

    See Also:
        Series: Base class providing common series functionality.
        LineOptions: Configuration class for line styling options.
        AreaData: Data class for area chart data points.

    """

    DATA_CLASS = AreaData

    def __init__(
        self,
        data: list[AreaData] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "",
        pane_id: int | None = 0,
    ):
        """Initialize AreaSeries with data and configuration options.

        Creates a new area series instance with the provided data and configuration.
        The constructor supports multiple data input types and initializes area-specific
        styling properties with sensible defaults.

        Args:
            data (Union[List[AreaData], pd.DataFrame, pd.Series]): Area data as a list
                of AreaData objects, pandas DataFrame, or pandas Series.
            column_mapping (Optional[dict]): Optional column mapping for DataFrame/Series
                input. Required when providing DataFrame or Series data.
            visible (bool, optional): Whether the series is visible. Defaults to True.
            price_scale_id (str, optional): ID of the price scale to attach to.
                Defaults to "".
            pane_id (Optional[int], optional): The pane index this series belongs to.
                Defaults to 0.

        Raises:
            ValueError: If data is not a valid type (list of AreaData objects,
                DataFrame, or Series).
            ValueError: If DataFrame/Series is provided without column_mapping.
            ValueError: If all items in data list are not instances of AreaData or its subclasses.

        Example:
            ```python
            # Basic area series with list of data objects
            data = [AreaData("2024-01-01", 100)]
            series = AreaSeries(data=data)

            # Area series with DataFrame
            series = AreaSeries(data=df, column_mapping={"time": "datetime", "value": "close"})

            # Area series with custom configuration
            series = AreaSeries(data=data, visible=True, price_scale_id="right", pane_id=1)
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

        # Initialize area-specific properties with default values
        self._line_options = LineOptions()  # Line styling configuration
        self._top_color = COLOR_BLUE_MATERIAL  # Top area color (blue)
        self._bottom_color = AREA_BOTTOM_COLOR_DEFAULT  # Bottom area color (transparent)
        self._relative_gradient = False  # Absolute gradient positioning
        self._invert_filled_area = False  # Normal area filling direction

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type identifier for this series.

        Returns the ChartType enum value that identifies this series as an area chart.
        This is used by the frontend to determine the appropriate rendering method.

        Returns:
            ChartType: The area chart type identifier.

        Example:
            ```python
            series = AreaSeries(data=data)
            chart_type = series.chart_type  # ChartType.AREA
            ```

        """
        return ChartType.AREA
