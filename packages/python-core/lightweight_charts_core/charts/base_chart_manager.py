"""Base Chart Manager for lightweight-charts-core.

This module provides the BaseChartManager class containing all framework-agnostic
chart management logic. Framework-specific implementations should extend this class
and add their rendering capabilities.
"""

from collections.abc import Sequence
from typing import Any

import pandas as pd
from lightweight_charts_core.charts.base_chart import BaseChart
from lightweight_charts_core.charts.options.sync_options import SyncOptions
from lightweight_charts_core.data import OhlcvData
from lightweight_charts_core.exceptions import (
    DuplicateError,
    NotFoundError,
    TypeValidationError,
)


class BaseChartManager:
    """Base manager for multiple synchronized charts.

    This class provides framework-agnostic functionality to manage multiple chart
    instances with synchronization capabilities. Framework-specific implementations
    should extend this class and add rendering capabilities.

    Attributes:
        charts: Dictionary mapping chart IDs to chart instances.
        sync_groups: Dictionary mapping group IDs to sync configurations.
        default_sync: Default synchronization options for new charts.

    """

    # Class attribute to specify which chart class to use
    # Subclasses should override this
    chart_class = BaseChart

    def __init__(self) -> None:
        """Initialize the BaseChartManager."""
        self.charts: dict[str, BaseChart] = {}
        self.sync_groups: dict[str, SyncOptions] = {}
        self.default_sync: SyncOptions = SyncOptions()
        self.force_reinit: bool = False
        self.symbol: str | None = None
        self.display_interval: str | None = None

    def add_chart(self, chart: BaseChart, chart_id: str | None = None) -> "BaseChartManager":
        """Add a chart to the manager.

        Args:
            chart: The chart instance to add.
            chart_id: Optional unique identifier for the chart.

        Returns:
            Self for method chaining.

        Raises:
            DuplicateError: If a chart with the ID already exists.

        """
        if chart_id is None:
            chart_id = f"chart_{len(self.charts) + 1}"

        if chart_id in self.charts:
            raise DuplicateError("Chart", chart_id)

        self.charts[chart_id] = chart
        return self

    def remove_chart(self, chart_id: str) -> "BaseChartManager":
        """Remove a chart from the manager.

        Args:
            chart_id: ID of the chart to remove.

        Returns:
            Self for method chaining.

        Raises:
            NotFoundError: If chart ID not found.

        """
        if chart_id not in self.charts:
            raise NotFoundError("Chart", chart_id)

        del self.charts[chart_id]
        return self

    def get_chart(self, chart_id: str) -> BaseChart:
        """Get a chart by ID.

        Args:
            chart_id: ID of the chart to retrieve.

        Returns:
            The chart instance.

        Raises:
            NotFoundError: If chart ID not found.

        """
        if chart_id not in self.charts:
            raise NotFoundError("Chart", chart_id)

        return self.charts[chart_id]

    def get_chart_ids(self) -> list[str]:
        """Get all chart IDs.

        Returns:
            List of chart IDs.

        """
        return list(self.charts.keys())

    def clear_charts(self) -> "BaseChartManager":
        """Remove all charts from the manager.

        Returns:
            Self for method chaining.

        """
        self.charts.clear()
        return self

    def set_sync_group_config(
        self,
        group_id: int | str,
        sync_options: SyncOptions,
    ) -> "BaseChartManager":
        """Set synchronization configuration for a specific group.

        Args:
            group_id: The sync group ID.
            sync_options: The SyncOptions configuration.

        Returns:
            Self for method chaining.

        """
        self.sync_groups[str(group_id)] = sync_options
        return self

    def get_sync_group_config(self, group_id: int | str) -> SyncOptions | None:
        """Get synchronization configuration for a specific group.

        Args:
            group_id: The sync group ID.

        Returns:
            SyncOptions or None if not configured.

        """
        return self.sync_groups.get(str(group_id))

    def enable_crosshair_sync(self, group_id: int | str | None = None) -> "BaseChartManager":
        """Enable crosshair synchronization.

        Args:
            group_id: Optional group ID. If None, applies to default.

        Returns:
            Self for method chaining.

        """
        if group_id:
            group_key = str(group_id)
            if group_key not in self.sync_groups:
                self.sync_groups[group_key] = SyncOptions()
            self.sync_groups[group_key].enable_crosshair()
        else:
            self.default_sync.enable_crosshair()
        return self

    def disable_crosshair_sync(self, group_id: int | str | None = None) -> "BaseChartManager":
        """Disable crosshair synchronization.

        Args:
            group_id: Optional group ID. If None, applies to default.

        Returns:
            Self for method chaining.

        """
        if group_id:
            group_key = str(group_id)
            if group_key in self.sync_groups:
                self.sync_groups[group_key].disable_crosshair()
        else:
            self.default_sync.disable_crosshair()
        return self

    def enable_time_range_sync(self, group_id: int | str | None = None) -> "BaseChartManager":
        """Enable time range synchronization.

        Args:
            group_id: Optional group ID. If None, applies to default.

        Returns:
            Self for method chaining.

        """
        if group_id:
            group_key = str(group_id)
            if group_key not in self.sync_groups:
                self.sync_groups[group_key] = SyncOptions()
            self.sync_groups[group_key].enable_time_range()
        else:
            self.default_sync.enable_time_range()
        return self

    def disable_time_range_sync(self, group_id: int | str | None = None) -> "BaseChartManager":
        """Disable time range synchronization.

        Args:
            group_id: Optional group ID. If None, applies to default.

        Returns:
            Self for method chaining.

        """
        if group_id:
            group_key = str(group_id)
            if group_key in self.sync_groups:
                self.sync_groups[group_key].disable_time_range()
        else:
            self.default_sync.disable_time_range()
        return self

    def enable_all_sync(self, group_id: int | str | None = None) -> "BaseChartManager":
        """Enable all synchronization features.

        Args:
            group_id: Optional group ID. If None, applies to default.

        Returns:
            Self for method chaining.

        """
        if group_id:
            group_key = str(group_id)
            if group_key not in self.sync_groups:
                self.sync_groups[group_key] = SyncOptions()
            self.sync_groups[group_key].enable_all()
        else:
            self.default_sync.enable_all()
        return self

    def disable_all_sync(self, group_id: int | str | None = None) -> "BaseChartManager":
        """Disable all synchronization features.

        Args:
            group_id: Optional group ID. If None, applies to default.

        Returns:
            Self for method chaining.

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
        data: Sequence[OhlcvData] | pd.DataFrame,
        column_mapping: dict | None = None,
        price_type: str = "candlestick",
        chart_id: str = "main_chart",
        price_kwargs=None,
        volume_kwargs=None,
        pane_id: int = 0,
    ) -> BaseChart:
        """Create a chart from OHLCV data with price and volume series.

        Args:
            data: OHLCV data.
            column_mapping: Column name mapping for DataFrame.
            price_type: Type of price series.
            chart_id: ID for the created chart.
            price_kwargs: Additional price series arguments.
            volume_kwargs: Additional volume series arguments.
            pane_id: Pane ID for the series.

        Returns:
            The created chart instance.

        """
        if data is None:
            raise TypeValidationError("data", "list or DataFrame")
        if not isinstance(data, (list, pd.DataFrame)):
            raise TypeValidationError("data", "list or DataFrame")

        # Use the chart_class attribute to create the right type of chart
        chart = self.chart_class()
        chart.add_price_volume_series(
            data=data,
            column_mapping=column_mapping,
            price_type=price_type,
            price_kwargs=price_kwargs,
            volume_kwargs=volume_kwargs,
            pane_id=pane_id,
        )

        self.add_chart(chart, chart_id=chart_id)
        return chart

    def to_frontend_config(self) -> dict[str, Any]:
        """Convert the chart manager to frontend configuration.

        Returns:
            Dictionary containing the frontend configuration.

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

        # Build sync configuration
        sync_config = self.default_sync.asdict()

        if self.sync_groups:
            sync_config["groups"] = {}
            for group_id, group_sync in self.sync_groups.items():
                sync_config["groups"][group_id] = group_sync.asdict()

        config = {
            "charts": chart_configs,
            "syncConfig": sync_config,
        }

        if self.force_reinit:
            config["forceReinit"] = True

        if self.symbol is not None:
            config["symbol"] = self.symbol
        if self.display_interval is not None:
            config["displayInterval"] = str(self.display_interval)

        return config

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
