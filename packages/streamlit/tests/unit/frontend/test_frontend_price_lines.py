"""
Unit tests for frontend price lines handling.

This module tests that the frontend properly processes price lines
that are attached to individual series.
"""

import json

from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.series.line import LineSeries
from lightweight_charts_core.data.line_data import LineData
from lightweight_charts_core.type_definitions.enums import LineStyle

from streamlit_lightweight_charts_pro.charts import Chart


class TestFrontendPriceLines:
    """Test cases for frontend price lines integration."""

    def test_series_config_includes_price_lines(self):
        """Test that series configuration includes price lines."""
        # Create series with price lines
        data = [LineData(time=1704067200, value=100.0)]
        line_options = LineOptions(color="#2196f3")
        series = LineSeries(data=data)

        # Add price line
        price_line = PriceLineOptions(price=108.0, color="#F44336", title="Resistance")
        series.add_price_line(price_line)

        # Get series configuration
        series_config = series.asdict()

        # Verify price lines are included
        assert "priceLines" in series_config
        assert len(series_config["priceLines"]) == 1

        # Verify price line properties
        price_line_config = series_config["priceLines"][0]
        assert price_line_config["price"] == 108.0
        assert price_line_config["color"] == "#F44336"
        assert price_line_config["title"] == "Resistance"

    def test_frontend_config_includes_series_price_lines(self):
        """Test that frontend configuration includes price lines from series."""
        # Create series with price lines
        data = [LineData(time=1704067200, value=100.0)]
        line_options = LineOptions(color="#2196f3")
        series = LineSeries(data=data)

        # Add multiple price lines
        resistance = PriceLineOptions(price=108.0, color="#F44336", title="Resistance")
        support = PriceLineOptions(price=95.0, color="#4CAF50", title="Support")
        series.add_price_line(resistance).add_price_line(support)

        # Create chart
        chart = Chart(series=series)
        frontend_config = chart.to_frontend_config()

        # Verify frontend configuration structure
        assert "charts" in frontend_config
        assert len(frontend_config["charts"]) == 1

        chart_config = frontend_config["charts"][0]
        assert "series" in chart_config
        assert len(chart_config["series"]) == 1

        series_config = chart_config["series"][0]
        assert "priceLines" in series_config
        assert len(series_config["priceLines"]) == 2

        # Verify price lines are properly formatted
        price_lines = series_config["priceLines"]
        assert price_lines[0]["price"] == 108.0
        assert price_lines[0]["title"] == "Resistance"
        assert price_lines[1]["price"] == 95.0
        assert price_lines[1]["title"] == "Support"

    def test_multiple_series_with_price_lines(self):
        """Test that multiple series can have their own price lines."""
        # Create first series with price lines
        data1 = [LineData(time=1704067200, value=100.0)]
        line_options1 = LineOptions(color="#2196f3")
        series1 = LineSeries(data=data1)

        resistance = PriceLineOptions(price=108.0, color="#F44336", title="Resistance 1")
        series1.add_price_line(resistance)

        # Create second series with different price lines
        data2 = [LineData(time=1704067200, value=50.0)]
        line_options2 = LineOptions(color="#FF9800")
        series2 = LineSeries(data=data2)

        support = PriceLineOptions(price=45.0, color="#4CAF50", title="Support 2")
        series2.add_price_line(support)

        # Create chart with both series
        chart = Chart(series=[series1, series2])
        frontend_config = chart.to_frontend_config()

        # Verify both series have their own price lines
        series_configs = frontend_config["charts"][0]["series"]
        assert len(series_configs) == 2

        # First series should have resistance line
        assert len(series_configs[0]["priceLines"]) == 1
        assert series_configs[0]["priceLines"][0]["title"] == "Resistance 1"
        assert series_configs[0]["priceLines"][0]["price"] == 108.0

        # Second series should have support line
        assert len(series_configs[1]["priceLines"]) == 1
        assert series_configs[1]["priceLines"][0]["title"] == "Support 2"
        assert series_configs[1]["priceLines"][0]["price"] == 45.0

    def test_price_lines_json_serialization(self):
        """Test that price lines can be properly serialized to JSON."""
        # Create series with price lines
        data = [LineData(time=1704067200, value=100.0)]
        line_options = LineOptions(color="#2196f3")
        series = LineSeries(data=data)

        price_line = PriceLineOptions(
            price=108.0,
            color="#F44336",
            line_width=2,
            line_style=LineStyle.DASHED,
            line_visible=True,
            axis_label_visible=True,
            title="Test Price Line",
        )
        series.add_price_line(price_line)

        # Get series configuration
        series_config = series.asdict()

        # Verify price line is properly serialized
        assert "priceLines" in series_config
        assert len(series_config["priceLines"]) == 1

        price_line_config = series_config["priceLines"][0]
        assert price_line_config["price"] == 108.0
        assert price_line_config["color"] == "#F44336"
        assert price_line_config["lineWidth"] == 2
        assert price_line_config["lineStyle"] == 2  # LineStyle.DASHED.value
        assert price_line_config["lineVisible"] is True
        assert price_line_config["axisLabelVisible"] is True
        assert price_line_config["title"] == "Test Price Line"

        # Test JSON serialization
        json_str = json.dumps(series_config)
        assert isinstance(json_str, str)

        # Test JSON parsing
        parsed = json.loads(json_str)
        assert "priceLines" in parsed
        assert len(parsed["priceLines"]) == 1
        assert parsed["priceLines"][0]["price"] == 108.0

    def test_empty_price_lines_handling(self):
        """Test that empty price lines are handled correctly."""
        # Create series without price lines
        data = [LineData(time=1704067200, value=100.0)]
        line_options = LineOptions(color="#2196f3")
        series = LineSeries(data=data)

        # Get series configuration
        series_config = series.asdict()

        # Should not include priceLines when none are added
        assert "priceLines" not in series_config

    def test_price_lines_with_all_properties(self):
        """Test price lines with all available properties."""
        # Create series with comprehensive price line
        data = [LineData(time=1704067200, value=100.0)]
        line_options = LineOptions(color="#2196f3")
        series = LineSeries(data=data)

        price_line = PriceLineOptions(
            id="test_id",
            price=108.0,
            color="#F44336",
            line_width=3,
            line_style=LineStyle.DOTTED,
            line_visible=True,
            axis_label_visible=True,
            title="Comprehensive Test",
        )
        series.add_price_line(price_line)

        # Get series configuration
        series_config = series.asdict()

        # Verify all properties are included
        price_line_config = series_config["priceLines"][0]
        assert price_line_config["id"] == "test_id"
        assert price_line_config["price"] == 108.0
        assert price_line_config["color"] == "#F44336"
        assert price_line_config["lineWidth"] == 3
        assert price_line_config["lineStyle"] == 1  # LineStyle.DOTTED.value
        assert price_line_config["lineVisible"] is True
        assert price_line_config["axisLabelVisible"] is True
        assert price_line_config["title"] == "Comprehensive Test"
