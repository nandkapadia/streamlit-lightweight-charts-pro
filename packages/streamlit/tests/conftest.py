"""Enhanced test configuration and fixtures for Streamlit Lightweight Charts Pro.

This module provides comprehensive test fixtures, utilities, and configuration
that can be used across all test modules with improved coverage and organization.
It includes data generation fixtures, performance testing utilities, error handling
helpers, and mock objects for testing chart functionality.
"""

# Standard imports
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

# Third-party imports
import numpy as np
import pandas as pd
import pytest
from hypothesis import strategies as st

# Local imports
# Import modules only when needed to avoid import errors during test discovery
try:
    from lightweight_charts_core.charts.options import (
        ChartOptions,
        CrosshairOptions,
        LayoutOptions,
    )

    from streamlit_lightweight_charts_pro.data import (
        AreaData,
        BandData,
        BarData,
        BaselineData,
        CandlestickData,
        HistogramData,
        LineData,
        Marker,
    )

    # Set flag to indicate that all imports are available
    IMPORTS_AVAILABLE = True
except ImportError:
    # If imports fail during test discovery, set flag and create dummy classes
    IMPORTS_AVAILABLE = False
    # Create dummy classes for type hints when imports fail
    LineData = Any
    CandlestickData = Any
    ChartOptions = Any
    AreaData = Any
    BandData = Any
    BarData = Any
    BaselineData = Any
    HistogramData = Any
    Marker = Any
    LayoutOptions = Any
    CrosshairOptions = Any


# =============================================================================
# Enhanced Test Data Fixtures
# =============================================================================


@pytest.fixture
def sample_timestamps():
    """Generate sample timestamps for testing.

    Creates a list of datetime objects starting from 2023-01-01 with hourly intervals.
    This fixture is commonly used as a base for creating time-series test data.

    Returns:
        List[datetime]: A list of 10 datetime objects with hourly intervals.
    """
    # Create a base timestamp for consistent test data
    base_time = datetime(2023, 1, 1)
    # Generate timestamps with hourly intervals for realistic time-series data
    return [base_time + timedelta(hours=i) for i in range(10)]


@pytest.fixture
def sample_values():
    """Generate sample numeric values for testing.

    Creates a list of numeric values that simulate price movements with some randomness.
    Values start at 100 and increase by 10 each step with random noise.

    Returns:
        List[float]: A list of 10 numeric values with trend and noise.
    """
    # Generate values with a base trend and random noise for realistic test data
    rng = np.random.default_rng(42)
    return [100 + i * 10 + rng.integers(-5, 5) for i in range(10)]


@pytest.fixture
def sample_ohlc_data():
    """Generate sample OHLC (Open, High, Low, Close) data for testing.

    Creates realistic OHLC data where:
    - Open price starts at a base value with trend and noise
    - High price is always >= Open price
    - Low price is always <= Open price
    - Close price is near Open price with some variation
    - Volume is randomly generated

    Returns:
        List[Dict[str, float]]: List of dictionaries containing OHLC and volume data.
    """
    base_price = 100.0
    data = []
    rng = np.random.default_rng(42)

    # Generate 10 candlesticks with realistic OHLC relationships
    for i in range(10):
        # Calculate open price with trend and noise
        open_price = base_price + i * 2 + rng.integers(-5, 5)

        # High must be >= open price
        high_price = open_price + rng.integers(1, 10)

        # Low must be <= open price
        low_price = open_price - rng.integers(1, 10)

        # Close price varies around open price
        close_price = open_price + rng.integers(-5, 5)

        # Volume is random but realistic
        volume = rng.integers(100, 1000)

        # Create OHLC data structure
        data.append(
            {
                "open": open_price,
                "high": high_price,
                "low": low_price,
                "close": close_price,
                "volume": volume,
            },
        )
    return data


