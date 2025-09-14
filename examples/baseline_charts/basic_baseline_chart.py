"""
Basic Baseline Chart Example.

This example demonstrates the fundamental usage of BaselineSeries with sample data
from the data_samples module.

# Add project root to path for examples imports
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))



"""

import streamlit as st

from examples.utilities.data_samples import get_baseline_data, get_dataframe_line_data
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import BaselineSeries


def main():
    """Demonstrate basic BaselineSeries functionality."""
    st.title("Basic Baseline Chart Example")
    st.write(
        "This example shows how to create a simple baseline chart using BaselineSeries with sample"
        " data."
    )

    # Get sample data
    baseline_data = get_baseline_data()
    df_data = get_dataframe_line_data()

    # Method 1: Using LineData objects (converted to BaselineData)
    st.subheader("Method 1: Using LineData Objects")
    st.write("Creating BaselineSeries from LineData objects:")

    baseline_series = BaselineSeries(data=baseline_data)

    chart = Chart()
    chart.add_series(baseline_series)

    chart.render(key="basic_baseline_1")

    # Method 2: Using DataFrame
    st.subheader("Method 2: Using DataFrame")
    st.write("Creating BaselineSeries from pandas DataFrame:")

    baseline_series_df = BaselineSeries(
        data=df_data, column_mapping={"time": "datetime", "value": "value"}
    )

    dataframe_chart = Chart()
    dataframe_chart.add_series(baseline_series_df)

    dataframe_chart.render(key="basic_baseline_2")

    # Show data info
    st.subheader("Data Information")
    st.write(f"Number of data points: {len(baseline_data)}")

    # Show first few data points
    st.write("First 5 data points:")
    st.dataframe(df_data.head())

    # Show series properties
    st.subheader("Series Properties")
    st.write(f"Chart type: {baseline_series.chart_type}")
    st.write(f"Visible: {baseline_series.visible}")  # pylint: disable=no-member
    st.write(f"Price scale ID: {baseline_series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"Pane ID: {baseline_series.pane_id}")  # pylint: disable=no-member

    # Show data statistics
    st.subheader("Data Statistics")
    values = [point.value for point in baseline_data]
    st.write(f"Minimum value: {min(values):.2f}")
    st.write(f"Maximum value: {max(values):.2f}")
    st.write(f"Average value: {sum(values) / len(values):.2f}")

    # Show baseline analysis
    st.subheader("Baseline Analysis")

    # Calculate values above and below baseline
    baseline_value = baseline_series.base_value.get("price", 0)  # pylint: disable=no-member
    above_baseline = sum(1 for v in values if v > baseline_value)
    below_baseline = sum(1 for v in values if v < baseline_value)
    at_baseline = sum(1 for v in values if abs(v - baseline_value) < 0.01)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Above Baseline", above_baseline, delta=f"{above_baseline/len(values)*100:.1f}%")
    with col2:
        st.metric("Below Baseline", below_baseline, delta=f"-{below_baseline/len(values)*100:.1f}%")
    with col3:
        st.metric("At Baseline", at_baseline, delta=f"{at_baseline/len(values)*100:.1f}%")

    # Show baseline configuration
    st.subheader("Baseline Configuration")
    st.write(f"Base value: {baseline_series.base_value}")  # pylint: disable=no-member
    st.write(f"Relative gradient: {baseline_series.relative_gradient}")  # pylint: disable=no-member

    # Show the raw data
    st.subheader("Raw Data")
    st.dataframe(df_data)


if __name__ == "__main__":
    main()
