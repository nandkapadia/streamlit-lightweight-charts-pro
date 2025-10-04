"""
Simple Series Test Harness

A simplified test harness that tests all series types with minimal configuration.
This is easier to maintain and focuses on core functionality testing.
"""

import random
from datetime import datetime, timedelta

import streamlit as st

# Import core series types
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
    RibbonSeries,
    SignalSeries,
    TrendFillSeries,
    create_arrow_annotation,
    create_text_annotation,
)
from streamlit_lightweight_charts_pro.data import (
    BandData,
    GradientRibbonData,
    OhlcvData,
    RibbonData,
    SignalData,
    SingleValueData,
    TrendFillData,
)


def generate_sample_data():
    """Generate sample data for testing."""
    base_time = datetime(2024, 1, 1)
    data_points = 50

    # Generate timestamps
    times = [
        (base_time + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%S") for i in range(data_points)
    ]

    # Generate OHLCV data
    ohlcv_data = []
    base_price = 100
    for i in range(data_points):
        change = random.uniform(-2, 2) + (i * 0.01)
        base_price += change
        base_price = max(50, base_price)

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

    # Generate line data
    line_data = [
        SingleValueData(times[i], round(100 + i * 0.5 + random.uniform(-5, 5), 2))
        for i in range(data_points)
    ]

    # Generate volume data
    volume_data = [
        SingleValueData(times[i], random.randint(5000, 15000)) for i in range(data_points)
    ]

    return {
        "ohlcv_data": ohlcv_data,
        "line_data": line_data,
        "volume_data": volume_data,
        "times": times,
    }


def main():
    st.set_page_config(page_title="Simple Series Test", page_icon="📊", layout="wide")

    st.title("📊 Simple Series Test Harness")
    st.markdown("Quick testing of all series types with minimal configuration.")

    # Generate sample data
    data = generate_sample_data()

    # Create columns for side-by-side charts
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Basic Series Types")

        # Line Chart
        st.write("**Line Series**")
        line_chart = Chart(series=LineSeries(data=data["line_data"]))
        line_chart.render(key="line_test")

        # Candlestick Chart
        st.write("**Candlestick Series**")
        candlestick_chart = Chart(series=CandlestickSeries(data=data["ohlcv_data"]))
        candlestick_chart.render(key="candlestick_test")

        # Area Chart
        st.write("**Area Series**")
        area_chart = Chart(series=AreaSeries(data=data["line_data"]))
        area_chart.render(key="area_test")

    with col2:
        st.subheader("Advanced Series Types")

        # Bar Chart
        st.write("**Bar Series**")
        bar_chart = Chart(series=BarSeries(data=data["ohlcv_data"]))
        bar_chart.render(key="bar_test")

        # Histogram
        st.write("**Histogram Series**")
        histogram_chart = Chart(series=HistogramSeries(data=data["volume_data"]))
        histogram_chart.render(key="histogram_test")

        # Baseline
        st.write("**Baseline Series**")
        # Calculate mean of line data for baseline value
        line_values = [point.value for point in data["line_data"]]
        data_mean = sum(line_values) / len(line_values)

        baseline_series = BaselineSeries(data=data["line_data"])
        baseline_series.base_value = {"type": "price", "price": round(data_mean, 2)}
        baseline_series.top_fill_color1 = "rgba(76, 175, 80, 0.3)"  # Green for above mean
        baseline_series.bottom_fill_color1 = "rgba(255, 82, 82, 0.3)"  # Red for below mean

        baseline_chart = Chart(series=baseline_series)
        baseline_chart.render(key="baseline_test")

        # Display the calculated mean
        st.caption(f"Baseline set to data mean: {data_mean:.2f}")

    # Full-width charts
    st.subheader("Special Series Types")

    # Trend Fill (requires special data format)
    st.write("**Trend Fill Series**")
    trend_data = [
        TrendFillData(
            time=data["times"][i],
            base_line=100,
            trend_line=100 + i * 0.5 + random.uniform(-5, 5),
            trend_direction=1 if random.random() > 0.5 else -1,
        )
        for i in range(len(data["times"]))
    ]
    trend_fill_chart = Chart(series=TrendFillSeries(data=trend_data))
    trend_fill_chart.render(key="trend_fill_test")

    # Band Series
    st.write("**Band Series**")
    band_data = [
        BandData(
            time=data["times"][i],
            upper=105 + i * 0.3,
            middle=100 + i * 0.3,
            lower=95 + i * 0.3,
        )
        for i in range(len(data["times"]))
    ]
    band_chart = Chart(series=BandSeries(data=band_data))
    band_chart.render(key="band_test")

    # Ribbon Series
    st.write("**Ribbon Series**")
    ribbon_data = [
        RibbonData(
            time=data["times"][i],
            upper=105 + i * 0.3,
            lower=95 + i * 0.3,
        )
        for i in range(len(data["times"]))
    ]
    ribbon_chart = Chart(series=RibbonSeries(data=ribbon_data))
    ribbon_chart.render(key="ribbon_test")

    # Gradient Ribbon Series
    st.write("**Gradient Ribbon Series**")
    # Create simple gradient values that go from 0 to 1 for testing
    gradient_ribbon_data = [
        GradientRibbonData(
            time=data["times"][i],
            upper=105 + i * 0.3,
            lower=95 + i * 0.3,
            # Simple gradient from 0 to 1 across the data
            gradient=i / (len(data["times"]) - 1) if len(data["times"]) > 1 else 0.5,
        )
        for i in range(len(data["times"]))
    ]

    # Configure gradient ribbon with custom colors
    gradient_ribbon_series = GradientRibbonSeries(
        data=gradient_ribbon_data,
        gradient_start_color="#4CAF50",  # Green for low gradient
        gradient_end_color="#F44336",  # Red for high gradient
        normalize_gradients=False,  # Use gradient values as-is (0-1)
    )

    gradient_ribbon_chart = Chart(series=gradient_ribbon_series)
    gradient_ribbon_chart.render(key="gradient_ribbon_test")

    # Display gradient information
    st.caption("Gradient: Green (0.0) → Red (1.0) based on data position")

    # Signal Series
    st.write("**Signal Series**")
    signal_data = [
        SignalData(
            time=data["times"][i],
            value=0 if random.random() > 0.7 else 1,  # Random signal values (0 or 1)
        )
        for i in range(len(data["times"]))
    ]
    signal_chart = Chart(series=SignalSeries(data=signal_data))
    signal_chart.render(key="signal_test")

    # Multi-pane chart
    st.subheader("Multi-Pane Chart")
    multi_pane_chart = Chart(
        series=[
            CandlestickSeries(data=data["ohlcv_data"]),
            HistogramSeries(data=data["volume_data"]),
        ],
    )
    multi_pane_chart.render(key="multi_pane_test")

    # Chart with annotations
    st.subheader("Chart with Annotations")
    annotations = [
        create_text_annotation(data["times"][10], 105, "Support"),
        create_arrow_annotation(data["times"][20], 120, "Resistance"),
    ]
    annotation_chart = Chart(
        series=CandlestickSeries(data=data["ohlcv_data"]),
        annotations=annotations,
    )
    annotation_chart.render(key="annotation_test")

    # Test summary
    st.sidebar.markdown("## Test Summary")
    st.sidebar.markdown("✅ **Basic Series**: Line, Candlestick, Area, Bar")
    st.sidebar.markdown("✅ **Advanced Series**: Histogram, Baseline")
    st.sidebar.markdown("✅ **Special Series**: Trend Fill, Band")
    st.sidebar.markdown("✅ **Ribbon Series**: Ribbon, Gradient Ribbon")
    st.sidebar.markdown("✅ **Signal Series**: Background coloring")
    st.sidebar.markdown("✅ **Multi-Pane**: 2-pane layout")
    st.sidebar.markdown("✅ **Annotations**: Text and Arrow")

    st.sidebar.markdown("## Usage")
    st.sidebar.markdown(
        """
    1. **Check rendering** - All charts should display without errors
    2. **Test interaction** - Try zooming, panning, crosshair
    3. **Check console** - Look for any JavaScript errors
    4. **Verify responsiveness** - Resize browser window
    """,
    )


if __name__ == "__main__":
    main()
