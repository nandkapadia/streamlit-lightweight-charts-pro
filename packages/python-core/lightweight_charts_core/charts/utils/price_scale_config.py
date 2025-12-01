"""Price scale configuration builder utilities.

This module provides fluent builder patterns for common price scale configurations,
making it easier to create properly configured price scales for various use cases.
"""

from lightweight_charts_core.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from lightweight_charts_core.type_definitions.enums import PriceScaleMode


class PriceScaleConfig:
    """Builder for common price scale configurations.

    This class provides static factory methods for creating properly configured
    PriceScaleOptions for common use cases like overlays, separate panes, and
    specific indicator types.
    """

    @staticmethod
    def for_overlay(
        scale_id: str,
        top_margin: float = 0.8,
        bottom_margin: float = 0.0,
        **kwargs,
    ) -> PriceScaleOptions:
        """Create price scale config for overlay series (hidden axis).

        Overlays are series displayed in the same pane as the main series but
        with a different value scale. The axis labels are hidden by default.

        Args:
            scale_id: Unique identifier for the price scale.
            top_margin: Top margin as proportion (default: 0.8 = 80% space at top).
            bottom_margin: Bottom margin as proportion (default: 0.0).
            **kwargs: Additional PriceScaleOptions parameters to override defaults.

        Returns:
            PriceScaleOptions configured for overlay use.

        Example:
            >>> config = PriceScaleConfig.for_overlay("volume")
            >>> chart.add_overlay_price_scale("volume", config)

        """
        del scale_id
        defaults = {
            "visible": False,  # Hide axis labels for overlays
            "auto_scale": True,
            "mode": PriceScaleMode.NORMAL,
            "scale_margins": PriceScaleMargins(top=top_margin, bottom=bottom_margin),
        }
        # Merge with provided kwargs (kwargs take precedence)
        defaults.update(kwargs)
        return PriceScaleOptions(**defaults)

    @staticmethod
    def for_separate_pane(
        scale_id: str,
        top_margin: float = 0.1,
        bottom_margin: float = 0.1,
        **kwargs,
    ) -> PriceScaleOptions:
        """Create price scale config for separate pane (visible axis).

        Separate pane series are displayed in their own vertical pane with
        visible axis labels and balanced margins.

        Args:
            scale_id: Unique identifier for the price scale.
            top_margin: Top margin as proportion (default: 0.1 = 10% space at top).
            bottom_margin: Bottom margin as proportion (default: 0.1 = 10% space at bottom).
            **kwargs: Additional PriceScaleOptions parameters to override defaults.

        Returns:
            PriceScaleOptions configured for separate pane use.

        Example:
            >>> config = PriceScaleConfig.for_separate_pane("rsi")
            >>> chart.add_overlay_price_scale("rsi", config)

        """
        del scale_id
        defaults = {
            "visible": True,  # Show axis labels for separate panes
            "auto_scale": True,
            "mode": PriceScaleMode.NORMAL,
            "scale_margins": PriceScaleMargins(top=top_margin, bottom=bottom_margin),
        }
        defaults.update(kwargs)
        return PriceScaleOptions(**defaults)

    @staticmethod
    def for_volume(
        scale_id: str = "volume",
        as_overlay: bool = True,
        **kwargs,
    ) -> PriceScaleOptions:
        """Create price scale config optimized for volume series.

        Volume series typically use large top margins to appear at the bottom
        of the chart without interfering with price series.

        Args:
            scale_id: Unique identifier for the price scale (default: "volume").
            as_overlay: Whether volume is overlay (True) or separate pane (False).
            **kwargs: Additional PriceScaleOptions parameters to override defaults.

        Returns:
            PriceScaleOptions configured for volume visualization.

        Example:
            >>> config = PriceScaleConfig.for_volume(as_overlay=True)
            >>> chart.add_overlay_price_scale("volume", config)

        """
        del scale_id
        if as_overlay:
            # Volume as overlay: large top margin, hidden axis
            defaults = {
                "visible": False,
                "auto_scale": True,
                "mode": PriceScaleMode.NORMAL,
                "scale_margins": PriceScaleMargins(top=0.8, bottom=0.0),
            }
        else:
            # Volume as separate pane: visible axis, balanced margins
            defaults = {
                "visible": True,
                "auto_scale": True,
                "mode": PriceScaleMode.NORMAL,
                "scale_margins": PriceScaleMargins(top=0.1, bottom=0.1),
            }
        defaults.update(kwargs)
        return PriceScaleOptions(**defaults)

    @staticmethod
    def for_indicator(
        scale_id: str,
        min_value: float | None = None,  # noqa: ARG004
        max_value: float | None = None,  # noqa: ARG004
        **kwargs,
    ) -> PriceScaleOptions:
        """Create price scale config for bounded indicators (RSI, Stochastic, etc).

        Many technical indicators have fixed value ranges (e.g., RSI: 0-100).
        This method creates a config suitable for these bounded indicators.

        Note: min_value and max_value are accepted for API compatibility but
        are not used in PriceScaleOptions. Use chart-level options to set
        value ranges if needed.

        Args:
            scale_id: Unique identifier for the price scale.
            min_value: Optional minimum value hint (not used by PriceScaleOptions).
            max_value: Optional maximum value hint (not used by PriceScaleOptions).
            **kwargs: Additional PriceScaleOptions parameters to override defaults.

        Returns:
            PriceScaleOptions configured for bounded indicators.

        Example:
            >>> # RSI indicator (0-100 range)
            >>> config = PriceScaleConfig.for_indicator("rsi", min_value=0, max_value=100)
            >>> chart.add_overlay_price_scale("rsi", config)

        """
        del scale_id
        defaults = {
            "visible": True,
            "auto_scale": True,  # Always auto-scale for now
            "mode": PriceScaleMode.NORMAL,
            "scale_margins": PriceScaleMargins(top=0.1, bottom=0.2),
        }

        # Note: min_value and max_value are accepted but not used in PriceScaleOptions
        # They would be used at the chart/series level if implemented in the future

        defaults.update(kwargs)
        return PriceScaleOptions(**defaults)

    @staticmethod
    def for_percentage(
        scale_id: str,
        **kwargs,
    ) -> PriceScaleOptions:
        """Create price scale config for percentage-based series.

        Percentage-based series show changes as percentages rather than
        absolute values, useful for comparing relative performance.

        Args:
            scale_id: Unique identifier for the price scale.
            **kwargs: Additional PriceScaleOptions parameters to override defaults.

        Returns:
            PriceScaleOptions configured for percentage mode.

        Example:
            >>> config = PriceScaleConfig.for_percentage("pct_change")
            >>> chart.add_overlay_price_scale("pct_change", config)

        """
        del scale_id
        defaults = {
            "visible": True,
            "auto_scale": True,
            "mode": PriceScaleMode.PERCENTAGE,
            "scale_margins": PriceScaleMargins(top=0.1, bottom=0.1),
        }
        defaults.update(kwargs)
        return PriceScaleOptions(**defaults)

    @staticmethod
    def for_logarithmic(
        scale_id: str,
        **kwargs,
    ) -> PriceScaleOptions:
        """Create price scale config for logarithmic scale.

        Logarithmic scales are useful for displaying data that spans several
        orders of magnitude or for emphasizing percentage changes.

        Args:
            scale_id: Unique identifier for the price scale.
            **kwargs: Additional PriceScaleOptions parameters to override defaults.

        Returns:
            PriceScaleOptions configured for logarithmic mode.

        Example:
            >>> config = PriceScaleConfig.for_logarithmic("price_log")
            >>> chart.add_overlay_price_scale("price_log", config)

        """
        del scale_id
        defaults = {
            "visible": True,
            "auto_scale": True,
            "mode": PriceScaleMode.LOGARITHMIC,
            "scale_margins": PriceScaleMargins(top=0.1, bottom=0.1),
        }
        defaults.update(kwargs)
        return PriceScaleOptions(**defaults)
