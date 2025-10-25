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
from typing import Any, Dict, List, Optional, Sequence, Union

# Third Party Imports
import pandas as pd

# Local Imports
from streamlit_lightweight_charts_pro.charts.managers.chart_renderer import ChartRenderer
from streamlit_lightweight_charts_pro.charts.managers.price_scale_manager import PriceScaleManager
from streamlit_lightweight_charts_pro.charts.managers.series_manager import SeriesManager
from streamlit_lightweight_charts_pro.charts.managers.session_state_manager import SessionStateManager
from streamlit_lightweight_charts_pro.charts.managers.trade_manager import TradeManager
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.charts.series import Series
from streamlit_lightweight_charts_pro.data.annotation import Annotation, AnnotationManager
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.data.tooltip import TooltipConfig, TooltipManager
from streamlit_lightweight_charts_pro.data.trade import TradeData
from streamlit_lightweight_charts_pro.exceptions import (
    AnnotationItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from streamlit_lightweight_charts_pro.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)


class Chart:
    """Single pane chart for displaying financial data.

    This class represents a single pane chart that can display multiple
    series of financial data. It supports various chart types including
    candlestick, line, area, bar, and histogram series. The chart includes
    comprehensive annotation support, trade visualization, and method chaining
    for fluent API usage.

    The Chart class uses specialized manager classes to handle different
    responsibilities:
    - SeriesManager: Manages series operations
    - PriceScaleManager: Manages price scale configuration
    - TradeManager: Manages trade visualization
    - SessionStateManager: Manages session state persistence
    - ChartRenderer: Manages rendering and frontend configuration
    - AnnotationManager: Manages annotations and layers
    - TooltipManager: Manages tooltip functionality

    Attributes:
        series_manager (SeriesManager): Manager for series operations.
        price_scale_manager (PriceScaleManager): Manager for price scale configuration.
        trade_manager (TradeManager): Manager for trade visualization.
        session_state_manager (SessionStateManager): Manager for session state.
        chart_renderer (ChartRenderer): Manager for rendering.
        annotation_manager (AnnotationManager): Manager for chart annotations.
        options (ChartOptions): Chart configuration options.

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
        # Initialize managers
        self.series_manager = SeriesManager(series)
        self.price_scale_manager = PriceScaleManager()
        self.trade_manager = TradeManager()
        self.session_state_manager = SessionStateManager()
        self.chart_renderer = ChartRenderer()
        self.annotation_manager = AnnotationManager()

        # Set up chart configuration
        self.options = options or ChartOptions()

        # Initialize chart synchronization support
        self._chart_group_id = chart_group_id

        # Store ChartManager reference for retrieving sync settings
        self._chart_manager = chart_manager

        # Initialize tooltip manager for lazy loading
        self._tooltip_manager: Optional[TooltipManager] = None

        # Process initial annotations if provided
        if annotations is not None:
            if not isinstance(annotations, list):
                raise TypeValidationError("annotations", "list")

            for annotation in annotations:
                if not isinstance(annotation, Annotation):
                    raise AnnotationItemsTypeError()
                self.add_annotation(annotation)

    # ============================================================================
    # PROPERTY ACCESSORS (for backwards compatibility)
    # ============================================================================

    @property
    def series(self) -> List[Series]:
        """Get the list of series.

        Returns:
            List of Series objects.
        """
        return self.series_manager.series

    @series.setter
    def series(self, value: List[Series]) -> None:
        """Set the list of series.

        Args:
            value: List of Series objects.
        """
        self.series_manager.series = value

    # ============================================================================
    # SESSION STATE METHODS
    # ============================================================================

    def get_stored_series_config(
        self,
        key: str,
        series_index: int = 0,
        pane_id: int = 0,
    ) -> Dict[str, Any]:
        """Get stored configuration for a specific series.

        Args:
            key: Component key used to namespace the stored configs.
            series_index: Index of the series (default: 0).
            pane_id: Pane ID for the series (default: 0).

        Returns:
            Dictionary of stored configuration or empty dict if none found.
        """
        return self.session_state_manager.get_stored_series_config(key, series_index, pane_id)

    # ============================================================================
    # SERIES METHODS
    # ============================================================================

    def add_series(self, series: Series) -> "Chart":
        """Add a series to the chart.

        Args:
            series: Series object to add to the chart.

        Returns:
            Chart: Self for method chaining.
        """
        self.series_manager.add_series(
            series,
            overlay_price_scales=self.options.overlay_price_scales,
        )
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

        Args:
            data: OHLCV data containing price and volume information.
            column_mapping: Mapping of column names for DataFrame conversion.
            price_type: Type of price series ('candlestick' or 'line').
            price_kwargs: Additional arguments for price series configuration.
            volume_kwargs: Additional arguments for volume series configuration.
            pane_id: Pane ID for both price and volume series.

        Returns:
            Chart: Self for method chaining.
        """
        self.series_manager.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type=price_type,
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
            pane_id=pane_id,
            right_price_scale=self.options.right_price_scale,
            on_add_overlay_price_scale=self.price_scale_manager.add_overlay_price_scale,
        )
        return self

    # ============================================================================
    # CHART OPTIONS METHODS
    # ============================================================================

    def update_options(self, **kwargs) -> "Chart":
        """Update chart options.

        Args:
            **kwargs: Chart options to update.

        Returns:
            Chart: Self for method chaining.
        """
        for key, value in kwargs.items():
            if value is not None and hasattr(self.options, key):
                current_value = getattr(self.options, key)
                if isinstance(value, type(current_value)) or (
                    current_value is None and value is not None
                ):
                    setattr(self.options, key, value)
        return self

    # ============================================================================
    # ANNOTATION METHODS
    # ============================================================================

    def add_annotation(self, annotation: Annotation, layer_name: str = "default") -> "Chart":
        """Add an annotation to the chart.

        Args:
            annotation: Annotation object to add to the chart.
            layer_name: Name of the annotation layer.

        Returns:
            Chart: Self for method chaining.
        """
        if annotation is None:
            raise ValueValidationError("annotation", "cannot be None")
        if not isinstance(annotation, Annotation):
            raise TypeValidationError("annotation", "Annotation instance")

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

        Args:
            annotations: List of annotation objects to add to the chart.
            layer_name: Name of the annotation layer.

        Returns:
            Chart: Self for method chaining.
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

        Args:
            name: Name of the annotation layer to create.

        Returns:
            Chart: Self for method chaining.
        """
        if name is None:
            raise TypeValidationError("name", "string")
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.create_layer(name)
        return self

    def hide_annotation_layer(self, name: str) -> "Chart":
        """Hide an annotation layer.

        Args:
            name: Name of the annotation layer to hide.

        Returns:
            Chart: Self for method chaining.
        """
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.hide_layer(name)
        return self

    def show_annotation_layer(self, name: str) -> "Chart":
        """Show an annotation layer.

        Args:
            name: Name of the annotation layer to show.

        Returns:
            Chart: Self for method chaining.
        """
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.show_layer(name)
        return self

    def clear_annotations(self, layer_name: Optional[str] = None) -> "Chart":
        """Clear annotations from the chart.

        Args:
            layer_name: Name of the layer to clear. If None, clears all layers.

        Returns:
            Chart: Self for method chaining.
        """
        if layer_name is not None and (not layer_name or not isinstance(layer_name, str)):
            raise ValueValidationError("layer_name", "must be None or a non-empty string")
        if layer_name is not None:
            self.annotation_manager.clear_layer(layer_name)
        return self

    # ============================================================================
    # PRICE SCALE METHODS
    # ============================================================================

    def add_overlay_price_scale(self, scale_id: str, options: "PriceScaleOptions") -> "Chart":
        """Add or update a custom overlay price scale configuration.

        Args:
            scale_id: The unique identifier for the custom price scale.
            options: A PriceScaleOptions instance containing the configuration.

        Returns:
            Chart: Self for method chaining.
        """
        self.price_scale_manager.add_overlay_price_scale(scale_id, options)
        # Also update chart options for backwards compatibility
        self.options.overlay_price_scales[scale_id] = options
        return self

    # ============================================================================
    # TRADE METHODS
    # ============================================================================

    def add_trades(self, trades: List[TradeData]) -> "Chart":
        """Add trade visualization to the chart.

        Args:
            trades: List of TradeData objects to visualize on the chart.

        Returns:
            Chart: Self for method chaining.
        """
        self.trade_manager.add_trades(trades)
        return self

    # ============================================================================
    # TOOLTIP METHODS
    # ============================================================================

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

    # ============================================================================
    # CHART GROUP ID METHODS
    # ============================================================================

    def set_chart_group_id(self, group_id: int) -> "Chart":
        """Set the chart group ID for synchronization.

        Args:
            group_id: Group ID for synchronization.

        Returns:
            Chart: Self for method chaining.
        """
        self.chart_group_id = group_id
        return self

    @property
    def chart_group_id(self) -> int:
        """Get the chart group ID for synchronization.

        Returns:
            The chart group ID.
        """
        return self._chart_group_id

    @chart_group_id.setter
    def chart_group_id(self, group_id: int) -> None:
        """Set the chart group ID for synchronization.

        Args:
            group_id: Group ID for synchronization.
        """
        if not isinstance(group_id, int):
            raise TypeValidationError("chart_group_id", "integer")
        self._chart_group_id = group_id

    # ============================================================================
    # RENDERING METHODS
    # ============================================================================

    def to_frontend_config(self) -> Dict[str, Any]:
        """Convert chart to frontend configuration dictionary.

        Returns:
            Complete chart configuration ready for frontend rendering.
        """
        series_configs = self.series_manager.get_all_series_configs()
        trades_config = self.trade_manager.get_trades_config()

        return self.chart_renderer.to_frontend_config(
            series_configs=series_configs,
            chart_options=self.options,
            annotation_manager=self.annotation_manager,
            tooltip_manager=self._tooltip_manager,
            trades_config=trades_config,
            chart_group_id=self.chart_group_id,
            chart_manager=self._chart_manager,
        )

    def render(self, key: Optional[str] = None) -> Any:
        """Render the chart in Streamlit.

        Args:
            key: Optional unique key for the Streamlit component.

        Returns:
            The rendered Streamlit component that displays the interactive chart.
        """
        # Reset config application flag for this render cycle
        self.session_state_manager.reset_config_application_flag()

        # Load and apply stored configs IMMEDIATELY before any serialization
        stored_configs = self.session_state_manager.load_series_configs(key)
        if stored_configs:
            self.session_state_manager.apply_stored_configs_to_series(
                stored_configs,
                self.series_manager.series,
            )

        # Generate chart configuration ONLY AFTER configs are applied
        config = self.to_frontend_config()

        # Define callbacks for the renderer
        def on_series_config_changes(changes):
            """Handle series config changes from frontend."""
            # Build a dictionary of all current series configs
            series_configs = {}
            for change in changes:
                series_id = change.get("seriesId")
                config = change.get("config")
                if series_id and config:
                    series_configs[series_id] = config

            # Save to session state
            if series_configs:
                self.session_state_manager.save_series_configs(key, series_configs)

        def on_handle_series_settings_response(response, series_api):
            """Handle series settings API responses."""
            self.chart_renderer.handle_series_settings_response(response, series_api)

        # Render using chart renderer
        return self.chart_renderer.render(
            config=config,
            chart_options=self.options,
            key=key,
            on_series_config_changes=on_series_config_changes,
            on_handle_series_settings_response=on_handle_series_settings_response,
        )

    # ============================================================================
    # HELPER METHODS
    # ============================================================================

    def get_series_info_for_pane(self, pane_id: int = 0) -> List[dict]:
        """Get series information for the series settings dialog.

        Args:
            pane_id: The pane ID to get series info for (default: 0).

        Returns:
            List of series information dictionaries.
        """
        return self.series_manager.get_series_info_for_pane(pane_id)
