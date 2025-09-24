import pandas as pd

from streamlit_lightweight_charts_pro.charts import Chart, ChartManager
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from streamlit_lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from streamlit_lightweight_charts_pro.charts.series.candlestick import CandlestickSeries
from streamlit_lightweight_charts_pro.charts.series.histogram import HistogramSeries
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.data.annotation import Annotation
from streamlit_lightweight_charts_pro.data.line_data import LineData
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.data.trade import TradeData
from streamlit_lightweight_charts_pro.type_definitions.enums import PriceScaleMode


def create_sample_ohlcv_data(n=10):
    return [
        OhlcvData(
            time=1640995200 + i * 60 * 60,
            open=100 + i,
            high=105 + i,
            low=95 + i,
            close=102 + i,
            volume=1000 + i * 10,
        )
        for i in range(n)
    ]


def create_sample_line_data(n=10):
    return [LineData(time=1640995200 + i * 60 * 60, value=100 + i) for i in range(n)]


def test_multi_series_chart_with_price_scales():
    """Test chart with multiple series and different price scales."""
    line_series = LineSeries(
        data=create_sample_line_data(),
        price_scale_id="left",
    )
    candle_series = CandlestickSeries(data=create_sample_ohlcv_data(), price_scale_id="right")
    volume_series = HistogramSeries(data=create_sample_ohlcv_data(), price_scale_id="overlay1")
    chart = Chart(series=[line_series, candle_series, volume_series])
    config = chart.to_frontend_config()
    assert len(config["charts"][0]["series"]) == 3
    assert {s["priceScaleId"] for s in config["charts"][0]["series"]} == {
        "left",
        "right",
        "overlay1",
    }


def test_dataframe_to_chart_pipeline():
    """Test DataFrame → Series → Chart → JSON pipeline."""
    test_dataframe = pd.DataFrame(
        {
            "time": pd.date_range("2024-01-01", periods=10, freq="1h"),
            "open": range(100, 110),
            "high": range(105, 115),
            "low": range(95, 105),
            "close": range(102, 112),
            "volume": range(1000, 1010),
        },
    )
    column_mapping = {
        "time": "time",
        "open": "open",
        "high": "high",
        "low": "low",
        "close": "close",
        "volume": "volume",
    }
    manager = ChartManager()
    chart = manager.from_price_volume_dataframe(
        data=test_dataframe,
        column_mapping=column_mapping,
        price_type="candlestick",
    )
    config = chart.to_frontend_config()
    assert "charts" in config
    assert len(config["charts"][0]["series"]) == 2  # price + volume


def test_chart_with_annotations_and_trades():
    """Test chart with annotations and trade visualization integration."""
    line_series = LineSeries(data=create_sample_line_data())
    chart = Chart(series=[line_series])
    # Add annotation
    annotation = Annotation(
        time=1640995200,
        price=100,
        position="above",
        text="Test",
        color="#ff0000",
    )
    chart.add_annotation(annotation)
    # Add trade visualization
    trades = [
        TradeData(
            entry_time=1640995200,
            entry_price=100,
            exit_time=1640998800,
            exit_price=110,
            quantity=1,
            trade_type="long",
        ),
    ]
    chart.options.trade_visualization = TradeVisualizationOptions()
    chart.add_trades(trades)
    config = chart.to_frontend_config()
    assert "annotations" in config["charts"][0]
    assert len(config["charts"][0]["annotations"]) >= 1
    # Check that trades were added to chart configuration
    assert "trades" in config["charts"][0]
    assert len(config["charts"][0]["trades"]) > 0
    # Check that trade visualization options were added
    assert "tradeVisualizationOptions" in config["charts"][0]


def test_serialization_idempotency():
    """Test that serialization is idempotent and matches frontend expectations."""
    line_series = LineSeries(data=create_sample_line_data())
    chart = Chart(series=[line_series])
    config1 = chart.to_frontend_config()
    config2 = chart.to_frontend_config()
    assert config1 == config2
    assert "charts" in config1
    assert isinstance(config1["charts"], list)
    assert "series" in config1["charts"][0]
    assert isinstance(config1["charts"][0]["series"], list)


