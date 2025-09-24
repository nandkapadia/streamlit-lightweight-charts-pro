from dataclasses import dataclass
from typing import ClassVar, Optional

from streamlit_lightweight_charts_pro.data.single_value_data import SingleValueData
from streamlit_lightweight_charts_pro.exceptions import ValueValidationError
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
class HistogramData(SingleValueData):
    """Data class for a single value (line/area/histogram) chart point.

    Inherits from SingleValueData and adds an optional color field.

    Attributes:
        time (int): UNIX timestamp in seconds.
        value (float): Data value. NaN is converted to 0.0.
        color (Optional[str]): Color for this data point (hex or rgba).
                               If not provided, not serialized.

    See also: SingleValueData

    Note:
        - Color should be a valid hex (e.g., #2196F3) or rgba string (e.g., rgba(33,150,243,1)).
    """

    REQUIRED_COLUMNS: ClassVar[set] = set()
    OPTIONAL_COLUMNS: ClassVar[set] = {"color"}

    color: Optional[str] = None

    def __post_init__(self):
        super().__post_init__()
        if self.color is not None and self.color != "" and not is_valid_color(self.color):
            raise ValueValidationError("color", "Invalid color format")
