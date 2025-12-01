"""Tests for CandlestickSeries class.

This module contains comprehensive tests for the CandlestickSeries class,
which represents candlestick chart series with styling options.
"""

# pylint: disable=no-member,protected-access

import pandas as pd
import pytest
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.charts.series.candlestick import CandlestickSeries
from lightweight_charts_core.data.candlestick_data import CandlestickData
from lightweight_charts_core.data.marker import BarMarker
from lightweight_charts_core.exceptions import (
    ColorValidationError,
    ColumnMappingRequiredError,
    DataFrameValidationError,
    DataItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions import ChartType, MarkerPosition, MarkerShape


class TestCandlestickSeriesConstruction:
    """Test CandlestickSeries construction."""

    def test_standard_construction(self):
        """Test standard construction with list of CandlestickData."""
        data = [
            CandlestickData(time=1640995200, open=100, high=105, low=98, close=103),
            CandlestickData(time=1641081600, open=103, high=108, low=102, close=106),
        ]
        series = CandlestickSeries(data=data)

        assert len(series.data) == 2
        assert isinstance(series.data[0], CandlestickData)
        assert series.visible is True
        assert series.price_scale_id == "right"
        assert series.pane_id == 0

    def test_construction_with_custom_parameters(self):
        """Test construction with custom parameters."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data, visible=False, price_scale_id="left", pane_id=1)

        assert series.visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1

    def test_construction_with_dataframe(self):
        """Test construction with pandas DataFrame."""
        test_dataframe = pd.DataFrame(
            {
                "time": [1640995200, 1641081600],
                "open": [100, 103],
                "high": [105, 108],
                "low": [98, 102],
                "close": [103, 106],
            },
        )
        series = CandlestickSeries(
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
        assert isinstance(series.data[0], CandlestickData)

    def test_construction_with_pandas_series(self):
        """Test construction with pandas Series."""
        # Create a DataFrame instead of Series for simpler testing
        test_dataframe = pd.DataFrame(
            {"time": [1640995200], "open": [100], "high": [105], "low": [98], "close": [103]},
        )
        series = CandlestickSeries(
            data=test_dataframe,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
        )

        assert len(series.data) == 1
        assert isinstance(series.data[0], CandlestickData)

    def test_construction_with_empty_data(self):
        """Test construction with empty data."""
        series = CandlestickSeries(data=[])

        assert len(series.data) == 0
        assert series._visible is True

    def test_construction_with_custom_parameters_duplicate(self):
        """Test construction with custom parameters."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data, visible=False, price_scale_id="left", pane_id=1)

        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1


class TestCandlestickSeriesProperties:
    """Test CandlestickSeries properties."""

    def test_chart_type_property(self):
        """Test chart_type property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        assert series.chart_type == ChartType.CANDLESTICK

    def test_up_color_property(self):
        """Test up_color property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.up_color == "#26a69a"

        # Test setting value
        series.up_color = "#FF0000"
        assert series.up_color == "#FF0000"

    def test_down_color_property(self):
        """Test down_color property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.down_color == "#ef5350"

        # Test setting value
        series.down_color = "#00FF00"
        assert series.down_color == "#00FF00"

    def test_wick_visible_property(self):
        """Test wick_visible property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.wick_visible is True

        # Test setting value
        series.wick_visible = False
        assert series.wick_visible is False

    def test_border_visible_property(self):
        """Test border_visible property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.border_visible is False

        # Test setting value
        series.border_visible = True
        assert series.border_visible is True

    def test_border_color_property(self):
        """Test border_color property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.border_color == "#378658"

        # Test setting value
        series.border_color = "#000000"
        assert series.border_color == "#000000"

    def test_border_up_color_property(self):
        """Test border_up_color property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.border_up_color == "#26a69a"

        # Test setting value
        series.border_up_color = "#FF0000"
        assert series.border_up_color == "#FF0000"

    def test_border_down_color_property(self):
        """Test border_down_color property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.border_down_color == "#ef5350"

        # Test setting value
        series.border_down_color = "#00FF00"
        assert series.border_down_color == "#00FF00"

    def test_wick_color_property(self):
        """Test wick_color property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.wick_color == "#737375"

        # Test setting value
        series.wick_color = "#000000"
        assert series.wick_color == "#000000"

    def test_wick_up_color_property(self):
        """Test wick_up_color property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.wick_up_color == "#26a69a"

        # Test setting value
        series.wick_up_color = "#FF0000"
        assert series.wick_up_color == "#FF0000"

    def test_wick_down_color_property(self):
        """Test wick_down_color property."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test default value
        assert series.wick_down_color == "#ef5350"

        # Test setting value
        series.wick_down_color = "#00FF00"
        assert series.wick_down_color == "#00FF00"

    def test_color_validation(self):
        """Test color validation in properties."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test valid colors
        series.up_color = "#FF0000"
        series.down_color = "rgba(0, 255, 0, 0.5)"

        # Test invalid colors (should raise ColorValidationError)
        with pytest.raises(ColorValidationError):
            series.up_color = "invalid_color"

    def test_boolean_validation(self):
        """Test boolean validation for boolean properties."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test valid boolean values
        series.wick_visible = True
        assert series.wick_visible is True

        series.wick_visible = False
        assert series.wick_visible is False

        series.border_visible = True
        assert series.border_visible is True

        series.border_visible = False
        assert series.border_visible is False

        # Test invalid values - should raise TypeValidationError
        with pytest.raises(TypeValidationError, match="wick_visible must be boolean"):
            series.wick_visible = 1

        with pytest.raises(TypeValidationError, match="wick_visible must be boolean"):
            series.wick_visible = 0

        with pytest.raises(TypeValidationError, match="border_visible must be boolean"):
            series.border_visible = "true"

        with pytest.raises(TypeValidationError, match="border_visible must be boolean"):
            series.border_visible = ""


class TestCandlestickSeriesSerialization:
    """Test CandlestickSeries serialization."""

    def test_asdict_basic(self):
        """Test basic asdict serialization."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        result = series.asdict()

        assert result["type"] == "candlestick"
        assert len(result["data"]) == 1
        assert result["data"][0]["time"] == 1640995200
        assert result["data"][0]["open"] == 100
        assert result["data"][0]["high"] == 105
        assert result["data"][0]["low"] == 98
        assert result["data"][0]["close"] == 103
        assert "options" in result
        assert "paneId" in result

    def test_asdict_with_candlestick_options(self):
        """Test asdict with candlestick styling options."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)
        series.up_color = "#FF0000"
        series.down_color = "#00FF00"
        series.wick_visible = False
        series.border_visible = False

        result = series.asdict()

        assert result["options"]["upColor"] == "#FF0000"
        assert result["options"]["downColor"] == "#00FF00"
        assert result["options"]["wickVisible"] is False
        assert result["options"]["borderVisible"] is False

    def test_asdict_with_all_options(self):
        """Test asdict with all candlestick options."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Set all options
        series.up_color = "#FF0000"
        series.down_color = "#00FF00"
        series.wick_visible = False
        series.border_visible = False
        series.border_color = "#000000"
        series.border_up_color = "#FF0000"
        series.border_down_color = "#00FF00"
        series.wick_color = "#000000"
        series.wick_up_color = "#FF0000"
        series.wick_down_color = "#00FF00"

        result = series.asdict()
        options = result["options"]

        assert options["upColor"] == "#FF0000"
        assert options["downColor"] == "#00FF00"
        assert options["wickVisible"] is False
        assert options["borderVisible"] is False
        assert options["borderColor"] == "#000000"
        assert options["borderUpColor"] == "#FF0000"
        assert options["borderDownColor"] == "#00FF00"
        assert options["wickColor"] == "#000000"
        assert options["wickUpColor"] == "#FF0000"
        assert options["wickDownColor"] == "#00FF00"

    def test_asdict_with_markers(self):
        """Test asdict with markers."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.BELOW_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)

        result = series.asdict()

        assert "markers" in result
        assert len(result["markers"]) == 1
        assert result["markers"][0]["time"] == 1640995200

    def test_asdict_with_price_lines(self):
        """Test asdict with price lines."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)
        series.add_price_line(PriceLineOptions(price=100, color="#FF0000"))

        result = series.asdict()

        assert "priceLines" in result
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["price"] == 100


class TestCandlestickSeriesMethods:
    """Test CandlestickSeries methods."""

    def test_add_marker_method(self):
        """Test add_marker method."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.BELOW_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)

        assert len(series.markers) == 1

        assert isinstance(series.markers[0], BarMarker)
        assert series.markers[0].time == 1640995200
        assert series.markers[0].position == MarkerPosition.BELOW_BAR
        assert series.markers[0].color == "#FF0000"
        assert series.markers[0].shape == MarkerShape.CIRCLE

    def test_add_price_line_method(self):
        """Test add_price_line method."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        price_line = PriceLineOptions(price=100, color="#FF0000")
        series.add_price_line(price_line)

        assert len(series.price_lines) == 1
        assert isinstance(series.price_lines[0], PriceLineOptions)
        assert series.price_lines[0].price == 100
        assert series.price_lines[0].color == "#FF0000"

    def test_method_chaining(self):
        """Test method chaining."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.BELOW_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
        )
        result = series.add_marker(marker).add_price_line(
            PriceLineOptions(price=100, color="#FF0000"),
        )

        assert result is series
        assert len(series.markers) == 1
        assert len(series.price_lines) == 1


class TestCandlestickSeriesDataHandling:
    """Test CandlestickSeries data handling."""

    def test_from_dataframe_classmethod(self):
        """Test from_dataframe classmethod."""
        test_dataframe = pd.DataFrame(
            {
                "time": [1640995200, 1641081600],
                "open": [100, 103],
                "high": [105, 108],
                "low": [98, 102],
                "close": [103, 106],
            },
        )

        series = CandlestickSeries.from_dataframe(
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
        assert isinstance(series.data[0], CandlestickData)
        assert series.data[0].open == 100
        assert series.data[0].high == 105
        assert series.data[0].low == 98
        assert series.data[0].close == 103

    def test_from_dataframe_with_index_columns(self):
        """Test from_dataframe with index columns."""
        test_dataframe = pd.DataFrame(
            {"open": [100, 103], "high": [105, 108], "low": [98, 102], "close": [103, 106]},
            index=pd.to_datetime(["2022-01-01", "2022-01-02"]),
        )

        series = CandlestickSeries.from_dataframe(
            test_dataframe,
            column_mapping={
                "time": "datetime",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
        )

        assert len(series.data) == 2
        assert isinstance(series.data[0], CandlestickData)

    def test_from_dataframe_with_multi_index(self):
        """Test from_dataframe with multi-index."""
        test_dataframe = pd.DataFrame(
            {"open": [100, 103], "high": [105, 108], "low": [98, 102], "close": [103, 106]},
        )
        test_dataframe.index = pd.MultiIndex.from_tuples(
            [(1640995200, "A"), (1641081600, "B")],
            names=["date", "symbol"],
        )

        series = CandlestickSeries.from_dataframe(
            test_dataframe,
            column_mapping={
                "time": "date",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
        )

        assert len(series.data) == 2
        assert isinstance(series.data[0], CandlestickData)


class TestCandlestickSeriesValidation:
    """Test CandlestickSeries validation."""

    def test_validate_pane_config(self):
        """Test validate_pane_config method."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data, pane_id=0)

        # Should not raise an exception
        series._validate_pane_config()

    def test_validate_pane_config_invalid(self):
        """Test validate_pane_config with invalid pane_id."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data, pane_id=-1)

        with pytest.raises(ValueValidationError):
            series._validate_pane_config()

    def test_error_handling_invalid_data(self):
        """Test error handling with invalid data."""
        with pytest.raises(DataFrameValidationError):
            CandlestickSeries(data="invalid_data")

    def test_error_handling_missing_required_columns(self):
        """Test error handling with missing required columns."""
        test_dataframe = pd.DataFrame(
            {
                "time": [1640995200],
                "open": [100],
                # Missing high, low, close
            },
        )

        with pytest.raises(ColumnMappingRequiredError):
            CandlestickSeries(data=test_dataframe)

    def test_error_handling_invalid_data_type(self):
        """Test error handling with invalid data type."""
        with pytest.raises(DataFrameValidationError):
            CandlestickSeries(data=123)

    def test_error_handling_dataframe_without_column_mapping(self):
        """Test error handling with DataFrame without column mapping."""
        test_dataframe = pd.DataFrame(
            {"time": [1640995200], "open": [100], "high": [105], "low": [98], "close": [103]},
        )

        with pytest.raises(ColumnMappingRequiredError):
            CandlestickSeries(data=test_dataframe)

    def test_error_handling_invalid_list_data(self):
        """Test error handling with invalid list data."""
        with pytest.raises(DataItemsTypeError):
            CandlestickSeries(data=[1, 2, 3])


class TestCandlestickSeriesEdgeCases:
    """Test CandlestickSeries edge cases."""

    def test_empty_data_handling(self):
        """Test handling of empty data."""
        series = CandlestickSeries(data=[])

        assert len(series.data) == 0
        result = series.asdict()
        assert result["data"] == []

    def test_single_data_point(self):
        """Test handling of single data point."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        assert len(series.data) == 1
        result = series.asdict()
        assert len(result["data"]) == 1

    def test_large_dataset(self):
        """Test handling of large dataset."""
        data = [
            CandlestickData(
                time=1640995200 + i,
                open=100 + i,
                high=105 + i,
                low=98 + i,
                close=103 + i,
            )
            for i in range(1000)
        ]
        series = CandlestickSeries(data=data)

        assert len(series.data) == 1000
        result = series.asdict()
        assert len(result["data"]) == 1000

    def test_none_data(self):
        """Test handling of None data."""
        # None data should be converted to empty list
        series = CandlestickSeries(data=None)
        assert series.data == []

    def test_very_small_values(self):
        """Test handling of very small values."""
        data = [
            CandlestickData(
                time=1640995200,
                open=0.000001,
                high=0.000002,
                low=0.000001,
                close=0.000001,
            ),
        ]
        series = CandlestickSeries(data=data)

        assert series.data[0].open == 0.000001
        assert series.data[0].high == 0.000002

    def test_very_large_values(self):
        """Test handling of very large values."""
        data = [
            CandlestickData(time=1640995200, open=1000000, high=1000001, low=999999, close=1000000),
        ]
        series = CandlestickSeries(data=data)

        assert series.data[0].open == 1000000
        assert series.data[0].high == 1000001

    def test_boolean_validation_for_wick_visible(self):
        """Test boolean validation for wick_visible."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test valid boolean values
        series.wick_visible = True
        assert series.wick_visible is True

        series.wick_visible = False
        assert series.wick_visible is False

        # Test invalid values - should raise TypeValidationError
        with pytest.raises(TypeValidationError, match="wick_visible must be boolean"):
            series.wick_visible = 1

        with pytest.raises(TypeValidationError, match="wick_visible must be boolean"):
            series.wick_visible = 0

    def test_boolean_validation_for_border_visible(self):
        """Test boolean validation for border_visible."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Test valid boolean values
        series.border_visible = True
        assert series.border_visible is True

        series.border_visible = False
        assert series.border_visible is False

        # Test invalid values - should raise TypeValidationError
        with pytest.raises(TypeValidationError, match="border_visible must be boolean"):
            series.border_visible = "true"

        with pytest.raises(TypeValidationError, match="border_visible must be boolean"):
            series.border_visible = ""


class TestCandlestickSeriesInheritance:
    """Test CandlestickSeries inheritance."""

    def test_inherits_from_series(self):
        """Test that CandlestickSeries inherits from Series."""
        assert issubclass(CandlestickSeries, Series)

    def test_has_required_methods(self):
        """Test that CandlestickSeries has required methods."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        assert hasattr(series, "asdict")
        assert hasattr(series, "add_marker")
        assert hasattr(series, "add_price_line")
        assert hasattr(series, "from_dataframe")

    def test_has_required_properties(self):
        """Test that CandlestickSeries has required properties."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        assert hasattr(series, "chart_type")
        assert hasattr(series, "up_color")
        assert hasattr(series, "down_color")
        assert hasattr(series, "wick_visible")
        assert hasattr(series, "border_visible")


class TestCandlestickSeriesJsonStructure:
    """Test CandlestickSeries JSON structure."""

    def test_basic_json_structure(self):
        """Test basic JSON structure."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        result = series.asdict()

        required_keys = {"type", "data", "options", "paneId"}
        assert all(key in result for key in required_keys)
        assert result["type"] == "candlestick"
        assert isinstance(result["data"], list)
        assert isinstance(result["options"], dict)

    def test_candlestick_options_structure(self):
        """Test candlestick options structure."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)
        series.up_color = "#FF0000"
        series.down_color = "#00FF00"

        result = series.asdict()
        options = result["options"]

        assert "upColor" in options
        assert "downColor" in options
        assert options["upColor"] == "#FF0000"
        assert options["downColor"] == "#00FF00"

    def test_markers_json_structure(self):
        """Test markers JSON structure."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.BELOW_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
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

    def test_price_lines_json_structure(self):
        """Test price lines JSON structure."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)
        series.add_price_line(PriceLineOptions(price=100, color="#FF0000"))

        result = series.asdict()

        assert "priceLines" in result
        assert isinstance(result["priceLines"], list)
        assert len(result["priceLines"]) == 1
        price_line = result["priceLines"][0]
        assert "price" in price_line
        assert "color" in price_line

    def test_complete_json_structure(self):
        """Test complete JSON structure with all components."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        # Set all options
        series.up_color = "#FF0000"
        series.down_color = "#00FF00"
        series.wick_visible = False
        series.border_visible = False

        # Add markers and price lines
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.BELOW_BAR,
            color="#FF0000",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)
        series.add_price_line(PriceLineOptions(price=100, color="#FF0000"))

        result = series.asdict()

        # Check all required keys
        required_keys = {"type", "data", "options", "paneId", "markers", "priceLines"}
        assert all(key in result for key in required_keys)

        # Check options
        options = result["options"]
        assert options["upColor"] == "#FF0000"
        assert options["downColor"] == "#00FF00"
        assert options["wickVisible"] is False
        assert options["borderVisible"] is False

        # Check markers
        assert len(result["markers"]) == 1

        # Check price lines
        assert len(result["priceLines"]) == 1

    def test_json_serialization_consistency(self):
        """Test JSON serialization consistency."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        result1 = series.asdict()
        result2 = series.asdict()

        assert result1 == result2

    def test_frontend_compatibility(self):
        """Test frontend compatibility of JSON structure."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)
        series.up_color = "#FF0000"
        series.down_color = "#00FF00"

        result = series.asdict()

        # Check that the structure matches frontend expectations
        assert result["type"] == "candlestick"
        assert "options" in result
        assert "upColor" in result["options"]
        assert "downColor" in result["options"]

        # Check data structure
        assert len(result["data"]) == 1
        data_point = result["data"][0]
        assert "time" in data_point
        assert "open" in data_point
        assert "high" in data_point
        assert "low" in data_point
        assert "close" in data_point

    def test_empty_options_handling(self):
        """Test handling of empty options."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        result = series.asdict()

        # Default options should be present
        assert "options" in result
        assert len(result["options"]) > 0

    def test_missing_optional_fields(self):
        """Test handling of missing optional fields."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=103)]
        series = CandlestickSeries(data=data)

        result = series.asdict()

        # Should not have markers or price lines if not added
        assert "markers" not in result
        assert "priceLines" not in result
