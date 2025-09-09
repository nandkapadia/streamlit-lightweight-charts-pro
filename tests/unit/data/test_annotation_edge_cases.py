"""
Tests for annotation module edge cases and low-coverage scenarios.

This module tests edge cases and scenarios that are not covered by the main
annotation tests to improve overall coverage of the annotation module.
"""

from datetime import datetime

import pandas as pd
import pytest

from streamlit_lightweight_charts_pro.data.annotation import (
    Annotation,
    AnnotationLayer,
    AnnotationManager,
    AnnotationPosition,
    AnnotationType,
    create_arrow_annotation,
    create_shape_annotation,
    create_text_annotation,
)
from streamlit_lightweight_charts_pro.data.data import ColumnNames


class TestAnnotationEdgeCases:
    """Test edge cases in the Annotation class."""

    def test_annotation_init_with_string_annotation_type(self):
        """Test Annotation initialization with string annotation type."""
        annotation = Annotation(
            time="2024-01-01 10:00:00", price=100.0, text="Test annotation", annotation_type="text"
        )

        assert annotation.annotation_type == AnnotationType.TEXT

    def test_annotation_init_with_string_position(self):
        """Test Annotation initialization with string position."""
        annotation = Annotation(
            time="2024-01-01 10:00:00", price=100.0, text="Test annotation", position="above"
        )

        assert annotation.position == AnnotationPosition.ABOVE

    def test_annotation_init_with_invalid_price(self):
        """Test Annotation initialization with invalid price."""
        with pytest.raises(ValueError, match="Price must be a number"):
            Annotation(time="2024-01-01 10:00:00", price="invalid", text="Test annotation")

    def test_annotation_init_with_empty_text(self):
        """Test Annotation initialization with empty text."""
        with pytest.raises(ValueError, match="Annotation text cannot be empty"):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="")

    def test_annotation_init_with_invalid_opacity(self):
        """Test Annotation initialization with invalid opacity."""
        with pytest.raises(ValueError, match="Opacity must be between 0 and 1"):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation", opacity=1.5)

    def test_annotation_init_with_invalid_font_size(self):
        """Test Annotation initialization with invalid font size."""
        with pytest.raises(ValueError, match="Font size must be positive"):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation", font_size=0)

    def test_annotation_init_with_invalid_border_width(self):
        """Test Annotation initialization with invalid border width."""
        with pytest.raises(ValueError, match="Border width must be non-negative"):
            Annotation(
                time="2024-01-01 10:00:00", price=100.0, text="Test annotation", border_width=-1
            )

    def test_annotation_timestamp_property(self):
        """Test Annotation timestamp property."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")

        # Should return UTC timestamp
        assert isinstance(annotation.timestamp, int)
        assert annotation.timestamp > 0

    def test_annotation_datetime_value_property(self):
        """Test Annotation datetime_value property."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")

        # Should return pandas Timestamp
        assert isinstance(annotation.datetime_value, pd.Timestamp)

    def test_annotation_asdict(self):
        """Test Annotation asdict method."""
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test annotation",
            color="#ff0000",
            background_color="#ffffff",
            font_size=14,
            font_weight="bold",
            text_color="#000000",
            border_color="#cccccc",
            border_width=2,
            opacity=0.8,
            show_time=True,
            tooltip="Test tooltip",
        )

        result = annotation.asdict()

        assert result[ColumnNames.TIME] == annotation.timestamp
        assert result["price"] == 100.0
        assert result["text"] == "Test annotation"
        assert result["type"] == "text"
        assert result["position"] == "above"
        assert result["color"] == "#ff0000"
        assert result["background_color"] == "#ffffff"
        assert result["font_size"] == 14
        assert result["font_weight"] == "bold"
        assert result["text_color"] == "#000000"
        assert result["border_color"] == "#cccccc"
        assert result["border_width"] == 2
        assert result["opacity"] == 0.8
        assert result["show_time"] is True
        assert result["tooltip"] == "Test tooltip"


