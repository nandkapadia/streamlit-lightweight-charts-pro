"""
Marker data classes for streamlit-lightweight-charts.

This module provides data classes for chart markers used to highlight
specific data points or events on charts, following the TradingView Lightweight Charts API.
"""

from dataclasses import dataclass
from typing import Optional, Union

from streamlit_lightweight_charts_pro.data.data import Data
from streamlit_lightweight_charts_pro.type_definitions.enums import MarkerPosition, MarkerShape


@dataclass
class MarkerBase(Data):
    """
    Base chart marker definition for highlighting data points.

    This class represents the base marker that can be displayed on charts to
    highlight specific data points, events, or annotations. Based on the
    TradingView Lightweight Charts SeriesMarkerBase interface.

    Attributes:
        time: UNIX timestamp in seconds.
        position: Where to position the marker relative to the data point.
        shape: Shape of the marker.
        color: Color of the marker.
        id: Optional ID for the marker.
        text: Optional text to display with the marker.
        size: Optional size of the marker (default: 1).
    """

    REQUIRED_COLUMNS = {"position", "shape"}
    OPTIONAL_COLUMNS = {"text", "color", "size", "id"}

    position: Union[str, MarkerPosition] = MarkerPosition.ABOVE_BAR
    shape: Union[str, MarkerShape] = MarkerShape.CIRCLE
    color: str = "#2196F3"  # Default blue color
    id: Optional[str] = None
    text: Optional[str] = None
    size: int = 1  # Default size in pixels

    def __post_init__(self):
        """Post-initialization processing."""
        # Call parent's __post_init__ for time normalization
        super().__post_init__()

        # Convert position to enum if it's a string
        if isinstance(self.position, str):
            self.position = MarkerPosition(self.position)

        # Convert shape to enum if it's a string
        if isinstance(self.shape, str):
            self.shape = MarkerShape(self.shape)

    def validate_position(self) -> bool:
        """
        Validate that the position is valid for this marker type.

        Returns:
            bool: True if position is valid, False otherwise.
        """
        # Base class allows all positions - subclasses will override
        return True


@dataclass
class PriceMarker(MarkerBase):
    """
    Price marker for exact Y-axis positioning.

    This class represents a marker that can be positioned at exact price levels
    on the Y-axis. Based on the TradingView Lightweight Charts SeriesMarkerPrice interface.

    Attributes:
        time: UNIX timestamp in seconds.
        position: Must be one of AT_PRICE_TOP, AT_PRICE_BOTTOM, AT_PRICE_MIDDLE.
        shape: Shape of the marker.
        color: Color of the marker.
        price: Price value for exact Y-axis positioning (required).
        id: Optional ID for the marker.
        text: Optional text to display with the marker.
        size: Optional size of the marker (default: 1).
    """

    REQUIRED_COLUMNS = {"position", "shape", "price"}
    OPTIONAL_COLUMNS = {"text", "color", "size", "id"}

    price: float = 0.0  # Required for price markers

    def __post_init__(self):
        """Post-initialization processing."""
        super().__post_init__()

        # Validate that price is provided
        if self.price == 0.0:
            raise ValueError("Price is required for PriceMarker")

    def validate_position(self) -> bool:
        """
        Validate that the position is valid for price markers.

        Returns:
            bool: True if position is valid, False otherwise.
        """
        valid_positions = {
            MarkerPosition.AT_PRICE_TOP,
            MarkerPosition.AT_PRICE_BOTTOM,
            MarkerPosition.AT_PRICE_MIDDLE,
        }
        return self.position in valid_positions


@dataclass
class BarMarker(MarkerBase):
    """
    Bar marker for positioning relative to bars.

    This class represents a marker that can be positioned relative to bars
    on the chart. Based on the TradingView Lightweight Charts SeriesMarkerBar interface.

    Attributes:
        time: UNIX timestamp in seconds.
        position: Must be one of ABOVE_BAR, BELOW_BAR, IN_BAR.
        shape: Shape of the marker.
        color: Color of the marker.
        id: Optional ID for the marker.
        text: Optional text to display with the marker.
        size: Optional size of the marker (default: 1).
        price: Optional price value for exact Y-axis positioning.
    """

    REQUIRED_COLUMNS = {"position", "shape"}
    OPTIONAL_COLUMNS = {"text", "color", "size", "id", "price"}

    price: Optional[float] = None

    def validate_position(self) -> bool:
        """
        Validate that the position is valid for bar markers.

        Returns:
            bool: True if position is valid, False otherwise.
        """
        valid_positions = {
            MarkerPosition.ABOVE_BAR,
            MarkerPosition.BELOW_BAR,
            MarkerPosition.IN_BAR,
        }
        return self.position in valid_positions


# Backward compatibility alias
Marker = BarMarker