@pytest.fixture
def sample_dataframe():
    """Generate sample DataFrame for testing.

    Creates a pandas DataFrame with multiple columns commonly used in financial data:
    time, value, OHLC prices, and volume. This is useful for testing data processing
    and conversion functions.

    Returns:
        pd.DataFrame: DataFrame with datetime index and financial data columns.
    """
    rng = np.random.default_rng(42)
    # Create datetime range for realistic time-series data
    dates = pd.date_range("2023-01-01", periods=10, freq="h")

    # Build dictionary of sample financial data
    data = {
        "time": dates,
        "value": [100 + i * 10 + rng.integers(-5, 5) for i in range(10)],
        "open": [100 + i * 2 + rng.integers(-5, 5) for i in range(10)],
        "high": [110 + i * 2 + rng.integers(1, 10) for i in range(10)],
        "low": [90 + i * 2 - rng.integers(1, 10) for i in range(10)],
        "close": [105 + i * 2 + rng.integers(-5, 5) for i in range(10)],
        "volume": [rng.integers(100, 1000) for _ in range(10)],
    }
    # Return as pandas DataFrame for testing data processing functions
    return pd.DataFrame(data)


@pytest.fixture
def sample_line_data(sample_timestamps, sample_values):
    """Generate sample line data for testing.

    Creates LineData objects by combining timestamps and values. This fixture
    depends on other fixtures and demonstrates fixture composition.

    Args:
        sample_timestamps: Fixture providing list of datetime objects.
        sample_values: Fixture providing list of numeric values.

    Returns:
        List[LineData]: List of LineData objects for testing line charts.
    """
    # Skip test if LineData class is not available during import
    if not IMPORTS_AVAILABLE:
        pytest.skip("LineData not available")

    # Combine timestamps and values into LineData objects
    return [LineData(time=ts, value=val) for ts, val in zip(sample_timestamps, sample_values)]


@pytest.fixture
def sample_candlestick_data(sample_timestamps, sample_ohlc_data):
    """Generate sample candlestick data for testing.

    Creates CandlestickData objects by combining timestamps with OHLC data.
    This is used for testing candlestick chart functionality.

    Args:
        sample_timestamps: Fixture providing list of datetime objects.
        sample_ohlc_data: Fixture providing OHLC price data.

    Returns:
        List[CandlestickData]: List of CandlestickData objects for testing.
    """
    # Skip test if CandlestickData class is not available during import
    if not IMPORTS_AVAILABLE:
        pytest.skip("CandlestickData not available")

    # Create CandlestickData objects with timestamps and OHLC data
    return [
        CandlestickData(
            time=ts,
            open=data["open"],
            high=data["high"],
            low=data["low"],
            close=data["close"],
        )
        for ts, data in zip(sample_timestamps, sample_ohlc_data)
    ]


@pytest.fixture
def sample_area_data(sample_timestamps, sample_values):
    """Generate sample area data for testing.

    Creates AreaData objects for testing area chart functionality.
    Area charts are similar to line charts but fill the area under the line.

    Args:
        sample_timestamps: Fixture providing list of datetime objects.
        sample_values: Fixture providing list of numeric values.

    Returns:
        List[AreaData]: List of AreaData objects for testing area charts.
    """
    # Create AreaData objects from timestamps and values
    return [AreaData(time=ts, value=val) for ts, val in zip(sample_timestamps, sample_values)]


@pytest.fixture
def sample_histogram_data(sample_timestamps, sample_values):
    """Generate sample histogram data for testing.

    Creates HistogramData objects for testing histogram charts.
    Histograms are often used for volume or frequency data visualization.

    Args:
        sample_timestamps: Fixture providing list of datetime objects.
        sample_values: Fixture providing list of numeric values.

    Returns:
        List[HistogramData]: List of HistogramData objects for testing.
    """
    # Create HistogramData objects from timestamps and values
    return [HistogramData(time=ts, value=val) for ts, val in zip(sample_timestamps, sample_values)]


@pytest.fixture
def sample_bar_data(sample_timestamps, sample_values):
    """Generate sample bar data for testing.

    Creates BarData objects for testing bar chart functionality.
    Bar charts display discrete values as vertical bars.

    Args:
        sample_timestamps: Fixture providing list of datetime objects.
        sample_values: Fixture providing list of numeric values.

    Returns:
        List[BarData]: List of BarData objects for testing bar charts.
    """
    # Create BarData objects from timestamps and values
    return [BarData(time=ts, value=val) for ts, val in zip(sample_timestamps, sample_values)]


