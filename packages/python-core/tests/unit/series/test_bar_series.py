"""Tests for BarSeries class.

This module contains comprehensive tests for the BarSeries class,
covering construction, properties, serialization, data handling,
validation, and edge cases.
"""

import json

import pandas as pd
import pytest
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.series.bar_series import BarSeries
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.data.bar_data import BarData
from lightweight_charts_core.data.marker import BarMarker
from lightweight_charts_core.exceptions import (
    ColumnMappingRequiredError,
    DataFrameValidationError,
    DataItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions.enums import ChartType, LineStyle


class TestBarSeriesConstruction:
    """Test BarSeries construction and initialization."""

    def test_standard_construction(self):
        """Test standard BarSeries construction."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        assert series.data == data
        assert series._visible is True
        assert series.price_scale_id == "right"
        assert series.pane_id == 0
        assert series.up_color == "#26a69a"
        assert series.down_color == "#ef5350"
        assert series.open_visible is True
        assert series.thin_bars is True

    def test_construction_with_custom_parameters(self):
        """Test BarSeries construction with custom parameters."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(
            data=data,
            visible=False,
            price_scale_id="left",
            pane_id=1,
        )

        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1

    def test_construction_with_dataframe(self):
        """Test BarSeries construction with DataFrame."""
        test_dataframe = pd.DataFrame(
            {
                "time": [1640995200, 1641081600],
                "open": [100, 105],
                "high": [110, 115],
                "low": [95, 100],
                "close": [105, 110],
            },
        )

        series = BarSeries(
            data=test_dataframe,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
        )

        assert len(series.data) == 2
        assert all(isinstance(item, BarData) for item in series.data)
        assert series.data[0].time == 1640995200
        assert series.data[0].open == 100.0
        assert series.data[1].time == 1641081600
        assert series.data[1].open == 105.0

    def test_construction_with_pandas_series(self):
        """Test BarSeries construction with pandas Series."""
        # Create a DataFrame with OHLC data (Series conversion is complex)
        test_dataframe = pd.DataFrame(
            {"time": [1640995200], "open": [100], "high": [110], "low": [95], "close": [105]},
        )

        bar_series = BarSeries(
            data=test_dataframe,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
        )

        assert len(bar_series.data) == 1
        assert isinstance(bar_series.data[0], BarData)
        assert bar_series.data[0].time == 1640995200
        assert bar_series.data[0].open == 100.0


class TestBarSeriesProperties:
    """Test BarSeries properties and getters/setters."""

    def test_chart_type_property(self):
        """Test chart_type property."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)
        assert series.chart_type == ChartType.BAR

    def test_color_properties(self):
        """Test color-related properties."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        # Test up_color
        series.up_color = "#FF0000"
        assert series.up_color == "#FF0000"

        # Test down_color
        series.down_color = "#00FF00"
        assert series.down_color == "#00FF00"

    def test_boolean_properties(self):
        """Test boolean properties."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        # Test open_visible
        series.open_visible = False
        assert series.open_visible is False

        # Test thin_bars
        series.thin_bars = False
        assert series.thin_bars is False

    def test_property_validation(self):
        """Test property validation."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        # Test color validation
        with pytest.raises(TypeValidationError):
            series.up_color = 123

        with pytest.raises(TypeValidationError):
            series.down_color = None

        # Test boolean validation - should raise TypeValidationError for non-boolean values
        with pytest.raises(TypeValidationError):
            series.open_visible = "True"

        with pytest.raises(TypeValidationError):
            series.thin_bars = 1

        # Test valid boolean values
        series.open_visible = True
        assert series.open_visible is True

        series.thin_bars = True
        assert series.thin_bars is True


class TestBarSeriesSerialization:
    """Test BarSeries serialization methods."""

    def test_to_dict_basic(self):
        """Test basic to_dict functionality."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        result = series.asdict()

        assert result["type"] == "bar"
        assert result["data"] == [data[0].asdict()]
        assert "options" in result
        assert result["options"]["upColor"] == "#26a69a"
        assert result["options"]["downColor"] == "#ef5350"
        assert result["options"]["openVisible"] is True
        assert result["options"]["thinBars"] is True

    def test_to_dict_with_custom_colors(self):
        """Test to_dict with custom colors."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)
        series.up_color = "#FF0000"
        series.down_color = "#00FF00"

        result = series.asdict()

        assert result["options"]["upColor"] == "#FF0000"
        assert result["options"]["downColor"] == "#00FF00"

    def test_to_dict_with_boolean_options(self):
        """Test to_dict with boolean options."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)
        series.open_visible = False
        series.thin_bars = False

        result = series.asdict()

        assert result["options"]["openVisible"] is False
        assert result["options"]["thinBars"] is False

    def test_to_dict_with_markers(self):
        """Test to_dict with markers."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

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

    def test_to_dict_with_price_lines(self):
        """Test to_dict with price lines."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)
        series.add_price_line(PriceLineOptions(None, 100, "#FF0000"))

        result = series.asdict()

        assert "priceLines" in result
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["price"] == 100
        assert result["priceLines"][0]["color"] == "#FF0000"


class TestBarSeriesMethods:
    """Test BarSeries methods."""

    def test_add_marker_method(self):
        """Test add_marker method."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position="aboveBar",
            color="#FF0000",
            shape="circle",
            text="Test Marker",
        )
        series.add_marker(marker)

        assert len(series.markers) == 1
        assert series.markers[0].time == 1640995200
        assert series.markers[0].position == "aboveBar"
        assert series.markers[0].color == "#FF0000"

    def test_add_price_line_method(self):
        """Test add_price_line method."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        price_line = PriceLineOptions(None, 100, "#FF0000")
        series.add_price_line(price_line)

        assert len(series.price_lines) == 1
        assert series.price_lines[0] == price_line

    def test_method_chaining(self):
        """Test method chaining."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        marker = BarMarker(time=1640995200, position="aboveBar", color="#FF0000", shape="circle")
        result = (
            series.add_marker(marker)
            .add_price_line(PriceLineOptions(None, 100, "#FF0000"))
            .set_visible(False)
        )

        assert result is series
        assert len(series.markers) == 1
        assert len(series.price_lines) == 1
        assert series._visible is False


