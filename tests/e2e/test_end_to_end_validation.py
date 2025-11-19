"""
End-to-end validation tests for backend-frontend JSON compatibility.

This module provides comprehensive end-to-end testing that validates
complete chart configurations from backend serialization to frontend
format expectations. It tests real-world scenarios and complex
integrations.

Key Features:
- Complete chart configuration validation
- Multi-series chart validation
- Complex nested structure validation
- Performance validation for large datasets
- Integration scenario validation
"""

import time

import pytest

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.options.chart_options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.charts.options.ui_options import LegendOptions
from streamlit_lightweight_charts_pro.charts.series.area import AreaSeries
from streamlit_lightweight_charts_pro.charts.series.baseline import BaselineSeries
from streamlit_lightweight_charts_pro.charts.series.candlestick import CandlestickSeries
from streamlit_lightweight_charts_pro.charts.series.histogram import HistogramSeries
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.data.area_data import AreaData
from streamlit_lightweight_charts_pro.data.baseline_data import BaselineData
from streamlit_lightweight_charts_pro.data.candlestick_data import CandlestickData
from streamlit_lightweight_charts_pro.data.histogram_data import HistogramData
from streamlit_lightweight_charts_pro.data.line_data import LineData


class TestCompleteChartValidation:
    """Test complete chart configurations end-to-end."""

    def test_simple_line_chart_validation(self):
        """Test simple line chart configuration end-to-end."""
        # Create simple line chart
        data = [
            LineData(time=1640995200, value=100.0),
            LineData(time=1641081600, value=105.0),
            LineData(time=1641168000, value=102.0),
        ]
        series = LineSeries(data=data)
        chart = Chart(series=[series])

        # Get frontend configuration
        config = chart.to_frontend_config()

        # Validate top-level structure
        assert "charts" in config
        assert isinstance(config["charts"], list)
        assert len(config["charts"]) == 1

        # Validate chart structure
        chart_config = config["charts"][0]
        assert "chart" in chart_config
        assert "series" in chart_config
        assert isinstance(chart_config["series"], list)
        assert len(chart_config["series"]) == 1

        # Validate series structure
        series_config = chart_config["series"][0]
        assert series_config["type"] == "line"
        assert "data" in series_config
        assert isinstance(series_config["data"], list)
        assert len(series_config["data"]) == 3

        # Validate data points
        for i, data_point in enumerate(series_config["data"]):
            assert "time" in data_point
            assert "value" in data_point
            assert isinstance(data_point["time"], int)
            assert isinstance(data_point["value"], float)

            # Verify data integrity
            expected_times = [1640995200, 1641081600, 1641168000]
            expected_values = [100.0, 105.0, 102.0]
            assert data_point["time"] == expected_times[i]
            assert data_point["value"] == expected_values[i]

        # Validate series properties - some are now in options object
        assert "options" in series_config
        assert series_config["options"]["visible"] is True
        assert series_config["options"]["priceScaleId"] == "right"
        assert series_config["paneId"] == 0
        assert series_config["options"]["lastValueVisible"] is True
        assert series_config["options"]["priceLineVisible"] is True
        assert series_config["options"]["zIndex"] == 100

    def test_candlestick_chart_validation(self):
        """Test candlestick chart configuration end-to-end."""
        # Create candlestick chart
        data = [
            CandlestickData(time=1640995200, open=100, high=105, low=98, close=102),
            CandlestickData(time=1641081600, open=102, high=108, low=100, close=106),
            CandlestickData(time=1641168000, open=106, high=110, low=104, close=108),
        ]
        series = CandlestickSeries(data=data)
        chart = Chart(series=[series])

        # Get frontend configuration
        config = chart.to_frontend_config()

        # Validate series structure
        series_config = config["charts"][0]["series"][0]
        assert series_config["type"] == "candlestick"
        assert len(series_config["data"]) == 3

        # Validate OHLC data points
        for i, data_point in enumerate(series_config["data"]):
            assert "time" in data_point
            assert "open" in data_point
            assert "high" in data_point
            assert "low" in data_point
            assert "close" in data_point

            assert isinstance(data_point["time"], int)
            assert isinstance(data_point["open"], (int, float))
            assert isinstance(data_point["high"], (int, float))
            assert isinstance(data_point["low"], (int, float))
            assert isinstance(data_point["close"], (int, float))

            # Verify data integrity
            expected_data = [
                (1640995200, 100, 105, 98, 102),
                (1641081600, 102, 108, 100, 106),
                (1641168000, 106, 110, 104, 108),
            ]
            expected = expected_data[i]
            assert data_point["time"] == expected[0]
            assert data_point["open"] == expected[1]
            assert data_point["high"] == expected[2]
            assert data_point["low"] == expected[3]
            assert data_point["close"] == expected[4]

    def test_histogram_chart_validation(self):
        """Test histogram chart configuration end-to-end."""
        # Create histogram chart
        data = [
            HistogramData(time=1640995200, value=100.5),
            HistogramData(time=1641081600, value=105.2),
            HistogramData(time=1641168000, value=102.8),
        ]
        series = HistogramSeries(data=data)
        chart = Chart(series=[series])

        # Get frontend configuration
        config = chart.to_frontend_config()

        # Validate series structure
        series_config = config["charts"][0]["series"][0]
        assert series_config["type"] == "histogram"
        assert len(series_config["data"]) == 3

        # Validate histogram options
        assert "options" in series_config
        options = series_config["options"]
        assert "base" in options
        assert "color" in options
        assert options["base"] == 0
        assert options["color"] == "#26a69a"

        # Validate data points
        for i, data_point in enumerate(series_config["data"]):
            assert "time" in data_point
            assert "value" in data_point
            assert isinstance(data_point["time"], int)
            assert isinstance(data_point["value"], float)

            # Verify data integrity
            expected_values = [100.5, 105.2, 102.8]
            assert data_point["value"] == expected_values[i]

    def test_area_chart_validation(self):
        """Test area chart configuration end-to-end."""
        # Create area chart
        data = [
            AreaData(time=1640995200, value=100.0),
            AreaData(time=1641081600, value=105.0),
            AreaData(time=1641168000, value=102.0),
        ]
        series = AreaSeries(data=data)
        chart = Chart(series=[series])

        # Get frontend configuration
        config = chart.to_frontend_config()

        # Validate series structure
        series_config = config["charts"][0]["series"][0]
        assert series_config["type"] == "area"
        assert len(series_config["data"]) == 3

        # Validate data points
        for data_point in series_config["data"]:
            assert "time" in data_point
            assert "value" in data_point
            assert isinstance(data_point["time"], int)
            assert isinstance(data_point["value"], float)

    def test_baseline_chart_validation(self):
        """Test baseline chart configuration end-to-end."""
        # Create baseline chart
        data = [
            BaselineData(time=1640995200, value=100.0),
            BaselineData(time=1641081600, value=105.0),
            BaselineData(time=1641168000, value=102.0),
        ]
        series = BaselineSeries(data=data)
        chart = Chart(series=[series])

        # Get frontend configuration
        config = chart.to_frontend_config()

        # Validate series structure
        series_config = config["charts"][0]["series"][0]
        assert series_config["type"] == "baseline"
        assert len(series_config["data"]) == 3

        # Validate baseline options
        assert "options" in series_config
        options = series_config["options"]
        assert "baseValue" in options
        assert "relativeGradient" in options

        # Validate data points
        for data_point in series_config["data"]:
            assert "time" in data_point
            assert "value" in data_point
            assert isinstance(data_point["time"], int)
            assert isinstance(data_point["value"], float)


