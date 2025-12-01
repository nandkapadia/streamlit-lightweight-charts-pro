"""Signal data for background coloring in charts.

This module provides the SignalData class for creating signal-based background
coloring in financial charts. Signal data consists of time points with binary
or ternary values that determine background colors for specific time periods.
"""

from dataclasses import dataclass
from typing import ClassVar

from lightweight_charts_core.data.single_value_data import SingleValueData
from lightweight_charts_core.utils import validated_field


@dataclass
@validated_field("color", str, validator="color", allow_none=True)
class SignalData(SingleValueData):
    """Signal data point for background coloring.

    SignalData represents a single time point with a signal value that determines
    the background color for that time period. This is commonly used in financial
    charts to highlight specific market conditions, trading signals, or events.

    Attributes:
        time (Union[str, datetime]): Time point for the signal. Can be a string
            in ISO format (YYYY-MM-DD) or a datetime object.
        value (Union[int, bool]): Signal value that determines background color.
            Accepts both integers and booleans (converted to int automatically):
            - 0 or False: First color (typically neutral/gray)
            - 1 or True: Second color (typically signal/blue)
            - 2: Third color (optional, for ternary signals/alerts)

    Example:
        ```python
        # Create signal data for background coloring
        # Using integers (0, 1, 2)
        signal_data_int = [
            SignalData("2024-01-01", 0),  # Neutral (uses neutral_color)
            SignalData("2024-01-02", 1),  # Signal (uses signal_color)
            SignalData("2024-01-03", 0, color="#e8f5e8"),  # Custom light green
            SignalData("2024-01-04", 1, color="#ffe8e8"),  # Custom light red
        ]

        # Using booleans (False, True) - more natural for binary signals
        signal_data_bool = [
            SignalData("2024-01-01", False),  # Neutral (False → 0)
            SignalData("2024-01-02", True),  # Signal (True → 1)
            SignalData("2024-01-03", False),  # Neutral
            SignalData("2024-01-04", True),  # Signal
        ]

        # Use with SignalSeries
        signal_series = SignalSeries(
            data=signal_data_bool,  # Works with both int and bool values
            neutral_color="#808080",  # Gray for False/0 (neutral)
            signal_color="#2962FF",  # Blue for True/1 (signal)
        )
        ```

    """

    REQUIRED_COLUMNS: ClassVar[set] = set()
    OPTIONAL_COLUMNS: ClassVar[set] = {"color"}

    color: str | None = None
