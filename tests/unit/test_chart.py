"""
Tests for Chart class.

This module contains comprehensive tests for the Chart class,
covering construction, series management, annotations, price scales,
and frontend configuration.
"""

from unittest.mock import Mock, patch

import pandas as pd
import pytest

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from streamlit_lightweight_charts_pro.charts.series import (
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
)
from streamlit_lightweight_charts_pro.data.annotation import Annotation, AnnotationManager
from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames, PriceScaleMode


class TestChartConstruction:
    """Test cases for Chart construction."""

    def test_empty_construction(self):
        """Test Chart construction with no parameters."""
        chart = Chart()

        assert chart.series == []
        assert isinstance(chart.options, ChartOptions)
        assert isinstance(chart.annotation_manager, AnnotationManager)

    def test_construction_with_single_series(self):
        """Test Chart construction with a single series."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)
        chart = Chart(series=series)

        assert len(chart.series) == 1
        assert chart.series[0] == series
        assert isinstance(chart.options, ChartOptions)
        assert isinstance(chart.annotation_manager, AnnotationManager)

    def test_construction_with_multiple_series(self):
        """Test Chart construction with multiple series."""
        data1 = [LineData(time=1640995200, value=100)]
        data2 = [LineData(time=1640995200, value=200)]
        series1 = LineSeries(data=data1)
        series2 = LineSeries(data=data2)
        chart = Chart(series=[series1, series2])

        assert len(chart.series) == 2
        assert chart.series[0] == series1
        assert chart.series[1] == series2

    def test_construction_with_options(self):
        """Test Chart construction with custom options."""
        options = ChartOptions(height=500, width=800)
        chart = Chart(options=options)

        assert chart.options == options
        assert chart.options.height == 500
        assert chart.options.width == 800

    def test_construction_with_annotations(self):
        """Test Chart construction with annotations."""
        annotation = Mock(spec=Annotation)
        chart = Chart(annotations=[annotation])

        # Verify annotation was added to the manager
        assert len(chart.annotation_manager.layers) > 0

    def test_construction_with_all_parameters(self):
        """Test Chart construction with all parameters."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)
        options = ChartOptions(height=500)
        annotation = Mock(spec=Annotation)

        chart = Chart(series=series, options=options, annotations=[annotation])

        assert len(chart.series) == 1
        assert chart.series[0] == series
        assert chart.options == options
        assert chart.options.height == 500


class TestChartSeriesManagement:
    """Test cases for series management methods."""

    def test_add_series(self):
        """Test adding a series to the chart."""
        chart = Chart()
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)

        result = chart.add_series(series)

        assert result is chart  # Method chaining
        assert len(chart.series) == 1
        assert chart.series[0] == series

    def test_add_multiple_series(self):
        """Test adding multiple series to the chart."""
        chart = Chart()
        data1 = [LineData(time=1640995200, value=100)]
        data2 = [LineData(time=1640995200, value=200)]
        series1 = LineSeries(data=data1)
        series2 = LineSeries(data=data2)

        chart.add_series(series1).add_series(series2)

        assert len(chart.series) == 2
        assert chart.series[0] == series1
        assert chart.series[1] == series2


class TestChartOptionsManagement:
    """Test cases for options management methods."""

    def test_update_options(self):
        """Test updating chart options."""
        chart = Chart()

        result = chart.update_options(height=600, width=800)

        assert result is chart  # Method chaining
        assert chart.options.height == 600
        assert chart.options.width == 800

    def test_update_options_with_invalid_attribute(self):
        """Test updating options with invalid attribute (should be ignored)."""
        chart = Chart()
        original_height = chart.options.height

        result = chart.update_options(invalid_attribute="value")

        assert result is chart  # Method chaining
        assert chart.options.height == original_height  # Should not change

    def test_update_options_method_chaining(self):
        """Test method chaining with update_options."""
        chart = Chart()

        result = (
            chart.update_options(height=500)
            .update_options(width=700)
            .update_options(auto_size=True)
        )

        assert result is chart
        assert chart.options.height == 500
        assert chart.options.width == 700
        assert chart.options.auto_size is True


