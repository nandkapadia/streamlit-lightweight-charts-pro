"""Comprehensive unit tests for the LineOptions class.

This module contains extensive unit tests for the LineOptions class,
which provides configuration options for line chart styling and behavior.
The tests cover construction, validation, serialization, and edge cases.

Key Features Tested:
    - LineOptions construction with various parameters
    - Color validation for line and marker colors
    - Default value behavior and assignment
    - Serialization to frontend-compatible format
    - Error handling for invalid parameters
    - Enum value validation and conversion
    - Animation and interaction options

Example Test Usage:
    ```python
    from tests.unit.options.test_line_options import test_standard_construction

    # Run specific test
    test_standard_construction()
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Third Party Imports
import pytest

# Local Imports
from lightweight_charts_core.charts.options.line_options import LineOptions
from lightweight_charts_core.exceptions import ColorValidationError, TypeValidationError
from lightweight_charts_core.type_definitions.enums import (
    LastPriceAnimationMode,
    LineStyle,
    LineType,
)


def test_standard_construction():
    """Test LineOptions construction with all parameters.

    This test verifies that a LineOptions object can be created with
    all available parameters and that each parameter is correctly
    assigned and accessible.

    The test ensures:
        - All parameters are correctly assigned during construction
        - Enum values are properly handled
        - Boolean flags work as expected
        - Color values are validated and stored
    """
    # Create LineOptions with comprehensive parameter set
    # This tests all available styling and behavior options
    opts = LineOptions(
        color="#2196F3",  # Blue line color
        line_style=LineStyle.DASHED,  # Dashed line style
        line_width=4,  # Medium line width
        line_type=LineType.CURVED,  # Curved line type
        line_visible=False,  # Hide the line itself
        point_markers_visible=True,  # Show point markers
        point_markers_radius=6,  # Large point markers
        crosshair_marker_visible=False,  # Hide crosshair markers
        crosshair_marker_radius=5,  # Medium crosshair size
        crosshair_marker_border_color="#FFFFFF",  # White border
        crosshair_marker_background_color="#000000",  # Black background
        crosshair_marker_border_width=3,  # Thick border
        last_price_animation=LastPriceAnimationMode.CONTINUOUS,  # Continuous animation
    )

    # Verify all parameters are correctly assigned
    assert opts.color == "#2196F3"  # Verify line color
    assert opts.line_style == LineStyle.DASHED  # Verify line style enum
    assert opts.line_width == 4  # Verify line width
    assert opts.line_type == LineType.CURVED  # Verify line type enum
    assert not opts.line_visible  # Verify line visibility (False)
    assert opts.point_markers_visible  # Verify point markers visible (True)
    assert opts.point_markers_radius == 6  # Verify point marker size
    assert not opts.crosshair_marker_visible  # Verify crosshair visibility (False)
    assert opts.crosshair_marker_radius == 5  # Verify crosshair marker size
    assert opts.crosshair_marker_border_color == "#FFFFFF"  # Verify crosshair border color
    assert opts.crosshair_marker_background_color == "#000000"  # Verify crosshair background
    assert opts.crosshair_marker_border_width == 3  # Verify crosshair border width
    assert opts.last_price_animation == LastPriceAnimationMode.CONTINUOUS  # Verify animation mode


def test_default_values():
    opts = LineOptions()
    assert opts.color == "#2196f3"
    assert opts.line_style == LineStyle.SOLID
    assert opts.line_width == 3
    assert opts.line_type == LineType.SIMPLE
    assert opts.line_visible is True
    assert opts.point_markers_visible is False
    assert opts.point_markers_radius is None
    assert opts.crosshair_marker_visible is False
    assert opts.crosshair_marker_radius == 4
    assert opts.crosshair_marker_border_color == ""
    assert opts.crosshair_marker_background_color == ""
    assert opts.crosshair_marker_border_width == 2
    assert opts.last_price_animation == LastPriceAnimationMode.DISABLED


def test_chainable_properties():
    """Test that all properties support method chaining."""
    opts = LineOptions()

    # Test individual chainable methods
    result = opts.set_color("#ff0000")
    assert result is opts
    assert opts.color == "#ff0000"

    result = opts.set_line_width(5)
    assert result is opts
    assert opts.line_width == 5

    result = opts.set_line_style(LineStyle.DASHED)
    assert result is opts
    assert opts.line_style == LineStyle.DASHED

    result = opts.set_line_type(LineType.CURVED)
    assert result is opts
    assert opts.line_type == LineType.CURVED

    result = opts.set_line_visible(False)
    assert result is opts
    assert opts.line_visible is False

    result = opts.set_point_markers_visible(True)
    assert result is opts
    assert opts.point_markers_visible is True

    result = opts.set_point_markers_radius(10)
    assert result is opts
    assert opts.point_markers_radius == 10

    result = opts.set_crosshair_marker_visible(False)
    assert result is opts
    assert opts.crosshair_marker_visible is False

    result = opts.set_crosshair_marker_radius(8)
    assert result is opts
    assert opts.crosshair_marker_radius == 8

    result = opts.set_crosshair_marker_border_color("#00ff00")
    assert result is opts
    assert opts.crosshair_marker_border_color == "#00ff00"

    result = opts.set_crosshair_marker_background_color("#0000ff")
    assert result is opts
    assert opts.crosshair_marker_background_color == "#0000ff"

    result = opts.set_crosshair_marker_border_width(4)
    assert result is opts
    assert opts.crosshair_marker_border_width == 4

    result = opts.set_last_price_animation(LastPriceAnimationMode.CONTINUOUS)
    assert result is opts
    assert opts.last_price_animation == LastPriceAnimationMode.CONTINUOUS


def test_chainable_method_chaining():
    """Test complex method chaining."""
    opts = LineOptions()

    result = (
        opts.set_color("#ff0000")
        .set_line_width(5)
        .set_line_style(LineStyle.DASHED)
        .set_line_type(LineType.CURVED)
        .set_line_visible(False)
        .set_point_markers_visible(True)
        .set_crosshair_marker_visible(False)
    )

    assert result is opts
    assert opts.color == "#ff0000"
    assert opts.line_width == 5
    assert opts.line_style == LineStyle.DASHED
    assert opts.line_type == LineType.CURVED
    assert opts.line_visible is False
    assert opts.point_markers_visible is True
    assert opts.crosshair_marker_visible is False


def test_type_validation_in_chainable_methods():
    """Test that chainable methods validate types correctly."""
    opts = LineOptions()

    # Test color validation
    with pytest.raises(TypeValidationError):
        opts.set_color(123)

    with pytest.raises(ColorValidationError):
        opts.set_color("invalid_color")

    # Note: rgb(255,0,0) is now a valid color

    # Test line_width validation
    with pytest.raises(TypeValidationError):
        opts.set_line_width("invalid")

    # Test line_style validation
    with pytest.raises(TypeValidationError):
        opts.set_line_style("invalid")

    # Test line_type validation
    with pytest.raises(TypeValidationError):
        opts.set_line_type("invalid")

        # Test boolean validation
        with pytest.raises(TypeValidationError):
            opts.set_line_visible("invalid")

    # Test integer validation
    with pytest.raises(TypeValidationError):
        opts.set_point_markers_radius("invalid")


def test_color_validation_in_chainable_methods():
    """Test color validation in chainable methods."""
    opts = LineOptions()

    # Valid colors
    opts.set_color("#123456")
    opts.set_color("rgba(1,2,3,0.5)")
    opts.set_crosshair_marker_border_color("#123456")
    opts.set_crosshair_marker_background_color("rgba(1,2,3,0.5)")

    # Invalid colors
    with pytest.raises(ColorValidationError):
        opts.set_color("notacolor")

    with pytest.raises(ColorValidationError):
        opts.set_crosshair_marker_border_color("notacolor")

    # Note: rgb(255,0,0) is now a valid color


def test_both_property_styles_work():
    """Test that both direct property assignment and chainable methods work."""
    opts = LineOptions()

    # Direct property assignment
    opts.color = "#ff0000"
    opts.line_width = 5
    opts.line_visible = False

    # Chainable methods
    opts.set_color("#00ff00").set_line_width(10).set_line_visible(True)

    # Verify final state
    assert opts.color == "#00ff00"
    assert opts.line_width == 10
    assert opts.line_visible is True


def test_optional_fields_omitted():
    opts = LineOptions()
    assert opts.point_markers_radius is None
    assert opts.crosshair_marker_border_color == ""
    assert opts.crosshair_marker_background_color == ""


def test_update_method():
    """Test the update method with both snake_case and camelCase."""
    opts = LineOptions()

    # Test with snake_case
    opts.update({"color": "#ff0000", "line_width": 5, "line_visible": False})

    assert opts.color == "#ff0000"
    assert opts.line_width == 5
    assert opts.line_visible is False

    # Test with camelCase
    opts.update(
        {"lineStyle": LineStyle.DASHED, "lineType": LineType.CURVED, "pointMarkersVisible": True},
    )

    assert opts.line_style == LineStyle.DASHED
    assert opts.line_type == LineType.CURVED
    assert opts.point_markers_visible is True


def test_static_color_validator():
    """Test the static color validator method."""
    # Valid colors
    assert LineOptions._validate_color_static("#123456", "test") == "#123456"
    assert LineOptions._validate_color_static("rgba(1,2,3,0.5)", "test") == "rgba(1,2,3,0.5)"

    # Invalid colors
    with pytest.raises(ColorValidationError):
        LineOptions._validate_color_static("notacolor", "test")

    # Note: rgb(255,0,0) is now a valid color
