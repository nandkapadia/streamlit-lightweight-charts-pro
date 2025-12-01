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
        """Test the health check endpoint returns OK."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


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
