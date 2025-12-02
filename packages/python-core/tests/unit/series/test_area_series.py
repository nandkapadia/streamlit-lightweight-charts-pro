"""Tests for AreaSeries class.

This module contains comprehensive tests for the AreaSeries class,
covering construction, styling options, serialization, and edge cases.
"""

# pylint: disable=no-member
import json

import pandas as pd
import pytest
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.series.area import AreaSeries
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.data.marker import BarMarker
from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.exceptions import (
    ColumnMappingRequiredError,
    DataFrameValidationError,
    DataItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions.enums import (
    LineStyle,
    MarkerPosition,
    MarkerShape,
)


class TestAreaSeriesConstruction:
    """Test cases for AreaSeries construction."""

    def test_standard_construction(self):
        """Test standard AreaSeries construction."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        assert series.data == data
        assert series.chart_type == "area"
        assert series.visible is True
        assert series.price_scale_id == ""
        assert series.pane_id == 0
        assert series.top_color == "#2196F3"
        assert series.bottom_color == "rgba(33, 150, 243, 0.0)"
        assert series.relative_gradient is False
        assert series.invert_filled_area is False
        assert isinstance(series.line_options, LineOptions)

    def test_construction_with_custom_parameters(self):
        """Test AreaSeries construction with custom parameters."""
        data = [SingleValueData(time=1640995200, value=100)]
        line_options = LineOptions(color="#ff0000", line_width=2)
        series = AreaSeries(
            data=data,
            visible=False,
            price_scale_id="left",
            pane_id=1,
        )
        series.line_options = line_options
        series.top_color = "#ff0000"
        series.bottom_color = "#00ff00"
        series.relative_gradient = True
        series.invert_filled_area = True

        assert series.data == data
        assert series.visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1
        assert series.top_color == "#ff0000"
        assert series.bottom_color == "#00ff00"
        assert series.relative_gradient is True
        assert series.invert_filled_area is True
        assert series.line_options == line_options

    def test_construction_with_dataframe(self):
        """Test AreaSeries construction with DataFrame."""
        test_dataframe = pd.DataFrame({"datetime": [1640995200, 1641081600], "value": [100, 105]})

        series = AreaSeries(
            data=test_dataframe,
            column_mapping={"time": "datetime", "value": "value"},
        )

        assert len(series.data) == 2
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100
        assert series.data[1].time == 1641081600
        assert series.data[1].value == 105

    def test_construction_with_pandas_series(self):
        """Test AreaSeries construction with pandas Series."""
        series_data = pd.Series([100, 105], index=[1640995200, 1641081600])

        area_series = AreaSeries(data=series_data, column_mapping={"time": "index", "value": 0})

        assert len(area_series.data) == 2
        assert area_series.data[0].time == 1640995200
        assert area_series.data[0].value == 100
        assert area_series.data[1].time == 1641081600
        assert area_series.data[1].value == 105


class TestAreaSeriesProperties:
    """Test cases for AreaSeries properties."""

    def test_chart_type_property(self):
        """Test chart_type property."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)
        assert series.chart_type == "area"

    def test_line_options_property(self):
        """Test line_options property getter and setter."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        # Test getter - should be LineOptions instance by default
        assert isinstance(series.line_options, LineOptions)

        # Test setter
        line_options = LineOptions(color="#ff0000", line_width=2)
        series.line_options = line_options
        assert series.line_options == line_options

    def test_color_properties(self):
        """Test color properties."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        assert series.top_color == "#2196F3"
        assert series.bottom_color == "rgba(33, 150, 243, 0.0)"

    def test_gradient_properties(self):
        """Test gradient properties."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        assert series.relative_gradient is False
        assert series.invert_filled_area is False


class TestAreaSeriesSerialization:
    """Test cases for AreaSeries serialization."""

    def test_to_dict_basic(self):
        """Test basic to_dict functionality."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        result = series.asdict()

        assert result["type"] == "area"
        assert result["data"] == [{"time": 1640995200, "value": 100}]
        assert "options" in result
        assert result["paneId"] == 0

    def test_to_dict_with_line_options(self):
        """Test to_dict with line options."""
        data = [SingleValueData(time=1640995200, value=100)]
        line_options = LineOptions(color="#ff0000", line_width=2)
        series = AreaSeries(data=data)
        series.line_options = line_options

        result = series.asdict()

        assert result["type"] == "area"
        assert "options" in result
        options = result["options"]
        # Line options are now sent nested
        assert "lineOptions" in options
        assert options["lineOptions"]["color"] == "#ff0000"
        assert options["lineOptions"]["lineWidth"] == 2

    def test_to_dict_with_area_colors(self):
        """Test to_dict with area colors."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)
        series.top_color = "#ff0000"
        series.bottom_color = "#00ff00"

        result = series.asdict()

        options = result["options"]
        assert options["topColor"] == "#ff0000"
        assert options["bottomColor"] == "#00ff00"

    def test_to_dict_with_gradient_options(self):
        """Test to_dict with gradient options."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)
        series.relative_gradient = True
        series.invert_filled_area = True

        result = series.asdict()

        options = result["options"]
        assert options["relativeGradient"] is True
        assert options["invertFilledArea"] is True

    def test_to_dict_with_all_options(self):
        """Test to_dict with all options."""
        data = [SingleValueData(time=1640995200, value=100)]
        line_options = LineOptions(color="#ff0000", line_width=2)
        series = AreaSeries(data=data)
        series.line_options = line_options
        series.top_color = "#ff0000"
        series.bottom_color = "#00ff00"
        series.relative_gradient = True
        series.invert_filled_area = True

        result = series.asdict()

        options = result["options"]
        # Line options are now sent nested
        assert "lineOptions" in options
        assert options["lineOptions"]["color"] == "#ff0000"
        assert options["lineOptions"]["lineWidth"] == 2
        assert options["topColor"] == "#ff0000"
        assert options["bottomColor"] == "#00ff00"
        assert options["relativeGradient"] is True
        assert options["invertFilledArea"] is True

    def test_to_dict_with_markers(self):
        """Test to_dict with markers."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
            size=10,
        )
        series.add_marker(marker)

        result = series.asdict()

        assert "markers" in result
        assert len(result["markers"]) == 1
        marker = result["markers"][0]
        assert marker["time"] == 1640995200
        assert marker["position"] == "aboveBar"
        assert marker["color"] == "#ff0000"
        assert marker["shape"] == "circle"
        assert marker["text"] == "Test"
        assert marker["size"] == 10

    def test_to_dict_with_price_lines(self):
        """Test to_dict with price lines."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        price_line = PriceLineOptions(
            price=100,
            color="#ff0000",
            line_width=2,
            line_style=LineStyle.DASHED,
        )
        series.add_price_line(price_line)

        result = series.asdict()

        assert "priceLines" in result
        assert len(result["priceLines"]) == 1
        price_line_config = result["priceLines"][0]
        assert price_line_config["price"] == 100
        assert price_line_config["color"] == "#ff0000"
        assert price_line_config["lineWidth"] == 2
        assert price_line_config["lineStyle"] == 2


