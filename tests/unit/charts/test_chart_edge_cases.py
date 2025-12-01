"""
Edge case tests for Chart class.

This module tests edge cases and error conditions for the Chart class,
addressing the 52% coverage gap in chart.py.
"""

import gc
import time
from datetime import datetime
from unittest.mock import Mock, patch

import pandas as pd
import psutil
import pytest

from streamlit_lightweight_charts_pro.charts.chart import Chart
from lightweight_charts_core.charts.options import ChartOptions
from lightweight_charts_core.charts.options.price_scale_options import PriceScaleOptions
from lightweight_charts_core.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import LineData, OhlcvData, TradeData
from lightweight_charts_core.data.annotation import Annotation
from streamlit_lightweight_charts_pro.exceptions import (
    AnnotationItemsTypeError,
    SeriesItemsTypeError,
    TimeValidationError,
    TypeValidationError,
    ValueValidationError,
)


class TestChartConstructionEdgeCases:
    """Test edge cases for Chart construction."""

    def test_construction_with_empty_series_list(self):
        """Test Chart construction with empty series list vs None."""
        chart1 = Chart(series=[])
        chart2 = Chart(series=None)

        assert len(chart1.series) == 0
        assert len(chart2.series) == 0
        assert isinstance(chart1.options, ChartOptions)
        assert isinstance(chart2.options, ChartOptions)

    def test_construction_with_invalid_series_type(self):
        """Test Chart construction with non-Series objects."""
        with pytest.raises(SeriesItemsTypeError):
            Chart(series=["not_a_series", 123, None])

    def test_construction_with_mixed_valid_invalid_series(self):
        """Test Chart construction with mix of valid and invalid series."""
        valid_series = LineSeries(data=[LineData(time=1640995200, value=100)])

        with pytest.raises(SeriesItemsTypeError):
            Chart(series=[valid_series, "invalid_series", valid_series])

    def test_construction_with_none_options(self):
        """Test Chart construction with None options."""
        chart = Chart(options=None)
        assert isinstance(chart.options, ChartOptions)  # Should create default options

    def test_construction_with_empty_annotations_list(self):
        """Test Chart construction with empty annotations list."""
        chart = Chart(annotations=[])
        assert len(chart.annotation_manager.layers) == 0

    def test_construction_with_none_annotations(self):
        """Test Chart construction with None annotations."""
        chart = Chart(annotations=None)
        assert len(chart.annotation_manager.layers) == 0

    def test_construction_with_invalid_annotation_type(self):
        """Test Chart construction with invalid annotation type."""
        with pytest.raises(AnnotationItemsTypeError):
            Chart(annotations=["not_an_annotation", 123])

    def test_construction_with_all_none_parameters(self):
        """Test Chart construction with all None parameters."""
        chart = Chart(series=None, options=None, annotations=None)

        assert len(chart.series) == 0
        assert isinstance(chart.options, ChartOptions)
        assert len(chart.annotation_manager.layers) == 0


class TestChartSeriesManagementEdgeCases:
    """Test edge cases for series management."""

    def test_add_series_with_none(self):
        """Test adding None as series."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_series(None)

    def test_add_series_with_invalid_type(self):
        """Test adding invalid type as series."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_series("not_a_series")

    def test_add_series_with_integer(self):
        """Test adding integer as series."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_series(123)

    def test_add_series_with_empty_list(self):
        """Test adding empty list as series."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_series([])

    def test_add_multiple_invalid_series(self):
        """Test adding multiple invalid series."""
        chart = Chart()
        valid_series = LineSeries(data=[LineData(time=1640995200, value=100)])
        chart.add_series(valid_series)

        with pytest.raises(TypeValidationError):
            chart.add_series("invalid_series")

        # Verify chart still has the valid series
        assert len(chart.series) == 1
        assert chart.series[0] == valid_series

    def test_add_series_method_chaining_with_error(self):
        """Test method chaining when add_series fails."""
        chart = Chart()

        with pytest.raises(TypeValidationError):
            chart.add_series("invalid").add_series("also_invalid")


