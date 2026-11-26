"""Chart rendering and frontend configuration for Chart component.

This module handles the generation of frontend configuration and rendering
of chart components in Streamlit.
"""

import json
from datetime import datetime
from typing import TYPE_CHECKING, Any

import streamlit as st

from lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.charts.series_settings_api import get_series_settings_api
from streamlit_lightweight_charts_pro.component import get_component_func, reinitialize_component
from streamlit_lightweight_charts_pro.exceptions import ComponentNotAvailableError

if TYPE_CHECKING:
    from streamlit_lightweight_charts_pro.charts.chart_manager import ChartManager


# Initialize logger
logger = get_logger(__name__)


class ChartRenderer:
    """Manages chart rendering and frontend configuration.

    This class handles all rendering operations including:
    - Converting chart data to frontend configuration
    - Rendering the Streamlit component
    - Handling frontend responses
    - Managing data-aware range filtering

    Attributes:
        chart_manager_ref: Optional reference to ChartManager for sync config.
    """

    def __init__(self, chart_manager_ref: "ChartManager" | None = None):
        """Initialize the ChartRenderer.

        Args:
            chart_manager_ref: Optional reference to ChartManager for
                synchronization configuration.
        """
        self.chart_manager_ref = chart_manager_ref

    def generate_frontend_config(
        self,
        chart_id: str,
        chart_options: Any,
        series_configs: list[dict[str, Any]],
        annotations_config: dict[str, Any],
        trades_config: dict[str, Any] | None,
        tooltip_configs: dict[str, Any] | None,
        chart_group_id: int,
        price_scale_config: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate the complete frontend configuration.

        Args:
            chart_id: Unique identifier for the chart.
            chart_options: Chart options configuration.
            series_configs: List of series configurations.
            annotations_config: Annotations configuration.
            trades_config: Optional trades configuration.
            tooltip_configs: Optional tooltip configurations.
            chart_group_id: Chart group ID for synchronization.
            price_scale_config: Price scale configurations.

        Returns:
            Complete frontend configuration dictionary.
        """
        chart_config = chart_options.asdict() if chart_options is not None else {}

        # Merge price scale configuration
        chart_config.update(price_scale_config)

        # Apply data-aware range filtering
        chart_config = self._filter_range_switcher_by_data(
            chart_config,
            series_configs,
        )

        chart_obj: dict[str, Any] = {
            "chartId": chart_id,
            "chart": chart_config,
            "series": series_configs,
            "annotations": annotations_config,
        }

        # Add trades configuration if present
        if trades_config:
            chart_obj.update(trades_config)

        # Add tooltip configurations if present
        if tooltip_configs:
            chart_obj["tooltipConfigs"] = tooltip_configs

        # Add chart group ID
        chart_obj["chartGroupId"] = chart_group_id

        config: dict[str, Any] = {
            "charts": [chart_obj],
        }

        # Add sync configuration if ChartManager reference is available
        if self.chart_manager_ref is not None:
            config["syncConfig"] = self._get_sync_config(chart_group_id)

        return config

    def _get_sync_config(self, chart_group_id: int) -> dict[str, Any]:
        """Get synchronization configuration from ChartManager.

        Args:
            chart_group_id: Chart group ID to get sync config for.

        Returns:
            Synchronization configuration dictionary.
        """
        group_sync_enabled = False
        group_sync_config = None

        if (
            self.chart_manager_ref.sync_groups
            and str(chart_group_id) in self.chart_manager_ref.sync_groups
        ):
            group_sync_config = self.chart_manager_ref.sync_groups[str(chart_group_id)]
            group_sync_enabled = group_sync_config.enabled

        sync_enabled = self.chart_manager_ref.default_sync.enabled or group_sync_enabled

        sync_config: dict[str, Any] = {
            "enabled": sync_enabled,
            "crosshair": self.chart_manager_ref.default_sync.crosshair,
            "timeRange": self.chart_manager_ref.default_sync.time_range,
        }

        # Add group-specific sync configurations
        if self.chart_manager_ref.sync_groups:
            sync_config["groups"] = {}
            for group_id, group_sync in self.chart_manager_ref.sync_groups.items():
                sync_config["groups"][str(group_id)] = {
                    "enabled": group_sync.enabled,
                    "crosshair": group_sync.crosshair,
                    "timeRange": group_sync.time_range,
                }

        return sync_config

    def _filter_range_switcher_by_data(
        self,
        chart_config: dict[str, Any],
        series_configs: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Filter range switcher options based on available data timespan.

        Args:
            chart_config: The chart configuration dictionary.
            series_configs: List of series configurations.

        Returns:
            Modified chart configuration with filtered range options.
        """
        # Only process if range switcher is configured
        if not (chart_config.get("rangeSwitcher") and chart_config["rangeSwitcher"].get("ranges")):
            return chart_config

        # Calculate data timespan from all series
        data_timespan_seconds = self._calculate_data_timespan(series_configs)
        if data_timespan_seconds is None:
            return chart_config

        # Filter ranges based on data timespan
        original_ranges = chart_config["rangeSwitcher"]["ranges"]
        filtered_ranges = []

        for range_config in original_ranges:
            range_seconds = self._get_range_seconds(range_config)

            # Keep range if it's "All" or within data timespan
            if range_seconds is None or range_seconds <= data_timespan_seconds * 1.1:
                filtered_ranges.append(range_config)

        # If all ranges were filtered out, hide the range switcher
        if not filtered_ranges:
            chart_config["rangeSwitcher"]["visible"] = False
        else:
            chart_config["rangeSwitcher"]["ranges"] = filtered_ranges
        return chart_config

    def _calculate_data_timespan(
        self,
        series_configs: list[dict[str, Any]],
    ) -> float | None:
        """Calculate the timespan of data across all series in seconds.

        Args:
            series_configs: List of series configurations with data.

        Returns:
            Timespan in seconds or None if unable to calculate.
        """
        min_time = None
        max_time = None

        for series_config in series_configs:
            data = series_config.get("data", [])
            if not data:
                continue

            for data_point in data:
                time_value = None

                # Extract time from various data formats
                if isinstance(data_point, dict) and "time" in data_point:
                    time_value = data_point["time"]
                elif hasattr(data_point, "time"):
                    time_value = data_point.time

                if time_value is None:
                    continue

                # Convert time to timestamp
                timestamp = self._convert_time_to_timestamp(time_value)
                if timestamp is None:
                    continue

                if min_time is None or timestamp < min_time:
                    min_time = timestamp
                if max_time is None or timestamp > max_time:
                    max_time = timestamp

        if min_time is None or max_time is None:
            return None

        return max_time - min_time

    def _convert_time_to_timestamp(self, time_value) -> float | None:
        """Convert various time formats to timestamp.

        Args:
            time_value: Time value in various formats.

        Returns:
            Timestamp in seconds or None if conversion fails.
        """
        if isinstance(time_value, int | float):
            return float(time_value)
        if isinstance(time_value, str):
            try:
                dt = datetime.fromisoformat(time_value.replace("Z", "+00:00"))
                return dt.timestamp()
            except (ValueError, AttributeError):
                try:
                    dt = datetime.strptime(time_value, "%Y-%m-%d")
                    return dt.timestamp()
                except ValueError:
                    return None
        elif hasattr(time_value, "timestamp"):
            return time_value.timestamp()
        return None

    def _get_range_seconds(self, range_config: dict[str, Any]) -> float | None:
        """Extract seconds from range configuration.

        Args:
            range_config: Range configuration dictionary.

        Returns:
            Number of seconds in the range or None for "ALL".
        """
        range_value = range_config.get("range")

        if range_value is None or range_value == "ALL":
            return None

        range_seconds_map = {
            "FIVE_MINUTES": 300,
            "FIFTEEN_MINUTES": 900,
            "THIRTY_MINUTES": 1800,
            "ONE_HOUR": 3600,
            "FOUR_HOURS": 14400,
            "ONE_DAY": 86400,
            "ONE_WEEK": 604800,
            "TWO_WEEKS": 1209600,
            "ONE_MONTH": 2592000,
            "THREE_MONTHS": 7776000,
            "SIX_MONTHS": 15552000,
            "ONE_YEAR": 31536000,
            "TWO_YEARS": 63072000,
            "FIVE_YEARS": 157680000,
        }

        if isinstance(range_value, str) and range_value in range_seconds_map:
            return range_seconds_map[range_value]
        if isinstance(range_value, int | float):
            return float(range_value)

        return None

    def render(
        self,
        config: dict[str, Any],
        key: str,
        chart_options: Any,
    ) -> Any:
        """Render the chart in Streamlit.

        Args:
            config: Complete frontend configuration.
            key: Unique key for the Streamlit component (already validated).
            chart_options: Chart options for extracting height/width.

        Returns:
            The rendered Streamlit component.

        Raises:
            ComponentNotAvailableError: If component cannot be loaded.
        """
        # Render component with frontend configuration
        return self._render_component(config, key, chart_options)

    def _render_component(
        self,
        config: dict[str, Any],
        key: str,
        chart_options: Any,
    ) -> Any:
        """Internal method to render the Streamlit component.

        Args:
            config: Complete frontend configuration.
            key: Unique key for the Streamlit component.
            chart_options: Chart options for extracting height/width.

        Returns:
            The rendered Streamlit component.

        Raises:
            ComponentNotAvailableError: If component cannot be loaded.
        """
        # Get component function
        component_func = get_component_func()

        if component_func is None:
            if reinitialize_component():
                component_func = get_component_func()

            if component_func is None:
                raise ComponentNotAvailableError()

        # Build component kwargs
        kwargs: dict[str, Any] = {"config": config}

        # Extract height and width from chart options.
        # When auto_size / auto_height / auto_width is on, omit fixed dimensions so
        # the frontend does not receive Python's default height=400 as a hard pin.
        if chart_options:
            auto_size = bool(getattr(chart_options, "auto_size", False))
            auto_height = bool(getattr(chart_options, "auto_height", False))
            auto_width = bool(getattr(chart_options, "auto_width", False))
            if (
                hasattr(chart_options, "height")
                and chart_options.height is not None
                and not (auto_size or auto_height)
            ):
                kwargs["height"] = chart_options.height
            if (
                hasattr(chart_options, "width")
                and chart_options.width is not None
                and not (auto_size or auto_width)
            ):
                kwargs["width"] = chart_options.width

        kwargs["key"] = key
        kwargs["default"] = None

        # Deliver series-settings replies computed on the previous run.
        # The component iframe listens for these on its own document; a
        # separate components.html iframe cannot reach that listener.
        api_responses = self._api_responses_for_render(key)
        if api_responses:
            kwargs["apiResponses"] = api_responses

        # Render component
        return component_func(**kwargs)

    def handle_response(
        self,
        response: Any,
        key: str,
        session_state_manager: Any,
    ) -> None:
        """Handle component return value and save series configs.

        Args:
            response: Response data from the frontend component.
            key: Component key for session state.
            session_state_manager: SessionStateManager for config persistence.
        """
        if response and isinstance(response, dict):
            # Check if we have series config changes from the frontend
            if response.get("type") == "series_config_changes":
                changes = response.get("changes", [])
                if changes:
                    # Build a dictionary of all current series configs
                    series_configs = {}
                    for change in changes:
                        series_id = change.get("seriesId")
                        config = change.get("config")
                        if series_id and config:
                            series_configs[series_id] = config

                    # Save to session state
                    if series_configs:
                        session_state_manager.save_series_configs(key, series_configs)

            # Handle series settings API responses
            series_api = get_series_settings_api(key)
            self._handle_series_settings_response(response, series_api, key)

    def _pending_api_key(self, key: str) -> str:
        """Session-state key for replies waiting to be sent to the frontend."""
        return f"_chart_api_pending_{key}"

    def _delivered_api_key(self, key: str) -> str:
        """Session-state key for replies already included in a render."""
        return f"_chart_api_delivered_{key}"

    def _api_responses_for_render(self, key: str) -> list[dict[str, Any]]:
        """Return queued series-settings replies for this component render.

        Args:
            key: Streamlit component key.

        Returns:
            JSON-ready reply objects, or an empty list when none are pending.
        """
        if not key:
            return []
        pending = st.session_state.pop(self._pending_api_key(key), [])
        if not isinstance(pending, list):
            return []
        delivered_key = self._delivered_api_key(key)
        delivered = st.session_state.get(delivered_key, [])
        if not isinstance(delivered, list):
            delivered = []
        for item in pending:
            if isinstance(item, dict) and item.get("messageId"):
                delivered.append(item["messageId"])
        if delivered:
            st.session_state[delivered_key] = delivered[-50:]
        return list(pending)

    def _queue_api_response(self, key: str, payload: dict[str, Any]) -> None:
        """Queue a reply and rerun so the next render can pass it as args.

        The frontend resolves ``streamlit:apiResponse`` from ``apiResponses``
        on the following render. A message id is delivered once.

        Args:
            key: Streamlit component key.
            payload: Object with ``messageId`` and ``response``.
        """
        message_id = payload.get("messageId")
        if not key or not message_id:
            return

        delivered = st.session_state.get(self._delivered_api_key(key), [])
        if not isinstance(delivered, list):
            delivered = []
        if message_id in delivered:
            return

        pending_key = self._pending_api_key(key)
        pending = st.session_state.get(pending_key, [])
        if not isinstance(pending, list):
            pending = []

        already_queued = any(
            isinstance(item, dict) and item.get("messageId") == message_id for item in pending
        )
        if already_queued:
            # This render already received the reply in its args.
            delivered.append(message_id)
            st.session_state[self._delivered_api_key(key)] = delivered[-50:]
            st.session_state[pending_key] = [
                item
                for item in pending
                if not (isinstance(item, dict) and item.get("messageId") == message_id)
            ]
            return

        pending.append(payload)
        st.session_state[pending_key] = pending
        st.rerun()

    @staticmethod
    def _coerce_pane_id(value: Any) -> int:
        """Coerce a frontend pane id to int.

        Args:
            value: Pane id from the component, which may be a string.

        Returns:
            Integer pane id, or 0 when the value cannot be parsed.
        """
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0

    @staticmethod
    def _json_ready(payload: dict[str, Any]) -> dict[str, Any]:
        """Return a JSON-serializable copy of a component arg.

        Args:
            payload: Reply payload that will be passed as a component arg.

        Returns:
            Payload with non-JSON values stringified.
        """
        return json.loads(json.dumps(payload, default=str))

    def _handle_series_settings_response(self, response: dict, series_api, key: str) -> None:
        """Handle series settings API requests from the frontend.

        Applies the request to ``series_api`` and queues the acknowledgement
        in session state. The next render passes it back as ``apiResponses``.

        Args:
            response: Response data from the frontend component.
            series_api: SeriesSettingsAPI instance for this chart.
            key: Streamlit component key used to namespace the reply.
        """
        try:
            message_id = response.get("messageId")
            if message_id:
                delivered = st.session_state.get(self._delivered_api_key(key), [])
                if isinstance(delivered, list) and message_id in delivered:
                    return
            reply = self._series_settings_reply(response, series_api)
            if reply is not None:
                self._queue_api_response(key, reply)
        except (KeyError, ValueError, TypeError, AttributeError):
            logger.exception("Error handling series settings response")

    def _series_settings_reply(self, response: dict, series_api) -> dict[str, Any] | None:
        """Apply one series-settings request and build its reply.

        Args:
            response: Frontend component value.
            series_api: SeriesSettingsAPI instance for this chart.

        Returns:
            Reply payload for the frontend, or None when no ack is required.
        """
        response_type = response.get("type")
        message_id = response.get("messageId")
        body: dict[str, Any] | None = None

        if response_type == "get_pane_state":
            pane_id = self._coerce_pane_id(response.get("paneId", 0))
            body = {"success": True, "data": series_api.get_pane_state(pane_id)}
        elif response_type == "update_series_settings":
            pane_id = self._coerce_pane_id(response.get("paneId", 0))
            series_id = response.get("seriesId", "")
            config = response.get("config", {})
            success = series_api.update_series_settings(pane_id, series_id, config)
            body = {"success": success}
        elif response_type == "reset_series_defaults":
            pane_id = self._coerce_pane_id(response.get("paneId", 0))
            series_id = response.get("seriesId", "")
            defaults = series_api.reset_series_to_defaults(pane_id, series_id)
            body = {"success": defaults is not None, "data": defaults or {}}
        elif response_type == "update_multiple_settings":
            success = True
            for patch in response.get("patches") or []:
                if not isinstance(patch, dict):
                    success = False
                    continue
                updated = series_api.update_series_settings(
                    self._coerce_pane_id(patch.get("paneId", 0)),
                    patch.get("seriesId", ""),
                    patch.get("config", {}),
                )
                success = success and updated
            body = {"success": success}
        elif response_type == "series_config_changes":
            self._store_series_config_changes(response, series_api)

        if body is None or not message_id:
            return None
        return self._json_ready({"messageId": str(message_id), "response": body})

    def _store_series_config_changes(self, response: dict, series_api) -> None:
        """Persist batched series config changes from the frontend.

        Args:
            response: Component value with a ``changes`` list.
            series_api: SeriesSettingsAPI instance for this chart.
        """
        for change in response.get("changes", []):
            if not isinstance(change, dict):
                logger.warning("Skipping invalid change (missing seriesId or config)")
                continue
            pane_id = self._coerce_pane_id(change.get("paneId", 0))
            series_id = change.get("seriesId", "")
            config = change.get("config", {})
            if series_id and config:
                success = series_api.update_series_settings(pane_id, series_id, config)
                if not success:
                    logger.warning("Failed to store config for series %s", series_id)
            else:
                logger.warning("Skipping invalid change (missing seriesId or config)")
