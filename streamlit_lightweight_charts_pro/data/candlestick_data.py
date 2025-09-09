from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.data.ohlc_data import OhlcData
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
class CandlestickData(OhlcData):
    """
    Data class for candlestick chart points.

    Inherits from OhlcData and adds optional color fields for styling.

    Attributes:
        time (int): UNIX timestamp in seconds.
        open (float): Opening price for the period.
        high (float): Highest price during the period.
        low (float): Lowest price during the period.
        close (float): Closing price for the period.
        color (Optional[str]): Color for this data point (hex or rgba).
        border_color (Optional[str]): Border color for this data point (hex or rgba).
        wick_color (Optional[str]): Wick color for this data point (hex or rgba).

    See also: OhlcData

    Note:
        - Color should be a valid hex (e.g., #2196F3) or rgba string (e.g., rgba(33,150,243,1)).
    """

    REQUIRED_COLUMNS = set()
    OPTIONAL_COLUMNS = {"color", "border_color", "wick_color"}

    color: Optional[str] = None
    border_color: Optional[str] = None
    wick_color: Optional[str] = None

    def __post_init__(self):
        super().__post_init__()
        # Validate all color properties if provided
        color_properties = ["color", "border_color", "wick_color"]

        for prop_name in color_properties:
            color_value = getattr(self, prop_name)
            if color_value is not None and color_value != "":
                if not is_valid_color(color_value):
                    raise ValueError(
                        f"Invalid color format for {prop_name}: {color_value!r}. "
                        "Must be hex or rgba."
                    )
