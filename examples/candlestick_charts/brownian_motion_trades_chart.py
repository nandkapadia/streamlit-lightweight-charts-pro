"""Brownian Motion Candlestick Chart with Trade Visualization Example.

This example demonstrates:
1. Generating OHLCV data using Brownian motion simulation
2. Identifying 10 random trades from the data
3. Visualizing the candlestick chart with trade markers
4. Using the Chart class with price-volume series
"""

import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import CandlestickSeries
from streamlit_lightweight_charts_pro.data import OhlcvData
from streamlit_lightweight_charts_pro.data.marker import BarMarker
from streamlit_lightweight_charts_pro.data.trade import TradeData
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    MarkerPosition,
    MarkerShape,
    TradeType,
)


def generate_brownian_motion_ohlcv(
    n_periods=180,
    initial_price=100.0,
    volatility=0.02,
    drift=0.0001,
    volume_base=1000000,
):
    """Generate OHLCV data using Brownian motion simulation.

    Args:
        n_periods: Number of periods to generate
        initial_price: Starting price
        volatility: Price volatility (standard deviation of returns)
        drift: Price drift (mean return per period)
        volume_base: Base volume level

    Returns:
        List of OhlcvData objects
    """
    # Set random seed for reproducibility
    rng = np.random.default_rng(42)

    # Generate price movements using Brownian motion
    returns = rng.normal(drift, volatility, n_periods)
    prices = [initial_price]

    for i in range(1, n_periods):
        new_price = prices[-1] * (1 + returns[i])
        prices.append(new_price)

    # Convert to OHLC data
    ohlcv_data = []
    base_time = datetime(2024, 1, 1)

    for i in range(n_periods):
        # Create realistic OHLC from the price movement
        price = prices[i]

        # Add some intra-period volatility
        intra_volatility = volatility * 0.5
        open_price = price * (1 + rng.normal(0, intra_volatility * 0.1))
        high_price = max(open_price, price * (1 + abs(rng.normal(0, intra_volatility))))
        low_price = min(open_price, price * (1 - abs(rng.normal(0, intra_volatility))))
        close_price = price * (1 + rng.normal(0, intra_volatility * 0.1))

        # Ensure OHLC relationships are maintained
        high_price = max(open_price, high_price, close_price)
        low_price = min(open_price, low_price, close_price)

        # Generate volume with some correlation to price movement
        volume = volume_base * (1 + abs(returns[i]) * 10 + rng.normal(0, 0.3))
        volume = max(volume, volume_base * 0.1)  # Minimum volume

        # Convert time to timestamp
        timestamp = int((base_time + timedelta(hours=i)).timestamp())

        ohlcv_data.append(
            OhlcvData(
                time=timestamp,
                open=round(open_price, 2),
                high=round(high_price, 2),
                low=round(low_price, 2),
                close=round(close_price, 2),
                volume=int(volume),
            ),
        )

    return ohlcv_data


def identify_trades(ohlcv_data, num_trades=10):
    """Identify random trades from the OHLCV data.

    Args:
        ohlcv_data: List of OhlcvData objects
        num_trades: Number of trades to identify

    Returns:
        List of TradeData objects
    """
    trades = []
    n_periods = len(ohlcv_data)

    # Set random seed for reproducibility
    random.seed(42)

    for _i in range(num_trades):
        # Random entry and exit points
        entry_idx = random.randint(0, n_periods - 2)  # noqa: S311
        exit_idx = random.randint(entry_idx + 1, n_periods - 1)  # noqa: S311

        entry_data = ohlcv_data[entry_idx]
        exit_data = ohlcv_data[exit_idx]

        # Calculate entry and exit prices as midpoint of open and close
        entry_price = (entry_data.open + entry_data.close) / 2
        exit_price = (exit_data.open + exit_data.close) / 2

        # Determine trade type based on price movement
        trade_type = TradeType.LONG if exit_price > entry_price else TradeType.SHORT

        # Create trade object
        trade = TradeData(
            entry_time=entry_data.time,
            exit_time=exit_data.time,
            entry_price=round(entry_price, 2),
            exit_price=round(exit_price, 2),
            trade_type=trade_type,
            quantity=random.randint(100, 1000),  # noqa: S311  # Random position size
        )

        trades.append(trade)

    return trades


