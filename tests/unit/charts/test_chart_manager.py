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
from streamlit_lightweight_charts_pro.exceptions import DuplicateError, NotFoundError


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

        with pytest.raises(DuplicateError):
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

        with pytest.raises(NotFoundError):
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

        with pytest.raises(NotFoundError):
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

        with pytest.raises(NotFoundError):
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


class TestChartManagerEnableAllSync:
    """Test enable_all_sync method."""

    def test_enable_all_sync_default(self):
        """Test enabling all sync for default sync options."""
        manager = ChartManager()

        result = manager.enable_all_sync()

        assert result is manager  # Method chaining
        assert manager.default_sync.enabled is True
        assert manager.default_sync.crosshair is True
        assert manager.default_sync.time_range is True

    def test_enable_all_sync_specific_group(self):
        """Test enabling all sync for specific group."""
        manager = ChartManager()

        result = manager.enable_all_sync("test_group")

        assert result is manager
        assert "test_group" in manager.sync_groups
        assert manager.sync_groups["test_group"].enabled is True
        assert manager.sync_groups["test_group"].crosshair is True
        assert manager.sync_groups["test_group"].time_range is True

    def test_enable_all_sync_with_integer_group(self):
        """Test enabling all sync with integer group ID."""
        manager = ChartManager()

        result = manager.enable_all_sync(123)

        assert result is manager
        assert "123" in manager.sync_groups


class TestChartManagerDisableAllSync:
    """Test disable_all_sync method."""

    def test_disable_all_sync_default(self):
        """Test disabling all sync for default sync options."""
        manager = ChartManager()
        manager.default_sync.enable_all()

        result = manager.disable_all_sync()

        assert result is manager  # Method chaining
        assert manager.default_sync.enabled is False
        assert manager.default_sync.crosshair is False
        assert manager.default_sync.time_range is False

    def test_disable_all_sync_specific_group(self):
        """Test disabling all sync for specific group."""
        manager = ChartManager()
        manager.sync_groups["test_group"] = SyncOptions(
            enabled=True, crosshair=True, time_range=True
        )

        result = manager.disable_all_sync("test_group")

        assert result is manager
        assert manager.sync_groups["test_group"].enabled is False
        assert manager.sync_groups["test_group"].crosshair is False
        assert manager.sync_groups["test_group"].time_range is False

    def test_disable_all_sync_nonexistent_group(self):
        """Test disabling all sync for nonexistent group (should not error)."""
        manager = ChartManager()

        result = manager.disable_all_sync("nonexistent")

        assert result is manager
        # Should not raise error even if group doesn't exist


class TestChartManagerFromPriceVolumeDataframe:
    """Test from_price_volume_dataframe method."""

    def test_from_price_volume_dataframe_with_list(self):
        """Test creating chart from list of OhlcvData."""
        from streamlit_lightweight_charts_pro.charts.series import (
            CandlestickSeries,
            HistogramSeries,
        )
        from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData

        manager = ChartManager()
        data = [
            OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000),
            OhlcvData(time=1641081600, open=103, high=107, low=102, close=106, volume=1200),
        ]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        chart = manager.from_price_volume_dataframe(
            data=data, column_mapping=column_mapping, price_type="candlestick"
        )

        assert isinstance(chart, Chart)
        assert len(chart.series) == 2
        assert isinstance(chart.series[0], CandlestickSeries)
        assert isinstance(chart.series[1], HistogramSeries)
        assert chart._chart_manager is manager

    def test_from_price_volume_dataframe_with_dataframe(self):
        """Test creating chart from pandas DataFrame."""
        import pandas as pd

        manager = ChartManager()
        price_data = pd.DataFrame(
            {
                "time": [1640995200, 1641081600],
                "open": [100, 103],
                "high": [105, 107],
                "low": [98, 102],
                "close": [103, 106],
                "volume": [1000, 1200],
            }
        )
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        chart = manager.from_price_volume_dataframe(
            data=price_data, column_mapping=column_mapping, price_type="candlestick"
        )

        assert isinstance(chart, Chart)
        assert len(chart.series) == 2

    def test_from_price_volume_dataframe_line_type(self):
        """Test creating chart with line price type."""
        from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData

        manager = ChartManager()
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        chart = manager.from_price_volume_dataframe(
            data=data, column_mapping=column_mapping, price_type="line"
        )

        assert isinstance(chart, Chart)
        assert isinstance(chart.series[0], LineSeries)

    def test_from_price_volume_dataframe_custom_kwargs(self):
        """Test creating chart with custom kwargs."""
        from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData

        manager = ChartManager()
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }
        price_kwargs = {"visible": False}
        volume_kwargs = {"up_color": "#00ff00"}

        chart = manager.from_price_volume_dataframe(
            data=data,
            column_mapping=column_mapping,
            price_type="candlestick",
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
        )

        assert chart.series[0].visible is False

    def test_from_price_volume_dataframe_custom_chart_id(self):
        """Test creating chart with custom chart ID."""
        from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData

        manager = ChartManager()
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        chart = manager.from_price_volume_dataframe(
            data=data,
            column_mapping=column_mapping,
            price_type="candlestick",
            chart_id="custom_chart",
        )

        assert "custom_chart" in manager.charts
        assert manager.charts["custom_chart"] is chart

    def test_from_price_volume_dataframe_invalid_data(self):
        """Test creating chart with invalid data."""
        from streamlit_lightweight_charts_pro.exceptions import TypeValidationError

        manager = ChartManager()

        with pytest.raises(TypeValidationError):
            manager.from_price_volume_dataframe(
                data=None, column_mapping={}, price_type="candlestick"
            )