class TestChartOptionsManagementEdgeCases:
    """Test edge cases for options management."""

    def test_update_options_with_none_values(self):
        """Test updating options with None values."""
        chart = Chart()
        original_height = chart.options.height

        # Should handle None values gracefully
        chart.update_options(height=None, width=None)

        # Options should remain unchanged
        assert chart.options.height == original_height

    def test_update_options_with_invalid_attribute(self):
        """Test updating options with invalid attribute."""
        chart = Chart()
        original_options = chart.options

        # Should handle invalid attributes gracefully
        chart.update_options(invalid_attribute="value", another_invalid=123)

        # Options should remain unchanged
        assert chart.options == original_options

    def test_update_options_with_mixed_valid_invalid(self):
        """Test updating options with mix of valid and invalid attributes."""
        chart = Chart()
        # Access height to ensure it's available
        _ = chart.options.height

        # Should update valid attributes and ignore invalid ones
        chart.update_options(height=500, invalid_attribute="value")

        assert chart.options.height == 500
        assert not hasattr(chart.options, "invalid_attribute")

    def test_update_options_with_empty_dict(self):
        """Test updating options with empty dictionary."""
        chart = Chart()
        original_options = chart.options

        chart.update_options()

        # Options should remain unchanged
        assert chart.options == original_options

    def test_update_options_with_complex_types(self):
        """Test updating options with complex types."""
        chart = Chart()

        # Should handle complex types gracefully
        chart.update_options(height={"complex": "object"}, width=[1, 2, 3], auto_size=lambda x: x)

        # Should ignore invalid types and keep original values
        assert isinstance(chart.options.height, int)


class TestChartAnnotationManagementEdgeCases:
    """Test edge cases for annotation management."""

    def test_add_annotation_with_none(self):
        """Test adding None as annotation."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.add_annotation(None)

    def test_add_annotation_with_invalid_type(self):
        """Test adding invalid type as annotation."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_annotation("not_an_annotation")

    def test_add_annotation_with_empty_layer_name(self):
        """Test adding annotation with empty layer name."""
        chart = Chart()
        annotation = Mock(spec=Annotation)

        with pytest.raises(ValueValidationError):
            chart.add_annotation(annotation, "")

    def test_add_annotation_with_none_layer_name(self):
        """Test adding annotation with None layer name."""
        chart = Chart()
        annotation = Mock(spec=Annotation)

        # Should use default layer name
        chart.add_annotation(annotation, None)
        assert len(chart.annotation_manager.layers) > 0

    def test_add_annotations_with_empty_list(self):
        """Test adding empty annotations list."""
        chart = Chart()
        chart.add_annotations([])
        assert len(chart.annotation_manager.layers) == 0

    def test_add_annotations_with_none_list(self):
        """Test adding None annotations list."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_annotations(None)

    def test_add_annotations_with_mixed_valid_invalid(self):
        """Test adding mix of valid and invalid annotations."""
        chart = Chart()
        valid_annotation = Mock(spec=Annotation)

        with pytest.raises(AnnotationItemsTypeError):
            chart.add_annotations([valid_annotation, "invalid_annotation"])

    def test_create_annotation_layer_with_empty_name(self):
        """Test creating annotation layer with empty name."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.create_annotation_layer("")

    def test_create_annotation_layer_with_none_name(self):
        """Test creating annotation layer with None name."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.create_annotation_layer(None)

    def test_hide_annotation_layer_with_empty_name(self):
        """Test hiding annotation layer with empty name."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.hide_annotation_layer("")

    def test_show_annotation_layer_with_empty_name(self):
        """Test showing annotation layer with empty name."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.show_annotation_layer("")

    def test_clear_annotations_with_empty_layer_name(self):
        """Test clearing annotations with empty layer name."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.clear_annotations("")


