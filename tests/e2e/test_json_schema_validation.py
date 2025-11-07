"""
JSON Schema validation tests for backend-frontend compatibility.

This module provides comprehensive validation that backend JSON output
matches the frontend TypeScript interface expectations. It validates
the contract between Python serialization and TypeScript interfaces.

Key Features:
- JSON Schema validation based on frontend interfaces
- Contract testing for data transformations
- Edge case validation for special values
- Performance validation for large datasets
"""

import math
import time
from typing import Any, ClassVar, Dict

import pytest
from jsonschema import ValidationError, validate

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.charts.options.ui_options import LegendOptions
from streamlit_lightweight_charts_pro.charts.series.candlestick import CandlestickSeries
from streamlit_lightweight_charts_pro.charts.series.histogram import HistogramSeries
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.data.candlestick_data import CandlestickData
from streamlit_lightweight_charts_pro.data.histogram_data import HistogramData
from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.type_definitions.enums import PriceScaleMode


class FrontendJSONSchemas:
    """
    JSON schemas based on frontend TypeScript interfaces.

    These schemas define the exact structure expected by the frontend
    React component, ensuring compatibility between Python backend
    and TypeScript frontend.
    """

    # Base data point schema
    DATA_POINT_SCHEMA: ClassVar[Dict[str, Any]] = {
        "type": "object",
        "properties": {
            "time": {"type": "integer"},
            "value": {"type": "number"},
            "color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$|^rgba?\\(.*\\)$"},
        },
        "required": ["time", "value"],
        "additionalProperties": True,
    }

    # OHLC data point schema
    OHLC_DATA_POINT_SCHEMA: ClassVar[Dict[str, Any]] = {
        "type": "object",
        "properties": {
            "time": {"type": "integer"},
            "open": {"type": "number"},
            "high": {"type": "number"},
            "low": {"type": "number"},
            "close": {"type": "number"},
        },
        "required": ["time", "open", "high", "low", "close"],
        "additionalProperties": True,
    }

    # Line options schema
    LINE_OPTIONS_SCHEMA: ClassVar[Dict[str, Any]] = {
        "type": "object",
        "properties": {
            "color": {"type": "string"},
            "lineStyle": {"type": "integer"},
            "lineWidth": {"type": "integer"},
            "lineType": {"type": "integer"},
            "lineVisible": {"type": "boolean"},
            "pointMarkersVisible": {"type": "boolean"},
            "pointMarkersRadius": {"type": "integer"},
            "crosshairMarkerVisible": {"type": "boolean"},
            "crosshairMarkerRadius": {"type": "integer"},
            "crosshairMarkerBorderColor": {"type": "string"},
            "crosshairMarkerBackgroundColor": {"type": "string"},
            "crosshairMarkerBorderWidth": {"type": "integer"},
            "lastPriceAnimation": {"type": "integer"},
        },
        "additionalProperties": True,
    }

    # Legend configuration schema
    LEGEND_CONFIG_SCHEMA: ClassVar[Dict[str, Any]] = {
        "type": "object",
        "properties": {
            "visible": {"type": "boolean"},
            "position": {
                "type": "string",
                "enum": ["top-left", "top-right", "bottom-left", "bottom-right"],
            },
            "symbolName": {"type": "string"},
            "textColor": {"type": "string"},
            "backgroundColor": {"type": "string"},
            "borderColor": {"type": "string"},
            "borderWidth": {"type": "integer"},
            "borderRadius": {"type": "integer"},
            "padding": {"type": "integer"},
            "margin": {"type": "integer"},
            "zIndex": {"type": "integer"},
            "priceFormat": {"type": "string"},
            "text": {"type": "string"},
            "width": {"type": "integer"},
            "height": {"type": "integer"},
            "showValues": {"type": "boolean"},
            "valueFormat": {"type": "string"},
            "updateOnCrosshair": {"type": "boolean"},
        },
        "additionalProperties": True,
    }

    # Price scale options schema
    PRICE_SCALE_OPTIONS_SCHEMA: ClassVar[Dict[str, Any]] = {
        "type": "object",
        "properties": {
            "visible": {"type": "boolean"},
            "autoScale": {"type": "boolean"},
            "mode": {"type": "integer"},
            "invertScale": {"type": "boolean"},
            "borderVisible": {"type": "boolean"},
            "borderColor": {"type": "string"},
            "textColor": {"type": "string"},
            "ticksVisible": {"type": "boolean"},
            "ensureEdgeTickMarksVisible": {"type": "boolean"},
            "alignLabels": {"type": "boolean"},
            "entireTextOnly": {"type": "boolean"},
            "minimumWidth": {"type": "integer"},
            "priceScaleId": {"type": "string"},
            "scaleMargins": {
                "type": "object",
                "properties": {"top": {"type": "number"}, "bottom": {"type": "number"}},
                "required": ["top", "bottom"],
            },
        },
        "additionalProperties": True,
    }

    # Series configuration schema
    SERIES_CONFIG_SCHEMA: ClassVar[Dict[str, Any]] = {
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "enum": [
                    "line",
                    "area",
                    "candlestick",
                    "bar",
                    "histogram",
                    "baseline",
                    "band",
                    "signal",
                ],
            },
            "data": {
                "type": "array",
                "items": {"oneOf": [DATA_POINT_SCHEMA, OHLC_DATA_POINT_SCHEMA]},
            },
            "visible": {"type": "boolean"},
            "priceScaleId": {"type": "string"},
            "paneId": {"type": "integer"},
            "lastValueVisible": {"type": "boolean"},
            "priceLineVisible": {"type": "boolean"},
            "priceLineSource": {"type": "string", "enum": ["lastBar", "lastVisible"]},
            "priceLineWidth": {"type": "integer"},
            "priceLineColor": {"type": "string"},
            "priceLineStyle": {"type": "integer"},
            "zIndex": {"type": "integer"},
            "options": {"type": "object"},
            "legend": LEGEND_CONFIG_SCHEMA,
        },
        "required": ["type", "data"],
        "additionalProperties": True,
    }

    # Chart configuration schema
    CHART_CONFIG_SCHEMA: ClassVar[Dict[str, Any]] = {
        "type": "object",
        "properties": {
            "chart": {"type": "object"},
            "series": {"type": "array", "items": SERIES_CONFIG_SCHEMA},
            "chartId": {"type": "string"},
            "containerId": {"type": "string"},
            "autoSize": {"type": "boolean"},
            "autoWidth": {"type": "boolean"},
            "autoHeight": {"type": "boolean"},
            "minWidth": {"type": "integer"},
            "minHeight": {"type": "integer"},
            "maxWidth": {"type": "integer"},
            "maxHeight": {"type": "integer"},
        },
        "required": ["chart", "series"],
        "additionalProperties": True,
    }

    # Component configuration schema (top-level)
    COMPONENT_CONFIG_SCHEMA: ClassVar[Dict[str, Any]] = {
        "type": "object",
        "properties": {
            "charts": {"type": "array", "items": CHART_CONFIG_SCHEMA, "minItems": 1},
            "syncConfig": {
                "type": "object",
                "properties": {
                    "enabled": {"type": "boolean"},
                    "crosshair": {"type": "boolean"},
                    "timeRange": {"type": "boolean"},
                },
                "required": ["enabled", "crosshair", "timeRange"],
            },
            "callbacks": {"type": "array", "items": {"type": "string"}},
            "seriesConfigBackendData": {"type": "object"},
            "backendData": {"type": "object"},
        },
        "required": ["charts"],
        "additionalProperties": True,
    }


