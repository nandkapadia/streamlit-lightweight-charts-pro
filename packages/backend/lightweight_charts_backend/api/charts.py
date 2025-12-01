"""Chart API endpoints for data management."""

import re
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Request
from lightweight_charts_backend.models import GetHistoryRequest, SetSeriesDataRequest
from lightweight_charts_backend.services import DatafeedService

router = APIRouter()

# Validation constants
MAX_ID_LENGTH = 128
ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-\.]+$")


def validate_identifier(value: str, field_name: str) -> str:
    """Validate an identifier (chart_id, series_id).

    Args:
        value: The identifier to validate.
        field_name: Name of the field for error messages.

    Returns:
        The validated identifier.

    Raises:
        HTTPException: If validation fails.
    """
    if not value:
        raise HTTPException(status_code=400, detail=f"{field_name} cannot be empty")

    if len(value) > MAX_ID_LENGTH:
        raise HTTPException(
            status_code=400, detail=f"{field_name} cannot exceed {MAX_ID_LENGTH} characters"
        )

    if not ID_PATTERN.match(value):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} contains invalid characters. Only alphanumeric, underscore, hyphen, and dot allowed.",
        )

    # Prevent path traversal
    if ".." in value or value.startswith(("/", "\\")):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name} format")

    return value


# Dependency to get datafeed service
def get_datafeed(request: Request) -> DatafeedService:
    """Get datafeed service from app state."""
    return request.app.state.datafeed


@router.get("/{chart_id}")
async def get_chart(
    chart_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
    datafeed: DatafeedService = Depends(get_datafeed),
):
    """Get full chart data including all series.

    Args:
        chart_id: Unique chart identifier.

    Returns:
        Chart data with all series.
    """
    chart_id = validate_identifier(chart_id, "chart_id")
    chart = await datafeed.get_chart(chart_id)
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")

    return await datafeed.get_initial_data(chart_id)


@router.post("/{chart_id}")
async def create_chart(
    chart_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
    options: Optional[dict[str, Any]] = None,
    datafeed: DatafeedService = Depends(get_datafeed),
):
    """Create a new chart.

    Args:
        chart_id: Unique chart identifier.
        options: Chart options.

    Returns:
        Created chart state.
    """
    chart_id = validate_identifier(chart_id, "chart_id")
    chart = await datafeed.create_chart(chart_id, options)
    return {
        "chartId": chart.chart_id,
        "options": chart.options,
    }


@router.get("/{chart_id}/data/{pane_id}/{series_id}")
async def get_series_data(
    chart_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
    pane_id: int = Path(..., ge=0, le=100),
    series_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
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
    chart_id = validate_identifier(chart_id, "chart_id")
    series_id = validate_identifier(series_id, "series_id")

    result = await datafeed.get_initial_data(chart_id, pane_id, series_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


@router.post("/{chart_id}/data/{series_id}")
async def set_series_data(
    chart_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
    series_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
    request: SetSeriesDataRequest = ...,
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
    chart_id = validate_identifier(chart_id, "chart_id")
    series_id = validate_identifier(series_id, "series_id")

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
    chart_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
    pane_id: int = Path(..., ge=0, le=100),
    series_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
    before_time: int = 0,
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
    chart_id = validate_identifier(chart_id, "chart_id")
    series_id = validate_identifier(series_id, "series_id")

    # Validate input parameters
    if before_time < 0:
        raise HTTPException(status_code=400, detail="before_time must be >= 0")

    if count <= 0 or count > 10000:
        raise HTTPException(status_code=400, detail="count must be between 1 and 10000")

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
    chart_id: str = Path(..., min_length=1, max_length=MAX_ID_LENGTH),
    request: GetHistoryRequest = ...,
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
    chart_id = validate_identifier(chart_id, "chart_id")

    # Pydantic model already validates before_time and count
    # Additional validation for series_id from request body
    validate_identifier(request.series_id, "series_id")

    return await datafeed.get_history(
        chart_id=chart_id,
        pane_id=request.pane_id,
        series_id=request.series_id,
        before_time=request.before_time,
        count=request.count,
    )
