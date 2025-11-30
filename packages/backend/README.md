# Lightweight Charts Backend

FastAPI backend for TradingView Lightweight Charts with WebSocket support for real-time updates
and infinite history loading.

## Installation

```bash
pip install lightweight-charts-backend
```

## Features

- **REST API**: Endpoints for chart data management
- **WebSocket**: Real-time data updates and streaming
- **Infinite History**: Smart chunking and pagination for large datasets
- **CORS Support**: Configurable CORS for frontend integration

## Usage

```python
from lightweight_charts_backend import create_app
from lightweight_charts_backend.services import DatafeedService

# Create app with custom datafeed
datafeed = DatafeedService()
app = create_app(datafeed=datafeed)

# Run with uvicorn
import uvicorn
uvicorn.run(app, host="0.0.0.0", port=8000)
```

## API Endpoints

- `GET /api/charts/{chart_id}/data` - Get chart data
- `GET /api/charts/{chart_id}/history` - Get historical data with pagination
- `POST /api/charts/{chart_id}/data` - Set chart data
- `WS /ws/charts/{chart_id}` - WebSocket for real-time updates

## License

MIT
