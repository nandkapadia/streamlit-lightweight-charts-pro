"""Advanced Line Chart Example.

This example demonstrates an advanced line chart with all features:
- Custom line styling
- Price lines
- Markers
- Method chaining
- Advanced options
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from streamlit_lightweight_charts_pro.charts.options import LineOptions
from streamlit_lightweight_charts_pro.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data.marker import BarMarker
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    LineStyle,
    MarkerPosition,
    MarkerShape,
)

from examples.utilities.data_samples import get_line_data
from streamlit_lightweight_charts_pro import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


# Page configuration
st.set_page_config(page_title="Advanced Line Chart", page_icon="📈", layout="wide")

st.title("📈 Advanced Line Chart")
st.markdown(
    "A comprehensive line chart demonstrating all available features and customization options.",
)

# Get sample data
line_data = get_line_data()

# Calculate key levels
min_price = min(d.value for d in line_data)
max_price = max(d.value for d in line_data)
avg_price = sum(d.value for d in line_data) / len(line_data)

# Find key data points
min_point = min(line_data, key=lambda x: x.value)
max_point = max(line_data, key=lambda x: x.value)
mid_point = line_data[len(line_data) // 2]

# Create custom line options
line_options = LineOptions(
    color="#2196F3",
    line_width=3,
    line_style=LineStyle.SOLID,
    crosshair_marker_visible=True,
    crosshair_marker_radius=6,
    crosshair_marker_border_color="#2196F3",
    crosshair_marker_background_color="#ffffff",
    crosshair_marker_border_width=2,
    point_markers_visible=True,
    point_markers_radius=4,
)

# Create price lines
support_line = PriceLineOptions(
    price=min_price,
    color="#26a69a",
    line_width=2,
    line_style=LineStyle.DASHED,
    axis_label_color="#26a69a",
    axis_label_text_color="#ffffff",
    title="Support",
)

resistance_line = PriceLineOptions(
    price=max_price,
    color="#ef5350",
    line_width=2,
    line_style=LineStyle.DASHED,
    axis_label_color="#ef5350",
    axis_label_text_color="#ffffff",
    title="Resistance",
)

avg_line = PriceLineOptions(
    price=avg_price,
    color="#ff9800",
    line_width=1,
    line_style=LineStyle.DOTTED,
    axis_label_color="#ff9800",
    axis_label_text_color="#ffffff",
    title="Average",
)

# Create markers
support_marker = BarMarker(
    time=min_point.time,
    position=MarkerPosition.BELOW_BAR,
    color="#26a69a",
    shape=MarkerShape.ARROW_UP,
    text="Support",
    size=12,
)

resistance_marker = BarMarker(
    time=max_point.time,
    position=MarkerPosition.ABOVE_BAR,
    color="#ef5350",
    shape=MarkerShape.ARROW_DOWN,
    text="Resistance",
    size=12,
)

trend_marker = BarMarker(
    time=mid_point.time,
    position=MarkerPosition.IN_BAR,
    color="#9c27b0",
    shape=MarkerShape.SQUARE,
    text="Trend Change",
    size=10,
)

# Create advanced line series with method chaining
line_series = (
    LineSeries(data=line_data, line_options=line_options)
    .add_price_line(support_line)
    .add_price_line(resistance_line)
    .add_price_line(avg_line)
    .add_markers([support_marker, resistance_marker, trend_marker])
)

# Create chart
chart = Chart(series=line_series)

# Display the chart
st.subheader("Advanced Line Chart")
chart.render(key="advanced_line_chart")

# Create tabs for different information sections
tab1, tab2, tab3, tab4 = st.tabs(["📊 Chart Info", "🎯 Price Lines", "📍 Markers", "⚙️ Options"])

with tab1:
    st.markdown("**Chart Overview:**")
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Data Points", len(line_data))
    with col2:
        st.metric("Price Range", f"${max_price - min_price:.2f}")
    with col3:
        st.metric("Average", f"${avg_price:.2f}")
    with col4:
        st.metric("Volatility", f"{((max_price - min_price) / avg_price * 100):.1f}%")

    st.markdown("**Data Summary:**")
    st.write(f"Date range: {line_data[0].time} to {line_data[-1].time}")
    st.write(f"Value range: ${min_price:.2f} to ${max_price:.2f}")

with tab2:
    st.markdown("**Price Lines Configuration:**")
    price_lines_data = [
        {
            "Level": "Support",
            "Price": f"${min_price:.2f}",
            "Style": "Dashed",
            "Color": "Green",
            "Purpose": "Lowest price level",
        },
        {
            "Level": "Average",
            "Price": f"${avg_price:.2f}",
            "Style": "Dotted",
            "Color": "Orange",
            "Purpose": "Mean price level",
        },
        {
            "Level": "Resistance",
            "Price": f"${max_price:.2f}",
            "Style": "Dashed",
            "Color": "Red",
            "Purpose": "Highest price level",
        },
    ]
    st.dataframe(price_lines_data, use_container_width=True)

with tab3:
    st.markdown("**Markers Configuration:**")
    markers_data = [
        {
            "Event": "Support Level",
            "Time": str(support_marker.time),
            "Position": str(support_marker.position.value),
            "Shape": str(support_marker.shape.value),
            "Color": str(support_marker.color),
        },
        {
            "Event": "Resistance Level",
            "Time": str(resistance_marker.time),
            "Position": str(resistance_marker.position.value),
            "Shape": str(resistance_marker.shape.value),
            "Color": str(resistance_marker.color),
        },
        {
            "Event": "Trend Change",
            "Time": str(trend_marker.time),
            "Position": str(trend_marker.position.value),
            "Shape": str(trend_marker.shape.value),
            "Color": str(trend_marker.color),
        },
    ]
    st.dataframe(markers_data, use_container_width=True)

with tab4:
    st.markdown("**Line Options Configuration:**")
    options_data = [
        {"Property": "Color", "Value": str(line_options.color)},
        {"Property": "Line Width", "Value": str(line_options.line_width)},
        {"Property": "Line Style", "Value": str(line_options.line_style.value)},
        {
            "Property": "Crosshair Marker",
            "Value": "Visible" if line_options.crosshair_marker_visible else "Hidden",
        },
        {
            "Property": "Point Markers",
            "Value": "Visible" if line_options.point_markers_visible else "Hidden",
        },
        {"Property": "Crosshair Radius", "Value": str(line_options.crosshair_marker_radius)},
        {"Property": "Point Radius", "Value": str(line_options.point_markers_radius)},
    ]
    st.dataframe(options_data, use_container_width=True)

# Show method chaining example
st.subheader("🔗 Method Chaining Example")
st.code(
    """
# Advanced method chaining example
line_series = (LineSeries(data=line_data, line_options=line_options)
               .add_price_line(support_line)
               .add_price_line(resistance_line)
               .add_price_line(avg_line)
               .add_markers([support_marker, resistance_marker, trend_marker]))
""",
    language="python",
)

# Show features summary
st.subheader("✨ Features Demonstrated")
col1, col2 = st.columns(2)

with col1:
    st.markdown("**Core Features:**")
    st.markdown("- ✅ Custom line styling")
    st.markdown("- ✅ Price lines with labels")
    st.markdown("- ✅ Multiple marker types")
    st.markdown("- ✅ Method chaining")
    st.markdown("- ✅ Advanced options")

with col2:
    st.markdown("**Advanced Features:**")
    st.markdown("- ✅ Crosshair markers")
    st.markdown("- ✅ Point markers")
    st.markdown("- ✅ Custom colors and styles")
    st.markdown("- ✅ Event-based markers")
    st.markdown("- ✅ Comprehensive customization")

st.markdown("---")
st.markdown(
    "**This example showcases the full power and flexibility of the line chart component with all"
    " available features and customization options.**",
)
