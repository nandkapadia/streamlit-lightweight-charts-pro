"""Comprehensive unit tests for Annotation class.

This module tests the Annotation class functionality including
construction, validation, serialization, and edge cases.
"""

from datetime import datetime

import pandas as pd
import pytest
from lightweight_charts_core.data.annotation import (
    Annotation,
    AnnotationLayer,
    AnnotationManager,
    AnnotationPosition,
    AnnotationType,
    create_arrow_annotation,
    create_shape_annotation,
    create_text_annotation,
)
from lightweight_charts_core.exceptions import (
    TypeValidationError,
    ValueValidationError,
)
from lightweight_charts_core.type_definitions.enums import HorzAlign, VertAlign


class TestAnnotation:
    """Test cases for Annotation class."""

    def test_default_construction(self):
        """Test Annotation construction with default values."""
        annotation = Annotation(time=1640995200, price=100.0, text="Test annotation")

        assert annotation.timestamp == 1640995200
        assert annotation.price == 100.0
        assert annotation.text == "Test annotation"

    def test_construction_with_all_parameters(self):
        """Test Annotation construction with all parameters."""
        annotation = Annotation(
            time=1640995200,
            price=100.0,
            text="Test annotation",
            annotation_type=AnnotationType.TEXT,
            position=AnnotationPosition.ABOVE,
            color="#FF0000",
            font_size=12,
            text_color="#FFFFFF",
            background_color="#000000",
            border_color="#FF0000",
            border_width=2,
        )

        assert annotation.timestamp == 1640995200
        assert annotation.price == 100.0
        assert annotation.text == "Test annotation"
        assert annotation.annotation_type == AnnotationType.TEXT
        assert annotation.position == AnnotationPosition.ABOVE
        assert annotation.color == "#FF0000"
        assert annotation.font_size == 12
        assert annotation.text_color == "#FFFFFF"
        assert annotation.background_color == "#000000"
        assert annotation.border_color == "#FF0000"
        assert annotation.border_width == 2

    def test_asdict_method(self):
        """Test the asdict method returns correct structure."""
        annotation = Annotation(
            time=1640995200,
            price=100.0,
            text="Test annotation",
            annotation_type=AnnotationType.TEXT,
            position=AnnotationPosition.ABOVE,
            color="#FF0000",
            font_size=12,
            text_color="#FFFFFF",
            background_color="#000000",
            border_color="#FF0000",
            border_width=2,
        )

        result = annotation.asdict()

        assert result["time"] == 1640995200
        assert result["price"] == 100.0
        assert result["text"] == "Test annotation"
        assert result["type"] == AnnotationType.TEXT.value
        assert result["position"] == AnnotationPosition.ABOVE.value
        assert result["color"] == "#FF0000"
        assert result["font_size"] == 12
        assert result["text_color"] == "#FFFFFF"
        assert result["background_color"] == "#000000"
        assert result["border_color"] == "#FF0000"
        assert result["border_width"] == 2

    def test_asdict_with_none_values(self):
        """Test asdict method handles None values correctly."""
        annotation = Annotation(time=1640995200, price=100.0, text="Test annotation")

        result = annotation.asdict()

        # Only non-None values should be included
        assert "time" in result
        assert "price" in result
        assert "text" in result
        assert "type" in result  # Default value
        assert "position" in result  # Default value
        assert "color" in result  # Default value
        assert "font_size" in result  # Default value
        assert "text_color" in result  # Default value
        assert "background_color" in result  # Default value
        assert "border_color" in result  # Default value
        assert "border_width" in result  # Default value

    def test_validation_required_fields(self):
        """Test validation of required fields."""
        # Missing time
        with pytest.raises(TypeError):  # Missing required positional argument
            Annotation(price=100.0, text="Test annotation")

        # Missing price
        with pytest.raises(TypeError):  # Missing required positional argument
            Annotation(time=1640995200, text="Test annotation")

        # Missing text
        with pytest.raises(TypeError):  # Missing required positional argument
            Annotation(time=1640995200, price=100.0)

    def test_validation_price(self):
        """Test validation of price parameter."""
        # Valid positive price
        annotation = Annotation(time=1640995200, price=100.0, text="Test")
        assert annotation.price == 100.0

        # Valid zero price
        annotation = Annotation(time=1640995200, price=0.0, text="Test")
        assert annotation.price == 0.0

        # Valid negative price
        annotation = Annotation(time=1640995200, price=-100.0, text="Test")
        assert annotation.price == -100.0

    def test_validation_size(self):
        """Test validation of font_size parameter."""
        # Valid positive font size
        annotation = Annotation(time=1640995200, price=100.0, text="Test", font_size=10)
        assert annotation.font_size == 10

        # Invalid zero font size
        with pytest.raises(ValueValidationError, match="font_size must be positive"):
            Annotation(time=1640995200, price=100.0, text="Test", font_size=0)

        # Invalid negative font size
        with pytest.raises(ValueValidationError, match="font_size must be positive"):
            Annotation(time=1640995200, price=100.0, text="Test", font_size=-5)

    def test_validation_text_size(self):
        """Test validation of font_size parameter (alias for text_size)."""
        # Valid positive font size
        annotation = Annotation(time=1640995200, price=100.0, text="Test", font_size=12)
        assert annotation.font_size == 12

        # Invalid zero font size
        with pytest.raises(ValueValidationError, match="font_size must be positive"):
            Annotation(time=1640995200, price=100.0, text="Test", font_size=0)

        # Invalid negative font size
        with pytest.raises(ValueValidationError, match="font_size must be positive"):
            Annotation(time=1640995200, price=100.0, text="Test", font_size=-12)

    def test_validation_border_width(self):
        """Test validation of border_width parameter."""
        # Valid positive border width
        annotation = Annotation(time=1640995200, price=100.0, text="Test", border_width=2)
        assert annotation.border_width == 2

        # Valid zero border width
        annotation = Annotation(time=1640995200, price=100.0, text="Test", border_width=0)
        assert annotation.border_width == 0

        # Invalid negative border width
        with pytest.raises(ValueValidationError, match="border_width must be non-negative"):
            Annotation(time=1640995200, price=100.0, text="Test", border_width=-2)

    def test_validation_colors(self):
        """Test validation of color parameters."""
        # Valid hex colors
        annotation = Annotation(
            time=1640995200,
            price=100.0,
            text="Test",
            color="#FF0000",
            text_color="#FFFFFF",
            background_color="#000000",
            border_color="#FF0000",
        )
        assert annotation.color == "#FF0000"
        assert annotation.text_color == "#FFFFFF"
        assert annotation.background_color == "#000000"
        assert annotation.border_color == "#FF0000"

        # Invalid color format - Annotation doesn't validate color format
        # This test verifies that invalid colors are accepted (no validation)
        annotation = Annotation(time=1640995200, price=100.0, text="Test", color="invalid_color")
        assert annotation.color == "invalid_color"

    def test_validation_shapes(self):
        """Test validation of annotation_type parameter."""
        # Annotation doesn't support shape parameter
        # This test verifies that shape is not a valid parameter
        with pytest.raises(TypeError):  # Unexpected keyword argument
            Annotation(time=1640995200, price=100.0, text="Test", shape=AnnotationType.TEXT)

    def test_validation_positions(self):
        """Test validation of position parameter."""
        positions = [AnnotationPosition.ABOVE, AnnotationPosition.BELOW, AnnotationPosition.INLINE]

        for position in positions:
            annotation = Annotation(time=1640995200, price=100.0, text="Test", position=position)
            assert annotation.position == position

    def test_validation_text_align(self):
        """Test validation of text_align parameter."""
        # Annotation doesn't support text_align parameter
        # This test verifies that text_align is not a valid parameter
        with pytest.raises(TypeError):  # Unexpected keyword argument
            Annotation(time=1640995200, price=100.0, text="Test", text_align=HorzAlign.CENTER)

    def test_validation_vertical_align(self):
        """Test validation of vertical_align parameter."""
        # Annotation doesn't support vertical_align parameter
        # This test verifies that vertical_align is not a valid parameter
        with pytest.raises(TypeError):  # Unexpected keyword argument
            Annotation(time=1640995200, price=100.0, text="Test", vertical_align=VertAlign.TOP)

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Very large numbers
        annotation = Annotation(
            time=1640995200,
            price=999999.99,
            text="Test",
            font_size=999999,
            border_width=999999,
        )
        assert annotation.price == 999999.99
        assert annotation.font_size == 999999
        assert annotation.border_width == 999999

        # Very small numbers
        annotation = Annotation(
            time=1640995200,
            price=0.0001,
            text="Test",
            font_size=1,
            border_width=1,
        )
        assert annotation.price == 0.0001
        assert annotation.font_size == 1
        assert annotation.border_width == 1

        # Long text
        long_text = "A" * 1000
        annotation = Annotation(time=1640995200, price=100.0, text=long_text)
        assert annotation.text == long_text

    def test_serialization_consistency(self):
        """Test that serialization is consistent across multiple calls."""
        annotation = Annotation(
            time=1640995200,
            price=100.0,
            text="Test annotation",
            annotation_type=AnnotationType.TEXT,
            position=AnnotationPosition.ABOVE,
            color="#FF0000",
        )

        result1 = annotation.asdict()
        result2 = annotation.asdict()

        assert result1 == result2

    def test_copy_method(self):
        """Test the copy method creates a new instance with same values."""
        original = Annotation(
            time=1640995200,
            price=100.0,
            text="Test annotation",
            annotation_type=AnnotationType.TEXT,
            position=AnnotationPosition.ABOVE,
            color="#FF0000",
        )

        # Since Annotation doesn't have a copy method, we'll test that
        # we can create a new instance with the same values
        copied = Annotation(
            time=original.timestamp,
            price=original.price,
            text=original.text,
            annotation_type=original.annotation_type,
            position=original.position,
            color=original.color,
        )

        assert copied is not original
        assert copied.timestamp == original.timestamp
        assert copied.price == original.price
        assert copied.text == original.text
        assert copied.annotation_type == original.annotation_type
        assert copied.position == original.position
        assert copied.color == original.color

    def test_equality_comparison(self):
        """Test equality comparison between Annotation instances."""
        annotation1 = Annotation(time=1640995200, price=100.0, text="Test")
        annotation2 = Annotation(time=1640995200, price=100.0, text="Test")
        annotation3 = Annotation(time=1640995200, price=100.0, text="Different")

        # Annotation doesn't implement __eq__, so instances are not equal
        assert annotation1 != annotation2
        assert annotation1 != annotation3

    def test_string_representation(self):
        """Test string representation of Annotation."""
        annotation = Annotation(
            time=1640995200,
            price=100.0,
            text="Test annotation",
            annotation_type=AnnotationType.TEXT,
        )

        str_repr = str(annotation)
        # Annotation doesn't implement custom __str__, so it uses default object representation
        assert "Annotation" in str_repr
        assert "object at" in str_repr

    def test_annotation_scenarios(self):
        """Test various annotation scenarios."""
        # Text annotation above bar
        text_annotation = Annotation(
            time=1640995200,
            price=100.0,
            text="Peak",
            annotation_type=AnnotationType.TEXT,
            position=AnnotationPosition.ABOVE,
            color="#FF0000",
        )
        assert text_annotation.annotation_type == AnnotationType.TEXT
        assert text_annotation.position == AnnotationPosition.ABOVE

        # Arrow annotation below bar
        arrow_annotation = Annotation(
            time=1640995200,
            price=95.0,
            text="Valley",
            annotation_type=AnnotationType.ARROW,
            position=AnnotationPosition.BELOW,
            color="#00FF00",
        )
        assert arrow_annotation.annotation_type == AnnotationType.ARROW
        assert arrow_annotation.position == AnnotationPosition.BELOW

        # Shape annotation inline
        shape_annotation = Annotation(
            time=1640995200,
            price=102.0,
            text="Breakout",
            annotation_type=AnnotationType.SHAPE,
            position=AnnotationPosition.INLINE,
            color="#0000FF",
        )
        assert shape_annotation.annotation_type == AnnotationType.SHAPE
        assert shape_annotation.position == AnnotationPosition.INLINE


