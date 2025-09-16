#!/usr/bin/env python3
"""
RangeSwitcher Test - Comprehensive demonstration of the range switching functionality.

This example showcases:
1. Range buttons with different time periods (1D, 1W, 1M, 3M, 1Y, All)
2. Different data intervals (1h data) with proper time calculations
3. Various positioning options for the range switcher
4. Custom styling options for the buttons
5. Interactive range switching that maintains data integrity
"""

from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import streamlit as st
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.series import (
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
)
from streamlit_lightweight_charts_pro.charts.options import LegendOptions
from streamlit_lightweight_charts_pro.charts.options.ui_options import RangeConfig, RangeSwitcherOptions
from streamlit_lightweight_charts_pro.data import CandlestickData, HistogramData, LineData

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

st.set_page_config(page_title="RangeSwitcher Test", layout="wide")
st.title("🕐 RangeSwitcher Test")

st.write(
    """
**Range Switcher Functionality Demo:**

This chart demonstrates the new RangeSwitcher feature with:
- **Interval-aware calculations**: Proper time range calculation based on 1-hour data intervals
- **Multiple range options**: 1D, 1W, 1M, 3M, 1Y, and All
- **Smart positioning**: Choose from corner positions (top-left, top-right, bottom-left, bottom-right)
- **Custom styling**: Configurable button appearance
- **Accurate time alignment**: Ranges align to actual candle boundaries

**How to test:**
1. Click different range buttons (1D, 1W, 1M, etc.)
2. Notice how each range shows exactly the requested time period
3. Try different positioning options in the sidebar (corner positions only)
4. Observe that ranges align properly to hourly candle boundaries
"""
)

# Sidebar configuration
st.sidebar.title("RangeSwitcher Configuration")
st.sidebar.write("Configure the range switcher position and styling:")

# Position selector
position = st.sidebar.selectbox(
    "Button Position",
    ["top-right", "top-left", "bottom-right", "bottom-left"],
    index=0,
    key="position_selector",
)


# Initialize session state for chart stability
if "chart_rendered" not in st.session_state:
    st.session_state.chart_rendered = False
if "last_position" not in st.session_state:
    st.session_state.last_position = position

# Check if position changed and handle it
if st.session_state.last_position != position:
    st.session_state.last_position = position
    st.session_state.chart_rendered = False
    # Force a rerun to update the chart with new position
    st.rerun()

# Add refresh button
if st.sidebar.button("🔄 Refresh Chart"):
    # Clear any cached state that might cause issues
    if "chart_rendered" in st.session_state:
        del st.session_state.chart_rendered
    if "last_position" in st.session_state:
        del st.session_state.last_position
    # Add a success message before rerun
    st.success("🔄 Refreshing chart...")
    st.rerun()

# Styling options
st.sidebar.subheader("Button Styling")
button_color = st.sidebar.color_picker("Button Text Color", "#131722")
button_bg = st.sidebar.color_picker("Button Background", "#f0f0f0")
active_color = st.sidebar.color_picker("Active Button Text", "#ffffff")
active_bg = st.sidebar.color_picker("Active Button Background", "#2196F3")


