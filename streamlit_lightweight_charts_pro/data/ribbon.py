"""
Ribbon data classes for streamlit-lightweight-charts.

This module provides data classes for ribbon data points used in
ribbon charts that display upper and lower bands with fill areas.
"""

import math
from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.data.data import Data


@dataclass
class RibbonData(Data):
    """
    Data point for ribbon charts.

    This class represents a ribbon data point with upper and lower values,
    along with optional fill color. It's used for ribbon charts
    that show upper and lower bands with fill areas between them.

    Attributes:
        upper: The upper band value.
        lower: The lower band value.
        fill: Optional color for the fill area (uses series default if not specified).
    """

    REQUIRED_COLUMNS = {"upper", "lower"}
    OPTIONAL_COLUMNS = {"fill"}

    upper: float
    lower: float
    fill: Optional[str] = None

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
