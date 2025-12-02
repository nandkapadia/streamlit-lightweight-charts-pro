"""Tests for BandSeries class.

This module contains comprehensive tests for the BandSeries class,
covering construction, styling options, serialization, and edge cases.
"""

# pylint: disable=no-member,protected-access

import pandas as pd
import pytest
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.series.band import BandSeries
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.data.band import BandData
from lightweight_charts_core.data.marker import BarMarker
from lightweight_charts_core.exceptions import (
    DataFrameValidationError,
    InstanceTypeError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions.enums import (
    LineStyle,
    LineType,
    MarkerPosition,
    MarkerShape,
)


class TestBandSeriesConstruction:
    """Test cases for BandSeries construction."""

    def test_standard_construction(self):
        """Test standard BandSeries construction."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        assert series.data == data
        assert series.chart_type == "band"
        assert series._visible is True
        assert series.price_scale_id == ""
        assert series.pane_id == 0
        assert series.upper_fill_color == "rgba(76, 175, 80, 0.1)"
        assert series.lower_fill_color == "rgba(244, 67, 54, 0.1)"
        assert series.upper_fill is True
        assert series.lower_fill is True
        assert isinstance(series.upper_line, LineOptions)
        assert isinstance(series.middle_line, LineOptions)
        assert isinstance(series.lower_line, LineOptions)

    def test_construction_with_custom_parameters(self):
        """Test BandSeries construction with custom parameters."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(
            data=data,
            visible=False,
            price_scale_id="left",
            pane_id=1,
        )

        assert series.data == data
        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1

    def test_construction_with_dataframe(self):
        """Test BandSeries construction with DataFrame."""
        test_dataframe = pd.DataFrame(
            {
                "datetime": [1640995200, 1641081600],
                "upper": [110.0, 112.0],
                "middle": [105.0, 107.0],
                "lower": [100.0, 102.0],
            },
        )

        series = BandSeries(
            data=test_dataframe,
            column_mapping={
                "time": "datetime",
                "upper": "upper",
                "middle": "middle",
                "lower": "lower",
            },
        )

        assert len(series.data) == 2
        assert series.data[0].time == 1640995200
        assert series.data[0].upper == 110.0
        assert series.data[0].middle == 105.0
        assert series.data[0].lower == 100.0
        assert series.data[1].time == 1641081600
        assert series.data[1].upper == 112.0
        assert series.data[1].middle == 107.0
        assert series.data[1].lower == 102.0

    def test_default_line_options(self):
        """Test default line options values."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Check default colors
        assert series.upper_line.color == "#4CAF50"
        assert series.middle_line.color == "#2196F3"
        assert series.lower_line.color == "#F44336"

        # Check default line widths
        assert series.upper_line.line_width == 2
        assert series.middle_line.line_width == 2
        assert series.lower_line.line_width == 2

        # Check default line styles
        assert series.upper_line.line_style == LineStyle.SOLID
        assert series.middle_line.line_style == LineStyle.SOLID
        assert series.lower_line.line_style == LineStyle.SOLID


class TestBandSeriesProperties:
    """Test cases for BandSeries properties."""

    def test_chart_type_property(self):
        """Test chart_type property."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        assert series.chart_type == "band"

    def test_upper_line_property(self):
        """Test upper_line property."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Test getter
        assert isinstance(series.upper_line, LineOptions)
        assert series.upper_line.color == "#4CAF50"

        # Test setter
        new_options = LineOptions(color="#FF0000", line_width=3)
        series.upper_line = new_options
        assert series.upper_line == new_options
        assert series.upper_line.color == "#FF0000"

    def test_middle_line_property(self):
        """Test middle_line property."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Test getter
        assert isinstance(series.middle_line, LineOptions)
        assert series.middle_line.color == "#2196F3"

        # Test setter
        new_options = LineOptions(color="#00FF00", line_width=4)
        series.middle_line = new_options
        assert series.middle_line == new_options
        assert series.middle_line.color == "#00FF00"

    def test_lower_line_property(self):
        """Test lower_line property."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Test getter
        assert isinstance(series.lower_line, LineOptions)
        assert series.lower_line.color == "#F44336"

        # Test setter
        new_options = LineOptions(color="#0000FF", line_width=5)
        series.lower_line = new_options
        assert series.lower_line == new_options
        assert series.lower_line.color == "#0000FF"

    def test_fill_color_properties(self):
        """Test fill color properties."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Test default values
        assert series.upper_fill_color == "rgba(76, 175, 80, 0.1)"
        assert series.lower_fill_color == "rgba(244, 67, 54, 0.1)"

        # Test setters
        series.upper_fill_color = "rgba(255, 0, 0, 0.5)"
        series.lower_fill_color = "rgba(0, 255, 0, 0.5)"

        assert series.upper_fill_color == "rgba(255, 0, 0, 0.5)"
        assert series.lower_fill_color == "rgba(0, 255, 0, 0.5)"

    def test_fill_visibility_properties(self):
        """Test fill visibility properties."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Test default values
        assert series.upper_fill is True
        assert series.lower_fill is True

        # Test setters
        series.upper_fill = False
        series.lower_fill = False

        assert series.upper_fill is False
        assert series.lower_fill is False

        # Test boolean values
        series.upper_fill = True
        series.lower_fill = True

        assert series.upper_fill is True
        assert series.lower_fill is True

    def test_property_validation(self):
        """Test property validation."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Test invalid line options type
        with pytest.raises(InstanceTypeError):
            series.upper_line = "invalid"

        # Test invalid middle line options type
        with pytest.raises(InstanceTypeError):
            series.middle_line = "invalid"

        with pytest.raises(InstanceTypeError):
            series.lower_line = "invalid"

        # Test invalid fill color type
        with pytest.raises(TypeValidationError):
            series.upper_fill_color = 123

        with pytest.raises(TypeValidationError):
            series.lower_fill_color = 123