class TestAreaSeriesMethods:
    """Test cases for AreaSeries methods."""

    def test_add_marker_method(self):
        """Test add_marker method."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
            size=10,
        )
        series.add_marker(marker)

        assert len(series.markers) == 1
        marker = series.markers[0]
        assert marker.time == 1640995200
        assert marker.position == MarkerPosition.ABOVE_BAR
        assert marker.color == "#ff0000"
        assert marker.shape == MarkerShape.CIRCLE
        assert marker.text == "Test"
        assert marker.size == 10

    def test_add_price_line_method(self):
        """Test add_price_line method."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        price_line = PriceLineOptions(
            price=100,
            color="#ff0000",
            line_width=2,
            line_style=LineStyle.DASHED,
        )
        series.add_price_line(price_line)

        assert len(series.price_lines) == 1
        added_price_line = series.price_lines[0]
        assert added_price_line.price == 100
        assert added_price_line.color == "#ff0000"
        assert added_price_line.line_width == 2
        assert added_price_line.line_style == LineStyle.DASHED

    def test_method_chaining(self):
        """Test method chaining."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        # Test chaining add_marker and add_price_line
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
            size=10,
        )
        series.add_marker(marker).add_price_line(PriceLineOptions(price=100, color="#ff0000"))

        assert len(series.markers) == 1
        assert len(series.price_lines) == 1


class TestAreaSeriesDataHandling:
    """Test cases for AreaSeries data handling."""

    def test_from_dataframe_classmethod(self):
        """Test from_dataframe class method."""
        test_dataframe = pd.DataFrame({"datetime": [1640995200, 1641081600], "value": [100, 105]})

        series = AreaSeries.from_dataframe(
            test_dataframe,
            column_mapping={"time": "datetime", "value": "value"},
        )

        assert len(series.data) == 2
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100
        assert series.data[1].time == 1641081600
        assert series.data[1].value == 105

    def test_from_dataframe_with_index_columns(self):
        """Test from_dataframe with index columns."""
        test_dataframe = pd.DataFrame({"value": [100, 105]}, index=[1640995200, 1641081600])
        test_dataframe.index.name = "time"  # Name the index

        series = AreaSeries.from_dataframe(
            test_dataframe,
            column_mapping={"time": "index", "value": "value"},
        )

        assert len(series.data) == 2
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100


class TestAreaSeriesValidation:
    """Test cases for AreaSeries validation."""

    def test_validate_pane_config(self):
        """Test validate_pane_config method."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data, pane_id=0)

        # Should not raise an exception
        series._validate_pane_config()

    def test_validate_pane_config_invalid(self):
        """Test validate_pane_config with invalid pane_id."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data, pane_id=-1)

        with pytest.raises(ValueValidationError):
            series._validate_pane_config()

    def test_error_handling_invalid_data(self):
        """Test error handling with invalid data."""
        series = AreaSeries(data=None)
        assert series.data == []

    def test_error_handling_missing_required_columns(self):
        """Test error handling with missing required columns."""
        test_dataframe = pd.DataFrame({"value": [100, 105]})

        with pytest.raises(ColumnMappingRequiredError):
            AreaSeries(data=test_dataframe)

    def test_error_handling_invalid_data_type(self):
        """Test error handling with invalid data type."""
        with pytest.raises(DataFrameValidationError):
            AreaSeries(data="invalid")

    def test_error_handling_dataframe_without_column_mapping(self):
        """Test error handling with DataFrame without column mapping."""
        test_dataframe = pd.DataFrame({"value": [100, 105]})

        with pytest.raises(ColumnMappingRequiredError):
            AreaSeries(data=test_dataframe)

    def test_error_handling_invalid_list_data(self):
        """Test error handling with invalid list data."""
        invalid_data = [{"time": 1640995200, "value": 100}]  # Not SingleValueData objects

        with pytest.raises(DataItemsTypeError):
            AreaSeries(data=invalid_data)


class TestAreaSeriesEdgeCases:
    """Test cases for AreaSeries edge cases."""

    def test_empty_data_handling(self):
        """Test handling of empty data."""
        series = AreaSeries(data=[])

        assert series.data == []
        result = series.asdict()
        assert result["data"] == []

    def test_single_data_point(self):
        """Test handling of single data point."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        result = series.asdict()
        assert len(result["data"]) == 1
        assert result["data"][0]["time"] == 1640995200
        assert result["data"][0]["value"] == 100

    def test_large_dataset(self):
        """Test handling of large dataset."""
        data = [SingleValueData(time=1640995200 + i, value=100 + i) for i in range(1000)]
        series = AreaSeries(data=data)

        assert len(series.data) == 1000
        result = series.asdict()
        assert len(result["data"]) == 1000

    def test_none_line_options(self):
        """Test handling of None line_options."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)
        series.line_options = None

        assert series.line_options is None
        result = series.asdict()
        assert "options" in result

    def test_empty_string_colors(self):
        """Test handling of empty string colors."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)
        series.top_color = ""
        series.bottom_color = ""

        result = series.asdict()
        options = result["options"]
        # Empty strings should be omitted
        assert "topColor" not in options
        assert "bottomColor" not in options


