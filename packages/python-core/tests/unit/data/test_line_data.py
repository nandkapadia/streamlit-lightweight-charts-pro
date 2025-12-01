"""Comprehensive unit tests for the LineData class.

This module contains extensive unit tests for the LineData class,
which represents line chart data points with optional color styling
for financial chart visualization. The tests cover construction,
validation, serialization, and edge cases.

Key Features Tested:
    - Line data construction with time, value, and optional color
    - Color format validation for hex and rgba formats
    - Data serialization to frontend-compatible format
    - NaN value handling and conversion to 0.0
    - Error handling for invalid data and color formats
    - Required and optional field validation
    - Time format validation and conversion

Example Test Usage:
    ```python
    from tests.unit.data.test_line_data import test_standard_construction

    # Run specific test
    test_standard_construction(valid_time_fixture)
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
import math
from datetime import datetime

# Third Party Imports
import pandas as pd
import pytest

# Local Imports
from lightweight_charts_core.data.line_data import LineData
from lightweight_charts_core.exceptions import (
    ColorValidationError,
    RequiredFieldError,
)


@pytest.fixture
def valid_time() -> int:
    """Fixture providing a valid UNIX timestamp for testing.

    Returns:
        int: UNIX timestamp representing 2024-01-01 00:00:00 UTC

    """
    return 1704067200  # 2024-01-01 00:00:00 UTC


def test_standard_construction(valid_time):
    """Test standard LineData construction with all fields.

    This test verifies that a LineData object can be created with
    time, value, and color fields, and that all values are correctly
    assigned and serialized.

    Args:
        valid_time: Fixture providing a valid UNIX timestamp

    """
    # Create LineData with time, value, and color
    data = LineData(time=valid_time, value=123.45, color="#2196F3")

    # Verify all field values are correctly assigned
    assert data.time == valid_time  # Verify timestamp is preserved
    assert data.value == 123.45  # Verify numeric value
    assert data.color == "#2196F3"  # Verify color is assigned

    # Test serialization to dictionary format
    d = data.asdict()

    # Verify serialized values match original values
    assert d["time"] == valid_time  # Verify serialized timestamp
    assert d["value"] == 123.45  # Verify serialized value
    assert d["color"] == "#2196F3"  # Verify serialized color


def test_nan_value(valid_time):
    """Test LineData construction with NaN value handling.

    This test verifies that NaN values are properly converted to 0.0
    during construction, ensuring frontend compatibility.

    Args:
        valid_time: Fixture providing a valid UNIX timestamp

    """
    # Create LineData with NaN value to test conversion
    data = LineData(time=valid_time, value=math.nan, color="#2196F3")

    # Verify NaN is converted to 0.0 for frontend compatibility
    assert data.value == 0.0

    # Verify serialization also returns 0.0
    d = data.asdict()
    assert d["value"] == 0.0


def test_color_validation_hex(valid_time):
    data = LineData(time=valid_time, value=1.0, color="#ABCDEF")
    assert data.color == "#ABCDEF"


def test_color_validation_rgba(valid_time):
    data = LineData(time=valid_time, value=1.0, color="rgba(33,150,243,1)")
    assert data.color == "rgba(33,150,243,1)"


def test_color_invalid(valid_time):
    # Centralized validation raises ColorValidationError (more specific than ValueValidationError)
    with pytest.raises(ColorValidationError):
        LineData(time=valid_time, value=1.0, color="notacolor")


def test_color_omitted_in_dict(valid_time):
    data = LineData(time=valid_time, value=1.0)
    d = data.asdict()
    assert "color" not in d
    # Empty color string is converted to None by centralized validation
    data2 = LineData(time=valid_time, value=1.0, color="")
    assert data2.color is None
    d2 = data2.asdict()
    assert "color" not in d2


def test_time_normalization_from_string():
    """Test time normalization happens in asdict(), not at construction."""
    data = LineData(time="2024-01-01", value=1.0)
    # Time is stored as-is
    assert data.time == "2024-01-01"
    # Time is normalized in asdict()
    result = data.asdict()
    assert isinstance(result["time"], int)


def test_time_normalization_from_float():
    """Test time stored as-is, normalized in asdict()."""
    ts = 1704067200.0
    data = LineData(time=ts, value=1.0)
    # Time is stored as-is (float)
    assert data.time == ts
    # Time is normalized to int in asdict()
    result = data.asdict()
    assert result["time"] == int(ts)


def test_time_normalization_from_datetime():
    """Test datetime time normalization in asdict()."""
    dt = datetime(2024, 1, 1)
    data = LineData(time=dt, value=1.0)
    # Time is stored as datetime object
    assert data.time == dt
    # Time is normalized to int in asdict()
    result = data.asdict()
    assert isinstance(result["time"], int)


def test_time_normalization_from_pandas_timestamp():
    """Test pandas timestamp normalization in asdict()."""
    ts = pd.Timestamp("2024-01-01")
    data = LineData(time=ts, value=1.0)
    # Time is stored as pandas Timestamp
    assert data.time == ts
    # Time is normalized to int in asdict()
    result = data.asdict()
    assert isinstance(result["time"], int)


def test_error_on_none_value(valid_time):
    with pytest.raises(RequiredFieldError):
        LineData(time=valid_time, value=None)


def test_time_modification_after_construction():
    """Test that time can be modified after construction."""
    data = LineData(time="2024-01-01", value=1.0)
    result1 = data.asdict()
    time1 = result1["time"]

    # Modify time after construction
    data.time = "2024-01-02"
    result2 = data.asdict()
    time2 = result2["time"]

    # Times should be different
    assert time1 != time2


def test_to_dict_keys_are_camel_case(valid_time):
    data = LineData(time=valid_time, value=1.0, color="#2196F3")
    d = data.asdict()
    assert set(d.keys()) == {"time", "value", "color"}


def test_cross_type_dict_vs_dataclass(valid_time):
    # Simulate dict input and dataclass input producing same output
    data1 = LineData(time=valid_time, value=2.0, color="#2196F3")
    data2 = LineData(time="2024-01-01", value=2.0, color="#2196F3")
    assert data1.asdict()["value"] == data2.asdict()["value"]
    assert data1.asdict()["color"] == data2.asdict()["color"]
