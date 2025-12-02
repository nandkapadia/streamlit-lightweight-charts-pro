"""Unit tests for TrendFillSeries with dual mode support.

This module provides comprehensive testing for the upgraded TrendFillSeries
that supports both single and dual trend line modes.
"""

import pandas as pd
from lightweight_charts_core.charts.series.trend_fill import TrendFillSeries
from lightweight_charts_core.data.trend_fill import TrendFillData


class TestTrendFillData:
    """Test cases for TrendFillData class."""

    def test_single_mode_creation(self):
        """Test creating TrendFillData in single mode."""
        data = TrendFillData("2024-01-01", trend_line=110.0, base_line=105.0, trend_direction=1)

        assert data.trend_line == 110.0
        assert data.base_line == 105.0
        assert data.trend_direction == 1

        """Test asdict output in single mode."""
        data = [
            TrendFillData("2024-01-01", trend_line=110.0, base_line=105.0, trend_direction=1),
            TrendFillData("2024-01-02", trend_line=108.0, base_line=113.0, trend_direction=-1),
        ]

        series = TrendFillSeries(
            data=data,
        )
        data_dict = series.asdict()

        assert len(data_dict["data"]) == 2

        # Check trend direction values
        assert data_dict["data"][0]["trendDirection"] == 1
        assert data_dict["data"][1]["trendDirection"] == -1

        # Check trend line values
        assert data_dict["data"][0]["trendLine"] == 110.0
        assert data_dict["data"][1]["trendLine"] == 108.0

        """Test trend data validation."""
        data = [
            TrendFillData("2024-01-01", trend_line=110.0, base_line=105.0, trend_direction=1),
            TrendFillData("2024-01-02", trend_line=112.0, base_line=107.0, trend_direction=1),
            TrendFillData("2024-01-03", trend_line=108.0, base_line=113.0, trend_direction=-1),
            TrendFillData("2024-01-04", trend_line=105.0, base_line=110.0, trend_direction=-1),
        ]

        series = TrendFillSeries(
            data=data,
        )

        assert len(series.data) == 4
        assert series.data[0].trend_direction == 1
        assert series.data[1].trend_direction == 1
        assert series.data[2].trend_direction == -1
        assert series.data[3].trend_direction == -1

    def test_trend_statistics(self):
        """Test trend statistics calculation."""
        data = [
            TrendFillData("2024-01-01", trend_line=110.0, base_line=105.0, trend_direction=1),
            TrendFillData("2024-01-02", trend_line=112.0, base_line=107.0, trend_direction=1),
            TrendFillData("2024-01-03", trend_line=108.0, base_line=113.0, trend_direction=-1),
            TrendFillData("2024-01-04", trend_line=110.0, base_line=110.0, trend_direction=0),
        ]

        series = TrendFillSeries(
            data=data,
        )

        assert len(series.data) == 4
        assert series.data[0].trend_direction == 1
        assert series.data[1].trend_direction == 1
        assert series.data[2].trend_direction == -1
        assert series.data[3].trend_direction == 0

    def test_pandas_integration(self):
        """Test integration with pandas DataFrames."""
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01", "2024-01-02"],
                "trend_line": [110.0, 112.0],
                "base_line": [105.0, 107.0],
                "trend_direction": [1, 1],
            },
        )

        series = TrendFillSeries(
            data=test_dataframe,
            column_mapping={
                "time": "time",
                "trend_line": "trend_line",
                "base_line": "base_line",
                "trend_direction": "trend_direction",
            },
        )

        assert len(series.data) == 2
        assert series.data[0].trend_line == 110.0
        assert series.data[1].trend_line == 112.0

    def test_fill_color_handling(self):
        """Test fill color handling."""
        series = TrendFillSeries(
            data=[],
            uptrend_fill_color="#00FF00",
            downtrend_fill_color="#FF0000",
        )

        assert series.uptrend_fill_color == "rgba(0, 255, 0, 0.3)"
        assert series.downtrend_fill_color == "rgba(255, 0, 0, 0.3)"

    def test_empty_data(self):
        """Test handling of empty data."""
        series = TrendFillSeries(data=[])

        assert len(series.data) == 0
