"""Tests for BaselineSeries class.

This module contains comprehensive tests for the BaselineSeries class,
which represents a baseline chart series with support for top and bottom
area styling with individual color controls.
"""

import pandas as pd
import pytest
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.charts.series.baseline import BaselineSeries
from lightweight_charts_core.data.baseline_data import BaselineData
from lightweight_charts_core.data.marker import BarMarker
from lightweight_charts_core.exceptions import (
    BaseValueFormatError,
    ColorValidationError,
    ColumnMappingRequiredError,
    DataFrameValidationError,
    DataItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions import ChartType
from lightweight_charts_core.type_definitions.enums import MarkerPosition, MarkerShape


class TestBaselineSeriesConstruction:
    """Test BaselineSeries construction and basic functionality."""

    def test_standard_construction(self):
        """Test standard BaselineSeries construction."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        assert series.data == data
        assert series._visible is True
        assert series.price_scale_id == "right"
        assert series.pane_id == 0
        assert series.chart_type == ChartType.BASELINE

    def test_construction_with_baseline_options(self):
        """Test BaselineSeries construction with baseline-specific options set via properties."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Set baseline-specific options via properties
        series.base_value = 150.0
        series.relative_gradient = True
        series.top_fill_color1 = "#FF0000"
        series.top_fill_color2 = "#00FF00"
        series.top_line_color = "#0000FF"
        series.bottom_fill_color1 = "rgba(255,0,0,0.5)"
        series.bottom_fill_color2 = "rgba(0,255,0,0.5)"
        series.bottom_line_color = "rgba(0,0,255,0.5)"

        assert series.base_value == {"type": "price", "price": 150.0}
        assert series.relative_gradient is True
        assert series.top_fill_color1 == "#FF0000"
        assert series.top_fill_color2 == "#00FF00"
        assert series.top_line_color == "#0000FF"
        assert series.bottom_fill_color1 == "rgba(255,0,0,0.5)"
        assert series.bottom_fill_color2 == "rgba(0,255,0,0.5)"
        assert series.bottom_line_color == "rgba(0,0,255,0.5)"

    def test_construction_with_dict_base_value(self):
        """Test BaselineSeries construction with dict base_value set via property."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Set base_value via property
        series.base_value = {"type": "price", "price": 200.0}
        assert series.base_value == {"type": "price", "price": 200.0}

    def test_construction_with_dataframe(self):
        """Test BaselineSeries construction with DataFrame."""
        test_dataframe = pd.DataFrame({"time": [1640995200, 1641081600], "value": [100.5, 105.2]})
        series = BaselineSeries(
            data=test_dataframe,
            column_mapping={"time": "time", "value": "value"},
        )

        assert len(series.data) == 2
        assert isinstance(series.data[0], BaselineData)
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100.5

    def test_construction_with_pandas_series(self):
        """Test BaselineSeries construction with pandas Series."""
        series_data = pd.Series([100.5, 105.2], index=[1640995200, 1641081600])
        series = BaselineSeries(data=series_data, column_mapping={"time": "index", "value": 0})

        assert len(series.data) == 2
        assert isinstance(series.data[0], BaselineData)
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100.5

    def test_construction_with_empty_data(self):
        """Test BaselineSeries construction with empty data."""
        series = BaselineSeries(data=[])
        assert series.data == []
        assert series._visible is True
        assert series.price_scale_id == "right"
        assert series.pane_id == 0

    def test_construction_with_custom_parameters(self):
        """Test BaselineSeries construction with custom parameters."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data, visible=False, price_scale_id="left", pane_id=1)

        assert series.data == data
        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1


class TestBaselineSeriesProperties:
    """Test BaselineSeries property getters and setters."""

    def test_base_value_property(self):
        """Test base_value property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test getter
        assert series.base_value == {"type": "price", "price": 0}

        # Test setter with number
        series.base_value = 150.0
        assert series.base_value == {"type": "price", "price": 150.0}

        # Test setter with dict
        series.base_value = {"type": "price", "price": 200.0}
        assert series.base_value == {"type": "price", "price": 200.0}

    def test_relative_gradient_property(self):
        """Test relative_gradient property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test getter
        assert series.relative_gradient is False

        # Test setter
        series.relative_gradient = True
        assert series.relative_gradient is True

        series.relative_gradient = False
        assert series.relative_gradient is False

    def test_top_fill_color1_property(self):
        """Test top_fill_color1 property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test getter
        assert series.top_fill_color1 == "rgba(38, 166, 154, 0.28)"

        # Test setter
        series.top_fill_color1 = "#FF0000"
        assert series.top_fill_color1 == "#FF0000"

    def test_top_fill_color2_property(self):
        """Test top_fill_color2 property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test getter
        assert series.top_fill_color2 == "rgba(38, 166, 154, 0.05)"

        # Test setter
        series.top_fill_color2 = "#00FF00"
        assert series.top_fill_color2 == "#00FF00"

    def test_top_line_color_property(self):
        """Test top_line_color property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test getter
        assert series.top_line_color == "rgba(38, 166, 154, 1)"

        # Test setter
        series.top_line_color = "#0000FF"
        assert series.top_line_color == "#0000FF"

    def test_bottom_fill_color1_property(self):
        """Test bottom_fill_color1 property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test getter
        assert series.bottom_fill_color1 == "rgba(239, 83, 80, 0.05)"

        # Test setter
        series.bottom_fill_color1 = "rgba(255,0,0,0.5)"
        assert series.bottom_fill_color1 == "rgba(255,0,0,0.5)"

    def test_bottom_fill_color2_property(self):
        """Test bottom_fill_color2 property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test getter
        assert series.bottom_fill_color2 == "rgba(239, 83, 80, 0.28)"

        # Test setter
        series.bottom_fill_color2 = "rgba(0,255,0,0.5)"
        assert series.bottom_fill_color2 == "rgba(0,255,0,0.5)"

    def test_bottom_line_color_property(self):
        """Test bottom_line_color property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test getter
        assert series.bottom_line_color == "rgba(239, 83, 80, 1)"

        # Test setter
        series.bottom_line_color = "rgba(0,0,255,0.5)"
        assert series.bottom_line_color == "rgba(0,0,255,0.5)"

    def test_line_options_property(self):
        """Test line_options property getter and setter."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test that line_options is initialized
        assert series.line_options is not None
        assert hasattr(series.line_options, "color")
        assert hasattr(series.line_options, "line_width")


class TestBaselineSeriesValidation:
    """Test BaselineSeries validation and error handling."""

    def test_validation_invalid_base_value_dict(self):
        """Test validation with invalid base_value dict."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        with pytest.raises(BaseValueFormatError):
            series.base_value = {"price": 100}

    def test_validation_invalid_base_value_type(self):
        """Test validation with invalid base_value type."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        with pytest.raises(BaseValueFormatError):
            series.base_value = "invalid"

    def test_validation_invalid_top_fill_color1(self):
        """Test validation with invalid top_fill_color1."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        with pytest.raises(ColorValidationError):
            series.top_fill_color1 = "invalid_color"

    def test_validation_invalid_top_fill_color2(self):
        """Test validation with invalid top_fill_color2."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        with pytest.raises(ColorValidationError):
            series.top_fill_color2 = "invalid_color"

    def test_validation_invalid_top_line_color(self):
        """Test validation with invalid top_line_color."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        with pytest.raises(ColorValidationError, match="Invalid color format for top_line_color"):
            series.top_line_color = "invalid_color"

    def test_validation_invalid_bottom_fill_color1(self):
        """Test validation with invalid bottom_fill_color1."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        with pytest.raises(
            ColorValidationError,
            match="Invalid color format for bottom_fill_color1",
        ):
            series.bottom_fill_color1 = "invalid_color"

    def test_validation_invalid_bottom_fill_color2(self):
        """Test validation with invalid bottom_fill_color2."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        with pytest.raises(
            ColorValidationError,
            match="Invalid color format for bottom_fill_color2",
        ):
            series.bottom_fill_color2 = "invalid_color"

    def test_validation_invalid_bottom_line_color(self):
        """Test validation with invalid bottom_line_color."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        with pytest.raises(
            ColorValidationError,
            match="Invalid color format for bottom_line_color",
        ):
            series.bottom_line_color = "invalid_color"

    def test_validation_dataframe_without_column_mapping(self):
        """Test validation when DataFrame is provided without column_mapping."""
        test_dataframe = pd.DataFrame({"time": [1640995200, 1641081600], "value": [100.5, 105.2]})

        with pytest.raises(ColumnMappingRequiredError):
            BaselineSeries(data=test_dataframe)

    def test_validation_invalid_data_type(self):
        """Test validation with invalid data type."""
        with pytest.raises(
            DataFrameValidationError,
            match=(
                "data must be a list of SingleValueData objects, DataFrame, or Series, got <class"
                " 'str'>"
            ),
        ):
            BaselineSeries(data="invalid_data")

    def test_validation_invalid_list_data(self):
        """Test validation with invalid list data."""
        with pytest.raises(
            DataItemsTypeError,
            match="All items in data list must be instances of Data or its subclasses",
        ):
            BaselineSeries(data=["invalid", "data"])

    def test_validation_negative_pane_id(self):
        """Test validation with negative pane_id."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data, pane_id=-1)

        with pytest.raises(ValueValidationError, match="pane_id must be non-negative"):
            series.asdict()


