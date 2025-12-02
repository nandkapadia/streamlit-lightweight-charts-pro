"""Session state management for Chart component.

This module handles session state persistence for series configurations,
allowing chart state to be maintained across Streamlit reruns.
"""

from typing import Any

import streamlit as st
from lightweight_charts_core.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)


class SessionStateManager:
    """Manages session state persistence for chart configurations.

    This class handles all session state operations including:
    - Saving series configurations
    - Loading series configurations
    - Applying stored configurations to series

    Attributes:
        configs_applied: Flag to track if configs have been applied in current cycle.
    """

    def __init__(self):
        """Initialize the SessionStateManager."""
        self.configs_applied = False

    def save_series_configs(self, key: str, configs: dict[str, Any]) -> None:
        """Save series configurations to Streamlit session state.

        Args:
            key: Component key used to namespace the stored configs.
            configs: Dictionary of series configurations to save.
        """
        if not key:
            return

        session_key = f"_chart_series_configs_{key}"
        st.session_state[session_key] = configs

    def load_series_configs(self, key: str) -> dict[str, Any]:
        """Load series configurations from Streamlit session state.

        Args:
            key: Component key used to namespace the stored configs.

        Returns:
            Dictionary of series configurations or empty dict if none found.
        """
        if not key:
            return {}

        session_key = f"_chart_series_configs_{key}"
        return st.session_state.get(session_key, {})

    def get_stored_series_config(
        self,
        key: str,
        series_index: int = 0,
        pane_id: int = 0,
    ) -> dict[str, Any]:
        """Get stored configuration for a specific series.

        Args:
            key: Component key used to namespace the stored configs.
            series_index: Index of the series (default: 0).
            pane_id: Pane ID for the series (default: 0).

        Returns:
            Dictionary of stored configuration or empty dict if none found.
        """
        session_key = f"_chart_series_configs_{key}"
        stored_configs = st.session_state.get(session_key, {})
        series_id = f"pane-{pane_id}-series-{series_index}"
        return stored_configs.get(series_id, {})

    def apply_stored_configs_to_series(
        self,
        stored_configs: dict[str, Any],
        series_list: list[Any],
    ) -> None:
        """Apply stored configurations to series objects.

        Optimized to apply all configurations in a single pass to prevent flicker.

        Args:
            stored_configs: Dictionary mapping series IDs to their configurations.
            series_list: List of series objects to apply configurations to.
        """
        if not stored_configs:
            return

        # Check if configs have already been applied in this render cycle
        if self.configs_applied:
            return

        for i, series in enumerate(series_list):
            # Generate the expected series ID
            pane_id = getattr(series, "pane_id", 0) or 0
            series_id = f"pane-{pane_id}-series-{i}"

            if series_id in stored_configs:
                config = stored_configs[series_id]

                logger.debug("Applying stored config to %s: %s", series_id, config)

                try:
                    # Separate configs for line_options vs general series properties
                    line_options_config = {}
                    series_config = {}

                    for key, value in config.items():
                        # Skip data and internal metadata
                        if key in (
                            "data",
                            "type",
                            "paneId",
                            "priceScaleId",
                            "zIndex",
                            "_seriesType",
                        ):
                            continue

                        # Line-specific properties go to line_options
                        if key in (
                            "color",
                            "lineWidth",
                            "lineStyle",
                            "lineType",
                            "lineVisible",
                            "pointMarkersVisible",
                            "pointMarkersRadius",
                            "crosshairMarkerVisible",
                            "crosshairMarkerRadius",
                            "crosshairMarkerBorderColor",
                            "crosshairMarkerBackgroundColor",
                            "crosshairMarkerBorderWidth",
                            "lastPriceAnimation",
                        ):
                            line_options_config[key] = value
                        else:
                            series_config[key] = value

                    # Apply line options config if available
                    if (
                        hasattr(series, "line_options")
                        and series.line_options
                        and line_options_config
                    ):
                        logger.debug(
                            "Applying line_options config to %s: %s",
                            series_id,
                            line_options_config,
                        )
                        series.line_options.update(line_options_config)

                    # Apply general series config
                    if series_config and hasattr(series, "update") and callable(series.update):
                        logger.debug("Applying series config to %s: %s", series_id, series_config)
                        series.update(series_config)

                except (ValueError, TypeError, AttributeError, KeyError):
                    logger.exception("Failed to apply config to series %s", series_id)

        # Mark configs as applied for this render cycle
        self.configs_applied = True

    def reset_config_applied_flag(self) -> None:
        """Reset the config application flag for a new render cycle."""
        self.configs_applied = False
