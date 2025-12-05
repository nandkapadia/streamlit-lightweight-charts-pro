"""Auto-Size and Double-Click FitContent Example

This example demonstrates the auto-size functionality and double-click to fit content
features of the streamlit-lightweight-charts-pro library.
"""

import numpy as np
import pandas as pd
import streamlit as st
from lightweight_charts_pro.charts.options import ChartOptions, TimeScaleOptions

from streamlit_lightweight_charts_pro import CandlestickSeries, Chart, LineSeries
from streamlit_lightweight_charts_pro.data import OhlcvData, SingleValueData


def generate_sample_data():
    """Generate sample OHLCV data for testing."""
    dates = pd.date_range(start="2024-01-01", end="2024-12-31", freq="D")
    rng = np.random.default_rng(42)

    # Generate price data
    base_price = 100
    prices = []
    for i in range(len(dates)):
        if i == 0:
            close = base_price
        else:
            change = rng.normal(0, 1)
            close = prices[-1]["close"] * (1 + change * 0.02)

        high = close * (1 + abs(rng.normal(0, 0.01)))
        low = close * (1 - abs(rng.normal(0, 0.01)))
        open_price = rng.uniform(low, high)
        volume = rng.integers(1000, 10000)

        prices.append(
            {
                "time": dates[i].strftime("%Y-%m-%d"),
                "open": round(open_price, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close, 2),
                "volume": volume,
            },
        )

    return prices


def main():
    st.title("Auto-Size and Double-Click FitContent Example")
    st.write(
        "This example demonstrates auto-sizing and double-click to fit content functionality."
    )

    # Generate sample data
    data = generate_sample_data()

    # Convert to OHLCV data objects
    ohlcv_data = [
        OhlcvData(
            time=item["time"],
            open=item["open"],
            high=item["high"],
            low=item["low"],
            close=item["close"],
            volume=item["volume"],
        )
        for item in data
    ]

    # Create line data for comparison
    line_data = [SingleValueData(time=item["time"], value=item["close"]) for item in data]

    st.subheader("Features to Test:")
    st.markdown(
        """
    1. **Auto-Size on Load**: Charts should automatically fit to their container
    2. **Double-Click to Fit Content**: Double-click on the chart to fit all data
    3. **Responsive Design**: Resize the browser window to see auto-sizing in action
    """,
    )

    # Example 1: Auto-size candlestick chart
    st.subheader("1. Auto-Size Candlestick Chart")
    st.write("This chart uses auto-sizing and will fit content on load:")

    chart_options = ChartOptions(
        auto_size=True,
        height=400,
        fit_content_on_load=True,
        handle_double_click=True,
        time_scale=TimeScaleOptions(
            fit_content_on_load=True,
            handle_double_click=True,
            handle_scale=True,
            handle_scroll=True,
        ),
    )

    candlestick_chart = Chart(series=CandlestickSeries(data=ohlcv_data), options=chart_options)

    candlestick_chart.render(key="auto_size_candlestick")

    # Example 2: Fixed size chart with double-click
    st.subheader("2. Fixed Size Chart with Double-Click")
    st.write("This chart has a fixed size but supports double-click to fit content:")

    fixed_chart_options = ChartOptions(
        width=800,
        height=300,
        auto_size=False,
        fit_content_on_load=True,
        handle_double_click=True,
        time_scale=TimeScaleOptions(fit_content_on_load=True, handle_double_click=True),
    )

    line_chart = Chart(
        series=LineSeries(data=line_data, color="#2196F3"),
        options=fixed_chart_options,
    )

    line_chart.render(key="fixed_size_line")

    # Example 3: Responsive chart with constraints
    st.subheader("3. Responsive Chart with Size Constraints")
    st.write("This chart auto-sizes with minimum and maximum constraints:")

    responsive_options = ChartOptions(
        auto_size=True,
        auto_width=True,
        auto_height=True,
        min_width=400,
        max_width=1200,
        min_height=200,
        max_height=600,
        fit_content_on_load=True,
        handle_double_click=True,
    )

    responsive_chart = Chart(
        series=LineSeries(data=line_data, color="#4CAF50"),
        options=responsive_options,
    )

    responsive_chart.render(key="responsive_chart")

    # Instructions
    st.subheader("How to Test:")
    st.markdown(
        """
    **Auto-Size on Load:**
    - Charts should automatically fit their data when first loaded
    - Check the browser console for "fitContent() called after data loaded" messages

    **Double-Click to Fit Content:**
    - Double-click anywhere on the chart area
    - The chart should zoom to fit all data
    - Check the browser console for "fitContent() called on double-click" messages

    **Responsive Design:**
    - Resize your browser window
    - Charts should automatically adjust their size
    - The responsive chart has size constraints (min/max width/height)

    **Browser Console:**
    - Open browser developer tools (F12)
    - Check the console for fitContent messages
    - Look for any error messages
    """,
    )

    # Configuration display
    st.subheader("Configuration Used:")
    st.json(
        {
            "auto_size": True,
            "fit_content_on_load": True,
            "handle_double_click": True,
            "time_scale": {
                "fit_content_on_load": True,
                "handle_double_click": True,
                "handle_scale": True,
                "handle_scroll": True,
            },
        },
    )


if __name__ == "__main__":
    main()
