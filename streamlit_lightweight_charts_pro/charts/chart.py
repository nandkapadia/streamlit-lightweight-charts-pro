"""
Chart implementation for streamlit-lightweight-charts.

This module provides the Chart class, which is the primary chart type for displaying
financial data in a single pane. It supports multiple series types, annotations,
and comprehensive customization options with a fluent API for method chaining.

The Chart class provides a complete implementation for rendering interactive
financial charts with support for candlestick, line, area, bar, and histogram
series. It includes advanced features like annotations, trade visualization,
and multi-pane support.

Example:
    ```python
    from streamlit_lightweight_charts_pro import Chart, LineSeries
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create data
    data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]

    # Create chart with method chaining
    chart = (Chart(series=LineSeries(data))
             .update_options(height=400)
             .add_annotation(create_text_annotation("2024-01-01", 100, "Start")))

    # Render in Streamlit
    chart.render(key="my_chart")
    ```
"""

import time
import uuid
from typing import Any, Dict, List, Optional, Sequence, Union

import pandas as pd

from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from streamlit_lightweight_charts_pro.charts.series import (
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
    Series,
)
from streamlit_lightweight_charts_pro.component import get_component_func
from streamlit_lightweight_charts_pro.data.annotation import Annotation, AnnotationManager
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.data.tooltip import TooltipConfig, TooltipManager
from streamlit_lightweight_charts_pro.data.trade import TradeData
from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    ColumnNames,
    PriceScaleMode,
    TradeVisualization,
)

# Initialize logger
logger = get_logger(__name__)


