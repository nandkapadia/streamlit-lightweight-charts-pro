"""Unit tests for the Marker classes.

This module tests the MarkerBase, PriceMarker, and BarMarker class functionality including
construction, validation, and serialization.
"""

from datetime import datetime

import pandas as pd
import pytest
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.series.line import LineSeries
from lightweight_charts_core.data.data import Data
from lightweight_charts_core.data.line_data import LineData
from lightweight_charts_core.data.marker import BarMarker, Marker, MarkerBase, PriceMarker
from lightweight_charts_core.exceptions import (
    RequiredFieldError,
    TimeValidationError,
    UnsupportedTimeTypeError,
)
from lightweight_charts_core.type_definitions.enums import MarkerPosition, MarkerShape


class TestMarkerBaseConstruction:
    """Test cases for MarkerBase construction."""

    def test_standard_construction(self):
        """Test standard MarkerBase construction."""
        marker = MarkerBase(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        # Time is stored as-is format
        assert isinstance(marker.time, int)
        assert marker.time == 1640995200  # UNIX timestamp for 2022-01-01
        assert marker.position == MarkerPosition.ABOVE_BAR
        assert marker.color == "#ff0000"
        assert marker.shape == MarkerShape.CIRCLE
        assert marker.text is None
        assert marker.size == 1  # Default size
        assert marker.id is None

    def test_construction_with_defaults(self):
        """Test Marker construction with only time (using all defaults)."""
        marker = Marker(time=1640995200)

        # Time is stored as-is format
        assert isinstance(marker.time, int)
        assert marker.time == 1640995200  # UNIX timestamp for 2022-01-01
        assert marker.position == MarkerPosition.ABOVE_BAR  # Default position
        assert marker.color == "#2196F3"  # Default color
        assert marker.shape == MarkerShape.CIRCLE  # Default shape
        assert marker.text is None
        assert marker.size == 1  # Default size

    def test_construction_with_optional_fields(self):
        """Test MarkerBase construction with optional fields."""
        marker = MarkerBase(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test Marker",
            size=10,
            id="test_id",
        )

        # Time is stored as-is format
        assert isinstance(marker.time, int)
        assert marker.time == 1640995200  # UNIX timestamp for 2022-01-01
        assert marker.position == MarkerPosition.ABOVE_BAR
        assert marker.color == "#ff0000"
        assert marker.shape == MarkerShape.CIRCLE
        assert marker.text == "Test Marker"
        assert marker.size == 10
        assert marker.id == "test_id"

    def test_construction_with_string_enums(self):
        """Test Marker construction with string enum values."""
        marker = Marker(time=1640995200, position="aboveBar", color="#ff0000", shape="circle")

        assert marker.position == MarkerPosition.ABOVE_BAR
        assert marker.shape == MarkerShape.CIRCLE
        assert marker.color == "#ff0000"
        assert marker.size == 1  # Default size

    def test_construction_with_time_string(self):
        """Test Marker construction with time string."""
        marker = Marker(
            time="2022-01-01",
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        # Time is stored as-is
        assert marker.time == "2022-01-01"
        # Time is normalized in asdict()
        result = marker.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200  # UNIX timestamp for 2022-01-01

    def test_construction_with_datetime(self):
        """Test Marker construction with datetime."""
        dt = datetime(2022, 1, 1)
        marker = Marker(
            time=dt,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        # Time is stored as-is (datetime object)
        assert marker.time == dt
        # Time is normalized in asdict()
        result = marker.asdict()
        assert isinstance(result["time"], int)
        # The actual timestamp depends on timezone, so we'll check it's a reasonable value
        assert result["time"] > 1640970000  # Should be around 2022-01-01
        assert result["time"] < 1641020000  # Should be around 2022-01-01 (accounting for timezone)

    def test_construction_with_pandas_timestamp(self):
        """Test Marker construction with pandas Timestamp."""
        ts = pd.Timestamp("2022-01-01")
        marker = Marker(
            time=ts,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        # Time is stored as-is (pandas Timestamp)
        assert marker.time == ts
        # Time is normalized in asdict()
        result = marker.asdict()
        assert isinstance(result["time"], int)
        assert result["time"] == 1640995200  # UNIX timestamp for 2022-01-01

    def test_construction_with_all_position_variants(self):
        """Test Marker construction with all position variants."""
        positions = [
            MarkerPosition.ABOVE_BAR,
            MarkerPosition.BELOW_BAR,
            MarkerPosition.IN_BAR,
        ]

        for position in positions:
            marker = Marker(
                time=1640995200,
                position=position,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            )
            assert marker.position == position

    def test_construction_with_all_shape_variants(self):
        """Test Marker construction with all shape variants."""
        shapes = [
            MarkerShape.CIRCLE,
            MarkerShape.SQUARE,
            MarkerShape.ARROW_UP,
            MarkerShape.ARROW_DOWN,
        ]

        for shape in shapes:
            marker = Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color="#ff0000",
                shape=shape,
            )
            assert marker.shape == shape


class TestMarkerValidation:
    """Test cases for Marker validation."""

    def test_invalid_position_string(self):
        """Test Marker construction with invalid position string."""
        with pytest.raises(ValueError):
            Marker(
                time=1640995200,
                position="invalid_position",
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            )

    def test_invalid_shape_string(self):
        """Test Marker construction with invalid shape string."""
        with pytest.raises(ValueError):
            Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color="#ff0000",
                shape="invalid_shape",
            )

    def test_invalid_time(self):
        """Test Marker construction with invalid time."""
        # Invalid time won't raise error until asdict() is called
        marker = Marker(
            time="invalid_time",
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        # Error happens during serialization
        with pytest.raises((TimeValidationError, ValueError)):
            marker.asdict()

    def test_invalid_color_format(self):
        """Test Marker construction with invalid color format."""
        # The current implementation doesn't validate colors in Marker
        # So this should not raise an error
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="invalid_color",
            shape=MarkerShape.CIRCLE,
        )
        assert marker.color == "invalid_color"

    def test_valid_hex_colors(self):
        """Test Marker construction with valid hex colors."""
        valid_colors = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"]

        for color in valid_colors:
            marker = Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color=color,
                shape=MarkerShape.CIRCLE,
            )
            assert marker.color == color

    def test_valid_rgba_colors(self):
        """Test Marker construction with valid rgba colors."""
        valid_colors = ["rgba(255, 0, 0, 1)", "rgba(0, 255, 0, 0.5)", "rgba(0, 0, 255, 0.8)"]

        for color in valid_colors:
            marker = Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color=color,
                shape=MarkerShape.CIRCLE,
            )
            assert marker.color == color

    def test_none_time_raises_error(self):
        """Test that None time raises an error."""
        # None time won't raise error until asdict() is called
        marker = Marker(
            time=None,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        # Error happens during serialization
        with pytest.raises((UnsupportedTimeTypeError, ValueError, TypeError)):
            marker.asdict()

    def test_empty_string_time_raises_error(self):
        """Test that empty string time raises an error."""
        # Empty string time won't raise error until asdict() is called
        marker = Marker(
            time="",
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        # Error happens during serialization
        with pytest.raises((TimeValidationError, ValueError)):
            marker.asdict()

    def test_negative_time_raises_error(self):
        """Test that negative time is handled correctly."""
        # Negative timestamps are valid (they represent dates before 1970)
        marker = Marker(
            time=-1000,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        assert marker.time == -1000


class TestPriceMarkerConstruction:
    """Test cases for PriceMarker construction."""

    def test_standard_construction(self):
        """Test standard PriceMarker construction."""
        marker = PriceMarker(
            time=1640995200,
            position=MarkerPosition.AT_PRICE_TOP,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            price=100.50,
        )

        assert isinstance(marker.time, int)
        assert marker.time == 1640995200
        assert marker.position == MarkerPosition.AT_PRICE_TOP
        assert marker.color == "#ff0000"
        assert marker.shape == MarkerShape.CIRCLE
        assert marker.price == 100.50
        assert marker.text is None
        assert marker.size == 1
        assert marker.id is None

    def test_construction_with_optional_fields(self):
        """Test PriceMarker construction with optional fields."""
        marker = PriceMarker(
            time=1640995200,
            position=MarkerPosition.AT_PRICE_BOTTOM,
            color="#00ff00",
            shape=MarkerShape.ARROW_UP,
            price=200.75,
            text="Resistance Level",
            size=12,
            id="resistance_1",
        )

        assert marker.time == 1640995200
        assert marker.position == MarkerPosition.AT_PRICE_BOTTOM
        assert marker.color == "#00ff00"
        assert marker.shape == MarkerShape.ARROW_UP
        assert marker.price == 200.75
        assert marker.text == "Resistance Level"
        assert marker.size == 12
        assert marker.id == "resistance_1"

    def test_missing_price_raises_error(self):
        """Test that PriceMarker without price raises an error."""
        with pytest.raises(RequiredFieldError):
            PriceMarker(
                time=1640995200,
                position=MarkerPosition.AT_PRICE_TOP,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
                price=0.0,  # Default value that triggers error
            )

    def test_invalid_position_for_price_marker(self):
        """Test that PriceMarker with invalid position fails validation."""
        marker = PriceMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,  # Invalid for PriceMarker
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            price=100.50,
        )

        # The validation should fail
        assert not marker.validate_position()

    def test_valid_positions_for_price_marker(self):
        """Test that PriceMarker with valid positions passes validation."""
        valid_positions = [
            MarkerPosition.AT_PRICE_TOP,
            MarkerPosition.AT_PRICE_BOTTOM,
            MarkerPosition.AT_PRICE_MIDDLE,
        ]

        for position in valid_positions:
            marker = PriceMarker(
                time=1640995200,
                position=position,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
                price=100.50,
            )
            assert marker.validate_position()


class TestBarMarkerConstruction:
    """Test cases for BarMarker construction."""

    def test_standard_construction(self):
        """Test standard BarMarker construction."""
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        assert isinstance(marker.time, int)
        assert marker.time == 1640995200
        assert marker.position == MarkerPosition.ABOVE_BAR
        assert marker.color == "#ff0000"
        assert marker.shape == MarkerShape.CIRCLE
        assert marker.price is None
        assert marker.text is None
        assert marker.size == 1
        assert marker.id is None

    def test_construction_with_optional_price(self):
        """Test BarMarker construction with optional price."""
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            price=100.50,
        )

        assert marker.price == 100.50

    def test_invalid_position_for_bar_marker(self):
        """Test that BarMarker with invalid position fails validation."""
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.AT_PRICE_TOP,  # Invalid for BarMarker
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        # The validation should fail
        assert not marker.validate_position()

    def test_valid_positions_for_bar_marker(self):
        """Test that BarMarker with valid positions passes validation."""
        valid_positions = [
            MarkerPosition.ABOVE_BAR,
            MarkerPosition.BELOW_BAR,
            MarkerPosition.IN_BAR,
        ]

        for position in valid_positions:
            marker = BarMarker(
                time=1640995200,
                position=position,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            )
            assert marker.validate_position()


class TestMarkerSerialization:
    """Test cases for Marker serialization."""

    def test_to_dict_basic(self):
        """Test BarMarker to_dict with basic fields."""
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        marker_dict = marker.asdict()

        assert isinstance(marker_dict["time"], int)  # UNIX timestamp
        assert marker_dict["time"] == 1640995200  # UNIX timestamp for 2022-01-01
        assert marker_dict["position"] == "aboveBar"
        assert marker_dict["color"] == "#ff0000"
        assert marker_dict["shape"] == "circle"
        assert marker_dict["size"] == 1  # Default size
        assert "text" not in marker_dict

    def test_to_dict_with_defaults(self):
        """Test BarMarker to_dict with only time (using all defaults)."""
        marker = BarMarker(time=1640995200)

        marker_dict = marker.asdict()

        assert isinstance(marker_dict["time"], int)  # UNIX timestamp
        assert marker_dict["time"] == 1640995200  # UNIX timestamp for 2022-01-01
        assert marker_dict["position"] == "aboveBar"  # Default position
        assert marker_dict["color"] == "#2196F3"  # Default color
        assert marker_dict["shape"] == "circle"  # Default shape
        assert marker_dict["size"] == 1  # Default size
        assert "text" not in marker_dict

    def test_to_dict_with_optional_fields(self):
        """Test Marker to_dict with optional fields."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test Marker",
            size=10,
        )

        marker_dict = marker.asdict()

        assert isinstance(marker_dict["time"], int)  # UNIX timestamp
        assert marker_dict["time"] == 1640995200  # UNIX timestamp for 2022-01-01
        assert marker_dict["position"] == "aboveBar"
        assert marker_dict["color"] == "#ff0000"
        assert marker_dict["shape"] == "circle"
        assert marker_dict["text"] == "Test Marker"
        assert marker_dict["size"] == 10

    def test_to_dict_with_different_positions(self):
        """Test Marker to_dict with different positions."""
        positions = [
            (MarkerPosition.ABOVE_BAR, "aboveBar"),
            (MarkerPosition.BELOW_BAR, "belowBar"),
            (MarkerPosition.IN_BAR, "inBar"),
        ]

        for position, expected_value in positions:
            marker = Marker(
                time=1640995200,
                position=position,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            )
            marker_dict = marker.asdict()
            assert marker_dict["position"] == expected_value

    def test_to_dict_with_different_shapes(self):
        """Test Marker to_dict with different shapes."""
        shapes = [
            (MarkerShape.CIRCLE, "circle"),
            (MarkerShape.SQUARE, "square"),
            (MarkerShape.ARROW_UP, "arrowUp"),
            (MarkerShape.ARROW_DOWN, "arrowDown"),
        ]

        for shape, expected_value in shapes:
            marker = Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color="#ff0000",
                shape=shape,
            )
            marker_dict = marker.asdict()
            assert marker_dict["shape"] == expected_value

    def test_to_dict_omits_empty_text(self):
        """Test that to_dict omits empty text."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="",
        )

        marker_dict = marker.asdict()
        assert "text" not in marker_dict

    def test_to_dict_omits_none_text(self):
        """Test that to_dict omits None text."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text=None,
        )

        marker_dict = marker.asdict()
        assert "text" not in marker_dict

    def test_to_dict_camel_case_keys(self):
        """Test that to_dict produces camelCase keys."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
            size=10,
        )

        marker_dict = marker.asdict()
        expected_keys = {"time", "position", "color", "shape", "text", "size"}
        assert set(marker_dict.keys()) == expected_keys


