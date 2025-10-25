"""Band data classes for streamlit-lightweight-charts.

This module provides data classes for band data points used in
band charts such as Bollinger Bands and other envelope indicators.
"""

import math
from dataclasses import dataclass
from typing import ClassVar, Optional

from streamlit_lightweight_charts_pro.data.data import Data
from streamlit_lightweight_charts_pro.exceptions import ValueValidationError
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
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
        from streamlit_lightweight_charts_pro.data import BandData

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
    upper_line_color: Optional[str] = None
    middle_line_color: Optional[str] = None
    lower_line_color: Optional[str] = None
    upper_fill_color: Optional[str] = None
    lower_fill_color: Optional[str] = None

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

        # Validate color fields if provided
        if (
            self.upper_line_color is not None
            and self.upper_line_color != ""
            and not is_valid_color(self.upper_line_color)
        ):
            raise ValueValidationError("upper_line_color", "Invalid color format")
        if (
            self.middle_line_color is not None
            and self.middle_line_color != ""
            and not is_valid_color(self.middle_line_color)
        ):
            raise ValueValidationError("middle_line_color", "Invalid color format")
        if (
            self.lower_line_color is not None
            and self.lower_line_color != ""
            and not is_valid_color(self.lower_line_color)
        ):
            raise ValueValidationError("lower_line_color", "Invalid color format")
        if (
            self.upper_fill_color is not None
            and self.upper_fill_color != ""
            and not is_valid_color(self.upper_fill_color)
        ):
            raise ValueValidationError("upper_fill_color", "Invalid color format")
        if (
            self.lower_fill_color is not None
            and self.lower_fill_color != ""
            and not is_valid_color(self.lower_fill_color)
        ):
            raise ValueValidationError("lower_fill_color", "Invalid color format")
