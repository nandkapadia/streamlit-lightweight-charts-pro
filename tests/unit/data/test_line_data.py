import math
from datetime import datetime

import pandas as pd
import pytest

from streamlit_lightweight_charts_pro.data.line_data import LineData


@pytest.fixture
def valid_time() -> int:
    return 1704067200  # 2024-01-01 00:00:00 UTC


def test_standard_construction(valid_time):
    data = LineData(time=valid_time, value=123.45, color="#2196F3")
    assert data.time == valid_time
    assert data.value == 123.45
    assert data.color == "#2196F3"
    d = data.asdict()
    assert d["time"] == valid_time
    assert d["value"] == 123.45
    assert d["color"] == "#2196F3"


def test_nan_value(valid_time):
    data = LineData(time=valid_time, value=math.nan, color="#2196F3")
    assert data.value == 0.0
    d = data.asdict()
    assert d["value"] == 0.0


def test_color_validation_hex(valid_time):
    data = LineData(time=valid_time, value=1.0, color="#ABCDEF")
    assert data.color == "#ABCDEF"


def test_color_validation_rgba(valid_time):
    data = LineData(time=valid_time, value=1.0, color="rgba(33,150,243,1)")
    assert data.color == "rgba(33,150,243,1)"


def test_color_invalid(valid_time):
    with pytest.raises(ValueError):
        LineData(time=valid_time, value=1.0, color="notacolor")


def test_color_omitted_in_dict(valid_time):
    data = LineData(time=valid_time, value=1.0)
    d = data.asdict()
    assert "color" not in d
    data2 = LineData(time=valid_time, value=1.0, color="")
    d2 = data2.asdict()
    assert "color" not in d2


def test_time_normalization_from_string():
    data = LineData(time="2024-01-01", value=1.0)
    assert isinstance(data.time, int)


def test_time_normalization_from_float():
    ts = 1704067200.0
    data = LineData(time=ts, value=1.0)
    assert data.time == int(ts)


def test_time_normalization_from_datetime():
    dt = datetime(2024, 1, 1)
    data = LineData(time=dt, value=1.0)
    assert isinstance(data.time, int)


def test_time_normalization_from_pandas_timestamp():
    ts = pd.Timestamp("2024-01-01")
    data = LineData(time=ts, value=1.0)
    assert isinstance(data.time, int)


def test_error_on_none_value(valid_time):
    with pytest.raises(ValueError):
        LineData(time=valid_time, value=None)


def test_error_on_invalid_time():
    with pytest.raises(TypeError):
        LineData(time=[1, 2, 3], value=1.0)


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
