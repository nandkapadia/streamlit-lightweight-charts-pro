"""Ribbon data classes for streamlit-lightweight-charts.

This module provides data classes for ribbon data points used in
ribbon charts that display upper and lower bands with fill areas.
"""

import math
from dataclasses import dataclass
from typing import ClassVar, Optional

from streamlit_lightweight_charts_pro.data.data import Data
from streamlit_lightweight_charts_pro.exceptions import ValueValidationError
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
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
        from streamlit_lightweight_charts_pro.data import RibbonData

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

    upper: Optional[float]
    lower: Optional[float]
    fill: Optional[str] = None
    upper_line_color: Optional[str] = None
    lower_line_color: Optional[str] = None

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

        # Validate color fields if provided
        if self.fill is not None and self.fill != "" and not is_valid_color(self.fill):
            raise ValueValidationError("fill", "Invalid color format")
        if (
            self.upper_line_color is not None
            and self.upper_line_color != ""
            and not is_valid_color(self.upper_line_color)
        ):
            raise ValueValidationError("upper_line_color", "Invalid color format")
        if (
            self.lower_line_color is not None
            and self.lower_line_color != ""
            and not is_valid_color(self.lower_line_color)
        ):
            raise ValueValidationError("lower_line_color", "Invalid color format")
