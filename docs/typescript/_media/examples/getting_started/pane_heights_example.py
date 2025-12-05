#!/usr/bin/env python3
"""Enhanced example demonstrating pane heights configuration in multi-pane charts.

This example shows how to use the pane_heights feature to control
the relative sizing of different panes in a multi-pane chart with
various scenarios and configurations.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st
from lightweight_charts_pro.charts.options import (
    ChartOptions,
    LayoutOptions,
    PaneHeightOptions,
)
from streamlit_lightweight_charts_pro.charts.series import (
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
)

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.data import CandlestickData, HistogramData, LineData

sys.path.insert(0, str(Path(__file__).parent))


st.set_page_config(page_title="Enhanced Pane Heights Example", layout="wide")
st.title("Enhanced Pane Heights Configuration Example")

st.write(
    """
This example demonstrates the powerful `pane_heights` configuration feature
that allows precise control over the relative sizing of different panes
in multi-pane charts. Perfect for creating professional trading dashboards
and financial analysis tools.
""",
)

# Generate comprehensive sample data
rng = np.random.default_rng(42)
dates = pd.date_range(start="2024-01-01", end="2024-12-31", freq="D")
n_days = len(dates)

# Price data (main chart)
base_price = 100
prices = [base_price]
for _i in range(1, n_days):
    change = rng.normal(0, 0.02)
    new_price = prices[-1] * (1 + change)
    prices.append(max(new_price, 1))  # Ensure positive prices

# Create OHLC data for candlestick
ohlc_data = []
for _i, price in enumerate(prices):
    open_price = price
    high_price = price * (1 + abs(rng.normal(0, 0.01)))
    low_price = price * (1 - abs(rng.normal(0, 0.01)))
    close_price = price * (1 + rng.normal(0, 0.005))

    ohlc_data.append(
        CandlestickData(
            time=int(dates[_i].timestamp()),
            open=open_price,
            high=high_price,
            low=low_price,
            close=close_price,
        ),
    )

# Volume data
volumes = rng.integers(1000, 10000, n_days)
volume_data = [
    HistogramData(time=int(dt.timestamp()), value=vol, color="#2196F3")
    for dt, vol in zip(dates, volumes)
]

# Simple moving average indicators
sma_20 = []
sma_50 = []
for _i in range(n_days):
    if _i < 19:
        sma_20.append(prices[_i])
    else:
        sma_20.append(np.mean(prices[_i - 19 : _i + 1]))

    if _i < 49:
        sma_50.append(prices[_i])
    else:
        sma_50.append(np.mean(prices[_i - 49 : _i + 1]))

sma_20_data = [LineData(time=int(dt.timestamp()), value=sma) for dt, sma in zip(dates, sma_20)]

sma_50_data = [LineData(time=int(dt.timestamp()), value=sma) for dt, sma in zip(dates, sma_50)]


# RSI indicator
def calculate_rsi(prices, period=14):
    deltas = np.diff(prices)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)

    avg_gains = []
    avg_losses = []

    for i in range(len(prices)):
        if i < period:
            avg_gains.append(0)
            avg_losses.append(0)
        else:
            avg_gain = np.mean(gains[i - period : i])
            avg_loss = np.mean(losses[i - period : i])
            avg_gains.append(avg_gain)
            avg_losses.append(avg_loss)

    rsi_values = []
    for i in range(len(prices)):
        if avg_losses[i] == 0:
            rsi_values.append(100)
        else:
            rs = avg_gains[i] / avg_losses[i]
            rsi = 100 - (100 / (1 + rs))
            rsi_values.append(rsi)

    return rsi_values


rsi_values = calculate_rsi(prices)
rsi_data = [LineData(time=int(dt.timestamp()), value=rsi) for dt, rsi in zip(dates, rsi_values)]

# Create tabs for different scenarios
tab1, tab2, tab3, tab4 = st.tabs(
    [
        "📊 Basic Configuration",
        "🎛️ Interactive Demo",
        "📈 Trading Dashboard",
        "🔧 Advanced Scenarios",
    ],
)

with tab1:
    st.subheader("Basic Pane Heights Configuration")
    st.write(
        """
    This demonstrates the fundamental pane heights configuration with three panes:
    - **Main Chart (Pane 0)**: 60% of total height (factor: 3.0)
    - **Volume (Pane 1)**: 20% of total height (factor: 1.0)
    - **RSI (Pane 2)**: 20% of total height (factor: 1.0)
    """,
    )

    # Basic chart with pane heights
    basic_chart = Chart(
        options=ChartOptions(
            width=800,
            height=600,
            layout=LayoutOptions(
                pane_heights={
                    0: PaneHeightOptions(factor=3.0),  # Main chart - 60% of height
                    1: PaneHeightOptions(factor=1.0),  # Volume - 20% of height
                    2: PaneHeightOptions(factor=1.0),  # RSI - 20% of height
                },
            ),
        ),
        series=[
            # Main candlestick chart (Pane 0)
            CandlestickSeries(data=ohlc_data, pane_id=0),
            # SMA indicators on main chart
            LineSeries(data=sma_20_data, pane_id=0),
            LineSeries(data=sma_50_data, pane_id=0),
            # Volume histogram (Pane 1)
            HistogramSeries(data=volume_data, pane_id=1),
            # RSI indicator (Pane 2)
            LineSeries(data=rsi_data, pane_id=2),
        ],
    )

    basic_chart.render(key="basic_pane_heights")

    st.code(
        """
