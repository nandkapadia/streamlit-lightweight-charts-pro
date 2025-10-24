"""Band data classes for streamlit-lightweight-charts.

This module provides data classes for band data points used in
band charts such as Bollinger Bands and other envelope indicators.
"""

import math
from dataclasses import dataclass
from typing import ClassVar, Optional

from streamlit_lightweight_charts_pro.data.data import Data
from streamlit_lightweight_charts_pro.data.styles import PerPointStyles
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
        styles: Optional per-point style overrides for lines and fills.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.data import BandData
        from streamlit_lightweight_charts_pro.data.styles import PerPointStyles, LineStyle, FillStyle

        # Basic data point
        data = BandData(time="2024-01-01", upper=110, middle=105, lower=100)

        # Data point with custom styling
        data = BandData(
            time="2024-01-01",
            upper=110,
            middle=105,
            lower=100,
            styles=PerPointStyles(
                upper_line=LineStyle(color="#ff0000", width=3),
                upper_fill=FillStyle(color="rgba(255,0,0,0.2)", visible=True),
            ),
        )
        ```
    """

    REQUIRED_COLUMNS: ClassVar[set] = {"upper", "middle", "lower"}
    OPTIONAL_COLUMNS: ClassVar[set] = {"styles"}

    upper: float
    middle: float
    lower: float
    styles: Optional[PerPointStyles] = None

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

    def asdict(self):
        """Serialize to dictionary with proper styles handling.

        Returns:
            Dictionary with camelCase keys for JSON serialization.
            The styles field is converted using PerPointStyles.asdict() if present.
        """
        # Get base serialization from parent
        result = super().asdict()

        # Handle styles field specially - convert to dict if present
        if self.styles is not None:
            result["styles"] = self.styles.asdict()

        return result