@pytest.fixture
def sample_baseline_data(sample_timestamps, sample_values):
    """Generate sample baseline data for testing.

    Creates BaselineData objects for testing baseline charts.
    Baseline charts show values relative to a baseline value.

    Args:
        sample_timestamps: Fixture providing list of datetime objects.
        sample_values: Fixture providing list of numeric values.

    Returns:
        List[BaselineData]: List of BaselineData objects for testing.
    """
    # Create BaselineData objects from timestamps and values
    return [BaselineData(time=ts, value=val) for ts, val in zip(sample_timestamps, sample_values)]


@pytest.fixture
def sample_band_data(sample_timestamps, sample_values):
    """Generate sample band data for testing.

    Creates BandData objects for testing band/ribbon charts.
    Band charts show upper, middle, and lower bounds (e.g., Bollinger Bands).

    Args:
        sample_timestamps: Fixture providing list of datetime objects.
        sample_values: Fixture providing list of numeric values.

    Returns:
        List[BandData]: List of BandData objects for testing band charts.
    """
    # Create BandData with upper, middle, and lower bounds
    return [
        BandData(
            upper=val + 10,  # Upper bound is value + 10
            middle=val,  # Middle line is the actual value
            lower=val - 10,  # Lower bound is value - 10
        )
        for ts, val in zip(sample_timestamps, sample_values)
    ]


@pytest.fixture
def sample_marker_data(sample_timestamps, sample_values):
    """Generate sample marker data for testing.

    Creates Marker objects for testing chart annotations.
    Markers are used to highlight specific points on charts.

    Args:
        sample_timestamps: Fixture providing list of datetime objects.
        sample_values: Fixture providing list of numeric values.

    Returns:
        List[Marker]: List of Marker objects for testing chart annotations.
    """
    # Create markers with various properties for testing
    return [
        Marker(
            time=ts,
            position="aboveBar",  # Position marker above the bar
            color="#FF0000",  # Red color for visibility
            shape="arrowDown",  # Arrow pointing down
            text=f"Marker {i}",  # Text label for the marker
        )
        for i, (ts, val) in enumerate(zip(sample_timestamps, sample_values))
    ]


# =============================================================================
# Edge Case and Error Testing Fixtures
# =============================================================================


@pytest.fixture
def edge_case_data():
    """Generate edge case data for testing.

    Creates various edge cases that might occur in real-world data:
    empty datasets, single points, duplicate timestamps, NaN values, etc.
    This helps ensure robust error handling.

    Returns:
        Dict[str, List]: Dictionary containing different edge case scenarios.
    """
    return {
        # Empty dataset to test handling of no data
        "empty_data": [],
        # Single data point to test minimum data requirements
        "single_point": [LineData(time=datetime(2023, 1, 1), value=100.0)],
        # Duplicate timestamps to test data validation
        "duplicate_times": [
            LineData(time=datetime(2023, 1, 1), value=100.0),
            LineData(time=datetime(2023, 1, 1), value=200.0),
        ],
        # NaN (Not a Number) values to test numeric handling
        "nan_values": [
            LineData(time=datetime(2023, 1, 1), value=np.nan),
            LineData(time=datetime(2023, 1, 2), value=200.0),
        ],
        # Infinite values to test extreme value handling
        "infinite_values": [
            LineData(time=datetime(2023, 1, 1), value=np.inf),
            LineData(time=datetime(2023, 1, 2), value=-np.inf),
        ],
        # Very large values to test numeric precision
        "very_large_values": [
            LineData(time=datetime(2023, 1, 1), value=1e15),
            LineData(time=datetime(2023, 1, 2), value=-1e15),
        ],
        # Very small values to test numeric precision
        "very_small_values": [
            LineData(time=datetime(2023, 1, 1), value=1e-15),
            LineData(time=datetime(2023, 1, 2), value=-1e-15),
        ],
    }


@pytest.fixture
def malformed_data():
    """Generate malformed data for error testing.

    Creates various types of invalid data to test error handling:
    None values, wrong types, missing attributes, invalid timestamps.

    Returns:
        Dict[str, List]: Dictionary containing different malformed data scenarios.
    """
    return {
        # None values mixed with valid data
        "none_values": [None, LineData(time=datetime(2023, 1, 1), value=100.0)],
        # Wrong data types mixed with valid data
        "wrong_types": ["invalid", LineData(time=datetime(2023, 1, 1), value=100.0)],
        # Dictionaries missing required attributes
        "missing_attributes": [{"time": datetime(2023, 1, 1)}],
        # Invalid timestamp formats
        "invalid_timestamps": [
            LineData(time="invalid_time", value=100.0),
            LineData(time=datetime(2023, 1, 1), value=100.0),
        ],
    }


