"""Band data classes for lightweight-charts-core.

This module provides data classes for band data points used in
band charts such as Bollinger Bands and other envelope indicators.
"""

import math
from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.data import Data
from lightweight_charts_core.exceptions import ValueValidationError
from lightweight_charts_core.utils import validated_field


@dataclass
@validated_field("upper_line_color", str, validator="color", allow_none=True)
@validated_field("middle_line_color", str, validator="color", allow_none=True)
@validated_field("lower_line_color", str, validator="color", allow_none=True)
@validated_field("upper_fill_color", str, validator="color", allow_none=True)
@validated_field("lower_fill_color", str, validator="color", allow_none=True)
class BandData(Data):
    """Data point for band charts (e.g., Bollinger Bands).

    This class represents a band data point with upper, middle, and lower values,
    along with optional per-point color overrides. It's used for band charts
    that show multiple lines simultaneously, such as Bollinger Bands, Keltner
    Channels, or other envelope indicators.

    Attributes:
        upper: The upper band value.
        middle: The middle band value (usually the main line).
        lower: The lower band value.
        upper_line_color: Optional color override for upper line (hex or rgba format).
        middle_line_color: Optional color override for middle line (hex or rgba format).
        lower_line_color: Optional color override for lower line (hex or rgba format).
        upper_fill_color: Optional color override for upper fill area (hex or rgba format).
        lower_fill_color: Optional color override for lower fill area (hex or rgba format).

    Example:
        ```python
        from lightweight_charts_core.data import BandData

        # Basic data point
        data = BandData(time="2024-01-01", upper=110, middle=105, lower=100)

        # Data point with custom per-point colors
        data = BandData(
            time="2024-01-01",
            upper=110,
            middle=105,
            lower=100,
            upper_line_color="#ff0000",
            middle_line_color="#0000ff",
            lower_line_color="#00ff00",
            upper_fill_color="rgba(255,0,0,0.2)",
            lower_fill_color="rgba(0,255,0,0.2)",
        )
        ```

    """

    REQUIRED_COLUMNS: ClassVar[set] = {"upper", "middle", "lower"}
    OPTIONAL_COLUMNS: ClassVar[set] = {
        "upper_line_color",
        "middle_line_color",
        "lower_line_color",
        "upper_fill_color",
        "lower_fill_color",
    }

    upper: float
    middle: float
    lower: float
    upper_line_color: str | None = None
    middle_line_color: str | None = None
    lower_line_color: str | None = None
    upper_fill_color: str | None = None
    lower_fill_color: str | None = None

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

        # Color validation is now handled by @validated_field decorators
