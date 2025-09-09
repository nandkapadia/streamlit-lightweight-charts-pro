"""
Gradient ribbon data classes for streamlit-lightweight-charts.

This module provides data classes for gradient ribbon data points used in
ribbon charts that display upper and lower bands with gradient fill areas.
"""

import math
from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.data.ribbon import RibbonData


@dataclass
class GradientRibbonData(RibbonData):
    """
    Data point for gradient ribbon charts.

    This class represents a ribbon data point with upper and lower values,
    along with optional fill color override and gradient value for color calculation.
    It's used for ribbon charts that show upper and lower bands with gradient
    fill areas between them.

    Attributes:
        upper: The upper band value.
        lower: The lower band value.
        fill: Optional fill color override (highest priority).
        gradient: Optional gradient value for color calculation (0.0 to 1.0 or raw value).
    """

    REQUIRED_COLUMNS = {"upper", "lower"}
    OPTIONAL_COLUMNS = {"fill", "gradient"}

    upper: Optional[float] = None
    lower: Optional[float] = None
    fill: Optional[str] = None
    gradient: Optional[float] = None

    def __post_init__(self):
        # Call parent's __post_init__ for time normalization and NaN handling
        super().__post_init__()

        # Validate gradient if provided
        if self.gradient is not None:
            if not isinstance(self.gradient, (int, float)):
                raise ValueError(f"gradient must be numeric, got {type(self.gradient)}")
            if math.isnan(self.gradient):
                raise ValueError("gradient cannot be NaN")
            if math.isinf(self.gradient):
                raise ValueError("gradient cannot be infinite")
