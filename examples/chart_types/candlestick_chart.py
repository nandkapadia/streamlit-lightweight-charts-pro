#!/usr/bin/env python3
"""
Candlestick Chart Example

This example demonstrates how to create professional candlestick charts for financial data.
Learn about OHLC data, candlestick styling, and financial chart features.

What you'll learn:
- Creating candlestick charts from OHLC data
- Customizing candlestick colors and styles
- Adding volume data
- Financial chart best practices
"""

import os
import sys

import streamlit as st

# Add project root to path for examples imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import CandlestickSeries, HistogramSeries
from streamlit_lightweight_charts_pro.data import CandlestickData, HistogramData

# Page configuration
st.set_page_config(
    page_title="Candlestick Chart",
    page_icon="🕯️",
    layout="wide",
    initial_sidebar_state="expanded"
)

def create_sample_data():
    """Create sample OHLC data for the candlestick chart."""
    # Sample OHLC data (simplified for demonstration)
    candlestick_data = [
        CandlestickData(time="2024-01-01", open=100.0, high=102.5, low=99.5, close=101.2),
        CandlestickData(time="2024-01-02", open=101.2, high=103.8, low=100.8, close=102.1),
        CandlestickData(time="2024-01-03", open=102.1, high=102.9, low=98.7, close=99.3),
        CandlestickData(time="2024-01-04", open=99.3, high=105.2, low=98.1, close=104.8),
        CandlestickData(time="2024-01-05", open=104.8, high=106.1, low=103.2, close=103.8),
        CandlestickData(time="2024-01-06", open=103.8, high=107.1, low=102.9, close=106.5),
        CandlestickData(time="2024-01-07", open=106.5, high=109.5, low=105.8, close=108.2),
        CandlestickData(time="2024-01-08", open=108.2, high=109.1, low=106.3, close=107.9),
        CandlestickData(time="2024-01-09", open=107.9, high=111.2, low=107.1, close=110.5),
        CandlestickData(time="2024-01-10", open=110.5, high=111.8, low=108.7, close=109.3),
        CandlestickData(time="2024-01-11", open=109.3, high=115.4, low=108.9, close=114.2),
        CandlestickData(time="2024-01-12", open=114.2, high=115.1, low=112.8, close=113.5),
        CandlestickData(time="2024-01-13", open=113.5, high=118.6, low=112.9, close=117.8),
        CandlestickData(time="2024-01-14", open=117.8, high=120.1, low=116.5, close=119.3),
        CandlestickData(time="2024-01-15", open=119.3, high=120.8, low=117.3, close=118.1),
    ]
    
    # Sample volume data
    volume_data = [
        HistogramData(time="2024-01-01", value=1000, color="#26a69a"),
        HistogramData(time="2024-01-02", value=1200, color="#26a69a"),
        HistogramData(time="2024-01-03", value=800, color="#ef5350"),
        HistogramData(time="2024-01-04", value=1500, color="#26a69a"),
        HistogramData(time="2024-01-05", value=1100, color="#26a69a"),
        HistogramData(time="2024-01-06", value=1300, color="#26a69a"),
        HistogramData(time="2024-01-07", value=1400, color="#26a69a"),
        HistogramData(time="2024-01-08", value=900, color="#ef5350"),
        HistogramData(time="2024-01-09", value=1600, color="#26a69a"),
        HistogramData(time="2024-01-10", value=1200, color="#26a69a"),
        HistogramData(time="2024-01-11", value=1800, color="#26a69a"),
        HistogramData(time="2024-01-12", value=1000, color="#ef5350"),
        HistogramData(time="2024-01-13", value=1700, color="#26a69a"),
        HistogramData(time="2024-01-14", value=1900, color="#26a69a"),
        HistogramData(time="2024-01-15", value=1300, color="#26a69a"),
    ]
    
    return candlestick_data, volume_data

