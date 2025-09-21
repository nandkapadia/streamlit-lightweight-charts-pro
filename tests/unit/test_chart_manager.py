"""
Unit tests for ChartManager module.

This module tests the ChartManager class functionality including
chart management, synchronization, rendering, and error handling.
"""

from unittest.mock import patch

import pytest

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.chart_manager import ChartManager
from streamlit_lightweight_charts_pro.charts.options.sync_options import SyncOptions
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.data.line_data import LineData


class TestChartManagerInitialization:
    """Test ChartManager initialization."""

    def test_init_default(self):
        """Test default initialization."""
        manager = ChartManager()

        assert manager.charts == {}
        assert manager.sync_groups == {}
        assert isinstance(manager.default_sync, SyncOptions)
        assert manager.default_sync.enabled is False


class TestChartManagerAddChart:
    """Test adding charts to the manager."""

    def test_add_chart_with_id(self):
        """Test adding a chart with a specific ID."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])

        result = manager.add_chart(chart, "test_chart")

        assert result is manager  # Method chaining
        assert "test_chart" in manager.charts
        assert manager.charts["test_chart"] is chart
        assert chart._chart_manager is manager

    def test_add_chart_auto_generate_id(self):
        """Test adding a chart with auto-generated ID."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])

        result = manager.add_chart(chart)

        assert result is manager
        assert len(manager.charts) == 1
        assert "chart_1" in manager.charts
        assert manager.charts["chart_1"] is chart

    def test_add_multiple_charts_auto_id(self):
        """Test adding multiple charts with auto-generated IDs."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=1, value=200)])])

        manager.add_chart(chart1)
        manager.add_chart(chart2)

        assert len(manager.charts) == 2
        assert "chart_1" in manager.charts
        assert "chart_2" in manager.charts
        assert manager.charts["chart_1"] is chart1
        assert manager.charts["chart_2"] is chart2

    def test_add_chart_duplicate_id_error(self):
        """Test adding a chart with duplicate ID raises error."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=1, value=200)])])

        manager.add_chart(chart1, "test_chart")

        with pytest.raises(ValueError, match="Chart with ID 'test_chart' already exists"):
            manager.add_chart(chart2, "test_chart")


class TestChartManagerRemoveChart:
    """Test removing charts from the manager."""

    def test_remove_chart_existing(self):
        """Test removing an existing chart."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "test_chart")

        result = manager.remove_chart("test_chart")

        assert result is manager  # Method chaining
        assert "test_chart" not in manager.charts
        assert len(manager.charts) == 0

    def test_remove_chart_nonexistent_error(self):
        """Test removing a non-existent chart raises error."""
        manager = ChartManager()

        with pytest.raises(ValueError, match="Chart with ID 'nonexistent' not found"):
            manager.remove_chart("nonexistent")


class TestChartManagerGetChart:
    """Test getting charts from the manager."""

    def test_get_chart_existing(self):
        """Test getting an existing chart."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "test_chart")

        result = manager.get_chart("test_chart")

        assert result is chart

    def test_get_chart_nonexistent_error(self):
        """Test getting a non-existent chart raises error."""
        manager = ChartManager()

        with pytest.raises(ValueError, match="Chart with ID 'nonexistent' not found"):
            manager.get_chart("nonexistent")


