"""
Frontend contract validation tests.

This module provides comprehensive contract testing to ensure that
backend JSON output exactly matches what the frontend expects,
including specific field names, data types, and value transformations.

Key Features:
- Exact field name validation (camelCase conversion)
- Data type validation for all fields
- Value transformation validation (enums, booleans, etc.)
- Edge case validation for special values
- Integration testing with real frontend interfaces
"""

from dataclasses import dataclass
from typing import Any, List

import pytest

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


@dataclass
class FrontendFieldContract:
    """Contract definition for a frontend field."""

    name: str
    type: type
    required: bool = False
    enum_values: List[Any] = None
    default_value: Any = None


class FrontendContracts:
    """Frontend field contracts based on TypeScript interfaces."""

    # Legend configuration contract
    LEGEND_FIELDS = [
        FrontendFieldContract("visible", bool, default_value=True),
        FrontendFieldContract(
            "position", str, enum_values=["top-left", "top-right", "bottom-left", "bottom-right"]
        ),
        FrontendFieldContract("symbolName", str),
        FrontendFieldContract("textColor", str),
        FrontendFieldContract("backgroundColor", str),
        FrontendFieldContract("borderColor", str),
        FrontendFieldContract("borderWidth", int),
        FrontendFieldContract("borderRadius", int),
        FrontendFieldContract("padding", int),
        FrontendFieldContract("margin", int),
        FrontendFieldContract("zIndex", int),
        FrontendFieldContract("priceFormat", str),
        FrontendFieldContract("text", str),
        FrontendFieldContract("width", int),
        FrontendFieldContract("height", int),
        FrontendFieldContract("showValues", bool),
        FrontendFieldContract("valueFormat", str),
        FrontendFieldContract("updateOnCrosshair", bool),
    ]

    # Price scale options contract
    PRICE_SCALE_FIELDS = [
        FrontendFieldContract("visible", bool, default_value=True),
        FrontendFieldContract("autoScale", bool, default_value=True),
        FrontendFieldContract("mode", int, default_value=0),
        FrontendFieldContract("invertScale", bool, default_value=False),
        FrontendFieldContract("borderVisible", bool, default_value=True),
        FrontendFieldContract("borderColor", str),
        FrontendFieldContract("textColor", str),
        FrontendFieldContract("ticksVisible", bool, default_value=True),
        FrontendFieldContract("ensureEdgeTickMarksVisible", bool, default_value=False),
        FrontendFieldContract("alignLabels", bool, default_value=True),
        FrontendFieldContract("entireTextOnly", bool, default_value=False),
        FrontendFieldContract("minimumWidth", int, default_value=72),
        FrontendFieldContract("priceScaleId", str, default_value=""),
        FrontendFieldContract("scaleMargins", dict),
    ]

    # Series configuration contract
    SERIES_FIELDS = [
        FrontendFieldContract(
            "type",
            str,
            required=True,
            enum_values=[
                "line",
                "area",
                "candlestick",
                "bar",
                "histogram",
                "baseline",
                "band",
                "signal",
            ],
        ),
        FrontendFieldContract("data", list, required=True),
        FrontendFieldContract("visible", bool, default_value=True),
        FrontendFieldContract("priceScaleId", str, default_value="right"),
        FrontendFieldContract("paneId", int, default_value=0),
        FrontendFieldContract("lastValueVisible", bool, default_value=True),
        FrontendFieldContract("priceLineVisible", bool, default_value=True),
        FrontendFieldContract("priceLineSource", str, enum_values=["lastBar", "lastVisible"]),
        FrontendFieldContract("priceLineWidth", int, default_value=1),
        FrontendFieldContract("priceLineColor", str, default_value=""),
        FrontendFieldContract("priceLineStyle", int),
        FrontendFieldContract("zIndex", int, default_value=100),
        FrontendFieldContract("options", dict),
        FrontendFieldContract("legend", dict),
    ]

    # Data point contract
    DATA_POINT_FIELDS = [
        FrontendFieldContract("time", int, required=True),
        FrontendFieldContract("value", float, required=True),
        FrontendFieldContract("color", str),
    ]

    # OHLC data point contract
    OHLC_DATA_POINT_FIELDS = [
        FrontendFieldContract("time", int, required=True),
        FrontendFieldContract("open", float, required=True),
        FrontendFieldContract("high", float, required=True),
        FrontendFieldContract("low", float, required=True),
        FrontendFieldContract("close", float, required=True),
        FrontendFieldContract("volume", float),
    ]


