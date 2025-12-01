"""Tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
from lightweight_charts_backend.app import create_app


@pytest.fixture
def client():
    """Create a test client for the API."""
    app = create_app()
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, client):
        """Test the health check endpoint returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert "version" in response.json()


class TestChartEndpoints:
    """Tests for chart API endpoints."""

    def test_create_chart(self, client):
        """Test creating a new chart."""
        response = client.post("/api/charts/test-chart")
        assert response.status_code == 200
        data = response.json()
        assert data["chartId"] == "test-chart"

    def test_create_chart_with_options(self, client):
        """Test creating a chart with options."""
        response = client.post(
            "/api/charts/test-chart",
            params={"options": '{"width": 800}'},
        )
        assert response.status_code == 200

    def test_get_chart_not_found(self, client):
        """Test getting a non-existent chart returns 404."""
        response = client.get("/api/charts/missing-chart")
        assert response.status_code == 404

    def test_get_chart_after_create(self, client):
        """Test getting a chart after creating it."""
        # Create chart first
        client.post("/api/charts/test-chart")

        # Then get it
        response = client.get("/api/charts/test-chart")
        assert response.status_code == 200

    def test_set_series_data(self, client):
        """Test setting series data."""
        # Create chart
        client.post("/api/charts/test-chart")

        # Set series data
        response = client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [
                    {"time": 1, "value": 100},
                    {"time": 2, "value": 200},
                ],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["seriesId"] == "line1"
        assert data["count"] == 2

    def test_get_series_data(self, client):
        """Test getting series data."""
        # Create chart and add data
        client.post("/api/charts/test-chart")
        client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [{"time": i, "value": i * 100} for i in range(10)],
            },
        )

        # Get series data
        response = client.get("/api/charts/test-chart/data/0/line1")
        assert response.status_code == 200
        data = response.json()
        assert data["chunked"] is False
        assert data["totalCount"] == 10

    def test_get_history(self, client):
        """Test getting historical data."""
        # Create chart with large dataset
        client.post("/api/charts/test-chart")
        client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [{"time": i, "value": i * 100} for i in range(1000)],
            },
        )

        # Get history
        response = client.get(
            "/api/charts/test-chart/history/0/line1",
            params={"before_time": 500, "count": 100},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 100
        assert data["hasMoreBefore"] is True

    def test_get_history_batch(self, client):
        """Test batch history request."""
        # Create chart with data
        client.post("/api/charts/test-chart")
        client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [{"time": i, "value": i * 100} for i in range(100)],
            },
        )

        # Batch history request
        response = client.post(
            "/api/charts/test-chart/history",
            json={
                "pane_id": 0,
                "series_id": "line1",
                "before_time": 50,
                "count": 20,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data


class TestChartDataChunking:
    """Tests for smart chunking behavior."""

    def test_small_dataset_not_chunked(self, client):
        """Test that small datasets are not chunked."""
        client.post("/api/charts/test-chart")
        client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [{"time": i, "value": i} for i in range(100)],
            },
        )

        response = client.get("/api/charts/test-chart/data/0/line1")
        data = response.json()
        assert data["chunked"] is False
        assert len(data["data"]) == 100

    def test_large_dataset_chunked(self, client):
        """Test that large datasets are chunked."""
        client.post("/api/charts/test-chart")
        client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [{"time": i, "value": i} for i in range(1000)],
            },
        )

        response = client.get("/api/charts/test-chart/data/0/line1")
        data = response.json()
        assert data["chunked"] is True
        assert len(data["data"]) == 500
        assert data["totalCount"] == 1000
        assert data["hasMoreBefore"] is True

    def test_pagination_through_chunks(self, client):
        """Test paginating through chunks of data."""
        client.post("/api/charts/test-chart")
        client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": [{"time": i, "value": i * 100} for i in range(1000)],
            },
        )

        # Get initial chunk
        response = client.get("/api/charts/test-chart/data/0/line1")
        data = response.json()
        first_time = data["data"][0]["time"]

        # Get older data
        response = client.get(
            "/api/charts/test-chart/history/0/line1",
            params={"before_time": first_time, "count": 500},
        )
        data = response.json()
        assert len(data["data"]) == 500
        assert data["data"][-1]["time"] < first_time


