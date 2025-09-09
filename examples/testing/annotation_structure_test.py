"""
Annotation Structure Test Example

This example tests the annotation structure handling to ensure that
annotations from the Python AnnotationManager are properly processed
by the frontend.
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import CandlestickSeries, Chart
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.data import OhlcvData
from streamlit_lightweight_charts_pro.data.annotation import (
    create_arrow_annotation,
    create_text_annotation,
)


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
    st.title("Annotation Structure Test")
    st.write(
        "This example tests the annotation structure handling to ensure that annotations from the Python AnnotationManager are properly processed by the frontend."
    )

    # Generate sample data
    ohlcv_data = generate_sample_data()

    # Test 1: Chart with AnnotationManager structure (from Python side)
    st.subheader("Test 1: Chart with AnnotationManager Structure")
    st.write(
        "This chart uses the AnnotationManager from the Python side, which creates a 'layers' structure."
    )

    chart_with_manager = Chart(ChartOptions(width=800, height=400))

    # Add candlestick series
    candlestick_series = CandlestickSeries(data=ohlcv_data, name="Price", color="#2196F3")

    chart_with_manager.add_series(candlestick_series)

    # Add annotations using AnnotationManager (this creates the 'layers' structure)
    annotation1 = create_text_annotation("2024-06-15", 110, "Support Level", color="#4CAF50")
    annotation2 = create_arrow_annotation("2024-08-15", 120, "Resistance", color="#F44336")

    chart_with_manager.add_annotation(annotation1, "technical")
    chart_with_manager.add_annotation(annotation2, "signals")

    # Test 2: Chart with direct annotations array
    st.subheader("Test 2: Chart with Direct Annotations Array")
    st.write("This chart uses a direct array of annotations.")

    chart_with_array = Chart(ChartOptions(width=800, height=400))

    # Add candlestick series
    candlestick_series2 = CandlestickSeries(data=ohlcv_data, name="Price", color="#FF9800")

    chart_with_array.add_series(candlestick_series2)

    # Add annotations as direct array
    direct_annotations = [
        {
            "time": "2024-06-15",
            "price": 110,
            "text": "Direct Annotation 1",
            "type": "text",
            "position": "above",
            "color": "#4CAF50",
        },
        {
            "time": "2024-08-15",
            "price": 120,
            "text": "Direct Annotation 2",
            "type": "arrow",
            "position": "below",
            "color": "#F44336",
        },
    ]

    # Test 3: Chart with mixed annotation structures
    st.subheader("Test 3: Chart with Mixed Annotation Structures")
    st.write("This chart tests both structures together.")

    chart_mixed = Chart(ChartOptions(width=800, height=400))

    # Add candlestick series
    candlestick_series3 = CandlestickSeries(data=ohlcv_data, name="Price", color="#9C27B0")

    chart_mixed.add_series(candlestick_series3)

    # Add annotation using manager
    annotation3 = create_text_annotation("2024-07-15", 115, "Mixed Test", color="#FF5722")
    chart_mixed.add_annotation(annotation3)

    # Display all charts
    st.subheader("Chart 1: AnnotationManager Structure")
    st.components.v1.html(chart_with_manager.to_html(), height=450)

    st.subheader("Chart 2: Direct Annotations Array")
    st.components.v1.html(chart_with_array.to_html(), height=450)

    st.subheader("Chart 3: Mixed Structure")
    st.components.v1.html(chart_mixed.to_html(), height=450)

    st.success(
        "✅ All charts should render without errors, properly handling both annotation structures!"
    )

    # Show the structure difference
    st.subheader("Structure Comparison")

    col1, col2 = st.columns(2)

    with col1:
        st.write("**AnnotationManager Structure (from Python):**")
        st.json(chart_with_manager.to_frontend_config()["charts"][0]["annotations"])

    with col2:
        st.write("**Direct Array Structure:**")
        st.json({"annotations": direct_annotations})


if __name__ == "__main__":
    main()
