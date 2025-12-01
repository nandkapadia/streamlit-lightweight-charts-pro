"""Tests for DatafeedService."""

import pytest

from lightweight_charts_backend.services.datafeed import (
    ChartState,
    DatafeedService,
    SeriesData,
)


class TestSeriesData:
    """Tests for SeriesData class."""

    def test_creation(self):
        """Test basic creation."""
        series = SeriesData(series_id="test", series_type="line")
        assert series.series_id == "test"
        assert series.series_type == "line"
        assert series.data == []
        assert series.options == {}

    def test_creation_with_data(self):
        """Test creation with data."""
        data = [{"time": 1, "value": 100}, {"time": 2, "value": 200}]
        series = SeriesData(series_id="test", series_type="line", data=data)
        assert len(series.data) == 2

    def test_get_data_range(self):
        """Test getting data within a time range."""
        data = [
            {"time": 1, "value": 100},
            {"time": 2, "value": 200},
            {"time": 3, "value": 300},
            {"time": 4, "value": 400},
        ]
        series = SeriesData(series_id="test", series_type="line", data=data)
        result = series.get_data_range(2, 3)
        assert len(result) == 2
        assert result[0]["value"] == 200
        assert result[1]["value"] == 300

    def test_get_data_chunk_empty(self):
        """Test getting chunk from empty data."""
        series = SeriesData(series_id="test", series_type="line")
        chunk = series.get_data_chunk()
        assert chunk["data"] == []
        assert chunk["has_more_before"] is False
        assert chunk["has_more_after"] is False
        assert chunk["total_available"] == 0

    def test_get_data_chunk_small_dataset(self):
        """Test getting chunk from small dataset returns all data."""
        data = [{"time": i, "value": i * 100} for i in range(10)]
        series = SeriesData(series_id="test", series_type="line", data=data)
        chunk = series.get_data_chunk(count=500)
        assert len(chunk["data"]) == 10
        assert chunk["has_more_before"] is False
        assert chunk["has_more_after"] is False
        assert chunk["total_available"] == 10

    def test_get_data_chunk_large_dataset(self):
        """Test getting chunk from large dataset."""
        data = [{"time": i, "value": i * 100} for i in range(1000)]
        series = SeriesData(series_id="test", series_type="line", data=data)
        chunk = series.get_data_chunk(count=500)
        assert len(chunk["data"]) == 500
        assert chunk["has_more_before"] is True
        assert chunk["has_more_after"] is False
        assert chunk["total_available"] == 1000
        # Should return latest 500 points
        assert chunk["data"][0]["time"] == 500
        assert chunk["data"][-1]["time"] == 999

    def test_get_data_chunk_before_time(self):
        """Test getting chunk before a specific time."""
        data = [{"time": i, "value": i * 100} for i in range(1000)]
        series = SeriesData(series_id="test", series_type="line", data=data)
        chunk = series.get_data_chunk(before_time=500, count=100)
        assert len(chunk["data"]) == 100
        assert chunk["has_more_before"] is True
        assert chunk["has_more_after"] is True
        # Should return 100 points before time 500
        assert chunk["data"][-1]["time"] == 499

    def test_get_data_chunk_pagination(self):
        """Test pagination through chunks."""
        data = [{"time": i, "value": i * 100} for i in range(100)]
        series = SeriesData(series_id="test", series_type="line", data=data)

        # Get first chunk (latest)
        chunk1 = series.get_data_chunk(count=30)
        assert len(chunk1["data"]) == 30
        assert chunk1["data"][-1]["time"] == 99

        # Get next chunk before first chunk
        first_time = chunk1["data"][0]["time"]
        chunk2 = series.get_data_chunk(before_time=first_time, count=30)
        assert len(chunk2["data"]) == 30
        assert chunk2["data"][-1]["time"] == first_time - 1


class TestChartState:
    """Tests for ChartState class."""

    def test_creation(self):
        """Test basic creation."""
        chart = ChartState(chart_id="test-chart")
        assert chart.chart_id == "test-chart"
        assert chart.panes == {}
        assert chart.options == {}

    def test_get_series_not_found(self):
        """Test getting non-existent series."""
        chart = ChartState(chart_id="test")
        assert chart.get_series(0, "missing") is None

    def test_set_and_get_series(self):
        """Test setting and getting series."""
        chart = ChartState(chart_id="test")
        series = SeriesData(series_id="line1", series_type="line")
        chart.set_series(0, "line1", series)

        retrieved = chart.get_series(0, "line1")
        assert retrieved is not None
        assert retrieved.series_id == "line1"

    def test_multiple_panes(self):
        """Test series in multiple panes."""
        chart = ChartState(chart_id="test")
        series1 = SeriesData(series_id="main", series_type="candlestick")
        series2 = SeriesData(series_id="volume", series_type="histogram")

        chart.set_series(0, "main", series1)
        chart.set_series(1, "volume", series2)

        assert chart.get_series(0, "main") is not None
        assert chart.get_series(1, "volume") is not None
        assert chart.get_series(0, "volume") is None

    def test_get_all_series_data(self):
        """Test getting all series data for chart render."""
        chart = ChartState(chart_id="test")
        data = [{"time": 1, "value": 100}]
        series = SeriesData(
            series_id="line1",
            series_type="line",
            data=data,
            options={"color": "red"},
        )
        chart.set_series(0, "line1", series)

        result = chart.get_all_series_data()
        assert "0" in result
        assert "line1" in result["0"]
        assert result["0"]["line1"]["seriesType"] == "line"
        assert result["0"]["line1"]["data"] == data


