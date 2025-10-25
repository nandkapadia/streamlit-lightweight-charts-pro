"""Session state management for Chart component.

This module provides the SessionStateManager class which handles all session state
related operations including storing and loading series configurations across
Streamlit reruns.
"""

from typing import Any, Dict, List

import streamlit as st

from streamlit_lightweight_charts_pro.charts.series import Series
from streamlit_lightweight_charts_pro.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)


class SessionStateManager:
    """Manages session state for chart components.

    This class provides centralized management of all session state operations
    for a chart, including series configuration persistence across Streamlit
    reruns.

    The session state manager helps maintain chart state and user customizations
    across Streamlit app interactions.
    """

    def __init__(self) -> None:
        """Initialize the session state manager.

        Creates a new SessionStateManager with tracking for config application state.
        """
        # Flag to track if configs have been applied in current render cycle
        self._configs_applied = False

    def get_stored_series_config(
        self,
        key: str,
        series_index: int = 0,
        pane_id: int = 0,
    ) -> Dict[str, Any]:
        """Get stored configuration for a specific series.

        Retrieves the stored configuration for a series from session state.
        Useful for applying configs when creating new series instances.

        Args:
            key: Component key used to namespace the stored configs.
            series_index: Index of the series (default: 0).
            pane_id: Pane ID for the series (default: 0).

        Returns:
            Dictionary of stored configuration or empty dict if none found.

        Example:
            ```python
            # Get stored config for series
            config = manager.get_stored_series_config("my_chart", series_index=0)

            # Apply to new series
            if config:
                line_series = LineSeries(data)
                if "color" in config:
                    line_series.line_options.color = config["color"]
            ```
        """
        session_key = f"_chart_series_configs_{key}"
        stored_configs = st.session_state.get(session_key, {})
        series_id = f"pane-{pane_id}-series-{series_index}"
        return stored_configs.get(series_id, {})

    def save_series_configs(self, key: str, configs: Dict[str, Any]) -> None:
        """Save series configurations to Streamlit session state.

        Persists series configurations across reruns.

        Args:
            key: Component key used to namespace the stored configs.
            configs: Dictionary of series configurations to save.

        Example:
            ```python
            configs = {"pane-0-series-0": {"color": "red", "lineWidth": 2}}
            manager.save_series_configs("my_chart", configs)
            ```
        """
        if not key:
            return

        session_key = f"_chart_series_configs_{key}"
        st.session_state[session_key] = configs

    def load_series_configs(self, key: str) -> Dict[str, Any]:
        """Load series configurations from Streamlit session state.

        Retrieves persisted series configurations.

        Args:
            key: Component key used to namespace the stored configs.

        Returns:
            Dictionary of series configurations or empty dict if none found.

        Example:
            ```python
            configs = manager.load_series_configs("my_chart")
            ```
        """
        if not key:
            return {}

        session_key = f"_chart_series_configs_{key}"
        return st.session_state.get(session_key, {})

    def apply_stored_configs_to_series(
        self,
        stored_configs: Dict[str, Any],
        series_list: List[Series],
    ) -> None:
        """Apply stored configurations to series objects.

        Updates series objects with persisted configurations. Optimized to apply
        all configurations in a single pass to prevent flicker.

        Args:
            stored_configs: Dictionary mapping series IDs to their configurations.
            series_list: List of series objects to apply configurations to.

        Example:
            ```python
            configs = manager.load_series_configs("my_chart")
            if configs:
                manager.apply_stored_configs_to_series(configs, chart.series)
            ```
        """
        if not stored_configs:
            return

        # Check if configs have already been applied in this render cycle
        # This prevents double application which can cause flicker
        if self._configs_applied:
            return

        for i, series in enumerate(series_list):
            # Generate the expected series ID - support both pane-0 and multi-pane
            pane_id = getattr(series, "pane_id", 0) or 0
            series_id = f"pane-{pane_id}-series-{i}"

            if series_id in stored_configs:
                config = stored_configs[series_id]

                # Log what we're applying for debugging
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
                        # Other properties go to the series itself
                        else:
                            series_config[key] = value

                    # Apply all configurations in a single batch to minimize updates
                    # Apply line options config if this is a series with line_options
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

                except Exception:
                    logger.exception("Failed to apply config to series %s", series_id)

        # Mark configs as applied for this render cycle
        self._configs_applied = True

    def reset_config_application_flag(self) -> None:
        """Reset the config application flag.

        This should be called at the start of each render cycle to allow
        configs to be applied fresh.

        Example:
            ```python
            manager.reset_config_application_flag()
            ```
        """
        self._configs_applied = False

    def has_stored_configs(self, key: str) -> bool:
        """Check if stored configurations exist for a key.

        Args:
            key: Component key to check.

        Returns:
            True if stored configurations exist, False otherwise.

        Example:
            ```python
            if manager.has_stored_configs("my_chart"):
                print("Stored configs exist")
            ```
        """
        if not key:
            return False

        session_key = f"_chart_series_configs_{key}"
        return session_key in st.session_state and bool(st.session_state[session_key])

    def clear_stored_configs(self, key: str) -> None:
        """Clear stored configurations for a key.

        Args:
            key: Component key to clear.

        Example:
            ```python
            manager.clear_stored_configs("my_chart")
            ```
        """
        if not key:
            return

        session_key = f"_chart_series_configs_{key}"
        if session_key in st.session_state:
            del st.session_state[session_key]