def main():
    """Create and display a comprehensive candlestick chart."""
    st.title("🕯️ Candlestick Chart")
    st.markdown("Professional candlestick chart for financial data with volume analysis.")
    
    # Get sample data
    candlestick_data, volume_data = create_sample_data()
    
    # Sidebar controls
    st.sidebar.header("🎛️ Chart Controls")
    
    # Candlestick styling
    st.sidebar.subheader("Candlestick Styling")
    up_color = st.sidebar.color_picker("Up Color", "#26a69a")
    down_color = st.sidebar.color_picker("Down Color", "#ef5350")
    border_up_color = st.sidebar.color_picker("Up Border", "#26a69a")
    border_down_color = st.sidebar.color_picker("Down Border", "#ef5350")
    
    # Volume styling
    st.sidebar.subheader("Volume Styling")
    show_volume = st.sidebar.checkbox("Show Volume", True)
    volume_up_color = st.sidebar.color_picker("Volume Up Color", "#26a69a")
    volume_down_color = st.sidebar.color_picker("Volume Down Color", "#ef5350")
    
    # Layout options
    st.sidebar.subheader("Layout")
    volume_height = st.sidebar.slider("Volume Pane Height", 100, 300, 150)
    
    # Create candlestick series
    candlestick_series = CandlestickSeries(
        data=candlestick_data,
        up_color=up_color,
        down_color=down_color,
        border_up_color=border_up_color,
        border_down_color=border_down_color,
        wick_up_color=border_up_color,
        wick_down_color=border_down_color,
    )
    
    # Create chart
    chart = Chart(series=candlestick_series)
    
    # Add volume series if enabled
    if show_volume:
        # Update volume colors based on price direction
        for i, vol_data in enumerate(volume_data):
            if i < len(candlestick_data):
                candle = candlestick_data[i]
                if candle.close >= candle.open:
                    vol_data.color = volume_up_color
                else:
                    vol_data.color = volume_down_color
        
        volume_series = HistogramSeries(
            data=volume_data,
            pane_id=1,
            price_scale_id="volume",
        )
        chart.add_series(volume_series)
    
    # Display the chart
    st.subheader("📊 Candlestick Chart")
    chart.render(key="candlestick_chart")
    
    # Chart statistics
    st.subheader("📊 Chart Statistics")
    
    # Calculate statistics
    total_candles = len(candlestick_data)
    up_candles = sum(1 for c in candlestick_data if c.close >= c.open)
    down_candles = total_candles - up_candles
    
    high_price = max(c.high for c in candlestick_data)
    low_price = min(c.low for c in candlestick_data)
    price_range = high_price - low_price
    
    total_volume = sum(v.value for v in volume_data)
    avg_volume = total_volume / len(volume_data)
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Candles", total_candles)
    with col2:
        st.metric("Up/Down Ratio", f"{up_candles}/{down_candles}")
    with col3:
        st.metric("Price Range", f"${price_range:.2f}")
    with col4:
        st.metric("Avg Volume", f"{avg_volume:,.0f}")
    
    # OHLC data table
    st.subheader("📋 OHLC Data")
    
    # Convert to DataFrame for display
    import pandas as pd
    
    df_data = []
    for i, candle in enumerate(candlestick_data):
        df_data.append({
            "Date": candle.time,
            "Open": f"${candle.open:.2f}",
            "High": f"${candle.high:.2f}",
            "Low": f"${candle.low:.2f}",
            "Close": f"${candle.close:.2f}",
            "Change": f"{candle.close - candle.open:+.2f}",
            "Volume": f"{volume_data[i].value:,}" if i < len(volume_data) else "N/A"
        })
    
    df = pd.DataFrame(df_data)
    st.dataframe(df, use_container_width=True)
    
    # Show the code
    st.subheader("💻 The Code")
    st.markdown("Here's how to create a candlestick chart:")
    
    st.code("""
# Create candlestick data
candlestick_data = [
    CandlestickData(time="2024-01-01", open=100.0, high=102.5, low=99.5, close=101.2),
    CandlestickData(time="2024-01-02", open=101.2, high=103.8, low=100.8, close=102.1),
    # ... more data
]

# Create volume data
volume_data = [
    HistogramData(time="2024-01-01", value=1000, color="#26a69a"),
    HistogramData(time="2024-01-02", value=1200, color="#26a69a"),
    # ... more data
]

# Create candlestick series
candlestick_series = CandlestickSeries(
    data=candlestick_data,
    up_color="#26a69a",
    down_color="#ef5350",
    border_up_color="#26a69a",
    border_down_color="#ef5350",
)

# Create volume series
volume_series = HistogramSeries(
    data=volume_data,
    pane_id=1,
    price_scale_id="volume",
)

# Create chart
chart = Chart(series=candlestick_series)
chart.add_series(volume_series)
chart.render(key="candlestick_chart")
""", language="python")
    
    # Key concepts
    st.subheader("🔑 Key Concepts")
    st.markdown("""
    **Candlestick Charts:**
    - **OHLC Data**: Open, High, Low, Close prices for each period
    - **Up/Down Colors**: Different colors for bullish/bearish candles
    - **Volume**: Trading volume shown in separate pane
    - **Time Series**: Financial data over time
    
    **Best Practices:**
    - Use green for up candles, red for down candles
    - Show volume in separate pane below price
    - Maintain consistent time intervals
    - Use appropriate color schemes for readability
    """)
    
    # Next steps
    st.subheader("➡️ Next Steps")
    st.markdown("""
    Explore more chart types:
    
    - **[Area Chart](area_chart.py)** - Filled area charts
    - **[Bar Chart](bar_chart.py)** - Volume and OHLC bars
    - **[Line Chart](line_chart.py)** - Simple line charts
    - **[Financial Dashboard](../trading_features/financial_dashboard.py)** - Complete trading setup
    """)

if __name__ == "__main__":
    main()
