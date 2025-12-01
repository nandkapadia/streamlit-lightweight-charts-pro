"""
Chart time utilities tests - Time conversion and range calculation.

This module tests time-related utility methods in the Chart class including
time conversion, range seconds mapping, and data timespan calculation.
"""

# Standard Imports
from datetime import datetime
from unittest.mock import Mock

# Third Party Imports
import pytest

# Local Imports
from streamlit_lightweight_charts_pro.charts.chart import Chart
from lightweight_charts_core.charts.series.line import LineSeries
from lightweight_charts_core.data.line_data import LineData


class TestTimeConversion:
    """Test time conversion to timestamp."""

    def test_convert_time_to_timestamp_integer(self):
        """Test time conversion with integer timestamp."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp(1704067200)
        assert timestamp == 1704067200.0

    def test_convert_time_to_timestamp_float(self):
        """Test time conversion with float timestamp."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp(1704067200.5)
        assert timestamp == 1704067200.5

    def test_convert_time_to_timestamp_iso_string(self):
        """Test time conversion with ISO format string."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp("2024-01-01T00:00:00")
        assert timestamp is not None
        assert timestamp > 1704000000  # Approximately Jan 1, 2024

    def test_convert_time_to_timestamp_date_string(self):
        """Test time conversion with date string."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp("2024-01-01")
        assert timestamp is not None
        assert timestamp > 1704000000

    def test_convert_time_to_timestamp_invalid_string(self):
        """Test time conversion with invalid string."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp("invalid-date")
        assert timestamp is None

    def test_convert_time_to_timestamp_datetime_object(self):
        """Test time conversion with datetime object."""
        chart = Chart()
        dt = datetime(2024, 1, 1)
        timestamp = chart._convert_time_to_timestamp(dt)
        assert timestamp is not None
        assert timestamp == dt.timestamp()

    def test_convert_time_to_timestamp_none(self):
        """Test time conversion with None."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp(None)
        assert timestamp is None

    def test_convert_iso_string_with_z_suffix(self):
        """Test conversion of ISO string with Z timezone."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp("2024-01-01T00:00:00Z")
        assert timestamp is not None
        assert isinstance(timestamp, float)

    def test_convert_iso_string_with_timezone(self):
        """Test conversion of ISO string with timezone offset."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp("2024-01-01T00:00:00+00:00")
        assert timestamp is not None

    def test_convert_malformed_date_string(self):
        """Test conversion of malformed date string."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp("2024-13-99")  # Invalid date
        assert timestamp is None

    def test_convert_empty_string(self):
        """Test conversion of empty string."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp("")
        assert timestamp is None

    def test_convert_object_without_timestamp_method(self):
        """Test conversion of object without timestamp method."""
        chart = Chart()
        timestamp = chart._convert_time_to_timestamp(Mock(spec=[]))
        assert timestamp is None

    def test_convert_object_with_timestamp_method(self):
        """Test conversion of object with timestamp method."""
        chart = Chart()
        mock_obj = Mock()
        mock_obj.timestamp = Mock(return_value=1704067200.0)
        timestamp = chart._convert_time_to_timestamp(mock_obj)
        assert timestamp == 1704067200.0