# Generate comprehensive hourly OHLCV data (2 years)
@st.cache_data
def generate_hourly_data():
    """Generate realistic hourly OHLCV data for 2 years"""
    np.random.seed(42)  # For reproducible data

    # Create hourly timestamps for 2 years
    end_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(days=730)  # 2 years

    timestamps = pd.date_range(start=start_time, end=end_time, freq="1h")

    # Generate realistic price movement with trends and volatility
    n_points = len(timestamps)
    base_price = 100.0

    # Create price series with realistic movement
    price_changes = np.random.normal(0, 0.008, n_points)  # Hourly volatility ~0.8%

    # Add some trending periods
    trend_periods = [
        (0, n_points // 4, 0.0001),  # Slight uptrend
        (n_points // 4, n_points // 2, -0.0002),  # Downtrend
        (n_points // 2, 3 * n_points // 4, 0.0003),  # Strong uptrend
        (3 * n_points // 4, n_points, -0.0001),  # Slight downtrend
    ]

    for start_idx, end_idx, trend in trend_periods:
        price_changes[start_idx:end_idx] += trend

    # Generate cumulative prices
    prices = [base_price]
    for change in price_changes:
        new_price = prices[-1] * (1 + change)
        prices.append(max(new_price, 1.0))  # Minimum price of $1

    prices = prices[1:]  # Remove initial base price

    # Generate OHLC data from price series
    ohlc_data = []
    volume_data = []
    sma_data = []

    sma_window = 24 * 7  # 7-day SMA (24 hours * 7 days)

    for i, (timestamp, price) in enumerate(zip(timestamps, prices)):
        # Generate realistic OHLC from base price
        volatility = np.random.uniform(0.002, 0.012)  # Variable intraday volatility

        open_price = price
        high_price = price * (1 + abs(np.random.normal(0, volatility)))
        low_price = price * (1 - abs(np.random.normal(0, volatility)))
        close_price = price * (1 + np.random.normal(0, volatility / 2))

        # Ensure OHLC relationships are valid
        high_price = max(high_price, open_price, close_price)
        low_price = min(low_price, open_price, close_price)

        ohlc_data.append(
            CandlestickData(
                time=int(timestamp.timestamp()),
                open=round(open_price, 2),
                high=round(high_price, 2),
                low=round(low_price, 2),
                close=round(close_price, 2),
            )
        )

        # Generate realistic volume (higher during market hours simulation)
        hour = timestamp.hour
        base_volume = 10000
        if 9 <= hour <= 16:  # Simulate higher volume during "market hours"
            volume_multiplier = np.random.uniform(1.5, 3.0)
        else:
            volume_multiplier = np.random.uniform(0.3, 1.0)

        volume = int(base_volume * volume_multiplier * np.random.uniform(0.5, 2.0))
        volume_data.append(
            HistogramData(
                time=int(timestamp.timestamp()),
                value=volume,
                color="#26a69a" if close_price >= open_price else "#ef5350",
            )
        )

        # Calculate SMA
        if i >= sma_window:
            sma_price = np.mean([data.close for data in ohlc_data[i - sma_window : i + 1]])
            sma_data.append(LineData(time=int(timestamp.timestamp()), value=round(sma_price, 2)))
        elif i > 0:  # For initial points, use expanding window
            sma_price = np.mean([data.close for data in ohlc_data[: i + 1]])
            sma_data.append(LineData(time=int(timestamp.timestamp()), value=round(sma_price, 2)))

    return ohlc_data, volume_data, sma_data


# Generate the data
with st.spinner("Generating 2 years of hourly data..."):
    ohlc_data, volume_data, sma_data = generate_hourly_data()

st.success(f"Generated {len(ohlc_data):,} hourly candles over 2 years")

# Define range switcher configuration (updated when position changes)
range_switcher_config = RangeSwitcherOptions(
    visible=True,
    position=position,  # Use the position from sidebar
    ranges=[
        RangeConfig(text="1D", tooltip="1 Day", seconds=86400),  # 24 hours
        RangeConfig(text="1W", tooltip="1 Week", seconds=604800),  # 7 days
        RangeConfig(text="1M", tooltip="1 Month", seconds=2592000),  # 30 days
        RangeConfig(text="3M", tooltip="3 Months", seconds=7776000),  # 90 days
        RangeConfig(text="1Y", tooltip="1 Year", seconds=31536000),  # 365 days
        RangeConfig(text="All", tooltip="All Data", seconds=None),  # Show all data
    ],
)

sma_series = LineSeries(
            data=sma_data,
            pane_id=0,
)

sma_series.title = "7-Day SMA"
sma_series.legend = LegendOptions(
    visible=True,
    position="top-right",
    text=DEFAULT_LEGEND_TEXT.format(legendTitle="7-Day SMA: $$value$$"),
)


# Create series objects with legends
candlestick_series = CandlestickSeries(data=ohlc_data, pane_id=0)
candlestick_series.title = "Price"
candlestick_series.legend = LegendOptions(
    visible=True,
    position="top-left",
    text=DEFAULT_LEGEND_TEXT.format(legendTitle="Price: $$value$$"),
)

volume_series = HistogramSeries(data=volume_data, pane_id=1)
volume_series.title = "Volume"
volume_series.legend = LegendOptions(
    visible=True,
    position="bottom-left",
    text=DEFAULT_LEGEND_TEXT.format(legendTitle="Volume: $$value$$"),
)

# Create the chart with range switcher
chart = Chart(
    options=ChartOptions(
        width=1000,
        height=600,
        # Enable range switcher
        range_switcher=range_switcher_config,
    ),
    series=[
        # Main candlestick chart (pane 0)
        candlestick_series,
        # 7-day SMA overlay (pane 0)
        sma_series,
        # Volume chart (pane 1)
        volume_series,
    ],
)

# Render the chart with position-specific key
chart_key = f"range_switcher_demo_{position.replace('-', '_')}"
try:
    chart.render(key=chart_key)
    st.success(f"✅ Main chart rendered successfully! (Position: {position})")
    
except Exception as e:
    st.error(f"❌ Main chart rendering failed: {e}")
    st.exception(e)  # Show full traceback

# Display information about the implementation
st.subheader("📋 Implementation Details")

col1, col2 = st.columns(2)

with col1:
    st.write(
        """
    **Time Calculation Logic:**
    - Uses the **last visible bar** as reference point
    - Calculates start time by subtracting range seconds
    - Aligns to hourly boundaries using interval information
    - Handles edge cases and data bounds properly
    """
    )

    st.code(
        """
    # Example: 1 Week range calculation
    last_bar_time = 1704067200  # Last candle timestamp
    range_seconds = 604800      # 1 week in seconds
    start_time = last_bar_time - range_seconds

    # Align to 1-hour boundary
    interval_seconds = 3600     # 1 hour
    aligned_start = floor(start_time / 3600) * 3600
    """,
        language="python",
    )

with col2:
    st.write(
        """
    **Range Options:**
    - **1D**: Shows last 24 hours of data
    - **1W**: Shows last 7 days of data
    - **1M**: Shows last 30 days of data
    - **3M**: Shows last 90 days of data
    - **1Y**: Shows last 365 days of data
    - **All**: Fits all available data
    """
    )

    st.write(
        f"""
    **Current Configuration:**
    - Position: `{position}`
    - Data Interval: `1h` (hourly candles)
    - Total Data Points: `{len(ohlc_data):,}`
    - Time Span: `{(ohlc_data[-1].time - ohlc_data[0].time) // 86400}` days
    """
    )

# Technical details section
with st.expander("🔧 Technical Implementation"):
    st.write(
        """
    ### Key Features Implemented:

    1. **Interval-Aware Calculations**:
       - Parses interval string (`1h`) into seconds (3600)
       - Aligns time ranges to candle boundaries
       - Prevents misaligned time windows

    2. **Smart Time Range Logic**:
       ```typescript
       private calculateStartTime(lastBarTime: number, rangeSeconds: number): number {
         let startTime = lastBarTime - rangeSeconds

         if (this.config.interval) {
           const intervalSeconds = this.parseInterval(this.config.interval)
           startTime = Math.floor(startTime / intervalSeconds) * intervalSeconds
         }

         return startTime
       }
       ```

    3. **Robust Error Handling**:
       - Fallback to `fitContent()` if calculations fail
       - Handles missing data gracefully
       - Validates time ranges against available data

    4. **Flexible Positioning**:
       - 6 position options (corners and centers)
       - Absolute positioning with proper z-index
       - Responsive to container size changes

    5. **Plugin Lifecycle Management**:
       - Proper creation and cleanup
       - Memory leak prevention
       - Integration with existing chart plugin system
    """
    )

st.info(
    """
💡 **Pro Tip**: The RangeSwitcher automatically calculates time ranges relative to your data's last candle,
ensuring accurate range selection regardless of your data's actual time span or interval.

⚠️ **Note**: Changing the button position may cause the chart to refresh. This is normal behavior as the 
range switcher plugin is reinitialized with the new position.
"""
)

