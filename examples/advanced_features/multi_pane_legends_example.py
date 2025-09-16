"""
Multi-Pane Chart with Legends Example.

This example demonstrates a comprehensive multi-pane chart with legends for each pane:
- Main chart (pane 0): Candlestick data with moving averages
- RSI indicator (pane 1): RSI line with overbought/oversold levels
- Volume (pane 2): Volume histogram with moving average

Each pane has its own legend configuration with custom templates.
"""

import pandas as pd
import streamlit as st
import numpy as np

from streamlit_lightweight_charts_pro import (
    CandlestickSeries,
    Chart,
    ChartOptions,
    HistogramSeries,
    LayoutOptions,
    LegendOptions,
    LineSeries,
    PaneHeightOptions,
)
from streamlit_lightweight_charts_pro.data import (
    CandlestickData,
    HistogramData,
    LineData,
)

st.set_page_config(page_title="Multi-Pane Legends Example", page_icon="📊", layout="wide")

st.title("📊 Multi-Pane Chart with Legends Example")
st.markdown(
    """
This example demonstrates a comprehensive multi-pane chart with legends for each pane:
- **Main chart (pane 0)**: Candlestick data with moving averages
- **RSI indicator (pane 1)**: RSI line with overbought/oversold levels  
- **Volume (pane 2)**: Volume histogram with moving average

Each pane has its own legend configuration with custom HTML templates.
"""
)


def generate_market_data(days=60):
    """Generate sample market data."""

    np.random.seed(42)
    dates = pd.date_range(start="2024-01-01", periods=days, freq="D")

    # Generate price data
    base_price = 100
    returns = np.random.normal(0, 0.02, days)
    prices = [base_price]

    for ret in returns[1:]:
        prices.append(prices[-1] * (1 + ret))

    # Generate OHLC data
    data = []
    for i, (date, price) in enumerate(zip(dates, prices)):
        high = price * (1 + abs(np.random.normal(0, 0.01)))
        low = price * (1 - abs(np.random.normal(0, 0.01)))
        open_price = prices[i - 1] if i > 0 else price
        close_price = price
        volume = int(np.random.uniform(1000, 10000))

        data.append(
            {
                "time": date.strftime("%Y-%m-%d"),
                "open": round(open_price, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close_price, 2),
                "volume": volume,
            }
        )

    return pd.DataFrame(data)


def calculate_indicators(prices):
    """Calculate technical indicators."""
    df = prices.copy()

    # Calculate moving averages
    df["ma20"] = df["close"].rolling(window=20).mean()
    df["ma50"] = df["close"].rolling(window=50).mean()

    # Calculate RSI
    delta = df["close"].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df["rsi"] = 100 - (100 / (1 + rs))

    # Calculate volume moving average
    df["volume_ma"] = df["volume"].rolling(window=20).mean()

    return df


# Generate data
df = generate_market_data(100)
df = calculate_indicators(df)

# Prepare data for charts
candlestick_data = [
    CandlestickData(
        time=row["time"], open=row["open"], high=row["high"], low=row["low"], close=row["close"]
    )
    for _, row in df.iterrows()
    if pd.notna(row["open"])
]

ma20_data = [
    LineData(time=row["time"], value=row["ma20"])
    for _, row in df.iterrows()
    if pd.notna(row["ma20"])
]

ma50_data = [
    LineData(time=row["time"], value=row["ma50"])
    for _, row in df.iterrows()
    if pd.notna(row["ma50"])
]

rsi_data = [
    LineData(time=row["time"], value=row["rsi"]) for _, row in df.iterrows() if pd.notna(row["rsi"])
]

volume_data = [
    HistogramData(time=row["time"], value=row["volume"])
    for _, row in df.iterrows()
    if pd.notna(row["volume"])
]

volume_ma_data = [
    LineData(time=row["time"], value=row["volume_ma"])
    for _, row in df.iterrows()
    if pd.notna(row["volume_ma"])
]

# Create the multi-pane chart
st.header("🎯 Multi-Pane Chart with Custom Legends")

# Configuration options
col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("Pane 0 (Main Chart)")
    legend_position_0 = st.selectbox(
        "Legend Position",
        ["top-right", "top-left", "bottom-right", "bottom-left"],
        index=0,
        key="pos0",
    )

with col2:
    st.subheader("Pane 1 (RSI)")
    legend_position_1 = st.selectbox(
        "Legend Position",
        ["top-right", "top-left", "bottom-right", "bottom-left"],
        index=2,
        key="pos1",
    )

with col3:
    st.subheader("Pane 2 (Volume)")
    legend_position_2 = st.selectbox(
        "Legend Position",
        ["top-right", "top-left", "bottom-right", "bottom-left"],
        index=1,
        key="pos2",
    )

# Create the chart with custom legends for each pane
multi_pane_chart = Chart(
    options=ChartOptions(
        width=1200,
        height=800,
        layout=LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=3.0),  # Main chart (candlestick + MAs)
                1: PaneHeightOptions(factor=1.5),  # RSI
                2: PaneHeightOptions(factor=1.0),  # Volume
            }
        ),
    ),
    series=[
        # Main chart pane (pane_id=0)
        CandlestickSeries(data=candlestick_data, pane_id=0),
        LineSeries(data=ma20_data, pane_id=0),
        LineSeries(data=ma50_data, pane_id=0),
        # RSI pane (pane_id=1)
        LineSeries(data=rsi_data, pane_id=1),
        # Volume pane (pane_id=2)
        HistogramSeries(data=volume_data, pane_id=2),
        LineSeries(data=volume_ma_data, pane_id=2),
    ],
)

