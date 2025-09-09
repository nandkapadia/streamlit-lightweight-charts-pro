"""
Colored Volume Example

This example demonstrates how to create a candlestick chart with volume bars
that are colored based on whether the candle is bullish (green) or bearish (red).
"""

from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import Chart


def generate_sample_data(days: int = 30) -> pd.DataFrame:
    """Generate sample OHLCV data with realistic price movements."""
    np.random.seed(42)  # For reproducible results

    # Generate dates
    start_date = datetime(2024, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(days)]

    # Generate price data with some trend and volatility
    base_price = 100.0
    prices = [base_price]

    for i in range(1, days):
        # Add some trend and random walk
        change = np.random.normal(0, 2) + (0.1 if i < days // 2 else -0.1)  # Trend change
        new_price = prices[-1] + change
        prices.append(max(new_price, 50))  # Ensure price doesn't go too low

    # Generate OHLCV data
    data = []
    for i, (date, close_price) in enumerate(zip(dates, prices)):
        # Create realistic OHLC from close price
        volatility = np.random.uniform(1, 3)
        open_price = close_price + np.random.normal(0, volatility)
        high_price = max(open_price, close_price) + np.random.uniform(0, volatility)
        low_price = min(open_price, close_price) - np.random.uniform(0, volatility)

        # Generate volume (higher volume on larger price moves)
        price_change = abs(close_price - open_price)
        base_volume = np.random.uniform(500, 2000)
        volume = base_volume + price_change * 100

        data.append(
            {
                "time": date.strftime("%Y-%m-%d"),
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": int(volume),
            }
        )

    return pd.DataFrame(data)


def main():
    st.set_page_config(page_title="Colored Volume Chart Example", page_icon="📊", layout="wide")

    st.title("📊 Colored Volume Chart Example")
    st.markdown(
        """
    This example demonstrates volume bars that are colored based on price movement:
    - **Green bars**: When close price >= open price (bullish)
    - **Red bars**: When close price < open price (bearish)
    """
    )

    # Sidebar controls
    st.sidebar.header("Chart Settings")

    days = st.sidebar.slider("Number of days", 10, 100, 30)

    # Color customization
    st.sidebar.subheader("Volume Colors")
    up_color = st.sidebar.color_picker(
        "Bullish color (close >= open)",
        value="#4CAF50",
        help="Color for volume bars when price closes higher than it opened",
    )
    down_color = st.sidebar.color_picker(
        "Bearish color (close < open)",
        value="#F44336",
        help="Color for volume bars when price closes lower than it opened",
    )

    # Convert hex to rgba for better visibility
    up_color_rgba = (
        f"rgba({int(up_color[1:3], 16)}, {int(up_color[3:5], 16)}, {int(up_color[5:7], 16)}, 0.5)"
    )
    down_color_rgba = f"rgba({int(down_color[1:3], 16)}, {int(down_color[3:5], 16)}, {int(down_color[5:7], 16)}, 0.5)"

    # Chart options
    st.sidebar.subheader("Chart Options")
    chart_height = st.sidebar.slider("Chart height", 400, 800, 500)
    show_grid = st.sidebar.checkbox("Show grid", value=True)
    show_volume = st.sidebar.checkbox("Show volume", value=True)

    # Generate data
    df = generate_sample_data(days)

    # Display data summary
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Days", len(df))
    with col2:
        bullish_days = len(df[df["close"] >= df["open"]])
        st.metric("Bullish Days", bullish_days)
    with col3:
        bearish_days = len(df[df["close"] < df["open"]])
        st.metric("Bearish Days", bearish_days)

    # Create chart
    if show_volume:
        chart = Chart.from_price_volume_dataframe(
            data=df,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
            volume_kwargs={"up_color": up_color_rgba, "down_color": down_color_rgba},
        )
    else:
        # Create chart without volume
        chart = Chart()
        chart.add_price_volume_series(
            data=df,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
            price_type="candlestick",
        )

    # Update chart options
    chart.update_options(height=chart_height, grid=show_grid)

    # Display chart
    st.subheader("Candlestick Chart with Colored Volume")
    chart.render(key="colored_volume_chart")

    # Display data table
    st.subheader("Data Table")
    st.dataframe(
        df.style.apply(
            lambda x: [
                (
                    "background-color: rgba(76,175,80,0.2)"
                    if row["close"] >= row["open"]
                    else "background-color: rgba(244,67,54,0.2)"
                )
                for _, row in df.iterrows()
            ],
            axis=1,
        ),
        use_container_width=True,
    )

    # Explanation
    st.subheader("How it works")
    st.markdown(
        """
    The volume bars are colored based on the price movement of each candle:
    
    1. **Green bars** (`rgba(76,175,80,0.5)`): When the close price is greater than or equal to the open price
    2. **Red bars** (`rgba(244,67,54,0.5)`): When the close price is less than the open price
    
    This provides a quick visual indication of market sentiment for each period.
    """
    )

    # Code example
    st.subheader("Code Example")
    st.code(
        """
# Method 1: Using Chart.from_price_volume_dataframe (recommended)
chart = Chart.from_price_volume_dataframe(
    data=df,
    column_mapping={
        'time': 'time',
        'open': 'open',
        'high': 'high',
        'low': 'low',
        'close': 'close',
        'volume': 'volume'
    },
    volume_kwargs={
        'up_color': 'rgba(76,175,80,0.5)',    # Green for bullish
        'down_color': 'rgba(244,67,54,0.5)'   # Red for bearish
    }
)

# Method 2: Using HistogramSeries.create_volume_series directly
from streamlit_lightweight_charts_pro.charts.series.histogram import HistogramSeries

volume_series = HistogramSeries.create_volume_series(
    data=df,  # DataFrame with OHLCV data
    column_mapping={
        'time': 'time',
        'volume': 'volume',
        'open': 'open',
        'close': 'close'
    },
    up_color='rgba(76,175,80,0.5)',
    down_color='rgba(244,67,54,0.5)',
    pane_id=0,
    price_scale_id='right'
)

# Method 3: Using OHLCV data objects
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData

ohlcv_data = [
    OhlcvData('2024-01-01', 100, 105, 98, 105, 1000),
    OhlcvData('2024-01-02', 105, 108, 102, 102, 1500)
]

volume_series_ohlcv = HistogramSeries.create_volume_series(
    data=ohlcv_data,  # List of OhlcvData objects
    column_mapping={},
    up_color='rgba(76,175,80,0.5)',
    down_color='rgba(244,67,54,0.5)'
)
    """,
        language="python",
    )


if __name__ == "__main__":
    main()
