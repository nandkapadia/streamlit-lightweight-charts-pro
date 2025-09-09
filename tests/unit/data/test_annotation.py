"""
Unit tests for Annotation class.

This module tests the Annotation class functionality including
construction, validation, and serialization.
"""

import pytest

from streamlit_lightweight_charts_pro.data.annotation import Annotation
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    AnnotationPosition,
    AnnotationType,
    HorzAlign,
    VertAlign,
)


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
        with pytest.raises(ValueError, match="Font size must be positive"):
            Annotation(time=1640995200, price=100.0, text="Test", font_size=0)

        # Invalid negative font size
        with pytest.raises(ValueError, match="Font size must be positive"):
            Annotation(time=1640995200, price=100.0, text="Test", font_size=-5)

    def test_validation_text_size(self):
        """Test validation of font_size parameter (alias for text_size)."""
        # Valid positive font size
        annotation = Annotation(time=1640995200, price=100.0, text="Test", font_size=12)
        assert annotation.font_size == 12

        # Invalid zero font size
        with pytest.raises(ValueError, match="Font size must be positive"):
            Annotation(time=1640995200, price=100.0, text="Test", font_size=0)

        # Invalid negative font size
        with pytest.raises(ValueError, match="Font size must be positive"):
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
        with pytest.raises(ValueError, match="Border width must be non-negative"):
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
            time=1640995200, price=999999.99, text="Test", font_size=999999, border_width=999999
        )
        assert annotation.price == 999999.99
        assert annotation.font_size == 999999
        assert annotation.border_width == 999999

        # Very small numbers
        annotation = Annotation(
            time=1640995200, price=0.0001, text="Test", font_size=1, border_width=1
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
