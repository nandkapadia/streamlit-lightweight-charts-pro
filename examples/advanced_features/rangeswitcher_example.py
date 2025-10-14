"""Professional Trading Chart with Range Switcher

==============================================

A comprehensive trading chart example featuring:
- Price and Volume data with candlesticks
- RSI (Relative Strength Index) indicator
- MACD (Moving Average Convergence Divergence) indicator
- Configurable Range Switcher positioning
- Configurable Legend positioning and visibility
- Professional trading platform styling
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import (
    AreaSeries,
    CandlestickSeries,
    Chart,
    ChartOptions,
    HistogramSeries,
    LineSeries,
)
from streamlit_lightweight_charts_pro.charts.options.ui_options import (
    LegendOptions,
    RangeConfig,
    RangeSwitcherOptions,
    TimeRange,
)
from streamlit_lightweight_charts_pro.data import AreaData, CandlestickData, HistogramData, LineData

# pylint: disable=no-member

# Standard legend text format
DEFAULT_LEGEND_TEXT = (
    "<span style='"
    'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; '
    "font-size: 11px; "
    "font-weight: 500; "
    "color: #131722; "
    "background: rgba(255, 255, 255, 0.15); "
    "padding: 4px 8px; "
    "display: inline-block; "
    "line-height: 1.1; "
    "white-space: nowrap; "
    "width: auto; "
    "border-radius: 4px; "
    "box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);'>"
    "{legendTitle}</span>"
)

# Page configuration
st.set_page_config(page_title="Professional Trading Chart", page_icon="📈", layout="wide")

st.title("📈 Professional Trading Chart with Range Switcher")
st.markdown(
    "A comprehensive trading chart featuring price/volume data, RSI, MACD indicators, "
    "and configurable range switcher and legend options.",
)

st.info(
    "💡 **Tip**: Use the sidebar controls to configure the chart. "
    "The chart should remain stable when changing options.",
)


@st.cache_data
def generate_trading_data(days=365):
    """Generate realistic trading data with OHLC, volume, RSI, and MACD."""
    # Generate dates
    dates = pd.date_range(start="2024-01-01", periods=days, freq="D")

    # Price data with trend and volatility
    base_price = 100
    prices = []
    volume_base = 1000000

    # Create random generator for reproducible results
    rng = np.random.default_rng(42)

    for i, date in enumerate(dates):
        # Simulate price movement with trend and volatility
        trend = i * 0.05  # Slight upward trend
        volatility = rng.normal(0, 2)
        base_price = max(50, base_price + trend + volatility)  # Prevent negative prices

        # Generate OHLC data
        open_price = base_price + rng.normal(0, 0.5)
        close_price = base_price + rng.normal(0, 0.5)
        high_price = max(open_price, close_price) + abs(rng.normal(0, 1))
        low_price = min(open_price, close_price) - abs(rng.normal(0, 1))

        prices.append(
            {
                "time": date,
                "open": open_price,
                "high": high_price,
                "low": low_price,
                "close": close_price,
            },
        )

    # Convert to DataFrame for easier calculations
    price_data = pd.DataFrame(prices)

    # Calculate moving averages for MACD
    price_data["ema_12"] = price_data["close"].ewm(span=12).mean()
    price_data["ema_26"] = price_data["close"].ewm(span=26).mean()
    price_data["macd"] = price_data["ema_12"] - price_data["ema_26"]
    price_data["macd_signal"] = price_data["macd"].ewm(span=9).mean()
    price_data["macd_histogram"] = price_data["macd"] - price_data["macd_signal"]

    # Calculate RSI
    delta = price_data["close"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    price_data["rsi"] = 100 - (100 / (1 + rs))

    # Generate volume data
    price_data["volume"] = volume_base + rng.integers(-200000, 300000, len(price_data))

    # Create data objects
    ohlc_data = []
    volume_data = []
    rsi_data = []
    macd_line_data = []
    macd_signal_data = []
    macd_histogram_data = []

    for _, row in price_data.iterrows():
        if not pd.isna(row["close"]):
            ohlc_data.append(
                CandlestickData(
                    time=row["time"],
                    open=row["open"],
                    high=row["high"],
                    low=row["low"],
                    close=row["close"],
                ),
            )

            volume_data.append(AreaData(time=row["time"], value=row["volume"]))

            if not pd.isna(row["rsi"]):
                rsi_data.append(LineData(time=row["time"], value=row["rsi"]))

            if not pd.isna(row["macd"]):
                macd_line_data.append(LineData(time=row["time"], value=row["macd"]))

                macd_signal_data.append(LineData(time=row["time"], value=row["macd_signal"]))

                macd_histogram_data.append(
                    HistogramData(time=row["time"], value=row["macd_histogram"]),
                )

    return ohlc_data, volume_data, rsi_data, macd_line_data, macd_signal_data, macd_histogram_data


# Generate data (cached to prevent regeneration on every rerun)
@st.cache_data
def get_trading_data():
    return generate_trading_data()


(
    ohlc_data,
    volume_data,
    rsi_data,
    macd_line_data,
    macd_signal_data,
    macd_histogram_data,
) = get_trading_data()

# Convert data to DataFrame for metrics display
df_data = []
for i, ohlc in enumerate(ohlc_data):
    row = {
        "time": ohlc.time,
        "open": ohlc.open,
        "high": ohlc.high,
        "low": ohlc.low,
        "close": ohlc.close,
        "volume": volume_data[i].value if i < len(volume_data) else 0,
        "rsi": rsi_data[i].value if i < len(rsi_data) else None,
        "macd": macd_line_data[i].value if i < len(macd_line_data) else None,
        "macd_signal": macd_signal_data[i].value if i < len(macd_signal_data) else None,
        "macd_histogram": macd_histogram_data[i].value if i < len(macd_histogram_data) else None,
    }
    df_data.append(row)

test_data = pd.DataFrame(df_data)

# Sidebar configuration
st.sidebar.title("Chart Configuration")

# Range Switcher Configuration
st.sidebar.subheader("Range Switcher")
show_range_switcher = st.sidebar.checkbox("Show Range Switcher", value=True)
range_switcher_position = st.sidebar.selectbox(
    "Range Switcher Position",
    ["top-right", "top-left", "bottom-right", "bottom-left"],
    index=0,
)

# Legend Configuration
st.sidebar.subheader("Legends")
show_legends = st.sidebar.checkbox("Show Legends", value=True)
legend_position = st.sidebar.selectbox(
    "Legend Position",
    ["top-left", "top-right", "bottom-left", "bottom-right"],
    index=0,
)

# Chart Styling
st.sidebar.subheader("Chart Styling")
chart_height = st.sidebar.slider("Chart Height", 400, 1000, 700)
chart_width = st.sidebar.selectbox("Chart Width", ["100%", "800px", "1000px", "1200px"], index=0)

# Create range configurations using the new TimeRange enum
ranges = [
    RangeConfig(text="1D", tooltip="1 Day", range=TimeRange.ONE_DAY),
    RangeConfig(text="1W", tooltip="1 Week", range=TimeRange.ONE_WEEK),
    RangeConfig(text="1M", tooltip="1 Month", range=TimeRange.ONE_MONTH),
    RangeConfig(text="3M", tooltip="3 Months", range=TimeRange.THREE_MONTHS),
    RangeConfig(text="6M", tooltip="6 Months", range=TimeRange.SIX_MONTHS),
    RangeConfig(text="1Y", tooltip="1 Year", range=TimeRange.ONE_YEAR),
    RangeConfig(text="ALL", tooltip="All Data", range=TimeRange.ALL),
]

# Create range switcher options
range_switcher = RangeSwitcherOptions(
    visible=show_range_switcher,
    ranges=ranges,
    position=range_switcher_position,
)

# Create series objects manually
# Price and Volume (Pane 0)
candlestick_series = CandlestickSeries(data=ohlc_data, pane_id=0)
candlestick_series.title = "Price"

volume_series = AreaSeries(data=volume_data, pane_id=1)
volume_series.title = "Volume"

# RSI (Pane 2)
rsi_series = LineSeries(data=rsi_data, pane_id=2)
rsi_series.title = "RSI"
rsi_series.line_options.set_color("#ff6b6b")

# MACD (Pane 3)
macd_line_series = LineSeries(data=macd_line_data, pane_id=3)
macd_line_series.title = "MACD"
macd_line_series.line_options.set_color("#4ecdc4")

macd_signal_series = LineSeries(data=macd_signal_data, pane_id=3)
macd_signal_series.title = "MACD Signal"
macd_signal_series.line_options.set_color("#ffd93d")

macd_histogram_series = HistogramSeries(data=macd_histogram_data, pane_id=3)
macd_histogram_series.title = "MACD Histogram"

# Create the chart
chart = Chart(
    options=ChartOptions(
        width=chart_width,
        height=chart_height,
        range_switcher=range_switcher,
    ),
    series=[
        candlestick_series,
        volume_series,
        rsi_series,
        macd_line_series,
        macd_signal_series,
        macd_histogram_series,
    ],
)

# Configure legends if enabled
if show_legends:
    # Add legends to all series
    for series in chart.series:
        if hasattr(series, "legend"):
            series.legend = LegendOptions(
                visible=True,
                position=legend_position,
                text=DEFAULT_LEGEND_TEXT.format(legendTitle=f"{series.title}: $$value$$"),
            )

# Render the chart with a stable key
try:
    # Add debug info in expander
    with st.expander("🔍 Debug Info", expanded=False):
        st.write(f"**Range Switcher**: {show_range_switcher}")
        st.write(f"**Range Position**: {range_switcher_position}")
        st.write(f"**Show Legends**: {show_legends}")
        st.write(f"**Legend Position**: {legend_position}")
        st.write(f"**Chart Height**: {chart_height}")
        st.write(f"**Chart Width**: {chart_width}")
        st.write(f"**Data Points**: {len(ohlc_data)}")

    chart.render(key="professional_trading_chart")
    st.success("✅ Professional trading chart rendered successfully!")
except Exception as e:
    st.error(f"❌ Chart rendering failed: {e}")
    st.exception(e)

# Information section
st.markdown("---")
st.subheader("📊 Chart Information")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Data Points", str(len(test_data)))
    st.metric(
        "Price Range",
        f"${test_data['low'].min():.2f} - ${test_data['high'].max():.2f}",
    )

with col2:
    st.metric(
        "RSI Range",
        f"{test_data['rsi'].min():.1f} - {test_data['rsi'].max():.1f}",
    )
    st.metric("Volume Avg", f"{test_data['volume'].mean():,.0f}")

with col3:
    st.metric(
        "MACD Range",
        f"{test_data['macd'].min():.3f} - {test_data['macd'].max():.3f}",
    )
    st.metric("Time Period", f"{len(test_data)} days")

# Code example
with st.expander("📝 Code Example"):
    st.code(
        """
