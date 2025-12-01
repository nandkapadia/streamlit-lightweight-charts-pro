"""Lightweight Charts Core - Framework-agnostic Python core library.

This package provides the data models, type definitions, and utilities that are
shared between different frontend frameworks (Streamlit, Vue 3, React, etc.).
"""

# Data models
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

# Type definitions
from lightweight_charts_core.type_definitions import (
    AnnotationPosition,
    AnnotationType,
    BackgroundStyle,
    ChartType,
    ColorType,
    ColumnNames,
    CrosshairMode,
    HorzAlign,
    LastPriceAnimationMode,
    LineStyle,
    LineType,
    MarkerPosition,
    MarkerShape,
    PriceLineSource,
    PriceScaleMode,
    TooltipPosition,
    TooltipType,
    TrackingActivationMode,
    TrackingExitMode,
    TradeType,
    TradeVisualization,
    VertAlign,
)

# Types and configuration
from lightweight_charts_core.types import (
    Options,
    SeriesConfigChange,
    SeriesConfigState,
    SeriesConfiguration,
    SeriesStyleConfig,
    SeriesType,
    SeriesVisibilityConfig,
)

# Utilities
from lightweight_charts_core.utils import (
    CaseConverter,
    SerializableMixin,
    SerializationConfig,
    SimpleSerializableMixin,
    chainable_field,
    chainable_property,
    is_valid_color,
    normalize_time,
    snake_to_camel,
    validated_field,
)

__version__ = "0.1.0"


__all__ = [
    # Version
    "__version__",
    # Data models
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
    # Type definitions
    "AnnotationPosition",
    "AnnotationType",
    "BackgroundStyle",
    "ChartType",
    "ColorType",
    "ColumnNames",
    "CrosshairMode",
    "HorzAlign",
    "LastPriceAnimationMode",
    "LineStyle",
    "LineType",
    "MarkerPosition",
    "MarkerShape",
    "PriceLineSource",
    "PriceScaleMode",
    "TooltipPosition",
    "TooltipType",
    "TrackingActivationMode",
    "TrackingExitMode",
    "TradeType",
    "TradeVisualization",
    "VertAlign",
    # Types and configuration
    "Options",
    "SeriesConfigChange",
    "SeriesConfigState",
    "SeriesConfiguration",
    "SeriesStyleConfig",
    "SeriesType",
    "SeriesVisibilityConfig",
    # Utilities
    "CaseConverter",
    "SerializableMixin",
    "SerializationConfig",
    "SimpleSerializableMixin",
    "chainable_field",
    "chainable_property",
    "is_valid_color",
    "normalize_time",
    "snake_to_camel",
    "validated_field",
]
