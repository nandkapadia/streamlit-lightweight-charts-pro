"""Chart API endpoints for data management."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from lightweight_charts_backend.services import DatafeedService


router = APIRouter()


# Request/Response Models
class SetSeriesDataRequest(BaseModel):
    """Request model for setting series data."""

    pane_id: int = 0
    series_type: str
    data: List[Dict[str, Any]]
    options: Optional[Dict[str, Any]] = None


class GetHistoryRequest(BaseModel):
    """Request model for getting historical data."""

    pane_id: int
    series_id: str
    before_time: int
    count: int = 500


# Dependency to get datafeed service
def get_datafeed(request: Request) -> DatafeedService:
    """Get datafeed service from app state."""
    return request.app.state.datafeed


@router.get("/{chart_id}")
async def get_chart(
    chart_id: str,
    datafeed: DatafeedService = Depends(get_datafeed),
):
    """Get full chart data including all series.

    Args:
        chart_id: Unique chart identifier.

    Returns:
        Chart data with all series.
    """
    chart = await datafeed.get_chart(chart_id)
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")

    return await datafeed.get_initial_data(chart_id)


@router.post("/{chart_id}")
async def create_chart(
    chart_id: str,
    options: Optional[Dict[str, Any]] = None,
    datafeed: DatafeedService = Depends(get_datafeed),
):
    """Create a new chart.

    Args:
        chart_id: Unique chart identifier.
        options: Chart options.

    Returns:
        Created chart state.
    """
    chart = await datafeed.create_chart(chart_id, options)
    return {
        "chartId": chart.chart_id,
        "options": chart.options,
    }


@router.get("/{chart_id}/data/{pane_id}/{series_id}")
async def get_series_data(
    chart_id: str,
    pane_id: int,
    series_id: str,
    datafeed: DatafeedService = Depends(get_datafeed),
):
    """Get data for a specific series.

    Uses smart chunking - small datasets return all data, large datasets
    return an initial chunk with metadata for pagination.

    Args:
        chart_id: Chart identifier.
        pane_id: Pane index.
        series_id: Series identifier.

    Returns:
        Series data with chunking metadata.
    """
    return await datafeed.get_initial_data(chart_id, pane_id, series_id)


@router.post("/{chart_id}/data/{series_id}")
async def set_series_data(
    chart_id: str,
    series_id: str,
    request: SetSeriesDataRequest,
    datafeed: DatafeedService = Depends(get_datafeed),
):
    """Set data for a series.

    Args:
        chart_id: Chart identifier.
        series_id: Series identifier.
        request: Series data and options.

    Returns:
        Updated series metadata.
    """
    series = await datafeed.set_series_data(
        chart_id=chart_id,
        pane_id=request.pane_id,
        series_id=series_id,
        series_type=request.series_type,
        data=request.data,
        options=request.options,
    )

    return {
        "seriesId": series.series_id,
        "seriesType": series.series_type,
        "count": len(series.data),
    }


@router.get("/{chart_id}/history/{pane_id}/{series_id}")
async def get_history(
    chart_id: str,
    pane_id: int,
    series_id: str,
    before_time: int,
    count: int = 500,
    datafeed: DatafeedService = Depends(get_datafeed),
):
    """Get historical data chunk for infinite history loading.

    This endpoint is called by the frontend when the user scrolls near the
    edge of the visible data range.

    Args:
        chart_id: Chart identifier.
        pane_id: Pane index.
        series_id: Series identifier.
        before_time: Get data before this timestamp.
        count: Number of data points to return.

    Returns:
        Data chunk with pagination metadata.
    """
    result = await datafeed.get_history(
        chart_id=chart_id,
        pane_id=pane_id,
        series_id=series_id,
        before_time=before_time,
        count=count,
    )

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


@router.post("/{chart_id}/history")
async def get_history_batch(
    chart_id: str,
    request: GetHistoryRequest,
    datafeed: DatafeedService = Depends(get_datafeed),
):
    """Get historical data for multiple series at once.

    Useful when loading history for all series in a pane together.

    Args:
        chart_id: Chart identifier.
        request: History request parameters.

    Returns:
        Data chunk with pagination metadata.
    """
    return await datafeed.get_history(
        chart_id=chart_id,
        pane_id=request.pane_id,
        series_id=request.series_id,
        before_time=request.before_time,
        count=request.count,
    )
