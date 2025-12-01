"""Line Chart with Markers Example.

This example demonstrates a line chart with markers.
Markers are visual indicators that can be placed on specific
data points to highlight events, signals, or important moments.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from streamlit_lightweight_charts_pro.charts.options import LineOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data.marker import BarMarker
from streamlit_lightweight_charts_pro.type_definitions.enums import MarkerPosition, MarkerShape

from examples.utilities.data_samples import get_line_data
from streamlit_lightweight_charts_pro import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


# Page configuration
st.set_page_config(page_title="Line Chart with Markers", page_icon="📈", layout="wide")

st.title("📈 Line Chart with Markers")
st.markdown("A line chart with markers to highlight important data points and events.")

# Get sample data
line_data = get_line_data()

# Find interesting points for markers
min_point = min(line_data, key=lambda x: x.value)
max_point = max(line_data, key=lambda x: x.value)

# Calculate average for trend analysis
avg_value = sum(d.value for d in line_data) / len(line_data)

# Find points above and below average
above_avg_points = [d for d in line_data if d.value > avg_value]
below_avg_points = [d for d in line_data if d.value < avg_value]

# Create markers for different events
markers = []

# Minimum point marker (support level)
markers.append(
    BarMarker(
        time=min_point.time,
        position=MarkerPosition.BELOW_BAR,
        color="#26a69a",
        shape=MarkerShape.ARROW_UP,
        text="Support Level",
        size=12,
    ),
)

# Maximum point marker (resistance level)
markers.append(
    BarMarker(
        time=max_point.time,
        position=MarkerPosition.ABOVE_BAR,
        color="#ef5350",
        shape=MarkerShape.ARROW_DOWN,
        text="Resistance Level",
        size=12,
    ),
)

# First significant above-average point
if above_avg_points:
    first_above = above_avg_points[0]
    markers.append(
        BarMarker(
            time=first_above.time,
            position=MarkerPosition.ABOVE_BAR,
            color="#4caf50",
            shape=MarkerShape.CIRCLE,
            text="Above Average",
            size=10,
        ),
    )

# First significant below-average point
if below_avg_points:
    first_below = below_avg_points[0]
    markers.append(
        BarMarker(
            time=first_below.time,
            position=MarkerPosition.BELOW_BAR,
            color="#ff9800",
            shape=MarkerShape.CIRCLE,
            text="Below Average",
            size=10,
        ),
    )

# Add a trend change marker (simplified - using middle point)
mid_point = line_data[len(line_data) // 2]
markers.append(
    BarMarker(
        time=mid_point.time,
        position=MarkerPosition.IN_BAR,
        color="#9c27b0",
        shape=MarkerShape.SQUARE,
        text="Trend Change",
        size=8,
    ),
)

# Create line series with markers
line_options = LineOptions()
line_series = LineSeries(data=line_data).add_line_options(line_options).add_markers(markers)

# Create chart
chart = Chart(series=line_series)

# Display the chart
st.subheader("Chart with Markers")
chart.render(key="line_chart_with_markers")

# Display marker information
st.subheader("Markers Information")
col1, col2 = st.columns(2)

with col1:
    st.markdown("**Marker Details:**")
    for i, marker in enumerate(markers, 1):
        st.write(f"{i}. **{marker.text}** - {marker.time}")
        st.write(f"   Position: {marker.position.value}")
        st.write(f"   Shape: {marker.shape.value}")
        st.write(f"   Color: {marker.color}")
        st.write("---")

with col2:
    st.markdown("**Data Analysis:**")
    st.metric("Minimum Value", f"${min_point.value:.2f}", f"at {min_point.time}")
    st.metric("Maximum Value", f"${max_point.value:.2f}", f"at {max_point.time}")
    st.metric("Average Value", f"${avg_value:.2f}")
    st.metric("Data Points", len(line_data))

# Show marker types explanation
st.subheader("Marker Types and Usage")
marker_info = [
    {
        "Type": "Support Level",
        "Shape": "Arrow Up",
        "Position": "Below Bar",
        "Color": "Green",
        "Purpose": "Highlight lowest price point",
    },
    {
        "Type": "Resistance Level",
        "Shape": "Arrow Down",
        "Position": "Above Bar",
        "Color": "Red",
        "Purpose": "Highlight highest price point",
    },
    {
        "Type": "Above Average",
        "Shape": "Circle",
        "Position": "Above Bar",
        "Color": "Green",
        "Purpose": "Mark first point above average",
    },
    {
        "Type": "Below Average",
        "Shape": "Circle",
        "Position": "Below Bar",
        "Color": "Orange",
        "Purpose": "Mark first point below average",
    },
    {
        "Type": "Trend Change",
        "Shape": "Square",
        "Position": "In Bar",
        "Color": "Purple",
        "Purpose": "Indicate potential trend change",
    },
]

st.dataframe(marker_info, use_container_width=True)

# Display data info
st.subheader("Data Information")
st.write(f"Number of data points: {len(line_data)}")
st.write(f"Date range: {line_data[0].time} to {line_data[-1].time}")

st.markdown("---")
st.markdown("**Features demonstrated:**")
st.markdown("- Line chart with markers")
st.markdown("- Different marker shapes (arrows, circles, squares)")
st.markdown("- Different marker positions (above, below, in bar)")
st.markdown("- Custom marker colors and text labels")
st.markdown("- Method chaining for adding markers")
st.markdown("- Event-based marker placement")
