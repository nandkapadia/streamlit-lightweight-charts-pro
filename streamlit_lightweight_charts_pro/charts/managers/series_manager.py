"""Series management for Chart component.

This module handles series list operations, validation, and configuration
for chart series.
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
from streamlit_lightweight_charts_pro.constants import (
    HISTOGRAM_DOWN_COLOR_DEFAULT,
    HISTOGRAM_UP_COLOR_DEFAULT,
)
from streamlit_lightweight_charts_pro.data.ohlcv_data import OhlcvData
from streamlit_lightweight_charts_pro.exceptions import (
    SeriesItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)
from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    ColumnNames,
    PriceScaleMode,
)

# Initialize logger
logger = get_logger(__name__)


class SeriesManager:
    """Manages series operations for a Chart.

    This class handles all series-related operations including:
    - Adding and validating series
    - Managing series list
    - Handling series configuration
    - Creating complex series combinations (e.g., price + volume)

    Attributes:
        series (List[Series]): List of series objects managed by this instance.
    """

    def __init__(self, series: Optional[Union[Series, List[Series]]] = None):
        """Initialize the SeriesManager.

        Args:
            series: Optional single series object or list of series objects.

        Raises:
            SeriesItemsTypeError: If any item in the series list is not a Series
                instance.
            TypeValidationError: If series is not a Series instance or list.
        """
        # Handle series input - convert to list for uniform processing
        if series is None:
            self.series = []
        elif isinstance(series, Series):
            self.series = [series]
        elif isinstance(series, list):
            for item in series:
                if not isinstance(item, Series):
                    raise SeriesItemsTypeError()
            self.series = series
        else:
            raise TypeValidationError("series", "Series instance or list")

    def add_series(
        self,
        series: Series,
        price_scale_manager: Optional[Any] = None,
    ) -> None:
        """Add a series to the managed list.

        Args:
            series: Series object to add.
            price_scale_manager: Optional PriceScaleManager to handle custom
                price scales.

        Raises:
            TypeValidationError: If the series parameter is not an instance of Series.
        """
        if not isinstance(series, Series):
            raise TypeValidationError("series", "Series instance")

        # Check for custom price scale configuration needs
        price_scale_id = series.price_scale_id  # type: ignore[attr-defined]

        # Handle custom price scale setup with manager if provided
        if (
            price_scale_id
            and price_scale_id not in ["left", "right", ""]
            and price_scale_manager is not None
        ) and not price_scale_manager.has_overlay_scale(price_scale_id):
            logger.warning(
                "Series with price_scale_id '%s' does not have a corresponding "
                "overlay price scale configuration. Creating empty price scale object.",
                price_scale_id,
            )
            empty_scale = PriceScaleOptions(price_scale_id=price_scale_id)
            price_scale_manager.add_overlay_scale(price_scale_id, empty_scale)

        self.series.append(series)

    def add_price_volume_series(
        self,
        data: Union[Sequence[OhlcvData], pd.DataFrame],
        column_mapping: Optional[dict],
        price_type: str = "candlestick",
        price_kwargs: Optional[dict] = None,
        volume_kwargs: Optional[dict] = None,
        pane_id: int = 0,
        price_scale_manager: Optional[Any] = None,
    ) -> None:
        """Add price and volume series to the chart.

        Creates and adds both price and volume series from OHLCV data.
        The price series is displayed on the main price scale, while the volume
        series is displayed on a separate overlay price scale.

        Args:
            data: OHLCV data containing price and volume information.
            column_mapping: Mapping of column names for DataFrame conversion.
            price_type: Type of price series ('candlestick' or 'line').
            price_kwargs: Additional arguments for price series configuration.
            volume_kwargs: Additional arguments for volume series configuration.
            pane_id: Pane ID for both price and volume series.
            price_scale_manager: Optional PriceScaleManager for price scale config.

        Raises:
            TypeValidationError: If data or column_mapping is invalid.
            ValueValidationError: If data is empty or price_type is invalid.
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

        # Price series creation
        price_series: Union[CandlestickSeries, LineSeries]
        if price_type == "candlestick":
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
        volume_up_color = volume_kwargs.get("up_color", HISTOGRAM_UP_COLOR_DEFAULT)
        volume_down_color = volume_kwargs.get("down_color", HISTOGRAM_DOWN_COLOR_DEFAULT)
        volume_base = volume_kwargs.get("base", 0)

        # Configure volume price scale through manager if provided
        if price_scale_manager is not None:
            volume_price_scale = PriceScaleOptions(
                visible=False,
                auto_scale=True,
                border_visible=False,
                mode=PriceScaleMode.NORMAL,
                scale_margins=PriceScaleMargins(top=0.8, bottom=0.0),
                price_scale_id=ColumnNames.VOLUME.value,
            )
            price_scale_manager.add_overlay_scale(ColumnNames.VOLUME.value, volume_price_scale)

        # Ensure volume mapping includes 'value' key
        if "value" not in column_mapping:
            column_mapping["value"] = column_mapping["volume"]

        # Create histogram series for volume
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
        self.add_series(price_series, price_scale_manager)
        self.add_series(volume_series, price_scale_manager)

    def get_series_info_for_pane(self, _pane_id: int = 0) -> List[dict]:
        """Get series information for a specific pane.

        Args:
            pane_id: The pane ID to get series info for (default: 0).

        Returns:
            List of series information dictionaries.
        """
        series_info = []

        for i, series in enumerate(self.series):
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
                },
            )

        return series_info

    def to_frontend_configs(self) -> List[Dict[str, Any]]:
        """Convert all series to frontend configuration dictionaries.

        Groups series by pane and sorts by z-index for proper layering.

        Returns:
            List of series configuration dictionaries.
        """
        # Group series by pane_id and sort by z_index within each pane
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

        # Flatten sorted series back to a single list, maintaining pane order
        series_configs = []
        for pane_id in sorted(series_by_pane.keys()):
            series_configs.extend(series_by_pane[pane_id])

        return series_configs
