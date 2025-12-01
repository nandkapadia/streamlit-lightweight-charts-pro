"""Histogram data classes for Streamlit Lightweight Charts Pro.

This module provides data classes for histogram chart data points with optional color
styling capabilities. The HistogramData class extends SingleValueData with color
validation and serialization features.

The module includes:
    - HistogramData: Data class for histogram chart data points with color styling
    - Color validation for hex and rgba color formats
    - Time normalization and serialization utilities

Key Features:
    - Automatic time normalization to UNIX timestamps
    - Optional color field with validation
    - NaN value handling (converts NaN to 0.0)
    - CamelCase serialization for frontend communication
    - Color format validation (hex and rgba)

Example Usage:
    ```python
    from lightweight_charts_core.data import HistogramData

    # Create histogram data point with color
    data = HistogramData(time="2024-01-01T00:00:00", value=100.0, color="#FF5722")

    # Create histogram data point without color
    data = HistogramData(time="2024-01-01T00:00:00", value=100.0)
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
@validated_field("color", str, validator="color", allow_none=True)
class HistogramData(SingleValueData):
    """Data class for histogram chart data points with optional color styling.

    This class extends SingleValueData to add optional color field for histogram chart
    styling. It provides validation for color formats and maintains all the
    functionality of the parent class while adding color-specific features
    for histogram visualization.

    The class automatically handles time normalization, value validation, and
    color format validation for frontend compatibility.

    Attributes:
        time (int): UNIX timestamp in seconds representing the data point time.
            This value is automatically normalized during initialization.
        value (float): The numeric value for this data point. NaN values are
            automatically converted to 0.0 for frontend compatibility.
        color (Optional[str]): Color for this data point in hex or rgba format.
            If not provided, the color field is not serialized. Valid formats
            include hex colors (e.g., "#2196F3") and rgba colors
            (e.g., "rgba(33,150,243,1)").

    Class Attributes:
        REQUIRED_COLUMNS (set): Empty set as all required columns are inherited
            from SingleValueData ("time" and "value").
        OPTIONAL_COLUMNS (set): Set containing "color" as the optional column
            for DataFrame conversion operations.

    Example:
        ```python
        from lightweight_charts_core.data import HistogramData

        # Create histogram data point with color
        data = HistogramData(time="2024-01-01T00:00:00", value=100.0, color="#FF5722")

        # Create histogram data point without color
        data = HistogramData(time="2024-01-01T00:00:00", value=100.0)
        ```

    Raises:
        ValueValidationError: If the color format is invalid (not hex or rgba).

    See Also:
        SingleValueData: Base class providing time normalization and value validation.
        LineData: Similar data class for line charts.
        AreaData: Similar data class for area charts.

    """

    # Define required columns for DataFrame conversion - none additional beyond
    # what's inherited from SingleValueData ("time" and "value")
    REQUIRED_COLUMNS: ClassVar[set] = set()

    # Define optional columns for DataFrame conversion - color is optional
    OPTIONAL_COLUMNS: ClassVar[set] = {"color"}

    # Optional color field for styling this histogram data point
    color: str | None = None
