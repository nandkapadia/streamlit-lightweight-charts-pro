"""Ribbon data classes for lightweight-charts-core.

This module provides data classes for ribbon data points used in
ribbon charts that display upper and lower bands with fill areas.
"""

import math
from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.data import Data
from lightweight_charts_core.utils import validated_field


@dataclass
@validated_field("fill", str, validator="color", allow_none=True)
@validated_field("upper_line_color", str, validator="color", allow_none=True)
@validated_field("lower_line_color", str, validator="color", allow_none=True)
class RibbonData(Data):
    """Data point for ribbon charts.

    This class represents a ribbon data point with upper and lower values,
    along with optional per-point color overrides. It's used for ribbon charts
    that show upper and lower bands with fill areas between them.

    Attributes:
        upper: The upper band value.
        lower: The lower band value.
        fill: Optional color for the fill area (hex or rgba format).
        upper_line_color: Optional color override for upper line (hex or rgba format).
        lower_line_color: Optional color override for lower line (hex or rgba format).

    Example:
        ```python
        from lightweight_charts_core.data import RibbonData

        # Basic data point
        data = RibbonData(time="2024-01-01", upper=110, lower=100)

        # Data point with custom per-point colors
        data = RibbonData(
            time="2024-01-01",
            upper=110,
            lower=100,
            fill="rgba(255,0,0,0.2)",
            upper_line_color="#ff0000",
            lower_line_color="#00ff00",
        )
        ```

    """

    REQUIRED_COLUMNS: ClassVar[set] = {"upper", "lower"}
    OPTIONAL_COLUMNS: ClassVar[set] = {"fill", "upper_line_color", "lower_line_color"}

    upper: float | None
    lower: float | None
    fill: str | None = None
    upper_line_color: str | None = None
    lower_line_color: str | None = None

    def __post_init__(self):
        # Normalize time
        super().__post_init__()  # Call parent's __post_init__

        # Handle NaN in upper value
        if isinstance(self.upper, float) and math.isnan(self.upper):
            self.upper = None
        # Allow None for missing data (no validation error)

        # Handle NaN in lower value
        if isinstance(self.lower, float) and math.isnan(self.lower):
            self.lower = None
        # Allow None for missing data (no validation error)

        # Color validation is now handled by @validated_field decorators
