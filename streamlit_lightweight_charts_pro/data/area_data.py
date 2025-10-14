"""Area data classes for Streamlit Lightweight Charts Pro.

This module provides data classes for area chart data points with optional color
styling capabilities. The AreaData class extends SingleValueData with area-specific
color validation and serialization features.

The module includes:
    - AreaData: Data class for area chart data points with color styling
    - Color validation for line, top, and bottom colors
    - Time normalization and serialization utilities

Key Features:
    - Automatic time normalization to UNIX timestamps
    - Optional color fields with validation (line, top, bottom colors)
    - NaN value handling (converts NaN to 0.0)
    - CamelCase serialization for frontend communication
    - Color format validation (hex and rgba)

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.data import AreaData

    # Create area data point with colors
    data = AreaData(
        time="2024-01-01T00:00:00",
        value=100.0,
        line_color="#2196F3",
        top_color="rgba(33,150,243,0.3)",
        bottom_color="rgba(33,150,243,0.1)",
    )

    # Create area data point without colors
    data = AreaData(time="2024-01-01T00:00:00", value=100.0)
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from dataclasses import dataclass
from typing import ClassVar, Optional

# Third Party Imports
# (None in this module)
# Local Imports
from streamlit_lightweight_charts_pro.data.single_value_data import SingleValueData
from streamlit_lightweight_charts_pro.exceptions import ColorValidationError
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
class AreaData(SingleValueData):
    """Data class for area chart data points with optional color styling.

    This class extends SingleValueData to add optional color fields for area chart
    styling. It provides validation for color formats and maintains all the
    functionality of the parent class while adding area-specific color features
    for enhanced visualization.

    The class automatically handles time normalization, value validation, and
    color format validation for frontend compatibility.

    Attributes:
        time (int): UNIX timestamp in seconds representing the data point time.
            This value is automatically normalized during initialization.
        value (float): The numeric value for this data point. NaN values are
            automatically converted to 0.0 for frontend compatibility.
        line_color (Optional[str]): Color for the area line in hex or rgba format.
            If not provided, the line_color field is not serialized.
        top_color (Optional[str]): Color for the top of the area fill in hex or rgba format.
            If not provided, the top_color field is not serialized.
        bottom_color (Optional[str]): Color for the bottom of the area fill in hex or rgba format.
            If not provided, the bottom_color field is not serialized.

    Class Attributes:
        REQUIRED_COLUMNS (set): Empty set as all required columns are inherited
            from SingleValueData ("time" and "value").
        OPTIONAL_COLUMNS (set): Set containing area-specific color optional columns
            for DataFrame conversion operations.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.data import AreaData

        # Create area data point with colors
        data = AreaData(
            time="2024-01-01T00:00:00",
            value=100.0,
            line_color="#2196F3",
            top_color="rgba(33,150,243,0.3)",
            bottom_color="rgba(33,150,243,0.1)",
        )

        # Create area data point without colors
        data = AreaData(time="2024-01-01T00:00:00", value=100.0)
        ```

    Raises:
        ColorValidationError: If any color format is invalid (not hex or rgba).

    See also:
        SingleValueData: Base class providing time normalization and value validation.
        LineData: Similar data class for line charts.
        HistogramData: Similar data class for histogram charts.
    """

    # Define required columns for DataFrame conversion - none additional beyond
    # what's inherited from SingleValueData ("time" and "value")
    REQUIRED_COLUMNS: ClassVar[set] = set()

    # Define optional columns for DataFrame conversion - area-specific color fields
    OPTIONAL_COLUMNS: ClassVar[set] = {"line_color", "top_color", "bottom_color"}

    # Optional color field for the area line
    line_color: Optional[str] = None
    # Optional color field for the top of the area fill
    top_color: Optional[str] = None
    # Optional color field for the bottom of the area fill
    bottom_color: Optional[str] = None

    def __post_init__(self):
        """Post-initialization processing to validate color formats.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Calls the parent class __post_init__ to validate time and value
        2. Validates all color format fields if colors are provided
        3. Cleans up empty or whitespace-only color values

        The method ensures that if colors are specified, they follow valid
        hex or rgba format standards for frontend compatibility.

        Raises:
            ColorValidationError: If any color format is invalid.
        """
        # Call parent's __post_init__ to validate time and value fields
        super().__post_init__()

        # Clean up and validate all area-specific color properties
        for color_attr in ["line_color", "top_color", "bottom_color"]:
            color_value = getattr(self, color_attr)
            # Check if color is provided and not empty/whitespace
            if color_value is not None and color_value.strip():
                # Validate color format if color is provided
                if not is_valid_color(color_value):
                    raise ColorValidationError(color_attr, color_value)
            else:
                # Set to None if empty/whitespace to avoid serialization
                setattr(self, color_attr, None)
