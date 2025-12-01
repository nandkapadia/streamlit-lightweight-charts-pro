"""Basic Bar Chart Example.

This example demonstrates the fundamental usage of BarSeries with sample data
from the data_samples module.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st
from examples.utilities.data_samples import get_bar_data, get_dataframe_candlestick_data

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import BarSeries

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate basic BarSeries functionality."""
    st.title("Basic Bar Chart Example")
    st.write(
        "This example shows how to create a simple bar chart using BarSeries with sample data.",
    )

    # Get sample data
    bar_data = get_bar_data()
    df_data = get_dataframe_candlestick_data()

    # Method 1: Using OhlcData objects
    st.subheader("Method 1: Using OhlcData Objects")
    st.write("Creating BarSeries from OhlcData objects:")

    bar_series = BarSeries(data=bar_data)

    chart = Chart()
    chart.add_series(bar_series)

    chart.render(key="basic_bar_1")

    # Method 2: Using DataFrame
    st.subheader("Method 2: Using DataFrame")
    st.write("Creating BarSeries from pandas DataFrame:")

    bar_series_df = BarSeries(
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
    dataframe_chart.add_series(bar_series_df)

    dataframe_chart.render(key="basic_bar_2")

    # Show data info
    st.subheader("Data Information")
    st.write(f"Number of data points: {len(bar_data)}")

    # Show first few data points
    st.write("First 5 data points:")
    st.dataframe(df_data.head())

    # Show series properties
    st.subheader("Series Properties")
    st.write(f"Chart type: {bar_series.chart_type}")
    st.write(f"Visible: {bar_series.visible}")  # pylint: disable=no-member
    st.write(f"Price scale ID: {bar_series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"Pane ID: {bar_series.pane_id}")  # pylint: disable=no-member

    # Show data statistics
    st.subheader("Data Statistics")
    opens = [point.open for point in bar_data]
    highs = [point.high for point in bar_data]
    lows = [point.low for point in bar_data]
    closes = [point.close for point in bar_data]

    st.write(f"Average open: {sum(opens) / len(opens):.2f}")
    st.write(f"Average high: {sum(highs) / len(highs):.2f}")
    st.write(f"Average low: {sum(lows) / len(lows):.2f}")
    st.write(f"Average close: {sum(closes) / len(closes):.2f}")

    # Show the raw data
    st.subheader("Raw Data")
    st.dataframe(df_data)


if __name__ == "__main__":
    main()
