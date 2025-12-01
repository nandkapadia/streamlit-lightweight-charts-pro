#!/usr/bin/env python3
"""Basic Line Chart Example

This example demonstrates how to create a simple line chart with the library.
Perfect for beginners who want to understand the core concepts.

What you'll learn:
- Basic imports and setup
- Creating simple data
- Building a line chart
- Understanding the core workflow
"""

import sys
from pathlib import Path

import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import LineSeries

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.data import LineData

# Add project root to path for examples imports
sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


# Page configuration
st.set_page_config(
    page_title="Basic Line Chart",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)


def main():
    """Create and display a basic line chart."""
    st.title("📈 Basic Line Chart")
    st.markdown("Learn how to create your first line chart with sample data.")

    # Create sample data
    st.subheader("📊 Sample Data")
    st.markdown("We'll create a simple dataset showing stock prices over time.")

    # Sample stock price data
    data = [
        LineData(time="2024-01-01", value=100.0),
        LineData(time="2024-01-02", value=102.5),
        LineData(time="2024-01-03", value=98.7),
        LineData(time="2024-01-04", value=105.2),
        LineData(time="2024-01-05", value=103.8),
        LineData(time="2024-01-06", value=107.1),
        LineData(time="2024-01-07", value=109.5),
        LineData(time="2024-01-08", value=106.3),
        LineData(time="2024-01-09", value=111.2),
        LineData(time="2024-01-10", value=108.7),
    ]

    # Show the data
    col1, col2 = st.columns([2, 1])

    with col1:
        st.write("**Data Points:**")
        for _i, point in enumerate(data[:5]):  # Show first 5 points
            st.write(f"• {point.time}: ${point.value}")
        if len(data) > 5:
            st.write(f"... and {len(data) - 5} more points")

    with col2:
        st.metric("Data Points", len(data))
        st.metric(
            "Price Range",
            f"${min(d.value for d in data):.1f} - ${max(d.value for d in data):.1f}",
        )

    # Create the chart
    st.subheader("📈 Your Chart")
    st.markdown("Here's your line chart created from the data above:")

    # Create line series
    line_series = LineSeries(data=data)

    # Create chart
    chart = Chart(series=line_series)

    # Display chart
    chart.render(key="basic_line_chart")

    # Show the code
    st.subheader("💻 The Code")
    st.markdown("Here's the complete code to create this chart:")

    st.code(
        """
import streamlit as st
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import LineData

# Create sample data
data = [
    LineData(time="2024-01-01", value=100.0),
    LineData(time="2024-01-02", value=102.5),
    # ... more data points
]

# Create line series
line_series = LineSeries(data=data)

# Create and display chart
chart = Chart(series=line_series)
chart.render(key="my_chart")
""",
        language="python",
    )

    # Key concepts
    st.subheader("🔑 Key Concepts")
    st.markdown(
        """
    **Understanding the workflow:**
    1. **LineData**: Represents individual data points with time and value
    2. **LineSeries**: Tells the chart how to display the data (as a line)
    3. **Chart**: Container that holds and manages the series
    4. **render()**: Displays the chart in Streamlit

    **Why this structure?**
    - **Modular**: Each component has a specific purpose
    - **Flexible**: Easy to add multiple series or customize
    - **Consistent**: Same pattern works for all chart types
    """,
    )

    # Next steps
    st.subheader("➡️ Next Steps")
    st.markdown(
        """
    Ready to learn more? Check out:

    - **[Data Formats](data_formats.py)** - Learn different ways to provide data
    - **[Chart Customization](../advanced_features/chart_customization.py)** - Colors,
        styles,
        and options
    - **[Multi-Pane Charts](../advanced_features/multi_pane_charts.py)** - Multiple
        charts in one view
    """,
    )


if __name__ == "__main__":
    main()