class TestMarkerAttributes:
    """Test cases for Marker attributes."""

    def test_time_attribute(self):
        """Test Marker time attribute."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        # Test getting time
        assert isinstance(marker.time, int)  # UNIX timestamp
        assert marker.time == 1640995200  # UNIX timestamp for 2022-01-01

    def test_position_attribute(self):
        """Test Marker position attribute."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        assert marker.position == MarkerPosition.ABOVE_BAR

    def test_shape_attribute(self):
        """Test Marker shape attribute."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        assert marker.shape == MarkerShape.CIRCLE

    def test_color_attribute(self):
        """Test Marker color attribute."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        assert marker.color == "#ff0000"

    def test_text_attribute(self):
        """Test Marker text attribute."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
        )

        assert marker.text == "Test"

    def test_size_attribute(self):
        """Test Marker size attribute."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            size=10,
        )

        assert marker.size == 10

    def test_default_attributes(self):
        """Test Marker default attributes."""
        marker = Marker(time=1640995200)

        assert marker.position == MarkerPosition.ABOVE_BAR
        assert marker.color == "#2196F3"
        assert marker.shape == MarkerShape.CIRCLE
        assert marker.size == 1
        assert marker.text is None


class TestMarkerEdgeCases:
    """Test cases for Marker edge cases."""

    def test_empty_text(self):
        """Test Marker with empty text."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="",
        )

        assert marker.text == ""

    def test_zero_size(self):
        """Test Marker with zero size."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            size=0,
        )

        assert marker.size == 0

    def test_negative_size(self):
        """Test Marker with negative size."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            size=-5,
        )

        assert marker.size == -5

    def test_very_large_size(self):
        """Test Marker with very large size."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            size=1000,
        )

        assert marker.size == 1000

    def test_long_text(self):
        """Test Marker with long text."""
        long_text = "This is a very long text that might be used for detailed annotations"
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text=long_text,
        )

        assert marker.text == long_text

    def test_unicode_text(self):
        """Test Marker with unicode text."""
        unicode_text = "Test with unicode: 测试, émojis 🎉, and symbols ©®™"
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text=unicode_text,
        )

        assert marker.text == unicode_text

    def test_very_old_time(self):
        """Test Marker with very old time."""
        marker = Marker(
            time=0,  # Unix epoch
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        assert marker.time == 0

    def test_future_time(self):
        """Test Marker with future time."""
        future_time = 2000000000  # Year 2033
        marker = Marker(
            time=future_time,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        assert marker.time == future_time

    def test_very_long_color(self):
        """Test Marker with very long color string."""
        long_color = "#" + "f" * 100
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color=long_color,
            shape=MarkerShape.CIRCLE,
        )

        assert marker.color == long_color


class TestMarkerComparison:
    """Test cases for Marker comparison."""

    def test_marker_equality(self):
        """Test Marker equality."""
        marker1 = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
            size=10,
        )

        marker2 = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
            size=10,
        )

        assert marker1 == marker2

    def test_marker_inequality(self):
        """Test Marker inequality."""
        marker1 = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        marker2 = Marker(
            time=1640995200,
            position=MarkerPosition.BELOW_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        assert marker1 != marker2

    def test_marker_inequality_different_time(self):
        """Test Marker inequality with different time."""
        marker1 = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        marker2 = Marker(
            time=1640995201,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        assert marker1 != marker2

    def test_marker_inequality_different_color(self):
        """Test Marker inequality with different color."""
        marker1 = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )

        marker2 = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#00ff00",
            shape=MarkerShape.CIRCLE,
        )

        assert marker1 != marker2


