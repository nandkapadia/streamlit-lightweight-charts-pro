#!/usr/bin/env python3
"""
Tutorial 1: Hello World - Your First Chart

What you'll learn:
- How to create your very first chart
- Basic imports and setup
- Simple data creation
- Displaying a chart in Streamlit

Prerequisites:
- Basic Python knowledge
- Streamlit installed (pip install streamlit)
- This library installed (pip install streamlit-lightweight-charts-pro)

Next steps:
- Tutorial 2: Understanding Data Formats
- Tutorial 3: Customizing Your Chart
"""

import streamlit as st
from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import LineData

# Page configuration
st.set_page_config(
    page_title="Tutorial 1: Hello World",
    page_icon="👋",
    layout="wide"
)

st.title("👋 Tutorial 1: Hello World - Your First Chart")
st.markdown("Welcome to Streamlit Lightweight Charts Pro! Let's create your very first chart.")

st.header("📚 What You'll Learn")
st.markdown("""
- ✅ How to import the necessary components
- ✅ How to create simple data
- ✅ How to create a chart series
- ✅ How to display the chart in Streamlit
""")

st.header("🚀 Let's Create Your First Chart")

st.markdown("""
**Step 1: Create some simple data**

We'll create a simple line chart showing sales data over time.
""")

# Create simple data manually
sales_data = [
    LineData(time="2024-01-01", value=100),
    LineData(time="2024-01-02", value=105),
    LineData(time="2024-01-03", value=102),
    LineData(time="2024-01-04", value=108),
    LineData(time="2024-01-05", value=115),
    LineData(time="2024-01-06", value=110),
    LineData(time="2024-01-07", value=120),
]

st.code("""
# Create simple data manually
sales_data = [
    LineData(time="2024-01-01", value=100),
    LineData(time="2024-01-02", value=105),
    LineData(time="2024-01-03", value=102),
    LineData(time="2024-01-04", value=108),
    LineData(time="2024-01-05", value=115),
    LineData(time="2024-01-06", value=110),
    LineData(time="2024-01-07", value=120),
]
""", language="python")

st.markdown("""
**Step 2: Create a line series**

A series defines how your data should be displayed (as a line, bar, etc.).
""")

st.code("""
# Create a line series with our data
line_series = LineSeries(data=sales_data)
""", language="python")

# Create the series
line_series = LineSeries(data=sales_data)

st.markdown("""
**Step 3: Create a chart and add the series**

The chart is the container that holds your series and handles display.
""")

st.code("""
# Create a chart and add the series
chart = Chart()
chart.add_series(line_series)
""", language="python")

# Create the chart
chart = Chart()
chart.add_series(line_series)

st.markdown("""
**Step 4: Display the chart**

Finally, we render the chart in Streamlit.
""")

st.code("""
# Display the chart
chart.render(key="my_first_chart")
""", language="python")

# Display the chart
st.subheader("📊 Your First Chart!")
chart.render(key="my_first_chart")

st.header("🎉 Congratulations!")
st.success("You've created your first chart! 🎉")

st.markdown("""
**What just happened:**
1. We created data points with dates and values
2. We wrapped the data in a LineSeries
3. We created a Chart and added our series to it
4. We displayed it using `chart.render()`

**Key concepts:**
- **LineData**: Represents a single data point with time and value
- **LineSeries**: Tells the chart how to display the data (as a line)
- **Chart**: The container that holds and displays series
- **render()**: Displays the chart in Streamlit
""")

st.header("🔧 Try It Yourself!")
st.markdown("Modify the data above and see how your chart changes!")

if st.button("🔄 Regenerate with Random Data"):
    import random
    
    # Generate new random data
    new_data = []
    base_value = 100
    for i in range(7):
        base_value += random.randint(-10, 15)
        new_data.append(LineData(time=f"2024-01-{i+1:02d}", value=max(base_value, 50)))
    
    # Create new chart
    new_series = LineSeries(data=new_data)
    new_chart = Chart()
    new_chart.add_series(new_series)
    
    st.subheader("📊 Your Updated Chart!")
    new_chart.render(key="updated_chart")

st.header("➡️ Next Steps")
st.markdown("""
Ready to learn more? Check out:

1. **[Tutorial 2: Understanding Data Formats](tutorial_02_data_formats.py)** - Learn about different ways to provide data
2. **[Tutorial 3: Customizing Your Chart](tutorial_03_customizing_charts.py)** - Learn about colors, styling, and options
3. **[Basic Line Chart Example](../line_charts/line_chart_basic.py)** - A more detailed line chart example

**Quick Links:**
- [All Tutorials](tutorials/) - Complete tutorial series
- [Examples Index](../launcher.py) - Browse all examples
- [Documentation](https://github.com/your-repo/docs) - Full API documentation
""")

# Footer
st.markdown("---")
st.markdown("💡 **Tip**: This tutorial is designed to be run with `streamlit run 01_hello_world.py`")
