"""Performance profiling and monitoring utilities.

This module provides comprehensive performance profiling tools for identifying
bottlenecks and monitoring optimization effectiveness in the charting library.
It includes advanced memory tracking, CPU monitoring, and automated performance
analysis with intelligent recommendations.

The profiling system helps developers:
    - Identify performance bottlenecks in chart operations
    - Monitor memory usage and detect potential leaks
    - Track CPU utilization across operations
    - Generate actionable optimization recommendations
    - Export detailed performance reports for analysis

Architecture:
    The module provides a multi-layered profiling approach:

    PerformanceProfile:
        Data class storing metrics for a single operation execution.
        Captures timing, memory, CPU, and optional metadata.

    PerformanceReport:
        Aggregated analysis report with bottlenecks and recommendations.
        Generated from multiple PerformanceProfile instances.

    PerformanceProfiler:
        Main profiler class with context managers and decorators.
        Provides thread-safe operation tracking and analysis.

    MemoryMonitor:
        Specialized memory tracking with trend analysis.
        Detects leaks and provides memory optimization suggestions.

Key Features:
    - Real-time memory and CPU usage tracking
    - Automatic bottleneck identification (95th percentile)
    - Performance optimization recommendations
    - Thread-safe operation profiling
    - Export capabilities for detailed analysis
    - Memory leak detection and trend analysis
    - Global profiler instance for easy integration
    - Decorator and context manager APIs

Example:
    Using the global profiler with decorators::

        from lightweight_charts_core.utils.profiler import profile_function


        @profile_function("chart_rendering", data_size=1000)
        def render_chart(data):
            '''Create and render a chart with the given data.'''
            chart = Chart(data)
            return chart.render()


        # Function is automatically profiled on each call
        result = render_chart(my_data)

    Using context manager for code blocks::

        from lightweight_charts_core.utils.profiler import profile_operation

        # Profile a specific block of code
        with profile_operation("data_processing", data_size=5000):
            # This entire block is profiled
            processed_data = transform_data(raw_data)
            validated_data = validate_data(processed_data)
            cached_data = cache_data(validated_data)

    Custom profiler instance::

        from lightweight_charts_core.utils.profiler import PerformanceProfiler

        # Create custom profiler with specific settings
        profiler = PerformanceProfiler(enable_memory_tracking=True)

        # Use as context manager
        with profiler.measure_operation("complex_operation"):
            perform_complex_task()

        # Generate and export report
        report = profiler.generate_report()
        profiler.export_profiles("performance_report.json")

        print(f"Total operations: {report.total_operations}")
        print(f"Avg execution time: {report.average_execution_time:.3f}s")
        print(f"Bottlenecks: {len(report.bottlenecks)}")

    Memory monitoring::

        from lightweight_charts_core.utils.profiler import get_memory_monitor

        monitor = get_memory_monitor()

        # Record snapshots before and after operations
        monitor.record_memory_snapshot()
        perform_memory_intensive_operation()
        monitor.record_memory_snapshot()

        # Analyze memory trends
        trend = monitor.get_memory_trend()
        print(f"Memory trend: {trend['trend']}")
        print(f"RSS change: {trend['rss_change'] / 1024 / 1024:.2f} MB")

        # Get optimization suggestions
        suggestions = monitor.suggest_optimizations()
        for suggestion in suggestions:
            print(f"- {suggestion}")

    Performance summary::

        from lightweight_charts_core.utils.profiler import get_performance_summary

        # Get quick summary of all profiled operations
        summary = get_performance_summary()
        print(f"Total operations: {summary['operations']}")
        print(f"Total time: {summary['total_time']:.2f}s")
        print(f"Average time: {summary['avg_time']:.3f}s")
        print(f"Memory trend: {summary['memory_trend']}")
        print(f"Bottlenecks found: {summary['bottlenecks']}")

Note:
    The module provides a global profiler instance (_global_profiler) that
    can be accessed via convenience functions like profile_function(),
    profile_operation(), and get_profiler(). This allows for easy
    integration without managing profiler instances.

    Memory tracking uses Python's tracemalloc module, which has a small
    performance overhead but provides detailed memory usage information.
    You can disable it by passing enable_memory_tracking=False.

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
from collections.abc import Callable
from contextlib import contextmanager
from dataclasses import dataclass, field
from functools import wraps
from pathlib import Path
from typing import Any

# Third Party Imports
import psutil

# Local Imports
from lightweight_charts_core.logging_config import get_logger

# Initialize logger for this module
logger = get_logger(__name__)


@dataclass
class PerformanceProfile:
    """Performance profile data for a single operation.

    This class stores comprehensive performance metrics for a single operation
    execution, including timing, memory usage, CPU utilization, and optional
    metadata. It serves as the basic unit of performance measurement in the
    profiling system.

    Each profile captures a complete snapshot of an operation's resource usage,
    enabling detailed analysis and comparison across multiple executions or
    different operations.

    Attributes:
        operation_name (str): Name identifier for the operation being profiled.
            Used to group and analyze similar operations.
        execution_time (float): Total execution time in seconds. Measured from
            operation start to completion.
        memory_peak (int): Peak memory usage during operation in bytes. The
            maximum memory allocated at any point during execution.
        memory_current (int): Current memory usage at operation end in bytes.
            The resident set size (RSS) when the operation completed.
        memory_delta (int): Change in memory usage (current - initial) in bytes.
            Positive values indicate memory allocation, negative indicate
            deallocation.
        cpu_percent (float): CPU utilization percentage during operation. Ranges
            from 0.0 to 100.0 * cpu_count (can exceed 100% on multi-core).
        data_size (Optional[int]): Size of data being processed (if applicable).
            Useful for analyzing performance scalability with input size.
        cache_hits (int): Number of cache hits during operation. Defaults to 0.
            Tracks cache effectiveness when caching is implemented.
        cache_misses (int): Number of cache misses during operation. Defaults to 0.
            Combined with hits, indicates cache efficiency.
        timestamp (float): Unix timestamp when operation completed. Auto-generated
            using time.time() at profile creation.
        thread_id (int): Thread ID where operation executed. Auto-generated using
            threading.get_ident() at profile creation. Useful for analyzing
            concurrent operations.

    Example:
        Manual profile creation::

            >>> profile = PerformanceProfile(
            ...     operation_name="chart_rendering",
            ...     execution_time=0.125,
            ...     memory_peak=52428800,  # 50 MB
            ...     memory_current=10485760,  # 10 MB
            ...     memory_delta=4194304,  # 4 MB increase
            ...     cpu_percent=15.5,
            ...     data_size=1000,
            ...     cache_hits=25,
            ...     cache_misses=5
            ... )
            >>> print(f"Operation: {profile.operation_name}")
            >>> print(f"Time: {profile.execution_time:.3f}s")
            >>> print(f"Memory delta: {profile.memory_delta / 1024 / 1024:.1f} MB")

        Profiles are typically created automatically by PerformanceProfiler::

            >>> profiler = PerformanceProfiler()
            >>> with profiler.measure_operation("data_transform"):
            ...     transform_data(dataset)
            >>> # Profile automatically created and stored

    Note:
        The timestamp and thread_id fields are automatically populated
        using the current time and thread identifier when the profile
        is created. These are useful for:
            - Temporal analysis of performance changes
            - Identifying concurrent execution patterns
            - Correlating profiles with system events

    """

    operation_name: str
    execution_time: float
    memory_peak: int
    memory_current: int
    memory_delta: int
    cpu_percent: float
    data_size: int | None = None
    cache_hits: int = 0
    cache_misses: int = 0
    # Auto-generate current timestamp when profile is created
    timestamp: float = field(default_factory=time.time)
    # Auto-generate current thread ID when profile is created
    thread_id: int = field(default_factory=threading.get_ident)


@dataclass
class PerformanceReport:
    r"""Comprehensive performance report with analysis and recommendations.

    This class aggregates performance data from multiple operations and provides
    comprehensive analysis including bottleneck identification and optimization
    recommendations. It serves as the main output of the profiling system.

    The report analyzes all collected profiles to identify patterns, bottlenecks,
    and opportunities for optimization. It's designed to provide actionable
    insights for performance improvement.

    Attributes:
        total_operations (int): Total number of operations profiled across
            all operation types.
        total_execution_time (float): Sum of all execution times in seconds.
            Represents the cumulative time spent in profiled operations.
        average_execution_time (float): Average execution time per operation
            in seconds. Calculated as total_execution_time / total_operations.
        memory_peak_total (int): Peak memory usage across all operations in bytes.
            The maximum memory used by any single operation.
        memory_current_total (int): Current memory usage at report generation
            in bytes. The memory in use when the report was created.
        operations (List[PerformanceProfile]): List of all individual operation
            profiles collected by the profiler. Provides detailed per-operation
            metrics.
        bottlenecks (List[str]): Identified performance bottlenecks with details.
            Operations that exceed the 95th percentile of execution times.
        recommendations (List[str]): Optimization recommendations based on
            analysis. Actionable suggestions for improving performance.

    Example:
        Generate and analyze report::

            >>> profiler = PerformanceProfiler()
            >>> # ... perform profiled operations ...
            >>> report = profiler.generate_report()
            >>> print(f"Total operations: {report.total_operations}")
            >>> print(f"Total time: {report.total_execution_time:.2f}s")
            >>> print(f"Average time: {report.average_execution_time:.3f}s")
            >>> print(f"Peak memory: {report.memory_peak_total / 1024 / 1024:.1f} MB")
            >>> print(f"\\nBottlenecks:")
            >>> for bottleneck in report.bottlenecks:
            ...     print(f"  - {bottleneck}")
            >>> print(f"\\nRecommendations:")
            >>> for rec in report.recommendations:
            ...     print(f"  - {rec}")

        Export report to JSON::

            >>> report_dict = report.to_dict()
            >>> with open("performance.json", "w") as f:
            ...     json.dump(report_dict, f, indent=2)

    Note:
        The report is generated by the PerformanceProfiler.generate_report()
        method and includes intelligent analysis of the collected performance
        data. The analysis includes:
            - Bottleneck identification (95th percentile analysis)
            - Memory usage patterns
            - Large dataset detection
            - Repeated operation detection
            - CPU utilization analysis

    """

    total_operations: int
    total_execution_time: float
    average_execution_time: float
    memory_peak_total: int
    memory_current_total: int
    operations: list[PerformanceProfile]
    bottlenecks: list[str]
    recommendations: list[str]

    def to_dict(self) -> dict[str, Any]:
        """Convert report to dictionary for serialization.

        This method converts the performance report to a dictionary format
        suitable for JSON serialization or other data exchange formats.
        It includes all key metrics and analysis results but excludes the
        detailed operation profiles for brevity.

        Returns:
            Dict[str, Any]: Dictionary representation of the performance report
                with all metrics and analysis results. Contains:
                    - total_operations: Number of profiled operations
                    - total_execution_time: Cumulative execution time
                    - average_execution_time: Mean execution time
                    - memory_peak_total: Maximum memory usage
                    - memory_current_total: Current memory usage
                    - operations_count: Count of operation profiles
                    - bottlenecks: List of identified bottlenecks
                    - recommendations: List of optimization suggestions

        Example:
            Export to JSON file::

                >>> report = profiler.generate_report()
                >>> report_dict = report.to_dict()
                >>> import json
                >>> with open("perf_report.json", "w") as f:
                ...     json.dump(report_dict, f, indent=2)

            Use in API response::

                >>> @app.get("/performance")
                >>> def get_performance():
                ...     report = profiler.generate_report()
                ...     return report.to_dict()

        Note:
            The detailed operations list is not included in the dictionary
            to keep the output concise. Only the count is provided via
            operations_count. If you need detailed operation data, access
            the operations attribute directly.

        """
        # Convert the performance report to a dictionary format
        # This includes all key metrics and analysis results for serialization
        return {
            # Total number of operations profiled
            "total_operations": self.total_operations,
            # Sum of all execution times in seconds
            "total_execution_time": self.total_execution_time,
            # Average time per operation in seconds
            "average_execution_time": self.average_execution_time,
            # Peak memory usage across all operations in bytes
            "memory_peak_total": self.memory_peak_total,
            # Current memory usage at report generation in bytes
            "memory_current_total": self.memory_current_total,
            # Count of individual operation profiles
            "operations_count": len(self.operations),
            # List of identified performance bottlenecks
            "bottlenecks": self.bottlenecks,
            # List of optimization recommendations
            "recommendations": self.recommendations,
        }


class PerformanceProfiler:
    """Advanced performance profiler with memory and CPU monitoring.

    This class provides comprehensive performance profiling capabilities for
    tracking execution time, memory usage, and CPU utilization across operations.
    It supports both decorator and context manager APIs for flexible integration.

    The profiler is thread-safe and can track multiple concurrent operations.
    It automatically analyzes collected profiles to identify bottlenecks and
    generate optimization recommendations.

    Attributes:
        enable_memory_tracking (bool): Whether detailed memory tracking is enabled
            using tracemalloc. Has small performance overhead.
        profiles (List[PerformanceProfile]): List of all collected operation
            profiles for analysis.
        operation_times (Dict[str, List[float]]): Execution times grouped by
            operation name for statistical analysis.
        memory_snapshots (List[Dict[str, int]]): Historical memory usage
            snapshots for trend analysis.

    Example:
        Basic usage with context manager::

            >>> profiler = PerformanceProfiler()
            >>> with profiler.measure_operation("chart_render"):
            ...     render_chart(data)
            >>> report = profiler.generate_report()

        Using as decorator::

            >>> profiler = PerformanceProfiler()
            >>> @profiler.profile_operation("data_transform", data_size=1000)
            ... def transform_data(df):
            ...     return df.apply(transformation)

        Generate and export reports::

            >>> profiler = PerformanceProfiler()
            >>> # ... perform operations ...
            >>> report = profiler.generate_report()
            >>> profiler.export_profiles("performance.json")

    Note:
        For most use cases, use the global profiler instance via the
        convenience functions: profile_function(), profile_operation(),
        and get_profiler().

    """

    def __init__(self, enable_memory_tracking: bool = True):
        """Initialize profiler with optional memory tracking.

        This method sets up the performance profiler with the specified
        memory tracking configuration. It initializes data structures
        for storing performance profiles and starts memory tracking
        if enabled.

        Args:
            enable_memory_tracking (bool, optional): Whether to enable detailed
                memory tracking using tracemalloc. Defaults to True. When enabled,
                provides accurate peak memory measurements but incurs a small
                performance overhead (~5-10%).

        Example:
            Create profiler with memory tracking::

                >>> profiler = PerformanceProfiler(enable_memory_tracking=True)

            Create lightweight profiler without memory tracking::

                >>> profiler = PerformanceProfiler(enable_memory_tracking=False)

        Note:
            Memory tracking uses Python's tracemalloc module which tracks
            memory allocations at the Python level. It provides detailed
            insights but has a small performance cost. Disable it for
            minimal overhead in production environments.

        """
        # Store memory tracking configuration for later use
        self.enable_memory_tracking = enable_memory_tracking

        # Initialize list to store all operation profiles
        # Each profile contains metrics for a single operation execution
        self.profiles: list[PerformanceProfile] = []

        # Initialize dict to group execution times by operation name
        # Used for calculating statistics per operation type
        self.operation_times: dict[str, list[float]] = defaultdict(list)

        # Initialize list to store memory usage snapshots over time
        # Used for trend analysis and leak detection
        self.memory_snapshots: list[dict[str, int]] = []

        # Create thread lock for thread-safe operations
        # Ensures concurrent profiling doesn't corrupt data structures
        self._lock = threading.Lock()

        # Start memory tracking if enabled
        # tracemalloc tracks Python memory allocations for detailed analysis
        if enable_memory_tracking:
            # Start tracking memory allocations at the Python level
            tracemalloc.start()

    def profile_operation(self, operation_name: str, data_size: int | None = None):
        """Decorator to profile a function or method.

        This decorator wraps a function to automatically profile its execution
        time, memory usage, and CPU utilization. Each invocation of the
        decorated function creates a new PerformanceProfile.

        Args:
            operation_name (str): Name identifier for the operation being
                profiled. Used to group and analyze similar operations.
            data_size (Optional[int], optional): Size of data being processed
                (if applicable). Useful for analyzing scalability. Defaults to None.

        Returns:
            Callable: Decorator function that wraps the target function with
                profiling instrumentation.

        Example:
            Profile a function::

                >>> profiler = PerformanceProfiler()
                >>> @profiler.profile_operation("chart_rendering", data_size=1000)
                ... def render_chart(data):
                ...     return Chart(data).render()
                >>> # Function is automatically profiled on each call
                >>> result = render_chart(my_data)

            Profile with dynamic data size::

                >>> @profiler.profile_operation("data_processing")
                ... def process_data(data):
                ...     return transform(data)

        Note:
            The decorator preserves the original function's metadata using
            functools.wraps, so docstrings, name, and other attributes are
            maintained.

        """

        # Define the decorator that will wrap the target function
        def decorator(func: Callable) -> Callable:
            # Use functools.wraps to preserve function metadata
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Profile the function execution using measure_operation
                with self.measure_operation(operation_name, data_size):
                    # Call the original function and return its result
                    return func(*args, **kwargs)

            # Return the wrapped function
            return wrapper

        # Return the decorator
        return decorator

    @contextmanager
    def measure_operation(self, operation_name: str, data_size: int | None = None):
        """Context manager to measure operation performance.

        This context manager measures the performance of a code block by
        tracking execution time, memory usage, and CPU utilization. It
        automatically creates a PerformanceProfile and stores it for analysis.

        The measurement process:
            1. Record initial state (memory, CPU baseline)
            2. Take memory snapshot if tracking is enabled
            3. Execute the measured code block
            4. Record final state (memory, CPU)
            5. Calculate deltas and create profile
            6. Store profile for analysis

        Args:
            operation_name (str): Name identifier for the operation being
                measured. Used to group similar operations for analysis.
            data_size (Optional[int], optional): Size of data being processed
                (if applicable). Useful for analyzing performance scalability.
                Defaults to None.

        Yields:
            None: The context manager yields control to the measured code block.

        Example:
            Profile a code block::

                >>> profiler = PerformanceProfiler()
                >>> with profiler.measure_operation("data_transform", data_size=5000):
                ...     transformed = transform_data(raw_data)
                ...     validated = validate_data(transformed)

            Nested profiling::

                >>> with profiler.measure_operation("complete_workflow"):
                ...     with profiler.measure_operation("data_load"):
                ...         data = load_data()
                ...     with profiler.measure_operation("data_process"):
                ...         result = process_data(data)

        Note:
            The context manager always executes the finally block, ensuring
            that profiles are recorded even if exceptions occur. The profile
            will still capture execution time and resource usage up to the
            point of failure.

        """
        # Get the current process for memory and CPU monitoring
        # psutil.Process() without arguments gets the current process
        process = psutil.Process()

        # Record initial memory state
        # RSS (Resident Set Size) is the actual physical memory used
        initial_memory = process.memory_info().rss

        # Initialize CPU monitoring
        # First call to cpu_percent() returns 0, subsequent calls return
        # actual usage since last call. This primes the CPU counter.
        process.cpu_percent()

        # Take initial memory snapshot if detailed tracking is enabled
        # This provides a baseline for memory usage analysis
        if self.enable_memory_tracking:
            # Create a snapshot of current memory allocations
            tracemalloc.take_snapshot()

        # Record start time for execution time measurement
        # Uses time.time() for wall-clock time (includes I/O wait time)
        start_time = time.time()

        try:
            # Yield control to the code block being measured
            # This is where the actual operation executes
            yield
        finally:
            # This finally block always executes, even if exceptions occur
            # Ensures we capture performance data even for failed operations

            # Record end time and calculate execution duration
            end_time = time.time()
            execution_time = end_time - start_time

            # Get final memory state after operation completion
            # RSS gives us the actual physical memory used by the process
            final_memory = process.memory_info().rss

            # Get CPU utilization during the operation
            # Returns percentage of CPU time used since last cpu_percent() call
            final_cpu = process.cpu_percent()

            # Calculate memory delta (change in memory usage)
            # Positive values indicate memory allocation
            # Negative values indicate memory deallocation
            memory_delta = final_memory - initial_memory

            # Get peak memory usage if detailed tracking is enabled
            # Use final memory as fallback if tracking is disabled
            memory_peak = final_memory
            if self.enable_memory_tracking:
                # Take final snapshot to capture all allocations
                snapshot = tracemalloc.take_snapshot()

                # Calculate total memory used by summing all allocations
                # Statistics grouped by line number for detailed tracking
                memory_peak = sum(stat.size for stat in snapshot.statistics("lineno"))

            # Create comprehensive performance profile for this operation
            # This captures all metrics collected during the operation
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
            # The lock ensures concurrent profiling doesn't corrupt data
            with self._lock:
                # Add profile to the list of all profiles
                self.profiles.append(profile)

                # Group execution time by operation name for statistics
                self.operation_times[operation_name].append(execution_time)

    def get_operation_stats(self, operation_name: str) -> dict[str, float]:
        """Get statistics for a specific operation.

        This method calculates comprehensive statistics for all executions
        of a specific operation type, including count, total time, average,
        min, max, and median execution times.

        Args:
            operation_name (str): Name of the operation to analyze.

        Returns:
            Dict[str, float]: Dictionary containing operation statistics:
                - count: Number of times operation was executed
                - total_time: Sum of all execution times
                - average_time: Mean execution time
                - min_time: Fastest execution time
                - max_time: Slowest execution time
                - median_time: Median execution time

                Returns empty dict if operation has no recorded executions.

        Example:
            Get statistics for specific operation::

                >>> stats = profiler.get_operation_stats("chart_rendering")
                >>> print(f"Executed {stats['count']} times")
                >>> print(f"Average time: {stats['average_time']:.3f}s")
                >>> print(f"Min time: {stats['min_time']:.3f}s")
                >>> print(f"Max time: {stats['max_time']:.3f}s")
                >>> print(f"Median time: {stats['median_time']:.3f}s")

            Check if operation exists::

                >>> stats = profiler.get_operation_stats("unknown_op")
                >>> if not stats:
                ...     print("Operation not profiled")

        Note:
            The median calculation uses a simple approach that works well
            for most cases. For even-length lists, it returns the lower
            middle value rather than the average of the two middle values.

        """
        # Get list of execution times for this operation
        # Returns empty list if operation name not found
        times = self.operation_times.get(operation_name, [])

        # Return empty dict if no times recorded for this operation
        if not times:
            return {}

        # Calculate and return comprehensive statistics
        return {
            # Count of executions
            "count": len(times),
            # Sum of all execution times
            "total_time": sum(times),
            # Mean execution time
            "average_time": sum(times) / len(times),
            # Fastest execution time
            "min_time": min(times),
            # Slowest execution time
            "max_time": max(times),
            # Median execution time (middle value of sorted list)
            "median_time": sorted(times)[len(times) // 2],
        }

    def identify_bottlenecks(self, threshold_percentile: float = 95.0) -> list[str]:
        """Identify performance bottlenecks based on execution times.

        This method analyzes all profiled operations to identify bottlenecks
        using percentile analysis. Operations whose average execution time
        exceeds the specified percentile threshold are flagged as bottlenecks.

        The default 95th percentile means that operations in the slowest 5%
        are considered bottlenecks.

        Args:
            threshold_percentile (float, optional): Percentile threshold for
                identifying slow operations. Must be between 0 and 100.
                Defaults to 95.0 (slowest 5% of operations).

        Returns:
            List[str]: List of bottleneck descriptions in the format
                "{operation_name}: {average_time:.4f}s average".
                Empty list if no operations are profiled.

        Example:
            Identify default bottlenecks (95th percentile)::

                >>> bottlenecks = profiler.identify_bottlenecks()
                >>> for bottleneck in bottlenecks:
                ...     print(f"Bottleneck: {bottleneck}")

            Use stricter threshold (90th percentile)::

                >>> bottlenecks = profiler.identify_bottlenecks(90.0)

            Use more lenient threshold (99th percentile)::

                >>> bottlenecks = profiler.identify_bottlenecks(99.0)

        Note:
            The method compares average execution times per operation,
            not individual execution times. This helps identify consistently
            slow operations rather than one-off outliers.

        """
        # Return empty list if no profiles have been collected
        if not self.profiles:
            return []

        # Step 1: Calculate threshold value using percentile analysis
        # Collect all execution times from all profiles
        all_times = [p.execution_time for p in self.profiles]

        # Sort times and find value at the specified percentile
        # This gives us the threshold above which operations are bottlenecks
        threshold = sorted(all_times)[int(len(all_times) * threshold_percentile / 100)]

        # Step 2: Group execution times by operation name
        # This allows us to calculate average time per operation type
        operation_stats = defaultdict(list)
        for profile in self.profiles:
            operation_stats[profile.operation_name].append(profile.execution_time)

        # Step 3: Identify operations with average time above threshold
        slow_operations = []
        for op_name, times in operation_stats.items():
            # Calculate average execution time for this operation
            avg_time = sum(times) / len(times)

            # If average exceeds threshold, flag as bottleneck
            if avg_time > threshold:
                # Format bottleneck description with operation name and time
                slow_operations.append(f"{op_name}: {avg_time:.4f}s average")

        # Return list of identified bottlenecks
        return slow_operations

    def generate_recommendations(self) -> list[str]:
        """Generate performance optimization recommendations.

        This method analyzes the collected performance profiles to generate
        actionable optimization recommendations. It examines memory usage,
        execution times, data sizes, and operation patterns to provide
        targeted suggestions.

        The recommendations cover:
            - High memory usage detection
            - Slow operation identification
            - Large dataset handling
            - Repeated operation optimization

        Returns:
            List[str]: List of optimization recommendations. Empty list if
                no operations have been profiled. Each recommendation is
                a complete sentence describing the issue and suggested fix.

        Example:
            Generate and display recommendations::

                >>> recommendations = profiler.generate_recommendations()
                >>> print(f"Found {len(recommendations)} recommendations:")
                >>> for i, rec in enumerate(recommendations, 1):
                ...     print(f"{i}. {rec}")

            Check for specific recommendations::

                >>> recommendations = profiler.generate_recommendations()
                >>> memory_recs = [r for r in recommendations if "memory" in r.lower()]
                >>> caching_recs = [r for r in recommendations if "cach" in r.lower()]

        Note:
            Recommendations are generated based on heuristics and thresholds
            that work well for most applications. You may need to adjust your
            interpretation based on your specific use case and performance
            requirements.

        """
        # Initialize list to store recommendations
        recommendations: list[str] = []

        # Return empty list if no profiles have been collected
        if not self.profiles:
            return recommendations

        # Analysis 1: Check for high memory usage
        # Filter profiles that increased memory (positive delta)
        memory_profiles = [p for p in self.profiles if p.memory_delta > 0]

        if memory_profiles:
            # Calculate average memory increase across operations
            avg_memory_delta = sum(p.memory_delta for p in memory_profiles) / len(memory_profiles)

            # Flag if average memory increase exceeds 100 MB
            if avg_memory_delta > 100 * 1024 * 1024:  # 100MB threshold
                recommendations.append(
                    "High memory usage detected. Consider using lazy loading or chunking."
                )

        # Analysis 2: Check for slow operations using 90th percentile
        # More aggressive than the default 95th percentile for bottlenecks
        slow_operations = self.identify_bottlenecks(90.0)

        if slow_operations:
            # Show up to 3 slowest operations to keep recommendation concise
            top_slow = ", ".join(slow_operations[:3])
            recommendations.append(
                f"Slow operations detected: {top_slow}. Consider optimization or caching."
            )

        # Analysis 3: Check for large dataset processing
        # Filter operations processing more than 10,000 items
        large_data_ops = [p for p in self.profiles if p.data_size and p.data_size > 10000]

        if large_data_ops:
            recommendations.append(
                "Large datasets detected. Consider using vectorized processing "
                "or memory-efficient data classes."
            )

        # Analysis 4: Check for repeated operations
        # Count how many times each operation was executed
        operation_counts: defaultdict[str, int] = defaultdict(int)
        for profile in self.profiles:
            operation_counts[profile.operation_name] += 1

        # Flag operations executed more than 10 times
        repeated_ops = [op for op, count in operation_counts.items() if count > 10]

        if repeated_ops:
            # Show operation names that might benefit from caching
            ops_list = ", ".join(repeated_ops)
            recommendations.append(
                f"Frequent operations detected: {ops_list}. Consider caching or batching."
            )

        # Return all generated recommendations
        return recommendations

    def generate_report(self) -> PerformanceReport:
        r"""Generate comprehensive performance report.

        This method aggregates all collected performance profiles and generates
        a comprehensive report including total metrics, bottleneck analysis,
        and optimization recommendations.

        Returns:
            PerformanceReport: Complete performance report with metrics,
                bottlenecks, and recommendations. Returns a report with zero
                values if no operations have been profiled.

        Example:
            Generate and analyze report::

                >>> report = profiler.generate_report()
                >>> print(f"Operations profiled: {report.total_operations}")
                >>> print(f"Total time: {report.total_execution_time:.2f}s")
                >>> print(f"Average time: {report.average_execution_time:.3f}s")
                >>> print(f"Peak memory: {report.memory_peak_total / 1024 / 1024:.1f} MB")
                >>> print(f"\\nBottlenecks ({len(report.bottlenecks)}):")
                >>> for bottleneck in report.bottlenecks:
                ...     print(f"  - {bottleneck}")
                >>> print(f"\\nRecommendations ({len(report.recommendations)}):")
                >>> for rec in report.recommendations:
                ...     print(f"  - {rec}")

            Export report::

                >>> report = profiler.generate_report()
                >>> with open("report.json", "w") as f:
                ...     json.dump(report.to_dict(), f, indent=2)

        Note:
            The report provides a snapshot of performance at the time it's
            generated. If you continue profiling operations after generating
            a report, you'll need to call generate_report() again to get
            updated metrics.

        """
        # Handle case where no operations have been profiled
        # Return empty report with zero values
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

        # Calculate total execution time across all operations
        total_time = sum(p.execution_time for p in self.profiles)

        # Calculate average execution time per operation
        avg_time = total_time / len(self.profiles)

        # Find peak memory usage across all operations
        # This is the maximum memory used by any single operation
        memory_peak_total = max(p.memory_peak for p in self.profiles)

        # Find current memory usage across all operations
        # This is the maximum current memory at the end of any operation
        memory_current_total = max(p.memory_current for p in self.profiles)

        # Generate bottleneck analysis using default 95th percentile
        bottlenecks = self.identify_bottlenecks()

        # Generate optimization recommendations based on collected data
        recommendations = self.generate_recommendations()

        # Create and return comprehensive performance report
        return PerformanceReport(
            total_operations=len(self.profiles),
            total_execution_time=total_time,
            average_execution_time=avg_time,
            memory_peak_total=memory_peak_total,
            memory_current_total=memory_current_total,
            operations=self.profiles.copy(),  # Copy to prevent external modification
            bottlenecks=bottlenecks,
            recommendations=recommendations,
        )

    def clear_profiles(self) -> None:
        """Clear all stored profiles and reset the profiler.

        This method removes all collected performance profiles and resets
        internal data structures. If memory tracking is enabled, it also
        restarts tracemalloc to clear memory tracking state.

        Use this method when you want to start fresh profiling without
        creating a new profiler instance, or to free memory occupied by
        old profiles.

        Example:
            Clear profiles between test runs::

                >>> profiler = PerformanceProfiler()
                >>> # ... run first batch of operations ...
                >>> report1 = profiler.generate_report()
                >>> profiler.clear_profiles()  # Reset for next batch
                >>> # ... run second batch of operations ...
                >>> report2 = profiler.generate_report()

            Free memory after exporting::

                >>> profiler.export_profiles("report.json")
                >>> profiler.clear_profiles()  # Free memory

        Note:
            This operation is thread-safe and will wait for any ongoing
            profiling operations to complete before clearing data.

            After clearing, the profiler is ready to collect new profiles
            immediately.

        """
        # Use lock to ensure thread-safe clearing
        # Prevents race conditions with concurrent profiling
        with self._lock:
            # Clear all stored operation profiles
            self.profiles.clear()

            # Clear grouped operation times for statistics
            self.operation_times.clear()

            # Clear memory usage snapshots
            self.memory_snapshots.clear()

        # Reset memory tracking if enabled
        # This clears tracemalloc's internal state
        if self.enable_memory_tracking:
            # Stop current memory tracking
            tracemalloc.stop()

            # Restart memory tracking with clean state
            tracemalloc.start()

    def export_profiles(self, filename: str) -> None:
        """Export profiles to a JSON file for analysis.

        This method generates a performance report and exports it to a JSON
        file. The exported data includes all metrics, bottlenecks, and
        recommendations in a format suitable for further analysis or sharing.

        Args:
            filename (str): Path to the output JSON file. Can be relative
                or absolute. Parent directories must exist.

        Example:
            Export to default location::

                >>> profiler.export_profiles("performance_report.json")

            Export to specific directory::

                >>> profiler.export_profiles("/tmp/reports/perf_20240101.json")

            Export with timestamp::

                >>> from datetime import datetime
                >>> timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                >>> profiler.export_profiles(f"perf_{timestamp}.json")

        Note:
            The exported file contains:
                - Total operations count
                - Total and average execution times
                - Peak and current memory usage
                - Count of operations
                - List of bottlenecks
                - List of recommendations

            The file is written with UTF-8 encoding and 2-space indentation
            for readability.

        Raises:
            IOError: If the file cannot be written (e.g., permission denied,
                disk full, parent directory doesn't exist).

        """
        # Generate comprehensive performance report
        report = self.generate_report()

        # Open file for writing with UTF-8 encoding
        # Using Path ensures cross-platform compatibility
        with Path(filename).open("w", encoding="utf-8") as f:
            # Convert report to dict and write as JSON
            # indent=2 makes the output human-readable
            json.dump(report.to_dict(), f, indent=2)

        # Log successful export for debugging
        logger.info("Performance profiles exported to %s", filename)


class MemoryMonitor:
    """Memory usage monitoring and optimization suggestions.

    This class provides memory tracking capabilities with trend analysis
    and optimization suggestions. It monitors memory usage over time to
    detect leaks, analyze trends, and provide actionable recommendations.

    The monitor tracks both RSS (Resident Set Size - actual physical memory)
    and VMS (Virtual Memory Size - total virtual memory) to provide a
    complete picture of memory usage.

    Attributes:
        memory_history (List[Dict[str, float]]): Historical snapshots of
            memory usage with timestamps for trend analysis.
        process (psutil.Process): Process handle for memory monitoring.

    Example:
        Basic memory monitoring::

            >>> monitor = MemoryMonitor()
            >>> monitor.record_memory_snapshot()
            >>> perform_memory_intensive_operation()
            >>> monitor.record_memory_snapshot()
            >>> trend = monitor.get_memory_trend()
            >>> print(f"Memory trend: {trend['trend']}")

        Get optimization suggestions::

            >>> monitor = MemoryMonitor()
            >>> # ... perform operations ...
            >>> suggestions = monitor.suggest_optimizations()
            >>> for suggestion in suggestions:
            ...     print(f"- {suggestion}")

    Note:
        The monitor tracks the current process by default. For monitoring
        other processes, you would need to modify the implementation to
        accept a PID parameter.

    """

    def __init__(self) -> None:
        """Initialize memory monitor.

        Creates a new memory monitor instance that tracks the current process.
        Initializes data structures for storing memory usage history.

        Example:
            >>> monitor = MemoryMonitor()
            >>> usage = monitor.get_memory_usage()
            >>> print(f"Current memory: {usage['rss'] / 1024 / 1024:.1f} MB")

        """
        # Initialize list to store memory usage history
        # Each entry is a dict with memory metrics and timestamp
        self.memory_history: list[dict[str, float]] = []

        # Get handle to current process for memory monitoring
        # psutil.Process() without arguments gets current process
        self.process = psutil.Process()

    def get_memory_usage(self) -> dict[str, float]:
        """Get current memory usage information.

        This method retrieves current memory usage metrics for the monitored
        process, including RSS, VMS, and memory percentage.

        Returns:
            Dict[str, float]: Dictionary containing current memory metrics:
                - rss: Resident Set Size in bytes (physical memory)
                - vms: Virtual Memory Size in bytes (total virtual memory)
                - percent: Memory usage as percentage of system total

        Example:
            Display current memory usage::

                >>> usage = monitor.get_memory_usage()
                >>> print(f"Physical memory: {usage['rss'] / 1024 / 1024:.1f} MB")
                >>> print(f"Virtual memory: {usage['vms'] / 1024 / 1024:.1f} MB")
                >>> print(f"Memory percent: {usage['percent']:.1f}%")

        Note:
            RSS (Resident Set Size) is the actual physical memory used by the
            process. VMS (Virtual Memory Size) includes swapped memory and
            memory-mapped files. Typically RSS is more relevant for performance
            analysis.

        """
        # Get memory info from process
        memory_info = self.process.memory_info()

        # Return dict with memory metrics
        return {
            # Resident Set Size - actual physical memory in bytes
            "rss": float(memory_info.rss),
            # Virtual Memory Size - total virtual memory in bytes
            "vms": float(memory_info.vms),
            # Memory usage as percentage of system total
            "percent": self.process.memory_percent(),
        }

    def record_memory_snapshot(self) -> None:
        """Record current memory usage snapshot.

        This method captures the current memory state and adds it to the
        history for trend analysis. Each snapshot includes RSS, VMS, memory
        percentage, and a timestamp.

        Example:
            Track memory over time::

                >>> monitor = MemoryMonitor()
                >>> monitor.record_memory_snapshot()  # Before
                >>> process_large_dataset()
                >>> monitor.record_memory_snapshot()  # After
                >>> trend = monitor.get_memory_trend()

            Track multiple operations::

                >>> monitor = MemoryMonitor()
                >>> for i in range(10):
                ...     monitor.record_memory_snapshot()
                ...     perform_operation(i)
                >>> # Analyze trend across all operations
                >>> trend = monitor.get_memory_trend()

        Note:
            Snapshots are stored in memory, so excessive snapshot recording
            could itself consume memory. For long-running monitoring, consider
            periodically clearing old snapshots.

        """
        # Get current memory usage metrics
        snapshot = self.get_memory_usage()

        # Add timestamp to snapshot
        # This allows temporal analysis of memory trends
        snapshot["timestamp"] = time.time()

        # Append snapshot to history
        self.memory_history.append(snapshot)

    def get_memory_trend(self) -> dict[str, Any]:
        """Analyze memory usage trend.

        This method analyzes the memory history to determine whether memory
        usage is increasing, decreasing, or stable. It compares the most
        recent snapshot with the oldest snapshot.

        Returns:
            Dict[str, Any]: Dictionary containing trend analysis:
                - trend: "increasing", "decreasing", "stable", or
                  "insufficient_data"
                - rss_change: Change in RSS (bytes). Only if data is sufficient.
                - vms_change: Change in VMS (bytes). Only if data is sufficient.
                - current_rss: Current RSS (bytes). Only if data is sufficient.
                - current_vms: Current VMS (bytes). Only if data is sufficient.

        Example:
            Analyze memory trend::

                >>> monitor = MemoryMonitor()
                >>> # ... record snapshots over time ...
                >>> trend = monitor.get_memory_trend()
                >>> if trend['trend'] == 'increasing':
                ...     mb_increase = trend['rss_change'] / 1024 / 1024
                ...     print(f"Memory increased by {mb_increase:.1f} MB")
                >>> elif trend['trend'] == 'insufficient_data':
                ...     print("Need more snapshots for trend analysis")

        Note:
            Requires at least 2 snapshots for trend analysis. Returns
            "insufficient_data" if fewer than 2 snapshots are recorded.

            The trend is based on RSS (physical memory) rather than VMS,
            as RSS is more directly related to actual memory consumption.

        """
        # Check if we have enough data for trend analysis
        # Need at least 2 snapshots to calculate a trend
        if len(self.memory_history) < 2:
            return {"trend": "insufficient_data"}

        # Get most recent and oldest snapshots for comparison
        recent = self.memory_history[-1]
        older = self.memory_history[0]

        # Calculate change in memory usage
        rss_change = recent["rss"] - older["rss"]
        vms_change = recent["vms"] - older["vms"]

        # Determine trend based on RSS change
        # RSS is more meaningful than VMS for actual memory usage
        if rss_change > 0:
            trend = "increasing"
        elif rss_change < 0:
            trend = "decreasing"
        else:
            trend = "stable"

        # Return comprehensive trend analysis
        return {
            "trend": trend,  # Overall trend direction
            "rss_change": rss_change,  # Change in physical memory
            "vms_change": vms_change,  # Change in virtual memory
            "current_rss": recent["rss"],  # Current physical memory
            "current_vms": recent["vms"],  # Current virtual memory
        }

    def suggest_optimizations(self) -> list[str]:
        """Suggest memory optimizations based on usage patterns.

        This method analyzes memory usage history to identify potential
        issues and provide optimization recommendations. It checks for:
            - High memory usage (> 80% of system memory)
            - Potential memory leaks (large increasing trend)
            - Excessive virtual memory usage (> 2GB)

        Returns:
            List[str]: List of optimization suggestions. Empty list if
                no issues are detected or no history is available. Each
                suggestion is a complete sentence describing the issue
                and recommended action.

        Example:
            Get and display suggestions::

                >>> monitor = MemoryMonitor()
                >>> # ... record snapshots over time ...
                >>> suggestions = monitor.suggest_optimizations()
                >>> if suggestions:
                ...     print("Memory optimization suggestions:")
                ...     for i, suggestion in enumerate(suggestions, 1):
                ...         print(f"{i}. {suggestion}")
                ... else:
                ...     print("No memory issues detected")

        Note:
            Suggestions are based on heuristics and thresholds that work
            well for most applications:
                - 80% memory usage threshold
                - 100MB RSS increase for leak detection
                - 2GB VMS threshold for virtual memory warning

            You may need to adjust your interpretation based on your
            specific application's memory requirements.

        """
        # Initialize list to store suggestions
        suggestions: list[str] = []

        # Return empty list if no history is available
        if not self.memory_history:
            return suggestions

        # Get most recent snapshot for current state analysis
        current = self.memory_history[-1]

        # Get trend analysis for leak detection
        trend = self.get_memory_trend()

        # Check 1: High memory usage detection
        # Flag if process is using more than 80% of system memory
        if current["percent"] > 80:
            suggestions.append(
                "High memory usage detected. Consider using memory-efficient data classes."
            )

        # Check 2: Memory leak detection
        # Flag if memory is increasing AND increase is significant (> 100MB)
        if (
            trend["trend"] == "increasing"
            and trend["rss_change"] > 100 * 1024 * 1024  # 100MB threshold
        ):
            suggestions.append("Potential memory leak detected. Check for unclosed resources.")

        # Check 3: Excessive virtual memory usage
        # Flag if virtual memory exceeds 2GB
        if current["vms"] > 2 * 1024 * 1024 * 1024:  # 2GB threshold
            suggestions.append("Large virtual memory usage. Consider using chunked processing.")

        # Return all generated suggestions
        return suggestions


# Global profiler instance for convenient access throughout the application
# This avoids the need to pass profiler instances around
_global_profiler = PerformanceProfiler()

# Global memory monitor instance for convenient access
# This avoids the need to pass monitor instances around
_memory_monitor = MemoryMonitor()


def get_profiler() -> PerformanceProfiler:
    """Get the global profiler instance.

    Returns the singleton global profiler instance that can be used
    throughout the application for consistent profiling.

    Returns:
        PerformanceProfiler: The global profiler instance.

    Example:
        Use global profiler::

            >>> profiler = get_profiler()
            >>> with profiler.measure_operation("operation"):
            ...     perform_operation()

    """
    return _global_profiler


def get_memory_monitor() -> MemoryMonitor:
    """Get the global memory monitor instance.

    Returns the singleton global memory monitor instance that can be used
    throughout the application for consistent memory tracking.

    Returns:
        MemoryMonitor: The global memory monitor instance.

    Example:
        Use global monitor::

            >>> monitor = get_memory_monitor()
            >>> monitor.record_memory_snapshot()
            >>> perform_operation()
            >>> monitor.record_memory_snapshot()
            >>> trend = monitor.get_memory_trend()

    """
    return _memory_monitor


def profile_function(operation_name: str, data_size: int | None = None):
    """Convenience decorator for profiling functions using global profiler.

    This is a convenience wrapper around the global profiler's
    profile_operation decorator. It allows for easy function profiling
    without explicitly accessing the global profiler.

    Args:
        operation_name (str): Name identifier for the operation.
        data_size (Optional[int], optional): Size of data being processed.
            Defaults to None.

    Returns:
        Callable: Decorator function that profiles the decorated function.

    Example:
        >>> @profile_function("data_transform", data_size=1000)
        ... def transform_data(data):
        ...     return data.apply(transformation)

    """
    return _global_profiler.profile_operation(operation_name, data_size)


@contextmanager
def profile_operation(operation_name: str, data_size: int | None = None):
    """Convenience context manager for profiling using global profiler.

    This is a convenience wrapper around the global profiler's
    measure_operation context manager. It allows for easy code block
    profiling without explicitly accessing the global profiler.

    Args:
        operation_name (str): Name identifier for the operation.
        data_size (Optional[int], optional): Size of data being processed.
            Defaults to None.

    Yields:
        None: Yields control to the measured code block.

    Example:
        >>> with profile_operation("data_processing", data_size=5000):
        ...     processed = process_data(raw_data)

    """
    with _global_profiler.measure_operation(operation_name, data_size):
        yield


def get_performance_summary() -> dict[str, Any]:
    """Get a quick performance summary from global profiler and monitor.

    This convenience function generates a concise performance summary
    combining data from both the global profiler and memory monitor.
    It provides a quick overview of key metrics.

    Returns:
        Dict[str, Any]: Dictionary containing summary metrics:
            - operations: Total number of profiled operations
            - total_time: Cumulative execution time in seconds
            - avg_time: Average execution time per operation in seconds
            - memory_trend: Current memory usage trend (increasing/decreasing/stable)
            - current_memory_mb: Current memory usage in megabytes
            - bottlenecks: Number of identified bottlenecks
            - recommendations: Number of recommendations generated

    Example:
        Display quick summary::

            >>> summary = get_performance_summary()
            >>> print(f"Operations: {summary['operations']}")
            >>> print(f"Total time: {summary['total_time']:.2f}s")
            >>> print(f"Average time: {summary['avg_time']:.3f}s")
            >>> print(f"Memory: {summary['current_memory_mb']:.1f} MB")
            >>> print(f"Trend: {summary['memory_trend']}")
            >>> print(f"Bottlenecks: {summary['bottlenecks']}")
            >>> print(f"Recommendations: {summary['recommendations']}")

    """
    # Generate performance report from global profiler
    report = _global_profiler.generate_report()

    # Get memory trend from global memory monitor
    memory_trend = _memory_monitor.get_memory_trend()

    # Compile and return summary metrics
    return {
        "operations": report.total_operations,
        "total_time": report.total_execution_time,
        "avg_time": report.average_execution_time,
        "memory_trend": memory_trend["trend"],
        "current_memory_mb": memory_trend.get("current_rss", 0) / (1024 * 1024),
        "bottlenecks": len(report.bottlenecks),
        "recommendations": len(report.recommendations),
    }