class TestChartManagerRenderChart:
    """Test rendering individual charts."""

    @patch.object(Chart, "render")
    def test_render_chart_existing(self, mock_render):
        """Test rendering an existing chart."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "test_chart")

        mock_render.return_value = "rendered_chart"

        result = manager.render_chart("test_chart", key="test_key")

        assert result == "rendered_chart"
        mock_render.assert_called_once_with(key="test_key")

    def test_render_chart_nonexistent_error(self):
        """Test rendering a non-existent chart raises error."""
        manager = ChartManager()

        with pytest.raises(ValueError, match="Chart with ID 'nonexistent' not found"):
            manager.render_chart("nonexistent")


class TestChartManagerSyncGroupConfig:
    """Test sync group configuration management."""

    def test_set_sync_group_config(self):
        """Test setting sync group configuration."""
        manager = ChartManager()
        sync_options = SyncOptions(enabled=True, crosshair=True, time_range=True)

        result = manager.set_sync_group_config("test_group", sync_options)

        assert result is manager
        assert "test_group" in manager.sync_groups
        assert manager.sync_groups["test_group"] is sync_options

    def test_get_sync_group_config_existing(self):
        """Test getting sync group configuration."""
        manager = ChartManager()
        sync_options = SyncOptions(enabled=True, crosshair=True)
        manager.set_sync_group_config("test_group", sync_options)

        result = manager.get_sync_group_config("test_group")

        assert result is sync_options

    def test_get_sync_group_config_nonexistent(self):
        """Test getting non-existent sync group configuration."""
        manager = ChartManager()

        result = manager.get_sync_group_config("nonexistent")

        assert result is None

    def test_set_sync_group_config_with_int_id(self):
        """Test setting sync group configuration with integer ID."""
        manager = ChartManager()
        sync_options = SyncOptions(enabled=True)

        result = manager.set_sync_group_config(123, sync_options)

        assert result is manager
        assert "123" in manager.sync_groups
        assert manager.sync_groups["123"] is sync_options


class TestChartManagerChartIds:
    """Test chart ID management."""

    def test_get_chart_ids(self):
        """Test getting all chart IDs."""
        manager = ChartManager()

        # Initially empty
        assert manager.get_chart_ids() == []

        # Add charts
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])

        manager.add_chart(chart1, "chart1")
        manager.add_chart(chart2, "chart2")

        chart_ids = manager.get_chart_ids()
        assert len(chart_ids) == 2
        assert "chart1" in chart_ids
        assert "chart2" in chart_ids


class TestChartManagerClear:
    """Test clearing the manager."""

    def test_clear_charts(self):
        """Test clearing all charts from the manager."""
        manager = ChartManager()

        # Add charts and sync options
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])

        manager.add_chart(chart1, "chart1")
        manager.add_chart(chart2, "chart2")
        manager.set_sync_group_config("group1", SyncOptions(enabled=True))

        result = manager.clear_charts()

        assert result is manager
        assert len(manager.charts) == 0
        # sync_groups should remain (they're not cleared)
        assert len(manager.sync_groups) == 1


class TestChartManagerSyncMethods:
    """Test sync methods."""

    def test_enable_crosshair_sync_default(self):
        """Test enabling crosshair sync for default."""
        manager = ChartManager()

        result = manager.enable_crosshair_sync()

        assert result is manager
        assert manager.default_sync.crosshair is True
        assert manager.default_sync.enabled is True

    def test_enable_crosshair_sync_group(self):
        """Test enabling crosshair sync for specific group."""
        manager = ChartManager()

        result = manager.enable_crosshair_sync("test_group")

        assert result is manager
        assert "test_group" in manager.sync_groups
        assert manager.sync_groups["test_group"].crosshair is True
        assert manager.sync_groups["test_group"].enabled is True

    def test_disable_crosshair_sync_default(self):
        """Test disabling crosshair sync for default."""
        manager = ChartManager()
        manager.default_sync.enable_crosshair()

        result = manager.disable_crosshair_sync()

        assert result is manager
        assert manager.default_sync.crosshair is False

    def test_enable_time_range_sync_default(self):
        """Test enabling time range sync for default."""
        manager = ChartManager()

        result = manager.enable_time_range_sync()

        assert result is manager
        assert manager.default_sync.time_range is True
        assert manager.default_sync.enabled is True

    def test_disable_time_range_sync_default(self):
        """Test disabling time range sync for default."""
        manager = ChartManager()
        manager.default_sync.enable_time_range()

        result = manager.disable_time_range_sync()

        assert result is manager
        assert manager.default_sync.time_range is False
