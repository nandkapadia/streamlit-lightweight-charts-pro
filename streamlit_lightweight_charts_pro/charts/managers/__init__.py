"""Manager classes for Chart component.

This module provides specialized manager classes that handle different
aspects of chart functionality, promoting separation of concerns and
maintainability.

Core managers (framework-agnostic) are imported from lightweight_charts_core.
Streamlit-specific managers are defined in this package.
"""

# Core managers (re-exported from core)
from lightweight_charts_core.charts.managers import (
    PriceScaleManager,
    SeriesManager,
    TradeManager,
)

# Streamlit-specific managers
from streamlit_lightweight_charts_pro.charts.managers.chart_renderer import ChartRenderer
from streamlit_lightweight_charts_pro.charts.managers.session_state_manager import (
    SessionStateManager,
)

__all__ = [
    # Core managers
    "PriceScaleManager",
    "SeriesManager",
    "TradeManager",
    # Streamlit-specific managers
    "ChartRenderer",
    "SessionStateManager",
]
