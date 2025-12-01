"""Customized Baseline Chart Example.

This example demonstrates advanced styling and customization options for BaselineSeries
including colors, baseline values, and interactive features.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import BaselineSeries

from examples.utilities.data_samples import get_baseline_data
from streamlit_lightweight_charts_pro.charts import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate customized BaselineSeries functionality."""
    st.title("Customized Baseline Chart Example")
    st.write("This example shows how to customize baseline charts with various styling options.")

    # Get sample data
    baseline_data = get_baseline_data()

    # Create sidebar for customization options
    st.sidebar.header("Baseline Chart Customization")

    # Baseline value customization
    st.sidebar.subheader("Baseline Value")
    baseline_value = st.sidebar.number_input("Baseline Value", value=25.0, step=1.0)
    relative_gradient = st.sidebar.checkbox("Relative Gradient", value=False)

    # Top area colors
    st.sidebar.subheader("Top Area Colors")
    top_fill_color1 = st.sidebar.color_picker("Top Fill Color 1", "rgba(38, 166, 154, 0.28)")
    top_fill_color2 = st.sidebar.color_picker("Top Fill Color 2", "rgba(38, 166, 154, 0.05)")
    top_line_color = st.sidebar.color_picker("Top Line Color", "rgba(38, 166, 154, 1)")

    # Bottom area colors
    st.sidebar.subheader("Bottom Area Colors")
    bottom_fill_color1 = st.sidebar.color_picker("Bottom Fill Color 1", "rgba(239, 83, 80, 0.05)")
    bottom_fill_color2 = st.sidebar.color_picker("Bottom Fill Color 2", "rgba(239, 83, 80, 0.28)")
    bottom_line_color = st.sidebar.color_picker("Bottom Line Color", "rgba(239, 83, 80, 1)")

    # Create customized baseline series
    baseline_series = BaselineSeries(data=baseline_data)

    # Apply customizations
    baseline_series.base_value = {
        "type": "price",
        "price": baseline_value,
    }  # pylint: disable=no-member
    baseline_series.relative_gradient = relative_gradient  # pylint: disable=no-member
    baseline_series.top_fill_color1 = top_fill_color1  # pylint: disable=no-member
    baseline_series.top_fill_color2 = top_fill_color2  # pylint: disable=no-member
    baseline_series.top_line_color = top_line_color  # pylint: disable=no-member
    baseline_series.bottom_fill_color1 = bottom_fill_color1  # pylint: disable=no-member
    baseline_series.bottom_fill_color2 = bottom_fill_color2  # pylint: disable=no-member
    baseline_series.bottom_line_color = bottom_line_color  # pylint: disable=no-member

    # Create chart
    chart = Chart()
    chart.add_series(baseline_series)

    # Display the chart
    st.subheader("Customized Baseline Chart")
    chart.render(key="customized_baseline")

    # Show current settings
    st.subheader("Current Settings")
    col1, col2, col3 = st.columns(3)

    with col1:
        st.write("**Baseline:**")
        st.write(f"Value: {baseline_value}")
        st.write(f"Relative gradient: {relative_gradient}")

    with col2:
        st.write("**Top Colors:**")
        st.write(f"Fill 1: {top_fill_color1}")
        st.write(f"Fill 2: {top_fill_color2}")
        st.write(f"Line: {top_line_color}")

    with col3:
        st.write("**Bottom Colors:**")
        st.write(f"Fill 1: {bottom_fill_color1}")
        st.write(f"Fill 2: {bottom_fill_color2}")
        st.write(f"Line: {bottom_line_color}")

    # Show data statistics
    st.subheader("Data Statistics")
    values = [point.value for point in baseline_data]

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Minimum Value", f"{min(values):.2f}")
    with col2:
        st.metric("Maximum Value", f"{max(values):.2f}")
    with col3:
        st.metric("Average Value", f"{sum(values) / len(values):.2f}")
    with col4:
        st.metric("Data Points", len(values))

    # Show baseline analysis
    st.subheader("Baseline Analysis")

    # Calculate values above and below baseline
    above_baseline = sum(1 for v in values if v > baseline_value)
    below_baseline = sum(1 for v in values if v < baseline_value)
    at_baseline = sum(1 for v in values if abs(v - baseline_value) < 0.01)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(
            "Above Baseline",
            above_baseline,
            delta=f"{above_baseline / len(values) * 100:.1f}%",
        )
    with col2:
        st.metric(
            "Below Baseline",
            below_baseline,
            delta=f"-{below_baseline / len(values) * 100:.1f}%",
        )
    with col3:
        st.metric("At Baseline", at_baseline, delta=f"{at_baseline / len(values) * 100:.1f}%")

    # Calculate distance from baseline
    distances = [abs(v - baseline_value) for v in values]
    avg_distance = sum(distances) / len(distances)
    max_distance = max(distances)

    st.write(f"Average distance from baseline: {avg_distance:.2f}")
    st.write(f"Maximum distance from baseline: {max_distance:.2f}")

    # Show series properties
    st.subheader("Series Properties")
    st.json(
        {
            "chart_type": baseline_series.chart_type,
            "visible": baseline_series.visible,  # pylint: disable=no-member
            "price_scale_id": baseline_series.price_scale_id,  # pylint: disable=no-member
            "pane_id": baseline_series.pane_id,  # pylint: disable=no-member
            "base_value": baseline_series.base_value,  # pylint: disable=no-member
            "relative_gradient": baseline_series.relative_gradient,  # pylint: disable=no-member
            "top_fill_color1": baseline_series.top_fill_color1,  # pylint: disable=no-member
            "top_fill_color2": baseline_series.top_fill_color2,  # pylint: disable=no-member
            "top_line_color": baseline_series.top_line_color,  # pylint: disable=no-member
            "bottom_fill_color1": baseline_series.bottom_fill_color1,  # pylint: disable=no-member
            "bottom_fill_color2": baseline_series.bottom_fill_color2,  # pylint: disable=no-member
            "bottom_line_color": baseline_series.bottom_line_color,  # pylint: disable=no-member
        },
    )


if __name__ == "__main__":
    main()
