"""Gradient Ribbon Series Example.

This script demonstrates how to create and use the GradientRibbonSeries
with gradient color transitions based on data values. The gradient ribbon
shows upper and lower bands with dynamic color fills.
"""

# pylint: disable=no-member

import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import GradientRibbonSeries, RibbonSeries
from streamlit_lightweight_charts_pro.data import GradientRibbonData, RibbonData


def create_sample_gradient_data():
    """Create sample gradient ribbon data with varying gradient values."""
    dates = pd.date_range("2024-01-01", periods=50, freq="D")

    data = []
    for i, date in enumerate(dates):
        # Create some sample upper and lower values
        base_value = 100 + i * 0.8
        volatility = 5 + (i % 10) * 0.5  # Varying volatility

        upper = base_value + volatility
        lower = base_value - volatility

        # Create gradient values that change over time
        # This could represent volatility, momentum, or any other metric
        gradient_value = 0.3 + 0.4 * (i / len(dates)) + 0.3 * (i % 15) / 15

        data.append(
            GradientRibbonData(str(date.date()), upper=upper, lower=lower, gradient=gradient_value),
        )

    return data


def create_sample_regular_ribbon_data():
    """Create regular ribbon data for comparison."""
    dates = pd.date_range("2024-01-01", periods=50, freq="D")

    data = []
    for i, date in enumerate(dates):
        base_value = 100 + i * 0.8
        volatility = 5 + (i % 10) * 0.5

        upper = base_value + volatility
        lower = base_value - volatility

        data.append(RibbonData(str(date.date()), upper=upper, lower=lower))

    return data


