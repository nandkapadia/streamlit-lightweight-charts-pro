# Streamlit Lightweight Charts Pro

Professional-grade financial charting library for Streamlit that wraps TradingView's lightweight-charts with a fluent Python API.

## 🚀 Quick Start

```python
import streamlit as st
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

# Create sample data
data = [
    SingleValueData("2024-01-01", 100),
    SingleValueData("2024-01-02", 105),
    SingleValueData("2024-01-03", 103),
]

# Create and render chart
chart = Chart(series=LineSeries(data))
chart.render(key="my_chart")
```

## 📚 Documentation

- **[API Reference](api/)** - Complete API documentation
- **[Getting Started](getting-started/)** - Installation and basic usage
- **[Examples](examples/)** - Code examples and tutorials

## ✨ Features

- **Professional Charts** - Line, candlestick, area, histogram, and more
- **Fluent API** - Method chaining for easy configuration
- **Type Safety** - Full type hints and validation
- **Performance** - Optimized for large datasets
- **Customizable** - Extensive styling and behavior options

## 🔗 Links

- [GitHub Repository](https://github.com/nandkapadia/streamlit-lightweight-charts-pro)
- [PyPI Package](https://pypi.org/project/streamlit-lightweight-charts-pro/)
- [Issues & Support](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues)
