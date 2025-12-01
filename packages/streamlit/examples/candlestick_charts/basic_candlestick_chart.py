"""Basic Candlestick Chart Example.

This example demonstrates the fundamental usage of CandlestickSeries with sample data
from the data_samples module.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from examples.utilities.data_samples import get_candlestick_data, get_dataframe_candlestick_data

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import CandlestickSeries

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate basic CandlestickSeries functionality."""
    st.title("Basic Candlestick Chart Example")
    st.write(
        "This example shows how to create a simple candlestick chart using CandlestickSeries with"
        " sample data.",
    )

    # Get sample data
    candlestick_data = get_candlestick_data()
    df_data = get_dataframe_candlestick_data()

    # Method 1: Using OhlcData objects
    st.subheader("Method 1: Using OhlcData Objects")
    st.write("Creating CandlestickSeries from OhlcData objects:")

    candlestick_series = CandlestickSeries(data=candlestick_data)

    chart = Chart()
    chart.add_series(candlestick_series)

    chart.render(key="basic_candlestick_1")

    # Method 2: Using DataFrame
    st.subheader("Method 2: Using DataFrame")
    st.write("Creating CandlestickSeries from pandas DataFrame:")

    candlestick_series_df = CandlestickSeries(
        data=df_data,
        column_mapping={
            "time": "datetime",
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
        },
    )

    dataframe_chart = Chart()
    dataframe_chart.add_series(candlestick_series_df)

    dataframe_chart.render(key="basic_candlestick_2")

    # Show data info
    st.subheader("Data Information")
    st.write(f"Number of data points: {len(candlestick_data)}")

    # Show first few data points
    st.write("First 5 data points:")
    st.dataframe(df_data.head())

    # Show series properties
    st.subheader("Series Properties")
    st.write(f"Chart type: {candlestick_series.chart_type}")
    st.write(f"Visible: {candlestick_series.visible}")  # pylint: disable=no-member
    st.write(f"Price scale ID: {candlestick_series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"Pane ID: {candlestick_series.pane_id}")  # pylint: disable=no-member

    # Show data statistics
    st.subheader("Data Statistics")
    opens = [point.open for point in candlestick_data]
    highs = [point.high for point in candlestick_data]
    lows = [point.low for point in candlestick_data]
    closes = [point.close for point in candlestick_data]

    st.write(f"Average open: {sum(opens) / len(opens):.2f}")
    st.write(f"Average high: {sum(highs) / len(highs):.2f}")
    st.write(f"Average low: {sum(lows) / len(lows):.2f}")
    st.write(f"Average close: {sum(closes) / len(closes):.2f}")

    # Show candlestick analysis
    st.subheader("Candlestick Analysis")

    # Calculate candlestick patterns
    bullish_candles = sum(1 for i in range(len(closes)) if closes[i] > opens[i])
    bearish_candles = sum(1 for i in range(len(closes)) if closes[i] < opens[i])
    doji_candles = sum(1 for i in range(len(closes)) if abs(closes[i] - opens[i]) < 0.01)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(
            "Bullish Candles",
            bullish_candles,
            delta=f"{bullish_candles / len(closes) * 100:.1f}%",
        )
    with col2:
        st.metric(
            "Bearish Candles",
            bearish_candles,
            delta=f"-{bearish_candles / len(closes) * 100:.1f}%",
        )
    with col3:
        st.metric("Doji Candles", doji_candles, delta=f"{doji_candles / len(closes) * 100:.1f}%")

    # Calculate average body and wick sizes
    body_sizes = [abs(close - open_) for open_, close in zip(opens, closes)]
    wick_sizes = [high - low for high, low in zip(highs, lows)]

    st.write(f"Average body size: {sum(body_sizes) / len(body_sizes):.2f}")
    st.write(f"Average wick size: {sum(wick_sizes) / len(wick_sizes):.2f}")

    # Show the raw data
    st.subheader("Raw Data")
    st.dataframe(df_data)


if __name__ == "__main__":
    main()
