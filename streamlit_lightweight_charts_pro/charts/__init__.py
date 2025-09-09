"""
Chart classes for Streamlit Lightweight Charts Pro.

This module provides all chart classes including Chart and various series types
for creating interactive financial charts. It serves as the main interface for
chart creation and configuration in the library.

The module includes:
    - Chart: Main chart class with fluent API and method chaining
    - Series classes: LineSeries, AreaSeries, CandlestickSeries, etc.
    - Options classes: Chart configuration and styling options
    - Series management: Adding, updating, and removing series

The Chart class provides a fluent API for creating charts with method chaining,
making chart creation more intuitive and readable. It supports all major chart
types and provides comprehensive customization options.

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.charts import Chart, LineSeries
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create data
    data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]

    # Method 1: Direct chart creation
    chart = Chart()
    chart.add_series(LineSeries(data, color="#ff0000"))
    chart.update_options(height=400)
    chart.render(key="my_chart")

    # Method 2: Fluent API with method chaining
    chart = (Chart()
             .add_series(LineSeries(data, color="#ff0000"))
             .update_options(height=400)
             .add_annotation(create_text_annotation("2024-01-01", 100, "Start")))
    chart.render(key="my_chart")
    ```

Available Series Types:
    - LineSeries: Simple line charts
    - AreaSeries: Filled area charts
    - CandlestickSeries: Japanese candlestick charts
    - BarSeries: OHLC bar charts
    - HistogramSeries: Volume or distribution charts
    - BaselineSeries: Relative to baseline charts

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.chart_manager import ChartManager
from streamlit_lightweight_charts_pro.charts.series import (
    AreaSeries,
    BandSeries,
    BarSeries,
    BaselineSeries,
    CandlestickSeries,
    GradientBandSeries,
    GradientRibbonSeries,
    HistogramSeries,
    LineSeries,
    RibbonSeries,
    SignalSeries,
    TrendFillSeries,
)

__all__ = [
    "AreaSeries",
    "LineSeries",
    "CandlestickSeries",
    "BarSeries",
    "HistogramSeries",
    "BaselineSeries",
    "TrendFillSeries",
    "RibbonSeries",
    "GradientRibbonSeries",
    "GradientBandSeries",
    "SignalSeries",
    "BandSeries",
    "Chart",
    "ChartManager",
]
