"""
Line Chart with DataFrame Input Example.

This example demonstrates how to create line charts using pandas DataFrames
with column mapping. This is useful when working with real-world data
that comes in DataFrame format.
"""

import os

# Add project root to path for examples imports
import sys

import streamlit as st

from examples.data_samples import get_dataframe_line_data
from streamlit_lightweight_charts_pro import Chart
from streamlit_lightweight_charts_pro.charts.options.price_line_options import PriceLineOptions
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.type_definitions.enums import LineStyle

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


# Page configuration
st.set_page_config(page_title="Line Chart with DataFrame", page_icon="📈", layout="wide")

st.title("📈 Line Chart with DataFrame Input")
st.markdown("Demonstrates how to create line charts using pandas DataFrames with column mapping.")

# Get sample DataFrame
df = get_dataframe_line_data()

# Display original DataFrame info
st.subheader("📊 Original DataFrame Info")
st.write(f"**Shape:** {df.shape}")
st.write(f"**Columns:** {list(df.columns)}")
st.write(f"**Data Types:** {dict(df.dtypes)}")

# Show DataFrame info
st.subheader("📋 DataFrame Information")
col1, col2 = st.columns(2)

with col1:
    st.write("**DataFrame Shape:**", df.shape)
    st.write("**Columns:**", list(df.columns))
    st.write("**Data Types:**")
    st.write(dict(df.dtypes))

with col2:
    st.write("**Sample Data:**")
    st.write(df.head().to_dict("records"))

# Define column mapping
column_mapping = {
    "time": "datetime",  # Map 'datetime' column to 'time'
    "value": "value",  # Map 'value' column to 'value'
}

st.subheader("🔗 Column Mapping")
st.write("Column mapping configuration:")
st.json(column_mapping)

# Create line series from DataFrame
line_series = LineSeries.from_dataframe(df=df, column_mapping=column_mapping)

# Create chart
chart = Chart(series=line_series)

# Display the chart
st.subheader("📈 Line Chart from DataFrame")
chart.render(key="line_chart_dataframe")

# Show the conversion process
st.subheader("🔄 Conversion Process")
st.markdown(
    """
The `from_dataframe` method:
1. **Validates** the DataFrame has required columns
2. **Converts** DataFrame rows to `LineData` objects
3. **Normalizes** time values to UNIX timestamps
4. **Handles** NaN values appropriately
5. **Returns** a `LineSeries` object ready for charting
"""
)

# Demonstrate advanced DataFrame usage
st.subheader("🚀 Advanced DataFrame Usage")

# Create a more complex DataFrame with additional columns
advanced_df = df.copy()
advanced_df["volume"] = [1000000 + i * 50000 for i in range(len(df))]
advanced_df["change"] = advanced_df["value"].diff()
advanced_df["color"] = advanced_df["change"].apply(
    lambda x: "#26a69a" if x > 0 else "#ef5350" if x < 0 else "#9e9e9e"
)

st.write("**Advanced DataFrame with additional columns:**")
st.write(f"**Shape:** {advanced_df.shape}")
st.write(f"**Columns:** {list(advanced_df.columns)}")
st.write(f"**Sample Data:**")
st.write(advanced_df.head().to_dict("records"))

# Create line series with color mapping
advanced_column_mapping = {
    "time": "datetime",
    "value": "value",
    "color": "color",  # Map color column
}

st.write("**Advanced column mapping with color:**")
st.json(advanced_column_mapping)

# Create advanced line series
advanced_line_series = LineSeries.from_dataframe(
    df=advanced_df, column_mapping=advanced_column_mapping
)

# Add some price lines and markers
min_price = advanced_df["value"].min()
max_price = advanced_df["value"].max()
avg_price = advanced_df["value"].mean()

# Create price lines
support_line = PriceLineOptions(
    price=min_price, color="#26a69a", line_width=2, line_style=LineStyle.DASHED, title="Support"
)

resistance_line = PriceLineOptions(
    price=max_price, color="#ef5350", line_width=2, line_style=LineStyle.DASHED, title="Resistance"
)

# Add price lines to series
advanced_line_series = advanced_line_series.add_price_line(support_line).add_price_line(
    resistance_line
)

# Create chart with advanced series
advanced_chart = Chart(series=advanced_line_series)

# Display advanced chart
st.subheader("📈 Advanced Line Chart with Color Mapping")
advanced_chart.render(key="advanced_line_chart_dataframe")

# Show DataFrame handling features
st.subheader("✨ DataFrame Handling Features")
col1, col2 = st.columns(2)

with col1:
    st.markdown("**Supported Features:**")
    st.markdown("- ✅ Column mapping")
    st.markdown("- ✅ Time normalization")
    st.markdown("- ✅ NaN handling")
    st.markdown("- ✅ Color mapping")
    st.markdown("- ✅ Index support")

with col2:
    st.markdown("**Data Validation:**")
    st.markdown("- ✅ Required columns check")
    st.markdown("- ✅ Data type validation")
    st.markdown("- ✅ Time format detection")
    st.markdown("- ✅ Value range validation")
    st.markdown("- ✅ Error handling")

# Show code examples
st.subheader("💻 Code Examples")

st.markdown("**Basic DataFrame Usage:**")
st.code(
    """
# Simple DataFrame to LineSeries
df = pd.DataFrame({
    'datetime': ['2024-01-01', '2024-01-02'],
    'value': [100, 105]
})

column_mapping = {
    'time': 'datetime',
    'value': 'value'
}

line_series = LineSeries.from_dataframe(df, column_mapping)
""",
    language="python",
)

st.markdown("**Advanced DataFrame Usage with Color:**")
st.code(
    """
# DataFrame with color mapping
df['color'] = df['change'].apply(
    lambda x: '#26a69a' if x > 0 else '#ef5350'
)

advanced_mapping = {
    'time': 'datetime',
    'value': 'value',
    'color': 'color'
}

line_series = LineSeries.from_dataframe(df, advanced_mapping)
""",
    language="python",
)

# Show benefits
st.subheader("🎯 Benefits of DataFrame Input")
st.markdown(
    """
- **Seamless Integration**: Works directly with pandas DataFrames
- **Flexible Mapping**: Map any DataFrame columns to chart properties
- **Data Validation**: Automatic validation of required columns and data types
- **Performance**: Efficient conversion from DataFrame to chart data
- **Real-world Ready**: Perfect for data analysis workflows
- **Error Handling**: Clear error messages for missing or invalid data
"""
)

st.markdown("---")
st.markdown(
    "**This example demonstrates the powerful DataFrame integration capabilities of the line chart"
    " component.**"
)
