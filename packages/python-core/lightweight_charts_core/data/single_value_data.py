"""Single value data class for lightweight-charts-core.

This module provides the SingleValueData class for chart data with a single value.
"""

import math
from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.data import Data
from lightweight_charts_core.exceptions import RequiredFieldError


@dataclass
class SingleValueData(Data):
    """Data class for single value data points.

    Used for line charts, area charts, and other charts that display one value per time.

    Attributes:
        time: UNIX timestamp in seconds.
        value: The numeric value for this data point.
    """

    REQUIRED_COLUMNS: ClassVar[set] = {"value"}
    OPTIONAL_COLUMNS: ClassVar[set] = set()

    value: float

    def __post_init__(self):
        """Validate and normalize the value."""
        super().__post_init__()

        if isinstance(self.value, float) and math.isnan(self.value):
            self.value = 0.0
        elif self.value is None:
            raise RequiredFieldError("value")
