"""Test persistence flow with detailed debugging."""

import json
from datetime import datetime, timedelta

import streamlit as st

from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

st.set_page_config(page_title="Persistence Flow Test", page_icon="🔍", layout="wide")

st.title("🔍 Persistence Flow Test - Step by Step")

# Generate sample data
base_time = datetime(2024, 1, 1)
data = [
    SingleValueData(
        time=(base_time + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%S"),
        value=100 + i * 0.5,
    )
    for i in range(50)
]

# Chart key for persistence
chart_key = "test_chart"
session_key = f"_chart_series_configs_{chart_key}"

# Create series
line_series = LineSeries(data=data)

# Display debug info
col1, col2 = st.columns([1, 1])

with col1:
    st.markdown("### 📊 Current State")

    # Check session state
    if session_key in st.session_state:
        configs = st.session_state[session_key]
        st.success("✅ Found stored configs")

        if "pane-0-series-0" in configs:
            config = configs["pane-0-series-0"]
            st.write("**Stored Configuration:**")
            st.json(config)

            # Check what's actually applied
            st.write("**Applied to Series:**")
            if hasattr(line_series, "line_options") and line_series.line_options:
                st.write("- line_options exists: ✅")
                st.write(f"- line_options type: {type(line_series.line_options)}")
                if hasattr(line_series.line_options, "color"):
                    st.write(f"- Color property: {line_series.line_options.color}")
                if hasattr(line_series.line_options, "line_width"):
                    st.write(f"- Width property: {line_series.line_options.line_width}")
            else:
                st.warning("⚠️ No line_options on series")
    else:
        st.info("ℹ️ No stored configs yet")

with col2:
    st.markdown("### 📋 Series Serialization")

    # Show how the series serializes
    series_dict = line_series.asdict()

    st.write("**Series asdict() output:**")
    if "options" in series_dict:
        st.write("Options field:")
        st.json(series_dict["options"])
    else:
        st.warning("No options field in serialized series")

    # Show full serialization
    with st.expander("Full serialization"):
        st.json(series_dict)

# Manual test buttons
st.markdown("---")
st.markdown("### 🧪 Manual Testing")

col3, col4, col5 = st.columns(3)

with col3:
    if st.button("🔴 Apply Red Config"):
        test_config = {
            "pane-0-series-0": {
                "color": "#FF0000",
                "lineWidth": 5,
                "lineStyle": 0,
                "_seriesType": "Line",
            },
        }
        st.session_state[session_key] = test_config
        st.rerun()

with col4:
    if st.button("🔵 Apply Blue Config"):
        test_config = {
            "pane-0-series-0": {
                "color": "#0000FF",
                "lineWidth": 3,
                "lineStyle": 0,
                "_seriesType": "Line",
            },
        }
        st.session_state[session_key] = test_config
        st.rerun()

with col5:
    if st.button("🗑️ Clear Configs"):
        if session_key in st.session_state:
            del st.session_state[session_key]
        st.rerun()

# Instructions
st.markdown("""
### 📝 Test Process:

1. **Initial State**: Check if any configs are stored
2. **Use Gear Icon**: Change settings via the chart's gear menu
3. **Check State**: See what gets stored and how it's applied
4. **Manual Test**: Use buttons above to apply test configs
5. **Verify**: Check if the chart reflects the stored config

### 🔍 What to Look For:

- **Stored Config**: Should match what you set
- **Applied Config**: Should be reflected in line_options
- **Serialization**: Options should contain the config values
- **Visual**: Chart should show the configured color/width

### ⚠️ Known Issues to Watch:

1. **Flicker**: Settings briefly show default before applying
2. **Double Messages**: Multiple config updates sent
3. **Serialization Mismatch**: Config stored but not in options
""")

# Render chart
st.markdown("---")
st.markdown("### 📈 Chart")

# Create and render chart
chart = Chart(series=line_series)
result = chart.render(key=chart_key)

# Show component return value
if result:
    with st.expander("Component Return Value"):
        st.json(result)

# Final status
st.markdown("---")
if session_key in st.session_state and "pane-0-series-0" in st.session_state[session_key]:
    config = st.session_state[session_key]["pane-0-series-0"]
    expected_in_options = ["color", "lineWidth", "lineStyle"]

    # Check if config values are in serialized options
    series_dict = line_series.asdict()
    options = series_dict.get("options", {})

    all_good = True
    for key in expected_in_options:
        if key in config and key in options:
            if config[key] == options[key]:
                st.success(f"✅ {key}: {config[key]} - correctly serialized")
            else:
                st.error(
                    f"❌ {key}: stored={config[key]}, serialized={options.get(key)} - MISMATCH",
                )
                all_good = False
        elif key in config:
            st.warning(f"⚠️ {key}: stored but not in serialized options")
            all_good = False

    if all_good:
        st.success("✅ **PERSISTENCE WORKING CORRECTLY**")
    else:
        st.error("❌ **PERSISTENCE HAS ISSUES**")
else:
    st.info("No configuration to verify yet. Use the gear menu to set some options.")
