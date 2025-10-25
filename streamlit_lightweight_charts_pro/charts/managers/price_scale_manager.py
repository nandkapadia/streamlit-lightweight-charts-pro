"""Price scale management for Chart component.

This module provides the PriceScaleManager class which handles all price scale
related operations including overlay price scales and price scale configuration.
"""

from typing import Dict

from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.exceptions import TypeValidationError, ValueValidationError
from streamlit_lightweight_charts_pro.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)


class PriceScaleManager:
    """Manages price scales for a chart.

    This class provides centralized management of all price scale operations
    for a chart, including overlay price scales and price scale configuration.

    Attributes:
        overlay_price_scales: Dictionary mapping price scale IDs to
            PriceScaleOptions objects.
    """

    def __init__(self) -> None:
        """Initialize the price scale manager.

        Creates a new PriceScaleManager with an empty overlay price scales
        dictionary.
        """
        self.overlay_price_scales: Dict[str, PriceScaleOptions] = {}

    def add_overlay_price_scale(
        self,
        scale_id: str,
        options: PriceScaleOptions,
    ) -> "PriceScaleManager":
        """Add or update a custom overlay price scale configuration.

        Adds or updates an overlay price scale configuration. Overlay price scales
        allow multiple series to share the same price axis while maintaining
        independent scaling and positioning.

        Args:
            scale_id: The unique identifier for the custom price scale
                (e.g., 'volume', 'indicator1', 'overlay').
            options: A PriceScaleOptions instance containing the configuration
                for the overlay price scale.

        Returns:
            PriceScaleManager: Self for method chaining.

        Raises:
            ValueValidationError: If scale_id is not a non-empty string or if
                options is not a PriceScaleOptions instance.
            TypeValidationError: If options is None.

        Example:
            ```python
            from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
                PriceScaleOptions,
            )

            # Add volume overlay price scale
            volume_scale = PriceScaleOptions(
                visible=False,
                scale_margin_top=0.8,
                scale_margin_bottom=0,
                overlay=True,
                auto_scale=True
            )
            manager.add_overlay_price_scale('volume', volume_scale)
            ```
        """
        if not scale_id or not isinstance(scale_id, str):
            raise ValueValidationError("scale_id", "must be a non-empty string")
        if options is None:
            raise TypeValidationError("options", "PriceScaleOptions")
        if not isinstance(options, PriceScaleOptions):
            raise ValueValidationError("options", "must be a PriceScaleOptions instance")

        # Ensure the price_scale_id field matches the scale_id parameter
        # This ensures proper mapping between dictionary key and the PriceScaleOptions ID
        options.price_scale_id = scale_id

        # Update or add the overlay price scale (allow updates to existing scales)
        self.overlay_price_scales[scale_id] = options
        return self

    def get_overlay_price_scale(self, scale_id: str) -> PriceScaleOptions:
        """Get an overlay price scale configuration by ID.

        Args:
            scale_id: The price scale ID to retrieve.

        Returns:
            PriceScaleOptions instance if found, None otherwise.

        Example:
            ```python
            volume_scale = manager.get_overlay_price_scale('volume')
            ```
        """
        return self.overlay_price_scales.get(scale_id)

    def remove_overlay_price_scale(self, scale_id: str) -> bool:
        """Remove an overlay price scale by ID.

        Args:
            scale_id: The price scale ID to remove.

        Returns:
            True if the scale was removed, False if it didn't exist.

        Example:
            ```python
            success = manager.remove_overlay_price_scale('volume')
            ```
        """
        if scale_id in self.overlay_price_scales:
            del self.overlay_price_scales[scale_id]
            return True
        return False

    def clear(self) -> "PriceScaleManager":
        """Clear all overlay price scales.

        Returns:
            PriceScaleManager: Self for method chaining.

        Example:
            ```python
            manager.clear()
            ```
        """
        self.overlay_price_scales.clear()
        return self

    def has_overlay_price_scale(self, scale_id: str) -> bool:
        """Check if an overlay price scale exists.

        Args:
            scale_id: The price scale ID to check.

        Returns:
            True if the scale exists, False otherwise.

        Example:
            ```python
            if manager.has_overlay_price_scale('volume'):
                print("Volume scale exists")
            ```
        """
        return scale_id in self.overlay_price_scales