class TestMultiSeriesChartValidation:
    """Test multi-series chart configurations end-to-end."""

    def test_line_and_candlestick_chart_validation(self):
        """Test chart with line and candlestick series."""
        # Create line series
        line_data = [LineData(time=1640995200 + i, value=100.0 + i) for i in range(5)]
        line_series = LineSeries(data=line_data)

        # Create candlestick series
        candlestick_data = [
            CandlestickData(time=1640995200 + i, open=100, high=105, low=98, close=102)
            for i in range(5)
        ]
        candlestick_series = CandlestickSeries(data=candlestick_data)

        # Create chart with both series
        chart = Chart(series=[line_series, candlestick_series])
        config = chart.to_frontend_config()

        # Validate structure
        assert len(config["charts"]) == 1
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 2

        # Validate line series
        line_config = chart_config["series"][0]
        assert line_config["type"] == "line"
        assert len(line_config["data"]) == 5

        # Validate candlestick series
        candlestick_config = chart_config["series"][1]
        assert candlestick_config["type"] == "candlestick"
        assert len(candlestick_config["data"]) == 5

        # Validate data integrity
        for i in range(5):
            # Line series data
            line_data_point = line_config["data"][i]
            assert line_data_point["time"] == 1640995200 + i
            assert line_data_point["value"] == 100.0 + i

            # Candlestick series data
            candlestick_data_point = candlestick_config["data"][i]
            assert candlestick_data_point["time"] == 1640995200 + i
            assert candlestick_data_point["open"] == 100
            assert candlestick_data_point["high"] == 105
            assert candlestick_data_point["low"] == 98
            assert candlestick_data_point["close"] == 102

    def test_mixed_series_types_chart_validation(self):
        """Test chart with multiple different series types."""
        # Create different series types
        line_data = [LineData(time=1640995200 + i, value=100.0 + i) for i in range(3)]
        line_series = LineSeries(data=line_data)

        area_data = [AreaData(time=1640995200 + i, value=95.0 + i) for i in range(3)]
        area_series = AreaSeries(data=area_data)

        histogram_data = [HistogramData(time=1640995200 + i, value=50.0 + i) for i in range(3)]
        histogram_series = HistogramSeries(data=histogram_data)

        candlestick_data = [
            CandlestickData(time=1640995200 + i, open=100, high=105, low=98, close=102)
            for i in range(3)
        ]
        candlestick_series = CandlestickSeries(data=candlestick_data)

        # Create chart with all series
        chart = Chart(series=[line_series, area_series, histogram_series, candlestick_series])
        config = chart.to_frontend_config()

        # Validate structure
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 4

        # Validate each series type
        series_types = ["line", "area", "histogram", "candlestick"]
        for i, expected_type in enumerate(series_types):
            series_config = chart_config["series"][i]
            assert series_config["type"] == expected_type
            assert len(series_config["data"]) == 3

            # Validate data points
            for j, data_point in enumerate(series_config["data"]):
                assert "time" in data_point
                assert data_point["time"] == 1640995200 + j

                if expected_type == "candlestick":
                    assert "open" in data_point
                    assert "high" in data_point
                    assert "low" in data_point
                    assert "close" in data_point
                else:
                    assert "value" in data_point
                    assert isinstance(data_point["value"], float)


