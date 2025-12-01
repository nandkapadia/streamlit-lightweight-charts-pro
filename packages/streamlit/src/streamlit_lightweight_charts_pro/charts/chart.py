"""Chart implementation for Streamlit Lightweight Charts.

This module provides the Chart class for Streamlit, which extends BaseChart
with Streamlit-specific rendering capabilities.
"""

import time
import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

from lightweight_charts_core.charts import BaseChart
from lightweight_charts_core.charts.options import ChartOptions
from lightweight_charts_core.charts.series import Series
from lightweight_charts_core.data import Annotation

# Streamlit-specific imports
from streamlit_lightweight_charts_pro.charts.managers import (
    ChartRenderer,
    SessionStateManager,
)


class Chart(BaseChart):
    """Streamlit Chart class with rendering capabilities.

    This class extends BaseChart with Streamlit-specific functionality
    including session state management and component rendering.

    All core chart logic (series management, annotations, price scales, trades,
    tooltips) is inherited from BaseChart. This class adds:
    - Streamlit session state integration
    - Streamlit component rendering
    - Chart configuration persistence

    Example:
        ```python
        from streamlit_lightweight_charts_pro import Chart, LineSeries
        from streamlit_lightweight_charts_pro.data import SingleValueData

        data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]
        chart = Chart(series=LineSeries(data))
        chart.render(key="my_chart")
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
        """Initialize a Streamlit chart.

        Args:
            series: Optional single series or list of series to display.
            options: Optional chart configuration options.
            annotations: Optional list of annotations to add.
            chart_group_id: Group ID for synchronization.
            chart_manager: Reference to the ChartManager that owns this chart.
        """
        # Initialize base chart with core logic
        super().__init__(
            series=series,
            options=options,
            annotations=annotations,
            chart_group_id=chart_group_id,
        )

        # Initialize Streamlit-specific managers
        self._session_state_manager = SessionStateManager()
        self._chart_renderer = ChartRenderer(chart_manager_ref=chart_manager)

        # Reference to chart manager for sync configuration
        self._chart_manager = chart_manager

    def get_stored_series_config(
        self,
        key: str,
        series_index: int = 0,
        pane_id: int = 0,
    ) -> Dict[str, Any]:
        """Get stored configuration for a specific series from session state.

        Args:
            key: Component key used to namespace the stored configs.
            series_index: Index of the series.
            pane_id: Pane ID for the series.

        Returns:
            Dictionary of stored configuration or empty dict if none found.
        """
        return self._session_state_manager.get_stored_series_config(key, series_index, pane_id)

    def to_frontend_config(self) -> Dict[str, Any]:
        """Convert chart to frontend configuration dictionary.

        Extends the base implementation to use ChartRenderer for generating
        the complete frontend configuration with sync support.

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

        if self.force_reinit:
            config["forceReinit"] = True

        return config

    def render(self, key: Optional[str] = None) -> Any:
        """Render the chart in Streamlit.

        Converts the chart to frontend configuration and renders it using
        the Streamlit component.

        Args:
            key: Optional unique key for the Streamlit component.

        Returns:
            The rendered Streamlit component.
        """
        # Generate a unique key if none provided
        if key is None or not isinstance(key, str) or not key.strip():
            unique_id = str(uuid.uuid4())[:8]
            key = f"chart_{int(time.time() * 1000)}_{unique_id}"

        # Reset config application flag for this render cycle
        self._session_state_manager.reset_config_applied_flag()

        # Load and apply stored configs before serialization
        stored_configs = self._session_state_manager.load_series_configs(key)
        if stored_configs:
            self._session_state_manager.apply_stored_configs_to_series(
                stored_configs,
                self.series,
            )

        # Generate chart configuration after configs are applied
        config = self.to_frontend_config()

        # Render component using ChartRenderer
        result = self._chart_renderer.render(config, key, self.options)

        # Handle component return value and save series configs
        if result:
            self._chart_renderer.handle_response(
                result,
                key,
                self._session_state_manager,
            )

        return result

    # Backward compatibility methods that delegate to ChartRenderer

    def _convert_time_to_timestamp(self, time_value) -> Optional[float]:
        """Convert various time formats to timestamp."""
        return self._chart_renderer._convert_time_to_timestamp(time_value)

    def _calculate_data_timespan(self) -> Optional[float]:
        """Calculate the timespan of data across all series in seconds."""
        try:
            series_configs = self._series_manager.to_frontend_configs()
            return self._chart_renderer._calculate_data_timespan(series_configs)
        except Exception:
            return None

    def _get_range_seconds(self, range_config: Dict[str, Any]) -> Optional[float]:
        """Extract seconds from range configuration."""
        return self._chart_renderer._get_range_seconds(range_config)
