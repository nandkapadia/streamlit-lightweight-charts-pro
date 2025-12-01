"""
Chart annotation tests - Annotation and layer management.

This module tests annotation functionality including adding annotations,
managing layers, and clearing annotations.
"""

# Standard Imports
from unittest.mock import Mock

# Third Party Imports
import pytest
from lightweight_charts_core.data.annotation import Annotation

# Local Imports
from streamlit_lightweight_charts_pro.charts.chart import Chart
from streamlit_lightweight_charts_pro.exceptions import (
    AnnotationItemsTypeError,
    TypeValidationError,
    ValueValidationError,
)


class TestAnnotationManagement:
    """Test annotation management operations."""

    def test_add_annotation(self):
        """Test adding a single annotation."""
        chart = Chart()
        annotation = Mock(spec=Annotation)

        result = chart.add_annotation(annotation)

        assert result is chart  # Method chaining
        # Verify annotation was added to the manager
        assert len(chart.annotation_manager.layers) > 0

    def test_add_annotation_with_custom_layer(self):
        """Test adding annotation with custom layer name."""
        chart = Chart()
        annotation = Mock(spec=Annotation)

        result = chart.add_annotation(annotation, layer_name="custom_layer")

        assert result is chart  # Method chaining
        # Verify custom layer was created
        assert "custom_layer" in chart.annotation_manager.layers

    def test_add_annotations(self):
        """Test adding multiple annotations."""
        chart = Chart()
        annotation1 = Mock(spec=Annotation)
        annotation2 = Mock(spec=Annotation)

        result = chart.add_annotations([annotation1, annotation2])

        assert result is chart  # Method chaining
        # Verify annotations were added
        assert len(chart.annotation_manager.layers) > 0

    def test_add_annotation_with_none(self):
        """Test adding None as annotation."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.add_annotation(None)

    def test_add_annotation_with_invalid_type(self):
        """Test adding invalid type as annotation."""
        chart = Chart()
        with pytest.raises(TypeValidationError):
            chart.add_annotation("not_an_annotation")

    def test_add_annotations_with_empty_list(self):
        """Test adding empty annotations list."""
        chart = Chart()
        chart.add_annotations([])
        assert len(chart.annotation_manager.layers) == 0

    def test_add_annotations_with_mixed_valid_invalid(self):
        """Test adding mix of valid and invalid annotations."""
        chart = Chart()
        valid_annotation = Mock(spec=Annotation)

        with pytest.raises(AnnotationItemsTypeError):
            chart.add_annotations([valid_annotation, "invalid_annotation"])


class TestAnnotationLayers:
    """Test annotation layer management."""

    def test_create_annotation_layer(self):
        """Test creating a new annotation layer."""
        chart = Chart()

        result = chart.create_annotation_layer("analysis")

        assert result is chart  # Method chaining
        assert "analysis" in chart.annotation_manager.layers

    def test_hide_annotation_layer(self):
        """Test hiding an annotation layer."""
        chart = Chart()
        chart.create_annotation_layer("analysis")

        result = chart.hide_annotation_layer("analysis")

        assert result is chart  # Method chaining
        layer = chart.annotation_manager.get_layer("analysis")
        assert layer is not None

    def test_show_annotation_layer(self):
        """Test showing an annotation layer."""
        chart = Chart()
        chart.create_annotation_layer("analysis")

        result = chart.show_annotation_layer("analysis")

        assert result is chart  # Method chaining
        layer = chart.annotation_manager.get_layer("analysis")
        assert layer is not None

    def test_clear_annotations_specific_layer(self):
        """Test clearing annotations from a specific layer."""
        chart = Chart()
        chart.create_annotation_layer("analysis")
        annotation = Mock(spec=Annotation)
        chart.add_annotation(annotation, "analysis")

        result = chart.clear_annotations("analysis")

        assert result is chart  # Method chaining
        layer = chart.annotation_manager.get_layer("analysis")
        assert layer is not None

    def test_clear_all_annotations(self):
        """Test clearing all annotations."""
        chart = Chart()
        chart.create_annotation_layer("layer1")
        chart.create_annotation_layer("layer2")
        annotation = Mock(spec=Annotation)
        chart.add_annotation(annotation, "layer1")
        chart.add_annotation(annotation, "layer2")

        result = chart.clear_annotations()

        assert result is chart  # Method chaining

    def test_create_annotation_layer_with_empty_name(self):
        """Test creating annotation layer with empty name."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.create_annotation_layer("")

    def test_hide_annotation_layer_with_empty_name(self):
        """Test hiding annotation layer with empty name."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.hide_annotation_layer("")

    def test_show_annotation_layer_with_empty_name(self):
        """Test showing annotation layer with empty name."""
        chart = Chart()
        with pytest.raises(ValueValidationError):
            chart.show_annotation_layer("")


class TestAnnotationConstruction:
    """Test annotation-related construction scenarios."""

    def test_construction_with_annotations(self):
        """Test Chart construction with annotations."""
        annotation = Mock(spec=Annotation)

        chart = Chart(annotations=[annotation])

        # Verify annotation was added to the manager
        assert len(chart.annotation_manager.layers) > 0

    def test_construction_with_empty_annotations_list(self):
        """Test Chart construction with empty annotations list."""
        chart = Chart(annotations=[])
        assert len(chart.annotation_manager.layers) == 0

    def test_construction_with_none_annotations(self):
        """Test Chart construction with None annotations."""
        chart = Chart(annotations=None)
        assert len(chart.annotation_manager.layers) == 0

    def test_construction_with_invalid_annotation_type(self):
        """Test Chart construction with invalid annotation type."""
        with pytest.raises(AnnotationItemsTypeError):
            Chart(annotations=["not_an_annotation", 123])


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
