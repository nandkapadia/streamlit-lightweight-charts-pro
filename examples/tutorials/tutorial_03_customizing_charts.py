#!/usr/bin/env python3
"""Tutorial 3: Customizing Your Chart

What you'll learn:
- How to customize chart appearance
- Colors, line styles, and visual options
- Chart layout and sizing
- Method chaining for fluent API

Prerequisites:
- Tutorial 1: Hello World
- Tutorial 2: Understanding Data Formats

Next steps:
- Tutorial 4: Multiple Series and Chart Types
- Tutorial 5: Advanced Features
"""

import streamlit as st

from streamlit_lightweight_charts_pro.charts import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from streamlit_lightweight_charts_pro.data import LineData

# Page configuration
st.set_page_config(
    page_title="Tutorial 3: Customizing Charts",
    page_icon="🎨",
    layout="wide",
)

st.title("🎨 Tutorial 3: Customizing Your Chart")
st.markdown("Learn how to make your charts look amazing with colors, styles, and layouts.")

st.header("📚 What You'll Learn")
st.markdown(
    """
- ✅ How to customize colors and line styles
- ✅ How to set chart size and layout
- ✅ How to use method chaining for clean code
- ✅ How to create professional-looking charts
- ✅ Chart options and configuration
""",
)

# Create sample data for all examples
sample_data = [
    LineData(time="2024-01-01", value=100),
    LineData(time="2024-01-02", value=105),
    LineData(time="2024-01-03", value=102),
    LineData(time="2024-01-04", value=108),
    LineData(time="2024-01-05", value=115),
    LineData(time="2024-01-06", value=110),
    LineData(time="2024-01-07", value=120),
]

st.header("🎨 Basic Customization")

st.markdown(
    """
**Start with a basic chart and then customize it step by step.**
""",
)

st.subheader("Default Chart")
basic_chart = Chart()
basic_chart.add_series(LineSeries(data=sample_data))
basic_chart.render(key="basic_chart")

st.code(
    """
# Basic chart (default styling)
chart = Chart()
chart.add_series(LineSeries(data=sample_data))
chart.render(key="basic_chart")
""",
    language="python",
)

st.subheader("Customized Chart")
custom_chart = Chart()
custom_chart.add_series(LineSeries(data=sample_data))
custom_chart.update_options(width=800, height=400)
custom_chart.render(key="custom_chart")

st.code(
    """
# Customized chart with size
chart = Chart()
chart.add_series(LineSeries(data=sample_data))
chart.update_options(width=800, height=400)
chart.render(key="custom_chart")
""",
    language="python",
)

st.header("🔗 Method Chaining (Fluent API)")

st.markdown(
    """
**Use method chaining to create clean, readable code.**
""",
)

st.subheader("Method Chaining Example")
chained_chart = (
    Chart().add_series(LineSeries(data=sample_data)).update_options(width=600, height=300)
)
chained_chart.render(key="chained_chart")

st.code(
    """
# Method chaining - clean and readable
chart = Chart().add_series(LineSeries(data=sample_data)).update_options(width=600, height=300)
chart.render(key="chained_chart")
""",
    language="python",
)

st.markdown("**Benefits of method chaining:**")
st.markdown("- ✅ Cleaner, more readable code")
st.markdown("- ✅ Less repetitive variable assignments")
st.markdown("- ✅ Fluent, intuitive API")
st.markdown("- ✅ Easy to add more customizations")

st.header("🎨 Colors and Styles")

st.markdown(
    """
**Customize the appearance of your series with colors and styles.**
""",
)

col1, col2 = st.columns(2)

with col1:
    st.subheader("Color Examples")

    # Red line
    red_chart = Chart()
    red_chart.add_series(LineSeries(data=sample_data))
    red_chart.update_options(width=300, height=200)
    red_chart.render(key="red_chart")

    st.code(
        """
# Red line chart
chart = Chart()
chart.add_series(LineSeries(data=sample_data))
chart.update_options(width=300, height=200)
chart.render(key="red_chart")
    """,
        language="python",
    )

with col2:
    st.subheader("Style Examples")

    # Dashed line
    dashed_chart = Chart()
    dashed_chart.add_series(LineSeries(data=sample_data))
    dashed_chart.update_options(width=300, height=200)
    dashed_chart.render(key="dashed_chart")

    st.code(
        """
# Dashed line chart
chart = Chart()
chart.add_series(LineSeries(data=sample_data))
chart.update_options(width=300, height=200)
chart.render(key="dashed_chart")
    """,
        language="python",
    )

st.header("📏 Chart Layout Options")

st.markdown(
    """
**Control the overall layout and appearance of your chart.**
""",
)

st.subheader("Layout Options")
layout_chart = Chart()
layout_chart.add_series(LineSeries(data=sample_data))
layout_chart.update_options(
    width=800,
    height=400,
    background_color="#f8f9fa",
    grid_color="#e9ecef",
)
layout_chart.render(key="layout_chart")

st.code(
    """
# Chart with custom layout
chart = Chart()
chart.add_series(LineSeries(data=sample_data))
chart.update_options(
    width=800,
    height=400,
    background_color="#f8f9fa",
    grid_color="#e9ecef"
)
chart.render(key="layout_chart")
""",
    language="python",
)

st.header("🎛️ Interactive Customization")

st.markdown(
    """
**Try customizing a chart interactively!**
""",
)

col1, col2 = st.columns([1, 2])

