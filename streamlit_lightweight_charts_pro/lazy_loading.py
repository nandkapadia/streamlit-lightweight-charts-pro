"""Lazy loading support for Streamlit Lightweight Charts.

This module provides lazy loading capabilities using Streamlit Fragments
to minimize reruns when loading additional chart data.

Example:
    ```python
    import streamlit as st
    from streamlit_lightweight_charts_pro import Chart, LineSeries
    from streamlit_lightweight_charts_pro.lazy_loading import lazy_chart

    # Create chart with large dataset
    data = [{"time": i, "value": 100 + i} for i in range(10000)]
    chart = Chart(series=LineSeries(data))

    # Render with lazy loading (uses @st.fragment)
    lazy_chart(chart, key="my_chart")
    ```
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Callable
import streamlit as st

# Lazy loading constants
CHUNK_SIZE_THRESHOLD = 500  # Below this, send all data
DEFAULT_CHUNK_SIZE = 500


@dataclass
class ChunkInfo:
    """Information about a loaded data chunk."""

    start_index: int = 0
    end_index: int = 0
    start_time: int = 0
    end_time: int = 0
    count: int = 0


@dataclass
class LazyLoadingState:
    """State container for lazy loading of a series."""

    series_id: str
    pane_id: int = 0
    total_count: int = 0
    chunk_size: int = DEFAULT_CHUNK_SIZE
    has_more_before: bool = False
    has_more_after: bool = False
    chunk_info: ChunkInfo = field(default_factory=ChunkInfo)
    full_data: List[Dict[str, Any]] = field(default_factory=list)
    loaded_data: List[Dict[str, Any]] = field(default_factory=list)

    def get_initial_chunk(self) -> List[Dict[str, Any]]:
        """Get the initial data chunk (most recent data).

        Returns:
            List of data points for initial display.
        """
        if len(self.full_data) <= self.chunk_size:
            # Small dataset - return all
            self.loaded_data = self.full_data.copy()
            self.has_more_before = False
            self.has_more_after = False
            self.chunk_info = ChunkInfo(
                start_index=0,
                end_index=len(self.full_data),
                start_time=self.full_data[0].get("time", 0) if self.full_data else 0,
                end_time=self.full_data[-1].get("time", 0) if self.full_data else 0,
                count=len(self.full_data),
            )
            return self.loaded_data

        # Large dataset - return last chunk_size points
        start_idx = max(0, len(self.full_data) - self.chunk_size)
        self.loaded_data = self.full_data[start_idx:]
        self.has_more_before = start_idx > 0
        self.has_more_after = False
        self.chunk_info = ChunkInfo(
            start_index=start_idx,
            end_index=len(self.full_data),
            start_time=self.loaded_data[0].get("time", 0) if self.loaded_data else 0,
            end_time=self.loaded_data[-1].get("time", 0) if self.loaded_data else 0,
            count=len(self.loaded_data),
        )
        return self.loaded_data

    def get_history_chunk(
        self, before_time: int, count: int = DEFAULT_CHUNK_SIZE
    ) -> Dict[str, Any]:
        """Get a chunk of historical data before a given time.

        Args:
            before_time: Get data before this timestamp.
            count: Number of data points to return.

        Returns:
            Dictionary with data and metadata.
        """
        if not self.full_data:
            return {
                "data": [],
                "chunkInfo": ChunkInfo().__dict__,
                "hasMoreBefore": False,
                "hasMoreAfter": False,
                "totalCount": 0,
            }

        # Sort data by time (ascending)
        sorted_data = sorted(self.full_data, key=lambda d: d.get("time", 0))

        # Find index of first item with time >= before_time
        end_index = 0
        for i, d in enumerate(sorted_data):
            if d.get("time", 0) >= before_time:
                end_index = i
                break
        else:
            end_index = len(sorted_data)

        start_index = max(0, end_index - count)
        chunk_data = sorted_data[start_index:end_index]

        chunk_info = ChunkInfo(
            start_index=start_index,
            end_index=end_index,
            start_time=chunk_data[0].get("time", 0) if chunk_data else 0,
            end_time=chunk_data[-1].get("time", 0) if chunk_data else 0,
            count=len(chunk_data),
        )

        return {
            "seriesId": self.series_id,
            "paneId": self.pane_id,
            "data": chunk_data,
            "chunkInfo": chunk_info.__dict__,
            "hasMoreBefore": start_index > 0,
            "hasMoreAfter": end_index < len(sorted_data),
            "totalCount": len(sorted_data),
        }


class LazyLoadingManager:
    """Manages lazy loading state for multiple series across charts.

    This manager stores the full dataset and handles chunked data requests
    from the frontend.
    """

    def __init__(self):
        """Initialize the lazy loading manager."""
        self._series_states: Dict[str, LazyLoadingState] = {}

    def register_series(
        self,
        chart_key: str,
        series_id: str,
        pane_id: int,
        data: List[Dict[str, Any]],
        chunk_size: int = DEFAULT_CHUNK_SIZE,
    ) -> LazyLoadingState:
        """Register a series for lazy loading.

        Args:
            chart_key: Unique key for the chart.
            series_id: Unique identifier for the series.
            pane_id: Pane index containing the series.
            data: Full dataset for the series.
            chunk_size: Size of each data chunk.

        Returns:
            LazyLoadingState for the series.
        """
        state_key = f"{chart_key}_{pane_id}_{series_id}"
        state = LazyLoadingState(
            series_id=series_id,
            pane_id=pane_id,
            total_count=len(data),
            chunk_size=chunk_size,
            full_data=data,
        )
        self._series_states[state_key] = state
        return state

    def get_state(
        self, chart_key: str, series_id: str, pane_id: int = 0
    ) -> Optional[LazyLoadingState]:
        """Get the lazy loading state for a series.

        Args:
            chart_key: Unique key for the chart.
            series_id: Series identifier.
            pane_id: Pane index.

        Returns:
            LazyLoadingState if found, None otherwise.
        """
        state_key = f"{chart_key}_{pane_id}_{series_id}"
        return self._series_states.get(state_key)

    def handle_history_request(
        self,
        chart_key: str,
        series_id: str,
        pane_id: int,
        before_time: int,
        count: int = DEFAULT_CHUNK_SIZE,
    ) -> Optional[Dict[str, Any]]:
        """Handle a history request from the frontend.

        Args:
            chart_key: Chart key.
            series_id: Series identifier.
            pane_id: Pane index.
            before_time: Get data before this timestamp.
            count: Number of points to return.

        Returns:
            History data chunk or None if series not found.
        """
        state = self.get_state(chart_key, series_id, pane_id)
        if not state:
            return None
        return state.get_history_chunk(before_time, count)

    def clear(self, chart_key: Optional[str] = None) -> None:
        """Clear lazy loading states.

        Args:
            chart_key: If provided, only clear states for this chart.
                      If None, clear all states.
        """
        if chart_key:
            keys_to_remove = [
                k for k in self._series_states if k.startswith(f"{chart_key}_")
            ]
            for key in keys_to_remove:
                del self._series_states[key]
        else:
            self._series_states.clear()


def get_lazy_loading_manager() -> LazyLoadingManager:
    """Get or create the lazy loading manager from session state.

    Returns:
        LazyLoadingManager instance.
    """
    if "_lazy_loading_manager" not in st.session_state:
        st.session_state._lazy_loading_manager = LazyLoadingManager()
    return st.session_state._lazy_loading_manager


def prepare_series_for_lazy_loading(
    series_config: Dict[str, Any],
    chart_key: str,
    series_id: str,
    pane_id: int = 0,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
) -> Dict[str, Any]:
    """Prepare a series configuration for lazy loading.

    If the dataset is large enough, this function:
    1. Stores the full data in the lazy loading manager
    2. Returns only the initial chunk with lazy loading metadata

    Args:
        series_config: Original series configuration with data.
        chart_key: Unique key for the chart.
        series_id: Unique identifier for the series.
        pane_id: Pane index.
        chunk_size: Size of each data chunk.

    Returns:
        Modified series configuration with lazy loading support.
    """
    data = series_config.get("data", [])

    # Small dataset - no lazy loading needed
    if len(data) < chunk_size:
        return series_config

    # Register with lazy loading manager
    manager = get_lazy_loading_manager()
    state = manager.register_series(chart_key, series_id, pane_id, data, chunk_size)

    # Get initial chunk
    initial_data = state.get_initial_chunk()

    # Create modified config with lazy loading metadata
    modified_config = series_config.copy()
    modified_config["data"] = initial_data
    modified_config["seriesId"] = series_id
    modified_config["lazyLoading"] = {
        "enabled": True,
        "totalCount": state.total_count,
        "chunkSize": state.chunk_size,
        "hasMoreBefore": state.has_more_before,
        "hasMoreAfter": state.has_more_after,
        "chunkInfo": state.chunk_info.__dict__,
    }

    return modified_config


def handle_lazy_load_response(
    response: Dict[str, Any], chart_key: str
) -> Optional[Dict[str, Any]]:
    """Handle a lazy loading response from the frontend.

    Args:
        response: Response dictionary from frontend.
        chart_key: Chart key.

    Returns:
        History data to send back, or None if not a lazy load request.
    """
    if not response or response.get("type") != "load_history":
        return None

    series_id = response.get("seriesId")
    pane_id = response.get("paneId", 0)
    before_time = response.get("beforeTime")
    count = response.get("count", DEFAULT_CHUNK_SIZE)

    if not series_id or before_time is None:
        return None

    manager = get_lazy_loading_manager()
    return manager.handle_history_request(
        chart_key, series_id, pane_id, before_time, count
    )


def lazy_chart(
    chart: Any,
    key: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    on_history_loaded: Optional[Callable[[Dict[str, Any]], None]] = None,
) -> Any:
    """Render a chart with lazy loading support using Streamlit Fragment.

    This function wraps the chart rendering in a @st.fragment decorator,
    which allows the lazy loading callbacks to run without triggering
    a full page rerun.

    Args:
        chart: Chart instance to render.
        key: Unique key for the chart component.
        chunk_size: Size of each data chunk for lazy loading.
        on_history_loaded: Optional callback when history is loaded.

    Returns:
        The rendered chart component result.

    Example:
        ```python
        from streamlit_lightweight_charts_pro import Chart, LineSeries
        from streamlit_lightweight_charts_pro.lazy_loading import lazy_chart

        data = [{"time": i, "value": 100 + i} for i in range(10000)]
        chart = Chart(series=LineSeries(data))
        lazy_chart(chart, key="my_chart")
        ```
    """
    # Store history data in session state for the frontend
    history_key = f"_chart_history_{key}"

    @st.fragment
    def _render_fragment():
        nonlocal chart

        # Prepare series for lazy loading
        config = chart.to_frontend_config()

        # Process each chart's series for lazy loading
        for chart_config in config.get("charts", []):
            for i, series_config in enumerate(chart_config.get("series", [])):
                series_id = series_config.get("name") or f"series_{i}"
                pane_id = series_config.get("paneId", 0)

                # Prepare series with lazy loading
                chart_config["series"][i] = prepare_series_for_lazy_loading(
                    series_config, key, series_id, pane_id, chunk_size
                )

        # Render the chart
        result = chart._chart_renderer.render(config, key, chart.options)

        # Handle responses
        if result:
            # Handle lazy loading requests
            history_data = handle_lazy_load_response(result, key)
            if history_data:
                st.session_state[history_key] = history_data
                if on_history_loaded:
                    on_history_loaded(history_data)

            # Also handle standard responses
            chart._chart_renderer.handle_response(
                result, key, chart._session_state_manager
            )

        return result

    return _render_fragment()


# Export public API
__all__ = [
    "lazy_chart",
    "LazyLoadingManager",
    "LazyLoadingState",
    "ChunkInfo",
    "get_lazy_loading_manager",
    "prepare_series_for_lazy_loading",
    "handle_lazy_load_response",
    "CHUNK_SIZE_THRESHOLD",
    "DEFAULT_CHUNK_SIZE",
]
