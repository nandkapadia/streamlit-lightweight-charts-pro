"""
Trade Visualization Options Example.

This example demonstrates how to configure TradeVisualizationOptions
in the chart options for comprehensive trade visualization control.
"""

import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from streamlit_lightweight_charts_pro.data import OhlcvData, TradeData
from streamlit_lightweight_charts_pro.type_definitions.enums import TradeType, TradeVisualization


def generate_sample_ohlcv_data(n_periods=50):
    """Generate sample OHLCV data for demonstration."""
    np.random.seed(42)

    base_time = datetime(2024, 1, 1)
    prices = [100.0]

    for i in range(1, n_periods):
        price_change = np.random.normal(0, 2)
        prices.append(prices[-1] + price_change)

    ohlcv_data = []
    for i in range(n_periods):
        price = prices[i]

        # Create realistic OHLC from price
        open_price = price * (1 + np.random.normal(0, 0.01))
        high_price = max(open_price, price * (1 + abs(np.random.normal(0, 0.02))))
        low_price = min(open_price, price * (1 - abs(np.random.normal(0, 0.02))))
        close_price = price * (1 + np.random.normal(0, 0.01))

        # Ensure OHLC relationships
        high_price = max(open_price, high_price, close_price)
        low_price = min(open_price, low_price, close_price)

        volume = 1000000 * (1 + abs(price_change) * 10 + np.random.normal(0, 0.3))
        volume = max(volume, 100000)

        timestamp = int((base_time + timedelta(hours=i)).timestamp())

        ohlcv_data.append(
            OhlcvData(
                time=int(timestamp),  # Ensure Python int
                open=float(round(open_price, 2)),  # Ensure Python float
                high=float(round(high_price, 2)),  # Ensure Python float
                low=float(round(low_price, 2)),  # Ensure Python float
                close=float(round(close_price, 2)),  # Ensure Python float
                volume=int(volume),  # Ensure Python int
            )
        )

    return ohlcv_data


def create_sample_trades(ohlcv_data):
    """Create sample trades for demonstration."""
    trades = []
    n_periods = len(ohlcv_data)

    random.seed(42)

    for i in range(5):
        entry_idx = random.randint(0, n_periods - 2)
        exit_idx = random.randint(entry_idx + 1, n_periods - 1)

        entry_data = ohlcv_data[entry_idx]
        exit_data = ohlcv_data[exit_idx]

        entry_price = (entry_data.open + entry_data.close) / 2
        exit_price = (exit_data.open + exit_data.close) / 2

        trade_type = TradeType.LONG if exit_price > entry_price else TradeType.SHORT

        trade = TradeData(
            entry_time=int(entry_data.time),  # Ensure Python int
            exit_time=int(exit_data.time),  # Ensure Python int
            entry_price=float(round(entry_price, 2)),  # Ensure Python float
            exit_price=float(round(exit_price, 2)),  # Ensure Python float
            trade_type=trade_type,
            quantity=int(random.randint(100, 1000)),  # Ensure Python int
        )

        trades.append(trade)

    return trades


