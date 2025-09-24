# Streamlit Lightweight Charts Pro

<div class="grid cards" markdown>

-   :material-chart-line:{ .lg .middle } **Quick Start**

    ---

    Get up and running with your first chart in minutes

    [:octicons-arrow-right-24: Quick Start](getting-started/quick-start.md)

-   :material-api:{ .lg .middle } **API Reference**

    ---

    Complete API documentation with examples and type hints

    [:octicons-arrow-right-24: API Reference](api/chart.md)

-   :material-book-open:{ .lg .middle } **Examples**

    ---

    Explore real-world examples and use cases

    [:octicons-arrow-right-24: Examples](examples/overview.md)

-   :material-cog:{ .lg .middle } **Advanced**

    ---

    Advanced features and customization options

    [:octicons-arrow-right-24: Advanced](advanced/overview.md)

</div>

## What is Streamlit Lightweight Charts Pro?

Streamlit Lightweight Charts Pro is a professional-grade financial charting library for Streamlit that wraps TradingView's lightweight-charts with an ultra-simplified Python API and performance optimizations.

### Key Features

- **🚀 Ultra-Fast Performance**: Optimized for large datasets with lazy loading and efficient rendering
- **📊 Professional Charts**: Complete TradingView lightweight-charts feature set
- **🎨 Fluent API**: Intuitive method chaining for easy chart customization
- **🔧 Type Safety**: Full type hints with runtime validation
- **📱 Responsive**: Mobile-friendly charts that adapt to container sizes
- **⚡ Real-time Updates**: Efficient data updates without full re-rendering

### Quick Example

```python
import streamlit as st
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

# Create sample data
data = [
    SingleValueData("2024-01-01", 100),
    SingleValueData("2024-01-02", 105),
    SingleValueData("2024-01-03", 102),
    SingleValueData("2024-01-04", 108),
    SingleValueData("2024-01-05", 110),
]

# Create and render chart
chart = Chart(series=LineSeries(data, color="#2196F3"))
chart.render(key="my_chart")
```

## Installation

```bash
pip install streamlit-lightweight-charts-pro
```

For development with documentation:

```bash
pip install streamlit-lightweight-charts-pro[docs]
```

## Chart Types Supported

- **Line Charts**: Simple line charts for trend visualization
- **Candlestick Charts**: OHLC data with customizable styling
- **Area Charts**: Filled area charts with gradient support
- **Bar Charts**: Volume and histogram visualizations
- **Baseline Charts**: Relative performance charts
- **Multi-Pane Charts**: Multiple series with synchronized time scales

## Why Choose This Library?

### vs. Standard Streamlit Charts

| Feature | Streamlit | Lightweight Charts Pro |
|---------|-----------|------------------------|
| Performance | Limited | Optimized for large datasets |
| Chart Types | Basic | Professional financial charts |
| Customization | Limited | Extensive styling options |
| Real-time | Slow | Fast updates |
| Mobile | Poor | Responsive design |

### vs. Plotly/Matplotlib

- **Lighter**: Smaller bundle size and faster loading
- **Financial Focus**: Built specifically for financial data
- **Streamlit Native**: Seamless integration with Streamlit
- **TradingView Quality**: Professional-grade charting engine

## Getting Help

- **Documentation**: Comprehensive guides and API reference
- **Examples**: Real-world examples in the `examples/` directory
- **Issues**: Report bugs or request features on [GitHub](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues)
- **Discussions**: Join the community discussions

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/main/LICENSE) file for details.

---

<div class="grid cards" markdown>

-   :material-github:{ .lg .middle } **GitHub Repository**

    ---

    View source code, report issues, and contribute

    [:octicons-arrow-right-24: GitHub](https://github.com/nandkapadia/streamlit-lightweight-charts-pro)

-   :material-chat:{ .lg .middle } **Community**

    ---

    Join discussions and get help from the community

    [:octicons-arrow-right-24: Discussions](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/discussions)

</div>
