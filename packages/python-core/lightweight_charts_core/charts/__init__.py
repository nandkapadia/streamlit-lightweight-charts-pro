"""Charts module for lightweight-charts-core.

This module provides all chart-related classes including series types,
options, managers, and validators.

BaseChart and BaseChartManager provide framework-agnostic chart logic.
Framework-specific implementations (Streamlit, FastAPI, etc.) should extend
these base classes and add their rendering capabilities.
"""

from lightweight_charts_core.charts.base_chart import BaseChart
from lightweight_charts_core.charts.base_chart_manager import BaseChartManager
from lightweight_charts_core.charts.options import (
    ChartOptions,
    CrosshairLineOptions,
    CrosshairOptions,
    CrosshairSyncOptions,
    GridLineOptions,
    GridOptions,
    KineticScrollOptions,
    LayoutOptions,
    LegendOptions,
    LineOptions,
    LocalizationOptions,
    Options,
    PaneHeightOptions,
    PriceFormatOptions,
    PriceLineOptions,
    PriceScaleMargins,
    PriceScaleOptions,
    RangeConfig,
    RangeSwitcherOptions,
    SyncOptions,
    TimeScaleOptions,
    TrackingModeOptions,
    TradeVisualizationOptions,
    WatermarkOptions,
)
from lightweight_charts_core.charts.series import (
    AreaSeries,
    BandSeries,
    BarSeries,
    BaselineSeries,
    CandlestickSeries,
    GradientRibbonSeries,
    HistogramSeries,
    LineSeries,
    RibbonSeries,
    Series,
    SignalSeries,
    TrendFillSeries,
)

__all__ = [
    # Base classes
    "BaseChart",
    "BaseChartManager",
    # Series
    "AreaSeries",
    "BandSeries",
    "BarSeries",
    "BaselineSeries",
    "CandlestickSeries",
    "GradientRibbonSeries",
    "HistogramSeries",
    "LineSeries",
    "RibbonSeries",
    "Series",
    "SignalSeries",
    "TrendFillSeries",
    # Options
    "ChartOptions",
    "CrosshairLineOptions",
    "CrosshairOptions",
    "CrosshairSyncOptions",
    "GridLineOptions",
    "GridOptions",
    "KineticScrollOptions",
    "LayoutOptions",
    "LegendOptions",
    "LineOptions",
    "LocalizationOptions",
    "Options",
    "PaneHeightOptions",
    "PriceFormatOptions",
    "PriceLineOptions",
    "PriceScaleMargins",
    "PriceScaleOptions",
    "RangeConfig",
    "RangeSwitcherOptions",
    "SyncOptions",
    "TimeScaleOptions",
    "TrackingModeOptions",
    "TradeVisualizationOptions",
    "WatermarkOptions",
]
