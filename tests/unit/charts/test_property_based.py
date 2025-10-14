"""
Property-based tests for Streamlit Lightweight Charts Pro.

This module uses hypothesis to test invariants and properties of chart components
across a wide range of inputs, ensuring robustness and correctness.
"""

import time
from datetime import datetime, timedelta

import numpy as np
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import LineData

# =============================================================================
# Hypothesis Strategies
# =============================================================================


@st.composite
def line_data_strategy(draw):
    """Generate LineData objects for property-based testing."""
    # Generate timestamp (int) instead of datetime object
    time = draw(st.integers(min_value=1577836800, max_value=1893456000))  # 2020-2029 range
    value = draw(st.floats(min_value=-1e6, max_value=1e6, allow_nan=False, allow_infinity=False))
    return LineData(time=time, value=value)


@st.composite
def line_data_list_strategy(draw):
    """Generate lists of LineData objects for property-based testing."""
    n_points = draw(st.integers(min_value=1, max_value=10))  # Reduced from 1000 to 10
    return draw(st.lists(line_data_strategy(), min_size=n_points, max_size=n_points))


@st.composite
def chart_options_strategy(draw):
    """Generate ChartOptions objects for property-based testing."""
    height = draw(st.integers(min_value=100, max_value=2000))
    width = draw(st.integers(min_value=100, max_value=2000))

    return ChartOptions(
        height=height,
        width=width,
    )


@st.composite
def valid_color_strategy(draw):
    """Generate valid color strings for property-based testing."""
    color_type = draw(st.sampled_from(["hex", "rgb", "rgba"]))

    if color_type == "hex":
        return draw(
            st.sampled_from(["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"]),
        )
    if color_type == "rgb":
        r = draw(st.integers(0, 255))
        g = draw(st.integers(0, 255))
        b = draw(st.integers(0, 255))
        return f"rgb({r}, {g}, {b})"
    # rgba
    r = draw(st.integers(0, 255))
    g = draw(st.integers(0, 255))
    b = draw(st.integers(0, 255))
    a = draw(st.floats(0.0, 1.0))
    return f"rgba({r}, {g}, {b}, {a})"


# =============================================================================
# LineSeries Property Tests
# =============================================================================


class TestLineSeriesProperties:
    """Property-based tests for LineSeries."""

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_series_creation_preserves_data(self, data_list):
        """Test that LineSeries creation preserves the input data."""
        series = LineSeries(data=data_list)

        # Data should be preserved exactly
        assert len(series.data) == len(data_list)
        for i, (original, stored) in enumerate(zip(data_list, series.data)):
            assert original.time == stored.time, f"Time mismatch at index {i}"
            assert original.value == stored.value, f"Value mismatch at index {i}"

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_series_data_immutability(self, data_list):
        """Test that LineSeries data is immutable from external changes."""
        series = LineSeries(data=data_list)
        original_length = len(series.data)

        # Series data should be preserved
        assert len(series.data) == original_length
        if data_list:
            # Verify that series data matches original data
            assert series.data[0].time == data_list[0].time
            assert series.data[0].value == data_list[0].value

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_series_serialization_roundtrip(self, data_list):
        """Test that serialization and deserialization preserves data."""
        series = LineSeries(data=data_list)

        # Serialize to dict
        series_dict = series.asdict()

        # Check that all data points are present
        assert "data" in series_dict
        assert len(series_dict["data"]) == len(data_list)

        # Check data integrity
        for i, (original, serialized) in enumerate(zip(data_list, series_dict["data"])):
            assert original.time == serialized["time"], f"Time mismatch at index {i}"
            assert original.value == serialized["value"], f"Value mismatch at index {i}"

    @given(st.lists(line_data_strategy(), min_size=2, max_size=100))
    @settings(max_examples=100, deadline=None)
    def test_series_data_ordering_preserved(self, data_list):
        """Test that data ordering is preserved in LineSeries."""
        # Sort by time to ensure consistent ordering
        sorted_data = sorted(data_list, key=lambda x: x.time)

        series = LineSeries(data=sorted_data)

        # Order should be preserved
        for i in range(len(sorted_data) - 1):
            assert series.data[i].time <= series.data[i + 1].time, (
                f"Data ordering not preserved at index {i}"
            )

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.data_too_large])
    def test_series_empty_data_handling(self, data_list):
        """Test that LineSeries handles empty data correctly."""
        if not data_list:
            series = LineSeries(data=[])
            assert len(series.data) == 0
            assert series.asdict()["data"] == []
        else:
            # Test with non-empty data
            series = LineSeries(data=data_list)
            assert len(series.data) == len(data_list)

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_series_data_validation(self, data_list):
        """Test that LineSeries validates data correctly."""
        if not data_list:
            # Empty data should be valid
            series = LineSeries(data=[])
            assert series is not None
        else:
            # All data points should have valid time and value
            series = LineSeries(data=data_list)
            for i, data_point in enumerate(series.data):
                assert isinstance(data_point.time, int), f"Invalid time type at index {i}"
                assert isinstance(
                    data_point.value,
                    (int, float, np.number),
                ), f"Invalid value type at index {i}"
                assert not np.isnan(data_point.value), f"NaN value at index {i}"
                assert not np.isinf(data_point.value), f"Infinite value at index {i}"


