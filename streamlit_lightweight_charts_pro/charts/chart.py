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
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Sequence, Union

# Third Party Imports
import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

from streamlit_lightweight_charts_pro.charts.managers import (
    ChartRenderer,
    PriceScaleManager,
    SeriesManager,
    SessionStateManager,
    TradeManager,
)
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
    PriceScaleMargins,
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

# Local Imports
from streamlit_lightweight_charts_pro.constants import (
    HISTOGRAM_DOWN_COLOR_DEFAULT,
    HISTOGRAM_UP_COLOR_DEFAULT,
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

if TYPE_CHECKING:
    from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
        PriceScaleOptions,
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
        # Set up chart configuration
        self.options = options or ChartOptions()

        # Initialize managers
        self._series_manager = SeriesManager(series)
        self._price_scale_manager = PriceScaleManager(
            left_price_scale=self.options.left_price_scale,
            right_price_scale=self.options.right_price_scale,
            overlay_price_scales=self.options.overlay_price_scales,
        )
        self._trade_manager = TradeManager()
        self._session_state_manager = SessionStateManager()
        self._chart_renderer = ChartRenderer(chart_manager_ref=chart_manager)

        # Set up annotation system
        self.annotation_manager = AnnotationManager()

        # Initialize tooltip manager for lazy loading
        self._tooltip_manager: Optional[TooltipManager] = None

        # Initialize chart synchronization support
        self._chart_group_id = chart_group_id
        self._chart_manager = chart_manager

        # Flag to force frontend re-initialization (for indicator/parameter changes)
        self.force_reinit: bool = False

        # Expose series list for backward compatibility
        self.series = self._series_manager.series

        # Process initial annotations if provided
        if annotations is not None:
            if not isinstance(annotations, list):
                raise TypeValidationError("annotations", "list")

            for annotation in annotations:
                if not isinstance(annotation, Annotation):
                    raise AnnotationItemsTypeError()
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
        return self._session_state_manager.get_stored_series_config(key, series_index, pane_id)

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
        self._series_manager.add_series(series, self._price_scale_manager)
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
        self._price_scale_manager.add_overlay_scale(scale_id, options)
        # Sync back to options for backward compatibility
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
        # Configure price scale manager for volume visualization
        self._price_scale_manager.configure_for_volume()

        # Delegate to series manager for actual series creation
        self._series_manager.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type=price_type,
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
            pane_id=pane_id,
            price_scale_manager=self._price_scale_manager,
        )

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
        self._trade_manager.add_trades(trades)
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
        # Get series configurations from SeriesManager
        series_configs = self._series_manager.to_frontend_configs()

        # Get base chart configuration
        chart_config = (
            self.options.asdict() if self.options is not None else ChartOptions().asdict()
        )

        # Get price scale configuration from PriceScaleManager
        price_scale_config = self._price_scale_manager.validate_and_serialize()
        chart_config.update(price_scale_config)

        # Get annotations configuration
        annotations_config = self.annotation_manager.asdict()

        # Get trades configuration from TradeManager
        trades_config = self._trade_manager.to_frontend_config(
            self.options.trade_visualization if self.options else None
        )

        # Get tooltip configurations
        tooltip_configs = None
        if self._tooltip_manager:
            tooltip_configs = {}
            for name, tooltip_config in self._tooltip_manager.configs.items():
                tooltip_configs[name] = tooltip_config.asdict()

        # Generate complete frontend configuration using ChartRenderer
        config = self._chart_renderer.generate_frontend_config(
            chart_id=f"chart-{id(self)}",
            chart_options=self.options,
            series_configs=series_configs,
            annotations_config=annotations_config,
            trades_config=trades_config,
            tooltip_configs=tooltip_configs,
            chart_group_id=self.chart_group_id,
            price_scale_config=price_scale_config,
        )

        # Add force_reinit flag if set
        if self.force_reinit:
            config["forceReinit"] = True

        return config

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
            unique_id = str(uuid.uuid4())[:8]
            key = f"chart_{int(time.time() * 1000)}_{unique_id}"

        # STEP 1: Reset config application flag for this render cycle
        self._session_state_manager.reset_config_applied_flag()

        # STEP 2: Load and apply stored configs IMMEDIATELY before any serialization
        stored_configs = self._session_state_manager.load_series_configs(key)
        if stored_configs:
            self._session_state_manager.apply_stored_configs_to_series(
                stored_configs,
                self.series,
            )

        # STEP 3: Generate chart configuration ONLY AFTER configs are applied
        config = self.to_frontend_config()

        # STEP 4: Render component using ChartRenderer (pass the validated key)
        result = self._chart_renderer.render(config, key, self.options)

        # STEP 5: Handle component return value and save series configs
        if result:
            self._chart_renderer.handle_response(
                result,
                key,
                self._session_state_manager,
            )

        return result

    def get_series_info_for_pane(self, _pane_id: int = 0) -> List[dict]:
        """Get series information for the series settings dialog.

        Args:
            pane_id: The pane ID to get series info for (default: 0)

        Returns:
            List of series information dictionaries
        """
        return self._series_manager.get_series_info_for_pane(_pane_id)

    def _convert_time_to_timestamp(self, time_value) -> Optional[float]:
        """Convert various time formats to timestamp.

        Delegates to ChartRenderer for backward compatibility with tests.

        Args:
            time_value: Time value in various formats.

        Returns:
            Timestamp in seconds or None if conversion fails.
        """
        return self._chart_renderer._convert_time_to_timestamp(time_value)

    def _calculate_data_timespan(self) -> Optional[float]:
        """Calculate the timespan of data across all series in seconds.

        Delegates to ChartRenderer for backward compatibility with tests.

        Returns:
            Timespan in seconds or None if unable to calculate.
        """
        try:
            series_configs = self._series_manager.to_frontend_configs()
            return self._chart_renderer._calculate_data_timespan(series_configs)
        except Exception:  # Catch TimeValidationError or any other error
            # Return None if unable to serialize data (e.g., invalid time values)
            return None

    def _get_range_seconds(self, range_config: Dict[str, Any]) -> Optional[float]:
        """Extract seconds from range configuration.

        Delegates to ChartRenderer for backward compatibility with tests.

        Args:
            range_config: Range configuration dictionary.

        Returns:
            Number of seconds in the range or None for "ALL".
        """
        return self._chart_renderer._get_range_seconds(range_config)
