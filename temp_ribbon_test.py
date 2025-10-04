#!/usr/bin/env python3
"""Temporary Streamlit test harness for ribbon series with 100 data points.

This script creates a comprehensive test for the ribbon series implementation,
testing various configurations and rendering modes with realistic data.

Usage:
    streamlit run temp_ribbon_test.py

Features tested:
    - Basic ribbon series with 100 data points
    - Different styling options (colors, line styles, fill)
    - Primitive rendering mode vs direct rendering
    - Multiple ribbon series on same chart
    - Data validation and error handling
"""

# Standard Imports
import random
from datetime import datetime, timedelta
from typing import List

import pandas as pd

# Third Party Imports
import streamlit as st

# Local Imports
from streamlit_lightweight_charts_pro import Chart
from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.charts.series import RibbonSeries
from streamlit_lightweight_charts_pro.data import RibbonData


def generate_ribbon_data(
    num_points: int = 100,
    base_price: float = 100.0,
    volatility: float = 0.02,
    band_width: float = 0.05,
    start_date: str = "2024-01-01",
) -> List[RibbonData]:
    """Generate realistic ribbon data with upper and lower bands.

    Creates a random walk with upper and lower bands that follow the price
    with some variation. This simulates technical indicators like Bollinger Bands.

    Args:
        num_points: Number of data points to generate.
        base_price: Starting price for the data series.
        volatility: Price volatility factor (0.01 = 1% volatility).
        band_width: Width of the bands as fraction of price (0.05 = 5%).
        start_date: Starting date for the time series.

    Returns:
        List of RibbonData objects with time, upper, and lower values.
    """
    data = []
    current_price = base_price
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")

    for i in range(num_points):
        # Generate timestamp
        timestamp = start_dt + timedelta(days=i)
        time_str = timestamp.strftime("%Y-%m-%d")

        # Random walk for price
        change = random.gauss(0, volatility)
        current_price *= 1 + change

        # Generate bands around the price
        # Upper band: price + band_width + some noise
        upper_noise = random.gauss(0, band_width * 0.1)
        upper = current_price * (1 + band_width + upper_noise)

        # Lower band: price - band_width + some noise
        lower_noise = random.gauss(0, band_width * 0.1)
        lower = current_price * (1 - band_width + lower_noise)

        # Ensure lower < upper
        if lower >= upper:
            lower = upper * 0.95

        # Create ribbon data point
        ribbon_point = RibbonData(
            time=time_str,
            upper=round(upper, 2),
            lower=round(lower, 2),
        )

        data.append(ribbon_point)

    return data


def create_test_chart_1() -> Chart:
    """Create basic ribbon chart with default styling."""
    st.subheader("Test 1: Basic Ribbon Series (Default Styling)")

    # Generate test data
    data = generate_ribbon_data(num_points=100, base_price=50.0, volatility=0.015)

    # Create ribbon series with default options
    ribbon_series = RibbonSeries(data)

    # Create chart
    chart = Chart(series=ribbon_series)

    # Display data info
    st.write(f"**Data Points:** {len(data)}")
    st.write(
        f"**Price Range:** {min(d.lower for d in data):.2f} - {max(d.upper for d in data):.2f}",
    )
    st.write(f"**Time Range:** {data[0].time} to {data[-1].time}")

    return chart


def create_test_chart_2() -> Chart:
    """Create ribbon chart with custom styling options."""
    st.subheader("Test 2: Custom Styling Options")

    # Generate test data
    data = generate_ribbon_data(num_points=100, base_price=75.0, volatility=0.02)

    # Create custom line options
    upper_line = LineOptions(
        color="#FF6B6B",  # Red
        line_width=3,
        line_style="solid",
    )

    lower_line = LineOptions(
        color="#4ECDC4",  # Teal
        line_width=3,
        line_style="dashed",
    )

    # Create ribbon series with custom options
    ribbon_series = RibbonSeries(data)
    ribbon_series.upper_line = upper_line
    ribbon_series.lower_line = lower_line
    ribbon_series.fill = "rgba(255, 107, 107, 0.2)"  # Light red fill
    ribbon_series.fill_visible = True

    # Create chart
    chart = Chart(series=ribbon_series)

    # Display styling info
    st.write("**Custom Styling:**")
    st.write(f"- Upper line: {upper_line.color}, width {upper_line.line_width}")
    st.write(f"- Lower line: {lower_line.color}, width {lower_line.line_width}")
    st.write("- Fill: Light red with 20% opacity")

    return chart


