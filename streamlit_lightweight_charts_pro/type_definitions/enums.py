"""
Enum definitions for streamlit-lightweight-charts.

This module contains all the enumeration types used throughout the library
for defining chart types, styling options, and configuration parameters.
These enums ensure type safety and provide a consistent interface for
chart configuration.
"""

from enum import Enum, IntEnum


class ChartType(str, Enum):
    """
    Chart type enumeration.

    Defines the available chart types that can be created and rendered.
    Each chart type corresponds to a specific visualization style and
    data format requirements.

    Attributes:
        AREA: Area chart - filled area below a line.
        BAND: Band chart - multiple lines with fill areas (e.g., Bollinger Bands).
        BASELINE: Baseline chart - values relative to a baseline.
        HISTOGRAM: Histogram chart - bar chart for volume or distribution.
        LINE: Line chart - simple line connecting data points.
        BAR: Bar chart - OHLC bars for price data.
        CANDLESTICK: Candlestick chart - traditional Japanese candlesticks.
        RIBBON: Ribbon chart - upper and lower bands with fill areas.
        GRADIENT_RIBBON: Gradient ribbon chart - ribbon with gradient fills.
        GRADIENT_BAND: Gradient band chart - band with gradient fills.
        TREND_FILL: Trend fill chart - fills between trend lines and candle body midpoints.
        SIGNAL: Signal chart - background coloring based on signal values.
    """

    AREA = "area"
    BAND = "band"
    BASELINE = "baseline"
    HISTOGRAM = "histogram"
    LINE = "line"
    BAR = "bar"
    CANDLESTICK = "candlestick"
    RIBBON = "ribbon"
    GRADIENT_RIBBON = "gradient_ribbon"
    GRADIENT_BAND = "gradient_band"
    TREND_FILL = "trend_fill"
    SIGNAL = "signal"


class ColorType(str, Enum):
    """
    Color type enumeration.

    Defines how colors should be applied to chart elements.
    Controls whether colors are solid or use gradient effects.

    Attributes:
        SOLID: Solid color - uniform color across the element.
        VERTICAL_GRADIENT: Vertical gradient - color gradient from top to bottom.
    """

    SOLID = "solid"
    VERTICAL_GRADIENT = "gradient"


class LineStyle(IntEnum):
    """
    Line style enumeration.

    Defines the visual style of lines in charts, including borders,
    grid lines, and series lines.

    Attributes:
        SOLID: Solid line - continuous line without breaks.
        DOTTED: Dotted line - series of dots.
        DASHED: Dashed line - series of short dashes.
        LARGE_DASHED: Large dashed line - series of long dashes.
    """

    SOLID = 0
    DOTTED = 1
    DASHED = 2
    LARGE_DASHED = 3


class LineType(IntEnum):
    """
    Line type enumeration.

    Defines how lines should be drawn between data points.
    Controls the interpolation method used for line series.

    Attributes:
        SIMPLE: Simple line - straight lines between points.
        CURVED: Curved line - smooth curves between points.
    """

    SIMPLE = 0
    WITH_STEPS = 1
    CURVED = 2


class CrosshairMode(IntEnum):
    """
    Crosshair mode enumeration.

    Defines how the crosshair behaves when hovering over the chart.
    Controls whether the crosshair snaps to data points or moves freely.

    Attributes:
        NORMAL: Normal mode - crosshair moves freely across the chart.
        MAGNET: Magnet mode - crosshair snaps to nearest data points.
    """

    NORMAL = 0
    MAGNET = 1


class LastPriceAnimationMode(IntEnum):
    """
    Last price animation mode enumeration.

    Defines how the last price line should be animated when new data
    is added to the chart.

    Attributes:
        DISABLED: No animation - last price line updates instantly.
        CONTINUOUS: Continuous animation - smooth transitions for all updates.
        ON_DATA_UPDATE: Update animation - animation only when new data arrives.
    """

    DISABLED = 0
    CONTINUOUS = 1
    ON_DATA_UPDATE = 2


class PriceScaleMode(IntEnum):
    """
    Price scale mode enumeration.

    Defines how the price scale (y-axis) should be displayed and calculated.
    Controls the scale type and reference point for price values.

    Attributes:
        NORMAL: Normal scale - linear price scale.
        LOGARITHMIC: Logarithmic scale - log-based price scale.
        PERCENTAGE: Percentage scale - values as percentages.
        INDEXED_TO_100: Indexed scale - values relative to 100.
    """

    NORMAL = 0
    LOGARITHMIC = 1
    PERCENTAGE = 2
    INDEXED_TO_100 = 3


class HorzAlign(str, Enum):
    """
    Horizontal alignment enumeration.

    Defines horizontal text alignment for labels, annotations, and
    other text elements on the chart.

    Attributes:
        LEFT: Left alignment - text aligned to the left.
        CENTER: Center alignment - text centered horizontally.
        RIGHT: Right alignment - text aligned to the right.
    """

    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"