def get_trade_visualization_options():
    """Get trade visualization options from user input.

    Returns:
        dict: Trade visualization configuration
    """
    st.sidebar.subheader("🎯 Trade Visualization Options")

    # Number of trades
    num_trades = st.sidebar.slider(
        "Number of Trades",
        min_value=1,
        max_value=20,
        value=10,
        help="Number of trades to generate and display",
    )

    # Trade display style
    display_style = st.sidebar.selectbox(
        "Trade Display Style",
        ["Markers Only", "Markers with PnL", "Markers with Details", "Minimal"],
        help="Choose how trades are displayed on the chart",
    )

    # Marker colors
    st.sidebar.subheader("🎨 Marker Colors")

    col1, col2 = st.sidebar.columns(2)
    with col1:
        long_entry_color = st.color_picker(
            "Long Entry",
            "#2196F3",
            help="Color for long trade entry markers",
        )
        long_exit_color = st.color_picker(
            "Long Exit",
            "#4CAF50",
            help="Color for long trade exit markers",
        )
    with col2:
        short_entry_color = st.color_picker(
            "Short Entry",
            "#FF9800",
            help="Color for short trade entry markers",
        )
        short_exit_color = st.color_picker(
            "Short Exit",
            "#F44336",
            help="Color for short trade exit markers",
        )

    # Marker shapes
    st.sidebar.subheader("🔺 Marker Shapes")
    entry_shape = st.sidebar.selectbox(
        "Entry Shape",
        ["arrow_up", "arrow_down", "circle", "square"],
        help="Shape for trade entry markers",
    )
    exit_shape = st.sidebar.selectbox(
        "Exit Shape",
        ["arrow_down", "arrow_up", "circle", "square"],
        help="Shape for trade exit markers",
    )

    # Marker positions
    st.sidebar.subheader("📍 Marker Positions")
    long_entry_position = st.sidebar.selectbox(
        "Long Entry Position",
        ["below_bar", "above_bar", "in_bar"],
        help="Position for long trade entry markers",
    )
    long_exit_position = st.sidebar.selectbox(
        "Long Exit Position",
        ["above_bar", "below_bar", "in_bar"],
        help="Position for long trade exit markers",
    )
    short_entry_position = st.sidebar.selectbox(
        "Short Entry Position",
        ["above_bar", "below_bar", "in_bar"],
        help="Position for short trade entry markers",
    )
    short_exit_position = st.sidebar.selectbox(
        "Short Exit Position",
        ["below_bar", "above_bar", "in_bar"],
        help="Position for short trade exit markers",
    )

    # Additional options
    st.sidebar.subheader("⚙️ Additional Options")
    show_trade_ids = st.sidebar.checkbox(
        "Show Trade IDs",
        value=True,
        help="Display trade numbers on markers",
    )
    show_quantity = st.sidebar.checkbox(
        "Show Quantity",
        value=False,
        help="Display trade quantity on markers",
    )
    show_duration = st.sidebar.checkbox(
        "Show Duration",
        value=False,
        help="Display trade duration on markers",
    )

    return {
        "num_trades": num_trades,
        "display_style": display_style,
        "colors": {
            "long_entry": long_entry_color,
            "long_exit": long_exit_color,
            "short_entry": short_entry_color,
            "short_exit": short_exit_color,
        },
        "shapes": {"entry": entry_shape, "exit": exit_shape},
        "positions": {
            "long_entry": long_entry_position,
            "long_exit": long_exit_position,
            "short_entry": short_entry_position,
            "short_exit": short_exit_position,
        },
        "options": {
            "show_trade_ids": show_trade_ids,
            "show_quantity": show_quantity,
            "show_duration": show_duration,
        },
    }