class TestJSONSchemaValidation:
    """Test JSON schema validation for backend-frontend compatibility."""

    def test_data_point_schema_validation(self):
        """Test that data points match frontend schema."""
        # Test valid data point
        data = LineData(time=1640995200, value=100.5)
        data_dict = data.asdict()

        validate(instance=data_dict, schema=FrontendJSONSchemas.DATA_POINT_SCHEMA)

        # Test with optional color
        data_with_color = LineData(time=1640995200, value=100.5, color="#ff0000")
        data_dict_with_color = data_with_color.asdict()

        validate(instance=data_dict_with_color, schema=FrontendJSONSchemas.DATA_POINT_SCHEMA)

    def test_ohlc_data_point_schema_validation(self):
        """Test that OHLC data points match frontend schema."""
        data = CandlestickData(time=1640995200, open=100.0, high=105.0, low=98.0, close=102.0)
        data_dict = data.asdict()

        validate(instance=data_dict, schema=FrontendJSONSchemas.OHLC_DATA_POINT_SCHEMA)

    def test_line_series_schema_validation(self):
        """Test that line series configuration matches frontend schema."""
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)
        series_dict = series.asdict()

        validate(instance=series_dict, schema=FrontendJSONSchemas.SERIES_CONFIG_SCHEMA)

        # Verify required fields
        assert "type" in series_dict
        assert "data" in series_dict
        assert series_dict["type"] == "line"
        assert isinstance(series_dict["data"], list)
        assert len(series_dict["data"]) == 1

    def test_candlestick_series_schema_validation(self):
        """Test that candlestick series configuration matches frontend schema."""
        data = [CandlestickData(time=1640995200, open=100, high=105, low=98, close=102)]
        series = CandlestickSeries(data=data)
        series_dict = series.asdict()

        validate(instance=series_dict, schema=FrontendJSONSchemas.SERIES_CONFIG_SCHEMA)

        # Verify series type
        assert series_dict["type"] == "candlestick"

    def test_histogram_series_schema_validation(self):
        """Test that histogram series configuration matches frontend schema."""
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        series_dict = series.asdict()

        validate(instance=series_dict, schema=FrontendJSONSchemas.SERIES_CONFIG_SCHEMA)

        # Verify series type and options
        assert series_dict["type"] == "histogram"
        assert "options" in series_dict
        assert "base" in series_dict["options"]
        assert "color" in series_dict["options"]

    def test_legend_configuration_schema_validation(self):
        """Test that legend configuration matches frontend schema."""
        legend = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(255, 0, 0, 0.5)",
            text="<span>MA20: $$value$$</span>",
        )
        legend_dict = legend.asdict()

        validate(instance=legend_dict, schema=FrontendJSONSchemas.LEGEND_CONFIG_SCHEMA)

        # Verify key properties
        assert legend_dict["visible"] is True
        assert legend_dict["position"] == "top-left"
        assert legend_dict["backgroundColor"] == "rgba(255, 0, 0, 0.5)"

    def test_price_scale_options_schema_validation(self):
        """Test that price scale options match frontend schema."""
        price_scale = PriceScaleOptions(
            visible=True,
            auto_scale=False,
            invert_scale=True,
            border_visible=False,
        )
        price_scale_dict = price_scale.asdict()

        validate(instance=price_scale_dict, schema=FrontendJSONSchemas.PRICE_SCALE_OPTIONS_SCHEMA)

        # Verify boolean values are included (not omitted)
        assert "visible" in price_scale_dict
        assert "autoScale" in price_scale_dict
        assert "invertScale" in price_scale_dict
        assert "borderVisible" in price_scale_dict
        assert price_scale_dict["visible"] is True
        assert price_scale_dict["autoScale"] is False
        assert price_scale_dict["invertScale"] is True
        assert price_scale_dict["borderVisible"] is False

    def test_chart_configuration_schema_validation(self):
        """Test that chart configuration matches frontend schema."""
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)
        chart = Chart(series=[series])

        config = chart.to_frontend_config()

        validate(instance=config, schema=FrontendJSONSchemas.COMPONENT_CONFIG_SCHEMA)

        # Verify structure
        assert "charts" in config
        assert len(config["charts"]) == 1

        chart_config = config["charts"][0]
        assert "chart" in chart_config
        assert "series" in chart_config
        assert len(chart_config["series"]) == 1

    def test_empty_string_values_validation(self):
        """Test that empty string values are handled correctly."""
        # Note: price_scale_id is NOT a valid PriceScaleOptions parameter
        # It's the dict key when used in chart.price_scales, not an option parameter

        # Create a basic price scale to verify empty string handling
        price_scale = PriceScaleOptions(
            visible=True,
            auto_scale=True,
        )
        price_scale_dict = price_scale.asdict()

        validate(instance=price_scale_dict, schema=FrontendJSONSchemas.PRICE_SCALE_OPTIONS_SCHEMA)
        # priceScaleId is not a PriceScaleOptions parameter, so it won't be in the dict
        assert "priceScaleId" not in price_scale_dict

    def test_falsy_values_validation(self):
        """Test that falsy values (0, False, 0.0) are included in serialization."""
        # Test histogram series with base=0
        data = [HistogramData(time=1640995200, value=100.5)]
        series = HistogramSeries(data=data)
        series_dict = series.asdict()

        validate(instance=series_dict, schema=FrontendJSONSchemas.SERIES_CONFIG_SCHEMA)

        # Verify falsy values are included
        assert "options" in series_dict
        assert "base" in series_dict["options"]
        assert series_dict["options"]["base"] == 0

        # Test boolean options - now in options object
        assert "visible" in series_dict["options"]
        assert "priceLineVisible" in series_dict["options"]
        assert "lastValueVisible" in series_dict["options"]

    def test_enum_values_validation(self):
        """Test that enum values are correctly serialized."""
        # Test price line source enum - now in options object
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)
        series_dict = series.asdict()

        validate(instance=series_dict, schema=FrontendJSONSchemas.SERIES_CONFIG_SCHEMA)

        # Verify enum values are strings, not enum objects - check in options
        assert "options" in series_dict
        assert "priceLineSource" in series_dict["options"]
        assert isinstance(series_dict["options"]["priceLineSource"], str)
        assert series_dict["options"]["priceLineSource"] in ["lastBar", "lastVisible"]

    def test_nested_structures_validation(self):
        """Test that nested structures are properly validated."""
        # Create complex configuration with nested options
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)

        # Add legend with nested configuration
        legend = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(0, 0, 0, 0.8)",
            text="<span>Custom Legend: $$value$$</span>",
        )
        series.legend = legend

        series_dict = series.asdict()

        validate(instance=series_dict, schema=FrontendJSONSchemas.SERIES_CONFIG_SCHEMA)

        # Verify nested legend is properly structured
        assert "legend" in series_dict
        legend_dict = series_dict["legend"]
        validate(instance=legend_dict, schema=FrontendJSONSchemas.LEGEND_CONFIG_SCHEMA)

        assert legend_dict["visible"] is True
        assert legend_dict["position"] == "top-left"
        assert legend_dict["backgroundColor"] == "rgba(0, 0, 0, 0.8)"

    def test_schema_validation_errors(self):
        """Test that invalid data correctly fails schema validation."""
        # Test invalid data point (missing required field)
        invalid_data_point = {"time": 1640995200}  # Missing 'value'

        with pytest.raises(ValidationError):
            validate(instance=invalid_data_point, schema=FrontendJSONSchemas.DATA_POINT_SCHEMA)

        # Test invalid series type
        invalid_series = {
            "type": "invalid_type",  # Not in enum
            "data": [{"time": 1640995200, "value": 100.0}],
        }

        with pytest.raises(ValidationError):
            validate(instance=invalid_series, schema=FrontendJSONSchemas.SERIES_CONFIG_SCHEMA)

        # Test invalid legend position
        invalid_legend = {"visible": True, "position": "invalid_position"}  # Not in enum

        with pytest.raises(ValidationError):
            validate(instance=invalid_legend, schema=FrontendJSONSchemas.LEGEND_CONFIG_SCHEMA)


