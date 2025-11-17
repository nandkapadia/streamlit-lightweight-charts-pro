"""
Integration tests for HistogramSeries with Chart system.

This module tests the integration between HistogramSeries and the Chart system,
ensuring that volume series work correctly in real chart scenarios.
"""

import json

import numpy as np
import pandas as pd

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.chart_manager import ChartManager
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series.candlestick import CandlestickSeries
from streamlit_lightweight_charts_pro.charts.series.histogram import HistogramSeries
from streamlit_lightweight_charts_pro.constants import (
    HISTOGRAM_DOWN_COLOR_DEFAULT,
    HISTOGRAM_UP_COLOR_DEFAULT,
)
from streamlit_lightweight_charts_pro.data.marker import BarMarker
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData


class TestHistogramChartIntegration:
    """Test integration between HistogramSeries and Chart system."""

    def test_price_volume_chart_creation(self):
        """Test creating a price-volume chart with candlestick and volume series."""
        # Create sample OHLCV data
        histogram_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=10, freq="1h"),
                "open": [100, 101, 102, 103, 104, 105, 106, 107, 108, 109],
                "high": [102, 103, 104, 105, 106, 107, 108, 109, 110, 111],
                "low": [99, 100, 101, 102, 103, 104, 105, 106, 107, 108],
                "close": [101, 102, 101, 104, 105, 104, 107, 108, 107, 110],
                "volume": [1000, 1500, 1200, 1800, 2000, 1600, 2200, 2400, 2000, 2600],
            },
        )

        # Create chart using the factory method
        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=histogram_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Verify chart structure
        assert len(chart.series) == 2

        # Check candlestick series
        candlestick_series = chart.series[0]
        assert isinstance(candlestick_series, CandlestickSeries)
        assert len(candlestick_series.data) == 10

        # Check volume series
        volume_series = chart.series[1]
        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 10

        # Verify volume colors are assigned correctly
        bullish_volumes = sum(
            1 for data in volume_series.data if data.color == HISTOGRAM_UP_COLOR_DEFAULT
        )
        bearish_volumes = sum(
            1 for data in volume_series.data if data.color == HISTOGRAM_DOWN_COLOR_DEFAULT
        )
        assert bullish_volumes + bearish_volumes == 10

    def test_price_volume_chart_json_serialization(self):
        """Test that price-volume chart can be properly serialized to JSON."""
        # Create sample data
        histogram_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=5, freq="1h"),
                "open": [100, 101, 102, 103, 104],
                "high": [102, 103, 104, 105, 106],
                "low": [99, 100, 101, 102, 103],
                "close": [101, 102, 101, 104, 105],
                "volume": [1000, 1500, 1200, 1800, 2000],
            },
        )

        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=histogram_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Serialize to JSON
        chart_config = chart.to_frontend_config()
        json.dumps(chart_config)

        # Verify JSON structure
        assert "charts" in chart_config
        assert len(chart_config["charts"]) == 1

        chart_data = chart_config["charts"][0]
        assert "series" in chart_data
        assert len(chart_data["series"]) == 2

        # Verify candlestick series
        candlestick_series = chart_data["series"][0]
        assert candlestick_series["type"] == "candlestick"
        assert "data" in candlestick_series
        assert len(candlestick_series["data"]) == 5

        # Verify volume series
        volume_series = chart_data["series"][1]
        assert volume_series["type"] == "histogram"
        assert "data" in volume_series
        assert len(volume_series["data"]) == 5

        # Verify volume data has colors
        # Centralized validation normalizes color format (adds spaces after commas)
        for data_point in volume_series["data"]:
            assert "color" in data_point
            assert data_point["color"] in ["rgba(38, 166, 154, 0.5)", "rgba(239, 83, 80, 0.5)"]

    def test_manual_series_addition(self):
        """Test manually adding histogram series to a chart."""
        # Create chart with options
        chart = Chart(options=ChartOptions(height=500))

        # Create candlestick data
        candlestick_data = [
            OhlcvData("2024-01-01", 100, 102, 99, 101, 1000),
            OhlcvData("2024-01-02", 101, 103, 100, 102, 1500),
            OhlcvData("2024-01-03", 102, 104, 101, 101, 1200),
        ]

        # Add candlestick series
        candlestick_series = CandlestickSeries(data=candlestick_data)
        chart.add_series(candlestick_series)

        # Create volume series manually
        volume_series = HistogramSeries.create_volume_series(
            candlestick_data,
            column_mapping={"time": "time", "volume": "volume"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        # Add volume series
        chart.add_series(volume_series)

        # Verify chart structure
        assert len(chart.series) == 2
        assert isinstance(chart.series[0], CandlestickSeries)
        assert isinstance(chart.series[1], HistogramSeries)

        # Verify data alignment
        assert len(chart.series[0].data) == len(chart.series[1].data)

        # Verify timestamps match when serialized (time normalized in asdict())
        candlestick_times = [data.asdict()["time"] for data in chart.series[0].data]
        volume_times = [data.asdict()["time"] for data in chart.series[1].data]
        assert candlestick_times == volume_times

    def test_custom_volume_colors(self):
        """Test using custom colors for volume series."""
        histogram_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=5, freq="1h"),
                "open": [100, 101, 102, 103, 104],
                "high": [102, 103, 104, 105, 106],
                "low": [99, 100, 101, 102, 103],
                "close": [101, 102, 101, 104, 105],
                "volume": [1000, 1500, 1200, 1800, 2000],
            },
        )

        # Create chart with custom volume colors
        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=histogram_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
            volume_kwargs={
                "up_color": "rgba(0,255,0,0.5)",  # Custom green
                "down_color": "rgba(255,0,0,0.5)",  # Custom red
            },
        )

        # Verify custom colors are used
        volume_series = chart.series[1]
        assert isinstance(volume_series, HistogramSeries)

        # Check that custom colors are applied
        colors_used = {data.color for data in volume_series.data}
        assert "rgba(0,255,0,0.5)" in colors_used  # Custom green
        assert "rgba(255,0,0,0.5)" in colors_used  # Custom red

    def test_volume_series_with_markers(self):
        """Test volume series with markers."""
        histogram_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=5, freq="1h"),
                "open": [100, 101, 102, 103, 104],
                "high": [102, 103, 104, 105, 106],
                "low": [99, 100, 101, 102, 103],
                "close": [101, 102, 101, 104, 105],
                "volume": [1000, 1500, 1200, 1800, 2000],
            },
        )

        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=histogram_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Add markers to volume series
        volume_series = chart.series[1]

        marker = BarMarker(
            time="2024-01-01 01:00:00",
            position="aboveBar",
            color="#FF0000",
            shape="arrowDown",
            text="High Volume",
        )
        volume_series.add_marker(marker)

        # Verify marker was added
        assert len(volume_series.markers) == 1
        assert volume_series.markers[0].text == "High Volume"

        # Verify JSON serialization includes markers
        chart_config = chart.to_frontend_config()
        volume_series_config = chart_config["charts"][0]["series"][1]
        assert "markers" in volume_series_config
        assert len(volume_series_config["markers"]) == 1

    def test_volume_series_with_price_lines(self):
        """Test volume series with price lines."""
        histogram_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=5, freq="1h"),
                "open": [100, 101, 102, 103, 104],
                "high": [102, 103, 104, 105, 106],
                "low": [99, 100, 101, 102, 103],
                "close": [101, 102, 101, 104, 105],
                "volume": [1000, 1500, 1200, 1800, 2000],
            },
        )

        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=histogram_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Add price line to volume series
        volume_series = chart.series[1]

        price_line = PriceLineOptions(
            price=1500,
            color="#FF0000",
            line_width=2,
            line_style="dashed",
            axis_label_visible=True,
            title="Average Volume",
        )
        volume_series.add_price_line(price_line)

        # Verify price line was added
        assert len(volume_series.price_lines) == 1
        assert volume_series.price_lines[0].price == 1500
        assert volume_series.price_lines[0].title == "Average Volume"

        # Verify JSON serialization includes price lines
        chart_config = chart.to_frontend_config()
        volume_series_config = chart_config["charts"][0]["series"][1]
        assert "priceLines" in volume_series_config
        assert len(volume_series_config["priceLines"]) == 1

    def test_volume_series_visibility_control(self):
        """Test controlling volume series visibility."""
        histogram_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=5, freq="1h"),
                "open": [100, 101, 102, 103, 104],
                "high": [102, 103, 104, 105, 106],
                "low": [99, 100, 101, 102, 103],
                "close": [101, 102, 101, 104, 105],
                "volume": [1000, 1500, 1200, 1800, 2000],
            },
        )

        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=histogram_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Hide volume series
        volume_series = chart.series[1]
        volume_series._visible = False

        # Verify visibility setting
        assert volume_series._visible is False

        # Verify JSON serialization reflects visibility
        chart_config = chart.to_frontend_config()
        volume_series_config = chart_config["charts"][0]["series"][1]
        assert "visible" in volume_series_config
        assert volume_series_config["visible"] is False

    def test_volume_series_price_scale_configuration(self):
        """Test volume series with custom price scale configuration."""
        histogram_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=5, freq="1h"),
                "open": [100, 101, 102, 103, 104],
                "high": [102, 103, 104, 105, 106],
                "low": [99, 100, 101, 102, 103],
                "close": [101, 102, 101, 104, 105],
                "volume": [1000, 1500, 1200, 1800, 2000],
            },
        )

        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=histogram_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Configure volume series price scale
        volume_series = chart.series[1]
        volume_series.price_scale_id = "volume"
        volume_series.base = 0

        # Verify price scale configuration
        assert volume_series.price_scale_id == "volume"
        assert volume_series.base == 0

        # Verify JSON serialization includes price scale configuration
        chart_config = chart.to_frontend_config()
        volume_series_config = chart_config["charts"][0]["series"][1]
        assert "options" in volume_series_config
        assert volume_series_config["options"]["base"] == 0

    def test_large_dataset_integration(self):
        """Test integration with large dataset."""
        # Create large dataset
        rng = np.random.default_rng(42)
        n_points = 10000
        histogram_data = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=n_points, freq="1min"),
                "open": rng.uniform(100, 200, n_points),
                "high": rng.uniform(100, 200, n_points),
                "low": rng.uniform(100, 200, n_points),
                "close": rng.uniform(100, 200, n_points),
                "volume": rng.integers(1000, 10000, n_points),
            },
        )

        # Ensure high >= open, close and low <= open, close
        histogram_data["high"] = histogram_data[["open", "close", "high"]].max(axis=1)
        histogram_data["low"] = histogram_data[["open", "close", "low"]].min(axis=1)

        # Create chart
        manager = ChartManager()
        chart = manager.from_price_volume_dataframe(
            data=histogram_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
        )

        # Verify chart structure
        assert len(chart.series) == 2
        assert len(chart.series[0].data) == n_points  # Candlestick
        assert len(chart.series[1].data) == n_points  # Volume

        # Verify data integrity
        candlestick_times = [data.time for data in chart.series[0].data]
        volume_times = [data.time for data in chart.series[1].data]
        assert candlestick_times == volume_times

        # Verify volume colors are assigned
        # Centralized validation normalizes color format (adds spaces after commas)
        volume_series = chart.series[1]
        colors_used = {data.color for data in volume_series.data}
        assert "rgba(38, 166, 154, 0.5)" in colors_used  # Up color
        assert "rgba(239, 83, 80, 0.5)" in colors_used  # Down color

        # Test JSON serialization
        chart_config = chart.to_frontend_config()
        json_str = json.dumps(chart_config)
        assert len(json_str) > 0  # Should serialize successfully
