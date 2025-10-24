"""Per-point style classes for custom series data points.

This module provides data classes for per-point style overrides that allow
users to customize line and fill styling on a per-data-point basis for
Band and Ribbon series.

These classes match the TypeScript interfaces in primitiveStyleUtils.ts
to ensure consistent JSON serialization.
"""

from dataclasses import asdict, dataclass
from typing import Literal, Optional

from streamlit_lightweight_charts_pro.exceptions import ValueValidationError
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
class LineStyle:
    """Per-point line style overrides.

    Attributes:
        color: Optional line color override (hex or rgba format).
        width: Optional line width override (1-4 pixels).
        style: Optional line style override (0=solid, 1=dotted, 2=dashed).
        visible: Optional visibility override for this line.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.data.styles import LineStyle

        # Red dotted line, 3px wide
        line_style = LineStyle(color="#ff0000", width=3, style=1, visible=True)
        ```
    """

    color: Optional[str] = None
    width: Optional[Literal[1, 2, 3, 4]] = None
    style: Optional[Literal[0, 1, 2]] = None
    visible: Optional[bool] = None

    def __post_init__(self):
        """Validate color format if provided."""
        if self.color is not None and self.color != "" and not is_valid_color(self.color):
            raise ValueValidationError("color", "Invalid color format")

    def asdict(self) -> dict:
        """Convert to dictionary, excluding None values.

        Returns:
            Dictionary with only non-None fields for JSON serialization.
        """
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class FillStyle:
    """Per-point fill style overrides.

    Attributes:
        color: Optional fill color override (hex or rgba format).
        visible: Optional visibility override for this fill.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.data.styles import FillStyle

        # Semi-transparent red fill
        fill_style = FillStyle(color="rgba(255,0,0,0.2)", visible=True)
        ```
    """

    color: Optional[str] = None
    visible: Optional[bool] = None

    def __post_init__(self):
        """Validate color format if provided."""
        if self.color is not None and self.color != "" and not is_valid_color(self.color):
            raise ValueValidationError("color", "Invalid color format")

    def asdict(self) -> dict:
        """Convert to dictionary, excluding None values.

        Returns:
            Dictionary with only non-None fields for JSON serialization.
        """
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class PerPointStyles:
    """Complete per-point style overrides for Band/Ribbon data points.

    This class contains optional style overrides for all lines and fills
    in Band and Ribbon primitives. Only specify the fields you want to override.

    Attributes:
        upper_line: Optional style overrides for upper line.
        middle_line: Optional style overrides for middle line (Band only).
        lower_line: Optional style overrides for lower line.
        upper_fill: Optional style overrides for upper fill (Band only).
        lower_fill: Optional style overrides for lower fill (Band only).
        fill: Optional style overrides for single fill (Ribbon/GradientRibbon).

    Example:
        ```python
        from streamlit_lightweight_charts_pro.data import BandData
        from streamlit_lightweight_charts_pro.data.styles import PerPointStyles, LineStyle, FillStyle

        # Data point with custom red upper line and semi-transparent fill
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

    upper_line: Optional[LineStyle] = None
    middle_line: Optional[LineStyle] = None
    lower_line: Optional[LineStyle] = None
    upper_fill: Optional[FillStyle] = None
    lower_fill: Optional[FillStyle] = None
    fill: Optional[FillStyle] = None

    def asdict(self) -> dict:
        """Convert to dictionary with camelCase keys for JSON serialization.

        Returns:
            Dictionary with camelCase keys matching TypeScript interface,
            excluding None values.

        Note:
            Python snake_case field names are converted to camelCase to match
            the TypeScript PerPointStyles interface (e.g., upper_line -> upperLine).
        """
        result = {}

        if self.upper_line is not None:
            result["upperLine"] = self.upper_line.asdict()
        if self.middle_line is not None:
            result["middleLine"] = self.middle_line.asdict()
        if self.lower_line is not None:
            result["lowerLine"] = self.lower_line.asdict()
        if self.upper_fill is not None:
            result["upperFill"] = self.upper_fill.asdict()
        if self.lower_fill is not None:
            result["lowerFill"] = self.lower_fill.asdict()
        if self.fill is not None:
            result["fill"] = self.fill.asdict()

        return result