with col1:
    st.subheader("Customization Controls")

    # Chart size
    chart_width = st.slider("Chart Width", 300, 1000, 600)
    chart_height = st.slider("Chart Height", 200, 600, 300)

    # Line color
    line_color = st.color_picker("Line Color", "#1f77b4")

    # Line style
    line_style = st.selectbox(
        "Line Style",
        ["Solid", "Dashed", "Dotted"],
        index=0,
    )

    # Background color
    bg_color = st.color_picker("Background Color", "#ffffff")

    # Grid color
    grid_color = st.color_picker("Grid Color", "#e0e0e0")

with col2:
    st.subheader("Your Customized Chart")

    # Create customized chart
    interactive_chart = Chart()
    interactive_chart.add_series(LineSeries(data=sample_data))

    # Apply customizations
    interactive_chart.update_options(
        width=chart_width,
        height=chart_height,
        background_color=bg_color,
        grid_color=grid_color,
    )

    interactive_chart.render(key="interactive_chart")

    # Show the code
    st.code(
        f"""
# Your customized chart
chart = Chart()
chart.add_series(LineSeries(data=sample_data))
chart.update_options(
    width={chart_width},
    height={chart_height},
    background_color="{bg_color}",
    grid_color="{grid_color}"
)
chart.render(key="interactive_chart")
    """,
        language="python",
    )

st.header("📊 Professional Chart Example")

st.markdown(
    """
**Here's how to create a professional-looking chart for presentations or dashboards.**
""",
)

# Professional data
professional_data = [
    LineData(time="2024-01-01", value=100),
    LineData(time="2024-01-02", value=105),
    LineData(time="2024-01-03", value=102),
    LineData(time="2024-01-04", value=108),
    LineData(time="2024-01-05", value=115),
    LineData(time="2024-01-06", value=110),
    LineData(time="2024-01-07", value=120),
    LineData(time="2024-01-08", value=125),
    LineData(time="2024-01-09", value=118),
    LineData(time="2024-01-10", value=130),
]

professional_chart = Chart()
professional_chart.add_series(LineSeries(data=professional_data))
professional_chart.update_options(
    width=900,
    height=500,
    background_color="#ffffff",
    grid_color="#f0f0f0",
    text_color="#333333",
)
professional_chart.render(key="professional_chart")

st.code(
    """
# Professional chart setup
chart = Chart()
chart.add_series(LineSeries(data=professional_data))
chart.update_options(
    width=900,
    height=500,
    background_color="#ffffff",
    grid_color="#f0f0f0",
    text_color="#333333"
)
chart.render(key="professional_chart")
""",
    language="python",
)

st.header("💡 Best Practices")

st.markdown(
    """
**Tips for creating great-looking charts:**

1. **Consistent Colors**: Use a consistent color palette across your application
2. **Appropriate Sizing**: Choose chart dimensions that fit your layout
3. **Readable Text**: Ensure good contrast between text and background
4. **Clean Grid**: Use subtle grid lines that don't distract from data
5. **Method Chaining**: Use method chaining for cleaner, more maintainable code
""",
)

st.subheader("Color Palette Suggestions")
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("**Business**")
    st.markdown("- Primary: #1f77b4")
    st.markdown("- Secondary: #ff7f0e")
    st.markdown("- Background: #f8f9fa")

with col2:
    st.markdown("**Financial**")
    st.markdown("- Up: #26a69a")
    st.markdown("- Down: #ef5350")
    st.markdown("- Background: #ffffff")

with col3:
    st.markdown("**Dark Theme**")
    st.markdown("- Primary: #00d4aa")
    st.markdown("- Secondary: #ff6b6b")
    st.markdown("- Background: #1a1a1a")

with col4:
    st.markdown("**Light Theme**")
    st.markdown("- Primary: #4a90e2")
    st.markdown("- Secondary: #f39c12")
    st.markdown("- Background: #ffffff")

st.header("🔧 Common Customization Patterns")

with st.expander("📈 Trading Dashboard Style"):
    st.code(
        """
# Trading dashboard style
chart = Chart().add_series(LineSeries(data=data)).update_options(
    width=1200,
    height=600,
    background_color="#0d1117",
    grid_color="#21262d",
    text_color="#f0f6fc"
)
    """,
        language="python",
    )

with st.expander("📊 Business Presentation Style"):
    st.code(
        """
# Business presentation style
chart = Chart().add_series(LineSeries(data=data)).update_options(
    width=800,
    height=400,
    background_color="#ffffff",
    grid_color="#e5e5e5",
    text_color="#333333"
)
    """,
        language="python",
    )

with st.expander("📱 Mobile-Friendly Style"):
    st.code(
        """
# Mobile-friendly style
chart = Chart().add_series(LineSeries(data=data)).update_options(
    width=350,
    height=250,
    background_color="#f8f9fa",
    grid_color="#dee2e6"
)
    """,
        language="python",
    )

st.header("➡️ Next Steps")
st.markdown(
    """
Now that you can customize charts, learn about:

1. **[Tutorial 4: Multiple Series and Chart Types](tutorial_04_multiple_series.py)**
    - Combine different chart types
2. **[Tutorial 5: Advanced Features](tutorial_05_advanced_features.py)** - Tooltips,
    markers,
    and more
3. **[Advanced Line Chart Example](../line_charts/line_chart_advanced.py)** - More
    advanced customization

**Quick Links:**
- [All Tutorials](tutorials/) - Complete tutorial series
- [Examples Index](../launcher.py) - Browse all examples
- [Chart Options Documentation](https://github.com/your-repo/docs) - Full options reference
""",
)

# Footer
st.markdown("---")
st.markdown("💡 **Tip**: Use method chaining to keep your chart creation code clean and readable")
