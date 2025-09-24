# Basic Usage

Learn the fundamental concepts and patterns for using Streamlit Lightweight Charts Pro.

## Core Concepts

### Chart Class
The `Chart` class is the main entry point for creating charts:

```python
from streamlit_lightweight_charts_pro import Chart

chart = Chart()
```

### Series
Series represent the data to be displayed on the chart:

```python
from streamlit_lightweight_charts_pro import LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

data = [SingleValueData("2024-01-01", 100)]
series = LineSeries(data, color="#2196F3", title="Price")
```

### Fluent API
All methods return the chart instance, enabling method chaining:

```python
chart = (Chart()
    .add_series(series)
    .update_options(height=400)
    .render(key="my_chart"))
```

## Data Types

### SingleValueData
For line charts, area charts, and other single-value series:

```python
from streamlit_lightweight_charts_pro.data import SingleValueData

data = [
    SingleValueData("2024-01-01", 100),
    SingleValueData("2024-01-02", 105),
    SingleValueData("2024-01-03", 102),
]
```

### OhlcData
For candlestick charts:

```python
from streamlit_lightweight_charts_pro.data import OhlcData

data = [
    OhlcData("2024-01-01", 100, 105, 95, 102),
    OhlcData("2024-01-02", 102, 108, 98, 105),
]
```

### OhlcvData
For candlestick charts with volume:

```python
from streamlit_lightweight_charts_pro.data import OhlcvData

data = [
    OhlcvData("2024-01-01", 100, 105, 95, 102, 1000000),
    OhlcvData("2024-01-02", 102, 108, 98, 105, 1200000),
]
```

## Series Types

### Line Series
Simple line charts for trend visualization:

```python
from streamlit_lightweight_charts_pro import LineSeries

series = LineSeries(
    data=data,
    color="#2196F3",
    title="Price",
    line_width=2,
    crosshair_marker_visible=True
)
```

### Candlestick Series
OHLC data with customizable styling:

```python
from streamlit_lightweight_charts_pro import CandlestickSeries

series = CandlestickSeries(
    data=ohlc_data,
    title="OHLC",
    up_color="#4CAF50",
    down_color="#F44336"
)
```

### Area Series
Filled area charts with gradient support:

```python
from streamlit_lightweight_charts_pro import AreaSeries

series = AreaSeries(
    data=data,
    color="#2196F3",
    title="Volume",
    line_color="#1976D2",
    top_color="rgba(33, 150, 243, 0.56)",
    bottom_color="rgba(33, 150, 243, 0.04)"
)
```

## Chart Options

### Basic Options
Set chart dimensions and basic properties:

```python
chart = Chart(series=series).update_options(
    height=400,
    width=800,
    auto_size=False
)
```

### Layout Options
Customize chart appearance:

```python
from streamlit_lightweight_charts_pro.charts.options import LayoutOptions

layout = LayoutOptions(
    background_color="#ffffff",
    text_color="#333333",
    font_size=12,
    font_family="Roboto"
)

chart = Chart(series=series).update_options(layout=layout)
```

### Time Scale Options
Configure time axis behavior:

```python
from streamlit_lightweight_charts_pro.charts.options import TimeScaleOptions

time_scale = TimeScaleOptions(
    time_visible=True,
    seconds_visible=False,
    right_offset=12,
    bar_spacing=6,
    min_bar_spacing=0.5
)

chart = Chart(series=series).update_options(time_scale=time_scale)
```

## Rendering

### Basic Rendering
Render the chart in Streamlit:

```python
chart.render(key="unique_chart_key")
```

### In Columns
Render charts in Streamlit columns:

```python
import streamlit as st

col1, col2 = st.columns(2)

with col1:
    chart1.render(key="chart_left")

with col2:
    chart2.render(key="chart_right")
```

### With Controls
Add interactive controls:

```python
import streamlit as st

# Add controls
height = st.slider("Chart Height", 200, 800, 400)
color = st.color_picker("Line Color", "#2196F3")

# Update chart with controls
chart = (Chart(series=LineSeries(data, color=color))
    .update_options(height=height)
    .render(key="interactive_chart"))
```

## Best Practices

### Unique Keys
Always use unique keys for each chart:

```python
import uuid

chart.render(key=f"chart_{uuid.uuid4()}")
```

### Data Validation
Validate your data before creating charts:

```python
if not data:
    st.error("No data available")
    return

chart = Chart(series=LineSeries(data))
```

### Error Handling
Handle errors gracefully:

```python
try:
    chart = Chart(series=series)
    chart.render(key="chart")
except Exception as e:
    st.error(f"Error creating chart: {e}")
```

### Performance
For large datasets, consider pagination or data sampling:

```python
# Sample data for large datasets
if len(data) > 1000:
    data = data[::10]  # Sample every 10th point

chart = Chart(series=LineSeries(data))
```

## Next Steps

- Explore [Data Formats](data-formats.md) for more data types
- Check out [Examples](examples/overview.md) for real-world use cases
- Read the [API Reference](api/chart.md) for complete documentation
