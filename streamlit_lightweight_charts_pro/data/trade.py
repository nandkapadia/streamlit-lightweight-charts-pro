"""Trade data model for visualizing trades on charts.

This module provides the TradeData class for representing individual trades
with entry and exit information, profit/loss calculations, and visualization
capabilities. It supports converting trades to marker representations for
displaying buy/sell signals and trade outcomes on charts.

The module includes:
    - TradeData: Complete trade representation with entry/exit data
    - TradeType enum support for long/short trade classification
    - Automatic profit/loss calculations and percentage calculations
    - Marker conversion for visual representation on charts
    - Comprehensive serialization for frontend communication

Key Features:
    - Entry and exit time/price tracking with validation
    - Automatic profit/loss and percentage calculations
    - Trade type classification (long/short)
    - Marker generation for visual representation
    - Tooltip text generation with trade details
    - Time normalization and validation
    - Frontend-compatible serialization

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro.data import TradeData, TradeType

    # Create a long trade
    trade = TradeData(
        entry_time="2024-01-01T09:00:00",
        entry_price=100.0,
        exit_time="2024-01-01T16:00:00",
        exit_price=105.0,
        quantity=100,
        trade_type=TradeType.LONG,
        id="trade_001",
        notes="Strong momentum trade",
    )

    # Access calculated properties
    print(f"P&L: ${trade.pnl:.2f}")
    print(f"P&L %: {trade.pnl_percentage:.1f}%")
    print(f"Profitable: {trade.is_profitable}")

    # Convert to markers for chart display
    markers = trade.to_markers()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional, Union

# Third Party Imports
import pandas as pd

# Local Imports
from streamlit_lightweight_charts_pro.data.marker import BarMarker
from streamlit_lightweight_charts_pro.exceptions import (
    ExitTimeAfterEntryTimeError,
    ValueValidationError,
)
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    MarkerPosition,
    MarkerShape,
    TradeType,
)
from streamlit_lightweight_charts_pro.utils.data_utils import from_utc_timestamp, to_utc_timestamp
from streamlit_lightweight_charts_pro.utils.serialization import SerializableMixin


@dataclass
class TradeData(SerializableMixin):
    """Represents a single trade with entry and exit information.

    This class provides a comprehensive representation of a trading transaction,
    including entry and exit details, profit/loss calculations, and visualization
    capabilities. It supports both long and short trades with automatic P&L
    calculations and marker generation for chart display.

    The class automatically validates trade data, normalizes time values, and
    provides computed properties for profit/loss analysis. It can convert trades
    to marker representations for visual display on charts.

    Attributes:
        entry_time (Union[pd.Timestamp, datetime, str, int, float]): Entry time
            in various formats (automatically normalized to UTC timestamp).
        entry_price (Union[float, int]): Entry price for the trade.
        exit_time (Union[pd.Timestamp, datetime, str, int, float]): Exit time
            in various formats (automatically normalized to UTC timestamp).
        exit_price (Union[float, int]): Exit price for the trade.
        quantity (Union[float, int]): Trade quantity/size (converted to int).
        trade_type (Union[TradeType, str]): Type of trade (LONG or SHORT).
            Defaults to LONG. String values are converted to enum.
        id (Optional[str]): Optional unique identifier for the trade.
        notes (Optional[str]): Optional notes or comments about the trade.
        text (Optional[str]): Optional custom tooltip text. If not provided,
            auto-generated based on trade details.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.data import TradeData, TradeType

        # Create a profitable long trade
        trade = TradeData(
            entry_time="2024-01-01T09:00:00",
            entry_price=100.0,
            exit_time="2024-01-01T16:00:00",
            exit_price=105.0,
            quantity=100,
            trade_type=TradeType.LONG,
            id="trade_001",
        )

        # Access calculated properties
        print(f"P&L: ${trade.pnl:.2f}")  # $500.00
        print(f"P&L %: {trade.pnl_percentage:.1f}%")  # 5.0%
        print(f"Profitable: {trade.is_profitable}")  # True

        # Convert to markers for chart display
        markers = trade.to_markers()
        ```

    Note:
        - Exit time must be after entry time, otherwise ExitTimeAfterEntryTimeError is raised
        - Price and quantity values are automatically converted to appropriate numeric types
        - Time values are normalized to UTC timestamps for consistent handling
        - Trade type strings are converted to TradeType enum values
    """

    entry_time: Union[pd.Timestamp, datetime, str, int, float]
    entry_price: Union[float, int]
    exit_time: Union[pd.Timestamp, datetime, str, int, float]
    exit_price: Union[float, int]
    quantity: Union[float, int]
    trade_type: Union[TradeType, str] = TradeType.LONG
    id: Optional[str] = None
    notes: Optional[str] = None
    text: Optional[str] = None

    def __post_init__(self):
        """Post-initialization processing to normalize and validate trade data.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Converts price and quantity values to appropriate numeric types
        2. Normalizes entry and exit times to UTC timestamps
        3. Validates that exit time is after entry time
        4. Converts trade type string to enum if needed
        5. Generates tooltip text if not provided

        Raises:
            ExitTimeAfterEntryTimeError: If exit time is not after entry time.
            ValueValidationError: If time validation fails.
        """
        # Convert numeric values to appropriate types for consistent calculations
        self.entry_price = float(self.entry_price)
        self.exit_price = float(self.exit_price)
        self.quantity = int(self.quantity)

        # Convert times to UTC timestamps for consistent handling
        # This ensures all time values are in the same format for comparison
        self._entry_timestamp = to_utc_timestamp(self.entry_time)
        self._exit_timestamp = to_utc_timestamp(self.exit_time)

        # Validate that exit time is after entry time - critical for trade logic
        if isinstance(self._entry_timestamp, (int, float)) and isinstance(
            self._exit_timestamp,
            (int, float),
        ):
            # Compare numeric timestamps directly
            if self._exit_timestamp <= self._entry_timestamp:
                raise ExitTimeAfterEntryTimeError()
        elif (
            isinstance(self._entry_timestamp, str)
            and isinstance(self._exit_timestamp, str)
            and self._exit_timestamp <= self._entry_timestamp
        ):
            # Compare string timestamps lexicographically
            raise ValueValidationError("Exit time", "must be after entry time")

        # Convert trade type string to enum if needed for type safety
        if isinstance(self.trade_type, str):
            self.trade_type = TradeType(self.trade_type.lower())

        # Generate tooltip text if not provided - creates informative hover text
        if self.text is None:
            self.text = self.generate_tooltip_text()

    def generate_tooltip_text(self) -> str:
        """Generate tooltip text for the trade.

        Creates a comprehensive tooltip text that displays key trade information
        including entry/exit prices, quantity, profit/loss, and optional notes.
        The tooltip is designed to be informative and easy to read when displayed
        on charts.

        Returns:
            str: Formatted tooltip text with trade details and P&L information.

        Example:
            ```python
            trade = TradeData(
                entry_time="2024-01-01",
                entry_price=100.0,
                exit_time="2024-01-01",
                exit_price=105.0,
                quantity=100,
                trade_type=TradeType.LONG,
            )
            tooltip = trade.generate_tooltip_text()
            # Returns: "Entry: 100.00\nExit: 105.00\nQty: 100.00\nP&L: 500.00 (5.0%)\nWin"
            ```
        """
        # Calculate profit/loss metrics for tooltip display
        pnl = self.pnl
        pnl_pct = self.pnl_percentage
        win_loss = "Win" if pnl > 0 else "Loss"

        # Format timestamps for display (though not currently used in tooltip)
        # These could be used in future versions for time display
        from_utc_timestamp(self._entry_timestamp)
        from_utc_timestamp(self._exit_timestamp)

        # Build tooltip components with formatted trade information
        tooltip_parts = [
            f"Entry: {self.entry_price:.2f}",
            f"Exit: {self.exit_price:.2f}",
            f"Qty: {self.quantity:.2f}",
            f"P&L: {pnl:.2f} ({pnl_pct:.1f}%)",
            f"{win_loss}",
        ]

        # Add custom notes if provided for additional context
        if self.notes:
            tooltip_parts.append(f"Notes: {self.notes}")

        # Join all parts with newlines for multi-line tooltip display
        return "\n".join(tooltip_parts)

    @property
    def pnl(self) -> float:
        """Calculate profit/loss for the trade.

        Computes the absolute profit or loss amount based on the trade type.
        For long trades, profit is calculated as (exit_price - entry_price) * quantity.
        For short trades, profit is calculated as (entry_price - exit_price) * quantity.

        Returns:
            float: Profit/loss amount in currency units. Positive values indicate
                profit, negative values indicate loss.

        Example:
            ```python
            # Long trade: entry=100, exit=105, quantity=100
            trade.pnl  # Returns: 500.0

            # Short trade: entry=100, exit=95, quantity=100
            trade.pnl  # Returns: 500.0
            ```
        """
        if self.trade_type == TradeType.LONG:
            # Long trade: profit when exit price > entry price
            return (self.exit_price - self.entry_price) * self.quantity
        # SHORT trade: profit when entry price > exit price
        return (self.entry_price - self.exit_price) * self.quantity

    @property
    def pnl_percentage(self) -> float:
        """Calculate profit/loss percentage.

        Computes the percentage return based on the entry price and trade type.
        The percentage is calculated relative to the entry price, providing
        a standardized measure of trade performance.

        Returns:
            float: Profit/loss percentage. Positive values indicate profit,
                negative values indicate loss.

        Example:
            ```python
            # Long trade: entry=100, exit=105
            trade.pnl_percentage  # Returns: 5.0

            # Short trade: entry=100, exit=95
            trade.pnl_percentage  # Returns: 5.0
            ```
        """
        if self.trade_type == TradeType.LONG:
            # Long trade: percentage based on entry price
            return ((self.exit_price - self.entry_price) / self.entry_price) * 100
        # SHORT trade: percentage based on entry price
        return ((self.entry_price - self.exit_price) / self.entry_price) * 100

    @property
    def is_profitable(self) -> bool:
        """Check if trade is profitable.

        Determines whether the trade resulted in a profit or loss based on
        the calculated P&L amount.

        Returns:
            bool: True if the trade is profitable (P&L > 0), False otherwise.

        Example:
            ```python
            # Profitable trade
            trade.is_profitable  # Returns: True

            # Losing trade
            trade.is_profitable  # Returns: False
            ```
        """
        return self.pnl > 0

    def to_markers(
        self,
        entry_color: Optional[str] = None,
        exit_color: Optional[str] = None,
        show_pnl: bool = True,
    ) -> list:
        """Convert trade to marker representations for chart display.

        Creates visual markers for the entry and exit points of the trade,
        including appropriate colors, shapes, and positioning based on the
        trade type. The markers can be added to charts to visualize trade
        execution and outcomes.

        Args:
            entry_color (Optional[str]): Color for entry marker. If None,
                uses blue (#2196F3) for long trades, orange (#FF9800) for short trades.
            exit_color (Optional[str]): Color for exit marker. If None,
                uses green (#4CAF50) for profitable trades, red (#F44336) for losses.
            show_pnl (bool): Whether to show P&L information in exit marker text.
                Defaults to True.

        Returns:
            List[BarMarker]: List containing entry and exit markers for the trade.

        Example:
            ```python
            trade = TradeData(
                entry_time="2024-01-01",
                entry_price=100.0,
                exit_time="2024-01-01",
                exit_price=105.0,
                quantity=100,
                trade_type=TradeType.LONG,
            )

            # Get markers with default colors
            markers = trade.to_markers()

            # Get markers with custom colors
            markers = trade.to_markers(entry_color="#0000FF", exit_color="#00FF00", show_pnl=False)
            ```
        """
        # Set default colors based on trade type and profitability
        # Long trades use blue for entry, short trades use orange
        if entry_color is None:
            entry_color = "#2196F3" if self.trade_type == TradeType.LONG else "#FF9800"

        # Exit markers use green for profitable trades, red for losses
        if exit_color is None:
            exit_color = "#4CAF50" if self.is_profitable else "#F44336"

        # Initialize list to store both entry and exit markers
        markers = []

        # Create entry marker with trade type-specific positioning and shape
        entry_text = f"Entry: ${self.entry_price:.2f}"
        # Include trade ID in text if available for better identification
        if self.id:
            entry_text = f"{self.id} - {entry_text}"

        # Entry marker positioned below bar for long trades, above for short trades
        # Uses arrow up for long trades (buy signal), arrow down for short trades (sell signal)
        entry_marker = BarMarker(
            time=self._entry_timestamp,
            position=(
                MarkerPosition.BELOW_BAR
                if self.trade_type == TradeType.LONG
                else MarkerPosition.ABOVE_BAR
            ),
            shape=(
                MarkerShape.ARROW_UP
                if self.trade_type == TradeType.LONG
                else MarkerShape.ARROW_DOWN
            ),
            color=entry_color,
            text=entry_text,
        )
        markers.append(entry_marker)

        # Create exit marker with P&L information if requested
        exit_text = f"Exit: ${self.exit_price:.2f}"
        # Add P&L information to exit marker if show_pnl is True
        if show_pnl:
            exit_text += f" (P&L: ${self.pnl:.2f}, {self.pnl_percentage:+.1f}%)"

        # Exit marker positioned above bar for long trades, below for short trades
        # Uses arrow down for long trades (sell signal), arrow up for short trades (cover signal)
        exit_marker = BarMarker(
            time=self._exit_timestamp,
            position=(
                MarkerPosition.ABOVE_BAR
                if self.trade_type == TradeType.LONG
                else MarkerPosition.BELOW_BAR
            ),
            shape=(
                MarkerShape.ARROW_DOWN
                if self.trade_type == TradeType.LONG
                else MarkerShape.ARROW_UP
            ),
            color=exit_color,
            text=exit_text,
        )
        markers.append(exit_marker)

        # Return list containing both entry and exit markers for chart display
        return markers

    def asdict(self) -> Dict[str, Any]:
        """Serialize the trade data to a dict with camelCase keys for frontend.

        Converts the trade to a dictionary format suitable for frontend
        communication. The serialization includes all trade information
        with computed properties like P&L and profitability status.
        Optional fields are only included if they have values.

        Returns:
            Dict[str, Any]: Serialized trade with camelCase keys ready for
                frontend consumption. Contains:
                - entryTime: Entry timestamp
                - entryPrice: Entry price
                - exitTime: Exit timestamp
                - exitPrice: Exit price
                - quantity: Trade quantity
                - tradeType: Trade type (long/short)
                - isProfitable: Profitability status
                - pnl: Profit/loss amount
                - pnlPercentage: Profit/loss percentage
                - id: Trade ID (if provided)
                - notes: Trade notes (if provided)
                - text: Tooltip text (if provided)

        Example:
            ```python
            trade = TradeData(
                entry_time="2024-01-01",
                entry_price=100.0,
                exit_time="2024-01-01",
                exit_price=105.0,
                quantity=100,
                trade_type=TradeType.LONG,
            )

            result = trade.asdict()
            # Returns: {"entryTime": 1704067200, "entryPrice": 100.0, ...}
            ```
        """
        # Create base trade dictionary with required fields and computed properties
        trade_dict = {
            "entryTime": self._entry_timestamp,
            "entryPrice": self.entry_price,
            "exitTime": self._exit_timestamp,
            "exitPrice": self.exit_price,
            "quantity": self.quantity,
            "tradeType": self.trade_type.value.lower(),
            "isProfitable": self.is_profitable,
            "pnl": self.pnl,
            "pnlPercentage": self.pnl_percentage,
        }

        # Add optional fields only if they have values to keep serialization clean
        if self.id:
            trade_dict["id"] = self.id
        if self.notes:
            trade_dict["notes"] = self.notes
        if self.text:
            trade_dict["text"] = self.text

        return trade_dict
