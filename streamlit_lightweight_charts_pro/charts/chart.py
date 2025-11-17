"""Chart implementation for streamlit-lightweight-charts.

This module provides the Chart class, which is the primary chart type for displaying
financial data in a single pane. It supports multiple series types, annotations,
and comprehensive customization options with a fluent API for method chaining.

The Chart class serves as the main entry point for creating financial charts in
Streamlit applications. It orchestrates multiple managers to handle different
aspects of chart functionality:
    - SeriesManager: Manages multiple data series (line, candlestick, etc.)
    - PriceScaleManager: Handles price scale configuration and overlays
    - TradeManager: Manages trade visualization
    - SessionStateManager: Handles state persistence across renders
    - ChartRenderer: Handles rendering and frontend communication
    - AnnotationManager: Manages chart annotations and layers
    - TooltipManager: Handles custom tooltip configurations

Architecture:
    The Chart uses a manager-based architecture to separate concerns:

    Chart (Main Orchestrator)
    ├── SeriesManager (Data series management)
    ├── PriceScaleManager (Price scale configuration)
    ├── TradeManager (Trade visualization)
    ├── SessionStateManager (State persistence)
    ├── ChartRenderer (Rendering pipeline)
    ├── AnnotationManager (Annotations and layers)
    └── TooltipManager (Custom tooltips)

    This design provides:
    - Clear separation of concerns
    - Easy testing of individual components
    - Flexibility for future enhancements
    - Reduced complexity in the main Chart class

Example:
    Basic chart creation::

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

    Multi-series chart::

        from streamlit_lightweight_charts_pro import Chart, LineSeries, CandlestickSeries

        # Create chart with multiple series
        chart = Chart(series=[CandlestickSeries(ohlc_data), LineSeries(ma_data)])

        # Add more series dynamically
        chart.add_series(HistogramSeries(volume_data))

        # Render
        chart.render(key="multi_series_chart")

Note:
    The Chart class is designed to be immutable after creation in terms of
    its manager instances, but the chart configuration and data can be
    modified through the fluent API methods.
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

# Manager Imports - Chart functionality delegation
from streamlit_lightweight_charts_pro.charts.managers import (
    ChartRenderer,  # Handles rendering and frontend communication
    PriceScaleManager,  # Manages price scale configuration
    SeriesManager,  # Manages data series
    SessionStateManager,  # Handles state persistence
    TradeManager,  # Manages trade visualization
)

# Options and Series Imports
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

# Component Integration
from streamlit_lightweight_charts_pro.component import (
    get_component_func,
    reinitialize_component,
)

# Local Imports - Constants and Data Types
from streamlit_lightweight_charts_pro.constants import (
    HISTOGRAM_DOWN_COLOR_DEFAULT,
    HISTOGRAM_UP_COLOR_DEFAULT,
)
from streamlit_lightweight_charts_pro.data.annotation import (
    Annotation,
    AnnotationManager,
)
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.data.tooltip import TooltipConfig, TooltipManager
from streamlit_lightweight_charts_pro.data.trade import TradeData

# Exception Imports
from streamlit_lightweight_charts_pro.exceptions import (
    AnnotationItemsTypeError,
    ComponentNotAvailableError,
    PriceScaleIdTypeError,
    PriceScaleOptionsTypeError,
    SeriesItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)

# Utilities
from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    ColumnNames,
    PriceScaleMode,
)

# Type checking imports - only imported for type hints, not at runtime
if TYPE_CHECKING:
    from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
        PriceScaleOptions,
    )

# Initialize logger for this module
# Uses hierarchical naming: streamlit_lightweight_charts_pro.charts.chart
logger = get_logger(__name__)


class Chart:
    """Single pane chart for displaying financial data.

    This class represents a single pane chart that can display multiple
    series of financial data. It supports various chart types including
    candlestick, line, area, bar, and histogram series. The chart includes
    comprehensive annotation support, trade visualization, and method chaining
    for fluent API usage.

    The Chart class uses a manager-based architecture where each manager
    handles a specific aspect of chart functionality. This design provides
    clear separation of concerns and makes the codebase easier to maintain
    and extend.

    Attributes:
        series (List[Series]): List of series objects to display in the chart.
            This is exposed for backward compatibility and delegates to
            SeriesManager internally.
        options (ChartOptions): Chart configuration options including layout,
            grid, time scale, price scale, etc.
        annotation_manager (AnnotationManager): Manager for chart annotations
            and layers. Handles text, arrows, shapes, and other visual elements.
        force_reinit (bool): Flag to force frontend re-initialization. Set to
            True when indicator parameters or other settings change that require
            the chart to be completely rebuilt on the frontend.

    Private Attributes:
        _series_manager (SeriesManager): Manages all data series.
        _price_scale_manager (PriceScaleManager): Manages price scale config.
        _trade_manager (TradeManager): Manages trade visualization.
        _session_state_manager (SessionStateManager): Manages state persistence.
        _chart_renderer (ChartRenderer): Handles rendering pipeline.
        _tooltip_manager (Optional[TooltipManager]): Manages custom tooltips.
        _chart_group_id (int): Group ID for chart synchronization.
        _chart_manager (Optional[Any]): Reference to parent ChartManager.

    Example:
        Basic usage::

            # Create a simple line chart
            chart = Chart(series=LineSeries(data))

            # Configure options
            chart.update_options(height=400, width=800)

            # Render in Streamlit
            chart.render(key="my_chart")

        With method chaining::

            chart = (
                Chart(series=LineSeries(data))
                .update_options(height=400)
                .add_annotation(text_annotation)
                .add_series(candlestick_series)
            )
            chart.render()

        From DataFrame with price and volume::

            chart = Chart.from_price_volume_dataframe(
                df, column_mapping={"time": "timestamp", "open": "o", "high": "h"}, price_type="candlestick"
            )
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

        The initialization process:
            1. Set up chart options (use defaults if not provided)
            2. Initialize all managers for chart functionality
            3. Set up annotation system
            4. Configure chart synchronization
            5. Process initial annotations if provided

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
            Create empty chart::

                >>> chart = Chart()

            Create chart with single series::

                >>> chart = Chart(series=LineSeries(data))

            Create chart with multiple series::

                >>> chart = Chart(series=[line_series, candlestick_series])

            Create chart with custom options::

                >>> chart = Chart(
                ...     series=line_series,
                ...     options=ChartOptions(height=600, width=800)
                ... )

            Create chart with annotations::

                >>> chart = Chart(
                ...     series=line_series,
                ...     annotations=[text_ann, arrow_ann]
                ... )
        """
        # Step 1: Set up chart configuration
        # Use provided options or create default ChartOptions instance
        # ChartOptions contains all chart-level configuration like height,
        # width, layout, grid, time scale, price scale, etc.
        self.options = options or ChartOptions()

        # Step 2: Initialize managers for different chart functionalities
        # Each manager handles a specific aspect of chart behavior

        # SeriesManager: Manages all data series (line, candlestick, etc.)
        # Handles series validation, ordering, and serialization
        self._series_manager = SeriesManager(series)

        # PriceScaleManager: Manages price scale configuration
        # Handles left/right price scales and overlay price scales
        # Overlay scales are used for volume, indicators, etc.
        self._price_scale_manager = PriceScaleManager(
            left_price_scale=self.options.left_price_scale,
            right_price_scale=self.options.right_price_scale,
            overlay_price_scales=self.options.overlay_price_scales,
        )

        # TradeManager: Manages trade visualization
        # Converts TradeData objects to visual elements (markers, rectangles, etc.)
        self._trade_manager = TradeManager()

        # SessionStateManager: Handles state persistence across renders
        # Manages series configurations and user interactions
        # Stores data in Streamlit session state for persistence
        self._session_state_manager = SessionStateManager()

        # ChartRenderer: Handles the rendering pipeline
        # Converts chart configuration to frontend format
        # Manages component rendering and response handling
        # Takes reference to chart_manager for sync configuration
        self._chart_renderer = ChartRenderer(chart_manager_ref=chart_manager)

        # Step 3: Set up annotation system
        # AnnotationManager handles layers and annotation lifecycle
        # Supports multiple layers for organizing different annotation types
        self.annotation_manager = AnnotationManager()

        # Step 4: Initialize tooltip manager for lazy loading
        # TooltipManager is created on-demand when tooltips are configured
        # This avoids overhead for charts that don't use custom tooltips
        self._tooltip_manager: Optional[TooltipManager] = None

        # Step 5: Initialize chart synchronization support
        # Charts with same group_id are synchronized (crosshair, time range)
        # This is different from ChartManager's sync_group which manages
        # multiple charts
        self._chart_group_id = chart_group_id

        # Store reference to parent ChartManager (if this chart is managed)
        # Used to access sync configuration when rendering
        self._chart_manager = chart_manager

        # Step 6: Initialize force re-initialization flag
        # When True, forces frontend to completely rebuild the chart
        # Used when indicator parameters or other settings change
        # that can't be updated through normal data updates
        self.force_reinit: bool = False

        # Step 7: Expose series list for backward compatibility
        # This allows direct access to series: chart.series[0]
        # Internally delegates to SeriesManager
        self.series = self._series_manager.series

        # Step 8: Process initial annotations if provided
        if annotations is not None:
            # Validate that annotations is a list
            if not isinstance(annotations, list):
                raise TypeValidationError("annotations", "list")

            # Validate and add each annotation
            for annotation in annotations:
                # Ensure each item is an Annotation instance
                if not isinstance(annotation, Annotation):
                    raise AnnotationItemsTypeError()
                # Add to default annotation layer
                self.add_annotation(annotation)

    def get_stored_series_config(
        self,
        key: str,
        series_index: int = 0,
        pane_id: int = 0,
    ) -> Dict[str, Any]:
        """Get stored configuration for a specific series.

        Retrieves the stored configuration for a series from session state.
        This is useful for applying previously saved configurations when
        creating new series instances, enabling persistence of user
        customizations across renders.

        The stored configuration includes user-modified settings like:
            - Colors and styles
            - Line widths and types
            - Visibility settings
            - Other series-specific options

        Args:
            key: Component key used to namespace the stored configs. This should
                match the key used when rendering the chart.
            series_index: Index of the series (0-based). Defaults to 0.
            pane_id: Pane ID for the series. Defaults to 0. Useful for multi-pane
                charts where the same series index may exist in different panes.

        Returns:
            Dictionary of stored configuration or empty dict if none found.
            The dictionary keys match the series option property names.

        Example:
            Get and apply stored config::

                >>> # Get stored config for first series
                >>> config = chart.get_stored_series_config("my_chart", series_index=0)
                >>>
                >>> # Apply to new series
                >>> if config:
                ...     line_series = LineSeries(data)
                ...     if "color" in config:
                ...         line_series.line_options.color = config["color"]
                ...     if "lineWidth" in config:
                ...         line_series.line_options.line_width = config["lineWidth"]

            Restore all series configs::

                >>> for i, series in enumerate(chart.series):
                ...     config = chart.get_stored_series_config("my_chart", i)
                ...     if config:
                ...         apply_config_to_series(series, config)
        """
        # Delegate to SessionStateManager which handles the actual storage
        # SessionStateManager uses Streamlit's session_state for persistence
        return self._session_state_manager.get_stored_series_config(key, series_index, pane_id)

    def add_series(self, series: Series) -> "Chart":
        """Add a series to the chart.

        Adds a new series object to the chart's series list. The series will be
        displayed according to its type (line, candlestick, area, etc.) and
        configuration options. The method automatically handles price scale
        configuration for custom price scale IDs.

        When a series is added:
            1. Series is validated to ensure it's a Series instance
            2. SeriesManager adds it to the series list
            3. If series has custom price_scale_id, PriceScaleManager is notified
            4. Series is assigned a z-index for proper layering

        Args:
            series: Series object to add to the chart. Must be an instance of a
                Series subclass (LineSeries, CandlestickSeries, AreaSeries, etc.).

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeValidationError: If the series parameter is not an instance of Series.

        Example:
            Add a candlestick series::

                >>> chart.add_series(CandlestickSeries(ohlc_data))

            Add a line series with custom options::

                >>> from streamlit_lightweight_charts_pro.charts.series import LineOptions
                >>> line_options = LineOptions(color="red", line_width=2)
                >>> chart.add_series(LineSeries(data, line_options=line_options))

            Method chaining::

                >>> chart.add_series(line_series).add_series(candlestick_series)

            Add series with custom price scale::

                >>> # Series with custom price scale ID
                >>> volume_series = HistogramSeries(volume_data)
                >>> volume_series.price_scale_id = "volume"
                >>>
                >>> # Add overlay price scale configuration
                >>> chart.add_overlay_price_scale("volume", volume_scale_options)
                >>>
                >>> # Add the series
                >>> chart.add_series(volume_series)
        """
        # Delegate to SeriesManager which handles validation and storage
        # Also pass PriceScaleManager reference so it can be notified of
        # custom price scale IDs
        self._series_manager.add_series(series, self._price_scale_manager)

        # Return self to enable method chaining
        return self

    def update_options(self, **kwargs) -> "Chart":
        """Update chart options.

        Updates the chart's configuration options using keyword arguments.
        Only valid ChartOptions attributes will be updated; invalid attributes
        are silently ignored to support method chaining and forward compatibility.

        The method performs type checking to ensure new values match the
        expected types of the chart options. This prevents runtime errors
        from invalid configurations.

        Args:
            **kwargs: Chart options to update. Valid options include:
                - width (Optional[int]): Chart width in pixels
                - height (int): Chart height in pixels (default: 400)
                - auto_size (bool): Whether to auto-size the chart
                - handle_scroll (bool): Whether to enable scroll interactions
                - handle_scale (bool): Whether to enable scale interactions
                - add_default_pane (bool): Whether to add a default pane
                And many more options defined in ChartOptions class.

        Returns:
            Chart: Self for method chaining.

        Example:
            Update basic dimensions::

                >>> chart.update_options(height=600, width=800)

            Update interaction options::

                >>> chart.update_options(
                ...     handle_scroll=True,
                ...     handle_scale=False,
                ...     auto_size=True
                ... )

            Method chaining::

                >>> chart.update_options(height=500).update_options(width=1000)

            Update multiple options at once::

                >>> chart.update_options(
                ...     height=600,
                ...     width=1200,
                ...     auto_size=False,
                ...     handle_scroll=True
                ... )
        """
        # Process each keyword argument to update chart options
        for key, value in kwargs.items():
            # Step 1: Validate the option exists and value is not None
            # Check that the attribute exists on ChartOptions instance
            # and that the new value is not None (None values are ignored)
            if value is not None and hasattr(self.options, key):
                # Step 2: Get current attribute value for type checking
                # This helps ensure type consistency
                current_value = getattr(self.options, key)

                # Step 3: Validate type compatibility
                # Allow update if:
                # - New value type matches current value type, OR
                # - Current value is None and new value is not None
                #   (allows setting previously unset options)
                if isinstance(value, type(current_value)) or (
                    current_value is None and value is not None
                ):
                    # Update the attribute with the validated value
                    setattr(self.options, key, value)

            # Note: Invalid attributes and None values are silently ignored
            # This enables method chaining and forward compatibility

        # Return self for method chaining
        return self

    def add_annotation(self, annotation: Annotation, layer_name: str = "default") -> "Chart":
        """Add an annotation to the chart.

        Adds a single annotation to the specified annotation layer. If the layer
        doesn't exist, it will be created automatically. Annotations are visual
        elements like text, arrows, shapes, and lines that provide additional
        information or highlight specific points on the chart.

        Annotations are organized into layers for better management:
            - Each layer can contain multiple annotations
            - Layers can be shown/hidden independently
            - Layers can be cleared without affecting other layers
            - Default layer is used if no layer name is specified

        Args:
            annotation (Annotation): Annotation object to add to the chart.
                Must be a valid Annotation instance with proper configuration.
            layer_name (str, optional): Name of the annotation layer. Defaults
                to "default". Layer will be created if it doesn't exist.

        Returns:
            Chart: Self for method chaining.

        Raises:
            ValueValidationError: If annotation is None or layer_name is invalid.
            TypeValidationError: If annotation is not an Annotation instance.

        Example:
            Add text annotation::

                >>> from streamlit_lightweight_charts_pro.data.annotation import (
                ...     create_text_annotation
                ... )
                >>> text_ann = create_text_annotation(
                ...     "2024-01-01", 100, "Important Event"
                ... )
                >>> chart.add_annotation(text_ann)

            Add annotation to custom layer::

                >>> arrow_ann = create_arrow_annotation("2024-01-02", 105, "Signal")
                >>> chart.add_annotation(arrow_ann, layer_name="signals")

            Method chaining::

                >>> chart.add_annotation(text_ann).add_annotation(arrow_ann)

            Organize annotations by layer::

                >>> # Technical analysis annotations
                >>> chart.add_annotation(support_line, layer_name="ta")
                >>> chart.add_annotation(resistance_line, layer_name="ta")
                >>>
                >>> # Trading signals
                >>> chart.add_annotation(buy_signal, layer_name="signals")
                >>> chart.add_annotation(sell_signal, layer_name="signals")
        """
        # Step 1: Validate annotation is not None
        if annotation is None:
            raise ValueValidationError("annotation", "cannot be None")

        # Step 2: Validate annotation is an Annotation instance
        if not isinstance(annotation, Annotation):
            raise TypeValidationError("annotation", "Annotation instance")

        # Step 3: Handle layer name validation
        # Use default layer name if None is provided
        if layer_name is None:
            layer_name = "default"
        # Validate layer_name is a non-empty string
        elif not layer_name or not isinstance(layer_name, str):
            raise ValueValidationError("layer_name", "must be a non-empty string")

        # Step 4: Add annotation to the specified layer
        # AnnotationManager will create the layer if it doesn't exist
        self.annotation_manager.add_annotation(annotation, layer_name)

        # Return self for method chaining
        return self

    def add_annotations(
        self,
        annotations: List[Annotation],
        layer_name: str = "default",
    ) -> "Chart":
        """Add multiple annotations to the chart.

        Adds multiple annotation objects to the specified annotation layer. This
        is more efficient than calling add_annotation multiple times as it
        processes all annotations in a single operation and provides better
        performance for bulk annotation operations.

        All annotations are added to the same layer, enabling consistent
        management (show/hide/clear) of related annotations.

        Args:
            annotations (List[Annotation]): List of annotation objects to add
                to the chart. All must be valid Annotation instances.
            layer_name (str, optional): Name of the annotation layer. Defaults
                to "default". All annotations will be added to this layer.

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeValidationError: If annotations is not a list.
            ValueValidationError: If layer_name is invalid.
            AnnotationItemsTypeError: If any item in annotations is not an
                Annotation instance.

        Example:
            Add multiple annotations at once::

                >>> annotations = [
                ...     create_text_annotation("2024-01-01", 100, "Start"),
                ...     create_arrow_annotation("2024-01-02", 105, "Trend"),
                ...     create_shape_annotation("2024-01-03", 110, "rectangle"),
                ... ]
                >>> chart.add_annotations(annotations)

            Add to custom layer::

                >>> analysis_annotations = [support_line, resistance_line, trend_line]
                >>> chart.add_annotations(analysis_annotations, layer_name="analysis")

            Bulk operations with method chaining::

                >>> (chart
                ...  .add_annotations(ta_annotations, layer_name="ta")
                ...  .add_annotations(signal_annotations, layer_name="signals")
                ...  .update_options(height=600))
        """
        # Step 1: Validate annotations is not None
        if annotations is None:
            raise TypeValidationError("annotations", "list")

        # Step 2: Validate annotations is a list
        if not isinstance(annotations, list):
            raise TypeValidationError("annotations", "list")

        # Step 3: Validate layer_name
        if not layer_name or not isinstance(layer_name, str):
            raise ValueValidationError("layer_name", "must be a non-empty string")

        # Step 4: Validate and add each annotation
        for annotation in annotations:
            # Ensure each item is an Annotation instance
            if not isinstance(annotation, Annotation):
                raise AnnotationItemsTypeError()

            # Add the annotation to the specified layer
            # Reuses add_annotation logic for consistency
            self.add_annotation(annotation, layer_name)

        # Return self for method chaining
        return self

    def create_annotation_layer(self, name: str) -> "Chart":
        """Create a new annotation layer.

        Creates a new annotation layer with the specified name. Annotation layers
        allow you to organize and manage groups of annotations independently.
        Each layer can be shown, hidden, or cleared separately, providing
        flexible control over annotation visibility.

        Common use cases for layers:
            - Separate technical analysis from trading signals
            - Organize annotations by timeframe or strategy
            - Group annotations by type (text, arrows, shapes)
            - Enable/disable different annotation sets dynamically

        Args:
            name (str): Name of the annotation layer to create. Must be a
                non-empty string and should be unique.

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeValidationError: If name is None.
            ValueValidationError: If name is empty or not a string.

        Example:
            Create custom layers for different types of annotations::

                >>> chart.create_annotation_layer("signals")
                >>> chart.create_annotation_layer("analysis")
                >>> chart.create_annotation_layer("events")

            Method chaining::

                >>> (chart
                ...  .create_annotation_layer("layer1")
                ...  .create_annotation_layer("layer2")
                ...  .add_annotation(ann1, "layer1")
                ...  .add_annotation(ann2, "layer2"))

            Organize by strategy::

                >>> chart.create_annotation_layer("momentum_strategy")
                >>> chart.create_annotation_layer("mean_reversion_strategy")
                >>> # Add annotations specific to each strategy
        """
        # Step 1: Validate name is not None
        if name is None:
            raise TypeValidationError("name", "string")

        # Step 2: Validate name is a non-empty string
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")

        # Step 3: Create the layer in AnnotationManager
        # If layer already exists, this operation is idempotent
        self.annotation_manager.create_layer(name)

        # Return self for method chaining
        return self

    def hide_annotation_layer(self, name: str) -> "Chart":
        """Hide an annotation layer.

        Hides the specified annotation layer, making all annotations in that
        layer invisible on the chart. The layer and its annotations are preserved
        and can be shown again using show_annotation_layer. This is useful for
        temporarily hiding certain annotation groups without removing them.

        Hidden layers:
            - Remain in memory with all annotations intact
            - Can be shown again without re-adding annotations
            - Don't affect other layers' visibility
            - Are persisted across chart updates

        Args:
            name (str): Name of the annotation layer to hide.

        Returns:
            Chart: Self for method chaining.

        Raises:
            ValueValidationError: If name is empty or not a string.

        Example:
            Hide specific layers::

                >>> chart.hide_annotation_layer("analysis")
                >>> chart.hide_annotation_layer("signals")

            Method chaining::

                >>> (chart
                ...  .hide_annotation_layer("layer1")
                ...  .hide_annotation_layer("layer2")
                ...  .show_annotation_layer("layer3"))

            Toggle layer visibility::

                >>> # Hide analysis layer temporarily
                >>> chart.hide_annotation_layer("analysis")
                >>> # ... show chart without analysis
                >>> # Show analysis layer again
                >>> chart.show_annotation_layer("analysis")
        """
        # Step 1: Validate layer name
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")

        # Step 2: Hide the layer through AnnotationManager
        # If layer doesn't exist, this operation has no effect
        self.annotation_manager.hide_layer(name)

        # Return self for method chaining
        return self

    def show_annotation_layer(self, name: str) -> "Chart":
        """Show an annotation layer.

        Makes the specified annotation layer visible on the chart. This will
        display all annotations that were previously added to this layer.
        If the layer doesn't exist or is already visible, this method will
        have no effect.

        This is the counterpart to hide_annotation_layer and enables dynamic
        control over which annotation groups are visible.

        Args:
            name (str): Name of the annotation layer to show.

        Returns:
            Chart: Self for method chaining.

        Raises:
            ValueValidationError: If name is empty or not a string.

        Example:
            Show specific layers::

                >>> chart.show_annotation_layer("analysis")
                >>> chart.show_annotation_layer("signals")

            Method chaining::

                >>> (chart
                ...  .show_annotation_layer("layer1")
                ...  .show_annotation_layer("layer2")
                ...  .hide_annotation_layer("layer3"))

            Conditional visibility::

                >>> # Show different layers based on user selection
                >>> if show_technical_analysis:
                ...     chart.show_annotation_layer("ta")
                >>> if show_trading_signals:
                ...     chart.show_annotation_layer("signals")
        """
        # Step 1: Validate layer name
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")

        # Step 2: Show the layer through AnnotationManager
        # If layer doesn't exist, this operation has no effect
        self.annotation_manager.show_layer(name)

        # Return self for method chaining
        return self

    def clear_annotations(self, layer_name: Optional[str] = None) -> "Chart":
        """Clear annotations from the chart.

        Removes all annotations from the specified layer or from all layers if
        no layer name is provided. The layer itself is preserved and can be
        reused for new annotations. This is useful for refreshing annotations
        without recreating the entire chart.

        Clearing behavior:
            - With layer_name: Clears only that specific layer
            - Without layer_name: Does nothing (for backward compatibility)
            - Layer structure is preserved (can add new annotations)
            - Does not affect hidden/shown state of layers

        Args:
            layer_name (Optional[str]): Name of the layer to clear. If None,
                no action is taken. Defaults to None.

        Returns:
            Chart: Self for method chaining.

        Raises:
            ValueValidationError: If layer_name is not None and invalid.

        Example:
            Clear specific layer::

                >>> chart.clear_annotations("analysis")

            Clear all layers (provide None)::

                >>> chart.clear_annotations()  # No-op for backward compatibility

            Method chaining::

                >>> (chart
                ...  .clear_annotations("layer1")
                ...  .add_annotation(new_annotation, "layer1"))

            Refresh annotations::

                >>> # Clear old annotations and add new ones
                >>> chart.clear_annotations("signals")
                >>> for signal in new_signals:
                ...     chart.add_annotation(signal, "signals")
        """
        # Step 1: Validate layer_name if provided
        if layer_name is not None and (not layer_name or not isinstance(layer_name, str)):
            raise ValueValidationError("layer_name", "must be None or a non-empty string")

        # Step 2: Clear the specified layer
        if layer_name is not None:
            # Clear only the specified layer through AnnotationManager
            self.annotation_manager.clear_layer(layer_name)

        # Note: If layer_name is None, no action is taken
        # This maintains backward compatibility with existing code

        # Return self for method chaining
        return self

    def add_overlay_price_scale(self, scale_id: str, options: "PriceScaleOptions") -> "Chart":
        """Add or update a custom overlay price scale configuration.

        Adds or updates an overlay price scale configuration for the chart.
        Overlay price scales allow multiple series to share the same price axis
        while maintaining independent scaling and positioning. This is commonly
        used for volume bars, indicators, and other overlays.

        Overlay price scales enable:
            - Independent vertical positioning (scale margins)
            - Separate auto-scaling behavior
            - Different visibility settings
            - Custom formatting and precision

        Args:
            scale_id (str): The unique identifier for the custom price scale
                (e.g., 'volume', 'indicator1', 'overlay'). This ID is referenced
                by series that use this price scale.
            options (PriceScaleOptions): A PriceScaleOptions instance containing
                the configuration for the overlay price scale.

        Returns:
            Chart: Self for method chaining.

        Raises:
            PriceScaleIdTypeError: If scale_id is not a string.
            PriceScaleOptionsTypeError: If options is not a PriceScaleOptions instance.

        Example:
            Add volume overlay price scale::

                >>> from streamlit_lightweight_charts_pro.charts.options import (
                ...     PriceScaleOptions
                ... )
                >>> volume_scale = PriceScaleOptions(
                ...     visible=False,  # Hide the price scale itself
                ...     scale_margin_top=0.8,  # Volume takes bottom 20%
                ...     scale_margin_bottom=0,
                ...     overlay=True,  # Mark as overlay
                ...     auto_scale=True  # Auto-scale to data
                ... )
                >>> chart.add_overlay_price_scale('volume', volume_scale)

            Add indicator overlay::

                >>> indicator_scale = PriceScaleOptions(
                ...     visible=True,
                ...     scale_margin_top=0.7,
                ...     scale_margin_bottom=0.1,
                ...     overlay=True
                ... )
                >>> chart.add_overlay_price_scale('rsi', indicator_scale)

            Method chaining::

                >>> (chart
                ...  .add_overlay_price_scale('volume', volume_scale)
                ...  .add_series(volume_series))
        """
        # Step 1: Add overlay scale through PriceScaleManager
        # Manager validates scale_id and options internally
        self._price_scale_manager.add_overlay_scale(scale_id, options)

        # Step 2: Sync back to options for backward compatibility
        # This ensures options.overlay_price_scales is updated
        # Some legacy code may access overlay scales directly from options
        self.options.overlay_price_scales[scale_id] = options

        # Return self for method chaining
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
        series is displayed on a separate overlay price scale positioned at the
        bottom of the chart.

        This is a convenience method that:
            1. Configures the volume overlay price scale
            2. Creates price series (candlestick or line)
            3. Creates volume histogram series
            4. Adds both series to the chart

        Args:
            data (Union[Sequence[OhlcvData], pd.DataFrame]): OHLCV data containing
                price and volume information. Can be a sequence of OhlcvData objects
                or a pandas DataFrame.
            column_mapping (dict, optional): Mapping of column names for DataFrame
                conversion. Keys: "time", "open", "high", "low", "close", "volume".
                Defaults to None (assumes standard column names).
            price_type (str, optional): Type of price series to create. Options:
                "candlestick" or "line". Defaults to "candlestick".
            price_kwargs (dict, optional): Additional arguments for price series
                configuration (colors, line width, etc.). Defaults to None.
            volume_kwargs (dict, optional): Additional arguments for volume series
                configuration (colors, transparency, etc.). Defaults to None.
            pane_id (int, optional): Pane ID for both price and volume series.
                Defaults to 0. Used in multi-pane charts.

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeValidationError: If data type is invalid.
            ValueError: If column_mapping is invalid or required columns are missing.

        Example:
            Add candlestick with volume::

                >>> chart.add_price_volume_series(
                ...     ohlcv_data,
                ...     column_mapping={"time": "timestamp", "volume": "vol"},
                ...     price_type="candlestick"
                ... )

            Add line chart with custom volume colors::

                >>> chart.add_price_volume_series(
                ...     ohlcv_data,
                ...     price_type="line",
                ...     volume_kwargs={
                ...         "up_color": "rgba(0, 255, 0, 0.3)",
                ...         "down_color": "rgba(255, 0, 0, 0.3)"
                ...     }
                ... )

            From DataFrame::

                >>> df = pd.DataFrame({
                ...     'timestamp': [...],
                ...     'o': [...],
                ...     'h': [...],
                ...     'l': [...],
                ...     'c': [...],
                ...     'v': [...]
                ... })
                >>> chart.add_price_volume_series(
                ...     df,
                ...     column_mapping={
                ...         "time": "timestamp",
                ...         "open": "o",
                ...         "high": "h",
                ...         "low": "l",
                ...         "close": "c",
                ...         "volume": "v"
                ...     }
                ... )
        """
        # Step 1: Configure price scale manager for volume visualization
        # This sets up the overlay price scale with proper margins
        # Volume typically occupies the bottom 20% of the chart
        self._price_scale_manager.configure_for_volume()

        # Step 2: Delegate to series manager for actual series creation
        # SeriesManager handles:
        # - Data conversion (DataFrame to OhlcvData if needed)
        # - Price series creation (candlestick or line)
        # - Volume histogram series creation
        # - Series configuration from kwargs
        # - Adding both series to the chart
        self._series_manager.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type=price_type,
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
            pane_id=pane_id,
            price_scale_manager=self._price_scale_manager,
        )

        # Return self for method chaining
        return self

    def add_trades(self, trades: List[TradeData]) -> "Chart":
        """Add trade visualization to the chart.

        Converts TradeData objects to visual elements and adds them to the chart
        for visualization. Each trade is displayed with entry/exit markers,
        connecting lines, profit/loss rectangles, or zones based on the
        TradeVisualizationOptions.style configuration.

        Trade visualization styles:
            - "markers": Entry and exit markers only
            - "rectangle": Filled rectangle between entry and exit
            - "line": Simple line connecting entry to exit
            - "arrow": Arrow from entry to exit
            - "zone": Highlighted zone with transparency

        The visualization automatically color-codes trades:
            - Green/profit color for winning trades
            - Red/loss color for losing trades
            - Customizable through TradeVisualizationOptions

        Args:
            trades (List[TradeData]): List of TradeData objects to visualize
                on the chart. Each trade must have entry_time, entry_price,
                exit_time, exit_price, and trade_type.

        Returns:
            Chart: Self for method chaining.

        Example:
            Add basic trade visualization::

                >>> from streamlit_lightweight_charts_pro.data import TradeData
                >>> from streamlit_lightweight_charts_pro.type_definitions.enums import (
                ...     TradeType
                ... )
                >>> trades = [
                ...     TradeData(
                ...         entry_time="2024-01-01 10:00:00",
                ...         entry_price=100.0,
                ...         exit_time="2024-01-01 15:00:00",
                ...         exit_price=105.0,
                ...         quantity=100,
                ...         trade_type=TradeType.LONG,
                ...     )
                ... ]
                >>> chart.add_trades(trades)

            With custom visualization::

                >>> from streamlit_lightweight_charts_pro.data.trade import (
                ...     TradeVisualizationOptions
                ... )
                >>> # Configure trade visualization
                >>> chart.options.trade_visualization = TradeVisualizationOptions(
                ...     style="rectangle",
                ...     profit_color="rgba(0, 255, 0, 0.2)",
                ...     loss_color="rgba(255, 0, 0, 0.2)"
                ... )
                >>> chart.add_trades(trades)

            Method chaining::

                >>> (chart
                ...  .add_trades(trades)
                ...  .update_options(height=600))
        """
        # Delegate to TradeManager which handles:
        # - Trade validation
        # - Conversion to visual elements (markers, rectangles, etc.)
        # - Profit/loss calculations
        # - Color coding based on trade outcome
        # - Annotation creation for visualization
        self._trade_manager.add_trades(trades)

        # Return self for method chaining
        return self

    def set_tooltip_manager(self, tooltip_manager) -> "Chart":
        """Set the tooltip manager for the chart.

        Assigns a TooltipManager instance to handle custom tooltip functionality.
        Tooltips provide additional information when hovering over chart elements.

        Args:
            tooltip_manager: TooltipManager instance to handle tooltip functionality.

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeValidationError: If tooltip_manager is not a TooltipManager instance.

        Example:
            Set custom tooltip manager::

                >>> from streamlit_lightweight_charts_pro.data.tooltip import (
                ...     TooltipManager
                ... )
                >>> manager = TooltipManager()
                >>> chart.set_tooltip_manager(manager)
        """
        # Validate tooltip_manager is a TooltipManager instance
        if not isinstance(tooltip_manager, TooltipManager):
            raise TypeValidationError("tooltip_manager", "TooltipManager instance")

        # Assign the tooltip manager
        self._tooltip_manager = tooltip_manager

        # Return self for method chaining
        return self

    def add_tooltip_config(self, name: str, config) -> "Chart":
        """Add a tooltip configuration to the chart.

        Adds a named tooltip configuration that defines how tooltips should
        be displayed for specific data points or series. Multiple tooltip
        configurations can be registered and used selectively.

        Args:
            name: Name for the tooltip configuration (unique identifier).
            config: TooltipConfig instance defining tooltip appearance and behavior.

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeValidationError: If config is not a TooltipConfig instance.

        Example:
            Add custom tooltip configuration::

                >>> from streamlit_lightweight_charts_pro.data.tooltip import (
                ...     TooltipConfig
                ... )
                >>> config = TooltipConfig(
                ...     title="Price Info",
                ...     show_time=True,
                ...     show_value=True
                ... )
                >>> chart.add_tooltip_config("price_tooltip", config)
        """
        # Validate config is a TooltipConfig instance
        if not isinstance(config, TooltipConfig):
            raise TypeValidationError("config", "TooltipConfig instance")

        # Lazy-load tooltip manager if not already set
        # This avoids creating TooltipManager until actually needed
        if self._tooltip_manager is None:
            self._tooltip_manager = TooltipManager()

        # Add the configuration to the tooltip manager
        self._tooltip_manager.add_config(name, config)

        # Return self for method chaining
        return self

    def set_chart_group_id(self, group_id: int) -> "Chart":
        """Set the chart group ID for synchronization.

        Sets the chart group ID which is used for synchronizing multiple charts.
        Charts with the same group_id will be synchronized with each other,
        sharing crosshair position and time range changes.

        Note:
            This is different from ChartManager's sync_group which manages
            synchronization at a higher level. chart_group_id is used for
            individual chart synchronization, while sync_group is used for
            managing groups of charts in ChartManager.

        Args:
            group_id (int): Group ID for synchronization. Charts with the same
                group_id will be synchronized.

        Returns:
            Chart: Self for method chaining.

        Raises:
            TypeValidationError: If group_id is not an integer.

        Example:
            Set chart group ID::

                >>> chart1.set_chart_group_id(1)
                >>> chart2.set_chart_group_id(1)  # Will sync with chart1

            Disable synchronization::

                >>> chart.set_chart_group_id(0)  # Group 0 = no sync
        """
        # Use property setter which includes validation
        self.chart_group_id = group_id

        # Return self for method chaining
        return self

    @property
    def chart_group_id(self) -> int:
        """Get the chart group ID for synchronization.

        Returns the current chart group ID used for synchronization.

        Returns:
            int: The chart group ID.

        Example:
            Get chart group ID::

                >>> group_id = chart.chart_group_id
                >>> print(f"Chart is in sync group: {group_id}")
        """
        # Return the internal chart group ID
        return self._chart_group_id

    @chart_group_id.setter
    def chart_group_id(self, group_id: int) -> None:
        """Set the chart group ID for synchronization.

        Sets the chart group ID with validation.

        Args:
            group_id (int): Group ID for synchronization.

        Raises:
            TypeValidationError: If group_id is not an integer.

        Example:
            Set chart group ID via property::

                >>> chart.chart_group_id = 1
        """
        # Validate group_id is an integer
        if not isinstance(group_id, int):
            raise TypeValidationError("chart_group_id", "integer")

        # Set the internal chart group ID
        self._chart_group_id = group_id

    def to_frontend_config(self) -> Dict[str, Any]:
        """Convert chart to frontend configuration dictionary.

        Converts the chart and all its components (series, options, annotations,
        trades, tooltips) to a dictionary format suitable for frontend consumption.
        This method orchestrates the serialization of all chart elements.

        The serialization process:
            1. Get series configurations from SeriesManager
            2. Get base chart options
            3. Get price scale configuration from PriceScaleManager
            4. Get annotations configuration from AnnotationManager
            5. Get trades configuration from TradeManager
            6. Get tooltip configurations from TooltipManager (if set)
            7. Generate complete frontend config using ChartRenderer
            8. Add force_reinit flag if set

        Returns:
            Dict[str, Any]: Complete chart configuration ready for frontend
                rendering. The configuration includes:
                - charts: List of chart objects with series and options
                - syncConfig: Synchronization settings for multi-chart layouts
                - annotations: Annotation layers and elements
                - trades: Trade visualization elements
                - tooltips: Custom tooltip configurations

        Note:
            Series are automatically ordered by z-index within each pane to ensure
            proper layering in the frontend. Series with lower z-index values
            render behind series with higher z-index values.

        Example:
            Get frontend configuration::

                >>> config = chart.to_frontend_config()
                >>> print(json.dumps(config, indent=2))

            Access specific parts::

                >>> config = chart.to_frontend_config()
                >>> chart_config = config["charts"][0]
                >>> series_config = chart_config["series"]
                >>> options_config = chart_config["chart"]
        """
        # Step 1: Get series configurations from SeriesManager
        # SeriesManager handles series ordering by z-index and pane
        series_configs = self._series_manager.to_frontend_configs()

        # Step 2: Get base chart configuration from ChartOptions
        # Convert ChartOptions to dictionary for frontend
        chart_config = (
            self.options.asdict() if self.options is not None else ChartOptions().asdict()
        )

        # Step 3: Get price scale configuration from PriceScaleManager
        # Manager validates scales and returns serialized configuration
        price_scale_config = self._price_scale_manager.validate_and_serialize()
        # Merge price scale config into chart config
        chart_config.update(price_scale_config)

        # Step 4: Get annotations configuration from AnnotationManager
        # Converts all annotation layers to frontend format
        annotations_config = self.annotation_manager.asdict()

        # Step 5: Get trades configuration from TradeManager
        # Converts TradeData objects to visual elements
        # Uses trade_visualization options from chart options
        trades_config = self._trade_manager.to_frontend_config(
            self.options.trade_visualization if self.options else None
        )

        # Step 6: Get tooltip configurations from TooltipManager
        tooltip_configs = None
        if self._tooltip_manager:
            # Convert each tooltip config to dictionary
            tooltip_configs = {}
            for name, tooltip_config in self._tooltip_manager.configs.items():
                tooltip_configs[name] = tooltip_config.asdict()

        # Step 7: Generate complete frontend configuration using ChartRenderer
        # ChartRenderer assembles all components into final configuration
        config = self._chart_renderer.generate_frontend_config(
            chart_id=f"chart-{id(self)}",  # Unique ID based on object ID
            chart_options=self.options,
            series_configs=series_configs,
            annotations_config=annotations_config,
            trades_config=trades_config,
            tooltip_configs=tooltip_configs,
            chart_group_id=self.chart_group_id,
            price_scale_config=price_scale_config,
        )

        # Step 8: Add force_reinit flag if set
        # This tells frontend to completely rebuild the chart
        # Used when indicator parameters or other settings change
        if self.force_reinit:
            config["forceReinit"] = True

        # Return the complete frontend configuration
        return config

    def render(self, key: Optional[str] = None) -> Any:
        """Render the chart in Streamlit.

        Converts the chart to frontend configuration and renders it using the
        Streamlit component. This is the final step in the chart creation process
        that displays the interactive chart in the Streamlit application.

        The rendering process follows these steps:
            1. Generate or validate component key
            2. Reset config application flag for this render cycle
            3. Load and apply stored series configurations from session state
            4. Generate frontend configuration (after configs applied)
            5. Render component using ChartRenderer
            6. Handle component response and save updated series configs

        The chart configuration is generated fresh on each render, allowing users
        to control chart lifecycle and state management in their own code if needed.

        Args:
            key (Optional[str]): Optional unique key for the Streamlit component.
                This key is used to identify the component instance and is useful
                for debugging and component state management. If not provided,
                a unique key will be generated automatically using timestamp and UUID.

        Returns:
            Any: The rendered Streamlit component that displays the interactive chart.
                May contain user interaction data if the frontend sends responses.

        Example:
            Basic rendering::

                >>> chart.render()

            Rendering with custom key::

                >>> chart.render(key="my_chart")

            Method chaining with rendering::

                >>> (chart
                ...  .add_series(line_series)
                ...  .update_options(height=600)
                ...  .render(key="chart1"))

            User-managed state (advanced)::

                >>> # Store chart in session state for persistence
                >>> if "my_chart" not in st.session_state:
                ...     st.session_state.my_chart = Chart(series=LineSeries(data))
                >>>
                >>> # Render the persisted chart
                >>> st.session_state.my_chart.render(key="persistent_chart")

            Dynamic key generation::

                >>> # Key includes timestamp for uniqueness
                >>> import time
                >>> chart.render(key=f"chart_{int(time.time())}")
        """
        # STEP 1: Generate a unique key if none provided or if it's invalid
        if key is None or not isinstance(key, str) or not key.strip():
            # Create unique identifier using timestamp and UUID
            unique_id = str(uuid.uuid4())[:8]  # First 8 chars of UUID
            timestamp = int(time.time() * 1000)  # Milliseconds since epoch
            key = f"chart_{timestamp}_{unique_id}"

        # STEP 2: Reset config application flag for this render cycle
        # This ensures configs are only applied once per render
        # Prevents duplicate application of stored configurations
        self._session_state_manager.reset_config_applied_flag()

        # STEP 3: Load and apply stored configs IMMEDIATELY before serialization
        # This is critical: we must apply user-modified configs BEFORE
        # generating the frontend configuration, otherwise the configs
        # won't be included in the serialized data
        stored_configs = self._session_state_manager.load_series_configs(key)
        if stored_configs:
            # Apply stored configs to all series
            # This updates series options with user-modified settings
            self._session_state_manager.apply_stored_configs_to_series(
                stored_configs,
                self.series,  # Current series list
            )

        # STEP 4: Generate chart configuration ONLY AFTER configs are applied
        # This ensures the frontend config includes all user modifications
        # The to_frontend_config() method serializes all chart components
        config = self.to_frontend_config()

        # STEP 5: Render component using ChartRenderer
        # ChartRenderer handles:
        # - Component function retrieval
        # - Configuration serialization to JSON
        # - Component rendering through Streamlit
        # - Error handling if component is unavailable
        result = self._chart_renderer.render(config, key, self.options)

        # STEP 6: Handle component return value and save series configs
        # The frontend may send back user interactions or config changes
        if result:
            # ChartRenderer processes the response and updates session state
            # This includes saving any user-modified series configurations
            self._chart_renderer.handle_response(
                result,
                key,
                self._session_state_manager,
            )

        # Return the component result
        # This may contain user interaction data or None
        return result

    def get_series_info_for_pane(self, _pane_id: int = 0) -> List[dict]:
        """Get series information for the series settings dialog.

        Retrieves information about all series in a specific pane. This is
        used by the series settings dialog to display available series and
        their current configurations.

        Args:
            _pane_id: The pane ID to get series info for (default: 0).

        Returns:
            List of series information dictionaries containing:
                - series_index: Index of the series
                - series_type: Type of series (line, candlestick, etc.)
                - series_name: Display name of the series
                - current_config: Current series configuration

        Example:
            Get series info::

                >>> series_info = chart.get_series_info_for_pane(pane_id=0)
                >>> for info in series_info:
                ...     print(f"{info['series_name']}: {info['series_type']}")
        """
        # Delegate to SeriesManager which has access to all series data
        return self._series_manager.get_series_info_for_pane(_pane_id)

    def _convert_time_to_timestamp(self, time_value) -> Optional[float]:
        """Convert various time formats to timestamp.

        Delegates to ChartRenderer for backward compatibility with tests.
        This method supports conversion from various time formats (datetime,
        string, timestamp) to UNIX timestamp in seconds.

        Args:
            time_value: Time value in various formats (datetime, string, int, float).

        Returns:
            Timestamp in seconds or None if conversion fails.

        Note:
            This is an internal method used by ChartRenderer and exposed
            for backward compatibility with existing tests.
        """
        # Delegate to ChartRenderer's conversion logic
        return self._chart_renderer._convert_time_to_timestamp(time_value)

    def _calculate_data_timespan(self) -> Optional[float]:
        """Calculate the timespan of data across all series in seconds.

        Delegates to ChartRenderer for backward compatibility with tests.
        Calculates the total time range covered by all series data,
        which is used for auto-ranging and time scale configuration.

        Returns:
            Timespan in seconds or None if unable to calculate.
            None may be returned if:
                - No series have data
                - Time values are invalid
                - Serialization fails

        Note:
            This is an internal method used by ChartRenderer and exposed
            for backward compatibility with existing tests.
        """
        try:
            # Get series configurations which include time data
            series_configs = self._series_manager.to_frontend_configs()

            # Delegate to ChartRenderer to calculate timespan
            return self._chart_renderer._calculate_data_timespan(series_configs)
        except Exception:
            # Catch any error during serialization or calculation
            # Return None if unable to calculate (invalid time values, etc.)
            return None

    def _get_range_seconds(self, range_config: Dict[str, Any]) -> Optional[float]:
        """Extract seconds from range configuration.

        Delegates to ChartRenderer for backward compatibility with tests.
        Converts a range configuration (e.g., {"days": 7}) to total seconds.

        Args:
            range_config: Range configuration dictionary with time units.
                Example: {"days": 7, "hours": 12}

        Returns:
            Number of seconds in the range or None for "ALL" range.

        Note:
            This is an internal method used by ChartRenderer and exposed
            for backward compatibility with existing tests.
        """
        # Delegate to ChartRenderer's range calculation logic
        return self._chart_renderer._get_range_seconds(range_config)
