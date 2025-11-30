"""Enum definitions for lightweight-charts-core.

This module contains comprehensive enumeration types used throughout the library
for defining chart types, styling options, configuration parameters, and behavior modes.
"""

from enum import Enum, IntEnum


class ChartType(str, Enum):
    """Chart type enumeration."""

    AREA = "area"
    BAND = "band"
    BASELINE = "baseline"
    HISTOGRAM = "histogram"
    LINE = "line"
    BAR = "bar"
    CANDLESTICK = "candlestick"
    RIBBON = "ribbon"
    GRADIENT_RIBBON = "gradient_ribbon"
    TREND_FILL = "trend_fill"
    SIGNAL = "signal"


class ColorType(str, Enum):
    """Color type enumeration."""

    SOLID = "solid"
    VERTICAL_GRADIENT = "gradient"


class LineStyle(IntEnum):
    """Line style enumeration."""

    SOLID = 0
    DOTTED = 1
    DASHED = 2
    LARGE_DASHED = 3


class LineType(IntEnum):
    """Line type enumeration."""

    SIMPLE = 0
    WITH_STEPS = 1
    CURVED = 2


class CrosshairMode(IntEnum):
    """Crosshair mode enumeration."""

    NORMAL = 0
    MAGNET = 1


class LastPriceAnimationMode(IntEnum):
    """Last price animation mode enumeration."""

    DISABLED = 0
    CONTINUOUS = 1
    ON_DATA_UPDATE = 2


class PriceScaleMode(IntEnum):
    """Price scale mode enumeration."""

    NORMAL = 0
    LOGARITHMIC = 1
    PERCENTAGE = 2
    INDEXED_TO_100 = 3


class HorzAlign(str, Enum):
    """Horizontal alignment enumeration."""

    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"


class VertAlign(str, Enum):
    """Vertical alignment enumeration."""

    TOP = "top"
    CENTER = "center"
    BOTTOM = "bottom"


class TrackingExitMode(str, Enum):
    """Tracking exit mode enumeration."""

    EXIT_ON_MOVE = "EXIT_ON_MOVE"
    EXIT_ON_CROSS = "EXIT_ON_CROSS"
    NEVER_EXIT = "NEVER_EXIT"


class TrackingActivationMode(str, Enum):
    """Tracking activation mode enumeration."""

    ON_MOUSE_ENTER = "ON_MOUSE_ENTER"
    ON_TOUCH_START = "ON_TOUCH_START"


class MarkerPosition(str, Enum):
    """Marker position enumeration."""

    ABOVE_BAR = "aboveBar"
    BELOW_BAR = "belowBar"
    IN_BAR = "inBar"
    AT_PRICE_TOP = "atPriceTop"
    AT_PRICE_BOTTOM = "atPriceBottom"
    AT_PRICE_MIDDLE = "atPriceMiddle"


class MarkerShape(str, Enum):
    """Marker shape enumeration."""

    CIRCLE = "circle"
    SQUARE = "square"
    ARROW_UP = "arrowUp"
    ARROW_DOWN = "arrowDown"


class AnnotationType(str, Enum):
    """Annotation type enumeration."""

    TEXT = "text"
    ARROW = "arrow"
    SHAPE = "shape"
    LINE = "line"
    RECTANGLE = "rectangle"
    CIRCLE = "circle"


class AnnotationPosition(str, Enum):
    """Annotation position enumeration."""

    ABOVE = "above"
    BELOW = "below"
    INLINE = "inline"


class ColumnNames(str, Enum):
    """Column name enumeration for DataFrame integration."""

    TIME = "time"
    OPEN = "open"
    HIGH = "high"
    LOW = "low"
    CLOSE = "close"
    VOLUME = "volume"
    DATETIME = "datetime"
    VALUE = "value"


class TradeType(str, Enum):
    """Trade type enumeration."""

    LONG = "long"
    SHORT = "short"


class TradeVisualization(str, Enum):
    """Trade visualization style enumeration."""

    MARKERS = "markers"
    RECTANGLES = "rectangles"
    BOTH = "both"
    LINES = "lines"
    ARROWS = "arrows"
    ZONES = "zones"


class BackgroundStyle(str, Enum):
    """Background style enumeration."""

    SOLID = "solid"
    VERTICAL_GRADIENT = "gradient"


class PriceLineSource(str, Enum):
    """Price line source enumeration."""

    LAST_BAR = "lastBar"
    LAST_VISIBLE = "lastVisible"


class TooltipType(str, Enum):
    """Tooltip type enumeration."""

    OHLC = "ohlc"
    SINGLE = "single"
    MULTI = "multi"
    CUSTOM = "custom"
    TRADE = "trade"
    MARKER = "marker"


class TooltipPosition(str, Enum):
    """Tooltip position enumeration."""

    CURSOR = "cursor"
    FIXED = "fixed"
    AUTO = "auto"


__all__ = [
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
]
