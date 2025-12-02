"""Line Chart with Price Lines Example.

This example demonstrates a line chart with price lines.
Price lines are horizontal lines that can be used to highlight
specific price levels or support/resistance levels.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from lightweight_charts_core.charts.options import LineOptions
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.type_definitions.enums import LineStyle

from examples.utilities.data_samples import get_line_data
from streamlit_lightweight_charts_pro import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


# Page configuration
st.set_page_config(page_title="Line Chart with Price Lines", page_icon="📈", layout="wide")

st.title("📈 Line Chart with Price Lines")
st.markdown("A line chart with horizontal price lines to highlight key levels.")

# Get sample data
line_data = get_line_data()

# Calculate some meaningful price levels
min_price = min(d.value for d in line_data)
max_price = max(d.value for d in line_data)
avg_price = sum(d.value for d in line_data) / len(line_data)

# Create price line options
support_line = PriceLineOptions(
    price=min_price,
    color="#26a69a",
    line_width=2,
    line_style=LineStyle.DASHED,
    axis_label_color="#26a69a",
    axis_label_text_color="#ffffff",
    title="Support Level",
)

resistance_line = PriceLineOptions(
    price=max_price,
    color="#ef5350",
    line_width=2,
    line_style=LineStyle.DASHED,
    axis_label_color="#ef5350",
    axis_label_text_color="#ffffff",
    title="Resistance Level",
)

average_line = PriceLineOptions(
    price=avg_price,
    color="#ff9800",
    line_width=1,
    line_style=LineStyle.SOLID,
    axis_label_color="#ff9800",
    axis_label_text_color="#ffffff",
    title="Average Price",
)

# Create line series with price lines
line_options = LineOptions()
line_series = (
    LineSeries(data=line_data, line_options=line_options)
    .add_price_line(support_line)
    .add_price_line(resistance_line)
    .add_price_line(average_line)
)

# Create chart
chart = Chart(series=line_series)

# Display the chart
st.subheader("Chart with Price Lines")
chart.render(key="line_chart_with_price_lines")

# Display price line information
st.subheader("Price Lines Information")
col1, col2, col3 = st.columns(3)

with col1:
    st.metric(label="Support Level", value=f"${min_price:.2f}", delta=None)

with col2:
    st.metric(label="Average Price", value=f"${avg_price:.2f}", delta=None)

with col3:
    st.metric(label="Resistance Level", value=f"${max_price:.2f}", delta=None)

# Show price line details
st.subheader("Price Line Details")
price_lines_info = [
    {
        "Level": "Support",
        "Price": f"${min_price:.2f}",
        "Color": "Green",
        "Style": "Dashed",
        "Purpose": "Highlight lowest price level",
    },
    {
        "Level": "Average",
        "Price": f"${avg_price:.2f}",
        "Color": "Orange",
        "Style": "Solid",
        "Purpose": "Show mean price level",
    },
    {
        "Level": "Resistance",
        "Price": f"${max_price:.2f}",
        "Color": "Red",
        "Style": "Dashed",
        "Purpose": "Highlight highest price level",
    },
]

st.dataframe(price_lines_info, use_container_width=True)

# Display data info
st.subheader("Data Information")
st.write(f"Number of data points: {len(line_data)}")
st.write(f"Date range: {line_data[0].time} to {line_data[-1].time}")

st.markdown("---")
st.markdown("**Features demonstrated:**")
st.markdown("- Line chart with price lines")
st.markdown("- Multiple price line types (support, resistance, average)")
st.markdown("- Custom styling for price lines (colors, styles, labels)")
st.markdown("- Method chaining for adding price lines")
st.markdown("- Price line options and customization")