class TestAreaSeriesInheritance:
    """Test cases for AreaSeries inheritance."""

    def test_inherits_from_series(self):
        """Test that AreaSeries inherits from Series."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        assert isinstance(series, Series)

    def test_has_required_methods(self):
        """Test that AreaSeries has required methods."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        # Test that required methods exist
        assert hasattr(series, "asdict")
        assert hasattr(series, "add_marker")
        assert hasattr(series, "add_price_line")

        assert hasattr(series, "from_dataframe")

    def test_has_required_properties(self):
        """Test that AreaSeries has required properties."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        # Test that required properties exist
        assert hasattr(series, "chart_type")
        assert hasattr(series, "data")
        assert hasattr(series, "visible")
        assert hasattr(series, "markers")
        assert hasattr(series, "price_lines")


class TestAreaSeriesJsonStructure:
    """Test cases for AreaSeries JSON structure matching frontend expectations."""

    def test_basic_json_structure(self):
        """Test basic JSON structure matches frontend SeriesConfig interface."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        result = series.asdict()

        # Check required fields from SeriesConfig interface
        assert "type" in result
        assert result["type"] == "area"
        assert "data" in result
        assert isinstance(result["data"], list)
        assert len(result["data"]) == 1

        # Check data structure
        data_point = result["data"][0]
        assert "time" in data_point
        assert "value" in data_point
        assert data_point["time"] == 1640995200
        assert data_point["value"] == 100

    def test_area_series_options_structure(self):
        """Test area series options match frontend expectations."""
        data = [SingleValueData(time=1640995200, value=100)]
        line_options = LineOptions(color="#ff0000", line_width=3)
        series = AreaSeries(data=data)
        series.line_options = line_options
        series.top_color = "#ff0000"
        series.bottom_color = "#00ff00"
        series.relative_gradient = True
        series.invert_filled_area = True

        result = series.asdict()

        # Check options structure
        assert "options" in result
        options = result["options"]

        # Line options (from LineOptions object) - now nested
        assert "lineOptions" in options
        assert options["lineOptions"]["color"] == "#ff0000"
        assert options["lineOptions"]["lineWidth"] == 3

        # Area-specific options
        assert "topColor" in options
        assert options["topColor"] == "#ff0000"
        assert "bottomColor" in options
        assert options["bottomColor"] == "#00ff00"
        assert "relativeGradient" in options
        assert options["relativeGradient"] is True
        assert "invertFilledArea" in options
        assert options["invertFilledArea"] is True

    def test_markers_json_structure(self):
        """Test markers structure matches frontend SeriesMarker interface."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test Marker",
            size=10,
        )
        series.add_marker(marker)

        result = series.asdict()

        # Check markers structure
        assert "markers" in result
        assert len(result["markers"]) == 1

        marker = result["markers"][0]
        assert "time" in marker
        assert "position" in marker
        assert "color" in marker
        assert "shape" in marker
        assert "text" in marker
        assert "size" in marker

        assert marker["time"] == 1640995200
        assert marker["position"] == "aboveBar"
        assert marker["color"] == "#ff0000"
        assert marker["shape"] == "circle"
        assert marker["text"] == "Test Marker"
        assert marker["size"] == 10

    def test_price_lines_json_structure(self):
        """Test price lines structure matches frontend expectations."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        price_line = PriceLineOptions(
            price=100,
            color="#ff0000",
            line_width=2,
            line_style=LineStyle.DASHED,
        )
        series.add_price_line(price_line)

        result = series.asdict()

        # Check price lines structure
        assert "priceLines" in result
        assert len(result["priceLines"]) == 1

        price_line_config = result["priceLines"][0]
        assert "price" in price_line_config
        assert "color" in price_line_config
        assert "lineWidth" in price_line_config
        assert "lineStyle" in price_line_config

        assert price_line_config["price"] == 100
        assert price_line_config["color"] == "#ff0000"
        assert price_line_config["lineWidth"] == 2
        assert price_line_config["lineStyle"] == 2

    def test_complete_json_structure(self):
        """Test complete JSON structure with all components."""
        data = [SingleValueData(time=1640995200, value=100)]
        line_options = LineOptions(color="#ff0000", line_width=2)
        series = AreaSeries(data=data, pane_id=1)
        series.line_options = line_options
        series.top_color = "#ff0000"
        series.bottom_color = "#00ff00"

        # Add marker
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
            size=10,
        )
        series.add_marker(marker)

        # Add price line
        price_line = PriceLineOptions(
            price=100,
            color="#ff0000",
            line_width=2,
            line_style=LineStyle.DASHED,
        )
        series.add_price_line(price_line)

        result = series.asdict()

        # Check complete structure
        assert "type" in result
        assert "data" in result
        assert "options" in result
        assert "markers" in result
        assert "priceLines" in result
        assert "paneId" in result

        # Verify options
        options = result["options"]
        # Line options are now nested
        assert "lineOptions" in options
        assert "color" in options["lineOptions"]
        assert "lineWidth" in options["lineOptions"]
        assert "topColor" in options
        assert "bottomColor" in options
        assert "relativeGradient" in options
        assert "invertFilledArea" in options

        # Verify markers
        assert len(result["markers"]) == 1
        assert result["markers"][0]["time"] == 1640995200
        assert result["markers"][0]["position"] == "aboveBar"

        # Verify price lines
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["price"] == 100
        assert result["priceLines"][0]["color"] == "#ff0000"

        # Verify pane_id
        assert result["paneId"] == 1

    def test_json_serialization_consistency(self):
        """Test that JSON serialization is consistent and can be parsed."""
        data = [SingleValueData(time=1640995200, value=100)]
        line_options = LineOptions(color="#ff0000", line_width=3)
        series = AreaSeries(data=data)
        series.line_options = line_options
        series.top_color = "#ff0000"
        series.bottom_color = "#00ff00"

        result = series.asdict()

        # Test that the result can be serialized to JSON
        json_str = json.dumps(result)
        assert isinstance(json_str, str)

        # Test that the JSON can be parsed back
        parsed = json.loads(json_str)
        assert parsed["type"] == "area"
        assert len(parsed["data"]) == 1
        assert parsed["data"][0]["time"] == 1640995200
        assert parsed["data"][0]["value"] == 100

    def test_frontend_compatibility(self):
        """Test that the JSON structure is compatible with frontend SeriesConfig interface."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        result = series.asdict()

        # Frontend expects these fields in SeriesConfig
        assert "type" in result
        assert "data" in result
        assert "options" in result
        assert "paneId" in result

        # Type should be lowercase to match frontend expectations
        assert result["type"] == "area"

        # Data should be an array
        assert isinstance(result["data"], list)

        # Options should be an object
        assert isinstance(result["options"], dict)

        # pane_id should be a number
        assert isinstance(result["paneId"], int)

    def test_empty_options_handling(self):
        """Test that empty options are handled correctly."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        result = series.asdict()

        # Should still have options object even if empty
        assert "options" in result
        assert isinstance(result["options"], dict)

        # Check that essential options are present and not empty
        assert result["options"]["topColor"] != ""
        assert result["options"]["bottomColor"] != ""
        # Line options are now nested
        assert "lineOptions" in result["options"]
        assert result["options"]["lineOptions"]["color"] != ""

    def test_missing_optional_fields(self):
        """Test that missing optional fields are handled correctly."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        result = series.asdict()

        # Should not have markers or priceLines if none were added
        assert "markers" not in result
        assert "priceLines" not in result

        # Should have basic structure
        assert "type" in result
        assert "data" in result
        assert "options" in result
        assert "paneId" in result


class TestAreaSeriesPropertyValidation:
    """Test property validation for AreaSeries."""

    def test_property_validation_errors(self):
        """Test property validation errors for AreaSeries."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        # Test line_options validation
        with pytest.raises(TypeValidationError):
            series.line_options = "invalid"

        # Test top_color validation
        with pytest.raises(TypeValidationError):
            series.top_color = 123

        # Test bottom_color validation
        with pytest.raises(TypeValidationError):
            series.bottom_color = 456

        # Test relative_gradient validation - should raise TypeError for non-boolean values
        with pytest.raises(TypeValidationError):
            series.relative_gradient = "invalid"

        # Test valid boolean value
        series.relative_gradient = True
        assert series.relative_gradient is True

        # Test invert_filled_area validation - should raise TypeError for non-boolean values
        with pytest.raises(TypeValidationError):
            series.invert_filled_area = "invalid"

        # Test valid boolean value
        series.invert_filled_area = True
        assert series.invert_filled_area is True

    def test_property_setters_with_valid_values(self):
        """Test property setters with valid values."""
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        # Test line_options setter with valid value
        line_options = LineOptions(color="#ff0000", line_width=2)
        series.line_options = line_options
        assert series.line_options == line_options

        # Test line_options setter with None
        series.line_options = None
        assert series.line_options is None

        # Test color setters
        series.top_color = "#00ff00"
        assert series.top_color == "#00ff00"

        series.bottom_color = "#0000ff"
        assert series.bottom_color == "#0000ff"

        # Test boolean setters
        series.relative_gradient = True
        assert series.relative_gradient is True

        series.invert_filled_area = True
        assert series.invert_filled_area is True