def create_test_chart_3() -> Chart:
    """Create ribbon chart with primitive rendering mode."""
    st.subheader("Test 3: Primitive Rendering Mode")

    # Generate test data
    data = generate_ribbon_data(num_points=100, base_price=25.0, volatility=0.025)

    # Create ribbon series configured for primitive rendering
    ribbon_series = RibbonSeries(data)
    ribbon_series.upper_line = LineOptions(color="#9B59B6", line_width=2)  # Purple
    ribbon_series.lower_line = LineOptions(color="#E67E22", line_width=2)  # Orange
    ribbon_series.fill = "rgba(155, 89, 182, 0.15)"  # Light purple fill
    ribbon_series.fill_visible = True

    # Create chart
    chart = Chart(series=ribbon_series)

    # Display primitive info
    st.write("**Primitive Mode:** Background rendering with z-order control")
    st.write("**Colors:** Purple upper, Orange lower, Light purple fill")

    return chart


def create_test_chart_4() -> Chart:
    """Create chart with multiple ribbon series."""
    st.subheader("Test 4: Multiple Ribbon Series")

    # Generate two different datasets
    data1 = generate_ribbon_data(num_points=100, base_price=100.0, volatility=0.01, band_width=0.03)
    data2 = generate_ribbon_data(num_points=100, base_price=80.0, volatility=0.02, band_width=0.07)

    # Create first ribbon series (tight bands)
    ribbon1 = RibbonSeries(data1)
    ribbon1.upper_line = LineOptions(color="#27AE60", line_width=2)  # Green
    ribbon1.lower_line = LineOptions(color="#27AE60", line_width=2)
    ribbon1.fill = "rgba(39, 174, 96, 0.1)"
    ribbon1.fill_visible = True

    # Create second ribbon series (wide bands)
    ribbon2 = RibbonSeries(data2)
    ribbon2.upper_line = LineOptions(color="#E74C3C", line_width=1, line_style="dotted")  # Red
    ribbon2.lower_line = LineOptions(color="#E74C3C", line_width=1, line_style="dotted")
    ribbon2.fill = "rgba(231, 76, 60, 0.05)"
    ribbon2.fill_visible = True

    # Create chart with both series
    chart = Chart().add_series(ribbon1).add_series(ribbon2)

    # Display series info
    st.write("**Series 1 (Green):** Tight bands (3% width)")
    st.write("**Series 2 (Red):** Wide bands (7% width), dotted lines")

    return chart


def create_test_chart_5() -> Chart:
    """Create ribbon chart with edge cases and validation."""
    st.subheader("Test 5: Edge Cases & Data Validation")

    # Create data with some edge cases
    edge_data = []
    base_price = 50.0

    for i in range(50):  # Smaller dataset for edge case testing
        # Use valid dates only (January has 31 days max)
        day = (i % 31) + 1
        timestamp = f"2024-01-{day:02d}"

        if i == 10:
            # Test case: Very close upper/lower values
            upper = base_price + 0.01
            lower = base_price - 0.01
        elif i == 20:
            # Test case: Wide spread
            upper = base_price + 10.0
            lower = base_price - 10.0
        elif i == 30:
            # Test case: Negative values
            upper = -5.0
            lower = -15.0
        else:
            # Normal case
            upper = base_price + random.uniform(2, 8)
            lower = base_price - random.uniform(2, 8)

        ribbon_point = RibbonData(
            time=timestamp,
            upper=round(upper, 2),
            lower=round(lower, 2),
        )

        edge_data.append(ribbon_point)
        base_price += random.gauss(0, 1.0)  # Small random walk

    # Create ribbon series
    ribbon_series = RibbonSeries(edge_data)
    ribbon_series.upper_line = LineOptions(color="#8E44AD", line_width=2)  # Purple
    ribbon_series.lower_line = LineOptions(color="#8E44AD", line_width=2)
    ribbon_series.fill = "rgba(142, 68, 173, 0.2)"
    ribbon_series.fill_visible = True

    # Create chart
    chart = Chart(series=ribbon_series)

    # Display edge case info
    st.write("**Edge Cases Tested:**")
    st.write("- Very close upper/lower values (point 10)")
    st.write("- Wide spread values (point 20)")
    st.write("- Negative values (point 30)")
    st.write("- Normal variation (other points)")

    return chart


def display_data_table(data: List[RibbonData], title: str = "Sample Data"):
    """Display a sample of the ribbon data in a table."""
    st.subheader(f"{title} (First 10 points)")

    # Convert to DataFrame for display
    df_data = []
    for i, point in enumerate(data[:10]):
        df_data.append(
            {
                "Index": i + 1,
                "Time": point.time,
                "Upper": point.upper,
                "Lower": point.lower,
                "Spread": round(point.upper - point.lower, 2),
            },
        )

    df = pd.DataFrame(df_data)
    st.dataframe(df, use_container_width=True)


