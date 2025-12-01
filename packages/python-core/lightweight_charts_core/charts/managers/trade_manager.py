"""Trade management for Chart component.

This module handles trade data storage and visualization configuration
for chart trades.
"""

from typing import Any

from lightweight_charts_core.data.trade import TradeData
from lightweight_charts_core.exceptions import (
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)


class TradeManager:
    """Manages trade data and visualization for a Chart.

    This class handles all trade-related operations including:
    - Storing trade data
    - Validating trade data
    - Serializing trade data for frontend

    Attributes:
        trades: List of TradeData objects to be visualized.

    """

    def __init__(self):
        """Initialize the TradeManager."""
        self.trades: list[TradeData] = []

    def add_trades(self, trades: list[TradeData]) -> None:
        """Add trade visualization to the chart.

        Converts TradeData objects to visual elements. Each trade will be
        displayed with entry and exit markers, rectangles, lines, arrows, or
        zones based on TradeVisualizationOptions configuration.

        Args:
            trades: List of TradeData objects to visualize on the chart.

        Raises:
            TypeValidationError: If trades is not a list.
            ValueValidationError: If any item in trades is not a TradeData object.

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
        self.trades = trades

    def has_trades(self) -> bool:
        """Check if there are any trades to visualize.

        Returns:
            True if there are trades, False otherwise.

        """
        return len(self.trades) > 0

    def to_frontend_config(
        self,
        trade_visualization_options: Any | None = None,
    ) -> dict[str, Any] | None:
        """Convert trades to frontend configuration.

        Args:
            trade_visualization_options: Optional TradeVisualizationOptions
                configuration.

        Returns:
            Dictionary with trade configuration or None if no trades exist.

        """
        if not self.has_trades():
            return None

        result: dict[str, Any] = {
            "trades": [trade.asdict() for trade in self.trades],
        }

        # Add trade visualization options if they exist
        if trade_visualization_options:
            result["tradeVisualizationOptions"] = trade_visualization_options.asdict()

        return result
