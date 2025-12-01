"""Trade data model for visualizing trades on charts.

This module provides the TradeData class for representing individual trades
with entry and exit information, profit/loss calculations, and flexible
metadata storage. Trade visualization (markers, rectangles, tooltips) is
handled by the frontend using template-based rendering.

The module includes:
    - TradeData: Complete trade representation with entry/exit data
    - Automatic profit/loss calculations and percentage calculations
    - Flexible additional_data for custom trade metadata
    - Comprehensive serialization for frontend communication

Key Features:
    - Entry and exit time/price tracking with validation
    - Automatic profit/loss and percentage calculations
    - Flexible additional_data dictionary for custom fields
    - Tooltip text generation with trade details
    - Time normalization and validation
    - Frontend-compatible serialization with camelCase keys

Example Usage:
    ```python
    from lightweight_charts_core.data import TradeData

    # Create a long trade
    trade = TradeData(
        entry_time="2024-01-01T09:00:00",
        entry_price=100.0,
        exit_time="2024-01-01T16:00:00",
        exit_price=105.0,
        is_profitable=True,
        id="trade_001",
        additional_data={"quantity": 100, "trade_type": "long", "notes": "Strong momentum trade"},
    )

    # Access calculated properties
    print(f"P&L: ${trade.pnl:.2f}")
    print(f"P&L %: {trade.pnl_percentage:.1f}%")
    print(f"Profitable: {trade.is_profitable}")

    # Serialize for frontend
    trade_dict = trade.asdict()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from dataclasses import dataclass
from datetime import datetime
from typing import Any

# Third Party Imports
import pandas as pd

# Local Imports
from lightweight_charts_core.exceptions import (
    ExitTimeAfterEntryTimeError,
    ValueValidationError,
)
from lightweight_charts_core.utils.data_utils import to_utc_timestamp
from lightweight_charts_core.utils.serialization import SerializableMixin


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
        is_profitable (bool): Whether the trade was profitable (True) or not (False).
        id (str): Unique identifier for the trade (required).
        additional_data (Optional[Dict[str, Any]]): Optional dictionary containing
            any additional trade data such as quantity, trade_type, notes, etc.
            This provides maximum flexibility for custom fields.

    Note:
        - Exit time must be after entry time, otherwise
          ExitTimeAfterEntryTimeError is raised
        - Price values are automatically converted to appropriate numeric types
        - Time values are normalized to UTC timestamps for consistent handling
        - All additional data (quantity, trade_type, notes, etc.) should be
          provided in additional_data
        - The id field is required for trade identification

    """

    # Core fields required for trade visualization
    entry_time: pd.Timestamp | datetime | str | int | float
    entry_price: float | int
    exit_time: pd.Timestamp | datetime | str | int | float
    exit_price: float | int
    is_profitable: bool
    id: str  # Required for trade identification

    # All other data moved to additional_data for maximum flexibility
    additional_data: dict[str, Any] | None = None

    def __post_init__(self):
        """Post-initialization processing to normalize and validate trade data.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Converts price values to appropriate numeric types
        2. Validates that exit time is after entry time
        3. Ensures is_profitable is a boolean

        Raises:
            ExitTimeAfterEntryTimeError: If exit time is not after entry time.
            ValueValidationError: If time validation fails.

        """
        # Step 1: Convert price values to float for consistent calculations
        self.entry_price = float(self.entry_price)
        self.exit_price = float(self.exit_price)

        # Step 2: Ensure is_profitable is a boolean for consistent logic
        self.is_profitable = bool(self.is_profitable)

        # Step 3: Validate that exit time is after entry time
        entry_timestamp = to_utc_timestamp(self.entry_time)
        exit_timestamp = to_utc_timestamp(self.exit_time)

        # This is critical for trade logic - a trade cannot exit before it enters
        if isinstance(entry_timestamp, (int, float)) and isinstance(
            exit_timestamp,
            (int, float),
        ):
            if exit_timestamp <= entry_timestamp:
                raise ExitTimeAfterEntryTimeError()
        elif (
            isinstance(entry_timestamp, str)
            and isinstance(exit_timestamp, str)
            and exit_timestamp <= entry_timestamp
        ):
            raise ValueValidationError("Exit time", "must be after entry time")

    def generate_tooltip_text(self) -> str:
        """Generate tooltip text for the trade.

        Creates a comprehensive tooltip text that displays key trade information
        including entry/exit prices, quantity, profit/loss, and optional notes.

        Returns:
            str: Formatted tooltip text with trade details and P&L information.

        """
        pnl = self.pnl
        pnl_pct = self.pnl_percentage

        win_loss = "Win" if pnl > 0 else "Loss"

        tooltip_parts = [
            f"Entry: {self.entry_price:.2f}",
            f"Exit: {self.exit_price:.2f}",
        ]

        if self.additional_data and "quantity" in self.additional_data:
            tooltip_parts.append(f"Qty: {self.additional_data['quantity']:.2f}")

        tooltip_parts.extend(
            [
                f"P&L: {pnl:.2f} ({pnl_pct:.1f}%)",
                f"{win_loss}",
            ],
        )

        if self.additional_data and "notes" in self.additional_data:
            tooltip_parts.append(f"Notes: {self.additional_data['notes']}")

        return "\n".join(tooltip_parts)

    @property
    def pnl(self) -> float:
        """Get profit/loss amount from additional_data or calculate basic price difference.

        Returns:
            float: Profit/loss amount. Positive values indicate profit,
                negative values indicate loss.

        """
        if self.additional_data and "pnl" in self.additional_data:
            return float(self.additional_data["pnl"])

        return float(self.exit_price - self.entry_price)

    @property
    def pnl_percentage(self) -> float:
        """Get profit/loss percentage from additional_data or calculate basic percentage.

        Returns:
            float: Profit/loss percentage. Positive values indicate profit,
                negative values indicate loss.

        """
        if self.additional_data and "pnl_percentage" in self.additional_data:
            return float(self.additional_data["pnl_percentage"])

        if self.entry_price != 0:
            return ((self.exit_price - self.entry_price) / self.entry_price) * 100

        return 0.0

    def asdict(self) -> dict[str, Any]:
        """Serialize the trade data to a dict with camelCase keys for frontend.

        Returns:
            Dict[str, Any]: Serialized trade with camelCase keys ready for
                frontend consumption.

        """
        entry_timestamp = to_utc_timestamp(self.entry_time)
        exit_timestamp = to_utc_timestamp(self.exit_time)

        trade_dict = {
            "entryTime": entry_timestamp,
            "entryPrice": self.entry_price,
            "exitTime": exit_timestamp,
            "exitPrice": self.exit_price,
            "isProfitable": self.is_profitable,
            "id": self.id,
            "pnl": self.pnl,
            "pnlPercentage": self.pnl_percentage,
        }

        if self.additional_data:
            trade_dict.update(self.additional_data)

        return trade_dict
