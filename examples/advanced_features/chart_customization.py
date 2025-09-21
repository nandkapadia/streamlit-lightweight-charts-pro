#!/usr/bin/env python3
"""
Chart Customization Example

This example demonstrates how to customize charts with colors, styles, and options.
Learn about line options, chart options, and visual styling.

What you'll learn:
- Customizing line colors and styles
- Chart layout and appearance options
- Price lines and markers
- Professional styling techniques
"""

import os
import sys

import streamlit as st

# Add project root to path for examples imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
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
    page_title="Chart Customization",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="expanded"
)

def create_sample_data():
    """Create sample data for the examples."""
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
    ]

def main():
    """Demonstrate chart customization options."""
    st.title("🎨 Chart Customization")
    st.markdown("Learn how to customize your charts with colors, styles, and professional options.")
    
    # Get sample data
    data = create_sample_data()
    
    # Sidebar controls
    st.sidebar.header("🎛️ Customization Controls")
    
    # Color selection
    st.sidebar.subheader("Colors")
    line_color = st.sidebar.color_picker("Line Color", "#2196F3")
    background_color = st.sidebar.color_picker("Background Color", "#FFFFFF")
    text_color = st.sidebar.color_picker("Text Color", "#333333")
    
    # Line styling
    st.sidebar.subheader("Line Styling")
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
    
    # Chart options
    st.sidebar.subheader("Chart Options")
    show_grid = st.sidebar.checkbox("Show Grid", True)
    show_crosshair = st.sidebar.checkbox("Show Crosshair", True)
    show_time_scale = st.sidebar.checkbox("Show Time Scale", True)
    show_price_scale = st.sidebar.checkbox("Show Price Scale", True)
    
    # Advanced features
    st.sidebar.subheader("Advanced Features")
    show_price_lines = st.sidebar.checkbox("Show Price Lines", False)
    show_markers = st.sidebar.checkbox("Show Markers", False)
    
    # Create line options
    line_options = LineOptions(
        color=line_color,
        line_width=line_width,
        line_style=line_style_map[line_style],
        crosshair_marker_visible=True,
        crosshair_marker_radius=6,
        crosshair_marker_border_color=line_color,
        crosshair_marker_background_color="#ffffff",
        crosshair_marker_border_width=2,
    )
    
    # Create chart options
    chart_options = ChartOptions(
        layout=dict(
            background=dict(type="solid", color=background_color),
            text_color=text_color,
        ),
        grid=dict(
            vert_lines=dict(color="#e6e6e6" if show_grid else "transparent"),
            horz_lines=dict(color="#e6e6e6" if show_grid else "transparent"),
        ),
        crosshair=dict(mode=1 if show_crosshair else 0),
        right_price_scale=dict(border_color="#cccccc" if show_price_scale else "transparent"),
        time_scale=dict(
            border_color="#cccccc" if show_time_scale else "transparent",
            time_visible=show_time_scale,
        ),
    )
    
    # Create line series
    line_series = LineSeries(data=data)
    line_series.line_options = line_options
    
    # Add price lines if enabled
    if show_price_lines:
        min_price = min(d.value for d in data)
        max_price = max(d.value for d in data)
        avg_price = sum(d.value for d in data) / len(data)
        
        support_line = PriceLineOptions(
            price=min_price,
            color="#26a69a",
            line_width=2,
            line_style=LineStyle.DASHED,
            title="Support"
        )
        
        resistance_line = PriceLineOptions(
            price=max_price,
            color="#ef5350",
            line_width=2,
            line_style=LineStyle.DASHED,
            title="Resistance"
        )
        
        avg_line = PriceLineOptions(
            price=avg_price,
            color="#ff9800",
            line_width=1,
            line_style=LineStyle.DOTTED,
            title="Average"
        )
        
        line_series.add_price_line(support_line)
        line_series.add_price_line(resistance_line)
        line_series.add_price_line(avg_line)
    
    # Add markers if enabled
    if show_markers:
        # Find key points
        min_point = min(data, key=lambda x: x.value)
        max_point = max(data, key=lambda x: x.value)
        mid_point = data[len(data) // 2]
        
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
        
        line_series.add_markers([support_marker, resistance_marker])
    
    # Create and display chart
    chart = Chart(series=line_series, options=chart_options)
    
    st.subheader("🎨 Your Customized Chart")
    chart.render(key="customized_chart")
    
    # Show the code
    st.subheader("💻 The Code")
    st.markdown("Here's the code that creates your customized chart:")
    
    st.code(f"""
# Create line options
line_options = LineOptions(
    color="{line_color}",
    line_width={line_width},
    line_style=LineStyle.{line_style.upper()},
    crosshair_marker_visible=True,
    crosshair_marker_radius=6,
    crosshair_marker_border_color="{line_color}",
    crosshair_marker_background_color="#ffffff",
    crosshair_marker_border_width=2,
)

# Create chart options
chart_options = ChartOptions(
    layout=dict(
        background=dict(type="solid", color="{background_color}"),
        text_color="{text_color}",
    ),
    grid=dict(
        vert_lines=dict(color="#e6e6e6" if {str(show_grid).lower()} else "transparent"),
        horz_lines=dict(color="#e6e6e6" if {str(show_grid).lower()} else "transparent"),
    ),
    crosshair=dict(mode=1 if {str(show_crosshair).lower()} else 0),
    right_price_scale=dict(border_color="#cccccc" if {str(show_price_scale).lower()} else "transparent"),
    time_scale=dict(
        border_color="#cccccc" if {str(show_time_scale).lower()} else "transparent",
        time_visible={str(show_time_scale).lower()},
    ),
)

# Create series and chart
line_series = LineSeries(data=data, line_options=line_options)
chart = Chart(series=line_series, options=chart_options)
chart.render(key="my_chart")
""", language="python")
    
    # Feature explanations
    st.subheader("🔍 Feature Explanations")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        **Line Options:**
        - `color`: Line color (hex, RGB, or named colors)
        - `line_width`: Thickness of the line (1-5)
        - `line_style`: SOLID, DASHED, or DOTTED
        - `crosshair_marker_visible`: Show marker on hover
        - `crosshair_marker_radius`: Size of hover marker
        
        **Price Lines:**
        - Horizontal reference lines
        - Support, resistance, or average levels
        - Custom colors and styles
        - Optional labels
        """)
    
    with col2:
        st.markdown("""
        **Chart Options:**
        - `background`: Chart background color
        - `text_color`: Text color for labels
        - `grid`: Grid line visibility and color
        - `crosshair`: Crosshair behavior
        - `time_scale`: Time axis appearance
        - `right_price_scale`: Price axis appearance
        
        **Markers:**
        - Event markers on specific data points
        - Different shapes and positions
        - Custom text labels
        - Color coding
        """)
    
    # Professional styling tips
    st.subheader("💡 Professional Styling Tips")
    st.markdown("""
    **Color Schemes:**
    - Use consistent color palettes
    - High contrast for accessibility
    - Consider colorblind-friendly options
    
    **Line Styling:**
    - Thicker lines for emphasis
    - Dashed lines for reference levels
    - Dotted lines for averages
    
    **Layout:**
    - Clean backgrounds (white/light gray)
    - Subtle grid lines
    - Clear, readable fonts
    - Proper spacing and margins
    """)
    
    # Next steps
    st.subheader("➡️ Next Steps")
    st.markdown("""
    Ready for more advanced features?
    
    - **[Multi-Pane Charts](multi_pane_charts.py)** - Multiple charts in one view
    - **[Interactive Features](interactive_features.py)** - Tooltips and legends
    - **[Real-Time Updates](real_time_updates.py)** - Dynamic data updates
    """)

if __name__ == "__main__":
    main()
