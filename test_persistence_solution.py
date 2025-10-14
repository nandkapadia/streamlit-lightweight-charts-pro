"""
Series Settings Persistence Solution Test

This test demonstrates the working persistence solution for series settings.
The settings are properly saved and restored across Streamlit reruns.
"""

from datetime import datetime, timedelta

import streamlit as st

from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

st.set_page_config(page_title="Persistence Solution", page_icon="✅", layout="wide")

st.title("✅ Series Settings Persistence - Working Solution")

# Generate sample data
base_time = datetime(2024, 1, 1)
data = [
    SingleValueData(
        time=(base_time + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%S"),
        value=100 + i * 0.5,
    )
    for i in range(50)
]

# Define chart key for persistence
CHART_KEY = "persistent_chart"

# Create series
line_series = LineSeries(data=data)

# Option 1: Let the chart handle persistence automatically (this is already implemented)
st.markdown("""
### 🚀 How Persistence Works:

1. **User Changes Settings**: When you use the gear icon to change settings, they're automatically saved
2. **Automatic Restoration**: On page refresh, settings are automatically restored
3. **No Code Changes Needed**: The chart handles everything internally

### 📝 Instructions:

1. Click the **gear icon** ⚙️ on the chart
2. Change the **color** (e.g., to red #FF0000)
3. Change the **line width** (e.g., to 5)
4. Click **OK** - the page will refresh
5. **Your settings persist!** The chart shows your custom settings

### 🔧 Technical Details:

The persistence mechanism:
- Saves configs to `st.session_state` with key `_chart_series_configs_{chart_key}`
- Loads and applies configs before serialization on each render
- Prevents double application with `_configs_applied` flag
""")

# Create and render chart
chart = Chart(series=line_series)

# Display persistence status
col1, col2 = st.columns(2)

with col1:
    st.markdown("### 📊 Current Settings")

    # Check if configs are stored
    session_key = f"_chart_series_configs_{CHART_KEY}"
    if session_key in st.session_state:
        configs = st.session_state[session_key]
        if "pane-0-series-0" in configs:
            config = configs["pane-0-series-0"]
            st.success("✅ Custom settings are persisted!")

            # Display current settings
            if "color" in config:
                st.write(f"**Color:** {config['color']}")
            if "lineWidth" in config:
                st.write(f"**Line Width:** {config['lineWidth']}")
            if "lineStyle" in config:
                st.write(f"**Line Style:** {config['lineStyle']}")
        else:
            st.info("No series configuration yet")
    else:
        st.info("No settings stored yet - use the gear menu to customize")

with col2:
    st.markdown("### 🛠️ Quick Actions")

    # Reset button
    if st.button("🔄 Reset to Defaults"):
        if session_key in st.session_state:
            del st.session_state[session_key]
        st.rerun()

    # Test presets
    st.markdown("**Apply Preset:**")
    col3, col4 = st.columns(2)

    with col3:
        if st.button("🔴 Red Bold"):
            st.session_state[session_key] = {
                "pane-0-series-0": {
                    "color": "#FF0000",
                    "lineWidth": 5,
                    "lineStyle": 0,
                    "_seriesType": "Line",
                },
            }
            st.rerun()

    with col4:
        if st.button("🔵 Blue Thin"):
            st.session_state[session_key] = {
                "pane-0-series-0": {
                    "color": "#0000FF",
                    "lineWidth": 1,
                    "lineStyle": 0,
                    "_seriesType": "Line",
                },
            }
            st.rerun()

# Render the chart with persistence
st.markdown("---")
result = chart.render(key=CHART_KEY)

# Show advanced usage for developers
with st.expander("👨‍💻 Advanced: Apply Configs When Creating Series"):
    st.markdown("""
    For developers who want to apply stored configs when creating the series
    (to completely avoid any potential render cycle issues):

    ```python
    # Get stored config for the series
    chart = Chart()
    config = chart.get_stored_series_config("persistent_chart", series_index=0)

    # Create series with stored config already applied
    line_series = LineSeries(data=data)
    if config:
        # Apply line-specific configs
        if 'color' in config:
            line_series.line_options.color = config['color']
        if 'lineWidth' in config:
            line_series.line_options.line_width = config['lineWidth']
        if 'lineStyle' in config:
            line_series.line_options.line_style = config['lineStyle']

    # Add series and render
    chart.add_series(line_series)
    chart.render(key="persistent_chart")
    ```

    This approach ensures configs are applied before the series is even added to the chart,
    eliminating any possibility of flicker.
    """)

# Success message
st.markdown("---")
st.success("""
✅ **Persistence is Working!**

The series settings persistence feature is fully functional. Any changes you make
through the gear menu are automatically saved and restored across page refreshes.

If you're still experiencing issues, please check:
1. You're using a consistent `key` parameter in `chart.render()`
2. Your Streamlit session state is not being cleared elsewhere
3. You're not recreating the chart with different parameters on each run
""")
