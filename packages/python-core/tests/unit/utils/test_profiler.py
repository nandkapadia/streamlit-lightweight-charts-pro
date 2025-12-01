"""Unit tests for profiler utility module.

Tests performance profiling utilities including:
- PerformanceProfile data class
- PerformanceReport generation
- PerformanceProfiler functionality
- MemoryMonitor capabilities
"""

import time

from lightweight_charts_core.utils.profiler import (
    MemoryMonitor,
    PerformanceProfile,
    PerformanceProfiler,
    PerformanceReport,
    get_memory_monitor,
    get_profiler,
    profile_function,
    profile_operation,
)


class TestPerformanceProfile:
    """Tests for PerformanceProfile dataclass."""

    def test_creation_with_required_fields(self):
        """Test creating profile with required fields."""
        profile = PerformanceProfile(
            operation_name="test_op",
            execution_time=0.5,
            memory_peak=1000,
            memory_current=800,
            memory_delta=200,
            cpu_percent=25.5,
        )

        assert profile.operation_name == "test_op"
        assert profile.execution_time == 0.5
        assert profile.memory_peak == 1000
        assert profile.memory_current == 800
        assert profile.memory_delta == 200
        assert profile.cpu_percent == 25.5

    def test_creation_with_optional_fields(self):
        """Test creating profile with all fields."""
        profile = PerformanceProfile(
            operation_name="test_op",
            execution_time=0.5,
            memory_peak=1000,
            memory_current=800,
            memory_delta=200,
            cpu_percent=25.5,
            data_size=5000,
            cache_hits=10,
            cache_misses=2,
        )

        assert profile.data_size == 5000
        assert profile.cache_hits == 10
        assert profile.cache_misses == 2

    def test_timestamp_auto_generation(self):
        """Test that timestamp is automatically generated."""
        before = time.time()
        profile = PerformanceProfile(
            operation_name="test",
            execution_time=0.1,
            memory_peak=100,
            memory_current=100,
            memory_delta=0,
            cpu_percent=10.0,
        )
        after = time.time()

        assert before <= profile.timestamp <= after


class TestPerformanceReport:
    """Tests for PerformanceReport dataclass."""

    def test_creation(self):
        """Test creating performance report."""
        profile1 = PerformanceProfile(
            operation_name="op1",
            execution_time=0.5,
            memory_peak=1000,
            memory_current=800,
            memory_delta=200,
            cpu_percent=25.5,
        )

        report = PerformanceReport(
            total_operations=1,
            total_execution_time=0.5,
            average_execution_time=0.5,
            memory_peak_total=1000,
            memory_current_total=800,
            operations=[profile1],
            bottlenecks=["op1: slow"],
            recommendations=["optimize op1"],
        )

        assert report.total_operations == 1
        assert report.total_execution_time == 0.5
        assert len(report.operations) == 1

    def test_to_dict(self):
        """Test converting report to dictionary."""
        profile = PerformanceProfile(
            operation_name="test",
            execution_time=0.5,
            memory_peak=1000,
            memory_current=800,
            memory_delta=200,
            cpu_percent=25.5,
        )

        report = PerformanceReport(
            total_operations=1,
            total_execution_time=0.5,
            average_execution_time=0.5,
            memory_peak_total=1000,
            memory_current_total=800,
            operations=[profile],
            bottlenecks=[],
            recommendations=[],
        )

        report_dict = report.to_dict()

        assert isinstance(report_dict, dict)
        assert report_dict["total_operations"] == 1
        assert report_dict["total_execution_time"] == 0.5


class TestPerformanceProfiler:
    """Tests for PerformanceProfiler class."""

    def test_initialization(self):
        """Test profiler initialization."""
        profiler = PerformanceProfiler(enable_memory_tracking=False)

        assert profiler.enable_memory_tracking is False
        assert profiler.profiles == []

    def test_measure_operation_context_manager(self):
        """Test measuring operation using context manager."""
        profiler = PerformanceProfiler(enable_memory_tracking=False)

        with profiler.measure_operation("test_operation"):
            time.sleep(0.01)

        # Profile should be recorded
        assert len(profiler.profiles) == 1
        assert profiler.profiles[0].operation_name == "test_operation"
        assert profiler.profiles[0].execution_time > 0

    def test_profile_operation_decorator(self):
        """Test profiling with decorator."""
        profiler = PerformanceProfiler(enable_memory_tracking=False)

        @profiler.profile_operation("decorated_op")
        def sample_function():
            return "result"

        result = sample_function()

        assert result == "result"
        assert len(profiler.profiles) == 1

    def test_multiple_operations(self):
        """Test profiling multiple operations."""
        profiler = PerformanceProfiler(enable_memory_tracking=False)

        with profiler.measure_operation("op1"):
            pass
        with profiler.measure_operation("op2"):
            pass

        assert len(profiler.profiles) == 2