# Basic configuration
chart = Chart(
    options=ChartOptions(
        layout=LayoutOptions(
            pane_heights={
                0: PaneHeightOptions(factor=3.0),  # 60% of height
                1: PaneHeightOptions(factor=1.0),  # 20% of height
                2: PaneHeightOptions(factor=1.0)   # 20% of height
            }
        )
    ),
    series=[
        CandlestickSeries(data=ohlc_data, pane_id=0),
        LineSeries(data=sma_20_data, pane_id=0),
        LineSeries(data=sma_50_data, pane_id=0),
        HistogramSeries(data=volume_data, pane_id=1),
        LineSeries(data=rsi_data, pane_id=2)
    ]
)
    """,
        language="python",
    )

with tab2:
    st.subheader("Interactive Pane Heights Demo")
    st.write(
        """
    Experiment with different factor values to see how the pane heights change in real-time.
    The factors determine the relative proportions of each pane.
    """,
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        factor_0 = st.slider("Main Chart Factor", 0.5, 5.0, 3.0, 0.1, key="interactive_factor_0")
        st.metric("Pane 0 Factor", factor_0)

    with col2:
        factor_1 = st.slider("Volume Factor", 0.5, 5.0, 1.0, 0.1, key="interactive_factor_1")
        st.metric("Pane 1 Factor", factor_1)

    with col3:
        factor_2 = st.slider("RSI Factor", 0.5, 5.0, 1.0, 0.1, key="interactive_factor_2")
        st.metric("Pane 2 Factor", factor_2)

    # Calculate percentages
    total_factor = factor_0 + factor_1 + factor_2
    pct_0 = (factor_0 / total_factor) * 100
    pct_1 = (factor_1 / total_factor) * 100
    pct_2 = (factor_2 / total_factor) * 100

    st.write(
        f"""
    **Resulting Heights:**
    - Main Chart: {pct_0:.1f}%
    - Volume: {pct_1:.1f}%
    - RSI: {pct_2:.1f}%
    """,
    )

    # Create interactive chart
    interactive_chart = Chart(
        options=ChartOptions(
            width=800,
            height=600,
            layout=LayoutOptions(
                pane_heights={
                    0: PaneHeightOptions(factor=factor_0),
                    1: PaneHeightOptions(factor=factor_1),
                    2: PaneHeightOptions(factor=factor_2),
                },
            ),
        ),
        series=[
            CandlestickSeries(data=ohlc_data, pane_id=0),
            LineSeries(data=sma_20_data, pane_id=0),
            LineSeries(data=sma_50_data, pane_id=0),
            HistogramSeries(data=volume_data, pane_id=1),
            LineSeries(data=rsi_data, pane_id=2),
        ],
    )

    interactive_chart.render(key="interactive_pane_heights")

with tab3:
    st.subheader("Professional Trading Dashboard")
    st.write(
        """
    A comprehensive trading dashboard with optimized pane heights for professional use.
    The main chart gets the most space, with supporting indicators in smaller panes.
    """,
    )

    # Trading dashboard with optimized heights
    dashboard_chart = Chart(
        options=ChartOptions(
            width=1000,
            height=700,
            layout=LayoutOptions(
                pane_heights={
                    0: PaneHeightOptions(factor=4.0),  # Main chart - 57% of height
                    1: PaneHeightOptions(factor=1.5),  # Volume - 21% of height
                    2: PaneHeightOptions(factor=1.0),  # RSI - 14% of height
                    3: PaneHeightOptions(factor=0.5),  # Additional indicator - 7% of height
                },
            ),
        ),
        series=[
            # Main candlestick chart (Pane 0)
            CandlestickSeries(data=ohlc_data, pane_id=0),
            # SMA indicators on main chart
            LineSeries(data=sma_20_data, pane_id=0),
            LineSeries(data=sma_50_data, pane_id=0),
            # Volume histogram (Pane 1)
            HistogramSeries(data=volume_data, pane_id=1),
            # RSI indicator (Pane 2)
            LineSeries(data=rsi_data, pane_id=2),
            # Additional indicator - price change (Pane 3)
            LineSeries(
                data=[
                    LineData(
                        time=int(dt.timestamp()),
                        value=((prices[_i] - prices[_i - 1]) / prices[_i - 1]) * 100,
                    )
                    for i, dt in enumerate(dates)
                    if _i > 0
                ],
                pane_id=3,
            ),
        ],
    )

    dashboard_chart.render(key="trading_dashboard")

    st.write(
        """
    **Dashboard Layout:**
    - **Main Chart (57%)**: Candlestick chart with moving averages
    - **Volume (21%)**: Volume histogram for trading activity
    - **RSI (14%)**: Relative Strength Index for momentum
    - **Price Change (7%)**: Daily price change percentage
    """,
    )

with tab4:
    st.subheader("Advanced Scenarios")
    st.write(
        """
    Explore different pane height configurations for various use cases.
    """,
    )

    scenario = st.selectbox(
        "Choose a scenario:",
        [
            "Equal Heights (1:1:1)",
            "Main Chart Focus (3:1:1)",
            "Volume Focus (1:3:1)",
            "Indicator Focus (1:1:3)",
            "Extreme Contrast (5:1:1)",
        ],
    )

    # Define scenarios
    scenarios = {
        "Equal Heights (1:1:1)": {0: 1.0, 1: 1.0, 2: 1.0},
        "Main Chart Focus (3:1:1)": {0: 3.0, 1: 1.0, 2: 1.0},
        "Volume Focus (1:3:1)": {0: 1.0, 1: 3.0, 2: 1.0},
        "Indicator Focus (1:1:3)": {0: 1.0, 1: 1.0, 2: 3.0},
        "Extreme Contrast (5:1:1)": {0: 5.0, 1: 1.0, 2: 1.0},
    }

    selected_factors = scenarios[scenario]

    # Calculate percentages
    total = sum(selected_factors.values())
    percentages = {k: (v / total) * 100 for k, v in selected_factors.items()}

    st.write(
        f"""
    **{scenario} Configuration:**
    - Main Chart: {percentages[0]:.1f}%
    - Volume: {percentages[1]:.1f}%
    - RSI: {percentages[2]:.1f}%
    """,
    )

    # Create scenario chart
    scenario_chart = Chart(
        options=ChartOptions(
            width=800,
            height=600,
            layout=LayoutOptions(
                pane_heights={
                    0: PaneHeightOptions(factor=selected_factors[0]),
                    1: PaneHeightOptions(factor=selected_factors[1]),
                    2: PaneHeightOptions(factor=selected_factors[2]),
                },
            ),
        ),
        series=[
            CandlestickSeries(data=ohlc_data, pane_id=0),
            LineSeries(data=sma_20_data, pane_id=0),
            LineSeries(data=sma_50_data, pane_id=0),
            HistogramSeries(data=volume_data, pane_id=1),
            LineSeries(data=rsi_data, pane_id=2),
        ],
    )

    scenario_chart.render(key="scenario_chart")

    st.code(
        f"""
