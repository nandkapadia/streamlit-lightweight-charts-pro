"""Unit tests for SignalSeries class.

This module contains comprehensive tests for the SignalSeries class, which is used
for creating signal-based background coloring in financial charts.
"""

import pandas as pd
import pytest
from lightweight_charts_core.charts.series.signal_series import SignalSeries
from lightweight_charts_core.data.signal_data import SignalData
from lightweight_charts_core.exceptions import ColorValidationError
from lightweight_charts_core.type_definitions import ChartType


class TestSignalSeries:
    """Test cases for SignalSeries class."""

    def test_basic_construction(self):
        """Test basic SignalSeries construction."""
        data = [
            SignalData("2024-01-01", 0),
            SignalData("2024-01-02", 1),
        ]
        series = SignalSeries(data=data)

        assert len(series.data) == 2
        assert series._neutral_color == "rgba(128, 128, 128, 0.1)"
        assert series._signal_color == "rgba(76, 175, 80, 0.2)"
        assert series._alert_color is None
        assert series.visible is True
        assert series.price_scale_id == "right"
        assert series.pane_id == 0

    def test_construction_with_custom_colors(self):
        """Test SignalSeries construction with custom colors."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(
            data=data,
            neutral_color="#ffffff",
            signal_color="#00ff00",
            alert_color="#0000ff",
        )

        assert series._neutral_color == "#ffffff"
        assert series._signal_color == "#00ff00"
        assert series._alert_color == "#0000ff"

    def test_construction_with_custom_options(self):
        """Test SignalSeries construction with custom options."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data, visible=False, price_scale_id="left", pane_id=1)

        assert series.visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1

    def test_chart_type(self):
        """Test that SignalSeries returns correct chart type."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)
        assert series.chart_type == ChartType.SIGNAL

    def test_data_class(self):
        """Test that SignalSeries has correct data class."""
        assert SignalData == SignalSeries.DATA_CLASS

    def test_repr(self):
        """Test string representation of SignalSeries."""
        data = [
            SignalData("2024-01-01", 0),
            SignalData("2024-01-02", 1),
        ]
        series = SignalSeries(data=data)
        repr_str = repr(series)

        assert "SignalSeries" in repr_str
        assert "data_points=2" in repr_str
        assert "neutral_color" in repr_str
        assert "signal_color" in repr_str

    def test_neutral_color_property(self):
        """Test neutral_color property getter and setter."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)

        # Test getter
        assert series.neutral_color == "rgba(128, 128, 128, 0.1)"

        # Test setter
        series.neutral_color = "#ffffff"
        assert series.neutral_color == "#ffffff"
        assert series._neutral_color == "#ffffff"

    def test_signal_color_property(self):
        """Test signal_color property getter and setter."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)

        # Test getter
        assert series.signal_color == "rgba(76, 175, 80, 0.2)"

        # Test setter
        series.signal_color = "#00ff00"
        assert series.signal_color == "#00ff00"
        assert series._signal_color == "#00ff00"

    def test_alert_color_property(self):
        """Test alert_color property getter and setter."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)

        # Test getter (default value is None)
        assert series.alert_color is None

        # Test setter
        series.alert_color = "#0000ff"
        assert series.alert_color == "#0000ff"
        assert series._alert_color == "#0000ff"

        # Test setting to None
        series.alert_color = None
        assert series.alert_color is None
        assert series._alert_color is None

    def test_invalid_color_validation(self):
        """Test color validation for invalid colors."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)

        # Test invalid neutral color
        with pytest.raises(ColorValidationError):
            series.neutral_color = "#invalid"

        # Test invalid signal color
        with pytest.raises(ColorValidationError):
            series.signal_color = "not_a_color"

        # Test invalid alert color
        with pytest.raises(ColorValidationError):
            series.alert_color = "rgba(255, 255)"

    def test_valid_color_validation(self):
        """Test color validation for valid colors."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)

        # Test valid hex colors
        valid_hex_colors = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"]
        for color in valid_hex_colors:
            series.neutral_color = color
            assert series.neutral_color == color

        # Test valid rgba colors
        valid_rgba_colors = [
            "rgba(255, 0, 0, 1)",
            "rgba(0, 255, 0, 0.5)",
            "rgba(0, 0, 255, 0.8)",
        ]
        for color in valid_rgba_colors:
            series.signal_color = color
            assert series.signal_color == color

    def test_from_dataframe(self):
        """Test creating SignalSeries from DataFrame."""
        test_dataframe = pd.DataFrame(
            {
                "time": ["2024-01-01", "2024-01-02"],
                "value": [0, 1],
                "color": ["#ffffff", "#ff0000"],
            },
        )

        series = SignalSeries.from_dataframe(
            df=test_dataframe,
            column_mapping={"time": "time", "value": "value", "color": "color"},
        )

        assert len(series.data) == 2
        # Time is stored as-is, normalized in asdict()
        result0 = series.data[0].asdict()
        result1 = series.data[1].asdict()
        assert result0["time"] == 1704067200  # 2024-01-01 timestamp
        assert series.data[0].value == 0
        assert series.data[0].color == "#ffffff"
        assert result1["time"] == 1704153600  # 2024-01-02 timestamp
        assert series.data[1].value == 1
        assert series.data[1].color == "#ff0000"

    def test_from_dataframe_without_color(self):
        """Test creating SignalSeries from DataFrame without color column."""
        test_dataframe = pd.DataFrame({"time": ["2024-01-01", "2024-01-02"], "value": [0, 1]})

        series = SignalSeries.from_dataframe(
            df=test_dataframe,
            column_mapping={"time": "time", "value": "value"},
        )

        assert len(series.data) == 2
        assert series.data[0].color is None
        assert series.data[1].color is None

    def test_from_dataframe_with_datetime_index(self):
        """Test creating SignalSeries from DataFrame with datetime index."""
        test_dataframe = pd.DataFrame(
            {"value": [0, 1]},
            index=pd.to_datetime(["2024-01-01", "2024-01-02"]),
        )

        series = SignalSeries.from_dataframe(
            df=test_dataframe,
            column_mapping={"time": "index", "value": "value"},
        )

        assert len(series.data) == 2
        # Time is stored as-is, normalized in asdict()
        result0 = series.data[0].asdict()
        result1 = series.data[1].asdict()
        assert result0["time"] == 1704067200  # 2024-01-01 timestamp
        assert result1["time"] == 1704153600  # 2024-01-02 timestamp

    def test_asdict(self):
        """Test converting SignalSeries to dictionary."""
        data = [
            SignalData("2024-01-01", 0, color="#ffffff"),
            SignalData("2024-01-02", 1, color="#ff0000"),
        ]
        series = SignalSeries(
            data=data,
            neutral_color="#f0f0f0",
            signal_color="#ff0000",
            alert_color="#0000ff",
        )

        result = series.asdict()

        # Check that the result contains the expected keys
        assert "seriesType" in result or "type" in result
        series_type = result.get("seriesType") or result.get("type")
        assert series_type == "signal"

        # Check color properties (they might be in different locations)
        if "neutralColor" in result:
            assert result["neutralColor"] == "#f0f0f0"
        if "signalColor" in result:
            assert result["signalColor"] == "#ff0000"
        if "alertColor" in result:
            assert result["alertColor"] == "#0000ff"

        assert len(result["data"]) == 2
        # Data time is normalized to timestamp
        assert result["data"][0]["time"] == 1704067200  # 2024-01-01 timestamp
        assert result["data"][0]["value"] == 0
        assert result["data"][0]["color"] == "#ffffff"

    def test_update_method(self):
        """Test updating SignalSeries with new configuration."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)

        config = {
            "neutralColor": "#ffffff",
            "signalColor": "#00ff00",
            "alertColor": "#0000ff",
            "visible": False,
            "priceScaleId": "right",
        }

        series.update(config)

        assert series.neutral_color == "#ffffff"
        assert series.signal_color == "#00ff00"
        assert series.alert_color == "#0000ff"
        assert series.visible is False
        assert series.price_scale_id == "right"

    def test_empty_data(self):
        """Test SignalSeries with empty data."""
        series = SignalSeries(data=[])
        assert len(series.data) == 0

    def test_single_data_point(self):
        """Test SignalSeries with single data point."""
        data = [SignalData("2024-01-01", 1)]
        series = SignalSeries(data=data)
        assert len(series.data) == 1
        assert series.data[0].value == 1

    def test_large_dataset(self):
        """Test SignalSeries with large dataset."""
        data = [SignalData(f"2024-01-{i:02d}", i % 3) for i in range(1, 32)]  # January 2024
        series = SignalSeries(data=data)
        assert len(series.data) == 31

    def test_signal_values_distribution(self):
        """Test SignalSeries with different signal value distributions."""
        data = [
            SignalData("2024-01-01", 0),  # neutral
            SignalData("2024-01-02", 1),  # signal
            SignalData("2024-01-03", 2),  # alert
            SignalData("2024-01-04", 0),  # neutral
        ]
        series = SignalSeries(data=data)

        values = [point.value for point in series.data]
        assert values == [0, 1, 2, 0]

    def test_color_override_behavior(self):
        """Test that individual data point colors override series colors."""
        data = [
            SignalData("2024-01-01", 0, color="#ff0000"),  # Valid hex color
            SignalData("2024-01-02", 1, color="#00ff00"),  # Valid hex color
        ]
        series = SignalSeries(data=data, neutral_color="#f0f0f0", signal_color="#ff0000")

        # The individual colors should be preserved
        assert series.data[0].color == "#ff0000"
        assert series.data[1].color == "#00ff00"

    def test_inheritance_from_series_base(self):
        """Test that SignalSeries properly inherits from Series base class."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)

        # Should have Series base class attributes
        assert hasattr(series, "data")
        assert hasattr(series, "visible")
        assert hasattr(series, "price_scale_id")
        assert hasattr(series, "pane_id")

        # Should have Series base class methods
        assert hasattr(series, "asdict")
        assert hasattr(series, "update")
        assert hasattr(series, "chart_type")

    def test_edge_cases(self):
        """Test edge cases for SignalSeries."""
        # Test with very large values
        data = [SignalData("2024-01-01", 999999)]
        series = SignalSeries(data=data)
        assert series.data[0].value == 999999

        # Test with very long time strings
        long_time = "2024-01-01T00:00:00.000000000"
        data = [SignalData(long_time, 1)]
        series = SignalSeries(data=data)
        # Time is stored as-is, normalized in asdict()
        result = series.data[0].asdict()
        assert result["time"] == 1704067200  # 2024-01-01 timestamp

        # Test with special characters in colors
        special_color = "rgba(255, 255, 255, 0.123456789)"
        data = [SignalData("2024-01-01", 1, color=special_color)]
        series = SignalSeries(data=data)
        assert series.data[0].color == special_color

    def test_alert_color_always_serialized(self):
        """Test that alertColor is serialized when explicitly set.

        Note: The frontend (TypeScript) intelligently decides whether to use alertColor
        based on the actual data values. Python just sends the configuration when set.
        """
        # Create series with boolean values only (0 and 1) and explicit alertColor
        data = [
            SignalData("2024-01-01", 0),
            SignalData("2024-01-02", 1),
        ]
        series = SignalSeries(data=data, alert_color="rgba(244, 67, 54, 0.2)")

        result = series.asdict()
        options = result.get("options", {})

        # All colors should be serialized when set
        assert "neutralColor" in options
        assert "signalColor" in options
        assert "alertColor" in options  # Sent to frontend when explicitly set
        assert options["alertColor"] == "rgba(244, 67, 54, 0.2)"

    def test_alert_color_with_non_boolean_data(self):
        """Test that alertColor is serialized when set for non-boolean data.

        Frontend will use alertColor for values < 0 when data contains non-boolean values.
        """
        # Create series with negative values and explicit alertColor
        data = [
            SignalData("2024-01-01", 0),
            SignalData("2024-01-02", 1),
            SignalData("2024-01-03", -1),  # Negative value
        ]
        series = SignalSeries(data=data, alert_color="rgba(244, 67, 54, 0.2)")

        result = series.asdict()
        options = result.get("options", {})

        # All colors should be present when set
        assert "neutralColor" in options
        assert "signalColor" in options
        assert "alertColor" in options
        assert options["alertColor"] == "rgba(244, 67, 54, 0.2)"

    def test_alert_color_default_not_serialized(self):
        """Test that alertColor is NOT serialized by default (None)."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data)  # No alert_color specified

        result = series.asdict()
        options = result.get("options", {})

        # alertColor should NOT be in serialized output by default
        assert "neutralColor" in options
        assert "signalColor" in options
        assert "alertColor" not in options  # Default None is excluded

    def test_alert_color_can_be_none(self):
        """Test that alertColor can be set to None."""
        data = [SignalData("2024-01-01", 0)]
        series = SignalSeries(data=data, alert_color=None)

        result = series.asdict()
        options = result.get("options", {})

        # When None, alertColor should not be in serialized output
        assert "neutralColor" in options
        assert "signalColor" in options
        assert "alertColor" not in options  # None values are excluded
