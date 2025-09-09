"""
Type definitions for Streamlit Lightweight Charts Pro.

This module provides type definitions, enums, and color classes used throughout
the charting library. It includes enumerations for chart configuration options,
color definitions, and other type-safe constants.

The module exports:
    - Enums: ChartType, LineStyle, MarkerShape, etc.
    - Color classes: Background, BackgroundSolid, BackgroundGradient
    - Position and alignment enums: AnnotationPosition, HorzAlign, VertAlign
    - Trade-related enums: TradeType, TradeVisualization

These type definitions ensure consistency and type safety across the library,
providing clear interfaces for chart configuration and data handling.

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.type_definitions import (
        ChartType, LineStyle, MarkerShape, Background
    )

    # Using enums for type safety
    chart_type = ChartType.CANDLESTICK
    line_style = LineStyle.SOLID
    marker_shape = MarkerShape.CIRCLE

    # Using color classes
    background = BackgroundSolid(color="#ffffff")
    gradient = BackgroundGradient(
        top_color="#ffffff",
        bottom_color="#f0f0f0"
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

from streamlit_lightweight_charts_pro.type_definitions.colors import (
    Background,
    BackgroundGradient,
    BackgroundSolid,
)
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    AnnotationPosition,
    AnnotationType,
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
    PriceScaleMode,
    TrackingActivationMode,
    TrackingExitMode,
    TradeType,
    TradeVisualization,
    VertAlign,
)

__all__ = [
    # Enums
    "AnnotationPosition",
    "AnnotationType",
    "ChartType",
    "ColorType",
    "LineStyle",
    "LineType",
    "CrosshairMode",
    "MarkerPosition",
    "MarkerShape",
    "PriceScaleMode",
    "LastPriceAnimationMode",
    "HorzAlign",
    "VertAlign",
    "TrackingExitMode",
    "TrackingActivationMode",
    "ColumnNames",
    "TradeType",
    "TradeVisualization",
    # Colors
    "Background",
    "BackgroundSolid",
    "BackgroundGradient",
]
