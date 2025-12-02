"""Unit tests for RibbonData per-point color properties.

This module tests the RibbonData class with per-point color override functionality.
"""

import pytest
from lightweight_charts_core.data.ribbon import RibbonData
from lightweight_charts_core.exceptions import ColorValidationError


@pytest.fixture
def valid_time() -> int:
    return 1704067200  # 2024-01-01 00:00:00 UTC


class TestRibbonDataPerPointColors:
    """Test cases for RibbonData per-point color properties."""

    def test_ribbon_data_without_color_overrides(self, valid_time):
        """Test RibbonData without per-point color overrides."""
        data = RibbonData(time=valid_time, upper=110.0, lower=100.0)
        assert data.upper_line_color is None
        assert data.lower_line_color is None
        assert data.fill is None

        serialized = data.asdict()
        assert "upperLineColor" not in serialized
        assert "lowerLineColor" not in serialized
        assert "fill" not in serialized

    def test_ribbon_data_with_upper_line_color(self, valid_time):
        """Test RibbonData with upper line color override."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="#ff0000",
        )

        assert data.upper_line_color == "#ff0000"
        assert data.lower_line_color is None
        assert data.fill is None

        serialized = data.asdict()
        assert serialized["upperLineColor"] == "#ff0000"
        assert "lowerLineColor" not in serialized
        assert "fill" not in serialized

    def test_ribbon_data_with_lower_line_color(self, valid_time):
        """Test RibbonData with lower line color override."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            lower_line_color="#0000ff",
        )

        assert data.lower_line_color == "#0000ff"
        assert data.upper_line_color is None
        assert data.fill is None

        serialized = data.asdict()
        assert serialized["lowerLineColor"] == "#0000ff"
        assert "upperLineColor" not in serialized
        assert "fill" not in serialized

    def test_ribbon_data_with_fill_color(self, valid_time):
        """Test RibbonData with fill color override."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            fill="rgba(128, 128, 128, 0.3)",
        )

        assert data.fill == "rgba(128, 128, 128, 0.3)"
        assert data.upper_line_color is None
        assert data.lower_line_color is None

        serialized = data.asdict()
        assert serialized["fill"] == "rgba(128, 128, 128, 0.3)"
        assert "upperLineColor" not in serialized
        assert "lowerLineColor" not in serialized

    def test_ribbon_data_with_all_color_overrides(self, valid_time):
        """Test RibbonData with all per-point color overrides."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="#ff0000",
            lower_line_color="#0000ff",
            fill="rgba(128, 128, 128, 0.3)",
        )

        assert data.upper_line_color == "#ff0000"
        assert data.lower_line_color == "#0000ff"
        assert data.fill == "rgba(128, 128, 128, 0.3)"

        serialized = data.asdict()
        assert serialized["upperLineColor"] == "#ff0000"
        assert serialized["lowerLineColor"] == "#0000ff"
        assert serialized["fill"] == "rgba(128, 128, 128, 0.3)"

    def test_ribbon_data_color_serialization(self, valid_time):
        """Test RibbonData color serialization to camelCase JSON."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="#ff0000",
        )

        serialized = data.asdict()

        # Check camelCase conversion
        assert "upperLineColor" in serialized
        assert serialized["upperLineColor"] == "#ff0000"

        # Check snake_case not present
        assert "upper_line_color" not in serialized

    def test_ribbon_data_complete_serialization(self, valid_time):
        """Test complete RibbonData color serialization."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="#ff0000",
            lower_line_color="#0000ff",
            fill="rgba(128, 128, 128, 0.3)",
        )

        serialized = data.asdict()

        # Check all color fields present in camelCase
        assert "upperLineColor" in serialized
        assert "lowerLineColor" in serialized
        assert "fill" in serialized

        # Check band-specific fields not present
        assert "middleLineColor" not in serialized
        assert "upperFillColor" not in serialized
        assert "lowerFillColor" not in serialized

    def test_ribbon_data_valid_hex_colors(self, valid_time):
        """Test RibbonData with valid hex colors."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="#2196F3",
            lower_line_color="#4CAF50",
        )

        assert data.upper_line_color == "#2196F3"
        assert data.lower_line_color == "#4CAF50"

    def test_ribbon_data_valid_rgba_colors(self, valid_time):
        """Test RibbonData with valid rgba colors."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="rgba(33, 150, 243, 0.5)",
            lower_line_color="rgba(76, 175, 80, 1.0)",
            fill="rgba(128, 128, 128, 0.2)",
        )

        assert data.upper_line_color == "rgba(33, 150, 243, 0.5)"
        assert data.lower_line_color == "rgba(76, 175, 80, 1.0)"
        assert data.fill == "rgba(128, 128, 128, 0.2)"

    def test_ribbon_data_invalid_upper_line_color(self, valid_time):
        """Test RibbonData with invalid upper line color raises error."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError):
            RibbonData(
                time=valid_time,
                upper=110.0,
                lower=100.0,
                upper_line_color="invalid-color",
            )

    def test_ribbon_data_invalid_lower_line_color(self, valid_time):
        """Test RibbonData with invalid lower line color raises error."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError):
            RibbonData(
                time=valid_time,
                upper=110.0,
                lower=100.0,
                lower_line_color="not-a-color",
            )

    def test_ribbon_data_invalid_fill_color(self, valid_time):
        """Test RibbonData with invalid fill color raises error."""
        # Centralized validation raises ColorValidationError (more specific)
        with pytest.raises(ColorValidationError):
            RibbonData(
                time=valid_time,
                upper=110.0,
                lower=100.0,
                fill="bad-color-format",
            )

    def test_ribbon_data_series_with_mixed_colors(self, valid_time):
        """Test a series of RibbonData points with mixed color overrides."""
        data_series = [
            # Point 1: No custom colors
            RibbonData(time=valid_time, upper=110.0, lower=100.0),
            # Point 2: Custom upper line color only
            RibbonData(
                time=valid_time + 86400,
                upper=112.0,
                lower=102.0,
                upper_line_color="#ff0000",
            ),
            # Point 3: Custom fill only
            RibbonData(
                time=valid_time + 172800,
                upper=115.0,
                lower=105.0,
                fill="rgba(0, 255, 0, 0.2)",
            ),
            # Point 4: Complete custom colors
            RibbonData(
                time=valid_time + 259200,
                upper=118.0,
                lower=108.0,
                upper_line_color="#ff00ff",
                lower_line_color="#00ffff",
                fill="rgba(128, 0, 128, 0.4)",
            ),
        ]

        # Serialize all points
        serialized_series = [data.asdict() for data in data_series]

        # Point 1 should not have color overrides
        assert "upperLineColor" not in serialized_series[0]
        assert "lowerLineColor" not in serialized_series[0]
        assert "fill" not in serialized_series[0]

        # Point 2 should have upperLineColor only
        assert "upperLineColor" in serialized_series[1]
        assert "lowerLineColor" not in serialized_series[1]
        assert "fill" not in serialized_series[1]

        # Point 3 should have fill only
        assert "fill" in serialized_series[2]
        assert "upperLineColor" not in serialized_series[2]
        assert "lowerLineColor" not in serialized_series[2]

        # Point 4 should have all fields
        assert "upperLineColor" in serialized_series[3]
        assert "lowerLineColor" in serialized_series[3]
        assert "fill" in serialized_series[3]

    def test_ribbon_data_partial_color_overrides(self, valid_time):
        """Test RibbonData with partial color overrides."""
        # Only upper line color
        data1 = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="#ff0000",
        )
        serialized1 = data1.asdict()
        assert serialized1["upperLineColor"] == "#ff0000"
        assert "lowerLineColor" not in serialized1
        assert "fill" not in serialized1

        # Only lower line color
        data2 = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            lower_line_color="#00ff00",
        )
        serialized2 = data2.asdict()
        assert serialized2["lowerLineColor"] == "#00ff00"
        assert "upperLineColor" not in serialized2
        assert "fill" not in serialized2

    def test_ribbon_data_color_consistency(self, valid_time):
        """Test that colors are preserved through serialization."""
        original_data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="#ff0000",
            lower_line_color="#0000ff",
            fill="rgba(128, 128, 128, 0.3)",
        )

        serialized = original_data.asdict()

        # Verify all colors match
        assert serialized["upperLineColor"] == "#ff0000"
        assert serialized["lowerLineColor"] == "#0000ff"
        assert serialized["fill"] == "rgba(128, 128, 128, 0.3)"

    def test_ribbon_data_empty_string_colors(self, valid_time):
        """Test RibbonData with empty string colors (should be allowed)."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            upper_line_color="",
            lower_line_color="",
            fill="",
        )

        # Empty color strings are converted to None by centralized validation
        assert data.upper_line_color is None
        assert data.lower_line_color is None
        assert data.fill is None