class TestBandSeriesSerialization:
    """Test cases for BandSeries serialization."""

    def test_to_dict_basic(self):
        """Test basic to_dict functionality."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        result = series.asdict()

        assert result["type"] == "band"
        assert len(result["data"]) == 1
        assert result["data"][0]["time"] == 1640995200
        assert result["data"][0]["upper"] == 110.0
        assert result["data"][0]["middle"] == 105.0
        assert result["data"][0]["lower"] == 100.0

    def test_to_dict_with_line_options(self):
        """Test to_dict with custom line options."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Customize line options
        series.upper_line.color = "#FF0000"
        series.upper_line.line_width = 3
        series.middle_line.color = "#00FF00"
        series.middle_line.line_style = LineStyle.DOTTED
        series.lower_line.color = "#0000FF"
        series.upper_line.line_type = LineType.CURVED

        result = series.asdict()
        options = result["options"]
        # Check for flattened band series structure with individual line options
        assert "upperLineColor" in options
        assert "middleLineColor" in options
        assert "lowerLineColor" in options

        # Check upper line options (flattened)
        assert options["upperLineColor"] == "#FF0000"
        assert options["upperLineWidth"] == 3
        assert options["upperLineType"] == LineType.CURVED.value

        # Check middle line options (flattened)
        assert options["middleLineColor"] == "#00FF00"
        assert options["middleLineStyle"] == LineStyle.DOTTED.value

        # Check lower line options (flattened)
        assert options["lowerLineColor"] == "#0000FF"

    def test_to_dict_with_fill_colors(self):
        """Test to_dict with custom fill colors."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        series.upper_fill_color = "rgba(255, 0, 0, 0.5)"
        series.lower_fill_color = "rgba(0, 255, 0, 0.5)"

        result = series.asdict()
        options = result["options"]
        # The base class to_dict uses camelCase keys
        assert options["upperFillColor"] == "rgba(255, 0, 0, 0.5)"
        assert options["lowerFillColor"] == "rgba(0, 255, 0, 0.5)"

    def test_to_dict_with_fill_visibility(self):
        """Test to_dict with custom fill visibility."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        series.upper_fill = False
        series.lower_fill = False

        result = series.asdict()
        options = result["options"]
        # The base class to_dict uses camelCase keys
        assert options["upperFill"] is False
        assert options["lowerFill"] is False

        # Test with True values
        series.upper_fill = True
        series.lower_fill = True
        result = series.asdict()
        options = result["options"]
        assert options["upperFill"] is True
        assert options["lowerFill"] is True

    def test_to_dict_with_markers(self):
        """Test to_dict with markers."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            text="Test Marker",
        )
        series.add_marker(marker)

        result = series.asdict()
        assert "markers" in result
        assert len(result["markers"]) == 1
        assert result["markers"][0]["time"] == 1640995200
        assert result["markers"][0]["position"] == MarkerPosition.ABOVE_BAR.value
        assert result["markers"][0]["color"] == "#FF0000"
        assert result["markers"][0]["shape"] == MarkerShape.CIRCLE.value
        assert result["markers"][0]["text"] == "Test Marker"

    def test_to_dict_with_price_lines(self):
        """Test to_dict with price lines."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        price_line = PriceLineOptions(price=105.0, color="#FF0000")
        series.add_price_line(price_line)

        result = series.asdict()
        assert "priceLines" in result
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["price"] == 105.0
        assert result["priceLines"][0]["color"] == "#FF0000"

    def test_to_dict_complete_structure(self):
        """Test complete to_dict structure."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Customize all options
        series.upper_line.color = "#FF0000"
        series.middle_line.color = "#00FF00"
        series.lower_line.color = "#0000FF"
        series.upper_fill_color = "rgba(255, 0, 0, 0.5)"
        series.lower_fill_color = "rgba(0, 255, 0, 0.5)"

        result = series.asdict()
        # Check basic structure
        assert "type" in result
        assert "data" in result
        assert "options" in result
        options = result["options"]
        # Check for flattened band series structure
        assert "upperLineColor" in options
        assert "middleLineColor" in options
        assert "lowerLineColor" in options
        assert options["upperLineColor"] == "#FF0000"
        assert options["middleLineColor"] == "#00FF00"
        assert options["lowerLineColor"] == "#0000FF"
        assert options["upperFillColor"] == "rgba(255, 0, 0, 0.5)"
        assert options["lowerFillColor"] == "rgba(0, 255, 0, 0.5)"

    def test_method_chaining(self):
        """Test method chaining."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Test chaining add_marker and add_price_line

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
        )
        result = series.add_marker(marker).add_price_line(
            PriceLineOptions(price=105.0, color="#FF0000"),
        )

        assert result is series
        assert len(series.markers) == 1
        assert len(series.price_lines) == 1


