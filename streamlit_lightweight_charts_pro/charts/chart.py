"""Chart implementation for streamlit-lightweight-charts.

This module provides the Chart class, which is the primary chart type for displaying
financial data in a single pane. It supports multiple series types, annotations,
and comprehensive customization options with a fluent API for method chaining.

Example:
    ```python
    from streamlit_lightweight_charts_pro import Chart, LineSeries
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create data
    data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]

    # Create chart with method chaining
    chart = (
        Chart(series=LineSeries(data))
        .update_options(height=400)
        .add_annotation(create_text_annotation("2024-01-01", 100, "Start"))
    )

    # Render in Streamlit
    chart.render(key="my_chart")
    ```
"""

# Standard Imports
import json
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, Union

# Third Party Imports
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

# Local Imports
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
from streamlit_lightweight_charts_pro.charts.series_settings_api import (
    get_series_settings_api,
)
from streamlit_lightweight_charts_pro.component import (  # pylint: disable=import-outside-toplevel
    get_component_func,
    reinitialize_component,
)
from streamlit_lightweight_charts_pro.data.annotation import Annotation, AnnotationManager
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.data.tooltip import TooltipConfig, TooltipManager
from streamlit_lightweight_charts_pro.data.trade import TradeData
from streamlit_lightweight_charts_pro.exceptions import (
    AnnotationItemsTypeError,
    ComponentNotAvailableError,
    PriceScaleIdTypeError,
    PriceScaleOptionsTypeError,
    SeriesItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    ColumnNames,
    PriceScaleMode,
)

# Initialize logger
logger = get_logger(__name__)