# Set titles and colors for the series
multi_pane_chart.series[0].title = "Price"
multi_pane_chart.series[1].title = "MA20"
multi_pane_chart.series[2].title = "MA50"
multi_pane_chart.series[3].title = "RSI (14)"
multi_pane_chart.series[4].title = "Volume"
multi_pane_chart.series[5].title = "Volume MA"

# Set legends for each series
multi_pane_chart.series[1].legend = LegendOptions(
    visible=True,
    position=legend_position_0,
    background_color="rgba(255, 255, 255, 0.95)",
    border_color="#e1e3e6",
    border_width=1,
    border_radius=4,
    padding=5,
    margin=4,
    z_index=1000,
    text=(
        "<div style='display: flex; align-items: center; margin-bottom: 4px;'><span"
        " style='width: 12px; height: 2px; background-color: #2196f3; margin-right:"
        " 6px; display: inline-block;'></span><span style='font-weight:"
        " bold;'>MA20</span><span style='margin-left: 8px; color: #2196f3; font-weight:"
        " bold;'>$$value$$</span></div>"
    ),
)

multi_pane_chart.series[3].legend = LegendOptions(
    visible=True,
    position=legend_position_1,
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#9c27b0",
    border_width=1,
    border_radius=4,
    padding=5,
    margin=4,
    z_index=1000,
    text=(
        "<div style='color: #9c27b0; font-size: 11px;'><strong>RSI (14)</strong>:"
        " $$value$$</div>"
    ),
)

multi_pane_chart.series[5].legend = LegendOptions(
    visible=True,
    position=legend_position_2,
    background_color="rgba(255, 255, 255, 0.9)",
    border_color="#ff5722",
    border_width=1,
    border_radius=4,
    padding=5,
    margin=4,
    z_index=1000,
    text=(
        "<div style='display: flex; align-items: center;'><span style='width: 8px;"
        " height: 8px; background-color: #ff5722; margin-right: 4px; border-radius:"
        " 2px;'></span><span>Volume MA</span><span style='margin-left: 6px; color:"
        " #ff5722;'>$$value$$</span></div>"
    ),
)

multi_pane_chart.series[1].line_options.color = "#2196f3"  # MA20
multi_pane_chart.series[2].line_options.color = "#ff9800"  # MA50
multi_pane_chart.series[3].line_options.color = "#9c27b0"  # RSI
multi_pane_chart.series[5].line_options.color = "#ff5722"  # Volume MA

# Render the chart
multi_pane_chart.render(key="multi_pane_legend")

# Show configuration details
st.header("📋 Configuration Details")

st.markdown("### Legend Configurations")

col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("Pane 0 - Main Chart")
    st.code(
        """
LegendOptions(
    position="top-right",
    text="<div style='display: flex; align-items: center; margin-bottom: 4px;'>
        <span style='width: 12px; height: 2px; background-color: {color}; margin-right: 6px; display: inline-block;'></span>
        <span style='font-weight: bold;'>{title}</span>
        <span style='margin-left: 8px; color: {color}; font-weight: bold;'>{value}</span>
    </div>"
)
"""
    )

with col2:
    st.subheader("Pane 1 - RSI")
    st.code(
        """
LegendOptions(
    position="bottom-left",
    text="<div style='color: {color}; font-size: 11px;'>
        <strong>{title}</strong>: {value}
    </div>"
)
"""
    )

with col3:
    st.subheader("Pane 2 - Volume")
    st.code(
        """
LegendOptions(
    position="top-left",
    text="<div style='display: flex; align-items: center;'>
        <span style='width: 8px; height: 8px; background-color: {color}; margin-right: 4px; border-radius: 2px;'></span>
        <span>{title}</span>
        <span style='margin-left: 6px; color: {color};'>{value}</span>
    </div>"
)
"""
    )

st.markdown("### Available Template Placeholders")

st.markdown(
    """
The `text` field supports a single placeholder that will be replaced by the frontend:

- **$$value$$**: Current value of the series at crosshair position

Note: Title and color should be handled directly in your HTML template using
the series title and color from your series configuration. This avoids
conflicts with Python's f-string syntax and other templating systems.

### Example Templates

```html
<!-- Simple template -->
<span style='color: #2196f3'>MA20: $$value$$</span>

<!-- Complex template with styling -->
<div style='background: #2196f3; padding: 5px; border-radius: 3px;'>
    <strong>Price</strong><br/>
    <span>Value: $$value$$</span><br/>
    <small>Type: Line</small>
</div>

<!-- Template with conditional styling -->
<span class='legend-item' style='color: #ff5722;'>
    RSI - $$value$$ (Oscillator)
</span>
```
"""
)

st.markdown("### Key Features")

st.markdown(
    """
1. **Per-Pane Legends**: Each pane can have its own legend configuration
2. **Custom HTML Templates**: Full control over legend appearance using HTML templates
3. **Dynamic Placeholders**: Template placeholders are replaced with actual data
4. **Flexible Positioning**: Different legend positions for each pane
5. **Customizable Styling**: Full control over colors, fonts, borders, etc.
6. **Responsive Design**: Legends adapt to chart size and positioning
"""
)

st.markdown("### Best Practices")

st.markdown(
    """
- Use descriptive series titles for better legend readability
- Choose appropriate legend positions that don't overlap with important chart data
- Keep templates simple and readable
- Use consistent color schemes between series and legend indicators
- Test templates with different data types and values
- Consider accessibility when choosing colors and fonts
"""
)
