"""DatafeedService for managing chart data with infinite history support.

This module implements the smart chunking and pagination strategy for large datasets.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Optional, TypedDict

logger = logging.getLogger(__name__)


class ChunkInfo(TypedDict):
    """Information about a data chunk."""

    start_index: int
    end_index: int
    start_time: int
    end_time: int
    count: int


class DataChunk(TypedDict):
    """A chunk of chart data."""

    data: list[dict[str, Any]]
    chunk_info: ChunkInfo
    has_more_before: bool
    has_more_after: bool
    total_available: int


@dataclass
class SeriesData:
    """Container for series data with metadata."""

    series_id: str
    series_type: str
    data: list[dict[str, Any]] = field(default_factory=list)
    options: dict[str, Any] = field(default_factory=dict)
    _sorted: bool = field(default=False, init=False)

    def get_data_range(self, start_time: int, end_time: int) -> list[dict[str, Any]]:
        """Get data within a time range.

        Args:
            start_time: Start timestamp (inclusive).
            end_time: End timestamp (inclusive).

        Returns:
            List of data points within the range.
        """
        return [d for d in self.data if start_time <= d.get("time", 0) <= end_time]

    def _ensure_sorted(self):
        """Ensure data is sorted by time (ascending)."""
        if not self._sorted and self.data:
            self.data.sort(key=lambda d: d.get("time", 0))
            self._sorted = True

    def get_data_chunk(
        self,
        before_time: Optional[int] = None,
        count: int = 500,
    ) -> DataChunk:
        """Get a chunk of data for infinite history loading.

        Args:
            before_time: Get data before this timestamp. None = latest data.
            count: Number of data points to return.

        Returns:
            DataChunk with data and metadata.
        """
        if not self.data:
            return DataChunk(
                data=[],
                chunk_info=ChunkInfo(
                    start_index=0,
                    end_index=0,
                    start_time=0,
                    end_time=0,
                    count=0,
                ),
                has_more_before=False,
                has_more_after=False,
                total_available=0,
            )

        # Ensure data is sorted (only sorts once)
        self._ensure_sorted()
        sorted_data = self.data

        if before_time is None:
            # Return latest data
            end_index = len(sorted_data)
            start_index = max(0, end_index - count)
        else:
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

        if chunk_data:
            start_time = chunk_data[0].get("time", 0)
            end_time = chunk_data[-1].get("time", 0)
        else:
            start_time = 0
            end_time = 0

        return DataChunk(
            data=chunk_data,
            chunk_info=ChunkInfo(
                start_index=start_index,
                end_index=end_index,
                start_time=start_time,
                end_time=end_time,
                count=len(chunk_data),
            ),
            has_more_before=start_index > 0,
            has_more_after=end_index < len(sorted_data),
            total_available=len(sorted_data),
        )


@dataclass
class ChartState:
    """State container for a single chart."""

    chart_id: str
    panes: dict[int, dict[str, SeriesData]] = field(default_factory=dict)
    options: dict[str, Any] = field(default_factory=dict)

    def get_series(self, pane_id: int, series_id: str) -> Optional[SeriesData]:
        """Get series data by pane and series ID."""
        if pane_id not in self.panes:
            return None
        return self.panes[pane_id].get(series_id)

    def set_series(self, pane_id: int, series_id: str, series: SeriesData) -> None:
        """Set series data."""
        if pane_id not in self.panes:
            self.panes[pane_id] = {}
        self.panes[pane_id][series_id] = series

    def get_all_series_data(self) -> dict[str, Any]:
        """Get all series data for initial chart render.

        Returns:
            Dictionary with pane structure and all series data.
        """
        result: dict[str, Any] = {}

        for pane_id, series_dict in self.panes.items():
            pane_data: dict[str, Any] = {}
            for series_id, series in series_dict.items():
                pane_data[series_id] = {
                    "seriesType": series.series_type,
                    "data": series.data,
                    "options": series.options,
                }
            result[str(pane_id)] = pane_data

        return result


class DatafeedService:
    """Service for managing chart data with smart chunking support.

    This service implements the infinite history loading pattern where:
    - Datasets < 500 points: Send all data at once
    - Datasets >= 500 points: Chunk data for efficient loading

    The frontend subscribes to visible range changes and requests more data
    when the user scrolls near the edge.
    """

    CHUNK_SIZE_THRESHOLD = 500  # Below this, send all data

    def __init__(self):
        """Initialize the datafeed service."""
        self._charts: dict[str, ChartState] = {}
        self._subscribers: dict[str, list[Callable]] = {}
        self._lock = asyncio.Lock()

    async def get_chart(self, chart_id: str) -> Optional[ChartState]:
        """Get chart state by ID."""
        async with self._lock:
            return self._charts.get(chart_id)

    async def create_chart(self, chart_id: str, options: Optional[dict] = None) -> ChartState:
        """Create a new chart state.

        Args:
            chart_id: Unique chart identifier.
            options: Chart options.

        Returns:
            Created ChartState.
        """
        async with self._lock:
            return self._create_chart_no_lock(chart_id, options)

    def _create_chart_no_lock(self, chart_id: str, options: Optional[dict] = None) -> ChartState:
        """Internal method to create chart without acquiring lock.

        Must only be called when lock is already held.

        Args:
            chart_id: Unique chart identifier.
            options: Chart options.

        Returns:
            Created ChartState.
        """
        if chart_id in self._charts:
            return self._charts[chart_id]

        chart = ChartState(chart_id=chart_id, options=options or {})
        self._charts[chart_id] = chart
        return chart

    async def set_series_data(
        self,
        chart_id: str,
        pane_id: int,
        series_id: str,
        series_type: str,
        data: list[dict[str, Any]],
        options: Optional[dict] = None,
    ) -> SeriesData:
        """Set data for a series.

        Args:
            chart_id: Chart identifier.
            pane_id: Pane index.
            series_id: Series identifier.
            series_type: Type of series (line, candlestick, etc.)
            data: List of data points.
            options: Series options.

        Returns:
            Created/updated SeriesData.
        """
        async with self._lock:
            chart = self._charts.get(chart_id)
            if not chart:
                # Use internal no-lock method since we already hold the lock
                chart = self._create_chart_no_lock(chart_id)

            series = SeriesData(
                series_id=series_id,
                series_type=series_type,
                data=data,
                options=options or {},
            )
            # Sort data once when setting
            series._ensure_sorted()
            chart.set_series(pane_id, series_id, series)

            # Prepare notification data while holding lock
            notification_data = {
                "paneId": pane_id,
                "seriesId": series_id,
                "count": len(data),
            }

        # Notify subscribers OUTSIDE the lock to prevent blocking
        # This allows other operations to proceed while callbacks execute
        await self._notify_subscribers(chart_id, "data_update", notification_data)

        return series

    async def get_initial_data(
        self,
        chart_id: str,
        pane_id: Optional[int] = None,
        series_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Get initial data for chart rendering.

        Implements smart chunking:
        - If total data < 500 points: Return all data
        - If total data >= 500 points: Return initial chunk

        Args:
            chart_id: Chart identifier.
            pane_id: Optional specific pane.
            series_id: Optional specific series.

        Returns:
            Initial data payload with chunking metadata.
        """
        async with self._lock:
            chart = self._charts.get(chart_id)
            if not chart:
                return {"error": "Chart not found"}

            if pane_id is not None and series_id is not None:
                # Single series request
                series = chart.get_series(pane_id, series_id)
                if not series:
                    return {"error": "Series not found"}

                total_count = len(series.data)

                if total_count < self.CHUNK_SIZE_THRESHOLD:
                    # Small dataset - send all
                    return {
                        "seriesId": series_id,
                        "seriesType": series.series_type,
                        "data": series.data,
                        "options": series.options,
                        "chunked": False,
                        "totalCount": total_count,
                    }
                # Large dataset - send initial chunk
                chunk = series.get_data_chunk(count=self.CHUNK_SIZE_THRESHOLD)
                return {
                    "seriesId": series_id,
                    "seriesType": series.series_type,
                    "data": chunk["data"],
                    "options": series.options,
                    "chunked": True,
                    "chunkInfo": chunk["chunk_info"],
                    "hasMoreBefore": chunk["has_more_before"],
                    "hasMoreAfter": chunk["has_more_after"],
                    "totalCount": chunk["total_available"],
                }
            # Full chart data
            return {
                "chartId": chart_id,
                "panes": chart.get_all_series_data(),
                "options": chart.options,
            }

    async def get_history(
        self,
        chart_id: str,
        pane_id: int,
        series_id: str,
        before_time: int,
        count: int = 500,
    ) -> dict[str, Any]:
        """Get historical data chunk for infinite history loading.

        Args:
            chart_id: Chart identifier.
            pane_id: Pane index.
            series_id: Series identifier.
            before_time: Get data before this timestamp.
            count: Number of data points to return.

        Returns:
            Data chunk with metadata.
        """
        async with self._lock:
            chart = self._charts.get(chart_id)
            if not chart:
                return {"error": "Chart not found"}

            series = chart.get_series(pane_id, series_id)
            if not series:
                return {"error": "Series not found"}

            chunk = series.get_data_chunk(before_time=before_time, count=count)

            return {
                "seriesId": series_id,
                "data": chunk["data"],
                "chunkInfo": chunk["chunk_info"],
                "hasMoreBefore": chunk["has_more_before"],
                "hasMoreAfter": chunk["has_more_after"],
                "totalCount": chunk["total_available"],
            }

    async def subscribe(self, chart_id: str, callback: Callable) -> Callable[[], None]:
        """Subscribe to chart updates.

        Args:
            chart_id: Chart identifier.
            callback: Async callback function.

        Returns:
            Unsubscribe function.
        """
        async with self._lock:
            if chart_id not in self._subscribers:
                self._subscribers[chart_id] = []
            self._subscribers[chart_id].append(callback)

        async def unsubscribe():
            async with self._lock:
                if chart_id in self._subscribers:
                    try:
                        self._subscribers[chart_id].remove(callback)
                    except ValueError:
                        pass  # Already removed

        return unsubscribe

    async def _notify_subscribers(
        self,
        chart_id: str,
        event_type: str,
        data: dict[str, Any],
    ) -> None:
        """Notify all subscribers of an event."""
        subscribers = self._subscribers.get(chart_id, [])
        for callback in subscribers:
            try:
                await callback(event_type, data)
            except Exception:
                logger.exception("Callback error for %s", chart_id)