class VertAlign(str, Enum):
    """
    Vertical alignment enumeration.

    Defines vertical text alignment for labels, annotations, and
    other text elements on the chart.

    Attributes:
        TOP: Top alignment - text aligned to the top.
        CENTER: Center alignment - text centered vertically.
        BOTTOM: Bottom alignment - text aligned to the bottom.
    """

    TOP = "top"
    CENTER = "center"
    BOTTOM = "bottom"


class TrackingExitMode(str, Enum):
    """
    Tracking exit mode enumeration.

    Defines when the tracking mode should exit.

    Attributes:
        EXIT_ON_MOVE: Exit tracking mode when mouse moves.
        EXIT_ON_CROSS: Exit tracking mode when crosshair crosses series.
        NEVER_EXIT: Never exit tracking mode automatically.
    """

    EXIT_ON_MOVE = "EXIT_ON_MOVE"
    EXIT_ON_CROSS = "EXIT_ON_CROSS"
    NEVER_EXIT = "NEVER_EXIT"


class TrackingActivationMode(str, Enum):
    """
    Tracking activation mode enumeration.

    Defines when the tracking mode should be activated.

    Attributes:
        ON_MOUSE_ENTER: Activate tracking mode when mouse enters chart.
        ON_TOUCH_START: Activate tracking mode when touch starts.
    """

    ON_MOUSE_ENTER = "ON_MOUSE_ENTER"
    ON_TOUCH_START = "ON_TOUCH_START"


class MarkerPosition(str, Enum):
    """
    Marker position enumeration for chart markers.

    Defines where markers should be positioned relative to the data bars
    or points on the chart.

    Attributes:
        ABOVE_BAR: Position marker above the data bar/point.
        BELOW_BAR: Position marker below the data bar/point.
        IN_BAR: Position marker inside the data bar/point.
    """

    ABOVE_BAR = "aboveBar"
    BELOW_BAR = "belowBar"
    IN_BAR = "inBar"
    AT_PRICE_TOP = "atPriceTop"
    AT_PRICE_BOTTOM = "atPriceBottom"
    AT_PRICE_MIDDLE = "atPriceMiddle"


class MarkerShape(str, Enum):
    """
    Marker shape enumeration for chart markers.

    Defines the available shapes for chart markers that can be displayed
    on charts to highlight specific data points or events.

    Attributes:
        CIRCLE: Circular marker shape.
        SQUARE: Square marker shape.
        ARROW_UP: Upward-pointing arrow marker.
        ARROW_DOWN: Downward-pointing arrow marker.
    """

    CIRCLE = "circle"
    SQUARE = "square"
    ARROW_UP = "arrowUp"
    ARROW_DOWN = "arrowDown"


class AnnotationType(str, Enum):
    TEXT = "text"
    ARROW = "arrow"
    SHAPE = "shape"
    LINE = "line"
    RECTANGLE = "rectangle"
    CIRCLE = "circle"


class AnnotationPosition(str, Enum):
    ABOVE = "above"
    BELOW = "below"
    INLINE = "inline"


class ColumnNames(str, Enum):
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
    """Trade visualization style options."""

    MARKERS = "markers"  # Just entry/exit markers
    RECTANGLES = "rectangles"  # Rectangle from entry to exit
    BOTH = "both"  # Both markers and rectangles
    LINES = "lines"  # Lines connecting entry to exit
    ARROWS = "arrows"  # Arrows from entry to exit
    ZONES = "zones"  # Colored zones with transparency


class BackgroundStyle(str, Enum):
    SOLID = "solid"
    VERTICAL_GRADIENT = "gradient"


class PriceLineSource(str, Enum):
    """
    Price line source enumeration.

    Defines the source to use for the value of the price line.
    Controls which data point determines the price line position.

    Attributes:
        LAST_BAR: Last bar - use the last visible bar's price.
        LAST_VISIBLE: Last visible - use the last visible data point's price.
    """

    LAST_BAR = "lastBar"
    LAST_VISIBLE = "lastVisible"


class TooltipType(str, Enum):
    """
    Tooltip type enumeration.

    Defines the types of tooltips supported by the system.
    Each type corresponds to a specific data format and display style.

    Attributes:
        OHLC: OHLC tooltip - displays open, high, low, close, and volume data.
        SINGLE: Single value tooltip - displays a single data value.
        MULTI: Multi-series tooltip - displays data from multiple series.
        CUSTOM: Custom tooltip - displays custom content using templates.
        TRADE: Trade tooltip - displays trade information (entry, exit, P&L).
        MARKER: Marker tooltip - displays marker-specific information.
    """

    OHLC = "ohlc"
    SINGLE = "single"
    MULTI = "multi"
    CUSTOM = "custom"
    TRADE = "trade"
    MARKER = "marker"


class TooltipPosition(str, Enum):
    """
    Tooltip position enumeration.

    Defines how tooltips should be positioned relative to the cursor
    or chart elements.

    Attributes:
        CURSOR: Cursor position - tooltip follows the mouse cursor.
        FIXED: Fixed position - tooltip appears at a fixed location.
        AUTO: Auto position - tooltip position is automatically determined.
    """

    CURSOR = "cursor"
    FIXED = "fixed"
    AUTO = "auto"
