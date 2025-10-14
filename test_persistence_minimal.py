"""Minimal test to verify series settings persistence."""

from datetime import datetime, timedelta

import streamlit as st

from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

st.set_page_config(page_title="Minimal Persistence Test", layout="wide")

st.title("🧪 Minimal Persistence Test")

# Generate test data
base_time = datetime(2024, 1, 1)
data = [
    SingleValueData(
        time=(base_time + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%S"),
        value=100 + i * 0.5,
    )
    for i in range(20)
]

# Fixed chart key for persistence
CHART_KEY = "minimal_test"

# Create series
line_series = LineSeries(data=data)

# Display current state
session_key = f"_chart_series_configs_{CHART_KEY}"
col1, col2 = st.columns(2)

with col1:
    st.markdown("### Current Session State")
    if session_key in st.session_state:
        st.success("✅ Found configs in session state")
        st.json(st.session_state[session_key])
    else:
        st.info("ℹ️ No configs in session state yet")

with col2:
    st.markdown("### Test Actions")
    if st.button("🔴 Set Red Color"):
        st.session_state[session_key] = {
            "pane-0-series-0": {
                "color": "#FF0000",
                "lineWidth": 5,
                "_seriesType": "Line",
            },
        }
        st.rerun()

    if st.button("🔄 Clear Settings"):
        if session_key in st.session_state:
            del st.session_state[session_key]
        st.rerun()

# Create and render chart
st.markdown("---")
st.markdown("### Chart (use gear icon to change settings)")

chart = Chart(series=line_series)
result = chart.render(key=CHART_KEY)

# Show what was returned from frontend
if result:
    st.markdown("### Frontend Response")
    st.json(result)
