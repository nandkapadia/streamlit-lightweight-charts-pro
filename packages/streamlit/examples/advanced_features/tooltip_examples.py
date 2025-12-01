"""Tooltip Examples for Lightweight Charts

This module demonstrates the comprehensive tooltip functionality with various
use cases including OHLC data, custom templates, trade information, and markers.
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import AreaSeries, CandlestickSeries, Chart, LineSeries
from streamlit_lightweight_charts_pro.data import (
    AreaData,
    BarMarker,
    CandlestickData,
    SingleValueData,
    TooltipConfig,
    TooltipField,
    TooltipManager,
    TooltipPosition,
    TooltipStyle,
    TooltipType,
    TradeData,
    create_custom_tooltip,
    create_ohlc_tooltip,
    create_single_value_tooltip,
    create_trade_tooltip,
)
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    MarkerPosition,
    MarkerShape,
)


def create_sample_data():
    """Create sample data for examples."""
    # Generate sample OHLC data
    dates = pd.date_range("2024-01-01", periods=100, freq="D")
    rng = np.random.default_rng(42)

    # Generate price data with some trend
    base_price = 100
    prices = []
    for _i in range(100):
        if _i == 0:
            price = base_price
        else:
            change = rng.normal(0, 2)
            price = prices[-1] + change
        prices.append(max(price, 1))  # Ensure positive prices

    # Create OHLC data
    ohlc_data = []
    for _i, (date, price) in enumerate(zip(dates, prices)):
        open_price = price
        high_price = price + rng.uniform(0, 5)
        low_price = max(price - rng.uniform(0, 5), 0.1)
        close_price = price + rng.uniform(-2, 2)
        volume = rng.integers(1000, 10000)

        ohlc_data.append(
            CandlestickData(
                time=date,
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
            ),
        )

    # Create line data (moving average)
    line_data = []
    for _i, (date, _price) in enumerate(zip(dates, prices)):
        if _i >= 20:  # 20-day moving average
            ma = sum(prices[_i - 20 : _i]) / 20
            line_data.append(SingleValueData(time=date, value=ma))

    # Create area data (volume)
    area_data = []
    for _i, (date, _price) in enumerate(zip(dates, prices)):
        volume = rng.integers(1000, 10000)
        area_data.append(AreaData(time=date, value=volume))

    return ohlc_data, line_data, area_data


def create_sample_trades():
    """Create sample trade data."""
    return [
        TradeData(
            entry_time="2024-01-15 10:00:00",
            entry_price=105.0,
            exit_time="2024-01-20 15:00:00",
            exit_price=110.0,
            is_profitable=True,
            id="TRADE_001",
            additional_data={
                "quantity": 100,
                "trade_type": "long",
                "tradeType": "long",  # Frontend compatibility
                "notes": "Breakout trade",
                "pnl": (110.0 - 105.0) * 100,
                "pnl_percentage": ((110.0 - 105.0) / 105.0) * 100,
            },
        ),
        TradeData(
            entry_time="2024-01-25 14:30:00",
            entry_price=108.0,
            exit_time="2024-01-30 11:00:00",
            exit_price=102.0,
            is_profitable=False,
            id="TRADE_002",
            additional_data={
                "quantity": 50,
                "trade_type": "short",
                "tradeType": "short",  # Frontend compatibility
                "notes": "Pullback trade",
                "pnl": (102.0 - 108.0) * 50,
                "pnl_percentage": ((102.0 - 108.0) / 108.0) * 100,
            },
        ),
        TradeData(
            entry_time="2024-02-05 09:15:00",
            entry_price=115.0,
            exit_time="2024-02-10 16:00:00",
            exit_price=120.0,
            is_profitable=True,
            id="TRADE_003",
            additional_data={
                "quantity": 75,
                "trade_type": "long",
                "tradeType": "long",  # Frontend compatibility
                "notes": "Trend following",
                "pnl": (120.0 - 115.0) * 75,
                "pnl_percentage": ((120.0 - 115.0) / 115.0) * 100,
            },
        ),
    ]


def example_basic_ohlc_tooltip():
    """Example 1: Basic OHLC tooltip."""
    st.header("Example 1: Basic OHLC Tooltip")
    st.write("This example shows a candlestick chart with default OHLC tooltip.")

    ohlc_data, _, _ = create_sample_data()

    # Create chart with default OHLC tooltip
    chart = Chart(series=CandlestickSeries(data=ohlc_data[:50]))

    # Add default OHLC tooltip
    tooltip_config = create_ohlc_tooltip()
    chart.add_tooltip_config("default", tooltip_config)

    chart.render(key="basic_ohlc_tooltip")


def example_custom_template_tooltip():
    """Example 2: Custom template tooltip."""
    st.header("Example 2: Custom Template Tooltip")
    st.write("This example shows a line chart with custom template tooltip using placeholders.")

    _, line_data, _ = create_sample_data()

    # Create custom tooltip with template
    custom_tooltip = create_custom_tooltip(
        template="Price: ${price}\nMoving Average: {value}\nDate: {time}",
    )

    # Add custom fields for formatting
    custom_tooltip.fields = [
        TooltipField("Price", "price", precision=2, prefix="$"),
        TooltipField("Moving Average", "value", precision=2, prefix="$"),
        TooltipField("Date", "time"),
    ]

    chart = Chart(series=LineSeries(data=line_data[:50]))

    chart.add_tooltip_config("custom", custom_tooltip)
    chart.render(key="custom_template_tooltip")


def example_multi_series_tooltip():
    """Example 3: Multi-series tooltip."""
    st.header("Example 3: Multi-series Tooltip")
    st.write("This example shows multiple series with different tooltip configurations.")

    ohlc_data, line_data, area_data = create_sample_data()

    # Create candlestick series with OHLC tooltip
    candlestick_series = CandlestickSeries(data=ohlc_data[:50])
    ohlc_tooltip = create_ohlc_tooltip()
    candlestick_series.tooltip = ohlc_tooltip

    # Create line series with custom tooltip
    line_series = LineSeries(data=line_data[:50])
    line_tooltip = create_single_value_tooltip()
    line_tooltip.fields = [TooltipField("MA20", "value", precision=2, prefix="$", color="#ff6b6b")]
    line_series.tooltip = line_tooltip

    # Create area series with volume tooltip
    area_series = AreaSeries(data=area_data[:50])
    volume_tooltip = create_single_value_tooltip()
    volume_tooltip.fields = [TooltipField("Volume", "value", formatter=lambda x: f"{x:,.0f}")]
    area_series.tooltip = volume_tooltip

    chart = Chart(series=[candlestick_series, line_series, area_series])
    chart.render(key="multi_series_tooltip")


def example_trade_tooltip():
    """Example 4: Trade tooltip with trade visualization."""
    st.header("Example 4: Trade Tooltip with Trade Visualization")
    st.write("This example shows trades with custom tooltips using the trade visualization system.")

    ohlc_data, _, _ = create_sample_data()
    trades = create_sample_trades()

    # Create candlestick series
    candlestick_series = CandlestickSeries(data=ohlc_data[:50])

    # Create trade tooltip
    trade_tooltip = create_trade_tooltip()
    trade_tooltip.template = """