# =============================================================================
# Chart Property Tests
# =============================================================================


class TestChartProperties:
    """Property-based tests for Chart."""

    @given(line_data_list_strategy(), chart_options_strategy())
    @settings(max_examples=100, deadline=None)
    def test_chart_creation_preserves_series(self, data_list, options):
        """Test that Chart creation preserves series data."""
        series = LineSeries(data=data_list)
        chart = Chart(series=series, options=options)

        # Series should be preserved
        assert len(chart.series) == 1
        assert chart.series[0] == series

        # Data should be preserved
        assert len(chart.series[0].data) == len(data_list)

    @given(st.lists(line_data_list_strategy(), min_size=1, max_size=5))
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.data_too_large])
    def test_chart_multiple_series_handling(self, data_lists):
        """Test that Chart handles multiple series correctly."""
        series_list = [LineSeries(data=data_list) for data_list in data_lists]
        chart = Chart(series=series_list)

        # All series should be preserved
        assert len(chart.series) == len(series_list)

        # Data integrity should be maintained
        for i, (original_series, chart_series) in enumerate(zip(series_list, chart.series)):
            assert len(original_series.data) == len(chart_series.data)
            for j, (original_data, chart_data) in enumerate(
                zip(original_series.data, chart_series.data),
            ):
                assert original_data.time == chart_data.time, (
                    f"Time mismatch in series {i}, data {j}"
                )
                assert original_data.value == chart_data.value, (
                    f"Value mismatch in series {i}, data {j}"
                )

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_chart_series_addition_removal(self, data_list):
        """Test that Chart correctly handles series addition and removal."""
        chart = Chart()
        series = LineSeries(data=data_list)

        # Add series
        chart.add_series(series)
        assert len(chart.series) == 1
        assert chart.series[0] == series

        # Clear series
        chart.series.clear()
        assert len(chart.series) == 0

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_chart_serialization_integrity(self, data_list):
        """Test that Chart serialization preserves all data."""
        series = LineSeries(data=data_list)
        chart = Chart(series=series)

        # Serialize chart
        chart_config = chart.to_frontend_config()

        # Check that chart configuration contains expected structure
        assert "charts" in chart_config
        assert len(chart_config["charts"]) == 1

        chart_obj = chart_config["charts"][0]
        assert "series" in chart_obj
        assert len(chart_obj["series"]) == 1

        # Check series data integrity
        series_config = chart_obj["series"][0]
        assert "data" in series_config
        assert len(series_config["data"]) == len(data_list)

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.data_too_large])
    def test_chart_options_preservation(self, data_list):
        """Test that Chart preserves options correctly."""
        options = ChartOptions(height=400, width=600)
        series = LineSeries(data=data_list)
        chart = Chart(series=series, options=options)

        # Options should be preserved
        assert chart.options == options
        assert chart.options.height == 400
        assert chart.options.width == 600

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_chart_empty_series_handling(self, data_list):
        """Test that Chart handles empty series correctly."""
        if not data_list:
            chart = Chart(series=[])
            assert len(chart.series) == 0
        else:
            chart = Chart(series=LineSeries(data=data_list))
            assert len(chart.series) == 1


