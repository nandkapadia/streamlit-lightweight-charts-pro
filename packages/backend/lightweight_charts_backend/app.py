"""FastAPI application factory for Lightweight Charts Backend."""

from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from lightweight_charts_backend.api import chart_router
from lightweight_charts_backend.services import DatafeedService
from lightweight_charts_backend.websocket import websocket_router


def create_app(
    datafeed: Optional[DatafeedService] = None,
    cors_origins: list[str] | None = None,
    title: str = "Lightweight Charts API",
    version: str = "0.1.0",
) -> FastAPI:
    """Create FastAPI application with chart endpoints.

    Args:
        datafeed: Optional DatafeedService instance. Creates default if not provided.
        cors_origins: List of allowed CORS origins. Defaults to allowing all.
        title: API title for documentation.
        version: API version.

    Returns:
        Configured FastAPI application.
    """
    app = FastAPI(
        title=title,
        version=version,
        description="REST API and WebSocket backend for TradingView Lightweight Charts",
    )

    # Configure CORS
    if cors_origins is None:
        cors_origins = ["http://localhost:3000", "http://localhost:8501"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Set up datafeed service
    if datafeed is None:
        datafeed = DatafeedService()

    app.state.datafeed = datafeed

    # Include routers
    app.include_router(chart_router, prefix="/api/charts", tags=["charts"])
    app.include_router(websocket_router, prefix="/ws", tags=["websocket"])

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "version": version}

    return app
