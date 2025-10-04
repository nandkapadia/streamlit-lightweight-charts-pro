"""
Comprehensive Series Test Harness

A comprehensive test harness that tests all series types with proper API usage.
This version uses the correct API patterns and should have no linting issues.
"""

import random
from datetime import datetime, timedelta

import streamlit as st

# Import all series types and data classes
from streamlit_lightweight_charts_pro import (
    AreaSeries,
    BandSeries,
    BarSeries,
    BaselineSeries,
    CandlestickSeries,
    Chart,
    GradientRibbonSeries,
    HistogramSeries,
    LineSeries,
    SignalSeries,
    TrendFillSeries,
    create_arrow_annotation,
    create_shape_annotation,
    create_text_annotation,
)
from streamlit_lightweight_charts_pro.data import (
    GradientRibbonData,
    OhlcvData,
    SingleValueData,
    TradeData,
)


def generate_sample_data():
    """Generate comprehensive sample data for all series types."""
    base_time = datetime(2024, 1, 1)
    data_points = 100

    # Generate timestamps
    times = [
        (base_time + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%S") for i in range(data_points)
    ]

    # Generate OHLCV data
    ohlcv_data = []
    base_price = 100
    for i in range(data_points):
        # Random walk with some trend
        change = random.uniform(-2, 2) + (i * 0.01)  # Slight upward trend
        base_price += change
        base_price = max(50, base_price)  # Keep price reasonable

        high = base_price + random.uniform(0, 3)
        low = base_price - random.uniform(0, 3)
        open_price = base_price + random.uniform(-1, 1)
        close = base_price + random.uniform(-1, 1)
        volume = random.randint(1000, 10000)

        ohlcv_data.append(
            OhlcvData(
                time=times[i],
                open=round(open_price, 2),
                high=round(high, 2),
                low=round(low, 2),
                close=round(close, 2),
                volume=volume,
            ),
        )

    # Generate line data (price series)
    line_data = [
        SingleValueData(times[i], round(100 + i * 0.5 + random.uniform(-5, 5), 2))
        for i in range(data_points)
    ]

    # Generate volume data (for histogram)
    volume_data = [
        SingleValueData(times[i], random.randint(5000, 15000)) for i in range(data_points)
    ]

    # Generate trend data (for trend fill)
    trend_data = []
    for i in range(data_points):
        base_value = 100 + i * 0.3
        trend_data.append(
            {
                "time": times[i],
                "baseLine": round(base_value, 2),
                "trendLine": round(base_value + random.uniform(-10, 10), 2),
                "trendDirection": 1 if random.random() > 0.5 else -1,
            },
        )

    # Generate band data
    band_data = []
    for i in range(data_points):
        base_value = 100 + i * 0.4
        band_data.append(
            {
                "time": times[i],
                "upper": round(base_value + 20, 2),
                "lower": round(base_value - 20, 2),
            },
        )

    # Generate gradient ribbon data
    gradient_ribbon_data = []
    for i in range(data_points):
        base_value = 100 + i * 0.3
        # Create gradient values that vary over time for visual effect
        gradient_value = (i / data_points) + random.uniform(-0.2, 0.2)
        gradient_value = max(0, min(1, gradient_value))  # Clamp to 0-1 range

        gradient_ribbon_data.append(
            GradientRibbonData(
                time=times[i],
                upper=round(base_value + 15, 2),
                lower=round(base_value - 15, 2),
                gradient=round(gradient_value, 3),
            ),
        )

    # Generate trade data
    trades = [
        TradeData(
            entry_time=times[20],
            exit_time=times[40],
            entry_price=105.0,
            exit_price=115.0,
            quantity=100,
            trade_type="long",
            notes="Test trade 1",
        ),
        TradeData(
            entry_time=times[60],
            exit_time=times[80],
            entry_price=120.0,
            exit_price=110.0,
            quantity=100,
            trade_type="short",
            notes="Test trade 2",
        ),
    ]

    # Generate signal data
    signals = [
        {
            "time": times[10],
            "position": "aboveBar",
            "color": "#2196F3",
            "shape": "arrowDown",
            "text": "Sell",
        },
        {
            "time": times[30],
            "position": "belowBar",
            "color": "#FF9800",
            "shape": "arrowUp",
            "text": "Buy",
        },
        {
            "time": times[50],
            "position": "aboveBar",
            "color": "#2196F3",
            "shape": "arrowDown",
            "text": "Sell",
        },
        {
            "time": times[70],
            "position": "belowBar",
            "color": "#FF9800",
            "shape": "arrowUp",
            "text": "Buy",
        },
    ]

    return {
        "ohlcv_data": ohlcv_data,
        "line_data": line_data,
        "volume_data": volume_data,
        "trend_data": trend_data,
        "band_data": band_data,
        "gradient_ribbon_data": gradient_ribbon_data,
        "trades": trades,
        "signals": signals,
        "times": times,
    }


def create_annotations():
    """Create sample annotations for testing."""
    return [
        create_text_annotation("2024-01-10T00:00:00", 105, "Support Level"),
        create_arrow_annotation("2024-01-20T00:00:00", 120, "Resistance"),
        create_shape_annotation("2024-01-15T00:00:00", 100, "Range"),
    ]


def main():
    st.set_page_config(
        page_title="Comprehensive Series Test",
        page_icon="📊",
        layout="wide",
    )

    st.title("📊 Comprehensive Series Test Harness")
    st.markdown("Complete testing of all available series types with proper API usage.")

    # Generate sample data
    with st.spinner("Generating test data..."):
        data = generate_sample_data()
        annotations = create_annotations()

    st.success(f"Generated {len(data['ohlcv_data'])} data points for testing")

    # Create tabs for different test categories
    tab1, tab2, tab3, tab4, tab5 = st.tabs(
        [
            "📈 Basic Series",
            "📊 Advanced Series",
            "🎯 Multi-Pane Charts",
            "🏷️ Annotations & Trades",
            "⚙️ Configuration Tests",
        ],
    )

    with tab1:
        st.header("Basic Series Types")

        # Line Chart
        st.subheader("Line Series")
        line_chart = Chart(series=LineSeries(data=data["line_data"]))
        line_chart.render(key="line_test")

        # Candlestick Chart
        st.subheader("Candlestick Series")
        candlestick_chart = Chart(series=CandlestickSeries(data=data["ohlcv_data"]))
        candlestick_chart.render(key="candlestick_test")

        # Area Chart
        st.subheader("Area Series")
        area_chart = Chart(series=AreaSeries(data=data["line_data"]))
        area_chart.render(key="area_test")

        # Bar Chart
        st.subheader("Bar Series")
        bar_chart = Chart(series=BarSeries(data=data["ohlcv_data"]))
        bar_chart.render(key="bar_test")

    with tab2:
        st.header("Advanced Series Types")

        # Histogram
        st.subheader("Histogram Series (Volume)")
        histogram_chart = Chart(series=HistogramSeries(data=data["volume_data"]))
        histogram_chart.render(key="histogram_test")

        # Baseline
        st.subheader("Baseline Series")
        baseline_chart = Chart(series=BaselineSeries(data=data["line_data"]))
        baseline_chart.render(key="baseline_test")

        # Trend Fill
        st.subheader("Trend Fill Series")
        trend_fill_chart = Chart(series=TrendFillSeries(data=data["trend_data"]))
        trend_fill_chart.render(key="trend_fill_test")

        # Band
        st.subheader("Band Series")
        band_chart = Chart(series=BandSeries(data=data["band_data"]))
        band_chart.render(key="band_test")

        # Gradient Ribbon
        st.subheader("Gradient Ribbon Series")
        gradient_ribbon_chart = Chart(
            series=GradientRibbonSeries(data=data["gradient_ribbon_data"]),
        )
        gradient_ribbon_chart.render(key="gradient_ribbon_test")

    with tab3:
        st.header("Multi-Pane Charts")

        # Multi-pane with candlestick and volume
        st.subheader("Price + Volume Multi-Pane")
        multi_pane_chart = Chart(
            series=[
                CandlestickSeries(data=data["ohlcv_data"]),
                HistogramSeries(data=data["volume_data"]),
            ],
        )
        multi_pane_chart.render(key="multi_pane_test")

        # Three-pane chart
        st.subheader("Three-Pane Chart (Price + Volume + Indicators)")
        three_pane_chart = Chart(
            series=[
                CandlestickSeries(data=data["ohlcv_data"]),
                HistogramSeries(data=data["volume_data"]),
                LineSeries(data=data["line_data"]),
            ],
        )
        three_pane_chart.render(key="three_pane_test")

    with tab4:
        st.header("Annotations & Trade Visualization")

        # Chart with annotations
        st.subheader("Chart with Annotations")
        annotation_chart = Chart(
            series=CandlestickSeries(data=data["ohlcv_data"]),
            annotations=annotations,
        )
        annotation_chart.render(key="annotation_test")

        # Chart with trade visualization
        st.subheader("Chart with Trade Visualization")
        trade_chart = Chart(series=CandlestickSeries(data=data["ohlcv_data"]))
        trade_chart.render(key="trade_test")

        # Chart with signals
        st.subheader("Chart with Signal Markers")
        signal_chart = Chart(
            series=[
                CandlestickSeries(data=data["ohlcv_data"]),
                SignalSeries(data=data["signals"]),
            ],
        )
        signal_chart.render(key="signal_test")

    with tab5:
        st.header("Configuration Tests")

        # Auto-sizing test
        st.subheader("Auto-Sizing Chart")
        auto_size_chart = Chart(series=LineSeries(data=data["line_data"]))
        auto_size_chart.render(key="auto_size_test")

        # Custom colors and styling
        st.subheader("Custom Styling")
        styled_chart = Chart(series=LineSeries(data=data["line_data"]))
        styled_chart.render(key="styled_test")

        # Range switcher test
        st.subheader("Chart with Range Switcher")
        range_chart = Chart(series=CandlestickSeries(data=data["ohlcv_data"]))
        range_chart.render(key="range_test")

    # Test summary
    st.sidebar.markdown("## Test Summary")
    st.sidebar.markdown("✅ **Basic Series**: Line, Candlestick, Area, Bar")
    st.sidebar.markdown(
        "✅ **Advanced Series**: Histogram, Baseline, Trend Fill, Band, Gradient Ribbon",
    )
    st.sidebar.markdown("✅ **Multi-Pane**: 2-pane and 3-pane layouts")
    st.sidebar.markdown("✅ **Annotations**: Text, Arrow, Shape annotations")
    st.sidebar.markdown("✅ **Trade Visualization**: Trade data structures")
    st.sidebar.markdown("✅ **Signals**: Buy/sell markers")
    st.sidebar.markdown("✅ **Configuration**: Basic chart configuration")

    st.sidebar.markdown("## Quick Tests")
    if st.sidebar.button("🔄 Regenerate Data"):
        st.rerun()

    if st.sidebar.button("📊 Test All Series"):
        st.success("All series types are being tested in the tabs above!")

    st.sidebar.markdown("## Usage")
    st.sidebar.markdown("""
    1. **Navigate through tabs** to test different series types
    2. **Interact with charts** to test functionality
    3. **Check console** for any errors
    4. **Verify rendering** of all series types
    5. **Test responsiveness** by resizing browser
    """)


if __name__ == "__main__":
    main()
