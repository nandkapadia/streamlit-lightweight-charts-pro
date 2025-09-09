"""
Simple Linked Charts Demo

This example demonstrates the basic usage of linked charts with
synchronization features.
"""

import streamlit as st
from datetime import datetime, timedelta

from streamlit_lightweight_charts_pro import (
    Chart, LineSeries, CandlestickSeries, HistogramSeries,
    ChartManager, SingleValueData, OhlcvData
)


def generate_simple_data():
    """Generate simple sample data for demonstration."""
    # Generate dates
    dates = [datetime(2024, 1, 1) + timedelta(days=i) for i in range(30)]
    
    # Generate simple price data
    prices = [100 + i * 0.5 + (i % 3 - 1) * 2 for i in range(30)]
    
    # Generate OHLCV data
    ohlcv_data = []
    for i, (date, close) in enumerate(zip(dates, prices)):
        high = close + 1
        low = close - 1
        open_price = prices[i-1] if i > 0 else close
        volume = 1000 + i * 50
        
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
    
    # Generate simple indicator data (moving average)
    indicator_data = []
    for i, price in enumerate(prices):
        if i < 5:
            ma = price
        else:
            ma = sum(prices[i-4:i+1]) / 5
        indicator_data.append(SingleValueData(
            dates[i].strftime("%Y-%m-%d"),
            round(ma, 2)
        ))
    
    return ohlcv_data, volume_data, indicator_data


def main():
    """Main function to demonstrate linked charts."""
    st.title("Linked Charts Demo")
    st.markdown("""
    This demo shows how to create linked charts with synchronization.
    Try hovering over one chart and see how the crosshair appears on all charts!
    """)
    
    # Generate sample data
    ohlcv_data, volume_data, indicator_data = generate_simple_data()
    
    # Create individual charts (not linked)
    st.subheader("Individual Charts (Not Linked)")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("**Price Chart**")
        price_chart = Chart(series=CandlestickSeries(ohlcv_data))
        price_chart.update_options(height=250)
        price_chart.render(key="individual_price")
    
    with col2:
        st.write("**Volume Chart**")
        volume_chart = Chart(series=HistogramSeries(volume_data))
        volume_chart.update_options(height=250)
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
    
    # Add indicator chart
    indicator_chart_linked = Chart(series=LineSeries(indicator_data))
    indicator_chart_linked.update_options(height=200)
    chart_manager.add_chart(indicator_chart_linked, chart_id="indicator")
    
    # Configure synchronization
    sync_option = st.selectbox(
        "Choose synchronization mode:",
        ["All Sync", "Crosshair Only", "Time Range Only", "No Sync"],
        index=0
    )
    
    if sync_option == "All Sync":
        chart_manager.enable_all_sync()
    elif sync_option == "Crosshair Only":
        chart_manager.enable_crosshair_sync()
    elif sync_option == "Time Range Only":
        chart_manager.enable_time_range_sync()
    else:
        chart_manager.disable_all_sync()
    
    # Render linked charts
    chart_manager.render(key="linked_charts")
    
    st.markdown("""
    ### What's Different?
    
    **Individual Charts**: Each chart operates independently. Hovering over one
    chart doesn't affect the others.
    
    **Linked Charts**: All charts are synchronized. When you:
    - **Hover** over any chart, the crosshair appears on all charts
    - **Zoom/Pan** on any chart, all charts zoom/pan together
    - **Change sync mode** to see different behaviors
    
    ### Code Example:
    
    ```python
    # Create individual charts
    price_chart = Chart(series=CandlestickSeries(ohlcv_data))
    volume_chart = Chart(series=HistogramSeries(volume_data))
    
    # Create chart manager
    chart_manager = ChartManager()
    chart_manager.add_chart(price_chart, chart_id="price")
    chart_manager.add_chart(volume_chart, chart_id="volume")
    
    # Enable synchronization
    chart_manager.enable_all_sync()
    
    # Render all linked charts
    chart_manager.render(key="my_linked_charts")
    ```
    """)


if __name__ == "__main__":
    main()
