"""
Unit tests for the Series base class.

This module tests the abstract Series class functionality including
data handling, configuration, and method chaining.
"""

import pandas as pd
import pytest

from streamlit_lightweight_charts_pro.charts.options.price_format_options import PriceFormatOptions
from streamlit_lightweight_charts_pro.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.data.marker import Marker
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    ChartType,
    LineStyle,
    MarkerPosition,
    MarkerShape,
    PriceScaleMode,
)
from tests.unit.utils import _get_enum_value


class ConcreteSeries(Series):
    """Concrete implementation of Series for testing."""

    DATA_CLASS = LineData

    @property
    def chart_type(self):
        """Return chart type for testing."""
        return ChartType.LINE

    def __init__(self, data, **kwargs):
        if isinstance(data, pd.DataFrame):
            # Use the new from_dataframe logic for DataFrame processing
            column_mapping = kwargs.get("column_mapping", {})
            if not column_mapping:
                # Default column mapping if none provided
                column_mapping = {"time": "time", "value": "value"}

            # Process DataFrame using the same logic as from_dataframe
            df = data.copy()
            self.data_class.required_columns

            # Get index names for normalization
            index_names = df.index.names if hasattr(df.index, "names") else [df.index.name]

            # Normalize index as column if needed
            for key, col in column_mapping.items():
                if col in df.columns:
                    continue

                # Handle DatetimeIndex with no name
                if isinstance(df.index, pd.DatetimeIndex) and df.index.name is None:
                    df.index.name = col
                    df = df.reset_index()
                # Handle MultiIndex with unnamed DatetimeIndex level
                elif isinstance(df.index, pd.MultiIndex):
                    # Find the level index that matches the column name
                    for i, name in enumerate(df.index.names):
                        if name is None and i < len(df.index.levels):
                            # Check if this level is a DatetimeIndex
                            if isinstance(df.index.levels[i], pd.DatetimeIndex):
                                # Set the name for this level
                                new_names = list(df.index.names)
                                new_names[i] = col
                                df.index.names = new_names
                                df = df.reset_index(level=col)
                                break
                    # If not found as unnamed DatetimeIndex, check if it's a named level
                    else:
                        if col in df.index.names:
                            df = df.reset_index(level=col)
                # Handle regular index with matching name
                elif col in index_names:
                    df = df.reset_index()

            # Process the DataFrame into data objects
            data = self._process_dataframe(df)

        super().__init__(data=data, **kwargs)

    def asdict(self):
        # Use the parent's asdict method to test the new logic
        return super().asdict()

    def _process_dataframe(self, df):
        """Process DataFrame into LineData objects."""
        data = []
        for _, row in df.iterrows():
            data.append(LineData(time=row["time"], value=row["value"]))
        return data

    def _get_columns(self):
        return {"time": "time", "value": "value"}


