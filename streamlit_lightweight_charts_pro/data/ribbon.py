"""Ribbon data classes for streamlit-lightweight-charts.

This module provides data classes for ribbon data points used in
ribbon charts that display upper and lower bands with fill areas.
"""

import math
from dataclasses import dataclass
from typing import ClassVar, Optional

from streamlit_lightweight_charts_pro.data.data import Data
from streamlit_lightweight_charts_pro.data.styles import PerPointStyles


@dataclass
class RibbonData(Data):
    """Data point for ribbon charts.

    This class represents a ribbon data point with upper and lower values,
    along with optional fill color. It's used for ribbon charts
    that show upper and lower bands with fill areas between them.

    Attributes:
        upper: The upper band value.
        lower: The lower band value.
        fill: Optional color for the fill area (uses series default if not specified).
        styles: Optional per-point style overrides for lines and fill.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.data import RibbonData
        from streamlit_lightweight_charts_pro.data.styles import PerPointStyles, LineStyle, FillStyle

        # Basic data point
        data = RibbonData(time="2024-01-01", upper=110, lower=100)

        # Data point with custom styling
        data = RibbonData(
            time="2024-01-01",
            upper=110,
            lower=100,
            styles=PerPointStyles(
                upper_line=LineStyle(color="#ff0000", width=3),
                fill=FillStyle(color="rgba(255,0,0,0.2)", visible=True),
            ),
        )
        ```
    """

    REQUIRED_COLUMNS: ClassVar[set] = {"upper", "lower"}
    OPTIONAL_COLUMNS: ClassVar[set] = {"fill", "styles"}

    upper: Optional[float]
    lower: Optional[float]
    fill: Optional[str] = None
    styles: Optional[PerPointStyles] = None

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