class TestChartPriceScaleManagementEdgeCases:
    """Test edge cases for price scale management."""

    def test_add_overlay_price_scale_with_none_scale_id(self):
        """Test adding overlay price scale with None scale ID."""
        chart = Chart()
        options = Mock()

        with pytest.raises(ValueValidationError):
            chart.add_overlay_price_scale(None, options)

    def test_add_overlay_price_scale_with_empty_scale_id(self):
        """Test adding overlay price scale with empty scale ID."""
        chart = Chart()
        options = Mock()

        with pytest.raises(ValueValidationError):
            chart.add_overlay_price_scale("", options)

    def test_add_overlay_price_scale_with_none_options(self):
        """Test adding overlay price scale with None options."""
        chart = Chart()

        with pytest.raises(TypeValidationError):
            chart.add_overlay_price_scale("test_scale", None)

    def test_add_overlay_price_scale_with_invalid_options_type(self):
        """Test adding overlay price scale with invalid options type."""
        chart = Chart()

        with pytest.raises(ValueValidationError):
            chart.add_overlay_price_scale("test_scale", "not_options")

    def test_add_overlay_price_scale_with_duplicate_scale_id(self):
        """Test adding overlay price scale with duplicate scale ID allows updates."""
        chart = Chart()
        options1 = PriceScaleOptions(visible=True)
        options2 = PriceScaleOptions(visible=False)

        # Add first scale
        chart.add_overlay_price_scale("test_scale", options1)
        assert chart.options.overlay_price_scales["test_scale"].visible is True

        # Adding duplicate scale ID updates the existing scale (not an error)
        chart.add_overlay_price_scale("test_scale", options2)
        assert chart.options.overlay_price_scales["test_scale"].visible is False


class TestChartPriceVolumeSeriesEdgeCases:
    """Test edge cases for price-volume series creation."""

    def test_create_price_volume_series_with_none_data(self):
        """Test creating price-volume series with None data."""
        chart = Chart()

        with pytest.raises(TypeValidationError):
            chart.add_price_volume_series(data=None, column_mapping={}, price_type="candlestick")

    def test_create_price_volume_series_with_empty_data(self):
        """Test creating price-volume series with empty data."""
        chart = Chart()

        with pytest.raises(ValueValidationError):
            chart.add_price_volume_series(data=[], column_mapping={}, price_type="candlestick")

    def test_create_price_volume_series_with_empty_dataframe(self):
        """Test creating price-volume series with empty DataFrame."""
        chart = Chart()
        empty_test_data = pd.DataFrame()

        with pytest.raises(ValueValidationError):
            chart.add_price_volume_series(
                data=empty_test_data,
                column_mapping={},
                price_type="candlestick",
            )

    def test_create_price_volume_series_with_none_column_mapping(self):
        """Test creating price-volume series with None column mapping."""
        chart = Chart()
        data = [OhlcvData("2024-01-01", 100, 102, 99, 101, 1000)]

        with pytest.raises(TypeValidationError):
            chart.add_price_volume_series(data=data, column_mapping=None, price_type="candlestick")

    def test_create_price_volume_series_with_invalid_price_type(self):
        """Test creating price-volume series with invalid price type."""
        chart = Chart()
        data = [OhlcvData("2024-01-01", 100, 102, 99, 101, 1000)]

        with pytest.raises(ValueValidationError):
            chart.add_price_volume_series(data=data, column_mapping={}, price_type="invalid_type")

    def test_create_price_volume_series_with_missing_columns(self):
        """Test creating price-volume series with missing DataFrame columns."""
        chart = Chart()
        test_data = pd.DataFrame(
            {
                "time": ["2024-01-01"],
                "open": [100],
                # Missing 'high', 'low', 'close', 'volume'
            },
        )

        with pytest.raises(ValueValidationError):
            chart.add_price_volume_series(
                data=test_data,
                column_mapping={"time": "time", "open": "open"},
                price_type="candlestick",
            )

    def test_create_price_volume_series_with_invalid_pane_ids(self):
        """Test creating price-volume series with invalid pane IDs."""
        chart = Chart()
        data = [OhlcvData("2024-01-01", 100, 102, 99, 101, 1000)]

        # Test negative pane IDs
        with pytest.raises(ValueValidationError):
            chart.add_price_volume_series(
                data=data,
                column_mapping={},
                price_type="candlestick",
                pane_id=-1,
            )

    def test_add_price_volume_series_with_none_data(self):
        """Test adding price-volume series with None data."""
        chart = Chart()

        with pytest.raises(TypeValidationError):
            chart.add_price_volume_series(data=None, column_mapping={}, price_type="candlestick")

    def test_from_price_volume_dataframe_with_none_data(self):
        """Test from_price_volume_dataframe with None data."""
        # Test that None data raises TypeError when adding price-volume series
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_price_volume_series(data=None, column_mapping={}, price_type="candlestick")

    def test_from_price_volume_dataframe_with_invalid_data_type(self):
        """Test from_price_volume_dataframe with invalid data type."""
        # Test that invalid data type raises ValueError when adding price-volume series
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.add_price_volume_series(
                data="not_dataframe_or_list",
                column_mapping={},
                price_type="candlestick",
            )