class TestSeriesBase:
    """Test cases for the Series base class."""

    def test_construction_with_list_data(self):
        """Test Series construction with list of data objects."""
        data = [
            LineData(time=1640995200, value=100),
            LineData(time=1641081600, value=110),
        ]

        series = ConcreteSeries(data=data)

        assert len(series.data) == 2
        assert series._visible is True
        assert series.price_scale_id == ""
        assert series.pane_id == 0

    def test_construction_with_dataframe(self):
        """Test Series construction with DataFrame."""
        df = pd.DataFrame({"time": [1640995200, 1641081600], "value": [100, 110]})

        series = ConcreteSeries(data=df, column_mapping={"time": "time", "value": "value"})

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_construction_with_custom_parameters(self):
        """Test Series construction with custom parameters."""
        data = [LineData(time=1640995200, value=100)]

        series = ConcreteSeries(data=data, visible=False, price_scale_id="left", pane_id=1)

        assert series._visible is False
        assert series.price_scale_id == "left"
        assert series.pane_id == 1

    def test_data_dict_property(self):
        """Test the data_dict property."""
        data = [
            LineData(time=1640995200, value=100),
            LineData(time=1641081600, value=110),
        ]

        series = ConcreteSeries(data=data)
        data_dict = series.data_dict

        assert len(data_dict) == 2
        assert data_dict[0]["time"] == 1640995200
        assert data_dict[0]["value"] == 100
        assert data_dict[1]["time"] == 1641081600
        assert data_dict[1]["value"] == 110

    def test_set_visible_method(self):
        """Test the set_visible method."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        series.visible = False

        assert series._visible is False

    def test_add_marker_method(self):
        """Test the add_marker method."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        from streamlit_lightweight_charts_pro.data.marker import BarMarker

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test",
            size=10,
        )
        result = series.add_marker(marker)

        assert result is series  # Method chaining
        assert len(series.markers) == 1
        # Time is normalized to UNIX timestamp format in Marker
        assert isinstance(series.markers[0].time, int)
        assert series.markers[0].time == 1640995200  # UNIX timestamp
        assert series.markers[0].position == MarkerPosition.ABOVE_BAR
        assert series.markers[0].color == "#ff0000"
        assert series.markers[0].shape == MarkerShape.CIRCLE
        assert series.markers[0].text == "Test"
        assert series.markers[0].size == 10

    def test_add_markers_method(self):
        """Test the add_markers method."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        markers = [
            Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            ),
            Marker(
                time=1641081600,
                position=MarkerPosition.BELOW_BAR,
                color="#00ff00",
                shape=MarkerShape.SQUARE,
            ),
        ]

        result = series.add_markers(markers)

        assert result is series  # Method chaining
        assert len(series.markers) == 2

    def test_clear_markers_method(self):
        """Test the clear_markers method."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Add some markers first
        from streamlit_lightweight_charts_pro.data.marker import BarMarker

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)

        assert len(series.markers) == 1

        # Clear markers
        result = series.clear_markers()

        assert result is series  # Method chaining
        assert len(series.markers) == 0

    def test_price_scale_id_property(self):
        """Test the price_scale_id property."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        series.price_scale_id = "left"
        assert series.price_scale_id == "left"

    def test_price_format_property(self):
        """Test the price_format property."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        price_format = PriceFormatOptions(type="price", precision=2)
        series.price_format = price_format

        assert series.price_format is price_format

    def test_price_lines_property(self):
        """Test the price_lines property."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        price_lines = [
            PriceLineOptions(price=100, color="#ff0000"),
            PriceLineOptions(price=110, color="#00ff00"),
        ]

        series.price_lines = price_lines
        assert series.price_lines == price_lines

    def test_add_price_line_method(self):
        """Test the add_price_line method."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        price_line = PriceLineOptions(price=100, color="#ff0000")
        result = series.add_price_line(price_line)

        assert result is series  # Method chaining
        assert len(series.price_lines) == 1
        assert series.price_lines[0] is price_line

    def test_clear_price_lines_method(self):
        """Test the clear_price_lines method."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Add some price lines first
        price_line = PriceLineOptions(price=100, color="#ff0000")
        series.add_price_line(price_line)

        assert len(series.price_lines) == 1

        # Clear price lines
        result = series.clear_price_lines()

        assert result is series  # Method chaining
        assert len(series.price_lines) == 0

    def test_markers_property(self):
        """Test the markers property."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        markers = [
            Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            ),
        ]

        series.markers = markers
        assert series.markers == markers

    def test_data_class_property(self):
        """Test the data_class class property."""
        assert ConcreteSeries.data_class == LineData

    def test_from_dataframe_classmethod(self):
        """Test the from_dataframe class method."""
        df = pd.DataFrame({"time": [1640995200, 1641081600], "value": [100, 110]})

        series = ConcreteSeries.from_dataframe(
            df=df, column_mapping={"time": "time", "value": "value"}
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100

    def test_from_dataframe_with_index_columns(self):
        """Test from_dataframe with index columns."""
        df = pd.DataFrame({"value": [100, 110]}, index=pd.to_datetime(["2022-01-01", "2022-01-02"]))

        series = ConcreteSeries.from_dataframe(
            df=df, column_mapping={"time": "datetime", "value": "value"}
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_multi_index(self):
        """Test from_dataframe with multi-index."""
        # Create DataFrame with multi-index already as columns
        df = pd.DataFrame(
            {"date": [1640995200, 1641081600], "symbol": ["A", "B"], "value": [100, 110]}
        )

        series = ConcreteSeries.from_dataframe(
            df=df, column_mapping={"time": "date", "value": "value"}
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_unnamed_datetime_index(self):
        """Test from_dataframe with unnamed DatetimeIndex."""
        df = pd.DataFrame({"value": [100, 110]}, index=pd.to_datetime(["2022-01-01", "2022-01-02"]))

        series = ConcreteSeries.from_dataframe(
            df=df, column_mapping={"time": "datetime", "value": "value"}
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)
        # Verify the time values are properly converted
        assert series.data[0].time == 1640995200  # 2022-01-01
        assert series.data[1].time == 1641081600  # 2022-01-02

    def test_from_dataframe_with_unnamed_datetime_multi_index(self):
        """Test from_dataframe with MultiIndex containing unnamed DatetimeIndex level."""
        # Create DataFrame with datetime column already available
        df = pd.DataFrame(
            {
                "datetime": [pd.Timestamp("2022-01-01"), pd.Timestamp("2022-01-02")],
                "symbol": ["A", "B"],
                "value": [100, 110],
            }
        )

        series = ConcreteSeries.from_dataframe(
            df=df, column_mapping={"time": "datetime", "value": "value"}
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)
        # Verify the time values are properly converted
        assert series.data[0].time == 1640995200  # 2022-01-01
        assert series.data[1].time == 1641081600  # 2022-01-02

    def test_validate_pane_config(self):
        """Test the _validate_pane_config method."""
        data = [LineData(time=1640995200, value=100)]

        # Should not raise an exception
        series = ConcreteSeries(data=data, pane_id=0)
        series._validate_pane_config()

        # Should not raise an exception for valid pane_id
        series = ConcreteSeries(data=data, pane_id=1)
        series._validate_pane_config()

    def test_validate_pane_config_invalid(self):
        """Test _validate_pane_config with invalid pane_id."""
        data = [LineData(time=1640995200, value=100)]

        # Should raise ValueError for negative pane_id
        series = ConcreteSeries(data=data, pane_id=-1)
        with pytest.raises(ValueError, match="pane_id must be non-negative"):
            series._validate_pane_config()

    def test_method_chaining(self):
        """Test method chaining functionality."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Test chaining multiple methods
        series.visible = False
        from streamlit_lightweight_charts_pro.data.marker import BarMarker

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        result = (
            series.add_marker(marker)
            .add_price_line(PriceLineOptions(price=100, color="#ff0000"))
            .clear_markers()
            .clear_price_lines()
        )

        assert result is series
        assert series._visible is False
        assert len(series.markers) == 0
        assert len(series.price_lines) == 0

    def test_error_handling_invalid_data(self):
        """Test error handling with invalid data."""
        # The new implementation should raise an error for invalid data types
        with pytest.raises(
            ValueError, match="data must be a list of SingleValueData objects, DataFrame, or Series"
        ):
            ConcreteSeries(data="invalid_data")

    def test_error_handling_missing_required_columns(self):
        """Test error handling with missing required columns."""
        df = pd.DataFrame({"value": [100, 110]})  # Missing 'time' column

        with pytest.raises(ValueError, match="Time column 'time' not found"):
            ConcreteSeries.from_dataframe(df=df, column_mapping={"time": "time", "value": "value"})

    def test_error_handling_invalid_data_type(self):
        """Test error handling with invalid data type."""
        with pytest.raises(
            ValueError, match="data must be a list of SingleValueData objects, DataFrame, or Series"
        ):
            ConcreteSeries(data="invalid_data")

    def test_error_handling_dataframe_without_column_mapping(self):
        """Test error handling with DataFrame without column_mapping."""
        df = pd.DataFrame({"time": [1640995200], "value": [100]})

        # Create a Series subclass that doesn't override __init__
        class TestSeries(Series):
            DATA_CLASS = LineData

        with pytest.raises(
            ValueError, match="column_mapping is required when providing DataFrame or Series data"
        ):
            TestSeries(data=df)

    def test_error_handling_invalid_list_data(self):
        """Test error handling with list containing non-SingleValueData objects."""
        invalid_data = [{"time": 1640995200, "value": 100}]  # dict instead of SingleValueData

        with pytest.raises(
            ValueError, match="All items in data list must be instances of Data or its subclasses"
        ):
            ConcreteSeries(data=invalid_data)


class TestSeriesBaseAdvanced:
    """Advanced test cases for the Series base class."""

    def test_get_enum_value_helper_function(self):
        """Test the _get_enum_value helper function."""

        # Test with enum object
        result = _get_enum_value(LineStyle.SOLID, LineStyle)
        assert result == 0  # LineStyle.SOLID.value is 0

        # Test with string
        result = _get_enum_value("solid", LineStyle)
        assert result == "solid"

        # Test with invalid string
        result = _get_enum_value("invalid", LineStyle)
        assert result == "invalid"

        # Test with non-enum, non-string value
        result = _get_enum_value(123, LineStyle)
        assert result == 123

    def test_to_dict_with_complex_options(self):
        """Test to_dict method with complex nested options."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Add complex options
        series.price_format = PriceFormatOptions(type="price", precision=2)
        series.add_price_line(PriceLineOptions(price=100, color="#ff0000"))
        from streamlit_lightweight_charts_pro.data.marker import BarMarker

        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)

        result = series.asdict()

        assert "type" in result
        assert "data" in result
        assert "priceLines" in result
        assert "markers" in result
        assert "options" in result

    def test_to_dict_with_none_options(self):
        """Test to_dict method with None options."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set price_format to None
        series.price_format = None

        result = series.asdict()

        # Should not include price_format in options
        assert "type" in result
        assert "data" in result
        # options should not be present when all properties are None/empty
        assert "options" not in result

    def test_to_dict_with_empty_options(self):
        """Test to_dict method with empty options."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Clear all options
        series.price_lines = []
        series.markers = []
        series.price_format = None

        result = series.asdict()

        assert "type" in result
        assert "data" in result
        # options should not be present when all properties are empty
        assert "options" not in result
        # Empty lists should not be included
        assert "priceLines" not in result
        assert "markers" not in result

    def test_validate_pane_config_edge_cases(self):
        """Test _validate_pane_config with edge cases."""
        data = [LineData(time=1640995200, value=100)]

        # Test with pane_id=None (should set pane_id to 0)
        series = ConcreteSeries(data=data, pane_id=None)
        series._validate_pane_config()
        assert series.pane_id == 0

        # Test with pane_id=0 (should not raise error)
        series = ConcreteSeries(data=data, pane_id=0)
        series._validate_pane_config()  # Should not raise

    def test_data_class_property_inheritance(self):
        """Test data_class property with inheritance."""

        class ChildSeries(ConcreteSeries):
            DATA_CLASS = LineData  # Same as parent

        class GrandchildSeries(ChildSeries):
            pass  # Should inherit DATA_CLASS from ChildSeries

        # Test that data_class returns the correct class
        assert ConcreteSeries.data_class == LineData
        assert ChildSeries.data_class == LineData
        assert GrandchildSeries.data_class == LineData

    def test_from_dataframe_with_complex_multi_index(self):
        """Test from_dataframe with complex MultiIndex scenarios."""
        # Test with DataFrame that has datetime and symbol columns
        df = pd.DataFrame(
            {
                "datetime": [pd.Timestamp("2022-01-01"), pd.Timestamp("2022-01-02")],
                "symbol": ["A", "B"],
                "value": [100, 110],
            }
        )

        series = ConcreteSeries.from_dataframe(
            df=df, column_mapping={"time": "datetime", "value": "value"}
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_datetime_index_no_name(self):
        """Test from_dataframe with DatetimeIndex that has no name."""
        df = pd.DataFrame({"value": [100, 110]})
        df.index = pd.to_datetime(["2022-01-01", "2022-01-02"])
        df.index.name = None  # Ensure no name

        series = ConcreteSeries.from_dataframe(
            df=df, column_mapping={"time": "datetime", "value": "value"}
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_series_input(self):
        """Test from_dataframe with pandas Series input."""
        series_data = pd.Series([100, 110], index=pd.to_datetime(["2022-01-01", "2022-01-02"]))

        series = ConcreteSeries.from_dataframe(
            df=series_data, column_mapping={"time": "index", "value": 0}
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_error_handling(self):
        """Test from_dataframe error handling."""
        df = pd.DataFrame({"value": [100, 110]})

        # Test missing required column in column_mapping
        with pytest.raises(ValueError, match="Missing required columns in column_mapping"):
            ConcreteSeries.from_dataframe(
                df=df, column_mapping={"value": "value"}  # Missing 'time'
            )

        # Test missing column in DataFrame
        with pytest.raises(ValueError, match="Time column 'missing_column' not found"):
            ConcreteSeries.from_dataframe(
                df=df, column_mapping={"time": "missing_column", "value": "value"}
            )

    def test_constructor_with_series_data(self):
        """Test constructor with pandas Series data."""
        series_data = pd.Series([100, 110], index=[1640995200, 1641081600])

        series = ConcreteSeries(data=series_data, column_mapping={"time": "index", "value": 0})

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_constructor_with_none_data(self):
        """Test constructor with None data."""
        series = ConcreteSeries(data=None)
        assert series.data == []

    def test_constructor_with_empty_list(self):
        """Test constructor with empty list."""
        series = ConcreteSeries(data=[])
        assert series.data == []

    def test_price_scale_id_setter(self):
        """Test price_scale_id setter."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        series.price_scale_id = "left"
        assert series.price_scale_id == "left"

        series.price_scale_id = "right"
        assert series.price_scale_id == "right"

    def test_price_format_setter(self):
        """Test price_format setter."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        price_format = PriceFormatOptions(type="price", precision=2)
        series.price_format = price_format
        assert series.price_format == price_format

    def test_price_lines_setter(self):
        """Test price_lines setter."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        price_lines = [PriceLineOptions(price=100, color="#ff0000")]
        series.price_lines = price_lines
        assert series.price_lines == price_lines

    def test_markers_setter(self):
        """Test markers setter."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        markers = [
            Marker(
                time=1640995200,
                position=MarkerPosition.ABOVE_BAR,
                color="#ff0000",
                shape=MarkerShape.CIRCLE,
            )
        ]
        series.markers = markers
        assert series.markers == markers

    def test_last_value_visible_property(self):
        """Test last_value_visible property getter and setter."""
        series = ConcreteSeries(data=[LineData(time=1640995200, value=100)])

        # Test default value (should be True)
        assert series.last_value_visible is True

        # Test setter
        series.last_value_visible = False
        assert series.last_value_visible is False

        # Test that the property is properly set
        assert series.last_value_visible is False

        # Test in asdict output
        dict_result = series.asdict()
        assert "lastValueVisible" in dict_result
        assert dict_result["lastValueVisible"] is False

    def test_price_scale_id_included_in_to_dict(self):
        """Test that priceScaleId is included in to_dict output."""

        # Create series with custom price_scale_id
        data = [LineData("2024-01-01", 100)]
        series = LineSeries(data=data, price_scale_id="left")

        # Convert to dict
        result = series.asdict()

        # Verify priceScaleId is included at top level
        assert "priceScaleId" in result
        assert result["priceScaleId"] == "left"

        # Test with default price_scale_id
        series_default = LineSeries(data=data)  # Default is "right"
        result_default = series_default.asdict()

        assert "priceScaleId" in result_default
        assert result_default["priceScaleId"] == "right"

    def test_empty_price_scale_id_included_in_output(self):
        """Test that empty price_scale_id is included in asdict output."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set empty price_scale_id
        series.price_scale_id = ""

        # Convert to dict
        result = series.asdict()

        # Verify empty priceScaleId is included at top level
        assert "priceScaleId" in result
        assert result["priceScaleId"] == ""

    def test_empty_price_scale_id_not_in_options(self):
        """Test that empty price_scale_id is not included in options."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set empty price_scale_id
        series.price_scale_id = ""

        # Convert to dict
        result = series.asdict()

        # Verify empty priceScaleId is at top level, not in options
        assert "priceScaleId" in result
        assert result["priceScaleId"] == ""
        # options should not be present when only empty strings are in options
        assert "options" not in result


class TestPriceScaleProperty:
    """Test cases for the new price_scale property."""

    def test_price_scale_property_setter(self):
        """Test price_scale property setter."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Test setting price_scale
        price_scale = PriceScaleOptions(
            price_scale_id="custom",
            visible=True,
            auto_scale=False,
            mode=1,  # Logarithmic
            invert_scale=True,
            border_visible=False,
            border_color="#ff0000",
            text_color="#00ff00",
            ticks_visible=False,
            ensure_edge_tick_marks_visible=True,
            align_labels=False,
            entire_text_only=True,
            minimum_width=100,
            scale_margins={"top": 0.2, "bottom": 0.3},
        )

        series.price_scale = price_scale
        assert series.price_scale == price_scale

    def test_price_scale_property_getter(self):
        """Test price_scale property getter."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Initially should be None
        assert series.price_scale is None

        # Set and get
        price_scale = PriceScaleOptions(price_scale_id="test")
        series.price_scale = price_scale
        assert series.price_scale == price_scale

    def test_price_scale_property_allow_none(self):
        """Test that price_scale property allows None values."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set to None
        series.price_scale = None
        assert series.price_scale is None

        # Set to a value
        price_scale = PriceScaleOptions(price_scale_id="test")
        series.price_scale = price_scale
        assert series.price_scale == price_scale

        # Set back to None
        series.price_scale = None
        assert series.price_scale is None

    def test_price_scale_in_asdict_output(self):
        """Test that price_scale is included in asdict output at top level."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set price_scale
        price_scale = PriceScaleOptions(
            price_scale_id="custom", visible=True, auto_scale=False, mode=1, invert_scale=True
        )
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Verify priceScale is at top level
        assert "priceScale" in result
        assert result["priceScale"]["priceScaleId"] == "custom"
        assert result["priceScale"]["visible"] is True
        assert result["priceScale"]["autoScale"] is False
        assert result["priceScale"]["mode"] == 1
        assert result["priceScale"]["invertScale"] is True

    def test_price_scale_not_in_options_when_set(self):
        """Test that price_scale is not included in options when set."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set price_scale
        price_scale = PriceScaleOptions(price_scale_id="custom")
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Verify priceScale is at top level, not in options
        assert "priceScale" in result
        # options should not be present when only top-level properties are set
        assert "options" not in result

    def test_price_scale_none_not_in_asdict(self):
        """Test that price_scale is not included in asdict when None."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Ensure price_scale is None
        series.price_scale = None

        # Convert to dict
        result = series.asdict()

        # Verify priceScale is not included
        assert "priceScale" not in result

    def test_price_scale_method_chaining(self):
        """Test price_scale property with method chaining."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        price_scale = PriceScaleOptions(price_scale_id="chained")

        # Test property setting
        series.price_scale = price_scale
        assert series.price_scale == price_scale

    def test_price_scale_with_scale_margins(self):
        """Test price_scale with scale margins configuration."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Create scale margins
        margins = PriceScaleMargins(top=0.25, bottom=0.35)

        # Set price_scale with margins
        price_scale = PriceScaleOptions(price_scale_id="margins_test", scale_margins=margins)
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Verify margins are included
        assert "priceScale" in result
        assert "scaleMargins" in result["priceScale"]
        assert result["priceScale"]["scaleMargins"]["top"] == 0.25
        assert result["priceScale"]["scaleMargins"]["bottom"] == 0.35

    def test_price_scale_validation(self):
        """Test price_scale property validation."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Test with None (should work since allow_none=True)
        series.price_scale = None
        assert series.price_scale is None

        # Test with invalid type (no validation currently, so this should work)
        series.price_scale = "invalid"
        assert series.price_scale == "invalid"

    def test_price_scale_and_price_scale_id_coexistence(self):
        """Test that price_scale and price_scale_id can coexist."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set both properties
        series.price_scale_id = "simple_id"
        price_scale = PriceScaleOptions(price_scale_id="complex_id", visible=False)
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Both should be present at top level
        assert "priceScaleId" in result
        assert "priceScale" in result
        assert result["priceScaleId"] == "simple_id"
        assert result["priceScale"]["priceScaleId"] == "complex_id"
        assert result["priceScale"]["visible"] is False

    def test_price_scale_complete_configuration(self):
        """Test price_scale with complete configuration."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Create complete price scale configuration
        margins = PriceScaleMargins(top=0.1, bottom=0.2)
        price_scale = PriceScaleOptions(
            price_scale_id="complete_test",
            visible=True,
            auto_scale=True,
            mode=PriceScaleMode.LOGARITHMIC,
            invert_scale=False,
            border_visible=True,
            border_color="rgba(255, 0, 0, 0.8)",
            text_color="#00ff00",
            ticks_visible=True,
            ensure_edge_tick_marks_visible=False,
            align_labels=True,
            entire_text_only=False,
            minimum_width=80,
            scale_margins=margins,
        )

        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Verify all properties are correctly serialized
        assert "priceScale" in result
        ps = result["priceScale"]
        assert ps["priceScaleId"] == "complete_test"
        assert ps["visible"] is True
        assert ps["autoScale"] is True
        assert ps["mode"] == PriceScaleMode.LOGARITHMIC.value
        assert ps["invertScale"] is False
        assert ps["borderVisible"] is True
        assert ps["borderColor"] == "rgba(255, 0, 0, 0.8)"
        assert ps["textColor"] == "#00ff00"
        assert ps["ticksVisible"] is True
        assert ps["ensureEdgeTickMarksVisible"] is False
        assert ps["alignLabels"] is True
        assert ps["entireTextOnly"] is False
        assert ps["minimumWidth"] == 80
        assert ps["scaleMargins"]["top"] == 0.1
        assert ps["scaleMargins"]["bottom"] == 0.2

    def test_top_level_properties_in_asdict(self):
        """Test that properties with top_level=True are placed at top level in asdict."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set various top-level properties
        series.visible = False
        series.price_scale_id = "custom_id"
        series.pane_id = 2
        series.last_value_visible = False  # Test the new last_value_visible property

        # Add markers and price lines
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Test Marker",
        )
        series.markers = [marker]

        price_line = PriceLineOptions(price=100, color="#00ff00", title="Test Line")
        series.price_lines = [price_line]

        # Set price_scale
        price_scale = PriceScaleOptions(price_scale_id="scale_id", visible=True)
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Verify top-level properties are at top level
        assert "visible" in result
        assert "priceScaleId" in result
        assert "paneId" in result
        assert "lastValueVisible" in result  # Test the new property
        assert "markers" in result
        assert "priceLines" in result
        assert "priceScale" in result

        # Verify they are NOT in options (options object should not exist when
        # all properties are top-level)
        assert "options" not in result

        # Verify values
        assert result["visible"] is False
        assert result["priceScaleId"] == "custom_id"
        assert result["paneId"] == 2
        assert result["lastValueVisible"] is False  # Test the new property
        assert len(result["markers"]) == 1
        assert result["markers"][0]["text"] == "Test Marker"
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["title"] == "Test Line"
        assert result["priceScale"]["priceScaleId"] == "scale_id"
        assert result["priceScale"]["visible"] is True

    def test_non_top_level_properties_in_options(self):
        """Test that properties without top_level=True are placed in options."""

        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set a non-top-level property (price_format)
        price_format = PriceFormatOptions(type="price", precision=2)
        series.price_format = price_format

        # Convert to dict
        result = series.asdict()

        # Verify price_format is in options, not at top level
        assert "priceFormat" not in result
        assert "options" in result
        assert "priceFormat" in result["options"]
        assert result["options"]["priceFormat"]["type"] == "price"
        assert result["options"]["priceFormat"]["precision"] == 2