class TestMemoryMonitor:
    """Tests for MemoryMonitor class."""

    def test_initialization(self):
        """Test memory monitor initialization."""
        monitor = MemoryMonitor()

        assert isinstance(monitor.memory_history, list)
        assert len(monitor.memory_history) == 0

    def test_get_memory_usage(self):
        """Test getting current memory usage."""
        monitor = MemoryMonitor()

        memory_usage = monitor.get_memory_usage()

        assert isinstance(memory_usage, dict)
        assert "rss" in memory_usage
        assert "vms" in memory_usage
        assert "percent" in memory_usage

    def test_record_memory_snapshot(self):
        """Test recording memory snapshot."""
        monitor = MemoryMonitor()

        monitor.record_memory_snapshot()

        assert len(monitor.memory_history) == 1
        assert "rss" in monitor.memory_history[0]
        assert "timestamp" in monitor.memory_history[0]

    def test_get_memory_trend_insufficient_data(self):
        """Test memory trend with insufficient data."""
        monitor = MemoryMonitor()

        trend = monitor.get_memory_trend()

        assert trend["trend"] == "insufficient_data"

    def test_get_memory_trend_with_data(self):
        """Test memory trend with sufficient data."""
        monitor = MemoryMonitor()

        monitor.record_memory_snapshot()
        time.sleep(0.01)
        monitor.record_memory_snapshot()

        trend = monitor.get_memory_trend()

        assert "trend" in trend
        assert trend["trend"] in ["increasing", "decreasing", "stable"]

    def test_suggest_optimizations_no_history(self):
        """Test suggestions with no history."""
        monitor = MemoryMonitor()

        suggestions = monitor.suggest_optimizations()

        assert isinstance(suggestions, list)

    def test_suggest_optimizations_with_history(self):
        """Test suggestions with history."""
        monitor = MemoryMonitor()

        monitor.record_memory_snapshot()
        suggestions = monitor.suggest_optimizations()

        assert isinstance(suggestions, list)


class TestGlobalProfilerFunctions:
    """Tests for global profiler convenience functions."""

    def test_get_profiler(self):
        """Test getting global profiler instance."""
        profiler = get_profiler()

        assert isinstance(profiler, PerformanceProfiler)

    def test_get_memory_monitor(self):
        """Test getting global memory monitor instance."""
        monitor = get_memory_monitor()

        assert isinstance(monitor, MemoryMonitor)

    def test_profile_function_decorator(self):
        """Test profile_function decorator."""

        @profile_function("test_func")
        def sample_function():
            return 42

        result = sample_function()

        assert result == 42

    def test_profile_operation_context_manager(self):
        """Test profile_operation context manager."""
        with profile_operation("context_op"):
            value = 123

        assert value == 123


class TestProfilerIntegration:
    """Integration tests for profiler functionality."""

    def test_profiler_workflow(self):
        """Test complete profiling workflow."""
        profiler = PerformanceProfiler(enable_memory_tracking=False)

        with profiler.measure_operation("operation_1", data_size=100):
            time.sleep(0.01)

        with profiler.measure_operation("operation_2", data_size=200):
            time.sleep(0.01)

        assert len(profiler.profiles) == 2

        for profile in profiler.profiles:
            assert profile.execution_time > 0
            assert profile.operation_name in ["operation_1", "operation_2"]

    def test_memory_monitor_workflow(self):
        """Test complete memory monitoring workflow."""
        monitor = MemoryMonitor()

        monitor.record_memory_snapshot()
        monitor.record_memory_snapshot()

        current = monitor.get_memory_usage()
        trend = monitor.get_memory_trend()

        assert len(monitor.memory_history) == 2
        assert isinstance(current, dict)
        assert "trend" in trend
