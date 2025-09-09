"""
Chart Positioning Example

This example demonstrates how to position charts anywhere using ChartManager
with different layout approaches:

1. Side-by-side using Streamlit columns
2. Stacked vertically
3. Custom CSS positioning
4. Grid layout

The key point is that ChartManager provides the chart data and sync configuration,
but positioning is handled by the user's layout system.
"""

import streamlit as st
import numpy as np
from streamlit_lightweight_charts_pro.charts.chart_manager import ChartManager, SyncOptions
from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data.line_data import LineData

# Generate sample data
def generate_data(base_price=100, days=30):
    """Generate sample price data."""
    dates = np.arange('2024-01-01', f'2024-01-{days+1}', dtype='datetime64[D]')
    prices = np.random.randn(days).cumsum() + base_price
    return [LineData(time=str(d), value=float(p)) for d, p in zip(dates, prices)]

# Create sample series
price_data = generate_data(100, 30)
volume_data = generate_data(1000, 30)
rsi_data = generate_data(50, 30)

price_series = LineSeries(data=price_data).set_title("Price")
volume_series = LineSeries(data=volume_data).set_title("Volume")
rsi_series = LineSeries(data=rsi_data).set_title("RSI")

st.title("Chart Positioning Examples")
st.markdown("""
This example shows how to position charts anywhere using ChartManager.
The ChartManager handles chart data and synchronization, while positioning
is controlled by your layout system.
""")

# Example 1: Side-by-side using Streamlit columns
st.header("1. Side-by-Side Layout (Streamlit Columns)")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Price Chart")
    # Create chart manager for price charts
    price_manager = ChartManager()
    price_chart = Chart(series=[price_series], chart_group_id=1)
    price_manager.add_chart(price_chart, "price_chart")
    
    # Set sync config for price group
    price_manager.set_sync_group_config("1", SyncOptions(
        enabled=True, crosshair=True, time_range=True
    ))
    
    # Render the chart
    price_manager.render()

with col2:
    st.subheader("Volume Chart")
    # Create chart manager for volume charts
    volume_manager = ChartManager()
    volume_chart = Chart(series=[volume_series], chart_group_id=1)
    volume_manager.add_chart(volume_chart, "volume_chart")
    
    # Set sync config for volume group
    volume_manager.set_sync_group_config("1", SyncOptions(
        enabled=True, crosshair=True, time_range=True
    ))
    
    # Render the chart
    volume_manager.render()

# Example 1b: Using get_chart().render() method (NEW!)
st.header("1b. Side-by-Side Layout (Using get_chart().render())")

col1, col2 = st.columns(2)

# Create a single manager with multiple charts
manager = ChartManager()
chart1 = Chart(series=[price_series], chart_group_id=1)
chart2 = Chart(series=[volume_series], chart_group_id=1)

manager.add_chart(chart1, "chart1")
manager.add_chart(chart2, "chart2")

# Set sync config for the group
manager.set_sync_group_config("1", SyncOptions(
    enabled=True, crosshair=True, time_range=True
))

with col1:
    st.subheader("Price Chart")
    manager.render_chart("chart1")  # Render specific chart with sync config

with col2:
    st.subheader("Volume Chart")
    manager.render_chart("chart2")  # Render specific chart with sync config

# Example 2: Stacked vertically
st.header("2. Stacked Vertical Layout")

st.subheader("Price Chart")
# Create chart manager for stacked layout
stacked_manager = ChartManager()
price_chart2 = Chart(series=[price_series], chart_group_id=2)
volume_chart2 = Chart(series=[volume_series], chart_group_id=2)
rsi_chart2 = Chart(series=[rsi_series], chart_group_id=2)

stacked_manager.add_chart(price_chart2, "price_chart2")
stacked_manager.add_chart(volume_chart2, "volume_chart2")
stacked_manager.add_chart(rsi_chart2, "rsi_chart2")

# Set sync config for stacked group
stacked_manager.set_sync_group_config("2", SyncOptions(
    enabled=True, crosshair=True, time_range=True
))

# Render all charts in the manager
stacked_manager.render()

# Example 3: Custom CSS positioning
st.header("3. Custom CSS Positioning")

st.markdown("""
You can also use custom CSS to position charts. Here's an example using
Streamlit's `st.markdown` with custom CSS:
""")

# Custom CSS for positioning
st.markdown("""
<style>
.chart-container {
    display: flex;
    gap: 20px;
    margin: 20px 0;
}

.chart-item {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    background-color: #f9f9f9;
}
</style>
""", unsafe_allow_html=True)

