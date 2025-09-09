"""
Base series class for streamlit-lightweight-charts.

This module provides the base Series class that defines the common interface
for all series types in the library. It includes core functionality for
data handling, configuration, and frontend integration.

The Series class serves as the foundation for all series implementations,
providing a consistent interface for series creation, configuration, and
rendering. It supports method chaining for fluent API usage and includes
comprehensive data validation and conversion capabilities.

Example:
    ```python
    from streamlit_lightweight_charts_pro.charts.series.base import Series

    class MyCustomSeries(Series):
        def to_frontend_config(self):
            return {"type": "custom", "data": self.data}
    ```
"""

from abc import ABC
from typing import Any, Dict, List, Optional, Type, Union, get_type_hints

import pandas as pd

# Import options classes for dynamic creation
from streamlit_lightweight_charts_pro.charts.options import (
    PriceLineOptions,
)
from streamlit_lightweight_charts_pro.data import Data
from streamlit_lightweight_charts_pro.data.data import classproperty
from streamlit_lightweight_charts_pro.data.marker import MarkerBase
from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    LineStyle,
    PriceLineSource,
)
from streamlit_lightweight_charts_pro.utils import chainable_property
from streamlit_lightweight_charts_pro.utils.data_utils import snake_to_camel

# Initialize logger
logger = get_logger(__name__)


