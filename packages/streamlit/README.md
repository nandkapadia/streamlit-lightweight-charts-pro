# Streamlit Lightweight Charts Pro

Professional financial charting library for Streamlit applications, built on TradingView's Lightweight Charts.

## Installation

```bash
pip install streamlit-lightweight-charts-pro
```

## Quick Start

```python
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

# Create data
data = [
    SingleValueData("2024-01-01", 100),
    SingleValueData("2024-01-02", 105),
    SingleValueData("2024-01-03", 103),
]

# Create and render chart
chart = Chart(series=LineSeries(data, color="#2196F3"))
chart.render(key="my_chart")
```

## Features

### Chart Types
- **Line** - Simple line charts
- **Candlestick** - OHLC candlestick charts
- **Area** - Filled area charts
- **Bar** - OHLC bar charts
- **Histogram** - Volume/distribution histograms
- **Baseline** - Charts with a baseline reference

### Custom Series
- **Band** - Upper/middle/lower band visualization
- **Ribbon** - Filled area between two lines
- **Gradient Ribbon** - Ribbon with gradient fill
- **Trend Fill** - Filled trend visualization
- **Signal** - Buy/sell signal markers

### Advanced Features
- Multi-pane charts with synchronized time scales
- Trade visualization with markers and rectangles
- Annotations (text, arrows, shapes)
- Custom legends and tooltips
- Range switcher UI
- Linked chart synchronization
- Lazy loading for large datasets

## Fluent API

```python
from streamlit_lightweight_charts_pro import Chart, CandlestickSeries

chart = (
    Chart()
    .add_series(CandlestickSeries(data))
    .update_options(height=500)
    .add_annotation(create_text_annotation("2024-01-15", 105, "Peak"))
)
chart.render(key="candlestick_chart")
```

## Multi-Pane Charts

```python
from streamlit_lightweight_charts_pro import Chart, CandlestickSeries, HistogramSeries

chart = Chart(
    series=[
        CandlestickSeries(price_data, pane_id=0),
        HistogramSeries(volume_data, pane_id=1),
    ]
)
chart.render(key="multi_pane")
```

## Examples

See the `examples/` directory for comprehensive examples:
- `quick_start/` - Minimal examples to get started
- `line_charts/` - Line chart variations
- `candlestick_charts/` - OHLC chart examples
- `advanced_features/` - Multi-pane, legends, tooltips
- `trading_features/` - Trade visualization, signals
- `test_harness/` - Visual test suite

## Documentation

For full documentation, visit the [GitHub repository](https://github.com/nandkapadia/streamlit-lightweight-charts-pro).

## License

MIT License - see LICENSE file for details.
