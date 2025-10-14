"""Performance profiling and monitoring utilities for Streamlit Lightweight Charts Pro.

This module provides comprehensive performance profiling tools for identifying
bottlenecks and monitoring optimization effectiveness in the charting library.
It includes advanced memory tracking, CPU monitoring, and automated performance
analysis with intelligent recommendations.

The module provides:
    - PerformanceProfiler: Advanced profiler with memory and CPU monitoring
    - PerformanceProfile: Data class for individual operation profiles
    - PerformanceReport: Comprehensive performance analysis report
    - MemoryMonitor: Memory usage monitoring and optimization suggestions
    - Convenience functions for easy profiling integration

Key Features:
    - Real-time memory and CPU usage tracking
    - Automatic bottleneck identification
    - Performance optimization recommendations
    - Thread-safe operation profiling
    - Export capabilities for detailed analysis
    - Memory leak detection and trend analysis

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.utils.profiler import profile_function, profile_operation


    # Profile a function
    @profile_function("chart_rendering", data_size=1000)
    def render_chart(data):
        return Chart(data)


    # Profile an operation block
    with profile_operation("data_processing", data_size=5000):
        processed_data = process_large_dataset(data)
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
import json
import threading
import time
import tracemalloc
from collections import defaultdict
from contextlib import contextmanager
from dataclasses import dataclass, field
from functools import wraps
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

# Third Party Imports
import psutil

# Local Imports
from streamlit_lightweight_charts_pro.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class PerformanceProfile:
    """Performance profile data for a single operation.

    This class stores comprehensive performance metrics for a single operation
    execution, including timing, memory usage, CPU utilization, and optional
    metadata. It serves as the basic unit of performance measurement in the
    profiling system.

    Attributes:
        operation_name (str): Name identifier for the operation being profiled.
        execution_time (float): Total execution time in seconds.
        memory_peak (int): Peak memory usage during operation in bytes.
        memory_current (int): Current memory usage at operation end in bytes.
        memory_delta (int): Change in memory usage (current - initial) in bytes.
        cpu_percent (float): CPU utilization percentage during operation.
        data_size (Optional[int]): Size of data being processed (if applicable).
        cache_hits (int): Number of cache hits during operation. Defaults to 0.
        cache_misses (int): Number of cache misses during operation. Defaults to 0.
        timestamp (float): Unix timestamp when operation completed. Auto-generated.
        thread_id (int): Thread ID where operation executed. Auto-generated.

    Example:
        ```python
        profile = PerformanceProfile(
            operation_name="chart_rendering",
            execution_time=0.125,
            memory_peak=52428800,
            memory_current=10485760,
            memory_delta=4194304,
            cpu_percent=15.5,
            data_size=1000,
        )
        ```

    Note:
        The timestamp and thread_id fields are automatically populated
        using the current time and thread identifier when the profile
        is created.
    """

    operation_name: str
    execution_time: float
    memory_peak: int
    memory_current: int
    memory_delta: int
    cpu_percent: float
    data_size: Optional[int] = None
    cache_hits: int = 0
    cache_misses: int = 0
    timestamp: float = field(default_factory=time.time)  # Auto-generate current timestamp
    thread_id: int = field(default_factory=threading.get_ident)  # Auto-generate current thread ID


@dataclass
class PerformanceReport:
    """Comprehensive performance report with analysis and recommendations.

    This class aggregates performance data from multiple operations and provides
    comprehensive analysis including bottleneck identification and optimization
    recommendations. It serves as the main output of the profiling system.

    Attributes:
        total_operations (int): Total number of operations profiled.
        total_execution_time (float): Sum of all execution times in seconds.
        average_execution_time (float): Average execution time per operation.
        memory_peak_total (int): Peak memory usage across all operations in bytes.
        memory_current_total (int): Current memory usage at report generation.
        operations (List[PerformanceProfile]): List of all individual operation profiles.
        bottlenecks (List[str]): Identified performance bottlenecks with details.
        recommendations (List[str]): Optimization recommendations based on analysis.

    Example:
        ```python
        report = PerformanceReport(
            total_operations=100,
            total_execution_time=12.5,
            average_execution_time=0.125,
            memory_peak_total=104857600,
            memory_current_total=52428800,
            operations=[...],
            bottlenecks=["chart_rendering: 0.250s average"],
            recommendations=["Consider caching for repeated operations"],
        )
        ```

    Note:
        The report is generated by the PerformanceProfiler and includes
        intelligent analysis of the collected performance data.
    """

    total_operations: int
    total_execution_time: float
    average_execution_time: float
    memory_peak_total: int
    memory_current_total: int
    operations: List[PerformanceProfile]
    bottlenecks: List[str]
    recommendations: List[str]

    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary for serialization.

        This method converts the performance report to a dictionary format
        suitable for JSON serialization or other data exchange formats.
        It includes all key metrics and analysis results.

        Returns:
            Dict[str, Any]: Dictionary representation of the performance report
                with all metrics and analysis results.

        Example:
            ```python
            report = profiler.generate_report()
            report_dict = report.to_dict()
            # Use for JSON export or API responses
            ```
        """
        # Convert the performance report to a dictionary format
        # This includes all key metrics and analysis results for serialization
        return {
            "total_operations": self.total_operations,  # Total number of operations
            "total_execution_time": self.total_execution_time,  # Sum of all execution times
            "average_execution_time": self.average_execution_time,  # Average time per operation
            "memory_peak_total": self.memory_peak_total,  # Peak memory usage
            "memory_current_total": self.memory_current_total,  # Current memory usage
            "operations_count": len(self.operations),  # Count of individual profiles
            "bottlenecks": self.bottlenecks,  # Identified bottlenecks
            "recommendations": self.recommendations,  # Optimization suggestions
        }