class TestFrontendContractValidation:
    """Test that backend output exactly matches frontend contracts."""

    def test_legend_field_contracts(self):
        """Test that legend serialization matches frontend field contracts."""
        legend = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(255, 0, 0, 0.5)",
            border_color="#cccccc",
            border_width=1,
            border_radius=4,
            show_values=True,
            update_on_crosshair=False,
        )
        legend_dict = legend.asdict()

        # Validate each field contract
        for field_contract in FrontendContracts.LEGEND_FIELDS:
            if field_contract.name in legend_dict:
                value = legend_dict[field_contract.name]

                # Type validation
                assert isinstance(
                    value, field_contract.type
                ), f"Field '{field_contract.name}' has type {type(value)}, expected {field_contract.type}"

                # Enum validation
                if field_contract.enum_values:
                    assert (
                        value in field_contract.enum_values
                    ), f"Field '{field_contract.name}' has value '{value}', expected one of {field_contract.enum_values}"

        # Verify camelCase field names
        assert "backgroundColor" in legend_dict
        assert "borderColor" in legend_dict
        assert "borderWidth" in legend_dict
        assert "borderRadius" in legend_dict
        assert "showValues" in legend_dict
        assert "updateOnCrosshair" in legend_dict

        # Verify snake_case names are not present
        assert "background_color" not in legend_dict
        assert "border_color" not in legend_dict
        assert "border_width" not in legend_dict
        assert "border_radius" not in legend_dict
        assert "show_values" not in legend_dict
        assert "update_on_crosshair" not in legend_dict

    def test_price_scale_field_contracts(self):
        """Test that price scale serialization matches frontend field contracts."""
        price_scale = PriceScaleOptions(
            visible=True,
            auto_scale=False,
            invert_scale=True,
            border_visible=False,
            ticks_visible=False,
            align_labels=False,
            entire_text_only=False,
            mode=PriceScaleMode.LOGARITHMIC,
            price_scale_id="custom_scale",
        )
        price_scale_dict = price_scale.asdict()

        # Validate each field contract
        for field_contract in FrontendContracts.PRICE_SCALE_FIELDS:
            if field_contract.name in price_scale_dict:
                value = price_scale_dict[field_contract.name]

                # Type validation
                assert isinstance(
                    value, field_contract.type
                ), f"Field '{field_contract.name}' has type {type(value)}, expected {field_contract.type}"

                # Enum validation
                if field_contract.enum_values:
                    assert (
                        value in field_contract.enum_values
                    ), f"Field '{field_contract.name}' has value '{value}', expected one of {field_contract.enum_values}"

        # Verify specific contract requirements
        assert price_scale_dict["visible"] is True
        assert price_scale_dict["autoScale"] is False
        assert price_scale_dict["invertScale"] is True
        assert price_scale_dict["borderVisible"] is False
        assert price_scale_dict["ticksVisible"] is False
        assert price_scale_dict["alignLabels"] is False
        assert price_scale_dict["entireTextOnly"] is False
        assert price_scale_dict["priceScaleId"] == "custom_scale"

        # Verify mode is serialized as integer (enum value)
        assert isinstance(price_scale_dict["mode"], int)
        assert price_scale_dict["mode"] == PriceScaleMode.LOGARITHMIC.value

    def test_series_field_contracts(self):
        """Test that series serialization matches frontend field contracts."""
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)
        series_dict = series.asdict()

        # Validate each field contract
        for field_contract in FrontendContracts.SERIES_FIELDS:
            if field_contract.name in series_dict:
                value = series_dict[field_contract.name]

                # Type validation
                assert isinstance(
                    value, field_contract.type
                ), f"Field '{field_contract.name}' has type {type(value)}, expected {field_contract.type}"

                # Enum validation
                if field_contract.enum_values:
                    assert (
                        value in field_contract.enum_values
                    ), f"Field '{field_contract.name}' has value '{value}', expected one of {field_contract.enum_values}"

        # Verify required fields
        assert "type" in series_dict
        assert "data" in series_dict
        assert series_dict["type"] == "line"
        assert isinstance(series_dict["data"], list)

        # Verify default values
        assert series_dict["visible"] is True
        assert series_dict["priceScaleId"] == "right"
        assert series_dict["paneId"] == 0
        assert series_dict["lastValueVisible"] is True
        assert series_dict["priceLineVisible"] is True
        assert series_dict["zIndex"] == 100

    def test_data_point_field_contracts(self):
        """Test that data point serialization matches frontend field contracts."""
        data = LineData(time=1640995200, value=100.5, color="#ff0000")
        data_dict = data.asdict()

        # Validate each field contract
        for field_contract in FrontendContracts.DATA_POINT_FIELDS:
            if field_contract.name in data_dict:
                value = data_dict[field_contract.name]

                # Type validation
                assert isinstance(
                    value, field_contract.type
                ), f"Field '{field_contract.name}' has type {type(value)}, expected {field_contract.type}"

        # Verify required fields
        assert "time" in data_dict
        assert "value" in data_dict
        assert isinstance(data_dict["time"], int)
        assert isinstance(data_dict["value"], float)
        assert data_dict["time"] == 1640995200
        assert data_dict["value"] == 100.5
        assert data_dict["color"] == "#ff0000"

    def test_ohlc_data_point_field_contracts(self):
        """Test that OHLC data point serialization matches frontend field contracts."""
        data = CandlestickData(time=1640995200, open=100.0, high=105.0, low=98.0, close=102.0)
        data_dict = data.asdict()

        # Validate each field contract
        for field_contract in FrontendContracts.OHLC_DATA_POINT_FIELDS:
            if field_contract.name in data_dict:
                value = data_dict[field_contract.name]

                # Type validation
                assert isinstance(
                    value, field_contract.type
                ), f"Field '{field_contract.name}' has type {type(value)}, expected {field_contract.type}"

        # Verify required fields
        assert "time" in data_dict
        assert "open" in data_dict
        assert "high" in data_dict
        assert "low" in data_dict
        assert "close" in data_dict
        assert isinstance(data_dict["time"], int)
        assert isinstance(data_dict["open"], (int, float))
        assert isinstance(data_dict["high"], (int, float))
        assert isinstance(data_dict["low"], (int, float))
        assert isinstance(data_dict["close"], (int, float))

    def test_camelcase_conversion_contract(self):
        """Test comprehensive camelCase conversion contract."""
        # Test legend options
        legend = LegendOptions(
            background_color="rgba(255, 0, 0, 0.5)",
            border_color="#cccccc",
            border_width=1,
            border_radius=4,
            show_values=True,
            update_on_crosshair=False,
            value_format=".2f",
        )
        legend_dict = legend.asdict()

        # Verify all snake_case fields are converted to camelCase
        camelcase_mappings = {
            "background_color": "backgroundColor",
            "border_color": "borderColor",
            "border_width": "borderWidth",
            "border_radius": "borderRadius",
            "show_values": "showValues",
            "update_on_crosshair": "updateOnCrosshair",
            "value_format": "valueFormat",
        }

        for snake_case, camel_case in camelcase_mappings.items():
            assert camel_case in legend_dict, f"Expected camelCase field '{camel_case}' not found"
            assert (
                snake_case not in legend_dict
            ), f"snake_case field '{snake_case}' should not be present"

        # Test price scale options
        price_scale = PriceScaleOptions(
            auto_scale=False,
            border_visible=False,
            ticks_visible=False,
            align_labels=False,
            entire_text_only=False,
            ensure_edge_tick_marks_visible=False,
            minimum_width=100,
            price_scale_id="test",
        )
        price_scale_dict = price_scale.asdict()

        price_scale_mappings = {
            "auto_scale": "autoScale",
            "border_visible": "borderVisible",
            "ticks_visible": "ticksVisible",
            "align_labels": "alignLabels",
            "entire_text_only": "entireTextOnly",
            "ensure_edge_tick_marks_visible": "ensureEdgeTickMarksVisible",
            "minimum_width": "minimumWidth",
            "price_scale_id": "priceScaleId",
        }

        for snake_case, camel_case in price_scale_mappings.items():
            assert (
                camel_case in price_scale_dict
            ), f"Expected camelCase field '{camel_case}' not found"
            assert (
                snake_case not in price_scale_dict
            ), f"snake_case field '{snake_case}' should not be present"

    def test_boolean_serialization_contract(self):
        """Test that boolean values are correctly serialized according to contract."""
        # Test all boolean fields in price scale options
        price_scale = PriceScaleOptions(
            visible=False,
            auto_scale=False,
            invert_scale=False,
            border_visible=False,
            ticks_visible=False,
            ensure_edge_tick_marks_visible=False,
            align_labels=False,
            entire_text_only=False,
        )
        price_scale_dict = price_scale.asdict()

        # All boolean fields should be present, even when False
        boolean_fields = [
            "visible",
            "autoScale",
            "invertScale",
            "borderVisible",
            "ticksVisible",
            "ensureEdgeTickMarksVisible",
            "alignLabels",
            "entireTextOnly",
        ]

        for field in boolean_fields:
            assert field in price_scale_dict, f"Boolean field '{field}' should be present"
            assert isinstance(price_scale_dict[field], bool), f"Field '{field}' should be boolean"
            assert price_scale_dict[field] is False, f"Field '{field}' should be False"

        # Test legend boolean fields
        legend = LegendOptions(visible=False, show_values=False, update_on_crosshair=False)
        legend_dict = legend.asdict()

        legend_boolean_fields = ["visible", "showValues", "updateOnCrosshair"]
        for field in legend_boolean_fields:
            assert field in legend_dict, f"Boolean field '{field}' should be present"
            assert isinstance(legend_dict[field], bool), f"Field '{field}' should be boolean"
            assert legend_dict[field] is False, f"Field '{field}' should be False"

    def test_numeric_serialization_contract(self):
        """Test that numeric values are correctly serialized according to contract."""
        # Test with zero values
        histogram_data = [HistogramData(time=1640995200, value=0.0)]
        series = HistogramSeries(data=histogram_data)
        series_dict = series.asdict()

        # Zero values should be included
        assert "options" in series_dict
        assert "base" in series_dict["options"]
        assert series_dict["options"]["base"] == 0
        assert isinstance(series_dict["options"]["base"], (int, float))

        # Test data points with zero values
        assert len(series_dict["data"]) == 1
        data_point = series_dict["data"][0]
        assert "value" in data_point
        assert data_point["value"] == 0.0
        assert isinstance(data_point["value"], float)

        # Test with negative values
        negative_data = [LineData(time=1640995200, value=-100.5)]
        negative_series = LineSeries(data=negative_data)
        negative_dict = negative_series.asdict()

        assert negative_dict["data"][0]["value"] == -100.5
        assert isinstance(negative_dict["data"][0]["value"], float)

    def test_enum_serialization_contract(self):
        """Test that enum values are correctly serialized according to contract."""
        # Test price scale mode enum
        price_scale = PriceScaleOptions(mode=PriceScaleMode.LOGARITHMIC)
        price_scale_dict = price_scale.asdict()

        assert "mode" in price_scale_dict
        assert isinstance(price_scale_dict["mode"], int)
        assert price_scale_dict["mode"] == PriceScaleMode.LOGARITHMIC.value

        # Test price line source enum
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)
        series_dict = series.asdict()

        assert "priceLineSource" in series_dict
        assert isinstance(series_dict["priceLineSource"], str)
        assert series_dict["priceLineSource"] in ["lastBar", "lastVisible"]

    def test_empty_string_handling_contract(self):
        """Test that empty strings are handled according to contract."""
        # Test price_scale_id with empty string (should be skipped by asdict)
        price_scale = PriceScaleOptions(price_scale_id="")
        price_scale_dict = price_scale.asdict()

        assert "priceScaleId" not in price_scale_dict  # Empty strings are skipped

        # Test price_scale_id with None (should be skipped by asdict)
        price_scale_none = PriceScaleOptions(price_scale_id=None)
        price_scale_none_dict = price_scale_none.asdict()

        assert "priceScaleId" not in price_scale_none_dict  # None values are skipped

        # Test price_scale_id with actual value (should be included)
        price_scale_valid = PriceScaleOptions(price_scale_id="valid_id")
        price_scale_valid_dict = price_scale_valid.asdict()

        assert "priceScaleId" in price_scale_valid_dict
        assert price_scale_valid_dict["priceScaleId"] == "valid_id"
        assert isinstance(price_scale_valid_dict["priceScaleId"], str)

    def test_nan_handling_contract(self):
        """Test that NaN values are handled according to contract."""
        import math

        # Test data point with NaN value
        data = LineData(time=1640995200, value=float("nan"))
        data_dict = data.asdict()

        # NaN should be converted to 0.0
        assert "value" in data_dict
        assert data_dict["value"] == 0.0
        assert isinstance(data_dict["value"], float)
        assert not math.isnan(data_dict["value"])

    def test_nested_structure_contract(self):
        """Test that nested structures maintain proper contracts."""
        # Create series with legend
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)

        legend = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(0, 0, 0, 0.8)",
            text="<span>Custom Legend: $$value$$</span>",
        )
        series.legend = legend

        series_dict = series.asdict()

        # Verify legend is nested correctly
        assert "legend" in series_dict
        assert isinstance(series_dict["legend"], dict)

        legend_dict = series_dict["legend"]

        # Verify legend fields maintain contract
        assert "visible" in legend_dict
        assert "position" in legend_dict
        assert "backgroundColor" in legend_dict
        assert "text" in legend_dict

        assert isinstance(legend_dict["visible"], bool)
        assert isinstance(legend_dict["position"], str)
        assert isinstance(legend_dict["backgroundColor"], str)
        assert isinstance(legend_dict["text"], str)

        assert legend_dict["visible"] is True
        assert legend_dict["position"] == "top-left"
        assert legend_dict["backgroundColor"] == "rgba(0, 0, 0, 0.8)"
        assert legend_dict["text"] == "<span>Custom Legend: $$value$$</span>"

    def test_chart_configuration_contract(self):
        """Test that chart configuration maintains proper contracts."""
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)
        chart = Chart(series=[series])

        config = chart.to_frontend_config()

        # Verify top-level structure
        assert "charts" in config
        assert isinstance(config["charts"], list)
        assert len(config["charts"]) == 1

        chart_config = config["charts"][0]

        # Verify chart structure
        assert "chart" in chart_config
        assert "series" in chart_config
        assert isinstance(chart_config["series"], list)
        assert len(chart_config["series"]) == 1

        series_config = chart_config["series"][0]

        # Verify series maintains contract
        assert "type" in series_config
        assert "data" in series_config
        assert series_config["type"] == "line"
        assert isinstance(series_config["data"], list)
        assert len(series_config["data"]) == 1

        # Verify data point maintains contract
        data_point = series_config["data"][0]
        assert "time" in data_point
        assert "value" in data_point
        assert isinstance(data_point["time"], int)
        assert isinstance(data_point["value"], float)


