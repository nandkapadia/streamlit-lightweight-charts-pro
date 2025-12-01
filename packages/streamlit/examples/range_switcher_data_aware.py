"""Example: Automatic Range Filtering

This example demonstrates how the range switcher automatically hides ranges
that exceed the available data timespan, providing a better user experience
by only showing relevant time periods. This filtering happens automatically
in the frontend - no configuration needed!
"""

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro import st_lightweight_charts

# Configure page
st.set_page_config(page_title="Data-Aware Range Switcher", layout="wide")
st.title("📊 Automatic Range Filtering Example")

st.markdown(
    """
This example shows how the range switcher can automatically hide ranges that are larger
than the available data period. This prevents users from selecting time ranges that
would show mostly empty space.
""",
)

# Create sample data with different timespans
data_period = st.selectbox(
    "Select Data Period:",
    options=[
        ("2 Hours", 2 * 3600),
        ("1 Day", 24 * 3600),
        ("1 Week", 7 * 24 * 3600),
        ("1 Month", 30 * 24 * 3600),
        ("6 Months", 180 * 24 * 3600),
    ],
    format_func=lambda x: x[0],
    index=2,  # Default to 1 Week
)

period_name, period_seconds = data_period

# Generate sample data for the selected period
end_time = pd.Timestamp.now()
start_time = end_time - pd.Timedelta(seconds=period_seconds)

