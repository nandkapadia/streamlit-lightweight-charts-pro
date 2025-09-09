"""
Unit tests for the BandData class.

This module tests the BandData class functionality including
construction, validation, serialization, and edge cases.
"""

import math
from datetime import datetime

import pandas as pd
import pytest

from streamlit_lightweight_charts_pro.data.band import BandData
from streamlit_lightweight_charts_pro.data.data import Data


@pytest.fixture
def valid_time() -> int:
    return 1704067200  # 2024-01-01 00:00:00 UTC


class TestBandDataConstruction:
    """Test cases for BandData construction."""

    def test_standard_construction(self, valid_time):
        """Test standard BandData construction."""
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        assert data.time == valid_time
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_construction_with_integers(self, valid_time):
        """Test BandData construction with integer values."""
        data = BandData(time=valid_time, upper=110, middle=105, lower=100)
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_construction_with_string_time(self):
        """Test BandData construction with string time."""
        data = BandData(time="2024-01-01", upper=110.0, middle=105.0, lower=100.0)
        assert isinstance(data.time, int)
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_construction_with_float_time(self):
        """Test BandData construction with float time."""
        ts = 1704067200.0
        data = BandData(time=ts, upper=110.0, middle=105.0, lower=100.0)
        assert data.time == int(ts)
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_construction_with_datetime(self):
        """Test BandData construction with datetime object."""
        dt = datetime(2024, 1, 1)
        data = BandData(time=dt, upper=110.0, middle=105.0, lower=100.0)
        assert isinstance(data.time, int)
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_construction_with_pandas_timestamp(self):
        """Test BandData construction with pandas Timestamp."""
        ts = pd.Timestamp("2024-01-01")
        data = BandData(time=ts, upper=110.0, middle=105.0, lower=100.0)
        assert isinstance(data.time, int)
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0


class TestBandDataValidation:
    """Test cases for BandData validation."""

    def test_nan_upper_value(self, valid_time):
        """Test handling of NaN upper value."""
        data = BandData(time=valid_time, upper=math.nan, middle=105.0, lower=100.0)
        assert data.upper == 0.0

    def test_nan_middle_value(self, valid_time):
        """Test handling of NaN middle value."""
        data = BandData(time=valid_time, upper=110.0, middle=math.nan, lower=100.0)
        assert data.middle == 0.0

    def test_nan_lower_value(self, valid_time):
        """Test handling of NaN lower value."""
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=math.nan)
        assert data.lower == 0.0

    def test_none_upper_value(self, valid_time):
        """Test error on None upper value."""
        with pytest.raises(ValueError, match="upper must not be None"):
            BandData(time=valid_time, upper=None, middle=105.0, lower=100.0)

    def test_none_middle_value(self, valid_time):
        """Test error on None middle value."""
        with pytest.raises(ValueError, match="middle must not be None"):
            BandData(time=valid_time, upper=110.0, middle=None, lower=100.0)

    def test_none_lower_value(self, valid_time):
        """Test error on None lower value."""
        with pytest.raises(ValueError, match="lower must not be None"):
            BandData(time=valid_time, upper=110.0, middle=105.0, lower=None)

    def test_invalid_time_type(self):
        """Test error on invalid time type."""
        with pytest.raises(TypeError):
            BandData(time=[1, 2, 3], upper=110.0, middle=105.0, lower=100.0)

    def test_band_relationship_validation(self, valid_time):
        """Test that band relationships are maintained."""
        # Upper should be >= middle >= lower
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        assert data.upper >= data.middle >= data.lower

    def test_equal_band_values(self, valid_time):
        """Test construction with equal band values."""
        data = BandData(time=valid_time, upper=100.0, middle=100.0, lower=100.0)
        assert data.upper == data.middle == data.lower == 100.0


