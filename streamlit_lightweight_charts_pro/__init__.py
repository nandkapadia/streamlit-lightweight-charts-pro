"""Streamlit Lightweight Charts Pro - Professional Financial Charting Library.

A comprehensive Python library for creating interactive financial charts in Streamlit
applications. Built on top of TradingView's Lightweight Charts library, this package
provides a fluent API for building sophisticated financial visualizations with
method chaining support.

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
from streamlit_lightweight_charts_pro.data.trade import TradeData, TradeType

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
    """Check if frontend is built and warn if not (development mode only).

    This function verifies that the required frontend assets exist for
    the package to work correctly. It's only active in development mode
    where the package is installed with the `-e` flag used.

    Returns:
        None: This function has no return value, it warns if frontend is missing.
    """
    # Only check in development mode (when package is installed with -e)
    try:
        # Use importlib.metadata instead of deprecated pkg_resources
        # This ensures compatibility with modern Python versions
        dist = distribution("streamlit_lightweight_charts_pro")

        # Verify this is a development install by checking file paths
        # Compare the file location against the current module location
        if dist.locate_file("") and Path(dist.locate_file("")).samefile(
            Path(__file__).parent.parent,
        ):
            # Check for frontend build assets in development mode
            frontend_dir = Path(__file__).parent / "frontend"
            build_dir = frontend_dir / "build"

            # Test existence of required frontend build artifacts
            if not build_dir.exists() or not (build_dir / "static").exists():
                warnings.warn(
                    "Frontend assets not found in development mode. "
                    "Run 'streamlit-lightweight-charts-pro build-frontend' to build them.",
                    UserWarning,
                    stacklevel=2,
                )
    except (ImportError, OSError):
        # Skip check if importlib.metadata is not available or
        # if not in development mode (close the security wrapper)
        pass


# Check frontend build on import (development mode only)
_check_frontend_build()

# Export all public components
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