class TestIntegrationContractValidation:
    """Test integration scenarios with multiple components."""

    def test_multi_series_chart_contract(self):
        """Test contract validation with multiple series."""
        data1 = [LineData(time=1640995200 + i, value=100.0 + i) for i in range(5)]
        data2 = [
            CandlestickData(time=1640995200 + i, open=100, high=105, low=98, close=102)
            for i in range(5)
        ]

        series1 = LineSeries(data=data1)
        series1.legend = LegendOptions(visible=True, position="top-left", text="Line Series")

        series2 = CandlestickSeries(data=data2)
        series2.legend = LegendOptions(
            visible=True, position="bottom-right", text="Candlestick Series"
        )

        chart = Chart(series=[series1, series2])
        config = chart.to_frontend_config()

        # Validate structure
        assert len(config["charts"]) == 1
        chart_config = config["charts"][0]
        assert len(chart_config["series"]) == 2

        # Validate first series
        series1_config = chart_config["series"][0]
        assert series1_config["type"] == "line"
        assert len(series1_config["data"]) == 5
        assert "legend" in series1_config
        assert series1_config["legend"]["position"] == "top-left"

        # Validate second series
        series2_config = chart_config["series"][1]
        assert series2_config["type"] == "candlestick"
        assert len(series2_config["data"]) == 5
        assert "legend" in series2_config
        assert series2_config["legend"]["position"] == "bottom-right"

        # Validate data integrity
        for i, data_point in enumerate(series1_config["data"]):
            assert data_point["time"] == 1640995200 + i
            assert data_point["value"] == 100.0 + i

        for i, data_point in enumerate(series2_config["data"]):
            assert data_point["time"] == 1640995200 + i
            assert data_point["open"] == 100
            assert data_point["high"] == 105
            assert data_point["low"] == 98
            assert data_point["close"] == 102

    def test_complex_options_contract(self):
        """Test contract validation with complex nested options."""
        data = [LineData(time=1640995200, value=100.0)]
        series = LineSeries(data=data)

        # Add complex legend
        legend = LegendOptions(
            visible=True,
            position="top-left",
            background_color="rgba(255, 255, 255, 0.9)",
            border_color="#e1e3e6",
            border_width=1,
            border_radius=4,
            padding=8,
            margin=4,
            z_index=1000,
            price_format=".2f",
            text="<span style='color: #2196f3'>Custom: $$value$$</span>",
            show_values=True,
            update_on_crosshair=True,
        )
        series.legend = legend

        series_dict = series.asdict()

        # Validate all legend fields maintain contract
        legend_dict = series_dict["legend"]

        # Verify all fields are present and correctly typed
        assert isinstance(legend_dict["visible"], bool)
        assert isinstance(legend_dict["position"], str)
        assert isinstance(legend_dict["backgroundColor"], str)
        assert isinstance(legend_dict["borderColor"], str)
        assert isinstance(legend_dict["borderWidth"], int)
        assert isinstance(legend_dict["borderRadius"], int)
        assert isinstance(legend_dict["padding"], int)
        assert isinstance(legend_dict["margin"], int)
        assert isinstance(legend_dict["zIndex"], int)
        assert isinstance(legend_dict["priceFormat"], str)
        assert isinstance(legend_dict["text"], str)
        assert isinstance(legend_dict["showValues"], bool)
        assert isinstance(legend_dict["updateOnCrosshair"], bool)

        # Verify values
        assert legend_dict["visible"] is True
        assert legend_dict["position"] == "top-left"
        assert legend_dict["backgroundColor"] == "rgba(255, 255, 255, 0.9)"
        assert legend_dict["borderColor"] == "#e1e3e6"
        assert legend_dict["borderWidth"] == 1
        assert legend_dict["borderRadius"] == 4
        assert legend_dict["padding"] == 8
        assert legend_dict["margin"] == 4
        assert legend_dict["zIndex"] == 1000
        assert legend_dict["priceFormat"] == ".2f"
        assert legend_dict["text"] == "<span style='color: #2196f3'>Custom: $$value$$</span>"
        assert legend_dict["showValues"] is True
        assert legend_dict["updateOnCrosshair"] is True


if __name__ == "__main__":
    pytest.main([__file__])
