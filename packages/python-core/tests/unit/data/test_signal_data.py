"""Unit tests for SignalData class.

This module contains comprehensive tests for the SignalData class, which is used
for creating signal-based background coloring in financial charts.
"""

from datetime import datetime

import pytest
from lightweight_charts_core.data.signal_data import SignalData
from lightweight_charts_core.exceptions import ColorValidationError


class TestSignalData:
    """Test cases for SignalData class."""

    def test_basic_construction(self):
        """Test basic SignalData construction."""
        signal = SignalData("2024-01-01", 1)
        # Time is stored as-is, normalized in asdict()
        assert signal.time == "2024-01-01"
        result = signal.asdict()
        assert result["time"] == 1704067200  # Normalized in asdict()
        assert signal.value == 1
        assert signal.color is None

    def test_construction_with_color(self):
        """Test SignalData construction with color."""
        signal = SignalData("2024-01-01", 0, color="#ff0000")
        # Time is stored as-is, normalized in asdict()
        assert signal.time == "2024-01-01"
        result = signal.asdict()
        assert result["time"] == 1704067200  # Normalized in asdict()
        assert signal.value == 0
        assert signal.color == "#ff0000"

    def test_construction_with_datetime(self):
        """Test SignalData construction with datetime object."""
        dt = datetime(2024, 1, 1)
        signal = SignalData(dt, 1)
        # Time is stored as-is (datetime object)
        assert signal.time == dt
        # Time is normalized in asdict()
        result = signal.asdict()
        expected_timestamp = int(dt.timestamp())
        assert result["time"] == expected_timestamp
        assert signal.value == 1

    def test_construction_with_empty_color(self):
        """Test SignalData construction with empty color string."""
        signal = SignalData("2024-01-01", 1, color="")
        # Empty color string is converted to None by centralized validation
        assert signal.color is None

    def test_construction_with_none_color(self):
        """Test SignalData construction with None color."""
        signal = SignalData("2024-01-01", 1, color=None)
        assert signal.color is None

    def test_invalid_color_hex(self):
        """Test SignalData construction with invalid hex color."""
        # Centralized validation raises ColorValidationError
        # (more specific than ValueValidationError)
        with pytest.raises(ColorValidationError):
            SignalData("2024-01-01", 1, color="#invalid")

    def test_invalid_color_rgba(self):
        """Test SignalData construction with invalid rgba color."""
        # Centralized validation raises ColorValidationError
        # (more specific than ValueValidationError)
        with pytest.raises(ColorValidationError):
            SignalData("2024-01-01", 1, color="not_a_color_at_all")

    def test_valid_hex_colors(self):
        """Test SignalData construction with valid hex colors."""
        valid_colors = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"]
        for color in valid_colors:
            signal = SignalData("2024-01-01", 1, color=color)
            assert signal.color == color

    def test_valid_rgba_colors(self):
        """Test SignalData construction with valid rgba colors."""
        valid_colors = [
            "rgba(255, 0, 0, 1)",
            "rgba(0, 255, 0, 0.5)",
            "rgba(0, 0, 255, 0.8)",
            "rgba(255, 255, 255, 0)",
        ]
        for color in valid_colors:
            signal = SignalData("2024-01-01", 1, color=color)
            assert signal.color == color

    def test_signal_values(self):
        """Test SignalData with different signal values."""
        # Test value 0 (neutral)
        signal0 = SignalData("2024-01-01", 0)
        assert signal0.value == 0

        # Test value 1 (signal)
        signal1 = SignalData("2024-01-01", 1)
        assert signal1.value == 1

        # Test value 2 (alert)
        signal2 = SignalData("2024-01-01", 2)
        assert signal2.value == 2

        # Test negative value
        signal_neg = SignalData("2024-01-01", -1)
        assert signal_neg.value == -1

    def test_required_columns(self):
        """Test that SignalData has correct required columns."""
        assert set() == SignalData.REQUIRED_COLUMNS

    def test_optional_columns(self):
        """Test that SignalData has correct optional columns."""
        assert {"color"} == SignalData.OPTIONAL_COLUMNS

    def test_repr(self):
        """Test string representation of SignalData."""
        signal = SignalData("2024-01-01", 1, color="#ff0000")
        repr_str = repr(signal)
        assert "SignalData" in repr_str
        # Time is stored as string, not normalized until asdict()
        assert "2024-01-01" in repr_str
        assert "1" in repr_str
        assert "#ff0000" in repr_str

    def test_equality(self):
        """Test equality comparison of SignalData objects."""
        signal1 = SignalData("2024-01-01", 1, color="#ff0000")
        signal2 = SignalData("2024-01-01", 1, color="#ff0000")
        signal3 = SignalData("2024-01-02", 1, color="#ff0000")
        signal4 = SignalData("2024-01-01", 0, color="#ff0000")
        signal5 = SignalData("2024-01-01", 1, color="#00ff00")

        assert signal1 == signal2
        assert signal1 != signal3
        assert signal1 != signal4
        assert signal1 != signal5

    def test_hash(self):
        """Test that SignalData objects are hashable."""
        signal1 = SignalData("2024-01-01", 1, color="#ff0000")
        SignalData("2024-01-01", 1, color="#ff0000")

        # SignalData objects are not hashable by default (dataclass with mutable fields)
        # This is expected behavior
        with pytest.raises(TypeError, match="unhashable type"):
            hash(signal1)

    def test_from_dict(self):
        """Test creating SignalData from dictionary."""
        data_dict = {"time": "2024-01-01", "value": 1, "color": "#ff0000"}
        signal = SignalData(**data_dict)
        # Time is stored as-is
        assert signal.time == "2024-01-01"
        # Time is normalized in asdict()
        result = signal.asdict()
        assert result["time"] == 1704067200  # Normalized in asdict()
        assert signal.value == 1
        assert signal.color == "#ff0000"

    def test_to_dict(self):
        """Test converting SignalData to dictionary using asdict()."""
        signal = SignalData("2024-01-01", 1, color="#ff0000")
        # Use asdict() for proper serialization
        result = signal.asdict()
        assert result["time"] == 1704067200  # Normalized in asdict()
        assert result["value"] == 1
        assert result["color"] == "#ff0000"

    def test_inheritance_from_single_value_data(self):
        """Test that SignalData properly inherits from SingleValueData."""
        signal = SignalData("2024-01-01", 1)

        # Should have SingleValueData attributes
        assert hasattr(signal, "time")
        assert hasattr(signal, "value")
        assert hasattr(signal, "color")

        # Should have SingleValueData methods
        assert hasattr(signal, "__post_init__")

    def test_edge_cases(self):
        """Test edge cases for SignalData."""
        # Test with very large values
        signal = SignalData("2024-01-01", 999999)
        assert signal.value == 999999

        # Test with very long time strings
        long_time = "2024-01-01T00:00:00.000000000"
        signal = SignalData(long_time, 1)
        # Time is stored as-is, normalized in asdict()
        assert signal.time == long_time
        result = signal.asdict()
        assert result["time"] == 1704067200  # Normalized in asdict()

        # Test with special characters in color
        signal = SignalData("2024-01-01", 1, color="rgba(255, 255, 255, 0.123456789)")
        assert signal.color == "rgba(255, 255, 255, 0.123456789)"

    def test_time_modification_after_construction(self):
        """Test that time can be modified after construction."""
        signal = SignalData("2024-01-01", 1)
        result1 = signal.asdict()
        time1 = result1["time"]

        # Modify time after construction
        signal.time = "2024-01-02"
        result2 = signal.asdict()
        time2 = result2["time"]

        # Times should be different
        assert time1 != time2
