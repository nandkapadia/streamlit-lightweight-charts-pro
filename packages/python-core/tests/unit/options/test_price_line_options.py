import pytest
from lightweight_charts_core.charts.options.price_line_options import PriceLineOptions
from lightweight_charts_core.exceptions import ColorValidationError, TypeValidationError
from lightweight_charts_core.type_definitions.enums import LineStyle


def test_standard_construction():
    opts = PriceLineOptions(
        id="pl1",
        price=123.45,
        color="#2196F3",
        line_width=2,
        line_style=LineStyle.DASHED,
        line_visible=False,
        axis_label_visible=False,
        title="Test Line",
        axis_label_color="#FFFFFF",
        axis_label_text_color="rgba(0,0,0,1)",
    )
    assert opts.id == "pl1"
    assert opts.price == 123.45
    assert opts.color == "#2196F3"
    assert opts.line_width == 2
    assert opts.line_style == LineStyle.DASHED
    assert not opts.line_visible
    assert not opts.axis_label_visible
    assert opts.title == "Test Line"
    assert opts.axis_label_color == "#FFFFFF"
    assert opts.axis_label_text_color == "rgba(0,0,0,1)"


def test_default_values():
    opts = PriceLineOptions()
    assert opts.id is None
    assert opts.price == 0.0
    assert opts.color == ""
    assert opts.line_width == 1
    assert opts.line_style == LineStyle.SOLID
    assert opts.line_visible is True
    assert opts.axis_label_visible is False
    assert opts.title == ""
    assert opts.axis_label_color is None
    assert opts.axis_label_text_color is None


def test_chainable_properties():
    """Test that all properties support method chaining."""
    opts = PriceLineOptions()

    # Test individual chainable methods
    result = opts.set_id("test_id")
    assert result is opts
    assert opts.id == "test_id"

    result = opts.set_price(100.5)
    assert result is opts
    assert opts.price == 100.5

    result = opts.set_color("#ff0000")
    assert result is opts
    assert opts.color == "#ff0000"

    result = opts.set_line_width(3)
    assert result is opts
    assert opts.line_width == 3

    result = opts.set_line_style(LineStyle.DASHED)
    assert result is opts
    assert opts.line_style == LineStyle.DASHED

    result = opts.set_line_visible(False)
    assert result is opts
    assert opts.line_visible is False

    result = opts.set_axis_label_visible(False)
    assert result is opts
    assert opts.axis_label_visible is False

    result = opts.set_title("Test Title")
    assert result is opts
    assert opts.title == "Test Title"

    result = opts.set_axis_label_color("#00ff00")
    assert result is opts
    assert opts.axis_label_color == "#00ff00"

    result = opts.set_axis_label_text_color("#0000ff")
    assert result is opts
    assert opts.axis_label_text_color == "#0000ff"


def test_chainable_method_chaining():
    """Test complex method chaining."""
    opts = PriceLineOptions()

    result = (
        opts.set_id("test_id")
        .set_price(150.75)
        .set_color("#ff0000")
        .set_line_width(4)
        .set_line_style(LineStyle.DASHED)
        .set_line_visible(False)
        .set_axis_label_visible(True)
        .set_title("Chained Title")
    )

    assert result is opts
    assert opts.id == "test_id"
    assert opts.price == 150.75
    assert opts.color == "#ff0000"
    assert opts.line_width == 4
    assert opts.line_style == LineStyle.DASHED
    assert opts.line_visible is False
    assert opts.axis_label_visible is True
    assert opts.title == "Chained Title"


def test_type_validation_in_chainable_methods():
    """Test that chainable methods validate types correctly."""
    opts = PriceLineOptions()

    # Test price validation
    with pytest.raises(TypeValidationError):
        opts.set_price("invalid")

    # Test color validation
    with pytest.raises(TypeValidationError):
        opts.set_color(123)

    with pytest.raises(ColorValidationError):
        opts.set_color("invalid_color")

    # Test line_width validation
    with pytest.raises(TypeValidationError):
        opts.set_line_width("invalid")

    # Test line_style validation
    with pytest.raises(TypeValidationError):
        opts.set_line_style("invalid")

        # Test boolean validation
        with pytest.raises(TypeValidationError):
            opts.set_line_visible("invalid")

    # Test string validation
    with pytest.raises(TypeValidationError):
        opts.set_id(123)


def test_color_validation_in_chainable_methods():
    """Test color validation in chainable methods."""
    opts = PriceLineOptions()

    # Valid colors
    opts.set_color("#123456")
    opts.set_color("rgba(1,2,3,0.5)")
    opts.set_axis_label_color("#123456")
    opts.set_axis_label_text_color("rgba(1,2,3,0.5)")

    # Invalid colors
    with pytest.raises(ColorValidationError):
        opts.set_color("notacolor")

    with pytest.raises(ColorValidationError):
        opts.set_axis_label_color("notacolor")

    # Note: rgb(255,0,0) is now a valid color


def test_both_property_styles_work():
    """Test that both direct property assignment and chainable methods work."""
    opts = PriceLineOptions()

    # Direct property assignment
    opts.price = 100.0
    opts.color = "#ff0000"
    opts.line_visible = False

    # Chainable methods
    opts.set_price(200.0).set_color("#00ff00").set_line_visible(True)

    # Verify final state
    assert opts.price == 200.0
    assert opts.color == "#00ff00"
    assert opts.line_visible is True


def test_optional_fields_omitted():
    opts = PriceLineOptions(price=10.0)
    assert opts.id is None
    assert opts.axis_label_color is None
    assert opts.axis_label_text_color is None


def test_update_method():
    """Test the update method with both snake_case and camelCase."""
    opts = PriceLineOptions()

    # Test with snake_case
    opts.update({"price": 100.0, "color": "#ff0000", "line_visible": False})

    assert opts.price == 100.0
    assert opts.color == "#ff0000"
    assert opts.line_visible is False

    # Test with camelCase
    opts.update({"lineStyle": LineStyle.DASHED, "lineWidth": 5, "axisLabelVisible": True})

    assert opts.line_style == LineStyle.DASHED
    assert opts.line_width == 5
    assert opts.axis_label_visible is True


def test_static_color_validator():
    """Test the static color validator method."""
    # Valid colors
    assert PriceLineOptions._validate_color_static("#123456", "test") == "#123456"
    assert PriceLineOptions._validate_color_static("rgba(1,2,3,0.5)", "test") == "rgba(1,2,3,0.5)"

    # Invalid colors
    with pytest.raises(ColorValidationError):
        PriceLineOptions._validate_color_static("notacolor", "test")

    # Note: rgb(255,0,0) is now a valid color