class TestBaselineSeriesSerialization:
    """Test BaselineSeries serialization to dictionary."""

    def test_to_dict_basic(self):
        """Test basic to_dict functionality."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        result = series.asdict()

        assert result["type"] == "baseline"
        assert result["data"] == [{"time": 1640995200, "value": 100.5}]
        assert "options" in result
        assert result["options"]["baseValue"] == {"type": "price", "price": 0}
        assert result["options"]["relativeGradient"] is False
        assert result["options"]["topFillColor1"] == "rgba(38, 166, 154, 0.28)"
        assert result["options"]["topFillColor2"] == "rgba(38, 166, 154, 0.05)"
        assert result["options"]["topLineColor"] == "rgba(38, 166, 154, 1)"
        assert result["options"]["bottomFillColor1"] == "rgba(239, 83, 80, 0.05)"
        assert result["options"]["bottomFillColor2"] == "rgba(239, 83, 80, 0.28)"
        assert result["options"]["bottomLineColor"] == "rgba(239, 83, 80, 1)"

    def test_to_dict_with_custom_options(self):
        """Test to_dict with custom baseline options set via properties."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Set custom options via properties
        series.base_value = 150.0
        series.relative_gradient = True
        series.top_fill_color1 = "#FF0000"
        series.top_fill_color2 = "#00FF00"
        series.top_line_color = "#0000FF"
        series.bottom_fill_color1 = "rgba(255,0,0,0.5)"
        series.bottom_fill_color2 = "rgba(0,255,0,0.5)"
        series.bottom_line_color = "rgba(0,0,255,0.5)"

        result = series.asdict()

        assert result["options"]["baseValue"] == {"type": "price", "price": 150.0}
        assert result["options"]["relativeGradient"] is True
        assert result["options"]["topFillColor1"] == "#FF0000"
        assert result["options"]["topFillColor2"] == "#00FF00"
        assert result["options"]["topLineColor"] == "#0000FF"
        assert result["options"]["bottomFillColor1"] == "rgba(255,0,0,0.5)"
        assert result["options"]["bottomFillColor2"] == "rgba(0,255,0,0.5)"
        assert result["options"]["bottomLineColor"] == "rgba(0,0,255,0.5)"

    def test_to_dict_includes_line_options(self):
        """Test that to_dict includes LineOptions properties."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        result = series.asdict()

        # Check that LineOptions properties are included - now nested
        assert "lineOptions" in result["options"]
        line_opts = result["options"]["lineOptions"]
        assert "color" in line_opts
        assert "lineStyle" in line_opts
        assert "lineWidth" in line_opts
        assert "lineType" in line_opts
        assert "lineVisible" in line_opts
        assert "pointMarkersVisible" in line_opts
        assert "crosshairMarkerVisible" in line_opts
        assert "lastPriceAnimation" in line_opts

    def test_to_dict_with_markers(self):
        """Test to_dict with markers."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Add a marker using the correct method signature

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            size=1,
            text="Test Marker",
        )
        series.add_marker(marker)

        result = series.asdict()
        assert "markers" in result
        assert len(result["markers"]) == 1
        assert result["markers"][0]["time"] == 1640995200
        assert result["markers"][0]["position"] == "aboveBar"
        assert result["markers"][0]["shape"] == "circle"
        assert result["markers"][0]["color"] == "#FF0000"

    def test_to_dict_with_price_lines(self):
        """Test to_dict with price lines."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Add a price line
        price_line = PriceLineOptions(price=150.0, color="#FF0000")
        series.add_price_line(price_line)

        result = series.asdict()
        assert "priceLines" in result
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["price"] == 150.0
        assert result["priceLines"][0]["color"] == "#FF0000"

    def test_to_dict_without_markers_or_price_lines(self):
        """Test to_dict without markers or price lines (should not include empty arrays)."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        result = series.asdict()

        # Should not include empty markers or priceLines arrays
        assert "markers" not in result
        assert "priceLines" not in result


