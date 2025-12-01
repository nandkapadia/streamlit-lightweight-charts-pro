"""Comprehensive unit tests for the LineSeries class.

This module contains extensive unit tests for the LineSeries class,
which represents line chart series for financial chart visualization.
The tests cover construction, configuration, data handling, and frontend
compatibility.

The module combines all tests for LineSeries functionality including:
    - Basic construction and functionality
    - Extended features and edge cases
    - JSON format validation and frontend compatibility
    - DataFrame integration and column mapping
    - Method chaining and fluent API usage
    - Error handling and validation

Key Features Tested:
    - LineSeries construction with various data types
    - LineOptions integration and configuration
    - Marker and price line management
    - DataFrame and Series data handling
    - Column mapping and data validation
    - Frontend serialization and JSON compatibility
    - Method chaining and fluent API patterns

Example Test Usage:
    ```python
    from tests.unit.series.test_line_series import TestLineSeriesConstruction

    # Run specific test
    test_instance = TestLineSeriesConstruction()
    test_instance.test_line_series_construction_with_list()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# pylint: disable=invalid-name,protected-access,no-member

# Standard Imports
import json

# Third Party Imports
import numpy as np
import pandas as pd
import pytest

# Local Imports
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.charts.options.price_format_options import PriceFormatOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.charts.series.line import LineSeries
from lightweight_charts_core.data import Marker
from lightweight_charts_core.data.line_data import LineData
from lightweight_charts_core.data.marker import BarMarker
from lightweight_charts_core.exceptions import (
    InstanceTypeError,
    NotFoundError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions.enums import (
    ChartType,
    LastPriceAnimationMode,
    LineStyle,
    LineType,
    MarkerPosition,
    MarkerShape,
)


@pytest.fixture
def line_options():
    """Fixture providing LineOptions for testing.

    Returns:
        LineOptions: Configured line options with blue color and width 2

    """
    # Create LineOptions with blue color and medium width for testing
    return LineOptions(color="#2196F3", line_width=2)


@pytest.fixture
def line_data():
    """Fixture providing LineData list for testing.

    Returns:
        list[LineData]: List of LineData objects with two data points

    """
    # Create a list of LineData objects for testing series functionality
    # Using sequential timestamps and ascending values for realistic test data
    return [
        LineData(time=1704067200, value=100.0, color="#2196F3"),  # First data point
        LineData(time=1704153600, value=105.0, color="#2196F3"),  # Second data point
    ]


@pytest.fixture
def df():
    return pd.DataFrame(
        {
            "datetime": ["2024-01-01", "2024-01-02"],
            "close": [100.0, 105.0],
            "color": ["#2196F3", "#2196F3"],
        },
    )


@pytest.fixture
def column_mapping():
    return {"time": "time", "value": "value"}


class TestLineSeriesBasic:
    """Basic test cases for LineSeries."""

    def test_construction(self, line_data, line_options):
        series = LineSeries(data=line_data)
        assert series.data == line_data
        # Set line_options after construction since it's no longer a constructor parameter
        series.line_options = line_options
        assert series.line_options == line_options

    def test_from_dataframe(self, sample_dataframe, column_mapping):
        series = LineSeries.from_dataframe(sample_dataframe, column_mapping)
        assert len(series.data) == 10  # sample_dataframe has 10 rows
        assert isinstance(series.data[0], LineData)
        assert isinstance(series.data[0].value, (int, float, np.integer, np.floating))
        # Check that all data items are LineData instances
        assert all(isinstance(d, LineData) for d in series.data)

    def test_missing_required_column_in_mapping(self, sample_dataframe):
        bad_mapping = {"value": "close", "color": "color"}  # missing 'time'
        with pytest.raises(ValueValidationError, match="required"):
            LineSeries.from_dataframe(sample_dataframe, bad_mapping)

    def test_missing_required_column_in_dataframe(self):
        bad_test_data = pd.DataFrame({"close": [100.0, 105.0], "color": ["#2196F3", "#2196F3"]})
        mapping = {"time": "datetime", "value": "close", "color": "color"}
        with pytest.raises(NotFoundError):
            LineSeries.from_dataframe(bad_test_data, mapping)

    def test_to_dict_structure(self, line_data):
        series = LineSeries(data=line_data)
        d = series.asdict()
        assert d["type"] == "line"
        assert isinstance(d["data"], list)
        assert "options" in d
        # priceLines should only be present when price lines are added

    def test_set_price_format_and_price_lines(self, line_data):
        series = LineSeries(data=line_data)
        pf = PriceFormatOptions(type="price", precision=2)
        pl = PriceLineOptions(price=100.0, color="#2196F3")
        series.price_format = pf
        series.add_price_line(pl)
        assert series.price_format == pf
        assert pl in series.price_lines

    def test_set_markers(self, line_data):
        series = LineSeries(data=line_data)
        m1 = BarMarker(time=1704067200, position="aboveBar", color="#2196F3", shape="circle")
        m2 = BarMarker(time=1704153600, position="belowBar", color="#2196F3", shape="circle")
        series.markers = [m1, m2]
        assert series.markers == [m1, m2]

    def test_empty_data(self):
        series = LineSeries(data=[])
        assert not series.data
        d = series.asdict()
        assert d["data"] == []

    def test_extra_columns_in_dataframe(self):
        test_data = pd.DataFrame(
            {"datetime": ["2024-01-01"], "close": [100.0], "color": ["#2196F3"], "extra": [123]},
        )
        mapping = {"time": "datetime", "value": "close", "color": "color"}
        series = LineSeries.from_dataframe(test_data, mapping)
        assert len(series.data) == 1
        assert series.data[0].value == 100.0

    def test_nan_handling(self):
        test_data = pd.DataFrame(
            {"datetime": ["2024-01-01"], "close": [float("nan")], "color": ["#2196F3"]},
        )
        mapping = {"time": "datetime", "value": "close", "color": "color"}
        series = LineSeries.from_dataframe(test_data, mapping)
        assert series.data[0].value == 0.0

    def test_method_chaining(self, line_data):
        series = LineSeries(data=line_data)
        m1 = BarMarker(time=1704067200, position="aboveBar", color="#2196F3", shape="circle")
        m2 = BarMarker(time=1704153600, position="belowBar", color="#2196F3", shape="circle")
        pl = PriceLineOptions(price=100.0, color="#2196F3")
        # Chain multiple mutators
        result = (
            series.set_visible(False)
            .add_marker(m1)
            .add_markers([m2])
            .add_price_line(pl)
            .clear_markers()
            .clear_price_lines()
        )
        assert result is series
        assert series._visible is False
        assert not series.markers
        assert not series.price_lines

    def test_add_marker_chaining(self, line_data):
        series = LineSeries(data=line_data)
        m = BarMarker(time=1704067200, position="aboveBar", color="#2196F3", shape="circle")
        result = series.add_marker(m)
        assert result is series
        assert len(series.markers) == 1

    def test_add_price_line_chaining(self, line_data):
        series = LineSeries(data=line_data)
        pl = PriceLineOptions(price=100.0, color="#2196F3")
        result = series.add_price_line(pl)
        assert result is series
        assert pl in series.price_lines

    def test_clear_markers_chaining(self, line_data):
        series = LineSeries(data=line_data)
        m = BarMarker(time=1704067200, position="aboveBar", color="#2196F3", shape="circle")
        series.add_marker(m)
        result = series.clear_markers()
        assert result is series
        assert not series.markers

    def test_clear_price_lines_chaining(self, line_data):
        series = LineSeries(data=line_data)
        pl = PriceLineOptions(price=100.0, color="#2196F3")
        series.add_price_line(pl)
        result = series.clear_price_lines()
        assert result is series
        assert not series.price_lines


class TestLineSeriesExtended:
    """Extended test cases for LineSeries."""

    def test_chart_type_property(self):
        """Test the chart_type property."""
        data = [LineData(time=1640995200, value=100)]
        LineOptions()
        series = LineSeries(data=data)
        assert series.chart_type == ChartType.LINE

    def test_to_dict_method_complete(self):
        """Test the complete to_dict method."""
        line_options = LineOptions(color="#ff0000")
        data = [LineData(time=1640995200, value=100)]

        series = LineSeries(data=data)
        series.line_options = line_options

        # Add price lines and markers
        price_line = PriceLineOptions(price=100, color="#00ff00")
        marker = Marker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#0000ff",
            shape=MarkerShape.CIRCLE,
        )

        series.add_price_line(price_line)
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#0000ff",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)

        result = series.asdict()

        assert result["type"] == "line"
        assert len(result["data"]) == 1
        assert result["data"][0]["time"] == 1640995200
        assert result["data"][0]["value"] == 100
        assert result["options"]["lineOptions"]["color"] == "#ff0000"
        assert len(result["priceLines"]) == 1
        assert len(result["markers"]) == 1

    def test_to_dict_method_empty_data(self):
        """Test to_dict method with empty data."""
        LineOptions()
        series = LineSeries(data=[])

        result = series.asdict()

        assert result["type"] == "line"
        assert result["data"] == []
        assert "options" in result
        # priceLines should only be present when price lines are added

    def test_from_dataframe_with_custom_column_mapping(self):
        """Test from_dataframe with custom column mapping."""
        test_data = pd.DataFrame(
            {
                "timestamp": [1640995200, 1641081600],
                "price": [100, 110],
                "line_color": ["#ff0000", "#00ff00"],
            },
        )

        series = LineSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "timestamp", "value": "price", "color": "line_color"},
        )

        assert len(series.data) == 2
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100
        assert series.data[0].color == "#ff0000"
        assert series.data[1].time == 1641081600
        assert series.data[1].value == 110
        assert series.data[1].color == "#00ff00"

    def test_from_dataframe_with_index_time(self):
        """Test from_dataframe with time in index."""
        test_data = pd.DataFrame(
            {"value": [100, 110]},
            index=pd.to_datetime(["2022-01-01", "2022-01-02"]),
        )

        series = LineSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "index", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_from_dataframe_with_multi_index(self):
        """Test from_dataframe with multi-index."""
        test_data = pd.DataFrame({"value": [100, 110]})
        test_data.index = pd.MultiIndex.from_tuples(
            [("2022-01-01", "A"), ("2022-01-02", "B")],
            names=["date", "symbol"],
        )

        series = LineSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "date", "value": "value"},
        )

        assert len(series.data) == 2
        assert all(isinstance(d, LineData) for d in series.data)

    def test_error_handling_missingline_options(self):
        """Test error handling when line_options is missing."""
        data = [LineData(time=1640995200, value=100)]

        # LineSeries now has default line_options, so this should not raise
        series = LineSeries(data=data)
        assert series.line_options is not None

    def test_error_handling_invalid_line_options(self):
        """Test error handling with invalid line_options."""
        data = [LineData(time=1640995200, value=100)]
        series = LineSeries(data=data)

        # This should raise InstanceTypeError when setting invalid line_options
        with pytest.raises(
            InstanceTypeError,
            match="line_options must be an instance of LineOptions or None",
        ):
            series.line_options = "invalid"

    def testline_options_property(self):
        """Test the line_options property."""
        line_options = LineOptions(color="#ff0000")
        data = [LineData(time=1640995200, value=100)]

        series = LineSeries(data=data)
        series.line_options = line_options

        assert series.line_options is line_options

    def test_complex_method_chaining(self):
        """Test complex method chaining with LineSeries."""
        LineOptions(color="#ff0000")
        data = [LineData(time=1640995200, value=100)]

        series = LineSeries(data=data)

        # Test complex chaining
        result = (
            series.set_visible(False)
            .add_price_line(PriceLineOptions(price=100, color="#00ff00"))
            .add_marker(
                BarMarker(
                    time=1640995200,
                    position=MarkerPosition.ABOVE_BAR,
                    color="#0000ff",
                    shape=MarkerShape.CIRCLE,
                    text="Test",
                    size=10,
                ),
            )
            .clear_price_lines()
            .clear_markers()
        )

        assert result is series
        assert series._visible is False
        assert len(series.price_lines) == 0
        assert len(series.markers) == 0

    def test_data_class_property(self):
        """Test the data_class property."""
        assert LineSeries.data_class == LineData

    def test_required_columns_property(self):
        """Test the required_columns property."""
        required = LineSeries.data_class.required_columns
        assert isinstance(required, set)
        assert "time" in required
        assert "value" in required

    def test_optional_columns_property(self):
        """Test the optional_columns property."""
        optional = LineSeries.data_class.optional_columns
        assert isinstance(optional, set)
        assert "color" in optional

    def test_serialization_consistency(self):
        """Test that serialization is consistent across multiple calls."""
        LineOptions(color="#ff0000")
        data = [LineData(time=1640995200, value=100)]

        series = LineSeries(data=data)

        # Add some elements
        series.add_price_line(PriceLineOptions(price=100, color="#00ff00"))
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#0000ff",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)

        # Get serialized form multiple times
        result1 = series.asdict()
        result2 = series.asdict()

        # Should be identical
        assert result1 == result2

        # Should have expected structure
        assert result1["type"] == "line"
        assert len(result1["data"]) == 1
        assert len(result1["priceLines"]) == 1
        assert len(result1["markers"]) == 1

    def test_edge_case_empty_dataframe(self):
        """Test handling of empty DataFrame."""
        test_data = pd.DataFrame(columns=["time", "value"])

        series = LineSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "time", "value": "value"},
        )

        assert len(series.data) == 0

    def test_edge_case_single_row_dataframe(self):
        """Test handling of single row DataFrame."""
        test_data = pd.DataFrame({"time": [1640995200], "value": [100]})

        series = LineSeries.from_dataframe(
            df=test_data,
            column_mapping={"time": "time", "value": "value"},
        )

        assert len(series.data) == 1
        assert series.data[0].time == 1640995200
        assert series.data[0].value == 100


class TestLineSeriesJsonFormat:
    """Test cases for LineSeries JSON format and frontend compatibility."""

    def test_line_series_basic_json_structure(self):
        """Test basic JSON structure matches frontend SeriesConfig interface."""
        # Create test data
        data = [
            LineData(time=1704067200, value=100.0),
            LineData(time=1704153600, value=105.0),
            LineData(time=1704240000, value=102.0),
        ]

        line_options = LineOptions(color="#2196f3", line_width=2)
        series = LineSeries(data=data)
        series.line_options = line_options

        result = series.asdict()

        # Check required fields from SeriesConfig interface
        assert "type" in result
        assert result["type"] == "line"
        assert "data" in result
        assert isinstance(result["data"], list)
        assert len(result["data"]) == 3

        # Check data structure
        assert result["data"][0]["time"] == 1704067200
        assert result["data"][0]["value"] == 100.0
        assert result["data"][1]["time"] == 1704153600
        assert result["data"][1]["value"] == 105.0
        assert result["data"][2]["time"] == 1704240000
        assert result["data"][2]["value"] == 102.0

        # Check options structure
        assert "options" in result
        options = result["options"]
        assert options["lineOptions"]["color"] == "#2196f3"
        assert options["lineOptions"]["lineWidth"] == 2

        # Check other required fields
        assert "paneId" in result
        assert result["paneId"] == 0

    def test_line_series_options_json_structure(self):
        """Test line series options match frontend expectations."""
        data = [LineData(time=1704067200, value=100.0)]

        # Create comprehensive line options
        line_options = LineOptions(
            color="#ff0000",
            line_style=LineStyle.DASHED,
            line_width=3,
            line_type=LineType.CURVED,
            line_visible=True,
            point_markers_visible=True,
            point_markers_radius=5,
            crosshair_marker_visible=True,
            crosshair_marker_radius=4,
            crosshair_marker_border_color="#000000",
            crosshair_marker_background_color="#ffffff",
            crosshair_marker_border_width=2,
            last_price_animation=LastPriceAnimationMode.CONTINUOUS,
        )

        series = LineSeries(data=data)
        series.line_options = line_options
        result = series.asdict()

        # Check options structure
        options = result["options"]
        line_opts = options["lineOptions"]
        assert line_opts["color"] == "#ff0000"
        assert line_opts["lineStyle"] == 2  # LineStyle.DASHED.value
        assert line_opts["lineWidth"] == 3
        assert line_opts["lineType"] == 2  # LineType.CURVED.value
        assert line_opts["lineVisible"] is True
        assert line_opts["pointMarkersVisible"] is True
        assert line_opts["pointMarkersRadius"] == 5
        assert line_opts["crosshairMarkerVisible"] is True
        assert line_opts["crosshairMarkerRadius"] == 4
        assert line_opts["crosshairMarkerBorderColor"] == "#000000"
        assert line_opts["crosshairMarkerBackgroundColor"] == "#ffffff"
        assert line_opts["crosshairMarkerBorderWidth"] == 2
        assert line_opts["lastPriceAnimation"] == 1  # LastPriceAnimationMode.CONTINUOUS.value

    def test_line_series_with_price_lines_json_structure(self):
        """Test line series with price lines JSON structure."""
        data = [LineData(time=1704067200, value=100.0)]
        line_options = LineOptions(color="#2196f3")
        series = LineSeries(data=data)
        series.line_options = line_options

        # Add price lines
        resistance = PriceLineOptions(
            price=108.0,
            color="#F44336",
            line_width=2,
            line_style=LineStyle.DASHED,
            title="Resistance",
        )
        support = PriceLineOptions(
            price=95.0,
            color="#4CAF50",
            line_width=2,
            line_style=LineStyle.DASHED,
            title="Support",
        )
        series.add_price_line(resistance).add_price_line(support)

        result = series.asdict()

        # Check price lines structure
        assert "priceLines" in result
        assert len(result["priceLines"]) == 2

        # Check first price line
        price_line1 = result["priceLines"][0]
        assert price_line1["price"] == 108.0
        assert price_line1["color"] == "#F44336"
        assert price_line1["lineWidth"] == 2
        assert price_line1["lineStyle"] == 2  # LineStyle.DASHED.value
        assert price_line1["title"] == "Resistance"

        # Check second price line
        price_line2 = result["priceLines"][1]
        assert price_line2["price"] == 95.0
        assert price_line2["color"] == "#4CAF50"
        assert price_line2["lineWidth"] == 2
        assert price_line2["lineStyle"] == 2  # LineStyle.DASHED.value
        assert price_line2["title"] == "Support"

    def test_line_series_with_markers_json_structure(self):
        """Test line series with markers JSON structure."""
        data = [LineData(time=1704067200, value=100.0)]
        LineOptions(color="#2196f3")
        series = LineSeries(data=data)

        # Add markers
        marker1 = BarMarker(
            time=1704067200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
            text="Peak",
            size=10,
        )
        series.add_marker(marker1)

        marker2 = BarMarker(
            time=1704153600,
            position=MarkerPosition.BELOW_BAR,
            color="#00ff00",
            shape=MarkerShape.SQUARE,
            text="Valley",
            size=8,
        )
        series.add_marker(marker2)

        result = series.asdict()

        # Check markers structure
        assert "markers" in result
        assert len(result["markers"]) == 2

        # Check first marker
        marker1 = result["markers"][0]
        assert marker1["time"] == 1704067200
        assert marker1["position"] == "aboveBar"
        assert marker1["color"] == "#ff0000"
        assert marker1["shape"] == "circle"
        assert marker1["text"] == "Peak"
        assert marker1["size"] == 10

        # Check second marker
        marker2 = result["markers"][1]
        assert marker2["time"] == 1704153600
        assert marker2["position"] == "belowBar"
        assert marker2["color"] == "#00ff00"
        assert marker2["shape"] == "square"
        assert marker2["text"] == "Valley"
        assert marker2["size"] == 8

    def test_line_series_json_serialization(self):
        """Test that JSON serialization works correctly."""
        data = [LineData(time=1704067200, value=100.0)]
        LineOptions(color="#2196f3")
        series = LineSeries(data=data)

        result = series.asdict()

        # Test JSON serialization
        json_str = json.dumps(result)
        assert isinstance(json_str, str)

        # Test JSON parsing
        parsed = json.loads(json_str)
        assert parsed["type"] == "line"
        assert len(parsed["data"]) == 1
        assert parsed["data"][0]["time"] == 1704067200
        assert parsed["data"][0]["value"] == 100.0

    def test_line_series_frontend_compatibility(self):
        """Test that the JSON structure is compatible with frontend SeriesConfig interface."""
        data = [LineData(time=1704067200, value=100.0)]
        LineOptions(color="#2196f3")
        series = LineSeries(data=data)

        result = series.asdict()

        # Frontend expects these fields in SeriesConfig
        assert "type" in result
        assert "data" in result
        assert "options" in result
        assert "paneId" in result

        # Type should be lowercase to match frontend expectations
        assert result["type"] == "line"

        # Data should be an array
        assert isinstance(result["data"], list)

        # Options should be an object
        assert isinstance(result["options"], dict)

        # pane_id should be a number
        assert isinstance(result["paneId"], int)

    def test_line_series_empty_data_handling(self):
        """Test that empty data is handled correctly."""
        LineOptions(color="#2196f3")
        series = LineSeries(data=[])

        result = series.asdict()

        assert result["type"] == "line"
        assert result["data"] == []
        assert isinstance(result["options"], dict)
        # priceLines should only be present when price lines are added

    def test_line_series_nan_handling(self):
        """Test that NaN values are handled correctly in JSON output."""
        data = [
            LineData(time=1704067200, value=100.0),
            LineData(time=1704153600, value=float("nan")),  # This should become 0.0
            LineData(time=1704240000, value=102.0),
        ]

        LineOptions()
        series = LineSeries(data=data)

        result = series.asdict()

        # NaN should be converted to 0.0 in SingleValueData.__post_init__
        assert result["data"][0]["value"] == 100.0
        assert result["data"][1]["value"] == 0.0  # NaN converted to 0.0
        assert result["data"][2]["value"] == 102.0

    def test_line_series_actual_json_output(self):
        """Test the actual JSON output format to verify frontend compatibility."""
        # Create test data with various scenarios
        data = [
            LineData(time=1704067200, value=100.0),  # No color
            LineData(time=1704153600, value=105.0, color="#ff0000"),  # With color
            LineData(time=1704240000, value=102.0),  # No color
        ]

        # Create line options with all properties
        line_options = LineOptions(
            color="#2196f3",
            line_style=LineStyle.DASHED,
            line_width=2,
            line_type=LineType.CURVED,
            line_visible=True,
            point_markers_visible=True,
            point_markers_radius=5,
            crosshair_marker_visible=True,
            crosshair_marker_radius=4,
            crosshair_marker_border_color="#000000",
            crosshair_marker_background_color="#ffffff",
            crosshair_marker_border_width=2,
            last_price_animation=LastPriceAnimationMode.CONTINUOUS,
        )

        # Create series
        series = LineSeries(data=data)
        series.line_options = line_options

        # Add a price line
        price_line = PriceLineOptions(
            price=110.0,
            color="#4CAF50",
            line_width=2,
            line_style=LineStyle.SOLID,
            line_visible=True,
            axis_label_visible=True,
            title="Resistance Level",
        )
        series.add_price_line(price_line)

        # Get JSON representation
        result = series.asdict()

        # Print the actual JSON for inspection
        json_str = json.dumps(result, indent=2)
        print(f"\nActual JSON output:\n{json_str}")

        # Verify the structure matches frontend expectations
        expected_structure = {
            "type": "line",
            "data": [
                {"time": 1704067200, "value": 100.0},  # No color field
                {"time": 1704153600, "value": 105.0, "color": "#ff0000"},  # With color
                {"time": 1704240000, "value": 102.0},  # No color field
            ],
            "options": {
                "color": "#2196f3",
                "lineStyle": 2,  # LineStyle.DASHED.value
                "lineWidth": 2,
                "lineType": 1,  # LineType.CURVED.value
                "lineVisible": True,
                "pointMarkersVisible": True,
                "pointMarkersRadius": 5,
                "crosshairMarkerVisible": True,
                "crosshairMarkerRadius": 4,
                "crosshairMarkerBorderColor": "#000000",
                "crosshairMarkerBackgroundColor": "#ffffff",
                "crosshairMarkerBorderWidth": 2,
                "lastPriceAnimation": 1,  # LastPriceAnimationMode.CONTINUOUS.value
            },
            "priceLines": [
                {
                    "id": None,
                    "price": 110.0,
                    "color": "#4CAF50",
                    "lineWidth": 2,
                    "lineStyle": 1,  # LineStyle.SOLID.value
                    "lineVisible": True,
                    "axisLabelVisible": True,
                    "title": "Resistance Level",
                },
            ],
            "pane_id": 0,
        }

        # Verify key structure matches
        assert result["type"] == expected_structure["type"]
        assert result["data"] == expected_structure["data"]
        assert result["options"]["lineOptions"]["color"] == expected_structure["options"]["color"]
        assert (
            result["options"]["lineOptions"]["lineStyle"]
            == expected_structure["options"]["lineStyle"]
        )
        assert result["priceLines"][0]["price"] == expected_structure["priceLines"][0]["price"]
        assert result["paneId"] == expected_structure["pane_id"]