class TestDatafeedService:
    """Tests for DatafeedService class."""

    @pytest.fixture
    def service(self):
        """Create a fresh DatafeedService for each test."""
        return DatafeedService()

    @pytest.mark.asyncio
    async def test_create_chart(self, service):
        """Test creating a chart."""
        chart = await service.create_chart("test-chart", {"width": 800})
        assert chart.chart_id == "test-chart"
        assert chart.options == {"width": 800}

    @pytest.mark.asyncio
    async def test_create_chart_idempotent(self, service):
        """Test that creating same chart twice returns same chart."""
        chart1 = await service.create_chart("test-chart")
        chart2 = await service.create_chart("test-chart")
        assert chart1.chart_id == chart2.chart_id

    @pytest.mark.asyncio
    async def test_get_chart(self, service):
        """Test getting a chart."""
        await service.create_chart("test-chart")
        chart = await service.get_chart("test-chart")
        assert chart is not None
        assert chart.chart_id == "test-chart"

    @pytest.mark.asyncio
    async def test_get_chart_not_found(self, service):
        """Test getting non-existent chart."""
        chart = await service.get_chart("missing")
        assert chart is None

    @pytest.mark.asyncio
    async def test_set_series_data(self, service):
        """Test setting series data."""
        data = [{"time": i, "value": i * 100} for i in range(10)]
        series = await service.set_series_data(
            chart_id="test",
            pane_id=0,
            series_id="line1",
            series_type="line",
            data=data,
            options={"color": "blue"},
        )
        assert series.series_id == "line1"
        assert len(series.data) == 10

    @pytest.mark.asyncio
    async def test_get_initial_data_small_dataset(self, service):
        """Test initial data for small dataset returns all data."""
        # Small dataset (< 500 points)
        data = [{"time": i, "value": i * 100} for i in range(100)]
        await service.set_series_data(
            chart_id="test",
            pane_id=0,
            series_id="line1",
            series_type="line",
            data=data,
        )

        result = await service.get_initial_data("test", 0, "line1")
        assert result["chunked"] is False
        assert result["totalCount"] == 100
        assert len(result["data"]) == 100

    @pytest.mark.asyncio
    async def test_get_initial_data_large_dataset(self, service):
        """Test initial data for large dataset returns chunk."""
        # Large dataset (>= 500 points)
        data = [{"time": i, "value": i * 100} for i in range(1000)]
        await service.set_series_data(
            chart_id="test",
            pane_id=0,
            series_id="line1",
            series_type="line",
            data=data,
        )

        result = await service.get_initial_data("test", 0, "line1")
        assert result["chunked"] is True
        assert result["totalCount"] == 1000
        assert len(result["data"]) == 500
        assert result["hasMoreBefore"] is True
        assert result["hasMoreAfter"] is False

    @pytest.mark.asyncio
    async def test_get_initial_data_full_chart(self, service):
        """Test getting initial data for full chart."""
        data = [{"time": i, "value": i * 100} for i in range(10)]
        await service.set_series_data(
            chart_id="test",
            pane_id=0,
            series_id="line1",
            series_type="line",
            data=data,
        )

        result = await service.get_initial_data("test")
        assert result["chartId"] == "test"
        assert "panes" in result
        assert "0" in result["panes"]

    @pytest.mark.asyncio
    async def test_get_initial_data_chart_not_found(self, service):
        """Test initial data for missing chart."""
        result = await service.get_initial_data("missing")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_get_history(self, service):
        """Test getting historical data."""
        data = [{"time": i, "value": i * 100} for i in range(1000)]
        await service.set_series_data(
            chart_id="test",
            pane_id=0,
            series_id="line1",
            series_type="line",
            data=data,
        )

        result = await service.get_history(
            chart_id="test",
            pane_id=0,
            series_id="line1",
            before_time=500,
            count=100,
        )

        assert len(result["data"]) == 100
        assert result["hasMoreBefore"] is True
        assert result["hasMoreAfter"] is True

    @pytest.mark.asyncio
    async def test_get_history_chart_not_found(self, service):
        """Test history for missing chart."""
        result = await service.get_history(
            chart_id="missing",
            pane_id=0,
            series_id="line1",
            before_time=500,
        )
        assert "error" in result

    @pytest.mark.asyncio
    async def test_subscribe_and_notify(self, service):
        """Test subscribing to chart updates."""
        received_events = []

        async def callback(event_type, data):
            received_events.append((event_type, data))

        await service.create_chart("test")
        unsubscribe = await service.subscribe("test", callback)

        # Trigger update by setting data
        await service.set_series_data(
            chart_id="test",
            pane_id=0,
            series_id="line1",
            series_type="line",
            data=[{"time": 1, "value": 100}],
        )

        assert len(received_events) == 1
        assert received_events[0][0] == "data_update"

        # Unsubscribe
        unsubscribe()

    @pytest.mark.asyncio
    async def test_chunk_size_threshold(self, service):
        """Test the chunk size threshold constant."""
        assert service.CHUNK_SIZE_THRESHOLD == 500

        # Test boundary conditions
        data_499 = [{"time": i, "value": i} for i in range(499)]
        await service.set_series_data(
            chart_id="test1",
            pane_id=0,
            series_id="line1",
            series_type="line",
            data=data_499,
        )
        result = await service.get_initial_data("test1", 0, "line1")
        assert result["chunked"] is False

        data_500 = [{"time": i, "value": i} for i in range(500)]
        await service.set_series_data(
            chart_id="test2",
            pane_id=0,
            series_id="line1",
            series_type="line",
            data=data_500,
        )
        result = await service.get_initial_data("test2", 0, "line1")
        assert result["chunked"] is True