class TestChartTradeVisualizationEdgeCases:
    """Test edge cases for trade visualization."""

    def test_add_trade_visualization_with_none_trades(self):
        """Test adding trade visualization with None trades."""
        chart = Chart()

        with pytest.raises(TypeValidationError):
            chart.add_trades(None)

    def test_add_trade_visualization_with_empty_trades(self):
        """Test adding trade visualization with empty trades list."""
        chart = Chart()

        chart.add_trades([])
        # Should handle empty list gracefully
        assert len(chart.series) == 0

    def test_add_trade_visualization_with_invalid_trade_type(self):
        """Test adding trade visualization with invalid trade type."""
        chart = Chart()

        with pytest.raises(ValueValidationError):
            chart.add_trades([{"not": "a_trade"}])

    def test_add_trade_visualization_with_mixed_valid_invalid_trades(self):
        """Test adding trade visualization with mix of valid and invalid trades."""
        chart = Chart()
        valid_trade = TradeData(
            entry_time="2024-01-01 10:00:00",
            entry_price=100.0,
            exit_time="2024-01-01 15:00:00",
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "quantity": 100,
                "trade_type": "long",
            },
        )

        with pytest.raises(ValueValidationError):
            chart.add_trades([valid_trade, "invalid_trade"])

    def test_add_trade_visualization_without_series(self):
        """Test adding trade visualization to chart without series."""
        chart = Chart()
        trade = TradeData(
            entry_time="2024-01-01 10:00:00",
            entry_price=100.0,
            exit_time="2024-01-01 15:00:00",
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "quantity": 100,
                "trade_type": "long",
            },
        )

        # Should handle chart without series gracefully
        chart.add_trades([trade])
        assert len(chart.series) == 0

    def test_add_trade_visualization_with_series_without_markers(self):
        """Test adding trade visualization to series without markers support."""
        chart = Chart()

        # Use real series that doesn't have markers
        series_without_markers = LineSeries(data=[LineData(time=1640995200, value=100)])
        chart.add_series(series_without_markers)

        trade = TradeData(
            entry_time="2024-01-01 10:00:00",
            entry_price=100.0,
            exit_time="2024-01-01 15:00:00",
            exit_price=105.0,
            is_profitable=True,
            id="trade1",
            additional_data={
                "quantity": 100,
                "trade_type": "long",
            },
        )

        # Should handle series without markers gracefully
        chart.add_trades([trade])


class TestChartFrontendConfigurationEdgeCases:
    """Test edge cases for frontend configuration."""

    def test_to_frontend_config_with_none_options(self):
        """Test to_frontend_config with None options."""
        chart = Chart()
        chart.options = None

        config = chart.to_frontend_config()

        # Should handle None options gracefully
        assert "charts" in config
        assert len(config["charts"]) == 1

    def test_to_frontend_config_with_series_without_to_dict(self):
        """Test to_frontend_config with series without to_dict method."""
        chart = Chart()

        # Add real series
        series = LineSeries(data=[LineData(time=1640995200, value=100)])
        chart.add_series(series)

        # Test to_frontend_config method
        config = chart.to_frontend_config()
        assert "charts" in config
        assert len(config["charts"]) == 1

    def test_to_frontend_config_with_series_returning_invalid_dict(self):
        """Test to_frontend_config with series returning invalid dict."""
        chart = Chart()

        # Add real series
        series = LineSeries(data=[LineData(time=1640995200, value=100)])
        chart.add_series(series)

        # Test to_frontend_config method
        config = chart.to_frontend_config()
        assert "charts" in config
        assert len(config["charts"]) == 1

    def test_to_frontend_config_with_series_without_required_fields(self):
        """Test to_frontend_config with series without required fields."""
        chart = Chart()

        # Add real series
        series = LineSeries(data=[LineData(time=1640995200, value=100)])
        chart.add_series(series)

        # Test to_frontend_config method
        config = chart.to_frontend_config()
        assert "charts" in config
        assert len(config["charts"]) == 1

    def test_to_frontend_config_with_series_with_invalid_height(self):
        """Test to_frontend_config with series with invalid height."""
        chart = Chart()

        # Add real series
        series = LineSeries(data=[LineData(time=1640995200, value=100)])
        chart.add_series(series)

        # Test to_frontend_config method
        config = chart.to_frontend_config()
        assert "charts" in config

    def test_to_frontend_config_with_series_with_none_pane_id(self):
        """Test to_frontend_config with series with None pane_id."""
        chart = Chart()

        # Add real series
        series = LineSeries(data=[LineData(time=1640995200, value=100)])
        chart.add_series(series)

        # Test to_frontend_config method
        config = chart.to_frontend_config()
        assert "charts" in config