def main():
    """Main function to demonstrate TradeVisualizationOptions."""
    st.set_page_config(
        page_title="Trade Visualization Options Example", page_icon="📊", layout="wide"
    )

    st.title("📊 Trade Visualization Options Example")
    st.markdown(
        """
    This example demonstrates how to configure `TradeVisualizationOptions` 
    in the chart options for comprehensive trade visualization control.
    """
    )

    # Sidebar controls for TradeVisualizationOptions
    st.sidebar.header("🎯 Trade Visualization Configuration")

    # Style selection
    style_options = {
        "Markers Only": TradeVisualization.MARKERS,
        "Rectangles Only": TradeVisualization.RECTANGLES,
        "Both Markers and Rectangles": TradeVisualization.BOTH,
        "Lines Only": TradeVisualization.LINES,
        "Arrows Only": TradeVisualization.ARROWS,
        "Zones Only": TradeVisualization.ZONES,
    }

    selected_style = st.sidebar.selectbox(
        "Visualization Style",
        list(style_options.keys()),
        help="Choose the primary visualization style for trades",
    )

    # Marker options
    st.sidebar.subheader("🎨 Marker Options")
    entry_marker_color_long = st.sidebar.color_picker("Long Entry Color", "#2196F3")
    entry_marker_color_short = st.sidebar.color_picker("Short Entry Color", "#FF9800")
    exit_marker_color_profit = st.sidebar.color_picker("Profit Exit Color", "#4CAF50")
    exit_marker_color_loss = st.sidebar.color_picker("Loss Exit Color", "#F44336")
    marker_size = st.sidebar.slider("Marker Size", 10, 50, 20)
    show_pnl_in_markers = st.sidebar.checkbox("Show P&L in Markers", True)

    # Rectangle options
    st.sidebar.subheader("⬜ Rectangle Options")
    rectangle_fill_opacity = st.sidebar.slider("Fill Opacity", 0.0, 1.0, 0.2)
    rectangle_border_width = st.sidebar.slider("Border Width", 1, 5, 1)
    rectangle_color_profit = st.sidebar.color_picker("Profit Rectangle Color", "#4CAF50")
    rectangle_color_loss = st.sidebar.color_picker("Loss Rectangle Color", "#F44336")

    # Line options
    st.sidebar.subheader("📏 Line Options")
    line_width = st.sidebar.slider("Line Width", 1, 10, 2)
    line_style = st.sidebar.selectbox("Line Style", ["solid", "dashed", "dotted"])
    line_color_profit = st.sidebar.color_picker("Profit Line Color", "#4CAF50")
    line_color_loss = st.sidebar.color_picker("Loss Line Color", "#F44336")

    # Annotation options
    st.sidebar.subheader("📝 Annotation Options")
    show_trade_id = st.sidebar.checkbox("Show Trade ID", True)
    show_quantity = st.sidebar.checkbox("Show Quantity", True)
    show_trade_type = st.sidebar.checkbox("Show Trade Type", True)
    annotation_font_size = st.sidebar.slider("Font Size", 8, 20, 12)

    # Generate data
    st.subheader("📈 Data Generation")
    with st.spinner("Generating sample data..."):
        ohlcv_data = generate_sample_ohlcv_data(50)
        trades = create_sample_trades(ohlcv_data)

    st.success(f"✅ Generated {len(ohlcv_data)} OHLCV data points and {len(trades)} trades")
    st.write(style_options[selected_style])
    # Create TradeVisualizationOptions
    trade_viz_options = TradeVisualizationOptions(
        style=style_options[selected_style],
        # Marker options
        entry_marker_color_long=entry_marker_color_long,
        entry_marker_color_short=entry_marker_color_short,
        exit_marker_color_profit=exit_marker_color_profit,
        exit_marker_color_loss=exit_marker_color_loss,
        marker_size=marker_size,
        show_pnl_in_markers=show_pnl_in_markers,
        # Rectangle options
        rectangle_fill_opacity=rectangle_fill_opacity,
        rectangle_border_width=rectangle_border_width,
        rectangle_color_profit=rectangle_color_profit,
        rectangle_color_loss=rectangle_color_loss,
        # Line options
        line_width=line_width,
        line_style=line_style,
        line_color_profit=line_color_profit,
        line_color_loss=line_color_loss,
        # Annotation options
        show_trade_id=show_trade_id,
        show_quantity=show_quantity,
        show_trade_type=show_trade_type,
        annotation_font_size=annotation_font_size,
    )

    # Create ChartOptions with TradeVisualizationOptions
    chart_options = ChartOptions(height=500, trade_visualization=trade_viz_options)

    # Display current configuration
    st.subheader("⚙️ Current Trade Visualization Configuration")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Style", selected_style)
        st.metric("Marker Size", marker_size)
        st.metric("Line Width", line_width)
    with col2:
        st.metric("Fill Opacity", f"{rectangle_fill_opacity:.1f}")
        st.metric("Border Width", rectangle_border_width)
        st.metric("Font Size", annotation_font_size)
    with col3:
        st.metric("Show P&L", "Yes" if show_pnl_in_markers else "No")
        st.metric("Show Trade ID", "Yes" if show_trade_id else "No")
        st.metric("Show Quantity", "Yes" if show_quantity else "No")

    # Display trades table
    st.subheader("📊 Sample Trades")
    trades_df = pd.DataFrame(
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
        ]
    )

    st.dataframe(trades_df, use_container_width=True)

    # Create DataFrame for chart
    df_data = []
    for data_point in ohlcv_data:
        df_data.append(
            {
                "time": datetime.fromtimestamp(data_point.time),
                "open": data_point.open,
                "high": data_point.high,
                "low": data_point.low,
                "close": data_point.close,
                "volume": data_point.volume,
            }
        )

    df = pd.DataFrame(df_data)

    # Create chart with TradeVisualizationOptions using factory method
    st.subheader("📈 Chart with Trade Visualization Options")

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
        price_type="candlestick",
    )

    # Apply chart options after creation - FIXED: Merge options instead of replacing
    # Preserve existing options like overlay_price_scales while updating with new options
    if chart.options is None:
        chart.options = chart_options
    else:
        # Update individual properties to preserve overlay_price_scales
        chart.options.height = chart_options.height
        chart.options.trade_visualization = chart_options.trade_visualization
        # Add any other properties that need to be updated

    # Add trade visualization
    chart.add_trades(trades)
    # Display the chart
    chart.render(key="trade_viz_options_chart")

    # Display configuration details
    st.subheader("🔧 Configuration Details")
    st.json(chart.to_frontend_config())

    st.json(
        {
            "chart_options": {
                "height": chart_options.height,
                "trade_visualization": {
                    "style": trade_viz_options.style.value,
                    "marker_size": trade_viz_options.marker_size,
                    "show_pnl_in_markers": trade_viz_options.show_pnl_in_markers,
                    "rectangle_fill_opacity": trade_viz_options.rectangle_fill_opacity,
                    "line_width": trade_viz_options.line_width,
                    "line_style": trade_viz_options.line_style,
                    "show_trade_id": trade_viz_options.show_trade_id,
                    "show_quantity": trade_viz_options.show_quantity,
                    "annotation_font_size": trade_viz_options.annotation_font_size,
                },
            }
        }
    )

    # Code example
    st.subheader("💻 Code Example")
    st.code(
        """
# Create TradeVisualizationOptions
trade_viz_options = TradeVisualizationOptions(
    style=TradeVisualization.BOTH,
    entry_marker_color_long="#2196F3",
    entry_marker_color_short="#FF9800",
    exit_marker_color_profit="#4CAF50",
    exit_marker_color_loss="#F44336",
    marker_size=20,
    show_pnl_in_markers=True,
    rectangle_fill_opacity=0.2,
    line_width=2,
    line_style="dashed",
    show_trade_id=True,
    show_quantity=True
)

# Create ChartOptions with TradeVisualizationOptions
chart_options = ChartOptions(
    height=500,
    trade_visualization=trade_viz_options
)

# Create chart using factory method
chart = Chart.from_price_volume_dataframe(
    data=df,
    column_mapping={
        "time": "time",
        "open": "open",
        "high": "high",
        "low": "low",
        "close": "close",
        "volume": "volume"
    },
    price_type="candlestick"
)

# Apply chart options after creation
chart.update_options(**chart_options.asdict())

# Add trade visualization
chart.add_trade_visualization(trades)
chart.render(key="chart")
    """,
        language="python",
    )


if __name__ == "__main__":
    main()
