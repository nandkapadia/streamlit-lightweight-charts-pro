"""Chart rendering and frontend configuration for Chart component.

This module provides the ChartRenderer class which handles all rendering
and frontend configuration operations for the Chart class.
"""

import json
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

from streamlit_lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.charts.options.price_scale_options import PriceScaleOptions
from streamlit_lightweight_charts_pro.charts.series_settings_api import get_series_settings_api
from streamlit_lightweight_charts_pro.component import (
    get_component_func,
    reinitialize_component,
)
from streamlit_lightweight_charts_pro.data.annotation import AnnotationManager
from streamlit_lightweight_charts_pro.data.tooltip import TooltipManager
from streamlit_lightweight_charts_pro.exceptions import (
    ComponentNotAvailableError,
    PriceScaleIdTypeError,
    PriceScaleOptionsTypeError,
)
from streamlit_lightweight_charts_pro.logging_config import get_logger

# Initialize logger
logger = get_logger(__name__)


class ChartRenderer:
    """Handles rendering and frontend configuration for charts.

    This class provides centralized management of all rendering operations
    for a chart, including frontend configuration generation, component
    rendering, and response handling.
    """

    def __init__(self) -> None:
        """Initialize the chart renderer."""
        pass

    def filter_range_switcher_by_data(
        self,
        chart_config: Dict[str, Any],
        data_timespan_seconds: Optional[float],
    ) -> Dict[str, Any]:
        """Filter range switcher options based on available data timespan.

        This method removes range options that exceed the available data range
        for a cleaner user experience.

        Args:
            chart_config: The chart configuration dictionary.
            data_timespan_seconds: Data timespan in seconds, or None if no data.

        Returns:
            Modified chart configuration with filtered range options.
        """
        # Only process if range switcher is configured
        if not (chart_config.get("rangeSwitcher") and chart_config["rangeSwitcher"].get("ranges")):
            return chart_config

        if data_timespan_seconds is None:
            return chart_config  # No data or unable to calculate, keep all ranges

        # Filter ranges based on data timespan
        original_ranges = chart_config["rangeSwitcher"]["ranges"]
        filtered_ranges = []

        for range_config in original_ranges:
            range_seconds = self._get_range_seconds(range_config)

            # Keep range if:
            # - It's "All" range (range_seconds is None)
            # - It's within data timespan (with small buffer for edge cases)
            if range_seconds is None or range_seconds <= data_timespan_seconds * 1.1:
                filtered_ranges.append(range_config)

        # Update the chart config with filtered ranges
        chart_config["rangeSwitcher"]["ranges"] = filtered_ranges

        return chart_config

    def _get_range_seconds(self, range_config: Dict[str, Any]) -> Optional[float]:
        """Extract seconds from range configuration."""
        range_value = range_config.get("range")

        if range_value is None or range_value == "ALL":
            return None

        # Handle TimeRange enum values
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
        if isinstance(range_value, (int, float)):
            return float(range_value)

        return None

    def calculate_data_timespan(self, series_configs: List[Dict[str, Any]]) -> Optional[float]:
        """Calculate the timespan of data across all series in seconds.

        Args:
            series_configs: List of series configuration dictionaries.

        Returns:
            Data timespan in seconds, or None if unable to calculate.
        """
        min_time = None
        max_time = None

        for series_config in series_configs:
            if "data" not in series_config or not series_config["data"]:
                continue

            for data_point in series_config["data"]:
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

    def _convert_time_to_timestamp(self, time_value) -> Optional[float]:
        """Convert various time formats to timestamp."""
        if isinstance(time_value, (int, float)):
            return float(time_value)
        if isinstance(time_value, str):
            try:
                # Try parsing ISO format
                dt = datetime.fromisoformat(time_value.replace("Z", "+00:00"))
                return dt.timestamp()
            except (ValueError, AttributeError):
                try:
                    # Try parsing as date
                    dt = datetime.strptime(time_value, "%Y-%m-%d")
                    return dt.timestamp()
                except ValueError:
                    return None
        elif hasattr(time_value, "timestamp"):
            return time_value.timestamp()
        return None

    def to_frontend_config(
        self,
        series_configs: List[Dict[str, Any]],
        chart_options: Optional[ChartOptions],
        annotation_manager: AnnotationManager,
        tooltip_manager: Optional[TooltipManager],
        trades_config: Optional[List[Dict[str, Any]]],
        chart_group_id: int,
        chart_manager: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Convert chart components to frontend configuration dictionary.

        Args:
            series_configs: List of series configuration dictionaries.
            chart_options: Chart configuration options.
            annotation_manager: Annotation manager instance.
            tooltip_manager: Tooltip manager instance (optional).
            trades_config: Trades configuration (optional).
            chart_group_id: Chart group ID for synchronization.
            chart_manager: Reference to ChartManager for sync config (optional).

        Returns:
            Complete chart configuration ready for frontend rendering.
        """
        chart_config = (
            chart_options.asdict() if chart_options is not None else ChartOptions().asdict()
        )

        # Ensure price scales are present and properly formatted
        if chart_options and chart_options.right_price_scale is not None:
            try:
                chart_config["rightPriceScale"] = chart_options.right_price_scale.asdict()
                # Validate price scale ID is a string if provided
                if chart_options.right_price_scale.price_scale_id is not None and not isinstance(
                    chart_options.right_price_scale.price_scale_id,
                    str,
                ):
                    raise PriceScaleIdTypeError(
                        "right_price_scale",
                        type(chart_options.right_price_scale.price_scale_id),
                    )
            except AttributeError as e:
                if isinstance(chart_options.right_price_scale, bool):
                    raise PriceScaleOptionsTypeError(
                        "right_price_scale",
                        type(chart_options.right_price_scale),
                    ) from e
                raise PriceScaleOptionsTypeError(
                    "right_price_scale",
                    type(chart_options.right_price_scale),
                ) from e

        if chart_options and chart_options.left_price_scale is not None:
            try:
                chart_config["leftPriceScale"] = chart_options.left_price_scale.asdict()
                # Validate price scale ID is a string if provided
                if chart_options.left_price_scale.price_scale_id is not None and not isinstance(
                    chart_options.left_price_scale.price_scale_id,
                    str,
                ):
                    raise PriceScaleIdTypeError(
                        "left_price_scale",
                        type(chart_options.left_price_scale.price_scale_id),
                    )
            except AttributeError as e:
                if isinstance(chart_options.left_price_scale, bool):
                    raise PriceScaleOptionsTypeError(
                        "left_price_scale",
                        type(chart_options.left_price_scale),
                    ) from e
                raise PriceScaleOptionsTypeError(
                    "left_price_scale",
                    type(chart_options.left_price_scale),
                ) from e

        if chart_options and chart_options.overlay_price_scales is not None:
            chart_config["overlayPriceScales"] = {
                k: v.asdict() if hasattr(v, "asdict") else v
                for k, v in chart_options.overlay_price_scales.items()
            }

        annotations_config = annotation_manager.asdict()

        # Calculate data timespan and filter range switcher
        data_timespan = self.calculate_data_timespan(series_configs)
        chart_config = self.filter_range_switcher_by_data(chart_config, data_timespan)

        chart_obj: Dict[str, Any] = {
            "chartId": f"chart-{int(time.time() * 1000)}",
            "chart": chart_config,
            "series": series_configs,
            "annotations": annotations_config,
        }

        # Add trades to chart configuration if they exist
        if trades_config:
            chart_obj["trades"] = trades_config

            # Add trade visualization options if they exist
            if chart_options and chart_options.trade_visualization:
                chart_obj["tradeVisualizationOptions"] = chart_options.trade_visualization.asdict()

        # Add tooltip configurations if they exist
        if tooltip_manager:
            tooltip_configs = {}
            for name, tooltip_config in tooltip_manager.configs.items():
                tooltip_configs[name] = tooltip_config.asdict()
            chart_obj["tooltipConfigs"] = tooltip_configs

        # Add chart group ID for synchronization
        chart_obj["chartGroupId"] = chart_group_id

        config: Dict[str, Any] = {
            "charts": [chart_obj],
        }

        # Add sync configuration if ChartManager reference is available
        if chart_manager is not None:
            sync_config = self._build_sync_config(chart_manager, chart_group_id)
            if sync_config:
                config["syncConfig"] = sync_config

        return config

    def _build_sync_config(
        self,
        chart_manager: Any,
        chart_group_id: int,
    ) -> Optional[Dict[str, Any]]:
        """Build sync configuration from ChartManager.

        Args:
            chart_manager: Reference to ChartManager.
            chart_group_id: Chart group ID.

        Returns:
            Sync configuration dictionary, or None if no sync config.
        """
        if chart_manager is None:
            return None

        # Check if this chart's group has sync enabled
        group_sync_enabled = False
        group_sync_config = None

        if (
            hasattr(chart_manager, "sync_groups")
            and chart_manager.sync_groups
            and str(chart_group_id) in chart_manager.sync_groups
        ):
            group_sync_config = chart_manager.sync_groups[str(chart_group_id)]
            group_sync_enabled = group_sync_config.enabled

        # Enable sync at top level if this chart's group has sync enabled
        sync_enabled = False
        if hasattr(chart_manager, "default_sync"):
            sync_enabled = chart_manager.default_sync.enabled or group_sync_enabled

        sync_config: Dict[str, Any] = {
            "enabled": sync_enabled,
        }

        if hasattr(chart_manager, "default_sync"):
            sync_config["crosshair"] = chart_manager.default_sync.crosshair
            sync_config["timeRange"] = chart_manager.default_sync.time_range

        # Add group-specific sync configurations
        if hasattr(chart_manager, "sync_groups") and chart_manager.sync_groups:
            sync_config["groups"] = {}
            for group_id, group_sync in chart_manager.sync_groups.items():
                sync_config["groups"][str(group_id)] = {
                    "enabled": group_sync.enabled,
                    "crosshair": group_sync.crosshair,
                    "timeRange": group_sync.time_range,
                }

        return sync_config

    def render(
        self,
        config: Dict[str, Any],
        chart_options: Optional[ChartOptions],
        key: Optional[str] = None,
        on_series_config_changes: Optional[callable] = None,
        on_handle_series_settings_response: Optional[callable] = None,
    ) -> Any:
        """Render the chart in Streamlit.

        Args:
            config: Frontend configuration dictionary.
            chart_options: Chart options for extracting height/width.
            key: Optional unique key for the Streamlit component.
            on_series_config_changes: Callback for handling series config changes.
            on_handle_series_settings_response: Callback for handling series settings responses.

        Returns:
            The rendered Streamlit component.

        Raises:
            ComponentNotAvailableError: If component cannot be loaded.
        """
        # Generate a unique key if none provided or if it's empty/invalid
        if key is None or not isinstance(key, str) or not key.strip():
            unique_id = str(uuid.uuid4())[:8]
            key = f"chart_{int(time.time() * 1000)}_{unique_id}"

        # Get component function
        component_func = get_component_func()

        if component_func is None:
            # Try to reinitialize the component
            if reinitialize_component():
                component_func = get_component_func()

            if component_func is None:
                raise ComponentNotAvailableError()

        # Build component kwargs
        kwargs: Dict[str, Any] = {"config": config}

        # Extract height and width from chart options and pass to frontend
        if chart_options:
            if hasattr(chart_options, "height") and chart_options.height is not None:
                kwargs["height"] = chart_options.height
            if hasattr(chart_options, "width") and chart_options.width is not None:
                kwargs["width"] = chart_options.width

        kwargs["key"] = key
        kwargs["default"] = None

        # Render component
        result = component_func(**kwargs)

        # Handle component return value
        if result and isinstance(result, dict):
            # Check if we have series config changes from the frontend
            if result.get("type") == "series_config_changes":
                changes = result.get("changes", [])
                if changes and on_series_config_changes:
                    on_series_config_changes(changes)

            # Handle other API responses
            if on_handle_series_settings_response:
                series_api = get_series_settings_api(key)
                on_handle_series_settings_response(result, series_api)

        return result

    def handle_series_settings_response(self, response: dict, series_api) -> None:
        """Handle series settings API responses from the frontend.

        Args:
            response: Response data from the frontend component.
            series_api: SeriesSettingsAPI instance for this chart.
        """
        try:
            # Check for series settings API calls
            if response.get("type") == "get_pane_state":
                pane_id = response.get("paneId", 0)
                message_id = response.get("messageId")

                if message_id:
                    pane_state = series_api.get_pane_state(pane_id)
                    # Send response back to frontend via custom event
                    components.html(
                        f"""
                    <script>
                    document.dispatchEvent(new CustomEvent('streamlit:apiResponse', {{
                        detail: {{
                            messageId: '{message_id}',
                            response: {json.dumps({"success": True, "data": pane_state})}
                        }}
                    }}));
                    </script>
                    """,
                        height=0,
                    )

            elif response.get("type") == "update_series_settings":
                pane_id = response.get("paneId", 0)
                series_id = response.get("seriesId", "")
                config = response.get("config", {})
                message_id = response.get("messageId")

                # Always update the settings
                success = series_api.update_series_settings(pane_id, series_id, config)

                # Only send response if messageId was provided
                if message_id:
                    components.html(
                        f"""
                    <script>
                    document.dispatchEvent(new CustomEvent('streamlit:apiResponse', {{
                        detail: {{
                            messageId: '{message_id}',
                            response: {json.dumps({"success": success})}
                        }}
                    }}));
                    </script>
                    """,
                        height=0,
                    )

            elif response.get("type") == "reset_series_defaults":
                pane_id = response.get("paneId", 0)
                series_id = response.get("seriesId", "")
                message_id = response.get("messageId")

                if message_id:
                    defaults = series_api.reset_series_to_defaults(pane_id, series_id)
                    success = defaults is not None
                    components.html(
                        f"""
                    <script>
                    document.dispatchEvent(new CustomEvent('streamlit:apiResponse', {{
                        detail: {{
                            messageId: '{message_id}',
                            response: {json.dumps({"success": success, "data": defaults or {}})}
                        }}
                    }}));
                    </script>
                    """,
                        height=0,
                    )

            elif response.get("type") == "series_config_changes":
                # Handle batched configuration changes from StreamlitSeriesConfigService
                changes = response.get("changes", [])

                for change in changes:
                    pane_id = change.get("paneId", 0)
                    series_id = change.get("seriesId", "")
                    config = change.get("config", {})

                    if series_id and config:
                        success = series_api.update_series_settings(pane_id, series_id, config)
                        if not success:
                            logger.warning("Failed to store config for series %s", series_id)
                    else:
                        logger.warning("Skipping invalid change (missing seriesId or config)")

        except Exception:
            logger.exception("Error handling series settings response")
