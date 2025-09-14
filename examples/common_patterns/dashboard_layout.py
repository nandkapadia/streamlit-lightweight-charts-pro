#!/usr/bin/env python3
"""
Common Pattern: Multi-Chart Dashboard Layout

This example shows how to create a professional dashboard layout with multiple charts.
Perfect for financial dashboards, analytics tools, or monitoring applications.

What you'll learn:
- How to create multi-chart layouts
- Chart positioning and sizing
- Consistent styling across charts
- Dashboard organization patterns
"""

import streamlit as st
import pandas as pd
import numpy as np
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries, CandlestickSeries, HistogramSeries
from streamlit_lightweight_charts_pro.data import LineData, CandlestickData, HistogramData

# Page configuration
st.set_page_config(
    page_title="Dashboard Layout Pattern",
    page_icon="📊",
    layout="wide"
)

st.title("📊 Common Pattern: Multi-Chart Dashboard")

st.markdown("""
This example demonstrates how to create a professional dashboard layout with multiple charts.
Perfect for financial dashboards, analytics tools, or monitoring applications.
""")

# Generate sample data
@st.cache_data
def generate_dashboard_data():
    """Generate sample data for all charts."""
    dates = pd.date_range(start="2024-01-01", periods=100, freq="D")
    
    # Price data
    base_price = 100
    prices = []
    volumes = []
    
    for i, date in enumerate(dates):
        # Price movement
        change = np.random.normal(0, 2)
        base_price += change
        prices.append(max(base_price, 50))
        
        # Volume data
        volume = np.random.uniform(1000, 10000)
        volumes.append(volume)
    
    # Create OHLC data
    candlestick_data = []
    for i, (date, price) in enumerate(zip(dates, prices)):
        open_price = price + np.random.normal(0, 1)
        close_price = price + np.random.normal(0, 1)
        high_price = max(open_price, close_price) + np.random.uniform(0, 2)
        low_price = min(open_price, close_price) - np.random.uniform(0, 2)
        
        candlestick_data.append(CandlestickData(
            time=date,
            open=round(open_price, 2),
            high=round(high_price, 2),
            low=round(low_price, 2),
            close=round(close_price, 2)
        ))
    
    # Create line data for indicators
    line_data = [LineData(time=date, value=price) for date, price in zip(dates, prices)]
    
    # Create volume data
    volume_data = [HistogramData(time=date, value=vol) for date, vol in zip(dates, volumes)]
    
    return candlestick_data, line_data, volume_data

# Generate data
candlestick_data, line_data, volume_data = generate_dashboard_data()

# Dashboard header
st.header("📈 Trading Dashboard")
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Current Price", f"${line_data[-1].value:.2f}", "+2.5%")
with col2:
    st.metric("Volume", f"{volume_data[-1].value:,.0f}", "+15%")
with col3:
    st.metric("24h Change", "+$2.50", "+2.5%")

# Main chart area
st.subheader("📊 Price Chart")
main_chart = Chart()
main_chart.add_series(CandlestickSeries(data=candlestick_data))
main_chart.update_options(width=1200, height=400)
main_chart.render(key="main_chart")

# Secondary charts in columns
st.subheader("📊 Additional Metrics")

col1, col2 = st.columns(2)

with col1:
    st.markdown("**Volume**")
    volume_chart = Chart()
    volume_chart.add_series(HistogramSeries(data=volume_data))
    volume_chart.update_options(width=600, height=200)
    volume_chart.render(key="volume_chart")

with col2:
    st.markdown("**Price Trend**")
    trend_chart = Chart()
    trend_chart.add_series(LineSeries(data=line_data))
    trend_chart.update_options(width=600, height=200)
    trend_chart.render(key="trend_chart")

# Bottom section with multiple small charts
st.subheader("📊 Technical Indicators")

# Create 4 small charts in a 2x2 grid
col1, col2 = st.columns(2)

with col1:
    st.markdown("**Moving Average**")
    ma_chart = Chart()
    ma_chart.add_series(LineSeries(data=line_data))
    ma_chart.update_options(width=600, height=150)
    ma_chart.render(key="ma_chart")

