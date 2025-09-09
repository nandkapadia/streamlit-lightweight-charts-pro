"""
Signal data for background coloring in charts.

This module provides the SignalData class for creating signal-based background
coloring in financial charts. Signal data consists of time points with binary
or ternary values that determine background colors for specific time periods.
"""

from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.data.single_value_data import SingleValueData
from streamlit_lightweight_charts_pro.utils.data_utils import is_valid_color


@dataclass
class SignalData(SingleValueData):
    """
    Signal data point for background coloring.

    SignalData represents a single time point with a signal value that determines
    the background color for that time period. This is commonly used in financial
    charts to highlight specific market conditions, trading signals, or events.

    Attributes:
        time (Union[str, datetime]): Time point for the signal. Can be a string
            in ISO format (YYYY-MM-DD) or a datetime object.
        value (int): Signal value that determines background color.
            0: First color (typically neutral/white)
            1: Second color (typically highlight color)
            2: Third color (optional, for ternary signals)

    Example:
        ```python
        # Create signal data for background coloring
        signal_data = [
            SignalData("2024-01-01", 0),  # Uses series-level color for value=0
            SignalData("2024-01-02", 1),  # Uses series-level color for value=1
            SignalData("2024-01-03", 0, color="#e8f5e8"),  # Individual light green color
            SignalData("2024-01-04", 1, color="#ffe8e8"),  # Individual light red color
        ]

        # Use with SignalSeries
        signal_series = SignalSeries(
            data=signal_data,
            neutral_color="#ffffff",  # White for value=0 (when no individual color)
            signal_color="#ff0000"   # Red for value=1 (when no individual color)
        )
        ```
    """

    REQUIRED_COLUMNS = set()
    OPTIONAL_COLUMNS = {"color"}

    color: Optional[str] = None

    def __post_init__(self):
        super().__post_init__()
        if self.color is not None and self.color != "":
            if not is_valid_color(self.color):
                raise ValueError(f"Invalid color format: {self.color!r}. Must be hex or rgba.")