class TestRangeSecondsMapping:
    """Test range seconds mapping for all time ranges."""

    @pytest.mark.parametrize(
        "range_value,expected_seconds",
        [
            ("FIVE_MINUTES", 300),
            ("FIFTEEN_MINUTES", 900),
            ("THIRTY_MINUTES", 1800),
            ("ONE_HOUR", 3600),
            ("FOUR_HOURS", 14400),
            ("ONE_DAY", 86400),
            ("ONE_WEEK", 604800),
            ("TWO_WEEKS", 1209600),
            ("ONE_MONTH", 2592000),
            ("THREE_MONTHS", 7776000),
            ("SIX_MONTHS", 15552000),
            ("ONE_YEAR", 31536000),
            ("TWO_YEARS", 63072000),
            ("FIVE_YEARS", 157680000),
        ],
    )
    def test_get_range_seconds_enum_values(self, range_value, expected_seconds):
        """Test range seconds for all enum values."""
        chart = Chart()
        range_config = {"range": range_value}
        seconds = chart._get_range_seconds(range_config)
        assert seconds == expected_seconds

    def test_get_range_seconds_all_range(self):
        """Test range seconds extraction for ALL range."""
        chart = Chart()
        range_config = {"range": "ALL"}
        seconds = chart._get_range_seconds(range_config)
        assert seconds is None

    def test_get_range_seconds_none_range(self):
        """Test range seconds extraction for None range."""
        chart = Chart()
        range_config = {}
        seconds = chart._get_range_seconds(range_config)
        assert seconds is None

    def test_get_range_seconds_numeric_value(self):
        """Test range seconds extraction with numeric value."""
        chart = Chart()
        range_config = {"range": 3600}
        seconds = chart._get_range_seconds(range_config)
        assert seconds == 3600.0

    def test_get_range_seconds_unknown_string(self):
        """Test range seconds extraction with unknown string."""
        chart = Chart()
        range_config = {"range": "UNKNOWN_RANGE"}
        seconds = chart._get_range_seconds(range_config)
        assert seconds is None

    def test_get_range_seconds_with_float(self):
        """Test range seconds with float value."""
        chart = Chart()
        range_config = {"range": 7200.5}
        seconds = chart._get_range_seconds(range_config)
        assert seconds == 7200.5

    def test_get_range_seconds_with_zero(self):
        """Test range seconds with zero."""
        chart = Chart()
        range_config = {"range": 0}
        seconds = chart._get_range_seconds(range_config)
        assert seconds == 0.0


class TestDataTimespanCalculation:
    """Test data timespan calculation methods."""

    def test_calculate_data_timespan_with_multiple_series(self):
        """Test timespan calculation across multiple series."""
        data1 = [
            LineData(time="2024-01-01", value=100),
            LineData(time="2024-01-05", value=105),
        ]
        data2 = [
            LineData(time="2024-01-03", value=200),
            LineData(time="2024-01-10", value=205),
        ]

        series1 = LineSeries(data=data1)
        series2 = LineSeries(data=data2)
        chart = Chart(series=[series1, series2])

        # Calculate timespan (should be from Jan 1 to Jan 10 = 9 days)
        timespan = chart._calculate_data_timespan()

        assert timespan is not None
        # 9 days = 777,600 seconds
        assert timespan >= 777600 - 100  # Allow small variance
        assert timespan <= 777600 + 100

    def test_calculate_data_timespan_with_empty_series(self):
        """Test timespan calculation with empty series."""
        chart = Chart()
        timespan = chart._calculate_data_timespan()
        assert timespan is None

    def test_calculate_timespan_with_mixed_time_formats(self):
        """Test timespan with mixed time formats."""
        data = [
            LineData(time=1704067200, value=100),  # Unix timestamp
            LineData(time="2024-01-10", value=105),  # Date string
        ]

        series = LineSeries(data=data)
        chart = Chart(series=series)

        timespan = chart._calculate_data_timespan()

        # Should handle mixed formats
        assert timespan is not None
        assert timespan > 0

    def test_calculate_timespan_with_no_time_attribute(self):
        """Test timespan with data points missing time attribute."""
        # Create series with custom data (no time attribute)
        series = LineSeries(data=[])
        series.data = [Mock(spec=[])]  # Mock object without time attribute

        chart = Chart(series=series)

        timespan = chart._calculate_data_timespan()

        # Should return None when no valid time data
        assert timespan is None

    def test_calculate_timespan_with_invalid_time_values(self):
        """Test timespan with invalid time values."""
        data = [
            LineData(time="invalid", value=100),
            LineData(time="also-invalid", value=105),
        ]

        series = LineSeries(data=data)
        chart = Chart(series=series)

        timespan = chart._calculate_data_timespan()

        # Should return None when all time values are invalid
        assert timespan is None

    def test_calculate_timespan_with_single_data_point(self):
        """Test timespan with only one data point."""
        data = [LineData(time="2024-01-01", value=100)]

        series = LineSeries(data=data)
        chart = Chart(series=series)

        timespan = chart._calculate_data_timespan()

        # Should return 0 for single point
        assert timespan == 0.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
