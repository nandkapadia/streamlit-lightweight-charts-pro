#!/usr/bin/env python3
"""Multi-Pane Charts Example

This example demonstrates how to create multi-pane charts with different series types.
Learn about pane management, layout options, and combining different chart types.

What you'll learn:
- Creating multiple panes in one chart
- Different series types in separate panes
- Pane height management
- Layout and positioning options
"""

import sys
from pathlib import Path

import streamlit as st
from streamlit_lightweight_charts_pro.charts.options import ChartOptions, LineOptions
from streamlit_lightweight_charts_pro.charts.options.layout_options import (
    LayoutOptions,
    PaneHeightOptions,
)
from streamlit_lightweight_charts_pro.charts.series import AreaSeries, LineSeries

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.data import AreaData, LineData

# Add project root to path for examples imports
sys.path.insert(0, str(Path(__file__).parent.parent))


# Page configuration
st.set_page_config(
    page_title="Multi-Pane Charts",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)


def create_sample_data():
    """Create sample data for the examples."""
    # Price data
    price_data = [
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
    ]

    # Volume data (as area)
    volume_data = [
        AreaData(time="2024-01-01", value=1000),
        AreaData(time="2024-01-02", value=1200),
        AreaData(time="2024-01-03", value=800),
        AreaData(time="2024-01-04", value=1500),
        AreaData(time="2024-01-05", value=1100),
        AreaData(time="2024-01-06", value=1300),
        AreaData(time="2024-01-07", value=1400),
        AreaData(time="2024-01-08", value=900),
        AreaData(time="2024-01-09", value=1600),
        AreaData(time="2024-01-10", value=1200),
    ]

    # Moving average data
    ma_data = [
        LineData(time="2024-01-01", value=100.0),
        LineData(time="2024-01-02", value=101.25),
        LineData(time="2024-01-03", value=100.4),
        LineData(time="2024-01-04", value=101.6),
        LineData(time="2024-01-05", value=102.04),
        LineData(time="2024-01-06", value=103.05),
        LineData(time="2024-01-07", value=104.14),
        LineData(time="2024-01-08", value=104.56),
        LineData(time="2024-01-09", value=105.45),
        LineData(time="2024-01-10", value=106.12),
    ]

    return price_data, volume_data, ma_data


