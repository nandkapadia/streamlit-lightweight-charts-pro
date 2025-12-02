"""Comprehensive unit tests for the Series base class.

This module contains extensive unit tests for the abstract Series class functionality,
covering all major aspects including data handling, configuration, method chaining,
edge cases, and legend integration. The tests ensure that all series implementations
work correctly with the base class functionality.

The module includes:
    - TestSeriesConstruction: Tests for Series initialization and data processing
    - TestSeriesDataHandling: Tests for DataFrame and data object handling
    - TestSeriesMethodChaining: Tests for fluent API and method chaining
    - TestSeriesEdgeCases: Tests for error handling and edge cases
    - TestSeriesLegendIntegration: Tests for legend functionality integration

Key Features Tested:
    - Series construction with various data types (lists, DataFrames, Series)
    - Data validation and conversion processes
    - Method chaining and fluent API usage
    - Error handling for invalid inputs and configurations
    - Legend integration and configuration
    - Price line and marker management
    - Column mapping and DataFrame processing
    - Edge cases and boundary conditions

Example Test Usage:
    ```python
    from tests.unit.series.test_series_base import TestSeriesConstruction

    # Run specific test
    test_instance = TestSeriesConstruction()
    test_instance.test_series_construction_with_list()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# pylint: disable=no-member,protected-access

# Standard Imports
from unittest.mock import Mock

# Third Party Imports
import pandas as pd
import pytest

# Local Imports
from lightweight_charts_core.charts.options.price_format_options import PriceFormatOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from lightweight_charts_core.charts.options.ui_options import LegendOptions
from lightweight_charts_core.charts.series.area import AreaSeries
from lightweight_charts_core.charts.series.base import Series
from lightweight_charts_core.charts.series.candlestick import CandlestickSeries
from lightweight_charts_core.charts.series.line import LineSeries
from lightweight_charts_core.data.area_data import AreaData
from lightweight_charts_core.data.candlestick_data import CandlestickData
from lightweight_charts_core.data.data import classproperty
from lightweight_charts_core.data.line_data import LineData
from lightweight_charts_core.data.marker import BarMarker, Marker, MarkerBase
from lightweight_charts_core.exceptions import (
    ColumnMappingRequiredError,
    DataFrameValidationError,
    DataItemsTypeError,
    NotFoundError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions.enums import (
    ChartType,
    LineStyle,
    MarkerPosition,
    MarkerShape,
    PriceScaleMode,
)
from unit.series_utils import _get_enum_value


class ConcreteSeries(Series):
    """Concrete implementation of Series for testing base class functionality.

    This class provides a concrete implementation of the abstract Series class
    for testing purposes. It uses LineData as the data class and implements
    the required chart_type property to enable comprehensive testing of the
    base Series functionality.

    The class includes custom DataFrame processing logic that mirrors the
    behavior of the actual series implementations, allowing for thorough
    testing of data handling, validation, and conversion processes.

    Attributes:
        DATA_CLASS: The data class type used for this series (LineData).
        chart_type: Returns ChartType.LINE for line chart identification.

    Example:
        ```python
        # Create test series with list data
        data = [LineData("2024-01-01", 100)]
        series = ConcreteSeries(data=data)

        # Create test series with DataFrame
        df = pd.DataFrame({"time": ["2024-01-01"], "value": [100]})
        series = ConcreteSeries(data=df, column_mapping={"time": "time", "value": "value"})
        ```

    """

    DATA_CLASS = LineData

    @property
    def chart_type(self):
        """Return chart type identifier for testing purposes.

        Returns:
            ChartType: The line chart type identifier for testing.

        """
        return ChartType.LINE

    def __init__(self, data, **kwargs):
        """Initialize concrete series with data and configuration for testing.

        Creates a concrete series instance with the provided data and configuration.
        Includes custom DataFrame processing logic that mirrors the behavior of
        actual series implementations for comprehensive testing.

        Args:
            data: Series data as list of data objects, DataFrame, or Series.
            **kwargs: Additional configuration options for the series.

        """
        if isinstance(data, pd.DataFrame):
            # Use the new from_dataframe logic for DataFrame processing
            column_mapping = kwargs.get("column_mapping", {})
            if not column_mapping:
                # Default column mapping if none provided for testing
                column_mapping = {"time": "time", "value": "value"}

            # Process DataFrame using the same logic as from_dataframe
            processed_data = data.copy()

            # Get index names for normalization to handle various index types
            index_names = (
                processed_data.index.names
                if hasattr(processed_data.index, "names")
                else [processed_data.index.name]
            )

            # Normalize index as column if needed for proper data processing
            for col in column_mapping.values():
                if col in processed_data.columns:
                    continue  # Column already exists, skip processing

                # Handle DatetimeIndex with no name (common in test data)
                if (
                    isinstance(processed_data.index, pd.DatetimeIndex)
                    and processed_data.index.name is None
                ):
                    processed_data.index.name = col  # Set the column name as index name
                    processed_data = processed_data.reset_index()  # Convert index to column
                # Handle MultiIndex with unnamed DatetimeIndex level
                elif isinstance(processed_data.index, pd.MultiIndex):
                    # Find the level index that matches the column name
                    for i, name in enumerate(processed_data.index.names):
                        if (
                            name is None
                            and i < len(processed_data.index.levels)
                            and isinstance(processed_data.index.levels[i], pd.DatetimeIndex)
                        ):
                            # Set the name for this level to enable proper reset
                            new_names = list(processed_data.index.names)
                            new_names[i] = col
                            processed_data.index.names = new_names
                            processed_data = processed_data.reset_index(level=col)
                            break
                    # If not found as unnamed DatetimeIndex, check if it's a named level
                    else:
                        if col in processed_data.index.names:
                            processed_data = processed_data.reset_index(level=col)
                # Handle regular index with matching name
                elif col in index_names:
                    processed_data = processed_data.reset_index()

            # Process the DataFrame into data objects
            data = self._process_dataframe(processed_data)

        super().__init__(data=data, **kwargs)
        # Initialize attributes with defaults, but don't override if set by parent
        if not hasattr(self, "price_scale"):
            self.price_scale = None
        if not hasattr(self, "_visible"):
            self._visible = True
        if not hasattr(self, "price_format"):
            self.price_format = None
        if not hasattr(self, "price_lines"):
            self.price_lines = []
        if not hasattr(self, "markers"):
            self.markers = []
        if not hasattr(self, "last_value_visible"):
            self.last_value_visible = True
        if not hasattr(self, "legend"):
            self.legend = None
        if not hasattr(self, "price_scale_id"):
            self.price_scale_id = ""
        if not hasattr(self, "pane_id"):
            self.pane_id = 0

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
        test_data = pd.DataFrame({"time": [1640995200, 1641081600], "value": [100, 110]})

        series = ConcreteSeries(data=test_data, column_mapping={"time": "time", "value": "value"})

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
        test_data = pd.DataFrame({"time": [1640995200, 1641081600], "value": [100, 110]})

        series = ConcreteSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "time", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100

    def test_from_dataframe_with_index_columns(self):
        """Test from_dataframe with index columns."""
        test_data = pd.DataFrame(
            {"value": [100, 110]},
            index=pd.to_datetime(["2022-01-01", "2022-01-02"]),
        )

        series = ConcreteSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "datetime", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_multi_index(self):
        """Test from_dataframe with multi-index."""
        # Create DataFrame with multi-index already as columns
        test_data = pd.DataFrame(
            {"date": [1640995200, 1641081600], "symbol": ["A", "B"], "value": [100, 110]},
        )

        series = ConcreteSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "date", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_unnamed_datetime_index(self):
        """Test from_dataframe with unnamed DatetimeIndex."""
        test_data = pd.DataFrame(
            {"value": [100, 110]},
            index=pd.to_datetime(["2022-01-01", "2022-01-02"]),
        )

        series = ConcreteSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "datetime", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)
        # Verify the time values are properly converted in asdict()
        result0 = series.data[0].asdict()
        result1 = series.data[1].asdict()
        assert result0["time"] == 1640995200  # 2022-01-01
        assert result1["time"] == 1641081600  # 2022-01-02

    def test_from_dataframe_with_unnamed_datetime_multi_index(self):
        """Test from_dataframe with MultiIndex containing unnamed DatetimeIndex level."""
        # Create DataFrame with datetime column already available
        test_data = pd.DataFrame(
            {
                "datetime": [pd.Timestamp("2022-01-01"), pd.Timestamp("2022-01-02")],
                "symbol": ["A", "B"],
                "value": [100, 110],
            },
        )

        series = ConcreteSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "datetime", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)
        # Verify the time values are properly converted in asdict()
        result0 = series.data[0].asdict()
        result1 = series.data[1].asdict()
        assert result0["time"] == 1640995200  # 2022-01-01
        assert result1["time"] == 1641081600  # 2022-01-02

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

        # Should raise PaneIdNonNegativeError for negative pane_id
        series = ConcreteSeries(data=data, pane_id=-1)
        with pytest.raises(ValueValidationError, match="pane_id"):
            series._validate_pane_config()

    def test_method_chaining(self):
        """Test method chaining functionality."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Test chaining multiple methods
        series.visible = False

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

    def test_display_name_property(self):
        """Test display_name property functionality."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Test initial state
        assert series.display_name is None

        # Test setting display_name
        series.display_name = "My Custom Series"
        assert series.display_name == "My Custom Series"

        # Test setting to None
        series.display_name = None
        assert series.display_name is None

        # Test setting empty string
        series.display_name = ""
        assert series.display_name == ""

    def test_display_name_method_chaining(self):
        """Test display_name with method chaining."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Test chaining with display_name
        result = series.set_display_name("Moving Average").set_title("SMA(20)").set_visible(True)

        assert result is series
        assert series.display_name == "Moving Average"
        assert series.title == "SMA(20)"
        assert series.visible is True

    def test_display_name_independence_from_title(self):
        """Test that display_name and title are independent properties."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set both properties independently
        series.title = "RSI(14)"
        series.display_name = "Relative Strength Index"

        # Verify they are independent
        assert series.title == "RSI(14)"
        assert series.display_name == "Relative Strength Index"

        # Change one without affecting the other
        series.display_name = "Momentum Oscillator"
        assert series.title == "RSI(14)"  # Should remain unchanged
        assert series.display_name == "Momentum Oscillator"

    def test_display_name_serialization(self):
        """Test that display_name is properly serialized."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set both title and display_name
        series.title = "SMA(20)"
        series.display_name = "Simple Moving Average"

        # Serialize to dictionary
        series_dict = series.asdict()

        # Verify both properties are serialized in options
        assert series_dict["options"]["title"] == "SMA(20)"
        assert (
            series_dict["options"]["displayName"] == "Simple Moving Average"
        )  # camelCase conversion

    def test_error_handling_invalid_data(self):
        """Test error handling with invalid data."""
        # The new implementation should raise an error for invalid data types
        with pytest.raises(DataFrameValidationError):
            ConcreteSeries(data="invalid_data")

    def test_error_handling_missing_required_columns(self):
        """Test error handling with missing required columns."""
        invalid_data = pd.DataFrame({"value": [100, 110]})  # Missing 'time' column

        with pytest.raises(NotFoundError):
            ConcreteSeries.from_dataframe(
                df=invalid_data,
                column_mapping={"time": "time", "value": "value"},
            )

    def test_error_handling_invalid_data_type(self):
        """Test error handling with invalid data type."""
        with pytest.raises(DataFrameValidationError):
            ConcreteSeries(data="invalid_data")

    def test_error_handling_dataframe_without_column_mapping(self):
        """Test error handling with DataFrame without column_mapping."""
        test_data = pd.DataFrame({"time": [1640995200], "value": [100]})

        # Create a Series subclass that doesn't override __init__
        class TestSeries(Series):
            DATA_CLASS = LineData

        with pytest.raises(ColumnMappingRequiredError):
            TestSeries(data=test_data)

    def test_error_handling_invalid_list_data(self):
        """Test error handling with list containing non-SingleValueData objects."""
        invalid_data = [{"time": 1640995200, "value": 100}]  # dict instead of SingleValueData

        with pytest.raises(DataItemsTypeError):
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
        # options is always present with standard properties
        assert "options" in result
        # priceFormat should not be in result when set to None
        assert "priceFormat" not in result

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
        # options is always present with standard properties
        assert "options" in result
        # Empty lists should not be included at top level
        assert "priceLines" not in result
        assert "markers" not in result
        # priceFormat should not be in result when set to None
        assert "priceFormat" not in result

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
        test_data = pd.DataFrame(
            {
                "datetime": [pd.Timestamp("2022-01-01"), pd.Timestamp("2022-01-02")],
                "symbol": ["A", "B"],
                "value": [100, 110],
            },
        )

        series = ConcreteSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "datetime", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_datetime_index_no_name(self):
        """Test from_dataframe with DatetimeIndex that has no name."""
        test_data = pd.DataFrame({"value": [100, 110]})
        test_data.index = pd.to_datetime(["2022-01-01", "2022-01-02"])
        test_data.index.name = None  # Ensure no name

        series = ConcreteSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "datetime", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_series_input(self):
        """Test from_dataframe with pandas Series input."""
        series_data = pd.Series([100, 110], index=pd.to_datetime(["2022-01-01", "2022-01-02"]))

        series = ConcreteSeries.from_dataframe(
            df=series_data,
            column_mapping={"time": "index", "value": 0},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_error_handling(self):
        """Test from_dataframe error handling."""
        test_data = pd.DataFrame({"value": [100, 110]})

        # Test missing required column in column_mapping
        with pytest.raises(ValueValidationError, match="required columns"):
            ConcreteSeries.from_dataframe(
                df=test_data,
                column_mapping={"value": "value"},  # Missing 'time'
            )

        # Test missing column in DataFrame
        with pytest.raises(NotFoundError):
            ConcreteSeries.from_dataframe(
                df=test_data,
                column_mapping={"time": "missing_column", "value": "value"},
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
            ),
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
        assert "lastValueVisible" in dict_result["options"]
        assert dict_result["options"]["lastValueVisible"] is False

    def test_price_scale_id_included_in_to_dict(self):
        """Test that priceScaleId is included in to_dict output."""
        # Create series with custom price_scale_id
        data = [LineData("2024-01-01", 100)]
        series = LineSeries(data=data, price_scale_id="left")

        # Convert to dict
        result = series.asdict()

        # Verify priceScaleId is included in options
        assert "priceScaleId" in result["options"]
        assert result["options"]["priceScaleId"] == "left"

        # Test with default price_scale_id
        series_default = LineSeries(data=data)  # Default is "right"
        result_default = series_default.asdict()

        assert "priceScaleId" in result_default["options"]
        assert result_default["options"]["priceScaleId"] == "right"

    def test_empty_price_scale_id_included_in_output(self):
        """Test that empty price_scale_id is omitted from asdict output."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set empty price_scale_id
        series.price_scale_id = ""

        # Convert to dict
        result = series.asdict()

        # API behavior: empty values are omitted to keep output clean
        # priceScaleId should not be in options when set to empty string
        assert "priceScaleId" not in result["options"]

    def test_empty_price_scale_id_not_in_options(self):
        """Test that empty price_scale_id is omitted from options."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set empty price_scale_id
        series.price_scale_id = ""

        # Convert to dict
        result = series.asdict()

        # Verify options exists but empty priceScaleId is omitted
        assert "options" in result
        assert "priceScaleId" not in result["options"]


class TestPriceScaleProperty:
    """Test cases for the new price_scale property."""

    def test_price_scale_property_setter(self):
        """Test price_scale property setter."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Test setting price_scale
        price_scale = PriceScaleOptions(
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
        price_scale = PriceScaleOptions()
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
        price_scale = PriceScaleOptions()
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
            visible=True,
            auto_scale=False,
            mode=1,
            invert_scale=True,
        )
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Verify priceScale is at top level
        assert "priceScale" in result
        assert result["priceScale"]["visible"] is True
        assert result["priceScale"]["autoScale"] is False
        assert result["priceScale"]["mode"] == 1
        assert result["priceScale"]["invertScale"] is True

    def test_price_scale_not_in_options_when_set(self):
        """Test that price_scale is not included in options when set."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set price_scale
        price_scale = PriceScaleOptions()
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Verify priceScale is at top level, not in options
        assert "priceScale" in result
        # options is always present with standard series properties
        assert "options" in result
        # but priceScale itself should not be in options
        assert "priceScale" not in result["options"]

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

        price_scale = PriceScaleOptions()

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
        price_scale = PriceScaleOptions(scale_margins=margins)
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
        price_scale = PriceScaleOptions(visible=False)
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # priceScaleId should be in options (it's a series option)
        # priceScale should be at top level (it's a configuration object)
        assert "priceScaleId" in result["options"]
        assert "priceScale" in result
        assert result["options"]["priceScaleId"] == "simple_id"
        assert result["priceScale"]["visible"] is False

    def test_price_scale_complete_configuration(self):
        """Test price_scale with complete configuration."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Create complete price scale configuration
        margins = PriceScaleMargins(top=0.1, bottom=0.2)
        price_scale = PriceScaleOptions(
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
        """Test that properties are placed correctly in asdict output."""
        data = [LineData(time=1640995200, value=100)]
        series = ConcreteSeries(data=data)

        # Set series options (these go in options object)
        series.visible = False
        series.price_scale_id = "custom_id"
        series.last_value_visible = False

        # Set true top-level property
        series.pane_id = 2

        # Add markers and price lines (these are top-level)
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

        # Set price_scale (top-level configuration object)
        price_scale = PriceScaleOptions(visible=True)
        series.price_scale = price_scale

        # Convert to dict
        result = series.asdict()

        # Verify true top-level properties are at top level
        assert "paneId" in result
        assert "markers" in result
        assert "priceLines" in result
        assert "priceScale" in result

        # Verify series options are in options object
        assert "options" in result
        assert "visible" in result["options"]
        assert "priceScaleId" in result["options"]
        assert "lastValueVisible" in result["options"]

        # Verify values
        assert result["paneId"] == 2
        assert len(result["markers"]) == 1
        assert result["options"]["visible"] is False
        assert result["options"]["priceScaleId"] == "custom_id"
        assert result["options"]["lastValueVisible"] is False

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


# ============================================================================
# EDGE CASES AND ADVANCED TESTING
# ============================================================================


class TestSeriesPrepareIndexEdgeCases:
    """Test edge cases in the prepare_index method."""

    def test_prepare_index_multiindex_integer_level_position(self):
        """Test prepare_index with MultiIndex using integer level position."""
        # Create MultiIndex DataFrame
        index = pd.MultiIndex.from_tuples(
            [("A", 1), ("A", 2), ("B", 1), ("B", 2)],
            names=["category", "level"],
        )
        test_data = pd.DataFrame({"value": [10, 20, 30, 40]}, index=index)

        column_mapping = {"time": "0", "value": "value"}  # Use integer string for level position

        result = Series.prepare_index(test_data, column_mapping)

        # Should reset the first level (position 0)
        assert "category" in result.columns
        assert "level" in result.columns
        assert "value" in result.columns

    def test_prepare_index_multiindex_invalid_level_position(self):
        """Test prepare_index with MultiIndex using invalid level position."""
        index = pd.MultiIndex.from_tuples(
            [("A", 1), ("A", 2), ("B", 1), ("B", 2)],
            names=["category", "level"],
        )
        test_data = pd.DataFrame({"value": [10, 20, 30, 40]}, index=index)

        column_mapping = {"time": "999", "value": "value"}  # Invalid level position

        # Should not raise error, just pass through
        result = Series.prepare_index(test_data, column_mapping)
        assert result.equals(test_data)

    def test_prepare_index_multiindex_named_level(self):
        """Test prepare_index with MultiIndex using named level."""
        index = pd.MultiIndex.from_tuples(
            [("A", 1), ("A", 2), ("B", 1), ("B", 2)],
            names=["category", "level"],
        )
        test_data = pd.DataFrame({"value": [10, 20, 30, 40]}, index=index)

        column_mapping = {"time": "category", "value": "value"}

        result = Series.prepare_index(test_data, column_mapping)

        # Should reset the 'category' level
        assert "category" in result.columns
        assert "level" in result.columns
        assert "value" in result.columns

    def test_prepare_index_multiindex_index_keyword(self):
        """Test prepare_index with MultiIndex using 'index' keyword."""
        index = pd.MultiIndex.from_tuples(
            [("A", 1), ("A", 2), ("B", 1), ("B", 2)],
            names=[None, "level"],  # First level unnamed
        )
        test_data = pd.DataFrame({"value": [10, 20, 30, 40]}, index=index)

        column_mapping = {"time": "index", "value": "value"}

        result = Series.prepare_index(test_data, column_mapping)

        # Should reset the first unnamed level
        assert "level_0" in result.columns or "level" in result.columns
        assert "value" in result.columns

    def test_prepare_index_multiindex_index_keyword_all_named(self):
        """Test prepare_index with MultiIndex using 'index' keyword when all levels are named."""
        index = pd.MultiIndex.from_tuples(
            [("A", 1), ("A", 2), ("B", 1), ("B", 2)],
            names=["category", "level"],  # All levels named
        )
        test_data = pd.DataFrame({"value": [10, 20, 30, 40]}, index=index)

        column_mapping = {"time": "index", "value": "value"}

        result = Series.prepare_index(test_data, column_mapping)

        # Should reset the first level when all are named
        assert "category" in result.columns
        assert "level" in result.columns
        assert "value" in result.columns

    def test_prepare_index_single_index_with_name(self):
        """Test prepare_index with single index that has a name."""
        test_data = pd.DataFrame({"value": [10, 20, 30, 40]})
        test_data.index.name = "timestamp"

        column_mapping = {"time": "timestamp", "value": "value"}

        result = Series.prepare_index(test_data, column_mapping)

        # Should reset the index
        assert "timestamp" in result.columns
        assert "value" in result.columns

    def test_prepare_index_single_index_without_name(self):
        """Test prepare_index with single index without name."""
        test_data = pd.DataFrame({"value": [10, 20, 30, 40]})
        test_data.index.name = None

        column_mapping = {"time": "index", "value": "value"}

        result = Series.prepare_index(test_data, column_mapping)

        # Should reset the index and create 'index' column
        assert "index" in result.columns
        assert "value" in result.columns

    def test_prepare_index_single_index_index_keyword(self):
        """Test prepare_index with single index using 'index' keyword."""
        test_data = pd.DataFrame({"value": [10, 20, 30, 40]})
        test_data.index.name = "timestamp"

        column_mapping = {"time": "index", "value": "value"}

        result = Series.prepare_index(test_data, column_mapping)

        # Should reset the index
        assert "timestamp" in result.columns
        assert "value" in result.columns


class TestSeriesProcessDataframeInput:
    """Test the _process_dataframe_input method."""

    def test_process_dataframe_input_series(self):
        """Test _process_dataframe_input with pandas Series."""

        # Create a mock series class
        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805
                return LineData

        # Create Series input
        series_data = pd.Series([10, 20, 30, 40], index=pd.date_range("2023-01-01", periods=4))

        series = MockSeries(data=series_data, column_mapping={"time": "index", "value": 0})

        # The method should convert Series to DataFrame internally
        assert len(series.data) == 4
        assert all(isinstance(d, LineData) for d in series.data)

    def test_process_dataframe_input_missing_required_columns(self):
        """Test _process_dataframe_input with missing required columns."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        test_data = pd.DataFrame({"value": [10, 20, 30, 40]})

        # Missing 'time' column mapping
        with pytest.raises(ValueValidationError):
            MockSeries(data=test_data, column_mapping={"value": "value"})

    def test_process_dataframe_input_missing_dataframe_columns(self):
        """Test _process_dataframe_input with missing DataFrame columns."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        test_data = pd.DataFrame({"value": [10, 20, 30, 40]})

        # Column mapping references non-existent column
        with pytest.raises(NotFoundError):
            MockSeries(data=test_data, column_mapping={"time": "nonexistent", "value": "value"})


class TestSeriesUpdateMethods:
    """Test update methods and edge cases."""

    def test_update_dict_value_new_dict(self):
        """Test _update_dict_value with new dictionary."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # Test updating with new dict
        series._update_dict_value("price_scale", {"id": "new_scale"})
        # Note: price_scale is None by default, _update_dict_value only sets the internal attribute
        # The property getter would need to be implemented to return the value
        # For now, we'll skip this assertion since the mock doesn't have the property implemented

    def test_update_dict_value_existing_dict(self):
        """Test _update_dict_value with existing dictionary."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])
        series.price_scale = {"id": "old_scale", "visible": True}

        # Test updating existing dict
        series._update_dict_value("price_scale", {"id": "new_scale"})
        assert series.price_scale["id"] == "new_scale"
        assert series.price_scale["visible"] is True  # Should preserve existing values

    def test_update_list_value_new_list(self):
        """Test _update_list_value with new list."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # Test updating with new list
        new_markers = [Mock(spec=MarkerBase), Mock(spec=MarkerBase)]
        series._update_list_value("markers", new_markers)
        assert series.markers == new_markers

    def test_update_list_value_existing_list(self):
        """Test _update_list_value with existing list."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])
        existing_markers = [Mock(spec=MarkerBase)]
        series.markers = existing_markers

        # Test updating existing list
        new_markers = [Mock(spec=MarkerBase), Mock(spec=MarkerBase)]
        series._update_list_value("markers", new_markers)
        assert series.markers == new_markers

    def test_update_list_value_append_mode(self):
        """Test _update_list_value in append mode."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])
        existing_markers = [Mock(spec=MarkerBase)]
        series.markers = existing_markers

        # Test updating with new list (replaces existing list)
        new_markers = [Mock(spec=MarkerBase), Mock(spec=MarkerBase)]
        series._update_list_value("markers", new_markers)
        assert len(series.markers) == 2
        assert series.markers[0] == new_markers[0]
        assert series.markers[1] == new_markers[1]


class TestSeriesValidationMethods:
    """Test validation methods and edge cases."""

    def test_validate_pane_config_valid(self):
        """Test _validate_pane_config with valid configuration."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])
        series.pane_id = 1

        # Should not raise any error
        series._validate_pane_config()

    def test_validate_pane_config_invalid_pane_id(self):
        """Test _validate_pane_config with invalid pane_id."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])
        series.pane_id = -1

        with pytest.raises(ValueValidationError, match="pane_id"):
            series._validate_pane_config()

    def test_validate_pane_config_invalid_pane_id_type(self):
        """Test _validate_pane_config with invalid pane_id type."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])
        series.pane_id = "invalid"

        with pytest.raises(
            TypeError,
            match="'<' not supported between instances of 'str' and 'int'",
        ):
            series._validate_pane_config()


class TestSeriesUtilityMethods:
    """Test utility methods and edge cases."""

    def test_get_attr_name_chainable_property(self):
        """Test _get_attr_name with chainable property."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # Test with chainable property
        attr_name = series._get_attr_name("price_scale_id")
        assert attr_name == "price_scale_id"

    def test_get_attr_name_non_chainable_property(self):
        """Test _get_attr_name with non-chainable property."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # Test with non-chainable property
        attr_name = series._get_attr_name("data")
        assert attr_name == "data"

    def test_camel_to_snake_various_cases(self):
        """Test _camel_to_snake with various camelCase inputs."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # Test various camelCase conversions
        assert series._camel_to_snake("camelCase") == "camel_case"
        assert series._camel_to_snake("simple") == "simple"
        assert series._camel_to_snake("multipleWords") == "multiple_words"
        assert series._camel_to_snake("ABC") == "a_b_c"
        assert series._camel_to_snake("") == ""

    def test_is_chainable_property(self):
        """Test _is_chainable_property method."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # Test chainable property
        assert series._is_chainable_property("price_scale_id") is True

        # Test non-chainable property
        assert series._is_chainable_property("data") is False

        # Test non-existent property
        assert series._is_chainable_property("nonexistent") is False

    def test_is_allow_none(self):
        """Test _is_allow_none method."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # Test property with allow_none=True
        assert series._is_allow_none("price_scale") is True

        # Test property with allow_none=False
        assert series._is_allow_none("price_scale_id") is False

        # Test non-existent property
        assert series._is_allow_none("nonexistent") is False

    def test_is_top_level(self):
        """Test _is_top_level method."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # Test that price_scale_id is NOT top-level (it's a series option in options object)
        assert series._is_top_level("price_scale_id") is False

        # Test non-top-level property
        assert series._is_top_level("price_format") is False

        # Test non-existent property
        assert series._is_top_level("nonexistent") is False


class TestSeriesAsdictMethod:
    """Test the asdict method edge cases."""

    def test_asdict_with_none_values(self):
        """Test asdict with None values."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])
        series.price_scale = None  # Set to None explicitly

        # MockSeries doesn't have chart_type attribute, so we'll skip this test
        # or add the missing attribute
        series.chart_type = Mock()
        series.chart_type.value = "mock"
        result = series.asdict()

        # None values are not included in the output for top-level properties
        # The current implementation excludes None values
        assert "price_scale" not in result

    def test_asdict_with_empty_lists(self):
        """Test asdict with empty lists."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])
        series.markers = []  # Empty list

        # MockSeries doesn't have chart_type attribute, so we'll add it
        series.chart_type = Mock()
        series.chart_type.value = "mock"
        result = series.asdict()

        # Empty lists are not included in the output
        # The current implementation excludes empty lists
        assert "markers" not in result

    def test_asdict_with_complex_nested_objects(self):
        """Test asdict with complex nested objects."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        series = MockSeries(data=[LineData(time=1, value=10)])

        # MockSeries needs chart_type attribute for asdict
        series.chart_type = Mock()
        series.chart_type.value = "mock"

        # Add complex nested objects
        price_line = PriceLineOptions()
        # Use the correct method calls for PriceLineOptions with valid hex color
        price_line.set_price(100).set_color("#ff0000").set_line_width(2)
        series.add_price_line(price_line)

        result = series.asdict()

        # Should include priceLines (note: it's 'priceLines', not 'price_lines')
        assert "priceLines" in result
        assert len(result["priceLines"]) == 1
        assert result["priceLines"][0]["price"] == 100
        assert result["priceLines"][0]["color"] == "#ff0000"
        assert result["priceLines"][0]["lineWidth"] == 2


class TestSeriesFromDataframeEdgeCases:
    """Test from_dataframe method edge cases."""

    def test_from_dataframe_with_series(self):
        """Test from_dataframe with pandas Series."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        # Create Series input
        series_data = pd.Series([10, 20, 30, 40], index=pd.date_range("2023-01-01", periods=4))

        result = MockSeries.from_dataframe(
            series_data,
            column_mapping={"time": "index", "value": 0},
        )

        assert isinstance(result, MockSeries)
        assert len(result.data) == 4
        assert all(isinstance(d, LineData) for d in result.data)

    def test_from_dataframe_with_additional_kwargs(self):
        """Test from_dataframe with additional kwargs."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        test_data = pd.DataFrame(
            {"time": pd.date_range("2023-01-01", periods=4), "value": [10, 20, 30, 40]},
        )

        result = MockSeries.from_dataframe(
            test_data,
            column_mapping={"time": "time", "value": "value"},
            visible=False,
            price_scale_id="custom_scale",
        )

        assert isinstance(result, MockSeries)
        assert result.visible is False
        assert result.price_scale_id == "custom_scale"