class TestErrorHandling:
    """Tests for error handling and validation."""

    def test_get_series_from_nonexistent_chart(self, client):
        """Test getting series from non-existent chart returns 404."""
        response = client.get("/api/charts/nonexistent/data/0/line1")
        assert response.status_code == 404

    def test_get_series_nonexistent_series(self, client):
        """Test getting non-existent series returns 404."""
        client.post("/api/charts/test-chart")
        response = client.get("/api/charts/test-chart/data/0/nonexistent")
        assert response.status_code == 404

    def test_set_series_invalid_data_format(self, client):
        """Test setting series with invalid data format."""
        client.post("/api/charts/test-chart")
        response = client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                "series_type": "line",
                "data": "invalid",  # Should be a list
            },
        )
        assert response.status_code == 422  # Validation error

    def test_set_series_missing_required_fields(self, client):
        """Test setting series with missing required fields."""
        client.post("/api/charts/test-chart")
        response = client.post(
            "/api/charts/test-chart/data/line1",
            json={
                "pane_id": 0,
                # Missing series_type and data
            },
        )
        assert response.status_code == 422

    def test_get_history_invalid_params(self, client):
        """Test history with invalid parameters."""
        client.post("/api/charts/test-chart")
        response = client.get(
            "/api/charts/test-chart/history/0/line1",
            params={"before_time": "invalid", "count": 100},
        )
        assert response.status_code == 422

    def test_batch_history_empty_request(self, client):
        """Test batch history with empty request body."""
        client.post("/api/charts/test-chart")
        response = client.post(
            "/api/charts/test-chart/history",
            json={},  # Empty request
        )
        assert response.status_code == 422


class TestE2EWorkflows:
    """End-to-end workflow tests."""

    def test_full_chart_lifecycle(self, client):
        """Test complete chart lifecycle: create -> add data -> query -> paginate."""
        # 1. Create chart
        response = client.post("/api/charts/workflow-chart")
        assert response.status_code == 200
        assert response.json()["chartId"] == "workflow-chart"

        # 2. Add multiple series
        for i in range(3):
            response = client.post(
                f"/api/charts/workflow-chart/data/series{i}",
                json={
                    "pane_id": i % 2,  # Spread across panes
                    "series_type": "line",
                    "data": [{"time": t, "value": t * (i + 1) * 10} for t in range(600)],
                },
            )
            assert response.status_code == 200
            assert response.json()["count"] == 600

        # 3. Get full chart data
        response = client.get("/api/charts/workflow-chart")
        assert response.status_code == 200
        chart_data = response.json()
        assert len(chart_data["panes"]) >= 1

        # 4. Query specific series with chunking
        response = client.get("/api/charts/workflow-chart/data/0/series0")
        assert response.status_code == 200
        data = response.json()
        assert data["chunked"] is True
        assert data["totalCount"] == 600

        # 5. Paginate through history
        first_time = data["data"][0]["time"]
        response = client.get(
            "/api/charts/workflow-chart/history/0/series0",
            params={"before_time": first_time, "count": 100},
        )
        assert response.status_code == 200
        history_data = response.json()
        assert len(history_data["data"]) == 100
        assert all(d["time"] < first_time for d in history_data["data"])

    def test_multi_pane_chart(self, client):
        """Test chart with multiple panes (main + indicators)."""
        client.post("/api/charts/multi-pane")

        # Main price series (pane 0)
        client.post(
            "/api/charts/multi-pane/data/price",
            json={
                "pane_id": 0,
                "series_type": "candlestick",
                "data": [
                    {"time": i, "open": 100 + i, "high": 105 + i, "low": 95 + i, "close": 102 + i}
                    for i in range(100)
                ],
            },
        )

        # Volume series (pane 1)
        client.post(
            "/api/charts/multi-pane/data/volume",
            json={
                "pane_id": 1,
                "series_type": "histogram",
                "data": [{"time": i, "value": 1000 + i * 10} for i in range(100)],
            },
        )

        # RSI indicator (pane 2)
        client.post(
            "/api/charts/multi-pane/data/rsi",
            json={
                "pane_id": 2,
                "series_type": "line",
                "data": [{"time": i, "value": 30 + (i % 40)} for i in range(100)],
            },
        )

        # Verify all panes have data
        response = client.get("/api/charts/multi-pane")
        assert response.status_code == 200
        chart_data = response.json()
        assert len(chart_data["panes"]) == 3

    def test_concurrent_chart_access(self, client):
        """Test that multiple charts can coexist."""
        charts = ["chart-a", "chart-b", "chart-c"]

        # Create all charts
        for chart_id in charts:
            response = client.post(f"/api/charts/{chart_id}")
            assert response.status_code == 200

        # Add data to each
        for i, chart_id in enumerate(charts):
            client.post(
                f"/api/charts/{chart_id}/data/line",
                json={
                    "pane_id": 0,
                    "series_type": "line",
                    "data": [{"time": t, "value": t * (i + 1)} for t in range(50)],
                },
            )

        # Verify each chart has correct data
        for i, chart_id in enumerate(charts):
            response = client.get(f"/api/charts/{chart_id}/data/0/line")
            assert response.status_code == 200
            data = response.json()
            assert data["totalCount"] == 50
            # Verify data values are chart-specific
            assert data["data"][10]["value"] == 10 * (i + 1)
