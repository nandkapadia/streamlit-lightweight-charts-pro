"""Base Chart implementation for lightweight-charts-core.

This module provides the BaseChart class containing all framework-agnostic chart logic.
Framework-specific implementations (Streamlit, FastAPI, etc.) should extend this class
and add their rendering capabilities.
"""

from collections.abc import Sequence
from typing import TYPE_CHECKING, Any

import pandas as pd
from lightweight_charts_core.charts.managers import (
    PriceScaleManager,
    SeriesManager,
    TradeManager,
)
from lightweight_charts_core.charts.options import ChartOptions
from lightweight_charts_core.charts.series import Series
from lightweight_charts_core.data import (
    Annotation,
    AnnotationManager,
    OhlcvData,
    TooltipConfig,
    TooltipManager,
    TradeData,
)
from lightweight_charts_core.exceptions import (
    AnnotationItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.logging_config import get_logger

if TYPE_CHECKING:
    from lightweight_charts_core.charts.options.price_scale_options import (
        PriceScaleOptions,
    )

logger = get_logger(__name__)


class BaseChart:
    """Base chart class with framework-agnostic logic.

    This class contains all the core chart logic for managing series, annotations,
    price scales, trades, and tooltips. Framework-specific implementations should
    extend this class and add rendering capabilities.

    Attributes:
        series: List of series objects to display in the chart.
        options: Chart configuration options.
        annotation_manager: Manager for chart annotations and layers.

    """

    def __init__(
        self,
        series: Series | list[Series] | None = None,
        options: ChartOptions | None = None,
        annotations: list[Annotation] | None = None,
        chart_group_id: int = 0,
    ):
        """Initialize a base chart.

        Args:
            series: Optional single series or list of series to display.
            options: Optional chart configuration options.
            annotations: Optional list of annotations to add.
            chart_group_id: Group ID for synchronization.

        """
        self.options = options or ChartOptions()

        # Initialize core managers
        self._series_manager = SeriesManager(series)
        self._price_scale_manager = PriceScaleManager(
            left_price_scale=self.options.left_price_scale,
            right_price_scale=self.options.right_price_scale,
            overlay_price_scales=self.options.overlay_price_scales,
        )
        self._trade_manager = TradeManager()

        # Set up annotation system
        self.annotation_manager = AnnotationManager()

        # Initialize tooltip manager for lazy loading
        self._tooltip_manager: TooltipManager | None = None

        # Initialize chart synchronization support
        self._chart_group_id = chart_group_id

        # Flag to force frontend re-initialization
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

    def add_series(self, series: Series) -> "BaseChart":
        """Add a series to the chart.

        Args:
            series: Series object to add.

        Returns:
            Self for method chaining.

        """
        self._series_manager.add_series(series, self._price_scale_manager)
        return self

    def update_options(self, **kwargs) -> "BaseChart":
        """Update chart options.

        Args:
            **kwargs: Chart options to update.

        Returns:
            Self for method chaining.

        """
        for key, value in kwargs.items():
            if value is not None and hasattr(self.options, key):
                current_value = getattr(self.options, key)
                if isinstance(value, type(current_value)) or (
                    current_value is None and value is not None
                ):
                    setattr(self.options, key, value)
        return self

    def add_annotation(self, annotation: Annotation, layer_name: str = "default") -> "BaseChart":
        """Add an annotation to the chart.

        Args:
            annotation: Annotation object to add.
            layer_name: Name of the annotation layer.

        Returns:
            Self for method chaining.

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
        annotations: list[Annotation],
        layer_name: str = "default",
    ) -> "BaseChart":
        """Add multiple annotations to the chart.

        Args:
            annotations: List of annotation objects.
            layer_name: Name of the annotation layer.

        Returns:
            Self for method chaining.

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

    def create_annotation_layer(self, name: str) -> "BaseChart":
        """Create a new annotation layer.

        Args:
            name: Name of the annotation layer.

        Returns:
            Self for method chaining.

        """
        if name is None:
            raise TypeValidationError("name", "string")
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.create_layer(name)
        return self

    def hide_annotation_layer(self, name: str) -> "BaseChart":
        """Hide an annotation layer.

        Args:
            name: Name of the annotation layer to hide.

        Returns:
            Self for method chaining.

        """
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.hide_layer(name)
        return self

    def show_annotation_layer(self, name: str) -> "BaseChart":
        """Show an annotation layer.

        Args:
            name: Name of the annotation layer to show.

        Returns:
            Self for method chaining.

        """
        if not name or not isinstance(name, str):
            raise ValueValidationError("name", "must be a non-empty string")
        self.annotation_manager.show_layer(name)
        return self

    def clear_annotations(self, layer_name: str | None = None) -> "BaseChart":
        """Clear annotations from the chart.

        Args:
            layer_name: Name of the layer to clear, or None for all.

        Returns:
            Self for method chaining.

        """
        if layer_name is not None and (not layer_name or not isinstance(layer_name, str)):
            raise ValueValidationError("layer_name", "must be None or a non-empty string")
        if layer_name is not None:
            self.annotation_manager.clear_layer(layer_name)
        return self

    def add_overlay_price_scale(self, scale_id: str, options: "PriceScaleOptions") -> "BaseChart":
        """Add or update a custom overlay price scale configuration.

        Args:
            scale_id: Unique identifier for the price scale.
            options: PriceScaleOptions configuration.

        Returns:
            Self for method chaining.

        """
        self._price_scale_manager.add_overlay_scale(scale_id, options)
        self.options.overlay_price_scales[scale_id] = options
        return self

    def add_price_volume_series(
        self,
        data: Sequence[OhlcvData] | pd.DataFrame,
        column_mapping: dict | None = None,
        price_type: str = "candlestick",
        price_kwargs=None,
        volume_kwargs=None,
        pane_id: int = 0,
    ) -> "BaseChart":
        """Add price and volume series to the chart.

        Args:
            data: OHLCV data.
            column_mapping: Column name mapping for DataFrame.
            price_type: Type of price series ('candlestick' or 'line').
            price_kwargs: Additional price series arguments.
            volume_kwargs: Additional volume series arguments.
            pane_id: Pane ID for the series.

        Returns:
            Self for method chaining.

        """
        self._price_scale_manager.configure_for_volume()
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

    def add_trades(self, trades: list[TradeData]) -> "BaseChart":
        """Add trade visualization to the chart.

        Args:
            trades: List of TradeData objects.

        Returns:
            Self for method chaining.

        """
        self._trade_manager.add_trades(trades)
        return self

    def set_tooltip_manager(self, tooltip_manager: TooltipManager) -> "BaseChart":
        """Set the tooltip manager for the chart.

        Args:
            tooltip_manager: TooltipManager instance.

        Returns:
            Self for method chaining.

        """
        if not isinstance(tooltip_manager, TooltipManager):
            raise TypeValidationError("tooltip_manager", "TooltipManager instance")
        self._tooltip_manager = tooltip_manager
        return self

    def add_tooltip_config(self, name: str, config: TooltipConfig) -> "BaseChart":
        """Add a tooltip configuration to the chart.

        Args:
            name: Name for the tooltip configuration.
            config: TooltipConfig instance.

        Returns:
            Self for method chaining.

        """
        if not isinstance(config, TooltipConfig):
            raise TypeValidationError("config", "TooltipConfig instance")

        if self._tooltip_manager is None:
            self._tooltip_manager = TooltipManager()

        self._tooltip_manager.add_config(name, config)
        return self

    def set_chart_group_id(self, group_id: int) -> "BaseChart":
        """Set the chart group ID for synchronization.

        Args:
            group_id: Group ID for synchronization.

        Returns:
            Self for method chaining.

        """
        self.chart_group_id = group_id
        return self

    @property
    def chart_group_id(self) -> int:
        """Get the chart group ID."""
        return self._chart_group_id

    @chart_group_id.setter
    def chart_group_id(self, group_id: int) -> None:
        """Set the chart group ID."""
        if not isinstance(group_id, int):
            raise TypeValidationError("chart_group_id", "integer")
        self._chart_group_id = group_id

    def get_series_info_for_pane(self, _pane_id: int = 0) -> list[dict]:
        """Get series information for the series settings dialog.

        Args:
            _pane_id: The pane ID to get series info for.

        Returns:
            List of series information dictionaries.

        """
        return self._series_manager.get_series_info_for_pane(_pane_id)

    def to_frontend_config(self) -> dict[str, Any]:
        """Convert chart to frontend configuration dictionary.

        This is the core serialization logic. Framework-specific implementations
        may extend this to add additional configuration.

        Returns:
            Complete chart configuration ready for frontend rendering.

        """
        # Get series configurations
        series_configs = self._series_manager.to_frontend_configs()

        # Get base chart configuration
        chart_config = (
            self.options.asdict() if self.options is not None else ChartOptions().asdict()
        )

        # Get price scale configuration
        price_scale_config = self._price_scale_manager.validate_and_serialize()
        chart_config.update(price_scale_config)

        # Get annotations configuration
        annotations_config = self.annotation_manager.asdict()

        # Get trades configuration
        trades_config = self._trade_manager.to_frontend_config(
            self.options.trade_visualization if self.options else None
        )

        # Get tooltip configurations
        tooltip_configs = None
        if self._tooltip_manager:
            tooltip_configs = {}
            for name, tooltip_config in self._tooltip_manager.configs.items():
                tooltip_configs[name] = tooltip_config.asdict()

        # Build chart object
        chart_obj = {
            "chart": chart_config,
            "series": series_configs,
            "annotations": annotations_config,
        }

        if trades_config:
            chart_obj["trades"] = trades_config

        if tooltip_configs:
            chart_obj["tooltips"] = tooltip_configs

        # Build complete config
        config = {
            "charts": [chart_obj],
            "syncConfig": {"enabled": False},
        }

        if self.force_reinit:
            config["forceReinit"] = True

        return config
