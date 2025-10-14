# Basic Usage

Learn how to create your first chart with Streamlit Lightweight Charts Pro.

## Simple Line Chart

```python
import streamlit as st
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

# Sample data
data = [
    SingleValueData("2024-01-01", 100),
    SingleValueData("2024-01-02", 105),
    SingleValueData("2024-01-03", 103),
    SingleValueData("2024-01-04", 108),
]

# Create chart
chart = Chart(series=LineSeries(data))
chart.render(key="line_chart")
```

## Candlestick Chart

```python
from streamlit_lightweight_charts_pro import CandlestickSeries
from streamlit_lightweight_charts_pro.data import CandlestickData

# OHLC data
candle_data = [
    CandlestickData("2024-01-01", 100, 105, 98, 103),
    CandlestickData("2024-01-02", 103, 108, 102, 107),
]

chart = Chart(series=CandlestickSeries(candle_data))
chart.render(key="candlestick_chart")
```

## Multiple Series

```python
from streamlit_lightweight_charts_pro import AreaSeries

# Create multiple series
line_series = LineSeries(data, color="#2196F3")
area_series = AreaSeries(data, color="#4CAF50")

chart = Chart(series=[line_series, area_series])
chart.render(key="multi_series_chart")
```
