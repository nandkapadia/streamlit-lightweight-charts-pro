"""Performance profiling and monitoring utilities.

This module provides comprehensive performance profiling tools for identifying
bottlenecks and monitoring optimization effectiveness in the charting library.
"""

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

import psutil

from streamlit_lightweight_charts_pro.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class PerformanceProfile:
    """Performance profile data for a single operation."""

    operation_name: str
    execution_time: float
    memory_peak: int
    memory_current: int
    memory_delta: int
    cpu_percent: float
    data_size: Optional[int] = None
    cache_hits: int = 0
    cache_misses: int = 0
    timestamp: float = field(default_factory=time.time)
    thread_id: int = field(default_factory=threading.get_ident)


@dataclass
class PerformanceReport:
    """Comprehensive performance report."""

    total_operations: int
    total_execution_time: float
    average_execution_time: float
    memory_peak_total: int
    memory_current_total: int
    operations: List[PerformanceProfile]
    bottlenecks: List[str]
    recommendations: List[str]

    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary for serialization."""
        return {
            "total_operations": self.total_operations,
            "total_execution_time": self.total_execution_time,
            "average_execution_time": self.average_execution_time,
            "memory_peak_total": self.memory_peak_total,
            "memory_current_total": self.memory_current_total,
            "operations_count": len(self.operations),
            "bottlenecks": self.bottlenecks,
            "recommendations": self.recommendations,
        }


class PerformanceProfiler:
    """Advanced performance profiler with memory and CPU monitoring."""

    def __init__(self, enable_memory_tracking: bool = True):
        """Initialize profiler.

        Args:
            enable_memory_tracking: Whether to enable detailed memory tracking
        """
        self.enable_memory_tracking = enable_memory_tracking
        self.profiles: List[PerformanceProfile] = []
        self.operation_times: Dict[str, List[float]] = defaultdict(list)
        self.memory_snapshots: List[Dict[str, int]] = []
        self._lock = threading.Lock()

        if enable_memory_tracking:
            tracemalloc.start()

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
        """Context manager to measure operation performance."""
        # Get initial memory state
        process = psutil.Process()
        initial_memory = process.memory_info().rss
        process.cpu_percent()

        if self.enable_memory_tracking:
            tracemalloc.take_snapshot()

        start_time = time.time()

        try:
            yield
        finally:
            end_time = time.time()
            execution_time = end_time - start_time

            # Get final memory state
            final_memory = process.memory_info().rss
            final_cpu = process.cpu_percent()

            memory_delta = final_memory - initial_memory

            # Get peak memory if tracking is enabled
            memory_peak = final_memory
            if self.enable_memory_tracking:
                snapshot = tracemalloc.take_snapshot()
                memory_peak = sum(stat.size for stat in snapshot.statistics("lineno"))

            # Create profile
            profile = PerformanceProfile(
                operation_name=operation_name,
                execution_time=execution_time,
                memory_peak=memory_peak,
                memory_current=final_memory,
                memory_delta=memory_delta,
                cpu_percent=final_cpu,
                data_size=data_size,
            )

            # Store profile
            with self._lock:
                self.profiles.append(profile)
                self.operation_times[operation_name].append(execution_time)

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
        recommendations = []

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
        operation_counts = defaultdict(int)
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

        with Path(filename).open("w") as f:
            json.dump(report.to_dict(), f, indent=2)

        logger.info("Performance profiles exported to %s", filename)


class MemoryMonitor:
    """Memory usage monitoring and optimization suggestions."""

    def __init__(self):
        self.memory_history: List[Dict[str, int]] = []
        self.process = psutil.Process()

    def get_memory_usage(self) -> Dict[str, int]:
        """Get current memory usage information."""
        memory_info = self.process.memory_info()
        return {
            "rss": memory_info.rss,  # Resident Set Size
            "vms": memory_info.vms,  # Virtual Memory Size
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
        suggestions = []

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
