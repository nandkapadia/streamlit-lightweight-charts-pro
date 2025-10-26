"""
Chart frontend tests - Configuration generation and rendering.

This module tests frontend configuration generation, rendering in Streamlit,
and component integration.
"""

# Standard Imports
from unittest.mock import Mock, patch

# Third Party Imports
import pytest

# Local Imports
from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.layout_options import (
    LayoutOptions,
    PaneHeightOptions,
)
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.data.annotation import Annotation
from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.exceptions import ComponentNotAvailableError


class TestFrontendConfigGeneration:
    """Test frontend configuration generation."""

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
        assert "layout" in chart_config["chart"]
        assert chart_config["series"] == []

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
        data3 = [LineData(time=1640995200, value=300)]

        series1 = LineSeries(data=data1)
        series2 = LineSeries(data=data2)
        series3 = LineSeries(data=data3)

        chart = Chart(series=[series1, series2, series3])
        config = chart.to_frontend_config()

        assert len(config["charts"][0]["series"]) == 3

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

    def test_to_frontend_config_layout_pane_heights(self):
        """Test that paneHeights is properly configured in chart.layout."""
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
        assert chart_config["chart"]["layout"]["paneHeights"]["0"]["factor"] == 0.7
        assert chart_config["chart"]["layout"]["paneHeights"]["1"]["factor"] == 0.3

    def test_to_frontend_config_with_none_options(self):
        """Test to_frontend_config with None options."""
        chart = Chart()
        chart.options = None

        config = chart.to_frontend_config()

        # Should handle None options gracefully
        assert "charts" in config
        assert len(config["charts"]) == 1


class TestChartRendering:
    """Test chart rendering in Streamlit."""

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    def test_render(self, mock_get_component_func):
        """Test chart rendering."""
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        chart = Chart()
        chart.render(key="test_key")

        mock_get_component_func.assert_called_once()
        mock_component.assert_called_once()
        call_args = mock_component.call_args
        assert "config" in call_args.kwargs
        assert "key" in call_args.kwargs
        assert call_args.kwargs["key"] == "test_key"

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
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

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.reinitialize_component")
    def test_render_component_none_reinitialize(self, mock_reinitialize, mock_get_component_func):
        """Test render when component is None and reinitialize succeeds."""
        mock_get_component_func.side_effect = [None, Mock()]
        mock_reinitialize.return_value = True

        chart = Chart()
        chart.render()

        mock_reinitialize.assert_called_once()
        assert mock_get_component_func.call_count == 2

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.reinitialize_component")
    def test_render_component_none_reinitialize_fails(
        self, mock_reinitialize, mock_get_component_func
    ):
        """Test render when component is None and reinitialize fails."""
        mock_get_component_func.return_value = None
        mock_reinitialize.return_value = False

        chart = Chart()

        with pytest.raises(ComponentNotAvailableError):
            chart.render()

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    def test_render_with_custom_key(self, mock_get_component_func):
        """Test render with custom key."""
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        chart = Chart()
        chart.render(key="custom_key_123")

        call_args = mock_component.call_args
        assert call_args.kwargs["key"] == "custom_key_123"

    @patch("streamlit_lightweight_charts_pro.charts.managers.chart_renderer.get_component_func")
    def test_render_with_none_key(self, mock_get_component_func):
        """Test render with None key."""
        chart = Chart()
        mock_component = Mock()
        mock_get_component_func.return_value = mock_component

        chart.render(key=None)

        # Should call component with generated key
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

        # Should call component with generated key
        mock_component.assert_called_once()
        call_args = mock_component.call_args[1]
        assert "key" in call_args
        assert call_args["key"].startswith("chart_")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
