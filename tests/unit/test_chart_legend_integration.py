"""
Test chart-level legend integration functionality.

This module provides comprehensive tests for legend integration at the chart level,
covering chart options, series legends, and frontend integration.
"""

import pytest
from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.options.chart_options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.ui_options import LegendOptions
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.data.line_data import LineData


class TestChartLegendConfiguration:
    """Test chart-level legend configuration."""

    def test_chart_without_legends(self):
        """Test chart creation without any legends."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)

        chart = Chart(options=ChartOptions(), series=[series])

        # Chart should be created successfully
        assert chart is not None
        assert len(chart.series) == 1

    def test_chart_with_series_legends(self):
        """Test chart with legends configured on series."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        series.legend = LegendOptions(position="top-right", visible=True)

        chart = Chart(options=ChartOptions(), series=[series])

        # Chart should be created successfully
        assert chart is not None
        assert len(chart.series) == 1
        assert chart.series[0].legend is not None
        assert chart.series[0].legend.position == "top-right"

    def test_chart_with_multiple_series_legends(self):
        """Test chart with multiple series, each with its own legend."""
        data1 = [LineData(time="2023-01-01", value=100)]
        data2 = [LineData(time="2023-01-01", value=200)]

        series1 = LineSeries(data=data1)
        series1.legend = LegendOptions(position="top-left", visible=True)

        series2 = LineSeries(data=data2)
        series2.legend = LegendOptions(position="top-right", visible=True)

        chart = Chart(options=ChartOptions(), series=[series1, series2])

        # Chart should be created successfully
        assert chart is not None
        assert len(chart.series) == 2
        assert chart.series[0].legend.position == "top-left"
        assert chart.series[1].legend.position == "top-right"

    def test_chart_with_mixed_legend_configuration(self):
        """Test chart with some series having legends and others not."""
        data1 = [LineData(time="2023-01-01", value=100)]
        data2 = [LineData(time="2023-01-01", value=200)]

        series1 = LineSeries(data=data1)
        series1.legend = LegendOptions(position="top-left", visible=True)

        series2 = LineSeries(data=data2)
        # No legend for series2

        chart = Chart(options=ChartOptions(), series=[series1, series2])

        # Chart should be created successfully
        assert chart is not None
        assert len(chart.series) == 2
        assert chart.series[0].legend is not None
        assert chart.series[1].legend is None