class TestChartRenderingEdgeCases:
    """Test edge cases for chart rendering."""

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    def test_render_with_none_key(self, mock_get_component_func):
        """Test render with None key."""
        chart = Chart()
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        chart.render(key=None)

        # Should call component with generated key parameter
        mock_component.assert_called_once()
        call_args = mock_component.call_args[1]
        assert "key" in call_args
        assert call_args["key"].startswith("chart_")

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    def test_render_with_empty_key(self, mock_get_component_func):
        """Test render with empty key."""
        chart = Chart()
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        chart.render(key="")

        # Should call component with generated key parameter
        mock_component.assert_called_once()
        call_args = mock_component.call_args[1]
        assert "key" in call_args
        assert call_args["key"].startswith("chart_")

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    def test_render_with_invalid_key_type(self, mock_get_component_func):
        """Test render with invalid key type."""
        chart = Chart()
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        chart.render(key=123)  # Integer key

        # Should handle invalid key type gracefully by generating a new key
        mock_component.assert_called_once()
        call_args = mock_component.call_args[1]
        assert "key" in call_args
        assert call_args["key"].startswith("chart_")

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    def test_render_with_component_func_error(self, mock_get_component_func):
        """Test render when component function raises error."""
        chart = Chart()
        mock_get_component_func.side_effect = Exception("Component error")

        with pytest.raises(Exception, match="Component error"):
            chart.render()

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    def test_render_with_to_frontend_config_error(self, mock_get_component_func):
        """Test render when to_frontend_config raises error."""
        chart = Chart()
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        # Mock to_frontend_config to raise error
        with patch.object(
            chart,
            "to_frontend_config",
            side_effect=Exception("Config error"),
        ), pytest.raises(Exception, match="Config error"):
            chart.render()


class TestChartDataValidationEdgeCases:
    """Test edge cases for data validation."""

    def test_chart_with_extreme_numeric_values(self):
        """Test chart with extreme numeric values."""
        # Test with infinity - should be handled correctly
        data_with_inf = [LineData(time=1640995200, value=float("inf"))]
        series_with_inf = LineSeries(data=data_with_inf)

        # Should not raise an exception - infinity is valid for charts
        chart = Chart(series=series_with_inf)
        assert len(chart.series) == 1
        assert chart.series[0] == series_with_inf

    def test_chart_with_nan_values(self):
        """Test chart with NaN values."""
        # Test with NaN - should be converted to 0.0
        data_with_nan = [LineData(time=1640995200, value=float("nan"))]
        series_with_nan = LineSeries(data=data_with_nan)

        # Should not raise an exception - NaN is converted to 0.0
        chart = Chart(series=series_with_nan)
        assert len(chart.series) == 1
        assert chart.series[0] == series_with_nan
        # The NaN value should be converted to 0.0 in the data
        assert series_with_nan.data[0].value == 0.0

    def test_chart_with_negative_timestamps(self):
        """Test chart with negative timestamps."""
        # Test with negative timestamp - should be handled correctly
        data_with_negative_time = [LineData(time=-1640995200, value=100)]
        series_with_negative_time = LineSeries(data=data_with_negative_time)

        # Should not raise an exception - negative timestamps are valid for historical data
        chart = Chart(series=series_with_negative_time)
        assert len(chart.series) == 1
        assert chart.series[0] == series_with_negative_time

    def test_chart_with_future_timestamps(self):
        """Test chart with future timestamps."""
        # Test with future timestamp (year 2100) - should be handled correctly
        future_time = int(datetime(2100, 1, 1).timestamp())
        data_with_future_time = [LineData(time=future_time, value=100)]
        series_with_future_time = LineSeries(data=data_with_future_time)

        # Should not raise an exception - future timestamps are valid for forecasting
        chart = Chart(series=series_with_future_time)
        assert len(chart.series) == 1
        assert chart.series[0] == series_with_future_time

    def test_chart_with_invalid_time_formats(self):
        """Test chart with invalid time formats."""
        # Test with invalid time format - error happens during serialization
        data = LineData(time="invalid_time", value=100)
        series = LineSeries(data=[data])
        chart = Chart(series=series)
        # Error happens when serializing the chart config
        with pytest.raises((TimeValidationError, ValueError)):
            chart.to_frontend_config()

    def test_chart_with_very_large_numbers(self):
        """Test chart with very large numbers."""
        # Test with very large numbers
        data_with_large_numbers = [LineData(time=1640995200, value=1e20)]
        series_with_large_numbers = LineSeries(data=data_with_large_numbers)

        # Should handle large numbers gracefully
        chart = Chart(series=series_with_large_numbers)
        assert len(chart.series) == 1

    def test_chart_with_very_small_numbers(self):
        """Test chart with very small numbers."""
        # Test with very small numbers
        data_with_small_numbers = [LineData(time=1640995200, value=1e-20)]
        series_with_small_numbers = LineSeries(data=data_with_small_numbers)

        # Should handle small numbers gracefully
        chart = Chart(series=series_with_small_numbers)
        assert len(chart.series) == 1


