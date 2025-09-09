"""
Streamlit Lightweight Charts Pro - Professional Financial Charting Library.

A comprehensive Python library for creating interactive financial charts in Streamlit
applications. Built on top of TradingView's Lightweight Charts library, this package
provides a fluent API for building sophisticated financial visualizations with
method chaining support.

The library offers enterprise-grade features for financial data visualization
including candlestick charts, line charts, area charts, volume charts, and more.
It supports advanced features like annotations, trade visualization, multi-pane
charts, and seamless pandas DataFrame integration.

Key Features:
    - Fluent API with method chaining for intuitive chart creation
    - Support for all major chart types (candlestick, line, area, bar, histogram)
    - Advanced annotation system with layers and styling
    - Trade visualization with buy/sell markers and PnL display
    - Multi-pane synchronized charts with overlay price scales
    - Responsive design with auto-sizing options
    - Comprehensive customization options for all chart elements
    - Seamless pandas DataFrame integration
    - Type-safe API with comprehensive type hints

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro import (
        Chart, LineSeries, create_text_annotation
    )
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create data
    data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]

    # Method 1: Direct chart creation
    chart = Chart(series=LineSeries(data, color="#ff0000"))
    chart.render(key="my_chart")

    # Method 2: Fluent API with method chaining
    chart = (Chart()
             .add_series(LineSeries(data, color="#ff0000"))
             .update_options(height=400)
             .add_annotation(create_text_annotation("2024-01-01", 100, "Start")))
    chart.render(key="my_chart")
    ```

For detailed documentation and examples, visit the project repository:
https://github.com/nandkapadia/streamlit-lightweight-charts-pro

Version: 0.1.0
Author: Nand Kapadia
License: MIT
"""

# TODO: Need to implement tooltips for the chart
# FIXME: The collapse code is not working as expected.
# TODO: Need to test and implement the RangeSwitcher
# FIXME: Currently the legend is not aware of the minimise button. So if the legend is
# positioned to top-right and minimise is also top-right then they will overlap.
# FIXME: The trendfill series is not working as expected.
# TODO: Need to test and fix the gradient ribbon series and gradient band seriess

# Import core components
# Import for development mode detection
import warnings
from pathlib import Path

from streamlit_lightweight_charts_pro.charts import (
    Chart,
    ChartManager,
)
from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.layout_options import (
    LayoutOptions,
    PaneHeightOptions,
)
from streamlit_lightweight_charts_pro.charts.options.trade_visualization_options import (
    TradeVisualizationOptions,
)
from streamlit_lightweight_charts_pro.charts.options.ui_options import LegendOptions
from streamlit_lightweight_charts_pro.charts.series import (
    AreaSeries,
    BandSeries,
    BarSeries,
    BaselineSeries,
    CandlestickSeries,
    GradientBandSeries,
    GradientRibbonSeries,
    HistogramSeries,
    LineSeries,
    RibbonSeries,
    Series,
    SignalSeries,
    TrendFillSeries,
)
from streamlit_lightweight_charts_pro.data import (
    Annotation,
    AreaData,
    BarData,
    BaselineData,
    CandlestickData,
    HistogramData,
    LineData,
    Marker,
    OhlcvData,
    SignalData,
    SingleValueData,
)
from streamlit_lightweight_charts_pro.data.annotation import (
    AnnotationLayer,
    AnnotationManager,
    create_arrow_annotation,
    create_shape_annotation,
    create_text_annotation,
)
from streamlit_lightweight_charts_pro.data.trade import (
    TradeData,
    TradeType,
)

# Import logging configuration
from streamlit_lightweight_charts_pro.logging_config import get_logger, setup_logging
from streamlit_lightweight_charts_pro.type_definitions import ChartType, LineStyle, MarkerPosition
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    ColumnNames,
    MarkerShape,
    TradeVisualization,
)

try:
    from importlib.metadata import distribution
except ImportError:
    # Fallback for Python < 3.8
    from importlib_metadata import distribution


# Version information
__version__ = "0.1.0"


# Check if frontend is built on import (for development mode)
def _check_frontend_build():
    """Check if frontend is built and warn if not (development mode only)."""
    # Only check in development mode (when package is installed with -e)
    try:
        # Use importlib.metadata instead of deprecated pkg_resources
        dist = distribution("streamlit_lightweight_charts_pro")
        if dist.locate_file("") and Path(dist.locate_file("")).samefile(
            Path(__file__).parent.parent
        ):
            # This is a development install, check frontend
            frontend_dir = Path(__file__).parent / "frontend"
            build_dir = frontend_dir / "build"

            if not build_dir.exists() or not (build_dir / "static").exists():
                warnings.warn(
                    "Frontend assets not found in development mode. "
                    "Run 'streamlit-lightweight-charts-pro build-frontend' to build them.",
                    UserWarning,
                )
    except (ImportError, OSError):
        # Not a development install or importlib.metadata not available, skip check
        pass


# Check frontend build on import (development mode only)
_check_frontend_build()

# Export all public components
__all__ = [
    # Logging
    "get_logger",
    "setup_logging",
    # Core chart classes
    "Chart",
    "ChartManager",
    # Series classes
    "AreaSeries",
    "BarSeries",
    "BaselineSeries",
    "CandlestickSeries",
    "HistogramSeries",
    "LineSeries",
    "Series",
    "SignalSeries",
    "GradientRibbonSeries",
    "TrendFillSeries",
    "RibbonSeries",
    "GradientBandSeries",
    "BandSeries",
    # Options
    "ChartOptions",
    "LayoutOptions",
    "PaneHeightOptions",
    "LegendOptions",
    # Data models
    "Annotation",
    "AreaData",
    "BarData",
    "BaselineData",
    "CandlestickData",
    "HistogramData",
    "LineData",
    "Marker",
    "OhlcvData",
    "SingleValueData",
    "SignalData",
    # Annotation system
    "AnnotationManager",
    "AnnotationLayer",
    "create_text_annotation",
    "create_arrow_annotation",
    "create_shape_annotation",
    # Trade visualization
    "TradeData",
    "TradeType",
    "TradeVisualizationOptions",
    "TradeVisualization",
    # Type definitions
    "ChartType",
    "LineStyle",
    "MarkerShape",
    "MarkerPosition",
    "ColumnNames",
    # Version
    "__version__",
]
