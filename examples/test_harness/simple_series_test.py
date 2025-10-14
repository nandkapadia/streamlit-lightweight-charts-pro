"""Simple Series Test Harness.

Quick visual test for all series types with realistic data.
Use this to confirm everything works before pushing or when debugging.

Usage:
    streamlit run simple_series_test.py
    python run_test.py
"""

import random
from datetime import datetime, timedelta

import streamlit as st

from streamlit_lightweight_charts_pro import (
    AreaSeries,
    BandSeries,
    BarSeries,
    BaselineSeries,
    CandlestickSeries,
    Chart,
    ChartManager,
    GradientRibbonSeries,
    HistogramSeries,
    LineSeries,
    RibbonSeries,
    SignalSeries,
    TrendFillSeries,
    create_arrow_annotation,
    create_text_annotation,
)
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.sync_options import SyncOptions
from streamlit_lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from streamlit_lightweight_charts_pro.data import (
    BandData,
    GradientRibbonData,
    OhlcvData,
    RibbonData,
    SignalData,
    SingleValueData,
    TradeData,
    TrendFillData,
)
from streamlit_lightweight_charts_pro.type_definitions.enums import TradeVisualization


def generate_sample_data(points: int = 100) -> dict:
    """Generate realistic sample data with trends.

    Args:
        points: Number of data points to generate

    Returns:
        dict: Contains all data types needed for testing
    """
    base_time = datetime(2024, 1, 1)
    times = [(base_time + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%S") for i in range(points)]

    # OHLCV data with realistic trends
    ohlcv_data = []
    base_price = 100
    trend_phases = [
        (0, 25, 1.5),  # Uptrend
        (25, 50, -1.2),  # Downtrend
        (50, 75, 2.0),  # Strong uptrend
        (75, 100, -0.8),  # Mild downtrend
    ]

    for i in range(points):
        # Apply trend
        trend = 0
        for start, end, strength in trend_phases:
            if start <= i < end:
                trend = strength
                break

        change = random.uniform(-1, 1) + (trend * 0.3)
        base_price = max(50, base_price + change)

        # Generate realistic OHLC
        spread = base_price * 0.02
        open_price = base_price + random.uniform(-spread, spread)
        close = base_price + random.uniform(-spread, spread)
        high = max(open_price, close) + abs(random.uniform(0, spread))
        low = min(open_price, close) - abs(random.uniform(0, spread))

        ohlcv_data.append(
            OhlcvData(
                time=times[i],
                open=round(open_price, 2),
                high=round(high, 2),
                low=round(low, 2),
                close=round(close, 2),
                volume=random.randint(5000, 15000),
            ),
        )

    # Line data
    line_data = [
        SingleValueData(times[i], round(ohlcv_data[i].close + random.uniform(-2, 2), 2))
        for i in range(points)
    ]

    # Volume data
    volume_data = [SingleValueData(times[i], ohlcv_data[i].volume) for i in range(points)]

    # Trend fill data with HLC3 baseline and EMA20 trend
    # Calculate HLC3 (high + low + close) / 3
    hlc3_values = [(d.high + d.low + d.close) / 3 for d in ohlcv_data]

    # Calculate EMA20
    ema_period = 20
    ema_values = []
    multiplier = 2 / (ema_period + 1)

    for i in range(points):
        if i == 0:
            # First EMA value is the first HLC3 value
            ema_values.append(hlc3_values[0])
        else:
            # EMA formula: EMA = (Close - EMA(previous)) * multiplier + EMA(previous)
            ema = (hlc3_values[i] - ema_values[-1]) * multiplier + ema_values[-1]
            ema_values.append(ema)

    # Create trend fill data
    trend_data = []
    for i in range(points):
        # Determine trend direction based on HLC3 vs EMA20
        trend_direction = 1 if hlc3_values[i] > ema_values[i] else -1

        trend_data.append(
            TrendFillData(
                time=times[i],
                base_line=round(hlc3_values[i], 2),  # HLC3
                trend_line=round(ema_values[i], 2),  # EMA20
                trend_direction=trend_direction,
            ),
        )

    # Band data (Bollinger-style)
    band_data = [
        BandData(
            time=times[i],
            upper=round(ohlcv_data[i].close + 10, 2),
            middle=round(ohlcv_data[i].close, 2),
            lower=round(ohlcv_data[i].close - 10, 2),
        )
        for i in range(points)
    ]

    # Ribbon data
    ribbon_data = [
        RibbonData(
            time=times[i],
            upper=round(ohlcv_data[i].close + 8, 2),
            lower=round(ohlcv_data[i].close - 8, 2),
        )
        for i in range(points)
    ]

    # Gradient ribbon data
    gradient_ribbon_data = [
        GradientRibbonData(
            time=times[i],
            upper=round(ohlcv_data[i].close + 12, 2),
            lower=round(ohlcv_data[i].close - 12, 2),
            gradient=i / points,
        )
        for i in range(points)
    ]

    # Signal data (buy/sell markers)
    signal_data = [
        SignalData(time=times[i], value=0 if i % 8 == 0 else 1) for i in range(0, points, 8)
    ]

    # Trade data
    trades = [
        TradeData(
            entry_time=times[10],
            exit_time=times[30],
            entry_price=ohlcv_data[10].close,
            exit_price=ohlcv_data[30].close,
            is_profitable=ohlcv_data[30].close > ohlcv_data[10].close,
            id="TRADE_001",
            additional_data={"notes": "Test trade 1"},
        ),
        TradeData(
            entry_time=times[60],
            exit_time=times[80],
            entry_price=ohlcv_data[60].close,
            exit_price=ohlcv_data[80].close,
            is_profitable=ohlcv_data[80].close > ohlcv_data[60].close,
            id="TRADE_002",
            additional_data={"notes": "Test trade 2"},
        ),
    ]

    return {
        "ohlcv_data": ohlcv_data,
        "line_data": line_data,
        "volume_data": volume_data,
        "trend_data": trend_data,
        "band_data": band_data,
        "ribbon_data": ribbon_data,
        "gradient_ribbon_data": gradient_ribbon_data,
        "signal_data": signal_data,
        "trades": trades,
        "times": times,
    }


def main():
    """Main test harness."""
    st.set_page_config(
        page_title="Quick Visual Test",
        page_icon="✓",
        layout="wide",
        initial_sidebar_state="collapsed",
    )

    # Header with controls
    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        st.title("✓ Quick Visual Test")
    with col2:
        data_points = st.number_input("Points", 50, 200, 100, 25, label_visibility="collapsed")
    with col3:
        if st.button("🔄 Regenerate", use_container_width=True):
            st.rerun()

    # Generate data
    with st.spinner("Generating data..."):
        data = generate_sample_data(data_points)

    st.success(f"✅ Generated {data_points} points • Ready for visual check")

    # Organized in 2-column layout for quick scanning
    st.subheader("📊 Built-in Series")
    col1, col2 = st.columns(2)

    with col1:
        st.write("**Line**")
        Chart(series=LineSeries(data=data["line_data"])).render(key="line")

        st.write("**Candlestick**")
        Chart(series=CandlestickSeries(data=data["ohlcv_data"])).render(key="candle")

        st.write("**Area**")
        Chart(series=AreaSeries(data=data["line_data"])).render(key="area")

    with col2:
        st.write("**Histogram**")
        Chart(series=HistogramSeries(data=data["volume_data"])).render(key="histogram")

        st.write("**Baseline**")
        baseline = BaselineSeries(data=data["line_data"])
        baseline.base_value = {"type": "price", "price": 100}
        baseline.title = "NIFTY 50 - Baseline"
        baseline.display_name = "NIFTY 50 - Baseline"
        Chart(series=baseline).render(key="baseline")

        st.write("**Bar**")
        Chart(series=BarSeries(data=data["ohlcv_data"])).render(key="bar")

    st.subheader("🎨 Custom Series")
    col1, col2 = st.columns(2)

    with col1:
        st.write("**Trend Fill (HLC3 + EMA20)**")
        st.caption("Baseline: HLC3, Trend: EMA20, Green=Bullish, Red=Bearish")
        trend_fill_chart = Chart(
            series=[
                CandlestickSeries(data=data["ohlcv_data"]),
                TrendFillSeries(
                    data=data["trend_data"],
                    uptrend_fill_color="rgba(76, 175, 80, 0.2)",
                    downtrend_fill_color="rgba(239, 83, 80, 0.2)",
                ),
            ],
        )
        trend_fill_chart.render(key="trend_fill")

        st.write("**Band**")
        Chart(series=BandSeries(data=data["band_data"])).render(key="band")

        st.write("**Ribbon**")
        Chart(series=RibbonSeries(data=data["ribbon_data"])).render(key="ribbon")

    with col2:
        st.write("**Gradient Ribbon**")
        Chart(series=GradientRibbonSeries(data=data["gradient_ribbon_data"])).render(
            key="gradient_ribbon",
        )

        st.write("**Signal**")
        Chart(
            series=[
                LineSeries(data=data["line_data"]),
                SignalSeries(data=data["signal_data"]),
            ],
        ).render(key="signal")

    st.subheader("🔧 Features")
    col1, col2 = st.columns(2)

    with col1:
        st.write("**Annotations**")
        annotations = [
            create_text_annotation(data["times"][20], 100, "Support"),
            create_arrow_annotation(data["times"][60], 110, "Resistance"),
        ]
        Chart(
            series=CandlestickSeries(data=data["ohlcv_data"]),
            annotations=annotations,
        ).render(key="annotations")

        st.write("**Trades (Rectangles + Markers)**")
        trade_viz = TradeVisualizationOptions(
            style=TradeVisualization.BOTH,
            rectangle_fill_opacity=0.25,
            rectangle_border_width=2,
        )
        chart_with_trades = Chart(
            series=CandlestickSeries(data=data["ohlcv_data"]),
            options=ChartOptions(trade_visualization=trade_viz),
        )
        chart_with_trades.add_trades(data["trades"])
        chart_with_trades.render(key="trades_both")

        st.write("**Trades (Markers Only)**")
        trade_viz_markers = TradeVisualizationOptions(
            style=TradeVisualization.MARKERS,
            entry_marker_color_long="#2196F3",
            entry_marker_color_short="#FF9800",
            exit_marker_color_profit="#4CAF50",
            exit_marker_color_loss="#F44336",
            marker_size=1,
            show_pnl_in_markers=True,
        )
        chart_markers_only = Chart(
            series=CandlestickSeries(data=data["ohlcv_data"]),
            options=ChartOptions(trade_visualization=trade_viz_markers),
        )
        chart_markers_only.add_trades(data["trades"])
        chart_markers_only.render(key="trades_markers")

    with col2:
        st.write("**Price + Volume (Overlay via Helper)**")
        st.caption("Using `add_price_volume_series()` - single pane with overlay")

        # Create chart and add price + volume using helper method
        price_volume_chart = Chart()
        price_volume_chart.add_price_volume_series(
            data=data["ohlcv_data"],
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
        price_volume_chart.render(key="price_volume_overlay")

        st.write("**Multi-Pane (3 Panes)**")
        st.caption("Price + Volume + Indicator in separate panes")
        Chart(
            series=[
                CandlestickSeries(data=data["ohlcv_data"], pane_id=0),
                HistogramSeries(data=data["volume_data"], pane_id=1),
                LineSeries(data=data["line_data"], pane_id=2),
            ],
        ).render(key="multi_pane_three")

    st.subheader("📊 Linked Charts (ChartManager)")
    st.caption("Two charts synced via ChartManager - scroll/zoom one to sync both")

    # Create chart manager
    manager = ChartManager()

    # Create two charts with same chart_group_id for synchronization
    chart1 = Chart(
        series=CandlestickSeries(data=data["ohlcv_data"]),
        chart_group_id=1,
    )
    chart1.update_options(height=300)

    chart2 = Chart(
        series=LineSeries(data=data["line_data"]),
        chart_group_id=1,
    )
    chart2.update_options(height=300)

    # Add charts to manager
    manager.add_chart(chart1, "chart1")
    manager.add_chart(chart2, "chart2")

    # Configure synchronization for group 1
    manager.set_sync_group_config(
        "1",
        SyncOptions(enabled=True, crosshair=True, time_range=True),
    )

    col1, col2 = st.columns(2)

    with col1:
        st.write("**Chart 1 (Candlestick)**")
        manager.render_chart("chart1", key="linked_chart_1")

    with col2:
        st.write("**Chart 2 (Line)**")
        manager.render_chart("chart2", key="linked_chart_2")

    # Quick check sidebar
    with st.sidebar:
        st.markdown("### ✅ Visual Checklist")
        st.markdown(
            """
            - [ ] All charts render
            - [ ] No console errors
            - [ ] Interactions work
            - [ ] Hover/crosshair works
            - [ ] Multi-pane aligned
            - [ ] Annotations visible
            - [ ] Trade markers show
            - [ ] Linked charts sync
            - [ ] No visual glitches
            """,
        )
        st.divider()
        st.info(f"📊 **{data_points}** data points\n\n✓ Quick pre-push check")

        st.markdown("### 🔗 Features Tested")
        st.markdown(
            """
            **Basic Series**: 6 types
            - Line, Candlestick, Area
            - Bar, Histogram, Baseline

            **Custom Series**: 5 types
            - Trend Fill, Band, Ribbon
            - Gradient Ribbon, Signal

            **Advanced Features**:
            - ✓ Annotations
            - ✓ Trade viz (both styles)
            - ✓ Multi-pane (helper)
            - ✓ Multi-pane (manual)
            - ✓ Linked charts (sync)
            """,
        )


if __name__ == "__main__":
    main()
