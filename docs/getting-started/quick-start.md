# Quick Start

Get up and running with Streamlit Lightweight Charts Pro in just a few minutes.

## Installation

```bash
pip install streamlit-lightweight-charts-pro
```

## Your First Chart

Create a simple line chart with just a few lines of code:

```python
import streamlit as st
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

# Sample data
data = [
    SingleValueData("2024-01-01", 100),
    SingleValueData("2024-01-02", 105),
    SingleValueData("2024-01-03", 102),
    SingleValueData("2024-01-04", 108),
    SingleValueData("2024-01-05", 110),
]

# Create and render chart
chart = Chart(series=LineSeries(data, color="#2196F3"))
chart.render(key="my_first_chart")

st.title("My First Chart")
```

## From DataFrame

You can also create charts directly from pandas DataFrames:

```python
import pandas as pd
from streamlit_lightweight_charts_pro import Chart, LineSeries

# Create DataFrame
df = pd.DataFrame({
    'time': ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
    'value': [100, 105, 102, 108, 110]
})

# Create chart from DataFrame
chart = LineSeries.from_dataframe(df, time_column='time', value_column='value')
Chart(series=chart).render(key="dataframe_chart")
```

## Multiple Series

Add multiple series to the same chart:

```python
from streamlit_lightweight_charts_pro import Chart, LineSeries, AreaSeries

# Create multiple series
line_data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]
area_data = [SingleValueData("2024-01-01", 95), SingleValueData("2024-01-02", 100)]

# Create chart with multiple series
chart = (Chart()
    .add_series(LineSeries(line_data, color="#2196F3", title="Price"))
    .add_series(AreaSeries(area_data, color="#4CAF50", title="Volume"))
    .render(key="multi_series_chart"))
```

## Customization

Customize your charts with options:

```python
from streamlit_lightweight_charts_pro.charts.options import ChartOptions

# Create chart with custom options
chart = (Chart(series=line_series)
    .update_options(
        height=400,
        width=800,
        layout=ChartOptions(
            background_color="#ffffff",
            text_color="#333333"
        )
    )
    .render(key="customized_chart"))
```

## Next Steps

- Learn about [Data Formats](data-formats.md)
- Explore [Basic Usage](basic-usage.md)
- Check out [Examples](examples/overview.md)
- Read the [API Reference](api/chart.md)
