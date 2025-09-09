"""
Series module for Streamlit Lightweight Charts Pro.

This module provides all series classes for creating different types of chart visualizations.
Each series type represents a specific way of displaying data on charts, with its own
styling options and data requirements.

The module includes:
    - Series: Base abstract class for all series types
    - LineSeries: Simple line charts connecting data points
    - AreaSeries: Filled area charts below lines
    - CandlestickSeries: Japanese candlestick charts for OHLC data
    - BarSeries: OHLC bar charts for price data
    - HistogramSeries: Bar charts for volume or distribution data
    - BaselineSeries: Charts relative to a baseline value
    - BandSeries: Multiple lines with fill areas (e.g., Bollinger Bands)
    - SignalSeries: Background coloring based on signal values

Each series type supports:
    - Custom styling (colors, line styles, markers)
    - Data validation and type safety
    - Method chaining for fluent API
    - Integration with chart options
    - Automatic data serialization

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.charts.series import (
        LineSeries, AreaSeries, CandlestickSeries
    )
    from streamlit_lightweight_charts_pro.data import (
        SingleValueData, CandlestickData
    )

    # Create line series
    line_data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]
    line_series = LineSeries(line_data, color="#ff0000", line_width=2)

    # Create candlestick series
    candlestick_data = [CandlestickData("2024-01-01", 100, 105, 98, 102, 1000)]
    candlestick_series = CandlestickSeries(candlestick_data)

    # Add to chart
    chart = Chart().add_series(line_series).add_series(candlestick_series)
    ```

Available Series Types:
    - LineSeries: Simple line charts for continuous data
    - AreaSeries: Filled area charts for trend visualization
    - CandlestickSeries: Traditional Japanese candlesticks for price data
    - BarSeries: OHLC bars for price data with volume
    - HistogramSeries: Volume or distribution visualization
    - BaselineSeries: Values relative to a baseline reference
    - BandSeries: Multiple lines with fill areas for technical analysis
    - RibbonSeries: Upper and lower bands with fill areas
    - SignalSeries: Background coloring for signal-based analysis

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

from streamlit_lightweight_charts_pro.charts.series.area import AreaSeries
from streamlit_lightweight_charts_pro.charts.series.band import BandSeries
from streamlit_lightweight_charts_pro.charts.series.bar_series import BarSeries
from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.charts.series.baseline import BaselineSeries
from streamlit_lightweight_charts_pro.charts.series.candlestick import CandlestickSeries
from streamlit_lightweight_charts_pro.charts.series.gradient_band import GradientBandSeries
from streamlit_lightweight_charts_pro.charts.series.gradient_ribbon import GradientRibbonSeries
from streamlit_lightweight_charts_pro.charts.series.histogram import HistogramSeries
from streamlit_lightweight_charts_pro.charts.series.line import LineSeries
from streamlit_lightweight_charts_pro.charts.series.ribbon import RibbonSeries
from streamlit_lightweight_charts_pro.charts.series.signal_series import SignalSeries
from streamlit_lightweight_charts_pro.charts.series.trend_fill import TrendFillSeries

__all__ = [
    "Series",
    "AreaSeries",
    "BandSeries",
    "LineSeries",
    "CandlestickSeries",
    "BarSeries",
    "HistogramSeries",
    "BaselineSeries",
    "RibbonSeries",
    "GradientRibbonSeries",
    "GradientBandSeries",
    "TrendFillSeries",
    "SignalSeries",
]