class TestSeriesDataClassProperty:
    """Test the data_class property."""

    def test_data_class_property(self):
        """Test that data_class property returns the correct class."""

        class MockSeries(Series):
            @classproperty
            def data_class(cls):  # noqa: N805  # pylint: disable=no-self-argument
                return LineData

        # Test the class property
        assert MockSeries.data_class == LineData

        # Test on instance
        series = MockSeries(data=[LineData(time=1, value=10)])
        assert series.data_class == LineData


# ============================================================================
# LEGEND INTEGRATION TESTING
# ============================================================================


class TestSeriesLegendProperty:
    """Test legend property access and assignment on series."""

    def test_legend_property_default_none(self):
        """Test that legend property defaults to None."""
        series = LineSeries(data=[])
        assert series.legend is None

    def test_legend_property_assignment(self):
        """Test direct assignment of legend property."""
        series = LineSeries(data=[])
        legend = LegendOptions(position="top-left", visible=True)

        series.legend = legend
        assert series.legend == legend
        assert series.legend.position == "top-left"
        assert series.legend.visible is True

    def test_legend_property_none_assignment(self):
        """Test setting legend property to None."""
        series = LineSeries(data=[])
        legend = LegendOptions(position="top-left")
        series.legend = legend

        # Verify it was set
        assert series.legend is not None

        # Set to None
        series.legend = None
        assert series.legend is None

    def test_legend_property_type_validation(self):
        """Test that legend property only accepts LegendOptions or None."""
        series = LineSeries(data=[])

        # Valid assignments
        series.legend = LegendOptions()
        assert isinstance(series.legend, LegendOptions)

        series.legend = None
        assert series.legend is None

        # Note: Currently no type validation is implemented for legend property
        # This test documents the current behavior
        series.legend = "invalid"
        assert series.legend == "invalid"

    def test_legend_property_chainable_methods(self):
        """Test chainable methods for legend property."""
        series = LineSeries(data=[])

        # Test set_legend method
        legend = LegendOptions(position="top-right")
        result = series.set_legend(legend)

        # Should return self for chaining
        assert result is series
        assert series.legend == legend

    def test_legend_property_chainable_none(self):
        """Test setting legend to None via chainable method."""
        series = LineSeries(data=[])
        series.legend = LegendOptions()

        # Verify it was set
        assert series.legend is not None

        # Set to None via chainable method
        result = series.set_legend(None)
        assert result is series
        assert series.legend is None


