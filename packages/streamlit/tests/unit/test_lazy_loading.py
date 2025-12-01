"""Tests for lazy loading functionality.

This module tests the lazy loading capabilities for Streamlit charts,
including chunking, history requests, and state management.
"""

from unittest.mock import MagicMock, patch

from streamlit_lightweight_charts_pro.lazy_loading import (
    CHUNK_SIZE_THRESHOLD,
    DEFAULT_CHUNK_SIZE,
    ChunkInfo,
    LazyLoadingManager,
    LazyLoadingState,
    handle_lazy_load_response,
    prepare_series_for_lazy_loading,
)


class TestChunkInfo:
    """Tests for ChunkInfo dataclass."""

    def test_default_values(self):
        """Test ChunkInfo default values."""
        chunk = ChunkInfo()
        assert chunk.start_index == 0
        assert chunk.end_index == 0
        assert chunk.start_time == 0
        assert chunk.end_time == 0
        assert chunk.count == 0

    def test_custom_values(self):
        """Test ChunkInfo with custom values."""
        chunk = ChunkInfo(
            start_index=100,
            end_index=600,
            start_time=1000,
            end_time=2000,
            count=500,
        )
        assert chunk.start_index == 100
        assert chunk.end_index == 600
        assert chunk.start_time == 1000
        assert chunk.end_time == 2000
        assert chunk.count == 500


class TestLazyLoadingState:
    """Tests for LazyLoadingState."""

    def test_small_dataset_no_chunking(self):
        """Test that small datasets return all data without chunking."""
        data = [{"time": i, "value": 100 + i} for i in range(100)]
        state = LazyLoadingState(
            series_id="test_series",
            full_data=data,
            total_count=len(data),
        )

        result = state.get_initial_chunk()

        assert len(result) == 100
        assert state.has_more_before is False
        assert state.has_more_after is False

    def test_large_dataset_chunking(self):
        """Test that large datasets are chunked."""
        data = [{"time": i, "value": 100 + i} for i in range(1000)]
        state = LazyLoadingState(
            series_id="test_series",
            full_data=data,
            total_count=len(data),
            chunk_size=500,
        )

        result = state.get_initial_chunk()

        assert len(result) == 500
        assert state.has_more_before is True
        assert state.has_more_after is False
        # Should return the last 500 points
        assert result[0]["time"] == 500
        assert result[-1]["time"] == 999

    def test_get_history_chunk(self):
        """Test getting historical data chunk."""
        data = [{"time": i * 100, "value": i} for i in range(1000)]
        state = LazyLoadingState(
            series_id="test_series",
            full_data=data,
            total_count=len(data),
            chunk_size=100,
        )

        # Get chunk before time 50000 (index 500)
        result = state.get_history_chunk(before_time=50000, count=100)

        assert result["seriesId"] == "test_series"
        assert len(result["data"]) == 100
        assert result["hasMoreBefore"] is True
        assert result["hasMoreAfter"] is True

    def test_get_history_chunk_at_start(self):
        """Test getting history chunk at the beginning of data."""
        data = [{"time": i * 100, "value": i} for i in range(1000)]
        state = LazyLoadingState(
            series_id="test_series",
            full_data=data,
            total_count=len(data),
            chunk_size=100,
        )

        # Get chunk before time 5000 (index 50)
        result = state.get_history_chunk(before_time=5000, count=100)

        assert result["hasMoreBefore"] is False
        assert result["hasMoreAfter"] is True

    def test_get_history_chunk_empty_data(self):
        """Test getting history chunk with empty data."""
        state = LazyLoadingState(
            series_id="test_series",
            full_data=[],
            total_count=0,
        )

        result = state.get_history_chunk(before_time=1000, count=100)

        assert result["data"] == []
        assert result["hasMoreBefore"] is False
        assert result["hasMoreAfter"] is False
        assert result["totalCount"] == 0


