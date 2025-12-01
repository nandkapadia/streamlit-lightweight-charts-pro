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
    from lightweight_charts_core.data import AreaData

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
from typing import ClassVar

# Third Party Imports
# (None in this module)
# Local Imports
from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.utils import validated_field


@dataclass
@validated_field("line_color", str, validator="color", allow_none=True)
@validated_field("top_color", str, validator="color", allow_none=True)
@validated_field("bottom_color", str, validator="color", allow_none=True)
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
        from lightweight_charts_core.data import AreaData

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

    See Also:
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
    line_color: str | None = None
    # Optional color field for the top of the area fill
    top_color: str | None = None
    # Optional color field for the bottom of the area fill
    bottom_color: str | None = None

    def __post_init__(self):
        """Post-initialization processing to strip whitespace from color values.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Calls the parent class __post_init__ to validate time and value
        2. Strips whitespace from color strings if provided
        3. Sets empty/whitespace-only values to None to avoid serialization

        Color validation is handled by @validated_field decorators.
        """
        # Call parent's __post_init__ to validate time and value fields
        super().__post_init__()

        # Strip whitespace from color strings and clean up empty values
        for color_attr in ["line_color", "top_color", "bottom_color"]:
            color_value = getattr(self, color_attr)
            if color_value is not None:
                # Strip whitespace
                stripped_value = color_value.strip()
                # Set to None if empty after stripping to avoid serialization
                setattr(self, color_attr, stripped_value if stripped_value else None)