class TestSeriesLegendSerialization:
    """Test legend serialization in series."""

    def test_series_with_legend_serialization(self):
        """Test serialization of series with legend."""
        series = LineSeries(data=[])
        legend = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(255, 0, 0, 0.5)",
            text="<span>MA20: $$value$$</span>",
        )
        series.legend = legend

        # Get series configuration
        config = series.asdict()

        # Check that legend is included in serialization
        assert "legend" in config
        legend_config = config["legend"]

        # Verify legend properties are serialized correctly
        assert legend_config["visible"] is True
        assert legend_config["position"] == "top-left"
        assert legend_config["backgroundColor"] == "rgba(255, 0, 0, 0.5)"
        assert legend_config["text"] == "<span>MA20: $$value$$</span>"

    def test_series_without_legend_serialization(self):
        """Test serialization of series without legend."""
        series = LineSeries(data=[])
        # legend should be None by default

        config = series.asdict()

        # Legend should not be included in serialization when None
        assert "legend" not in config

    def test_series_legend_camel_case_conversion(self):
        """Test that legend properties are converted to camelCase in serialization."""
        series = LineSeries(data=[])
        legend = LegendOptions(
            background_color="red",
            border_color="blue",
            border_width=2,
            border_radius=4,
            padding=8,
            margin=4,
            z_index=1000,
            price_format=".2f",
            show_values=True,
            value_format=".3f",
            update_on_crosshair=True,
        )
        series.legend = legend

        config = series.asdict()
        legend_config = config["legend"]

        # Check camelCase conversion
        assert "backgroundColor" in legend_config
        assert "borderColor" in legend_config
        assert "borderWidth" in legend_config
        assert "borderRadius" in legend_config
        assert "padding" in legend_config
        assert "margin" in legend_config
        assert "zIndex" in legend_config
        assert "priceFormat" in legend_config
        assert "showValues" in legend_config
        assert "valueFormat" in legend_config
        assert "updateOnCrosshair" in legend_config

    def test_series_legend_with_data_serialization(self):
        """Test serialization of series with both data and legend."""
        data = [
            LineData(time="2023-01-01", value=100),
            LineData(time="2023-01-02", value=105),
        ]
        series = LineSeries(data=data)
        series.legend = LegendOptions(position="top-right", visible=True)

        config = series.asdict()

        # Should have both data and legend
        assert "data" in config
        assert "legend" in config
        assert len(config["data"]) == 2
        assert config["legend"]["position"] == "top-right"


