"""Data model classes for Streamlit Lightweight Charts Pro.

This module provides the core data models used throughout the library for
representing financial data points, markers, annotations, and other chart elements.

The base data classes (Data, SingleValueData, LineData, etc.) are imported from
lightweight_charts_core package. Extended data classes specific to Streamlit
(markers, annotations, tooltips) are defined in this package.
"""

# Import base data classes from core package
from lightweight_charts_core.data import (
    AreaData,
    BarData,
    BaselineData,
    CandlestickData,
    Data,
    HistogramData,
    LineData,
    OhlcData,
    OhlcvData,
    SingleValueData,
)

# Import type definitions from core
from lightweight_charts_core.type_definitions import (
    TooltipPosition,
    TooltipType,
    TradeType,
    TradeVisualization,
)

# Import streamlit-specific data classes
from streamlit_lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from streamlit_lightweight_charts_pro.data.annotation import (
    Annotation,
    AnnotationLayer,
    AnnotationManager,
    AnnotationPosition,
    AnnotationType,
    create_arrow_annotation,
    create_shape_annotation,
    create_text_annotation,
)
from streamlit_lightweight_charts_pro.data.band import BandData
from streamlit_lightweight_charts_pro.data.gradient_ribbon import GradientRibbonData
from streamlit_lightweight_charts_pro.data.marker import BarMarker, Marker, MarkerBase, PriceMarker
from streamlit_lightweight_charts_pro.data.ribbon import RibbonData
from streamlit_lightweight_charts_pro.data.signal_data import SignalData
from streamlit_lightweight_charts_pro.data.tooltip import (
    TooltipConfig,
    TooltipField,
    TooltipManager,
    TooltipStyle,
    create_custom_tooltip,
    create_multi_series_tooltip,
    create_ohlc_tooltip,
    create_single_value_tooltip,
    create_trade_tooltip,
)
from streamlit_lightweight_charts_pro.data.trade import TradeData
from streamlit_lightweight_charts_pro.data.trend_fill import TrendFillData

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
