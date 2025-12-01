"""Annotation system for lightweight-charts.

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
    from lightweight_charts_core.data.annotation import (
        create_text_annotation,
        create_arrow_annotation,
        AnnotationManager,
    )

    # Create annotations
    text_ann = create_text_annotation("2024-01-01", 100, "Important Event")
    arrow_ann = create_arrow_annotation("2024-01-02", 105, "Buy Signal")

    # Use with annotation manager
    manager = (
        AnnotationManager()
        .create_layer("events")
        .add_annotation(text_ann, "events")
        .add_annotation(arrow_ann, "events")
    )
    ```

"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional

import pandas as pd
from lightweight_charts_core.exceptions import (
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions import ColumnNames
from lightweight_charts_core.type_definitions.enums import (
    AnnotationPosition,
    AnnotationType,
)
from lightweight_charts_core.utils.data_utils import from_utc_timestamp, to_utc_timestamp

# Use a null logger by default - can be configured by the consuming package
logger = logging.getLogger(__name__)


class Annotation:
    """Represents a chart annotation.

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

    time: pd.Timestamp | datetime | str | int | float
    price: float
    text: str
    annotation_type: AnnotationType = AnnotationType.TEXT
    position: AnnotationPosition = AnnotationPosition.ABOVE
    color: str = "#2196F3"
    background_color: str = "rgba(255, 255, 255, 0.9)"
    font_size: int = 12
    font_weight: str = "normal"
    text_color: str = "#000000"
    border_color: str = "#CCCCCC"
    border_width: int = 1
    opacity: float = 1.0
    show_time: bool = False
    tooltip: str | None = None

    def __init__(
        self,
        time: pd.Timestamp | datetime | str | int | float,
        price: float,
        text: str,
        annotation_type: str | AnnotationType = AnnotationType.TEXT,
        position: str | AnnotationPosition = AnnotationPosition.ABOVE,
        color: str = "#2196F3",
        background_color: str = "rgba(255, 255, 255, 0.9)",
        font_size: int = 12,
        font_weight: str = "normal",
        text_color: str = "#000000",
        border_color: str = "#CCCCCC",
        border_width: int = 1,
        opacity: float = 1.0,
        show_time: bool = False,
        tooltip: str | None = None,
    ):
        # Store time as-is, convert to UTC timestamp in asdict() for consistency
        self.time = time

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
            raise TypeValidationError("price", "a number")
        self.price = price

        # Validate text content
        if not text:
            raise ValueValidationError.required_field("text")
        self.text = text

        # Validate opacity range
        if opacity < 0 or opacity > 1:
            raise ValueValidationError("opacity", f"must be between 0 and 1, got {opacity}")
        self.opacity = opacity

        # Validate font size
        if font_size <= 0:
            raise ValueValidationError.positive_value("font_size", font_size)
        self.font_size = font_size

        # Validate border width
        if border_width < 0:
            raise ValueValidationError("border_width", f"must be non-negative, got {border_width}")
        self.border_width = border_width

        self.color = color
        self.background_color = background_color
        self.font_weight = font_weight
        self.text_color = text_color
        self.border_color = border_color
        self.show_time = show_time
        self.tooltip = tooltip

    @property
    def timestamp(self) -> int:
        """Get time as UTC timestamp (converted fresh).

        Returns:
            int: UTC timestamp as integer (seconds).

        """
        return to_utc_timestamp(self.time)

    @property
    def datetime_value(self) -> pd.Timestamp:
        """Get time as pandas Timestamp.

        Returns:
            pd.Timestamp: Pandas Timestamp object representing the
                annotation time.

        """
        return pd.Timestamp(from_utc_timestamp(to_utc_timestamp(self.time)))

    def asdict(self) -> dict[str, Any]:
        """Convert annotation to dictionary for serialization.

        Returns:
            Dict[str, Any]: Dictionary containing all annotation properties
                in a format suitable for the frontend component.

        """
        return {
            ColumnNames.TIME: to_utc_timestamp(self.time),
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
    """Manages a layer of annotations for a chart.

    Attributes:
        name: Unique name identifier for this layer
        annotations: List of annotation objects in this layer
        visible: Whether this layer is currently visible
        opacity: Overall opacity of the layer (0.0 to 1.0)

    """

    name: str
    annotations: list[Annotation]
    visible: bool = True
    opacity: float = 1.0

    def __post_init__(self):
        """Validate annotation layer after initialization."""
        if not self.name:
            raise ValueValidationError.required_field("layer name")

        if not 0 <= self.opacity <= 1:
            raise ValueValidationError(
                "opacity",
                f"must be between 0.0 and 1.0, got {self.opacity}",
            )

    def add_annotation(self, annotation: Annotation) -> "AnnotationLayer":
        """Add annotation to layer."""
        self.annotations.append(annotation)
        return self

    def remove_annotation(self, index: int) -> "AnnotationLayer":
        """Remove annotation by index."""
        if 0 <= index < len(self.annotations):
            self.annotations.pop(index)
        return self

    def clear_annotations(self) -> "AnnotationLayer":
        """Clear all annotations from layer."""
        self.annotations.clear()
        return self

    def hide(self) -> "AnnotationLayer":
        """Hide the layer."""
        self.visible = False
        return self

    def show(self) -> "AnnotationLayer":
        """Show the layer."""
        self.visible = True
        return self

    def set_opacity(self, opacity: float) -> "AnnotationLayer":
        """Set layer opacity."""
        if not 0 <= opacity <= 1:
            raise ValueValidationError("opacity", f"must be between 0 and 1, got {opacity}")
        self.opacity = opacity
        return self

    def filter_by_time_range(
        self,
        start_time: pd.Timestamp | datetime | str | int | float,
        end_time: pd.Timestamp | datetime | str | int | float,
    ) -> list[Annotation]:
        """Filter annotations by time range."""
        start_ts = to_utc_timestamp(start_time)
        end_ts = to_utc_timestamp(end_time)

        return [
            annotation
            for annotation in self.annotations
            if start_ts <= annotation.timestamp <= end_ts
        ]

    def filter_by_price_range(self, min_price: float, max_price: float) -> list[Annotation]:
        """Filter annotations by price range."""
        return [
            annotation
            for annotation in self.annotations
            if min_price <= annotation.price <= max_price
        ]

    def asdict(self) -> dict[str, Any]:
        """Convert layer to dictionary for serialization."""
        return {
            "name": self.name,
            "visible": self.visible,
            "opacity": self.opacity,
            "annotations": [annotation.asdict() for annotation in self.annotations],
        }


class AnnotationManager:
    """Manages multiple annotation layers for a chart.

    The AnnotationManager supports method chaining for fluent API usage
    and provides comprehensive layer management capabilities.
    """

    def __init__(self) -> None:
        """Initialize the annotation manager."""
        self.layers: dict[str, AnnotationLayer] = {}

    def create_layer(self, name: str) -> "AnnotationManager":
        """Create a new annotation layer."""
        if name not in self.layers:
            layer = AnnotationLayer(name=name, annotations=[])
            self.layers[name] = layer
        return self

    def get_layer(self, name: str) -> Optional["AnnotationLayer"]:
        """Get an annotation layer by name."""
        return self.layers.get(name)

    def remove_layer(self, name: str) -> bool:
        """Remove an annotation layer by name."""
        if name in self.layers:
            del self.layers[name]
            return True
        return False

    def clear_all_layers(self) -> "AnnotationManager":
        """Clear all annotation layers."""
        self.layers.clear()
        return self

    def add_annotation(
        self,
        annotation: Annotation,
        layer_name: str = "default",
    ) -> "AnnotationManager":
        """Add annotation to a specific layer."""
        if layer_name not in self.layers:
            self.create_layer(layer_name)

        self.layers[layer_name].add_annotation(annotation)
        return self

    def hide_layer(self, name: str) -> "AnnotationManager":
        """Hide a specific annotation layer."""
        if name in self.layers:
            self.layers[name].hide()
        return self

    def show_layer(self, name: str) -> "AnnotationManager":
        """Show a specific annotation layer."""
        if name in self.layers:
            self.layers[name].show()
        return self

    def clear_layer(self, name: str) -> "AnnotationManager":
        """Clear all annotations from a specific layer."""
        if name in self.layers:
            self.layers[name].clear_annotations()
        return self

    def get_all_annotations(self) -> list[Annotation]:
        """Get all annotations from all layers."""
        all_annotations = []
        for layer in self.layers.values():
            all_annotations.extend(layer.annotations)
        return all_annotations

    def hide_all_layers(self) -> "AnnotationManager":
        """Hide all annotation layers."""
        for layer in self.layers.values():
            layer.hide()
        return self

    def show_all_layers(self) -> "AnnotationManager":
        """Show all annotation layers."""
        for layer in self.layers.values():
            layer.show()
        return self

    def asdict(self) -> dict[str, Any]:
        """Convert manager to dictionary for serialization."""
        return {"layers": {layer_name: layer.asdict() for layer_name, layer in self.layers.items()}}


def create_text_annotation(
    time: pd.Timestamp | datetime | str | int | float,
    price: float,
    text: str,
    **kwargs,
) -> Annotation:
    """Create a text annotation."""
    return Annotation(
        time=time,
        price=price,
        text=text,
        annotation_type=AnnotationType.TEXT,
        **kwargs,
    )


def create_arrow_annotation(
    time: pd.Timestamp | datetime | str | int | float,
    price: float,
    text: str,
    **kwargs,
) -> Annotation:
    """Create an arrow annotation."""
    return Annotation(
        time=time,
        price=price,
        text=text,
        annotation_type=AnnotationType.ARROW,
        **kwargs,
    )


def create_shape_annotation(
    time: pd.Timestamp | datetime | str | int | float,
    price: float,
    text: str,
    **kwargs,
) -> Annotation:
    """Create a shape annotation."""
    return Annotation(
        time=time,
        price=price,
        text=text,
        annotation_type=AnnotationType.SHAPE,
        **kwargs,
    )