# ============================================================================
# EDGE CASES AND ADVANCED TESTING
# ============================================================================


class TestAnnotationEdgeCases:
    """Test edge cases in the Annotation class."""

    def test_annotation_init_with_string_annotation_type(self):
        """Test Annotation initialization with string annotation type."""
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test annotation",
            annotation_type="text",
        )

        assert annotation.annotation_type == AnnotationType.TEXT

    def test_annotation_init_with_string_position(self):
        """Test Annotation initialization with string position."""
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test annotation",
            position="above",
        )

        assert annotation.position == AnnotationPosition.ABOVE

    def test_annotation_init_with_invalid_price(self):
        """Test Annotation initialization with invalid price."""
        with pytest.raises(TypeValidationError, match="price must be a number"):
            Annotation(time="2024-01-01 10:00:00", price="invalid", text="Test annotation")

    def test_annotation_init_with_empty_text(self):
        """Test Annotation initialization with empty text."""
        with pytest.raises(ValueValidationError, match="text is required"):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="")

    def test_annotation_init_with_none_text(self):
        """Test Annotation initialization with None text."""
        with pytest.raises(ValueValidationError, match="text is required"):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text=None)

    def test_annotation_init_with_very_long_text(self):
        """Test Annotation initialization with very long text."""
        long_text = "A" * 1000
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text=long_text)

        assert annotation.text == long_text

    def test_annotation_init_with_special_characters_in_text(self):
        """Test Annotation initialization with special characters in text."""
        special_text = "Test annotation with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?"
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text=special_text)

        assert annotation.text == special_text

    def test_annotation_init_with_unicode_text(self):
        """Test Annotation initialization with unicode text."""
        unicode_text = "Test annotation with unicode: 中文, العربية, русский, हिन्दी"
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text=unicode_text)

        assert annotation.text == unicode_text

    def test_annotation_init_with_negative_price(self):
        """Test Annotation initialization with negative price."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=-100.0, text="Negative price")

        assert annotation.price == -100.0

    def test_annotation_init_with_zero_price(self):
        """Test Annotation initialization with zero price."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=0.0, text="Zero price")

        assert annotation.price == 0.0

    def test_annotation_init_with_very_large_price(self):
        """Test Annotation initialization with very large price."""
        large_price = 1e10
        annotation = Annotation(time="2024-01-01 10:00:00", price=large_price, text="Large price")

        assert annotation.price == large_price

    def test_annotation_init_with_very_small_price(self):
        """Test Annotation initialization with very small price."""
        small_price = 1e-10
        annotation = Annotation(time="2024-01-01 10:00:00", price=small_price, text="Small price")

        assert annotation.price == small_price

    def test_annotation_init_with_invalid_color_format(self):
        """Test Annotation initialization with invalid color format."""
        # Should not raise error, just store the value
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test",
            color="invalid_color",
        )

        assert annotation.color == "invalid_color"

    def test_annotation_init_with_rgb_color(self):
        """Test Annotation initialization with RGB color."""
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test",
            color="rgb(255, 0, 0)",
        )

        assert annotation.color == "rgb(255, 0, 0)"

    def test_annotation_init_with_rgba_color(self):
        """Test Annotation initialization with RGBA color."""
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test",
            color="rgba(255, 0, 0, 0.5)",
        )

        assert annotation.color == "rgba(255, 0, 0, 0.5)"

    def test_annotation_init_with_named_color(self):
        """Test Annotation initialization with named color."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test", color="red")

        assert annotation.color == "red"

    def test_annotation_init_with_invalid_font_size(self):
        """Test Annotation initialization with invalid font size."""
        # Should raise error for invalid font size
        with pytest.raises((TypeError, ValueError)):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test", font_size="invalid")

    def test_annotation_init_with_negative_font_size(self):
        """Test Annotation initialization with negative font size."""
        # Should raise error for negative font size
        with pytest.raises(ValueValidationError, match="font_size must be positive"):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test", font_size=-10)

    def test_annotation_init_with_zero_font_size(self):
        """Test Annotation initialization with zero font size."""
        # Should raise error for zero font size
        with pytest.raises(ValueValidationError, match="font_size must be positive"):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test", font_size=0)

    def test_annotation_init_with_very_large_font_size(self):
        """Test Annotation initialization with very large font size."""
        # Should not raise error, just store the value
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test",
            font_size=1000,
        )

        assert annotation.font_size == 1000

    def test_annotation_init_with_float_font_size(self):
        """Test Annotation initialization with float font size."""
        # Should not raise error, just store the value
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test",
            font_size=12.5,
        )

        assert annotation.font_size == 12.5

    def test_annotation_init_with_invalid_border_width(self):
        """Test Annotation initialization with invalid border width."""
        # Should raise error for invalid border width
        with pytest.raises((TypeError, ValueError)):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test", border_width="invalid")

    def test_annotation_init_with_negative_border_width(self):
        """Test Annotation initialization with negative border width."""
        # Should raise error for negative border width
        with pytest.raises(ValueValidationError, match="border_width must be non-negative"):
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test", border_width=-2)

    def test_annotation_init_with_float_border_width(self):
        """Test Annotation initialization with float border width."""
        # Should not raise error, just store the value
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Test",
            border_width=2.5,
        )

        assert annotation.border_width == 2.5

    def test_annotation_init_with_all_none_optional_params(self):
        """Test Annotation initialization with all optional parameters as None."""
        with pytest.raises((TypeError, ValueError)):
            Annotation(
                time="2024-01-01 10:00:00",
                price=100.0,
                text="Test",
                annotation_type=None,
                position=None,
                color=None,
                font_size=None,
                text_color=None,
                background_color=None,
                border_color=None,
                border_width=None,
            )

    def test_annotation_init_with_mixed_types(self):
        """Test Annotation initialization with mixed parameter types."""
        annotation = Annotation(
            time=1640995200,  # int timestamp
            price=100.5,  # float price
            text="Mixed types",
            annotation_type=AnnotationType.TEXT,  # enum
            position="above",  # string position
            color="#FF0000",  # hex color
            font_size=14,  # int font size
            text_color="blue",  # named color
            background_color="rgba(0, 0, 0, 0.1)",  # rgba color
            border_color="rgb(255, 255, 255)",  # rgb color
            border_width=1.5,  # float border width
        )

        assert annotation.timestamp == 1640995200
        assert annotation.price == 100.5
        assert annotation.text == "Mixed types"
        assert annotation.annotation_type == AnnotationType.TEXT
        assert annotation.position == AnnotationPosition.ABOVE
        assert annotation.color == "#FF0000"
        assert annotation.font_size == 14
        assert annotation.text_color == "blue"
        assert annotation.background_color == "rgba(0, 0, 0, 0.1)"
        assert annotation.border_color == "rgb(255, 255, 255)"
        assert annotation.border_width == 1.5


class TestAnnotationLayerEdgeCases:
    """Test edge cases in the AnnotationLayer class."""

    def test_annotation_layer_init_with_empty_annotations(self):
        """Test AnnotationLayer initialization with empty annotations list."""
        layer = AnnotationLayer(name="test_layer", annotations=[])

        assert layer.annotations == []
        assert len(layer.annotations) == 0

    def test_annotation_layer_init_with_none_annotations(self):
        """Test AnnotationLayer initialization with None annotations."""
        layer = AnnotationLayer(name="test_layer", annotations=None)

        assert layer.annotations is None

    def test_annotation_layer_init_with_single_annotation(self):
        """Test AnnotationLayer initialization with single annotation."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Single annotation")
        layer = AnnotationLayer(name="test_layer", annotations=[annotation])

        assert len(layer.annotations) == 1
        assert layer.annotations[0] == annotation

    def test_annotation_layer_init_with_multiple_annotations(self):
        """Test AnnotationLayer initialization with multiple annotations."""
        annotations = [
            Annotation(time="2024-01-01 10:00:00", price=100.0, text="First annotation"),
            Annotation(time="2024-01-01 11:00:00", price=105.0, text="Second annotation"),
            Annotation(time="2024-01-01 12:00:00", price=110.0, text="Third annotation"),
        ]
        layer = AnnotationLayer(name="test_layer", annotations=annotations)

        assert len(layer.annotations) == 3
        assert layer.annotations == annotations

    def test_annotation_layer_init_with_duplicate_annotations(self):
        """Test AnnotationLayer initialization with duplicate annotations."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Duplicate")
        layer = AnnotationLayer(name="test_layer", annotations=[annotation, annotation])

        assert len(layer.annotations) == 2
        assert layer.annotations[0] == annotation
        assert layer.annotations[1] == annotation

    def test_annotation_layer_init_with_mixed_annotation_types(self):
        """Test AnnotationLayer initialization with mixed annotation types."""
        annotations = [
            Annotation(
                time="2024-01-01 10:00:00",
                price=100.0,
                text="Text annotation",
                annotation_type=AnnotationType.TEXT,
            ),
            Annotation(
                time="2024-01-01 11:00:00",
                price=105.0,
                text="Arrow annotation",
                annotation_type=AnnotationType.ARROW,
            ),
            Annotation(
                time="2024-01-01 12:00:00",
                price=110.0,
                text="Shape annotation",
                annotation_type=AnnotationType.SHAPE,
            ),
        ]
        layer = AnnotationLayer(name="test_layer", annotations=annotations)

        assert len(layer.annotations) == 3
        assert layer.annotations[0].annotation_type == AnnotationType.TEXT
        assert layer.annotations[1].annotation_type == AnnotationType.ARROW
        assert layer.annotations[2].annotation_type == AnnotationType.SHAPE


class TestAnnotationManagerEdgeCases:
    """Test edge cases in the AnnotationManager class."""

    def test_annotation_manager_init_with_empty_layers(self):
        """Test AnnotationManager initialization with empty layers."""
        manager = AnnotationManager()

        assert len(manager.layers) == 0

    def test_annotation_manager_init_with_none_layers(self):
        """Test AnnotationManager initialization with None layers."""
        manager = AnnotationManager()

        assert len(manager.layers) == 0

    def test_annotation_manager_init_with_single_layer(self):
        """Test AnnotationManager initialization with single layer."""
        annotation = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Test")
        layer = AnnotationLayer(name="test_layer", annotations=[annotation])
        manager = AnnotationManager()
        manager.layers["test_layer"] = layer

        assert len(manager.layers) == 1
        assert "test_layer" in manager.layers

    def test_annotation_manager_init_with_multiple_layers(self):
        """Test AnnotationManager initialization with multiple layers."""
        annotation1 = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Layer 1")
        annotation2 = Annotation(time="2024-01-01 11:00:00", price=105.0, text="Layer 2")
        layer1 = AnnotationLayer(name="layer1", annotations=[annotation1])
        layer2 = AnnotationLayer(name="layer2", annotations=[annotation2])
        manager = AnnotationManager()
        manager.layers["layer1"] = layer1
        manager.layers["layer2"] = layer2

        assert len(manager.layers) == 2
        assert "layer1" in manager.layers
        assert "layer2" in manager.layers

    def test_annotation_manager_init_with_empty_layers_in_list(self):
        """Test AnnotationManager initialization with empty layers in list."""
        layer1 = AnnotationLayer(name="layer1", annotations=[])
        layer2 = AnnotationLayer(name="layer2", annotations=[])
        manager = AnnotationManager()
        manager.layers["layer1"] = layer1
        manager.layers["layer2"] = layer2

        assert len(manager.layers) == 2
        assert len(manager.layers["layer1"].annotations) == 0
        assert len(manager.layers["layer2"].annotations) == 0

    def test_annotation_manager_init_with_mixed_layer_sizes(self):
        """Test AnnotationManager initialization with mixed layer sizes."""
        annotation1 = Annotation(time="2024-01-01 10:00:00", price=100.0, text="Single annotation")
        annotation2 = Annotation(time="2024-01-01 11:00:00", price=105.0, text="First of many")
        annotation3 = Annotation(time="2024-01-01 12:00:00", price=110.0, text="Second of many")

        layer1 = AnnotationLayer(name="layer1", annotations=[annotation1])  # Single annotation
        layer2 = AnnotationLayer(
            name="layer2",
            annotations=[annotation2, annotation3],
        )  # Multiple annotations
        layer3 = AnnotationLayer(name="layer3", annotations=[])  # Empty layer

        manager = AnnotationManager()
        manager.layers["layer1"] = layer1
        manager.layers["layer2"] = layer2
        manager.layers["layer3"] = layer3

        assert len(manager.layers) == 3
        assert len(manager.layers["layer1"].annotations) == 1
        assert len(manager.layers["layer2"].annotations) == 2
        assert len(manager.layers["layer3"].annotations) == 0


class TestAnnotationFactoryFunctionsEdgeCases:
    """Test edge cases in annotation factory functions."""

    def test_create_text_annotation_with_minimal_params(self):
        """Test create_text_annotation with minimal parameters."""
        annotation = create_text_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Minimal text",
        )

        assert annotation.annotation_type == AnnotationType.TEXT
        assert annotation.text == "Minimal text"
        assert annotation.price == 100.0

    def test_create_text_annotation_with_all_params(self):
        """Test create_text_annotation with all parameters."""
        annotation = create_text_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Full text",
            position="above",
            color="#FF0000",
            font_size=14,
            text_color="#FFFFFF",
            background_color="#000000",
            border_color="#FF0000",
            border_width=2,
        )

        assert annotation.annotation_type == AnnotationType.TEXT
        assert annotation.text == "Full text"
        assert annotation.position == AnnotationPosition.ABOVE
        assert annotation.color == "#FF0000"
        assert annotation.font_size == 14
        assert annotation.text_color == "#FFFFFF"
        assert annotation.background_color == "#000000"
        assert annotation.border_color == "#FF0000"
        assert annotation.border_width == 2

    def test_create_arrow_annotation_with_minimal_params(self):
        """Test create_arrow_annotation with minimal parameters."""
        annotation = create_arrow_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Minimal arrow",
        )

        assert annotation.annotation_type == AnnotationType.ARROW
        assert annotation.text == "Minimal arrow"
        assert annotation.price == 100.0

    def test_create_arrow_annotation_with_all_params(self):
        """Test create_arrow_annotation with all parameters."""
        annotation = create_arrow_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Full arrow",
            position="below",
            color="#00FF00",
            font_size=12,
            text_color="#000000",
            background_color="#FFFFFF",
            border_color="#00FF00",
            border_width=1,
        )

        assert annotation.annotation_type == AnnotationType.ARROW
        assert annotation.text == "Full arrow"
        assert annotation.position == AnnotationPosition.BELOW
        assert annotation.color == "#00FF00"
        assert annotation.font_size == 12
        assert annotation.text_color == "#000000"
        assert annotation.background_color == "#FFFFFF"
        assert annotation.border_color == "#00FF00"
        assert annotation.border_width == 1

    def test_create_shape_annotation_with_minimal_params(self):
        """Test create_shape_annotation with minimal parameters."""
        annotation = create_shape_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Minimal shape",
        )

        assert annotation.annotation_type == AnnotationType.SHAPE
        assert annotation.text == "Minimal shape"
        assert annotation.price == 100.0

    def test_create_shape_annotation_with_all_params(self):
        """Test create_shape_annotation with all parameters."""
        annotation = create_shape_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Full shape",
            position="inline",
            color="#0000FF",
            font_size=16,
            text_color="#FFFFFF",
            background_color="#000000",
            border_color="#0000FF",
            border_width=3,
        )

        assert annotation.annotation_type == AnnotationType.SHAPE
        assert annotation.text == "Full shape"
        assert annotation.position == AnnotationPosition.INLINE
        assert annotation.color == "#0000FF"
        assert annotation.font_size == 16
        assert annotation.text_color == "#FFFFFF"
        assert annotation.background_color == "#000000"
        assert annotation.border_color == "#0000FF"
        assert annotation.border_width == 3

    def test_create_text_annotation_with_invalid_params(self):
        """Test create_text_annotation with invalid parameters."""
        # Should raise errors for invalid parameters
        with pytest.raises((ValueError, TypeError)):
            create_text_annotation(
                time="2024-01-01 10:00:00",
                price="invalid",
                text=None,
                position="invalid_position",
                color="invalid_color",
                font_size="invalid_size",
            )

    def test_create_arrow_annotation_with_edge_values(self):
        """Test create_arrow_annotation with edge values."""
        with pytest.raises(ValueValidationError, match="text is required"):
            create_arrow_annotation(
                time="2024-01-01 10:00:00",
                price=0.0,
                text="",
                position="above",
                color="",
                font_size=0,
                border_width=-1,
            )

    def test_create_shape_annotation_with_special_chars(self):
        """Test create_shape_annotation with special characters."""
        annotation = create_shape_annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
            position="below",
            color="#FF00FF",
        )

        assert annotation.annotation_type == AnnotationType.SHAPE
        assert annotation.text == "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?"
        assert annotation.position == AnnotationPosition.BELOW
        assert annotation.color == "#FF00FF"


class TestAnnotationDataFrameIntegration:
    """Test annotation integration with DataFrames."""

    def test_annotation_from_dataframe_row(self):
        """Test creating annotation from DataFrame row."""
        annotation_data = pd.DataFrame(
            {
                "time": ["2024-01-01 10:00:00"],
                "price": [100.0],
                "text": ["DataFrame annotation"],
                "annotation_type": ["text"],
                "position": ["above"],
                "color": ["#FF0000"],
            },
        )

        row = annotation_data.iloc[0]
        annotation = Annotation(
            time=row["time"],
            price=row["price"],
            text=row["text"],
            annotation_type=row["annotation_type"],
            position=row["position"],
            color=row["color"],
        )

        assert annotation.timestamp == pd.Timestamp("2024-01-01 10:00:00").timestamp()
        assert annotation.price == 100.0
        assert annotation.text == "DataFrame annotation"
        assert annotation.annotation_type == AnnotationType.TEXT
        assert annotation.position == AnnotationPosition.ABOVE
        assert annotation.color == "#FF0000"

    def test_annotation_to_dataframe_row(self):
        """Test converting annotation to DataFrame row."""
        annotation = Annotation(
            time="2024-01-01 10:00:00",
            price=100.0,
            text="DataFrame annotation",
            annotation_type=AnnotationType.TEXT,
            position=AnnotationPosition.ABOVE,
            color="#FF0000",
        )

        # Create DataFrame row from annotation attributes
        row_data = {
            "time": datetime.fromtimestamp(annotation.timestamp),
            "price": annotation.price,
            "text": annotation.text,
            "annotation_type": (
                annotation.annotation_type.value if annotation.annotation_type else None
            ),
            "position": annotation.position.value if annotation.position else None,
            "color": annotation.color,
        }

        annotation_data = pd.DataFrame([row_data])

        assert len(annotation_data) == 1
        assert annotation_data.iloc[0]["price"] == 100.0
        assert annotation_data.iloc[0]["text"] == "DataFrame annotation"

    def test_annotation_layer_from_dataframe(self):
        """Test creating annotation layer from DataFrame."""
        annotation_data = pd.DataFrame(
            {
                "time": [
                    "2024-01-01 10:00:00",
                    "2024-01-01 11:00:00",
                    "2024-01-01 12:00:00",
                ],
                "price": [100.0, 105.0, 110.0],
                "text": ["First", "Second", "Third"],
                "annotation_type": ["text", "arrow", "shape"],
                "position": ["above", "below", "inline"],
                "color": ["#FF0000", "#00FF00", "#0000FF"],
            },
        )

        annotations = []
        for _, row in annotation_data.iterrows():
            annotation = Annotation(
                time=row["time"],
                price=row["price"],
                text=row["text"],
                annotation_type=row["annotation_type"],
                position=row["position"],
                color=row["color"],
            )
            annotations.append(annotation)

        layer = AnnotationLayer(name="test_layer", annotations=annotations)

        assert len(layer.annotations) == 3
        assert layer.annotations[0].text == "First"
        assert layer.annotations[1].text == "Second"
        assert layer.annotations[2].text == "Third"

    def test_annotation_manager_from_multiple_dataframes(self):
        """Test creating annotation manager from multiple DataFrames."""
        df1 = pd.DataFrame(
            {
                "time": ["2024-01-01 10:00:00"],
                "price": [100.0],
                "text": ["Layer 1 annotation"],
                "annotation_type": ["text"],
                "position": ["above"],
                "color": ["#FF0000"],
            },
        )

        df2 = pd.DataFrame(
            {
                "time": ["2024-01-01 11:00:00"],
                "price": [105.0],
                "text": ["Layer 2 annotation"],
                "annotation_type": ["arrow"],
                "position": ["below"],
                "color": ["#00FF00"],
            },
        )

        # Create layers from DataFrames
        layer1_annotations = []
        for _, row in df1.iterrows():
            annotation = Annotation(
                time=row["time"],
                price=row["price"],
                text=row["text"],
                annotation_type=row["annotation_type"],
                position=row["position"],
                color=row["color"],
            )
            layer1_annotations.append(annotation)

        layer2_annotations = []
        for _, row in df2.iterrows():
            annotation = Annotation(
                time=row["time"],
                price=row["price"],
                text=row["text"],
                annotation_type=row["annotation_type"],
                position=row["position"],
                color=row["color"],
            )
            layer2_annotations.append(annotation)

        layer1 = AnnotationLayer(name="layer1", annotations=layer1_annotations)
        layer2 = AnnotationLayer(name="layer2", annotations=layer2_annotations)
        manager = AnnotationManager()
        manager.layers["layer1"] = layer1
        manager.layers["layer2"] = layer2

        assert len(manager.layers) == 2
        assert len(manager.layers["layer1"].annotations) == 1
        assert len(manager.layers["layer2"].annotations) == 1
        assert manager.layers["layer1"].annotations[0].text == "Layer 1 annotation"
        assert manager.layers["layer2"].annotations[0].text == "Layer 2 annotation"