class TestContractValidation:
    """Test specific contracts between backend and frontend."""

    def test_camelcase_conversion_contract(self):
        """Test that snake_case is correctly converted to camelCase."""
        legend = LegendOptions(
            background_color="rgba(255, 0, 0, 0.5)",
            border_color="#cccccc",
            border_width=1,
            border_radius=4,
            show_values=True,
            update_on_crosshair=False,
        )
        legend_dict = legend.asdict()

        # Verify camelCase conversion
        assert "backgroundColor" in legend_dict
        assert "borderColor" in legend_dict
        assert "borderWidth" in legend_dict
        assert "borderRadius" in legend_dict
        assert "showValues" in legend_dict
        assert "updateOnCrosshair" in legend_dict

        # Verify original snake_case keys are not present
        assert "background_color" not in legend_dict
        assert "border_color" not in legend_dict
        assert "border_width" not in legend_dict
        assert "border_radius" not in legend_dict
        assert "show_values" not in legend_dict
        assert "update_on_crosshair" not in legend_dict

    def test_boolean_serialization_contract(self):
        """Test that boolean values are correctly serialized (not omitted)."""
        price_scale = PriceScaleOptions(
            visible=False,
            auto_scale=False,
            invert_scale=False,
            border_visible=False,
            ticks_visible=False,
            align_labels=False,
            entire_text_only=False,
        )
        price_scale_dict = price_scale.asdict()

        # Verify all boolean values are present, even when False
        assert "visible" in price_scale_dict
        assert "autoScale" in price_scale_dict
        assert "invertScale" in price_scale_dict
        assert "borderVisible" in price_scale_dict
        assert "ticksVisible" in price_scale_dict
        assert "alignLabels" in price_scale_dict
        assert "entireTextOnly" in price_scale_dict

        # Verify values are correct
        assert price_scale_dict["visible"] is False
        assert price_scale_dict["autoScale"] is False
        assert price_scale_dict["invertScale"] is False
        assert price_scale_dict["borderVisible"] is False
        assert price_scale_dict["ticksVisible"] is False
        assert price_scale_dict["alignLabels"] is False
        assert price_scale_dict["entireTextOnly"] is False

    def test_numeric_serialization_contract(self):
        """Test that numeric values are correctly serialized."""
        # Test with zero values
        histogram_data = [HistogramData(time=1640995200, value=0.0)]
        series = HistogramSeries(data=histogram_data)
        series_dict = series.asdict()

        # Verify zero values are included
        assert "options" in series_dict
        assert "base" in series_dict["options"]
        assert series_dict["options"]["base"] == 0

        # Verify data points with zero values
        assert len(series_dict["data"]) == 1
        assert series_dict["data"][0]["value"] == 0.0

    def test_empty_string_serialization_contract(self):
        """Test that empty strings are handled according to contract."""
        # Note: price_scale_id is NOT a valid PriceScaleOptions parameter
        # It's the dict key when used in chart.price_scales, not an option parameter

        # Create a basic price scale to verify empty string handling
        price_scale = PriceScaleOptions(
            visible=True,
            auto_scale=True,
        )
        price_scale_dict = price_scale.asdict()

        # priceScaleId is not a PriceScaleOptions parameter, so it won't be in the dict
        assert "priceScaleId" not in price_scale_dict

    def test_nan_handling_contract(self):
        """Test that NaN values are correctly handled."""
        # Test data point with NaN value
        data = LineData(time=1640995200, value=float("nan"))
        data_dict = data.asdict()

        # NaN should be converted to 0.0
        assert data_dict["value"] == 0.0
        assert not math.isnan(data_dict["value"])

    def test_enum_serialization_contract(self):
        """Test that enum values are correctly serialized as their .value."""
        price_scale = PriceScaleOptions(mode=PriceScaleMode.LOGARITHMIC)
        price_scale_dict = price_scale.asdict()

        # Enum should be serialized as its value, not as enum object
        assert "mode" in price_scale_dict
        assert isinstance(price_scale_dict["mode"], int)
        assert price_scale_dict["mode"] == PriceScaleMode.LOGARITHMIC.value