class TestAnnotationLayerEdgeCases:
    """Test edge cases in the AnnotationLayer class."""

    def test_annotation_layer_init_with_empty_name(self):
        """Test AnnotationLayer initialization with empty name."""
        with pytest.raises(ValueError, match="Layer name cannot be empty"):
            AnnotationLayer(name="", annotations=[])

    def test_annotation_layer_init_with_invalid_opacity(self):
        """Test AnnotationLayer initialization with invalid opacity."""
        with pytest.raises(ValueError, match="Opacity must be between 0 and 1"):
            AnnotationLayer(name="test_layer", annotations=[], opacity=1.5)

    def test_annotation_layer_add_annotation(self):
        """Test AnnotationLayer add_annotation method."""
        layer = AnnotationLayer(name="test_layer", annotations=[])
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")

        result = layer.add_annotation(annotation)

        assert result is layer
        assert len(layer.annotations) == 1
        assert layer.annotations[0] == annotation

    def test_annotation_layer_remove_annotation_valid_index(self):
        """Test AnnotationLayer remove_annotation with valid index."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")
        layer = AnnotationLayer(name="test_layer", annotations=[annotation])

        result = layer.remove_annotation(0)

        assert result is layer
        assert len(layer.annotations) == 0

    def test_annotation_layer_remove_annotation_invalid_index(self):
        """Test AnnotationLayer remove_annotation with invalid index."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")
        layer = AnnotationLayer(name="test_layer", annotations=[annotation])

        # Should not raise error, just ignore
        result = layer.remove_annotation(999)

        assert result is layer
        assert len(layer.annotations) == 1  # Should remain unchanged

    def test_annotation_layer_clear_annotations(self):
        """Test AnnotationLayer clear_annotations method."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")
        layer = AnnotationLayer(name="test_layer", annotations=[annotation])

        result = layer.clear_annotations()

        assert result is layer
        assert len(layer.annotations) == 0

    def test_annotation_layer_hide(self):
        """Test AnnotationLayer hide method."""
        layer = AnnotationLayer(name="test_layer", annotations=[])

        result = layer.hide()

        assert result is layer
        assert layer.visible is False

    def test_annotation_layer_show(self):
        """Test AnnotationLayer show method."""
        layer = AnnotationLayer(name="test_layer", annotations=[], visible=False)

        result = layer.show()

        assert result is layer
        assert layer.visible is True

    def test_annotation_layer_set_opacity_valid(self):
        """Test AnnotationLayer set_opacity with valid value."""
        layer = AnnotationLayer(name="test_layer", annotations=[])

        result = layer.set_opacity(0.5)

        assert result is layer
        assert layer.opacity == 0.5

    def test_annotation_layer_set_opacity_invalid(self):
        """Test AnnotationLayer set_opacity with invalid value."""
        layer = AnnotationLayer(name="test_layer", annotations=[])

        with pytest.raises(ValueError, match="Opacity must be between 0 and 1"):
            layer.set_opacity(1.5)

    def test_annotation_layer_filter_by_time_range(self):
        """Test AnnotationLayer filter_by_time_range method."""
        annotation1 = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Annotation 1")
        annotation2 = Annotation(time="2024-01-15 10:00:00", price=110.0, text="Annotation 2")
        annotation3 = Annotation(time="2024-02-01 10:00:00", price=120.0, text="Annotation 3")

        layer = AnnotationLayer(
            name="test_layer", annotations=[annotation1, annotation2, annotation3]
        )

        # Filter annotations in January
        result = layer.filter_by_time_range("2024-01-01", "2024-01-31")

        assert len(result) == 2
        assert annotation1 in result
        assert annotation2 in result
        assert annotation3 not in result

    def test_annotation_layer_filter_by_price_range(self):
        """Test AnnotationLayer filter_by_price_range method."""
        annotation1 = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Annotation 1")
        annotation2 = Annotation(time="2024-01-01 11:00:00", price=110.0, text="Annotation 2")
        annotation3 = Annotation(time="2024-01-01 12:00:00", price=120.0, text="Annotation 3")

        layer = AnnotationLayer(
            name="test_layer", annotations=[annotation1, annotation2, annotation3]
        )

        # Filter annotations between 105 and 115
        result = layer.filter_by_price_range(105.0, 115.0)

        assert len(result) == 1
        assert annotation2 in result
        assert annotation1 not in result
        assert annotation3 not in result

    def test_annotation_layer_asdict(self):
        """Test AnnotationLayer asdict method."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")
        layer = AnnotationLayer(
            name="test_layer", annotations=[annotation], visible=True, opacity=0.8
        )

        result = layer.asdict()

        assert result["name"] == "test_layer"
        assert result["visible"] is True
        assert result["opacity"] == 0.8
        assert len(result["annotations"]) == 1
        assert result["annotations"][0]["text"] == "Test annotation"