class TestBaselineSeriesMethods:
    """Test BaselineSeries methods."""

    def test_add_marker_method(self):
        """Test add_marker method."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Add marker using the correct method signature

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            size=1,
            text="Test Marker",
        )
        series.add_marker(marker)

        assert len(series.markers) == 1
        assert series.markers[0].time == 1640995200
        assert series.markers[0].position == MarkerPosition.ABOVE_BAR
        assert series.markers[0].color == "#FF0000"

    def test_add_price_line_method(self):
        """Test add_price_line method."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        price_line = PriceLineOptions(price=150.0, color="#FF0000")
        series.add_price_line(price_line)

        assert len(series.price_lines) == 1
        assert series.price_lines[0] == price_line

    def test_method_chaining(self):
        """Test method chaining."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        price_line = PriceLineOptions(price=150.0, color="#FF0000")

        # Test chaining

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            size=1,
            text="Test Marker",
        )
        series.add_marker(marker).add_price_line(price_line)

        assert len(series.markers) == 1
        assert len(series.price_lines) == 1


class TestBaselineSeriesInheritance:
    """Test BaselineSeries inheritance and class properties."""

    def test_inherits_from_series(self):
        """Test that BaselineSeries inherits from Series."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        assert isinstance(series, Series)

    def test_data_class_property(self):
        """Test DATA_CLASS property."""
        assert BaselineData == BaselineSeries.DATA_CLASS

    def test_chart_type_property(self):
        """Test chart_type property."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        assert series.chart_type == ChartType.BASELINE


class TestBaselineSeriesEdgeCases:
    """Test BaselineSeries edge cases and limits."""

    def test_empty_data_list(self):
        """Test BaselineSeries with empty data list."""
        series = BaselineSeries(data=[])
        assert series.data == []
        result = series.asdict()
        assert result["data"] == []

    def test_single_data_point(self):
        """Test BaselineSeries with single data point."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        assert len(series.data) == 1
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100.5

    def test_large_data_list(self):
        """Test BaselineSeries with large data list."""
        data = [BaselineData(time=1640995200 + i, value=100.0 + i) for i in range(100)]
        series = BaselineSeries(data=data)
        assert len(series.data) == 100
        assert series.data[0].time == 1640995200
        assert series.data[99].time == 1640995200 + 99

    def test_negative_base_value(self):
        """Test BaselineSeries with negative base value."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        series.base_value = -50.0
        assert series.base_value == {"type": "price", "price": -50.0}

    def test_zero_base_value(self):
        """Test BaselineSeries with zero base value."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        series.base_value = 0.0
        assert series.base_value == {"type": "price", "price": 0.0}

    def test_very_large_base_value(self):
        """Test BaselineSeries with very large base value."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        series.base_value = 1e6
        assert series.base_value == {"type": "price", "price": 1e6}

    def test_very_small_base_value(self):
        """Test BaselineSeries with very small base value."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        series.base_value = 1e-6
        assert series.base_value == {"type": "price", "price": 1e-6}

    def test_none_data(self):
        """Test BaselineSeries with None data."""
        series = BaselineSeries(data=None)
        assert series.data == []

    def test_boolean_validation_for_relative_gradient(self):
        """Test that relative_gradient properly validates boolean values."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Test valid boolean values
        series.relative_gradient = True
        assert series.relative_gradient is True

        series.relative_gradient = False
        assert series.relative_gradient is False

        # Test invalid values - should raise TypeValidationError
        with pytest.raises(TypeValidationError, match="relative_gradient must be boolean"):
            series.relative_gradient = 1

        with pytest.raises(TypeValidationError, match="relative_gradient must be boolean"):
            series.relative_gradient = "True"

        with pytest.raises(TypeValidationError, match="relative_gradient must be boolean"):
            series.relative_gradient = 0

        with pytest.raises(TypeValidationError, match="relative_gradient must be boolean"):
            series.relative_gradient = ""


class TestBaselineSeriesIntegration:
    """Test BaselineSeries integration with other components."""

    def test_with_baseline_data_with_colors(self):
        """Test BaselineSeries with BaselineData that has color properties."""
        data = [
            BaselineData(
                time=1640995200,
                value=100.5,
                top_fill_color1="#FF0000",
                bottom_fill_color1="#00FF00",
            ),
            BaselineData(
                time=1641081600,
                value=105.2,
                top_fill_color2="#0000FF",
                bottom_fill_color2="#FFFF00",
            ),
        ]
        series = BaselineSeries(data=data)
        result = series.asdict()

        assert len(result["data"]) == 2
        assert result["data"][0]["topFillColor1"] == "#FF0000"
        assert result["data"][0]["bottomFillColor1"] == "#00FF00"
        assert result["data"][1]["topFillColor2"] == "#0000FF"
        assert result["data"][1]["bottomFillColor2"] == "#FFFF00"

    def test_dataframe_with_datetime_index(self):
        """Test BaselineSeries with DataFrame that has datetime index."""
        test_dataframe = pd.DataFrame(
            {"value": [100.5, 105.2]},
            index=pd.to_datetime(["2022-01-01", "2022-01-02"]),
        )

        series = BaselineSeries(
            data=test_dataframe,
            column_mapping={"time": "index", "value": "value"},
        )

        assert len(series.data) == 2
        assert isinstance(series.data[0], BaselineData)
        assert series.data[0].value == 100.5
        assert series.data[1].value == 105.2

    def test_dataframe_with_multi_index(self):
        """Test BaselineSeries with DataFrame that has multi-index."""
        test_dataframe = pd.DataFrame({"value": [100.5, 105.2, 110.0, 115.5]})
        test_dataframe.index = pd.MultiIndex.from_tuples(
            [("2022-01-01", "A"), ("2022-01-01", "B"), ("2022-01-02", "A"), ("2022-01-02", "B")],
            names=["date", "category"],
        )

        series = BaselineSeries(
            data=test_dataframe,
            column_mapping={"time": "date", "value": "value"},
        )

        assert len(series.data) == 4
        assert isinstance(series.data[0], BaselineData)
        assert series.data[0].value == 100.5


class TestBaselineSeriesJsonStructure:
    """Test BaselineSeries JSON structure and frontend compatibility."""

    def test_basic_json_structure(self):
        """Test basic JSON structure."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)
        result = series.asdict()

        required_keys = {"type", "data", "options", "paneId"}
        assert all(key in result for key in required_keys)
        assert result["type"] == "baseline"
        assert isinstance(result["data"], list)
        assert isinstance(result["options"], dict)

    def test_markers_json_structure(self):
        """Test markers JSON structure."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Add marker using the correct method signature

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            size=1,
            text="Test Marker",
        )
        series.add_marker(marker)

        result = series.asdict()
        assert "markers" in result
        assert isinstance(result["markers"], list)
        assert len(result["markers"]) == 1

        marker_dict = result["markers"][0]
        required_marker_keys = {"time", "position", "shape", "color", "size", "text"}
        assert all(key in marker_dict for key in required_marker_keys)

    def test_price_lines_json_structure(self):
        """Test price lines JSON structure."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        price_line = PriceLineOptions(price=150.0, color="#FF0000")
        series.add_price_line(price_line)

        result = series.asdict()
        assert "priceLines" in result
        assert isinstance(result["priceLines"], list)
        assert len(result["priceLines"]) == 1

        price_line_dict = result["priceLines"][0]
        required_price_line_keys = {"price", "color"}
        assert all(key in price_line_dict for key in required_price_line_keys)

    def test_complete_json_structure(self):
        """Test complete JSON structure with all components."""
        data = [BaselineData(time=1640995200, value=100.5)]
        series = BaselineSeries(data=data)

        # Add marker and price line using correct method signatures

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
            size=1,
            text="Test Marker",
        )
        series.add_marker(marker)

        price_line = PriceLineOptions(price=150.0, color="#FF0000")
        series.add_price_line(price_line)

        # Set custom options
        series.base_value = 100.0
        series.relative_gradient = True
        series.top_fill_color1 = "#FF0000"

        result = series.asdict()

        required_keys = {"type", "data", "options", "paneId", "markers", "priceLines"}
        assert all(key in result for key in required_keys)

        # Check options structure
        options = result["options"]
        assert "baseValue" in options
        assert "relativeGradient" in options
        assert "topFillColor1" in options
        # Line options are now nested
        assert "lineOptions" in options
        assert "color" in options["lineOptions"]
        assert "lineWidth" in options["lineOptions"]