def main():
    """Demonstrate multi-pane chart capabilities."""
    st.title("📊 Multi-Pane Charts")
    st.markdown("Learn how to create professional multi-pane charts with different series types.")

    # Get sample data
    price_data, volume_data, ma_data = create_sample_data()

    # Sidebar controls
    st.sidebar.header("🎛️ Chart Configuration")

    # Pane configuration
    st.sidebar.subheader("Pane Setup")
    show_price_pane = st.sidebar.checkbox("Show Price Pane", True)
    show_volume_pane = st.sidebar.checkbox("Show Volume Pane", True)
    show_ma_pane = st.sidebar.checkbox("Show Moving Average Pane", False)

    # Pane heights
    st.sidebar.subheader("Pane Heights")
    price_height = st.sidebar.slider("Price Pane Height", 200, 800, 400)
    volume_height = st.sidebar.slider("Volume Pane Height", 100, 400, 150)
    ma_height = st.sidebar.slider("MA Pane Height", 100, 400, 150)

    # Layout options
    st.sidebar.subheader("Layout Options")
    pane_spacing = st.sidebar.slider("Pane Spacing", 0, 20, 5)
    show_pane_borders = st.sidebar.checkbox("Show Pane Borders", True)

    # Create layout options
    layout_options = LayoutOptions(
        pane_heights=[
            PaneHeightOptions(height=price_height, min_height=200, max_height=800),
            PaneHeightOptions(height=volume_height, min_height=100, max_height=400),
            PaneHeightOptions(height=ma_height, min_height=100, max_height=400),
        ],
        pane_spacing=pane_spacing,
        show_pane_borders=show_pane_borders,
    )

    # Create chart options
    chart_options = ChartOptions(
        layout=layout_options,
        grid={
            "vert_lines": {"color": "#e6e6e6"},
            "horz_lines": {"color": "#e6e6e6"},
        },
        crosshair={"mode": 1},
    )

    # Create chart
    chart = Chart(options=chart_options)

    # Add price series (Pane 0)
    if show_price_pane:
        price_series = LineSeries(data=price_data, pane_id=0)
        price_series.line_options = LineOptions(
            color="#2196F3",
            line_width=2,
            crosshair_marker_visible=True,
            crosshair_marker_radius=6,
            crosshair_marker_border_color="#2196F3",
            crosshair_marker_background_color="#ffffff",
            crosshair_marker_border_width=2,
        )
        chart.add_series(price_series)

    # Add moving average series (Pane 0 or 2)
    if show_ma_pane:
        ma_series = LineSeries(
            data=ma_data,
            pane_id=2 if show_price_pane and show_volume_pane else 0,
        )
        ma_series.line_options = LineOptions(
            color="#FF9800",
            line_width=1,
            line_style=1,  # DASHED
            crosshair_marker_visible=True,
            crosshair_marker_radius=4,
            crosshair_marker_border_color="#FF9800",
            crosshair_marker_background_color="#ffffff",
            crosshair_marker_border_width=1,
        )
        chart.add_series(ma_series)

    # Add volume series (Pane 1)
    if show_volume_pane:
        volume_series = AreaSeries(
            data=volume_data,
            pane_id=1 if show_price_pane else 0,
            top_color="rgba(33, 150, 243, 0.3)",
            bottom_color="rgba(33, 150, 243, 0.1)",
        )
        volume_series.line_options = LineOptions(
            color="#2196F3",
            line_width=1,
            crosshair_marker_visible=True,
            crosshair_marker_radius=4,
            crosshair_marker_border_color="#2196F3",
            crosshair_marker_background_color="#ffffff",
            crosshair_marker_border_width=1,
        )
        chart.add_series(volume_series)

    # Display chart
    st.subheader("📊 Multi-Pane Chart")
    chart.render(key="multi_pane_chart")

    # Show pane information
    st.subheader("📋 Pane Information")

    col1, col2, col3 = st.columns(3)

    with col1:
        if show_price_pane:
            st.markdown("**Price Pane (Pane 0)**")
            st.write(f"• Height: {price_height}px")
            st.write("• Series: Price Line")
            st.write("• Color: Blue (#2196F3)")
            st.write(f"• Data points: {len(price_data)}")

    with col2:
        if show_volume_pane:
            st.markdown("**Volume Pane (Pane 1)**")
            st.write(f"• Height: {volume_height}px")
            st.write("• Series: Volume Area")
            st.write("• Color: Blue with transparency")
            st.write(f"• Data points: {len(volume_data)}")

    with col3:
        if show_ma_pane:
            st.markdown("**Moving Average Pane (Pane 2)**")
            st.write(f"• Height: {ma_height}px")
            st.write("• Series: MA Line (Dashed)")
            st.write("• Color: Orange (#FF9800)")
            st.write(f"• Data points: {len(ma_data)}")

    # Show the code
    st.subheader("💻 The Code")
    st.markdown("Here's how to create a multi-pane chart:")

    st.code(
        """
# Create layout options with pane heights
layout_options = LayoutOptions(
    pane_heights=[
        PaneHeightOptions(height=400, min_height=200, max_height=800),
        PaneHeightOptions(height=150, min_height=100, max_height=400),
    ],
    pane_spacing=5,
    show_pane_borders=True,
)

# Create chart with layout options
chart = Chart(options=ChartOptions(layout=layout_options))

# Add series to different panes
price_series = LineSeries(data=price_data, pane_id=0)
volume_series = AreaSeries(data=volume_data, pane_id=1)

chart.add_series(price_series)
chart.add_series(volume_series)

chart.render(key="multi_pane_chart")
""",
        language="python",
    )

    # Key concepts
    st.subheader("🔑 Key Concepts")
    st.markdown(
        """
    **Pane Management:**
    - Each pane is identified by a `pane_id` (0, 1, 2, ...)
    - Panes are stacked vertically
    - Each pane can have different heights and properties

    **Series Types:**
    - LineSeries: For price data, indicators
    - AreaSeries: For volume, filled areas
    - CandlestickSeries: For OHLC data
    - BarSeries: For volume bars

    **Layout Options:**
    - `pane_heights`: Control individual pane heights
    - `pane_spacing`: Space between panes
    - `show_pane_borders`: Visual separation
    - `min_height`/`max_height`: Height constraints
    """,
    )

    # Best practices
    st.subheader("💡 Best Practices")
    st.markdown(
        """
    **Pane Organization:**
    - Price data typically goes in the top pane
    - Volume/indicators in lower panes
    - Related data in adjacent panes

    **Height Management:**
    - Price pane: 60-70% of total height
    - Volume pane: 20-30% of total height
    - Indicator panes: 10-20% each

    **Visual Consistency:**
    - Use consistent colors across panes
    - Align time scales
    - Maintain proper spacing
    """,
    )

    # Next steps
    st.subheader("➡️ Next Steps")
    st.markdown(
        """
    Ready for more advanced features?

    - **[Interactive Features](interactive_features.py)** - Tooltips and legends
    - **[Real-Time Updates](real_time_updates.py)** - Dynamic data updates
    - **[Financial Dashboard](../trading_features/financial_dashboard.py)** - Complete trading setup
    """,
    )


if __name__ == "__main__":
    main()
