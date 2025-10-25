"""Series management for Chart component.

This module provides the SeriesManager class which handles all series-related
operations including adding series, managing price and volume series, and
providing series information for UI components.
"""

from typing import Any, Dict, List, Optional, Sequence, Union

import pandas as pd

from streamlit_lightweight_charts_pro.charts.options.price_scale_options import (
    PriceScaleMargins,
    PriceScaleOptions,
)
from streamlit_lightweight_charts_pro.charts.series import (
    CandlestickSeries,
    HistogramSeries,
    LineSeries,
    Series,
)
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.exceptions import (
    SeriesItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.type_definitions.enums import ColumnNames, PriceScaleMode

# Initialize logger
logger = get_logger(__name__)


class SeriesManager:
    """Manages series for a chart.

    This class provides centralized management of all series-related operations
    for a chart, including series storage, validation, and configuration. It
    handles the complexities of price scale management and series ordering.

    Attributes:
        series: List of Series objects managed by this manager.
    """

    def __init__(
        self,
        series: Optional[Union[Series, List[Series]]] = None,
    ) -> None:
        """Initialize the series manager.

        Args:
            series: Optional single series object or list of series objects.
                If None, an empty series list is created.

        Raises:
            SeriesItemsTypeError: If any item in the series list is not a
                Series instance.
            TypeValidationError: If series is not a Series instance or list.
        """
        # Handle series input - convert to list for uniform processing
        if series is None:
            self.series: List[Series] = []
        elif isinstance(series, Series):
            self.series = [series]
        elif isinstance(series, list):
            # Validate each item is a Series instance
            for item in series:
                if not isinstance(item, Series):
                    raise SeriesItemsTypeError()
            self.series = series
        else:
            raise TypeValidationError("series", "Series instance or list")

    def add_series(
        self,
        series: Series,
        overlay_price_scales: Optional[Dict[str, PriceScaleOptions]] = None,
    ) -> "SeriesManager":
        """Add a series to the manager.

        Adds a new series object to the series list. Automatically handles
        price scale configuration for custom price scale IDs.

        Args:
            series: Series object to add.
            overlay_price_scales: Dictionary of overlay price scale configurations.
                Used to check if custom price scale needs to be created.

        Returns:
            SeriesManager: Self for method chaining.

        Raises:
            TypeValidationError: If the series parameter is not an instance of Series.

        Example:
            ```python
            manager.add_series(CandlestickSeries(ohlc_data))
            manager.add_series(LineSeries(data))
            ```
        """
        if not isinstance(series, Series):
            raise TypeValidationError("series", "Series instance")

        # Check for custom price scale configuration needs
        price_scale_id = series.price_scale_id  # type: ignore[attr-defined]

        # Handle custom price scale setup
        if (
            price_scale_id
            and price_scale_id not in ["left", "right", ""]
            and overlay_price_scales is not None
            and price_scale_id not in overlay_price_scales
        ):
            logger.warning(
                "Series with price_scale_id '%s' does not have a corresponding "
                "overlay price scale configuration. The price scale should be "
                "added via PriceScaleManager.",
                price_scale_id,
            )

        self.series.append(series)
        return self

    def add_price_volume_series(
        self,
        data: Union[Sequence[OhlcvData], pd.DataFrame],
        column_mapping: Dict[str, str],
        price_type: str = "candlestick",
        price_kwargs: Optional[Dict[str, Any]] = None,
        volume_kwargs: Optional[Dict[str, Any]] = None,
        pane_id: int = 0,
        right_price_scale: Optional[PriceScaleOptions] = None,
        on_add_overlay_price_scale: Optional[callable] = None,
    ) -> "SeriesManager":
        """Add price and volume series to the manager.

        Creates and adds both price and volume series from OHLCV data. The price
        series is displayed on the main price scale, while the volume series is
        displayed on a separate overlay price scale.

        Args:
            data: OHLCV data containing price and volume information.
            column_mapping: Mapping of column names for DataFrame conversion.
            price_type: Type of price series ('candlestick' or 'line').
                Defaults to "candlestick".
            price_kwargs: Additional arguments for price series configuration.
                Defaults to None.
            volume_kwargs: Additional arguments for volume series configuration.
                Defaults to None.
            pane_id: Pane ID for both price and volume series. Defaults to 0.
            right_price_scale: Right price scale configuration to update for
                proper spacing. Defaults to None.
            on_add_overlay_price_scale: Callback function to add overlay price
                scale. Receives (scale_id, price_scale_options) as arguments.
                Defaults to None.

        Returns:
            SeriesManager: Self for method chaining.

        Raises:
            TypeValidationError: If data or column_mapping types are invalid.
            ValueValidationError: If data is empty or pane_id is negative.

        Example:
            ```python
            manager.add_price_volume_series(
                ohlcv_data,
                column_mapping={"time": "timestamp", "volume": "vol"},
                price_type="candlestick",
            )
            ```
        """
        # Validate inputs
        if data is None:
            raise TypeValidationError("data", "list or DataFrame")
        if not isinstance(data, (list, pd.DataFrame)) or (
            isinstance(data, list) and len(data) == 0
        ):
            raise ValueValidationError("data", "must be a non-empty list or DataFrame")

        if column_mapping is None:
            raise TypeValidationError("column_mapping", "dict")
        if not isinstance(column_mapping, dict):
            raise TypeValidationError("column_mapping", "dict")

        if pane_id < 0:
            raise ValueValidationError("pane_id", "must be non-negative")

        price_kwargs = price_kwargs or {}
        volume_kwargs = volume_kwargs or {}

        # Configure right price scale margins to leave space for volume
        # Volume will use bottom 20% (top=0.8), so right scale needs bottom >= 0.2
        if right_price_scale is not None:
            right_price_scale.visible = True
            right_price_scale.scale_margins = PriceScaleMargins(
                top=0.1,  # 10% margin at top
                bottom=0.25,  # 25% margin at bottom (leaves room for volume overlay)
            )

        # Price series (default price scale)
        price_series: Union[CandlestickSeries, LineSeries]
        if price_type == "candlestick":
            # Filter column mapping to only include OHLC fields
            price_column_mapping = {
                k: v
                for k, v in column_mapping.items()
                if k in ["time", "open", "high", "low", "close"]
            }
            price_series = CandlestickSeries(
                data=data,
                column_mapping=price_column_mapping,
                pane_id=pane_id,
                price_scale_id="right",
                **price_kwargs,
            )
        elif price_type == "line":
            price_series = LineSeries(
                data=data,
                column_mapping=column_mapping,
                pane_id=pane_id,
                price_scale_id="right",
                **price_kwargs,
            )
        else:
            raise ValueValidationError("price_type", "must be 'candlestick' or 'line'")

        price_series._display_name = "Price"  # pylint: disable=protected-access

        # Extract volume-specific kwargs
        volume_up_color = volume_kwargs.get("up_color", "rgba(38,166,154,0.5)")
        volume_down_color = volume_kwargs.get("down_color", "rgba(239,83,80,0.5)")
        volume_base = volume_kwargs.get("base", 0)

        # Add overlay price scale for volume via callback
        volume_price_scale = PriceScaleOptions(
            visible=False,
            auto_scale=True,
            border_visible=False,
            mode=PriceScaleMode.NORMAL,
            scale_margins=PriceScaleMargins(top=0.8, bottom=0.0),
            price_scale_id=ColumnNames.VOLUME.value,
        )

        if on_add_overlay_price_scale:
            on_add_overlay_price_scale(ColumnNames.VOLUME.value, volume_price_scale)

        # The volume series histogram expects a column called 'value'
        if "value" not in column_mapping:
            column_mapping["value"] = column_mapping["volume"]

        # Create histogram series
        volume_series = HistogramSeries.create_volume_series(
            data=data,
            column_mapping=column_mapping,
            up_color=volume_up_color,
            down_color=volume_down_color,
            pane_id=pane_id,
            price_scale_id=ColumnNames.VOLUME.value,
        )

        # Set volume-specific properties
        volume_series.base = volume_base  # type: ignore[attr-defined]
        volume_series.price_format = {"type": "volume", "precision": 0}  # type: ignore[attr-defined]
        volume_series._display_name = "Volume"  # pylint: disable=protected-access

        # Add both series
        self.series.append(price_series)
        self.series.append(volume_series)

        return self

    def get_series_by_pane(self, pane_id: int = 0) -> List[Series]:
        """Get all series for a specific pane.

        Args:
            pane_id: The pane ID to filter by. Defaults to 0.

        Returns:
            List of series objects in the specified pane.

        Example:
            ```python
            pane_series = manager.get_series_by_pane(0)
            ```
        """
        return [
            series
            for series in self.series
            if getattr(series, "pane_id", 0) == pane_id
        ]

    def get_series_info_for_pane(self, pane_id: int = 0) -> List[Dict[str, Any]]:
        """Get series information for the series settings dialog.

        Args:
            pane_id: The pane ID to get series info for. Defaults to 0.

        Returns:
            List of series information dictionaries containing id, displayName,
            and type for each series.

        Example:
            ```python
            series_info = manager.get_series_info_for_pane(0)
            ```
        """
        series_info = []
        pane_series = self.get_series_by_pane(pane_id)

        for i, series in enumerate(pane_series):
            # Get series ID
            series_id = getattr(series, "id", f"series_{i}")

            # Get display name
            display_name = series_id
            if hasattr(series, "name") and series.name:
                display_name = series.name
            elif hasattr(series, "title") and series.title:
                display_name = series.title

            # Get series type
            series_type = series.__class__.__name__.lower().replace("series", "")

            series_info.append(
                {
                    "id": series_id,
                    "displayName": display_name,
                    "type": series_type,
                }
            )

        return series_info

    def get_series_configs_by_pane(self) -> Dict[int, List[Dict[str, Any]]]:
        """Group series configurations by pane ID and sort by z-index.

        Returns a dictionary mapping pane IDs to lists of series configurations,
        where each list is sorted by z-index (lower values render first/behind).

        Returns:
            Dictionary mapping pane IDs to lists of series configurations.

        Example:
            ```python
            series_by_pane = manager.get_series_configs_by_pane()
            for pane_id, configs in series_by_pane.items():
                print(f"Pane {pane_id} has {len(configs)} series")
            ```
        """
        series_by_pane: Dict[int, List[Dict[str, Any]]] = {}

        for series in self.series:
            series_config = series.asdict()

            # Handle case where asdict() returns invalid data
            if not isinstance(series_config, dict):
                logger.warning(
                    "Series %s returned invalid configuration from asdict(): %s. "
                    "Skipping z-index ordering for this series.",
                    type(series).__name__,
                    series_config,
                )
                # Add to default pane with default z-index
                if 0 not in series_by_pane:
                    series_by_pane[0] = []
                series_by_pane[0].append(series_config)
                continue

            pane_id = series_config.get("paneId", 0)

            if pane_id not in series_by_pane:
                series_by_pane[pane_id] = []

            series_by_pane[pane_id].append(series_config)

        # Sort series within each pane by z_index
        for series_list in series_by_pane.values():
            series_list.sort(key=lambda x: x.get("zIndex", 0) if isinstance(x, dict) else 0)

        return series_by_pane

    def get_all_series_configs(self) -> List[Dict[str, Any]]:
        """Get all series configurations sorted by pane and z-index.

        Returns a flattened list of all series configurations, maintaining
        pane order and z-index sorting within each pane.

        Returns:
            List of series configuration dictionaries.

        Example:
            ```python
            configs = manager.get_all_series_configs()
            ```
        """
        series_by_pane = self.get_series_configs_by_pane()

        # Flatten sorted series back to a single list, maintaining pane order
        series_configs = []
        for pane_id in sorted(series_by_pane.keys()):
            series_configs.extend(series_by_pane[pane_id])

        return series_configs

    def clear(self) -> "SeriesManager":
        """Clear all series from the manager.

        Returns:
            SeriesManager: Self for method chaining.

        Example:
            ```python
            manager.clear()
            ```
        """
        self.series.clear()
        return self

    def __len__(self) -> int:
        """Get the number of series managed.

        Returns:
            Number of series in the manager.
        """
        return len(self.series)

    def __iter__(self):
        """Iterate over managed series.

        Returns:
            Iterator over series list.
        """
        return iter(self.series)

    def __getitem__(self, index: int) -> Series:
        """Get series by index.

        Args:
            index: Index of the series to retrieve.

        Returns:
            Series at the specified index.
        """
        return self.series[index]
