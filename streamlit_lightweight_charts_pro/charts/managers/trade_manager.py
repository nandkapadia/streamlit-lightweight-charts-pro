"""Trade visualization management for Chart component.

This module provides the TradeManager class which handles all trade-related
operations including adding trades and managing trade visualization.
"""

from typing import Any, Dict, List, Optional

from streamlit_lightweight_charts_pro.data.trade import TradeData
from streamlit_lightweight_charts_pro.exceptions import TypeValidationError, ValueValidationError
from streamlit_lightweight_charts_pro.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)


class TradeManager:
    """Manages trade visualization for a chart.

    This class provides centralized management of all trade-related operations
    for a chart, including trade storage and configuration.

    Attributes:
        trades: List of TradeData objects to visualize.
    """

    def __init__(self) -> None:
        """Initialize the trade manager.

        Creates a new TradeManager with an empty trades list.
        """
        self.trades: List[TradeData] = []

    def add_trades(self, trades: List[TradeData]) -> "TradeManager":
        """Add trade visualization to the chart.

        Adds TradeData objects to the manager for visualization. Each trade
        will be displayed with entry and exit markers, rectangles, lines,
        arrows, or zones based on the TradeVisualizationOptions.style
        configuration.

        Args:
            trades: List of TradeData objects to visualize on the chart.

        Returns:
            TradeManager: Self for method chaining.

        Raises:
            TypeValidationError: If trades is not a list.
            ValueValidationError: If any item in trades is not a TradeData object.

        Example:
            ```python
            from streamlit_lightweight_charts_pro.data import TradeData
            from streamlit_lightweight_charts_pro.type_definitions.enums import TradeType

            # Create TradeData objects
            trades = [
                TradeData(
                    entry_time="2024-01-01 10:00:00",
                    entry_price=100.0,
                    exit_time="2024-01-01 15:00:00",
                    exit_price=105.0,
                    quantity=100,
                    trade_type=TradeType.LONG,
                )
            ]

            # Add trade visualization
            manager.add_trades(trades)
            ```
        """
        if trades is None:
            raise TypeValidationError("trades", "list")
        if not isinstance(trades, list):
            raise TypeValidationError("trades", "list")

        # Validate that all items are TradeData objects
        for trade in trades:
            if not isinstance(trade, TradeData):
                raise ValueValidationError("trades", "all items must be TradeData objects")

        # Store trades for frontend processing
        self.trades.extend(trades)
        return self

    def add_trade(self, trade: TradeData) -> "TradeManager":
        """Add a single trade to the manager.

        Args:
            trade: TradeData object to add.

        Returns:
            TradeManager: Self for method chaining.

        Raises:
            TypeValidationError: If trade is not a TradeData instance.

        Example:
            ```python
            trade = TradeData(...)
            manager.add_trade(trade)
            ```
        """
        if not isinstance(trade, TradeData):
            raise TypeValidationError("trade", "TradeData instance")

        self.trades.append(trade)
        return self

    def get_trades_config(self) -> Optional[List[Dict[str, Any]]]:
        """Get trades configuration for frontend.

        Returns:
            List of trade dictionaries suitable for frontend consumption,
            or None if no trades exist.

        Example:
            ```python
            trades_config = manager.get_trades_config()
            if trades_config:
                # Use trades config
                pass
            ```
        """
        if not self.trades:
            return None

        return [trade.asdict() for trade in self.trades]

    def clear(self) -> "TradeManager":
        """Clear all trades from the manager.

        Returns:
            TradeManager: Self for method chaining.

        Example:
            ```python
            manager.clear()
            ```
        """
        self.trades.clear()
        return self

    def has_trades(self) -> bool:
        """Check if manager has any trades.

        Returns:
            True if manager has trades, False otherwise.

        Example:
            ```python
            if manager.has_trades():
                print("Manager has trades")
            ```
        """
        return len(self.trades) > 0

    def __len__(self) -> int:
        """Get the number of trades managed.

        Returns:
            Number of trades in the manager.
        """
        return len(self.trades)
