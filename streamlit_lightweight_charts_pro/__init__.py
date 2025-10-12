"""Streamlit Lightweight Charts Pro - Professional Financial Charting Library.

A comprehensive Python library for creating interactive financial charts in Streamlit
applications. Built on top of TradingView's Lightweight Charts library, this package
provides a fluent API for building sophisticated financial visualizations with
method chaining support.

Key Features:
    - Multiple chart types: Line, Candlestick, Area, Bar, Histogram, Baseline
    - Advanced series: Band, Ribbon, Gradient Ribbon, Trend Fill, Signal
    - Comprehensive annotation system with text, arrows, and shapes
    - Trade visualization with buy/sell markers and trade lines
    - Multi-pane chart support with synchronized time scales
    - Pandas DataFrame integration for easy data import
    - Fluent API design for intuitive method chaining
    - Type-safe data models with validation

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro import Chart, LineSeries, create_text_annotation
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create data
    data = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]

    # Method 1: Direct chart creation
    chart = Chart(series=LineSeries(data, color="#ff0000"))
    chart.render(key="my_chart")

    # Method 2: Fluent API with method chaining
    chart = (
        Chart()
        .add_series(LineSeries(data, color="#ff0000"))
        .update_options(height=400)
        .add_annotation(create_text_annotation("2024-01-01", 100, "Start"))
    )
    chart.render(key="my_chart")
    ```

For detailed documentation and examples, visit:
https://github.com/nandkapadia/streamlit-lightweight-charts-pro
"""

# Standard Imports
import warnings
from pathlib import Path

# Third Party Imports
# (None in this module)
# Local Imports
from streamlit_lightweight_charts_pro.charts import Chart, ChartManager
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
from streamlit_lightweight_charts_pro.data.trade import TradeData

# Import logging configuration
from streamlit_lightweight_charts_pro.logging_config import get_logger, setup_logging
from streamlit_lightweight_charts_pro.type_definitions import ChartType, LineStyle, MarkerPosition
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    ColumnNames,
    MarkerShape,
    TradeType,
    TradeVisualization,
)

# Import distribution function for package metadata access
# Use modern importlib.metadata for Python 3.8+ with fallback for older versions
try:
    from importlib.metadata import distribution
except ImportError:
    # Fallback for Python < 3.8 - use backported importlib_metadata
    # This ensures compatibility with older Python versions that don't have
    # importlib.metadata in the standard library
    from importlib_metadata import distribution


# Version information for the package
# This version number is used for package distribution and compatibility checks
__version__ = "0.1.4"


# Check if frontend is built on import (for development mode)
def _check_frontend_build():
    """Check if frontend is built and warn if not (development mode only).

    This function verifies that the required frontend assets exist for
    the package to work correctly. It's only active in development mode
    where the package is installed with the `-e` flag used.

    The function performs the following checks:
        1. Determines if the package is installed in development mode
        2. Verifies the package location matches the current module location
        3. Checks for the existence of frontend build artifacts
        4. Issues a warning if frontend assets are missing

    Returns:
        None: This function has no return value, it warns if frontend is missing.

    Raises:
        ImportError: If importlib.metadata is not available.
        OSError: If file system operations fail during path checking.
    """
    # Only check in development mode (when package is installed with -e)
    try:
        # Use importlib.metadata instead of deprecated pkg_resources
        # This ensures compatibility with modern Python versions and provides
        # better performance and reliability for package metadata access
        dist = distribution("streamlit_lightweight_charts_pro")

        # Verify this is a development install by checking file paths
        # Compare the file location against the current module location
        # This ensures we only check frontend assets in development mode
        if dist.locate_file("") and Path(dist.locate_file("")).samefile(
            Path(__file__).parent.parent,
        ):
            # Check for frontend build assets in development mode
            # The frontend directory contains React/TypeScript source code
            frontend_dir = Path(__file__).parent / "frontend"
            # The build directory contains compiled frontend assets
            build_dir = frontend_dir / "build"

            # Test existence of required frontend build artifacts
            # Check if build directory exists and contains static assets
            if not build_dir.exists() or not (build_dir / "static").exists():
                # Issue warning with clear instructions for fixing the issue
                warnings.warn(
                    "Frontend assets not found in development mode. "
                    "Run 'streamlit-lightweight-charts-pro build-frontend' to build them.",
                    UserWarning,
                    stacklevel=2,
                )
    except (ImportError, OSError):
        # Skip check if importlib.metadata is not available or
        # if not in development mode (close the security wrapper)
        # This prevents errors in production environments where the check isn't needed
        pass


# Check frontend build on import (development mode only)
# This ensures developers are notified if frontend assets are missing
_check_frontend_build()

# Export all public components for external use
# This list defines what is available when importing from the main package
# Organized by category for better maintainability and documentation
__all__ = [
    # Data models
    "Annotation",
    "AnnotationLayer",
    # Annotation system
    "AnnotationManager",
    "AreaData",
    # Series classes
    "AreaSeries",
    "BandSeries",
    "BarData",
    "BarSeries",
    "BaselineData",
    "BaselineSeries",
    "CandlestickData",
    "CandlestickSeries",
    # Core chart classes
    "Chart",
    "ChartManager",
    # Options
    "ChartOptions",
    # Type definitions
    "ChartType",
    "ColumnNames",
    "GradientRibbonSeries",
    "HistogramData",
    "HistogramSeries",
    "LayoutOptions",
    "LegendOptions",
    "LineData",
    "LineSeries",
    "LineStyle",
    "Marker",
    "MarkerPosition",
    "MarkerShape",
    "OhlcvData",
    "PaneHeightOptions",
    "RibbonSeries",
    "Series",
    "SignalData",
    "SignalSeries",
    "SingleValueData",
    # Trade visualization
    "TradeData",
    "TradeType",
    "TradeVisualization",
    "TradeVisualizationOptions",
    "TrendFillSeries",
    # Version
    "__version__",
    "create_arrow_annotation",
    "create_shape_annotation",
    "create_text_annotation",
    # Logging
    "get_logger",
    "setup_logging",
]
