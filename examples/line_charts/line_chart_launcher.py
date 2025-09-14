"""
Line Chart Examples Launcher.

This launcher provides a simple interface to run different line chart examples.
Users can select which example to run from a dropdown menu.
"""

import os

# Add project root to path for examples imports
import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


# Page configuration
st.set_page_config(page_title="Line Chart Examples Launcher", page_icon="📈", layout="wide")

st.title("📈 Line Chart Examples Launcher")
st.markdown("Select an example to run and explore different line chart features.")

# Define available examples
examples = {
    "Basic Line Chart": {
        "file": "line_chart_basic.py",
        "description": "Simple line chart with default styling",
        "features": ["Basic chart creation", "Default styling", "Time series data"],
    },
    "Line Chart with Price Lines": {
        "file": "line_chart_with_price_lines.py",
        "description": "Line chart with horizontal price lines",
        "features": ["Support/resistance levels", "Average price line", "Custom styling"],
    },
    "Line Chart with Markers": {
        "file": "line_chart_with_markers.py",
        "description": "Line chart with point markers",
        "features": ["Event markers", "Different shapes", "Custom positions"],
    },
    "Advanced Line Chart": {
        "file": "line_chart_advanced.py",
        "description": "Comprehensive example with all features",
        "features": ["All features combined", "Method chaining", "Advanced options"],
    },
    "Line Chart with DataFrame": {
        "file": "line_chart_dataframe.py",
        "description": "Line chart from pandas DataFrame",
        "features": ["DataFrame input", "Column mapping", "Color mapping"],
    },
}

# Sidebar for example selection
st.sidebar.header("🎯 Select Example")

selected_example = st.sidebar.selectbox(
    "Choose an example to run:", list(examples.keys()), format_func=lambda x: f"📊 {x}"
)

# Display selected example info
if selected_example:
    example_info = examples[selected_example]

    st.sidebar.markdown("---")
    st.sidebar.markdown(f"**Description:** {example_info['description']}")

    st.sidebar.markdown("**Features:**")
    for feature in example_info["features"]:
        st.sidebar.markdown(f"- {feature}")

# Main content area
st.header(f"📊 {selected_example}")

if selected_example:
    example_info = examples[selected_example]

    # Display example information
    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown(f"**Description:** {example_info['description']}")
        st.markdown("**Features:**")
        for feature in example_info["features"]:
            st.markdown(f"- ✅ {feature}")

    with col2:
        st.markdown("**File:**")
        st.code(example_info["file"])

    # Run button
    st.markdown("---")

    if st.button("🚀 Run Example", type="primary"):
        example_file = example_info["file"]
        examples_dir = Path(__file__).parent

        # Check if file exists
        file_path = examples_dir / example_file
        if not file_path.exists():
            st.error(f"❌ Example file not found: {example_file}")
        else:
            st.success(f"✅ Running {example_file}...")
            st.info("The example will open in a new browser tab.")

            # Instructions for running
            st.markdown(
                """
            **To run this example:**
            
            1. Open a new terminal/command prompt
            2. Navigate to the project directory
            3. Run the following command:
            """
            )

            st.code(f"streamlit run examples/{example_file}")

            st.markdown(
                """
            **Or copy and paste this command:**
            """
            )

            # Get the full path for the command
            full_path = file_path.absolute()
            st.code(f'streamlit run "{full_path}"')

# Show all available examples
st.markdown("---")
st.header("📋 All Available Examples")

for name, info in examples.items():
    with st.expander(f"📊 {name}"):
        st.markdown(f"**Description:** {info['description']}")
        st.markdown("**Features:**")
        for feature in info["features"]:
            st.markdown(f"- {feature}")
        st.markdown(f"**File:** `{info['file']}`")

# Show quick start guide
st.markdown("---")
st.header("🚀 Quick Start Guide")

st.markdown(
    """
### Prerequisites
```bash
pip install streamlit-lightweight-charts-pro pandas streamlit
```

### Basic Usage
```python
import streamlit as st
from streamlit_lightweight_charts_pro import Chart
from streamlit_lightweight_charts_pro.charts.series import LineSeries
from examples.utilities.data_samples import get_line_data

# Get sample data
line_data = get_line_data()

# Create line series
line_series = LineSeries(data=line_data)

# Create and render chart
chart = Chart(series=line_series)
chart.render(key="my_chart")
```

### Advanced Usage
```python
# With custom styling and features
line_series = (LineSeries(data=line_data)
               .add_price_line(price_line)
               .add_marker(marker))

chart = Chart(series=line_series)
chart.render(key="advanced_chart")
```
"""
)

# Show documentation links
st.markdown("---")
st.header("📚 Documentation")

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("**Core Documentation:**")
    st.markdown("- [TradingView API](https://tradingview.github.io/lightweight-charts/docs/api)")
    st.markdown(
        "- [Line"
        " Series](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineStyleOptions)"
    )

with col2:
    st.markdown("**Features:**")
    st.markdown(
        "- [Price"
        " Lines](https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-line)"
    )
    st.markdown(
        "- [Series"
        " Markers](https://tradingview.github.io/lightweight-charts/tutorials/how_to/series-markers)"
    )

with col3:
    st.markdown("**Examples:**")
    st.markdown("- [Basic Examples](examples/)")
    st.markdown("- [Advanced Examples](examples/)")

st.markdown("---")
st.markdown("**Happy charting! 📈**")