class PerformanceProfiler:
    """Advanced performance profiler with memory and CPU monitoring."""

    def __init__(self, enable_memory_tracking: bool = True):
        """Initialize profiler with optional memory tracking.

        This method sets up the performance profiler with the specified
        memory tracking configuration. It initializes data structures
        for storing performance profiles and starts memory tracking
        if enabled.

        Args:
            enable_memory_tracking (bool): Whether to enable detailed memory
                tracking using tracemalloc. Defaults to True for comprehensive
                memory analysis.

        Note:
            Memory tracking uses Python's tracemalloc module which may
            have a small performance overhead but provides detailed
            memory usage information.
        """
        # Store memory tracking configuration
        self.enable_memory_tracking = enable_memory_tracking

        # Initialize data structures for storing performance data
        self.profiles: List[PerformanceProfile] = []  # Store all operation profiles
        self.operation_times: Dict[str, List[float]] = defaultdict(list)  # Group times by operation
        self.memory_snapshots: List[Dict[str, int]] = []  # Store memory usage snapshots

        # Thread lock for thread-safe operations
        # This ensures that concurrent profiling doesn't corrupt data
        self._lock = threading.Lock()

        # Start memory tracking if enabled
        # This uses Python's tracemalloc for detailed memory analysis
        if enable_memory_tracking:
            tracemalloc.start()  # Start tracking memory allocations

    def profile_operation(self, operation_name: str, data_size: Optional[int] = None):
        """Decorator to profile a function or method."""

        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                with self.measure_operation(operation_name, data_size):
                    return func(*args, **kwargs)

            return wrapper

        return decorator

    @contextmanager
    def measure_operation(self, operation_name: str, data_size: Optional[int] = None):
        """Context manager to measure operation performance.

        This context manager measures the performance of a code block by
        tracking execution time, memory usage, and CPU utilization. It
        automatically creates a PerformanceProfile and stores it for analysis.

        Args:
            operation_name (str): Name identifier for the operation being measured.
            data_size (Optional[int]): Size of data being processed (if applicable).

        Yields:
            None: The context manager yields control to the measured code block.

        Example:
            ```python
            with profiler.measure_operation("chart_rendering", data_size=1000):
                chart = create_chart(data)
            ```
        """
        # Get the current process for memory and CPU monitoring
        process = psutil.Process()

        # Record initial memory state (Resident Set Size - actual physical memory)
        initial_memory = process.memory_info().rss

        # Initialize CPU monitoring (first call returns 0, subsequent calls return actual usage)
        process.cpu_percent()

        # Take initial memory snapshot if detailed tracking is enabled
        # This provides baseline for memory usage analysis
        if self.enable_memory_tracking:
            tracemalloc.take_snapshot()

        # Record start time for execution time measurement
        start_time = time.time()

        try:
            # Yield control to the code block being measured
            # This is where the actual operation executes
            yield
        finally:
            # Record end time and calculate execution duration
            end_time = time.time()
            execution_time = end_time - start_time

            # Get final memory state after operation completion
            final_memory = process.memory_info().rss
            final_cpu = process.cpu_percent()

            # Calculate memory delta (change in memory usage)
            memory_delta = final_memory - initial_memory

            # Get peak memory usage if detailed tracking is enabled
            # Use final memory as fallback, or calculate peak from tracemalloc
            memory_peak = final_memory
            if self.enable_memory_tracking:
                # Take final snapshot and calculate total memory used
                snapshot = tracemalloc.take_snapshot()
                memory_peak = sum(stat.size for stat in snapshot.statistics("lineno"))

            # Create comprehensive performance profile for this operation
            profile = PerformanceProfile(
                operation_name=operation_name,  # Operation identifier
                execution_time=execution_time,  # Total execution time
                memory_peak=memory_peak,  # Peak memory usage
                memory_current=final_memory,  # Current memory usage
                memory_delta=memory_delta,  # Change in memory usage
                cpu_percent=final_cpu,  # CPU utilization percentage
                data_size=data_size,  # Optional data size metadata
            )

            # Store the profile in thread-safe manner
            # This ensures concurrent profiling doesn't corrupt the data
            with self._lock:
                self.profiles.append(profile)  # Add to profiles list
                self.operation_times[operation_name].append(
                    execution_time,
                )  # Group by operation name

    def get_operation_stats(self, operation_name: str) -> Dict[str, float]:
        """Get statistics for a specific operation."""
        times = self.operation_times.get(operation_name, [])
        if not times:
            return {}

        return {
            "count": len(times),
            "total_time": sum(times),
            "average_time": sum(times) / len(times),
            "min_time": min(times),
            "max_time": max(times),
            "median_time": sorted(times)[len(times) // 2],
        }

    def identify_bottlenecks(self, threshold_percentile: float = 95.0) -> List[str]:
        """Identify performance bottlenecks based on execution times."""
        if not self.profiles:
            return []

        # Calculate threshold
        all_times = [p.execution_time for p in self.profiles]
        threshold = sorted(all_times)[int(len(all_times) * threshold_percentile / 100)]

        # Find operations above threshold
        slow_operations = []
        operation_stats = defaultdict(list)

        for profile in self.profiles:
            operation_stats[profile.operation_name].append(profile.execution_time)

        for op_name, times in operation_stats.items():
            avg_time = sum(times) / len(times)
            if avg_time > threshold:
                slow_operations.append(f"{op_name}: {avg_time:.4f}s average")

        return slow_operations

    def generate_recommendations(self) -> List[str]:
        """Generate performance optimization recommendations."""
        recommendations: List[str] = []

        if not self.profiles:
            return recommendations

        # Analyze memory usage
        memory_profiles = [p for p in self.profiles if p.memory_delta > 0]
        if memory_profiles:
            avg_memory_delta = sum(p.memory_delta for p in memory_profiles) / len(memory_profiles)
            if avg_memory_delta > 100 * 1024 * 1024:  # 100MB
                recommendations.append(
                    "High memory usage detected. Consider using lazy loading or chunking.",
                )

        # Analyze execution times
        slow_operations = self.identify_bottlenecks(90.0)
        if slow_operations:
            recommendations.append(
                f"Slow operations detected: {', '.join(slow_operations[:3])}. "
                "Consider optimization or caching.",
            )

        # Analyze data size vs performance
        large_data_ops = [p for p in self.profiles if p.data_size and p.data_size > 10000]
        if large_data_ops:
            recommendations.append(
                "Large datasets detected. Consider using vectorized processing or "
                "memory-efficient data classes.",
            )

        # Check for repeated operations
        operation_counts: defaultdict[str, int] = defaultdict(int)
        for profile in self.profiles:
            operation_counts[profile.operation_name] += 1

        repeated_ops = [op for op, count in operation_counts.items() if count > 10]
        if repeated_ops:
            recommendations.append(
                f"Frequent operations detected: {', '.join(repeated_ops)}. "
                "Consider caching or batching.",
            )

        return recommendations

    def generate_report(self) -> PerformanceReport:
        """Generate comprehensive performance report."""
        if not self.profiles:
            return PerformanceReport(
                total_operations=0,
                total_execution_time=0.0,
                average_execution_time=0.0,
                memory_peak_total=0,
                memory_current_total=0,
                operations=[],
                bottlenecks=[],
                recommendations=[],
            )

        total_time = sum(p.execution_time for p in self.profiles)
        avg_time = total_time / len(self.profiles)
        memory_peak_total = max(p.memory_peak for p in self.profiles)
        memory_current_total = max(p.memory_current for p in self.profiles)

        bottlenecks = self.identify_bottlenecks()
        recommendations = self.generate_recommendations()

        return PerformanceReport(
            total_operations=len(self.profiles),
            total_execution_time=total_time,
            average_execution_time=avg_time,
            memory_peak_total=memory_peak_total,
            memory_current_total=memory_current_total,
            operations=self.profiles.copy(),
            bottlenecks=bottlenecks,
            recommendations=recommendations,
        )

    def clear_profiles(self) -> None:
        """Clear all stored profiles."""
        with self._lock:
            self.profiles.clear()
            self.operation_times.clear()
            self.memory_snapshots.clear()

        if self.enable_memory_tracking:
            tracemalloc.stop()
            tracemalloc.start()

    def export_profiles(self, filename: str) -> None:
        """Export profiles to a file for analysis."""
        report = self.generate_report()

        with Path(filename).open("w", encoding="utf-8") as f:
            json.dump(report.to_dict(), f, indent=2)

        logger.info("Performance profiles exported to %s", filename)


class MemoryMonitor:
    """Memory usage monitoring and optimization suggestions."""

    def __init__(self) -> None:
        """Initialize memory monitor."""
        self.memory_history: List[Dict[str, float]] = []
        self.process = psutil.Process()

    def get_memory_usage(self) -> Dict[str, float]:
        """Get current memory usage information."""
        memory_info = self.process.memory_info()
        return {
            "rss": float(memory_info.rss),  # Resident Set Size
            "vms": float(memory_info.vms),  # Virtual Memory Size
            "percent": self.process.memory_percent(),
        }

    def record_memory_snapshot(self) -> None:
        """Record current memory usage snapshot."""
        snapshot = self.get_memory_usage()
        snapshot["timestamp"] = time.time()
        self.memory_history.append(snapshot)

    def get_memory_trend(self) -> Dict[str, Any]:
        """Analyze memory usage trend."""
        if len(self.memory_history) < 2:
            return {"trend": "insufficient_data"}

        recent = self.memory_history[-1]
        older = self.memory_history[0]

        rss_change = recent["rss"] - older["rss"]
        vms_change = recent["vms"] - older["vms"]

        if rss_change > 0:
            trend = "increasing"
        elif rss_change < 0:
            trend = "decreasing"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "rss_change": rss_change,
            "vms_change": vms_change,
            "current_rss": recent["rss"],
            "current_vms": recent["vms"],
        }

    def suggest_optimizations(self) -> List[str]:
        """Suggest memory optimizations based on usage patterns."""
        suggestions: List[str] = []

        if not self.memory_history:
            return suggestions

        current = self.memory_history[-1]
        trend = self.get_memory_trend()

        # Check for high memory usage
        if current["percent"] > 80:
            suggestions.append(
                "High memory usage detected. Consider using memory-efficient data classes.",
            )

        # Check for memory leaks
        if trend["trend"] == "increasing" and trend["rss_change"] > 100 * 1024 * 1024:  # 100MB
            suggestions.append("Potential memory leak detected. Check for unclosed resources.")

        # Check for large virtual memory usage
        if current["vms"] > 2 * 1024 * 1024 * 1024:  # 2GB
            suggestions.append("Large virtual memory usage. Consider using chunked processing.")

        return suggestions


# Global profiler instance
_global_profiler = PerformanceProfiler()
_memory_monitor = MemoryMonitor()


def get_profiler() -> PerformanceProfiler:
    """Get the global profiler instance."""
    return _global_profiler


def get_memory_monitor() -> MemoryMonitor:
    """Get the global memory monitor instance."""
    return _memory_monitor


def profile_function(operation_name: str, data_size: Optional[int] = None):
    """Convenience decorator for profiling functions."""
    return _global_profiler.profile_operation(operation_name, data_size)


@contextmanager
def profile_operation(operation_name: str, data_size: Optional[int] = None):
    """Convenience context manager for profiling operations."""
    with _global_profiler.measure_operation(operation_name, data_size):
        yield


def get_performance_summary() -> Dict[str, Any]:
    """Get a quick performance summary."""
    report = _global_profiler.generate_report()
    memory_trend = _memory_monitor.get_memory_trend()

    return {
        "operations": report.total_operations,
        "total_time": report.total_execution_time,
        "avg_time": report.average_execution_time,
        "memory_trend": memory_trend["trend"],
        "current_memory_mb": memory_trend["current_rss"] / (1024 * 1024),
        "bottlenecks": len(report.bottlenecks),
        "recommendations": len(report.recommendations),
    }
