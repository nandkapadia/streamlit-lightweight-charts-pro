"""Test suite for RibbonSeries.

This module provides comprehensive testing for the RibbonSeries class,
ensuring proper functionality, data handling, and configuration options.
"""

# pylint: disable=no-member,protected-access

import numpy as np
import pandas as pd
from lightweight_charts_core.charts.series.band import BandSeries
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.charts.series.ribbon import RibbonSeries
from lightweight_charts_core.data.ribbon import RibbonData
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.type_definitions.enums import LineStyle


class TestRibbonSeries:
    """Test cases for RibbonSeries class."""

    def test_ribbon_series_initialization(self):
        """Test basic initialization of RibbonSeries."""
        # Create test data
        data = [
            RibbonData("2024-01-01", upper=110, lower=100),
            RibbonData("2024-01-02", upper=112, lower=102),
        ]

        # Create series
        series = RibbonSeries(data=data)

        # Verify basic attributes
        assert series.data == data
        assert series.visible is True
        assert series.price_scale_id == ""
        assert series.pane_id == 0
        assert series.chart_type == ChartType.RIBBON

    def test_ribbon_series_with_dataframe(self):
        """Test RibbonSeries initialization with DataFrame."""
        # Create DataFrame
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01", "2024-01-02"],
                "upper": [110, 112],
                "lower": [100, 102],
            },
        )

        # Create series with DataFrame
        series = RibbonSeries(
            data=test_dataframe,
            column_mapping={"time": "time", "upper": "upper", "lower": "lower"},
        )

        # Verify data conversion
        assert len(series.data) == 2
        assert isinstance(series.data[0], RibbonData)
        assert series.data[0].upper == 110
        assert series.data[0].lower == 100

    def test_ribbon_series_with_column_mapping(self):
        """Test RibbonSeries with custom column mapping."""
        # Create DataFrame with different column names
        test_dataframe = pd.DataFrame(
            {
                "datetime": ["2024-01-01", "2024-01-02"],
                "high": [110, 112],
                "low": [100, 102],
            },
        )

        # Create series with column mapping
        column_mapping = {
            "time": "datetime",
            "upper": "high",
            "lower": "low",
        }

        series = RibbonSeries(data=test_dataframe, column_mapping=column_mapping)

        # Verify data conversion
        assert len(series.data) == 2
        assert series.data[0].upper == 110
        assert series.data[0].lower == 100

    def test_ribbon_series_default_line_options(self):
        """Test default line options for RibbonSeries."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data)

        # Verify default line options
        assert series.upper_line.color == "#4CAF50"
        assert series.upper_line.line_width == 2
        assert series.upper_line.line_style == LineStyle.SOLID

        assert series.lower_line.color == "#F44336"
        assert series.lower_line.line_width == 2
        assert series.lower_line.line_style == LineStyle.SOLID

    def test_ribbon_series_default_colors(self):
        """Test default colors for RibbonSeries."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data)

        # Verify default colors
        assert series.fill_color == "rgba(76, 175, 80, 0.1)"
        assert series.fill_visible is True

    def test_ribbon_series_custom_line_options(self):
        """Test custom line options for RibbonSeries."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data)

        # Customize line options
        series.upper_line.color = "#FF0000"
        series.upper_line.line_width = 3
        series.upper_line.line_style = "dashed"

        series.lower_line.color = "#00FF00"
        series.lower_line.line_width = 4
        series.lower_line.line_style = "dotted"

        # Verify custom options
        assert series.upper_line.color == "#FF0000"
        assert series.upper_line.line_width == 3
        assert series.upper_line.line_style == "dashed"

        assert series.lower_line.color == "#00FF00"
        assert series.lower_line.line_width == 4
        assert series.lower_line.line_style == "dotted"

    def test_ribbon_series_custom_colors(self):
        """Test custom colors for RibbonSeries."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data)

        # Customize colors
        series.fill_color = "rgba(255, 0, 0, 0.5)"
        series.fill_visible = False

        # Verify custom colors
        assert series.fill_color == "rgba(255, 0, 0, 0.5)"
        assert series.fill_visible is False

    def test_ribbon_series_property_setting(self):
        """Test property setting for RibbonSeries."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data)

        # Test property setting
        series.upper_line.color = "#FF0000"
        series.upper_line.line_width = 3
        series.lower_line.color = "#00FF00"
        series.fill_color = "rgba(0, 255, 0, 0.3)"
        series.visible = False

        # Verify changes were applied
        assert series.upper_line.color == "#FF0000"
        assert series.upper_line.line_width == 3
        assert series.lower_line.color == "#00FF00"
        assert series.fill_color == "rgba(0, 255, 0, 0.3)"
        assert series.visible is False

    def test_ribbon_series_data_validation(self):
        """Test data validation in RibbonSeries."""
        # Test with None values (now allowed for missing data)
        data1 = RibbonData("2024-01-01", upper=None, lower=100)
        data2 = RibbonData("2024-01-02", upper=110, lower=None)

        # Verify None values are allowed
        assert data1.upper is None
        assert data1.lower == 100
        assert data2.upper == 110
        assert data2.lower is None

        # Test with valid data
        data3 = RibbonData("2024-01-03", upper=110, lower=100)
        assert data3.upper == 110
        assert data3.lower == 100

    def test_ribbon_series_nan_handling(self):
        """Test NaN handling in RibbonSeries data."""
        # Test with NaN values
        data = [
            RibbonData("2024-01-01", upper=np.nan, lower=100),
            RibbonData("2024-01-02", upper=110, lower=np.nan),
        ]

        series = RibbonSeries(data=data)

        # Verify NaN values are converted to None for missing data
        assert series.data[0].upper is None
        assert series.data[1].lower is None

    def test_ribbon_series_optional_fill(self):
        """Test optional fill in RibbonData."""
        # Test with optional colors specified
        data = [
            RibbonData("2024-01-01", upper=110, lower=100, fill="rgba(255, 0, 0, 0.3)"),
            RibbonData("2024-01-02", upper=112, lower=102),
        ]

        series = RibbonSeries(data=data)

        # Verify optional colors are preserved

        assert series.data[0].fill == "rgba(255, 0, 0, 0.3)"

        assert series.data[1].fill is None

    def test_ribbon_series_visibility_controls(self):
        """Test visibility controls for RibbonSeries."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data)

        # Test initial visibility
        assert series.visible is True

        # Test setting visibility
        series.visible = False
        assert series.visible is False

        # Test setting visibility
        series.visible = True
        assert series.visible is True

    def test_ribbon_series_price_scale_configuration(self):
        """Test price scale configuration for RibbonSeries."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data, price_scale_id="left")

        # Verify price scale configuration
        assert series.price_scale_id == "left"

        # Test changing price scale
        series.price_scale_id = "right"
        assert series.price_scale_id == "right"

    def test_ribbon_series_pane_configuration(self):
        """Test pane configuration for RibbonSeries."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data, pane_id=1)

        # Verify pane configuration
        assert series.pane_id == 1

        # Test changing pane
        series.pane_id = 2
        assert series.pane_id == 2

    def test_ribbon_series_empty_data(self):
        """Test RibbonSeries with empty data."""
        # Test with empty list
        series = RibbonSeries(data=[])
        assert len(series.data) == 0

        # Test with empty DataFrame
        empty_dataframe = pd.DataFrame(columns=["time", "upper", "lower"])
        series = RibbonSeries(
            data=empty_dataframe,
            column_mapping={"time": "time", "upper": "upper", "lower": "lower"},
        )
        assert len(series.data) == 0

    def test_ribbon_series_single_data_point(self):
        """Test RibbonSeries with single data point."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data)

        # Verify single data point handling
        assert len(series.data) == 1
        assert series.data[0].upper == 110
        assert series.data[0].lower == 100

    def test_ribbon_series_large_dataset(self):
        """Test RibbonSeries with large dataset."""
        # Create large dataset
        dates = pd.date_range("2024-01-01", periods=1000, freq="D")
        data = [
            RibbonData(str(date.date()), upper=100 + i, lower=90 + i)
            for i, date in enumerate(dates)
        ]

        series = RibbonSeries(data=data)

        # Verify large dataset handling
        assert len(series.data) == 1000
        assert series.data[0].upper == 100
        assert series.data[0].lower == 90
        assert series.data[-1].upper == 1099
        assert series.data[-1].lower == 1089

    def test_ribbon_series_data_serialization(self):
        """Test data serialization for RibbonSeries."""
        data = [
            RibbonData("2024-01-01", upper=110, lower=100, fill="rgba(255, 0, 0, 0.3)"),
        ]

        series = RibbonSeries(data=data)

        # Test serialization of first data point
        serialized = series.data[0].asdict()

        # Verify required fields
        assert "time" in serialized
        assert "upper" in serialized
        assert "lower" in serialized

        # Verify optional fields are included when present
        assert "fill" in serialized
        assert "fill" in serialized

    def test_ribbon_series_inheritance(self):
        """Test that RibbonSeries properly inherits from Series."""
        data = [RibbonData("2024-01-01", upper=110, lower=100)]
        series = RibbonSeries(data=data)

        # Verify inheritance
        assert isinstance(series, Series)

        # Verify it's not an instance of other series types
        assert not isinstance(series, BandSeries)

    def test_ribbon_series_chart_type_consistency(self):
        """Test that chart type is consistent across instances."""
        data1 = [RibbonData("2024-01-01", upper=110, lower=100)]
        data2 = [RibbonData("2024-01-02", upper=112, lower=102)]

        series1 = RibbonSeries(data=data1)
        series2 = RibbonSeries(data=data2)

        # Verify chart type consistency
        assert series1.chart_type == ChartType.RIBBON
        assert series2.chart_type == ChartType.RIBBON
        assert series1.chart_type == series2.chart_type

    def test_ribbon_series_gap_handling(self):
        """Test handling of gaps (None values) in RibbonSeries data."""
        # Create data with gaps
        data = [
            RibbonData("2024-01-01", upper=110, lower=100),  # Valid
            RibbonData("2024-01-02", upper=None, lower=None),  # Gap
            RibbonData("2024-01-03", upper=None, lower=None),  # Gap
            RibbonData("2024-01-04", upper=112, lower=102),  # Valid
            RibbonData("2024-01-05", upper=None, lower=None),  # Gap
            RibbonData("2024-01-06", upper=114, lower=104),  # Valid
        ]

        series = RibbonSeries(data=data)

        # Verify gaps are preserved
        assert series.data[0].upper == 110  # Valid
        assert series.data[1].upper is None  # Gap
        assert series.data[2].upper is None  # Gap
        assert series.data[3].upper == 112  # Valid
        assert series.data[4].upper is None  # Gap
        assert series.data[5].upper == 114  # Valid

        # Verify the series can handle gaps without errors
        assert len(series.data) == 6
        assert series.chart_type == ChartType.RIBBON