class TestBandSeriesDataHandling:
    """Test cases for BandSeries data handling."""

    def test_from_dataframe_classmethod(self):
        """Test from_dataframe classmethod."""
        test_dataframe = pd.DataFrame(
            {
                "datetime": [1640995200, 1641081600],
                "upper": [110.0, 112.0],
                "middle": [105.0, 107.0],
                "lower": [100.0, 102.0],
            },
        )

        series = BandSeries.from_dataframe(
            df=test_dataframe,
            column_mapping={
                "time": "datetime",
                "upper": "upper",
                "middle": "middle",
                "lower": "lower",
            },
        )

        assert len(series.data) == 2
        assert series.data[0].time == 1640995200
        assert series.data[0].upper == 110.0
        assert series.data[1].time == 1641081600
        assert series.data[1].upper == 112.0

    def test_dataframe_with_nan_values(self):
        """Test DataFrame handling with NaN values."""
        test_dataframe = pd.DataFrame(
            {
                "datetime": [1640995200, 1641081600, 1641168000],
                "upper": [110.0, float("nan"), 108.0],
                "middle": [105.0, 107.0, float("nan")],
                "lower": [100.0, 102.0, 98.0],
            },
        )

        series = BandSeries(
            data=test_dataframe,
            column_mapping={
                "time": "datetime",
                "upper": "upper",
                "middle": "middle",
                "lower": "lower",
            },
        )

        # NaN values are converted to 0.0, not filtered out
        assert len(series.data) == 3
        assert series.data[0].time == 1640995200
        assert series.data[0].upper == 110.0
        assert series.data[1].upper == 0.0  # NaN converted to 0.0
        assert series.data[2].middle == 0.0  # NaN converted to 0.0


