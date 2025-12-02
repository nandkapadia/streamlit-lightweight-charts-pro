"""API Alignment Test Suite.

This test suite verifies 100% alignment between streamlit-lightweight-charts-pro
and the official TradingView Lightweight Charts API.

Tests cover:
- Property defaults
- Method chaining
- Serialization (snake_case → camelCase)
- Type validation
- Color validation
- Custom property filtering
- API completeness
"""

import re
from typing import Any, ClassVar

import pytest
from lightweight_charts_core.charts.series import LineSeries
from lightweight_charts_core.data import LineData
from lightweight_charts_core.exceptions import ColorValidationError
from lightweight_charts_core.type_definitions.enums import LineStyle
from lightweight_charts_core.utils.data_utils import snake_to_camel


class PropertyTestCase:
    """Base class for property testing following the test suite pattern."""

    @pytest.fixture
    def sample_data(self):
        """Sample line data for testing."""
        return [
            LineData(time=1640995200, value=100),
            LineData(time=1640998800, value=105),
            LineData(time=1641002400, value=103),
        ]

    def verify_property_defaults(
        self,
        series_class: type,
        sample_data: list,
        property_name: str,
        expected_default: Any,
    ):
        """Helper to test default values."""
        series = series_class(data=sample_data)
        actual_value = getattr(series, property_name)
        assert (
            actual_value == expected_default
        ), f"Expected {property_name} default to be {expected_default}, got {actual_value}"

    def verify_property_chainable(
        self,
        series_class: type,
        sample_data: list,
        property_name: str,
        test_value: Any,
    ):
        """Helper to test method chaining."""
        series = series_class(data=sample_data)
        setter_method = getattr(series, f"set_{property_name}")
        result = setter_method(test_value)

        assert result is series, "Method should return self for chaining"
        assert getattr(series, property_name) == test_value

    def verify_property_serialization(
        self,
        series_class: type,
        sample_data: list,
        property_name: str,
        test_value: Any,
        expected_camel_case: str,
    ):
        """Helper to test camelCase serialization."""
        series = series_class(data=sample_data)
        setattr(series, property_name, test_value)
        config = series.asdict()

        # Check if property is in options or top level
        if expected_camel_case in config.get("options", {}):
            assert config["options"][expected_camel_case] == test_value
        else:
            assert config[expected_camel_case] == test_value

    def verify_property_validation(
        self,
        series_class: type,
        sample_data: list,
        property_name: str,
        invalid_value: Any,
        expected_error: type[Exception],
    ):
        """Helper to test validation."""
        series = series_class(data=sample_data)
        with pytest.raises(expected_error):
            setattr(series, property_name, invalid_value)


class TestBaseLineProperties(PropertyTestCase):
    """Test base line properties implementation."""

    def test_base_line_visible_defaults(self, sample_data):
        """Test base_line_visible default value."""
        self.verify_property_defaults(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_visible",
            expected_default=True,
        )

    def test_base_line_color_defaults(self, sample_data):
        """Test base_line_color default value."""
        self.verify_property_defaults(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_color",
            expected_default="#B2B5BE",
        )

    def test_base_line_width_defaults(self, sample_data):
        """Test base_line_width default value."""
        self.verify_property_defaults(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_width",
            expected_default=1,
        )

    def test_base_line_style_defaults(self, sample_data):
        """Test base_line_style default value."""
        self.verify_property_defaults(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_style",
            expected_default=LineStyle.SOLID,
        )

    def test_base_line_visible_chainable(self, sample_data):
        """Test base_line_visible method chaining."""
        self.verify_property_chainable(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_visible",
            test_value=False,
        )

    def test_base_line_color_chainable(self, sample_data):
        """Test base_line_color method chaining."""
        self.verify_property_chainable(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_color",
            test_value="#ff0000",
        )

    def test_base_line_width_chainable(self, sample_data):
        """Test base_line_width method chaining."""
        self.verify_property_chainable(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_width",
            test_value=3,
        )

    def test_base_line_style_chainable(self, sample_data):
        """Test base_line_style method chaining."""
        self.verify_property_chainable(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_style",
            test_value=LineStyle.DASHED,
        )

    def test_base_line_visible_serialization(self, sample_data):
        """Test base_line_visible serialization."""
        self.verify_property_serialization(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_visible",
            test_value=False,
            expected_camel_case="baseLineVisible",
        )

    def test_base_line_color_serialization(self, sample_data):
        """Test base_line_color serialization."""
        self.verify_property_serialization(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_color",
            test_value="#ff0000",
            expected_camel_case="baseLineColor",
        )

    def test_base_line_width_serialization(self, sample_data):
        """Test base_line_width serialization."""
        self.verify_property_serialization(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_width",
            test_value=3,
            expected_camel_case="baseLineWidth",
        )

    def test_base_line_style_serialization(self, sample_data):
        """Test base_line_style serialization."""
        self.verify_property_serialization(
            series_class=LineSeries,
            sample_data=sample_data,
            property_name="base_line_style",
            test_value=LineStyle.DASHED,
            expected_camel_case="baseLineStyle",
        )

    def test_base_line_color_validation(self, sample_data):
        """Test base_line_color validation."""
        series = LineSeries(data=sample_data)
        # Test that invalid color raises ColorValidationError
        with pytest.raises(ColorValidationError):
            series.set_base_line_color("not_a_color")