class TestBandDataSerialization:
    """Test cases for BandData serialization."""

    def test_to_dict_basic(self, valid_time):
        """Test basic to_dict functionality."""
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        d = data.asdict()
        assert d["time"] == valid_time
        assert d["upper"] == 110.0
        assert d["middle"] == 105.0
        assert d["lower"] == 100.0

    def test_to_dict_keys_are_camel_case(self, valid_time):
        """Test that to_dict keys are in camelCase."""
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        d = data.asdict()
        expected_keys = {"time", "upper", "middle", "lower"}
        assert set(d.keys()) == expected_keys

    def test_to_dict_with_nan_values(self, valid_time):
        """Test to_dict with NaN values converted to 0.0."""
        data = BandData(time=valid_time, upper=math.nan, middle=105.0, lower=math.nan)
        d = data.asdict()
        assert d["upper"] == 0.0
        assert d["middle"] == 105.0
        assert d["lower"] == 0.0

    def test_to_dict_consistency(self, valid_time):
        """Test that to_dict produces consistent output."""
        data1 = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        data2 = BandData(time="2024-01-01", upper=110.0, middle=105.0, lower=100.0)

        d1 = data1.asdict()
        d2 = data2.asdict()

        assert d1["upper"] == d2["upper"]
        assert d1["middle"] == d2["middle"]
        assert d1["lower"] == d2["lower"]
        assert d1["time"] == d2["time"]


class TestBandDataEdgeCases:
    """Test cases for BandData edge cases."""

    def test_zero_values(self, valid_time):
        """Test construction with zero values."""
        data = BandData(time=valid_time, upper=0.0, middle=0.0, lower=0.0)
        assert data.upper == 0.0
        assert data.middle == 0.0
        assert data.lower == 0.0

    def test_negative_values(self, valid_time):
        """Test construction with negative values."""
        data = BandData(time=valid_time, upper=-10.0, middle=-15.0, lower=-20.0)
        assert data.upper == -10.0
        assert data.middle == -15.0
        assert data.lower == -20.0

    def test_large_values(self, valid_time):
        """Test construction with large values."""
        data = BandData(time=valid_time, upper=1000000.0, middle=999999.0, lower=999998.0)
        assert data.upper == 1000000.0
        assert data.middle == 999999.0
        assert data.lower == 999998.0

    def test_small_decimal_values(self, valid_time):
        """Test construction with small decimal values."""
        data = BandData(time=valid_time, upper=0.001, middle=0.0005, lower=0.0001)
        assert data.upper == 0.001
        assert data.middle == 0.0005
        assert data.lower == 0.0001

    def test_string_numeric_values(self, valid_time):
        """Test construction with string numeric values."""
        # BandData doesn't automatically convert strings to floats
        # This test documents the current behavior
        data = BandData(time=valid_time, upper="110.0", middle="105.0", lower="100.0")
        assert data.upper == "110.0"
        assert data.middle == "105.0"
        assert data.lower == "100.0"


class TestBandDataInheritance:
    """Test cases for BandData inheritance."""

    def test_inherits_from_data(self, valid_time):
        """Test that BandData inherits from Data."""
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        assert isinstance(data, Data)

    def test_has_required_attributes(self, valid_time):
        """Test that BandData has required attributes."""
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        assert hasattr(data, "time")
        assert hasattr(data, "upper")
        assert hasattr(data, "middle")
        assert hasattr(data, "lower")
        assert hasattr(data, "asdict")

    def test_has_required_methods(self, valid_time):
        """Test that BandData has required methods."""
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        assert callable(getattr(data, "asdict"))


class TestBandDataIntegration:
    """Test cases for BandData integration with other components."""

    def test_with_dataframe_conversion(self, valid_time):
        """Test BandData creation from DataFrame row."""
        df = pd.DataFrame(
            {"time": [valid_time], "upper": [110.0], "middle": [105.0], "lower": [100.0]}
        )

        row = df.iloc[0]
        data = BandData(
            time=row["time"], upper=row["upper"], middle=row["middle"], lower=row["lower"]
        )

        assert data.time == valid_time
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_serialization_round_trip(self, valid_time):
        """Test serialization and deserialization round trip."""
        original_data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        serialized = original_data.asdict()

        # Simulate reconstruction from serialized data
        reconstructed_data = BandData(
            time=serialized["time"],
            upper=serialized["upper"],
            middle=serialized["middle"],
            lower=serialized["lower"],
        )

        assert reconstructed_data.time == original_data.time
        assert reconstructed_data.upper == original_data.upper
        assert reconstructed_data.middle == original_data.middle
        assert reconstructed_data.lower == original_data.lower

    def test_multiple_band_data_objects(self, valid_time):
        """Test creating multiple BandData objects."""
        data_list = [
            BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0),
            BandData(time=valid_time + 86400, upper=112.0, middle=107.0, lower=102.0),
            BandData(time=valid_time + 172800, upper=108.0, middle=103.0, lower=98.0),
        ]

        assert len(data_list) == 3
        assert data_list[0].upper == 110.0
        assert data_list[1].upper == 112.0
        assert data_list[2].upper == 108.0
