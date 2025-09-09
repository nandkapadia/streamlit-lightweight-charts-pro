"""
Bar Charts Examples Launcher.

This launcher provides access to all bar chart examples in this folder.
"""

import streamlit as st

st.set_page_config(page_title="Bar Charts Examples", page_icon="📊", layout="wide")

st.title("📊 Bar Charts Examples")
st.write("Select an example to explore different bar chart features and configurations.")

# Example descriptions
examples = {
    "Basic Bar Chart": {
        "file": "basic_bar_chart.py",
        "description": (
            "Learn the fundamentals of creating bar charts with BarSeries using sample data."
        ),
        "features": [
            "Basic OHLC data",
            "DataFrame integration",
            "Series properties",
            "Data statistics",
        ],
    },
    "Customized Bar Chart": {
        "file": "customized_bar_chart.py",
        "description": (
            "Explore advanced styling options including colors, visibility settings, and price"
            " movement analysis."
        ),
        "features": [
            "Color customization",
            "Visibility controls",
            "Price analysis",
            "Interactive settings",
        ],
    },
}

# Create sidebar for navigation
st.sidebar.header("Bar Chart Examples")
selected_example = st.sidebar.selectbox("Choose an example:", list(examples.keys()))

# Display selected example info
example = examples[selected_example]
st.subheader(selected_example)
st.write(example["description"])

st.write("**Features:**")
for feature in example["features"]:
    st.write(f"• {feature}")

# Show the example image
st.subheader("Example Preview")
st.image("../bar_chart.png", caption="Bar Chart Example", use_column_width=True)

# Instructions
st.subheader("How to Run")
st.write(
    """
To run any of these examples:

1. Navigate to the specific example file
2. Run with Streamlit: `streamlit run examples/bar_charts/[example_name].py`
3. Or use the launcher to explore all examples

Each example demonstrates different aspects of BarSeries functionality and customization options.
"""
)

# Show all available examples
st.subheader("All Available Examples")
for name, info in examples.items():
    with st.expander(f"📊 {name}"):
        st.write(info["description"])
        st.write("**Key Features:**")
        for feature in info["features"]:
            st.write(f"• {feature}")
        st.write(f"**File:** `{info['file']}`")
