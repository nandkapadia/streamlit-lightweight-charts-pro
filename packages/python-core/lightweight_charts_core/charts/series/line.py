"""Line series for Streamlit Lightweight Charts Pro.

This module provides the LineSeries class for creating line charts that display
continuous data points connected by lines. Line series are commonly used for
price charts, technical indicators, and trend analysis in financial visualization.

Example:
    ```python
    from lightweight_charts_core.charts.series import LineSeries
    from lightweight_charts_core.data import SingleValueData

    # Create line data
    data = [
        SingleValueData("2024-01-01", 100),
        SingleValueData("2024-01-02", 105),
        SingleValueData("2024-01-03", 102),
    ]

    # Create line series with styling
    series = LineSeries(data=data).line_options.set_color("#2196F3").set_width(2)
    ```

"""

# Standard Imports

# Third Party Imports
import pandas as pd

# Local Imports
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.data.line_data import LineData
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.utils import chainable_property


@chainable_property("line_options", LineOptions, allow_none=True)
class LineSeries(Series):
    """Line series for creating continuous line charts in financial visualization.

    This class represents a line series that displays continuous data points
    connected by lines. It's commonly used for price charts, technical
    indicators, trend analysis, and other time-series data visualization
    in financial applications.

    Attributes:
        data: Data points for the line series. Can be a list of LineData
            objects, a pandas DataFrame, or a pandas Series.
        line_options: LineOptions instance for all line style options
            including color, width, style, and animation effects.
        column_mapping: Optional mapping for DataFrame columns to data fields.
            Used when data is provided as a DataFrame.
        visible: Whether the series is visible on the chart. Defaults to True.
        price_scale_id: ID of the price scale this series is attached to.
            Defaults to "right".
        pane_id: The pane index this series belongs to.
            Defaults to 0.

    Example:
        ```python
        from lightweight_charts_core.charts.series import LineSeries
        from lightweight_charts_core.data import LineData

        # Create line data
        data = [
            LineData("2024-01-01", 100.0, color="#2196F3"),
            LineData("2024-01-02", 105.0, color="#2196F3"),
            LineData("2024-01-03", 102.0, color="#2196F3"),
        ]

        # Create line series with styling
        series = LineSeries(data=data).line_options.set_color("#2196F3").set_width(2)

        # Add to chart
        chart = Chart(series=series)
        ```

    """

    # Define the data class type for this series - used for validation and conversion
    DATA_CLASS = LineData

    @property
    def chart_type(self) -> ChartType:
        """Get the chart type for this series.

        Returns:
            ChartType: The chart type identifier for line charts.

        """
        return ChartType.LINE

    def __init__(
        self,
        data: list[LineData] | pd.DataFrame | pd.Series,
        column_mapping: dict | None = None,
        visible: bool = True,
        price_scale_id: str = "right",
        pane_id: int | None = 0,
    ):
        """Initialize a LineSeries instance with data and configuration options.

        This constructor initializes a line series with the provided data and
        configuration options. It sets up the base series functionality and
        initializes line-specific styling options with default values.

        Args:
            data: Data points for the line series. Can be a list of LineData
                objects, a pandas DataFrame, or a pandas Series. If DataFrame
                is provided, column_mapping can be used to specify field mappings.
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
        # This sets up data validation, column mapping processing, and basic properties
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )
        # Initialize line_options with default styling configuration
        # This creates an empty LineOptions instance for future customization
        self._line_options = LineOptions()