class TestChartAnnotationManagement:
    """Test cases for annotation management methods."""

    def test_add_annotation(self):
        """Test adding a single annotation."""
        chart = Chart()
        annotation = Mock(spec=Annotation)

        result = chart.add_annotation(annotation)

        assert result is chart  # Method chaining
        # Verify annotation was added to the manager
        assert len(chart.annotation_manager.layers) > 0

    def test_add_annotation_with_custom_layer(self):
        """Test adding annotation with custom layer name."""
        chart = Chart()
        annotation = Mock(spec=Annotation)

        result = chart.add_annotation(annotation, layer_name="custom_layer")

        assert result is chart  # Method chaining
        # Verify custom layer was created
        assert "custom_layer" in chart.annotation_manager.layers

    def test_add_annotations(self):
        """Test adding multiple annotations."""
        chart = Chart()
        annotation1 = Mock(spec=Annotation)
        annotation2 = Mock(spec=Annotation)

        result = chart.add_annotations([annotation1, annotation2])

        assert result is chart  # Method chaining
        # Verify annotations were added
        assert len(chart.annotation_manager.layers) > 0

    def test_create_annotation_layer(self):
        """Test creating a new annotation layer."""
        chart = Chart()

        result = chart.create_annotation_layer("analysis")

        assert result is chart  # Method chaining
        assert "analysis" in chart.annotation_manager.layers

    def test_hide_annotation_layer(self):
        """Test hiding an annotation layer."""
        chart = Chart()
        chart.create_annotation_layer("analysis")

        result = chart.hide_annotation_layer("analysis")

        assert result is chart  # Method chaining
        layer = chart.annotation_manager.get_layer("analysis")
        assert layer is not None

    def test_show_annotation_layer(self):
        """Test showing an annotation layer."""
        chart = Chart()
        chart.create_annotation_layer("analysis")

        result = chart.show_annotation_layer("analysis")

        assert result is chart  # Method chaining
        layer = chart.annotation_manager.get_layer("analysis")
        assert layer is not None

    def test_clear_annotations_specific_layer(self):
        """Test clearing annotations from a specific layer."""
        chart = Chart()
        chart.create_annotation_layer("analysis")
        annotation = Mock(spec=Annotation)
        chart.add_annotation(annotation, "analysis")

        result = chart.clear_annotations("analysis")

        assert result is chart  # Method chaining
        layer = chart.annotation_manager.get_layer("analysis")
        assert layer is not None

    def test_clear_all_annotations(self):
        """Test clearing all annotations."""
        chart = Chart()
        chart.create_annotation_layer("layer1")
        chart.create_annotation_layer("layer2")
        annotation = Mock(spec=Annotation)
        chart.add_annotation(annotation, "layer1")
        chart.add_annotation(annotation, "layer2")

        result = chart.clear_annotations()

        assert result is chart  # Method chaining
        # All layers should be cleared


class TestChartPriceScaleManagement:
    """Test cases for price scale management methods."""

    def test_add_overlay_price_scale(self):
        """Test adding an overlay price scale."""
        chart = Chart()
        options = PriceScaleOptions(visible=True, auto_scale=True, mode=PriceScaleMode.NORMAL)

        result = chart.add_overlay_price_scale("volume", options)

        assert result is chart  # Method chaining
        assert "volume" in chart.options.overlay_price_scales
        assert chart.options.overlay_price_scales["volume"] == options

    def test_add_overlay_price_scale_invalid_options(self):
        """Test adding overlay price scale with invalid options type."""
        chart = Chart()
        invalid_options = "not a PriceScaleOptions"

        with pytest.raises(ValueError, match="options must be a PriceScaleOptions instance"):
            chart.add_overlay_price_scale("volume", invalid_options)

    def test_add_overlay_price_scale_method_chaining(self):
        """Test method chaining with add_overlay_price_scale."""
        chart = Chart()
        options1 = PriceScaleOptions(visible=True)
        options2 = PriceScaleOptions(visible=False)

        result = chart.add_overlay_price_scale("volume", options1).add_overlay_price_scale(
            "indicator", options2
        )

        assert result is chart
        assert "volume" in chart.options.overlay_price_scales
        assert "indicator" in chart.options.overlay_price_scales


