# Streamlit Lightweight Charts Pro

[![PyPI version](https://badge.fury.io/py/streamlit_lightweight_charts_pro.svg)](https://badge.fury.io/py/streamlit_lightweight_charts_pro)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Professional-grade financial charting library for Streamlit applications**

Streamlit Lightweight Charts Pro is a comprehensive Streamlit wrapper that brings TradingView's powerful lightweight-charts library to Streamlit with an intuitive, fluent API. Built on top of `lightweight-charts-pro`, it provides seamless integration with Streamlit's component system.

## 📚 Documentation

This project has comprehensive, multi-layered documentation:

- **[📖 Official Documentation](https://nandkapadia.github.io/streamlit-lightweight-charts-pro/)** - Complete API reference, tutorials, and guides
- **[📝 GitHub Wiki](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/wiki)** - Quick-start guides, FAQ, code recipes, troubleshooting
- **[🔧 Setup Guides](DOCUMENTATION.md)** - Documentation infrastructure and setup
- **[📁 Examples](examples/)** - Comprehensive code examples and tutorials
- **[🔄 Migration Guide](MIGRATION.md)** - Upgrading from previous versions

### Quick Links

- [Installation Guide](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/wiki/Installation-Guide)
- [Quick Start Tutorial](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/wiki/Quick-Start-Tutorial)
- [Code Recipes](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/wiki/Code-Recipes) - 50+ copy-paste examples
- [FAQ](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/wiki/FAQ)
- [Troubleshooting](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/wiki/Troubleshooting)

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
pip install streamlit-lightweight-charts-pro
```

This will automatically install the required dependency: `lightweight-charts-pro`

## 🚀 Quick Start

```python
import streamlit as st
from streamlit_lightweight_charts_pro import renderChart
import pandas as pd

st.title("Simple Line Chart")

# Create sample data
data = pd.DataFrame({
    'time': pd.date_range('2024-01-01', periods=100, freq='D'),
    'value': pd.Series(range(100)) + pd.Series(range(100)).apply(lambda x: x**0.5)
})

# Render chart
renderChart([
    {
        'type': 'line',
        'data': data,
        'options': {}
    }
], {
    'layout': {
        'textColor': 'black',
        'background': {
            'type': 'solid',
            'color': 'white'
        }
    }
})
```

## 🏗️ Architecture

This package is a Streamlit-specific wrapper that:
- Extends `BaseChart` and `BaseChartManager` from `lightweight-charts-pro`
- Provides Streamlit component integration via custom React component
- Manages session state and component lifecycle
- Renders charts using Streamlit's bi-directional component system

The package consists of:
- **Python wrapper**: Streamlit integration and session state management
- **React frontend**: Custom TypeScript/React component built on TradingView's lightweight-charts
- **Core dependency**: `lightweight-charts-pro` provides chart classes and utilities

## 📖 Examples

Check out the `examples/` directory for comprehensive examples:

- **Getting Started**: Basic chart types and configuration
- **Advanced Features**: Multi-pane charts, annotations, legends
- **Trading Features**: Trade visualization, signals, markers
- **Custom Styling**: Themes, colors, and visual customization

## 🔄 Migration from v0.2.x to v0.3.x

Version 0.3.0 renames the core dependency from `lightweight-charts-core` to `lightweight-charts-pro`. See [MIGRATION.md](MIGRATION.md) for details on updating your code.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please check the main repository for contribution guidelines.
