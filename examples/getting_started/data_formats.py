#!/usr/bin/env python3
"""Data Formats Example

This example demonstrates different ways to provide data to charts.
Learn about LineData objects, DataFrames, and data mapping.

What you'll learn:
- Creating data with LineData objects
- Using pandas DataFrames
- Column mapping for DataFrames
- Data validation and conversion
"""

import sys
from pathlib import Path

import pandas as pd
import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import LineSeries

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.data import LineData

# Add project root to path for examples imports
sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


# Page configuration
st.set_page_config(
    page_title="Data Formats",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)


def main():
    """Demonstrate different data input methods."""
    st.title("📊 Data Formats")
    st.markdown("Learn different ways to provide data to your charts.")

    # Method 1: LineData objects
    st.subheader("Method 1: LineData Objects")
    st.markdown("Create data using LineData objects - most explicit and type-safe.")

    # Create sample data with LineData
    line_data = [
        LineData(time="2024-01-01", value=100.0),
        LineData(time="2024-01-02", value=102.5),
        LineData(time="2024-01-03", value=98.7),
        LineData(time="2024-01-04", value=105.2),
        LineData(time="2024-01-05", value=103.8),
    ]

    col1, col2 = st.columns([1, 1])

    with col1:
        st.write("**Code:**")
        st.code(
            """
from streamlit_lightweight_charts_pro.data import LineData

data = [
    LineData(time="2024-01-01", value=100.0),
    LineData(time="2024-01-02", value=102.5),
    # ... more data points
]
""",
            language="python",
        )

    with col2:
        st.write("**Advantages:**")
        st.markdown(
            """
        ✅ Type-safe
        ✅ Clear structure
        ✅ IDE autocomplete
        ✅ Validation built-in
        """,
        )

    # Create chart with LineData
    chart1 = Chart(series=LineSeries(data=line_data))
    chart1.render(key="chart_line_data")

    st.markdown("---")

    # Method 2: DataFrame
    st.subheader("Method 2: Pandas DataFrame")
    st.markdown("Use DataFrames for data that's already in tabular format.")

    # Create sample DataFrame
    df_data = pd.DataFrame(
        {
            "date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
            "price": [100.0, 102.5, 98.7, 105.2, 103.8],
            "volume": [1000, 1200, 800, 1500, 1100],
        },
    )

    col1, col2 = st.columns([1, 1])

    with col1:
        st.write("**DataFrame:**")
        st.dataframe(df_data)

    with col2:
        st.write("**Code:**")
        st.code(
            """
import pandas as pd

df = pd.DataFrame({
    'date': ['2024-01-01', '2024-01-02', ...],
    'price': [100.0, 102.5, ...],
    'volume': [1000, 1200, ...]
})

# Use column mapping
line_series = LineSeries(
    data=df,
    column_mapping={
        'time': 'date',
        'value': 'price'
    }
)
""",
            language="python",
        )

    # Create chart with DataFrame
    chart2 = Chart(
        series=LineSeries(
            data=df_data,
            column_mapping={"time": "date", "value": "price"},
        ),
    )
    chart2.render(key="chart_dataframe")

    st.markdown("---")

    # Method 3: Different DataFrame formats
    st.subheader("Method 3: Different DataFrame Formats")
    st.markdown("DataFrames can have different column names - just map them correctly.")

    # Create DataFrame with different column names
    df_variations = pd.DataFrame(
        {
            "timestamp": pd.date_range("2024-01-01", periods=5, freq="D"),
            "closing_price": [100.0, 102.5, 98.7, 105.2, 103.8],
            "trading_volume": [1000, 1200, 800, 1500, 1100],
        },
    )

    col1, col2 = st.columns([1, 1])

    with col1:
        st.write("**Different Column Names:**")
        st.dataframe(df_variations)

    with col2:
        st.write("**Mapping:**")
        st.code(
            """
# Map different column names
line_series = LineSeries(
    data=df_variations,
    column_mapping={
        'time': 'timestamp',
        'value': 'closing_price'
    }
)
""",
            language="python",
        )

    # Create chart with mapped DataFrame
    chart3 = Chart(
        series=LineSeries(
            data=df_variations,
            column_mapping={"time": "timestamp", "value": "closing_price"},
        ),
    )
    chart3.render(key="chart_mapped_dataframe")

    # Interactive example
    st.markdown("---")
    st.subheader("🎮 Interactive Example")
    st.markdown("Try creating your own data:")

    col1, col2 = st.columns([1, 1])

    with col1:
        data_type = st.selectbox(
            "Choose data format:",
            ["LineData Objects", "DataFrame"],
        )

        num_points = st.slider("Number of data points:", 3, 10, 5)

    with col2:
        if data_type == "LineData Objects":
            st.write("**Generated LineData objects:**")
            sample_data = []
            for i in range(num_points):
                value = 100 + i * 2 + (i % 2) * 5  # Simple pattern
                sample_data.append(f'LineData(time="2024-01-{i + 1:02d}", value={value}.0)')

            for line in sample_data[:3]:
                st.code(line)
            if len(sample_data) > 3:
                st.write("...")

        else:
            st.write("**Generated DataFrame:**")
            sample_df = pd.DataFrame(
                {
                    "date": [f"2024-01-{i + 1:02d}" for i in range(num_points)],
                    "value": [100 + i * 2 + (i % 2) * 5 for i in range(num_points)],
                },
            )
            st.dataframe(sample_df)

    # Key concepts
    st.subheader("🔑 Key Concepts")
    st.markdown(
        """
    **When to use each method:**

    **LineData Objects:**
    - ✅ Small datasets
    - ✅ Type safety is important
    - ✅ Clear data structure

    **DataFrames:**
    - ✅ Large datasets
    - ✅ Data from CSV/database
    - ✅ Need to manipulate data first
    - ✅ Multiple columns available

    **Column Mapping:**
    - Maps DataFrame columns to chart data fields
    - `time`: The time/date column
    - `value`: The value column
    - Flexible - use any column names you want
    """,
    )

    # Next steps
    st.subheader("➡️ Next Steps")
    st.markdown(
        """
    Now that you understand data formats, explore:

    - **[Basic Line Chart](basic_line_chart.py)** - Your first chart
    - **[Chart Customization](../advanced_features/chart_customization.py)** - Make it look great
    - **[Multi-Pane Charts](../advanced_features/multi_pane_charts.py)** - Multiple series
    """,
    )


if __name__ == "__main__":
    main()
