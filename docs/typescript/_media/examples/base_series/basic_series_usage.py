"""Basic Series Usage Example

This example demonstrates the fundamental Series functionality that all series types share.
It shows data handling, visibility control, price scale configuration, and basic operations.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import LineSeries

from examples.utilities.data_samples import get_line_data
from streamlit_lightweight_charts_pro.charts import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate basic Series functionality."""
    st.title("Basic Series Usage")
    st.write(
        "This example shows the fundamental Series functionality that all series types share."
    )

    # Get sample data
    data = get_line_data()

    st.header("1. Basic Series Creation")
    st.write("Create a series with data and basic configuration:")

    # Basic series creation
    series = LineSeries(data=data, visible=True, price_scale_id="right", pane_id=0)

    chart = Chart(series=series)
    chart.render(key="chart")

    st.header("2. Series Visibility Control")
    st.write("Control series visibility:")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Visible Series")
        visible_series = LineSeries(data=data, visible=True)
        visible_chart = Chart(series=visible_series)
        visible_chart.render(key="chart")

    with col2:
        st.subheader("Hidden Series")
        hidden_series = LineSeries(data=data, visible=False)
        hidden_chart = Chart(series=hidden_series)
        hidden_chart.render(key="chart")

    st.header("3. Price Scale Configuration")
    st.write("Configure different price scales:")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Right Price Scale")
        right_scale_series = LineSeries(data=data, price_scale_id="right")
        right_chart = Chart(series=right_scale_series)
        right_chart.render(key="chart")

    with col2:
        st.subheader("Left Price Scale")
        left_scale_series = LineSeries(data=data, price_scale_id="left")
        left_chart = Chart(series=left_scale_series)
        left_chart.render(key="chart")

    st.header("4. Series Properties")
    st.write("Access and modify series properties:")

    # Create series and demonstrate properties
    series = LineSeries(data=data)

    st.write("**Series Properties:**")
    st.write(f"- Visible: {series.visible}")  # pylint: disable=no-member
    st.write(f"- Price Scale ID: {series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"- Pane ID: {series.pane_id}")  # pylint: disable=no-member
    st.write(f"- Data Points: {len(series.data)}")

    # Method chaining example
    st.write("**Method Chaining:**")
    chained_series = LineSeries(data=data).set_visible(True)

    chart = Chart(series=chained_series)
    chart.render(key="chart")

    st.header("5. Data Access")
    st.write("Access series data and configuration:")

    series = LineSeries(data=data)

    st.write("**Data Dictionary (for frontend):**")
    data_dict = series.data_dict
    st.write(f"Number of data points: {len(data_dict)}")
    st.write(f"First data point: {data_dict[0] if data_dict else 'No data'}")

    st.write("**Series Configuration (to_dict):**")
    config = series.asdict()
    st.write(f"Configuration keys: {list(config.keys())}")
    st.write(f"Options keys: {list(config.get('options', {}).keys())}")


if __name__ == "__main__":
    main()
