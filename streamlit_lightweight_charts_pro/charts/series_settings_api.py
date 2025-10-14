"""Series Settings API for Streamlit Backend Integration.

This module provides the backend API for handling series settings requests
from the React frontend. It manages persistence of series configurations
in Streamlit session state and provides methods for:
- Getting current pane/series state
- Updating series settings with patches
- Resetting series to defaults
- Batch operations for multiple settings changes

The API integrates with the existing Chart and Series classes and maintains
compatibility with the series configuration system.
"""

import time
from typing import Any, Dict, List, Optional

import streamlit as st

from streamlit_lightweight_charts_pro.charts.series import Series
from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.types.series_config_types import (
    SeriesConfigState,
)

logger = get_logger(__name__)


class SeriesSettingsAPI:
    """Backend API for handling series settings from the frontend."""

    def __init__(self, chart_id: str = "default"):
        """Initialize the API with a chart ID.

        Args:
            chart_id: Unique identifier for the chart instance
        """
        self.chart_id = chart_id
        self._session_key = f"chart_model_{chart_id}"
        self._ensure_session_state()

    def _ensure_session_state(self) -> None:
        """Ensure session state is initialized for this chart."""
        if self._session_key not in st.session_state:
            st.session_state[self._session_key] = {
                "panes": {},  # {pane_id: {series_id: SeriesConfigState}}
                "series_refs": {},  # {series_id: Series instance}
                "last_update": time.time(),
            }

    def _get_chart_state(self) -> Dict[str, Any]:
        """Get the current chart state from session."""
        # Initialize state if it doesn't exist
        if self._session_key not in st.session_state:
            self._ensure_session_state()
        return st.session_state[self._session_key]

    def _update_last_modified(self) -> None:
        """Update the last modified timestamp."""
        st.session_state[self._session_key]["last_update"] = time.time()

    def register_series(
        self,
        pane_id: int,
        series: Series,
        series_index: Optional[int] = None,
    ) -> None:
        """Register a series instance with the API.

        Args:
            pane_id: The pane ID where the series belongs
            series: The series instance to register
            series_index: Optional series index for generating consistent series IDs.
                If provided, generates ID as "pane-{paneId}-series-{index}".
                If not provided, falls back to legacy format.
        """
        chart_state = self._get_chart_state()

        # Initialize pane if it doesn't exist
        if str(pane_id) not in chart_state["panes"]:
            chart_state["panes"][str(pane_id)] = {}

        # CRITICAL FIX: Generate series ID in same format as frontend expects
        # Frontend uses: "pane-{paneId}-series-{index}"
        # This ensures storage and retrieval keys match
        if series_index is not None:
            series_id = f"pane-{pane_id}-series-{series_index}"
        else:
            # Fallback to legacy format for backward compatibility
            series_id = getattr(series, "id", f"series_{len(chart_state['series_refs'])}")

        chart_state["series_refs"][series_id] = series

        # Check if series config already exists (from previous interaction)
        pane_key = str(pane_id)
        if series_id in chart_state["panes"][pane_key]:
            # Config exists from previous interaction - apply it to the series
            existing_config = chart_state["panes"][pane_key][series_id]
            if isinstance(existing_config, SeriesConfigState):
                stored_config = existing_config.config
                # Apply stored config to series to preserve user changes
                if hasattr(series, "update") and callable(series.update):
                    series.update(stored_config)
                else:
                    # Fallback: set attributes directly
                    for key, value in stored_config.items():
                        if hasattr(series, key):
                            setattr(series, key, value)
        else:
            # First time registration - initialize with EMPTY config
            # We only store user changes, not the default series state
            # This prevents conflicts between stored defaults and user modifications
            chart_state["panes"][pane_key][series_id] = SeriesConfigState(
                config={},  # Start empty - only store user changes
                series_type=series.__class__.__name__.lower(),
                last_modified=int(time.time()),
            )

        self._update_last_modified()

    def get_pane_state(self, pane_id: int) -> Dict[str, Any]:
        """Get current state for a specific pane.

        Args:
            pane_id: The pane ID to get state for

        Returns:
            Dictionary containing pane state with series configurations
        """
        chart_state = self._get_chart_state()
        pane_key = str(pane_id)

        if pane_key not in chart_state["panes"]:
            return {"paneId": pane_id, "series": {}}

        # Convert SeriesConfigState objects to dicts
        pane_series = {}
        for series_id, config_state in chart_state["panes"][pane_key].items():
            if isinstance(config_state, SeriesConfigState):
                pane_series[series_id] = config_state.asdict()
            else:
                pane_series[series_id] = config_state

        return {
            "paneId": pane_id,
            "series": pane_series,
        }

    def update_series_settings(
        self,
        pane_id: int,
        series_id: str,
        config_patch: Dict[str, Any],
    ) -> bool:
        """Update series settings with a configuration patch.

        Args:
            pane_id: The pane ID containing the series
            series_id: The series ID to update
            config_patch: Dictionary containing configuration updates

        Returns:
            True if update was successful, False otherwise
        """
        try:
            chart_state = self._get_chart_state()
            pane_key = str(pane_id)

            # Ensure pane exists
            if pane_key not in chart_state["panes"]:
                chart_state["panes"][pane_key] = {}

            # Ensure series config exists
            if series_id not in chart_state["panes"][pane_key]:
                chart_state["panes"][pane_key][series_id] = SeriesConfigState(
                    config={},
                    series_type="unknown",
                    last_modified=int(time.time()),
                )

            # Get current config
            current_state = chart_state["panes"][pane_key][series_id]
            if isinstance(current_state, SeriesConfigState):
                current_config = current_state.config.copy()
            else:
                current_config = current_state.get("config", {}).copy()

            # Apply patch - handle nested structures like mainLine
            for key, value in config_patch.items():
                if isinstance(value, dict) and key in ("mainLine", "lineOptions", "options"):
                    # Flatten nested line options to top-level properties
                    for nested_key, nested_value in value.items():
                        current_config[nested_key] = nested_value
                else:
                    current_config[key] = value

            # Clean up config: remove problematic nested structures and data
            # We only want to store user-changeable UI properties, not data or defaults
            cleaned_config = {
                key: value
                for key, value in current_config.items()
                if key not in ("data", "options", "lineOptions", "mainLine")
            }

            # Update the stored configuration
            chart_state["panes"][pane_key][series_id] = SeriesConfigState(
                config=cleaned_config,
                series_type=(
                    current_state.series_type
                    if isinstance(current_state, SeriesConfigState)
                    else "unknown"
                ),
                last_modified=int(time.time()),
            )

            # Update the actual series object if available
            if series_id in chart_state["series_refs"]:
                series_instance = chart_state["series_refs"][series_id]
                try:
                    # Use update() method which all Series classes have
                    if hasattr(series_instance, "update") and callable(series_instance.update):
                        series_instance.update(config_patch)
                    else:
                        # Fallback to setting attributes directly
                        for key, value in config_patch.items():
                            if hasattr(series_instance, key):
                                setattr(series_instance, key, value)

                except Exception as e:
                    logger.warning("Failed to update series instance %s: %s", series_id, e)

            self._update_last_modified()
        except Exception:
            logger.exception("Failed to update series settings")
            return False
        else:
            return True

    def reset_series_to_defaults(
        self,
        pane_id: int,
        series_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Reset a series to its default configuration.

        Args:
            pane_id: The pane ID containing the series
            series_id: The series ID to reset

        Returns:
            Dictionary containing the default configuration, or None if failed
        """
        try:
            chart_state = self._get_chart_state()

            # Get the series instance to determine defaults
            if series_id in chart_state["series_refs"]:
                series_instance = chart_state["series_refs"][series_id]

                # Get default configuration based on series type
                default_config = self._get_series_defaults(series_instance)

                # Update the stored configuration
                pane_key = str(pane_id)
                if pane_key in chart_state["panes"] and series_id in chart_state["panes"][pane_key]:
                    chart_state["panes"][pane_key][series_id] = SeriesConfigState(
                        config=default_config,
                        series_type=series_instance.__class__.__name__.lower(),
                        last_modified=int(time.time()),
                    )

                    # Update the series instance
                    if hasattr(series_instance, "update") and callable(series_instance.update):
                        series_instance.update(default_config)

                    self._update_last_modified()
                    return default_config

        except Exception:
            logger.exception("Failed to reset series to defaults")

        return None

    def _get_series_defaults(self, series_instance: Series) -> Dict[str, Any]:
        """Get default configuration for a series type.

        Args:
            series_instance: The series instance to get defaults for

        Returns:
            Dictionary containing default configuration
        """
        series_type = series_instance.__class__.__name__.lower()

        # Common defaults for all series types
        defaults: Dict[str, Any] = {
            "visible": True,
            "markers": False,
            "last_value_visible": True,
            "price_line": True,
        }

        # Series-specific defaults
        if "ribbon" in series_type:
            defaults.update(
                {
                    "upper_line": {
                        "color": "#4CAF50",
                        "line_style": "solid",
                        "line_width": 2,
                    },
                    "lower_line": {
                        "color": "#F44336",
                        "line_style": "solid",
                        "line_width": 2,
                    },
                    "fill": True,
                    "fill_color": "#2196F3",
                    "fill_opacity": 20,
                },
            )
        elif "line" in series_type:
            defaults.update(
                {
                    "color": "#2196F3",
                    "line_style": "solid",
                    "line_width": 1,
                },
            )
        elif "candlestick" in series_type:
            defaults.update(
                {
                    "upColor": "#4CAF50",
                    "downColor": "#F44336",
                    "wickUpColor": "#4CAF50",
                    "wickDownColor": "#F44336",
                },
            )
        elif "area" in series_type:
            defaults.update(
                {
                    "topColor": "#2196F3",
                    "bottomColor": "rgba(33, 150, 243, 0.1)",
                    "lineColor": "#2196F3",
                    "lineWidth": 2,
                },
            )

        return defaults

    def update_multiple_settings(
        self,
        patches: List[Dict[str, Any]],
    ) -> bool:
        """Update multiple series settings in a batch operation.

        Args:
            patches: List of setting patches, each containing paneId, seriesId, and config

        Returns:
            True if all updates were successful, False otherwise
        """
        try:
            success = True
            for patch in patches:
                pane_id = patch.get("paneId", 0)
                series_id = patch.get("seriesId", "")
                config = patch.get("config", {})

                if not self.update_series_settings(pane_id, series_id, config):
                    success = False
                    logger.warning("Failed to update series %s in pane %s", series_id, pane_id)

        except Exception:
            logger.exception("Failed to update multiple settings")
            return False
        else:
            return success

    def get_all_series_info(self, pane_id: int) -> List[Dict[str, Any]]:
        """Get information about all series in a pane.

        Args:
            pane_id: The pane ID to get series info for

        Returns:
            List of dictionaries containing series information
        """
        chart_state = self._get_chart_state()
        pane_key = str(pane_id)
        series_info = []

        if pane_key in chart_state["panes"]:
            for series_id, config_state in chart_state["panes"][pane_key].items():
                # Get series instance for display name
                series_instance = chart_state["series_refs"].get(series_id)
                display_name = series_id

                if series_instance:
                    # Try to get a more user-friendly name
                    if hasattr(series_instance, "name") and series_instance.name:
                        display_name = series_instance.name
                    elif hasattr(series_instance, "title") and series_instance.title:
                        display_name = series_instance.title

                series_type = (
                    config_state.series_type
                    if isinstance(config_state, SeriesConfigState)
                    else "unknown"
                )

                series_info.append(
                    {
                        "id": series_id,
                        "displayName": display_name,
                        "type": series_type,
                    },
                )

        return series_info


def create_series_settings_api(chart_id: str = "default") -> SeriesSettingsAPI:
    """Create a SeriesSettingsAPI instance.

    Args:
        chart_id: Unique identifier for the chart

    Returns:
        SeriesSettingsAPI instance
    """
    return SeriesSettingsAPI(chart_id)


# Global API instances cache to avoid recreating for the same chart
_api_instances: Dict[str, SeriesSettingsAPI] = {}


def get_series_settings_api(chart_id: str = "default") -> SeriesSettingsAPI:
    """Get or create a SeriesSettingsAPI instance.

    Args:
        chart_id: Unique identifier for the chart

    Returns:
        SeriesSettingsAPI instance
    """
    if chart_id not in _api_instances:
        _api_instances[chart_id] = SeriesSettingsAPI(chart_id)
    return _api_instances[chart_id]