class TestChartPriceVolumeSeries:
    """Test cases for price-volume series methods."""

    def test_create_price_volume_series_candlestick(self):
        """Test creating price-volume series with candlestick price type."""
        chart = Chart()
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

        chart.add_price_volume_series(
            data=data, column_mapping=column_mapping, price_type="candlestick"
        )
        price_series = chart.series[0]
        volume_series = chart.series[1]

        assert isinstance(price_series, CandlestickSeries)
        assert isinstance(volume_series, HistogramSeries)
        assert price_series.price_scale_id == "right"
        assert volume_series.price_scale_id == ColumnNames.VOLUME

    def test_create_price_volume_series_line(self):
        """Test creating price-volume series with line price type."""
        chart = Chart()
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

        chart.add_price_volume_series(data=data, column_mapping=column_mapping, price_type="line")
        price_series = chart.series[0]
        volume_series = chart.series[1]

        assert isinstance(price_series, LineSeries)
        assert isinstance(volume_series, HistogramSeries)

    def test_create_price_volume_series_invalid_price_type(self):
        """Test creating price-volume series with invalid price type."""
        chart = Chart()
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        with pytest.raises(ValueError, match="price_type must be 'candlestick' or 'line'"):
            chart.add_price_volume_series(
                data=data, column_mapping=column_mapping, price_type="invalid"
            )

    def test_create_price_volume_series_with_custom_kwargs(self):
        """Test creating price-volume series with custom kwargs."""
        chart = Chart()
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
        volume_kwargs = {"up_color": "#00ff00", "down_color": "#ff0000"}

        chart.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type="candlestick",
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
        )
        price_series = chart.series[0]
        volume_series = chart.series[1]

        assert price_series.visible is False
        # Check that the volume data has the correct color (bullish candle, so up_color)
        assert len(volume_series.data) == 1
        assert volume_series.data[0].color == "#00ff00"
        assert volume_series.base == 0

    def test_add_price_volume_series(self):
        """Test adding price-volume series to chart."""
        chart = Chart()
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        result = chart.add_price_volume_series(
            data=data, column_mapping=column_mapping, price_type="candlestick"
        )

        assert result is chart  # Method chaining
        assert len(chart.series) == 2
        assert isinstance(chart.series[0], CandlestickSeries)
        assert isinstance(chart.series[1], HistogramSeries)

    def test_from_price_volume_dataframe_classmethod(self):
        """Test from_price_volume_dataframe class method."""
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        chart = Chart()
        chart.add_price_volume_series(
            data=data, column_mapping=column_mapping, price_type="candlestick"
        )

        assert isinstance(chart, Chart)
        assert len(chart.series) == 2
        assert isinstance(chart.series[0], CandlestickSeries)
        assert isinstance(chart.series[1], HistogramSeries)

    def test_from_price_volume_dataframe_with_dataframe(self):
        """Test from_price_volume_dataframe with pandas DataFrame."""
        df = pd.DataFrame(
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

        chart = Chart()
        chart.add_price_volume_series(
            data=df, column_mapping=column_mapping, price_type="candlestick"
        )

        assert isinstance(chart, Chart)
        assert len(chart.series) == 2


class TestChartFrontendConfiguration:
    """Test cases for frontend configuration methods."""

    def test_to_frontend_config_empty_chart(self):
        """Test to_frontend_config with empty chart."""
        chart = Chart()
        config = chart.to_frontend_config()

        assert "charts" in config
        assert len(config["charts"]) == 1
        chart_config = config["charts"][0]
        assert "chartId" in chart_config
        assert "chart" in chart_config
        assert "series" in chart_config
        assert "annotations" in chart_config
        # Layout should be inside chart object, not at top level (after layout duplication fix)
        assert "layout" in chart_config["chart"]
        assert "layout" not in chart_config  # Ensure no duplicate at top level
        assert chart_config["series"] == []
        # syncConfig is only present when sync is enabled
        # assert "syncConfig" in config

    def test_to_frontend_config_with_series(self):
        """Test to_frontend_config with series."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)
        chart = Chart(series=series)

        config = chart.to_frontend_config()
        chart_config = config["charts"][0]

        assert len(chart_config["series"]) == 1
        assert chart_config["series"][0]["type"] == "line"

    def test_to_frontend_config_with_multiple_series(self):
        """Test to_frontend_config with multiple series."""
        data1 = [LineData(time=1640995200, value=100)]
        data2 = [LineData(time=1640995200, value=200)]
        series1 = LineSeries(data=data1)
        series2 = LineSeries(data=data2)
        chart = Chart(series=[series1, series2])

        config = chart.to_frontend_config()
        chart_config = config["charts"][0]

        assert len(chart_config["series"]) == 2
        assert chart_config["series"][0]["type"] == "line"
        assert chart_config["series"][1]["type"] == "line"

    def test_to_frontend_config_with_price_scales(self):
        """Test to_frontend_config with price scales."""
        chart = Chart()
        right_scale = PriceScaleOptions(visible=True)
        left_scale = PriceScaleOptions(visible=False)
        chart.options.right_price_scale = right_scale
        chart.options.left_price_scale = left_scale

        config = chart.to_frontend_config()
        chart_config = config["charts"][0]["chart"]

        assert "rightPriceScale" in chart_config
        assert "leftPriceScale" in chart_config
        assert chart_config["rightPriceScale"]["visible"] is True
        assert chart_config["leftPriceScale"]["visible"] is False

    def test_to_frontend_config_with_overlay_price_scales(self):
        """Test to_frontend_config with overlay price scales."""
        chart = Chart()
        overlay_scale = PriceScaleOptions(visible=True)
        chart.add_overlay_price_scale("volume", overlay_scale)

        config = chart.to_frontend_config()
        chart_config = config["charts"][0]["chart"]

        assert "overlayPriceScales" in chart_config
        assert "volume" in chart_config["overlayPriceScales"]
        assert chart_config["overlayPriceScales"]["volume"]["visible"] is True

    def test_to_frontend_config_with_annotations(self):
        """Test to_frontend_config with annotations."""
        chart = Chart()
        annotation = Mock(spec=Annotation)
        chart.add_annotation(annotation)

        config = chart.to_frontend_config()
        chart_config = config["charts"][0]

        assert "annotations" in chart_config
        # The annotation manager should have been called to convert to dict

    def test_to_frontend_config_with_series_height(self):
        """Test to_frontend_config with series that have height attribute."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)
        series.height = 200  # Add height attribute
        series.pane_id = 1  # Add pane_id attribute
        chart = Chart(series=series)

        config = chart.to_frontend_config()
        chart_config = config["charts"][0]

        # Series height attribute should not automatically create paneHeights
        # paneHeights should only be created from chart layout options
        assert "paneHeights" not in chart_config

        # Verify series has the height attribute in its data
        assert len(chart_config["series"]) == 1
        series_config = chart_config["series"][0]
        assert series_config["paneId"] == 1

    def test_to_frontend_config_layout_pane_heights(self):
        """Test that paneHeights is properly configured in chart.layout."""
        from streamlit_lightweight_charts_pro.charts.options.layout_options import (
            LayoutOptions,
            PaneHeightOptions,
        )

        # Create chart with layout options
        layout_options = LayoutOptions()
        layout_options.pane_heights = {
            0: PaneHeightOptions(factor=0.7),
            1: PaneHeightOptions(factor=0.3),
        }

        chart_options = ChartOptions()
        chart_options.layout = layout_options

        chart = Chart(options=chart_options)
        config = chart.to_frontend_config()
        chart_config = config["charts"][0]

        # Verify layout is inside chart object
        assert "layout" in chart_config["chart"]
        assert "paneHeights" in chart_config["chart"]["layout"]

        # Verify layout is NOT at top level (duplication fix)
        assert "layout" not in chart_config

        # Verify paneHeights is NOT extracted to top level (frontend now uses chart.layout.paneHeights)
        assert "paneHeights" not in chart_config
        assert chart_config["chart"]["layout"]["paneHeights"]["0"]["factor"] == 0.7
        assert chart_config["chart"]["layout"]["paneHeights"]["1"]["factor"] == 0.3


class TestChartRendering:
    """Test cases for chart rendering."""

    @patch("streamlit_lightweight_charts_pro.charts.chart.get_component_func")
    def test_render(self, mock_get_component_func):
        """Test chart rendering."""
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        chart = Chart()
        result = chart.render(key="test_key")

        mock_get_component_func.assert_called_once()
        mock_component.assert_called_once()
        call_args = mock_component.call_args
        assert "config" in call_args.kwargs
        assert "key" in call_args.kwargs
        assert call_args.kwargs["key"] == "test_key"

    @patch("streamlit_lightweight_charts_pro.charts.chart.get_component_func")
    def test_render_without_key(self, mock_get_component_func):
        """Test chart rendering without key."""
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        chart = Chart()
        chart.render()

        mock_component.assert_called_once()
        call_args = mock_component.call_args
        assert "config" in call_args.kwargs
        assert "key" in call_args.kwargs
        # When no key is provided, a unique key should be generated
        assert call_args.kwargs["key"].startswith("chart_")


class TestChartMethodChaining:
    """Test cases for method chaining functionality."""

    def test_complex_method_chaining(self):
        """Test complex method chaining."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)
        annotation = Mock(spec=Annotation)

        result = (
            Chart()
            .add_series(series)
            .update_options(height=500, width=800)
            .add_annotation(annotation)
            .create_annotation_layer("analysis")
            .add_overlay_price_scale("volume", PriceScaleOptions(visible=False))
        )

        assert result is not None
        assert isinstance(result, Chart)
        assert len(result.series) == 1
        assert result.options.height == 500
        assert result.options.width == 800
        assert "analysis" in result.annotation_manager.layers
        assert "volume" in result.options.overlay_price_scales

    def test_method_chaining_with_price_volume_series(self):
        """Test method chaining with price-volume series."""
        data = [OhlcvData(time=1640995200, open=100, high=105, low=98, close=103, volume=1000)]
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        result = (
            Chart()
            .add_price_volume_series(data, column_mapping, price_type="candlestick")
            .update_options(height=600)
            .add_overlay_price_scale("indicator", PriceScaleOptions(visible=True))
        )

        assert result is not None
        assert isinstance(result, Chart)
        assert len(result.series) == 2
        assert result.options.height == 600
        assert "indicator" in result.options.overlay_price_scales


class TestChartEdgeCases:
    """Test cases for edge cases and error conditions."""

    def test_construction_with_none_series(self):
        """Test construction with None series."""
        chart = Chart(series=None)
        assert chart.series == []

    def test_construction_with_empty_list_series(self):
        """Test construction with empty list series."""
        chart = Chart(series=[])
        assert chart.series == []

    def test_add_series_with_none(self):
        """Test adding None series (should raise error)."""
        chart = Chart()
        with pytest.raises(TypeError, match="series must be an instance of Series"):
            chart.add_series(None)

    def test_update_options_with_none_values(self):
        """Test updating options with None values."""
        chart = Chart()
        chart.update_options(height=None, width=None)
        # Should not raise error, but values should be set to None

    def test_create_price_volume_series_with_none_data(self):
        """Test creating price-volume series with None data."""
        chart = Chart()
        # This should raise TypeError since None data is not allowed
        with pytest.raises(TypeError):
            chart.add_price_volume_series(data=None, column_mapping={})

    def test_create_price_volume_series_with_empty_data(self):
        """Test creating price-volume series with empty data."""
        chart = Chart()
        column_mapping = {
            "time": "time",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
        }

        # This should raise ValueError since empty data is not allowed
        with pytest.raises(ValueError):
            chart.add_price_volume_series(
                data=[], column_mapping=column_mapping, price_type="candlestick"
            )

    def test_to_frontend_config_with_none_options(self):
        """Test to_frontend_config with None options."""
        chart = Chart()
        chart.options = None
        # This should not raise an error, but the config should be generated properly
        config = chart.to_frontend_config()
        assert "charts" in config

    def test_to_frontend_config_right_price_scale_id_validation(self):
        """Test that non-string right price scale IDs raise TypeError in frontend config."""
        chart = Chart()

        with pytest.raises(TypeError, match="right_price_scale.price_scale_id must be a string"):
            chart.options = ChartOptions(right_price_scale=PriceScaleOptions(price_scale_id=123))

    def test_to_frontend_config_left_price_scale_id_validation(self):
        """Test that non-string left price scale IDs raise TypeError in frontend config."""
        chart = Chart()

        with pytest.raises(TypeError, match="left_price_scale.price_scale_id must be a string"):
            chart.options = ChartOptions(left_price_scale=PriceScaleOptions(price_scale_id=456))

    def test_to_frontend_config_valid_price_scale_ids(self):
        """Test that valid string price scale IDs work correctly in frontend config."""
        chart = Chart()
        chart.options = ChartOptions(
            left_price_scale=PriceScaleOptions(price_scale_id="left-scale"),
            right_price_scale=PriceScaleOptions(price_scale_id="right-scale"),
        )

        # Should not raise any errors
        config = chart.to_frontend_config()
        chart_config = config["charts"][0]["chart"]

        assert chart_config["leftPriceScale"]["priceScaleId"] == "left-scale"
        assert chart_config["rightPriceScale"]["priceScaleId"] == "right-scale"

    def test_to_frontend_config_none_price_scale_ids(self):
        """Test that None price scale IDs work correctly in frontend config."""
        chart = Chart()
        chart.options = ChartOptions(
            left_price_scale=PriceScaleOptions(price_scale_id=None),
            right_price_scale=PriceScaleOptions(price_scale_id=None),
        )

        # Should not raise any errors
        config = chart.to_frontend_config()
        chart_config = config["charts"][0]["chart"]

        # None price_scale_id values should not be included in the output
        assert "priceScaleId" not in chart_config["leftPriceScale"]
        assert "priceScaleId" not in chart_config["rightPriceScale"]


class TestChartIntegration:
    """Test cases for integration scenarios."""

    def test_full_chart_workflow(self):
        """Test a complete chart workflow."""
        # Create data
        data = [LineData(time=1640995200, value=100)]

        # Create chart with series
        chart = Chart(series=LineSeries(data=data))

        # Add another series
        data2 = [LineData(time=1640995200, value=200)]
        chart.add_series(LineSeries(data=data2))

        # Update options
        chart.update_options(height=500, width=800)

        # Add annotations
        annotation = Mock(spec=Annotation)
        chart.add_annotation(annotation)

        # Add price scale
        price_scale = PriceScaleOptions(visible=True)
        chart.add_overlay_price_scale("volume", price_scale)

        # Generate frontend config
        config = chart.to_frontend_config()

        # Verify configuration
        assert len(config["charts"]) == 1
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 2
        assert chart_config["chart"]["height"] == 500
        assert chart_config["chart"]["width"] == 800
        assert "volume" in chart_config["chart"]["overlayPriceScales"]

    def test_price_volume_chart_workflow(self):
        """Test a complete price-volume chart workflow."""
        # Create OHLCV data
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

        # Create chart from price-volume data
        chart = Chart()
        chart.add_price_volume_series(
            data=data, column_mapping=column_mapping, price_type="candlestick"
        )

        # Add custom options
        chart.update_options(height=600, auto_size=True)

        # Add custom price scale
        volume_scale = PriceScaleOptions(
            visible=True, auto_scale=True, scale_margins=PriceScaleMargins(top=0.8, bottom=0.0)
        )
        chart.add_overlay_price_scale("custom_volume", volume_scale)

        # Generate frontend config
        config = chart.to_frontend_config()

        # Verify configuration
        assert len(config["charts"]) == 1
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 2
        assert chart_config["chart"]["height"] == 600
        assert chart_config["chart"]["autoSize"] is True
        assert "custom_volume" in chart_config["chart"]["overlayPriceScales"]