class TestAnnotationManagerEdgeCases:
    """Test edge cases in the AnnotationManager class."""

    def test_annotation_manager_create_layer(self):
        """Test AnnotationManager create_layer method."""
        manager = AnnotationManager()

        result = manager.create_layer("test_layer")

        assert result is manager
        assert "test_layer" in manager.layers
        assert isinstance(manager.layers["test_layer"], AnnotationLayer)

    def test_annotation_manager_create_layer_duplicate(self):
        """Test AnnotationManager create_layer with duplicate name."""
        manager = AnnotationManager()
        manager.create_layer("test_layer")

        # Should not raise error, just return existing layer
        result = manager.create_layer("test_layer")

        assert result is manager
        assert len(manager.layers) == 1  # Should not create duplicate

    def test_annotation_manager_get_layer_existing(self):
        """Test AnnotationManager get_layer with existing layer."""
        manager = AnnotationManager()
        manager.create_layer("test_layer")

        result = manager.get_layer("test_layer")

        assert result is not None
        assert result.name == "test_layer"

    def test_annotation_manager_get_layer_nonexistent(self):
        """Test AnnotationManager get_layer with nonexistent layer."""
        manager = AnnotationManager()

        result = manager.get_layer("nonexistent")

        assert result is None

    def test_annotation_manager_remove_layer_existing(self):
        """Test AnnotationManager remove_layer with existing layer."""
        manager = AnnotationManager()
        manager.create_layer("test_layer")

        result = manager.remove_layer("test_layer")

        assert result is True
        assert "test_layer" not in manager.layers

    def test_annotation_manager_remove_layer_nonexistent(self):
        """Test AnnotationManager remove_layer with nonexistent layer."""
        manager = AnnotationManager()

        result = manager.remove_layer("nonexistent")

        assert result is False

    def test_annotation_manager_clear_all_layers(self):
        """Test AnnotationManager clear_all_layers method."""
        manager = AnnotationManager()
        manager.create_layer("layer1")
        manager.create_layer("layer2")

        result = manager.clear_all_layers()

        assert result is manager
        assert len(manager.layers) == 0

    def test_annotation_manager_add_annotation_to_existing_layer(self):
        """Test AnnotationManager add_annotation to existing layer."""
        manager = AnnotationManager()
        manager.create_layer("test_layer")
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")

        result = manager.add_annotation(annotation, "test_layer")

        assert result is manager
        layer = manager.get_layer("test_layer")
        assert len(layer.annotations) == 1
        assert layer.annotations[0] == annotation

    def test_annotation_manager_add_annotation_to_nonexistent_layer(self):
        """Test AnnotationManager add_annotation to nonexistent layer."""
        manager = AnnotationManager()
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")

        result = manager.add_annotation(annotation, "nonexistent")

        assert result is manager
        # Should create the nonexistent layer
        nonexistent_layer = manager.get_layer("nonexistent")
        assert len(nonexistent_layer.annotations) == 1
        assert nonexistent_layer.annotations[0] == annotation

    def test_annotation_manager_hide_layer_existing(self):
        """Test AnnotationManager hide_layer with existing layer."""
        manager = AnnotationManager()
        manager.create_layer("test_layer")

        result = manager.hide_layer("test_layer")

        assert result is manager
        layer = manager.get_layer("test_layer")
        assert layer.visible is False

    def test_annotation_manager_hide_layer_nonexistent(self):
        """Test AnnotationManager hide_layer with nonexistent layer."""
        manager = AnnotationManager()

        result = manager.hide_layer("nonexistent")

        assert result is manager  # Should not raise error

    def test_annotation_manager_show_layer_existing(self):
        """Test AnnotationManager show_layer with existing layer."""
        manager = AnnotationManager()
        manager.create_layer("test_layer")
        manager.hide_layer("test_layer")

        result = manager.show_layer("test_layer")

        assert result is manager
        layer = manager.get_layer("test_layer")
        assert layer.visible is True

    def test_annotation_manager_show_layer_nonexistent(self):
        """Test AnnotationManager show_layer with nonexistent layer."""
        manager = AnnotationManager()

        result = manager.show_layer("nonexistent")

        assert result is manager  # Should not raise error

    def test_annotation_manager_clear_layer_existing(self):
        """Test AnnotationManager clear_layer with existing layer."""
        manager = AnnotationManager()
        manager.create_layer("test_layer")
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")
        manager.add_annotation(annotation, "test_layer")

        result = manager.clear_layer("test_layer")

        assert result is manager
        layer = manager.get_layer("test_layer")
        assert len(layer.annotations) == 0

    def test_annotation_manager_clear_layer_nonexistent(self):
        """Test AnnotationManager clear_layer with nonexistent layer."""
        manager = AnnotationManager()

        result = manager.clear_layer("nonexistent")

        assert result is manager  # Should not raise error

    def test_annotation_manager_get_all_annotations(self):
        """Test AnnotationManager get_all_annotations method."""
        manager = AnnotationManager()
        layer1 = manager.create_layer("layer1")
        layer2 = manager.create_layer("layer2")

        annotation1 = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Annotation 1")
        annotation2 = Annotation(time="2024-01-01 11:00:00", price=110.0, text="Annotation 2")

        layer1.add_annotation(annotation1)
        layer2.add_annotation(annotation2)

        result = manager.get_all_annotations()

        assert len(result) == 2
        assert annotation1 in result
        assert annotation2 in result

    def test_annotation_manager_hide_all_layers(self):
        """Test AnnotationManager hide_all_layers method."""
        manager = AnnotationManager()
        manager.create_layer("layer1")
        manager.create_layer("layer2")

        result = manager.hide_all_layers()

        assert result is manager
        layer1 = manager.get_layer("layer1")
        layer2 = manager.get_layer("layer2")
        assert layer1.visible is False
        assert layer2.visible is False

    def test_annotation_manager_show_all_layers(self):
        """Test AnnotationManager show_all_layers method."""
        manager = AnnotationManager()
        manager.create_layer("layer1")
        manager.create_layer("layer2")
        manager.hide_all_layers()

        result = manager.show_all_layers()

        assert result is manager
        layer1 = manager.get_layer("layer1")
        layer2 = manager.get_layer("layer2")
        assert layer1.visible is True
        assert layer2.visible is True

    def test_annotation_manager_asdict(self):
        """Test AnnotationManager asdict method."""
        manager = AnnotationManager()
        manager.create_layer("test_layer")
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")
        manager.add_annotation(annotation, "test_layer")

        result = manager.asdict()

        assert "layers" in result
        assert "test_layer" in result["layers"]
        assert result["layers"]["test_layer"]["name"] == "test_layer"
        assert len(result["layers"]["test_layer"]["annotations"]) == 1
        assert result["layers"]["test_layer"]["annotations"][0]["text"] == "Test annotation"


