"""
AreaData module for area series data points.

This module defines the AreaData class which represents data points for area series,
including optional color properties for line, top, and bottom colors.
"""

from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.data.single_value_data import SingleValueData
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
class AreaData(SingleValueData):
    """
    Data class for area series data points.

    This class represents a single data point for area series, extending SingleValueData
    with optional color properties for line, top, and bottom colors.

    Attributes:
        time: The time of the data point (inherited from SingleValueData)
        value: The price value of the data point (inherited from SingleValueData)
        line_color: Optional line color for this specific data point
        top_color: Optional top color for the area fill
        bottom_color: Optional bottom color for the area fill
    """

    # Required columns from SingleValueData
    REQUIRED_COLUMNS = set()

    # Optional columns specific to AreaData
    OPTIONAL_COLUMNS = {"line_color", "top_color", "bottom_color"}

    # Optional color properties
    line_color: Optional[str] = None
    top_color: Optional[str] = None
    bottom_color: Optional[str] = None

    def __post_init__(self):
        """Validate and normalize data after initialization."""
        # Call parent's __post_init__ for time normalization and value validation
        super().__post_init__()

        # Clean up and validate color properties
        for color_attr in ["line_color", "top_color", "bottom_color"]:
            color_value = getattr(self, color_attr)
            if color_value is not None and color_value.strip():
                if not is_valid_color(color_value):
                    raise ValueError(f"Invalid {color_attr} format: {color_value}")
            else:
                # Set to None if empty/whitespace
                setattr(self, color_attr, None)
