"""Price scale validation utilities.

This module provides validation and helpful error messages for price scale
configurations, helping developers catch common mistakes early.
"""

from lightweight_charts_core.charts.options.price_scale_options import (
    PriceScaleOptions,
)
from lightweight_charts_core.charts.series.base import Series


class PriceScaleValidationError(Exception):
    """Raised when price scale validation fails."""


class PriceScaleValidator:
    """Validates price scale configurations and provides helpful errors.

    This validator helps developers catch common price scale configuration
    mistakes early with actionable error messages.
    """

    @staticmethod
    def validate_series_price_scale(
        series: Series,
        available_scales: dict[str, PriceScaleOptions],
        auto_create_enabled: bool = True,
    ) -> None:
        """Validate that series price_scale_id references existing scale.

        Args:
            series: The series to validate.
            available_scales: Dictionary of available overlay price scales.
            auto_create_enabled: Whether auto-creation is enabled.

        Raises:
            PriceScaleValidationError: If validation fails and auto-create is disabled.

        """
        scale_id = getattr(series, "price_scale_id", "")

        # Built-in scales always valid
        if scale_id in ("", "left", "right"):
            return

        # Check if custom scale exists
        if scale_id not in available_scales:
            if auto_create_enabled:
                # Auto-creation will handle this - no error needed
                return

            # Auto-creation disabled - provide helpful error
            available = ", ".join(["left", "right", *list(available_scales.keys())])
            raise PriceScaleValidationError(
                f"Series references non-existent price scale '{scale_id}'. "
                f"Available scales: {available}. "
                f"\n\nOptions to fix this:"
                f"\n1. Enable auto-creation (default): auto_create_price_scales=True"
                f"\n2. Manually add scale: chart.add_overlay_price_scale('{scale_id}', options)"
                f"\n3. Use a built-in scale: price_scale_id='left' or 'right'"
            )

    @staticmethod
    def suggest_configuration(
        series_type: str,
        pane_id: int,
        is_overlay: bool,
    ) -> str:
        """Provide configuration suggestions based on context.

        Args:
            series_type: The type of series (e.g., 'LineSeries').
            pane_id: The pane ID.
            is_overlay: Whether this is an overlay series.

        Returns:
            Formatted suggestion string.

        """
        if is_overlay:
            return f"""
Detected overlay series ({series_type}) in pane {pane_id}.
Recommended configuration:
    # Option 1: Auto-creation (simplest)
    chart.add_series(series)  # Price scale auto-created

    # Option 2: Manual configuration
    from lightweight_charts_core import PriceScaleConfig
    scale = PriceScaleConfig.for_overlay("custom_id")
    chart.add_overlay_price_scale("custom_id", scale)
    series.price_scale_id = "custom_id"
"""
        return f"""
Detected separate pane series ({series_type}) in pane {pane_id}.
Recommended configuration:
    # Option 1: Auto-creation (simplest)
    chart.add_series(series)  # Price scale auto-created

    # Option 2: Pane-centric API
    chart.add_pane_with_series(
        pane_id={pane_id},
        series=your_series,
        price_scale_id="pane_{pane_id}"  # Auto-generated if omitted
    )

    # Option 3: Manual configuration
    from lightweight_charts_core import PriceScaleConfig
    scale = PriceScaleConfig.for_separate_pane("pane_{pane_id}")
    chart.add_overlay_price_scale("pane_{pane_id}", scale)
"""

    @staticmethod
    def validate_pane_configuration(
        pane_id: int,
        existing_series: list,
    ) -> str | None:
        """Validate pane configuration and provide warnings if needed.

        Args:
            pane_id: The pane ID to validate.
            existing_series: List of existing series in the chart.

        Returns:
            Warning message if configuration seems inefficient, None otherwise.

        """
        # Check if multiple series in same pane use different custom scales
        pane_scales = {}
        for series in existing_series:
            series_pane = getattr(series, "pane_id", 0)
            if series_pane == pane_id:
                scale_id = getattr(series, "price_scale_id", "")
                if scale_id and scale_id not in ("left", "right", ""):
                    if scale_id not in pane_scales:
                        pane_scales[scale_id] = []
                    pane_scales[scale_id].append(series)

        # If multiple different custom scales in same pane, suggest consolidation
        if len(pane_scales) > 1:
            scale_names = ", ".join(f"'{s}'" for s in pane_scales)
            return (
                f"Warning: Pane {pane_id} has multiple custom price scales ({scale_names}). "
                f"Consider using a single shared scale for better performance, or use "
                f"built-in scales ('left', 'right') for primary series."
            )

        return None
