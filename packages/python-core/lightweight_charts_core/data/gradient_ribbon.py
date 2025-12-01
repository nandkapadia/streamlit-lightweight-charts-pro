"""Gradient ribbon data classes for lightweight-charts-core.

This module provides data classes for gradient ribbon data points used in
ribbon charts that display upper and lower bands with gradient fill areas.
"""

import math
from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.ribbon import RibbonData
from lightweight_charts_core.exceptions import ValueValidationError


@dataclass
class GradientRibbonData(RibbonData):
    """Data point for gradient ribbon charts.

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

    REQUIRED_COLUMNS: ClassVar[set] = {"upper", "lower"}
    OPTIONAL_COLUMNS: ClassVar[set] = {"fill", "gradient"}

    # upper and lower inherited from RibbonData
    gradient: float | None = None

    def __post_init__(self):
        # Call parent's __post_init__ for time normalization and NaN handling
        super().__post_init__()

        # Validate gradient if provided
        if self.gradient is not None:
            if not isinstance(self.gradient, (int, float)):
                raise ValueValidationError("gradient", "must be numeric")
            if math.isnan(self.gradient):
                raise ValueValidationError("gradient", "cannot be NaN")
            if math.isinf(self.gradient):
                raise ValueValidationError("gradient", "cannot be infinite")