Trade: {id}
Entry: ${entryPrice} | Exit: ${exitPrice}
Quantity: {quantity}
P&L: ${pnl} ({pnlPercentage}%)
Type: {tradeType}
Notes: {notes}
    """.strip()

    chart = Chart(series=candlestick_series)
    chart.add_tooltip_config("trade", trade_tooltip)
    chart.add_trades(trades)

    chart.render(key="trade_tooltip")


def example_custom_styled_tooltip():
    """Example 5: Custom styled tooltip."""
    st.header("Example 5: Custom Styled Tooltip")
    st.write("This example shows a tooltip with custom styling.")

    _, line_data, _ = create_sample_data()

    # Create custom styled tooltip
    styled_tooltip = TooltipConfig(
        enabled=True,
        type=TooltipType.SINGLE,
        template="📈 Price: ${price}\n📊 Value: {value}",
        position=TooltipPosition.CURSOR,
        offset={"x": 10, "y": -10},
        style=TooltipStyle(
            background_color="rgba(0, 0, 0, 0.9)",
            border_color="#00ff00",
            border_width=2,
            border_radius=8,
            padding=12,
            font_size=14,
            font_family="monospace",
            color="#ffffff",
            box_shadow="0 4px 8px rgba(0, 0, 0, 0.3)",
            z_index=2000,
        ),
        show_date=True,
        show_time=True,
        date_format="%Y-%m-%d",
        time_format="%H:%M",
    )

    styled_tooltip.fields = [
        TooltipField("Price", "price", precision=2, prefix="$", color="#00ff00"),
        TooltipField("Value", "value", precision=2, prefix="$", color="#ff00ff"),
    ]

    chart = Chart(series=LineSeries(data=line_data[:50]))
    chart.add_tooltip_config("styled", styled_tooltip)

    chart.render(key="styled_tooltip")


def example_tooltip_manager():
    """Example 6: Tooltip Manager with multiple configurations."""
    st.header("Example 6: Tooltip Manager")
    st.write("This example demonstrates using the TooltipManager for complex scenarios.")

    ohlc_data, line_data, area_data = create_sample_data()

    # Create tooltip manager
    tooltip_manager = TooltipManager()

    # Add multiple tooltip configurations
    tooltip_manager.create_ohlc_tooltip("price")

    # Create custom tooltip for volume
    volume_tooltip = create_single_value_tooltip()
    volume_tooltip.fields = [TooltipField("Volume", "value", formatter=lambda x: f"{x:,.0f}")]
    tooltip_manager.add_config("volume", volume_tooltip)

    # Create custom tooltip for moving average
    ma_tooltip = create_custom_tooltip("Moving Average: ${value}")
    ma_tooltip.fields = [TooltipField("MA20", "value", precision=2, prefix="$")]
    tooltip_manager.add_config("ma", ma_tooltip)

    # Create candlestick series
    candlestick_series = CandlestickSeries(data=ohlc_data[:50])

    # Create line series
    line_series = LineSeries(data=line_data[:50])

    # Create area series
    area_series = AreaSeries(data=area_data[:50])

    chart = Chart(series=[candlestick_series, line_series, area_series])
    chart.set_tooltip_manager(tooltip_manager)

    chart.render(key="tooltip_manager")


def example_marker_tooltip():
    """Example 7: Marker-specific tooltips."""
    st.header("Example 7: Marker-specific Tooltips")
    st.write("This example shows custom markers with specific tooltips.")

    ohlc_data, _, _ = create_sample_data()

    # Create candlestick series
    candlestick_series = CandlestickSeries(data=ohlc_data[:50])

    # Add custom markers with tooltips
    marker1 = BarMarker(
        time="2024-01-15",
        position=MarkerPosition.ABOVE_BAR,
        color="#ff0000",
        shape=MarkerShape.CIRCLE,
        text="Support Level",
        size=12,
    )

    marker2 = BarMarker(
        time="2024-01-25",
        position=MarkerPosition.BELOW_BAR,
        color="#00ff00",
        shape=MarkerShape.SQUARE,
        text="Resistance Level",
        size=12,
    )

    candlestick_series.add_marker(marker1)
    candlestick_series.add_marker(marker2)

    # Create marker tooltip
    marker_tooltip = TooltipConfig(
        enabled=True,
        type=TooltipType.MARKER,
        template="📍 {text}\nPrice: ${price}\nTime: {time}",
        position=TooltipPosition.CURSOR,
        style=TooltipStyle(
            background_color="rgba(255, 255, 0, 0.9)",
            border_color="#ff6600",
            border_width=2,
            border_radius=6,
            padding=10,
            font_size=12,
            color="#000000",
        ),
    )

    chart = Chart(series=candlestick_series)
    chart.add_tooltip_config("marker", marker_tooltip)

    chart.render(key="marker_tooltip")


def main():
    """Main function to run all tooltip examples."""
    st.title("Lightweight Charts - Tooltip Examples")
    st.write(
        "This page demonstrates the comprehensive tooltip functionality with various use cases.",
    )

    # Create tabs for different examples
    tab1, tab2, tab3, tab4, tab5, tab6, tab7 = st.tabs(
        [
            "Basic OHLC",
            "Custom Template",
            "Multi-Series",
            "Trade Tooltips",
            "Styled Tooltips",
            "Tooltip Manager",
            "Marker Tooltips",
        ],
    )

    with tab1:
        example_basic_ohlc_tooltip()

    with tab2:
        example_custom_template_tooltip()

    with tab3:
        example_multi_series_tooltip()

    with tab4:
        example_trade_tooltip()

    with tab5:
        example_custom_styled_tooltip()

    with tab6:
        example_tooltip_manager()

    with tab7:
        example_marker_tooltip()


if __name__ == "__main__":
    main()
