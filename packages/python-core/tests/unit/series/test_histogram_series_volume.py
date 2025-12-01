"""Tests for volume series creation.

This module tests the HistogramSeries.create_volume_series class method
for creating colored volume data.
"""

import gc
import json
import time

import numpy as np
import pandas as pd
import psutil
import pytest
from lightweight_charts_core.charts.series.histogram import HistogramSeries
from lightweight_charts_core.constants import HISTOGRAM_UP_COLOR_DEFAULT
from lightweight_charts_core.data.histogram_data import HistogramData
from lightweight_charts_core.data.ohlcv_data import OhlcvData
from lightweight_charts_core.exceptions import ColorValidationError


class TestHistogramSeriesCreateVolumeSeries:
    """Test the HistogramSeries.create_volume_series class method."""

    def test_dataframe_input_bullish_candles(self):
        """Test DataFrame input with bullish candles (close >= open)."""
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01", "2024-01-02"],
                "volume": [1000, 1500],
                "open": [100, 105],
                "close": [105, 110],  # Both bullish
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 2
        assert all(data.color == "rgba(76,175,80,0.5)" for data in volume_series.data)
        assert volume_series.data[0].value == 1000
        assert volume_series.data[1].value == 1500

    def test_dataframe_input_bearish_candles(self):
        """Test DataFrame input with bearish candles (close < open)."""
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01", "2024-01-02"],
                "volume": [1000, 1500],
                "open": [105, 110],
                "close": [100, 105],  # Both bearish
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 2
        assert all(data.color == "rgba(244,67,54,0.5)" for data in volume_series.data)

    def test_dataframe_input_mixed_candles(self):
        """Test DataFrame input with mixed bullish and bearish candles."""
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01", "2024-01-02", "2024-01-03"],
                "volume": [1000, 1500, 800],
                "open": [100, 105, 98],
                "close": [105, 102, 103],  # Bullish, Bearish, Bullish
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 3
        assert volume_series.data[0].color == "rgba(76,175,80,0.5)"  # Bullish
        assert volume_series.data[1].color == "rgba(244,67,54,0.5)"  # Bearish
        assert volume_series.data[2].color == "rgba(76,175,80,0.5)"  # Bullish

    def test_ohlcv_data_input(self):
        """Test OHLCV data objects input."""
        ohlcv_data = [
            OhlcvData("2024-01-01", 100, 105, 98, 105, 1000),  # Bullish
            OhlcvData("2024-01-02", 105, 108, 102, 102, 1500),  # Bearish
            OhlcvData("2024-01-03", 98, 103, 95, 103, 800),  # Bullish
        ]

        volume_series = HistogramSeries.create_volume_series(
            ohlcv_data,
            column_mapping={"time": "time", "volume": "volume"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 3
        assert volume_series.data[0].color == "rgba(76,175,80,0.5)"  # Bullish
        assert volume_series.data[1].color == "rgba(244,67,54,0.5)"  # Bearish
        assert volume_series.data[2].color == "rgba(76,175,80,0.5)"  # Bullish

    def test_custom_column_mapping(self):
        """Test with custom column mapping."""
        test_dataframe = pd.DataFrame(
            {
                "datetime": ["2024-01-01", "2024-01-02"],
                "vol": [1000, 1500],
                "o": [100, 105],
                "c": [105, 102],  # Bullish, Bearish
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "datetime", "volume": "vol", "open": "o", "close": "c"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 2
        assert volume_series.data[0].color == "rgba(76,175,80,0.5)"  # Bullish
        assert volume_series.data[1].color == "rgba(244,67,54,0.5)"  # Bearish

    def test_default_colors(self):
        """Test with default colors."""
        test_dataframe = pd.DataFrame(
            {"time": ["2024-01-01"], "volume": [1000], "open": [100], "close": [105]},  # Bullish
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 1
        assert volume_series.data[0].color == HISTOGRAM_UP_COLOR_DEFAULT  # Default up color

    def test_equal_open_close(self):
        """Test when open equals close (should be treated as bullish)."""
        test_dataframe = pd.DataFrame(
            {"time": ["2024-01-01"], "volume": [1000], "open": [100], "close": [100]},  # Equal
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 1
        assert volume_series.data[0].color == "rgba(76,175,80,0.5)"  # Treated as bullish

    def test_series_properties(self):
        """Test that the returned series has correct properties."""
        test_dataframe = pd.DataFrame(
            {"time": ["2024-01-01"], "volume": [1000], "open": [100], "close": [105]},
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            pane_id=1,
            price_scale_id="left",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert volume_series.pane_id == 1  # pylint: disable=no-member
        assert volume_series.price_scale_id == "left"  # pylint: disable=no-member
        assert len(volume_series.data) == 1
        assert isinstance(volume_series.data[0], HistogramData)
        assert hasattr(volume_series.data[0], "time")
        assert hasattr(volume_series.data[0], "value")
        assert hasattr(volume_series.data[0], "color")

    def test_time_normalization_pandas_timestamps(self):
        """Test that pandas timestamps are correctly normalized to seconds."""
        test_dataframe = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=3, freq="1h"),
                "volume": [1000, 1500, 2000],
                "open": [100, 105, 110],
                "close": [105, 102, 115],  # Bullish, Bearish, Bullish
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        # Verify timestamps are in seconds (not nanoseconds) when serialized
        expected_timestamps = [1704067200, 1704070800, 1704074400]  # Seconds
        # Get timestamps from asdict() since time is now normalized there
        actual_timestamps = [data.asdict()["time"] for data in volume_series.data]

        assert actual_timestamps == expected_timestamps
        assert all(isinstance(ts, int) for ts in actual_timestamps)
        assert all(1704067200 <= ts <= 1704074400 for ts in actual_timestamps)

    def test_time_normalization_mixed_formats(self):
        """Test time normalization with mixed timestamp formats."""
        # Mix of different timestamp formats
        test_dataframe = pd.DataFrame(
            {
                "time": [
                    pd.Timestamp("2024-01-01 00:00:00"),
                    "2024-01-01 01:00:00",
                    1704070800,  # Unix timestamp in seconds
                    pd.Timestamp("2024-01-01 03:00:00"),
                ],
                "volume": [1000, 1500, 2000, 2500],
                "open": [100, 105, 110, 115],
                "close": [105, 102, 115, 120],  # All bullish
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        # All timestamps should be normalized to seconds in asdict()
        timestamps = [data.asdict()["time"] for data in volume_series.data]
        assert all(isinstance(ts, int) for ts in timestamps)
        assert all(1704067200 <= ts <= 1704078000 for ts in timestamps)

    def test_time_normalization_edge_cases(self):
        """Test time normalization with edge cases."""
        # Edge cases: different time zones, leap seconds, etc.
        test_dataframe = pd.DataFrame(
            {
                "time": [
                    pd.Timestamp("2024-01-01 00:00:00", tz="UTC"),
                    pd.Timestamp("2024-01-01 00:00:00", tz="US/Eastern"),
                    pd.Timestamp("2024-12-31 23:59:59"),
                    pd.Timestamp("2024-02-29 12:00:00"),  # Leap year
                ],
                "volume": [1000, 1500, 2000, 2500],
                "open": [100, 105, 110, 115],
                "close": [105, 102, 115, 120],
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
        )

        # All should be valid timestamps when serialized
        timestamps = [data.asdict()["time"] for data in volume_series.data]
        assert all(isinstance(ts, int) for ts in timestamps)
        assert all(ts > 0 for ts in timestamps)

    def test_none_data_handling(self):
        """Test handling of None data."""
        volume_series = HistogramSeries.create_volume_series(
            None,
            column_mapping={"time": "time", "volume": "volume"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 0

    def test_empty_dataframe_handling(self):
        """Test handling of empty DataFrame."""
        test_dataframe = pd.DataFrame(columns=["time", "volume", "open", "close"])

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 0

    def test_missing_columns_handling(self):
        """Test handling of missing columns in DataFrame."""
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01"],
                "volume": [1000],
                # Missing 'open' and 'close' columns
            },
        )

        with pytest.raises(KeyError):
            HistogramSeries.create_volume_series(
                test_dataframe,
                column_mapping={
                    "time": "time",
                    "volume": "volume",
                    "open": "open",
                    "close": "close",
                },
                up_color="rgba(76,175,80,0.5)",
                down_color="rgba(244,67,54,0.5)",
            )

    def test_invalid_color_formats(self):
        """Test handling of invalid color formats."""
        # Test with invalid up_color (bullish candle)
        df_bullish = pd.DataFrame(
            {
                "time": pd.to_datetime(["2024-01-01"]),
                "volume": [1000],
                "open": [100],
                "close": [105],  # Bullish: close > open
            },
        )

        # Centralized validation raises ColorValidationError (more specific)
        # Test with invalid up_color
        with pytest.raises(ColorValidationError):
            HistogramSeries.create_volume_series(
                df_bullish,
                column_mapping={
                    "time": "time",
                    "volume": "volume",
                    "open": "open",
                    "close": "close",
                },
                up_color="invalid_color",
                down_color="rgba(244,67,54,0.5)",
            )

        # Test with invalid down_color (bearish candle)
        df_bearish = pd.DataFrame(
            {
                "time": pd.to_datetime(["2024-01-01"]),
                "volume": [1000],
                "open": [105],
                "close": [100],  # Bearish: close < open
            },
        )

        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError):
            HistogramSeries.create_volume_series(
                df_bearish,
                column_mapping={
                    "time": "time",
                    "volume": "volume",
                    "open": "open",
                    "close": "close",
                },
                up_color="rgba(76,175,80,0.5)",
                down_color="invalid_color",
            )

    def test_numeric_data_types(self):
        """Test handling of different numeric data types."""
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01", "2024-01-02"],
                "volume": [np.int64(1000), np.float64(1500.0)],
                "open": [np.float32(100.0), 105],
                "close": [105, np.float64(102.0)],
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == 2
        assert volume_series.data[0].value == 1000
        assert volume_series.data[1].value == 1500.0

    def test_large_dataset_performance(self):
        """Test performance with large dataset."""
        # Create a large dataset
        n_points = 10000
        rng = np.random.default_rng(42)
        test_dataframe = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=n_points, freq="1min"),
                "volume": rng.integers(1000, 10000, n_points),
                "open": rng.uniform(100, 200, n_points),
                "close": rng.uniform(100, 200, n_points),
            },
        )

        # Time the operation
        start_time = time.time()

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        end_time = time.time()
        processing_time = end_time - start_time

        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == n_points
        assert processing_time < 10.0  # Should complete within 10 seconds

    def test_json_serialization_compatibility(self):
        """Test that the created series can be properly serialized to JSON."""
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01", "2024-01-02"],
                "volume": [1000, 1500],
                "open": [100, 105],
                "close": [105, 102],
            },
        )

        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        # Test JSON serialization
        series_dict = volume_series.asdict()
        json.dumps(series_dict)

        # Verify JSON structure
        assert "type" in series_dict
        assert series_dict["type"] == "histogram"
        assert "data" in series_dict
        assert len(series_dict["data"]) == 2

        # Verify data points have correct structure
        for data_point in series_dict["data"]:
            assert "time" in data_point
            assert "value" in data_point
            assert "color" in data_point
            assert isinstance(data_point["time"], int)
            assert isinstance(data_point["value"], (int, float))

    def test_memory_efficiency(self):
        """Test memory efficiency with large datasets."""
        # Create a large dataset
        n_points = 50000
        rng = np.random.default_rng(42)
        test_dataframe = pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=n_points, freq="1min"),
                "volume": rng.integers(1000, 10000, n_points),
                "open": rng.uniform(100, 200, n_points),
                "close": rng.uniform(100, 200, n_points),
            },
        )

        # Get initial memory usage
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Create volume series
        volume_series = HistogramSeries.create_volume_series(
            test_dataframe,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        # Get memory after creation
        after_creation_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Verify the series was created correctly
        assert isinstance(volume_series, HistogramSeries)
        assert len(volume_series.data) == n_points

        # Clean up
        del volume_series
        del test_dataframe
        gc.collect()

        # Get memory after cleanup
        after_cleanup_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Memory should be reasonable (less than 1GB for 50k points)
        memory_increase = after_creation_memory - initial_memory
        assert memory_increase < 1000  # Less than 1GB increase

        # Memory cleanup check - be more lenient as Python doesn't always return memory immediately
        memory_cleanup = after_creation_memory - after_cleanup_memory
        # Don't assert on memory cleanup as Python's GC behavior is unpredictable
        # Just log it for information
        print(f"Memory increase: {memory_increase:.2f} MB")
        print(f"Memory cleanup: {memory_cleanup:.2f} MB")

        # The real test is that we can create and delete the objects without errors
        # and that memory usage is reasonable