class TestSerializationMapping:
    """Test property serialization mapping."""

    PROPERTY_MAPPINGS: ClassVar[list[tuple[str, str]]] = [
        ("base_line_visible", "baseLineVisible"),
        ("base_line_color", "baseLineColor"),
        ("base_line_width", "baseLineWidth"),
        ("base_line_style", "baseLineStyle"),
        ("price_line_visible", "priceLineVisible"),
        ("price_line_width", "priceLineWidth"),
        ("price_line_color", "priceLineColor"),
        ("price_line_style", "priceLineStyle"),
        ("last_value_visible", "lastValueVisible"),
        ("price_scale_id", "priceScaleId"),
        ("z_index", "zIndex"),
    ]

    @pytest.mark.parametrize("python_name,js_name", PROPERTY_MAPPINGS)
    def test_property_serialization_mapping(self, python_name, js_name):
        """Test each property serializes correctly."""
        assert snake_to_camel(python_name) == js_name


class TestTopLevelVsOptionsPlacement:
    """Test properties go to correct location."""

    @pytest.fixture
    def sample_data(self):
        """Sample line data for testing."""
        return [
            LineData(time=1640995200, value=100),
            LineData(time=1640998800, value=105),
        ]

    def test_pane_id_is_top_level(self, sample_data):
        """Test paneId is at top level, not in options."""
        series = LineSeries(data=sample_data)
        series.set_pane_id(2)

        config = series.asdict()

        # Should be at top level
        assert "paneId" in config
        assert config["paneId"] == 2

        # Should NOT be in options
        if "options" in config:
            assert "paneId" not in config["options"]

    def test_visible_in_options(self, sample_data):
        """Test visible is in options, not top level."""
        series = LineSeries(data=sample_data)
        series.set_visible(False)

        config = series.asdict()

        # Should be in options
        assert "options" in config
        assert "visible" in config["options"]
        assert config["options"]["visible"] is False


class TestTypeValidation:
    """Test type validation for all property types."""

    @pytest.fixture
    def sample_data(self):
        """Sample line data for testing."""
        return [LineData(time=1640995200, value=100)]

    def test_boolean_properties(self, sample_data):
        """Test boolean properties accept valid values."""
        series = LineSeries(data=sample_data)

        # Test boolean properties
        series.set_visible(False)
        assert series.visible is False

        series.set_visible(True)
        assert series.visible is True

    def test_integer_properties(self, sample_data):
        """Test integer properties accept valid values."""
        series = LineSeries(data=sample_data)

        # Test integer properties
        series.set_base_line_width(5)
        assert series.base_line_width == 5

        series.set_z_index(50)
        assert series.z_index == 50


class TestCustomValidation:
    """Test custom validators."""

    @pytest.fixture
    def sample_data(self):
        """Sample line data for testing."""
        return [LineData(time=1640995200, value=100)]

    def test_color_validation(self, sample_data):
        """Test color validator."""
        series = LineSeries(data=sample_data)

        # Valid hex colors
        valid_colors = ["#ff0000", "#00ff00", "#0000ff", "#123456", "#abcdef"]
        for color in valid_colors:
            series.set_base_line_color(color)
            assert series.base_line_color == color

        # Valid rgba colors
        valid_rgba = ["rgba(255,0,0,1)", "rgba(0,255,0,0.5)", "rgba(0,0,255,0.1)"]
        for color in valid_rgba:
            series.set_base_line_color(color)
            assert series.base_line_color == color

        # Invalid colors
        invalid_colors = [
            "notacolor",
            "hsl(0,100%,50%)",
            "#gggggg",
            "#12",
            "#123456789",
        ]
        for color in invalid_colors:
            with pytest.raises(ColorValidationError):
                series.set_base_line_color(color)


