"""
Fit Content Test Example

This example specifically tests the fitContent functionality to ensure
charts properly rescale to show all data on load.
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import CandlestickSeries, Chart, LineSeries
from streamlit_lightweight_charts_pro.charts.options import ChartOptions, TimeScaleOptions
from streamlit_lightweight_charts_pro.data import OhlcvData, SingleValueData


def generate_sample_data():
    """Generate sample OHLCV data for testing."""
    dates = pd.date_range(start="2024-01-01", end="2024-12-31", freq="D")
    np.random.seed(42)

    # Generate price data
    base_price = 100
    prices = []
    for i in range(len(dates)):
        if i == 0:
            price = base_price
        else:
            change = np.random.normal(0, 1)
            price = prices[-1] * (1 + change * 0.02)
        prices.append(price)

    # Create OHLCV data
    data = []
    for i, (date, price) in enumerate(zip(dates, prices)):
        open_price = price
        high_price = price * (1 + abs(np.random.normal(0, 0.01)))
        low_price = price * (1 - abs(np.random.normal(0, 0.01)))
        close_price = price * (1 + np.random.normal(0, 0.005))
        volume = int(np.random.uniform(1000, 10000))

        data.append(
            OhlcvData(
                time=date.strftime("%Y-%m-%d"),
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
                volume=volume,
            )
        )

    return data


def main():
    st.title("Fit Content Test")
    st.write(
        "This example tests the fitContent functionality to ensure charts properly rescale to show"
        " all data on load."
    )

    # Generate sample data
    ohlcv_data = generate_sample_data()

    # Test 1: Chart with fitContent enabled (default)
    st.subheader("Test 1: Fit Content Enabled (Default)")
    st.write("This chart should automatically fit to show all data on load.")

    chart1 = Chart(
        ChartOptions(
            width=800,
            height=400,
            fit_content_on_load=True,  # Explicitly enable
            time_scale=TimeScaleOptions(
                fit_content_on_load=True,  # Also enable at time scale level
                handle_double_click=True,  # Enable double-click to fit content
            ),
        )
    )

    candlestick_series1 = CandlestickSeries(data=ohlcv_data, name="Price Data", color="#2196F3")

    chart1.add_series(candlestick_series1)

    # Test 2: Chart with fitContent disabled
    st.subheader("Test 2: Fit Content Disabled")
    st.write("This chart should NOT automatically fit to show all data on load.")

    chart2 = Chart(
        ChartOptions(
            width=800,
            height=400,
            fit_content_on_load=False,  # Explicitly disable
            time_scale=TimeScaleOptions(
                fit_content_on_load=False,  # Also disable at time scale level
                handle_double_click=True,  # Keep double-click enabled
            ),
        )
    )

    candlestick_series2 = CandlestickSeries(data=ohlcv_data, name="Price Data", color="#4CAF50")

    chart2.add_series(candlestick_series2)

    # Test 3: Multi-series chart with fitContent
    st.subheader("Test 3: Multi-Series Chart with Fit Content")
    st.write("This chart has multiple series and should fit to show all data.")

    chart3 = Chart(
        ChartOptions(
            width=800,
            height=400,
            fit_content_on_load=True,
            time_scale=TimeScaleOptions(fit_content_on_load=True, handle_double_click=True),
        )
    )

    # Add candlestick series
    candlestick_series3 = CandlestickSeries(data=ohlcv_data, name="OHLCV Data", color="#2196F3")

    # Add line series (volume)
    volume_data = [SingleValueData(time=d.time, value=d.volume) for d in ohlcv_data]
    line_series3 = LineSeries(
        data=volume_data,
        name="Volume",
        color="#FF9800",
        price_scale_id="left",  # Use left price scale
    )

    chart3.add_series(candlestick_series3)
    chart3.add_series(line_series3)

    # Display all charts
    st.subheader("Chart 1: Fit Content Enabled")
    st.components.v1.html(chart1.to_html(), height=450)

    st.subheader("Chart 2: Fit Content Disabled")
    st.components.v1.html(chart2.to_html(), height=450)

    st.subheader("Chart 3: Multi-Series with Fit Content")
    st.components.v1.html(chart3.to_html(), height=450)

    # Instructions
    st.subheader("Instructions")
    st.write(
        """
    1. **Chart 1**: Should automatically fit to show all data when loaded
    2. **Chart 2**: Should NOT automatically fit - you'll need to manually zoom out or double-click
    3. **Chart 3**: Should automatically fit to show all data from both series
    
    **Double-click test**: Try double-clicking on any chart's time axis to fit content manually.
    
    **Expected behavior**:
    - Chart 1 and 3 should show the full year of data (2024-01-01 to 2024-12-31)
    - Chart 2 should show only a portion of the data initially
    - Double-clicking on Chart 2 should make it fit to show all data
    """
    )

    # Configuration examples
    st.subheader("Configuration Examples")

    col1, col2 = st.columns(2)

    with col1:
        st.write("**Enable Fit Content:**")
        st.json(
            {
                "fit_content_on_load": True,
                "time_scale": {"fit_content_on_load": True, "handle_double_click": True},
            }
        )

    with col2:
        st.write("**Disable Fit Content:**")
        st.json(
            {
                "fit_content_on_load": False,
                "time_scale": {"fit_content_on_load": False, "handle_double_click": True},
            }
        )


if __name__ == "__main__":
    main()
