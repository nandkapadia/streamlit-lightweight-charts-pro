#!/usr/bin/env python3
"""Tutorial 2: Understanding Data Formats

What you'll learn:
- Different ways to provide data to charts
- Data classes vs dictionaries vs DataFrames
- Time format handling
- Data validation and error handling

Prerequisites:
- Tutorial 1: Hello World
- Basic understanding of Python data structures

Next steps:
- Tutorial 3: Customizing Your Chart
- Tutorial 4: Multiple Series and Chart Types
"""

import pandas as pd
import streamlit as st
from streamlit_lightweight_charts_pro.charts.series import CandlestickSeries, LineSeries

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.data import CandlestickData, LineData

# Page configuration
st.set_page_config(
    page_title="Tutorial 2: Data Formats",
    page_icon="📊",
    layout="wide",
)

st.title("📊 Tutorial 2: Understanding Data Formats")
st.markdown("Learn the different ways to provide data to your charts.")

st.header("📚 What You'll Learn")
st.markdown(
    """
- ✅ How to create data using data classes
- ✅ How to use dictionaries and DataFrames
- ✅ Time format handling (strings, timestamps, dates)
- ✅ Data validation and error handling
- ✅ Best practices for data preparation
""",
)

st.header("🔧 Method 1: Data Classes (Recommended)")

st.markdown(
    """
**Data classes are the most explicit and type-safe way to provide data.**

Each data point is an instance of a specific data class (LineData, CandlestickData, etc.).
""",
)

st.code(
    """
# Create data using data classes
from streamlit_lightweight_charts_pro.data import LineData

data = [
    LineData(time="2024-01-01", value=100),
    LineData(time="2024-01-02", value=105),
    LineData(time="2024-01-03", value=102),
]
""",
    language="python",
)

# Example with data classes
st.subheader("Example: Sales Data")
sales_data = [
    LineData(time="2024-01-01", value=100),
    LineData(time="2024-01-02", value=105),
    LineData(time="2024-01-03", value=102),
    LineData(time="2024-01-04", value=108),
    LineData(time="2024-01-05", value=115),
]

sales_chart = Chart()
sales_chart.add_series(LineSeries(data=sales_data))
sales_chart.render(key="sales_chart")

st.markdown("**Advantages of data classes:**")
st.markdown("- ✅ Type safety and validation")
st.markdown("- ✅ Clear, explicit data structure")
st.markdown("- ✅ IDE autocomplete and error checking")
st.markdown("- ✅ Automatic time normalization")

st.header("📅 Time Format Handling")

st.markdown(
    """
**The library accepts various time formats and automatically normalizes them to UNIX timestamps.**
""",
)

col1, col2 = st.columns(2)

with col1:
    st.subheader("String Dates")
    st.code(
        """
# String dates (ISO format)
LineData(time="2024-01-01", value=100)
LineData(time="2024-01-01T10:30:00", value=100)
    """,
        language="python",
    )

with col2:
    st.subheader("Unix Timestamps")
    st.code(
        """
# Unix timestamps (seconds)
LineData(time=1704067200, value=100)
LineData(time=1704070200, value=100)
    """,
        language="python",
    )

st.subheader("Example: Different Time Formats")
time_formats_data = [
    LineData(time="2024-01-01", value=100),  # ISO date string
    LineData(time="2024-01-01T12:00:00", value=105),  # ISO datetime string
    LineData(time=1704067200, value=110),  # Unix timestamp
    LineData(time=1704070800, value=115),  # Unix timestamp
]

time_formats_chart = Chart()
time_formats_chart.add_series(LineSeries(data=time_formats_data))
time_formats_chart.render(key="time_formats_chart")

st.header("📋 Method 2: Dictionary Format")

st.markdown(
    """
**You can also provide data as dictionaries, useful when loading from JSON or APIs.**
""",
)

st.code(
    """
# Dictionary format
data = [
    {"time": "2024-01-01", "value": 100},
    {"time": "2024-01-02", "value": 105},
    {"time": "2024-01-03", "value": 102},
]

# The library will automatically convert to data classes
series = LineSeries(data=data)
""",
    language="python",
)

# Example with dictionaries
dict_data = [
    {"time": "2024-01-01", "value": 100},
    {"time": "2024-01-02", "value": 105},
    {"time": "2024-01-03", "value": 102},
    {"time": "2024-01-04", "value": 108},
]

dict_chart = Chart()
dict_chart.add_series(LineSeries(data=dict_data))
dict_chart.render(key="dict_chart")

st.header("📊 Method 3: Pandas DataFrame")

st.markdown(
    """
**For larger datasets, you can use pandas DataFrames with column mapping.**
""",
)