# Create hourly data points
num_points = min(500, period_seconds // 3600)  # Max 500 points, hourly intervals
time_range = pd.date_range(start=start_time, end=end_time, periods=num_points)

# Generate realistic price data
rng = np.random.default_rng(42)
returns = rng.normal(0.001, 0.02, len(time_range))
prices = 100 * np.exp(np.cumsum(returns))

data = pd.DataFrame(
    {
        "time": time_range,
        "open": prices * (1 + rng.normal(0, 0.001, len(prices))),
        "high": prices * (1 + np.abs(rng.normal(0, 0.005, len(prices)))),
        "low": prices * (1 - np.abs(rng.normal(0, 0.005, len(prices)))),
        "close": prices,
        "volume": rng.integers(1000, 10000, len(prices)),
    },
)

# Ensure high >= max(open, close) and low <= min(open, close)
data["high"] = np.maximum(data["high"], np.maximum(data["open"], data["close"]))
data["low"] = np.minimum(data["low"], np.minimum(data["open"], data["close"]))

# Display data information
col1, col2 = st.columns(2)
with col1:
    st.metric("Data Period", period_name)
    st.metric("Data Points", len(data))
with col2:
    st.metric("Start Time", start_time.strftime("%Y-%m-%d %H:%M"))
    st.metric("End Time", end_time.strftime("%Y-%m-%d %H:%M"))

# Chart configuration options
st.subheader("⚙️ Range Switcher Configuration")

col1, col2 = st.columns(2)
with col1:
    hide_invalid = st.checkbox(
        "Hide Invalid Ranges",
        value=True,
        help="Hide ranges that are larger than the available data period",
    )

with col2:
    range_preset = st.selectbox(
        "Range Preset:",
        options=["Trading", "Short Term", "Long Term", "Minimal"],
        help="Different preset range configurations",
    )

# Define ranges based on preset
range_configs = {
    "Trading": [
        {"text": "1D", "range": "ONE_DAY"},
        {"text": "7D", "range": "ONE_WEEK"},
        {"text": "1M", "range": "ONE_MONTH"},
        {"text": "3M", "range": "THREE_MONTHS"},
        {"text": "1Y", "range": "ONE_YEAR"},
        {"text": "All", "range": "ALL"},
    ],
    "Short Term": [
        {"text": "5M", "range": "FIVE_MINUTES"},
        {"text": "15M", "range": "FIFTEEN_MINUTES"},
        {"text": "30M", "range": "THIRTY_MINUTES"},
        {"text": "1H", "range": "ONE_HOUR"},
        {"text": "4H", "range": "FOUR_HOURS"},
        {"text": "1D", "range": "ONE_DAY"},
        {"text": "All", "range": "ALL"},
    ],
    "Long Term": [
        {"text": "1M", "range": "ONE_MONTH"},
        {"text": "3M", "range": "THREE_MONTHS"},
        {"text": "6M", "range": "SIX_MONTHS"},
        {"text": "1Y", "range": "ONE_YEAR"},
        {"text": "2Y", "range": "TWO_YEARS"},
        {"text": "5Y", "range": "FIVE_YEARS"},
        {"text": "All", "range": "ALL"},
    ],
    "Minimal": [
        {"text": "1D", "range": "ONE_DAY"},
        {"text": "1W", "range": "ONE_WEEK"},
        {"text": "1M", "range": "ONE_MONTH"},
        {"text": "All", "range": "ALL"},
    ],
}

# Chart configuration
chart_options = {
    "layout": {
        "textColor": "black",
        "background": {"color": "white"},
    },
    "grid": {
        "vertLines": {"color": "rgba(42, 46, 57, 0.1)"},
        "horzLines": {"color": "rgba(42, 46, 57, 0.1)"},
    },
    "timeScale": {
        "borderColor": "rgba(42, 46, 57, 0.1)",
    },
    "rightPriceScale": {
        "borderColor": "rgba(42, 46, 57, 0.1)",
    },
}

# Range switcher configuration
range_switcher_config = {
    "visible": True,
    "position": "top-right",
    "ranges": range_configs[range_preset],
    "hideInvalidRanges": hide_invalid,
}

# Legend configuration
legend_config = {
    "visible": True,
    "position": "top-left",
    "text": "OHLC",
}

# UI options
ui_options = {
    "rangeSwitcher": range_switcher_config,
    "legend": legend_config,
}

# Create the chart
st.subheader("📈 Chart with Data-Aware Range Switcher")

chart_data = st_lightweight_charts(
    data.to_dict("records"),
    chart_type="candlestick",
    height=600,
    width=None,
    chart_options=chart_options,
    ui_options=ui_options,
    key=f"chart_{period_name}_{hide_invalid}_{range_preset}",
)

# Information about the feature
st.subheader("ℹ️ How Data-Aware Range Filtering Works")

st.markdown(
    f"""
**Current Data Period:** {period_name} ({period_seconds:,} seconds)

**Frontend Range Filtering Logic:**
- When `hideInvalidRanges` is enabled,
    the frontend JavaScript analyzes the chart's actual data timespan
- Range buttons that exceed the data period by more than 10% are dynamically hidden (display: none)
- The "All" range is always visible as it shows the complete dataset
- Buttons are hidden/shown in real-time as data changes without full page reloads
- This provides a better user experience by only showing relevant time periods

**Expected Frontend Behavior for {period_name} data:**

*Note: The filtering happens in the frontend JavaScript after the chart loads the data.*
""",
)

# Show which ranges should be visible
range_seconds_map = {
    "FIVE_MINUTES": 300,
    "FIFTEEN_MINUTES": 900,
    "THIRTY_MINUTES": 1800,
    "ONE_HOUR": 3600,
    "FOUR_HOURS": 14400,
    "ONE_DAY": 86400,
    "ONE_WEEK": 604800,
    "ONE_MONTH": 2592000,
    "THREE_MONTHS": 7776000,
    "SIX_MONTHS": 15552000,
    "ONE_YEAR": 31536000,
    "TWO_YEARS": 63072000,
    "FIVE_YEARS": 157680000,
    "ALL": None,
}

current_ranges = range_configs[range_preset]
buffer_multiplier = 1.1

for range_item in current_ranges:
    range_name = range_item["text"]
    range_enum = range_item["range"]
    range_seconds = range_seconds_map.get(range_enum)

    if range_seconds is None:
        status = "✅ Always Visible (All data)"
    elif range_seconds <= (period_seconds * buffer_multiplier):
        status = "✅ Visible"
    else:
        status = (
            "❌ Hidden (exceeds data period)" if hide_invalid else "⚠️ Visible (but mostly empty)"
        )

    if range_seconds:
        st.write(f"- **{range_name}** ({range_seconds:,}s): {status}")
    else:
        st.write(f"- **{range_name}**: {status}")

# Tips for usage
st.subheader("💡 Usage Tips")

st.markdown(
    """
1. **Frontend Processing:** Range filtering happens in the browser after chart data is loaded
2. **Real-time Updates:** Button visibility updates automatically when chart data changes
3. **Performance:** Efficient DOM manipulation - buttons are hidden/shown rather than
    destroyed/recreated
4. **Configuration:** Enable/disable filtering via the `hideInvalidRanges` option
5. **Debugging:** Hidden buttons have `data-hidden-reason="exceeds-data-range"` attribute
6. **Data Detection:** Frontend monitors chart data changes and updates button
    visibility accordingly
7. **No Page Reloads:** All filtering happens client-side for smooth user experience
""",
)

# Show raw data sample
with st.expander("📋 View Sample Data"):
    st.dataframe(data.head(10))