def create_custom_trade_markers(trades, options):
    """Create custom trade markers based on user options.

    Args:
        trades: List of TradeData objects
        options: Trade visualization options

    Returns:
        List of Marker objects
    """
    markers = []

    # Shape mapping
    shape_mapping = {
        "arrow_up": MarkerShape.ARROW_UP,
        "arrow_down": MarkerShape.ARROW_DOWN,
        "circle": MarkerShape.CIRCLE,
        "square": MarkerShape.SQUARE,
    }

    # Position mapping
    position_mapping = {
        "above_bar": MarkerPosition.ABOVE_BAR,
        "below_bar": MarkerPosition.BELOW_BAR,
        "in_bar": MarkerPosition.IN_BAR,
    }

    for i, trade in enumerate(trades):
        # Determine colors based on trade type
        if trade.trade_type == TradeType.LONG:
            entry_color = options["colors"]["long_entry"]
            exit_color = options["colors"]["long_exit"]
            entry_position = position_mapping[options["positions"]["long_entry"]]
            exit_position = position_mapping[options["positions"]["long_exit"]]
        else:  # SHORT
            entry_color = options["colors"]["short_entry"]
            exit_color = options["colors"]["short_exit"]
            entry_position = position_mapping[options["positions"]["short_entry"]]
            exit_position = position_mapping[options["positions"]["short_exit"]]

        # Create entry marker text
        entry_text_parts = []
        if options["options"]["show_trade_ids"]:
            entry_text_parts.append(f"#{i + 1}")
        entry_text_parts.append(f"Entry: ${trade.entry_price:.2f}")
        if options["options"]["show_quantity"]:
            entry_text_parts.append(f"Qty: {trade.quantity}")

        entry_text = " - ".join(entry_text_parts)

        # Create exit marker text
        exit_text_parts = []
        if options["options"]["show_trade_ids"]:
            exit_text_parts.append(f"#{i + 1}")
        exit_text_parts.append(f"Exit: ${trade.exit_price:.2f}")

        # Add PnL based on display style
        if options["display_style"] in ["Markers with PnL", "Markers with Details"]:
            exit_text_parts.append(f"P&L: ${trade.pnl:.2f}")
            exit_text_parts.append(f"{trade.pnl_percentage:+.1f}%")

        if options["options"]["show_quantity"]:
            exit_text_parts.append(f"Qty: {trade.quantity}")

        if options["options"]["show_duration"]:
            duration_hours = trade.exit_timestamp - trade.entry_timestamp
            exit_text_parts.append(f"Dur: {duration_hours}h")

        exit_text = " - ".join(exit_text_parts)

        # Create entry marker
        entry_marker = BarMarker(
            time=trade.entry_timestamp,
            position=entry_position,
            shape=shape_mapping[options["shapes"]["entry"]],
            color=entry_color,
            text=entry_text,
        )
        markers.append(entry_marker)

        # Create exit marker
        exit_marker = BarMarker(
            time=trade.exit_timestamp,
            position=exit_position,
            shape=shape_mapping[options["shapes"]["exit"]],
            color=exit_color,
            text=exit_text,
        )
        markers.append(exit_marker)

    return markers


