"""Data Handling Example

This example demonstrates the data handling capabilities that all series types share.
It shows how to work with different data formats: Data objects, DataFrames, and Series.
"""

# Add project root to path for examples imports
import sys
from pathlib import Path

import pandas as pd
import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import LineSeries

from examples.utilities.data_samples import get_dataframe_line_data, get_line_data
from streamlit_lightweight_charts_pro.charts import Chart

sys.path.insert(0, str(Path(__file__).parent / ".." / ".."))


def main():
    """Demonstrate data handling capabilities."""
    st.title("Data Handling")
    st.write("This example shows how to work with different data formats in series.")

    st.header("1. Data Objects Input")
    st.write("Create series with data model objects:")

    # Get data as LineData objects
    line_data = get_line_data()

    series_from_objects = LineSeries(data=line_data)

    st.write("**Data from objects:**")
    st.write(f"Number of data points: {len(series_from_objects.data)}")
    st.write(f"Data type: {type(series_from_objects.data[0])}")
    st.write(f"First data point: {series_from_objects.data[0]}")

    chart = Chart(series=series_from_objects)
    chart.render(key="chart")

    st.header("2. DataFrame Input")
    st.write("Create series with pandas DataFrame:")

    # Get DataFrame data
    df_data = get_dataframe_line_data()

    st.write("**DataFrame structure:**")
    st.write(df_data.head())

    # Create series with DataFrame and column mapping
    series_from_df = LineSeries(data=df_data, column_mapping={"time": "datetime", "value": "close"})

    st.write("**Series from DataFrame:**")
    st.write(f"Number of data points: {len(series_from_df.data)}")
    st.write(f"Data type: {type(series_from_df.data[0])}")

    chart = Chart(series=series_from_df)
    chart.render(key="chart")

    st.header("3. Series Input")
    st.write("Create series with pandas Series:")

    # Create a pandas Series from the DataFrame
    series_data = df_data["close"]

    st.write("**Series data:**")
    st.write(series_data.head())

    # Create series with pandas Series and column mapping
    series_from_series = LineSeries(
        data=series_data,
        column_mapping={"time": "index", "value": 0},  # Use the series values directly
    )

    st.write("**Series from pandas Series:**")
    st.write(f"Number of data points: {len(series_from_series.data)}")

    chart = Chart(series=series_from_series)
    chart.render(key="chart")

    st.header("4. Column Mapping Examples")
    st.write("Demonstrate different column mapping configurations:")

    # Example with different column names
    df_custom = pd.DataFrame(
        {
            "date": df_data["datetime"],
            "price": df_data["close"],
            "volume": [100, 200, 300, 400, 500] * 2,
        },
    )

    st.write("**Custom DataFrame:**")
    st.write(df_custom.head())

    # Map custom column names
    series_custom_mapping = LineSeries(
        data=df_custom,
        column_mapping={"time": "date", "value": "price"},
    )

    chart = Chart(series=series_custom_mapping)
    chart.render(key="chart")

    st.header("5. Data Validation")
    st.write("Show data validation and error handling:")

    # Empty data
    st.subheader("Empty Data")
    empty_series = LineSeries(data=[])
    st.write(f"Empty series data points: {len(empty_series.data)}")

    # None data
    st.subheader("None Data")
    none_series = LineSeries(data=None)
    st.write(f"None series data points: {len(none_series.data)}")

    # Invalid data type
    st.subheader("Invalid Data Type")
    try:
        _ = LineSeries(data="invalid")
        st.write("This should not execute")
    except ValueError as e:
        st.write(f"**Error caught:** {e}")

    st.header("6. Data Access Methods")
    st.write("Access data in different formats:")

    series = LineSeries(data=line_data)

    # Access raw data
    st.write("**Raw Data Objects:**")
    st.write(f"Number of data points: {len(series.data)}")
    st.write(f"First data point: {series.data[0]}")

    # Access data dictionary (for frontend)
    st.write("**Data Dictionary (for frontend):**")
    data_dict = series.data_dict
    st.write(f"Number of data points: {len(data_dict)}")
    st.write(f"First data point: {data_dict[0] if data_dict else 'No data'}")

    # Access complete configuration
    st.write("**Complete Configuration:**")
    config = series.asdict()
    st.write(f"Configuration keys: {list(config.keys())}")
    st.write(f"Data in config: {len(config.get('data', []))} points")

    st.header("7. Data Processing")
    st.write("Demonstrate data processing capabilities:")

    # Filter data
    st.subheader("Filtered Data")
    filtered_data = [d for d in line_data if d.value > 25]
    filtered_series = LineSeries(data=filtered_data)

    st.write(f"Original data points: {len(line_data)}")
    st.write(f"Filtered data points: {len(filtered_data)}")

    chart = Chart(series=filtered_series)
    chart.render(key="chart")

    # Sorted data
    st.subheader("Sorted Data")
    sorted_data = sorted(line_data, key=lambda x: x.value, reverse=True)
    sorted_series = LineSeries(data=sorted_data)

    st.write(f"Sorted by value (descending): {len(sorted_data)} points")

    chart = Chart(series=sorted_series)
    chart.render(key="chart")


if __name__ == "__main__":
    main()
