"""
Interactive Area Chart Example.

This example demonstrates interactive features of AreaSeries including
dynamic data filtering, user controls, and real-time updates.
"""

import os

# Add project root to path for examples imports
import sys

import numpy as np
import pandas as pd
import streamlit as st

from examples.utilities.data_samples import get_multi_area_data_1, get_multi_area_data_2
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.options import LineOptions
from streamlit_lightweight_charts_pro.charts.series import AreaSeries
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    LineStyle,
    MarkerPosition,
    MarkerShape,
)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


def create_dynamic_data(base_data, trend_factor=1.0, noise_factor=1.0):
    """Create dynamic data with adjustable parameters."""
    dynamic_data = []
    for i, point in enumerate(base_data):
        # Add trend and noise based on factors
        new_value = point.value * trend_factor + np.random.normal(0, noise_factor)
        dynamic_data.append(type(point)(time=point.time, value=new_value))
    return dynamic_data


def main():
    """Demonstrate interactive AreaSeries features."""
    st.title("Interactive Area Chart Example")
    st.write("This example demonstrates interactive features and dynamic controls.")

    # Get base data
    base_data_1 = get_multi_area_data_1()
    base_data_2 = get_multi_area_data_2()

    # Sidebar controls
    st.sidebar.header("Chart Controls")

    # Data selection
    st.sidebar.subheader("Data Selection")
    show_data_1 = st.sidebar.checkbox("Show Dataset 1", value=True)
    show_data_2 = st.sidebar.checkbox("Show Dataset 2", value=True)

    # Dynamic data parameters
    st.sidebar.subheader("Dynamic Parameters")
    trend_factor_1 = st.sidebar.slider("Dataset 1 Trend Factor", 0.5, 2.0, 1.0, 0.1)
    noise_factor_1 = st.sidebar.slider("Dataset 1 Noise Factor", 0.0, 5.0, 1.0, 0.1)

    trend_factor_2 = st.sidebar.slider("Dataset 2 Trend Factor", 0.5, 2.0, 1.0, 0.1)
    noise_factor_2 = st.sidebar.slider("Dataset 2 Noise Factor", 0.0, 5.0, 1.0, 0.1)

    # Styling controls
    st.sidebar.subheader("Styling Options")
    color_1 = st.sidebar.color_picker("Dataset 1 Color", "#4ecdc4")
    color_2 = st.sidebar.color_picker("Dataset 2 Color", "#ff6b6b")

    line_width = st.sidebar.slider("Line Width", 1, 5, 2)
    transparency = st.sidebar.slider("Transparency", 0.1, 1.0, 0.2, 0.1)

    # Chart type selection
    chart_type = st.sidebar.selectbox("Chart Type", ["Separate Panes", "Overlay", "Comparison"])

    # Create dynamic data
    dynamic_data_1 = create_dynamic_data(base_data_1, trend_factor_1, noise_factor_1)
    dynamic_data_2 = create_dynamic_data(base_data_2, trend_factor_2, noise_factor_2)

    # Main chart area
    st.subheader("Interactive Area Chart")

    if chart_type == "Separate Panes":
        st.write("**Separate Panes Mode**: Each dataset in its own pane")

        chart = Chart()

        if show_data_1:
            area1 = AreaSeries(
                data=dynamic_data_1,
                pane_id=0,
                top_color=color_1,
                bottom_color=(
                    f"rgba({int(color_1[1:3], 16)}, {int(color_1[3:5], 16)},"
                    f" {int(color_1[5:7], 16)}, {transparency})"
                ),
                line_options=LineOptions(color=color_1, line_width=line_width),
            )
            chart.add_series(area1)

        if show_data_2:
            area2 = AreaSeries(
                data=dynamic_data_2,
                pane_id=1 if show_data_1 else 0,
                top_color=color_2,
                bottom_color=(
                    f"rgba({int(color_2[1:3], 16)}, {int(color_2[3:5], 16)},"
                    f" {int(color_2[5:7], 16)}, {transparency})"
                ),
                line_options=LineOptions(color=color_2, line_width=line_width),
            )
            chart.add_series(area2)

        chart.render(key="separate_panes_interactive")

    elif chart_type == "Overlay":
        st.write("**Overlay Mode**: Both datasets on the same pane with transparency")

        chart = Chart()

        if show_data_1:
            area1 = AreaSeries(
                data=dynamic_data_1,
                top_color=color_1,
                bottom_color=(
                    f"rgba({int(color_1[1:3], 16)}, {int(color_1[3:5], 16)},"
                    f" {int(color_1[5:7], 16)}, {transparency})"
                ),
                line_options=LineOptions(color=color_1, line_width=line_width),
            )
            chart.add_series(area1)

        if show_data_2:
            area2 = AreaSeries(
                data=dynamic_data_2,
                top_color=(
                    f"rgba({int(color_2[1:3], 16)}, {int(color_2[3:5], 16)},"
                    f" {int(color_2[5:7], 16)}, {transparency + 0.2})"
                ),
                bottom_color=(
                    f"rgba({int(color_2[1:3], 16)}, {int(color_2[3:5], 16)},"
                    f" {int(color_2[5:7], 16)}, {transparency * 0.5})"
                ),
                line_options=LineOptions(
                    color=(
                        f"rgba({int(color_2[1:3], 16)}, {int(color_2[3:5], 16)},"
                        f" {int(color_2[5:7], 16)}, 0.8)"
                    ),
                    line_width=line_width - 1,
                    line_style=LineStyle.DOTTED,
                ),
            )
            chart.add_series(area2)

        chart.render(key="overlay_interactive")

    else:  # Comparison
        st.write("**Comparison Mode**: Side-by-side comparison with annotations")

        chart = Chart()

        if show_data_1:
            area1 = AreaSeries(
                data=dynamic_data_1,
                top_color=color_1,
                bottom_color=(
                    f"rgba({int(color_1[1:3], 16)}, {int(color_1[3:5], 16)},"
                    f" {int(color_1[5:7], 16)}, {transparency})"
                ),
                line_options=LineOptions(color=color_1, line_width=line_width),
            )

            # Add markers to first area
            if len(dynamic_data_1) > 5:
                area1.add_marker(
                    time=dynamic_data_1[5].time,
                    position=MarkerPosition.ABOVE_BAR,
                    color="#e74c3c",
                    shape=MarkerShape.CIRCLE,
                    text="Peak 1",
                    size=10,
                )

            chart.add_series(area1)

        if show_data_2:
            area2 = AreaSeries(
                data=dynamic_data_2,
                top_color=color_2,
                bottom_color=(
                    f"rgba({int(color_2[1:3], 16)}, {int(color_2[3:5], 16)},"
                    f" {int(color_2[5:7], 16)}, {transparency})"
                ),
                line_options=LineOptions(color=color_2, line_width=line_width),
            )

            # Add markers to second area
            if len(dynamic_data_2) > 8:
                area2.add_marker(
                    time=dynamic_data_2[8].time,
                    position=MarkerPosition.ABOVE_BAR,
                    color="#f39c12",
                    shape=MarkerShape.TRIANGLE,
                    text="Peak 2",
                    size=10,
                )

            chart.add_series(area2)

        chart.render(key="comparison_interactive")

    # Data statistics
    st.subheader("Data Statistics")

    col1, col2 = st.columns(2)

    with col1:
        if show_data_1:
            st.write("**Dataset 1 Statistics:**")
            values1 = [point.value for point in dynamic_data_1]
            st.write(f"Data points: {len(values1)}")
            st.write(f"Min value: {min(values1):.2f}")
            st.write(f"Max value: {max(values1):.2f}")
            st.write(f"Average: {sum(values1) / len(values1):.2f}")
            st.write(f"Trend factor: {trend_factor_1}")
            st.write(f"Noise factor: {noise_factor_1}")

    with col2:
        if show_data_2:
            st.write("**Dataset 2 Statistics:**")
            values2 = [point.value for point in dynamic_data_2]
            st.write(f"Data points: {len(values2)}")
            st.write(f"Min value: {min(values2):.2f}")
            st.write(f"Max value: {max(values2):.2f}")
            st.write(f"Average: {sum(values2) / len(values2):.2f}")
            st.write(f"Trend factor: {trend_factor_2}")
            st.write(f"Noise factor: {noise_factor_2}")

    # Real-time updates simulation
    st.subheader("Real-time Updates")

    if st.button("Generate New Data"):
        st.rerun()

    # Auto-refresh option
    auto_refresh = st.checkbox("Auto-refresh every 5 seconds")
    if auto_refresh:
        st.write("🔄 Auto-refresh enabled - data will update automatically")
        # time.sleep(5) # This line was commented out in the original file, so it's commented out here.
        st.rerun()

    # Data export
    st.subheader("Data Export")

    if st.button("Export Current Data"):
        if show_data_1:
            df1 = pd.DataFrame(
                [
                    {"time": point.time, "value": point.value, "dataset": "Dataset 1"}
                    for point in dynamic_data_1
                ]
            )

        if show_data_2:
            df2 = pd.DataFrame(
                [
                    {"time": point.time, "value": point.value, "dataset": "Dataset 2"}
                    for point in dynamic_data_2
                ]
            )

        if show_data_1 and show_data_2:
            combined_df = pd.concat([df1, df2], ignore_index=True)
        elif show_data_1:
            combined_df = df1
        elif show_data_2:
            combined_df = df2
        else:
            combined_df = pd.DataFrame()

        if not combined_df.empty:
            csv = combined_df.to_csv(index=False)
            st.download_button(
                label="Download CSV", data=csv, file_name="area_chart_data.csv", mime="text/csv"
            )

    # Show current settings
    st.subheader("Current Settings")
    settings = {
        "Chart Type": chart_type,
        "Dataset 1 Visible": show_data_1,
        "Dataset 2 Visible": show_data_2,
        "Dataset 1 Color": color_1,
        "Dataset 2 Color": color_2,
        "Line Width": line_width,
        "Transparency": transparency,
        "Auto-refresh": auto_refresh,
    }

    for key, value in settings.items():
        st.write(f"**{key}**: {value}")

    # Interactive features summary
    st.subheader("Interactive Features Demonstrated")
    st.write(
        """
    - **Dynamic Data Generation**: Real-time data modification with trend and noise factors
    - **User Controls**: Sidebar controls for all chart parameters
    - **Multiple Chart Types**: Separate panes, overlay, and comparison modes
    - **Real-time Updates**: Auto-refresh and manual data regeneration
    - **Data Export**: CSV export functionality
    - **Color Customization**: Dynamic color picker for both datasets
    - **Styling Controls**: Adjustable line width and transparency
    - **Data Statistics**: Real-time calculation and display of data metrics
    """
    )


if __name__ == "__main__":
    main()