class TestBandSeriesValidation:
    """Test cases for BandSeries validation."""

    def test_validate_pane_config(self):
        """Test validate_pane_config method."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data, pane_id=0)
        # Should not raise any exception
        series._validate_pane_config()

    def test_validate_pane_config_invalid(self):
        """Test validate_pane_config with invalid configuration."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data, pane_id=-1)

        with pytest.raises(ValueValidationError):
            series._validate_pane_config()

    def test_error_handling_invalid_data(self):
        """Test error handling with invalid data."""
        with pytest.raises(DataFrameValidationError):
            BandSeries(data="invalid_data")

    def test_error_handling_missing_required_columns(self):
        """Test error handling with missing required columns."""
        test_dataframe = pd.DataFrame(
            {
                "datetime": [1640995200],
                "upper": [110.0],
                # Missing middle and lower columns
            },
        )

        with pytest.raises(ValueValidationError):
            BandSeries(
                data=test_dataframe,
                column_mapping={
                    "time": "datetime",
                    "upper": "upper",
                    "middle": "middle",
                    "lower": "lower",
                },
            )

    def test_error_handling_invalid_data_type(self):
        """Test error handling with invalid data type."""
        with pytest.raises(DataFrameValidationError):
            BandSeries(data=123)


class TestBandSeriesEdgeCases:
    """Test cases for BandSeries edge cases."""

    def test_empty_data_handling(self):
        """Test handling of empty data."""
        series = BandSeries(data=[])
        assert len(series.data) == 0
        result = series.asdict()
        assert result["data"] == []

    def test_single_data_point(self):
        """Test handling of single data point."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        assert len(series.data) == 1
        result = series.asdict()
        assert len(result["data"]) == 1

    def test_large_dataset(self):
        """Test handling of large dataset."""
        data = [
            BandData(
                time=1640995200 + i * 86400,
                upper=110.0 + i,
                middle=105.0 + i,
                lower=100.0 + i,
            )
            for i in range(100)
        ]
        series = BandSeries(data=data)
        assert len(series.data) == 100
        result = series.asdict()
        assert len(result["data"]) == 100

    def test_empty_string_colors(self):
        """Test handling of empty string colors."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        # Should handle empty strings gracefully
        series.upper_fill_color = ""
        series.lower_fill_color = ""

        result = series.asdict()
        options = result["options"]
        # Empty strings are omitted by base class to_dict
        assert "upperFillColor" not in options
        assert "lowerFillColor" not in options