# Professional Trading Chart Setup
from streamlit_lightweight_charts_pro import (
    AreaSeries, CandlestickSeries, Chart, ChartOptions,
    HistogramSeries, LineSeries
)
from streamlit_lightweight_charts_pro.charts.options.ui_options import (
    LegendOptions, RangeConfig, RangeSwitcherOptions, TimeRange
)

# Create range switcher using TimeRange enum
ranges = [
    RangeConfig(text="1D", tooltip="1 Day", range=TimeRange.ONE_DAY),
    RangeConfig(text="1W", tooltip="1 Week", range=TimeRange.ONE_WEEK),
    RangeConfig(text="1M", tooltip="1 Month", range=TimeRange.ONE_MONTH),
    RangeConfig(text="1Y", tooltip="1 Year", range=TimeRange.ONE_YEAR),
    RangeConfig(text="ALL", tooltip="All Data", range=TimeRange.ALL),
]

range_switcher = RangeSwitcherOptions(
    visible=True,
    ranges=ranges,
    position="top-right"
)

# Create series objects
candlestick_series = CandlestickSeries(data=ohlc_data, pane_id=0)
candlestick_series.title = "Price"

volume_series = AreaSeries(data=volume_data, pane_id=1)
volume_series.title = "Volume"

rsi_series = LineSeries(data=rsi_data, pane_id=2)
rsi_series.title = "RSI"
rsi_series.line_options.set_color("#ff6b6b")