class TestChartLegendSerialization:
    """Test legend serialization in chart configuration."""

    def test_chart_config_with_series_legends(self):
        """Test chart configuration serialization with series legends."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        series.legend = LegendOptions(
            position="top-right",
            visible=True,
            background_color="rgba(255, 0, 0, 0.5)",
            text="<span>MA20: $$value$$</span>",
        )

        chart = Chart(options=ChartOptions(), series=[series])

        # Get chart configuration
        config = chart.to_frontend_config()

        # Should have charts with series
        assert "charts" in config
        assert len(config["charts"]) == 1

        chart_config = config["charts"][0]
        assert "series" in chart_config
        assert len(chart_config["series"]) == 1

        series_config = chart_config["series"][0]
        assert "legend" in series_config

        legend_config = series_config["legend"]
        assert legend_config["visible"] is True
        assert legend_config["position"] == "top-right"
        assert legend_config["backgroundColor"] == "rgba(255, 0, 0, 0.5)"
        assert legend_config["text"] == "<span>MA20: $$value$$</span>"

    def test_chart_config_without_legends(self):
        """Test chart configuration serialization without legends."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        # No legend configured

        chart = Chart(options=ChartOptions(), series=[series])

        config = chart.to_frontend_config()

        # Should have charts with series without legend
        assert "charts" in config
        assert len(config["charts"]) == 1

        chart_config = config["charts"][0]
        assert "series" in chart_config
        assert len(chart_config["series"]) == 1

        series_config = chart_config["series"][0]
        assert "legend" not in series_config

    def test_chart_config_with_multiple_series_legends(self):
        """Test chart configuration with multiple series legends."""
        data1 = [LineData(time="2023-01-01", value=100)]
        data2 = [LineData(time="2023-01-01", value=200)]

        series1 = LineSeries(data=data1)
        series1.legend = LegendOptions(position="top-left", visible=True)

        series2 = LineSeries(data=data2)
        series2.legend = LegendOptions(position="bottom-right", visible=False)

        chart = Chart(options=ChartOptions(), series=[series1, series2])

        config = chart.to_frontend_config()
        
        # Should have charts with both series and their respective legends
        assert "charts" in config
        assert len(config["charts"]) == 1
        
        chart_config = config["charts"][0]
        assert "series" in chart_config
        assert len(chart_config["series"]) == 2
        
        series1_config = chart_config["series"][0]
        assert "legend" in series1_config
        assert series1_config["legend"]["position"] == "top-left"
        assert series1_config["legend"]["visible"] is True
        
        series2_config = chart_config["series"][1]
        assert "legend" in series2_config
        assert series2_config["legend"]["position"] == "bottom-right"
        assert series2_config["legend"]["visible"] is False

    def test_chart_config_legend_camel_case_conversion(self):
        """Test that legend properties are converted to camelCase in chart config."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        series.legend = LegendOptions(
            background_color="red",
            border_color="blue",
            border_width=2,
            show_values=True,
            value_format=".2f",
            update_on_crosshair=True,
        )

        chart = Chart(options=ChartOptions(), series=[series])

        config = chart.to_frontend_config()
        legend_config = config["charts"][0]["series"][0]["legend"]
        
        # Check camelCase conversion
        assert "backgroundColor" in legend_config
        assert "borderColor" in legend_config
        assert "borderWidth" in legend_config
        assert "showValues" in legend_config
        assert "valueFormat" in legend_config
        assert "updateOnCrosshair" in legend_config


class TestChartLegendEdgeCases:
    """Test edge cases and error handling for chart legends."""

    def test_chart_with_empty_series_legends(self):
        """Test chart with empty series that have legends."""
        series = LineSeries(data=[])
        series.legend = LegendOptions(position="top-right", visible=True)

        chart = Chart(options=ChartOptions(), series=[series])

        # Chart should be created successfully even with empty data
        assert chart is not None
        assert len(chart.series) == 1
        assert chart.series[0].legend is not None

    def test_chart_with_large_dataset_legends(self):
        """Test chart with large dataset and legends."""
        # Create large dataset
        data = [LineData(time=f"2023-01-{i:02d}", value=100 + i) for i in range(1, 32)]
        series = LineSeries(data=data)
        series.legend = LegendOptions(position="top-left", visible=True)

        chart = Chart(options=ChartOptions(), series=[series])

        # Chart should be created successfully
        assert chart is not None
        assert len(chart.series) == 1
        assert chart.series[0].legend is not None

    def test_chart_with_special_legend_text(self):
        """Test chart with special characters in legend text."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        special_text = "<div>Price: ${value} | Time: {time} | Type: {type}</div>"
        series.legend = LegendOptions(text=special_text, position="top-right")

        chart = Chart(options=ChartOptions(), series=[series])

        config = chart.to_frontend_config()
        legend_config = config["charts"][0]["series"][0]["legend"]
        assert legend_config["text"] == special_text

    def test_chart_with_unicode_legend_text(self):
        """Test chart with unicode characters in legend text."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        unicode_text = "📈 Price: {value} | 📅 Time: {time}"
        series.legend = LegendOptions(text=unicode_text, position="top-left")

        chart = Chart(options=ChartOptions(), series=[series])

        config = chart.to_frontend_config()
        legend_config = config["charts"][0]["series"][0]["legend"]
        assert legend_config["text"] == unicode_text

    def test_chart_legend_immutability(self):
        """Test that legend changes don't affect chart configuration."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        series.legend = LegendOptions(position="top-left", visible=True)

        chart = Chart(options=ChartOptions(), series=[series])

        # Get initial config
        initial_config = chart.to_frontend_config()
        initial_position = initial_config["charts"][0]["series"][0]["legend"]["position"]
        
        # Modify legend
        series.legend.set_position("bottom-right")
        
        # Get new config
        new_config = chart.to_frontend_config()
        new_position = new_config["charts"][0]["series"][0]["legend"]["position"]

        # Position should be updated
        assert initial_position == "top-left"
        assert new_position == "bottom-right"

    def test_chart_with_none_legend_after_setting(self):
        """Test chart behavior when legend is set to None after being configured."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        series.legend = LegendOptions(position="top-right", visible=True)

        chart = Chart(options=ChartOptions(), series=[series])

        # Initial config should have legend
        initial_config = chart.to_frontend_config()
        assert "legend" in initial_config["charts"][0]["series"][0]
        
        # Set legend to None
        series.legend = None
        
        # New config should not have legend
        new_config = chart.to_frontend_config()
        assert "legend" not in new_config["charts"][0]["series"][0]


class TestChartLegendPerformance:
    """Test performance characteristics of chart legends."""

    def test_chart_legend_construction_performance(self):
        """Test performance of chart construction with legends."""
        import time

        # Create multiple series with legends
        series_list = []
        for i in range(10):
            data = [LineData(time=f"2023-01-{(i % 28) + 1:02d}", value=100 + i)]
            series = LineSeries(data=data)
            series.legend = LegendOptions(
                position="top-right", visible=True, text=f"Series {i}: {{value}}"
            )
            series_list.append(series)

        start_time = time.time()
        chart = Chart(options=ChartOptions(), series=series_list)
        end_time = time.time()

        # Should complete in reasonable time (less than 1 second)
        assert end_time - start_time < 1.0
        assert chart is not None
        assert len(chart.series) == 10

    def test_chart_legend_serialization_performance(self):
        """Test performance of chart serialization with legends."""
        import time

        # Create chart with multiple series and legends
        series_list = []
        for i in range(5):
            data = [LineData(time=f"2023-01-{(i % 28) + 1:02d}", value=100 + i)]
            series = LineSeries(data=data)
            series.legend = LegendOptions(
                position="top-right", visible=True, text=f"Series {i}: {{value}}"
            )
            series_list.append(series)

        chart = Chart(options=ChartOptions(), series=series_list)

        start_time = time.time()
        config = chart.to_frontend_config()
        end_time = time.time()

        # Should complete in reasonable time (less than 0.1 seconds)
        assert end_time - start_time < 0.1
        assert "charts" in config
        assert len(config["charts"]) == 1
        assert "series" in config["charts"][0]
        assert len(config["charts"][0]["series"]) == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