# =============================================================================
# Performance Testing Fixtures
# =============================================================================


@pytest.fixture
def large_dataset():
    """Generate large dataset for performance testing.

    Creates a dataset with 10,000 data points to test performance
    with realistic data volumes. Data simulates a random walk.

    Returns:
        List[LineData]: List of 10,000 LineData objects for performance testing.
    """
    n_points = 10000
    # Create base timestamp as Unix timestamp for efficiency
    base_timestamp = int(datetime(2023, 1, 1).timestamp())

    # Generate timestamps with 1-minute intervals
    timestamps = [base_timestamp + i * 60 for i in range(n_points)]

    # Generate random walk values starting from 100
    rng = np.random.default_rng(42)
    values = rng.standard_normal(n_points).cumsum() + 100

    # Create LineData objects for the large dataset
    return [LineData(time=ts, value=val) for ts, val in zip(timestamps, values)]


@pytest.fixture
def wide_dataset():
    """Generate wide dataset (multiple series) for performance testing.

    Creates 100 different time series with 1000 points each to test
    performance with multiple series rendering and processing.

    Returns:
        List[List[LineData]]: List of 100 series, each containing 1000 data points.
    """
    n_points = 1000
    n_series = 100
    # Create base timestamp with hourly intervals
    base_timestamp = int(datetime(2023, 1, 1).timestamp())
    timestamps = [base_timestamp + i * 3600 for i in range(n_points)]

    series_data = []
    # Generate multiple series with different base values
    rng = np.random.default_rng(42)
    for j in range(n_series):
        # Each series has a different base value (100 + j * 10)
        values = rng.standard_normal(n_points).cumsum() + 100 + j * 10
        # Create LineData objects for this series
        series_data.append([LineData(time=ts, value=val) for ts, val in zip(timestamps, values)])

    return series_data


# =============================================================================
# Chart Configuration Fixtures
# =============================================================================


@pytest.fixture
def basic_chart_options():
    """Generate basic chart options for testing.

    Creates simple chart configuration with standard dimensions
    and basic styling options.

    Returns:
        ChartOptions: Basic chart configuration for testing.
    """
    return ChartOptions(
        height=400,  # Standard height for testing
        width=600,  # Standard width for testing
        layout=LayoutOptions(
            background_color="#FFFFFF",  # White background
            text_color="#000000",  # Black text
        ),
        crosshair=CrosshairOptions(
            mode=1,  # Normal crosshair mode for user interaction
        ),
    )


@pytest.fixture
def advanced_chart_options():
    """Generate advanced chart options for testing.

    Creates sophisticated chart configuration with larger dimensions,
    dark theme, and custom font settings.

    Returns:
        ChartOptions: Advanced chart configuration for testing.
    """
    return ChartOptions(
        height=800,  # Larger height for advanced testing
        width=1200,  # Larger width for advanced testing
        layout=LayoutOptions(
            background_color="#1E1E1E",  # Dark background
            text_color="#FFFFFF",  # White text for dark theme
            font_family="Arial",  # Custom font family
            font_size=12,  # Custom font size
        ),
        crosshair=CrosshairOptions(
            mode=1,  # Normal crosshair mode
        ),
    )


# =============================================================================
# Test Utility Functions
# =============================================================================


def assert_data_equality(actual: Any, expected: Any, tolerance: float = 1e-10):
    """Assert data equality with tolerance for floating point values.

    Recursively compares data structures and handles floating point comparison
    with tolerance. Supports lists, tuples, dictionaries, and numeric values.

    Args:
        actual: The actual value to compare.
        expected: The expected value to compare against.
        tolerance: Tolerance for floating point comparison (default: 1e-10).

    Raises:
        AssertionError: If values don't match within tolerance.
    """
    # Handle list and tuple comparison recursively
    if isinstance(actual, (list, tuple)) and isinstance(expected, (list, tuple)):
        assert len(actual) == len(expected)
        # Compare each element recursively
        for a, e in zip(actual, expected):
            assert_data_equality(a, e, tolerance)

    # Handle dictionary comparison recursively
    elif isinstance(actual, dict) and isinstance(expected, dict):
        assert set(actual.keys()) == set(expected.keys())
        # Compare each key-value pair recursively
        for key in actual:
            assert_data_equality(actual[key], expected[key], tolerance)

    # Handle floating point comparison with tolerance
    elif isinstance(actual, (float, np.floating)) and isinstance(expected, (float, np.floating)):
        if np.isnan(actual) and np.isnan(expected):
            return  # Both are NaN, which is considered equal
        if np.isnan(actual) or np.isnan(expected):
            raise AssertionError()
        # Compare with tolerance for floating point precision
        assert abs(actual - expected) <= tolerance, f"Value mismatch: {actual} vs {expected}"

    # Handle exact equality for all other types
    else:
        assert actual == expected, f"Type/value mismatch: {actual} vs {expected}"


