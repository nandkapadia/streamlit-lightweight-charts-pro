"""Enum definitions for streamlit-lightweight-charts.

This module contains comprehensive enumeration types used throughout the library
for defining chart types, styling options, configuration parameters, and behavior
modes. These enums ensure type safety, provide a consistent interface for chart
configuration, and enable IntelliSense support for better developer experience.

The module provides enums for:
    - Chart types and visualization modes
    - Color and styling options
    - Line styles and types
    - Crosshair and interaction modes
    - Price scale and time scale configurations
    - Marker positions and shapes
    - Animation and tracking modes

These enums are designed to be compatible with TradingView's Lightweight Charts
library while providing a Python-native interface for configuration.

Key Features:
    - Type-safe enum values with proper string/int representations
    - Comprehensive coverage of all chart configuration options
    - Clear documentation for each enum value
    - Compatibility with frontend JavaScript enum values
    - IntelliSense support for IDE autocompletion

Example Usage:
    ```python
    from lightweight_charts_core.type_definitions.enums import (
        ChartType,
        LineStyle,
        MarkerPosition,
        PriceScaleMode,
    )

    # Use enums for type-safe configuration
    chart_type = ChartType.CANDLESTICK
    line_style = LineStyle.SOLID
    marker_pos = MarkerPosition.ABOVE_BAR
    scale_mode = PriceScaleMode.NORMAL
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from enum import Enum, IntEnum


class ChartType(str, Enum):
    """Chart type enumeration.

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
    TREND_FILL = "trend_fill"
    SIGNAL = "signal"


class ColorType(str, Enum):
    """Color type enumeration.

    Defines how colors should be applied to chart elements.
    Controls whether colors are solid or use gradient effects.

    Attributes:
        SOLID: Solid color - uniform color across the element.
        VERTICAL_GRADIENT: Vertical gradient - color gradient from top to bottom.

    """

    SOLID = "solid"
    VERTICAL_GRADIENT = "gradient"


class LineStyle(IntEnum):
    """Line style enumeration.

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
    """Line type enumeration.

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
    """Crosshair mode enumeration.

    Defines how the crosshair behaves when hovering over the chart.
    Controls whether the crosshair snaps to data points or moves freely.

    Attributes:
        NORMAL: Normal mode - crosshair moves freely across the chart.
        MAGNET: Magnet mode - crosshair snaps to nearest data points.

    """

    NORMAL = 0
    MAGNET = 1


class LastPriceAnimationMode(IntEnum):
    """Last price animation mode enumeration.

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
    """Price scale mode enumeration.

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
    """Horizontal alignment enumeration.

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
    """Vertical alignment enumeration.

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
    """Tracking exit mode enumeration.

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
    """Tracking activation mode enumeration.

    Defines when the tracking mode should be activated.

    Attributes:
        ON_MOUSE_ENTER: Activate tracking mode when mouse enters chart.
        ON_TOUCH_START: Activate tracking mode when touch starts.

    """

    ON_MOUSE_ENTER = "ON_MOUSE_ENTER"
    ON_TOUCH_START = "ON_TOUCH_START"


class MarkerPosition(str, Enum):
    """Marker position enumeration for chart markers.

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
    """Marker shape enumeration for chart markers.

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
    """Annotation type enumeration.

    Defines the available types of annotations that can be placed on charts
    to mark important points, draw shapes, or add visual indicators.

    Attributes:
        TEXT: Text annotation - displays text at a specific location.
        ARROW: Arrow annotation - points to a specific location with an arrow.
        SHAPE: Shape annotation - draws geometric shapes (circles, squares, etc.).
        LINE: Line annotation - draws horizontal or vertical lines.
        RECTANGLE: Rectangle annotation - draws rectangular shapes.
        CIRCLE: Circle annotation - draws circular shapes.

    """

    TEXT = "text"
    ARROW = "arrow"
    SHAPE = "shape"
    LINE = "line"
    RECTANGLE = "rectangle"
    CIRCLE = "circle"


class AnnotationPosition(str, Enum):
    """Annotation position enumeration.

    Defines where annotations should be positioned relative to the data point
    or price level on the chart.

    Attributes:
        ABOVE: Position annotation above the data point.
        BELOW: Position annotation below the data point.
        INLINE: Position annotation inline with the data point.

    """

    ABOVE = "above"
    BELOW = "below"
    INLINE = "inline"


class ColumnNames(str, Enum):
    """Column name enumeration for DataFrame integration.

    Defines the standard column names used when converting pandas DataFrames
    to chart data. These names ensure consistent mapping between DataFrame
    columns and chart data fields.

    Attributes:
        TIME: Time or datetime column.
        OPEN: Open price column (for OHLC data).
        HIGH: High price column (for OHLC data).
        LOW: Low price column (for OHLC data).
        CLOSE: Close price column (for OHLC data).
        VOLUME: Volume column (for OHLCV data).
        DATETIME: Datetime column (alternative to TIME).
        VALUE: Value column (for single-value data like line charts).

    """

    TIME = "time"
    OPEN = "open"
    HIGH = "high"
    LOW = "low"
    CLOSE = "close"
    VOLUME = "volume"
    DATETIME = "datetime"
    VALUE = "value"


class TradeType(str, Enum):
    """Trade type enumeration.

    Defines the direction of a trade (long or short).
    Used for trade visualization and profit/loss calculations.

    Attributes:
        LONG: Long trade - profit when price goes up.
        SHORT: Short trade - profit when price goes down.

    """

    LONG = "long"
    SHORT = "short"


class TradeVisualization(str, Enum):
    """Trade visualization style enumeration.

    Defines how trades should be visualized on the chart.
    Multiple visualization styles can be combined to create
    comprehensive trade displays.

    Attributes:
        MARKERS: Display entry/exit markers only.
        RECTANGLES: Display rectangle spanning from entry to exit.
        BOTH: Display both markers and rectangles.
        LINES: Display connecting lines between entry and exit.
        ARROWS: Display directional arrows from entry to exit.
        ZONES: Display colored zones with transparency around trades.

    """

    MARKERS = "markers"  # Just entry/exit markers
    RECTANGLES = "rectangles"  # Rectangle from entry to exit
    BOTH = "both"  # Both markers and rectangles
    LINES = "lines"  # Lines connecting entry to exit
    ARROWS = "arrows"  # Arrows from entry to exit
    ZONES = "zones"  # Colored zones with transparency


class BackgroundStyle(str, Enum):
    """Background style enumeration.

    Defines how chart backgrounds should be styled.
    Controls whether backgrounds use solid colors or gradients.

    Attributes:
        SOLID: Solid background color.
        VERTICAL_GRADIENT: Vertical gradient background.

    """

    SOLID = "solid"
    VERTICAL_GRADIENT = "gradient"


class PriceLineSource(str, Enum):
    """Price line source enumeration.

    Defines the source to use for the value of the price line.
    Controls which data point determines the price line position.

    Attributes:
        LAST_BAR: Last bar - use the last visible bar's price.
        LAST_VISIBLE: Last visible - use the last visible data point's price.

    """

    LAST_BAR = "lastBar"
    LAST_VISIBLE = "lastVisible"


class TooltipType(str, Enum):
    """Tooltip type enumeration.

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
    """Tooltip position enumeration.

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