class TestBarSeriesDataHandling:
    """Test BarSeries data handling."""

    def test_from_dataframe_classmethod(self):
        """Test from_dataframe class method."""
        test_dataframe = pd.DataFrame(
            {
                "time": [1640995200, 1641081600],
                "open": [100, 105],
                "high": [110, 115],
                "low": [95, 100],
                "close": [105, 110],
            },
        )

        series = BarSeries.from_dataframe(
            test_dataframe,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
        )

        assert isinstance(series, BarSeries)
        assert len(series.data) == 2
        assert all(isinstance(item, BarData) for item in series.data)

    def test_from_dataframe_with_index_columns(self):
        """Test from_dataframe with index columns."""
        test_dataframe = pd.DataFrame(
            {"open": [100, 105], "high": [110, 115], "low": [95, 100], "close": [105, 110]},
            index=pd.DatetimeIndex(["2022-01-01", "2022-01-02"]),
        )
        test_dataframe.index.name = "time"

        series = BarSeries.from_dataframe(
            test_dataframe,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
        )

        assert len(series.data) == 2
        assert all(isinstance(item, BarData) for item in series.data)


class TestBarSeriesValidation:
    """Test BarSeries validation."""

    def test_validate_pane_config(self):
        """Test validate_pane_config method."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        # Should not raise exception
        series._validate_pane_config()

    def test_validate_pane_config_invalid(self):
        """Test validate_pane_config with invalid pane_id."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)
        series.pane_id = -1

        with pytest.raises(ValueValidationError):
            series._validate_pane_config()

    def test_error_handling_invalid_data(self):
        """Test error handling for invalid data."""
        series = BarSeries(data=None)
        assert series.data == []

    def test_error_handling_missing_required_columns(self):
        """Test error handling for missing required columns."""
        test_dataframe = pd.DataFrame({"value": [100, 105]})

        with pytest.raises(ColumnMappingRequiredError):
            BarSeries(data=test_dataframe)

    def test_error_handling_invalid_data_type(self):
        """Test error handling for invalid data type."""
        with pytest.raises(DataFrameValidationError):
            BarSeries(data="invalid_data")

    def test_error_handling_dataframe_without_column_mapping(self):
        """Test error handling for DataFrame without column mapping."""
        test_dataframe = pd.DataFrame({"value": [100, 105]})

        with pytest.raises(ColumnMappingRequiredError):
            BarSeries(data=test_dataframe)

    def test_error_handling_invalid_list_data(self):
        """Test error handling for invalid list data."""
        with pytest.raises(DataItemsTypeError):
            BarSeries(data=["invalid", "data"])


class TestBarSeriesEdgeCases:
    """Test BarSeries edge cases."""

    def test_empty_data_handling(self):
        """Test handling of empty data."""
        series = BarSeries(data=[])

        assert series.data == []
        result = series.asdict()
        assert result["data"] == []

    def test_single_data_point(self):
        """Test handling of single data point."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        assert len(series.data) == 1
        result = series.asdict()
        assert len(result["data"]) == 1

    def test_large_dataset(self):
        """Test handling of large dataset."""
        data = [
            BarData(time=1640995200 + i, open=100 + i, high=110 + i, low=95 + i, close=105 + i)
            for i in range(1000)
        ]
        series = BarSeries(data=data)

        assert len(series.data) == 1000
        result = series.asdict()
        assert len(result["data"]) == 1000

    def test_empty_string_colors(self):
        """Test handling of empty string colors."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)
        series.up_color = ""
        series.down_color = ""

        result = series.asdict()
        # Empty strings should be omitted from output
        assert "upColor" not in result["options"]
        assert "downColor" not in result["options"]