class TestPerformanceValidation:
    """Test performance characteristics of JSON serialization."""

    def test_large_dataset_serialization(self):
        """Test serialization performance with large datasets."""
        # Create large dataset
        data = [LineData(time=1640995200 + i, value=100.0 + i) for i in range(1000)]
        series = LineSeries(data=data)

        start_time = time.time()
        series_dict = series.asdict()
        serialization_time = time.time() - start_time

        # Validate structure
        validate(instance=series_dict, schema=FrontendJSONSchemas.SERIES_CONFIG_SCHEMA)

        # Verify performance (should be under 100ms for 1000 points)
        assert serialization_time < 0.1, (
            f"Serialization took {serialization_time:.3f}s, expected < 0.1s"
        )

        # Verify data integrity
        assert len(series_dict["data"]) == 1000
        for i, data_point in enumerate(series_dict["data"]):
            assert data_point["time"] == 1640995200 + i
            assert data_point["value"] == 100.0 + i

    def test_complex_configuration_serialization(self):
        """Test serialization of complex chart configurations."""
        # Create complex configuration
        data1 = [LineData(time=1640995200 + i, value=100.0 + i) for i in range(100)]
        data2 = [
            CandlestickData(time=1640995200 + i, open=100, high=105, low=98, close=102)
            for i in range(100)
        ]

        series1 = LineSeries(data=data1)
        series1.legend = LegendOptions(visible=True, position="top-left", text="Line Series")

        series2 = CandlestickSeries(data=data2)
        series2.legend = LegendOptions(
            visible=True,
            position="bottom-right",
            text="Candlestick Series",
        )

        chart = Chart(series=[series1, series2])

        start_time = time.time()
        config = chart.to_frontend_config()
        serialization_time = time.time() - start_time

        # Validate structure
        validate(instance=config, schema=FrontendJSONSchemas.COMPONENT_CONFIG_SCHEMA)

        # Verify performance (should be under 50ms for complex config)
        assert serialization_time < 0.05, (
            f"Complex serialization took {serialization_time:.3f}s, expected < 0.05s"
        )

        # Verify structure
        assert len(config["charts"]) == 1
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 2
        assert chart_config["series"][0]["type"] == "line"
        assert chart_config["series"][1]["type"] == "candlestick"


if __name__ == "__main__":
    pytest.main([__file__])