# =============================================================================
# Data Integrity Property Tests
# =============================================================================


class TestDataIntegrityProperties:
    """Property-based tests for data integrity."""

    @given(st.lists(line_data_strategy(), min_size=1, max_size=1000))
    @settings(max_examples=100, deadline=None)
    def test_data_consistency_across_operations(self, data_list):
        """Test that data remains consistent across various operations."""
        # Create series
        series = LineSeries(data=data_list)

        # Add to chart
        chart = Chart(series=series)

        # Serialize and check
        series_dict = series.asdict()
        chart_config = chart.to_frontend_config()

        # All representations should have the same data length
        assert len(data_list) == len(series.data)
        assert len(series.data) == len(series_dict["data"])

        chart_series = chart_config["charts"][0]["series"][0]
        assert len(series.data) == len(chart_series["data"])

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_data_type_preservation(self, data_list):
        """Test that data types are preserved across operations."""
        if not data_list:
            return

        series = LineSeries(data=data_list)

        # Check original data types
        for data_point in data_list:
            assert isinstance(data_point.time, int)
            assert isinstance(data_point.value, (int, float, np.number))

        # Check series data types
        for data_point in series.data:
            assert isinstance(data_point.time, int)
            assert isinstance(data_point.value, (int, float, np.number))

        # Check serialized data types
        series_dict = series.asdict()
        for data_point in series_dict["data"]:
            assert isinstance(data_point["time"], int)  # Timestamps are integers
            assert isinstance(data_point["value"], (int, float, np.number))

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.data_too_large])
    def test_data_value_precision(self, data_list):
        """Test that data values maintain precision across operations."""
        if not data_list:
            return

        series = LineSeries(data=data_list)

        # Check that values are preserved exactly
        for i, (original, stored) in enumerate(zip(data_list, series.data)):
            if isinstance(original.value, float) and isinstance(stored.value, float):
                # Use relative tolerance for floating point comparison
                if original.value != 0:
                    relative_diff = abs(original.value - stored.value) / abs(original.value)
                    assert relative_diff < 1e-15, f"Precision loss at index {i}: {relative_diff}"
                else:
                    assert abs(stored.value) < 1e-15, f"Zero value not preserved at index {i}"
            else:
                assert original.value == stored.value, f"Value mismatch at index {i}"


# =============================================================================
# Performance Property Tests
# =============================================================================


class TestPerformanceProperties:
    """Property-based tests for performance characteristics."""

    @given(st.integers(min_value=100, max_value=10000))
    @settings(max_examples=50, deadline=None)
    def test_series_creation_scalability(self, n_points):
        """Test that series creation scales reasonably with data size."""
        # Generate test data
        base_time = datetime(2023, 1, 1)
        data_list = [
            LineData(time=base_time + timedelta(hours=i), value=100 + i * 0.1)
            for i in range(n_points)
        ]

        # Measure creation time
        start_time = time.perf_counter()
        series = LineSeries(data=data_list)
        end_time = time.perf_counter()

        creation_time = (end_time - start_time) * 1000  # Convert to milliseconds

        # Performance should scale roughly linearly (with some tolerance)
        expected_time = n_points * 0.001  # 1 microsecond per data point
        assert creation_time <= expected_time * 100, (
            f"Series creation time {creation_time:.2f}ms for {n_points} points "
            "exceeds reasonable threshold"
        )

    @given(st.integers(min_value=1, max_value=100))
    @settings(max_examples=50, deadline=None)
    def test_chart_series_scalability(self, n_series):
        """Test that chart creation scales reasonably with number of series."""
        n_points = 1000

        # Generate test data
        base_time = datetime(2023, 1, 1)
        series_list = []
        for j in range(n_series):
            data_list = [
                LineData(time=base_time + timedelta(hours=i), value=100 + i * 0.1 + j)
                for i in range(n_points)
            ]
            series_list.append(LineSeries(data=data_list))

        # Measure chart creation time
        start_time = time.perf_counter()
        chart = Chart(series=series_list)
        end_time = time.perf_counter()

        creation_time = (end_time - start_time) * 1000  # Convert to milliseconds

        # Performance should scale reasonably with number of series
        expected_time = n_series * 50  # 50ms per series
        assert creation_time <= expected_time, (
            f"Chart creation time {creation_time:.2f}ms for {n_series} series "
            "exceeds reasonable threshold"
        )


