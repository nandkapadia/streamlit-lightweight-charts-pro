"""Customized Histogram Chart Example.

This example demonstrates advanced styling and customization options for HistogramSeries
including colors, base values, and interactive features.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from examples.utilities.data_samples import get_volume_data

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import HistogramSeries

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate customized HistogramSeries functionality."""
    st.title("Customized Histogram Chart Example")
    st.write("This example shows how to customize histogram charts with various styling options.")

    # Get sample data
    histogram_data = get_volume_data()

    # Create sidebar for customization options
    st.sidebar.header("Histogram Chart Customization")

    # Color customization
    st.sidebar.subheader("Colors")
    color = st.sidebar.color_picker("Bar Color", "#2196f3")
    base_value = st.sidebar.number_input("Base Value", value=0.0, step=1.0)

    # Create customized histogram series
    histogram_series = HistogramSeries(data=histogram_data)

    # Apply customizations
    histogram_series.color = color
    histogram_series.base = base_value

    # Create chart
    chart = Chart()
    chart.add_series(histogram_series)

    # Display the chart
    st.subheader("Customized Histogram Chart")
    chart.render(key="customized_histogram")

    # Show current settings
    st.subheader("Current Settings")
    col1, col2, col3 = st.columns(3)

    with col1:
        st.write("**Styling:**")
        st.write(f"Color: {color}")
        st.write(f"Base value: {base_value}")

    with col2:
        st.write("**Series Info:**")
        st.write(f"Data points: {len(histogram_data)}")
        st.write(f"Chart type: {histogram_series.chart_type}")

    with col3:
        st.write("**Properties:**")
        st.write(f"Visible: {histogram_series.visible}")  # pylint: disable=no-member
        st.write(f"Price scale ID: {histogram_series.price_scale_id}")  # pylint: disable=no-member

    # Show data statistics
    st.subheader("Data Statistics")
    values = [point.value for point in histogram_data]

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Minimum Value", f"{min(values):.2f}")
    with col2:
        st.metric("Maximum Value", f"{max(values):.2f}")
    with col3:
        st.metric("Average Value", f"{sum(values) / len(values):.2f}")
    with col4:
        st.metric("Total Volume", f"{sum(values):.2f}")

    # Show volume analysis
    st.subheader("Volume Analysis")

    # Calculate volume distribution
    volume_ranges = {
        "Low (0-10)": sum(1 for v in values if 0 <= v <= 10),
        "Medium (10-30)": sum(1 for v in values if 10 < v <= 30),
        "High (30-50)": sum(1 for v in values if 30 < v <= 50),
        "Very High (>50)": sum(1 for v in values if v > 50),
    }

    col1, col2 = st.columns(2)

    with col1:
        st.write("**Volume Distribution:**")
        for range_name, count in volume_ranges.items():
            percentage = (count / len(values)) * 100
            st.write(f"{range_name}: {count} bars ({percentage:.1f}%)")

    with col2:
        st.write("**Volume Metrics:**")
        st.write(f"Average volume: {sum(values) / len(values):.2f}")
        st.write(
            "Volume variance:"
            f" {sum((v - sum(values) / len(values)) ** 2 for v in values) / len(values):.2f}",
        )
        st.write(f"Volume range: {max(values) - min(values):.2f}")

    # Show volume trends
    st.subheader("Volume Trends")

    # Calculate volume changes
    volume_changes = []
    for i in range(1, len(values)):
        change = values[i] - values[i - 1]
        volume_changes.append(change)

    positive_changes = sum(1 for change in volume_changes if change > 0)
    negative_changes = sum(1 for change in volume_changes if change < 0)
    no_changes = sum(1 for change in volume_changes if abs(change) < 0.01)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(
            "Volume Increases",
            positive_changes,
            delta=f"{positive_changes / len(volume_changes) * 100:.1f}%",
        )
    with col2:
        st.metric(
            "Volume Decreases",
            negative_changes,
            delta=f"-{negative_changes / len(volume_changes) * 100:.1f}%",
        )
    with col3:
        st.metric("No Change", no_changes, delta=f"{no_changes / len(volume_changes) * 100:.1f}%")

    # Show series properties
    st.subheader("Series Properties")
    st.json(
        {
            "chart_type": histogram_series.chart_type,
            "visible": histogram_series.visible,  # pylint: disable=no-member
            "price_scale_id": histogram_series.price_scale_id,  # pylint: disable=no-member
            "pane_id": histogram_series.pane_id,  # pylint: disable=no-member
            "color": histogram_series.color,
            "base": histogram_series.base,
        },
    )


if __name__ == "__main__":
    main()
