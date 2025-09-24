"""Customized Bar Chart Example.

This example demonstrates advanced styling and customization options for BarSeries
including colors, visibility settings, and interactive features.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st

from examples.utilities.data_samples import get_bar_data
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import BarSeries

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate customized BarSeries functionality."""
    st.title("Customized Bar Chart Example")
    st.write("This example shows how to customize bar charts with various styling options.")

    # Get sample data
    bar_data = get_bar_data()

    # Create sidebar for customization options
    st.sidebar.header("Bar Chart Customization")

    # Color customization
    st.sidebar.subheader("Colors")
    up_color = st.sidebar.color_picker("Up Color", "#26a69a")
    down_color = st.sidebar.color_picker("Down Color", "#ef5350")
    base_color = st.sidebar.color_picker("Base Color", "#2196f3")

    # Visibility options
    st.sidebar.subheader("Visibility")
    open_visible = st.sidebar.checkbox("Show Open", value=True)
    thin_bars = st.sidebar.checkbox("Thin Bars", value=False)

    # Create customized bar series
    bar_series = BarSeries(data=bar_data)

    # Apply customizations
    bar_series.up_color = up_color
    bar_series.down_color = down_color
    bar_series.color = base_color
    bar_series.open_visible = open_visible
    bar_series.thin_bars = thin_bars

    # Create chart
    chart = Chart()
    chart.add_series(bar_series)

    # Display the chart
    st.subheader("Customized Bar Chart")
    chart.render(key="customized_bar")

    # Show current settings
    st.subheader("Current Settings")
    col1, col2, col3 = st.columns(3)

    with col1:
        st.write("**Colors:**")
        st.write(f"Up: {up_color}")
        st.write(f"Down: {down_color}")
        st.write(f"Base: {base_color}")

    with col2:
        st.write("**Visibility:**")
        st.write(f"Open visible: {open_visible}")
        st.write(f"Thin bars: {thin_bars}")

    with col3:
        st.write("**Series Info:**")
        st.write(f"Data points: {len(bar_data)}")
        st.write(f"Chart type: {bar_series.chart_type}")

    # Show data statistics
    st.subheader("Data Statistics")
    opens = [point.open for point in bar_data]
    highs = [point.high for point in bar_data]
    lows = [point.low for point in bar_data]
    closes = [point.close for point in bar_data]

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Average Open", f"{sum(opens) / len(opens):.2f}")
    with col2:
        st.metric("Average High", f"{sum(highs) / len(highs):.2f}")
    with col3:
        st.metric("Average Low", f"{sum(lows) / len(lows):.2f}")
    with col4:
        st.metric("Average Close", f"{sum(closes) / len(closes):.2f}")

    # Show price movement analysis
    st.subheader("Price Movement Analysis")

    # Calculate up/down movements
    up_moves = sum(1 for i in range(1, len(closes)) if closes[i] > closes[i - 1])
    down_moves = sum(1 for i in range(1, len(closes)) if closes[i] < closes[i - 1])
    flat_moves = sum(1 for i in range(1, len(closes)) if closes[i] == closes[i - 1])

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Up Moves", up_moves, delta=f"{up_moves / (len(closes) - 1) * 100:.1f}%")
    with col2:
        st.metric("Down Moves", down_moves, delta=f"-{down_moves / (len(closes) - 1) * 100:.1f}%")
    with col3:
        st.metric("Flat Moves", flat_moves, delta=f"{flat_moves / (len(closes) - 1) * 100:.1f}%")

    # Show series properties
    st.subheader("Series Properties")
    st.json(
        {
            "chart_type": bar_series.chart_type,
            "visible": bar_series.visible,  # pylint: disable=no-member
            "price_scale_id": bar_series.price_scale_id,  # pylint: disable=no-member
            "pane_id": bar_series.pane_id,  # pylint: disable=no-member
            "up_color": bar_series.up_color,
            "down_color": bar_series.down_color,
            "color": bar_series.color,
            "open_visible": bar_series.open_visible,
            "thin_bars": bar_series.thin_bars,
        },
    )


if __name__ == "__main__":
    main()