def generate_random_data(
    n_points: int = 100,
    start_date: Optional[datetime] = None,
    base_value: float = 100.0,
    volatility: float = 0.1,
    trend: float = 0.0,
) -> List[LineData]:
    """Generate random time series data for testing.

    Creates realistic time series data using a random walk with optional trend.
    Useful for testing with various data characteristics.

    Args:
        n_points: Number of data points to generate (default: 100).
        start_date: Starting date for the time series (default: 2023-01-01).
        base_value: Initial value for the series (default: 100.0).
        volatility: Standard deviation of random returns (default: 0.1).
        trend: Mean return per period (default: 0.0).

    Returns:
        List[LineData]: Generated time series data.

    Raises:
        pytest.Skip: If LineData is not available during import.
    """
    # Skip test if LineData class is not available
    if not IMPORTS_AVAILABLE:
        pytest.skip("LineData not available")

    # Use default start date if none provided
    if start_date is None:
        start_date = datetime(2023, 1, 1)

    # Generate timestamps with hourly intervals
    timestamps = [start_date + timedelta(hours=i) for i in range(n_points)]

    # Set random seed for reproducible test results
    rng = np.random.default_rng(42)

    # Generate random returns with specified trend and volatility
    returns = rng.normal(trend, volatility, n_points)

    # Convert returns to price levels using cumulative sum and exponential
    values = base_value * np.exp(np.cumsum(returns))

    # Create LineData objects from timestamps and values
    return [LineData(time=ts, value=val) for ts, val in zip(timestamps, values)]


def create_test_chart_with_series(series_list: List, options: ChartOptions = None):
    """Create a test chart with the given series.

    Utility function to create charts for testing with specified series
    and options. Uses basic options if none provided.

    Args:
        series_list: List of series objects to add to the chart.
        options: Chart options to use (default: basic_chart_options).

    Returns:
        Chart: Chart object configured with the provided series and options.

    Raises:
        pytest.Skip: If Chart class is not available during import.
    """
    # Skip test if chart functionality is not available
    if not IMPORTS_AVAILABLE:
        pytest.skip("Chart not available")

    # Use basic options if none provided
    if options is None:
        options = basic_chart_options()

    # Import Chart class locally to avoid import errors
    from streamlit_lightweight_charts_pro.charts.chart import Chart

    # Create and return chart with specified series and options
    return Chart(series=series_list, options=options)


# =============================================================================
# Hypothesis Strategies for Property-Based Testing
# =============================================================================


@st.composite
def line_data_strategy(draw):
    """Generate LineData objects for property-based testing.

    Creates random LineData objects with valid timestamps and values
    for property-based testing using Hypothesis framework.

    Args:
        draw: Hypothesis draw function for generating random values.

    Returns:
        LineData: Randomly generated LineData object.

    Raises:
        pytest.Skip: If LineData is not available during import.
    """
    # Skip test if LineData class is not available
    if not IMPORTS_AVAILABLE:
        pytest.skip("LineData not available")

    # Generate random datetime object
    time = draw(st.datetimes())

    # Generate random value within reasonable bounds, excluding NaN and infinity
    value = draw(st.floats(min_value=-1e6, max_value=1e6, allow_nan=False, allow_infinity=False))

    # Return LineData object with generated values
    return LineData(time=time, value=value)