def test_series_with_price_scale_configuration():
    """Test series with price scale configuration."""
    # Create series with custom price scale
    line_series = LineSeries(data=create_sample_line_data())

    # Configure price scale
    margins = PriceScaleMargins(top=0.15, bottom=0.25)
    price_scale = PriceScaleOptions(
        price_scale_id="custom_scale",
        visible=True,
        auto_scale=False,
        mode=PriceScaleMode.LOGARITHMIC,
        invert_scale=True,
        border_visible=False,
        border_color="rgba(255, 0, 0, 0.8)",
        text_color="#00ff00",
        ticks_visible=False,
        ensure_edge_tick_marks_visible=True,
        align_labels=False,
        entire_text_only=True,
        minimum_width=90,
        scale_margins=margins,
    )

    line_series.price_scale = price_scale

    chart = Chart(series=[line_series])
    config = chart.to_frontend_config()

    # Verify price scale configuration
    series_config = config["charts"][0]["series"][0]
    assert "priceScale" in series_config

    ps = series_config["priceScale"]
    assert ps["priceScaleId"] == "custom_scale"
    assert ps["visible"] is True
    assert ps["autoScale"] is False
    assert ps["mode"] == PriceScaleMode.LOGARITHMIC.value
    assert ps["invertScale"] is True
    assert ps["borderVisible"] is False
    assert ps["borderColor"] == "rgba(255, 0, 0, 0.8)"
    assert ps["textColor"] == "#00ff00"
    assert ps["ticksVisible"] is False
    assert ps["ensureEdgeTickMarksVisible"] is True
    assert ps["alignLabels"] is False
    assert ps["entireTextOnly"] is True
    assert ps["minimumWidth"] == 90
    assert ps["scaleMargins"]["top"] == 0.15
    assert ps["scaleMargins"]["bottom"] == 0.25


def test_multiple_series_with_different_price_scales():
    """Test multiple series with different price scale configurations."""
    # Create series with different price scales
    line_series = LineSeries(data=create_sample_line_data())
    candle_series = CandlestickSeries(data=create_sample_ohlcv_data())

    # Configure different price scales
    line_price_scale = PriceScaleOptions(
        price_scale_id="line_scale",
        visible=True,
        auto_scale=True,
        mode=PriceScaleMode.NORMAL,
        invert_scale=False,
    )

    candle_price_scale = PriceScaleOptions(
        price_scale_id="candle_scale",
        visible=True,
        auto_scale=False,
        mode=PriceScaleMode.LOGARITHMIC,
        invert_scale=True,
    )

    line_series.price_scale = line_price_scale
    candle_series.price_scale = candle_price_scale

    chart = Chart(series=[line_series, candle_series])
    config = chart.to_frontend_config()

    # Verify both series have their price scales
    series_configs = config["charts"][0]["series"]
    assert len(series_configs) == 2

    # Check line series price scale
    line_config = series_configs[0]
    assert "priceScale" in line_config
    assert line_config["priceScale"]["priceScaleId"] == "line_scale"
    assert line_config["priceScale"]["autoScale"] is True
    assert line_config["priceScale"]["mode"] == PriceScaleMode.NORMAL.value
    assert line_config["priceScale"]["invertScale"] is False

    # Check candle series price scale
    candle_config = series_configs[1]
    assert "priceScale" in candle_config
    assert candle_config["priceScale"]["priceScaleId"] == "candle_scale"
    assert candle_config["priceScale"]["autoScale"] is False
    assert candle_config["priceScale"]["mode"] == PriceScaleMode.LOGARITHMIC.value
    assert candle_config["priceScale"]["invertScale"] is True


def test_price_scale_with_none_value():
    """Test that price_scale with None value is handled correctly."""
    line_series = LineSeries(data=create_sample_line_data())

    # Set price_scale to None
    line_series.price_scale = None

    chart = Chart(series=[line_series])
    config = chart.to_frontend_config()

    # Verify price_scale is not included in output
    series_config = config["charts"][0]["series"][0]
    assert "priceScale" not in series_config


def test_price_scale_and_price_scale_id_coexistence_integration():
    """Test that price_scale and price_scale_id can coexist in integration."""
    # Create series with both price_scale_id and price_scale
    line_series = LineSeries(data=create_sample_line_data(), price_scale_id="simple_id")

    # Set price_scale with different ID
    price_scale = PriceScaleOptions(price_scale_id="complex_id", visible=False, auto_scale=True)
    line_series.price_scale = price_scale

    chart = Chart(series=[line_series])
    config = chart.to_frontend_config()

    # Verify both are present
    series_config = config["charts"][0]["series"][0]
    assert "priceScaleId" in series_config
    assert "priceScale" in series_config

    # Verify they have different values
    assert series_config["priceScaleId"] == "simple_id"
    assert series_config["priceScale"]["priceScaleId"] == "complex_id"
    assert series_config["priceScale"]["visible"] is False
    assert series_config["priceScale"]["autoScale"] is True


def test_empty_price_scale_id_integration():
    """Test that empty price_scale_id is handled correctly in integration."""
    # Create series with empty price_scale_id
    line_series = LineSeries(data=create_sample_line_data(), price_scale_id="")

    chart = Chart(series=[line_series])
    config = chart.to_frontend_config()

    # Verify empty priceScaleId is included
    series_config = config["charts"][0]["series"][0]
    assert "priceScaleId" in series_config
    assert series_config["priceScaleId"] == ""

    # Verify it's not in options
    assert "options" in series_config
    assert "priceScaleId" not in series_config["options"]