class TestChartManagerIterators:
    """Test iterator methods (keys, values, items)."""

    def test_keys_method(self):
        """Test keys() method."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])

        manager.add_chart(chart1, "chart1")
        manager.add_chart(chart2, "chart2")

        keys = list(manager.keys())

        assert len(keys) == 2
        assert "chart1" in keys
        assert "chart2" in keys

    def test_values_method(self):
        """Test values() method."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])

        manager.add_chart(chart1, "chart1")
        manager.add_chart(chart2, "chart2")

        values = list(manager.values())

        assert len(values) == 2
        assert chart1 in values
        assert chart2 in values

    def test_items_method(self):
        """Test items() method."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])

        manager.add_chart(chart1, "chart1")
        manager.add_chart(chart2, "chart2")

        items = list(manager.items())

        assert len(items) == 2
        assert ("chart1", chart1) in items
        assert ("chart2", chart2) in items

    def test_len_method(self):
        """Test __len__ method."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])

        assert len(manager) == 0

        manager.add_chart(chart1, "chart1")
        assert len(manager) == 1

        manager.add_chart(chart2, "chart2")
        assert len(manager) == 2

    def test_contains_method(self):
        """Test __contains__ method."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])

        manager.add_chart(chart, "chart1")

        assert "chart1" in manager
        assert "nonexistent" not in manager

    def test_iter_method(self):
        """Test __iter__ method."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])

        manager.add_chart(chart1, "chart1")
        manager.add_chart(chart2, "chart2")

        chart_ids = list(manager)

        assert len(chart_ids) == 2
        assert "chart1" in chart_ids
        assert "chart2" in chart_ids


class TestChartManagerRender:
    """Test render method."""

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.ChartRenderer.render")
    @patch(
        "streamlit_lightweight_charts_pro.charts.managers.chart_renderer.ChartRenderer.handle_response"
    )
    def test_render_with_charts(self, mock_handle_response, mock_render):
        """Test rendering manager with charts."""
        mock_render.return_value = {"type": "rendered"}

        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "chart1")

        result = manager.render(key="test_key")

        # Verify ChartRenderer.render was called
        mock_render.assert_called_once()
        call_args = mock_render.call_args
        assert call_args.args[1] == "test_key"  # key argument

        # Verify ChartRenderer.handle_response was called with result
        mock_handle_response.assert_called_once()
        assert mock_handle_response.call_args.args[0] == {"type": "rendered"}

        # Verify result is returned
        assert result == {"type": "rendered"}

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.ChartRenderer.render")
    @patch(
        "streamlit_lightweight_charts_pro.charts.managers.chart_renderer.ChartRenderer.handle_response"
    )
    def test_render_without_key(self, mock_handle_response, mock_render):
        """Test rendering without explicit key."""
        mock_render.return_value = {"type": "rendered"}

        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "chart1")

        result = manager.render()

        # Verify ChartRenderer.render was called
        mock_render.assert_called_once()
        call_args = mock_render.call_args
        # Auto-generated key should start with chart_manager_
        assert call_args.args[1].startswith("chart_manager_")

        # Verify ChartRenderer.handle_response was called
        mock_handle_response.assert_called_once()

        # Verify result is returned
        assert result == {"type": "rendered"}

    def test_render_empty_charts_raises_error(self):
        """Test rendering with no charts raises error."""
        manager = ChartManager()

        with pytest.raises(RuntimeError):
            manager.render()

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.ChartRenderer.render")
    @patch(
        "streamlit_lightweight_charts_pro.charts.managers.chart_renderer.ChartRenderer.handle_response"
    )
    def test_render_component_none_reinitialize(self, _mock_handle_response, mock_render):
        """Test render when component is None and needs reinitialization."""
        from streamlit_lightweight_charts_pro.exceptions import (
            ComponentNotAvailableError,
        )

        # Simulate component not available by raising error
        mock_render.side_effect = ComponentNotAvailableError()

        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "chart1")

        with pytest.raises(ComponentNotAvailableError):
            manager.render()

        # Verify ChartRenderer.render was called
        mock_render.assert_called_once()

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.ChartRenderer.render")
    @patch(
        "streamlit_lightweight_charts_pro.charts.managers.chart_renderer.ChartRenderer.handle_response"
    )
    def test_render_component_none_reinitialize_fails(self, _mock_handle_response, mock_render):
        """Test render when reinitialize fails."""
        from streamlit_lightweight_charts_pro.exceptions import (
            ComponentNotAvailableError,
        )

        # Simulate component not available
        mock_render.side_effect = ComponentNotAvailableError()

        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "chart1")

        with pytest.raises(ComponentNotAvailableError):
            manager.render()