class TestLegendIntegrationValidation:
    """Test legend integration in chart configurations."""

    def test_series_with_legend_validation(self):
        """Test series with legend configuration."""
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)

        # Add legend
        legend = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(255, 255, 255, 0.9)",
            border_color="#e1e3e6",
            border_width=1,
            border_radius=4,
            text="<span style='color: #2196f3'>MA20: $$value$$</span>",
        )
        series.legend = legend

        chart = Chart(series=[series])
        config = chart.to_frontend_config()

        # Validate legend in series
        series_config = config["charts"][0]["series"][0]
        assert "legend" in series_config

        legend_config = series_config["legend"]
        assert legend_config["visible"] is True
        assert legend_config["position"] == "top-left"
        assert legend_config["backgroundColor"] == "rgba(255, 255, 255, 0.9)"
        assert legend_config["borderColor"] == "#e1e3e6"
        assert legend_config["borderWidth"] == 1
        assert legend_config["borderRadius"] == 4
        assert legend_config["text"] == "<span style='color: #2196f3'>MA20: $$value$$</span>"

    def test_multiple_series_with_legends_validation(self):
        """Test multiple series with different legend configurations."""
        # Create first series with legend
        line_data = [LineData(time=1640995200, value=100.0)]
        line_series = LineSeries(data=line_data)
        line_legend = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(255, 0, 0, 0.5)",
            text="Line Series",
        )
        line_series.legend = line_legend

        # Create second series with different legend
        area_data = [AreaData(time=1640995200, value=95.0)]
        area_series = AreaSeries(data=area_data)
        area_legend = LegendOptions(
            visible=True,
            position="bottom-right",
            background_color="rgba(0, 255, 0, 0.5)",
            text="Area Series",
        )
        area_series.legend = area_legend

        chart = Chart(series=[line_series, area_series])
        config = chart.to_frontend_config()

        # Validate both legends
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 2

        # Validate line series legend
        line_config = chart_config["series"][0]
        assert "legend" in line_config
        line_legend_config = line_config["legend"]
        assert line_legend_config["position"] == "top-left"
        assert line_legend_config["backgroundColor"] == "rgba(255, 0, 0, 0.5)"
        assert line_legend_config["text"] == "Line Series"

        # Validate area series legend
        area_config = chart_config["series"][1]
        assert "legend" in area_config
        area_legend_config = area_config["legend"]
        assert area_legend_config["position"] == "bottom-right"
        assert area_legend_config["backgroundColor"] == "rgba(0, 255, 0, 0.5)"
        assert area_legend_config["text"] == "Area Series"


