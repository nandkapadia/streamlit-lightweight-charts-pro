"""
Supertrend Example with TrendFill Series

This example demonstrates the Supertrend indicator using the new TrendFill series type
that creates smooth, continuous fills exactly like the image visualization.
"""

import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series.trend_fill import TrendFillSeries
from streamlit_lightweight_charts_pro.data.trend_fill import TrendFillData

# Create realistic OHLCV data similar to the image
def create_supertrend_data():
    """Create OHLCV data with Supertrend-like patterns."""
    dates = pd.date_range('2023-01-01', periods=365, freq='D')
    
    # Start with base price and create realistic movements
    base_price = 100
    prices = []
    
    # Phase 1: Uptrend (Jan-Mar 2023)
    for i in range(90):
        change = np.random.normal(0.5, 0.8)  # Positive bias
        base_price += change
        prices.append(base_price)
    
    # Phase 2: Major downtrend (Apr-Sep 2023)
    for i in range(180):
        change = np.random.normal(-0.8, 0.6)  # Negative bias
        base_price += change
        prices.append(base_price)
    
    # Phase 3: Recovery with mixed trends (Oct-Dec 2024)
    for i in range(95):
        if i % 20 < 10:
            change = np.random.normal(0.3, 0.4)  # Slight positive
        else:
            change = np.random.normal(-0.2, 0.4)  # Slight negative
        base_price += change
        prices.append(base_price)
    
    # Create OHLCV data
    data = []
    for i, (date, price) in enumerate(zip(dates, prices)):
        # Create realistic OHLC from base price
        volatility = max(0.5, abs(price) * 0.02)  # 2% volatility
        
        open_price = price + np.random.normal(0, volatility * 0.3)
        high_price = max(open_price, price) + np.random.uniform(0, volatility)
        low_price = min(open_price, price) - np.random.uniform(0, volatility)
        close_price = price + np.random.normal(0, volatility * 0.3)
        volume = np.random.randint(50000, 200000)
        
        data.append({
            'datetime': date,
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': volume
        })
    
    return pd.DataFrame(data)

# Calculate Supertrend-like values
def create_mock_trend_fill_data(df):
    """Create mock trend fill data for demonstration."""
    trend_fill_data = []
    
    # Simple trend detection based on price movement
    for i in range(len(df)):
        if i < 20:  # First 20 periods
            trend_direction = 1
            trendLine = df.iloc[i]['close'] + 5  # Trend line above price for uptrend
        else:
            # Calculate trend based on recent price movement
            recent_prices = df.iloc[max(0, i-20):i+1]['close']
            price_change = recent_prices.iloc[-1] - recent_prices.iloc[0]
            
            if price_change > 2:  # Uptrend
                trend_direction = 1
                trendLine = df.iloc[i]['close'] + 5 + (i % 10) * 0.1  # Above price
            elif price_change < -2:  # Downtrend
                trend_direction = -1
                trendLine = df.iloc[i]['close'] - 5 - (i % 10) * 0.1  # Below price
            else:  # Neutral
                trend_direction = 0
                trendLine = None
        
        # Calculate OHLC4 (midpoint) for base line
        ohlc4 = (df.iloc[i]['open'] + df.iloc[i]['high'] + 
                 df.iloc[i]['low'] + df.iloc[i]['close']) / 4
        
        trend_fill_data.append(TrendFillData(
            time=int(df.iloc[i]['datetime'].timestamp()),
            base_line=round(ohlc4, 2),
            trendLine=trendLine,
            trend_direction=trend_direction,
            uptrend_fill_color="#26A69A",  # Green for uptrend
            downtrend_fill_color="#EF5350"  # Red for downtrend
        ))
    
    return trend_fill_data

