#!/usr/bin/env python3

import pandas as pd
import streamlit as st
import numpy as np

from streamlit_lightweight_charts_pro import (
    LineSeries,
    Chart,
    ChartOptions,
    LegendOptions,
)
from streamlit_lightweight_charts_pro.data import LineData

st.set_page_config(page_title="Legend Stacking Test", page_icon="📊", layout="wide")

st.title("📊 Legend Stacking Test")
st.markdown("Testing multiple legends on the same pane to see if they stack correctly.")

# Generate simple test data
np.random.seed(42)
dates = pd.date_range(start="2024-01-01", periods=50, freq="D")
base_values = 100 + np.cumsum(np.random.normal(0, 2, len(dates)))
line1_values = base_values + np.random.normal(0, 5, len(dates))
line2_values = base_values + np.random.normal(0, 3, len(dates))
line3_values = base_values + np.random.normal(0, 4, len(dates))

# Create line data
line1_data = [LineData(time=date.strftime("%Y-%m-%d"), value=value)
              for date, value in zip(dates, line1_values)]
line2_data = [LineData(time=date.strftime("%Y-%m-%d"), value=value)
              for date, value in zip(dates, line2_values)]
line3_data = [LineData(time=date.strftime("%Y-%m-%d"), value=value)
              for date, value in zip(dates, line3_values)]

# Create chart with 3 lines ALL ON THE SAME PANE (pane 0) with legends
chart = Chart(
    options=ChartOptions(
        width=800,
        height=400,
    ),
    series=[
        # All three series on the same pane (pane_id=0 by default)
        LineSeries(data=line1_data, pane_id=0),
        LineSeries(data=line2_data, pane_id=0),
        LineSeries(data=line3_data, pane_id=0),
    ],
)

# Set titles and colors
chart.series[0].title = "Line 1"
chart.series[1].title = "Line 2"
chart.series[2].title = "Line 3"

# Set legends for each series - all in top-right corner of pane 0
chart.series[0].legend = LegendOptions(
    visible=True,
    position="top-right",
    text="<div style='color: #2196f3; font-weight: bold;'>Line 1: TEST_123</div>",
)

chart.series[1].legend = LegendOptions(
    visible=True,
    position="top-right",
    text="<div style='color: #ff9800; font-weight: bold;'>Line 2: $$value$$</div>",
)

chart.series[2].legend = LegendOptions(
    visible=True,
    position="top-right",
    text="<div style='color: #4caf50; font-weight: bold;'>Line 3: STATIC_VALUE</div>",
)

# Set colors
chart.series[0].line_options.color = "#2196f3"
chart.series[1].line_options.color = "#ff9800"
chart.series[2].line_options.color = "#4caf50"

st.subheader("Chart with 3 Legends on Same Pane")
st.markdown("All three legends should stack vertically in the top-right corner. If they overlap, there's a stacking issue.")

# Render the chart
chart.render(key="legend_stacking_test")

st.markdown("### Expected Result")
st.markdown("""
The three legends should appear stacked vertically in the top-right corner:
- Line 1: [value] (blue)
- Line 2: [value] (orange)
- Line 3: [value] (green)

They should NOT overlap each other.
""")