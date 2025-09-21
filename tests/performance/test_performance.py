"""
Performance tests for Streamlit Lightweight Charts Pro.

This module provides comprehensive performance testing to ensure the library
meets performance benchmarks for various data sizes and operations.
"""

import time
from datetime import datetime
from typing import List, Tuple

import numpy as np
import pytest

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import LineData


class TestPerformanceBenchmarks:
    """Performance benchmarks for core functionality."""

    # Performance targets (in milliseconds)
    PERFORMANCE_TARGETS = {
        "small_dataset": 10.0,  # 1K data points
        "medium_dataset": 50.0,  # 10K data points
        "large_dataset": 200.0,  # 100K data points
        "wide_dataset": 100.0,  # 100 series, 1K points each
        "chart_creation": 5.0,  # Chart instantiation
        "series_addition": 2.0,  # Adding series to chart
        "data_serialization": 80.0,  # Converting to dict/JSON
        "memory_efficiency": 10.0,  # MB per 1K data points
    }

    def test_line_series_creation_performance(self, large_dataset):
        """Test LineSeries creation performance with large datasets."""
        start_time = time.perf_counter()

        series = LineSeries(data=large_dataset)

        end_time = time.perf_counter()
        execution_time = (end_time - start_time) * 1000

        # Allow 25% tolerance for performance targets due to system variability
        target = self.PERFORMANCE_TARGETS["large_dataset"]
        tolerance = target * 0.25
        assert execution_time <= target + tolerance, (
            f"LineSeries creation took {execution_time:.2f}ms, "
            f"exceeds target {target}ms + {tolerance:.2f}ms tolerance"
        )

    def test_chart_creation_performance(self, large_dataset):
        """Test Chart creation performance."""
        series = LineSeries(data=large_dataset)

        start_time = time.perf_counter()
        chart = Chart(series=series)
        end_time = time.perf_counter()

        execution_time = (end_time - start_time) * 1000

        # Allow 25% tolerance for performance targets due to system variability
        target = self.PERFORMANCE_TARGETS["chart_creation"]
        tolerance = target * 0.25
        assert execution_time <= target + tolerance, (
            f"Chart creation took {execution_time:.2f}ms, "
            f"exceeds target {target}ms + {tolerance:.2f}ms tolerance"
        )

    def test_series_addition_performance(self, large_dataset):
        """Test adding series to chart performance."""
        chart = Chart()
        series = LineSeries(data=large_dataset)

        start_time = time.perf_counter()
        chart.add_series(series)
        end_time = time.perf_counter()

        execution_time = (end_time - start_time) * 1000

        # Allow 25% tolerance for performance targets due to system variability
        target = self.PERFORMANCE_TARGETS["series_addition"]
        tolerance = target * 0.25
        assert execution_time <= target + tolerance, (
            f"Series addition took {execution_time:.2f}ms, "
            f"exceeds target {target}ms + {tolerance:.2f}ms tolerance"
        )

    def test_data_serialization_performance(self, large_dataset):
        """Test data serialization performance."""
        series = LineSeries(data=large_dataset)

        start_time = time.perf_counter()
        series.asdict()
        end_time = time.perf_counter()

        execution_time = (end_time - start_time) * 1000

        # Allow 25% tolerance for performance targets due to system variability
        target = self.PERFORMANCE_TARGETS["data_serialization"]
        tolerance = target * 0.25
        assert execution_time <= target + tolerance, (
            f"Data serialization took {execution_time:.2f}ms, "
            f"exceeds target {target}ms + {tolerance:.2f}ms tolerance"
        )

    def test_memory_efficiency(self, large_dataset):
        """Test memory efficiency of data structures."""
        import os

        import psutil

        process = psutil.Process(os.getpid())
        memory_before = process.memory_info().rss / 1024 / 1024  # MB

        # Create series and chart
        series = LineSeries(data=large_dataset)
        chart = Chart(series=series)

        memory_after = process.memory_info().rss / 1024 / 1024  # MB
        memory_used = memory_after - memory_before

        # Calculate efficiency (MB per 1K data points)
        data_size_k = len(large_dataset) / 1000
        mb_per_1k = memory_used / data_size_k

        # Allow 25% tolerance for performance targets due to system variability
        target = self.PERFORMANCE_TARGETS["memory_efficiency"]
        tolerance = target * 0.25
        assert mb_per_1k <= target + tolerance, (
            f"Memory usage {mb_per_1k:.2f} MB per 1K data points "
            f"exceeds target {target} MB + {tolerance:.2f} MB tolerance"
        )

    def test_wide_dataset_performance(self, wide_dataset):
        """Test performance with wide datasets (many series)."""
        start_time = time.perf_counter()

        series_list = [LineSeries(data=series_data) for series_data in wide_dataset]
        chart = Chart(series=series_list)

        end_time = time.perf_counter()
        execution_time = (end_time - start_time) * 1000

        # Allow 25% tolerance for performance targets due to system variability
        target = self.PERFORMANCE_TARGETS["wide_dataset"]
        tolerance = target * 0.25
        assert execution_time <= target + tolerance, (
            f"Wide dataset processing took {execution_time:.2f}ms, "
            f"exceeds target {target}ms + {tolerance:.2f}ms tolerance"
        )


