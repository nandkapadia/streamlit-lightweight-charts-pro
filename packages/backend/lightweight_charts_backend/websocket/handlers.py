"""WebSocket handlers for real-time chart updates."""

import asyncio
import json
import logging
import re
from typing import TYPE_CHECKING, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

if TYPE_CHECKING:
    from lightweight_charts_backend.services import DatafeedService

router = APIRouter()
logger = logging.getLogger(__name__)

# Validation constants
MAX_ID_LENGTH = 128
ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-\.]+$")
MAX_HISTORY_COUNT = 10000


def validate_identifier(value: Optional[str], field_name: str) -> Optional[str]:
    """Validate an identifier (chart_id, series_id).

    Args:
        value: The identifier to validate.
        field_name: Name of the field for error messages.

    Returns:
        The validated identifier or None if value is None.

    Raises:
        ValueError: If validation fails.
    """
    if value is None:
        return None

    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a string")

    if not value:
        raise ValueError(f"{field_name} cannot be empty")

    if len(value) > MAX_ID_LENGTH:
        raise ValueError(f"{field_name} cannot exceed {MAX_ID_LENGTH} characters")

    if not ID_PATTERN.match(value):
        raise ValueError(
            f"{field_name} contains invalid characters. "
            "Only alphanumeric, underscore, hyphen, and dot allowed."
        )

    # Prevent path traversal
    if ".." in value or value.startswith(("/", "\\")):
        raise ValueError(f"Invalid {field_name} format")

    return value


def validate_pane_id(value: Optional[int]) -> int:
    """Validate pane_id.

    Args:
        value: The pane_id to validate.

    Returns:
        The validated pane_id (default 0).

    Raises:
        ValueError: If validation fails.
    """
    if value is None:
        return 0

    if not isinstance(value, int):
        raise ValueError("paneId must be an integer")

    if value < 0 or value > 100:
        raise ValueError("paneId must be between 0 and 100")

    return value


def validate_count(value: Optional[int]) -> int:
    """Validate count parameter.

    Args:
        value: The count to validate.

    Returns:
        The validated count (default 500).

    Raises:
        ValueError: If validation fails.
    """
    if value is None:
        return 500

    if not isinstance(value, int):
        raise ValueError("count must be an integer")

    if value <= 0 or value > MAX_HISTORY_COUNT:
        raise ValueError(f"count must be between 1 and {MAX_HISTORY_COUNT}")

    return value


def validate_before_time(value: Optional[int]) -> Optional[int]:
    """Validate before_time parameter.

    Args:
        value: The before_time to validate.

    Returns:
        The validated before_time.

    Raises:
        ValueError: If validation fails.
    """
    if value is None:
        return None

    if not isinstance(value, int):
        raise ValueError("beforeTime must be an integer")

    if value < 0:
        raise ValueError("beforeTime must be >= 0")

    return value


class ConnectionManager:
    """Manages WebSocket connections for chart updates.

    Thread-safe connection management using asyncio.Lock to prevent
    race conditions during concurrent connect/disconnect operations.
    """

    def __init__(self):
        """Initialize connection manager."""
        self._connections: dict[str, set[WebSocket]] = {}
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
    # Validate chart_id before accepting connection
    try:
        chart_id = validate_identifier(chart_id, "chart_id") or ""
        if not chart_id:
            await websocket.close(code=1008, reason="Invalid chart_id")
            return
    except ValueError as e:
        await websocket.accept()
        await websocket.close(code=1008, reason=str(e))
        return

    await manager.connect(chart_id, websocket)

    # Safely access datafeed service from app state
    try:
        datafeed: DatafeedService = websocket.app.state.datafeed
    except AttributeError:
        logger.exception("DatafeedService not initialized in app.state")
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
                        "error": f"Invalid JSON: {e!s}",
                    }
                )
                continue

            msg_type = message.get("type")

            if msg_type == "request_history":
                # Handle history request with validation
                try:
                    pane_id = validate_pane_id(message.get("paneId"))
                    series_id = validate_identifier(message.get("seriesId"), "seriesId")
                    before_time = validate_before_time(message.get("beforeTime"))
                    count = validate_count(message.get("count"))
                except ValueError as e:
                    await websocket.send_json({"type": "error", "error": str(e)})
                    continue

                if series_id and before_time is not None:
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
                else:
                    await websocket.send_json(
                        {"type": "error", "error": "seriesId and beforeTime are required"}
                    )

            elif msg_type == "get_initial_data":
                # Handle initial data request with validation
                try:
                    pane_id = validate_pane_id(message.get("paneId"))
                    series_id = validate_identifier(message.get("seriesId"), "seriesId")
                except ValueError as e:
                    await websocket.send_json({"type": "error", "error": str(e)})
                    continue

                result = await datafeed.get_initial_data(
                    chart_id=chart_id,
                    pane_id=pane_id if pane_id else None,
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
