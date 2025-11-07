"""Chart Manager Module for managing multiple synchronized charts.

This module provides the ChartManager class for managing multiple Chart instances
with synchronization capabilities. It enables coordinated display of multiple
charts with shared time ranges, crosshair synchronization, and group-based
configuration management.

The module includes:
    - ChartManager: Main class for managing multiple charts
    - Chart synchronization and group management
    - Batch rendering and configuration capabilities
    - Cross-chart communication and state management

Key Features:
    - Multiple chart management with unique identifiers
    - Synchronization groups for coordinated chart behavior
    - Crosshair and time range synchronization
    - Batch rendering with consistent configuration
    - Chart lifecycle management (add, remove, update)
    - Automatic sync group assignment and management

Example Usage:
    ```python
    from streamlit_lightweight_charts_pro import ChartManager, Chart, LineSeries
    from streamlit_lightweight_charts_pro.data import SingleValueData

    # Create manager and add charts
    manager = ChartManager()

    # Create data for multiple charts
    data1 = [SingleValueData("2024-01-01", 100), SingleValueData("2024-01-02", 105)]
    data2 = [SingleValueData("2024-01-01", 200), SingleValueData("2024-01-02", 195)]

    # Add charts to manager
    manager.add_chart(Chart(series=LineSeries(data1)), "price_chart")
    manager.add_chart(Chart(series=LineSeries(data2)), "volume_chart")

    # Configure synchronization
    manager.set_sync_group("price_chart", "main_group")
    manager.set_sync_group("volume_chart", "main_group")

    # Render synchronized charts
    manager.render_all_charts()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
import time
import uuid
from typing import Any, Dict, List, Optional, Sequence, Union

# Third Party Imports
import pandas as pd

# Local Imports
from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.charts.options.sync_options import SyncOptions
from streamlit_lightweight_charts_pro.component import (  # pylint: disable=import-outside-toplevel
    get_component_func,
    reinitialize_component,
)
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.exceptions import (
    DuplicateError,
    NotFoundError,
    TypeValidationError,
)


class ChartManager:
    """Manager for multiple synchronized charts.

    This class provides comprehensive functionality to manage multiple Chart instances
    with advanced synchronization capabilities. It enables coordinated display of
    multiple charts with shared time ranges, crosshair synchronization, and group-based
    configuration management.

    The ChartManager maintains a registry of charts with unique identifiers and
    manages synchronization groups that allow charts to share crosshair position,
    time ranges, and other interactive states. This is particularly useful for
    creating multi-pane financial dashboards with coordinated chart behavior.

    Attributes:
        charts (Dict[str, Chart]): Dictionary mapping chart IDs to Chart instances.
        sync_groups (Dict[str, SyncOptions]): Dictionary mapping chart IDs to their
            synchronization group options.
        default_sync (SyncOptions): Default synchronization options applied to
            new charts when no specific group is assigned.

    Example:
        ```python
        from streamlit_lightweight_charts_pro import ChartManager, Chart, LineSeries
        from streamlit_lightweight_charts_pro.data import SingleValueData

        # Create manager
        manager = ChartManager()

        # Add charts with unique IDs
        manager.add_chart(Chart(series=LineSeries(data1)), "price_chart")
        manager.add_chart(Chart(series=LineSeries(data2)), "volume_chart")

        # Configure synchronization groups
        manager.set_sync_group("price_chart", "main_group")
        manager.set_sync_group("volume_chart", "main_group")

        # Render all charts with synchronization
        manager.render_all_charts()
        ```

    Note:
        - Charts must have unique IDs within the manager
        - Synchronization groups allow coordinated behavior between charts
        - Individual charts can be rendered or all charts can be rendered together
        - The manager handles component lifecycle and state management
    """

    def __init__(self) -> None:
        """Initialize the ChartManager.

        Creates a new ChartManager with empty chart registry and default
        synchronization settings. The manager starts with no charts and uses
        default sync options for new charts.
        """
        # Initialize chart registry - maps chart IDs to Chart instances
        self.charts: Dict[str, Chart] = {}

        # Initialize sync groups - maps chart IDs to their sync configuration
        self.sync_groups: Dict[str, SyncOptions] = {}

        # Set default sync options for new charts without specific group assignment
        self.default_sync: SyncOptions = SyncOptions()

        # Flag to force frontend re-initialization (for indicator/parameter changes)
        self.force_reinit: bool = False

        # Metadata for change detection (symbol/interval)
        # These are used by frontend to detect when data context changes
        self.symbol: Optional[str] = None
        self.display_interval: Optional[str] = None

    def add_chart(self, chart: Chart, chart_id: Optional[str] = None) -> "ChartManager":
        """Add a chart to the manager.

        Adds a Chart instance to the manager with a unique identifier. The chart
        is registered in the manager's chart registry and can participate in
        synchronization groups. If no chart ID is provided, one is automatically
        generated.

        Args:
            chart (Chart): The Chart instance to add to the manager.
            chart_id (Optional[str]): Optional unique identifier for the chart.
                If not provided, an auto-generated ID in the format "chart_N"
                will be assigned.

        Returns:
            ChartManager: Self for method chaining.

        Raises:
            DuplicateError: If a chart with the specified ID already exists.

        Example:
            ```python
            manager = ChartManager()
            chart = Chart(series=LineSeries(data))

            # Add chart with auto-generated ID
            manager.add_chart(chart)

            # Add chart with custom ID
            manager.add_chart(chart, "price_chart")
            ```
        """
        # Generate unique chart ID if not provided
        if chart_id is None:
            chart_id = f"chart_{len(self.charts) + 1}"

        # Validate that chart ID is unique within the manager
        if chart_id in self.charts:
            raise DuplicateError("Chart", chart_id)

        # Set the ChartManager reference on the chart for bidirectional communication
        # This allows the chart to access manager configuration and sync settings
        chart._chart_manager = self  # pylint: disable=protected-access

        # Add chart to the registry with its unique identifier
        self.charts[chart_id] = chart
        return self

    def remove_chart(self, chart_id: str) -> "ChartManager":
        """Remove a chart from the manager.

        Args:
            chart_id: ID of the chart to remove

        Returns:
            Self for method chaining
        """
        if chart_id not in self.charts:
            raise NotFoundError("Chart", chart_id)

        del self.charts[chart_id]
        return self

    def get_chart(self, chart_id: str) -> Chart:
        """Get a chart by ID.

        Args:
            chart_id: ID of the chart to retrieve

        Returns:
            The Chart instance
        """
        if chart_id not in self.charts:
            raise NotFoundError("Chart", chart_id)

        return self.charts[chart_id]

    def render_chart(self, chart_id: str, key: Optional[str] = None) -> Any:
        """Render a specific chart from the manager with proper sync configuration.

        This method renders a single chart while preserving the ChartManager's
        sync configuration and group settings. This ensures that individual
        charts can still participate in group synchronization.

        Args:
            chart_id: The ID of the chart to render
            key: Optional key for the Streamlit component

        Returns:
            The rendered component

        Raises:
            ValueError: If chart_id is not found

        Example:
            ```python
            manager = ChartManager()
            manager.add_chart(chart1, "chart1")
            manager.add_chart(chart2, "chart2")

            col1, col2 = st.columns(2)
            with col1:
                manager.render_chart("chart1")
            with col2:
                manager.render_chart("chart2")
            ```
        """
        if chart_id not in self.charts:
            raise NotFoundError("Chart", chart_id)

        # Get the chart and render it (sync config is automatically included)
        chart = self.charts[chart_id]
        return chart.render(key=key)

    def get_chart_ids(self) -> List[str]:
        """Get all chart IDs.

        Returns:
            List of chart IDs
        """
        return list(self.charts.keys())

    def clear_charts(self) -> "ChartManager":
        """Remove all charts from the manager.

        Returns:
            Self for method chaining
        """
        self.charts.clear()
        return self

    def set_sync_group_config(
        self,
        group_id: Union[int, str],
        sync_options: SyncOptions,
    ) -> "ChartManager":
        """Set synchronization configuration for a specific group.

        Args:
            group_id: The sync group ID (int or str)
            sync_options: The sync configuration for this group

        Returns:
            Self for method chaining
        """
        self.sync_groups[str(group_id)] = sync_options
        return self

    def get_sync_group_config(self, group_id: Union[int, str]) -> Optional[SyncOptions]:
        """Get synchronization configuration for a specific group.

        Args:
            group_id: The sync group ID (int or str)

        Returns:
            The sync configuration for the group, or None if not found
        """
        return self.sync_groups.get(str(group_id))

    def enable_crosshair_sync(self, group_id: Optional[Union[int, str]] = None) -> "ChartManager":
        """Enable crosshair synchronization.

        Args:
            group_id: Optional group ID. If None, applies to default sync

        Returns:
            Self for method chaining
        """
        if group_id:
            group_key = str(group_id)
            if group_key not in self.sync_groups:
                self.sync_groups[group_key] = SyncOptions()
            self.sync_groups[group_key].enable_crosshair()
        else:
            self.default_sync.enable_crosshair()
        return self

    def disable_crosshair_sync(self, group_id: Optional[Union[int, str]] = None) -> "ChartManager":
        """Disable crosshair synchronization.

        Args:
            group_id: Optional group ID. If None, applies to default sync

        Returns:
            Self for method chaining
        """
        if group_id:
            group_key = str(group_id)
            if group_key in self.sync_groups:
                self.sync_groups[group_key].disable_crosshair()
        else:
            self.default_sync.disable_crosshair()
        return self

    def enable_time_range_sync(self, group_id: Optional[Union[int, str]] = None) -> "ChartManager":
        """Enable time range synchronization.

        Args:
            group_id: Optional group ID. If None, applies to default sync

        Returns:
            Self for method chaining
        """
        if group_id:
            group_key = str(group_id)
            if group_key not in self.sync_groups:
                self.sync_groups[group_key] = SyncOptions()
            self.sync_groups[group_key].enable_time_range()
        else:
            self.default_sync.enable_time_range()
        return self

    def disable_time_range_sync(self, group_id: Optional[Union[int, str]] = None) -> "ChartManager":
        """Disable time range synchronization.

        Args:
            group_id: Optional group ID. If None, applies to default sync

        Returns:
            Self for method chaining
        """
        if group_id:
            group_key = str(group_id)
            if group_key in self.sync_groups:
                self.sync_groups[group_key].disable_time_range()
        else:
            self.default_sync.disable_time_range()
        return self

    def enable_all_sync(self, group_id: Optional[Union[int, str]] = None) -> "ChartManager":
        """Enable all synchronization features.

        Args:
            group_id: Optional group ID. If None, applies to default sync

        Returns:
            Self for method chaining
        """
        if group_id:
            group_key = str(group_id)
            if group_key not in self.sync_groups:
                self.sync_groups[group_key] = SyncOptions()
            self.sync_groups[group_key].enable_all()
        else:
            self.default_sync.enable_all()
        return self

    def disable_all_sync(self, group_id: Optional[Union[int, str]] = None) -> "ChartManager":
        """Disable all synchronization features.

        Args:
            group_id: Optional group ID. If None, applies to default sync

        Returns:
            Self for method chaining
        """
        if group_id:
            group_key = str(group_id)
            if group_key in self.sync_groups:
                self.sync_groups[group_key].disable_all()
        else:
            self.default_sync.disable_all()
        return self

    def from_price_volume_dataframe(
        self,
        data: Union[Sequence[OhlcvData], pd.DataFrame],
        column_mapping: Optional[dict] = None,
        price_type: str = "candlestick",
        chart_id: str = "main_chart",
        price_kwargs=None,
        volume_kwargs=None,
        pane_id: int = 0,
    ) -> "Chart":
        """Create a chart from OHLCV data with price and volume series.

        Factory method that creates a new Chart instance with both price and volume
        series from OHLCV data. This is a convenient way to create a complete
        price-volume chart in a single operation.

        Args:
            data (Union[Sequence[OhlcvData], pd.DataFrame]): OHLCV data containing
                price and volume information.
            column_mapping (dict, optional): Mapping of column names for DataFrame
                conversion. Defaults to None.
            price_type (str, optional): Type of price series ('candlestick' or 'line').
                Defaults to "candlestick".
            price_kwargs (dict, optional): Additional arguments for price series
                configuration. Defaults to None.
            volume_kwargs (dict, optional): Additional arguments for volume series
                configuration. Defaults to None.
            pane_id (int, optional): Pane ID for both price and volume series.
                Defaults to 0.

        Returns:
            Chart: A new Chart instance with price and volume series.

        Example:
            ```python
            # Create chart from DataFrame
            chart = Chart.from_price_volume_dataframe(
                df, column_mapping={"time": "timestamp", "volume": "vol"}, price_type="candlestick"
            )

            # Create chart from OHLCV data
            chart = Chart.from_price_volume_dataframe(
                ohlcv_data,
                price_type="line",
                volume_kwargs={"up_color": "green", "down_color": "red"},
            )
            ```
        """
        if data is None:
            raise TypeValidationError("data", "list or DataFrame")
        if not isinstance(data, (list, pd.DataFrame)):
            raise TypeValidationError("data", "list or DataFrame")

        chart = Chart()
        chart.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type=price_type,
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
            pane_id=pane_id,
        )

        # Set the ChartManager reference on the chart
        chart._chart_manager = self  # pylint: disable=protected-access

        # Add the chart to the manager with an ID
        self.add_chart(chart, chart_id=chart_id)

        return chart

    def to_frontend_config(self) -> Dict[str, Any]:
        """Convert the chart manager to frontend configuration.

        Returns:
            Dictionary containing the frontend configuration
        """
        if not self.charts:
            return {
                "charts": [],
                "syncConfig": self.default_sync.asdict(),
            }

        chart_configs = []
        for chart_id, chart in self.charts.items():
            chart_config = chart.to_frontend_config()
            if "charts" in chart_config and len(chart_config["charts"]) > 0:
                chart_obj = chart_config["charts"][0]
                chart_obj["chartId"] = chart_id
                chart_configs.append(chart_obj)
            else:
                # Skip charts with invalid configuration
                continue

        # Build sync configuration
        sync_config = self.default_sync.asdict()

        # Add group-specific sync configurations
        if self.sync_groups:
            sync_config["groups"] = {}
            for group_id, group_sync in self.sync_groups.items():
                sync_config["groups"][group_id] = group_sync.asdict()

        config = {
            "charts": chart_configs,
            "syncConfig": sync_config,
        }

        # Add force_reinit flag if set
        if self.force_reinit:
            config["forceReinit"] = True

        # Add metadata for frontend change detection
        # This allows frontend to detect symbol/interval changes
        if self.symbol is not None:
            config["symbol"] = self.symbol
        if self.display_interval is not None:
            config["displayInterval"] = str(self.display_interval)

        return config

    def _auto_detect_changes(self, key: str) -> None:
        """
        Automatically detect changes and set force_reinit if needed.

        This is internal library logic - the user should never call this.
        It compares current state with previous render to detect changes.

        Args:
            key: Component key for state storage
        """
        import hashlib  # pylint: disable=import-outside-toplevel
        import json  # pylint: disable=import-outside-toplevel

        import streamlit as st  # pylint: disable=import-outside-toplevel

        # Build state key for this chart
        state_key = f"_lwc_chart_state_{key}"

        # Get previous state
        prev_state = st.session_state.get(state_key)

        # Build current state signature
        # Include: symbol, interval, chart count, series structure
        current_state = {
            "symbol": self.symbol,
            "interval": self.display_interval,
            "chart_count": len(self.charts),
            "series_structure": [],
        }

        # Add series structure fingerprint (types, data length, and full data hash)
        for chart in self.charts.values():
            for _idx, series in enumerate(chart.series):
                # Calculate hash of entire data array for 100% accurate change detection
                # This is cheap (~1ms for 10K points) and catches ALL data changes
                data_hash = None
                if hasattr(series, "data") and series.data:
                    try:
                        # Hash the entire data array
                        data_str = str(series.data)
                        data_hash = hashlib.md5(data_str.encode()).hexdigest()[:8]  # noqa: S324
                    except Exception:
                        # Fallback to None if serialization fails
                        data_hash = None

                series_info = {
                    "type": type(series).__name__,
                    "data_length": (
                        len(series.data) if hasattr(series, "data") and series.data else 0
                    ),
                    "data_hash": data_hash,  # Full data hash - catches ALL changes!
                }
                current_state["series_structure"].append(series_info)

        # Calculate hash for comparison
        current_hash = hashlib.md5(  # noqa: S324
            json.dumps(current_state, sort_keys=True, default=str).encode()
        ).hexdigest()[:8]

        # AUTO-DETECT if reinit needed
        # Check if there's a pending reinit from previous run (handles Streamlit multiple reruns)
        pending_reinit_key = f"{state_key}_pending_reinit"
        pending_reinit = st.session_state.get(pending_reinit_key, False)

        if prev_state is None:
            # First render - no reinit needed
            self.force_reinit = False
            st.session_state[pending_reinit_key] = False
        elif prev_state != current_hash:
            # State changed - force reinit and mark as pending for next rerun
            self.force_reinit = True
            st.session_state[pending_reinit_key] = True
        elif pending_reinit:
            # Hash is same but there's a pending reinit from previous run
            # This handles Streamlit's multiple reruns after a change
            self.force_reinit = True
            st.session_state[pending_reinit_key] = False  # Clear the flag
        else:
            # Same hash, no pending reinit - no changes detected
            self.force_reinit = False

        # Store current state for next render
        st.session_state[state_key] = current_hash

    def render(
        self,
        key: Optional[str] = None,
        symbol: Optional[str] = None,
        interval: Optional[str] = None,
    ) -> Any:
        """Render the chart manager with automatic change detection.

        The library automatically detects changes in symbol, interval, series structure,
        and data, and reinitializes the chart only when needed while preserving
        customizations.

        Args:
            key: Optional key for the Streamlit component
            symbol: Optional symbol name for automatic change detection and metadata
            interval: Optional interval for automatic change detection and metadata

        Returns:
            The rendered component

        Raises:
            RuntimeError: If no charts have been added to the manager

        Note:
            The library handles change detection internally. You don't need to:
            - Calculate hashes
            - Track previous values
            - Set force_reinit manually
            - Clear caches

            Just call render() with current symbol/interval and the library
            handles the rest!
        """
        if not self.charts:
            raise RuntimeError("Cannot render ChartManager with no charts")

        # STEP 0: Set metadata if provided (before change detection)
        if symbol is not None:
            self.symbol = symbol
        if interval is not None:
            self.display_interval = interval

        # STEP 1: Generate/validate key (same as Chart.render())
        if key is None or not isinstance(key, str) or not key.strip():
            unique_id = str(uuid.uuid4())[:8]
            key = f"chart_manager_{int(time.time() * 1000)}_{unique_id}"

        # STEP 1.5: AUTO-DETECT changes (internal logic - transparent to user)
        # This makes the library handle change detection instead of the user
        self._auto_detect_changes(key)

        # STEP 2: For each chart, reset config flag and load/apply stored configs
        # This ensures user changes from series dialog persist across reruns
        # Use the same key for loading/saving so customizations persist
        for chart in self.charts.values():
            # Reset config application flag for this render cycle
            chart._session_state_manager.reset_config_applied_flag()  # pylint: disable=protected-access

            # Load stored configs from session state using the component key
            stored_configs = chart._session_state_manager.load_series_configs(key)  # pylint: disable=protected-access

            # Apply configs to series objects BEFORE serialization
            if stored_configs:
                chart._session_state_manager.apply_stored_configs_to_series(  # pylint: disable=protected-access
                    stored_configs,
                    chart.series,
                )

        # STEP 3: Generate frontend configuration AFTER configs are applied
        config = self.to_frontend_config()

        # STEP 4: Render using ChartRenderer (DRY - reuse existing code)
        # Get the first chart's renderer since they all use the same implementation
        first_chart = next(iter(self.charts.values()))
        result = first_chart._chart_renderer.render(  # pylint: disable=protected-access
            config,
            key,
            None,  # ChartManager doesn't have global chart_options
        )

        # STEP 5: Handle component return value and save series configs
        # This ensures changes from frontend are saved to session state
        # Use same key for saving so configs persist
        if result:
            for chart in self.charts.values():
                chart._chart_renderer.handle_response(  # pylint: disable=protected-access
                    result,
                    key,  # Use same key for consistency
                    chart._session_state_manager,  # pylint: disable=protected-access
                )

        return result

    def __len__(self) -> int:
        """Return the number of charts in the manager."""
        return len(self.charts)

    def __contains__(self, chart_id: str) -> bool:
        """Check if a chart ID exists in the manager."""
        return chart_id in self.charts

    def __iter__(self):
        """Iterate over chart IDs in the manager."""
        return iter(self.charts.keys())

    def keys(self):
        """Return chart IDs in the manager."""
        return self.charts.keys()

    def values(self):
        """Return chart instances in the manager."""
        return self.charts.values()

    def items(self):
        """Return chart ID and instance pairs in the manager."""
        return self.charts.items()
