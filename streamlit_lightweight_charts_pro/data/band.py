"""Band data classes for streamlit-lightweight-charts.

This module provides data classes for band data points used in
band charts such as Bollinger Bands and other envelope indicators.
"""

import math
from dataclasses import dataclass
from typing import ClassVar

from streamlit_lightweight_charts_pro.data.data import Data
from streamlit_lightweight_charts_pro.exceptions import ValueValidationError


@dataclass
class BandData(Data):
    """Data point for band charts (e.g., Bollinger Bands).

    This class represents a band data point with upper, middle, and lower values.
    It's used for band charts that show multiple lines simultaneously,
    such as Bollinger Bands, Keltner Channels, or other envelope indicators.

    Attributes:
        upper: The upper band value.
        middle: The middle band value (usually the main line).
        lower: The lower band value.
    """

    REQUIRED_COLUMNS: ClassVar[set] = {"upper", "middle", "lower"}
    OPTIONAL_COLUMNS: ClassVar[set] = set()

    upper: float
    middle: float
    lower: float

    def __post_init__(self):
        # Normalize time
        super().__post_init__()  # Call parent's __post_init__
        # Handle NaN in value
        if isinstance(self.upper, float) and math.isnan(self.upper):
            self.upper = 0.0
        elif self.upper is None:
            raise ValueValidationError("upper", "must not be None")
        if isinstance(self.middle, float) and math.isnan(self.middle):
            self.middle = 0.0
        elif self.middle is None:
            raise ValueValidationError("middle", "must not be None")
        if isinstance(self.lower, float) and math.isnan(self.lower):
            self.lower = 0.0
        elif self.lower is None:
            raise ValueValidationError("lower", "must not be None")