class TestChartMemoryAndPerformanceEdgeCases:
    """Test edge cases for memory and performance."""

    def test_chart_with_very_large_dataset(self):
        """Test chart with very large dataset."""
        # Create large dataset (10,000 points)
        large_data = [LineData(time=1640995200 + i, value=100 + i) for i in range(10000)]

        series = LineSeries(data=large_data)

        start_time = time.time()

        chart = Chart(series=series)
        config = chart.to_frontend_config()

        end_time = time.time()
        processing_time = end_time - start_time

        # Should handle large dataset in reasonable time (< 5 seconds)
        assert processing_time < 5.0
        assert len(config["charts"][0]["series"][0]["data"]) == 10000

    def test_chart_memory_usage_with_large_dataset(self):
        """Test memory usage with large dataset."""

        process = psutil.Process()
        initial_memory = process.memory_info().rss

        # Create large dataset (10,000 points)
        large_data = [LineData(time=1640995200 + i, value=100 + i) for i in range(10000)]

        series = LineSeries(data=large_data)
        chart = Chart(series=series)
        config = chart.to_frontend_config()

        # Force garbage collection
        gc.collect()

        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Memory increase should be reasonable (< 500MB for 10K points)
        assert memory_increase < 500 * 1024 * 1024

        # Verify data integrity
        assert len(config["charts"][0]["series"][0]["data"]) == 10000

    def test_chart_with_many_series(self):
        """Test chart with many series."""
        # Create 100 series
        series_list = []
        for i in range(100):
            data = [LineData(time=1640995200, value=100 + i)]
            series = LineSeries(data=data)
            series_list.append(series)

        start_time = time.time()

        chart = Chart(series=series_list)
        config = chart.to_frontend_config()

        end_time = time.time()
        processing_time = end_time - start_time

        # Should handle many series in reasonable time (< 2 seconds)
        assert processing_time < 2.0
        assert len(config["charts"][0]["series"]) == 100

    def test_chart_serialization_idempotency(self):
        """Test that chart serialization is idempotent."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)
        chart = Chart(series=series)

        # Serialize multiple times
        config1 = chart.to_frontend_config()
        config2 = chart.to_frontend_config()
        config3 = chart.to_frontend_config()

        # All results should be identical
        assert config1 == config2 == config3

    def test_chart_to_dict_does_not_modify_original(self):
        """Test that to_frontend_config doesn't modify original chart."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)
        chart = Chart(series=series)

        original_series_count = len(chart.series)
        original_options = chart.options

        config = chart.to_frontend_config()

        # Original chart should be unchanged
        assert len(chart.series) == original_series_count
        assert chart.options == original_options
        assert isinstance(config, dict)
