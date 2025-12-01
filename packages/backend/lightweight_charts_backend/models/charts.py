"""Pydantic models for chart API requests and responses."""

from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class SetSeriesDataRequest(BaseModel):
    """Request model for setting series data.

    Attributes:
        pane_id: Pane index (default: 0 for main pane).
        series_type: Type of series (e.g., 'line', 'candlestick').
        data: List of data points.
        options: Optional series configuration options.
    """

    pane_id: int = Field(default=0, ge=0, description="Pane index")
    series_type: str = Field(..., min_length=1, description="Series type")
    data: list[dict[str, Any]] = Field(..., description="Series data points")
    options: Optional[dict[str, Any]] = Field(default=None, description="Series options")

    @field_validator("series_type")
    @classmethod
    def validate_series_type(cls, v: str) -> str:
        """Validate series type is a known type."""
        valid_types = {"line", "area", "bar", "candlestick", "histogram", "baseline"}
        if v.lower() not in valid_types:
            # Allow unknown types but log warning (for extensibility)
            pass
        return v


class GetHistoryRequest(BaseModel):
    """Request model for getting historical data.

    Attributes:
        pane_id: Pane index.
        series_id: Series identifier.
        before_time: Timestamp to fetch data before.
        count: Number of data points to fetch (default: 500, max: 10000).
    """

    pane_id: int = Field(..., ge=0, description="Pane index")
    series_id: str = Field(..., min_length=1, description="Series identifier")
    before_time: int = Field(..., ge=0, description="Timestamp boundary")
    count: int = Field(default=500, ge=1, le=10000, description="Number of points")


class ChartOptionsRequest(BaseModel):
    """Request model for chart creation options.

    Attributes:
        width: Chart width in pixels.
        height: Chart height in pixels.
        layout: Layout configuration.
        crosshair: Crosshair configuration.
        grid: Grid configuration.
        timeScale: Time scale configuration.
    """

    width: Optional[int] = Field(default=None, ge=100, le=10000)
    height: Optional[int] = Field(default=None, ge=100, le=10000)
    layout: Optional[dict[str, Any]] = None
    crosshair: Optional[dict[str, Any]] = None
    grid: Optional[dict[str, Any]] = None
    timeScale: Optional[dict[str, Any]] = None
