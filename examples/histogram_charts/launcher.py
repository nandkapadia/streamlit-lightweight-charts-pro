"""
Histogram Charts Examples Launcher.

This launcher provides access to all histogram chart examples in this folder.
"""

import streamlit as st

st.set_page_config(page_title="Histogram Charts Examples", page_icon="📊", layout="wide")

st.title("📊 Histogram Charts Examples")
st.write("Select an example to explore different histogram chart features and configurations.")

# Example descriptions
examples = {
    "Basic Histogram Chart": {
        "file": "basic_histogram_chart.py",
        "description": "Learn the fundamentals of creating histogram charts with HistogramSeries using sample data.",
        "features": [
            "Basic volume data",
            "DataFrame integration",
            "Series properties",
            "Volume analysis",
        ],
    },
    "Customized Histogram Chart": {
        "file": "customized_histogram_chart.py",
        "description": "Explore advanced styling options including colors, base values, and volume trend analysis.",
        "features": [
            "Color customization",
            "Base value settings",
            "Volume trends",
            "Interactive settings",
        ],
    },
}

# Create sidebar for navigation
st.sidebar.header("Histogram Chart Examples")
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
st.image("../histogram_chart.png", caption="Histogram Chart Example", use_column_width=True)

# Instructions
st.subheader("How to Run")
st.write(
    """
To run any of these examples:

1. Navigate to the specific example file
2. Run with Streamlit: `streamlit run examples/histogram_charts/[example_name].py`
3. Or use the launcher to explore all examples

Each example demonstrates different aspects of HistogramSeries functionality and customization options.
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