class TestScalability:
    """Test scalability across different data sizes."""

    @pytest.mark.parametrize("n_points", [100, 1000, 10000, 100000])
    def test_line_series_scalability(self, n_points):
        """Test LineSeries performance scales linearly with data size."""
        # Generate test data
        base_timestamp = int(datetime(2023, 1, 1).timestamp())
        timestamps = [base_timestamp + i * 3600 for i in range(n_points)]  # 3600 seconds = 1 hour
        values = np.random.randn(n_points).cumsum() + 100

        data = [LineData(time=ts, value=val) for ts, val in zip(timestamps, values)]

        # Measure creation time
        start_time = time.perf_counter()
        series = LineSeries(data=data)
        end_time = time.perf_counter()

        creation_time = (end_time - start_time) * 1000

        # Performance should scale roughly linearly
        expected_time = n_points * 0.001  # 1 microsecond per data point
        assert creation_time <= expected_time * 10, (
            f"Creation time {creation_time:.2f}ms for {n_points} points "
            f"exceeds expected {expected_time:.2f}ms"
        )

    @pytest.mark.parametrize("n_series", [1, 10, 50, 100])
    def test_chart_series_scalability(self, n_series):
        """Test Chart performance scales with number of series."""
        n_points = 1000

        # Generate test data
        base_timestamp = int(datetime(2023, 1, 1).timestamp())
        timestamps = [base_timestamp + i * 3600 for i in range(n_points)]  # 3600 seconds = 1 hour

        series_list = []
        for j in range(n_series):
            values = np.random.randn(n_points).cumsum() + 100 + j * 10
            data = [LineData(time=ts, value=val) for ts, val in zip(timestamps, values)]
            series_list.append(LineSeries(data=data))

        # Measure chart creation time
        start_time = time.perf_counter()
        chart = Chart(series=series_list)
        end_time = time.perf_counter()

        creation_time = (end_time - start_time) * 1000

        # Performance should scale roughly linearly with number of series
        expected_time = n_series * 5  # 5ms per series
        assert creation_time <= expected_time, (
            f"Chart creation time {creation_time:.2f}ms for {n_series} series "
            f"exceeds expected {expected_time:.2f}ms"
        )


class TestMemoryProfiling:
    """Test memory usage patterns and identify memory leaks."""

    def test_memory_cleanup_after_series_removal(self, large_dataset):
        """Test that memory is properly cleaned up after removing series."""
        import gc
        import os

        import psutil

        process = psutil.Process(os.getpid())

        # Create multiple charts with series to make memory changes more detectable
        charts = []
        series_list = []

        for i in range(5):  # Create 5 charts to make memory impact more significant
            series = LineSeries(data=large_dataset)
            chart = Chart(series=series)
            charts.append(chart)
            series_list.append(series)

        # Force garbage collection to get baseline
        gc.collect()
        memory_with_series = process.memory_info().rss / 1024 / 1024  # MB

        # Remove all series and charts
        for chart in charts:
            chart.series.clear()
        charts.clear()
        series_list.clear()

        # Force garbage collection
        gc.collect()

        memory_after_removal = process.memory_info().rss / 1024 / 1024  # MB

        # Memory should be reduced or at least not significantly increased
        memory_change = memory_after_removal - memory_with_series
        # Allow for some memory fluctuation but ensure it's not growing significantly
        assert (
            memory_change < 50
        ), f"Memory increased by {memory_change:.2f}MB after cleanup, expected < 50MB"

    def test_memory_growth_with_repeated_operations(self):
        """Test that memory doesn't grow indefinitely with repeated operations."""
        import gc
        import os

        import psutil

        process = psutil.Process(os.getpid())

        # Perform repeated operations
        memory_samples = []

        for i in range(10):
            # Create and destroy data
            base_timestamp = int(datetime(2023, 1, 1).timestamp())
            data = [LineData(time=base_timestamp + i, value=100 + i)]
            series = LineSeries(data=data)
            chart = Chart(series=series)

            # Force garbage collection
            del data, series, chart
            gc.collect()

            memory_samples.append(process.memory_info().rss / 1024 / 1024)

        # Check for memory growth trend
        if len(memory_samples) > 1:
            # Calculate linear regression slope
            x = np.arange(len(memory_samples))
            slope = np.polyfit(x, memory_samples, 1)[0]

            # Slope should be close to zero (no significant growth)
            assert abs(slope) < 0.1, f"Memory growth detected: slope = {slope:.3f} MB/iteration"