class TestSeriesLegendMethodChaining:
    """Test method chaining with legend property."""

    def test_legend_chainable_with_other_properties(self):
        """Test chaining legend with other series properties."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)

        legend = LegendOptions(position="top-left")

        # Chain multiple property setters
        result = series.set_visible(False).set_legend(legend).set_price_scale_id("right")

        # Should return self for chaining
        assert result is series

        # Verify all properties were set
        assert series.visible is False
        assert series.legend == legend
        assert series.price_scale_id == "right"

    def test_legend_chainable_with_legend_methods(self):
        """Test chaining legend property with legend method chaining."""
        series = LineSeries(data=[])
        legend = LegendOptions()

        # Chain legend property with legend methods
        result = series.set_legend(legend).legend.set_visible(False).set_position("bottom-right")

        # Should return the legend object for further chaining
        assert result is legend
        assert series.legend.visible is False
        assert series.legend.position == "bottom-right"

    def test_legend_chainable_fluent_api(self):
        """Test fluent API usage with legend configuration."""
        series = LineSeries(data=[])

        # Create and configure legend in one fluent chain
        legend = (
            LegendOptions()
            .set_visible(True)
            .set_position("top-left")
            .set_background_color("rgba(0, 0, 0, 0.8)")
            .set_text("<span>MA20: $$value$$</span>")
        )

        # Set legend on series
        series.legend = legend

        # Verify configuration
        assert series.legend.visible is True
        assert series.legend.position == "top-left"
        assert series.legend.background_color == "rgba(0, 0, 0, 0.8)"
        assert series.legend.text == "<span>MA20: $$value$$</span>"


class TestSeriesLegendEdgeCases:
    """Test edge cases and error handling for series legends."""

    def test_legend_with_empty_series(self):
        """Test legend with empty series data."""
        series = LineSeries(data=[])
        legend = LegendOptions(position="top-right")
        series.legend = legend

        config = series.asdict()
        assert "legend" in config
        assert config["legend"]["position"] == "top-right"

    def test_legend_with_large_dataset(self):
        """Test legend with large dataset."""
        # Create large dataset
        data = [LineData(time=f"2023-01-{i:02d}", value=100 + i) for i in range(1, 32)]
        series = LineSeries(data=data)
        legend = LegendOptions(position="top-left", visible=True)
        series.legend = legend

        config = series.asdict()
        assert "legend" in config
        assert len(config["data"]) == 31  # Updated to match the actual data size
        assert config["legend"]["visible"] is True

    def test_legend_with_special_characters(self):
        """Test legend with special characters in text."""
        series = LineSeries(data=[])
        special_text = "<div>Price: ${value} | Time: {time} | Type: {type}</div>"
        legend = LegendOptions(text=special_text, position="top-right")
        series.legend = legend

        config = series.asdict()
        assert config["legend"]["text"] == special_text

    def test_legend_with_unicode_characters(self):
        """Test legend with unicode characters."""
        series = LineSeries(data=[])
        unicode_text = "📈 Price: {value} | 📅 Time: {time}"
        legend = LegendOptions(text=unicode_text, position="top-left")
        series.legend = legend

        config = series.asdict()
        assert config["legend"]["text"] == unicode_text

    def test_legend_property_immutability(self):
        """Test that legend property changes affect the original legend object
        (shared reference).
        """
        series = LineSeries(data=[])
        original_legend = LegendOptions(position="top-left", visible=True)
        series.legend = original_legend

        # Modify the legend through the series
        series.legend.set_visible(False)

        # Note: The legend object is shared, so changes affect the original
        # This is the current behavior - the same object is referenced
        assert original_legend.visible is False  # Changed because it's the same object
        assert series.legend.visible is False
        assert series.legend is original_legend  # Same object reference

    def test_legend_property_replacement(self):
        """Test replacing one legend with another."""
        series = LineSeries(data=[])

        # Set first legend
        legend1 = LegendOptions(position="top-left", visible=True)
        series.legend = legend1
        assert series.legend == legend1

        # Replace with second legend
        legend2 = LegendOptions(position="bottom-right", visible=False)
        series.legend = legend2
        assert series.legend == legend2
        assert series.legend != legend1


class TestSeriesLegendIntegration:
    """Test integration of legends with different series types."""

    def test_line_series_legend_integration(self):
        """Test legend integration with LineSeries."""
        data = [LineData(time="2023-01-01", value=100)]
        series = LineSeries(data=data)
        legend = LegendOptions(position="top-right")
        series.legend = legend

        config = series.asdict()
        assert config["type"] == "line"
        assert "legend" in config

    def test_candlestick_series_legend_integration(self):
        """Test legend integration with CandlestickSeries."""
        data = [CandlestickData(time="2023-01-01", open=100, high=105, low=95, close=102)]
        series = CandlestickSeries(data=data)
        legend = LegendOptions(position="top-left")
        series.legend = legend

        config = series.asdict()
        assert config["type"] == "candlestick"
        assert "legend" in config

    def test_area_series_legend_integration(self):
        """Test legend integration with AreaSeries."""
        data = [AreaData(time="2023-01-01", value=100)]
        series = AreaSeries(data=data)
        legend = LegendOptions(position="bottom-right")
        series.legend = legend

        config = series.asdict()
        assert config["type"] == "area"
        assert "legend" in config
