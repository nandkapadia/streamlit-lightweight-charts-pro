"""Chart Manager for Streamlit Lightweight Charts.

This module provides the ChartManager class for Streamlit, which extends
BaseChartManager with Streamlit-specific rendering capabilities.
"""

import hashlib
import json
import time
import uuid
from collections.abc import Sequence
from typing import Any, Optional, Union

import pandas as pd
import streamlit as st
from lightweight_charts_core.charts import BaseChartManager
from lightweight_charts_core.data import OhlcvData
from lightweight_charts_core.exceptions import (
    DuplicateError,
    NotFoundError,
    TypeValidationError,
)

from streamlit_lightweight_charts_pro.charts.chart import Chart


class ChartManager(BaseChartManager):
    """Streamlit ChartManager with rendering capabilities.

    This class extends BaseChartManager with Streamlit-specific functionality
    including session state management and component rendering.

    All core chart management logic (chart registry, sync groups, etc.) is
    inherited from BaseChartManager. This class adds:
    - Streamlit session state integration for change detection
    - Streamlit component rendering
    - Chart configuration persistence

    Example:
        ```python
        from streamlit_lightweight_charts_pro import ChartManager, Chart, LineSeries
        from streamlit_lightweight_charts_pro.data import SingleValueData

        manager = ChartManager()
        data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]
        manager.add_chart(Chart(series=LineSeries(data)), "price_chart")
        manager.enable_all_sync()
        manager.render(key="my_manager")
        ```
    """

    # Use Streamlit Chart class for factory methods
    chart_class = Chart

    def add_chart(self, chart: Chart, chart_id: Optional[str] = None) -> "ChartManager":
        """Add a chart to the manager.

        Extends the base implementation to set up Streamlit-specific references
        for the ChartRenderer.

        Args:
            chart: The Chart instance to add.
            chart_id: Optional unique identifier for the chart.

        Returns:
            Self for method chaining.

        Raises:
            DuplicateError: If a chart with the ID already exists.
        """
        if chart_id is None:
            chart_id = f"chart_{len(self.charts) + 1}"

        if chart_id in self.charts:
            raise DuplicateError("Chart", chart_id)

        # Set the ChartManager reference on the chart
        chart._chart_manager = self  # pylint: disable=protected-access

        # Set up ChartRenderer's manager reference for sync config access
        chart._chart_renderer.chart_manager_ref = self  # pylint: disable=protected-access

        self.charts[chart_id] = chart
        return self

    def render_chart(self, chart_id: str, key: Optional[str] = None) -> Any:
        """Render a specific chart from the manager.

        Args:
            chart_id: The ID of the chart to render.
            key: Optional key for the Streamlit component.

        Returns:
            The rendered component.

        Raises:
            NotFoundError: If chart_id is not found.
        """
        if chart_id not in self.charts:
            raise NotFoundError("Chart", chart_id)

        chart = self.charts[chart_id]
        return chart.render(key=key)

    def from_price_volume_dataframe(
        self,
        data: Union[Sequence[OhlcvData], pd.DataFrame],
        column_mapping: Optional[dict] = None,
        price_type: str = "candlestick",
        chart_id: str = "main_chart",
        price_kwargs=None,
        volume_kwargs=None,
        pane_id: int = 0,
    ) -> Chart:
        """Create a chart from OHLCV data with price and volume series.

        Args:
            data: OHLCV data.
            column_mapping: Column name mapping for DataFrame.
            price_type: Type of price series.
            chart_id: ID for the created chart.
            price_kwargs: Additional price series arguments.
            volume_kwargs: Additional volume series arguments.
            pane_id: Pane ID for the series.

        Returns:
            The created Chart instance.
        """
        if data is None:
            raise TypeValidationError("data", "list or DataFrame")
        if not isinstance(data, (list, pd.DataFrame)):
            raise TypeValidationError("data", "list or DataFrame")

        chart = Chart()
        chart.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type=price_type,
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
            pane_id=pane_id,
        )

        # Set the ChartManager reference on the chart
        chart._chart_manager = self  # pylint: disable=protected-access

        self.add_chart(chart, chart_id=chart_id)
        return chart

    def _auto_detect_changes(self, key: str) -> None:
        """Automatically detect changes and set force_reinit if needed.

        Uses Streamlit session state to track changes between renders.

        Args:
            key: Component key for state storage.
        """
        state_key = f"_lwc_chart_state_{key}"
        prev_state = st.session_state.get(state_key)

        # Build current state signature
        current_state = {
            "symbol": self.symbol,
            "interval": self.display_interval,
            "chart_count": len(self.charts),
            "series_structure": [],
        }

        # Add series structure fingerprint
        for chart in self.charts.values():
            for series in chart.series:
                data_hash = None
                if hasattr(series, "data") and series.data:
                    try:
                        data_str = str(series.data)
                        data_hash = hashlib.md5(data_str.encode()).hexdigest()[:8]  # noqa: S324
                    except (ValueError, TypeError, AttributeError):
                        data_hash = None

                series_info = {
                    "type": type(series).__name__,
                    "data_length": (
                        len(series.data) if hasattr(series, "data") and series.data else 0
                    ),
                    "data_hash": data_hash,
                }
                current_state["series_structure"].append(series_info)

        current_hash = hashlib.md5(  # noqa: S324
            json.dumps(current_state, sort_keys=True, default=str).encode()
        ).hexdigest()[:8]

        # Check for pending reinit from previous run
        pending_reinit_key = f"{state_key}_pending_reinit"
        pending_reinit = st.session_state.get(pending_reinit_key, False)

        if prev_state is None:
            self.force_reinit = False
            st.session_state[pending_reinit_key] = False
        elif prev_state != current_hash:
            self.force_reinit = True
            st.session_state[pending_reinit_key] = True
        elif pending_reinit:
            self.force_reinit = True
            st.session_state[pending_reinit_key] = False
        else:
            self.force_reinit = False

        st.session_state[state_key] = current_hash

    def render(
        self,
        key: Optional[str] = None,
        symbol: Optional[str] = None,
        interval: Optional[str] = None,
    ) -> Any:
        """Render the chart manager with automatic change detection.

        Args:
            key: Optional key for the Streamlit component.
            symbol: Optional symbol name for change detection.
            interval: Optional interval for change detection.

        Returns:
            The rendered component.

        Raises:
            RuntimeError: If no charts have been added.
        """
        if not self.charts:
            raise RuntimeError("Cannot render ChartManager with no charts")

        # Set metadata if provided
        if symbol is not None:
            self.symbol = symbol
        if interval is not None:
            self.display_interval = interval

        # Generate key if not provided
        if key is None or not isinstance(key, str) or not key.strip():
            unique_id = str(uuid.uuid4())[:8]
            key = f"chart_manager_{int(time.time() * 1000)}_{unique_id}"

        # Auto-detect changes using session state
        self._auto_detect_changes(key)

        # Load and apply stored configs for each chart
        for chart in self.charts.values():
            chart._session_state_manager.reset_config_applied_flag()  # pylint: disable=protected-access
            stored_configs = chart._session_state_manager.load_series_configs(
                key
            )  # pylint: disable=protected-access
            if stored_configs:
                chart._session_state_manager.apply_stored_configs_to_series(  # pylint: disable=protected-access
                    stored_configs,
                    chart.series,
                )

        # Generate frontend configuration
        config = self.to_frontend_config()

        # Render using first chart's renderer
        first_chart = next(iter(self.charts.values()))
        result = first_chart._chart_renderer.render(
            config, key, None
        )  # pylint: disable=protected-access

        # Handle response for each chart
        if result:
            for chart in self.charts.values():
                chart._chart_renderer.handle_response(  # pylint: disable=protected-access
                    result,
                    key,
                    chart._session_state_manager,  # pylint: disable=protected-access
                )

        return result