# pylint: disable=no-member, invalid-name
@chainable_property("title", top_level=True)
@chainable_property("visible", top_level=True)
@chainable_property("z_index", allow_none=True, top_level=True)
@chainable_property("price_scale_id", top_level=True)
@chainable_property("price_scale", allow_none=True, top_level=True)
@chainable_property("price_format")
@chainable_property("price_lines", top_level=True)
@chainable_property("markers", List[MarkerBase], allow_none=True, top_level=True)
@chainable_property("pane_id", top_level=True)
@chainable_property("last_value_visible", top_level=True)
@chainable_property("price_line_visible", top_level=True)
@chainable_property("price_line_source", top_level=True)
@chainable_property("price_line_width", top_level=True)
@chainable_property("price_line_color", top_level=True)
@chainable_property("price_line_style", top_level=True)
@chainable_property("tooltip", allow_none=True, top_level=True)
@chainable_property("legend", allow_none=True, top_level=True)
class Series(ABC):
    # Type annotations for attributes to enable automatic type inspection
    """
    Abstract base class for all series types.

    This class defines the common interface and functionality that all series
    classes must implement. It provides core data handling, configuration
    methods, and frontend integration capabilities with comprehensive support
    for pandas DataFrame integration, markers, price lines, and formatting.

    All series classes should inherit from this base class and implement
    the required abstract methods. The class supports method chaining for
    fluent API usage and provides extensive customization options.

    Key Features:
        - DataFrame integration with column mapping
        - Marker and price line management
        - Price scale and pane configuration
        - Visibility and formatting controls
        - Comprehensive data validation
        - Method chaining support

    Attributes:
        data (List[Data]): List of data points for this series.
        visible (bool): Whether the series is currently visible.
        price_scale_id (str): ID of the price scale this series is attached to.
        price_format (PriceFormatOptions): Price formatting configuration.
        price_lines (List[PriceLineOptions]): List of price lines for this series.
        markers (List[Marker]): List of markers to display on this series.
        pane_id (int): The pane index this series belongs to.

    Note:
        Subclasses must define a class-level DATA_CLASS attribute for from_dataframe to work.
        The data_class property will always pick the most-derived DATA_CLASS in the MRO.
    """

    def __init__(
        self,
        data: Union[List[Data], pd.DataFrame, pd.Series],
        column_mapping: Optional[dict] = None,
        visible: bool = True,
        price_scale_id: str = "",
        pane_id: Optional[int] = 0,
    ):
        """
        Initialize a series with data and configuration.

        Creates a new series instance with the provided data and configuration options.
        The constructor supports multiple data input types including lists of Data
        objects, pandas DataFrames, and pandas Series with automatic validation
        and conversion.

        Args:
            data (Union[List[Data], pd.DataFrame, pd.Series]): Series data as a list
                of data objects, pandas DataFrame, or pandas Series.
            column_mapping (Optional[dict]): Optional column mapping for DataFrame/Series
                input. Required when providing DataFrame or Series data.
            visible (bool, optional): Whether the series is visible. Defaults to True.
            price_scale_id (str, optional): ID of the price scale to attach to.
                Defaults to "".
            pane_id (Optional[int], optional): The pane index this series belongs to.
                Defaults to 0.

        Raises:
            ValueError: If data is not a valid type (list of Data objects, DataFrame, or Series).
            ValueError: If DataFrame/Series is provided without column_mapping.
            ValueError: If all items in data list are not instances of Data or its subclasses.

        Example:
            ```python
            # Basic series with list of data objects
            series = LineSeries(data=line_data)

            # Series with DataFrame
            series = LineSeries(
                data=df,
                column_mapping={'time': 'datetime', 'value': 'close'}
            )

            # Series with Series
            series = LineSeries(
                data=series_data,
                column_mapping={'time': 'index', 'value': 'values'}
            )

            # Series with custom configuration
            series = LineSeries(
                data=line_data,
                visible=False,
                price_scale_id="right",
                pane_id=1
            )
            ```
        """
        # Validate and process data
        if data is None:
            self.data = []
        elif isinstance(data, (pd.DataFrame, pd.Series)):
            if column_mapping is None:
                raise ValueError(
                    "column_mapping is required when providing DataFrame or Series data"
                )
            # Process DataFrame/Series using from_dataframe logic
            self.data = self._process_dataframe_input(data, column_mapping)
        elif isinstance(data, list):
            # Validate that all items are Data instances
            if data and not all(isinstance(item, Data) for item in data):
                raise ValueError(
                    "All items in data list must be instances of Data or its subclasses"
                )
            self.data = data
        else:
            raise ValueError(
                "data must be a list of SingleValueData objects, DataFrame, or Series, "
                f"got {type(data)}"
            )

        self._title = None
        self._visible = visible
        self._price_scale_id = price_scale_id
        self._price_scale = None
        self._price_format = None
        self._price_lines = []
        self._markers = []
        self._pane_id = pane_id
        self._column_mapping = column_mapping
        self._last_value_visible = True
        self._price_line_visible = True
        self._price_line_source = PriceLineSource.LAST_BAR
        self._price_line_width = 1
        self._price_line_color = ""
        self._price_line_style = LineStyle.DASHED
        self._tooltip = None
        self._z_index = 100
        self._legend = None

    @staticmethod
    def prepare_index(df: pd.DataFrame, column_mapping: Dict[str, str]) -> pd.DataFrame:
        """
        Prepare index for column mapping.

        Handles all index-related column mapping cases:
        - Time column mapping with DatetimeIndex
        - Level position mapping (e.g., "0", "1")
        - "index" mapping (first unnamed level or level 0)
        - Named level mapping (e.g., "date", "symbol")
        - Single index reset for non-time columns

        Args:
            df: DataFrame to prepare
            column_mapping: Mapping of required fields to column names

        Returns:
            DataFrame with prepared index

        Raises:
            ValueError: If time column is not found and no DatetimeIndex is available
        """
        # Handle time column mapping first (special case for DatetimeIndex)
        if "time" in column_mapping:
            time_col = column_mapping["time"]
            if time_col not in df.columns:
                # Handle single DatetimeIndex
                if isinstance(df.index, pd.DatetimeIndex):
                    if df.index.name is None:
                        # Set name and reset index to make it a regular column
                        df.index.name = time_col
                        df = df.reset_index()
                    elif df.index.name == time_col:
                        # Index name already matches, just reset to make it a regular column
                        df = df.reset_index()

                # Handle MultiIndex with DatetimeIndex level
                elif isinstance(df.index, pd.MultiIndex):
                    for i, level in enumerate(df.index.levels):
                        if isinstance(level, pd.DatetimeIndex):
                            if df.index.names[i] is None:
                                # Set name for this level and reset it
                                new_names = list(df.index.names)
                                new_names[i] = time_col
                                df.index.names = new_names
                                df = df.reset_index(level=time_col)
                                break
                            elif df.index.names[i] == time_col:
                                # Level name already matches, reset this level
                                df = df.reset_index(level=time_col)
                                break
                    else:
                        # No DatetimeIndex level found, check if any level name matches
                        if time_col in df.index.names:
                            # Reset the entire MultiIndex to get all levels as columns
                            df = df.reset_index()
                        else:
                            # No matching level found, check if time_col is "index" or integer level position
                            if time_col == "index":
                                # Reset the entire MultiIndex to get all levels as columns
                                df = df.reset_index()
                            else:
                                # Check if time_col is an integer level position
                                try:
                                    level_idx = int(time_col)
                                    if 0 <= level_idx < len(df.index.levels):
                                        # Reset the entire MultiIndex to get all levels as columns
                                        df = df.reset_index()
                                    else:
                                        # Invalid level position, just pass through
                                        pass
                                except ValueError:
                                    # Not an integer, just pass through
                                    pass
                else:
                    # No DatetimeIndex found
                    # Check if time_col is "index" and we have a regular index to reset
                    if time_col == "index":
                        # Reset the index to make it a regular column
                        idx_name = df.index.name
                        df = df.reset_index()
                        new_col_name = idx_name if idx_name is not None else "index"
                        column_mapping["time"] = new_col_name
                    elif time_col == df.index.name:
                        # Time column matches index name, reset the index
                        df = df.reset_index()
                    else:
                        raise ValueError(
                            f"Time column '{time_col}' not found in DataFrame columns and no "
                            "DatetimeIndex available in the index"
                        )

        # Handle other index columns
        for field, col_name in column_mapping.items():
            if field == "time":
                continue  # Already handled above

            if col_name not in df.columns:
                if isinstance(df.index, pd.MultiIndex):
                    level_names = list(df.index.names)

                    # Integer string or int: treat as level position
                    try:
                        level_idx = int(col_name)
                        if 0 <= level_idx < len(df.index.levels):
                            df = df.reset_index(level=level_idx)
                            level_name = level_names[level_idx]
                            # Update column mapping to use actual column name
                            new_col_name = (
                                level_name if level_name is not None else f"level_{level_idx}"
                            )
                            column_mapping[field] = new_col_name
                            continue
                    except (ValueError, IndexError):
                        pass

                    # 'index': use first unnamed level if any, else first level
                    if col_name == "index":
                        unnamed_levels = [i for i, name in enumerate(level_names) if name is None]
                        level_idx = unnamed_levels[0] if unnamed_levels else 0
                        df = df.reset_index(level=level_idx)
                        level_name = level_names[level_idx]
                        new_col_name = (
                            level_name if level_name is not None else f"level_{level_idx}"
                        )
                        column_mapping[field] = new_col_name
                        continue

                    # Named level
                    if col_name in level_names:
                        level_idx = level_names.index(col_name)
                        df = df.reset_index(level=level_idx)
                        continue

                else:
                    # Single index
                    if col_name == "index" or col_name == df.index.name:
                        idx_name = df.index.name
                        df = df.reset_index()
                        new_col_name = idx_name if idx_name is not None else "index"
                        column_mapping[field] = new_col_name
                        continue

        return df

    def _process_dataframe_input(
        self, data: Union[pd.DataFrame, pd.Series], column_mapping: Dict[str, str]
    ) -> List[Data]:
        """
        Process DataFrame or Series input into a list of Data objects.

        This method duplicates the logic from from_dataframe to handle
        DataFrame/Series input in the constructor. It validates the input
        data structure and converts it to the appropriate Data objects
        based on the series type.

        Args:
            data (Union[pd.DataFrame, pd.Series]): DataFrame or Series to process.
            column_mapping (Dict[str, str]): Mapping of required fields to column names.

        Returns:
            List[Data]: List of processed data objects suitable for the series type.

        Raises:
            ValueError: If required columns are missing from the DataFrame/Series.
            ValueError: If the data structure is invalid for the series type.
            ValueError: If time column is not found and no DatetimeIndex is available.

        Note:
            This method uses the data_class property to determine the appropriate
            Data class for conversion.
        """
        # Convert Series to DataFrame if needed (do this first)
        if isinstance(data, pd.Series):
            data = data.to_frame()

        data_class = self.data_class
        required = data_class.required_columns
        optional = data_class.optional_columns

        # Check if all required columns are mapped
        # Normalize keys to handle both snake_case and camelCase
        def normalize_key(key):
            """Convert snake_case to camelCase for comparison."""
            if "_" in key:
                parts = key.split("_")
                return parts[0] + "".join(part.capitalize() for part in parts[1:])
            return key

        # Create normalized versions of both sets for comparison
        normalized_required = {normalize_key(key) for key in required}
        normalized_mapping_keys = {normalize_key(key) for key in column_mapping.keys()}

        missing_required = normalized_required - normalized_mapping_keys
        if missing_required:
            # Convert back to original format for error message
            original_missing = {key for key in required if normalize_key(key) in missing_required}
            raise ValueError(f"DataFrame is missing required column mapping: {original_missing}")

        # Prepare index for all column mappings
        df = self.prepare_index(data, column_mapping)

        # Check if all required columns are present in the DataFrame
        mapped_columns = set(column_mapping.values())
        available_columns = set(df.columns.tolist())
        missing_columns = mapped_columns - available_columns

        if missing_columns:
            raise ValueError(f"DataFrame is missing required column: {missing_columns}")

        # Create data objects
        result = []
        for _, row in df.iterrows():
            kwargs = {}
            # Process both required and optional columns
            for key in required.union(optional):
                # Find the corresponding column mapping key (handle both snake_case and camelCase)
                mapped_key = None
                for mapping_key in column_mapping:
                    if normalize_key(mapping_key) == normalize_key(key):
                        mapped_key = mapping_key
                        break

                if mapped_key:
                    col_name = column_mapping[mapped_key]
                    if col_name in df.columns:
                        value = row[col_name]
                        kwargs[key] = value
            data_obj = data_class(**kwargs)
            result.append(data_obj)

        return result

    @property
    def data_dict(self) -> List[Dict[str, Any]]:
        """
        Get the data in dictionary format.

        Converts the series data to a list of dictionaries suitable for
        frontend serialization. Handles various data formats including
        dictionaries, lists of dictionaries, or lists of objects with
        asdict() methods.

        Returns:
            List[Dict[str, Any]]: List of data dictionaries ready for
                frontend consumption.

        Example:
            ```python
            # Get data as dictionaries
            data_dicts = series.data_dict

            # Access individual data points
            for data_point in data_dicts:
                # Data point contains time and value information
                pass
            ```
        """
        if isinstance(self.data, dict):
            return self.data
        if isinstance(self.data, list):
            if len(self.data) == 0:
                return self.data
            # If already list of dicts
            if isinstance(self.data[0], dict):
                return self.data
                # If list of objects with asdict
        if hasattr(self.data[0], "asdict"):
            return [item.asdict() for item in self.data]
        # Fallback: return as-is
        return self.data

    def add_marker(self, marker: MarkerBase) -> "Series":
        """
        Add a marker to this series.

        Adds a marker object to the series for highlighting specific data points
        or events. The marker must be a valid MarkerBase subclass (BarMarker or PriceMarker).

        Args:
            marker (MarkerBase): The marker object to add. Must be a BarMarker or PriceMarker.

        Returns:
            Series: Self for method chaining.

        Raises:
            ValueError: If the marker position is not valid for its type.

        Example:
            ```python
            from streamlit_lightweight_charts_pro.data.marker import BarMarker, PriceMarker
            from streamlit_lightweight_charts_pro.type_definitions.enums import MarkerPosition, MarkerShape

            # Add a bar marker
            bar_marker = BarMarker(
                time="2024-01-01 10:00:00",
                position=MarkerPosition.ABOVE_BAR,
                color="red",
                shape=MarkerShape.CIRCLE,
                text="Buy Signal"
            )
            series.add_marker(bar_marker)

            # Add a price marker
            price_marker = PriceMarker(
                time=1640995200,
                position=MarkerPosition.AT_PRICE_TOP,
                color="#00ff00",
                shape=MarkerShape.ARROW_UP,
                price=100.50,
                text="Resistance Level"
            )
            series.add_marker(price_marker)

            # Method chaining
            series.add_marker(marker1).add_marker(marker2)
            ```
        """
        # Validate the marker position
        if not marker.validate_position():
            raise ValueError(
                f"Invalid position '{marker.position}' for marker type {type(marker).__name__}"
            )

        self._markers.append(marker)
        return self

    def add_markers(self, markers: List[MarkerBase]) -> "Series":
        """
        Add multiple markers to this series.

        Adds a list of markers to the series. Returns self for method chaining.

        Args:
            markers: List of marker objects to add. Must be MarkerBase subclasses.

        Returns:
            Series: Self for method chaining.

        Raises:
            ValueError: If any marker position is not valid for its type.
        """
        # Validate all markers before adding
        for marker in markers:
            if not marker.validate_position():
                raise ValueError(
                    f"Invalid position '{marker.position}' for marker type {type(marker).__name__}"
                )

        self._markers.extend(markers)
        return self

    def clear_markers(self) -> "Series":
        """
        Clear all markers from this series.

        Removes all markers from the series. Returns self for method chaining.

        Returns:
            Series: Self for method chaining.
        """
        self._markers.clear()
        return self

    def add_price_line(self, price_line: PriceLineOptions) -> "Series":
        """
        Add a price line option to this series.

        Args:
            price_line (PriceLineOptions): The price line option to add.

        Returns:
            Series: Self for method chaining.
        """
        self._price_lines.append(price_line)
        return self

    def clear_price_lines(self) -> "Series":
        """
        Remove all price line options from this series.

        Returns:
            Series: Self for method chaining.
        """
        self._price_lines.clear()
        return self

    def _validate_pane_config(self) -> None:
        """
        Validate pane configuration for the series.

        This method ensures that pane_id is properly set.
        It should be called by subclasses in their asdict() method.

        Raises:
            ValueError: If pane_id is negative.
        """
        if self._pane_id is not None and self._pane_id < 0:
            raise ValueError("pane_id must be non-negative")
        if self._pane_id is None:
            self._pane_id = 0

    def _get_attr_name(self, key: str) -> str:
        """
        Get the attribute name for a given key.
        """
        # Convert camelCase to snake_case for attribute lookup
        attr_name = self._camel_to_snake(key)

        # Check if attribute exists (try multiple variations)
        if not hasattr(self, attr_name):
            # Try the original key in case it's already snake_case
            if hasattr(self, key):
                attr_name = key
            # Try with _ prefix (for private attributes)
            elif hasattr(self, f"_{attr_name}"):
                attr_name = f"_{attr_name}"
            # Try original key with _ prefix
            elif hasattr(self, f"_{key}"):
                attr_name = f"_{key}"
            else:
                # Ignore invalid attributes instead of raising an error

                attr_name = None

        return attr_name

    def update(self, updates: Dict[str, Any]) -> "Series":
        """
        Update series configuration with a dictionary of values.

        This method updates series properties using a configuration dictionary. It supports
        updating simple attributes, nested options objects, and lists of options. Keys may be
        in snake_case or camelCase. Invalid or unknown attributes will be logged and skipped.

        Args:
            updates (Dict[str, Any]): Dictionary of updates to apply. Keys can be in snake_case
                or camelCase. Values can be simple types, dictionaries for nested objects, or lists.

        Returns:
            Series: Self for method chaining.

        Raises:
            AttributeError: If an attribute cannot be set due to type or value errors.

        Example:
            ```python
            series = LineSeries(data=data)
            series.update({"visible": False, "price_scale_id": "left"})
            series.update({"price_format": {"precision": 2, "minMove": 0.01}})
            series.update({"price_lines": [
                {"price": 105, "color": "#00ff00"},
                {"price": 110, "color": "#ff0000"}
            ]})
            series.update({"visible": True}).update({"pane_id": 1})
            ```
        """
        for key, value in updates.items():
            if value is None:
                continue  # Skip None values for method chaining

            attr_name = self._get_attr_name(key)

            if attr_name is None:

                continue

            try:
                if isinstance(value, dict):
                    self._update_dict_value(attr_name, value)
                elif isinstance(value, list):
                    self._update_list_value(attr_name, value)
                else:
                    setattr(self, attr_name, value)
            except Exception as exc:
                logger.error("Failed to update attribute '%s': %s", attr_name, exc)
                raise

        return self

    def _update_dict_value(self, attr_name: str, value: dict) -> None:
        """
        Update a nested options object attribute with a dictionary.

        Args:
            attr_name (str): Attribute name to update.
            value (dict): Dictionary of values to update the nested object.

        Raises:
            AttributeError: If the attribute cannot be updated.
        """

        current_value = getattr(self, attr_name, None)

        if current_value is not None and hasattr(current_value, "update"):
            current_value.update(value)
            return

        type_hints = get_type_hints(self.__class__)

        attr_type = type_hints.get(attr_name)

        if attr_type is None:

            return

        # Handle Union types (e.g., Optional[T])
        if getattr(attr_type, "__origin__", None) is Union:
            for arg in attr_type.__args__:
                if arg is not type(None):
                    attr_type = arg
                    break

        if hasattr(attr_type, "update"):
            try:
                instance = attr_type()
                setattr(self, attr_name, instance)
                instance.update(value)
            except Exception as exc:
                logger.error("Failed to instantiate or update %s: %s", attr_name, exc)
                raise
        else:
            # No update method for this attribute
            pass

    def _update_list_value(self, attr_name: str, value: list) -> None:
        """
        Update a list attribute, instantiating and updating items as needed.

        Args:
            attr_name (str): Attribute name to update.
            value (list): List of values or dicts to update the list attribute.

        Raises:
            AttributeError: If the attribute cannot be updated.
        """

        current_value = getattr(self, attr_name, None)

        type_hints = get_type_hints(self.__class__)

        attr_type = type_hints.get(attr_name)

        if attr_type is None:
            setattr(self, attr_name, value)
            return

        if getattr(attr_type, "__origin__", None) is list:
            item_type = attr_type.__args__[0]

            if not hasattr(item_type, "update"):

                setattr(self, attr_name, value)
                return

            if current_value is None:
                current_value = []
                setattr(self, attr_name, current_value)

            for i, item in enumerate(value):
                if isinstance(item, dict):
                    try:
                        instance = item_type()
                        instance.update(item)
                        current_value.append(instance)
                    except Exception as exc:
                        logger.error(
                            "Failed to instantiate or update list item for %s: %s", attr_name, exc
                        )
                        raise
                else:
                    current_value.append(item)
        else:
            setattr(self, attr_name, value)

    def _camel_to_snake(self, camel_case: str) -> str:
        """
        Convert camelCase to snake_case.

        Args:
            camel_case: String in camelCase format.

        Returns:
            String in snake_case format.
        """
        import re  # pylint: disable=import-outside-toplevel

        return re.sub(r"(?<!^)(?=[A-Z])", "_", camel_case).lower()

    def asdict(self) -> Dict[str, Any]:
        """
        Convert series to dictionary representation.

        This method creates a dictionary representation of the series
        that can be consumed by the frontend React component.

        Returns:
            Dict[str, Any]: Dictionary containing series configuration for the frontend.
        """
        # Validate pane configuration
        self._validate_pane_config()

        # Get base configuration
        config = {
            "type": self.chart_type.value,
            "data": self.data_dict,
        }

        # Add options from chainable properties only
        options = {}
        for attr_name in dir(self):
            if attr_name.startswith("_"):
                continue
            # Skip data attribute as it's handled separately
            if attr_name == "data":
                continue
            # Skip class attributes (like DATA_CLASS)
            if attr_name.isupper():
                continue
            # Skip class properties (like data_class)
            if attr_name == "data_class":
                continue

            # Rule 1: Only include attributes decorated with chainable_property
            if not self._is_chainable_property(attr_name):
                continue

            attr_value = getattr(self, attr_name)

            # Rule 2: Skip if None and allow_none is True
            if attr_value is None and self._is_allow_none(attr_name):
                continue

            # Determine if this should go to top level or options
            is_top_level = self._is_top_level(attr_name)

            # Handle objects with asdict() method
            if (
                hasattr(attr_value, "asdict")
                and callable(getattr(attr_value, "asdict"))
                and not isinstance(attr_value, type)
            ):
                # Rule 3: If property ends with _options, flatten it into options
                if attr_name.endswith("_options"):
                    options.update(attr_value.asdict())
                else:
                    # Convert snake_case to camelCase for the key
                    key = snake_to_camel(attr_name)
                    if is_top_level:
                        config[key] = attr_value.asdict()
                    else:
                        options[key] = attr_value.asdict()

            # Handle lists of objects with asdict() method
            elif (
                isinstance(attr_value, list)
                and attr_value
                and hasattr(attr_value[0], "asdict")
                and callable(getattr(attr_value[0], "asdict"))
            ):
                # Convert list of objects to list of dictionaries
                key = snake_to_camel(attr_name)
                if is_top_level:
                    config[key] = [item.asdict() for item in attr_value]
                else:
                    options[key] = [item.asdict() for item in attr_value]

            # Also include individual option attributes that are not None
            elif (
                not callable(attr_value)
                and not isinstance(attr_value, type)
                and attr_value is not None
            ):
                # Skip empty lists (they should not be included in configuration)
                if isinstance(attr_value, list) and not attr_value:
                    continue

                # Convert snake_case to camelCase for the key
                key = snake_to_camel(attr_name)
                if is_top_level:
                    # Include empty strings for top-level properties (they are valid)
                    config[key] = attr_value
                else:
                    # Skip empty strings for options (they are not meaningful)
                    if attr_value != "":
                        options[key] = attr_value

        # Only include options field if it's not empty
        if options:
            config["options"] = options

        return config

    def _is_chainable_property(self, attr_name: str) -> bool:
        """
        Check if an attribute is decorated with chainable_property.

        Args:
            attr_name: Name of the attribute to check

        Returns:
            bool: True if the attribute is a chainable property
        """
        return (
            hasattr(self.__class__, "_chainable_properties")
            and attr_name
            in self.__class__._chainable_properties  # pylint: disable=protected-access
        )

    def _is_allow_none(self, attr_name: str) -> bool:
        """
        Check if a chainable property allows None values.

        Args:
            attr_name: Name of the attribute to check

        Returns:
            bool: True if the property allows None values
        """
        if self._is_chainable_property(attr_name):
            return self.__class__._chainable_properties[attr_name][
                "allow_none"
            ]  # pylint: disable=protected-access
        return False

    def _is_top_level(self, attr_name: str) -> bool:
        """
        Check if a chainable property should be output at the top level.

        Args:
            attr_name: Name of the attribute to check

        Returns:
            bool: True if the attribute should be at the top level
        """
        if self._is_chainable_property(attr_name):
            return self.__class__._chainable_properties[attr_name][
                "top_level"
            ]  # pylint: disable=protected-access
        return False

    @classproperty
    def data_class(cls) -> Type[Data]:  # pylint: disable=no-self-argument
        """
        Return the first DATA_CLASS found in the MRO (most-derived class wins).
        """
        for base in cls.__mro__:
            if hasattr(base, "DATA_CLASS"):
                return getattr(base, "DATA_CLASS")
        raise NotImplementedError("No DATA_CLASS defined in the class hierarchy.")

    @classmethod
    def from_dataframe(
        cls,
        df: Union[pd.DataFrame, pd.Series],
        column_mapping: Dict[str, str],
        price_scale_id: str = "",
        **kwargs,
    ) -> "Series":
        """
        Create a Series instance from a pandas DataFrame or Series.

        Args:
            df (Union[pd.DataFrame, pd.Series]): The input DataFrame or Series.
            column_mapping (dict): Mapping of required fields
                (e.g., {'time': 'datetime', 'value': 'close', ...}).
            price_scale_id (str): Price scale ID (default '').
            **kwargs: Additional arguments for the Series constructor.

        Returns:
            Series: An instance of the Series (or subclass) with normalized data.

        Raises:
            NotImplementedError: If the subclass does not define DATA_CLASS.
            ValueError: If required columns are missing in column_mapping or DataFrame.
            AttributeError: If the data class does not define REQUIRED_COLUMNS.
        """
        # Convert Series to DataFrame if needed
        if isinstance(df, pd.Series):
            df = df.to_frame()

        data_class = cls.data_class
        required = data_class.required_columns
        optional = data_class.optional_columns

        # Check required columns in column_mapping
        missing_mapping = [col for col in required if col not in column_mapping]
        if missing_mapping:
            raise ValueError(
                f"Missing required columns in column_mapping: {missing_mapping}\n"
                f"Required columns: {required}\n"
                f"Column mapping: {column_mapping}"
            )
        else:
            pass  # Removed print

        # Prepare index for all column mappings
        df = cls.prepare_index(df, column_mapping)

        # Check required columns in DataFrame (including index) - after processing
        for key in required:
            col = column_mapping[key]
            if col not in df.columns:
                raise ValueError(f"DataFrame is missing required column: {col}")
            else:
                pass  # Removed print

        # Build data objects
        data = []
        for i in range(len(df)):
            kwargs_data = {}
            for key in required.union(optional):
                if key in column_mapping:
                    col = column_mapping[key]
                    if col in df.columns:
                        value = df.iloc[i][col]
                        kwargs_data[key] = value
                    else:
                        raise ValueError(f"DataFrame is missing required column: {col}")
                else:
                    # Skip optional columns that are not in column_mapping
                    continue

            data.append(data_class(**kwargs_data))

        result = cls(data=data, price_scale_id=price_scale_id, **kwargs)
        return result
