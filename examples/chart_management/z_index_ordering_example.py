"""
Z-Index Ordering Example

This example demonstrates how series are automatically ordered by z-index
within each pane to ensure proper layering in the frontend.
"""

import streamlit as st
from streamlit_lightweight_charts_pro import Chart, LineSeries, CandlestickSeries, AreaSeries
from streamlit_lightweight_charts_pro.data import LineData, OhlcvData

st.set_page_config(page_title="Z-Index Ordering Example", layout="wide")
st.title("Z-Index Ordering Example")

st.markdown(
    """
This example demonstrates how the Chart class automatically orders series by z-index 
within each pane to ensure proper layering in the frontend.

**Key Points:**
- Series with lower z-index values render behind series with higher z-index values
- Each pane maintains its own z-index ordering
- The frontend will display series in the correct layering order
"""
)

# Create sample data
line_data = [
    LineData(time=1640995200, value=100),
    LineData(time=1641081600, value=105),
    LineData(time=1641168000, value=103),
    LineData(time=1641254400, value=108),
    LineData(time=1641340800, value=110),
]

candlestick_data = [
    OhlcvData("2024-01-01 10:00:00", 100, 102, 99, 101, 1000),
    OhlcvData("2024-01-02 10:00:00", 101, 106, 100, 105, 1200),
    OhlcvData("2024-01-03 10:00:00", 105, 107, 103, 104, 800),
    OhlcvData("2024-01-04 10:00:00", 104, 109, 103, 108, 1500),
    OhlcvData("2024-01-05 10:00:00", 108, 111, 107, 110, 1100),
]

area_data = [
    LineData(time=1640995200, value=95),
    LineData(time=1641081600, value=100),
    LineData(time=1641168000, value=98),
    LineData(time=1641254400, value=103),
    LineData(time=1641340800, value=105),
]

# Create series with different z-index values
st.subheader("Single Pane with Z-Index Ordering")

st.markdown(
    """
**Series Configuration:**
- Line Series: z-index = 10 (renders on top)
- Candlestick Series: z-index = 5 (renders behind)
- Area Series: z-index = 15 (renders on top)

**Expected Order (from back to front):**
1. Candlestick (z-index: 5)
2. Line (z-index: 10)  
3. Area (z-index: 15)
"""
)

line_series = LineSeries(data=line_data)
line_series.z_index = 10

candlestick_series = CandlestickSeries(data=candlestick_data)
candlestick_series.z_index = 5

area_series = AreaSeries(data=area_data)
area_series.z_index = 15

# Create chart with series in arbitrary order
chart = Chart(series=[line_series, candlestick_series, area_series])
chart.update_options(height=400, title="Single Pane Z-Index Ordering")

# Display the chart
chart.render(key="single_pane_z_index")

# Show the frontend configuration to verify ordering
with st.expander("View Frontend Configuration"):
    config = chart.to_frontend_config()
    series_configs = config["charts"][0]["series"]

    st.write("**Series Order in Frontend Config:**")
    for i, series in enumerate(series_configs):
        st.write(f"{i+1}. {series['type']} - z-index: {series.get('zIndex', 0)}")

st.subheader("Multiple Panes with Z-Index Ordering")

st.markdown(
    """
**Pane 0:**
- Line Series: z-index = 20 (renders on top)
- Candlestick Series: z-index = 10 (renders behind)

**Pane 1:**
- Area Series: z-index = 5 (renders behind)
- Histogram Series: z-index = 15 (renders on top)

**Expected Order:**
1. Candlestick (pane 0, z-index: 10)
2. Line (pane 0, z-index: 20)
3. Area (pane 1, z-index: 5)
4. Histogram (pane 1, z-index: 15)
"""
)

# Create series for multiple panes
line_series_pane0 = LineSeries(data=line_data, pane_id=0)
line_series_pane0.z_index = 20

candlestick_series_pane0 = CandlestickSeries(data=candlestick_data, pane_id=0)
candlestick_series_pane0.z_index = 10

area_series_pane1 = AreaSeries(data=area_data, pane_id=1)
area_series_pane1.z_index = 5

# Create histogram data
histogram_data = [
    LineData(time=1640995200, value=50),
    LineData(time=1641081600, value=60),
    LineData(time=1641168000, value=45),
    LineData(time=1641254400, value=70),
    LineData(time=1641340800, value=65),
]

from streamlit_lightweight_charts_pro import HistogramSeries

histogram_series_pane1 = HistogramSeries(data=histogram_data, pane_id=1)
histogram_series_pane1.z_index = 15

# Create multi-pane chart
multi_pane_chart = Chart(
    series=[line_series_pane0, candlestick_series_pane0, area_series_pane1, histogram_series_pane1]
)
multi_pane_chart.update_options(height=500, title="Multi-Pane Z-Index Ordering")

# Display the multi-pane chart
multi_pane_chart.render(key="multi_pane_z_index")

# Show the frontend configuration for multi-pane
with st.expander("View Multi-Pane Frontend Configuration"):
    config = multi_pane_chart.to_frontend_config()
    series_configs = config["charts"][0]["series"]

    st.write("**Series Order in Frontend Config:**")
    for i, series in enumerate(series_configs):
        st.write(
            f"{i+1}. {series['type']} - pane: {series.get('paneId', 0)}, z-index:"
            f" {series.get('zIndex', 0)}"
        )

st.subheader("How It Works")

st.markdown(
    """
The Chart class automatically handles z-index ordering in the `to_frontend_config()` method:

1. **Group by Pane**: Series are grouped by their `pane_id`
2. **Sort by Z-Index**: Within each pane, series are sorted by `z_index` (ascending)
3. **Flatten**: Series are flattened back to a single list, maintaining pane order
4. **Frontend Rendering**: The frontend displays series in the order they appear, 
   with lower z-index values rendering behind higher z-index values

This ensures that series are properly layered regardless of the order they were added to the chart.
"""
)

# Show the actual implementation
with st.expander("View Implementation Details"):
    st.code(
        """
# Group series by pane_id and sort by z_index within each pane
series_by_pane = {}
for series in self.series:
    series_config = series.asdict()
    
    # Handle case where asdict() returns invalid data
    if not isinstance(series_config, dict):
        # Skip z-index ordering for invalid configs
        continue
    
    pane_id = series_config.get("paneId", 0)
    
    if pane_id not in series_by_pane:
        series_by_pane[pane_id] = []
    
    series_by_pane[pane_id].append(series_config)

# Sort series within each pane by z_index (ascending)
for pane_id in series_by_pane:
    series_by_pane[pane_id].sort(
        key=lambda x: x.get("zIndex", 0) if isinstance(x, dict) else 0
    )

# Flatten sorted series back to a single list, maintaining pane order
series_configs = []
for pane_id in sorted(series_by_pane.keys()):
    series_configs.extend(series_by_pane[pane_id])
""",
        language="python",
    )
