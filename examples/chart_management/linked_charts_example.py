"""
Linked Charts Example

This example demonstrates how to create and use linked charts with
synchronization features. It shows how to create multiple charts
that are synchronized for crosshair and time range interactions.
"""

import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from streamlit_lightweight_charts_pro import (
    Chart, LineSeries, CandlestickSeries, HistogramSeries,
    ChartManager, SingleValueData, OhlcvData
)


def generate_sample_data():
    """Generate sample financial data for demonstration."""
    # Generate dates
    start_date = datetime(2024, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(100)]
    
    # Generate price data
    np.random.seed(42)
    base_price = 100
    price_changes = np.random.normal(0, 2, 100)
    prices = [base_price]
    
    for change in price_changes[1:]:
        prices.append(prices[-1] + change)
    
    # Generate OHLCV data
    ohlcv_data = []
    for i, (date, close) in enumerate(zip(dates, prices)):
        high = close + abs(np.random.normal(0, 1))
        low = close - abs(np.random.normal(0, 1))
        open_price = prices[i-1] if i > 0 else close
        volume = np.random.randint(1000, 10000)
        
        ohlcv_data.append(OhlcvData(
            time=date.strftime("%Y-%m-%d"),
            open=round(open_price, 2),
            high=round(high, 2),
            low=round(low, 2),
            close=round(close, 2),
            volume=volume
        ))
    
    # Generate volume data
    volume_data = [SingleValueData(date.strftime("%Y-%m-%d"), vol) 
                   for date, vol in zip(dates, [d.volume for d in ohlcv_data])]
    
    # Generate RSI-like indicator data
    rsi_data = []
    for i, price in enumerate(prices):
        if i < 14:
            rsi = 50  # Default RSI value
        else:
            # Simple RSI calculation
            gains = [max(0, prices[j] - prices[j-1]) for j in range(i-13, i+1)]
            losses = [max(0, prices[j-1] - prices[j]) for j in range(i-13, i+1)]
            avg_gain = sum(gains) / 14
            avg_loss = sum(losses) / 14
            if avg_loss == 0:
                rsi = 100
            else:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
        
        rsi_data.append(SingleValueData(
            dates[i].strftime("%Y-%m-%d"),
            round(rsi, 2)
        ))
    
    return ohlcv_data, volume_data, rsi_data


def main():
    """Main function to demonstrate linked charts."""
    st.title("Linked Charts Example")
    st.markdown("""
    This example demonstrates linked charts with synchronization features.
    Try interacting with one chart and see how the others respond!
    """)
    
    # Generate sample data
    ohlcv_data, volume_data, rsi_data = generate_sample_data()
    
    # Create individual charts
    st.subheader("Individual Charts (Not Linked)")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("**Price Chart**")
        price_chart = Chart(series=CandlestickSeries(ohlcv_data))
        price_chart.update_options(height=300)
        price_chart.render(key="individual_price")
    
    with col2:
        st.write("**Volume Chart**")
        volume_chart = Chart(series=HistogramSeries(volume_data))
        volume_chart.update_options(height=300)
        volume_chart.render(key="individual_volume")
    
    st.subheader("Linked Charts (Synchronized)")
    
    # Create linked charts
    chart_manager = ChartManager()
    
    # Add price chart
    price_chart_linked = Chart(series=CandlestickSeries(ohlcv_data))
    price_chart_linked.update_options(height=300)
    chart_manager.add_chart(price_chart_linked, chart_id="price")
    
    # Add volume chart
    volume_chart_linked = Chart(series=HistogramSeries(volume_data))
    volume_chart_linked.update_options(height=200)
    chart_manager.add_chart(volume_chart_linked, chart_id="volume")
    
    # Add RSI chart
    rsi_chart_linked = Chart(series=LineSeries(rsi_data))
    rsi_chart_linked.update_options(height=200)
    chart_manager.add_chart(rsi_chart_linked, chart_id="rsi")
    
    # Configure synchronization
    sync_options = st.selectbox(
        "Synchronization Options",
        ["All Sync", "Crosshair Only", "Time Range Only", "No Sync"],
        index=0
    )
    
    if sync_options == "All Sync":
        chart_manager.enable_all_sync()
    elif sync_options == "Crosshair Only":
        chart_manager.enable_crosshair_sync()
    elif sync_options == "Time Range Only":
        chart_manager.enable_time_range_sync()
    else:
        chart_manager.disable_all_sync()
    
    # Render linked charts
    chart_manager.render(key="linked_charts")
    
    st.markdown("""
    ### Features Demonstrated:
    
    1. **Multiple Chart Types**: Candlestick, Histogram, and Line charts
    2. **Synchronization**: Crosshair and time range synchronization
    3. **Flexible Configuration**: Different sync options
    4. **Method Chaining**: Fluent API for easy configuration
    
    ### How to Use:
    
    - **Hover** over any chart to see crosshair synchronization
    - **Zoom/Pan** on any chart to see time range synchronization
    - **Change sync options** to see different behaviors
    - **Compare** with individual charts above to see the difference
    """)


if __name__ == "__main__":
    main()
