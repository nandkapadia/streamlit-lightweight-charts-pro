"""Lightweight Charts Backend - FastAPI backend for TradingView Lightweight Charts.

This package provides the REST API and WebSocket support for chart data management
with infinite history loading capabilities.
"""

__version__ = "0.1.0"

from lightweight_charts_backend.app import create_app
from lightweight_charts_backend.services import DatafeedService

__all__ = [
    "__version__",
    "DatafeedService",
    "create_app",
]