# {scenario} configuration
chart = Chart(
    options=ChartOptions(
        layout=LayoutOptions(
            pane_heights={{
                0: PaneHeightOptions(factor={selected_factors[0]}),
                1: PaneHeightOptions(factor={selected_factors[1]}),
                2: PaneHeightOptions(factor={selected_factors[2]})
            }}
        )
    ),
    series=[...]
)
    """,
        language="python",
    )

# Footer with key concepts
st.markdown("---")
st.subheader("Key Concepts")

col1, col2, col3 = st.columns(3)

with col1:
    st.write(
        """
    **Pane Heights Factors:**
    - Factors determine relative pane sizes
    - Higher factors = larger panes
    - Total height divided proportionally
    """,
    )

with col2:
    st.write(
        """
    **Best Practices:**
    - Main chart: 2.0-4.0 factor
    - Volume: 1.0-2.0 factor
    - Indicators: 0.5-1.5 factor
    - Total factors: 3.0-8.0 recommended
    """,
    )

with col3:
    st.write(
        """
    **Use Cases:**
    - Trading dashboards
    - Financial analysis
    - Technical indicators
    - Multi-timeframe analysis
    """,
    )

st.write(
    """
### How Pane Heights Work:

1. **Factor Assignment**: Each pane gets a `factor` value in `PaneHeightOptions`
2. **Proportional Calculation**: Total height = sum of all factors
3. **Pane Sizing**: Each pane height = (factor / total_factors) × chart_height
4. **Dynamic Updates**: Factors can be changed programmatically or interactively

### Example Calculation:
- Factors: [3.0, 1.0, 1.0]
- Total: 5.0
- Heights: [60%, 20%, 20%]
""",
)
