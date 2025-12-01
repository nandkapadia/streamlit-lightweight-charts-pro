"""Single value data classes for Streamlit Lightweight Charts Pro.

This module provides data classes for single value data points used in line charts,
area charts, and other chart types that display a single numeric value per time point.
The SingleValueData class extends the base Data class with value-specific validation
and serialization capabilities.

The module includes:
    - SingleValueData: Data class for single value data points
    - Value validation and NaN handling
    - Time normalization and serialization utilities

Key Features:
    - Automatic time normalization to UNIX timestamps
    - NaN value handling (converts NaN to 0.0)
    - Required field validation for value parameter
    - CamelCase serialization for frontend communication
    - Column management for DataFrame conversion operations

Example Usage:
    ```python
    from lightweight_charts_core.data import SingleValueData

    # Create single value data point
    data = SingleValueData(time="2024-01-01T00:00:00", value=100.0)

    # Serialize to frontend format
    serialized = data.asdict()  # {'time': 1704067200, 'value': 100.0}
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
import math
from dataclasses import dataclass
from typing import ClassVar

# Third Party Imports
# (None in this module)
# Local Imports
from lightweight_charts_core.data.data import Data
from lightweight_charts_core.exceptions import RequiredFieldError


@dataclass
class SingleValueData(Data):
    """Data class for single value data points used in line and area charts.

    This class represents a single numeric value at a specific time point, commonly used
    for line charts, area charts, and other chart types that display one value per time.
    It extends the base Data class with value-specific validation and NaN handling.

    The class automatically handles time normalization, value validation, and serialization
    to camelCase dictionaries suitable for frontend communication.

    Attributes:
        time (int): UNIX timestamp in seconds representing the data point time.
            This value is automatically normalized during initialization.
        value (float): The numeric value for this data point. NaN values are
            automatically converted to 0.0 for frontend compatibility.

    Class Attributes:
        REQUIRED_COLUMNS (set): Set containing "value" as the required column
            for DataFrame conversion operations.
        OPTIONAL_COLUMNS (set): Empty set indicating no optional columns
            are available for this data type.

    Example:
        ```python
        from lightweight_charts_core.data import SingleValueData

        # Create single value data point
        data = SingleValueData(time="2024-01-01T00:00:00", value=100.0)

        # Serialize for frontend
        serialized = data.asdict()  # {'time': 1704067200, 'value': 100.0}
        ```

    See Also:
        Data: Base class providing time normalization and serialization.
        LineData: Specialized single value data for line charts.
        AreaData: Specialized single value data for area charts.

    """

    # Define required columns for DataFrame conversion - only "value" is required
    # beyond the base "time" column inherited from Data class
    REQUIRED_COLUMNS: ClassVar[set] = {"value"}

    # Define optional columns for DataFrame conversion - none for this simple data type
    OPTIONAL_COLUMNS: ClassVar[set] = set()

    # The single numeric value for this data point
    value: float

    def __post_init__(self):
        """Post-initialization processing to validate and normalize values.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Calls the parent class __post_init__ to normalize the time value
        2. Validates the value field for None values
        3. Converts NaN values to 0.0 for frontend compatibility

        The method ensures that all data points have valid, non-NaN values
        that can be safely serialized and transmitted to the frontend.

        Raises:
            RequiredFieldError: If the value field is None or missing.

        """
        # Call parent's __post_init__ to normalize the time value to UNIX timestamp
        super().__post_init__()

        # Handle NaN values in the value field - convert to 0.0 for frontend compatibility
        if isinstance(self.value, float) and math.isnan(self.value):
            self.value = 0.0
        # Validate that value is not None - this is a required field
        elif self.value is None:
            raise RequiredFieldError("value")