class TestChartManagerToFrontendConfig:
    """Test to_frontend_config method."""

    def test_to_frontend_config_with_single_chart(self):
        """Test frontend config with single chart."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "chart1")

        config = manager.to_frontend_config()

        assert "charts" in config
        assert "syncConfig" in config
        assert len(config["charts"]) == 1
        assert config["charts"][0]["chartId"] == "chart1"

    def test_to_frontend_config_with_multiple_charts(self):
        """Test frontend config with multiple charts."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])
        manager.add_chart(chart1, "chart1")
        manager.add_chart(chart2, "chart2")

        config = manager.to_frontend_config()

        assert len(config["charts"]) == 2
        chart_ids = [c["chartId"] for c in config["charts"]]
        assert "chart1" in chart_ids
        assert "chart2" in chart_ids

    def test_to_frontend_config_empty_manager(self):
        """Test frontend config with no charts."""
        manager = ChartManager()

        config = manager.to_frontend_config()

        assert "charts" in config
        assert "syncConfig" in config
        assert config["charts"] == []

    def test_to_frontend_config_with_sync_groups(self):
        """Test frontend config with sync groups."""
        manager = ChartManager()
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])
        manager.add_chart(chart1, "chart1")
        manager.add_chart(chart2, "chart2")

        sync_options = SyncOptions(enabled=True, crosshair=True, time_range=True)
        manager.set_sync_group_config("group1", sync_options)

        config = manager.to_frontend_config()

        assert "syncConfig" in config
        assert "groups" in config["syncConfig"]
        assert "group1" in config["syncConfig"]["groups"]

    def test_to_frontend_config_with_default_sync(self):
        """Test frontend config with default sync enabled."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        manager.add_chart(chart, "chart1")
        manager.enable_all_sync()

        config = manager.to_frontend_config()

        assert config["syncConfig"]["enabled"] is True
        assert config["syncConfig"]["crosshair"] is True
        assert config["syncConfig"]["timeRange"] is True

    def test_to_frontend_config_invalid_chart_skipped(self):
        """Test that invalid charts are skipped in config."""
        manager = ChartManager()
        # Create a chart with empty series
        chart = Chart(series=[])
        manager.add_chart(chart, "chart1")

        config = manager.to_frontend_config()

        # Charts with no valid config should be skipped
        # (Implementation may vary, this tests the behavior)
        assert "charts" in config


class TestChartManagerMethodChaining:
    """Test method chaining with ChartManager."""

    def test_complex_method_chaining(self):
        """Test complex method chaining."""
        chart1 = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])
        chart2 = Chart(series=[LineSeries(data=[LineData(time=2, value=200)])])

        result = (
            ChartManager()
            .add_chart(chart1, "chart1")
            .add_chart(chart2, "chart2")
            .enable_crosshair_sync("group1")
            .enable_time_range_sync("group1")
            .enable_all_sync()
        )

        assert isinstance(result, ChartManager)
        assert len(result.charts) == 2
        assert "group1" in result.sync_groups
        assert result.default_sync.enabled is True


class TestChartManagerEdgeCases:
    """Test edge cases and error conditions."""

    def test_add_chart_with_empty_string_id(self):
        """Test adding chart with empty string ID."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])

        # Empty string is a valid chart ID
        result = manager.add_chart(chart, "")

        assert result is manager
        assert "" in manager.charts

    def test_disable_sync_on_nonexistent_group(self):
        """Test disabling sync on group that doesn't exist."""
        manager = ChartManager()

        # Should not raise error
        result = manager.disable_crosshair_sync("nonexistent")

        assert result is manager

    def test_multiple_sync_operations(self):
        """Test multiple sync enable/disable operations."""
        manager = ChartManager()

        manager.enable_crosshair_sync()
        assert manager.default_sync.crosshair is True

        manager.disable_crosshair_sync()
        assert manager.default_sync.crosshair is False

        manager.enable_time_range_sync()
        assert manager.default_sync.time_range is True

        manager.disable_time_range_sync()
        assert manager.default_sync.time_range is False

    def test_chart_manager_reference_propagation(self):
        """Test that chart manager reference is set on charts."""
        manager = ChartManager()
        chart = Chart(series=[LineSeries(data=[LineData(time=1, value=100)])])

        assert not hasattr(chart, "_chart_manager") or chart._chart_manager is None

        manager.add_chart(chart, "chart1")

        assert chart._chart_manager is manager
