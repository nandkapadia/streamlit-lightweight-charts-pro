"""Unit tests for RibbonData per-point styling.

This module tests the RibbonData class with per-point styling functionality.
"""

import pytest

from streamlit_lightweight_charts_pro.data.ribbon import RibbonData
from streamlit_lightweight_charts_pro.data.styles import FillStyle, LineStyle, PerPointStyles


@pytest.fixture
def valid_time() -> int:
    return 1704067200  # 2024-01-01 00:00:00 UTC


class TestRibbonDataPerPointStyling:
    """Test cases for RibbonData per-point styling."""

    def test_ribbon_data_without_styles(self, valid_time):
        """Test RibbonData without per-point styling."""
        data = RibbonData(time=valid_time, upper=110.0, lower=100.0)
        assert data.styles is None

        serialized = data.asdict()
        assert "styles" not in serialized

    def test_ribbon_data_with_upper_line_style(self, valid_time):
        """Test RibbonData with upper line styling."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(upper_line=LineStyle(color="#ff0000", width=3)),
        )

        assert data.styles is not None
        assert data.styles.upper_line is not None
        assert data.styles.upper_line.color == "#ff0000"
        assert data.styles.upper_line.width == 3

    def test_ribbon_data_with_lower_line_style(self, valid_time):
        """Test RibbonData with lower line styling."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(lower_line=LineStyle(color="#0000ff", width=2, style=1)),
        )

        assert data.styles is not None
        assert data.styles.lower_line is not None
        assert data.styles.lower_line.color == "#0000ff"
        assert data.styles.lower_line.width == 2
        assert data.styles.lower_line.style == 1

    def test_ribbon_data_with_fill_style(self, valid_time):
        """Test RibbonData with fill styling."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(fill=FillStyle(color="rgba(128, 128, 128, 0.3)", visible=True)),
        )

        assert data.styles is not None
        assert data.styles.fill is not None
        assert data.styles.fill.color == "rgba(128, 128, 128, 0.3)"
        assert data.styles.fill.visible is True

    def test_ribbon_data_with_complete_styles(self, valid_time):
        """Test RibbonData with complete per-point styling."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(
                upper_line=LineStyle(color="#ff0000", width=3, style=2),
                lower_line=LineStyle(color="#0000ff", width=2, style=1),
                fill=FillStyle(color="rgba(128, 128, 128, 0.3)", visible=True),
            ),
        )

        assert data.styles.upper_line.color == "#ff0000"
        assert data.styles.lower_line.color == "#0000ff"
        assert data.styles.fill.color == "rgba(128, 128, 128, 0.3)"

    def test_ribbon_data_styles_serialization(self, valid_time):
        """Test RibbonData styles serialization to camelCase JSON."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(upper_line=LineStyle(color="#ff0000", width=3)),
        )

        serialized = data.asdict()

        # Check styles field exists
        assert "styles" in serialized

        # Check camelCase conversion
        assert "upperLine" in serialized["styles"]
        assert serialized["styles"]["upperLine"]["color"] == "#ff0000"
        assert serialized["styles"]["upperLine"]["width"] == 3

        # Check snake_case not present
        assert "upper_line" not in serialized["styles"]

    def test_ribbon_data_styles_serialization_complete(self, valid_time):
        """Test complete RibbonData styles serialization."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(
                upper_line=LineStyle(color="#ff0000", width=3),
                lower_line=LineStyle(color="#0000ff", width=2),
                fill=FillStyle(color="rgba(128, 128, 128, 0.3)", visible=True),
            ),
        )

        serialized = data.asdict()

        # Check all style fields present
        assert "upperLine" in serialized["styles"]
        assert "lowerLine" in serialized["styles"]
        assert "fill" in serialized["styles"]

        # Check band-specific fields not present
        assert "middleLine" not in serialized["styles"]
        assert "upperFill" not in serialized["styles"]
        assert "lowerFill" not in serialized["styles"]

    def test_ribbon_data_styles_only_visible_false(self, valid_time):
        """Test RibbonData with only visible=False styling."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(fill=FillStyle(visible=False)),
        )

        serialized = data.asdict()
        assert serialized["styles"]["fill"] == {"visible": False}

    def test_ribbon_data_styles_mixed_overrides(self, valid_time):
        """Test RibbonData with mixed style overrides."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(
                upper_line=LineStyle(color="#ff0000"),  # Only color
                lower_line=LineStyle(width=2),  # Only width
            ),
        )

        serialized = data.asdict()

        # Check partial overrides
        assert serialized["styles"]["upperLine"] == {"color": "#ff0000"}
        assert serialized["styles"]["lowerLine"] == {"width": 2}

        # Check missing fields not in serialization
        assert "fill" not in serialized["styles"]

    def test_ribbon_data_with_legacy_fill_and_styles(self, valid_time):
        """Test RibbonData with both legacy fill and new styles."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            fill="rgba(255, 0, 0, 0.1)",  # Legacy fill field
            styles=PerPointStyles(
                upper_line=LineStyle(color="#ff0000", width=3),
                fill=FillStyle(color="rgba(128, 128, 128, 0.3)", visible=True),
            ),
        )

        serialized = data.asdict()

        # Both fields should be present
        assert "fill" in serialized  # Legacy field at top level
        assert "styles" in serialized
        assert "fill" in serialized["styles"]  # New per-point override

    def test_ribbon_data_styles_dotted_line(self, valid_time):
        """Test RibbonData with dotted line style."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(
                upper_line=LineStyle(color="#ff0000", width=2, style=1)  # Dotted
            ),
        )

        serialized = data.asdict()
        assert serialized["styles"]["upperLine"]["style"] == 1

    def test_ribbon_data_styles_dashed_line(self, valid_time):
        """Test RibbonData with dashed line style."""
        data = RibbonData(
            time=valid_time,
            upper=110.0,
            lower=100.0,
            styles=PerPointStyles(
                lower_line=LineStyle(color="#0000ff", width=3, style=2)  # Dashed
            ),
        )

        serialized = data.asdict()
        assert serialized["styles"]["lowerLine"]["style"] == 2

    def test_ribbon_data_series_with_mixed_styling(self, valid_time):
        """Test a series of RibbonData points with mixed styling."""
        data_series = [
            # Point 1: No custom styling
            RibbonData(time=valid_time, upper=110.0, lower=100.0),
            # Point 2: Custom upper line only
            RibbonData(
                time=valid_time + 86400,
                upper=112.0,
                lower=102.0,
                styles=PerPointStyles(upper_line=LineStyle(color="#ff0000", width=3)),
            ),
            # Point 3: Custom fill only
            RibbonData(
                time=valid_time + 172800,
                upper=115.0,
                lower=105.0,
                styles=PerPointStyles(fill=FillStyle(color="rgba(0, 255, 0, 0.2)")),
            ),
            # Point 4: Complete custom styling
            RibbonData(
                time=valid_time + 259200,
                upper=118.0,
                lower=108.0,
                styles=PerPointStyles(
                    upper_line=LineStyle(color="#ff00ff", width=2),
                    lower_line=LineStyle(color="#00ffff", width=1),
                    fill=FillStyle(color="rgba(128, 0, 128, 0.4)", visible=True),
                ),
            ),
        ]

        # Serialize all points
        serialized_series = [data.asdict() for data in data_series]

        # Point 1 should not have styles
        assert "styles" not in serialized_series[0]

        # Point 2 should have upperLine only
        assert "upperLine" in serialized_series[1]["styles"]
        assert "lowerLine" not in serialized_series[1]["styles"]
        assert "fill" not in serialized_series[1]["styles"]

        # Point 3 should have fill only
        assert "fill" in serialized_series[2]["styles"]
        assert "upperLine" not in serialized_series[2]["styles"]

        # Point 4 should have all fields
        assert "upperLine" in serialized_series[3]["styles"]
        assert "lowerLine" in serialized_series[3]["styles"]
        assert "fill" in serialized_series[3]["styles"]
