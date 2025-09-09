"""
Annotation system for streamlit-lightweight-charts.

This module provides a comprehensive annotation system for adding text, arrows,
shapes, and other visual elements to charts. It includes classes for individual
annotations, annotation layers for organization, and an annotation manager for
coordinating multiple layers.

The annotation system supports:
    - Multiple annotation types (text, arrow, shape, line, rectangle, circle)
    - Annotation positioning (above, below, inline)
    - Layer-based organization for grouping related annotations
    - Visibility and opacity controls
    - Method chaining for fluent API usage

Example:
    ```python
    from streamlit_lightweight_charts_pro.data.annotation import (
        create_text_annotation, create_arrow_annotation, AnnotationManager
    )

    # Create annotations
    text_ann = create_text_annotation("2024-01-01", 100, "Important Event")
    arrow_ann = create_arrow_annotation("2024-01-02", 105, "Buy Signal")

    # Use with annotation manager
    manager = (AnnotationManager()
               .create_layer("events")
               .add_annotation(text_ann, "events")
               .add_annotation(arrow_ann, "events"))
    ```
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import pandas as pd

from streamlit_lightweight_charts_pro.logging_config import get_logger
from streamlit_lightweight_charts_pro.type_definitions import ColumnNames
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    AnnotationPosition,
    AnnotationType,
)
from streamlit_lightweight_charts_pro.utils.data_utils import from_utc_timestamp, to_utc_timestamp

# Initialize logger
logger = get_logger("data.annotation")


class Annotation:
    """
    Represents a chart annotation.

    This class defines an annotation that can be displayed on charts to
    provide additional context, highlight important events, or add
    explanatory information. Annotations support various types, positions,
    and styling options.

    Attributes:
        time: Annotation time (accepts pd.Timestamp, datetime, or string)
        price: Price level for the annotation
        text: Annotation text content
        annotation_type: Type of annotation (text, arrow, shape, etc.)
        position: Position of the annotation relative to the price level
        color: Primary color of the annotation
        background_color: Background color for text annotations
        font_size: Font size for text annotations
        font_weight: Font weight for text annotations
        text_color: Color of the text content
        border_color: Border color for shape annotations
        border_width: Border width for shape annotations
        opacity: Overall opacity of the annotation (0.0 to 1.0)
        show_time: Whether to show time in the annotation text
        tooltip: Optional tooltip text for hover interactions
    """

    time: Union[pd.Timestamp, datetime, str, int, float]
    price: float
    text: str
    annotation_type: Union[AnnotationType, str] = AnnotationType.TEXT
    position: Union[AnnotationPosition, str] = AnnotationPosition.ABOVE
    color: str = "#2196F3"
    background_color: str = "rgba(255, 255, 255, 0.9)"
    font_size: int = 12
    font_weight: str = "normal"
    text_color: str = "#000000"
    border_color: str = "#CCCCCC"
    border_width: int = 1
    opacity: float = 1.0
    show_time: bool = False
    tooltip: Optional[str] = None

    def __init__(
        self,
        time: Union[pd.Timestamp, datetime, str, int, float],
        price: float,
        text: str,
        annotation_type: Union[str, AnnotationType] = AnnotationType.TEXT,
        position: Union[str, AnnotationPosition] = AnnotationPosition.ABOVE,
        color: str = "#2196F3",
        background_color: str = "rgba(255, 255, 255, 0.9)",
        font_size: int = 12,
        font_weight: str = "normal",
        text_color: str = "#000000",
        border_color: str = "#CCCCCC",
        border_width: int = 1,
        opacity: float = 1.0,
        show_time: bool = False,
        tooltip: Optional[str] = None,
    ):
        # Convert time to UTC timestamp for consistent storage
        self._timestamp = to_utc_timestamp(time)

        # Accept both str and Enum for annotation_type
        if isinstance(annotation_type, str):
            self.annotation_type = AnnotationType(annotation_type)
        else:
            self.annotation_type = annotation_type

        # Accept both str and Enum for position
        if isinstance(position, str):
            self.position = AnnotationPosition(position)
        else:
            self.position = position

        # Validate price value
        if not isinstance(price, (int, float)):
            raise ValueError("Price must be a number")
        self.price = price

        # Validate text content
        if not text:
            raise ValueError("Annotation text cannot be empty")
        self.text = text

        # Validate opacity range
        if not 0 <= opacity <= 1:
            raise ValueError("Opacity must be between 0 and 1")
        self.opacity = opacity

        # Validate font size
        if font_size <= 0:
            raise ValueError("Font size must be positive")
        self.font_size = font_size

        # Validate border width
        if border_width < 0:
            raise ValueError("Border width must be non-negative")
        self.border_width = border_width

        self.color = color
        self.background_color = background_color
        self.font_weight = font_weight
        self.text_color = text_color
        self.border_color = border_color
        self.show_time = show_time
        self.tooltip = tooltip

    @property
    def timestamp(self) -> Union[int, str]:
        """
        Get time as UTC timestamp.

        Returns:
            Union[int, str]: UTC timestamp as integer (seconds) or
                date string if the original input was a date string.
        """
        return self._timestamp

    @property
    def datetime_value(self) -> pd.Timestamp:
        """
        Get time as pandas Timestamp.

        Returns:
            pd.Timestamp: Pandas Timestamp object representing the
                annotation time.
        """
        return pd.Timestamp(from_utc_timestamp(self._timestamp))

    def asdict(self) -> Dict[str, Any]:
        """
        Convert annotation to dictionary for serialization.

        This method creates a dictionary representation of the annotation
        suitable for JSON serialization or frontend consumption.

        Returns:
            Dict[str, Any]: Dictionary containing all annotation properties
                in a format suitable for the frontend component.
        """
        return {
            ColumnNames.TIME: self.timestamp,
            "price": self.price,
            "text": self.text,
            "type": self.annotation_type.value,
            "position": self.position.value,
            "color": self.color,
            "background_color": self.background_color,
            "font_size": self.font_size,
            "font_weight": self.font_weight,
            "text_color": self.text_color,
            "border_color": self.border_color,
            "border_width": self.border_width,
            "opacity": self.opacity,
            "show_time": self.show_time,
            "tooltip": self.tooltip,
        }


@dataclass
class AnnotationLayer:
    """
    Manages a layer of annotations for a chart.

    This class provides functionality for grouping related annotations
    together and applying bulk operations to them. Layers can be shown,
    hidden, or have their opacity adjusted as a group.

    Attributes:
        name: Unique name identifier for this layer
        annotations: List of annotation objects in this layer
        visible: Whether this layer is currently visible
        opacity: Overall opacity of the layer (0.0 to 1.0)
    """

    name: str
    annotations: List[Annotation]
    visible: bool = True
    opacity: float = 1.0

    def __post_init__(self):
        """
        Validate annotation layer after initialization.

        Raises:
            ValueError: If layer name is empty or opacity is invalid.
        """
        if not self.name:
            raise ValueError("Layer name cannot be empty")

        if not 0 <= self.opacity <= 1:
            raise ValueError("Opacity must be between 0 and 1")

    def add_annotation(self, annotation: Annotation) -> "AnnotationLayer":
        """
        Add annotation to layer.

        Adds a single annotation to this layer and returns self for
        method chaining.

        Args:
            annotation: Annotation object to add to the layer.

        Returns:
            AnnotationLayer: Self for method chaining.

        Example:
            ```python
            layer.add_annotation(text_annotation)
            ```
        """
        self.annotations.append(annotation)
        return self

    def remove_annotation(self, index: int) -> "AnnotationLayer":
        """
        Remove annotation by index.

        Removes an annotation from the layer by its index position
        and returns self for method chaining.

        Args:
            index: Index of the annotation to remove.

        Returns:
            AnnotationLayer: Self for method chaining.

        Example:
            ```python
            layer.remove_annotation(0)  # Remove first annotation
            ```
        """
        if 0 <= index < len(self.annotations):
            self.annotations.pop(index)
        return self

    def clear_annotations(self) -> "AnnotationLayer":
        """
        Clear all annotations from layer.

        Removes all annotations from this layer and returns self
        for method chaining.

        Returns:
            AnnotationLayer: Self for method chaining.

        Example:
            ```python
            layer.clear_annotations()
            ```
        """
        self.annotations.clear()
        return self

    def hide(self) -> "AnnotationLayer":
        """
        Hide the layer.

        Makes this layer and all its annotations invisible and
        returns self for method chaining.

        Returns:
            AnnotationLayer: Self for method chaining.

        Example:
            ```python
            layer.hide()
            ```
        """
        self.visible = False
        return self

    def show(self) -> "AnnotationLayer":
        """
        Show the layer.

        Makes this layer and all its annotations visible and
        returns self for method chaining.

        Returns:
            AnnotationLayer: Self for method chaining.

        Example:
            ```python
            layer.show()
            ```
        """
        self.visible = True
        return self

    def set_opacity(self, opacity: float) -> "AnnotationLayer":
        """
        Set layer opacity.

        Sets the overall opacity of this layer and returns self
        for method chaining.

        Args:
            opacity: Opacity value between 0.0 (transparent) and 1.0 (opaque).

        Returns:
            AnnotationLayer: Self for method chaining.

        Raises:
            ValueError: If opacity is not between 0 and 1.

        Example:
            ```python
            layer.set_opacity(0.5)  # 50% opacity
            ```
        """
        if not 0 <= opacity <= 1:
            raise ValueError("Opacity must be between 0 and 1")
        self.opacity = opacity
        return self

    def filter_by_time_range(
        self,
        start_time: Union[pd.Timestamp, datetime, str, int, float],
        end_time: Union[pd.Timestamp, datetime, str, int, float],
    ) -> List[Annotation]:
        """
        Filter annotations by time range.

        Returns a list of annotations that fall within the specified
        time range.

        Args:
            start_time: Start of the time range in various formats.
            end_time: End of the time range in various formats.

        Returns:
            List[Annotation]: List of annotations within the time range.

        Example:
            ```python
            annotations = layer.filter_by_time_range(
                "2024-01-01", "2024-01-31"
            )
            ```
        """
        start_ts = to_utc_timestamp(start_time)
        end_ts = to_utc_timestamp(end_time)

        return [
            annotation
            for annotation in self.annotations
            if start_ts <= annotation.timestamp <= end_ts
        ]

    def filter_by_price_range(self, min_price: float, max_price: float) -> List[Annotation]:
        """
        Filter annotations by price range.

        Returns a list of annotations that fall within the specified
        price range.

        Args:
            min_price: Minimum price value.
            max_price: Maximum price value.

        Returns:
            List[Annotation]: List of annotations within the price range.

        Example:
            ```python
            annotations = layer.filter_by_price_range(100.0, 200.0)
            ```
        """
        return [
            annotation
            for annotation in self.annotations
            if min_price <= annotation.price <= max_price
        ]

    def asdict(self) -> Dict[str, Any]:
        """
        Convert layer to dictionary for serialization.

        Creates a dictionary representation of the layer including
        its properties and all contained annotations.

        Returns:
            Dict[str, Any]: Dictionary representation of the layer.
        """
        return {
            "name": self.name,
            "visible": self.visible,
            "opacity": self.opacity,
            "annotations": [annotation.asdict() for annotation in self.annotations],
        }


class AnnotationManager:
    """
    Manages multiple annotation layers for a chart.

    This class provides a centralized way to manage multiple annotation
    layers, allowing for organization of annotations into logical groups.
    It supports creating, removing, and manipulating layers, as well as
    bulk operations across all layers.

    The AnnotationManager supports method chaining for fluent API usage
    and provides comprehensive layer management capabilities.

    Attributes:
        layers: Dictionary mapping layer names to AnnotationLayer objects
    """

    def __init__(self):
        """
        Initialize the annotation manager.

        Creates a new AnnotationManager with an empty layers dictionary.
        """
        self.layers: Dict[str, AnnotationLayer] = {}

    def create_layer(self, name: str) -> "AnnotationManager":
        """
        Create a new annotation layer.

        Creates a new empty annotation layer with the specified name.
        If a layer with that name already exists, returns self for method chaining.

        Args:
            name: Name for the new layer.

        Returns:
            AnnotationManager: Self for method chaining.

        Example:
            ```python
            manager.create_layer("technical_analysis")
            ```
        """
        if name not in self.layers:
            layer = AnnotationLayer(name=name, annotations=[])
            self.layers[name] = layer
        return self

    def get_layer(self, name: str) -> Optional["AnnotationLayer"]:
        """
        Get an annotation layer by name.

        Args:
            name: Name of the layer to retrieve.

        Returns:
            Optional[AnnotationLayer]: The layer if found, None otherwise.

        Example:
            ```python
            layer = manager.get_layer("events")
            if layer:
                layer.add_annotation(annotation)
            ```
        """
        return self.layers.get(name)

    def remove_layer(self, name: str) -> bool:
        """
        Remove an annotation layer by name.

        Removes the specified layer and all its annotations. Returns
        True if the layer was found and removed, False otherwise.

        Args:
            name: Name of the layer to remove.

        Returns:
            bool: True if layer was removed, False if layer didn't exist.

        Example:
            ```python
            success = manager.remove_layer("old_layer")
            if success:
                logger.info("Layer removed successfully")
            ```
        """
        if name in self.layers:
            del self.layers[name]
            return True
        return False

    def clear_all_layers(self) -> "AnnotationManager":
        """
        Clear all annotation layers.

        Removes all layers and their annotations. Returns self for
        method chaining.

        Returns:
            AnnotationManager: Self for method chaining.

        Example:
            ```python
            manager.clear_all_layers()
            ```
        """
        self.layers.clear()
        return self

    def add_annotation(
        self, annotation: Annotation, layer_name: str = "default"
    ) -> "AnnotationManager":
        """
        Add annotation to a specific layer.

        Adds an annotation to the specified layer. If the layer doesn't exist,
        it will be created automatically. Returns self for method chaining.

        Args:
            annotation: Annotation object to add.
            layer_name: Name of the layer to add the annotation to.

        Returns:
            AnnotationManager: Self for method chaining.

        Example:
            ```python
            manager.add_annotation(text_annotation, "events")
            ```
        """
        if layer_name not in self.layers:
            self.create_layer(layer_name)

        self.layers[layer_name].add_annotation(annotation)
        return self

    def hide_layer(self, name: str) -> "AnnotationManager":
        """
        Hide a specific annotation layer.

        Makes the specified layer and all its annotations invisible.
        Returns self for method chaining.

        Args:
            name: Name of the layer to hide.

        Returns:
            AnnotationManager: Self for method chaining.

        Example:
            ```python
            manager.hide_layer("events")
            ```
        """
        if name in self.layers:
            self.layers[name].hide()
        return self

    def show_layer(self, name: str) -> "AnnotationManager":
        """
        Show a specific annotation layer.

        Makes the specified layer and all its annotations visible.
        Returns self for method chaining.

        Args:
            name: Name of the layer to show.

        Returns:
            AnnotationManager: Self for method chaining.

        Example:
            ```python
            manager.show_layer("events")
            ```
        """
        if name in self.layers:
            self.layers[name].show()
        return self

    def clear_layer(self, name: str) -> "AnnotationManager":
        """
        Clear all annotations from a specific layer.

        Removes all annotations from the specified layer while keeping
        the layer itself. Returns self for method chaining.

        Args:
            name: Name of the layer to clear.

        Returns:
            AnnotationManager: Self for method chaining.

        Example:
            ```python
            manager.clear_layer("events")
            ```
        """
        if name in self.layers:
            self.layers[name].clear_annotations()
        return self

    def get_all_annotations(self) -> List[Annotation]:
        """
        Get all annotations from all layers.

        Returns a flat list of all annotations from all layers,
        regardless of layer visibility.

        Returns:
            List[Annotation]: List of all annotations across all layers.

        Example:
            ```python
            all_annotations = manager.get_all_annotations()
            ```
        """
        all_annotations = []
        for layer in self.layers.values():
            all_annotations.extend(layer.annotations)
        return all_annotations

    def hide_all_layers(self) -> "AnnotationManager":
        """
        Hide all annotation layers.

        Makes all layers and their annotations invisible. Returns
        self for method chaining.

        Returns:
            AnnotationManager: Self for method chaining.

        Example:
            ```python
            manager.hide_all_layers()
            ```
        """
        for layer in self.layers.values():
            layer.hide()
        return self

    def show_all_layers(self) -> "AnnotationManager":
        """
        Show all annotation layers.

        Makes all layers and their annotations visible. Returns
        self for method chaining.

        Returns:
            AnnotationManager: Self for method chaining.

        Example:
            ```python
            manager.show_all_layers()
            ```
        """
        for layer in self.layers.values():
            layer.show()
        return self

    def asdict(self) -> Dict[str, Any]:
        """
        Convert manager to dictionary for serialization.

        Creates a dictionary representation of all layers and their
        annotations suitable for serialization.

        Returns:
            Dict[str, Any]: Dictionary representation of all layers with
                a "layers" wrapper containing layer names as keys.
        """
        return {"layers": {layer_name: layer.asdict() for layer_name, layer in self.layers.items()}}


def create_text_annotation(
    time: Union[pd.Timestamp, datetime, str, int, float],
    price: float,
    text: str,
    **kwargs,
) -> Annotation:
    """
    Create a text annotation.

    Convenience function for creating text annotations with sensible
    defaults. Additional styling options can be passed as keyword arguments.

    Args:
        time: Time for the annotation in various formats.
        price: Price level for the annotation.
        text: Text content to display.
        **kwargs: Additional styling options (color, background_color,
            font_size, position, etc.).

    Returns:
        Annotation: Configured text annotation.

    Example:
        ```python
        # Basic text annotation
        ann = create_text_annotation("2024-01-01", 100, "Important Event")

        # With custom styling
        ann = create_text_annotation(
            "2024-01-01", 100, "Buy Signal",
            color="green",
            background_color="rgba(0, 255, 0, 0.2)",
            font_size=14
        )
        ```
    """
    return Annotation(
        time=time, price=price, text=text, annotation_type=AnnotationType.TEXT, **kwargs
    )


def create_arrow_annotation(
    time: Union[pd.Timestamp, datetime, str, int, float],
    price: float,
    text: str,
    **kwargs,
) -> Annotation:
    """
    Create an arrow annotation.

    Convenience function for creating arrow annotations with sensible
    defaults. Additional styling options can be passed as keyword arguments.

    Args:
        time: Time for the annotation in various formats.
        price: Price level for the annotation.
        text: Text content to display with the arrow.
        **kwargs: Additional styling options (color, position, etc.).

    Returns:
        Annotation: Configured arrow annotation.

    Example:
        ```python
        # Basic arrow annotation
        ann = create_arrow_annotation("2024-01-01", 100, "Buy Signal")

        # With custom styling
        ann = create_arrow_annotation(
            "2024-01-01", 100, "Sell Signal",
            color="red",
            position=AnnotationPosition.BELOW
        )
        ```
    """
    return Annotation(
        time=time, price=price, text=text, annotation_type=AnnotationType.ARROW, **kwargs
    )


def create_shape_annotation(
    time: Union[pd.Timestamp, datetime, str, int, float],
    price: float,
    text: str,
    **kwargs,
) -> Annotation:
    """
    Create a shape annotation.

    Convenience function for creating shape annotations with sensible
    defaults. Additional styling options can be passed as keyword arguments.

    Args:
        time: Time for the annotation in various formats.
        price: Price level for the annotation.
        text: Text content to display with the shape.
        **kwargs: Additional styling options (color, border_color,
            border_width, etc.).

    Returns:
        Annotation: Configured shape annotation.

    Example:
        ```python
        # Basic shape annotation
        ann = create_shape_annotation("2024-01-01", 100, "Event")

        # With custom styling
        ann = create_shape_annotation(
            "2024-01-01", 100, "Important",
            color="yellow",
            border_color="orange",
            border_width=2
        )
        ```
    """
    return Annotation(
        time=time, price=price, text=text, annotation_type=AnnotationType.SHAPE, **kwargs
    )