with col2:
    st.markdown("**RSI**")
    rsi_chart = Chart()
    rsi_chart.add_series(LineSeries(data=line_data))
    rsi_chart.update_options(width=600, height=150)
    rsi_chart.render(key="rsi_chart")

col3, col4 = st.columns(2)

with col3:
    st.markdown("**MACD**")
    macd_chart = Chart()
    macd_chart.add_series(LineSeries(data=line_data))
    macd_chart.update_options(width=600, height=150)
    macd_chart.render(key="macd_chart")

with col4:
    st.markdown("**Bollinger Bands**")
    bb_chart = Chart()
    bb_chart.add_series(LineSeries(data=line_data))
    bb_chart.update_options(width=600, height=150)
    bb_chart.render(key="bb_chart")

# Code examples
st.subheader("💻 Code Examples")

with st.expander("📊 Dashboard Layout Code"):
    st.code("""
# Dashboard layout pattern
st.title("📊 Trading Dashboard")

# Header metrics
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Current Price", "$102.50", "+2.5%")

# Main chart (full width)
main_chart = Chart()
main_chart.add_series(CandlestickSeries(data=candlestick_data))
main_chart.update_options(width=1200, height=400)
main_chart.render(key="main_chart")

# Secondary charts (side by side)
col1, col2 = st.columns(2)
with col1:
    volume_chart = Chart()
    volume_chart.add_series(HistogramSeries(data=volume_data))
    volume_chart.update_options(width=600, height=200)
    volume_chart.render(key="volume_chart")
    """, language="python")

with st.expander("🎨 Consistent Styling"):
    st.code("""
# Consistent chart styling function
def create_chart(series_data, width=600, height=200):
    chart = Chart()
    chart.add_series(series_data)
    chart.update_options(
        width=width,
        height=height,
        background_color="#ffffff",
        grid_color="#f0f0f0"
    )
    return chart

# Use for all charts
main_chart = create_chart(CandlestickSeries(data=candlestick_data), 1200, 400)
volume_chart = create_chart(HistogramSeries(data=volume_data), 600, 200)
    """, language="python")

with st.expander("📱 Responsive Layout"):
    st.code("""
# Responsive chart sizing
def get_chart_size():
    if st.session_state.get('is_mobile', False):
        return 350, 200  # Mobile
    else:
        return 600, 300  # Desktop

width, height = get_chart_size()
chart.update_options(width=width, height=height)
    """, language="python")

st.subheader("💡 Best Practices")

st.markdown("""
**Dashboard Layout Best Practices:**

1. **Hierarchy**: Main chart at top, supporting charts below
2. **Consistency**: Use consistent colors and styling across all charts
3. **Spacing**: Use Streamlit columns for proper spacing
4. **Responsiveness**: Consider different screen sizes
5. **Performance**: Cache data generation for better performance
6. **Clarity**: Clear titles and labels for each chart section
""")

st.subheader("🔧 Customization Options")

col1, col2 = st.columns(2)

with col1:
    st.markdown("**Layout Options:**")
    st.markdown("- Single column (narrow)")
    st.markdown("- Two columns (balanced)")
    st.markdown("- Three columns (wide)")
    st.markdown("- Mixed layouts")

with col2:
    st.markdown("**Chart Sizes:**")
    st.markdown("- Full width (1200px)")
    st.markdown("- Half width (600px)")
    st.markdown("- Quarter width (300px)")
    st.markdown("- Custom sizes")

st.subheader("📚 Next Steps")
st.markdown("""
- **[Chart Positioning Example](../chart_management/chart_positioning_example.py)** - Advanced positioning
- **[Linked Charts Example](../getting_started/simple_linked_charts_demo.py)** - Synchronized charts
- **[Multi-Pane Layout Example](../getting_started/pane_heights_example.py)** - Multi-pane charts
""")

# Footer
st.markdown("---")
st.markdown("💡 **Tip**: Use `st.columns()` to create professional dashboard layouts with proper spacing")