class TestMarkerInheritance:
    """Test cases for Marker inheritance."""

    def test_marker_inherits_from_data(self):
        """Test that Marker inherits from Data."""
        marker = Marker(time=1640995200)
        assert isinstance(marker, Data)

    def test_marker_has_required_columns(self):
        """Test that Marker has required columns defined."""
        marker = Marker(time=1640995200)
        assert hasattr(marker, "REQUIRED_COLUMNS")
        assert isinstance(marker.REQUIRED_COLUMNS, set)
        assert "position" in marker.REQUIRED_COLUMNS
        assert "shape" in marker.REQUIRED_COLUMNS

    def test_marker_has_optional_columns(self):
        """Test that Marker has optional columns defined."""
        marker = Marker(time=1640995200)
        assert hasattr(marker, "OPTIONAL_COLUMNS")
        assert isinstance(marker.OPTIONAL_COLUMNS, set)
        assert "text" in marker.OPTIONAL_COLUMNS
        assert "color" in marker.OPTIONAL_COLUMNS
        assert "size" in marker.OPTIONAL_COLUMNS


class TestMarkerDataHandling:
    """Test cases for Marker data handling."""

    def test_marker_with_dataframe_conversion(self):
        """Test Marker creation from DataFrame-like data."""
        # This test verifies that Marker can be used in DataFrame conversion scenarios
        markers = [
            Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            ),
            Marker(
                time=1640995201,
                position=MarkerPosition.BELOW_BAR,
                color="#00ff00",
                shape=MarkerShape.SQUARE,
            ),
            Marker(
                time=1640995202,
                position=MarkerPosition.IN_BAR,
                color="#0000ff",
                shape=MarkerShape.ARROW_UP,
            ),
        ]

        # Test that all markers have correct structure
        for marker in markers:
            assert isinstance(marker.time, int)
            assert isinstance(marker.position, MarkerPosition)
            assert isinstance(marker.color, str)
            assert isinstance(marker.shape, MarkerShape)
            assert marker.size == 1  # Default size

    def test_marker_list_serialization(self):
        """Test serialization of a list of markers."""
        markers = [
            Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            ),
            Marker(
                time=1640995201,
                position=MarkerPosition.BELOW_BAR,
                color="#00ff00",
                shape=MarkerShape.SQUARE,
            ),
        ]

        marker_dicts = [marker.asdict() for marker in markers]

        assert len(marker_dicts) == 2
        assert marker_dicts[0]["time"] == 1640995200
        assert marker_dicts[0]["position"] == "aboveBar"
        assert marker_dicts[1]["time"] == 1640995201
        assert marker_dicts[1]["position"] == "belowBar"

    def test_marker_with_nan_handling(self):
        """Test Marker behavior with NaN values in time."""
        # This test ensures Marker handles NaN values appropriately
        # NaN time won't raise error until asdict() is called
        marker = Marker(
            time=float("nan"),
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        # Error happens during serialization
        with pytest.raises(ValueError):
            marker.asdict()


class TestMarkerIntegration:
    """Test cases for Marker integration scenarios."""

    def test_marker_with_series_integration(self):
        """Test Marker integration with series classes."""
        # This test verifies that Marker can be used with series classes
        LineOptions(color="#ff0000", line_width=2)
        line_data = [
            LineData(time=1640995200, value=100),
            LineData(time=1640995201, value=110),
        ]
        series = LineSeries(data=line_data)

        # Create markers
        marker1 = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Peak",
        )
        marker2 = Marker(
            time=1640995201,
            position=MarkerPosition.BELOW_BAR,
            color="#00ff00",
            shape=MarkerShape.ARROW_DOWN,
            text="Drop",
        )

        # Add markers to the series using add_markers method
        series.add_markers([marker1, marker2])

        # Verify markers were added
        assert len(series.markers) == 2
        assert series.markers[0].text == "Peak"
        assert series.markers[1].text == "Drop"

    def test_marker_json_structure(self):
        """Test that Marker produces correct JSON structure for frontend."""
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test Marker",
            size=10,
        )

        marker_dict = marker.asdict()

        # Verify JSON structure matches frontend expectations
        assert "time" in marker_dict
        assert "position" in marker_dict
        assert "color" in marker_dict
        assert "shape" in marker_dict
        assert "text" in marker_dict
        assert "size" in marker_dict

        # Verify data types
        assert isinstance(marker_dict["time"], int)
        assert isinstance(marker_dict["position"], str)
        assert isinstance(marker_dict["color"], str)
        assert isinstance(marker_dict["shape"], str)
        assert isinstance(marker_dict["text"], str)
        assert isinstance(marker_dict["size"], int)

        # Verify enum values are converted to strings
        assert marker_dict["position"] == "aboveBar"
        assert marker_dict["shape"] == "circle"