class TestPriceScaleIntegrationValidation:
    """Test price scale integration in chart configurations."""

    def test_series_with_price_scale_validation(self):
        """Test series with custom price scale configuration."""
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)

        # Set custom price scale
        series.price_scale_id = "custom_scale"

        chart = Chart(series=[series])
        config = chart.to_frontend_config()

        # Validate price scale in series - priceScaleId is now in options object
        series_config = config["charts"][0]["series"][0]
        assert "options" in series_config
        assert series_config["options"]["priceScaleId"] == "custom_scale"

    def test_chart_with_price_scale_options_validation(self):
        """Test chart with price scale options configuration."""
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)

        # Create chart with price scale options
        chart_options = ChartOptions()
        chart_options.right_price_scale = PriceScaleOptions(
            visible=True,
            auto_scale=False,
            invert_scale=True,
        )
        chart_options.left_price_scale = PriceScaleOptions(
            visible=False,
            auto_scale=True,
            invert_scale=False,
        )

        chart = Chart(options=chart_options, series=[series])
        config = chart.to_frontend_config()

        # Validate price scale options in chart
        chart_config = config["charts"][0]["chart"]
        assert "rightPriceScale" in chart_config
        assert "leftPriceScale" in chart_config

        right_scale = chart_config["rightPriceScale"]
        assert right_scale["visible"] is True
        assert right_scale["autoScale"] is False
        assert right_scale["invertScale"] is True

        left_scale = chart_config["leftPriceScale"]
        assert left_scale["visible"] is False
        assert left_scale["autoScale"] is True
        assert left_scale["invertScale"] is False


class TestComplexConfigurationValidation:
    """Test complex chart configurations with multiple features."""

    def test_complete_trading_chart_validation(self):
        """Test a complete trading chart with multiple features."""
        # Create price series
        price_data = [
            CandlestickData(
                time=1640995200 + i,
                open=100 + i,
                high=105 + i,
                low=98 + i,
                close=102 + i,
            )
            for i in range(10)
        ]
        price_series = CandlestickSeries(data=price_data)

        # Create volume series
        volume_data = [HistogramData(time=1640995200 + i, value=1000 + i * 100) for i in range(10)]
        volume_series = HistogramSeries(data=volume_data)
        volume_series.price_scale_id = "volume"

        # Create moving average series
        ma_data = [LineData(time=1640995200 + i, value=101 + i) for i in range(10)]
        ma_series = LineSeries(data=ma_data)
        ma_series.price_scale_id = "right"

        # Add legends
        price_series.legend = LegendOptions(visible=True, position="top-left", text="Price")
        volume_series.legend = LegendOptions(visible=True, position="top-right", text="Volume")
        ma_series.legend = LegendOptions(visible=True, position="bottom-left", text="MA20")

        # Create chart with custom options
        chart_options = ChartOptions()
        chart_options.right_price_scale = PriceScaleOptions(
            visible=True,
            auto_scale=True,
            invert_scale=False,
        )
        chart_options.left_price_scale = PriceScaleOptions(visible=False)

        chart = Chart(options=chart_options, series=[price_series, volume_series, ma_series])
        config = chart.to_frontend_config()

        # Validate complete structure
        assert len(config["charts"]) == 1
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 3

        # Validate chart options
        chart_options_config = chart_config["chart"]
        assert "rightPriceScale" in chart_options_config
        assert "leftPriceScale" in chart_options_config

        # Validate each series
        series_types = ["candlestick", "histogram", "line"]
        for i, expected_type in enumerate(series_types):
            series_config = chart_config["series"][i]
            assert series_config["type"] == expected_type
            assert len(series_config["data"]) == 10
            assert "legend" in series_config

            # Validate legend
            legend_config = series_config["legend"]
            assert legend_config["visible"] is True
            assert "position" in legend_config
            assert "text" in legend_config

        # Validate data integrity
        for i in range(10):
            # Price data
            price_data_point = chart_config["series"][0]["data"][i]
            assert price_data_point["time"] == 1640995200 + i
            assert price_data_point["open"] == 100 + i

            # Volume data
            volume_data_point = chart_config["series"][1]["data"][i]
            assert volume_data_point["time"] == 1640995200 + i
            assert volume_data_point["value"] == 1000 + i * 100

            # MA data
            ma_data_point = chart_config["series"][2]["data"][i]
            assert ma_data_point["time"] == 1640995200 + i
            assert ma_data_point["value"] == 101 + i