class Chart:
    """Single pane chart for displaying financial data.

    This class represents a single pane chart that can display multiple
    series of financial data. It supports various chart types including
    candlestick, line, area, bar, and histogram series. The chart includes
    comprehensive annotation support, trade visualization, and method chaining
    for fluent API usage.

    Attributes:
        series (List[Series]): List of series objects to display in the chart.
        options (ChartOptions): Chart configuration options including layout,
            grid, etc.
        annotation_manager (AnnotationManager): Manager for chart annotations
            and layers.

    Example:
        ```python
        # Basic usage
        chart = Chart(series=LineSeries(data))

        # With method chaining
        chart = Chart(series=LineSeries(data)).update_options(height=400)
                                              .add_annotation(text_annotation)

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
        """Initialize a single pane chart.

        Creates a new Chart instance with optional series, configuration options,
        and annotations. The chart can be configured with multiple series types
        and supports method chaining for fluent API usage.

        Args:
            series: Optional single series object or list of series objects to
                display. Each series represents a different data visualization
                (line, candlestick, area, etc.). If None, an empty chart is
                created.
            options: Optional chart configuration options. If not provided,
                default options will be used.
            annotations: Optional list of annotations to add to the chart.
                Annotations can include text, arrows, shapes, etc.
            chart_group_id: Group ID for synchronization. Charts with the same
                group ID will be synchronized. Defaults to 0.
            chart_manager: Reference to the ChartManager that owns this chart.
                Used to access sync configuration when rendering individual charts.

        Returns:
            Chart: Initialized chart instance ready for configuration and rendering.

        Raises:
            SeriesItemsTypeError: If any item in the series list is not a Series
                instance.
            TypeValidationError: If series is not a Series instance or list, or if
                annotations is not a list.
            AnnotationItemsTypeError: If any item in annotations is not an Annotation
                instance.

        Example:
            ```python
            # Create empty chart
            chart = Chart()

            # Create chart with single series
            chart = Chart(series=LineSeries(data))

            # Create chart with multiple series
            chart = Chart(series=[line_series, candlestick_series])

            # Create chart with custom options
            chart = Chart(series=line_series, options=ChartOptions(height=600, width=800))
            ```
        """
        # Handle series input - convert to list for uniform processing
        # This allows the class to accept either a single Series or a list
        if series is None:
            # Case 1: No series provided - create empty chart
            self.series = []
        elif isinstance(series, Series):
            # Case 2: Single Series object - wrap in list for consistent handling
            self.series = [series]
        elif isinstance(series, list):
            # Case 3: List of series - validate each item is a Series instance
            for item in series:
                if not isinstance(item, Series):
                    # Reject list items that are not Series objects
                    raise SeriesItemsTypeError()
            self.series = series
        else:
            # Case 4: Invalid input type - raise error with clear message
            raise TypeValidationError("series", "Series instance or list")

        # Set up chart configuration
        # Use provided options or default ChartOptions instance
        self.options = options or ChartOptions()

        # Initialize chart synchronization support
        # Chart group ID enables multiple charts to sync their time ranges
        self._chart_group_id = chart_group_id

        # Store ChartManager reference for retrieving sync settings
        # This allows the chart to access manager's configuration
        self._chart_manager = chart_manager

        # Set up annotation system that manages chart annotations
        # AnnotationsManager handles layers, visibility, and annotations
        self.annotation_manager = AnnotationManager()

        # Initialize storage for trade data to be processed by frontend
        # Trades include buy/sell markers and PnL calculations
        self._trades: List[TradeData] = []

        # Initialize tooltip manager for lazy loading
        # Tooltips are only loaded if requested to improve performance
        self._tooltip_manager: Optional[TooltipManager] = None

        # Flag to track if configs have been applied in current render cycle
        # This prevents double application which can cause flicker
        self._configs_applied = False

        # Process initial annotations if provided
        # This ensures annotations are added in correct order
        if annotations is not None:
            # Validate that annotations parameter is a list
            if not isinstance(annotations, list):
                # Fail fast on invalid annotation container
                raise TypeValidationError("annotations", "list")

            # Add each annotation to the chart annotation system
            for annotation in annotations:
                if not isinstance(annotation, Annotation):
                    # Reject annotation items that are not Annotation objects
                    raise AnnotationItemsTypeError()
                # Add annotation to the chart's annotation manager
                self.add_annotation(annotation)

    def get_stored_series_config(
        self,
        key: str,
        series_index: int = 0,
        pane_id: int = 0,
    ) -> Dict[str, Any]:
        """Get stored configuration for a specific series.

        Retrieves the stored configuration for a series from session state.
        Useful for applying configs when creating new series instances.

        Args:
            key: Component key used to namespace the stored configs
            series_index: Index of the series (default: 0)
            pane_id: Pane ID for the series (default: 0)

        Returns:
            Dictionary of stored configuration or empty dict if none found

        Example:
            ```python
            # Get stored config for series
            config = chart.get_stored_series_config("my_chart", series_index=0)

            # Apply to new series
            if config:
                line_series = LineSeries(data)
                if "color" in config:
                    line_series.line_options.color = config["color"]
            ```
        """
        session_key = f"_chart_series_configs_{key}"
        stored_configs = st.session_state.get(session_key, {})
        series_id = f"pane-{pane_id}-series-{series_index}"
        return stored_configs.get(series_id, {})

    def add_series(self, series: Series) -> "Chart":
        """Add a series to the chart.

        Adds a new series object to the chart's series list. The series will be
        displayed according to its type (line, candlestick, area, etc.) and
        configuration options. Automatically handles price scale configuration
        for custom price scale IDs.

        Args:
            series: Series object to add to the chart. Must be an instance of a
                Series subclass (LineSeries, CandlestickSeries, etc.).

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeValidationError: If the series parameter is not an instance of Series.

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
        # Validate input type to ensure it's a proper Series instance
        if not isinstance(series, Series):
            raise TypeValidationError("series", "Series instance")

        # Check for custom price scale configuration needs
        # Extract price_scale_id from the series for validation
        price_scale_id = series.price_scale_id  # type: ignore[attr-defined]

        # Handle custom price scale setup
        # Only process non-standard scale IDs (not default "left"/"right")
        if (
            price_scale_id
            and price_scale_id not in ["left", "right", ""]
            and price_scale_id not in self.options.overlay_price_scales
        ):
            # Log warning when series uses custom price scale without configuration
            logger.warning(
                "Series with price_scale_id '%s' does not have a corresponding "
                "overlay price scale configuration. Creating empty price scale object.",
                price_scale_id,
            )
            # Create basic price scale configuration for the custom ID
            empty_scale = PriceScaleOptions(price_scale_id=price_scale_id)
            self.options.overlay_price_scales[price_scale_id] = empty_scale

        # Add the validated series to the chart's series collection
        self.series.append(series)

        # Return self for method chaining
        return self

    def update_options(self, **kwargs) -> "Chart":
        """Update chart options.

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
        # Process each keyword argument to update chart options
        for key, value in kwargs.items():
            # Check that the attribute exists on options and value is not None
            if value is not None and hasattr(self.options, key):
                # Get the current attribute value for type checking
                current_value = getattr(self.options, key)
                # Validate that the new value type matches current attribute type
                if isinstance(value, type(current_value)) or (
                    current_value is None and value is not None
                ):
                    # Update the attribute with the validated value
                    setattr(self.options, key, value)
            # Silently ignore None values to support method chaining
        # Return self for method chaining
        return self

    def add_annotation(self, annotation: Annotation, layer_name: str = "default") -> "Chart":
        """Add an annotation to the chart.

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
            raise ValueValidationError("annotation", "cannot be None")
        if not isinstance(annotation, Annotation):
            raise TypeValidationError("annotation", "Annotation instance")

        # Use default layer name if None is provided
        if layer_name is None:
            layer_name = "default"
        elif not layer_name or not isinstance(layer_name, str):
            raise ValueValidationError("layer_name", "must be a non-empty string")

        self.annotation_manager.add_annotation(annotation, layer_name)
        return self

    def add_annotations(
        self,
        annotations: List[Annotation],
        layer_name: str = "default",
    ) -> "Chart":
        """Add multiple annotations to the chart.

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
                create_shape_annotation("2024-01-03", 110, "rectangle"),
            ]
            chart.add_annotations(annotations)

            # Add to custom layer
            chart.add_annotations(annotations, layer_name="analysis")
            ```
        """
        if annotations is None:
            raise TypeValidationError("annotations", "list")
        if not isinstance(annotations, list):
            raise TypeValidationError("annotations", "list")
        if not layer_name or not isinstance(layer_name, str):
            raise ValueValidationError("layer_name", "must be a non-empty string")

        for annotation in annotations:
            if not isinstance(annotation, Annotation):
                raise AnnotationItemsTypeError()
            self.add_annotation(annotation, layer_name)
        return self

    def create_annotation_layer(self, name: str) -> "Chart":
        """Create a new annotation layer.

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
            raise TypeValidationError("name", "string")
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.create_layer(name)
        return self

    def hide_annotation_layer(self, name: str) -> "Chart":
        """Hide an annotation layer.

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
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.hide_layer(name)
        return self

    def show_annotation_layer(self, name: str) -> "Chart":
        """Show an annotation layer.

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
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.show_layer(name)
        return self

    def clear_annotations(self, layer_name: Optional[str] = None) -> "Chart":
        """Clear annotations from the chart.

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
            raise ValueValidationError("layer_name", "must be None or a non-empty string")
        if layer_name is not None:
            self.annotation_manager.clear_layer(layer_name)
        return self

    def add_overlay_price_scale(self, scale_id: str, options: "PriceScaleOptions") -> "Chart":
        """Add or update a custom overlay price scale configuration.

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
            raise ValueValidationError("scale_id", "must be a non-empty string")
        if options is None:
            raise TypeValidationError("options", "PriceScaleOptions")
        if not isinstance(options, PriceScaleOptions):
            raise ValueValidationError("options", "must be a PriceScaleOptions instance")

        # CRITICAL FIX: Ensure the price_scale_id field matches the scale_id parameter
        # This ensures proper mapping between dictionary key and the PriceScaleOptions ID
        # Without this, the frontend cannot match series to their price scales
        options.price_scale_id = scale_id

        # Update or add the overlay price scale (allow updates to existing scales)
        self.options.overlay_price_scales[scale_id] = options
        return self

    def add_price_volume_series(
        self,
        data: Union[Sequence[OhlcvData], pd.DataFrame],
        column_mapping: Optional[dict] = None,
        price_type: str = "candlestick",
        price_kwargs=None,
        volume_kwargs=None,
        pane_id: int = 0,
    ) -> "Chart":
        """Add price and volume series to the chart.

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
                price_type="candlestick",
            )

            # Add line chart with custom volume colors
            chart.add_price_volume_series(
                ohlcv_data,
                price_type="line",
                volume_kwargs={"up_color": "green", "down_color": "red"},
            )
            ```
        """
        # Validate inputs
        if data is None:
            raise TypeValidationError("data", "list or DataFrame")
        if not isinstance(data, (list, pd.DataFrame)) or (
            isinstance(data, list) and len(data) == 0
        ):
            raise ValueValidationError("data", "must be a non-empty list or DataFrame")

        if column_mapping is None:
            raise TypeValidationError("column_mapping", "dict")
        if not isinstance(column_mapping, dict):
            raise TypeValidationError("column_mapping", "dict")

        if pane_id < 0:
            raise ValueValidationError("pane_id", "must be non-negative")

        price_kwargs = price_kwargs or {}
        volume_kwargs = volume_kwargs or {}

        # CRITICAL FIX: Configure right price scale margins to leave space for volume
        # Volume will use bottom 20% (top=0.8), so right scale needs bottom >= 0.2
        # Using bottom=0.25 to provide comfortable spacing between price and volume
        if self.options.right_price_scale is not None:
            # Explicitly set visible=True to ensure it's serialized and sent to frontend
            self.options.right_price_scale.visible = True
            self.options.right_price_scale.scale_margins = PriceScaleMargins(
                top=0.1,  # 10% margin at top
                bottom=0.25,  # 25% margin at bottom (leaves room for volume overlay)
            )

        # Price series (default price scale)
        price_series: Union[CandlestickSeries, LineSeries]
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
            raise ValueValidationError("price_type", "must be 'candlestick' or 'line'")

        # Extract volume-specific kwargs
        volume_up_color = volume_kwargs.get("up_color", "rgba(38,166,154,0.5)")
        volume_down_color = volume_kwargs.get("down_color", "rgba(239,83,80,0.5)")
        volume_base = volume_kwargs.get("base", 0)

        # Add overlay price scale for volume
        # Volume uses bottom 20% of chart (top=0.8 to bottom=1.0)
        volume_price_scale = PriceScaleOptions(
            visible=False,
            auto_scale=True,
            border_visible=False,
            mode=PriceScaleMode.NORMAL,
            scale_margins=PriceScaleMargins(top=0.8, bottom=0.0),
            price_scale_id=ColumnNames.VOLUME.value,
        )
        self.add_overlay_price_scale(ColumnNames.VOLUME.value, volume_price_scale)

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
            price_scale_id=ColumnNames.VOLUME.value,
        )

        # Set volume-specific properties
        volume_series.base = volume_base  # type: ignore[attr-defined]
        volume_series.price_format = {"type": "volume", "precision": 0}  # type: ignore[attr-defined]

        # Add both series to the chart
        self.add_series(price_series)
        self.add_series(volume_series)
        return self

    def add_trades(self, trades: List[TradeData]) -> "Chart":
        """Add trade visualization to the chart.

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
                    trade_type=TradeType.LONG,
                )
            ]

            # Add trade visualization
            chart.add_trade_visualization(trades)

            # Method chaining
            chart.add_trade_visualization(trades).update_options(height=600)
            ```
        """
        if trades is None:
            raise TypeValidationError("trades", "list")
        if not isinstance(trades, list):
            raise TypeValidationError("trades", "list")

        # Validate that all items are TradeData objects
        for trade in trades:
            if not isinstance(trade, TradeData):
                raise ValueValidationError("trades", "all items must be TradeData objects")

        # Store trades for frontend processing
        self._trades = trades

        # Check if we should add markers based on TradeVisualizationOptions style
        # Note: Trade markers are now created in the frontend using templates
        # The frontend createTradeMarkers() function handles marker generation
        # based on TradeVisualizationOptions (entry_marker_template, exit_marker_template)
        # This provides more flexibility and consistency with the template system

        return self

    def set_tooltip_manager(self, tooltip_manager) -> "Chart":
        """Set the tooltip manager for the chart.

        Args:
            tooltip_manager: TooltipManager instance to handle tooltip functionality.

        Returns:
            Chart: Self for method chaining.
        """
        if not isinstance(tooltip_manager, TooltipManager):
            raise TypeValidationError("tooltip_manager", "TooltipManager instance")

        self._tooltip_manager = tooltip_manager
        return self

    def add_tooltip_config(self, name: str, config) -> "Chart":
        """Add a tooltip configuration to the chart.

        Args:
            name: Name for the tooltip configuration.
            config: TooltipConfig instance.

        Returns:
            Chart: Self for method chaining.
        """
        if not isinstance(config, TooltipConfig):
            raise TypeValidationError("config", "TooltipConfig instance")

        if self._tooltip_manager is None:
            self._tooltip_manager = TooltipManager()

        self._tooltip_manager.add_config(name, config)
        return self

    def set_chart_group_id(self, group_id: int) -> "Chart":
        """Set the chart group ID for synchronization.

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
        """Get the chart group ID for synchronization.

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
        """Set the chart group ID for synchronization.

        Args:
            group_id (int): Group ID for synchronization.

        Example:
            ```python
            # Set chart group ID
            chart.chart_group_id = 1
            ```
        """
        if not isinstance(group_id, int):
            raise TypeValidationError("chart_group_id", "integer")
        self._chart_group_id = group_id

    def _filter_range_switcher_by_data(self, chart_config: Dict[str, Any]) -> Dict[str, Any]:
        """Filter range switcher options based on available data timespan.

        This method calculates the actual data timespan from all series and removes
        range options that exceed the available data range. This provides a cleaner
        user experience by only showing relevant time ranges.

        Args:
            chart_config: The chart configuration dictionary

        Returns:
            Dict[str, Any]: Modified chart configuration with filtered range options
        """
        # Only process if range switcher is configured
        if not (chart_config.get("rangeSwitcher") and chart_config["rangeSwitcher"].get("ranges")):
            return chart_config

        # Calculate data timespan from all series
        data_timespan_seconds = self._calculate_data_timespan()
        if data_timespan_seconds is None:
            return chart_config  # No data or unable to calculate, keep all ranges

        # Filter ranges based on data timespan
        original_ranges = chart_config["rangeSwitcher"]["ranges"]
        filtered_ranges = []

        for range_config in original_ranges:
            range_seconds = self._get_range_seconds(range_config)

            # Keep range if:
            # - It's "All" range (range_seconds is None)
            # - It's within data timespan (with small buffer for edge cases)
            if range_seconds is None or range_seconds <= data_timespan_seconds * 1.1:
                filtered_ranges.append(range_config)

        # Update the chart config with filtered ranges
        chart_config["rangeSwitcher"]["ranges"] = filtered_ranges

        return chart_config

    def _calculate_data_timespan(self) -> Optional[float]:
        """Calculate the timespan of data across all series in seconds."""
        min_time = None
        max_time = None

        for series in self.series:
            if not hasattr(series, "data") or not series.data:
                continue

            for data_point in series.data:
                time_value = None

                # Extract time from various data formats
                if hasattr(data_point, "time"):
                    time_value = data_point.time
                elif isinstance(data_point, dict) and "time" in data_point:
                    time_value = data_point["time"]

                if time_value is None:
                    continue

                # Convert time to timestamp
                timestamp = self._convert_time_to_timestamp(time_value)
                if timestamp is None:
                    continue

                if min_time is None or timestamp < min_time:
                    min_time = timestamp
                if max_time is None or timestamp > max_time:
                    max_time = timestamp

        if min_time is None or max_time is None:
            return None

        return max_time - min_time

    def _convert_time_to_timestamp(self, time_value) -> Optional[float]:
        """Convert various time formats to timestamp."""
        if isinstance(time_value, (int, float)):
            return float(time_value)
        if isinstance(time_value, str):
            try:
                # Try parsing ISO format
                dt = datetime.fromisoformat(time_value.replace("Z", "+00:00"))
                return dt.timestamp()
            except (ValueError, AttributeError):
                try:
                    # Try parsing as date
                    dt = datetime.strptime(time_value, "%Y-%m-%d")
                    return dt.timestamp()
                except ValueError:
                    return None
        elif hasattr(time_value, "timestamp"):
            return time_value.timestamp()
        return None

    def _get_range_seconds(self, range_config: Dict[str, Any]) -> Optional[float]:
        """Extract seconds from range configuration."""
        range_value = range_config.get("range")

        if range_value is None or range_value == "ALL":
            return None

        # Handle TimeRange enum values
        range_seconds_map = {
            "FIVE_MINUTES": 300,
            "FIFTEEN_MINUTES": 900,
            "THIRTY_MINUTES": 1800,
            "ONE_HOUR": 3600,
            "FOUR_HOURS": 14400,
            "ONE_DAY": 86400,
            "ONE_WEEK": 604800,
            "TWO_WEEKS": 1209600,
            "ONE_MONTH": 2592000,
            "THREE_MONTHS": 7776000,
            "SIX_MONTHS": 15552000,
            "ONE_YEAR": 31536000,
            "TWO_YEARS": 63072000,
            "FIVE_YEARS": 157680000,
        }

        if isinstance(range_value, str) and range_value in range_seconds_map:
            return range_seconds_map[range_value]
        if isinstance(range_value, (int, float)):
            return float(range_value)

        return None

    def to_frontend_config(self) -> Dict[str, Any]:
        """Convert chart to frontend configuration dictionary.

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
            chart_config = config["charts"][0]
            series_config = chart_config["series"]
            options_config = chart_config["chart"]
            ```
        """
        # Group series by pane_id and sort by z_index within each pane
        # This ensures proper layering order in the frontend where:
        # - Series are grouped by their pane_id first
        # - Within each pane, series are sorted by z_index (ascending)
        # - Lower z_index values render behind higher z_index values
        # - Pane order is maintained in the final output
        series_by_pane: Dict[int, List[Dict[str, Any]]] = {}
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
        for series_list in series_by_pane.values():
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
            try:
                chart_config["rightPriceScale"] = self.options.right_price_scale.asdict()
                # Validate price scale ID is a string if provided
                if self.options.right_price_scale.price_scale_id is not None and not isinstance(
                    self.options.right_price_scale.price_scale_id,
                    str,
                ):
                    raise PriceScaleIdTypeError(
                        "right_price_scale",
                        type(self.options.right_price_scale.price_scale_id),
                    )
            except AttributeError as e:
                if isinstance(self.options.right_price_scale, bool):
                    raise PriceScaleOptionsTypeError(
                        "right_price_scale",
                        type(self.options.right_price_scale),
                    ) from e
                raise PriceScaleOptionsTypeError(
                    "right_price_scale",
                    type(self.options.right_price_scale),
                ) from e
        if self.options and self.options.left_price_scale is not None:
            try:
                chart_config["leftPriceScale"] = self.options.left_price_scale.asdict()
                # Validate price scale ID is a string if provided
                if self.options.left_price_scale.price_scale_id is not None and not isinstance(
                    self.options.left_price_scale.price_scale_id,
                    str,
                ):
                    raise PriceScaleIdTypeError(
                        "left_price_scale",
                        type(self.options.left_price_scale.price_scale_id),
                    )
            except AttributeError as e:
                if isinstance(self.options.left_price_scale, bool):
                    raise PriceScaleOptionsTypeError(
                        "left_price_scale",
                        type(self.options.left_price_scale),
                    ) from e
                raise PriceScaleOptionsTypeError(
                    "left_price_scale",
                    type(self.options.left_price_scale),
                ) from e

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

        # Apply data-aware range filtering to remove ranges that exceed data timespan
        chart_config = self._filter_range_switcher_by_data(chart_config)

        chart_obj: Dict[str, Any] = {
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
            for name, tooltip_config in self._tooltip_manager.configs.items():
                tooltip_configs[name] = tooltip_config.asdict()
            chart_obj["tooltipConfigs"] = tooltip_configs

        # Add chart group ID for synchronization
        chart_obj["chartGroupId"] = self.chart_group_id

        # Note: paneHeights is now accessed directly from chart.layout.paneHeights in frontend
        config: Dict[str, Any] = {
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

            sync_config: Dict[str, Any] = {
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

    def _save_series_configs_to_session(self, key: str, configs: Dict[str, Any]) -> None:
        """Save series configurations to Streamlit session state.

        Private method to persist series configurations across reruns.

        Args:
            key: Component key used to namespace the stored configs
            configs: Dictionary of series configurations to save
        """
        if not key:
            return

        session_key = f"_chart_series_configs_{key}"
        st.session_state[session_key] = configs

    def _load_series_configs_from_session(self, key: str) -> Dict[str, Any]:
        """Load series configurations from Streamlit session state.

        Private method to retrieve persisted series configurations.

        Args:
            key: Component key used to namespace the stored configs

        Returns:
            Dictionary of series configurations or empty dict if none found
        """
        if not key:
            return {}

        session_key = f"_chart_series_configs_{key}"
        return st.session_state.get(session_key, {})

    def _apply_stored_configs_to_series(self, stored_configs: Dict[str, Any]) -> None:
        """Apply stored configurations to series objects.

        Private method to update series objects with persisted configurations.
        Optimized to apply all configurations in a single pass to prevent flicker.

        Args:
            stored_configs: Dictionary mapping series IDs to their configurations
        """
        if not stored_configs:
            return

        # Check if configs have already been applied in this render cycle
        # This prevents double application which can cause flicker
        if hasattr(self, "_configs_applied") and self._configs_applied:
            return

        for i, series in enumerate(self.series):
            # Generate the expected series ID - support both pane-0 and multi-pane
            pane_id = getattr(series, "pane_id", 0) or 0
            series_id = f"pane-{pane_id}-series-{i}"

            if series_id in stored_configs:
                config = stored_configs[series_id]

                # Log what we're applying for debugging
                logger.debug("Applying stored config to %s: %s", series_id, config)

                try:
                    # Separate configs for line_options vs general series properties
                    line_options_config = {}
                    series_config = {}

                    for key, value in config.items():
                        # Skip data and internal metadata
                        if key in (
                            "data",
                            "type",
                            "paneId",
                            "priceScaleId",
                            "zIndex",
                            "_seriesType",
                        ):
                            continue

                        # Line-specific properties go to line_options
                        if key in (
                            "color",
                            "lineWidth",
                            "lineStyle",
                            "lineType",
                            "lineVisible",
                            "pointMarkersVisible",
                            "pointMarkersRadius",
                            "crosshairMarkerVisible",
                            "crosshairMarkerRadius",
                            "crosshairMarkerBorderColor",
                            "crosshairMarkerBackgroundColor",
                            "crosshairMarkerBorderWidth",
                            "lastPriceAnimation",
                        ):
                            line_options_config[key] = value
                        # Other properties go to the series itself
                        else:
                            series_config[key] = value

                    # Apply all configurations in a single batch to minimize updates
                    # Apply line options config if this is a series with line_options
                    if (
                        hasattr(series, "line_options")
                        and series.line_options
                        and line_options_config
                    ):
                        logger.debug(
                            "Applying line_options config to %s: %s",
                            series_id,
                            line_options_config,
                        )
                        series.line_options.update(line_options_config)

                    # Apply general series config
                    if series_config and hasattr(series, "update") and callable(series.update):
                        logger.debug("Applying series config to %s: %s", series_id, series_config)
                        series.update(series_config)

                except Exception:
                    logger.exception("Failed to apply config to series %s", series_id)

        # Mark configs as applied for this render cycle
        self._configs_applied = True

    def render(self, key: Optional[str] = None) -> Any:
        """Render the chart in Streamlit.

        Converts the chart to frontend configuration and renders it using the
        Streamlit component. This is the final step in the chart creation process
        that displays the interactive chart in the Streamlit application.

        The chart configuration is generated fresh on each render, allowing users
        to control chart lifecycle and state management in their own code if needed.

        Args:
            key (Optional[str]): Optional unique key for the Streamlit component.
                This key is used to identify the component instance and is useful
                for debugging and component state management. If not provided,
                a unique key will be generated automatically.

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

            # User-managed state (optional)
            if "my_chart" not in st.session_state:
                st.session_state.my_chart = Chart(series=LineSeries(data))
            st.session_state.my_chart.render(key="persistent_chart")
            ```
        """
        # Generate a unique key if none provided or if it's empty/invalid
        if key is None or not isinstance(key, str) or not key.strip():
            # Generate a unique key using timestamp and UUID
            unique_id = str(uuid.uuid4())[:8]
            key = f"chart_{int(time.time() * 1000)}_{unique_id}"

        # STEP 1: Reset config application flag for this render cycle
        # This allows configs to be applied fresh on each render
        self._configs_applied = False

        # STEP 2: Load and apply stored configs IMMEDIATELY before any serialization
        # This ensures configs are applied exactly once before generating frontend config
        stored_configs = self._load_series_configs_from_session(key)
        if stored_configs:
            self._apply_stored_configs_to_series(stored_configs)

        # STEP 3: Generate chart configuration ONLY AFTER configs are applied
        # This prevents any intermediate state from being rendered
        config = self.to_frontend_config()

        # Get component function
        component_func = get_component_func()

        if component_func is None:
            # Try to reinitialize the component
            if reinitialize_component():
                component_func = get_component_func()

            if component_func is None:
                raise ComponentNotAvailableError()

        # Build component kwargs
        kwargs: Dict[str, Any] = {"config": config}

        # Extract height and width from chart options and pass to frontend
        if self.options:
            if hasattr(self.options, "height") and self.options.height is not None:
                kwargs["height"] = self.options.height
            if hasattr(self.options, "width") and self.options.width is not None:
                kwargs["width"] = self.options.width

        kwargs["key"] = key

        # CRITICAL: Add default parameter for proper return value handling
        # This allows the component to return values from frontend
        kwargs["default"] = None

        # STEP 4: Render component
        result = component_func(**kwargs)

        # STEP 5: Handle component return value and save series configs
        if result and isinstance(result, dict):
            # Check if we have series config changes from the frontend
            if result.get("type") == "series_config_changes":
                changes = result.get("changes", [])
                if changes:
                    # Build a dictionary of all current series configs
                    series_configs = {}
                    for change in changes:
                        series_id = change.get("seriesId")
                        config = change.get("config")
                        if series_id and config:
                            series_configs[series_id] = config

                    # Save to session state
                    if series_configs:
                        self._save_series_configs_to_session(key, series_configs)

            # Still handle other API responses
            series_api = get_series_settings_api(key)
            self._handle_series_settings_response(result, series_api)

        return result

    def _handle_series_settings_response(self, response: dict, series_api) -> None:
        """Handle series settings API responses from the frontend.

        Args:
            response: Response data from the frontend component
            series_api: SeriesSettingsAPI instance for this chart
        """
        try:
            # Check for series settings API calls
            if response.get("type") == "get_pane_state":
                pane_id = response.get("paneId", 0)
                message_id = response.get("messageId")

                if message_id:
                    pane_state = series_api.get_pane_state(pane_id)
                    # Send response back to frontend via custom event
                    components.html(
                        f"""
                    <script>
                    document.dispatchEvent(new CustomEvent('streamlit:apiResponse', {{
                        detail: {{
                            messageId: '{message_id}',
                            response: {json.dumps({"success": True, "data": pane_state})}
                        }}
                    }}));
                    </script>
                    """,
                        height=0,
                    )

            elif response.get("type") == "update_series_settings":
                pane_id = response.get("paneId", 0)
                series_id = response.get("seriesId", "")
                config = response.get("config", {})
                message_id = response.get("messageId")

                # Always update the settings
                success = series_api.update_series_settings(pane_id, series_id, config)

                # Only send response if messageId was provided
                if message_id:
                    components.html(
                        f"""
                    <script>
                    document.dispatchEvent(new CustomEvent('streamlit:apiResponse', {{
                        detail: {{
                            messageId: '{message_id}',
                            response: {json.dumps({"success": success})}
                        }}
                    }}));
                    </script>
                    """,
                        height=0,
                    )

            elif response.get("type") == "reset_series_defaults":
                pane_id = response.get("paneId", 0)
                series_id = response.get("seriesId", "")
                message_id = response.get("messageId")

                if message_id:
                    defaults = series_api.reset_series_to_defaults(pane_id, series_id)
                    success = defaults is not None
                    components.html(
                        f"""
                    <script>
                    document.dispatchEvent(new CustomEvent('streamlit:apiResponse', {{
                        detail: {{
                            messageId: '{message_id}',
                            response: {json.dumps({"success": success, "data": defaults or {}})}
                        }}
                    }}));
                    </script>
                    """,
                        height=0,
                    )

            elif response.get("type") == "series_config_changes":
                # Handle batched configuration changes from StreamlitSeriesConfigService
                changes = response.get("changes", [])

                for change in changes:
                    pane_id = change.get("paneId", 0)
                    series_id = change.get("seriesId", "")
                    config = change.get("config", {})

                    if series_id and config:
                        success = series_api.update_series_settings(pane_id, series_id, config)
                        if not success:
                            logger.warning("Failed to store config for series %s", series_id)
                    else:
                        logger.warning("Skipping invalid change (missing seriesId or config)")

        except Exception:
            logger.exception("Error handling series settings response")

    def get_series_info_for_pane(self, _pane_id: int = 0) -> List[dict]:
        """Get series information for the series settings dialog.

        Args:
            pane_id: The pane ID to get series info for (default: 0)

        Returns:
            List of series information dictionaries
        """
        series_info = []

        for i, series in enumerate(self.series):
            # Get series ID
            series_id = getattr(series, "id", f"series_{i}")

            # Get display name
            display_name = series_id
            if hasattr(series, "name") and series.name:
                display_name = series.name
            elif hasattr(series, "title") and series.title:
                display_name = series.title

            # Get series type
            series_type = series.__class__.__name__.lower().replace("series", "")

            series_info.append(
                {
                    "id": series_id,
                    "displayName": display_name,
                    "type": series_type,
                },
            )

        return series_info
