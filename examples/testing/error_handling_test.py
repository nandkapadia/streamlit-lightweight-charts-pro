"""
Error Handling Test Example

This example tests the error handling improvements for annotations and other features.
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import CandlestickSeries, Chart
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.data import OhlcvData


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
    st.title("Error Handling Test")
    st.write(
        "This example tests the error handling improvements for annotations and other features."
    )

    # Generate sample data
    ohlcv_data = generate_sample_data()

    # Create a chart with various error scenarios
    chart = Chart(
        ChartOptions(width=800, height=400, fit_content_on_load=True, handle_double_click=True)
    )

    # Add candlestick series
    candlestick_series = CandlestickSeries(data=ohlcv_data, name="Price", color="#2196F3")

    chart.add_series(candlestick_series)

    # Test 1: Invalid annotations (should not crash)
    st.subheader("Test 1: Invalid Annotations")
    st.write("This chart has invalid annotations that should be handled gracefully.")

    # Create chart with invalid annotations
    chart_with_invalid_annotations = Chart(ChartOptions(width=800, height=400))

    candlestick_series_with_annotations = CandlestickSeries(
        data=ohlcv_data,
        name="Price with Invalid Annotations",
        color="#2196F3",
        # This should be handled gracefully
        annotations=None,  # Invalid: should be an array
    )

    chart_with_invalid_annotations.add_series(candlestick_series_with_annotations)

    # Test 2: Empty annotations array
    st.subheader("Test 2: Empty Annotations Array")
    st.write("This chart has an empty annotations array.")

    chart_with_empty_annotations = Chart(ChartOptions(width=800, height=400))

    candlestick_series_empty_annotations = CandlestickSeries(
        data=ohlcv_data,
        name="Price with Empty Annotations",
        color="#4CAF50",
        annotations=[],  # Valid: empty array
    )

    chart_with_empty_annotations.add_series(candlestick_series_empty_annotations)

    # Test 3: Valid annotations
    st.subheader("Test 3: Valid Annotations")
    st.write("This chart has valid annotations.")

    chart_with_valid_annotations = Chart(ChartOptions(width=800, height=400))

    candlestick_series_valid_annotations = CandlestickSeries(
        data=ohlcv_data,
        name="Price with Valid Annotations",
        color="#FF9800",
        annotations=[
            {
                "time": "2024-06-15",
                "price": 110,
                "type": "arrow",
                "text": "Test Annotation",
                "color": "#F44336",
            }
        ],
    )

    chart_with_valid_annotations.add_series(candlestick_series_valid_annotations)

    # Display all charts
    st.subheader("Chart 1: Basic Chart")
    st.components.v1.html(chart.to_html(), height=450)

    st.subheader("Chart 2: Invalid Annotations (should not crash)")
    st.components.v1.html(chart_with_invalid_annotations.to_html(), height=450)

    st.subheader("Chart 3: Empty Annotations Array")
    st.components.v1.html(chart_with_empty_annotations.to_html(), height=450)

    st.subheader("Chart 4: Valid Annotations")
    st.components.v1.html(chart_with_valid_annotations.to_html(), height=450)

    st.success("✅ All charts should render without errors, even with invalid annotations!")


if __name__ == "__main__":
    main()