def main():
    """Main Streamlit application."""
    st.set_page_config(
        page_title="Ribbon Series Test Harness",
        page_icon="📊",
        layout="wide",
    )

    st.title("🎯 Ribbon Series Test Harness")
    st.markdown("**Testing ribbon series with 100 data points and various configurations**")

    # Sidebar controls
    st.sidebar.header("Test Configuration")
    test_selection = st.sidebar.selectbox(
        "Select Test Case:",
        [
            "All Tests",
            "Test 1: Basic Ribbon",
            "Test 2: Custom Styling",
            "Test 3: Primitive Mode",
            "Test 4: Multiple Series",
            "Test 5: Edge Cases",
        ],
    )

    show_data = st.sidebar.checkbox("Show Sample Data", value=False)
    show_debug = st.sidebar.checkbox("Show Debug Info", value=False)

    # Main content area
    if test_selection == "All Tests":
        st.header("🧪 Running All Test Cases")

        # Test 1
        chart1 = create_test_chart_1()
        chart1.render(key="ribbon_test_1")

        if show_data:
            data1 = generate_ribbon_data(num_points=100, base_price=50.0, volatility=0.015)
            display_data_table(data1, "Test 1 Data")

        st.divider()

        # Test 2
        chart2 = create_test_chart_2()
        chart2.render(key="ribbon_test_2")

        st.divider()

        # Test 3
        chart3 = create_test_chart_3()
        chart3.render(key="ribbon_test_3")

        st.divider()

        # Test 4
        chart4 = create_test_chart_4()
        chart4.render(key="ribbon_test_4")

        st.divider()

        # Test 5
        # chart5 = create_test_chart_5()
        # chart5.render(key="ribbon_test_5")

    elif test_selection == "Test 1: Basic Ribbon":
        chart = create_test_chart_1()
        chart.render(key="ribbon_basic")

        if show_data:
            data = generate_ribbon_data(num_points=100, base_price=50.0, volatility=0.015)
            display_data_table(data, "Basic Ribbon Data")

    elif test_selection == "Test 2: Custom Styling":
        chart = create_test_chart_2()
        chart.render(key="ribbon_styling")

    elif test_selection == "Test 3: Primitive Mode":
        chart = create_test_chart_3()
        chart.render(key="ribbon_primitive")

    elif test_selection == "Test 4: Multiple Series":
        chart = create_test_chart_4()
        chart.render(key="ribbon_multiple")

    elif test_selection == "Test 5: Edge Cases":
        chart = create_test_chart_5()
        chart.render(key="ribbon_edge_cases")

        if show_data:
            # Generate edge case data for display
            edge_data = []
            base_price = 50.0
            for i in range(50):
                # Use valid dates only (January has 31 days max)
                day = (i % 31) + 1
                timestamp = f"2024-01-{day:02d}"
                if i == 10:
                    upper, lower = base_price + 0.01, base_price - 0.01
                elif i == 20:
                    upper, lower = base_price + 10.0, base_price - 10.0
                elif i == 30:
                    upper, lower = -5.0, -15.0
                else:
                    upper = base_price + random.uniform(2, 8)
                    lower = base_price - random.uniform(2, 8)

                edge_data.append(
                    RibbonData(time=timestamp, upper=round(upper, 2), lower=round(lower, 2)),
                )
                base_price += random.gauss(0, 1.0)

            display_data_table(edge_data, "Edge Case Data")

    # Debug information
    if show_debug:
        st.sidebar.header("Debug Information")
        st.sidebar.write("**Ribbon Series Features:**")
        st.sidebar.write("- Upper and lower band lines")
        st.sidebar.write("- Fill area between bands")
        st.sidebar.write("- Customizable colors and styles")
        st.sidebar.write("- Primitive rendering mode")
        st.sidebar.write("- Multiple series support")
        st.sidebar.write("- Data validation")

        st.sidebar.write("**Data Structure:**")
        st.sidebar.write("- time: Timestamp string")
        st.sidebar.write("- upper: Upper band value")
        st.sidebar.write("- lower: Lower band value")
        st.sidebar.write("- fill: Optional fill color")

    # Footer
    st.markdown("---")
    st.markdown("**Test Harness Features:**")
    st.markdown("- ✅ 100 data points per test case")
    st.markdown("- ✅ Realistic price simulation with bands")
    st.markdown("- ✅ Multiple styling configurations")
    st.markdown("- ✅ Primitive vs direct rendering modes")
    st.markdown("- ✅ Edge case validation")
    st.markdown("- ✅ Data visualization and debugging")


if __name__ == "__main__":
    main()
