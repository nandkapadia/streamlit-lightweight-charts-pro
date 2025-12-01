"""
Core Chart tests - Construction, series management, and basic operations.

This module tests the fundamental Chart class functionality including construction,
series management, options updates, and method chaining.
"""

# Third Party Imports
import pytest
from lightweight_charts_core.charts.options import ChartOptions
from lightweight_charts_core.charts.series.line import LineSeries
from lightweight_charts_core.data.line_data import LineData

# Local Imports
from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.exceptions import SeriesItemsTypeError, TypeValidationError


class TestChartConstruction:
    """Test Chart class construction."""

    def test_empty_construction(self):
        """Test Chart construction with no parameters."""
        chart = Chart()

        assert chart.series == []
        assert isinstance(chart.options, ChartOptions)

    def test_construction_with_single_series(self):
        """Test Chart construction with a single series."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)

        chart = Chart(series=series)

        assert len(chart.series) == 1
        assert chart.series[0] == series

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

    def test_construction_with_none_series(self):
        """Test construction with None series."""
        chart = Chart(series=None)
        assert chart.series == []

    def test_construction_with_empty_list_series(self):
        """Test construction with empty list series."""
        chart = Chart(series=[])
        assert chart.series == []

    def test_construction_with_invalid_series_type(self):
        """Test construction with invalid series type."""
        with pytest.raises(TypeValidationError):
            Chart(series="not a series")

    def test_construction_with_mixed_series_types(self):
        """Test construction with mixed valid and invalid series."""
        data = [LineData(time=1640995200, value=100)]
        valid_series = LineSeries(data=data)

        with pytest.raises(SeriesItemsTypeError):
            Chart(series=[valid_series, "invalid"])


class TestSeriesManagement:
    """Test series management operations."""

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

    def test_add_series_with_none(self):
        """Test adding None as series."""
        chart = Chart()
        with pytest.raises(TypeValidationError, match="series must be Series instance"):
            chart.add_series(None)

    def test_add_series_with_invalid_type(self):
        """Test adding invalid type as series."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_series("not_a_series")

    def test_add_series_method_chaining(self):
        """Test add_series method chaining with multiple calls."""
        data1 = [LineData(time=1640995200, value=100)]
        data2 = [LineData(time=1640995200, value=200)]
        data3 = [LineData(time=1640995200, value=300)]
        series1 = LineSeries(data=data1)
        series2 = LineSeries(data=data2)
        series3 = LineSeries(data=data3)

        chart = Chart().add_series(series1).add_series(series2).add_series(series3)

        assert len(chart.series) == 3
        assert chart.series[0] is series1
        assert chart.series[1] is series2
        assert chart.series[2] is series3


class TestOptionsManagement:
    """Test options management operations."""

    def test_update_options(self):
        """Test updating chart options."""
        chart = Chart()

        result = chart.update_options(height=600, width=800)

        assert result is chart  # Method chaining
        assert chart.options.height == 600
        assert chart.options.width == 800

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

    def test_update_options_with_invalid_attribute(self):
        """Test updating options with invalid attribute (should be ignored)."""
        chart = Chart()
        original_height = chart.options.height

        result = chart.update_options(invalid_attribute="value")

        assert result is chart  # Method chaining
        assert chart.options.height == original_height

    def test_update_options_with_none_values(self):
        """Test updating options with None values."""
        chart = Chart()
        chart.update_options(height=None, width=None)
        # Should not raise error


class TestMethodChaining:
    """Test complex method chaining scenarios."""

    def test_complex_method_chaining(self):
        """Test complex method chaining across multiple operations."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)

        result = Chart().add_series(series).update_options(height=500, width=800)

        assert result is not None
        assert isinstance(result, Chart)
        assert len(result.series) == 1
        assert result.options.height == 500
        assert result.options.width == 800


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