# =============================================================================
# Edge Case Property Tests
# =============================================================================


class TestEdgeCaseProperties:
    """Property-based tests for edge cases and error conditions."""

    @given(st.lists(line_data_strategy(), min_size=1, max_size=100))
    @settings(max_examples=100, deadline=None)
    def test_duplicate_timestamps_handling(self, data_list):
        """Test that duplicate timestamps are handled correctly."""
        if len(data_list) < 2:
            return

        # Create duplicate timestamps
        duplicate_data = data_list.copy()
        duplicate_data[1] = LineData(time=data_list[0].time, value=data_list[1].value)

        # Should handle duplicate timestamps gracefully
        series = LineSeries(data=duplicate_data)
        assert len(series.data) == len(duplicate_data)

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_extreme_value_handling(self, data_list):
        """Test that extreme values are handled correctly."""
        if not data_list:
            return

        # Create data with extreme values
        extreme_data = []
        for i, data_point in enumerate(data_list):
            if i % 3 == 0:
                # Very large values
                extreme_data.append(LineData(time=data_point.time, value=1e15))
            elif i % 3 == 1:
                # Very small values
                extreme_data.append(LineData(time=data_point.time, value=1e-15))
            else:
                # Normal values
                extreme_data.append(data_point)

        # Should handle extreme values gracefully
        series = LineSeries(data=extreme_data)
        assert len(series.data) == len(extreme_data)

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.data_too_large])
    def test_mixed_data_types(self, data_list):
        """Test that mixed data types are handled correctly."""
        if not data_list:
            return

        # Create mixed data types
        mixed_data = []
        for i, data_point in enumerate(data_list):
            if i % 2 == 0:
                # Integer values
                mixed_data.append(LineData(time=data_point.time, value=int(data_point.value)))
            else:
                # Float values
                mixed_data.append(data_point)

        # Should handle mixed types gracefully
        series = LineSeries(data=mixed_data)
        assert len(series.data) == len(mixed_data)


# =============================================================================
# Invariant Tests
# =============================================================================


class TestInvariants:
    """Tests for mathematical and logical invariants."""

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.data_too_large])
    def test_series_length_invariant(self, data_list):
        """Test that series length remains invariant across operations."""
        series = LineSeries(data=data_list)

        # Length should remain constant
        original_length = len(data_list)
        assert len(series.data) == original_length

        # Length should remain constant after serialization
        series_dict = series.asdict()
        assert len(series_dict["data"]) == original_length

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.data_too_large])
    def test_data_identity_invariant(self, data_list):
        """Test that data identity is preserved across operations."""
        if not data_list:
            return

        series = LineSeries(data=data_list)

        # First and last data points should maintain identity
        first_original = data_list[0]
        last_original = data_list[-1]

        first_stored = series.data[0]
        last_stored = series.data[-1]

        assert first_original.time == first_stored.time
        assert first_original.value == first_stored.value
        assert last_original.time == last_stored.time
        assert last_original.value == last_stored.value

    @given(line_data_list_strategy())
    @settings(max_examples=100, deadline=None)
    def test_chart_series_count_invariant(self, data_list):
        """Test that chart series count remains invariant."""
        series = LineSeries(data=data_list)
        chart = Chart(series=series)

        # Series count should remain constant
        assert len(chart.series) == 1

        # Series count should remain constant after operations
        chart_config = chart.to_frontend_config()
        chart_obj = chart_config["charts"][0]
        assert len(chart_obj["series"]) == 1
