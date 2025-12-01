"""Tests for WebSocket handlers."""

import json

import pytest
from fastapi.testclient import TestClient

from lightweight_charts_backend.app import create_app
from lightweight_charts_backend.websocket.handlers import ConnectionManager


class TestConnectionManager:
    """Tests for ConnectionManager class."""

    def test_creation(self):
        """Test basic creation."""
        manager = ConnectionManager()
        assert manager._connections == {}

    @pytest.mark.asyncio
    async def test_connect_disconnect(self):
        """Test connect and disconnect flow."""
        manager = ConnectionManager()

        # Mock websocket
        class MockWebSocket:
            accepted = False

            async def accept(self):
                self.accepted = True

        ws = MockWebSocket()
        await manager.connect("chart1", ws)
        assert ws.accepted
        assert "chart1" in manager._connections
        assert ws in manager._connections["chart1"]

        manager.disconnect("chart1", ws)
        assert "chart1" not in manager._connections

    @pytest.mark.asyncio
    async def test_multiple_connections_same_chart(self):
        """Test multiple connections to the same chart."""
        manager = ConnectionManager()

        class MockWebSocket:
            async def accept(self):
                pass

        ws1 = MockWebSocket()
        ws2 = MockWebSocket()

        await manager.connect("chart1", ws1)
        await manager.connect("chart1", ws2)

        assert len(manager._connections["chart1"]) == 2

        manager.disconnect("chart1", ws1)
        assert len(manager._connections["chart1"]) == 1

        manager.disconnect("chart1", ws2)
        assert "chart1" not in manager._connections

    @pytest.mark.asyncio
    async def test_broadcast(self):
        """Test broadcasting to all connections."""
        manager = ConnectionManager()

        received_messages = []

        class MockWebSocket:
            async def accept(self):
                pass

            async def send_json(self, message):
                received_messages.append(message)

        ws1 = MockWebSocket()
        ws2 = MockWebSocket()

        await manager.connect("chart1", ws1)
        await manager.connect("chart1", ws2)

        await manager.broadcast("chart1", {"type": "test", "data": "hello"})

        assert len(received_messages) == 2
        assert all(msg["type"] == "test" for msg in received_messages)

    @pytest.mark.asyncio
    async def test_broadcast_removes_disconnected(self):
        """Test that broadcast removes disconnected clients."""
        manager = ConnectionManager()

        class GoodWebSocket:
            async def accept(self):
                pass

            async def send_json(self, message):
                pass

        class BadWebSocket:
            async def accept(self):
                pass

            async def send_json(self, message):
                raise Exception("Connection closed")

        good_ws = GoodWebSocket()
        bad_ws = BadWebSocket()

        await manager.connect("chart1", good_ws)
        await manager.connect("chart1", bad_ws)

        assert len(manager._connections["chart1"]) == 2

        await manager.broadcast("chart1", {"type": "test"})

        # Bad websocket should be removed
        assert len(manager._connections["chart1"]) == 1
        assert good_ws in manager._connections["chart1"]
        assert bad_ws not in manager._connections["chart1"]

    @pytest.mark.asyncio
    async def test_broadcast_no_connections(self):
        """Test broadcasting when no connections exist."""
        manager = ConnectionManager()
        # Should not raise
        await manager.broadcast("chart1", {"type": "test"})


class TestWebSocketEndpoint:
    """Tests for WebSocket endpoint."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        app = create_app()
        return TestClient(app)

    def test_websocket_connect(self, client):
        """Test WebSocket connection."""
        with client.websocket_connect("/ws/charts/test-chart") as websocket:
            # Should receive connection acknowledgment
            data = websocket.receive_json()
            assert data["type"] == "connected"
            assert data["chartId"] == "test-chart"

    def test_websocket_ping_pong(self, client):
        """Test ping/pong for connection health."""
        with client.websocket_connect("/ws/charts/test-chart") as websocket:
            # Skip connection message
            websocket.receive_json()

            # Send ping
            websocket.send_json({"type": "ping"})

            # Should receive pong
            data = websocket.receive_json()
            assert data["type"] == "pong"

    def test_websocket_get_initial_data(self, client):
        """Test requesting initial data via WebSocket."""
        # First, set up some data via REST API
        client.post("/api/charts/test-chart")
        client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [{"time": i, "value": i * 100} for i in range(10)],
            },
        )

        # Connect via WebSocket
        with client.websocket_connect("/ws/charts/test-chart") as websocket:
            # Skip connection message
            websocket.receive_json()

            # Request initial data
            websocket.send_json({
                "type": "get_initial_data",
                "paneId": 0,
                "seriesId": "line1",
            })

            # Should receive initial data response
            data = websocket.receive_json()
            assert data["type"] == "initial_data_response"
            assert data["chartId"] == "test-chart"

    def test_websocket_request_history(self, client):
        """Test requesting history via WebSocket."""
        # Set up data
        client.post("/api/charts/test-chart")
        client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [{"time": i, "value": i * 100} for i in range(100)],
            },
        )

        with client.websocket_connect("/ws/charts/test-chart") as websocket:
            # Skip connection message
            websocket.receive_json()

            # Request history
            websocket.send_json({
                "type": "request_history",
                "paneId": 0,
                "seriesId": "line1",
                "beforeTime": 50,
                "count": 20,
            })

            # Should receive history response
            data = websocket.receive_json()
            assert data["type"] == "history_response"
            assert data["chartId"] == "test-chart"
            assert data["seriesId"] == "line1"

    def test_multiple_websocket_connections(self, client):
        """Test multiple WebSocket connections to same chart."""
        with client.websocket_connect("/ws/charts/test-chart") as ws1:
            ws1.receive_json()  # connection ack

            with client.websocket_connect("/ws/charts/test-chart") as ws2:
                ws2.receive_json()  # connection ack

                # Both should be able to ping
                ws1.send_json({"type": "ping"})
                ws2.send_json({"type": "ping"})

                assert ws1.receive_json()["type"] == "pong"
                assert ws2.receive_json()["type"] == "pong"
