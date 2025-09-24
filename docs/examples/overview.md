# Examples Overview

Explore real-world examples of using Streamlit Lightweight Charts Pro in your applications.

## Chart Types

### Basic Charts
- **[Line Charts](line-charts.md)** - Simple line charts for trend visualization
- **[Candlestick Charts](candlestick-charts.md)** - OHLC data with professional styling
- **[Area Charts](area-charts.md)** - Filled area charts with gradient support
- **[Bar Charts](bar-charts.md)** - Volume and histogram visualizations

### Advanced Charts
- **[Multi-Pane Charts](multi-pane-charts.md)** - Multiple series with synchronized time scales
- **[Baseline Charts](baseline-charts.md)** - Relative performance comparisons
- **[Histogram Charts](histogram-charts.md)** - Distribution and frequency analysis

## Use Cases

### Financial Applications
- Stock price tracking
- Portfolio performance monitoring
- Trading dashboard creation
- Market analysis tools

### Data Visualization
- Time series analysis
- Performance metrics
- Statistical distributions
- Comparative analysis

### Real-time Applications
- Live data streaming
- Interactive dashboards
- Real-time monitoring
- Dynamic updates

## Example Categories

### Getting Started Examples
Simple examples to help you get started quickly:

```python
# Basic line chart
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]
chart = Chart(series=LineSeries(data))
chart.render(key="basic_line")
```

### Intermediate Examples
More complex examples with customization:

```python
# Multi-series chart with custom styling
chart = (Chart()
    .add_series(LineSeries(price_data, color="#2196F3", title="Price"))
    .add_series(AreaSeries(volume_data, color="#4CAF50", title="Volume"))
    .update_options(height=400, width=800)
    .render(key="multi_series"))
```

### Advanced Examples
Professional-grade implementations:

```python
# Real-time updating chart with annotations
chart = (Chart()
    .add_series(CandlestickSeries(ohlc_data))
    .add_series(LineSeries(ma_data, color="#FF9800"))
    .add_annotations([Annotation("2024-01-15", "Important Event")])
    .update_options(
        height=600,
        layout=ChartOptions(background_color="#ffffff"),
        time_scale=TimeScaleOptions(time_visible=True)
    )
    .render(key="advanced_chart"))
```

## Running Examples

All examples are located in the `examples/` directory of the repository. You can run them locally:

```bash
# Navigate to an example
cd examples/line_charts/

# Run the example
streamlit run line_chart_basic.py
```

## Contributing Examples

We welcome contributions of new examples! Please see our [Contributing Guidelines](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/main/CONTRIBUTING.md) for details.

### Example Structure

When contributing examples, please follow this structure:

```python
"""
Example Title
=============

Brief description of what this example demonstrates.

Features:
- Feature 1
- Feature 2
- Feature 3

Requirements:
- streamlit
- pandas
- numpy
"""

import streamlit as st
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

st.title("Example Title")

# Example code here
# ...

# Add explanation
st.markdown("""
## Explanation

This example demonstrates...
""")
```
