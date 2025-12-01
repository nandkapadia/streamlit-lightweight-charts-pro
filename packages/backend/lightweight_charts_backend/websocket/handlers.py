"""WebSocket handlers for real-time chart updates."""

import asyncio
import json
import logging
from typing import TYPE_CHECKING, Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

if TYPE_CHECKING:
    from lightweight_charts_backend.services import DatafeedService

router = APIRouter()
logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for chart updates.

    Thread-safe connection management using asyncio.Lock to prevent
    race conditions during concurrent connect/disconnect operations.
    """

    def __init__(self):
        """Initialize connection manager."""
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, chart_id: str, websocket: WebSocket) -> None:
        """Accept and track a WebSocket connection.

        Args:
            chart_id: Chart identifier.
            websocket: WebSocket connection.
        """
        await websocket.accept()
        async with self._lock:
            if chart_id not in self._connections:
                self._connections[chart_id] = set()
            self._connections[chart_id].add(websocket)

    async def disconnect(self, chart_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket connection.

        Args:
            chart_id: Chart identifier.
            websocket: WebSocket connection.
        """
        async with self._lock:
            if chart_id in self._connections:
                self._connections[chart_id].discard(websocket)
                if not self._connections[chart_id]:
                    del self._connections[chart_id]

    async def broadcast(self, chart_id: str, message: dict) -> None:
        """Broadcast message to all connections for a chart.

        Args:
            chart_id: Chart identifier.
            message: Message to broadcast.
        """
        async with self._lock:
            if chart_id not in self._connections:
                return
            # Copy set to avoid modification during iteration
            connections = self._connections[chart_id].copy()

        disconnected = set()
        for websocket in connections:
            try:
                await websocket.send_json(message)
            except (WebSocketDisconnect, ConnectionError, RuntimeError) as e:
                # Expected disconnection errors
                logger.debug("Client disconnected during broadcast: %s", e)
                disconnected.add(websocket)
            except Exception as e:
                # Unexpected errors - log but continue
                logger.warning("Unexpected error broadcasting to client: %s", e)
                disconnected.add(websocket)

        # Clean up disconnected clients
        if disconnected:
            async with self._lock:
                for websocket in disconnected:
                    if chart_id in self._connections:
                        self._connections[chart_id].discard(websocket)


manager = ConnectionManager()


@router.websocket("/charts/{chart_id}")
async def chart_websocket(websocket: WebSocket, chart_id: str):
    """WebSocket endpoint for real-time chart updates.

    Supports the following message types:
    - subscribe: Subscribe to chart updates
    - request_history: Request historical data
    - update_data: Receive real-time data updates

    Args:
        websocket: WebSocket connection.
        chart_id: Chart identifier.
    """
    await manager.connect(chart_id, websocket)

    # Safely access datafeed service from app state
    try:
        datafeed: DatafeedService = websocket.app.state.datafeed
    except AttributeError:
        logger.error("DatafeedService not initialized in app.state")
        await websocket.close(code=1011, reason="Server configuration error")
        await manager.disconnect(chart_id, websocket)
        return

    # Subscribe to datafeed updates
    async def on_update(event_type: str, data: dict):
        await manager.broadcast(
            chart_id,
            {
                "type": event_type,
                "chartId": chart_id,
                **data,
            },
        )

    unsubscribe = await datafeed.subscribe(chart_id, on_update)

    try:
        # Send initial connection acknowledgment
        await websocket.send_json(
            {
                "type": "connected",
                "chartId": chart_id,
            }
        )

        while True:
            # Receive and process messages
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
            except json.JSONDecodeError as e:
                await websocket.send_json(
                    {
                        "type": "error",
                        "error": f"Invalid JSON: {str(e)}",
                    }
                )
                continue

            msg_type = message.get("type")

            if msg_type == "request_history":
                # Handle history request
                pane_id = message.get("paneId", 0)
                series_id = message.get("seriesId")
                before_time = message.get("beforeTime")
                count = message.get("count", 500)

                if series_id and before_time:
                    result = await datafeed.get_history(
                        chart_id=chart_id,
                        pane_id=pane_id,
                        series_id=series_id,
                        before_time=before_time,
                        count=count,
                    )

                    await websocket.send_json(
                        {
                            "type": "history_response",
                            "chartId": chart_id,
                            "paneId": pane_id,
                            "seriesId": series_id,
                            **result,
                        }
                    )

            elif msg_type == "get_initial_data":
                # Handle initial data request
                pane_id = message.get("paneId")
                series_id = message.get("seriesId")

                result = await datafeed.get_initial_data(
                    chart_id=chart_id,
                    pane_id=pane_id,
                    series_id=series_id,
                )

                await websocket.send_json(
                    {
                        "type": "initial_data_response",
                        "chartId": chart_id,
                        **result,
                    }
                )

            elif msg_type == "ping":
                # Handle ping for connection health
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.debug("WebSocket disconnected for chart %s", chart_id)
    finally:
        await manager.disconnect(chart_id, websocket)
        await unsubscribe()