class TestConcurrentPerformance:
    """Test performance under concurrent operations."""

    def test_concurrent_series_creation(self):
        """Test performance when creating multiple series concurrently."""
        import concurrent.futures

        n_series = 10
        n_points = 1000

        def create_series(series_id):
            """Create a series with test data."""
            base_timestamp = int(datetime(2023, 1, 1).timestamp())
            timestamps = [
                base_timestamp + i * 3600 for i in range(n_points)
            ]  # 3600 seconds = 1 hour
            values = np.random.randn(n_points).cumsum() + 100 + series_id * 10

            data = [LineData(time=ts, value=val) for ts, val in zip(timestamps, values)]
            return LineSeries(data=data)

        # Create series concurrently
        start_time = time.perf_counter()

        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(create_series, i) for i in range(n_series)]
            [future.result() for future in concurrent.futures.as_completed(futures)]

        end_time = time.perf_counter()
        concurrent_time = (end_time - start_time) * 1000

        # Create series sequentially for comparison
        start_time = time.perf_counter()
        [create_series(i) for i in range(n_series)]
        end_time = time.perf_counter()
        sequential_time = (end_time - start_time) * 1000

        # Concurrent execution should be comparable or faster
        # Allow for some variance since concurrent execution isn't always faster for CPU-bound tasks
        performance_ratio = concurrent_time / sequential_time
        assert performance_ratio <= 1.5, (
            f"Concurrent execution ({concurrent_time:.2f}ms) "
            f"is significantly slower than sequential ({sequential_time:.2f}ms). "
            f"Ratio: {performance_ratio:.2f}, expected <= 1.5"
        )


class TestPerformanceRegression:
    """Test for performance regressions over time."""

    def test_performance_baseline(self, large_dataset):
        """Test that performance meets baseline requirements."""
        # This test establishes a baseline for performance regression testing
        # The actual thresholds should be adjusted based on historical performance data

        # Test series creation
        start_time = time.perf_counter()
        series = LineSeries(data=large_dataset)
        end_time = time.perf_counter()
        series_creation_time = (end_time - start_time) * 1000

        # Test chart creation
        start_time = time.perf_counter()
        chart = Chart(series=series)
        end_time = time.perf_counter()
        chart_creation_time = (end_time - start_time) * 1000

        # Test serialization
        start_time = time.perf_counter()
        chart.to_frontend_config()
        end_time = time.perf_counter()
        serialization_time = (end_time - start_time) * 1000

        # Store baseline metrics (in a real scenario, these would be persisted)
        baseline_metrics = {
            "series_creation": series_creation_time,
            "chart_creation": chart_creation_time,
            "serialization": serialization_time,
        }

        # Assert reasonable performance bounds
        assert series_creation_time < 100, f"Series creation too slow: {series_creation_time:.2f}ms"
        assert chart_creation_time < 50, f"Chart creation too slow: {chart_creation_time:.2f}ms"
        assert serialization_time < 200, f"Serialization too slow: {serialization_time:.2f}ms"

        return baseline_metrics


# Performance test utilities
def benchmark_operation(operation_name: str, operation_func, *args, **kwargs) -> float:
    """Benchmark an operation and return execution time in milliseconds."""
    start_time = time.perf_counter()
    operation_func(*args, **kwargs)
    end_time = time.perf_counter()

    execution_time = (end_time - start_time) * 1000

    print(f"[{operation_name}] Execution time: {execution_time:.2f}ms")

    return execution_time


def assert_performance_target(operation_name: str, execution_time: float, target_ms: float):
    """Assert that an operation meets its performance target."""
    assert (
        execution_time <= target_ms
    ), f"[{operation_name}] Execution time {execution_time:.2f}ms exceeds target {target_ms}ms"


def generate_performance_report(test_results: List[Tuple[str, float, float]]):
    """Generate a performance test report."""
    print("\n" + "=" * 60)
    print("PERFORMANCE TEST REPORT")
    print("=" * 60)

    for operation_name, execution_time, target_time in test_results:
        status = "✅ PASS" if execution_time <= target_time else "❌ FAIL"
        print(f"{status} {operation_name:30s} {execution_time:8.2f}ms / {target_time:8.2f}ms")

    print("=" * 60)

    # Calculate summary statistics
    passed = sum(
        1 for _, execution_time, target_time in test_results if execution_time <= target_time
    )
    total = len(test_results)

    print(f"Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("=" * 60)