class Chart:
    """
    Single pane chart for displaying financial data.

    This class represents a single pane chart that can display multiple series
    of financial data. It supports various chart types including candlestick,
    line, area, bar, and histogram series. The chart includes comprehensive
    annotation support, trade visualization, and method chaining for fluent
    API usage.

    The Chart class provides a complete interface for creating interactive
    financial visualizations with support for:
    - Multiple series types in a single chart
    - Advanced annotation system with layers
    - Trade visualization with buy/sell markers
    - Price and volume series from pandas DataFrames
    - Overlay price scales for complex visualizations
    - Comprehensive customization options

    Attributes:
        series (List[Series]): List of series objects to display in the chart.
        options (ChartOptions): Chart configuration options including layout, grid, etc.
        annotation_manager (AnnotationManager): Manager for chart annotations and layers.

    Example:
        ```python
        # Basic usage
        chart = Chart(series=LineSeries(data))

        # With method chaining
        chart = (Chart(series=LineSeries(data))
                 .update_options(height=400)
                 .add_annotation(text_annotation))

        # From DataFrame with price and volume
        chart = Chart.from_price_volume_dataframe(
            df, column_mapping={"time": "timestamp", "open": "o", "high": "h"}
        )
        ```
    """

    def __init__(
        self,
        series: Optional[Union[Series, List[Series]]] = None,
        options: Optional[ChartOptions] = None,
        annotations: Optional[List[Annotation]] = None,
        chart_group_id: int = 0,
        chart_manager: Optional[Any] = None,
    ):
        """
        Initialize a single pane chart.

        Args:
            series (Optional[Union[Series, List[Series]]]): Optional single series
                object or list of series objects to display. Each series represents
                a different data visualization (line, candlestick, area, etc.).
                If None, an empty chart is created.
            options (Optional[ChartOptions]): Optional chart configuration options.
                If not provided, default options will be used.
            annotations (Optional[List[Annotation]]): Optional list of annotations
                to add to the chart. Annotations can include text, arrows, shapes, etc.
            chart_group_id (int): Group ID for synchronization. Charts with the same
                group ID will be synchronized. Defaults to 0.
            chart_manager (Optional[Any]): Reference to the ChartManager that owns this chart.
                Used to access sync configuration when rendering individual charts.

        Example:
            ```python
            # Create empty chart
            chart = Chart()

            # Create chart with single series
            chart = Chart(series=LineSeries(data))

            # Create chart with multiple series
            chart = Chart(series=[line_series, candlestick_series])

            # Create chart with custom options
            chart = Chart(
                series=line_series,
                options=ChartOptions(height=600, width=800)
            )
            ```
        """
        # Convert single series to list for consistent handling
        if series is None:
            self.series = []
        elif isinstance(series, Series):
            self.series = [series]
        elif isinstance(series, list):
            # Validate that all items in the list are Series instances
            for item in series:
                if not isinstance(item, Series):
                    raise TypeError(
                        f"All items in series list must be Series instances, got {type(item)}"
                    )
            self.series = series
        else:
            raise TypeError(
                f"series must be a Series instance or list of Series instances, got {type(series)}"
            )

        # Initialize chart options
        self.options = options or ChartOptions()

        # Initialize chart group ID for synchronization
        self._chart_group_id = chart_group_id

        # Store reference to ChartManager for sync configuration access
        self._chart_manager = chart_manager

        # Initialize annotation manager
        self.annotation_manager = AnnotationManager()
        # Store trades for frontend processing
        self._trades = []
        # Store tooltip manager
        self._tooltip_manager = None
        # Add initial annotations if provided
        if annotations is not None:
            if not isinstance(annotations, list):
                raise TypeError(f"annotations must be a list, got {type(annotations)}")
            for annotation in annotations:
                if not isinstance(annotation, Annotation):
                    raise TypeError(
                        "All items in annotations list must be Annotation instances, "
                        f"got {type(annotation)}"
                    )
                self.add_annotation(annotation)

    def add_series(self, series: Series) -> "Chart":
        """
        Add a series to the chart.

        Adds a new series object to the chart's series list. The series will be
        displayed according to its type (line, candlestick, area, etc.) and
        configuration options.

        Args:
            series (Series): Series object to add to the chart. Must be an instance
                of a Series subclass (LineSeries, CandlestickSeries, etc.).

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeError: If the series parameter is not an instance of Series.

        Example:
            ```python
            # Add a candlestick series
            chart.add_series(CandlestickSeries(ohlc_data))

            # Add a line series with custom options
            chart.add_series(LineSeries(data, line_options=LineOptions(color="red")))

            # Method chaining
            chart.add_series(line_series).add_series(candlestick_series)
            ```
        """
        if not isinstance(series, Series):
            raise TypeError("series must be an instance of Series")

        # Check if series has a custom price_scale_id that's not "left" or "right"
        price_scale_id = series.price_scale_id
        if price_scale_id and price_scale_id not in ["left", "right", ""]:
            # Check if the price scale exists in overlay_price_scales
            if price_scale_id not in self.options.overlay_price_scales:
                logger.warning(
                    "Series with price_scale_id '%s' does not have a corresponding "
                    "overlay price scale configuration. Creating empty price scale object.",
                    price_scale_id,
                )
                # Create an empty PriceScaleOptions object
                empty_scale = PriceScaleOptions(price_scale_id=price_scale_id)
                self.options.overlay_price_scales[price_scale_id] = empty_scale

        self.series.append(series)
        return self

    def update_options(self, **kwargs) -> "Chart":
        """
        Update chart options.

        Updates the chart's configuration options using keyword arguments.
        Only valid ChartOptions attributes will be updated; invalid attributes
        are silently ignored to support method chaining.

        Args:
            **kwargs: Chart options to update. Valid options include:
                - width (Optional[int]): Chart width in pixels
                - height (int): Chart height in pixels
                - auto_size (bool): Whether to auto-size the chart
                - handle_scroll (bool): Whether to enable scroll interactions
                - handle_scale (bool): Whether to enable scale interactions
                - add_default_pane (bool): Whether to add a default pane

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Update basic options
            chart.update_options(height=600, width=800, auto_size=True)

            # Update interaction options
            chart.update_options(handle_scroll=True, handle_scale=False)

            # Method chaining
            chart.update_options(height=500).update_options(width=1000)
            ```
        """
        for key, value in kwargs.items():
            if value is not None and hasattr(self.options, key):
                # Only set the attribute if it's a valid type for that attribute
                current_value = getattr(self.options, key)
                if isinstance(value, type(current_value)) or (
                    current_value is None and value is not None
                ):
                    setattr(self.options, key, value)
            # Silently ignore None values and invalid attributes for method chaining
        return self

    def add_annotation(self, annotation: Annotation, layer_name: str = "default") -> "Chart":
        """
        Add an annotation to the chart.

        Adds a single annotation to the specified annotation layer. If the layer
        doesn't exist, it will be created automatically. Annotations can include
        text, arrows, shapes, and other visual elements.

        Args:
            annotation (Annotation): Annotation object to add to the chart.
            layer_name (str, optional): Name of the annotation layer. Defaults to "default".

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Add text annotation
            text_ann = create_text_annotation("2024-01-01", 100, "Important Event")
            chart.add_annotation(text_ann)

            # Add annotation to custom layer
            chart.add_annotation(arrow_ann, layer_name="signals")

            # Method chaining
            chart.add_annotation(text_ann).add_annotation(arrow_ann)
            ```
        """
        if annotation is None:
            raise TypeError("annotation cannot be None")
        if not isinstance(annotation, Annotation):
            raise TypeError(f"annotation must be an Annotation instance, got {type(annotation)}")

        # Use default layer name if None is provided
        if layer_name is None:
            layer_name = "default"
        elif not layer_name or not isinstance(layer_name, str):
            raise ValueError("layer_name must be a non-empty string")

        self.annotation_manager.add_annotation(annotation, layer_name)
        return self

    def add_annotations(
        self, annotations: List[Annotation], layer_name: str = "default"
    ) -> "Chart":
        """
        Add multiple annotations to the chart.

        Adds multiple annotation objects to the specified annotation layer. This
        is more efficient than calling add_annotation multiple times as it
        processes all annotations in a single operation.

        Args:
            annotations (List[Annotation]): List of annotation objects to add
                to the chart.
            layer_name (str, optional): Name of the annotation layer. Defaults to "default".

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Add multiple annotations at once
            annotations = [
                create_text_annotation("2024-01-01", 100, "Start"),
                create_arrow_annotation("2024-01-02", 105, "Trend"),
                create_shape_annotation("2024-01-03", 110, "rectangle")
            ]
            chart.add_annotations(annotations)

            # Add to custom layer
            chart.add_annotations(annotations, layer_name="analysis")
            ```
        """
        if annotations is None:
            raise TypeError("annotations cannot be None")
        if not isinstance(annotations, list):
            raise TypeError(f"annotations must be a list, got {type(annotations)}")
        if not layer_name or not isinstance(layer_name, str):
            raise ValueError("layer_name must be a non-empty string")

        for annotation in annotations:
            if not isinstance(annotation, Annotation):
                raise TypeError(
                    "All items in annotations list must be Annotation instances, "
                    f"got {type(annotation)}"
                )
            self.add_annotation(annotation, layer_name)
        return self

    def create_annotation_layer(self, name: str) -> "Chart":
        """
        Create a new annotation layer.

        Creates a new annotation layer with the specified name. Annotation layers
        allow you to organize and manage groups of annotations independently.
        Each layer can be shown, hidden, or cleared separately.

        Args:
            name (str): Name of the annotation layer to create.

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Create custom layers for different types of annotations
            chart.create_annotation_layer("signals")
            chart.create_annotation_layer("analysis")
            chart.create_annotation_layer("events")

            # Method chaining
            chart.create_annotation_layer("layer1").create_annotation_layer("layer2")
            ```
        """
        if name is None:
            raise TypeError("name cannot be None")
        elif not name or not isinstance(name, str):
            raise ValueError("name must be a non-empty string")
        self.annotation_manager.create_layer(name)
        return self

    def hide_annotation_layer(self, name: str) -> "Chart":
        """
        Hide an annotation layer.

        Hides the specified annotation layer, making all annotations in that
        layer invisible on the chart. The layer and its annotations are preserved
        and can be shown again using show_annotation_layer.

        Args:
            name (str): Name of the annotation layer to hide.

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Hide specific layers
            chart.hide_annotation_layer("analysis")
            chart.hide_annotation_layer("signals")

            # Method chaining
            chart.hide_annotation_layer("layer1").hide_annotation_layer("layer2")
            ```
        """
        if not name or not isinstance(name, str):
            raise ValueError("name must be a non-empty string")
        self.annotation_manager.hide_layer(name)
        return self

    def show_annotation_layer(self, name: str) -> "Chart":
        """
        Show an annotation layer.

        Makes the specified annotation layer visible on the chart. This will
        display all annotations that were previously added to this layer.
        If the layer doesn't exist, this method will have no effect.

        Args:
            name (str): Name of the annotation layer to show.

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Show specific layers
            chart.show_annotation_layer("analysis")
            chart.show_annotation_layer("signals")

            # Method chaining
            chart.show_annotation_layer("layer1").show_annotation_layer("layer2")
            ```
        """
        if not name or not isinstance(name, str):
            raise ValueError("name must be a non-empty string")
        self.annotation_manager.show_layer(name)
        return self

    def clear_annotations(self, layer_name: Optional[str] = None) -> "Chart":
        """
        Clear annotations from the chart.

        Removes all annotations from the specified layer or from all layers if
        no layer name is provided. The layer itself is preserved and can be
        reused for new annotations.

        Args:
            layer_name (Optional[str]): Name of the layer to clear. If None,
                clears all layers. Defaults to None.

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Clear specific layer
            chart.clear_annotations("analysis")

            # Clear all layers
            chart.clear_annotations()

            # Method chaining
            chart.clear_annotations("layer1").add_annotation(new_annotation)
            ```
        """
        if layer_name is not None and (not layer_name or not isinstance(layer_name, str)):
            raise ValueError("layer_name must be None or a non-empty string")
        self.annotation_manager.clear_layer(layer_name)
        return self

    def add_overlay_price_scale(self, scale_id: str, options: "PriceScaleOptions") -> "Chart":
        """
        Add or update a custom overlay price scale configuration.

        Adds or updates an overlay price scale configuration for the chart.
        Overlay price scales allow multiple series to share the same price axis
        while maintaining independent scaling and positioning.

        Args:
            scale_id (str): The unique identifier for the custom price scale
                (e.g., 'volume', 'indicator1', 'overlay').
            options (PriceScaleOptions): A PriceScaleOptions instance containing
                the configuration for the overlay price scale.

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
                PriceScaleOptions,
            )

            # Add volume overlay price scale
            volume_scale = PriceScaleOptions(
                visible=False,
                scale_margin_top=0.8,
                scale_margin_bottom=0,
                overlay=True,
                auto_scale=True
            )
            chart.add_overlay_price_scale('volume', volume_scale)

            # Method chaining
            chart.add_overlay_price_scale('indicator1', indicator_scale) \
                .add_series(indicator_series)
            ```
        """
        if not scale_id or not isinstance(scale_id, str):
            raise ValueError("scale_id must be a non-empty string")
        if options is None:
            raise TypeError("options cannot be None")
        if not isinstance(options, PriceScaleOptions):
            raise ValueError("options must be a PriceScaleOptions instance")

        # Check for duplicate scale_id
        if scale_id in self.options.overlay_price_scales:
            raise ValueError(f"Price scale with id '{scale_id}' already exists")

        self.options.overlay_price_scales[scale_id] = options
        return self

    def add_price_volume_series(
        self,
        data: Union[Sequence[OhlcvData], pd.DataFrame],
        column_mapping: dict = None,
        price_type: str = "candlestick",
        price_kwargs=None,
        volume_kwargs=None,
        pane_id: int = 0,
    ) -> "Chart":
        """
        Add price and volume series to the chart.

        Creates and adds both price and volume series to the chart from OHLCV data.
        The price series is displayed on the main price scale, while the volume
        series is displayed on a separate overlay price scale.

        Args:
            data (Union[Sequence[OhlcvData], pd.DataFrame]): OHLCV data containing
                price and volume information.
            column_mapping (dict, optional): Mapping of column names for DataFrame
                conversion. Defaults to None.
            price_type (str, optional): Type of price series ('candlestick' or 'line').
                Defaults to "candlestick".
            price_kwargs (dict, optional): Additional arguments for price series
                configuration. Defaults to None.
            volume_kwargs (dict, optional): Additional arguments for volume series
                configuration. Defaults to None.
            pane_id (int, optional): Pane ID for both price and volume series.
                Defaults to 0.

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Add candlestick with volume
            chart.add_price_volume_series(
                ohlcv_data,
                column_mapping={"time": "timestamp", "volume": "vol"},
                price_type="candlestick"
            )

            # Add line chart with custom volume colors
            chart.add_price_volume_series(
                ohlcv_data,
                price_type="line",
                volume_kwargs={"up_color": "green", "down_color": "red"}
            )
            ```
        """
        # Validate inputs
        if data is None:
            raise TypeError("data cannot be None")
        if not isinstance(data, (list, pd.DataFrame)) or (
            isinstance(data, list) and len(data) == 0
        ):
            raise ValueError("data must be a non-empty list or DataFrame")

        if column_mapping is None:
            raise TypeError("column_mapping cannot be None")
        if not isinstance(column_mapping, dict):
            raise TypeError("column_mapping must be a dict")

        if pane_id < 0:
            raise ValueError("pane_id must be non-negative")

        price_kwargs = price_kwargs or {}
        volume_kwargs = volume_kwargs or {}

        # Price series (default price scale)
        if price_type == "candlestick":
            # Filter column mapping to only include OHLC fields for candlestick series
            price_column_mapping = {
                k: v
                for k, v in column_mapping.items()
                if k in ["time", "open", "high", "low", "close"]
            }
            price_series = CandlestickSeries(
                data=data,
                column_mapping=price_column_mapping,
                pane_id=pane_id,
                price_scale_id="right",
                **price_kwargs,
            )

        elif price_type == "line":
            price_series = LineSeries(
                data=data,
                column_mapping=column_mapping,
                pane_id=pane_id,
                price_scale_id="right",
                **price_kwargs,
            )
        else:
            raise ValueError("price_type must be 'candlestick' or 'line'")

        # Extract volume-specific kwargs
        volume_up_color = volume_kwargs.get("up_color", "rgba(38,166,154,0.5)")
        volume_down_color = volume_kwargs.get("down_color", "rgba(239,83,80,0.5)")
        volume_base = volume_kwargs.get("base", 0)

        # Add overlay price scale
        volume_price_scale = PriceScaleOptions(
            visible=False,
            auto_scale=True,
            border_visible=False,
            mode=PriceScaleMode.NORMAL,
            scale_margins=PriceScaleMargins(top=0.8, bottom=0.0),
            price_scale_id=ColumnNames.VOLUME,
        )
        self.add_overlay_price_scale(ColumnNames.VOLUME, volume_price_scale)

        # The volume series histogram expects a column called 'value'
        if "value" not in column_mapping:
            column_mapping["value"] = column_mapping["volume"]

        # Create histogram series
        volume_series = HistogramSeries.create_volume_series(
            data=data,
            column_mapping=column_mapping,
            up_color=volume_up_color,
            down_color=volume_down_color,
            pane_id=pane_id,
            price_scale_id=ColumnNames.VOLUME,
        )

        # Set volume-specific properties
        volume_series.base = volume_base
        volume_series.price_format = {"type": "volume", "precision": 0}

        # Add both series to the chart
        self.add_series(price_series)
        self.add_series(volume_series)
        return self

    def add_trades(self, trades: List[TradeData]) -> "Chart":
        """
        Add trade visualization to the chart.

        Converts TradeData objects to visual elements and adds them to the chart for
        visualization. Each trade will be displayed with entry and exit markers,
        rectangles, lines, arrows, or zones based on the TradeVisualizationOptions.style
        configuration. The visualization can include markers, rectangles, arrows, or
        combinations depending on the style setting.

        Args:
            trades (List[TradeData]): List of TradeData objects to visualize on the chart.

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            from streamlit_lightweight_charts_pro.data import TradeData
            from streamlit_lightweight_charts_pro.type_definitions.enums import TradeType

            # Create TradeData objects
            trades = [
                TradeData(
                    entry_time="2024-01-01 10:00:00",
                    entry_price=100.0,
                    exit_time="2024-01-01 15:00:00",
                    exit_price=105.0,
                    quantity=100,
                    trade_type=TradeType.LONG
                )
            ]

            # Add trade visualization
            chart.add_trade_visualization(trades)

            # Method chaining
            chart.add_trade_visualization(trades).update_options(height=600)
            ```
        """
        if trades is None:
            raise TypeError("trades cannot be None")
        if not isinstance(trades, list):
            raise TypeError(f"trades must be a list, got {type(trades)}")

        # Validate that all items are TradeData objects
        for trade in trades:
            if not isinstance(trade, TradeData):
                raise TypeError(f"All items in trades must be TradeData objects, got {type(trade)}")

        # Store trades for frontend processing
        self._trades = trades

        # Check if we should add markers based on TradeVisualizationOptions style
        should_add_markers = False
        if self.options and self.options.trade_visualization:
            style = self.options.trade_visualization.style
            # Add markers for styles that include markers
            should_add_markers = style in [
                TradeVisualization.MARKERS,
                TradeVisualization.BOTH,
                TradeVisualization.ARROWS,
            ]

        if should_add_markers:
            for trade in trades:
                # Convert trade to markers
                markers = trade.to_markers()

                # Add markers to the first series that supports markers
                for series in self.series:
                    if hasattr(series, "markers"):
                        for marker in markers:
                            series.markers.append(marker)
                        break

        return self

    def set_tooltip_manager(self, tooltip_manager) -> "Chart":
        """
        Set the tooltip manager for the chart.

        Args:
            tooltip_manager: TooltipManager instance to handle tooltip functionality.

        Returns:
            Chart: Self for method chaining.
        """

        if not isinstance(tooltip_manager, TooltipManager):
            raise TypeError("tooltip_manager must be a TooltipManager instance")

        self._tooltip_manager = tooltip_manager
        return self

    def add_tooltip_config(self, name: str, config) -> "Chart":
        """
        Add a tooltip configuration to the chart.

        Args:
            name: Name for the tooltip configuration.
            config: TooltipConfig instance.

        Returns:
            Chart: Self for method chaining.
        """

        if not isinstance(config, TooltipConfig):
            raise TypeError("config must be a TooltipConfig instance")

        if self._tooltip_manager is None:
            self._tooltip_manager = TooltipManager()

        self._tooltip_manager.add_config(name, config)
        return self

    def set_chart_group_id(self, group_id: int) -> "Chart":
        """
        Set the chart group ID for synchronization.

        Charts with the same group_id will be synchronized with each other.
        This is different from sync_group which is used by ChartManager.

        Args:
            group_id (int): Group ID for synchronization.

        Returns:
            Chart: Self for method chaining.

        Example:
            ```python
            # Set chart group ID
            chart.set_chart_group_id(1)
            ```
        """
        self.chart_group_id = group_id
        return self

    @property
    def chart_group_id(self) -> int:
        """
        Get the chart group ID for synchronization.

        Returns:
            int: The chart group ID.

        Example:
            ```python
            # Get chart group ID
            group_id = chart.chart_group_id
            ```
        """
        return self._chart_group_id

    @chart_group_id.setter
    def chart_group_id(self, group_id: int) -> None:
        """
        Set the chart group ID for synchronization.

        Args:
            group_id (int): Group ID for synchronization.

        Example:
            ```python
            # Set chart group ID
            chart.chart_group_id = 1
            ```
        """
        if not isinstance(group_id, int):
            raise TypeError("chart_group_id must be an integer")
        self._chart_group_id = group_id

    def to_frontend_config(self) -> Dict[str, Any]:
        """
        Convert chart to frontend configuration dictionary.

        Converts the chart and all its components (series, options, annotations)
        to a dictionary format suitable for frontend consumption. This method
        handles the serialization of all chart elements including series data,
        chart options, price scales, and annotations.

        Returns:
            Dict[str, Any]: Complete chart configuration ready for frontend
                rendering. The configuration includes:
                - charts: List of chart objects with series and options
                - syncConfig: Synchronization settings for multi-chart layouts

        Note:
            Series are automatically ordered by z-index within each pane to ensure
            proper layering in the frontend. Series with lower z-index values
            render behind series with higher z-index values.

        Example:
            ```python
            # Get frontend configuration
            config = chart.to_frontend_config()

            # Access chart configuration
            chart_config = config['charts'][0]
            series_config = chart_config['series']
            options_config = chart_config['chart']
            ```
        """
        # Group series by pane_id and sort by z_index within each pane
        # This ensures proper layering order in the frontend where:
        # - Series are grouped by their pane_id first
        # - Within each pane, series are sorted by z_index (ascending)
        # - Lower z_index values render behind higher z_index values
        # - Pane order is maintained in the final output
        series_by_pane = {}
        for series in self.series:
            series_config = series.asdict()

            # Handle case where asdict() returns invalid data
            if not isinstance(series_config, dict):
                logger.warning(
                    "Series %s returned invalid configuration from asdict(): %s. "
                    "Skipping z-index ordering for this series.",
                    type(series).__name__,
                    series_config,
                )
                # Add to default pane with default z-index
                if 0 not in series_by_pane:
                    series_by_pane[0] = []
                series_by_pane[0].append(series_config)
                continue

            pane_id = series_config.get("paneId", 0)  # Default to pane 0 if not specified

            if pane_id not in series_by_pane:
                series_by_pane[pane_id] = []

            series_by_pane[pane_id].append(series_config)

        # Sort series within each pane by z_index (lower values render first/behind)
        for pane_id, series_list in series_by_pane.items():
            series_list.sort(key=lambda x: x.get("zIndex", 0) if isinstance(x, dict) else 0)

        # Flatten sorted series back to a single list, maintaining pane order
        series_configs = []
        for pane_id in sorted(series_by_pane.keys()):
            series_configs.extend(series_by_pane[pane_id])

        chart_config = (
            self.options.asdict() if self.options is not None else ChartOptions().asdict()
        )
        # Ensure rightPriceScale, PriceScaleOptions, PriceScaleOptionss are present and dicts
        if self.options and self.options.right_price_scale is not None:
            chart_config["rightPriceScale"] = self.options.right_price_scale.asdict()
        if self.options and self.options.left_price_scale is not None:
            chart_config["leftPriceScale"] = self.options.left_price_scale.asdict()

        if self.options and self.options.overlay_price_scales is not None:
            chart_config["overlayPriceScales"] = {
                k: v.asdict() if hasattr(v, "asdict") else v
                for k, v in self.options.overlay_price_scales.items()
            }

        annotations_config = self.annotation_manager.asdict()

        # Add trades to chart configuration if they exist
        trades_config = None
        if hasattr(self, "_trades") and self._trades:
            trades_config = [trade.asdict() for trade in self._trades]

        chart_obj = {
            "chartId": f"chart-{id(self)}",
            "chart": chart_config,
            "series": series_configs,
            "annotations": annotations_config,
        }

        # Add trades to chart configuration if they exist
        if trades_config:
            chart_obj["trades"] = trades_config

            # Add trade visualization options if they exist
            if self.options and self.options.trade_visualization:
                chart_obj["tradeVisualizationOptions"] = self.options.trade_visualization.asdict()

        # Add tooltip configurations if they exist
        if self._tooltip_manager:
            tooltip_configs = {}
            for name, config in self._tooltip_manager.configs.items():
                tooltip_configs[name] = config.asdict()
            chart_obj["tooltipConfigs"] = tooltip_configs

        # Add chart group ID for synchronization
        chart_obj["chartGroupId"] = self.chart_group_id

        # Note: paneHeights is now accessed directly from chart.layout.paneHeights in frontend
        config = {
            "charts": [chart_obj],
        }

        # Add sync configuration if ChartManager reference is available
        if self._chart_manager is not None:
            # Get sync config directly from manager without calling to_frontend_config
            # to avoid circular reference

            # Check if this chart's group has sync enabled
            chart_group_id = self.chart_group_id
            group_sync_enabled = False
            group_sync_config = None

            if (
                self._chart_manager.sync_groups
                and str(chart_group_id) in self._chart_manager.sync_groups
            ):
                group_sync_config = self._chart_manager.sync_groups[str(chart_group_id)]
                group_sync_enabled = group_sync_config.enabled

            # Enable sync at top level if this chart's group has sync enabled
            sync_enabled = self._chart_manager.default_sync.enabled or group_sync_enabled

            sync_config = {
                "enabled": sync_enabled,
                "crosshair": self._chart_manager.default_sync.crosshair,
                "timeRange": self._chart_manager.default_sync.time_range,
            }

            # Add group-specific sync configurations
            if self._chart_manager.sync_groups:
                sync_config["groups"] = {}
                for group_id, group_sync in self._chart_manager.sync_groups.items():
                    sync_config["groups"][str(group_id)] = {
                        "enabled": group_sync.enabled,
                        "crosshair": group_sync.crosshair,
                        "timeRange": group_sync.time_range,
                    }

            config["syncConfig"] = sync_config

        return config

    def render(self, key: Optional[str] = None) -> Any:
        """
        Render the chart in Streamlit.

        Converts the chart to frontend configuration and renders it using the
        Streamlit component. This is the final step in the chart creation process
        that displays the interactive chart in the Streamlit application.

        Args:
            key (Optional[str]): Optional unique key for the Streamlit component.
                This key is used to identify the component instance and is useful
                for debugging and component state management.

        Returns:
            Any: The rendered Streamlit component that displays the interactive chart.

        Example:
            ```python
            # Basic rendering
            chart.render()

            # Rendering with custom key
            chart.render(key="my_chart")

            # Method chaining with rendering
            chart.add_series(line_series).update_options(height=600).render(key="chart1")
            ```
        """
        config = self.to_frontend_config()
        component_func = get_component_func()

        if component_func is None:
            # Try to reinitialize the component
            from streamlit_lightweight_charts_pro.component import reinitialize_component

            if reinitialize_component():
                component_func = get_component_func()

            if component_func is None:
                raise RuntimeError(
                    "Component function not available. "
                    "Please check if the component is properly initialized."
                )

        kwargs = {"config": config}

        # Extract height and width from chart options and pass to frontend
        if self.options:
            if hasattr(self.options, "height") and self.options.height is not None:
                kwargs["height"] = self.options.height
            if hasattr(self.options, "width") and self.options.width is not None:
                kwargs["width"] = self.options.width

        # Generate a unique key if none provided or if it's empty/invalid
        if key is None or not isinstance(key, str) or not key.strip():

            # Generate a unique key using timestamp and UUID
            unique_id = str(uuid.uuid4())[:8]
            key = f"chart_{int(time.time() * 1000)}_{unique_id}"

        kwargs["key"] = key

        return component_func(**kwargs)