@st.composite
def candlestick_data_strategy(draw):
    """Generate CandlestickData objects for property-based testing.

    Creates random CandlestickData objects with valid OHLC relationships
    (High >= Open, Low <= Open) for property-based testing.

    Args:
        draw: Hypothesis draw function for generating random values.

    Returns:
        CandlestickData: Randomly generated CandlestickData object.

    Raises:
        pytest.Skip: If CandlestickData is not available during import.
    """
    # Skip test if CandlestickData class is not available
    if not IMPORTS_AVAILABLE:
        pytest.skip("CandlestickData not available")

    # Generate random datetime object
    time = draw(st.datetimes())

    # Generate open price within reasonable bounds
    open_price = draw(
        st.floats(min_value=0.01, max_value=1e6, allow_nan=False, allow_infinity=False),
    )

    # High price must be >= open price
    high_price = draw(
        st.floats(min_value=open_price, max_value=1e6, allow_nan=False, allow_infinity=False),
    )

    # Low price must be <= open price
    low_price = draw(
        st.floats(min_value=0.01, max_value=open_price, allow_nan=False, allow_infinity=False),
    )

    # Close price can be any valid value
    close_price = draw(
        st.floats(min_value=0.01, max_value=1e6, allow_nan=False, allow_infinity=False),
    )

    # Return CandlestickData with proper OHLC relationships
    return CandlestickData(
        time=time,
        open=open_price,
        high=high_price,
        low=low_price,
        close=close_price,
    )


@st.composite
def chart_options_strategy(draw):
    """Generate ChartOptions objects for property-based testing.

    Creates random ChartOptions objects with reasonable dimensions
    for property-based testing of chart configuration.

    Args:
        draw: Hypothesis draw function for generating random values.

    Returns:
        ChartOptions: Randomly generated ChartOptions object.

    Raises:
        pytest.Skip: If ChartOptions is not available during import.
    """
    # Skip test if ChartOptions class is not available
    if not IMPORTS_AVAILABLE:
        pytest.skip("ChartOptions not available")

    # Generate reasonable chart dimensions
    height = draw(st.integers(min_value=100, max_value=2000))
    width = draw(st.integers(min_value=100, max_value=2000))

    # Return ChartOptions with generated dimensions
    return ChartOptions(
        height=height,
        width=width,
    )


# =============================================================================
# Test Data Validation Functions
# =============================================================================


def validate_data_integrity(data: List[Any]) -> bool:
    """Validate data integrity for testing.

    Checks that data list contains valid objects with required attributes
    and that numeric values are finite (not NaN or infinite).

    Args:
        data: List of data objects to validate.

    Returns:
        bool: True if all data is valid, False otherwise.
    """
    # Check that input is a list
    if not isinstance(data, list):
        return False

    # Validate each data item
    for item in data:
        # Check for required attributes
        if not hasattr(item, "time") or not hasattr(item, "value"):
            return False

        # Validate timestamp type
        if not isinstance(item.time, datetime):
            return False

        # Validate value type
        if not isinstance(item.value, (int, float, np.number)):
            return False

        # Check for invalid numeric values
        if np.isnan(item.value) or np.isinf(item.value):
            return False

    return True


def validate_series_properties(series: Any) -> bool:
    """Validate series properties for testing.

    Checks that series object has all required attributes and methods
    for proper chart functionality.

    Args:
        series: Series object to validate.

    Returns:
        bool: True if series has all required properties, False otherwise.
    """
    # List of required attributes for a valid series
    required_attrs = ["data", "options", "to_dict", "asdict"]

    # Check that all required attributes exist
    for attr in required_attrs:
        if not hasattr(series, attr):
            return False

    # Validate that data attribute is a list
    return isinstance(series.data, list)


# =============================================================================
# Performance Benchmarking Utilities
# =============================================================================


def benchmark_function(func, *args, **kwargs):
    """Benchmark function execution time.

    Measures the execution time of a function call with high precision
    using performance counter. Useful for performance regression testing.

    Args:
        func: Function to benchmark.
        *args: Positional arguments to pass to the function.
        **kwargs: Keyword arguments to pass to the function.

    Returns:
        tuple: (result, execution_time_ms) where result is the function return
               value and execution_time_ms is the time in milliseconds.
    """
    # Record start time with high precision
    start_time = time.perf_counter()

    # Execute the function with provided arguments
    result = func(*args, **kwargs)

    # Record end time
    end_time = time.perf_counter()

    # Calculate execution time in milliseconds
    execution_time = (end_time - start_time) * 1000

    return result, execution_time


