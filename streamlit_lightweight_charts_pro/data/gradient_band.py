"""
Gradient band data classes for streamlit-lightweight-charts.

This module provides data classes for gradient band data points used in
band charts that display upper, middle, and lower bands with gradient fill areas.
"""

import math
from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.data.band import BandData


@dataclass
class GradientBandData(BandData):
    """
    Data point for gradient band charts.

    This class represents a band data point with upper, middle, and lower values,
    along with optional gradient value for color calculation. It's used for band
    charts that show multiple lines simultaneously with gradient fill areas,
    such as Bollinger Bands, Keltner Channels, or other envelope indicators.

    Attributes:
        upper: The upper band value.
        middle: The middle band value (usually the main line).
        lower: The lower band value.
        gradient: Optional gradient value for color calculation (0.0 to 1.0 or raw value).
    """

    REQUIRED_COLUMNS = {"upper", "middle", "lower"}
    OPTIONAL_COLUMNS = {"gradient"}

    upper: float
    middle: float
    lower: float
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
