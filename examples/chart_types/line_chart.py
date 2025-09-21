#!/usr/bin/env python3
"""
Line Chart Example

This example demonstrates a comprehensive line chart with all available features.
Learn about line styling, price lines, markers, and advanced options.

What you'll learn:
- Basic line chart creation
- Custom line styling and colors
- Price lines for support/resistance
- Markers for key events
- Method chaining for advanced configuration
"""

import os
import sys

import streamlit as st

# Add project root to path for examples imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.options import LineOptions
from streamlit_lightweight_charts_pro.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import LineData, BarMarker
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    LineStyle,
    MarkerPosition,
    MarkerShape,
)

# Page configuration
st.set_page_config(
    page_title="Line Chart",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

def create_sample_data():
    """Create sample data for the line chart."""
    return [
        LineData(time="2024-01-01", value=100.0),
        LineData(time="2024-01-02", value=102.5),
        LineData(time="2024-01-03", value=98.7),
        LineData(time="2024-01-04", value=105.2),
        LineData(time="2024-01-05", value=103.8),
        LineData(time="2024-01-06", value=107.1),
        LineData(time="2024-01-07", value=109.5),
        LineData(time="2024-01-08", value=106.3),
        LineData(time="2024-01-09", value=111.2),
        LineData(time="2024-01-10", value=108.7),
        LineData(time="2024-01-11", value=115.4),
        LineData(time="2024-01-12", value=112.8),
        LineData(time="2024-01-13", value=118.6),
        LineData(time="2024-01-14", value=120.1),
        LineData(time="2024-01-15", value=117.3),
        LineData(time="2024-01-16", value=123.7),
        LineData(time="2024-01-17", value=121.2),
        LineData(time="2024-01-18", value=125.8),
        LineData(time="2024-01-19", value=128.4),
        LineData(time="2024-01-20", value=126.9),
    ]

def main():
    """Create and display a comprehensive line chart."""
    st.title("📈 Line Chart")
    st.markdown("A comprehensive line chart demonstrating all available features and customization options.")
    
    # Get sample data
    data = create_sample_data()
    
    # Calculate key levels
    min_price = min(d.value for d in data)
    max_price = max(d.value for d in data)
    avg_price = sum(d.value for d in data) / len(data)
    
    # Find key data points
    min_point = min(data, key=lambda x: x.value)
    max_point = max(data, key=lambda x: x.value)
    mid_point = data[len(data) // 2]
    
    # Sidebar controls
    st.sidebar.header("🎛️ Chart Controls")
    
    # Line styling
    st.sidebar.subheader("Line Styling")
    line_color = st.sidebar.color_picker("Line Color", "#2196F3")
    line_width = st.sidebar.slider("Line Width", 1, 5, 2)
    line_style = st.sidebar.selectbox(
        "Line Style",
        ["Solid", "Dashed", "Dotted"],
        index=0
    )
    
    line_style_map = {
        "Solid": LineStyle.SOLID,
        "Dashed": LineStyle.DASHED,
        "Dotted": LineStyle.DOTTED
    }
    
    # Features
    st.sidebar.subheader("Features")
    show_price_lines = st.sidebar.checkbox("Show Price Lines", True)
    show_markers = st.sidebar.checkbox("Show Markers", True)
    show_crosshair = st.sidebar.checkbox("Show Crosshair", True)
    
    # Create line options
    line_options = LineOptions(
        color=line_color,
        line_width=line_width,
        line_style=line_style_map[line_style],
        crosshair_marker_visible=show_crosshair,
        crosshair_marker_radius=6,
        crosshair_marker_border_color=line_color,
        crosshair_marker_background_color="#ffffff",
        crosshair_marker_border_width=2,
        point_markers_visible=False,
    )
    
    # Create line series with method chaining
    line_series = LineSeries(data=data)
    line_series.line_options = line_options
    
    # Add price lines if enabled
    if show_price_lines:
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
        
        line_series.add_price_line(support_line)
        line_series.add_price_line(resistance_line)
        line_series.add_price_line(avg_line)
    
    # Add markers if enabled
    if show_markers:
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
        
        line_series.add_markers([support_marker, resistance_marker, trend_marker])
    
    # Create chart
    chart = Chart(series=line_series)
    
    # Display the chart
    st.subheader("📊 Line Chart")
    chart.render(key="line_chart")
    
    # Chart statistics
    st.subheader("📊 Chart Statistics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Data Points", len(data))
    with col2:
        st.metric("Price Range", f"${max_price - min_price:.2f}")
    with col3:
        st.metric("Average", f"${avg_price:.2f}")
    with col4:
        st.metric("Volatility", f"{((max_price - min_price) / avg_price * 100):.1f}%")
    
    # Feature information
    st.subheader("🔍 Features Demonstrated")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**Core Features:**")
        st.markdown("- ✅ Custom line styling")
        st.markdown("- ✅ Price lines with labels")
        st.markdown("- ✅ Multiple marker types")
        st.markdown("- ✅ Method chaining")
        st.markdown("- ✅ Crosshair markers")
    
    with col2:
        st.markdown("**Advanced Features:**")
        st.markdown("- ✅ Dynamic color selection")
        st.markdown("- ✅ Interactive controls")
        st.markdown("- ✅ Event-based markers")
        st.markdown("- ✅ Professional styling")
        st.markdown("- ✅ Real-time updates")
    
    # Show the code
    st.subheader("💻 The Code")
    st.markdown("Here's the complete code for this line chart:")
    
    st.code("""
# Create line options
line_options = LineOptions(
    color="#2196F3",
    line_width=2,
    line_style=LineStyle.SOLID,
    crosshair_marker_visible=True,
    crosshair_marker_radius=6,
    crosshair_marker_border_color="#2196F3",
    crosshair_marker_background_color="#ffffff",
    crosshair_marker_border_width=2,
)

# Create price lines
support_line = PriceLineOptions(
    price=min_price,
    color="#26a69a",
    line_width=2,
    line_style=LineStyle.DASHED,
    title="Support",
)

resistance_line = PriceLineOptions(
    price=max_price,
    color="#ef5350",
    line_width=2,
    line_style=LineStyle.DASHED,
    title="Resistance",
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

# Create series with method chaining
line_series = (LineSeries(data=data, line_options=line_options)
              .add_price_line(support_line)
              .add_price_line(resistance_line)
              .add_markers([support_marker]))

# Create and render chart
chart = Chart(series=line_series)
chart.render(key="line_chart")
""", language="python")
    
    # Key concepts
    st.subheader("🔑 Key Concepts")
    st.markdown("""
    **Line Chart Features:**
    - **Line Options**: Control color, width, style, and crosshair behavior
    - **Price Lines**: Horizontal reference lines for support/resistance levels
    - **Markers**: Event markers for key data points
    - **Method Chaining**: Fluent API for easy configuration
    
    **Best Practices:**
    - Use consistent color schemes
    - Add price lines for important levels
    - Use markers sparingly for key events
    - Maintain good contrast for accessibility
    """)
    
    # Next steps
    st.subheader("➡️ Next Steps")
    st.markdown("""
    Explore other chart types:
    
    - **[Candlestick Chart](candlestick_chart.py)** - OHLC data visualization
    - **[Area Chart](area_chart.py)** - Filled area charts
    - **[Bar Chart](bar_chart.py)** - Volume and OHLC bars
    - **[Multi-Pane Charts](../advanced_features/multi_pane_charts.py)** - Multiple charts in one view
    """)

if __name__ == "__main__":
    main()
