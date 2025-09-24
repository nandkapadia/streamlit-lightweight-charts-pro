"""Test script for RibbonSeries functionality.

This script demonstrates how to create and use the new RibbonSeries
with sample data and configuration.
"""

import pandas as pd
import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import RibbonSeries
from streamlit_lightweight_charts_pro.data import RibbonData


# Create sample data
def create_sample_data():
    """Create sample ribbon data for testing."""
    dates = pd.date_range("2024-01-01", periods=30, freq="D")

    data = []
    for i, date in enumerate(dates):
        # Create some sample upper and lower values
        base_value = 100 + i * 0.5
        upper = base_value + 5 + (i % 7) * 0.3  # Upper band with some variation
        lower = base_value - 3 - (i % 5) * 0.2  # Lower band with some variation

        # Add some optional colors for demonstration
        if i % 10 == 0:  # Every 10th point has custom colors
            data.append(
                RibbonData(
                    str(date.date()),
                    upper=upper,
                    lower=lower,
                    color="#FF0000",  # Custom line color
                    fill="rgba(255, 0, 0, 0.2)",  # Custom fill color
                ),
            )
        else:
            data.append(RibbonData(str(date.date()), upper=upper, lower=lower))

    return data


def main():
    """Main function to demonstrate ribbon series."""
    st.title("Ribbon Series Demo")
    st.write("This demonstrates the new RibbonSeries functionality.")

    # Create sample data
    data = create_sample_data()

    # Create chart
    chart = Chart()

    # Create ribbon series with custom styling
    ribbon_series = RibbonSeries(data=data, visible=True, price_scale_id="right")

    # Customize the series
    ribbon_series.upper_line.color = "#4CAF50"
    ribbon_series.upper_line.line_width = 2
    ribbon_series.upper_line.line_style = "solid"

    ribbon_series.lower_line.color = "#F44336"
    ribbon_series.lower_line.line_width = 2
    ribbon_series.lower_line.line_style = "solid"

    ribbon_series.fill = "rgba(76, 175, 80, 0.1)"
    ribbon_series.color = "#2196F3"
    ribbon_series.fill_visible = True

    # Add series to chart
    chart.add_series(ribbon_series)

    # Display the chart
    st.write("### Ribbon Chart")
    st.write("This chart shows upper and lower bands with fill area between them.")
    st.write("Some data points have custom colors (red line and fill).")

    # Show chart
    st.plotly_chart(chart.to_plotly(), use_container_width=True)

    # Display data info
    st.write("### Data Information")
    st.write(f"Total data points: {len(data)}")
    st.write(f"Date range: {data[0].time} to {data[-1].time}")

    # Show first few data points
    st.write("### Sample Data Points")
    sample_df = pd.DataFrame(
        [
            {
                "Time": data[i].time,
                "Upper": data[i].upper,
                "Lower": data[i].lower,
                "Custom Color": data[i].color is not None,
                "Custom Fill": data[i].fill is not None,
            }
            for i in range(min(5, len(data)))
        ],
    )
    st.dataframe(sample_df)

    # Show series configuration
    st.write("### Series Configuration")
    st.write(f"Chart Type: {ribbon_series.chart_type}")
    st.write(f"Visible: {ribbon_series.visible}")  # pylint: disable=no-member
    st.write(f"Price Scale ID: {ribbon_series.price_scale_id}")  # pylint: disable=no-member
    st.write(f"Pane ID: {ribbon_series.pane_id}")  # pylint: disable=no-member
    st.write(f"Fill Visible: {ribbon_series.fill_visible}")
    st.write(f"Fill Color: {ribbon_series.fill}")
    st.write(f"Line Color: {ribbon_series.color}")


if __name__ == "__main__":
    main()
