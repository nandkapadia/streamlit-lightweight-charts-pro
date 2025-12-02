import pytest
from lightweight_charts_core.charts.options.price_format_options import PriceFormatOptions
from lightweight_charts_core.exceptions import (
    TypeValidationError,
    ValueValidationError,
)


def test_standard_construction():
    opts = PriceFormatOptions(
        type="price",
        precision=4,
        min_move=0.001,
        formatter="custom_formatter",
    )
    assert opts.type == "price"
    assert opts.precision == 4
    assert opts.min_move == 0.001
    assert opts.formatter == "custom_formatter"


def test_default_values():
    opts = PriceFormatOptions()
    assert opts.type == "price"
    assert opts.precision == 2
    assert opts.min_move == 0.01
    assert opts.formatter is None


def test_chainable_properties():
    """Test that all properties support method chaining."""
    opts = PriceFormatOptions()

    # Test individual chainable methods
    result = opts.set_type("volume")
    assert result is opts
    assert opts.type == "volume"

    result = opts.set_precision(6)
    assert result is opts
    assert opts.precision == 6

    result = opts.set_min_move(0.0001)
    assert result is opts
    assert opts.min_move == 0.0001

    result = opts.set_formatter("my_custom_formatter")
    assert result is opts
    assert opts.formatter == "my_custom_formatter"


def test_chainable_method_chaining():
    """Test complex method chaining."""
    opts = PriceFormatOptions()

    result = (
        opts.set_type("percent")
        .set_precision(3)
        .set_min_move(0.1)
        .set_formatter("percent_formatter")
    )

    assert result is opts
    assert opts.type == "percent"
    assert opts.precision == 3
    assert opts.min_move == 0.1
    assert opts.formatter == "percent_formatter"


def test_type_validation_in_chainable_methods():
    """Test that chainable methods validate types correctly."""
    opts = PriceFormatOptions()

    # Valid types
    opts.set_type("price")
    opts.set_type("volume")
    opts.set_type("percent")
    opts.set_type("custom")

    # Invalid type
    with pytest.raises(ValueValidationError):
        opts.set_type("invalid")

    # Type validation
    with pytest.raises(TypeValidationError):
        opts.set_type(123)


def test_precision_validation_in_chainable_methods():
    """Test precision validation in chainable methods."""
    opts = PriceFormatOptions()

    # Valid precision values
    opts.set_precision(0)
    opts.set_precision(2)
    opts.set_precision(10)

    # Invalid precision values
    with pytest.raises(ValueValidationError):
        opts.set_precision(-1)

    with pytest.raises(TypeValidationError):
        opts.set_precision("invalid")

    with pytest.raises(TypeValidationError):
        opts.set_precision(1.5)


def test_min_move_validation_in_chainable_methods():
    """Test min_move validation in chainable methods."""
    opts = PriceFormatOptions()

    # Valid min_move values
    opts.set_min_move(0.001)
    opts.set_min_move(1.0)
    opts.set_min_move(100)

    # Invalid min_move values
    with pytest.raises(ValueValidationError):
        opts.set_min_move(0)

    with pytest.raises(ValueValidationError):
        opts.set_min_move(-1)

    with pytest.raises(TypeValidationError):
        opts.set_min_move("invalid")


def test_both_property_styles_work():
    """Test that both direct property assignment and chainable methods work."""
    opts = PriceFormatOptions()

    # Direct property assignment
    opts.type = "volume"
    opts.precision = 4
    opts.min_move = 0.001

    # Chainable methods
    opts.set_type("percent").set_precision(3).set_min_move(0.1)

    # Verify final state
    assert opts.type == "percent"
    assert opts.precision == 3
    assert opts.min_move == 0.1


def test_optional_fields_omitted():
    opts = PriceFormatOptions(type="price", precision=2, min_move=0.01)
    assert opts.formatter is None


def test_custom_formatter():
    opts = PriceFormatOptions(type="custom", precision=2, min_move=0.01, formatter="myfmt")
    assert opts.formatter == "myfmt"


def test_update_method():
    """Test the update method with both snake_case and camelCase."""
    opts = PriceFormatOptions()

    # Test with snake_case
    opts.update({"type": "volume", "precision": 4, "min_move": 0.001})

    assert opts.type == "volume"
    assert opts.precision == 4
    assert opts.min_move == 0.001

    # Test with camelCase
    opts.update({"formatter": "custom_formatter"})

    assert opts.formatter == "custom_formatter"


def test_static_validators():
    """Test the static validator methods."""
    # Type validator
    assert PriceFormatOptions._validate_type_static("price") == "price"
    assert PriceFormatOptions._validate_type_static("volume") == "volume"
    assert PriceFormatOptions._validate_type_static("percent") == "percent"
    assert PriceFormatOptions._validate_type_static("custom") == "custom"

    with pytest.raises(ValueValidationError):
        PriceFormatOptions._validate_type_static("invalid")

    # Precision validator
    assert PriceFormatOptions._validate_precision_static(0) == 0
    assert PriceFormatOptions._validate_precision_static(5) == 5
    assert PriceFormatOptions._validate_precision_static(10) == 10

    with pytest.raises(ValueValidationError):
        PriceFormatOptions._validate_precision_static(-1)

    # Min move validator
    assert PriceFormatOptions._validate_min_move_static(0.001) == 0.001
    assert PriceFormatOptions._validate_min_move_static(1.0) == 1.0
    assert PriceFormatOptions._validate_min_move_static(100) == 100

    with pytest.raises(ValueValidationError):
        PriceFormatOptions._validate_min_move_static(0)

    with pytest.raises(ValueValidationError):
        PriceFormatOptions._validate_min_move_static(-1)
