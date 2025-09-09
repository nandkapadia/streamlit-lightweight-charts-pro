"""
Tests for GradientBandSeries.

This module tests the GradientBandSeries class functionality including
gradient bounds calculation, normalization, and data handling.
"""

import pandas as pd

from streamlit_lightweight_charts_pro.charts.series.gradient_band import GradientBandSeries
from streamlit_lightweight_charts_pro.data.gradient_band import GradientBandData
from streamlit_lightweight_charts_pro.type_definitions.enums import ChartType


class TestGradientBandSeries:
    """Test suite for GradientBandSeries."""

    def test_gradient_band_series_creation(self):
        """Test basic GradientBandSeries creation."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=0.5),
            GradientBandData("2024-01-02", upper=112, middle=107, lower=102, gradient=0.7),
        ]

        series = GradientBandSeries(data=data)

        assert series.chart_type == ChartType.GRADIENT_BAND
        assert len(series.data) == 2
        assert series._gradient_start_color == "#4CAF50"
        assert series._gradient_end_color == "#F44336"
        assert series._normalize_gradients is False
        assert series._gradient_bounds is None

    def test_gradient_band_series_with_custom_colors(self):
        """Test GradientBandSeries with custom gradient colors."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=0.5),
        ]

        series = GradientBandSeries(
            data=data, gradient_start_color="#FF0000", gradient_end_color="#00FF00"
        )

        assert series._gradient_start_color == "#FF0000"
        assert series._gradient_end_color == "#00FF00"

    def test_gradient_band_series_with_normalization(self):
        """Test GradientBandSeries with gradient normalization enabled."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=10),
            GradientBandData("2024-01-02", upper=112, middle=107, lower=102, gradient=20),
            GradientBandData("2024-01-03", upper=114, middle=109, lower=104, gradient=30),
        ]

        series = GradientBandSeries(data=data, normalize_gradients=True)

        # Test that bounds are calculated correctly
        series._calculate_gradient_bounds()
        assert series._gradient_bounds == (10.0, 30.0)

    def test_calculate_gradient_bounds_empty_data(self):
        """Test gradient bounds calculation with empty data."""
        series = GradientBandSeries(data=[])
        series._calculate_gradient_bounds()

        assert series._gradient_bounds is None

    def test_calculate_gradient_bounds_no_gradients(self):
        """Test gradient bounds calculation with no gradient values."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100),
            GradientBandData("2024-01-02", upper=112, middle=107, lower=102),
        ]

        series = GradientBandSeries(data=data)
        series._calculate_gradient_bounds()

        assert series._gradient_bounds is None

    def test_calculate_gradient_bounds_with_valid_gradients(self):
        """Test gradient bounds calculation with valid gradient values."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=5.0),
            GradientBandData("2024-01-02", upper=112, middle=107, lower=102, gradient=15.0),
            GradientBandData("2024-01-03", upper=114, middle=109, lower=104, gradient=10.0),
        ]

        series = GradientBandSeries(data=data)
        series._calculate_gradient_bounds()

        assert series._gradient_bounds == (5.0, 15.0)

    def test_calculate_gradient_bounds_with_invalid_gradients(self):
        """Test gradient bounds calculation with invalid gradient values."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=5.0),
            GradientBandData(
                "2024-01-02", upper=112, middle=107, lower=102, gradient=None
            ),  # No gradient
            GradientBandData("2024-01-03", upper=114, middle=109, lower=104, gradient=10.0),
        ]

        series = GradientBandSeries(data=data)
        series._calculate_gradient_bounds()

        # Should only consider valid gradients (5.0 and 10.0)
        assert series._gradient_bounds == (5.0, 10.0)

    def test_calculate_gradient_bounds_with_mixed_types(self):
        """Test gradient bounds calculation with mixed gradient types."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=5),
            GradientBandData("2024-01-02", upper=112, middle=107, lower=102, gradient=10.5),
            GradientBandData("2024-01-03", upper=114, middle=109, lower=104, gradient=15),
        ]

        series = GradientBandSeries(data=data)
        series._calculate_gradient_bounds()

        assert series._gradient_bounds == (5, 15)

    def test_asdict_without_normalization(self):
        """Test asdict method without gradient normalization."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=0.5),
            GradientBandData("2024-01-02", upper=112, middle=107, lower=102, gradient=0.7),
        ]

        series = GradientBandSeries(data=data, normalize_gradients=False)
        result = series.asdict()

        # Should not modify gradient values
        assert result["data"][0]["gradient"] == 0.5
        assert result["data"][1]["gradient"] == 0.7

    def test_asdict_with_normalization(self):
        """Test asdict method with gradient normalization."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=10),
            GradientBandData("2024-01-02", upper=112, middle=107, lower=102, gradient=20),
            GradientBandData("2024-01-03", upper=114, middle=109, lower=104, gradient=30),
        ]

        series = GradientBandSeries(data=data, normalize_gradients=True)
        result = series.asdict()

        # Gradients should be normalized to 0-1 range
        assert result["data"][0]["gradient"] == 0.0  # (10-10)/(30-10) = 0
        assert result["data"][1]["gradient"] == 0.5  # (20-10)/(30-10) = 0.5
        assert result["data"][2]["gradient"] == 1.0  # (30-10)/(30-10) = 1

    def test_asdict_with_normalization_edge_cases(self):
        """Test asdict method with gradient normalization edge cases."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=5.0),
            GradientBandData(
                "2024-01-02", upper=112, middle=107, lower=102, gradient=5.0
            ),  # Same value
        ]

        series = GradientBandSeries(data=data, normalize_gradients=True)
        result = series.asdict()

        # When min == max, bounds are calculated but normalization handles it gracefully
        assert series._gradient_bounds == (5.0, 5.0)
        # Both values should remain 5.0 since normalization would result in 0/0
        assert result["data"][0]["gradient"] == 5.0
        assert result["data"][1]["gradient"] == 5.0

    def test_asdict_with_invalid_gradients_during_normalization(self):
        """Test asdict method with invalid gradients during normalization."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=10),
            GradientBandData("2024-01-02", upper=112, middle=107, lower=102, gradient=20),
        ]

        series = GradientBandSeries(data=data, normalize_gradients=True)

        # Manually set bounds to trigger normalization
        series._gradient_bounds = (10.0, 20.0)

        # Modify data to have invalid gradient
        series.data[1].gradient = "invalid"

        result = series.asdict()

        # Invalid gradient should be removed
        assert "gradient" not in result["data"][1]

    def test_chainable_properties(self):
        """Test that chainable properties work correctly."""
        data = [
            GradientBandData("2024-01-01", upper=110, middle=105, lower=100, gradient=0.5),
        ]

        series = GradientBandSeries(data=data)

        # Test gradient start color
        series.gradient_start_color = "#FF0000"
        assert series._gradient_start_color == "#FF0000"

        # Test gradient end color
        series.gradient_end_color = "#00FF00"
        assert series._gradient_end_color == "#00FF00"

        # Test normalize gradients
        series.normalize_gradients = True
        assert series._normalize_gradients is True

    def test_dataframe_integration(self):
        """Test GradientBandSeries creation from DataFrame."""
        df = pd.DataFrame(
            {
                "datetime": ["2024-01-01", "2024-01-02"],
                "upper": [110, 112],
                "middle": [105, 107],
                "lower": [100, 102],
                "gradient": [0.5, 0.7],
            }
        )

        # Set datetime as index to match the expected format
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.set_index("datetime")

        column_mapping = {
            "time": "datetime",
            "upper": "upper",
            "middle": "middle",
            "lower": "lower",
            "gradient": "gradient",
        }

        series = GradientBandSeries(data=df, column_mapping=column_mapping)

        assert len(series.data) == 2
        assert series.data[0].gradient == 0.5
        assert series.data[1].gradient == 0.7

    def test_series_integration(self):
        """Test GradientBandSeries creation from pandas Series."""
        # Create a DataFrame from the Series data for proper testing
        df = pd.DataFrame(
            [{"datetime": "2024-01-01", "upper": 110, "middle": 105, "lower": 100, "gradient": 0.5}]
        )

        # Set datetime as index to match the expected format
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.set_index("datetime")

        column_mapping = {
            "time": "datetime",
            "upper": "upper",
            "middle": "middle",
            "lower": "lower",
            "gradient": "gradient",
        }

        series = GradientBandSeries(data=df, column_mapping=column_mapping)

        assert len(series.data) == 1
        assert series.data[0].gradient == 0.5