def main():
    """Main function to demonstrate gradient ribbon series."""
    st.title("Gradient Ribbon Series Demo")
    st.write(
        "This demonstrates the GradientRibbonSeries functionality with "
        "dynamic color transitions based on gradient values.",
    )

    # Sidebar controls
    st.sidebar.header("Gradient Controls")

    gradient_start_color = st.sidebar.color_picker(
        "Gradient Start Color",
        value="#4CAF50",
        help="Starting color for gradient fills (low values)",
    )

    gradient_end_color = st.sidebar.color_picker(
        "Gradient End Color",
        value="#F44336",
        help="Ending color for gradient fills (high values)",
    )

    normalize_gradients = st.sidebar.checkbox(
        "Normalize Gradients",
        value=True,
        help="Normalize gradient values to 0-1 range for consistent coloring",
    )

    show_comparison = st.sidebar.checkbox(
        "Show Comparison with Regular Ribbon",
        value=True,
        help="Display both gradient and regular ribbon series for comparison",
    )

    # Create sample data
    gradient_data = create_sample_gradient_data()
    regular_data = create_sample_regular_ribbon_data()

    # Create charts
    st.write("### Gradient Ribbon Chart")
    st.write(
        "The gradient ribbon shows dynamic color transitions based on gradient values. "
        "Colors transition from start color (low values) to end color (high values).",
    )

    # Main gradient ribbon chart
    chart = Chart()

    gradient_ribbon_series = GradientRibbonSeries(
        data=gradient_data,
        visible=True,
        price_scale_id="right",
        gradient_start_color=gradient_start_color,
        gradient_end_color=gradient_end_color,
        normalize_gradients=normalize_gradients,
    )

    # Customize the series styling
    gradient_ribbon_series.upper_line.color = "#2196F3"
    gradient_ribbon_series.upper_line.line_width = 2
    gradient_ribbon_series.upper_line.line_style = "solid"

    gradient_ribbon_series.lower_line.color = "#9C27B0"
    gradient_ribbon_series.lower_line.line_width = 2
    gradient_ribbon_series.lower_line.line_style = "solid"

    gradient_ribbon_series.fill_visible = True

    # Add series to chart
    chart.add_series(gradient_ribbon_series)

    # Show chart
    chart.render(key="gradient_ribbon_chart")

    # Show comparison if requested
    if show_comparison:
        st.write("### Comparison: Gradient Ribbon vs Regular Ribbon")
        st.write(
            "The chart below shows both gradient ribbon (with dynamic colors) "
            "and regular ribbon (with static fill color) for comparison.",
        )

        comparison_chart = Chart()

        # Add gradient ribbon series
        gradient_series = GradientRibbonSeries(
            data=gradient_data,
            visible=True,
            price_scale_id="right",
            gradient_start_color=gradient_start_color,
            gradient_end_color=gradient_end_color,
            normalize_gradients=normalize_gradients,
        )

        gradient_series.upper_line.color = "#2196F3"  # pylint: disable=no-member
        gradient_series.lower_line.color = "#9C27B0"  # pylint: disable=no-member
        gradient_series.fill_visible = True

        # Add regular ribbon series for comparison
        regular_ribbon_series = RibbonSeries(
            data=regular_data,
            visible=True,
            price_scale_id="right",
        )

        regular_ribbon_series.upper_line.color = "#666666"  # pylint: disable=no-member
        regular_ribbon_series.lower_line.color = "#666666"  # pylint: disable=no-member
        regular_ribbon_series.fill_color = "rgba(102, 102, 102, 0.2)"
        regular_ribbon_series.fill_visible = True

        comparison_chart.add_series(gradient_series)
        comparison_chart.add_series(regular_ribbon_series)

        comparison_chart.render(key="comparison_ribbon_chart")

    # Display data information
    st.write("### Data Information")
    st.write(f"Total data points: {len(gradient_data)}")
    st.write(f"Date range: {gradient_data[0].time} to {gradient_data[-1].time}")

    # Show gradient statistics
    gradient_values = [d.gradient for d in gradient_data if d.gradient is not None]
    if gradient_values:
        min_gradient = min(gradient_values)
        max_gradient = max(gradient_values)
        avg_gradient = sum(gradient_values) / len(gradient_values)

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Min Gradient", f"{min_gradient:.3f}")
        with col2:
            st.metric("Max Gradient", f"{max_gradient:.3f}")
        with col3:
            st.metric("Avg Gradient", f"{avg_gradient:.3f}")

    # Show sample data points
    st.write("### Sample Data Points")
    sample_df = pd.DataFrame(
        [
            {
                "Time": data.time,
                "Upper": f"{data.upper:.2f}",
                "Lower": f"{data.lower:.2f}",
                "Gradient": f"{data.gradient:.3f}" if data.gradient is not None else "N/A",
            }
            for data in gradient_data[:10]  # Show first 10 points
        ],
    )
    st.dataframe(sample_df)

    # Show series configuration
    st.write("### Series Configuration")
    col1, col2 = st.columns(2)

    with col1:
        st.write("**Gradient Ribbon Series:**")
        st.write(f"Chart Type: {gradient_ribbon_series.chart_type}")
        st.write(f"Visible: {gradient_ribbon_series.visible}")  # pylint: disable=no-member
        st.write(
            f"Gradient Start Color: {gradient_ribbon_series.gradient_start_color}",
        )  # pylint: disable=no-member
        st.write(
            f"Gradient End Color: {gradient_ribbon_series.gradient_end_color}",
        )  # pylint: disable=no-member
        st.write(
            f"Normalize Gradients: {gradient_ribbon_series.normalize_gradients}",
        )  # pylint: disable=no-member
        st.write(f"Fill Visible: {gradient_ribbon_series.fill_visible}")

    with col2:
        st.write("**Line Styling:**")
        st.write(
            f"Upper Line Color: {gradient_ribbon_series.upper_line.color}",
        )  # pylint: disable=no-member
        st.write(
            f"Lower Line Color: {gradient_ribbon_series.lower_line.color}",
        )  # pylint: disable=no-member
        st.write(
            f"Line Width: {gradient_ribbon_series.upper_line.line_width}",
        )  # pylint: disable=no-member
        st.write(
            f"Line Style: {gradient_ribbon_series.upper_line.line_style}",
        )  # pylint: disable=no-member

    # Usage instructions
    st.write("### Usage Instructions")
    st.markdown(
        """
    **Gradient Ribbon Series Features:**

    1. **Dynamic Colors**: The fill area between bands changes color based on gradient values
    2. **Customizable Colors**: Set start and end colors for the gradient transition
    3. **Normalization**: Option to normalize gradient values to 0-1 range for consistent coloring
    4. **Two Bands**: Upper and lower bands with individual styling options

    **Use Cases:**
    - Volatility indicators where color intensity represents volatility level
    - Momentum indicators where color shows trend strength
    - Any ribbon-based indicator where color provides additional information

    **Data Format:**
    ```python
    GradientRibbonData(
        time="2024-01-01",
        upper=110.0,
        lower=100.0,
        gradient=0.7  # Value between 0-1 or raw value
    )
    ```

    **Note**: There's currently a TODO in the codebase about frontend support for
        gradient colors per bar.
    The gradient functionality may be limited in the current implementation.
    """,
    )


if __name__ == "__main__":
    main()
