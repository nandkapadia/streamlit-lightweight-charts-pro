"""Data model classes for Streamlit Lightweight Charts Pro.

This module provides the core data models used throughout the library for
representing financial data points, markers, annotations, and other chart elements.

All data classes are imported from lightweight_charts_core package.
"""

# Import all data classes from core package
from lightweight_charts_core.data import (
    # Base data classes
    AreaData,
    BandData,
    BarData,
    BaselineData,
    CandlestickData,
    Data,
    GradientRibbonData,
    HistogramData,
    LineData,
    OhlcData,
    OhlcvData,
    RibbonData,
    SignalData,
    SingleValueData,
    TrendFillData,
    # Markers
    BarMarker,
    Marker,
    MarkerBase,
    PriceMarker,
    # Annotations
    Annotation,
    AnnotationLayer,
    AnnotationManager,
    create_arrow_annotation,
    create_shape_annotation,
    create_text_annotation,
    # Tooltips
    TooltipConfig,
    TooltipField,
    TooltipManager,
    TooltipStyle,
    create_custom_tooltip,
    create_multi_series_tooltip,
    create_ohlc_tooltip,
    create_single_value_tooltip,
    create_trade_tooltip,
    # Trade
    TradeData,
)

# Import type definitions from core
from lightweight_charts_core.type_definitions import (
    AnnotationPosition,
    AnnotationType,
    TooltipPosition,
    TooltipType,
    TradeType,
    TradeVisualization,
)

# Import streamlit-specific options classes
from lightweight_charts_core.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)

__all__ = [
    # Base data classes (from core)
    "AreaData",
    "BarData",
    "BaselineData",
    "CandlestickData",
    "Data",
    "HistogramData",
    "LineData",
    "OhlcData",
    "OhlcvData",
    "SingleValueData",
    # Extended data classes (streamlit-specific)
    "Annotation",
    "AnnotationLayer",
    "AnnotationManager",
    "AnnotationPosition",
    "AnnotationType",
    "BandData",
    "BarMarker",
    "GradientRibbonData",
    "Marker",
    "MarkerBase",
    "PriceMarker",
    "RibbonData",
    "SignalData",
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
