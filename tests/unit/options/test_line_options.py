import pytest

from streamlit_lightweight_charts_pro.charts.options.line_options import LineOptions
from streamlit_lightweight_charts_pro.exceptions import ColorValidationError, TypeValidationError
from streamlit_lightweight_charts_pro.type_definitions.enums import (
    LastPriceAnimationMode,
    LineStyle,
    LineType,
)


def test_standard_construction():
    opts = LineOptions(
        color="#2196F3",
        line_style=LineStyle.DASHED,
        line_width=4,
        line_type=LineType.CURVED,
        line_visible=False,
        point_markers_visible=True,
        point_markers_radius=6,
        crosshair_marker_visible=False,
        crosshair_marker_radius=5,
        crosshair_marker_border_color="#FFFFFF",
        crosshair_marker_background_color="#000000",
        crosshair_marker_border_width=3,
        last_price_animation=LastPriceAnimationMode.CONTINUOUS,
    )
    assert opts.color == "#2196F3"
    assert opts.line_style == LineStyle.DASHED
    assert opts.line_width == 4
    assert opts.line_type == LineType.CURVED
    assert not opts.line_visible
    assert opts.point_markers_visible
    assert opts.point_markers_radius == 6
    assert not opts.crosshair_marker_visible
    assert opts.crosshair_marker_radius == 5
    assert opts.crosshair_marker_border_color == "#FFFFFF"
    assert opts.crosshair_marker_background_color == "#000000"
    assert opts.crosshair_marker_border_width == 3
    assert opts.last_price_animation == LastPriceAnimationMode.CONTINUOUS


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