def main():
    """Main function to create and display the chart."""
    st.set_page_config(
        page_title="Brownian Motion Candlestick Chart with Trades",
        page_icon="📈",
        layout="wide",
    )

    st.title("📈 Brownian Motion Candlestick Chart with Trade Visualization")
    st.markdown(
        """
    This example demonstrates:
    - **OHLCV Data Generation**: Using Brownian motion simulation
    - **Trade Identification**: 10 random trades with realistic entry/exit points
    - **Trade Visualization**: Trades displayed as markers on the chart
    - **Price-Volume Chart**: Candlestick chart with volume histogram
    - **Interactive Trade Display**: Customize how trades are shown on the chart
    """,
    )

    # Get trade visualization options from sidebar
    trade_options = get_trade_visualization_options()

    # Chart customization options
    st.sidebar.subheader("📊 Chart Options")
    chart_height = st.sidebar.slider(
        "Chart Height",
        min_value=300,
        max_value=800,
        value=500,
        help="Height of the chart in pixels",
    )

    show_grid = st.sidebar.checkbox("Show Grid", value=True, help="Display grid lines on the chart")

    show_volume = st.sidebar.checkbox("Show Volume", value=True, help="Display volume histogram")

    # Generate OHLCV data
    st.subheader("🔧 Data Generation")
    with st.spinner("Generating Brownian motion OHLCV data..."):
        ohlcv_data = generate_brownian_motion_ohlcv(n_periods=180)

    st.success(f"✅ Generated {len(ohlcv_data)} OHLCV data points")

    # Display data statistics
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Data Points", len(ohlcv_data))
    with col2:
        price_range = max(d.close for d in ohlcv_data) - min(d.close for d in ohlcv_data)
        st.metric("Price Range", f"${price_range:.2f}")
    with col3:
        avg_volume = sum(d.volume for d in ohlcv_data) / len(ohlcv_data)
        st.metric("Avg Volume", f"{avg_volume:,.0f}")
    with col4:
        total_volume = sum(d.volume for d in ohlcv_data)
        st.metric("Total Volume", f"{total_volume:,.0f}")

    # Identify trades
    st.subheader("🎯 Trade Identification")
    with st.spinner("Identifying trades..."):
        trades = identify_trades(ohlcv_data, num_trades=trade_options["num_trades"])

    st.success(f"✅ Identified {len(trades)} trades")

    # Display current trade visualization settings
    st.subheader("⚙️ Current Trade Visualization Settings")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Display Style", trade_options["display_style"])
        st.metric("Entry Shape", trade_options["shapes"]["entry"])
        st.metric("Exit Shape", trade_options["shapes"]["exit"])
    with col2:
        st.metric("Long Entry Position", trade_options["positions"]["long_entry"])
        st.metric("Long Exit Position", trade_options["positions"]["long_exit"])
        st.metric("Show Trade IDs", "Yes" if trade_options["options"]["show_trade_ids"] else "No")
    with col3:
        st.metric("Short Entry Position", trade_options["positions"]["short_entry"])
        st.metric("Short Exit Position", trade_options["positions"]["short_exit"])
        st.metric("Show Quantity", "Yes" if trade_options["options"]["show_quantity"] else "No")

    # Display trades table
    st.subheader("📊 Identified Trades")
    trades_trades_data = pd.DataFrame(
        [
            {
                "Trade #": i + 1,
                "Type": trade.trade_type.value.upper(),
                "Entry Time": (
                    datetime.fromtimestamp(trade.entry_timestamp).strftime("%Y-%m-%d %H:%M")
                ),
                "Exit Time": (
                    datetime.fromtimestamp(trade.exit_timestamp).strftime("%Y-%m-%d %H:%M")
                ),
                "Entry Price": f"${trade.entry_price:.2f}",
                "Exit Price": f"${trade.exit_price:.2f}",
                "Quantity": trade.quantity,
                "PnL": f"${trade.pnl:.2f}",
                "Duration": f"{trade.exit_timestamp - trade.entry_timestamp} hours",
            }
            for i, trade in enumerate(trades)
        ],
    )

    st.dataframe(trades_trades_data, use_container_width=True)

    # Create chart
    st.subheader("📈 Chart Visualization")

    # Create DataFrame for the chart
    df_data = [
        {
            "time": datetime.fromtimestamp(data_point.time),
            "open": data_point.open,
            "high": data_point.high,
            "low": data_point.low,
            "close": data_point.close,
            "volume": data_point.volume,
        }
        for data_point in ohlcv_data
    ]

    trades_data = pd.DataFrame(df_data)
    # Keep time as a column instead of index

    # Create chart with price-volume series
    chart = Chart()

    # Update chart options
    chart.update_options(
        height=chart_height,
        grid={
            "vertLines": {"visible": show_grid, "color": "#e1e3e6"},
            "horzLines": {"visible": show_grid, "color": "#e1e3e6"},
        },
    )

    # Add candlestick series with volume
    if show_volume:
        chart.add_price_volume_series(
            data=trades_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
                "volume": "volume",
            },
            price_type="candlestick",
            volume_kwargs={"up_color": "rgba(38,166,154,0.5)", "down_color": "rgba(239,83,80,0.5)"},
        )
    else:
        # Add only candlestick series without volume
        candlestick_series = CandlestickSeries(
            data=trades_data,
            column_mapping={
                "time": "time",
                "open": "open",
                "high": "high",
                "low": "low",
                "close": "close",
            },
        )
        chart.add_series(candlestick_series)

    # Create custom trade markers based on user options
    if trade_options["display_style"] != "Minimal":
        custom_markers = create_custom_trade_markers(trades, trade_options)

        # Add markers to the candlestick series
        if chart.series and len(chart.series) > 0:
            candlestick_series = chart.series[0]  # First series is the candlestick series
            if hasattr(candlestick_series, "markers"):
                candlestick_series.markers.extend(custom_markers)

    # Display the chart
    chart.render(key="brownian_motion_chart")

    # Display trade statistics
    st.subheader("📊 Trade Statistics")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        winning_trades = [t for t in trades if t.pnl > 0]
        st.metric(
            "Winning Trades",
            len(winning_trades),
            f"{len(winning_trades) / len(trades) * 100:.1f}%",
        )

    with col2:
        losing_trades = [t for t in trades if t.pnl < 0]
        st.metric(
            "Losing Trades",
            len(losing_trades),
            f"{len(losing_trades) / len(trades) * 100:.1f}%",
        )

    with col3:
        total_pnl = sum(t.pnl for t in trades)
        st.metric("Total PnL", f"${total_pnl:.2f}")

    with col4:
        avg_pnl = total_pnl / len(trades)
        st.metric("Avg PnL per Trade", f"${avg_pnl:.2f}")

    # Display additional information
    st.subheader("ℹ️ About This Example")
    st.markdown(
        """
    **Brownian Motion Simulation:**
    - Uses geometric Brownian motion to simulate realistic price movements
    - Includes drift (trend) and volatility components
    - Generates realistic OHLC relationships

    **Trade Identification:**
    - Random entry and exit points across the data
    - Entry/exit prices calculated as midpoint of open and close
    - Trade type determined by price direction (LONG/SHORT)
    - Random position sizes and realistic PnL calculations

    **Visualization Features:**
    - Candlestick chart with volume histogram
    - Trade markers showing entry and exit points
    - Color-coded volume bars (green for up, red for down)
    - Interactive chart with zoom and pan capabilities
    """,
    )


if __name__ == "__main__":
    main()
