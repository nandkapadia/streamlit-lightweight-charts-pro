"""Price scale management for Chart component.

This module handles price scale configuration and overlay price scales
for chart series.
"""

from typing import Any

from lightweight_charts_core.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from lightweight_charts_core.exceptions import (
    PriceScaleOptionsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)


class PriceScaleManager:
    """Manages price scale configurations for a Chart.

    This class handles all price scale operations including:
    - Managing left and right price scales
    - Managing overlay price scales
    - Validating price scale configurations

    Attributes:
        left_price_scale: Left price scale configuration.
        right_price_scale: Right price scale configuration.
        overlay_price_scales: Dictionary of overlay price scale configurations.

    """

    def __init__(
        self,
        left_price_scale: PriceScaleOptions | None = None,
        right_price_scale: PriceScaleOptions | None = None,
        overlay_price_scales: dict[str, PriceScaleOptions] | None = None,
    ):
        """Initialize the PriceScaleManager.

        Args:
            left_price_scale: Optional left price scale configuration.
            right_price_scale: Optional right price scale configuration.
            overlay_price_scales: Optional dictionary of overlay price scales.

        """
        self.left_price_scale = left_price_scale
        self.right_price_scale = right_price_scale
        self.overlay_price_scales = overlay_price_scales if overlay_price_scales is not None else {}

    def add_overlay_scale(
        self,
        scale_id: str,
        options: PriceScaleOptions,
    ) -> None:
        """Add or update a custom overlay price scale configuration.

        Args:
            scale_id: The unique identifier for the custom price scale.
            options: A PriceScaleOptions instance containing the configuration.

        Raises:
            ValueValidationError: If scale_id is not a non-empty string.
            TypeValidationError: If options is None or not a PriceScaleOptions instance.

        """
        if not scale_id or not isinstance(scale_id, str):
            raise ValueValidationError("scale_id", "must be a non-empty string")
        if options is None:
            raise TypeValidationError("options", "PriceScaleOptions")
        if not isinstance(options, PriceScaleOptions):
            raise ValueValidationError("options", "must be a PriceScaleOptions instance")

        # Update or add the overlay price scale (scale_id is used as dict key, not as property)
        self.overlay_price_scales[scale_id] = options

    def has_overlay_scale(self, scale_id: str) -> bool:
        """Check if an overlay price scale exists.

        Args:
            scale_id: The unique identifier for the custom price scale.

        Returns:
            True if the overlay price scale exists, False otherwise.

        """
        return scale_id in self.overlay_price_scales

    def configure_for_volume(self) -> None:
        """Configure right price scale margins for volume overlay.

        Sets the right price scale margins to leave space for volume
        visualization at the bottom of the chart.
        """
        if self.right_price_scale is not None:
            # Explicitly set visible=True to ensure it's serialized
            self.right_price_scale.visible = True
            self.right_price_scale.scale_margins = PriceScaleMargins(
                top=0.05,  # 5% margin at top (safety buffer)
                bottom=0.15,  # 15% margin at bottom (reserves space for volume overlay)
            )

    def validate_and_serialize(self) -> dict[str, Any]:
        """Validate and serialize price scale configurations.

        Returns:
            Dictionary of serialized price scale configurations.

        Raises:
            PriceScaleOptionsTypeError: If price scale is not a valid type.

        """
        result = {}

        # Serialize right price scale
        if self.right_price_scale is not None:
            try:
                result["rightPriceScale"] = self.right_price_scale.asdict()
            except AttributeError as e:
                if isinstance(self.right_price_scale, bool):
                    raise PriceScaleOptionsTypeError(
                        "right_price_scale",
                        type(self.right_price_scale),
                    ) from e
                raise PriceScaleOptionsTypeError(
                    "right_price_scale",
                    type(self.right_price_scale),
                ) from e

        # Serialize left price scale
        if self.left_price_scale is not None:
            try:
                result["leftPriceScale"] = self.left_price_scale.asdict()
            except AttributeError as e:
                if isinstance(self.left_price_scale, bool):
                    raise PriceScaleOptionsTypeError(
                        "left_price_scale",
                        type(self.left_price_scale),
                    ) from e
                raise PriceScaleOptionsTypeError(
                    "left_price_scale",
                    type(self.left_price_scale),
                ) from e

        # Serialize overlay price scales
        if self.overlay_price_scales:
            result["overlayPriceScales"] = {
                k: v.asdict() if hasattr(v, "asdict") else v
                for k, v in self.overlay_price_scales.items()
            }

        return result
