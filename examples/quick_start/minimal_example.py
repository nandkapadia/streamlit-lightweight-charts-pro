#!/usr/bin/env python3
"""Quick Start: Minimal Working Example

Copy this code and run it immediately!

This is the absolute minimum code needed to create a chart.
Perfect for testing your installation or as a starting point.

Usage:
    streamlit run minimal_example.py
"""

import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import LineData

# Create simple data
data = [
    LineData(time="2024-01-01", value=100),
    LineData(time="2024-01-02", value=105),
    LineData(time="2024-01-03", value=102),
    LineData(time="2024-01-04", value=108),
]

# Create and display chart
chart = Chart()
chart.add_series(LineSeries(data=data))
chart.render(key="minimal_chart")

# Optional: Add some info
st.info("🎉 Success! Your chart is working. Try modifying the data above.")
