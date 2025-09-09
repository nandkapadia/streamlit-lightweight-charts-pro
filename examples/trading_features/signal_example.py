"""
Signal Series Example

This example demonstrates how to use SignalSeries for background coloring
in financial charts. SignalSeries creates vertical background bands that
span the entire chart height, colored based on signal values at specific
time points.
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import CandlestickSeries, Chart, SignalSeries
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.data import CandlestickData, SignalData


def generate_sample_data():
    """Generate sample OHLCV data for demonstration."""
    dates = pd.date_range(start="2024-01-01", end="2024-12-31", freq="D")
    np.random.seed(42)

    # Generate price data
    base_price = 100
    prices = []
    for i in range(len(dates)):
        if i == 0:
            price = base_price
        else:
            change = np.random.normal(0, 1)
            price = prices[-1] * (1 + change * 0.02)
        prices.append(price)

    # Create OHLCV data
    data = []
    for i, (date, price) in enumerate(zip(dates, prices)):
        open_price = price
        high_price = price * (1 + abs(np.random.normal(0, 0.01)))
        low_price = price * (1 - abs(np.random.normal(0, 0.01)))
        close_price = price * (1 + np.random.normal(0, 0.005))
        volume = int(np.random.uniform(1000, 10000))

        data.append(
            CandlestickData(
                time=date.strftime("%Y-%m-%d"),
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
                volume=volume,
            )
        )

    return data


def generate_signal_data():
    """Generate sample signal data for background coloring."""
    # Create signal data with different patterns
    signal_data = []

    # January: Neutral (value=0)
    for i in range(1, 32):
        signal_data.append(SignalData(f"2024-01-{i:02d}", 0))

    # February: Signal (value=1) - bullish period
    for i in range(1, 30):
        signal_data.append(SignalData(f"2024-02-{i:02d}", 1))

    # March: Alert (value=2) - bearish period
    for i in range(1, 32):
        signal_data.append(SignalData(f"2024-03-{i:02d}", 2))

    # April: Mixed signals
    for i in range(1, 31):
        signal_value = i % 3  # Alternating 0, 1, 2
        signal_data.append(SignalData(f"2024-04-{i:02d}", signal_value))

    # May: Custom colors for specific dates
    for i in range(1, 32):
        if i == 15:  # Special event
            signal_data.append(SignalData(f"2024-05-{i:02d}", 1, color="#ff6b6b"))
        elif i == 20:  # Another special event
            signal_data.append(SignalData(f"2024-05-{i:02d}", 2, color="#4ecdc4"))
        else:
            signal_data.append(SignalData(f"2024-05-{i:02d}", 0))

    return signal_data


def main():
    st.title("Signal Series Example")
    st.write(
        "This example demonstrates how to use SignalSeries for background coloring "
        "in financial charts. SignalSeries creates vertical background bands that "
        "span the entire chart height, colored based on signal values at specific "
        "time points."
    )

    # Generate data
    ohlcv_data = generate_sample_data()
    signal_data = generate_signal_data()

    # Create chart
    chart = Chart(ChartOptions(width=800, height=400))

    # Add candlestick series
    candlestick_series = CandlestickSeries(data=ohlcv_data, name="Price", color="#2196F3")
    chart.add_series(candlestick_series)

    # Add signal series for background coloring
    signal_series = SignalSeries(
        data=signal_data,
        neutral_color="#ffffff",  # White for neutral periods
        signal_color="#e8f5e8",  # Light green for bullish periods
        alert_color="#ffe8e8",  # Light red for bearish periods
    )
    chart.add_series(signal_series)

    # Display the chart
    st.subheader("Chart with Signal Background Coloring")
    st.write(
        "The background colors indicate different market conditions:\n"
        "- **White**: Neutral periods (signal value = 0)\n"
        "- **Light Green**: Bullish periods (signal value = 1)\n"
        "- **Light Red**: Bearish periods (signal value = 2)\n"
        "- **Custom Colors**: Individual data points with specific colors"
    )

    st.plotly_chart(chart)

    # Show signal data table
    st.subheader("Signal Data")
    st.write("Below is a sample of the signal data used for background coloring:")

    # Convert signal data to DataFrame for display
    signal_df = pd.DataFrame(
        [
            {
                "Date": signal.time,
                "Signal Value": signal.value,
                "Color": signal.color if signal.color else "Default",
            }
            for signal in signal_data[:20]  # Show first 20 entries
        ]
    )

    st.dataframe(signal_df, use_container_width=True)

    # Show usage example
    st.subheader("Usage Example")
    st.code(
        """
# Create signal data
signal_data = [
    SignalData("2024-01-01", 0),  # Neutral period
    SignalData("2024-01-02", 1),  # Bullish period
    SignalData("2024-01-03", 2),  # Bearish period
    SignalData("2024-01-04", 1, color="#ff6b6b"),  # Custom color
]

# Create signal series
signal_series = SignalSeries(
    data=signal_data,
    neutral_color="#ffffff",  # White for neutral
    signal_color="#e8f5e8",   # Light green for bullish
    alert_color="#ffe8e8"     # Light red for bearish
)

# Add to chart
chart.add_series(signal_series)
    """,
        language="python",
    )


if __name__ == "__main__":
    main()
