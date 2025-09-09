"""
Enhanced test configuration and fixtures for Streamlit Lightweight Charts Pro.

This module provides comprehensive test fixtures, utilities, and configuration
that can be used across all test modules with improved coverage and organization.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
import pytest
from hypothesis import given, strategies as st

# Import modules only when needed to avoid import errors during test discovery
try:
    from streamlit_lightweight_charts_pro.charts.options import (
        ChartOptions,
        LayoutOptions,
        CrosshairOptions,
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
        OhlcvData,
    )
    from streamlit_lightweight_charts_pro.charts.series import (
        AreaSeries,
        BandSeries,
        BarSeries,
        BaselineSeries,
        CandlestickSeries,
        HistogramSeries,
        LineSeries,
    )

    IMPORTS_AVAILABLE = True
except ImportError:
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
    OhlcvData = Any
    AreaSeries = Any
    BandSeries = Any
    BarSeries = Any
    BaselineSeries = Any
    CandlestickSeries = Any
    HistogramSeries = Any
    LineSeries = Any
    LayoutOptions = Any
    CrosshairOptions = Any


# =============================================================================
# Enhanced Test Data Fixtures
# =============================================================================

@pytest.fixture
def sample_timestamps():
    """Generate sample timestamps for testing."""
    base_time = datetime(2023, 1, 1)
    return [base_time + timedelta(hours=i) for i in range(10)]


@pytest.fixture
def sample_values():
    """Generate sample numeric values for testing."""
    return [100 + i * 10 + np.random.randint(-5, 5) for i in range(10)]


@pytest.fixture
def sample_ohlc_data():
    """Generate sample OHLC data for testing."""
    base_price = 100.0
    data = []
    for i in range(10):
        open_price = base_price + i * 2 + np.random.randint(-5, 5)
        high_price = open_price + np.random.randint(1, 10)
        low_price = open_price - np.random.randint(1, 10)
        close_price = open_price + np.random.randint(-5, 5)
        volume = np.random.randint(100, 1000)

        data.append(
            {
                "open": open_price,
                "high": high_price,
                "low": low_price,
                "close": close_price,
                "volume": volume,
            }
        )
    return data


@pytest.fixture
def sample_dataframe():
    """Generate sample DataFrame for testing."""
    dates = pd.date_range("2023-01-01", periods=10, freq="H")
    data = {
        "time": dates,
        "value": [100 + i * 10 + np.random.randint(-5, 5) for i in range(10)],
        "open": [100 + i * 2 + np.random.randint(-5, 5) for i in range(10)],
        "high": [110 + i * 2 + np.random.randint(1, 10) for i in range(10)],
        "low": [90 + i * 2 - np.random.randint(1, 10) for i in range(10)],
        "close": [105 + i * 2 + np.random.randint(-5, 5) for i in range(10)],
        "volume": [np.random.randint(100, 1000) for _ in range(10)],
    }
    return pd.DataFrame(data)


@pytest.fixture
def sample_line_data(sample_timestamps, sample_values):
    """Generate sample line data for testing."""
    if not IMPORTS_AVAILABLE:
        pytest.skip("LineData not available")
    return [
        LineData(time=ts, value=val)
        for ts, val in zip(sample_timestamps, sample_values)
    ]


@pytest.fixture
def sample_candlestick_data(sample_timestamps, sample_ohlc_data):
    """Generate sample candlestick data for testing."""
    if not IMPORTS_AVAILABLE:
        pytest.skip("CandlestickData not available")
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
        """Generate sample area data for testing."""
        return [
            AreaData(time=ts, value=val)
            for ts, val in zip(sample_timestamps, sample_values)
        ]


@pytest.fixture
def sample_histogram_data(sample_timestamps, sample_values):
        """Generate sample histogram data for testing."""
        return [
            HistogramData(time=ts, value=val)
            for ts, val in zip(sample_timestamps, sample_values)
        ]


@pytest.fixture
def sample_bar_data(sample_timestamps, sample_values):
        """Generate sample bar data for testing."""
        return [
            BarData(time=ts, value=val)
            for ts, val in zip(sample_timestamps, sample_values)
        ]


@pytest.fixture
def sample_baseline_data(sample_timestamps, sample_values):
        """Generate sample baseline data for testing."""
        return [
            BaselineData(time=ts, value=val)
            for ts, val in zip(sample_timestamps, sample_values)
        ]


@pytest.fixture
def sample_band_data(sample_timestamps, sample_values):
        """Generate sample band data for testing."""
        return [
            BandData(
                upper=val + 10,
                middle=val,
                lower=val - 10,
            )
            for ts, val in zip(sample_timestamps, sample_values)
        ]


@pytest.fixture
def sample_marker_data(sample_timestamps, sample_values):
        """Generate sample marker data for testing."""
        return [
            Marker(
                time=ts,
                position="aboveBar",
                color="#FF0000",
                shape="arrowDown",
                text=f"Marker {i}",
            )
            for i, (ts, val) in enumerate(zip(sample_timestamps, sample_values))
        ]


# =============================================================================
# Edge Case and Error Testing Fixtures
# =============================================================================

@pytest.fixture
def edge_case_data():
    """Generate edge case data for testing."""
    return {
        "empty_data": [],
        "single_point": [LineData(time=datetime(2023, 1, 1), value=100.0)],
        "duplicate_times": [
            LineData(time=datetime(2023, 1, 1), value=100.0),
            LineData(time=datetime(2023, 1, 1), value=200.0),
        ],
        "nan_values": [
            LineData(time=datetime(2023, 1, 1), value=np.nan),
            LineData(time=datetime(2023, 1, 2), value=200.0),
        ],
        "infinite_values": [
            LineData(time=datetime(2023, 1, 1), value=np.inf),
            LineData(time=datetime(2023, 1, 2), value=-np.inf),
        ],
        "very_large_values": [
            LineData(time=datetime(2023, 1, 1), value=1e15),
            LineData(time=datetime(2023, 1, 2), value=-1e15),
        ],
        "very_small_values": [
            LineData(time=datetime(2023, 1, 1), value=1e-15),
            LineData(time=datetime(2023, 1, 2), value=-1e-15),
        ],
    }


@pytest.fixture
def malformed_data():
    """Generate malformed data for error testing."""
    return {
        "none_values": [None, LineData(time=datetime(2023, 1, 1), value=100.0)],
        "wrong_types": ["invalid", LineData(time=datetime(2023, 1, 1), value=100.0)],
        "missing_attributes": [{"time": datetime(2023, 1, 1)}],
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
    """Generate large dataset for performance testing."""
    n_points = 10000
    base_timestamp = int(datetime(2023, 1, 1).timestamp())
    timestamps = [base_timestamp + i * 60 for i in range(n_points)]  # 60 seconds = 1 minute
    values = np.random.randn(n_points).cumsum() + 100
    
    return [
        LineData(time=ts, value=val)
        for ts, val in zip(timestamps, values)
    ]


@pytest.fixture
def wide_dataset():
    """Generate wide dataset (multiple series) for performance testing."""
    n_points = 1000
    n_series = 100
    base_timestamp = int(datetime(2023, 1, 1).timestamp())
    timestamps = [base_timestamp + i * 3600 for i in range(n_points)]  # 3600 seconds = 1 hour
    
    series_data = []
    for j in range(n_series):
        values = np.random.randn(n_points).cumsum() + 100 + j * 10
        series_data.append([
            LineData(time=ts, value=val)
            for ts, val in zip(timestamps, values)
        ])
    
    return series_data


# =============================================================================
# Chart Configuration Fixtures
# =============================================================================

@pytest.fixture
def basic_chart_options():
    """Generate basic chart options for testing."""
    return ChartOptions(
        height=400,
        width=600,
        layout=LayoutOptions(
            background_color="#FFFFFF",
            text_color="#000000",
        ),
        crosshair=CrosshairOptions(
            mode=1,  # Normal crosshair mode
        ),
    )


@pytest.fixture
def advanced_chart_options():
    """Generate advanced chart options for testing."""
    return ChartOptions(
        height=800,
        width=1200,
        layout=LayoutOptions(
            background_color="#1E1E1E",
            text_color="#FFFFFF",
            font_family="Arial",
            font_size=12,
        ),
        crosshair=CrosshairOptions(
            mode=1,  # Normal crosshair mode
        ),
    )


# =============================================================================
# Test Utility Functions
# =============================================================================

def assert_data_equality(actual: Any, expected: Any, tolerance: float = 1e-10):
    """Assert data equality with tolerance for floating point values."""
    if isinstance(actual, (list, tuple)) and isinstance(expected, (list, tuple)):
        assert len(actual) == len(expected)
        for a, e in zip(actual, expected):
            assert_data_equality(a, e, tolerance)
    elif isinstance(actual, dict) and isinstance(expected, dict):
        assert set(actual.keys()) == set(expected.keys())
        for key in actual:
            assert_data_equality(actual[key], expected[key], tolerance)
    elif isinstance(actual, (float, np.floating)) and isinstance(expected, (float, np.floating)):
        if np.isnan(actual) and np.isnan(expected):
            return  # Both are NaN
        elif np.isnan(actual) or np.isnan(expected):
            assert False, f"NaN mismatch: {actual} vs {expected}"
        else:
            assert abs(actual - expected) <= tolerance, f"Value mismatch: {actual} vs {expected}"
    else:
        assert actual == expected, f"Type/value mismatch: {actual} vs {expected}"


def generate_random_data(
    n_points: int = 100,
    start_date: datetime = None,
    base_value: float = 100.0,
    volatility: float = 0.1,
    trend: float = 0.0,
) -> List[LineData]:
    """Generate random time series data for testing."""
    if not IMPORTS_AVAILABLE:
        pytest.skip("LineData not available")
        
    if start_date is None:
        start_date = datetime(2023, 1, 1)
    
    timestamps = [start_date + timedelta(hours=i) for i in range(n_points)]
    
    # Generate random walk with trend
    np.random.seed(42)  # For reproducible tests
    returns = np.random.normal(trend, volatility, n_points)
    values = base_value * np.exp(np.cumsum(returns))
    
    return [
        LineData(time=ts, value=val)
        for ts, val in zip(timestamps, values)
    ]


def create_test_chart_with_series(series_list: List, options: ChartOptions = None):
    """Create a test chart with the given series."""
    if not IMPORTS_AVAILABLE:
        pytest.skip("Chart not available")
        
    if options is None:
        options = basic_chart_options()
    
    from streamlit_lightweight_charts_pro.charts.chart import Chart
    return Chart(series=series_list, options=options)


# =============================================================================
# Hypothesis Strategies for Property-Based Testing
# =============================================================================

@st.composite
def line_data_strategy(draw):
    """Generate LineData objects for property-based testing."""
    if not IMPORTS_AVAILABLE:
        pytest.skip("LineData not available")
        
    time = draw(st.datetimes())
    value = draw(st.floats(min_value=-1e6, max_value=1e6, allow_nan=False, allow_infinity=False))
    return LineData(time=time, value=value)


@st.composite
def candlestick_data_strategy(draw):
    """Generate CandlestickData objects for property-based testing."""
    if not IMPORTS_AVAILABLE:
        pytest.skip("CandlestickData not available")
        
    time = draw(st.datetimes())
    open_price = draw(st.floats(min_value=0.01, max_value=1e6, allow_nan=False, allow_infinity=False))
    high_price = draw(st.floats(min_value=open_price, max_value=1e6, allow_nan=False, allow_infinity=False))
    low_price = draw(st.floats(min_value=0.01, max_value=open_price, allow_nan=False, allow_infinity=False))
    close_price = draw(st.floats(min_value=0.01, max_value=1e6, allow_nan=False, allow_infinity=False))
    
    return CandlestickData(
        time=time,
        open=open_price,
        high=high_price,
        low=low_price,
        close=close_price,
    )


@st.composite
def chart_options_strategy(draw):
    """Generate ChartOptions objects for property-based testing."""
    if not IMPORTS_AVAILABLE:
        pytest.skip("ChartOptions not available")
        
    height = draw(st.integers(min_value=100, max_value=2000))
    width = draw(st.integers(min_value=100, max_value=2000))
    
    return ChartOptions(
        height=height,
        width=width,
    )


# =============================================================================
# Test Data Validation Functions
# =============================================================================

def validate_data_integrity(data: List[Any]) -> bool:
    """Validate data integrity for testing."""
    if not isinstance(data, list):
        return False
    
    for item in data:
        if not hasattr(item, 'time') or not hasattr(item, 'value'):
            return False
        
        if not isinstance(item.time, datetime):
            return False
        
        if not isinstance(item.value, (int, float, np.number)):
            return False
        
        if np.isnan(item.value) or np.isinf(item.value):
            return False
    
    return True


def validate_series_properties(series: Any) -> bool:
    """Validate series properties for testing."""
    required_attrs = ['data', 'options', 'to_dict', 'asdict']
    
    for attr in required_attrs:
        if not hasattr(series, attr):
            return False
    
    if not isinstance(series.data, list):
        return False
    
    return True


# =============================================================================
# Performance Benchmarking Utilities
# =============================================================================

def benchmark_function(func, *args, **kwargs):
    """Benchmark function execution time."""
    import time
    
    start_time = time.perf_counter()
    result = func(*args, **kwargs)
    end_time = time.perf_counter()
    
    execution_time = (end_time - start_time) * 1000  # Convert to milliseconds
    return result, execution_time


def assert_performance_target(func, *args, max_time_ms: float = 100.0, **kwargs):
    """Assert that function meets performance target."""
    result, execution_time = benchmark_function(func, *args, **kwargs)
    
    assert execution_time <= max_time_ms, (
        f"Function execution time {execution_time:.2f}ms exceeds target {max_time_ms}ms"
    )
    
    return result


# =============================================================================
# Error Testing Utilities
# =============================================================================

def test_error_handling(func, *args, expected_error: type = Exception, **kwargs):
    """Test that function properly handles errors."""
    with pytest.raises(expected_error):
        func(*args, **kwargs)


def test_error_messages(func, *args, expected_error: type, expected_message: str, **kwargs):
    """Test that function raises error with expected message."""
    with pytest.raises(expected_error, match=expected_message):
        func(*args, **kwargs)


# =============================================================================
# Mock and Stub Utilities
# =============================================================================

class MockDataManager:
    """Mock data manager for testing."""
    
    def __init__(self, data: Dict[str, Any] = None):
        self.data = data or {}
    
    def get_data(self, key: str) -> Any:
        return self.data.get(key)
    
    def set_data(self, key: str, value: Any):
        self.data[key] = value


class MockChartRenderer:
    """Mock chart renderer for testing."""
    
    def __init__(self):
        self.render_calls = []
        self.config_calls = []
    
    def render(self, config: Dict[str, Any]):
        self.render_calls.append(config)
    
    def configure(self, options: Dict[str, Any]):
        self.config_calls.append(options)
    
    def get_render_count(self) -> int:
        return len(self.render_calls)
    
    def get_config_count(self) -> int:
        return len(self.config_calls)
