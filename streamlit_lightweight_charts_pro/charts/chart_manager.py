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
    ComponentNotAvailableError,
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
        chart._chart_manager = self

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
        chart._chart_manager = self

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

        return {
            "charts": chart_configs,
            "syncConfig": sync_config,
        }

    def render(self, key: Optional[str] = None) -> Any:
        """Render the chart manager.

        Args:
            key: Optional key for the Streamlit component

        Returns:
            The rendered component
        """
        if not self.charts:
            raise RuntimeError()

        config = self.to_frontend_config()
        component_func = get_component_func()

        if component_func is None:
            if reinitialize_component():
                component_func = get_component_func()
            if component_func is None:
                raise ComponentNotAvailableError()

        kwargs: Dict[str, Any] = {"config": config}
        if key is None or not isinstance(key, str) or not key.strip():
            unique_id = str(uuid.uuid4())[:8]
            key = f"chart_manager_{int(time.time() * 1000)}_{unique_id}"
        kwargs["key"] = key
        return component_func(**kwargs)

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
