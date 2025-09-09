"""
Comprehensive Error Test Example

This example tests all the error handling improvements to ensure that
the library handles various error scenarios gracefully.
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
    st.title("Comprehensive Error Handling Test")
    st.write(
        "This example tests all the error handling improvements to ensure the library handles various error scenarios gracefully."
    )

    # Generate sample data
    ohlcv_data = generate_sample_data()

    # Test 1: Chart with null annotations (should not crash)
    st.subheader("Test 1: Null Annotations")
    st.write("This chart has null annotations that should be handled gracefully.")

    chart_null_annotations = Chart(ChartOptions(width=800, height=400))

    candlestick_series_null = CandlestickSeries(
        data=ohlcv_data,
        name="Price with Null Annotations",
        color="#2196F3",
        annotations=None,  # This should be handled gracefully
    )

    chart_null_annotations.add_series(candlestick_series_null)

    # Test 2: Chart with invalid annotation structure
    st.subheader("Test 2: Invalid Annotation Structure")
    st.write("This chart has an invalid annotation structure that should be handled gracefully.")

    chart_invalid_structure = Chart(ChartOptions(width=800, height=400))

    candlestick_series_invalid = CandlestickSeries(
        data=ohlcv_data,
        name="Price with Invalid Structure",
        color="#4CAF50",
        annotations="not an array",  # Invalid: should be handled gracefully
    )

    chart_invalid_structure.add_series(candlestick_series_invalid)

    # Test 3: Chart with empty annotations array
    st.subheader("Test 3: Empty Annotations Array")
    st.write("This chart has an empty annotations array.")

    chart_empty_annotations = Chart(ChartOptions(width=800, height=400))

    candlestick_series_empty = CandlestickSeries(
        data=ohlcv_data,
        name="Price with Empty Annotations",
        color="#FF9800",
        annotations=[],  # Valid: empty array
    )

    chart_empty_annotations.add_series(candlestick_series_empty)

    # Test 4: Chart with valid annotations
    st.subheader("Test 4: Valid Annotations")
    st.write("This chart has valid annotations.")

    chart_valid_annotations = Chart(ChartOptions(width=800, height=400))

    candlestick_series_valid = CandlestickSeries(
        data=ohlcv_data,
        name="Price with Valid Annotations",
        color="#9C27B0",
        annotations=[
            {
                "time": "2024-06-15",
                "price": 110,
                "text": "Valid Annotation 1",
                "type": "text",
                "position": "above",
                "color": "#4CAF50",
            },
            {
                "time": "2024-08-15",
                "price": 120,
                "text": "Valid Annotation 2",
                "type": "arrow",
                "position": "below",
                "color": "#F44336",
            },
        ],
    )

    chart_valid_annotations.add_series(candlestick_series_valid)

    # Test 5: Chart with AnnotationManager (Python side)
    st.subheader("Test 5: AnnotationManager Structure")
    st.write("This chart uses the AnnotationManager from the Python side.")

    chart_manager = Chart(ChartOptions(width=800, height=400))

    candlestick_series_manager = CandlestickSeries(
        data=ohlcv_data, name="Price with AnnotationManager", color="#607D8B"
    )

    chart_manager.add_series(candlestick_series_manager)

    # Add annotations using AnnotationManager
    annotation1 = create_text_annotation("2024-06-15", 110, "Manager Annotation 1", color="#4CAF50")
    annotation2 = create_arrow_annotation(
        "2024-08-15", 120, "Manager Annotation 2", color="#F44336"
    )

    chart_manager.add_annotation(annotation1, "test_layer")
    chart_manager.add_annotation(annotation2, "test_layer")

    # Test 6: Chart with mixed valid and invalid annotations
    st.subheader("Test 6: Mixed Valid and Invalid Annotations")
    st.write("This chart has a mix of valid and invalid annotations.")

    chart_mixed = Chart(ChartOptions(width=800, height=400))

    candlestick_series_mixed = CandlestickSeries(
        data=ohlcv_data,
        name="Price with Mixed Annotations",
        color="#795548",
        annotations=[
            {
                "time": "2024-06-15",
                "price": 110,
                "text": "Valid Mixed Annotation",
                "type": "text",
                "position": "above",
                "color": "#4CAF50",
            },
            None,  # Invalid: should be skipped
            "not an annotation",  # Invalid: should be skipped
            {
                "time": "2024-08-15",
                "price": 120,
                "text": "Another Valid Annotation",
                "type": "arrow",
                "position": "below",
                "color": "#F44336",
            },
        ],
    )

    chart_mixed.add_series(candlestick_series_mixed)

    # Display all charts
    st.subheader("Chart 1: Null Annotations (should not crash)")
    st.components.v1.html(chart_null_annotations.to_html(), height=450)

    st.subheader("Chart 2: Invalid Annotation Structure (should not crash)")
    st.components.v1.html(chart_invalid_structure.to_html(), height=450)

    st.subheader("Chart 3: Empty Annotations Array")
    st.components.v1.html(chart_empty_annotations.to_html(), height=450)

    st.subheader("Chart 4: Valid Annotations")
    st.components.v1.html(chart_valid_annotations.to_html(), height=450)

    st.subheader("Chart 5: AnnotationManager Structure")
    st.components.v1.html(chart_manager.to_html(), height=450)

    st.subheader("Chart 6: Mixed Valid and Invalid Annotations")
    st.components.v1.html(chart_mixed.to_html(), height=450)

    st.success("✅ All charts should render without errors, even with invalid annotations!")

    # Show configuration examples
    st.subheader("Configuration Examples")

    col1, col2 = st.columns(2)

    with col1:
        st.write("**Valid Annotation Structure:**")
        st.json(
            {
                "annotations": [
                    {
                        "time": "2024-01-15",
                        "price": 100,
                        "text": "Example",
                        "type": "text",
                        "position": "above",
                    }
                ]
            }
        )

    with col2:
        st.write("**AnnotationManager Structure:**")
        st.json(
            {
                "layers": {
                    "default": {
                        "name": "default",
                        "visible": True,
                        "annotations": [
                            {
                                "time": "2024-01-15",
                                "price": 100,
                                "text": "Example",
                                "type": "text",
                                "position": "above",
                            }
                        ],
                    }
                }
            }
        )


if __name__ == "__main__":
    main()
