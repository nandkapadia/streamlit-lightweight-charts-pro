# Streamlit Lightweight Charts Pro

[![PyPI version](https://badge.fury.io/py/streamlit_lightweight_charts_pro.svg)](https://badge.fury.io/py/streamlit_lightweight_charts_pro)
[![Python 3.7+](https://img.shields.io/badge/python-3.7+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

**Professional-grade financial charting library for Streamlit applications**

Streamlit Lightweight Charts Pro is a comprehensive Python library that brings TradingView's powerful lightweight-charts library to Streamlit with an intuitive, fluent API. Create interactive financial charts with ease, from simple line charts to complex multi-pane trading dashboards.

## 📚 Documentation

- **[Examples](examples/)** - Comprehensive code examples and tutorials
- **[GitHub Repository](https://github.com/nandkapadia/streamlit-lightweight-charts-pro)** - Source code and issue tracking
- **[PyPI Package](https://pypi.org/project/streamlit-lightweight-charts-pro/)** - Installation and package info

## ✨ Features

### 🎯 **Core Capabilities**
- **Interactive Financial Charts**: Candlestick, line, area, bar, histogram, and baseline charts
- **Fluent API**: Method chaining for intuitive chart creation
- **Multi-Pane Charts**: Synchronized charts with multiple series and timeframes
- **Trade Visualization**: Built-in support for displaying trades with markers and annotations
- **Advanced Annotations**: Text, arrows, and shape annotations with layering
- **Responsive Design**: Auto-sizing charts that adapt to container dimensions
- **Pandas Integration**: Seamless DataFrame to chart data conversion

### 🚀 **Advanced Features**
- **Price-Volume Charts**: Pre-built candlestick + volume combinations
- **Range Switchers**: Professional time range selection (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
- **Auto-Sizing**: Responsive charts with min/max constraints
- **Custom Styling**: Full control over colors, fonts, and visual elements
- **Performance Optimized**: Handles large datasets efficiently
- **Type Safety**: Comprehensive type hints and validation

### 🔧 **Developer Experience**
- **Production Ready**: Comprehensive logging, error handling, and security
- **Well Documented**: Complete API documentation with examples
- **Tested**: 450+ unit tests with 95%+ coverage
- **Code Quality**: Black formatting, type hints, and linting compliance

## 📦 Installation

```bash
pip install streamlit_lightweight_charts_pro
```

## 🚀 Quick Start

### Basic Line Chart

```python
import streamlit as st
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

# Create sample data
data = [
    SingleValueData("2024-01-01", 100),
    SingleValueData("2024-01-02", 105),
    SingleValueData("2024-01-03", 103),
    SingleValueData("2024-01-04", 108),
]

# Create and render chart
chart = Chart(series=LineSeries(data, color="#2196F3"))
chart.render(key="basic_line_chart")
```

### Candlestick Chart with Volume

```python
import streamlit as st
import pandas as pd
from streamlit_lightweight_charts_pro import PriceVolumeChart

# Load your OHLCV data
df = pd.read_csv('stock_data.csv', index_col='date', parse_dates=True)

# Create price-volume chart
chart = PriceVolumeChart(
    df=df,
    price_type='candlestick',
    price_height=400,
    volume_height=100
)
chart.render(key="price_volume_chart")
```

### Fluent API with Method Chaining

```python
from streamlit_lightweight_charts_pro import create_chart, create_text_annotation

# Create chart with fluent API
chart = (create_chart()
         .add_line_series(data, color="#ff0000")
         .set_height(400)
         .set_width(800)
         .add_annotation(create_text_annotation("2024-01-01", 100, "Start Point"))
         .build())
chart.render(key="fluent_chart")
```

## 📊 Chart Types

### Single Series Charts

```python
# Line Chart
LineSeries(data, color="#2196F3")

# Area Chart
AreaSeries(data, color="#4CAF50", fill_color="rgba(76, 175, 80, 0.3)")

# Bar Chart
BarSeries(data, color="#FF9800")

# Histogram
HistogramSeries(data, color="#9C27B0")

# Baseline Chart
BaselineSeries(data, base_value=100, top_color="#4CAF50", bottom_color="#F44336")
```

### Candlestick Charts

```python
from streamlit_lightweight_charts_pro.data import OhlcData

# Create OHLC data
ohlc_data = [
    OhlcData("2024-01-01", 100, 105, 98, 102),
    OhlcData("2024-01-02", 102, 108, 101, 106),
    OhlcData("2024-01-03", 106, 110, 104, 108),
]

# Create candlestick series
CandlestickSeries(ohlc_data, up_color="#4CAF50", down_color="#F44336")
```

### Multi-Pane Charts

```python
# MultiPaneChart removed - using Chart instead

# MultiPaneChart removed - using individual charts instead
chart = Chart(series=[CandlestickSeries(ohlc_data), HistogramSeries(volume_data)])
chart.render(key="multi_pane")
```

## 🎨 Advanced Features

### Trade Visualization

```python
from streamlit_lightweight_charts_pro.data import Trade, TradeType, TradeVisualization

# Create trades
trades = [
    Trade(
        entry_time="2024-01-01",
        entry_price=100,
        exit_time="2024-01-05",
        exit_price=105,
        quantity=100,
        trade_type=TradeType.LONG,
        id="T001"
    )
]

# Add trades to chart
chart = Chart(
    series=[CandlestickSeries(ohlc_data)],
    trades=trades,
    trade_visualization=TradeVisualization.BOTH  # Shows markers and rectangles
)
```

### Annotations

```python
from streamlit_lightweight_charts_pro.data.annotation import (
    create_text_annotation, create_arrow_annotation, create_shape_annotation
)

# Text annotation
text_ann = create_text_annotation("2024-01-01", 100, "Important Event")

# Arrow annotation
arrow_ann = create_arrow_annotation("2024-01-02", 105, "Trend Change")

# Shape annotation
shape_ann = create_shape_annotation("2024-01-03", 103, "rectangle", "#FF9800")

# Add to chart
chart.add_annotation(text_ann)
```

### Range Switcher

```python
# Add professional time range switching
chart_options = {
    "rangeSwitcher": {
        "ranges": [
            {"label": "1D", "seconds": 86400},
            {"label": "1W", "seconds": 604800},
            {"label": "1M", "seconds": 2592000},
            {"label": "3M", "seconds": 7776000},
            {"label": "6M", "seconds": 15552000},
            {"label": "1Y", "seconds": 31536000},
            {"label": "ALL", "seconds": None}
        ],
        "position": "top-right",
        "visible": True,
        "defaultRange": "1M"
    }
}
```

## 📈 Data Sources

### From Pandas DataFrames

```python
import pandas as pd

# Load data
df = pd.read_csv('stock_data.csv', index_col='date', parse_dates=True)

# Create chart directly from DataFrame
chart = Chart(series=CandlestickSeries.from_dataframe(
    df=df,
    column_mapping={
        'time': 'date',
        'open': 'open',
        'high': 'high',
        'low': 'low',
        'close': 'close'
    }
))
```

### From CSV Files

```python
# Direct CSV loading with custom column mapping
chart = PriceVolumeChart(
    df=pd.read_csv('data.csv'),
    column_mapping={
        'time': 'Date',
        'open': 'Open',
        'high': 'High',
        'low': 'Low',
        'close': 'Close',
        'volume': 'Volume'
    }
)
```

### From APIs

```python
import yfinance as yf

# Fetch data from Yahoo Finance
ticker = yf.Ticker("AAPL")
df = ticker.history(period="1y")

# Create chart
chart = PriceVolumeChart(df=df)
chart.render(key="aapl_chart")
```

## 🎛️ Customization

### Chart Options

```python
from streamlit_lightweight_charts_pro.charts.options import ChartOptions

options = ChartOptions(
    height=500,
    width=800,
    layout={
        "background": {"type": "solid", "color": "white"},
        "textColor": "black"
    },
    grid={
        "vertLines": {"color": "rgba(197, 203, 206, 0.5)"},
        "horzLines": {"color": "rgba(197, 203, 206, 0.5)"}
    },
    crosshair={"mode": 1},
    rightPriceScale={
        "borderColor": "rgba(197, 203, 206, 0.8)",
        "scaleMargins": {"top": 0.1, "bottom": 0.2}
    }
)

chart = Chart(series=series, options=options)
```

### Series Styling

```python
# Custom line series
LineSeries(
    data=data,
    color="#2196F3",
    line_width=2,
    line_type="solid",
    crosshair_marker_visible=True,
    last_value_visible=True,
    price_line_color="#2196F3",
    price_line_width=1
)

# Custom candlestick series
CandlestickSeries(
    data=ohlc_data,
    up_color="#4CAF50",
    down_color="#F44336",
    border_visible=False,
    wick_up_color="#4CAF50",
    wick_down_color="#F44336"
)
```

## 🔧 Advanced Usage

### Auto-Sizing Charts

```python
# Responsive chart that adapts to container
chart_options = {
    "autoSize": True,
    "minWidth": 300,
    "maxWidth": 1200,
    "minHeight": 200,
    "maxHeight": 800
}
```

### Multi-Pane Synchronization

```python
# MultiPaneChart removed - using individual charts instead
chart = Chart(series=[CandlestickSeries(ohlc_data), HistogramSeries(volume_data), LineSeries(rsi_data)])
```

### Custom Annotations with Layers

```python
# Create annotation layer
layer = AnnotationLayer("analysis", visible=True)

# Add annotations to layer
layer.add_annotation(create_text_annotation("2024-01-01", 100, "Support"))
layer.add_annotation(create_text_annotation("2024-01-05", 110, "Resistance"))

# Add layer to chart
chart.add_annotation_layer(layer)
```

## 📚 Examples

Check out the comprehensive examples in the `examples/` directory:

- `candlestick_chart.py` - Basic candlestick chart
- `price_volume_chart.py` - Price and volume combination
- `multi_pane_chart.py` - Multi-pane synchronized charts
- `trade_drawing_example.py` - Trade visualization
- `range_switcher_example.py` - Time range switching
- `method_chaining_demo.py` - Fluent API examples
- `AutoSizingExample.py` - Responsive charts

## 🛠️ Development

### Installation for Development

```bash
# Clone the repository
git clone https://github.com/your-username/streamlit_lightweight_charts_pro.git
cd streamlit_lightweight_charts_pro

# Install in development mode
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=streamlit_lightweight_charts_pro

# Run specific test categories
pytest tests/unit/
pytest tests/integration/
pytest tests/e2e/
```

### Code Quality

```bash
# Format code
black streamlit_lightweight_charts_pro/

# Sort imports
isort streamlit_lightweight_charts_pro/

# Lint code
pylint streamlit_lightweight_charts_pro/
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TradingView](https://www.tradingview.com/) for the lightweight-charts library
- [Streamlit](https://streamlit.io/) for the amazing web app framework
- All contributors and users of this library

## 📞 Support

- **Documentation**: Check the examples and docstrings
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community discussions
- **Email**: For security issues, contact nand.kapadia@gmail.com

## 🔗 Links

- [PyPI Package](https://pypi.org/project/streamlit_lightweight_charts_pro/)
- [GitHub Repository](https://github.com/your-username/streamlit_lightweight_charts_pro)
- [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- [Streamlit Documentation](https://docs.streamlit.io/)

---

**Made with ❤️ for the Streamlit community**
test change
test change 2
test change 3
test clean commit
test smart commit