class TestBarSeriesInheritance:
    """Test BarSeries inheritance and required methods."""

    def test_inherits_from_series(self):
        """Test that BarSeries inherits from Series."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        assert isinstance(series, Series)

    def test_has_required_methods(self):
        """Test that BarSeries has required methods."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        assert hasattr(series, "asdict")
        assert hasattr(series, "add_marker")
        assert hasattr(series, "add_price_line")
        assert hasattr(series, "set_visible")

    def test_has_required_properties(self):
        """Test that BarSeries has required properties."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        assert hasattr(series, "chart_type")
        assert hasattr(series, "data")
        assert hasattr(series, "visible")
        assert hasattr(series, "price_scale_id")
        assert hasattr(series, "pane_id")


class TestBarSeriesJsonStructure:
    """Test BarSeries JSON structure and frontend compatibility."""

    def test_basic_json_structure(self):
        """Test basic JSON structure."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        result = series.asdict()

        # Check required top-level keys
        assert "type" in result
        assert "data" in result
        assert "options" in result

        # Check type
        assert result["type"] == "bar"

        # Check data structure
        assert isinstance(result["data"], list)
        assert len(result["data"]) == 1
        assert "time" in result["data"][0]
        assert "open" in result["data"][0]
        assert "high" in result["data"][0]
        assert "low" in result["data"][0]
        assert "close" in result["data"][0]

    def test_bar_series_options_structure(self):
        """Test bar series options structure."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        result = series.asdict()
        options = result["options"]

        # Check required options
        assert "upColor" in options
        assert "downColor" in options
        assert "openVisible" in options
        assert "thinBars" in options

        # Check default values
        assert options["upColor"] == "#26a69a"
        assert options["downColor"] == "#ef5350"
        assert options["openVisible"] is True
        assert options["thinBars"] is True

    def test_markers_json_structure(self):
        """Test markers JSON structure."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

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
        assert isinstance(result["markers"], list)
        assert len(result["markers"]) == 1

        marker = result["markers"][0]
        assert "time" in marker
        assert "position" in marker
        assert "color" in marker
        assert "shape" in marker
        assert "text" in marker

    def test_price_lines_json_structure(self):
        """Test price lines JSON structure."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)
        series.add_price_line(PriceLineOptions(None, 100, "#FF0000", line_style=LineStyle.DASHED))

        result = series.asdict()

        assert "priceLines" in result
        assert isinstance(result["priceLines"], list)
        assert len(result["priceLines"]) == 1

        price_line = result["priceLines"][0]
        assert "price" in price_line
        assert "color" in price_line
        assert "lineStyle" in price_line
        assert price_line["lineStyle"] == 2  # LineStyle.DASHED

    def test_complete_json_structure(self):
        """Test complete JSON structure with all components."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        # Set custom options
        series.up_color = "#FF0000"
        series.down_color = "#00FF00"
        series.open_visible = False
        series.thin_bars = False

        # Add markers and price lines

        marker = BarMarker(time=1640995200, position="aboveBar", color="#FF0000", shape="circle")
        series.add_marker(marker)
        series.add_price_line(PriceLineOptions(None, 100, "#FF0000"))

        result = series.asdict()

        # Verify all components are present
        assert "type" in result
        assert "data" in result
        assert "options" in result
        assert "markers" in result
        assert "priceLines" in result

        # Verify options are correct
        assert result["options"]["upColor"] == "#FF0000"
        assert result["options"]["downColor"] == "#00FF00"
        assert result["options"]["openVisible"] is False
        assert result["options"]["thinBars"] is False

    def test_json_serialization_consistency(self):
        """Test JSON serialization consistency."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        result1 = series.asdict()
        result2 = series.asdict()

        # Results should be identical
        assert result1 == result2

        # Should be JSON serializable
        json_str = json.dumps(result1)
        assert isinstance(json_str, str)

        # Should be deserializable
        parsed = json.loads(json_str)
        assert parsed == result1

    def test_frontend_compatibility(self):
        """Test frontend compatibility of JSON structure."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        result = series.asdict()

        # Check that the structure matches frontend expectations
        # Based on the frontend types.ts file
        assert "type" in result
        assert result["type"] == "bar"

        if "markers" in result:
            assert isinstance(result["markers"], list)

        if "priceLines" in result:
            assert isinstance(result["priceLines"], list)

        # Options should be a dictionary
        assert isinstance(result["options"], dict)

    def test_empty_options_handling(self):
        """Test handling of empty options."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        # Set empty string colors
        series.up_color = ""
        series.down_color = ""

        result = series.asdict()
        options = result["options"]

        # Empty strings should be omitted
        assert "upColor" not in options
        assert "downColor" not in options

        # Other options should still be present
        assert "openVisible" in options
        assert "thinBars" in options

    def test_missing_optional_fields(self):
        """Test handling of missing optional fields."""
        data = [BarData(time=1640995200, open=100, high=110, low=95, close=105)]
        series = BarSeries(data=data)

        result = series.asdict()

        # Required fields should always be present
        assert "type" in result
        assert "data" in result
        assert "options" in result

        # Optional fields should only be present when they have values
        if not series.markers:
            assert "markers" not in result

        if not series.price_lines:
            assert "priceLines" not in result
