#!/usr/bin/env python3
"""Quick Start: Load Data from CSV

Learn how to load data from a CSV file and create a chart.

This example shows:
- How to load data from CSV
- How to use pandas DataFrames with charts
- Column mapping for different data formats

Usage:
    streamlit run from_csv.py
"""

import pandas as pd
import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import LineSeries

from streamlit_lightweight_charts_pro.charts import Chart

st.title("📊 Quick Start: Load Data from CSV")

st.markdown("This example shows how to load data from a CSV file and create a chart.")

# Create sample CSV data
sample_csv = """date,value
2024-01-01,100
2024-01-02,105
2024-01-03,102
2024-01-04,108
2024-01-05,115
2024-01-06,110
2024-01-07,120"""

st.subheader("📄 Sample CSV Data")
st.code(sample_csv, language="csv")

# Load data from CSV
sample_dataframe = pd.read_csv(pd.StringIO(sample_csv))

st.subheader("📊 Loaded DataFrame")
st.dataframe(sample_dataframe)

# Create chart from DataFrame
chart = Chart()
chart.add_series(
    LineSeries(
        data=sample_dataframe,
        column_mapping={"time": "date", "value": "value"},
    ),
)
chart.render(key="csv_chart")

st.subheader("💡 Key Points")
st.markdown(
    """
- Use `pandas.read_csv()` to load CSV data
- Use `column_mapping` to specify which columns to use
- The library automatically handles data type conversion
- Time columns are automatically normalized to timestamps
""",
)

st.subheader("🔧 Try Your Own CSV")
uploaded_file = st.file_uploader("Upload a CSV file", type=["csv"])

if uploaded_file is not None:
    try:
        # Load uploaded CSV
        user_sample_dataframe = pd.read_csv(uploaded_file)

        st.write("**Your Data:**")
        st.dataframe(user_sample_dataframe.head())

        # Let user choose columns
        col1, col2 = st.columns(2)

        with col1:
            time_col = st.selectbox("Select time column", user_sample_dataframe.columns)
        with col2:
            value_col = st.selectbox("Select value column", user_sample_dataframe.columns)

        if st.button("Create Chart"):
            # Create chart with user's data
            user_chart = Chart()
            user_chart.add_series(
                LineSeries(
                    data=user_sample_dataframe,
                    column_mapping={"time": time_col, "value": value_col},
                ),
            )
            user_chart.render(key="user_csv_chart")
            st.success("✅ Chart created successfully!")

    except Exception as e:
        st.error(f"❌ Error loading CSV: {e!s}")
        st.info("💡 Make sure your CSV has at least two columns with date and numeric data")

st.subheader("📚 Next Steps")
st.markdown(
    """
- **[Tutorial 1: Hello World](../tutorials/01_hello_world.py)** - Learn the basics
- **[Tutorial 2: Data Formats](../tutorials/02_data_formats.py)** - Understand
    different data formats
- **[Minimal Example](minimal_example.py)** - Simplest possible chart
""",
)