class TestLazyLoadingManager:
    """Tests for LazyLoadingManager."""

    def test_register_series(self):
        """Test registering a series for lazy loading."""
        manager = LazyLoadingManager()
        data = [{"time": i, "value": i} for i in range(1000)]

        state = manager.register_series(
            chart_key="chart_1",
            series_id="series_1",
            pane_id=0,
            data=data,
        )

        assert state.series_id == "series_1"
        assert state.total_count == 1000

    def test_get_state(self):
        """Test getting series state."""
        manager = LazyLoadingManager()
        data = [{"time": i, "value": i} for i in range(100)]

        manager.register_series("chart_1", "series_1", 0, data)
        state = manager.get_state("chart_1", "series_1", 0)

        assert state is not None
        assert state.series_id == "series_1"

    def test_get_state_not_found(self):
        """Test getting non-existent series state."""
        manager = LazyLoadingManager()
        state = manager.get_state("nonexistent", "series", 0)
        assert state is None

    def test_handle_history_request(self):
        """Test handling history request."""
        manager = LazyLoadingManager()
        data = [{"time": i * 100, "value": i} for i in range(1000)]
        manager.register_series("chart_1", "series_1", 0, data)

        result = manager.handle_history_request(
            chart_key="chart_1",
            series_id="series_1",
            pane_id=0,
            before_time=50000,
            count=100,
        )

        assert result is not None
        assert len(result["data"]) == 100

    def test_handle_history_request_not_found(self):
        """Test handling history request for non-existent series."""
        manager = LazyLoadingManager()

        result = manager.handle_history_request(
            chart_key="nonexistent",
            series_id="series",
            pane_id=0,
            before_time=1000,
        )

        assert result is None

    def test_clear_all(self):
        """Test clearing all states."""
        manager = LazyLoadingManager()
        data = [{"time": i, "value": i} for i in range(100)]

        manager.register_series("chart_1", "series_1", 0, data)
        manager.register_series("chart_2", "series_2", 0, data)

        manager.clear()

        assert manager.get_state("chart_1", "series_1", 0) is None
        assert manager.get_state("chart_2", "series_2", 0) is None

    def test_clear_specific_chart(self):
        """Test clearing states for a specific chart."""
        manager = LazyLoadingManager()
        data = [{"time": i, "value": i} for i in range(100)]

        manager.register_series("chart_1", "series_1", 0, data)
        manager.register_series("chart_2", "series_2", 0, data)

        manager.clear("chart_1")

        assert manager.get_state("chart_1", "series_1", 0) is None
        assert manager.get_state("chart_2", "series_2", 0) is not None


class TestPrepareSeriesForLazyLoading:
    """Tests for prepare_series_for_lazy_loading function."""

    @patch("streamlit_lightweight_charts_pro.lazy_loading.get_lazy_loading_manager")
    def test_small_dataset_unchanged(self, _mock_get_manager):
        """Test that small datasets are returned unchanged."""
        series_config = {
            "type": "Line",
            "data": [{"time": i, "value": i} for i in range(100)],
        }

        result = prepare_series_for_lazy_loading(
            series_config, "chart_1", "series_1", chunk_size=500
        )

        # Small dataset should not have lazy loading
        assert "lazyLoading" not in result

    @patch("streamlit_lightweight_charts_pro.lazy_loading.get_lazy_loading_manager")
    def test_large_dataset_prepared(self, mock_get_manager):
        """Test that large datasets get lazy loading metadata."""
        mock_manager = MagicMock()
        mock_state = LazyLoadingState(
            series_id="series_1",
            full_data=[{"time": i, "value": i} for i in range(1000)],
            total_count=1000,
            chunk_size=500,
        )
        mock_state.get_initial_chunk()  # Initialize state
        mock_manager.register_series.return_value = mock_state
        mock_get_manager.return_value = mock_manager

        series_config = {
            "type": "Line",
            "data": [{"time": i, "value": i} for i in range(1000)],
        }

        result = prepare_series_for_lazy_loading(
            series_config, "chart_1", "series_1", chunk_size=500
        )

        assert "lazyLoading" in result
        assert result["lazyLoading"]["enabled"] is True
        assert result["lazyLoading"]["totalCount"] == 1000


class TestHandleLazyLoadResponse:
    """Tests for handle_lazy_load_response function."""

    @patch("streamlit_lightweight_charts_pro.lazy_loading.get_lazy_loading_manager")
    def test_non_history_request_returns_none(self, _mock_get_manager):
        """Test that non-history requests return None."""
        response = {"type": "other_request"}
        result = handle_lazy_load_response(response, "chart_1")
        assert result is None

    @patch("streamlit_lightweight_charts_pro.lazy_loading.get_lazy_loading_manager")
    def test_missing_fields_returns_none(self, _mock_get_manager):
        """Test that requests with missing fields return None."""
        response = {"type": "load_history"}  # Missing seriesId and beforeTime
        result = handle_lazy_load_response(response, "chart_1")
        assert result is None

    @patch("streamlit_lightweight_charts_pro.lazy_loading.get_lazy_loading_manager")
    def test_valid_request_returns_history(self, mock_get_manager):
        """Test that valid requests return history data."""
        mock_manager = MagicMock()
        mock_manager.handle_history_request.return_value = {
            "seriesId": "series_1",
            "data": [{"time": 100, "value": 10}],
            "hasMoreBefore": True,
            "hasMoreAfter": False,
        }
        mock_get_manager.return_value = mock_manager

        response = {
            "type": "load_history",
            "seriesId": "series_1",
            "paneId": 0,
            "beforeTime": 1000,
            "count": 100,
        }

        result = handle_lazy_load_response(response, "chart_1")

        assert result is not None
        assert result["seriesId"] == "series_1"
        mock_manager.handle_history_request.assert_called_once()


class TestLazyLoadingConstants:
    """Tests for lazy loading constants."""

    def test_chunk_size_threshold(self):
        """Test CHUNK_SIZE_THRESHOLD value."""
        assert CHUNK_SIZE_THRESHOLD == 500

    def test_default_chunk_size(self):
        """Test DEFAULT_CHUNK_SIZE value."""
        assert DEFAULT_CHUNK_SIZE == 500