class TestBandSeriesInheritance:
    """Test cases for BandSeries inheritance."""

    def test_inherits_from_series(self):
        """Test that BandSeries inherits from Series."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        assert isinstance(series, Series)

    def test_has_required_methods(self):
        """Test that BandSeries has required methods."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        required_methods = [
            "asdict",
            "add_marker",
            "add_price_line",
            "clear_markers",
            "clear_price_lines",
            "set_visible",
        ]

        for method in required_methods:
            assert hasattr(series, method)
            assert callable(getattr(series, method))

    def test_has_required_properties(self):
        """Test that BandSeries has required properties."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        required_properties = [
            "chart_type",
            "data",
            "visible",
            "price_scale_id",
            "pane_id",
            "markers",
            "price_lines",
            "price_format",
            "upper_line",
            "middle_line",
            "lower_line",
            "upper_fill_color",
            "lower_fill_color",
            "upper_fill",
            "lower_fill",
        ]

        for prop in required_properties:
            assert hasattr(series, prop)


class TestBandSeriesJsonStructure:
    """Test cases for BandSeries JSON structure."""

    def test_basic_json_structure(self):
        """Test basic JSON structure."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        result = series.asdict()

        # Check basic structure
        assert "type" in result
        assert "data" in result
        assert "options" in result

        # Check type
        assert result["type"] == "band"

        # Check data structure
        assert isinstance(result["data"], list)
        assert len(result["data"]) == 1
        data_point = result["data"][0]
        assert "time" in data_point
        assert "upper" in data_point
        assert "middle" in data_point
        assert "lower" in data_point

    def test_band_series_options_structure(self):
        """Test band series options structure."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        result = series.asdict()
        options = result["options"]
        # Check for the flattened band series structure (LineOptions are flattened)
        for key in [
            "upperLineColor",
            "upperLineWidth",
            "upperLineVisible",
            "middleLineColor",
            "middleLineWidth",
            "middleLineVisible",
            "lowerLineColor",
            "lowerLineWidth",
            "lowerLineVisible",
            "upperFillColor",
            "lowerFillColor",
            "upperFill",
            "lowerFill",
        ]:
            assert key in options

    def test_markers_json_structure(self):
        """Test markers JSON structure."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            text="Test Marker",
            size=10,
        )
        series.add_marker(marker)

        result = series.asdict()
        assert "markers" in result
        markers = result["markers"]
        assert isinstance(markers, list)
        assert len(markers) == 1

        marker = markers[0]
        expected_keys = {"time", "position", "color", "shape", "text", "size"}
        assert set(marker.keys()) == expected_keys

    def test_price_lines_json_structure(self):
        """Test price lines JSON structure."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)

        series.add_price_line(PriceLineOptions(price=105.0, color="#FF0000", line_width=2))

        result = series.asdict()
        assert "priceLines" in result
        price_lines = result["priceLines"]
        assert isinstance(price_lines, list)
        assert len(price_lines) == 1

        price_line = price_lines[0]
        # PriceLineOptions has many more keys than expected
        expected_keys = {"price", "color", "lineWidth", "lineStyle", "axisLabelVisible"}
        for key in expected_keys:
            assert key in price_line, f"Expected key {key} not found in price line"

    def test_complete_json_structure(self):
        """Test complete JSON structure with all options."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        # Add markers and price lines

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)
        series.add_price_line(PriceLineOptions(price=105.0, color="#FF0000"))
        # Customize all options
        series.upper_line.color = "#FF0000"
        series.middle_line.color = "#00FF00"
        series.lower_line.color = "#0000FF"
        series.upper_fill_color = "rgba(255, 0, 0, 0.5)"
        series.lower_fill_color = "rgba(0, 255, 0, 0.5)"
        series.upper_fill = False
        series.lower_fill = True
        result = series.asdict()
        # Check all expected keys
        assert "type" in result
        assert "data" in result
        assert "options" in result
        assert "markers" in result
        assert "priceLines" in result
        options = result["options"]
        # LineOptions are flattened now
        assert options["upperLineColor"] == "#FF0000"
        assert options["middleLineColor"] == "#00FF00"
        assert options["lowerLineColor"] == "#0000FF"
        assert options["upperFillColor"] == "rgba(255, 0, 0, 0.5)"
        assert options["lowerFillColor"] == "rgba(0, 255, 0, 0.5)"
        assert options["upperFill"] is False
        assert options["lowerFill"] is True

    def test_json_serialization_consistency(self):
        """Test JSON serialization consistency."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        # Serialize multiple times
        result1 = series.asdict()
        result2 = series.asdict()
        assert result1 == result2
        # Modify options and serialize again
        series.upper_line.color = "#FF0000"
        result3 = series.asdict()
        assert result1 != result3
        # Verify the change is reflected (flattened structure)
        assert result3["options"]["upperLineColor"] == "#FF0000"

    def test_frontend_compatibility(self):
        """Test frontend compatibility of JSON structure."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        result = series.asdict()
        # Check that all option keys are camelCase
        for key in result["options"]:
            assert key[0].islower() and "_" not in key, f"Key {key} is not camelCase"

    def test_empty_options_handling(self):
        """Test handling of empty options."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        # Set empty strings for colors
        series.upper_fill_color = ""
        series.lower_fill_color = ""
        result = series.asdict()
        options = result["options"]
        # Empty strings are omitted by base class to_dict
        assert "upperFillColor" not in options
        assert "lowerFillColor" not in options

    def test_missing_optional_fields(self):
        """Test handling of missing optional fields."""
        data = [BandData(time=1640995200, upper=110.0, middle=105.0, lower=100.0)]
        series = BandSeries(data=data)
        result = series.asdict()
        # Should not include markers or price lines if not present
        assert "markers" not in result
        assert "priceLines" not in result
        # Should include all required options (flattened structure)
        for option in [
            "upperLineColor",
            "upperLineWidth",
            "middleLineColor",
            "middleLineWidth",
            "lowerLineColor",
            "lowerLineWidth",
            "upperFillColor",
            "lowerFillColor",
            "upperFill",
            "lowerFill",
        ]:
            assert option in result["options"]