class TestAreaSeriesConstructorEdgeCases:
    """Test constructor edge cases for AreaSeries."""

    def test_constructor_with_none_data(self):
        """Test AreaSeries constructor with None data."""
        series = AreaSeries(data=None)
        assert series.data == []

    def test_constructor_with_empty_list(self):
        """Test AreaSeries constructor with empty list."""
        series = AreaSeries(data=[])
        assert series.data == []

    def test_constructor_with_invalid_data_type(self):
        """Test AreaSeries constructor with invalid data type."""
        with pytest.raises(DataFrameValidationError):
            AreaSeries(data=123)

    def test_constructor_with_dataframe_without_column_mapping(self):
        """Test AreaSeries constructor with DataFrame without column mapping."""
        test_dataframe = pd.DataFrame({"datetime": [1640995200], "value": [100]})

        with pytest.raises(ColumnMappingRequiredError):
            AreaSeries(data=test_dataframe)

    def test_constructor_with_invalid_list_data(self):
        """Test AreaSeries constructor with invalid list data."""
        invalid_data = [{"time": 1640995200, "value": 100}]  # Dict instead of SingleValueData

        with pytest.raises(DataItemsTypeError):
            AreaSeries(data=invalid_data)

    def test_data_dict_property_with_empty_data(self):
        """Test data_dict property with empty data."""
        series = AreaSeries(data=[])
        result = series.data_dict
        assert result == []

    def test_data_dict_property_with_dict_data(self):
        """Test data_dict property with dict data."""
        # Create a series with valid data first, then test data_dict property
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        # Test that data_dict returns the expected format
        result = series.data_dict
        assert len(result) == 1
        assert result[0]["time"] == 1640995200
        assert result[0]["value"] == 100

    def test_data_dict_property_with_objects_with_to_dict(self):
        """Test data_dict property with objects that have to_dict method."""
        # Create a series with valid data first, then test data_dict property
        data = [SingleValueData(time=1640995200, value=100)]
        series = AreaSeries(data=data)

        # Test that data_dict returns the expected format
        result = series.data_dict
        assert len(result) == 1
        assert result[0]["time"] == 1640995200
        assert result[0]["value"] == 100