st.code(
    """
import pandas as pd

# Create DataFrame
df = pd.DataFrame({
    'date': ['2024-01-01', '2024-01-02', '2024-01-03'],
    'price': [100, 105, 102]
})

# Use column mapping to specify which columns to use
series = LineSeries(
    data=df,
    column_mapping={'time': 'date', 'value': 'price'}
)
""",
    language="python",
)

# Example with DataFrame
df_data = pd.DataFrame(
    {
        "date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],
        "price": [100, 105, 102, 108],
    },
)

dataframe_chart = Chart()
dataframe_chart.add_series(
    LineSeries(
        data=df_data,
        column_mapping={"time": "date", "value": "price"},
    ),
)
dataframe_chart.render(key="dataframe_chart")

st.header("🕯️ Candlestick Data Example")

st.markdown(
    """
**For financial data, use CandlestickData with OHLC (Open, High, Low, Close) values.**
""",
)

st.code(
    """
from streamlit_lightweight_charts_pro.data import CandlestickData

candlestick_data = [
    CandlestickData(
        time="2024-01-01",
        open=100,   # Opening price
        high=105,   # Highest price
        low=98,     # Lowest price
        close=102   # Closing price
    ),
    # ... more data points
]
""",
    language="python",
)

# Example with candlestick data
candlestick_data = [
    CandlestickData(time="2024-01-01", open=100, high=105, low=98, close=102),
    CandlestickData(time="2024-01-02", open=102, high=108, low=101, close=107),
    CandlestickData(time="2024-01-03", open=107, high=110, low=105, close=108),
    CandlestickData(time="2024-01-04", open=108, high=112, low=106, close=111),
]

candlestick_chart = Chart()
candlestick_chart.add_series(CandlestickSeries(data=candlestick_data))
candlestick_chart.render(key="candlestick_chart")

st.header("⚠️ Data Validation and Error Handling")

st.markdown(
    """
**The library validates your data and provides helpful error messages.**
""",
)

st.subheader("Common Data Issues")

with st.expander("❌ Invalid Time Format"):
    st.code(
        """
# This will cause an error
LineData(time="invalid-date", value=100)
# Error: Invalid time format
    """,
        language="python",
    )

with st.expander("❌ Missing Required Fields"):
    st.code(
        """
# This will cause an error for candlestick data
CandlestickData(time="2024-01-01", open=100)
# Error: Missing required fields: high, low, close
    """,
        language="python",
    )

with st.expander("❌ Invalid OHLC Values"):
    st.code(
        """
# This will cause an error
CandlestickData(time="2024-01-01", open=100, high=95, low=98, close=102)
# Error: high must be greater than or equal to low
    """,
        language="python",
    )

st.subheader("✅ Best Practices")

st.markdown(
    """
1. **Use data classes** for new code (most reliable)
2. **Validate your data** before creating series
3. **Use consistent time formats** throughout your application
4. **Handle missing data** appropriately (filter or interpolate)
5. **Test with small datasets** before scaling up
""",
)

st.header("🔧 Interactive Example")

st.markdown("Try creating your own data!")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Input Data")
    num_points = st.slider("Number of data points", 3, 10, 5)

    data_points = []
    for i in range(num_points):
        with st.container():
            col_a, col_b = st.columns(2)
            with col_a:
                time_val = st.text_input(f"Date {i + 1}", f"2024-01-{i + 1:02d}", key=f"time_{i}")
            with col_b:
                value_val = st.number_input(f"Value {i + 1}", value=100 + i * 5, key=f"value_{i}")
            data_points.append({"time": time_val, "value": value_val})

with col2:
    st.subheader("Your Chart")
    try:
        # Create series with user data
        user_series = LineSeries(data=data_points)
        user_chart = Chart()
        user_chart.add_series(user_series)
        user_chart.render(key="user_chart")
        st.success("✅ Chart created successfully!")
    except Exception as e:
        st.error(f"❌ Error: {e!s}")
        st.info("💡 Try checking your date format (use YYYY-MM-DD)")

st.header("➡️ Next Steps")
st.markdown(
    """
Now that you understand data formats, learn about:

1. **[Tutorial 3: Customizing Your Chart](03_customizing_charts.py)** - Colors, styling, and options
2. **[Tutorial 4: Multiple Series and Chart Types](04_multiple_series.py)** -
    Combining different chart types
3. **[Basic Series Usage Example](../base_series/basic_series_usage.py)** - More
    detailed series examples

**Quick Links:**
- [All Tutorials](tutorials/) - Complete tutorial series
- [Examples Index](../launcher.py) - Browse all examples
- [Data Classes Documentation](https://github.com/your-repo/docs) - Full data class reference
""",
)

# Footer
st.markdown("---")
st.markdown(
    "💡 **Tip**: Use data classes for new code, "
    "DataFrames for large datasets, "
    "and dictionaries for API data",
)
