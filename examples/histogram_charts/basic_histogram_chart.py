"""
Basic Histogram Chart Example.

This example demonstrates the fundamental usage of HistogramSeries with sample data
from the data_samples module.

# Add project root to path for examples imports
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))



"""

import streamlit as st

from examples.data_samples import get_dataframe_line_data, get_volume_data
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series.histogram import HistogramSeries


def main():
    """Demonstrate basic HistogramSeries functionality."""
    st.title("Basic Histogram Chart Example")
    st.write(
        "This example shows how to create a simple histogram chart using HistogramSeries with"
        " sample data."
    )

    # Get sample data
    histogram_data = get_volume_data()
    df_data = get_dataframe_line_data()

    # Method 1: Using LineData objects (converted to HistogramData)
    st.subheader("Method 1: Using LineData Objects")
    st.write("Creating HistogramSeries from LineData objects:")

    histogram_series = HistogramSeries(data=histogram_data)

    chart = Chart()
    chart.add_series(histogram_series)

    chart.render(key="basic_histogram_1")

    # Method 2: Using DataFrame
    st.subheader("Method 2: Using DataFrame")
    st.write("Creating HistogramSeries from pandas DataFrame:")

    histogram_series_df = HistogramSeries(
        data=df_data, column_mapping={"time": "datetime", "value": "value"}
    )

    chart2 = Chart()
    chart2.add_series(histogram_series_df)

    chart2.render(key="basic_histogram_2")

    # Show data info
    st.subheader("Data Information")
    st.write(f"Number of data points: {len(histogram_data)}")

    # Show first few data points
    st.write("First 5 data points:")
    st.dataframe(df_data.head())

    # Show series properties
    st.subheader("Series Properties")
    st.write(f"Chart type: {histogram_series.chart_type}")
    st.write(f"Visible: {histogram_series._visible}")
    st.write(f"Price scale ID: {histogram_series.price_scale_id}")
    st.write(f"Pane ID: {histogram_series.pane_id}")

    # Show data statistics
    st.subheader("Data Statistics")
    values = [point.value for point in histogram_data]
    st.write(f"Minimum value: {min(values):.2f}")
    st.write(f"Maximum value: {max(values):.2f}")
    st.write(f"Average value: {sum(values) / len(values):.2f}")
    st.write(f"Total volume: {sum(values):.2f}")

    # Show volume analysis
    st.subheader("Volume Analysis")

    # Calculate volume distribution
    volume_ranges = {
        "Low (0-10)": sum(1 for v in values if 0 <= v <= 10),
        "Medium (10-30)": sum(1 for v in values if 10 < v <= 30),
        "High (30-50)": sum(1 for v in values if 30 < v <= 50),
        "Very High (>50)": sum(1 for v in values if v > 50),
    }

    for range_name, count in volume_ranges.items():
        percentage = (count / len(values)) * 100
        st.write(f"{range_name}: {count} bars ({percentage:.1f}%)")

    # Show the raw data
    st.subheader("Raw Data")
    st.dataframe(df_data)


if __name__ == "__main__":
    main()
