"""
Advanced Series Features Example

This example demonstrates advanced Series functionality including method chaining,
configuration management, serialization, and advanced usage patterns.
"""

import json
import os

# Add project root to path for examples imports
import sys

import streamlit as st

from examples.data_samples import get_line_data
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.options.price_format_options import PriceFormatOptions
from streamlit_lightweight_charts_pro.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.type_definitions.enums import MarkerPosition, MarkerShape

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


def main():
    """Demonstrate advanced Series features."""
    st.title("Advanced Series Features")
    st.write("This example shows advanced Series functionality and usage patterns.")

    # Get sample data
    data = get_line_data()

    st.header("1. Method Chaining")
    st.write("Use method chaining for fluent API usage:")

    # Method chaining example
    chained_series = (
        LineSeries(data=data)
        .set_visible(True)
        .add_marker("2018-12-25", MarkerPosition.ABOVE_BAR, "#FF0000", MarkerShape.CIRCLE, "Peak")
        .add_price_line(PriceLineOptions(price=30.0, color="#FF0000", title="Resistance"))
    )

    st.write("**Method chaining result:**")
    st.write(f"Visible: {chained_series._visible}")
    st.write(f"Markers: {len(chained_series.markers)}")
    st.write(f"Price lines: {len(chained_series.price_lines)}")

    chart = Chart(series=chained_series)
    chart.render()

    st.header("2. Price Format Configuration")
    st.write("Configure price formatting options:")

    # Create price format options
    price_format = PriceFormatOptions(type="price", precision=2, min_move=0.01)

    series_with_format = LineSeries(data=data)
    series_with_format.price_format = price_format

    st.write("**Price Format Configuration:**")
    st.write(f"Type: {series_with_format.price_format.type}")
    st.write(f"Precision: {series_with_format.price_format.precision}")
    st.write(f"Min Move: {series_with_format.price_format.min_move}")

    chart = Chart(series=series_with_format)
    chart.render()

    st.header("3. Series Configuration Management")
    st.write("Manage series configuration programmatically:")

    # Create series with full configuration
    config_series = LineSeries(data=data, visible=True, price_scale_id="right", pane_id=0)

    # Add markers and price lines
    config_series.add_marker(
        "2018-12-25", MarkerPosition.ABOVE_BAR, "#FF0000", MarkerShape.CIRCLE, "Peak"
    )
    config_series.add_marker(
        "2018-12-30", MarkerPosition.BELOW_BAR, "#00FF00", MarkerShape.SQUARE, "Low"
    )
    config_series.add_price_line(PriceLineOptions(price=30.0, color="#FF0000", title="Resistance"))
    config_series.add_price_line(PriceLineOptions(price=20.0, color="#00FF00", title="Support"))

    st.write("**Full Configuration:**")
    st.write(f"Visible: {config_series._visible}")
    st.write(f"Price Scale ID: {config_series.price_scale_id}")
    st.write(f"Pane ID: {config_series.pane_id}")
    st.write(f"Markers: {len(config_series.markers)}")
    st.write(f"Price Lines: {len(config_series.price_lines)}")

    chart = Chart(series=config_series)
    chart.render()

    st.header("4. Series Serialization")
    st.write("Serialize series to different formats:")

    series = LineSeries(data=data)
    series.add_marker("2018-12-25", MarkerPosition.ABOVE_BAR, "#FF0000", MarkerShape.CIRCLE, "Peak")
    series.add_price_line(PriceLineOptions(price=30.0, color="#FF0000", title="Resistance"))

    # Serialize to dictionary
    config_dict = series.asdict()

    st.write("**Serialized Configuration:**")
    st.write("Configuration keys:", list(config_dict.keys()))
    st.write("Options keys:", list(config_dict.get("options", {}).keys()))

    # Show JSON representation
    st.write("**JSON Representation:**")
    json_str = json.dumps(config_dict, indent=2, default=str)
    st.code(json_str, language="json")

    st.header("5. Series Validation")
    st.write("Demonstrate series validation:")

    # Valid series
    st.subheader("Valid Series")
    valid_series = LineSeries(data=data)
    try:
        valid_series._validate_pane_config()
        st.write("✅ Valid series configuration")
    except ValueError as e:
        st.write(f"❌ Validation error: {e}")

    # Invalid pane configuration
    st.subheader("Invalid Pane Configuration")
    invalid_series = LineSeries(data=data, pane_id=-1)
    try:
        invalid_series._validate_pane_config()
        st.write("This should not execute")
    except ValueError as e:
        st.write(f"❌ Validation error: {e}")

    st.header("6. Series Factory Methods")
    st.write("Use factory methods for series creation:")

    # Create DataFrame for factory method
    import pandas as pd

    df = pd.DataFrame({"datetime": [d.time for d in data], "close": [d.value for d in data]})

    st.write("**DataFrame for factory method:**")
    st.write(df.head())

    # Use from_dataframe factory method
    factory_series = LineSeries.from_dataframe(
        df=df, column_mapping={"time": "datetime", "value": "close"}, price_scale_id="right"
    )

    st.write("**Series from factory method:**")
    st.write(f"Data points: {len(factory_series.data)}")
    st.write(f"Price scale ID: {factory_series.price_scale_id}")

    chart = Chart(series=factory_series)
    chart.render()

    st.header("7. Series Comparison")
    st.write("Compare different series configurations:")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Basic Series")
        basic_series = LineSeries(data=data)
        basic_chart = Chart(series=basic_series)
        basic_chart.render()

    with col2:
        st.subheader("Enhanced Series")
        enhanced_series = (
            LineSeries(data=data)
            .add_marker(
                "2018-12-25", MarkerPosition.ABOVE_BAR, "#FF0000", MarkerShape.CIRCLE, "Peak"
            )
            .add_price_line(PriceLineOptions(price=30.0, color="#FF0000", title="Resistance"))
        )
        enhanced_chart = Chart(series=enhanced_series)
        enhanced_chart.render()

    st.header("8. Series Data Access Patterns")
    st.write("Different ways to access series data:")

    series = LineSeries(data=data)

    # Access data directly
    st.write("**Direct Data Access:**")
    st.write(f"Data length: {len(series.data)}")
    st.write(f"First value: {series.data[0].value}")
    st.write(f"Last value: {series.data[-1].value}")

    # Access data dictionary
    st.write("**Data Dictionary Access:**")
    data_dict = series.data_dict
    st.write(f"Dictionary length: {len(data_dict)}")
    st.write(f"First entry: {data_dict[0]}")

    # Access specific data points
    st.write("**Specific Data Points:**")
    if len(series.data) >= 3:
        st.write(f"Third data point: {series.data[2]}")
        st.write(f"Third value: {series.data[2].value}")
        st.write(f"Third time: {series.data[2].time}")


if __name__ == "__main__":
    main()
