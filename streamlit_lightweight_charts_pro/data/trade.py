"""Trade data model for visualizing trades on charts."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional, Union

import pandas as pd

from streamlit_lightweight_charts_pro.data.marker import BarMarker
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    MarkerPosition,
    MarkerShape,
    TradeType,
)
from streamlit_lightweight_charts_pro.utils.data_utils import from_utc_timestamp, to_utc_timestamp


@dataclass
class TradeData:
    """
    Represents a single trade with entry and exit information.

    Attributes:
        entry_time: Entry datetime (accepts pd.Timestamp, datetime, or string)
        entry_price: Entry price
        exit_time: Exit datetime (accepts pd.Timestamp, datetime, or string)
        exit_price: Exit price
        quantity: Trade quantity/size
        trade_type: Type of trade (long or short)
        id: Optional trade identifier
        notes: Optional trade notes
        text: Optional tooltip text for the trade
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
        self.entry_price = float(self.entry_price)
        self.exit_price = float(self.exit_price)
        self.quantity = int(self.quantity)

        # Convert times to UTC timestamps
        self._entry_timestamp = to_utc_timestamp(self.entry_time)
        self._exit_timestamp = to_utc_timestamp(self.exit_time)

        # Ensure exit time is after entry time
        if isinstance(self._entry_timestamp, (int, float)) and isinstance(
            self._exit_timestamp, (int, float)
        ):
            if self._exit_timestamp <= self._entry_timestamp:
                raise ValueError("Exit time must be after entry time")
        elif isinstance(self._entry_timestamp, str) and isinstance(self._exit_timestamp, str):
            # Compare as strings for date strings
            if self._exit_timestamp <= self._entry_timestamp:
                raise ValueError("Exit time must be after entry time")

        # Convert trade type to enum
        if isinstance(self.trade_type, str):
            self.trade_type = TradeType(self.trade_type.lower())

        # Generate tooltip text if not provided
        if self.text is None:
            self.text = self.generate_tooltip_text()

    def generate_tooltip_text(self) -> str:
        """Generate tooltip text for the trade."""
        pnl = self.pnl
        pnl_pct = self.pnl_percentage
        win_loss = "Win" if pnl > 0 else "Loss"

        # Format dates
        from_utc_timestamp(self._entry_timestamp)
        from_utc_timestamp(self._exit_timestamp)

        tooltip_parts = [
            f"Entry: {self.entry_price:.2f}",
            f"Exit: {self.exit_price:.2f}",
            f"Qty: {self.quantity:.2f}",
            f"P&L: {pnl:.2f} ({pnl_pct:.1f}%)",
            f"{win_loss}",
        ]

        # Add custom notes if provided
        if self.notes:
            tooltip_parts.append(f"Notes: {self.notes}")

        return "\n".join(tooltip_parts)

    @property
    def pnl(self) -> float:
        """Calculate profit/loss for the trade."""
        if self.trade_type == TradeType.LONG:
            return (self.exit_price - self.entry_price) * self.quantity
        else:  # SHORT
            return (self.entry_price - self.exit_price) * self.quantity

    @property
    def pnl_percentage(self) -> float:
        """Calculate profit/loss percentage."""
        if self.trade_type == TradeType.LONG:
            return ((self.exit_price - self.entry_price) / self.entry_price) * 100
        else:  # SHORT
            return ((self.entry_price - self.exit_price) / self.entry_price) * 100

    @property
    def is_profitable(self) -> bool:
        """Check if trade is profitable."""
        return self.pnl > 0

    def to_markers(
        self,
        entry_color: Optional[str] = None,
        exit_color: Optional[str] = None,
        show_pnl: bool = True,
    ) -> list:
        """
        Convert trade to marker representations.

        Args:
            entry_color: Color for entry marker
            exit_color: Color for exit marker
            show_pnl: Whether to show P&L in marker text

        Returns:
            List of marker dictionaries
        """
        # Default colors based on trade type and profit
        if entry_color is None:
            entry_color = "#2196F3" if self.trade_type == TradeType.LONG else "#FF9800"

        if exit_color is None:
            exit_color = "#4CAF50" if self.is_profitable else "#F44336"

        markers = []

        # Entry marker
        entry_text = f"Entry: ${self.entry_price:.2f}"
        if self.id:
            entry_text = f"{self.id} - {entry_text}"

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

        # Exit marker
        exit_text = f"Exit: ${self.exit_price:.2f}"
        if show_pnl:
            exit_text += f" (P&L: ${self.pnl:.2f}, {self.pnl_percentage:+.1f}%)"

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

        return markers

    def asdict(self) -> Dict[str, Any]:
        """
        Serialize the trade data to a dict with camelCase keys for frontend.

        Converts the trade to a dictionary format suitable for frontend
        communication. Returns the trade data in the format expected by
        the frontend TradeConfig interface.

        Returns:
            Dict[str, Any]: Serialized trade with camelCase keys ready for
                frontend consumption.
        """
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

        # Add optional fields if they exist
        if self.id:
            trade_dict["id"] = self.id
        if self.notes:
            trade_dict["notes"] = self.notes
        if self.text:
            trade_dict["text"] = self.text

        return trade_dict
