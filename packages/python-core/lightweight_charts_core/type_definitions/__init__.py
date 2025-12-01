"""Type definitions for Streamlit Lightweight Charts Pro.

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
    from lightweight_charts_core.type_definitions import (
        ChartType,
        LineStyle,
        MarkerShape,
        Background,
    )

    # Using enums for type safety
    chart_type = ChartType.CANDLESTICK
    line_style = LineStyle.SOLID
    marker_shape = MarkerShape.CIRCLE

    # Using color classes
    background = BackgroundSolid(color="#ffffff")
    gradient = BackgroundGradient(top_color="#ffffff", bottom_color="#f0f0f0")
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

from lightweight_charts_core.type_definitions.colors import (
    Background,
    BackgroundGradient,
    BackgroundSolid,
)
from lightweight_charts_core.type_definitions.enums import (
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

__all__ = [
    # Enums
    "AnnotationPosition",
    "AnnotationType",
    # Colors
    "Background",
    "BackgroundGradient",
    "BackgroundSolid",
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
]