class TestAnnotationFactoryFunctions:
    """Test annotation factory functions."""

    def test_create_text_annotation(self):
        """Test create_text_annotation function."""
        annotation = create_text_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test text annotation",
            color="#ff0000",
            background_color="#ffffff",
        )

        assert isinstance(annotation, Annotation)
        assert annotation.annotation_type == AnnotationType.TEXT
        assert annotation.text == "Test text annotation"
        assert annotation.color == "#ff0000"
        assert annotation.background_color == "#ffffff"

    def test_create_arrow_annotation(self):
        """Test create_arrow_annotation function."""
        annotation = create_arrow_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test arrow annotation",
            color="#00ff00",
            position="below",
        )

        assert isinstance(annotation, Annotation)
        assert annotation.annotation_type == AnnotationType.ARROW
        assert annotation.text == "Test arrow annotation"
        assert annotation.color == "#00ff00"
        assert annotation.position == AnnotationPosition.BELOW

    def test_create_shape_annotation(self):
        """Test create_shape_annotation function."""
        annotation = create_shape_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test shape annotation",
            color="#0000ff",
            border_color="#cccccc",
            border_width=3,
        )

        assert isinstance(annotation, Annotation)
        assert annotation.annotation_type == AnnotationType.SHAPE
        assert annotation.text == "Test shape annotation"
        assert annotation.color == "#0000ff"
        assert annotation.border_color == "#cccccc"
        assert annotation.border_width == 3


