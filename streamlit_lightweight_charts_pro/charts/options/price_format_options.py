"""Price format options configuration for streamlit-lightweight-charts.

This module provides price formatting option classes for configuring
how price values are displayed on charts.
"""

from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.utils import chainable_field


@dataclass
@chainable_field("type", str, validator="price_format_type")
@chainable_field("precision", int, validator="precision")
@chainable_field("min_move", (int, float), validator="min_move")
@chainable_field("formatter", str)
class PriceFormatOptions(Options):
    """
    Encapsulates price formatting options for a series, matching TradingView's API.

    Attributes:
        type (str): Format type ("price", "volume", "percent", "custom").
        precision (int): Number of decimal places.
        min_move (float): Minimum price movement.
        formatter (Optional[str]): Optional custom formatter (string name or function reference).
    """

    type: str = "price"
    precision: int = 2
    min_move: float = 0.01
    formatter: Optional[str] = None

    @staticmethod
    def _validate_type_static(type_value: str) -> str:
        """Static version of type validator for decorator use."""
        if type_value not in {"price", "volume", "percent", "custom"}:
            raise ValueError(
                f"Invalid type: {type_value!r}. Must be one of 'price', 'volume', "
                "'percent', 'custom'."
            )
        return type_value

    @staticmethod
    def _validate_precision_static(precision: int) -> int:
        """Static version of precision validator for decorator use."""
        if not isinstance(precision, int) or precision < 0:
            raise ValueError(f"precision must be a non-negative integer, got {precision}")
        return precision

    @staticmethod
    def _validate_min_move_static(min_move: float) -> float:
        """Static version of min_move validator for decorator use."""
        if not isinstance(min_move, (int, float)) or min_move <= 0:
            raise ValueError(f"min_move must be a positive number, got {min_move}")
        return min_move
