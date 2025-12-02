"""Tests for HistogramSeries class.

This module contains comprehensive tests for the HistogramSeries class,
which represents a histogram series for lightweight charts.
"""

# pylint: disable=no-member,protected-access

import json

import pandas as pd
import pytest
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.charts.series.histogram import HistogramSeries
from lightweight_charts_core.data.histogram_data import HistogramData
from lightweight_charts_core.data.marker import BarMarker
from lightweight_charts_core.exceptions import (
    ColumnMappingRequiredError,
    DataFrameValidationError,
    DataItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions import ChartType


class TestHistogramSeriesConstruction:
    """Test HistogramSeries construction and basic functionality."""

    def test_standard_construction(self):
        """Test standard HistogramSeries construction."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        assert series.data == data
        assert series._visible is True
        assert series.price_scale_id == "right"
        assert series.pane_id == 0
        assert series.color == "#26a69a"
        assert series.base == 0

    def test_construction_with_custom_parameters(self):
        """Test HistogramSeries construction with custom parameters."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data, visible=False, price_scale_id="left", pane_id=1)

        assert series.data == data
        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1
        assert series.color == "#26a69a"
        assert series.base == 0

    def test_construction_with_dataframe(self):
        """Test HistogramSeries construction with DataFrame."""
        test_dataframe = pd.DataFrame(
            {"datetime": ["2022-01-01", "2022-01-02"], "volume": [100, 200]},
        )
        test_dataframe["datetime"] = pd.to_datetime(test_dataframe["datetime"])

        series = HistogramSeries(
            data=test_dataframe,
            column_mapping={"time": "datetime", "value": "volume"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, HistogramData) for d in series.data)
        assert series.data[0].value == 100
        assert series.data[1].value == 200

    def test_construction_with_pandas_series(self):
        """Test HistogramSeries construction with pandas Series."""
        dates = pd.date_range("2022-01-01", periods=3, freq="D")
        values = pd.Series([100, 200, 300], index=dates)

        series = HistogramSeries(
            data=values,
            column_mapping={"time": "index", "value": 0},  # Use column index 0 for values
        )

        assert len(series.data) == 3
        assert all(isinstance(d, HistogramData) for d in series.data)
        assert series.data[0].value == 100
        assert series.data[1].value == 200
        assert series.data[2].value == 300


class TestHistogramSeriesProperties:
    """Test HistogramSeries properties and getters/setters."""

    def test_chart_type_property(self):
        """Test chart_type property."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        assert series.chart_type == ChartType.HISTOGRAM

    def test_color_properties(self):
        """Test color property getter and setter."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        # Test initial value
        assert series.color == "#26a69a"

        # Test setting new value
        series.color = "#FF0000"
        assert series.color == "#FF0000"

        # Test setting another value
        series.color = "#00FF00"
        assert series.color == "#00FF00"

    def test_base_properties(self):
        """Test base property getter and setter."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        # Test initial value
        assert series.base == 0

        # Test setting new value
        series.base = 10.5
        assert series.base == 10.5

        # Test setting integer value
        series.base = 20
        assert series.base == 20.0

    def test_property_validation(self):
        """Test property validation."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        # Test color validation
        with pytest.raises(TypeValidationError, match="color must be string"):
            series.color = 123

        with pytest.raises(TypeValidationError, match="color must be string"):
            series.color = None

        # Test base validation
        with pytest.raises(TypeValidationError, match="base must be number"):
            series.base = "10"

        with pytest.raises(TypeValidationError, match="base must be number"):
            series.base = None


class TestHistogramSeriesSerialization:
    """Test HistogramSeries serialization to dictionary."""

    def test_to_dict_basic(self):
        """Test basic to_dict functionality."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        result = series.asdict()

        assert result["type"] == "histogram"
        assert result["data"] == [{"time": 1640995200, "value": 100.5}]
        assert result["options"]["color"] == "#26a69a"
        assert result["options"]["base"] == 0
        assert result["paneId"] == 0

    def test_to_dict_with_custom_colors(self):
        """Test to_dict with custom colors."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        series.color = "#FF0000"
        series.base = 10.5

        result = series.asdict()
        assert result["options"]["color"] == "#FF0000"
        assert result["options"]["base"] == 10.5

    def test_to_dict_with_markers(self):
        """Test to_dict with markers."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position="aboveBar",
            color="#FF0000",
            shape="circle",
            text="Test Marker",
        )
        series.add_marker(marker)

        result = series.asdict()
        assert "markers" in result
        assert len(result["markers"]) == 1
        assert result["markers"][0]["time"] == 1640995200
        assert result["markers"][0]["position"] == "aboveBar"
        assert result["markers"][0]["color"] == "#FF0000"
        assert result["markers"][0]["shape"] == "circle"
        assert result["markers"][0]["text"] == "Test Marker"

    def test_to_dict_with_price_lines(self):
        """Test to_dict with price lines."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        price_line = PriceLineOptions(price=150.0, color="#FF0000")
        series.add_price_line(price_line)

        result = series.asdict()
        assert "priceLines" in result
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["price"] == 150.0
        assert result["priceLines"][0]["color"] == "#FF0000"

    def test_to_dict_with_empty_data(self):
        """Test to_dict with empty data."""
        series = HistogramSeries(data=[])
        result = series.asdict()

        assert result["type"] == "histogram"
        assert result["data"] == []
        assert result["options"]["color"] == "#26a69a"
        assert result["options"]["base"] == 0


class TestHistogramSeriesMethods:
    """Test HistogramSeries methods and functionality."""

    def test_add_marker_method(self):
        """Test add_marker method."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position="aboveBar",
            color="#FF0000",
            shape="circle",
            text="Test",
        )
        series.add_marker(marker)

        assert len(series.markers) == 1
        assert series.markers[0].time == 1640995200
        assert series.markers[0].position.value == "aboveBar"

    def test_add_price_line_method(self):
        """Test add_price_line method."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        price_line = PriceLineOptions(price=150.0, color="#FF0000")
        series.add_price_line(price_line)

        assert len(series.price_lines) == 1
        assert series.price_lines[0].price == 150.0
        assert series.price_lines[0].color == "#FF0000"

    def test_method_chaining(self):
        """Test method chaining."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        price_line = PriceLineOptions(price=150.0, color="#00FF00")

        marker = BarMarker(
            time=1640995200,
            position="aboveBar",
            color="#FF0000",
            shape="circle",
            text="Test",
        )
        result = series.add_marker(marker).add_price_line(price_line).set_visible(False)

        assert result is series
        assert len(series.markers) == 1
        assert len(series.price_lines) == 1
        assert series._visible is False


class TestHistogramSeriesDataHandling:
    """Test HistogramSeries data handling and processing."""

    def test_from_dataframe_classmethod(self):
        """Test from_dataframe classmethod."""
        test_dataframe = pd.DataFrame(
            {"datetime": ["2022-01-01", "2022-01-02"], "volume": [100, 200]},
        )
        test_dataframe["datetime"] = pd.to_datetime(test_dataframe["datetime"])

        series = HistogramSeries.from_dataframe(
            test_dataframe,
            column_mapping={"time": "datetime", "value": "volume"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, HistogramData) for d in series.data)
        assert series.data[0].value == 100
        assert series.data[1].value == 200

    def test_from_dataframe_with_index_columns(self):
        """Test from_dataframe with index columns."""
        test_dataframe = pd.DataFrame(
            {"volume": [100, 200]},
            index=pd.to_datetime(["2022-01-01", "2022-01-02"]),
        )

        series = HistogramSeries.from_dataframe(
            test_dataframe,
            column_mapping={"time": "datetime", "value": "volume"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, HistogramData) for d in series.data)
        assert series.data[0].value == 100
        assert series.data[1].value == 200


class TestHistogramSeriesValidation:
    """Test HistogramSeries validation and error handling."""

    def test_validate_pane_config(self):
        """Test validate_pane_config method."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        # Valid pane_id
        series.pane_id = 0
        series._validate_pane_config()

        series.pane_id = 5
        series._validate_pane_config()

    def test_validate_pane_config_invalid(self):
        """Test validate_pane_config with invalid pane_id."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        with pytest.raises(ValueValidationError):
            series.pane_id = -1
            series._validate_pane_config()

    def test_error_handling_invalid_data(self):
        """Test error handling with invalid data."""
        with pytest.raises(DataFrameValidationError):
            HistogramSeries(data="invalid_data")

    def test_error_handling_missing_required_columns(self):
        """Test error handling with missing required columns."""
        test_dataframe = pd.DataFrame(
            {"datetime": ["2022-01-01", "2022-01-02"], "wrong_column": [100, 200]},
        )

        with pytest.raises(ValueValidationError):
            HistogramSeries(
                data=test_dataframe,
                column_mapping={"time": "datetime", "value": "volume"},
            )

    def test_error_handling_invalid_data_type(self):
        """Test error handling with invalid data type."""
        with pytest.raises(DataFrameValidationError):
            HistogramSeries(data=123)

    def test_error_handling_dataframe_without_column_mapping(self):
        """Test error handling with DataFrame without column mapping."""
        test_dataframe = pd.DataFrame(
            {"datetime": ["2022-01-01", "2022-01-02"], "volume": [100, 200]},
        )

        with pytest.raises(ColumnMappingRequiredError):
            HistogramSeries(data=test_dataframe)

    def test_error_handling_invalid_list_data(self):
        """Test error handling with invalid list data."""
        with pytest.raises(DataItemsTypeError):
            HistogramSeries(data=["invalid", "data"])


class TestHistogramSeriesEdgeCases:
    """Test HistogramSeries edge cases and limits."""

    def test_empty_data_handling(self):
        """Test handling of empty data."""
        series = HistogramSeries(data=[])
        assert series.data == []

        result = series.asdict()
        assert result["data"] == []

    def test_single_data_point(self):
        """Test handling of single data point."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        assert len(series.data) == 1
        assert series.data[0].value == 100.5

    def test_large_dataset(self):
        """Test handling of large dataset."""
        data = [HistogramData(time=1640995200 + i, value=100 + i) for i in range(1000)]
        series = HistogramSeries(data=data)

        assert len(series.data) == 1000
        assert series.data[0].value == 100
        assert series.data[999].value == 1099

    def test_empty_string_colors(self):
        """Test handling of empty string colors."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        # Should not raise error and empty strings should be omitted
        series.color = ""
        result = series.asdict()
        options = result["options"]
        # Empty strings should be omitted
        assert "color" not in options


class TestHistogramSeriesInheritance:
    """Test HistogramSeries inheritance and interface compliance."""

    def test_inherits_from_series(self):
        """Test that HistogramSeries inherits from Series."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        assert isinstance(series, Series)

    def test_has_required_methods(self):
        """Test that HistogramSeries has required methods."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        assert hasattr(series, "asdict")
        assert hasattr(series, "add_marker")
        assert hasattr(series, "add_price_line")
        assert hasattr(series, "set_visible")

    def test_has_required_properties(self):
        """Test that HistogramSeries has required properties."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        assert hasattr(series, "chart_type")
        assert hasattr(series, "data")
        assert hasattr(series, "visible")
        assert hasattr(series, "price_scale_id")
        assert hasattr(series, "pane_id")


class TestHistogramSeriesJsonStructure:
    """Test HistogramSeries JSON structure and frontend compatibility."""

    def test_basic_json_structure(self):
        """Test basic JSON structure."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        result = series.asdict()

        required_keys = {"type", "data", "options", "paneId"}
        assert all(key in result for key in required_keys)
        assert result["type"] == "histogram"
        assert isinstance(result["data"], list)
        assert isinstance(result["options"], dict)

    def test_histogram_series_options_structure(self):
        """Test histogram series options structure."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        series.color = "#FF0000"
        series.base = 10.5

        result = series.asdict()
        options = result["options"]

        assert "color" in options
        assert "base" in options
        assert options["color"] == "#FF0000"
        assert options["base"] == 10.5

    def test_markers_json_structure(self):
        """Test markers JSON structure."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position="aboveBar",
            color="#FF0000",
            shape="circle",
            text="Test",
        )
        series.add_marker(marker)

        result = series.asdict()
        assert "markers" in result
        assert isinstance(result["markers"], list)
        assert len(result["markers"]) == 1

        marker = result["markers"][0]
        required_marker_keys = {"time", "position", "color", "shape", "text"}
        assert all(key in marker for key in required_marker_keys)

    def test_price_lines_json_structure(self):
        """Test price lines JSON structure."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        price_line = PriceLineOptions(price=150.0, color="#FF0000")
        series.add_price_line(price_line)

        result = series.asdict()
        assert "priceLines" in result
        assert isinstance(result["priceLines"], list)
        assert len(result["priceLines"]) == 1

        price_line_dict = result["priceLines"][0]
        assert "price" in price_line_dict
        assert "color" in price_line_dict
        assert price_line_dict["price"] == 150.0
        assert price_line_dict["color"] == "#FF0000"

    def test_complete_json_structure(self):
        """Test complete JSON structure with all components."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        series.color = "#FF0000"
        series.base = 10.5

        marker = BarMarker(
            time=1640995200,
            position="aboveBar",
            color="#00FF00",
            shape="circle",
            text="Test Marker",
        )
        series.add_marker(marker)
        price_line = PriceLineOptions(price=150.0, color="#0000FF")
        series.add_price_line(price_line)

        result = series.asdict()

        # Check all required keys
        required_keys = {"type", "data", "options", "paneId", "markers", "priceLines"}
        assert all(key in result for key in required_keys)

        # Check data structure
        assert result["type"] == "histogram"
        assert len(result["data"]) == 1
        assert result["data"][0]["time"] == 1640995200
        assert result["data"][0]["value"] == 100.5

        # Check options
        assert result["options"]["color"] == "#FF0000"
        assert result["options"]["base"] == 10.5

        # Check markers
        assert len(result["markers"]) == 1
        assert result["markers"][0]["text"] == "Test Marker"

        # Check price lines
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["price"] == 150.0

    def test_json_serialization_consistency(self):
        """Test JSON serialization consistency."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        result1 = series.asdict()
        result2 = series.asdict()

        assert result1 == result2

    def test_frontend_compatibility(self):
        """Test frontend compatibility of JSON structure."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        series.color = "#FF0000"
        series.base = 10.5

        result = series.asdict()

        # Test JSON serialization
        json_str = json.dumps(result)
        assert isinstance(json_str, str)

        # Test JSON deserialization
        parsed = json.loads(json_str)
        assert parsed["type"] == "histogram"
        assert parsed["options"]["color"] == "#FF0000"
        assert parsed["options"]["base"] == 10.5

    def test_empty_options_handling(self):
        """Test handling of empty options."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        result = series.asdict()
        options = result["options"]

        # Default options should be present
        assert "color" in options
        assert "base" in options
        assert options["color"] == "#26a69a"
        assert options["base"] == 0

    def test_missing_optional_fields(self):
        """Test handling of missing optional fields."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)

        result = series.asdict()

        # Optional fields should not be present if not set
        assert "markers" not in result
        assert "priceLines" not in result
