#!/usr/bin/env python3
"""Quick Start: Candlestick Chart

Create a professional-looking candlestick chart for financial data.

This example shows:
- How to create candlestick data
- OHLC (Open, High, Low, Close) data structure
- Financial chart styling

Usage:
    streamlit run candlestick_example.py
"""

import numpy as np
import pandas as pd
import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import CandlestickSeries

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.data import CandlestickData

st.title("🕯️ Quick Start: Candlestick Chart")

st.markdown("Create a professional candlestick chart for financial data.")


# Generate sample OHLC data
def generate_ohlc_data(num_days=30):
    """Generate realistic OHLC data."""
    rng = np.random.default_rng(42)
    dates = pd.date_range(start="2024-01-01", periods=num_days, freq="D")

    # Start with base price
    base_price = 100
    data = []

    for i, date in enumerate(dates):
        # Create realistic price movement
        if i == 0:
            open_price = base_price
        else:
            # Open price is close to previous close with some gap
            gap = rng.normal(0, 1)
            open_price = data[-1].close + gap

        # Generate daily volatility
        volatility = rng.uniform(0.5, 3.0)
        close_change = rng.normal(0, volatility)
        close_price = open_price + close_change

        # High and low prices
        high_price = max(open_price, close_price) + rng.uniform(0, volatility)
        low_price = min(open_price, close_price) - rng.uniform(0, volatility)

        # Ensure high >= low
        if high_price <= low_price:
            high_price = low_price + 0.01

        data.append(
            CandlestickData(
                time=date,
                open=round(open_price, 2),
                high=round(high_price, 2),
                low=round(low_price, 2),
                close=round(close_price, 2),
            ),
        )

    return data


# Generate and display data
st.subheader("📊 Sample OHLC Data")
sample_data = generate_ohlc_data(10)

# Show data in a table
df_data = pd.DataFrame(
    [
        {
            "Date": pd.to_datetime(point.time, unit="s").strftime("%Y-%m-%d"),
            "Open": point.open,
            "High": point.high,
            "Low": point.low,
            "Close": point.close,
        }
        for point in sample_data
    ],
)

st.dataframe(df_data)

# Create candlestick chart
st.subheader("🕯️ Candlestick Chart")
chart = Chart()
chart.add_series(CandlestickSeries(data=sample_data))
chart.update_options(width=800, height=400)
chart.render(key="candlestick_chart")

st.subheader("💡 Understanding OHLC Data")
st.markdown(
    """
**OHLC stands for:**
- **Open**: Price at the start of the period
- **High**: Highest price during the period
- **Low**: Lowest price during the period
- **Close**: Price at the end of the period

**Candlestick colors:**
- 🟢 Green: Close > Open (bullish)
- 🔴 Red: Close < Open (bearish)
""",
)

st.subheader("🔧 Interactive Example")
num_days = st.slider("Number of days", 5, 50, 20)

if st.button("Generate New Data"):
    new_data = generate_ohlc_data(num_days)

    # Show new data
    new_df = pd.DataFrame(
        [
            {
                "Date": pd.to_datetime(point.time, unit="s").strftime("%Y-%m-%d"),
                "Open": point.open,
                "High": point.high,
                "Low": point.low,
                "Close": point.close,
            }
            for point in new_data
        ],
    )

    st.write("**New Data:**")
    st.dataframe(new_df)

    # Create new chart
    new_chart = Chart()
    new_chart.add_series(CandlestickSeries(data=new_data))
    new_chart.update_options(width=800, height=400)
    new_chart.render(key="new_candlestick_chart")

st.subheader("📚 Next Steps")
st.markdown(
    """
- **[Tutorial 2: Data Formats](../tutorials/02_data_formats.py)** - Learn about data structures
 - **[Basic Candlestick Example](../candlestick_charts/basic_candlestick_chart.py)** -
   More detailed example
- **[Supertrend Example](../trading_features/supertrend_example.py)** - Real trading indicator
""",
)
