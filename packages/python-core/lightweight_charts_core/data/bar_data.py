"""Bar chart data model for streamlit-lightweight-charts.

This module provides the BarData class for representing individual bar chart
data points with OHLC (Open, High, Low, Close) values and optional color
customization.

The BarData class extends OhlcData to provide bar-specific functionality
while maintaining compatibility with the OHLC data structure used throughout
the charting library.

Example:
    ```python
    from lightweight_charts_core.data import BarData

    # Create a bar data point
    bar = BarData(
        time="2024-01-01",
        open=100.0,
        high=105.0,
        low=98.0,
        close=103.0,
        color="#4CAF50",  # Optional: Green bar
    )
    ```

"""

# Standard Imports
from dataclasses import dataclass
from typing import ClassVar

# Local Imports
from lightweight_charts_core.data.ohlc_data import OhlcData
from lightweight_charts_core.utils import validated_field


@dataclass
@validated_field("color", str, validator="color", allow_none=True)
class BarData(OhlcData):
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

    color: str | None = None
