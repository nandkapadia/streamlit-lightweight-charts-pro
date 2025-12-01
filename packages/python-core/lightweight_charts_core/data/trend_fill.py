"""Trend fill data classes for lightweight-charts-core.

This module provides TrendFillData class for creating trend-based fill charts
that display fills between trend lines and base lines, similar to
Supertrend indicators with dynamic trend-colored backgrounds.

The class now uses a simplified approach with a single trendLine field:
- Uptrend (+1): Shows trend line above price, base line for reference
- Downtrend (-1): Shows trend line below price, base line for reference
- Neutral (0): No trend line displayed
"""

import math
from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.data import Data
from lightweight_charts_core.exceptions import (
    TrendDirectionIntegerError,
    TypeValidationError,
    ValueValidationError,
)


@dataclass
class TrendFillData(Data):
    """Trend fill data for lightweight charts.

    This data class represents a single data point for trend fill charts,
    with simplified trend line handling:

    - Uptrend (+1): Uses trendLine above price as trend line, baseLine for reference
    - Downtrend (-1): Uses trendLine below price as trend line, baseLine for reference
    - Neutral (0): No trend line displayed

    The fill area is created between the trend line and base line,
    with colors automatically selected based on trend direction.

    Attributes:
        time: Time value for the data point
        baseLine: Base line value (e.g., candle body midpoint, price level)
        trendLine: Value of the trend line (used for both uptrend and downtrend)
        trendDirection: Trend direction indicator (-1 for downtrend, 1 for uptrend, 0 for neutral)

        # Fill color fields
        uptrendFillColor: Optional custom uptrend fill color
        downtrendFillColor: Optional custom downtrend fill color

    """

    REQUIRED_COLUMNS: ClassVar[set] = {"base_line", "trend_line", "trend_direction"}
    OPTIONAL_COLUMNS: ClassVar[set] = {
        "uptrend_fill_color",
        "downtrend_fill_color",
    }

    # Core fields
    base_line: float = 0
    trend_line: float = 0
    trend_direction: int = 0

    # Fill color fields
    uptrend_fill_color: str | None = None
    downtrend_fill_color: str | None = None

    def __post_init__(self):
        """Validate and process data after initialization."""
        super().__post_init__()

        # Handle NaN values for trend line fields
        if isinstance(self.trend_line, float) and math.isnan(self.trend_line):
            self.trend_line = None
        if isinstance(self.base_line, float) and math.isnan(self.base_line):
            self.base_line = None

        # Validate trend_direction
        if not isinstance(self.trend_direction, int):
            raise TrendDirectionIntegerError(
                "trend_direction",
                "integer",
                type(self.trend_direction).__name__,
            )

        if self.trend_direction not in [-1, 0, 1]:
            raise ValueValidationError("trend_direction", "must be -1, 0, or 1")

        # Validate fill colors if provided
        if self.uptrend_fill_color is not None and not isinstance(self.uptrend_fill_color, str):
            raise TypeValidationError("uptrend_fill_color", "string")
        if self.downtrend_fill_color is not None and not isinstance(self.downtrend_fill_color, str):
            raise TypeValidationError("downtrend_fill_color", "string")

    @property
    def is_uptrend(self) -> bool:
        """Check if this data point represents an uptrend."""
        return self.trend_direction == 1

    @property
    def is_downtrend(self) -> bool:
        """Check if this data point represents a downtrend."""
        return self.trend_direction == -1

    @property
    def is_neutral(self) -> bool:
        """Check if this data point represents a neutral trend."""
        return self.trend_direction == 0

    @property
    def has_valid_fill_data(self) -> bool:
        """Check if this data point has valid data for creating fills.

        Returns True if we have a valid trend line and base line,
        with the appropriate trend line based on direction.
        """
        if self.trend_direction == 0 or self.base_line is None:
            return False

        # Check if we have a valid trend line
        return self.trend_line is not None

    @property
    def has_valid_uptrend_fill(self) -> bool:
        """Check if this data point has valid uptrend fill data."""
        return (
            self.base_line is not None and self.trend_direction == 1 and self.trend_line is not None
        )

    @property
    def has_valid_downtrend_fill(self) -> bool:
        """Check if this data point has valid downtrend fill data."""
        return (
            self.base_line is not None
            and self.trend_direction == -1
            and self.trend_line is not None
        )

    @property
    def active_trend_line(self) -> float | None:
        """Get the active trend line value based on trend direction.

        Returns the trend line value for the current trend direction:
        - Uptrend (+1): Returns trend_line (trend line above price)
        - Downtrend (-1): Returns trend_line (trend line below price)
        """
        if self.trend_direction in [1, -1]:  # Both uptrend and downtrend use trend_line
            return self.trend_line
        return None

    @property
    def active_fill_color(self) -> str | None:
        """Get the active fill color based on trend direction.

        Returns the appropriate fill color for the current trend direction,
        prioritizing direction-specific colors.
        """
        if self.trend_direction == 1:  # Uptrend
            return self.uptrend_fill_color
        if self.trend_direction == -1:  # Downtrend
            return self.downtrend_fill_color
        return None

    @property
    def trend_line_type(self) -> str | None:
        """Get the type of trend line being displayed.

        Returns:
            'upper' for uptrend (trend line above price)
            'lower' for downtrend (trend line below price)
            None for neutral

        """
        if self.trend_direction == 1:
            return "upper"
        if self.trend_direction == -1:
            return "lower"
        return None
