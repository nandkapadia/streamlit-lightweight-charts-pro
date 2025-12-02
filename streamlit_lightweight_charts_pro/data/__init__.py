"""Data model classes for Streamlit Lightweight Charts Pro.

This module provides the core data models used throughout the library for
representing financial data points, markers, annotations, and other chart elements.

All data classes are imported from lightweight_charts_pro package.
"""

# Import all data classes from core package
# Import streamlit-specific options classes
from lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)

# Annotations; Base data classes; Markers; Tooltips; Trade
from lightweight_charts_pro.data import (
    Annotation,
    AnnotationLayer,
    AnnotationManager,
    AreaData,
    BandData,
    BarData,
    BarMarker,
    BaselineData,
    CandlestickData,
    Data,
    GradientRibbonData,
    HistogramData,
    LineData,
    Marker,
    MarkerBase,
    OhlcData,
    OhlcvData,
    PriceMarker,
    RibbonData,
    SignalData,
    SingleValueData,
    TooltipConfig,
    TooltipField,
    TooltipManager,
    TooltipStyle,
    TradeData,
    TrendFillData,
    create_arrow_annotation,
    create_custom_tooltip,
    create_multi_series_tooltip,
    create_ohlc_tooltip,
    create_shape_annotation,
    create_single_value_tooltip,
    create_text_annotation,
    create_trade_tooltip,
)

# Import type definitions from core
from lightweight_charts_pro.type_definitions import (
    AnnotationPosition,
    AnnotationType,
    TooltipPosition,
    TooltipType,
    TradeType,
    TradeVisualization,
)

__all__ = [
    # Extended data classes (streamlit-specific)
    "Annotation",
    "AnnotationLayer",
    "AnnotationManager",
    "AnnotationPosition",
    "AnnotationType",
    # Base data classes (from core)
    "AreaData",
    "BandData",
    "BarData",
    "BarMarker",
    "BaselineData",
    "CandlestickData",
    "Data",
    "GradientRibbonData",
    "HistogramData",
    "LineData",
    "Marker",
    "MarkerBase",
    "OhlcData",
    "OhlcvData",
    "PriceMarker",
    "RibbonData",
    "SignalData",
    "SingleValueData",
    # Tooltip classes
    "TooltipConfig",
    "TooltipField",
    "TooltipManager",
    "TooltipPosition",
    "TooltipStyle",
    "TooltipType",
    # Trade classes
    "TradeData",
    "TradeType",
    "TradeVisualization",
    "TradeVisualizationOptions",
    "TrendFillData",
    # Functions
    "create_arrow_annotation",
    "create_custom_tooltip",
    "create_multi_series_tooltip",
    "create_ohlc_tooltip",
    "create_shape_annotation",
    "create_single_value_tooltip",
    "create_text_annotation",
    "create_trade_tooltip",
]