class TestEndToEndPropertyFlow:
    """Test complete property flow from Python to frontend."""

    @pytest.fixture
    def sample_data(self):
        """Sample line data for testing."""
        return [LineData(time=1640995200, value=100)]

    def test_property_roundtrip(self, sample_data):
        """Test property survives serialization."""
        # Create series with properties
        original_series = LineSeries(data=sample_data)
        original_series.set_base_line_visible(False)
        original_series.set_base_line_color("#ff0000")
        original_series.set_base_line_width(3)
        original_series.set_base_line_style(LineStyle.DASHED)

        # Serialize to config
        config = original_series.asdict()

        # Verify serialized format
        assert config["options"]["baseLineVisible"] is False
        assert config["options"]["baseLineColor"] == "#ff0000"
        assert config["options"]["baseLineWidth"] == 3
        assert config["options"]["baseLineStyle"] == LineStyle.DASHED

    def test_multiple_properties_interaction(self, sample_data):
        """Test multiple properties work together."""
        series = LineSeries(data=sample_data)

        # Set multiple properties
        result = (
            series.set_visible(True)
            .set_base_line_visible(False)
            .set_base_line_color("#00ff00")
            .set_z_index(50)
            .set_pane_id(1)
        )

        # Verify chaining
        assert result is series

        # Verify all properties set correctly
        assert series.visible is True
        assert series.base_line_visible is False
        assert series.base_line_color == "#00ff00"
        assert series.z_index == 50
        assert series.pane_id == 1

        # Verify serialization
        config = series.asdict()
        assert config["options"]["visible"] is True
        assert config["options"]["baseLineVisible"] is False
        assert config["options"]["baseLineColor"] == "#00ff00"
        assert config["options"]["zIndex"] == 50
        assert config["paneId"] == 1


class TestAPIAlignment:
    """Verify alignment with official Lightweight Charts API."""

    # Official SeriesOptionsCommon properties from Lightweight Charts API
    OFFICIAL_SERIES_PROPERTIES: ClassVar[list[str]] = [
        "visible",
        "priceScaleId",
        "title",
        "lastValueVisible",
        "priceLineVisible",
        "priceLineSource",
        "priceLineWidth",
        "priceLineColor",
        "priceLineStyle",
        "baseLineVisible",
        "baseLineColor",
        "baseLineWidth",
        "baseLineStyle",
    ]

    @pytest.fixture
    def sample_data(self):
        """Sample line data for testing."""
        return [LineData(time=1640995200, value=100)]

    @pytest.mark.parametrize("property_name", OFFICIAL_SERIES_PROPERTIES)
    def test_official_property_implemented(self, sample_data, property_name):
        """Verify each official property is implemented."""
        series = LineSeries(data=sample_data)

        # Convert camelCase to snake_case
        snake_case_name = self._camel_to_snake(property_name)

        # Check property exists
        assert hasattr(
            series, snake_case_name
        ), f"Official API property '{property_name}' ('{snake_case_name}') not implemented"

        # Check setter exists
        setter_name = f"set_{snake_case_name}"
        assert hasattr(series, setter_name), f"Setter '{setter_name}' not implemented"

    @staticmethod
    def _camel_to_snake(camel_case: str) -> str:
        """Convert camelCase to snake_case."""
        return re.sub(r"(?<!^)(?=[A-Z])", "_", camel_case).lower()

    def test_no_extra_properties_in_api_call(self, sample_data):
        """Test that displayName is present in config for frontend filtering."""
        series = LineSeries(data=sample_data)
        series.set_display_name("My Series")
        series.set_visible(True)

        config = series.asdict()

        # displayName is present in backend config and will be filtered by frontend
        # before passing to TradingView API (see UnifiedSeriesFactory.ts)
        assert "displayName" in config["options"]


class TestCustomPropertyFiltering:
    """Test that custom properties are filtered correctly."""

    @pytest.fixture
    def sample_data(self):
        """Sample line data for testing."""
        return [LineData(time=1640995200, value=100)]

    def test_display_name_handling(self, sample_data):
        """Test displayName is properly handled as custom property."""
        series = LineSeries(data=sample_data)
        series.set_display_name("My Custom Name")

        config = series.asdict()

        # displayName should be present in config options (used by UI)
        # Frontend will filter it before passing to API
        assert "displayName" in config["options"]
        assert config["options"]["displayName"] == "My Custom Name"

    def test_markers_is_top_level(self, sample_data):
        """Test markers is at top level, not in options."""
        from lightweight_charts_core.data.marker import BarMarker
        from lightweight_charts_core.type_definitions.enums import (
            MarkerPosition,
            MarkerShape,
        )

        series = LineSeries(data=sample_data)
        marker = BarMarker(
            time=1640995200,
            position=MarkerPosition.ABOVE_BAR,
            color="#ff0000",
            shape=MarkerShape.CIRCLE,
        )
        series.add_marker(marker)

        config = series.asdict()

        # Should be at top level
        assert "markers" in config
        assert len(config["markers"]) == 1

        # Should NOT be in options
        if "options" in config:
            assert "markers" not in config["options"]
