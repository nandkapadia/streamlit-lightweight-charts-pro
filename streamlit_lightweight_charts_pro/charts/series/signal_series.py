"""
Signal series for background coloring in charts.

This module provides the SignalSeries class for creating signal-based background
coloring in financial charts. SignalSeries creates vertical background bands
that span the entire chart height, colored based on signal values at specific
time points.
"""

from typing import List, Optional, Union

import pandas as pd

from streamlit_lightweight_charts_pro.charts.series.base import Series
from streamlit_lightweight_charts_pro.data.signal_data import SignalData
from streamlit_lightweight_charts_pro.type_definitions import ChartType
from streamlit_lightweight_charts_pro.utils import chainable_property


@chainable_property("neutral_color", str, validator="color")
@chainable_property("signal_color", str, validator="color")
@chainable_property("alert_color", str, validator="color", allow_none=True)
class SignalSeries(Series):
    """
    Signal series for background coloring in charts.

    SignalSeries creates vertical background bands that span the entire chart
    height, colored based on signal values at specific time points. This is
    commonly used in financial charts to highlight specific market conditions,
    trading signals, or events.

    The series takes signal data with binary or ternary values and maps them
    to background colors for specific time periods. The background bands
    appear across all chart panes and provide visual context for the data.

    Attributes:
        neutral_color: Background color for signal value=0 (default: "#ffffff")
        signal_color: Background color for signal value=1 (default: "#ff0000")
        alert_color: Background color for signal value=2 (optional, default: None)

    Example:
        ```python
        # Create signal data
        signal_data = [
            SignalData("2024-01-01", 0),  # Uses series-level neutral_color
            SignalData("2024-01-02", 1),  # Uses series-level signal_color
            SignalData("2024-01-03", 0, color="#e8f5e8"),  # Individual color overrides series color
            SignalData("2024-01-04", 1, color="#ffe8e8"),  # Individual color overrides series color
        ]

        # Create signal series
        signal_series = SignalSeries(
            data=signal_data,
            neutral_color="#ffffff",  # White for value=0 (when no individual color)
            signal_color="#ff0000"   # Red for value=1 (when no individual color)
        )

        # Add to chart
        chart.add_series(signal_series)
        ```
    """

    DATA_CLASS = SignalData

    @property
    def chart_type(self) -> ChartType:
        return ChartType.SIGNAL

    def __init__(
        self,
        data: Union[List[SignalData], pd.DataFrame, pd.Series],
        column_mapping: Optional[dict] = None,
        neutral_color: str = "#f0f0f0",
        signal_color: str = "#ff0000",
        alert_color: Optional[str] = None,
        visible: bool = True,
        price_scale_id: str = "right",
        pane_id: Optional[int] = 0,
    ):
        """
        Initialize SignalSeries.

        Args:
            data: List of SignalData objects, DataFrame, or Series.
            column_mapping: Optional column mapping for DataFrame input.
            neutral_color: Background color for value=0. Defaults to "#ffffff".
            signal_color: Background color for value=1. Defaults to "#ff0000".
            alert_color: Background color for value=2. Defaults to None.
            visible: Whether the signal series should be visible. Defaults to True.
            price_scale_id: Price scale ID. Defaults to "right".
            pane_id: Pane ID for multi-pane charts. Defaults to 0.

        Raises:
            ValueError: If data is empty or invalid.
        """
        super().__init__(
            data=data,
            column_mapping=column_mapping,
            visible=visible,
            price_scale_id=price_scale_id,
            pane_id=pane_id,
        )

        # Initialize signal-specific properties with default values
        self._neutral_color = neutral_color
        self._signal_color = signal_color
        self._alert_color = alert_color

    def __repr__(self) -> str:
        """String representation of the signal series."""
        return (
            f"SignalSeries(data_points={len(self.data)}, neutral_color='{self._neutral_color}',"
            f" signal_color='{self._signal_color}')"
        )