def assert_performance_target(func, *args, max_time_ms: float = 100.0, **kwargs):
    """Assert that function meets performance target.

    Executes function and verifies that execution time is within acceptable limits.
    Useful for performance regression testing.

    Args:
        func: Function to benchmark.
        *args: Positional arguments to pass to the function.
        max_time_ms: Maximum allowed execution time in milliseconds (default: 100.0).
        **kwargs: Keyword arguments to pass to the function.

    Returns:
        Any: The result of the function call.

    Raises:
        AssertionError: If execution time exceeds the maximum allowed time.
    """
    # Benchmark the function execution
    result, execution_time = benchmark_function(func, *args, **kwargs)

    # Assert that execution time meets the performance target
    assert (
        execution_time <= max_time_ms
    ), f"Function execution time {execution_time:.2f}ms exceeds target {max_time_ms}ms"

    return result


# =============================================================================
# Error Testing Utilities
# =============================================================================


def test_error_handling(func, *args, expected_error: type = Exception, **kwargs):
    """Test that function properly handles errors.

    Verifies that a function raises the expected exception type when called
    with the provided arguments. Useful for testing error conditions.

    Args:
        func: Function to test.
        *args: Positional arguments to pass to the function.
        expected_error: Expected exception type (default: Exception).
        **kwargs: Keyword arguments to pass to the function.

    Raises:
        AssertionError: If the function doesn't raise the expected error.
    """
    # Use pytest.raises to verify the expected exception is raised
    with pytest.raises(expected_error):
        func(*args, **kwargs)


def test_error_messages(func, *args, expected_error: type, expected_message: str, **kwargs):
    """Test that function raises error with expected message.

    Verifies that a function raises the expected exception type with a message
    that matches the provided pattern.

    Args:
        func: Function to test.
        *args: Positional arguments to pass to the function.
        expected_error: Expected exception type.
        expected_message: Expected error message pattern (regex supported).
        **kwargs: Keyword arguments to pass to the function.

    Raises:
        AssertionError: If the function doesn't raise the expected error with the expected message.
    """
    # Use pytest.raises with message matching to verify both exception type and message
    with pytest.raises(expected_error, match=expected_message):
        func(*args, **kwargs)


# =============================================================================
# Mock and Stub Utilities
# =============================================================================


class MockDataManager:
    """Mock data manager for testing.

    Simple mock object that simulates a data manager for testing purposes.
    Provides basic get/set functionality for test data storage.

    Attributes:
        data: Dictionary storing the mock data.
    """

    def __init__(self, data: Optional[Dict[str, Any]] = None):
        """Initialize the mock data manager.

        Args:
            data: Initial data dictionary (default: empty dict).
        """
        # Initialize data storage with provided data or empty dict
        self.data = data or {}

    def get_data(self, key: str) -> Any:
        """Get data by key.

        Args:
            key: Key to retrieve data for.

        Returns:
            Any: The data associated with the key, or None if not found.
        """
        # Return data for the specified key
        return self.data.get(key)

    def set_data(self, key: str, value: Any):
        """Set data for a key.

        Args:
            key: Key to store data under.
            value: Value to store.
        """
        # Store value under the specified key
        self.data[key] = value


class MockChartRenderer:
    """Mock chart renderer for testing.

    Mock object that simulates chart rendering functionality for testing.
    Tracks method calls for verification in tests.

    Attributes:
        render_calls: List of render method calls.
        config_calls: List of configure method calls.
    """

    def __init__(self):
        """Initialize the mock chart renderer."""
        # Initialize call tracking lists
        self.render_calls = []
        self.config_calls = []

    def render(self, config: Dict[str, Any]):
        """Mock render method.

        Args:
            config: Configuration dictionary for rendering.
        """
        # Track the render call for test verification
        self.render_calls.append(config)

    def configure(self, options: Dict[str, Any]):
        """Mock configure method.

        Args:
            options: Options dictionary for configuration.
        """
        # Track the configure call for test verification
        self.config_calls.append(options)

    def get_render_count(self) -> int:
        """Get the number of render calls.

        Returns:
            int: Number of times render was called.
        """
        # Return count of render method calls
        return len(self.render_calls)

    def get_config_count(self) -> int:
        """Get the number of configure calls.

        Returns:
            int: Number of times configure was called.
        """
        # Return count of configure method calls
        return len(self.config_calls)
