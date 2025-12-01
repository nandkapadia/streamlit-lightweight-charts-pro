"""Base Options integration tests - Inheritance and complex scenarios.

This module tests integration scenarios including:
- Options inheritance through multiple levels
- Background options flattening integration
- Multiple _options fields handling
- Dataclass fields and post_init integration
- Complex real-world usage patterns
"""

# Standard Imports
from dataclasses import dataclass
from enum import Enum

# Third Party Imports
import pytest

# Local Imports
from lightweight_charts_core.charts.options.base_options import Options

# =============================================================================
# Test Data Classes
# =============================================================================


class MockEnum(Enum):
    """Mock enum for testing."""

    VALUE1 = "value1"
    VALUE2 = "value2"


@dataclass
class NestedOptions(Options):
    """Nested options for testing."""

    color: str = "#ff0000"
    width: int = 2


# =============================================================================
# Inheritance Tests
# =============================================================================


class TestOptionsInheritance:
    """Test Options class inheritance."""

    def test_options_inheritance(self):
        """Test that Options can be inherited from."""

        @dataclass
        class TestOptions(Options):
            value: str = "test"

        options = TestOptions()
        assert isinstance(options, Options)

    def test_post_init_default(self):
        """Test that Options works without __post_init__ method."""

        @dataclass
        class TestOptions(Options):
            value: str = "test"

        options = TestOptions()
        assert isinstance(options, Options)
        assert options.value == "test"

    def test_post_init_override(self):
        """Test that Options works with custom __post_init__."""

        @dataclass
        class CustomOptions(Options):
            value: int = 0

            def __post_init__(self):
                self.value = 42

        options = CustomOptions()
        assert options.value == 42

    def test_options_inheritance_chain(self):
        """Test Options inheritance through multiple levels."""

        @dataclass
        class Level1Options(Options):
            level1_field: str = "level1"

        @dataclass
        class Level2Options(Level1Options):
            level2_field: str = "level2"

        @dataclass
        class Level3Options(Level2Options):
            level3_field: str = "level3"

        options = Level3Options()
        result = options.asdict()

        assert result["level1Field"] == "level1"
        assert result["level2Field"] == "level2"
        assert result["level3Field"] == "level3"


class TestDataclassFieldsIntegration:
    """Test integration with dataclass fields."""

    def test_options_with_dataclass_fields(self):
        """Test Options with standard dataclass fields."""

        @dataclass
        class StandardOptions(Options):
            required_field: str
            optional_field: str = "default"
            computed_field: str = None

            def __post_init__(self):
                self.computed_field = f"computed_{self.required_field}"

        options = StandardOptions(required_field="test")
        result = options.asdict()

        assert result["requiredField"] == "test"
        assert result["optionalField"] == "default"
        assert result["computedField"] == "computed_test"

    def test_options_with_class_variables(self):
        """Test that class variables are not serialized."""

        @dataclass
        class OptionsWithClassVar(Options):
            instance_field: str = "instance"
            # Class variables should not be in asdict()

        options = OptionsWithClassVar()
        result = options.asdict()

        assert "instanceField" in result
        assert result["instanceField"] == "instance"


# =============================================================================
# Background Options Integration
# =============================================================================


class TestBackgroundOptionsFlattening:
    """Test background_options flattening integration."""

    def test_options_with_background_options_integration(self):
        """Test integration with background_options flattening."""

        @dataclass
        class BackgroundOptions(Options):
            color: str = "#ffffff"
            style: str = "solid"

        @dataclass
        class LayoutOptions(Options):
            background_options: BackgroundOptions = None
            text_color: str = "#000000"

        background_opts = BackgroundOptions(color="#f0f0f0", style="gradient")
        layout_opts = LayoutOptions(background_options=background_opts)
        result = layout_opts.asdict()

        # background_options should be flattened
        assert "backgroundOptions" not in result
        assert result["color"] == "#f0f0f0"
        assert result["style"] == "gradient"
        assert result["textColor"] == "#000000"

    def test_options_with_multiple_options_fields(self):
        """Test handling of multiple _options fields."""

        @dataclass
        class ConfigOptions(Options):
            setting: str = "default"
            enabled: bool = True

        @dataclass
        class ComplexOptions(Options):
            background_options: ConfigOptions = None
            layout_options: ConfigOptions = None
            other_field: str = "test"

        background_opts = ConfigOptions(setting="background", enabled=False)
        layout_opts = ConfigOptions(setting="layout", enabled=True)
        complex_opts = ComplexOptions(
            background_options=background_opts,
            layout_options=layout_opts,
        )
        result = complex_opts.asdict()

        # background_options should be flattened
        assert "backgroundOptions" not in result
        assert result["setting"] == "background"
        assert result["enabled"] is False

        # layout_options should be nested
        assert "layoutOptions" in result
        assert result["layoutOptions"]["setting"] == "layout"
        assert result["layoutOptions"]["enabled"] is True

        # other_field should be present
        assert result["otherField"] == "test"


# =============================================================================
# Complex Integration Scenarios
# =============================================================================


class TestComplexIntegrationScenarios:
    """Test complex real-world integration scenarios."""

    def test_real_world_nested_configuration(self):
        """Test real-world nested configuration scenario."""

        @dataclass
        class PriceScaleOptions(Options):
            visible: bool = True
            auto_scale: bool = True

        @dataclass
        class TimeScaleOptions(Options):
            visible: bool = True
            time_visible: bool = True

        @dataclass
        class ChartConfiguration(Options):
            height: int = 400
            width: int = 800
            price_scale: PriceScaleOptions | None = None
            time_scale: TimeScaleOptions | None = None

        config = ChartConfiguration(
            height=600,
            price_scale=PriceScaleOptions(visible=False),
            time_scale=TimeScaleOptions(time_visible=False),
        )

        result = config.asdict()

        assert result["height"] == 600
        assert result["priceScale"]["visible"] is False
        assert result["timeScale"]["timeVisible"] is False

    def test_options_update_and_serialize_workflow(self):
        """Test typical workflow of updating options and serializing."""

        @dataclass
        class ChartOptions(Options):
            height: int = 400
            width: int = 800
            auto_size: bool = False
            nested: NestedOptions | None = None

        # Create options
        options = ChartOptions()

        # Update via method
        options.update(
            {"height": 600, "autoSize": True, "nested": {"color": "#00ff00", "width": 5}}
        )

        # Serialize
        result = options.asdict()

        assert result["height"] == 600
        assert result["autoSize"] is True
        assert result["nested"]["color"] == "#00ff00"
        assert result["nested"]["width"] == 5

    def test_chained_updates_and_serialization(self):
        """Test method chaining with updates and serialization."""

        @dataclass
        class StyleOptions(Options):
            color: str = "#ff0000"
            font_size: int = 12

        # Create and update through chaining
        options = StyleOptions().update({"color": "#00ff00"}).update({"fontSize": 14})

        result = options.asdict()

        assert result["color"] == "#00ff00"
        assert result["fontSize"] == 14


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
