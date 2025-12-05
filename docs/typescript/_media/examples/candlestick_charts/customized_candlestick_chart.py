"""Customized Candlestick Chart Example.

This example demonstrates advanced styling and customization options for CandlestickSeries
including colors, visibility settings, and interactive features.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import CandlestickSeries

from examples.utilities.data_samples import get_candlestick_data
from streamlit_lightweight_charts_pro.charts import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate customized CandlestickSeries functionality."""
    st.title("Customized Candlestick Chart Example")
    st.write(
        "This example shows how to customize candlestick charts with various styling options."
    )

    # Get sample data
    candlestick_data = get_candlestick_data()

    # Create sidebar for customization options
    st.sidebar.header("Candlestick Chart Customization")

    # Color customization
    st.sidebar.subheader("Colors")
    up_color = st.sidebar.color_picker("Up Color", "#26a69a")
    down_color = st.sidebar.color_picker("Down Color", "#ef5350")
    border_color = st.sidebar.color_picker("Border Color", "#2196f3")
    wick_color = st.sidebar.color_picker("Wick Color", "#666666")

    # Visibility options
    st.sidebar.subheader("Visibility")
    wick_visible = st.sidebar.checkbox("Show Wicks", value=True)
    border_visible = st.sidebar.checkbox("Show Borders", value=True)

    # Create customized candlestick series
    candlestick_series = CandlestickSeries(data=candlestick_data)

    # Apply customizations
    candlestick_series.up_color = up_color
    candlestick_series.down_color = down_color
    candlestick_series.border_color = border_color
    candlestick_series.wick_color = wick_color
    candlestick_series.wick_visible = wick_visible
    candlestick_series.border_visible = border_visible

    # Create chart
    chart = Chart()
    chart.add_series(candlestick_series)

    # Display the chart
    st.subheader("Customized Candlestick Chart")
    chart.render(key="customized_candlestick")

    # Show current settings
    st.subheader("Current Settings")
    col1, col2, col3 = st.columns(3)

    with col1:
        st.write("**Colors:**")
        st.write(f"Up: {up_color}")
        st.write(f"Down: {down_color}")
        st.write(f"Border: {border_color}")
        st.write(f"Wick: {wick_color}")

    with col2:
        st.write("**Visibility:**")
        st.write(f"Wicks visible: {wick_visible}")
        st.write(f"Borders visible: {border_visible}")

    with col3:
        st.write("**Series Info:**")
        st.write(f"Data points: {len(candlestick_data)}")
        st.write(f"Chart type: {candlestick_series.chart_type}")

    # Show data statistics
    st.subheader("Data Statistics")
    opens = [point.open for point in candlestick_data]
    highs = [point.high for point in candlestick_data]
    lows = [point.low for point in candlestick_data]
    closes = [point.close for point in candlestick_data]

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Average Open", f"{sum(opens) / len(opens):.2f}")
    with col2:
        st.metric("Average High", f"{sum(highs) / len(highs):.2f}")
    with col3:
        st.metric("Average Low", f"{sum(lows) / len(lows):.2f}")
    with col4:
        st.metric("Average Close", f"{sum(closes) / len(closes):.2f}")

    # Show candlestick pattern analysis
    st.subheader("Candlestick Pattern Analysis")

    # Calculate candlestick patterns
    bullish_candles = sum(1 for i in range(len(closes)) if closes[i] > opens[i])
    bearish_candles = sum(1 for i in range(len(closes)) if closes[i] < opens[i])
    doji_candles = sum(1 for i in range(len(closes)) if abs(closes[i] - opens[i]) < 0.01)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(
            "Bullish Candles",
            bullish_candles,
            delta=f"{bullish_candles / len(closes) * 100:.1f}%",
        )
    with col2:
        st.metric(
            "Bearish Candles",
            bearish_candles,
            delta=f"-{bearish_candles / len(closes) * 100:.1f}%",
        )
    with col3:
        st.metric("Doji Candles", doji_candles, delta=f"{doji_candles / len(closes) * 100:.1f}%")

    # Calculate volatility metrics
    body_sizes = [abs(close - open_) for open_, close in zip(opens, closes)]
    wick_sizes = [high - low for high, low in zip(highs, lows)]

    st.write(f"Average body size: {sum(body_sizes) / len(body_sizes):.2f}")
    st.write(f"Average wick size: {sum(wick_sizes) / len(wick_sizes):.2f}")
    st.write(f"Volatility (avg range): {sum(wick_sizes) / len(wick_sizes):.2f}")

    # Show series properties
    st.subheader("Series Properties")
    st.json(
        {
            "chart_type": candlestick_series.chart_type,
            "visible": candlestick_series.visible,  # pylint: disable=no-member
            "price_scale_id": candlestick_series.price_scale_id,  # pylint: disable=no-member
            "pane_id": candlestick_series.pane_id,  # pylint: disable=no-member
            "up_color": candlestick_series.up_color,
            "down_color": candlestick_series.down_color,
            "border_color": candlestick_series.border_color,
            "wick_color": candlestick_series.wick_color,
            "wick_visible": candlestick_series.wick_visible,
            "border_visible": candlestick_series.border_visible,
        },
    )


if __name__ == "__main__":
    main()
