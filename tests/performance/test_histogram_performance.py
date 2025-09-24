"""
Performance tests for HistogramSeries.

This module contains performance tests for the HistogramSeries class,
focusing on the create_volume_series method and overall performance
characteristics.
"""

import gc
import time
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd
import psutil
import pytest

from streamlit_lightweight_charts_pro.charts.series.histogram import HistogramSeries


class TestHistogramSeriesPerformance:
    """Performance tests for HistogramSeries."""

    @pytest.fixture
    def small_dataset(self) -> pd.DataFrame:
        """Create a small dataset (1,000 points)."""
        rng = np.random.default_rng(42)
        n_points = 1000
        return pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=n_points, freq="1min"),
                "volume": rng.integers(1000, 10000, n_points),
                "open": rng.uniform(100, 200, n_points),
                "close": rng.uniform(100, 200, n_points),
            },
        )

    @pytest.fixture
    def medium_dataset(self) -> pd.DataFrame:
        """Create a medium dataset (10,000 points)."""
        rng = np.random.default_rng(42)
        n_points = 10000
        return pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=n_points, freq="1min"),
                "volume": rng.integers(1000, 10000, n_points),
                "open": rng.uniform(100, 200, n_points),
                "close": rng.uniform(100, 200, n_points),
            },
        )

    @pytest.fixture
    def large_dataset(self) -> pd.DataFrame:
        """Create a large dataset (100,000 points)."""
        rng = np.random.default_rng(42)
        n_points = 100000
        return pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=n_points, freq="1min"),
                "volume": rng.integers(1000, 10000, n_points),
                "open": rng.uniform(100, 200, n_points),
                "close": rng.uniform(100, 200, n_points),
            },
        )

    @pytest.fixture
    def very_large_dataset(self) -> pd.DataFrame:
        """Create a very large dataset (1,000,000 points)."""
        rng = np.random.default_rng(42)
        n_points = 1000000
        return pd.DataFrame(
            {
                "time": pd.date_range("2024-01-01", periods=n_points, freq="1min"),
                "volume": rng.integers(1000, 10000, n_points),
                "open": rng.uniform(100, 200, n_points),
                "close": rng.uniform(100, 200, n_points),
            },
        )

    @pytest.fixture
    def nine_years_minute_data(self) -> pd.DataFrame:
        """Create 9 years of 1-minute OHLCV data (realistic scenario)."""
        rng = np.random.default_rng(42)
        # 9 years * 251 trading days * 375 minutes per day = ~847,125 points
        # But let's use a more manageable subset for testing
        n_points = 100000  # Representative sample
        return pd.DataFrame(
            {
                "time": pd.date_range("2015-01-01", periods=n_points, freq="1min"),
                "volume": rng.integers(1000, 10000, n_points),
                "open": rng.uniform(100, 200, n_points),
                "close": rng.uniform(100, 200, n_points),
            },
        )

    def test_small_dataset_performance(self, small_dataset):
        """Test performance with small dataset (1,000 points)."""
        start_time = time.time()

        volume_series = HistogramSeries.create_volume_series(
            small_dataset,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        end_time = time.time()
        processing_time = end_time - start_time

        assert len(volume_series.data) == 1000
        assert processing_time < 1.0  # Should complete within 1 second
        print(f"Small dataset (1,000 points): {processing_time:.4f}s")

    def test_medium_dataset_performance(self, medium_dataset):
        """Test performance with medium dataset (10,000 points)."""
        start_time = time.time()

        volume_series = HistogramSeries.create_volume_series(
            medium_dataset,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        end_time = time.time()
        processing_time = end_time - start_time

        assert len(volume_series.data) == 10000
        assert processing_time < 5.0  # Should complete within 5 seconds
        print(f"Medium dataset (10,000 points): {processing_time:.4f}s")

    def test_large_dataset_performance(self, large_dataset):
        """Test performance with large dataset (100,000 points)."""
        start_time = time.time()

        volume_series = HistogramSeries.create_volume_series(
            large_dataset,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        end_time = time.time()
        processing_time = end_time - start_time

        assert len(volume_series.data) == 100000
        assert processing_time < 30.0  # Should complete within 30 seconds
        print(f"Large dataset (100,000 points): {processing_time:.4f}s")

    def test_very_large_dataset_performance(self, very_large_dataset):
        """Test performance with very large dataset (1,000,000 points)."""
        start_time = time.time()

        volume_series = HistogramSeries.create_volume_series(
            very_large_dataset,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        end_time = time.time()
        processing_time = end_time - start_time

        assert len(volume_series.data) == 1000000
        assert processing_time < 300.0  # Should complete within 5 minutes
        print(f"Very large dataset (1,000,000 points): {processing_time:.4f}s")

    def test_nine_years_data_performance(self, nine_years_minute_data):
        """Test performance with 9 years of minute data (realistic scenario)."""
        start_time = time.time()

        volume_series = HistogramSeries.create_volume_series(
            nine_years_minute_data,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        end_time = time.time()
        processing_time = end_time - start_time

        assert len(volume_series.data) == 100000
        assert processing_time < 10.0  # Should complete within 10 seconds
        print(f"Nine years minute data (100,000 points): {processing_time:.4f}s")

    def test_memory_usage_small_dataset(self, small_dataset):
        """Test memory usage with small dataset."""
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        volume_series = HistogramSeries.create_volume_series(
            small_dataset,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        after_creation_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = after_creation_memory - initial_memory

        # Clean up
        del volume_series
        del small_dataset
        gc.collect()

        assert memory_increase < 100  # Less than 100MB increase
        print(f"Small dataset memory increase: {memory_increase:.2f}MB")

    def test_memory_usage_large_dataset(self, large_dataset):
        """Test memory usage with large dataset."""
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        volume_series = HistogramSeries.create_volume_series(
            large_dataset,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        after_creation_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = after_creation_memory - initial_memory

        # Clean up
        del volume_series
        del large_dataset
        gc.collect()

        assert memory_increase < 1000  # Less than 1GB increase
        print(f"Large dataset memory increase: {memory_increase:.2f}MB")

    def test_concurrent_processing(self, medium_dataset):
        """Test concurrent processing of multiple datasets."""

        def process_dataset(data: pd.DataFrame) -> HistogramSeries:
            return HistogramSeries.create_volume_series(
                data,
                column_mapping={
                    "time": "time",
                    "volume": "volume",
                    "open": "open",
                    "close": "close",
                },
                up_color="rgba(76,175,80,0.5)",
                down_color="rgba(244,67,54,0.5)",
            )

        # Create multiple datasets
        datasets = [medium_dataset.copy() for _ in range(5)]

        start_time = time.time()

        # Process concurrently using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(process_dataset, datasets))

        end_time = time.time()
        processing_time = end_time - start_time

        assert len(results) == 5
        assert all(len(series.data) == 10000 for series in results)
        assert processing_time < 20.0  # Should complete within 20 seconds
        print(f"Concurrent processing (5 datasets): {processing_time:.4f}s")

    def test_vectorization_efficiency(self, large_dataset):
        """Test that vectorization is working efficiently."""
        # Compare with a non-vectorized approach (if we had one)
        start_time = time.time()

        volume_series = HistogramSeries.create_volume_series(
            large_dataset,
            column_mapping={"time": "time", "volume": "volume", "open": "open", "close": "close"},
            up_color="rgba(76,175,80,0.5)",
            down_color="rgba(244,67,54,0.5)",
        )

        end_time = time.time()
        vectorized_time = end_time - start_time

        # Verify the result is correct
        assert len(volume_series.data) == 100000

        # Check that colors are assigned correctly
        bullish_count = sum(1 for data in volume_series.data if data.color == "rgba(76,175,80,0.5)")
        bearish_count = sum(1 for data in volume_series.data if data.color == "rgba(244,67,54,0.5)")

        assert bullish_count + bearish_count == 100000
        print(f"Vectorized processing (100,000 points): {vectorized_time:.4f}s")
        print(f"Bullish candles: {bullish_count}, Bearish candles: {bearish_count}")

    def test_time_normalization_performance(self, large_dataset):
        """Test performance of time normalization specifically."""
        rng = np.random.default_rng(42)
        # Test with different timestamp formats
        test_cases = [
            ("pandas_timestamps", large_dataset),
            ("string_timestamps", large_dataset.copy()),
            ("mixed_formats", large_dataset.copy()),
        ]

        # Convert to string timestamps for one test
        test_cases[1][1]["time"] = test_cases[1][1]["time"].dt.strftime("%Y-%m-%d %H:%M:%S")

        # Convert to mixed formats for another test
        mixed_df = test_cases[2][1].copy()
        mixed_df["time"] = mixed_df["time"].apply(
            lambda x: x if pd.isna(x) else str(x) if rng.random() > 0.5 else x,
        )
        test_cases[2] = ("mixed_formats", mixed_df)

        results = {}
        for test_name, dataset in test_cases:
            start_time = time.time()

            volume_series = HistogramSeries.create_volume_series(
                dataset,
                column_mapping={
                    "time": "time",
                    "volume": "volume",
                    "open": "open",
                    "close": "close",
                },
                up_color="rgba(76,175,80,0.5)",
                down_color="rgba(244,67,54,0.5)",
            )

            end_time = time.time()
            processing_time = end_time - start_time

            results[test_name] = processing_time
            print(f"{test_name}: {processing_time:.4f}s")

            # Verify timestamps are normalized
            timestamps = [data.time for data in volume_series.data]
            assert all(isinstance(ts, int) for ts in timestamps)
            assert all(ts > 0 for ts in timestamps)

        # All should be reasonably fast
        assert all(time < 30.0 for time in results.values())

    def test_scalability_analysis(self):
        """Analyze scalability across different dataset sizes."""
        rng = np.random.default_rng(42)
        dataset_sizes = [1000, 5000, 10000, 50000, 100000]
        results = {}

        for size in dataset_sizes:
            histogram_data = pd.DataFrame(
                {
                    "time": pd.date_range("2024-01-01", periods=size, freq="1min"),
                    "volume": rng.integers(1000, 10000, size),
                    "open": rng.uniform(100, 200, size),
                    "close": rng.uniform(100, 200, size),
                },
            )

            start_time = time.time()

            volume_series = HistogramSeries.create_volume_series(
                histogram_data,
                column_mapping={
                    "time": "time",
                    "volume": "volume",
                    "open": "open",
                    "close": "close",
                },
                up_color="rgba(76,175,80,0.5)",
                down_color="rgba(244,67,54,0.5)",
            )

            end_time = time.time()
            processing_time = end_time - start_time

            results[size] = {"time": processing_time, "points_per_second": size / processing_time}

            print(
                f"Dataset size {size}: {processing_time:.4f}s"
                f" ({size / processing_time:.0f} points/sec)",
            )

        # Verify scalability (should be roughly linear or better)
        [results[size]["time"] for size in dataset_sizes]
        points_per_second = [results[size]["points_per_second"] for size in dataset_sizes]

        # Performance should not degrade significantly
        assert min(points_per_second) > 1000  # At least 1000 points per second
        print(
            f"Performance range: {min(points_per_second):.0f} -"
            f" {max(points_per_second):.0f} points/sec",
        )

    def test_memory_scalability(self):
        """Test memory scalability across different dataset sizes."""
        rng = np.random.default_rng(42)
        dataset_sizes = [1000, 10000, 50000, 100000]
        results = {}

        process = psutil.Process()

        for size in dataset_sizes:
            histogram_data = pd.DataFrame(
                {
                    "time": pd.date_range("2024-01-01", periods=size, freq="1min"),
                    "volume": rng.integers(1000, 10000, size),
                    "open": rng.uniform(100, 200, size),
                    "close": rng.uniform(100, 200, size),
                },
            )

            initial_memory = process.memory_info().rss / 1024 / 1024  # MB

            volume_series = HistogramSeries.create_volume_series(
                histogram_data,
                column_mapping={
                    "time": "time",
                    "volume": "volume",
                    "open": "open",
                    "close": "close",
                },
                up_color="rgba(76,175,80,0.5)",
                down_color="rgba(244,67,54,0.5)",
            )

            after_creation_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = after_creation_memory - initial_memory

            results[size] = {
                "memory_mb": memory_increase,
                "bytes_per_point": (memory_increase * 1024 * 1024) / size,
            }

            # Clean up
            del volume_series
            del histogram_data
            gc.collect()

            print(
                f"Dataset size {size}: {memory_increase:.2f}MB"
                f" ({results[size]['bytes_per_point']:.0f} bytes/point)",
            )

        # Memory usage should be reasonable
        bytes_per_point = [results[size]["bytes_per_point"] for size in dataset_sizes]
        assert all(bpp < 1000 for bpp in bytes_per_point)  # Less than 1KB per point
        print(
            f"Memory efficiency: {min(bytes_per_point):.0f} - {max(bytes_per_point):.0f} bytes per"
            " point",
        )
