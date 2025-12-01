"""Basic Area Chart Example.

This example demonstrates the fundamental usage of AreaSeries with sample data
from the data_samples module.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from examples.utilities.data_samples import get_dataframe_line_data, get_line_data

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import AreaSeries

sys.path.insert(0, str(Path(__file__).parent.parent))


def main():
    """Demonstrate basic AreaSeries functionality."""
    st.title("Basic Area Chart Example")
    st.write(
        "This example shows how to create a simple area chart using AreaSeries with sample data.",
    )

    # Get sample data
    area_data = get_line_data()
    df_data = get_dataframe_line_data()

    # Method 1: Using LineData objects (converted to AreaData)
    st.subheader("Method 1: Using LineData Objects")
    st.write("Creating AreaSeries from LineData objects:")

    area_series = AreaSeries(data=area_data)

    chart = Chart()
    chart.add_series(area_series)

    chart.render(key="basic_area_1")

    # Method 2: Using DataFrame
    st.subheader("Method 2: Using DataFrame")
    st.write("Creating AreaSeries from pandas DataFrame:")

    area_series_df = AreaSeries(data=df_data, column_mapping={"time": "datetime", "value": "value"})

    dataframe_chart = Chart()
    dataframe_chart.add_series(area_series_df)

    dataframe_chart.render(key="basic_area_2")

    # Show data info
    st.subheader("Data Information")
    st.write(f"Number of data points: {len(area_data)}")

    # Show first few data points
    st.write("First 5 data points:")
    st.dataframe(df_data.head())

    # Show series properties
    st.subheader("Series Properties")
    st.write(f"Chart type: {area_series.chart_type}")
    st.write(f"Visible: {area_series.visible}")  # pylint: disable=no-member
    st.write(f"Price scale ID: {area_series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"Pane ID: {area_series.pane_id}")  # pylint: disable=no-member

    # Show data statistics
    st.subheader("Data Statistics")
    values = [point.value for point in area_data]
    st.write(f"Minimum value: {min(values):.2f}")
    st.write(f"Maximum value: {max(values):.2f}")
    st.write(f"Average value: {sum(values) / len(values):.2f}")

    # Show the raw data
    st.subheader("Raw Data")
    st.dataframe(df_data)


if __name__ == "__main__":
    main()
