"""Marker data classes for Lightweight Charts.

This module provides data classes for chart markers used to highlight
specific data points or events on charts, following the TradingView Lightweight Charts API.
The module includes different types of markers for various positioning scenarios.

The module includes:
    - MarkerBase: Base class for all chart markers
    - PriceMarker: Marker positioned at exact price levels
    - BarMarker: Marker positioned relative to bars
    - Marker: Backward compatibility alias for BarMarker

Key Features:
    - Automatic time normalization to UNIX timestamps
    - Position validation for different marker types
    - Shape and color customization
    - Optional text and ID fields
    - Size control for marker appearance
    - Enum-based position and shape validation

Example Usage:
    ```python
    from lightweight_charts_core.data import Marker, PriceMarker
    from lightweight_charts_core.type_definitions.enums import MarkerPosition, MarkerShape

    # Create bar marker
    bar_marker = Marker(
        time="2024-01-01T00:00:00",
        position=MarkerPosition.ABOVE_BAR,
        shape=MarkerShape.CIRCLE,
        color="#FF0000",
        text="Important Event",
    )

    # Create price marker
    price_marker = PriceMarker(
        time="2024-01-01T00:00:00",
        position=MarkerPosition.AT_PRICE_TOP,
        shape=MarkerShape.ARROW_DOWN,
        price=100.0,
        color="#00FF00",
    )
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
from dataclasses import dataclass
from typing import ClassVar

# Local Imports
from lightweight_charts_core.data.data import Data
from lightweight_charts_core.exceptions import RequiredFieldError
from lightweight_charts_core.type_definitions.enums import MarkerPosition, MarkerShape


@dataclass
class MarkerBase(Data):
    """Base chart marker definition for highlighting data points.

    This class represents the base marker that can be displayed on charts to
    highlight specific data points, events, or annotations. Based on the
    TradingView Lightweight Charts SeriesMarkerBase interface, it provides
    the foundation for all marker types in the library.

    The class automatically handles time normalization, position and shape
    validation, and provides a flexible interface for marker customization.

    Attributes:
        time (int): UNIX timestamp in seconds representing the marker time.
            This value is automatically normalized during initialization.
        position (Union[str, MarkerPosition]): Where to position the marker
            relative to the data point. Can be a string or MarkerPosition enum.
            Defaults to ABOVE_BAR.
        shape (Union[str, MarkerShape]): Shape of the marker. Can be a string
            or MarkerShape enum. Defaults to CIRCLE.
        color (str): Color of the marker in hex format. Defaults to "#2196F3" (blue).
        id (Optional[str]): Optional unique identifier for the marker.
            If not provided, the id field is not serialized.
        text (Optional[str]): Optional text to display with the marker.
            If not provided, the text field is not serialized.
        size (int): Size of the marker in pixels. Defaults to 1.

    Class Attributes:
        REQUIRED_COLUMNS (set): Set containing "position" and "shape" as
            required columns for DataFrame conversion operations.
        OPTIONAL_COLUMNS (set): Set containing optional columns for
            DataFrame conversion operations.

    """

    # Define required columns for DataFrame conversion - position and shape are required
    REQUIRED_COLUMNS: ClassVar[set] = {"position", "shape"}

    # Define optional columns for DataFrame conversion - styling and metadata fields
    OPTIONAL_COLUMNS: ClassVar[set] = {"text", "color", "size", "id"}

    # Position of the marker relative to the data point - defaults to above bar
    position: str | MarkerPosition = MarkerPosition.ABOVE_BAR
    # Shape of the marker - defaults to circle
    shape: str | MarkerShape = MarkerShape.CIRCLE
    # Color of the marker in hex format - defaults to blue
    color: str = "#2196F3"
    # Optional unique identifier for the marker
    id: str | None = None
    # Optional text to display with the marker
    text: str | None = None
    # Size of the marker in pixels - defaults to 1
    size: int = 1

    def __post_init__(self):
        """Post-initialization processing to normalize enums and validate data.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Calls the parent class __post_init__ to normalize the time value
        2. Converts string position values to MarkerPosition enum
        3. Converts string shape values to MarkerShape enum

        The method ensures that all marker data points have properly normalized
        enum values that can be safely serialized and transmitted to the frontend.
        """
        # Call parent's __post_init__ to normalize the time value to UNIX timestamp
        super().__post_init__()

        # Convert position string to enum if it's provided as a string
        if isinstance(self.position, str):
            self.position = MarkerPosition(self.position)

        # Convert shape string to enum if it's provided as a string
        if isinstance(self.shape, str):
            self.shape = MarkerShape(self.shape)

    def validate_position(self) -> bool:
        """Validate that the position is valid for this marker type.

        This method provides a base implementation that allows all positions.
        Subclasses should override this method to implement position-specific
        validation logic for their marker types.

        Returns:
            bool: True if position is valid, False otherwise. Base implementation
                always returns True.

        """
        # Base class allows all positions - subclasses will override with specific validation
        return True


@dataclass
class PriceMarker(MarkerBase):
    """Price marker for exact Y-axis positioning on charts.

    This class represents a marker that can be positioned at exact price levels
    on the Y-axis. Based on the TradingView Lightweight Charts SeriesMarkerPrice
    interface, it provides precise positioning control for markers that need
    to be placed at specific price values.

    The class automatically handles time normalization, price validation, and
    position validation for price-specific positioning scenarios.

    Attributes:
        time (int): UNIX timestamp in seconds representing the marker time.
            This value is automatically normalized during initialization.
        position (Union[str, MarkerPosition]): Must be one of AT_PRICE_TOP,
            AT_PRICE_BOTTOM, or AT_PRICE_MIDDLE for price markers.
        shape (Union[str, MarkerShape]): Shape of the marker.
        color (str): Color of the marker in hex format. Defaults to "#2196F3" (blue).
        price (float): Price value for exact Y-axis positioning. Required field
            that must be greater than 0.0.
        id (Optional[str]): Optional unique identifier for the marker.
        text (Optional[str]): Optional text to display with the marker.
        size (int): Size of the marker in pixels. Defaults to 1.

    Class Attributes:
        REQUIRED_COLUMNS (set): Set containing "position", "shape", and "price"
            as required columns for DataFrame conversion operations.
        OPTIONAL_COLUMNS (set): Set containing optional columns for
            DataFrame conversion operations.

    Raises:
        RequiredFieldError: If the price field is 0.0 or missing.

    """

    # Define required columns for DataFrame conversion - price is additional requirement
    REQUIRED_COLUMNS: ClassVar[set] = {"position", "shape", "price"}

    # Define optional columns for DataFrame conversion - same as base class
    OPTIONAL_COLUMNS: ClassVar[set] = {"text", "color", "size", "id"}

    # Price value for exact Y-axis positioning - required for price markers
    price: float = 0.0

    def __post_init__(self):
        """Post-initialization processing to validate price value.

        This method is automatically called after the dataclass is initialized.
        It performs the following operations:
        1. Calls the parent class __post_init__ to normalize time and enums
        2. Validates that the price field is provided and not 0.0

        The method ensures that all price markers have valid price values
        for proper Y-axis positioning.

        Raises:
            RequiredFieldError: If the price field is 0.0 or missing.

        """
        # Call parent's __post_init__ to normalize time and convert enums
        super().__post_init__()

        # Validate that price is provided and not 0.0 (required field)
        if self.price == 0.0:
            raise RequiredFieldError("Price")

    def validate_position(self) -> bool:
        """Validate that the position is valid for price markers.

        This method validates that the position is one of the valid price-specific
        positions that work with exact Y-axis positioning.

        Returns:
            bool: True if position is valid for price markers, False otherwise.

        """
        # Define valid positions for price markers - must be price-specific positions
        valid_positions = {
            MarkerPosition.AT_PRICE_TOP,
            MarkerPosition.AT_PRICE_BOTTOM,
            MarkerPosition.AT_PRICE_MIDDLE,
        }
        # Check if the current position is in the valid set
        return self.position in valid_positions


@dataclass
class BarMarker(MarkerBase):
    """Bar marker for positioning relative to bars on charts.

    This class represents a marker that can be positioned relative to bars
    on the chart. Based on the TradingView Lightweight Charts SeriesMarkerBar
    interface, it provides flexible positioning options for markers that need
    to be placed relative to chart bars or candlesticks.

    The class automatically handles time normalization, position validation,
    and provides optional price positioning for enhanced flexibility.

    Attributes:
        time (int): UNIX timestamp in seconds representing the marker time.
            This value is automatically normalized during initialization.
        position (Union[str, MarkerPosition]): Must be one of ABOVE_BAR,
            BELOW_BAR, or IN_BAR for bar markers.
        shape (Union[str, MarkerShape]): Shape of the marker.
        color (str): Color of the marker in hex format. Defaults to "#2196F3" (blue).
        id (Optional[str]): Optional unique identifier for the marker.
        text (Optional[str]): Optional text to display with the marker.
        size (int): Size of the marker in pixels. Defaults to 1.
        price (Optional[float]): Optional price value for exact Y-axis positioning.
            If provided, overrides the relative bar positioning.

    Class Attributes:
        REQUIRED_COLUMNS (set): Set containing "position" and "shape" as
            required columns for DataFrame conversion operations.
        OPTIONAL_COLUMNS (set): Set containing optional columns including
            "price" for enhanced positioning flexibility.

    """

    # Define required columns for DataFrame conversion - same as base class
    REQUIRED_COLUMNS: ClassVar[set] = {"position", "shape"}

    # Define optional columns for DataFrame conversion - includes price for flexibility
    OPTIONAL_COLUMNS: ClassVar[set] = {"text", "color", "size", "id", "price"}

    # Optional price value for exact Y-axis positioning - provides enhanced flexibility
    price: float | None = None

    def validate_position(self) -> bool:
        """Validate that the position is valid for bar markers.

        This method validates that the position is one of the valid bar-relative
        positions that work with bar and candlestick charts.

        Returns:
            bool: True if position is valid for bar markers, False otherwise.

        """
        # Define valid positions for bar markers - must be bar-relative positions
        valid_positions = {
            MarkerPosition.ABOVE_BAR,
            MarkerPosition.BELOW_BAR,
            MarkerPosition.IN_BAR,
        }
        # Check if the current position is in the valid set
        return self.position in valid_positions


# Backward compatibility alias - BarMarker is the most commonly used marker type
Marker = BarMarker
