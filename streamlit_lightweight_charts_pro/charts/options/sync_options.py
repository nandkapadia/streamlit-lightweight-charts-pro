"""
Synchronization options for linked charts.

This module provides synchronization configuration options for managing
multiple linked charts. These options control how charts interact with
each other when they are part of a linked chart system.
"""

from dataclasses import dataclass
from typing import Optional

from streamlit_lightweight_charts_pro.charts.options.base_options import Options
from streamlit_lightweight_charts_pro.utils import chainable_field


@dataclass
@chainable_field("enabled", bool)
@chainable_field("crosshair", bool)
@chainable_field("time_range", bool)
@chainable_field("group_id", str)
class SyncOptions(Options):
    """
    Synchronization options for linked charts.

    This class provides configuration options for synchronizing multiple
    charts in a linked chart system. It controls crosshair and time range
    synchronization behavior across linked charts.

    Attributes:
        enabled (bool): Whether synchronization is enabled. When True,
            enables all synchronization features. When False, disables
            all synchronization. Defaults to False.
        crosshair (bool): Whether to synchronize crosshair position across
            linked charts. When enabled, moving the crosshair on one chart
            will update the crosshair position on all linked charts.
            Defaults to False.
        time_range (bool): Whether to synchronize time range across linked
            charts. When enabled, zooming or panning the time range on one
            chart will update the visible time range on all linked charts.
            Defaults to False.
        group_id (Optional[str]): Optional group identifier for chart
            synchronization. Charts with the same group_id will be
            synchronized with each other. If None, all charts in the
            same LinkedChartManager will be synchronized. Defaults to None.

    Example:
        ```python
        from streamlit_lightweight_charts_pro.charts.options import SyncOptions

        # Enable all synchronization
        sync_options = SyncOptions(
            enabled=True,
            crosshair=True,
            time_range=True
        )

        # Enable only crosshair synchronization
        sync_options = SyncOptions(
            enabled=True,
            crosshair=True,
            time_range=False
        )

        # Use with group synchronization
        sync_options = SyncOptions(
            enabled=True,
            crosshair=True,
            time_range=True,
            group_id="price_charts"
        )
        ```
    """

    enabled: bool = False
    crosshair: bool = False
    time_range: bool = False
    group_id: Optional[str] = None

    def enable_all(self) -> "SyncOptions":
        """
        Enable all synchronization features.

        Returns:
            SyncOptions: Self for method chaining.
        """
        self.enabled = True
        self.crosshair = True
        self.time_range = True
        return self

    def disable_all(self) -> "SyncOptions":
        """
        Disable all synchronization features.

        Returns:
            SyncOptions: Self for method chaining.
        """
        self.enabled = False
        self.crosshair = False
        self.time_range = False
        return self

    def enable_crosshair(self) -> "SyncOptions":
        """
        Enable crosshair synchronization.

        Returns:
            SyncOptions: Self for method chaining.
        """
        self.crosshair = True
        self.enabled = True
        return self

    def disable_crosshair(self) -> "SyncOptions":
        """
        Disable crosshair synchronization.

        Returns:
            SyncOptions: Self for method chaining.
        """
        self.crosshair = False
        if not self.time_range:
            self.enabled = False
        return self

    def enable_time_range(self) -> "SyncOptions":
        """
        Enable time range synchronization.

        Returns:
            SyncOptions: Self for method chaining.
        """
        self.time_range = True
        self.enabled = True
        return self

    def disable_time_range(self) -> "SyncOptions":
        """
        Disable time range synchronization.

        Returns:
            SyncOptions: Self for method chaining.
        """
        self.time_range = False
        if not self.crosshair:
            self.enabled = False
        return self
