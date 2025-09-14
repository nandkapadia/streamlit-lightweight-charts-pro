"""
Basic Line Chart Example.

This example demonstrates a simple line chart with basic styling.
The chart shows a single line series with default options.
"""

import os

# Add project root to path for examples imports
import sys

import streamlit as st

from examples.utilities.data_samples import get_line_data
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.options import LineOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


# Page configuration
st.set_page_config(page_title="Basic Line Chart", page_icon="📈", layout="wide")

st.title("📈 Basic Line Chart")
st.markdown("A simple line chart with default styling.")

# Get sample data
line_data = get_line_data()

# Create line series with default options
line_series = LineSeries(data=line_data)

# Create chart
chart = Chart(series=line_series)

# Display the chart
st.subheader("Chart")
chart.render(key="basic_line_chart")

# Display data info
st.subheader("Data Information")
st.write(f"Number of data points: {len(line_data)}")
st.write(f"Date range: {line_data[0].time} to {line_data[-1].time}")
st.write(
    f"Value range: {min(d.value for d in line_data):.2f} to {max(d.value for d in line_data):.2f}"
)

# Show data summary
st.subheader("Data Summary")
st.write(f"**Total data points:** {len(line_data)}")
st.write(f"**Time range:** {line_data[0].time} to {line_data[-1].time}")
st.write(
    f"**Value range:** {min(d.value for d in line_data):.2f} to"
    f" {max(d.value for d in line_data):.2f}"
)

st.markdown("---")
st.markdown("**Features demonstrated:**")
st.markdown("- Basic line chart creation")
st.markdown("- Default styling and colors")
st.markdown("- Time series data handling")
st.markdown("- Data validation and normalization")
