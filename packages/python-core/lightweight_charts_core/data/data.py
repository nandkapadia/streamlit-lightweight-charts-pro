"""Base data class for lightweight-charts-core.

This module provides the base Data class used by all chart data types.
"""

from dataclasses import dataclass
from typing import Any, ClassVar, Dict

from lightweight_charts_core.utils.data_utils import normalize_time
from lightweight_charts_core.utils.serialization import SerializableMixin


@dataclass
class Data(SerializableMixin):
    """Base data class for all chart data types.

    This class provides the foundation for all chart data types with automatic
    time normalization and serialization capabilities.

    Attributes:
        time: UNIX timestamp in seconds. Automatically normalized from various formats.

    Class Attributes:
        REQUIRED_COLUMNS: Set of required column names for DataFrame conversion.
        OPTIONAL_COLUMNS: Set of optional column names for DataFrame conversion.
    """

    REQUIRED_COLUMNS: ClassVar[set] = set()
    OPTIONAL_COLUMNS: ClassVar[set] = set()

    time: int

    def __post_init__(self):
        """Normalize time value to UNIX timestamp."""
        self.time = normalize_time(self.time)

    def asdict(self) -> Dict[str, Any]:
        """Serialize data to dictionary with camelCase keys."""
        return self._serialize_to_dict()