# Create chart manager for custom positioning
custom_manager = ChartManager()
custom_price_chart = Chart(series=[price_series], chart_group_id=3)
custom_volume_chart = Chart(series=[volume_series], chart_group_id=3)

custom_manager.add_chart(custom_price_chart, "custom_price")
custom_manager.add_chart(custom_volume_chart, "custom_volume")

# Set sync config for custom group
custom_manager.set_sync_group_config("3", SyncOptions(
    enabled=True, crosshair=True, time_range=True
))

# Render with custom positioning
st.markdown('<div class="chart-container">', unsafe_allow_html=True)
st.markdown('<div class="chart-item">', unsafe_allow_html=True)
st.markdown("**Price Chart**")
custom_manager.render()
st.markdown('</div>', unsafe_allow_html=True)
st.markdown('</div>', unsafe_allow_html=True)

# Example 4: Grid layout
st.header("4. Grid Layout")

st.markdown("""
You can also use CSS Grid for more complex layouts:
""")

# CSS Grid example
st.markdown("""
<style>
.chart-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 20px;
    height: 600px;
}

.grid-item-1 { grid-area: 1 / 1 / 2 / 2; }
.grid-item-2 { grid-area: 1 / 2 / 3 / 3; }
.grid-item-3 { grid-area: 2 / 1 / 3 / 2; }

.grid-chart {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    background-color: #f9f9f9;
}
</style>
""", unsafe_allow_html=True)

# Create chart manager for grid layout
grid_manager = ChartManager()
grid_price_chart = Chart(series=[price_series], chart_group_id=4)
grid_volume_chart = Chart(series=[volume_series], chart_group_id=4)
grid_rsi_chart = Chart(series=[rsi_series], chart_group_id=4)

grid_manager.add_chart(grid_price_chart, "grid_price")
grid_manager.add_chart(grid_volume_chart, "grid_volume")
grid_manager.add_chart(grid_rsi_chart, "grid_rsi")

# Set sync config for grid group
grid_manager.set_sync_group_config("4", SyncOptions(
    enabled=True, crosshair=True, time_range=True
))

# Render with grid positioning
st.markdown('<div class="chart-grid">', unsafe_allow_html=True)

st.markdown('<div class="grid-item-1 grid-chart">', unsafe_allow_html=True)
st.markdown("**Price Chart (Main)**")
grid_manager.render()
st.markdown('</div>', unsafe_allow_html=True)

st.markdown('<div class="grid-item-2 grid-chart">', unsafe_allow_html=True)
st.markdown("**Volume Chart (Sidebar)**")
grid_manager.render()
st.markdown('</div>', unsafe_allow_html=True)

st.markdown('<div class="grid-item-3 grid-chart">', unsafe_allow_html=True)
st.markdown("**RSI Chart (Bottom)**")
grid_manager.render()
st.markdown('</div>', unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)

# Summary
st.header("Summary")
st.markdown("""
## Key Points:

1. **ChartManager handles data and sync**: The `ChartManager` provides chart data
   and synchronization configuration, but doesn't control positioning.

2. **Positioning is user-controlled**: You can position charts anywhere using:
   - Streamlit columns (`st.columns()`)
   - Custom CSS with `st.markdown()`
   - CSS Grid or Flexbox
   - HTML tables
   - Any other layout system

3. **Synchronization works across layouts**: Charts with the same `chart_group_id`
   will be synchronized regardless of their position on the page.

4. **Flexible sync configuration**: You can set different sync behaviors for
   different chart groups using `set_sync_group_config()`.

## Usage Pattern:
```python
# 1. Create charts with group IDs
chart1 = Chart(series=[series1], chart_group_id=1)
chart2 = Chart(series=[series2], chart_group_id=1)

# 2. Create manager and add charts
manager = ChartManager()
manager.add_chart(chart1, "chart1")
manager.add_chart(chart2, "chart2")

# 3. Set sync configuration
manager.set_sync_group_config("1", SyncOptions(
    enabled=True, crosshair=True, time_range=True
))

# 4. Position charts using your layout system
col1, col2 = st.columns(2)
with col1:
    manager.render_chart("chart1")  # Render specific chart with sync config
with col2:
    manager.render_chart("chart2")  # Render specific chart with sync config

# OR render all charts at once
manager.render()  # Renders all charts in the manager
```
""")