def main():
    st.title("Supertrend with TrendFill Series")
    st.write("This demonstrates the exact TrendFill visualization shown in the image.")
    
    # Create data
    df = create_supertrend_data()
    trend_fill_data = create_mock_trend_fill_data(df)
    
    # Create the chart
    chart = Chart()
    
    # Add candlestick series for price data
    candlestick_series = chart.add_candlestick_series(
        data=df,
        column_mapping={
            "time": "datetime",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close"
        },
        title="Price"
    )
    
    # Add TrendFill series
    trend_fill_series = TrendFillSeries(
        data=trend_fill_data,
        uptrend_fill_color="#26A69A",
        downtrend_fill_color="#EF5350"
    )
    
    # Configure the chart
    chart_config = {
        "chart": {
            "width": 1000,
            "height": 600,
            "layout": {
                "background": {"type": "solid", "color": "#ffffff"},
                "textColor": "#333333",
            },
            "grid": {
                "vertLines": {"color": "#e6e6e6"},
                "horzLines": {"color": "#e6e6e6"},
            },
            "crosshair": {"mode": 1},
            "rightPriceScale": {"borderColor": "#cccccc"},
            "timeScale": {
                "borderColor": "#cccccc",
                "timeVisible": True,
            },
        },
        "series": [
            {
                "type": "candlestick",
                "data": df.to_dict('records'),
                "columnMapping": {
                    "time": "datetime",
                    "open": "open",
                    "high": "high",
                    "low": "low",
                    "close": "close"
                }
            },
            {
                "type": "trend_fill",
                "data": [
                    {
                        "time": item.time,
                                "base_line": item.base_line,
        "trend_line": item.trend_line,
        "trend_direction": item.trend_direction,
        "uptrend_fill_color": item.uptrend_fill_color,
        "downtrend_fill_color": item.downtrend_fill_color
                    }
                    for item in trend_fill_data
                ],
                "options": {
                    "uptrend_fill_color": "#26A69A",
                    "downtrend_fill_color": "#EF5350",
                    "fillOpacity": 0.25,
                    "trendLine": {
                        "color": "#EF5350",
                        "lineWidth": 2,
                        "lineStyle": 0,
                        "visible": True
                    },
                    "baseLine": {
                        "color": "#666666",
                        "lineWidth": 1,
                        "lineStyle": 1,
                        "visible": False
                    }
                }
            }
        ]
    }
    
    # Add series to chart
    chart.add_series(trend_fill_series)
    
    # Display the chart
    st.subheader("Supertrend Chart with TrendFill")
    chart.display()
    
    # Display configuration
    st.subheader("Chart Configuration")
    st.json(chart_config)
    
    # Display sample data
    st.subheader("Sample TrendFill Data")
    sample_df = pd.DataFrame([
        {
            'date': pd.to_datetime(item.time, unit='s'),
            'base_line': item.base_line,
            'trend_line': item.trend_line,
            'trend_direction': item.trend_direction
        }
        for item in trend_fill_data[-10:]  # Last 10 data points
    ])
    st.dataframe(sample_df)
    
    # Display trend statistics
    st.subheader("Trend Analysis")
    uptrend_count = sum(1 for item in trend_fill_data if item.trend_direction == 1)
    downtrend_count = sum(1 for item in trend_fill_data if item.trend_direction == -1)
    neutral_count = sum(1 for item in trend_fill_data if item.trend_direction == 0)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Uptrend Periods", uptrend_count)
    with col2:
        st.metric("Downtrend Periods", downtrend_count)
    with col3:
        st.metric("Neutral Periods", neutral_count)
    
    st.write("**Key Features:**")
    st.write("✅ **Smooth TrendFill**: Continuous fills that look exactly like the image")
    st.write("✅ **Dynamic Colors**: Green for uptrends, red for downtrends")
    st.write("✅ **Seamless Integration**: Overlays perfectly on candlestick charts")
    st.write("✅ **Performance Optimized**: Single area series per trend direction")
    st.write("✅ **Realistic Data**: Simulates actual market patterns")

if __name__ == "__main__":
    main()
