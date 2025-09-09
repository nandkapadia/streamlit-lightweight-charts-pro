"""
Data model classes for Streamlit Lightweight Charts Pro.

This module provides the core data models used throughout the library for
representing financial data points, markers, annotations, and other chart elements.
It serves as the foundation for all data handling and visualization in the library.

The data models are designed to be flexible and support various input formats
while maintaining consistency in the internal representation. They provide
type safety and validation for financial data structures.

The module includes:
    - Base data classes: Data, SingleValueData, LineData, etc.
    - OHLC data classes: CandlestickData, OhlcvData, BarData
    - Specialized data classes: AreaData, BaselineData, HistogramData, BandData
    - Marker classes: MarkerBase, PriceMarker, BarMarker, Marker
    - Annotation system: Annotation, AnnotationLayer, AnnotationManager
    - Trade visualization: TradeData, TradeType, TradeVisualizationOptions
    - Tooltip system: TooltipConfig, TooltipManager, various tooltip creators
    - Signal data: SignalData for signal-based visualizations

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.data import (
        SingleValueData, CandlestickData, Marker, create_text_annotation
    )

    # Create single value data
    data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]

    # Create OHLC data
    ohlc_data = [CandlestickData("2024-01-01", 100, 105, 98, 102, 1000)]

    # Create markers
    marker = Marker("2024-01-01", 100, MarkerPosition.ABOVE_BAR, MarkerShape.CIRCLE)

    # Create annotations
    annotation = create_text_annotation("2024-01-01", 100, "Important Event")
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

from streamlit_lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)

# Import annotation classes
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

# Import area and bar data classes
from streamlit_lightweight_charts_pro.data.area_data import AreaData

# Import band data classes
from streamlit_lightweight_charts_pro.data.band import BandData
from streamlit_lightweight_charts_pro.data.bar_data import BarData
from streamlit_lightweight_charts_pro.data.baseline_data import BaselineData

# Import OHLC data classes
from streamlit_lightweight_charts_pro.data.candlestick_data import CandlestickData

# Import base data classes
from streamlit_lightweight_charts_pro.data.data import Data
from streamlit_lightweight_charts_pro.data.gradient_band import GradientBandData
from streamlit_lightweight_charts_pro.data.gradient_ribbon import GradientRibbonData
from streamlit_lightweight_charts_pro.data.histogram_data import HistogramData

# Import single value data classes
from streamlit_lightweight_charts_pro.data.line_data import LineData

# Import marker classes
from streamlit_lightweight_charts_pro.data.marker import BarMarker, Marker, MarkerBase, PriceMarker
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.data.ribbon import RibbonData

# Import signal data classes
from streamlit_lightweight_charts_pro.data.signal_data import SignalData
from streamlit_lightweight_charts_pro.data.single_value_data import SingleValueData

# Import tooltip classes
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

# Import trade classes
from streamlit_lightweight_charts_pro.data.trade import (
    TradeData,
    TradeType,
)
from streamlit_lightweight_charts_pro.data.trend_fill import TrendFillData

# Import tooltip enums from type_definitions
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    TooltipPosition,
    TooltipType,
    TradeVisualization,
)

# Re-export all classes for backward compatibility
__all__ = [
    # Base data classes
    "Data",
    # Single value data classes
    "SingleValueData",
    "LineData",
    "HistogramData",
    # Area and bar data classes
    "AreaData",
    "BarData",
    "BaselineData",
    # OHLC data classes
    "CandlestickData",
    "OhlcvData",
    # Band data classes
    "BandData",
    "RibbonData",
    "GradientBandData",
    "GradientRibbonData",
    "TrendFillData",
    # Marker classes
    "MarkerBase",
    "PriceMarker",
    "BarMarker",
    "Marker",
    # Trade classes
    "TradeData",
    "TradeType",
    "TradeVisualization",
    "TradeVisualizationOptions",
    # Annotation classes
    "Annotation",
    "AnnotationLayer",
    "AnnotationManager",
    "AnnotationPosition",
    "AnnotationType",
    "create_arrow_annotation",
    "create_shape_annotation",
    "create_text_annotation",
    # Signal data classes
    "SignalData",
    # Tooltip classes
    "TooltipConfig",
    "TooltipField",
    "TooltipManager",
    "TooltipPosition",
    "TooltipStyle",
    "TooltipType",
    "create_custom_tooltip",
    "create_multi_series_tooltip",
    "create_ohlc_tooltip",
    "create_single_value_tooltip",
    "create_trade_tooltip",
]