class TestPerformanceValidation:
    """Test performance characteristics of complex configurations."""

    def test_large_dataset_performance(self):
        """Test performance with large datasets."""
        # Create large dataset
        large_data = [LineData(time=1640995200 + i, value=100.0 + i) for i in range(1000)]
        series = LineSeries(data=large_data)
        chart = Chart(series=[series])

        # Measure serialization time
        start_time = time.time()
        config = chart.to_frontend_config()
        serialization_time = time.time() - start_time

        # Validate performance (should be under 100ms for 1000 points)
        assert serialization_time < 0.1, (
            f"Large dataset serialization took {serialization_time:.3f}s, expected < 0.1s"
        )

        # Validate structure
        series_config = config["charts"][0]["series"][0]
        assert len(series_config["data"]) == 1000

        # Validate data integrity
        for i, data_point in enumerate(series_config["data"]):
            assert data_point["time"] == 1640995200 + i
            assert data_point["value"] == 100.0 + i

    def test_complex_configuration_performance(self):
        """Test performance with complex chart configuration."""
        # Create complex configuration
        data1 = [LineData(time=1640995200 + i, value=100.0 + i) for i in range(100)]
        data2 = [
            CandlestickData(time=1640995200 + i, open=100, high=105, low=98, close=102)
            for i in range(100)
        ]
        data3 = [HistogramData(time=1640995200 + i, value=50.0 + i) for i in range(100)]

        series1 = LineSeries(data=data1)
        series1.legend = LegendOptions(visible=True, position="top-left", text="Line")

        series2 = CandlestickSeries(data=data2)
        series2.legend = LegendOptions(visible=True, position="top-right", text="Candlestick")

        series3 = HistogramSeries(data=data3)
        series3.legend = LegendOptions(visible=True, position="bottom-left", text="Volume")

        chart_options = ChartOptions()
        chart_options.right_price_scale = PriceScaleOptions(
            visible=True,
            auto_scale=False,
            invert_scale=True,
            border_visible=False,
            ticks_visible=False,
        )

        chart = Chart(options=chart_options, series=[series1, series2, series3])

        # Measure serialization time
        start_time = time.time()
        config = chart.to_frontend_config()
        serialization_time = time.time() - start_time

        # Validate performance (should be under 200ms for complex config)
        # Increased from 50ms to account for CI/CD system variance
        assert serialization_time < 0.2, (
            f"Complex configuration serialization took {serialization_time:.3f}s, expected < 0.2s"
        )

        # Validate structure
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 3
        assert "rightPriceScale" in chart_config["chart"]

        # Validate each series
        for _i, series_config in enumerate(chart_config["series"]):
            assert len(series_config["data"]) == 100
            assert "legend" in series_config
            assert series_config["legend"]["visible"] is True


if __name__ == "__main__":
    pytest.main([__file__])
