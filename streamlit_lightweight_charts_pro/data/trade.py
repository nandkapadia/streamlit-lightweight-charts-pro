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
    from streamlit_lightweight_charts_pro.data import TradeData, TradeType

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
from typing import Any, Dict, Optional, Union

# Third Party Imports
import pandas as pd

# Local Imports
from streamlit_lightweight_charts_pro.exceptions import (
    ExitTimeAfterEntryTimeError,
    ValueValidationError,
)
from streamlit_lightweight_charts_pro.utils.data_utils import to_utc_timestamp
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
        is_profitable (bool): Whether the trade was profitable (True) or not (False).
        id (str): Unique identifier for the trade (required).
        additional_data (Optional[Dict[str, Any]]): Optional dictionary containing
            any additional trade data such as quantity, trade_type, notes, etc.
            This provides maximum flexibility for custom fields.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.data import TradeData, TradeType

        # Create a profitable long trade
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
        print(f"P&L: ${trade.pnl:.2f}")  # $500.00
        print(f"P&L %: {trade.pnl_percentage:.1f}%")  # 5.0%
        print(f"Profitable: {trade.is_profitable}")  # True

        # Serialize for frontend
        trade_dict = trade.asdict()
        ```

    Note:
        - Exit time must be after entry time, otherwise ExitTimeAfterEntryTimeError is raised
        - Price values are automatically converted to appropriate numeric types
        - Time values are normalized to UTC timestamps for consistent handling
        - All additional data (quantity, trade_type, notes, etc.) should be provided in additional_data
        - The id field is required for trade identification
    """

    # Core fields required for trade visualization
    entry_time: Union[pd.Timestamp, datetime, str, int, float]
    entry_price: Union[float, int]
    exit_time: Union[pd.Timestamp, datetime, str, int, float]
    exit_price: Union[float, int]
    is_profitable: bool
    id: str  # Required for trade identification

    # All other data moved to additional_data for maximum flexibility
    additional_data: Optional[Dict[str, Any]] = None

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
        # This ensures prices are always numeric, regardless of input type
        self.entry_price = float(self.entry_price)
        self.exit_price = float(self.exit_price)

        # Step 2: Ensure is_profitable is a boolean for consistent logic
        # Converts any truthy/falsy value to explicit True/False
        self.is_profitable = bool(self.is_profitable)

        # Step 3: Validate that exit time is after entry time
        # Convert times temporarily for validation only
        entry_timestamp = to_utc_timestamp(self.entry_time)
        exit_timestamp = to_utc_timestamp(self.exit_time)

        # This is critical for trade logic - a trade cannot exit before it enters
        if isinstance(entry_timestamp, (int, float)) and isinstance(
            exit_timestamp,
            (int, float),
        ):
            # Case 1: Both timestamps are numeric - compare directly
            if exit_timestamp <= entry_timestamp:
                raise ExitTimeAfterEntryTimeError()
        elif (
            isinstance(entry_timestamp, str)
            and isinstance(exit_timestamp, str)
            and exit_timestamp <= entry_timestamp
        ):
            # Case 2: Both timestamps are strings - compare lexicographically
            raise ValueValidationError("Exit time", "must be after entry time")

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
        # Step 1: Calculate profit/loss metrics for tooltip display
        # Uses the pnl and pnl_percentage properties which check additional_data first
        pnl = self.pnl
        pnl_pct = self.pnl_percentage

        # Step 2: Determine win/loss label based on P&L value
        # Positive P&L = Win, negative or zero = Loss
        win_loss = "Win" if pnl > 0 else "Loss"

        # Step 3: Build tooltip components with formatted trade information
        # Start with core entry/exit prices (always shown)
        tooltip_parts = [
            f"Entry: {self.entry_price:.2f}",
            f"Exit: {self.exit_price:.2f}",
        ]

        # Step 4: Add quantity if available in additional_data
        # Quantity is optional and only shown if user provided it
        if self.additional_data and "quantity" in self.additional_data:
            tooltip_parts.append(f"Qty: {self.additional_data['quantity']:.2f}")

        # Step 5: Add P&L information (always shown)
        # Shows both absolute P&L and percentage for complete picture
        tooltip_parts.extend(
            [
                f"P&L: {pnl:.2f} ({pnl_pct:.1f}%)",
                f"{win_loss}",
            ],
        )

        # Step 6: Add custom notes if provided for additional context
        # Notes are optional and only shown if user provided them
        if self.additional_data and "notes" in self.additional_data:
            tooltip_parts.append(f"Notes: {self.additional_data['notes']}")

        # Step 7: Join all parts with newlines for multi-line tooltip display
        return "\n".join(tooltip_parts)

    @property
    def pnl(self) -> float:
        """Get profit/loss amount from additional_data or calculate basic price difference.

        First checks if P&L is provided in additional_data, otherwise calculates
        basic price difference. This allows users to provide their own P&L calculation
        logic while maintaining a fallback for basic visualization.

        Returns:
            float: Profit/loss amount. Positive values indicate profit,
                negative values indicate loss.

        Example:
            ```python
            # With additional_data containing pnl
            trade = TradeData(..., additional_data={"pnl": 500.0})
            trade.pnl  # Returns: 500.0

            # Without additional_data, calculates basic difference
            trade = TradeData(entry_price=100, exit_price=105, ...)
            trade.pnl  # Returns: 5.0 (basic price difference)
            ```
        """
        # Check if P&L is provided in additional_data dictionary
        # User may provide custom P&L calculation (e.g., accounting for fees, quantity)
        if self.additional_data and "pnl" in self.additional_data:
            return float(self.additional_data["pnl"])

        # Fallback: Calculate basic price difference for visualization
        # Simple formula: exit_price - entry_price (doesn't account for quantity or fees)
        return float(self.exit_price - self.entry_price)

    @property
    def pnl_percentage(self) -> float:
        """Get profit/loss percentage from additional_data or calculate basic percentage.

        First checks if P&L percentage is provided in additional_data, otherwise
        calculates basic percentage based on price difference relative to entry price.

        Returns:
            float: Profit/loss percentage. Positive values indicate profit,
                negative values indicate loss.

        Example:
            ```python
            # With additional_data containing pnl_percentage
            trade = TradeData(..., additional_data={"pnl_percentage": 5.0})
            trade.pnl_percentage  # Returns: 5.0

            # Without additional_data, calculates basic percentage
            trade = TradeData(entry_price=100, exit_price=105, ...)
            trade.pnl_percentage  # Returns: 5.0 (5% gain)
            ```
        """
        # Check if P&L percentage is provided in additional_data dictionary
        # User may provide custom percentage calculation
        if self.additional_data and "pnl_percentage" in self.additional_data:
            return float(self.additional_data["pnl_percentage"])

        # Fallback: Calculate basic percentage from price difference
        # Formula: ((exit - entry) / entry) * 100
        if self.entry_price != 0:
            return ((self.exit_price - self.entry_price) / self.entry_price) * 100

        # Edge case: Return 0.0 if entry price is zero to avoid division by zero
        return 0.0

    def asdict(self) -> Dict[str, Any]:
        """Serialize the trade data to a dict with camelCase keys for frontend.

        Converts the trade to a dictionary format suitable for frontend
        communication. Converts times to UTC timestamps at serialization time
        to handle any changes made to entry_time or exit_time after construction.

        Returns:
            Dict[str, Any]: Serialized trade with camelCase keys ready for
                frontend consumption. Contains:
                - entryTime: Entry timestamp (converted from entry_time)
                - entryPrice: Entry price
                - exitTime: Exit timestamp (converted from exit_time)
                - exitPrice: Exit price
                - isProfitable: Profitability status
                - pnl: Profit/loss amount (from additional_data or calculated)
                - pnlPercentage: Profit/loss percentage (from additional_data or calculated)
                - All fields from additional_data (merged for template access)

        Example:
            ```python
            trade = TradeData(
                entry_time="2024-01-01",
                entry_price=100.0,
                exit_time="2024-01-01",
                exit_price=105.0,
                is_profitable=True,
                additional_data={"strategy": "momentum", "pnl": 500.0},
            )

            result = trade.asdict()
            # Returns: {"entryTime": 1704067200, "entryPrice": 100.0,
            #          "exitTime": 1704070800, "exitPrice": 105.0,
            #          "isProfitable": True, "pnl": 500.0, "strategy": "momentum"}
            ```
        """
        # Step 1: Convert times to UTC timestamps at serialization time
        # This ensures we always use current entry_time/exit_time values
        entry_timestamp = to_utc_timestamp(self.entry_time)
        exit_timestamp = to_utc_timestamp(self.exit_time)

        # Step 2: Create base trade dictionary with core fields
        # Uses camelCase keys for JavaScript/TypeScript frontend compatibility
        trade_dict = {
            "entryTime": entry_timestamp,  # Normalized UTC timestamp
            "entryPrice": self.entry_price,  # Entry price as float
            "exitTime": exit_timestamp,  # Normalized UTC timestamp
            "exitPrice": self.exit_price,  # Exit price as float
            "isProfitable": self.is_profitable,  # Profitability flag (required)
            "id": self.id,  # Unique trade identifier (required)
            "pnl": self.pnl,  # Profit/loss amount (calculated or from additional_data)
            "pnlPercentage": self.pnl_percentage,  # P&L % (calculated or from additional_data)
        }

        # Step 3: Merge additional data into the trade dict for template access
        # This allows frontend templates to access custom fields like quantity, notes, etc.
        if self.additional_data:
            trade_dict.update(self.additional_data)

        return trade_dict
