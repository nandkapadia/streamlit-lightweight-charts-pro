"""Unit tests for the BandData class.

This module tests the BandData class functionality including
construction, validation, serialization, and edge cases.
"""

import math
from datetime import datetime

import pandas as pd
import pytest
from lightweight_charts_core.data.band import BandData
from lightweight_charts_core.data.data import Data
from lightweight_charts_core.exceptions import (
    ColorValidationError,
    UnsupportedTimeTypeError,
    ValueValidationError,
)


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
        assert isinstance(data.time, str)  # Stored as-is
        result = data.asdict()
        assert isinstance(result["time"], int)  # Normalized in asdict()
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_construction_with_float_time(self):
        """Test BandData construction with float time."""
        ts = 1704067200.0
        data = BandData(time=ts, upper=110.0, middle=105.0, lower=100.0)
        # Time stored as-is (float)
        assert data.time == ts
        # Normalized to int in asdict()
        result = data.asdict()
        assert result["time"] == int(ts)
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_construction_with_datetime(self):
        """Test BandData construction with datetime object."""
        dt = datetime(2024, 1, 1)
        data = BandData(time=dt, upper=110.0, middle=105.0, lower=100.0)
        # Time stored as-is (datetime)
        assert data.time == dt
        # Normalized to int in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
        assert data.upper == 110.0
        assert data.middle == 105.0
        assert data.lower == 100.0

    def test_construction_with_pandas_timestamp(self):
        """Test BandData construction with pandas Timestamp."""
        ts = pd.Timestamp("2024-01-01")
        data = BandData(time=ts, upper=110.0, middle=105.0, lower=100.0)
        # Time stored as-is (pandas Timestamp)
        assert data.time == ts
        # Normalized to int in asdict()
        result = data.asdict()
        assert isinstance(result["time"], int)
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
        with pytest.raises(ValueValidationError, match="upper must not be None"):
            BandData(time=valid_time, upper=None, middle=105.0, lower=100.0)

    def test_none_middle_value(self, valid_time):
        """Test error on None middle value."""
        with pytest.raises(ValueValidationError, match="middle must not be None"):
            BandData(time=valid_time, upper=110.0, middle=None, lower=100.0)

    def test_none_lower_value(self, valid_time):
        """Test error on None lower value."""
        with pytest.raises(ValueValidationError, match="lower must not be None"):
            BandData(time=valid_time, upper=110.0, middle=105.0, lower=None)

    def test_invalid_time_type(self):
        """Test error on invalid time type."""
        # Invalid time won't raise error until asdict() is called
        data = BandData(time=[1, 2, 3], upper=110.0, middle=105.0, lower=100.0)
        # Error happens during serialization
        with pytest.raises((UnsupportedTimeTypeError, ValueError, TypeError)):
            data.asdict()

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
        assert callable(data.asdict)