class TestAnnotationIntegration:
    """Test integration scenarios for annotations."""

    def test_annotation_with_various_time_formats(self):
        """Test Annotation with various time formats."""
        time_formats = [
            "2024-01-01 10:00:00",
            "2024-01-01T10:00:00",
            datetime(2024, 1, 1, 10, 0, 0),
            pd.Timestamp("2024-01-01 10:00:00"),
            1704110400,  # Unix timestamp
            1704110400.0,  # Unix timestamp as float
        ]

        for time_format in time_formats:
            annotation = Annotation(time=time_format, price=100.0, text="Test annotation")

            assert isinstance(annotation.timestamp, (int, str))
            assert isinstance(annotation.datetime_value, pd.Timestamp)

    def test_annotation_layer_method_chaining(self):
        """Test AnnotationLayer method chaining."""
        layer = AnnotationLayer(name="test_layer", annotations=[])
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test annotation")

        result = layer.add_annotation(annotation).set_opacity(0.8).hide().show()

        assert result is layer
        assert len(layer.annotations) == 1
        assert layer.opacity == 0.8
        assert layer.visible is True

    def test_annotation_manager_complex_scenario(self):
        """Test AnnotationManager with complex scenario."""
        manager = AnnotationManager()

        # Create multiple layers
        manager.create_layer("events")
        manager.create_layer("signals")

        # Add annotations to different layers
        event_annotation = Annotation(
            time="2024-01-01 10:00:00", price=100.0, text="Earnings announcement"
        )
        signal_annotation = Annotation(time="2024-01-01 11:00:00", price=110.0, text="Buy signal")

        manager.add_annotation(event_annotation, "events")
        manager.add_annotation(signal_annotation, "signals")

        # Test filtering
        layer1 = manager.get_layer("events")
        events = layer1.filter_by_time_range("2024-01-01", "2024-01-01 10:30:00")
        assert len(events) == 1
        assert events[0] == event_annotation

        # Test hiding/showing layers
        manager.hide_layer("events")
        layer1 = manager.get_layer("events")
        layer2 = manager.get_layer("signals")
        assert layer1.visible is False
        assert layer2.visible is True

        # Test getting all annotations
        all_annotations = manager.get_all_annotations()
        assert len(all_annotations) == 2

        # Test serialization
        result = manager.asdict()
        assert "layers" in result
        assert "events" in result["layers"]
        assert "signals" in result["layers"]
        assert len(result["layers"]["events"]["annotations"]) == 1
        assert len(result["layers"]["signals"]["annotations"]) == 1
