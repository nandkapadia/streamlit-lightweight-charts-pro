"""Vue3 Backend Integration Test Harness.

Visual test for the FastAPI backend that powers Vue3 components.
Tests REST API endpoints, WebSocket connections, and smart chunking.

Usage:
    streamlit run vue3_backend_test.py
    python run_vue3_test.py
"""

import asyncio
import json
import random
from datetime import datetime, timedelta
from typing import Any

import httpx
import streamlit as st

# Backend server configuration
DEFAULT_BASE_URL = "http://localhost:8000"


def generate_ohlcv_data(points: int = 1000, base_price: float = 100.0) -> list[dict]:
    """Generate realistic OHLCV data with trends.

    Args:
        points: Number of data points to generate.
        base_price: Starting price.

    Returns:
        List of OHLCV data points.
    """
    base_time = datetime(2024, 1, 1)
    data = []
    price = base_price

    # Create trend phases
    trend_phases = [
        (0, points // 4, 1.5),  # Uptrend
        (points // 4, points // 2, -1.2),  # Downtrend
        (points // 2, 3 * points // 4, 2.0),  # Strong uptrend
        (3 * points // 4, points, -0.8),  # Mild downtrend
    ]

    for i in range(points):
        # Apply trend
        trend = 0
        for start, end, strength in trend_phases:
            if start <= i < end:
                trend = strength
                break

        change = random.uniform(-1, 1) + (trend * 0.3)
        price = max(50, price + change)

        # Generate realistic OHLC
        spread = price * 0.02
        open_price = price + random.uniform(-spread, spread)
        close = price + random.uniform(-spread, spread)
        high = max(open_price, close) + abs(random.uniform(0, spread))
        low = min(open_price, close) - abs(random.uniform(0, spread))

        timestamp = int((base_time + timedelta(hours=i)).timestamp())

        data.append(
            {
                "time": timestamp,
                "open": round(open_price, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close, 2),
                "volume": random.randint(5000, 15000),
            }
        )

    return data


async def test_health_check(client: httpx.AsyncClient, results: dict) -> bool:
    """Test health check endpoint.

    Args:
        client: HTTP client.
        results: Dict to store test results.

    Returns:
        True if test passed.
    """
    try:
        response = await client.get("/health")
        response.raise_for_status()
        data = response.json()

        results["health_check"] = {
            "status": "PASS" if data.get("status") == "healthy" else "FAIL",
            "response": data,
        }
        return data.get("status") == "healthy"
    except Exception as e:
        results["health_check"] = {"status": "FAIL", "error": str(e)}
        return False


async def test_create_chart(client: httpx.AsyncClient, chart_id: str, results: dict) -> bool:
    """Test chart creation endpoint.

    Args:
        client: HTTP client.
        chart_id: Chart identifier.
        results: Dict to store test results.

    Returns:
        True if test passed.
    """
    try:
        response = await client.post(
            f"/api/charts/{chart_id}",
            json={"height": 400, "width": 800},
        )
        response.raise_for_status()
        data = response.json()

        success = data.get("chartId") == chart_id
        results["create_chart"] = {
            "status": "PASS" if success else "FAIL",
            "response": data,
        }
        return success
    except Exception as e:
        results["create_chart"] = {"status": "FAIL", "error": str(e)}
        return False


async def test_set_series_data(
    client: httpx.AsyncClient,
    chart_id: str,
    series_id: str,
    data_points: list[dict],
    results: dict,
) -> bool:
    """Test setting series data.

    Args:
        client: HTTP client.
        chart_id: Chart identifier.
        series_id: Series identifier.
        data_points: Data to set.
        results: Dict to store test results.

    Returns:
        True if test passed.
    """
    try:
        response = await client.post(
            f"/api/charts/{chart_id}/data/{series_id}",
            json={
                "pane_id": 0,
                "series_type": "candlestick",
                "data": data_points,
                "options": {},
            },
        )
        response.raise_for_status()
        data = response.json()

        success = data.get("seriesId") == series_id and data.get("count") == len(data_points)
        results["set_series_data"] = {
            "status": "PASS" if success else "FAIL",
            "response": data,
            "expected_count": len(data_points),
        }
        return success
    except Exception as e:
        results["set_series_data"] = {"status": "FAIL", "error": str(e)}
        return False


async def test_get_chart(client: httpx.AsyncClient, chart_id: str, results: dict) -> bool:
    """Test getting full chart data.

    Args:
        client: HTTP client.
        chart_id: Chart identifier.
        results: Dict to store test results.

    Returns:
        True if test passed.
    """
    try:
        response = await client.get(f"/api/charts/{chart_id}")
        response.raise_for_status()
        data = response.json()

        success = data.get("chartId") == chart_id
        results["get_chart"] = {
            "status": "PASS" if success else "FAIL",
            "response": {k: v for k, v in data.items() if k != "panes"},
            "has_panes": "panes" in data,
        }
        return success
    except Exception as e:
        results["get_chart"] = {"status": "FAIL", "error": str(e)}
        return False


async def test_get_series_data(
    client: httpx.AsyncClient,
    chart_id: str,
    pane_id: int,
    series_id: str,
    results: dict,
) -> dict[str, Any]:
    """Test getting series data with smart chunking.

    Args:
        client: HTTP client.
        chart_id: Chart identifier.
        pane_id: Pane index.
        series_id: Series identifier.
        results: Dict to store test results.

    Returns:
        Response data dict.
    """
    try:
        response = await client.get(f"/api/charts/{chart_id}/data/{pane_id}/{series_id}")
        response.raise_for_status()
        data = response.json()

        results["get_series_data"] = {
            "status": "PASS",
            "chunked": data.get("chunked", False),
            "total_count": data.get("totalCount"),
            "has_more_before": data.get("hasMoreBefore"),
            "has_more_after": data.get("hasMoreAfter"),
        }
        return data
    except Exception as e:
        results["get_series_data"] = {"status": "FAIL", "error": str(e)}
        return {}


async def test_get_history(
    client: httpx.AsyncClient,
    chart_id: str,
    pane_id: int,
    series_id: str,
    before_time: int,
    results: dict,
) -> bool:
    """Test getting historical data chunk.

    Args:
        client: HTTP client.
        chart_id: Chart identifier.
        pane_id: Pane index.
        series_id: Series identifier.
        before_time: Get data before this timestamp.
        results: Dict to store test results.

    Returns:
        True if test passed.
    """
    try:
        response = await client.get(
            f"/api/charts/{chart_id}/history/{pane_id}/{series_id}",
            params={"before_time": before_time, "count": 100},
        )
        response.raise_for_status()
        data = response.json()

        results["get_history"] = {
            "status": "PASS",
            "data_count": len(data.get("data", [])),
            "has_more_before": data.get("hasMoreBefore"),
            "has_more_after": data.get("hasMoreAfter"),
        }
        return True
    except Exception as e:
        results["get_history"] = {"status": "FAIL", "error": str(e)}
        return False


async def test_websocket_connection(base_url: str, chart_id: str, results: dict) -> bool:
    """Test WebSocket connection and messaging.

    Args:
        base_url: Base URL for the server.
        chart_id: Chart identifier.
        results: Dict to store test results.

    Returns:
        True if test passed.
    """
    import websockets

    ws_url = base_url.replace("http://", "ws://").replace("https://", "wss://")
    ws_url = f"{ws_url}/ws/charts/{chart_id}"

    try:
        async with websockets.connect(ws_url, close_timeout=5) as ws:
            # Wait for connection acknowledgment
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            data = json.loads(msg)

            if data.get("type") != "connected":
                results["websocket"] = {
                    "status": "FAIL",
                    "error": "Did not receive connection acknowledgment",
                }
                return False

            # Test ping/pong
            await ws.send(json.dumps({"type": "ping"}))
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            pong_data = json.loads(msg)

            if pong_data.get("type") != "pong":
                results["websocket"] = {
                    "status": "FAIL",
                    "error": "Did not receive pong response",
                }
                return False

            # Test initial data request
            await ws.send(
                json.dumps(
                    {
                        "type": "get_initial_data",
                        "paneId": 0,
                        "seriesId": "price",
                    }
                )
            )
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            initial_data = json.loads(msg)

            results["websocket"] = {
                "status": "PASS",
                "connected": True,
                "ping_pong": True,
                "initial_data_type": initial_data.get("type"),
            }
            return True

    except asyncio.TimeoutError:
        results["websocket"] = {"status": "FAIL", "error": "Connection timeout"}
        return False
    except Exception as e:
        results["websocket"] = {"status": "FAIL", "error": str(e)}
        return False


async def test_smart_chunking(
    client: httpx.AsyncClient,
    chart_id: str,
    small_data: list[dict],
    large_data: list[dict],
    results: dict,
) -> bool:
    """Test smart chunking behavior.

    Small datasets (< 500 points) should not be chunked.
    Large datasets (>= 500 points) should be chunked.

    Args:
        client: HTTP client.
        chart_id: Chart identifier.
        small_data: Small dataset (< 500 points).
        large_data: Large dataset (>= 500 points).
        results: Dict to store test results.

    Returns:
        True if test passed.
    """
    try:
        # Test with small dataset
        await client.post(
            f"/api/charts/{chart_id}/data/small_series",
            json={
                "pane_id": 0,
                "series_type": "candlestick",
                "data": small_data,
                "options": {},
            },
        )

        small_response = await client.get(f"/api/charts/{chart_id}/data/0/small_series")
        small_result = small_response.json()

        # Test with large dataset
        await client.post(
            f"/api/charts/{chart_id}/data/large_series",
            json={
                "pane_id": 0,
                "series_type": "candlestick",
                "data": large_data,
                "options": {},
            },
        )

        large_response = await client.get(f"/api/charts/{chart_id}/data/0/large_series")
        large_result = large_response.json()

        # Small should not be chunked, large should be
        small_chunked = small_result.get("chunked", False)
        large_chunked = large_result.get("chunked", False)

        success = not small_chunked and large_chunked

        results["smart_chunking"] = {
            "status": "PASS" if success else "FAIL",
            "small_dataset": {
                "count": len(small_data),
                "chunked": small_chunked,
                "expected_chunked": False,
            },
            "large_dataset": {
                "count": len(large_data),
                "chunked": large_chunked,
                "expected_chunked": True,
                "has_more_before": large_result.get("hasMoreBefore"),
            },
        }
        return success

    except Exception as e:
        results["smart_chunking"] = {"status": "FAIL", "error": str(e)}
        return False


async def run_all_tests(base_url: str) -> dict:
    """Run all API tests.

    Args:
        base_url: Base URL for the API server.

    Returns:
        Dict of test results.
    """
    results: dict[str, Any] = {}
    chart_id = f"test_chart_{random.randint(1000, 9999)}"

    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        # 1. Health check
        await test_health_check(client, results)

        # 2. Create chart
        await test_create_chart(client, chart_id, results)

        # 3. Generate test data
        ohlcv_data = generate_ohlcv_data(1000)

        # 4. Set series data
        await test_set_series_data(client, chart_id, "price", ohlcv_data, results)

        # 5. Get chart
        await test_get_chart(client, chart_id, results)

        # 6. Get series data
        series_data = await test_get_series_data(client, chart_id, 0, "price", results)

        # 7. Get history (if we got series data)
        if series_data and series_data.get("data"):
            first_time = series_data["data"][0]["time"]
            await test_get_history(client, chart_id, 0, "price", first_time, results)

        # 8. Test smart chunking
        small_data = generate_ohlcv_data(100)
        large_data = generate_ohlcv_data(1000)
        await test_smart_chunking(client, chart_id, small_data, large_data, results)

    # 9. WebSocket test (needs websockets library)
    try:
        import websockets  # noqa: F401

        await test_websocket_connection(base_url, chart_id, results)
    except ImportError:
        results["websocket"] = {
            "status": "SKIP",
            "reason": "websockets library not installed",
        }

    return results


def main():
    """Main test harness UI."""
    st.set_page_config(
        page_title="Vue3 Backend Test",
        page_icon="🔌",
        layout="wide",
        initial_sidebar_state="collapsed",
    )

    # Header
    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        st.title("🔌 Vue3 Backend Test Harness")
    with col2:
        base_url = st.text_input(
            "Base URL",
            DEFAULT_BASE_URL,
            label_visibility="collapsed",
            help="Backend server URL",
        )
    with col3:
        run_tests = st.button("🚀 Run Tests", use_container_width=True)

    st.caption("Tests the FastAPI backend that powers Vue3 components")

    # Test status
    if run_tests:
        with st.spinner("Running tests..."):
            try:
                results = asyncio.run(run_all_tests(base_url))
            except Exception as e:
                st.error(f"❌ Failed to connect to backend: {e}")
                st.info(
                    "Make sure the backend server is running:\n"
                    "```bash\n"
                    "cd packages/backend\n"
                    "uvicorn lightweight_charts_backend.app:create_app --factory --reload\n"
                    "```"
                )
                return

        # Count results
        passed = sum(1 for r in results.values() if r.get("status") == "PASS")
        failed = sum(1 for r in results.values() if r.get("status") == "FAIL")
        skipped = sum(1 for r in results.values() if r.get("status") == "SKIP")

        if failed == 0:
            st.success(f"✅ All tests passed! ({passed} passed, {skipped} skipped)")
        else:
            st.error(f"❌ {failed} test(s) failed ({passed} passed, {skipped} skipped)")

        # Display results
        st.subheader("📋 Test Results")

        col1, col2 = st.columns(2)

        with col1:
            st.write("**Core API Tests**")

            # Health check
            hc = results.get("health_check", {})
            status_icon = "✅" if hc.get("status") == "PASS" else "❌"
            with st.expander(f"{status_icon} Health Check"):
                st.json(hc)

            # Create chart
            cc = results.get("create_chart", {})
            status_icon = "✅" if cc.get("status") == "PASS" else "❌"
            with st.expander(f"{status_icon} Create Chart"):
                st.json(cc)

            # Get chart
            gc = results.get("get_chart", {})
            status_icon = "✅" if gc.get("status") == "PASS" else "❌"
            with st.expander(f"{status_icon} Get Chart"):
                st.json(gc)

            # Set series data
            ssd = results.get("set_series_data", {})
            status_icon = "✅" if ssd.get("status") == "PASS" else "❌"
            with st.expander(f"{status_icon} Set Series Data"):
                st.json(ssd)

        with col2:
            st.write("**Data & Chunking Tests**")

            # Get series data
            gsd = results.get("get_series_data", {})
            status_icon = "✅" if gsd.get("status") == "PASS" else "❌"
            with st.expander(f"{status_icon} Get Series Data"):
                st.json(gsd)

            # Get history
            gh = results.get("get_history", {})
            status_icon = "✅" if gh.get("status") == "PASS" else "❌"
            with st.expander(f"{status_icon} Get History"):
                st.json(gh)

            # Smart chunking
            sc = results.get("smart_chunking", {})
            status_icon = "✅" if sc.get("status") == "PASS" else "❌"
            with st.expander(f"{status_icon} Smart Chunking"):
                st.json(sc)

            # WebSocket
            ws = results.get("websocket", {})
            if ws.get("status") == "PASS":
                status_icon = "✅"
            elif ws.get("status") == "SKIP":
                status_icon = "⏭️"
            else:
                status_icon = "❌"
            with st.expander(f"{status_icon} WebSocket"):
                st.json(ws)

        # API Documentation
        st.subheader("📚 API Endpoints Reference")

        st.markdown(
            f"""
| Endpoint | Method | Description |
|----------|--------|-------------|
| `{base_url}/health` | GET | Health check |
| `{base_url}/api/charts/{{chart_id}}` | POST | Create chart |
| `{base_url}/api/charts/{{chart_id}}` | GET | Get chart data |
| `{base_url}/api/charts/{{chart_id}}/data/{{series_id}}` | POST | Set series data |
| `{base_url}/api/charts/{{chart_id}}/data/{{pane_id}}/{{series_id}}` | GET | Get series data |
| `{base_url}/api/charts/{{chart_id}}/history/{{pane_id}}/{{series_id}}` | GET | Get history |
| `ws://localhost:8000/ws/charts/{{chart_id}}` | WebSocket | Real-time updates |
"""
        )

    else:
        st.info(
            "👆 Click **Run Tests** to test the backend API.\n\n"
            "Make sure the backend server is running first:\n"
            "```bash\n"
            "cd packages/backend\n"
            "uvicorn lightweight_charts_backend.app:create_app --factory --reload\n"
            "```"
        )

        # Show what will be tested
        st.subheader("🧪 Tests to Run")

        col1, col2 = st.columns(2)

        with col1:
            st.markdown(
                """
**Core API Tests:**
- Health Check - Verify server is healthy
- Create Chart - Create a new chart
- Get Chart - Retrieve full chart data
- Set Series Data - Add OHLCV data to chart
"""
            )

        with col2:
            st.markdown(
                """
**Data & Chunking Tests:**
- Get Series Data - Retrieve series with smart chunking
- Get History - Test lazy loading endpoint
- Smart Chunking - Verify <500 points not chunked, >=500 chunked
- WebSocket - Test real-time connection
"""
            )

    # Sidebar with checklist
    with st.sidebar:
        st.markdown("### ✅ Test Checklist")
        st.markdown(
            """
- [ ] Backend server running
- [ ] Health check passes
- [ ] Chart CRUD works
- [ ] Smart chunking correct
- [ ] History endpoint works
- [ ] WebSocket connects
- [ ] No errors in logs
"""
        )

        st.divider()

        st.markdown("### 🔧 Quick Commands")
        st.code(
            "# Start backend\n"
            "cd packages/backend\n"
            "uvicorn lightweight_charts_backend.app:create_app "
            "--factory --reload",
            language="bash",
        )

        st.code(
            "# Run Vue3 tests\n" "cd packages/vue3\n" "npm test",
            language="bash",
        )


if __name__ == "__main__":
    main()