macd_line_series = LineSeries(data=macd_line_data, pane_id=3)
macd_line_series.title = "MACD"
macd_line_series.line_options.set_color("#4ecdc4")

macd_signal_series = LineSeries(data=macd_signal_data, pane_id=3)
macd_signal_series.title = "MACD Signal"
macd_signal_series.line_options.set_color("#ffd93d")

macd_histogram_series = HistogramSeries(data=macd_histogram_data, pane_id=3)
macd_histogram_series.title = "MACD Histogram"

# Create chart
chart = Chart(
    options=ChartOptions(
        width="100%",
        height=700,
        range_switcher=range_switcher,
    ),
    series=[
        candlestick_series, volume_series, rsi_series,
        macd_line_series, macd_signal_series, macd_histogram_series
    ],
)

chart.render(key="trading_chart")
    """,
        language="python",
    )

# Technical indicators explanation
st.markdown("---")
st.subheader("📈 Technical Indicators")

col1, col2 = st.columns(2)

with col1:
    st.markdown(
        """
        **RSI (Relative Strength Index)**
        - Measures momentum of price movements
        - Range: 0-100
        - Overbought: >70, Oversold: <30
        - Used to identify potential reversal points
        """,
    )

with col2:
    st.markdown(
        """
        **MACD (Moving Average Convergence Divergence)**
        - Shows relationship between two moving averages
        - MACD Line: 12-period EMA - 26-period EMA
        - Signal Line: 9-period EMA of MACD Line
        - Histogram: MACD Line - Signal Line
        """,
    )

st.markdown("---")
st.markdown(
    """
    **🎯 Features:**
    - **Multi-pane Layout**: Price/Volume, RSI, and MACD in separate panes
    - **Range Switcher**: Professional time range switching
    - **Configurable Legends**: Position and visibility control
    - **Real-time Calculations**: Accurate RSI and MACD indicators
    - **Professional Styling**: Trading platform appearance
    - **Interactive Controls**: Sidebar configuration options
    """,
)