class TestBandDataIntegration:
    """Test cases for BandData integration with other components."""

    def test_with_dataframe_conversion(self, valid_time):
        """Test BandData creation from DataFrame row."""
        test_dataframe = pd.DataFrame(
            {"time": [valid_time], "upper": [110.0], "middle": [105.0], "lower": [100.0]},
        )

        row = test_dataframe.iloc[0]
        data = BandData(
            time=row["time"],
            upper=row["upper"],
            middle=row["middle"],
            lower=row["lower"],
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


class TestBandDataPerPointColors:
    """Test cases for BandData per-point color properties."""

    def test_band_data_without_color_overrides(self, valid_time):
        """Test BandData without per-point color overrides."""
        data = BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0)
        assert data.upper_line_color is None
        assert data.middle_line_color is None
        assert data.lower_line_color is None
        assert data.upper_fill_color is None
        assert data.lower_fill_color is None

        serialized = data.asdict()
        assert "upperLineColor" not in serialized
        assert "middleLineColor" not in serialized
        assert "lowerLineColor" not in serialized
        assert "upperFillColor" not in serialized
        assert "lowerFillColor" not in serialized

    def test_band_data_with_upper_line_color(self, valid_time):
        """Test BandData with upper line color override."""
        data = BandData(
            time=valid_time,
            upper=110.0,
            middle=105.0,
            lower=100.0,
            upper_line_color="#ff0000",
        )

        assert data.upper_line_color == "#ff0000"
        assert data.middle_line_color is None
        assert data.lower_line_color is None

        serialized = data.asdict()
        assert serialized["upperLineColor"] == "#ff0000"
        assert "middleLineColor" not in serialized
        assert "lowerLineColor" not in serialized

    def test_band_data_with_fill_colors(self, valid_time):
        """Test BandData with fill color overrides."""
        data = BandData(
            time=valid_time,
            upper=110.0,
            middle=105.0,
            lower=100.0,
            upper_fill_color="rgba(255, 0, 0, 0.2)",
            lower_fill_color="rgba(0, 0, 255, 0.2)",
        )

        assert data.upper_fill_color == "rgba(255, 0, 0, 0.2)"
        assert data.lower_fill_color == "rgba(0, 0, 255, 0.2)"

        serialized = data.asdict()
        assert serialized["upperFillColor"] == "rgba(255, 0, 0, 0.2)"
        assert serialized["lowerFillColor"] == "rgba(0, 0, 255, 0.2)"

    def test_band_data_with_all_color_overrides(self, valid_time):
        """Test BandData with all per-point color overrides."""
        data = BandData(
            time=valid_time,
            upper=110.0,
            middle=105.0,
            lower=100.0,
            upper_line_color="#ff0000",
            middle_line_color="#00ff00",
            lower_line_color="#0000ff",
            upper_fill_color="rgba(255, 0, 0, 0.2)",
            lower_fill_color="rgba(0, 0, 255, 0.2)",
        )

        assert data.upper_line_color == "#ff0000"
        assert data.middle_line_color == "#00ff00"
        assert data.lower_line_color == "#0000ff"
        assert data.upper_fill_color == "rgba(255, 0, 0, 0.2)"
        assert data.lower_fill_color == "rgba(0, 0, 255, 0.2)"

    def test_band_data_color_serialization(self, valid_time):
        """Test BandData color serialization to camelCase JSON."""
        data = BandData(
            time=valid_time,
            upper=110.0,
            middle=105.0,
            lower=100.0,
            upper_line_color="#ff0000",
        )

        serialized = data.asdict()

        # Check camelCase conversion
        assert "upperLineColor" in serialized
        assert serialized["upperLineColor"] == "#ff0000"

        # Check snake_case not present
        assert "upper_line_color" not in serialized

    def test_band_data_complete_color_serialization(self, valid_time):
        """Test complete BandData color serialization."""
        data = BandData(
            time=valid_time,
            upper=110.0,
            middle=105.0,
            lower=100.0,
            upper_line_color="#ff0000",
            middle_line_color="#00ff00",
            lower_line_color="#0000ff",
            upper_fill_color="rgba(255, 0, 0, 0.2)",
            lower_fill_color="rgba(0, 0, 255, 0.2)",
        )

        serialized = data.asdict()

        # Check all color fields present in camelCase
        assert "upperLineColor" in serialized
        assert "middleLineColor" in serialized
        assert "lowerLineColor" in serialized
        assert "upperFillColor" in serialized
        assert "lowerFillColor" in serialized

        # Check ribbon-specific field not present
        assert "fill" not in serialized

    def test_band_data_partial_color_overrides(self, valid_time):
        """Test BandData with partial color overrides."""
        # Only line colors
        data1 = BandData(
            time=valid_time,
            upper=110.0,
            middle=105.0,
            lower=100.0,
            upper_line_color="#ff0000",
            middle_line_color="#00ff00",
        )
        serialized1 = data1.asdict()
        assert serialized1["upperLineColor"] == "#ff0000"
        assert serialized1["middleLineColor"] == "#00ff00"
        assert "lowerLineColor" not in serialized1
        assert "upperFillColor" not in serialized1
        assert "lowerFillColor" not in serialized1

        # Only fill colors
        data2 = BandData(
            time=valid_time,
            upper=110.0,
            middle=105.0,
            lower=100.0,
            lower_fill_color="rgba(0, 0, 255, 0.2)",
        )
        serialized2 = data2.asdict()
        assert serialized2["lowerFillColor"] == "rgba(0, 0, 255, 0.2)"
        assert "upperLineColor" not in serialized2
        assert "middleLineColor" not in serialized2
        assert "lowerLineColor" not in serialized2
        assert "upperFillColor" not in serialized2

    def test_band_data_invalid_color(self, valid_time):
        """Test BandData with invalid color raises error."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError):
            BandData(
                time=valid_time,
                upper=110.0,
                middle=105.0,
                lower=100.0,
                upper_line_color="invalid-color",
            )

    def test_band_data_series_with_mixed_colors(self, valid_time):
        """Test a series of BandData points with mixed color overrides."""
        data_series = [
            # Point 1: No custom colors
            BandData(time=valid_time, upper=110.0, middle=105.0, lower=100.0),
            # Point 2: Custom upper line color only
            BandData(
                time=valid_time + 86400,
                upper=112.0,
                middle=106.0,
                lower=102.0,
                upper_line_color="#ff0000",
            ),
            # Point 3: Custom fill colors only
            BandData(
                time=valid_time + 172800,
                upper=115.0,
                middle=108.0,
                lower=105.0,
                upper_fill_color="rgba(255, 0, 0, 0.2)",
                lower_fill_color="rgba(0, 255, 0, 0.2)",
            ),
            # Point 4: Complete custom colors
            BandData(
                time=valid_time + 259200,
                upper=118.0,
                middle=110.0,
                lower=108.0,
                upper_line_color="#ff00ff",
                middle_line_color="#ffff00",
                lower_line_color="#00ffff",
                upper_fill_color="rgba(255, 0, 255, 0.3)",
                lower_fill_color="rgba(0, 255, 255, 0.3)",
            ),
        ]

        # Serialize all points
        serialized_series = [data.asdict() for data in data_series]

        # Point 1 should not have color overrides
        assert "upperLineColor" not in serialized_series[0]
        assert "middleLineColor" not in serialized_series[0]
        assert "lowerLineColor" not in serialized_series[0]
        assert "upperFillColor" not in serialized_series[0]
        assert "lowerFillColor" not in serialized_series[0]

        # Point 2 should have upperLineColor only
        assert "upperLineColor" in serialized_series[1]
        assert "middleLineColor" not in serialized_series[1]
        assert "lowerLineColor" not in serialized_series[1]
        assert "upperFillColor" not in serialized_series[1]
        assert "lowerFillColor" not in serialized_series[1]

        # Point 3 should have fill colors only
        assert "upperFillColor" in serialized_series[2]
        assert "lowerFillColor" in serialized_series[2]
        assert "upperLineColor" not in serialized_series[2]
        assert "middleLineColor" not in serialized_series[2]
        assert "lowerLineColor" not in serialized_series[2]

        # Point 4 should have all fields
        assert "upperLineColor" in serialized_series[3]
        assert "middleLineColor" in serialized_series[3]
        assert "lowerLineColor" in serialized_series[3]
        assert "upperFillColor" in serialized_series[3]
        assert "lowerFillColor" in serialized_series[3]
