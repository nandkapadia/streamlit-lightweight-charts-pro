# Lightweight Charts Core (Python)

Framework-agnostic Python core library for TradingView Lightweight Charts.

This package provides the data models, type definitions, and utilities that are shared between
different frontend frameworks (Streamlit, Vue 3, React, etc.).

## Installation

```bash
pip install lightweight-charts-core
```

## Features

- **Data Models**: Type-safe data classes for all chart data types (OHLC, Line, Area, etc.)
- **Type Definitions**: Comprehensive enums and type classes for chart configuration
- **Utilities**: Serialization, validation, and data transformation utilities
- **Series Configuration**: Configuration types for series customization

## Usage

```python
from lightweight_charts_core.data import CandlestickData, LineData
from lightweight_charts_core.type_definitions import ChartType, LineStyle

# Create OHLC data
ohlc_data = [
    CandlestickData(time="2024-01-01", open=100, high=105, low=98, close=102),
    CandlestickData(time="2024-01-02", open=102, high=108, low=100, close=106),
]

# Create line data
line_data = [
    LineData(time="2024-01-01", value=100),
    LineData(time="2024-01-02", value=105),
]
```

## License

MIT
